# Review round 3: 1795651592-218-one-press-adds-and-names-an-account

```seal
target: d94a3f19, fixes cad1cc32..d94a3f19
```

This is the verifying round after round 2's fix pass. The code reviewed is the fix diff `cad1cc32..d94a3f19`: `5c827208`, which answers round 2's prose note on `realOf` and no finding, `5ac087c2`, `0df67d23` and `00537f7c`, with the close blocks of `d94a3f19`. `a99fb38e` is round 2's own record. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `d94a3f19`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. `trail/phases/phase-3.md` and `phase-4.md` were read whole, and phases 1 and 2 were not opened, since the fix diff touches none of their units. No `seal/parity.json` stands.

Carried from round 2 and not established again: where the window's sign-in state lives (`apps/desktop/src/renderer/sign-in-pane.ts#showSignIn`), the row's "Sign in" as the button `renderer.ts:995` builds, whose press calls `askedSignIn` in the same turn, and the store's two removals, `dropMade` and `remove`, under the folder `handedPath` refuses. Every verdict below is this round's.

The fix pass closed both findings, and its change to `realOf` holds. One sentence it wrote is wrong: the closing memo credits round 1's fix pass with the mutation run that round 2's fix pass made.

## Findings

### 1. The closing memo says the fix pass of round 1 ran the mutation of the waiting half, which the fix pass of round 2 ran

```seal
severity: should
location: `seal/threads/1795651592-218-one-press-adds-and-names-an-account/gaps.md:10`
evidence: executed `git grep -n -F "the fix pass of round 1 ran" d94a3f19 -- seal/threads/1795651592-218-one-press-adds-and-names-an-account`, which printed `gaps.md:10` alone; read `seal/threads/1795651592-218-one-press-adds-and-names-an-account/gaps.md:10`, `seal/threads/1795651592-218-one-press-adds-and-names-an-account/trail/rounds/round-1.md:77`, `seal/threads/1795651592-218-one-press-adds-and-names-an-account/trail/rounds/round-2.md:61`, `seal/threads/1795651592-218-one-press-adds-and-names-an-account/trail/rounds/round-2.md:74`
regression: round-2#2
```

Why it matters: the unit is the second cell of the closed row of `gaps.md:10`, which `5ac087c2` rewrote. The frame leaves the closing memo's wording to the build, and round 2's paste put the new read in the list that the cell's subject, "the fix pass of round 1 ran one `seal mutate` over each", governs. The fix pass applied the paste and added "which the fix pass of round 2 added after round 2's finding 2" to the read. The defect came from round 2's paste, and the fix pass carried it.

The cell now says that round 1's fix pass ran a mutation that went red "at that case's read in the turn of its press". That read did not exist in round 1. Round 1's close names its mutants: `busy` without `alive`, the rows' loop setting `false`, and the call of `showSignIn` taken out (`round-1.md:77`). None removes `asked`, as round 2 found (`round-2.md:61`). The mutant `const busy = alive;` that went red at the new read is round 2's fix pass's (`round-2.md:74`). The sealer audits each party's account against the records. Where it looks for this run in round 1's close, it finds none. The coverage the cell claims is real, and this round ran the mutant again and saw it red (`## Probes`). Only the party that ran it is wrong.

The search printed `gaps.md:10` alone. It is a sample under contract rule 19, since a statement of the same run in other words escapes it. Round 2's record states the paste at `round-2.md:70`. It is a past record and stays. Replace the second cell of `gaps.md:10` with:

```markdown
the fix pass of round 1 ran one `seal mutate` over each against the built-app cases of `theme-controls.test.ts`, and each went red: the disabled state while a sign-in runs at scenario K's case and at the case "starts no second sign-in from the dialog…", the running head at scenario K's case, and the ended head and `takeAddEnded` at the case "says in the dialog's refusal line why an add left no account…", which round 1's finding 2 asked for. Scenario K's case alone held neither of the last two (`trail/rounds/round-1.md`, finding 2). The fix pass of round 2 ran one more over the disabled state, `const busy = alive;`, which takes out the half that holds while a sign-in's request waits on the daemon. It went red at the read in the turn of the press, which the same pass added to the case "starts no second sign-in from the dialog…" (`trail/rounds/round-2.md`, finding 2)
```

```seal
verdict: fixed 10273e6a
answer: The orchestrator replaced the second cell of the closed row at `gaps.md:10` with the record's paste-ready cell, word for word. It now names round 2's fix pass as the one that ran `const busy = alive;` and saw it red at the read in the turn of the press.
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: `0df67d23` replaces the six `accounts-adding` shots, and no other file of `screenshots/` (`executed`, `git show --stat 0df67d23`, and `git log --oneline cad1cc32..d94a3f19 -- seal/threads/1795651592-218-one-press-adds-and-names-an-account/screenshots`, which printed `0df67d23` alone). This round opened `night-watch-light-accounts-adding.png`, `desk-dark-accounts-adding.png` and `register-dark-accounts-adding.png` (`read`). The fix pass opened `night-watch-dark` and `register-light`, and the orchestrator opened `desk-light`, so each of the six has been opened by someone. In each of the three this round opened, Work's "Sign in" is dimmed and "Make the default", "Check sign-in", "Rename" and "Remove…" stand at full ink. The head "Signing in to a new account" stands over the terminal, "Close the sign-in" is enabled, and "Add an account" is dimmed. That is what `showSignIn` draws while `alive` holds (`sign-in-pane.ts:77-80`). It is also what the Disabled cell of the row "An account's name" states, as *Data & interfaces* quotes it (`frame/design.md:110`). The fix pass's account that the other twelve files differ only in temporary folder names is `read` from its close, and this round did not compare them. Their views draw no running sign-in, so `busy` is false in them, as round 2 found.

```seal
confirms: round-2#2
```
What holds: the case "starts no second sign-in from the dialog…" now reads `#accounts-add` and the row's "Sign in" inside the same `evaluate` that presses the row's "Sign in" (`apps/desktop/test/theme-controls.test.ts:395-396`, `read`). The press runs `askedSignIn` synchronously (`renderer.ts:995`, `sign-in-pane.ts:29-31`), so only `asked` can hold the two buttons disabled at that read. With `sign-in-pane.ts:78` patched to `const busy = alive;`, the case went red at that read (`executed`, `## Probes`), and it passed at the target. This is round 2's own probe, which passed green against `cad1cc32`, run again. The case's name gains the waiting half in round 2's words. Finding 1 above is the cell of `gaps.md:10` that this fix rewrote.

What matched: `5c827208`'s change to `realOf`, which round 2 named in prose and opened no finding for. `realOf` now answers `realpathSync.native` (`apps/desktop/src/daemon/accounts.ts:71-78`), as `apps/desktop/src/daemon/role-grants.ts:72` and `:112` already do. Its only callers are the two checks of `handedPath` (`accounts.ts:217-223`), and each side of both comparisons goes through `realOf` (`executed`, `git grep -n -e realOf -e realpathSync -- apps/desktop/src`). So the holder check and the made-folder check compare the disk's spelling on both sides. Where nothing stands at the path, both forms throw and `realOf` answers the path as given, as before. The other `realpathSync` calls the search printed are outside this work's units, in `daemon.ts#realPathOf`, `worktrees.ts` and the two adapters' `projects` links. They decide no removal of the store and were not judged. The rewritten docstring of `handedPath` (`accounts.ts:197-206`) says what the code does. The two new rows of the refusals case (`apps/desktop/test/accounts.test.ts:160-171`) are new rows of an existing case, not a new case, and run only where the volume ignores letter case. With `realOf` set back to `realpathSync`, the case went red at its first new row (`executed`, `## Probes`). That confirms the fix pass's seen-red account. A grep of the work item's present records and `docs/architecture.md` for "spell", "capitals" and "letter case" printed nothing (`executed`). No frame statement states how a path is spelt, so nothing is owed to the fold.

What matched: the rewrite of `gaps.md:12` in place in `00537f7c` counts round 2's fix pass's screenshot run beside phase 3's and phase 4's runs, and cites `trail/rounds/round-2.md`, whose close states the run (`read`). No row of `## Not verified` left the memo in the fix diff: each changed line is rewritten in place (`read`, `git diff cad1cc32 d94a3f19 -- seal/threads/1795651592-218-one-press-adds-and-names-an-account/gaps.md`). `changelog.md`, `pr.md` and the frame files are unchanged since round 2 read them, and each sentence of them was read again whole against the target. None is contradicted by the fix diff.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the repository typecheck and the broad gate. This round ran `accounts.test.ts` and `theme-controls.test.ts` alone, so the suite is `unverified` | `seal/config.json` `Broad gate` | the orchestrator |
| Whether a real `claude auth status` prints the login's email as `email` (`frame/questions.md` Q1) | `apps/desktop/src/daemon/adapters/claude-accounts.ts` | the owner, by the real login `gaps.md` holds |
| The other twelve shots of `screenshots/`, which the fix pass says differ from its run only in temporary folder names. This round ran no screenshot command | `seal/threads/1795651592-218-one-press-adds-and-names-an-account/screenshots` | the sealer, against the fix pass's account in `trail/rounds/round-2.md` |
| The two new rows of the refusals case on a volume that tells letter case apart, where they do not run. This round ran on a volume that ignores letter case | `apps/desktop/test/accounts.test.ts:160-171` | the orchestrator's broad run, on whichever volume it uses |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/accounts.test.ts test/theme-controls.test.ts`, run once in `apps/desktop` of this round's clone at `d94a3f19`, through the machine's lock | 2 files, 66 cases passed, exit 0 |
| The same two files with `-t "refuses with a sentence a path that is not absolute\|starts no second sign-in"`, run once with `accounts.ts:74` set back to `realpathSync(folder)` and `sign-in-pane.ts:78` patched to `const busy = alive;` | exit 1. The refusals case went red at `accounts.test.ts:168`, the first of the new rows, where no refusal was thrown. The case "starts no second sign-in…" failed at `theme-controls.test.ts:394`, waiting for the account that scenario K's case adds, because the filter left that case out. That failure says nothing of the guard |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/theme-controls.test.ts -t "scenario K\|starts no second sign-in"`, run once with `accounts.ts:74` restored by the `Edit` tool and `sign-in-pane.ts:78` still `const busy = alive;` | exit 1. Scenario K's case passed. The case "starts no second sign-in…" went red at `theme-controls.test.ts:396`, the read in the turn of the press: `[false, false]` where `[true, true]` was expected. The patch was then taken back with the `Edit` tool |
