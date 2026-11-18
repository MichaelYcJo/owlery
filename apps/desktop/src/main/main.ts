import { app, BrowserWindow, ipcMain, type WebContents } from "electron";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Channel, type HookNotice, type PaneKind } from "../shared/ipc";
import { claudePaneCommand, HookServer, writeHookSettings } from "./hooks";
import { loginShell, TerminalSession } from "./pty";

// Until the daemon exists (issue #5), the main process owns the terminals.
const sessions = new Map<number, TerminalSession>();
const owners = new Map<number, WebContents>();
let nextId = 1;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    title: "Owlery",
    backgroundColor: "#1e1e1e",
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  void win.loadFile(join(__dirname, "index.html"));
  return win;
}

app.whenReady().then(async () => {
  // Owlery's own directory, readable by the user alone, holds the hook socket
  // and the settings file it passes to `claude`. The user's ~/.claude is never written.
  const runDir = join(app.getPath("userData"), "run");
  mkdirSync(runDir, { recursive: true, mode: 0o700 });
  const hookSettingsFile = writeHookSettings(runDir);
  const hooks = await HookServer.listen(join(runDir, "hooks.sock"));
  hooks.onEvent(({ paneId, name, payload }) => {
    // Event and field names only: a hook's values carry the person's prompts.
    if (process.env.OWLERY_DEBUG_HOOKS === "1") console.log(`hook pane=${paneId} ${name} ${Object.keys(payload).sort().join(",")}`);
    const owner = owners.get(paneId);
    if (!owner || owner.isDestroyed()) return;
    const notice: HookNotice = {
      paneId,
      name,
      sessionId: typeof payload.session_id === "string" ? payload.session_id : undefined,
      toolName: typeof payload.tool_name === "string" ? payload.tool_name : undefined,
      at: Date.now(),
    };
    owner.send(Channel.hook, notice);
  });

  ipcMain.handle(Channel.start, (event, kind: PaneKind, cols: number, rows: number) => {
    const id = nextId++;
    const command = kind === "claude" ? claudePaneCommand(process.env, hookSettingsFile) : loginShell(process.env);
    // A pane opens in the user's home until work items give it a worktree (issue #6).
    const cwd = process.env.OWLERY_CWD || homedir();
    const env = { ...process.env, OWLERY_PANE_ID: String(id), OWLERY_HOOK_SOCKET: hooks.socketPath };
    const session = TerminalSession.spawn({ ...command, cwd, cols, rows, env });
    sessions.set(id, session);
    owners.set(id, event.sender);
    session.onData((data) => {
      if (!event.sender.isDestroyed()) event.sender.send(Channel.data, id, data);
    });
    session.onExit((exitCode) => {
      sessions.delete(id);
      owners.delete(id);
      if (!event.sender.isDestroyed()) event.sender.send(Channel.exit, id, exitCode);
    });
    return id;
  });
  ipcMain.on(Channel.input, (_event, id: number, data: string) => sessions.get(id)?.write(data));
  ipcMain.on(Channel.resize, (_event, id: number, cols: number, rows: number) => sessions.get(id)?.resize(cols, rows));

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  app.on("will-quit", () => void hooks.close());
});

app.on("window-all-closed", () => {
  for (const session of sessions.values()) session.kill();
  sessions.clear();
  owners.clear();
  if (process.platform !== "darwin") app.quit();
});
