import { spawn } from "node:child_process";
import { fstatSync, openSync, readFileSync } from "node:fs";
import { join } from "node:path";
import WebSocket from "ws";
import { type Discovery, readDiscovery } from "../daemon/discovery";

/** Whether a daemon answers at this address with this token. */
export function answers(discovery: Discovery, timeoutMs = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new WebSocket(`ws://127.0.0.1:${discovery.port}`);
    const done = (ok: boolean) => {
      clearTimeout(timer);
      socket.terminate();
      resolve(ok);
    };
    const timer = setTimeout(() => done(false), timeoutMs);
    socket.on("open", () => socket.send(JSON.stringify({ type: "hello", token: discovery.token })));
    socket.on("message", (raw) => done((JSON.parse(String(raw)) as { type?: string }).type === "ready"));
    socket.on("error", () => done(false));
    socket.on("close", () => done(false));
  });
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
