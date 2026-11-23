// The decisions made without asking, the questions a work item is parked
// with and a seal given since the look, in the built app. No message of the
// protocol records a decision or parks a work item, so the case writes both
// before the app starts. The daemon's run folder holds `repositories.json`
// with four work items of a temporary repository, `record-times.json` with
// the times the blocks were first read at, and `last-look.json` with what
// the person has seen: one decision of the first work item, the answered
// question of the third, and the fourth with no seal. Each of the first
// three work items' worktrees holds its directory with its record: for the
// first two decisions that stand, one a stage applied after its reversal
// and a block the reader refuses; for the second the questions it is parked
// with; for the third an answered question and a refused block alone. The
// fourth records the commit its branch was cut at, so the daemon reads its
// branch, and its branch holds the records of a seal, committed with git
// before the app starts as a chain commits them. The last case commits once
// more in its worktree, which breaks the seal. The login shell is a script
// that names no CLI, and the case opens no pane. The last case archives the
// second work item as a second client of the daemon. The page's `Notification`
// is replaced by one that does nothing, so the broken seal's notification
// does not reach the system's.
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RECORD_FILE, type DecisionRecord, readDecisionRecord, withAnswer, withApplied, withDecision, withQuestion, withReversal } from "../src/daemon/decision-record";
import { MARKER } from "../src/daemon/records-place";
import type { ClientMessage, ServerMessage } from "../src/shared/protocol";
import { BuiltApp, buildApp } from "./built-app";
import { commitSeal } from "./chain-run";
import { commitFile, git, temporaryRepository } from "./repositories";

const DECISION = { kind: "default", decided: "Start the branch from main.", grounds: "frame/questions.md Q1 states main as its default.", by: "orchestrator" } as const;
/** A decision a person reversed before the app started, and a stage then took the reversal in. */
const APPLIED = { kind: "scope", decided: "Leave the phone's screen out.", grounds: "docs/roadmap.md, Milestones, row 3." } as const;
const EARLIER_MESSAGE = "Keep the phone's screen in.";
/** A decision made since the person last looked. */
const LATER = { kind: "route", decided: "Run the review chain.", grounds: "routing.md names it in its Review row." } as const;
/** The question the third work item was parked with, answered before the person last looked. */
const SETTLED = { asks: "May the build use the network?", grounds: "Only the person can allow it.", by: "crafter" } as const;
/** A block the record's reader refuses: a decision with no `decided:` line. */
const REFUSED = "```seal\ndecision: 9 scope\n```\n";
const QUESTIONS = [
  { asks: "Which base does the branch merge into?", grounds: "No document names the base of a hotfix.", by: "sealer", options: [{ label: "main", implies: "It waits for the next release." }, { label: "release/v0.0.2", implies: "It ships with this release." }], default: "release/v0.0.2" },
  { asks: "Squash or merge?", grounds: "The repository's config names neither.", by: "sealer", options: [{ label: "squash", implies: "One commit reaches the base." }, { label: "merge", implies: "Every commit stays." }] },
];
const MESSAGE = "기본값 말고 release에서 시작해 주세요";
const TYPED = "둘 다 아니고, rebase로";

describe("the decisions and the questions in the built app", { timeout: 60_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;
  /** The commit the fourth work item's seal binds, once the case has committed its records. */
  let sealedAt = "";

  /** The directory of the work item whose worktree and branch are named `name`. */
  const directoryOf = (name: string): string => join(made.root, name, "seal", "threads", `1-${name}`);
  /** The record of that work item as its file reads now. */
  const recordOf = (name: string): DecisionRecord => readDecisionRecord(readFileSync(join(directoryOf(name), RECORD_FILE), "utf8"));
  /** The 1-based line of the refused block's opener in that work item's record. */
  const refusedAt = (name: string): number => readFileSync(join(directoryOf(name), RECORD_FILE), "utf8").split("\n").indexOf("decision: 9 scope");
  const text = (selector: string): Promise<string | null> => app.evaluate(`document.querySelector(${JSON.stringify(selector)})?.textContent ?? null`);
  const texts = (selector: string): Promise<string[]> => app.evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})].map((element) => element.textContent)`);
  /** Where the keyboard is: the element's id, or its name, class or tag, and for a radio button whether it is the one chosen. */
  const keyboardOn = (): Promise<{ on: string; value: string; checked: boolean; question: string | null }> =>
    app.evaluate(`(() => { const e = document.activeElement; return { on: e?.id || e?.name || e?.className || e?.tagName || "", value: e?.value ?? "", checked: e?.checked === true, question: e?.closest?.("[data-question]")?.dataset.question ?? null }; })()`);

  /** A key pressed and let go. It types nothing. */
  async function press(code: string, virtualKey: number): Promise<void> {
    const key = { code, key: code, windowsVirtualKeyCode: virtualKey };
    await app.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", ...key });
    await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", ...key });
  }
  const tab = (): Promise<void> => press("Tab", 9);

  /** Opens the view of a work item by a click on its line in the inbox. */
  async function openView(workItemId: number, title: string): Promise<void> {
    await app.click("#nav-inbox");
    await app.until(`document.getElementById("inbox-screen").hidden === false`, "the inbox");
    await app.click(`#inbox-lines button[data-work-item="${workItemId}"]`);
    await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(title)}`, `the view of ${title}`);
  }

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    // The login shell names no CLI and a pane it would start ends at once.
    const shell = join(made.base, "shell");
    writeFileSync(shell, "#!/bin/sh\nexit 0\n");
    chmodSync(shell, 0o755);
    const workItem = (id: number, title: string, name: string) => {
      const worktree = join(made.root, name);
      git(made.repo, "worktree", "add", "--quiet", "-b", `owlery/${name}`, worktree);
      // The work item's directory, uncommitted: the records root with its marker, the routing that names the branch, and the record.
      mkdirSync(directoryOf(name), { recursive: true });
      writeFileSync(join(worktree, "seal", "README.md"), `${MARKER}\n`);
      writeFileSync(join(directoryOf(name), "routing.md"), `| Axis | Answer |\n|---|---|\n| Review | through the review chain |\n| Destination | open the pull request |\n| Branch | owlery/${name} |\n`);
      return { id, title, branch: `owlery/${name}`, worktree, createdAt: Date.now() - 60 * 60_000, baseCommit: null as string | null, baseBranch: null, pinned: false, muted: false, groupId: null, archivedAt: null };
    };
    const first = workItem(1, "Alpha", "alpha");
    const second = workItem(2, "Beta", "beta");
    const third = workItem(3, "Gamma", "gamma");
    // The fourth is cut from the repository's one commit, which it records, and its branch is sealed by the records a chain commits: its routing, round 1, the broad gate's run and the sealer's verdict.
    const cutAt = git(made.repo, "rev-parse", "HEAD").trim();
    const fourth = { ...workItem(4, "Delta", "delta"), baseCommit: cutAt };
    sealedAt = commitSeal(fourth.worktree, { workItem: "1-delta", branch: fourth.branch, base: cutAt });
    writeFileSync(join(directoryOf("alpha"), RECORD_FILE), withDecision(withApplied(withReversal(withDecision(withDecision("", DECISION), APPLIED), 2, EARLIER_MESSAGE), 2, "abc1234"), LATER) + REFUSED);
    writeFileSync(join(directoryOf("beta"), RECORD_FILE), QUESTIONS.reduce(withQuestion, ""));
    writeFileSync(join(directoryOf("gamma"), RECORD_FILE), withAnswer(withQuestion("", SETTLED), 1, "yes") + REFUSED);
    const asked = Date.now() - 5 * 60_000;
    const repository = { id: 1, folder: made.repo, name: null, icon: null, defaultBase: null, hidden: false, addedAt: Date.now() - 60 * 60_000, groups: [], workItems: [first, second, third, fourth] };
    // A work item as the look holds it: the fields the daemon lists it with, and what the person saw of its record.
    const seen = (item: typeof first, record: Record<string, unknown>) => ({ ...item, repoId: 1, repo: made.repo, repoName: "repo", aheadOfBase: null, newCommits: null, commits: null, changes: null, decisions: [], questions: [], unread: [], ...record });
    const look = {
      at: Date.now() - 30 * 60_000,
      sessions: [],
      workItems: [
        seen(first, { decisions: [{ id: 1, kind: "default", says: DECISION.decided, grounds: DECISION.grounds, by: "orchestrator", state: "decided", reversal: null, landed: null, since: null }, { id: 2, kind: "scope", says: APPLIED.decided, grounds: APPLIED.grounds, by: null, state: "applied", reversal: EARLIER_MESSAGE, landed: "abc1234", since: null }] }),
        seen(second, {}),
        seen(third, { questions: [{ id: 1, asks: SETTLED.asks, grounds: SETTLED.grounds, by: "crafter", options: [], default: null, answer: "yes", since: null }] }),
        // The daemon had read the fourth's branch at the look, and its head held no seal.
        seen(fourth, { seal: null }),
      ],
    };
    app = await BuiltApp.start(
      { SHELL: shell, OWLERY_WORKTREES: made.root },
      {
        writeRun: (runDir) => {
          writeFileSync(join(runDir, "repositories.json"), JSON.stringify({ nextWorkItemId: 5, nextRepositoryId: 2, nextGroupId: 1, repositories: [repository] }));
          // The daemon read the two questions five minutes ago, as its own file of the times says, the first decision as made an hour ago, the second as applied three minutes ago and the third as made twelve minutes ago.
          const times = { 1: { 1: { state: "decided", since: Date.now() - 60 * 60_000 }, 2: { state: "applied", since: Date.now() - 3 * 60_000 }, 3: { state: "decided", since: Date.now() - 12 * 60_000 } }, 2: { 1: { state: "open", since: asked }, 2: { state: "open", since: asked } } };
          writeFileSync(join(runDir, "record-times.json"), JSON.stringify({ workItems: times }));
          writeFileSync(join(runDir, "last-look.json"), JSON.stringify(look));
        },
      },
    );
    // The app starts in the background, and the page of a window without the system's focus moves no keyboard.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    // A seal that breaks raises a notification, and none of this run reaches the system's.
    await app.evaluate(`window.Notification = class { static permission = "granted"; }`);
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    made?.remove();
  }, 30_000);

  it("opens on the summary with the seal given since the look counted first and its line first, the decision the look does not hold counted apart, shows on the lines the count of the decisions not yet seen and a parked work item's question, lists every decision in its view, the last first, with who decided, its age and what became of one that no longer stands, names the line of the record that was not read, reverses a decision with a typed message, takes the answers of the parked one by the keyboard alone, draws no section for a question the look holds as answered, and commits each word as a commit of the record alone", async () => {
    // The look holds two of the first work item's three decisions, no question of the second and no seal of the fourth, so one decision is new, the parked work item changed and the fourth's seal was given. Where the daemon's `ready` went out before it read the fourth's branch, the seal joins the summary at the lists that follow.
    await app.until(`document.getElementById("summary-screen").hidden === false`, "the summary");
    await app.until(`document.getElementById("summary-sentence").textContent === "1 sealed, 1 needs you. 1 decision made without asking."`, "the summary's sentence with the seal given");
    expect(await texts("#summary-lines button .title")).toEqual(["Delta", "Beta", "Alpha"]);
    await app.click("#nav-inbox");
    await app.until(`document.querySelectorAll("#inbox-lines button[data-work-item]").length === 4`, "the four lines of the inbox");
    // The parked work item waits for the person, so its line stands first, under the group's head, and says its first question. The sealed one has finished.
    expect(await texts("#inbox-lines button[data-work-item] .first .title")).toEqual(["Beta", "Delta", "Alpha", "Gamma"]);
    expect(await text("#inbox-summary")).toBe("1 needs you, 1 finished");
    expect(await text(`#inbox-lines button[data-work-item="2"] .second .says`)).toBe("Which base does the branch merge into? (and 1 more question)");
    expect(await text(`#inbox-lines button[data-work-item="2"] .second .decided`)).toBe("");
    // Two decisions of the first stand as made, and the look holds one of them.
    expect(await text(`#inbox-lines button[data-work-item="1"] .second .decided`)).toBe("1 decision without asking");
    expect(await text(`#inbox-lines button[data-work-item="3"] .second .decided`)).toBe("");

    // The filter's last choice leaves the work item with a decision the person may still act on.
    expect(await texts("#inbox-screen select option")).toEqual(["All", "Needs you", "Working", "Finished", "Asleep", "Decided without asking"]);
    await app.evaluate(`(() => { const filter = document.querySelector("#inbox-screen select"); filter.value = "decided"; filter.dispatchEvent(new Event("change", { bubbles: true })); })()`);
    await app.until(`document.querySelectorAll("#inbox-lines button[data-work-item]").length === 1`, "the one line the filter leaves");
    expect(await texts("#inbox-lines button[data-work-item] .first .title")).toEqual(["Alpha"]);
    await app.evaluate(`(() => { const filter = document.querySelector("#inbox-screen select"); filter.value = "all"; filter.dispatchEvent(new Event("change", { bubbles: true })); })()`);
    await app.until(`document.querySelectorAll("#inbox-lines button[data-work-item]").length === 4`, "the four lines again");

    // The view of the first lists every decision, the look's and the new one alike, the last of the record first: the applied one with the commit and the person's message, and each that stands with "Reverse".
    await openView(1, "Alpha");
    expect(await app.evaluate(`document.getElementById("questions").hidden`)).toBe(true);
    expect(await text("#view-detail .decisions h3")).toBe("Decided without asking");
    expect(await texts("#view-detail .decisions li.decision > .what, #view-detail .decisions li.decision > .grounds")).toEqual(["Run the review chain.", "Grounds: routing.md names it in its Review row.", "Leave the phone's screen out.", "Grounds: docs/roadmap.md, Milestones, row 3.", "Start the branch from main.", "Grounds: frame/questions.md Q1 states main as its default."]);
    expect(await texts("#view-detail .decisions li.decision .row > *")).toEqual(["Route", "", "12 min", "Reverse", "Scope chosen", "", "3 min", "Default taken", "Decided by orchestrator", "1 h", "Reverse"]);
    expect(await texts("#view-detail .decisions li.decision.reversed > .reversal, #view-detail .decisions li.decision.reversed > .message")).toEqual(["Applied in abc1234", EARLIER_MESSAGE]);
    // Under the list, the line of the record the reader refused, with the reader's reason.
    expect(await texts("#view-detail .decisions .unread")).toEqual([`Line ${refusedAt("alpha")} of decisions.md was not read: the decision block holds no \`decided:\` line, and it holds one`]);
    const before = refusedAt("alpha");
    await app.click("#view-detail .decisions li.decision:last-child button");
    await app.until(`document.getElementById("reverse-dialog").open`, "the dialog that reverses a decision");
    expect(await text("#reverse-decision")).toBe("Default taken: Start the branch from main.");
    expect((await keyboardOn()).on).toBe("reverse-message");
    await app.cdp("Input.insertText", { text: `  ${MESSAGE} ` });
    await app.click("#reverse-submit");
    await app.until(`!document.getElementById("reverse-dialog").open`, "the dialog closed at the daemon's done");
    await app.until(`document.querySelectorAll("#view-detail .decisions li.decision.reversed").length === 2`, "the decision as reversed");
    expect(await texts("#view-detail .decisions li.reversed .reversal, #view-detail .decisions li.reversed .message")).toEqual(["Applied in abc1234", EARLIER_MESSAGE, "Reversed", MESSAGE]);
    expect(await texts("#view-detail .decisions li.decision button")).toEqual(["Reverse"]);
    expect(recordOf("alpha")).toMatchObject({ decisions: [{ id: 1, ...DECISION, state: { is: "reversed", message: MESSAGE } }, { id: 2, state: { is: "applied", message: EARLIER_MESSAGE, commit: "abc1234" } }, { id: 3, state: { is: "decided" } }], questions: [], refusals: [{ line: before + 1 }] });
    // The reversal gave the first block a line, so the refused block stands one line lower, and the view names it there.
    expect(await texts("#view-detail .decisions .unread")).toEqual([`Line ${before + 1} of decisions.md was not read: the decision block holds no \`decided:\` line, and it holds one`]);

    // The view of the second holds the questions, the first one's default chosen.
    await openView(2, "Beta");
    expect(await app.evaluate(`document.getElementById("questions").hidden`)).toBe(false);
    expect(await text("#questions-head")).toBe("Waiting for your answer");
    expect(await text("#questions-age")).toBe("Asked 5 min ago");
    expect(await app.evaluate(`document.getElementById("questions").classList.contains("waiting")`)).toBe(true);
    expect(await texts("#questions fieldset[data-question] legend")).toEqual(["Which base does the branch merge into?", "Squash or merge?"]);
    expect(await texts("#questions fieldset[data-question] > .by, #questions fieldset[data-question] > .grounds")).toEqual(["Asked by sealer", "Grounds: No document names the base of a hotfix.", "Asked by sealer", "Grounds: The repository's config names neither."]);
    expect(await texts(`#questions fieldset[data-question="1"] label.option`)).toEqual(["mainIt waits for the next release.", "release/v0.0.2DefaultIt ships with this release.", "Another answer"]);
    const chosen = (): Promise<(string | null)[]> => app.evaluate(`[1, 2].map((id) => document.querySelector('#questions input[name="question-' + id + '"]:checked')?.value ?? null)`);
    expect(await chosen()).toEqual(["1", null]);

    // From here the keyboard alone: Tab reaches the first question's chosen option, the arrow chooses the one above it.
    for (let presses = 0; presses < 80 && (await keyboardOn()).on !== "question-1"; presses++) await tab();
    expect(await keyboardOn()).toEqual({ on: "question-1", value: "1", checked: true, question: "1" });
    await press("ArrowUp", 38);
    expect(await chosen()).toEqual(["0", null]);
    // Tab passes the first question's field for another answer and the second question's options, and words typed in its field choose "Another answer".
    for (let presses = 0; presses < 10 && !(await keyboardOn().then((at) => at.on === "other-answer" && at.question === "2")); presses++) await tab();
    expect(await keyboardOn()).toMatchObject({ on: "other-answer", question: "2" });
    await app.cdp("Input.insertText", { text: TYPED });
    expect(await chosen()).toEqual(["0", "other"]);
    // Tab reaches "Send answers", and Enter presses it.
    await tab();
    expect((await keyboardOn()).on).toBe("questions-submit");
    await app.cdp("Input.dispatchKeyEvent", { type: "keyDown", windowsVirtualKeyCode: 13, code: "Enter", key: "Enter", text: "\r" });
    await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 13, code: "Enter", key: "Enter" });
    await app.until(`document.getElementById("questions-head").textContent === "Answered"`, "the section as answered");
    expect(await text("#questions-error")).toBe("");
    expect(await app.evaluate(`document.getElementById("questions").classList.contains("waiting")`)).toBe(false);
    expect(await texts("#questions-list .question .asks, #questions-list .question .answer")).toEqual(["Which base does the branch merge into?", "main", "Squash or merge?", TYPED]);
    expect(await app.evaluate(`document.getElementById("questions-submit").hidden`)).toBe(true);
    expect(recordOf("beta")).toMatchObject({ decisions: [], questions: [{ id: 1, asks: QUESTIONS[0]!.asks, state: { is: "answered", answer: "main" } }, { id: 2, asks: QUESTIONS[1]!.asks, state: { is: "answered", answer: TYPED } }], refusals: [] });

    // The record of the third holds an answered question that the look holds as answered, so its view draws no section of questions, and a refused block alone, which the view names under the decisions' head with no decision.
    await openView(3, "Gamma");
    expect(await app.evaluate(`document.getElementById("questions").hidden`)).toBe(true);
    expect(recordOf("gamma")).toMatchObject({ questions: [{ id: 1, state: { is: "answered", answer: "yes" } }] });
    expect(await text("#view-detail .decisions h3")).toBe("Decided without asking");
    expect(await texts("#view-detail .decisions li.decision")).toEqual([]);
    expect(await texts("#view-detail .decisions .unread")).toEqual([`Line ${refusedAt("gamma")} of decisions.md was not read: the decision block holds no \`decided:\` line, and it holds one`]);

    // Once answered, the line no longer waits and says its question no more, and the first's mark counts the decision not yet seen and the reversal that waits for a stage.
    await app.click("#nav-inbox");
    await app.until(`document.getElementById("inbox-screen").hidden === false`, "the inbox");
    expect(await text("#inbox-summary")).toBe("1 finished");
    expect(await text(`#inbox-lines button[data-work-item="2"] .second .says`)).not.toContain("Which base");
    expect(await text(`#inbox-lines button[data-work-item="1"] .second .decided`)).toBe("1 decision without asking, 1 reversed");

    // No session works in either work item, so the daemon committed each word: one commit on the work item's branch, of the record alone, with the trailer that names the work item's directory.
    for (const [name, subject] of [["alpha", "chore: record the person's reversal of decision 1"], ["beta", "chore: record the person's answers"]] as const) {
      const worktree = join(made.root, name);
      const newest = (): string => git(worktree, "log", "-1", "--format=%s%n%b").trim();
      // The commit is made after the daemon's `done`, so the case waits for it.
      for (let waits = 0; waits < 50 && newest().split("\n")[0] !== subject; waits++) await new Promise((resolve) => setTimeout(resolve, 100));
      expect(newest()).toBe(`${subject}\nSeal-Routing: 1-${name}`);
      expect(git(worktree, "show", "--name-only", "--format=", "HEAD").trim()).toBe(`seal/threads/1-${name}/${RECORD_FILE}`);
      expect(git(worktree, "rev-list", "--count", "HEAD").trim()).toBe("2");
    }
  });

  it("says the present of each line of the summary: the seal given since the look, then broken by a commit while the summary is in front, which draws its sentence, its line and the line's seal again and leaves the keyboard on the line it was on, and no line of a work item archived since, which the sidebar's count leaves out", async () => {
    const delta = `#summary-lines button[data-work-item="4"]`;
    const at = sealedAt.slice(0, 7);
    // The summary is one step away from the inbox the last case left in front, and the work items it lists are the load's: the sealed one first, then the two whose lists changed. The second one's questions are answered since, so it no longer needs the person: its line says its state alone and stands after the first's, in the daemon's order, and the sentence no longer counts it.
    await app.click("#nav-summary");
    await app.until(`document.getElementById("summary-screen").hidden === false`, "the summary");
    expect(await text("#summary-sentence")).toBe("1 sealed. 1 decision made without asking.");
    expect(await texts("#summary-lines button .title")).toEqual(["Delta", "Alpha", "Beta"]);
    expect(await text(`${delta} .change`)).toBe(`Sealed at ${at} after 1 review round.`);
    expect(await app.evaluate(`document.querySelector('${delta} .seal').dataset.seal`)).toBe("sealed");
    // The keyboard on the sealed line, as a person's Tab puts it there.
    await app.evaluate(`document.querySelector('${delta}').focus()`);

    // One more commit on the sealed branch, which the daemon reads as it moves the head.
    commitFile(join(made.root, "delta"), "delta.txt");
    await app.until(`document.querySelector('${delta} .seal')?.dataset.seal === "broken"`, "the line's seal broken in the summary in front");
    expect(await app.evaluate(`document.getElementById("summary-screen").hidden`)).toBe(false);
    expect(await text("#summary-sentence")).toBe("1 seal broken. 1 decision made without asking.");
    expect(await texts("#summary-lines button .title")).toEqual(["Delta", "Alpha", "Beta"]);
    expect(await text(`${delta} .change`)).toBe(`Seal broken. \`delta.txt\` changed after the sealed commit \`${at}\`.`);
    expect(await app.evaluate(`document.querySelector('${delta} .seal').getAttribute("aria-label")`)).toBe(`Seal broken, sealed at ${at}`);
    expect(await app.evaluate(`document.activeElement === document.querySelector('${delta}')`)).toBe(true);
    // The sidebar counts the lines the summary draws.
    expect(await text("#nav-summary-count")).toBe("3 new");

    // The third line's work item archived, by a second client of the daemon: the summary draws no line for it, the sidebar counts one line fewer, and the keyboard stays on the sealed line.
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    try {
      await new Promise<void>((resolve, reject) => {
        socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })));
        socket.addEventListener("message", (event) => {
          const message = JSON.parse(String(event.data)) as ServerMessage;
          if (message.type === "ready") socket.send(JSON.stringify({ type: "archiveWorkItem", requestId: 1, id: 2, running: { panes: [], headless: [] } } satisfies ClientMessage));
          if (message.type === "done" && message.requestId === 1) resolve();
          if (message.type === "error" && message.requestId === 1) reject(new Error(`the daemon archived nothing: ${message.message}`));
        });
      });
    } finally {
      socket.close();
    }
    await app.until(`document.querySelectorAll("#summary-lines button[data-work-item]").length === 2`, "the summary without the archived work item's line");
    expect(await texts("#summary-lines button .title")).toEqual(["Delta", "Alpha"]);
    expect(await text("#summary-sentence")).toBe("1 seal broken. 1 decision made without asking.");
    expect(await text("#nav-summary-count")).toBe("2 new");
    expect(await app.evaluate(`document.activeElement === document.querySelector('${delta}')`)).toBe(true);
  });
});
