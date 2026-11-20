// What the window says and sends, apart from the page that shows it, so the
// cases can read it without a browser. The kinds of pane, with their labels,
// are the daemon's list from `ready`: nothing here names one.
import { KEEP_AWAKE_CHOICES } from "../shared/keep-awake";
import type { DaemonEnd, InstalledApp } from "../shared/ipc";
import { losesWork, type AgentState, type FileChange, type Group, type HeadlessInfo, type HeadlessState, type KeepAwake, type KeepAwakeChoice, type Look, type PaneKind, type PaneKindInfo, type Repository, type Running, type SessionInfo, type WorkItem, type WorkItemLoss } from "../shared/protocol";

/**
 * A tab's label among `tabs`, the open panes of its work item in the tabs'
 * order: the pane's kind, as the daemon labels it, alone where it is the one
 * pane of its kind, and otherwise followed by its place among the panes of
 * that kind, from 1. The daemon's id of a pane counts every pane it started,
 * so it is no tab's to show. The work item's title is the view's header's to say.
 */
export function tabLabel(session: SessionInfo, tabs: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): string {
  const kind = paneKinds.find((offered) => offered.kind === session.kind);
  const name = kind ? kind.label : session.kind;
  const same = tabs.filter((tab) => tab.kind === session.kind);
  return same.length > 1 ? `${name} ${same.findIndex((tab) => tab.id === session.id) + 1}` : name;
}

/** The first kind of pane that reports its agent's state: the one the "New work item" form starts on. */
export function agentKind(paneKinds: readonly PaneKindInfo[]): PaneKind | undefined {
  return paneKinds.find((offered) => offered.reportsState)?.kind;
}

/** One choice of the pane bar of a work item's view: the button's text, its tooltip where it has one, and what its press starts. */
export interface PaneChoice {
  kind: PaneKind;
  text: string;
  hint: string | null;
  continueLatest: boolean;
}

/**
 * The choices of a work item's pane bar, in the daemon's order of kinds: each
 * kind's own, and after it, for a kind that declares `continues`, the choice
 * that starts a pane of it on the latest conversation of the worktree. A
 * daemon of an earlier build sends no `continues`, and its kinds get one
 * choice each.
 */
export function paneChoices(paneKinds: readonly PaneKindInfo[]): PaneChoice[] {
  return paneKinds.flatMap(({ kind, label, continues }) => {
    const own: PaneChoice = { kind, text: `+ ${label}`, hint: null, continueLatest: false };
    return continues === true ? [own, { kind, text: `+ ${label} (continue)`, hint: "Start on the latest conversation of this worktree", continueLatest: true }] : [own];
  });
}

/** The work item's panes whose process runs, the most recent first. */
function livePanes(workItem: WorkItem, sessions: readonly SessionInfo[]): SessionInfo[] {
  return sessions.filter((session) => session.workItemId === workItem.id && session.alive).sort((a, b) => b.id - a.id);
}

/** The pane a work item's line reads its state from: its most recent live pane of a kind that reports state, or nothing where it has none. */
export function lineSession(workItem: WorkItem, sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): SessionInfo | undefined {
  return livePanes(workItem, sessions).find((session) => paneKinds.some((offered) => offered.kind === session.kind && offered.reportsState));
}

export interface InboxLine {
  title: string;
  branch: string;
  /** What the work item's agent is doing, or null where no live pane of it says. */
  state: AgentState | null;
  /** How many commits the branch gained, or empty where it gained none or none were read. */
  commits: string;
}

/**
 * One line of the inbox: the work item, the state of its most recent live pane
 * of a kind that reports state, and its new commits. An exited pane keeps its
 * last state and is passed over, because nothing will change that state again.
 */
export function inboxLine(workItem: WorkItem, sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): InboxLine {
  const reporting = lineSession(workItem, sessions, paneKinds);
  const count = workItem.newCommits ?? 0;
  return {
    title: workItem.title,
    branch: workItem.branch,
    state: reporting ? reporting.state : null,
    commits: count > 0 ? `${count} new ${count === 1 ? "commit" : "commits"}` : "",
  };
}

/** A work item as the lists and the sidebar show it: with its line, and the pane the line reads its state from. */
export interface Entry {
  workItem: WorkItem;
  line: InboxLine;
  session: SessionInfo | undefined;
}

/** Every work item with its line and that line's pane, in the order the daemon lists them. */
export function workItemEntries(workItems: readonly WorkItem[], sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): Entry[] {
  return workItems.map((workItem) => ({ workItem, line: inboxLine(workItem, sessions, paneKinds), session: lineSession(workItem, sessions, paneKinds) }));
}

/** The agent states in the order a person must act on them, which is the order of the inbox's sentence and of its groups. */
const STATES_BY_URGENCY: readonly AgentState[] = ["waiting", "working", "finished"];

/** Each agent state as the inbox's sentence says it, after its count. */
const STATE_IN_SENTENCE: Record<AgentState, string> = { waiting: "waiting for you", working: "working", finished: "finished" };

/**
 * The inbox's sentence: how many work items are in each agent state, as in
 * "1 waiting for you, 2 working". A state no line is in is left out, and the
 * sentence is empty where no line has a state.
 */
export function inboxSummary(lines: readonly InboxLine[]): string {
  return STATES_BY_URGENCY.map((state) => ({ state, count: lines.filter((line) => line.state === state).length }))
    .filter(({ count }) => count > 0)
    .map(({ state, count }) => `${count} ${STATE_IN_SENTENCE[state]}`)
    .join(", ");
}

/** A line's state in words: the heading of its group in the inbox, which the preview and a view say as well, with the state's age. */
export function stateHeading(state: AgentState | null): string {
  if (state === null) return "No agent";
  return { waiting: "Waiting for you", working: "Working", finished: "Finished" }[state];
}

export interface InboxGroup<Entry> {
  /** The state of every line of the group, or null for the lines with no state. */
  state: AgentState | null;
  heading: string;
  entries: Entry[];
}

/**
 * The inbox's lines in their groups: the states in the order a person must
 * act on them, then the lines with no state. A group no line is in is left
 * out, and inside a group the lines keep the order they were given in.
 */
export function inboxGroups<Entry extends { line: InboxLine }>(entries: readonly Entry[]): InboxGroup<Entry>[] {
  return [...STATES_BY_URGENCY, null]
    .map((state) => ({ state, heading: stateHeading(state), entries: entries.filter((entry) => entry.line.state === state) }))
    .filter((group) => group.entries.length > 0);
}

/**
 * The entries with the pinned work items before the others. The pinned keep
 * their order among themselves, and so do the others. A list puts it over
 * the entries of one of its parts: a repository's in the sidebar, a state's
 * group in the inbox, which `inboxGroups` cuts from entries in this order,
 * and the whole of the history.
 */
export function pinnedFirst<E extends { workItem: WorkItem }>(entries: readonly E[]): E[] {
  return [...entries.filter((entry) => entry.workItem.pinned), ...entries.filter((entry) => !entry.workItem.pinned)];
}

/** The marks a work item's line carries after its title, each with the words a pointer and a screen reader are told: one where it is pinned, and one where its notifications are muted. */
export function lineMarks(workItem: WorkItem): { mark: "pinned" | "muted"; words: string }[] {
  return [...(workItem.pinned ? [{ mark: "pinned" as const, words: "Pinned" }] : []), ...(workItem.muted ? [{ mark: "muted" as const, words: "Notifications muted" }] : [])];
}

/** The name of a work item's repository: the one the daemon sends, or the last part of the repository's folder for a daemon of an earlier build, which sends none. */
export function repoNameOf(workItem: WorkItem): string {
  return (workItem.repoName as string | undefined) ?? workItem.repo.split("/").filter(Boolean).at(-1) ?? workItem.repo;
}

/**
 * What the status line says of the daemon in place of its state: that the
 * daemon is of another build than the one the app would start, with the
 * menu's entry that replaces it, or nothing. `otherBuild` is the main
 * process's answer (src/shared/ipc.ts, `DaemonConnection`), the sentence's
 * one source.
 */
export function daemonNotice(otherBuild: boolean): string {
  return otherBuild ? `Owlery's background process is from another build. Choose "Restart Daemon…" from the menu to replace it.` : "";
}

/**
 * The repositories and the archived work items of a `ready` or an `inbox`.
 * A daemon of a build before the repositories sends neither list and
 * answers none of the messages that came with them: the window then holds
 * no repository. Such a daemon wrote no build into its `daemon.json`
 * either, so the main process answers that it is of another build, and
 * `daemonNotice` gives the sentence for it.
 */
export function daemonLists(message: { repositories?: Repository[]; archived?: WorkItem[] }): { repositories: Repository[]; archived: WorkItem[] } {
  if (message.repositories === undefined) return { repositories: [], archived: [] };
  return { repositories: message.repositories, archived: message.archived ?? [] };
}

export interface SidebarRepository {
  id: number;
  /** The repository's folder, which tells two repositories of one name apart. */
  repo: string;
  name: string;
  /** The one character the sidebar shows before the name, or null where a person set none. */
  icon: string | null;
  /** How many work items are listed under it, in its groups and out of them: those the search and the filter leave. */
  count: number;
  /** Its work items that stand in no group of its own, each with the places of its title that match what is typed. */
  entries: (Entry & { marks: [number, number][] })[];
  /** Its groups, in the order they were made, each with the work items that stand in it. */
  groups: { id: number; name: string; entries: SidebarRepository["entries"] }[];
}

/**
 * The sidebar's repositories: each repository the daemon keeps that is not
 * hidden, in the daemon's order, with the work items that name it by its id
 * and that the search and the filter leave. Its ungrouped work items come
 * first, and then each of its groups with its own, in the order the groups
 * were made, a group with no work item among them. In each of those lists
 * the pinned ones stand first, and each part is in the order given. A work
 * item whose group its repository does not hold is among the ungrouped. A
 * repository with no work item is listed. While a search is typed or a
 * state is chosen, a repository none of whose work items is left is not,
 * and neither is a group none of whose work items is left. The window makes
 * up no repository: a work item whose repository the daemon did not send is
 * under none.
 */
export function sidebarTree(repositories: readonly Repository[], workItems: readonly WorkItem[], sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[], query = "", state: StateFilter = "all"): SidebarRepository[] {
  const left = matchWorkItems(workItemEntries(workItems, sessions, paneKinds), query, state);
  const narrowing = query !== "" || state !== "all";
  return repositories
    .filter((repository) => !repository.hidden)
    .map((repository) => {
      const own = left.filter((entry) => entry.workItem.repoId === repository.id);
      const listed = (entries: typeof own) => pinnedFirst(entries).map((entry) => ({ ...entry, marks: markRanges(entry.line.title, query) }));
      const groups = repository.groups.map(({ id, name }) => ({ id, name, entries: listed(own.filter((entry) => entry.workItem.groupId === id)) })).filter((group) => !narrowing || group.entries.length > 0);
      const entries = listed(own.filter((entry) => !repository.groups.some((group) => group.id === entry.workItem.groupId)));
      return { id: repository.id, repo: repository.folder, name: repository.name, icon: repository.icon, count: own.length, entries, groups };
    })
    .filter((repository) => !narrowing || repository.count > 0);
}

/** The repositories the sidebar does not list, in the daemon's order, and what the button under the sidebar's repositories says of them: how many they are, or nothing where none is hidden. */
export function hiddenRepositories(repositories: readonly Repository[]): { says: string; hidden: Repository[] } {
  const hidden = repositories.filter((repository) => repository.hidden);
  return { says: hidden.length === 0 ? "" : hidden.length === 1 ? "1 hidden repository" : `${hidden.length} hidden repositories`, hidden };
}

/** What a repository's removal takes off Owlery's lists and ends, as its dialog names it: the work items, each by its title, and the running sessions, each by a line of words and, in `running`, by its id. */
export interface Removal {
  workItems: { id: number; title: string; archived: boolean }[];
  sessions: string[];
  running: Running;
}

/**
 * What removing a repository takes with it: every work item the repository
 * holds, the archived after the others, and every running session of one of
 * them. A pane runs while its process is alive, and is named by its tab's
 * label and its work item. A headless session runs while it is working, and
 * is named by its prompt. `running` is what the removal sends the daemon, so
 * the daemon ends the sessions the person was told of and no other.
 */
export function removalOf(repository: Repository, workItems: readonly WorkItem[], archived: readonly WorkItem[], sessions: readonly SessionInfo[], headless: readonly HeadlessInfo[], paneKinds: readonly PaneKindInfo[]): Removal {
  const held = [...workItems, ...archived].filter((workItem) => workItem.repoId === repository.id);
  const running = held.map((workItem) => ({ workItem, ...runningIn(workItem, sessions, headless, paneKinds) }));
  const panes = running.flatMap(({ workItem, panes }) => panes.map(({ id, label }) => ({ id, says: `${label} in ${workItem.title}` })));
  const asked = running.flatMap(({ workItem, asked }) => asked.map(({ id, prompt }) => ({ id, says: `Asked in ${workItem.title}: ${prompt}` })));
  return {
    workItems: held.map((workItem) => ({ id: workItem.id, title: workItem.title, archived: workItem.archivedAt !== null })),
    sessions: [...panes, ...asked].map(({ says }) => says),
    running: { panes: panes.map(({ id }) => id), headless: asked.map(({ id }) => id) },
  };
}

/** The running sessions of one work item: its panes whose process is alive, each with its tab's label, and its headless sessions that are working, each with its prompt. */
function runningIn(workItem: WorkItem, sessions: readonly SessionInfo[], headless: readonly HeadlessInfo[], paneKinds: readonly PaneKindInfo[]): { panes: { id: number; label: string }[]; asked: { id: number; prompt: string }[] } {
  const tabs = paneTabs(workItem, sessions);
  return {
    panes: tabs.filter((tab) => tab.alive).map((tab) => ({ id: tab.id, label: tabLabel(tab, tabs, paneKinds) })),
    asked: headless.filter((session) => session.workItemId === workItem.id && session.state === "working").map(({ id, prompt }) => ({ id, prompt })),
  };
}

/**
 * What archiving a work item ends: each of its running sessions, as the
 * dialog before the archive names it, a pane by its tab's label and a
 * headless session by its prompt. `running` is what the archive sends the
 * daemon, so the daemon ends the sessions the person was told of and no
 * other. Where it names none, the archive asks nothing first.
 */
export function archivalOf(workItem: WorkItem, sessions: readonly SessionInfo[], headless: readonly HeadlessInfo[], paneKinds: readonly PaneKindInfo[]): { sessions: string[]; running: Running } {
  const { panes, asked } = runningIn(workItem, sessions, headless, paneKinds);
  return {
    sessions: [...panes.map(({ label }) => label), ...asked.map(({ prompt }) => `Asked: ${prompt}`)],
    running: { panes: panes.map(({ id }) => id), headless: asked.map(({ id }) => id) },
  };
}

/** The words of the dialog that asks before the daemon ends, for a restart or for a complete quit: its head, what ends and what stays, and the button that ends it. */
export function daemonEnding(chosen: DaemonEnd): { head: string; says: string; button: string } {
  if (chosen === "restart") {
    return {
      head: "Restart the daemon",
      says: "A restart ends every running session and starts Owlery's background process again, from this build. The panes' tabs and the answers to what was asked go with the old process. Work items, their folders and their branches stay as they are.",
      button: "Restart",
    };
  }
  return {
    head: "Quit Owlery completely",
    says: "This ends every running session, stops Owlery's background process and quits Owlery. The panes' tabs and the answers to what was asked go with the process. Work items, their folders and their branches stay as they are.",
    button: "Quit",
  };
}

/**
 * Every running session the window holds, as the dialog that asks before
 * the daemon ends names it: each live pane, then each working headless
 * session. A session of a work item the window lists, archived or not,
 * reads as a repository's removal names it (`removalOf`). A live pane of no
 * listed work item reads as its kind's label alone, after the others, and a
 * working headless session of none by its prompt alone. The daemon's end
 * carries no list: it ends what runs at that moment.
 */
export function runningSessions(workItems: readonly WorkItem[], archived: readonly WorkItem[], sessions: readonly SessionInfo[], headless: readonly HeadlessInfo[], paneKinds: readonly PaneKindInfo[]): string[] {
  const listed = [...workItems, ...archived];
  const running = listed.map((workItem) => ({ workItem, ...runningIn(workItem, sessions, headless, paneKinds) }));
  const known = new Set(listed.map((workItem) => workItem.id));
  return [
    ...running.flatMap(({ workItem, panes }) => panes.map(({ label }) => `${label} in ${workItem.title}`)),
    ...sessions.filter((session) => session.alive && (session.workItemId === null || !known.has(session.workItemId))).map((session) => tabLabel(session, [session], paneKinds)),
    ...running.flatMap(({ workItem, asked }) => asked.map(({ prompt }) => `Asked in ${workItem.title}: ${prompt}`)),
    ...headless.filter((session) => session.state === "working" && !known.has(session.workItemId)).map(({ prompt }) => `Asked: ${prompt}`),
  ];
}

/** One kind of thing a loss names, as a dialog draws it: its heading, a line for each entry the loss carries, and how many more there are where the list is cut, or nothing. */
export interface LossSection {
  caption: string;
  lines: string[];
  more: string;
}

/**
 * What a dialog names of a loss, a section for each kind the loss holds
 * something of, in this order: the branch and the folder a delete removes;
 * the commits nothing else holds, each by its hash and its subject; the
 * tracked files with a change that is not committed; the untracked files;
 * and the ignored files and folders, which a removal of the folder takes
 * with it.
 */
export function lossSections(loss: WorkItemLoss): LossSection[] {
  const section = (caption: string, lines: string[], count: number): LossSection[] => (lines.length === 0 ? [] : [{ caption, lines, more: count > lines.length ? `and ${count - lines.length} more` : "" }]);
  const removed = [...(loss.branch === null ? [] : [`The branch ${loss.branch}`]), ...(loss.worktree === null ? [] : [`The folder ${loss.worktree}`])];
  return [
    ...section("Removed from disk", removed, removed.length),
    ...section("Commits no other branch, no remote and no tag holds", loss.commits.map(({ hash, subject }) => `${hash} ${subject}`), loss.commitCount),
    ...section("Files with changes that are not committed", loss.uncommitted, loss.uncommittedCount),
    ...section("Untracked files", loss.untracked, loss.untrackedCount),
    ...section("Ignored files and folders, which go with the folder", loss.ignored, loss.ignoredCount),
  ];
}

/** What the delete dialog says before its lists, of the loss the daemon answered with, or of none while the answer is awaited: why the delete cannot run, that work would be lost, that the folder stays where git reads nothing in the repository's folder, or what the delete removes. */
export function deleteSays(loss: WorkItemLoss | null): string {
  if (loss === null) return "Reading what a delete would remove.";
  if (loss.blocked !== null) return loss.blocked;
  if (loss.unreachable) return "Git reads nothing in the repository's folder. A delete takes the work item off Owlery's lists, and its folder stays on disk.";
  if (losesWork(loss)) return "A delete would lose the work named below. It runs only with Force delete checked.";
  return "A delete removes the work item's worktree and its local branch, and takes the work item off Owlery's lists.";
}

/**
 * The delete dialog's two controls, for the loss the daemon answered with,
 * or for none while the answer is awaited, and for whether "Force delete"
 * is checked. The checkbox is shown where the delete would lose work. The
 * "Delete" button is off until the loss has arrived, while the delete is
 * blocked, and while work would be lost and the checkbox is not checked.
 */
export function deleteChoice(loss: WorkItemLoss | null, force: boolean): { forceShown: boolean; enabled: boolean } {
  if (loss === null) return { forceShown: false, enabled: false };
  const loses = losesWork(loss);
  return { forceShown: loses, enabled: loss.blocked === null && (!loses || force) };
}

/**
 * The controls of a repository's removal dialog and what it says, for how
 * many work items the repository holds, for its two choices, "Also delete
 * the work items' worktrees and local branches" and "Also move the
 * repository's folder to the Trash", for the loss of each work item as far
 * as the daemon has answered, and for whether "Force delete" is checked.
 *
 * The first choice is shown where the repository holds a work item. The
 * Trash's choice can be taken where it holds none or the first is taken: a
 * linked worktree of a repository that moved to the Trash no longer works.
 * Where the work items are deleted, "Force delete" is shown where one of
 * them would lose work, and "Remove" is off until every loss has arrived,
 * while one is blocked, and while one would lose work and the checkbox is
 * not checked.
 */
export function removalChoice(workItems: number, deletes: boolean, trash: boolean, losses: readonly (WorkItemLoss | undefined)[], force: boolean): { deleteShown: boolean; trashEnabled: boolean; forceShown: boolean; enabled: boolean; says: string } {
  const trashEnabled = workItems === 0 || deletes;
  const trashes = trash && trashEnabled;
  const loses = deletes && losses.some((loss) => loss !== undefined && losesWork(loss));
  const lists = workItems === 0 ? "Owlery will no longer list the repository." : "Owlery will no longer list the repository or its work items.";
  const says = deletes
    ? trashes
      ? `${lists} Each work item's worktree and local branch are deleted, as named below, and the repository's folder then moves to the Trash, whole. Nothing on a remote is removed.`
      : `${lists} Each work item's worktree and local branch are deleted, as named below. The repository's folder stays, and nothing on a remote is removed.`
    : trashes
      ? `${lists} Its folder moves to the Trash, whole, and nothing in it is erased.`
      : "Owlery will no longer list the repository or its work items. Nothing on disk is removed: the repository's folder, each worktree's folder and each branch stay where they are.";
  return {
    deleteShown: workItems > 0,
    trashEnabled,
    forceShown: loses,
    enabled: !deletes || (losses.every((loss) => loss !== undefined && loss.blocked === null) && (!loses || force)),
    says,
  };
}

/** What a removal that deletes its work items sends beside what it names: the stamp of each work item's loss as the dialog showed it, by the work item's id, and whether the person checked "Force delete". */
export function deletionOf(workItemIds: readonly number[], losses: ReadonlyMap<number, WorkItemLoss>, force: boolean): { stamps: Record<number, string>; force: boolean } {
  const stamps: Record<number, string> = {};
  for (const id of workItemIds) {
    const loss = losses.get(id);
    if (loss !== undefined) stamps[id] = loss.stamp;
  }
  return { stamps, force };
}

/** A repository's archived work items as its archived screen lists them: the one archived last first, and two archived at one time in the order given. */
export function archivedIn(repositoryId: number, archived: readonly WorkItem[]): WorkItem[] {
  return archived.filter((workItem) => workItem.repoId === repositoryId).sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));
}

/** The head of the screen that lists a repository's archived work items. */
export function archivedHead(repositoryName: string): string {
  return `Archived in ${repositoryName}`;
}

/**
 * The history screen's lines: the work items whose agent finished, the
 * pinned ones first, and among the pinned and among the others the one that
 * finished last first. Two that finished at one time keep the order given,
 * and one whose time the daemon did not send stands last.
 */
export function historyLines<E extends { workItem: WorkItem; line: InboxLine; session: SessionInfo | undefined }>(entries: readonly E[]): E[] {
  const since = (entry: E) => entry.session?.stateSince ?? Number.NEGATIVE_INFINITY;
  return pinnedFirst(entries.filter((entry) => entry.line.state === "finished").sort((a, b) => (since(a) === since(b) ? 0 : since(b) > since(a) ? 1 : -1)));
}

/**
 * The places in `text` where what is typed stands, in any case of letters:
 * each a start and an end, in order, and none over another. Nothing where
 * nothing is typed.
 */
export function markRanges(text: string, query: string): [number, number][] {
  const ranges: [number, number][] = [];
  if (query === "") return ranges;
  const typed = query.toLowerCase();
  for (let at = 0; at + query.length <= text.length; ) {
    if (text.slice(at, at + query.length).toLowerCase() === typed) {
      ranges.push([at, at + query.length]);
      at += query.length;
    } else {
      at += 1;
    }
  }
  return ranges;
}

/** What the filter shows: every state, one agent state, or the work items with no state. */
export type StateFilter = "all" | AgentState | "none";

/** The filter's choices: "All", and the heading of each of the inbox's groups, in their order. */
export function filterChoices(): { value: StateFilter; label: string }[] {
  return [{ value: "all", label: "All" }, ...[...STATES_BY_URGENCY, null].map((state) => ({ value: state ?? ("none" as const), label: stateHeading(state) }))];
}

/**
 * The work items a search and a filter leave, in the order given: those
 * whose title, branch or repository's name holds what is typed, and whose
 * line is in the state chosen.
 */
export function matchWorkItems<E extends { workItem: WorkItem; line: InboxLine }>(entries: readonly E[], query: string, state: StateFilter): E[] {
  return entries.filter(({ workItem, line }) => {
    if (state !== "all" && (line.state ?? "none") !== state) return false;
    return query === "" || [workItem.title, workItem.branch, repoNameOf(workItem)].some((text) => markRanges(text, query).length > 0);
  });
}

/** How many work items a search leaves, of how many, as the search field says it. */
export function matchCount(matched: number, total: number): string {
  return `${matched} of ${total}`;
}

/** The same in words, as the head of a list says it. */
export function matchSentence(matched: number, total: number, query: string): string {
  return `${matchCount(matched, total)} ${total === 1 ? "work item matches" : "work items match"} "${query}" in title, branch or repository`;
}

/**
 * What a list says in place of its lines, `total` being the screen's work
 * items and `shown` the ones a search and a filter leave: nothing where it
 * has a line.
 */
export function emptyList(screen: "inbox" | "history" | "archived", total: number, shown: number): string {
  if (shown > 0) return "";
  if (total > 0) return "No work item matches.";
  return { inbox: "No work items yet.", history: "Nothing has finished yet.", archived: "No work item of this repository is archived." }[screen];
}

export interface Change {
  workItem: WorkItem;
  /** The work item's line as the lists now give it. */
  line: InboxLine;
  /** The pane that line reads its state from, whose time is the age the summary's line says. */
  session: SessionInfo | undefined;
  /** What changed, opening with the present state. */
  sentence: string;
}

/** Each agent state as a change's sentence opens with it. */
const STATE_IN_CHANGE: Record<AgentState, string> = { waiting: "Waits for you.", working: "Is working.", finished: "Finished." };

/**
 * The work items that changed since the person last looked, in the order of
 * the inbox's groups: one whose line differs in the state or in the count of
 * new commits from its line in the look, and one the look does not hold. A
 * count the daemon gave on one side alone says nothing of a change. Each side
 * is read through `inboxLine` with its own sessions, and no session of one is
 * matched to a session of the other: a session's id starts again with the
 * daemon, and a work item's id does not.
 */
export function changesSince(look: Look, workItems: readonly WorkItem[], sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): Change[] {
  const changes = workItems.flatMap((workItem): Change[] => {
    const line = inboxLine(workItem, sessions, paneKinds);
    const said = [line.state === null ? "No agent is running." : STATE_IN_CHANGE[line.state]];
    const before = look.workItems.find((item) => item.id === workItem.id);
    if (!before) {
      said.push("New since you were last here.");
    } else {
      const rise = before.newCommits === null || workItem.newCommits === null ? 0 : workItem.newCommits - before.newCommits;
      if (rise === 0 && inboxLine(before, look.sessions, paneKinds).state === line.state) return [];
      if (rise > 0) said.push(`${rise} new ${rise === 1 ? "commit" : "commits"} since you were last here.`);
    }
    return [{ workItem, line, session: lineSession(workItem, sessions, paneKinds), sentence: said.join(" ") }];
  });
  return inboxGroups(changes).flatMap((group) => group.entries);
}

/**
 * The summary screen's sentence: the changed work items counted by their
 * present state, as the inbox's sentence counts every work item, or how many
 * changed where none of them has a state.
 */
export function summarySentence(changes: readonly { line: InboxLine }[]): string {
  return inboxSummary(changes.map((change) => change.line)) || `${changes.length} work ${changes.length === 1 ? "item" : "items"} changed`;
}

/**
 * What stands in the place of the summary's sentence: the sentence where a
 * work item changed, and otherwise why the screen holds no line.
 */
export function summaryHead(hasLook: boolean, changes: readonly { line: InboxLine }[]): string {
  if (!hasLook) return "No earlier look is recorded.";
  return changes.length > 0 ? summarySentence(changes) : "Nothing changed since you were last here.";
}

/** How many work items changed, as the sidebar says it beside "Summary": nothing where none did. */
export function summaryCount(changed: number): string {
  return changed > 0 ? `${changed} new` : "";
}

export interface SummaryControls {
  /** The control Enter presses: it opens the view of a work item, or the inbox. */
  main: { label: string; opens: number | "inbox" };
  second: { label: string; opens: "inbox" } | null;
  hint: string;
}

/**
 * The summary screen's controls. Where a changed work item waits, the main
 * one opens the first that waits and the inbox stands beside it; otherwise
 * the inbox is the main control and the only one.
 */
export function summaryControls(changes: readonly { workItem: WorkItem; line: InboxLine }[]): SummaryControls {
  const inbox = { label: "Open the inbox", opens: "inbox" as const };
  const waits = changes.find((change) => change.line.state === "waiting");
  if (!waits) return { main: inbox, second: null, hint: "Enter opens it." };
  return { main: { label: "Answer the first question", opens: waits.workItem.id }, second: inbox, hint: "Enter opens the first that waits." };
}

/** The status line where the window has nothing else to say: that the daemon runs, how many agents do, an agent being a live pane of a kind that reports its state, and that the daemon keeps the Mac awake where `keepsAwake` says its hold stands. */
export function daemonStatus(sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[], keepsAwake: boolean): string {
  const agents = sessions.filter((session) => session.alive && paneKinds.some((offered) => offered.kind === session.kind && offered.reportsState)).length;
  return `Daemon running, ${agents === 0 ? "no agent" : agents === 1 ? "1 agent" : `${agents} agents`}${keepsAwake ? ", keeping the Mac awake" : ""}`;
}

/**
 * What the control that chooses when the Mac is kept awake shows: the
 * daemon's choice, and the words that name it to a pointer. Nothing against
 * a daemon that sent no `keepAwake`, one of an earlier build or one that can
 * hold nothing, and the control is then hidden.
 */
export function keepAwakeControl(keepAwake: KeepAwake | null): { choice: KeepAwakeChoice; title: string } | null {
  if (!keepAwake) return null;
  return { choice: keepAwake.choice, title: `Keep awake: ${KEEP_AWAKE_CHOICES.find(({ value }) => value === keepAwake.choice)?.label ?? keepAwake.choice}` };
}

/** What the status line tells once `taken` is taken back: nothing where it still told `taken`, and any other notice as it stands. */
export function noticeWithout(notice: string, taken: string): string {
  return notice === taken ? "" : notice;
}

/**
 * How long ago a time is, `at` and `now` being times in milliseconds: in
 * minutes under an hour, in hours and minutes under a day, and in days from
 * then on. Nothing where there is no time, as for a pane with no state and
 * for a daemon of an earlier build, which sends none.
 */
export function ageOf(at: number | null | undefined, now: number): string {
  if (at == null) return "";
  const minutes = Math.floor((now - at) / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "less than a minute";
  if (hours < 1) return `${minutes} min`;
  if (days < 1) return minutes % 60 === 0 ? `${hours} h` : `${hours} h ${minutes % 60} min`;
  return `${days} ${days === 1 ? "day" : "days"}`;
}

/** When the person was last here, in the words of an age. */
export function lastHere(at: number, now: number): string {
  return `You were last here ${ageOf(at, now)} ago.`;
}

/** A state in its heading's words and how long it has lasted, as in "Waiting for you, 12 min": the state alone where it has no time. */
export function stateWithAge(state: AgentState | null, since: number | null | undefined, now: number): string {
  const age = ageOf(since, now);
  return age ? `${stateHeading(state)}, ${age}` : stateHeading(state);
}

/** What a pane's state carried, as a person reads it: its text, or for a pane that waits with a tool's name and no text, which tool it asks for. */
function saidBy(session: SessionInfo | undefined): string | null {
  if (!session || session.state === null) return null;
  if (session.stateText) return session.stateText;
  return session.state === "waiting" && session.stateTool ? `Asks to use ${session.stateTool}` : null;
}

/**
 * What the agent of a work item's line says, under its head: the label of
 * the pane's kind and "asks" while the agent waits, "said" otherwise.
 * Nothing where the state carried neither a text nor, for a pane that waits,
 * a tool's name.
 */
export function stateSays(session: SessionInfo | undefined, paneKinds: readonly PaneKindInfo[]): { head: string; text: string } | null {
  const text = saidBy(session);
  if (!session || text === null) return null;
  const kind = paneKinds.find((offered) => offered.kind === session.kind);
  return { head: `${kind ? kind.label : session.kind} ${session.state === "waiting" ? "asks" : "said"}`, text };
}

/**
 * The text of a line's second row, and which of the three it is: what the
 * agent's state carried, otherwise the newest commit's subject, otherwise
 * the branch. While a search is typed it is the branch, where the letters
 * that match are marked.
 */
export function lineText(workItem: WorkItem, session: SessionInfo | undefined, searching: boolean): { says: "state" | "commit" | "branch"; text: string } {
  const said = searching ? null : saidBy(session);
  if (said !== null) return { says: "state", text: said };
  const newest = searching ? undefined : workItem.commits?.[0];
  return newest ? { says: "commit", text: newest.subject } : { says: "branch", text: workItem.branch };
}

/**
 * How many commits a work item's branch gained since the person last looked:
 * its count now less its count in the look, and all of them for a work item
 * the look does not hold. None where no look is recorded, and where the
 * daemon gave no count on either side.
 */
export function gainedSince(workItem: WorkItem, look: Look | null): number {
  if (!look || workItem.newCommits === null) return 0;
  const before = look.workItems.find((item) => item.id === workItem.id);
  if (!before) return workItem.newCommits;
  return before.newCommits === null ? 0 : Math.max(0, workItem.newCommits - before.newCommits);
}

/** A line's badge: the commits its branch gained since the look, as in "3 new", or nothing where it gained none. */
export function lineBadge(workItem: WorkItem, look: Look | null): string {
  const gained = gainedSince(workItem, look);
  return gained > 0 ? `${gained} new` : "";
}

/**
 * How far a work item's branch is ahead of its base: as the preview's
 * sentence, "6 commits ahead of main", and as the base's fact in a view,
 * "main · 6 ahead". The count is of the commits the base branch does not
 * hold. Where no base branch is recorded it is left out, and the count is of
 * the commits since the branch was cut. The count is left out where the
 * daemon read none.
 */
export function ahead(workItem: WorkItem): { sentence: string; fact: string } {
  const base = workItem.baseBranch ?? null;
  const count = (base === null ? workItem.newCommits : workItem.aheadOfBase) ?? null;
  const sentence = count === null ? "" : `${count} ${count === 1 ? "commit" : "commits"} ahead${base === null ? "" : ` of ${base}`}`;
  const fact = [base, count === null ? null : `${count} ahead`].filter((part) => part !== null).join(" · ");
  return { sentence, fact: fact || "Not recorded" };
}

/** The lines added and removed, as in "+12 \u22123", or nothing where git counted none, as for a binary file. */
export function lineCounts(added: number | null, removed: number | null): string {
  return added === null || removed === null ? "" : `+${added} \u2212${removed}`;
}

/** How many more of something there are than are listed, or what to say of none listed at all; nothing where every one is listed. */
function listFoot(listed: number, total: number | null, one: string, many: string, none: string): string {
  if (listed === 0 && !total) return none;
  const more = (total ?? listed) - listed;
  return more > 0 ? `${more} more ${more === 1 ? one : many}` : "";
}

export interface CommitLine {
  hash: string;
  subject: string;
  /** The lines the commit added and removed. */
  counts: string;
  age: string;
  /** Whether the branch gained the commit since the person last looked. */
  gained: boolean;
}

/**
 * A work item's commits as the preview and a view list them, newest first:
 * the first `gained` of them are the ones the branch gained since the look.
 * The foot says how many more the branch holds than the daemon sent, or that
 * it holds none. Nothing where the daemon read no commits.
 */
export function commitLines(workItem: WorkItem, gained: number, now: number): { lines: CommitLine[]; foot: string } | null {
  const commits = workItem.commits ?? null;
  if (commits === null) return null;
  return {
    lines: commits.map((commit, at) => ({ hash: commit.hash, subject: commit.subject, counts: lineCounts(commit.added, commit.removed), age: ageOf(commit.at, now), gained: at < gained })),
    foot: listFoot(commits.length, workItem.newCommits, "commit", "commits", "No commit yet."),
  };
}

/**
 * The files a work item's branch changed, each with its lines, under the
 * count of all of them and the sums of their lines. The foot says how many
 * more there are than the daemon sent, or that there is none. Nothing where
 * the daemon read no changes.
 */
export function fileLines(workItem: WorkItem): { sum: string; lines: { path: string; counts: string }[]; foot: string } | null {
  const changes = workItem.changes ?? null;
  if (changes === null) return null;
  return {
    sum: changes.files === 0 ? "" : `${changes.files} ${changes.files === 1 ? "file" : "files"}, ${lineCounts(changes.added, changes.removed)}`,
    lines: changes.list.map((file: FileChange) => ({ path: file.path, counts: lineCounts(file.added, file.removed) })),
    foot: listFoot(changes.list.length, changes.files, "file", "files", "No file changed yet."),
  };
}

/** The facts of a view's right column, in their order: the agent, which is the label of the kind of the pane the state is read from, when the work item was started, its base and its worktree. */
export function viewFacts(entry: Entry, paneKinds: readonly PaneKindInfo[], now: number): { label: string; value: string }[] {
  const kind = paneKinds.find((offered) => offered.kind === entry.session?.kind);
  return [
    { label: "Agent", value: kind ? kind.label : "None" },
    { label: "Started", value: `${ageOf(entry.workItem.createdAt, now)} ago` },
    { label: "Base", value: ahead(entry.workItem).fact },
    { label: "Worktree", value: entry.workItem.worktree },
  ];
}

/** The keys a list says under its preview: the two that move through it, the one that opens the selected line's menu, and the one that opens the "New work item" form, with the Control key where the keyboard has no Command key. */
export function keyHints(screen: "inbox" | "history" | "archived", mac: boolean): string[] {
  return [`J K move through the ${screen === "archived" ? "archived work items" : screen}`, "M opens the menu", `${mac ? "\u2318N" : "Ctrl N"} opens a new work item`];
}

/**
 * The work item whose line is selected, `ids` being the work items in the
 * order their lines are displayed: the one that was `selected` while it is
 * listed, and otherwise the first line's. Nothing where the inbox has no line.
 */
export function selectedLine(ids: readonly number[], selected: number | undefined): number | undefined {
  return selected !== undefined && ids.includes(selected) ? selected : ids[0];
}

/** The work item selected after a key moved the selection one line, which stops at each end of the list. */
export function moveSelection(ids: readonly number[], selected: number | undefined, key: "next" | "previous"): number | undefined {
  const from = selectedLine(ids, selected);
  if (from === undefined) return undefined;
  const at = ids.indexOf(from) + (key === "next" ? 1 : -1);
  return ids[Math.min(Math.max(at, 0), ids.length - 1)];
}

/**
 * What a key does on a screen that holds a list, the inbox screen, the
 * history screen or the archived screen, or null where the window leaves it
 * alone. What `open` does there is the window's to say. J and K are read
 * by their place on the keyboard, so they act under any input source. No key
 * is read while a screen the window does not name as one is in front, a
 * dialog is open, a menu is open (a repository's, a work item's or a
 * pane's), the focus is in a field or a modifier key is held. Enter on a
 * control is that control's own press.
 */
export function inboxKey(
  key: { code: string; modified: boolean },
  where: { inboxInFront: boolean; dialogOpen: boolean; menuOpen: boolean; inField: boolean; onControl: boolean },
): "next" | "previous" | "open" | null {
  if (!where.inboxInFront || where.dialogOpen || where.menuOpen || where.inField || key.modified) return null;
  if (key.code === "KeyJ") return "next";
  if (key.code === "KeyK") return "previous";
  if (key.code === "Enter" && !where.onControl) return "open";
  return null;
}

/**
 * What a key pressed with the Command key does on every screen, or null
 * where the window leaves it alone: K puts the focus in the search field,
 * N opens the "New work item" form, and W closes the pane in front. The
 * Control key stands for the Command key where the keyboard has none. The
 * key is read by its place on the keyboard, and not while a dialog is open,
 * a menu is open or another modifier key is held as well. The application
 * menu binds none of these keys, since a menu takes its key before the page
 * sees it (src/main/menu.ts).
 */
export function commandKey(key: { code: string; meta: boolean; ctrl: boolean; alt: boolean; shift: boolean }, where: { mac: boolean; dialogOpen: boolean; menuOpen: boolean }): "search" | "new" | "closePane" | null {
  const command = where.mac ? key.meta && !key.ctrl : key.ctrl && !key.meta;
  if (!command || key.alt || key.shift || where.dialogOpen || where.menuOpen) return null;
  if (key.code === "KeyK") return "search";
  if (key.code === "KeyN") return "new";
  return key.code === "KeyW" ? "closePane" : null;
}

/**
 * Whether a pane's close asks the person first: its session is working, so
 * the close would end an agent in the middle of a turn. A session works
 * where its process runs and its state is `working`. A kind that reports no
 * state never asks, and the function reads no kind (docs/architecture.md,
 * "Rules that keep it portable").
 */
export function closeAsks(session: SessionInfo): boolean {
  return session.alive && session.state === "working";
}

/**
 * The text a pane is handed for the files dropped on it, `paths` being each
 * file's path in the order of the drop, empty for a file that is on no
 * disk. Each path is written as a shell reads one word: a backslash stands
 * before every ASCII character that is not a letter, a digit or one of
 * `/ . _ - + = : , @ %`, and a character outside ASCII is written as it is.
 * The paths are joined by one space, and one space follows the last, so the
 * person types on after it. A file with no path is left out, and so is a
 * path that holds a control character, which a terminal would read as a
 * key. Where no path is left the text is empty.
 */
export function droppedText(paths: readonly string[]): string {
  return paths
    .filter((path) => path !== "" && !/[\u0000-\u001f\u007f]/.test(path))
    .map((path) => `${path.replace(/[ -~]/g, (character) => (/[A-Za-z0-9/._\-+=:,@%]/.test(character) ? character : `\\${character}`))} `)
    .join("");
}

/** What a key of a pane that the window reads does: it sends a line feed, or one of the three bytes a shell reads as an editing key. */
export type PaneKeyAct = "lineFeed" | "lineStart" | "lineEnd" | "deleteToLineStart";

/** The byte the pane's process is handed for each: a line feed, and Control+A, Control+E and Control+U. A shell reads the first two as the line's start and its end. bash reads Control+U as a deletion of what stands before the cursor, and zsh as a deletion of the whole line. */
export const PANE_KEY_BYTES: Record<PaneKeyAct, string> = { lineFeed: "\n", lineStart: "\u0001", lineEnd: "\u0005", deleteToLineStart: "\u0015" };

/**
 * What a key pressed in a pane does in place of what the terminal would
 * send for it, or null where the terminal reads the key itself. Enter with
 * the Shift key and no other modifier is the key that sends a line feed,
 * which a program such as Claude Code reads as a line break where Enter
 * submits. On a Mac keyboard, `mac`, three keys with the Command key and no
 * other modifier are the editing keys of macOS: the left arrow goes to the
 * line's start, the right arrow to its end, and Backspace sends Control+U,
 * which deletes what stands before the cursor in bash and the whole line in
 * zsh. On a keyboard without the Command key the three stay the
 * terminal's. During a composition every key is the terminal's: the event
 * says so, or its key code is 229, the code of a key the input source took.
 * The application menu binds none of these keys (src/main/menu.ts).
 */
export function paneKey(key: { key: string; shift: boolean; ctrl: boolean; alt: boolean; meta: boolean; isComposing: boolean; keyCode: number }, mac: boolean): PaneKeyAct | null {
  if (key.isComposing || key.keyCode === 229) return null;
  if (key.key === "Enter") return key.shift && !key.ctrl && !key.alt && !key.meta ? "lineFeed" : null;
  if (!mac || !key.meta || key.shift || key.ctrl || key.alt) return null;
  if (key.key === "ArrowLeft") return "lineStart";
  if (key.key === "ArrowRight") return "lineEnd";
  return key.key === "Backspace" ? "deleteToLineStart" : null;
}

/** What an item of a pane's menu does. */
export type PaneMenuAct = "copy" | "paste" | "selectAll" | "clear" | "reset" | "close";

/** An item of a pane's menu: its words, the keys that do the same, empty where no key of the window does, what it does, and whether it can be pressed. */
export interface PaneMenuItem {
  text: string;
  keys: string;
  act: PaneMenuAct;
  enabled: boolean;
}

/**
 * The items of a pane's menu, in their order, with null where a rule stands
 * between two groups. On a Mac keyboard "Copy", "Paste" and "Close Pane"
 * show the keys that do the same, and no other item shows one, since no key
 * of the window does what it does. On another keyboard no item shows a key.
 * "Copy" can be pressed only where the terminal holds a `selection`.
 */
export function paneMenu(mac: boolean, selection: boolean): (PaneMenuItem | null)[] {
  const item = (text: string, act: PaneMenuAct, keys = "", enabled = true): PaneMenuItem => ({ text, keys: mac ? keys : "", act, enabled });
  return [item("Copy", "copy", "\u2318C", selection), item("Paste", "paste", "\u2318V"), item("Select All", "selectAll"), null, item("Clear Screen", "clear"), item("Reset Terminal", "reset"), null, item("Close Pane", "close", "\u2318W")];
}

/** A text of a pane's line that may name a path, with where it stands in the line's text: from `start` to before `end`. */
export interface PathCandidate {
  text: string;
  start: number;
  end: number;
}

/**
 * The texts of a line a pane printed that may each name a path, for the
 * main process to say what stands there (src/main/paths.ts). A candidate is
 * a run of characters between spaces that holds a slash and not `://`, the
 * mark of an address, which the link add-on finds. Around it are cut the
 * quotes and the brackets a sentence puts there, the punctuation that
 * closes one, and a line number with its column, written as `:12` or
 * `:12:5`. A run that names nothing but its slashes, dots and tildes is no
 * candidate: `//` opens a comment on every other line of a program, and
 * would read as the root folder. A bare name is none either, since `docs`
 * is a word of a sentence and a folder of most worktrees.
 */
export function pathCandidates(line: string): PathCandidate[] {
  const found: PathCandidate[] = [];
  for (const run of line.matchAll(/\S+/g)) {
    if (run[0].includes("://")) continue;
    let start = /^["'`([{<]*/.exec(run[0])?.[0].length ?? 0;
    let text = run[0].slice(start);
    // A path that ends in the folder above keeps its dots.
    while (/["'`)\]}>.,;:!?]$/.test(text) && !/\/\.\.?$/.test(text)) text = text.slice(0, -1);
    text = text.replace(/:\d+(?::\d+)?$/, "");
    if (!text.includes("/") || /^[/.~]*$/.test(text)) continue;
    start += run.index;
    found.push({ text, start, end: start + text.length });
  }
  return found;
}

/** What a link of a pane leads to: an address of the web, the worktree of another work item the window lists, or any other path a file or a folder stands at. */
export type LinkTarget = { kind: "web"; address: string } | { kind: "workItem"; path: string; workItemId: number } | { kind: "path"; path: string };

/** What a person does with a link: open its address in the browser, put its work item's view in front, show its path in Finder, or copy the address or the path. */
export type LinkAct = "browser" | "workItem" | "finder" | "copy";

/** The target of a link the terminal found as an address: a web address, as the URL's parser writes it, where it is an `http` or `https` one, and none otherwise. The main process opens no other address (src/main/links.ts). */
export function webTarget(address: string): LinkTarget | null {
  if (!URL.canParse(address)) return null;
  const url = new URL(address);
  return url.protocol === "http:" || url.protocol === "https:" ? { kind: "web", address: url.href } : null;
}

/**
 * The target of a path the main process found a file or a folder at, whole:
 * the worktree of a work item the window lists, where it is one, and
 * another path otherwise. The worktree of the work item whose view is on
 * screen, `viewing`, is another path, since a click that opened the view
 * already on screen would do nothing.
 */
export function pathTarget(path: string, workItems: readonly WorkItem[], viewing: number | undefined): LinkTarget {
  const workItem = workItems.find((listed) => listed.worktree === path && listed.id !== viewing);
  return workItem ? { kind: "workItem", path, workItemId: workItem.id } : { kind: "path", path };
}

// What a person can do with a link of each kind of target, in the order the card's rows stand in, and the click that does it: one with the key held, one with the key and the Shift key held, or none. `linkClick` and `linkCard` both read it, so a row never names a click that does something else.
const LINK_ROWS: Record<LinkTarget["kind"], readonly { text: string; act: LinkAct; click: "key" | "shiftKey" | null }[]> = {
  web: [
    { text: "Open in browser", act: "browser", click: "key" },
    { text: "Copy link", act: "copy", click: null },
  ],
  workItem: [
    { text: "Open work item", act: "workItem", click: "key" },
    { text: "Open in Finder", act: "finder", click: "shiftKey" },
  ],
  path: [
    { text: "Show in Finder", act: "finder", click: "key" },
    { text: "Copy path", act: "copy", click: null },
  ],
};

/**
 * What a click on a link in a pane does, from the kind of its target and
 * the keys held, or null where the click stays the terminal's, which
 * selects text with it. The key is the Command key, and the Control key
 * where the keyboard has none: on a Mac the Control key with a click is the
 * secondary click. With the Shift key held as well the click does what the
 * target's rows give that click, and what the click with the key alone does
 * where they give it nothing.
 */
export function linkClick(kind: LinkTarget["kind"], click: { meta: boolean; ctrl: boolean; shift: boolean }, mac: boolean): LinkAct | null {
  if (!(mac ? click.meta : click.ctrl)) return null;
  const rows = LINK_ROWS[kind];
  const row = (click.shift ? rows.find((listed) => listed.click === "shiftKey") : undefined) ?? rows.find((listed) => listed.click === "key");
  return row ? row.act : null;
}

/** A link's card: the whole target on its first line, and a row for each thing a person can do with it, with the keys that do it, empty where no click does. */
export interface LinkCard {
  title: string;
  rows: { text: string; keys: string; act: LinkAct }[];
}

/** The card of a link: its target whole, the address or the path, and its rows, each with the click that does what it names, as `linkClick` answers that click on a keyboard that is a Mac's or is not. A row that copies names no click. */
export function linkCard(target: LinkTarget, mac: boolean): LinkCard {
  const keys = { key: mac ? "\u2318 Click" : "Ctrl Click", shiftKey: mac ? "\u21e7 \u2318 Click" : "Shift Ctrl Click" };
  return {
    title: target.kind === "web" ? target.address : target.path,
    rows: LINK_ROWS[target.kind].map(({ text, act, click }) => ({ text, keys: click === null ? "" : keys[click], act })),
  };
}

/**
 * Whether a link's card stays at a key pressed in the pane, from the key
 * event's `key`. It stays at a modifier key pressed by itself, the Command,
 * Shift, Control or Option key: the card's rows name clicks made with those
 * keys held, so a person who reads one holds the key and then clicks. Any
 * other key takes the card away, with or without a modifier key held.
 */
export function cardStaysAt(key: string): boolean {
  return key === "Meta" || key === "Shift" || key === "Control" || key === "Alt";
}

/**
 * Whether a key opens a menu: M alone, read by its place on the keyboard, or
 * F10 with the Shift key. On macOS no key raises the event a press of the
 * right button raises, so the window reads the key itself. `modified` says
 * that the Command, the Control or the Option key is held. The key is not
 * read in a field, a terminal's among them, while a dialog is open or while
 * a menu is open.
 */
export function menuKey(key: { code: string; shift: boolean; modified: boolean }, where: { dialogOpen: boolean; menuOpen: boolean; inField: boolean }): boolean {
  if (where.dialogOpen || where.menuOpen || where.inField || key.modified) return false;
  return key.shift ? key.code === "F10" : key.code === "KeyM";
}

/**
 * What the menu's key opens a menu for: the work item of the line the
 * keyboard is on, or the repository of the row it is on, and where it is on
 * neither, the work item of the `selected` line of the list in front.
 * Nothing where no list is in front or the list has no line.
 */
export function menuTarget(on: { workItem?: number; repository?: number }, selected: number | undefined): { workItem: number } | { repository: number } | null {
  if (on.workItem !== undefined) return { workItem: on.workItem };
  if (on.repository !== undefined) return { repository: on.repository };
  return selected === undefined ? null : { workItem: selected };
}

/**
 * What the press of a menu's item does. On a work item's menu: opens the
 * rename dialog, sets the work item's pin, its mute or the group it stands
 * in, where `groupId` null is none, archives it, opens
 * the dialog of its delete, or, on an archived one's, restores it. On a
 * repository's: opens its settings, its
 * icon's dialog or its removal's, hides it, opens the screen of its archived
 * work items, or, for `group`, opens the dialog of a new group. On both:
 * opens a folder in Finder, where `app` is null, or in an installed app, or
 * writes a text to the clipboard.
 */
export type MenuAction =
  | { do: "rename" | "archive" | "restore" | "delete"; id: number }
  | { do: "open"; folder: string; app: string | null }
  | { do: "copy"; text: string }
  | { do: "set"; id: number; pinned?: boolean; muted?: boolean; groupId?: number | null }
  | { do: "settings" | "icon" | "archived" | "group" | "hide" | "remove"; id: number };

/** One item of a menu: its words, the sentence a pointer over it is told, what its press does, and whether a rule stands above it, where another part of the menu begins. */
export interface MenuEntry {
  label: string;
  /** What a press does, in other words than the label's. */
  description: string;
  action: MenuAction;
  divides: boolean;
}

/** The items that open a folder in Finder and in each installed app, with `whose` naming the folder in their descriptions. */
function openEntries(folder: string, whose: string, apps: readonly InstalledApp[]): MenuEntry[] {
  return [
    { label: "Open in Finder", description: `Show ${whose} folder in a Finder window.`, action: { do: "open", folder, app: null }, divides: true },
    ...apps.map(({ name, kind }) => ({ label: `Open in ${name}`, description: `Start ${name}, ${kind === "editor" ? "an editor" : "a terminal"}, on ${whose} folder.`, action: { do: "open" as const, folder, app: name }, divides: false })),
  ];
}

/**
 * A work item's menu, in its order: Rename; Open in Finder, then one item
 * for each installed editor and terminal; Copy path and Copy branch name;
 * Pin or Unpin, and Mute notifications or Unmute notifications; "Move to"
 * for each of `groups`, the groups of its repository, but the one it stands
 * in, and "Move out of" that one; Archive and Delete. The menu of an
 * archived work item holds Restore, the items that open its folder, the two
 * copies and Delete. The folder that is opened and copied is the work
 * item's worktree.
 */
export function workItemMenu(workItem: WorkItem, apps: readonly InstalledApp[], groups: readonly Group[]): MenuEntry[] {
  const { id, worktree: folder } = workItem;
  const open = openEntries(folder, "the work item's", apps);
  const copies: MenuEntry[] = [
    { label: "Copy path", description: "Put the worktree folder's whole path on the clipboard.", action: { do: "copy", text: folder }, divides: true },
    { label: "Copy branch name", description: `Put ${workItem.branch} on the clipboard.`, action: { do: "copy", text: workItem.branch }, divides: false },
  ];
  const remove = (divides: boolean): MenuEntry => ({ label: "Delete", description: "Remove the work item's worktree and its local branch from disk, after a dialog names what would be lost. Nothing on a remote is removed.", action: { do: "delete", id }, divides });
  const own = groups.find((group) => group.id === workItem.groupId);
  const moves: MenuEntry[] = [
    ...groups.filter((group) => group !== own).map((group) => ({ label: `Move to ${group.name}`, description: `List the work item under the heading ${group.name} of its repository in the sidebar.`, action: { do: "set" as const, id, groupId: group.id }, divides: false })),
    ...(own ? [{ label: `Move out of ${own.name}`, description: "List the work item among its repository's ungrouped work items again.", action: { do: "set" as const, id, groupId: null }, divides: false }] : []),
  ].map((entry, at) => ({ ...entry, divides: at === 0 }));
  if (workItem.archivedAt !== null) return [{ label: "Restore", description: "Put the work item back among the repository's work items, with the panes it had.", action: { do: "restore", id }, divides: false }, ...open, ...copies, remove(true)];
  return [
    { label: "Rename", description: "Give the work item another name, and its branch too where the branch was never pushed.", action: { do: "rename", id }, divides: false },
    ...open,
    ...copies,
    workItem.pinned
      ? { label: "Unpin", description: "Let the work item stand among the others of its list again.", action: { do: "set", id, pinned: false }, divides: true }
      : { label: "Pin", description: "Keep the work item at the top of its list.", action: { do: "set", id, pinned: true }, divides: true },
    workItem.muted
      ? { label: "Unmute notifications", description: "Let this work item's sessions notify you again.", action: { do: "set", id, muted: false }, divides: false }
      : { label: "Mute notifications", description: "Raise no notification for this work item's sessions. Its line still shows its state.", action: { do: "set", id, muted: true }, divides: false },
    ...moves,
    { label: "Archive", description: "Take the work item off the lists and end its sessions. Its folder and its branch stay on disk, and a restore brings it back.", action: { do: "archive", id }, divides: true },
    remove(false),
  ];
}

/**
 * A repository's menu, in its order: Settings and Change icon; Show archived
 * work items and New group; Open in Finder, then one item for each installed
 * editor and terminal; Copy path; Hide from sidebar and Remove. The folder
 * that is opened and copied is the repository's.
 */
export function repositoryMenu(repository: Repository, apps: readonly InstalledApp[]): MenuEntry[] {
  const { id, folder } = repository;
  return [
    { label: "Settings", description: "Change the name the sidebar shows and the branch new work items start from.", action: { do: "settings", id }, divides: false },
    { label: "Change icon", description: "Choose one character to show before the repository's name.", action: { do: "icon", id }, divides: false },
    { label: "Show archived work items", description: "List the work items of this repository that were archived.", action: { do: "archived", id }, divides: true },
    { label: "New group", description: "Make a heading to gather some of this repository's work items under.", action: { do: "group", id }, divides: false },
    ...openEntries(folder, "the repository's", apps),
    { label: "Copy path", description: "Put the repository folder's whole path on the clipboard.", action: { do: "copy", text: folder }, divides: true },
    { label: "Hide from sidebar", description: "Take the repository out of the sidebar. Its work items stay in the inbox.", action: { do: "hide", id }, divides: true },
    { label: "Remove", description: "Take the repository and its work items off Owlery's lists. Nothing on disk is removed unless you choose it in the dialog.", action: { do: "remove", id }, divides: false },
  ];
}

/** What a pointer over the "+" button at the sidebar's top is told: it creates a work item, and its form is where a repository is registered alone. */
export const NEW_WORK_ITEM_SAYS = "Create a work item: a new branch and worktree in a repository. The form can also register a repository alone.";
/** What a pointer over the form's choice "Register the repository only" is told. */
export const REGISTER_ONLY_SAYS = "Add the repository to the sidebar without creating a work item, a branch or a worktree.";

/** The two icon buttons of a repository's row: the name of each, which a screen reader is told, and what a pointer over it is told that a press does. */
export function rowButtons(repositoryName: string): Record<"add" | "menu", { name: string; says: string }> {
  return {
    add: { name: `New work item in ${repositoryName}`, says: `Create a work item in ${repositoryName}: a new branch and worktree.` },
    menu: { name: `Menu of ${repositoryName}`, says: `Open the menu of ${repositoryName}: its settings, its icon, hiding it and removing it.` },
  };
}

/** What the daemon answered a rename's plan with: what a `renamePlan` carries, or the error it refused the plan with. */
export type RenamePlanned = { branch: string | null; blocked: string | null } | { error: string };

/**
 * The rename dialog's choice "Rename the branch too", given the plan the
 * dialog holds for the name typed, or null until the daemon has answered:
 * whether it can be taken, and what the dialog says under it, the branch the
 * rename gives or why the branch keeps its name.
 */
export function renameChoice(plan: RenamePlanned | null): { enabled: boolean; says: string } {
  if (plan === null) return { enabled: false, says: "" };
  if ("error" in plan) return { enabled: false, says: plan.error };
  if (plan.blocked !== null || plan.branch === null) return { enabled: false, says: plan.blocked ?? "" };
  return { enabled: true, says: `The branch becomes ${plan.branch}.` };
}

/**
 * The tabs of a work item's view: its panes as the daemon lists them, whether
 * their process runs or has exited, in the order of their ids. An exited
 * pane keeps its tab until it is closed, and the daemon keeps its last output.
 */
export function paneTabs(workItem: WorkItem, sessions: readonly SessionInfo[]): SessionInfo[] {
  return sessions.filter((session) => session.workItemId === workItem.id).sort((a, b) => a.id - b.id);
}

/**
 * The pane in front when a view shows `tabs`: the one that was `last` in
 * front in that view where it is still a tab, and otherwise the live pane
 * with the highest id, or the tab with the highest id where none is alive.
 * Nothing where there is no tab.
 */
export function paneInFront(tabs: readonly SessionInfo[], last: number | undefined): number | undefined {
  if (tabs.some((tab) => tab.id === last)) return last;
  const recent = [...tabs].sort((a, b) => b.id - a.id);
  return (recent.find((tab) => tab.alive) ?? recent[0])?.id;
}

/** The most panes a work item's view shows at once: the count the 500 MB target is measured at (docs/architecture.md, Memory design). */
export const STAGE_PANES = 4;

/**
 * The panes on the stage of a view that shows `tabs`, in the tabs' order,
 * and the one of them in front, which has the keyboard. `recent` is the panes
 * that were in front in that view, the most recent first. The view's stage
 * order is the panes of `recent` that are still tabs, in that order, and
 * then the tabs that are not in `recent`, which were never in front, the
 * highest id first. The pane in front is `paneInFront`'s for the first of
 * `recent`. Where "Side by side" is not pressed, it is alone on the stage.
 * Where it is pressed, the stage holds up to `STAGE_PANES` panes: the one in
 * front, then the panes of the stage order. A pressed tab is the first of
 * `recent`, so it takes the place of the shown pane last in the stage order.
 * A closed pane that `recentKept` left first takes no place: the stage holds
 * the first `STAGE_PANES` panes of the stage order, and the pane in front is
 * `paneInFront`'s among them. Where fewer than `STAGE_PANES` of the tabs
 * were in front, tabs never in front are among them, and one of those can
 * be the pane in front.
 */
export function stageOf(tabs: readonly SessionInfo[], recent: readonly number[], sideBySide: boolean): { front: number | undefined; shown: number[] } {
  const ids = tabs.map((tab) => tab.id);
  const never = ids.filter((id) => !recent.includes(id)).sort((a, b) => b - a);
  // A set keeps each pane at the first place it is named.
  const byRecency = [...new Set([...recent.filter((id) => ids.includes(id)), ...never])];
  const closedFirst = sideBySide && recent.length > 0 && !ids.includes(recent[0] as number);
  const candidates = closedFirst ? tabs.filter((tab) => byRecency.slice(0, STAGE_PANES).includes(tab.id)) : tabs;
  const front = paneInFront(candidates, recent[0]);
  if (front === undefined) return { front, shown: [] };
  if (!sideBySide) return { front, shown: [front] };
  const top = [...new Set([front, ...byRecency])].slice(0, STAGE_PANES);
  return { front, shown: ids.filter((id) => top.includes(id)) };
}

/**
 * The panes that were in front in a view, the most recent first, once the
 * daemon lists only `listed`. A pane it no longer lists leaves, except the
 * first one: that one stays as the pane last in front, so `paneInFront`
 * finds it is no tab and gives the live pane with the highest id, which
 * `stageOf` takes from the first `STAGE_PANES` panes of its stage order
 * where "Side by side" is pressed, tabs never in front among them where
 * fewer of the tabs were in front, or the one of those panes with the
 * highest id where none of them runs. Were it taken out, the pane in front
 * before it would come in front, an exited one included.
 */
export function recentKept(recent: readonly number[], listed: ReadonlySet<number>): number[] {
  return recent.filter((pane, place) => place === 0 || listed.has(pane));
}

/** Whether the window tells a pane's process the size of the pane's screen: only where the daemon lists the pane with its process running. The pseudo-terminal of a process that exited is closed, and a daemon built before it ignored such a size failed on it. */
export function tellsSize(sessions: readonly SessionInfo[], pane: number): boolean {
  return sessions.some((session) => session.id === pane && session.alive);
}

/** A screen of the pool, by its place there, and a pane. */
export interface ScreenAndPane {
  screen: number;
  pane: number;
}

/**
 * What the pool of terminal screens does when the stage shows `stage`,
 * `holds` being the pane each screen holds now, or nothing for a free one. A
 * pane that stays on the stage keeps its screen. The screen of a pane that
 * left is given back, `back`. A pane that comes on takes the first free
 * screen, one given back here among them, and only where none is free a new
 * one, whose place is one past the pool's end, `taken`. `holds` is the pool
 * after both.
 */
export function screenMoves(holds: readonly (number | undefined)[], stage: readonly number[]): { holds: (number | undefined)[]; back: ScreenAndPane[]; taken: ScreenAndPane[] } {
  const after = holds.map((pane) => (pane !== undefined && stage.includes(pane) ? pane : undefined));
  const back = holds.flatMap((pane, screen) => (pane !== undefined && after[screen] === undefined ? [{ screen, pane }] : []));
  const taken: ScreenAndPane[] = [];
  for (const pane of stage) {
    if (after.includes(pane)) continue;
    const free = after.indexOf(undefined);
    const screen = free === -1 ? after.length : free;
    after[screen] = pane;
    taken.push({ screen, pane });
  }
  return { holds: after, back, taken };
}

/**
 * What the window does with a `replay` or an `output` of a pane, `awaited`
 * being the replays it asked for with an `attach` and has not received: the
 * count after the message, and whether the message is written into the
 * pane's screen. The last replay asked for is written and no other, since it
 * holds what the earlier ones held. Output before it is dropped, since the
 * replay holds that too.
 */
export function replayStep(awaited: number, kind: "replay" | "output"): { awaited: number; write: boolean } {
  if (kind === "output") return { awaited, write: awaited === 0 };
  return { awaited: Math.max(0, awaited - 1), write: awaited === 1 };
}

/** What a screen's turns need of its terminal: a piece it is handed is drawn later, in the order the pieces were handed, and `drawn` runs once the terminal has drawn that piece. */
export interface TerminalWrites {
  write(data: string, drawn?: () => void): void;
}

/** Whose a terminal screen is: the pane on it, and the pane that what its terminal hands the window goes to. */
export interface ScreenTurns {
  /** The pane on the screen, or nothing while the screen is free. */
  readonly pane: number | undefined;
  /** Puts `pane` on the screen. */
  take(pane: number): void;
  /** Takes the screen back from the pane on it, and empties the terminal after what it has still to draw. */
  giveBack(): void;
  /** Hands the terminal what the pane on the screen printed. Where `answered` is false, nothing is sent until the terminal has drawn it. */
  write(data: string, answered: boolean): void;
  /** The pane that what the terminal hands the window now goes to, or nothing where it is sent to nobody. */
  receiver(): number | undefined;
}

/**
 * The turns of the panes on one terminal screen, kept in the order of the
 * terminal's writes. A terminal hands the window what a person types and
 * what it answers a program's question with through one path. A person's
 * keys arrive at once. An answer arrives when the terminal draws the
 * question, which can be after the screen passed to another pane. So nothing
 * is sent until the terminal has drawn everything it was handed before the
 * pane on the screen took it, and what a person types in that span is not
 * sent either. Nothing is sent while the terminal draws a piece written
 * with `answered` false, and nothing from a free screen.
 */
export function screenTurns(term: TerminalWrites): ScreenTurns {
  let pane: number | undefined;
  // The turns the screen has had, and the turn whose output the terminal has reached.
  let turn = 0;
  let reached = 0;
  // The pieces the terminal is drawing whose answers are not sent.
  let muted = 0;
  return {
    get pane() {
      return pane;
    },
    take(next) {
      pane = next;
      turn += 1;
      const taken = turn;
      // An empty piece is drawn in its place among the others, so its callback runs once the terminal has drawn everything handed to it before this turn.
      term.write("", () => {
        reached = taken;
      });
    },
    giveBack() {
      pane = undefined;
      // The reset is handed to the terminal as output is, so what it has still to draw of the pane that leaves is drawn before the reset and not into the next pane's screen.
      term.write("\u001bc");
    },
    write(data, answered) {
      if (answered) {
        term.write(data);
        return;
      }
      muted += 1;
      term.write(data, () => {
        muted -= 1;
      });
    },
    receiver: () => (reached === turn && muted === 0 ? pane : undefined),
  };
}

/**
 * The notification for a session whose state was `previous`, or null where
 * none is shown: one is shown when the state becomes waiting or finished, and
 * never where `inFront` holds: the pane is on the stage of a focused window,
 * so the person is looking at it, whether or not it has the keyboard. None
 * is shown for a session of a work item whose notifications are muted, nor
 * for one of an `archived` work item, which `workItems` does not hold.
 */
export function notificationFor(
  previous: AgentState | null,
  session: SessionInfo,
  inFront: boolean,
  workItems: readonly WorkItem[],
  paneKinds: readonly PaneKindInfo[],
  archived: readonly WorkItem[] = [],
): { title: string; body: string } | null {
  if (session.state === previous || inFront) return null;
  if (session.state !== "waiting" && session.state !== "finished") return null;
  const workItem = workItems.find((item) => item.id === session.workItemId);
  if (workItem?.muted || archived.some((item) => item.id === session.workItemId)) return null;
  return {
    title: workItem ? workItem.title : tabLabel(session, [session], paneKinds),
    body: session.state === "waiting" ? "Waiting for you" : "Finished",
  };
}

/**
 * What a click on a session's notification opens, as the window's lists stand
 * at the click, or null where it opens no view: the session's work item,
 * where the list still holds it, with the session's pane in front where the
 * daemon still lists that pane, and with no pane named where it is closed. A
 * session without a work item opens nothing.
 */
export function notificationOpens(session: Pick<SessionInfo, "id" | "workItemId">, workItems: readonly WorkItem[], sessions: readonly SessionInfo[]): { workItemId: number; pane: number | null } | null {
  const workItem = workItems.find((item) => item.id === session.workItemId);
  if (!workItem) return null;
  return { workItemId: workItem.id, pane: sessions.some((listed) => listed.id === session.id) ? session.id : null };
}

/**
 * What the "New work item" form sends of its fields, in a creation and in a
 * plan, or why it sends nothing. `name` is the name the window generated for
 * this opening of the form, and the title may be empty: the daemon then names
 * the work item by `name`. `base` is the menu's choice, and null where the
 * menu holds none or the request is a plan. An empty folder is refused here,
 * in the form's own words. The daemon refuses every folder that is not
 * absolute, since it would run git with one in the daemon's own folder.
 */
export function workItemFields(repo: string, title: string, name: string, base: string | null): { repo: string; title: string; name: string; base?: string } | { error: string } {
  const fields = { repo: repo.trim(), title: title.trim(), name };
  if (!fields.repo) return { error: "Choose the repository folder." };
  return base === null ? fields : { ...fields, base };
}

/** The folder the form registers a repository by, where "Register the repository only" is chosen: the repository field's text without the spaces around it. An empty one is refused here, in the words a creation's is. */
export function registerFields(repo: string): { folder: string } | { error: string } {
  const folder = repo.trim();
  return folder ? { folder } : { error: "Choose the repository folder." };
}

/** What the daemon answered a plan with: what a `workItemPlan` carries, or the error it refused the plan with. */
export type PlanAnswered = { branch: string; worktree: string; localBases: string[]; remoteBases: string[]; defaultBase: string | null } | { error: string };

/**
 * What the "New work item" form holds of its latest plan: the daemon's
 * answer, and `repo`, the repository field's text the plan was asked for,
 * without the spaces around it.
 */
export type FormPlan = { repo: string } & PlanAnswered;

/**
 * Which of the form's plans a message from the daemon answers, by its request
 * id: the `latest` one, which the form shows, an `earlier` one, which it does
 * not, or none, `other`. `asked` holds the ids of the plans not yet answered.
 */
export function planAnswer(latest: number | undefined, asked: ReadonlySet<number>, requestId: number): "latest" | "earlier" | "other" {
  if (!asked.has(requestId)) return "other";
  return requestId === latest ? "latest" : "earlier";
}

/** The plan the form holds, where it was asked for the text the repository field holds now. */
function planOf(plan: FormPlan | null, repo: string): FormPlan | null {
  return plan !== null && plan.repo === repo.trim() ? plan : null;
}

/**
 * What the form shows under the name: the branch and the folder the work item
 * will get, or, `failed`, the message the daemon refused the plan with, in
 * the branch's place. Nothing where the form holds no answer for the
 * repository field's text.
 */
export function planLine(plan: FormPlan | null, repo: string): { branch: string; worktree: string; failed: boolean } {
  const shown = planOf(plan, repo);
  if (shown === null) return { branch: "", worktree: "", failed: false };
  if ("error" in shown) return { branch: shown.error, worktree: "", failed: true };
  return { branch: shown.branch, worktree: shown.worktree, failed: false };
}

/** A base a person chose in the form's menu, and the repository field's text it was chosen under. */
export interface BaseChoice {
  repo: string;
  base: string;
}

/**
 * The form's menu of the branches a work item can start from: the default
 * base `first`, then the `local` branches and the `remote` ones without it,
 * and the `value` chosen. The value is the person's choice while the
 * repository field's text is the one it was made under and the plan lists it,
 * and otherwise the default base, or the first base listed where the
 * repository has none. The menu holds nothing, and its value is null, where
 * the form holds no answer for the repository field's text or the answer
 * lists no base.
 */
export function baseMenu(plan: FormPlan | null, choice: BaseChoice | null, repo: string): { first: string | null; local: string[]; remote: string[]; value: string | null } {
  const shown = planOf(plan, repo);
  if (shown === null || "error" in shown) return { first: null, local: [], remote: [], value: null };
  const first = shown.defaultBase;
  const local = shown.localBases.filter((base) => base !== first);
  const remote = shown.remoteBases.filter((base) => base !== first);
  const listed = [...(first === null ? [] : [first]), ...local, ...remote];
  const kept = choice !== null && choice.repo === shown.repo && listed.includes(choice.base) ? choice.base : null;
  return { first, local, remote, value: kept ?? listed[0] ?? null };
}

/**
 * The settings dialog's menu of the bases a repository's new work items can
 * start from: the `local` branches and the `remote` ones, whole, as the plan
 * the dialog asked for lists them, and the `value` chosen, the base the
 * repository has, or an empty string for the first choice, the repository's
 * default branch. A base the repository has and the plan does not list
 * stands among the local ones, so the menu shows the choice the daemon
 * keeps. It stands alone until the daemon answers, and where it refuses.
 */
export function settingsBases(plan: PlanAnswered | null, chosen: string | null): { local: string[]; remote: string[]; value: string } {
  const listed = plan !== null && !("error" in plan) ? { local: plan.localBases, remote: plan.remoteBases } : { local: [], remote: [] };
  const known = chosen === null || listed.local.includes(chosen) || listed.remote.includes(chosen);
  return { local: known ? [...listed.local] : [...listed.local, chosen], remote: [...listed.remote], value: chosen ?? "" };
}

/**
 * What the settings dialog sends for a repository: the name where it is
 * another than the one a person gave, null for an empty one, and the base
 * where the menu's value is another than the repository's, null for the
 * first choice. A field that did not change is left out, and an object with
 * none is nothing to send.
 */
export function settingsFields(repository: Repository, name: string, base: string): { name?: string | null; defaultBase?: string | null } {
  const named = name.trim() || null;
  const chosen = base || null;
  return { ...(named === repository.customName ? {} : { name: named }), ...(chosen === repository.defaultBase ? {} : { defaultBase: chosen }) };
}

/**
 * Whether the "Ask" button of a work item's view can be pressed, and its
 * title: where it asks, or why it cannot. The daemon refuses a prompt of
 * white space.
 */
export function askButton(prompt: string, workItem: WorkItem): { enabled: boolean; title: string } {
  if (!prompt.trim()) return { enabled: false, title: "Type what to ask." };
  return { enabled: true, title: `Ask in ${workItem.title}` };
}

/** The headless sessions the window holds, with one the daemon just sent: in place of the one of the same id, or after the others. */
export function withHeadless(held: readonly HeadlessInfo[], changed: HeadlessInfo): HeadlessInfo[] {
  return held.some((info) => info.id === changed.id) ? held.map((info) => (info.id === changed.id ? changed : info)) : [...held, changed];
}

export interface HeadlessLine {
  id: number;
  prompt: string;
  state: HeadlessState;
  /** The answer as far as it has arrived, or the error of a session that failed. */
  text: string;
}

/** The lines of one work item's headless sessions, the most recent first, so the one just asked sits under the field. */
export function headlessLines(held: readonly HeadlessInfo[], workItemId: number): HeadlessLine[] {
  return held
    .filter((info) => info.workItemId === workItemId)
    .sort((a, b) => b.id - a.id)
    .map((info) => ({ id: info.id, prompt: info.prompt, state: info.state, text: info.state === "failed" ? (info.error ?? "") : info.answer }));
}
