// Bundles the main process, the preload and the renderer into dist/, and copies the page and what it loads.
import { copyFile, mkdir } from "node:fs/promises";
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
await copyFile("node_modules/@xterm/xterm/css/xterm.css", "dist/renderer.css");
// The seal's emblem, which the page shows as an image. It is AgenticSeal's drawing and not under this repository's licence (TRADEMARKS.md).
await copyFile("assets/seals/owl-icon-cream.svg", "dist/owl-icon-cream.svg");
