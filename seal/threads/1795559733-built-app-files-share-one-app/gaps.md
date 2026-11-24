# Closing memo: 1795559733-built-app-files-share-one-app

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the typecheck and the rest of the broad gate at the branch's head | the orchestrator, at the broad gate |
| That `pnpm run test:app` runs the `app` project's files, one at a time, and no file of the `unit` project | the crafter of phase 2, which runs it (`frame/plan.md` *Phases* row 2) |
| Whether the medians of `pnpm run measure:launch` move on a machine that stays quiet: the 1-minute load average rose from 3.29 to 16.92 during the one run of phase 1, and the cause is not known | the orchestrator, who decides whether phase 2 runs the measurement again before it publishes the numbers |
| Whether the open app's memory goes on growing past ten resets: it read 163.2 MB before the first reset and 220.8 MB after the tenth, one sample each | the owner, who weighs it in answering `frame/questions.md` row Q1; where the answer is (b), the framer plans its measurement |

## Not done

**The issue's first and second *Done when* lines, one open app that the built-app files share within a run and across runs, are not built.** `frame/questions.md` row Q1 is open, and its default (a) holds until the owner answers. The measurement of phase 1 gives the saving the shared app would buy: a median of 507 ms for each launch, from a launch of 688 ms without its build against a reset of 181 ms (`trail/phases/phase-1.md`). The open app also held 57.6 MB more after ten resets than before the first.
