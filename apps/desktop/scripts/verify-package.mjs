// Checks a packaged `.dmg`, the path given as the argument or
// out/Owlery-arm64.dmg: `verifyPackage` of `src/package/package.ts`, run on
// the Node that runs this script. esbuild bundles the module and the bundle
// runs in this process from memory, as `scripts/settle.mjs` runs the settle.
// It exits 1 at the first check that does not hold, and names it.
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import * as esbuild from "esbuild";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(appDir, "src", "package", "package.ts");
const built = await esbuild.build({ entryPoints: [entry], bundle: true, platform: "node", format: "cjs", write: false, logLevel: "warning", external: ["electron-builder"] });
await esbuild.stop();
const module = { exports: {} };
runInThisContext(`(function (require, module, exports) {${built.outputFiles[0].text}\n})`, { filename: `${entry}, bundled` })(createRequire(entry), module, module.exports);

const dmg = process.argv[2] === undefined ? join(appDir, "out", module.exports.ARTIFACT) : resolve(process.argv[2]);
try {
  await module.exports.verifyPackage(dmg, (line) => console.log(line));
} catch (error) {
  console.error(`package:verify: FAILED ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
