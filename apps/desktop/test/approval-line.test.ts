// The approval line in the built app. It starts the app once, in the
// background, on a temporary repository that holds the place for work
// records. The login shell is a script that names a script CLI, so no real
// `claude` runs: the stand-in writes its process id and sleeps, so a round
// it is launched for runs until a second client of the daemon stops its
// session. That client makes two work items, each with a shell's pane. In
// the first one's worktree the file commits a file and writes the records a
// stage would write there: the routing that names the branch, and two round
// records. The daemon reads them at its next pass, and the view's right
// column and the inbox's preview draw the line. In the second one's
// worktree a case commits a file and asks for a seal, so the chain runs
// round 1, which the stand-in holds, and a later case stops that round's
// session. The page's `Notification` is replaced by a recorder, so nothing
// reaches the system's notifications.
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MARKER } from "../src/daemon/records-place";
import { APPEARANCES, THEMES } from "../src/shared/appearance";
import type { ClientMessage, ServerMessage, WorkItem } from "../src/shared/protocol";
import { alive, BuiltApp, buildApp, untilGone } from "./built-app";
import { commitFile, git, temporaryRepository } from "./repositories";

/** What a place of the line shows, as a person and a screen reader read it. */
interface Shown {
  role: string;
  mark: string[];
  name: string;
  note: string;
  label: string;
  seal: string | null;
}

/** The places the line holds once the daemon has read the records: the crafter's and the proofer's finished, the framer's and the sealer's not started, and the seal's place in the sealer's. */
const EXPECTED: Shown[] = [
  { role: "framer", mark: ["no-agent"], name: "Framer", note: "Not started", label: "Framer: Not started", seal: null },
  { role: "crafter", mark: ["finished"], name: "Crafter", note: "1 commit", label: "Crafter: 1 commit", seal: null },
  { role: "proofer", mark: ["finished"], name: "Proofer", note: "2 rounds", label: "Proofer: 2 rounds", seal: null },
  { role: "sealer", mark: ["no-agent"], name: "Sealer", note: "Not started", label: "Sealer: Not started", seal: "none" },
];

/** The view's right column and the inbox's preview, each with the element its section stands in, which scrolls. */
const WHERE = { view: { detail: "#view-detail", column: "#view-scroll" }, preview: { detail: "#inbox-preview-detail", column: "#inbox-screen .preview-body" } } as const;

describe("the approval line in the built app", { timeout: 120_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;
  /** The work item whose line the records fill. */
  let workItem: WorkItem;
  /** The work item whose chain runs a round. */
  let beta: WorkItem;
  /** The second client of the daemon: a work item of a title as the daemon last listed it, and a message it sends. */
  let second: { item(title: string): WorkItem | undefined; send(message: ClientMessage): void; close(): void };

  function script(name: string, body: string): string {
    const path = join(made.base, name);
    writeFileSync(path, `#!/bin/sh\n${body}\n`);
    chmodSync(path, 0o755);
    return path;
  }

  /** The approval sections under a part of the page, each with its heading and its places. */
  const sections = (within: string): Promise<{ head: string; places: Shown[] }[]> =>
    app.evaluate(
      `[...document.querySelectorAll(${JSON.stringify(`${within} section.approval`)})].map((section) => ({ head: section.querySelector("h3").textContent, places: [...section.querySelectorAll(".place")].map((place) => { const mark = place.querySelector(".state-icon"); return { role: place.dataset.role, mark: [...mark.classList].filter((name) => name !== "state-icon" && name !== "state"), name: place.querySelector(".name").textContent, note: place.querySelector(".note").textContent, label: mark.getAttribute("aria-label"), seal: place.querySelector(".seal")?.dataset.seal ?? null }; }) }))`,
    );

  /** Each width that runs past its box: the column's, the section's and each place's, with the box's own, and the section's room. */
  const overflows = (where: keyof typeof WHERE): Promise<{ room: number; over: string[] }> =>
    app.evaluate(`(() => {
      const column = document.querySelector(${JSON.stringify(WHERE[where].column)});
      const section = document.querySelector(${JSON.stringify(`${WHERE[where].detail} section.approval`)});
      const boxes = [["column", column], ["section", section], ...[...section.querySelectorAll(".place")].map((place) => [place.dataset.role, place])];
      return { room: section.clientWidth, over: boxes.filter(([, box]) => box.scrollWidth > box.clientWidth).map(([name, box]) => name + " " + box.scrollWidth + " in " + box.clientWidth) };
    })()`);

  /** A person's choice in one of the two controls of the sidebar's foot. */
  const choose = (control: "theme" | "appearance", choice: string): Promise<void> =>
    app.evaluate(`(() => { const choices = document.getElementById(${JSON.stringify(control)}); choices.value = ${JSON.stringify(choice)}; choices.dispatchEvent(new Event("change", { bubbles: true })); })()`);

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    // The place for work records stands on the branch the work items are cut from.
    mkdirSync(join(made.repo, "seal"));
    writeFileSync(join(made.repo, "seal", "README.md"), `${MARKER}\n`);
    git(made.repo, "add", "--all");
    git(made.repo, "commit", "--quiet", "-m", "chore: add the place for work records");
    // The daemon also runs the CLI at its start, to read its version: that run prints one and is no session. A session of it writes its process id and holds its prompt.
    const cli = script("cli", `if [ "$*" = "--version" ]; then echo '2.1.330 (Claude Code)'; exit 0; fi\necho $$ > '${join(made.base, "cli-pid")}'\nexec sleep 600`);
    // The login shell: it names the stand-in, and a pane it starts ends at once.
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '/usr/bin:/bin'`);
    app = await BuiltApp.start({ SHELL: shell, OWLERY_WORKTREES: made.root });
    await app.evaluate(`window.Notification = class { static permission = "granted"; }`);
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");

    // A second client of the daemon makes the two work items, one after the other.
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    const messages: ServerMessage[] = [];
    const create = (requestId: number, title: string): void => socket.send(JSON.stringify({ type: "createWorkItem", requestId, repo: made.repo, title, kind: "shell", cols: 80, rows: 24 }));
    second = {
      item: (title) => messages.flatMap((message) => (message.type === "ready" || message.type === "inbox" ? message.workItems : [])).filter((item) => item.title === title).at(-1),
      send: (message) => socket.send(JSON.stringify(message)),
      close: () => socket.close(),
    };
    [workItem, beta] = await new Promise<WorkItem[]>((resolve) => {
      const created: WorkItem[] = [];
      socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })));
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        messages.push(message);
        if (message.type === "ready") create(1, "Alpha");
        if (message.type !== "workItemCreated") return;
        created.push(message.workItem);
        if (created.length === 1) create(2, "Beta");
        else resolve(created);
      });
    }) as [WorkItem, WorkItem];

    // One commit after the base, and the records a stage writes: the routing that names the branch, and two rounds.
    commitFile(workItem.worktree, "login.ts");
    const directory = join(workItem.worktree, "seal", "threads", "1-alpha");
    mkdirSync(join(directory, "trail", "rounds"), { recursive: true });
    writeFileSync(join(directory, "routing.md"), `| Axis | Answer |\n|---|---|\n| Review | through the review chain |\n| Destination | open the pull request |\n| Branch | ${workItem.branch} |\n`);
    for (const round of [1, 2]) writeFileSync(join(directory, "trail", "rounds", `round-${round}.md`), `# Round ${round}\n`);

    await app.click(`#repositories button[data-work-item="${workItem.id}"]`);
    await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === "Alpha"`, "the view of Alpha");
    await app.until(`document.querySelector('#view-detail section.approval .place[data-role="proofer"] .note')?.textContent === "2 rounds" && document.querySelector('#view-detail section.approval .place[data-role="crafter"] .note')?.textContent === "1 commit"`, "the line as the records and the commit give it", 20_000);
  }, 120_000);

  afterAll(async () => {
    second?.close();
    await app?.stop();
    made?.remove();
  }, 30_000);

  it('draws one section headed "Approval line" in the view\'s right column and in the inbox\'s preview, with the four places in order, each with its mark, its name and its note, and the seal\'s place in the sealer\'s', async () => {
    expect(await sections("#view-detail")).toEqual([{ head: "Approval line", places: EXPECTED }]);
    await app.click("#nav-inbox");
    await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelector("#inbox-preview-detail section.approval")`, "the preview with its approval line");
    expect(await sections("#inbox-preview-detail")).toEqual([{ head: "Approval line", places: EXPECTED }]);
    // The section stands after what the agent says and before the decisions, and this work item has neither: it is the first of the preview's.
    expect(await app.evaluate<string>(`document.querySelector("#inbox-preview-detail > section").className`)).toBe("approval");
  });

  it("keeps the section and each place within its column in every theme and in each appearance, in the view and in the preview", async () => {
    const found: string[] = [];
    for (const where of ["view", "preview"] as const) {
      if (where === "view") {
        await app.click(`#repositories button[data-work-item="${workItem.id}"]`);
        await app.until(`!document.getElementById("work-item-view").hidden && document.querySelector("#view-detail section.approval")`, "the view with its approval line");
      } else {
        await app.click("#nav-inbox");
        await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelector("#inbox-preview-detail section.approval")`, "the preview with its approval line");
      }
      for (const theme of THEMES) {
        for (const appearance of APPEARANCES) {
          await choose("theme", theme);
          await choose("appearance", appearance);
          await app.until(`document.documentElement.dataset.theme === ${JSON.stringify(theme)} && document.documentElement.dataset.appearance === ${JSON.stringify(appearance)}`, `the window in ${theme}, ${appearance}`);
          const { room, over } = await overflows(where);
          // A section that is not laid out has no width, and nothing runs past nothing.
          expect(room).toBeGreaterThan(0);
          found.push(...over.map((line) => `${where}, ${theme} ${appearance}: ${line}`));
        }
      }
    }
    expect(found).toEqual([]);
  });

  const BETA_LINE = () => `#inbox-lines button[data-work-item="${beta.id}"]`;
  const PROOFER = `#view-detail section.approval .place[data-role="proofer"]`;
  /** How an age reads within the first two minutes of what it counts from. */
  const YOUNG = "(less than a minute|1 min)";

  /** Opens the view of the work item whose chain runs. */
  const openBeta = async (): Promise<void> => {
    await app.click(`#repositories button[data-work-item="${beta.id}"]`);
    await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === "Beta"`, "the view of Beta");
  };

  it("marks the proofer's place working with the round's note while the work item's chain runs a round, with the role, the note and the age in the mark's words, and names the stage in the second row of the work item's line of the inbox, with an age in its first", async () => {
    commitFile(beta.worktree, "feature.ts");
    second.send({ type: "getSeal", requestId: 3, workItemId: beta.id });
    await openBeta();
    // The chain's first commit declares the work item's routing, so the branch holds two commits once the round runs.
    await app.until(`document.querySelector('${PROOFER} .note')?.textContent === "Round 1" && document.querySelector('#view-detail section.approval .place[data-role="crafter"] .note')?.textContent === "2 commits"`, "the line with the round that runs", 20_000);
    const [line] = await sections("#view-detail");
    expect(line?.places.map(({ role, mark, note }) => [role, mark, note])).toEqual([
      ["framer", ["no-agent"], "Not started"],
      ["crafter", ["finished"], "2 commits"],
      ["proofer", ["working"], "Round 1"],
      ["sealer", ["no-agent"], "Not started"],
    ]);
    expect(line?.places[2]?.label).toMatch(new RegExp(`^Proofer: Round 1, ${YOUNG}$`));
    expect(await app.evaluate(`document.querySelectorAll("#view-detail section.approval .under").length`)).toBe(0);

    await app.click("#nav-inbox");
    await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelector('${BETA_LINE()} .says')?.textContent === "Proofer, round 1"`, "the stage in the second row of the line of Beta");
    expect(await app.evaluate(`(() => { const line = document.querySelector('${BETA_LINE()}'); return [line.querySelector(".second .says").textContent, line.querySelector(".state-icon").classList.contains("working")]; })()`)).toEqual(["Proofer, round 1", true]);
    expect(await app.evaluate<string>(`document.querySelector('${BETA_LINE()} .first .age').textContent`)).toMatch(new RegExp(`^${YOUNG}$`));
    // The line of the work item no chain ran for says what it said: its newest commit, and no age.
    expect(await app.evaluate(`(() => { const line = document.querySelector('#inbox-lines button[data-work-item="${workItem.id}"]'); return [line.querySelector(".second .says").textContent, line.querySelector(".first .age").textContent]; })()`)).toEqual(["add login.ts", ""]);
  });

  it("marks the proofer's place failed once the round's session is stopped, with the round in the mark's words and the stage's failure under the line in the colour of a failure", async () => {
    const stage = second.item("Beta")?.chain?.stages.at(-1);
    expect([stage?.kind, stage?.round, stage?.state]).toEqual(["round", 1, "working"]);
    const pidFile = join(made.base, "cli-pid");
    for (const deadline = Date.now() + 10_000; !existsSync(pidFile) && Date.now() < deadline; ) await new Promise((resolve) => setTimeout(resolve, 50));
    const pid = Number(readFileSync(pidFile, "utf8").trim());
    expect(alive(pid)).toBe(true);
    second.send({ type: "stopHeadless", requestId: 4, id: stage!.headlessId! });
    await openBeta();
    await app.until(`document.querySelector('${PROOFER} .state-icon.failed')`, "the proofer's place as failed", 20_000);
    expect(await untilGone([pid], 5_000)).toEqual([]);
    const [line] = await sections("#view-detail");
    expect(line?.places.map(({ role, mark, note, label }) => [role, mark, note, label])).toEqual([
      ["framer", ["no-agent"], "Not started", "Framer: Not started"],
      ["crafter", ["finished"], "2 commits", "Crafter: 2 commits"],
      ["proofer", ["failed"], "Failed", "Proofer: Round 1 failed"],
      ["sealer", ["no-agent"], "Not started", "Sealer: Not started"],
    ]);
    const why = "the session was stopped at a request before it finished";
    expect(second.item("Beta")?.chain?.stages.at(-1)?.failure).toBe(why);
    expect(await app.evaluate(`[...document.querySelectorAll("#view-detail section.approval .under")].map((under) => [under.className, under.textContent])`)).toEqual([["under failed", `Proofer: ${why}`]]);
  });
});
