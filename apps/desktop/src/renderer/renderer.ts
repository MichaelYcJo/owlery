import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import type { OwleryApi } from "../shared/ipc";
import type { AgentState, ClientMessage, PaneKind, PaneKindInfo, ServerMessage, SessionInfo, WorkItem } from "../shared/protocol";
import { agentKind, inboxLine, notificationFor, paneToOpen, tabLabel, workItemFields } from "./view";

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
  tab: HTMLElement;
}

type Parts = Pick<Pane, "term" | "fit" | "element">;

const panes = new Map<number, Pane>();
// The terminal prepared for each request the daemon has not answered yet.
const pending = new Map<number, Parts>();
// The kinds of pane the daemon offers, as `ready` listed them: the buttons, the form's choice and the tab labels come from here.
let paneKinds: PaneKindInfo[] = [];
// The sessions and the work items as the daemon last listed them, at `ready` and at each `inbox`, and a work item this window created since.
let sessions: SessionInfo[] = [];
let workItems: WorkItem[] = [];
let active: Pane | undefined;
let nextRequest = 1;
// The request the "+ Work item" form is waiting on.
let formRequest: number | undefined;
let socket: WebSocket | undefined;

const tabs = document.getElementById("tabs") as HTMLElement;
const stage = document.getElementById("stage") as HTMLElement;
const events = document.getElementById("events") as HTMLOListElement;
const status = document.getElementById("status") as HTMLElement;
const kindButtons = document.getElementById("pane-kinds") as HTMLElement;
const inbox = document.getElementById("inbox") as HTMLUListElement;
const workItemDialog = document.getElementById("work-item-dialog") as HTMLDialogElement;
const workItemForm = document.getElementById("work-item-form") as HTMLFormElement;
const repoField = document.getElementById("work-item-repo") as HTMLInputElement;
const titleField = document.getElementById("work-item-title") as HTMLInputElement;
const kindField = document.getElementById("work-item-kind") as HTMLSelectElement;
const formError = document.getElementById("work-item-error") as HTMLElement;
const createButton = document.getElementById("work-item-create") as HTMLButtonElement;

function send(message: ClientMessage): void {
  socket?.send(JSON.stringify(message));
}

function newTerminal(): Parts {
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
  return { term, fit, element };
}

function show(pane: Pane): void {
  for (const other of panes.values()) {
    other.element.hidden = other !== pane;
    other.tab.classList.toggle("active", other === pane);
  }
  active = pane;
  pane.fit.fit();
  pane.term.focus();
}

function adopt(info: SessionInfo, parts: Parts): Pane {
  const tab = document.createElement("span");
  tab.className = "tab";
  const label = document.createElement("button");
  label.className = "label";
  label.textContent = tabLabel(info, workItems, paneKinds);
  // A long title is cut in the tab, and whole here.
  label.title = label.textContent;
  const close = document.createElement("button");
  close.className = "close";
  close.textContent = "×";
  close.title = `Close ${label.textContent}`;
  tab.append(label, close);
  const pane: Pane = { id: info.id, ...parts, tab };
  label.addEventListener("click", () => show(pane));
  // The daemon ends the process and takes the session off its lists; the tab goes at the `inbox` that follows.
  close.addEventListener("click", () => send({ type: "close", id: info.id }));
  tabs.appendChild(tab);
  panes.set(info.id, pane);
  parts.term.onData((data) => send({ type: "input", id: info.id, data }));
  parts.term.onResize(({ cols, rows }) => send({ type: "resize", id: info.id, cols, rows }));
  show(pane);
  return pane;
}

/** Takes a live session the window holds no terminal for, with the output it printed so far. */
function attach(info: SessionInfo): Pane {
  const pane = adopt(info, newTerminal());
  send({ type: "resize", id: info.id, cols: pane.term.cols, rows: pane.term.rows });
  send({ type: "attach", id: info.id });
  return pane;
}

/** Drops the tab and the terminal of a session the daemon no longer lists. */
function remove(pane: Pane): void {
  panes.delete(pane.id);
  pane.term.dispose();
  pane.element.remove();
  pane.tab.remove();
  if (active !== pane) return;
  active = undefined;
  const next = [...panes.values()].pop();
  if (next) show(next);
}

function start(kind: PaneKind, workItemId?: number): void {
  const parts = newTerminal();
  const requestId = nextRequest++;
  pending.set(requestId, parts);
  send({ type: "start", kind, cols: parts.term.cols, rows: parts.term.rows, requestId, ...(workItemId === undefined ? {} : { workItemId }) });
}

/** Builds, once per connection, the "+" button of each kind the daemon offers and the form's choice among them. */
function showPaneKinds(): void {
  kindButtons.replaceChildren(
    ...paneKinds.map(({ kind, label }) => {
      const button = document.createElement("button");
      button.textContent = `+ ${label}`;
      button.addEventListener("click", () => start(kind));
      return button;
    }),
  );
  // The form starts on the kind an inbox line opens.
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

function openWorkItem(workItem: WorkItem): void {
  const open = paneToOpen(workItem, sessions, paneKinds);
  if (!open) return;
  if ("start" in open) {
    start(open.start, workItem.id);
    return;
  }
  // A pane another client opened has no terminal here until its line is clicked.
  const info = sessions.find((session) => session.id === open.show);
  const pane = panes.get(open.show) ?? (info && attach(info));
  if (pane) show(pane);
}

function showInbox(): void {
  inbox.replaceChildren(
    ...workItems.map((workItem) => {
      const line = inboxLine(workItem, sessions, paneKinds);
      const button = document.createElement("button");
      button.title = workItem.worktree;
      button.append(
        row(part("title", line.title), part(`state ${line.state ?? ""}`, line.state ?? "")),
        row(part("branch", line.branch), part("commits", line.commits)),
      );
      button.addEventListener("click", () => openWorkItem(workItem));
      const item = document.createElement("li");
      item.append(button);
      return item;
    }),
  );
}

/** Takes the daemon's lists at an `inbox`: notifies of each state that changed, drops the closed panes, and redraws the lines. */
function takeLists(next: { sessions: SessionInfo[]; workItems: WorkItem[] }): void {
  const before = new Map<number, AgentState | null>(sessions.map((session) => [session.id, session.state]));
  sessions = next.sessions;
  workItems = next.workItems;
  for (const session of sessions) {
    const inFront = active?.id === session.id && document.hasFocus();
    const notification = notificationFor(before.get(session.id) ?? null, session, inFront, workItems, paneKinds);
    if (notification) new Notification(notification.title, { body: notification.body });
  }
  const listed = new Set(sessions.map((session) => session.id));
  for (const pane of [...panes.values()]) if (!listed.has(pane.id)) remove(pane);
  showInbox();
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
  const parts = newTerminal();
  const requestId = nextRequest++;
  pending.set(requestId, parts);
  formRequest = requestId;
  formError.textContent = "";
  // One creation per answer: the button stays off until the daemon answers.
  createButton.disabled = true;
  send({
    type: "createWorkItem",
    requestId,
    ...fields,
    kind: kind.kind,
    cols: parts.term.cols,
    rows: parts.term.rows,
  });
}

function onMessage(message: ServerMessage): void {
  switch (message.type) {
    case "ready": {
      // Before the tabs, which are labelled from the lists. No notification: these are the states as the window finds them.
      paneKinds = message.paneKinds;
      sessions = message.sessions;
      workItems = message.workItems;
      showPaneKinds();
      showInbox();
      // Sessions that outlived the last window come back with the output they printed meanwhile.
      const alive = sessions.filter((s) => s.alive);
      for (const info of alive) attach(info);
      // A window with no pane opens one of the first kind the daemon offers.
      const first = paneKinds[0];
      if (alive.length === 0 && first) start(first.kind);
      return;
    }
    case "inbox":
      takeLists(message);
      return;
    case "started": {
      const parts = pending.get(message.requestId);
      pending.delete(message.requestId);
      status.textContent = "";
      if (parts) adopt(message.session, parts);
      return;
    }
    case "workItemCreated": {
      // The tab is labelled from the list, and the `inbox` that carries the new work item comes after this answer.
      workItems = [...workItems, message.workItem];
      const parts = pending.get(message.requestId);
      pending.delete(message.requestId);
      status.textContent = "";
      if (message.requestId === formRequest) {
        formRequest = undefined;
        // Closed before the pane is shown, so the keyboard goes to the pane.
        if (workItemDialog.open) workItemDialog.close();
      }
      if (parts) adopt(message.session, parts);
      return;
    }
    case "error": {
      // Nothing was created or started, so the terminal prepared for the request goes.
      const parts = pending.get(message.requestId);
      pending.delete(message.requestId);
      parts?.term.dispose();
      parts?.element.remove();
      if (message.requestId === formRequest && workItemDialog.open) {
        formRequest = undefined;
        formError.textContent = message.message;
        createButton.disabled = false;
      } else {
        status.textContent = message.message;
      }
      return;
    }
    case "replay":
    case "output":
      panes.get(message.id)?.term.write(message.data);
      return;
    case "exit":
      panes.get(message.id)?.term.write(`\r\n[process exited with code ${message.exitCode}]\r\n`);
      return;
    case "agent": {
      const item = document.createElement("li");
      const tool = message.tool ? ` ${message.tool}` : "";
      item.textContent = `${new Date(message.at).toLocaleTimeString()}  pane ${message.id}  ${message.event}${tool}`;
      events.prepend(item);
      while (events.children.length > 200) events.lastElementChild?.remove();
      return;
    }
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
    // The daemon went away: reload, which finds or starts it again.
    status.textContent = "Reconnecting to the daemon…";
    setTimeout(() => window.location.reload(), 1000);
  });
}

document.getElementById("new-work-item")?.addEventListener("click", openWorkItemForm);
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
new ResizeObserver(() => active?.fit.fit()).observe(stage);

void connect();
