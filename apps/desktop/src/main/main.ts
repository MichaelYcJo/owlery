import { app, BrowserWindow, clipboard, dialog, ipcMain, nativeTheme, shell } from "electron";
import { execFile } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { themeChoice } from "../shared/appearance";
import { Channel, type DaemonConnection, type DaemonFailure, type InstalledApp } from "../shared/ipc";
import { groundAtStart, readAppearance, writeAppearance } from "./appearance";
import { quitsWithLastWindow, takeBackground } from "./background";
import { ensureDaemon } from "./daemon-client";
import { copyText, installedApps, openFolder, type Openers } from "./openers";
import { comeForward } from "./forward";
import { pickFolder } from "./pick-folder";

// The daemon owns the terminals and outlives the app; the window reaches it
// over WebSocket. The main process finds or starts it, opens the folder
// dialog the window asks for, keeps the theme a person chose, opens a
// folder in Finder or in an editor or a terminal, and writes the clipboard,
// for the items of a menu, and brings the window forward when the window asks.
const userData = app.getPath("userData");
const runDir = join(userData, "run");
// A start a test or an agent makes: the app takes neither the system's focus nor the person's keyboard.
// The variable leaves the environment here, so the daemon and the panes' processes start without it.
const background = takeBackground(process.env);
// Set before the app is ready, so the start does not make it the front app. On macOS the app then has no Dock icon and no menu bar.
if (background && process.platform === "darwin") app.setActivationPolicy("accessory");

// What ./openers reads the Mac through: the bundles on its disk, `open` run with arguments and no shell, and Finder.
const openers: Openers = {
  exists: existsSync,
  home: app.getPath("home"),
  run: (command, args) =>
    new Promise((resolve, reject) => {
      execFile(command, args, (error, _stdout, stderr) => (error ? reject(new Error(stderr.trim() || error.message)) : resolve()));
    }),
  openPath: (folder) => shell.openPath(folder),
};

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    // The size the screens are drawn for, on the ground of the theme the window was left in, so it does not flash another colour before its page is drawn.
    width: 1440,
    height: 900,
    title: "Owlery",
    // The title bar is hidden and inset: on macOS the traffic lights stand inside the sidebar, whose top drags the window.
    titleBarStyle: "hiddenInset",
    backgroundColor: groundAtStart(readAppearance(userData), nativeTheme.shouldUseDarkColors),
    // In the background the window is shown below, without the keyboard.
    show: !background,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  void win.loadFile(join(__dirname, "index.html"));
  if (background) win.showInactive();
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
  // The window is told each app's name and kind, and never where its bundle stands.
  ipcMain.handle(Channel.installedApps, (): InstalledApp[] => installedApps(openers.exists, openers.home).map(({ name, kind }) => ({ name, kind })));
  ipcMain.handle(Channel.openFolder, (_event, folder: unknown, name: unknown): Promise<string | null> => openFolder(folder, name, openers));
  ipcMain.handle(Channel.copyText, (_event, text: unknown): void => copyText(text, (written) => clipboard.writeText(written)));
  // The window asks at a person's click on its notification, so the app takes the front from whichever app the person is in.
  ipcMain.handle(Channel.comeForward, (event): boolean => comeForward(BrowserWindow.fromWebContents(event.sender), background, () => app.focus({ steal: true })));
  if (process.platform === "darwin") {
    try {
      app.dock?.setIcon(join(__dirname, "app-icon.png"));
    } catch {
      // setIcon throws on a file it cannot load. The Dock then keeps Electron's icon, and the window opens all the same.
    }
  }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // The sessions stay in the daemon.
  if (quitsWithLastWindow(process.platform, background)) app.quit();
});
