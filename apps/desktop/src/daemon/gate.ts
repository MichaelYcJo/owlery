// The broad gate's run: one command of a repository's, started as a check on
// another machine starts it, with what it printed kept and its process group
// ended at a stop. This module starts the process and reads no record: its
// caller reads the command from the work item's worktree, holds the tree to
// the head around the run, and writes the run's record, through
// `stage-records.ts`. The callers are the daemon's chain (`Daemon#runGate`)
// and the chain command a pane's session runs (`chain-command.ts`)
// (docs/architecture.md, "Code runs the order, the orchestrator judges").
import { execFile, spawn } from "node:child_process";
import { terminalEnv } from "./pty";

/** How long a broad gate's command may run, from its start, before the daemon ends it, where the options name no time. */
export const GATE_LIMIT_MS = 60 * 60_000;

/** How many of the last characters a command printed the daemon keeps, on its two streams together, in a string's characters: the bound of a pane's kept output. */
export const GATE_OUTPUT_CHARS = 262_144;

/** The folder of the daemon's run folder that holds what each work item's newest broad gate printed, in `<work item's id>.txt`. */
export const GATE_OUTPUT_FOLDER = "gate-output";

/** How long a stop waits, after it signalled the command's process group to end, before it kills the group where the command has not exited by then: the wait a role session's stop has. */
export const GATE_KILL_AFTER_MS = 2000;

/** How long after the command's exit its end waits for its streams to close, which a process the command started can hold open. */
const STREAMS_GRACE_MS = 300;

/** What the lookup has the login shell print: its `PATH`, on a marked line of its own. */
export const PATH_SCRIPT = `printf '\\n__owlery_path=%s\\n' "$PATH"`;

/**
 * The `PATH` the person's interactive login shell prints, as a terminal
 * pane's shell has it, or null where the shell printed none within the wait.
 * A daemon the app started has the app's `PATH`, and many profiles set theirs
 * only for an interactive shell (`adapters/claude.ts#lookupCommand`, which
 * asks the same shell the same way). The shell is started with a pane's
 * environment. Its exit code is its profile's last word and decides nothing.
 */
export function loginPath(env: NodeJS.ProcessEnv, timeoutMs = 10_000): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(env.SHELL || "/bin/zsh", ["-l", "-i", "-c", PATH_SCRIPT], { env: terminalEnv(env), encoding: "utf8", timeout: timeoutMs }, (_error, stdout) => {
      resolve(/^__owlery_path=(.+)$/m.exec(stdout)?.[1] ?? null);
    }).stdin?.end();
  });
}

/**
 * The environment a broad gate's command runs with: a terminal pane's
 * (`pty.ts#terminalEnv`), without the two variables that say a terminal
 * stands, and with `path` as its `PATH`. Where `path` is null, the `PATH`
 * stays the pane's, which is the daemon's own.
 */
export function gateEnvironment(base: NodeJS.ProcessEnv, path: string | null): Record<string, string> {
  const env = terminalEnv(base);
  delete env.TERM;
  delete env.COLORTERM;
  if (path !== null) env.PATH = path;
  return env;
}

/** Whether a kept text is as long as the daemon keeps one, so the command printed that many characters or more and the text may open after the output's start. */
export function outputCut(text: string, chars = GATE_OUTPUT_CHARS): boolean {
  return text.length >= chars;
}

/** How a command's run ended. */
export interface GateEnd {
  /** The code the command exited with, or null where a signal ended it and where no process started. */
  exitCode: number | null;
  /** The signal that ended the command, or null where it exited by itself and where no process started. */
  signal: string | null;
  /** Why no process started, or null where one did. */
  error: string | null;
  /** The last characters of what the command printed on its two streams, in the order they arrived: all of it where it printed fewer than the bound, and otherwise as many as the bound. */
  output: string;
}

/** A command that was started. */
export interface GateProcess {
  /** The id of the shell's process, which leads the command's group, or undefined where none started. */
  pid: number | undefined;
  /** Settled once the command's process has exited and its streams have closed, or the wait for them is over. It never rejects. */
  ended: Promise<GateEnd>;
  /** Signals the command's process group to end, kills the group where the command has not exited `killAfterMs` later, and settles once `ended` has. A stop of a command that has ended does nothing. */
  stop(): Promise<void>;
}

/**
 * Starts one command as a check on another machine starts it: the whole
 * line is handed to `/bin/sh -c`, in `cwd`, with no terminal. The input is
 * the null device, so a read of it ends at once, and the two output streams
 * are pipes. The shell leads a process group of its own, so a stop reaches
 * what the command started in that group. A process that left the group is
 * not reached, and neither is one that outlives the shell after the shell
 * has exited: the group's id may then name another's processes
 * (`adapters/claude.ts`, the stop of a role session's run).
 */
export function startGate(options: { command: string; cwd: string; env: Record<string, string>; outputChars?: number; killAfterMs?: number }): GateProcess {
  const bound = options.outputChars ?? GATE_OUTPUT_CHARS;
  let output = "";
  const child = spawn("/bin/sh", ["-c", options.command], { cwd: options.cwd, env: options.env, stdio: ["ignore", "pipe", "pipe"], detached: true });
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (text: string) => {
      output = (output + text).slice(-bound);
    });
  }
  let exited = false;
  let settled = false;
  let grace: NodeJS.Timeout | undefined;
  let settle: (end: GateEnd) => void = () => {};
  const ended = new Promise<GateEnd>((resolve) => {
    settle = resolve;
  });
  const finish = (end: Omit<GateEnd, "output">): void => {
    if (settled) return;
    settled = true;
    clearTimeout(grace);
    // Nothing follows the end. A process the command started may still hold the streams, and what it prints is not the run's.
    child.stdout.destroy();
    child.stderr.destroy();
    settle({ ...end, output });
  };
  // A command whose folder is gone, or that the system refuses to start, has no exit.
  child.once("error", (error) => {
    exited = true;
    finish({ exitCode: null, signal: null, error: error.message });
  });
  child.once("exit", (code, signal) => {
    exited = true;
    grace = setTimeout(() => finish({ exitCode: code, signal, error: null }), STREAMS_GRACE_MS);
  });
  // `close` follows the last of the output, unless a process the command started holds the streams past the grace.
  child.once("close", (code, signal) => finish({ exitCode: code, signal, error: null }));
  const signal = (name: NodeJS.Signals): void => {
    if (exited || child.pid === undefined) return;
    try {
      // The negative id names the group the shell leads.
      process.kill(-child.pid, name);
    } catch {
      // The group is gone already.
    }
  };
  let stopping: Promise<void> | undefined;
  const stop = (): Promise<void> =>
    (stopping ??= (async () => {
      signal("SIGTERM");
      const kill = setTimeout(() => signal("SIGKILL"), options.killAfterMs ?? GATE_KILL_AFTER_MS);
      await ended;
      clearTimeout(kill);
    })());
  return { pid: child.pid, ended, stop };
}
