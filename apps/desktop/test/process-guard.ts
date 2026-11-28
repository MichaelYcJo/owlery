// The guard of the `logic` layer (scripts/layers.mjs), the project's setup
// file: it makes each starter of `node:child_process` throw, before the test
// file is imported. It replaces the built-in module's own exports, which
// `require` gives, and which an import of the module takes as it is first
// imported in the worker, after this file. So a starter throws whether the
// code reached it through vitest's import, `require`, or a package vitest
// leaves to Node to load (`test/layers.test.ts`).
import { createRequire } from "node:module";

const STARTERS = ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"] as const;

const childProcess = createRequire(import.meta.url)("node:child_process") as Record<(typeof STARTERS)[number], unknown>;
for (const name of STARTERS) {
  childProcess[name] = () => {
    throw new Error(`A case of a \`logic\` file started a process with ${name}. A file whose cases start git or another process opens with \`// layer: process\`.`);
  };
}
