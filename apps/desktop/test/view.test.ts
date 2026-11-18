import { describe, expect, it } from "vitest";
import {
  agentKind,
  askButton,
  headlessLines,
  inboxGroups,
  inboxKey,
  inboxLine,
  inboxSummary,
  moveSelection,
  notificationFor,
  paneInFront,
  paneTabs,
  selectedLine,
  stateHeading,
  tabLabel,
  withHeadless,
  workItemFields,
  type InboxLine,
} from "../src/renderer/view";
import type { HeadlessInfo, PaneKindInfo, SessionInfo, WorkItem } from "../src/shared/protocol";

const LOGIN: WorkItem = {
  id: 1,
  title: "Fix the login bug",
  repo: "/r/project",
  branch: "owlery/fix-the-login-bug",
  worktree: "/w/project/fix-the-login-bug",
  createdAt: 1234,
  baseCommit: null,
  newCommits: null,
};
const SEARCH: WorkItem = { ...LOGIN, id: 2, title: "Speed up search", branch: "owlery/speed-up-search", worktree: "/w/project/speed-up-search" };

// What the daemon offers today, as `ready` carries it.
const KINDS: PaneKindInfo[] = [
  { kind: "shell", label: "Shell", reportsState: false },
  { kind: "claude", label: "Claude Code", reportsState: true },
];

function session(id: number, fields: Partial<SessionInfo> = {}): SessionInfo {
  return { id, kind: "claude", alive: true, workItemId: 1, state: null, ...fields };
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
