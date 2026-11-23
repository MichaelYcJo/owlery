# Implementation Plan: 1795397381-summary-of-seals

## Technical context

The tree as read at `c148ac4`. #44's frame is read at `ce987b7`, #46's frame and code at `9be0035`, #43's frame at `3c13a7a`, #42's frame at `0cff3e9`, #41's frame and code at `2b75d0e` and #27's at `182fa8c`. The build of this work starts once #44 has merged into `release/v0.0.2` and this branch has merged the release branch, so each coordinate of the seal's code below is named by #44's frame and has no line yet.

**What the work builds on.**

- `apps/desktop/src/renderer/view.ts#changesSince` (line 837) gives the changed work items from a look and the present lists, each with its line, its pane and one sentence. `#summarySentence` (line 864), `#summaryHead` (line 874), `#summaryCount` (line 885) and `#summaryControls` (line 901) say the summary's words from that list. `#inboxLine` (line 147) gives a line its state, and #44 has it read `seal`.
- `apps/desktop/src/renderer/renderer.ts:1444` works the changes out at `ready` and line 1450 chooses the first screen. `#takeLists` (line 1209) takes each `inbox`. `apps/desktop/src/renderer/summary.ts#showSummary` (line 40) draws the screen, and line 50 draws a line with its seal's place. `shared.ts#held` keeps the look of the hello and the changes, and `shared.ts#changedSince` marks a changed work item's title in the lists.
- `apps/desktop/src/daemon/last-look.ts#lookOf` (line 143), `#isWorkItem` (line 96) and `#CameLater` (line 92) are the look's copy and its file's reader. #27, #41 and #43 each add a field to them in the same form.
- `apps/desktop/src/daemon/daemon.ts#workItemOf` (line 1579) builds what a client is sent of a work item, and `#greet` (line 529) sends `ready` after the read of the branches or after `readyWaitMs`.
- `WorkItem.seal` and `shared.ts#sealPlace(where, seal)` are #44's. `WorkItem.recorded` is #46's.
- `apps/desktop/test/built-app.ts#BuiltApp.start` takes `writeRun`, which writes the run folder before the app starts. `test/decisions-and-questions.test.ts` writes a look that way and opens on the summary.

**Constraints.**

- No state lives on the UI's side, so the window keeps no look of its own and works every change out from the look of its hello.
- No message carries a session's id, and no field names a vendor. This work adds no field and no message.
- A page that leaves sends `looked` (`renderer.ts:1671`), so a case that needs a seal between a look and a load writes the look into the run folder before the start.
- No case reaches GitHub or starts a real `claude`, and the built app starts in the background.

**The failure scenario of the chosen approach.** In six months the first failure a person meets is the one this work leaves to the owner: the window stays open for days, the page never loads again, and no summary ever opens by itself, though the daemon records a look at every loss of focus. `frame/questions.md` Q1 holds the choice. The second: a daemon that ran without a client reads a moved head more slowly than `ready` waits, `ready` carries the seal of the earlier read, and a seal that broke while the app was closed is on the work item's line in the inbox and in no summary. The third: the changed set is the load's and the lines are the present, so after a day a line of the summary says a state that nothing of the look explains, as in "Is working." alone. The fourth: `view.ts` holds one more rule of what a change is, the seal's table beside the state, the count and the decisions, and a field added to `inboxLine` by a later work item without its copy in the look opens a summary at every load, as *Grounding* reads of #44's seal. No case of this work holds a later field to that rule.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| The look keeps each work item's seal reading, and the window compares (chosen) | The fourth failure above | Chosen. The look already holds every work item as it was listed, and `changesSince` already compares against it. #44's frame leaves the field to this work, and #27, #41 and #43 each added theirs the same way |
| The daemon works out which seals changed and sends the result | A second place that says what a change is, beside `view.ts`, and a protocol message for it | Rejected. `seal/threads/1795043695-inbox-first-window/frame/plan.md` *Alternatives considered* decided that the window works the changes out, and this frame does not argue it again |
| `seal` is absent until the daemon's first read, and null says the head holds no seal (chosen, replaces #44's null that says both) | A client that reads the key's presence must treat an absent field as no seal where it draws | Chosen. A `ready` that goes out before git answered would otherwise carry null for a sealed work item, and the look holds it `sealed`, so every start of the daemon would open a summary |
| `seal` stays null until the first read, as #44 frames it (keeps the structure) | The summary opens at each start of the daemon for every sealed work item, and a look taken before the first read later shows each seal as given | Rejected. The premise that would keep it is that `ready` always follows the read: checked in `daemon.ts#greet`, which waits `readyWaitMs` and then sends what it holds, and it does not hold |
| A null on either side says nothing of the seal, as a null count of commits does | The first seal a work item ever gets goes from null to `sealed`, and would be no change | Rejected. That change is the one the issue's first line names |
| The summary's sentence counts the seals first and each work item once (chosen) | A work item that is sealed and also waits on a question is counted as sealed, and the count of the ones that need the person is one short | Chosen. `docs/product.md` *Foundation* gives the sentence as "two sealed, one waiting for an answer", one list. The line's icon and the main control still say that it waits |
| The seals are counted apart, after a full stop, as the decisions are | A work item whose seal broke also waits, so "1 seal broken. 1 needs you" reads as two work items | Rejected |
| The line's state is replaced by the product's states, so the sentence counts sealed and broken as states | The lists, the filter and the history are rewritten here and again by #56 | Rejected. `seal/threads/1795330500-no-question-holds-the-run/frame/plan.md` *Alternatives considered* left the replacement to #56 |
| The changed set is the load's, and each line says the present (chosen, replaces the list of changes kept from the load) | The third failure above | Chosen. A red seal on the screen says that this commit was judged (`docs/design.md` *Principles* 1), and a kept list shows a lit seal and "Sealed" for a seal that broke after the load |
| The changes stay as the load worked them out (keeps the structure) | A person opens "Summary" an hour after a commit broke a seal, and the screen says "1 sealed" over a lit seal | Rejected. The premise that would keep it is that nothing a line says turns false while the window is open: checked in `renderer.ts#takeLists`, which does not draw the summary again, and in #44's *Scope* item 5, by which a seal breaks at any commit, and it does not hold |
| The set is worked out again at every `inbox` as well | The window's look is the hello's and never moves, so after a day most work items are marked as changed, and one that returns to the look's state drops off the screen while the person reads it | Rejected |
| Only the seal's place is the present one, and the sentence stays the load's | The line says "Sealed at" beside a broken seal | Rejected |
| A seal the daemon read after `ready` joins the set once (chosen) | The first screen was chosen at `ready`, so the person sees the inbox, with the sidebar's count beside "Summary" | Chosen. A daemon that just started sends `ready` before its first read wherever git takes longer than `readyWaitMs`, and its seals would otherwise be in no summary, since the window's next look holds them |
| A late reading also brings the summary in front | A screen changes under a person who already pressed a key | Rejected |
| The summary opens whenever the window regains focus after a change | A person who steps out of a view for a moment comes back to another screen | Not argued again: the earlier frame rejected it as the default. `frame/questions.md` Q1 |
| The main control says why its work item waits, and a question comes before a broken seal (chosen, replaces the one label) | The screen's first line that waits and the line the main control opens can be two lines | Chosen. A question holds its work item's run, and a broken seal holds nothing that runs. #44's *Scope* item 18 gives a line the same order |
| The main control opens the first line that waits and says "Answer the first question" (keeps the structure) | Enter opens a view that holds no question | Rejected. The premise that would keep it is that every line that waits holds a question: checked in #41's *Scope* item 27 and #44's *Scope* item 18, by which a stopped chain and a broken seal wait, and it does not hold |
| The count of rounds in a sealed line's sentence is `recorded.rounds` (chosen) | The count is of the worktree, so a round record written and not committed is counted | Chosen. The owner's comment on the issue asks for the move from review to the seal, #46 already sends the count, and the look need not hold it |
| The sentence says when the seal was given, as artboard A1 does | A `Seal` holds no time, so the daemon would read one more commit's date for each seal, in #44's reader | Rejected here. The line's age stays the age of its state |
| The screenshot run gains the summary as a view (chosen) | Each run writes more files, and the scene needs a look in its run folder | Chosen. `docs/design.md` has a pull request carry a screenshot of each view it changed, and the run captures no summary |
| No screenshot of the summary | The review reads the changed screen against `docs/design.md` in no file | Rejected |
| The sentences of `docs/design.md` on the run's views change through `## Rule changes` (chosen) | The settle writes them after the release, so until then the document lists the views without the summary | Chosen. #42's and #43's frames add to the same section the same way, no case reads those sentences, and *Principles* 8 asks for a form in the same pull request, which this work does not add |
| The built-app case stands in the start of `test/decisions-and-questions.test.ts` (chosen) | That file's cases read the summary's sentence, which gains a count | Chosen. Its run folder already holds a look, and one more start of the built app costs each run of the suite |

## Phases

Each phase is one crafter's. The cases of a phase are seen red before they are planted, and each phase names its narrow run in its record. Each coordinate of #44's and #46's code is read as merged, and a phase that finds it departs from their frames records the departure in its phase record.

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1. The seal reading and the look | `frame/design.md` *Scope* items 1 and 2 | Scenarios 1 and 2 | |
| 2. What changed, and the summary's words | *Scope* items 3 to 5 and 7 to 9, 11, and the pure functions of items 12 and 13 | Scenarios 3 to 11 | |
| 3. The window, the screenshots and the changelog | *Scope* items 6, 10 and 12 to 17 | Scenarios 12 to 14 | |

## Overlap with the release

The spawn names #44, #46, #42, #43 and #27, whose frames stand committed on their branches, and gives the release's merge order: #27, #45, #41, #46, #42, #43, #44, this work. Each frame was read at the commit *Technical context* names. #41 and #45 are in that order and were read for the files they change. This work merges last, and its build starts once #44 has merged and this branch has merged the release branch.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #44, `1795396351-seal-breaks-after-a-commit` | `src/shared/protocol.ts#WorkItem`, the field `seal`, whose absence and null this work redefines. `src/daemon/daemon.ts#workItemOf`, which this work has leave the field out before the first read. `src/renderer/shared.ts#sealPlace`, which this work calls with the present seal. `src/renderer/view.ts#inboxLine`, whose reading of `seal` this work leaves out of a comparison where a side has no reading. `src/renderer/summary.ts`, the line's seal's place. `test/daemon.test.ts`, `test/view.test.ts`, `test/screenshots.test.ts` and the scene of the screenshot run | #44 | This work reads the field #44 defines, and #44's frame leaves the look and the summary to it. What this work needs of #44 as merged: `Seal` with its state, its commit and its sentence; `sealPlace` taking the seal; the map that keeps the seals by work item; a scene with a sealed work item and a broken one |
| #46, `1795342001-progress-through-roles` | `src/shared/protocol.ts#WorkItem`, the field `recorded`, whose `rounds` this work reads. `src/renderer/view.ts` and `test/view.test.ts`, in other functions | #46 | It merges fourth of the release. This work reads a count #46 sends and changes nothing of it |
| #43, `1795395059-pull-request-and-seal-check` | `src/renderer/view.ts#changesSince`, where #43 counts no decision of a merged pull request and this work adds the seal. `src/daemon/last-look.ts`, where both add a field. `docs/product.md` *Foundation* and `docs/design.md` *A pull request that changes the window carries its screenshots*, where both hold operations for the settle. `test/screenshots.test.ts` | #43 | It merges before #44. The operations name no common sentence, so the settle places each |
| #41, `1795388700-review-rounds` | `src/daemon/last-look.ts`, where both add a field. `src/renderer/view.ts#inboxLine`, where #41 makes a stopped chain wait, which the main control's second label covers | #41 | It merges third of the release |
| #27, `1795388701-agent-choices-and-behind` | `src/daemon/last-look.ts`, where #27 adds a field of a work item and one of a session. `test/last-look.test.ts`. `docs/product.md` *Foundation*, where both hold an `add` | #27 | It merges first of the release |
| #42, `1795393338-broad-gate-and-sealer` | `docs/design.md` *A pull request that changes the window carries its screenshots*, where both hold operations, and the scene of the screenshot run | #42 | It merges before #43. This work reads the forms of the records its cases commit |
| #45, `1795341001-cost-per-stage` | `src/shared/protocol.ts`, in other declarations | #45 | It merges second of the release, and neither reads a rule or a fact of the other |

Issue #47 is not in the order the spawn gives. It builds the sealed work item's view, and this work leaves that view to it.

## Operational impact

- No migration. A `last-look.json` written before this work holds no seal reading, so the first load after the update shows no seal as given by that look, and the next look holds the readings.
- No new environment variable, no new dependency and no new message of the protocol.
- A client of an earlier build that meets a daemon of this build gets no `seal` for a work item not yet read, where #44's build sent null. Such a client reads both as no seal.
- This pull request moves no version.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
