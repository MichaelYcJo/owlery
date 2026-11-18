import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import type { OwleryApi } from "../shared/ipc";
import type { ClientMessage, PaneKind, ServerMessage, SessionInfo, WorkItem } from "../shared/protocol";
import { tabLabel, workItemFields, workItemLine } from "./view";

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
  tab: HTMLButtonElement;
}

type Parts = Pick<Pane, "term" | "fit" | "element">;

const panes = new Map<number, Pane>();
// The terminal prepared for each request the daemon has not answered yet.
const pending = new Map<number, Parts>();
// The work items the daemon listed at `ready`, and each one this window created since.
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
const workItemList = document.getElementById("work-items") as HTMLUListElement;
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
  const tab = document.createElement("button");
  tab.className = "tab";
  tab.textContent = tabLabel(info, workItems);
  // A long title is cut in the tab, and whole here.
  tab.title = tab.textContent;
  const pane: Pane = { id: info.id, ...parts, tab };
  tab.addEventListener("click", () => show(pane));
  tabs.appendChild(tab);
  panes.set(info.id, pane);
  parts.term.onData((data) => send({ type: "input", id: info.id, data }));
  parts.term.onResize(({ cols, rows }) => send({ type: "resize", id: info.id, cols, rows }));
  show(pane);
  return pane;
}

function start(kind: PaneKind): void {
  const parts = newTerminal();
  const requestId = nextRequest++;
  pending.set(requestId, parts);
  send({ type: "start", kind, cols: parts.term.cols, rows: parts.term.rows, requestId });
}

function showWorkItems(): void {
  workItemList.replaceChildren(
    ...workItems.map((workItem) => {
      const item = document.createElement("li");
      item.textContent = workItemLine(workItem);
      item.title = workItem.worktree;
      return item;
    }),
  );
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
  const parts = newTerminal();
  const requestId = nextRequest++;
  pending.set(requestId, parts);
  formRequest = requestId;
  formError.textContent = "";
  // One creation per answer: the form opens again, or says why not, when the daemon answers.
  createButton.disabled = true;
  send({
    type: "createWorkItem",
    requestId,
    ...fields,
    kind: kindField.value === "shell" ? "shell" : "claude",
    cols: parts.term.cols,
    rows: parts.term.rows,
  });
}

function onMessage(message: ServerMessage): void {
  switch (message.type) {
    case "ready": {
      // Before the tabs, which are labelled from the list.
      workItems = message.workItems;
      showWorkItems();
      // Sessions that outlived the last window come back with the output they printed meanwhile.
      const alive = message.sessions.filter((s) => s.alive);
      for (const info of alive) {
        const pane = adopt(info, newTerminal());
        send({ type: "resize", id: info.id, cols: pane.term.cols, rows: pane.term.rows });
        send({ type: "attach", id: info.id });
      }
      if (alive.length === 0) start("shell");
      return;
    }
    case "started": {
      const parts = pending.get(message.requestId);
      pending.delete(message.requestId);
      status.textContent = "";
      if (parts) adopt(message.session, parts);
      return;
    }
    case "workItemCreated": {
      // No other message carries the list after `ready`, so the window adds to its own.
      workItems.push(message.workItem);
      showWorkItems();
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

document.getElementById("new-shell")?.addEventListener("click", () => start("shell"));
document.getElementById("new-claude")?.addEventListener("click", () => start("claude"));
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
