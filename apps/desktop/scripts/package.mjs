// Packages the app into out/Owlery-arm64.dmg: `packageApp` of
// `src/package/package.ts`, run on the Node that runs this script, with the
// packager's `build` handed in. esbuild bundles the module and the bundle runs
// in this process from memory, as `scripts/settle.mjs` runs the settle.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import { build } from "electron-builder";
import * as esbuild from "esbuild";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(appDir, "src", "package", "package.ts");
const built = await esbuild.build({ entryPoints: [entry], bundle: true, platform: "node", format: "cjs", write: false, logLevel: "warning", external: ["electron-builder"] });
await esbuild.stop();
const module = { exports: {} };
runInThisContext(`(function (require, module, exports) {${built.outputFiles[0].text}\n})`, { filename: `${entry}, bundled` })(createRequire(entry), module, module.exports);

try {
  await module.exports.packageApp(appDir, process.env, build, (line) => console.log(line));
} catch (error) {
  console.error(`package: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
