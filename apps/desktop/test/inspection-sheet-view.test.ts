// layer: app
// The inspection sheet in the built app. It starts the app once, in the
// background, on a temporary repository that holds the place for work
// records. The login shell is a script that names a script CLI, so no real
// `claude` runs and no chain starts: a pane it starts ends at once, and its
// tab stays. A second client of the daemon makes three work items. In the
// first one's worktree the file commits, with git, the records of a chain
// that cleared it after one fix: round 1 with a finding whose symptom holds a
// word in backticks, the commit that fixed it, the fix pass's close, round 2
// that confirms it, the broad gate's run and the inspection. It then appends the
// entries of that chain's stages to the daemon's ledger, which the daemon
// reads at each `readLedger`. While that work item's back is in front, the
// case commits there once more, with a subject that holds a word in
// backticks, which lapses the inspection. In the
// second one's worktree it commits the records of an inspection and one commit
// after them, which lapses the inspection. The third has no inspection, no round and no
// chain. The page's socket's `send` is wrapped, so the case counts the
// messages the daemon receives from the page. A second case presses a work
// item's line of the sidebar and holds the button while the window takes an
// `inbox`, which the second client asks for by pinning another work item,
// and then releases at the same point.
import { appendFileSync, chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MARKER } from "../src/daemon/records-place";
import type { ServerMessage, WorkItem } from "../src/shared/protocol";
import { BuiltApp, buildApp } from "./built-app";
import { chainEntry, commitInspection, commitClearedAfterAFix } from "./chain-run";
import { branchOf, commitFile, git, temporaryRepository } from "./repositories";

/** The work items of the case, and the folder of each one's records. */
const CLEARED = { title: "Export the history", records: "1795400731-export-the-history" };
const LAPSED = { title: "Cache the avatars", records: "1795400732-cache-the-avatars" };
const PLAIN = { title: "Rename the settings" };
/** A work item made while the cleared one's back is in front, so the daemon sends a list. */
const LATER = { title: "Tidy the changelog" };
/** The symptom of the cleared work item's finding, and the subject of the commit that lapses its inspection, each with a word in backticks. */
const SYMPTOM = "The greeting in `feature.txt` misses its full stop";
const LAPSING = "feat: add `later`";

describe("the inspection sheet in the built app", { timeout: 120_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;
  let cleared: WorkItem;
  let lapsed: WorkItem;
  let plain: WorkItem;
  /** The commit that fixed the cleared work item's finding, and the one that lapsed the other's inspection. */
  let fixedIn = "";
  let lapsedBy = "";
  let socket: WebSocket | undefined;

  function script(name: string, body: string): string {
    const path = join(made.base, name);
    writeFileSync(path, `#!/bin/sh\n${body}\n`);
    chmodSync(path, 0o755);
    return path;
  }

  /** The expression that is true while the view of the work item named `title` is in front. */
  const viewOf = (title: string): string => `!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(title)}`;

  /** Opens a work item's view by one click on its line of the sidebar. */
  const openView = async ({ id, title }: WorkItem): Promise<void> => {
    await app.click(`#repositories button[data-work-item="${id}"]`);
    await app.until(viewOf(title), `the view of ${title}`);
  };

  /** How many of each message the page sent the daemon since its socket's `send` was wrapped. */
  const sent = (): Promise<{ readBackRecords: number; readLedger: number }> => app.evaluate(`({ readBackRecords: window.sentOfBack.filter((type) => type === "readBackRecords").length, readLedger: window.sentOfBack.filter((type) => type === "readLedger").length })`);

  /** The back's place as the page draws it: whether it shows, its text, and how many parts it holds. */
  const backShown = (): Promise<{ shown: boolean; text: string; parts: number }> => app.evaluate(`(() => { const back = document.getElementById("back"); return { shown: !back.hidden, text: back.textContent, parts: back.childElementCount }; })()`);

  /** The tabs of the strip: each one's label, whether it is in front, and whether it has a close mark. */
  const tabs = (): Promise<{ label: string; active: boolean; closes: boolean }[]> =>
    app.evaluate(`[...document.querySelectorAll("#tabs .tab")].map((tab) => ({ label: tab.querySelector(".label").textContent, active: tab.classList.contains("active"), closes: tab.querySelector(".close") !== null }))`);

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    // The place for work records stands on the branch the work items are cut from.
    mkdirSync(join(made.repo, "agentory"));
    writeFileSync(join(made.repo, "agentory", "README.md"), `${MARKER}\n`);
    git(made.repo, "add", "--all");
    git(made.repo, "commit", "--quiet", "-m", "chore: add the place for work records");
    // The daemon runs the CLI at its start, to read its version, and starts no session of it here.
    const cli = script("cli", `if [ "$*" = "--version" ]; then echo '2.1.330 (Claude Code)'; exit 0; fi\nexit 1`);
    // The login shell: it names the stand-in, and a pane it starts ends at once.
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n__owlery_config=%s\\n' '${cli}' '/usr/bin:/bin' "\${CLAUDE_CONFIG_DIR:-}"`);
    app = await BuiltApp.start({ SHELL: shell, OWLERY_WORKTREES: made.root });
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");

    // A second client of the daemon makes the three work items, one after the other.
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const opened = new WebSocket(`ws://127.0.0.1:${port}`);
    socket = opened;
    const titles = [CLEARED.title, LAPSED.title, PLAIN.title];
    const create = (requestId: number): void => opened.send(JSON.stringify({ type: "createWorkItem", requestId, repo: made.repo, title: titles[requestId - 1], kind: "shell", cols: 80, rows: 24 }));
    [cleared, lapsed, plain] = (await new Promise<WorkItem[]>((resolve) => {
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
    // A rename gives each work item its branch, on which the records below are committed, as a person gives a work item with no branch yet its branch.
    const branched = (item: WorkItem, requestId: number): Promise<WorkItem> =>
      new Promise((resolve) => {
        const listen = (event: MessageEvent): void => {
          const message = JSON.parse(String(event.data)) as ServerMessage;
          const found = message.type === "inbox" ? message.workItems.find((each) => each.id === item.id && each.branch !== null) : undefined;
          if (found === undefined) return;
          opened.removeEventListener("message", listen);
          resolve(found);
        };
        opened.addEventListener("message", listen);
        opened.send(JSON.stringify({ type: "renameWorkItem", requestId, id: item.id, title: item.title, branch: true }));
      });
    cleared = await branched(cleared, 11);
    lapsed = await branched(lapsed, 12);
    plain = await branched(plain, 13);

    const base = git(made.repo, "rev-parse", "HEAD").trim();
    fixedIn = commitClearedAfterAFix(cleared.worktree, { workItem: CLEARED.records, branch: branchOf(cleared), base, symptom: SYMPTOM });
    // The ledger's lines of the cleared work item's chain, in the order its stages ended, each after the work item was made.
    const at = Date.now();
    const stages = [["round", 1], ["fix-pass", 1], ["round", 2], ["gate", 2], ["inspection", 2]] as const;
    appendFileSync(join(app.userData, "run", "ledger.jsonl"), stages.map(([kind, round], place) => `${JSON.stringify(chainEntry(cleared, kind, round, at + place * 5 * 60_000))}\n`).join(""), { mode: 0o600 });
    commitInspection(lapsed.worktree, { workItem: LAPSED.records, branch: branchOf(lapsed), base });
    lapsedBy = commitFile(lapsed.worktree, "avatars.ts");

    // Each message the page sends from here on is counted by its type.
    await app.evaluate(`(() => { window.sentOfBack = []; const send = WebSocket.prototype.send; WebSocket.prototype.send = function (data) { try { window.sentOfBack.push(JSON.parse(data).type); } catch {} send.call(this, data); }; })()`);
  }, 120_000);

  afterAll(async () => {
    socket?.close();
    await app?.stop();
    made?.remove();
  }, 30_000);

  it("opens a cleared work item to its back, with the inspection's record, a finding at its file and line with the commit that fixed it and each stage's converted cost, draws the code of a finding's symptom and of the subject of a commit that lapsed an inspection in the fixed-width face, draws it again for no list that leaves its inspection, records and chain as they were, lets the back's answers go while a pane is in front and asks again when the back comes back, asks again when a commit lapses the inspection while the back is in front, names the commit that lapsed a lapsed inspection, and gives no back to a work item with no inspection, no round and no chain", async () => {
    // Each view is opened once its line shows the inspection the daemon read at the branch's head. The sidebar's lines draw no inspection, and the inbox's do.
    await app.click("#nav-inbox");
    await app.until(`document.querySelector('#inbox-lines button[data-work-item="${cleared.id}"] .mark[data-inspection="cleared"]') && document.querySelector('#inbox-lines button[data-work-item="${lapsed.id}"] .mark[data-inspection="lapsed"]')`, "the cleared and the lapsed inspection on their lines", 30_000);

    await openView(cleared);
    await app.until(`document.querySelector("#back .round")`, "the inspection sheeted work item drawn");
    expect(await tabs()).toEqual([
      { label: "Inspection sheet", active: true, closes: false },
      { label: "Shell", active: false, closes: true },
    ]);
    expect(await app.evaluate<boolean>(`document.getElementById("stage").hidden`)).toBe(true);
    const back = await backShown();
    expect(back.shown).toBe(true);
    expect(back.text).toContain("Cleared at");
    expect(back.text).toContain(`Tree${git(cleared.worktree, "rev-parse", "--short=7", "HEAD~2").trim()} on ${cleared.branch}`);
    expect(back.text).toContain("The review rounds caught 1 defect that was fixed before the inspection.");
    expect(back.text).toContain("feature.txt:1");
    expect(back.text).toContain(`Fixed in ${fixedIn.slice(0, 7)}`);
    expect(back.text).toContain("$0.28 converted");
    expect(back.text).toContain("The chain's stages cost $1.12 converted.");
    // The finding's symptom is drawn with its code in the fixed-width face, and no text of the back shows a backtick.
    expect(await app.evaluate<string | undefined>(`document.querySelector("#back .finding .says code")?.textContent`)).toBe("feature.txt");
    expect(back.text).not.toContain("`");
    expect(await sent()).toEqual({ readBackRecords: 1, readLedger: 1 });

    // A list the daemon sends while the back is in front, which changes none of the cleared work item's inspection, records or chain, leaves the back as it was drawn, so a selection in it stays, and asks nothing.
    await app.evaluate(`document.querySelector("#back .round").dataset.kept = "yes"`);
    socket?.send(JSON.stringify({ type: "createWorkItem", requestId: 4, repo: made.repo, title: LATER.title, kind: "shell", cols: 80, rows: 24 }));
    await app.until(`[...document.querySelectorAll("#repositories button[data-work-item]")].some((line) => line.textContent.includes(${JSON.stringify(LATER.title)}))`, "the later work item's line in the sidebar");
    expect(await app.evaluate<string | undefined>(`document.querySelector("#back .round")?.dataset.kept`)).toBe("yes");
    expect(await sent()).toEqual({ readBackRecords: 1, readLedger: 1 });

    // A pane's tab comes in front: the back's place is emptied, and nothing more is asked.
    await app.click("#tabs .tab:not(.back) .label");
    await app.until(`!document.getElementById("stage").hidden`, "the stage with the pane in front");
    expect(await tabs()).toEqual([
      { label: "Inspection sheet", active: false, closes: false },
      { label: "Shell", active: true, closes: true },
    ]);
    expect(await backShown()).toEqual({ shown: false, text: "", parts: 0 });
    expect(await sent()).toEqual({ readBackRecords: 1, readLedger: 1 });
    // The back's tab comes in front again, and the back is asked for again.
    await app.click("#tabs .tab.back .label");
    await app.until(`document.querySelector("#back .round")`, "the back drawn again");
    expect(await sent()).toEqual({ readBackRecords: 2, readLedger: 2 });
    // A commit after the inspection lapses it while the back is in front: the inspection the next list carries differs from the one the window asked at, so the back is asked for again and drawn as lapsed, the commit's subject with its code in the fixed-width face.
    writeFileSync(join(cleared.worktree, "later.ts"), "later.ts\n");
    git(cleared.worktree, "add", "later.ts");
    git(cleared.worktree, "commit", "--quiet", "-m", LAPSING);
    const later = git(cleared.worktree, "rev-parse", "HEAD").trim();
    await app.until(`document.querySelector("#back .lapsed-by")`, "the cleared work item's back drawn again as lapsed", 30_000);
    expect(await sent()).toEqual({ readBackRecords: 3, readLedger: 3 });
    const laterBack = await backShown();
    expect(laterBack.text).toContain(`Lapsed by ${later.slice(0, 7)}`);
    expect(await app.evaluate<string | undefined>(`document.querySelector("#back .lapsed-by .subject code")?.textContent`)).toBe("later");
    expect(laterBack.text).not.toContain("`");

    await openView(lapsed);
    await app.until(`document.querySelector("#back .lapsed-by")`, "the back of the lapsed work item drawn");
    expect((await tabs())[0]).toEqual({ label: "Inspection sheet", active: true, closes: false });
    const lapsedBack = await backShown();
    expect(lapsedBack.text).toContain(`Lapsed by ${lapsedBy.slice(0, 7)}`);
    expect(lapsedBack.text).toContain("add avatars.ts");
    expect(lapsedBack.text).toContain("The review rounds caught nothing.");

    await openView(plain);
    expect(await tabs()).toEqual([{ label: "Shell", active: true, closes: true }]);
    expect((await backShown()).shown).toBe(false);
  });

  it("opens the view of a work item whose sidebar line is pressed, while the button is held the window takes an `inbox` that pins another work item, and the release falls on the same point, and then draws the pin with no message after it", async () => {
    // The window's own socket to the daemon is found from outside, and the case adds a listener of its own to it, which notes an `inbox` that lists the lapsed work item pinned. The page's listener was added first and runs first, so the window has taken that `inbox` when the note is made.
    const { port } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number };
    const prototype = await app.cdp<{ result: { objectId: string } }>("Runtime.evaluate", { expression: "WebSocket.prototype" });
    const found = await app.cdp<{ objects: { objectId: string } }>("Runtime.queryObjects", { prototypeObjectId: prototype.result.objectId });
    const listened = await app.cdp<{ result: { value: number } }>("Runtime.callFunctionOn", {
      objectId: found.objects.objectId,
      functionDeclaration: `function () {
        const daemon = this.filter((socket) => socket.readyState === WebSocket.OPEN && socket.url === ${JSON.stringify(`ws://127.0.0.1:${String(port)}/`)});
        window.tookPin = false;
        for (const socket of daemon) socket.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (message.type === "inbox" && message.workItems.some((workItem) => workItem.id === ${String(lapsed.id)} && workItem.pinned)) window.tookPin = true; });
        return daemon.length;
      }`,
      returnByValue: true,
    });
    expect(listened.result.value).toBe(1);
    const pinDrawn = `document.querySelector('#repositories button[data-work-item="${String(lapsed.id)}"] .line-mark.pinned') !== null`;
    // The cleared work item's view is not in front, so its line's click opens it, and the lapsed work item has no pin yet.
    expect(await app.evaluate<boolean>(viewOf(CLEARED.title))).toBe(false);
    expect(await app.evaluate<boolean>(pinDrawn)).toBe(false);

    const at = await app.evaluate<{ x: number; y: number }>(`(() => { const box = document.querySelector('#repositories button[data-work-item="${String(cleared.id)}"]').getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", buttons: 1, clickCount: 1 });
    socket?.send(JSON.stringify({ type: "setWorkItem", requestId: 5, id: lapsed.id, pinned: true }));
    await app.until("window.tookPin", "the window's socket taking the inbox that pins the lapsed work item");
    // The window took the lists, and holds their drawing while the button is down.
    const drawnWhilePressed = await app.evaluate<boolean>(pinDrawn);
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", buttons: 0, clickCount: 1 });

    await app.until(viewOf(CLEARED.title), "the view of the work item whose line was pressed");
    expect(drawnWhilePressed).toBe(false);
    // The release drew what the `inbox` carried, and no message came after it.
    await app.until(pinDrawn, "the pin on the lapsed work item's sidebar line");
  });
});
