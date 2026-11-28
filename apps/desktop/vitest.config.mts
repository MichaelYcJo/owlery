import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type TestProjectInlineConfiguration } from "vitest/config";
import { filesByLayer } from "./scripts/layers.mjs";

const here = dirname(fileURLToPath(import.meta.url));

// The guards of the layers (scripts/layers.mjs). A case of a `logic` file
// that starts a process meets `test/process-guard.ts`, a case of a `logic` or
// a `process` file that starts a pty meets `test/pty-guard.ts` in place of
// node-pty, and a case of any layer but `app` that starts the built app meets
// the check of `test/built-app.ts`, which reads `OWLERY_TEST_LAYER`.
const processGuard = join(here, "test", "process-guard.ts");
const ptyGuard = { find: /^node-pty$/, replacement: join(here, "test", "pty-guard.ts") };

/**
 * The projects of the suite, one for each layer that holds a test file under
 * `root`'s folder `test`, each holding the files whose first line names it.
 * It throws, naming each test file whose first line is no layer line, so the
 * run stops before any file runs.
 */
export function projectsOf(root: string): TestProjectInlineConfiguration[] {
  const files = filesByLayer(root);
  const projects: TestProjectInlineConfiguration[] = [
    { extends: true, test: { name: "logic", include: files.logic, env: { OWLERY_TEST_LAYER: "logic" }, setupFiles: [processGuard], alias: [ptyGuard] } },
    // A case that starts git or a script several times took 5 to 6 seconds while other agents' suites and builds ran beside it
    // on the same Mac (load average above 15), past Vitest's 5-second default, and each broad gate met another such case
    // (issues #161 and #164). 20 seconds is the time the cases that start several processes already set for themselves.
    { extends: true, test: { name: "process", include: files.process, env: { OWLERY_TEST_LAYER: "process" }, alias: [ptyGuard], testTimeout: 20_000 } },
    { extends: true, test: { name: "pty", include: files.pty, env: { OWLERY_TEST_LAYER: "pty" }, testTimeout: 20_000 } },
    // Vitest runs files in parallel with up to one worker fewer than the machine's cores, so on a 10-core Mac it started every
    // built-app file at once, and their cases that wait on a timer in the page missed it (issue #118). The other layers run
    // first, in parallel, and then these files run one at a time with nothing beside them: Vitest runs a project whose files
    // are not parallel as a group of its own, after the others.
    { extends: true, test: { name: "app", include: files.app, env: { OWLERY_TEST_LAYER: "app" }, fileParallelism: false } },
  ];
  return projects.filter(({ test }) => (test?.include?.length ?? 0) > 0);
}

export default defineConfig({
  test: {
    projects: projectsOf(here),
    // A run given `--reporter` on its command line replaces both, as Vitest does, and prints no report of its times.
    reporters: ["default", join(here, "scripts", "test-times.mjs")],
  },
});
