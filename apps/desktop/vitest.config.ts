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
    projects: [
      { extends: true, test: { name: "unit", include: ["test/**/*.test.ts"], exclude: appFiles } },
      { extends: true, test: { name: "app", include: appFiles, fileParallelism: false } },
    ],
  },
});
