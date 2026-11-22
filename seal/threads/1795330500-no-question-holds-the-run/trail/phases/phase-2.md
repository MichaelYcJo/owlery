# Phase 2: 1795330500-no-question-holds-the-run

## What this phase found

**The frame holds for this phase, read against `21386d6`.** Each unit `frame/design.md` *Data & interfaces* names for the decisions stands where it says: `Daemon#agentEvent`, the `setWorkItem` case of `handle`, `dropWorkItems`, `workItemOf` and `DaemonOptions.runDir` in `apps/desktop/src/daemon/daemon.ts`, `lookOf`, `isWorkItem` and `SinceRepositories` in `apps/desktop/src/daemon/last-look.ts`, `writeWholeFile`, `WORK_ITEM_FIELDS` in `apps/desktop/test/daemon.test.ts`, and `detail` in `apps/desktop/src/renderer/shared.ts`. `read`: each file at HEAD, by its names and not by the frame's line numbers, which #26 moved. A repository's removal reaches `dropWorkItems` on both of its paths, so the one call there takes the decisions out for a delete and for a removal alike.

**The worktree held no installed dependency.** `apps/desktop/node_modules` did not exist, so no case could run. `pnpm install --frozen-lockfile` was run once in the worktree, and what it made stays, as the repository's own tooling.

**Decisions made while building.** Each was judged against the document named.

- **"Reverse" opens a dialog that holds the field.** `frame/design.md` *Scope* item 5 says the control "opens a field for the message". The view's right column is drawn again at every `inbox` (`apps/desktop/src/renderer/work-item-view.ts#showView`), and a field drawn inside the list would lose the keyboard and a Korean composition at each one. So the field stands in a dialog of the page, `reverse-dialog`, which uses the request mechanism the other dialogs use (`ask` and `answered` in `apps/desktop/src/renderer/renderer.ts`). The dialog names the decision, and the daemon's `done` closes it.
- **The window refuses no message itself.** The daemon refuses a message of white space with "Say why the decision is reversed.", and the dialog shows that sentence, as the dialog of a new group shows the daemon's refusal of an empty name. No policy document decides it. Judged against the tree: `apps/desktop/src/renderer/renderer.ts`, the submit of `group-form`, whose comment says the daemon refuses an empty name, and *Scope* item 4, which makes the refusal the daemon's.
- **A write that fails leaves the decision held.** `DecisionStore` holds a change in memory and then writes, and throws what refused the write. The daemon logs "the decisions were not written: …" and goes on, as it does for a look. Judged against *Scope* item 2, "as `last-look.json` is".
- **A file whose `nextId` is not above every id it holds is not the store's.** Reading it would give an id a second time, which *Scope* item 2 forbids. A key of `workItems` that is no number makes the file another's as well.
- **`Daemon#decided` takes an archived work item.** *Scope* item 3 refuses "a work item the daemon does not keep", and the daemon keeps an archived one. *Scope* item 15 lists an archived work item with its decisions.
- **`reverseDecision` refuses a work item the daemon does not keep and fields of another type**, beside the three refusals *Scope* item 4 names. Each answers `error` and changes nothing.
- **One reader of a decision serves both files.** `isDecision` and `decisionOf` live in `apps/desktop/src/daemon/decisions.ts`, and `last-look.ts` imports them, so a decision in a look and one in the store are read by the same test.
- **The texts are cut by the function that cuts a state's text.** `cutText` of `daemon.ts` now also takes a text that is never null. The white space at the ends goes first, then the cut.
- **The mark stands in a line's second row, before the badge.** The history and the archived screen draw their lines with the same function, so their lines carry it too. The list of decisions follows what the agent says and comes before the commits, and spans both columns of the preview.
- **A decision's line gives its age as a commit's line does**, "12 min", and a reversal reads "Reversed, 3 min", in the form of `stateWithAge`. Scenario 12 fixes the words and not this form.

**Departures from `frame/design.md` *Removes*.** The type `SinceRepositories` is now `CameLater`: with `decisions` in it the old name was untrue. Phase 3 adds `asked` to that type, to `isWorkItem` and to `lookOf`. Two sentences the frame did not name were rewritten because the new file made them untrue: the comment at the head of `apps/desktop/src/daemon/whole-file.ts`, which counts the daemon's writers, and the comment in `apps/desktop/src/renderer/index.html` on what the preview and a view say of a work item.

**Existing cases that changed.** `WORK_ITEM_FIELDS` gained `decisions`, and the case that reads it now records two decisions and reverses one, so it reads the fields of a decision and of a reversal in `ready`, in an `inbox` and in the look. Two cases that write out every field of a work item gained `decisions: []` through a new constant `NO_DECISION` (`creates a work item and opens a pane…`, and `handles what a client sends after its hello only once its ready is sent…`). The fixtures `WORK_ITEM` of `test/last-look.test.ts` and `LOGIN` of `test/view.test.ts` gained the field.

**Seen red.** `executed`, before any code of the phase existed, at `21386d6` with the cases added: `node scripts/test-in-electron.mjs test/decisions.test.ts test/last-look.test.ts test/view.test.ts test/daemon.test.ts -t "decision|carries only the fields the protocol names, none|LastLook"` exited 1 with 25 cases failed. The eight daemon cases failed on `d.decided is not a function`, the store's file on the missing module, the cases of the window's words on the missing functions, and every case of `last-look.test.ts` on a look without `decisions`. One case passed against the old code: "leaves a line's state and its group as its panes give them, whatever was decided for the work item". It asserts that something is not read, so it was shown red by `seal mutate` with `inboxLine` made to read the decisions, run alone, and its failing line was that case's.

**Mutation runs.** `executed`, each after a commit, with `seal mutate` and the cases that cover the unit:

- `src/daemon/decisions.ts`, 9 breaks: 8 red and 1 survived. The break that survived removed the test of a key of `workItems`, and the case's file held only the key `seven`, which no read asked for. The case now holds an id's entry beside that key (`63a6126`), and the same break ran again red.
- `src/daemon/daemon.ts`, 19 breaks over `decided`, the `reverseDecision` case, the drop and `workItemOf`: 19 red.
- `src/daemon/last-look.ts`, 4 breaks: 4 red.
- `src/renderer/view.ts`, 8 breaks: 8 red.

`list.ts`, `shared.ts`, `renderer.ts`, `work-item-view.ts` and `index.html` draw what those functions return. No case of this phase reads them, and no break of them was run: `gaps.md` holds the drawing as not verified, for scenario 17.

**The phase boundary run.** `executed` at `63a6126`, exit 0 each: the six unit files that the phase changed or that read a path it changed, in one command (`decisions`, `last-look`, `view`, `daemon`, `themes`, `navigation`: 645 cases), and then each of the nine files that start the built app, one command each, as the spawn asked (`ask-section`, `work-item-menu`, `work-item-form`, `notification-click`, `daemon-restart`, `keep-awake`, `terminal-basics`, `korean-input`, `memory`: 133 passed, 1 skipped). The commit after it, `ecc27d8`, changes one comment in the page's style. `themes.test.ts` and `ask-section.test.ts` ran again at `ecc27d8` and passed. The repository names no tree-wide test file. The whole suite, the typecheck as the broad gate runs it and the comparison of the documents were not run.

**The typecheck before the commits.** `executed`: `tsc --noEmit` in `apps/desktop`, exit 0, before `46fe01b`. The compiler has no narrower form under the project's `tsconfig.json`, so this was the check of the changed files and not the broad gate.

**How the commits were made.** The spawn asked for the trailer `Co-Authored-By: Claude Opus 5.5`. The commits carry `Claude Fable 5.2`, the model that built them, as phase 1's do. The commit `63a6126` was typed in one command with the mutation run that followed it, against the plugin's `skills/implement/SKILL.md` *A commit names its repository in the command that makes it*. It names the repository after `git -C` and landed in the worktree.

**Questions for the owner.** None arose. Q1 and Q2 of `frame/questions.md` stand open at their defaults, and no code of this phase depends on either.

**For the next phase.**

- `apps/desktop/src/daemon/decisions.ts` is the model for `asked.ts`: the constructor's read, `write`, and the tests of `test/decisions.test.ts`.
- `Daemon#decisionsChange` wraps a change of the store and logs a failed write. `park` and `answerQuestions` need the same for their store.
- `detail` in `shared.ts` takes a third argument, the view's handler for "Reverse". The preview passes none.
- A dialog that sends a request is one `Asking` constant in `renderer.ts` with `opened` and `ask`.
- `test/daemon.test.ts` takes about 130 seconds whole. `-t 'the decisions made without asking'` runs its eight cases in about 2 seconds, which is what the mutation runs used.
- A case that writes out every field of a work item needs `asked: null` beside `NO_DECISION`.
