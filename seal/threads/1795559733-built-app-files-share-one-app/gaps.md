# Closing memo: 1795559733-built-app-files-share-one-app

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the typecheck and the rest of the broad gate at the branch's head | the orchestrator, at the broad gate |
| closed that `pnpm run test:app` runs the `app` project's files, one at a time, and no file of the `unit` project | executed by the crafter in phase 2 at `0654d8d1`: the run passed 20 files, and `vitest list --project app` named the same 20, each of project `app` (`trail/phases/phase-2.md`) |
| Which two of the 20 files the batch skipped: its output names none | the crafter of a later fix pass, where a reviewer asks, by a run with `--reporter=verbose` |
| closed whether the medians of `pnpm run measure:launch` move on a machine that stays quiet: the 1-minute load average rose from 3.29 to 16.92 during the one run of phase 1 | decided by the framer's fold at `0654d8d1`: no run is made again for a quieter machine, and `apps/desktop/measurements/built-app-launch.md` names the load of each run (`frame/design.md` *Scope* item 4) |
| Whether the open app's memory goes on growing past ten resets: it read 163.2 MB before the first reset and 220.8 MB after the tenth, one sample each | the owner, who weighs it in answering `frame/questions.md` row Q1; where the answer is (b), the framer plans its measurement |

## Not done

**The issue's first and second *Done when* lines, one open app that the built-app files share within a run and across runs, are not built.** `frame/questions.md` row Q1 is open, and its default (a) holds until the owner answers. The measurement of phase 1 gives the saving the shared app would buy: a median of 507 ms for each launch, from a launch of 688 ms without its build against a reset of 181 ms, and so about 8.6 s for a run of the suite's about 17 launches (`trail/phases/phase-1.md`). The open app also held 57.6 MB more after ten resets than before the first. `apps/desktop/measurements/built-app-launch.md` publishes these numbers with their commands. The pull request therefore does not close issue #149 by those two lines, and the owner closes or keeps the issue.
