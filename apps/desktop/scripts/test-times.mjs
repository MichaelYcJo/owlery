// A reporter of the suite, named in `vitest.config.mts` beside vitest's own:
// after a run it prints each layer's file count, the sum of its files' times
// and its longest file, and one line for each file past its layer's file
// budget (layers.mjs). It writes the same as JSON to the file
// `OWLERY_TEST_TIMES` names, and on GitHub the table to the step summary and
// one warning annotation for each file past its budget. It reports and blocks
// nothing: whatever fails in it is one printed line, and the run's exit stays
// the run's own.
import { appendFileSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import { BUDGET_MS, LAYERS } from "./layers.mjs";

/** Milliseconds as seconds with one decimal. */
const seconds = (/** @type {number} */ ms) => `${(ms / 1000).toFixed(1)} s`;

export default class TestTimes {
  /** @param {{ env?: Record<string, string | undefined>, write?: (text: string) => void, now?: () => number }} options */
  constructor({ env = process.env, write = (text) => void process.stdout.write(text), now = Date.now } = {}) {
    this.env = env;
    this.write = write;
    this.now = now;
    this.root = process.cwd();
    this.start = now();
  }

  /** @param {{ config: { root: string } }} vitest */
  onInit(vitest) {
    this.root = vitest.config.root;
  }

  onTestRunStart() {
    this.start = this.now();
  }

  /** @param {readonly { moduleId: string, project: { name: string }, diagnostic: () => { environmentSetupDuration: number, prepareDuration: number, collectDuration: number, setupDuration: number, duration: number } }[]} testModules */
  onTestRunEnd(testModules) {
    try {
      this.report(testModules);
    } catch (error) {
      this.write(`The test times could not be reported: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  /** @param {Parameters<TestTimes["onTestRunEnd"]>[0]} testModules */
  report(testModules) {
    const wallMs = this.now() - this.start;
    const files = testModules
      .map((testModule) => {
        const { environmentSetupDuration, prepareDuration, collectDuration, setupDuration, duration } = testModule.diagnostic();
        const layer = testModule.project.name;
        const ms = Math.round(environmentSetupDuration + prepareDuration + collectDuration + setupDuration + duration);
        const budgetMs = /** @type {Record<string, number | undefined>} */ (BUDGET_MS)[layer] ?? null;
        return { file: relative(this.root, testModule.moduleId), moduleId: testModule.moduleId, layer, ms, budgetMs, over: budgetMs !== null && ms > budgetMs };
      })
      .sort((a, b) => b.ms - a.ms);
    /** @type {Record<string, { files: number, sumMs: number, longestMs: number, longest: string }>} */
    const layers = {};
    const named = [...LAYERS, ...files.map(({ layer }) => layer).filter((layer) => !(/** @type {readonly string[]} */ (LAYERS).includes(layer)))];
    for (const layer of new Set(named)) {
      const own = files.filter((file) => file.layer === layer);
      if (own.length === 0) continue;
      const longest = own[0];
      layers[layer] = { files: own.length, sumMs: own.reduce((sum, { ms }) => sum + ms, 0), longestMs: longest.ms, longest: longest.file };
    }
    const over = files.filter((file) => file.over);
    const budgetOf = (/** @type {string} */ layer) => {
      const budget = /** @type {Record<string, number | undefined>} */ (BUDGET_MS)[layer];
      return budget === undefined ? "none" : seconds(budget);
    };
    const lines = [`Test times against each layer's file budget, in a run of ${seconds(wallMs)} (scripts/layers.mjs):`];
    for (const [layer, { files: count, sumMs, longestMs, longest }] of Object.entries(layers)) {
      lines.push(`  ${layer.padEnd(8)} ${count} ${count === 1 ? "file" : "files"}, ${seconds(sumMs)} in all, the longest ${seconds(longestMs)}, ${longest}; budget ${budgetOf(layer)} a file`);
    }
    for (const file of over) lines.push(`  past its budget: ${file.file}, ${seconds(file.ms)} of the ${file.layer} layer's ${seconds(file.budgetMs ?? 0)}`);
    this.write(`${lines.join("\n")}\n`);

    const target = this.env.OWLERY_TEST_TIMES;
    if (target) {
      const json = { wallMs, layers, files: files.map(({ file, layer, ms, budgetMs, over: past }) => ({ file, layer, ms, budgetMs, over: past })) };
      try {
        writeFileSync(target, `${JSON.stringify(json, null, 2)}\n`);
      } catch (error) {
        this.write(`The test times could not be written to ${target}: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }

    if (this.env.GITHUB_ACTIONS !== "true") return;
    for (const file of over) {
      const named = relative(this.env.GITHUB_WORKSPACE ?? this.root, file.moduleId);
      this.write(`::warning file=${named},title=Past its layer's budget::${file.file} took ${seconds(file.ms)}, past the ${file.layer} layer's file budget of ${seconds(file.budgetMs ?? 0)}\n`);
    }
    const summary = this.env.GITHUB_STEP_SUMMARY;
    if (!summary) return;
    const table = [`### Test times, in a run of ${seconds(wallMs)}`, "", "| Layer | Files | In all | Longest | Budget a file |", "|---|---|---|---|---|"];
    for (const [layer, { files: count, sumMs, longestMs, longest }] of Object.entries(layers)) table.push(`| ${layer} | ${count} | ${seconds(sumMs)} | ${seconds(longestMs)}, \`${longest}\` | ${budgetOf(layer)} |`);
    if (over.length > 0) table.push("", `Past its budget: ${over.map((file) => `\`${file.file}\` ${seconds(file.ms)} of ${seconds(file.budgetMs ?? 0)}`).join(", ")}.`);
    try {
      appendFileSync(summary, `${table.join("\n")}\n`);
    } catch (error) {
      this.write(`The test times could not be written to the step summary ${summary}: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }
}
