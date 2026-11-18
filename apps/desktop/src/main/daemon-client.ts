import { spawn } from "node:child_process";
import { openSync } from "node:fs";
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

/**
 * Finds the running daemon, or starts one. The daemon runs on Electron's own
 * Node, detached, so it keeps the sessions when the app quits.
 */
export async function ensureDaemon(runDir: string, daemonScript: string): Promise<Discovery> {
  const running = readDiscovery(runDir);
  if (running && (await answers(running))) return running;

  const log = openSync(join(runDir, "daemon.log"), "a", 0o600);
  const child = spawn(process.execPath, [daemonScript], {
    detached: true,
    stdio: ["ignore", log, log],
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", OWLERY_RUN_DIR: runDir },
  });
  child.unref();

  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const found = readDiscovery(runDir);
    if (found && found.pid === child.pid && (await answers(found))) return found;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`the daemon did not start; see ${join(runDir, "daemon.log")}`);
}
