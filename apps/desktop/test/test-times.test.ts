// layer: logic
// The reporter `scripts/test-times.mjs`, which reports after a run each
// layer's times against its file budget. Each case hands the reporter the
// modules vitest would, with the project and the times a case gives them, a
// clock of its own and an environment of its own, and reads what it printed
// and what it wrote.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import TestTimes from "../scripts/test-times.mjs";

const ROOT = "/w/owlery/apps/desktop";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function folder(): string {
  const dir = mkdtempSync(join(tmpdir(), "owlery-test-times-"));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** A module as vitest hands it to a reporter, whose times sum to `ms`: the setup of its environment, its preparation, its collection and its setup files take 1 ms each, and its cases and hooks the rest. */
function module(file: string, layer: string, ms: number) {
  return {
    moduleId: `${ROOT}/${file}`,
    project: { name: layer },
    diagnostic: () => ({ environmentSetupDuration: 1, prepareDuration: 1, collectDuration: 1, setupDuration: 1, duration: ms - 4 }),
  };
}

const MODULES = [
  module("test/a.test.ts", "logic", 800),
  module("test/b.test.ts", "logic", 6_200),
  module("test/chain.test.ts", "pty", 575_000),
  module("test/gate.test.ts", "pty", 12_500),
  module("test/menu.test.ts", "app", 40_000),
];

/** Runs the reporter over the modules, in a run of `wallMs` by its clock, and gives what it printed. */
async function report(env: Record<string, string>, modules: Parameters<TestTimes["onTestRunEnd"]>[0] = MODULES, wallMs = 590_000): Promise<string> {
  const printed: string[] = [];
  let clock = 1_000;
  const reporter = new TestTimes({ env, write: (text: string) => printed.push(text), now: () => clock });
  reporter.onInit({ config: { root: ROOT } });
  reporter.onTestRunStart();
  clock += wallMs;
  // Vitest also hands the errors no case caught and why the run ended, which the reporter does not read.
  reporter.onTestRunEnd(modules);
  return printed.join("");
}

describe("the report of a run's times", () => {
  it("prints each layer's file count, the sum and the longest file, and one line for each file past its layer's file budget", async () => {
    expect(await report({})).toBe(
      [
        "Test times against each layer's file budget, in a run of 590.0 s (scripts/layers.mjs):",
        "  logic    2 files, 7.0 s in all, the longest 6.2 s, test/b.test.ts; budget 5.0 s a file",
        "  pty      2 files, 587.5 s in all, the longest 575.0 s, test/chain.test.ts; budget 60.0 s a file",
        "  app      1 file, 40.0 s in all, the longest 40.0 s, test/menu.test.ts; budget 100.0 s a file",
        "  past its budget: test/chain.test.ts, 575.0 s of the pty layer's 60.0 s",
        "  past its budget: test/b.test.ts, 6.2 s of the logic layer's 5.0 s",
        "",
      ].join("\n"),
    );
  });

  it("writes the same as JSON to the file OWLERY_TEST_TIMES names", async () => {
    const file = join(folder(), "times.json");
    await report({ OWLERY_TEST_TIMES: file });
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({
      wallMs: 590_000,
      layers: {
        logic: { files: 2, sumMs: 7_000, longestMs: 6_200, longest: "test/b.test.ts" },
        pty: { files: 2, sumMs: 587_500, longestMs: 575_000, longest: "test/chain.test.ts" },
        app: { files: 1, sumMs: 40_000, longestMs: 40_000, longest: "test/menu.test.ts" },
      },
      files: [
        { file: "test/chain.test.ts", layer: "pty", ms: 575_000, budgetMs: 60_000, over: true },
        { file: "test/menu.test.ts", layer: "app", ms: 40_000, budgetMs: 100_000, over: false },
        { file: "test/gate.test.ts", layer: "pty", ms: 12_500, budgetMs: 60_000, over: false },
        { file: "test/b.test.ts", layer: "logic", ms: 6_200, budgetMs: 5_000, over: true },
        { file: "test/a.test.ts", layer: "logic", ms: 800, budgetMs: 5_000, over: false },
      ],
    });
  });

  it("writes on GitHub the table to the step summary and one warning annotation for each file past its budget, named from the workspace", async () => {
    const summary = join(folder(), "summary.md");
    writeFileSync(summary, "what an earlier step wrote\n");
    const printed = await report({ GITHUB_ACTIONS: "true", GITHUB_STEP_SUMMARY: summary, GITHUB_WORKSPACE: "/w/owlery" });
    expect(printed.split("\n").filter((line) => line.startsWith("::"))).toEqual([
      "::warning file=apps/desktop/test/chain.test.ts,title=Past its layer's budget::test/chain.test.ts took 575.0 s, past the pty layer's file budget of 60.0 s",
      "::warning file=apps/desktop/test/b.test.ts,title=Past its layer's budget::test/b.test.ts took 6.2 s, past the logic layer's file budget of 5.0 s",
    ]);
    expect(readFileSync(summary, "utf8")).toBe(
      [
        "what an earlier step wrote",
        "### Test times, in a run of 590.0 s",
        "",
        "| Layer | Files | In all | Longest | Budget a file |",
        "|---|---|---|---|---|",
        "| logic | 2 | 7.0 s | 6.2 s, `test/b.test.ts` | 5.0 s |",
        "| pty | 2 | 587.5 s | 575.0 s, `test/chain.test.ts` | 60.0 s |",
        "| app | 1 | 40.0 s | 40.0 s, `test/menu.test.ts` | 100.0 s |",
        "",
        "Past its budget: `test/chain.test.ts` 575.0 s of 60.0 s, `test/b.test.ts` 6.2 s of 5.0 s.",
        "",
      ].join("\n"),
    );
  });

  it("writes nothing for GitHub off GitHub, and prints no line past a budget where every file is within its own", async () => {
    const summary = join(folder(), "summary.md");
    const printed = await report({ GITHUB_STEP_SUMMARY: summary }, [module("test/a.test.ts", "logic", 5_000)], 5_100);
    expect(printed).toBe("Test times against each layer's file budget, in a run of 5.1 s (scripts/layers.mjs):\n  logic    1 file, 5.0 s in all, the longest 5.0 s, test/a.test.ts; budget 5.0 s a file\n");
    expect(() => readFileSync(summary)).toThrow("ENOENT");
  });

  it("never throws, so the run's exit stays its own: a file it cannot write and a module it cannot read each print one line", async () => {
    const unwritable = join(folder(), "no-such-folder", "times.json");
    const printed = await report({ OWLERY_TEST_TIMES: unwritable }, [module("test/a.test.ts", "logic", 800)]);
    expect(printed.split("\n").at(-2)).toMatch(/^The test times could not be written to .*no-such-folder\/times\.json: ENOENT/);
    const broken = { moduleId: `${ROOT}/test/x.test.ts`, project: { name: "logic" }, diagnostic: () => { throw new Error("no diagnostic"); } };
    expect(await report({}, [broken])).toBe("The test times could not be reported: no diagnostic\n");
  });
});
