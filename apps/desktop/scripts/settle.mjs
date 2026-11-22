// Runs the release's settle, `src/daemon/settle-main.ts`, on the Node that
// runs this script. The daemon's files import without extensions, so Node
// cannot run them as they stand: esbuild bundles the entry, as `build.mjs`
// bundles the daemon, into a folder of the system's temporary directory, and
// the bundle runs in this process and is removed after it.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const entry = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "daemon", "settle-main.ts");
const folder = mkdtempSync(join(tmpdir(), "owlery-settle-"));
try {
  const outfile = join(folder, "settle.mjs");
  await esbuild.build({ entryPoints: [entry], outfile, bundle: true, platform: "node", format: "esm", logLevel: "warning" });
  await import(pathToFileURL(outfile).href);
} finally {
  rmSync(folder, { recursive: true, force: true });
}
