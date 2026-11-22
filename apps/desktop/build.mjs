// Bundles the main process, the daemon, the preload and the renderer into dist/, and copies the page, what it loads and the role bundle.
import { copyFile, cp, mkdir, rm } from "node:fs/promises";
import * as esbuild from "esbuild";

await mkdir("dist", { recursive: true });

const common = { bundle: true, sourcemap: true, logLevel: "warning" };

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
    external: ["node-pty", "ws", "bufferutil", "utf-8-validate"],
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
// The seal's drawings, which the page's style draws a seal's place from: the wax seal, and the small mark of a sealed line. They are AgenticSeal's and not under this repository's licence (TRADEMARKS.md).
await copyFile("assets/seals/owl.svg", "dist/owl.svg");
await copyFile("assets/seals/owl-icon-cream.svg", "dist/owl-icon-cream.svg");
// The app's icon, which the main process gives the macOS Dock: Owlery's emblem, the white owl on a black rounded square. It is Owlery's and not under this repository's licence (TRADEMARKS.md).
await copyFile("assets/icon/app-icon.png", "dist/app-icon.png");
// The role bundle, the plugin folder a role session loads for itself alone: the daemon finds it beside its own script. The folder is replaced whole, so a file the tree no longer holds does not stay in the build.
await rm("dist/bundle", { recursive: true, force: true });
await cp("role-bundle", "dist/bundle", { recursive: true });
