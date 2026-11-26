# Closing memo: 1795696248-132-a-connected-repositorys-pin-follows-the-app

## Not verified

| Item | Who must answer |
|---|---|
| The full suite, at the phase 1 commit: phase 1 ran `records-place.test.ts`, `seal-state.test.ts` and `pr-check.test.ts` whole, and `daemon.test.ts` by name, and none of the other test files that import `daemon.ts` or `records-place.ts` through `chain-run.ts` and `chain-command-run.ts` | the orchestrator, at the broad gate |
| Whether an open pull request's next run takes the moved pin once the base branch holds the move (`frame/questions.md` Q3) | a measurement on GitHub, which no agent of this run can make |
| The full suite, the typecheck of every package and the documents' check at the phase 2 commit: phase 2 ran `view.test.ts` and `screenshots.test.ts` whole, `records-dialog.test.ts` whole in the built app, the screenshot run in every theme, and `tsc --noEmit` of `apps/desktop` | the orchestrator, at the broad gate |
| The drawing of a named work item in the dialog of the move, in the built app: `renderer.ts#showRecords` fills `#records-unread-list` with each entry's title and the reader's sentence, and no built-app case or shot holds a work item whose records the readers refuse. `view.test.ts` pins the words, and scenario G's case of `daemon.test.ts` pins the daemon's list | the review, by reading `renderer.ts#showRecords` |
| The built-app batch of phase 2 ran on Electron 45.3.3 from the main checkout's `node_modules` (`ELECTRON_OVERRIDE_DIST_PATH`), since this worktree's `electron` package holds no binary | the orchestrator's broad gate, from a checkout that holds its own binary |

## Not done

- **Between the read and the write of a moved workflow, two system calls of one synchronous step remain unguarded.** A setup's own files are written with the flag `wx`, which refuses a file that appeared after the plan, and no flag can refuse an edit of a file that is written over. `setUpRecords` reads the workflow's bytes before it makes the plan again, and refuses the move where the bytes read just before the write differ. An edit saved before the plan hashes the file blocks the plan, and one saved while the plan runs git after that is refused (`records-place.test.ts`, "refuses a move where the workflow changed while the plan was made again"). Only an edit saved between `readFileSync` and `writeFileSync`, with no await between them, is still replaced. No check outside the file system's own locking closes that last gap, so none was added.
- **A workflow whose lines end in `\r\n` names no version.** `pinnedVersion` reads only the spelling `workflowText` writes, as `frame/plan.md` *Technical context* sets. A repository whose checkout turns line ends into `\r\n` shows no mark and is offered no move.
- **No shot shows a work item named in the dialog of the move.** The scene's work items hold records the readers read, and a work item whose records they refuse would change the lines, the views and the summary the run already captures. `view.test.ts` pins the list's words instead.
- **Only the shots of the one view this work adds are committed.** The run in every theme made 108 shots at `bd52ff9b`. This work changes nothing the other views draw, since the row's button appears only while the view of the move stands, so the six shots of `check-move` are committed under `screenshots/` and the other 102 are not.

![The dialog of the records place moving the check from Owlery 0.0.4 to 0.0.5, with "Check 0.0.4" on the repository's row, in Night watch, dark](../blob/f7bd0b5db3e1df0e15e5619bcbbc7bd68ec89787/seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/screenshots/night-watch-dark-check-move.png?raw=true)

![The dialog of the records place moving the check, in Night watch, light](../blob/f7bd0b5db3e1df0e15e5619bcbbc7bd68ec89787/seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/screenshots/night-watch-light-check-move.png?raw=true)

![The dialog of the records place moving the check, in Register, dark](../blob/f7bd0b5db3e1df0e15e5619bcbbc7bd68ec89787/seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/screenshots/register-dark-check-move.png?raw=true)

![The dialog of the records place moving the check, in Register, light](../blob/f7bd0b5db3e1df0e15e5619bcbbc7bd68ec89787/seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/screenshots/register-light-check-move.png?raw=true)

![The dialog of the records place moving the check, in Desk, dark](../blob/f7bd0b5db3e1df0e15e5619bcbbc7bd68ec89787/seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/screenshots/desk-dark-check-move.png?raw=true)

![The dialog of the records place moving the check, in Desk, light](../blob/f7bd0b5db3e1df0e15e5619bcbbc7bd68ec89787/seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/screenshots/desk-light-check-move.png?raw=true)
