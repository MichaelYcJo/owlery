// The two channels between the window and the main process: where the daemon
// is, and the native folder dialog, which a page cannot open. Everything else
// goes between the window and the daemon, over the protocol in ./protocol.
export const Channel = {
  daemon: "owlery:daemon",
  pickFolder: "owlery:pick-folder",
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
}
