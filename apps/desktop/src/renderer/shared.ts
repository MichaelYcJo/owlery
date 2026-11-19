// What the window's parts share: the daemon's lists as the window holds them,
// the window's own state, the connection to the daemon, and the pieces every
// part draws with. Each part, a module of its own, draws what the functions
// of ./view return.
import type { AgentState, ClientMessage, HeadlessInfo, Look, PaneKindInfo, SessionInfo, WorkItem } from "../shared/protocol";
import { commitLines, fileLines, matchWorkItems, stateHeading, stateSays, workItemEntries, type Change, type Entry, type StateFilter } from "./view";

export const held = {
  /** True from the daemon's `ready` on. No screen is shown before it. */
  ready: false,
  /** The kinds of pane the daemon offers, as `ready` listed them: the buttons, the form's choice and the tab labels come from here. */
  paneKinds: [] as PaneKindInfo[],
  /** The sessions and the work items as the daemon last listed them, at `ready` and at each `inbox`, and what this window started or created since. */
  sessions: [] as SessionInfo[],
  workItems: [] as WorkItem[],
  /** The headless sessions as the daemon listed them at `ready`, each replaced whole at every `headless` since. */
  headless: [] as HeadlessInfo[],
  /** The look the daemon held when this window said hello, or null where no person looked before. The window keeps none of its own. */
  lastLook: null as Look | null,
  /** The work items that changed since that look, worked out once, at `ready`, and held until the next load. */
  changes: [] as Change[],
  /** The work item whose view is on screen, or nothing while another screen is. It is kept nowhere else, so a reload opens on the summary or on the inbox. */
  viewing: undefined as number | undefined,
  /** What is typed in the search field and the state the filter shows. Both narrow the sidebar's work items and the list in front, and neither is kept across a load. */
  query: "",
  filter: "all" as StateFilter,
};

let socket: WebSocket | undefined;
let nextRequest = 1;

/** Takes the connection to the daemon, once it is made. */
export function connectedBy(ws: WebSocket): void {
  socket = ws;
}

export function connected(): boolean {
  return socket?.readyState === WebSocket.OPEN;
}

export function send(message: ClientMessage): void {
  socket?.send(JSON.stringify(message));
}

/** The id of the window's next request to the daemon. */
export function request(): number {
  return nextRequest++;
}

export function byId<E extends HTMLElement = HTMLElement>(id: string): E {
  return document.getElementById(id) as E;
}

/** Every work item with its line, as the daemon's lists now give it. */
export function entries(): Entry[] {
  return workItemEntries(held.workItems, held.sessions, held.paneKinds);
}

/** The work items the search and the filter leave. */
export function narrowed(): Entry[] {
  return matchWorkItems(entries(), held.query, held.filter);
}

/** Whether a work item changed since the person last looked: its title is then drawn in the strong ink. Nothing is marked where no look is recorded. */
export function changedSince(workItemId: number): boolean {
  return held.lastLook !== null && held.changes.some((change) => change.workItem.id === workItemId);
}

export function part(className: string, text: string): HTMLElement {
  const element = document.createElement("span");
  element.className = className;
  element.textContent = text;
  return element;
}

export function row(...parts: HTMLElement[]): HTMLElement {
  const element = document.createElement("span");
  element.className = "row";
  element.append(...parts);
  return element;
}

/** A text with the places given marked: the letters that match what is typed in the search field. */
export function marked(className: string, text: string, ranges: readonly (readonly [number, number])[]): HTMLElement {
  const element = part(className, "");
  let at = 0;
  for (const [start, end] of ranges) {
    const mark = document.createElement("mark");
    mark.textContent = text.slice(start, end);
    element.append(text.slice(at, start), mark);
    at = end;
  }
  element.append(text.slice(at));
  return element;
}

/** A work item's title, in the strong ink where the work item changed since the person last looked. */
export function titleClass(workItemId: number): string {
  return changedSince(workItemId) ? "title changed" : "title";
}

const NO_SEAL = "No seal yet";

/** The seal's place. No work item can be sealed yet, so it is a ring the page's style draws, with no image, and says so. */
export function sealPlace(large = false): HTMLElement {
  const ring = document.createElement("span");
  ring.className = large ? "seal unsealed large" : "seal unsealed";
  ring.setAttribute("role", "img");
  ring.setAttribute("aria-label", NO_SEAL);
  ring.title = NO_SEAL;
  return ring;
}

/** The class that gives a state its colour. */
export function stateClass(state: AgentState | null): string {
  return state ?? "no-agent";
}

/**
 * A state's dot, which says the state in its colour and, to a pointer and a
 * screen reader, in the words of its heading. On a line of a list, where a
 * look is recorded, `changed` says whether the work item changed since: the
 * dot is filled where it did and a ring where it did not, and its words say
 * which.
 */
export function dot(state: AgentState | null, changed?: boolean): HTMLElement {
  const element = part(`dot state ${stateClass(state)}${changed === false ? " unchanged" : ""}`, "");
  const words = changed === undefined ? stateHeading(state) : `${stateHeading(state)}, ${changed ? "changed" : "not changed"} since you were last here`;
  element.setAttribute("role", "img");
  element.setAttribute("aria-label", words);
  element.title = words;
  return element;
}

function section(className: string, heading: HTMLElement, ...parts: HTMLElement[]): HTMLElement {
  const element = document.createElement("section");
  element.className = className;
  element.append(heading, ...parts);
  return element;
}

function heading(text: string, ...parts: HTMLElement[]): HTMLElement {
  const element = document.createElement("h3");
  element.className = "caption";
  element.append(text, ...parts);
  return element;
}

function listOf(lines: readonly HTMLElement[]): HTMLElement {
  const list = document.createElement("ul");
  list.append(...lines);
  return list;
}

function item(className: string, ...parts: HTMLElement[]): HTMLElement {
  const element = document.createElement("li");
  element.className = className;
  element.append(...parts);
  return element;
}

/**
 * What the preview and a view's right column say of a work item alike: what
 * its agent says, its commits and its changed files, each left out where the
 * daemon sent none. The first `gained` commits carry the dot of a commit the
 * branch gained since the person last looked.
 */
export function detail(entry: Entry, gained: number): HTMLElement[] {
  const parts: HTMLElement[] = [];
  const says = stateSays(entry.session, held.paneKinds);
  // The agent's words are plain text, never markup.
  if (says) parts.push(section("says", heading(says.head), part("said", says.text)));
  const commits = commitLines(entry.workItem, gained, Date.now());
  if (commits) {
    const lines = commits.lines.map((line) => {
      const mark = part(line.gained ? "gained new" : "gained", "");
      if (line.gained) {
        mark.setAttribute("role", "img");
        mark.setAttribute("aria-label", "New since you were last here");
        mark.title = "New since you were last here";
      }
      return item("commit", mark, part("hash", line.hash), part("subject", line.subject), part("counts", line.counts), part("age", line.age));
    });
    parts.push(section("commits", heading("Commits"), ...(lines.length > 0 ? [listOf(lines)] : []), ...(commits.foot ? [part("hint foot", commits.foot)] : [])));
  }
  const files = fileLines(entry.workItem);
  if (files) {
    const lines = files.lines.map((line) => item("file", part("path", line.path), part("counts", line.counts)));
    parts.push(section("files", heading("Changes", part("sum", files.sum)), ...(lines.length > 0 ? [listOf(lines)] : []), ...(files.foot ? [part("hint foot", files.foot)] : [])));
  }
  return parts;
}
