// What the window says and sends, apart from the page that shows it, so the
// cases can read it without a browser. The kinds of pane, with their labels,
// are the daemon's list from `ready`: nothing here names one.
import type { AgentState, HeadlessInfo, HeadlessState, PaneKind, PaneKindInfo, SessionInfo, WorkItem } from "../shared/protocol";

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
  const reporting = livePanes(workItem, sessions).find((session) => paneKinds.some((offered) => offered.kind === session.kind && offered.reportsState));
  const count = workItem.newCommits ?? 0;
  return {
    title: workItem.title,
    branch: workItem.branch,
    state: reporting ? reporting.state : null,
    commits: count > 0 ? `${count} new ${count === 1 ? "commit" : "commits"}` : "",
  };
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
