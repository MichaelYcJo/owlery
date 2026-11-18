import { describe, expect, it } from "vitest";
import { agentKind, inboxLine, notificationFor, paneToOpen, tabLabel, workItemFields } from "../src/renderer/view";
import type { PaneKindInfo, SessionInfo, WorkItem } from "../src/shared/protocol";

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

describe("tabLabel", () => {
  it("labels the tab of a work item's pane with the work item's title, then the pane", () => {
    expect(tabLabel(session(3, { workItemId: 2 }), [LOGIN, SEARCH], KINDS)).toBe("Speed up search · Claude Code 3");
    expect(tabLabel(session(4, { kind: "shell" }), [LOGIN, SEARCH], KINDS)).toBe("Fix the login bug · Shell 4");
  });

  it("labels the tab of a pane opened without a work item with the pane alone", () => {
    expect(tabLabel(session(1, { kind: "shell", workItemId: null }), [LOGIN], KINDS)).toBe("Shell 1");
    expect(tabLabel(session(2, { workItemId: null }), [LOGIN], KINDS)).toBe("Claude Code 2");
  });

  it("labels with the pane alone a tab whose work item the window does not hold", () => {
    expect(tabLabel(session(5, { kind: "shell", workItemId: 9 }), [LOGIN], KINDS)).toBe("Shell 5");
  });

  it("reads a kind's label from the daemon's list, whatever the daemon calls it", () => {
    const renamed: PaneKindInfo[] = [{ kind: "claude", label: "Agent", reportsState: true }];
    expect(tabLabel(session(6, { workItemId: null }), [], renamed)).toBe("Agent 6");
  });

  it("labels a pane of a kind the list does not hold with the kind as the daemon spells it", () => {
    expect(tabLabel(session(7, { kind: "shell", workItemId: null }), [], [])).toBe("shell 7");
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

describe("paneToOpen", () => {
  it("shows the work item's most recent live pane, of whatever kind", () => {
    const sessions = [session(2), session(6, { kind: "shell" }), session(4), session(9, { workItemId: 2 })];
    expect(paneToOpen(LOGIN, sessions, KINDS)).toEqual({ show: 6 });
  });

  it("opens a pane of the first kind that reports state where the work item has no live pane", () => {
    const sessions = [session(2, { alive: false }), session(3, { workItemId: 2 }), session(4, { workItemId: null })];
    expect(paneToOpen(LOGIN, sessions, KINDS)).toEqual({ start: "claude" });
    expect(paneToOpen(LOGIN, [], KINDS)).toEqual({ start: "claude" });
  });

  it("opens nothing where the work item has no live pane and no kind reports state", () => {
    expect(paneToOpen(LOGIN, [], [{ kind: "shell", label: "Shell", reportsState: false }])).toBeUndefined();
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
