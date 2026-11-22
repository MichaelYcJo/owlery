// The decisions made without asking and the questions a work item is parked
// with, in the built app. No message of the protocol records a decision or
// parks a work item, so the case writes both before the app starts: the
// daemon's run folder holds `repositories.json` with two work items of a
// temporary repository and `record-times.json` with the time the questions
// were first read at, and each work item's worktree holds its directory with
// its record, a decision for the first and the questions the second is
// parked with. The login shell is a script that names no CLI, and the case
// opens no pane.
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RECORD_FILE, type DecisionRecord, readDecisionRecord, withDecision, withQuestion } from "../src/daemon/decision-record";
import { MARKER } from "../src/daemon/records-place";
import { BuiltApp, buildApp } from "./built-app";
import { git, temporaryRepository } from "./repositories";

const DECISION = { kind: "default", decided: "Start the branch from main.", grounds: "frame/questions.md Q1 states main as its default." } as const;
const QUESTIONS = [
  { asks: "Which base does the branch merge into?", grounds: "No document names the base of a hotfix.", by: "sealer", options: [{ label: "main", implies: "It waits for the next release." }, { label: "release/v0.0.2", implies: "It ships with this release." }], default: "release/v0.0.2" },
  { asks: "Squash or merge?", grounds: "The repository's config names neither.", by: "sealer", options: [{ label: "squash", implies: "One commit reaches the base." }, { label: "merge", implies: "Every commit stays." }] },
];
const MESSAGE = "기본값 말고 release에서 시작해 주세요";
const TYPED = "둘 다 아니고, rebase로";

describe("the decisions and the questions in the built app", { timeout: 60_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;

  /** The directory of the work item whose worktree and branch are named `name`. */
  const directoryOf = (name: string): string => join(made.root, name, "seal", "threads", `1-${name}`);
  /** The record of that work item as its file reads now. */
  const recordOf = (name: string): DecisionRecord => readDecisionRecord(readFileSync(join(directoryOf(name), RECORD_FILE), "utf8"));
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
      return { id, title, branch: `owlery/${name}`, worktree, createdAt: Date.now() - 60 * 60_000, baseCommit: null, baseBranch: null, pinned: false, muted: false, groupId: null, archivedAt: null };
    };
    const first = workItem(1, "Alpha", "alpha");
    const second = workItem(2, "Beta", "beta");
    writeFileSync(join(directoryOf("alpha"), RECORD_FILE), withDecision("", DECISION));
    writeFileSync(join(directoryOf("beta"), RECORD_FILE), QUESTIONS.reduce(withQuestion, ""));
    const asked = Date.now() - 5 * 60_000;
    const repository = { id: 1, folder: made.repo, name: null, icon: null, defaultBase: null, hidden: false, addedAt: Date.now() - 60 * 60_000, groups: [], workItems: [first, second] };
    app = await BuiltApp.start(
      { SHELL: shell, OWLERY_WORKTREES: made.root },
      {
        writeRun: (runDir) => {
          writeFileSync(join(runDir, "repositories.json"), JSON.stringify({ nextWorkItemId: 3, nextRepositoryId: 2, nextGroupId: 1, repositories: [repository] }));
          // The daemon read the two questions five minutes ago, as its own file of the times says.
          writeFileSync(join(runDir, "record-times.json"), JSON.stringify({ workItems: { 2: { 1: { state: "open", since: asked }, 2: { state: "open", since: asked } } } }));
        },
      },
    );
    // The app starts in the background, and the page of a window without the system's focus moves no keyboard.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    made?.remove();
  }, 30_000);

  it("shows the mark of a decision and a parked work item's question on their lines, lists the decision in its view and reverses it with a typed message, and takes the answers of the parked one by the keyboard alone", async () => {
    await app.click("#nav-inbox");
    await app.until(`document.querySelectorAll("#inbox-lines button[data-work-item]").length === 2`, "the two lines of the inbox");
    // The parked work item waits for the person, so its line stands first, under the group's head, and says its first question.
    expect(await texts("#inbox-lines button[data-work-item] .first .title")).toEqual(["Beta", "Alpha"]);
    expect(await text("#inbox-summary")).toBe("1 waiting for you");
    expect(await text(`#inbox-lines button[data-work-item="2"] .second .says`)).toBe("Which base does the branch merge into? (and 1 more question)");
    expect(await text(`#inbox-lines button[data-work-item="2"] .second .decided`)).toBe("");
    expect(await text(`#inbox-lines button[data-work-item="1"] .second .decided`)).toBe("1 decision without asking");

    // The view of the first lists the decision, and "Reverse" with a typed message leaves it reversed in the work item's record.
    await openView(1, "Alpha");
    expect(await app.evaluate(`document.getElementById("questions").hidden`)).toBe(true);
    expect(await text("#view-detail .decisions h3")).toBe("Decided without asking");
    expect(await texts("#view-detail .decisions li.decision > .what, #view-detail .decisions li.decision > .grounds")).toEqual(["Start the branch from main.", "Grounds: frame/questions.md Q1 states main as its default."]);
    expect(await texts("#view-detail .decisions li.decision .kind, #view-detail .decisions li.decision button")).toEqual(["Default taken", "Reverse"]);
    await app.click("#view-detail .decisions li.decision button");
    await app.until(`document.getElementById("reverse-dialog").open`, "the dialog that reverses a decision");
    expect(await text("#reverse-decision")).toBe("Default taken: Start the branch from main.");
    expect((await keyboardOn()).on).toBe("reverse-message");
    await app.cdp("Input.insertText", { text: `  ${MESSAGE} ` });
    await app.click("#reverse-submit");
    await app.until(`!document.getElementById("reverse-dialog").open`, "the dialog closed at the daemon's done");
    await app.until(`document.querySelector("#view-detail .decisions li.decision.reversed")`, "the decision as reversed");
    expect(await text("#view-detail .decisions li.reversed .message")).toBe(MESSAGE);
    expect(await texts("#view-detail .decisions li.decision button")).toEqual([]);
    expect(recordOf("alpha")).toMatchObject({ decisions: [{ id: 1, ...DECISION, state: { is: "reversed", message: MESSAGE } }], questions: [], refusals: [] });

    // The view of the second holds the questions, the first one's default chosen.
    await openView(2, "Beta");
    expect(await app.evaluate(`document.getElementById("questions").hidden`)).toBe(false);
    expect(await text("#questions-head")).toBe("Waiting for your answer");
    expect(await text("#questions-by")).toBe("Asked by sealer, 5 min ago");
    expect(await texts("#questions fieldset[data-question] legend")).toEqual(["Which base does the branch merge into?", "Squash or merge?"]);
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
    expect(await texts("#questions-list .question .asks, #questions-list .question .answer")).toEqual(["Which base does the branch merge into?", "main", "Squash or merge?", TYPED]);
    expect(await app.evaluate(`document.getElementById("questions-submit").hidden`)).toBe(true);
    expect(recordOf("beta")).toMatchObject({ decisions: [], questions: [{ id: 1, asks: QUESTIONS[0]!.asks, state: { is: "answered", answer: "main" } }, { id: 2, asks: QUESTIONS[1]!.asks, state: { is: "answered", answer: TYPED } }], refusals: [] });

    // Once answered, the line no longer waits and says its question no more, and the other keeps no mark of a decision that stands.
    await app.click("#nav-inbox");
    await app.until(`document.getElementById("inbox-screen").hidden === false`, "the inbox");
    expect(await text("#inbox-summary")).toBe("");
    expect(await text(`#inbox-lines button[data-work-item="2"] .second .says`)).not.toContain("Which base");
    expect(await text(`#inbox-lines button[data-work-item="1"] .second .decided`)).toBe("");
  });
});
