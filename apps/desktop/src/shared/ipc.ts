// The one channel between the window and the main process: where the daemon
// is. Everything else goes between the window and the daemon, over the
// protocol in ./protocol.
export const Channel = {
  daemon: "owlery:daemon",
} as const;

export interface DaemonConnection {
  url: string;
  token: string;
}

export interface OwleryApi {
  /** Finds or starts the daemon and returns how to reach it. */
  daemon(): Promise<DaemonConnection>;
}
