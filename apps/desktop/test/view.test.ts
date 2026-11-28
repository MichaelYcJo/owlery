// layer: logic
import { describe, expect, it } from "vitest";
import {
  accountChoices,
  accountName,
  accountRemoval,
  accountRows,
  REFRESH_SAYS,
  heldAccounts,
  lineAccount,
  offersAccounts,
  viewAccount,
  agentKind,
  ageOf,
  ahead,
  archivalOf,
  archivedHead,
  archivedIn,
  answersFor,
  approvalPlaces,
  askedSection,
  asksFetch,
  backKey,
  backShown,
  branchPlace,
  BASE_ANSWER_MS,
  baseKey,
  baseMenu,
  branchMenu,
  baseSays,
  bellSays,
  cardStaysAt,
  chainNotifications,
  chainList,
  checkButton,
  earlierButton,
  chainSays,
  stageAhead,
  machineQueue,
  queuedAhead,
  machineAhead,
  heavyQueue,
  heavyRanRows,
  changedSet,
  changedSetAfter,
  changesOf,
  changesSince,
  choiceNote,
  closeAsks,
  closeSays,
  codeParts,
  commandKey,
  commitLines,
  daemonEnding,
  daemonLists,
  daemonNotice,
  ANSWER_WAIT_MS,
  answerWaits,
  NOT_ANSWERED_SAYS,
  refusalSays,
  UNKNOWN_REQUEST_SAYS,
  deleteChoice,
  deleteSays,
  deletionOf,
  daemonStatus,
  decisionLines,
  decisionMark,
  DECISIONS_HEAD,
  droppedText,
  emptyList,
  emptySidebar,
  fileLines,
  fileOpener,
  type FileOpener,
  filterChoices,
  filterMark,
  FIND_LIMIT,
  findCount,
  findQuery,
  gainedSince,
  GATE_HEAD,
  GATE_OUTPUT_SHOWS,
  gateLine,
  hasBack,
  headlessKey,
  headlessLines,
  hiddenRepositories,
  historyLines,
  inboxGroups,
  inboxKey,
  inboxLine,
  inboxSummary,
  capChanges,
  type CapRow,
  keepAwakeControl,
  keyHints,
  machineDialog,
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
  opensToBack,
  placeWords,
  pullRequestFacts,
  pullRequestNotifications,
  paneChoices,
  paneInFront,
  paneKey,
  paneMenu,
  paneAccountChange,
  newPaneMenu,
  paneButtonTitle,
  paneTabs,
  parkNotifications,
  pinnedFirst,
  pathCandidates,
  pathTarget,
  pasteAct,
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
  registered,
  repositoryMenu,
  rowButtons,
  RUN_SETUP_SAYS,
  runningSessions,
  sameValues,
  screenMoves,
  screenTurns,
  lapseNotifications,
  inspectionShown,
  inspectionSinceLook,
  selectedLine,
  sessionSections,
  settingsBases,
  settingsFields,
  setupMark,
  setupSection,
  shownSetup,
  sidebarTree,
  paneCap,
  paneScrollback,
  sideBySideTitle,
  stageGrid,
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
  tabAccount,
  tabLabel,
  tabMenu,
  tabSays,
  tellsSize,
  viewFacts,
  webTarget,
  withHeadless,
  withoutHeadless,
  workItemEntries,
  workItemFields,
  workItemMenu,
  type FormPlan,
  type HeldAccounts,
  type InboxLine,
  type MenuEntry,
  type MenuRowItem,
  type InspectionSince,
  unanswered,
  unreadLines,
  wordOwedMark,
  wordOwedSays,
} from "../src/renderer/view";
import { type Account, type AskedQuestion, BASE_FETCH_MS, type BaseFetch, type Cap, type Chain, type ChainStage, type CommitInfo, type Decision, type GateRun, type HeadlessInfo, type LedgerEntry, type Look, type Machine, type PaneKindInfo, type PaneStage, type PlanDisk, type PullRequest, type Question, type Recorded, type RecordsPlan, type Repository, type Inspection, type BackRecords, type SessionInfo, type TabColour, type WorkItem, type WorkItemLoss, type WorktreeSetup } from "../src/shared/protocol";
import { composeBack } from "../src/shared/inspection-sheet";

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
  decisions: [],
  questions: [],
  unread: [],
  setup: null,
  chain: null,
  pullRequest: null,
};
/** A setup whose command runs in pane 3, begun at 1000, which copied two paths. */
const RUNNING_SETUP: WorktreeSetup = { copied: [".env", "node_modules/"], copiedCount: 2, failedCopies: [], command: "pnpm install\n", paneId: 3, state: "running", exitCode: null, failure: null, startedAt: 1000, endedAt: null };
const PROJECT: Repository = { id: 1, folder: "/r/project", name: "project", customName: null, icon: null, defaultBase: null, hidden: false, groups: [], records: { root: null, check: null, broadGate: null }, chain: { owl: false } };
const SEARCH: WorkItem = { ...LOGIN, id: 2, title: "Speed up search", branch: "owlery/speed-up-search", worktree: "/w/project/speed-up-search" };

// What the daemon offers today, as `ready` carries it.
const KINDS: PaneKindInfo[] = [
  { kind: "shell", label: "Shell", reportsState: false, continues: false },
  { kind: "claude", label: "Claude Code", reportsState: true, continues: true },
];

function session(id: number, fields: Partial<SessionInfo> = {}): SessionInfo {
  return { id, kind: "claude", alive: true, workItemId: 1, state: null, stateSince: null, stateText: null, stateTool: null, stateQuestions: null, ...fields };
}

/** A proofer's session of the work item 1 that works, but for the fields given. */
function headless(id: number, fields: Partial<HeadlessInfo> = {}): HeadlessInfo {
  return { id, workItemId: 1, prompt: "Which file holds the login form?", state: "working", answer: "", error: null, usage: null, startedAt: 1234, errorOutput: "", stopped: null, role: { role: "proofer", stage: "round" }, ...fields };
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

  it("labels a pane with the name a person gave its tab, before Setup and before its kind, and numbers the other panes of its kind as though it had none", () => {
    const tabs = [session(3, { kind: "shell", name: null }), session(4, { kind: "shell", name: "build" }), session(5, { kind: "shell" })];
    expect(tabs.map((tab) => tabLabel(tab, tabs, KINDS))).toEqual(["Shell 1", "build", "Shell 3"]);
    const setup = [session(3, { kind: "shell", name: "deps" }), session(5, { kind: "shell" })];
    expect(setup.map((tab) => tabLabel(tab, setup, KINDS, 3))).toEqual(["deps", "Shell"]);
  });
});

describe("tabSays", () => {
  it("names a tab with its colour's word after its label, as its tooltip and a screen reader say it, and by its label alone where it has no colour", () => {
    expect(tabSays("Shell 2", "blue")).toBe("Shell 2, Blue");
    expect(tabSays("build", "green")).toBe("build, Green");
    expect(tabSays("Claude Code", "pink")).toBe("Claude Code, Pink");
    expect(tabSays("Shell 2", null)).toBe("Shell 2");
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

  it("draws the place of the branch with the branch's name, and with No branch yet, not as a name, for a work item with none", () => {
    expect([branchPlace(inboxLine(LOGIN, [], KINDS).branch), branchPlace(inboxLine({ ...LOGIN, branch: null, ownsBranch: false }, [], KINDS).branch)]).toEqual([
      { text: "owlery/fix-the-login-bug", none: false },
      { text: "No branch yet", none: true },
    ]);
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
/** A menu's entries without their descriptions, which a case of their own holds: an entry that opens a submenu with its items, and a row with its items, read the same way. */
const plain = (entries: readonly (MenuEntry | MenuRowItem)[]): { label: string; [field: string]: unknown }[] =>
  entries.map(({ description: _says, ...entry }) => ("opens" in entry ? { ...entry, opens: plain(entry.opens) } : "row" in entry ? { ...entry, row: plain(entry.row) } : entry));
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

  it("holds Account… after Rename where the window offers a choice of account, which opens the dialog of the work item's account, and none where it offers none or the work item is archived", () => {
    expect(plain(workItemMenu(LOGIN, [], [], true)).slice(0, 2)).toEqual([
      { label: "Rename", action: { do: "rename", id: 1 }, divides: false },
      { label: "Account…", action: { do: "account", id: 1 }, divides: false },
    ]);
    expect(workItemMenu(LOGIN, [], [], false).map((item) => item.label)).not.toContain("Account…");
    expect(workItemMenu({ ...LOGIN, archivedAt: 50 }, [], [], true).map((item) => item.label)).not.toContain("Account…");
  });

  it("holds no Copy branch name for a work item with no branch yet, and says that Delete removes the worktree alone where Owlery did not make the branch, which a daemon of an earlier build made for every work item", () => {
    const deletes = (workItem: WorkItem) => workItemMenu(workItem, [], []).find((entry) => entry.label === "Delete")?.description;
    const none: WorkItem = { ...LOGIN, branch: null, ownsBranch: false };
    expect(workItemMenu(none, [], []).map((item) => item.label)).toEqual(["Rename", "Open in", "Copy path", "Pin", "Mute notifications", "Archive", "Delete"]);
    expect(workItemMenu({ ...none, archivedAt: 50 }, [], []).map((item) => item.label)).toEqual(["Restore", "Open in", "Copy path", "Delete"]);
    const worktreeAlone = "Remove the work item's worktree from disk, after a dialog names what would be lost. Nothing on a remote is removed.";
    const withBranch = "Remove the work item's worktree and its local branch from disk, after a dialog names what would be lost. Nothing on a remote is removed.";
    const { ownsBranch: _owns, ...old } = LOGIN;
    expect([deletes(none), deletes({ ...LOGIN, ownsBranch: false }), deletes({ ...LOGIN, ownsBranch: true }), deletes(old)]).toEqual([worktreeAlone, worktreeAlone, withBranch, withBranch]);
  });

  it("says that Rename makes the branch of a work item with no branch yet, keeps the name of a branch Owlery did not make, and renames a branch Owlery made where it was never pushed, which a daemon of an earlier build made for every work item", () => {
    const renames = (workItem: WorkItem) => workItemMenu(workItem, [], []).find((entry) => entry.label === "Rename")?.description;
    const { ownsBranch: _owns, ...old } = LOGIN;
    const owned = "Give the work item another name, and its branch too where the branch was never pushed.";
    expect([renames({ ...LOGIN, branch: null, ownsBranch: false }), renames({ ...LOGIN, ownsBranch: false }), renames({ ...LOGIN, ownsBranch: true }), renames(old)]).toEqual([
      "Give the work item another name, and make its branch from that name.",
      "Give the work item another name. Its branch keeps its name, since Owlery did not make it.",
      owned,
      owned,
    ]);
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

/** Three Shell panes of the work item 1, in the tabs' order. */
const SHELL_TABS = [session(4, { kind: "shell" }), session(5, { kind: "shell" }), session(6, { kind: "shell" })];
/** The same panes as a daemon that keeps a pane's name and colour sends them, none named and none coloured. */
const MARKED_TABS = SHELL_TABS.map((tab) => ({ ...tab, name: null, colour: null }));

describe("tabMenu", () => {
  it('holds "Rename…" and the row of colours before the close items, with a rule above "Close Pane", where the daemon keeps a pane\'s name and colour, and the row checks the tab\'s colour, or No colour where it has none', () => {
    const row = (checked: TabColour | null) => [
      { label: "Green", action: { do: "colourPane", id: 5, colour: "green" }, colour: "green", checked: checked === "green" },
      { label: "Blue", action: { do: "colourPane", id: 5, colour: "blue" }, colour: "blue", checked: checked === "blue" },
      { label: "Pink", action: { do: "colourPane", id: 5, colour: "pink" }, colour: "pink", checked: checked === "pink" },
      { label: "No colour", action: { do: "colourPane", id: 5, colour: null }, colour: null, checked: checked === null },
    ];
    expect(plain(tabMenu(MARKED_TABS[1]!, MARKED_TABS))).toEqual([
      { label: "Rename…", action: { do: "renamePane", id: 5 }, divides: false },
      { label: "Colour", row: row(null), divides: false },
      { label: "Close Pane", action: { do: "closePanes", ids: [5] }, divides: true },
      { label: "Close Other Panes", action: { do: "closePanes", ids: [4, 6] }, divides: false },
      { label: "Close Panes to the Right", action: { do: "closePanes", ids: [6] }, divides: false },
    ]);
    const blue = { ...MARKED_TABS[1]!, name: "build", colour: "blue" as const };
    expect(plain(tabMenu(blue, [MARKED_TABS[0]!, blue, MARKED_TABS[2]!]))[1]).toEqual({ label: "Colour", row: row("blue"), divides: false });
  });

  it('holds no "Rename…" and no row of colours, and no rule, for a session with no name field, which a daemon of an earlier build sends', () => {
    expect(plain(tabMenu(SHELL_TABS[1]!, SHELL_TABS)).map(({ label, divides }) => [label, divides])).toEqual([
      ["Close Pane", false],
      ["Close Other Panes", false],
      ["Close Panes to the Right", false],
    ]);
    // A field that is there and null is a daemon that keeps the marks, and a field that is absent is not.
    expect(tabMenu({ ...SHELL_TABS[1]!, name: null }, SHELL_TABS).map(({ label }) => label)).toEqual(["Rename…", "Colour", "Close Pane", "Close Other Panes", "Close Panes to the Right"]);
  });

  it('holds, on a tab with tabs on both sides, "Close Pane", "Close Other Panes" and "Close Panes to the Right", each closing its panes in the tabs\' order', () => {
    expect(plain(tabMenu(SHELL_TABS[1]!, SHELL_TABS))).toEqual([
      { label: "Close Pane", action: { do: "closePanes", ids: [5] }, divides: false },
      { label: "Close Other Panes", action: { do: "closePanes", ids: [4, 6] }, divides: false },
      { label: "Close Panes to the Right", action: { do: "closePanes", ids: [6] }, divides: false },
    ]);
    expect(plain(tabMenu(SHELL_TABS[0]!, SHELL_TABS)).map(({ action }) => action)).toEqual([
      { do: "closePanes", ids: [4] },
      { do: "closePanes", ids: [5, 6] },
      { do: "closePanes", ids: [5, 6] },
    ]);
  });

  it('leaves out "Close Panes to the Right" on the last tab, where no tab stands after it', () => {
    expect(plain(tabMenu(SHELL_TABS[2]!, SHELL_TABS))).toEqual([
      { label: "Close Pane", action: { do: "closePanes", ids: [6] }, divides: false },
      { label: "Close Other Panes", action: { do: "closePanes", ids: [4, 5] }, divides: false },
    ]);
  });

  it('holds "Close Pane" alone on the one tab of a work item, and counts an exited pane among the others', () => {
    expect(plain(tabMenu(SHELL_TABS[0]!, [SHELL_TABS[0]!]))).toEqual([{ label: "Close Pane", action: { do: "closePanes", ids: [4] }, divides: false }]);
    const exited = session(7, { kind: "shell", alive: false });
    expect(tabMenu(exited, [SHELL_TABS[0]!, exited]).map(({ label }) => label)).toEqual(["Close Pane", "Close Other Panes"]);
    expect(plain(tabMenu(SHELL_TABS[0]!, [SHELL_TABS[0]!, exited]))[1]).toEqual({ label: "Close Other Panes", action: { do: "closePanes", ids: [7] }, divides: false });
  });
});

describe("a description on hover", () => {
  it("gives every entry of a work item's menu, of a repository's menu and of a pane's tab's menu, and every item of a submenu and of a row, a description that is not empty and is not its label, and no two entries of one menu or of one submenu the same one", () => {
    const menus = [workItemMenu(LOGIN, APPS, []), workItemMenu({ ...LOGIN, pinned: true, muted: true }, APPS, []), repositoryMenu(PROJECT, APPS), workItemMenu({ ...LOGIN, archivedAt: 50 }, APPS, []), workItemMenu({ ...LOGIN, groupId: 7 }, APPS, GROUPS), workItemMenu(LOGIN, APPS, GROUPS), tabMenu(SHELL_TABS[1]!, SHELL_TABS), tabMenu(MARKED_TABS[1]!, MARKED_TABS)];
    // Each submenu, and each row, is read as a menu of its own, after the menus.
    const submenus = menus.flatMap((menu) => menu.flatMap((entry): (readonly { label: string; description: string }[])[] => ("opens" in entry ? [entry.opens] : "row" in entry ? [entry.row] : [])));
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
    expect(menus.map((menu) => menu.length)).toEqual([8, 8, 9, 5, 10, 10, 3, 5]);
    expect(submenus.map((submenu) => submenu.length)).toEqual([3, 3, 3, 3, 3, 3, 4]);
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
    expect(NEW_WORK_ITEM_SAYS).toBe("Create a work item: a new worktree in a repository, on a branch picked in the form or made later. The form can also register a repository alone.");
    expect(REGISTER_ONLY_SAYS).toBe("Add the repository to the sidebar without creating a work item, a branch or a worktree.");
    expect(rowButtons("the project")).toEqual({
      add: { name: "New work item in the project", says: "Create a work item in the project: a new worktree." },
      menu: { name: "Menu of the project", says: "Open the menu of the project: its settings, its icon, hiding it and removing it." },
    });
  });

  it("names the button of a repository's older check by the word Check and the version, and says to a pointer and to a screen reader whose check it is, that it is older than this app, and that a press opens the commit that moves it", () => {
    expect(checkButton("the project", "0.0.4")).toEqual({ label: "Check 0.0.4", says: "The pull request check of the project is Owlery 0.0.4's, older than this app. Open to read the commit that moves it." });
  });

  it("names the button of a repository whose records stand in the earlier form, and says to a pointer and to a screen reader where they stand, that Owlery reads none of them, and that a press opens the commit that moves them", () => {
    expect(earlierButton("the project", "seal")).toEqual({
      label: "Records in the earlier form",
      says: "The work records of the project stand in `seal/`, in the earlier form of the records, which Owlery reads no record of and runs no chain on. Open to read the commit that moves them to IADD's forms.",
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
      sessions: { running: [], queued: [] },
      running: { panes: [], headless: [] },
    });
    expect(removalOf(PROJECT, [DOCS], [], [], [], KINDS)).toEqual({ workItems: [], sessions: { running: [], queued: [] }, running: { panes: [], headless: [] } });
  });

  it("names each running session of those work items, a pane by its tab's label and a headless session by its stage, never by its prompt, and gives their ids: no pane that exited, no headless session that ended, and none of another repository's work item", () => {
    const sessions = [session(5, { kind: "shell" }), session(6, { kind: "shell", alive: false }), session(7, { kind: "shell" }), session(8, { workItemId: 3 }), session(9, { workItemId: 4 }), session(10, { workItemId: null })];
    const stages = [headless(1), headless(2, { state: "finished" }), headless(3, { state: "failed" }), headless(4, { workItemId: 3 }), headless(5, { workItemId: 2, prompt: "Where is the index built?", role: { role: "inspector", stage: "inspection" } })];
    expect(removalOf(PROJECT, [LOGIN, DOCS, SEARCH], [SHELVED], sessions, stages, KINDS)).toMatchObject({
      sessions: { running: ["Shell 1 in Fix the login bug", "Shell 3 in Fix the login bug", "Claude Code in Shelved", "Proofer, round in Fix the login bug", "Inspector, verdict in Speed up search"], queued: [] },
      running: { panes: [5, 7, 9], headless: [1, 5] },
    });
  });

  it("names a headless session that waits for the machine apart from the running ones, by its stage and its work item, and gives its id among those the removal sends (scenario 9)", () => {
    const stages = [headless(1, { state: "queued" }), headless(2, { prompt: "Where is the index built?", role: { role: "inspector", stage: "inspection" } }), headless(3, { workItemId: 2, state: "queued", prompt: "Who asked?", role: { role: "crafter", stage: "fix-pass" } })];
    expect(removalOf(PROJECT, [LOGIN, SEARCH], [], [session(5, { kind: "shell" })], stages, KINDS)).toMatchObject({
      sessions: { running: ["Shell in Fix the login bug", "Inspector, verdict in Fix the login bug"], queued: ["Proofer, round in Fix the login bug", "Crafter, fix pass in Speed up search"] },
      running: { panes: [5], headless: [2, 1, 3] },
    });
  });
});

describe("what a delete dialog says of a loss", () => {
  const NOTHING: WorkItemLoss = { branch: null, worktree: null, commits: [], commitCount: 0, uncommitted: [], uncommittedCount: 0, untracked: [], untrackedCount: 0, ignored: [], ignoredCount: 0, blocked: null, unreachable: false, stamp: "s" };
  const CLEAN: WorkItemLoss = { ...NOTHING, branch: "owlery/fix-the-login-bug", worktree: "/w/project/fix-the-login-bug", ignored: [".env", "node_modules/"], ignoredCount: 2 };
  const HOLDS: WorkItemLoss = { ...CLEAN, commits: [{ hash: "abc1234", subject: "add the form" }], commitCount: 1, uncommitted: ["README.md"], uncommittedCount: 1, untracked: ["newdir/deep/u.txt"], untrackedCount: 1 };

  it("names the branch and the folder a delete removes, each commit by its hash and its subject apart, and each file by its path, under a heading for each kind that counts one in the singular, and leaves out a kind the loss holds none of", () => {
    expect(lossSections(HOLDS)).toEqual([
      { caption: "The branch and the folder removed from disk", rows: [{ path: "owlery/fix-the-login-bug" }, { path: "/w/project/fix-the-login-bug" }], more: "" },
      { caption: "1 commit no other branch, no remote and no tag holds", rows: [{ hash: "abc1234", subject: "add the form" }], more: "" },
      { caption: "1 file with changes that are not committed", rows: [{ path: "README.md" }], more: "" },
      { caption: "1 untracked file", rows: [{ path: "newdir/deep/u.txt" }], more: "" },
      { caption: "2 ignored files and folders, which go with the folder", rows: [{ path: ".env" }, { path: "node_modules/" }], more: "" },
    ]);
    expect(lossSections({ ...CLEAN, ignored: [".env"], ignoredCount: 1 }).map(({ caption }) => caption)).toEqual(["The branch and the folder removed from disk", "1 ignored file or folder, which goes with the folder"]);
    expect(lossSections({ ...NOTHING, branch: "owlery/gone-folder" })).toEqual([{ caption: "The branch removed from disk", rows: [{ path: "owlery/gone-folder" }], more: "" }]);
    expect(lossSections({ ...NOTHING, worktree: "/w/project/detached" })).toEqual([{ caption: "The folder removed from disk", rows: [{ path: "/w/project/detached" }], more: "" }]);
    expect(lossSections({ ...NOTHING, unreachable: true })).toEqual([]);
  });

  it("counts in each heading what the loss counts, and not the entries it lists, and says how many more there are where a list is cut, of each kind by its own count", () => {
    const cut = lossSections({ ...HOLDS, commitCount: 501, uncommittedCount: 2, untrackedCount: 1, ignoredCount: 14 });
    expect(cut.map(({ caption }) => caption)).toEqual([
      "The branch and the folder removed from disk",
      "501 commits no other branch, no remote and no tag holds",
      "2 files with changes that are not committed",
      "1 untracked file",
      "14 ignored files and folders, which go with the folder",
    ]);
    expect(cut.map(({ more }) => more)).toEqual(["", "and 500 more", "and 1 more", "", "and 12 more"]);
    expect(lossSections({ ...NOTHING, untracked: ["a.txt", "b.txt"], untrackedCount: 2 })[0]?.caption).toBe("2 untracked files");
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

  it("says that a delete removes the worktree alone where the loss names no branch, and that a branch Owlery did not make stays, where the delete can run", () => {
    const worktreeAlone: WorkItemLoss = { ...CLEAN, branch: null };
    const none = { branch: null, ownsBranch: false };
    const picked = { branch: "feature", ownsBranch: false };
    expect([deleteSays(worktreeAlone), deleteSays(worktreeAlone, none)]).toEqual(Array(2).fill("A delete removes the work item's worktree, and takes the work item off Owlery's lists."));
    expect(deleteSays(worktreeAlone, picked)).toBe("A delete removes the work item's worktree, and takes the work item off Owlery's lists. The branch feature stays, since Owlery did not make it.");
    expect(deleteSays({ ...HOLDS, branch: null }, picked)).toBe("A delete would lose the work named below. It runs only with Force delete checked. The branch feature stays, since Owlery did not make it.");
    // Where the delete cannot run, or removes nothing on disk, nothing is said of the branch.
    expect(deleteSays({ ...worktreeAlone, blocked: "The worktree /w is locked, so git does not remove it." }, picked)).toBe("The worktree /w is locked, so git does not remove it.");
    expect(deleteSays({ ...NOTHING, unreachable: true }, picked)).toBe("Git reads nothing in the repository's folder. A delete takes the work item off Owlery's lists, and its folder stays on disk.");
    // A branch Owlery made, and one a daemon of an earlier build made, which sends no such field, is the loss's to name.
    expect([deleteSays(CLEAN, { branch: "owlery/fix-the-login-bug", ownsBranch: true }), deleteSays(CLEAN, { branch: "owlery/fix-the-login-bug" })]).toEqual(Array(2).fill("A delete removes the work item's worktree and its local branch, and takes the work item off Owlery's lists."));
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
      expect(removalChoice(2, true, false, [], false).says).toBe("Owlery will no longer list the repository or its work items. Each work item's worktree, and the local branch Owlery made for it, are deleted, as named below. The repository's folder stays, and nothing on a remote is removed.");
      expect(removalChoice(0, false, true, [], false).says).toBe("Owlery will no longer list the repository. Its folder moves to the Trash, whole, and nothing in it is erased.");
      expect(removalChoice(2, true, true, [], false).says).toBe("Owlery will no longer list the repository or its work items. Each work item's worktree, and the local branch Owlery made for it, are deleted, as named below, and the repository's folder then moves to the Trash, whole. Nothing on a remote is removed.");
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
  it("names each running session of the work item, a pane by its tab's label and a headless session by its stage, never by its prompt, and gives their ids: no pane that exited, no headless session that ended, and none of another work item", () => {
    const sessions = [session(5, { kind: "shell" }), session(6, { kind: "shell", alive: false }), session(7, { kind: "shell" }), session(8, { workItemId: 2 }), session(9), session(10, { workItemId: null })];
    const stages = [headless(1), headless(2, { state: "finished" }), headless(3, { state: "failed" }), headless(4, { workItemId: 2 })];
    expect(archivalOf(LOGIN, sessions, stages, KINDS)).toEqual({
      sessions: { running: ["Shell 1", "Shell 3", "Claude Code", "Proofer, round"], queued: [] },
      running: { panes: [5, 7, 9], headless: [1] },
    });
  });

  it("names a headless session that waits for the machine apart from the running ones, by its stage, and gives its id among those the archive sends (scenario 9)", () => {
    expect(archivalOf(LOGIN, [session(5, { kind: "shell" })], [headless(1, { state: "queued" }), headless(2, { prompt: "Where is the index built?", role: { role: "inspector", stage: "inspection" } })], KINDS)).toEqual({
      sessions: { running: ["Shell", "Inspector, verdict"], queued: ["Proofer, round"] },
      running: { panes: [5], headless: [2, 1] },
    });
    expect(archivalOf(LOGIN, [], [headless(1, { state: "queued" })], KINDS)).toEqual({ sessions: { running: [], queued: ["Proofer, round"] }, running: { panes: [], headless: [1] } });
  });

  it("names the pane the work item's setup names Setup, as its tab does", () => {
    const setting: WorkItem = { ...LOGIN, setup: { ...RUNNING_SETUP, paneId: 5 } };
    expect(archivalOf(setting, [session(5, { kind: "shell" }), session(7, { kind: "shell" })], [], KINDS).sessions.running).toEqual(["Setup", "Shell"]);
    expect(removalOf(PROJECT, [setting], [], [session(5, { kind: "shell" }), session(7, { kind: "shell" })], [], KINDS).sessions.running).toEqual(["Setup in Fix the login bug", "Shell in Fix the login bug"]);
  });

  it("names none where no session of the work item runs or waits, so its archive asks nothing first", () => {
    expect(archivalOf(LOGIN, [session(6, { alive: false }), session(8, { workItemId: 2 })], [headless(2, { state: "finished" })], KINDS)).toEqual({ sessions: { running: [], queued: [] }, running: { panes: [], headless: [] } });
  });
});

describe("sessionSections", () => {
  const RUNS = "Running sessions that end";
  const WAITS = "Sessions waiting for the machine that leave the queue";

  it("gives a section of the sessions that run, headed as what ends, and under it a section of the sessions that wait for the machine, headed as what leaves the queue, each with its lines in their order", () => {
    expect(sessionSections({ running: ["Shell", "Inspector, verdict"], queued: ["Proofer, round 1", "Crafter, fix pass 1"] })).toEqual([
      { caption: RUNS, lines: ["Shell", "Inspector, verdict"] },
      { caption: WAITS, lines: ["Proofer, round 1", "Crafter, fix pass 1"] },
    ]);
  });

  it("gives no section for a kind that holds no line, so a dialog whose only session waits shows the queue's section alone, and one with no session shows none", () => {
    expect(sessionSections({ running: [], queued: ["Proofer, round 1"] })).toEqual([{ caption: WAITS, lines: ["Proofer, round 1"] }]);
    expect(sessionSections({ running: ["Shell"], queued: [] })).toEqual([{ caption: RUNS, lines: ["Shell"] }]);
    expect(sessionSections({ running: [], queued: [] })).toEqual([]);
  });
});

describe("sameValues", () => {
  const loss = { stamp: "a" };

  it("answers the same for lists that hold the same values in the same places, an object by its identity, so a dialog's part drawn from one is left as it is for the other", () => {
    expect(sameValues([7, "Renamed here", loss], [7, "Renamed here", loss])).toBe(true);
    expect(sameValues([], [])).toBe(true);
  });

  it("answers not the same where one value differs, an object read again among them, and where one list holds the other and more, so a section or a line added at the end is drawn", () => {
    expect(sameValues([loss], [{ stamp: "a" }])).toBe(false);
    expect(sameValues(["Running sessions that end", 1, "Shell"], ["Running sessions that end", 1, "Shell in First item"])).toBe(false);
    expect(sameValues(["Running sessions that end", 1, "Shell"], ["Running sessions that end", 1, "Shell", "Sessions waiting for the machine that leave the queue", 1, "Proofer, round 1"])).toBe(false);
    expect(sameValues(["Shell", "Proofer, round 1"], ["Shell"])).toBe(false);
  });
});

describe("daemonEnding", () => {
  it("words the dialog before a restart: its head, what a restart ends and what stays, and its button", () => {
    expect(daemonEnding("restart")).toEqual({
      head: "Restart the daemon",
      says: "A restart ends every running session and starts Owlery's background process again, from this build. The panes' tabs and what the chain's sessions answered go with the old process. Work items, their folders and their branches stay as they are.",
      button: "Restart",
    });
  });

  it("words the dialog before a complete quit: its head, what the quit ends and what stays, and its button", () => {
    expect(daemonEnding("quit")).toEqual({
      head: "Quit Owlery completely",
      says: "This ends every running session, stops Owlery's background process and quits Owlery. The panes' tabs and what the chain's sessions answered go with the process. Work items, their folders and their branches stay as they are.",
      button: "Quit",
    });
  });
});

describe("runningSessions", () => {
  const SHELVED: WorkItem = { ...LOGIN, id: 4, title: "Shelved", archivedAt: 50 };

  it("names every running session the window holds: each live pane of a listed work item, archived or not, by its tab's label and the work item, then a live pane of no listed work item by its kind's label, then each working headless session by its work item and its prompt, and no pane that exited, no headless session that ended and none that waits", () => {
    const sessions = [
      session(5, { kind: "shell" }),
      session(6, { kind: "shell", alive: false }),
      session(7, { workItemId: 4 }),
      session(8, { workItemId: 4, alive: false }),
      session(9, { kind: "shell", workItemId: null }),
      session(10, { workItemId: 99 }),
      session(11, { kind: "shell", workItemId: null, alive: false }),
    ];
    // The session of work item 99 has no role, as one a daemon before release 0.0.5 started at a person's request.
    const stages = [headless(1), headless(2, { state: "finished" }), headless(3, { workItemId: 4, prompt: "Where is the index built?", role: { role: "crafter", stage: "fix-pass" } }), headless(4, { workItemId: 4, state: "failed" }), headless(5, { workItemId: 99, prompt: "Who asked?", role: null }), headless(6, { workItemId: 99, state: "finished" })];
    expect(runningSessions([LOGIN], [SHELVED], sessions, stages, KINDS)).toEqual({
      running: [
        "Shell 1 in Fix the login bug",
        "Claude Code 1 in Shelved",
        "Shell",
        "Claude Code",
        "Proofer, round in Fix the login bug",
        "Crafter, fix pass in Shelved",
        "Session 5",
      ],
      queued: [],
    });
  });

  it("names each headless session that waits for the machine apart from the running ones, of a listed work item by its stage and the work item and of none by its stage alone (scenario 9)", () => {
    expect(runningSessions([LOGIN], [SHELVED], [], [headless(1, { state: "queued" }), headless(3, { workItemId: 4, prompt: "Where is the index built?", role: { role: "crafter", stage: "fix-pass" } }), headless(5, { workItemId: 99, prompt: "Who asked?", state: "queued", role: { role: "orchestrator", stage: "judgment" } })], KINDS)).toEqual({
      running: ["Crafter, fix pass in Shelved"],
      queued: ["Proofer, round in Fix the login bug", "Orchestrator, judgment"],
    });
  });

  it("names none where no session runs or waits", () => {
    expect(runningSessions([LOGIN], [SHELVED], [session(6, { alive: false })], [headless(2, { state: "finished" })], KINDS)).toEqual({ running: [], queued: [] });
    expect(runningSessions([], [], [], [], KINDS)).toEqual({ running: [], queued: [] });
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
  const PLAN = { branch: "owlery/x", worktree: "/w/project/x", localBases: ["main", "develop"], remoteBases: ["origin/main"], held: [], defaultBase: "develop", setupCommand: null, includes: false, disk: null };

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

  it("sends the account where the menu's value is another than the one set on the repository, null for the first choice, which leaves it to the default, and nothing where it is the one set or the dialog gives no value", () => {
    const SET: Repository = { ...PROJECT, accountId: 2 };
    expect(settingsFields(PROJECT, "", "", "2")).toEqual({ accountId: 2 });
    expect(settingsFields(PROJECT, "", "", "0")).toEqual({ accountId: 0 });
    expect(settingsFields(PROJECT, "", "", "")).toEqual({});
    expect(settingsFields(SET, "", "", "2")).toEqual({});
    expect(settingsFields(SET, "", "", "")).toEqual({ accountId: null });
    expect(settingsFields(SET, "Named", "")).toEqual({ name: "Named" });
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
      decision(4, { kind: "answered", says: "The base is main.", grounds: "agentory/config.json names no other.", since: NOW }),
      decision(5, { ...REVERSAL, state: "applied", landed: "abc1234", since: null }),
      decision(6, { ...REVERSAL, state: "carried", landed: "#53", since: NOW - 2 * MINUTE }),
    ];
    const DEFAULT = { kind: "Default taken", says: "Start from main.", grounds: "Grounds: frame/questions.md Q1 states main as its default.", by: "" };
    expect(decisionLines({ ...LOGIN, decisions }, NOW)).toEqual([
      { id: 6, ...DEFAULT, age: "2 min", reversed: { head: "Carried to #53", message: "기본값 말고 main에서 시작해 주세요" } },
      { id: 5, ...DEFAULT, age: "", reversed: { head: "Applied in abc1234", message: "기본값 말고 main에서 시작해 주세요" } },
      { id: 4, kind: "Answered from the tree", says: "The base is main.", grounds: "Grounds: agentory/config.json names no other.", by: "", age: "less than a minute", reversed: null },
      { id: 3, kind: "Scope chosen", says: "Leave the phone's screen out.", grounds: "Grounds: docs/roadmap.md, Milestones, row 3.", by: "Decided by orchestrator", age: "5 min", reversed: null },
      { id: 2, ...DEFAULT, age: "3 min", reversed: { head: "Reversed", message: "기본값 말고 main에서 시작해 주세요" } },
      { id: 1, kind: "Route", says: "Build it with no framer.", grounds: "Grounds: The issue names one file.", by: "", age: "3 h", reversed: null },
    ]);
    expect(decisionLines(LOGIN, NOW)).toEqual([]);
  });

  it("names each line of the record that was not read, by its number and the reader's reason, in the order given, and none where the record was read whole", () => {
    expect(unreadLines({ ...LOGIN, unread: [{ line: 4, why: "the block holds no id" }, { line: 19, why: "a fence opens like an inspection block and is not one" }] })).toEqual([
      "Line 4 of decisions.md was not read: the block holds no id",
      "Line 19 of decisions.md was not read: a fence opens like an inspection block and is not one",
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

describe("a word of the person's that no commit holds", () => {
  it("says above the decisions what the commit of the word waits for: for a working session or a running chain, its why and that Owlery commits it once that has ended, not as a failure; for a failed commit, git's reason and that Owlery tries again, as a failure", () => {
    expect(wordOwedSays({ ...LOGIN, wordOwed: { waits: "session", why: "a session of the work item is working" } })).toEqual({
      text: "The record holds a word of yours that no commit holds yet: a session of the work item is working. Owlery commits it once that has ended.",
      failed: false,
    });
    expect(wordOwedSays({ ...LOGIN, wordOwed: { waits: "session", why: "the work item's chain is running" } })).toEqual({
      text: "The record holds a word of yours that no commit holds yet: the work item's chain is running. Owlery commits it once that has ended.",
      failed: false,
    });
    expect(wordOwedSays({ ...LOGIN, wordOwed: { waits: "retry", why: "the hook says no" } })).toEqual({
      text: "The record holds a word of yours that was not committed: the hook says no. Owlery tries again.",
      failed: true,
    });
  });

  it("marks the line with the words after the count of the decisions where the commit failed, and with nothing while the word waits for a session", () => {
    expect(wordOwedMark({ ...LOGIN, wordOwed: { waits: "retry", why: "the hook says no" } })).toBe("word not committed");
    expect(wordOwedMark({ ...LOGIN, wordOwed: { waits: "session", why: "a session of the work item is working" } })).toBe("");
  });

  it("says nothing and marks nothing where nothing is owed, and reads a work item of a daemon of an earlier build, which sends no such field, as one that owes nothing", () => {
    expect(wordOwedSays({ ...LOGIN, wordOwed: null })).toBeNull();
    expect(wordOwedMark({ ...LOGIN, wordOwed: null })).toBe("");
    expect("wordOwed" in LOGIN).toBe(false);
    expect(wordOwedSays(LOGIN)).toBeNull();
    expect(wordOwedMark(LOGIN)).toBe("");
  });
});

describe("a work item parked with its questions", () => {
  const MINUTE = 60_000;
  const NOW = 100 * MINUTE;
  const BASE: Question = { id: 1, asks: "Which base does the branch start from?", grounds: "No document names the base of a hotfix.", by: "inspector", options: [{ label: "main", implies: "The release's fixes are not in it." }, { label: "release/v0.0.2", implies: "It merges after the release." }], default: "release/v0.0.2", answer: null, since: NOW - 12 * MINUTE };
  const FREE: Question = { id: 2, asks: "What should the screen be called?", grounds: "No document names it.", by: "inspector", options: [], default: null, answer: null, since: NOW - 10 * MINUTE };
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
        { id: 1, asks: "Which base does the branch start from?", by: "Asked by inspector", grounds: "Grounds: No document names the base of a hotfix.", options: [{ label: "main", implies: "The release's fixes are not in it.", mark: "" }, { label: "release/v0.0.2", implies: "It merges after the release.", mark: "Default" }], chosen: 1, answer: null },
        { id: 2, asks: "What should the screen be called?", by: "Asked by inspector", grounds: "Grounds: No document names it.", options: [], chosen: null, answer: null },
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
    expect(askedSection({ ...LOGIN, questions: [OPEN, FREE] }, NOW, null)).toMatchObject({ age: "Asked 10 min ago", questions: [{ by: "" }, { by: "Asked by inspector" }] });
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

describe("a work item a daemon before release 0.0.5 sends with the calls its sessions with no role waited on", () => {
  const MINUTE = 60_000;
  const NOW = 100 * MINUTE;
  /** A call as that daemon sent it in a work item's `permissions`, which a window of this build does not read. */
  const BASH = { id: 7, headlessId: 3, tool: "Bash", action: "run", text: "pnpm test -- redirect", at: NOW - 5 * MINUTE };
  const SENT = { ...LOGIN, permissions: [BASH] } as WorkItem;
  const working = session(2, { state: "working", stateSince: NOW - 40 * MINUTE, stateText: "Running the tests" });

  it("draws it as the work item with no such call: its line's state, its second row, its age and its session's lines are the same", () => {
    expect(inboxLine(SENT, [working], KINDS)).toEqual(inboxLine(LOGIN, [working], KINDS));
    expect(lineText(SENT, working, false)).toEqual(lineText(LOGIN, working, false));
    expect(lineSince(SENT, working)).toBe(lineSince(LOGIN, working));
    expect(headlessLines([headless(3)], SENT)).toEqual(headlessLines([headless(3)], LOGIN));
  });
});

describe("the approval line", () => {
  const MINUTE = 60_000;
  const NOW = 100 * MINUTE;
  const GATE = "3333333cccccccccccccccccccccccccccccccc";
  const TARGET = "2222222bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  /** What the daemon sends for a work item with no directory of its own. */
  const NOTHING: Recorded = { framed: false, rounds: 0, gate: null, verdict: null };
  /** A work item's records with the frame, three round records, a gate's run and a last verdict that clears. */
  const CLEARED: Recorded = { framed: true, rounds: 3, gate: GATE, verdict: { is: "cleared", commit: TARGET, says: null } };
  /** The inspection of that verdict, which holds at the branch's head, and the same inspection once a later commit lapsed it. */
  const HOLDS: Inspection = { state: "cleared", commit: TARGET, why: null };
  const LAPSED: Inspection = { state: "lapsed", commit: TARGET, why: "`src/app.ts` changed after the cleared commit `2222222`." };
  const RECORDED: WorkItem = { ...LOGIN, newCommits: 1, recorded: CLEARED, inspection: HOLDS };
  const EMPTY: WorkItem = { ...LOGIN, newCommits: 0, recorded: NOTHING };
  const NONE_STARTED = [
    ["framer", "no-agent", "Not started", "Framer: Not started"],
    ["crafter", "no-agent", "Not started", "Crafter: Not started"],
    ["proofer", "no-agent", "Not started", "Proofer: Not started"],
    ["inspector", "no-agent", "Not started", "Inspector: Not started"],
  ];
  const ASKS: Question = { id: 1, asks: "Does a stopped round count as a round?", grounds: "No document says.", by: "proofer", options: [], default: null, answer: null, since: NOW - 12 * MINUTE };

  /** A stage of a chain: round 2, at work for 4 minutes, but for the fields given. */
  const stage = (fields: Partial<ChainStage>): ChainStage => ({ kind: "round", round: 2, state: "working", failure: null, startedAt: NOW - 4 * MINUTE, endedAt: null, headlessId: 3, refusals: 0, gate: null, ...fields });
  /** Round 1, which finished. */
  const ROUND_ONE = stage({ round: 1, state: "finished", startedAt: NOW - 30 * MINUTE, endedAt: NOW - 20 * MINUTE });
  /** The work item of the records with a chain in that state, which holds those stages, the oldest first. */
  const chained = (state: Chain["state"], ...stages: ChainStage[]): WorkItem => ({ ...RECORDED, chain: { state, says: "", stages, since: NOW - 4 * MINUTE } });
  /** A chain that runs round 2 after round 1. */
  const RUNS_ROUND = chained("running", ROUND_ONE, stage({}));

  /** Each place as a person reads it: its role, its state's class, its note and its mark's words. */
  const read = (workItem: WorkItem): string[][] | null => approvalPlaces(workItem)?.map((place) => [place.role, place.state, place.note, placeWords(place, NOW)]) ?? null;
  /** The lines of text under the places. */
  const under = (workItem: WorkItem): string[] | null => approvalPlaces(workItem)?.flatMap((place) => (place.under === null ? [] : [place.under])) ?? null;

  it("fills the four places in the order framer, crafter, proofer, inspector from what the records say and the branch's commits, and leaves each not started where they say nothing", () => {
    expect(read(RECORDED)).toEqual([
      ["framer", "finished", "Framed", "Framer: Framed"],
      ["crafter", "finished", "1 commit", "Crafter: 1 commit"],
      ["proofer", "finished", "3 rounds", "Proofer: 3 rounds"],
      ["inspector", "finished", "Cleared", "Inspector: Cleared at 2222222"],
    ]);
    expect(under(RECORDED)).toEqual([]);
    expect(approvalPlaces(RECORDED)?.map(({ name }) => name)).toEqual(["Framer", "Crafter", "Proofer", "Inspector"]);
    expect(read({ ...RECORDED, newCommits: 3, recorded: { ...CLEARED, rounds: 1 } })?.slice(1, 3)).toEqual([
      ["crafter", "finished", "3 commits", "Crafter: 3 commits"],
      ["proofer", "finished", "1 round", "Proofer: 1 round"],
    ]);
    expect(read(EMPTY)).toEqual(NONE_STARTED);
    expect(under(EMPTY)).toEqual([]);
    // A count of commits the daemon has not read leaves the crafter's place not started.
    expect(read({ ...EMPTY, newCommits: null })).toEqual(NONE_STARTED);
  });

  it("marks the inspector's place failed at a withheld verdict and waiting at an undecided one, each with the verdict's commit and its reason or question under the line, and says a gate's run where no verdict stands", () => {
    const withheld: WorkItem = { ...EMPTY, recorded: { ...NOTHING, verdict: { is: "withheld", commit: TARGET, says: "The broad gate did not run at the head." } } };
    expect(read(withheld)?.[3]).toEqual(["inspector", "failed", "Withheld", "Inspector: Withheld at 2222222"]);
    expect(under(withheld)).toEqual(["Inspector: The broad gate did not run at the head."]);
    const undecided: WorkItem = { ...EMPTY, recorded: { ...NOTHING, verdict: { is: "undecided", commit: TARGET, says: "Which base does the hotfix merge into?" } } };
    expect(read(undecided)?.[3]).toEqual(["inspector", "waiting", "Undecided", "Inspector: Undecided at 2222222"]);
    expect(under(undecided)).toEqual(["Inspector: Which base does the hotfix merge into?"]);
    const gated: WorkItem = { ...EMPTY, recorded: { ...NOTHING, gate: GATE } };
    expect(read(gated)?.[3]).toEqual(["inspector", "no-agent", "Gate passed", "Inspector: Gate passed at 3333333"]);
    expect(under(gated)).toEqual([]);
    // A verdict stands over the gate's run, and a verdict whose record gives no text puts no line under the places.
    expect(read({ ...withheld, recorded: { ...CLEARED, verdict: { is: "withheld", commit: TARGET, says: null } } })?.[3]).toEqual(["inspector", "failed", "Withheld", "Inspector: Withheld at 2222222"]);
    expect(under({ ...withheld, recorded: { ...CLEARED, verdict: { is: "withheld", commit: TARGET, says: null } } })).toEqual([]);
    // The other three places are as the records give them.
    expect(read(withheld)?.slice(0, 3)).toEqual(NONE_STARTED.slice(0, 3));
  });

  it("marks the inspector's place finished with the cleared commit where the inspection holds at the branch's head, waiting with the note Inspection lapsed and the inspection's sentence under the line where a later commit lapsed it, and reads a verdict that clears in the worktree while the head holds no inspection as no verdict", () => {
    expect(read(RECORDED)?.[3]).toEqual(["inspector", "finished", "Cleared", "Inspector: Cleared at 2222222"]);
    expect(under(RECORDED)).toEqual([]);
    const lapsed: WorkItem = { ...RECORDED, inspection: LAPSED };
    expect(read(lapsed)?.[3]).toEqual(["inspector", "waiting", "Inspection lapsed", "Inspector: Inspection lapsed, cleared at 2222222"]);
    expect(under(lapsed)).toEqual(["Inspector: `src/app.ts` changed after the cleared commit `2222222`."]);
    expect(read(lapsed)?.slice(0, 3)).toEqual(read(RECORDED)?.slice(0, 3));
    // The worktree's verdict clears and the head holds no inspection: the gate's run says the place, or nothing does. A daemon of an earlier build sends no inspection.
    const { inspection: _inspection, ...unread } = RECORDED;
    for (const none of [{ ...RECORDED, inspection: null }, unread as WorkItem]) {
      expect(read(none)?.[3]).toEqual(["inspector", "no-agent", "Gate passed", "Inspector: Gate passed at 3333333"]);
      expect(read({ ...none, recorded: { ...CLEARED, gate: null } })?.[3]).toEqual(NONE_STARTED[3]);
      expect(under(none)).toEqual([]);
    }
    // A lapsed inspection stands over a verdict the worktree holds and no commit does.
    expect(read({ ...lapsed, recorded: { ...CLEARED, verdict: { is: "withheld", commit: TARGET, says: "Not committed." } } })?.[3]).toEqual(["inspector", "waiting", "Inspection lapsed", "Inspector: Inspection lapsed, cleared at 2222222"]);
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
    // An open question marks the place over what the records say: the inspector waits on a question while its verdict clears.
    expect(read({ ...RECORDED, questions: [{ ...ASKS, by: "inspector" }] })?.[3]).toEqual(["inspector", "waiting", "Needs you", "Inspector: Needs you, 12 min"]);
    for (const by of ["orchestrator", "Proofer", " proofer", null]) {
      expect(read({ ...RECORDED, questions: [{ ...ASKS, by }] })).toEqual(read(RECORDED));
      expect(under({ ...RECORDED, questions: [{ ...ASKS, by }] })).toEqual([]);
    }
    expect(read({ ...RECORDED, questions: [{ ...ASKS, answer: "No" }] })).toEqual(read(RECORDED));
    expect(under({ ...RECORDED, questions: [{ ...ASKS, answer: "No" }] })).toEqual([]);
  });

  it("is composed from the work item alone, so no pane's agent state and no headless session changes it", () => {
    expect(approvalPlaces.length).toBe(1);
    const quiet = workItemEntries([RECORDED], [session(2, { state: "finished" })], KINDS);
    const busy = workItemEntries([RECORDED], [session(3, { state: "waiting", stateSince: NOW - MINUTE, stateText: "Allow the edit?" })], KINDS);
    // The two lists give the line of the inbox two states, and the places one.
    expect(quiet[0]?.line.state).toBe("finished");
    expect(busy[0]?.line.state).toBe("waiting");
    // The function takes no session, a pane's or a headless one's, so the places are the work item's alone: a pane that waits marks no place.
    expect(approvalPlaces(busy[0]!.workItem)).toEqual(approvalPlaces(quiet[0]!.workItem));
    expect(read(busy[0]!.workItem)).toEqual(read(RECORDED));
    expect(read(busy[0]!.workItem)?.map(([, state]) => state)).not.toContain("waiting");
  });

  it("gives no places for a work item a daemon of an earlier build sends without what its records say, and the places of the records and the questions for one that carries no chain", () => {
    const { recorded: _recorded, ...earlier } = RECORDED;
    expect(approvalPlaces(earlier as WorkItem)).toBeNull();
    expect(approvalPlaces({ ...earlier, questions: [ASKS] } as WorkItem)).toBeNull();
    expect(approvalPlaces({ ...earlier, chain: RUNS_ROUND.chain } as WorkItem)).toBeNull();
    // A daemon of a build between the two sends what the records say and no chain.
    const { chain: _chain, ...noChain } = RECORDED;
    expect(RECORDED.chain).toBeNull();
    expect(read(noChain as WorkItem)).toEqual(read(RECORDED));
    expect(read({ ...noChain, questions: [ASKS] } as WorkItem)).toEqual(read({ ...RECORDED, questions: [ASKS] }));
  });

  it("marks the proofer's place working at the round a running chain's newest stage is, and the crafter's at its fix pass, each with the stage's age in the mark's words, and marks no place for a judgment, for a ruling, for a stage that is not the newest, or for a chain that does not run", () => {
    expect(read(RUNS_ROUND)?.[2]).toEqual(["proofer", "working", "Round 2", "Proofer: Round 2, 4 min"]);
    expect(read(RUNS_ROUND)?.filter((_, place) => place !== 2)).toEqual(read(RECORDED)?.filter((_, place) => place !== 2));
    expect(under(RUNS_ROUND)).toEqual([]);
    const fix = chained("running", ROUND_ONE, stage({ kind: "fix-pass", round: 1 }));
    expect(read(fix)?.[1]).toEqual(["crafter", "working", "Fix pass", "Crafter: Fix pass on round 1, 4 min"]);
    expect(read(fix)?.filter((_, place) => place !== 1)).toEqual(read(RECORDED)?.filter((_, place) => place !== 1));
    // The orchestrator's two kinds of stage belong to none of the four roles.
    for (const kind of ["judgment", "ruling"] as const) expect(read(chained("running", ROUND_ONE, stage({ kind })))).toEqual(read(RECORDED));
    // Between two stages the newest one has ended, and an older stage marks no place whatever it says. A round that finished leaves the proofer's place to the records.
    expect(read(chained("running", stage({}), stage({ kind: "judgment", state: "finished", endedAt: NOW - MINUTE })))).toEqual(read(RECORDED));
    for (const state of ["running", "rested"] as const) expect(read(chained(state, ROUND_ONE))).toEqual(read(RECORDED));
    // A chain a restarted daemon reads as stopped keeps a newest stage that still says working, and no place works.
    for (const state of ["stopped", "parked", "rested"] as const) expect(read(chained(state, ROUND_ONE, stage({})))).toEqual(read(RECORDED));
    // An open question of the role stands over the stage that runs.
    expect(read({ ...RUNS_ROUND, questions: [ASKS] })?.[2]).toEqual(["proofer", "waiting", "Needs you", "Proofer: Needs you, 12 min"]);
  });

  it("marks the proofer's place failed where the chain's newest stage is a round that failed, and the crafter's where it is a fix pass, each over what the records say and with the stage's failure under the line, and marks no place for a judgment or a ruling that failed or for a failed stage that is not the newest", () => {
    const why = "the session reached its time limit and was stopped";
    const failed = (fields: Partial<ChainStage>): ChainStage => stage({ state: "failed", failure: why, endedAt: NOW - MINUTE, ...fields });
    const round = chained("stopped", ROUND_ONE, failed({}));
    expect(read(round)?.[2]).toEqual(["proofer", "failed", "Failed", "Proofer: Round 2 failed"]);
    expect(read(round)?.filter((_, place) => place !== 2)).toEqual(read(RECORDED)?.filter((_, place) => place !== 2));
    expect(under(round)).toEqual(["Proofer: The session reached its time limit and was stopped."]);
    const fix = chained("stopped", ROUND_ONE, failed({ kind: "fix-pass", round: 1 }));
    expect(read(fix)?.[1]).toEqual(["crafter", "failed", "Failed", "Crafter: Fix pass on round 1 failed"]);
    expect(under(fix)).toEqual(["Crafter: The session reached its time limit and was stopped."]);
    for (const kind of ["judgment", "ruling"] as const) {
      expect(read(chained("stopped", ROUND_ONE, failed({ kind })))).toEqual(read(RECORDED));
      expect(under(chained("stopped", ROUND_ONE, failed({ kind })))).toEqual([]);
    }
    // The round runs again after its failure: the newest stage says where the place stands, and the failure leaves the line.
    const again = chained("running", failed({}), stage({}));
    expect(read(again)?.[2]).toEqual(["proofer", "working", "Round 2", "Proofer: Round 2, 4 min"]);
    expect(under(again)).toEqual([]);
    // A fix pass runs after a round that failed earlier: the proofer's place is as the records give it.
    expect(read(chained("running", failed({}), stage({ kind: "fix-pass" })))?.[2]).toEqual(read(RECORDED)?.[2]);
    // An open question of the role stands over the failure, with the question under the line.
    expect(read({ ...round, questions: [ASKS] })?.[2]).toEqual(["proofer", "waiting", "Needs you", "Proofer: Needs you, 12 min"]);
    expect(under({ ...round, questions: [ASKS] })).toEqual(["Proofer: Does a stopped round count as a round?"]);
  });

  it("marks the inspector's place working while the chain runs the broad gate, with the note Broad gate, and while it runs the inspection, with the note Judging, each with the stage's age in the mark's words, and leaves the place to the records once either has finished", () => {
    const gate = (fields: Partial<ChainStage>): ChainStage => stage({ kind: "gate", headlessId: null, gate: { command: "pnpm -r run check", exitCode: null, output: false }, ...fields });
    const runsGate = chained("running", ROUND_ONE, gate({}));
    expect(read(runsGate)?.[3]).toEqual(["inspector", "working", "Broad gate", "Inspector: Broad gate, 4 min"]);
    expect(read(runsGate)?.slice(0, 3)).toEqual(read(RECORDED)?.slice(0, 3));
    expect(under(runsGate)).toEqual([]);
    const runsInspection = chained("running", ROUND_ONE, stage({ kind: "inspection" }));
    expect(read(runsInspection)?.[3]).toEqual(["inspector", "working", "Judging", "Inspector: Judging, 4 min"]);
    expect(read(runsInspection)?.slice(0, 3)).toEqual(read(RECORDED)?.slice(0, 3));
    expect(under(runsInspection)).toEqual([]);
    // A gate that passed and an inspection whose verdict was written have finished: the records say the place, a gate's run or the verdict.
    const passed = gate({ state: "finished", endedAt: NOW - MINUTE, gate: { command: "pnpm -r run check", exitCode: 0, output: true } });
    expect(read({ ...chained("running", ROUND_ONE, passed), recorded: { ...CLEARED, verdict: null }, inspection: null })?.[3]).toEqual(["inspector", "no-agent", "Gate passed", "Inspector: Gate passed at 3333333"]);
    const withheld: Recorded = { ...CLEARED, verdict: { is: "withheld", commit: TARGET, says: "Round 2 closed a finding the tree still holds." } };
    const stopped: WorkItem = { ...chained("stopped", ROUND_ONE, passed, stage({ kind: "inspection", state: "finished", endedAt: NOW - MINUTE })), recorded: withheld, inspection: null };
    expect(read(stopped)?.[3]).toEqual(["inspector", "failed", "Withheld", "Inspector: Withheld at 2222222"]);
    expect(under(stopped)).toEqual(["Inspector: Round 2 closed a finding the tree still holds."]);
    // An open question of the inspector's stands over the stage that runs.
    expect(read({ ...runsInspection, questions: [{ ...ASKS, by: "inspector" }] })?.[3]).toEqual(["inspector", "waiting", "Needs you", "Inspector: Needs you, 12 min"]);
  });

  it("marks the inspector's place waiting where the chain's newest stage is a broad gate that failed, with the note Gate failed, and failed where it is a inspector's session that failed, each over what the records say and with the stage's failure under the line", () => {
    const failedGate = stage({ kind: "gate", headlessId: null, state: "failed", failure: "the command exited with code 3", endedAt: NOW - MINUTE, gate: { command: "pnpm -r run check", exitCode: 3, output: true } });
    const gated = chained("stopped", ROUND_ONE, failedGate);
    expect(read(gated)?.[3]).toEqual(["inspector", "waiting", "Gate failed", "Inspector: Gate failed"]);
    expect(read(gated)?.slice(0, 3)).toEqual(read(RECORDED)?.slice(0, 3));
    expect(under(gated)).toEqual(["Inspector: The command exited with code 3."]);
    // The records of this work item hold a verdict that clears an earlier commit, and the failed gate stands over it.
    expect(read(RECORDED)?.[3]).toEqual(["inspector", "finished", "Cleared", "Inspector: Cleared at 2222222"]);
    const judged = chained("stopped", ROUND_ONE, stage({ kind: "inspection", state: "failed", failure: "the session reached its time limit and was stopped", endedAt: NOW - MINUTE }));
    expect(read(judged)?.[3]).toEqual(["inspector", "failed", "Failed", "Inspector: Judging failed"]);
    expect(read(judged)?.slice(0, 3)).toEqual(read(RECORDED)?.slice(0, 3));
    expect(under(judged)).toEqual(["Inspector: The session reached its time limit and was stopped."]);
    // A gate that runs again after its failure is at work, and the failure leaves the line.
    const again = chained("running", ROUND_ONE, failedGate, stage({ kind: "gate", headlessId: null, gate: { command: "pnpm -r run check", exitCode: null, output: false } }));
    expect(read(again)?.[3]).toEqual(["inspector", "working", "Broad gate", "Inspector: Broad gate, 4 min"]);
    expect(under(again)).toEqual([]);
    // A failed gate marks no other role's place, and a failed round after it leaves the inspector's place to the records.
    expect(read(chained("stopped", failedGate, stage({ state: "failed", failure: "stopped", endedAt: NOW - MINUTE })))?.[3]).toEqual(read(RECORDED)?.[3]);
  });

  /** The work item of the records with the stage a pane's session runs: round 1, told 4 minutes ago, but for the fields given. */
  const inPane = (workItem: WorkItem, fields: Partial<PaneStage> = {}): WorkItem => ({ ...workItem, paneStage: { kind: "round", round: 1, since: NOW - 4 * MINUTE, ...fields } });

  it("marks the place of the role whose stage a pane's session runs working, the proofer's at its round, the crafter's at its fix pass and the inspector's at its inspection and at its broad gate, each with the stage's age in the mark's words, and leaves every place to the records where the work item carries no such stage", () => {
    const round = inPane(RECORDED);
    expect(read(round)?.[2]).toEqual(["proofer", "working", "Round 1", "Proofer: Round 1, 4 min"]);
    expect(read(round)?.filter((_, place) => place !== 2)).toEqual(read(RECORDED)?.filter((_, place) => place !== 2));
    expect(under(round)).toEqual([]);
    const fix = inPane(RECORDED, { kind: "fix-pass", round: 2 });
    expect(read(fix)?.[1]).toEqual(["crafter", "working", "Fix pass", "Crafter: Fix pass on round 2, 4 min"]);
    expect(read(fix)?.filter((_, place) => place !== 1)).toEqual(read(RECORDED)?.filter((_, place) => place !== 1));
    const inspection = inPane(RECORDED, { kind: "inspection", round: 2 });
    expect(read(inspection)?.[3]).toEqual(["inspector", "working", "Judging", "Inspector: Judging, 4 min"]);
    expect(read(inspection)?.slice(0, 3)).toEqual(read(RECORDED)?.slice(0, 3));
    const gate = inPane(RECORDED, { kind: "gate", round: 2 });
    expect(read(gate)?.[3]).toEqual(["inspector", "working", "Broad gate", "Inspector: Broad gate, 4 min"]);
    expect(read(gate)?.slice(0, 3)).toEqual(read(RECORDED)?.slice(0, 3));
    // A work item whose records hold nothing yet: the pane's round stands where the place said "Not started".
    expect(read(inPane(EMPTY))).toEqual([NONE_STARTED[0], NONE_STARTED[1], ["proofer", "working", "Round 1", "Proofer: Round 1, 4 min"], NONE_STARTED[3]]);
    // No stage, and a daemon of an earlier build, which sends no such field: the records say every place.
    expect(read({ ...RECORDED, paneStage: null })).toEqual(read(RECORDED));
    const { paneStage: _paneStage, ...earlier } = round;
    expect(read(earlier as WorkItem)).toEqual(read(RECORDED));
  });

  it("puts an open question of the role over a pane's stage, the stage the daemon's chain runs over a pane's stage of any role, the broad gate the daemon's chain runs over the pane's broad gate its own ask gives, and a pane's stage over a failed stage of the daemon's chain", () => {
    const told = { since: NOW - 9 * MINUTE };
    expect(read({ ...inPane(RECORDED, told), questions: [ASKS] })?.[2]).toEqual(["proofer", "waiting", "Needs you", "Proofer: Needs you, 12 min"]);
    expect(under({ ...inPane(RECORDED, told), questions: [ASKS] })).toEqual(["Proofer: Does a stopped round count as a round?"]);
    // The daemon's chain runs round 2, from 4 minutes ago: it says the proofer's place, and a pane's stage of another role marks nothing while it runs.
    expect(read(inPane(RUNS_ROUND, told))).toEqual(read(RUNS_ROUND));
    expect(read(inPane(RUNS_ROUND, { ...told, kind: "inspection" }))).toEqual(read(RUNS_ROUND));
    // The daemon's own broad gate asks the keeper with the place of a gate, so the work item carries a pane's gate from that ask: the place keeps the daemon's stage and its age.
    const runsGate = chained("running", ROUND_ONE, stage({ kind: "gate", headlessId: null, gate: { command: "pnpm -r run check", exitCode: null, output: false } }));
    expect(read(inPane(runsGate, { kind: "gate", round: 1, since: NOW - MINUTE }))?.[3]).toEqual(["inspector", "working", "Broad gate", "Inspector: Broad gate, 4 min"]);
    // A chain a restarted daemon reads as stopped runs no stage, though its newest says it works: the pane's stage says the place.
    expect(read(inPane(chained("stopped", ROUND_ONE, stage({})), told))?.[2]).toEqual(["proofer", "working", "Round 1", "Proofer: Round 1, 9 min"]);
    // The daemon chain's round failed and the pane's session runs it again: the place works, and the failure leaves the line.
    const failed = chained("stopped", ROUND_ONE, stage({ state: "failed", failure: "stopped", endedAt: NOW - MINUTE }));
    expect(read(inPane(failed, { ...told, round: 2 }))?.[2]).toEqual(["proofer", "working", "Round 2", "Proofer: Round 2, 9 min"]);
    expect(under(inPane(failed, { ...told, round: 2 }))).toEqual([]);
    // A failed broad gate of the daemon's chain keeps the inspector's place while the pane's session runs a round.
    const failedGate = chained("stopped", ROUND_ONE, stage({ kind: "gate", headlessId: null, state: "failed", failure: "the command exited with code 3", endedAt: NOW - MINUTE, gate: { command: "pnpm -r run check", exitCode: 3, output: true } }));
    expect(read(inPane(failedGate, told))?.slice(2)).toEqual([
      ["proofer", "working", "Round 1", "Proofer: Round 1, 9 min"],
      ["inspector", "waiting", "Gate failed", "Inspector: Gate failed"],
    ]);
  });

  it("says a failed stage's failure under the places as a sentence: a capital on a first word of letters alone and a full stop where the text ends with none, and no other change", () => {
    const says = (failure: string | null): string[] | null => under(chained("stopped", ROUND_ONE, stage({ state: "failed", failure, endedAt: NOW - MINUTE })));
    // The clause the daemon writes, with no capital and no full stop.
    expect(says("the daemon ended while the stage ran")).toEqual(["Proofer: The daemon ended while the stage ran."]);
    expect(says("its record's target line reads `target: HEAD`")).toEqual(["Proofer: Its record's target line reads `target: HEAD`."]);
    expect(says("stopped")).toEqual(["Proofer: Stopped."]);
    // A text that is a sentence already, as a CLI's own error can be, stands as it is, and so does the mark it ends with.
    expect(says("The session is out of turns.")).toEqual(["Proofer: The session is out of turns."]);
    expect(says("is the CLI signed in?")).toEqual(["Proofer: Is the CLI signed in?"]);
    expect(says("the CLI said: no!")).toEqual(["Proofer: The CLI said: no!"]);
    // A first word that is a path, a file's name or a number is no word to give a capital.
    expect(says("agentory/threads/one/trail/rounds/round-2.md was written and not committed")).toEqual(["Proofer: agentory/threads/one/trail/rounds/round-2.md was written and not committed."]);
    expect(says("round-2.md holds no target line")).toEqual(["Proofer: round-2.md holds no target line."]);
    expect(says("2 blocks open with a verdict")).toEqual(["Proofer: 2 blocks open with a verdict."]);
    // A first word that a mark ends, before a space or the text's end, is a word of letters alone.
    expect(says("error: unknown option '--no-such-option'")).toEqual(["Proofer: Error: unknown option '--no-such-option'."]);
    expect(says("failed.")).toEqual(["Proofer: Failed."]);
    for (const mark of [",", ":", ";", ".", "!", "?", "?!"]) expect(says(`stopped${mark} at a request`)).toEqual([`Proofer: Stopped${mark} at a request.`]);
    // A mark inside the first word ends no word: an address and a name with a colon stand as written.
    expect(says("http://localhost:4000 refused the connection")).toEqual(["Proofer: http://localhost:4000 refused the connection."]);
    expect(says("node:fs could not be loaded")).toEqual(["Proofer: node:fs could not be loaded."]);
    // The space around the text is no part of the sentence, and a line break inside it is kept.
    expect(says("  the session failed\nexit 1\n")).toEqual(["Proofer: The session failed\nexit 1."]);
    expect(says("")).toEqual(["Proofer: "]);
    expect(says(null)).toEqual([]);
  });
});

describe("a work item's chain", () => {
  const MINUTE = 60_000;
  const NOW = 100 * MINUTE;
  const ROUND: ChainStage = { kind: "round", round: 1, state: "finished", failure: null, startedAt: NOW - 30 * MINUTE, endedAt: NOW - 20 * MINUTE, headlessId: 3, refusals: 0, gate: null };
  const FIX: ChainStage = { kind: "fix-pass", round: 1, state: "failed", failure: "the session reached its time limit and was stopped", startedAt: NOW - 19 * MINUTE, endedAt: NOW - 6 * MINUTE, headlessId: 4, refusals: 0, gate: null };
  const STOPPED_SAYS = "The fix pass of round 1 failed: the session reached its time limit and was stopped.";
  const chain = (state: Chain["state"], fields: Partial<Chain> = {}): Chain => ({ state, says: state === "stopped" ? STOPPED_SAYS : state === "running" ? "Review round 1 is running." : "", stages: [], since: NOW - 4 * MINUTE, ...fields });
  const RUNNING: WorkItem = { ...LOGIN, chain: chain("running", { stages: [{ ...ROUND, state: "working", endedAt: null }] }) };
  const STOPPED: WorkItem = { ...LOGIN, chain: chain("stopped", { stages: [ROUND, FIX] }) };
  const RESTED: WorkItem = { ...LOGIN, chain: chain("rested", { says: "The inspector cleared 1a2b3c4, after round 1.", stages: [ROUND] }) };
  const PARKED: WorkItem = { ...LOGIN, chain: chain("parked", { says: "The work item waits for the answers to its questions.", stages: [ROUND] }) };
  const QUESTION: Question = { id: 1, asks: "Which base does the branch start from?", grounds: "No document names the base of a hotfix.", by: "crafter", options: [], default: null, answer: null, since: NOW - 12 * MINUTE };
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

  it("leaves the line's state to the work item's panes where its chain rests, where it is parked and every question is answered, and where no chain ran", () => {
    for (const workItem of [RESTED, PARKED, LOGIN]) {
      for (const sessions of [[], [finished], [working], [waiting]]) expect(inboxLine(workItem, sessions, KINDS)).toEqual(inboxLine(LOGIN, sessions, KINDS));
    }
    // A parked chain's line waits by the open question of the work item's record.
    expect(inboxLine({ ...PARKED, questions: [QUESTION] }, [finished], KINDS).state).toBe("waiting");
  });

  it("says a stopped chain's sentence in the line's second row, after a parked work item's question and before what its agent says, and the branch while a search is typed", () => {
    expect(lineText(STOPPED, finished, false)).toEqual({ says: "chain", text: STOPPED_SAYS });
    expect(lineText(STOPPED, undefined, false)).toEqual({ says: "chain", text: STOPPED_SAYS });
    expect(lineText(STOPPED, waiting, false)).toEqual({ says: "chain", text: STOPPED_SAYS });
    expect(lineText({ ...STOPPED, questions: [QUESTION] }, finished, false)).toEqual({ says: "question", text: "Which base does the branch start from?" });
    expect(lineText(STOPPED, finished, true)).toEqual({ says: "branch", text: "owlery/fix-the-login-bug" });
  });

  it("names the stage a running chain runs in the line's second row, in short, where nothing on the line needs the person, and says what the line says without the stage where a question is open, the line's pane waits, a search is typed, the chain's newest stage has ended or the chain does not run", () => {
    const runs = (fields: Partial<ChainStage>): WorkItem => ({ ...LOGIN, chain: chain("running", { stages: [ROUND, { ...ROUND, state: "working", endedAt: null, ...fields }] }) });
    for (const pane of [finished, working, undefined]) expect(lineText(runs({ round: 2 }), pane, false)).toEqual({ says: "stage", text: "Proofer, round 2" });
    expect(lineText(RUNNING, finished, false)).toEqual({ says: "stage", text: "Proofer, round 1" });
    expect(lineText(runs({ kind: "fix-pass" }), finished, false)).toEqual({ says: "stage", text: "Crafter, fix pass" });
    expect(lineText(runs({ kind: "judgment", round: 2 }), finished, false)).toEqual({ says: "stage", text: "Orchestrator, judgment" });
    expect(lineText(runs({ kind: "ruling" }), finished, false)).toEqual({ says: "stage", text: "Orchestrator, ruling" });
    // The broad gate is no role's session, so its words name no role, and the inspection is the inspector's.
    expect(lineText(runs({ kind: "gate", headlessId: null, gate: { command: "pnpm -r run check", exitCode: null, output: false } }), finished, false)).toEqual({ says: "stage", text: "Broad gate" });
    expect(lineText(runs({ kind: "inspection" }), finished, false)).toEqual({ says: "stage", text: "Inspector, verdict" });
    // The pull request stage is no role's session either, and runs after the inspection.
    expect(lineText(runs({ kind: "pull-request", headlessId: null }), finished, false)).toEqual({ says: "stage", text: "Pull request" });
    // A line that waits keeps saying what it waits on while the stage runs.
    expect(lineText({ ...RUNNING, questions: [QUESTION] }, finished, false)).toEqual({ says: "question", text: "Which base does the branch start from?" });
    expect(lineText(RUNNING, waiting, false)).toEqual({ says: "state", text: "May I run the tests?" });
    expect(lineText(RUNNING, finished, true)).toEqual({ says: "branch", text: "owlery/fix-the-login-bug" });
    // Between two stages the newest one has ended, and a chain that rests runs none.
    for (const workItem of [{ ...LOGIN, chain: chain("running", { stages: [ROUND] }) }, { ...LOGIN, chain: chain("running") }, RESTED, PARKED]) {
      expect(lineText(workItem, finished, false)).toEqual({ says: "state", text: "The form is done." });
      expect(lineText(workItem, undefined, false)).toEqual({ says: "branch", text: "owlery/fix-the-login-bug" });
    }
    // A chain a restarted daemon reads as stopped keeps a newest stage that still says working, and the line says the chain's sentence.
    expect(lineText({ ...LOGIN, chain: chain("stopped", { stages: [{ ...ROUND, state: "working", endedAt: null }] }) }, finished, false)).toEqual({ says: "chain", text: STOPPED_SAYS });
  });

  it("counts the age of a stopped chain's line from when the chain stopped, whenever its newest stage ended, and from the earlier of that and its questions' times", () => {
    // The chain stopped 4 minutes ago, 2 minutes after its newest stage ended.
    expect(lineSince(STOPPED, finished)).toBe(NOW - 4 * MINUTE);
    expect(lineSince(STOPPED, undefined)).toBe(NOW - 4 * MINUTE);
    expect(stateWithAge(inboxLine(STOPPED, [finished], KINDS).state, lineSince(STOPPED, finished), NOW)).toBe("Needs you, 4 min");
    expect(lineSince({ ...STOPPED, questions: [QUESTION] }, finished)).toBe(NOW - 12 * MINUTE);
    // A chain that stopped outside a stage, at a start long after its newest stage ended, has waited since that stop.
    expect(lineSince({ ...LOGIN, chain: chain("stopped", { stages: [ROUND], since: NOW - MINUTE }) }, finished)).toBe(NOW - MINUTE);
    // The daemon ended while the stage ran, so the stage has no end, and a chain may stop before its first stage.
    expect(lineSince({ ...LOGIN, chain: chain("stopped", { stages: [ROUND, { ...FIX, endedAt: null }] }) }, finished)).toBe(NOW - 4 * MINUTE);
    expect(lineSince({ ...LOGIN, chain: chain("stopped") }, finished)).toBe(NOW - 4 * MINUTE);
  });

  it("counts the age of a running chain's line from the start of the stage it runs where nothing on the line needs the person, from what the line waits on where it waits, and gives no age between two stages where the chain alone says that it works", () => {
    // The round started 30 minutes ago, and the pane took its state at another time.
    for (const pane of [finished, working, undefined]) expect(lineSince(RUNNING, pane)).toBe(NOW - 30 * MINUTE);
    expect(stateWithAge(inboxLine(RUNNING, [finished], KINDS).state, lineSince(RUNNING, finished), NOW)).toBe("Working, 30 min");
    expect(lineSince(RUNNING, waiting)).toBe(NOW - 3 * MINUTE);
    expect(lineSince({ ...RUNNING, questions: [QUESTION] }, finished)).toBe(NOW - 12 * MINUTE);
    // Between two stages the newest one has ended.
    const between: WorkItem = { ...LOGIN, chain: chain("running", { stages: [ROUND] }) };
    expect(lineSince(between, finished)).toBeNull();
    expect(lineSince(between, undefined)).toBeNull();
    expect(lineSince(between, working)).toBe(NOW - 40 * MINUTE);
    expect(lineSince(between, waiting)).toBe(NOW - 3 * MINUTE);
    for (const workItem of [RESTED, PARKED]) expect(lineSince(workItem, finished)).toBe(NOW - 50 * MINUTE);
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
    for (const rests of [RUNNING, RESTED, PARKED, LOGIN]) {
      expect(chainNotifications([STOPPED], [rests], undefined)).toEqual([]);
      expect(chainNotifications([LOGIN], [rests], undefined)).toEqual([]);
    }
  });

  it("says at the view's foot the sentence of the chain the daemon sent, in whichever state it stands, and nothing where no chain ran for the work item", () => {
    expect(chainSays(LOGIN)).toBe("");
    expect(chainSays(STOPPED)).toBe(STOPPED_SAYS);
    expect(chainSays(RESTED)).toBe("The inspector cleared 1a2b3c4, after round 1.");
    expect(chainSays(PARKED)).toBe("The work item waits for the answers to its questions.");
    expect(chainSays(RUNNING)).toBe("Review round 1 is running.");
  });

  it("says at the view's foot that a running chain waits for the machine while the session of the stage it begins is queued, with how many go before it, and keeps the stage's sentence while only a session of the work item that no stage of its chain names waits (scenario 4)", () => {
    const queue = (ids: number[]): Machine => ({ ...MACHINE, agents: { ...MACHINE.agents, queue: ids } });
    // The running chain's stage is session 3.
    expect(stageAhead(RUNNING, queue([9, 3]))).toBe(1);
    expect(chainSays(RUNNING, stageAhead(RUNNING, queue([9, 3])))).toBe("Waiting for the machine (1 ahead)");
    expect(chainSays(RUNNING, stageAhead(RUNNING, queue([3])))).toBe("Waiting for the machine");
    // The stage works, and a session of the work item that no stage of its chain names waits: the foot keeps the stage's sentence.
    expect(stageAhead(RUNNING, queue([9]))).toBeNull();
    expect(chainSays(RUNNING, stageAhead(RUNNING, queue([9])))).toBe("Review round 1 is running.");
    expect(stageAhead(RUNNING, null)).toBeNull();
    // A chain that does not run waits for nothing, whatever its last stage's session is.
    expect(stageAhead(PARKED, queue([3]))).toBeNull();
    // A chain that stopped says why, whatever of the work item still waits.
    expect(chainSays(STOPPED, 1)).toBe(STOPPED_SAYS);
  });

  it("says in the line's second row that a session of the work item waits for the machine, with how many go before it, after a question and a stopped chain's sentence and before the stage and every other text, and the branch while a search is typed (scenario 4)", () => {
    expect(lineText(RUNNING, finished, false, 2)).toEqual({ says: "machine", text: "Waiting for the machine (2 ahead)" });
    expect(lineText(LOGIN, waiting, false, 0)).toEqual({ says: "machine", text: "Waiting for the machine" });
    expect(lineText(LOGIN, undefined, false, 1)).toEqual({ says: "machine", text: "Waiting for the machine (1 ahead)" });
    expect(lineText({ ...RUNNING, questions: [QUESTION] }, finished, false, 2)).toEqual({ says: "question", text: "Which base does the branch start from?" });
    expect(lineText(STOPPED, finished, false, 2)).toEqual({ says: "chain", text: STOPPED_SAYS });
    expect(lineText(RUNNING, finished, true, 2)).toEqual({ says: "branch", text: "owlery/fix-the-login-bug" });
    // The line's state is the one it had: the chain runs, so the line works.
    expect(inboxLine(RUNNING, [finished], KINDS).state).toBe("working");
  });

  it('draws a work item of a daemon of an earlier build, which sends no chain, as one no chain ran for, in its line and at its view\'s foot', () => {
    for (const sessions of [[], [finished], [working], [waiting]]) expect(inboxLine(EARLIER, sessions, KINDS)).toEqual(inboxLine(LOGIN, sessions, KINDS));
    expect(lineText(EARLIER, finished, false)).toEqual(lineText(LOGIN, finished, false));
    expect(lineSince(EARLIER, finished)).toBe(NOW - 50 * MINUTE);
    expect(chainNotifications([EARLIER], [EARLIER], undefined)).toEqual([]);
    expect(chainNotifications([EARLIER], [STOPPED], undefined)).toHaveLength(1);
    expect(chainSays(EARLIER)).toBe("");
  });
});

describe("the inspection a work item's head holds", () => {
  const COMMIT = "3f2a9c1d0e5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c";
  const HOLDS: Inspection = { state: "cleared", commit: COMMIT, why: null };
  const LAPSED: Inspection = { state: "lapsed", commit: COMMIT, why: "`src/app.ts` changed after the cleared commit `3f2a9c1`." };
  const CLEARED: WorkItem = { ...LOGIN, inspection: HOLDS };
  const LAPSED_ITEM: WorkItem = { ...LOGIN, inspection: LAPSED };

  it("gives the inspection's place its state and its words: none and No inspection yet where the head holds no inspection, where the daemon read none and for a daemon of an earlier build, the cleared commit in short where the inspection holds, and the same commit after Inspection lapsed where a later commit lapsed it", () => {
    expect(inspectionShown(null)).toEqual({ state: "none", words: "No inspection yet", why: "" });
    expect(inspectionShown(undefined)).toEqual({ state: "none", words: "No inspection yet", why: "" });
    expect(inspectionShown(HOLDS)).toEqual({ state: "cleared", words: "Cleared at 3f2a9c1", why: "" });
    expect(inspectionShown(LAPSED)).toEqual({ state: "lapsed", words: "Inspection lapsed, cleared at 3f2a9c1", why: "`src/app.ts` changed after the cleared commit `3f2a9c1`." });
    // A commit the repository does not hold is shown as the block writes it, cut to seven characters as any other.
    expect(inspectionShown({ ...LAPSED, commit: "abc" }).words).toBe("Inspection lapsed, cleared at abc");
    // The sentence under the head of the view's foot is a lapsed inspection's alone, and a lapsed inspection the daemon sent no sentence for says none.
    expect(inspectionShown({ ...HOLDS, why: "`src/app.ts` changed after the cleared commit `3f2a9c1`." }).why).toBe("");
    expect(inspectionShown({ ...LAPSED, why: null }).why).toBe("");
  });

  it("makes the line of a work item whose inspection is lapsed wait, saying Inspection lapsed in its second row with no age, where nothing says more, and leaves the line to a park, a running or stopped chain and a pane that works or waits", () => {
    expect(inboxLine(LAPSED_ITEM, [], KINDS).state).toBe("waiting");
    expect(lineText(LAPSED_ITEM, undefined, false)).toEqual({ says: "inspection", text: "Inspection lapsed" });
    // A finished pane and a chain that rests say no more than the inspection, and the daemon stores no time the inspection lapsed at, so the line says no age.
    const finished = session(2, { state: "finished", stateSince: 40, stateText: "The form is done." });
    const rests = { ...LAPSED_ITEM, chain: { state: "rested", says: "Pull request #12 is open.", since: 5, stages: [] } satisfies Chain };
    expect(inboxLine(rests, [finished], KINDS).state).toBe("waiting");
    expect(lineText(rests, finished, false)).toEqual({ says: "inspection", text: "Inspection lapsed" });
    expect(lineSince(rests, finished)).toBeNull();
    expect(lineSince(LAPSED_ITEM, undefined)).toBeNull();
    const entries = workItemEntries([LAPSED_ITEM, SEARCH], [], KINDS);
    expect(inboxGroups(entries).map((group) => [group.heading, group.entries.map((entry) => entry.workItem.id)])).toEqual([["Needs you", [1]], ["Asleep", [2]]]);
    // What says more than the inspection keeps the line.
    const working = session(2, { state: "working", stateSince: 50, stateText: "Running the tests" });
    const waiting = session(2, { state: "waiting", stateSince: 60, stateText: "May I run the tests?" });
    expect([inboxLine(LAPSED_ITEM, [working], KINDS).state, lineText(LAPSED_ITEM, working, false), lineSince(LAPSED_ITEM, working)]).toEqual(["working", { says: "state", text: "Running the tests" }, 50]);
    expect([inboxLine(LAPSED_ITEM, [waiting], KINDS).state, lineText(LAPSED_ITEM, waiting, false), lineSince(LAPSED_ITEM, waiting)]).toEqual(["waiting", { says: "state", text: "May I run the tests?" }, 60]);
    const stage: ChainStage = { kind: "round", round: 2, state: "working", failure: null, startedAt: 70, endedAt: null, headlessId: 3, refusals: 0, gate: null };
    const running = { ...LAPSED_ITEM, chain: { state: "running", says: "Review round 2 is running.", since: 70, stages: [stage] } satisfies Chain };
    expect([inboxLine(running, [], KINDS).state, lineText(running, undefined, false), lineSince(running, undefined)]).toEqual(["working", { says: "stage", text: "Proofer, round 2" }, 70]);
    const stopped = { ...LAPSED_ITEM, chain: { state: "stopped", says: "Review round 2 failed: the session ended.", since: 80, stages: [{ ...stage, state: "failed" }] } satisfies Chain };
    expect([inboxLine(stopped, [], KINDS).state, lineText(stopped, undefined, false), lineSince(stopped, undefined)]).toEqual(["waiting", { says: "chain", text: "Review round 2 failed: the session ended." }, 80]);
    const asked: Question = { id: 1, asks: "Which base?", grounds: "None names it.", by: "inspector", options: [], default: null, answer: null, since: 90 };
    expect([inboxLine({ ...LAPSED_ITEM, questions: [asked] }, [], KINDS).state, lineText({ ...LAPSED_ITEM, questions: [asked] }, undefined, false).says, lineSince({ ...LAPSED_ITEM, questions: [asked] }, undefined)]).toEqual(["waiting", "question", 90]);
    // A search shows the branch, as it does on every line.
    expect(lineText(LAPSED_ITEM, undefined, true)).toEqual({ says: "branch", text: LOGIN.branch });
  });

  it("finishes the line of a work item whose inspection holds and that holds no pull request, saying Cleared in its second row with no age, where nothing says more, and says nothing of an inspection the daemon read none of", () => {
    expect(inboxLine(CLEARED, [], KINDS).state).toBe("finished");
    expect(lineText(CLEARED, undefined, false)).toEqual({ says: "inspection", text: "Cleared" });
    const finished = session(2, { state: "finished", stateSince: 40, stateText: "The form is done." });
    expect([inboxLine(CLEARED, [finished], KINDS).state, lineText(CLEARED, finished, false), lineSince(CLEARED, finished)]).toEqual(["finished", { says: "inspection", text: "Cleared" }, null]);
    const working = session(2, { state: "working", stateSince: 50, stateText: "Running the tests" });
    expect([inboxLine(CLEARED, [working], KINDS).state, lineText(CLEARED, working, false)]).toEqual(["working", { says: "state", text: "Running the tests" }]);
    // No inspection, and a daemon of an earlier build, which sends none, leave the line as it was.
    const { inspection: _, ...earlier } = CLEARED;
    for (const workItem of [{ ...LOGIN, inspection: null }, earlier as WorkItem]) expect([inboxLine(workItem, [finished], KINDS).state, lineText(workItem, finished, false), lineSince(workItem, finished)]).toEqual(["finished", { says: "state", text: "The form is done." }, 40]);
  });

  it("notifies of an inspection that lapsed since the window's lists were held, cleared then and lapsed now, titled with the work item's title and saying Inspection lapsed, and of none that was lapsed already, had no inspection, is muted or whose view is in front", () => {
    const told = { workItemId: 1, title: "Fix the login bug", body: "Inspection lapsed" };
    expect(lapseNotifications([CLEARED, SEARCH], [LAPSED_ITEM, SEARCH], undefined)).toEqual([told]);
    expect(lapseNotifications([CLEARED, { ...SEARCH, inspection: HOLDS }], [LAPSED_ITEM, { ...SEARCH, inspection: LAPSED }], undefined)).toEqual([told, { workItemId: 2, title: "Speed up search", body: "Inspection lapsed" }]);
    expect(lapseNotifications([CLEARED, { ...SEARCH, inspection: HOLDS }], [LAPSED_ITEM, { ...SEARCH, inspection: LAPSED }], 2)).toEqual([told]);
    // Lapsed in both lists, and lapsed where the window held no inspection, as at its start.
    expect(lapseNotifications([LAPSED_ITEM], [LAPSED_ITEM], undefined)).toEqual([]);
    expect(lapseNotifications([{ ...LOGIN, inspection: null }], [LAPSED_ITEM], undefined)).toEqual([]);
    expect(lapseNotifications([LOGIN], [LAPSED_ITEM], undefined)).toEqual([]);
    expect(lapseNotifications([], [LAPSED_ITEM], undefined)).toEqual([]);
    expect(lapseNotifications([CLEARED], [{ ...LAPSED_ITEM, muted: true }], undefined)).toEqual([]);
    expect(lapseNotifications([CLEARED], [LAPSED_ITEM], 1)).toEqual([]);
    // An inspection that still holds, or that the head no longer holds at all, tells nothing.
    expect(lapseNotifications([CLEARED], [CLEARED], undefined)).toEqual([]);
    expect(lapseNotifications([CLEARED], [{ ...LOGIN, inspection: null }], undefined)).toEqual([]);
    expect(lapseNotifications([LAPSED_ITEM], [CLEARED], undefined)).toEqual([]);
  });
});

describe("the inspection sheet in a work item's view", () => {
  const COMMIT = "3f2a9c1d0e5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c";
  const HOLDS: Inspection = { state: "cleared", commit: COMMIT, why: null };
  const LAPSED: Inspection = { state: "lapsed", commit: COMMIT, why: "`src/app.ts` changed after the cleared commit `3f2a9c1`." };
  const ROUNDS: Recorded = { framed: false, rounds: 1, gate: null, verdict: null };
  const RESTS: Chain = { state: "rested", says: "The chain rests.", since: 5, stages: [] };
  const RECORDS: BackRecords = { head: COMMIT, record: null, lapsedBy: null, rounds: [], refusals: [], unreadRefusals: 0 };
  const ENTRY: LedgerEntry = { workItemId: 1, repo: "/r/project", branch: "owlery/fix-the-login-bug", stage: null, chain: null, startedAt: 0, endedAt: 60_000, state: "finished", stopped: null, usage: { costUsd: 0.12, converted: true, models: [] } };

  it("gives the strip the back's tab where the work item's inspection is an inspection, cleared or lapsed, where its records count a round, or where the daemon sent its chain, and none where its inspection is null or was not sent and nothing else holds", () => {
    expect(hasBack({ ...LOGIN, inspection: HOLDS })).toBe(true);
    expect(hasBack({ ...LOGIN, inspection: LAPSED })).toBe(true);
    expect(hasBack({ ...LOGIN, recorded: ROUNDS })).toBe(true);
    expect(hasBack({ ...LOGIN, chain: RESTS })).toBe(true);
    // A null inspection and one the daemon sent none of are read alike, and records that count no round hold no back.
    expect(hasBack(LOGIN)).toBe(false);
    expect(hasBack({ ...LOGIN, inspection: null })).toBe(false);
    expect(hasBack({ ...LOGIN, inspection: null, recorded: { ...ROUNDS, rounds: 0 } })).toBe(false);
  });

  it("opens a view entered with no pane to the back where the work item's inspection is an inspection, cleared or lapsed, and to a pane where one is given or where no inspection is held", () => {
    expect(opensToBack({ ...LOGIN, inspection: HOLDS }, undefined)).toBe(true);
    expect(opensToBack({ ...LOGIN, inspection: LAPSED }, undefined)).toBe(true);
    // A pane given, as from a session's notification, is the one in front.
    expect(opensToBack({ ...LOGIN, inspection: HOLDS }, 3)).toBe(false);
    // Rounds and a chain give the strip the back's tab, and the view still opens to a pane.
    expect(opensToBack({ ...LOGIN, inspection: null, recorded: ROUNDS, chain: RESTS }, undefined)).toBe(false);
    expect(opensToBack(LOGIN, undefined)).toBe(false);
    expect(opensToBack(undefined, undefined)).toBe(false);
  });

  it("asks for the back again where the work item's inspection, its records or its chain differ from the ones it asked at, an inspection read where none was sent among them, and not where another field differs", () => {
    const asked = backKey({ ...LOGIN, recorded: ROUNDS, chain: RESTS });
    expect(backKey({ ...LOGIN, recorded: ROUNDS, chain: RESTS, title: "Fix the login", newCommits: 4 })).toBe(asked);
    expect(backKey({ ...LOGIN, recorded: ROUNDS, chain: RESTS, inspection: null })).not.toBe(asked);
    expect(backKey({ ...LOGIN, recorded: ROUNDS, chain: RESTS, inspection: HOLDS })).not.toBe(backKey({ ...LOGIN, recorded: ROUNDS, chain: RESTS, inspection: LAPSED }));
    expect(backKey({ ...LOGIN, recorded: { ...ROUNDS, rounds: 2 }, chain: RESTS })).not.toBe(asked);
    expect(backKey({ ...LOGIN, recorded: ROUNDS, chain: { ...RESTS, state: "running" } })).not.toBe(asked);
  });

  it("parts a text of the back into its words and its code, the words between two backticks being code, and leaves a backtick with no partner as it stands", () => {
    expect(codeParts("Fixed in `86cb04d`")).toEqual([
      { text: "Fixed in ", code: false },
      { text: "86cb04d", code: true },
    ]);
    expect(codeParts("`a.ts:3` and `b.ts`.")).toEqual([
      { text: "a.ts:3", code: true },
      { text: " and ", code: false },
      { text: "b.ts", code: true },
      { text: ".", code: false },
    ]);
    expect(codeParts("Open")).toEqual([{ text: "Open", code: false }]);
    expect(codeParts("a ` b")).toEqual([{ text: "a ` b", code: false }]);
    expect(codeParts("")).toEqual([]);
  });

  it("shows Reading the records. in the back's place until the records and the ledger have both answered, the refusal where either was refused, and the back composed from both", () => {
    expect(backShown({ records: null, ledger: null, refusal: null })).toBe("Reading the records.");
    expect(backShown({ records: RECORDS, ledger: null, refusal: null })).toBe("Reading the records.");
    expect(backShown({ records: null, ledger: { entries: [ENTRY], unread: 0 }, refusal: null })).toBe("Reading the records.");
    expect(backShown({ records: RECORDS, ledger: null, refusal: "no work item 1" })).toBe("no work item 1");
    expect(backShown({ records: RECORDS, ledger: { entries: [ENTRY], unread: 2 }, refusal: null })).toEqual(composeBack(RECORDS, [ENTRY], 2));
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
    expect(renameChoice({ branch: "owlery/second-name", blocked: null }, true)).toEqual({ enabled: true, makes: false, says: "The branch becomes owlery/second-name." });
  });

  it("disables the choice and says why, where the plan says the branch keeps its name, and where the daemon refused the plan", () => {
    expect(renameChoice({ branch: "owlery/first-name", blocked: "The branch is already owlery/first-name." }, true)).toEqual({ enabled: false, makes: false, says: "The branch is already owlery/first-name." });
    expect(renameChoice({ branch: null, blocked: "The name leaves no letter or digit to name a branch by." }, true)).toEqual({ enabled: false, makes: false, says: "The name leaves no letter or digit to name a branch by." });
    expect(renameChoice({ error: "no work item 9" }, true)).toEqual({ enabled: false, makes: false, says: "no work item 9" });
  });

  it("says for a work item with no branch yet that the rename makes the branch, with the choice taken and not to be taken back, and says why where none can be made now", () => {
    expect(renameChoice({ branch: "owlery/fix-the-login-bug", blocked: null }, false)).toEqual({ enabled: false, makes: true, says: "The rename makes the branch owlery/fix-the-login-bug." });
    expect(renameChoice({ branch: "owlery/fix-the-login-bug", blocked: "The branch cannot be made while a merge is under way in the worktree." }, false)).toEqual({ enabled: false, makes: false, says: "The branch cannot be made while a merge is under way in the worktree." });
    expect(renameChoice({ error: "no work item 9" }, false)).toEqual({ enabled: false, makes: false, says: "no work item 9" });
  });

  it("disables the choice and says nothing until the daemon has answered", () => {
    expect(renameChoice(null, true)).toEqual({ enabled: false, makes: false, says: "" });
    expect(renameChoice(null, false)).toEqual({ enabled: false, makes: false, says: "" });
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
        inspectionSince: null,
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

  it("reads a look that keeps no inspection as holding the inspection the work item holds now, so an inspection changes no line of the summary, and shows the present line with its inspection", () => {
    const lapsed: Inspection = { state: "lapsed", commit: "3f2a9c1d0e5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c", why: "`src/app.ts` changed after the cleared commit `3f2a9c1`." };
    const holds: Inspection = { state: "cleared", commit: lapsed.commit, why: null };
    for (const inspection of [lapsed, holds]) expect(changesSince(look([LOGIN]), [{ ...LOGIN, inspection }], [], KINDS), inspection.state).toEqual([]);
    // A change the look shows for another reason carries the line the inspection gives now.
    const changes = changesSince(look([{ ...LOGIN, newCommits: 0 }]), [{ ...LOGIN, newCommits: 1, inspection: lapsed }], [], KINDS);
    expect(changes.map((change) => [change.line.state, change.sentence])).toEqual([["waiting", "Needs you. 1 new commit since you were last here."]]);
  });

  it("puts the changes in the order a person acts on them, the ones with no state last, and keeps the given order inside a state", () => {
    const third: WorkItem = { ...LOGIN, id: 3, title: "Third" };
    const fourth: WorkItem = { ...LOGIN, id: 4, title: "Fourth" };
    const sessions = [session(5, { workItemId: 2, state: "finished" }), session(6, { workItemId: 3, state: "waiting" }), session(7, { workItemId: 4, state: "waiting" })];
    const changes = changesSince(look([]), [LOGIN, SEARCH, third, fourth], sessions, KINDS);
    expect(changes.map((change) => change.workItem.id)).toEqual([3, 4, 2, 1]);
  });

  describe("the inspection since the look", () => {
    const COMMIT = "3f2a9c1d0e5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c";
    const OTHER = "9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d";
    const WHY = "`src/app.ts` changed after the cleared commit `3f2a9c1`.";
    const clearedAt = (commit: string): Inspection => ({ state: "cleared", commit, why: null });
    const lapsedAt = (commit: string): Inspection => ({ state: "lapsed", commit, why: WHY });
    const TWO_ROUNDS: Recorded = { framed: true, rounds: 2, gate: COMMIT, verdict: { is: "cleared", commit: COMMIT, says: null } };
    const MERGED: PullRequest = { number: 12, url: "https://github.com/o/r/pull/12", state: "merged", head: COMMIT, pushed: COMMIT, checks: "passed", list: [], listCount: 0, readAt: 10, failure: null };

    it("gives a work item whose inspection was given since the look as the one change, its sentence opening with the cleared commit in short and how many review rounds came before it, of one and of several, with the commit alone where the daemon sent no count or the count is 0, and what follows as before", () => {
      const before = look([{ ...LOGIN, inspection: null, newCommits: 1 }]);
      const cleared = (fields: Partial<WorkItem>) => changesSince(before, [{ ...LOGIN, inspection: clearedAt(COMMIT), newCommits: 1, ...fields }], [], KINDS);
      expect(cleared({ recorded: TWO_ROUNDS }).map((change) => [change.workItem.id, change.inspectionSince, change.sentence])).toEqual([[1, "cleared", "Cleared at 3f2a9c1 after 2 review rounds."]]);
      expect(cleared({ recorded: { ...TWO_ROUNDS, rounds: 1 } })[0]?.sentence).toBe("Cleared at 3f2a9c1 after 1 review round.");
      expect(cleared({})[0]?.sentence).toBe("Cleared at 3f2a9c1.");
      expect(cleared({ recorded: { ...TWO_ROUNDS, rounds: 0 } })[0]?.sentence).toBe("Cleared at 3f2a9c1.");
      // The new commits and the decisions follow the inspection's words as they follow a state's.
      expect(cleared({ recorded: TWO_ROUNDS, newCommits: 3 })[0]?.sentence).toBe("Cleared at 3f2a9c1 after 2 review rounds. 2 new commits since you were last here.");
    });

    it("gives a work item whose inspection lapsed since the look as the one change, its sentence opening with Inspection lapsed and then the inspection's own sentence as the daemon sent it, and with Inspection lapsed alone where it sent none", () => {
      const before = look([{ ...LOGIN, inspection: clearedAt(COMMIT) }]);
      const changes = changesSince(before, [{ ...LOGIN, inspection: lapsedAt(COMMIT) }], [], KINDS);
      expect(changes.map((change) => [change.workItem.id, change.inspectionSince, change.sentence])).toEqual([[1, "lapsed", "Inspection lapsed. `src/app.ts` changed after the cleared commit `3f2a9c1`."]]);
      expect(changesSince(before, [{ ...LOGIN, inspection: { ...lapsedAt(COMMIT), why: null } }], [], KINDS)[0]?.sentence).toBe("Inspection lapsed.");
    });

    it("answers each pair of the look's inspection and the present one by the table: given where the present inspection holds and the look did not hold it at that commit, lapsed where it is lapsed and the look did not hold it lapsed at that commit, and nothing of the inspection otherwise, a work item the look does not hold counting its inspection as since the look, and a lapsed inspection under a merged pull request saying nothing", () => {
      const rows: [Inspection | null, Inspection | null, InspectionSince | null][] = [
        [null, clearedAt(COMMIT), "cleared"],
        [null, lapsedAt(COMMIT), "lapsed"],
        [null, null, null],
        [clearedAt(COMMIT), clearedAt(COMMIT), null],
        [clearedAt(COMMIT), lapsedAt(COMMIT), "lapsed"],
        [clearedAt(COMMIT), null, null],
        [clearedAt(OTHER), clearedAt(COMMIT), "cleared"],
        [clearedAt(OTHER), lapsedAt(COMMIT), "lapsed"],
        [clearedAt(OTHER), null, null],
        [lapsedAt(COMMIT), clearedAt(COMMIT), "cleared"],
        [lapsedAt(COMMIT), lapsedAt(COMMIT), null],
        [lapsedAt(COMMIT), null, null],
        [lapsedAt(OTHER), clearedAt(COMMIT), "cleared"],
        [lapsedAt(OTHER), lapsedAt(COMMIT), "lapsed"],
        [lapsedAt(OTHER), null, null],
      ];
      for (const [then, now, answer] of rows) {
        const row = `${then ? `${then.state} at ${then.commit.slice(0, 1)}` : "null"} to ${now ? `${now.state} at ${now.commit.slice(0, 1)}` : "null"}`;
        expect(changesSince(look([{ ...LOGIN, inspection: then }]), [{ ...LOGIN, inspection: now }], [], KINDS)[0]?.inspectionSince ?? null, row).toBe(answer);
        expect(inspectionSinceLook({ ...LOGIN, inspection: then }, { ...LOGIN, inspection: now }), row).toBe(answer);
      }
      // A work item the look does not hold.
      expect(inspectionSinceLook(undefined, { ...LOGIN, inspection: clearedAt(COMMIT) })).toBe("cleared");
      expect(inspectionSinceLook(undefined, { ...LOGIN, inspection: lapsedAt(COMMIT) })).toBe("lapsed");
      expect(inspectionSinceLook(undefined, { ...LOGIN, inspection: null })).toBeNull();
      const fresh = changesSince(look([]), [{ ...LOGIN, inspection: clearedAt(COMMIT), recorded: TWO_ROUNDS }], [], KINDS);
      expect(fresh.map((change) => [change.inspectionSince, change.sentence])).toEqual([["cleared", "Cleared at 3f2a9c1 after 2 review rounds. New since you were last here."]]);
      // A merged pull request says more than a lapsed inspection on the line, and so in the summary.
      expect(inspectionSinceLook({ ...LOGIN, inspection: clearedAt(COMMIT), pullRequest: MERGED }, { ...LOGIN, inspection: lapsedAt(COMMIT), pullRequest: MERGED })).toBeNull();
      const merged = changesSince(look([{ ...LOGIN, inspection: clearedAt(COMMIT), pullRequest: MERGED, newCommits: 0 }]), [{ ...LOGIN, inspection: lapsedAt(COMMIT), pullRequest: MERGED, newCommits: 1 }], [], KINDS);
      expect(merged.map((change) => [change.inspectionSince, change.sentence])).toEqual([[null, "Finished. 1 new commit since you were last here."]]);
    });

    it("reads a side that carries no inspection with the other side's inspection, so a daemon that has read no branch yet and a look written before the look kept the inspection change nothing of the inspection, and a pane that moved still changes the work item, with no word of the inspection", () => {
      const cleared = { ...LOGIN, inspection: clearedAt(COMMIT) };
      expect(changesSince(look([cleared]), [LOGIN], [], KINDS)).toEqual([]);
      expect(changesSince(look([LOGIN]), [cleared], [], KINDS)).toEqual([]);
      expect(inspectionSinceLook(cleared, LOGIN)).toBeNull();
      expect(inspectionSinceLook(LOGIN, cleared)).toBeNull();
      for (const [then, now] of [
        [cleared, LOGIN],
        [LOGIN, cleared],
      ] as const) {
        const changes = changesSince(look([then], [session(3, { state: "working" })]), [now], [session(3, { state: "finished" })], KINDS);
        expect(changes.map((change) => [change.inspectionSince, change.sentence])).toEqual([[null, "Finished."]]);
      }
    });

    it("puts the work items whose inspection was given first and the ones whose inspection lapsed next, each in the daemon's order, then the others in the order of the inbox's groups, and counts each once, the inspections first", () => {
      const ids = (id: number, title: string, inspection: Inspection | null): WorkItem => ({ ...LOGIN, id, title, inspection });
      const before = look([ids(1, "Waits", null), ids(2, "Works", null), ids(3, "Lapses", clearedAt(COMMIT)), ids(4, "Given", null), ids(5, "Given first", null)]);
      const now = [ids(1, "Waits", null), ids(2, "Works", null), ids(5, "Given first", clearedAt(COMMIT)), ids(3, "Lapses", lapsedAt(COMMIT)), ids(4, "Given", clearedAt(OTHER))];
      const changes = changesSince(before, now, [session(6, { workItemId: 1, state: "waiting" }), session(7, { workItemId: 2, state: "working" })], KINDS);
      expect(changes.map((change) => [change.workItem.id, change.inspectionSince])).toEqual([
        [5, "cleared"],
        [4, "cleared"],
        [3, "lapsed"],
        [1, null],
        [2, null],
      ]);
      expect(summarySentence(changes)).toBe("2 cleared, 1 inspection lapsed, 1 needs you, 1 working");
    });
  });

  describe("the decisions made without asking since the look", () => {
    function decision(id: number, fields: Partial<Decision> = {}): Decision {
      return { id, kind: "default", says: "Start from main.", grounds: "frame/questions.md Q1 states main as its default.", by: null, state: "decided", reversal: null, landed: null, since: 2000, ...fields };
    }
    const ASKED: Question = { id: 1, asks: "Which base does the branch start from?", grounds: "No document names it.", by: "inspector", options: [], default: null, answer: null, since: 3000 };
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

describe("the changed set of a load", () => {
  const COMMIT = "3f2a9c1d0e5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c";
  const CLEARED: Inspection = { state: "cleared", commit: COMMIT, why: null };
  const LAPSED: Inspection = { state: "lapsed", commit: COMMIT, why: "`src/app.ts` changed after the cleared commit `3f2a9c1`." };
  function look(workItems: WorkItem[], sessions: SessionInfo[] = []): Look {
    return { at: 1000, sessions, workItems };
  }

  it("keeps the work items the load changed, and works out what each says from the present lists: an inspection that lapsed since the load says so and counts as a lapsed inspection, one nothing of which differs from the look any more says its state alone, one the lists no longer hold has no line, and a work item outside the set has none", () => {
    const before = look([{ ...LOGIN, inspection: null }, { ...SEARCH, inspection: null }]);
    const set = changedSet(before, [{ ...LOGIN, inspection: CLEARED }, { ...SEARCH, inspection: null }], [session(4, { workItemId: 2, state: "working" })], KINDS);
    expect(set.ids).toEqual([1, 2]);
    const later = [{ ...LOGIN, inspection: LAPSED }, { ...SEARCH, inspection: null }];
    const changes = changesOf(before, set.ids, later, [], KINDS);
    expect(changes.map((change) => [change.workItem.id, change.inspectionSince, change.sentence])).toEqual([
      [1, "lapsed", "Inspection lapsed. `src/app.ts` changed after the cleared commit `3f2a9c1`."],
      [2, null, "No agent is running."],
    ]);
    expect(summarySentence(changes)).toBe("1 inspection lapsed");
    expect(changesOf(before, set.ids, [later[0] as WorkItem], [], KINDS).map((change) => change.workItem.id)).toEqual([1]);
    const third: WorkItem = { ...LOGIN, id: 3, title: "Third", inspection: null };
    const withThird = changesOf(look([...before.workItems, third]), set.ids, [...later, third], [session(5, { workItemId: 3, state: "waiting" })], KINDS);
    expect(withThird.map((change) => change.workItem.id)).toEqual([1, 2]);
  });

  it("names the work items the load carried without an inspection reading, and lets one join the set once, at the first lists that carry its reading, where its inspection was given or lapsed since the look, and no other", () => {
    const before = look([{ ...LOGIN, inspection: null }, { ...SEARCH, inspection: null }]);
    const load = [LOGIN, { ...SEARCH, inspection: null }];
    const set = changedSet(before, load, [], KINDS);
    expect(set).toEqual({ ids: [], unread: [1] });
    // Lists that still carry no reading leave the set as it was.
    expect(changedSetAfter(before, set, load)).toEqual(set);
    const cleared = [{ ...LOGIN, inspection: CLEARED }, { ...SEARCH, inspection: CLEARED }];
    const joined = changedSetAfter(before, set, cleared);
    expect(joined).toEqual({ ids: [1], unread: [] });
    expect(changesOf(before, joined.ids, cleared, [], KINDS).map((change) => [change.workItem.id, change.inspectionSince, change.sentence])).toEqual([[1, "cleared", "Cleared at 3f2a9c1."]]);
    expect(changedSetAfter(before, set, [{ ...LOGIN, inspection: LAPSED }, { ...SEARCH, inspection: null }])).toEqual({ ids: [1], unread: [] });
    // Read with no inspection, it joins nothing, then or at an inspection given later.
    const read = changedSetAfter(before, set, [{ ...LOGIN, inspection: null }, { ...SEARCH, inspection: null }]);
    expect(read).toEqual({ ids: [], unread: [] });
    expect(changedSetAfter(before, read, cleared)).toEqual({ ids: [], unread: [] });
    // A look written before the look kept the inspection has no reading to measure against.
    expect(changedSetAfter(look([LOGIN, SEARCH]), set, cleared)).toEqual({ ids: [], unread: [] });
    // A work item new since the look is in the set already, and is named in it once.
    const fresh = changedSet(look([]), [LOGIN], [], KINDS);
    expect(fresh).toEqual({ ids: [1], unread: [1] });
    expect(changedSetAfter(look([]), fresh, [{ ...LOGIN, inspection: CLEARED }])).toEqual({ ids: [1], unread: [] });
  });
});

describe("summarySentence", () => {
  function change(state: InboxLine["state"], decided = 0, inspectionSince: InspectionSince | null = null): { line: InboxLine; decided: number; inspectionSince: InspectionSince | null } {
    return { line: { title: "Fix the login bug", branch: "owlery/fix-the-login-bug", state, commits: "" }, decided, inspectionSince };
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

  it("counts the work items whose inspection was given as cleared and the ones whose inspection lapsed as lapsed inspections, before the states, each work item once, of one and of several", () => {
    expect(summarySentence([change("waiting", 0, "lapsed")])).toBe("1 inspection lapsed");
    expect(summarySentence([change("waiting", 0, "lapsed"), change("waiting", 0, "lapsed")])).toBe("2 inspections lapsed");
    expect(summarySentence([change("finished", 0, "cleared"), change("waiting", 0, "cleared"), change("waiting")])).toBe("2 cleared, 1 needs you");
    expect(summarySentence([change("finished", 3, "cleared")])).toBe("1 cleared. 3 decisions made without asking.");
    // A work item with no state beside an inspection is left out of the count, as beside a state.
    expect(summarySentence([change(null, 0, "cleared"), change(null)])).toBe("1 cleared");
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
    expect(stageOf([session(2), session(4), session(6)], [4, 6], false, 4)).toEqual({ front: 4, shown: [4] });
    // Pane 9 was in front and is closed, so the live pane of the view with the highest id follows it, whichever were in front before.
    expect(stageOf(six, [9, 2, 1, 3, 4], false, 4)).toEqual({ front: 6, shown: [6] });
    expect(stageOf([], [4], false, 4)).toEqual({ front: undefined, shown: [] });
    expect(stageOf([], [4], true, 4)).toEqual({ front: undefined, shown: [] });
  });

  it("puts every pane of a view of up to as many tabs as the cap, here four, on the stage where \"Side by side\" is pressed, in the tabs' order, the one last in front having the keyboard", () => {
    expect(stageOf([session(2), session(4)], [4, 2], true, 4)).toEqual({ front: 4, shown: [2, 4] });
    expect(stageOf([session(2), session(4), session(6)], [4], true, 4)).toEqual({ front: 4, shown: [2, 4, 6] });
    expect(stageOf([session(2), session(4), session(6), session(7)], [6, 2, 7, 4], true, 4)).toEqual({ front: 6, shown: [2, 4, 6, 7] });
    expect(stageOf([session(2)], [2], true, 4)).toEqual({ front: 2, shown: [2] });
  });

  it("puts the pane in front and then the panes of the stage order, up to the cap, here four, on the stage of a view with more tabs, in the tabs' order, so a pressed tab that was not shown takes the place of the shown pane last in the stage order", () => {
    // Panes 3, 5, 2 and 6 are on the stage, and the tab of pane 1 is pressed.
    expect(stageOf(six, [1, 3, 5, 2, 6], true, 4)).toEqual({ front: 1, shown: [1, 2, 3, 5] });
  });

  it("fills the stage with the tabs that were never in front, the highest id first, after the ones that were", () => {
    // After a load no pane was in front, so the live pane with the highest id is.
    expect(stageOf(six, [], true, 4)).toEqual({ front: 6, shown: [3, 4, 5, 6] });
    expect(stageOf(six, [2], true, 4)).toEqual({ front: 2, shown: [2, 4, 5, 6] });
    // No pane was in front and the four tabs with the highest ids have exited, so the live pane is in front and on the stage.
    const oneLive = [session(1), session(2, { alive: false }), session(3, { alive: false }), session(4, { alive: false }), session(5, { alive: false })];
    expect(stageOf(oneLive, [], true, 4)).toEqual({ front: 1, shown: [1, 3, 4, 5] });
  });

  it("gives a pane no longer among the tabs no place on the stage, so where the pane in front closed the first panes of the stage order, as many as the cap, here four, stand on the stage, tabs never in front among them where fewer than the cap of the tabs were in front, and the live one of the four with the highest id has the keyboard, or the one of them with the highest id where none runs, and counts a pane named twice once", () => {
    expect(stageOf(six, [9, 2, 9, 2, 1, 3, 4], true, 4)).toEqual({ front: 4, shown: [1, 2, 3, 4] });
    // Pane 4 has exited, so pane 3, the live one of the four with the highest id, has the keyboard, and not pane 2, the last in front before pane 9.
    const exited = [session(1), session(2), session(3), session(4, { alive: false }), session(5), session(6)];
    expect(stageOf(exited, [9, 2, 1, 3, 4], true, 4)).toEqual({ front: 3, shown: [1, 2, 3, 4] });
    // Panes 1 to 4 have exited, so pane 4, the highest id of the four, has the keyboard, and not pane 1, the last in front before pane 9, nor panes 5 and 6, which run off the stage.
    const fourExited = [session(1, { alive: false }), session(2, { alive: false }), session(3, { alive: false }), session(4, { alive: false }), session(5), session(6)];
    expect(stageOf(fourExited, [9, 1, 2, 3, 4], true, 4)).toEqual({ front: 4, shown: [1, 2, 3, 4] });
    // Only pane 6 was in front besides pane 2, which closed, so pane 3, never in front and not on the stage before, takes pane 2's place, and where pane 6 has exited pane 5, never in front, has the keyboard.
    const twoInFront = [session(1), session(3), session(4), session(5), session(6)];
    expect(stageOf(twoInFront, [2, 6], true, 4)).toEqual({ front: 6, shown: [3, 4, 5, 6] });
    expect(stageOf([session(1), session(3), session(4), session(5), session(6, { alive: false })], [2, 6], true, 4)).toEqual({ front: 5, shown: [3, 4, 5, 6] });
  });

  it("puts as many panes on the stage as the cap on panes side by side gives, and leaves the other panes tabs (scenario 14)", () => {
    expect(stageOf(six, [], true, 6)).toEqual({ front: 6, shown: [1, 2, 3, 4, 5, 6] });
    expect(stageOf(six, [], true, 2)).toEqual({ front: 6, shown: [5, 6] });
    expect(stageOf(six, [2, 1], true, 2)).toEqual({ front: 2, shown: [1, 2] });
    // A cap of 1 shows the pane in front alone, as where "Side by side" is not pressed.
    expect(stageOf(six, [2, 1], true, 1)).toEqual({ front: 2, shown: [2] });
    // Pane 9, in front, closed: the pane in front is the live one with the highest id of the first two of the stage order.
    expect(stageOf(six, [9, 2, 1, 3, 4], true, 2)).toEqual({ front: 2, shown: [1, 2] });
  });
});

describe("stageGrid", () => {
  it("lays out 2 to 4 tiles in two columns, 5 to 9 in three and 10 to 16 in four, row by row, the last tile spanning what is left of its row (scenario 14)", () => {
    const placed = (count: number) => stageGrid(count).tiles.map(({ row, column, span }) => `${String(row)}.${String(column)}${span > 1 ? `+${String(span)}` : ""}`);
    expect(stageGrid(1)).toEqual({ columns: 1, tiles: [{ row: 1, column: 1, span: 1 }] });
    expect(stageGrid(0)).toEqual({ columns: 1, tiles: [] });
    expect(stageGrid(2).columns).toBe(2);
    expect(placed(2)).toEqual(["1.1", "1.2"]);
    expect(placed(3)).toEqual(["1.1", "1.2", "2.1+2"]);
    expect(placed(4)).toEqual(["1.1", "1.2", "2.1", "2.2"]);
    expect(stageGrid(5).columns).toBe(3);
    expect(placed(5)).toEqual(["1.1", "1.2", "1.3", "2.1", "2.2+2"]);
    expect(placed(6)).toEqual(["1.1", "1.2", "1.3", "2.1", "2.2", "2.3"]);
    expect(placed(7).at(-1)).toBe("3.1+3");
    expect(stageGrid(9).columns).toBe(3);
    expect(stageGrid(10).columns).toBe(4);
    expect(placed(10).slice(-2)).toEqual(["3.1", "3.2+3"]);
    expect(stageGrid(16).columns).toBe(4);
    expect(placed(16).at(-1)).toBe("4.4");
  });
});

describe("paneCap", () => {
  it("is the cap a person set on panes side by side, the proposal where none is set, and 4 where the daemon keeps no cap (scenario 10)", () => {
    expect(paneCap(MACHINE)).toBe(8);
    expect(paneCap({ ...MACHINE, panes: { proposed: 8, set: 12 } })).toBe(12);
    expect(paneCap(null)).toBe(4);
  });

  it("gives a pane's terminal the scrollback a person set, the default of 5,000 lines where none is set, and 1,000 where the daemon sends none (scenarios B1, B2 and B3)", () => {
    expect(paneScrollback(MACHINE)).toBe(5000);
    expect(paneScrollback({ ...MACHINE, scrollback: { proposed: 5000, set: 20_000 } })).toBe(20_000);
    expect(paneScrollback(EARLIER_MACHINE)).toBe(1000);
    expect(paneScrollback(null)).toBe(1000);
  });

  it("names the cap in the title of \"Side by side\"", () => {
    expect(sideBySideTitle(4)).toBe("Show up to 4 of this work item's panes at once");
    expect(sideBySideTitle(16)).toBe("Show up to 16 of this work item's panes at once");
    expect(sideBySideTitle(1)).toBe("Show one of this work item's panes at a time");
  });
});

describe("recentKept", () => {
  it("keeps a closed pane that was the most recent, so the live pane with the highest id comes in front and not the pane in front before it", () => {
    // Panes 1 and 3 run and pane 2 has exited. Pane 2 was in front, then pane 3, which is closed.
    const kept = recentKept([3, 2, 1], new Set([1, 2]));
    expect(kept).toEqual([3, 2, 1]);
    expect(stageOf([session(1), session(2, { alive: false })], kept, false, 4)).toEqual({ front: 1, shown: [1] });
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

  it("sends a pane that comes back onto the screen nothing a person types until the terminal has drawn its replay, and sends it what is typed after that", () => {
    const { turns, sent, types, draws } = screen();
    turns.take(4, true);
    // The terminal has reached pane 4's turn, and its replay has not come.
    draws();
    types("a");
    turns.write("replay of 4", false);
    draws();
    types("b");
    expect(sent).toEqual([[4, "b"]]);
  });

  it("keeps a pane that comes back silent where the replay the terminal draws was written in an earlier turn", () => {
    const { turns, sent, types, draws } = screen();
    turns.take(4, true);
    draws();
    turns.write("replay of 4", false);
    turns.giveBack();
    turns.take(5, true);
    // The replay of pane 4, the reset and pane 5's turn are drawn, and pane 5's replay has not come.
    draws();
    types("a");
    turns.write("replay of 5", false);
    draws();
    types("b");
    expect(sent).toEqual([[5, "b"]]);
  });

  it("leaves no silence behind a pane that came back and left before its replay came: the next pane, drawn for the first time, is sent keys as a first pane is", () => {
    const { turns, sent, types, draws } = screen();
    turns.take(4, true);
    draws();
    turns.giveBack();
    turns.take(5);
    draws();
    types("a");
    expect(sent).toEqual([[5, "a"]]);
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
    expect(workItemFields("  /r/project ", " Fix the login bug  ", "amber-heron", "origin/main", null)).toEqual({ repo: "/r/project", title: "Fix the login bug", name: "amber-heron", base: "origin/main" });
  });

  it("refuses an empty folder, so nothing is sent that the daemon would run in its own folder", () => {
    expect(workItemFields("   ", "Fix the login bug", "amber-heron", "main", "feature")).toEqual({ error: "Choose the repository folder." });
  });

  it("gives the fields of a creation for an empty name, which the daemon names by the generated name", () => {
    expect(workItemFields("/r/project", " ", "amber-heron", "main", null)).toEqual({ repo: "/r/project", title: "", name: "amber-heron", base: "main" });
  });

  it("gives no base where none is chosen, so the daemon starts the work item from the default base", () => {
    expect(workItemFields("/r/project", "", "amber-heron", null, null)).toEqual({ repo: "/r/project", title: "", name: "amber-heron" });
  });

  it("gives the branch picked to check out, and none where no branch is picked, so the daemon makes the worktree with no branch", () => {
    expect(workItemFields("/r/project", "", "amber-heron", "main", "feature")).toEqual({ repo: "/r/project", title: "", name: "amber-heron", base: "main", branch: "feature" });
    expect(workItemFields("/r/project", "", "amber-heron", "main", null)).toEqual({ repo: "/r/project", title: "", name: "amber-heron", base: "main" });
  });
});

// A plan's answer as the form holds it: a clone whose checkout stands on `feature`.
const PLAN: FormPlan = {
  repo: "/r/project",
  branch: "owlery/amber-heron",
  worktree: "/w/project/amber-heron",
  localBases: ["feature", "main", "owlery/fix-the-login-bug"],
  remoteBases: ["origin/main", "origin/release"],
  held: [{ branch: "feature", folder: "/r/project" }],
  defaultBase: "origin/main",
  setupCommand: null,
  includes: false,
  disk: null,
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
  it("says, where no branch is picked, that the first commit or a rename makes the branch the plan names, with the name apart from the words, and shows the folder, and no setup where the repository names none", () => {
    expect(planLine(PLAN, " /r/project ", "")).toEqual({
      branch: [
        { text: "No branch yet. The first commit or a rename makes ", fact: false },
        { text: "owlery/amber-heron", fact: true },
        { text: ".", fact: false },
      ],
      worktree: "/w/project/amber-heron",
      setup: "",
      warning: "",
      failed: false,
    });
  });

  it("says that a picked local branch is checked out, and a remote's branch as a local branch of its name that tracks it, or as the local branch of that name where one stands", () => {
    const words = (picked: string) => planLine(PLAN, "/r/project", picked).branch.map(({ text, fact }) => (fact ? `[${text}]` : text)).join("");
    expect(words("main")).toBe("Checks out [main].");
    // A local branch's name may hold a slash, as a remote's branch's does.
    expect(words("owlery/fix-the-login-bug")).toBe("Checks out [owlery/fix-the-login-bug].");
    expect(words("origin/release")).toBe("Checks out [release], tracking [origin/release].");
    expect(words("origin/main")).toBe("Checks out [main].");
  });

  it("shows the plan's branch as a name alone where the plan names no held branches, as a daemon of an earlier build's does, which cuts that branch at the creation", () => {
    expect(planLine({ ...PLAN, held: null }, "/r/project", "").branch).toEqual([{ text: "owlery/amber-heron", fact: true }]);
  });

  it("names the setup the repository's two files name: the copy where .worktreeinclude stands, and the command .worktreesetup holds", () => {
    expect(planLine({ ...PLAN, setupCommand: "pnpm install\n", includes: true }, "/r/project", "").setup).toBe("Copies the ignored files .worktreeinclude names from the main checkout. Then runs: pnpm install");
    expect(planLine({ ...PLAN, setupCommand: "pnpm install\n" }, "/r/project", "").setup).toBe("Then runs: pnpm install");
    expect(planLine({ ...PLAN, includes: true }, "/r/project", "").setup).toBe("Copies the ignored files .worktreeinclude names from the main checkout.");
  });

  it("shows the error's message in the place of the branch where the daemon refused the plan", () => {
    expect(planLine({ repo: "/r/nowhere", error: "/r/nowhere is not inside a git repository" }, "/r/nowhere", "")).toEqual({ branch: [{ text: "/r/nowhere is not inside a git repository", fact: false }], worktree: "", setup: "", warning: "", failed: true });
  });

  /** What a daemon that reads the machine sends with a plan: 25.1 GB free and nothing measured, one worktree standing and no cap. */
  const ROOM: PlanDisk = { freeBytes: 25_088_950_272, keepFreeBytes: 10_000_000_000, needsBytes: null, standing: 1, cap: null };

  it("warns where the disk would not hold the worktree, with the free disk, the 10 GB kept free and what a worktree of the repository takes, and not where it holds it (scenario 11)", () => {
    const warning = (disk: Partial<PlanDisk>) => planLine({ ...PLAN, disk: { ...ROOM, ...disk } }, "/r/project", "").warning;
    expect(warning({ freeBytes: 10_200_000_000, needsBytes: 440_000_512 })).toBe("The disk may not hold this worktree: 10.2 GB free, 10 GB kept free, and a worktree of this repository takes 440 MB.");
    // Exactly the 10 GB stays free.
    expect(warning({ freeBytes: 10_440_000_512, needsBytes: 440_000_512 })).toBe("");
    expect(warning({ freeBytes: 10_440_000_511, needsBytes: 440_000_512 })).not.toBe("");
    // No worktree of the repository was measured, so nothing says what this one takes, though less than the 10 GB is free.
    expect(warning({ freeBytes: 9_900_000_000 })).toBe("");
  });

  it("warns where the worktrees that stand are at their cap or over it, after the disk's warning, and says nothing where the daemon sent no disk (scenario 12)", () => {
    const warning = (disk: Partial<PlanDisk>) => planLine({ ...PLAN, disk: { ...ROOM, ...disk } }, "/r/project", "").warning;
    expect(warning({ standing: 2, cap: 2 })).toBe("This is worktree 3 of a cap of 2.");
    expect(warning({ standing: 4, cap: 2 })).toBe("This is worktree 5 of a cap of 2.");
    expect(warning({ standing: 1, cap: 2 })).toBe("");
    expect(warning({ freeBytes: 10_200_000_000, needsBytes: 440_000_512, standing: 2, cap: 2 })).toBe("The disk may not hold this worktree: 10.2 GB free, 10 GB kept free, and a worktree of this repository takes 440 MB. This is worktree 3 of a cap of 2.");
    expect(planLine({ ...PLAN, disk: null }, "/r/project", "").warning).toBe("");
  });

  it("shows nothing where the form holds no answer, and where the answer is of another repository's text", () => {
    const nothing = { branch: [], worktree: "", setup: "", warning: "", failed: false };
    expect(planLine(null, "/r/project", "")).toEqual(nothing);
    expect(planLine(PLAN, "/r/other", "")).toEqual(nothing);
    expect(planLine({ repo: "/r/nowhere", error: "/r/nowhere is not inside a git repository" }, "/r/project", "")).toEqual(nothing);
  });
});

describe("branchMenu", () => {
  it("holds each local branch and each remote's branch, a branch a worktree has checked out disabled with that worktree's folder, and a remote's branch whose local branch is checked out disabled the same way, with no branch chosen", () => {
    const held = { ...PLAN, held: [...(PLAN as { held: { branch: string; folder: string }[] }).held, { branch: "main", folder: "/w/project/other" }] };
    expect(branchMenu(held, null, "/r/project")).toEqual({
      shown: true,
      local: [
        { value: "feature", label: "feature, checked out in /r/project", disabled: true },
        { value: "main", label: "main, checked out in /w/project/other", disabled: true },
        { value: "owlery/fix-the-login-bug", label: "owlery/fix-the-login-bug", disabled: false },
      ],
      remote: [
        { value: "origin/main", label: "origin/main, checked out in /w/project/other", disabled: true },
        { value: "origin/release", label: "origin/release", disabled: false },
      ],
      value: "",
    });
  });

  it("keeps the person's choice while the repository's text is the same and the menu offers it, and goes back to no branch otherwise", () => {
    expect(branchMenu(PLAN, { repo: "/r/project", branch: "main" }, "/r/project ").value).toBe("main");
    expect(branchMenu(PLAN, { repo: "/r/project", branch: "origin/release" }, "/r/project").value).toBe("origin/release");
    expect(branchMenu(PLAN, { repo: "/r/project", branch: "feature" }, "/r/project").value).toBe("");
    expect(branchMenu(PLAN, { repo: "/r/other", branch: "main" }, "/r/project").value).toBe("");
    expect(branchMenu(PLAN, { repo: "/r/project", branch: "gone" }, "/r/project").value).toBe("");
  });

  it("is hidden, and holds nothing, where the plan names no held branches, as a daemon of an earlier build's, which cuts a branch at the creation", () => {
    expect(branchMenu({ ...PLAN, held: null }, { repo: "/r/project", branch: "main" }, "/r/project")).toEqual({ shown: false, local: [], remote: [], value: "" });
  });

  it("is shown and holds nothing where the form holds no answer for the repository's text, or the daemon refused the plan", () => {
    const empty = { shown: true, local: [], remote: [], value: "" };
    expect(branchMenu(null, null, "/r/project")).toEqual(empty);
    expect(branchMenu(PLAN, { repo: "/r/project", branch: "main" }, "/r/other")).toEqual(empty);
    expect(branchMenu({ repo: "/r/project", error: "refused" }, null, "/r/project")).toEqual(empty);
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
      { id: 2, prompt: "And the tests?", state: "working", mark: "working", words: "working", text: "test/", errorOutput: "", stop: true },
      { id: 1, prompt: "Which file holds the login form?", state: "finished", mark: "finished", words: "finished", text: "src/login/form.ts\nsrc/login/submit.ts", errorOutput: "", stop: false },
    ]);
  });

  it("shows a failed session's error in place of its answer", () => {
    const failed = headless(3, { state: "failed", answer: "src/lo", error: "the session exited with code 1 and gave no result" });
    expect(headlessLines([failed], LOGIN)).toEqual([{ id: 3, prompt: "Which file holds the login form?", state: "failed", mark: "failed", words: "failed", text: "the session exited with code 1 and gave no result", errorOutput: "", stop: false }]);
  });

  it("gives a failed session's error output after its error, with its line breaks kept, and none of a session that did not fail", () => {
    const failed = headless(3, { state: "failed", error: "the session exited with code 1 and gave no result", errorOutput: "warning: no config\nerror: unknown option '--no-such-option'\n" });
    const finished = headless(4, { state: "finished", answer: "src/login", errorOutput: "warning: no config\n" });
    expect(headlessLines([failed, finished], LOGIN).map(({ id, errorOutput }) => ({ id, errorOutput }))).toEqual([
      { id: 4, errorOutput: "" },
      { id: 3, errorOutput: "warning: no config\nerror: unknown option '--no-such-option'\n" },
    ]);
  });

  it("says Queued on the line of a session that waits for the machine, and offers Stop on it (scenario 4)", () => {
    expect(headlessLines([headless(1, { state: "queued", queuedAt: 1234 })], LOGIN)).toEqual([{ id: 1, prompt: "Which file holds the login form?", state: "queued", mark: "no-agent", words: "Queued", text: "", errorOutput: "", stop: true }]);
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

  it("gives the lines a key that stays while nothing they show changes and differs where a line or the work item differs, so an inbox that changes nothing leaves them as they are", () => {
    const sessions = [headless(3), headless(5, { state: "finished", answer: "src/login" })];
    const key = (held: readonly HeadlessInfo[], workItem: WorkItem): string => headlessKey(workItem.id, headlessLines(held, workItem));
    const drawn = key(sessions, LOGIN);
    expect(key([...sessions], { ...LOGIN, pinned: true, newCommits: 3 })).toBe(drawn);
    const others = [key([headless(3, { answer: "Reading" }), sessions[1]!], LOGIN), key([headless(3, { state: "failed", error: "stopped" }), sessions[1]!], LOGIN), key(sessions.map((info) => ({ ...info, workItemId: 2 })), SEARCH)];
    expect(new Set([drawn, ...others]).size).toBe(others.length + 1);
  });
});

describe("the list of the daemon's chain at the view's foot", () => {
  const RUN: GateRun = { command: "pnpm -r run check", exitCode: null, output: false };
  const ROUND: ChainStage = { kind: "round", round: 1, state: "finished", failure: null, startedAt: 1000, endedAt: 2000, headlessId: 3, refusals: 0, gate: null };
  /** A broad gate's stage: at work since 5000, but for the fields given. */
  const gate = (fields: Partial<ChainStage> = {}): ChainStage => ({ kind: "gate", round: 1, state: "working", failure: null, startedAt: 5000, endedAt: null, headlessId: null, refusals: 0, gate: RUN, ...fields });
  const PASSED = gate({ state: "finished", endedAt: 6000, gate: { ...RUN, exitCode: 0, output: true } });
  const FAILED = gate({ state: "failed", failure: "the command exited with code 3", endedAt: 6000, gate: { ...RUN, exitCode: 3, output: true } });
  /** The work item with a chain in that state, which holds those stages, the oldest first. */
  const chained = (state: Chain["state"], ...stages: ChainStage[]): WorkItem => ({ ...LOGIN, chain: { state, says: "", stages, since: 7000 } });

  it("gives no line for a work item no chain ran for, for one a daemon of an earlier build sent with no chain, and for a chain that holds no broad gate", () => {
    const { chain: _chain, ...earlier } = LOGIN;
    expect(LOGIN.chain).toBeNull();
    expect(gateLine(LOGIN, null)).toBeNull();
    expect(gateLine(earlier as WorkItem, null)).toBeNull();
    expect(gateLine(chained("running", ROUND), null)).toBeNull();
    expect(gateLine(chained("stopped"), null)).toBeNull();
    // A stage of another kind holds no run, and a stage a build before the gate stored holds none either.
    expect(gateLine(chained("running", { ...ROUND, kind: "inspection" }), null)).toBeNull();
    expect(gateLine(chained("stopped", gate({ gate: null })), null)).toBeNull();
  });

  it("says the words Broad gate, the command and the state's word of a gate that runs, with Stop and with no button for its output", () => {
    expect(GATE_HEAD).toBe("Broad gate");
    expect(gateLine(chained("running", ROUND, gate()), null)).toEqual({ startedAt: 5000, command: "pnpm -r run check", state: "working", words: "working", text: "", stop: true, output: false, printed: null });
  });

  it("offers the output of a gate that ended where its output is kept, says finished for one that passed, and failed with the stage's failure as a sentence for one that did not", () => {
    expect(GATE_OUTPUT_SHOWS).toBe("Show output");
    expect(gateLine(chained("running", ROUND, PASSED), null)).toEqual({ startedAt: 5000, command: "pnpm -r run check", state: "finished", words: "finished", text: "", stop: false, output: true, printed: null });
    expect(gateLine(chained("stopped", ROUND, FAILED), null)).toEqual({ startedAt: 5000, command: "pnpm -r run check", state: "failed", words: "failed", text: "The command exited with code 3.", stop: false, output: true, printed: null });
    // A command that printed nothing leaves nothing to show, and a failure the daemon gave no text has none.
    expect(gateLine(chained("stopped", gate({ state: "failed", failure: null, endedAt: 6000, gate: { ...RUN, exitCode: 1, output: false } })), null)).toMatchObject({ state: "failed", text: "", output: false });
  });

  it("is the line of the chain's newest gate, wherever it stands among the stages", () => {
    const again = gate({ startedAt: 9000, gate: { ...RUN, command: "pnpm test" } });
    expect(gateLine(chained("running", ROUND, FAILED, again), null)).toMatchObject({ startedAt: 9000, command: "pnpm test", state: "working", stop: true });
    // An inspection and a ruling follow the gate that passed, and the line stays the gate's.
    expect(gateLine(chained("running", FAILED, PASSED, { ...ROUND, kind: "inspection", state: "working", endedAt: null }), null)).toMatchObject({ startedAt: 5000, state: "finished", output: true });
    expect(gateLine(chained("stopped", gate({ startedAt: 4000, state: "finished", endedAt: 4500 }), FAILED, ROUND), null)).toMatchObject({ state: "failed", text: "The command exited with code 3." });
  });

  it("holds the gate's line and the lines of the work item's sessions, and is drawn only where it holds a line: not for a work item the daemon lists no session of and whose chain holds no gate's run (design, A work item with no daemon chain shows the inspection's place alone)", () => {
    expect(chainList([], LOGIN, null)).toEqual({ gate: null, lines: [], drawn: false });
    // Another work item's session, and a chain whose stages hold no gate's run, give the list no line.
    expect(chainList([headless(2, { workItemId: 2 })], chained("stopped", ROUND), null)).toEqual({ gate: null, lines: [], drawn: false });
    const failed = chained("stopped", ROUND, FAILED);
    expect(chainList([], failed, null)).toEqual({ gate: gateLine(failed, null), lines: [], drawn: true });
    const sessions = [headless(1), headless(2, { workItemId: 2 }), headless(3, { state: "failed", error: "the session exited with code 1 and gave no result" })];
    expect(chainList(sessions, LOGIN, null)).toEqual({ gate: null, lines: headlessLines(sessions, LOGIN), drawn: true });
  });

  it("draws a gate whose stage says it works in a chain that does not run it as failed, with no Stop: no command of it runs", () => {
    for (const state of ["stopped", "parked", "rested"] as const) expect(gateLine(chained(state, ROUND, gate()), null)).toMatchObject({ state: "failed", words: "failed", text: "", stop: false, output: false });
    // A running chain whose newest stage is another runs no gate either.
    expect(gateLine(chained("running", gate(), { ...ROUND, state: "working", endedAt: null }), null)).toMatchObject({ state: "failed", stop: false });
  });

  it("draws what a read of the output answered under the line of the run it was read of, with a note where the daemon kept the end alone, and under no other run's and no other work item's line", () => {
    const read = { workItemId: 1, startedAt: 5000, text: "FAIL test/view.test.ts\n1 failed\n", cut: false };
    const failed = chained("stopped", ROUND, FAILED);
    expect(gateLine(failed, read)?.printed).toEqual({ text: "FAIL test/view.test.ts\n1 failed\n", note: "" });
    expect(gateLine(failed, { ...read, cut: true })?.printed).toEqual({ text: "FAIL test/view.test.ts\n1 failed\n", note: "Owlery kept the end of the output alone." });
    // The gate ran again since the read, and the output of the earlier run is not the new line's.
    expect(gateLine(chained("running", ROUND, FAILED, gate({ startedAt: 9000 })), read)?.printed).toBeNull();
    expect(gateLine(failed, { ...read, startedAt: 4000 })?.printed).toBeNull();
    expect(gateLine({ ...failed, id: 2 }, read)?.printed).toBeNull();
    // The rest of the line is as without the read.
    expect({ ...gateLine(failed, read), printed: null }).toEqual(gateLine(failed, null));
  });

  it("tells one drawing of the list from the next by the gate's line too: its state, its buttons and the output under it", () => {
    const failed = chained("stopped", ROUND, FAILED);
    const read = { workItemId: 1, startedAt: 5000, text: "1 failed\n", cut: false };
    const keys = [
      headlessKey(1, [], null),
      headlessKey(1, [], gateLine(chained("running", ROUND, gate()), null)),
      headlessKey(1, [], gateLine(failed, null)),
      headlessKey(1, [], gateLine(failed, read)),
      headlessKey(1, [], gateLine(failed, { ...read, text: "2 failed\n" })),
      headlessKey(1, [], gateLine(failed, { ...read, cut: true })),
    ];
    expect(new Set(keys).size).toBe(keys.length);
    expect(headlessKey(1, [], gateLine(failed, read))).toBe(headlessKey(1, [], gateLine(chained("stopped", ROUND, FAILED), { ...read })));
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

  it("carries the version of the older check the daemon read of a repository, which its row shows as a button, and none where the daemon read none, sent no such field or sent no records", () => {
    const WORKFLOW = ".github/workflows/owlery-inspection.yml";
    const older: Repository = { ...PROJECT, records: { root: "inspection", check: WORKFLOW, broadGate: null, olderCheck: "0.0.4" } };
    const current: Repository = { ...PROJECT, id: 2, records: { root: "inspection", check: WORKFLOW, broadGate: null, olderCheck: null } };
    const unsent: Repository = { ...PROJECT, id: 3, records: { root: "inspection", check: WORKFLOW, broadGate: null } };
    const { records: _, ...earlier } = { ...PROJECT, id: 4 };
    expect(sidebarTree([older, current, unsent, earlier as Repository], [], [], KINDS).map((repository) => [repository.id, repository.olderCheck])).toEqual([
      [1, "0.0.4"],
      [2, null],
      [3, null],
      [4, null],
    ]);
  });

  it("carries the root in the earlier form the daemon read of a repository, which its row shows as a button, and none where the daemon read none or sent no such field", () => {
    const moving: Repository = { ...PROJECT, records: { root: null, check: null, broadGate: null, olderCheck: null, earlier: "seal" } };
    const unsent: Repository = { ...PROJECT, id: 2, records: { root: null, check: null, broadGate: null } };
    expect(sidebarTree([moving, unsent], [], [], KINDS).map((repository) => [repository.id, repository.earlier])).toEqual([
      [1, "seal"],
      [2, null],
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

describe("refusalSays", () => {
  it("names the menu's entry that replaces the daemon where the daemon does not know the request, whatever its own sentence says", () => {
    expect(refusalSays({ message: `This daemon does not know the request "readLists".`, unknown: true })).toBe(`Owlery's background process is from another build and does not know this request. Choose "Restart Daemon…" from the menu to replace it.`);
    expect(refusalSays({ message: "", unknown: true })).toBe(UNKNOWN_REQUEST_SAYS);
  });

  it("gives the daemon's own sentence for every other refusal", () => {
    expect(refusalSays({ message: "no work item 3" })).toBe("no work item 3");
  });
});

describe("answerWaits", () => {
  /** The unit against a stand-in for the window: each wait it was asked for, which runs only when the case runs it, and each refusal it made. */
  function waitsLike() {
    const waits: { ms: number; run: () => void; stopped: boolean }[] = [];
    const refused: unknown[] = [];
    const unit = answerWaits({
      after(ms, run) {
        const wait = { ms, run, stopped: false };
        waits.push(wait);
        return () => {
          wait.stopped = true;
        };
      },
      refuse: (error) => refused.push(error),
    });
    return { unit, waits, refused };
  }

  it("ends a request a daemon without `answersUnknown` has not answered after 10 seconds, once, as a refusal that names the menu's entry, and takes a late answer as nothing of its own", () => {
    const { unit, waits, refused } = waitsLike();
    unit.ready({});
    unit.sent({ type: "readLists", requestId: 4 });
    expect(ANSWER_WAIT_MS).toBe(10_000);
    expect(waits.map(({ ms }) => ms)).toEqual([10_000]);
    for (const { run } of waits) run();
    expect(refused).toEqual([{ type: "error", requestId: 4, message: `Owlery's background process is from another build and has not answered. Choose "Restart Daemon…" from the menu to replace it.` }]);
    expect(NOT_ANSWERED_SAYS).toBe((refused[0] as { message: string }).message);
    // The answer that comes after the wait, and the wait run again, make no second refusal.
    unit.answered({ type: "done", requestId: 4 });
    for (const { run } of waits) run();
    expect(refused).toHaveLength(1);
  });

  it("stops the wait of a request at an answer that names it before the wait is over, arms none for a message that is no request, and keeps the wait of another request", () => {
    const { unit, waits, refused } = waitsLike();
    unit.ready({});
    unit.sent({ type: "readLists", requestId: 4 });
    unit.sent({ type: "readMachine" });
    unit.sent({ type: "stopHeadless", requestId: 5, id: 3 });
    // A message that names no request, and one of another request, end nothing.
    unit.answered({ type: "inbox", sessions: [], workItems: [], repositories: [], archived: [] });
    unit.answered({ type: "error", requestId: 9, message: "no work item 9" });
    expect(waits.map(({ stopped }) => stopped)).toEqual([false, false]);
    unit.answered({ type: "error", requestId: 4, message: "The work items were not read again: no git." });
    expect(waits.map(({ stopped }) => stopped)).toEqual([true, false]);
    for (const { run } of waits) run();
    expect(refused).toEqual([{ type: "error", requestId: 5, message: NOT_ANSWERED_SAYS }]);
  });

  it("arms no wait against a daemon whose `ready` holds `answersUnknown`, and none before the daemon's `ready`", () => {
    const { unit, waits } = waitsLike();
    unit.sent({ type: "readLists", requestId: 1 });
    unit.ready({ answersUnknown: true });
    unit.sent({ type: "readLists", requestId: 2 });
    expect(waits).toEqual([]);
  });

  it("arms no wait for a creation, which every daemon from 0.0.2 on answers by its id after work that can outlast the wait", () => {
    const { unit, waits } = waitsLike();
    unit.ready({});
    unit.sent({ type: "createWorkItem", requestId: 3, repo: "/r", title: "T", kind: "shell", cols: 80, rows: 24 });
    unit.sent({ type: "readLists", requestId: 4 });
    expect(waits.map(({ ms }) => ms)).toEqual([10_000]);
  });
});

describe("statusNotice", () => {
  const OWN = "The theme could not be saved.";
  const DAEMON = daemonNotice(true);
  const STORE = "Owlery could not read its list of repositories, so it kept the file as /run/repositories-unread-20261126T123005Z.json and started with none. Nothing in that file was changed.";
  const AGENT = `Claude Code 2.1.300 is older than 2.1.329, the oldest version Owlery's role sessions were checked on. Run "claude update" in a terminal.`;

  it("says the agent's notice where the window, the daemon and the store have none", () => {
    expect(statusNotice("", "", null, AGENT)).toBe(AGENT);
  });

  it("says the window's own notice first, then the daemon's, then the store's, then the agent's", () => {
    expect(statusNotice(OWN, DAEMON, STORE, AGENT)).toBe(OWN);
    expect(statusNotice(OWN, "", STORE, AGENT)).toBe(OWN);
    expect(statusNotice("", DAEMON, STORE, AGENT)).toBe(DAEMON);
    expect(statusNotice("", DAEMON, null, null)).toBe(DAEMON);
    expect(statusNotice("", "", STORE, AGENT)).toBe(STORE);
  });

  it("says nothing where none of the four has a notice, so the line shows the daemon's state", () => {
    expect(statusNotice("", "", null, null)).toBe("");
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

  it("matches a work item with no branch yet by its title and its repository's name, and not by the words its line says in place of a branch", () => {
    const none: WorkItem = { ...LOGIN, id: 5, title: "Draft the notes", branch: null, ownsBranch: false };
    const found = (query: string) => matchWorkItems(workItemEntries([none, DOCS], sessions, KINDS), query, "all").map((entry) => entry.workItem.id);
    expect([found("draft"), found("project"), found("no branch"), found("owlery/")]).toEqual([[5], [5], [], [3]]);
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

describe("filterMark", () => {
  it("is off at All with nothing typed, and says so to a pointer", () => {
    expect(filterMark("", "all")).toEqual({ on: false, says: "Showing: All" });
  });

  it("is on while a state is chosen, a search is typed, or both, and says the state's label and what is typed", () => {
    expect(filterMark("", "none")).toEqual({ on: true, says: "Showing: Asleep" });
    expect(filterMark("logs", "all")).toEqual({ on: true, says: 'Showing: All, matching "logs"' });
    expect(filterMark("logs", "waiting")).toEqual({ on: true, says: 'Showing: Needs you, matching "logs"' });
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

describe("emptySidebar", () => {
  const docs: Repository = { ...PROJECT, id: 2, folder: "/r/docs", name: "docs" };
  const hidden: Repository = { ...PROJECT, id: 3, folder: "/r/hidden", name: "hidden", hidden: true };

  it("names the state chosen, the search typed, or both, and how many repositories the daemon keeps that the sidebar does not list, the hidden left out", () => {
    expect(emptySidebar([PROJECT, docs, hidden], 0, "", "waiting")).toBe('No work item stands under "Needs you", so the sidebar lists none of its 2 repositories.');
    expect(emptySidebar([PROJECT, docs, hidden], 0, "logs", "all")).toBe('No work item matches "logs", so the sidebar lists none of its 2 repositories.');
    expect(emptySidebar([PROJECT, docs, hidden], 0, "logs", "none")).toBe('No work item under "Asleep" matches "logs", so the sidebar lists none of its 2 repositories.');
  });

  it("says of one repository that the sidebar does not list it", () => {
    expect(emptySidebar([PROJECT, hidden], 0, "", "decided")).toBe('No work item stands under "Decided without asking", so the sidebar does not list its repository.');
  });

  it("says nothing where the sidebar lists a repository, where nothing narrows it, and where every repository is hidden", () => {
    expect(emptySidebar([PROJECT, docs], 1, "logs", "waiting")).toBe("");
    expect(emptySidebar([PROJECT, docs], 0, "", "all")).toBe("");
    expect(emptySidebar([hidden], 0, "logs", "waiting")).toBe("");
    expect(emptySidebar([], 0, "logs", "waiting")).toBe("");
  });
});

describe("summaryControls", () => {
  function change(id: number, state: InboxLine["state"], fields: Partial<WorkItem> = {}, pane?: SessionInfo): { workItem: WorkItem; line: InboxLine; session: SessionInfo | undefined } {
    return { workItem: { ...LOGIN, id, ...fields }, line: { title: "Fix the login bug", branch: "owlery/fix-the-login-bug", state, commits: "" }, session: pane };
  }
  const ASKED: Question = { id: 1, asks: "Which base does the branch start from?", grounds: "No document names it.", by: "inspector", options: [], default: null, answer: null, since: 3000 };
  const LAPSED: Inspection = { state: "lapsed", commit: "3f2a9c1d0e5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c", why: "`src/app.ts` changed after the cleared commit `3f2a9c1`." };
  const STOPPED: Chain = { state: "stopped", says: "Review round 2 failed: the session ended.", since: 80, stages: [] };

  it("makes answering the first work item that waits on a question or a pane that waits the main control, with the inbox beside it and a hint that names the question, past a line before it that waits for another reason", () => {
    const answer = (opens: number) => ({ main: { label: "Answer the first question", opens }, second: { label: "Open the inbox", opens: "inbox" }, hint: "Enter opens the first question." });
    expect(summaryControls([change(4, "finished"), change(7, "waiting", { questions: [ASKED] }), change(9, "waiting", { questions: [ASKED] })])).toEqual(answer(7));
    expect(summaryControls([change(3, "waiting", { inspection: LAPSED }), change(7, "waiting", { questions: [ASKED] })])).toEqual(answer(7));
    expect(summaryControls([change(3, "waiting", { chain: STOPPED }), change(8, "waiting", { questions: [ASKED] })])).toEqual(answer(8));
    expect(summaryControls([change(3, "waiting", { inspection: LAPSED }), change(9, "waiting", {}, session(5, { workItemId: 9, state: "waiting" }))])).toEqual(answer(9));
  });

  it("opens the first work item that waits for another reason, a lapsed inspection, a stopped chain or a failed check, saying so, where none waits on a question, a call or a pane, with the inbox beside it", () => {
    const first = (opens: number) => ({ main: { label: "Open the first that needs you", opens }, second: { label: "Open the inbox", opens: "inbox" }, hint: "Enter opens the first that needs you." });
    expect(summaryControls([change(4, "finished"), change(3, "waiting", { inspection: LAPSED }), change(5, "waiting", { chain: STOPPED })])).toEqual(first(3));
    expect(summaryControls([change(5, "waiting", { chain: STOPPED })])).toEqual(first(5));
    const failed: PullRequest = { number: 12, url: "https://github.com/o/r/pull/12", state: "open", head: "3f2a9c1", pushed: "3f2a9c1", checks: "failed", list: [{ name: "inspection", state: "failed", link: null }], listCount: 1, readAt: 10, failure: null };
    expect(summaryControls([change(4, "working"), change(2, "waiting", { pullRequest: failed })])).toEqual(first(2));
    // A pane that finished is no pane that waits.
    expect(summaryControls([change(6, "waiting", { inspection: LAPSED }, session(5, { workItemId: 6, state: "finished" }))])).toEqual(first(6));
  });

  it("makes the inbox the main control and the only one where no changed work item waits, or none changed", () => {
    const alone = { main: { label: "Open the inbox", opens: "inbox" }, second: null, hint: "Enter opens it." };
    expect(summaryControls([change(4, "finished"), change(5, "working"), change(6, null)])).toEqual(alone);
    expect(summaryControls([])).toEqual(alone);
  });
});

describe("summaryHead", () => {
  const waits = [{ line: { title: "Fix the login bug", branch: "owlery/fix-the-login-bug", state: "waiting", commits: "" } satisfies InboxLine, decided: 0, inspectionSince: null }];

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

/** What a daemon that keeps the caps sends of a Mac with 36 GB of memory, 6 performance cores and 25.1 GB free, where no cap is set and nothing runs. */
const MACHINE: Machine = {
  reading: { memoryBytes: 38_654_705_664, cores: 12, performanceCores: 6, load: 3.9, disk: { freeBytes: 25_088_950_272, totalBytes: 494_384_795_648 } },
  agents: { proposed: 6, byCores: 6, byMemory: 27, set: null, running: 0, perAgentBytes: 679 * 1024 ** 2, measured: 0, queue: [] },
  worktrees: { proposed: null, set: null, standing: 1, perWorktreeBytes: null, keepFreeBytes: 10_000_000_000 },
  panes: { proposed: 8, set: null },
  heavy: { proposed: 1, byCores: 1, byMemory: 2, set: null, queue: [] },
  scrollback: { proposed: 5000, set: null },
};

/** What a daemon of an earlier build sends of the same Mac: no scrollback. */
const { scrollback: _unsent, ...EARLIER_MACHINE } = MACHINE;

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

  it("counts against the cap, where the daemon keeps one, the agents it counts, its working headless sessions among them, and the sessions that wait (scenarios 4 and 8)", () => {
    const agents = (running: number, queue: number[], set: number | null = null): Machine => ({ ...MACHINE, agents: { ...MACHINE.agents, running, queue, set } });
    expect(daemonStatus([], KINDS, false, agents(6, [7, 8]))).toBe("Daemon running, 6 agents of 6, 2 waiting");
    expect(daemonStatus([session(1)], KINDS, false, agents(1, [7], 1))).toBe("Daemon running, 1 agent of 1, 1 waiting");
    expect(daemonStatus([session(1), session(2)], KINDS, true, agents(2, [], 1))).toBe("Daemon running, 2 agents of 1, keeping the Mac awake");
    // Where nothing runs and nothing waits, the line says so as a daemon without a cap does, and a session that waits is counted where none runs.
    expect(daemonStatus([], KINDS, false, agents(0, []))).toBe("Daemon running, no agent");
    expect(daemonStatus([], KINDS, false, agents(0, [7]))).toBe("Daemon running, 0 agents of 6, 1 waiting");
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

describe("machineDialog", () => {
  /** The owner's Mac as the framer's probe read it, with one work item standing and nothing measured. */
  it("states the reading in one sentence, and gives each cap a row with its value, its default's sentence and whether it follows the default (scenario 1)", () => {
    expect(machineDialog(MACHINE)).toEqual({
      reading: "36 GB of memory, 12 cores of which 6 are performance cores, a load of 3.9, and 25.1 GB free of 494.4 GB on the worktrees' disk.",
      rows: [
        { cap: "agents", label: "Agents at once", value: 6, proposed: 6, isDefault: true, says: "The default is 6: the 6 performance cores, fewer than the 27 that half of 36 GB holds at 679 MB an agent (not measured on this Mac yet)." },
        { cap: "worktrees", label: "Worktrees", value: null, proposed: null, isDefault: true, says: "Nothing is proposed until a worktree is measured on this Mac." },
        { cap: "panes", label: "Panes side by side", value: 8, proposed: 8, isDefault: true, says: "The default is 8, for 36 GB of memory: 4 under 16 GB, 6 from 16 GB and 8 from 32 GB." },
        { cap: "scrollback", label: "Scrollback lines", value: 5000, proposed: 5000, isDefault: true, says: "The default is 5,000 lines for each pane. A pane on screen holds 12 bytes for each column of a line, about 6 MB at 5,000 lines of 100 columns, and the daemon keeps up to 256 characters of output for each line." },
        { cap: "heavyCommands", label: "Heavy commands at once", value: 1, proposed: 1, isDefault: true, says: "The default is 1: one for each 8 cores gives 1, one for each 16 GB gives 2, and the fewer is taken." },
      ],
    });
  });

  it("draws no scrollback row against a daemon of an earlier build, which sends no scrollback (scenario B3)", () => {
    expect(machineDialog(EARLIER_MACHINE)?.rows.map(({ cap }) => cap)).toEqual(["agents", "worktrees", "panes", "heavyCommands"]);
  });

  it("shows the scrollback a person set in place of its default, with \"Use the default\" offered (scenario B2)", () => {
    expect(machineDialog({ ...MACHINE, scrollback: { proposed: 5000, set: 20_000 } })?.rows[3]).toMatchObject({ cap: "scrollback", value: 20_000, proposed: 5000, isDefault: false });
  });

  it("shows the limit on heavy commands a person set in place of its default, with \"Use the default\" offered (scenario E)", () => {
    const rows = machineDialog({ ...MACHINE, heavy: { ...MACHINE.heavy, set: 2 } })?.rows;
    expect(rows?.at(-1)).toMatchObject({ cap: "heavyCommands", value: 2, proposed: 1, isDefault: false });
  });

  it("shows the value a person set in place of the proposal, and the row no longer follows the default (scenario 3)", () => {
    const rows = machineDialog({ ...MACHINE, agents: { ...MACHINE.agents, set: 3 }, worktrees: { ...MACHINE.worktrees, set: 40 } })?.rows;
    expect(rows?.map(({ cap, value, isDefault }) => ({ cap, value, isDefault }))).toEqual([
      { cap: "agents", value: 3, isDefault: false },
      { cap: "worktrees", value: 40, isDefault: false },
      { cap: "panes", value: 8, isDefault: true },
      { cap: "scrollback", value: 5000, isDefault: true },
      { cap: "heavyCommands", value: 1, isDefault: true },
    ]);
    // The sentence still states the default, which "Use the default" returns to.
    expect(rows?.[0]?.says).toMatch(/^The default is 6: /);
  });

  it("does not follow the default where a person set a cap to the value of its proposal, so \"Use the default\" is offered (scenario 3)", () => {
    const rows = machineDialog({ ...MACHINE, agents: { ...MACHINE.agents, set: 6 }, panes: { ...MACHINE.panes, set: 8 } })?.rows;
    expect(rows?.map(({ cap, value, isDefault }) => ({ cap, value, isDefault }))).toEqual([
      { cap: "agents", value: 6, isDefault: false },
      { cap: "worktrees", value: null, isDefault: true },
      { cap: "panes", value: 8, isDefault: false },
      { cap: "scrollback", value: 5000, isDefault: true },
      { cap: "heavyCommands", value: 1, isDefault: true },
    ]);
  });

  it("shows nothing against a daemon that sent no `machine`: one of an earlier build, or one given no reader, and the Machine button is then hidden (scenario 10)", () => {
    expect(machineDialog(null)).toBeNull();
  });
});

describe("the queue of the agents", () => {
  const ROUND: ChainStage = { kind: "round", round: 2, state: "working", failure: null, startedAt: 1, endedAt: null, headlessId: 8, refusals: 0, gate: null };
  const CHAINED: WorkItem = { ...SEARCH, chain: { state: "running", says: "Review round 2 is running.", since: 1, stages: [ROUND] } };
  // Session 7 is a crafter's whose chain lists no stage of it yet, and session 9 one with no role, as a daemon before release 0.0.5 started at a person's request.
  const HEADLESS = [headless(7, { state: "queued", prompt: "Which file?", role: { role: "crafter", stage: "fix-pass" } }), headless(8, { workItemId: 2, state: "queued" }), headless(9, { state: "queued", prompt: "And the tests?", role: null }), headless(3)];
  const QUEUED: Machine = { ...MACHINE, agents: { ...MACHINE.agents, running: 6, queue: [8, 7, 9] } };

  it("lists under the agent row each session that waits, in the order they start, by its work item's title and what it waits to run: a chain's stage by its name, a session whose chain lists no stage of it yet by its role and stage, and one with no role by its number, never by its prompt (scenario 4)", () => {
    expect(machineQueue(QUEUED, HEADLESS, [LOGIN, CHAINED])).toEqual([
      { title: "Speed up search", waits: "Proofer, round 2" },
      { title: "Fix the login bug", waits: "Crafter, fix pass" },
      { title: "Fix the login bug", waits: "Session 9" },
    ]);
    // A session the window holds no line of yet is listed as the daemon gave it, by its number.
    expect(machineQueue({ ...QUEUED, agents: { ...QUEUED.agents, queue: [11] } }, HEADLESS, [LOGIN])).toEqual([{ title: "", waits: "Session 11" }]);
    expect(machineQueue(MACHINE, HEADLESS, [LOGIN, CHAINED])).toEqual([]);
    expect(machineQueue(null, HEADLESS, [LOGIN, CHAINED])).toEqual([]);
  });

  it("counts how many go before a work item's first session that waits, and gives null for a work item none of whose sessions waits and against a daemon that keeps no cap", () => {
    expect(queuedAhead(1, HEADLESS, QUEUED)).toBe(1);
    expect(queuedAhead(2, HEADLESS, QUEUED)).toBe(0);
    expect(queuedAhead(3, HEADLESS, QUEUED)).toBeNull();
    expect(queuedAhead(1, HEADLESS, null)).toBeNull();
  });
});

describe("the heavy commands in the Machine dialog", () => {
  const AT = 1_000_000_000_000;
  const outside = "/Users/someone/scratch";
  const HEAVY: Machine = {
    ...MACHINE,
    heavy: {
      ...MACHINE.heavy,
      queue: [
        { workItemId: 2, folder: SEARCH.worktree, name: "Broad gate", place: "gate", state: "running", since: AT - 4 * 60_000 },
        { workItemId: 1, folder: LOGIN.worktree, name: "Broad gate", place: "gate", state: "waiting", since: AT - 2 * 60_000 },
        { workItemId: 1, folder: LOGIN.worktree, name: "test", place: "review", state: "waiting", since: AT - 30_000 },
        { workItemId: 9, folder: "/w/project/gone", name: "test", place: "build", state: "waiting", since: AT - 6 * 60_000 },
        { workItemId: null, folder: outside, name: "install", place: "outside", state: "waiting", since: AT - 60 * 60_000 },
      ],
    },
  };

  it("lists the heavy commands that run and wait in the queue's order, each with its state, its command, the reason for the place of one that waits, and its age, under its work item's title or the last part of its folder (scenario K)", () => {
    expect(heavyQueue(HEAVY, [LOGIN, SEARCH], AT)).toEqual([
      { title: "Speed up search", detail: "Running · Broad gate · 4 min" },
      { title: "Fix the login bug", detail: "Waiting · Broad gate · one step from its inspection · 2 min" },
      { title: "Fix the login bug", detail: "Waiting · test · under review · less than a minute" },
      { title: "gone", detail: "Waiting · test · still being built · 6 min" },
      { title: "scratch", detail: "Waiting · install · in no work item · 1 h" },
    ]);
    expect(heavyQueue(MACHINE, [LOGIN], AT)).toEqual([]);
    expect(heavyQueue(null, [LOGIN], AT)).toEqual([]);
  });

  it("gives one row for each command of each repository that ran, with how many runs, the longest, the most memory and the highest load, and says where no reading was made (scenario I)", () => {
    expect(
      heavyRanRows([
        { repo: "/r/project", repoName: "project", name: "Broad gate", runs: 9, longestMs: 14 * 60_000, mostMemory: 9.2 * 1024 ** 3, highestLoad: 13.14 },
        { repo: null, repoName: "scratch", name: "test", runs: 1, longestMs: 20_000, mostMemory: null, highestLoad: null },
      ]),
    ).toEqual([
      { title: "project · Broad gate", detail: "9 runs · longest 14 min · most memory 9.2 GB · highest load 13.1" },
      { title: "scratch · test", detail: "1 run · longest less than a minute · most memory not read · highest load not read" },
    ]);
  });
});

describe("the line of a work item whose heavy command waits for the machine", () => {
  const WAITS: WorkItem = { ...LOGIN, machineWait: { name: "test", since: 5_000, ahead: 2 } };

  it("says in #32's words that a heavy command of the work item waits, with how many go before it (scenario A)", () => {
    expect(machineAhead(WAITS, [], MACHINE)).toBe(2);
    expect(lineText(WAITS, undefined, false, machineAhead(WAITS, [], MACHINE))).toEqual({ says: "machine", text: "Waiting for the machine (2 ahead)" });
    expect(machineAhead({ ...WAITS, machineWait: { name: "test", since: 5_000, ahead: 0 } }, [], null)).toBe(0);
    expect(machineAhead(LOGIN, [], MACHINE)).toBeNull();
    expect(machineAhead({ ...LOGIN, machineWait: null }, [], MACHINE)).toBeNull();
  });

  it("shows the wait that began first where a session of the work item waits for the agent cap too", () => {
    const queued = (queuedAt: number) => [headless(7, { state: "queued", queuedAt }), headless(8, { workItemId: 2, state: "queued", queuedAt: 1 })];
    const machine: Machine = { ...MACHINE, agents: { ...MACHINE.agents, queue: [8, 7] } };
    // The session waits from 4,000, before the heavy command's 5,000: its count of 1 is shown.
    expect(machineAhead(WAITS, queued(4_000), machine)).toBe(1);
    // It waits from 6,000, after the heavy command: the heavy command's count of 2 is shown.
    expect(machineAhead(WAITS, queued(6_000), machine)).toBe(2);
    // A session of the work item alone.
    expect(machineAhead(LOGIN, queued(6_000), machine)).toBe(1);
  });
});

describe("capChanges", () => {
  const rows = (set: { agents?: number; worktrees?: number }): CapRow[] => [
    { cap: "agents", label: "Agents at once", value: set.agents ?? 6, proposed: 6, isDefault: set.agents === undefined, says: "" },
    { cap: "worktrees", label: "Worktrees", value: set.worktrees ?? null, proposed: null, isDefault: set.worktrees === undefined, says: "" },
    { cap: "panes", label: "Panes side by side", value: 8, proposed: 8, isDefault: true, says: "" },
  ];
  const fields = (text: Partial<Record<Cap, string>>, toDefault: Cap[] = []) => ({
    agents: { text: text.agents ?? "6", toDefault: toDefault.includes("agents") },
    worktrees: { text: text.worktrees ?? "", toDefault: toDefault.includes("worktrees") },
    panes: { text: text.panes ?? "8", toDefault: toDefault.includes("panes") },
    heavyCommands: { text: text.heavyCommands ?? "1", toDefault: toDefault.includes("heavyCommands") },
    scrollback: { text: text.scrollback ?? "5000", toDefault: toDefault.includes("scrollback") },
  });

  it("sends the value a person typed, and nothing of a row that still shows its proposal untouched (scenario 3)", () => {
    expect(capChanges(rows({}), fields({}))).toEqual({ caps: {} });
    expect(capChanges(rows({}), fields({ agents: " 3 " }))).toEqual({ caps: { agents: 3 } });
    expect(capChanges(rows({}), fields({ worktrees: "40", panes: "12" }))).toEqual({ caps: { worktrees: 40, panes: 12 } });
  });

  it("returns a row a person set to its proposal where they pressed \"Use the default\" or emptied its field, and sends nothing of a row that already follows it", () => {
    const set = rows({ agents: 3, worktrees: 40 });
    expect(capChanges(set, fields({ agents: "6", worktrees: "40" }, ["agents"]))).toEqual({ caps: { agents: null } });
    expect(capChanges(set, fields({ agents: "3", worktrees: "" }))).toEqual({ caps: { worktrees: null } });
    expect(capChanges(rows({}), fields({ agents: "" }, ["panes"]))).toEqual({ caps: {} });
  });

  it("refuses, with the daemon's sentence and before anything is sent, a value that is no whole number from 1, or over 16 for the panes", () => {
    expect(capChanges(rows({}), fields({ agents: "2.5" }))).toEqual({ refusal: "The cap on agents at once is a whole number from 1." });
    expect(capChanges(rows({}), fields({ worktrees: "many" }))).toEqual({ refusal: "The cap on worktrees is a whole number from 1." });
    // Text a number is read from in another notation is no whole number as a person types one.
    expect(capChanges(rows({}), fields({ agents: "1e1" }))).toEqual({ refusal: "The cap on agents at once is a whole number from 1." });
    expect(capChanges(rows({}), fields({ panes: "17" }))).toEqual({ refusal: "The cap on panes side by side is a whole number from 1 to 16." });
  });

  it("sends the limit on heavy commands a person typed, and refuses one over the machine's cores in the daemon's sentence", () => {
    const heavy: CapRow[] = [...rows({}), { cap: "heavyCommands", label: "Heavy commands at once", value: 1, proposed: 1, isDefault: true, says: "" }];
    const typed = (text: string) => ({ ...fields({}), heavyCommands: { text, toDefault: false } });
    expect(capChanges(heavy, typed("2"), 12)).toEqual({ caps: { heavyCommands: 2 } });
    expect(capChanges(heavy, typed("13"), 12)).toEqual({ refusal: "The limit on heavy commands at once is a whole number from 1 to 12." });
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
  const free = { mac: true, dialogOpen: false, menuOpen: false, paneInFront: false, finding: false };

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

  it("reads F with the Command key as the find bar's key on a Mac keyboard where a pane is in front, and not on another keyboard", () => {
    const f = { ...plain, code: "KeyF" };
    const pane = { ...free, paneInFront: true };
    expect(commandKey({ ...f, meta: true }, pane)).toBe("find");
    expect(commandKey({ ...f, meta: true }, { ...pane, finding: true })).toBe("find");
    expect(commandKey({ ...f, meta: true }, free)).toBeNull();
    // Control+F is the shell's key on a keyboard without the Command key.
    expect(commandKey({ ...f, ctrl: true }, { ...pane, mac: false })).toBeNull();
    expect(commandKey({ ...f, meta: true }, { ...pane, dialogOpen: true })).toBeNull();
    expect(commandKey({ ...f, meta: true }, { ...pane, menuOpen: true })).toBeNull();
    expect(commandKey({ ...f, meta: true, shift: true }, pane)).toBeNull();
    expect(commandKey({ ...f, meta: true, alt: true }, pane)).toBeNull();
  });

  it("reads G with the Command key as the step to the next match, and with the Shift key as well as the step to the previous one, only while the find bar is open", () => {
    const g = { ...plain, code: "KeyG" };
    const finding = { ...free, paneInFront: true, finding: true };
    expect(commandKey({ ...g, meta: true }, finding)).toBe("findNext");
    expect(commandKey({ ...g, meta: true, shift: true }, finding)).toBe("findPrevious");
    // The bar's pane need not be the one in front.
    expect(commandKey({ ...g, meta: true }, { ...finding, paneInFront: false })).toBe("findNext");
    expect(commandKey({ ...g, meta: true }, { ...finding, finding: false })).toBeNull();
    expect(commandKey({ ...g, meta: true, shift: true }, { ...finding, finding: false })).toBeNull();
    expect(commandKey({ ...g, ctrl: true }, { ...finding, mac: false })).toBeNull();
    expect(commandKey({ ...g, meta: true }, { ...finding, dialogOpen: true })).toBeNull();
    expect(commandKey({ ...g, meta: true }, { ...finding, menuOpen: true })).toBeNull();
    expect(commandKey({ ...g, meta: true, alt: true }, finding)).toBeNull();
    // The Shift key still keeps K, N and W from the window while the bar is open.
    expect(commandKey({ ...plain, code: "KeyW", meta: true, shift: true }, finding)).toBeNull();
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

describe("closeSays", () => {
  it('says of one working pane what the dialog said before a close took several panes, with "Close pane"', () => {
    expect(closeSays(["Claude Code"], 1)).toEqual({ says: "Claude Code is working. Closing the pane ends its session.", confirm: "Close pane" });
  });

  it("names the one working pane among idle ones, and counts every pane the close ends", () => {
    expect(closeSays(["Claude Code"], 3)).toEqual({ says: "Claude Code is working. Closing 3 panes ends its session.", confirm: "Close 3 panes" });
  });

  it("names each working pane in the order given, and says that their sessions end", () => {
    expect(closeSays(["Claude Code 1", "Claude Code 2"], 2)).toEqual({ says: "Claude Code 1 and Claude Code 2 are working. Closing 2 panes ends their sessions.", confirm: "Close 2 panes" });
    expect(closeSays(["Claude Code 1", "Claude Code 2", "Claude Code 3"], 4)).toEqual({ says: "Claude Code 1, Claude Code 2 and Claude Code 3 are working. Closing 4 panes ends their sessions.", confirm: "Close 4 panes" });
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

describe("pasteAct", () => {
  it("hands the pane the paths of files that are on a disk, written as dropped files' paths are, before any text or image beside them (scenario D2)", () => {
    expect(pasteAct({ paths: ["/t/a b.png", "/t/c.txt"], text: true, image: true })).toEqual({ kind: "paths", text: "/t/a\\ b.png /t/c.txt " });
    expect(pasteAct({ paths: ["", "/t/c.txt"], text: false, image: false })).toEqual({ kind: "paths", text: "/t/c.txt " });
  });

  it("leaves a paste that holds text to the terminal, though an image stands beside it (scenario D2)", () => {
    expect(pasteAct({ paths: [], text: true, image: true })).toEqual({ kind: "text" });
    // A file with no path, as an image copied from a page arrives, is no path to hand on.
    expect(pasteAct({ paths: [""], text: true, image: true })).toEqual({ kind: "text" });
  });

  it("hands the pane the path of the image the main process writes, where the paste holds an image and no text (scenario D1)", () => {
    expect(pasteAct({ paths: [""], text: false, image: true })).toEqual({ kind: "image" });
    expect(pasteAct({ paths: [], text: false, image: true })).toEqual({ kind: "image" });
    // A path the pane could not take is no path either.
    expect(pasteAct({ paths: ["/t/a\tb.png"], text: false, image: true })).toEqual({ kind: "image" });
  });

  it("hands the pane nothing where the paste holds no path, no text and no image", () => {
    expect(pasteAct({ paths: [], text: false, image: false })).toBeNull();
    expect(pasteAct({ paths: ["", "/t/a\u001bb.png"], text: false, image: false })).toBeNull();
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

  it("holds the seven items in their order, \"Find\u2026\" after \"Select All\", with a rule before the two that clear and before the one that closes", () => {
    expect(texts(true, false)).toEqual(["Copy", "Paste", "Select All", "Find\u2026", "-", "Clear Screen", "Reset Terminal", "-", "Close Pane"]);
    expect(texts(false, true)).toEqual(texts(true, false));
  });

  it("names each item's act", () => {
    expect(paneMenu(true, true).flatMap((item) => (item === null ? [] : [item.act]))).toEqual(["copy", "paste", "selectAll", "find", "clear", "reset", "close"]);
  });

  it("shows the keys of Copy, Paste, Find\u2026 and Close Pane on a Mac keyboard, and no key on any other item", () => {
    expect(paneMenu(true, true).flatMap((item) => (item === null ? [] : [[item.text, item.keys]]))).toEqual([
      ["Copy", "\u2318C"],
      ["Paste", "\u2318V"],
      ["Select All", ""],
      ["Find\u2026", "\u2318F"],
      ["Clear Screen", ""],
      ["Reset Terminal", ""],
      ["Close Pane", "\u2318W"],
    ]);
  });

  it("shows no key on a keyboard without the Command key", () => {
    expect(paneMenu(false, true).flatMap((item) => (item === null ? [] : [item.keys]))).toEqual(["", "", "", "", "", "", ""]);
  });

  it("disables Copy where the terminal holds no selection, and no other item", () => {
    const disabled = (selection: boolean) => paneMenu(true, selection).flatMap((item) => (item !== null && !item.enabled ? [item.text] : []));
    expect(disabled(false)).toEqual(["Copy"]);
    expect(disabled(true)).toEqual([]);
  });
});

describe("findQuery and findCount (scenario A3)", () => {
  const bar = { text: "Error", matchCase: false, regex: false };

  it("searches what the field holds, with the case only where \"Match case\" is on, and as a regular expression only where \"Regular expression\" is on", () => {
    expect(findQuery(bar)).toEqual({ term: "Error", caseSensitive: false, regex: false });
    expect(findQuery({ ...bar, matchCase: true })).toEqual({ term: "Error", caseSensitive: true, regex: false });
    expect(findQuery({ ...bar, text: "err(or" })).toEqual({ term: "err(or", caseSensitive: false, regex: false });
    expect(findQuery({ ...bar, text: "err(or)?", regex: true, matchCase: true })).toEqual({ term: "err(or)?", caseSensitive: true, regex: true });
  });

  it("searches nothing where the field is empty", () => {
    expect(findQuery({ ...bar, text: "" })).toBeNull();
    expect(findQuery({ ...bar, text: "", regex: true })).toBeNull();
  });

  it("refuses a pattern that is no regular expression with a sentence, where \"Regular expression\" is on, and searches nothing", () => {
    expect(findQuery({ ...bar, text: "err(or", regex: true })).toEqual({ refusal: "Not a regular expression" });
    expect(findQuery({ ...bar, text: "[a-", regex: true, matchCase: true })).toEqual({ refusal: "Not a regular expression" });
    expect(findQuery({ ...bar, text: "a{2,1}", regex: true })).toEqual({ refusal: "Not a regular expression" });
  });

  it("counts from the newest match, which the add-on gives as the last of its results", () => {
    expect(findCount({ resultIndex: 16, resultCount: 17 })).toBe("1 of 17");
    expect(findCount({ resultIndex: 14, resultCount: 17 })).toBe("3 of 17");
    expect(findCount({ resultIndex: 0, resultCount: 17 })).toBe("17 of 17");
    expect(findCount({ resultIndex: 0, resultCount: FIND_LIMIT })).toBe("1,000 of 1,000");
  });

  it("says that nothing matched, and that it stopped counting past the limit, where the add-on counts one past it or names no match in front", () => {
    expect(findCount({ resultIndex: -1, resultCount: 0 })).toBe("No match");
    expect(findCount({ resultIndex: 3, resultCount: FIND_LIMIT + 1 })).toBe("More than 1,000 matches");
    expect(findCount({ resultIndex: -1, resultCount: FIND_LIMIT + 1 })).toBe("More than 1,000 matches");
    expect(findCount({ resultIndex: -1, resultCount: 12 })).toBe("More than 1,000 matches");
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

  it("keeps a line number, and a column after it, apart from the path at its end, and leaves them out of the link's range", () => {
    expect(pathCandidates("at src/a.ts:12 and src/b.ts:12:5")).toEqual([
      { text: "src/a.ts", start: 3, end: 11, line: 12 },
      { text: "src/b.ts", start: 19, end: 27, line: 12, column: 5 },
    ]);
    // As a search prints a match, and as a sentence closes on one.
    expect(pathCandidates("src/a.ts:12: const a = 1")).toEqual([{ text: "src/a.ts", start: 0, end: 8, line: 12 }]);
    expect(pathCandidates("(src/a.ts:12:5).")).toEqual([{ text: "src/a.ts", start: 1, end: 9, line: 12, column: 5 }]);
    // A path with no number has neither.
    expect(Object.keys(pathCandidates("src/a.ts")[0] ?? {})).toEqual(["text", "start", "end"]);
    // A number that is part of the name stays.
    expect(texts("logs/2026-11-20 v1/a:b")).toEqual(["logs/2026-11-20", "v1/a:b"]);
    expect(pathCandidates("v1/a:b")[0]?.line).toBeUndefined();
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

  it("reads the worktree of the view on screen, a folder inside a worktree and any other folder as another path", () => {
    expect(pathTarget(LOGIN.worktree, [LOGIN, SEARCH], LOGIN.id)).toEqual({ kind: "path", path: LOGIN.worktree });
    expect(pathTarget(`${SEARCH.worktree}/src`, [LOGIN, SEARCH], LOGIN.id)).toEqual({ kind: "path", path: `${SEARCH.worktree}/src` });
    expect(pathTarget("/etc", [LOGIN, SEARCH], LOGIN.id)).toEqual({ kind: "path", path: "/etc" });
    expect(pathTarget(SEARCH.worktree, [LOGIN], LOGIN.id)).toEqual({ kind: "path", path: SEARCH.worktree });
  });

  it("reads a path a file stands at as a file, with the line and the column the pane printed after it", () => {
    expect(pathTarget("/w/project/fix login/src/a.ts", [LOGIN, SEARCH], LOGIN.id, { line: 12, column: 5 })).toEqual({ kind: "file", path: "/w/project/fix login/src/a.ts", line: 12, column: 5 });
    expect(pathTarget("/etc/hosts", [LOGIN, SEARCH], LOGIN.id, { line: 3 })).toEqual({ kind: "file", path: "/etc/hosts", line: 3 });
    expect(pathTarget("/etc/hosts", [LOGIN, SEARCH], LOGIN.id, {})).toEqual({ kind: "file", path: "/etc/hosts" });
  });
});

describe("fileOpener", () => {
  it("opens a file in the editor the person chose, where the Mac still holds it", () => {
    expect(fileOpener({ chosen: "Zed", installed: ["Visual Studio Code", "Zed"] })).toEqual({ editor: "Zed" });
  });

  it("shows a file in Finder where the person chose Finder, where the chosen editor is gone, and where no choice was made and the Mac holds no editor of the list (scenario C5)", () => {
    expect(fileOpener({ chosen: "finder", installed: ["Visual Studio Code"] })).toBe("finder");
    expect(fileOpener({ chosen: "Zed", installed: ["Visual Studio Code"] })).toBe("finder");
    expect(fileOpener({ chosen: null, installed: [] })).toBe("finder");
  });

  it("asks where no choice was made and the Mac holds an editor of the list (scenario C3)", () => {
    expect(fileOpener({ chosen: null, installed: ["Xcode"] })).toBe("ask");
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

  const FILE: LinkTarget = { kind: "file", path: "/w/project/fix login/src/a.ts", line: 12, column: 5 };

  it("opens a file in the chosen editor at a click with the key, shows it in Finder with the Shift key as well, and copies its path from the card (scenarios C1 and C2)", () => {
    const zed = { editor: "Zed" };
    expect(linkClick("file", { ...none, meta: true }, true, zed)).toBe("editor");
    expect(linkClick("file", { ...none, meta: true, shift: true }, true, zed)).toBe("finder");
    expect(linkClick("file", none, true, zed)).toBeNull();
    expect(linkClick("file", { ...none, ctrl: true }, true, zed)).toBeNull();
    expect(linkCard(FILE, true, zed)).toEqual({
      title: "/w/project/fix login/src/a.ts",
      rows: [
        { text: "Open in Zed", keys: "⌘ Click", act: "editor" },
        { text: "Show in Finder", keys: "⇧ ⌘ Click", act: "finder" },
        { text: "Copy path", keys: "", act: "copy" },
      ],
    });
  });

  it('asks for an editor at a click with the key where none was chosen, and names the row "Open in an editor…" (scenario C3)', () => {
    expect(linkClick("file", { ...none, meta: true }, true, "ask")).toBe("editor");
    expect(linkClick("file", { ...none, meta: true, shift: true }, true, "ask")).toBe("finder");
    expect(linkCard(FILE, true, "ask").rows).toEqual([
      { text: "Open in an editor…", keys: "⌘ Click", act: "editor" },
      { text: "Show in Finder", keys: "⇧ ⌘ Click", act: "finder" },
      { text: "Copy path", keys: "", act: "copy" },
    ]);
  });

  it("gives a file the clicks and the card of a path where no editor opens it (scenario C5)", () => {
    for (const shift of [false, true]) expect(linkClick("file", { ...none, meta: true, shift }, true, "finder")).toBe("finder");
    expect(linkCard(FILE, true, "finder")).toEqual({ ...linkCard(PATH, true), title: FILE.path });
    // A file's link shows in Finder where no opener is named, as a path's does.
    expect(linkClick("file", { ...none, meta: true }, true)).toBe("finder");
  });

  it.each([true, false])("names on no row a key the click does not answer with that row's act (a Mac keyboard: %s)", (mac) => {
    // The click a row's keys name, read from the row's own words.
    const clickOf = (keys: string) => ({ meta: keys.includes("⌘"), ctrl: keys.includes("Ctrl"), shift: keys.includes("⇧") || keys.includes("Shift") });
    let named = 0;
    const cases: [LinkTarget, FileOpener | undefined][] = [
      [WEB, undefined],
      [WORK_ITEM, undefined],
      [PATH, undefined],
      [FILE, { editor: "Xcode" }],
      [FILE, "ask"],
      [FILE, "finder"],
    ];
    for (const [target, opener] of cases) {
      for (const { keys, act } of linkCard(target, mac, opener).rows) {
        if (keys === "") continue;
        expect(keys.endsWith(" Click")).toBe(true);
        expect(linkClick(target.kind, clickOf(keys), mac, opener)).toBe(act);
        named += 1;
      }
    }
    expect(named).toBe(9);
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

  it("keeps a parked work item's question before the question an agent asks, and the branch while a search is typed", () => {
    const asking = session(3, { state: "waiting", stateText: DATES.asks, stateQuestions: [DATES] });
    const parked: Question = { id: 1, asks: "Which base does the branch start from?", grounds: "No document names it.", by: "inspector", options: [], default: null, answer: null, since: null };
    expect(lineText({ ...two, questions: [parked] }, asking, false)).toEqual({ says: "question", text: "Which base does the branch start from?" });
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

  it("says that a work item has no branch yet, where it would say the branch, and while a search is typed", () => {
    const none = { ...LOGIN, branch: null, ownsBranch: false };
    expect([lineText(none, undefined, false), lineText({ ...none, newCommits: 2, commits: two.commits }, undefined, true)]).toEqual([
      { says: "branch", text: "No branch yet" },
      { says: "branch", text: "No branch yet" },
    ]);
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

  it("names the work item's account after the agent where one is given, and no account where none is", () => {
    const [entry] = workItemEntries([item], [], KINDS);
    expect(viewFacts(entry!, KINDS, NOW, "Work").slice(0, 2)).toEqual([
      { label: "Agent", value: "None" },
      { label: "Account", value: "Work" },
    ]);
    expect(viewFacts(entry!, KINDS, NOW, "").map((fact) => fact.label)).toEqual(["Agent", "Started", "Base", "Worktree"]);
  });
});

describe("accounts in the window", () => {
  const SYSTEM = { id: 0, name: "System default", made: false, folder: null, signedIn: null, loginEndsAt: null, limits: [], refresh: null };
  const WORK = { id: 1, name: "Work", made: false, folder: "/Users/person/.claude-work", signedIn: null, loginEndsAt: null, limits: [], refresh: null };
  const HOME = { id: 2, name: "Home", made: false, folder: "/Users/person/.claude-home", signedIn: null, loginEndsAt: null, limits: [], refresh: null };
  const HELD = { accounts: [SYSTEM, WORK, HOME], defaultId: 0 };

  it("holds the accounts and the default a daemon sends, and none against a daemon of an earlier build, which sends neither, so the window shows no account control and no account name (scenario 14)", () => {
    expect(heldAccounts({ accounts: [SYSTEM, WORK], defaultAccountId: 1 })).toEqual({ accounts: [SYSTEM, WORK], defaultId: 1, refreshesUsage: false });
    expect(heldAccounts({})).toBeNull();
    expect(offersAccounts(null)).toBe(false);
    expect(lineAccount({ ...LOGIN, accountId: 1 }, PROJECT, [], [], null)).toBe("");
    expect(viewAccount(LOGIN, PROJECT, null)).toBe("");
    expect(tabAccount(session(3, { accountId: 1 }), LOGIN, PROJECT, null)).toBe("");
    expect(accountRows(null, NOW)).toEqual([]);
  });

  it("offers a choice of account only where the daemon keeps one beside System default", () => {
    expect(offersAccounts({ accounts: [SYSTEM], defaultId: 0 })).toBe(false);
    expect(offersAccounts(HELD)).toBe(true);
  });

  it("names an account by its id, and an id the window holds no account of by nothing", () => {
    expect(accountName(HELD, 2)).toBe("Home");
    expect(accountName(HELD, 0)).toBe("System default");
    expect(accountName(HELD, 9)).toBe("");
  });

  it("names on a line the work item's account where it differs from the one its repository gives, else a running session's that differs, and nothing where every one is the repository's", () => {
    const repository = { ...PROJECT, accountId: 1 };
    expect(lineAccount({ ...LOGIN, accountId: 2 }, repository, [], [], HELD)).toBe("Home");
    expect(lineAccount({ ...LOGIN, accountId: 1 }, repository, [], [], HELD)).toBe("");
    expect(lineAccount(LOGIN, repository, [session(3, { accountId: 1 })], [], HELD)).toBe("");
    // A live pane of another account, and a working headless session of another.
    expect(lineAccount(LOGIN, repository, [session(3, { accountId: 0 })], [], HELD)).toBe("System default");
    expect(lineAccount(LOGIN, repository, [session(3, { accountId: 2, alive: false })], [], HELD)).toBe("");
    expect(lineAccount(LOGIN, repository, [session(3, { accountId: 2, workItemId: 2 })], [], HELD)).toBe("");
    expect(lineAccount(LOGIN, repository, [], [headless(4, { accountId: 2 })], HELD)).toBe("Home");
    expect(lineAccount(LOGIN, repository, [], [headless(4, { accountId: 2, state: "finished" })], HELD)).toBe("");
    // A session that waits for the machine runs under its account once it starts.
    expect(lineAccount(LOGIN, repository, [], [headless(4, { accountId: 2, state: "queued" })], HELD)).toBe("Home");
    // A repository set to none gives the default.
    expect(lineAccount({ ...LOGIN, accountId: 0 }, PROJECT, [], [], HELD)).toBe("");
    expect(lineAccount({ ...LOGIN, accountId: 0 }, PROJECT, [], [], { ...HELD, defaultId: 1 })).toBe("System default");
  });

  it("names in a work item's view the account its sessions take where they name none of their own: its own, else its repository's, else the default", () => {
    expect(viewAccount({ ...LOGIN, accountId: 2 }, { ...PROJECT, accountId: 1 }, HELD)).toBe("Home");
    expect(viewAccount(LOGIN, { ...PROJECT, accountId: 1 }, HELD)).toBe("Work");
    expect(viewAccount(LOGIN, PROJECT, { ...HELD, defaultId: 2 })).toBe("Home");
    expect(viewAccount(LOGIN, undefined, HELD)).toBe("System default");
  });

  it("names on a pane's tab the pane's account where it differs from the work item's, and nothing for a pane launched under none or under the work item's", () => {
    expect(tabAccount(session(3, { accountId: 2 }), LOGIN, { ...PROJECT, accountId: 1 }, HELD)).toBe("Home");
    expect(tabAccount(session(3, { accountId: 1 }), LOGIN, { ...PROJECT, accountId: 1 }, HELD)).toBe("");
    expect(tabAccount(session(3, { accountId: null }), LOGIN, { ...PROJECT, accountId: 1 }, HELD)).toBe("");
    expect(tabAccount(session(3), LOGIN, { ...PROJECT, accountId: 1 }, HELD)).toBe("");
  });

  it("lists the rows of the Accounts dialog in the daemon's order, each with its name, its folder, whether it is the default, whether it keeps its name, its sign-in in words and whether it offers one", () => {
    expect(accountRows({ ...HELD, defaultId: 1 }, NOW)).toEqual([
      { id: 0, name: "System default", folder: "The folder your login shell gives Claude Code", isDefault: false, fixed: true, signIn: null, offersSignIn: false, usage: [], refreshed: null, offersRefresh: false },
      { id: 1, name: "Work", folder: "/Users/person/.claude-work", isDefault: true, fixed: false, signIn: "Sign-in not read yet", offersSignIn: true, usage: [], refreshed: null, offersRefresh: false },
      { id: 2, name: "Home", folder: "/Users/person/.claude-home", isDefault: false, fixed: false, signIn: "Sign-in not read yet", offersSignIn: true, usage: [], refreshed: null, offersRefresh: false },
    ]);
  });

  it("offers \"Refresh usage\" on a row, with what a refresh spends said beside it, only where the daemon refreshes usage, no refresh of the account runs, and no live pane nor working session runs under it (scenario 15's control)", () => {
    const held = { ...HELD, refreshesUsage: true };
    const offers = (heldNow: HeldAccounts, sessions: SessionInfo[] = [], running: HeadlessInfo[] = []): boolean[] => accountRows(heldNow, NOW, sessions, running).map((row) => row.offersRefresh);
    expect(offers(held)).toEqual([true, true, true]);
    expect(offers(HELD)).toEqual([false, false, false]);
    expect(offers({ ...held, refreshesUsage: false })).toEqual([false, false, false]);
    expect(offers(held, [session(3, { accountId: 1 }), session(4, { accountId: 2, alive: false })])).toEqual([true, false, true]);
    expect(offers(held, [], [headless(5, { accountId: 2 }), headless(6, { accountId: 0, state: "finished" })])).toEqual([true, true, false]);
    // A session that waits for the machine will hand over its values once it starts, as the daemon reads it.
    expect(offers(held, [], [headless(5, { accountId: 1, state: "queued" })])).toEqual([true, false, true]);
    expect(offers({ ...held, accounts: [SYSTEM, { ...WORK, refresh: { state: "running", startedAt: NOW } }, HOME] })).toEqual([true, false, true]);
    expect(REFRESH_SAYS).toBe("A refresh starts one short Claude Code session under the account, and uses a little of its limit.");
  });

  it("says each limit value the CLI handed over with its window and its time, and no number it did not hand over; and the last refresh, running or ended, with what it handed over and its cost (scenario 15's row)", () => {
    const rowOf = (account: Partial<Account>): { usage: string[]; refreshed: string | null } => {
      const { usage, refreshed } = accountRows({ accounts: [SYSTEM, { ...WORK, ...account }], defaultId: 0 }, NOW)[1]!;
      return { usage, refreshed };
    };
    expect(
      rowOf({
        limits: [
          { status: "near", used: 0.42, resetsAt: NOW + 90 * 60_000, window: "five_hour", at: NOW - 5 * 60_000 },
          { status: "ok", used: null, resetsAt: null, window: "seven_day", at: NOW - 5 * 60_000 },
          { status: null, used: null, resetsAt: null, window: null, at: NOW },
          { status: "reached", used: 1, resetsAt: NOW - 60_000, window: "an_hourly", at: NOW - 3 * 3_600_000 },
        ],
      }).usage,
    ).toEqual([
      "5-hour limit: near the limit, 42% used, resets in 1 h 30 min, as of 5 min ago",
      "Weekly limit: within the limit, as of 5 min ago",
      "Usage limit: Claude Code gave no value, as of less than a minute ago",
      "an_hourly: the limit is reached, 100% used, its reset time has passed, as of 3 h ago",
    ]);
    expect(rowOf({}).usage).toEqual([]);
    expect(rowOf({}).refreshed).toBeNull();
    expect(rowOf({ refresh: { state: "running", startedAt: NOW } }).refreshed).toBe("Refreshing the usage\u2026");
    const converted = { costUsd: 0.003, converted: true, models: [] };
    expect(rowOf({ refresh: { state: "ended", at: NOW - 2 * 60_000, handed: 1, usage: converted, error: null } }).refreshed).toBe("Refreshed 2 min ago. It cost under $0.01, converted at API prices and not charged.");
    expect(rowOf({ refresh: { state: "ended", at: NOW, handed: 0, usage: { ...converted, costUsd: 0.02, converted: false }, error: null } }).refreshed).toBe("The refresh less than a minute ago ended, and Claude Code handed over no usage value. It cost $0.02.");
    expect(rowOf({ refresh: { state: "ended", at: NOW, handed: 0, usage: null, error: "The refresh gave no result within a minute and was stopped." } }).refreshed).toBe("The refresh less than a minute ago failed: The refresh gave no result within a minute and was stopped. It reported no cost.");
  });

  it("says each account's sign-in as the agent last gave it: not signed in, signed in with no end named, the time until its login ends, and that it may have ended once that time is past (the sign-in of scenario 11)", () => {
    const signIn = (signedIn: boolean | null, loginEndsAt: number | null): string | null => accountRows({ accounts: [SYSTEM, { ...WORK, made: true, signedIn, loginEndsAt }], defaultId: 0 }, NOW)[1]!.signIn;
    expect(signIn(false, null)).toBe("Not signed in");
    expect(signIn(true, null)).toBe("Signed in");
    expect(signIn(true, NOW + 26 * 24 * 3_600_000)).toBe("Signed in, the login ends in 26 days");
    expect(signIn(true, NOW + 90 * 60_000)).toBe("Signed in, the login ends in 1 h 30 min");
    expect(signIn(true, NOW)).toBe("Signed in, the login may have ended");
    expect(signIn(true, NOW - 60_000)).toBe("Signed in, the login may have ended");
    expect(signIn(null, null)).toBe("Sign-in not read yet");
  });

  it("names before a removal each repository and work item, archived among them, whose setting is cleared, and a default that goes back to System default, and says what becomes of the account's folder (scenario 13's dialog)", () => {
    const made = { ...WORK, made: true, folder: "/Users/person/Owlery/run/accounts/1" };
    const held = { accounts: [SYSTEM, made, HOME], defaultId: 1 };
    const other = { ...PROJECT, id: 2, name: "other", accountId: 2 };
    const workItems = [{ ...LOGIN, accountId: 1 }, { ...SEARCH, accountId: 2 }];
    const archived = [{ ...LOGIN, id: 3, title: "An old one", archivedAt: NOW, accountId: 1 }];
    expect(accountRemoval(held, 1, [{ ...PROJECT, accountId: 1 }, other], workItems, archived)).toEqual({
      says: 'Remove "Work"? Owlery signs its folder out with Claude Code and removes the folder.',
      cleared: ["The default goes back to System default.", "The repository project goes back to the default.", 'The work item "Fix the login bug" goes back to its repository\'s account.', 'The work item "An old one" goes back to its repository\'s account.'],
    });
    expect(accountRemoval(held, 2, [PROJECT, other], workItems, [])).toEqual({
      says: 'Remove "Home"? Its folder stays as it is: /Users/person/.claude-home',
      cleared: ["The repository other goes back to the default.", 'The work item "Speed up search" goes back to its repository\'s account.'],
    });
    expect(accountRemoval(held, 9, [PROJECT], workItems, [])).toBeNull();
    expect(accountRemoval(held, 0, [PROJECT], workItems, [])).toBeNull();
  });

  it("lists a sign-in pane, which runs in no work item, on no work item's line, tabs or view, and names it by its kind alone among what the app's end would end (scenario 6's window)", () => {
    const signIn = session(9, { kind: "shell", workItemId: null, accountId: 1, signsIn: 1 });
    expect(paneTabs(LOGIN, [signIn])).toEqual([]);
    expect(inboxLine(LOGIN, [signIn], KINDS)).toEqual(inboxLine(LOGIN, [], KINDS));
    expect(lineAccount(LOGIN, { ...PROJECT, accountId: 2 }, [signIn], [], HELD)).toBe("");
    expect(runningSessions([LOGIN], [], [signIn], [], KINDS)).toEqual({ running: ["Shell"], queued: [] });
  });

  it("gives an account's menu a first choice that leaves the account to the setting above, named with the account it gives, then each account in the daemon's order", () => {
    expect(accountChoices(HELD, "The default", 1)).toEqual([
      { value: "", label: "The default (Work)" },
      { value: "0", label: "System default" },
      { value: "1", label: "Work" },
      { value: "2", label: "Home" },
    ]);
  });

  it("gives a button that opens a pane of a kind that takes an account a menu whose first item opens it under the account the work item gives, named \"The work item's\" with that account's name, and the other accounts after it, and says so in the button's tooltip; gives none to a kind that takes no account, and none where no account stands beside System default (scope item 10)", () => {
    const kinds: PaneKindInfo[] = KINDS.map((kind) => ({ ...kind, accounts: kind.kind === "claude" }));
    const claude = kinds.find((kind) => kind.kind === "claude");
    expect(newPaneMenu(claude, HELD, 1)).toEqual([
      { label: "The work item's (Work)", description: "Open the pane under the account the work item gives", action: { do: "pane", accountId: null }, divides: false },
      { label: "System default", description: "Open the pane under System default", action: { do: "pane", accountId: 0 }, divides: true },
      { label: "Home", description: "Open the pane under Home", action: { do: "pane", accountId: 2 }, divides: false },
    ]);
    expect(newPaneMenu(kinds.find((kind) => kind.kind === "shell"), HELD, 1)).toEqual([]);
    expect(newPaneMenu(claude, { accounts: [SYSTEM], defaultId: 0 }, 0)).toEqual([]);
    expect(newPaneMenu(claude, null, 0)).toEqual([]);
    expect(paneButtonTitle(null, true)).toBe("Right-click to open it under another account");
    expect(paneButtonTitle("Start on the latest conversation of this worktree", true)).toBe("Start on the latest conversation of this worktree. Right-click to open it under another account");
    expect([paneButtonTitle(null, false), paneButtonTitle("Start on the latest conversation of this worktree", false)]).toEqual(["", "Start on the latest conversation of this worktree"]);
  });

  it("offers to change the account of a running Claude Code pane to each account that keeps the pane's account's conversations, and says before the change that a turn under way is cut; offers nothing where no account keeps them, for a shell, a sign-in pane, an ended pane, a pane of a daemon of an earlier build, and where no account stands beside System default (scenarios 8 and 9's window)", () => {
    const kinds: PaneKindInfo[] = KINDS.map((kind) => ({ ...kind, accounts: true }));
    // A keeps the conversations B keeps, C keeps its own, D keeps none, and System default's folder is not found yet.
    const kept = "/Users/person/.claude/projects";
    const [a, b, c, d] = [
      { ...WORK, id: 1, name: "A", conversations: kept },
      { ...HOME, id: 2, name: "B", conversations: kept },
      { ...HOME, id: 3, name: "C", folder: "/Users/person/.claude-c", conversations: "/Users/person/.claude-c/projects" },
      { ...HOME, id: 4, name: "D", folder: "/Users/person/.claude-d", conversations: null },
    ];
    const shared = { accounts: [{ ...SYSTEM, conversations: null }, a, b, c, d], defaultId: 0 };
    const running = session(3, { accountId: 1 });
    expect(paneAccountChange(running, "Claude Code", kinds, shared)).toEqual({
      heading: "Change the account of Claude Code",
      says: "Owlery ends the pane's process and resumes its conversation under the account you choose. A turn under way is cut.",
      choices: [{ value: "2", label: "B" }],
    });
    expect(paneAccountChange(running, "Claude Code", kinds, { accounts: [{ ...SYSTEM, conversations: null }, a, c, d], defaultId: 0 })).toBeNull();
    // Two accounts that keep no conversations keep none in common, and a daemon that sends no place offers none.
    expect(paneAccountChange(session(3, { accountId: 4 }), "Claude Code", kinds, shared)).toBeNull();
    expect(paneAccountChange(running, "Claude Code", kinds, HELD)).toBeNull();
    expect(paneAccountChange(session(4, { kind: "shell", accountId: 1 }), "Shell", kinds, shared)).toBeNull();
    expect(paneAccountChange(session(9, { kind: "shell", workItemId: null, accountId: 1, signsIn: 1 }), "Shell", kinds, shared)).toBeNull();
    expect(paneAccountChange({ ...running, alive: false }, "Claude Code", kinds, shared)).toBeNull();
    expect(paneAccountChange(running, "Claude Code", KINDS, shared)).toBeNull();
    expect(paneAccountChange(session(5), "Claude Code", kinds, shared)).toBeNull();
    expect(paneAccountChange(running, "Claude Code", kinds, { accounts: [SYSTEM], defaultId: 0 })).toBeNull();
    expect(paneAccountChange(running, "Claude Code", kinds, null)).toBeNull();
    // The pane's menu offers it before "Close Pane", only for such a pane.
    expect(paneMenu(true, false, true).flatMap((item) => (item === null ? ["-"] : [`${item.text}${item.keys === "" ? "" : ` ${item.keys}`}`])).slice(-3)).toEqual(["-", "Change Account\u2026", "Close Pane \u2318W"]);
    expect(paneMenu(true, false).some((item) => item?.act === "account")).toBe(false);
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
      { path: "agentory/README.md", text: "# What IADD keeps in agentory/\n" },
      { path: "agentory/config.json", text: '{\n  "Broad gate": "pnpm test"\n}\n' },
      { path: ".github/workflows/owlery-inspection.yml", text: "name: inspection\n" },
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
    expect(words.gate).toEqual({ shown: true, enabled: true, label: "Broad gate command", value: "pnpm test", says: "Kept in `agentory/config.json`, under `Broad gate`." });
    expect(words.submit).toEqual({ shown: true, enabled: true, label: "Set up and commit" });
    expect(words.cancel).toBe("Not now");
  });

  it("says the scope and offers no commit until the daemon has answered, while the plan is of another command than the field holds, and while the command of a new config.json is empty", () => {
    const waiting = recordsDialog(PROJECT, null, "", null);
    expect([waiting.scope, waiting.commit, waiting.files, waiting.submit]).toEqual([OUT_OF_SCOPE, "", [], { shown: true, enabled: false, label: "Set up and commit" }]);
    expect(recordsDialog(PROJECT, PLAN, "pnpm tes", "pnpm test").submit.enabled).toBe(false);
    expect(recordsDialog(PROJECT, PLAN, "  ", "  ").submit.enabled).toBe(false);
    // A setup that writes no config.json needs no command.
    expect(recordsDialog({ ...PROJECT, records: { root: "inspection", check: null, broadGate: null } }, kept(PLAN, "agentory/README.md", "agentory/config.json"), "", "").submit.enabled).toBe(true);
  });

  it("says of a file that stands that it is kept, and turns the field off where config.json stands: it shows the key's value, or says that the file holds no such key", () => {
    const plan = kept(PLAN, "agentory/README.md", "agentory/config.json");
    const valued = recordsDialog({ ...PROJECT, records: { root: "inspection", check: null, broadGate: "make check" } }, plan, "", "");
    expect(valued.files).toEqual([
      { path: "agentory/README.md", text: null, says: "`agentory/README.md` stands and is kept." },
      { path: "agentory/config.json", text: null, says: "`agentory/config.json` stands and is kept." },
      { path: ".github/workflows/owlery-inspection.yml", text: "name: inspection\n", says: "" },
    ]);
    expect(valued.gate).toEqual({ shown: true, enabled: false, label: "Broad gate command", value: "make check", says: "Kept in `agentory/config.json`, under `Broad gate`." });
    expect(valued.submit.enabled).toBe(true);
    const keyless = recordsDialog({ ...PROJECT, records: { root: "inspection", check: null, broadGate: null } }, plan, "", "");
    expect(keyless.gate).toEqual({ shown: true, enabled: false, label: "Broad gate command", value: "", says: "No `Broad gate` key in `agentory/config.json`." });
  });

  it("shows, for a repository that holds every part, the root, the workflow and the command with the file that holds it, and offers no commit", () => {
    const plan = kept(PLAN, "agentory/README.md", "agentory/config.json", ".github/workflows/owlery-inspection.yml");
    const whole = recordsDialog({ ...PROJECT, records: { root: "agentory", check: ".github/workflows/owlery-inspection.yml", broadGate: "make check" } }, plan, "", "");
    expect(whole.scope).toBe(OUT_OF_SCOPE);
    expect(whole.holds).toEqual(["Records: `agentory/`", "Check: `.github/workflows/owlery-inspection.yml`", "Broad gate: `make check`, kept in `agentory/config.json` under `Broad gate`"]);
    expect([whole.commit, whole.files, whole.gate.shown, whole.submit.shown, whole.cancel]).toEqual(["", [], false, false, "Close"]);
    const keyless = recordsDialog({ ...PROJECT, records: { root: "agentory", check: ".github/workflows/owlery-inspection.yml", broadGate: null } }, plan, "", "");
    expect(keyless.holds[2]).toBe("No `Broad gate` key in `agentory/config.json`.");
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

  it("tells an administrator how to make the inspection check required, in a plan and in a repository that holds every part", () => {
    const REQUIRED = "The workflow posts its verdict as the check `inspection` on each pull request's head commit. To hold a pull request until it is cleared, an administrator of the repository requires `inspection` on GitHub, in the repository's rules for the base branch, under the rule that requires status checks to pass. A pull request from a fork gets no `inspection` check, so a required one holds it until an administrator lets it through. Owlery changes no setting of the repository on GitHub.";
    expect(recordsDialog(PROJECT, PLAN, "pnpm test", "pnpm test").required).toBe(REQUIRED);
    const owlery = recordsDialog({ ...PROJECT, records: { root: "inspection", check: ".github/workflows/owlery-inspection.yml", broadGate: "make check" } }, kept(PLAN, "agentory/README.md", "agentory/config.json", ".github/workflows/owlery-inspection.yml"), "", "");
    expect([owlery.holds.length, owlery.required]).toEqual([3, REQUIRED]);
    // Until the daemon answers, where it refused the plan, and where a plan names no workflow, nothing is said of a check.
    expect([recordsDialog(PROJECT, null, "", null).required, recordsDialog(PROJECT, { error: "no repository 1" }, "", "").required, recordsDialog(PROJECT, { ...PLAN, files: PLAN.files.slice(0, 2) }, "pnpm test", "pnpm test").required]).toEqual(["", "", ""]);
  });

  it("says where the command in the field is the one the daemon read from the repository, and stops saying so once the person changed it", () => {
    const plan = { ...PLAN, proposedBroadGate: "pnpm run check" };
    expect(recordsDialog(PROJECT, plan, "pnpm run check", "pnpm run check").gate.says).toBe("Kept in `agentory/config.json`, under `Broad gate`. Owlery read this command from the repository's `package.json`: change it where the repository's whole check is another.");
    expect(recordsDialog(PROJECT, plan, "pnpm run check && pnpm lint", "pnpm run check && pnpm lint").gate.says).toBe("Kept in `agentory/config.json`, under `Broad gate`.");
  });

  describe("a move of the records from the earlier form", () => {
    const WORKFLOW = ".github/workflows/owlery-inspection.yml";
    const EARLIER: Repository = { ...PROJECT, records: { root: null, check: null, broadGate: null, olderCheck: null, earlier: "seal" } };
    const MIGRATION: RecordsPlan = {
      branch: "main",
      subject: "chore: move the work records and the pull request check to IADD's forms",
      files: [{ path: WORKFLOW, text: "name: inspection\n" }],
      blocked: null,
      proposedBroadGate: null,
      move: null,
      migration: {
        from: "seal",
        moves: [
          { from: "seal/README.md", to: "agentory/README.md", rewritten: true },
          { from: "seal/config.json", to: "agentory/config.json", rewritten: false },
          { from: "seal/threads/1-x/guarantee.md", to: "agentory/threads/1-x/inspection.md", rewritten: true },
        ],
        removes: [".github/workflows/owlery-seal.yml"],
      },
      unread: [],
      stamp: "g",
    };

    it("says where the records stand and what the commit does with them, names each file that moves and where, the earlier workflow it removes and the workflow it writes whole, hides the field, and offers the move's commit", () => {
      const words = recordsDialog(EARLIER, MIGRATION, "", "");
      expect(words.move).toBe(
        "The work records of this repository stand in `seal/`, in the earlier form of the records, which Owlery reads no record of and runs no chain on. The commit moves each file to `agentory/`, with its records rewritten in IADD's forms and every other line as it stands. It rewrites no earlier commit. An inspection cleared before the move lapses at the move's commit, since the move changes paths outside each work item's closing records, and a work item inspected on the move's commit is cleared. A repository whose rules require the check the removed workflow posted requires a check no workflow posts once this commit lands: an administrator requires `inspection` in its place.",
      );
      expect(words.commit).toBe("This makes one commit on `main`: `chore: move the work records and the pull request check to IADD's forms`. Nothing is pushed.");
      expect(words.files).toEqual([
        { path: "seal/README.md", text: null, says: "`seal/README.md` moves to `agentory/README.md`, rewritten in IADD's forms." },
        { path: "seal/config.json", text: null, says: "`seal/config.json` moves to `agentory/config.json` as it stands." },
        { path: "seal/threads/1-x/guarantee.md", text: null, says: "`seal/threads/1-x/guarantee.md` moves to `agentory/threads/1-x/inspection.md`, rewritten in IADD's forms." },
        { path: ".github/workflows/owlery-seal.yml", text: null, says: "The commit removes `.github/workflows/owlery-seal.yml`." },
        { path: WORKFLOW, text: "name: inspection\n", says: "The commit writes this file whole." },
      ]);
      expect([words.gate.shown, words.holds, words.unread, words.submit]).toEqual([false, [], null, { shown: true, enabled: true, label: "Move and commit" }]);
      expect(words.required).toContain("an administrator of the repository requires `inspection` on GitHub");
      // A move that writes no workflow, since Owlery's stands, is still the move, and not a repository that holds every part.
      const kept = recordsDialog(EARLIER, { ...MIGRATION, files: [] }, "", "");
      expect([kept.files.length, kept.holds, kept.submit.label]).toEqual([4, [], "Move and commit"]);
      // A blocked move names no commit and turns the button off.
      const blocked = recordsDialog(EARLIER, { ...MIGRATION, blocked: "The earlier form's reader refuses a line of these records." }, "", "");
      expect([blocked.blocked, blocked.commit, blocked.submit.enabled]).toEqual(["The earlier form's reader refuses a line of these records.", "", false]);
    });
  });

  describe("a move of the check", () => {
    const WORKFLOW = ".github/workflows/owlery-inspection.yml";
    const HOLDING: Repository = { ...PROJECT, records: { root: "inspection", check: WORKFLOW, broadGate: "make check", olderCheck: "0.0.4" } };
    const REFUSED = "the reader refuses line 4 of agentory/threads/1-refused/trail/rounds/round-1.md: a round block needs a `target:` line";
    const MOVE: RecordsPlan = {
      branch: "main",
      subject: "chore: move the pull request check to Owlery 0.1.0",
      files: [
        { path: "agentory/README.md", text: null },
        { path: "agentory/config.json", text: null },
        { path: WORKFLOW, text: "name: inspection\n# --branch v0.1.0\n" },
      ],
      blocked: null,
      proposedBroadGate: null,
      move: { from: "0.0.4", to: "0.1.0" },
      unread: [{ id: 3, title: "Refused work", why: REFUSED }],
      stamp: "m",
    };
    const READ = "Owlery read the round records, the broad gate's run and the inspection of each work item of this repository at its branch's head, with the readers that cases hold to the check's answers. It read none of the check's other arms.";
    /** What was read, where an entry named may be a work item that was not read. */
    const READ_BUT = "Owlery read the round records, the broad gate's run and the inspection at its branch's head of each work item of this repository but those named here as not read, with the readers that cases hold to the check's answers. It read none of the check's other arms.";

    it("says both versions, shows the commit's branch and subject and the workflow alone and whole with the sentence that it replaces the committed file, names each work item whose records the readers refuse or did not read with its sentence and what was read, hides the field, and offers Move and commit", () => {
      const words = recordsDialog(HOLDING, MOVE, "", "");
      expect(words.move).toBe("`.github/workflows/owlery-inspection.yml` fetches the pull request check of Owlery 0.0.4, older than this app. The commit moves it to Owlery 0.1.0.");
      expect(words.commit).toBe("This makes one commit on `main`: `chore: move the pull request check to Owlery 0.1.0`. Nothing is pushed.");
      expect(words.blocked).toBe("");
      expect(words.files).toEqual([{ path: WORKFLOW, text: "name: inspection\n# --branch v0.1.0\n", says: "The commit writes this text over the committed `.github/workflows/owlery-inspection.yml`, whole." }]);
      expect(words.unread).toEqual({ head: "Work items whose records Owlery's readers refuse or did not read", items: [{ name: "Refused work", why: REFUSED }], says: `${READ_BUT} Once the check moves, it may refuse the pull requests of the work items named.` });
      // A work item the daemon did not read is named under the same head, with its own sentence.
      const NOT_READ = "Owlery has not read this work item's branch yet, so its records were not read, and whether the moved check refuses them is not known.";
      expect(recordsDialog(HOLDING, { ...MOVE, unread: [{ id: 4, title: "Unread work", why: NOT_READ }] }, "", "").unread).toEqual({ head: "Work items whose records Owlery's readers refuse or did not read", items: [{ name: "Unread work", why: NOT_READ }], says: `${READ_BUT} Once the check moves, it may refuse the pull requests of the work items named.` });
      expect([words.holds, words.gate.shown]).toEqual([[], false]);
      expect(words.submit).toEqual({ shown: true, enabled: true, label: "Move and commit" });
      expect(words.cancel).toBe("Not now");
    });

    it("says what was read where the readers refuse no work item's records, and that the check's other arms may still refuse a pull request", () => {
      for (const unread of [[], undefined]) {
        expect(recordsDialog(HOLDING, { ...MOVE, unread }, "", "").unread).toEqual({ head: "", items: [], says: `${READ} They refuse no work item's records, and the moved check may still refuse a pull request through another arm.` });
      }
    });

    it("turns Move and commit off where the move is blocked, and still says both versions and shows the workflow", () => {
      const blocked = recordsDialog(HOLDING, { ...MOVE, blocked: "This checkout does not hold `.github/workflows/owlery-inspection.yml` as the commit it stands at does." }, "", "");
      expect([blocked.blocked, blocked.commit, blocked.submit]).toEqual(["This checkout does not hold `.github/workflows/owlery-inspection.yml` as the commit it stands at does.", "", { shown: true, enabled: false, label: "Move and commit" }]);
      expect([blocked.move === "", blocked.files.map((file) => file.path)]).toEqual([false, [WORKFLOW]]);
    });

    it("says nothing of a move, and no work item, for a plan that moves nothing and for one of a daemon of an earlier build", () => {
      const { move: _, unread: __, ...earlier } = { ...PLAN, move: null, unread: [] };
      for (const plan of [{ ...PLAN, move: null, unread: [] }, earlier]) {
        const words = recordsDialog(PROJECT, plan, "pnpm test", "pnpm test");
        expect([words.move, words.unread, words.submit.label]).toEqual(["", null, "Set up and commit"]);
      }
      expect([recordsDialog(PROJECT, null, "", null).move, recordsDialog(PROJECT, null, "", null).unread]).toEqual(["", null]);
    });
  });
});

describe("lacksRecords", () => {
  it("is true of a repository with no root or no workflow, false of one that holds both, and false of a repository of a daemon that sends no records, for which no setup is offered", () => {
    const holding = (root: string | null, check: string | null): Repository => ({ ...PROJECT, records: { root, check, broadGate: null } });
    expect([lacksRecords(holding(null, null)), lacksRecords(holding("inspection", null)), lacksRecords(holding(null, ".github/workflows/owlery-inspection.yml")), lacksRecords(holding("inspection", ".github/workflows/owlery-inspection.yml"))]).toEqual([true, true, true, false]);
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

describe("a work item's pull request", () => {
  const HEAD = "3f2a9c1e5b7d9f01a2c4e6f8091b3d5f7a9c1e3b";
  const URL = "https://github.com/owner/project/pull/12";
  const pullRequest = (fields: Partial<PullRequest> = {}): PullRequest => ({ number: 12, url: URL, state: "open", head: HEAD, pushed: HEAD, checks: "none", list: [], listCount: 0, readAt: 1, failure: null, ...fields });
  const BUILD_FAILED = { name: "build", state: "failed", link: "https://github.com/owner/project/runs/2" } as const;
  const INSPECTION_PASSED = { name: "inspection", state: "passed", link: "https://github.com/owner/project/runs/1" } as const;
  const with_ = (fields: Partial<PullRequest>): WorkItem => ({ ...LOGIN, pullRequest: pullRequest(fields) });
  const PENDING = with_({ checks: "pending", list: [{ name: "inspection", state: "pending", link: null }], listCount: 1 });
  const PASSED = with_({ checks: "passed", list: [INSPECTION_PASSED], listCount: 1 });
  const FAILED = with_({ checks: "failed", list: [BUILD_FAILED, { name: "lint", state: "failed", link: null }, INSPECTION_PASSED], listCount: 3 });
  const OPEN = with_({});
  const MERGED = with_({ state: "merged", checks: "passed", list: [INSPECTION_PASSED], listCount: 1 });
  const CLOSED = with_({ state: "closed" });
  const RESTS: Chain = { state: "rested", says: "Pull request #12 is open.", since: 5, stages: [] };

  it("gives the line the state of the pull request's checks where no pane and no chain says more: working while they run, waiting where one failed, finished where they passed or there are none, and finished for a merged and a closed pull request", () => {
    expect([PENDING, FAILED, PASSED, OPEN, MERGED, CLOSED].map((workItem) => inboxLine(workItem, [], KINDS).state)).toEqual(["working", "waiting", "finished", "finished", "finished", "finished"]);
    // A finished pane and a chain that rests say no more than the pull request.
    expect(inboxLine({ ...FAILED, chain: RESTS }, [session(2, { state: "finished" })], KINDS).state).toBe("waiting");
    const entries = workItemEntries([PENDING, { ...FAILED, id: 2 }, { ...PASSED, id: 3 }], [], KINDS);
    expect(inboxSummary(entries.map((entry) => entry.line))).toBe("1 needs you, 1 working, 1 finished");
    // The finished pane's time is not the time the check failed, and the daemon reads none, so the line says no age.
    expect(lineSince({ ...FAILED, chain: RESTS }, session(2, { state: "finished", stateSince: 40 }))).toBeNull();
    expect(lineSince(LOGIN, session(2, { state: "finished", stateSince: 40 }))).toBe(40);
    expect(lineSince(FAILED, session(2, { state: "working", stateSince: 50 }))).toBe(50);
  });

  it("says the result in the line's second row, and names the first failed check", () => {
    const said = (workItem: WorkItem) => lineText({ ...workItem, commits: [{ hash: "a".repeat(40), subject: "feat: greet", at: 1, added: null, removed: null } as CommitInfo] }, undefined, false);
    expect([PENDING, FAILED, PASSED, OPEN, MERGED, CLOSED].map((workItem) => said(workItem))).toEqual([
      { says: "pull-request", text: "Checks running" },
      { says: "pull-request", text: "Check failed: build" },
      { says: "pull-request", text: "Checks passed" },
      { says: "pull-request", text: "Pull request open" },
      { says: "pull-request", text: "Merged" },
      { says: "pull-request", text: "Closed" },
    ]);
    // The first failed check is named, wherever it stands in the list.
    expect(said(with_({ checks: "failed", list: [INSPECTION_PASSED, BUILD_FAILED], listCount: 2 })).text).toBe("Check failed: build");
    // A search shows the branch, as it does on every line.
    expect(lineText(FAILED, undefined, true)).toEqual({ says: "branch", text: LOGIN.branch });
    // A work item without a pull request says what it said before.
    expect(lineText({ ...LOGIN, chain: RESTS }, undefined, false)).toEqual({ says: "branch", text: LOGIN.branch });
  });

  it("lists in the view the pull request's number with its address, its state, the result of its checks, each check with its mark, its state's word and its address, how many more checks there are, and why the last read failed", () => {
    const passed = { name: "inspection", mark: "finished", words: "Passed", link: INSPECTION_PASSED.link };
    expect(pullRequestFacts(PASSED)).toEqual({ head: "Pull request #12", url: URL, state: "Open", checks: "Checks passed", rows: [passed], foot: "", failure: "" });
    expect(pullRequestFacts(PENDING)).toEqual({ head: "Pull request #12", url: URL, state: "Open", checks: "Checks running", rows: [{ name: "inspection", mark: "working", words: "Running", link: null }], foot: "", failure: "" });
    // The checks in the order the daemon keeps them, the failed ones first.
    expect(pullRequestFacts(FAILED)).toMatchObject({ checks: "2 checks failed", rows: [{ name: "build", mark: "failed", words: "Failed", link: BUILD_FAILED.link }, { name: "lint", mark: "failed", words: "Failed", link: null }, passed] });
    expect(pullRequestFacts(with_({ checks: "failed", list: [BUILD_FAILED, INSPECTION_PASSED], listCount: 2 }))?.checks).toBe("1 check failed");
    expect(pullRequestFacts(OPEN)).toMatchObject({ checks: "No checks", rows: [] });
    expect([MERGED, CLOSED].map((workItem) => pullRequestFacts(workItem)?.state)).toEqual(["Merged", "Closed"]);
    // GitHub listed more checks than the daemon keeps.
    expect(pullRequestFacts(with_({ checks: "passed", list: [INSPECTION_PASSED], listCount: 4 }))?.foot).toBe("3 more checks");
    expect(pullRequestFacts(with_({ checks: "passed", list: [INSPECTION_PASSED], listCount: 2 }))?.foot).toBe("1 more check");
    // A read that failed keeps the facts of the read before it, and the view says so under the rows.
    expect(pullRequestFacts(with_({ checks: "passed", list: [INSPECTION_PASSED], listCount: 1, failure: "gh pr view exited with code 1: HTTP 502" }))?.failure).toBe("The last read failed, so the facts above are from the read before it: gh pr view exited with code 1: HTTP 502.");
    expect(pullRequestFacts(with_({ failure: "gh pr view printed no pull request Owlery reads." }))?.failure).toBe("The last read failed, so the facts above are from the read before it: gh pr view printed no pull request Owlery reads.");
    // A work item without a pull request, and one of a daemon of an earlier build, which sends no such field, list none.
    expect(pullRequestFacts(LOGIN)).toBeNull();
    const { pullRequest: _, ...earlier } = LOGIN;
    expect(pullRequestFacts(earlier as WorkItem)).toBeNull();
  });

  it("leaves the line to a pane that works or waits, to a running or stopped chain and to a park", () => {
    const working = session(2, { state: "working", stateText: "Running the tests" });
    const waiting = session(2, { state: "waiting", stateText: "May I run the tests?" });
    expect(inboxLine(PASSED, [working], KINDS).state).toBe("working");
    expect(lineText(PASSED, working, false)).toEqual({ says: "state", text: "Running the tests" });
    expect(inboxLine(PASSED, [waiting], KINDS).state).toBe("waiting");
    const stage: ChainStage = { kind: "pull-request", round: 1, state: "working", failure: null, startedAt: 1, endedAt: null, headlessId: null, refusals: 0, gate: null };
    const running = { ...FAILED, chain: { state: "running", says: "The pull request stage is running.", since: 1, stages: [stage] } satisfies Chain };
    expect(inboxLine(running, [], KINDS).state).toBe("working");
    expect(lineText(running, undefined, false)).toEqual({ says: "stage", text: "Pull request" });
    const stopped = { ...PASSED, chain: { state: "stopped", says: "The pull request stage failed: gh pr list exited with code 4.", since: 1, stages: [{ ...stage, state: "failed" }] } satisfies Chain };
    expect(inboxLine(stopped, [], KINDS).state).toBe("waiting");
    expect(lineText(stopped, undefined, false)).toEqual({ says: "chain", text: "The pull request stage failed: gh pr list exited with code 4." });
    const asked: Question = { id: 1, asks: "Which base?", grounds: "None names it.", by: "inspector", options: [], default: null, answer: null, since: 1 };
    expect(inboxLine({ ...PASSED, questions: [asked] }, [], KINDS).state).toBe("waiting");
    expect(lineText({ ...PASSED, questions: [asked] }, undefined, false).says).toBe("question");
  });

  it("notifies of a work item whose pull request makes its line begin to wait or finish, once, and of none that is muted, in front, or whose line a pane or a chain gives", () => {
    const toldOf = (workItem: WorkItem, body: string) => ({ workItemId: workItem.id, title: workItem.title, body });
    expect(pullRequestNotifications([PENDING], [FAILED], [], KINDS, undefined)).toEqual([toldOf(FAILED, "Needs you")]);
    expect(pullRequestNotifications([PENDING], [PASSED], [], KINDS, undefined)).toEqual([toldOf(PASSED, "Finished")]);
    expect(pullRequestNotifications([PASSED], [MERGED], [], KINDS, undefined)).toEqual([]);
    expect(pullRequestNotifications([LOGIN], [OPEN], [], KINDS, undefined)).toEqual([toldOf(OPEN, "Finished")]);
    // Nothing changed, the line begins to work, or the checks fail again.
    expect(pullRequestNotifications([FAILED], [FAILED], [], KINDS, undefined)).toEqual([]);
    expect(pullRequestNotifications([PASSED], [PENDING], [], KINDS, undefined)).toEqual([]);
    expect(pullRequestNotifications([FAILED], [{ ...FAILED, pullRequest: { ...pullRequest({ checks: "failed", list: [{ name: "lint", state: "failed", link: null }], listCount: 1 }) } }], [], KINDS, undefined)).toEqual([]);
    expect(pullRequestNotifications([PENDING], [{ ...FAILED, muted: true }], [], KINDS, undefined)).toEqual([]);
    expect(pullRequestNotifications([PENDING], [FAILED], [], KINDS, FAILED.id)).toEqual([]);
    expect(pullRequestNotifications([PENDING], [FAILED], [session(2, { state: "working" })], KINDS, undefined)).toEqual([]);
    expect(pullRequestNotifications([PENDING], [{ ...FAILED, chain: { ...RESTS, state: "running" } }], [], KINDS, undefined)).toEqual([]);
    // A park and a stopped chain each raise their own notification, and the pull request none.
    const asked: Question = { id: 1, asks: "Which base?", grounds: "None names it.", by: "inspector", options: [], default: null, answer: null, since: 1 };
    for (const more of [{ questions: [asked] }, { chain: { ...RESTS, state: "stopped" as const, says: "The pull request stage failed: x." } }]) expect(pullRequestNotifications([PENDING], [{ ...FAILED, ...more }], [], KINDS, undefined), Object.keys(more)[0]).toEqual([]);
  });

  it("gives a lapsed inspection the line ahead of an open or closed pull request's result and behind a merged one, and leaves an inspection that holds to the pull request's words", () => {
    const lapsed: Inspection = { state: "lapsed", commit: HEAD, why: "`src/app.ts` changed after the cleared commit `3f2a9c1`." };
    const holds: Inspection = { state: "cleared", commit: HEAD, why: null };
    const line = (workItem: WorkItem) => [inboxLine(workItem, [], KINDS).state, lineText(workItem, undefined, false), lineSince(workItem, undefined)];
    for (const workItem of [PASSED, FAILED, PENDING, OPEN, CLOSED]) expect(line({ ...workItem, inspection: lapsed }), workItem.pullRequest?.checks).toEqual(["waiting", { says: "inspection", text: "Inspection lapsed" }, null]);
    // A merge asks nothing more of the person, whatever lands on the branch after it.
    expect(line({ ...MERGED, inspection: lapsed })).toEqual(["finished", { says: "pull-request", text: "Merged" }, null]);
    // An inspection that holds says no more than the pull request.
    expect(line({ ...PASSED, inspection: holds })).toEqual(["finished", { says: "pull-request", text: "Checks passed" }, null]);
    expect(line({ ...FAILED, inspection: holds })).toEqual(["waiting", { says: "pull-request", text: "Check failed: build" }, null]);
  });

  it("notifies of no pull request's result while the work item's inspection is lapsed, since the inspection gives the line, and of the result again once an inspection holds", () => {
    const lapsed: Inspection = { state: "lapsed", commit: HEAD, why: "`src/app.ts` changed after the cleared commit `3f2a9c1`." };
    const holds: Inspection = { state: "cleared", commit: HEAD, why: null };
    expect(pullRequestNotifications([{ ...PASSED, inspection: lapsed }], [{ ...FAILED, inspection: lapsed }], [], KINDS, undefined)).toEqual([]);
    expect(pullRequestNotifications([{ ...PENDING, inspection: lapsed }], [{ ...PASSED, inspection: lapsed }], [], KINDS, undefined)).toEqual([]);
    expect(pullRequestNotifications([{ ...PENDING, inspection: holds }], [{ ...FAILED, inspection: holds }], [], KINDS, undefined)).toEqual([{ workItemId: FAILED.id, title: FAILED.title, body: "Needs you" }]);
  });

  it("takes a merged pull request's decisions off the line's mark, the summary and the filter of the decisions, and the view still lists both", () => {
    const decision = (id: number, fields: Partial<Decision> = {}): Decision => ({ id, kind: "default", says: "Start from main.", grounds: "frame/questions.md Q1.", by: null, state: "decided", reversal: null, landed: null, since: 2000, ...fields });
    const decisions = [decision(1), decision(2, { state: "reversed", reversal: "main에서 시작해 주세요", since: 3000 })];
    const merged = { ...MERGED, decisions };
    const open = { ...PASSED, decisions };
    expect(decisionMark(merged, null)).toBe("");
    expect(decisionMark(open, null)).toBe("1 decision without asking, 1 reversed");
    const look: Look = { at: 1000, sessions: [], workItems: [MERGED] };
    expect(changesSince(look, [merged], [], KINDS)).toEqual([]);
    expect(changesSince({ ...look, workItems: [PASSED] }, [open], [], KINDS).map((change) => change.decided)).toEqual([2]);
    const filtered = (workItem: WorkItem) => matchWorkItems(workItemEntries([workItem], [], KINDS), "", "decided").map((entry) => entry.workItem.id);
    expect(filtered(merged)).toEqual([]);
    expect(filtered(open)).toEqual([1]);
    expect(decisionLines(merged, 4000).map((line) => line.id)).toEqual([2, 1]);
    // A closed pull request takes nothing off.
    expect(decisionMark({ ...CLOSED, decisions }, null)).toBe("1 decision without asking, 1 reversed");
  });
});
