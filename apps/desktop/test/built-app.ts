// Builds the app from the tree, starts it with the binary the suite runs in,
// and speaks to its window through Electron's debugging port. A case that
// reads the window as a person sees it starts here.
import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

interface Pending {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

/** The built app, running with a user data folder of its own, and a session of its window's debugging port. */
export class BuiltApp {
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private daemon: number | undefined;
  private stopped: Promise<number[]> | undefined;
  private focused = false;

  private constructor(
    private readonly child: ChildProcess,
    private readonly socket: WebSocket,
    /** The folder `--user-data-dir` names. The daemon's run folder is `run` under it. */
    readonly userData: string,
  ) {
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as { id?: number; result?: unknown; error?: unknown };
      const waiting = message.id === undefined ? undefined : this.pending.get(message.id);
      if (!waiting || message.id === undefined) return;
      this.pending.delete(message.id);
      if (message.error) waiting.reject(new Error(JSON.stringify(message.error)));
      else waiting.resolve(message.result);
    });
  }

  /**
   * Starts the app built in `dist/` and waits for its window's page. `env`
   * is added to the suite's own environment. The user data folder is a new
   * one under the system's temporary folder, so nothing is read from or
   * written to the person's own. The app starts in the background, with
   * `OWLERY_BACKGROUND` set to `1`, so its window takes neither the system's
   * focus nor the person's keyboard. A caller that opens the app for a person
   * to type in passes `keepBackground`, and the variable stays as the
   * caller's own environment has it.
   */
  static async start(env: Record<string, string>, { keepBackground = false } = {}): Promise<BuiltApp> {
    const userData = realpathSync(mkdtempSync(join(tmpdir(), "owlery-app-")));
    const port = await freePort();
    const appEnv: NodeJS.ProcessEnv = { ...process.env, ...env };
    // Without the variable the suite's binary starts as the app.
    delete appEnv.ELECTRON_RUN_AS_NODE;
    if (!keepBackground) appEnv.OWLERY_BACKGROUND = "1";
    const child = spawn(process.execPath, [APP_DIR, `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`], { env: appEnv, stdio: "ignore" });
    try {
      const socket = new WebSocket(await pageSocket(port));
      await new Promise<void>((resolve, reject) => {
        socket.addEventListener("open", () => resolve(), { once: true });
        socket.addEventListener("error", () => reject(new Error("the debugging port refused the session")), { once: true });
      });
      const started = new BuiltApp(child, socket, userData);
      started.focused = await started.evaluate<boolean>("document.hasFocus()");
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
    return new Promise<T>((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve: resolve as (result: unknown) => void, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  /** The value of an expression in the window's page. A promise is awaited. */
  async evaluate<T>(expression: string): Promise<T> {
    const answer = await this.cdp<{ result: { value: T }; exceptionDetails?: unknown }>("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (answer.exceptionDetails) throw new Error(`${expression}: ${JSON.stringify(answer.exceptionDetails)}`);
    return answer.result.value;
  }

  /** Waits until an expression of the page is true, and says `what` never came where it is not within `ms`. */
  async until(expression: string, what: string, ms = 15_000): Promise<void> {
    const deadline = Date.now() + ms;
    for (;;) {
      if (await this.evaluate<boolean>(`Boolean(${expression})`)) return;
      if (Date.now() >= deadline) throw new Error(`the window never showed ${what}`);
      await sleep(100);
    }
  }

  /** A click of the mouse in the middle of the element a selector finds, as a person's click arrives. */
  async click(selector: string): Promise<void> {
    const at = await this.evaluate<{ x: number; y: number }>(
      `(() => { const box = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`,
    );
    await this.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", clickCount: 1 });
    await this.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", clickCount: 1 });
  }

  /** The process id of the daemon the app started, as `run/daemon.json` names it, or nothing before the daemon wrote it. */
  daemonPid(): number | undefined {
    if (this.daemon !== undefined) return this.daemon;
    try {
      const pid = (JSON.parse(readFileSync(join(this.userData, "run", "daemon.json"), "utf8")) as { pid?: unknown }).pid;
      if (typeof pid === "number") this.daemon = pid;
    } catch {
      // The daemon has not written its file.
    }
    return this.daemon;
  }

  /**
   * Stops the app and the daemon it started, each by its process id, and
   * removes the user data folder. The daemon outlives the app while a pane's
   * process runs, so it is stopped here. It answers with the process ids that
   * were still there ten seconds after they were asked to end, which it then
   * kills. A second call answers what the first did.
   */
  stop(): Promise<number[]> {
    this.stopped ??= this.end();
    return this.stopped;
  }

  private async end(): Promise<number[]> {
    this.socket.close();
    const pids = [this.child.pid, this.daemonPid()].filter((pid): pid is number => pid !== undefined);
    for (const pid of pids) if (alive(pid)) process.kill(pid, "SIGTERM");
    const left = await untilGone(pids, 10_000);
    for (const pid of left) process.kill(pid, "SIGKILL");
    await untilGone(left, 5_000);
    rmSync(this.userData, { recursive: true, force: true });
    return left;
  }
}

/** The address of the session of the window's page, once the app has opened it. */
async function pageSocket(port: number): Promise<string> {
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      const targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
      const page = targets.find((target) => target.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // The app is not listening yet.
    }
    if (Date.now() >= deadline) throw new Error("the app opened no window");
    await sleep(200);
  }
}
