# Review round 3: 1795388700-review-rounds

```seal
target: 83bebf6, fixes 7e387c3..83bebf6
```

This round verifies round 2's closes and reads every commit after round 2's target: the record `60afa64`, the orchestrator's `8a49d29` on the frame and the plan, the fix pass's `304afc1` and `868bfe4`, the closing memo's `d96027e` and the close `83bebf6`. The code it reviews is the fix diff, `apps/desktop/src/daemon/chain.ts` and `apps/desktop/test/chain.test.ts`. The work item's `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `83bebf6`. The four phase records were searched for the touch rule, and the two earlier round records were read for their coordinates. No `pr.<lang>.md` stands, since `Commit and pull request language` is English, and no `seal/parity.json` stands (executed: `ls seal/parity.json` found no file).

Carried from earlier records rather than re-established: the agreement of the daemon's round record reader with the check's `round_read` (`trail/phases/phase-1.md`), the paths of a finding and of its close block as `finding_of` joins them (round 2, the confirmation of round 1's finding 1), and the merge `cf1b843` of #45 (round 2, *Confirmations*). The check's `under` and `verdict_problems` were read again at `pr-check/skills/code-review/scripts/chain_check.py:991-994` and `:1448-1470`, since finding 1 of round 2 rests on them.

One group of `test/chain.test.ts` ran at the target, and two probes ran against it, each in a clone of the branch. No other test file ran, and no typecheck. The suite stays `unverified`, and `gaps.md:22` says so honestly: the fix pass names the six unit files it ran and labels the typecheck and the files that start the built app the broad gate's.

One finding. Round 2's third close holds where its snippet reached, and the cell of the same row that the snippet did not name still says the opposite.

## Findings

### 1. The plan's row for #45 still says the ledger's stage is this work's `ChainStage` with its headless session's id, beside a cell that says the entry names its pair and no session

```seal
severity: should
location: `seal/threads/1795388700-review-rounds/frame/plan.md:75`
evidence: read `seal/threads/1795388700-review-rounds/frame/plan.md:75`, `apps/desktop/src/shared/protocol.ts:445-463`, `apps/desktop/src/daemon/daemon.ts:1578`, `apps/desktop/src/daemon/daemon.ts:2157`, `seal/threads/1795388700-review-rounds/frame/design.md:121`; executed `git grep -n -i ledger` over the work item's records outside `trail/rounds/`, which named `frame/design.md:121`, `frame/plan.md:75`, `frame/plan.md:94` and `gaps.md:21`
reopens: round-2#3
```

Why it matters: the close of round 2's finding 3 does not hold for the whole row it changed. That finding named the plan's claim that this work gave #45's entry its stage. `8a49d29` rewrote the row's last cell, which now reads "#45 was sealed first: its entry names its work item, its pair and its times, and this work gives it no field". The row's second cell, *Where both change*, still reads "Its ledger holds one entry for each stage, and a stage is this work's `ChainStage`: its kind, its round, its start, its end and its headless session's id". Round 2's snippet named the last cell alone and did not say where it stopped, so the second cell kept the claim.

The target contradicts the second cell. An entry's `stage` is a `LedgerStage`, a pair of `ROLE_STAGES` (`protocol.ts:445-446`). The daemon writes it from the session's `role` (`daemon.ts:1578`), and no field of `LedgerEntry` (`protocol.ts:449-463`) holds a chain stage's kind, its round or a headless session's id. `frame/design.md:121` says the same as the last cell, so the row now disagrees with itself and with the frame. A reader who takes the second cell, such as the framer of #47 that joins an entry to its stage, looks for a kind and a round on the entry, and the entry carries neither.

Of the statements of this fact, `frame/design.md:121` and the row's last cell hold. `frame/plan.md:94` is a dated judgment of the run and stays. The snippet below covers the one cell left. The repair touches the work item's records alone, so it is the orchestrator's.

```markdown
<!-- frame/plan.md:75, the second cell of the row for #45, whole -->
`src/daemon/daemon.ts` at the result of a headless session, `src/daemon/adapters/adapter.ts` and `fake.ts`, and `src/shared/protocol.ts`. Its ledger holds one entry for each headless session that ends, a stage's among them, and the entry's `stage` is the session's pair of `ROLE_STAGES`, not this work's `ChainStage`
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: `chain.ts#underPlace` (`chain.ts:728-731`) compares a path with a place as `under` does at `chain_check.py:991-994`. It drops the place's trailing `/` and takes the path where it is the stem or starts with the stem and a `/`, and it turns no `\` into a `/`. `fixedCommitsHeld` calls it for every place of the finding and of its close block (`chain.ts:749-751`). `inFolder` keeps three callers, `chain.ts:195`, `daemon.ts:1966` and `daemon.ts:2134`, and each compares a path git printed with the daemon's own directory (executed: `git grep -n "inFolder\|underPlace\|\.located" -- src` in `apps/desktop`). Executed: the group "a fix pass held to its record" of `test/chain.test.ts` passed at the target, 7 cases. The close's claim that the new half was red against `inFolder` holds. With `underPlace` replaced by `inFolder` at `chain.ts:751`, the case failed at `test/chain.test.ts:1346`, the half with `notes\greeting.md`, where the pass finished and a second round ran. With the strip of the trailing `/` removed from `underPlace`, the case failed at `test/chain.test.ts:1356`, the half with `notes/`. So each half pins its own guard. The `notes/` half took the place of `notes`, which held the folder through the same branch of `underPlace` and no guard of the strip, so the group lost nothing it held.

```seal
confirms: round-2#2
```
What holds: the two `to:` lines of `frame/design.md:280` and `:286` give `--size-second` to the note, the chain's sentence and the refusal alone. The page draws those three at `--size-second` (`apps/desktop/src/renderer/index.html:411`, `:413`), the seal's state as `.head` at `--size-head` (`index.html:89`, `:673`), and the button as `.primary` at `--size-text` (`index.html:78`, `:676`). The colours each line names are the page's too: the note in `--ink-muted` (`index.html:411`), the sentence in `--ink` (`index.html:414`) and the refusal in `--state-failed` (`index.html:415`). The Korean line says the same three. Each `from:` line still stands once in its file (executed: `grep -c -F` over `docs/design.md` and `docs/design.ko.md`, 1 and 1).

What matched: the rest of round 2's third close. `frame/design.md:121` says what the code does. A session whose adapter rejected its start is marked entered and makes no entry (`daemon.ts:1490-1493`). An entry holds the session's `startedAt` and its work item (`daemon.ts:1578`), and a stage holds its session's `startedAt` (`daemon.ts:2157`). A ruling and a judgment are both launched as the pair `orchestrator` at `judgment`. Read. The join by work item and `startedAt` tells two entries apart only where two sessions of one work item did not start in the same millisecond. The cases run the daemon on a fixed clock, so there every stage of a chain shares its `startedAt`. That bears on the cases #47 writes and on nothing this work builds, so it is no finding.

What matched: `gaps.md:22`, the row `d96027e` adds. The six unit test files it names are exactly those whose imports reach `src/daemon/chain.ts` (executed: a script under the round's scratch directory that follows each test file's relative imports; it listed those six and `test/role-session.test.ts`, which starts a real `claude` and which `gaps.md:9` leaves to the first real chain). The commit adds one line and removes none (executed: `git diff --numstat 7e387c3..83bebf6 -- gaps.md`, 1 and 0).

What matched: the judgment row `8a49d29` adds at `frame/plan.md:97`. Round 1 left seven findings, round 2 confirmed all seven closes and found three, all `should`, and two of the three were located in the records alone. Read against `trail/rounds/round-1.md` and `trail/rounds/round-2.md`. `83bebf6` adds three close blocks to `round-2.md` and removes no line of it (executed: `git diff 7e387c3..83bebf6` of the file, no removed line).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the typecheck and the files that start the built app, at `83bebf6`. This round ran one group of one unit file, by contract rule 2, and `gaps.md:22` labels the rest unrun | `apps/desktop` | The orchestrator's broad gate |
| Whether the built window drops a refusal under "Get a seal" once a chain that no press started has run | `seal/threads/1795388700-review-rounds/gaps.md:23` | The first real chain on a branch of Owlery's own |
| How the foot draws a long sentence and a refusal. The page's style was read against the rule as `8a49d29` rewrote it, and no screenshot shows either | `seal/threads/1795388700-review-rounds/gaps.md:24` | The orchestrator, with a screenshot of a chain's view |

## Probes

| Command | Result |
|---|---|
| `python3 -B <plugin>/skills/code-review/scripts/chain_check.py --baseline origin/release/v0.0.2 --root <the branch worktree> --worktree`, with `PATH` set to `/usr/bin:/bin` so no `gh` is asked, before this record was written | Exit 0. The pull request's state is unknown and not judged as ready. It named round 2's finding 1, closed `fixed 304afc1`, and the last target behind HEAD as owing a verifying round, and no `trail/gate.md` and no `guarantee.md` in git. No notice named a test pin or a copy in `frame/design.md` |
| `pnpm install --offline --frozen-lockfile` in a `git clone --no-local` of the branch at `83bebf6`, then `node scripts/test-in-electron.mjs test/chain.test.ts -t "a fix pass held to its record"` in its `apps/desktop`, with `ELECTRON_OVERRIDE_DIST_PATH` naming the worktree's Electron | Exit 0: 7 passed, 92 skipped |
| The same run with `-t "commits nothing where a fixed names a commit that changed no path"`, with `underPlace` replaced by `inFolder` at `chain.ts:751` of the clone | Exit 1: the case failed at `test/chain.test.ts:1346`, through `stoppedWith` at `:1309`, where the stages were a finished round, a finished fix pass and a round |
| The same run with the strip of the trailing `/` removed from `underPlace` in the clone, which was then restored with `git checkout` | Exit 1: the case failed at `test/chain.test.ts:1356`, where the chain stopped on the touch rule in place of resting `reviewed` |
| `node reach.mjs <apps/desktop of the branch worktree> src/daemon/chain.ts`, a script under the round's scratch directory that follows each test file's relative imports | `chain.test.ts`, `daemon.test.ts`, `hooks.test.ts`, `last-look.test.ts`, `pr-check.test.ts` and `repositories.test.ts` of the unit project, and `role-session.test.ts` |
| `git grep -n -i ledger` over the work item's records outside `trail/rounds/` | `frame/design.md:121`, `frame/plan.md:75`, `frame/plan.md:94`, `gaps.md:21` |
| `grep -c -F` of each `from:` line of the two operations on the design rules, over `docs/design.md` and `docs/design.ko.md` | 1 and 1 |
| `ls seal/parity.json` | No such file |
