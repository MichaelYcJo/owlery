# Phase 1: 1795046889-four-terminals-memory

## What this phase found

**The numbers before this work, on the window as issue #18 merged it.** `executed` once, at the tree of `aeaa1e0`: `TMPDIR=/private/tmp/claude-501 OWLERY_BACKGROUND=1 OWLERY_MEMORY_RUNS=1 pnpm run measure:memory` from `apps/desktop`, exit 0, three launches. The run was made on the working tree before the commit, and `shasum -c` at `aeaa1e0` read the four files of the phase as the bytes that run had. The output is `measure-2.txt` in this phase's scratch. It printed "Measured 2026-11-19 on macOS 26.5, Electron 45.3.3, xterm.js 6.0.0." and these tables.

| Scenario | Run | Start | App itself, MB, at 20 s / 25 s / 30 s | Highest, MB | Panes' processes, MB | Terminals | Displayed | Canvases | Frames a second |
|---|---|---|---|---|---|---|---|---|---|
| inbox | 1 | agent | 155.9 / 156.0 / 153.9 | 156.0 | 0.0 / 0.0 / 0.0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 60 / 60 / 60 |
| one | 1 | agent | 451.1 / 458.0 / 459.8 | 459.8 | 1.4 / 1.4 / 1.4 | 1 / 1 / 1 | 1 / 1 / 1 | 3 / 3 / 3 | 61 / 60 / 61 |
| eight-in-turn | 1 | agent | 762.2 / 764.5 / 747.3 | 764.5 | 17.2 / 10.7 / 10.7 | 8 / 8 / 8 | 1 / 1 / 1 | 17 / 17 / 17 | 60 / 61 / 60 |

| Scenario | Run | Main | Renderer | GPU | Utility | Daemon | Other | App itself, MB, at 30 s |
|---|---|---|---|---|---|---|---|---|
| inbox | 1 | 61.6 | 24.6 | 44.0 | 7.3 | 16.3 | 0.0 | 153.9 |
| one | 1 | 64.7 | 61.2 | 309.0 | 7.5 | 17.4 | 0.0 | 459.8 |
| eight-in-turn | 1 | 64.0 | 95.8 | 558.1 | 7.6 | 21.8 | 0.0 | 747.3 |

A start `agent` is made under `OWLERY_BACKGROUND=1`, with the page told that it has the focus. 1 MB is 1,048,576 bytes. The app itself is the main process, every process below it and the daemon. The panes' processes are the ones below the daemon.

- The machine is an Apple M3 Pro with 36 GB, and its two displays are 3840 by 2160 shown as 1920 by 1080 (`system_profiler SPDisplaysDataType`, `executed`). Its owner was working at it. The window opens 1440 by 900 (`apps/desktop/src/main/main.ts`, `read`).
- Each scenario has one launch, not the three of `frame/design.md` *Scope* item 7. The spawn asked for as few starts of the app as the phase needs, and scenario 11 reads `eight-in-turn` for a fall from eight terminals to one, which one launch shows. `gaps.md` holds the row.
- `one` read 451.1 to 459.8 MB, against the probes' 457 to 462 MB (`frame/questions.md` Q2, which stays open until phase 4's `four`). One WebGL terminal leaves about 40 MB under the target.
- In `eight-in-turn` the page held eight terminals and 17 canvases at every sample, one terminal displayed, and the GPU process held 558 MB at the last. That is the structure `frame/plan.md` *Technical context* names first.

**One sample's sum agrees with `footprint` run by hand.** `executed` beside the run above: a shell loop found the app's main process with `pgrep -f "perf-9/apps/desktop --remote-debugging-port"`, listed that process and its children from `ps -axo pid=,ppid=`, and summed the `Footprint:` lines of `xargs footprint --noCategories -f bytes` over them once a second (`by-hand-3.txt`). For the `inbox` launch it read five processes from its third second on, the five kinds the second table gives. From 18:15:36 to 18:15:45 its nine readings were 163,436,544 to 163,551,232 bytes, which is 155.9 to 156.0 MB, and the table's samples at 20 s and 25 s are 155.9 and 156.0. The measurement prints neither a process id nor a time, so the two readings share the app and those ten seconds, not a list of ids. In the last twelve seconds of the `eight-in-turn` launch the loop read 762.3 to 764.2 MB and then 747.4 and 747.3, where the table has 762.2, 764.5 and 747.3.

**The frame holds, with one sentence of `frame/plan.md` that is untrue of the tree it names.** Every path of `frame/design.md` *Grounding* that this phase reads was opened at `e9224dc`: `test/built-app.ts`, `korean-pane.ts`, `korean-input.test.ts`, `repositories.ts`, `fixtures/receiver.sh`, `package.json`, `scripts/test-in-electron.mjs`, `src/main/main.ts`, `src/main/background.ts`, `src/renderer/work-item-view.ts`, `renderer.ts`, `sidebar.ts` and the ids of `index.html`. `frame/plan.md` *Technical context* says `BuiltApp.start` does "a build of `dist/`". It does not: `test/built-app.ts#buildApp` builds, and `BuiltApp.start` starts what is built. The measurement calls both, as the Korean case does. The hand-back names the sentence for the fold.

**The files.** `apps/desktop/test/memory.ts` holds the functions and the driving of the window. `apps/desktop/test/memory.test.ts` holds 25 cases under `describe.skipIf` and the measurement under `describe.runIf`. `apps/desktop/test/fixtures/printer.sh` is the panes' process. `apps/desktop/package.json` gains `measure:memory`.

**Names, which `frame/design.md` *Data & interfaces* leaves to the builder.**

- `OWLERY_MEMORY_SCENARIOS` names the scenarios to run, with commas between, in the order they run. Absent, all three run.
- `OWLERY_MEMORY_RUNS` is the count of launches of each scenario. Absent, it is 3, the count *Scope* item 7 publishes. A name the tool does not have, or a count that is no whole number above zero, fails the run before any launch.
- `processRows` reads `ps`, `footprints` reads `footprint`, `splitProcesses` sorts the app's processes from the panes', `sums` adds them, `thrownAway` is scenario 15's function, `startOf` reads the kind of start from `src/main/background.ts#startsInBackground`, `planOf` reads the two variables, `tables` is what the run prints, and `measure` is one launch.

**Decisions made while building.** Each is the work's, judged against `frame/design.md` *Scope* item 6.

- **The by-kind table has a sixth column, `Other`.** The item names five kinds. A process below the main process that names no `--type` would otherwise be left out of the row or of its sum. Every launch read 0.0 there.
- **The sum is of the lines `footprint` prints per process.** Its `Summary Footprint` line is another number: for two processes read by hand it was 3,359,248 bytes where the two lines add to 3,392,016. The item asks for the sum over the process tree, as the earlier measurement took it.
- **A pane is put in front by being started.** The window puts a pane it starts in front, so in `eight-in-turn` each of the eight is in front once, when it starts, and the eighth stays. The drive waits after each start until the last tab is the active one and one terminal is displayed.
- **The drive waits for each pane's process.** After each start it reads `ps` until the daemon runs that many printers, and after the last sample it reads that all of them still run. A measurement of panes that print nothing would read lower.
- **The page counts its frames over the second in which the processes are read.** `requestAnimationFrame` is counted for one second from the moment `ps` and `footprint` start.
- **The printer prints 33 lines and sleeps a tenth of a second.** `executed` in a pseudo-terminal for ten seconds: 297 lines a second. At 30 lines a round it read 270. It ends when a line cannot be written, and in the same check it was gone half a second after its terminal closed.
- **The tables are written with `process.stdout.write`.** `executed`, probe `test_tmp_print.test.ts`, run once and removed: under `scripts/test-in-electron.mjs` with its output in a file, a `console.log` from a case and one from `afterAll` were both shown nowhere, and `process.stdout.write` was shown. The first run of the measurement printed its tables with `console.log` and lost them, which cost three launches. `apps/desktop/test/korean-input.test.ts` prints the typed run's verdicts with `console.log`; the hand-back names it as a leftover.
- **A run that is thrown away fails its case**, and so does one that left a process behind, so the command's exit code says whether every launch was kept. Nothing retries a launch.
- **A person's run sends no emulation at all**, as the item says. The form is filled through the debugging port, which the Korean typed run found to need the page's focus, so a person's run needs the window in front from its start. No such run was made.
- **`measure` ends the panes' processes it last read where a signal stops the run**, beside `BuiltApp#stopNow`, as the typed run ends its app.

**Each case was seen red before its code.** `executed`: the 25 cases ran against `memory.ts` with each function returning a fixed wrong value and no `printer.sh`. 24 failed, each on its own assertion, and the printer's on `ENOENT` (`red.txt`). "takes no process of another app" passed there, since it asserts an absence.

**`seal mutate` at `aeaa1e0`, every mutant red.** `executed`, 25 mutants of `test/memory.ts` in one call (`mutate-memory.txt`), and each again alone to read the cases that fail (`mutate-each.txt`): the two regular expressions' groups, each kind's line of `splitProcesses`, the exclusion of the panes from the app, the daemon that is no child, both sums, each of the four reasons of `thrownAway` and the `person` condition both ways, `startOf`, each refusal and each default of `planOf`, and of `tables` the highest, the row of a thrown-away run, the last sample, the size of 1 MB and both sentences under the tables. Two guards whose cases assert an absence were broken alone:

- `splitProcesses` with the test of a row's parent removed: "takes no process of another app" failed on `expected [ 900, 901 ] to deeply equal []` (`mutate-other-app.txt`).
- `printer.sh` with `[ -t 0 ] || exit 0` removed: its case failed on `ETIMEDOUT` (`mutate-printer.txt`).

The driving of the window has no mutant, because each would be a launch. `gaps.md` holds the row.

**Scenario 16.** `executed` at `aeaa1e0`: `env -u OWLERY_MEASURE_MEMORY node scripts/test-in-electron.mjs test/memory.test.ts` ran 25 cases and skipped the 9 launches in 126 ms, and a loop of `pgrep` for the app's main process, `dist/daemon.js` and `printer.sh` found none in its three polls (`scenario-16.txt`). The same pattern found the main process during the measurement.

**The *Phase boundary* set.** `executed` at `aeaa1e0`, one command: `TMPDIR=/private/tmp/claude-501 OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/memory.test.ts test/korean-input.test.ts`, exit 0, 2 files, 57 cases passed and 10 skipped (`boundary.txt`). `korean-input.test.ts` is in the set because it opens `package.json`, which the phase changed. No test file globs `test/` or `test/fixtures/`, and the repository has no contribution guide, so the set has no tree-wide file. `tsc -p` over the two new files with the package's options exited 0.

**The app was started seven times, each under `OWLERY_BACKGROUND=1` with its user data folder under `/private/tmp/claude-501/`:** three launches whose tables were lost, three whose tables stand above, and the Korean case's one. After the last, `pgrep -fl "perf-9/apps/desktop|printer.sh|receiver.sh|owlery-app-|dist/daemon.js"` found nothing and `/private/tmp/claude-501/` held no `owlery-*` folder. In all six launches of the measurement `left` was empty: no process had to be killed.

**What the next phases need.**

- Phase 3 reads `eight-in-turn` again against 764.5 MB, eight terminals and 17 canvases.
- The drive finds terminals as `#stage .xterm` and waits for one displayed terminal and for the last tab as the active one. Phase 4's tiles change both waits for its scenarios.
- Phase 4 adds its four scenarios to `SCENARIOS` and `STEPS`, and the case "measures every scenario three times" names the three of today.
- The tool prints the date and the versions. The window's size, a tile's size and the commit, which *Scope* item 7 asks of `apps/desktop/measurements/memory.md`, are not printed.
