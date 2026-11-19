import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import type { OwleryApi } from "../shared/ipc";
import type { AgentState, ClientMessage, HeadlessInfo, Look, PaneKind, PaneKindInfo, ServerMessage, SessionInfo, WorkItem } from "../shared/protocol";
import {
  agentKind,
  askButton,
  changesSince,
  headlessLines,
  inboxGroups,
  inboxKey,
  inboxLine,
  inboxSummary,
  lastHere,
  moveSelection,
  notificationFor,
  paneInFront,
  paneTabs,
  selectedLine,
  stateHeading,
  summarySentence,
  tabLabel,
  withHeadless,
  workItemFields,
  type Change,
  type InboxLine,
} from "./view";

declare global {
  interface Window {
    owlery: OwleryApi;
  }
}

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
const NO_SEAL = "No seal yet";

// The terminals this window holds. One is made the first time its pane is in front, and stays, hidden, until the pane closes.
const panes = new Map<number, Pane>();
// The kinds of pane the daemon offers, as `ready` listed them: the buttons, the form's choice and the tab labels come from here.
let paneKinds: PaneKindInfo[] = [];
// The sessions and the work items as the daemon last listed them, at `ready` and at each `inbox`, and what this window started or created since.
let sessions: SessionInfo[] = [];
let workItems: WorkItem[] = [];
// The headless sessions as the daemon listed them at `ready`, each replaced whole at every `headless` since.
let headless: HeadlessInfo[] = [];
// The look the daemon held when this window said hello, or null where no person looked before. The window keeps none of its own.
let lastLook: Look | null = null;
// The work items that changed since that look, worked out once, at `ready`, and held until the next load.
let changed: ReadonlySet<number> = new Set();
// The work item whose view is on screen, or nothing while another screen is. It is kept nowhere else, so a reload opens on the summary or on the inbox.
let viewing: number | undefined;
// The work items in the order the inbox displays their lines, and the one whose line is selected: the preview shows it, and J, K and Enter act on it.
let displayed: number[] = [];
let selected: number | undefined;
// The pane in front of the view on screen. No pane is in front on the summary screen or on the inbox screen.
let front: number | undefined;
// The pane last in front in each work item's view since the window loaded.
const lastInFront = new Map<number, number>();
// The work item whose view the "Ask" field's prompt was typed in.
let askingIn: number | undefined;
let nextRequest = 1;
// The request the "New work item" form is waiting on.
let formRequest: number | undefined;
// The request the "Ask" field is waiting on: the field keeps its prompt until the daemon has taken it.
let askRequest: number | undefined;
let socket: WebSocket | undefined;

const bar = document.getElementById("bar") as HTMLElement;
const summaryScreen = document.getElementById("summary-screen") as HTMLElement;
const summaryHeading = document.getElementById("summary-sentence") as HTMLElement;
const summaryLastHere = document.getElementById("summary-last-here") as HTMLElement;
const summaryLines = document.getElementById("summary-lines") as HTMLUListElement;
const openInbox = document.getElementById("open-inbox") as HTMLButtonElement;
const inboxScreen = document.getElementById("inbox-screen") as HTMLElement;
const inboxHead = document.getElementById("inbox-head") as HTMLElement;
const summary = document.getElementById("inbox-summary") as HTMLElement;
const inboxLastHere = document.getElementById("inbox-last-here") as HTMLElement;
const inboxLegend = document.getElementById("inbox-legend") as HTMLElement;
const inbox = document.getElementById("inbox") as HTMLElement;
const inboxEmpty = document.getElementById("inbox-empty") as HTMLElement;
const previewContent = document.getElementById("preview-content") as HTMLElement;
const previewState = document.getElementById("preview-state") as HTMLElement;
const previewTitle = document.getElementById("preview-title") as HTMLElement;
const previewBranch = document.getElementById("preview-branch") as HTMLElement;
const previewCommits = document.getElementById("preview-commits") as HTMLElement;
const view = document.getElementById("work-item-view") as HTMLElement;
const viewSummary = document.getElementById("view-summary") as HTMLElement;
const viewWorkItems = document.getElementById("view-work-items") as HTMLUListElement;
const viewTitle = document.getElementById("view-title") as HTMLElement;
const viewBranch = document.getElementById("view-branch") as HTMLElement;
const viewState = document.getElementById("view-state") as HTMLElement;
const viewCommits = document.getElementById("view-commits") as HTMLElement;
const tabs = document.getElementById("tabs") as HTMLElement;
const paneButtons = document.getElementById("pane-buttons") as HTMLElement;
const noPanes = document.getElementById("no-panes") as HTMLElement;
const stage = document.getElementById("stage") as HTMLElement;
const status = document.getElementById("status") as HTMLElement;
const workItemDialog = document.getElementById("work-item-dialog") as HTMLDialogElement;
const workItemForm = document.getElementById("work-item-form") as HTMLFormElement;
const repoField = document.getElementById("work-item-repo") as HTMLInputElement;
const titleField = document.getElementById("work-item-title") as HTMLInputElement;
const kindField = document.getElementById("work-item-kind") as HTMLSelectElement;
const formError = document.getElementById("work-item-error") as HTMLElement;
const createButton = document.getElementById("work-item-create") as HTMLButtonElement;
const askForm = document.getElementById("ask-form") as HTMLFormElement;
const askField = document.getElementById("ask-prompt") as HTMLInputElement;
const askSubmit = document.getElementById("ask-submit") as HTMLButtonElement;
const headlessList = document.getElementById("headless") as HTMLUListElement;

/** The work item whose view is on screen, where the window holds it. */
function viewed(): WorkItem | undefined {
  return workItems.find((item) => item.id === viewing);
}

/** A value of the page's look: a custom property of `:root`, which the terminal takes its colours and its typeface from. */
function look(property: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
}

function send(message: ClientMessage): void {
  socket?.send(JSON.stringify(message));
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
    theme: { background: look("--terminal-bg"), foreground: look("--terminal-text"), cursor: look("--terminal-text") },
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
  term.onResize(({ cols, rows }) => send({ type: "resize", id, cols, rows }));
  send({ type: "resize", id, cols: term.cols, rows: term.rows });
  // The replay holds everything the pane printed, a pane this window started a moment ago included.
  send({ type: "attach", id });
  return pane;
}

/** Drops the terminal of a session the daemon no longer lists. */
function remove(pane: Pane): void {
  panes.delete(pane.id);
  pane.term.dispose();
  pane.element.remove();
  if (front === pane.id) front = undefined;
}

/** The size a new pane's process starts at: the terminal on screen's, or the default where none is. The pane's own terminal sends its size once it is made. */
function startSize(): { cols: number; rows: number } {
  const pane = front === undefined ? undefined : panes.get(front);
  return pane ? { cols: pane.term.cols, rows: pane.term.rows } : DEFAULT_SIZE;
}

/** Starts a pane of `kind` in the work item whose view is on screen. */
function start(kind: PaneKind): void {
  if (viewing === undefined) return;
  send({ type: "start", kind, ...startSize(), requestId: nextRequest++, workItemId: viewing });
}

/** Builds, once per connection, the view's button for each kind of pane the daemon offers and the form's choice among them. */
function showPaneKinds(): void {
  paneButtons.replaceChildren(
    ...paneKinds.map(({ kind, label }) => {
      const button = document.createElement("button");
      button.textContent = `+ ${label}`;
      button.addEventListener("click", () => start(kind));
      return button;
    }),
  );
  const preferred = agentKind(paneKinds);
  kindField.replaceChildren(...paneKinds.map(({ kind, label }) => new Option(label, kind, kind === preferred, kind === preferred)));
}

function part(className: string, text: string): HTMLElement {
  const element = document.createElement("span");
  element.className = className;
  element.textContent = text;
  return element;
}

function row(...parts: HTMLElement[]): HTMLElement {
  const element = document.createElement("span");
  element.className = "row";
  element.append(...parts);
  return element;
}

/** The seal's place. No work item can be sealed yet, so it is a ring the page's style draws, with no image, and says so. */
function sealPlace(large = false): HTMLElement {
  const ring = document.createElement("span");
  ring.className = large ? "seal unsealed large" : "seal unsealed";
  ring.setAttribute("role", "img");
  ring.setAttribute("aria-label", NO_SEAL);
  ring.title = NO_SEAL;
  return ring;
}

/**
 * A state's dot, which says the state in its colour and, to a pointer and a
 * screen reader, in the words of its heading. On a line of the inbox, where a
 * look is recorded, `changedSince` says whether the work item changed since:
 * the dot is filled where it did and a ring where it did not, and its words
 * say which.
 */
function dot(state: AgentState | null, changedSince?: boolean): HTMLElement {
  const element = part(`dot state ${stateClass(state)}${changedSince === false ? " unchanged" : ""}`, "");
  const words = changedSince === undefined ? stateHeading(state) : `${stateHeading(state)}, ${changedSince ? "changed" : "not changed"} since you were last here`;
  element.setAttribute("role", "img");
  element.setAttribute("aria-label", words);
  element.title = words;
  return element;
}

/** The class that gives a state its colour. */
function stateClass(state: AgentState | null): string {
  return state ?? "no-agent";
}

function lineButton(workItemId: number): HTMLElement | null {
  return inbox.querySelector<HTMLElement>(`button[data-work-item="${workItemId}"]`);
}

/** Selects a work item's line and shows the work item in the preview. The lines are not drawn again, so the keyboard keeps its place. */
function select(workItemId: number | undefined): void {
  selected = workItemId;
  for (const button of inbox.querySelectorAll<HTMLElement>("button[data-work-item]")) {
    const isSelected = button.dataset.workItem === String(workItemId);
    button.classList.toggle("selected", isSelected);
    if (isSelected) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  }
  showPreview();
}

/** Draws the preview: the selected work item, or nothing where the inbox has no work item. */
function showPreview(): void {
  const workItem = workItems.find((item) => item.id === selected);
  previewContent.hidden = !workItem;
  if (!workItem) return;
  const line = inboxLine(workItem, sessions, paneKinds);
  previewState.textContent = stateHeading(line.state);
  previewState.className = `caption state ${stateClass(line.state)}`;
  previewTitle.textContent = line.title;
  previewBranch.textContent = line.branch;
  previewCommits.textContent = line.commits;
}

function lineElement(workItem: WorkItem, line: InboxLine): HTMLElement {
  const button = document.createElement("button");
  button.className = "line";
  button.title = workItem.worktree;
  button.dataset.workItem = String(workItem.id);
  const text = part("text", "");
  const meta = part("meta", "");
  meta.append(part("branch", line.branch), part("commits", line.commits));
  text.append(part("title", line.title), meta);
  button.append(dot(line.state, lastLook ? changed.has(workItem.id) : undefined), text, sealPlace());
  button.addEventListener("click", () => openView(workItem.id));
  // The keyboard's place on a line is the selection, so the preview shows the line a person tabbed to.
  button.addEventListener("focus", () => {
    if (selected !== workItem.id) select(workItem.id);
  });
  const item = document.createElement("li");
  item.append(button);
  return item;
}

/** One work item of the list at the left of a view: its state's dot and its title, marked where its view is the one on screen. */
function navElement(workItem: WorkItem, line: InboxLine): HTMLElement {
  const button = document.createElement("button");
  button.dataset.workItem = String(workItem.id);
  if (workItem.id === viewing) {
    button.className = "open";
    button.setAttribute("aria-current", "page");
  }
  button.append(dot(line.state), part("title", line.title));
  button.addEventListener("click", () => {
    if (workItem.id !== viewing) openView(workItem.id);
  });
  const item = document.createElement("li");
  item.append(button);
  return item;
}

/**
 * Draws what the inbox screen and a view say of every work item: the inbox's
 * sentence, when the person was last here, the lines in their groups with the
 * selected one marked, the preview, and the list at the left of a view.
 */
function showInbox(): void {
  const entries = workItems.map((workItem) => ({ workItem, line: inboxLine(workItem, sessions, paneKinds) }));
  const groups = inboxGroups(entries);
  const sentence = inboxSummary(entries.map(({ line }) => line));
  for (const element of [summary, viewSummary]) {
    element.textContent = sentence;
    element.hidden = sentence === "";
  }
  inboxLastHere.textContent = lastLook ? lastHere(lastLook.at, Date.now()) : "";
  inboxLastHere.hidden = !lastLook;
  inboxHead.hidden = summary.hidden && inboxLastHere.hidden;
  inboxEmpty.hidden = entries.length > 0;
  // The dots mark a change only where a look is recorded to measure it from.
  inboxLegend.hidden = !lastLook || entries.length === 0;
  inbox.replaceChildren(
    ...groups.flatMap((group) => {
      const heading = document.createElement("h2");
      heading.className = `caption state ${stateClass(group.state)}`;
      heading.textContent = group.heading;
      const list = document.createElement("ul");
      list.append(...group.entries.map(({ workItem, line }) => lineElement(workItem, line)));
      return [heading, list];
    }),
  );
  const inOrder = groups.flatMap((group) => group.entries);
  displayed = inOrder.map(({ workItem }) => workItem.id);
  viewWorkItems.replaceChildren(...inOrder.map(({ workItem, line }) => navElement(workItem, line)));
  select(selectedLine(displayed, selected));
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
    ...headlessLines(headless, workItem.id).map((line) => {
      const item = document.createElement("li");
      // The answer is plain text, never markup, and its line breaks are kept by the style.
      item.append(row(part("prompt", line.prompt), part(`state ${line.state}`, line.state)), part("answer", line.text));
      return item;
    }),
  );
}

function tabElement(session: SessionInfo, active: boolean): HTMLElement {
  const tab = document.createElement("span");
  tab.className = active ? "tab active" : "tab";
  const label = document.createElement("button");
  label.className = "label";
  label.textContent = tabLabel(session, paneKinds);
  const close = document.createElement("button");
  close.className = "close";
  close.textContent = "×";
  close.title = `Close ${label.textContent}`;
  label.addEventListener("click", () => {
    if (viewing === undefined) return;
    lastInFront.set(viewing, session.id);
    showView();
  });
  // The daemon ends the process and takes the session off its lists; the tab goes at the `inbox` that follows.
  close.addEventListener("click", () => send({ type: "close", id: session.id }));
  tab.append(label, close);
  return tab;
}

/**
 * Draws the view of the work item on screen: its header, its new commits,
 * its tabs, the terminal of the tab in front, and its "Ask" section. It
 * starts no process.
 */
function showView(): void {
  const workItem = viewed();
  if (!workItem) {
    showInboxScreen();
    return;
  }
  const line = inboxLine(workItem, sessions, paneKinds);
  viewTitle.textContent = line.title;
  viewBranch.textContent = line.branch;
  viewState.textContent = stateHeading(line.state);
  viewState.className = `caption state ${stateClass(line.state)}`;
  viewCommits.textContent = line.commits;
  viewCommits.hidden = line.commits === "";
  const shown = paneTabs(workItem, sessions, new Set(panes.keys()));
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
  showAskSection();
}

/** Shows one of the three screens and hides the other two. The bar is the summary screen's and the inbox screen's. */
function bringToFront(screen: HTMLElement): void {
  for (const each of [summaryScreen, inboxScreen, view]) each.hidden = each !== screen;
  bar.hidden = screen === view;
}

/**
 * Puts the summary screen in front: what changed since the person last
 * looked, in one sentence and one line per changed work item. It is drawn
 * once, from the changes worked out at `ready`, and holds no terminal.
 */
function showSummaryScreen(changes: readonly Change[], look: Look): void {
  summaryHeading.textContent = summarySentence(changes);
  summaryLastHere.textContent = lastHere(look.at, Date.now());
  summaryLines.replaceChildren(
    ...changes.map(({ workItem, line, sentence }) => {
      const button = document.createElement("button");
      button.dataset.workItem = String(workItem.id);
      const text = part("text", "");
      text.append(part("title", line.title), part("branch", line.branch));
      button.append(text, part("change", sentence), sealPlace());
      button.addEventListener("click", () => openView(workItem.id));
      const item = document.createElement("li");
      item.append(button);
      return item;
    }),
  );
  bringToFront(summaryScreen);
  // The keyboard starts on the one step to the inbox.
  openInbox.focus();
}

/** Puts a work item's view in front: of the summary screen, of the inbox screen, or of the view of another work item. */
function openView(workItemId: number): void {
  // A prompt typed for one work item is not asked in another.
  if (askingIn !== workItemId) askField.value = "";
  askingIn = workItemId;
  viewing = workItemId;
  front = undefined;
  bringToFront(view);
  // The list at the left marks the view on screen.
  showInbox();
  showView();
}

/** Puts the inbox screen in front. The view's terminals stay, hidden with it. */
function showInboxScreen(): void {
  const left = viewing;
  viewing = undefined;
  front = undefined;
  bringToFront(inboxScreen);
  if (left === undefined) return;
  // The work item the person left is the selected one, and the keyboard stays on its line.
  select(selectedLine(displayed, left));
  lineButton(left)?.focus();
}

/**
 * Acts on a key of the inbox screen: J and K move the selection, and Enter
 * opens the selected work item's view. On the summary screen Enter opens the
 * inbox, read under the same conditions, and J and K do nothing.
 */
function onKey(event: KeyboardEvent): void {
  const target = event.target instanceof Element ? event.target : null;
  const onSummary = !summaryScreen.hidden;
  const key = inboxKey(
    { code: event.code, modified: event.ctrlKey || event.metaKey || event.altKey || event.shiftKey },
    {
      inboxInFront: onSummary || !inboxScreen.hidden,
      dialogOpen: workItemDialog.open,
      inField: target?.closest("input, textarea, select, [contenteditable]") != null,
      onControl: target?.closest("button, a") != null,
    },
  );
  if (key === null) return;
  if (onSummary) {
    if (key !== "open") return;
    event.preventDefault();
    showInboxScreen();
    return;
  }
  event.preventDefault();
  if (key === "open") {
    if (selected !== undefined) openView(selected);
    return;
  }
  const next = moveSelection(displayed, selected, key);
  if (next === undefined) return;
  // Where the keyboard is on a line it moves with the selection, so Enter there opens the selected one.
  const onLine = document.activeElement instanceof HTMLElement && inbox.contains(document.activeElement);
  select(next);
  const button = lineButton(next);
  if (onLine) button?.focus();
  button?.scrollIntoView({ block: "nearest" });
}

/** Asks the field's prompt in the work item whose view is on screen. */
function ask(): void {
  const workItem = viewed();
  // One ask per answer: a second press before the daemon has taken the first would ask the same prompt twice.
  if (askRequest !== undefined || !workItem || !askButton(askField.value, workItem).enabled) return;
  askRequest = nextRequest++;
  send({ type: "ask", requestId: askRequest, workItemId: workItem.id, prompt: askField.value });
}

/** Takes the daemon's lists at an `inbox`: notifies of each state that changed, drops the closed panes, and redraws the screen in front. */
function takeLists(next: { sessions: SessionInfo[]; workItems: WorkItem[] }): void {
  const before = new Map<number, AgentState | null>(sessions.map((session) => [session.id, session.state]));
  sessions = next.sessions;
  workItems = next.workItems;
  for (const session of sessions) {
    const inFront = front === session.id && document.hasFocus();
    const notification = notificationFor(before.get(session.id) ?? null, session, inFront, workItems, paneKinds);
    if (notification) new Notification(notification.title, { body: notification.body });
  }
  const listed = new Set(sessions.map((session) => session.id));
  for (const pane of [...panes.values()]) if (!listed.has(pane.id)) remove(pane);
  showInbox();
  if (viewing !== undefined) showView();
}

/** Takes a pane this window started: it is in front the next time its work item's view is drawn, which is now where that view is on screen. */
function takeStarted(session: SessionInfo): void {
  // The `inbox` that lists the pane comes after the answer that carries it.
  if (!sessions.some((held) => held.id === session.id)) sessions = [...sessions, session];
  if (session.workItemId === null) return;
  lastInFront.set(session.workItemId, session.id);
  if (viewing === session.workItemId) showView();
}

function openWorkItemForm(): void {
  // The folder stays from the last time, because the next work item is often of the same repository.
  titleField.value = "";
  formError.textContent = "";
  createButton.disabled = false;
  workItemDialog.showModal();
  (repoField.value ? titleField : repoField).focus();
}

function createWorkItem(): void {
  const fields = workItemFields(repoField.value, titleField.value);
  if ("error" in fields) {
    formError.textContent = fields.error;
    return;
  }
  const kind = paneKinds.find((offered) => offered.kind === kindField.value);
  if (!kind) return;
  const requestId = nextRequest++;
  formRequest = requestId;
  formError.textContent = "";
  // One creation per answer: the button stays off until the daemon answers.
  createButton.disabled = true;
  send({ type: "createWorkItem", requestId, ...fields, kind: kind.kind, ...startSize() });
}

function onMessage(message: ServerMessage): void {
  switch (message.type) {
    case "ready": {
      // The states as the window finds them, so no notification. Nothing is attached and nothing started.
      paneKinds = message.paneKinds;
      sessions = message.sessions;
      workItems = message.workItems;
      headless = message.headless;
      // A daemon of an earlier build sends no look.
      lastLook = message.lastLook ?? null;
      // The counts of this `ready` were read from git at this window's hello, so the changes are worked out here, once.
      const changes = lastLook ? changesSince(lastLook, workItems, sessions, paneKinds) : [];
      changed = new Set(changes.map((change) => change.workItem.id));
      showPaneKinds();
      showInbox();
      // The app opens on the summary where a work item changed since the person last looked, and on the inbox otherwise.
      if (lastLook && changes.length > 0) showSummaryScreen(changes, lastLook);
      else showInboxScreen();
      return;
    }
    case "inbox":
      takeLists(message);
      return;
    case "started":
      status.textContent = "";
      takeStarted(message.session);
      return;
    case "workItemCreated": {
      // The view is drawn from the list, and the `inbox` that carries the new work item comes after this answer.
      if (!workItems.some((held) => held.id === message.workItem.id)) workItems = [...workItems, message.workItem];
      status.textContent = "";
      if (message.requestId === formRequest) {
        formRequest = undefined;
        // Closed before the pane is shown, so the keyboard goes to the pane.
        if (workItemDialog.open) workItemDialog.close();
      }
      takeStarted(message.session);
      openView(message.workItem.id);
      return;
    }
    case "asked":
      // The daemon took the prompt, so the field is free for the next one, unless it now holds a prompt for another work item.
      if (message.requestId === askRequest) {
        askRequest = undefined;
        if (askingIn === message.headless.workItemId) askField.value = "";
      }
      headless = withHeadless(headless, message.headless);
      showAskSection();
      return;
    case "headless":
      headless = withHeadless(headless, message.headless);
      showAskSection();
      return;
    case "error":
      // Nothing was created or started.
      if (message.requestId === askRequest) askRequest = undefined;
      if (message.requestId === formRequest && workItemDialog.open) {
        formRequest = undefined;
        formError.textContent = message.message;
        createButton.disabled = false;
      } else {
        status.textContent = message.message;
      }
      return;
    case "replay": {
      const pane = panes.get(message.id);
      if (!pane) return;
      pane.awaitingReplay = false;
      pane.term.write(message.data);
      return;
    }
    case "output": {
      // Output that arrives before the replay is in the replay.
      const pane = panes.get(message.id);
      if (pane && !pane.awaitingReplay) pane.term.write(message.data);
      return;
    }
    case "exit":
      panes.get(message.id)?.term.write(`\r\n[process exited with code ${message.exitCode}]\r\n`);
      return;
    case "agent":
      // The window draws nothing for a hook event. Its state arrives in the lists of the `inbox` that follows.
      return;
  }
}

/** Tells the daemon that the person looked at what the window shows, as the window stops being in front of them. The daemon keeps the look. */
function looked(): void {
  if (socket?.readyState === WebSocket.OPEN) send({ type: "looked" });
}

async function connect(): Promise<void> {
  const { url, token } = await window.owlery.daemon();
  const ws = new WebSocket(url);
  socket = ws;
  ws.addEventListener("open", () => {
    status.textContent = "";
    ws.send(JSON.stringify({ type: "hello", token } satisfies ClientMessage));
  });
  ws.addEventListener("message", (event) => onMessage(JSON.parse(String(event.data)) as ServerMessage));
  ws.addEventListener("close", () => {
    // The daemon went away: reload, which finds or starts it again and opens as any load does.
    status.textContent = "Reconnecting to the daemon…";
    setTimeout(() => window.location.reload(), 1000);
  });
}

document.getElementById("preview-seal")?.replaceWith(sealPlace());
document.getElementById("view-seal-place")?.replaceWith(sealPlace(true));
document.addEventListener("keydown", onKey);
document.getElementById("open-work-item")?.addEventListener("click", () => {
  if (selected !== undefined) openView(selected);
});
openInbox.addEventListener("click", showInboxScreen);
window.addEventListener("blur", looked);
window.addEventListener("pagehide", looked);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) looked();
});
document.getElementById("new-work-item")?.addEventListener("click", openWorkItemForm);
document.getElementById("back-to-inbox")?.addEventListener("click", showInboxScreen);
document.getElementById("work-item-cancel")?.addEventListener("click", () => workItemDialog.close());
document.getElementById("work-item-browse")?.addEventListener("click", () => {
  void window.owlery.pickFolder().then((folder) => {
    if (folder) repoField.value = folder;
  });
});
workItemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createWorkItem();
});
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

void connect();
