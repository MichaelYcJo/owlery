# Review round 3: 1795636142-223-a-stage-a-pane-runs-shows-at-work

```seal
target: 5451af08 against origin/release/v0.0.5
```

This round judges the merge `5451af08`. Its parents are this branch at round 2's commit `4c09d7ca` and `origin/release/v0.0.5` at `f05b9c97`, which brings #213 (PR #294), the test fixes (PR #297) and #216 (PR #298) since the old base `c80b900a`. Round 2 left no finding, so this round owes no `confirms:` line. The work item's own records are unchanged by the merge (executed: `git diff --stat 4c09d7ca 5451af08 -- seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work` prints nothing). So the reading of them is carried from rounds 1 and 2, which read them whole, and is not done again. The round ran in a `git clone --no-local` of the branch worktree checked out at `5451af08`.

## Findings

None. The merge keeps both sides whole, and the work item's change stands against the new base as it stood against the old one.

## Confirmations

What matched: both sides stand. Executed: the `-U0` diff of the work item's code and cases against each base was written to a file of changed lines, `git diff -U0 c80b900a 4c09d7ca -- apps` and `git diff -U0 f05b9c97 5451af08 -- apps`, and the two files were compared. Each holds 796 changed lines. They differ in two pairs alone: the protocol import of `apps/desktop/src/daemon/daemon.ts:9` and the one of `apps/desktop/test/view.test.ts:202`. In each, both the removed and the added line carry the release's names (`PANE_NAME_CHARS`, `TAB_COLOURS` and `TabColour`, or `TabColour`), and the added line adds `PaneStage`. So nothing of the release's change is lost or altered under the merge, since its diff from the new base is the work item's change and nothing else. Nothing of the work item's change is lost or altered either, its two import lines aside.

What matched: the conflict hunks (read, `git show --cc 5451af08`). In `daemon.test.ts`, `NO_MARKS` and #213's `SESSION_FIELDS` with `colour` and `name` stand beside a `WORK_ITEM_FIELDS` that holds `paneStage`. The look's filter takes out `name` and `colour` from the sessions and `paneStage` from the work items. The created work item holds `paneStage: null`, and its session holds `...NO_MARKS`. The account-change cases stand as two whole cases, this item's at `apps/desktop/test/daemon.test.ts:8865` and #213's "keeps the name and the colour" right after it, each with its own repository, accounts and requests.

What matched: the drops stand beside #213's and #216's changes (read `apps/desktop/src/daemon/daemon.ts`). `closePane` drops at `daemon.ts:2147`, `endSessions` at `:2395` with its broadcast before the wait, and the pane's `onExit` at `:2715`, before the `replacing` branch. The release's diff of `daemon.ts` (`git diff c80b900a f05b9c97`) adds no new way to end or close a pane. #213's `setPane` sends the lists where a name or a colour changed, and #216's `readLists` answers with the lists, which `workItemOf` composes with `paneStage`. The two places that take a pane off the lists without `closePane` predate this work and need no drop of their own. The setup's earlier pane has exited already, so `onExit` dropped its stage (`daemon.ts:1607`). `dropWorkItems` follows `endSessions` (`daemon.ts:2289-2295`).

What matched: the release's frames change no sentence this design changes or cites. Executed: the `section:` lines of the designs the release added, #213's, #216's and #291-292-295's. Only #213 touches a section this design cites, *What a session survives*. It rewrites the sentence on the pane's record in the run folder, and leaves "A session's process lives as long as the daemon that started it", which *Grounding* cites.

What matched: the cases. Executed in the clone: `test/daemon.test.ts`, `test/heavy-run.test.ts` and `test/chain-command.test.ts` with the filter below passed, 16 cases. They are the work item's cases in the three files, #213's account-change case beside this item's, the field-list case and the creation case. The crafter's logs of `view.test.ts` (603 passed), of 67 `daemon.test.ts` cases and of an empty `tsc` run are read, not run. They name no filter, and they ran in the worktree, not in a clone.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Q1's default, as rounds 1 and 2 left it. | `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/frame/questions.md:15` | a person: the owner, through Q1 |
| What the merge can break beyond the files the work item changes, the built-app batch among them. `skills/verify/SKILL.md` gives a merge to the broad gate. | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate |
| The whole suite and the typecheck at `5451af08` (contract rule 2). The round leaves nothing open, so the orchestrator's broad run comes due, and the sealer's spawn after it. | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/daemon.test.ts test/heavy-run.test.ts test/chain-command.test.ts -t "issue #223\|carries only the fields the protocol names\|creates a work item and opens a pane whose process runs in its worktree\|keeps the name and the colour"`, in `apps/desktop` of the round's clone at `5451af08` | 3 files, 16 passed, 443 skipped, exit 0 |
