// Runs the release's settle, `src/daemon/settle-main.ts`, on the Node that
// runs this script. The daemon's files import without extensions, so Node
// cannot run them as they stand: esbuild bundles the entry, as `build.mjs`
// bundles the daemon, and the bundle runs in this process from memory. No
// file is written, so a run that is killed leaves nothing on the disk.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import * as esbuild from "esbuild";

const entry = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "daemon", "settle-main.ts");
const built = await esbuild.build({ entryPoints: [entry], bundle: true, platform: "node", format: "cjs", write: false, logLevel: "warning" });
await esbuild.stop();
const bundle = built.outputFiles[0].text;
const module = { exports: {} };
runInThisContext(`(function (require, module, exports) {${bundle}\n})`, { filename: `${entry}, bundled` })(createRequire(entry), module, module.exports);
