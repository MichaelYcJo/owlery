import { app, BrowserWindow, ipcMain } from "electron";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { Channel, type DaemonConnection } from "../shared/ipc";
import { ensureDaemon } from "./daemon-client";

// The daemon owns the terminals and outlives the app; the window reaches it
// over WebSocket. The main process only finds or starts it.
const runDir = join(app.getPath("userData"), "run");

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
  mkdirSync(runDir, { recursive: true, mode: 0o700 });
  ipcMain.handle(Channel.daemon, async (): Promise<DaemonConnection> => {
    const { port, token } = await ensureDaemon(runDir, join(__dirname, "daemon.js"));
    return { url: `ws://127.0.0.1:${port}`, token };
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
