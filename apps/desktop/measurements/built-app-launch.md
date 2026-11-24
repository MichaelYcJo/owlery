# Launch: the built app for each test file, against one app left open

**One app left open for every built-app file would save 507 ms for each launch, so each built-app file that starts the app keeps launching an app of its own.** On the owner's Mac a launch without its build took 688 ms at the median of ten, and a reset of one open app took 181 ms. A run of the suite makes about 17 launches, so one open app would save about 8.6 s of a run, against a reset between files that would have to clear everything the app's main process holds. The open app also held more memory after its tenth reset than before its first. A built-app file is a test file that imports `buildApp` from `test/built-app.ts`, which is how `vitest.config.ts` puts it in the `app` project. Each builds `dist/`. Most start the app in every run, and five start it only where a variable of their own is set: `test/launch.test.ts`, `test/memory.test.ts`, `test/screenshots.test.ts`, `test/pane-session.test.ts` and `test/role-session.test.ts`.

## What was measured

| | |
|---|---|
| Date | 2026-11-25 |
| Commit | `def06e3f` for the launches and the resets, and `0654d8d1` for the batch. Nothing under `apps/desktop` differs between the two, and neither run had changes under `apps/desktop` that its commit does not hold |
| Machine | MacBook Pro, Apple M3 Pro, 36 GB |
| Versions | macOS 26.5, Electron 45.3.3, xterm.js 6.0.0 |
| The app | started in the background with `OWLERY_BACKGROUND=1`, with `SHELL` set to `/usr/bin/true` and no pane opened, so no shell and no `claude` started |
| Ready | the page's status line reading "Daemon running, no agent", read every 10 ms |
| The app itself | the Electron main process, every process below it, and the daemon, summed as macOS's `phys_footprint` |
| 1 MB | 1,048,576 bytes, as Activity Monitor counts it |

## The commands

Both were run from `apps/desktop`, each once, with no other run of the suite on the machine.

```
OWLERY_BACKGROUND=1 pnpm run measure:launch
OWLERY_BACKGROUND=1 pnpm run test:app
```

`measure:launch` makes ten launches and ten resets. `OWLERY_LAUNCH_RUNS` names another count. The run fails and prints no table where a reset left the old daemon running, left the new daemon without the environment the reset set, or left a file in the daemon's run folder.

## The load on the machine

Other worktrees of this repository did other work on the same Mac during both runs. Neither run was made again on a quieter machine. Each row gives the 1-minute load average, read with `sysctl -n vm.loadavg` just before and just after the run.

| Run | Before | After |
|---|---|---|
| `measure:launch` | 3.29 | 16.92 |
| `test:app` | 4.24 | 4.62 |

The measurement's highest start (656 ms) and highest stop (1460 ms) are each one run of ten, and the medians are the numbers this file decides on. A busy machine makes a launch slower, and so makes the saving larger.

## A launch

A launch is what each built-app file that starts the app in a run of the suite makes: it builds `dist/`, starts the app, waits for ready, and stops the app with its daemon. One build that is not timed runs first, since in the suite each file builds after the file before it has built.

| A launch, ms, of 10 | Median | Lowest | Highest |
|---|---|---|---|
| Build: `buildApp` | 143 | 129 | 527 |
| Start: until `BuiltApp.start` returned | 321 | 260 | 656 |
| Ready: until the status line read "Daemon running, no agent" | 138 | 132 | 254 |
| Stop: `stop` | 164 | 108 | 1460 |
| The launch's sum | 916 | 703 | 2002 |

## A reset of one open app

A reset is what one app left open would need between two files. The app is started once with the main process's inspector and reset ten times, in six parts. The window leaves the app's page first, because the page starts a daemon one second after its socket to the daemon closes.

| A reset of the open app, ms, of 10 | Median | Lowest | Highest |
|---|---|---|---|
| 1. The window loaded about:blank | 4 | 4 | 6 |
| 2. The daemon ended at SIGTERM | 51 | 50 | 51 |
| 3. The run folder and appearance.json were emptied | 1 | 0 | 1 |
| 4. The main process's environment was set | 0 | 0 | 1 |
| 5. The window loaded the app's page again | 11 | 10 | 13 |
| 6. Ready: until the status line read "Daemon running, no agent" | 114 | 113 | 115 |
| The reset's sum | 181 | 178 | 187 |

After each reset the run read three things, and all three held at every reset: the daemon was a new process, its environment held the value the reset had set, and the run folder no longer held a file written there before the reset.

One open app saves 507 ms for each launch: the median of a launch's sum without its build, 688 ms, less the median of a reset's sum, 181 ms. The build stays, since one open app still needs `dist/` built from the tree as it stands.

## The app's memory

Each number is one sample, taken 5 seconds after ready.

| The app itself, MB | |
|---|---|
| The first app launched | 160.8 |
| The open app, before its first reset | 163.2 |
| The open app, after its tenth reset | 220.8 |

The open app held 57.6 MB more after ten resets than before the first. An app launched for each file starts again near 161 MB. The samples do not say whether the growth goes on past ten resets or levels off, and they do not say what holds the memory.

## The built-app files as one batch

`pnpm run test:app` ran the 20 files of the `app` project, one at a time, and no other file. 18 files passed and 2 were skipped; 203 cases passed and 8 were skipped. The run took 143.4 s. The 20 files are every built-app file, `test/launch.test.ts` among them.

## On GitHub's runner

`check` run 45500047201, of 2026-11-24, ran on the image `macos-26-arm64`, for the pull request of `release/v0.0.3` into `main`. It is read from its log, `gh run view 45500047201 --log`, and its tree holds neither `test/launch.test.ts` nor the scripts above.

| | |
|---|---|
| The suite | 738.0 s |
| The `app` project | 188 s, from 22:30:39 to 22:33:47, with its 17 files' own times summing to 182.0 s |
| `test/chain.test.ts`, of the `unit` project | 480.1 s |
| A whole built-app file with one case, `test/records-dialog.test.ts` | 2.4 s: its build, its launch, its case and its stop |

Nobody measured a launch alone on the runner. Its bound is the 2.4 s of that whole file. 17 such launches are at most 41 s of the 738 s, before the resets' own cost is taken off, and the suite's time is in the `unit` project.

## What the numbers decide

The files share no app. One open app would save about half a second for each launch, and a reset between files would have to clear everything the main process holds: its environment, the opener it read at its start, the text of its own clipboard, the window's ground, `appearance.json`, and any value a case sets in the main process. A reset that missed one would fail a case of a later file, and the failure would name that case and not the file that left the state behind. Where a launch grows slower, `pnpm run measure:launch` measures the premise again in one run.
