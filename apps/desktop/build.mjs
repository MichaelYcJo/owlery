// Bundles the main process, the daemon, the chain command, the preload and the renderer into dist/, and copies the page, what it loads and the role bundle.
import { copyFile, cp, mkdir, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { runInThisContext } from "node:vm";
import * as esbuild from "esbuild";

await mkdir("dist", { recursive: true });

const common = { bundle: true, sourcemap: true, logLevel: "warning" };
// The app's version, read from package.json and from nowhere else: the daemon writes it into the workflow of a connected repository, which fetches the pull request check at that version's tag.
const { version } = JSON.parse(await readFile("package.json", "utf8"));

await Promise.all([
  esbuild.build({
    ...common,
    entryPoints: ["src/main/main.ts"],
    outfile: "dist/main.js",
    platform: "node",
    format: "cjs",
    // Native and Electron modules load at run time, never bundled.
    external: ["electron", "node-pty", "ws", "bufferutil", "utf-8-validate"],
  }),
  esbuild.build({
    ...common,
    entryPoints: ["src/daemon/main.ts"],
    outfile: "dist/daemon.js",
    platform: "node",
    format: "cjs",
    define: { OWLERY_VERSION: JSON.stringify(version) },
    external: ["node-pty", "ws", "bufferutil", "utf-8-validate"],
  }),
  // The chain command, which a pane's session runs with Electron's Node through the launcher the daemon writes: it is built from the daemon's modules and stands beside the daemon's script, so it finds the role bundle where the daemon does.
  esbuild.build({
    ...common,
    entryPoints: ["src/daemon/chain-main.ts"],
    outfile: "dist/chain.js",
    platform: "node",
    format: "cjs",
    define: { OWLERY_VERSION: JSON.stringify(version) },
    // The command starts no pane, and the module it takes a pane's environment from loads node-pty, so the native module stays out of the bundle as it does for the daemon.
    external: ["node-pty"],
  }),
  esbuild.build({
    ...common,
    entryPoints: ["src/preload/preload.ts"],
    outfile: "dist/preload.js",
    platform: "node",
    format: "cjs",
    external: ["electron"],
  }),
  esbuild.build({
    ...common,
    entryPoints: ["src/renderer/renderer.ts"],
    outfile: "dist/renderer.js",
    platform: "browser",
    format: "iife",
  }),
]);

await copyFile("src/renderer/index.html", "dist/index.html");
await copyFile("src/renderer/themes.css", "dist/themes.css");
await copyFile("node_modules/@xterm/xterm/css/xterm.css", "dist/renderer.css");
// The drawings of the inspection's mark, which the page's style draws the mark's place from: the large mark, and the small one of a cleared line. They are AgenticSeal's and not under this repository's licence (TRADEMARKS.md).
await copyFile("assets/marks/owl.svg", "dist/owl.svg");
await copyFile("assets/marks/owl-icon-cream.svg", "dist/owl-icon-cream.svg");
// The app's icon, which the main process of an app started from a checkout gives the macOS Dock, where a packaged app shows its bundle's icon file: Owlery's emblem, the white owl on a black rounded square. It is Owlery's and not under this repository's licence (TRADEMARKS.md).
await copyFile("assets/icon/app-icon.png", "dist/app-icon.png");
// The role bundle, the plugin folder a role session loads for itself alone: the daemon and the chain command each find it beside their own script. The folder is replaced whole, so a file the tree no longer holds does not stay in the build.
await rm("dist/bundle", { recursive: true, force: true });
await cp("role-bundle", "dist/bundle", { recursive: true });
// Each stage's model, which the bundle's workflow file and inspector module name and no definition does, written into the built definition of its agent: a
// pane's session may start the stage's subagent with no model, and the definition's then holds (`writeDefinitionModels` of src/daemon/workflow.ts, which
// loads the built bundle's workflow first, so a file its loader refuses stops the build). The module is bundled and run from memory, as scripts/settle.mjs
// runs the settle, and writes nothing else.
{
  const entry = resolve("src/daemon/workflow.ts");
  const built = await esbuild.build({ entryPoints: [entry], bundle: true, platform: "node", format: "cjs", write: false, logLevel: "warning" });
  const module = { exports: {} };
  runInThisContext(`(function (require, module, exports) {${built.outputFiles[0].text}\n})`, { filename: `${entry}, bundled` })(createRequire(entry), module, module.exports);
  module.exports.writeDefinitionModels(join(resolve("dist"), "bundle"));
}
