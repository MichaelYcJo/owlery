// The channels between the window and the main process: where the daemon is,
// the native folder dialog, which a page cannot open, the theme a person
// chose, which the main process keeps (./appearance), and the address of a
// link a person clicked in a pane, which only the main process may open
// (src/main/links.ts). Everything else goes between the window and the
// daemon, over the protocol in ./protocol.
import type { ThemeChoice } from "./appearance";

export const Channel = {
  daemon: "owlery:daemon",
  pickFolder: "owlery:pick-folder",
  /** Answered at once, not by a promise: the preload reads the saved choice before the page is drawn. */
  appearance: "owlery:appearance",
  saveAppearance: "owlery:save-appearance",
  openLink: "owlery:open-link",
} as const;

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
  /** Asks the main process to open an address outside Owlery, and answers whether it opened it. It opens only an `http` or `https` address. */
  openLink(url: string): Promise<boolean>;
  /** The path of a file a person dropped on the window, or an empty string for a file that is on no disk. A page cannot read it. */
  pathOf(file: File): string;
}
