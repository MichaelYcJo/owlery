// The memory measurement: what it reads of `ps` and of macOS's `footprint`,
// which processes it counts as the app itself, which run it throws away, the
// tables it prints, and its driving of the built app's window through a
// scenario. `memory.test.ts` holds the cases of the functions and, under its
// variable, the measurement.
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { startsInBackground } from "../src/main/background";
import { BuiltApp, endNow, untilGone } from "./built-app";
import { temporaryRepository } from "./repositories";

/** The pane's process: `SHELL` for the app the measurement starts. */
export const PRINTER = join(__dirname, "fixtures", "printer.sh");

/** 1 MB, as Activity Monitor counts it. */
const MB = 1_048_576;

/** The seconds after a scenario's last step at which a sample is taken. */
const SAMPLE_SECONDS = [20, 25, 30] as const;

/** What a process of the app itself is. `other` is a process below the main process that names no type. */
export type Kind = "main" | "renderer" | "gpu" | "utility" | "daemon" | "other";

const KINDS: readonly Kind[] = ["main", "renderer", "gpu", "utility", "daemon", "other"];

/**
 * Who started the app. `agent`: under `OWLERY_BACKGROUND=1`, with the page
 * told that it has the focus. `person`: as the app ships, with the system's
 * focus.
 */
export type Start = "agent" | "person";

/**
 * `inbox`: the app as it opens, no view opened. `one`: one pane on the
 * stage. `eight-in-turn`: eight panes in two work items, each put in front
 * once, the last one left on the stage.
 */
export const SCENARIOS = ["inbox", "one", "eight-in-turn"] as const;
export type Scenario = (typeof SCENARIOS)[number];

export interface ProcessRow {
  pid: number;
  ppid: number;
  command: string;
}

/** The processes `ps -axo pid=,ppid=,command=` printed, one per line. */
export function processRows(text: string): ProcessRow[] {
  return text.split("\n").flatMap((line) => {
    const row = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line);
    return row ? [{ pid: Number(row[1]), ppid: Number(row[2]), command: row[3] as string }] : [];
  });
}

/** Each process's footprint in bytes, by its process id, as `footprint --noCategories -f bytes` printed them. The summary line names no process and is not read. */
export function footprints(text: string): Map<number, number> {
  return new Map([...text.matchAll(/\[(\d+)\]: .*\bFootprint: (\d+) B/g)].map((line) => [Number(line[1]), Number(line[2])]));
}

export interface Split {
  /** The app itself: the main process, every process below it and the daemon. */
  app: { pid: number; kind: Kind }[];
  /** The processes below the daemon, which are the panes' and are summed apart. */
  panes: number[];
}

/** Sorts the listed processes into the app's own and the panes', given the process ids of the app's main process and of its daemon. */
export function splitProcesses(rows: readonly ProcessRow[], main: number, daemon: number): Split {
  const below = (root: number): Set<number> => {
    const found = new Set<number>();
    const walk = (pid: number): void => {
      for (const row of rows) {
        if (row.ppid !== pid || found.has(row.pid)) continue;
        found.add(row.pid);
        walk(row.pid);
      }
    };
    walk(root);
    return found;
  };
  const ofPanes = below(daemon);
  const ofMain = below(main);
  const kindOf = (row: ProcessRow): Kind => {
    if (row.pid === main) return "main";
    if (row.pid === daemon) return "daemon";
    const type = /--type=(\S+)/.exec(row.command)?.[1];
    if (type === "renderer") return "renderer";
    if (type === "gpu-process") return "gpu";
    return type === "utility" ? "utility" : "other";
  };
  const own = rows.filter((row) => row.pid === main || (ofMain.has(row.pid) && !ofPanes.has(row.pid)));
  // A daemon that is no child of this start of the app is the app's all the same.
  const apart = own.some((row) => row.pid === daemon) ? [] : rows.filter((row) => row.pid === daemon);
  return { app: [...own, ...apart].map((row) => ({ pid: row.pid, kind: kindOf(row) })), panes: rows.filter((row) => ofPanes.has(row.pid)).map((row) => row.pid) };
}

export interface Sums {
  /** The sum for the app itself, in bytes. */
  app: number;
  /** The sum for the panes' processes, in bytes. */
  panes: number;
  /** The app itself by the kind of its processes, in bytes. */
  byKind: Record<Kind, number>;
}

/** Which of the app's processes `footprint` gave no number for, as the sentence `measure` fails the launch with, or null where it read them all. A sum without one of them is not the app's. */
export function unread(split: Split, bytes: ReadonlyMap<number, number>): string | null {
  const missing = split.app.filter((process) => !bytes.has(process.pid));
  if (missing.length === 0) return null;
  return `\`footprint\` gave no number for ${missing.map((process) => `the ${process.kind} process ${process.pid}`).join(", ")}, so the sum is not the app's. The measurement is macOS's.`;
}

/** The sums of one reading. A pane's process that ended before `footprint` read it has no number and adds none; `unread` names a process of the app that has none. */
export function sums(split: Split, bytes: ReadonlyMap<number, number>): Sums {
  const byKind: Record<Kind, number> = { main: 0, renderer: 0, gpu: 0, utility: 0, daemon: 0, other: 0 };
  for (const { pid, kind } of split.app) byKind[kind] += bytes.get(pid) ?? 0;
  return { app: KINDS.reduce((sum, kind) => sum + byKind[kind], 0), panes: split.panes.reduce((sum, pid) => sum + (bytes.get(pid) ?? 0), 0), byKind };
}

/** What the page said of itself while a sample was taken. */
export interface PageRead {
  visibility: string;
  focused: boolean;
  /** The frames the page drew in one second. */
  frames: number;
  /** The terminals the page holds, and how many of them are displayed. */
  terminals: number;
  displayed: number;
  canvases: number;
}

export interface Sample extends Sums, PageRead {
  /** The seconds after the scenario's last step. */
  at: number;
}

/**
 * Why a run is thrown away, or null where it is kept. A page that is hidden
 * or draws no frame is a window that draws nothing, which holds less than
 * half of what a drawing one holds, so no sample of such a run is published.
 * An agent's run emulates the focus, so only a person's run is read for it.
 */
export function thrownAway(samples: readonly Sample[], start: Start): string | null {
  if (samples.length === 0) return "the run took no sample";
  for (const sample of samples) {
    if (sample.visibility !== "visible") return `the page was ${sample.visibility} at ${sample.at} s`;
    if (sample.frames === 0) return `the page drew no frame at ${sample.at} s`;
    if (start === "person" && !sample.focused) return `the window did not have the focus at ${sample.at} s`;
  }
  return null;
}

/** The kind of start a run of the measurement makes: the app reads the same switch. */
export function startOf(env: NodeJS.ProcessEnv): Start {
  return startsInBackground(env) ? "agent" : "person";
}

/**
 * The scenarios to measure and how many launches each gets, as the
 * environment names them: `OWLERY_MEMORY_SCENARIOS`, the scenarios' names
 * with commas between, and `OWLERY_MEMORY_RUNS`. Absent, every scenario is
 * measured three times.
 */
export function planOf(env: NodeJS.ProcessEnv): { scenarios: Scenario[]; runs: number } {
  const names = env.OWLERY_MEMORY_SCENARIOS === undefined ? [...SCENARIOS] : env.OWLERY_MEMORY_SCENARIOS.split(",").map((name) => name.trim());
  const unknown = names.find((name) => !SCENARIOS.includes(name as Scenario));
  if (unknown !== undefined) throw new Error(`OWLERY_MEMORY_SCENARIOS names "${unknown}". The scenarios are ${SCENARIOS.join(", ")}.`);
  const runs = env.OWLERY_MEMORY_RUNS ?? "3";
  if (!/^[1-9]\d*$/.test(runs)) throw new Error(`OWLERY_MEMORY_RUNS is "${runs}". It is a whole number above zero.`);
  return { scenarios: names as Scenario[], runs: Number(runs) };
}

/** One launch of the app for one scenario, and what was read of it. */
export interface Run {
  scenario: Scenario;
  run: number;
  start: Start;
  samples: Sample[];
}

/**
 * What the measurement prints: one row per run with its samples, one row per
 * run with its last sample by the kind of its processes, and what the words
 * of the tables mean. A run that is thrown away has one row, which says why
 * and holds no number.
 */
export function tables(runs: readonly Run[]): string {
  const mb = (bytes: number): string => (bytes / MB).toFixed(1);
  const each = (samples: readonly Sample[], cell: (sample: Sample) => string | number): string => samples.map(cell).join(" / ");
  const row = (cells: readonly (string | number)[]): string => `| ${cells.join(" | ")} |`;
  const kept = runs.filter((run) => thrownAway(run.samples, run.start) === null);
  const last = SAMPLE_SECONDS[SAMPLE_SECONDS.length - 1];
  return [
    row(["Scenario", "Run", "Start", `App itself, MB, at ${SAMPLE_SECONDS.map((seconds) => `${seconds} s`).join(" / ")}`, "Highest, MB", "Panes' processes, MB", "Terminals", "Displayed", "Canvases", "Frames a second"]),
    "|---|---|---|---|---|---|---|---|---|---|",
    ...runs.map(({ scenario, run, start, samples }) => {
      const why = thrownAway(samples, start);
      if (why !== null) return `| ${scenario} | ${run} | ${start} | thrown away: ${why} | | | | | | |`;
      return row([
        scenario,
        run,
        start,
        each(samples, (sample) => mb(sample.app)),
        mb(Math.max(...samples.map((sample) => sample.app))),
        each(samples, (sample) => mb(sample.panes)),
        each(samples, (sample) => sample.terminals),
        each(samples, (sample) => sample.displayed),
        each(samples, (sample) => sample.canvases),
        each(samples, (sample) => sample.frames),
      ]);
    }),
    "",
    row(["Scenario", "Run", "Main", "Renderer", "GPU", "Utility", "Daemon", "Other", `App itself, MB, at ${last} s`]),
    "|---|---|---|---|---|---|---|---|---|",
    ...kept.map(({ scenario, run, samples }) => {
      const sample = samples[samples.length - 1] as Sample;
      return row([scenario, run, ...KINDS.map((kind) => mb(sample.byKind[kind])), mb(sample.app)]);
    }),
    "",
    "A start `agent` is made under `OWLERY_BACKGROUND=1`, with the page told that it has the focus. A start `person` is the app as it ships, with the system's focus.",
    "1 MB is 1,048,576 bytes. The app itself is the main process, every process below it and the daemon. The panes' processes are the ones below the daemon.",
  ].join("\n");
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function listed(): ProcessRow[] {
  return processRows(execFileSync("ps", ["-axo", "pid=,ppid=,command="], { encoding: "utf8", maxBuffer: 64 * MB }));
}

function footprintsOf(pids: readonly number[]): Map<number, number> {
  try {
    return footprints(execFileSync("footprint", ["--noCategories", "-f", "bytes", ...pids.map(String)], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  } catch (error) {
    // It exits with an error where a process ended before it was read, and has printed the others.
    return footprints(String((error as { stdout?: unknown }).stdout ?? ""));
  }
}

/** Read in the page: what it says of itself, and how many frames it draws in the second that starts at the call. */
const PAGE_READ = `(async () => {
  const frames = await new Promise((resolve) => {
    let drawn = 0;
    const began = performance.now();
    // A hidden page is given no frame, so a timer ends the count as well.
    const late = setTimeout(() => resolve(drawn), 2000);
    const frame = () => {
      if (performance.now() - began >= 1000) {
        clearTimeout(late);
        resolve(drawn);
        return;
      }
      drawn += 1;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  const terminals = [...document.querySelectorAll("#stage .xterm")];
  return {
    visibility: document.visibilityState,
    focused: document.hasFocus(),
    frames,
    terminals: terminals.length,
    displayed: terminals.filter((terminal) => terminal.getClientRects().length > 0).length,
    canvases: document.querySelectorAll("#stage canvas").length,
  };
})()`;

/** The pane processes the daemon runs now: the printers, without the `sleep` each starts between its lines. */
function printers(main: number, daemon: number): number[] {
  const rows = listed();
  const below = new Set(splitProcesses(rows, main, daemon).panes);
  return rows.filter((row) => below.has(row.pid) && row.command.includes(PRINTER)).map((row) => row.pid);
}

async function untilPrinters(main: number, daemon: number, count: number): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (printers(main, daemon).length !== count) {
    if (Date.now() >= deadline) throw new Error(`the daemon runs ${printers(main, daemon).length} of the panes' processes, and the scenario has ${count}`);
    await sleep(100);
  }
}

/** Types `text` into a field of the form in place of what it holds: the form keeps the repository of the last work item. */
async function fill(app: BuiltApp, id: string, text: string): Promise<void> {
  await app.click(`#${id}`);
  await app.evaluate(`document.getElementById(${JSON.stringify(id)}).select()`);
  await app.cdp("Input.insertText", { text });
}

/** Waits for the view to show `tabs` tabs, the last of them in front with the one terminal that is displayed. */
function untilInFront(app: BuiltApp, tabs: number): Promise<void> {
  return app.until(
    `!document.getElementById("work-item-view").hidden && document.querySelectorAll("#tabs .tab").length === ${tabs} && document.querySelector("#tabs .tab:last-child").classList.contains("active") && [...document.querySelectorAll("#stage .xterm")].filter((terminal) => terminal.getClientRects().length > 0).length === 1`,
    `${tabs} tabs with the last one's terminal in front`,
  );
}

/** Makes a work item with one shell pane through the "New work item" form, as `korean-pane.ts#openReceiverPane` makes one. Its pane is in front when it returns. */
async function openWorkItem(app: BuiltApp, repo: string, title: string): Promise<void> {
  await app.click("#new-work-item");
  await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
  await fill(app, "work-item-repo", repo);
  await fill(app, "work-item-title", title);
  // The kind's menu is the system's own, which the debugging port does not reach, so the choice is set on the field.
  await app.evaluate(`document.getElementById("work-item-kind").value = "shell"`);
  await app.click("#work-item-create");
  try {
    await untilInFront(app, 1);
  } catch (error) {
    const refused = await app.evaluate<string>(`document.getElementById("work-item-error").textContent`);
    throw new Error(`${(error as Error).message}; the form says: ${refused || "nothing"}`);
  }
}

/** Starts one more shell pane in the view on screen with the pane bar's own button. The window puts a pane it starts in front. */
async function addPane(app: BuiltApp, tabs: number): Promise<void> {
  // The bar names its buttons by the labels the daemon sent, which the form's menu holds by kind.
  const place = await app.evaluate<number>(
    `(() => { const label = "+ " + document.querySelector('#work-item-kind option[value="shell"]').textContent; return [...document.querySelectorAll("#pane-buttons button")].findIndex((button) => button.textContent === label) + 1; })()`,
  );
  if (place === 0) throw new Error("the pane bar has no button for a shell pane");
  await app.click(`#pane-buttons button:nth-child(${place})`);
  await untilInFront(app, tabs);
}

/** A scenario's steps on the window as it opened, answered with the count of panes they leave running. */
const STEPS: Record<Scenario, (app: BuiltApp, repo: string, started: (panes: number) => Promise<void>) => Promise<number>> = {
  inbox: async () => 0,
  one: async (app, repo, started) => {
    await openWorkItem(app, repo, "Memory 1");
    await started(1);
    return 1;
  },
  "eight-in-turn": async (app, repo, started) => {
    for (const item of [0, 1]) {
      await openWorkItem(app, repo, `Memory ${item + 1}`);
      await started(item * 4 + 1);
      for (const tab of [2, 3, 4]) {
        await addPane(app, tab);
        await started(item * 4 + tab);
      }
    }
    return 8;
  },
};

/** What a launch came to: the run, and the processes that were still there after the app was stopped, which were then killed. */
export interface Measured extends Run {
  left: number[];
}

/**
 * One launch of the built app for one scenario: it starts the app with a user
 * data folder, a repository and a worktrees folder of its own, takes the
 * scenario's steps through the window's controls, samples, stops the app and
 * the daemon, and removes the folders. `dist/` is built by the caller.
 */
export async function measure(scenario: Scenario, run: number, start: Start): Promise<Measured> {
  const repository = temporaryRepository("memory");
  let panes: number[] = [];
  let app: BuiltApp | undefined;
  let daemon: number | undefined;
  // A person stops the run with Ctrl-C, which no `finally` outlives. The daemon is no child of the run, so it is ended here.
  const end = (): void => {
    app?.stopNow();
    endNow(panes, 2_000);
    repository.remove();
  };
  const interrupted = (): void => {
    end();
    process.exit(130);
  };
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) process.once(signal, interrupted);
  process.once("exit", end);
  const samples: Sample[] = [];
  let left: number[] = [];
  try {
    app = await BuiltApp.start({ SHELL: PRINTER, OWLERY_WORKTREES: repository.root }, { keepBackground: start === "person" });
    const started = app;
    // An agent's start has no focus of the system's, and its page may be hidden and draw nothing until it is told that it has the focus.
    if (start === "agent") await started.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    await started.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
    const serving = started.daemonPid();
    if (serving === undefined) throw new Error("the daemon wrote no process id");
    daemon = serving;
    const count = await STEPS[scenario](started, repository.repo, (running) => untilPrinters(started.pid, serving, running));
    const began = Date.now();
    for (const at of SAMPLE_SECONDS) {
      await sleep(Math.max(0, began + at * 1000 - Date.now()));
      // The page counts its frames over the second in which the processes are read.
      const page = started.evaluate<PageRead>(PAGE_READ);
      const split = splitProcesses(listed(), started.pid, serving);
      panes = split.panes;
      const bytes = footprintsOf([...split.app.map((process) => process.pid), ...split.panes]);
      const missing = unread(split, bytes);
      if (missing !== null) throw new Error(missing);
      samples.push({ at, ...sums(split, bytes), ...(await page) });
    }
    const running = printers(started.pid, serving).length;
    if (running !== count) throw new Error(`${running} of the scenario's ${count} panes still printed at the last sample`);
  } finally {
    for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) process.off(signal, interrupted);
    process.off("exit", end);
    // The panes' processes as they are now, so a run that failed before its first sample leaves none either.
    if (app && daemon !== undefined) panes = splitProcesses(listed(), app.pid, daemon).panes;
    left = [...((await app?.stop()) ?? []), ...(await untilGone(panes, 5_000))];
    endNow(left, 2_000);
    repository.remove();
  }
  return { scenario, run, start, samples, left };
}
