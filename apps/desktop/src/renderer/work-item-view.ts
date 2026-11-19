// A work item's view: its header, its tabs with the terminal of the one in
// front and the strip under it, and its right column, which says what the
// daemon sends of the work item above the "Ask" section and the seal's
// place. The pool of terminal screens the window holds lives here.
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import type { HeadlessInfo, PaneKind, SessionInfo, WorkItem } from "../shared/protocol";
import { byId, detail, entries, headlessIcon, held, part, request, row, sealPlace, send, showState, stateClass } from "./shared";
import { askButton, headlessLines, paneInFront, paneTabs, replayStep, repoNameOf, screenMoves, stateWithAge, tabLabel, viewFacts, withHeadless } from "./view";

/** A terminal screen: one terminal with its element under the stage. It holds a pane while that pane is on the stage, and is free otherwise. */
interface Screen {
  term: Terminal;
  fit: FitAddon;
  element: HTMLElement;
  /** The pane on the screen, or nothing while the screen is free. */
  pane: number | undefined;
  /** The replays the terminal is drawing whose answers are not sent. */
  muted: number;
}

// The size a pane's process starts at where no terminal is on screen to measure: xterm's own default.
const DEFAULT_SIZE = { cols: 80, rows: 24 };

// The terminal screens this window holds. One is made only where a pane comes onto the stage and none is free, and a free one stays, hidden, for the window's life. A pane that is not on the stage holds none: the daemon keeps its output (docs/architecture.md, Memory design).
const pool: Screen[] = [];
// The replays this window asked for and has not received, by pane. A pane that left the stage may still have one on its way.
const awaited = new Map<number, number>();
// The panes whose output this window has drawn from a replay once since it loaded.
const replayed = new Set<number>();
// The pane in front of the view on screen. No pane is in front on another screen.
let front: number | undefined;
// The pane last in front in each work item's view since the window loaded.
const lastInFront = new Map<number, number>();
// The work item whose view the "Ask" field's prompt was typed in.
let askingIn: number | undefined;
// The request the "Ask" field is waiting on: the field keeps its prompt until the daemon has taken it.
let askRequest: number | undefined;
// What the view does where its work item is no longer listed: another screen takes its place.
let leave: () => void = () => {};

const viewTitle = byId("view-title");
const viewBranch = byId("view-branch");
const viewRepo = byId("view-repo");
const viewFactsTitle = byId("view-facts-title");
const viewState = byId("view-state");
const viewFactList = byId("view-fact-list");
const viewDetail = byId("view-detail");
const stripSize = byId("strip-size");
const stripWorktree = byId("strip-worktree");
const stripState = byId("strip-state");
const tabs = byId("tabs");
const paneButtons = byId("pane-buttons");
const noPanes = byId("no-panes");
const stage = byId("stage");
const askForm = byId<HTMLFormElement>("ask-form");
const askField = byId<HTMLInputElement>("ask-prompt");
const askSubmit = byId<HTMLButtonElement>("ask-submit");
const headlessList = byId<HTMLUListElement>("headless");

/** The work item whose view is on screen, where the window holds it. */
function viewed(): WorkItem | undefined {
  return held.workItems.find((item) => item.id === held.viewing);
}

/** A value of the page's look: a custom property of the theme in use or of the layout, which the terminal takes its colours, its typeface and its size from. */
function look(property: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
}

/** The colours a terminal draws its own text and ground in, as the theme in use has them. */
function terminalColours(): { background: string; foreground: string; cursor: string } {
  return { background: look("--terminal-ground"), foreground: look("--terminal-ink"), cursor: look("--terminal-ink") };
}

/** Gives every screen of the pool the colours of the theme now in use, after the theme changed. */
export function showTerminalColours(): void {
  for (const screen of pool) screen.term.options.theme = terminalColours();
}

/** The screen a pane is on, or nothing for a pane that is not on the stage. */
function screenOf(pane: number | undefined): Screen | undefined {
  return pane === undefined ? undefined : pool.find((screen) => screen.pane === pane);
}

/**
 * Adds a screen to the pool, for a pane that comes onto the stage where no
 * screen is free. The view is on screen then, so the terminal opens in an
 * element that is displayed. What a person types into the screen, and each
 * size it takes, goes to the pane that holds it at that moment, and a free
 * screen sends nothing.
 */
function newScreen(): Screen {
  const element = document.createElement("div");
  element.className = "pane";
  stage.appendChild(element);
  const term = new Terminal({
    // The UI keeps 1,000 lines; older output stays with the daemon (docs/architecture.md, Memory design).
    scrollback: 1000,
    fontFamily: look("--font-terminal"),
    fontSize: Number.parseFloat(look("--size-terminal")),
    theme: terminalColours(),
    cursorBlink: true,
    macOptionIsMeta: true,
    allowProposedApi: true,
  });
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.open(element);
  try {
    const webgl = new WebglAddon();
    // On a lost GPU context the screen falls back to the DOM renderer.
    webgl.onContextLoss(() => webgl.dispose());
    term.loadAddon(webgl);
  } catch {
    // No WebGL: the DOM renderer stays.
  }
  const screen: Screen = { term, fit, element, pane: undefined, muted: 0 };
  // What a person types and what the terminal answers a program's question with arrive here alike.
  term.onData((data) => {
    if (screen.pane !== undefined && screen.muted === 0) send({ type: "input", id: screen.pane, data });
  });
  term.onResize(({ cols, rows }) => {
    if (screen.pane === undefined) return;
    send({ type: "resize", id: screen.pane, cols, rows });
    showSize();
  });
  pool.push(screen);
  return screen;
}

/**
 * Puts a pane on a free screen, as it comes onto the stage: the screen is
 * shown and fitted to the stage, the process is told the size, and the
 * window asks for the pane's output so far, which is written into the
 * emptied terminal when it arrives.
 */
function take(screen: Screen, pane: number): void {
  screen.element.hidden = false;
  // Fitted while the screen is still free, so the size is sent once, below, whether or not the fit changed it.
  screen.fit.fit();
  screen.pane = pane;
  send({ type: "resize", id: pane, cols: screen.term.cols, rows: screen.term.rows });
  // The replay holds everything the pane printed, a pane this window started a moment ago included.
  awaited.set(pane, (awaited.get(pane) ?? 0) + 1);
  send({ type: "attach", id: pane });
}

/** Takes a screen back from the pane on it, as the pane leaves the stage: the daemon is told to send this window no more of the pane's output, and the screen is emptied and hidden. */
function giveBack(screen: Screen): void {
  if (screen.pane === undefined) return;
  send({ type: "detach", id: screen.pane });
  screen.pane = undefined;
  // The terminal draws what it is handed later, in order. The reset is handed to it the same way, so what it has still to draw of this pane is drawn before the reset and not into the next pane's screen.
  screen.term.write("\u001bc");
  screen.element.hidden = true;
}

/** Has the stage show `shown` and no other pane: a pane that left gives its screen back, and a pane that came takes a free screen, or a new one where none is free. */
function stageShows(shown: readonly number[]): void {
  const moves = screenMoves(
    pool.map((screen) => screen.pane),
    shown,
  );
  for (const { screen } of moves.back) giveBack(pool[screen] as Screen);
  for (const { screen, pane } of moves.taken) take(pool[screen] ?? newScreen(), pane);
}

/** The pane in front of the view on screen, or nothing on another screen. */
export function paneOnScreen(): number | undefined {
  return front;
}

/** Takes back the screen of each pane the daemon no longer lists, and awaits no replay of it. */
export function dropClosed(listed: ReadonlySet<number>): void {
  for (const screen of pool) {
    if (screen.pane === undefined || listed.has(screen.pane)) continue;
    if (front === screen.pane) front = undefined;
    giveBack(screen);
  }
  for (const pane of [...awaited.keys()]) if (!listed.has(pane)) awaited.delete(pane);
  for (const pane of [...replayed]) if (!listed.has(pane)) replayed.delete(pane);
}

/** The size a new pane's process starts at: that of the screen of the pane in front, or the default where no pane is on the stage. The pane's own screen sends its size once the pane takes it. */
export function startSize(): { cols: number; rows: number } {
  const screen = screenOf(front);
  return screen ? { cols: screen.term.cols, rows: screen.term.rows } : DEFAULT_SIZE;
}

/** Says in the strip the columns and rows of the screen of the pane in front, or nothing where the view shows none. */
function showSize(): void {
  const screen = screenOf(front);
  stripSize.textContent = screen ? `${screen.term.cols} \u00d7 ${screen.term.rows}` : "";
}

/** Starts a pane of `kind` in the work item whose view is on screen. */
function start(kind: PaneKind): void {
  if (held.viewing === undefined) return;
  send({ type: "start", kind, ...startSize(), requestId: request(), workItemId: held.viewing });
}

/** Builds, once per connection, the view's button for each kind of pane the daemon offers. */
export function showPaneButtons(): void {
  paneButtons.replaceChildren(
    ...held.paneKinds.map(({ kind, label }) => {
      const button = document.createElement("button");
      button.textContent = `+ ${label}`;
      button.addEventListener("click", () => start(kind));
      return button;
    }),
  );
}

/** Sets the "Ask" button for the view's work item and the field as they are now. */
function showAsk(workItem: WorkItem): void {
  const button = askButton(askField.value, workItem);
  askSubmit.disabled = !button.enabled;
  askSubmit.title = button.title;
}

/** Draws the "Ask" section of the view on screen: the button as the field stands, and the work item's headless sessions. */
function showAskSection(): void {
  const workItem = viewed();
  if (!workItem) return;
  showAsk(workItem);
  headlessList.replaceChildren(
    ...headlessLines(held.headless, workItem.id).map((line) => {
      const item = document.createElement("li");
      // The answer is plain text, never markup, and its line breaks are kept by the style.
      item.append(row(headlessIcon(line.state), part("prompt", line.prompt), part(`state ${line.state}`, line.state)), part("answer", line.text));
      return item;
    }),
  );
}

function tabElement(session: SessionInfo, active: boolean): HTMLElement {
  const tab = document.createElement("span");
  tab.className = active ? "tab active" : "tab";
  const label = document.createElement("button");
  label.className = "label";
  label.textContent = tabLabel(session, held.paneKinds);
  const close = document.createElement("button");
  close.className = "close";
  close.textContent = "×";
  close.title = `Close ${label.textContent}`;
  label.addEventListener("click", () => {
    if (held.viewing === undefined) return;
    lastInFront.set(held.viewing, session.id);
    showView();
  });
  // The daemon ends the process and takes the session off its lists; the tab goes at the `inbox` that follows.
  close.addEventListener("click", () => send({ type: "close", id: session.id }));
  tab.append(label, close);
  return tab;
}

/**
 * Draws the view of the work item on screen: its header, its tabs, the
 * pane of the tab in front on a screen of the pool with the strip under it,
 * its right column and its "Ask" section. It starts no process.
 */
export function showView(): void {
  const entry = entries().find((listed) => listed.workItem.id === held.viewing);
  if (!entry) {
    leave();
    return;
  }
  const { workItem, line } = entry;
  const now = Date.now();
  const state = stateWithAge(line.state, entry.session?.stateSince, now);
  viewTitle.textContent = line.title;
  viewBranch.textContent = line.branch;
  viewRepo.textContent = repoNameOf(workItem);
  viewFactsTitle.textContent = line.title;
  showState(viewState, line.state, entry.session?.stateSince);
  viewFactList.replaceChildren(
    ...viewFacts(entry, held.paneKinds, now).flatMap(({ label, value }) => {
      const term = document.createElement("dt");
      term.textContent = label;
      const said = document.createElement("dd");
      said.textContent = value;
      return [term, said];
    }),
  );
  viewDetail.replaceChildren(...detail(entry, 0));
  stripWorktree.textContent = workItem.worktree;
  stripState.textContent = state;
  stripState.className = `state ${stateClass(line.state)}`;
  const shown = paneTabs(workItem, held.sessions);
  const target = paneInFront(shown, lastInFront.get(workItem.id));
  tabs.replaceChildren(...shown.map((session) => tabElement(session, session.id === target)));
  noPanes.hidden = shown.length > 0;
  // One pane is on the stage: the one in front.
  stageShows(target === undefined ? [] : [target]);
  if (target !== front) {
    front = target;
    if (target !== undefined) {
      lastInFront.set(workItem.id, target);
      screenOf(target)?.term.focus();
    }
  }
  showSize();
  showAskSection();
}

/** Makes a work item the one whose view is drawn, before the view is put in front. */
export function enterView(workItemId: number): void {
  // A prompt typed for one work item is not asked in another.
  if (askingIn !== workItemId) askField.value = "";
  askingIn = workItemId;
  held.viewing = workItemId;
  front = undefined;
}

/** Leaves the view for another screen, and gives the work item that was on screen. Every pane leaves the stage, and its screen goes back to the pool. */
export function leaveView(): number | undefined {
  const left = held.viewing;
  held.viewing = undefined;
  front = undefined;
  stageShows([]);
  return left;
}

/** Takes a pane this window started: it is in front the next time its work item's view is drawn, which is now where that view is on screen. */
export function takeStarted(session: SessionInfo): void {
  // The `inbox` that lists the pane comes after the answer that carries it.
  if (!held.sessions.some((known) => known.id === session.id)) held.sessions = [...held.sessions, session];
  if (session.workItemId === null) return;
  lastInFront.set(session.workItemId, session.id);
  if (held.viewing === session.workItemId) showView();
}

/** Asks the daemon for no more output of a pane this window started, where the pane did not come onto the stage: the daemon sends a pane's output to the window that started it. */
export function detachUnshown(id: number): void {
  if (!screenOf(id)) send({ type: "detach", id });
}

/** Asks the field's prompt in the work item whose view is on screen. */
function ask(): void {
  const workItem = viewed();
  // One ask per answer: a second press before the daemon has taken the first would ask the same prompt twice.
  if (askRequest !== undefined || !workItem || !askButton(askField.value, workItem).enabled) return;
  askRequest = request();
  send({ type: "ask", requestId: askRequest, workItemId: workItem.id, prompt: askField.value });
}

/** Takes a headless session the daemon sent, `requestId` being the request it answers where it answers one. */
export function takeHeadless(headless: HeadlessInfo, requestId?: number): void {
  // The daemon took the prompt, so the field is free for the next one, unless it now holds a prompt for another work item.
  if (requestId !== undefined && requestId === askRequest) {
    askRequest = undefined;
    if (askingIn === headless.workItemId) askField.value = "";
  }
  held.headless = withHeadless(held.headless, headless);
  showAskSection();
}

/** Takes the daemon's refusal of a request: where it was the "Ask" field's, the field may ask again. */
export function requestRefused(requestId: number): void {
  if (requestId === askRequest) askRequest = undefined;
}

/**
 * Writes what a pane printed into the screen the pane is on: the last replay
 * this window asked for, and the output after it. A pane that is not on the
 * stage has no screen, and what arrives of it is dropped.
 *
 * A replay holds the questions the pane's program asked its terminal, such
 * as where the cursor is, and the terminal that draws it answers each again.
 * The answers to the first replay the window draws of a pane are sent, since
 * that replay may hold a question no terminal answered yet. The answers to a
 * later one are not: the program has them, and each would arrive as if typed.
 */
export function write(id: number, kind: "replay" | "output", data: string): void {
  const step = replayStep(awaited.get(id) ?? 0, kind);
  if (step.awaited > 0) awaited.set(id, step.awaited);
  else awaited.delete(id);
  const screen = screenOf(id);
  if (!step.write || !screen) return;
  if (kind === "output" || !replayed.has(id)) {
    if (kind === "replay") replayed.add(id);
    screen.term.write(data);
    return;
  }
  // Muted until the terminal has drawn this replay. What a person types in that moment is not sent either.
  screen.muted += 1;
  screen.term.write(data, () => {
    screen.muted -= 1;
  });
}

export function initView(onLeave: () => void): void {
  leave = onLeave;
  byId("view-seal-place").replaceWith(sealPlace("view"));
  askField.addEventListener("input", () => {
    const workItem = viewed();
    if (workItem) showAsk(workItem);
  });
  askForm.addEventListener("submit", (event) => {
    event.preventDefault();
    ask();
  });
  new ResizeObserver(() => {
    // Every screen on the stage is fitted, and each fit that changes a size tells its pane's process.
    for (const screen of pool) if (screen.pane !== undefined) screen.fit.fit();
  }).observe(stage);
}
