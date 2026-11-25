# Phase 1: 1795559733-built-app-files-share-one-app

## What this phase found

### The frame held, read against the tree

Before the build, the crafter opened each coordinate `frame/design.md` *Grounding* and `frame/plan.md` *Technical context* give for `test/built-app.ts`, `vitest.config.ts`, `test/memory.ts`, `test/memory.test.ts`, `test/keep-awake.test.ts`, `scripts/test-in-electron.mjs`, `src/main/daemon-client.ts`, `src/main/main.ts` and `src/renderer/renderer.ts` (read). Each stood where the frame says. The claim that `test/launch.test.ts` joins the `app` project by its import of `buildApp` is executed: the reporter printed `|app| test/launch.test.ts` for every case.

### The measurement as printed

`OWLERY_BACKGROUND=1 pnpm run measure:launch`, run once in `apps/desktop` at `def06e3f` with no other run of the suite on the machine, exited 0 (executed). It printed this:

```
Measured 2026-11-25 on macOS 26.5, Electron 45.3.3, xterm.js 6.0.0, at commit def06e3f.

| A launch, ms, of 10 | Median | Lowest | Highest |
|---|---|---|---|
| Build: `buildApp` | 143 | 129 | 527 |
| Start: until `BuiltApp.start` returned | 321 | 260 | 656 |
| Ready: until the status line read "Daemon running, no agent" | 138 | 132 | 254 |
| Stop: `stop` | 164 | 108 | 1460 |
| The launch's sum | 916 | 703 | 2002 |

| A reset of the open app, ms, of 10 | Median | Lowest | Highest |
|---|---|---|---|
| 1. The window loaded about:blank | 4 | 4 | 6 |
| 2. The daemon ended at SIGTERM | 51 | 50 | 51 |
| 3. The run folder and appearance.json were emptied | 1 | 0 | 1 |
| 4. The main process's environment was set | 0 | 0 | 1 |
| 5. The window loaded the app's page again | 11 | 10 | 13 |
| 6. Ready: until the status line read "Daemon running, no agent" | 114 | 113 | 115 |
| The reset's sum | 181 | 178 | 187 |

One open app saves 507 ms for each launch: the median of a launch's sum without its build, 688 ms, less the median of a reset's sum, 181 ms.

| The app itself, MB, 5 s after ready | |
|---|---|
| The first app launched | 160.8 |
| The open app, before its first reset | 163.2 |
| The open app, after its last reset | 220.8 |
```

**The stop condition of `frame/plan.md` *Phases* row 1 did not fire.** The median saving is 507 ms for each launch, under the 1 s at which the crafter stops. Phase 2 follows.

The run took 29 s, from 08:09:25 to 08:09:54 on the owner's Mac. The 1-minute load average read 3.29 before the run and 16.92 after it (executed: `sysctl -n vm.loadavg`). No other run of the suite was under way at either reading (executed: `pgrep -f 'vites[t]'` found none). What raised the load is not known. The highest values of the start (656 ms) and the stop (1460 ms) are each one run of ten, and the medians are what the decision reads.

### Two facts the frame did not have

- **The open app held 57.6 MB more after ten resets than before the first.** It read 163.2 MB before the first reset and 220.8 MB after the tenth, against 160.8 MB for an app just launched. Each is one sample (executed). `frame/design.md` *Grounding* says that "the highest memory at one moment is the same in both" ways. That row is labelled `read` and leaves the number to scope item 4. For a run of the suite with one open app, this sample says the highest memory grows with each reset. The sample does not say whether the growth goes on past ten resets or levels off. It bears on `frame/questions.md` row Q1.
- **A reset costs less than the framer's probe measured, and a launch costs more.** The probe gave about 300 ms for a reset and about 650 ms for a launch without its build. This run gives 181 ms and 688 ms. Most of the reset's difference is in its last part: the probe waited on the status line with `BuiltApp.until`, which reads every 100 ms, and this run reads every 10 ms (see the first decision below). The saving is 507 ms in this run against about 350 ms in the probe. Both are under the 1 s of the stop condition.

### Decisions made while building, with their grounds

Each is judged against `frame/design.md` *Data & interfaces*, which states what is timed.

1. **Ready is waited on with a read every 10 ms, by `launch.ts#untilReady`, and not with `BuiltApp.until`.** `until` reads every 100 ms (`test/built-app.ts`, `until`), so it adds up to 100 ms to the part it times. Against a reset of about 200 ms that is half the number. What ready means is unchanged: the status line reads `Daemon running, no agent`.
2. **A build that is not timed runs before the first timed launch.** It is in the `beforeAll` of the measuring block of `test/launch.test.ts`. In the suite, each built-app file builds after the file before it has built, so the system already holds the files a build reads. The framer's probe shows what a first build costs without that: 583 ms against 127 and 134 ms. The highest build in this run, 527 ms, came after that warm-up all the same. This build is also the one use of `buildApp` in `test/launch.test.ts`, and that import is what puts the file in the `app` project.
3. **Part 5 of a reset loads the URL the window showed before part 1.** It does not compute the path of `dist/index.html`. That URL is the file `src/main/main.ts:161` loads, `index.html` beside `main.js` in `dist/`, so the page is the one *Data & interfaces* names.
4. **The variable each reset sets is `OWLERY_LAUNCH_MARK`, with the value `reset-<n>`.** The open app starts with `OWLERY_LAUNCH_MARK=start`. The measurement sets it in the app it starts and reads it back from the daemon's environment. Nothing reads it from a person's environment. `frame/plan.md` *Operational impact* names two new variables, `OWLERY_MEASURE_LAUNCH` and `OWLERY_LAUNCH_RUNS`, and not this third one.
5. **`judged` reads the value as one whole word of what `ps eww` printed.** A value such as `reset-1` is then not found inside `reset-10`. The case *does not take a longer value that begins with the one the reset set for that value* pins this.
6. **`test/memory.ts` exports `listed` and `footprintsOf`, each with a docstring, and nothing else of it changes.** *Data & interfaces* allows this. The memory cases ran green after the change (executed, in the phase boundary run).
7. **Two values of the cases hold a fraction of a millisecond**, 100.4 and 210.4, in the second commit of the phase. Without a fraction, a table that printed its numbers unrounded passed every case. With them, mutant 15 below goes red.

### Seen red

Each case was shown red before it was committed (executed).

- **Against stubs.** `test/launch.ts` first held the five pure functions as stubs that answer 0, null or nothing. `node scripts/test-in-electron.mjs test/launch.test.ts` then failed 16 of the 18 cases, each at its own assertion. The two cases that expect `null` from `judged` passed against a stub that answers null. Mutants 5 and 7 below show those two red.
- **One `seal mutate` call of 16 mutants of `test/launch.ts`**, at `def06e3f`, gave 16 red and none survived. Each mutant was then run again alone, so its output names the case that failed. The output was read for that case:

| # | Mutant | The case that went red |
|---|---|---|
| 1 | the check that the run folder names a daemon after the reset, removed | fails a reset after which the run folder names no daemon |
| 2 | the check that the daemon is a new one, removed | fails a reset after which the run folder names the daemon from before it; names every reading that failed |
| 3 | the check of the daemon's environment, removed | fails a reset whose daemon's environment lacks the value the reset set; does not take a longer value that begins with the one the reset set; names every reading that failed |
| 4 | the value read as a substring, not as a word | does not take a longer value that begins with the one the reset set for that value |
| 5 | the value read only where a space follows it | reads the value the reset set where it stands last in the daemon's environment |
| 6 | the check of the file left in the run folder, removed | fails a reset after which the run folder still holds the file written before it; names every reading that failed |
| 7 | `judged` answers an empty sentence where nothing failed | passes a reset after which a new daemon runs with the value the reset set; reads the value the reset set where it stands last |
| 8 | `spread` does not sort | the two `spread` cases, the saving and the three table cases it reaches |
| 9 | the median of an even count is the upper middle value | gives the mean of the two middle values of an even count |
| 10 | 3 runs where the environment names none | measures ten launches and ten resets where the environment names no count |
| 11 | 0 accepted as a count | refuses a count that is no whole number above zero |
| 12 | the saving counts the build | saves the median of a launch's sum without its build; says what one open app saves |
| 13 | the sum row is the sum of the parts' medians, which is the wrong sum | prints each part of a launch and the launch's sum; prints each part of a reset and the reset's sum |
| 14 | 1 MB is 1,000,000 bytes | prints the app itself in MB |
| 15 | the tables print their numbers unrounded | the launch table and the reset table |
| 16 | the saving line prints its number unrounded | says what one open app saves for each launch |

- **Two mutants of the reset itself**, each under `OWLERY_BACKGROUND=1 OWLERY_MEASURE_LAUNCH=1 OWLERY_LAUNCH_RUNS=1`. Each `seal mutate` call first ran the measurement unchanged as its baseline, which passed. Both mutants were red, and neither run printed a table:
  - With the file written before the reset kept in the run folder, the reset case failed with `reset 1: the run folder still holds the file written before the reset`.
  - With the reset setting `OWLERY_LAUNCH_MARK=start` in place of `reset-1`, it failed with `reset 1: the environment of the daemon 68038 does not hold OWLERY_LAUNCH_MARK=reset-1`.

  So the measuring run fails at a reset that did not reset, as scenario 2 asks. The removal of the old daemon has no mutant. Without the SIGTERM, the reset fails at its own wait, on another line than the reading.

### Scenario 3

`node scripts/test-in-electron.mjs test/launch.test.ts`, run alone in `apps/desktop` without `OWLERY_MEASURE_LAUNCH` and with `--reporter=verbose`, passed 18 cases and listed the two cases of the measuring block as skipped (`↓`) (executed). No app started.

### The phase boundary run

`node scripts/test-in-electron.mjs test/launch.test.ts test/memory.test.ts test/records-place.test.ts`, at `def06e3f`, passed 77 cases in 3 files, with 2 skipped (executed). The set holds the file the phase changed, `test/memory.test.ts`, which imports `test/memory.ts`, and `test/records-place.test.ts`, which reads `apps/desktop/package.json` (`records-place.test.ts:831`). `git grep` for `package.json`, `"./memory"` and `"./launch"` over `apps/desktop/test/*.ts` found these. The other files it listed write a `package.json` of their own into a fixture, or read the `package.json` of `@xterm/xterm`. The repository names no tree-wide test files.

### What the phase did not run

`test:app` is added by this phase and run by phase 2, as `frame/plan.md` *Phases* row 2 states. Whether `--project app` runs the `app` project's files and no other is not executed here.
