import { describe, expect, it } from "vitest";
import {
  agentKind,
  ageOf,
  ahead,
  askButton,
  changesSince,
  commandKey,
  commitLines,
  daemonStatus,
  emptyList,
  fileLines,
  filterChoices,
  gainedSince,
  headlessLines,
  historyLines,
  inboxGroups,
  inboxKey,
  inboxLine,
  inboxSummary,
  keyHints,
  lastHere,
  lineBadge,
  lineCounts,
  lineSession,
  lineText,
  markRanges,
  matchCount,
  matchSentence,
  matchWorkItems,
  moveSelection,
  noticeWithout,
  notificationFor,
  paneInFront,
  paneTabs,
  recentKept,
  replayStep,
  screenMoves,
  screenTurns,
  selectedLine,
  sidebarTree,
  stageOf,
  stateHeading,
  stateSays,
  stateWithAge,
  summaryControls,
  summaryCount,
  summaryHead,
  summarySentence,
  tabLabel,
  tellsSize,
  viewFacts,
  withHeadless,
  workItemEntries,
  workItemFields,
  type InboxLine,
} from "../src/renderer/view";
import type { CommitInfo, HeadlessInfo, Look, PaneKindInfo, SessionInfo, WorkItem } from "../src/shared/protocol";

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
  aheadOfBase: null,
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
    const waits = session(3, { state: "waiting", stateSince: 5000 });
    const changes = changesSince(before, [now], [waits], KINDS);
    expect(changes).toEqual([
      {
        workItem: now,
        line: { title: "Fix the login bug", branch: "owlery/fix-the-login-bug", state: "waiting", commits: "3 new commits" },
        session: waits,
        sentence: "Waits for you. 2 new commits since you were last here.",
      },
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

  it("gives each change the pane its state is read from, and none where the work item has no agent", () => {
    const finished = session(4, { workItemId: 2, state: "finished", stateSince: 7000 });
    const changes = changesSince(look([]), [LOGIN, SEARCH], [session(3, { kind: "shell" }), finished], KINDS);
    expect(changes.map((change) => [change.workItem.id, change.session])).toEqual([
      [2, finished],
      [1, undefined],
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
    expect(ids(paneTabs(LOGIN, sessions))).toEqual([2, 4, 6]);
  });

  it("gives no tab for another work item's pane or a pane without a work item", () => {
    const sessions = [session(2), session(9, { workItemId: 2 }), session(4, { workItemId: null })];
    expect(ids(paneTabs(LOGIN, sessions))).toEqual([2]);
  });

  it("gives an exited pane its tab for as long as the daemon lists it, whatever the window holds", () => {
    const sessions = [session(5), session(3, { alive: false }), session(2, { alive: false })];
    expect(ids(paneTabs(LOGIN, sessions))).toEqual([2, 3, 5]);
  });

  it("gives no tab where the work item has no pane, so opening its view starts none", () => {
    expect(paneTabs(LOGIN, [session(3, { workItemId: 2 })])).toEqual([]);
    expect(paneTabs(LOGIN, [])).toEqual([]);
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

describe("stageOf", () => {
  const six = [session(1), session(2), session(3), session(4), session(5), session(6)];

  it("puts the pane in front alone on the stage where \"Side by side\" is not pressed, and nothing where the view has no tab", () => {
    expect(stageOf([session(2), session(4), session(6)], [4, 6], false)).toEqual({ front: 4, shown: [4] });
    // Pane 9 was in front and is closed, so the most recent live pane of the view follows it, whichever were in front before.
    expect(stageOf(six, [9, 2, 1, 3, 4], false)).toEqual({ front: 6, shown: [6] });
    expect(stageOf([], [4], false)).toEqual({ front: undefined, shown: [] });
    expect(stageOf([], [4], true)).toEqual({ front: undefined, shown: [] });
  });

  it("puts every pane of a view of up to four tabs on the stage where \"Side by side\" is pressed, in the tabs' order, the one last in front having the keyboard", () => {
    expect(stageOf([session(2), session(4)], [4, 2], true)).toEqual({ front: 4, shown: [2, 4] });
    expect(stageOf([session(2), session(4), session(6)], [4], true)).toEqual({ front: 4, shown: [2, 4, 6] });
    expect(stageOf([session(2), session(4), session(6), session(7)], [6, 2, 7, 4], true)).toEqual({ front: 6, shown: [2, 4, 6, 7] });
    expect(stageOf([session(2)], [2], true)).toEqual({ front: 2, shown: [2] });
  });

  it("puts the four panes most recently in front on the stage of a view with more tabs, in the tabs' order, so a pressed tab that was not shown takes the place of the shown pane least recently in front", () => {
    // Panes 3, 5, 2 and 6 are on the stage, and the tab of pane 1 is pressed.
    expect(stageOf(six, [1, 3, 5, 2, 6], true)).toEqual({ front: 1, shown: [1, 2, 3, 5] });
  });

  it("fills the stage with the tabs that were never in front, the most recent first, after the ones that were", () => {
    // After a load no pane was in front, so the most recent live pane is.
    expect(stageOf(six, [], true)).toEqual({ front: 6, shown: [3, 4, 5, 6] });
    expect(stageOf(six, [2], true)).toEqual({ front: 2, shown: [2, 4, 5, 6] });
    // No pane was in front and the four most recent tabs have exited, so the live pane is in front and on the stage.
    const oneLive = [session(1), session(2, { alive: false }), session(3, { alive: false }), session(4, { alive: false }), session(5, { alive: false })];
    expect(stageOf(oneLive, [], true)).toEqual({ front: 1, shown: [1, 3, 4, 5] });
  });

  it("gives a pane no longer among the tabs no place on the stage, so where the pane in front closed the four most recently in front stay and the most recent live one of them has the keyboard, and counts a pane named twice once", () => {
    expect(stageOf(six, [9, 2, 9, 2, 1, 3, 4], true)).toEqual({ front: 4, shown: [1, 2, 3, 4] });
    // Pane 4 has exited, so pane 3 is the most recent live one of the four.
    const exited = [session(1), session(2), session(3), session(4, { alive: false }), session(5), session(6)];
    expect(stageOf(exited, [9, 2, 1, 3, 4], true)).toEqual({ front: 3, shown: [1, 2, 3, 4] });
  });
});

describe("recentKept", () => {
  it("keeps a closed pane that was the most recent, so the most recent live pane comes in front and not the pane in front before it", () => {
    // Panes 1 and 3 run and pane 2 has exited. Pane 2 was in front, then pane 3, which is closed.
    const kept = recentKept([3, 2, 1], new Set([1, 2]));
    expect(kept).toEqual([3, 2, 1]);
    expect(stageOf([session(1), session(2, { alive: false })], kept, false)).toEqual({ front: 1, shown: [1] });
  });

  it("takes out every other pane the daemon no longer lists", () => {
    expect(recentKept([3, 9, 2, 8, 1], new Set([1, 2, 3]))).toEqual([3, 2, 1]);
    expect(recentKept([], new Set([1]))).toEqual([]);
  });
});

describe("tellsSize", () => {
  it("tells a size to a pane whose process runs", () => {
    expect(tellsSize([session(2), session(3, { alive: false })], 2)).toBe(true);
  });

  it("tells no size to a pane whose process exited, or to a pane the daemon does not list", () => {
    expect(tellsSize([session(2), session(3, { alive: false })], 3)).toBe(false);
    expect(tellsSize([session(2)], 5)).toBe(false);
  });
});

describe("screenMoves", () => {
  it("gives a pane that comes onto the stage a free screen, the first of them, before it asks for a new one", () => {
    expect(screenMoves([undefined], [4])).toEqual({ holds: [4], back: [], taken: [{ screen: 0, pane: 4 }] });
    expect(screenMoves([undefined, 3, undefined], [3, 7])).toEqual({ holds: [7, 3, undefined], back: [], taken: [{ screen: 0, pane: 7 }] });
  });

  it("asks for a new screen, one past the pool's end, only where none is free", () => {
    expect(screenMoves([], [4])).toEqual({ holds: [4], back: [], taken: [{ screen: 0, pane: 4 }] });
    expect(screenMoves([2], [2, 5])).toEqual({ holds: [2, 5], back: [], taken: [{ screen: 1, pane: 5 }] });
  });

  it("keeps a pane that stays on the stage on the screen it has, in whatever order the stage names it", () => {
    expect(screenMoves([2, 3], [3, 2])).toEqual({ holds: [2, 3], back: [], taken: [] });
  });

  it("names the screen of each pane that left the stage to give back, and hands it to a pane that comes on", () => {
    expect(screenMoves([2], [5])).toEqual({ holds: [5], back: [{ screen: 0, pane: 2 }], taken: [{ screen: 0, pane: 5 }] });
    expect(screenMoves([2, undefined, 3], [])).toEqual({
      holds: [undefined, undefined, undefined],
      back: [
        { screen: 0, pane: 2 },
        { screen: 2, pane: 3 },
      ],
      taken: [],
    });
  });
});

describe("replayStep", () => {
  it("drops output that arrives before the last replay asked for, writes that replay alone, and writes the output after it, where a pane was attached, detached and attached again before either replay arrived", () => {
    const first = replayStep(2, "replay");
    expect(first).toEqual({ awaited: 1, write: false });
    const between = replayStep(first.awaited, "output");
    expect(between).toEqual({ awaited: 1, write: false });
    const second = replayStep(between.awaited, "replay");
    expect(second).toEqual({ awaited: 0, write: true });
    expect(replayStep(second.awaited, "output")).toEqual({ awaited: 0, write: true });
  });

  it("writes no replay the window did not ask for", () => {
    expect(replayStep(0, "replay")).toEqual({ awaited: 0, write: false });
  });
});

describe("screenTurns", () => {
  /**
   * A terminal as xterm.js is one: it draws what it was handed later, in
   * order, and runs a piece's callback once the piece is drawn. A piece that
   * holds "?" is a question a program asks, which the terminal answers while
   * it draws it. `sent` is each answer and each key with the pane it went to.
   */
  function screen() {
    const handed: { data: string; drawn?: () => void }[] = [];
    const sent: [number, string][] = [];
    const turns = screenTurns({ write: (data, drawn) => handed.push({ data, drawn }) });
    const hands = (data: string): void => {
      const to = turns.receiver();
      if (to !== undefined) sent.push([to, data]);
    };
    return {
      turns,
      sent,
      /** What the terminal has still to draw. */
      waiting: () => handed.map((piece) => piece.data),
      /** A person presses a key in the terminal. */
      types: hands,
      /** The terminal draws the next `count` pieces, or all of them. */
      draws(count = handed.length): void {
        for (const piece of handed.splice(0, count)) {
          if (piece.data.includes("?")) hands(`answer to ${piece.data}`);
          piece.drawn?.();
        }
      },
    };
  }

  it("sends what a person types and what the terminal answers to the pane on the screen, and nothing from a free screen", () => {
    const { turns, sent, types, draws } = screen();
    types("a");
    turns.take(4);
    draws();
    expect(turns.pane).toBe(4);
    types("b");
    turns.write("where?", true);
    draws();
    turns.giveBack();
    expect(turns.pane).toBeUndefined();
    types("c");
    draws();
    types("d");
    expect(sent).toEqual([
      [4, "b"],
      [4, "answer to where?"],
    ]);
  });

  it("sends no pane the answer to a question of the pane that held the screen before it, which the terminal draws after the screen passed on", () => {
    const { turns, sent, draws } = screen();
    turns.take(4);
    draws();
    turns.write("where?", true);
    // The press that hands the screen from pane 4 to pane 5 comes before the terminal has drawn pane 4's question.
    turns.giveBack();
    turns.take(5);
    draws();
    expect(sent).toEqual([]);
    turns.write("which?", true);
    draws();
    expect(sent).toEqual([[5, "answer to which?"]]);
  });

  it("sends nothing a person types until the terminal has drawn what it was handed before the pane on the screen took it", () => {
    const { turns, sent, types, draws } = screen();
    turns.take(4);
    draws();
    turns.write("a long piece", true);
    turns.giveBack();
    turns.take(5);
    types("a");
    // The piece of pane 4 and the reset are drawn, and the screen has not reached pane 5's turn yet.
    draws(2);
    types("b");
    draws();
    types("c");
    expect(sent).toEqual([[5, "c"]]);
  });

  it("sends a pane no answer to what it or another pane printed in an earlier turn on the screen, where it took the screen again before the terminal drew that", () => {
    const { turns, sent, draws } = screen();
    turns.take(4);
    draws();
    turns.write("where?", true);
    turns.giveBack();
    turns.take(5);
    turns.write("which?", true);
    turns.giveBack();
    turns.take(4);
    draws();
    expect(sent).toEqual([]);
    turns.write("what?", true);
    draws();
    expect(sent).toEqual([[4, "answer to what?"]]);
  });

  it("sends nothing while the terminal draws a piece whose answers are not sent, and sends again once it is drawn", () => {
    const { turns, sent, types, draws } = screen();
    turns.take(4);
    draws();
    turns.write("where?", false);
    types("a");
    draws();
    types("b");
    expect(sent).toEqual([[4, "b"]]);
  });

  it("empties the terminal after what the pane that leaves has still to draw, and before what the next pane prints", () => {
    const { turns, waiting, draws } = screen();
    turns.take(4);
    draws();
    turns.write("of pane 4", true);
    turns.giveBack();
    turns.take(5);
    turns.write("of pane 5", true);
    expect(waiting()).toEqual(["of pane 4", "\u001bc", "", "of pane 5"]);
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

describe("lineSession", () => {
  it("gives the pane a line reads its state from, and nothing where no live pane of the work item reports one", () => {
    const sessions = [session(2, { state: "finished" }), session(4, { state: "waiting", stateSince: 900 }), session(5, { kind: "shell" })];
    expect(lineSession(LOGIN, sessions, KINDS)).toBe(sessions[1]);
    expect(lineSession(SEARCH, sessions, KINDS)).toBeUndefined();
  });
});

describe("workItemEntries", () => {
  it("gives each work item with its line and the pane the line reads, in the daemon's order", () => {
    const sessions = [session(3, { workItemId: 2, state: "working" })];
    expect(workItemEntries([LOGIN, SEARCH], sessions, KINDS)).toEqual([
      { workItem: LOGIN, line: inboxLine(LOGIN, sessions, KINDS), session: undefined },
      { workItem: SEARCH, line: inboxLine(SEARCH, sessions, KINDS), session: sessions[0] },
    ]);
  });
});

describe("sidebarTree", () => {
  const DOCS: WorkItem = { ...LOGIN, id: 3, title: "Write the guide", repo: "/r/docs", repoName: "docs", branch: "owlery/write-the-guide" };

  it("lists each repository that has a work item, in the order of its first one, with its name, its count and its work items in the daemon's order", () => {
    const sessions = [session(4, { workItemId: 2, state: "waiting" })];
    const tree = sidebarTree([LOGIN, DOCS, SEARCH], sessions, KINDS);
    expect(tree.map((repository) => [repository.repo, repository.name, repository.count, repository.entries.map((entry) => entry.workItem.id)])).toEqual([
      ["/r/project", "project", 2, [1, 2]],
      ["/r/docs", "docs", 1, [3]],
    ]);
    expect(tree[0]?.entries[1]?.line.state).toBe("waiting");
  });

  it("keeps two repositories of one name apart, each under its own folder", () => {
    const other: WorkItem = { ...SEARCH, repo: "/elsewhere/project" };
    expect(sidebarTree([LOGIN, other], [], KINDS).map((repository) => [repository.repo, repository.name, repository.count])).toEqual([
      ["/r/project", "project", 1],
      ["/elsewhere/project", "project", 1],
    ]);
  });

  it("names a repository as the daemon names it", () => {
    expect(sidebarTree([{ ...LOGIN, repoName: "the project" }], [], KINDS).map((repository) => repository.name)).toEqual(["the project"]);
  });

  it("names a repository by the last part of its folder where the daemon sent no name, as one of an earlier build does", () => {
    const unnamed = { ...LOGIN, repo: "/r/older/", repoName: undefined } as unknown as WorkItem;
    expect(sidebarTree([unnamed], [], KINDS).map((repository) => repository.name)).toEqual(["older"]);
  });

  it("lists nothing where no work item is given", () => {
    expect(sidebarTree([], [], KINDS)).toEqual([]);
  });

  it("marks in each title the letters a search matches, and none where nothing is typed or the match stands elsewhere", () => {
    const titles = (query: string) => sidebarTree([LOGIN, SEARCH, DOCS], [], KINDS, query).flatMap((repository) => repository.entries.map((entry) => [entry.line.title, entry.marks]));
    // "search" stands in the second title and in its branch, and the sidebar draws no branch.
    expect(titles("SEARCH")).toEqual([["Speed up search", [[9, 15]]]]);
    // "docs" is the name of the third work item's repository, so its title stays plain.
    expect(titles("docs")).toEqual([["Write the guide", []]]);
    expect(titles("")).toEqual([
      ["Fix the login bug", []],
      ["Speed up search", []],
      ["Write the guide", []],
    ]);
  });

  it("counts under a repository the work items a search and a filter leave, and leaves out a repository none of whose work items is left", () => {
    const sessions = [session(4, { workItemId: 2, state: "waiting" }), session(5, { workItemId: 3, state: "waiting" })];
    const counts = (query: string, state: Parameters<typeof sidebarTree>[4]) =>
      sidebarTree([LOGIN, SEARCH, DOCS], sessions, KINDS, query, state).map((repository) => [repository.name, repository.count, repository.entries.map((entry) => entry.workItem.id)]);
    expect(counts("login", "all")).toEqual([["project", 1, [1]]]);
    expect(counts("", "waiting")).toEqual([
      ["project", 1, [2]],
      ["docs", 1, [3]],
    ]);
    expect(counts("the", "waiting")).toEqual([["docs", 1, [3]]]);
    expect(counts("nowhere", "all")).toEqual([]);
  });
});

describe("historyLines", () => {
  const third: WorkItem = { ...LOGIN, id: 3, title: "Third" };
  const fourth: WorkItem = { ...LOGIN, id: 4, title: "Fourth" };

  it("gives the work items whose agent finished alone, the one that finished last first", () => {
    const sessions = [
      session(5, { workItemId: 1, state: "finished", stateSince: 100 }),
      session(6, { workItemId: 2, state: "working", stateSince: 400 }),
      session(7, { workItemId: 3, state: "finished", stateSince: 300 }),
    ];
    expect(historyLines(workItemEntries([LOGIN, SEARCH, third, fourth], sessions, KINDS)).map((entry) => entry.workItem.id)).toEqual([3, 1]);
  });

  it("keeps the given order where two finished at the same time, and puts last one whose time the daemon did not send", () => {
    const sessions = [
      session(5, { workItemId: 1, state: "finished" }),
      session(6, { workItemId: 2, state: "finished", stateSince: 200 }),
      session(7, { workItemId: 3, state: "finished", stateSince: 200 }),
      session(8, { workItemId: 4, state: "finished", stateSince: 500 }),
    ];
    expect(historyLines(workItemEntries([LOGIN, SEARCH, third, fourth], sessions, KINDS)).map((entry) => entry.workItem.id)).toEqual([4, 2, 3, 1]);
  });
});

describe("markRanges", () => {
  it("gives every place what is typed stands in a text, in any case of letters", () => {
    expect(markRanges("Session store for sessions", "sess")).toEqual([
      [0, 4],
      [18, 22],
    ]);
    expect(markRanges("owlery/fix-the-login-bug", "LOGIN")).toEqual([[15, 20]]);
  });

  it("gives no place where nothing is typed or the text does not hold it", () => {
    expect(markRanges("Fix the login bug", "")).toEqual([]);
    expect(markRanges("Fix the login bug", "search")).toEqual([]);
  });

  it("marks no letter twice where what is typed overlaps itself", () => {
    expect(markRanges("aaaa", "aa")).toEqual([
      [0, 2],
      [2, 4],
    ]);
    expect(markRanges("aaa", "aa")).toEqual([[0, 2]]);
  });
});

describe("matchWorkItems", () => {
  const DOCS: WorkItem = { ...LOGIN, id: 3, title: "Write the guide", repo: "/r/docs", repoName: "docs", branch: "owlery/write-the-guide" };
  const sessions = [session(4, { workItemId: 1, state: "waiting" }), session(5, { workItemId: 2, state: "working" }), session(6, { workItemId: 3, state: "finished" })];
  const FOURTH: WorkItem = { ...LOGIN, id: 4, title: "Tidy up", branch: "owlery/tidy-up" };
  const ids = (query: string, state: Parameters<typeof matchWorkItems>[2]) =>
    matchWorkItems(workItemEntries([LOGIN, SEARCH, DOCS, FOURTH], sessions, KINDS), query, state).map((entry) => entry.workItem.id);

  it("leaves the work items whose title, branch or repository's name holds what is typed, in any case of letters", () => {
    // The first stands in a title alone, and the second in a branch alone.
    expect(ids("The LOGIN", "all")).toEqual([1]);
    expect(ids("speed-up", "all")).toEqual([2]);
    expect(ids("Docs", "all")).toEqual([3]);
    expect(ids("owlery/", "all")).toEqual([1, 2, 3, 4]);
    expect(ids("nowhere", "all")).toEqual([]);
  });

  it("matches nothing else of a work item: not its folder and not its worktree", () => {
    expect(ids("/r/", "all")).toEqual([]);
    expect(ids("/w/", "all")).toEqual([]);
  });

  it("leaves every work item where nothing is typed and every state is chosen", () => {
    expect(ids("", "all")).toEqual([1, 2, 3, 4]);
  });

  it("leaves the work items of the one state chosen, and of no state where that is chosen", () => {
    expect(ids("", "waiting")).toEqual([1]);
    expect(ids("", "working")).toEqual([2]);
    expect(ids("", "finished")).toEqual([3]);
    expect(ids("", "none")).toEqual([4]);
  });

  it("narrows by what is typed and by the state together", () => {
    expect(ids("project", "working")).toEqual([2]);
    expect(ids("docs", "working")).toEqual([]);
  });

  it("reads a repository's name from its folder where the daemon sent none", () => {
    const unnamed = { ...LOGIN, repo: "/r/older", repoName: undefined } as unknown as WorkItem;
    expect(matchWorkItems(workItemEntries([unnamed], [], KINDS), "older", "all")).toHaveLength(1);
  });
});

describe("matchCount and matchSentence", () => {
  it("says how many work items match, of how many", () => {
    expect(matchCount(3, 10)).toBe("3 of 10");
  });

  it("says the same in words, with what was typed and where it was looked for", () => {
    expect(matchSentence(3, 10, "sess")).toBe('3 of 10 work items match "sess" in title, branch or repository');
    expect(matchSentence(0, 1, "x")).toBe('0 of 1 work item matches "x" in title, branch or repository');
  });
});

describe("filterChoices", () => {
  it("offers every state at once and then each group's heading, in the inbox's order", () => {
    expect(filterChoices()).toEqual([
      { value: "all", label: "All" },
      { value: "waiting", label: "Waiting for you" },
      { value: "working", label: "Working" },
      { value: "finished", label: "Finished" },
      { value: "none", label: "No agent" },
    ]);
  });
});

describe("emptyList", () => {
  it("says nothing where the list has a line", () => {
    expect(emptyList("inbox", 3, 1)).toBe("");
    expect(emptyList("history", 1, 1)).toBe("");
  });

  it("says that a search or a filter left no work item, where the screen has some without them", () => {
    expect(emptyList("inbox", 3, 0)).toBe("No work item matches.");
    expect(emptyList("history", 2, 0)).toBe("No work item matches.");
  });

  it("says in each screen's own sentence that it has no line at all", () => {
    expect(emptyList("inbox", 0, 0)).toBe("No work items yet.");
    expect(emptyList("history", 0, 0)).toBe("Nothing has finished yet.");
  });
});

describe("summaryControls", () => {
  function change(id: number, state: InboxLine["state"]): { workItem: WorkItem; line: InboxLine } {
    return { workItem: { ...LOGIN, id }, line: { title: "Fix the login bug", branch: "owlery/fix-the-login-bug", state, commits: "" } };
  }

  it("makes answering the first work item that waits the main control, with the inbox beside it", () => {
    expect(summaryControls([change(4, "finished"), change(7, "waiting"), change(9, "waiting")])).toEqual({
      main: { label: "Answer the first question", opens: 7 },
      second: { label: "Open the inbox", opens: "inbox" },
      hint: "Enter opens the first that waits.",
    });
  });

  it("makes the inbox the main control and the only one where no changed work item waits, or none changed", () => {
    const alone = { main: { label: "Open the inbox", opens: "inbox" }, second: null, hint: "Enter opens it." };
    expect(summaryControls([change(4, "finished"), change(5, "working"), change(6, null)])).toEqual(alone);
    expect(summaryControls([])).toEqual(alone);
  });
});

describe("summaryHead", () => {
  const waits = [{ line: { title: "Fix the login bug", branch: "owlery/fix-the-login-bug", state: "waiting", commits: "" } satisfies InboxLine }];

  it("is the summary's sentence where a work item changed", () => {
    expect(summaryHead(true, waits)).toBe("1 waiting for you");
  });

  it("says that nothing changed where a look is recorded and no work item changed", () => {
    expect(summaryHead(true, [])).toBe("Nothing changed since you were last here.");
  });

  it("says that no look is recorded where none is", () => {
    expect(summaryHead(false, [])).toBe("No earlier look is recorded.");
  });
});

describe("summaryCount", () => {
  it("says how many work items changed, and nothing where none did", () => {
    expect(summaryCount(3)).toBe("3 new");
    expect(summaryCount(1)).toBe("1 new");
    expect(summaryCount(0)).toBe("");
  });
});

describe("daemonStatus", () => {
  it("says that the daemon runs and how many agents run: the live panes of a kind that reports its state", () => {
    const sessions = [session(1), session(2, { state: "working" }), session(3, { kind: "shell" }), session(4, { alive: false, state: "finished" })];
    expect(daemonStatus(sessions, KINDS)).toBe("Daemon running, 2 agents");
    expect(daemonStatus([session(1)], KINDS)).toBe("Daemon running, 1 agent");
  });

  it("says that no agent runs where none does", () => {
    expect(daemonStatus([session(3, { kind: "shell" }), session(4, { alive: false })], KINDS)).toBe("Daemon running, no agent");
    expect(daemonStatus([], KINDS)).toBe("Daemon running, no agent");
  });
});

describe("noticeWithout", () => {
  it("takes a notice back where the status line still tells it, and leaves any other as it stands", () => {
    expect(noticeWithout("The theme could not be saved.", "The theme could not be saved.")).toBe("");
    // A request the daemon refused since then stays.
    expect(noticeWithout("The repository is not a git repository.", "The theme could not be saved.")).toBe("The repository is not a git repository.");
    expect(noticeWithout("", "The theme could not be saved.")).toBe("");
  });
});

describe("commandKey", () => {
  const plain = { code: "KeyK", meta: false, ctrl: false, alt: false, shift: false };
  const free = { mac: true, dialogOpen: false };

  it("reads K with the Command key as the search's key, by the key's place on the keyboard", () => {
    expect(commandKey({ ...plain, meta: true }, free)).toBe("search");
    expect(commandKey({ ...plain, code: "KeyJ", meta: true }, free)).toBeNull();
  });

  it("reads N with the Command key as the key that opens the \"New work item\" form, and with the Control key where the keyboard has no Command key", () => {
    expect(commandKey({ ...plain, code: "KeyN", meta: true }, free)).toBe("new");
    expect(commandKey({ ...plain, code: "KeyN", ctrl: true }, { ...free, mac: false })).toBe("new");
    expect(commandKey({ ...plain, code: "KeyN", ctrl: true }, free)).toBeNull();
    expect(commandKey({ ...plain, code: "KeyN" }, free)).toBeNull();
    expect(commandKey({ ...plain, code: "KeyN", meta: true }, { ...free, dialogOpen: true })).toBeNull();
    expect(commandKey({ ...plain, code: "KeyN", meta: true, shift: true }, free)).toBeNull();
  });

  it("reads K with the Control key where the keyboard has no Command key, and not where it has one", () => {
    expect(commandKey({ ...plain, ctrl: true }, { ...free, mac: false })).toBe("search");
    expect(commandKey({ ...plain, ctrl: true }, free)).toBeNull();
    expect(commandKey({ ...plain, meta: true }, { ...free, mac: false })).toBeNull();
    expect(commandKey({ ...plain, meta: true, ctrl: true }, { ...free, mac: false })).toBeNull();
  });

  it("reads no key while a dialog is open, with no modifier key, or with another one held as well", () => {
    expect(commandKey({ ...plain, meta: true }, { ...free, dialogOpen: true })).toBeNull();
    expect(commandKey(plain, free)).toBeNull();
    expect(commandKey({ ...plain, meta: true, shift: true }, free)).toBeNull();
    expect(commandKey({ ...plain, meta: true, alt: true }, free)).toBeNull();
    expect(commandKey({ ...plain, meta: true, ctrl: true }, free)).toBeNull();
  });
});

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const NOW = 1_000_000_000_000;

function commit(hash: string, subject: string, fields: Partial<CommitInfo> = {}): CommitInfo {
  return { hash, subject, at: NOW - 5 * MINUTE, added: 1, removed: 0, ...fields };
}

describe("ageOf", () => {
  it("says how long ago a time is, in the words of the sentence of the last look: minutes, hours and minutes, or days", () => {
    expect(ageOf(NOW - 12 * MINUTE, NOW)).toBe("12 min");
    expect(ageOf(NOW - (2 * HOUR + 40 * MINUTE), NOW)).toBe("2 h 40 min");
    expect(ageOf(NOW - 3 * HOUR, NOW)).toBe("3 h");
    expect(ageOf(NOW - 49 * HOUR, NOW)).toBe("2 days");
    expect(ageOf(NOW - 30_000, NOW)).toBe("less than a minute");
    expect(lastHere(NOW - 12 * MINUTE, NOW)).toBe(`You were last here ${ageOf(NOW - 12 * MINUTE, NOW)} ago.`);
  });

  it("says nothing where there is no time: a pane with no state, and a daemon of an earlier build, which sends none", () => {
    expect(ageOf(null, NOW)).toBe("");
    expect(ageOf(undefined, NOW)).toBe("");
  });
});

describe("stateWithAge", () => {
  it("says the state in its heading's words and how long it has lasted", () => {
    expect(stateWithAge("waiting", NOW - 12 * MINUTE, NOW)).toBe("Waiting for you, 12 min");
    expect(stateWithAge("finished", NOW - 3 * HOUR, NOW)).toBe("Finished, 3 h");
  });

  it("says the state alone where it has no time, and that no agent runs where there is no state", () => {
    expect(stateWithAge("working", null, NOW)).toBe("Working");
    expect(stateWithAge(null, null, NOW)).toBe("No agent");
  });
});

describe("stateSays", () => {
  it("gives a finished agent's last message under the label of its pane's kind and the word said", () => {
    expect(stateSays(session(3, { state: "finished", stateText: "The login form is fixed." }), KINDS)).toEqual({ head: "Claude Code said", text: "The login form is fixed." });
  });

  it("gives what a waiting agent tells the person under the word asks", () => {
    expect(stateSays(session(3, { state: "waiting", stateText: "May I run the tests?" }), KINDS)).toEqual({ head: "Claude Code asks", text: "May I run the tests?" });
  });

  it("says which tool a waiting agent asks for where its event carried the tool's name and no text", () => {
    expect(stateSays(session(3, { state: "waiting", stateTool: "Bash" }), KINDS)).toEqual({ head: "Claude Code asks", text: "Asks to use Bash" });
    expect(stateSays(session(3, { state: "waiting", stateText: "May I?", stateTool: "Bash" }), KINDS)?.text).toBe("May I?");
  });

  it("names a tool for a waiting agent alone", () => {
    expect(stateSays(session(3, { state: "finished", stateTool: "Bash" }), KINDS)).toBeNull();
    expect(stateSays(session(3, { state: "working", stateTool: "Bash" }), KINDS)).toBeNull();
  });

  it("gives nothing where the pane carries neither, where it has no state and where the work item has no such pane", () => {
    expect(stateSays(session(3, { state: "waiting" }), KINDS)).toBeNull();
    expect(stateSays(session(3, { stateText: "left over" }), KINDS)).toBeNull();
    expect(stateSays(undefined, KINDS)).toBeNull();
  });

  it("reads the label from the daemon's list, and gives the kind as the daemon spells it where the list does not hold it", () => {
    expect(stateSays(session(3, { state: "finished", stateText: "Done." }), [{ kind: "claude", label: "The agent", reportsState: true }])?.head).toBe("The agent said");
    expect(stateSays(session(3, { state: "finished", stateText: "Done." }), [])?.head).toBe("claude said");
  });

  it("gives nothing for a pane of a daemon of an earlier build, which sends neither field", () => {
    const { stateText: _text, stateTool: _tool, ...old } = session(3, { state: "waiting" });
    expect(stateSays(old as SessionInfo, KINDS)).toBeNull();
  });
});

describe("lineText", () => {
  const two = { ...LOGIN, newCommits: 2, commits: [commit("b2b2b2b", "Check the token"), commit("a1a1a1a", "Add the form")] };

  it("says what the agent's state carried where it carried a text or, while it waits, a tool's name", () => {
    expect(lineText(two, session(3, { state: "waiting", stateText: "May I run the tests?" }), false)).toEqual({ says: "state", text: "May I run the tests?" });
    expect(lineText(two, session(3, { state: "waiting", stateTool: "Bash" }), false)).toEqual({ says: "state", text: "Asks to use Bash" });
  });

  it("says the newest commit's subject where the state carried nothing, and for a work item with no agent", () => {
    expect(lineText(two, session(3, { state: "working" }), false)).toEqual({ says: "commit", text: "Check the token" });
    expect(lineText(two, undefined, false)).toEqual({ says: "commit", text: "Check the token" });
  });

  it("says the branch where there is no commit, none was read, or the daemon is of an earlier build and sends none", () => {
    const branch = { says: "branch", text: "owlery/fix-the-login-bug" };
    expect(lineText({ ...LOGIN, commits: [] }, undefined, false)).toEqual(branch);
    expect(lineText(LOGIN, undefined, false)).toEqual(branch);
    const { commits: _commits, ...old } = LOGIN;
    expect(lineText(old as WorkItem, undefined, false)).toEqual(branch);
  });

  it("says the branch while a search is typed, whatever else it could say, so that the letters that match in it show", () => {
    expect(lineText(two, session(3, { state: "waiting", stateText: "May I run the tests?" }), true)).toEqual({ says: "branch", text: "owlery/fix-the-login-bug" });
  });
});

describe("gainedSince and lineBadge", () => {
  function look(workItems: WorkItem[]): Look {
    return { at: 1000, sessions: [], workItems };
  }

  it("counts the commits a branch gained since the look, and says them as a line's badge", () => {
    const before = look([{ ...LOGIN, newCommits: 1 }]);
    expect(gainedSince({ ...LOGIN, newCommits: 3 }, before)).toBe(2);
    expect(lineBadge({ ...LOGIN, newCommits: 3 }, before)).toBe("2 new");
    expect(lineBadge({ ...LOGIN, newCommits: 2 }, before)).toBe("1 new");
  });

  it("counts every commit of a work item the look does not hold, which was made since", () => {
    expect(gainedSince({ ...SEARCH, newCommits: 4 }, look([{ ...LOGIN, newCommits: 1 }]))).toBe(4);
  });

  it("gives none, and no badge, where the branch gained none, lost some, or no look is recorded", () => {
    const before = look([{ ...LOGIN, newCommits: 3 }]);
    expect(lineBadge({ ...LOGIN, newCommits: 3 }, before)).toBe("");
    expect(gainedSince({ ...LOGIN, newCommits: 1 }, before)).toBe(0);
    expect(gainedSince({ ...LOGIN, newCommits: 3 }, null)).toBe(0);
    expect(lineBadge({ ...LOGIN, newCommits: 3 }, null)).toBe("");
  });

  it("reads a count the daemon did not give, in the look or now, as no gain", () => {
    expect(gainedSince({ ...LOGIN, newCommits: null }, look([{ ...LOGIN, newCommits: 3 }]))).toBe(0);
    expect(gainedSince({ ...LOGIN, newCommits: 3 }, look([{ ...LOGIN, newCommits: null }]))).toBe(0);
    expect(gainedSince({ ...SEARCH, newCommits: null }, look([]))).toBe(0);
  });
});

describe("ahead", () => {
  it("says how many commits the branch is ahead of its base, as a sentence and as the base's fact", () => {
    expect(ahead({ ...LOGIN, baseBranch: "main", aheadOfBase: 6, newCommits: 6 })).toEqual({ sentence: "6 commits ahead of main", fact: "main · 6 ahead" });
    expect(ahead({ ...LOGIN, baseBranch: "main", aheadOfBase: 1, newCommits: 1 })).toEqual({ sentence: "1 commit ahead of main", fact: "main · 1 ahead" });
    expect(ahead({ ...LOGIN, baseBranch: "main", aheadOfBase: 0, newCommits: 0 })).toEqual({ sentence: "0 commits ahead of main", fact: "main · 0 ahead" });
  });

  it("counts the commits the base branch does not hold, and not the commits since the cut, which hold the base's own once the base was merged in", () => {
    expect(ahead({ ...LOGIN, baseBranch: "main", aheadOfBase: 2, newCommits: 9 })).toEqual({ sentence: "2 commits ahead of main", fact: "main · 2 ahead" });
    // The base took the branch: ahead by none, though the branch holds as many commits since its cut as before.
    expect(ahead({ ...LOGIN, baseBranch: "main", aheadOfBase: 0, newCommits: 9 })).toEqual({ sentence: "0 commits ahead of main", fact: "main · 0 ahead" });
  });

  it("says the count of the commits since the cut, alone, where no base branch is recorded", () => {
    expect(ahead({ ...LOGIN, baseBranch: null, newCommits: 3 })).toEqual({ sentence: "3 commits ahead", fact: "3 ahead" });
  });

  it("says no count where the daemon read none: the base branch alone as the fact, and that nothing is recorded where there is neither", () => {
    expect(ahead({ ...LOGIN, baseBranch: "main", aheadOfBase: null, newCommits: null })).toEqual({ sentence: "", fact: "main" });
    // A base branch that is gone leaves no count ahead of it, though the commits since the cut are counted.
    expect(ahead({ ...LOGIN, baseBranch: "main", aheadOfBase: null, newCommits: 3 })).toEqual({ sentence: "", fact: "main" });
    // A daemon of an earlier build sends no such field.
    const { aheadOfBase: _none, ...earlier } = { ...LOGIN, baseBranch: "main", newCommits: 3 };
    expect(ahead(earlier as WorkItem)).toEqual({ sentence: "", fact: "main" });
    expect(ahead(LOGIN)).toEqual({ sentence: "", fact: "Not recorded" });
  });
});

describe("lineCounts", () => {
  it("says the lines added and removed", () => {
    expect(lineCounts(12, 3)).toBe("+12 \u22123");
    expect(lineCounts(0, 0)).toBe("+0 \u22120");
  });

  it("says nothing where git counted no lines, as for a binary file", () => {
    expect(lineCounts(null, null)).toBe("");
  });
});

describe("commitLines", () => {
  const three = [commit("c3c3c3c", "Pin the redirect", { at: NOW - 5 * MINUTE, added: 4, removed: 1 }), commit("b2b2b2b", "Check the token", { at: NOW - 2 * HOUR }), commit("a1a1a1a", "Add the form", { added: null, removed: null })];

  it("gives each commit, newest first as the daemon sends them, with its hash, its subject, its lines and its age", () => {
    expect(commitLines({ ...LOGIN, newCommits: 3, commits: three }, 0, NOW)).toEqual({
      lines: [
        { hash: "c3c3c3c", subject: "Pin the redirect", counts: "+4 \u22121", age: "5 min", gained: false },
        { hash: "b2b2b2b", subject: "Check the token", counts: "+1 \u22120", age: "2 h", gained: false },
        { hash: "a1a1a1a", subject: "Add the form", counts: "", age: "5 min", gained: false },
      ],
      foot: "",
    });
  });

  it("marks the commits the branch gained since the look, which are the newest ones", () => {
    expect(commitLines({ ...LOGIN, newCommits: 3, commits: three }, 2, NOW)?.lines.map((line) => line.gained)).toEqual([true, true, false]);
  });

  it("says how many more commits the branch holds than the daemon sent, one and several", () => {
    expect(commitLines({ ...LOGIN, newCommits: 25, commits: three }, 0, NOW)?.foot).toBe("22 more commits");
    expect(commitLines({ ...LOGIN, newCommits: 4, commits: three }, 0, NOW)?.foot).toBe("1 more commit");
    expect(commitLines({ ...LOGIN, newCommits: null, commits: three }, 0, NOW)?.foot).toBe("");
  });

  it("says that the branch holds no commit where it holds none", () => {
    expect(commitLines({ ...LOGIN, newCommits: 0, commits: [] }, 0, NOW)).toEqual({ lines: [], foot: "No commit yet." });
  });

  it("gives nothing where the daemon read no commits, or is of an earlier build and sends none", () => {
    expect(commitLines(LOGIN, 0, NOW)).toBeNull();
    const { commits: _commits, ...old } = LOGIN;
    expect(commitLines(old as WorkItem, 0, NOW)).toBeNull();
  });
});

describe("fileLines", () => {
  const list = [
    { path: "src/login.ts", added: 10, removed: 2 },
    { path: "assets/logo.png", added: null, removed: null },
  ];

  it("gives each changed file with its lines, under the count of the files and the sums of their lines", () => {
    expect(fileLines({ ...LOGIN, changes: { files: 2, added: 10, removed: 2, list } })).toEqual({
      sum: "2 files, +10 \u22122",
      lines: [
        { path: "src/login.ts", counts: "+10 \u22122" },
        { path: "assets/logo.png", counts: "" },
      ],
      foot: "",
    });
    expect(fileLines({ ...LOGIN, changes: { files: 1, added: 1, removed: 0, list: list.slice(0, 1) } })?.sum).toBe("1 file, +1 \u22120");
  });

  it("says how many more files the branch changed than the daemon sent, one and several", () => {
    expect(fileLines({ ...LOGIN, changes: { files: 64, added: 900, removed: 30, list } })?.foot).toBe("62 more files");
    expect(fileLines({ ...LOGIN, changes: { files: 3, added: 11, removed: 2, list } })?.foot).toBe("1 more file");
  });

  it("says that no file changed where the branch changed none", () => {
    expect(fileLines({ ...LOGIN, changes: { files: 0, added: 0, removed: 0, list: [] } })).toEqual({ sum: "", lines: [], foot: "No file changed yet." });
  });

  it("gives nothing where the daemon read no changes, or is of an earlier build and sends none", () => {
    expect(fileLines(LOGIN)).toBeNull();
    const { changes: _changes, ...old } = LOGIN;
    expect(fileLines(old as WorkItem)).toBeNull();
  });
});

describe("viewFacts", () => {
  const item = { ...LOGIN, createdAt: NOW - 2 * HOUR, baseBranch: "main", aheadOfBase: 6, newCommits: 8 };

  it("gives the agent, when the work item was started, its base and its worktree, in that order", () => {
    const entries = workItemEntries([item], [session(3, { state: "working" })], KINDS);
    expect(entries.map((entry) => viewFacts(entry, KINDS, NOW))).toEqual([
      [
        { label: "Agent", value: "Claude Code" },
        { label: "Started", value: "2 h ago" },
        { label: "Base", value: "main · 6 ahead" },
        { label: "Worktree", value: "/w/project/fix-the-login-bug" },
      ],
    ]);
  });

  it("says that the work item has no agent where no live pane of it reports a state", () => {
    const entries = workItemEntries([item], [session(3, { kind: "shell" })], KINDS);
    expect(entries.map((entry) => viewFacts(entry, KINDS, NOW)[0])).toEqual([{ label: "Agent", value: "None" }]);
  });
});

describe("keyHints", () => {
  it("says the keys of a list under its preview: the two that move through it, and the one that opens the form", () => {
    expect(keyHints("inbox", true)).toEqual(["J K move through the inbox", "\u2318N opens a new work item"]);
    expect(keyHints("history", true)[0]).toBe("J K move through the history");
  });

  it("names the Control key where the keyboard has no Command key", () => {
    expect(keyHints("inbox", false)[1]).toBe("Ctrl N opens a new work item");
  });
});
