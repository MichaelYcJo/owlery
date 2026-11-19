// The memory measurement: the built app's memory, read with macOS's
// `footprint`, one launch for each scenario and run. `pnpm run measure:memory`
// sets `OWLERY_MEASURE_MEMORY` and takes it. Without the variable the file is
// the cases of the measurement's own functions, and starts no app.
import { execFileSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "./built-app";
import { versions } from "./korean-pane";
import {
  footprints,
  measure,
  planOf,
  PRINTER,
  processRows,
  type Run,
  type Sample,
  splitProcesses,
  startOf,
  sums,
  tables,
  thrownAway,
  unread,
} from "./memory";

/** The measurement, started by `pnpm run measure:memory`. Without it the file is the cases. */
const MEASURE = process.env.OWLERY_MEASURE_MEMORY === "1";

describe.skipIf(MEASURE)("the memory measurement, without the app", () => {
  // What `footprint --noCategories -f bytes <pid> <pid>` printed on macOS 26.5 for two processes, one of them with a space in its name.
  const printed = [
    "======================================================================",
    "Electron Helper (GPU) [62620]: 64-bit    Footprint: 2539856 B (16384 bytes per page)",
    "======================================================================",
    "",
    "Auxiliary data:",
    "    phys_footprint: 2556240 B",
    "    phys_footprint_peak: 2556240 B",
    "",
    "======================================================================",
    "sleep [62622]: 64-bit    Footprint: 852160 B (16384 bytes per page)",
    "======================================================================",
    "",
    "Auxiliary data:",
    "    phys_footprint: 868544 B",
    "    phys_footprint_peak: 884928 B",
    "",
    "======================================================================",
    "Summary Footprint: 3359248 B",
    "======================================================================",
    "",
  ].join("\n");

  it("reads each process's footprint from what `footprint` prints, and neither the summary nor the peak", () => {
    expect([...footprints(printed)]).toEqual([
      [62620, 2539856],
      [62622, 852160],
    ]);
  });

  it("reads nothing where `footprint` found no process", () => {
    expect(footprints("").size).toBe(0);
  });

  // What `ps -axo pid=,ppid=,command=` prints: the app the measurement started, its daemon with two panes, and another Electron app.
  const helper = "/repo/node_modules/electron/dist/Electron.app/Contents/Frameworks/Electron Helper";
  const listed = [
    "    1     0 /sbin/launchd",
    "  100     1 /repo/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron /repo/apps/desktop --remote-debugging-port=5000 --user-data-dir=/tmp/owlery-app-1",
    `  101   100 ${helper} (GPU).app/Contents/MacOS/Electron Helper (GPU) --type=gpu-process --user-data-dir=/tmp/owlery-app-1`,
    `  102   100 ${helper}.app/Contents/MacOS/Electron Helper --type=utility --utility-sub-type=network.mojom.NetworkService`,
    `  103   100 ${helper} (Renderer).app/Contents/MacOS/Electron Helper (Renderer) --type=renderer --user-data-dir=/tmp/owlery-app-1`,
    "  104   100 /repo/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron /repo/apps/desktop/dist/daemon.js",
    "  105   104 /bin/sh /repo/apps/desktop/test/fixtures/printer.sh -l",
    "  106   105 sleep 0.1",
    "  107   104 /bin/sh /repo/apps/desktop/test/fixtures/printer.sh -l",
    "  108   100 /repo/node_modules/electron/dist/Electron.app/Contents/Frameworks/Electron Framework.framework/Helpers/chrome_crashpad_handler --no-rate-limit",
    "  900     1 /Applications/Other.app/Contents/MacOS/Other",
    "  901   900 /Applications/Other.app/Contents/Frameworks/Other Helper (GPU).app/Contents/MacOS/Other Helper (GPU) --type=gpu-process",
    "",
  ].join("\n");

  it("reads the processes `ps` lists, a command with spaces whole", () => {
    const rows = processRows(listed);
    expect(rows).toHaveLength(12);
    expect(rows[0]).toEqual({ pid: 1, ppid: 0, command: "/sbin/launchd" });
    expect(rows[2]).toEqual({ pid: 101, ppid: 100, command: `${helper} (GPU).app/Contents/MacOS/Electron Helper (GPU) --type=gpu-process --user-data-dir=/tmp/owlery-app-1` });
  });

  it("takes the main process, every process below it and the daemon for the app itself, each by its kind", () => {
    expect(splitProcesses(processRows(listed), 100, 104).app).toEqual([
      { pid: 100, kind: "main" },
      { pid: 101, kind: "gpu" },
      { pid: 102, kind: "utility" },
      { pid: 103, kind: "renderer" },
      { pid: 104, kind: "daemon" },
      { pid: 108, kind: "other" },
    ]);
  });

  it("takes every process below the daemon for the panes', and none of them for the app itself", () => {
    const split = splitProcesses(processRows(listed), 100, 104);
    expect(split.panes).toEqual([105, 106, 107]);
    expect(split.app.map((process) => process.pid).filter((pid) => split.panes.includes(pid))).toEqual([]);
  });

  it("counts a daemon that is no child of the app with the app itself, and the panes below it apart", () => {
    // A daemon an earlier start left answers to the system's first process.
    const rows = processRows(listed).map((row) => (row.pid === 104 ? { ...row, ppid: 1 } : row));
    const split = splitProcesses(rows, 100, 104);
    expect(split.app.map((process) => process.pid)).toEqual([100, 101, 102, 103, 108, 104]);
    expect(split.panes).toEqual([105, 106, 107]);
  });

  it("says which processes of the app `footprint` gave no number for, and nothing of the panes'", () => {
    const split = splitProcesses(processRows(listed), 100, 104);
    // `footprint` read neither the GPU process, the renderer, nor two of the panes' three.
    const bytes = new Map([
      [100, 60],
      [102, 5],
      [104, 20],
      [108, 1],
      [105, 2],
    ]);
    expect(unread(split, bytes)).toBe("`footprint` gave no number for the gpu process 101, the renderer process 103, so the sum is not the app's. The measurement is macOS's.");
  });

  it("says nothing where `footprint` read every process of the app, though it read none of the panes'", () => {
    const split = splitProcesses(processRows(listed), 100, 104);
    const bytes = new Map([100, 101, 102, 103, 104, 108].map((pid) => [pid, 1]));
    expect(unread(split, bytes)).toBeNull();
  });

  it("sums the app itself and the panes' processes apart, and the app itself by kind", () => {
    const split = splitProcesses(processRows(listed), 100, 104);
    // The pane's `sleep` ended between `ps` and `footprint`, which then prints no line for it.
    const bytes = new Map([
      [100, 60],
      [101, 300],
      [102, 5],
      [103, 40],
      [104, 20],
      [108, 1],
      [105, 2],
      [107, 3],
    ]);
    expect(sums(split, bytes)).toEqual({ app: 426, panes: 5, byKind: { main: 60, renderer: 40, gpu: 300, utility: 5, daemon: 20, other: 1 } });
  });

  it("adds two processes of one kind", () => {
    const split = { app: [{ pid: 1, kind: "main" as const }, { pid: 2, kind: "utility" as const }, { pid: 3, kind: "utility" as const }], panes: [] };
    expect(sums(split, new Map([[1, 10], [2, 4], [3, 5]])).byKind.utility).toBe(9);
  });

  const drawn: Sample = { at: 20, app: 100 * 1_048_576, panes: 1_048_576, byKind: { main: 0, renderer: 0, gpu: 0, utility: 0, daemon: 0, other: 0 }, visibility: "visible", focused: true, frames: 60, terminals: 1, displayed: 1, canvases: 3 };
  const at = (seconds: number, changed: Partial<Sample> = {}): Sample => ({ ...drawn, at: seconds, ...changed });

  it("keeps a run whose every sample was taken of a page that was visible and drew", () => {
    expect(thrownAway([at(20), at(25), at(30)], "agent")).toBeNull();
    expect(thrownAway([at(20), at(25), at(30)], "person")).toBeNull();
  });

  it("throws a run away where one sample was taken while the page was hidden, and says at which", () => {
    expect(thrownAway([at(20), at(25, { visibility: "hidden" }), at(30)], "agent")).toBe("the page was hidden at 25 s");
  });

  it("throws a run away where one sample was taken while the page drew no frame, and says at which", () => {
    expect(thrownAway([at(20), at(25), at(30, { frames: 0 })], "agent")).toBe("the page drew no frame at 30 s");
  });

  it("throws a person's run away where one sample was taken while the window did not have the focus", () => {
    expect(thrownAway([at(20, { focused: false }), at(25), at(30)], "person")).toBe("the window did not have the focus at 20 s");
  });

  it("keeps an agent's run whatever the page says of the focus, which such a run emulates", () => {
    expect(thrownAway([at(20, { focused: false }), at(25), at(30)], "agent")).toBeNull();
  });

  it("throws a run with no sample away", () => {
    expect(thrownAway([], "agent")).toBe("the run took no sample");
  });

  it("measures every scenario three times where the environment names neither", () => {
    expect(planOf({})).toEqual({ scenarios: ["inbox", "one", "eight-in-turn"], runs: 3 });
  });

  it("measures the scenarios and the count of runs the environment names, in the order it names them", () => {
    expect(planOf({ OWLERY_MEMORY_SCENARIOS: "eight-in-turn, inbox", OWLERY_MEMORY_RUNS: "1" })).toEqual({ scenarios: ["eight-in-turn", "inbox"], runs: 1 });
  });

  it("refuses a scenario it does not have, and names the ones it has", () => {
    expect(() => planOf({ OWLERY_MEMORY_SCENARIOS: "one,nine" })).toThrow('OWLERY_MEMORY_SCENARIOS names "nine". The scenarios are inbox, one, eight-in-turn.');
  });

  it("refuses a count of runs that is no whole number above zero", () => {
    for (const runs of ["0", "-1", "1.5", "three", ""]) expect(() => planOf({ OWLERY_MEMORY_RUNS: runs }), runs).toThrow(`OWLERY_MEMORY_RUNS is "${runs}". It is a whole number above zero.`);
  });

  it("reads the kind of start from the switch the app reads", () => {
    expect(startOf({ OWLERY_BACKGROUND: "1" })).toBe("agent");
    expect(startOf({})).toBe("person");
    expect(startOf({ OWLERY_BACKGROUND: "0" })).toBe("person");
  });

  const mb = (megabytes: number): number => megabytes * 1_048_576;
  const kept: Run = {
    scenario: "one",
    run: 2,
    start: "agent",
    samples: [
      at(20, { app: mb(457.04), panes: mb(1.3) }),
      at(25, { app: mb(462.26), panes: mb(1.34), frames: 62 }),
      at(30, { app: mb(461), panes: mb(1.3), byKind: { main: mb(64), renderer: mb(65), gpu: mb(306), utility: mb(8), daemon: mb(18), other: 0 } }),
    ],
  };
  const hidden: Run = { scenario: "inbox", run: 1, start: "person", samples: [at(20), at(25, { visibility: "hidden" }), at(30)] };

  it("prints one row for a run, its three samples in one cell and its highest beside them", () => {
    expect(tables([kept]).split("\n").slice(0, 3)).toEqual([
      "| Scenario | Run | Start | App itself, MB, at 20 s / 25 s / 30 s | Highest, MB | Panes' processes, MB | Terminals | Displayed | Canvases | Frames a second |",
      "|---|---|---|---|---|---|---|---|---|---|",
      "| one | 2 | agent | 457.0 / 462.3 / 461.0 | 462.3 | 1.3 / 1.3 / 1.3 | 1 / 1 / 1 | 1 / 1 / 1 | 3 / 3 / 3 | 60 / 62 / 60 |",
    ]);
  });

  it("prints the last sample of a run by the kind of its processes", () => {
    expect(tables([kept]).split("\n").slice(4, 7)).toEqual([
      "| Scenario | Run | Main | Renderer | GPU | Utility | Daemon | Other | App itself, MB, at 30 s |",
      "|---|---|---|---|---|---|---|---|---|",
      "| one | 2 | 64.0 | 65.0 | 306.0 | 8.0 | 18.0 | 0.0 | 461.0 |",
    ]);
  });

  it("prints no number of a run that is thrown away, and says why in its row", () => {
    const lines = tables([hidden, kept]).split("\n");
    expect(lines[2]).toBe("| inbox | 1 | person | thrown away: the page was hidden at 25 s | | | | | | |");
    expect(lines.filter((line) => line.startsWith("| inbox |"))).toHaveLength(1);
    expect(lines.filter((line) => line.startsWith("| one |"))).toHaveLength(2);
  });

  it("says under the tables what each kind of start is, and what 1 MB is", () => {
    expect(tables([kept]).split("\n").slice(8)).toEqual([
      "A start `agent` is made under `OWLERY_BACKGROUND=1`, with the page told that it has the focus. A start `person` is the app as it ships, with the system's focus.",
      "1 MB is 1,048,576 bytes. The app itself is the main process, every process below it and the daemon. The panes' processes are the ones below the daemon.",
    ]);
  });

  it("has a pane's process that exits at once and prints nothing where its input is no terminal", () => {
    // The daemon runs $SHELL that way to look for `claude`, and a printer that stayed would never let that look end.
    expect(execFileSync(PRINTER, ["-l", "-i", "-c", "true"], { stdio: ["pipe", "pipe", "ignore"], timeout: 2_000 }).length).toBe(0);
  });
});

describe.runIf(MEASURE)("the memory measurement", () => {
  // A skipped suite's body still runs when the file is collected, so the two variables are read only where the measurement runs: a stray one would otherwise fail the cases above.
  const plan: ReturnType<typeof planOf> = MEASURE ? planOf(process.env) : { scenarios: [], runs: 0 };
  const start = startOf(process.env);
  const runs: Run[] = [];

  beforeAll(() => {
    buildApp();
  }, 120_000);

  afterAll(() => {
    const { date, macos, electron, xterm } = versions(new Date());
    // Written to the run's own output: the suite's runner shows nothing a case or a hook hands to `console.log`.
    process.stdout.write(`\nMeasured ${date} on macOS ${macos}, Electron ${electron}, xterm.js ${xterm}.\n\n${tables(runs)}\n\n`);
  });

  const launches = plan.scenarios.flatMap((scenario) => Array.from({ length: plan.runs }, (_, index) => ({ scenario, run: index + 1 })));

  // A launch waits 30 seconds after its last step, and the last scenario makes eight panes before that.
  it.each(launches)("measures $scenario, run $run", { timeout: 300_000 }, async ({ scenario, run }) => {
    const measured = await measure(scenario, run, start);
    runs.push(measured);
    expect(measured.left, "the processes that were still there after the stop").toEqual([]);
    expect(thrownAway(measured.samples, start), "the run is thrown away").toBeNull();
  });
});
