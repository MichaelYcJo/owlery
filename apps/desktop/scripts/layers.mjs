// The layers of the desktop app's suite. Each test file opens with the line
// `// layer: <name>`, and `vitest.config.mts` runs it in the project of that
// name, under that layer's guards. What a case of each layer may do:
//
// - `logic`: call code in its own process, and read and write files under a
//   temporary folder. A starter of `node:child_process` throws.
// - `process`: also start git or another process, and build a world.
//   node-pty's `spawn` throws.
// - `pty`: also start a `Daemon`, a pane or a pty. `buildApp` and
//   `BuiltApp.start` of `test/built-app.ts` throw.
// - `app`: also start the built app. Its files run one at a time, after the
//   other three layers.
//
// The reporter `test-times.mjs` reports each file's time against its layer's
// file budget, in milliseconds, after a run, and blocks nothing.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** The four layers, from the one whose cases may do least. */
export const LAYERS = /** @type {const} */ (["logic", "process", "pty", "app"]);

/** Each layer's budget for one file, in milliseconds. */
export const BUDGET_MS = { logic: 5_000, process: 60_000, pty: 60_000, app: 100_000 };

/** The layer a test file's first line names, or null where the line is no layer line. */
export function layerOf(/** @type {string} */ firstLine) {
  const named = /^\/\/ layer: (logic|process|pty|app)$/.exec(firstLine);
  return named === null ? null : /** @type {(typeof LAYERS)[number]} */ (named[1]);
}

/**
 * The test files under the folder `test` of `root`, by the layer each one's
 * first line names, as paths from `root`. It throws, naming each test file
 * whose first line is no layer line, and the four lines it reads.
 */
export function filesByLayer(/** @type {string} */ root) {
  /** @type {Record<(typeof LAYERS)[number], string[]>} */
  const files = { logic: [], process: [], pty: [], app: [] };
  const unnamed = [];
  const names = /** @type {string[]} */ (readdirSync(join(root, "test"), { recursive: true, encoding: "utf8" }));
  for (const name of names.filter((path) => path.endsWith(".test.ts")).sort()) {
    const file = `test/${name}`;
    const layer = layerOf(readFileSync(join(root, file), "utf8").split("\n", 1)[0] ?? "");
    if (layer === null) unnamed.push(file);
    else files[layer].push(file);
  }
  if (unnamed.length > 0) {
    const lines = LAYERS.map((layer) => `\`// layer: ${layer}\``);
    throw new Error(`These test files open with no layer line: ${unnamed.join(", ")}. A test file's first line names its layer, and is one of ${lines.slice(0, -1).join(", ")} and ${lines.at(-1)}. scripts/layers.mjs says what a case of each layer may do.`);
  }
  return files;
}
