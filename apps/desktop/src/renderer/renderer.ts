import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import type { OwleryApi } from "../shared/ipc";
import type { ClientMessage, PaneKind, ServerMessage, SessionInfo } from "../shared/protocol";

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

const panes = new Map<number, Pane>();
const pending = new Map<number, { term: Terminal; fit: FitAddon; element: HTMLElement }>();
let active: Pane | undefined;
let nextRequest = 1;
let socket: WebSocket | undefined;

const tabs = document.getElementById("tabs") as HTMLElement;
const stage = document.getElementById("stage") as HTMLElement;
const events = document.getElementById("events") as HTMLOListElement;
const status = document.getElementById("status") as HTMLElement;

function send(message: ClientMessage): void {
  socket?.send(JSON.stringify(message));
}

function newTerminal(): { term: Terminal; fit: FitAddon; element: HTMLElement } {
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

function adopt(info: SessionInfo, parts: { term: Terminal; fit: FitAddon; element: HTMLElement }): Pane {
  const tab = document.createElement("button");
  tab.className = "tab";
  tab.textContent = `${info.kind === "claude" ? "Claude Code" : "Shell"} ${info.id}`;
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

function onMessage(message: ServerMessage): void {
  switch (message.type) {
    case "ready": {
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
      if (parts) adopt(message.session, parts);
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
new ResizeObserver(() => active?.fit.fit()).observe(stage);

void connect();
