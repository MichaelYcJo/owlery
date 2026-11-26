# Review round 1: 1795710118-291-292-295-three-cases-hold-under-load

```seal
target: ae3e57ee against origin/release/v0.0.5
```

The round reviewed the branch against `c80b900a`: the build commit `8981dc93`, which changes `apps/desktop/test/daemon.test.ts` and `apps/desktop/test/chain.test.ts` alone, and the records of `bb77f407`, `97b3438d` and `ae3e57ee`. No earlier round stands, so no coordinate or verdict was carried. No `seal/parity.json` is declared. The axes walked were inputs (the case's waits and their conditions), exclusions and boundaries (the 60 s limit of the describe block, the 5000 ms `until` bound), concurrency and atomicity (what the daemon can still do between each new wait and the read it guards), error paths (how each new wait fails where the product changes), the record axes, and one axis of this change: whether a case asserts less than it did. Security, authorization, query scope, ordering and the figure axis have nothing to read here, since the diff changes no product code and holds no figure.

The question the routing names, a case that passes because it now asserts less, has the answer no for each of the three cases. Each keeps every assertion it had, and the removal case of #292 asserts more. The grounds are under `## Confirmations`.

The frame was committed in `ae3e57ee`, after the build of `8981dc93`. Its routing was rewritten in the same commit from "no frame is drawn" to a frame the orchestrator writes. Each *Scope* item was read against its issue's *Done when* and matches it, so the order of the commits leaves no requirement the issues state outside the frame (read: `frame/design.md:7-9`, `gh issue view 291`, `292`, `295`).

## Findings

### 1. The inbox case of #291 reads `readingCommits` through a cast, so a rename of the field leaves the case with no wait and no error

```seal
severity: should
location: `apps/desktop/test/daemon.test.ts:3901-3903`, `seal/threads/1795710118-291-292-295-three-cases-hold-under-load/frame/plan.md:14`, `seal/threads/1795710118-291-292-295-three-cases-hold-under-load/trail/phases/phase-1.md:7`
evidence: executed `tsc --noEmit --strict --noUncheckedIndexedAccess --target ES2023` over the scratch probe `test_tmp_private_access.ts`; read `apps/desktop/test/daemon.test.ts:3901-3903`, `apps/desktop/test/daemon.test.ts:5730`, `apps/desktop/src/daemon/daemon.ts:489`, `apps/desktop/src/daemon/daemon.ts:596`, `apps/desktop/tsconfig.json`
```

Why it matters: the plan's judgment row (`frame/plan.md:14`) holds that the case reads two private fields "through a cast, as the same file reads `headless`". Reading private fields is sound here, since the daemon exposes no promise for the read under way and a product change is out of scope. The form of the read is the defect. `d as unknown as { clients: ...; readingCommits: Promise<void> | undefined }` tells the typecheck nothing about the `Daemon` class. Should `readingCommits` (`daemon.ts:596`) be renamed, `own.readingCommits` reads `undefined`, `await undefined` returns at once, and the case is back to counting with no wait at all, which is shorter than the 100 ms it had. It then fails under load as #291 did, with nothing pointing at the stale name. The precedent the row cites does not have this failure mode. At `daemon.test.ts:5730` the cast reads `headless.get(...)`, and a renamed `headless` throws a `TypeError` at once; so does a renamed `clients` at `:3902`. Only `readingCommits` is read as a value that may be `undefined`, so only its rename is silent.

The repository typechecks its tests (`tsconfig.json` includes `test`, `strict: true`), and TypeScript type-checks a bracket read of a private member by name. The probe showed it: `d["clients"].size` and `d["readingCommits"]` compiled against a class declaring both, `d["readingCommitsRenamed"]` failed with `TS2551: Property 'readingCommitsRenamed' does not exist on type 'Held'`, and assigning `d["readingCommits"]` to a `string` failed with `TS2322`. With the bracket form a rename fails `pnpm run typecheck` in the broad gate, and the case needs no cast.

The listing of every cast through `unknown` in the tests (`git grep -n -e "as unknown as" -- apps/desktop/test`) printed `daemon.test.ts:3901` and `:5730` as the two reads of a private field; the rest cast test values to a type. `:5730` fails loudly on a rename, so the fix does not owe it, though the fix pass may convert it for one style.

The statements of the cast in the records, listed with `git grep -n -F "cast" -- seal/threads/1795710118-291-292-295-three-cases-hold-under-load/`, are `frame/plan.md:14` and `trail/phases/phase-1.md:7`. That is a sample under contract rule 12, since a statement in other words escapes the search. The phase record holds two sentences of it: "The daemon exposes no promise and sends no message when a read ends, so the case reads its private fields through a cast." and "The cast is a read of a private field, not a change to the product." The snippet below covers the case and the plan row. The phase record is the phase's account of `8981dc93`, and the fix pass owes it a sentence that says the read is now by name in brackets.

```ts
    first.socket.close();
    // A read that began before the daemon saw the close runs its git in series and may count on after it, under load for longer than any fixed wait (issue #291). No message tells of its end, so the case reads the daemon's own fields by name, which the typecheck reads: once no client is connected no read begins, and the one under way is waited for.
    await first.until(() => (d["clients"].size === 0 ? true : undefined));
    await d["readingCommits"];
    const watched = watchedGit(base);
```

```markdown
| 2026-11-27 | The inbox case reads two private fields of the daemon (`clients`, `readingCommits`) by name in brackets, which the typecheck reads, so a rename of either fails the typecheck. | No public option exposes the read under way, and a product change is out of this work's scope. A cast through `unknown`, as the same file reads `headless`, would hide a rename of `readingCommits`: the field would read as `undefined` and the case would wait for nothing. | `frame/design.md` *Out of scope*; round 1, finding 1 |
```

### 2. The phase record says the helper `failing` moved unchanged, and its doc comment was rewritten

```seal
severity: should
location: `seal/threads/1795710118-291-292-295-three-cases-hold-under-load/trail/phases/phase-1.md:11`
evidence: executed `git diff c80b900a..HEAD -- apps/desktop/test/chain.test.ts`, and a sorted `diff` of the old case's statements against the new cases' statements in the round's scratch directory; read `apps/desktop/test/chain.test.ts:3294-3315`
```

Why it matters: `phase-1.md:11` says "The helper `failing` moved to the head of the describe block, unchanged." Its code did move unchanged. Its doc comment did not: the old one read "A sealed chain whose stage failed as `make` arranges, with the chain, the head and the calls gh had before the stage.", and the new one at `chain.test.ts:3294-3300` lists what the helper asserts and says why a case runs only a few such chains. The rewrite is an improvement, since the helper returns the standing fixture and never returned the chain, the head or the calls. The sentence still tells the sealer, who audits the phase's account against the tree, that the diff of the helper is a move alone, and the diff says otherwise. The sorted comparison of statements leaves comments out, so it cannot show this, as the phase record itself says. A `git grep -n -F "moved to the head of the describe block, unchanged"` over the work item's directory printed `phase-1.md:11` alone, a sample under contract rule 12.

```markdown
The helper `failing` moved to the head of the describe block with its code unchanged. Its doc comment was rewritten to list what the helper asserts, where the old one said it gave the chain, the head and the calls gh had, which it never returned.
```

## Confirmations

What matched: #291 asserts what it asserted before. Between the base and the target, the inbox case changes only its wait: `pause(100)` became a wait for `clients` to empty and an `await` of `readingCommits`, and its assertions at `daemon.test.ts:3905-3911` are the base's lines (executed, `git diff c80b900a..HEAD`). The wait is exact. `readCommitsNow` has the two callers the phase names, `greet` at `daemon.ts:967` and the timer at `daemon.ts:4418` (executed, `grep -n readCommitsNow`). The timer returns while `clients` is empty (`daemon.ts:4416`), and the `finally` of a read only re-arms that timer (`daemon.ts:4494-4498`). So once `clients` is empty, the read awaited is the last before the count. The creation of a branchless work item runs no git read (`daemon.ts:1025-1029`), so no read on `this.changing` escapes the wait. The guard the case pins is the timer's `clients.size === 0` return. The crafter's `seal mutate` output shows the case red at `expect(watched.calls("rev-list")).toBe(0)` with 4 received (read: the crafter's `phase-1/mutate-291.txt`).

What matched: #292 asserts more than before and nothing less. The wait adds `branch === "owlery/runs-a-pane"` to `newCommits === 1` (`daemon.test.ts:1748`), the inbox carries `branch` (`src/shared/protocol.ts:99`), and `branchUp` sends that inbox only after `makeBranch` and the store write (`daemon.ts:4594-4610`). The claim that later reads of a branched work item only read holds for what `readCommits` calls (`daemon.ts:4515-4527`): `readRecord` reads files, `readBranch` of a branched item runs `newCommits`, `branchHead`, `baseDistance`, `branchCommits`, `branchChanges` and `sealAt`, `readRecords` runs `git --no-optional-locks status` (`records-place.ts:401`), and `readOwedAt` reads a file at `HEAD`. Every `git status` call in the product was listed with `grep -rn -e '"status"'` over `apps/desktop/src` (executed). The ones without `--no-optional-locks`, `readLoss` (`worktrees.ts:982`) and `uncommittedPaths` (`worktrees.ts:1285`), are on a delete's path and a chain's path, and neither runs in this case. `onDisk` compares every file under the repository, `.git` among them (`daemon.test.ts:262-270`), so this is the read that matters, and it holds.

What matched: #295 keeps every statement of the old case. A sort of the old case's lines against the six new cases' lines and the moved helper, indentation stripped and the `it` lines, comments and closing lines left out, differs in one line, the old helper's doc comment (executed, `diff` of `old.sorted` and `new.sorted` in the round's scratch directory, 65 lines against 64). The fourteen `failing` calls, ten of them with a `gh` answer arranged, stand in the six cases. Each call makes its own fixture through `standing`, so no assertion depended on the order the split changed, the rerun of `create` among them. Each new case's name claims only what its statements assert. The split adds no coverage beyond the old case's and duplicates no other case of the describe block.

What matched: the six cases pass, the longest in 11.6 s on this Mac and the six in 51 s in all; the two daemon cases pass in 1.4 s and 1.0 s (executed, the two narrow runs under `## Probes`). The crafter's load runs were read and not run again: 12 of 12 for each new daemon case, 0 of 6 and 5 of 6 for the old ones, 24 of 24 for the chain cases, and the chain runs' tests taking 104.2 s to 107.7 s (read: `phase-1/load/*.txt`, `phase-1/load.sh`). The old case took 53.1 s alone at the base (read: `phase-1/base-chain.txt`).

What matched: the records against the code and each other. `frame/design.md` *Scope* items 1 to 3, `pr.md`'s quotes of them and of the plan row, `routing.md`'s fourteen chains, `changelog.md`'s 22 seconds and `gaps.md` each hold at the target. The closing memo's method for the cases of the same kind was run again: a `socket.close()` followed by a fixed `pause` in `daemon.test.ts` stands at `:6976` and `:7943`, the two cases it names (executed, `grep -n -A2 "socket.close()"`). The memo labels the broad gate and the runner's `check` job as unverified with the orchestrator as their answerer, which is honest: neither was run. No probe file was left in `apps/desktop/test` (executed, `ls`).

What matched: no other work item's frame changes what these records cite. The frames of `1795610869-217-a-new-work-item-picks-its-branch` and `1795653550-150-the-persons-word-is-committed-in-time-and-retried` describe `scheduleCommitRead` and `branchUp` as this work reads them (executed, `grep -n` over `seal/threads/*/frame/design.md`).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at the work item's last commit, `daemon.test.ts`, `chain.test.ts` and the typecheck whole among it. The round ran the eight changed cases alone. | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate |
| The `check` job on GitHub's runner, where #291 and #295 failed. No run in this round or the phase was on the runner. | the pull request's `check` job | the orchestrator, from the pull request |
| Whether another open branch of release 0.0.5 edits these three cases, which a merge would have to reconcile. | `apps/desktop/test/daemon.test.ts`, `apps/desktop/test/chain.test.ts` | the orchestrator, at each merge into the release |

## Probes

| Command | Result |
|---|---|
| `ELECTRON_OVERRIDE_DIST_PATH=.../electron/dist node scripts/test-in-electron.mjs test/daemon.test.ts -t '<the two daemon cases>'` | exit 1 and no output, the runner's failure with that path; nothing ran |
| `ELECTRON_OVERRIDE_DIST_PATH=.../electron/dist/Electron.app/Contents/MacOS node scripts/test-in-electron.mjs test/daemon.test.ts -t 'reads no count while no client is connected\|removes a repository whose work item has a running pane only where'` | exit 0: 2 passed, 406 skipped; the removal case 955 ms, the inbox case 1360 ms |
| `ELECTRON_OVERRIDE_DIST_PATH=.../electron/dist/Electron.app/Contents/MacOS node scripts/test-in-electron.mjs test/chain.test.ts -t 'stops the chain where (the stage fails, with\|gh fails at the list\|the push fails\|gh lists what\|an answer of gh\|gh never ends)'` | exit 0: 6 passed, 169 skipped; 2.6 s, 8.0 s, 9.1 s, 9.9 s, 10.0 s and 11.6 s |
| `apps/desktop/node_modules/.bin/tsc --noEmit --strict --noUncheckedIndexedAccess --target ES2023 test_tmp_private_access.ts`, in the round's scratch directory | exit 2: the bracket reads of the two private fields compiled; a renamed field failed with `TS2551` and a wrong type with `TS2322` |
| `diff old.sorted new.sorted`, the sorted statements of the old case and of the six new cases with the helper | exit 1 on one line, the old helper's doc comment |
