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

export interface OwleryApi {
  /** Finds or starts the daemon and returns how to reach it. */
  daemon(): Promise<DaemonConnection>;
  /** Opens the native folder dialog and returns the folder chosen, or null where none was. */
  pickFolder(): Promise<string | null>;
}
