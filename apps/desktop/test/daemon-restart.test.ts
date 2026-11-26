// The menu's two entries that end the daemon, and the status line's sentence
// for a daemon of another build, in the built app. The app is started
// twice, in the background and with the main process's inspector, where the
// built menu and its entries' clicks are: once for the sentence, the restart
// that takes it away and the plain quit after it, and once for a complete
// quit, since each quit ends the app. Each pane's process is the receiver of ./fixtures, so no
// shell of the person's and no agent starts. The cases signal only what
// they started: the bystander daemon by the id its start gave, and the
// app's own daemon through `BuiltApp.stop`. The seal a work item's head
// holds is read again by a daemon that starts on the same run folder, which
// the last describe shows with two daemons of the suite's own process and
// no built app.
import { type ChildProcess, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { alive, BuiltApp, buildApp, untilGone } from "./built-app";
import { openReceiverPane, Received, RECEIVER } from "./korean-pane";
import { type Cleanups, clean, client, commitSeal, roles, standing } from "./chain-run";
import { branchOf, git, temporaryRepository } from "./repositories";

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

/** What a run folder's `daemon.json` holds. */
function discovery(runDir: string): { port: number; token: string; pid: number; build?: string } {
  return JSON.parse(readFileSync(join(runDir, "daemon.json"), "utf8")) as { port: number; token: string; pid: number; build?: string };
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

/** The sentence of a daemon of another build. */
const OTHER_BUILD = `Owlery's background process is from another build. Choose "Restart Daemon…" from the menu to replace it.`;
/** What the status line says, and whether it is drawn as a notice. */
const STATUS = `({ text: document.getElementById("status").textContent, notice: document.getElementById("status").classList.contains("notice") })`;

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

  it('says in the status line that a daemon whose daemon.json holds no build is from another build, asks before "Restart Daemon…" ends anything, ends nothing at Cancel, and at Restart ends the daemon of its own run folder with its pane and starts another, of this build, which the window attaches to', async () => {
    const runDir = join(app.userData, "run");
    const first = await eventually(() => app.daemonPid(), "the app's daemon.json");
    const pane = new Received(received).pid();
    expect([first, pane].map(alive)).toEqual([true, true]);

    // The daemon the app started is of the app's own build: it wrote the SHA-256 of the script it runs, and the status line says nothing of it.
    const build = createHash("sha256").update(readFileSync(join(__dirname, "..", "dist", "daemon.js"))).digest("hex");
    const written = discovery(runDir);
    expect(written.build).toBe(build);
    expect(await app.evaluate(STATUS)).toEqual({ text: "Daemon running, no agent", notice: false });
    // A daemon of an earlier build leaves a daemon.json without `build`. The file keeps the daemon's process, port and token, so the app attaches to the same daemon and the harness still ends it.
    writeFileSync(join(runDir, "daemon.json"), JSON.stringify({ port: written.port, token: written.token, pid: written.pid }));
    await app.cdp("Page.reload");
    await app.until(`document.getElementById("status")?.textContent === ${JSON.stringify(OTHER_BUILD)}`, "the status line's sentence for a daemon of another build");
    expect(await app.evaluate(STATUS)).toEqual({ text: OTHER_BUILD, notice: true });
    expect([first, pane].map(alive)).toEqual([true, true]);
    // The page is a new one, and without the system's focus it reports none.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    // The status line's sentence comes from the connection, before the daemon's lists: the dialog names the sessions from those lists.
    await app.until(`document.querySelector("#repositories [data-work-item]") !== null`, "the reloaded window's lists");

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
    expect(await app.evaluate(STATUS)).toEqual({ text: "Daemon running, no agent", notice: false });
    // The new daemon is of this build, and says so.
    expect(discovery(runDir)).toMatchObject({ pid: second, build });
    expect(await app.evaluate(DIALOG_OPEN)).toBe(false);
    // The app stopped the daemon of its own run folder alone.
    expect(alive(bystander.pid as number)).toBe(true);
    expect(named(bystanderDir)).toBe(bystander.pid);
  });

  it("leaves the daemon and its sessions running at a plain Quit, and the harness then ends the daemon the run folder names", async () => {
    const daemon = app.daemonPid() as number;
    // A pane of the new daemon: the receiver writes its process id anew.
    rmSync(`${received}.pid`, { force: true });
    // The status line of the new daemon can come before its lists are drawn.
    await app.until(`document.querySelector("#repositories [data-work-item]") !== null`, "the work item's line from the new daemon's lists");
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

describe("the seal after a restart of the daemon", { timeout: 60_000 }, () => {
  const cleanups: Cleanups = [];
  afterEach(async () => {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  });

  it("sends, from a second daemon started on the same run folder, the seal of a sealed work item and of a broken one as the first daemon read them: the same states, the same commits and the same sentence, and no file of the run folder names either state", async () => {
    // The titles name neither state, since a work item's title, branch and folder stand in the run folder.
    const stood = await standing(cleanups, ["First work", "Second work"], { commitPollMs: 50, roleAdapter: roles({ proofer: clean }) });
    const [a, b] = stood.workItems as [(typeof stood.workItems)[number], (typeof stood.workItems)[number]];
    // The first is sealed by its chain, whose routing sends the work to a pull request, so the chain the store keeps rests with the pull request's sentence.
    expect(await stood.c.startChain(a.id)).toBe("done");
    // The wait reads no state of the chain, so the read of the run folder below is what tells a state the store keeps.
    const rests = await stood.c.until(() => {
      const chain = stood.c.workItem(a.id)?.chain;
      return chain !== null && chain !== undefined && chain.state !== "running" && chain.stages.length === 4 ? chain : undefined;
    });
    expect(rests.says).toBe("Pull request #1 is open.");
    const sealedAt = git(a.worktree, "rev-parse", "HEAD~2").trim();
    const brokenAt = commitSeal(b.worktree, { workItem: "1795396352-second-work", branch: branchOf(b), base: b.baseCommit });
    writeFileSync(join(b.worktree, "feature.txt"), "A greeting, changed after the seal\n");
    git(b.worktree, "commit", "--quiet", "-am", "fix: change the greeting");
    const seals = (c: typeof stood.c) => () => {
      const [one, two] = [c.workItem(a.id)?.seal, c.workItem(b.id)?.seal];
      return one?.state === "sealed" && two?.state === "broken" ? [one, two] : undefined;
    };
    const before = await stood.c.until(seals(stood.c));
    expect(before).toEqual([
      { state: "sealed", commit: sealedAt, why: null },
      { state: "broken", commit: brokenAt, why: `\`feature.txt\` changed after the sealed commit \`${brokenAt.slice(0, 7)}\`.` },
    ]);
    await stood.d.close();
    // The daemon stores neither state: what the second daemon sends, it read again from the repository.
    const files = (readdirSync(stood.runDir, { recursive: true, withFileTypes: true }) as { name: string; parentPath: string; isFile(): boolean }[]).filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name));
    expect(files.map((file) => relative(stood.runDir, file))).toContain("repositories.json");
    expect(files.flatMap((file) => (/\b(?:sealed|broken)\b/iu.test(readFileSync(file, "utf8")) ? [relative(stood.runDir, file)] : []))).toEqual([]);

    const c = await client(await stood.start(), cleanups);
    await c.message("ready");
    expect(await c.until(seals(c))).toEqual(before);
  });
});
