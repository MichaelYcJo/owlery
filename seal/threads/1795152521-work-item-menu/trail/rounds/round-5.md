# Review round 5: 1795152521-work-item-menu

```seal
target: 347e84f against release/v0.0.1
```

The round reads the range `d708c29..347e84f`, which holds three things. The first is the fix pass of round 4: `7dcd7fe`, the orchestrator's `8637154`, and the close blocks at `3a50dd4`. This round answers it under `## Confirmations`. The second is phase 5 of `frame/plan.md` *Phases*, the delete and the Trash: the code of `0a3296b` to `8a20286` and its record `7048c58` (`trail/phases/phase-5.md`, `gaps.md` and the plan's status cell). The third is the orchestrator's fold `347e84f`. Phase 6 is not built, and its absence is no finding. `seal/parity.json` does not exist, so no comparison with an original was owed.

Read whole at `347e84f`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `trail/phases/phase-5.md` and `trail/rounds/round-4.md`. Rounds 1 to 3 were read for their findings and coordinates. No `changelog.md`, `pr.md` or `pr.en.md` stands yet: the fragment is phase 6's.

Carried from round 4, and not searched again: where a folder's repository is read. Searched again: the list of test files that start the built app, with `grep -n 'BuiltApp.start\|buildApp()'` over the four files the spawn named, and the search that shows the renderer writes no HTML from data, because phase 5 draws commit subjects and file paths from git. Each verdict below was reached again at `347e84f`. `git diff --stat 8a20286..347e84f -- apps` prints nothing, so the code is phase 5's last commit.

**The five points the orchestrator asked this round to look at.**

- *`isolation: isolate` on `#stage` (`apps/desktop/src/renderer/index.html:301`).* The phase claims it made the menu's items over a terminal take the press. The read finds it changes only how the stage's layers interleave with what stands outside the stage. Inside `#stage`, the layers `@xterm/xterm` stacks keep their order among themselves: the helpers at 5, the decorations at 6 to 8, the accessibility layer at 10, the scrollbar at 11 and the composition view at 1. `overflow: hidden` on `#stage` already clipped them to the stage. Two kinds of element outside the stage overlap it. One is `.menu`, which is `position: fixed` with `z-index: 1` and is appended to `body` (`menu.ts:96`). The other is a `<dialog>` opened with `showModal`, which stands in the top layer, where no stacking context reaches. `git grep` finds no hover card and no drop overlay in `apps/desktop/src/renderer`: a control's description is its `title`, which the system draws. One layer moves: the helper text area at `z-index: -5` was painted under the stage's background and is now painted above it. It has `opacity: 0` and stands at `left: -9999em`, so nothing a person sees changes. `test/korean-input.test.ts`, which types through the IME into a pane on the stage, and `test/notification-click.test.ts` passed at `347e84f` in this round. Executed and read.
- *`Daemon#deleting` beside `Daemon#archiving`.* The read finds no order of messages that ends one work item's sessions twice. It finds none that leaves a work item in `deleting`, and none that starts a session between the two reads of a loss. Each check and each `add` runs in one turn of the event loop. An archive tests `deleting` before it adds to `archiving` (`daemon.ts:507`). A delete adds to `deleting`, and `deleteOne` then tests `archiving` before its first `await` (`daemon.ts:568`, `:744`). A removal that deletes tests `archiving`, then the sessions, then adds every work item to `deleting`, with no `await` between them (`daemon.ts:399-403`). Both holds are let go in a `finally` (`:413`, `:572`). `start`, `ask` and `continueLatest` all pass through `worktreeFor`, which refuses a work item in `deleting` (`:667`). `ClientMessage` (`protocol.ts:225-263`) has no other request that starts a process in a worktree. A delete and a removal both run on `Daemon#changing`, so one never runs beside the other. The cases "refuses a delete of a work item while an archive of it is ending its sessions" and "refuses a delete where a pane's process has not exited within the wait" hold the two orders, and they passed in this round's run. Executed and read.
- *A removal that deletes.* Before its first delete it refuses on the stamps, on an archive under way and on a session it does not name, in that order (`daemon.ts:396-402`). Each refusal after the first delete opens with the title of the work item whose delete was refused (`:408`). An `inbox` follows the `error` where a delete ran before the refusal (`:422-427`). The daemon does what it says. What the window then shows is finding 1. Executed in `test/daemon.test.ts` and in this round's probe.
- *`main/openers.ts#trashFolder`.* The three cases of `test/openers.test.ts` hold what their titles claim of the function. It hands the stand-in the folder alone, returns the failure's sentence, and refuses a relative path, a path that is gone and a folder with no `.git` at its top. Phase 5's five mutants of the function were red. The cases cannot reach two other parts: the handler of `main.ts:88`, which hands it `existsSync` and `shell.trashItem`, and the window's sequence in `renderer.ts`. In that sequence, `remove` keeps the folder with the request, the case `done` asks for the move, and the case `error` forgets it. `gaps.md:34` names the owner for the move itself. What remains for the owner's hand run is the row of `## Not judged` below. Read and executed.
- *The four test files that start the app.* `work-item-form`, `korean-input` and `notification-click` each started the app once, through `BuiltApp.start`, under `OWLERY_BACKGROUND=1`, and passed. `memory.test.ts` starts no app unless `OWLERY_MEASURE_MEMORY=1` is set, and its 29 cases passed. The typed run of `korean-input.test.ts` passes `keepBackground` and is skipped unless its own variable is set, and it was skipped. Executed.

**What the fold `347e84f` says, read against `347e84f`.**

- Item 16's new sentences hold: the three refusals before the first delete, each delete ending its own work item's sessions, and the title before the refusal (`daemon.ts:396-410`).
- Item 17's new sentence holds (`daemon.ts:667`).
- Item 19's folder holds: `readLoss` names a folder only where `linkedAt` finds a linked worktree in git's list (`worktrees.ts`, `linkedAt`).
- Item 20's first refusal and its blocked refusal hold (`daemon.ts:744`, `:750`).
- Item 21's last sentence holds (`daemon.ts:507`).
- The Trash sentence of *Data & interfaces* holds (`openers.ts`, `trashFolder`).
- The plan's exception for a probe file holds as a rule.

Two sentences of items 20 and 21 that stand beside the fold do not hold. They are finding 2.

Claimed by phase 5, and found. The phase claims eight case files passed at `8a20286`. In this round, five of them passed at `347e84f`: 488 cases, with `daemon`, `worktrees`, `openers`, `repositories` and `view`. The phase claims each new case was seen red. That claim and the mutation table were read and not run again: `apps` has not changed since. The phase claims the delete dialog draws a commit's subject and a file's path from git without HTML. `git grep -e innerHTML -e insertAdjacentHTML -e outerHTML -- apps/desktop/src/renderer` printed no line, and `lossParts` sets `textContent`. The phase's departure on the folder a loss names is folded in item 19. `gaps.md` loses no row of `## Not verified`. Three rows are rewritten in place, and six are added. Under `## Not done`, four paragraphs are rewritten in place, and six are added. Each added paragraph says what was within reach.

In one case the delete dialog says it removes the worktree and leaves the folder. That is a folder that stands where git lists no worktree, as after `git worktree prune`. `deleteSays` then reads "A delete removes the work item's worktree and its local branch", and the folder stays on disk. `gaps.md:73` discloses this, and item 19 as folded names no such folder, so it is no finding here.

## Findings

### 1. After a removal that deletes stops partway, its dialog shows "no work item <id>" and drops the refusal

```seal
severity: should
location: `apps/desktop/src/renderer/renderer.ts:732-743`, `apps/desktop/src/renderer/renderer.ts:850-856`, `apps/desktop/test/work-item-menu.test.ts`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_partial_removal.test.ts` from `apps/desktop` (see `## Probes`); read `apps/desktop/src/renderer/renderer.ts:667-700`, `apps/desktop/src/renderer/renderer.ts:732-743`, `apps/desktop/src/renderer/renderer.ts:850-856`, `apps/desktop/src/renderer/renderer.ts:1172-1179`, `apps/desktop/src/daemon/daemon.ts:422-427`, `apps/desktop/src/daemon/daemon.ts:548-552`
```

Why it matters: *Scope* item 16 says the refusal sentence starts with the title of the work item whose delete was refused. That sentence is the one thing that tells the person why the removal stopped and what to do next. The window replaces it with a sentence about a work item the person never asked about.

Here is the order of events. The daemon deleted the first work item and took it out of the store. It then sends the `error` and, after it, the `inbox` (`daemon.ts:422-427`). The window handles the `error` first. `answered` writes the refusal into `remove-error`, and `readAgain` calls `showRemove` (`renderer.ts:850-856`). `showRemove` builds the dialog's work items from the lists the window still holds, and those still list the deleted work item. So it sends a `readLoss` for that work item too (`renderer.ts:690-697`). The daemon answers that read with `error`, "no work item <id>" (`daemon.ts:551`). `takeRemoveLoss` takes the answer for any id it asked about while the dialog is open and the choice is checked. It writes the answer over the refusal (`renderer.ts:738`).

The probe ran a repository with two clean work items, "A item" and "B item". It checked the choice to delete them and wrote a file into B's worktree after the dialog had named both losses. Then it pressed Remove. Over 4 seconds, `remove-error` read "" and then "no work item 1". It never held "B item: What the delete would remove has changed. Read it again." long enough for a 50 ms poll to see it. The dialog then named "B item" alone. The same thing happens when a later work item's pane of Claude Code outlives the 3 seconds, which `gaps.md:37` expects.

The fix drops the answer to a read of a work item the dialog no longer names. Under rule 14 it also owes a case of `apps/desktop/test/work-item-menu.test.ts` in the same commit. The case uses a repository with two work items that lose nothing. It checks "Also delete the work items' worktrees and local branches" and waits for both losses. It writes an untracked file into the second worktree, presses Remove, and expects `remove-error` to say "<second title>: What the delete would remove has changed. Read it again." and to keep saying it after the losses are read again. That case fails at `347e84f` on "no work item <id>". The row of `gaps.md:36` that names `readAgain` stays true after the fix.

```ts
/** Takes the daemon's answer to a read the removal's dialog asked for: a loss, which the dialog then names, or a refusal, which it shows. A read of a work item the dialog no longer names, such as one a removal deleted before it was refused, is dropped: its answer is "no work item", which would take the place of the removal's own refusal. It answers whether the read was the dialog's. */
function takeRemoveLoss(requestId: number, answered: { loss: WorkItemLoss } | { error: string }): boolean {
  const id = removeLossAsked.get(requestId);
  if (id === undefined) return false;
  removeLossAsked.delete(requestId);
  if (!removeDialog.open || !removeDelete.checked || !removal?.workItems.some((workItem) => workItem.id === id)) return true;
  if ("error" in answered) {
    REMOVE.error.textContent = answered.error;
    return true;
  }
  removeLosses.set(id, answered.loss);
  showRemove();
  return true;
}
```

The guard holds because of the order the daemon keeps. The `inbox` that drops the deleted work item is sent before the `readLoss` that `readAgain` sends even arrives. `showRemove` has therefore drawn `removal` again without that work item before its answer comes back.

```seal
verdict: fixed e2aaa36
location: `seal/threads/1795152521-work-item-menu/gaps.md`
answer: The finding holds, and the fix is the proposed guard and docstring, applied after it was read against `apps/desktop/src/renderer/renderer.ts#takeLists`, which draws the removal's dialog again at each `inbox`, and against `apps/desktop/src/daemon/daemon.ts:422-427`, which sends the `error` before the `inbox`. The case is the proposed one with two steps more. It reads `remove-error` only after the loss of the work item that is left was read again and names the new file, so it cannot pass on the refusal's first moment on screen. It then checks "Force delete" and presses Remove, which deletes the second work item and removes the repository, so the file's last case still finds an empty sidebar. Against the window of `dcebd6d` the case failed on "expected 'no work item 5' to be 'B item: What the delete would remove has changed. Read it again.'", in one start of the built app, and with the guard the file's 24 cases pass. That red run is the tree a mutant without the guard would be, so no `seal mutate` run, which is two more starts, was made for it. The case also reaches two things `gaps.md:36` named as read alone, the losses read again after a removal's refusal and "Force delete" in the removal's dialog, so the row now names the three that are left, which is why this block names that path.
```

### 2. Two sentences of items 20 and 21 say a removal that deletes removes nothing at a slow pane, and give the second read two refusals

```seal
severity: should
location: `seal/threads/1795152521-work-item-menu/frame/design.md:122-123`
evidence: read `seal/threads/1795152521-work-item-menu/frame/design.md:100`, `seal/threads/1795152521-work-item-menu/frame/design.md:122-123`, `apps/desktop/src/daemon/daemon.ts:404-413`, `apps/desktop/src/daemon/daemon.ts:742-762`; executed the run of five case files in `## Probes`, whose case "starts no pane in a work item of a repository whose removal is deleting its work items" passed
```

Why it matters: the frame states the work as built, and the sealer and the settle read these two items for what a delete and a removal do.

Item 21 says that where a pane has not exited within the wait, "a delete or a repository's removal is refused and removes nothing". At `347e84f` a removal that deletes stops at the slow pane of a later work item. The work items it deleted before then stay deleted, from disk and from the store (`daemon.ts:404-413`), as item 16 says (`design.md:100`). The two items now say opposite things of the same removal.

Item 20 has the first read refuse in three ways since the fold: the stamp, `blocked`, and the force. It then says the second read refuses "in the same two ways". `deleteOne` runs one `read` both times, with all three refusals (`daemon.ts:747-752`). `daemon.ts:733` and `protocol.ts:250` say "the same ways".

The fold `347e84f` rewrote both items and left these two clauses. The snippet below covers every statement of the two facts that `git grep -e 'refused and removes nothing' -e 'same two ways'` finds.

```markdown
In item 20, for "reads the loss once more and refuses in the same two ways;":
reads the loss once more and refuses in the same three ways;

In item 21, for "Where one has not exited within the wait `frame/questions.md` Q2 leaves to the work, a delete or a repository's removal is refused and removes nothing.":
Where one has not exited within the wait `frame/questions.md` Q2 leaves to the work, a delete is refused and removes nothing, and a repository's removal is refused and removes nothing more: the work items a removal that deletes deleted before it stay deleted (item 16).
```

```seal
verdict: fixed 5455b50
answer: The finding holds. The fix pass left it to the orchestrator, because the crafter writes no frame sentence but the plan's Status cell. The orchestrator folded the record's two sentences word for word at `5455b50`, after reading them against `apps/desktop/src/daemon/daemon.ts#deleteOne`, whose one `read` refuses on the stamp, on `blocked` and on the force and runs twice, and against the `removeRepository` case, which keeps the work items deleted before a refusal deleted. `git grep -e 'same two ways' -e 'refused and removes nothing.'` over the thread's `frame/` finds neither at `5455b50`.
```

### 3. The rule that `## Rule changes` adds to `docs/product.md` requires the force for any file no commit holds, and makes the removal's choice a Trash

```seal
severity: should
location: `seal/threads/1795152521-work-item-menu/frame/design.md:251`, `seal/threads/1795152521-work-item-menu/frame/design.md:257`
evidence: read `seal/threads/1795152521-work-item-menu/frame/design.md:100-101`, `seal/threads/1795152521-work-item-menu/frame/design.md:121`, `seal/threads/1795152521-work-item-menu/frame/design.md:251`, `seal/threads/1795152521-work-item-menu/frame/design.md:257`, `apps/desktop/src/shared/protocol.ts:126-129`, `apps/desktop/src/daemon/worktrees.ts`; executed the case of `test/worktrees.test.ts` "removes a worktree that holds nothing but ignored files without the force" and the case of `test/daemon.test.ts` "deletes a work item that would lose nothing but an ignored file, with the loss's stamp and no force" in this round's run of five files
```

Why it matters: the settle writes this rule into `docs/product.md` and `docs/product.ko.md` as policy, under a `check:` line that names `test/daemon.test.ts` and `test/worktrees.test.ts`. Phase 5 built the delete, so the rule now has code to be read against, and the code does what item 19 decides.

The rule's third sentence says that where "a file no commit holds would be lost", the delete runs "only after the person has read each by name and chosen to force the delete". An ignored file such as `.env` is a file no commit holds. Item 19 decides that ignored files are named and "do not make a delete a forced one" (`design.md:121`). `losesWork` counts commits, changed files and untracked files alone (`protocol.ts:126-129`). A plain delete removes a worktree that holds `.env`, and the two cases above pass on exactly that.

The rule's fourth sentence says that a removal removes nothing on disk unless the person chooses it there, "and the repository's folder then goes to the Trash". Item 16 has two choices (`design.md:100-101`). With the first alone, the worktrees and the branches are deleted and the repository's folder stays, as the case of `test/work-item-menu.test.ts` that removes the third repository holds.

The Korean row at `:257` says the same two things. The snippet replaces both `to:` lines. It leaves their `check:` lines and the other rows of `## Rule changes` as they are.

```markdown
  to: - **Owlery deletes nothing of a person's work without that person's word.** An archive is the way out of the list, and it removes nothing. A delete removes a work item's worktree and its local branch after the person confirms. Where a commit no other branch holds, a change no commit holds or an untracked file would be lost, the delete runs only after the person has read each by name and chosen to force it. The files git ignores, such as `.env`, are named and go with the worktree without the force. Removing a repository from Owlery removes nothing on disk unless the person chooses it there: one choice deletes its work items' worktrees and local branches as a delete does, and another moves the repository's folder to the Trash. Nothing removes a branch on a remote.

  to: - **Owlery는 사람의 말 없이 그 사람의 결과물을 지우지 않습니다.** 목록에서 내보내는 길은 보관이고, 보관은 아무것도 지우지 않습니다. 삭제는 사람이 확인한 뒤에 작업의 worktree와 로컬 브랜치를 지웁니다. 다른 브랜치에 없는 커밋, 커밋하지 않은 변경, 추적하지 않는 파일을 잃게 될 때는, 사람이 그것들을 이름으로 읽고 강제 삭제를 고른 뒤에만 지웁니다. `.env`처럼 git이 무시하는 파일은 이름으로 보여 주고, 강제 삭제 없이 worktree와 함께 지웁니다. 저장소를 Owlery에서 뺄 때는 사람이 그 자리에서 고르지 않는 한 디스크에서 아무것도 지우지 않습니다. 한 선택은 작업의 worktree와 로컬 브랜치를 삭제처럼 지우고, 다른 선택은 저장소 폴더를 휴지통으로 옮깁니다. 원격의 브랜치는 어떤 경우에도 지우지 않습니다.
```

```seal
verdict: fixed 5455b50
answer: The finding holds. The orchestrator folded the record's English and Korean `to:` lines word for word at `5455b50`, and left their `check:` lines as they were. The lines agree with `apps/desktop/src/shared/protocol.ts#losesWork`, which counts commits, changed files and untracked files alone, and with *Scope* item 16's two choices.
```

## Confirmations

```seal
confirms: round-4#1
```
What holds: `7dcd7fe` changes one line of `gaps.md`, and the row at `gaps.md:28` at `347e84f` is the row round 4 proposed, word for word. `checkoutOf` and `mainOf` in `apps/desktop/src/daemon/worktrees.ts` are unchanged in the range, so the row still describes the read. `git grep -F "again name its git directory"` finds the old words only in `trail/rounds/round-4.md`, which quotes them. Read and executed.

```seal
confirms: round-4#2
```
What holds: `8637154` changes line 113 of `frame/plan.md` alone. The cell at `347e84f` is the one round 4 proposed. It agrees with `frame/plan.md:29` and with `worktrees.ts#repositoryOfSync`, which `git diff d708c29..347e84f` leaves unchanged. Read.

What matched: *Scope* item 19 and scenario 15, walked from the frame to `worktrees.ts#readLoss`.

- The branch is named where it exists, and the folder where git lists a linked worktree at it. The main checkout is never one.
- The commits come from one `git log` of the branch's tip and the worktree's `HEAD`, run with `--not --exclude=<branch> --branches --remotes --tags`. `--exclude` clears at the next `--branches`, so the remotes and the tags are read whole.
- The changed files and the untracked files come from `git status --porcelain=v1 -z --untracked-files=all --no-renames`, and the ignored ones from `git ls-files --others --ignored --exclude-standard --directory -z`.
- `blocked` names the branch checked out elsewhere, or a lock. `unreachable` is true where `git worktree list` fails.
- Each list stops at 500 entries, beside its count. The stamp hashes the whole output of the three reads.

Executed in `test/worktrees.test.ts`.

What matched: *Scope* item 20 and scenarios 16 and 17, in `daemon.ts#deleteOne`.

- The order is item 20's: refuse while an archive runs, read the loss, end the sessions, read again, `git worktree remove` with `--force` only where the delete is forced, `git branch -D -- <branch>`, then off the lists and out of the store.
- An `unreachable` loss removes nothing on disk.
- A refusal leaves the work item listed.
- `removeWorktree` removes only a folder `linkedAt` finds. `removeBranch` names no ref of a remote.

Executed in `test/daemon.test.ts`, whose case for scenario 16 compares the remote's refs, the clone's remote branches and tags, every other branch, the second work item's files and the main checkout before and after.

What matched: scenario 18 and the removal's dialog in `test/work-item-menu.test.ts`, read and not run again. The file last ran at `8a20286` (`trail/phases/phase-5.md`), and `apps` has not changed since.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck of the whole app and the broad gate. This round ran five case files that start no app, the four files the spawn named each by itself, and one probe, and labels the suite `unverified` | `apps/desktop` | the orchestrator, at the broad run |
| `test/work-item-menu.test.ts` at `347e84f`. It last ran at `8a20286`, and `apps` has not changed since | `apps/desktop/test/work-item-menu.test.ts` | the orchestrator, at the broad run |
| Six things about the Trash that no run reached. Does `shell.trashItem` move a repository's folder into the macOS Trash whole, so that a person can put it back? Does the window ask for the move only at the `done` of a removal whose dialog had the Trash's choice checked and enabled? Does it skip the move after a refusal, a partial removal that deletes among them? Does a failure show its sentence in the status line? What does the system do with a repository whose folder is reached through a link? What does it do with a folder the Trash refuses? `read` in `main.ts:88` and in `renderer.ts`: `remove`, and the cases `done` and `error` of `onMessage` | `apps/desktop/src/main/main.ts`, `apps/desktop/src/renderer/renderer.ts` | the owner, in the hand run of issue #24, on a repository made for it, as `gaps.md:34` names |
| How the delete dialog and the removal's dialog with a loss under each work item look when drawn, in the two themes, and how a list of several hundred files scrolls | `apps/desktop/src/renderer/index.html` | the owner, as `gaps.md:35` names |
| A delete or a removal that deletes, where a pane of Claude Code outlives the 3 seconds. Finding 1 is what the removal's dialog shows then | `apps/desktop/src/daemon/daemon.ts#deleteOne` | the owner, as `gaps.md:37` names |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/work-item-form.test.ts`, from `apps/desktop` of the worktree at `347e84f` | 4 passed, exit 0. One start through `BuiltApp.start` |
| `node scripts/test-in-electron.mjs test/korean-input.test.ts`, the same | 32 passed and 1 skipped, exit 0. One start. The typed run was skipped |
| `node scripts/test-in-electron.mjs test/notification-click.test.ts`, the same | 2 passed, exit 0. One start |
| `node scripts/test-in-electron.mjs test/memory.test.ts`, the same | 29 passed, exit 0. No start: the measurement runs only under `OWLERY_MEASURE_MEMORY=1` |
| `node scripts/test-in-electron.mjs test/daemon.test.ts test/worktrees.test.ts test/openers.test.ts test/repositories.test.ts test/view.test.ts`, the same | 5 files, 488 passed, exit 0 |
| `node scripts/test-in-electron.mjs test/test_tmp_partial_removal.test.ts`, the same, written through the `Write` tool, run once and removed after. It started the app once through `BuiltApp.start` on a `temporaryClone`. It created "A item" and "B item" with shell panes, opened Remove from the repository's "…" button, checked "Also delete the work items' worktrees and local branches", and waited for both losses and Remove on. It then wrote `arrived.txt` into the worktree of "B item", pressed Remove, and polled `remove-error` every 50 ms for 4 seconds | 1 passed, exit 0. `remove-error` read `""` and then `"no work item 1"`. The dialog stayed open and named "B item" alone. The status line read "Daemon running, no agent" |
| `git grep -n -e innerHTML -e insertAdjacentHTML -e outerHTML -- apps/desktop/src/renderer`, at `347e84f` | no line, exit 1 |
| `git grep -n -i -e drop -e hover-card -e z-index -e tooltip` over `apps/desktop/src/renderer`, at `347e84f` | no overlay and no hover card. The one `z-index` of the page is `.menu`'s, at 1 |
| `ps -axo pid=,command=`, filtered for `owlery-93`, after the last start | no process of the worktree's app or daemon. Pid 95337 alive |
