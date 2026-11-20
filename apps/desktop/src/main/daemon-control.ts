// The one place that orders the daemon's stop and its start. The window asks
// the main process for the daemon at every load, and a person asks it from
// the menu to end the daemon, for a restart or for a complete quit. The
// functions that find or start a daemon, stop one and quit the app are
// passed in, and the module imports nothing of Electron, so the cases run
// without the app.

/** What the control is made of. */
export interface DaemonActs<Found> {
  /** Finds the running daemon, or starts one. */
  start: () => Promise<Found>;
  /** Stops the daemon. It rejects with a sentence the window shows as it is. */
  stop: () => Promise<void>;
  /** Quits the app. */
  quit: () => void;
}

/** What the main process's two channels call. */
export interface DaemonControl<Found> {
  /** The window's request for the daemon. It rejects with `Owlery is quitting.` from the moment a complete quit begins. */
  daemon(): Promise<Found>;
  /** Ends the daemon, for `"restart"` or for `"quit"`, and answers null, or why it did not, as a sentence the window shows as it is. */
  end(then: unknown): Promise<string | null>;
}

const QUITTING = "Owlery is quitting.";
const NEITHER = "Owlery was asked for neither a restart nor a quit.";

/**
 * Orders the stops and the starts: each runs once the one asked before it
 * has ended, so a window that asks for the daemon while a stop is under way
 * gets the daemon started after it, and a stop finds the daemon a start that
 * was under way brought up.
 *
 * A restart stops the daemon and starts none: the window's next load asks
 * for it. A complete quit stops the daemon and then quits the app. From the
 * moment it begins, a request for the daemon is refused and starts none, so
 * the load of a window whose daemon went away leaves no daemon behind the
 * app. Where its stop fails the app does not quit, and requests are served
 * again. A value that names neither stops nothing.
 */
export function daemonControl<Found>(acts: DaemonActs<Found>): DaemonControl<Found> {
  let quitting = false;
  let last: Promise<unknown> = Promise.resolve();
  /** Runs `act` once everything asked before it has ended, however it ended. */
  const inTurn = <T>(act: () => Promise<T>): Promise<T> => {
    const mine = last.then(act, act);
    last = mine.catch(() => undefined);
    return mine;
  };
  return {
    daemon() {
      if (quitting) return Promise.reject(new Error(QUITTING));
      return inTurn(acts.start);
    },
    async end(then) {
      if (quitting) return QUITTING;
      if (then !== "restart" && then !== "quit") return NEITHER;
      quitting = then === "quit";
      try {
        await inTurn(acts.stop);
      } catch (error) {
        quitting = false;
        return error instanceof Error ? error.message : String(error);
      }
      if (then === "quit") acts.quit();
      return null;
    },
  };
}
