import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildOf, readDiscovery } from "../src/daemon/discovery";
import { daemonForLoad, ensureDaemon, otherBuild, runsNothing, stopDaemon } from "../src/main/daemon-client";
import { alive } from "./built-app";

const dirs: string[] = [];
const pids: number[] = [];
function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "owlery-daemon-client-"));
  dirs.push(dir);
  return dir;
}
/** Writes a script that stands in for the daemon's, and returns its path. */
function script(dir: string, body: string, name = "daemon.cjs"): string {
  const file = join(dir, name);
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
         const discovery = { port: server.address().port, token: "t", pid: process.pid, build: "0a1b" };
         writeFileSync(join(process.env.OWLERY_RUN_DIR, "daemon.json"), JSON.stringify(discovery));
       });
       server.on("connection", (socket) => socket.on("message", () => socket.send(JSON.stringify({ type: "ready" }))));`,
    );
    const found = await ensureDaemon(dir, daemon);
    pids.push(found.pid);
    expect(found.token).toBe("t");
    expect(found.build).toBe("0a1b");
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

/**
 * Starts a script the case wrote, on the suite's own binary as Node, with
 * `dir` as its run folder, and waits until it wrote `wrote` there. Its
 * process id is noted, so the case's end kills it where it is still there.
 */
async function started(dir: string, file: string, wrote: string): Promise<number> {
  const child = spawn(process.execPath, [file], { env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", OWLERY_RUN_DIR: dir }, stdio: "ignore" });
  const pid = child.pid as number;
  pids.push(pid);
  const deadline = Date.now() + 10_000;
  while (!existsSync(join(dir, wrote))) {
    if (Date.now() >= deadline) throw new Error(`the script did not write ${wrote}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return pid;
}

/**
 * A script that stands in for the daemon: it answers `ready` to a hello that
 * carries `token` and closes the socket of any other, and writes its port
 * into the file `port` of its run folder once it listens. `atSigterm` is
 * what it does at SIGTERM, and without it the signal ends it. `lists` are
 * the fields its `ready` carries beside the type.
 */
function standIn(dir: string, token: string, atSigterm?: string, lists: object = {}): string {
  const ws = createRequire(import.meta.url).resolve("ws");
  return script(
    dir,
    `const { WebSocketServer } = require(${JSON.stringify(ws)});
     const { renameSync, writeFileSync } = require("node:fs");
     const { join } = require("node:path");
     ${atSigterm === undefined ? "" : `process.on("SIGTERM", () => { ${atSigterm} });`}
     // Written whole, by a rename: the case reads the file as soon as it stands.
     const server = new WebSocketServer({ host: "127.0.0.1", port: 0 }, () => {
       writeFileSync(join(process.env.OWLERY_RUN_DIR, "port.part"), String(server.address().port));
       renameSync(join(process.env.OWLERY_RUN_DIR, "port.part"), join(process.env.OWLERY_RUN_DIR, "port"));
     });
     server.on("connection", (socket) => socket.on("message", (raw) => {
       if (JSON.parse(String(raw)).token === ${JSON.stringify(token)}) socket.send(JSON.stringify({ ...${JSON.stringify(lists)}, type: "ready" }));
       else socket.close();
     }));`,
  );
}

/** Starts a stand-in daemon in `dir`, and gives its process id and its port. It writes no `daemon.json`: the case does. */
async function standingIn(dir: string, token: string, atSigterm?: string, lists?: object): Promise<{ pid: number; port: number }> {
  const pid = await started(dir, standIn(dir, token, atSigterm, lists), "port");
  return { pid, port: Number(readFileSync(join(dir, "port"), "utf8")) };
}

/** A port nothing listens on: the system gave it as free, and the listener that took it is closed. */
function deadPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });
}

function names(dir: string, discovery: { port: number; token: string; pid: number; build?: string }): void {
  writeFileSync(join(dir, "daemon.json"), JSON.stringify(discovery));
}

describe("otherBuild", () => {
  // The SHA-256 of the bytes `abc`, which the script below holds.
  const ABC = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

  it("is false where the daemon's daemon.json holds the build of the script the app would start", () => {
    const dir = scratch();
    expect(otherBuild({ port: 1, token: "t", pid: 2, build: ABC }, script(dir, "abc"))).toBe(false);
  });

  it("is true where the daemon's daemon.json holds no build, as a daemon of an earlier build leaves it, or one that differs", () => {
    const dir = scratch();
    const file = script(dir, "abc");
    expect(otherBuild({ port: 1, token: "t", pid: 2 }, file)).toBe(true);
    expect(otherBuild({ port: 1, token: "t", pid: 2, build: ABC.replace("ba", "ab") }, file)).toBe(true);
    // Neither side could read its script: nothing says the two are one build.
    expect(otherBuild({ port: 1, token: "t", pid: 2 }, join(dir, "no-such.cjs"))).toBe(true);
  });
});

describe("stopDaemon", () => {
  it("ends the process the run folder's daemon.json names, where a daemon answers at the file's address with the file's token", async () => {
    const dir = scratch();
    const { pid, port } = await standingIn(dir, "t");
    names(dir, { port, token: "t", pid });
    await stopDaemon(dir);
    expect(alive(pid)).toBe(false);
  }, WAIT);

  it("signals nobody where nothing answers at the file's address: the process the file names lives on", async () => {
    const dir = scratch();
    const pid = await started(dir, script(dir, `require("node:fs").writeFileSync(require("node:path").join(process.env.OWLERY_RUN_DIR, "up"), ""); setTimeout(() => {}, 30000);`), "up");
    names(dir, { port: await deadPort(), token: "t", pid });
    await stopDaemon(dir);
    // A signal that was sent has ended the process by now: the stop waits for the process it signalled.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(alive(pid)).toBe(true);
  }, WAIT);

  it("is done at once where the run folder holds no daemon.json", async () => {
    await expect(stopDaemon(scratch())).resolves.toBeUndefined();
  });

  it("signals nobody where the daemon at the file's address does not answer the file's token", async () => {
    const dir = scratch();
    const { pid, port } = await standingIn(dir, "its own");
    names(dir, { port, token: "another", pid });
    await stopDaemon(dir);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(alive(pid)).toBe(true);
  }, WAIT);

  it("fails with the process's id where the daemon outlives the wait, and signals nothing else", async () => {
    const dir = scratch();
    // The stand-in notes each SIGTERM it was sent, and stays.
    const { pid, port } = await standingIn(dir, "t", `require("node:fs").appendFileSync(require("node:path").join(process.env.OWLERY_RUN_DIR, "signals"), "t");`);
    names(dir, { port, token: "t", pid });
    const started = Date.now();
    await expect(stopDaemon(dir, 400)).rejects.toThrow(new Error(`Owlery's background process did not stop. It is process ${pid}.`));
    expect(Date.now() - started).toBeGreaterThanOrEqual(400);
    expect(alive(pid)).toBe(true);
    expect(readFileSync(join(dir, "signals"), "utf8")).toBe("t");
  }, WAIT);
});

/** What a daemon that runs nothing lists in its `ready`: a pane that ended, which keeps its last state, headless sessions that ended, and chains that do not run. */
const IDLE = {
  sessions: [{ id: 1, alive: false, state: "working" }],
  headless: [
    { id: 1, state: "finished" },
    { id: 2, state: "failed" },
  ],
  workItems: [
    { id: 1, chain: null },
    { id: 2, chain: { state: "stopped" } },
    { id: 3, chain: { state: "parked" } },
    { id: 4, chain: { state: "rested" } },
  ],
};

/** What a daemon lists that runs one thing beside what `IDLE` lists, by the thing it runs. */
const RUNS: [string, object][] = [
  ["a live pane", { ...IDLE, sessions: [...IDLE.sessions, { id: 2, alive: true, state: null }] }],
  ["a working headless session", { ...IDLE, headless: [...IDLE.headless, { id: 3, state: "working" }] }],
  ["a queued headless session", { ...IDLE, headless: [...IDLE.headless, { id: 3, state: "queued" }] }],
  ["a running chain", { ...IDLE, workItems: [...IDLE.workItems, { id: 5, chain: { state: "running" } }] }],
];

describe("runsNothing", () => {
  it("is true of lists that hold no live pane, no headless session but one that finished or failed, and no running chain, and of empty lists", () => {
    expect(runsNothing({ type: "ready", ...IDLE })).toBe(true);
    expect(runsNothing({ type: "ready", sessions: [], headless: [], workItems: [] })).toBe(true);
  });

  it.each(RUNS)("is false of lists that hold %s", (_what, lists) => {
    expect(runsNothing({ type: "ready", ...lists })).toBe(false);
  });

  it("is false where one of the three lists is missing or no list, as a daemon of a build before the repositories sends them", () => {
    expect(runsNothing({ type: "ready" })).toBe(false);
    expect(runsNothing({ type: "ready", ...IDLE, sessions: undefined })).toBe(false);
    expect(runsNothing({ type: "ready", ...IDLE, headless: {} })).toBe(false);
    expect(runsNothing({ type: "ready", ...IDLE, workItems: "none" })).toBe(false);
  });

  it("counts an entry that is not of the shape it reads as one that runs", () => {
    for (const sessions of [[{ id: 1 }], [{ id: 1, alive: "no" }], [null]]) expect(runsNothing({ type: "ready", ...IDLE, sessions }), JSON.stringify(sessions)).toBe(false);
    for (const headless of [[{ id: 1 }], [7]]) expect(runsNothing({ type: "ready", ...IDLE, headless }), JSON.stringify(headless)).toBe(false);
    for (const workItems of [[{ id: 1 }], [{ id: 1, chain: {} }], [{ id: 1, chain: "stopped" }], ["work"]]) expect(runsNothing({ type: "ready", ...IDLE, workItems }), JSON.stringify(workItems)).toBe(false);
  });
});

/**
 * The script the app would start, in a stand-in: it notes that it started,
 * writes the run folder's `daemon.json` with its own build, the SHA-256 of
 * its bytes, once it listens, and answers any hello with lists that hold
 * nothing.
 */
function thisBuild(dir: string): string {
  const ws = createRequire(import.meta.url).resolve("ws");
  return script(
    dir,
    `const { WebSocketServer } = require(${JSON.stringify(ws)});
     const { createHash } = require("node:crypto");
     const { readFileSync, writeFileSync } = require("node:fs");
     const { join } = require("node:path");
     writeFileSync(join(process.env.OWLERY_RUN_DIR, "this-build-started"), "");
     const server = new WebSocketServer({ host: "127.0.0.1", port: 0 }, () => {
       const build = createHash("sha256").update(readFileSync(__filename)).digest("hex");
       writeFileSync(join(process.env.OWLERY_RUN_DIR, "daemon.json"), JSON.stringify({ port: server.address().port, token: "this", pid: process.pid, build }));
     });
     server.on("connection", (socket) => socket.on("message", () => socket.send(JSON.stringify({ type: "ready", sessions: [], headless: [], workItems: [] }))));`,
    "this-build.cjs",
  );
}

/** What a stand-in that stays at SIGTERM does: it notes the signal in the file `signals` of its run folder. */
const NOTES_SIGTERM = `require("node:fs").appendFileSync(require("node:path").join(process.env.OWLERY_RUN_DIR, "signals"), "t");`;

describe("daemonForLoad", () => {
  it("replaces a daemon of another build whose lists show it runs nothing: it ends it, starts the script, and gives the daemon it started, which is of the script's build", async () => {
    const dir = scratch();
    const earlier = await standingIn(dir, "earlier", undefined, IDLE);
    names(dir, { port: earlier.port, token: "earlier", pid: earlier.pid });
    const app = thisBuild(dir);
    const found = await daemonForLoad(dir, app, new Set());
    pids.push(found.pid);
    expect(alive(earlier.pid)).toBe(false);
    expect(found.pid).not.toBe(earlier.pid);
    expect(found.token).toBe("this");
    expect(otherBuild(found, app)).toBe(false);
    expect(readDiscovery(dir)).toEqual(found);
  }, WAIT);

  it("keeps a daemon of the script's own build that runs nothing, signals it nothing, starts nothing, and gives it", async () => {
    const dir = scratch();
    const app = thisBuild(dir);
    const own = await standingIn(dir, "own", NOTES_SIGTERM, IDLE);
    names(dir, { port: own.port, token: "own", pid: own.pid, build: buildOf(app) });
    expect(await daemonForLoad(dir, app, new Set())).toEqual({ port: own.port, token: "own", pid: own.pid, build: buildOf(app) });
    expect(alive(own.pid)).toBe(true);
    expect(existsSync(join(dir, "signals"))).toBe(false);
    expect(existsSync(join(dir, "this-build-started"))).toBe(false);
  }, WAIT);

  it.each([...RUNS, ["no lists", {}] as [string, object]])("keeps a daemon of another build whose ready holds %s, signals it nothing, starts nothing, and gives it", async (_what, lists) => {
    const dir = scratch();
    const kept = await standingIn(dir, "kept", NOTES_SIGTERM, lists);
    names(dir, { port: kept.port, token: "kept", pid: kept.pid });
    expect(await daemonForLoad(dir, thisBuild(dir), new Set())).toEqual({ port: kept.port, token: "kept", pid: kept.pid });
    expect(alive(kept.pid)).toBe(true);
    expect(existsSync(join(dir, "signals"))).toBe(false);
    expect(existsSync(join(dir, "this-build-started"))).toBe(false);
  }, WAIT);

  it.each([
    ["of one build", "0a1b"],
    ["whose daemon.json holds no build", undefined],
  ])("replaces a daemon %s once: a second daemon of that build that runs nothing is kept and signalled nothing, as another app of that build on the run folder would leave it", async (_what, build) => {
    const dir = scratch();
    const replaced = new Set<string | undefined>();
    const first = await standingIn(dir, "first", undefined, IDLE);
    names(dir, { port: first.port, token: "first", pid: first.pid, build });
    pids.push((await daemonForLoad(dir, thisBuild(dir), replaced)).pid);
    expect(alive(first.pid)).toBe(false);

    // The second runs in a folder of its own, so its files stand apart from the first's.
    const own = scratch();
    const second = await standingIn(own, "second", NOTES_SIGTERM, IDLE);
    names(dir, { port: second.port, token: "second", pid: second.pid, build });
    expect(await daemonForLoad(dir, thisBuild(dir), replaced)).toEqual({ port: second.port, token: "second", pid: second.pid, ...(build === undefined ? {} : { build }) });
    expect(alive(second.pid)).toBe(true);
    expect(existsSync(join(own, "signals"))).toBe(false);
  }, WAIT);

  it("starts nothing where the stop of a daemon it replaces fails, and rejects with the stop's sentence", async () => {
    const dir = scratch();
    const stays = await standingIn(dir, "stays", NOTES_SIGTERM, IDLE);
    names(dir, { port: stays.port, token: "stays", pid: stays.pid });
    await expect(daemonForLoad(dir, thisBuild(dir), new Set(), { stopMs: 400 })).rejects.toThrow(new Error(`Owlery's background process did not stop. It is process ${stays.pid}.`));
    expect(readFileSync(join(dir, "signals"), "utf8")).toBe("t");
    expect(existsSync(join(dir, "this-build-started"))).toBe(false);
    expect(readDiscovery(dir)?.pid).toBe(stays.pid);
  }, WAIT);
});
