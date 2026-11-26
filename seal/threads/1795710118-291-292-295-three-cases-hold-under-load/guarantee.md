# Guarantee: 1795710118-291-292-295-three-cases-hold-under-load

The audit read the tree at `8423ff85` against `7de5c592`, the commit `origin/release/v0.0.5` resolves to (`release/v0.0.5@{upstream}` answered first). `trail/gate.md` names `2cb7a448`, an ancestor of HEAD. `git log --no-merges --name-only 2cb7a448..HEAD ^7de5c592` lists one commit after it, `8423ff85`, which touches `trail/gate.md` alone (executed). `seal pr-body <item> --body <body.md> --check` exited 0 (executed). The diff against the base changes `apps/desktop/test/daemon.test.ts` and `apps/desktop/test/chain.test.ts` and the work item's records. It changes no product code: `git diff --stat 7de5c592 HEAD -- apps/` lists the two test files alone (executed).

Every claim below was re-run in a clone of the branch at `8423ff85`, under the scratch directory `at-base/`. The dependencies were linked from the worktree. Each mutation was made in the clone and restored with `git checkout` before the next run. The tree under audit was not changed. Each run was one narrow case of one file, as `node scripts/test-in-electron.mjs <file> --reporter=verbose -t '<case>'` from `apps/desktop`. The outputs stand in the scratch directory `sealer-out/`.

## Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The two daemon cases pass at HEAD. | `trail/rounds/round-1.md` *Probes* | the runner, `daemon.test.ts`, `-t 'reads no count while no client is connected\|removes a repository whose work item has a running pane only where'` | holds: exit 0, 2 passed, 977 ms and 1365 ms |
| #291: the inbox case fails where the timer's `clients.size === 0` guard is removed, at `rev-list`. | `trail/phases/phase-1.md` table row "#291 inbox" | `if (this.clients.size === 0) return;` in `scheduleCommitRead` to `if (false) return;`, then the inbox case | holds: exit 1, `expected 5 to be +0` at `daemon.test.ts:3989`, which is `expect(watched.calls("rev-list")).toBe(0)` |
| #291: with the read slowed by 300 ms, the old case fails and the new one passes. | `trail/phases/phase-1.md` "The old cases fail as the issues say once the daemon is slowed" | `await new Promise((r) => setTimeout(r, 300));` at the start of `readCommits`; the inbox case at HEAD, then again with `daemon.test.ts` restored from `7de5c592` | holds: new case exit 0 (2045 ms); old case exit 1, `expected 4 to be +0` at the `rev-list` line |
| #291: the case reads `readingCommits` by name, so a rename fails the typecheck. | `trail/rounds/round-1.md` finding 1, `verdict: fixed f5034186` | `tsc -p` over a scratch tsconfig that extends `apps/desktop/tsconfig.json` and includes `test/daemon.test.ts` alone; then with `d["readingCommits"]` renamed to `d["readingCommitsRenamed"]` | holds: exit 0 at HEAD; exit 2 renamed, `TS2551: Property 'readingCommitsRenamed' does not exist on type 'Daemon'` |
| #292: with `branchUp`'s turn slowed by 300 ms, the old case fails on the branch and the new one passes. | `trail/phases/phase-1.md` "The old cases fail as the issues say once the daemon is slowed" | `await new Promise((r) => setTimeout(r, 300));` at the start of `branchUp`'s `up`; the removal case at HEAD, then with `daemon.test.ts` restored from `7de5c592` | holds: new case exit 0 (2413 ms); old case exit 1, `- detached` / `+ branch refs/heads/owlery/runs-a-pane`, the failure #292 quotes |
| #292: the removal case fails where the removal touches the worktree. | `trail/phases/phase-1.md` table row "#292 removal", the `touched.txt` mutation | after `this.dropWorkItems(ids);`, write `touched.txt` into each work item's worktree; then the removal case | holds: exit 1 at `daemon.test.ts:1772`, `expect(onDisk(...)).toEqual(before)`, the `touched.txt` entry received |
| #295: the six split cases keep every statement of the old case. | `trail/phases/phase-1.md` "#295: the case is split into six cases" | a scratch script, `cmp.py`, that takes the old case at `7de5c592` and the helper and six cases at HEAD, strips indentation, drops comments, `it` lines and closing lines, and compares the two multisets | holds: no statement only in the old and none only in the new; 62 statements each, 23 `expect(` each, 13 `failing(` call sites each, one of them in the loop over two answers, so 14 chains |
| #295: the six cases pass and none runs near the 60 s limit. | `changelog.md`; `trail/phases/phase-1.md` *Under load* | the runner, `chain.test.ts`, `-t 'stops the chain where (the stage fails, with\|gh fails at the list\|the push fails\|gh lists what\|an answer of gh\|gh never ends)'` | holds: exit 0, 6 passed, 2.6 s to 11.9 s on an unloaded Mac, 52.5 s in all. The loaded times (22 s the longest) were read and not run again |
| #295: the "gh never ends" case fails where the stage does not end a hanging gh. | `trail/phases/phase-1.md` table row "#295 never ends" | `if (ended.stopped) return` in `github.ts` to `if (false) return`; then that case | holds: exit 1 at `chain.test.ts:3587`, the `says` match of `gh pr list did not end within` |
| #295: the listed case fails where two open pull requests are taken. | `trail/phases/phase-1.md` table row "#295 listed" | `if (listed.length > 1) throw` to `> 2`; then that case | holds: exit 1, the wait for `stopped` timed out on a rested chain with pull request #1, at `chain.test.ts:3569` |
| The fixed 100 ms wait of the inbox case is gone. | `changelog.md` "in place of a fixed 100 ms" | `git diff 7de5c592...HEAD -- apps/desktop/test/daemon.test.ts` | holds: `await pause(100);` is removed from that case, and the wait for `clients` and `readingCommits` stands in its place |

`frame/design.md` has no `## Removes` section. The one removal the changelog names is the fixed 100 ms, in the last row above.

The phase record's load runs (12 of 12, 0 of 6, 5 of 6, 24 of 24) were read and not run again (read: `trail/phases/phase-1.md` *Under load*). The `check` job on GitHub's runner, where #291 and #295 failed, has not run on this branch: `unverified`, and the orchestrator answers it from the pull request's `check` job, as `gaps.md` names.

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | The three cases of #291, #292 and #295 wait for what the daemon does, or are split, and no product code changes (*Scope* items 1 to 3, *Out of scope*). | The issues' *Done when*: #291 a wait for the read under way, #292 a wait for the read under way, #295 the shapes split into cases. The diff: two test files, no product file. | none |
| the build | `8981dc93` and the fix `f5034186` change the three cases and nothing else. Each case asserts what it did, and #292's asserts more (`trail/phases/phase-1.md`). | The diff. The statement compare above. The six mutation and slow-read runs above. `routing.md`'s "three test cases in two files" and fourteen chains. | none |
| the last round | Round 2 confirms both round 1 findings, `fixed f5034186`, and has no finding. Round 1 found no case that asserts less. | The diff, where `d["clients"]` and `d["readingCommits"]` are read in brackets with no cast. The phase record's sentence on the helper `failing`. The typecheck run above. | none |
| the changelog | Nothing Owlery does changed. Each case waits for what the daemon does by itself, or runs fewer chains, and asserts what it asserted before. The longest split case took 22 s on a loaded Mac. | The diff, which has no product file. The statement compare. The phase record's load table. | none |
| the orchestrator's part of the pull request body | `Closes #291`, `#292`, `#295`, the three *Scope* items quoted, and the plan row on the `test:` prefix. | `frame/design.md` *Scope* items 1 to 3 and `frame/plan.md` *Judgments of the run*, word for word. `seal pr-body --check` exit 0. `config.json` names English for both language keys, so no `pr.<lang>.md` is owed. | none |

`routing.md` reads `crafter` for *Implementation*. The plan's one phase holds `8981dc93` in its Status cell, and `trail/phases/phase-1.md` stands. The orchestrator chose the rows (*Why this way*), and its grounds ("three test cases in two files", "the fix is a test's wait or split, with no product change") describe the diff. The last record, round 2, holds no `fixed` finding, so no fix stands that only the sealer reads. No `seal/parity.json` is declared, so no comparison with an original is owed.

```seal
target: 8423ff85 against 7de5c592
Verdict: sealed
```
