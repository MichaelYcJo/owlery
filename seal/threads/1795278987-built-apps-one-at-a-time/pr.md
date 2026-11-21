Part of #118. The issue closes when `release/v0.0.2` reaches `main`.

Eight test files of the desktop suite start the built Electron app. Vitest ran them in parallel with the rest of the suite, so on the owner's 10-core Mac up to eight built apps started and drove their windows at once. Cases that wait on a timer in the page then missed it. The link card case of `terminal-basics.test.ts` turned four broad gate runs red on 2026-11-21 and 2026-11-22, for #113, #30 and #26, and passed in every run of its file alone.

**The files that start the built app now run one at a time.** `apps/desktop/vitest.config.ts` splits the suite into two projects. `unit` holds every test file that does not start the app, and they run first, in parallel as before. `app` holds the files that import `buildApp` from the suite's helper, and runs them after `unit`, one at a time (`fileParallelism: false`), with nothing beside them: Vitest 4 runs a project whose files are not parallel as a group of its own, after the others. The split is read from the files' imports at each run, so no list of files is kept beside the tree, and a new file that starts the app joins `app` by its import alone. The retry on the runner from #30 is unchanged.

**Checked** by two full runs of `pnpm -r run check` in a row on the owner's Mac at this branch's code: 34 files, 1050 passed and 1 skipped, in 217 and 224 seconds, the second at a load average near 22.

#117 is narrowed to what is left on the runner, its first-start failures, which happened with two files at once and not eight. The link card case on the owner's Mac, which its comment of 2026-11-22 added, is this issue's.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
