// The channels between the window and the main process: where the daemon is,
// the native folder dialog, which a page cannot open, the theme a person
// chose, which the main process keeps (./appearance), what a menu's
// "Open in" and "Copy" items need of the Mac: the editors and terminals it
// holds, a folder opened in Finder or in one of them, and the clipboard,
// the Trash a removed repository's folder moves to where the person chose
// it (src/main/openers), and the window's coming forward, which a sandboxed
// page cannot do itself. Everything else goes between the window and the
// daemon, over the protocol in ./protocol.
import type { ThemeChoice } from "./appearance";

export const Channel = {
  daemon: "owlery:daemon",
  pickFolder: "owlery:pick-folder",
  /** Answered at once, not by a promise: the preload reads the saved choice before the page is drawn. */
  appearance: "owlery:appearance",
  saveAppearance: "owlery:save-appearance",
  installedApps: "owlery:installed-apps",
  openFolder: "owlery:open-folder",
  copyText: "owlery:copy-text",
  trashFolder: "owlery:trash-folder",
  comeForward: "owlery:come-forward",
} as const;

/** An editor or a terminal the Mac holds, which a menu offers to open a folder in. */
export interface InstalledApp {
  name: string;
  kind: "editor" | "terminal";
}

export interface DaemonConnection {
  url: string;
  token: string;
}

/** Why no daemon could be reached, as a sentence the window shows as it is. */
export interface DaemonFailure {
  error: string;
}

export interface OwleryApi {
  /** Finds or starts the daemon and returns how to reach it, or why it could not be started. */
  daemon(): Promise<DaemonConnection | DaemonFailure>;
  /** Opens the native folder dialog and returns the folder chosen, or null where none was. */
  pickFolder(): Promise<string | null>;
  /** The theme choice the main process held when this page loaded: Night desk at the first run. */
  appearance: ThemeChoice;
  /** Has the main process keep a new choice, so the next window opens in it. */
  saveAppearance(choice: ThemeChoice): Promise<void>;
  /** The editors and the terminals the Mac holds, of those the main process knows, the editors first. */
  installedApps(): Promise<InstalledApp[]>;
  /** Opens a folder in Finder, where `app` is null, or in the installed app of that name. The folder is a work item's worktree or a repository's folder, and the main process opens no other path. It answers null, or why nothing was opened, as a sentence the window shows as it is. */
  openFolder(folder: string, app: string | null): Promise<string | null>;
  /** Writes a text to the system's clipboard. */
  copyText(text: string): Promise<void>;
  /** Moves a repository's folder to the macOS Trash, whole. The window asks it after the daemon answered that the repository is removed, and only where the person chose it. The main process moves a folder that holds `.git` at its top and no other path. It answers null, or why nothing was moved, as a sentence the window shows as it is. */
  trashFolder(folder: string): Promise<string | null>;
  /** Asks the main process to bring the window in front of the person, and answers whether it did: an app started in the background brings nothing forward. */
  comeForward(): Promise<boolean>;
}
