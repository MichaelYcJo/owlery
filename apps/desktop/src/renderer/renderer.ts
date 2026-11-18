import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import type { OwleryApi } from "../shared/ipc";
import type { AgentState, ClientMessage, HeadlessInfo, PaneKind, PaneKindInfo, ServerMessage, SessionInfo, WorkItem } from "../shared/protocol";
import { agentKind, askButton, headlessLines, inboxLine, inboxSummary, notificationFor, paneInFront, paneTabs, tabLabel, withHeadless, workItemFields } from "./view";

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
// The work item whose view is on screen, or nothing while the inbox screen is. It is kept nowhere else, so a reload opens on the inbox.
let viewing: number | undefined;
// The pane in front of the view on screen. No pane is in front on the inbox screen.
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

const inboxScreen = document.getElementById("inbox-screen") as HTMLElement;
const summary = document.getElementById("inbox-summary") as HTMLElement;
const inbox = document.getElementById("inbox") as HTMLUListElement;
const inboxEmpty = document.getElementById("inbox-empty") as HTMLElement;
const view = document.getElementById("work-item-view") as HTMLElement;
const viewHeader = document.getElementById("view-header") as HTMLElement;
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
    // Nerd Fonts first, so the icons of common shell prompts draw; then Korean fallbacks.
    fontFamily:
      '"MesloLGS NF", "MesloLGS Nerd Font", "JetBrainsMono Nerd Font", "Hack Nerd Font", "Symbols Nerd Font Mono", Menlo, "D2Coding", "Apple SD Gothic Neo", monospace',
    fontSize: 13,
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

/** The seal's place. No work item can be sealed yet, so it shows the emblem dimmed and says so. */
function sealPlace(): HTMLImageElement {
  const image = document.createElement("img");
  image.className = "seal unsealed";
  image.src = "./owl-icon-cream.svg";
  image.alt = NO_SEAL;
  image.title = NO_SEAL;
  return image;
}

/** Draws the summary and one line per work item, in the daemon's order. */
function showInbox(): void {
  const lines = workItems.map((workItem) => ({ workItem, line: inboxLine(workItem, sessions, paneKinds) }));
  summary.textContent = inboxSummary(lines.map(({ line }) => line));
  inboxEmpty.hidden = lines.length > 0;
  inbox.replaceChildren(
    ...lines.map(({ workItem, line }) => {
      const button = document.createElement("button");
      button.title = workItem.worktree;
      button.dataset.workItem = String(workItem.id);
      button.append(part("title", line.title), part("branch", line.branch), part(`state ${line.state ?? ""}`, line.state ?? ""), part("commits", line.commits), sealPlace());
      button.addEventListener("click", () => openView(workItem.id));
      const item = document.createElement("li");
      item.append(button);
      return item;
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
 * Draws the view of the work item on screen: its header, its tabs, the
 * terminal of the tab in front, and its "Ask" section. It starts no process.
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
  viewState.textContent = line.state ?? "";
  viewState.className = `state ${line.state ?? ""}`;
  viewCommits.textContent = line.commits;
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

/** Puts a work item's view in front of the inbox screen. */
function openView(workItemId: number): void {
  // A prompt typed for one work item is not asked in another.
  if (askingIn !== workItemId) askField.value = "";
  askingIn = workItemId;
  viewing = workItemId;
  front = undefined;
  inboxScreen.hidden = true;
  view.hidden = false;
  showView();
}

/** Puts the inbox screen in front. The view's terminals stay, hidden with it. */
function showInboxScreen(): void {
  const left = viewing;
  viewing = undefined;
  front = undefined;
  view.hidden = true;
  inboxScreen.hidden = false;
  // The keyboard stays on the line of the work item the person left.
  if (left !== undefined) inbox.querySelector<HTMLElement>(`button[data-work-item="${left}"]`)?.focus();
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
    case "ready":
      // The states as the window finds them, so no notification. Nothing is attached and nothing started: the app opens on the inbox.
      paneKinds = message.paneKinds;
      sessions = message.sessions;
      workItems = message.workItems;
      headless = message.headless;
      showPaneKinds();
      showInbox();
      return;
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
      showInbox();
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
    // The daemon went away: reload, which finds or starts it again and opens on the inbox.
    status.textContent = "Reconnecting to the daemon…";
    setTimeout(() => window.location.reload(), 1000);
  });
}

viewHeader.append(sealPlace());
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
