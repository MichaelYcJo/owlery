// The channels between the window and the main process: where the daemon is
// and whether it is of another build than the one the app would start,
// the native folder dialog, which a page cannot open, the theme and the
// appearance a person chose, which the main process keeps (./appearance), the address of a
// link a person clicked in a pane, which only the main process may open
// (src/main/links.ts), what stands on the disk at a path a pane printed and
// the showing of one in Finder (src/main/paths.ts), what a menu's "Open in"
// items need of the Mac: the editors and terminals it holds and a folder
// opened in Finder or in one of them, the Trash a removed repository's
// folder moves to where the person chose it (src/main/openers.ts), the
// clipboard, which a start in the background keeps to itself
// (src/main/clipboard.ts), and the window's coming forward, which a
// sandboxed page cannot do itself, which of the menu's two entries that end
// the daemon a person chose, which the main process tells the window, and
// the end of the daemon the window then asks for, since the main process is
// the one that stops it (src/main/daemon-client.ts). Everything else goes
// between the window and the daemon, over the protocol in ./protocol.
import type { LookChoice } from "./appearance";

export const Channel = {
  daemon: "owlery:daemon",
  pickFolder: "owlery:pick-folder",
  /** Answered at once, not by a promise: the preload reads the saved choice before the page is drawn. */
  appearance: "owlery:appearance",
  saveAppearance: "owlery:save-appearance",
  installedApps: "owlery:installed-apps",
  openFolder: "owlery:open-folder",
  trashFolder: "owlery:trash-folder",
  openLink: "owlery:open-link",
  pathsOf: "owlery:paths-of",
  showInFinder: "owlery:show-in-finder",
  copyText: "owlery:copy-text",
  clipboardText: "owlery:clipboard-text",
  comeForward: "owlery:come-forward",
  endDaemon: "owlery:end-daemon",
  /** Sent by the main process without being asked, at a click on one of the menu's two entries that end the daemon. */
  daemonMenu: "owlery:daemon-menu",
  /** Sent by the main process without being asked, at a click on the menu's "Accounts…". */
  accountsMenu: "owlery:accounts-menu",
} as const;

/** What follows the daemon's end: the daemon of the running build is started again, or the app quits and starts none. */
export type DaemonEnd = "restart" | "quit";

/** An editor or a terminal the Mac holds, which a menu offers to open a folder in. */
export interface InstalledApp {
  name: string;
  kind: "editor" | "terminal";
}

export interface DaemonConnection {
  url: string;
  token: string;
  /** Whether the daemon is of another build than the one the app would start, read at this request (src/main/daemon-client.ts, `otherBuild`). The status line then names "Restart Daemon…". */
  otherBuild: boolean;
}

/** Why no daemon could be reached, as a sentence the window shows as it is. */
export interface DaemonFailure {
  error: string;
}

/** What the main process found at a path a pane printed: the whole path, and whether a folder stands there or a file. */
export interface PathFound {
  path: string;
  folder: boolean;
}

export interface OwleryApi {
  /** Finds or starts the daemon and returns how to reach it and whether it is of another build, or why it could not be started. */
  daemon(): Promise<DaemonConnection | DaemonFailure>;
  /** Opens the native folder dialog and returns the folder chosen, or null where none was. An app started in the background opens none and returns null. */
  pickFolder(): Promise<string | null>;
  /** The choice of theme and appearance the main process held when this page loaded: Night watch in the dark appearance at the first run. */
  appearance: LookChoice;
  /** Has the main process keep a new choice, so the next window opens in it. */
  saveAppearance(choice: LookChoice): Promise<void>;
  /** The editors and the terminals the Mac holds, of those the main process knows, the editors first. */
  installedApps(): Promise<InstalledApp[]>;
  /** Opens a folder in Finder, where `app` is null, or in the installed app of that name. The folder is a work item's worktree or a repository's folder, and the main process opens no other path. It answers null, or why nothing was opened, as a sentence the window shows as it is. */
  openFolder(folder: string, app: string | null): Promise<string | null>;
  /** Moves a repository's folder to the macOS Trash, whole. The window asks it after the daemon answered that the repository is removed, and only where the person chose it. The main process moves a folder that holds `.git` at its top and no other path. It answers null, or why nothing was moved, as a sentence the window shows as it is. */
  trashFolder(folder: string): Promise<string | null>;
  /** Asks the main process to open an address outside Owlery, and answers whether it opened it. It opens only an `http` or `https` address. */
  openLink(url: string): Promise<boolean>;
  /** Asks the main process what stands at each text a pane printed, read from `worktree` where the text is no whole path, and answers in the texts' order: the whole path and whether it is a folder, or null where neither a file nor a folder stands there. */
  pathsOf(worktree: string | null, texts: string[]): Promise<(PathFound | null)[]>;
  /** Asks the main process to show a whole path in Finder, and answers whether it showed it: a file selected in its folder, a folder opened. An app started in the background shows nothing. */
  showInFinder(path: string): Promise<boolean>;
  /** Has the main process write a text to the clipboard: the system's, or the app's own in an app started in the background. */
  copyText(text: string): Promise<void>;
  /** The text that clipboard holds. */
  clipboardText(): Promise<string>;
  /** The path of a file a person dropped on the window, or an empty string for a file that is on no disk. A page cannot read it. */
  pathOf(file: File): string;
  /** Asks the main process to bring the window in front of the person, and answers whether it did: an app started in the background brings nothing forward. */
  comeForward(): Promise<boolean>;
  /** Asks the main process to end the daemon and every session it holds, after the person confirmed it. After `"restart"` the window's next load starts the daemon of the running build, and after `"quit"` the app quits. It answers null, or why the daemon was not ended, as a sentence the window shows as it is. */
  endDaemon(then: DaemonEnd): Promise<string | null>;
  /** Has `listener` called whenever a person chooses "Restart Daemon…" or "Quit Owlery Completely…" in the application menu, with which of the two. */
  onDaemonMenu(listener: (chosen: DaemonEnd) => void): void;
  /** Has `listener` called whenever a person chooses "Accounts…" in the application menu. */
  onAccountsMenu(listener: () => void): void;
}
