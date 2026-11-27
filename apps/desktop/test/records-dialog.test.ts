// The dialog of the records place in the built app. It starts the app once,
// in the background, on a temporary repository with no place for records,
// registers the repository through the form, and drives the dialog through
// Electron's debugging port: what it says before anything is written, the
// commit its button makes, and what it shows of a repository that holds
// every part, with how an administrator makes the seal check required in
// both. It then registers a second temporary repository whose committed
// workflow fetches the check of an older Owlery, presses the button its row
// holds, and makes the move the dialog shows. Each commit lands in its
// temporary repository alone.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MARKER, moveSubject, SUBJECT, workflowText } from "../src/daemon/records-place";
import { BuiltApp, buildApp } from "./built-app";
import { git, temporaryRepository } from "./repositories";

describe("the dialog of the records place in the built app", { timeout: 60_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;
  let pinned: ReturnType<typeof temporaryRepository> | undefined;

  const WORKFLOW = ".github/workflows/owlery-seal.yml";
  /** What the dialog says of the seal check Owlery's workflow posts, and how an administrator makes it required. */
  const REQUIRED = "The workflow posts its verdict as the check `seal` on each pull request's head commit. To hold a pull request until it is sealed, an administrator of the repository requires `seal` on GitHub, in the repository's rules for the base branch, under the rule that requires status checks to pass. A pull request from a fork gets no `seal` check, so a required one holds it until an administrator lets it through. Owlery changes no setting of the repository on GitHub.";
  const value = <T>(expression: string): Promise<T> => app.evaluate<T>(expression);
  const text = (id: string): Promise<string> => value(`document.getElementById(${JSON.stringify(id)}).textContent`);
  const dialogOpen = (id: string): Promise<void> => app.until(`document.getElementById(${JSON.stringify(id)}).open`, `the dialog ${id}`);
  const dialogClosed = (id: string): Promise<void> => app.until(`!document.getElementById(${JSON.stringify(id)}).open`, `the dialog ${id} closed`);
  const status = (): string => git(made.repo, "status", "--porcelain=v1", "--untracked-files=all");

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    // The repository's own check, which the daemon reads as the command it proposes.
    writeFileSync(join(made.repo, "package.json"), '{ "scripts": { "check": "tsc" } }\n');
    git(made.repo, "add", "package.json");
    git(made.repo, "commit", "--quiet", "-m", "chore: a check");
    app = await BuiltApp.start({ OWLERY_WORKTREES: made.root });
    // The app starts in the background, and the page of a window without the system's focus reports none.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    made?.remove();
    pinned?.remove();
  }, 30_000);

  it("opens when a repository with no place for records is registered: it says what is out of scope and shows the plan before anything is written, Set up and commit makes the one commit, and the repository's menu then shows what the repository holds, with no button to commit", async () => {
    const before = git(made.repo, "rev-parse", "HEAD").trim();
    await app.click("#new-work-item");
    await dialogOpen("work-item-dialog");
    await app.click("#work-item-register-only");
    await value(`(() => { const field = document.getElementById("work-item-repo"); field.value = ${JSON.stringify(made.repo)}; field.dispatchEvent(new Event("input", { bubbles: true })); })()`);
    await app.click("#work-item-create");
    await dialogClosed("work-item-dialog");

    // The registration's answer opens the dialog, and the plan of the command the daemon proposed arrives.
    await dialogOpen("records-dialog");
    await app.until(`!document.getElementById("records-submit").disabled`, "the plan of the proposed command");
    expect(await text("records-head")).toBe("Records and check: project");
    expect(await text("records-scope")).toBe("Owlery commits work records to this repository. A repository that cannot keep work records in its tree is out of scope for Owlery.");
    expect(await text("records-commit")).toBe(`This makes one commit on \`main\`: \`${SUBJECT}\`. Nothing is pushed.`);
    expect(await value<string[]>(`[...document.querySelectorAll("#records-files .path")].map((path) => path.textContent)`)).toEqual(["seal/README.md", "seal/config.json", WORKFLOW]);
    const texts = await value<string[]>(`[...document.querySelectorAll("#records-files pre")].map((file) => file.textContent)`);
    expect(texts[0]?.split("\n")[0]).toBe("# What AgenticSeal maintains in seal/");
    expect(texts[1]).toContain('"Broad gate": "npm run check"');
    // The workflow fetches the check at the version the build read from package.json.
    const { version } = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { version: string };
    expect(texts[2]).toContain(`--branch v${version} \\`);
    expect(await value<unknown[]>(`[document.getElementById("records-gate-name").textContent, document.getElementById("records-gate").value, document.getElementById("records-gate").disabled]`)).toEqual(["Broad gate command", "npm run check", false]);
    expect(await text("records-gate-says")).toBe("Kept in `seal/config.json`, under `Broad gate`. Owlery read this command from the repository's `package.json`: change it where the repository's whole check is another.");
    expect(await value<string[]>(`[document.getElementById("records-cancel").textContent, document.getElementById("records-submit").textContent]`)).toEqual(["Not now", "Set up and commit"]);
    // The plan names Owlery's workflow, so the dialog says how an administrator makes its check required.
    expect(await value<unknown[]>(`[document.getElementById("records-required").hidden, document.getElementById("records-required").textContent]`)).toEqual([false, REQUIRED]);
    // Nothing is written until the person confirms.
    expect([git(made.repo, "rev-parse", "HEAD").trim(), status(), existsSync(join(made.repo, "seal")), existsSync(join(made.repo, ".github"))]).toEqual([before, "", false, false]);

    await app.click("#records-submit");
    await dialogClosed("records-dialog");
    expect(git(made.repo, "rev-parse", "HEAD~1").trim()).toBe(before);
    expect(git(made.repo, "show", "--name-only", "--format=%s", "HEAD").trim().split("\n").filter((line) => line !== "")).toEqual([SUBJECT, WORKFLOW, "seal/README.md", "seal/config.json"]);
    expect(status()).toBe("");
    expect(JSON.parse(readFileSync(join(made.repo, "seal", "config.json"), "utf8"))).toEqual({ "Commit and pull request language": "English", "Record language": "English", "Broad gate": "npm run check" });

    // The repository now holds every part: its menu's entry shows them, and offers no commit.
    await app.click(`#repositories section[data-repository="1"] .repository-menu`);
    await app.until(`document.querySelector('[role="menu"]')`, "the repository's menu");
    await value(`[...document.querySelectorAll('[role="menu"] [role="menuitem"]')].find((item) => item.textContent === "Records and check…").click()`);
    await dialogOpen("records-dialog");
    await app.until(`document.querySelectorAll("#records-holds li").length === 3`, "what the repository holds");
    expect(await value<string[]>(`[...document.querySelectorAll("#records-holds li")].map((line) => line.textContent)`)).toEqual(["Records: `seal/`", `Check: \`${WORKFLOW}\``, "Broad gate: `npm run check`, kept in `seal/config.json` under `Broad gate`"]);
    expect(await value<unknown[]>(`[document.getElementById("records-submit").hidden, document.getElementById("records-gate-label").hidden, document.getElementById("records-cancel").textContent, document.querySelectorAll("#records-files > *").length]`)).toEqual([true, true, "Close", 0]);
    expect(await value<unknown[]>(`[document.getElementById("records-required").hidden, document.getElementById("records-required").textContent]`)).toEqual([false, REQUIRED]);
    await app.click("#records-cancel");
    await dialogClosed("records-dialog");
  });

  it("shows a button Check and the version on the row of a repository whose workflow fetches the check of an older Owlery, opens the move from it with both versions and the workflow whole, and Move and commit makes the one commit, after which the button is gone", async () => {
    const { version } = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { version: string };
    const repository = temporaryRepository("pinned");
    pinned = repository;
    mkdirSync(join(repository.repo, "seal"));
    writeFileSync(join(repository.repo, "seal", "README.md"), `${MARKER}\n`);
    writeFileSync(join(repository.repo, "seal", "config.json"), `${JSON.stringify({ "Broad gate": "make check" })}\n`);
    mkdirSync(join(repository.repo, ".github", "workflows"), { recursive: true });
    writeFileSync(join(repository.repo, WORKFLOW), workflowText("0.0.1"));
    git(repository.repo, "add", "seal", ".github");
    git(repository.repo, "commit", "--quiet", "-m", "chore: the records place of Owlery 0.0.1");
    const before = git(repository.repo, "rev-parse", "HEAD").trim();

    // The repository holds every part, so its registration opens no dialog.
    await app.click("#new-work-item");
    await dialogOpen("work-item-dialog");
    await app.click("#work-item-register-only");
    await value(`(() => { const field = document.getElementById("work-item-repo"); field.value = ${JSON.stringify(repository.repo)}; field.dispatchEvent(new Event("input", { bubbles: true })); })()`);
    await app.click("#work-item-create");
    await dialogClosed("work-item-dialog");

    const button = `#repositories section[data-repository="2"] .repository-check`;
    await app.until(`document.querySelector('${button}')?.textContent === "Check 0.0.1"`, "the button of the older check on the row");
    const says = "The pull request check of pinned is Owlery 0.0.1's, older than this app. Open to read the commit that moves it.";
    expect(await value<unknown[]>(`[document.querySelector('${button}').title, document.querySelector('${button}').getAttribute("aria-label"), document.querySelector('${button}').nextElementSibling.classList.contains("repository-add")]`)).toEqual([says, says, true]);
    expect(await value<boolean>(`document.getElementById("records-dialog").open`)).toBe(false);

    await app.click(button);
    await dialogOpen("records-dialog");
    await app.until(`!document.getElementById("records-submit").disabled`, "the plan of the move");
    expect(await text("records-move")).toBe(`\`${WORKFLOW}\` fetches the pull request check of Owlery 0.0.1, older than this app. The commit moves it to Owlery ${version}.`);
    expect(await text("records-commit")).toBe(`This makes one commit on \`main\`: \`${moveSubject(version)}\`. Nothing is pushed.`);
    expect(await value<unknown[]>(`[[...document.querySelectorAll("#records-files .path")].map((path) => path.textContent), [...document.querySelectorAll("#records-files pre")].map((file) => file.textContent), document.querySelector("#records-files .says").textContent]`)).toEqual([[WORKFLOW], [workflowText(version)], `The commit writes this text over the committed \`${WORKFLOW}\`, whole.`]);
    expect(await value<unknown[]>(`[document.getElementById("records-unread").hidden, document.getElementById("records-unread-list").hidden, document.getElementById("records-unread-says").textContent.startsWith("Owlery read the round records")]`)).toEqual([false, true, true]);
    expect(await value<unknown[]>(`[document.getElementById("records-gate-label").hidden, document.getElementById("records-submit").textContent]`)).toEqual([true, "Move and commit"]);
    // Nothing is written until the person confirms.
    expect([git(repository.repo, "rev-parse", "HEAD").trim(), git(repository.repo, "status", "--porcelain=v1", "--untracked-files=all")]).toEqual([before, ""]);

    await app.click("#records-submit");
    await dialogClosed("records-dialog");
    expect(git(repository.repo, "rev-parse", "HEAD~1").trim()).toBe(before);
    expect(git(repository.repo, "show", "--name-only", "--format=%s", "HEAD").trim().split("\n").filter((line) => line !== "")).toEqual([moveSubject(version), WORKFLOW]);
    expect([readFileSync(join(repository.repo, WORKFLOW), "utf8"), git(repository.repo, "status", "--porcelain=v1", "--untracked-files=all")]).toEqual([workflowText(version), ""]);
    await app.until(`document.querySelector('#repositories section[data-repository="2"]') && !document.querySelector('${button}')`, "the row with no button of an older check");
  });
});
