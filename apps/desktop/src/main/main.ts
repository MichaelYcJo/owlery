import { app, BrowserWindow, dialog, ipcMain, nativeTheme } from "electron";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { themeChoice } from "../shared/appearance";
import { Channel, type DaemonConnection, type DaemonFailure } from "../shared/ipc";
import { groundAtStart, readAppearance, writeAppearance } from "./appearance";
import { ensureDaemon } from "./daemon-client";
import { pickFolder } from "./pick-folder";

// The daemon owns the terminals and outlives the app; the window reaches it
// over WebSocket. The main process finds or starts it, opens the folder
// dialog the window asks for, and keeps the theme a person chose.
const userData = app.getPath("userData");
const runDir = join(userData, "run");

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    // The size the screens are drawn for, on the ground of the theme the window was left in, so it does not flash another colour before its page is drawn.
    width: 1440,
    height: 900,
    title: "Owlery",
    // The title bar is hidden and inset: on macOS the traffic lights stand inside the sidebar, whose top drags the window.
    titleBarStyle: "hiddenInset",
    backgroundColor: groundAtStart(readAppearance(userData), nativeTheme.shouldUseDarkColors),
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
  ipcMain.handle(Channel.daemon, async (): Promise<DaemonConnection | DaemonFailure> => {
    try {
      const { port, token } = await ensureDaemon(runDir, join(__dirname, "daemon.js"));
      return { url: `ws://127.0.0.1:${port}`, token };
    } catch (error) {
      // Answered, not rejected: Electron puts its own words in front of a rejected request's message.
      return { error: error instanceof Error ? error.message : String(error) };
    }
  });
  ipcMain.handle(Channel.pickFolder, (event): Promise<string | null> => {
    // The dialog is a sheet of the window that asked, where that window is still there.
    const win = BrowserWindow.fromWebContents(event.sender);
    return pickFolder((options) => (win ? dialog.showOpenDialog(win, options) : dialog.showOpenDialog(options)));
  });
  // The saved choice is read from its file at every load, so a window that reloads opens in the theme the person last chose.
  ipcMain.on(Channel.appearance, (event) => {
    event.returnValue = readAppearance(userData);
  });
  ipcMain.handle(Channel.saveAppearance, (_event, choice: unknown): void => writeAppearance(userData, themeChoice(choice)));
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // The sessions stay in the daemon.
  if (process.platform !== "darwin") app.quit();
});
