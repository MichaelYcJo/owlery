// What the window's parts share: the daemon's lists as the window holds them,
// the window's own state, the connection to the daemon, and the pieces every
// part draws with. Each part, a module of its own, draws what the functions
// of ./view return.
import type { InstalledApp } from "../shared/ipc";
import type { AgentState, AskedQuestion, ClientMessage, HeadlessInfo, HeavyRan, KeepAwake, Look, Machine, PaneKindInfo, Repository, Seal, SessionInfo, WorkItem } from "../shared/protocol";
import { STAGE_COLUMNS, type Back, type FindingLine, type RoundPart, type StageLine } from "../shared/seal-back";
import { type HeadlessMark, type HeldAccounts, APPROVAL_HEAD, approvalPlaces, changesOf, choiceNote, codeParts, commitLines, decisionLines, DECISIONS_HEAD, fileLines, lineMarks, matchWorkItems, placeWords, RUN_SETUP_SAYS, sealShown, SETUP_HEAD, setupSection, stateHeading, stateSays, stateWithAge, unreadLines, workItemEntries, type Change, type ChangedSet, type Entry, type StateFilter } from "./view";

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
  /** The accounts the daemon keeps and the default one, as `ready` and each `accounts` since said them, or null against a daemon of an earlier build, which sends none: the window then shows no account control and no account's name (./view, `heldAccounts`). */
  accounts: null as HeldAccounts | null,
  /** When the daemon keeps the Mac awake and whether it does now, as `ready` and each `keepAwake` since said it, or null against a daemon that sends none: one of an earlier build, or one that can hold nothing. */
  keepAwake: null as KeepAwake | null,
  /** What the daemon read of the machine and the caps it keeps there, as `ready` and each `machine` since said them, or null against a daemon that sends none: one of an earlier build, or one given no reader. The Machine button is then hidden (./view, `machineDialog`). */
  machine: null as Machine | null,
  /** What each heavy command of each repository took, as the daemon last answered the Machine dialog's `readHeavyRuns`, or none before it answered (./view, `heavyRanRows`). */
  heavyRan: [] as HeavyRan[],
  /** The work items the summary lists, worked out at `ready` from that look and the lists of the load, and held until the next load: the ids of the ones that changed since the look, and the ones `ready` carried without a seal reading, which join where their seal was then given or broke since the look (./view, `changedSet` and `changedSetAfter`). What each says is worked out again from the lists the window holds (`changes`). */
  changed: { ids: [], unread: [] } as ChangedSet,
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

/** The changes the summary draws now: each work item of the changed set, as the lists the window holds give it, against the look of the hello (./view, `changesOf`). None where no look is recorded. */
export function changes(): Change[] {
  return held.lastLook ? changesOf(held.lastLook, held.changed.ids, held.workItems, held.sessions, held.paneKinds) : [];
}

/** Whether a work item changed since the person last looked: the changed set names it, and its title is then drawn in the strong ink. Nothing is marked where no look is recorded. */
export function changedSince(workItemId: number): boolean {
  return held.lastLook !== null && held.changed.ids.includes(workItemId);
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

/** A text of the back of a seal, its code in the fixed-width face (./view, `codeParts`). Each part is plain text, never markup. */
export function withCode(className: string, text: string, tag = "span"): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  for (const { text: said, code } of codeParts(text)) {
    if (!code) {
      element.append(said);
      continue;
    }
    const shown = document.createElement("code");
    shown.textContent = said;
    element.append(shown);
  }
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

/**
 * The seal's place for a work item's seal (./view, `sealShown`): on a line
 * the small mark, and in the preview and at the foot of a view's right
 * column the seal's own drawing. `data-seal` says which form the page's
 * style draws: pressed blank into the ground before a seal, the seal lit
 * where it holds at the branch's head, and the seal parted in two where a
 * later commit broke it. The place says its words to a pointer and to a
 * screen reader.
 */
export function sealPlace(where: "line" | "preview" | "view", seal: Seal | null | undefined): HTMLElement {
  const place = document.createElement("span");
  place.className = where === "line" ? "seal" : where === "preview" ? "seal drawn" : "seal drawn large";
  place.setAttribute("role", "img");
  drawSeal(place, seal);
  return place;
}

/** Draws a seal's place again for another seal, as the preview and the view's foot do for each work item they show. */
export function drawSeal(place: HTMLElement, seal: Seal | null | undefined): void {
  const shown = sealShown(seal);
  place.dataset.seal = shown.state;
  place.setAttribute("aria-label", shown.words);
  place.title = shown.words;
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
type MarkedState = AgentState | HeadlessMark | "no-agent";

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

/** The icon of a headless session's line, `mark` being its state, or `no-agent` while it waits for the machine, named by `words`, the line's words for it. */
export function headlessIcon(mark: HeadlessMark, words: string): HTMLElement {
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
 * The approval line's section, or null for a work item that carries no
 * record of its chain: the four places in order, each its mark, which says
 * the place's whole words, the role's name and a note under the name. A
 * rule after each name joins it to the next place, where the theme draws
 * one, and the sealer's place holds the seal's place. Under the places
 * stands each place's line of text, plain text and never markup, in the
 * colour of a failure for a place that failed.
 */
function approvalSection(entry: Entry): HTMLElement | null {
  const places = approvalPlaces(entry.workItem);
  if (places === null) return null;
  const now = Date.now();
  const line = document.createElement("ol");
  line.className = "places";
  line.append(
    ...places.map((place) => {
      const head = row(iconOf(place.state, placeWords(place, now)), part("name", place.name), place.role === "sealer" ? sealPlace("line", entry.workItem.seal) : part("join", ""));
      const element = item(`place ${place.state}`, head, part("note", place.note));
      element.dataset.role = place.role;
      return element;
    }),
  );
  const under = places.flatMap((place) => (place.under === null ? [] : [part(place.state === "failed" ? "under failed" : "under", place.under)]));
  return section("approval", heading(APPROVAL_HEAD), line, ...under);
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
 * text, its approval line, the decisions made for it in place of asking,
 * its commits, its changed files and its setup, each left out where the
 * daemon sent none.
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
  const approval = approvalSection(entry);
  if (approval) parts.push(approval);
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

/** One stage's line of the back: its name, how it ended, its time, its tokens, its cache and its cost, each in a cell under `STAGE_COLUMNS`. */
function stageLine(line: StageLine): HTMLElement {
  const cost = part("cost", "");
  if (line.cost === "none") cost.append("No cost reported");
  else if (line.cost !== null) cost.append(line.cost.amount, ...(line.cost.converted ? [" ", part("converted", "converted")] : []));
  return item(
    "stage",
    part("name", line.name),
    part(line.failed ? "ended failed" : "ended", line.ended ?? ""),
    part("time", line.time),
    part("tokens", line.tokens === null ? "" : `${line.tokens.input} / ${line.tokens.output}`),
    part("cache", line.tokens === null ? "" : `${line.tokens.cacheRead} / ${line.tokens.cacheWritten}`),
    cost,
  );
}

/** A list of stages' lines under the words of their columns, or nothing where there is no stage. Every list of the back sets its cells in the same columns. */
function stageLines(lines: readonly StageLine[]): HTMLElement[] {
  if (lines.length === 0) return [];
  const list = listOf([item("columns", ...STAGE_COLUMNS.map((words) => part("caption", words))), ...lines.map(stageLine)]);
  list.className = "stages";
  return [list];
}

/** One finding's line of a round: its number, its symptom and its close on the first row, its severity and its places under them, and the earlier finding or round it names. An open finding's close is drawn as one. */
function findingLine(line: FindingLine): HTMLElement {
  const places = part("places", "");
  for (const place of line.places) {
    const shown = document.createElement("code");
    shown.textContent = place;
    places.append(shown, " ");
  }
  return item("finding", part("number", `${String(line.number)}.`), withCode("says", line.says), withCode(line.open ? "close open" : "close", line.close), row(part("severity", line.severity), places), ...(line.names === null ? [] : [part("names", line.names)]));
}

/** One round's part of the back: its title with the commit it read, its findings or the sentence of a round with none, the lines of its record not read, and the stages that ran for it. */
function roundPart(round: RoundPart): HTMLElement {
  const element = document.createElement("section");
  element.className = "round";
  element.append(withCode("caption", round.title, "h3"));
  if (round.findings.length > 0) {
    const list = document.createElement("ol");
    list.className = "findings";
    list.append(...round.findings.map(findingLine));
    element.append(list);
  }
  if (round.says !== null) element.append(withCode("round-says", round.says, "p"));
  if (round.unread !== null) element.append(withCode("unread", round.unread, "p"));
  element.append(...stageLines(round.stages));
  return element;
}

/**
 * The back of a seal as the window draws it in the back's place
 * (../shared/seal-back, `Back`), from its top: the large seal, drawn from
 * the work item's `seal` as the lists carry it, with the words of its state,
 * a broken seal's sentence and the commit that broke it; the seal's record;
 * the head's sentences; each round's part; the stages after the rounds; the
 * sums; the line of the sessions outside the chain; the sentence on a
 * converted cost; the refused calls; and the lines not read. Where `back` is
 * a sentence, as before the answers come and where one was refused, the
 * place holds that sentence alone. Every text is plain, never markup.
 */
export function backParts(back: Back | string, seal: Seal | null | undefined): HTMLElement[] {
  if (typeof back === "string") return [part("back-waits", back)];
  const shown = sealShown(seal);
  const words = part("words", "");
  words.append(withCode("head", shown.words, "h2"), ...(shown.why === "" ? [] : [withCode("why", shown.why, "p")]));
  if (back.brokenBy !== null) {
    const broken = withCode("broken-by", back.brokenBy.says, "p");
    broken.append(" ", withCode("subject", back.brokenBy.subject));
    words.append(broken);
  }
  const head = document.createElement("header");
  head.className = "back-head";
  head.append(sealPlace("view", seal), words);
  const parts: HTMLElement[] = [head];
  if (back.record.length > 0) {
    const record = document.createElement("dl");
    record.className = "back-record";
    for (const { label, value } of back.record) record.append(withCode("", label, "dt"), withCode("", value, "dd"));
    parts.push(record);
  }
  const says = document.createElement("div");
  says.className = "back-says";
  says.append(...back.head.map((sentence) => withCode("", sentence, "p")));
  parts.push(says);
  if (back.rounds.length > 0 || back.after.length > 0) {
    const chain = document.createElement("div");
    chain.className = "back-chain";
    chain.append(...back.rounds.map(roundPart));
    if (back.after.length > 0) {
      const after = document.createElement("section");
      after.className = "after";
      after.append(...stageLines(back.after));
      chain.append(after);
    }
    parts.push(chain);
  }
  const foot = [...back.sums.map((sentence) => withCode("sum", sentence, "p")), ...(back.outside === null ? [] : [withCode("outside", back.outside, "p")]), ...(back.converted === null ? [] : [withCode("converted-says", back.converted, "p")]), ...back.refused.map((line) => withCode("refused", line, "p")), ...back.unread.map((line) => withCode("unread", line, "p"))];
  if (foot.length > 0) {
    const element = document.createElement("div");
    element.className = "back-foot";
    element.append(...foot);
    parts.push(element);
  }
  return parts;
}
