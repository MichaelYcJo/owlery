# Changelog: the desktop suite runs the built apps one at a time

Issue #118. Eight test files of the desktop suite start the built Electron app. Vitest ran them in parallel with the rest, with up to one worker fewer than the machine's cores, so on a 10-core Mac up to eight built apps started and drove their windows at once, and cases that wait on a timer in the page missed it. The link card case of `terminal-basics.test.ts` turned four broad gate runs red on 2026-11-21 and 2026-11-22, and passed in every run of its file alone.

- **The test files that start the built app run one at a time.** `apps/desktop/vitest.config.ts` splits the suite into two projects: `app`, the files that import `buildApp` from the suite's helper, which run one after another, and `unit`, every other test file, which still run in parallel beside them. The split is read from the files' imports at each run, so a new file that starts the app joins `app` by its import alone.
- **The full suite took 217 and 224 seconds** in two runs on the owner's Mac, and passed both, the second at a load average near 22.
