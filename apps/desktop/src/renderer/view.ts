// What the window says and sends, apart from the page that shows it, so the
// cases can read it without a browser. The kinds of pane, with their labels,
// are the daemon's list from `ready`: nothing here names one.
import type { AgentState, HeadlessInfo, HeadlessState, Look, PaneKind, PaneKindInfo, SessionInfo, WorkItem } from "../shared/protocol";

/** A tab's label: the pane's kind, as the daemon labels it, and its id. The work item's title is the view's header's to say. */
export function tabLabel(session: SessionInfo, paneKinds: readonly PaneKindInfo[]): string {
  const kind = paneKinds.find((offered) => offered.kind === session.kind);
  return `${kind ? kind.label : session.kind} ${session.id}`;
}

/** The first kind of pane that reports its agent's state: the one the "New work item" form starts on. */
export function agentKind(paneKinds: readonly PaneKindInfo[]): PaneKind | undefined {
  return paneKinds.find((offered) => offered.reportsState)?.kind;
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

/** A line's state in words: the heading of its group in the inbox, which the preview and a view's header say as well. */
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

/** A repository's name: the one the daemon sends, or the last part of its folder for a daemon of an earlier build, which sends none. */
function repoNameOf(workItem: WorkItem): string {
  return (workItem.repoName as string | undefined) ?? workItem.repo.split("/").filter(Boolean).at(-1) ?? workItem.repo;
}

export interface SidebarRepository {
  /** The repository's folder, which tells two repositories of one name apart. */
  repo: string;
  name: string;
  /** How many work items are listed under it. */
  count: number;
  entries: Entry[];
}

/**
 * The sidebar's repositories: each repository a given work item is of, in the
 * order of its first work item, with its work items in the order given. A
 * repository is its folder, so two of one name are two.
 */
export function sidebarTree(workItems: readonly WorkItem[], sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): SidebarRepository[] {
  const tree: SidebarRepository[] = [];
  for (const entry of workItemEntries(workItems, sessions, paneKinds)) {
    let repository = tree.find((held) => held.repo === entry.workItem.repo);
    if (!repository) {
      repository = { repo: entry.workItem.repo, name: repoNameOf(entry.workItem), count: 0, entries: [] };
      tree.push(repository);
    }
    repository.entries.push(entry);
    repository.count = repository.entries.length;
  }
  return tree;
}

/**
 * The history screen's lines: the work items whose agent finished, the one
 * that finished last first. Two that finished at one time keep the order
 * given, and one whose time the daemon did not send stands last.
 */
export function historyLines<E extends { line: InboxLine; session: SessionInfo | undefined }>(entries: readonly E[]): E[] {
  const since = (entry: E) => entry.session?.stateSince ?? Number.NEGATIVE_INFINITY;
  return entries.filter((entry) => entry.line.state === "finished").sort((a, b) => (since(a) === since(b) ? 0 : since(b) > since(a) ? 1 : -1));
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
export function emptyList(screen: "inbox" | "history", total: number, shown: number): string {
  if (shown > 0) return "";
  if (total > 0) return "No work item matches.";
  return screen === "inbox" ? "No work items yet." : "Nothing has finished yet.";
}

export interface Change {
  workItem: WorkItem;
  /** The work item's line as the lists now give it. */
  line: InboxLine;
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
    return [{ workItem, line, sentence: said.join(" ") }];
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

/** The status line where the window has nothing else to say: that the daemon runs, and how many agents do, an agent being a live pane of a kind that reports its state. */
export function daemonStatus(sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): string {
  const agents = sessions.filter((session) => session.alive && paneKinds.some((offered) => offered.kind === session.kind && offered.reportsState)).length;
  return `Daemon running, ${agents === 0 ? "no agent" : agents === 1 ? "1 agent" : `${agents} agents`}`;
}

/**
 * When the person was last here, `at` and `now` being times in milliseconds:
 * in minutes under an hour, in hours and minutes under a day, and in days
 * from then on.
 */
export function lastHere(at: number, now: number): string {
  const minutes = Math.floor((now - at) / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  let ago: string;
  if (minutes < 1) ago = "less than a minute";
  else if (hours < 1) ago = `${minutes} min`;
  else if (days < 1) ago = minutes % 60 === 0 ? `${hours} h` : `${hours} h ${minutes % 60} min`;
  else ago = `${days} ${days === 1 ? "day" : "days"}`;
  return `You were last here ${ago} ago.`;
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
 * What a key does on the inbox screen, or null where the window leaves it
 * alone. J and K are read by their place on the keyboard, so they act under
 * any input source. No key is read while another screen is in front, a
 * dialog is open, the focus is in a field or a modifier key is held. Enter
 * on a control is that control's own press.
 */
export function inboxKey(
  key: { code: string; modified: boolean },
  where: { inboxInFront: boolean; dialogOpen: boolean; inField: boolean; onControl: boolean },
): "next" | "previous" | "open" | null {
  if (!where.inboxInFront || where.dialogOpen || where.inField || key.modified) return null;
  if (key.code === "KeyJ") return "next";
  if (key.code === "KeyK") return "previous";
  if (key.code === "Enter" && !where.onControl) return "open";
  return null;
}

/**
 * What a key pressed with the Command key does on every screen, or null
 * where the window leaves it alone: K puts the focus in the search field. The
 * Control key stands for the Command key where the keyboard has none. The key
 * is read by its place on the keyboard, and not while a dialog is open or
 * another modifier key is held as well.
 */
export function commandKey(key: { code: string; meta: boolean; ctrl: boolean; alt: boolean; shift: boolean }, where: { mac: boolean; dialogOpen: boolean }): "search" | null {
  const command = where.mac ? key.meta && !key.ctrl : key.ctrl && !key.meta;
  if (!command || key.alt || key.shift || where.dialogOpen) return null;
  return key.code === "KeyK" ? "search" : null;
}

/**
 * The tabs of a work item's view, in the order of the panes' ids: its panes
 * whose process runs, and those whose terminal this window holds, `held`
 * being their ids. An exited pane the window holds keeps its tab and its last
 * screen until it is closed; one it does not hold has nothing to show.
 */
export function paneTabs(workItem: WorkItem, sessions: readonly SessionInfo[], held: ReadonlySet<number>): SessionInfo[] {
  return sessions.filter((session) => session.workItemId === workItem.id && (session.alive || held.has(session.id))).sort((a, b) => a.id - b.id);
}

/**
 * The pane in front when a view shows `tabs`: the one that was `last` in
 * front in that view where it is still a tab, and otherwise the most recent
 * live pane, or the most recent tab where none is alive. Nothing where there
 * is no tab.
 */
export function paneInFront(tabs: readonly SessionInfo[], last: number | undefined): number | undefined {
  if (tabs.some((tab) => tab.id === last)) return last;
  const recent = [...tabs].sort((a, b) => b.id - a.id);
  return (recent.find((tab) => tab.alive) ?? recent[0])?.id;
}

/**
 * The notification for a session whose state was `previous`, or null where
 * none is shown: one is shown when the state becomes waiting or finished, and
 * never for the pane in front of a focused window, which the person is looking at.
 */
export function notificationFor(
  previous: AgentState | null,
  session: SessionInfo,
  inFront: boolean,
  workItems: readonly WorkItem[],
  paneKinds: readonly PaneKindInfo[],
): { title: string; body: string } | null {
  if (session.state === previous || inFront) return null;
  if (session.state !== "waiting" && session.state !== "finished") return null;
  const workItem = workItems.find((item) => item.id === session.workItemId);
  return {
    title: workItem ? workItem.title : tabLabel(session, paneKinds),
    body: session.state === "waiting" ? "Waiting for you" : "Finished",
  };
}

/**
 * The folder and the title the "New work item" form sends, or why it sends
 * nothing. An empty folder is refused here because the daemon would run git
 * with it in the daemon's own folder.
 */
export function workItemFields(repo: string, title: string): { repo: string; title: string } | { error: string } {
  const fields = { repo: repo.trim(), title: title.trim() };
  if (!fields.repo) return { error: "Choose the repository folder." };
  if (!fields.title) return { error: "Give the work item a title." };
  return fields;
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
