# Review round 3: 1795343000-background-window-unseen

```seal
target: 7f59f41, fixes cba0a24..7f59f41
```

This is the verifying round of round 2. Its code bound is the diff `cba0a24..7f59f41`. In `apps/desktop` that diff is `7ef8dfb` alone, which adds one case to `apps/desktop/test/work-item-form.test.ts` and starts that file's app with `inspectMain`. The rest is the work item's records: `f324548` (`trail/phases/phase-2.md`, the plan's phase 2 Status, the grounding row), `26b276b` (`gaps.md:10`), `34ad3b3` (round 2's closes) and the framer's fold `7f59f41` (`frame/design.md` *Scope* item 2, the acceptance rows, the two check-line `to` lines, *Removes*, and `frame/plan.md` *Overlap with the release*). The round worked in a `git clone --no-local` of the branch at `7f59f41`, in this round's scratch directory `1795343000-background-window-unseen/round-3/` under the session's scratchpad. It fetched the worktree's remote-tracking refs into the clone, so `origin/release/v0.0.2` below is `eff2d74`, the base on GitHub.

The records read whole at `7f59f41` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md`, `trail/phases/phase-2.md`, `trail/rounds/round-1.md` and `trail/rounds/round-2.md`. No `pr.<lang>.md` stands, and `Commit and pull request language` is English. The work item has no `seal/parity.json`.

Carried from rounds 1 and 2 and not established again: the call order at `apps/desktop/src/main/background.ts:33-37`, the other paths that show a window under the switch, the probe outputs of the crafter's `phase-1/` scratch directory, and the seen-red run of `pick-folder.test.ts` (round 2, *Probes*). The code they rest on is unchanged since `cba0a24`: the diff touches no file under `apps/desktop/src`. Everything else below was read or run at `7f59f41`.

No unit file was run. The fix diff changes no code a unit file covers, and round 2 ran `pick-folder.test.ts` and `background.test.ts` green over the same `src`. The built-app file `work-item-form.test.ts` was not run either. The owner's test rule allows one run where a close cannot be read otherwise, and round 2 finding 2's close can be read from the fix pass's executed outputs (*Confirmations*). The suite stays `unverified`, with the orchestrator as its answerer.

## Findings

### 1. The phase 2 record says every other line of its census describes the window, and most do not

```seal
severity: should
location: `seal/threads/1795343000-background-window-unseen/trail/phases/phase-2.md:9`
evidence: executed `git grep -n -i -e "folder dialog" -e "opens nothing" -e "four things" -e "lacks four" -e "draws nothing" -e "Browse" 6efb9e9 -- . ':!seal'` in the round's clone; read `seal/threads/1795343000-background-window-unseen/trail/phases/phase-2.md:9`, `apps/desktop/src/main/pick-folder.ts:1-27`, `apps/desktop/src/shared/ipc.ts:1-8`
regression: round-2#1
```

Why it matters: the unit is `trail/phases/phase-2.md`, which `f324548` added as round 2 finding 1's fix. Round 2's snippet left the census as a placeholder for the fix pass's own words. The orchestrator wrote it from the fix pass's hand-back, and the defect comes from the sentence's last clause. `phase-2.md:9` says: "only `ipc.ts:70` was corrected, and the rest describe the window". The search it names, run at `6efb9e9`, the commit phase 2 closed at, prints about sixty lines. Few of them describe the window. `apps/desktop/src/main/links.ts:27` describes the browser stand-in. `docs/product.md:136`, `pnpm-lock.yaml:792` and the `view.ts` lines match "Browse" inside "browser". `pr-check/lib/blocks.py:56` says a fence line "opens nothing". Three lines state the folder dialog: `apps/desktop/src/main/pick-folder.ts:1` and `:19`, and `apps/desktop/src/shared/ipc.ts:3`. Each holds for a background start, so the conclusion stands: no other line of the search needed correcting. But the record misreports an executed search, and the sealer reads the phase record as the account of what the phase ran. Round 1 finding 3 and round 2 finding 3 were the same kind.

The snippet replaces the paragraph at `phase-2.md:9`. No other statement holds this clause: `frame/plan.md`'s phase 2 row names no census.

```markdown
**The sweep of the channel's statements found one more line.** `apps/desktop/src/shared/ipc.ts:70`, the comment of `OwleryApi.pickFolder`, said the call opens the native dialog, and it now says a background start opens none. The census was a sample: `git grep -i` outside `seal/` for "folder dialog", "opens nothing", "four things", "lacks four", "draws nothing" and "Browse" (the fix pass's hand-back, as the orchestrator received it). Only `ipc.ts:70` was corrected. The other lines on the folder dialog, `src/main/pick-folder.ts:1` and `:19` and `src/shared/ipc.ts:3`, hold for a background start. The rest state the window, the browser's and Finder's stand-ins, or other subjects, "Browse" matching inside "browser" among them.
```

```seal
verdict: fixed f9dfe09
answer: `phase-2.md:9` now holds the round's paragraph, naming what the search printed besides `ipc.ts:70`.
```

### 2. The plan gives *Scope* item 2 to phase 2, closed at `6efb9e9`, while the fold puts a case in item 2 that `7ef8dfb` added after it

```seal
severity: should
location: `seal/threads/1795343000-background-window-unseen/frame/plan.md:39`, `seal/threads/1795343000-background-window-unseen/frame/plan.md:41`, `seal/threads/1795343000-background-window-unseen/frame/design.md:35`
evidence: read `seal/threads/1795343000-background-window-unseen/frame/plan.md:36-41`, `seal/threads/1795343000-background-window-unseen/frame/design.md:35`, `seal/threads/1795343000-background-window-unseen/trail/phases/phase-2.md:1-13`; executed `git log --format='%h %cd' -1 7ef8dfb` and `git diff cba0a24..7f59f41 -- seal/threads/1795343000-background-window-unseen/frame/plan.md`, read-only, in the branch worktree
regression: round-2#2
```

Why it matters: the unit is `frame/design.md` *Scope* item 2, which the fold `7f59f41` rewrote as round 2 finding 2's close owed. The plan maps each *Scope* item to the phase that builds it, and says at `plan.md:41` which item no phase builds. Row 2 at `plan.md:39` reads "`frame/design.md` *Scope* items 2, 4 and 5, the fix pass of round 1", verified by `pick-folder.test.ts` alone, with the Status `6efb9e9`. The fold added to item 2 the built-app case *answers Browse with no folder in the background, and opens no dialog*, seen red with `chooseFolderDialog(background, …)` taken out of `main.ts:173`. That case is `7ef8dfb`'s, the fix pass of round 2, committed after `6efb9e9`, and `trail/phases/phase-2.md` rightly does not name it. The fold edited `plan.md` *Overlap with the release* and left *Phases* as it stood. So the plan says phase 2 delivered all of item 2 at a commit where part of it did not exist, and it names no one for the rest. The sealer reads the plan's rows against *Scope* and the phase records. It finds part of item 2 delivered by no phase the plan names.

The snippet replaces the sentence at `plan.md:41`. Row 2 at `:39` stays true of what phase 2 built, and `frame/design.md:35` stays true of the work, so neither changes.

```markdown
*Scope* item 3 is this frame's own `## Rule changes`, which the settle writes, so no phase builds it. The built-app case of *Scope* item 2, `work-item-form.test.ts` *answers Browse with no folder in the background, and opens no dialog*, is no phase's either: the fix pass of round 2 built it at `7ef8dfb`, after phase 2 closed at `6efb9e9`, and its close stands in `trail/rounds/round-2.md` finding 2.
```

```seal
verdict: fixed f9dfe09
answer: `plan.md:41` now holds the round's sentence: the built-app case is no phase's, built by round 2's fix pass at `7ef8dfb`.
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: `trail/phases/phase-2.md` stands, so `frame/plan.md`'s phase 2 row, whose Status holds a commit, has its record, and the sealer's check of the phases finds both (read). The Status is `6efb9e9`, the last commit of the fix pass of round 1: `4fa599c`, `304b2ac` and `6efb9e9` are that pass's commits, and `539e253` between them is the orchestrator's record of the Status (executed, `git log --oneline 27daa42..cba0a24`). The record's claims match round 1's closes and round 2's executed red run of `pick-folder.test.ts:31` (read). Round 2's census placeholder is gone, and the record says the census came from the hand-back. Finding 1 of this round stands on the last clause of that census sentence, in the record this fix added, and the close holds beside it.

```seal
confirms: round-2#2
```
What holds: the case at `apps/desktop/test/work-item-form.test.ts:188-195` holds the handler's use of `chooseFolderDialog`. It replaces `electron.dialog.showOpenDialog` in the main process through `evaluateMain`. `test/built-app.ts:231-233` evaluates that expression with `electron` bound to `require("electron")` in the main process. The handler at `apps/desktop/src/main/main.ts:170-174` reads `dialog.showOpenDialog` at each call, since `main.ts:1` imports `dialog` from `electron`, which the bundle keeps external. `BuiltApp.start` at `built-app.ts:177-184` takes `inspectMain` and sets `OWLERY_BACKGROUND=1` unless `keepBackground` is passed, and `work-item-form.test.ts:62` passes `{ inspectMain: true }`. So the case asks under the switch, and with the guard gone the handler opens the stand-in, which answers `/r/project` and draws nothing (all read). The fix pass's executed outputs bear the close out. `fix-2/mutate.log` fails at `work-item-form.test.ts:193`, "expected '/r/project' to be null", the line that names the guard, with 1 failed and 7 skipped. `fix-2/form-run.log` reads 8 of 8 passed, and the file holds 8 cases. Both logs were written at 00:15:50 and 00:16:16, after `7ef8dfb` was committed at 00:15:31, and no file under `apps/desktop` changed after that commit (executed, `ls -lT`, `git log -1 --format=%cd 7ef8dfb` and `git diff --stat 7ef8dfb HEAD -- apps`). The precondition probe `fix-2/test_tmp_dialog_writable.js` reads the property's descriptor and assigns it, as the close says (read). `gaps.md:10` names the run, the 8 cases and the case that holds the handler. Its "No case clicks the button itself" holds: no file under `apps/desktop/test` names `work-item-browse` (executed). The fold reaches every statement round 2 finding 2 owed: `frame/design.md:35`, the acceptance rows at `:53` and `:54`, the check-line `to` lines at `:91` and `:96`, and *Removes* at `:110`, whose "one target" it corrected unasked (read). Finding 2 of this round stands on *Scope* item 2 as the fold rewrote it, and the close holds beside it.

```seal
confirms: round-2#3
```
What holds: the grounding row at `frame/design.md:27` reads word for word round 2's snippet. Round 2's executed line was run again. `git grep -n -F` on each `from`, at `e6937ca` and at `7f59f41`, outside `seal/threads`, prints `docs/architecture.md:365`, `:366` and `:384`, the same three lines of `docs/architecture.ko.md`, `docs/design.md:487` and `docs/design.ko.md:487`, and nothing else (executed, *Probes*).

What matched: `## Rule changes` still parses after the fold. The plugin's `rule_changes.parse` read 8 operations with no error and no unread line, and `apply_op` placed each in its document and section at `7f59f41`. Every target of the two rewritten check lines exists in the tree, `apps/desktop/test/work-item-form.test.ts` among them (executed, read-only, *Probes*). The chain check printed no notice at `frame/design.md` of a pin or a copy (executed, *Probes*).

What matched: the plan's new #97 row. `git merge-tree --write-tree 34ad3b3 da9d77a` reports one conflicted file, `apps/desktop/test/work-item-form.test.ts`, with one hunk. That hunk holds the header comment's last items, this branch's on the Browse button and #97's on a repository's setup, with the `node:fs` import line under them, which #97 widens to `renameSync, rmSync, writeFileSync`. The `inspectMain` start at line 70 and both new cases merged clean, this branch's case last at line 243 (executed). `HEAD` against `da9d77a` gives the same file but for the conflict marker's label (executed, `diff`).

What matched: the rest of the overlap still holds at `7f59f41`. `feat/119-no-question-holds-an-agentic-run` stands at `b924a4f`, and against `origin/release/v0.0.2` it changes `apps/desktop/test/built-app.ts` alone among this branch's files. Its `BuiltApp.start` keeps `inspectMain` beside the `writeRun` it adds, so the new start at `work-item-form.test.ts:62` still type-reads under it (read, its diff). `git merge-tree` of `HEAD` with it reports no conflict (executed). `feat/131-the-settle-reads-no-decisions` at `f9dc0c8` changes no file this branch changes (executed). `origin/release/v0.0.2` has moved to `eff2d74`, and `HEAD` merges with it without a conflict (executed). Each `from` of *Rule changes* still stands at that base and at the tip of #97, #119 and #131, and no design at any of them names a section this design names (executed).

What matched: the suite's label is honest. `gaps.md:7` names the broad gate's full run for the orchestrator. `gaps.md:10` names every built-app file but `work-item-form.test.ts`, which the fix pass ran once, for the same answerer. `fix-2/typecheck.log` shows `apps/desktop`'s `tsc --noEmit` with no error, taken just before `7ef8dfb` was committed (read). The `caffeinate` process named in `fix-2/caffeinate.pid`, pid 6241, is no longer running (executed, `ps -p`).

The new case covers the handler's wiring, and no other case in its group does. `pick-folder.test.ts` *chooseFolderDialog* holds the function without the app, and no other case of `work-item-form.test.ts` asks for a folder. The test files declare no `TARGET`, so no duplicate pair applies (executed, `grep -n TARGET`).

`gaps.md:7` still lists `work-item-form` among the files "that this phase did not run", a phrase from phase 1, while `gaps.md:10` says the fix pass of round 2 ran it. Both rows leave the file to the broad gate, and the broad gate runs every file, so nobody acts differently on it. The round opens no finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The typecheck, the full suite, and the files that start the built app at `7f59f41`, `work-item-form.test.ts` among them at the broad gate | `seal/threads/1795343000-background-window-unseen/gaps.md:7`, `seal/threads/1795343000-background-window-unseen/gaps.md:10` | the orchestrator, at the broad gate |
| A window at opacity 0 keeps drawing on GitHub's macOS runner and on another macOS than 26.6 | `seal/threads/1795343000-background-window-unseen/gaps.md:8` | the orchestrator, by the pull request's `check` run |
| A person's start draws and behaves as before, and its Browse button opens the system's dialog as a sheet | `seal/threads/1795343000-background-window-unseen/gaps.md:9`, `seal/threads/1795343000-background-window-unseen/gaps.md:11` | the owner |
| The system notifications a page under the switch raises, routed by round 1 as a follow-up. `seal/` still holds no `follow-up.md`, and no record names its home | `apps/desktop/src/renderer/renderer.ts:1192` | the orchestrator |
| The frame's mark has no spelling for a frame drawn after a phase was built (carried from round 2) | plugin `skills/code-review/scripts/chain_check.py`, `MARK_RE` | the orchestrator, for the plugin |

## Probes

| Command | Result |
|---|---|
| `python3 -I test_tmp_rule_changes.py <clone>`, which calls `rule_changes.parse(text, "docs")` and `apply_op` for each operation, checks each check-line target exists, and runs `git grep -n -F` on each `from` at `e6937ca` and at `HEAD` outside `seal/threads` | exit 0; 8 operations, no error, no unread line, each placed; no check target missing; at both commits the six prose operations print their own lines and the two check-line operations print `docs/architecture.md:366` and `docs/architecture.ko.md:366` |
| `git grep -n -i -e "folder dialog" -e "opens nothing" -e "four things" -e "lacks four" -e "draws nothing" -e "Browse" 6efb9e9 -- . ':!seal'` in the clone | about sixty lines; the folder dialog at `pick-folder.ts:1`, `:19`, `ipc.ts:3` and `:70`; the rest on the window, the browser and Finder stand-ins, or other subjects |
| `git merge-tree --write-tree 34ad3b3 da9d77a`, and the same with `HEAD` | exit 1; one conflicted file, `apps/desktop/test/work-item-form.test.ts`, one hunk at the header comment and the `node:fs` import |
| `git merge-tree --write-tree --name-only HEAD feat/119-no-question-holds-an-agentic-run`, and the same with `origin/release/v0.0.2` | exit 0 for each; a tree, no conflict |
| `git grep -c -F -f froms.txt <ref> -- docs` for the base and the tips of #97, #119 and #131 | 3 lines in each architecture edition and 1 in each design edition at every ref |
| `chain_check.py --baseline origin/release/v0.0.2 --root <the branch worktree> --worktree`, before the record | exit 0; round 2 finding 2 and the target behind HEAD owe this round; no gate record and no guarantee yet; no notice at `frame/design.md` of a pin or a copy |

