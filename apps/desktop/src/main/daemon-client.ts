import { spawn } from "node:child_process";
import { fstatSync, openSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildOf, type Discovery, readDiscovery, readyOf } from "../daemon/discovery";

/** Whether a daemon answers at this address with this token. */
export async function answers(discovery: Discovery, timeoutMs = 1000): Promise<boolean> {
  return (await readyOf(discovery, timeoutMs)) !== undefined;
}

const isObject = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === "object" && value !== null;

/**
 * Whether a daemon's `ready` shows that it runs nothing: its `sessions`
 * hold no pane that is alive, its `headless` no session but one that
 * finished or failed, and its `workItems` no chain that runs. It mirrors
 * `Daemon#checkIdle` of src/daemon/daemon.ts, the daemon's own idle exit,
 * over the three lists of a `ready`, which a daemon of 0.0.2 already sends,
 * and counts a queued headless session as one that runs, since it starts
 * without anyone asking. A kind of work added to `checkIdle` is to be read
 * here too, or a load replaces the daemon under it.
 *
 * It is false where a list is missing or no list, and where an entry is
 * not of the shape it reads: a daemon whose lists it cannot read is kept.
 */
export function runsNothing(ready: Readonly<Record<string, unknown>>): boolean {
  const { sessions, headless, workItems } = ready;
  if (!Array.isArray(sessions) || !Array.isArray(headless) || !Array.isArray(workItems)) return false;
  return (
    sessions.every((session) => isObject(session) && session.alive === false) &&
    headless.every((session) => isObject(session) && (session.state === "finished" || session.state === "failed")) &&
    workItems.every((item) => isObject(item) && (item.chain === null || (isObject(item.chain) && typeof item.chain.state === "string" && item.chain.state !== "running")))
  );
}

/**
 * The daemon a load of the window attaches to. Where the daemon the run
 * folder's `daemon.json` names answers, is of another build than
 * `daemonScript` (`otherBuild`) and runs nothing (`runsNothing`), it stops
 * that daemon as "Restart Daemon…" does (`stopDaemon`) and starts the
 * script's, without a question, and gives the daemon it started. Every
 * other daemon that answers it gives as it is, and where none answers it
 * starts one (`ensureDaemon`).
 *
 * `replaced` holds the builds this run of the app has replaced a daemon of,
 * with no build standing for every daemon whose `daemon.json` holds none,
 * and the caller keeps it for as long as the app runs. A daemon of a build
 * it holds is kept: another app of that build runs on the same run folder,
 * and the two would otherwise replace each other's daemon at each load
 * without end. A build is added as its stop begins, so a daemon that
 * outlived its stop is not signalled again at the next load.
 *
 * Rejects with the stop's sentence where the stop fails, and starts
 * nothing then, and with `ensureDaemon`'s where the start fails.
 */
export async function daemonForLoad(runDir: string, daemonScript: string, replaced: Set<string | undefined>, { startMs, stopMs }: { startMs?: number; stopMs?: number } = {}): Promise<Discovery> {
  const running = readDiscovery(runDir);
  // Only a daemon of another build that this run has not replaced is asked for its lists: a hello has the daemon read git again and hold its `ready` until that read ends, and `ensureDaemon` says its own.
  if (running && otherBuild(running, daemonScript) && !replaced.has(running.build)) {
    const ready = await readyOf(running);
    if (ready && runsNothing(ready)) {
      replaced.add(running.build);
      await stopDaemon(runDir, stopMs);
    }
  }
  return ensureDaemon(runDir, daemonScript, startMs);
}

/** The last line that is not empty of what a start wrote to the log, which held `from` bytes before it. */
function lastLine(logFile: string, from: number): string | undefined {
  const written = readFileSync(logFile).subarray(from).toString("utf8");
  return written
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .pop();
}

/**
 * Finds the running daemon, or starts one. The daemon runs on Electron's own
 * Node, detached, so it keeps the sessions when the app quits.
 *
 * Rejects as soon as the process it started has exited without answering, with
 * the last line that process logged, and after `timeoutMs` where the process
 * lives and does not answer. The window shows the rejection's message as it is.
 */
export async function ensureDaemon(runDir: string, daemonScript: string, timeoutMs = 10_000): Promise<Discovery> {
  const running = readDiscovery(runDir);
  if (running && (await answers(running))) return running;

  const logFile = join(runDir, "daemon.log");
  const log = openSync(logFile, "a", 0o600);
  // The log is appended at every start; what this start writes begins here.
  const logged = fstatSync(log).size;
  const child = spawn(process.execPath, [daemonScript], {
    detached: true,
    stdio: ["ignore", log, log],
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", OWLERY_RUN_DIR: runDir },
  });
  let ended: string | undefined;
  child.once("exit", (code, signal) => {
    ended = code === null ? `signal ${signal}` : `exit code ${code}`;
  });
  child.unref();

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = readDiscovery(runDir);
    if (found && found.pid === child.pid && (await answers(found))) return found;
    if (ended) {
      const line = lastLine(logFile, logged);
      throw new Error(`the daemon did not start${line ? `: ${line}` : ""} (${ended}); see ${logFile}`);
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`the daemon did not start; see ${logFile}`);
}

/**
 * Whether the daemon the app found is of another build than the script the
 * app would start: its `daemon.json` holds no build, as a daemon of an
 * earlier build and one that could not read its script leave it, or one
 * that differs from that script's.
 */
export function otherBuild(found: Discovery, daemonScript: string): boolean {
  return found.build === undefined || found.build !== buildOf(daemonScript);
}

/** True while a process with this id exists. One of another user is there, and answers EPERM. */
function exists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

/**
 * Stops the daemon of this run folder, and no other process. It reads the
 * folder's `daemon.json` and asks whether a daemon answers at that file's
 * address with that file's token. Only where one does, it sends SIGTERM to
 * the process the file names, at which a daemon of any build removes its
 * file, ends its sessions and exits, and waits until that process is gone.
 * Where no file stands or nothing answers, it signals nothing and is done.
 *
 * Rejects where the process is still there after `timeoutMs`, with a
 * sentence the window shows as it is. It signals nothing else then: no
 * daemon answers any more that could say the id is still the daemon's.
 */
export async function stopDaemon(runDir: string, timeoutMs = 5000): Promise<void> {
  const named = readDiscovery(runDir);
  if (!named || !(await answers(named))) return;
  try {
    process.kill(named.pid, "SIGTERM");
  } catch {
    // It ended between its answer and the signal.
  }
  const deadline = Date.now() + timeoutMs;
  while (exists(named.pid)) {
    if (Date.now() >= deadline) throw new Error(`Owlery's background process did not stop. It is process ${named.pid}.`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
