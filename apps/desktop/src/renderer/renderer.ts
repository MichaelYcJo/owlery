import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import type { HookNotice, PaneKind, TerminalApi } from "../shared/ipc";

declare global {
  interface Window {
    owlery: { terminal: TerminalApi };
  }
}

const api = window.owlery.terminal;

interface Pane {
  id: number;
  kind: PaneKind;
  term: Terminal;
  fit: FitAddon;
  element: HTMLElement;
  tab: HTMLButtonElement;
}

const panes = new Map<number, Pane>();
let active: Pane | undefined;

const tabs = document.getElementById("tabs") as HTMLElement;
const stage = document.getElementById("stage") as HTMLElement;
const events = document.getElementById("events") as HTMLOListElement;

function show(pane: Pane): void {
  for (const other of panes.values()) {
    other.element.hidden = other !== pane;
    other.tab.classList.toggle("active", other === pane);
  }
  active = pane;
  pane.fit.fit();
  pane.term.focus();
}

async function openPane(kind: PaneKind): Promise<void> {
  const element = document.createElement("div");
  element.className = "pane";
  stage.appendChild(element);

  const term = new Terminal({
    // The UI keeps 1,000 lines; older output will come from the daemon (docs/architecture.md, Memory design).
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

  const id = await api.start(kind, term.cols, term.rows);
  const tab = document.createElement("button");
  tab.className = "tab";
  tab.textContent = `${kind === "claude" ? "Claude Code" : "Shell"} ${id}`;
  tab.addEventListener("click", () => show(pane));
  tabs.appendChild(tab);

  const pane: Pane = { id, kind, term, fit, element, tab };
  panes.set(id, pane);
  term.onData((data) => api.input(id, data));
  term.onResize(({ cols, rows }) => api.resize(id, cols, rows));
  show(pane);
}

api.onData((id, data) => panes.get(id)?.term.write(data));
api.onExit((id, exitCode) => panes.get(id)?.term.write(`\r\n[process exited with code ${exitCode}]\r\n`));
api.onHook((notice: HookNotice) => {
  const item = document.createElement("li");
  const time = new Date(notice.at).toLocaleTimeString();
  const tool = notice.toolName ? ` ${notice.toolName}` : "";
  item.textContent = `${time}  pane ${notice.paneId}  ${notice.name}${tool}`;
  events.prepend(item);
  while (events.children.length > 200) events.lastElementChild?.remove();
});

document.getElementById("new-shell")?.addEventListener("click", () => void openPane("shell"));
document.getElementById("new-claude")?.addEventListener("click", () => void openPane("claude"));
new ResizeObserver(() => active?.fit.fit()).observe(stage);

void openPane("shell");
