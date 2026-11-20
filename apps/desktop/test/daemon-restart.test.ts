// The menu's two entries that end the daemon, in the built app. The app is
// started twice, in the background and with the main process's inspector,
// where the built menu and its entries' clicks are: once for a restart and
// the plain quit after it, and once for a complete quit, since each quit
// ends the app. Each pane's process is the receiver of ./fixtures, so no
// shell of the person's and no agent starts. The cases signal only what
// they started: the bystander daemon by the id its start gave, and the
// app's own daemon through `BuiltApp.stop`.
import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { alive, BuiltApp, buildApp, untilGone } from "./built-app";
import { openReceiverPane, Received, RECEIVER } from "./korean-pane";
import { temporaryRepository } from "./repositories";

/** The title `openReceiverPane` gives the work item it creates. */
const TITLE = "Korean input";

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Waits until `read` gives a value, `ms` at most, and fails saying `what` never came. */
async function eventually<T>(read: () => T | undefined, what: string, ms = 15_000): Promise<T> {
  const deadline = Date.now() + ms;
  for (;;) {
    const value = read();
    if (value !== undefined) return value;
    if (Date.now() >= deadline) throw new Error(`${what} never came`);
    await sleep(50);
  }
}

/** The process id a run folder's `daemon.json` names, or nothing where the folder holds none. */
function named(runDir: string): number | undefined {
  try {
    return (JSON.parse(readFileSync(join(runDir, "daemon.json"), "utf8")) as { pid: number }).pid;
  } catch {
    return undefined;
  }
}

/** Starts the app on a new repository, and opens a work item with one live pane, whose process is the receiver. */
async function startWithPane(): Promise<{ app: BuiltApp; repository: ReturnType<typeof temporaryRepository>; received: string }> {
  const repository = temporaryRepository();
  const received = join(repository.base, "received");
  const app = await BuiltApp.start({ SHELL: RECEIVER, OWLERY_WORKTREES: repository.root, OWLERY_RECEIVER_FILE: received }, { inspectMain: true });
  // The app starts in the background, and the page of a window without the system's focus reports none.
  await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
  await openReceiverPane(app, repository.repo, received);
  return { app, repository, received };
}

/** Calls the click of the application menu's entry with this id, in the main process, as a person's choice of the entry does. */
function choose(app: BuiltApp, id: string): Promise<boolean> {
  return app.evaluateMain<boolean>(`(() => { const entry = electron.Menu.getApplicationMenu()?.getMenuItemById(${JSON.stringify(id)}); if (!entry) return false; entry.click(); return true; })()`);
}

const DIALOG_OPEN = `document.getElementById("daemon-dialog")?.open === true`;
/** What the dialog shows: its head, the sessions it names, its button's words, and the id of the element the keyboard is on. */
const DIALOG = `({ head: document.getElementById("daemon-head").textContent, sessions: document.getElementById("daemon-sessions").hidden ? [] : [...document.querySelectorAll("#daemon-sessions li")].map((line) => line.textContent), button: document.getElementById("daemon-submit").textContent, keyboard: document.activeElement?.id })`;

describe("a restart of the daemon in the built app", { timeout: 60_000 }, () => {
  let app: BuiltApp;
  let repository: ReturnType<typeof temporaryRepository>;
  let received: string;
  /** A daemon of a run folder of its own, which the case started and the app never stops. */
  let bystander: ChildProcess;
  let bystanderDir: string;

  beforeAll(async () => {
    buildApp();
    bystanderDir = realpathSync(mkdtempSync(join(tmpdir(), "owlery-bystander-")));
    // The daemon's own script, on the suite's binary as Node. `SHELL` is the receiver, so nothing of the person's starts where this daemon looks for a shell.
    bystander = spawn(process.execPath, [join(__dirname, "..", "dist", "daemon.js")], { env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", OWLERY_RUN_DIR: bystanderDir, SHELL: RECEIVER }, stdio: "ignore" });
    await eventually(() => named(bystanderDir), "the bystander daemon's daemon.json");
    ({ app, repository, received } = await startWithPane());
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    if (bystander?.pid !== undefined) {
      bystander.kill("SIGTERM");
      for (const pid of await untilGone([bystander.pid], 10_000)) process.kill(pid, "SIGKILL");
    }
    if (bystanderDir) rmSync(bystanderDir, { recursive: true, force: true });
    repository?.remove();
  }, 60_000);

  it('asks before "Restart Daemon…" ends anything, ends nothing at Cancel, and at Restart ends the daemon of its own run folder with its pane and starts another, which the window attaches to', async () => {
    const runDir = join(app.userData, "run");
    const first = await eventually(() => app.daemonPid(), "the app's daemon.json");
    const pane = new Received(received).pid();
    expect([first, pane].map(alive)).toEqual([true, true]);

    expect(await choose(app, "restart-daemon"), "the menu holds the entry restart-daemon").toBe(true);
    await app.until(DIALOG_OPEN, "the dialog before a restart");
    expect(await app.evaluate(DIALOG)).toEqual({ head: "Restart the daemon", sessions: [`Shell in ${TITLE}`], button: "Restart", keyboard: "daemon-cancel" });

    await app.click("#daemon-cancel");
    await app.until(`!(${DIALOG_OPEN})`, "the dialog closed");
    // A stop that Cancel began has ended the daemon by now: it took 7 ms where it was measured.
    await sleep(500);
    expect(named(runDir)).toBe(first);
    expect([first, pane].map(alive)).toEqual([true, true]);

    expect(await choose(app, "restart-daemon")).toBe(true);
    await app.until(DIALOG_OPEN, "the dialog before a restart, a second time");
    await app.click("#daemon-submit");
    expect(await untilGone([first, pane], 10_000), "the earlier daemon and its pane's process, still there").toEqual([]);
    const second = await eventually(() => {
      const pid = app.daemonPid();
      return pid === first ? undefined : pid;
    }, "the daemon.json of a second daemon");
    expect(alive(second)).toBe(true);
    // The window reloaded, and its load attached to the daemon it had started.
    await app.until(`document.getElementById("status")?.textContent === "Daemon running, no agent"`, "the status line of a window attached to the new daemon");
    expect(await app.evaluate(DIALOG_OPEN)).toBe(false);
    // The app stopped the daemon of its own run folder alone.
    expect(alive(bystander.pid as number)).toBe(true);
    expect(named(bystanderDir)).toBe(bystander.pid);
  });

  it("leaves the daemon and its sessions running at a plain Quit, and the harness then ends the daemon the run folder names", async () => {
    const daemon = app.daemonPid() as number;
    // A pane of the new daemon: the receiver writes its process id anew.
    rmSync(`${received}.pid`, { force: true });
    await app.click("#repositories [data-work-item]");
    await app.until(`!document.getElementById("work-item-view").hidden && document.querySelectorAll("#pane-buttons button").length > 0`, "the work item's view with its pane buttons");
    await app.evaluate(`[...document.querySelectorAll("#pane-buttons button")].find((button) => button.textContent === "+ Shell").click()`);
    const pane = await eventually(() => (existsSync(`${received}.pid`) && readFileSync(`${received}.pid`, "utf8").trim() !== "" ? new Received(received).pid() : undefined), "the receiver of a pane of the new daemon");
    expect([daemon, pane].map(alive)).toEqual([true, true]);

    // What the quit entry's role runs, called once the inspector's session is closed: a main process whose inspector holds a session waits for it at its end.
    await app.evaluateMain("(setTimeout(() => electron.app.quit(), 200), true)");
    app.leaveMain();
    expect(await untilGone([app.pid], 10_000), "the app's process, still there").toEqual([]);
    // A quit that stopped the daemon has ended it by now.
    await sleep(1000);
    expect([daemon, pane].map(alive)).toEqual([true, true]);
    expect(app.daemonPid()).toBe(daemon);

    expect(await app.stop()).toEqual([]);
    expect(await untilGone([daemon, pane], 10_000), "processes of the case, still there after the harness stopped").toEqual([]);
  });
});

describe("a complete quit in the built app", { timeout: 60_000 }, () => {
  let app: BuiltApp;
  let repository: ReturnType<typeof temporaryRepository>;
  let received: string;

  beforeAll(async () => {
    buildApp();
    ({ app, repository, received } = await startWithPane());
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    repository?.remove();
  }, 60_000);

  it('asks before "Quit Owlery Completely…" ends anything, and at Quit ends the daemon with its pane, quits the app, and leaves no daemon behind', async () => {
    const runDir = join(app.userData, "run");
    const daemon = await eventually(() => app.daemonPid(), "the app's daemon.json");
    const pane = new Received(received).pid();

    expect(await choose(app, "quit-completely"), "the menu holds the entry quit-completely").toBe(true);
    await app.until(DIALOG_OPEN, "the dialog before a complete quit");
    expect(await app.evaluate(DIALOG)).toEqual({ head: "Quit Owlery completely", sessions: [`Shell in ${TITLE}`], button: "Quit", keyboard: "daemon-cancel" });
    // A main process whose inspector holds a session waits for it at its end.
    app.leaveMain();
    await app.click("#daemon-submit");
    expect(await untilGone([app.pid, daemon, pane], 10_000), "the app, its daemon and the pane's process, still there").toEqual([]);
    // A window that lost its daemon reloads a second later, and a load asks for the daemon.
    await sleep(2000);
    expect(existsSync(join(runDir, "daemon.json"))).toBe(false);
  });
});
