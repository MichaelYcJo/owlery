// What the window's parts share: the daemon's lists as the window holds them,
// the window's own state, the connection to the daemon, and the pieces every
// part draws with. Each part, a module of its own, draws what the functions
// of ./view return.
import type { InstalledApp } from "../shared/ipc";
import type { AgentState, ClientMessage, HeadlessInfo, HeadlessState, KeepAwake, Look, PaneKindInfo, Repository, SessionInfo, WorkItem } from "../shared/protocol";
import { commitLines, fileLines, lineMarks, matchWorkItems, stateHeading, stateSays, stateWithAge, workItemEntries, type Change, type Entry, type StateFilter } from "./view";

export const held = {
  /** True from the daemon's `ready` on. No screen is shown before it. */
  ready: false,
  /** The kinds of pane the daemon offers, as `ready` listed them: the buttons, the form's choice and the tab labels come from here. */
  paneKinds: [] as PaneKindInfo[],
  /** The sessions and the work items as the daemon last listed them, at `ready` and at each `inbox`, and what this window started or created since. */
  sessions: [] as SessionInfo[],
  workItems: [] as WorkItem[],
  /** The repositories the daemon keeps, the hidden among them, and the archived work items, as the daemon last listed them. Both are empty against a daemon of a build before the repositories, and `daemonNotice` then says so. */
  repositories: [] as Repository[],
  archived: [] as WorkItem[],
  /** The editors and the terminals the main process found installed, asked for once at load. A menu offers to open a folder in each. */
  apps: [] as InstalledApp[],
  /** What the status line says of the daemon in place of its state, or nothing. A notice of the window's own stands before it. */
  daemonNotice: "",
  /** The headless sessions as the daemon listed them at `ready`, each replaced whole at every `headless` since. */
  headless: [] as HeadlessInfo[],
  /** The look the daemon held when this window said hello, or null where no person looked before. The window keeps none of its own. */
  lastLook: null as Look | null,
  /** When the daemon keeps the Mac awake and whether it does now, as `ready` and each `keepAwake` since said it, or null against a daemon that sends none: one of an earlier build, or one that can hold nothing. */
  keepAwake: null as KeepAwake | null,
  /** The work items that changed since that look, worked out once, at `ready`, and held until the next load. */
  changes: [] as Change[],
  /** The work item whose view is on screen, or nothing while another screen is. It is kept nowhere else, so a reload opens on the summary or on the inbox. */
  viewing: undefined as number | undefined,
  /** The repository whose archived work items the archived screen lists: the one it was last opened on, or nothing before it was opened. */
  archivedOf: undefined as number | undefined,
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

/**
 * The seal's place: on a line a small disc, and in the preview and at the
 * foot of a view's right column the seal's own drawing, which the page's
 * style presses blank into the ground. No work item can be sealed yet, so
 * `data-seal` is `none` everywhere, and the place says so.
 */
export function sealPlace(where: "line" | "preview" | "view"): HTMLElement {
  const place = document.createElement("span");
  place.className = where === "line" ? "seal" : where === "preview" ? "seal drawn" : "seal drawn large";
  place.dataset.seal = "none";
  place.setAttribute("role", "img");
  place.setAttribute("aria-label", NO_SEAL);
  place.title = NO_SEAL;
  return place;
}

/** The class that gives a state its colour. */
export function stateClass(state: AgentState | null): AgentState | "no-agent" {
  return state ?? "no-agent";
}

const SVG = "http://www.w3.org/2000/svg";

/** A line icon of the page, 16 units square, from the shapes given: each a path's data, or a circle as its centre and its radius, with a class where the style needs one. */
export function icon(shapes: readonly (string | { circle: [number, number, number]; className?: string } | { path: string; className: string })[]): SVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "icon");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  for (const shape of shapes) {
    if (typeof shape !== "string" && "circle" in shape) {
      const circle = document.createElementNS(SVG, "circle");
      circle.setAttribute("cx", String(shape.circle[0]));
      circle.setAttribute("cy", String(shape.circle[1]));
      circle.setAttribute("r", String(shape.circle[2]));
      if (shape.className) circle.setAttribute("class", shape.className);
      svg.append(circle);
    } else {
      const path = document.createElementNS(SVG, "path");
      path.setAttribute("d", typeof shape === "string" ? shape : shape.path);
      if (typeof shape !== "string") path.setAttribute("class", shape.className);
      svg.append(path);
    }
  }
  return svg;
}

/** The mark of a repository's fold, which the style turns where the repository is folded. */
export const CHEVRON = ["M4.5 6.5L8 10l3.5-3.5"] as const;
/** The mark of the button that makes a new work item, as the head of the repositories draws it. */
export const PLUS = ["M8 3.5v9M3.5 8h9"] as const;
/** The mark of the button that opens a menu: three dots in a row. */
export const DOTS = [{ circle: [3.5, 8, 0.5] }, { circle: [8, 8, 0.5] }, { circle: [12.5, 8, 0.5] }] as const satisfies Parameters<typeof icon>[0];

/** The marks of a work item's line: a pin, and a bell struck through for muted notifications. */
const MARK_SHAPES = {
  pinned: ["M6 2.5h4l-.5 3.7 2 2.3h-7l2-2.3z", "M8 8.5v5"],
  muted: ["M4.6 11V7.4a3.4 3.4 0 0 1 6.8 0V11l1 1.3H3.6z", "M2.8 2.8l10.4 10.4"],
} as const;

/** The marks a work item's line carries after its title, as `lineMarks` gives them: each an icon that says its words to a pointer and to a screen reader. */
export function lineMarkIcons(workItem: WorkItem): HTMLElement[] {
  return lineMarks(workItem).map(({ mark, words }) => {
    const element = part(`line-mark ${mark}`, "");
    element.append(icon(MARK_SHAPES[mark]));
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", words);
    element.title = words;
    return element;
  });
}

// The shapes of a state's icon: a speech mark for a wait, a ring that turns for work, a check in a circle for an end, a crescent for no agent, and a triangle for a failure.
type StateShape = "waiting" | "working" | "finished" | "no-agent" | "failed";
const STATE_SHAPES: Record<StateShape, Parameters<typeof icon>[0]> = {
  waiting: ["M3.2 3h9.6a1.7 1.7 0 0 1 1.7 1.7v4.6a1.7 1.7 0 0 1-1.7 1.7H8.4l-3.2 2.8V11h-2a1.7 1.7 0 0 1-1.7-1.7V4.7A1.7 1.7 0 0 1 3.2 3z"],
  working: [{ circle: [8, 8, 5.6], className: "track" }, { path: "M8 2.4A5.6 5.6 0 0 1 13.6 8", className: "turn" }],
  finished: [{ circle: [8, 8, 5.8] }, "M5.3 8.2l1.9 1.9 3.6-4"],
  "no-agent": ["M12.9 9.7A5.6 5.6 0 0 1 6.3 3.1 5.6 5.6 0 1 0 12.9 9.7z"],
  failed: ["M8 2.3l6 10.5H2z", "M8 6.6v2.8", "M8 11.1v.1"],
};

/**
 * A state's icon, which says the state in its shape and its colour and, to a
 * pointer and a screen reader, in `words`. A failed headless session has an
 * icon of its own.
 */
function iconOf(shape: StateShape, words: string): HTMLElement {
  const element = part(`state-icon state ${shape}`, "");
  element.append(icon(STATE_SHAPES[shape]));
  element.setAttribute("role", "img");
  element.setAttribute("aria-label", words);
  element.title = words;
  return element;
}

/**
 * The icon of a work item's state, named in the words of its heading. On a
 * line of a list `changed` says that the work item changed since the person
 * last looked, and the icon's words, which a line's name holds, say so too.
 */
export function stateIcon(state: AgentState | null, changed = false): HTMLElement {
  return iconOf(stateClass(state), changed ? `${stateHeading(state)}, changed since you were last here` : stateHeading(state));
}

/** The icon of a headless session's state, named by the state's own word. */
export function headlessIcon(state: HeadlessState): HTMLElement {
  return iconOf(state, state);
}

/** Draws a state in words where the preview and a view's right column say it: its icon, then the state with its age. */
export function showState(element: HTMLElement, state: AgentState | null, since: number | null | undefined): void {
  element.className = `state-words state ${stateClass(state)}`;
  element.replaceChildren(stateIcon(state), stateWithAge(state, since, Date.now()));
}

/** The lines a commit or a file added and removed, each in its own colour: the two parts of what `lineCounts` gives. */
function counts(text: string): HTMLElement {
  const element = part("counts", "");
  const [added, removed] = text.split(" ");
  if (added !== undefined && removed !== undefined) element.append(part("added", added), part("removed", removed));
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
      return item("commit", mark, part("hash", line.hash), part("subject", line.subject), counts(line.counts), part("age", line.age));
    });
    parts.push(section("commits", heading("Commits"), ...(lines.length > 0 ? [listOf(lines)] : []), ...(commits.foot ? [part("hint foot", commits.foot)] : [])));
  }
  const files = fileLines(entry.workItem);
  if (files) {
    const lines = files.lines.map((line) => item("file", part("path", line.path), counts(line.counts)));
    parts.push(section("files", heading("Changes", part("sum", files.sum)), ...(lines.length > 0 ? [listOf(lines)] : []), ...(files.foot ? [part("hint foot", files.foot)] : [])));
  }
  return parts;
}
