import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { Channel, type DaemonConnection } from "../shared/ipc";
import { ensureDaemon } from "./daemon-client";
import { pickFolder } from "./pick-folder";

// The daemon owns the terminals and outlives the app; the window reaches it
// over WebSocket. The main process finds or starts it, and opens the folder
// dialog the window asks for.
const runDir = join(app.getPath("userData"), "run");

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    // The size the two screens are drawn for, on the ground the page's style gives them (`--bg` of src/renderer/index.html).
    width: 1440,
    height: 900,
    title: "Owlery",
    backgroundColor: "#0f1218",
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
  mkdirSync(runDir, { recursive: true, mode: 0o700 });
  ipcMain.handle(Channel.daemon, async (): Promise<DaemonConnection> => {
    const { port, token } = await ensureDaemon(runDir, join(__dirname, "daemon.js"));
    return { url: `ws://127.0.0.1:${port}`, token };
  });
  ipcMain.handle(Channel.pickFolder, (event): Promise<string | null> => {
    // The dialog is a sheet of the window that asked, where that window is still there.
    const win = BrowserWindow.fromWebContents(event.sender);
    return pickFolder((options) => (win ? dialog.showOpenDialog(win, options) : dialog.showOpenDialog(options)));
  });
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // The sessions stay in the daemon.
  if (process.platform !== "darwin") app.quit();
});
