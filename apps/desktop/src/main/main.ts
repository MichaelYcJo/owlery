import { app, BrowserWindow, clipboard, dialog, ipcMain, Menu, type MenuItemConstructorOptions, nativeTheme, shell } from "electron";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { themeChoice } from "../shared/appearance";
import { Channel, type DaemonConnection, type DaemonFailure, type PathFound } from "../shared/ipc";
import { groundAtStart, readAppearance, writeAppearance } from "./appearance";
import { quitsWithLastWindow, takeBackground } from "./background";
import { chooseClipboard } from "./clipboard";
import { ensureDaemon } from "./daemon-client";
import { chooseOpener, openLink, takeOpener } from "./links";
import { menuTemplate } from "./menu";
import { staysOnPage } from "./navigation";
import { chooseFinder, pathsOf, showInFinder } from "./paths";
import { comeForward } from "./forward";
import { pickFolder } from "./pick-folder";

// The daemon owns the terminals and outlives the app; the window reaches it
// over WebSocket. The main process finds or starts it, opens the folder
// dialog the window asks for, and keeps the theme a person chose. It sets
// the app's menu, keeps the one window on Owlery's own page, opens the
// address of a link a person clicked in a pane outside Owlery, says what
// stands at a path a pane printed and shows one in Finder, reads and writes
// the clipboard, and brings the window forward when the window asks.
const userData = app.getPath("userData");
const runDir = join(userData, "run");
// A start a test or an agent makes: the app takes neither the system's focus nor the person's keyboard.
// The variable leaves the environment here, so the daemon and the panes' processes start without it.
const background = takeBackground(process.env);
// The program `OWLERY_OPENER` names, which acts in place of the system's browser and of Finder. The variable leaves the environment here too.
const program = takeOpener(process.env);
// Who opens a link's address: that program, nobody in the background, and the system's opener otherwise (./links).
const opener = chooseOpener(program, background, (address) =>
  shell.openExternal(address).then(
    () => true,
    () => false,
  ),
);
// Who shows a path in Finder, chosen the same way for each of Finder's two acts (./paths). `openPath` answers with an empty text where it opened the folder.
const finder = chooseFinder(program, background, {
  select: async (path) => {
    shell.showItemInFolder(path);
    return true;
  },
  open: (path) =>
    shell.openPath(path).then(
      (failure) => failure === "",
      () => false,
    ),
});
// The clipboard a copy and a paste of the window reach: the app's own in the background, and the system's otherwise (./clipboard).
const held = chooseClipboard(background, clipboard);
// Set before the app is ready, so the start does not make it the front app. On macOS the app then has no Dock icon and no menu bar.
if (background && process.platform === "darwin") app.setActivationPolicy("accessory");

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
  // The window shows Owlery's own page and nothing else. Nothing a pane prints and nothing a person drops on the window can take it to another page, where the panes would be out of sight, or open a second window (docs/architecture.md, Memory design). The page's reload asks for the URL the window shows, and passes.
  win.webContents.on("will-navigate", (event, url) => {
    if (!staysOnPage(url, win.webContents.getURL())) event.preventDefault();
  });
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
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
  // The address comes from what a pane printed, so it is opened only where it is an `http` or `https` one (./links).
  ipcMain.handle(Channel.openLink, (_event, address: unknown): Promise<boolean> => openLink(address, opener));
  // The texts come from what a pane printed. The answer says only whether a file or a folder stands at each, and where.
  ipcMain.handle(Channel.pathsOf, (_event, worktree: unknown, texts: unknown): Promise<(PathFound | null)[]> => pathsOf(worktree, texts, app.getPath("home")));
  // The disk is read again at the request, and a file is never opened (./paths).
  ipcMain.handle(Channel.showInFinder, (_event, path: unknown): Promise<boolean> => showInFinder(path, finder));
  ipcMain.handle(Channel.copyText, (_event, text: unknown): Promise<void> => held.writeText(text as string));
  ipcMain.handle(Channel.clipboardText, (): Promise<string> => held.readText());
  // The window asks at a person's click on its notification, so the app takes the front from whichever app the person is in.
  ipcMain.handle(Channel.comeForward, (event): boolean => comeForward(BrowserWindow.fromWebContents(event.sender), background, () => app.focus({ steal: true })));
  if (process.platform === "darwin") {
    try {
      app.dock?.setIcon(join(__dirname, "app-icon.png"));
    } catch {
      // setIcon throws on a file it cannot load. The Dock then keeps Electron's icon, and the window opens all the same.
    }
  }
  // Set before the window is made, so the keys Electron's own menu binds are never the window's: that menu closes the window on Command+W.
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate(process.platform) as MenuItemConstructorOptions[]));
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // The sessions stay in the daemon.
  if (quitsWithLastWindow(process.platform, background)) app.quit();
});
