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
