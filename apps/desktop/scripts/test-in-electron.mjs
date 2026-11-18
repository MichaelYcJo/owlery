// Runs vitest inside Electron's Node, because node-pty is rebuilt for
// Electron's ABI and cannot load in the system Node.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const electron = require("electron");
// vitest does not export its CLI entry, so it is reached by path.
const vitest = join(dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "vitest", "vitest.mjs");

const result = spawnSync(electron, [vitest, "run", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
});
process.exit(result.status ?? 1);
