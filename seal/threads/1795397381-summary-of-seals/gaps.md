# Closing memo: 1795397381-summary-of-seals

## Not verified

| Item | Who must answer |
|---|---|
| How long the read a hello waits for takes where several heads moved while no client was connected, and under the load of the broad gate. Phase 1 timed one moved head at a time, 231 to 361 ms at 2 and 10 round records, under a load average of 5 to 6 (`trail/phases/phase-1.md`), which answers `frame/questions.md` Q4 for that case alone | a measurement: the orchestrator, when it folds Q4, decides whether a probe of several heads under load runs before the pull request |
| Whether a case that compares a whole work item from a `ready` after a start of the daemon still passes where the hello's read takes longer than 500 ms. Since phase 1 such a `ready` carries no `seal` where it carried null. The cases that read `seal` by name were listed and wait for the read; the cases that compare a whole work item were not listed, and those in the files of phase 1's narrow run passed at a load average of 5 to 6 | the orchestrator's broad gate |
| Phase 1's narrow run at `fb131bf`. It ran at `410c046`, where 998 of 999 cases passed, and `fb131bf` changed the one pin that failed and a docstring. Only that pin ran again | the orchestrator's broad gate |

## Not done

The bullet "For a client of the daemon" of `seal/threads/1795396351-seal-breaks-after-a-commit/changelog.md` is untrue since phase 1: it says that the daemon sends `seal` wherever it sends a work item, and that the last look holds no `seal`. Phase 1 did not rewrite it, since `frame/plan.md` gives it to phase 3 (`frame/design.md` *Scope* item 17), and that fragment is another work item's file.
