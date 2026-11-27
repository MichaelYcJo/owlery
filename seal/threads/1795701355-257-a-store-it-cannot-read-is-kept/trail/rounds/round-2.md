# Review round 2: 1795701355-257-a-store-it-cannot-read-is-kept

```seal
target: 7bd83831, fixes 20d87d48..7bd83831
```

This is a verifying round. Its target is the fix pass of round 1: `20d87d48..7bd83831`, the commits `2cf16eb4`, `85ce7102`, `1344ca6b`, `d1bb9568`, `37c3f25f`, `df7350ec`, `37f2e4a0` and `7bd83831`. The round reviewed the code of that diff alone (`git diff 20d87d48..7bd83831 -- apps/`), and read every record of the work item whole at `7bd83831`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, both phase records and `trail/rounds/round-1.md` with its three close blocks. No `pr.md` stands yet. Carried from round 1, and not searched again: the coordinates of the store's refusal branch, of `keepAside`, of `createWorkItem`'s drops and of the window's two lines. Each verdict below was reached again at the target.

Two narrow runs were made, through the repository's runner, with the main checkout's Electron given as `ELECTRON_OVERRIDE_DIST_PATH` (see *Probes*). Everything else is read, or is the fix pass's recorded run, which is labelled as the crafter's. The suite is `unverified`, and the orchestrator answers it at the broad gate.

## Findings

No finding is opened this round.

## Confirmations

```seal
confirms: round-1#1
```
What holds: the refusal branch takes up a refused value's three counts through `isCounted` before `keepAside` (`apps/desktop/src/daemon/repositories.ts:185-187`, `:313-317`). The memory-only fallback therefore gives no id the file gave: `keepAside` changes only `file`, never `counts`. `isCounted` tests the three counts alone, so a later build's store, whose repositories fail `isStored`, keeps its counts. A value that states none gives ids from 1, and the rewritten comments say exactly that: `daemon.ts:1024`, and `daemon.ts:1637`, the ledger's comment, which round 1's finding named among its locations. Executed: `test/repositories.test.ts` passed 45 of 45 at `7bd83831`. That includes the `LATER` row of the `it.each` case, which gives work item 2 under repository 2; the memory-only case's `[[2, 2]]`; and the case of counts that are not numbers, which gives `[1, 1, 1]`, against repositories that fail, which give `[2, 2, 1]`. The daemon case at `test/daemon.test.ts:1484` passed in the second run, with `id: 2` and `nextRepositoryId: 3`. The guard was shown red by the crafter, not by this round: `isCounted` disabled through `seal mutate` turned the `LATER` row, the memory-only case and the daemon case red (`fix-1/mutate-counts-cases.txt` and `fix-1/mutate-counts-daemon.txt` under the crafters' scratch directory, read). The statements of the fact moved with it: `frame/design.md` *Scope* item 8 and item 3, *Data & interfaces*, both `## Rule changes` texts, the `RepositoryStore` docstring (`repositories.ts:262-266`), and `changelog.md:6` (read).

```seal
confirms: round-1#2
```
What holds: `keepAside` writes the store through `write()` right after the rename and catches what that write throws (`repositories.ts:355-361`). After a rename that failed, `file` is `undefined`, and `write()` returns at its first line (`repositories.ts:529-530`, read). So leaving out the paste-ready fix's `if (keptAs === null) return;` changes nothing. No case could tell the two apart, and the comment at `:356` says why. Executed in the first run: `leaves a store the next start reads, and not work-items.json, where it stops before any change after keeping a file aside` passed, and so did `starts all the same where the store it writes at once is refused`. The second case puts a folder at `partialOf(repositories.json)`. `writeWholeFile`'s `writeFileSync` then fails with `EISDIR`, and its `rmSync` of a folder fails inside its own catch (`whole-file.ts:28-35`, read), so the next change throws `EISDIR` as the case expects. The crafter recorded the first case red against `20d87d48`'s source (`fix-1/red-store.txt`, 7 failed) and the catch's mutants red (`fix-1/mutate-2a.txt`, `fix-1/mutate-2b.txt`, read). *Scope* item 2, acceptance rows 2 and 3, *Removes*, the docstring at `repositories.ts:259-262` and `changelog.md:5` all say the store is written at once (read). The other cases that write `repositories.json` before a daemon starts make no claim that nothing stands at the path after a refusal (executed: `git grep -n "repositories.json" -- apps/desktop/test` filtered for `exists`, `readdir`, `not json` and `toBe(false)`, which prints only `daemon.test.ts:1499` and `role-bundle.test.ts:550`, both of this work).

```seal
confirms: round-1#3
```
What holds: `the built app's notice of a kept repositories file` stands at `apps/desktop/test/role-bundle.test.ts:545-564`. It starts the built app with `writeRun` writing `{ not json` into the run folder and waits for `#status` to open with the first sentence of *Scope* item 4 up to `<userData>/run/repositories-unread-`. It then reads that the sentence ends as item 4 ends it and that the line carries the `notice` class, and it checks `app.stop()`'s answer as the case beside it does. `SHELL: "/usr/bin/true"` keeps the person's login shell and Claude Code out. Any notice of the agent stands after the store's in `statusNotice`'s order, so it cannot hide the line read. Executed in the second run: the case passed at `7bd83831`. The crafter showed it red with `held.storeNotice` replaced by `null` at `sidebar.ts:89` and with `renderer.ts:1901` removed (`fix-1/mutate-sidebar.txt` and `fix-1/mutate-renderer.txt`, each 1 failed, read). `gaps.md:11` closes its row in place, with the word `closed`, and the row does not leave the memo.

What matched: the fold `85ce7102` against the code. *Scope* item 8 names the run folder's files that key on a work item's id, at `last-look.ts:169`, `heavy-runs.ts:25` and `daemon.ts:4103-4108`. Each stands there at the target and holds a work item's id (read). *Data & interfaces* gives `isCounted`'s signature and the write at once as the code has them. `frame/plan.md` *Judgments of the run* now records that Q1 and Q2 are built on their defaults, which answers the third row of round 1's `## Not judged`. Its *Overlap with the release* says the fix pass's new case meets no other item's change to `role-bundle.test.ts`. The new *Alternatives considered* rows name what each rejected way would cost. The statements of the tree in *Grounding* that the fix changes, "A refused store makes no write at the daemon's start" among them, are dated to `5370d534`, and they state that commit. Read.

What matched: `changelog.md` whole at the target. Its bullets state the set-aside, the write at once, the counts, the notice and its order, the fallback, the way back by hand and the earlier builds. With the counts taken up, line 9's way back still holds. The restored file's next ids may be some the refusing daemon gave too. That collision is the one `createWorkItem`'s drops already serve, and it drops only what the refusing daemon's discarded work items kept (`daemon.ts:1024-1028`, read).

What matched: each new case against its group in `repositories.test.ts`. The stop-before-any-change case holds the next start's read, which the `it.each` case does not. The write-refused case holds the catch, which no other case reaches. The `it.each` rows and the counts case now hold the counts, a fact of *Scope* item 8. The built-app case holds the two lines of the window, which no unit case loads. Read.

A gap outside the findings: `isCounted`, like `isStored` before it, takes any JSON number as a count. A hand-edited file holding `1e999`, which parses to `Infinity`, or a negative count would give such an id (`repositories.ts:185-187`). No build writes such a file, and the read path has accepted the same values since `isStored` was written, so the release ships nothing new here.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate: every other file that starts a `Daemon`, `chain.test.ts` among them, every other built-app file, the typecheck of the package, and the `docs/` heading and row counts. This round ran two narrow commands only. | `gaps.md:7`, `gaps.md:10`, `gaps.md:12` | the orchestrator, at the broad gate |
| The cases of a file of mode `000` and a folder of mode `0500`, which fail when run as root; no CI run of them has been seen. | `gaps.md:8` | the orchestrator, from the CI's run of the pull request |
| Two daemons on one run folder at once, round 1's fourth row. The fix pass did not touch it, and this round did not read it again. | `apps/desktop/src/daemon/repositories.ts:220-227`, `apps/desktop/src/main/daemon-client.ts:42-73` | the orchestrator, as a follow-up issue where it holds |

With no finding open, what comes due is the orchestrator's broad run and the sealer's spawn after it.

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/repositories.test.ts` in `apps/desktop`, at `7bd83831`, with `ELECTRON_OVERRIDE_DIST_PATH` set to the main checkout's Electron | exit 0: 1 file, 45 passed |
| `node scripts/test-in-electron.mjs test/daemon.test.ts test/role-bundle.test.ts -t "keeps aside a .repositories.json. it cannot read\|carries only the fields the protocol names\|sends no .keepAwake. in .ready.\|notice of a kept repositories file"` in `apps/desktop`, at `7bd83831`, the same Electron | exit 0: 2 files passed, 5 passed and 425 skipped: the daemon case, the key pins of `ready` and the built-app case |
