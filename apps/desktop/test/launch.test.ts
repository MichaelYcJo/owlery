// The launch measurement: what a launch of the built app costs, against a
// reset of one app left open, as many times each as the run names.
// `pnpm run measure:launch` sets `OWLERY_MEASURE_LAUNCH` and takes it. Without
// the variable the file is the cases of the measurement's own functions, and
// starts no app.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "./built-app";
import { versions } from "./korean-pane";
import { judged, type Launch, launchOnce, type Memory, type Reset, resets, runsOf, saving, spread, tables } from "./launch";
import { heading, treeNow } from "./memory";

/** The measurement, started by `pnpm run measure:launch`. Without it the file is the cases. */
const MEASURE = process.env.OWLERY_MEASURE_LAUNCH === "1";

describe.skipIf(MEASURE)("the launch measurement, without the app", () => {
  it("gives the middle value of an odd count, and the lowest and the highest, whatever their order", () => {
    expect(spread([3, 1, 2])).toEqual({ median: 2, lowest: 1, highest: 3 });
  });

  it("gives the mean of the two middle values of an even count", () => {
    expect(spread([4, 1, 3, 2])).toEqual({ median: 2.5, lowest: 1, highest: 4 });
  });

  it("measures ten launches and ten resets where the environment names no count", () => {
    expect(runsOf({})).toBe(10);
  });

  it("measures the count of launches and of resets the environment names", () => {
    expect(runsOf({ OWLERY_LAUNCH_RUNS: "3" })).toBe(3);
  });

  it("refuses a count that is no whole number above zero, and names the variable", () => {
    for (const runs of ["0", "-1", "1.5", "ten", ""]) expect(() => runsOf({ OWLERY_LAUNCH_RUNS: runs }), runs).toThrow(`OWLERY_LAUNCH_RUNS is "${runs}". It is a whole number above zero.`);
  });

  // What `ps eww -o command= -p <pid>` prints for a daemon: its command, then its environment.
  const daemon = "/repo/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron /repo/apps/desktop/dist/daemon.js";
  const environment = (mark: string): string => `${daemon} SHELL=/usr/bin/true ${mark} OWLERY_RUN_DIR=/tmp/owlery-app-1/run ELECTRON_RUN_AS_NODE=1`;
  const reset = { before: 200, after: 300, environment: environment("OWLERY_LAUNCH_MARK=reset-1"), mark: "OWLERY_LAUNCH_MARK=reset-1", leftover: false };

  it("passes a reset after which a new daemon runs with the value the reset set, and the run folder holds nothing from before", () => {
    expect(judged(reset)).toBeNull();
  });

  it("reads the value the reset set where it stands last in the daemon's environment", () => {
    expect(judged({ ...reset, environment: `${daemon} OWLERY_LAUNCH_MARK=reset-1` })).toBeNull();
  });

  it("fails a reset after which the run folder names the daemon from before it", () => {
    expect(judged({ ...reset, after: 200 })).toBe("the daemon 200 from before the reset is still the one the run folder names");
  });

  it("fails a reset after which the run folder names no daemon", () => {
    expect(judged({ ...reset, after: undefined })).toBe("the run folder names no daemon after the reset");
  });

  it("fails a reset whose daemon's environment lacks the value the reset set", () => {
    expect(judged({ ...reset, environment: environment("OWLERY_LAUNCH_MARK=start") })).toBe("the environment of the daemon 300 does not hold OWLERY_LAUNCH_MARK=reset-1");
  });

  it("does not take a longer value that begins with the one the reset set for that value", () => {
    expect(judged({ ...reset, environment: environment("OWLERY_LAUNCH_MARK=reset-10") })).toBe("the environment of the daemon 300 does not hold OWLERY_LAUNCH_MARK=reset-1");
  });

  it("fails a reset after which the run folder still holds the file written before it", () => {
    expect(judged({ ...reset, leftover: true })).toBe("the run folder still holds the file written before the reset");
  });

  it("names every reading that failed", () => {
    expect(judged({ ...reset, after: 200, environment: environment("OWLERY_LAUNCH_MARK=start"), leftover: true })).toBe(
      "the daemon 200 from before the reset is still the one the run folder names; the environment of the daemon 200 does not hold OWLERY_LAUNCH_MARK=reset-1; the run folder still holds the file written before the reset",
    );
  });

  // Three launches and three resets whose sums' medians are not the sums of their parts' medians. Two values hold a fraction of a millisecond, as a timed part does, and print whole.
  const launches: Launch[] = [
    { build: 100.4, start: 300, ready: 200, stop: 100 },
    { build: 200, start: 250, ready: 250, stop: 150 },
    { build: 120, start: 400, ready: 180, stop: 160 },
  ];
  const resetRuns: Reset[] = [
    { away: 10, daemonEnded: 50, emptied: 1, environment: 2, back: 30, ready: 180 },
    { away: 40, daemonEnded: 60, emptied: 1, environment: 1, back: 28, ready: 250 },
    { away: 5, daemonEnded: 52, emptied: 2, environment: 1, back: 31, ready: 210.4 },
  ];
  const mb = (megabytes: number): number => megabytes * 1_048_576;
  const memory: Memory = { launched: mb(457.04), open: mb(462.26), reset: mb(461) };

  it("saves the median of a launch's sum without its build, less the median of a reset's sum", () => {
    // 600, 650 and 740 without the build; 273, 380 and 301.4 for the resets.
    expect(saving(launches, resetRuns)).toBeCloseTo(348.6, 9);
  });

  it("prints each part of a launch and the launch's sum, with the median, the lowest and the highest of the runs", () => {
    expect(tables(launches, resetRuns, memory).split("\n").slice(0, 7)).toEqual([
      "| A launch, ms, of 3 | Median | Lowest | Highest |",
      "|---|---|---|---|",
      "| Build: `buildApp` | 120 | 100 | 200 |",
      "| Start: until `BuiltApp.start` returned | 300 | 250 | 400 |",
      '| Ready: until the status line read "Daemon running, no agent" | 200 | 180 | 250 |',
      "| Stop: `stop` | 150 | 100 | 160 |",
      "| The launch's sum | 850 | 700 | 860 |",
    ]);
  });

  it("prints each part of a reset and the reset's sum, with the median, the lowest and the highest of the runs", () => {
    expect(tables(launches, resetRuns, memory).split("\n").slice(8, 17)).toEqual([
      "| A reset of the open app, ms, of 3 | Median | Lowest | Highest |",
      "|---|---|---|---|",
      "| 1. The window loaded about:blank | 10 | 5 | 40 |",
      "| 2. The daemon ended at SIGTERM | 52 | 50 | 60 |",
      "| 3. The run folder and appearance.json were emptied | 1 | 1 | 2 |",
      "| 4. The main process's environment was set | 1 | 1 | 2 |",
      "| 5. The window loaded the app's page again | 30 | 28 | 31 |",
      '| 6. Ready: until the status line read "Daemon running, no agent" | 210 | 180 | 250 |',
      "| The reset's sum | 301 | 273 | 380 |",
    ]);
  });

  it("says what one open app saves for each launch, and the two medians it is the difference of", () => {
    expect(tables(launches, resetRuns, memory).split("\n")[18]).toBe(
      "One open app saves 349 ms for each launch: the median of a launch's sum without its build, 650 ms, less the median of a reset's sum, 301 ms.",
    );
  });

  it("prints the app itself in MB, 5 s after ready, in the first app launched and in the open app before its first reset and after its last", () => {
    expect(tables(launches, resetRuns, memory).split("\n").slice(20)).toEqual([
      "| The app itself, MB, 5 s after ready | |",
      "|---|---|",
      "| The first app launched | 457.0 |",
      "| The open app, before its first reset | 462.3 |",
      "| The open app, after its last reset | 461.0 |",
      "",
      'Ready is the status line reading "Daemon running, no agent", read every 10 ms. The start asks the debugging port every 200 ms, and the stop and part 2 of a reset look for the process\'s end every 50 ms, so each holds up to one such step. 1 MB is 1,048,576 bytes. The app itself is the main process, every process below it and the daemon.',
    ]);
  });
});

describe.runIf(MEASURE)("the launch measurement", () => {
  // A skipped suite's body still runs when the file is collected, so the variable is read only where the measurement runs: a stray one would otherwise fail the cases above.
  const runs = MEASURE ? runsOf(process.env) : 0;
  const launched: Launch[] = [];
  const reset: Reset[] = [];
  const memory: Partial<Memory> = {};
  let tree = { commit: "", changed: false };
  let worktrees = "";
  // The cases that passed whole. A run in which one failed prints no table: its numbers would be of a launch or a reset that did not do what it says.
  let passed = 0;
  // No shell of the person's and no `claude` starts, and no pane is opened, so the measurement takes no pseudo-terminal.
  const env = (): Record<string, string> => ({ SHELL: "/usr/bin/true", OWLERY_WORKTREES: worktrees });

  beforeAll(() => {
    // Each file of the suite builds after the file before it built, so the system has the files a build reads cached. This build, which is not timed, makes the first timed one such a build.
    buildApp();
    tree = treeNow();
    worktrees = mkdtempSync(join(tmpdir(), "owlery-launch-"));
  }, 120_000);

  afterAll(() => {
    rmSync(worktrees, { recursive: true, force: true });
    if (passed !== 2) return;
    // Written to the run's own output: the suite's runner shows nothing a case or a hook hands to `console.log`.
    process.stdout.write(`\n${heading(versions(new Date()), tree)}\n\n${tables(launched, reset, memory as Memory)}\n\n`);
  });

  it("launches the app, builds it before each launch and stops it after", { timeout: 600_000 }, async () => {
    for (let run = 1; run <= runs; run += 1) {
      const one = await launchOnce(env(), run === 1);
      expect(one.left, "the processes that were still there after the stop").toEqual([]);
      launched.push(one.parts);
      if (one.footprint !== undefined) memory.launched = one.footprint;
    }
    passed += 1;
  });

  it("resets one open app, and reads after each reset that it reset", { timeout: 600_000 }, async () => {
    const open = await resets(env(), runs);
    expect(open.left, "the processes that were still there after the stop").toEqual([]);
    reset.push(...open.parts);
    memory.open = open.before;
    memory.reset = open.after;
    passed += 1;
  });
});
