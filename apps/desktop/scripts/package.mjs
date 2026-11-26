// Packages the app into out/Owlery-arm64.dmg: `packageApp` of
// `src/package/package.ts`, run on the Node that runs this script, with the
// packager's `build` handed in. esbuild bundles the module and the bundle runs
// in this process from memory, as `scripts/settle.mjs` runs the settle.
// `--tag <tag>` names the release's tag, which has to be the app's version.
// Under GitHub Actions the command also writes the way it signed, or why it
// refused, into the run's summary.
import { appendFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { runInThisContext } from "node:vm";
import { build } from "electron-builder";
import * as esbuild from "esbuild";

const { values } = parseArgs({ options: { tag: { type: "string" } } });
const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(appDir, "src", "package", "package.ts");
const built = await esbuild.build({ entryPoints: [entry], bundle: true, platform: "node", format: "cjs", write: false, logLevel: "warning", external: ["electron-builder"] });
await esbuild.stop();
const module = { exports: {} };
runInThisContext(`(function (require, module, exports) {${built.outputFiles[0].text}\n})`, { filename: `${entry}, bundled` })(createRequire(entry), module, module.exports);

/** A line of the run's summary, where GitHub Actions names its file. */
const summary = (line) => {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
};

try {
  const { way } = await module.exports.packageApp(appDir, process.env, build, (line) => console.log(line), values.tag);
  summary(module.exports.WAY_SENTENCE[way]);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  summary(`Not packaged: ${message}`);
  console.error(`package: ${message}`);
  process.exit(1);
}
