// A work item's view: its header, its tabs with the terminal of the one in
// front and the strip under it, and its right column, which says what the
// daemon sends of the work item above the "Ask" section and the seal's
// place. The terminals the window holds live here.
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import type { HeadlessInfo, PaneKind, SessionInfo, WorkItem } from "../shared/protocol";
import { byId, detail, entries, headlessIcon, held, part, request, row, sealPlace, send, showState, stateClass } from "./shared";
import { askButton, headlessLines, paneInFront, paneTabs, repoNameOf, stateWithAge, tabLabel, viewFacts, withHeadless } from "./view";

interface Pane {
  id: number;
  term: Terminal;
  fit: FitAddon;
  element: HTMLElement;
  /** True from the `attach` this window sent until its `replay` arrives, which holds everything printed before it. */
  awaitingReplay: boolean;
}

// The size a pane's process starts at where no terminal is on screen to measure: xterm's own default.
const DEFAULT_SIZE = { cols: 80, rows: 24 };

// The terminals this window holds. One is made the first time its pane is in front, and stays, hidden, until the pane closes.
const panes = new Map<number, Pane>();
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

/** Gives every terminal the window holds the colours of the theme now in use, after the theme changed. */
export function showTerminalColours(): void {
  for (const pane of panes.values()) pane.term.options.theme = terminalColours();
}

/**
 * Makes the terminal of a pane the first time the pane is in front, and takes
 * the output the pane printed so far. The view is on screen then, so the
 * terminal is fitted to the stage as shown, and the process is told that size.
 */
function terminalFor(id: number): Pane {
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
    // On a lost GPU context the pane falls back to the DOM renderer.
    webgl.onContextLoss(() => webgl.dispose());
    term.loadAddon(webgl);
  } catch {
    // No WebGL: the DOM renderer stays.
  }
  fit.fit();
  const pane: Pane = { id, term, fit, element, awaitingReplay: true };
  panes.set(id, pane);
  term.onData((data) => send({ type: "input", id, data }));
  term.onResize(({ cols, rows }) => {
    send({ type: "resize", id, cols, rows });
    showSize();
  });
  send({ type: "resize", id, cols: term.cols, rows: term.rows });
  // The replay holds everything the pane printed, a pane this window started a moment ago included.
  send({ type: "attach", id });
  return pane;
}

/** The pane in front of the view on screen, or nothing on another screen. */
export function paneOnScreen(): number | undefined {
  return front;
}

/** Drops the terminal of each session the daemon no longer lists. */
export function dropClosed(listed: ReadonlySet<number>): void {
  for (const pane of [...panes.values()]) {
    if (listed.has(pane.id)) continue;
    panes.delete(pane.id);
    pane.term.dispose();
    pane.element.remove();
    if (front === pane.id) front = undefined;
  }
}

/** The size a new pane's process starts at: the terminal on screen's, or the default where none is. The pane's own terminal sends its size once it is made. */
export function startSize(): { cols: number; rows: number } {
  const pane = front === undefined ? undefined : panes.get(front);
  return pane ? { cols: pane.term.cols, rows: pane.term.rows } : DEFAULT_SIZE;
}

/** Says in the strip the columns and rows of the terminal in front, or nothing where the view shows none. */
function showSize(): void {
  const pane = front === undefined ? undefined : panes.get(front);
  stripSize.textContent = pane ? `${pane.term.cols} \u00d7 ${pane.term.rows}` : "";
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
 * terminal of the tab in front with the strip under it, its right column and
 * its "Ask" section. It starts no process.
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
  const shown = paneTabs(workItem, held.sessions, new Set(panes.keys()));
  const target = paneInFront(shown, lastInFront.get(workItem.id));
  tabs.replaceChildren(...shown.map((session) => tabElement(session, session.id === target)));
  noPanes.hidden = shown.length > 0;
  for (const pane of panes.values()) pane.element.hidden = pane.id !== target;
  if (target !== front) {
    front = target;
    if (target !== undefined) {
      lastInFront.set(workItem.id, target);
      const pane = panes.get(target) ?? terminalFor(target);
      // A terminal made for an earlier size of the window is fitted again, and the fit tells the process.
      pane.fit.fit();
      pane.term.focus();
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

/** Leaves the view for another screen, and gives the work item that was on screen. The view's terminals stay, hidden with it. */
export function leaveView(): number | undefined {
  const left = held.viewing;
  held.viewing = undefined;
  front = undefined;
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

/** Writes what a pane printed into its terminal, where the window holds one. */
export function write(id: number, kind: "replay" | "output", data: string): void {
  const pane = panes.get(id);
  if (!pane) return;
  if (kind === "replay") pane.awaitingReplay = false;
  // Output that arrives before the replay is in the replay.
  else if (kind === "output" && pane.awaitingReplay) return;
  pane.term.write(data);
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
    if (front !== undefined) panes.get(front)?.fit.fit();
  }).observe(stage);
}
