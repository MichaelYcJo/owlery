// The lines the daemon writes to its log of how a daemon ended: one when it
// stops, and one when it starts on the `daemon.json` of a daemon that ended
// without stopping. The daemon's standard output is `daemon.log` of the run
// folder (src/main/daemon-client.ts, `ensureDaemon`), and src/daemon/main.ts
// writes the lines there. Each holds process ids, a time, a cause and
// counts, and no prompt, path or title, since the open decision on holding
// the terminals apart from the daemon counts them by hand
// (docs/architecture.md, Open decisions).

/** What the stop's line counts, read before anything is ended. */
export interface StopCounts {
  /** The panes whose process is alive. */
  panesAlive: number;
  /** The agents that work: a pane alive whose state is `working`, and a headless session that is `working`. */
  agentsWorking: number;
}

/** What stopped a daemon: a signal with its name, its own idle exit, or an error of its own code. */
export type StopCause = `signal ${string}` | "idle" | "error";

/** The line of a stop. */
export function stopLine(pid: number, at: Date, cause: StopCause, counts: StopCounts): string {
  return `owlery daemon ${String(pid)} stopped at ${at.toISOString()}: ${cause}, panes alive ${String(counts.panesAlive)}, agents working ${String(counts.agentsWorking)}`;
}

/** The line of a start on the `daemon.json` of the daemon `ended`, which no longer answers. */
export function endedLine(pid: number, at: Date, ended: number): string {
  return `owlery daemon ${String(pid)} started at ${at.toISOString()} after daemon ${String(ended)} ended without stopping`;
}

/**
 * Gives the function a stop calls with its cause first, before anything is
 * ended. It writes the stop's line once, with the counts read at that call,
 * so a stop that an error interrupts is not counted twice. It never throws:
 * where the counts cannot be read it writes nothing, so a listener of the
 * process's end that calls it does not change how the process ends.
 */
export function stopRecord(write: (line: string) => void, counts: () => StopCounts, pid = process.pid, now = (): Date => new Date()): (cause: StopCause) => void {
  let written = false;
  return (cause) => {
    if (written) return;
    written = true;
    try {
      write(stopLine(pid, now(), cause, counts()));
    } catch {
      // A broken daemon's counts: the stop goes on without its line.
    }
  };
}

/**
 * Writes the stop's line with `error` where an error of the daemon's own
 * code reaches the top of the process: an exception nothing caught, or a
 * rejection nothing handled. It listens to `uncaughtExceptionMonitor`,
 * which runs before the process ends and changes neither the crash nor
 * its exit code, and to nothing else.
 */
export function recordErrors(at: { on(event: "uncaughtExceptionMonitor", listener: () => void): unknown }, record: (cause: StopCause) => void): void {
  at.on("uncaughtExceptionMonitor", () => record("error"));
}
