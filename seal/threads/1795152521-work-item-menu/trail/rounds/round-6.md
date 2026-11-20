# Review round 6: 1795152521-work-item-menu

```seal
target: 1bce10f against release/v0.0.1
```

The round reads the range `dcebd6d..1bce10f`, which holds four things. The first is the fix pass of round 5's finding 1, `e2aaa36`. The second is phase 6 of `frame/plan.md` *Phases*, groups and the changelog fragment: the code of `45fc971` to `883f56c`, the fragment `d156768` and the record `c623b8e`. The third is the orchestrator's fold `5455b50`, which closes round 5's findings 2 and 3 and folds the statements phase 6 named. The fourth is the close blocks `5720371` and `1bce10f`. This round answers round 5 under `## Confirmations`. `seal/parity.json` does not exist, so no comparison with an original was owed.

Read whole at `1bce10f`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-6.md` and `trail/rounds/round-5.md`. Rounds 1 to 4 were read for their findings and coordinates. No `pr.md` and no `pr.<lang>.md` stands. `git diff --stat d156768..1bce10f -- apps` prints nothing, so the code is phase 6's last code commit, and every run below ran on it.

Carried from earlier rounds, and not searched again: where a folder's repository is read (round 4), the order of `Daemon#deleteOne`'s steps and its three refusals (round 5), and that the renderer writes no HTML from data. The last was searched again because phase 6 draws a group's name from the daemon: `git grep -n -e innerHTML -e insertAdjacentHTML -e outerHTML -- apps/desktop/src/renderer` printed no line, and the heading and the menu's items set `textContent` (`apps/desktop/src/renderer/shared.ts:79-84`, `apps/desktop/src/renderer/menu.ts:86`). Each verdict below was reached again at `1bce10f`.

**The points the orchestrator asked this round to look at.**

- *Groups in the daemon and the store.* A group of another repository and an id no repository holds are both refused with "Group <id> is no group of the work item's repository.", and nothing of the message is set, its pin neither (`apps/desktop/src/daemon/daemon.ts:448-456`). A removed repository takes its groups with it, and `nextGroupId` only rises, so a store read again from its file gives no removed group's id twice (`apps/desktop/src/daemon/repositories.ts:227`, `:274-281`). A work item whose group its repository does not hold is listed among the ungrouped, and its menu offers every group and no "Move out of" (`apps/desktop/src/renderer/view.ts:211`, `:838-841`). An archived work item keeps its group, and its menu holds no move. A deleted work item leaves its group with one fewer. Executed in `test/repositories.test.ts`, `test/daemon.test.ts` and `test/view.test.ts`, and read.
- *The sidebar under a search or a filter.* While either is applied, a group none of whose work items is left is not drawn, and a repository is left out only where no work item is left in its groups or out of them (`view.ts:210`, `:214`). The row's count is of every work item left under the repository, and a heading's count is of the group's work items left. Groups stand in the order the repository holds them, which is the order they were made (`repositories.ts:278`). Executed in `test/view.test.ts`.
- *"Move to" and "Move out of".* They stand between the mute and Archive, in the groups' order, with a rule above the first. The menus of the sidebar, the inbox and the history all hand `workItemMenu` the groups of the work item's repository (`apps/desktop/src/renderer/renderer.ts:460`). `apps/desktop/src/renderer/list.ts` is not changed in the range. The inbox draws its state groups under `h2.caption` headings, and the history and the archived screen draw one list, so neither shows a group. Executed in `test/work-item-menu.test.ts` for the sidebar's menu, and read for the inbox's and the history's, as `gaps.md:44` names.
- *The three built-app files phase 6 did not run.* `work-item-form`, `korean-input` and `notification-click` each ran by itself at `1bce10f` and passed (`## Probes`). `frame/plan.md:21` has a proofer start the app through `test/work-item-menu.test.ts` alone. These three starts went beyond that sentence because the spawn allowed them, and each went through `BuiltApp.start` under `OWLERY_BACKGROUND=1`.

**What the fold `5455b50` says, read against `1bce10f`.**

- Item 20's "the same three ways" holds: `deleteOne` runs one read with three refusals, twice (`daemon.ts`, `deleteOne`, unchanged in the range).
- Item 21's new sentence holds: a removal that deletes keeps deleted the work items it deleted before a refusal.
- Item 22's new sentences hold. The name is trimmed (`daemon.ts:437`). Two groups may share a name (`repositories.test.ts`, the case of `addGroup`). A move into another repository's group gets the sentence the item quotes. A group with nothing left is hidden under a search or a filter. The heading and the row carry their counts. A work item whose group is gone is listed among the ungrouped.
- The `setWorkItem` line of *Data & interfaces* holds (`apps/desktop/src/shared/protocol.ts:240-241`).
- The two `to:` lines of `## Rule changes` are round 5's snippet word for word, compared line by line.
- The Status cell `d156768` of `frame/plan.md` *Phases* row 6 names the commit that `trail/phases/phase-6.md` says closed the phase, as row 5 names `8a20286`.
- Scenario 5's new count does not agree with the clause after it. That is finding 1.

**`changelog.md`, read as release notes.** Each line says what a person sees or does, and each holds at `1bce10f`. The intro states the issue. Lines 5 to 15 name the controls by the words on the screen. Line 8's list of apps is the list of `apps/desktop/src/main/openers.ts:18-26`. Line 9's "first in its list" holds in a group of the sidebar too. Line 15 holds against `sidebar.ts#showSidebar` and `list.ts`. Lines 16 and 17 say what a person meets after an update. Line 18 is addressed to a client of the daemon and is the protocol as `protocol.ts` states it. Two claims rest on what no case reaches, and `gaps.md` names the owner for both: line 6's press with the Control key (`gaps.md:16`, `:25`) and line 14's Trash (`gaps.md:34`).

Claimed by phase 6, and found. The phase claims eight case files and then two more passed at `d156768`. In this round, four of them passed at `1bce10f`, with 438 cases: `view`, `repositories`, `daemon` and `last-look`. The phase claims `test/work-item-menu.test.ts` passed by itself with 25 cases, and it did in this round. The phase claims each new case was seen red. `red-view.txt` and `red-menu.txt` in the phase's scratch hold the two failures the phase quotes, read. The mutation table was read and not run again. The phase also claims the two assertions of `883f56c` were written after their code, with their red in two sidebar mutants. That is disclosed as a departure, and the assertions pass. `gaps.md` loses no row of `## Not verified`. The row at `gaps.md:36` is rewritten in place from five things to three, and it names the two that left as held by the case of round 5's fix. Four rows are added. Under `## Not done`, two paragraphs about "New group" and the menu's group items left because phase 6 built both, and four are added, each saying what was within reach.

Two parts of the new cases hold less than their words say. Neither is a finding. In `test/work-item-menu.test.ts:637`, the check that the inbox shows no group counts `.group-head` under `#inbox-screen`. `list.ts` never draws that class, so the count would stay 0 whatever the inbox drew. The inbox's order `[1, 2]` beside it holds more, and `list.ts` is unchanged in the range. The case of `test/view.test.ts:1419` overlaps the case after it, which holds the groups' order, a pinned work item inside a group and a group its repository does not hold. It is scenario 5's own case, though, and the only one with a hidden repository that holds a group and a grouped work item.

## Findings

### 1. Scenario 5 now gives three repositories, two of them not hidden, and still says the tree holds "the repository that is not hidden"

```seal
severity: should
location: `seal/threads/1795152521-work-item-menu/frame/design.md:155`
evidence: read `seal/threads/1795152521-work-item-menu/frame/design.md:75`, `seal/threads/1795152521-work-item-menu/frame/design.md:155`, `seal/threads/1795152521-work-item-menu/frame/plan.md:82`, `seal/threads/1795152521-work-item-menu/trail/phases/phase-6.md:9`, `apps/desktop/src/renderer/view.ts:202-215`, `apps/desktop/test/view.test.ts:1419-1430`; executed `node scripts/test-in-electron.mjs test/view.test.ts test/repositories.test.ts test/daemon.test.ts test/last-look.test.ts` from `apps/desktop`, whose case "lists under a repository its ungrouped work items, the pinned one first, and then each group with its own, and leaves a hidden repository out" passed; executed `git grep -n -F "the repository that is not hidden"`, which prints `design.md:155` and the quote in `phase-6.md:9` alone
regression: round-5
```

Why it matters: the unit is the row of scenario 5 in `frame/design.md` *User scenarios & acceptance*, which the fold `5455b50` changed in the same commit that closed round 5's findings 2 and 3. No finding named this change. `frame/plan.md` *Phases* row 6 asks for "the group of scenario 5 as cases". Phase 6 reported that the scenario's "two repositories" cannot be built (`phase-6.md:9`). The fold changed "two" to "three" and left the clause after it as it was, so the defect came from the count changing without the clause that reads it.

With three repositories, one hidden and one with no work item, two are not hidden. *Scope* item 4 lists the one with no work item (`design.md:75`). `sidebarTree` lists it (`view.ts:214`), and the case built for this scenario expects it, `["empty", 0, [], []]` (`view.test.ts:1428`). The scenario still says "the tree holds the repository that is not hidden", in the singular, and then names its ungrouped work items and its group. Read word for word, that says the empty repository is not in the tree. The sealer reads this row against the case. The settle reads it too, as what the sidebar does. The phase found the old count wrong and said so. The fold now leaves the scenario wrong in another way.

The snippet replaces the Given and Then of the row, and leaves its search sentence and its *Verifiable how* cell as they are. `git grep` finds no other statement of the clause. `phase-6.md:9` quotes the old wording as what the phase read, and that dated quote stays.

```markdown
| 5. The sidebar's tree | Given three repositories, one hidden, one with no work item, and one with work items of which one is pinned and one in a group, then the tree holds the two that are not hidden, the one with no work item among them, and under the third its ungrouped work items with the pinned one first, then the group with its own. With a search typed, a repository none of whose work items match is left out | Cases in `apps/desktop/test/view.test.ts` on `sidebarTree` |
```

## Confirmations

```seal
confirms: round-5#1
```
What holds: `takeRemoveLoss` drops the answer to a read of a work item that `removal` no longer names (`apps/desktop/src/renderer/renderer.ts:751`), with the docstring round 5 proposed. The case "keeps in the removal's dialog the refusal of a removal that deleted one work item and stopped at the next" (`apps/desktop/test/work-item-menu.test.ts:725`) does three things in order. It waits until the loss of the work item that is left was read again with `arrived.txt`. It then expects "B item: What the delete would remove has changed. Read it again.". Last, it deletes the second work item with "Force delete". It passed in this round's run of the file at `1bce10f`. The fix pass claims the case was red against the window of `dcebd6d`. That claim was not run again: round 5's probe drove the same window through the same steps and saw "no work item 1" stay in `remove-error`, which is the line the case's assertion fails on. The row at `gaps.md:36` that the close block names still says what the window does: a refused read is shown "where the dialog still names the work item", which is the guard. Executed and read.

```seal
confirms: round-5#2
```
What holds: `frame/design.md:122` reads "refuses in the same three ways", and `:123` reads "a delete is refused and removes nothing, and a repository's removal is refused and removes nothing more". Both are round 5's snippet. `daemon.ts#deleteOne` is not changed in the range, and the case "starts no pane in a work item of a repository whose removal is deleting its work items" passed in this round's run of `test/daemon.test.ts`. `git grep -F 'same two ways'` over the thread's `frame/` prints nothing. Read and executed.

```seal
confirms: round-5#3
```
What holds: the English and the Korean `to:` lines at `frame/design.md:251` and `:257` are equal, string for string, to round 5's snippet, and their `check:` lines are as they were. They agree with `protocol.ts#losesWork`, which counts commits, changed files and untracked files alone, and with *Scope* item 16's two choices. The cases "removes a worktree that holds nothing but ignored files without the force" and "deletes a work item that would lose nothing but an ignored file, with the loss's stamp and no force" passed in this round's run of `test/daemon.test.ts`. `test/worktrees.test.ts` did not run in this round, and `apps/desktop/src/daemon/worktrees.ts` is not changed in the range. Executed and read.

What matched: *Scope* item 22 and scenario 19, walked from the frame to the code.

- `addGroup` stores the trimmed name after the repository's groups, refuses an empty one with "Give the group a name.", and answers `done` before the `inbox` (`daemon.ts:434-446`).
- `setWorkItem` moves a work item into a group of its own repository and out of it at null. It refuses another repository's group and a `groupId` that is neither a number nor null, and then sets nothing.
- The built app's "New group" puts a heading under the ungrouped list. "Move to" puts the line under it, and "Move out of" puts it back. A folded repository hides the headings with the lists.

Executed in `test/repositories.test.ts`, `test/daemon.test.ts` and `test/work-item-menu.test.ts`.

What matched: item 24 for the new items. "Move to <group>" and "Move out of <group>" carry descriptions that are neither empty nor their labels (`view.ts:840-841`). `view.test.ts`'s case of *a description on hover* counts six menus as 10, 10, 10, 7, 12 and 12. The built app's case reads both `title`s. Executed.

What matched: the new failure paths phase 6 introduces are six, and each is answered with an `error` that a case pins. They are an empty name, a name that is no text, a repository the store does not hold, another repository's group, an id no repository holds, and a `groupId` that is no id. Executed in `test/daemon.test.ts`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck of the whole app and the broad gate. This round ran four case files that start no app in one command, and `test/work-item-menu.test.ts`, `test/work-item-form.test.ts`, `test/korean-input.test.ts` and `test/notification-click.test.ts` each by itself. The suite is `unverified` | `apps/desktop` | the orchestrator, at the broad run |
| How a group's heading with its count, the dialog of a new group, and a long group name in the heading and in "Move to" and "Move out of" look when drawn, in the two themes | `apps/desktop/src/renderer/index.html:205-207`, `apps/desktop/src/renderer/sidebar.ts#showSidebar` | the owner, or whoever the orchestrator names, as `gaps.md:42` names |
| The "Move to" and "Move out of" items of a line's menu on the inbox screen and on the history screen in the built app, and the sidebar's groups in the built app while a search is typed or a state is chosen. `read` in `renderer.ts:460` and `view.ts:210` | `apps/desktop/src/renderer/renderer.ts`, `apps/desktop/src/renderer/view.ts` | the owner, in the hand run of issue #24, as `gaps.md:43-44` name |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts test/repositories.test.ts test/daemon.test.ts test/last-look.test.ts`, from `apps/desktop` of the worktree at `1bce10f` | 4 files, 438 passed, exit 0. No start of the app |
| `node scripts/test-in-electron.mjs test/work-item-menu.test.ts`, the same | 25 passed, exit 0. One start through `BuiltApp.start` |
| `node scripts/test-in-electron.mjs test/work-item-form.test.ts`, the same | 4 passed, exit 0. One start |
| `node scripts/test-in-electron.mjs test/korean-input.test.ts`, the same | 32 passed and 1 skipped, exit 0. One start. The typed run was skipped without its variable |
| `node scripts/test-in-electron.mjs test/notification-click.test.ts`, the same | 2 passed, exit 0. One start |
| `git grep -n -e innerHTML -e insertAdjacentHTML -e outerHTML -- apps/desktop/src/renderer`, at `1bce10f` | no line, exit 1 |
| `git grep -n -F "the repository that is not hidden"`, at `1bce10f` | `frame/design.md:155` and `trail/phases/phase-6.md:9` |
| `ps -axo pid=,command=`, filtered for `owlery`, after the last start | no process of the worktree's app or daemon. Pid 95337 alive |
