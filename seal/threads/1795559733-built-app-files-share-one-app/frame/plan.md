# Implementation Plan: built-app-files-share-one-app

## Technical context

The tree as read at `ec7816a`.

**What the work builds on.**

- `apps/desktop/test/built-app.ts` builds `dist/` (`buildApp`, `:17-20`) and starts one app for the caller (`BuiltApp.start`, `:189-227`), with a user data folder of its own, a debugging port for the page and, under `inspectMain`, the main process's inspector (`evaluateMain`, `:254-257`). `daemonPid` reads the daemon's id from the run folder at each call (`:291-299`), `stop` ends the app and the daemon and removes the folder (`:317-345`), and `stopNow` does so for a run a signal ends (`:327-333`). The work calls these and changes none.
- `apps/desktop/vitest.config.ts` gives the `app` project every test file that imports `buildApp` from `./built-app` (`:13-17`) and runs that project's files one at a time (`:27`). `test/launch.test.ts` imports `buildApp`, so it joins the `app` project by its import.
- `apps/desktop/test/memory.ts` and `test/memory.test.ts` are the form of a measurement the tree already holds: a hand-run block under `describe.runIf(MEASURE)` (`memory.test.ts:285`), the cases of its functions under `describe.skipIf(MEASURE)` (`:30`), a heading with the date, the versions and the commit (`memory.ts#heading`, `#treeNow`), the tables written to the run's own output (`memory.test.ts:302-305`), and an end at a signal (`memory.ts#measure`, the `interrupted` handler). `apps/desktop/measurements/memory.md` is the form of the published file.
- `apps/desktop/scripts/test-in-electron.mjs:13` hands its arguments to `vitest run`, so a project's name and a file's path both reach Vitest.
- The reset the measurement times rests on four facts of the app, each in `frame/design.md` *Grounding*: the main process starts the daemon with its own environment (`src/main/daemon-client.ts:50-54`); the page starts a daemon at each load (`src/renderer/renderer.ts:1961-1962`); the page reloads itself one second after the daemon's socket closes (`:1978-1981`); and the window lets the main process load another page.

**Constraints.**

- Every start is in the background, and the measurement opens no pane, so it draws nothing on the owner's screen and takes no pseudo-terminal.
- The measuring run and the batch run each start once no other run of the suite is under way on the machine. A run beside another measures the other's load. Work of other worktrees that is no run of the suite is not waited for: the crafter reads the 1-minute load average before and after each of the two runs, and the published file names the readings (`frame/design.md` *Scope* item 4). Phase 1's run read 3.29 and 16.92, and is not made again.
- The crafter runs no `claude`, and no start reads the person's Claude Code config folder: `BuiltApp.start` gives the app a config folder of its own (`built-app.ts:204`), and `SHELL` is `/usr/bin/true`.
- The suite and the repository-wide typecheck are the orchestrator's broad gate, and no phase runs them.

**The failure scenario of the chosen approach.** The files keep launching an app each. In six months the app's start may do more, such as reading every repository's records before the window opens, and a launch may cost several seconds. Nothing runs the measurement by itself, so the suite then pays that cost for each file until somebody runs `pnpm run measure:launch` again. The published file names the command and the number the decision stood on, so a reader who sees a slow `app` project can check the premise in one run. The second failure is the reset drifting from the app: where the main process stops handing its environment to the daemon, the measurement fails at the reading of scope item 2 and prints no table, but only on the day a person runs it.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Keep a launch for each file, publish what a launch and a reset cost, and write the rule for the batch | The one above: a launch grows slower and nobody measures again | Chosen. The premise that keeps the structure is that a launch costs under a second and that one open app saves under a second for each file. Checked twice on the owner's Mac: by the framer's probe (`frame/design.md` *Grounding*, the probe's two rows), and by phase 1's ten runs, whose medians are 688 ms for a launch without its build against 181 ms for a reset, a saving of 507 ms (`trail/phases/phase-1.md` *The measurement as printed*). The saving is under the 1 s at which phase 1 would have stopped the work. On GitHub's runner the bound is 2.4 s for a whole one-case file |
| One open app for the files, within a run and across runs, as the issue's first and second *Done when* lines state it. A `globalSetup` of the `app` project would start one app with the main process's inspector and hand its ports to the files. A file would reach it through a new `BuiltApp.open(env, { writeRun })`, which resets the app in the six parts of `frame/design.md` *Data & interfaces*. A file that needs a fresh app would keep `BuiltApp.start`. A record under the system's temporary folder would name an app left open for the next run, whose main process is restarted where `dist/main.js` or `dist/preload.js` changed | A reset that misses one holder of state fails a case of a later file, and the failure names that case and not the file that left the state. `frame/design.md` *Grounding* lists six such holders in the main process, and a case can add one at any time with `evaluateMain`. An app left open by a run that died is one more Electron app on a machine that held 14 worktrees of this repository on 2026-11-25 (`git worktree list`, executed). The open app also grew with its resets where phase 1 measured it, by 57.6 MB over ten, from 163.2 to 220.8 MB, one sample each, so a run of about 17 files may end with more memory held than any launched app holds. The gain is 507 ms for each launch at the median of phase 1's ten runs, about 8.6 s of a run on the owner's Mac | Not built. The measured gain does not pay for the reset's risk in a release whose purpose names steadiness. The owner's word on it is `frame/questions.md` row Q1. The probe showed that the reset itself works, so a later frame starts from that |
| One open app within a run only, started and stopped by the `globalSetup`, with no app left open between runs | The same leak between files. A fix pass that runs one file still launches once | Not built, on the same number. It also leaves the issue's second line unbuilt |
| One build of `dist/` for a run, in a `globalSetup`, with `buildApp` taken out of each file | The project split reads the import of `buildApp` (`vitest.config.ts:14`), so the split's rule changes with it, and a file run alone with a stale `dist/` reads an old build where the setup is skipped | Not built. It saves about 140 ms for each file and changes every built-app file, which issues #168 and #154 also change |
| Publish the numbers of the framer's probe and commit no command | The published file names a method nobody can run again, and the next reader cannot tell a slower launch from a wrong number | Rejected. `docs/architecture.md` *Memory design* asks for a scene "written down so that it can be measured again" |
| In the measurement's reset, stop the daemon and reload the page, without loading `about:blank` first | The page reloads itself one second after the daemon's socket closes and starts a daemon. Under load the folder is emptied after that second, so the new daemon reads a half-emptied folder and the times are of a reset that did not reset | Rejected. The probe took the page off first, and no daemon started in 1.2 s |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1, 2 and 3 | `node scripts/test-in-electron.mjs test/launch.test.ts`, run alone in `apps/desktop` without `OWLERY_MEASURE_LAUNCH`, passes and lists the measuring block as skipped (scenario 3). Each case of the function that judges a reset is seen red with the check of its reading removed, and each case of the functions that sum the runs and write the tables is seen red against a wrong sum (scenario 2). Then `OWLERY_BACKGROUND=1 pnpm run measure:launch` is run once, with no other run of the suite on the machine, and exits 0 with its tables (scenario 1). The phase record holds the tables as printed. **Where the median saving for each launch is 1 s or more, the crafter builds no further, records the tables, and hands back with that number named: the premise of this plan failed, and the orchestrator resumes the framer** | built `def06e3f`; `trail/phases/phase-1.md` |
| 2 | `frame/design.md` *Scope* item 4 | `OWLERY_BACKGROUND=1 pnpm run test:app` is run once, with no other run of the suite on the machine, and passes. The number of test files its summary prints equals the number of files that `vitest list --project app --filesOnly --json`, run through Electron's Node as `scripts/test-in-electron.mjs` runs Vitest, names, each with the project name `app`, and the number the import pattern of `vitest.config.ts:14` matches under `test/` (scenario 4). The phase record holds the run's duration, the three numbers and the list's command. The runner's times are read from the log of one `check` run with `gh run view <id> --log`, and the published file names the run. `apps/desktop/measurements/built-app-launch.md` is read at review against the tables of both phase records (scenario 6). `git diff --stat ec7816a -- apps/desktop/vitest.config.ts apps/desktop/test/built-app.ts` prints nothing (scenario 5). `gaps.md` *Not done* names the issue's first and second *Done when* lines with the measured saving | built `8ac4dc0e`; `trail/phases/phase-2.md` |

`frame/design.md` *Scope* item 5 is no phase's: the rule stands in `frame/design.md` *Rule changes*, and the settle writes it into the policy root. Scenario 7 is read at review.

## Overlap with the release

The other open work items are the five the spawn names. Only #154 has a frame committed at this reading, at `3c63162` on its branch (`git ls-files seal/threads` in each of the five worktrees, executed). The other four are judged from their issues.

This plan assumes no order of merges: the work changes no file another item's issue names but `apps/desktop/package.json`, and there it adds lines no other item changes.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #168, two flaky cases of `terminal-basics.test.ts`, and the version | `apps/desktop/package.json`: #168 changes the `version` line, and this work adds two lines under `scripts`. `test/terminal-basics.test.ts` is #168's alone | Either | The lines are apart, so the second to merge takes the release branch in without a conflict. #168's third *Done when* line counts `check` runs that pass at their first attempt: this work adds one file of cases that start no app to those runs |
| #154, no macOS notification under a background start | `docs/architecture.md` *Measure before building* and its Korean edition: #154 changes a sentence of the section's last bullet, and this work adds a bullet after it. #154's frame leaves `test/built-app.ts` unchanged and expects #149 to rewrite the helper's start. Under this plan #149 does not | Either | The two rule changes name different text of one section, and the settle writes them in merge order. `test/launch.test.ts` makes no work item, so it raises no notification and holds no replacement of the page's `Notification`, which #154's searches would otherwise name |
| #191, the `role:refusal` hand check | Nothing in the issue. Where #191 changes the `role:refusal` lines of `apps/desktop/package.json`, they are apart from the two lines this work adds | Either | No rule and no check in common |
| #134, the daemon queues heavy commands across work items | Nothing. #134 changes the daemon, and this work changes no file under `apps/desktop/src` | Either | The wait for another worktree's run, which this work leaves to the orchestrator's prompts, is the load #134 orders in the product. Neither reads the other's change |
| #32, caps on agents and worktrees | Nothing | Either | No file, rule or check in common |

**Where row Q1 is answered with the shared app**, the order is no longer free: #154 merges first, as its own frame states, because the page then holds its notifications back by itself at each load, and #168 merges first, because it changes cases of the file with the most cases, which the shared app's reset would then be shown against. The framer writes that order when it is resumed.

## Operational impact

No migration, no new dependency and no compatibility break. `apps/desktop/package.json` gains the scripts `test:app` and `measure:launch`. The hand-run measurement reads two new variables from the environment of whoever runs it, `OWLERY_MEASURE_LAUNCH` and `OWLERY_LAUNCH_RUNS`, which nothing reads in a run of the suite. It sets a third, `OWLERY_LAUNCH_MARK`, on the app it starts and on that app's main process at each reset, and reads it back from the daemon's environment. Nothing reads that one from a person's environment, and no code under `apps/desktop/src` reads any of the three. This pull request does not move the version: #168 does.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
