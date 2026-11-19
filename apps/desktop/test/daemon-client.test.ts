import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ensureDaemon } from "../src/main/daemon-client";

const dirs: string[] = [];
const pids: number[] = [];
function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "owlery-daemon-client-"));
  dirs.push(dir);
  return dir;
}
/** Writes a script that stands in for the daemon's, and returns its path. */
function script(dir: string, body: string): string {
  const file = join(dir, "daemon.cjs");
  writeFileSync(file, body);
  return file;
}
afterEach(() => {
  for (const pid of pids.splice(0)) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // It already ended.
    }
  }
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** Calls `ensureDaemon`, and gives what it rejected with and how long it took. */
async function refusal(runDir: string, daemonScript: string, timeoutMs?: number): Promise<{ message: string; ms: number }> {
  const started = Date.now();
  try {
    await ensureDaemon(runDir, daemonScript, timeoutMs);
  } catch (error) {
    return { message: (error as Error).message, ms: Date.now() - started };
  }
  throw new Error("ensureDaemon resolved");
}

// Longer than the 10 seconds `ensureDaemon` waits by default, so a case that waits them out fails on what it expects.
const WAIT = 15_000;

describe("ensureDaemon", () => {
  it("gives the discovery of the daemon it started", async () => {
    const dir = scratch();
    const ws = createRequire(import.meta.url).resolve("ws");
    const daemon = script(
      dir,
      `const { WebSocketServer } = require(${JSON.stringify(ws)});
       const { writeFileSync } = require("node:fs");
       const { join } = require("node:path");
       const server = new WebSocketServer({ host: "127.0.0.1", port: 0 }, () => {
         const discovery = { port: server.address().port, token: "t", pid: process.pid };
         writeFileSync(join(process.env.OWLERY_RUN_DIR, "daemon.json"), JSON.stringify(discovery));
       });
       server.on("connection", (socket) => socket.on("message", () => socket.send(JSON.stringify({ type: "ready" }))));`,
    );
    const found = await ensureDaemon(dir, daemon);
    pids.push(found.pid);
    expect(found.token).toBe("t");
    expect(JSON.parse(readFileSync(join(dir, "daemon.json"), "utf8"))).toEqual(found);
  });

  it("rejects at once with the daemon's last line, its exit code and the log's path where the daemon exits before it answers", async () => {
    const dir = scratch();
    const daemon = script(dir, `console.error("starting"); console.error("listen EINVAL: no socket\\n"); process.exit(3);`);
    const { message, ms } = await refusal(dir, daemon);
    expect(message).toBe(`the daemon did not start: listen EINVAL: no socket (exit code 3); see ${join(dir, "daemon.log")}`);
    expect(ms).toBeLessThan(3000);
  }, WAIT);

  it("names the exit code alone where the daemon wrote nothing in this start, whatever an earlier start left in the log", async () => {
    const dir = scratch();
    writeFileSync(join(dir, "daemon.log"), "an earlier start's line\n");
    const { message } = await refusal(dir, script(dir, `process.exit(4);`));
    expect(message).toBe(`the daemon did not start (exit code 4); see ${join(dir, "daemon.log")}`);
    expect(readFileSync(join(dir, "daemon.log"), "utf8")).toBe("an earlier start's line\n");
  }, WAIT);

  it("names the signal where one ended the daemon", async () => {
    const dir = scratch();
    const { message } = await refusal(dir, script(dir, `process.kill(process.pid, "SIGKILL"); setTimeout(() => {}, 30000);`));
    expect(message).toBe(`the daemon did not start (signal SIGKILL); see ${join(dir, "daemon.log")}`);
  }, WAIT);

  it("refuses a daemon that lives and does not answer once the wait is over, with the log's path alone", async () => {
    const dir = scratch();
    const daemon = script(
      dir,
      `require("node:fs").writeFileSync(require("node:path").join(process.env.OWLERY_RUN_DIR, "pid"), String(process.pid));
       console.error("still starting");
       setTimeout(() => {}, 30000);`,
    );
    const { message, ms } = await refusal(dir, daemon, 600);
    pids.push(Number(readFileSync(join(dir, "pid"), "utf8")));
    expect(message).toBe(`the daemon did not start; see ${join(dir, "daemon.log")}`);
    expect(ms).toBeGreaterThanOrEqual(600);
    expect(ms).toBeLessThan(3000);
  }, WAIT);
});
