// The channels between the window and the main process: where the daemon is,
// the native folder dialog, which a page cannot open, and the theme a person
// chose, which the main process keeps (./appearance). Everything else goes
// between the window and the daemon, over the protocol in ./protocol.
import type { ThemeChoice } from "./appearance";

export const Channel = {
  daemon: "owlery:daemon",
  pickFolder: "owlery:pick-folder",
  /** Answered at once, not by a promise: the preload reads the saved choice before the page is drawn. */
  appearance: "owlery:appearance",
  saveAppearance: "owlery:save-appearance",
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
}
