// What the window's parts share: the daemon's lists as the window holds them,
// the window's own state, the connection to the daemon, and the pieces every
// part draws with. Each part, a module of its own, draws what the functions
// of ./view return.
import type { InstalledApp } from "../shared/ipc";
import type { AgentState, AskedQuestion, ClientMessage, HeadlessInfo, HeadlessState, KeepAwake, Look, PaneKindInfo, Repository, SessionInfo, WorkItem } from "../shared/protocol";
import { choiceNote, commitLines, decisionLines, DECISIONS_HEAD, fileLines, lineMarks, matchWorkItems, RUN_SETUP_SAYS, SETUP_HEAD, setupSection, stateHeading, stateSays, stateWithAge, unreadLines, workItemEntries, type Change, type Entry, type StateFilter } from "./view";

export const held = {
  /** True from the daemon's `ready` on. No screen is shown before it. */
  ready: false,
  /** The kinds of pane the daemon offers, as `ready` listed them: the buttons, the form's choice and the tab labels come from here. */
  paneKinds: [] as PaneKindInfo[],
  /** The sessions and the work items as the daemon last listed them, at `ready` and at each `inbox`, and what this window started or created since. */
  sessions: [] as SessionInfo[],
  workItems: [] as WorkItem[],
  /** The repositories the daemon keeps, the hidden among them, and the archived work items, as the daemon last listed them. Both are empty against a daemon of a build before the repositories, which `daemonNotice` then names as one of another build. */
  repositories: [] as Repository[],
  archived: [] as WorkItem[],
  /** The editors and the terminals the main process found installed, asked for once at load. A menu offers to open a folder in each. */
  apps: [] as InstalledApp[],
  /** What the status line says of the daemon in place of its state, or nothing: that the daemon is of another build, as the main process answered when this page asked for the daemon (./view, `daemonNotice`). A notice of the window's own stands before it. */
  daemonNotice: "",
  /** What the daemon's adapter said a person should know of its agent, as `ready` and each `agentNotice` since said it, or null where it said nothing: the status line says it after the window's own notice and the daemon's (./view, `statusNotice`). */
  agentNotice: null as string | null,
  /** The headless sessions as the daemon listed them at `ready`, each replaced whole at every `headless` since, and taken out at the `headlessDropped` that names it. */
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

/** The class that gives a state its colour and its mark the theme's shapes. */
export function stateClass(state: AgentState | null): AgentState | "no-agent" {
  return state ?? "no-agent";
}

const SVG = "http://www.w3.org/2000/svg";

/** A line icon of the page, 16 units square, from the shapes given: each a path's data, or a circle as its centre and its radius. */
export function icon(shapes: readonly (string | { circle: [number, number, number] })[]): SVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "icon");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  for (const shape of shapes) {
    if (typeof shape !== "string") {
      const circle = document.createElementNS(SVG, "circle");
      circle.setAttribute("cx", String(shape.circle[0]));
      circle.setAttribute("cy", String(shape.circle[1]));
      circle.setAttribute("r", String(shape.circle[2]));
      svg.append(circle);
    } else {
      const path = document.createElementNS(SVG, "path");
      path.setAttribute("d", shape);
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

/** The states a mark is drawn for: an agent's three, a work item with no agent, and a headless session's failure. */
type MarkedState = AgentState | HeadlessState | "no-agent";

/** The parts of a state's mark: a line, a filled part, and for work the faint track and the part that turns. The page's style gives each the shape the theme in use holds for the state, so no shape stands here. */
const MARK_PARTS = ["line", "fill", "track", "turn"] as const;

/**
 * A state's icon, which says the state in its shape and its colour and, to a
 * pointer and a screen reader, in `words`. A failed headless session has an
 * icon of its own.
 */
function iconOf(state: MarkedState, words: string): HTMLElement {
  const element = part(`state-icon state ${state}`, "");
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  for (const name of MARK_PARTS) {
    const path = document.createElementNS(SVG, "path");
    path.setAttribute("class", name);
    svg.append(path);
  }
  element.append(svg);
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

/** The icon of a headless session's line, `mark` being its state or `waiting` while it waits for the person, named by `words`, the line's words for it. */
export function headlessIcon(mark: HeadlessState | "waiting", words: string): HTMLElement {
  return iconOf(mark, words);
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
 * A question an agent asks in its pane, as the card of what it says lists
 * it: the question, its choices as a numbered list in the agent's order,
 * each with what it leads to, and under a question that takes more than one
 * choice the words that say so. No choice is a button, since the person
 * answers in the pane.
 */
function askedPart(question: AskedQuestion): HTMLElement {
  const element = document.createElement("div");
  element.className = "asked";
  const note = choiceNote(question);
  // The question and its choices are the agent's words, plain text, never markup.
  element.append(part("asks", question.asks));
  if (question.options.length > 0) {
    const choices = document.createElement("ol");
    choices.className = "choices";
    choices.append(...question.options.map(({ label, implies }) => item("choice", part("label", label), part("implies", implies))));
    element.append(choices);
  }
  if (note) element.append(part("hint", note));
  return element;
}

/**
 * What the preview and a view's right column say of a work item alike: what
 * its agent says, the questions it asks with their choices in place of its
 * text, the decisions made for it in place of asking, its commits,
 * its changed files and its setup, each left out where the daemon sent none.
 * Under the decisions stands a line for each line of the work item's record
 * that the daemon did not read, and the section is drawn for those lines
 * alone where the record gave no decision. The first `gained` commits carry
 * the dot of a commit the branch gained since the person last looked. A
 * view gives both of `acts`, and a preview neither. Where `reverse` is
 * given, each decision that stands offers "Reverse", whose press hands
 * `reverse` the decision's id. Where `runSetup` is given, the setup offers
 * "Run setup again" while it does not run, whose press calls `runSetup`
 * with the command the section names, whole, the one the daemon may then
 * run.
 */
export function detail(entry: Entry, gained: number, { reverse, runSetup }: { reverse?: (decisionId: number) => void; runSetup?: (command: string | null) => void } = {}): HTMLElement[] {
  const parts: HTMLElement[] = [];
  const says = stateSays(entry.session, held.paneKinds);
  // The agent's words are plain text, never markup. Where the agent waits for the person the card says so by its class, and the theme gives that card its edge.
  if (says) parts.push(section(says.waiting ? "says waiting" : "says", heading(says.head), ...(says.questions.length > 0 ? says.questions.map(askedPart) : [part("said", says.text)])));
  const decisions = decisionLines(entry.workItem, Date.now());
  const unread = unreadLines(entry.workItem);
  if (decisions.length > 0 || unread.length > 0) {
    const lines = decisions.map((line) => {
      const head = row(part("kind", line.kind), part("by", line.by), part("age", line.age));
      if (reverse && line.reversed === null) {
        const button = document.createElement("button");
        button.className = "quiet";
        button.textContent = "Reverse";
        button.title = "Reverse this decision, with a message";
        button.addEventListener("click", () => reverse(line.id));
        head.append(button);
      }
      // What was decided, its grounds and a person's message are plain text, never markup.
      const element = item(line.reversed ? "decision reversed" : "decision", head, part("what", line.says), part("grounds", line.grounds));
      if (line.reversed) element.append(part("reversal", line.reversed.head), part("message", line.reversed.message));
      return element;
    });
    // The reader's reason is plain text, never markup.
    parts.push(section("decisions", heading(DECISIONS_HEAD), ...(lines.length > 0 ? [listOf(lines)] : []), ...unread.map((text) => part("unread", text))));
  }
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
  const setup = setupSection(entry.workItem, Date.now());
  if (setup) {
    const head = heading(SETUP_HEAD);
    if (runSetup && setup.runAgain) {
      const button = document.createElement("button");
      button.className = "quiet";
      button.textContent = "Run setup again";
      button.title = RUN_SETUP_SAYS;
      const command = entry.workItem.setup?.command ?? null;
      button.addEventListener("click", () => runSetup(command));
      head.append(button);
    }
    // The paths, the reasons and the daemon's sentence are plain text, never markup.
    const copied = setup.copied.map((path) => item("copied", part("path", path)));
    const failed = setup.failed.map(({ path, why }) => item("not-copied", part("path", path), part("why", why)));
    parts.push(section("setup", head, part("setup-says", setup.says), ...(setup.command ? [part("setup-command", `Command: ${setup.command}`)] : []), ...(copied.length > 0 ? [listOf(copied)] : []), ...(setup.more ? [part("hint foot", setup.more)] : []), ...(failed.length > 0 ? [listOf(failed)] : [])));
  }
  return parts;
}
