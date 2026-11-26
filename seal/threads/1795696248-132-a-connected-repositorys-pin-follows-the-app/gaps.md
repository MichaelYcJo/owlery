# Closing memo: 1795696248-132-a-connected-repositorys-pin-follows-the-app

## Not verified

| Item | Who must answer |
|---|---|
| The full suite, at the phase 1 commit: phase 1 ran `records-place.test.ts`, `seal-state.test.ts` and `pr-check.test.ts` whole, and `daemon.test.ts` by name, and none of the other test files that import `daemon.ts` or `records-place.ts` through `chain-run.ts` and `chain-command-run.ts` | the orchestrator, at the broad gate |
| Whether an open pull request's next run takes the moved pin once the base branch holds the move (`frame/questions.md` Q3) | a measurement on GitHub, which no agent of this run can make |

## Not done

- **The window between the plan the setup makes again and the write of a moved workflow is not guarded.** A setup's own files are written with the flag `wx`, which refuses a file that appeared after the plan. The moved workflow is written over the commit's file, so no flag can refuse an edit the person saves in the milliseconds between `setUpRecords`'s second `planRecords` and its `writeFileSync`. Where the commit then fails, the bytes read just before the write go back. Where it succeeds, such an edit is replaced by the template. Comparing the file's hash a second time right before the write would narrow that window and not close it, so it was not added.
- **A workflow whose lines end in `\r\n` names no version.** `pinnedVersion` reads only the spelling `workflowText` writes, as `frame/plan.md` *Technical context* sets. A repository whose checkout turns line ends into `\r\n` shows no mark and is offered no move.
