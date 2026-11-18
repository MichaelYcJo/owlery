import { app, BrowserWindow, ipcMain } from "electron";
import { homedir } from "node:os";
import { join } from "node:path";
import { Channel } from "../shared/ipc";
import { loginShell, TerminalSession } from "./pty";

// Until the daemon exists (issue #5), the main process owns the terminals.
const sessions = new Map<number, TerminalSession>();
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

app.whenReady().then(() => {
  ipcMain.handle(Channel.start, (event, cols: number, rows: number) => {
    const id = nextId++;
    const shell = loginShell(process.env);
    // A pane opens in the user's home until work items give it a worktree (issue #6).
    const cwd = process.env.OWLERY_CWD || homedir();
    const session = TerminalSession.spawn({ ...shell, cwd, cols, rows });
    sessions.set(id, session);
    session.onData((data) => {
      if (!event.sender.isDestroyed()) event.sender.send(Channel.data, id, data);
    });
    session.onExit((exitCode) => {
      sessions.delete(id);
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
});

app.on("window-all-closed", () => {
  for (const session of sessions.values()) session.kill();
  sessions.clear();
  if (process.platform !== "darwin") app.quit();
});
