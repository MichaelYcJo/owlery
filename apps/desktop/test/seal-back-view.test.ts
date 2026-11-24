// The back of a seal in the built app. It starts the app once, in the
// background, on a temporary repository that holds the place for work
// records. The login shell is a script that names a script CLI, so no real
// `claude` runs and no chain starts: a pane it starts ends at once, and its
// tab stays. A second client of the daemon makes three work items. In the
// first one's worktree the file commits, with git, the records of a chain
// that sealed it after one fix: round 1 with a finding whose symptom holds a
// word in backticks, the commit that fixed it, the fix pass's close, round 2
// that confirms it, the broad gate's run and the seal. It then appends the
// entries of that chain's stages to the daemon's ledger, which the daemon
// reads at each `readLedger`. While that work item's back is in front, the
// case commits there once more, with a subject that holds a word in
// backticks, which breaks the seal. In the
// second one's worktree it commits the records of a seal and one commit
// after them, which breaks the seal. The third has no seal, no round and no
// chain. The page's `Notification` is replaced, so nothing reaches the
// system's notifications, and its socket's `send` is wrapped, so the case
// counts the messages the daemon receives from the page.
import { appendFileSync, chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MARKER } from "../src/daemon/records-place";
import type { ServerMessage, WorkItem } from "../src/shared/protocol";
import { BuiltApp, buildApp } from "./built-app";
import { chainEntry, commitSeal, commitSealedAfterAFix } from "./chain-run";
import { commitFile, git, temporaryRepository } from "./repositories";

/** The work items of the case, and the folder of each one's records. */
const SEALED = { title: "Export the history", records: "1795400731-export-the-history" };
const BROKEN = { title: "Cache the avatars", records: "1795400732-cache-the-avatars" };
const PLAIN = { title: "Rename the settings" };
/** A work item made while the sealed one's back is in front, so the daemon sends a list. */
const LATER = { title: "Tidy the changelog" };
/** The symptom of the sealed work item's finding, and the subject of the commit that breaks its seal, each with a word in backticks. */
const SYMPTOM = "The greeting in `feature.txt` misses its full stop";
const BREAKING = "feat: add `later`";

describe("the back of a seal in the built app", { timeout: 120_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;
  let sealed: WorkItem;
  let broken: WorkItem;
  let plain: WorkItem;
  /** The commit that fixed the sealed work item's finding, and the one that broke the other's seal. */
  let fixedIn = "";
  let brokenBy = "";
  let socket: WebSocket | undefined;

  function script(name: string, body: string): string {
    const path = join(made.base, name);
    writeFileSync(path, `#!/bin/sh\n${body}\n`);
    chmodSync(path, 0o755);
    return path;
  }

  /**
   * Opens a work item's view by a click on its line of the sidebar. The
   * sidebar replaces its buttons each time it is drawn, so the click is made
   * again until the view shows.
   */
  const openView = async ({ id, title }: WorkItem): Promise<void> => {
    const shown = `!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(title)}`;
    for (const deadline = Date.now() + 15_000; ; ) {
      await app.click(`#repositories button[data-work-item="${id}"]`);
      try {
        return await app.until(shown, `the view of ${title}`, 2_000);
      } catch (error) {
        if (Date.now() >= deadline) throw error;
      }
    }
  };

  /** How many of each message the page sent the daemon since its socket's `send` was wrapped. */
  const sent = (): Promise<{ readSealRecords: number; readLedger: number }> => app.evaluate(`({ readSealRecords: window.sentOfBack.filter((type) => type === "readSealRecords").length, readLedger: window.sentOfBack.filter((type) => type === "readLedger").length })`);

  /** The back's place as the page draws it: whether it shows, its text, and how many parts it holds. */
  const backShown = (): Promise<{ shown: boolean; text: string; parts: number }> => app.evaluate(`(() => { const back = document.getElementById("back"); return { shown: !back.hidden, text: back.textContent, parts: back.childElementCount }; })()`);

  /** The tabs of the strip: each one's label, whether it is in front, and whether it has a close mark. */
  const tabs = (): Promise<{ label: string; active: boolean; closes: boolean }[]> =>
    app.evaluate(`[...document.querySelectorAll("#tabs .tab")].map((tab) => ({ label: tab.querySelector(".label").textContent, active: tab.classList.contains("active"), closes: tab.querySelector(".close") !== null }))`);

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    // The place for work records stands on the branch the work items are cut from.
    mkdirSync(join(made.repo, "seal"));
    writeFileSync(join(made.repo, "seal", "README.md"), `${MARKER}\n`);
    git(made.repo, "add", "--all");
    git(made.repo, "commit", "--quiet", "-m", "chore: add the place for work records");
    // The daemon runs the CLI at its start, to read its version, and starts no session of it here.
    const cli = script("cli", `if [ "$*" = "--version" ]; then echo '2.1.330 (Claude Code)'; exit 0; fi\nexit 1`);
    // The login shell: it names the stand-in, and a pane it starts ends at once.
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '/usr/bin:/bin'`);
    app = await BuiltApp.start({ SHELL: shell, OWLERY_WORKTREES: made.root });
    await app.evaluate(`window.Notification = class { static permission = "granted"; }`);
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");

    // A second client of the daemon makes the three work items, one after the other.
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const opened = new WebSocket(`ws://127.0.0.1:${port}`);
    socket = opened;
    const titles = [SEALED.title, BROKEN.title, PLAIN.title];
    const create = (requestId: number): void => opened.send(JSON.stringify({ type: "createWorkItem", requestId, repo: made.repo, title: titles[requestId - 1], kind: "shell", cols: 80, rows: 24 }));
    [sealed, broken, plain] = (await new Promise<WorkItem[]>((resolve) => {
      const created: WorkItem[] = [];
      opened.addEventListener("open", () => opened.send(JSON.stringify({ type: "hello", token })));
      opened.addEventListener("message", (event) => {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        if (message.type === "ready") create(1);
        if (message.type !== "workItemCreated") return;
        created.push(message.workItem);
        if (created.length < titles.length) create(created.length + 1);
        else resolve(created);
      });
    })) as [WorkItem, WorkItem, WorkItem];

    const base = git(made.repo, "rev-parse", "HEAD").trim();
    fixedIn = commitSealedAfterAFix(sealed.worktree, { workItem: SEALED.records, branch: sealed.branch, base, symptom: SYMPTOM });
    // The ledger's lines of the sealed work item's chain, in the order its stages ended, each after the work item was made.
    const at = Date.now();
    const stages = [["round", 1], ["fix-pass", 1], ["round", 2], ["gate", 2], ["seal", 2]] as const;
    appendFileSync(join(app.userData, "run", "ledger.jsonl"), stages.map(([kind, round], place) => `${JSON.stringify(chainEntry(sealed, kind, round, at + place * 5 * 60_000))}\n`).join(""), { mode: 0o600 });
    commitSeal(broken.worktree, { workItem: BROKEN.records, branch: broken.branch, base });
    brokenBy = commitFile(broken.worktree, "avatars.ts");

    // Each message the page sends from here on is counted by its type.
    await app.evaluate(`(() => { window.sentOfBack = []; const send = WebSocket.prototype.send; WebSocket.prototype.send = function (data) { try { window.sentOfBack.push(JSON.parse(data).type); } catch {} send.call(this, data); }; })()`);
  }, 120_000);

  afterAll(async () => {
    socket?.close();
    await app?.stop();
    made?.remove();
  }, 30_000);

  it("opens a sealed work item to its back, with the seal's record, a finding at its file and line with the commit that fixed it and each stage's converted cost, draws the code of a finding's symptom and of a breaking commit's subject in the fixed-width face, draws it again for no list that leaves its seal, records and chain as they were, lets the back's answers go while a pane is in front and asks again when the back comes back, asks again when a commit breaks the seal while the back is in front, names the commit that broke a broken seal, and gives no back to a work item with no seal, no round and no chain", async () => {
    // Each view is opened once its line shows the seal the daemon read at the branch's head. The sidebar's lines draw no seal, and the inbox's do.
    await app.click("#nav-inbox");
    await app.until(`document.querySelector('#inbox-lines button[data-work-item="${sealed.id}"] .seal[data-seal="sealed"]') && document.querySelector('#inbox-lines button[data-work-item="${broken.id}"] .seal[data-seal="broken"]')`, "the sealed and the broken seal on their lines", 30_000);

    await openView(sealed);
    await app.until(`document.querySelector("#back .round")`, "the back of the sealed work item drawn");
    expect(await tabs()).toEqual([
      { label: "Back of the seal", active: true, closes: false },
      { label: "Shell", active: false, closes: true },
    ]);
    expect(await app.evaluate<boolean>(`document.getElementById("stage").hidden`)).toBe(true);
    const back = await backShown();
    expect(back.shown).toBe(true);
    expect(back.text).toContain("Sealed at");
    expect(back.text).toContain(`Tree${git(sealed.worktree, "rev-parse", "--short=7", "HEAD~2").trim()} on ${sealed.branch}`);
    expect(back.text).toContain("The review rounds caught 1 defect that was fixed before the seal.");
    expect(back.text).toContain("feature.txt:1");
    expect(back.text).toContain(`Fixed in ${fixedIn.slice(0, 7)}`);
    expect(back.text).toContain("$0.28 converted");
    expect(back.text).toContain("The chain's stages cost $1.12 converted.");
    // The finding's symptom is drawn with its code in the fixed-width face, and no text of the back shows a backtick.
    expect(await app.evaluate<string | undefined>(`document.querySelector("#back .finding .says code")?.textContent`)).toBe("feature.txt");
    expect(back.text).not.toContain("`");
    expect(await sent()).toEqual({ readSealRecords: 1, readLedger: 1 });

    // A list the daemon sends while the back is in front, which changes none of the sealed work item's seal, records or chain, leaves the back as it was drawn, so a selection in it stays, and asks nothing.
    await app.evaluate(`document.querySelector("#back .round").dataset.kept = "yes"`);
    socket?.send(JSON.stringify({ type: "createWorkItem", requestId: 4, repo: made.repo, title: LATER.title, kind: "shell", cols: 80, rows: 24 }));
    await app.until(`[...document.querySelectorAll("#repositories button[data-work-item]")].some((line) => line.textContent.includes(${JSON.stringify(LATER.title)}))`, "the later work item's line in the sidebar");
    expect(await app.evaluate<string | undefined>(`document.querySelector("#back .round")?.dataset.kept`)).toBe("yes");
    expect(await sent()).toEqual({ readSealRecords: 1, readLedger: 1 });

    // A pane's tab comes in front: the back's place is emptied, and nothing more is asked.
    await app.click("#tabs .tab:not(.back) .label");
    await app.until(`!document.getElementById("stage").hidden`, "the stage with the pane in front");
    expect(await tabs()).toEqual([
      { label: "Back of the seal", active: false, closes: false },
      { label: "Shell", active: true, closes: true },
    ]);
    expect(await backShown()).toEqual({ shown: false, text: "", parts: 0 });
    expect(await sent()).toEqual({ readSealRecords: 1, readLedger: 1 });
    // The back's tab comes in front again, and the back is asked for again.
    await app.click("#tabs .tab.back .label");
    await app.until(`document.querySelector("#back .round")`, "the back drawn again");
    expect(await sent()).toEqual({ readSealRecords: 2, readLedger: 2 });
    // A commit after the seal breaks it while the back is in front: the seal the next list carries differs from the one the window asked at, so the back is asked for again and drawn as broken, the commit's subject with its code in the fixed-width face.
    writeFileSync(join(sealed.worktree, "later.ts"), "later.ts\n");
    git(sealed.worktree, "add", "later.ts");
    git(sealed.worktree, "commit", "--quiet", "-m", BREAKING);
    const later = git(sealed.worktree, "rev-parse", "HEAD").trim();
    await app.until(`document.querySelector("#back .broken-by")`, "the sealed work item's back drawn again as broken", 30_000);
    expect(await sent()).toEqual({ readSealRecords: 3, readLedger: 3 });
    const laterBack = await backShown();
    expect(laterBack.text).toContain(`Broken by ${later.slice(0, 7)}`);
    expect(await app.evaluate<string | undefined>(`document.querySelector("#back .broken-by .subject code")?.textContent`)).toBe("later");
    expect(laterBack.text).not.toContain("`");

    await openView(broken);
    await app.until(`document.querySelector("#back .broken-by")`, "the back of the broken work item drawn");
    expect((await tabs())[0]).toEqual({ label: "Back of the seal", active: true, closes: false });
    const brokenBack = await backShown();
    expect(brokenBack.text).toContain(`Broken by ${brokenBy.slice(0, 7)}`);
    expect(brokenBack.text).toContain("add avatars.ts");
    expect(brokenBack.text).toContain("The review rounds caught nothing.");

    await openView(plain);
    expect(await tabs()).toEqual([{ label: "Shell", active: true, closes: true }]);
    expect((await backShown()).shown).toBe(false);
  });
});
