import { describe, expect, it } from "vitest";
import {
  agentKind,
  askButton,
  changesSince,
  headlessLines,
  inboxGroups,
  inboxKey,
  inboxLine,
  inboxSummary,
  lastHere,
  moveSelection,
  notificationFor,
  paneInFront,
  paneTabs,
  selectedLine,
  stateHeading,
  summarySentence,
  tabLabel,
  withHeadless,
  workItemFields,
  type InboxLine,
} from "../src/renderer/view";
import type { HeadlessInfo, Look, PaneKindInfo, SessionInfo, WorkItem } from "../src/shared/protocol";

const LOGIN: WorkItem = {
  id: 1,
  title: "Fix the login bug",
  repo: "/r/project",
  repoName: "project",
  branch: "owlery/fix-the-login-bug",
  worktree: "/w/project/fix-the-login-bug",
  createdAt: 1234,
  baseCommit: null,
  baseBranch: null,
  newCommits: null,
  commits: null,
  changes: null,
};
const SEARCH: WorkItem = { ...LOGIN, id: 2, title: "Speed up search", branch: "owlery/speed-up-search", worktree: "/w/project/speed-up-search" };

// What the daemon offers today, as `ready` carries it.
const KINDS: PaneKindInfo[] = [
  { kind: "shell", label: "Shell", reportsState: false },
  { kind: "claude", label: "Claude Code", reportsState: true },
];

function session(id: number, fields: Partial<SessionInfo> = {}): SessionInfo {
  return { id, kind: "claude", alive: true, workItemId: 1, state: null, stateSince: null, stateText: null, stateTool: null, ...fields };
}

function headless(id: number, fields: Partial<HeadlessInfo> = {}): HeadlessInfo {
  return { id, workItemId: 1, prompt: "Which file holds the login form?", state: "working", answer: "", error: null, costUsd: null, startedAt: 1234, ...fields };
}

describe("tabLabel", () => {
  it("labels a tab with the pane's kind and id, and not with the work item's title, which the view's header says", () => {
    expect(tabLabel(session(3, { workItemId: 2 }), KINDS)).toBe("Claude Code 3");
    expect(tabLabel(session(4, { kind: "shell" }), KINDS)).toBe("Shell 4");
  });

  it("reads a kind's label from the daemon's list, whatever the daemon calls it", () => {
    const renamed: PaneKindInfo[] = [{ kind: "claude", label: "Agent", reportsState: true }];
    expect(tabLabel(session(6), renamed)).toBe("Agent 6");
  });

  it("labels a pane of a kind the list does not hold with the kind as the daemon spells it", () => {
    expect(tabLabel(session(7, { kind: "shell" }), [])).toBe("shell 7");
  });
});

describe("agentKind", () => {
  it("gives the first kind that reports its agent's state", () => {
    const two: PaneKindInfo[] = [...KINDS, { kind: "shell", label: "Second agent", reportsState: true }];
    expect(agentKind(two)).toBe("claude");
  });

  it("gives nothing where no kind reports state", () => {
    expect(agentKind([{ kind: "shell", label: "Shell", reportsState: false }])).toBeUndefined();
  });
});

describe("inboxLine", () => {
  it("says a work item's title and its branch", () => {
    expect(inboxLine(LOGIN, [], KINDS)).toEqual({ title: "Fix the login bug", branch: "owlery/fix-the-login-bug", state: null, commits: "" });
  });

  it("shows the state of the work item's most recent pane that reports state", () => {
    const sessions = [session(2, { state: "finished" }), session(4, { state: "waiting" }), session(3, { state: "working" })];
    expect(inboxLine(LOGIN, sessions, KINDS).state).toBe("waiting");
  });

  it("passes over a more recent pane of a kind that reports no state", () => {
    const sessions = [session(2, { state: "working" }), session(5, { kind: "shell" })];
    expect(inboxLine(LOGIN, sessions, KINDS).state).toBe("working");
  });

  it("passes over a pane whose process has exited, which keeps its last state", () => {
    const sessions = [session(2, { state: "finished" }), session(5, { state: "working", alive: false })];
    expect(inboxLine(LOGIN, sessions, KINDS).state).toBe("finished");
    expect(inboxLine(LOGIN, [session(5, { state: "working", alive: false })], KINDS).state).toBeNull();
  });

  it("shows no state from another work item's pane", () => {
    expect(inboxLine(LOGIN, [session(2, { workItemId: 2, state: "working" }), session(3, { workItemId: null, state: "waiting" })], KINDS).state).toBeNull();
  });

  it("counts the new commits when there are any, and says nothing of none", () => {
    expect(inboxLine({ ...LOGIN, newCommits: 1 }, [], KINDS).commits).toBe("1 new commit");
    expect(inboxLine({ ...LOGIN, newCommits: 3 }, [], KINDS).commits).toBe("3 new commits");
    expect(inboxLine({ ...LOGIN, newCommits: 0 }, [], KINDS).commits).toBe("");
    expect(inboxLine({ ...LOGIN, newCommits: null }, [], KINDS).commits).toBe("");
  });
});

describe("inboxSummary", () => {
  function line(state: InboxLine["state"]): InboxLine {
    return { title: "Fix the login bug", branch: "owlery/fix-the-login-bug", state, commits: "" };
  }

  it("counts the work items in each state in a sentence, and leaves out the lines with no state", () => {
    expect(inboxSummary([line("working"), line("waiting"), line("waiting"), line(null)])).toBe("2 waiting for you, 1 working");
  });

  it("says the state a person must act on first: waiting, then working, then finished", () => {
    expect(inboxSummary([line("finished"), line("working"), line("finished"), line("waiting")])).toBe("1 waiting for you, 1 working, 2 finished");
  });

  it("leaves out a state no work item is in", () => {
    expect(inboxSummary([line("finished"), line(null)])).toBe("1 finished");
  });

  it("is empty where no line has a state", () => {
    expect(inboxSummary([line(null), line(null)])).toBe("");
    expect(inboxSummary([])).toBe("");
  });
});

describe("stateHeading", () => {
  it("says each state in the words of its group's heading, and a line with no state as having no agent", () => {
    expect(stateHeading("waiting")).toBe("Waiting for you");
    expect(stateHeading("working")).toBe("Working");
    expect(stateHeading("finished")).toBe("Finished");
    expect(stateHeading(null)).toBe("No agent");
  });
});

describe("inboxGroups", () => {
  function entry(id: number, state: InboxLine["state"]): { id: number; line: InboxLine } {
    return { id, line: { title: `Work item ${id}`, branch: `owlery/work-item-${id}`, state, commits: "" } };
  }

  it("puts the lines under the heading of their state, the groups in the order a person acts on them and the lines with no state last", () => {
    const groups = inboxGroups([entry(1, null), entry(2, "finished"), entry(3, "working"), entry(4, "waiting")]);
    expect(groups.map((group) => [group.state, group.heading, group.entries.map((held) => held.id)])).toEqual([
      ["waiting", "Waiting for you", [4]],
      ["working", "Working", [3]],
      ["finished", "Finished", [2]],
      [null, "No agent", [1]],
    ]);
  });

  it("keeps, inside a group, the order the lines were given in", () => {
    const groups = inboxGroups([entry(5, "working"), entry(2, "waiting"), entry(9, "working"), entry(1, "waiting"), entry(3, "working")]);
    expect(groups.map((group) => group.entries.map((held) => held.id))).toEqual([
      [2, 1],
      [5, 9, 3],
    ]);
  });

  it("leaves out a group no line is in, heading and all", () => {
    expect(inboxGroups([entry(1, null), entry(2, "working")]).map((group) => group.heading)).toEqual(["Working", "No agent"]);
    expect(inboxGroups([])).toEqual([]);
  });
});

describe("selectedLine", () => {
  it("keeps the selected work item while it is listed, wherever its line now stands", () => {
    expect(selectedLine([4, 7, 2], 2)).toBe(2);
  });

  it("gives the first line where nothing is selected or the selected work item is no longer listed", () => {
    expect(selectedLine([4, 7, 2], undefined)).toBe(4);
    expect(selectedLine([4, 7, 2], 9)).toBe(4);
  });

  it("gives nothing where the inbox has no line", () => {
    expect(selectedLine([], 4)).toBeUndefined();
    expect(selectedLine([], undefined)).toBeUndefined();
  });
});

describe("moveSelection", () => {
  it("selects the next line and the one before, in the order the lines are displayed", () => {
    expect(moveSelection([4, 7, 2], 4, "next")).toBe(7);
    expect(moveSelection([4, 7, 2], 7, "next")).toBe(2);
    expect(moveSelection([4, 7, 2], 2, "previous")).toBe(7);
  });

  it("stops at each end of the list", () => {
    expect(moveSelection([4, 7, 2], 2, "next")).toBe(2);
    expect(moveSelection([4, 7, 2], 4, "previous")).toBe(4);
  });

  it("moves from the first line where the selected work item is no longer listed", () => {
    expect(moveSelection([4, 7, 2], 9, "next")).toBe(7);
    expect(moveSelection([4, 7, 2], undefined, "previous")).toBe(4);
  });

  it("selects nothing where the inbox has no line", () => {
    expect(moveSelection([], 4, "next")).toBeUndefined();
    expect(moveSelection([], undefined, "previous")).toBeUndefined();
  });
});

describe("inboxKey", () => {
  const INBOX = { inboxInFront: true, dialogOpen: false, inField: false, onControl: false };
  const plain = (code: string) => ({ code, modified: false });

  it("reads J, K and Enter by their place on the keyboard", () => {
    expect(inboxKey(plain("KeyJ"), INBOX)).toBe("next");
    expect(inboxKey(plain("KeyK"), INBOX)).toBe("previous");
    expect(inboxKey(plain("Enter"), INBOX)).toBe("open");
  });

  it("reads no other key", () => {
    expect(inboxKey(plain("KeyL"), INBOX)).toBeNull();
    expect(inboxKey(plain("ArrowDown"), INBOX)).toBeNull();
  });

  it("reads no key while another screen is in front, a dialog is open or the focus is in a field", () => {
    for (const code of ["KeyJ", "KeyK", "Enter"]) {
      expect(inboxKey(plain(code), { ...INBOX, inboxInFront: false })).toBeNull();
      expect(inboxKey(plain(code), { ...INBOX, dialogOpen: true })).toBeNull();
      expect(inboxKey(plain(code), { ...INBOX, inField: true })).toBeNull();
    }
  });

  it("reads no key pressed with a modifier key held", () => {
    for (const code of ["KeyJ", "KeyK", "Enter"]) expect(inboxKey({ code, modified: true }, INBOX)).toBeNull();
  });

  it("leaves Enter to the control that has the focus, and still moves the selection from there", () => {
    const onControl = { ...INBOX, onControl: true };
    expect(inboxKey(plain("Enter"), onControl)).toBeNull();
    expect(inboxKey(plain("KeyJ"), onControl)).toBe("next");
    expect(inboxKey(plain("KeyK"), onControl)).toBe("previous");
  });
});

describe("changesSince", () => {
  function look(workItems: WorkItem[], sessions: SessionInfo[] = []): Look {
    return { at: 1000, sessions, workItems };
  }

  it("gives a work item whose state and count of new commits both moved, with its present line and what changed in one sentence", () => {
    const before = look([{ ...LOGIN, newCommits: 1 }], [session(3, { state: "working" })]);
    const now = { ...LOGIN, newCommits: 3 };
    const changes = changesSince(before, [now], [session(3, { state: "waiting" })], KINDS);
    expect(changes).toEqual([
      { workItem: now, line: { title: "Fix the login bug", branch: "owlery/fix-the-login-bug", state: "waiting", commits: "3 new commits" }, sentence: "Waits for you. 2 new commits since you were last here." },
    ]);
    expect(summarySentence(changes)).toBe("1 waiting for you");
  });

  it("gives no change where the lists are as the look holds them", () => {
    const workItems = [{ ...LOGIN, newCommits: 2 }, { ...SEARCH, newCommits: 0 }];
    const sessions = [session(3, { state: "working" }), session(4, { kind: "shell", workItemId: 2 })];
    expect(changesSince(look(workItems, sessions), workItems, sessions, KINDS)).toEqual([]);
  });

  it("says a work item the look does not hold is new, and names no rise for it", () => {
    const changes = changesSince(look([{ ...LOGIN, newCommits: 0 }]), [{ ...LOGIN, newCommits: 0 }, { ...SEARCH, newCommits: 2 }], [session(5, { workItemId: 2, state: "finished" })], KINDS);
    expect(changes.map((change) => [change.workItem.id, change.sentence])).toEqual([[2, "Finished. New since you were last here."]]);
  });

  it("opens the sentence with the present state, in the words of each state and of none", () => {
    const before = look([LOGIN]);
    const sentence = (state: SessionInfo["state"]) => changesSince(before, [LOGIN], [session(3, { state })], KINDS)[0]?.sentence;
    expect(sentence("waiting")).toBe("Waits for you.");
    expect(sentence("working")).toBe("Is working.");
    expect(sentence("finished")).toBe("Finished.");
    // The agent's pane went away since the look.
    expect(changesSince(look([LOGIN], [session(3, { state: "working" })]), [LOGIN], [], KINDS)[0]?.sentence).toBe("No agent is running.");
  });

  it("says the rise of the new commits, of one and of several, where the state stayed", () => {
    const before = look([{ ...LOGIN, newCommits: 2 }, { ...SEARCH, newCommits: 0 }]);
    const changes = changesSince(before, [{ ...LOGIN, newCommits: 3 }, { ...SEARCH, newCommits: 4 }], [], KINDS);
    expect(changes.map((change) => change.sentence)).toEqual(["No agent is running. 1 new commit since you were last here.", "No agent is running. 4 new commits since you were last here."]);
  });

  it("gives a work item whose count fell as changed, and names no rise", () => {
    const changes = changesSince(look([{ ...LOGIN, newCommits: 3 }]), [{ ...LOGIN, newCommits: 1 }], [], KINDS);
    expect(changes.map((change) => change.sentence)).toEqual(["No agent is running."]);
  });

  it("reads a count the daemon did not give, in the look or now, as no difference in the count", () => {
    const sessions = [session(3, { state: "working" })];
    expect(changesSince(look([{ ...LOGIN, newCommits: 3 }], sessions), [{ ...LOGIN, newCommits: null }], sessions, KINDS)).toEqual([]);
    expect(changesSince(look([{ ...LOGIN, newCommits: null }], sessions), [{ ...LOGIN, newCommits: 3 }], sessions, KINDS)).toEqual([]);
    // The state still counts, and no rise is named beside it.
    const waits = changesSince(look([{ ...LOGIN, newCommits: null }], sessions), [{ ...LOGIN, newCommits: 3 }], [session(3, { state: "waiting" })], KINDS);
    expect(waits.map((change) => change.sentence)).toEqual(["Waits for you."]);
  });

  it("matches no session of the look to a present session: the same id is another pane after the daemon started again", () => {
    const before = look([LOGIN, SEARCH], [session(1, { workItemId: 1, state: "working" })]);
    const changes = changesSince(before, [LOGIN, SEARCH], [session(1, { workItemId: 2, state: "waiting" })], KINDS);
    expect(changes.map((change) => [change.workItem.id, change.sentence])).toEqual([
      [2, "Waits for you."],
      [1, "No agent is running."],
    ]);
  });

  it("puts the changes in the order a person acts on them, the ones with no state last, and keeps the given order inside a state", () => {
    const third: WorkItem = { ...LOGIN, id: 3, title: "Third" };
    const fourth: WorkItem = { ...LOGIN, id: 4, title: "Fourth" };
    const sessions = [session(5, { workItemId: 2, state: "finished" }), session(6, { workItemId: 3, state: "waiting" }), session(7, { workItemId: 4, state: "waiting" })];
    const changes = changesSince(look([]), [LOGIN, SEARCH, third, fourth], sessions, KINDS);
    expect(changes.map((change) => change.workItem.id)).toEqual([3, 4, 2, 1]);
  });
});

describe("summarySentence", () => {
  function change(state: InboxLine["state"]): { line: InboxLine } {
    return { line: { title: "Fix the login bug", branch: "owlery/fix-the-login-bug", state, commits: "" } };
  }

  it("counts the changed work items by their present state, in the inbox's order and words, and leaves out the ones with no state", () => {
    expect(summarySentence([change("finished"), change("waiting"), change(null)])).toBe("1 waiting for you, 1 finished");
    expect(summarySentence([change("working"), change("working")])).toBe("2 working");
  });

  it("says how many work items changed where none of them has a state", () => {
    expect(summarySentence([change(null)])).toBe("1 work item changed");
    expect(summarySentence([change(null), change(null)])).toBe("2 work items changed");
  });
});

describe("lastHere", () => {
  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;
  const at = 1_000_000_000;

  it("says how long ago the person was last here, in hours and minutes", () => {
    expect(lastHere(at, at + 2 * HOUR + 40 * MINUTE)).toBe("You were last here 2 h 40 min ago.");
    expect(lastHere(at, at + 2 * HOUR + 40 * MINUTE + 59_000)).toBe("You were last here 2 h 40 min ago.");
  });

  it("says minutes alone under an hour, and hours alone where no minute is over", () => {
    expect(lastHere(at, at + 12 * MINUTE)).toBe("You were last here 12 min ago.");
    expect(lastHere(at, at + 59 * MINUTE + 59_000)).toBe("You were last here 59 min ago.");
    expect(lastHere(at, at + 3 * HOUR)).toBe("You were last here 3 h ago.");
  });

  it("says less than a minute under one, and for a look the clock puts after now", () => {
    expect(lastHere(at, at + 59_000)).toBe("You were last here less than a minute ago.");
    expect(lastHere(at, at)).toBe("You were last here less than a minute ago.");
    expect(lastHere(at, at - 5 * MINUTE)).toBe("You were last here less than a minute ago.");
  });

  it("says days from a day on, one and several", () => {
    expect(lastHere(at, at + 23 * HOUR + 59 * MINUTE)).toBe("You were last here 23 h 59 min ago.");
    expect(lastHere(at, at + 24 * HOUR)).toBe("You were last here 1 day ago.");
    expect(lastHere(at, at + 71 * HOUR)).toBe("You were last here 2 days ago.");
  });
});

describe("paneTabs", () => {
  function ids(tabs: readonly SessionInfo[]): number[] {
    return tabs.map((tab) => tab.id);
  }

  it("gives the work item's live panes, of whatever kind, in the order of their ids", () => {
    const sessions = [session(6, { kind: "shell" }), session(2), session(4)];
    expect(ids(paneTabs(LOGIN, sessions, new Set()))).toEqual([2, 4, 6]);
  });

  it("gives no tab for another work item's pane or a pane without a work item, even one the window holds a terminal for", () => {
    const sessions = [session(2), session(9, { workItemId: 2 }), session(4, { workItemId: null })];
    expect(ids(paneTabs(LOGIN, sessions, new Set([9, 4])))).toEqual([2]);
  });

  it("keeps the tab of an exited pane whose terminal the window holds, and gives none for one it does not hold", () => {
    const sessions = [session(2, { alive: false }), session(3, { alive: false }), session(5)];
    expect(ids(paneTabs(LOGIN, sessions, new Set([3])))).toEqual([3, 5]);
  });

  it("gives no tab where the work item has no pane, so opening its view starts none", () => {
    expect(paneTabs(LOGIN, [session(3, { workItemId: 2 })], new Set())).toEqual([]);
    expect(paneTabs(LOGIN, [], new Set())).toEqual([]);
  });
});

describe("paneInFront", () => {
  it("keeps in front the pane that was last in front, where it is still a tab", () => {
    expect(paneInFront([session(2), session(4), session(6)], 4)).toBe(4);
    expect(paneInFront([session(2, { alive: false }), session(6)], 2)).toBe(2);
  });

  it("gives the most recent live pane where the one last in front is no longer a tab, or none was", () => {
    const tabs = [session(2), session(6), session(7, { alive: false })];
    expect(paneInFront(tabs, 9)).toBe(6);
    expect(paneInFront(tabs, undefined)).toBe(6);
  });

  it("gives the most recent tab where none is alive", () => {
    expect(paneInFront([session(2, { alive: false }), session(3, { alive: false })], undefined)).toBe(3);
  });

  it("gives nothing where there is no tab", () => {
    expect(paneInFront([], 4)).toBeUndefined();
    expect(paneInFront([], undefined)).toBeUndefined();
  });
});

describe("notificationFor", () => {
  it("names the work item and says it waits, when a session's state becomes waiting", () => {
    expect(notificationFor("working", session(3, { state: "waiting" }), false, [LOGIN], KINDS)).toEqual({ title: "Fix the login bug", body: "Waiting for you" });
  });

  it("says a session finished, when its state becomes finished", () => {
    expect(notificationFor("working", session(3, { state: "finished" }), false, [LOGIN], KINDS)).toEqual({ title: "Fix the login bug", body: "Finished" });
  });

  it("is titled with the tab's label for a pane without a work item", () => {
    expect(notificationFor(null, session(3, { workItemId: null, state: "waiting" }), false, [LOGIN], KINDS)).toEqual({ title: "Claude Code 3", body: "Waiting for you" });
  });

  it("shows nothing when the state becomes working or none", () => {
    expect(notificationFor("waiting", session(3, { state: "working" }), false, [LOGIN], KINDS)).toBeNull();
    expect(notificationFor("finished", session(3, { state: null }), false, [LOGIN], KINDS)).toBeNull();
  });

  it("shows nothing for a state the session was already in", () => {
    expect(notificationFor("waiting", session(3, { state: "waiting" }), false, [LOGIN], KINDS)).toBeNull();
    expect(notificationFor("finished", session(3, { state: "finished" }), false, [LOGIN], KINDS)).toBeNull();
  });

  it("shows nothing for the pane in front of a focused window", () => {
    expect(notificationFor("working", session(3, { state: "waiting" }), true, [LOGIN], KINDS)).toBeNull();
  });
});

describe("workItemFields", () => {
  it("gives the folder and the title without the spaces around them", () => {
    expect(workItemFields("  /r/project ", " Fix the login bug  ")).toEqual({ repo: "/r/project", title: "Fix the login bug" });
  });

  it("refuses an empty folder, so nothing is sent that the daemon would run in its own folder", () => {
    expect(workItemFields("   ", "Fix the login bug")).toEqual({ error: "Choose the repository folder." });
  });

  it("refuses an empty title", () => {
    expect(workItemFields("/r/project", " ")).toEqual({ error: "Give the work item a title." });
  });
});

describe("askButton", () => {
  it("is enabled, and says where it asks, once a prompt is typed", () => {
    expect(askButton("Which file holds the login form?", LOGIN)).toEqual({ enabled: true, title: "Ask in Fix the login bug" });
  });

  it("is disabled, and says why, while the field is empty or holds white space alone", () => {
    expect(askButton("", LOGIN)).toEqual({ enabled: false, title: "Type what to ask." });
    expect(askButton(" \n ", LOGIN)).toEqual({ enabled: false, title: "Type what to ask." });
  });
});

describe("withHeadless", () => {
  it("adds a headless session the window did not hold, after the others", () => {
    expect(withHeadless([headless(1)], headless(2))).toEqual([headless(1), headless(2)]);
  });

  it("replaces the session the window holds under the same id, in its place", () => {
    const grown = headless(1, { answer: "src/login" });
    expect(withHeadless([headless(1), headless(2)], grown)).toEqual([grown, headless(2)]);
  });
});

describe("headlessLines", () => {
  it("says each session's prompt, its state and its answer with the line breaks kept, the most recent first", () => {
    const sessions = [headless(1, { state: "finished", answer: "src/login/form.ts\nsrc/login/submit.ts" }), headless(2, { prompt: "And the tests?", answer: "test/" })];
    expect(headlessLines(sessions, 1)).toEqual([
      { id: 2, prompt: "And the tests?", state: "working", text: "test/" },
      { id: 1, prompt: "Which file holds the login form?", state: "finished", text: "src/login/form.ts\nsrc/login/submit.ts" },
    ]);
  });

  it("shows a failed session's error in place of its answer", () => {
    const failed = headless(3, { state: "failed", answer: "src/lo", error: "the session exited with code 1 and gave no result" });
    expect(headlessLines([failed], 1)).toEqual([{ id: 3, prompt: "Which file holds the login form?", state: "failed", text: "the session exited with code 1 and gave no result" }]);
  });

  it("gives the lines of the one work item alone", () => {
    const sessions = [headless(1), headless(2, { workItemId: 2 }), headless(3)];
    expect(headlessLines(sessions, 1).map((line) => line.id)).toEqual([3, 1]);
    expect(headlessLines(sessions, 2).map((line) => line.id)).toEqual([2]);
    expect(headlessLines(sessions, 3)).toEqual([]);
  });
});
