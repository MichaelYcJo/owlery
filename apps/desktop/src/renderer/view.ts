// What the window says and sends, apart from the page that shows it, so the
// cases can read it without a browser. The kinds of pane, with their labels,
// are the daemon's list from `ready`: nothing here names one.
import type { AgentState, HeadlessInfo, HeadlessState, PaneKind, PaneKindInfo, SessionInfo, WorkItem } from "../shared/protocol";

/**
 * A tab's label: the pane's kind, as the daemon labels it, and id, after the
 * title of the work item the pane runs in where the window holds that work item.
 */
export function tabLabel(session: SessionInfo, workItems: readonly WorkItem[], paneKinds: readonly PaneKindInfo[]): string {
  const kind = paneKinds.find((offered) => offered.kind === session.kind);
  const pane = `${kind ? kind.label : session.kind} ${session.id}`;
  const workItem = workItems.find((item) => item.id === session.workItemId);
  return workItem ? `${workItem.title} · ${pane}` : pane;
}

/** The first kind of pane that reports its agent's state: the one a new work item and an inbox line open. */
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

/**
 * What a click on a work item's line does: shows its most recent live pane,
 * or starts a pane of the first kind that reports state where it has none.
 */
export function paneToOpen(workItem: WorkItem, sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): { show: number } | { start: PaneKind } | undefined {
  const live = livePanes(workItem, sessions)[0];
  if (live) return { show: live.id };
  const kind = agentKind(paneKinds);
  return kind ? { start: kind } : undefined;
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
    title: workItem ? workItem.title : tabLabel(session, workItems, paneKinds),
    body: session.state === "waiting" ? "Waiting for you" : "Finished",
  };
}

/**
 * The folder and the title the "+ Work item" form sends, or why it sends
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
 * The work item the pane in front runs in, which is where "Ask" asks. Nothing
 * where no pane is in front, the pane was opened without a work item, or the
 * window does not hold the pane or its work item.
 */
export function workItemInFront(front: number | undefined, sessions: readonly SessionInfo[], workItems: readonly WorkItem[]): WorkItem | undefined {
  const pane = sessions.find((session) => session.id === front);
  return pane ? workItems.find((item) => item.id === pane.workItemId) : undefined;
}

/**
 * Whether the "Ask" button can be pressed, and its title: where it asks, or
 * why it cannot. A headless session runs in a work item's worktree alone, and
 * the daemon refuses a prompt of white space.
 */
export function askButton(prompt: string, workItem: WorkItem | undefined): { enabled: boolean; title: string } {
  if (!workItem) return { enabled: false, title: "Bring a work item's pane to the front to ask in it." };
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

/** The lines of the headless sessions, the most recent first, so the one just asked sits under the field. */
export function headlessLines(held: readonly HeadlessInfo[]): HeadlessLine[] {
  return [...held]
    .sort((a, b) => b.id - a.id)
    .map((info) => ({ id: info.id, prompt: info.prompt, state: info.state, text: info.state === "failed" ? (info.error ?? "") : info.answer }));
}
