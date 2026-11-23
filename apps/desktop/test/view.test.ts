import { describe, expect, it } from "vitest";
import {
  agentKind,
  ageOf,
  ahead,
  archivalOf,
  archivedHead,
  archivedIn,
  answersFor,
  approvalPlaces,
  askButton,
  askedSection,
  asksFetch,
  BASE_ANSWER_MS,
  baseKey,
  baseMenu,
  baseSays,
  bellSays,
  cardStaysAt,
  chainNotifications,
  changesSince,
  choiceNote,
  closeAsks,
  commandKey,
  commitLines,
  daemonEnding,
  daemonLists,
  daemonNotice,
  deleteChoice,
  deleteSays,
  deletionOf,
  daemonStatus,
  decisionLines,
  decisionMark,
  DECISIONS_HEAD,
  droppedText,
  emptyList,
  fileLines,
  filterChoices,
  gainedSince,
  headlessKey,
  headlessLines,
  hiddenRepositories,
  historyLines,
  inboxGroups,
  inboxKey,
  inboxLine,
  inboxSummary,
  keepAwakeControl,
  keyHints,
  lateSays,
  lastHere,
  lineBadge,
  lineCounts,
  lineMarks,
  lineSession,
  lineSince,
  lineText,
  lossSections,
  linkCard,
  linkClick,
  type LinkTarget,
  markRanges,
  matchCount,
  matchSentence,
  matchWorkItems,
  menuKey,
  menuTarget,
  moveSelection,
  NEW_WORK_ITEM_SAYS,
  noticeWithout,
  notificationFor,
  notificationOpens,
  placeWords,
  paneChoices,
  paneInFront,
  paneKey,
  paneMenu,
  paneTabs,
  parkNotifications,
  permissionNotifications,
  pinnedFirst,
  pathCandidates,
  pathTarget,
  PLAN_AWAITED,
  planAnswer,
  planLine,
  recentKept,
  REGISTER_ONLY_SAYS,
  registerFields,
  removalChoice,
  removalOf,
  renameChoice,
  replayStep,
  lacksRecords,
  recordsDialog,
  recordsOf,
  refusedSeal,
  registered,
  repositoryMenu,
  rowButtons,
  RUN_SETUP_SAYS,
  runningSessions,
  screenMoves,
  screenTurns,
  sealButton,
  selectedLine,
  settingsBases,
  settingsFields,
  setupMark,
  setupSection,
  shownSetup,
  sidebarTree,
  stageOf,
  stateHeading,
  statusNotice,
  stateSays,
  stateWithAge,
  submenuPlace,
  summaryControls,
  summaryCount,
  summaryHead,
  summarySentence,
  tabLabel,
  tellsSize,
  viewFacts,
  webTarget,
  withHeadless,
  withoutHeadless,
  workItemEntries,
  workItemFields,
  workItemMenu,
  type FormPlan,
  type InboxLine,
  type MenuEntry,
  unanswered,
  unreadLines,
} from "../src/renderer/view";
import { type AskedQuestion, BASE_FETCH_MS, type BaseFetch, type Chain, type ChainStage, type CommitInfo, type Decision, type HeadlessInfo, type Look, type PaneKindInfo, type PermissionAsk, type Question, type Recorded, type RecordsPlan, type Repository, type SessionInfo, type WorkItem, type WorkItemLoss, type WorktreeSetup } from "../src/shared/protocol";

const LOGIN: WorkItem = {
  id: 1,
  title: "Fix the login bug",
  repoId: 1,
  repo: "/r/project",
  repoName: "project",
  branch: "owlery/fix-the-login-bug",
  worktree: "/w/project/fix-the-login-bug",
  createdAt: 1234,
  baseCommit: null,
  baseBranch: null,
  aheadOfBase: null,
  behindBase: null,
  newCommits: null,
  commits: null,
  changes: null,
  pinned: false,
  muted: false,
  groupId: null,
  archivedAt: null,
  permissions: [],
  decisions: [],
  questions: [],
  unread: [],
  setup: null,
  chain: null,
};
/** A setup whose command runs in pane 3, begun at 1000, which copied two paths. */
const RUNNING_SETUP: WorktreeSetup = { copied: [".env", "node_modules/"], copiedCount: 2, failedCopies: [], command: "pnpm install\n", paneId: 3, state: "running", exitCode: null, failure: null, startedAt: 1000, endedAt: null };
const PROJECT: Repository = { id: 1, folder: "/r/project", name: "project", customName: null, icon: null, defaultBase: null, hidden: false, groups: [], records: { root: null, check: null, broadGate: null } };
const SEARCH: WorkItem = { ...LOGIN, id: 2, title: "Speed up search", branch: "owlery/speed-up-search", worktree: "/w/project/speed-up-search" };

// What the daemon offers today, as `ready` carries it.
const KINDS: PaneKindInfo[] = [
  { kind: "shell", label: "Shell", reportsState: false, continues: false },
  { kind: "claude", label: "Claude Code", reportsState: true, continues: true },
];

function session(id: number, fields: Partial<SessionInfo> = {}): SessionInfo {
  return { id, kind: "claude", alive: true, workItemId: 1, state: null, stateSince: null, stateText: null, stateTool: null, stateQuestions: null, ...fields };
}

function headless(id: number, fields: Partial<HeadlessInfo> = {}): HeadlessInfo {
  return { id, workItemId: 1, prompt: "Which file holds the login form?", state: "working", answer: "", error: null, usage: null, startedAt: 1234, errorOutput: "", stopped: null, role: null, ...fields };
}

describe("tabLabel", () => {
  it("labels the one open pane of a kind in a work item with the kind alone, and never with the daemon's id or the work item's title", () => {
    const tabs = [session(3, { workItemId: 2 }), session(4, { kind: "shell", workItemId: 2 })];
    expect(tabLabel(tabs[0]!, tabs, KINDS)).toBe("Claude Code");
    expect(tabLabel(tabs[1]!, tabs, KINDS)).toBe("Shell");
  });

  it("numbers the open panes of a kind 1, 2, 3 in the tabs' order, apart from the other kinds", () => {
    const tabs = [session(3), session(5, { kind: "shell" }), session(8), session(9)];
    expect(tabs.map((tab) => tabLabel(tab, tabs, KINDS))).toEqual(["Claude Code 1", "Shell", "Claude Code 2", "Claude Code 3"]);
  });

  it("numbers the panes again once one of them closes, so the numbers stay 1 to the count", () => {
    const tabs = [session(3), session(9)];
    expect(tabs.map((tab) => tabLabel(tab, tabs, KINDS))).toEqual(["Claude Code 1", "Claude Code 2"]);
  });

  it("reads a kind's label from the daemon's list, whatever the daemon calls it", () => {
    const renamed: PaneKindInfo[] = [{ kind: "claude", label: "Agent", reportsState: true, continues: true }];
    expect(tabLabel(session(6), [session(6)], renamed)).toBe("Agent");
  });

  it("labels a pane of a kind the list does not hold with the kind as the daemon spells it", () => {
    expect(tabLabel(session(7, { kind: "shell" }), [session(7, { kind: "shell" })], [])).toBe("shell");
  });

  it("labels the pane the work item's setup names Setup, and numbers the other panes of its kind without it", () => {
    const tabs = [session(3, { kind: "shell" }), session(4), session(5, { kind: "shell" })];
    expect(tabs.map((tab) => tabLabel(tab, tabs, KINDS, 3))).toEqual(["Setup", "Claude Code", "Shell"]);
    expect(tabs.map((tab) => tabLabel(tab, tabs, KINDS, null))).toEqual(["Shell 1", "Claude Code", "Shell 2"]);
  });
});

describe("agentKind", () => {
  it("gives the first kind that reports its agent's state", () => {
    const two: PaneKindInfo[] = [...KINDS, { kind: "shell", label: "Second agent", reportsState: true, continues: false }];
    expect(agentKind(two)).toBe("claude");
  });

  it("gives nothing where no kind reports state", () => {
    expect(agentKind([{ kind: "shell", label: "Shell", reportsState: false, continues: false }])).toBeUndefined();
  });
});

describe("paneChoices", () => {
  const HINT = "Start on the latest conversation of this worktree";

  it("offers a kind that continues twice, the continuing choice after the kind's own, in the daemon's order of kinds", () => {
    expect(paneChoices(KINDS)).toEqual([
      { kind: "shell", text: "+ Shell", hint: null, continueLatest: false },
      { kind: "claude", text: "+ Claude Code", hint: null, continueLatest: false },
      { kind: "claude", text: "+ Claude Code (continue)", hint: HINT, continueLatest: true },
    ]);
  });

  it("offers a kind that does not continue once, whatever else it declares", () => {
    expect(paneChoices([{ kind: "claude", label: "Agent", reportsState: true, continues: false }])).toEqual([{ kind: "claude", text: "+ Agent", hint: null, continueLatest: false }]);
  });

  it("offers a kind once where the daemon, one of an earlier build, sent no `continues`", () => {
    const earlier = [{ kind: "claude", label: "Claude Code", reportsState: true }] as unknown as PaneKindInfo[];
    expect(paneChoices(earlier)).toEqual([{ kind: "claude", text: "+ Claude Code", hint: null, continueLatest: false }]);
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

  it("counts the work items in each state in a sentence, in the state's own words as they agree with the count, and leaves out the lines with no state", () => {
    expect(inboxSummary([line("working"), line("waiting"), line("waiting"), line(null)])).toBe("2 need you, 1 working");
  });

  it("says the state a person must act on first: waiting, then working, then finished", () => {
    expect(inboxSummary([line("finished"), line("working"), line("finished"), line("waiting")])).toBe("1 needs you, 1 working, 2 finished");
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
    expect(stateHeading("waiting")).toBe("Needs you");
    expect(stateHeading("working")).toBe("Working");
    expect(stateHeading("finished")).toBe("Finished");
    expect(stateHeading(null)).toBe("Asleep");
  });
});

describe("inboxGroups", () => {
  function entry(id: number, state: InboxLine["state"]): { id: number; line: InboxLine } {
    return { id, line: { title: `Work item ${id}`, branch: `owlery/work-item-${id}`, state, commits: "" } };
  }

  it("puts the lines under the heading of their state, the groups in the order a person acts on them and the lines with no state last", () => {
    const groups = inboxGroups([entry(1, null), entry(2, "finished"), entry(3, "working"), entry(4, "waiting")]);
    expect(groups.map((group) => [group.state, group.heading, group.entries.map((held) => held.id)])).toEqual([
      ["waiting", "Needs you", [4]],
      ["working", "Working", [3]],
      ["finished", "Finished", [2]],
      [null, "Asleep", [1]],
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
    expect(inboxGroups([entry(1, null), entry(2, "working")]).map((group) => group.heading)).toEqual(["Working", "Asleep"]);
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
  const INBOX = { inboxInFront: true, dialogOpen: false, menuOpen: false, inField: false, onControl: false };
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

  it("reads no key while another screen is in front, a dialog is open, a menu is open or the focus is in a field", () => {
    for (const code of ["KeyJ", "KeyK", "Enter"]) {
      expect(inboxKey(plain(code), { ...INBOX, inboxInFront: false })).toBeNull();
      expect(inboxKey(plain(code), { ...INBOX, dialogOpen: true })).toBeNull();
      expect(inboxKey(plain(code), { ...INBOX, menuOpen: true })).toBeNull();
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

describe("menuKey", () => {
  const FREE = { dialogOpen: false, menuOpen: false, inField: false };
  const key = (code: string, held: { shift?: boolean; modified?: boolean } = {}) => ({ code, shift: false, modified: false, ...held });

  it("reads M alone, by its place on the keyboard, and F10 with Shift, as the key that opens a menu", () => {
    expect(menuKey(key("KeyM"), FREE)).toBe(true);
    expect(menuKey(key("F10", { shift: true }), FREE)).toBe(true);
  });

  it("reads neither M with Shift nor F10 alone, no other key, and no key with the Command, the Control or the Option key held", () => {
    expect(menuKey(key("KeyM", { shift: true }), FREE)).toBe(false);
    expect(menuKey(key("F10"), FREE)).toBe(false);
    expect(menuKey(key("KeyN"), FREE)).toBe(false);
    expect(menuKey(key("F9", { shift: true }), FREE)).toBe(false);
    expect(menuKey(key("KeyM", { modified: true }), FREE)).toBe(false);
    expect(menuKey(key("F10", { shift: true, modified: true }), FREE)).toBe(false);
  });

  it("reads neither in a field, with a dialog open or with a menu open", () => {
    for (const pressed of [key("KeyM"), key("F10", { shift: true })]) {
      expect(menuKey(pressed, { ...FREE, inField: true })).toBe(false);
      expect(menuKey(pressed, { ...FREE, dialogOpen: true })).toBe(false);
      expect(menuKey(pressed, { ...FREE, menuOpen: true })).toBe(false);
    }
  });
});

describe("menuTarget", () => {
  it("gives the work item of the line the keyboard is on, whatever line is selected", () => {
    expect(menuTarget({ workItem: 4 }, 7)).toEqual({ workItem: 4 });
    expect(menuTarget({ workItem: 4 }, undefined)).toEqual({ workItem: 4 });
  });

  it("gives the repository of the row the keyboard is on", () => {
    expect(menuTarget({ repository: 2 }, 7)).toEqual({ repository: 2 });
  });

  it("gives the selected line's work item where the keyboard is on neither, and nothing where no list is in front or it has no line", () => {
    expect(menuTarget({}, 7)).toEqual({ workItem: 7 });
    expect(menuTarget({}, undefined)).toBeNull();
  });
});

const APPS = [
  { name: "Zed", kind: "editor" as const },
  { name: "Warp", kind: "terminal" as const },
];
/** Two groups of a repository, in the order they were made. */
const GROUPS = [
  { id: 7, name: "Later" },
  { id: 8, name: "Drafts" },
];
/** A menu's entries without their descriptions, which a case of their own holds: an entry that opens a submenu with its items, read the same way. */
const plain = (entries: readonly MenuEntry[]): { label: string; [field: string]: unknown }[] => entries.map(({ description: _says, ...entry }) => ("opens" in entry ? { ...entry, opens: plain(entry.opens) } : entry));
/** The "Open in" entry of a menu, as `plain` reads it, for a folder and the apps of `APPS`. */
const openIn = (folder: string) => ({
  label: "Open in",
  opens: [
    { label: "Finder", action: { do: "open", folder, app: null }, divides: false },
    { label: "Zed", action: { do: "open", folder, app: "Zed" }, divides: false },
    { label: "Warp", action: { do: "open", folder, app: "Warp" }, divides: false },
  ],
  divides: true,
});
/** The labels of the items an entry's submenu holds, or nothing where the entry opens none. */
const opened = (entries: readonly MenuEntry[], label: string): string[] | undefined => entries.flatMap((entry) => (entry.label === label && "opens" in entry ? [entry.opens.map((item) => item.label)] : []))[0];

describe("workItemMenu", () => {
  it("holds, in this order, Rename, Open in, the two copies, Pin, Mute notifications, Archive and Delete, each with what its press does, and Open in with no action of its own and a submenu of Finder and each installed app", () => {
    expect(plain(workItemMenu(LOGIN, APPS, []))).toEqual([
      { label: "Rename", action: { do: "rename", id: 1 }, divides: false },
      openIn("/w/project/fix-the-login-bug"),
      { label: "Copy path", action: { do: "copy", text: "/w/project/fix-the-login-bug" }, divides: true },
      { label: "Copy branch name", action: { do: "copy", text: "owlery/fix-the-login-bug" }, divides: false },
      { label: "Pin", action: { do: "set", id: 1, pinned: true }, divides: true },
      { label: "Mute notifications", action: { do: "set", id: 1, muted: true }, divides: false },
      { label: "Archive", action: { do: "archive", id: 1 }, divides: true },
      { label: "Delete", action: { do: "delete", id: 1 }, divides: false },
    ]);
  });

  it("offers Finder alone where no app is installed", () => {
    const menu = workItemMenu(LOGIN, [], []);
    expect(menu.map((item) => item.label)).toEqual(["Rename", "Open in", "Copy path", "Copy branch name", "Pin", "Mute notifications", "Archive", "Delete"]);
    expect(opened(menu, "Open in")).toEqual(["Finder"]);
    expect(opened(workItemMenu({ ...LOGIN, archivedAt: 50 }, [], []), "Open in")).toEqual(["Finder"]);
  });

  it("offers Unpin for a pinned work item and Unmute notifications for a muted one", () => {
    const items = plain(workItemMenu({ ...LOGIN, pinned: true, muted: true }, [], []));
    expect(items.slice(-4, -2)).toEqual([
      { label: "Unpin", action: { do: "set", id: 1, pinned: false }, divides: true },
      { label: "Unmute notifications", action: { do: "set", id: 1, muted: false }, divides: false },
    ]);
  });

  it("holds, between Mute notifications and Archive, Move to for each group of the work item's repository but its own, in the groups' order, and Move out of where it stands in one, each with what its press sets", () => {
    const moves = (workItem: WorkItem) => plain(workItemMenu(workItem, [], GROUPS)).slice(6, -2);
    expect(moves(LOGIN)).toEqual([
      { label: "Move to Later", action: { do: "set", id: 1, groupId: 7 }, divides: true },
      { label: "Move to Drafts", action: { do: "set", id: 1, groupId: 8 }, divides: false },
    ]);
    expect(moves({ ...LOGIN, groupId: 7 })).toEqual([
      { label: "Move to Drafts", action: { do: "set", id: 1, groupId: 8 }, divides: true },
      { label: "Move out of Later", action: { do: "set", id: 1, groupId: null }, divides: false },
    ]);
    // In the one group its repository has, it can move nowhere but out.
    expect(plain(workItemMenu({ ...LOGIN, groupId: 8 }, [], [{ id: 8, name: "Drafts" }])).slice(6, -2)).toEqual([{ label: "Move out of Drafts", action: { do: "set", id: 1, groupId: null }, divides: true }]);
    // A group the repository does not hold is one it cannot be moved out of by name: it is offered every group.
    expect(moves({ ...LOGIN, groupId: 99 }).map((item) => item.label)).toEqual(["Move to Later", "Move to Drafts"]);
    // The items around them stand as they do without a group.
    expect(workItemMenu(LOGIN, [], GROUPS).map((item) => item.label)).toEqual(["Rename", "Open in", "Copy path", "Copy branch name", "Pin", "Mute notifications", "Move to Later", "Move to Drafts", "Archive", "Delete"]);
  });

  it("holds for an archived work item, in this order, Restore, Open in with its submenu of Finder and each installed app, the two copies and Delete: no rename, no pin, no mute, no group and no archive", () => {
    expect(plain(workItemMenu({ ...LOGIN, pinned: true, archivedAt: 50 }, APPS, GROUPS))).toEqual([
      { label: "Restore", action: { do: "restore", id: 1 }, divides: false },
      openIn("/w/project/fix-the-login-bug"),
      { label: "Copy path", action: { do: "copy", text: "/w/project/fix-the-login-bug" }, divides: true },
      { label: "Copy branch name", action: { do: "copy", text: "owlery/fix-the-login-bug" }, divides: false },
      { label: "Delete", action: { do: "delete", id: 1 }, divides: true },
    ]);
  });
});

describe("repositoryMenu", () => {
  it("holds, in this order, Settings, Change icon, Records and check…, Show archived work items, New group, Open in, Copy path, Hide from sidebar and Remove, each with what its press does, and Open in with no action of its own and a submenu of Finder and each installed app on the repository's folder", () => {
    expect(plain(repositoryMenu(PROJECT, APPS))).toEqual([
      { label: "Settings", action: { do: "settings", id: 1 }, divides: false },
      { label: "Change icon", action: { do: "icon", id: 1 }, divides: false },
      { label: "Records and check…", action: { do: "records", id: 1 }, divides: false },
      { label: "Show archived work items", action: { do: "archived", id: 1 }, divides: true },
      { label: "New group", action: { do: "group", id: 1 }, divides: false },
      openIn("/r/project"),
      { label: "Copy path", action: { do: "copy", text: "/r/project" }, divides: true },
      { label: "Hide from sidebar", action: { do: "hide", id: 1 }, divides: true },
      { label: "Remove", action: { do: "remove", id: 1 }, divides: false },
    ]);
  });

  it("offers Finder alone where no app is installed", () => {
    const menu = repositoryMenu(PROJECT, []);
    expect(menu.map((item) => item.label)).toEqual(["Settings", "Change icon", "Records and check…", "Show archived work items", "New group", "Open in", "Copy path", "Hide from sidebar", "Remove"]);
    expect(opened(menu, "Open in")).toEqual(["Finder"]);
  });

  it("offers no Records and check… for a repository of a daemon of an earlier build, which sends no records", () => {
    const { records: _, ...earlier } = PROJECT;
    expect(repositoryMenu(earlier as Repository, []).map((item) => item.label)).toEqual(["Settings", "Change icon", "Show archived work items", "New group", "Open in", "Copy path", "Hide from sidebar", "Remove"]);
  });
});

describe("a description on hover", () => {
  it("gives every entry of a work item's menu and of a repository's menu, and every item of a submenu, a description that is not empty and is not its label, and no two entries of one menu or of one submenu the same one", () => {
    const menus = [workItemMenu(LOGIN, APPS, []), workItemMenu({ ...LOGIN, pinned: true, muted: true }, APPS, []), repositoryMenu(PROJECT, APPS), workItemMenu({ ...LOGIN, archivedAt: 50 }, APPS, []), workItemMenu({ ...LOGIN, groupId: 7 }, APPS, GROUPS), workItemMenu(LOGIN, APPS, GROUPS)];
    // Each submenu is read as a menu of its own, after the menus.
    const submenus = menus.flatMap((menu) => menu.flatMap((entry) => ("opens" in entry ? [entry.opens] : [])));
    for (const menu of [...menus, ...submenus]) {
      for (const { label, description } of menu) {
        expect(description.trim(), label).not.toBe("");
        expect(description, label).not.toBe(label);
        // A sentence, and not the label with a full stop.
        expect(description.endsWith("."), label).toBe(true);
        expect(description.toLowerCase(), label).not.toBe(`${label.toLowerCase()}.`);
      }
      expect(new Set(menu.map(({ description }) => description)).size).toBe(menu.length);
    }
    expect(menus.map((menu) => menu.length)).toEqual([8, 8, 9, 5, 10, 10]);
    expect(submenus.map((submenu) => submenu.length)).toEqual([3, 3, 3, 3, 3, 3]);
  });
});

describe("submenuPlace", () => {
  const WINDOW = { width: 800, height: 600 };
  const SIZE = { width: 200, height: 120 };

  it("puts the submenu's left edge at the menu's right edge and its top edge at the item's, where the window has room at the menu's right, to the last pixel", () => {
    expect(submenuPlace({ left: 100, right: 300 }, 50, SIZE, WINDOW)).toEqual({ left: 300, top: 50 });
    expect(submenuPlace({ left: 400, right: 600 }, 0, SIZE, WINDOW)).toEqual({ left: 600, top: 0 });
  });

  it("puts the submenu's right edge at the menu's left edge where the window has no room at the menu's right and has room at its left", () => {
    expect(submenuPlace({ left: 401, right: 601 }, 50, SIZE, WINDOW)).toEqual({ left: 201, top: 50 });
    expect(submenuPlace({ left: 600, right: 800 }, 50, SIZE, WINDOW)).toEqual({ left: 400, top: 50 });
    expect(submenuPlace({ left: 200, right: 400 }, 50, SIZE, { width: 500, height: 600 })).toEqual({ left: 0, top: 50 });
  });

  it("moves the submenu inside the window, over part of the menu, where neither side has room, and to the window's left edge where the window is narrower than the submenu", () => {
    expect(submenuPlace({ left: 150, right: 350 }, 50, SIZE, { width: 500, height: 600 })).toEqual({ left: 300, top: 50 });
    expect(submenuPlace({ left: 0, right: 150 }, 50, SIZE, { width: 150, height: 600 })).toEqual({ left: 0, top: 50 });
  });

  it("moves the submenu up where its bottom edge would pass the window's, and never above the window's top", () => {
    expect(submenuPlace({ left: 100, right: 300 }, 480, SIZE, WINDOW)).toEqual({ left: 300, top: 480 });
    expect(submenuPlace({ left: 100, right: 300 }, 550, SIZE, WINDOW)).toEqual({ left: 300, top: 480 });
    expect(submenuPlace({ left: 100, right: 300 }, 550, { width: 200, height: 700 }, WINDOW)).toEqual({ left: 300, top: 0 });
  });

  it("says of the button at the sidebar's top, of a repository's two buttons and of the form's choice what each does, and tells registering a repository from creating a work item", () => {
    expect(NEW_WORK_ITEM_SAYS).toBe("Create a work item: a new branch and worktree in a repository. The form can also register a repository alone.");
    expect(REGISTER_ONLY_SAYS).toBe("Add the repository to the sidebar without creating a work item, a branch or a worktree.");
    expect(rowButtons("the project")).toEqual({
      add: { name: "New work item in the project", says: "Create a work item in the project: a new branch and worktree." },
      menu: { name: "Menu of the project", says: "Open the menu of the project: its settings, its icon, hiding it and removing it." },
    });
  });
});

describe("hiddenRepositories", () => {
  it("gives the hidden repositories in the daemon's order, and says how many they are, or nothing where none is hidden", () => {
    const docs: Repository = { ...PROJECT, id: 2, folder: "/r/docs", name: "docs", hidden: true };
    const third: Repository = { ...PROJECT, id: 3, folder: "/r/third", name: "third", hidden: true };
    expect(hiddenRepositories([PROJECT])).toEqual({ says: "", hidden: [] });
    expect(hiddenRepositories([])).toEqual({ says: "", hidden: [] });
    expect(hiddenRepositories([docs, PROJECT])).toEqual({ says: "1 hidden repository", hidden: [docs] });
    expect(hiddenRepositories([third, PROJECT, docs])).toEqual({ says: "2 hidden repositories", hidden: [third, docs] });
  });
});

describe("removalOf", () => {
  const DOCS: WorkItem = { ...LOGIN, id: 3, title: "Write the guide", repoId: 2 };
  const SHELVED: WorkItem = { ...LOGIN, id: 4, title: "Shelved", archivedAt: 50 };

  it("names each work item the repository holds, the archived among them, and none of another repository", () => {
    expect(removalOf(PROJECT, [LOGIN, DOCS, SEARCH], [SHELVED, { ...SHELVED, id: 5, repoId: 2 }], [], [], KINDS)).toEqual({
      workItems: [
        { id: 1, title: "Fix the login bug", archived: false },
        { id: 2, title: "Speed up search", archived: false },
        { id: 4, title: "Shelved", archived: true },
      ],
      sessions: [],
      running: { panes: [], headless: [] },
    });
    expect(removalOf(PROJECT, [DOCS], [], [], [], KINDS)).toEqual({ workItems: [], sessions: [], running: { panes: [], headless: [] } });
  });

  it("names each running session of those work items, a pane by its tab's label and a headless session by its prompt, and gives their ids: no pane that exited, no headless session that ended, and none of another repository's work item", () => {
    const sessions = [session(5, { kind: "shell" }), session(6, { kind: "shell", alive: false }), session(7, { kind: "shell" }), session(8, { workItemId: 3 }), session(9, { workItemId: 4 }), session(10, { workItemId: null })];
    const asked = [headless(1), headless(2, { state: "finished" }), headless(3, { state: "failed" }), headless(4, { workItemId: 3 }), headless(5, { workItemId: 2, prompt: "Where is the index built?" })];
    expect(removalOf(PROJECT, [LOGIN, DOCS, SEARCH], [SHELVED], sessions, asked, KINDS)).toMatchObject({
      sessions: ["Shell 1 in Fix the login bug", "Shell 3 in Fix the login bug", "Claude Code in Shelved", "Asked in Fix the login bug: Which file holds the login form?", "Asked in Speed up search: Where is the index built?"],
      running: { panes: [5, 7, 9], headless: [1, 5] },
    });
  });
});

describe("what a delete dialog says of a loss", () => {
  const NOTHING: WorkItemLoss = { branch: null, worktree: null, commits: [], commitCount: 0, uncommitted: [], uncommittedCount: 0, untracked: [], untrackedCount: 0, ignored: [], ignoredCount: 0, blocked: null, unreachable: false, stamp: "s" };
  const CLEAN: WorkItemLoss = { ...NOTHING, branch: "owlery/fix-the-login-bug", worktree: "/w/project/fix-the-login-bug", ignored: [".env", "node_modules/"], ignoredCount: 2 };
  const HOLDS: WorkItemLoss = { ...CLEAN, commits: [{ hash: "abc1234", subject: "add the form" }], commitCount: 1, uncommitted: ["README.md"], uncommittedCount: 1, untracked: ["newdir/deep/u.txt"], untrackedCount: 1 };

  it("names the branch and the folder a delete removes, each commit by its hash and its subject, and each file by its path, under a heading for each kind, and leaves out a kind the loss holds none of", () => {
    expect(lossSections(HOLDS)).toEqual([
      { caption: "Removed from disk", lines: ["The branch owlery/fix-the-login-bug", "The folder /w/project/fix-the-login-bug"], more: "" },
      { caption: "Commits no other branch, no remote and no tag holds", lines: ["abc1234 add the form"], more: "" },
      { caption: "Files with changes that are not committed", lines: ["README.md"], more: "" },
      { caption: "Untracked files", lines: ["newdir/deep/u.txt"], more: "" },
      { caption: "Ignored files and folders, which go with the folder", lines: [".env", "node_modules/"], more: "" },
    ]);
    expect(lossSections(CLEAN).map(({ caption }) => caption)).toEqual(["Removed from disk", "Ignored files and folders, which go with the folder"]);
    expect(lossSections({ ...NOTHING, branch: "owlery/gone-folder" })).toEqual([{ caption: "Removed from disk", lines: ["The branch owlery/gone-folder"], more: "" }]);
    expect(lossSections({ ...NOTHING, unreachable: true })).toEqual([]);
  });

  it("says how many more there are where a list is cut, of each kind by its own count", () => {
    const cut = lossSections({ ...HOLDS, commitCount: 501, uncommittedCount: 2, untrackedCount: 1, ignoredCount: 14 });
    expect(cut.map(({ more }) => more)).toEqual(["", "and 500 more", "and 1 more", "", "and 12 more"]);
  });

  it("offers Force delete only where a commit, a changed file or an untracked file would be lost, and turns Delete on once the loss has arrived, unless the delete is blocked or would lose work and is not forced", () => {
    expect(deleteChoice(null, false)).toEqual({ forceShown: false, enabled: false });
    expect(deleteChoice(null, true)).toEqual({ forceShown: false, enabled: false });
    // The ignored files are named and need no force.
    expect(deleteChoice(CLEAN, false)).toEqual({ forceShown: false, enabled: true });
    expect(deleteChoice(HOLDS, false)).toEqual({ forceShown: true, enabled: false });
    expect(deleteChoice(HOLDS, true)).toEqual({ forceShown: true, enabled: true });
    for (const lost of [{ commitCount: 1 }, { uncommittedCount: 1 }, { untrackedCount: 1 }]) expect(deleteChoice({ ...CLEAN, ...lost }, false)).toEqual({ forceShown: true, enabled: false });
    expect(deleteChoice({ ...CLEAN, blocked: "The worktree is locked." }, false)).toEqual({ forceShown: false, enabled: false });
    expect(deleteChoice({ ...HOLDS, blocked: "The worktree is locked." }, true)).toEqual({ forceShown: true, enabled: false });
    expect(deleteChoice({ ...NOTHING, unreachable: true }, false)).toEqual({ forceShown: false, enabled: true });
  });

  it("says before the lists what the delete does: that it is being read, why it cannot run, that work would be lost, that the folder stays where git reads nothing, or what it removes", () => {
    expect(deleteSays(null)).toBe("Reading what a delete would remove.");
    expect(deleteSays({ ...HOLDS, blocked: "The worktree /w is locked, so git does not remove it." })).toBe("The worktree /w is locked, so git does not remove it.");
    expect(deleteSays(HOLDS)).toBe("A delete would lose the work named below. It runs only with Force delete checked.");
    expect(deleteSays(CLEAN)).toBe("A delete removes the work item's worktree and its local branch, and takes the work item off Owlery's lists.");
    expect(deleteSays({ ...NOTHING, unreachable: true })).toBe("Git reads nothing in the repository's folder. A delete takes the work item off Owlery's lists, and its folder stays on disk.");
  });

  describe("removalChoice", () => {
    const NEITHER = "Owlery will no longer list the repository or its work items. Nothing on disk is removed: the repository's folder, each worktree's folder and each branch stay where they are.";

    it("shows the choice to delete the work items only where the repository holds one, and turns the Trash's choice on where it holds none or the work items are deleted", () => {
      expect(removalChoice(0, false, false, [], false)).toEqual({ deleteShown: false, trashEnabled: true, forceShown: false, enabled: true, says: NEITHER });
      expect(removalChoice(2, false, false, [], false)).toEqual({ deleteShown: true, trashEnabled: false, forceShown: false, enabled: true, says: NEITHER });
      expect(removalChoice(2, true, false, [CLEAN, CLEAN], false)).toMatchObject({ deleteShown: true, trashEnabled: true, forceShown: false, enabled: true });
    });

    it("turns Remove off, where the work items are deleted, until every loss has arrived, while one is blocked, and while one would lose work and Force delete is not checked", () => {
      expect(removalChoice(2, true, false, [CLEAN, undefined], false)).toMatchObject({ forceShown: false, enabled: false });
      expect(removalChoice(2, true, false, [CLEAN, { ...CLEAN, blocked: "locked" }], true)).toMatchObject({ forceShown: false, enabled: false });
      expect(removalChoice(2, true, false, [CLEAN, HOLDS], false)).toMatchObject({ forceShown: true, enabled: false });
      expect(removalChoice(2, true, false, [CLEAN, HOLDS], true)).toMatchObject({ forceShown: true, enabled: true });
      // With the choice not taken, a loss decides nothing.
      expect(removalChoice(2, false, false, [HOLDS, undefined], false)).toMatchObject({ forceShown: false, enabled: true });
    });

    it("says what the removal does on disk for each choice", () => {
      expect(removalChoice(2, true, false, [], false).says).toBe("Owlery will no longer list the repository or its work items. Each work item's worktree and local branch are deleted, as named below. The repository's folder stays, and nothing on a remote is removed.");
      expect(removalChoice(0, false, true, [], false).says).toBe("Owlery will no longer list the repository. Its folder moves to the Trash, whole, and nothing in it is erased.");
      expect(removalChoice(2, true, true, [], false).says).toBe("Owlery will no longer list the repository or its work items. Each work item's worktree and local branch are deleted, as named below, and the repository's folder then moves to the Trash, whole. Nothing on a remote is removed.");
      // The Trash's choice counts only where it can be taken.
      expect(removalChoice(2, false, true, [], false).says).toBe(NEITHER);
    });
  });

  it("gives a removal that deletes the stamp of each work item's loss, by the work item's id, and whether it is forced", () => {
    expect(deletionOf([1, 4], new Map([[1, CLEAN], [4, { ...HOLDS, stamp: "t" }], [9, HOLDS]]), true)).toEqual({ stamps: { 1: "s", 4: "t" }, force: true });
    // A work item whose loss has not arrived has no stamp, and the daemon refuses the removal.
    expect(deletionOf([1, 4], new Map([[1, CLEAN]]), false)).toStrictEqual({ stamps: { 1: "s" }, force: false });
  });
});

describe("archivalOf", () => {
  it("names each running session of the work item, a pane by its tab's label and a headless session by its prompt, and gives their ids: no pane that exited, no headless session that ended, and none of another work item", () => {
    const sessions = [session(5, { kind: "shell" }), session(6, { kind: "shell", alive: false }), session(7, { kind: "shell" }), session(8, { workItemId: 2 }), session(9), session(10, { workItemId: null })];
    const asked = [headless(1), headless(2, { state: "finished" }), headless(3, { state: "failed" }), headless(4, { workItemId: 2 })];
    expect(archivalOf(LOGIN, sessions, asked, KINDS)).toEqual({
      sessions: ["Shell 1", "Shell 3", "Claude Code", "Asked: Which file holds the login form?"],
      running: { panes: [5, 7, 9], headless: [1] },
    });
  });

  it("names the pane the work item's setup names Setup, as its tab does", () => {
    const setting: WorkItem = { ...LOGIN, setup: { ...RUNNING_SETUP, paneId: 5 } };
    expect(archivalOf(setting, [session(5, { kind: "shell" }), session(7, { kind: "shell" })], [], KINDS).sessions).toEqual(["Setup", "Shell"]);
    expect(removalOf(PROJECT, [setting], [], [session(5, { kind: "shell" }), session(7, { kind: "shell" })], [], KINDS).sessions).toEqual(["Setup in Fix the login bug", "Shell in Fix the login bug"]);
  });

  it("names none where no session of the work item runs, so its archive asks nothing first", () => {
    expect(archivalOf(LOGIN, [session(6, { alive: false }), session(8, { workItemId: 2 })], [headless(2, { state: "finished" })], KINDS)).toEqual({ sessions: [], running: { panes: [], headless: [] } });
  });
});

describe("daemonEnding", () => {
  it("words the dialog before a restart: its head, what a restart ends and what stays, and its button", () => {
    expect(daemonEnding("restart")).toEqual({
      head: "Restart the daemon",
      says: "A restart ends every running session and starts Owlery's background process again, from this build. The panes' tabs and the answers to what was asked go with the old process. Work items, their folders and their branches stay as they are.",
      button: "Restart",
    });
  });

  it("words the dialog before a complete quit: its head, what the quit ends and what stays, and its button", () => {
    expect(daemonEnding("quit")).toEqual({
      head: "Quit Owlery completely",
      says: "This ends every running session, stops Owlery's background process and quits Owlery. The panes' tabs and the answers to what was asked go with the process. Work items, their folders and their branches stay as they are.",
      button: "Quit",
    });
  });
});

describe("runningSessions", () => {
  const SHELVED: WorkItem = { ...LOGIN, id: 4, title: "Shelved", archivedAt: 50 };

  it("names every running session the window holds: each live pane of a listed work item, archived or not, by its tab's label and the work item, then a live pane of no listed work item by its kind's label, then each working headless session by its work item and its prompt, and no pane that exited and no headless session that ended", () => {
    const sessions = [
      session(5, { kind: "shell" }),
      session(6, { kind: "shell", alive: false }),
      session(7, { workItemId: 4 }),
      session(8, { workItemId: 4, alive: false }),
      session(9, { kind: "shell", workItemId: null }),
      session(10, { workItemId: 99 }),
      session(11, { kind: "shell", workItemId: null, alive: false }),
    ];
    const asked = [headless(1), headless(2, { state: "finished" }), headless(3, { workItemId: 4, prompt: "Where is the index built?" }), headless(4, { workItemId: 4, state: "failed" }), headless(5, { workItemId: 99, prompt: "Who asked?" }), headless(6, { workItemId: 99, state: "finished" })];
    expect(runningSessions([LOGIN], [SHELVED], sessions, asked, KINDS)).toEqual([
      "Shell 1 in Fix the login bug",
      "Claude Code 1 in Shelved",
      "Shell",
      "Claude Code",
      "Asked in Fix the login bug: Which file holds the login form?",
      "Asked in Shelved: Where is the index built?",
      "Asked: Who asked?",
    ]);
  });

  it("names none where no session runs", () => {
    expect(runningSessions([LOGIN], [SHELVED], [session(6, { alive: false })], [headless(2, { state: "finished" })], KINDS)).toEqual([]);
    expect(runningSessions([], [], [], [], KINDS)).toEqual([]);
  });
});

describe("archivedIn", () => {
  it("gives a repository's archived work items, the one archived last first, and none of another repository", () => {
    const shelved = (id: number, archivedAt: number, repoId = 1): WorkItem => ({ ...LOGIN, id, repoId, archivedAt });
    expect(archivedIn(1, [shelved(4, 50), shelved(5, 70, 2), shelved(6, 90), shelved(7, 60)]).map((workItem) => workItem.id)).toEqual([6, 7, 4]);
    expect(archivedIn(3, [shelved(4, 50)])).toEqual([]);
  });

  it("keeps two archived at one time in the order given", () => {
    const shelved = (id: number, archivedAt: number): WorkItem => ({ ...LOGIN, id, archivedAt });
    expect(archivedIn(1, [shelved(4, 50), shelved(5, 50), shelved(6, 80)]).map((workItem) => workItem.id)).toEqual([6, 4, 5]);
  });
});

describe("archivedHead", () => {
  it("names the repository whose archived work items the screen lists", () => {
    expect(archivedHead("the project")).toBe("Archived in the project");
  });
});

describe("settingsBases", () => {
  const PLAN = { branch: "owlery/x", worktree: "/w/project/x", localBases: ["main", "develop"], remoteBases: ["origin/main"], defaultBase: "develop", setupCommand: null, includes: false };

  it("lists the repository's local and remote bases whole, under a first choice that stores none, and chooses the base the repository has where the plan lists it", () => {
    expect(settingsBases(PLAN, "develop")).toEqual({ local: ["main", "develop"], remote: ["origin/main"], value: "develop" });
    expect(settingsBases(PLAN, "origin/main").value).toBe("origin/main");
    expect(settingsBases(PLAN, null).value).toBe("");
  });

  it("lists a base the repository has and the plan does not, so the choice the daemon keeps stays the one shown, and lists that base alone until the daemon answers and where it refuses", () => {
    expect(settingsBases(PLAN, "gone")).toEqual({ local: ["main", "develop", "gone"], remote: ["origin/main"], value: "gone" });
    expect(settingsBases(null, "develop")).toEqual({ local: ["develop"], remote: [], value: "develop" });
    expect(settingsBases({ error: "/r/project is not inside a git repository" }, null)).toEqual({ local: [], remote: [], value: "" });
  });
});

describe("settingsFields", () => {
  const NAMED: Repository = { ...PROJECT, name: "The project", customName: "The project", defaultBase: "develop" };

  it("sends the name where it is another than the one a person gave, without the white space at its ends, and null for an empty one", () => {
    expect(settingsFields(PROJECT, "  The project ", "")).toEqual({ name: "The project" });
    expect(settingsFields(NAMED, "", "develop")).toEqual({ name: null });
    expect(settingsFields(NAMED, "Another", "develop")).toEqual({ name: "Another" });
  });

  it("sends the base where it is another than the one the repository has, null for the first choice, and nothing where neither field changed", () => {
    expect(settingsFields(PROJECT, "", "develop")).toEqual({ defaultBase: "develop" });
    expect(settingsFields(NAMED, "The project", "")).toEqual({ defaultBase: null });
    expect(settingsFields(NAMED, "Renamed", "main")).toEqual({ name: "Renamed", defaultBase: "main" });
    expect(settingsFields(NAMED, " The project ", "develop")).toEqual({});
    expect(settingsFields(PROJECT, "  ", "")).toEqual({});
  });
});

describe("registerFields", () => {
  it("gives the folder the form's field holds, without the spaces around it, and refuses an empty one in the form's words", () => {
    expect(registerFields("  /r/project ")).toEqual({ folder: "/r/project" });
    expect(registerFields("   ")).toEqual({ error: "Choose the repository folder." });
  });
});

describe("pinnedFirst", () => {
  const item = (id: number, pinned: boolean) => ({ workItem: { ...LOGIN, id, pinned } });

  it("puts the pinned work items before the others, and keeps the order among the pinned and among the others", () => {
    expect(pinnedFirst([item(1, false), item(2, true), item(3, false), item(4, true)]).map(({ workItem }) => workItem.id)).toEqual([2, 4, 1, 3]);
    expect(pinnedFirst([item(1, false), item(2, false)]).map(({ workItem }) => workItem.id)).toEqual([1, 2]);
  });

  it("puts a pinned work item first in its state's group of the inbox, and before no line of a state a person acts on sooner", () => {
    const sessions = [session(5, { workItemId: 1, state: "working" }), session(6, { workItemId: 2, state: "waiting" }), session(7, { workItemId: 3, state: "working" })];
    const third: WorkItem = { ...LOGIN, id: 3, title: "Third", pinned: true };
    const groups = inboxGroups(pinnedFirst(workItemEntries([LOGIN, SEARCH, third], sessions, KINDS)));
    expect(groups.map((group) => [group.state, group.entries.map((entry) => entry.workItem.id)])).toEqual([
      ["waiting", [2]],
      ["working", [3, 1]],
    ]);
  });
});

describe("lineMarks", () => {
  it("marks a pinned work item's line with the words Pinned, a muted one's with Notifications muted, and a line of neither with nothing", () => {
    expect(lineMarks(LOGIN)).toEqual([]);
    expect(lineMarks({ ...LOGIN, pinned: true })).toEqual([{ mark: "pinned", words: "Pinned" }]);
    expect(lineMarks({ ...LOGIN, muted: true })).toEqual([{ mark: "muted", words: "Notifications muted" }]);
    expect(lineMarks({ ...LOGIN, pinned: true, muted: true }).map(({ mark }) => mark)).toEqual(["pinned", "muted"]);
  });
});

describe("the decisions made without asking", () => {
  const MINUTE = 60_000;
  const NOW = 100 * MINUTE;
  function decision(id: number, fields: Partial<Decision> = {}): Decision {
    return { id, kind: "default", says: "Start from main.", grounds: "frame/questions.md Q1 states main as its default.", by: null, state: "decided", reversal: null, landed: null, since: NOW - 12 * MINUTE, ...fields };
  }
  /** What a decision a person reversed holds beside what it held as made: the state, the message, and the time the daemon first read it as reversed. */
  const REVERSAL = { state: "reversed", reversal: "기본값 말고 main에서 시작해 주세요", since: NOW - 3 * MINUTE } as const;
  /** A work item as a daemon of a build before the decisions sends it. */
  const { decisions: _decisions, ...BEFORE } = LOGIN;
  const EARLIER = BEFORE as WorkItem;

  it("marks a line with how many decisions made without asking the person has not seen, the look not holding them, and with how many reversals wait for a stage, an applied and a carried decision in neither count, and with nothing where both are zero", () => {
    const APPLIED = { ...REVERSAL, state: "applied", landed: "abc1234" } as const;
    const four = { ...LOGIN, decisions: [decision(1), decision(2, REVERSAL), decision(3), decision(4, APPLIED)] };
    // No look is recorded, so the person has seen none.
    expect(decisionMark(four, null)).toBe("2 decisions without asking, 1 reversed");
    expect(decisionMark({ ...LOGIN, decisions: [decision(1)] }, null)).toBe("1 decision without asking");
    expect(decisionMark({ ...LOGIN, decisions: [decision(2, REVERSAL)] }, null)).toBe("1 reversed");
    expect(decisionMark({ ...LOGIN, decisions: [decision(2, REVERSAL), decision(5, REVERSAL)] }, null)).toBe("2 reversed");
    expect(decisionMark({ ...LOGIN, decisions: [decision(4, APPLIED), decision(3, { ...REVERSAL, state: "carried", landed: "#53" })] }, null)).toBe("");
    expect(decisionMark(LOGIN, null)).toBe("");
    // A decision the look holds for the work item is one the person has seen, and a reversal waits whether or not the look holds it.
    const seen = (decisions: Decision[], other: WorkItem[] = []): Look => ({ at: 1000, sessions: [], workItems: [...other, { ...LOGIN, decisions }] });
    expect(decisionMark(four, seen([decision(1)]))).toBe("1 decision without asking, 1 reversed");
    expect(decisionMark(four, seen([decision(1), decision(2), decision(3)]))).toBe("1 reversed");
    expect(decisionMark({ ...LOGIN, decisions: [decision(1), decision(3)] }, seen([decision(1), decision(3)]))).toBe("");
    // The look holds a decision under its work item's id: another work item's decision of the same id is not this one's, and a look that does not hold the work item holds none of its decisions.
    expect(decisionMark(four, seen([], [{ ...SEARCH, decisions: [decision(1), decision(3)] }]))).toBe("2 decisions without asking, 1 reversed");
    expect(decisionMark(four, { at: 1000, sessions: [], workItems: [{ ...SEARCH, decisions: [decision(1), decision(3)] }] })).toBe("2 decisions without asking, 1 reversed");
    // An archived work item's line carries the mark its line carried before the archive.
    expect(decisionMark({ ...four, archivedAt: 50 }, seen([decision(1)]))).toBe(decisionMark(four, seen([decision(1)])));
  });

  it("leaves a line's state and its group as its panes give them, whatever was decided for the work item", () => {
    const decided = { ...LOGIN, decisions: [decision(1), decision(2, REVERSAL)] };
    for (const sessions of [[], [session(2, { state: "working" })], [session(2, { state: "waiting" })], [session(2, { state: "finished" })]]) {
      expect(inboxLine(decided, sessions, KINDS)).toEqual(inboxLine(LOGIN, sessions, KINDS));
      expect(inboxGroups(workItemEntries([decided], sessions, KINDS)).map((group) => group.heading)).toEqual(inboxGroups(workItemEntries([LOGIN], sessions, KINDS)).map((group) => group.heading));
      expect(inboxSummary([inboxLine(decided, sessions, KINDS)])).toBe(inboxSummary([inboxLine(LOGIN, sessions, KINDS)]));
    }
  });

  it("lists every decision under its head, the last of the record first: the kind in words, what was decided, the grounds, who decided where the record says it, how long it has been in its state, and for one that no longer stands as made that it was reversed, applied in a commit or carried to a home, with the message; a decision with no time has no age", () => {
    expect(DECISIONS_HEAD).toBe("Decided without asking");
    const decisions = [
      decision(1, { kind: "route", says: "Build it with no framer.", grounds: "The issue names one file.", since: NOW - 3 * 60 * MINUTE }),
      decision(2, REVERSAL),
      decision(3, { kind: "scope", says: "Leave the phone's screen out.", grounds: "docs/roadmap.md, Milestones, row 3.", by: "orchestrator", since: NOW - 5 * MINUTE }),
      decision(4, { kind: "answered", says: "The base is main.", grounds: "seal/config.json names no other.", since: NOW }),
      decision(5, { ...REVERSAL, state: "applied", landed: "abc1234", since: null }),
      decision(6, { ...REVERSAL, state: "carried", landed: "#53", since: NOW - 2 * MINUTE }),
    ];
    const DEFAULT = { kind: "Default taken", says: "Start from main.", grounds: "Grounds: frame/questions.md Q1 states main as its default.", by: "" };
    expect(decisionLines({ ...LOGIN, decisions }, NOW)).toEqual([
      { id: 6, ...DEFAULT, age: "2 min", reversed: { head: "Carried to #53", message: "기본값 말고 main에서 시작해 주세요" } },
      { id: 5, ...DEFAULT, age: "", reversed: { head: "Applied in abc1234", message: "기본값 말고 main에서 시작해 주세요" } },
      { id: 4, kind: "Answered from the tree", says: "The base is main.", grounds: "Grounds: seal/config.json names no other.", by: "", age: "less than a minute", reversed: null },
      { id: 3, kind: "Scope chosen", says: "Leave the phone's screen out.", grounds: "Grounds: docs/roadmap.md, Milestones, row 3.", by: "Decided by orchestrator", age: "5 min", reversed: null },
      { id: 2, ...DEFAULT, age: "3 min", reversed: { head: "Reversed", message: "기본값 말고 main에서 시작해 주세요" } },
      { id: 1, kind: "Route", says: "Build it with no framer.", grounds: "Grounds: The issue names one file.", by: "", age: "3 h", reversed: null },
    ]);
    expect(decisionLines(LOGIN, NOW)).toEqual([]);
  });

  it("names each line of the record that was not read, by its number and the reader's reason, in the order given, and none where the record was read whole", () => {
    expect(unreadLines({ ...LOGIN, unread: [{ line: 4, why: "the block holds no id" }, { line: 19, why: "a fence opens like a seal block and is not one" }] })).toEqual([
      "Line 4 of decisions.md was not read: the block holds no id",
      "Line 19 of decisions.md was not read: a fence opens like a seal block and is not one",
    ]);
    expect(unreadLines(LOGIN)).toEqual([]);
  });

  it("reads a work item of a daemon of an earlier build, which sends no decisions and no unread line, as one with none, in the lists and in the look, and throws at none", () => {
    const { decisions: _d, questions: _q, unread: _u, ...bare } = LOGIN;
    const BARE = bare as WorkItem;
    expect(decisionMark(EARLIER, null)).toBe("");
    expect(decisionMark(BARE, { at: 1000, sessions: [], workItems: [BARE] })).toBe("");
    // A look written before the decisions holds none, so each decision is one the person has not seen.
    expect(decisionMark({ ...LOGIN, decisions: [decision(1)] }, { at: 1000, sessions: [], workItems: [BARE] })).toBe("1 decision without asking");
    expect(unreadLines(BARE)).toEqual([]);
    expect(matchWorkItems(workItemEntries([BARE], [], KINDS), "", "decided")).toEqual([]);
    expect(decisionLines(EARLIER, NOW)).toEqual([]);
    expect(inboxLine(EARLIER, [session(2, { state: "working" })], KINDS)).toEqual(inboxLine(LOGIN, [session(2, { state: "working" })], KINDS));
    expect(lineText(EARLIER, undefined, false)).toEqual(lineText(LOGIN, undefined, false));
  });
});

describe("a work item parked with its questions", () => {
  const MINUTE = 60_000;
  const NOW = 100 * MINUTE;
  const BASE: Question = { id: 1, asks: "Which base does the branch start from?", grounds: "No document names the base of a hotfix.", by: "sealer", options: [{ label: "main", implies: "The release's fixes are not in it." }, { label: "release/v0.0.2", implies: "It merges after the release." }], default: "release/v0.0.2", answer: null, since: NOW - 12 * MINUTE };
  const FREE: Question = { id: 2, asks: "What should the screen be called?", grounds: "No document names it.", by: "sealer", options: [], default: null, answer: null, since: NOW - 10 * MINUTE };
  const OPEN: Question = { id: 3, asks: "Squash or merge?", grounds: "The repository's config names neither.", by: null, options: [{ label: "squash", implies: "" }, { label: "merge", implies: "Every commit stays." }], default: null, answer: null, since: null };
  const TYPED = "둘 다 아니고, 세 번째 방법으로";
  const ANSWERED: Question[] = [{ ...BASE, answer: "main", since: NOW - 4 * MINUTE }, { ...FREE, answer: TYPED, since: NOW - 3 * MINUTE }];
  const PARKED: WorkItem = { ...LOGIN, questions: [BASE, FREE] };
  const DONE: WorkItem = { ...LOGIN, questions: ANSWERED };
  /** A work item whose record holds two answered questions and one that a later park added. */
  const AGAIN: WorkItem = { ...LOGIN, questions: [...ANSWERED, { ...OPEN, since: NOW - MINUTE }] };
  const working = session(2, { state: "working", stateSince: NOW - 40 * MINUTE, stateText: "Running the tests" });
  /** A work item as a daemon of a build before the questions sends it. */
  const { questions: _questions, unread: _unread, ...BEFORE } = LOGIN;
  const EARLIER = BEFORE as WorkItem;

  it("gives a parked work item's line the state waiting, whatever its panes say, so that the inbox's sentence counts it among those that need the person and it stands in that group, and the state its panes give once it is answered", () => {
    for (const sessions of [[], [working], [session(2, { state: "finished" })], [session(2, { state: "waiting" })]]) {
      expect(inboxLine(PARKED, sessions, KINDS)).toEqual({ ...inboxLine(LOGIN, sessions, KINDS), state: "waiting" });
      expect(inboxLine(DONE, sessions, KINDS)).toEqual(inboxLine(LOGIN, sessions, KINDS));
      // One open question beside the answered ones parks the work item again.
      expect(inboxLine(AGAIN, sessions, KINDS).state).toBe("waiting");
    }
    const entries = workItemEntries([SEARCH, PARKED], [working, session(3, { workItemId: 2, state: "working" })], KINDS);
    expect(inboxSummary(entries.map((entry) => entry.line))).toBe("1 needs you, 1 working");
    expect(inboxGroups(entries).map((group) => [group.heading, group.entries.map((entry) => entry.workItem.id)])).toEqual([["Needs you", [1]], ["Working", [2]]]);
    expect(inboxSummary(workItemEntries([SEARCH, DONE], [working, session(3, { workItemId: 2, state: "working" })], KINDS).map((entry) => entry.line))).toBe("2 working");
  });

  it("says a parked work item's first question in its line's second row, with how many more it waits on, before what its agent says, and what the line said before once it is answered or while a search is typed", () => {
    expect(lineText(PARKED, working, false)).toEqual({ says: "question", text: "Which base does the branch start from? (and 1 more question)" });
    expect(lineText({ ...LOGIN, questions: [BASE, FREE, OPEN] }, undefined, false)).toEqual({ says: "question", text: "Which base does the branch start from? (and 2 more questions)" });
    expect(lineText({ ...LOGIN, questions: [{ ...FREE, id: 1 }] }, working, false)).toEqual({ says: "question", text: "What should the screen be called?" });
    expect(lineText(DONE, working, false)).toEqual({ says: "state", text: "Running the tests" });
    // The answered questions are not counted among the ones it waits on.
    expect(lineText(AGAIN, working, false)).toEqual({ says: "question", text: "Squash or merge?" });
    expect(lineText(PARKED, working, true)).toEqual({ says: "branch", text: "owlery/fix-the-login-bug" });
  });

  it("counts a parked work item's age from the earliest time among its open questions, the answered ones' and a question with no time left out, and the age of any other from its pane's state", () => {
    expect(lineSince(PARKED, working)).toBe(NOW - 12 * MINUTE);
    expect(lineSince({ ...LOGIN, questions: [OPEN, FREE, BASE] }, working)).toBe(NOW - 12 * MINUTE);
    expect(lineSince(AGAIN, working)).toBe(NOW - MINUTE);
    expect(lineSince({ ...LOGIN, questions: [OPEN] }, working)).toBeNull();
    expect(lineSince(PARKED, undefined)).toBe(NOW - 12 * MINUTE);
    expect(lineSince(DONE, working)).toBe(NOW - 40 * MINUTE);
    expect(lineSince(LOGIN, working)).toBe(NOW - 40 * MINUTE);
    expect([lineSince(DONE, undefined), lineSince(LOGIN, session(2))]).toEqual([null, null]);
    expect(stateWithAge(inboxLine(PARKED, [working], KINDS).state, lineSince(PARKED, working), NOW)).toBe("Needs you, 12 min");
  });

  it("gives the section of a parked work item its head and how long ago the first question was asked, and every question with who asked where the record says it, its grounds, its options, what each implies, the mark of its default and the default as the option chosen", () => {
    expect(askedSection({ ...LOGIN, questions: [BASE, FREE, OPEN] }, NOW, null)).toEqual({
      head: "Waiting for your answer",
      age: "Asked 12 min ago",
      parked: true,
      key: "1:open:1,2,3",
      questions: [
        { id: 1, asks: "Which base does the branch start from?", by: "Asked by sealer", grounds: "Grounds: No document names the base of a hotfix.", options: [{ label: "main", implies: "The release's fixes are not in it.", mark: "" }, { label: "release/v0.0.2", implies: "It merges after the release.", mark: "Default" }], chosen: 1, answer: null },
        { id: 2, asks: "What should the screen be called?", by: "Asked by sealer", grounds: "Grounds: No document names it.", options: [], chosen: null, answer: null },
        { id: 3, asks: "Squash or merge?", by: "", grounds: "Grounds: The repository's config names neither.", options: [{ label: "squash", implies: "", mark: "" }, { label: "merge", implies: "Every commit stays.", mark: "" }], chosen: null, answer: null },
      ],
    });
    // A look does not end a park: the open questions are listed whatever the look holds.
    expect(askedSection(PARKED, NOW, { at: 1000, sessions: [], workItems: [PARKED] })?.key).toBe("1:open:1,2");
    expect(askedSection(PARKED, NOW, { at: 1000, sessions: [], workItems: [DONE] })?.key).toBe("1:open:1,2");
  });

  it("lists an answered question until the look holds it as answered for its work item: every one while the window holds no look, the ones the look holds open or not at all otherwise, and no section once the look holds each as answered", () => {
    const look = (...workItems: WorkItem[]): Look => ({ at: 1000, sessions: [], workItems });
    const shown = (held: Look | null) => askedSection(DONE, NOW, held)?.questions.map(({ id }) => id) ?? null;
    expect(shown(null)).toEqual([1, 2]);
    // The look was recorded while the work item was parked, or before it was, or does not hold the work item.
    expect(shown(look(PARKED))).toEqual([1, 2]);
    expect(shown(look(LOGIN))).toEqual([1, 2]);
    expect(shown(look(SEARCH))).toEqual([1, 2]);
    // The look holds one of the two as answered: the other alone is listed, and the age is its own.
    const half = look({ ...LOGIN, questions: [ANSWERED[0]!, FREE] });
    expect(askedSection(DONE, NOW, half)).toMatchObject({ head: "Answered", age: "Answered 3 min ago", key: "1:answered:2", questions: [{ id: 2, answer: TYPED }] });
    expect(askedSection(DONE, NOW, look({ ...LOGIN, questions: [BASE, ANSWERED[1]!] }))).toMatchObject({ age: "Answered 4 min ago", key: "1:answered:1" });
    expect(shown(look(DONE))).toBeNull();
    // The look holds a question under its work item's id, so another work item's answered question of the same id ends nothing.
    expect(shown(look({ ...SEARCH, questions: ANSWERED }))).toEqual([1, 2]);
    // A look written before the questions holds none as answered.
    expect(shown(look(EARLIER))).toEqual([1, 2]);
  });

  it("gives the section of an answered record the head Answered, how long ago the last answer was given, and each question with its answer, no option, no asker and no grounds, and gives no section for a work item that never was parked", () => {
    expect(askedSection(DONE, NOW, null)).toEqual({
      head: "Answered",
      age: "Answered 3 min ago",
      parked: false,
      key: "1:answered:1,2",
      questions: [
        { id: 1, asks: "Which base does the branch start from?", by: "", grounds: "", options: [], chosen: null, answer: "main" },
        { id: 2, asks: "What should the screen be called?", by: "", grounds: "", options: [], chosen: null, answer: TYPED },
      ],
    });
    expect(askedSection(LOGIN, NOW, null)).toBeNull();
    // While one question of the record is open, the section holds the open ones alone, and names an asker only where the question's block says one.
    expect(askedSection(AGAIN, NOW, null)).toMatchObject({ head: "Waiting for your answer", age: "Asked 1 min ago", parked: true, key: "1:open:3", questions: [{ id: 3, by: "", answer: null }] });
    // A question the daemon has no time for gives the section no age, and the age is counted from the earliest time among the others.
    expect(askedSection({ ...LOGIN, questions: [OPEN] }, NOW, null)?.age).toBe("");
    expect(askedSection({ ...LOGIN, questions: [OPEN, FREE] }, NOW, null)).toMatchObject({ age: "Asked 10 min ago", questions: [{ by: "" }, { by: "Asked by sealer" }] });
    // A default that names no option of its question chooses none.
    expect(askedSection({ ...LOGIN, questions: [{ ...BASE, default: "develop" }] }, NOW, null)?.questions.map(({ chosen, options }) => [chosen, options.map(({ mark }) => mark)])).toEqual([[null, ["", ""]]]);
    // The key differs between two work items, two sets of questions of one, and a park and its answer, so the section is drawn again at each.
    const keys = [askedSection(PARKED, NOW, null), askedSection(DONE, NOW, null), askedSection({ ...PARKED, id: 2 }, NOW, null), askedSection(AGAIN, NOW, null)].map((section) => section?.key);
    expect(new Set(keys).size).toBe(4);
  });

  it("gives each question of the section the answer the person chose: an option's label, or the words they typed as another answer, and an empty answer for a question with nothing chosen, which the daemon refuses", () => {
    const questions = askedSection({ ...LOGIN, questions: [BASE, FREE, OPEN] }, NOW, null)!.questions;
    expect(answersFor(questions, [0, "other", 1], ["ignored", TYPED, ""])).toEqual([{ questionId: 1, answer: "main" }, { questionId: 2, answer: TYPED }, { questionId: 3, answer: "merge" }]);
    expect(answersFor(questions, ["other", null, null], [" trunk ", "typed and not chosen", ""])).toEqual([{ questionId: 1, answer: " trunk " }, { questionId: 2, answer: "" }, { questionId: 3, answer: "" }]);
    // A choice that names no option of its question gives no answer.
    expect(answersFor(questions, [5, 0, null], ["", "", ""])).toEqual([{ questionId: 1, answer: "" }, { questionId: 2, answer: "" }, { questionId: 3, answer: "" }]);
  });

  it("notifies of a work item that is parked now and was not before, titled with the work item's title, and of none that is muted, whose view is in front, that the window already held as parked, or that is archived", () => {
    const told = { workItemId: 1, title: "Fix the login bug", body: "Waiting for your answer" };
    expect(parkNotifications([LOGIN, SEARCH], [PARKED, SEARCH], undefined)).toEqual([told]);
    expect(parkNotifications([DONE], [PARKED], undefined)).toEqual([told]);
    // A work item the window did not hold at all was not held as parked.
    expect(parkNotifications([SEARCH], [SEARCH, PARKED], undefined)).toEqual([told]);
    expect(parkNotifications([LOGIN, SEARCH], [PARKED, { ...SEARCH, questions: [BASE, FREE] }], 2)).toEqual([told]);
    expect(parkNotifications([LOGIN, SEARCH], [PARKED, { ...SEARCH, questions: [BASE, FREE] }], undefined)).toEqual([told, { workItemId: 2, title: "Speed up search", body: "Waiting for your answer" }]);
    expect(parkNotifications([LOGIN], [{ ...PARKED, muted: true }], undefined)).toEqual([]);
    expect(parkNotifications([LOGIN], [PARKED], 1)).toEqual([]);
    expect(parkNotifications([PARKED], [PARKED], undefined)).toEqual([]);
    // An archived work item stands in no list of work items, and one restored while parked was held as parked among the archived.
    expect(parkNotifications([LOGIN], [], undefined)).toEqual([]);
    expect(parkNotifications([{ ...PARKED, archivedAt: 50 }], [PARKED], undefined)).toEqual([]);
    expect(parkNotifications([PARKED], [DONE], undefined)).toEqual([]);
    expect(parkNotifications([LOGIN], [LOGIN], undefined)).toEqual([]);
  });

  it("reads a work item of a daemon of an earlier build, which sends no record, as one that never was parked, and throws at none", () => {
    expect(inboxLine(EARLIER, [working], KINDS)).toEqual(inboxLine(LOGIN, [working], KINDS));
    expect(lineText(EARLIER, working, false)).toEqual(lineText(LOGIN, working, false));
    expect(lineSince(EARLIER, working)).toBe(NOW - 40 * MINUTE);
    expect(askedSection(EARLIER, NOW, null)).toBeNull();
    expect(askedSection(EARLIER, NOW, { at: 1000, sessions: [], workItems: [EARLIER] })).toBeNull();
    expect(parkNotifications([EARLIER], [EARLIER], undefined)).toEqual([]);
    expect(parkNotifications([EARLIER], [PARKED], undefined)).toHaveLength(1);
  });
});

describe("a work item whose headless session waits for the person to allow a call", () => {
  const MINUTE = 60_000;
  const NOW = 100 * MINUTE;
  const BASH: PermissionAsk = { id: 7, headlessId: 3, tool: "Bash", action: "run", text: "pnpm test -- redirect", at: NOW - 5 * MINUTE };
  const WRITE: PermissionAsk = { id: 9, headlessId: 3, tool: "Write", action: "write", text: "src/redirect.ts", at: NOW - 2 * MINUTE };
  const OTHER: PermissionAsk = { id: 11, headlessId: 4, tool: "WebFetch", action: "other", text: '{"url":"https://example.com"}', at: NOW - MINUTE };
  const ASKS: WorkItem = { ...LOGIN, permissions: [BASH] };
  const QUESTION: Question = { id: 1, asks: "Which base does the branch start from?", grounds: "No document names the base of a hotfix.", by: "sealer", options: [], default: null, answer: null, since: NOW - 12 * MINUTE };
  const working = session(2, { state: "working", stateSince: NOW - 40 * MINUTE, stateText: "Running the tests" });
  /** A work item as a daemon of a build before the permission requests sends it. */
  const { permissions: _permissions, ...BEFORE } = LOGIN;
  const EARLIER = BEFORE as WorkItem;

  it("gives the line of a work item that holds a request the state waiting, whatever its panes say, so that the inbox's sentence counts it among those that need the person and it stands in that group, and the state its panes give once no request waits", () => {
    for (const sessions of [[], [working], [session(2, { state: "finished" })], [session(2, { state: "waiting" })]]) {
      expect(inboxLine(ASKS, sessions, KINDS)).toEqual({ ...inboxLine(LOGIN, sessions, KINDS), state: "waiting" });
    }
    const entries = workItemEntries([SEARCH, ASKS], [working, session(3, { workItemId: 2, state: "working" })], KINDS);
    expect(inboxSummary(entries.map((entry) => entry.line))).toBe("1 needs you, 1 working");
    expect(inboxGroups(entries).map((group) => [group.heading, group.entries.map((entry) => entry.workItem.id)])).toEqual([["Needs you", [1]], ["Working", [2]]]);
    expect(inboxLine({ ...LOGIN, permissions: [] }, [working], KINDS)).toEqual(inboxLine(LOGIN, [working], KINDS));
  });

  it("says the oldest request in the line's second row, as the tool it asks to use and its text, with how many more wait, after a parked work item's question and before what its agent says, and the branch while a search is typed", () => {
    expect(lineText(ASKS, working, false)).toEqual({ says: "permission", text: "Asks to use Bash: pnpm test -- redirect" });
    expect(lineText({ ...LOGIN, permissions: [BASH, WRITE] }, working, false)).toEqual({ says: "permission", text: "Asks to use Bash: pnpm test -- redirect (and 1 more)" });
    expect(lineText({ ...LOGIN, permissions: [WRITE, BASH, OTHER] }, undefined, false)).toEqual({ says: "permission", text: "Asks to use Write: src/redirect.ts (and 2 more)" });
    expect(lineText({ ...ASKS, questions: [QUESTION] }, working, false)).toEqual({ says: "question", text: "Which base does the branch start from?" });
    expect(lineText(ASKS, working, true)).toEqual({ says: "branch", text: "owlery/fix-the-login-bug" });
    expect(lineText({ ...LOGIN, permissions: [] }, working, false)).toEqual({ says: "state", text: "Running the tests" });
  });

  it("counts the line's age from its oldest request, and for a parked work item from the earlier of its open questions' times and its requests' times", () => {
    expect(lineSince(ASKS, working)).toBe(NOW - 5 * MINUTE);
    expect(lineSince({ ...LOGIN, permissions: [WRITE, BASH] }, undefined)).toBe(NOW - 5 * MINUTE);
    expect(lineSince({ ...ASKS, questions: [QUESTION] }, working)).toBe(NOW - 12 * MINUTE);
    expect(lineSince({ ...LOGIN, questions: [QUESTION], permissions: [{ ...BASH, at: NOW - 20 * MINUTE }] }, working)).toBe(NOW - 20 * MINUTE);
    // A question with no time gives none, and the request's time stands.
    expect(lineSince({ ...ASKS, questions: [{ ...QUESTION, since: null }] }, working)).toBe(NOW - 5 * MINUTE);
    expect(stateWithAge(inboxLine(ASKS, [working], KINDS).state, lineSince(ASKS, working), NOW)).toBe("Needs you, 5 min");
  });

  it("notifies of each request the window did not hold, titled with the work item's title, with the words a waiting pane's notification has, and of none of a muted work item, of the work item whose view is in front, or that the window already held", () => {
    const told = { workItemId: 1, title: "Fix the login bug", body: "Needs you" };
    expect(told.body).toBe(notificationFor("working", session(3, { state: "waiting" }), false, [LOGIN], KINDS)?.body);
    expect(permissionNotifications([LOGIN, SEARCH], [ASKS, SEARCH], undefined)).toEqual([told]);
    expect(permissionNotifications([ASKS], [{ ...LOGIN, permissions: [BASH, WRITE] }], undefined)).toEqual([told]);
    expect(permissionNotifications([LOGIN], [{ ...LOGIN, permissions: [BASH, WRITE] }], undefined)).toEqual([told, told]);
    // A work item the window did not hold at all held no request.
    expect(permissionNotifications([], [ASKS], undefined)).toEqual([told]);
    expect(permissionNotifications([LOGIN, SEARCH], [ASKS, { ...SEARCH, permissions: [OTHER] }], 2)).toEqual([told]);
    expect(permissionNotifications([LOGIN], [{ ...ASKS, muted: true }], undefined)).toEqual([]);
    expect(permissionNotifications([LOGIN], [ASKS], 1)).toEqual([]);
    expect(permissionNotifications([ASKS], [ASKS], undefined)).toEqual([]);
    // A request answered leaves the list, and nothing is told of it.
    expect(permissionNotifications([{ ...LOGIN, permissions: [BASH, WRITE] }], [{ ...LOGIN, permissions: [WRITE] }], undefined)).toEqual([]);
  });

  it("gives the line of a session that waits for the person the waiting mark and the words Needs you, and each of its requests, the oldest first, with the tool it asks to use and its text, and no request on another session's line", () => {
    const lines = headlessLines([headless(3), headless(4), headless(5, { state: "finished", answer: "src/login" })], { ...LOGIN, permissions: [BASH, WRITE, OTHER] });
    expect(lines.map(({ id, state, mark, words, asks, stop }) => ({ id, state, mark, words, asks, stop }))).toEqual([
      { id: 5, state: "finished", mark: "finished", words: "finished", asks: [], stop: false },
      { id: 4, state: "working", mark: "waiting", words: "Needs you", asks: [{ id: 11, head: "Asks to use WebFetch", text: '{"url":"https://example.com"}' }], stop: true },
      {
        id: 3,
        state: "working",
        mark: "waiting",
        words: "Needs you",
        asks: [
          { id: 7, head: "Asks to use Bash", text: "pnpm test -- redirect" },
          { id: 9, head: "Asks to use Write", text: "src/redirect.ts" },
        ],
        stop: true,
      },
    ]);
  });

  it("gives the section a key that stays while nothing it shows changes and differs where a line, a request or the work item differs, so an inbox that changes nothing leaves the section's lines as they are", () => {
    const sessions = [headless(3), headless(5, { state: "finished", answer: "src/login" })];
    const key = (held: readonly HeadlessInfo[], workItem: WorkItem): string => headlessKey(workItem.id, headlessLines(held, workItem));
    const drawn = key(sessions, ASKS);
    expect(key([...sessions], { ...ASKS, pinned: true, newCommits: 3 })).toBe(drawn);
    const others = [
      key(sessions, LOGIN),
      key(sessions, { ...ASKS, permissions: [BASH, WRITE] }),
      key(sessions, { ...ASKS, permissions: [{ ...BASH, text: "pnpm test" }] }),
      key(sessions, { ...ASKS, permissions: [{ ...BASH, id: 8 }] }),
      key([headless(3, { answer: "Reading" }), sessions[1]!], ASKS),
      key([headless(3, { state: "failed", error: "stopped" }), sessions[1]!], ASKS),
      key(sessions.map((info) => ({ ...info, workItemId: 2 })), { ...SEARCH, permissions: [BASH] }),
    ];
    expect(new Set([drawn, ...others]).size).toBe(others.length + 1);
  });

  it("draws a work item of a daemon of an earlier build, which sends no requests, as one with none, in its line and its view, and throws at none", () => {
    expect(inboxLine(EARLIER, [working], KINDS)).toEqual(inboxLine(LOGIN, [working], KINDS));
    expect(lineText(EARLIER, working, false)).toEqual(lineText(LOGIN, working, false));
    expect(lineSince(EARLIER, working)).toBe(NOW - 40 * MINUTE);
    expect(lineSince({ ...EARLIER, questions: [QUESTION] }, working)).toBe(NOW - 12 * MINUTE);
    expect(permissionNotifications([EARLIER], [EARLIER], undefined)).toEqual([]);
    expect(permissionNotifications([EARLIER], [ASKS], undefined)).toHaveLength(1);
    expect(headlessLines([headless(3)], EARLIER)).toEqual(headlessLines([headless(3)], LOGIN));
  });
});

describe("the approval line", () => {
  const MINUTE = 60_000;
  const NOW = 100 * MINUTE;
  const GATE = "3333333cccccccccccccccccccccccccccccccc";
  const TARGET = "2222222bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  /** What the daemon sends for a work item with no directory of its own. */
  const NOTHING: Recorded = { framed: false, rounds: 0, gate: null, verdict: null };
  /** A work item's records with the frame, three round records, a gate's run and a last verdict that seals. */
  const SEALED: Recorded = { framed: true, rounds: 3, gate: GATE, verdict: { is: "sealed", commit: TARGET, says: null } };
  const RECORDED: WorkItem = { ...LOGIN, newCommits: 1, recorded: SEALED };
  const EMPTY: WorkItem = { ...LOGIN, newCommits: 0, recorded: NOTHING };
  const NONE_STARTED = [
    ["framer", "no-agent", "Not started", "Framer: Not started"],
    ["crafter", "no-agent", "Not started", "Crafter: Not started"],
    ["proofer", "no-agent", "Not started", "Proofer: Not started"],
    ["sealer", "no-agent", "Not started", "Sealer: Not started"],
  ];
  const ASKS: Question = { id: 1, asks: "Does a stopped round count as a round?", grounds: "No document says.", by: "proofer", options: [], default: null, answer: null, since: NOW - 12 * MINUTE };

  /** Each place as a person reads it: its role, its state's class, its note and its mark's words. */
  const read = (workItem: WorkItem): string[][] | null => approvalPlaces(workItem)?.map((place) => [place.role, place.state, place.note, placeWords(place, NOW)]) ?? null;
  /** The lines of text under the places. */
  const under = (workItem: WorkItem): string[] | null => approvalPlaces(workItem)?.flatMap((place) => (place.under === null ? [] : [place.under])) ?? null;

  it("fills the four places in the order framer, crafter, proofer, sealer from what the records say and the branch's commits, and leaves each not started where they say nothing", () => {
    expect(read(RECORDED)).toEqual([
      ["framer", "finished", "Framed", "Framer: Framed"],
      ["crafter", "finished", "1 commit", "Crafter: 1 commit"],
      ["proofer", "finished", "3 rounds", "Proofer: 3 rounds"],
      ["sealer", "finished", "Sealed", "Sealer: Sealed at 2222222"],
    ]);
    expect(under(RECORDED)).toEqual([]);
    expect(approvalPlaces(RECORDED)?.map(({ name }) => name)).toEqual(["Framer", "Crafter", "Proofer", "Sealer"]);
    expect(read({ ...RECORDED, newCommits: 3, recorded: { ...SEALED, rounds: 1 } })?.slice(1, 3)).toEqual([
      ["crafter", "finished", "3 commits", "Crafter: 3 commits"],
      ["proofer", "finished", "1 round", "Proofer: 1 round"],
    ]);
    expect(read(EMPTY)).toEqual(NONE_STARTED);
    expect(under(EMPTY)).toEqual([]);
    // A count of commits the daemon has not read leaves the crafter's place not started.
    expect(read({ ...EMPTY, newCommits: null })).toEqual(NONE_STARTED);
  });

  it("marks the sealer's place failed at a withheld verdict and waiting at an undecided one, each with the verdict's commit and its reason or question under the line, and says a gate's run where no verdict stands", () => {
    const withheld: WorkItem = { ...EMPTY, recorded: { ...NOTHING, verdict: { is: "withheld", commit: TARGET, says: "The broad gate did not run at the head." } } };
    expect(read(withheld)?.[3]).toEqual(["sealer", "failed", "Withheld", "Sealer: Withheld at 2222222"]);
    expect(under(withheld)).toEqual(["Sealer: The broad gate did not run at the head."]);
    const undecided: WorkItem = { ...EMPTY, recorded: { ...NOTHING, verdict: { is: "undecided", commit: TARGET, says: "Which base does the hotfix merge into?" } } };
    expect(read(undecided)?.[3]).toEqual(["sealer", "waiting", "Undecided", "Sealer: Undecided at 2222222"]);
    expect(under(undecided)).toEqual(["Sealer: Which base does the hotfix merge into?"]);
    const gated: WorkItem = { ...EMPTY, recorded: { ...NOTHING, gate: GATE } };
    expect(read(gated)?.[3]).toEqual(["sealer", "no-agent", "Gate passed", "Sealer: Gate passed at 3333333"]);
    expect(under(gated)).toEqual([]);
    // A verdict stands over the gate's run, and a verdict whose record gives no text puts no line under the places.
    expect(read({ ...withheld, recorded: { ...SEALED, verdict: { is: "withheld", commit: TARGET, says: null } } })?.[3]).toEqual(["sealer", "failed", "Withheld", "Sealer: Withheld at 2222222"]);
    expect(under({ ...withheld, recorded: { ...SEALED, verdict: { is: "withheld", commit: TARGET, says: null } } })).toEqual([]);
    // The other three places are as the records give them.
    expect(read(withheld)?.slice(0, 3)).toEqual(NONE_STARTED.slice(0, 3));
  });

  it("marks a role's place waiting where an open question names that role exactly as its asker, with the question's age in the mark's words and its text under the line, and marks no place for another asker or once the question is answered", () => {
    const asked: WorkItem = { ...RECORDED, questions: [ASKS] };
    expect(read(asked)?.[2]).toEqual(["proofer", "waiting", "Needs you", "Proofer: Needs you, 12 min"]);
    expect(under(asked)).toEqual(["Proofer: Does a stopped round count as a round?"]);
    expect(read(asked)?.filter((_, place) => place !== 2)).toEqual(read(RECORDED)?.filter((_, place) => place !== 2));
    // A question the daemon gave no time keeps the words without an age.
    expect(read({ ...RECORDED, questions: [{ ...ASKS, since: null }] })?.[2]).toEqual(["proofer", "waiting", "Needs you", "Proofer: Needs you"]);
    // Of two open questions of the role, the first stands under the line.
    expect(under({ ...RECORDED, questions: [ASKS, { ...ASKS, id: 2, asks: "And a failed one?" }] })).toEqual(["Proofer: Does a stopped round count as a round?"]);
    // An open question marks the place over what the records say: the sealer waits on a question while its verdict seals.
    expect(read({ ...RECORDED, questions: [{ ...ASKS, by: "sealer" }] })?.[3]).toEqual(["sealer", "waiting", "Needs you", "Sealer: Needs you, 12 min"]);
    for (const by of ["orchestrator", "Proofer", " proofer", null]) {
      expect(read({ ...RECORDED, questions: [{ ...ASKS, by }] })).toEqual(read(RECORDED));
      expect(under({ ...RECORDED, questions: [{ ...ASKS, by }] })).toEqual([]);
    }
    expect(read({ ...RECORDED, questions: [{ ...ASKS, answer: "No" }] })).toEqual(read(RECORDED));
    expect(under({ ...RECORDED, questions: [{ ...ASKS, answer: "No" }] })).toEqual([]);
  });

  it("is composed from the work item alone, so no pane's state and no headless session without a role changes it", () => {
    expect(approvalPlaces.length).toBe(1);
    const quiet = workItemEntries([RECORDED], [session(2, { state: "finished" })], KINDS);
    const busy = workItemEntries([RECORDED], [session(3, { state: "waiting", stateSince: NOW - MINUTE, stateText: "Allow the edit?" })], KINDS);
    // The two lists give the line of the inbox two states, and the places one.
    expect(quiet[0]?.line.state).toBe("finished");
    expect(busy[0]?.line.state).toBe("waiting");
    // The function takes no session, a headless one with no role among them, so the places are the work item's alone: a pane that waits marks no place.
    expect(approvalPlaces(busy[0]!.workItem)).toEqual(approvalPlaces(quiet[0]!.workItem));
    expect(read(busy[0]!.workItem)).toEqual(read(RECORDED));
    expect(read(busy[0]!.workItem)?.map(([, state]) => state)).not.toContain("waiting");
  });

  it("gives no places for a work item a daemon of an earlier build sends without what its records say, and the places of the records and the questions for one that carries no chain", () => {
    const { recorded: _recorded, ...earlier } = RECORDED;
    expect(approvalPlaces(earlier as WorkItem)).toBeNull();
    expect(approvalPlaces({ ...earlier, questions: [ASKS] } as WorkItem)).toBeNull();
    expect(RECORDED.chain).toBeNull();
    expect(read(RECORDED)).not.toBeNull();
  });
});

describe("a work item's chain", () => {
  const MINUTE = 60_000;
  const NOW = 100 * MINUTE;
  const ROUND: ChainStage = { kind: "round", round: 1, state: "finished", failure: null, startedAt: NOW - 30 * MINUTE, endedAt: NOW - 20 * MINUTE, headlessId: 3, refusals: 0 };
  const FIX: ChainStage = { kind: "fix-pass", round: 1, state: "failed", failure: "the session reached its time limit and was stopped", startedAt: NOW - 19 * MINUTE, endedAt: NOW - 6 * MINUTE, headlessId: 4, refusals: 0 };
  const STOPPED_SAYS = "The fix pass of round 1 failed: the session reached its time limit and was stopped.";
  const chain = (state: Chain["state"], fields: Partial<Chain> = {}): Chain => ({ state, says: state === "stopped" ? STOPPED_SAYS : state === "running" ? "Review round 1 is running." : "", reviewedAt: null, stages: [], since: NOW - 4 * MINUTE, ...fields });
  const RUNNING: WorkItem = { ...LOGIN, chain: chain("running", { stages: [{ ...ROUND, state: "working", endedAt: null }] }) };
  const STOPPED: WorkItem = { ...LOGIN, chain: chain("stopped", { stages: [ROUND, FIX] }) };
  const REVIEWED: WorkItem = { ...LOGIN, chain: chain("reviewed", { says: "The review rounds settled at 1a2b3c4.", reviewedAt: "1a2b3c4", stages: [ROUND] }) };
  const PARKED: WorkItem = { ...LOGIN, chain: chain("parked", { says: "The work item waits for the answers to its questions.", stages: [ROUND] }) };
  const QUESTION: Question = { id: 1, asks: "Which base does the branch start from?", grounds: "No document names the base of a hotfix.", by: "crafter", options: [], default: null, answer: null, since: NOW - 12 * MINUTE };
  const BASH: PermissionAsk = { id: 7, headlessId: 3, tool: "Bash", action: "run", text: "pnpm test", at: NOW - 2 * MINUTE };
  const working = session(2, { state: "working", stateSince: NOW - 40 * MINUTE, stateText: "Running the tests" });
  const finished = session(2, { state: "finished", stateSince: NOW - 50 * MINUTE, stateText: "The form is done." });
  const waiting = session(2, { state: "waiting", stateSince: NOW - 3 * MINUTE, stateText: "May I run the tests?" });
  /** A work item as a daemon of a build before the chain sends it. */
  const { chain: _chain, ...BEFORE } = LOGIN;
  const EARLIER = BEFORE as WorkItem;

  it("gives the line of a work item whose chain is running the state working where no pane of it waits for the person, so that it is counted and stands among those at work, and the pane's state where its pane waits", () => {
    for (const sessions of [[], [finished], [working], [session(5, { kind: "shell" })]]) expect(inboxLine(RUNNING, sessions, KINDS)).toEqual({ ...inboxLine(LOGIN, sessions, KINDS), state: "working" });
    expect(inboxLine(RUNNING, [waiting], KINDS).state).toBe("waiting");
    const entries = workItemEntries([RUNNING, SEARCH], [finished, session(3, { workItemId: 2, state: "finished" })], KINDS);
    expect(inboxSummary(entries.map((entry) => entry.line))).toBe("1 working, 1 finished");
    expect(inboxGroups(entries).map((group) => [group.heading, group.entries.map((entry) => entry.workItem.id)])).toEqual([["Working", [1]], ["Finished", [2]]]);
  });

  it("gives the line of a work item whose chain stopped the state waiting, whatever its panes say, so that it is counted and stands among those that need the person", () => {
    for (const sessions of [[], [finished], [working], [waiting]]) expect(inboxLine(STOPPED, sessions, KINDS)).toEqual({ ...inboxLine(LOGIN, sessions, KINDS), state: "waiting" });
    const entries = workItemEntries([SEARCH, STOPPED], [finished, session(3, { workItemId: 2, state: "working" })], KINDS);
    expect(inboxSummary(entries.map((entry) => entry.line))).toBe("1 needs you, 1 working");
    expect(inboxGroups(entries).map((group) => [group.heading, group.entries.map((entry) => entry.workItem.id)])).toEqual([["Needs you", [1]], ["Working", [2]]]);
  });

  it("leaves the line's state to the work item's panes where its chain rests reviewed, where it is parked and every question is answered, and where no chain ran", () => {
    for (const workItem of [REVIEWED, PARKED, LOGIN]) {
      for (const sessions of [[], [finished], [working], [waiting]]) expect(inboxLine(workItem, sessions, KINDS)).toEqual(inboxLine(LOGIN, sessions, KINDS));
    }
    // A parked chain's line waits by the open question of the work item's record.
    expect(inboxLine({ ...PARKED, questions: [QUESTION] }, [finished], KINDS).state).toBe("waiting");
  });

  it("says a stopped chain's sentence in the line's second row, after a parked work item's question and a headless session's call and before what its agent says, and the branch while a search is typed", () => {
    expect(lineText(STOPPED, finished, false)).toEqual({ says: "chain", text: STOPPED_SAYS });
    expect(lineText(STOPPED, undefined, false)).toEqual({ says: "chain", text: STOPPED_SAYS });
    expect(lineText(STOPPED, waiting, false)).toEqual({ says: "chain", text: STOPPED_SAYS });
    expect(lineText({ ...STOPPED, questions: [QUESTION] }, finished, false)).toEqual({ says: "question", text: "Which base does the branch start from?" });
    expect(lineText({ ...STOPPED, permissions: [BASH] }, finished, false)).toEqual({ says: "permission", text: "Asks to use Bash: pnpm test" });
    expect(lineText(STOPPED, finished, true)).toEqual({ says: "branch", text: "owlery/fix-the-login-bug" });
  });

  it("says in the second row what the line says without a chain where the chain is running, reviewed or parked", () => {
    for (const workItem of [RUNNING, REVIEWED, PARKED]) {
      expect(lineText(workItem, finished, false)).toEqual({ says: "state", text: "The form is done." });
      expect(lineText(workItem, undefined, false)).toEqual({ says: "branch", text: "owlery/fix-the-login-bug" });
    }
  });

  it("counts the age of a stopped chain's line from when the chain stopped, whenever its newest stage ended, and from the earlier of that and its questions' and its requests' times", () => {
    // The chain stopped 4 minutes ago, 2 minutes after its newest stage ended.
    expect(lineSince(STOPPED, finished)).toBe(NOW - 4 * MINUTE);
    expect(lineSince(STOPPED, undefined)).toBe(NOW - 4 * MINUTE);
    expect(stateWithAge(inboxLine(STOPPED, [finished], KINDS).state, lineSince(STOPPED, finished), NOW)).toBe("Needs you, 4 min");
    expect(lineSince({ ...STOPPED, questions: [QUESTION] }, finished)).toBe(NOW - 12 * MINUTE);
    expect(lineSince({ ...STOPPED, permissions: [BASH] }, finished)).toBe(NOW - 4 * MINUTE);
    // A chain that stopped outside a stage, at a start long after its newest stage ended, has waited since that stop.
    expect(lineSince({ ...LOGIN, chain: chain("stopped", { stages: [ROUND], since: NOW - MINUTE }) }, finished)).toBe(NOW - MINUTE);
    // The daemon ended while the stage ran, so the stage has no end, and a chain may stop before its first stage.
    expect(lineSince({ ...LOGIN, chain: chain("stopped", { stages: [ROUND, { ...FIX, endedAt: null }] }) }, finished)).toBe(NOW - 4 * MINUTE);
    expect(lineSince({ ...LOGIN, chain: chain("stopped") }, finished)).toBe(NOW - 4 * MINUTE);
    expect(lineSince({ ...LOGIN, chain: chain("stopped", { since: NOW - MINUTE }), permissions: [BASH] }, finished)).toBe(NOW - 2 * MINUTE);
  });

  it("gives the line of a running chain no age where the chain alone says that it works, and the pane's where the pane works or waits", () => {
    expect(lineSince(RUNNING, finished)).toBeNull();
    expect(lineSince(RUNNING, undefined)).toBeNull();
    expect(lineSince(RUNNING, working)).toBe(NOW - 40 * MINUTE);
    expect(lineSince(RUNNING, waiting)).toBe(NOW - 3 * MINUTE);
    for (const workItem of [REVIEWED, PARKED]) expect(lineSince(workItem, finished)).toBe(NOW - 50 * MINUTE);
  });

  it("notifies of a chain that stopped since the window's lists were held, titled with the work item's title, with the words a waiting pane's notification has, and of none of a muted work item, of the work item whose view is in front, or of a chain the window already held as stopped", () => {
    const told = { workItemId: 1, title: "Fix the login bug", body: "Needs you" };
    expect(told.body).toBe(notificationFor("working", session(3, { state: "waiting" }), false, [LOGIN], KINDS)?.body);
    expect(chainNotifications([RUNNING, SEARCH], [STOPPED, SEARCH], undefined)).toEqual([told]);
    expect(chainNotifications([LOGIN], [STOPPED], undefined)).toEqual([told]);
    expect(chainNotifications([PARKED], [STOPPED], undefined)).toEqual([told]);
    // A work item the window did not hold at all held no stopped chain.
    expect(chainNotifications([], [STOPPED], undefined)).toEqual([told]);
    expect(chainNotifications([RUNNING, SEARCH], [STOPPED, { ...SEARCH, chain: chain("stopped") }], 2)).toEqual([told]);
    expect(chainNotifications([RUNNING], [{ ...STOPPED, muted: true }], undefined)).toEqual([]);
    expect(chainNotifications([RUNNING], [STOPPED], 1)).toEqual([]);
    expect(chainNotifications([STOPPED], [STOPPED], undefined)).toEqual([]);
    // A chain in another state tells nothing, whatever the window held of it.
    for (const rests of [RUNNING, REVIEWED, PARKED, LOGIN]) {
      expect(chainNotifications([STOPPED], [rests], undefined)).toEqual([]);
      expect(chainNotifications([LOGIN], [rests], undefined)).toEqual([]);
    }
  });

  it('offers "Get a seal" with the chain\'s sentence where the daemon sent the chain, disabled while the chain runs and while the window\'s own request waits for its answer, and says a refusal the daemon gave for the chain as it stands, and none while the chain runs', () => {
    const start = "Start the review rounds on Fix the login bug";
    expect(sealButton(LOGIN, false, null)).toEqual({ offered: true, enabled: true, title: start, says: "", refusal: "" });
    expect(sealButton(STOPPED, false, null)).toEqual({ offered: true, enabled: true, title: start, says: STOPPED_SAYS, refusal: "" });
    expect(sealButton(REVIEWED, false, null)).toEqual({ offered: true, enabled: true, title: start, says: "The review rounds settled at 1a2b3c4.", refusal: "" });
    expect(sealButton(PARKED, false, null)).toEqual({ offered: true, enabled: true, title: start, says: "The work item waits for the answers to its questions.", refusal: "" });
    expect(sealButton(RUNNING, false, null)).toEqual({ offered: true, enabled: false, title: "The chain is running.", says: "Review round 1 is running.", refusal: "" });
    expect(sealButton(STOPPED, true, null)).toEqual({ offered: true, enabled: false, title: "The chain is starting.", says: STOPPED_SAYS, refusal: "" });
    const refused = "The branch holds no commit after its base, so a round has nothing to read.";
    expect(sealButton(LOGIN, false, refusedSeal(LOGIN, refused))).toEqual({ offered: true, enabled: true, title: start, says: "", refusal: refused });
    expect(sealButton(STOPPED, false, refusedSeal(STOPPED, refused))).toEqual({ offered: true, enabled: true, title: start, says: STOPPED_SAYS, refusal: refused });
    // A chain that runs was started since the refusal, and one that is running says no refusal of a press on it.
    expect(sealButton(RUNNING, false, refusedSeal(STOPPED, refused)).refusal).toBe("");
    expect(sealButton(RUNNING, false, refusedSeal(RUNNING, "The chain of work item 1 is already running.")).refusal).toBe("");
  });

  it("says a refusal only while the chain stands as it stood when the daemon refused: not once a chain that no press of this window started has run and rests in another state, or in the same state since a later time", () => {
    const waits = "The work item waits for the answers to its open questions. Answer them first.";
    const atParked = refusedSeal(PARKED, waits);
    expect(atParked).toEqual({ says: waits, state: "parked", since: NOW - 4 * MINUTE });
    expect(sealButton(PARKED, false, atParked).refusal).toBe(waits);
    // The person answered, the chain ran by itself and rests: no question is open any more.
    for (const rests of [STOPPED, REVIEWED]) expect(sealButton(rests, false, atParked).refusal).toBe("");
    // A chain another window started stopped again: the same state, since a later time.
    const loose = "The worktree holds a change no commit holds, at notes.txt. A round reads a committed tree: commit the change or remove it first.";
    const atStopped = refusedSeal(STOPPED, loose);
    expect(sealButton(STOPPED, false, atStopped).refusal).toBe(loose);
    expect(sealButton({ ...STOPPED, chain: chain("stopped", { stages: [ROUND, FIX], since: NOW - MINUTE }) }, false, atStopped).refusal).toBe("");
    // A refusal for a work item no chain ran for holds until one runs, and one for a work item the window no longer lists is kept as for none.
    const atNone = refusedSeal(LOGIN, loose);
    expect(atNone).toEqual({ says: loose, state: null, since: null });
    expect(refusedSeal(undefined, loose)).toEqual(atNone);
    expect(sealButton(LOGIN, false, atNone).refusal).toBe(loose);
    expect(sealButton(STOPPED, false, atNone).refusal).toBe("");
  });

  it('draws a work item of a daemon of an earlier build, which sends no chain, as one no chain ran for, in its line, and offers no "Get a seal" for it', () => {
    for (const sessions of [[], [finished], [working], [waiting]]) expect(inboxLine(EARLIER, sessions, KINDS)).toEqual(inboxLine(LOGIN, sessions, KINDS));
    expect(lineText(EARLIER, finished, false)).toEqual(lineText(LOGIN, finished, false));
    expect(lineSince(EARLIER, finished)).toBe(NOW - 50 * MINUTE);
    expect(chainNotifications([EARLIER], [EARLIER], undefined)).toEqual([]);
    expect(chainNotifications([EARLIER], [STOPPED], undefined)).toHaveLength(1);
    expect(sealButton(EARLIER, false, null)).toEqual({ offered: false, enabled: false, title: "", says: "", refusal: "" });
    expect(sealButton(EARLIER, false, refusedSeal(EARLIER, "refused")).offered).toBe(false);
  });
});

describe("setupMark", () => {
  it("says Setting up while the setup runs and Setup failed where it failed, and nothing where it succeeded or none was named", () => {
    expect(setupMark({ ...LOGIN, setup: RUNNING_SETUP })).toBe("Setting up");
    expect(setupMark({ ...LOGIN, setup: { ...RUNNING_SETUP, state: "failed", exitCode: 3, endedAt: 2000 } })).toBe("Setup failed");
    expect(setupMark({ ...LOGIN, setup: { ...RUNNING_SETUP, state: "succeeded", exitCode: 0, endedAt: 2000 } })).toBe("");
    expect(setupMark(LOGIN)).toBe("");
  });

  it("changes neither the line's state nor its group", () => {
    const sessions = [session(4, { state: "working" })];
    for (const setup of [RUNNING_SETUP, { ...RUNNING_SETUP, state: "failed" as const }]) {
      const line = inboxLine({ ...LOGIN, setup }, sessions, KINDS);
      expect(line).toEqual(inboxLine(LOGIN, sessions, KINDS));
      expect(inboxGroups([{ line }]).map(({ heading }) => heading)).toEqual(inboxGroups([{ line: inboxLine(LOGIN, sessions, KINDS) }]).map(({ heading }) => heading));
    }
  });
});

describe("setupSection", () => {
  it("says the command has run, and for how long, while it runs, and offers no run again", () => {
    expect(setupSection({ ...LOGIN, setup: RUNNING_SETUP }, 1000 + 3 * 60_000)).toEqual({ says: "The command has run for 3 min.", command: "pnpm install", copied: [".env", "node_modules/"], more: "", failed: [], runAgain: false });
  });

  it("names the command the record holds, which a run again carries, and none where the record names none", () => {
    expect(setupSection({ ...LOGIN, setup: { ...RUNNING_SETUP, state: "failed", exitCode: 3, endedAt: 2000 } }, 9000)).toMatchObject({ command: "pnpm install", runAgain: true });
    // A command the file held in place of the one shown did not run, and is the one the section names now.
    expect(setupSection({ ...LOGIN, setup: { ...RUNNING_SETUP, command: "make\n", paneId: null, state: "failed", failure: ".worktreesetup changed after the setup was shown, so no command ran.", endedAt: 2000 } }, 9000)).toMatchObject({ says: ".worktreesetup changed after the setup was shown, so no command ran.", command: "make" });
    expect(setupSection({ ...LOGIN, setup: { ...RUNNING_SETUP, command: null, state: "succeeded", endedAt: 2000 } }, 9000)).toMatchObject({ command: "" });
    expect(RUN_SETUP_SAYS).toBe("Copy what is missing from the main checkout and run the command this section names in a new pane. Where .worktreesetup holds another command now, none runs, and the section names the new one.");
  });

  it("says how the command ended, and offers to run the setup again", () => {
    expect(setupSection({ ...LOGIN, setup: { ...RUNNING_SETUP, state: "succeeded", exitCode: 0, endedAt: 2000 } }, 9000)).toMatchObject({ says: "The command ended with code 0.", runAgain: true });
    expect(setupSection({ ...LOGIN, setup: { ...RUNNING_SETUP, state: "failed", exitCode: 3, endedAt: 2000 } }, 9000)).toMatchObject({ says: "The command ended with code 3.", runAgain: true });
    // Where the daemon says why, that sentence stands in place of the code.
    expect(setupSection({ ...LOGIN, setup: { ...RUNNING_SETUP, state: "failed", exitCode: 0, failure: "The setup pane ended before its command did.", endedAt: 2000 } }, 9000)).toMatchObject({ says: "The setup pane ended before its command did.", runAgain: true });
    expect(setupSection({ ...LOGIN, setup: { ...RUNNING_SETUP, command: null, state: "succeeded", endedAt: 2000 } }, 9000)).toMatchObject({ says: "No command runs: .worktreesetup names none.", runAgain: true });
  });

  it("lists the paths that were not copied with why, and says how many copied paths the list leaves out", () => {
    const setup = { ...RUNNING_SETUP, copied: ["a.log", "b.log"], copiedCount: 7, failedCopies: [{ path: ".env.secret", why: "EACCES: permission denied" }], state: "failed" as const, exitCode: 0, endedAt: 2000 };
    expect(setupSection({ ...LOGIN, setup }, 9000)).toEqual({ says: "The command ended with code 0.", command: "pnpm install", copied: ["a.log", "b.log"], more: "and 5 more", failed: [{ path: ".env.secret", why: "EACCES: permission denied" }], runAgain: true });
  });

  it("is nothing for a work item whose repository named no setup, and for one a daemon of an earlier build sent without the field", () => {
    expect(setupSection(LOGIN, 9000)).toBeNull();
    const { setup: _, ...earlier } = LOGIN;
    expect(setupSection(earlier as WorkItem, 9000)).toBeNull();
    expect(setupMark(earlier as WorkItem)).toBe("");
  });
});

describe("renameChoice", () => {
  it("enables the choice to rename the branch too where the plan names a branch and nothing stands in the way, and says the branch", () => {
    expect(renameChoice({ branch: "owlery/second-name", blocked: null })).toEqual({ enabled: true, says: "The branch becomes owlery/second-name." });
  });

  it("disables the choice and says why, where the plan says the branch keeps its name, and where the daemon refused the plan", () => {
    expect(renameChoice({ branch: "owlery/first-name", blocked: "The branch is already owlery/first-name." })).toEqual({ enabled: false, says: "The branch is already owlery/first-name." });
    expect(renameChoice({ branch: null, blocked: "The name leaves no letter or digit to name a branch by." })).toEqual({ enabled: false, says: "The name leaves no letter or digit to name a branch by." });
    expect(renameChoice({ error: "no work item 9" })).toEqual({ enabled: false, says: "no work item 9" });
  });

  it("disables the choice and says nothing until the daemon has answered", () => {
    expect(renameChoice(null)).toEqual({ enabled: false, says: "" });
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
        sentence: "Needs you. 2 new commits since you were last here.",
        decided: 0,
      },
    ]);
    expect(summarySentence(changes)).toBe("1 needs you");
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
    expect(sentence("waiting")).toBe("Needs you.");
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
    expect(waits.map((change) => change.sentence)).toEqual(["Needs you."]);
  });

  it("matches no session of the look to a present session: the same id is another pane after the daemon started again", () => {
    const before = look([LOGIN, SEARCH], [session(1, { workItemId: 1, state: "working" })]);
    const changes = changesSince(before, [LOGIN, SEARCH], [session(1, { workItemId: 2, state: "waiting" })], KINDS);
    expect(changes.map((change) => [change.workItem.id, change.sentence])).toEqual([
      [2, "Needs you."],
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

  describe("the decisions made without asking since the look", () => {
    function decision(id: number, fields: Partial<Decision> = {}): Decision {
      return { id, kind: "default", says: "Start from main.", grounds: "frame/questions.md Q1 states main as its default.", by: null, state: "decided", reversal: null, landed: null, since: 2000, ...fields };
    }
    const ASKED: Question = { id: 1, asks: "Which base does the branch start from?", grounds: "No document names it.", by: "sealer", options: [], default: null, answer: null, since: 3000 };
    const THIRD: WorkItem = { ...LOGIN, id: 3, title: "Third", newCommits: 1 };

    it("gives a parked work item, one that gained decisions alone and one that gained a commit and a decision as changed, the parked one first, counts the decisions apart from the one that waits, and opens the parked one", () => {
      const before = look([SEARCH, THIRD, LOGIN]);
      const changes = changesSince(before, [{ ...SEARCH, decisions: [decision(1), decision(2, { kind: "route" })] }, { ...THIRD, newCommits: 2, decisions: [decision(3)] }, { ...LOGIN, questions: [ASKED] }], [], KINDS);
      expect(changes.map((change) => [change.workItem.id, change.sentence, change.decided])).toEqual([
        [1, "Needs you.", 0],
        [2, "No agent is running. 2 decisions made without asking.", 2],
        [3, "No agent is running. 1 new commit since you were last here. 1 decision made without asking.", 1],
      ]);
      expect(summarySentence(changes)).toBe("1 needs you. 3 decisions made without asking.");
      expect(summaryHead(true, changes)).toBe("1 needs you. 3 decisions made without asking.");
      expect(summaryControls(changes).main).toEqual({ label: "Answer the first question", opens: 1 });
    });

    it("counts a decision by its id: one the look already holds adds nothing, whether or not it was reversed since, and one it does not hold counts beside it", () => {
      const held = { ...LOGIN, decisions: [decision(1), decision(2)] };
      const reversed = { ...LOGIN, decisions: [decision(1), decision(2, { state: "reversed", reversal: "main에서 시작해 주세요", since: 4000 })] };
      expect(changesSince(look([held]), [held], [], KINDS)).toEqual([]);
      expect(changesSince(look([held]), [reversed], [], KINDS)).toEqual([]);
      const gained = changesSince(look([held]), [{ ...reversed, decisions: [...reversed.decisions, decision(5)] }], [], KINDS);
      expect(gained.map((change) => [change.sentence, change.decided])).toEqual([["No agent is running. 1 decision made without asking.", 1]]);
      // A decision recorded since the look and already reversed is one the look does not hold.
      const both = changesSince(look([LOGIN]), [reversed], [], KINDS);
      expect(both.map((change) => change.decided)).toEqual([2]);
    });

    it("counts every decision of a work item the look does not hold, after the words that it is new", () => {
      const changes = changesSince(look([]), [{ ...LOGIN, decisions: [decision(1), decision(2)] }], [], KINDS);
      expect(changes.map((change) => [change.sentence, change.decided])).toEqual([["No agent is running. New since you were last here. 2 decisions made without asking.", 2]]);
    });

    it("says an answered work item's state as its panes give it again, and names no decision for it", () => {
      const answered = { ...LOGIN, questions: [{ ...ASKED, answer: "main", since: 5000 }] };
      const changes = changesSince(look([{ ...LOGIN, questions: [ASKED] }]), [answered], [session(3, { state: "working" })], KINDS);
      expect(changes.map((change) => [change.sentence, change.decided])).toEqual([["Is working.", 0]]);
      expect(changesSince(look([{ ...LOGIN, questions: [ASKED] }]), [{ ...LOGIN, questions: [ASKED] }], [session(3, { state: "working" })], KINDS)).toEqual([]);
    });

    it("reads a work item without the fields, in a look written before them and from a daemon of an earlier build, as one with no decision and no record, and throws at none", () => {
      const { decisions: _decisions, questions: _questions, unread: _unread, ...before } = LOGIN;
      const EARLIER = before as WorkItem;
      expect(changesSince(look([EARLIER]), [EARLIER], [], KINDS)).toEqual([]);
      expect(changesSince(look([LOGIN]), [EARLIER], [], KINDS)).toEqual([]);
      // Every decision is one a look written before the decisions does not hold.
      const changes = changesSince(look([EARLIER]), [{ ...LOGIN, decisions: [decision(1)] }], [], KINDS);
      expect(changes.map((change) => change.decided)).toEqual([1]);
      expect(changesSince(look([]), [EARLIER], [], KINDS).map((change) => change.decided)).toEqual([0]);
      expect(summaryControls(changesSince(look([]), [EARLIER], [], KINDS)).main.opens).toBe("inbox");
    });
  });
});

describe("summarySentence", () => {
  function change(state: InboxLine["state"], decided = 0): { line: InboxLine; decided: number } {
    return { line: { title: "Fix the login bug", branch: "owlery/fix-the-login-bug", state, commits: "" }, decided };
  }

  it("counts the changed work items by their present state, in the inbox's order and words, and leaves out the ones with no state", () => {
    expect(summarySentence([change("finished"), change("waiting"), change(null)])).toBe("1 needs you, 1 finished");
    expect(summarySentence([change("working"), change("working")])).toBe("2 working");
  });

  it("says how many work items changed where none of them has a state", () => {
    expect(summarySentence([change(null)])).toBe("1 work item changed");
    expect(summarySentence([change(null), change(null)])).toBe("2 work items changed");
  });

  it("adds after a full stop how many decisions were made without asking, the sum over the changed work items, of one and of several, and nothing where the sum is zero", () => {
    expect(summarySentence([change("waiting"), change(null, 2), change("finished", 1)])).toBe("1 needs you, 1 finished. 3 decisions made without asking.");
    expect(summarySentence([change("working", 1)])).toBe("1 working. 1 decision made without asking.");
    expect(summarySentence([change(null, 2), change(null)])).toBe("2 work items changed. 2 decisions made without asking.");
    expect(summarySentence([change("waiting", 0), change("waiting")])).toBe("2 need you");
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

  it("gives the live pane with the highest id where the one last in front is no longer a tab, or none was", () => {
    const tabs = [session(2), session(6), session(7, { alive: false })];
    expect(paneInFront(tabs, 9)).toBe(6);
    expect(paneInFront(tabs, undefined)).toBe(6);
  });

  it("gives the tab with the highest id where none is alive", () => {
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
    // Pane 9 was in front and is closed, so the live pane of the view with the highest id follows it, whichever were in front before.
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

  it("puts the pane in front and then the panes of the stage order, up to four, on the stage of a view with more tabs, in the tabs' order, so a pressed tab that was not shown takes the place of the shown pane last in the stage order", () => {
    // Panes 3, 5, 2 and 6 are on the stage, and the tab of pane 1 is pressed.
    expect(stageOf(six, [1, 3, 5, 2, 6], true)).toEqual({ front: 1, shown: [1, 2, 3, 5] });
  });

  it("fills the stage with the tabs that were never in front, the highest id first, after the ones that were", () => {
    // After a load no pane was in front, so the live pane with the highest id is.
    expect(stageOf(six, [], true)).toEqual({ front: 6, shown: [3, 4, 5, 6] });
    expect(stageOf(six, [2], true)).toEqual({ front: 2, shown: [2, 4, 5, 6] });
    // No pane was in front and the four tabs with the highest ids have exited, so the live pane is in front and on the stage.
    const oneLive = [session(1), session(2, { alive: false }), session(3, { alive: false }), session(4, { alive: false }), session(5, { alive: false })];
    expect(stageOf(oneLive, [], true)).toEqual({ front: 1, shown: [1, 3, 4, 5] });
  });

  it("gives a pane no longer among the tabs no place on the stage, so where the pane in front closed the first four panes of the stage order stand on the stage, tabs never in front among them where fewer than four of the tabs were in front, and the live one of the four with the highest id has the keyboard, or the one of them with the highest id where none runs, and counts a pane named twice once", () => {
    expect(stageOf(six, [9, 2, 9, 2, 1, 3, 4], true)).toEqual({ front: 4, shown: [1, 2, 3, 4] });
    // Pane 4 has exited, so pane 3, the live one of the four with the highest id, has the keyboard, and not pane 2, the last in front before pane 9.
    const exited = [session(1), session(2), session(3), session(4, { alive: false }), session(5), session(6)];
    expect(stageOf(exited, [9, 2, 1, 3, 4], true)).toEqual({ front: 3, shown: [1, 2, 3, 4] });
    // Panes 1 to 4 have exited, so pane 4, the highest id of the four, has the keyboard, and not pane 1, the last in front before pane 9, nor panes 5 and 6, which run off the stage.
    const fourExited = [session(1, { alive: false }), session(2, { alive: false }), session(3, { alive: false }), session(4, { alive: false }), session(5), session(6)];
    expect(stageOf(fourExited, [9, 1, 2, 3, 4], true)).toEqual({ front: 4, shown: [1, 2, 3, 4] });
    // Only pane 6 was in front besides pane 2, which closed, so pane 3, never in front and not on the stage before, takes pane 2's place, and where pane 6 has exited pane 5, never in front, has the keyboard.
    const twoInFront = [session(1), session(3), session(4), session(5), session(6)];
    expect(stageOf(twoInFront, [2, 6], true)).toEqual({ front: 6, shown: [3, 4, 5, 6] });
    expect(stageOf([session(1), session(3), session(4), session(5), session(6, { alive: false })], [2, 6], true)).toEqual({ front: 5, shown: [3, 4, 5, 6] });
  });
});

describe("recentKept", () => {
  it("keeps a closed pane that was the most recent, so the live pane with the highest id comes in front and not the pane in front before it", () => {
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
    expect(notificationFor("working", session(3, { state: "waiting" }), false, [LOGIN], KINDS)).toEqual({ title: "Fix the login bug", body: "Needs you" });
  });

  it("says a session finished, when its state becomes finished", () => {
    expect(notificationFor("working", session(3, { state: "finished" }), false, [LOGIN], KINDS)).toEqual({ title: "Fix the login bug", body: "Finished" });
  });

  it("is titled with the tab's label for a pane without a work item", () => {
    expect(notificationFor(null, session(3, { workItemId: null, state: "waiting" }), false, [LOGIN], KINDS)).toEqual({ title: "Claude Code", body: "Needs you" });
  });

  it("shows nothing when the state becomes working or none", () => {
    expect(notificationFor("waiting", session(3, { state: "working" }), false, [LOGIN], KINDS)).toBeNull();
    expect(notificationFor("finished", session(3, { state: null }), false, [LOGIN], KINDS)).toBeNull();
  });

  it("shows nothing for a session of a muted work item, and the notification for the same session where the work item is not muted", () => {
    const waits = session(3, { state: "waiting" });
    expect(notificationFor("working", waits, false, [{ ...LOGIN, muted: true }], KINDS)).toBeNull();
    expect(notificationFor("working", session(3, { state: "finished" }), false, [{ ...LOGIN, muted: true }], KINDS)).toBeNull();
    expect(notificationFor("working", waits, false, [LOGIN], KINDS)).toEqual({ title: "Fix the login bug", body: "Needs you" });
    // Another work item's mute says nothing of this session.
    expect(notificationFor("working", waits, false, [LOGIN, { ...SEARCH, muted: true }], KINDS)).toEqual({ title: "Fix the login bug", body: "Needs you" });
  });

  it("shows nothing for a session of an archived work item, which the list of work items does not hold, and the notification for a session of another", () => {
    const shelved: WorkItem = { ...LOGIN, archivedAt: 50 };
    expect(notificationFor("working", session(3, { state: "finished" }), false, [SEARCH], KINDS, [shelved])).toBeNull();
    expect(notificationFor("working", session(3, { state: "waiting" }), false, [SEARCH], KINDS, [shelved])).toBeNull();
    expect(notificationFor("working", session(3, { workItemId: 2, state: "finished" }), false, [SEARCH], KINDS, [shelved])).toEqual({ title: "Speed up search", body: "Finished" });
    expect(notificationFor(null, session(3, { workItemId: null, state: "waiting" }), false, [SEARCH], KINDS, [shelved])).toEqual({ title: "Claude Code", body: "Needs you" });
  });

  it("shows nothing for a state the session was already in", () => {
    expect(notificationFor("waiting", session(3, { state: "waiting" }), false, [LOGIN], KINDS)).toBeNull();
    expect(notificationFor("finished", session(3, { state: "finished" }), false, [LOGIN], KINDS)).toBeNull();
  });

  it("shows nothing for the pane in front of a focused window", () => {
    expect(notificationFor("working", session(3, { state: "waiting" }), true, [LOGIN], KINDS)).toBeNull();
  });
});

describe("notificationOpens", () => {
  it("opens the session's work item with the session's pane, where both are listed", () => {
    expect(notificationOpens({ id: 4, workItemId: 2 }, [LOGIN, SEARCH], [session(3), session(4, { workItemId: 2 })])).toEqual({ workItemId: 2, pane: 4 });
  });

  it("opens the work item with no pane named, where the session's pane is no longer listed", () => {
    expect(notificationOpens({ id: 4, workItemId: 2 }, [LOGIN, SEARCH], [session(3)])).toEqual({ workItemId: 2, pane: null });
  });

  it("opens nothing for a session whose work item is not in the list, though its pane is", () => {
    expect(notificationOpens({ id: 4, workItemId: 2 }, [LOGIN], [session(4, { workItemId: 2 })])).toBeNull();
  });

  it("opens nothing for a session without a work item", () => {
    expect(notificationOpens({ id: 4, workItemId: null }, [LOGIN, SEARCH], [session(4, { workItemId: null })])).toBeNull();
  });
});

describe("workItemFields", () => {
  it("gives the folder and the title without the spaces around them, with the generated name and the chosen base", () => {
    expect(workItemFields("  /r/project ", " Fix the login bug  ", "amber-heron", "origin/main")).toEqual({ repo: "/r/project", title: "Fix the login bug", name: "amber-heron", base: "origin/main" });
  });

  it("refuses an empty folder, so nothing is sent that the daemon would run in its own folder", () => {
    expect(workItemFields("   ", "Fix the login bug", "amber-heron", "main")).toEqual({ error: "Choose the repository folder." });
  });

  it("gives the fields of a creation for an empty name, which the daemon names by the generated name", () => {
    expect(workItemFields("/r/project", " ", "amber-heron", "main")).toEqual({ repo: "/r/project", title: "", name: "amber-heron", base: "main" });
  });

  it("gives no base where none is chosen, so the daemon starts the work item from the default base", () => {
    expect(workItemFields("/r/project", "", "amber-heron", null)).toEqual({ repo: "/r/project", title: "", name: "amber-heron" });
  });
});

// A plan's answer as the form holds it: a clone whose checkout stands on `feature`.
const PLAN: FormPlan = {
  repo: "/r/project",
  branch: "owlery/amber-heron",
  worktree: "/w/project/amber-heron",
  localBases: ["feature", "main", "owlery/fix-the-login-bug"],
  remoteBases: ["origin/main", "origin/release"],
  defaultBase: "origin/main",
  setupCommand: null,
  includes: false,
};

describe("planAnswer", () => {
  it("tells the answer to the form's latest plan from the answer to an earlier one, which is not shown", () => {
    expect(planAnswer(7, new Set([5, 7]), 7)).toBe("latest");
    expect(planAnswer(7, new Set([5, 7]), 5)).toBe("earlier");
  });

  it("is of no plan where the form asked no plan under the id, so a creation's error keeps its place", () => {
    expect(planAnswer(7, new Set([5, 7]), 6)).toBe("other");
    expect(planAnswer(undefined, new Set(), 1)).toBe("other");
  });

  it("is an earlier plan's once the form has asked for no plan since it was emptied", () => {
    expect(planAnswer(undefined, new Set([5]), 5)).toBe("earlier");
  });
});

describe("planLine", () => {
  it("shows the branch and the folder the plan's answer gave, and no setup where the repository names none", () => {
    expect(planLine(PLAN, " /r/project ")).toEqual({ branch: "owlery/amber-heron", worktree: "/w/project/amber-heron", setup: "", failed: false });
  });

  it("names the setup the repository's two files name: the copy where .worktreeinclude stands, and the command .worktreesetup holds", () => {
    expect(planLine({ ...PLAN, setupCommand: "pnpm install\n", includes: true }, "/r/project").setup).toBe("Copies the ignored files .worktreeinclude names from the main checkout. Then runs: pnpm install");
    expect(planLine({ ...PLAN, setupCommand: "pnpm install\n" }, "/r/project").setup).toBe("Then runs: pnpm install");
    expect(planLine({ ...PLAN, includes: true }, "/r/project").setup).toBe("Copies the ignored files .worktreeinclude names from the main checkout.");
  });

  it("shows the error's message in the place of the branch where the daemon refused the plan", () => {
    expect(planLine({ repo: "/r/nowhere", error: "/r/nowhere is not inside a git repository" }, "/r/nowhere")).toEqual({ branch: "/r/nowhere is not inside a git repository", worktree: "", setup: "", failed: true });
  });

  it("shows nothing where the form holds no answer, and where the answer is of another repository's text", () => {
    const nothing = { branch: "", worktree: "", setup: "", failed: false };
    expect(planLine(null, "/r/project")).toEqual(nothing);
    expect(planLine(PLAN, "/r/other")).toEqual(nothing);
    expect(planLine({ repo: "/r/nowhere", error: "/r/nowhere is not inside a git repository" }, "/r/project")).toEqual(nothing);
  });
});

describe("shownSetup", () => {
  it("gives the command the form shows for the repository field's text, whole, and none where the daemon refused the plan, so a creation carries what the person read", () => {
    expect(shownSetup({ ...PLAN, setupCommand: "pnpm install\n" }, " /r/project ")).toEqual({ setupCommand: "pnpm install\n" });
    expect(shownSetup(PLAN, "/r/project")).toEqual({ setupCommand: null });
    expect(shownSetup({ repo: "/r/nowhere", error: "/r/nowhere is not inside a git repository" }, "/r/nowhere")).toEqual({ setupCommand: null });
  });

  it("gives nothing while the form holds no answer for the field's text, as after a key in the folder field and before the plan answers, so the form creates nothing yet", () => {
    expect(shownSetup(null, "/r/project")).toBeNull();
    expect(shownSetup({ ...PLAN, setupCommand: "pnpm install\n" }, "/r/project-2")).toBeNull();
    expect(PLAN_AWAITED).toBe("Wait until the form shows what this folder's work item gets, its setup among it.");
  });
});

describe("baseMenu", () => {
  it("holds the default base first and chosen, then the local branches and the remotes' branches, with the default base in neither", () => {
    expect(baseMenu(PLAN, null, "/r/project")).toEqual({ first: "origin/main", local: ["feature", "main", "owlery/fix-the-login-bug"], remote: ["origin/release"], value: "origin/main" });
    expect(baseMenu({ ...PLAN, remoteBases: [], defaultBase: "main" }, null, "/r/project")).toEqual({ first: "main", local: ["feature", "owlery/fix-the-login-bug"], remote: [], value: "main" });
  });

  it("keeps the person's choice while the repository's text is the same and the answer lists the base", () => {
    expect(baseMenu(PLAN, { repo: "/r/project", base: "feature" }, "/r/project ").value).toBe("feature");
    expect(baseMenu(PLAN, { repo: "/r/project", base: "origin/release" }, "/r/project").value).toBe("origin/release");
  });

  it("goes back to the default base where the choice was made for another repository's text, or the answer no longer lists it", () => {
    expect(baseMenu(PLAN, { repo: "/r/other", base: "feature" }, "/r/project").value).toBe("origin/main");
    expect(baseMenu(PLAN, { repo: "/r/project", base: "gone" }, "/r/project").value).toBe("origin/main");
  });

  it("holds nothing and chooses nothing where the form holds no answer, an error, or an answer of another repository's text", () => {
    const empty = { first: null, local: [], remote: [], value: null };
    expect(baseMenu(null, null, "/r/project")).toEqual(empty);
    expect(baseMenu({ repo: "/r/project", error: "refused" }, { repo: "/r/project", base: "main" }, "/r/project")).toEqual(empty);
    expect(baseMenu(PLAN, { repo: "/r/project", base: "feature" }, "/r/other")).toEqual(empty);
    expect(baseMenu({ ...PLAN, localBases: [], remoteBases: [], defaultBase: null }, null, "/r/project")).toEqual(empty);
  });

  it("chooses the first base listed where the repository has no default base, so the menu shows what the creation sends", () => {
    expect(baseMenu({ ...PLAN, localBases: [], remoteBases: ["fork/main"], defaultBase: null }, null, "/r/project")).toEqual({ first: null, local: [], remote: ["fork/main"], value: "fork/main" });
  });
});

describe("asksFetch", () => {
  it("asks for a remote's branch the form has not asked for under the repository's text", () => {
    expect(asksFetch(PLAN, "origin/main", " /r/project ", false, new Set())).toBe(true);
    expect(asksFetch(PLAN, "origin/release", "/r/project", false, new Set([baseKey("/r/project", "origin/main")]))).toBe(true);
    // The same base under another repository's text is another base.
    expect(asksFetch({ ...PLAN, repo: "/r/other" }, "origin/main", "/r/other", false, new Set([baseKey("/r/project", "origin/main")]))).toBe(true);
  });

  it("asks nothing for a base it asked for since it opened, whatever the spaces around the repository's text", () => {
    expect(asksFetch(PLAN, "origin/main", "/r/project ", false, new Set([baseKey(" /r/project", "origin/main")]))).toBe(false);
  });

  it("asks nothing for a local base, and none for a local branch that bears the name of a remote's, which the daemon reads as the local one", () => {
    expect(asksFetch(PLAN, "feature", "/r/project", false, new Set())).toBe(false);
    expect(asksFetch({ ...PLAN, localBases: ["origin/main"] }, "origin/main", "/r/project", false, new Set())).toBe(false);
  });

  it('asks nothing under "Register the repository only", with no base in the menu, for a base the plan does not list, and for a plan of another repository\'s text or a refused one', () => {
    expect(asksFetch(PLAN, "origin/main", "/r/project", true, new Set())).toBe(false);
    expect(asksFetch(PLAN, null, "/r/project", false, new Set())).toBe(false);
    expect(asksFetch(PLAN, "origin/gone", "/r/project", false, new Set())).toBe(false);
    expect(asksFetch(null, "origin/main", "/r/project", false, new Set())).toBe(false);
    expect(asksFetch(PLAN, "origin/main", "/r/other", false, new Set())).toBe(false);
    expect(asksFetch({ repo: "/r/project", error: "refused" }, "origin/main", "/r/project", false, new Set())).toBe(false);
  });
});

describe("baseSays", () => {
  const COMMIT = "0123456789abcdef0123456789abcdef01234567";
  const fetched: BaseFetch = { base: "origin/main", commit: COMMIT, fetch: "fetched", failure: null, since: null };
  // Built in a case, since the times it names are declared further down.
  const kept = (): BaseFetch => ({ base: "origin/main", commit: COMMIT, fetch: "kept", failure: "fatal: '/r/origin' does not appear to be a git repository", since: NOW - 72 * HOUR });

  it("says that the branch is being fetched while the answer is awaited", () => {
    expect(baseSays("origin/main", "awaited", NOW)).toBe("Fetching origin/main…");
  });

  it("says the commit the remote's branch is at once it was fetched, cut to seven characters", () => {
    expect(baseSays("origin/main", fetched, NOW)).toBe("Fetched: origin/main is at 0123456.");
  });

  it("says why a branch could not be fetched, the commit it starts at, and how long the clone has held it", () => {
    expect(baseSays("origin/main", kept(), NOW)).toBe(`origin/main could not be fetched (fatal: '/r/origin' does not appear to be a git repository). It starts as last fetched, at 0123456, which the clone has held for ${ageOf(NOW - 72 * HOUR, NOW)}.`);
    expect(ageOf(NOW - 72 * HOUR, NOW)).toBe("3 days");
  });

  it("says no age where git recorded no move of the clone's branch", () => {
    expect(baseSays("origin/main", { ...kept(), failure: "origin did not answer in 10 seconds", since: null }, NOW)).toBe("origin/main could not be fetched (origin did not answer in 10 seconds). It starts as last fetched, at 0123456.");
  });

  it("says the daemon's refusal in the refusal's own words", () => {
    expect(baseSays("origin/main", { error: "/r/project is not inside a git repository" }, NOW)).toBe("/r/project is not inside a git repository");
  });

  it("says nothing for a local base, for a base nothing was asked of, for one no answer came for, and with no base in the menu", () => {
    expect(baseSays("main", { base: "main", commit: COMMIT, fetch: "none", failure: null, since: null }, NOW)).toBe("");
    expect(baseSays("origin/main", undefined, NOW)).toBe("");
    expect(baseSays("origin/main", null, NOW)).toBe("");
    expect(baseSays(null, "awaited", NOW)).toBe("");
  });

  describe("lateSays", () => {
    it("says the sentence of a branch that could not be fetched, for the status line of a creation sent before the answer", () => {
      expect(lateSays("origin/main", kept(), NOW)).toBe(baseSays("origin/main", kept(), NOW));
      expect(lateSays("origin/main", kept(), NOW)).toContain("could not be fetched");
    });

    it("says nothing of a branch that was fetched, of a refusal, and while no answer came", () => {
      expect(lateSays("origin/main", fetched, NOW)).toBe("");
      expect(lateSays("origin/main", { error: "refused" }, NOW)).toBe("");
      expect(lateSays("origin/main", "awaited", NOW)).toBe("");
      expect(lateSays("origin/main", null, NOW)).toBe("");
    });
  });

  describe("unanswered", () => {
    it("waits two seconds longer for an answer than the daemon gives a fetch", () => {
      expect(BASE_ANSWER_MS).toBe(BASE_FETCH_MS + 2_000);
    });

    it("holds no answer once the wait has passed with none, so the form stops saying that it fetches", () => {
      expect(unanswered("awaited")).toBeNull();
      expect(baseSays("origin/main", unanswered("awaited"), NOW)).toBe("");
    });

    it("keeps an answer that came before the wait passed", () => {
      expect(unanswered(fetched)).toBe(fetched);
      expect(unanswered(kept())).toEqual(kept());
      expect(unanswered({ error: "refused" })).toEqual({ error: "refused" });
      expect(unanswered(null)).toBeNull();
    });
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

describe("withoutHeadless", () => {
  it("takes the session of the id out of the sessions the window holds, and leaves the others in their order", () => {
    expect(withoutHeadless([headless(1), headless(2), headless(3)], 2)).toEqual([headless(1), headless(3)]);
  });

  it("leaves the sessions as they are where the window holds none of the id", () => {
    expect(withoutHeadless([headless(1), headless(3)], 2)).toEqual([headless(1), headless(3)]);
  });
});

describe("headlessLines", () => {
  it("says each session's prompt, its state and its answer with the line breaks kept, the most recent first", () => {
    const sessions = [headless(1, { state: "finished", answer: "src/login/form.ts\nsrc/login/submit.ts" }), headless(2, { prompt: "And the tests?", answer: "test/" })];
    expect(headlessLines(sessions, LOGIN)).toEqual([
      { id: 2, prompt: "And the tests?", state: "working", mark: "working", words: "working", text: "test/", errorOutput: "", stop: true, asks: [] },
      { id: 1, prompt: "Which file holds the login form?", state: "finished", mark: "finished", words: "finished", text: "src/login/form.ts\nsrc/login/submit.ts", errorOutput: "", stop: false, asks: [] },
    ]);
  });

  it("shows a failed session's error in place of its answer", () => {
    const failed = headless(3, { state: "failed", answer: "src/lo", error: "the session exited with code 1 and gave no result" });
    expect(headlessLines([failed], LOGIN)).toEqual([{ id: 3, prompt: "Which file holds the login form?", state: "failed", mark: "failed", words: "failed", text: "the session exited with code 1 and gave no result", errorOutput: "", stop: false, asks: [] }]);
  });

  it("gives a failed session's error output after its error, with its line breaks kept, and none of a session that did not fail", () => {
    const failed = headless(3, { state: "failed", error: "the session exited with code 1 and gave no result", errorOutput: "warning: no config\nerror: unknown option '--no-such-option'\n" });
    const finished = headless(4, { state: "finished", answer: "src/login", errorOutput: "warning: no config\n" });
    expect(headlessLines([failed, finished], LOGIN).map(({ id, errorOutput }) => ({ id, errorOutput }))).toEqual([
      { id: 4, errorOutput: "" },
      { id: 3, errorOutput: "warning: no config\nerror: unknown option '--no-such-option'\n" },
    ]);
  });

  it("offers Stop on the line of a session that is working, and on no line of one that ended", () => {
    const sessions = [headless(1), headless(2, { state: "finished" }), headless(3, { state: "failed", error: "the session reached its time limit and was stopped", stopped: "limit" })];
    expect(headlessLines(sessions, LOGIN).map(({ id, stop }) => ({ id, stop }))).toEqual([
      { id: 3, stop: false },
      { id: 2, stop: false },
      { id: 1, stop: true },
    ]);
  });

  it("gives the lines of the one work item alone", () => {
    const sessions = [headless(1), headless(2, { workItemId: 2 }), headless(3)];
    expect(headlessLines(sessions, LOGIN).map((line) => line.id)).toEqual([3, 1]);
    expect(headlessLines(sessions, SEARCH).map((line) => line.id)).toEqual([2]);
    expect(headlessLines(sessions, { ...LOGIN, id: 3 })).toEqual([]);
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
  const DOCS_REPO: Repository = { ...PROJECT, id: 2, folder: "/r/docs", name: "docs" };
  const DOCS: WorkItem = { ...LOGIN, id: 3, title: "Write the guide", repoId: 2, repo: "/r/docs", repoName: "docs", branch: "owlery/write-the-guide" };
  const rows = (tree: ReturnType<typeof sidebarTree>) => tree.map((repository) => [repository.id, repository.repo, repository.name, repository.count, repository.entries.map((entry) => entry.workItem.id)]);
  /** Each repository of a tree with its count, its ungrouped work items and its groups, each group with its name, its id and its work items. */
  const grouping = (tree: ReturnType<typeof sidebarTree>) => tree.map((repository) => [repository.name, repository.count, repository.entries.map((entry) => entry.workItem.id), repository.groups.map((group) => [group.name, group.id, group.entries.map((entry) => entry.workItem.id)])]);

  it("lists every repository the daemon keeps that is not hidden, in the daemon's order, each with its name, its count and its work items in the daemon's order, a repository with no work item among them", () => {
    const hidden: Repository = { ...PROJECT, id: 3, folder: "/r/hidden", name: "hidden", hidden: true };
    const empty: Repository = { ...PROJECT, id: 4, folder: "/r/empty", name: "empty" };
    const unseen: WorkItem = { ...LOGIN, id: 4, title: "Out of sight", repoId: 3, repo: "/r/hidden", repoName: "hidden" };
    const sessions = [session(4, { workItemId: 2, state: "waiting" })];
    // The repositories stand in the store's order, whichever has the first work item.
    const tree = sidebarTree([DOCS_REPO, hidden, empty, PROJECT], [LOGIN, unseen, DOCS, SEARCH], sessions, KINDS);
    expect(rows(tree)).toEqual([
      [2, "/r/docs", "docs", 1, [3]],
      [4, "/r/empty", "empty", 0, []],
      [1, "/r/project", "project", 2, [1, 2]],
    ]);
    expect(tree[2]?.entries[1]?.line.state).toBe("waiting");
  });

  it("puts a repository's pinned work items before its others, each in the daemon's order, and none before a work item of another repository", () => {
    const pinned: WorkItem = { ...SEARCH, pinned: true };
    const fourth: WorkItem = { ...LOGIN, id: 4, title: "Fourth", pinned: true };
    const guide: WorkItem = { ...DOCS, pinned: true };
    expect(rows(sidebarTree([PROJECT, DOCS_REPO], [LOGIN, pinned, guide, fourth], [], KINDS))).toEqual([
      [1, "/r/project", "project", 3, [2, 4, 1]],
      [2, "/r/docs", "docs", 1, [3]],
    ]);
  });

  it("lists under a repository its ungrouped work items, the pinned one first, and then each group with its own, and leaves a hidden repository out", () => {
    const hidden: Repository = { ...PROJECT, id: 3, folder: "/r/hidden", name: "hidden", hidden: true, groups: [{ id: 9, name: "Unseen" }] };
    const empty: Repository = { ...PROJECT, id: 4, folder: "/r/empty", name: "empty" };
    const grouped: Repository = { ...PROJECT, groups: [{ id: 7, name: "Later" }] };
    const pinned: WorkItem = { ...SEARCH, pinned: true };
    const later: WorkItem = { ...LOGIN, id: 5, title: "Later on", groupId: 7 };
    const unseen: WorkItem = { ...LOGIN, id: 6, repoId: 3, groupId: 9 };
    expect(grouping(sidebarTree([grouped, hidden, empty], [LOGIN, later, pinned, unseen], [], KINDS))).toEqual([
      ["project", 3, [2, 1], [["Later", 7, [5]]]],
      ["empty", 0, [], []],
    ]);
  });

  it("lists a repository's groups in the order they were made, one with no work item among them, each group's pinned work items before its others, and a work item whose group its repository does not hold among the ungrouped", () => {
    const grouped: Repository = { ...PROJECT, groups: [{ id: 7, name: "Later" }, { id: 8, name: "Drafts" }, { id: 4, name: "Earlier id, made last" }] };
    const other: Repository = { ...DOCS_REPO, groups: [{ id: 9, name: "Theirs" }] };
    const items: WorkItem[] = [
      { ...LOGIN, groupId: 4 },
      { ...SEARCH, groupId: 7 },
      { ...LOGIN, id: 5, groupId: 7, pinned: true },
      // A group of another repository, and one no repository holds.
      { ...LOGIN, id: 6, groupId: 9 },
      { ...LOGIN, id: 7, groupId: 99 },
      { ...DOCS, groupId: 9 },
    ];
    expect(grouping(sidebarTree([grouped, other], items, [], KINDS))).toEqual([
      ["project", 5, [6, 7], [["Later", 7, [5, 2]], ["Drafts", 8, []], ["Earlier id, made last", 4, [1]]]],
      ["docs", 1, [], [["Theirs", 9, [3]]]],
    ]);
  });

  it("leaves out a group none of whose work items a search or a filter leaves, counts under the repository the ones left in and out of its groups, and marks a grouped title as an ungrouped one", () => {
    const grouped: Repository = { ...PROJECT, groups: [{ id: 7, name: "Later" }, { id: 8, name: "Drafts" }] };
    const items: WorkItem[] = [LOGIN, { ...SEARCH, groupId: 7 }, { ...LOGIN, id: 5, title: "Search the logs", branch: "owlery/search-the-logs", groupId: 8 }];
    const sessions = [session(4, { workItemId: 2, state: "waiting" })];
    expect(grouping(sidebarTree([grouped], items, sessions, KINDS, "search"))).toEqual([["project", 2, [], [["Later", 7, [2]], ["Drafts", 8, [5]]]]]);
    expect(grouping(sidebarTree([grouped], items, sessions, KINDS, "", "waiting"))).toEqual([["project", 1, [], [["Later", 7, [2]]]]]);
    expect(grouping(sidebarTree([grouped], items, sessions, KINDS, "login"))).toEqual([["project", 1, [1], []]]);
    // A repository whose one match stands in a group is listed, and one with a group and no match is not.
    expect(grouping(sidebarTree([grouped], items, sessions, KINDS, "nowhere"))).toEqual([]);
    expect(sidebarTree([grouped], items, sessions, KINDS, "LOGS")[0]?.groups[0]?.entries.map((entry) => [entry.line.title, entry.marks])).toEqual([["Search the logs", [[11, 15]]]]);
  });

  it("puts a work item under the repository whose id it names, whatever folder and name the work item carries, and keeps two repositories of one name apart", () => {
    const other: Repository = { ...PROJECT, id: 2, folder: "/elsewhere/project" };
    const moved: WorkItem = { ...SEARCH, repoId: 2 };
    expect(rows(sidebarTree([PROJECT, other], [LOGIN, moved], [], KINDS))).toEqual([
      [1, "/r/project", "project", 1, [1]],
      [2, "/elsewhere/project", "project", 1, [2]],
    ]);
  });

  it("names a repository as the daemon names it, and carries its icon, or none", () => {
    expect(sidebarTree([{ ...PROJECT, name: "the project", customName: "the project", icon: "P" }, { ...PROJECT, id: 2 }], [LOGIN], [], KINDS).map((repository) => [repository.name, repository.icon])).toEqual([
      ["the project", "P"],
      ["project", null],
    ]);
  });

  it("makes up no repository: it lists none where the daemon sends none, and none for a work item whose repository the daemon did not send", () => {
    expect(sidebarTree([], [], [], KINDS)).toEqual([]);
    expect(sidebarTree([], [LOGIN, DOCS], [], KINDS)).toEqual([]);
    expect(rows(sidebarTree([PROJECT], [LOGIN, DOCS], [], KINDS))).toEqual([[1, "/r/project", "project", 1, [1]]]);
  });

  it("marks in each title the letters a search matches, and none where nothing is typed or the match stands elsewhere", () => {
    const titles = (query: string) => sidebarTree([PROJECT, DOCS_REPO], [LOGIN, SEARCH, DOCS], [], KINDS, query).flatMap((repository) => repository.entries.map((entry) => [entry.line.title, entry.marks]));
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

  it("counts under a repository the work items a search and a filter leave, and leaves out a repository none of whose work items is left, one with no work item among them, while a search is typed or a state is chosen", () => {
    const empty: Repository = { ...PROJECT, id: 4, folder: "/r/empty", name: "empty" };
    const sessions = [session(4, { workItemId: 2, state: "waiting" }), session(5, { workItemId: 3, state: "waiting" })];
    const counts = (query: string, state: Parameters<typeof sidebarTree>[5]) =>
      sidebarTree([PROJECT, empty, DOCS_REPO], [LOGIN, SEARCH, DOCS], sessions, KINDS, query, state).map((repository) => [repository.name, repository.count, repository.entries.map((entry) => entry.workItem.id)]);
    expect(counts("", "all")).toEqual([
      ["project", 2, [1, 2]],
      ["empty", 0, []],
      ["docs", 1, [3]],
    ]);
    expect(counts("login", "all")).toEqual([["project", 1, [1]]]);
    expect(counts("", "waiting")).toEqual([
      ["project", 1, [2]],
      ["docs", 1, [3]],
    ]);
    expect(counts("the", "waiting")).toEqual([["docs", 1, [3]]]);
    // The repository's own name is typed, and it has no work item to show for it.
    expect(counts("empty", "all")).toEqual([]);
    expect(counts("nowhere", "all")).toEqual([]);
  });
});

describe("daemonLists", () => {
  it("gives the repositories and the archived work items a `ready` or an `inbox` carries", () => {
    const archived: WorkItem = { ...SEARCH, archivedAt: 50 };
    expect(daemonLists({ repositories: [PROJECT], archived: [archived] })).toEqual({ repositories: [PROJECT], archived: [archived] });
    expect(daemonLists({ repositories: [], archived: [] })).toEqual({ repositories: [], archived: [] });
    expect(daemonLists({ repositories: [PROJECT] })).toEqual({ repositories: [PROJECT], archived: [] });
  });

  it("gives no repository and no archived work item where the daemon sends no repositories, and says nothing of that daemon", () => {
    expect(daemonLists({})).toEqual({ repositories: [], archived: [] });
    // What an earlier daemon's `ready` holds, as the window receives it.
    const lists = daemonLists(JSON.parse(JSON.stringify({ type: "ready", sessions: [], workItems: [LOGIN], paneKinds: KINDS, headless: [], lastLook: null })));
    expect(lists).toEqual({ repositories: [], archived: [] });
    expect(Object.keys(lists).sort()).toEqual(["archived", "repositories"]);
  });
});

describe("daemonNotice", () => {
  it("names the menu's entry that replaces a daemon of another build, and says nothing of a daemon of the running build", () => {
    expect(daemonNotice(true)).toBe(`Owlery's background process is from another build. Choose "Restart Daemon…" from the menu to replace it.`);
    expect(daemonNotice(false)).toBe("");
  });
});

describe("statusNotice", () => {
  const OWN = "The theme could not be saved.";
  const DAEMON = daemonNotice(true);
  const AGENT = `Claude Code 2.1.300 is older than 2.1.326, the oldest version Owlery's role sessions were checked on. Run "claude update" in a terminal.`;

  it("says the agent's notice where the window and the daemon have none", () => {
    expect(statusNotice("", "", AGENT)).toBe(AGENT);
  });

  it("says the window's own notice first, then the daemon's, then the agent's", () => {
    expect(statusNotice(OWN, DAEMON, AGENT)).toBe(OWN);
    expect(statusNotice(OWN, "", AGENT)).toBe(OWN);
    expect(statusNotice("", DAEMON, AGENT)).toBe(DAEMON);
    expect(statusNotice("", DAEMON, null)).toBe(DAEMON);
  });

  it("says nothing where none of the three has a notice, so the line shows the daemon's state", () => {
    expect(statusNotice("", "", null)).toBe("");
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

  it("puts a pinned work item first, before one that finished later, and keeps the pinned and the others each in the order of their finish", () => {
    const pinned = (id: number): WorkItem => ({ ...LOGIN, id, pinned: true });
    const plain = (id: number): WorkItem => ({ ...LOGIN, id });
    const sessions = [
      session(5, { workItemId: 1, state: "finished", stateSince: 100 }),
      session(6, { workItemId: 2, state: "finished", stateSince: 400 }),
      session(7, { workItemId: 3, state: "finished", stateSince: 300 }),
      session(8, { workItemId: 4, state: "finished", stateSince: 200 }),
      session(9, { workItemId: 5, state: "working", stateSince: 500 }),
    ];
    expect(historyLines(workItemEntries([pinned(1), plain(2), plain(3), pinned(4), pinned(5)], sessions, KINDS)).map((entry) => entry.workItem.id)).toEqual([4, 1, 2, 3]);
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
  const DOCS: WorkItem = { ...LOGIN, id: 3, title: "Write the guide", repoId: 2, repo: "/r/docs", repoName: "docs", branch: "owlery/write-the-guide" };
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

  it("leaves, where the decisions are chosen, the work items that hold a decision the person may still act on, one that stands as made or a reversal that waits for a stage, in the order given and whatever their lines' states, and not one whose decisions are all applied or carried", () => {
    const decision = (state: Decision["state"]): Decision => ({ id: 1, kind: "default", says: "Start from main.", grounds: "Q1 states main.", by: null, state, reversal: state === "decided" ? null : "main에서", landed: null, since: null });
    const entries = workItemEntries([{ ...FOURTH, decisions: [decision("reversed")] }, { ...DOCS, decisions: [decision("applied"), decision("carried")] }, { ...LOGIN, decisions: [decision("applied"), decision("decided")] }, SEARCH], sessions, KINDS);
    expect(matchWorkItems(entries, "", "decided").map((entry) => entry.workItem.id)).toEqual([4, 1]);
    expect(entries.map((entry) => entry.line.state)).toEqual([null, "finished", "waiting", "working"]);
    // What is typed narrows them as it narrows any other choice.
    expect(matchWorkItems(entries, "tidy", "decided").map((entry) => entry.workItem.id)).toEqual([4]);
    expect(matchWorkItems(entries, "", "all")).toHaveLength(4);
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
  it("offers every state at once, then each group's heading in the inbox's order, and last the work items with a decision to act on", () => {
    expect(filterChoices()).toEqual([
      { value: "all", label: "All" },
      { value: "waiting", label: "Needs you" },
      { value: "working", label: "Working" },
      { value: "finished", label: "Finished" },
      { value: "none", label: "Asleep" },
      { value: "decided", label: "Decided without asking" },
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
    expect(emptyList("archived", 0, 0)).toBe("No work item of this repository is archived.");
    expect(emptyList("archived", 2, 0)).toBe("No work item matches.");
    expect(emptyList("archived", 2, 1)).toBe("");
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
      hint: "Enter opens the first that needs you.",
    });
  });

  it("makes the inbox the main control and the only one where no changed work item waits, or none changed", () => {
    const alone = { main: { label: "Open the inbox", opens: "inbox" }, second: null, hint: "Enter opens it." };
    expect(summaryControls([change(4, "finished"), change(5, "working"), change(6, null)])).toEqual(alone);
    expect(summaryControls([])).toEqual(alone);
  });
});

describe("summaryHead", () => {
  const waits = [{ line: { title: "Fix the login bug", branch: "owlery/fix-the-login-bug", state: "waiting", commits: "" } satisfies InboxLine, decided: 0 }];

  it("is the summary's sentence where a work item changed", () => {
    expect(summaryHead(true, waits)).toBe("1 needs you");
  });

  it("says that nothing changed where a look is recorded and no work item changed", () => {
    expect(summaryHead(true, [])).toBe("Nothing changed since you were last here.");
  });

  it("says that no look is recorded where none is", () => {
    expect(summaryHead(false, [])).toBe("No earlier look is recorded.");
  });
});

describe("bellSays", () => {
  it("says how many work items need the person, in the state's own words as they agree with the count, and what a press does", () => {
    expect(bellSays(1)).toBe("1 needs you. Show them alone.");
    expect(bellSays(2)).toBe("2 need you. Show them alone.");
  });

  it("says what a press does where no work item needs the person", () => {
    expect(bellSays(0)).toBe("Show the work items that need you alone.");
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
    expect(daemonStatus(sessions, KINDS, false)).toBe("Daemon running, 2 agents");
    expect(daemonStatus([session(1)], KINDS, false)).toBe("Daemon running, 1 agent");
  });

  it("says that no agent runs where none does", () => {
    expect(daemonStatus([session(3, { kind: "shell" }), session(4, { alive: false })], KINDS, false)).toBe("Daemon running, no agent");
    expect(daemonStatus([], KINDS, false)).toBe("Daemon running, no agent");
  });

  it("says after the agents' count that the daemon keeps the Mac awake, where it does", () => {
    const sessions = [session(1), session(2, { state: "working" })];
    expect(daemonStatus(sessions, KINDS, true)).toBe("Daemon running, 2 agents, keeping the Mac awake");
    expect(daemonStatus(sessions, KINDS, false)).toBe("Daemon running, 2 agents");
    expect(daemonStatus([], KINDS, true)).toBe("Daemon running, no agent, keeping the Mac awake");
  });
});

describe("keepAwakeControl", () => {
  it("shows the daemon's choice, named in the words the control offers it in", () => {
    expect(keepAwakeControl({ choice: "working", held: false })).toEqual({ choice: "working", title: "Keep awake: While an agent works" });
    expect(keepAwakeControl({ choice: "always", held: true })).toEqual({ choice: "always", title: "Keep awake: Always" });
    expect(keepAwakeControl({ choice: "never", held: false })).toEqual({ choice: "never", title: "Keep awake: Never" });
  });

  it("shows nothing against a daemon that sent no `keepAwake`: one of an earlier build, or one that can hold nothing", () => {
    expect(keepAwakeControl(null)).toBeNull();
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
  const free = { mac: true, dialogOpen: false, menuOpen: false };

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

  it("reads W with the Command key as the key that closes the pane in front, under the conditions it reads K and N", () => {
    const w = { ...plain, code: "KeyW" };
    expect(commandKey({ ...w, meta: true }, free)).toBe("closePane");
    expect(commandKey({ ...w, ctrl: true }, { ...free, mac: false })).toBe("closePane");
    expect(commandKey({ ...w, ctrl: true }, free)).toBeNull();
    expect(commandKey(w, free)).toBeNull();
    expect(commandKey({ ...w, meta: true }, { ...free, dialogOpen: true })).toBeNull();
    // With the Shift key it is the menu's key, which closes the window.
    expect(commandKey({ ...w, meta: true, shift: true }, free)).toBeNull();
    expect(commandKey({ ...w, meta: true, alt: true }, free)).toBeNull();
  });

  it("reads no key while a dialog is open, while a menu is open, with no modifier key, or with another one held as well", () => {
    expect(commandKey({ ...plain, meta: true }, { ...free, dialogOpen: true })).toBeNull();
    expect(commandKey({ ...plain, meta: true }, { ...free, menuOpen: true })).toBeNull();
    expect(commandKey({ ...plain, code: "KeyN", meta: true }, { ...free, menuOpen: true })).toBeNull();
    expect(commandKey(plain, free)).toBeNull();
    expect(commandKey({ ...plain, meta: true, shift: true }, free)).toBeNull();
    expect(commandKey({ ...plain, meta: true, alt: true }, free)).toBeNull();
    expect(commandKey({ ...plain, meta: true, ctrl: true }, free)).toBeNull();
  });
});

describe("closeAsks", () => {
  it("asks before a pane whose session runs and is working closes", () => {
    expect(closeAsks(session(1, { state: "working" }))).toBe(true);
  });

  it.each([
    ["is waiting", session(1, { state: "waiting" })],
    ["has finished its turn", session(1, { state: "finished" })],
    ["has no state yet", session(1)],
    ["is of a kind that reports no state", session(1, { kind: "shell" })],
    ["was working when its process ended", session(1, { state: "working", alive: false })],
  ])("asks nothing where the session %s", (_name, closing) => {
    expect(closeAsks(closing)).toBe(false);
  });
});

describe("droppedText", () => {
  it("types a path of safe characters alone as it is, with one space after it", () => {
    expect(droppedText(["/Users/x/Shots_2026-11-20/a+b=c:d,e@f%g.PNG"])).toBe("/Users/x/Shots_2026-11-20/a+b=c:d,e@f%g.PNG ");
  });

  it.each([..." '\"\\()[]{}<>&;|$`!*?~#^"])("writes a backslash before %j", (character) => {
    expect(droppedText([`/t/a${character}b.png`])).toBe(`/t/a\\${character}b.png `);
  });

  it("writes a character outside ASCII as it is, a Korean syllable among them", () => {
    expect(droppedText(["/t/스크린샷 한 it's.png"])).toBe("/t/스크린샷\\ 한\\ it\\'s.png ");
    expect(droppedText(["/t/café—é.png"])).toBe("/t/café—é.png ");
  });

  it("joins two paths by one space, in the order given, with one space after the last", () => {
    expect(droppedText(["/t/a b.png", "/t/c.png"])).toBe("/t/a\\ b.png /t/c.png ");
  });

  it.each([
    ["a line feed", "/t/a\nb.png"],
    ["a carriage return", "/t/a\rb.png"],
    ["an escape", "/t/a\u001bb.png"],
    ["a tab", "/t/a\tb.png"],
    ["a null", "/t/a\u0000b.png"],
    ["a delete", "/t/a\u007fb.png"],
  ])("leaves out a path that holds %s", (_name, path) => {
    expect(droppedText([path, "/t/c.png"])).toBe("/t/c.png ");
    expect(droppedText([path])).toBe("");
  });

  it("leaves out a file that has no path, and types nothing where no path is left", () => {
    expect(droppedText(["", "/t/c.png", ""])).toBe("/t/c.png ");
    expect(droppedText([""])).toBe("");
    expect(droppedText([])).toBe("");
  });
});

describe("paneKey", () => {
  const enter = { key: "Enter", shift: false, ctrl: false, alt: false, meta: false, isComposing: false, keyCode: 13 };
  /** The three editing keys, each pressed with the Command key and no other modifier, and what each does. */
  const EDITING = [
    ["ArrowLeft", 37, "lineStart"],
    ["ArrowRight", 39, "lineEnd"],
    ["Backspace", 8, "deleteToLineStart"],
  ] as const;
  const command = (key: string, keyCode: number) => ({ ...enter, key, keyCode, meta: true });

  it("reads Enter with the Shift key as the key that sends a line feed, on a Mac keyboard and on another", () => {
    expect(paneKey({ ...enter, shift: true }, true)).toBe("lineFeed");
    expect(paneKey({ ...enter, shift: true }, false)).toBe("lineFeed");
  });

  it("leaves Shift+Enter to the terminal during a composition, told by the event and told by the key code of a key the input source took", () => {
    expect(paneKey({ ...enter, shift: true, isComposing: true }, true)).toBeNull();
    expect(paneKey({ ...enter, shift: true, keyCode: 229 }, true)).toBeNull();
  });

  it.each(["ctrl", "alt", "meta"] as const)("leaves Shift+Enter to the terminal where the %s key is held as well", (modifier) => {
    expect(paneKey({ ...enter, shift: true, [modifier]: true }, true)).toBeNull();
  });

  it("leaves Enter without the Shift key to the terminal, and every other key with it", () => {
    expect(paneKey(enter, true)).toBeNull();
    expect(paneKey({ ...enter, alt: true }, true)).toBeNull();
    expect(paneKey({ ...enter, key: "Tab", keyCode: 9, shift: true }, true)).toBeNull();
    expect(paneKey({ ...enter, key: "J", keyCode: 74, shift: true }, true)).toBeNull();
  });

  it.each(EDITING)("reads %s with the Command key on a Mac keyboard as an editing key of macOS", (key, keyCode, does) => {
    expect(paneKey(command(key, keyCode), true)).toBe(does);
  });

  it.each(EDITING)("leaves %s with the Command key to the terminal during a composition", (key, keyCode) => {
    expect(paneKey({ ...command(key, keyCode), isComposing: true }, true)).toBeNull();
    expect(paneKey({ ...command(key, 229) }, true)).toBeNull();
  });

  it.each(EDITING)("leaves %s to the terminal without the Command key, and with another modifier held as well", (key, keyCode) => {
    expect(paneKey({ ...command(key, keyCode), meta: false }, true)).toBeNull();
    for (const modifier of ["shift", "ctrl", "alt"] as const) expect(paneKey({ ...command(key, keyCode), [modifier]: true }, true)).toBeNull();
  });

  it.each(EDITING)("leaves %s to the terminal on a keyboard without the Command key, with the Control key and with a key the event names as the Command key", (key, keyCode) => {
    expect(paneKey(command(key, keyCode), false)).toBeNull();
    expect(paneKey({ ...command(key, keyCode), meta: false, ctrl: true }, false)).toBeNull();
  });

  it("leaves every other key with the Command key to the terminal", () => {
    for (const [key, keyCode] of [["ArrowUp", 38], ["ArrowDown", 40], ["Delete", 46], ["Enter", 13], ["a", 65]] as const) expect(paneKey(command(key, keyCode), true)).toBeNull();
  });
});

describe("paneMenu", () => {
  const texts = (mac: boolean, selection: boolean) => paneMenu(mac, selection).map((item) => (item === null ? "-" : item.text));

  it("holds the six items in their order, with a rule before the two that clear and before the one that closes", () => {
    expect(texts(true, false)).toEqual(["Copy", "Paste", "Select All", "-", "Clear Screen", "Reset Terminal", "-", "Close Pane"]);
    expect(texts(false, true)).toEqual(texts(true, false));
  });

  it("names each item's act", () => {
    expect(paneMenu(true, true).flatMap((item) => (item === null ? [] : [item.act]))).toEqual(["copy", "paste", "selectAll", "clear", "reset", "close"]);
  });

  it("shows the keys of Copy, Paste and Close Pane on a Mac keyboard, and no key on any other item", () => {
    expect(paneMenu(true, true).flatMap((item) => (item === null ? [] : [[item.text, item.keys]]))).toEqual([
      ["Copy", "\u2318C"],
      ["Paste", "\u2318V"],
      ["Select All", ""],
      ["Clear Screen", ""],
      ["Reset Terminal", ""],
      ["Close Pane", "\u2318W"],
    ]);
  });

  it("shows no key on a keyboard without the Command key", () => {
    expect(paneMenu(false, true).flatMap((item) => (item === null ? [] : [item.keys]))).toEqual(["", "", "", "", "", ""]);
  });

  it("disables Copy where the terminal holds no selection, and no other item", () => {
    const disabled = (selection: boolean) => paneMenu(true, selection).flatMap((item) => (item !== null && !item.enabled ? [item.text] : []));
    expect(disabled(false)).toEqual(["Copy"]);
    expect(disabled(true)).toEqual([]);
  });
});

describe("pathCandidates", () => {
  const texts = (line: string): string[] => pathCandidates(line).map(({ text }) => text);

  it.each([
    ["a path from the root", "/etc/hosts"],
    ["a path from the home folder", "~/notes/a.txt"],
    ["a path from the folder itself", "./a.ts"],
    ["a path from the folder above", "../b/a.ts"],
    ["a path with no mark before it", "src/a.ts"],
    ["a folder's path that ends in a slash", "src/main/"],
    ["a path that ends in the folder above", "src/main/.."],
    ["a path in Korean", "문서/메모.txt"],
  ])("takes %s as a candidate, whole", (_name, path) => {
    expect(pathCandidates(path)).toEqual([{ text: path, start: 0, end: path.length }]);
  });

  it("takes each run between spaces that holds a slash, with where it stands in the line's text", () => {
    expect(pathCandidates("edit src/a.ts  and /tmp/b now")).toEqual([
      { text: "src/a.ts", start: 5, end: 13 },
      { text: "/tmp/b", start: 19, end: 25 },
    ]);
    // A place is counted in the text's characters, whatever width a terminal draws each in.
    expect(pathCandidates("한글 src/a.ts")).toEqual([{ text: "src/a.ts", start: 3, end: 11 }]);
  });

  it("takes no run without a slash, and none that holds the mark of an address", () => {
    expect(texts("README.md docs test ~ .. 12:5")).toEqual([]);
    expect(texts("https://example.com/a/b file:///etc/hosts")).toEqual([]);
    expect(texts("")).toEqual([]);
  });

  it("takes no run of slashes, dots and tildes alone, such as the mark that opens a comment", () => {
    expect(texts("// a comment")).toEqual([]);
    expect(texts("a / b ./ ../ ~/ ../.. /.")).toEqual([]);
  });

  it("cuts the quotes, the brackets and the punctuation that stand around a path in a sentence", () => {
    expect(pathCandidates("see `src/a.ts`, 'src/b.ts' and (\"/tmp/c\").")).toEqual([
      { text: "src/a.ts", start: 5, end: 13 },
      { text: "src/b.ts", start: 17, end: 25 },
      { text: "/tmp/c", start: 33, end: 39 },
    ]);
    expect(texts("[src/a.ts] {src/b.ts} <src/c.ts> src/d.ts; src/e.ts! src/f.ts? src/g.ts: src/h.ts.")).toEqual(["src/a.ts", "src/b.ts", "src/c.ts", "src/d.ts", "src/e.ts", "src/f.ts", "src/g.ts", "src/h.ts"]);
  });

  it("cuts a line number, and a column after it, from a path's end", () => {
    expect(pathCandidates("at src/a.ts:12 and src/b.ts:12:5")).toEqual([
      { text: "src/a.ts", start: 3, end: 11 },
      { text: "src/b.ts", start: 19, end: 27 },
    ]);
    // As a search prints a match, and as a sentence closes on one.
    expect(texts("src/a.ts:12: const a = 1")).toEqual(["src/a.ts"]);
    expect(texts("(src/a.ts:12:5).")).toEqual(["src/a.ts"]);
    // A number that is part of the name stays.
    expect(texts("logs/2026-11-20 v1/a:b")).toEqual(["logs/2026-11-20", "v1/a:b"]);
  });
});

describe("webTarget and pathTarget", () => {
  it("reads an http or https address as a web address, as the URL's parser writes it", () => {
    expect(webTarget("https://example.com/a")).toEqual({ kind: "web", address: "https://example.com/a" });
    expect(webTarget("HTTP://Example.com/a b")).toEqual({ kind: "web", address: "http://example.com/a%20b" });
  });

  it.each(["file:///etc/hosts", "javascript:alert(1)", "vscode://file/etc/hosts", "example.com/a", ""])("gives %j no target", (address) => {
    expect(webTarget(address)).toBeNull();
  });

  it("reads the worktree of another work item the window lists as that work item's", () => {
    expect(pathTarget(SEARCH.worktree, [LOGIN, SEARCH], LOGIN.id)).toEqual({ kind: "workItem", path: SEARCH.worktree, workItemId: SEARCH.id });
    expect(pathTarget(SEARCH.worktree, [LOGIN, SEARCH], undefined)).toEqual({ kind: "workItem", path: SEARCH.worktree, workItemId: SEARCH.id });
  });

  it("reads the worktree of the view on screen, a folder inside a worktree and any other path as another path", () => {
    expect(pathTarget(LOGIN.worktree, [LOGIN, SEARCH], LOGIN.id)).toEqual({ kind: "path", path: LOGIN.worktree });
    expect(pathTarget(`${SEARCH.worktree}/src`, [LOGIN, SEARCH], LOGIN.id)).toEqual({ kind: "path", path: `${SEARCH.worktree}/src` });
    expect(pathTarget("/etc/hosts", [LOGIN, SEARCH], LOGIN.id)).toEqual({ kind: "path", path: "/etc/hosts" });
    expect(pathTarget(SEARCH.worktree, [LOGIN], LOGIN.id)).toEqual({ kind: "path", path: SEARCH.worktree });
  });
});

describe("linkClick and linkCard", () => {
  const WEB: LinkTarget = { kind: "web", address: "https://example.com/a" };
  const WORK_ITEM: LinkTarget = { kind: "workItem", path: SEARCH.worktree, workItemId: SEARCH.id };
  const PATH: LinkTarget = { kind: "path", path: "/etc/hosts" };
  const none = { meta: false, ctrl: false, shift: false };

  it.each([
    ["a Mac keyboard", true, { ...none, meta: true }, { ...none, ctrl: true }],
    ["a keyboard without the Command key", false, { ...none, ctrl: true }, { ...none, meta: true }],
  ])("answers a click on %s from the link's target and the keys held", (_name, mac, key, other) => {
    expect(linkClick("web", key, mac)).toBe("browser");
    expect(linkClick("web", { ...key, shift: true }, mac)).toBe("browser");
    expect(linkClick("workItem", key, mac)).toBe("workItem");
    expect(linkClick("workItem", { ...key, shift: true }, mac)).toBe("finder");
    expect(linkClick("path", key, mac)).toBe("finder");
    expect(linkClick("path", { ...key, shift: true }, mac)).toBe("finder");
    for (const kind of ["web", "workItem", "path"] as const) {
      // A click without the key stays the terminal's, which selects text with it. On a Mac the Control key with a click is the secondary click.
      expect(linkClick(kind, none, mac)).toBeNull();
      expect(linkClick(kind, { ...none, shift: true }, mac)).toBeNull();
      expect(linkClick(kind, other, mac)).toBeNull();
      expect(linkClick(kind, { ...other, shift: true }, mac)).toBeNull();
    }
  });

  it("gives a card the whole target, and a row for each thing a person can do, with the keys of a Mac keyboard", () => {
    expect(linkCard(WEB, true)).toEqual({
      title: "https://example.com/a",
      rows: [
        { text: "Open in browser", keys: "⌘ Click", act: "browser" },
        { text: "Copy link", keys: "", act: "copy" },
      ],
    });
    expect(linkCard(WORK_ITEM, true)).toEqual({
      title: SEARCH.worktree,
      rows: [
        { text: "Open work item", keys: "⌘ Click", act: "workItem" },
        { text: "Open in Finder", keys: "⇧ ⌘ Click", act: "finder" },
      ],
    });
    expect(linkCard(PATH, true)).toEqual({
      title: "/etc/hosts",
      rows: [
        { text: "Show in Finder", keys: "⌘ Click", act: "finder" },
        { text: "Copy path", keys: "", act: "copy" },
      ],
    });
  });

  it("names the Control key on a keyboard without the Command key", () => {
    expect(linkCard(WEB, false).rows.map(({ keys }) => keys)).toEqual(["Ctrl Click", ""]);
    expect(linkCard(WORK_ITEM, false).rows.map(({ keys }) => keys)).toEqual(["Ctrl Click", "Shift Ctrl Click"]);
    expect(linkCard(PATH, false).rows.map(({ keys }) => keys)).toEqual(["Ctrl Click", ""]);
  });

  it.each([true, false])("names on no row a key the click does not answer with that row's act (a Mac keyboard: %s)", (mac) => {
    // The click a row's keys name, read from the row's own words.
    const clickOf = (keys: string) => ({ meta: keys.includes("⌘"), ctrl: keys.includes("Ctrl"), shift: keys.includes("⇧") || keys.includes("Shift") });
    let named = 0;
    for (const target of [WEB, WORK_ITEM, PATH]) {
      for (const { keys, act } of linkCard(target, mac).rows) {
        if (keys === "") continue;
        expect(keys.endsWith(" Click")).toBe(true);
        expect(linkClick(target.kind, clickOf(keys), mac)).toBe(act);
        named += 1;
      }
    }
    expect(named).toBe(4);
  });
});

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const NOW = 1_000_000_000_000;

function commit(hash: string, subject: string, fields: Partial<CommitInfo> = {}): CommitInfo {
  return { hash, subject, at: NOW - 5 * MINUTE, added: 1, removed: 0, ...fields };
}

describe("cardStaysAt", () => {
  it.each(["Meta", "Shift", "Control", "Alt"])("keeps the card at a press of the %s key by itself", (key) => {
    expect(cardStaysAt(key)).toBe(true);
  });

  it.each(["a", "A", "Enter", "Escape", "ArrowLeft", "Backspace", " ", "CapsLock", "meta", "Process", ""])("takes the card away at the key %j, with or without a modifier key held", (key) => {
    expect(cardStaysAt(key)).toBe(false);
  });
});

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
    expect(stateWithAge("waiting", NOW - 12 * MINUTE, NOW)).toBe("Needs you, 12 min");
    expect(stateWithAge("finished", NOW - 3 * HOUR, NOW)).toBe("Finished, 3 h");
  });

  it("says the state alone where it has no time, and that no agent runs where there is no state", () => {
    expect(stateWithAge("working", null, NOW)).toBe("Working");
    expect(stateWithAge(null, null, NOW)).toBe("Asleep");
  });
});

/** A question an agent asks with two choices, and one that takes more than one choice. */
const DATES: AskedQuestion = { asks: "Which library formats the dates?", options: [{ label: "date-fns", implies: "Small functions, one import each." }, { label: "dayjs", implies: "" }], multiple: false };
const CHECKS: AskedQuestion = { asks: "Which checks run before a commit?", options: [{ label: "Lint", implies: "" }, { label: "Types", implies: "tsc --noEmit" }], multiple: true };

describe("stateSays", () => {
  it("gives a finished agent's last message under the label of its pane's kind and the word said", () => {
    expect(stateSays(session(3, { state: "finished", stateText: "The login form is fixed." }), KINDS)).toEqual({ head: "Claude Code said", text: "The login form is fixed.", waiting: false, questions: [] });
  });

  it("gives what a waiting agent tells the person under the word asks", () => {
    expect(stateSays(session(3, { state: "waiting", stateText: "May I run the tests?" }), KINDS)).toEqual({ head: "Claude Code asks", text: "May I run the tests?", waiting: true, questions: [] });
  });

  it("says which tool a waiting agent asks for where its event carried the tool's name and no text", () => {
    expect(stateSays(session(3, { state: "waiting", stateTool: "Bash" }), KINDS)).toEqual({ head: "Claude Code asks", text: "Asks to use Bash", waiting: true, questions: [] });
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
    expect(stateSays(session(3, { state: "finished", stateText: "Done." }), [{ kind: "claude", label: "The agent", reportsState: true, continues: true }])?.head).toBe("The agent said");
    expect(stateSays(session(3, { state: "finished", stateText: "Done." }), [])?.head).toBe("claude said");
  });

  it("gives nothing for a pane of a daemon of an earlier build, which sends neither field", () => {
    const { stateText: _text, stateTool: _tool, ...old } = session(3, { state: "waiting" });
    expect(stateSays(old as SessionInfo, KINDS)).toBeNull();
  });

  it("gives the questions a waiting agent asks, each with its choices and whether more than one may be chosen, and none where its event asked none", () => {
    expect(stateSays(session(3, { state: "waiting", stateText: DATES.asks, stateQuestions: [DATES, CHECKS] }), KINDS)).toEqual({ head: "Claude Code asks", text: DATES.asks, waiting: true, questions: [DATES, CHECKS] });
    expect(stateSays(session(3, { state: "waiting", stateText: "May I run the tests?", stateQuestions: null }), KINDS)?.questions).toEqual([]);
    // A daemon of an earlier build sends no such field.
    const { stateQuestions: _questions, ...old } = session(3, { state: "waiting", stateText: "May I run the tests?" });
    expect(stateSays(old as SessionInfo, KINDS)).toEqual({ head: "Claude Code asks", text: "May I run the tests?", waiting: true, questions: [] });
  });

  it("says under a question that takes more than one choice that more than one may be chosen, and nothing under one that takes one", () => {
    expect(choiceNote(CHECKS)).toBe("More than one may be chosen.");
    expect(choiceNote(DATES)).toBe("");
  });
});

describe("lineText", () => {
  const two = { ...LOGIN, newCommits: 2, commits: [commit("b2b2b2b", "Check the token"), commit("a1a1a1a", "Add the form")] };

  it("says the question a waiting agent asks and the labels of its choices, with how many more questions it asks", () => {
    const asking = (stateQuestions: AskedQuestion[]) => session(3, { state: "waiting", stateText: stateQuestions[0]?.asks ?? null, stateQuestions });
    expect(lineText(two, asking([DATES]), false)).toEqual({ says: "state", text: "Which library formats the dates? date-fns · dayjs" });
    expect(lineText(two, asking([DATES, CHECKS]), false)).toEqual({ says: "state", text: "Which library formats the dates? date-fns · dayjs (and 1 more question)" });
    expect(lineText(two, asking([CHECKS, DATES, DATES]), false)).toEqual({ says: "state", text: "Which checks run before a commit? Lint · Types (and 2 more questions)" });
    expect(lineText(two, asking([{ ...DATES, options: [] }]), false)).toEqual({ says: "state", text: "Which library formats the dates?" });
    // A daemon of an earlier build sends no such field, and the line says the state's text.
    const { stateQuestions: _questions, ...old } = asking([DATES]);
    expect(lineText(two, old as SessionInfo, false)).toEqual({ says: "state", text: "Which library formats the dates?" });
  });

  it("keeps a parked work item's question and a headless session's call before the question an agent asks, and the branch while a search is typed", () => {
    const asking = session(3, { state: "waiting", stateText: DATES.asks, stateQuestions: [DATES] });
    const parked: Question = { id: 1, asks: "Which base does the branch start from?", grounds: "No document names it.", by: "sealer", options: [], default: null, answer: null, since: null };
    expect(lineText({ ...two, questions: [parked] }, asking, false)).toEqual({ says: "question", text: "Which base does the branch start from?" });
    expect(lineText({ ...two, permissions: [{ id: 7, headlessId: 3, tool: "Bash", action: "run", text: "pnpm test", at: 1 }] }, asking, false)).toEqual({ says: "permission", text: "Asks to use Bash: pnpm test" });
    expect(lineText(two, asking, true)).toEqual({ says: "branch", text: "owlery/fix-the-login-bug" });
  });

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

  it("says how many commits the branch is behind its base beside how many ahead, 0 among them", () => {
    expect(ahead({ ...LOGIN, baseBranch: "main", aheadOfBase: 6, behindBase: 2, newCommits: 6 })).toEqual({ sentence: "6 commits ahead of main, 2 behind", fact: "main · 6 ahead · 2 behind" });
    expect(ahead({ ...LOGIN, baseBranch: "main", aheadOfBase: 1, behindBase: 1, newCommits: 1 })).toEqual({ sentence: "1 commit ahead of main, 1 behind", fact: "main · 1 ahead · 1 behind" });
    expect(ahead({ ...LOGIN, baseBranch: "main", aheadOfBase: 6, behindBase: 0, newCommits: 6 })).toEqual({ sentence: "6 commits ahead of main, 0 behind", fact: "main · 6 ahead · 0 behind" });
    expect(ahead({ ...LOGIN, baseBranch: "origin/main", aheadOfBase: 0, behindBase: 3, newCommits: 0 })).toEqual({ sentence: "0 commits ahead of origin/main, 3 behind", fact: "origin/main · 0 ahead · 3 behind" });
  });

  it("says nothing of behind where the daemon sent no count of it, a daemon of an earlier build among them, or where no base branch is recorded", () => {
    expect(ahead({ ...LOGIN, baseBranch: "main", aheadOfBase: 6, behindBase: null, newCommits: 6 })).toEqual({ sentence: "6 commits ahead of main", fact: "main · 6 ahead" });
    const { behindBase: _none, ...earlier } = { ...LOGIN, baseBranch: "main", aheadOfBase: 6, newCommits: 6 };
    expect(ahead(earlier as WorkItem)).toEqual({ sentence: "6 commits ahead of main", fact: "main · 6 ahead" });
    expect(ahead({ ...LOGIN, baseBranch: null, behindBase: 2, newCommits: 3 })).toEqual({ sentence: "3 commits ahead", fact: "3 ahead" });
  });

  it("prints a base that is a remote's branch as it is stored, with the remote's name", () => {
    expect(ahead({ ...LOGIN, baseBranch: "origin/main", aheadOfBase: 1, newCommits: 1 })).toEqual({ sentence: "1 commit ahead of origin/main", fact: "origin/main · 1 ahead" });
    expect(ahead({ ...LOGIN, baseBranch: "origin/main", aheadOfBase: 6, newCommits: 6 })).toEqual({ sentence: "6 commits ahead of origin/main", fact: "origin/main · 6 ahead" });
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
  it("says the keys of a list under its preview: the two that move through it, the one that opens the selected line's menu, and the one that opens the form", () => {
    expect(keyHints("inbox", true)).toEqual(["J K move through the inbox", "M opens the menu", "\u2318N opens a new work item"]);
    expect(keyHints("history", true)[0]).toBe("J K move through the history");
    expect(keyHints("archived", true)).toEqual(["J K move through the archived work items", "M opens the menu", "\u2318N opens a new work item"]);
  });

  it("names the Control key where the keyboard has no Command key", () => {
    expect(keyHints("inbox", false)[2]).toBe("Ctrl N opens a new work item");
  });
});

describe("the dialog of the records place", () => {
  const OUT_OF_SCOPE = "Owlery commits work records to this repository. A repository that cannot keep work records in its tree is out of scope for Owlery.";
  const PLAN: RecordsPlan = {
    branch: "main",
    subject: "chore: add the place for work records and the pull request check",
    files: [
      { path: "seal/README.md", text: "# What AgenticSeal maintains in seal/\n" },
      { path: "seal/config.json", text: '{\n  "Broad gate": "pnpm test"\n}\n' },
      { path: ".github/workflows/owlery-seal.yml", text: "name: seal\n" },
    ],
    blocked: null,
    proposedBroadGate: null,
    stamp: "s",
  };
  const kept = (plan: RecordsPlan, ...paths: string[]): RecordsPlan => ({ ...plan, files: plan.files.map((file) => (paths.includes(file.path) ? { path: file.path, text: null } : file)) });

  it("says what is out of scope before anything is written, and shows the plan: the branch and the subject of the one commit, each file's path over its text, the field of the broad gate command with where it is kept, and the two buttons", () => {
    const words = recordsDialog(PROJECT, PLAN, "pnpm test", "pnpm test");
    expect(words.head).toBe("Records and check: project");
    expect(words.scope).toBe(OUT_OF_SCOPE);
    expect(words.commit).toBe("This makes one commit on `main`: `chore: add the place for work records and the pull request check`. Nothing is pushed.");
    expect(words.blocked).toBe("");
    expect(words.files).toEqual(PLAN.files.map((file) => ({ path: file.path, text: file.text, says: "" })));
    expect(words.holds).toEqual([]);
    expect(words.gate).toEqual({ shown: true, enabled: true, label: "Broad gate command", value: "pnpm test", says: "Kept in `seal/config.json`, under `Broad gate`." });
    expect(words.submit).toEqual({ shown: true, enabled: true, label: "Set up and commit" });
    expect(words.cancel).toBe("Not now");
  });

  it("says the scope and offers no commit until the daemon has answered, while the plan is of another command than the field holds, and while the command of a new config.json is empty", () => {
    const waiting = recordsDialog(PROJECT, null, "", null);
    expect([waiting.scope, waiting.commit, waiting.files, waiting.submit]).toEqual([OUT_OF_SCOPE, "", [], { shown: true, enabled: false, label: "Set up and commit" }]);
    expect(recordsDialog(PROJECT, PLAN, "pnpm tes", "pnpm test").submit.enabled).toBe(false);
    expect(recordsDialog(PROJECT, PLAN, "  ", "  ").submit.enabled).toBe(false);
    // A setup that writes no config.json needs no command.
    expect(recordsDialog({ ...PROJECT, records: { root: "seal", check: null, broadGate: null } }, kept(PLAN, "seal/README.md", "seal/config.json"), "", "").submit.enabled).toBe(true);
  });

  it("says of a file that stands that it is kept, and turns the field off where config.json stands: it shows the key's value, or says that the file holds no such key", () => {
    const plan = kept(PLAN, "seal/README.md", "seal/config.json");
    const valued = recordsDialog({ ...PROJECT, records: { root: "seal", check: null, broadGate: "make check" } }, plan, "", "");
    expect(valued.files).toEqual([
      { path: "seal/README.md", text: null, says: "`seal/README.md` stands and is kept." },
      { path: "seal/config.json", text: null, says: "`seal/config.json` stands and is kept." },
      { path: ".github/workflows/owlery-seal.yml", text: "name: seal\n", says: "" },
    ]);
    expect(valued.gate).toEqual({ shown: true, enabled: false, label: "Broad gate command", value: "make check", says: "Kept in `seal/config.json`, under `Broad gate`." });
    expect(valued.submit.enabled).toBe(true);
    const keyless = recordsDialog({ ...PROJECT, records: { root: "seal", check: null, broadGate: null } }, plan, "", "");
    expect(keyless.gate).toEqual({ shown: true, enabled: false, label: "Broad gate command", value: "", says: "No `Broad gate` key in `seal/config.json`." });
  });

  it("shows, for a repository that holds every part, the root, the workflow and the command with the file that holds it, and offers no commit", () => {
    const plan = { ...kept(PLAN, "agentic-seal/README.md", "agentic-seal/config.json", ".github/workflows/hygiene.yml"), files: [{ path: "agentic-seal/README.md", text: null }, { path: "agentic-seal/config.json", text: null }, { path: ".github/workflows/hygiene.yml", text: null }] };
    const whole = recordsDialog({ ...PROJECT, records: { root: "agentic-seal", check: ".github/workflows/hygiene.yml", broadGate: "make check" } }, plan, "", "");
    expect(whole.scope).toBe(OUT_OF_SCOPE);
    expect(whole.holds).toEqual(["Records: `agentic-seal/`", "Check: `.github/workflows/hygiene.yml`", "Broad gate: `make check`, kept in `agentic-seal/config.json` under `Broad gate`"]);
    expect([whole.commit, whole.files, whole.gate.shown, whole.submit.shown, whole.cancel]).toEqual(["", [], false, false, "Close"]);
    const keyless = recordsDialog({ ...PROJECT, records: { root: "agentic-seal", check: ".github/workflows/hygiene.yml", broadGate: null } }, plan, "", "");
    expect(keyless.holds[2]).toBe("No `Broad gate` key in `agentic-seal/config.json`.");
    expect(keyless.submit.shown).toBe(false);
  });

  it("shows why a plan is blocked, or the daemon's refusal of the plan, names no commit and turns the button off", () => {
    const blocked = recordsDialog(PROJECT, { ...PLAN, branch: null, blocked: "No branch is checked out in this repository." }, "pnpm test", "pnpm test");
    expect([blocked.blocked, blocked.commit, blocked.submit]).toEqual(["No branch is checked out in this repository.", "", { shown: true, enabled: false, label: "Set up and commit" }]);
    // The files are still shown, so the person reads what the setup would have written.
    expect(blocked.files.map((file) => file.path)).toEqual(PLAN.files.map((file) => file.path));
    const refused = recordsDialog(PROJECT, { error: "no repository 1" }, "pnpm test", "pnpm test");
    expect([refused.blocked, refused.files, refused.submit.enabled]).toEqual(["no repository 1", [], false]);
  });

  it("says where the command in the field is the one the daemon read from the repository, and stops saying so once the person changed it", () => {
    const plan = { ...PLAN, proposedBroadGate: "pnpm run check" };
    expect(recordsDialog(PROJECT, plan, "pnpm run check", "pnpm run check").gate.says).toBe("Kept in `seal/config.json`, under `Broad gate`. Owlery read this command from the repository's `package.json`: change it where the repository's whole check is another.");
    expect(recordsDialog(PROJECT, plan, "pnpm run check && pnpm lint", "pnpm run check && pnpm lint").gate.says).toBe("Kept in `seal/config.json`, under `Broad gate`.");
  });
});

describe("lacksRecords", () => {
  it("is true of a repository with no root or no workflow, false of one that holds both, and false of a repository of a daemon that sends no records, for which no setup is offered", () => {
    const holding = (root: string | null, check: string | null): Repository => ({ ...PROJECT, records: { root, check, broadGate: null } });
    expect([lacksRecords(holding(null, null)), lacksRecords(holding("seal", null)), lacksRecords(holding(null, ".github/workflows/hygiene.yml")), lacksRecords(holding("seal", ".github/workflows/owlery-seal.yml"))]).toEqual([true, true, true, false]);
    const { records: _, ...earlier } = PROJECT;
    expect([recordsOf(earlier as Repository), lacksRecords(earlier as Repository)]).toEqual([null, false]);
    expect(recordsOf(PROJECT)).toEqual({ root: null, check: null, broadGate: null });
  });
});

describe("registered", () => {
  const docs: Repository = { ...PROJECT, id: 2, folder: "/r/docs", name: "docs" };

  it("gives the repository a registration added: the one the lists hold now and did not hold before", () => {
    expect(registered("/somewhere/else", [PROJECT], [PROJECT, docs])).toBe(docs);
  });

  it("gives, where the lists gained none, the repository whose folder is the one typed, and none for a folder inside one: the daemon may read another repository there", () => {
    expect(registered("/r/project", [PROJECT, docs], [PROJECT, docs])).toBe(PROJECT);
    expect(registered("/r/docs/", [PROJECT, docs], [PROJECT, docs])).toBe(docs);
    expect(registered("/r/docs/vendor/inner", [PROJECT, docs], [PROJECT, docs])).toBeUndefined();
    expect(registered("/r/docs-old", [PROJECT, docs], [PROJECT, docs])).toBeUndefined();
  });
});
