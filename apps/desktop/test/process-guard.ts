// The guard of the `logic` layer (scripts/layers.mjs), the project's setup
// file: it makes each starter of `node:child_process` throw, before the test
// file is imported. It replaces the built-in module's own exports and syncs
// its ESM bindings to them, so a starter throws whether the code reached it
// through an import, a namespace import or `require`.
import { createRequire, syncBuiltinESMExports } from "node:module";

const STARTERS = ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"] as const;

const childProcess = createRequire(import.meta.url)("node:child_process") as Record<(typeof STARTERS)[number], unknown>;
for (const name of STARTERS) {
  childProcess[name] = () => {
    throw new Error(`A case of a \`logic\` file started a process with ${name}. A file whose cases start git or another process opens with \`// layer: process\`.`);
  };
}
syncBuiltinESMExports();
