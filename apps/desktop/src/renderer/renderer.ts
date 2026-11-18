import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import type { TerminalApi } from "../shared/ipc";

declare global {
  interface Window {
    owlery: { terminal: TerminalApi };
  }
}

const api = window.owlery.terminal;

async function openPane(container: HTMLElement): Promise<void> {
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
  term.open(container);
  try {
    const webgl = new WebglAddon();
    // On a lost GPU context the pane falls back to the DOM renderer.
    webgl.onContextLoss(() => webgl.dispose());
    term.loadAddon(webgl);
  } catch {
    // No WebGL: the DOM renderer stays.
  }
  fit.fit();

  const id = await api.start(term.cols, term.rows);
  api.onData((paneId, data) => {
    if (paneId === id) term.write(data);
  });
  api.onExit((paneId, exitCode) => {
    if (paneId === id) term.write(`\r\n[process exited with code ${exitCode}]\r\n`);
  });
  term.onData((data) => api.input(id, data));
  term.onResize(({ cols, rows }) => api.resize(id, cols, rows));
  new ResizeObserver(() => fit.fit()).observe(container);
  term.focus();
}

const container = document.getElementById("terminal");
if (container) void openPane(container);
