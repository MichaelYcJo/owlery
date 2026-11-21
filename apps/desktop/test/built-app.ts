// Builds the app from the tree, starts it with the binary the suite runs in,
// and speaks to its window through Electron's debugging port. A case that
// reads the window as a person sees it starts here, and so does one that
// reads what the main process holds, through that process's inspector.
import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WINDOW_SIZE } from "../src/main/window-size";

const APP_DIR = join(__dirname, "..");

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Builds `dist/` from the tree as it stands, so a case never reads a stale build. */
export function buildApp(): void {
  // The suite's binary is Electron, which runs the build script as Node while the variable is set.
  execFileSync(process.execPath, ["build.mjs"], { cwd: APP_DIR, env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }, stdio: "pipe" });
}

/** A port the system gave as free at this moment, so two worktrees that run the suite at once do not meet on one. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => (address && typeof address === "object" ? resolve(address.port) : reject(new Error("the system gave no port"))));
    });
  });
}

/** True while a process with this id exists. */
export function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // Another user's process answers EPERM, and is there.
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** Waits until none of the processes is left, `ms` at most, and returns the ones still there. */
export async function untilGone(pids: readonly number[], ms: number): Promise<number[]> {
  const deadline = Date.now() + ms;
  while (pids.some(alive) && Date.now() < deadline) await sleep(50);
  return pids.filter(alive);
}

/** True while the process runs. One that ended and that its parent has not read yet is listed by the system and does not run. */
function running(pid: number): boolean {
  try {
    return !execFileSync("ps", ["-o", "stat=", "-p", String(pid)], { encoding: "utf8" }).trim().startsWith("Z");
  } catch {
    // `ps` exits 1 where no process has the id.
    return false;
  }
}

/**
 * Asks the processes to end and waits `ms` at most, without giving the event
 * loop a turn, so a handler of a signal can call it before the process exits.
 * It kills the ones still running then, and answers with them.
 */
export function endNow(pids: readonly number[], ms: number): number[] {
  const signal = (pid: number, name: NodeJS.Signals): void => {
    try {
      process.kill(pid, name);
    } catch {
      // It ended before the signal.
    }
  };
  for (const pid of pids) signal(pid, "SIGTERM");
  const deadline = Date.now() + ms;
  const pause = new Int32Array(new SharedArrayBuffer(4));
  while (pids.some(running) && Date.now() < deadline) Atomics.wait(pause, 0, 0, 50);
  const left = pids.filter(running);
  for (const pid of left) signal(pid, "SIGKILL");
  return left;
}

interface Pending {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

/** One session of a debugging port: of the window's page, or of the main process's inspector. */
class DebugSession {
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();

  private constructor(private readonly socket: WebSocket) {
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as { id?: number; result?: unknown; error?: unknown };
      const waiting = message.id === undefined ? undefined : this.pending.get(message.id);
      if (!waiting || message.id === undefined) return;
      this.pending.delete(message.id);
      if (message.error) waiting.reject(new Error(JSON.stringify(message.error)));
      else waiting.resolve(message.result);
    });
  }

  /** Opens the session at the address a debugging port listed. */
  static async open(address: string): Promise<DebugSession> {
    const socket = new WebSocket(address);
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener("error", () => reject(new Error("the debugging port refused the session")), { once: true });
    });
    return new DebugSession(socket);
  }

  /** One call, answered with its result. */
  call<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve: resolve as (result: unknown) => void, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  /** The value of an expression. A promise is awaited. */
  async evaluate<T>(expression: string): Promise<T> {
    const answer = await this.call<{ result: { value: T }; exceptionDetails?: unknown }>("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (answer.exceptionDetails) throw new Error(`${expression}: ${JSON.stringify(answer.exceptionDetails)}`);
    return answer.result.value;
  }

  close(): void {
    this.socket.close();
  }
}

/** What a debugging port lists: a page, or the main process. */
interface Target {
  type: string;
  url: string;
  webSocketDebuggerUrl: string;
}

/** The built app, running with a user data folder of its own, and a session of its window's debugging port. */
export class BuiltApp {
  private stopped: Promise<number[]> | undefined;
  private focused = false;

  private constructor(
    private readonly child: ChildProcess,
    private readonly page: DebugSession,
    /** The session of the main process's inspector, where the start opened it. */
    private readonly main: DebugSession | undefined,
    /** The window's debugging port. */
    private readonly port: number,
    /** The folder `--user-data-dir` names. The daemon's run folder is `run` under it. */
    readonly userData: string,
  ) {}

  /**
   * Starts the app built in `dist/` and waits for its window's page. `env`
   * is added to the suite's own environment. The user data folder is a new
   * one under the system's temporary folder, so nothing is read from or
   * written to the person's own. The app starts in the background, with
   * `OWLERY_BACKGROUND` set to `1`, so its window takes neither the system's
   * focus nor the person's keyboard. A caller that opens the app for a person
   * to type in passes `keepBackground`, and the variable stays as the
   * caller's own environment has it. A caller that reads what the main
   * process holds, such as the menu Electron built, passes `inspectMain`,
   * and the app starts with the main process's inspector open on a port of
   * its own, for `evaluateMain`. An app started in the background has its
   * window at the size the app makes it at (src/main/window-size.ts) on any
   * screen, and the start fails where its page has another size: the cases
   * read the screens as they are drawn at that size.
   */
  static async start(env: Record<string, string>, { keepBackground = false, inspectMain = false } = {}): Promise<BuiltApp> {
    const userData = realpathSync(mkdtempSync(join(tmpdir(), "owlery-app-")));
    const port = await freePort();
    const mainPort = inspectMain ? await freePort() : undefined;
    const appEnv: NodeJS.ProcessEnv = { ...process.env, ...env };
    // Without the variable the suite's binary starts as the app.
    delete appEnv.ELECTRON_RUN_AS_NODE;
    if (!keepBackground) appEnv.OWLERY_BACKGROUND = "1";
    // The inspector's switch is the binary's own, so it stands before the app's folder.
    const args = [...(mainPort === undefined ? [] : [`--inspect=${mainPort}`]), APP_DIR, `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`];
    const child = spawn(process.execPath, args, { env: appEnv, stdio: "ignore" });
    try {
      const page = await DebugSession.open((await listed(port, (target) => target.type === "page", "the app opened no window")).webSocketDebuggerUrl);
      const main = mainPort === undefined ? undefined : await DebugSession.open((await listed(mainPort, () => true, "the main process opened no inspector")).webSocketDebuggerUrl);
      const started = new BuiltApp(child, page, main, port, userData);
      started.focused = await started.evaluate<boolean>("document.hasFocus()");
      if (!keepBackground) {
        const size = await started.evaluate<[number, number]>("[window.innerWidth, window.innerHeight]");
        if (size[0] !== WINDOW_SIZE.width || size[1] !== WINDOW_SIZE.height) throw new Error(`the window's page is ${size.join(" by ")} and not ${WINDOW_SIZE.width} by ${WINDOW_SIZE.height}`);
      }
      return started;
    } catch (error) {
      child.kill("SIGTERM");
      if (child.pid !== undefined) for (const pid of await untilGone([child.pid], 10_000)) process.kill(pid, "SIGKILL");
      rmSync(userData, { recursive: true, force: true });
      throw error;
    }
  }

  /** What `document.hasFocus()` answered when the session opened, before anything emulated the focus. */
  get focusedAtStart(): boolean {
    return this.focused;
  }

  /** The app's process id. */
  get pid(): number {
    return this.child.pid as number;
  }

  /** One call of the debugging port, answered with its result. */
  cdp<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    return this.page.call<T>(method, params);
  }

  /** The value of an expression in the window's page. A promise is awaited. */
  evaluate<T>(expression: string): Promise<T> {
    return this.page.evaluate<T>(expression);
  }

  /**
   * The value of an expression in the main process, where the app started
   * with `inspectMain`. `electron` is in scope: the module the main process
   * itself requires. A promise is awaited.
   */
  evaluateMain<T>(expression: string): Promise<T> {
    if (!this.main) throw new Error("the app started without the main process's inspector");
    return this.main.evaluate<T>(`(() => { const electron = (typeof require === "function" ? require : process.mainModule.require)("electron"); return (${expression}); })()`);
  }

  /** The URL of each page the debugging port lists: one for each window the app holds, shown or not. */
  async pages(): Promise<string[]> {
    const targets = (await (await fetch(`http://127.0.0.1:${this.port}/json/list`)).json()) as Target[];
    return targets.filter((target) => target.type === "page").map((target) => target.url);
  }

  /** Waits until an expression of the page is true, and says `what` never came where it is not within `ms`. */
  async until(expression: string, what: string, ms = 15_000): Promise<void> {
    const deadline = Date.now() + ms;
    for (;;) {
      if (await this.evaluate<boolean>(`Boolean(${expression})`)) return;
      if (Date.now() >= deadline) throw new Error(`the window never showed ${what}; TMP-DIAG ${await this.diag()}`);
      await sleep(100);
    }
  }

  /** TMP-DIAG: the page's visibility, focus, and whether it draws a frame within a second. */
  async diag(): Promise<string> {
    return JSON.stringify(await this.evaluate(`(async () => { const t0 = performance.now(); const frame = await Promise.race([new Promise((r) => requestAnimationFrame(() => r(Math.round(performance.now() - t0)))), new Promise((r) => setTimeout(() => r("none in 1 s"), 1000))]); return { visibility: document.visibilityState, focus: document.hasFocus(), frame, size: [innerWidth, innerHeight] }; })()`));
  }

  /** A click of the mouse in the middle of the element a selector finds, as a person's click arrives. */
  async click(selector: string): Promise<void> {
    const at = await this.evaluate<{ x: number; y: number }>(
      `(() => { const box = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`,
    );
    await this.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", clickCount: 1 });
    await this.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", clickCount: 1 });
  }

  /**
   * The process id of the app's daemon, as `run/daemon.json` names it at this
   * call, or nothing where the folder holds no such file: before the daemon
   * wrote it, and after a daemon that stopped removed it. The file is read
   * at each call and no id is kept, so after a restart of the daemon this is
   * the new daemon's id, and `stop` never signals the id of one that ended.
   */
  daemonPid(): number | undefined {
    try {
      const pid = (JSON.parse(readFileSync(join(this.userData, "run", "daemon.json"), "utf8")) as { pid?: unknown }).pid;
      if (typeof pid === "number") return pid;
    } catch {
      // The run folder holds no daemon's file.
    }
    return undefined;
  }

  /**
   * Closes the session of the main process's inspector, for a case that has
   * the app quit: a process whose inspector holds a session waits at its end
   * until that session closes. `evaluateMain` is not to be called after it.
   */
  leaveMain(): void {
    this.main?.close();
  }

  /**
   * Stops the app and the daemon its run folder names at this call, each by
   * its process id, and removes the user data folder. The daemon outlives
   * the app while a pane's process runs, so it is stopped here. It answers with the process ids that
   * were still there ten seconds after they were asked to end, which it then
   * kills. A second call answers what the first did.
   */
  stop(): Promise<number[]> {
    this.stopped ??= this.end();
    return this.stopped;
  }

  /**
   * Stops the app and the daemon and removes the user data folder before it
   * returns, for a run that a signal ends: `stop` needs turns of the event
   * loop that such a run does not get.
   */
  stopNow(): void {
    endNow(
      [this.child.pid, this.daemonPid()].filter((pid): pid is number => pid !== undefined),
      10_000,
    );
    rmSync(this.userData, { recursive: true, force: true });
  }

  private async end(): Promise<number[]> {
    this.page.close();
    this.main?.close();
    const pids = [this.child.pid, this.daemonPid()].filter((pid): pid is number => pid !== undefined);
    for (const pid of pids) if (alive(pid)) process.kill(pid, "SIGTERM");
    const left = await untilGone(pids, 10_000);
    for (const pid of left) process.kill(pid, "SIGKILL");
    await untilGone(left, 5_000);
    rmSync(this.userData, { recursive: true, force: true });
    return left;
  }
}

/** The first target a debugging port lists that `wanted` takes, once the app has opened it. It fails with `missing` where none came in thirty seconds. */
async function listed(port: number, wanted: (target: Target) => boolean, missing: string): Promise<Target> {
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      const targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as Target[];
      const target = targets.find(wanted);
      if (target) return target;
    } catch {
      // The app is not listening yet.
    }
    if (Date.now() >= deadline) throw new Error(missing);
    await sleep(200);
  }
}
