// The launch measurement: what a launch of the built app costs, part by part,
// against a reset of one app left open for the next test file, what judges
// that a reset reset, and the tables it prints. `launch.test.ts` holds the
// cases of the functions and, under its variable, the measurement.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BuiltApp, buildApp, untilGone } from "./built-app";
import { footprintsOf, listed, splitProcesses, sums, unread } from "./memory";

/** The parts of a launch, in the order they are taken. */
export const LAUNCH_PARTS = ["build", "start", "ready", "stop"] as const;
export type Launch = Record<(typeof LAUNCH_PARTS)[number], number>;

/** The parts of a reset, in the order they are taken. */
export const RESET_PARTS = ["away", "daemonEnded", "emptied", "environment", "back", "ready"] as const;
export type Reset = Record<(typeof RESET_PARTS)[number], number>;

/** The app itself in bytes, 5 s after ready: in the first app launched, and in the open app before its first reset and after its last. */
export interface Memory {
  launched: number;
  open: number;
  reset: number;
}

/** What is read after a reset. `mark` is the variable the reset set, as `NAME=value`; `environment` is what `ps eww` printed for the daemon the run folder names after it. */
export interface ResetReading {
  before: number;
  after: number | undefined;
  environment: string;
  mark: string;
  leftover: boolean;
}

/** The variable each reset sets in the main process, so the next daemon's environment shows which reset it started after. */
const MARK = "OWLERY_LAUNCH_MARK";

/** The page's status line once the daemon it started answers. */
const READY = "Daemon running, no agent";

/** The seconds after ready at which the app itself is measured. */
const SAMPLE_SECONDS = 5;

/** 1 MB, as Activity Monitor counts it. */
const MB = 1_048_576;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** The median of the values, their lowest and their highest. */
export function spread(values: readonly number[]): { median: number; lowest: number; highest: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? (sorted[middle] as number) : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
  return { median, lowest: sorted[0] as number, highest: sorted[sorted.length - 1] as number };
}

/** How many launches and how many resets a run makes, as `OWLERY_LAUNCH_RUNS` names it: 10 where it is absent. */
export function runsOf(env: NodeJS.ProcessEnv): number {
  const runs = env.OWLERY_LAUNCH_RUNS ?? "10";
  if (!/^[1-9]\d*$/.test(runs)) throw new Error(`OWLERY_LAUNCH_RUNS is "${runs}". It is a whole number above zero.`);
  return Number(runs);
}

/** What failed of a reset's three readings, as one sentence, or null where the reset reset. */
export function judged({ before, after, environment, mark, leftover }: ResetReading): string | null {
  const failed: string[] = [];
  if (after === undefined) failed.push("the run folder names no daemon after the reset");
  else {
    if (after === before) failed.push(`the daemon ${before} from before the reset is still the one the run folder names`);
    // A value is one word of the environment `ps` prints, so a longer value that begins with it is not it.
    if (!environment.split(/\s+/).includes(mark)) failed.push(`the environment of the daemon ${after} does not hold ${mark}`);
  }
  if (leftover) failed.push("the run folder still holds the file written before the reset");
  return failed.length === 0 ? null : failed.join("; ");
}

/** The sum of one run's parts. */
function sumOf<Part extends string>(run: Record<Part, number>, parts: readonly Part[]): number {
  return parts.reduce((sum, part) => sum + run[part], 0);
}

/** The median of the launches' sums without their builds: one open app still needs `dist/` built for the tree as it stands. */
const launchesWithoutBuild = (launches: readonly Launch[]): number => spread(launches.map((launch) => sumOf(launch, ["start", "ready", "stop"]))).median;

/** The median of the resets' sums. */
const resetsMedian = (resets: readonly Reset[]): number => spread(resets.map((reset) => sumOf(reset, RESET_PARTS))).median;

/** The milliseconds one open app saves for each launch: the median of a launch's sum without its build, less the median of a reset's sum. */
export function saving(launches: readonly Launch[], resets: readonly Reset[]): number {
  return launchesWithoutBuild(launches) - resetsMedian(resets);
}

const LAUNCH_ROWS: Record<(typeof LAUNCH_PARTS)[number], string> = {
  build: "Build: `buildApp`",
  start: "Start: until `BuiltApp.start` returned",
  ready: `Ready: until the status line read "${READY}"`,
  stop: "Stop: `stop`",
};

const RESET_ROWS: Record<(typeof RESET_PARTS)[number], string> = {
  away: "1. The window loaded about:blank",
  daemonEnded: "2. The daemon ended at SIGTERM",
  emptied: "3. The run folder and appearance.json were emptied",
  environment: "4. The main process's environment was set",
  back: "5. The window loaded the app's page again",
  ready: `6. Ready: until the status line read "${READY}"`,
};

/** One table of a measurement's parts and their sum: each row the median, the lowest and the highest of the runs, the sum's of each run's sum. */
function partsTable<Part extends string>(title: string, runs: readonly Record<Part, number>[], parts: readonly Part[], rows: Record<Part, string>, sum: string): string[] {
  const row = (label: string, values: number[]): string => {
    const { median, lowest, highest } = spread(values);
    return `| ${label} | ${[median, lowest, highest].map(Math.round).join(" | ")} |`;
  };
  return [
    `| ${title}, ms, of ${runs.length} | Median | Lowest | Highest |`,
    "|---|---|---|---|",
    ...parts.map((part) => row(rows[part], runs.map((run) => run[part]))),
    row(sum, runs.map((run) => sumOf(run, parts))),
  ];
}

/** What the measurement prints under its heading. */
export function tables(launches: readonly Launch[], resets: readonly Reset[], memory: Memory): string {
  const mb = (bytes: number): string => (bytes / MB).toFixed(1);
  return [
    ...partsTable("A launch", launches, LAUNCH_PARTS, LAUNCH_ROWS, "The launch's sum"),
    "",
    ...partsTable("A reset of the open app", resets, RESET_PARTS, RESET_ROWS, "The reset's sum"),
    "",
    `One open app saves ${Math.round(saving(launches, resets))} ms for each launch: the median of a launch's sum without its build, ${Math.round(launchesWithoutBuild(launches))} ms, less the median of a reset's sum, ${Math.round(resetsMedian(resets))} ms.`,
    "",
    `| The app itself, MB, ${SAMPLE_SECONDS} s after ready | |`,
    "|---|---|",
    `| The first app launched | ${mb(memory.launched)} |`,
    `| The open app, before its first reset | ${mb(memory.open)} |`,
    `| The open app, after its last reset | ${mb(memory.reset)} |`,
    "",
    `Ready is the status line reading "${READY}", read every 10 ms. The start asks the debugging port every 200 ms, and the stop and part 2 of a reset look for the process's end every 50 ms, so each holds up to one such step. 1 MB is 1,048,576 bytes. The app itself is the main process, every process below it and the daemon.`,
  ].join("\n");
}

/**
 * Stops the app the run holds when a signal ends the run: a person stops it
 * with Ctrl-C, which no `finally` outlives, and the daemon is no child of the
 * run. It answers with the function that takes the handlers off again.
 */
function stopsAtSignal(app: () => BuiltApp | undefined): () => void {
  const end = (): void => app()?.stopNow();
  const interrupted = (): void => {
    end();
    process.exit(130);
  };
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) process.once(signal, interrupted);
  process.once("exit", end);
  return () => {
    for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) process.off(signal, interrupted);
    process.off("exit", end);
  };
}

/** Waits for the status line to read that the daemon runs, read every 10 ms so the wait adds little to the time it measures. */
async function untilReady(app: BuiltApp): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (!(await app.evaluate<boolean>(`document.getElementById("status")?.textContent === ${JSON.stringify(READY)}`))) {
    if (Date.now() >= deadline) throw new Error(`the status line never read "${READY}"`);
    await sleep(10);
  }
}

/** The app itself in bytes, `SAMPLE_SECONDS` from the call: the main process, every process below it and the daemon. */
async function footprint(app: BuiltApp): Promise<number> {
  await sleep(SAMPLE_SECONDS * 1000);
  const daemon = app.daemonPid();
  if (daemon === undefined) throw new Error("the run folder names no daemon");
  const split = splitProcesses(listed(), app.pid, daemon);
  const bytes = footprintsOf(split.app.map((process) => process.pid));
  const missing = unread(split, bytes);
  if (missing !== null) throw new Error(missing);
  return sums(split, bytes).app;
}

/** Milliseconds since the last call, from the first call on. */
function laps(): () => number {
  let last = performance.now();
  return () => {
    const now = performance.now();
    const ms = now - last;
    last = now;
    return ms;
  };
}

/**
 * One launch as each built-app file makes one: it builds `dist/`, starts the
 * app, waits for ready and stops it, timing each. Where `sample` is true it
 * measures the app itself between ready and the stop, which is not timed.
 */
export async function launchOnce(env: Record<string, string>, sample: boolean): Promise<{ parts: Launch; footprint?: number; left: number[] }> {
  let app: BuiltApp | undefined;
  const release = stopsAtSignal(() => app);
  try {
    const lap = laps();
    buildApp();
    const build = lap();
    app = await BuiltApp.start(env);
    const start = lap();
    await untilReady(app);
    const ready = lap();
    const measured = sample ? await footprint(app) : undefined;
    lap();
    const left = await app.stop();
    const stop = lap();
    return { parts: { build, start, ready, stop }, footprint: measured, left };
  } finally {
    await app?.stop();
    release();
  }
}

/** The text `ps` prints for a process: its command, then its environment. */
function environmentOf(pid: number): string {
  try {
    return execFileSync("ps", ["eww", "-o", "command=", "-p", String(pid)], { encoding: "utf8" }).trim();
  } catch {
    // `ps` exits 1 where no process has the id.
    return "";
  }
}

/**
 * One reset of the open app for the next file, in six timed parts, and its
 * three readings judged. The window leaves the app's page first, so the page
 * does not start a daemon while the run folder is emptied: it reloads one
 * second after its socket to the daemon closes.
 */
async function resetOnce(app: BuiltApp, env: Record<string, string>, run: number): Promise<Reset> {
  const runDir = join(app.userData, "run");
  const leftover = join(runDir, "left-before-the-reset");
  writeFileSync(leftover, "");
  const before = app.daemonPid();
  if (before === undefined) throw new Error("the run folder names no daemon before the reset");
  const mark = `${MARK}=reset-${run}`;
  const lap = laps();
  const page = await app.evaluateMain<string>(
    `(async () => { const contents = electron.BrowserWindow.getAllWindows()[0].webContents; const page = contents.getURL(); await contents.loadURL("about:blank"); return page; })()`,
  );
  const away = lap();
  process.kill(before, "SIGTERM");
  const stayed = await untilGone([before], 10_000);
  if (stayed.length > 0) throw new Error(`the daemon ${before} did not end at SIGTERM in 10 s`);
  const daemonEnded = lap();
  for (const entry of readdirSync(runDir)) rmSync(join(runDir, entry), { recursive: true, force: true });
  rmSync(join(app.userData, "appearance.json"), { force: true });
  const emptied = lap();
  await app.evaluateMain(`(Object.assign(process.env, ${JSON.stringify({ ...env, [MARK]: `reset-${run}` })}), true)`);
  const environment = lap();
  await app.evaluateMain(`electron.BrowserWindow.getAllWindows()[0].webContents.loadURL(${JSON.stringify(page)}).then(() => true)`);
  const back = lap();
  await untilReady(app);
  const ready = lap();
  const after = app.daemonPid();
  const failed = judged({ before, after, environment: after === undefined ? "" : environmentOf(after), mark, leftover: existsSync(leftover) });
  if (failed !== null) throw new Error(`reset ${run}: ${failed}`);
  return { away, daemonEnded, emptied, environment, back, ready };
}

/**
 * One app started with the main process's inspector and reset `runs` times,
 * as one app left open for every file would be. It measures the app itself
 * before the first reset and after the last, and stops the app.
 */
export async function resets(env: Record<string, string>, runs: number): Promise<{ parts: Reset[]; before: number; after: number; left: number[] }> {
  let app: BuiltApp | undefined;
  const release = stopsAtSignal(() => app);
  try {
    app = await BuiltApp.start({ ...env, [MARK]: "start" }, { inspectMain: true });
    await untilReady(app);
    const before = await footprint(app);
    const parts: Reset[] = [];
    for (let run = 1; run <= runs; run += 1) parts.push(await resetOnce(app, env, run));
    const after = await footprint(app);
    return { parts, before, after, left: await app.stop() };
  } finally {
    await app?.stop();
    release();
  }
}
