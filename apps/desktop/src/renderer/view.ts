// What the window says and sends, apart from the page that shows it, so the
// cases can read it without a browser.
import type { SessionInfo, WorkItem } from "../shared/protocol";

/**
 * A tab's label: the pane's kind and id, after the title of the work item the
 * pane runs in where the window holds that work item.
 */
export function tabLabel(session: SessionInfo, workItems: readonly WorkItem[]): string {
  const pane = `${session.kind === "claude" ? "Claude Code" : "Shell"} ${session.id}`;
  const workItem = workItems.find((item) => item.id === session.workItemId);
  return workItem ? `${workItem.title} · ${pane}` : pane;
}

/** One line of the window's list of work items. */
export function workItemLine(workItem: WorkItem): string {
  return `${workItem.title} · ${workItem.branch}`;
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
