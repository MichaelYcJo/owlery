import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The test files that start the built app, read from the tree: each imports
// `buildApp` from the suite's helper. Vitest runs files in parallel with up to
// one worker fewer than the machine's cores, so on a 10-core Mac it started
// every such file at once, and their cases that wait on a timer in the page
// missed it (issue #118). The rest of the suite runs first, in parallel, and
// then these files run one at a time with nothing beside them: Vitest runs a
// project whose files are not parallel as a group of its own, after the others.
const testFolder = join(dirname(fileURLToPath(import.meta.url)), "test");
const startsTheApp = /import \{[^}]*\bbuildApp\b[^}]*\} from "\.\/built-app"/;
const appFiles = readdirSync(testFolder)
  .filter((name) => name.endsWith(".test.ts") && startsTheApp.test(readFileSync(join(testFolder, name), "utf8")))
  .map((name) => `test/${name}`);

export default defineConfig({
  test: {
    // On GitHub's macOS runner (where `CI` is set), a failed case runs once
    // more before it counts as failed. Two cases of the built app fail there on
    // some runs only: the Open in submenu's pointer case, whose 300 ms pause
    // the first start's slow page outruns, and the worktree link case after a
    // view changes, whose cause is not measured. A case that fails twice still
    // fails the run. A run on a person's Mac retries nothing. The two cases'
    // causes are issue #117.
    retry: process.env.CI ? 1 : 0,
    projects: [
      { extends: true, test: { name: "unit", include: ["test/**/*.test.ts"], exclude: appFiles } },
      { extends: true, test: { name: "app", include: appFiles, fileParallelism: false } },
    ],
  },
});
