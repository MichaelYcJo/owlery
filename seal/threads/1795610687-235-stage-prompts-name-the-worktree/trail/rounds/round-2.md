# Review round 2: 1795610687-235-stage-prompts-name-the-worktree

```seal
target: 335177fd, fixes 8fb5de99..335177fd
```

This round verifies the fixes made since round 1's target. The range holds round 1's record (`f2a771e4`), the framer's fold (`36c52a2c`), the fix (`12c19090`), the changelog and closing memo (`4165f82f`), and the close blocks (`335177fd`). The code read stays inside that diff. The work item's records were read whole at `335177fd`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` and `trail/rounds/round-1.md`. Some facts are carried from round 1 and were not established again: where the five builders and their callers stand, that `chain.ts` was already loaded by `chain-command.ts`, which imports `hooks.ts`, and the build's entries in `apps/desktop/build.mjs`. Each one was re-opened only where the fix diff touches it.

## Findings

None. Every close of round 1 holds, and the fix diff adds no unit that a defect stands in.

## Confirmations

```seal
confirms: round-1#1
```
What holds: `chain.ts:673` writes the fix pass's command as `` `git -C ${shellQuote(given.worktree)}` ``, and `shellQuote` (`hooks.ts:104-107`) makes the path one single-quoted word, with each `'` written as `'\''`. The pin at `chain.test.ts:422` reads `git -C '${WORKTREE}'`. The same case pins `/repos/my repo's wt` as `'/repos/my repo'\''s wt'`, and that is a new fact no other case of the group holds. The new import does not widen the module graph of any build. `chain.ts` is imported only by modules under `src/daemon/`. Each bundle that holds those modules, `dist/daemon.js` from `src/daemon/main.ts` and `dist/chain.js` from `src/daemon/chain-main.ts` through `chain-command.ts:35`, already imported `hooks.ts`. No file under `src/main`, `src/preload`, `src/renderer` or `src/shared` imports `chain.ts`. `node-pty` stays external in both builds (`build.mjs:28` and `:39`). `hooks.ts` imports `./daemon` as a type alone, so no cycle is loaded. Run again, `git grep -n -F 'git -C ${' HEAD -- apps/desktop` printed `chain.ts:673` alone, as the close says. The docstring at `chain.ts:657-661` and *Scope* item 3 (`design.md:35`) say the same as the code. The close says the case was seen red against the unquoted `chain.ts`. Reading confirms it: the unquoted builder gives `git -C /repos/owlery-wt-2`, which the pinned `toEqual` refuses. Executed: the searches and the run under *Probes*. Read: the imports and `build.mjs`.

```seal
confirms: round-1#2
```
What holds: the case is gone from `chain.test.ts`. The five builders and `promptText` are each still called by other cases in the file, so no import is left unused. *Scope* item 6 (`design.md:38`) now rests on the pinned cases. The acceptance row (`design.md:56`), `plan.md` row G (`plan.md:29`), the *Verified by* cell (`plan.md:35`) and the failure scenario (`plan.md:17`) say the same, and none of them names the removed case as standing. Run again, `git grep -n -e 'this folder' -e "the session's folder" HEAD -- apps/desktop/src/daemon/chain.ts apps/desktop/test/chain.test.ts` printed nothing. `git grep -n -F 'names the tree the stage reads' HEAD -- seal/threads/1795610687-235-stage-prompts-name-the-worktree` printed `phase-1.md:21` and `:30` and round 1's record, as the close says.

The close leaves three lines of `trail/phases/phase-1.md` as the build wrote them: `:13`, `:21` and `:30`. I judge them no finding. The phase record is the trail of the phase, and each of the three lines states what was so at the phase's commits. At `05af4fb1`, the search printed `chain.test.ts:430` and `:438`. The case was shown red by mutation 4, which ran after `e99be396`. None of the three states the tree at `335177fd`. `plan.md` row G and round 1's record name the case's removal for a reader who meets them. One sentence of `:13` is advice that the fold now settles the other way: "The orchestrator may fold the plan's cell to exclude that case". That too is the phase's account at its own time. Executed: the two searches. Read: `phase-1.md:13-30` and `plan.md:17-35`.

```seal
confirms: round-1#3
```
What holds: step 9 of `agents/crafter.md` now reads "and you read every other path the prompt gives from that top" (`crafter.md:64-65`). The case *reads true in both launches* pins "every other path" for the proofer, sealer, crafter and orchestrator definitions (`role-bundle.test.ts:152`). Run again, `git grep -n -F 'every other path' HEAD -- apps/desktop/role-bundle apps/desktop/test` printed `crafter.md:64`, `orchestrator.md:36`, `proofer.md:31`, `sealer.md:35` and the pin, as the close says. *Scope* items 8 and 9 (`design.md:40-41`) and the changelog's third item now say what the four definitions hold. Reading confirms the close's red run: `crafter.md` at `8fb5de99` holds no "every other path", so the pin fails on that file. Executed: the search and the run under *Probes*.

What matched: the changes the fold and `4165f82f` made to `changelog.md` (`:6-7`), `design.md` *Scope* items 3, 6 and 9 and its acceptance row, and `plan.md`'s failure scenario, row G, *Verified by* cell and *Judgments of the run* row. Each one is true of the code at `335177fd`. `pr.md` was not changed. Its five quotes are still the opening sentences of *Scope* items 1, 3 and 8 and the defaults of Q1 and Q2, word for word, because the fold added sentences after those openings and kept the openings unchanged. Read.

What matched: the closing memo's changed row (`gaps.md:9`) is ended by the word `closed`, and the memo keeps the row instead of removing it. The full suite's row (`gaps.md:10`) still labels the suite `unverified` with the orchestrator answering at the broad gate, and that label is honest. Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The fix pass's run at `12c19090` that closes the `gaps.md` row: thirteen unit files, `daemon.test.ts` and `heavy-run.test.ts` among them, 706 cases passed. This round did not run it again, because the two files are heavy and fail under load on this machine (#245) | `seal/threads/1795610687-235-stage-prompts-name-the-worktree/gaps.md:9` | the orchestrator, at the broad gate |
| The full suite, the typecheck of every package, and the broad gate's other checks, the typecheck of the changed imports in `chain.ts` among them | `seal/threads/1795610687-235-stage-prompts-name-the-worktree/gaps.md:10` | the orchestrator, at the broad gate |
| Q1 and Q2, which only a real pane run answers | `seal/threads/1795610687-235-stage-prompts-name-the-worktree/frame/questions.md:13-14` | the owner's walk (#184) |

## Probes

| Command | Result |
|---|---|
| `cd apps/desktop && node scripts/test-in-electron.mjs test/role-bundle.test.ts test/chain.test.ts -t "a stage's prompt\|a judgment's prompt\|the seal's prompt\|reads true in both launches"` | exit 0: 2 files, 10 cases passed and 177 skipped. The fix pass's case with the quoted path and the bundle pin with "every other path" are among the cases that passed |
