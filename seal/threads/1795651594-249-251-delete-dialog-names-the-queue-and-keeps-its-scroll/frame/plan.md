# Implementation Plan: the delete dialog names the queue and keeps its scroll (#249, #251)

## Technical context

The tree as read at `ea8126b5`.

The work is in the renderer, its markup, the cases that pin them, the screenshot run and the row "The delete dialog" of `docs/design.md`. Nothing in the daemon changes, and no message of the protocol. `frame/design.md` *Grounding* names each coordinate. The build stands on these:

- `apps/desktop/src/renderer/view.ts:982-1072`: `Removal`, `removalOf`, `headlessRuns`, `runningIn`, `archivalOf` and `runningSessions`, which decide the lines every session dialog names.
- `apps/desktop/src/renderer/renderer.ts:452-505`: `namedLines` and `lossParts`. `:1114-1168` is `showRemove`, `:1235-1251` is `showDelete`, `:1425-1445` is `showArchive` and `:1473-1485` is `showDaemonEnding`.
- `apps/desktop/src/renderer/renderer.ts:274` and `:1321-1322`: `recordsDrawn`, the comparison this work's helper takes its form from.
- `apps/desktop/src/renderer/index.html:1010-1069`: the markup of the session dialogs.
- `apps/desktop/test/view.test.ts:696-886`, `apps/desktop/test/work-item-menu.test.ts:729-937` and `:999-1100`, `apps/desktop/test/machine-dialog.test.ts:316-390`, `apps/desktop/test/screenshots.test.ts:580-585`.

Constraints:

- **This machine runs one heavy command at a time** (`seal/config.json` *Heavy commands*). A built-app file runs once per phase, in one batch at the phase's end, and never one launch per fix. The narrow form is `cd apps/desktop && node scripts/test-in-electron.mjs test/<file>`.
- **An agent's start of the built app sets `OWLERY_BACKGROUND=1`**, so the window does not take the owner's screen.
- **The broad gate compares the headings and the table rows of `docs/*.md` with `docs/*.ko.md`.** Each phase that edits the row "The delete dialog" edits it in both editions in one commit.
- **`## Rule changes` holds items only.** #214's round 1, finding 5, found a paragraph there that stopped the settle's reader.

The chosen approach, and what breaks in six months:

- **The approach.** `view.ts` answers the sessions as two lists of lines, and one function builds the sections with their heads. One function of the renderer draws them in every session dialog. One helper draws a part of a dialog only where the values it is drawn from differ from the ones it was last drawn from.
- **What breaks.** Someone adds a value to what a kept part draws, such as a mark on a loss row that depends on "Force delete", and does not add it to the values compared. The part then shows the old drawing until its loss changes. The helper's `build` takes no argument and the design asks that it read only the compared values, but nothing checks that. The built-app cases that read a list after a change of its loss catch the case where a compared value is dropped, and catch nothing where a new one is never added.
- **A second cost.** The delete dialog grows by one head and its lines where a session waits. The screenshot's dialog fitted the 900px window without a scroll of its own (`seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/trail/phases/phase-2.md`). With the new section it may not, and then it scrolls as a whole, as every modal dialog does. Q3 of `frame/questions.md` holds what phase 3 reads.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Rebuild each list and write its `scrollTop` back after the rebuild, the second direction of #214's round 1, finding 1 | The rows are new elements, so the tooltip under the pointer still closes at every `inbox`. #251's first *Done when* line asks that a redraw "leaves its rows in place". A list that snaps also has to take the written value in the same task. | Rejected: it meets half of the issue. |
| A variable beside each drawn part, as `recordsDrawn` is and as the round's paste-ready fix for the delete dialog adds `deleteLossDrawn` | The removal dialog is drawn from several values and the session dialogs each from their lines, so every kept part would carry a variable and a hand-written comparison of its own, and the next kept part copies the pattern again. | Rejected for one helper that holds the comparison once. The identity comparison of the round's fix is what the helper does for `#delete-loss`. |
| Keep each work item's loss apart in the removal dialog, in an element of its own, so one work item's answer redraws only its lists | It needs a wrapper element around each work item's head, sentence and lists, which changes the markup `lossIn("remove-losses")` and the styles read. The gain is the second after the choice to delete is taken, while the answers arrive. After that a redraw changes none of them. | Rejected: `#remove-losses` is kept as a whole. |
| Replace the structure: every dialog reconciles its drawn elements against its words at each draw, and no `show…` function rebuilds anything | It rewrites the draw of every dialog of the window, the Accounts dialog among them, which #218 rewrites in this release, and the Machine dialog. Each owes a built-app case and screenshots. The press hold of #242 already answers the lost click that a rebuild causes. | Rejected for this work. The premise that keeps the rebuild elsewhere was checked: the other dialogs' lists are named in `frame/design.md` *Scope*, *Out*, and neither issue names them. |
| Keep the structure of #249 as it is: the static `<section>` in each dialog's markup, and a second static section beside each | The head of each kind would stand once per session dialog in `index.html`, and the code that builds the rows stands in several functions today (`frame/design.md` *Removes*). A change of a head's words then needs an edit in each dialog, and one is missed. | Rejected: the heads move to `sessionSections`, as #214 moved the loss heads to `lossSections`. The premise that would keep the markup, that a case reads the static section, was checked: the cases read `#<id> li` and `#<id>.hidden`, which the container keeps. |
| One list with a word on each waiting line, such as "Asked: … (waiting for the machine)" under the old head | The head "Running sessions that end" stays above a session that does not run, which is the defect the issue names. | Rejected. |
| Leave the waiting sessions out of the dialogs | The dialog then ends something it did not name, against "What will be lost is said before it is lost". The daemon also refuses a request that leaves a queued session out of `running.headless`. | Rejected. |
| Split the sessions in the daemon and send the dialogs' words | The daemon holds no words of the window, and the renderer already holds each session's state. | Rejected: the protocol stays as it is. |
| The built-app case of #249 in `work-item-menu.test.ts` | That file's app has no cap on agents, so the case would need its own app with `limits.json` and a held session. `machine-dialog.test.ts` already starts one. | Rejected: the case joins the queue's `describe` of `machine-dialog.test.ts`. |
| Two work items, one per issue | The owner chose one item (`routing.md` *Why this way*). Both issues change `showDelete` and `showRemove`. | Not argued again. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1, 2, 3, 4 and 5, and the sentences of item 9 that state item 1 | `cd apps/desktop && node scripts/test-in-electron.mjs test/view.test.ts` while building, with the cases of `archivalOf`, `removalOf`, `runningSessions` and the sections rewritten and each shown red against `ea8126b5`'s `view.ts`. `git grep -n 'Running sessions that end' -- apps/desktop/src/renderer/index.html` prints nothing. At the phase's end, one batch: `cd apps/desktop && node scripts/test-in-electron.mjs test/machine-dialog.test.ts test/work-item-menu.test.ts test/daemon-restart.test.ts`, with the new case of the delete dialog in the queue's `describe`. The broad gate is the orchestrator's. | `acb1d227` |
| 2 | *Scope* items 6, 7 and 8, and the sentence of item 9 that states items 6 and 8 | At the phase's end, one batch: `cd apps/desktop && node scripts/test-in-electron.mjs test/work-item-menu.test.ts`, with the cases of a long list at a redraw. Each is shown red with the helper's comparison removed, where it fails at its read of `scrollTop`. | |
| 3 | *Scope* item 10, and the `add` operations of `frame/design.md` *Rule changes* | `cd apps/desktop && node scripts/test-in-electron.mjs test/screenshots.test.ts` without `OWLERY_SCREENSHOTS`. At the phase's end, one run: `OWLERY_SCREENSHOT_THEMES=all pnpm --filter @owlery/desktop run screenshots`. Its `*-delete.png` files are committed under `seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll/screenshots/`. The phase record says whether the dialog still fits the window (Q3). | |

## Overlap with the release

The spawn named #218, #231, #224, #217, #215, #216, #223 and #213. The branches of #218 and #231 hold their `routing.md` alone on origin (`git ls-tree` of each after `git fetch`, `executed`, 2026-11-26). The branches of the others are not on origin, so each of their rows is judged from the issue's body, and what their frames decided is `unverified`: the orchestrator answers it when each branch arrives.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #224 | #224 takes the view's "Ask" section out, "with the protocol message the window alone sent, if nothing else sends it". That message is `ask`. The queue of `apps/desktop/test/machine-dialog.test.ts:316-390` and the screenshot scene's waiting session (`apps/desktop/test/screenshots.test.ts:820`) are both made with it, and this work's case of the delete dialog and its delete view's wait read those scenes. #224 also rewrites the scene's text in `docs/design.md` *A pull request that changes the window carries its screenshots*, where this work adds a paragraph through *Rule changes*. Both edit `apps/desktop/src/renderer/view.ts` and `index.html`. | #249/#251 | This work is the smaller diff and touches no daemon or protocol file, so it is likelier to be sealed first. #224 already has to give those scenes a waiting session some other way if `ask` goes, such as a chain's stage. It then meets this work's readers of them, in rounds it runs anyway. Where #224 merges first, this work's phases 1 and 3 build their scenes on what #224 left, and the orchestrator folds that into this plan before the spawn. |
| #218 | `apps/desktop/src/renderer/renderer.ts` and `index.html`: #218 rewrites the Accounts dialog (`showAccounts`, around `renderer.ts:900`, and its markup), and this work the session dialogs. `apps/desktop/test/screenshots.test.ts`: #218 changes the Accounts views, this work the delete view's wait. `docs/design.md` *Components and their states*: different rows. | #249/#251 | No section both change. This work is the smaller diff. #218 merges the release branch in and meets changes in other functions of the same files. |
| #217 | `apps/desktop/test/work-item-menu.test.ts`: this work's cases make work items through the form #217 changes. #217's issue has the delete dialog name no branch where none stands, which is `lossSections`; this work draws `#delete-loss` through the helper and leaves `lossSections` alone. | #249/#251 | #217 changes the daemon, the form and every reader of the branch, so it is the larger diff and is sealed later. Its cases then read the kept lists as merged. |
| #215 | `apps/desktop/test/work-item-menu.test.ts`: #215's built-app case deletes the last work item of a repository under a chosen filter. `apps/desktop/src/renderer/view.ts` and `index.html`, in other parts: the sidebar's tree and its filter. | Either | No function both change. The later one merges a test file both added cases to. |
| #216 | `apps/desktop/src/renderer/renderer.ts`: #216 adds a press that asks the daemon for its lists again and redraws with the answer. That answer is drawn through the same path as an `inbox`, so an open dialog's kept lists stay kept. A session dialog is modal, so the button cannot be pressed while one is open. | Either | #216 changes how the lists are asked for, and this work what a dialog does when they arrive. Neither reads the other's change. |
| #213 | #213 adds a tab menu whose close "asks once for all of them, naming each" working session. That is a new dialog that names sessions. It names panes, and a pane never waits for the machine, so it owes no queue section. `renderer.ts` and `index.html`, in other parts. | #249/#251 | Where #213's dialog lists its panes under "Running sessions that end", it can draw through this work's function and take the head from `sessionSections`. Merging this work first lets #213's frame read that function as merged. |
| #231 | `apps/desktop/src/renderer/index.html` at most, for the find bar's styles. #231's work is in `work-item-view.ts`, the settings and the pane. | Either | No section both change. |
| #223 | `apps/desktop/src/renderer/view.ts` and `apps/desktop/test/view.test.ts`, in other parts: `approvalPlaces`. | Either | No function both change. |

## Operational impact

None. No migration, no environment variable, no dependency and no compatibility break. The version does not move in this pull request: `release/v0.0.5` already holds 0.0.5 (`routing.md` *Why this way*).

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
