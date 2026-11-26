import { app, BrowserWindow, clipboard, dialog, ipcMain, Menu, type MenuItemConstructorOptions, nativeTheme, shell } from "electron";
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lookChoice } from "../shared/appearance";
import { Channel, type DaemonConnection, type DaemonEnd, type DaemonFailure, type EditorState, type InstalledApp, type PathFound } from "../shared/ipc";
import { groundAtStart, readAppearance, writeAppearance } from "./appearance";
import { closeHides, quitsWithLastWindow, showInBackground, takeBackground } from "./background";
import { chooseClipboard, pastedImage } from "./clipboard";
import { ensureDaemon, otherBuild, stopDaemon } from "./daemon-client";
import { daemonControl } from "./daemon-control";
import { readEditor, writeEditor } from "./editor";
import { chooseOpener, openLink, takeOpener } from "./links";
import { ACCOUNTS, type MenuEntry, menuTemplate, QUIT_COMPLETELY, RESTART_DAEMON, SETTINGS } from "./menu";
import { staysOnPage } from "./navigation";
import { copyText, installedApps, openFolder, openInEditor, trashFolder, type Openers } from "./openers";
import { chooseFinder, pathsOf, showInFinder } from "./paths";
import { comeForward } from "./forward";
import { chooseFolderDialog, pickFolder } from "./pick-folder";
import { WINDOW_SIZE } from "./window-size";

// The daemon owns the terminals and outlives the app; the window reaches it
// over WebSocket. The main process finds or starts it, tells the window
// whether it is of another build than the one it would start, stops it where a
// person chose "Restart Daemon…" or "Quit Owlery Completely…" in the menu
// and confirmed it in the window, opens the folder
// dialog the window asks for outside a background start, and keeps the theme and the appearance a person chose. It sets
// the app's menu, keeps the one window on Owlery's own page, opens the
// address of a link a person clicked in a pane outside Owlery, says what
// stands at a path a pane printed and shows one in Finder, opens a folder in
// Finder or in an editor or a terminal for the items of a menu, keeps the
// editor a person chose and opens a file a pane printed in it, reads and
// writes the clipboard and writes an image pasted into a pane as a file, moves a removed repository's folder to the Trash
// where the person chose it, brings the window forward when the window asks,
// tells the window whether the app started in the background, so that its
// page raises no notification of the system's in such a start, and on macOS
// hides the window at its close, so its page keeps raising the
// notifications.
const userData = app.getPath("userData");
const runDir = join(userData, "run");
// A start a test or an agent makes: the app takes neither the system's focus nor the person's keyboard, its window lets the person's pointer through and draws nothing on the screen, and its page raises no notification of the system's.
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
// The clipboard a copy and a paste of the window reach: the app's own in the background, and the system's otherwise (./clipboard). The system's image is the first entry of the clipboard that holds a PNG image, as its bytes.
const held = chooseClipboard(background, {
  writeText: (text) => clipboard.writeText(text),
  readText: () => clipboard.readText(),
  readImage: async () => {
    const item = (await clipboard.read()).find((entry) => entry.types.includes("image/png"));
    return item ? new Uint8Array(await (await item.getType("image/png")).arrayBuffer()) : null;
  },
});
// The folder a pasted image is written into, in the system's temporary folder, which on macOS is the person's own.
const pastedFolder = join(tmpdir(), "owlery-pasted");
// Whether the app is quitting. From Electron's `before-quit` on, a close of the window closes it, so Quit ends the app.
let quitting = false;
app.on("before-quit", () => {
  quitting = true;
});
// Set before the app is ready, so the start does not make it the front app. On macOS the app then has no Dock icon and no menu bar.
if (background && process.platform === "darwin") app.setActivationPolicy("accessory");

// What ./openers reads the Mac through: the bundles on its disk, `open` run with arguments and no shell, and Finder.
const openers: Openers = {
  exists: existsSync,
  isFile: (path) => {
    try {
      return statSync(path).isFile();
    } catch {
      return false;
    }
  },
  home: app.getPath("home"),
  run: (command, args) =>
    new Promise((resolve, reject) => {
      execFile(command, args, (error, _stdout, stderr) => (error ? reject(new Error(stderr.trim() || error.message)) : resolve()));
    }),
  openPath: (folder) => shell.openPath(folder),
};

// The daemon's script, which the app starts where no daemon answers, and whose build it compares with the build of a daemon that does.
const daemonScript = join(__dirname, "daemon.js");
// The one place that stops and starts the daemon, in turn (./daemon-control). It stops the daemon of this app's run folder and no other (./daemon-client, `stopDaemon`).
const control = daemonControl({
  start: () => ensureDaemon(runDir, daemonScript),
  stop: () => stopDaemon(runDir),
  quit: () => app.quit(),
});

/**
 * Tells the window which of the menu's two entries that end the daemon a
 * person chose, at the entry's click. The window asks the person before
 * anything ends. The window is brought forward first, so one that a close
 * hid is shown, and in an app started in the background nothing is (./forward).
 * Where no window is left one is made. A window whose page is loading is
 * told once it has loaded.
 */
function tellDaemonMenu(chosen: DaemonEnd): void {
  tellWindow((win) => win.webContents.send(Channel.daemonMenu, chosen));
}

/** Tells the window of a click on the menu's "Accounts…", brought forward or made as a click that ends the daemon is told. */
function tellAccountsMenu(): void {
  tellWindow((win) => win.webContents.send(Channel.accountsMenu));
}

/** Tells the window of a click on the menu's "Settings…", as a click on "Accounts…" is told. */
function tellSettingsMenu(): void {
  tellWindow((win) => win.webContents.send(Channel.settingsMenu));
}

/** Brings the window forward, or makes one, and has `tell` say a menu's click to it once its page has loaded. */
function tellWindow(tell: (win: BrowserWindow) => void): void {
  const [open] = BrowserWindow.getAllWindows();
  const win = open ?? createWindow();
  if (open) comeForward(open, background, () => app.focus({ steal: true }));
  const send = (): void => tell(win);
  if (win.webContents.isLoading()) win.webContents.once("did-finish-load", send);
  else send();
}

/** The menu's template with the click of each entry that has one, by the entry's id. */
function withClicks(entries: readonly MenuEntry[], clicks: Readonly<Record<string, () => void>>): MenuItemConstructorOptions[] {
  return entries.map((entry) => {
    const click = entry.id === undefined ? undefined : clicks[entry.id];
    return { ...entry, ...(entry.submenu ? { submenu: withClicks(entry.submenu, clicks) } : {}), ...(click ? { click } : {}) } as MenuItemConstructorOptions;
  });
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    // The size the screens are drawn for, on the ground of the theme and the appearance the window was left in, so it does not flash another colour before its page is drawn.
    ...WINDOW_SIZE,
    // A start in the background, a test's or an agent's, keeps that size on a smaller screen, such as the 1024 by 768 one of GitHub's macOS runner, so its window shows the screens as they are drawn. A person's window stays inside their screen.
    enableLargerThanScreen: background,
    title: "Owlery",
    // The title bar is hidden and inset: on macOS the traffic lights stand inside the sidebar, whose top drags the window.
    titleBarStyle: "hiddenInset",
    backgroundColor: groundAtStart(readAppearance(userData), nativeTheme.shouldUseDarkColors),
    // In the background the window is shown below, fully transparent, without the keyboard and letting the system's pointer through (./background, `showInBackground`).
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
  // On macOS a close hides the window and keeps its page loaded and connected to the daemon (./background, `closeHides`). The red button and the menu's "Close Window" both arrive here. A window that is full screen leaves full screen first, and hides once it has left.
  win.on("close", (event) => {
    if (!closeHides(process.platform, background, quitting)) return;
    event.preventDefault();
    if (!win.isFullScreen()) {
      win.hide();
      return;
    }
    win.once("leave-full-screen", () => win.hide());
    win.setFullScreen(false);
  });
  void win.loadFile(join(__dirname, "index.html"));
  if (background) {
    showInBackground(win);
    // The page draws its frames while the system counts the window as unseen, as it counts every window while the displays sleep: a page drawn no frame dispatches no change of a media query and runs no animation frame. A load and a reload each make the page a new frame, which draws none until the switch is set again (#164).
    win.webContents.on("did-navigate", () => win.webContents.setBackgroundThrottling(false));
  }
  return win;
}

app.whenReady().then(() => {
  mkdirSync(runDir, { recursive: true, mode: 0o700 });
  ipcMain.handle(Channel.daemon, async (): Promise<DaemonConnection | DaemonFailure> => {
    try {
      const found = await control.daemon();
      // The script is read at each request, so a build made while the app runs is the one compared.
      return { url: `ws://127.0.0.1:${found.port}`, token: found.token, otherBuild: otherBuild(found, daemonScript) };
    } catch (error) {
      // Answered, not rejected: Electron puts its own words in front of a rejected request's message.
      return { error: error instanceof Error ? error.message : String(error) };
    }
  });
  // The window asks after the person confirmed it in the dialog. The answer is null, or why the daemon was not ended.
  ipcMain.handle(Channel.endDaemon, (_event, then: unknown): Promise<string | null> => control.end(then));
  ipcMain.handle(Channel.pickFolder, (event): Promise<string | null> => {
    // The dialog is a sheet of the window that asked, where that window is still there. In the background none opens (./pick-folder, `chooseFolderDialog`).
    const win = BrowserWindow.fromWebContents(event.sender);
    return pickFolder(chooseFolderDialog(background, (options) => (win ? dialog.showOpenDialog(win, options) : dialog.showOpenDialog(options))));
  });
  // The saved choice is read from its file at every load, so a window that reloads opens in the theme and the appearance the person last chose.
  ipcMain.on(Channel.appearance, (event) => {
    event.returnValue = readAppearance(userData);
  });
  ipcMain.handle(Channel.saveAppearance, (_event, choice: unknown): void => writeAppearance(userData, lookChoice(choice)));
  // Answered at every load, so a window that reloads in the background still raises no notification of the system's (src/renderer/notifier.ts).
  ipcMain.on(Channel.background, (event) => {
    event.returnValue = background;
  });
  // The window is told each app's name and kind, and never where its bundle stands.
  ipcMain.handle(Channel.installedApps, (): InstalledApp[] => installedApps(openers.exists, openers.home).map(({ name, kind }) => ({ name, kind })));
  ipcMain.handle(Channel.openFolder, (_event, folder: unknown, name: unknown): Promise<string | null> => openFolder(folder, name, openers));
  // The folder goes to the macOS Trash whole, and a person puts it back from there.
  ipcMain.handle(Channel.trashFolder, (_event, folder: unknown): Promise<string | null> => trashFolder(folder, openers.exists, (path) => shell.trashItem(path)));
  // The address comes from what a pane printed, so it is opened only where it is an `http` or `https` one (./links).
  ipcMain.handle(Channel.openLink, (_event, address: unknown): Promise<boolean> => openLink(address, opener));
  // The texts come from what a pane printed. The answer says only whether a file or a folder stands at each, and where.
  ipcMain.handle(Channel.pathsOf, (_event, worktree: unknown, texts: unknown): Promise<(PathFound | null)[]> => pathsOf(worktree, texts, app.getPath("home")));
  // The disk is read again at the request, and a file is never opened (./paths).
  ipcMain.handle(Channel.showInFinder, (_event, path: unknown): Promise<boolean> => showInFinder(path, finder));
  // A copy writes the clipboard this start keeps: the app's own in the background, and the system's otherwise (./clipboard).
  ipcMain.handle(Channel.copyText, (_event, text: unknown): Promise<void> => copyText(text, (written) => held.writeText(written)));
  ipcMain.handle(Channel.clipboardText, (): Promise<string> => held.readText());
  // A paste of an image: the image the clipboard this start keeps holds, written as a file whose path the window pastes (./clipboard). In the background that clipboard holds none.
  ipcMain.handle(Channel.pastedImage, (): Promise<string | null> => pastedImage(held, pastedFolder, Date.now()));
  // The editor's choice is read from its file at every request, so a window that reloads reads the one the person last saved.
  ipcMain.handle(Channel.editor, (): EditorState => ({ chosen: readEditor(userData), installed: installedApps(openers.exists, openers.home).flatMap(({ name, kind }) => (kind === "editor" ? [name] : [])) }));
  ipcMain.handle(Channel.saveEditor, (_event, chosen: unknown): boolean => writeEditor(userData, chosen));
  // The path comes from what a pane printed, so the disk is read again and the editor is the one `editor.json` keeps, of the list and installed (./openers). The program `OWLERY_OPENER` names is run in the editor's place, and in the background no editor opens.
  ipcMain.handle(Channel.openInEditor, (_event, path: unknown, line: unknown, column: unknown): Promise<string | null> => openInEditor(path, line, column, readEditor(userData), openers, { program, background }));
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
  Menu.setApplicationMenu(Menu.buildFromTemplate(withClicks(menuTemplate(process.platform), { [ACCOUNTS]: tellAccountsMenu, [SETTINGS]: tellSettingsMenu, [RESTART_DAEMON]: () => tellDaemonMenu("restart"), [QUIT_COMPLETELY]: () => tellDaemonMenu("quit") })));
  createWindow();
  // A click on the Dock icon arrives here. It shows the window a close hid, and makes one where none is left.
  app.on("activate", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (!win) createWindow();
    else if (!win.isVisible()) win.show();
  });
});

app.on("window-all-closed", () => {
  // The sessions stay in the daemon.
  if (quitsWithLastWindow(process.platform, background)) app.quit();
});
