# Review round 2: 1795388700-review-rounds

```seal
target: 7e387c3, fixes 0947f11..7e387c3
```

This round verifies round 1's closes and reads every commit after round 1's target: the orchestrator's `aee5611`, the fix pass from `2093738` to `b40847f`, the merge `cf1b843` of `release/v0.0.2` at `9e4a95f` (#45) where it meets this branch's code, the close `7b98298`, the closing memo's `0ec04cd` and the fold `7e387c3`. The work item's `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `7e387c3`, and the four phase records with them. No `pr.<lang>.md` stands, and no `seal/parity.json`.

Carried from earlier records rather than re-established: the agreement of the daemon's round record reader with the check's `round_read` on 40 records (`trail/phases/phase-1.md`), the stage's process ending before the next stage (round 1, *Confirmations*), and the merge `1fe0ddb` of #163 (round 1, *Confirmations*). The check's records arm was taken apart again from `pr-check/skills/code-review/scripts/chain_check.py` and not carried, since finding 1's fix rests on it.

No test file ran in this round, and no build. The suite stays `unverified`, and `gaps.md` row 21 says so honestly: the fix pass's account names the unit files it ran and one start of the built app, before the merge, and labels the rest the broad gate's.

Three findings. The first is a comparison of paths in finding 1's fix that differs from the check's. The second is a size the rule change on the view's foot misstates, which came from round 1's own snippet. The third is the join of #45's ledger entries to this work's chain stages, which the plan says was made and no record frames.

## Findings

### 1. A `fixed` commit is taken where the finding names its path with a backslash, and the pull request check refuses that record

```seal
severity: should
location: `apps/desktop/src/daemon/chain.ts:737-741`, `apps/desktop/src/daemon/chain.ts:169-173`, `apps/desktop/test/chain.test.ts:1334`
evidence: read `apps/desktop/src/daemon/chain.ts:169-173`, `apps/desktop/src/daemon/chain.ts:720-742`, `apps/desktop/src/daemon/record-blocks.ts:344`, `pr-check/lib/fields.py:98`, `pr-check/skills/code-review/scripts/chain_check.py:991-995`, `pr-check/skills/code-review/scripts/chain_check.py:1448-1481`; executed `python3 -B -c` importing `chain_check` from `pr-check/skills/code-review/scripts`, which printed `False` for `under("src/a.ts", "src\\a.ts")` and `['src\\a.ts']` for `location_paths` of a location naming `src\a.ts:3`
regression: round-1#1
```

Why it matters: the unit is the touch rule of `chain.ts#fixedCommitsHeld`, which `1c8a033` added. `frame/design.md` *Scope* item 7 has the daemon commit a `fixed <commit>` only where the commit changed a path a `location:` line names, or a path under one, as the check's `verdict_problems` reads it. The fix compares each path with `inFolder` (`chain.ts:739`), and `inFolder` (`chain.ts:170-173`) turns every `\` of the folder into `/` before it compares. That helper was written for folders the daemon builds itself with `relative()`; the fix gave it a proofer's text, and the defect came from that reuse. The check's `under` (`chain_check.py:991-995`) compares the place as written. Both location shapes take a `\` inside a path (`record-blocks.ts:344`, `fields.py:98`), and a file name on macOS may hold one.

So a finding located at `` `src\greet.ts` `` whose fix commit changed `src/greet.ts` is committed by the daemon, and the check at the pull request refuses it with "touches no path its `location:` names". No stage can repair a committed record, as round 1's finding 1 says. This is the class round 1 listed, at the same row, and the enumeration of `inFolder`'s callers (`chain.ts:195`, `daemon.ts:1966`, `daemon.ts:2134` and `chain.ts:739`) leaves this one alone: the other three compare paths git printed with the daemon's own folder.

Once the code holds, `changelog.md:8`, `gaps.md:42`, `frame/design.md:84`, `:258` and `:263`, and `pr.md:8` say what the code does, so none of them needs an edit.

```ts
// chain.ts, beside fixedCommitsHeld. No OS boundary: both sides are text, the paths as
// `git diff-tree -z` prints them and the place as the record writes it.
/** Whether a path a commit changed is a place a `location:` line names, or lies under it, as `under` of `pr-check/skills/code-review/scripts/chain_check.py` reads the two: the place as written, its trailing `/` dropped. */
function underPlace(path: string, place: string): boolean {
  const stem = place.replace(/\/+$/u, "");
  return path === stem || path.startsWith(`${stem}/`);
}

// fixedCommitsHeld, in place of the line that calls inFolder:
if (!changed.some((path) => places.some((place) => underPlace(path, place)))) {
```

The case "commits nothing where a fixed names a commit that changed no path its finding's location names" (`test/chain.test.ts:1334`) owes one more half: a finding located at `` `notes\greeting.md` ``, closed `fixed` with the commit that changed `notes/greeting.md`, is refused. Against `inFolder` that half is taken, so it is red before the fix.

```seal
verdict: fixed 304afc1
answer: `304afc1` adds `chain.ts#underPlace`, which compares a place as the record writes it with its trailing `/` dropped, as the check's `under` does, and `fixedCommitsHeld` calls it in place of `inFolder`. The record's fix was read against `frame/design.md` *Scope* item 7 and `chain_check.py#under` and applied as written. The case at `test/chain.test.ts:1334` gains the half the record names, which failed against `inFolder` and is red under `seal mutate` with the `\` turned to `/` again. `868bfe4` writes the folder of the case's last half as `notes/`, so a case holds the dropped `/` too.
```

### 2. The rule change on the view's foot gives the seal's state and the main button `--size-second`, and the page draws them larger

```seal
severity: should
location: `seal/threads/1795388700-review-rounds/frame/design.md:280`, `seal/threads/1795388700-review-rounds/frame/design.md:286`
evidence: read `apps/desktop/src/renderer/index.html:11-17`, `apps/desktop/src/renderer/index.html:65`, `apps/desktop/src/renderer/index.html:69`, `apps/desktop/src/renderer/index.html:89`, `apps/desktop/src/renderer/index.html:409-417`, `apps/desktop/src/renderer/index.html:670-679`, `docs/design.md:18`, `docs/design.md:425`; executed `grep -c -F` of each operation's `from` row over `docs/design.md` and `docs/design.ko.md`, one match each
regression: round-1#6
```

Why it matters: the unit is the two `change` operations `aee5611` added to `frame/design.md` *Rule changes*, which the settle writes into `docs/design.md` and `docs/design.ko.md`. `docs/design.md:18` makes that document the statement of every form, so a later work item draws a foot from it. The fix applied round 1's snippet word for word, and the defect came from that snippet: round 1 did not read the sizes of the state and the button before it wrote "each at `--size-second` and wrapped". The English clause covers the five parts it lists, and the Korean edition says it outright: "모두 `--size-second`이고".

The page draws two of the five otherwise. "No seal yet" is `.name.head` (`index.html:673`), which `.head` sets in `--font-title` at `--size-head`, 15px (`index.html:89`, `:15`). The button inherits the page's `--size-text`, 13px (`index.html:65`, `:69`, `:676`). The note, the chain's sentence and the refusal are at `--size-second` (`index.html:411`, `:413`), and the sentence and the refusal wrap anywhere. The `check:` lines name `test/get-a-seal.test.ts` and `test/view.test.ts`, and neither reads a size, so nothing holds the clause either way.

The fix replaces the two `to:` lines, each whole. The `from:` lines stay, since both still stand once in their files. The orchestrator owes it, as no crafter writes the frame.

```text
  to: | The seal's place | Before a seal: on a line a disc of `--seal-blank-ground` with `--seal-blank-edge`, and in the preview and at a view's foot the seal's drawing pressed into the ground in the blank tones under `--seal-blank-light`. At a view's foot a column of words stands beside the drawing: the state of the seal, its note in `--ink-muted`, where the review chain stands in `--ink`, the main button "Get a seal", and under it why the daemon refused the last press, in `--state-failed`. The note, where the chain stands and the refusal are at `--size-second` and wrapped. Sealed: the seal as it is drawn, under `--seal-light`. | — | — | — | — | — |

  to: | 인장의 자리 | 인장이 찍히기 전: 줄에서는 `--seal-blank-ground`의 원판에 `--seal-blank-edge`이고, 미리 보는 칸과 작업 화면의 아래쪽에서는 인장의 그림이 빈 자리의 색조로 `--seal-blank-light` 아래 바탕에 눌려 있습니다. 작업 화면의 아래쪽에서는 그림 옆에 글이 한 줄기로 섭니다. 인장의 상태, `--ink-muted`의 그 메모, `--ink`로 쓴 리뷰 체인이 어디에 서 있는지, 주 버튼 "Get a seal", 그리고 그 아래 `--state-failed`로 쓴 데몬이 마지막 누름을 거절한 까닭입니다. 메모와 체인이 서 있는 자리와 거절한 까닭은 `--size-second`이고 줄을 바꿔 감깁니다. 인장이 찍힌 뒤: 그려진 그대로의 인장이 `--seal-light` 아래에 있습니다. | — | — | — | — | — |
```

```seal
verdict: fixed 8a49d29
answer: The orchestrator's `8a49d29` replaces the two `to:` lines of `frame/design.md` *Rule changes* with the record's two lines, each whole; the `from:` lines stay. The fix touches the work item's records alone.
```

### 3. No record says how a ledger entry joins the chain stage it was for, and the plan says this work gave the entry its stage

```seal
severity: should
location: `seal/threads/1795388700-review-rounds/frame/plan.md:75`, `seal/threads/1795388700-review-rounds/frame/design.md:121`
evidence: read `apps/desktop/src/daemon/daemon.ts:1488-1495`, `apps/desktop/src/daemon/daemon.ts:1550-1556`, `apps/desktop/src/daemon/daemon.ts:1570-1579`, `apps/desktop/src/daemon/daemon.ts:2157`, `apps/desktop/src/shared/protocol.ts:445-460`, `seal/threads/1795341001-cost-per-stage/frame/design.md:67`, `seal/threads/1795388700-review-rounds/frame/design.md:173`; executed `grep -n "ledger\|readLedger" test/chain.test.ts test/chain-run.ts` in `apps/desktop`, which found no case of a stage's entry
```

Why it matters: the plan's row for #45 (`frame/plan.md:75`) claims: "Where #45 is sealed first, it keys an entry by the headless session, and this work's phase 2 takes the merge and gives the entry its stage in commits it makes anyway." #45 was sealed first and came in at `cf1b843`. The entry it writes (`daemon.ts:1578`) holds the work item, the repository, the branch, the pair as `stage`, the two times, how it ended and the usage. It holds no headless session's id, and the merge gave it no chain stage. `LedgerStage` is a pair of `ROLE_STAGES` (`protocol.ts:445-446`), so a ruling's entry and a judgment of convergence's entry both read `orchestrator` at `judgment`: the split round 1's finding 2 made in `ChainStage.kind` does not reach the ledger. `frame/design.md:121` offers "A `ChainStage` names its headless session" as the link, and no entry names one; the stage's `headlessId` is also null once the daemon that ran it has ended (`frame/design.md:173`). #45's frame leaves "which round or fix pass an entry belongs to" to this work and #47 (`seal/threads/1795341001-cost-per-stage/frame/design.md:67`), so the framer of #47 reads this frame for the join and finds a link that does not exist.

What does join the two is exact in the code: `daemon.ts:2157` gives a stage its session's `startedAt`, and the entry carries that `startedAt` and the work item (`daemon.ts:1578`). One more statement of `frame/design.md:121` is wider than the code: a session whose adapter rejected its start makes no entry (`daemon.ts:1492`), which "each headless session that ends ... makes one entry" leaves out.

The repair is the orchestrator's, on the records alone. Where it judges that the entry should name its chain stage instead, the protocol's `LedgerEntry` gains a field and the plan's row says so. Otherwise:

```markdown
<!-- frame/design.md:121, the whole item -->
- **A ledger entry per stage.** #45 writes it: each headless session that ends, a stage's among them, makes one entry of the ledger, with the `usage` its result reported, and a session whose adapter rejected its start makes none. An entry names its work item, its pair and its two times, and no headless session. A `ChainStage` holds its session's `startedAt`, so an entry and its stage share their work item and their `startedAt`, and #47 joins them by those two. A ruling's entry and a judgment's both name the pair `orchestrator` at `judgment`.

<!-- frame/plan.md:75, the last cell of the row for #45 -->
#45's issue depends on #41, and its entry names a thing this work defines. #45 was sealed first: its entry names its work item, its pair and its times, and this work gives it no field. A stage and its entry share their work item and their `startedAt` (`frame/design.md` *Out of scope*)
```

```seal
verdict: fixed 8a49d29
answer: The orchestrator's `8a49d29` takes the record's second repair: `frame/design.md` *Out of scope*'s item on the ledger and the last cell of `frame/plan.md`'s row for #45 now read as the record shows, so an entry and its stage are joined by their work item and their `startedAt`, and the entry gains no field. The fix touches the work item's records alone.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `chain.ts#roundRecordOf` refuses each reference the check's `channel` refuses, at the line it stands on: any `confirms:`, `reopens:` or `regression:` line in the first record (`chain.ts:659`), one that names a round no earlier record of the work item is (`chain.ts:660-661`), and one that names a finding its record does not hold (`chain.ts:662`). `earlier` is every record the branch's head holds (`daemon.ts` `runRound`, `earlier: standing.rounds`), and `stepOwed` numbers a round one past the last of them, so the comparison `53b0453` removed held nothing. `fixedCommitsHeld` reads a commit's paths with the check's own `git diff-tree --no-commit-id --name-only -r --root -z` (`worktrees.ts:963`), so a first commit lists its files and a merge lists none, as `touched` gives them. The places are the finding's and the close block's, as `finding_of` joins them. Read, against `chain_check.py:902-978` and `:980-995`; finding 1 above is the one place the comparison still differs.

The fix pass's narrowing holds too. Of `chain_check.py#main` (`:2296-2332`), the arms that refuse a round record are `records` and `originals_of`; `unread` prints notices alone, and `body` and `guarantee` read other files. So the parity arm's `original:` line is the one kind outside the records arm, and `changelog.md:8`, `gaps.md:42`, both editions of the rule change on *Records are committed to the repository* (`frame/design.md:258`, `:263`) and `pr.md:8` each say that the daemon does not hold it. This repository declares no migration (executed: `ls seal/parity.json` found no file).

```seal
confirms: round-1#2
```
What holds: a ruling on a stage's questions is stored as a stage of the kind `ruling` (`daemon.ts:2293`), `CHAIN_STAGE_KINDS` holds the four kinds (`protocol.ts:301`), and `gateBefore` passes a person's first step only where the last stage is a finished `judgment` of that round (`chain.ts:243`). The new case at `test/chain.test.ts:1665` parks round 2 on its proofer's question, has the start at the answer refused for a loose file and starts by `getSeal`, and expects the orchestrator, the crafter and the proofer in that order. Read against the old `daemon.ts`, where the ruling was stored as `judgment`, that case gets the crafter first. The words `The ruling after round N` (`chain.ts:66`) and the cell `ruling N` are pinned by cases. Read.

```seal
confirms: round-1#3
```
What holds: `chain.ts#roundBase` (`chain.ts:155`) gives the base branch only where `record-blocks.ts#ROUND_BASE` takes it, and `ROUND_BLOCK`'s target shape is built from the same `BASE` (`record-blocks.ts:350-353`), so the two cannot drift. `runChain` passes it to `standingOf`, and `stepOwed` writes round 1's target from it. The cases at `test/chain.test.ts:82` and `:871` hold a name with `+`, `@`, `#`, `,`, `!` and a trailing `-`, and the second reads it through a daemon. Read.

```seal
confirms: round-1#4
```
What holds: `view.ts#refusedSeal` (`view.ts:2161`) keeps a refusal with the state and the `since` of the chain as the window holds it at the answer, and `sealButton` says it only while both are unchanged and the chain is not running (`view.ts:2185`). Every write of a chain's state sets `since` from the daemon's clock: the start (`daemon.ts:1913`), the stop where the start at the answers is refused (`daemon.ts:1935`) and each rest of `runChain` (`daemon.ts:2009`); `runStage` changes the stages alone. So a chain that ran, whoever started it, changes one of the two, even where it stops before any stage starts. That is the case the record's marker, the newest stage's start, would have missed, and the departure from the record's snippet is sound. A window that took the refusal before or after the inbox that carried a resumed chain reads the same, since either list differs from the next rest. `work-item-view.ts#takeSeal` (`:857-865`) and `showSeal` (`:833-840`) do what `gaps.md:22` says, and the view's draw calls `showSeal` (`work-item-view.ts:965`). Read; the case at `test/view.test.ts:1360` holds the comparison, and no case of the built app does, as that row says.

```seal
confirms: round-1#5
```
What holds: `view.ts#lineSince` counts a stopped chain from `chain.since` (`view.ts:187`). `chain.ts#chainOf` (`:793`) reads a chain stored with no `since` as its newest stage's end, that stage's start where it did not end, and 0 where it holds no stage. `chain.ts#chainRead` (`:817`) reads a chain stored `running` as stopped since the clock of the daemon that reads it, and the store calls it once, when it is built (`repositories.ts:249`). That second reading counts the wait from the daemon's next start and not from its end, which no record holds. `frame/design.md:174` states it, and no policy says otherwise, so it is the frame's choice and not a finding. A chain with no `since` and no stage reads 0, which would show an age of decades; only an earlier build of this branch wrote such a chain, and no release did. The cases at `test/view.test.ts:1302`, `test/chain.test.ts:632` and `:1628` hold the three readings and the clock of each write. Read.

```seal
confirms: round-1#6
```
What holds: `aee5611` adds a `change` operation on *Components and their states* of `docs/design.md` and one on *부분과 그 상태* of `docs/design.ko.md` (`frame/design.md:276-287`). Each `from:` row stands once in its file (executed: `grep -c -F`, 1 and 1), and the line of `gaps.md` that named the gap left. Finding 2 above is the size the new rows misstate.

```seal
confirms: round-1#7
```
What holds: `frame/plan.md:96` records the judgment to keep the release's form of `pr.md`, with its grounds and the document it judged against. `pr.md:8` and `pr.md:13` hold the record's two corrected sentences, and `pr.md:10` says that six rounds is a default taken for a question the owner has not answered, as `frame/questions.md:18` holds it. Read.

What matched: the four conflicts of `cf1b843` in `src/daemon/daemon.ts`. The import holds this branch's chain types beside #45's `LedgerEntry`. The `ask` case reads `held` as #45 does and calls `beginHeadless(held, …)`, which gives the session #45's `repo`, `branch` and `entered: false`, and `usage` in place of `costUsd` (`daemon.ts:1511-1536`). A start the adapter rejects marks the session `entered` before `failed`, so it makes no entry, and the branch's `started` still settles as no run (`daemon.ts:1488-1495`). `headlessChanged` enters the session and then resolves its end, so the stage's `after` runs once the entry is made (`daemon.ts:1550-1556`). A stage's session begins in `beginHeadless` like an `ask`'s, so each stage that ends makes one entry: `enter` adds one at most (`daemon.ts:1574-1579`), and a close enters a working stage as the daemon's stop (`daemon.ts:551-552`). No case of `test/chain.test.ts` reads a stage's entry; `frame/design.md` *Out of scope* gives the entry to #45, whose case of `test/daemon.test.ts:5100` holds it for a session with a role and without, so this is a gap with no fact of this frame. `git grep costUsd` names #45's usage fields alone. Read with `git show --cc cf1b843`.

What matched: the fold `7e387c3`. Each sentence the fix pass's closes named for the orchestrator now says what the code does: *Scope* items 5, 6, 7, 9, 25, 26 and 27, the `Chain` line and the `CHAIN_STAGE_KINDS` line of *Data & interfaces*, the units of `chain.ts`, `worktrees.ts` and `view.ts` it names, the stage cell `ruling 2`, the definitions at the head of the frame, the ledger's `usage`, and both editions of the rule change on *Records are committed to the repository*. Read, against the coordinates above.

What matched: each new case of the fix pass was read against its group. The ruling case at `test/chain.test.ts:1665` runs round 2, where the case beside it runs round 1. The daemon case at `:871` holds the base's shape, where the one at `:854` holds a base that is gone. The group "a reference a round's answer makes" (`:201`) holds the three refusals, each at its line, and none of the earlier groups held one. The case of `pathsOfCommit` (`test/worktrees.test.ts:1083`) holds a first commit, a merge and a name that is no commit. No new case covers only what its group already covered.

Two things this round weighed and opened no finding for. `gaps.md:11` is a blank line inside the `## Not verified` table, so GitHub draws rows 12 to 24 as one paragraph of pipes. `lib/gaps.py#parse_section` skips blank lines and reads every row, so nothing a check or an agent reads changes, and the line only reads badly; it stood at round 1's target as well. And the comments and the case names that still call a ruling "the judgment on a stage's questions" (`chain.ts:443`, `daemon.ts:1997`, `gaps.md:54`) say nothing false of it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the typecheck and the files that start the built app, at `7e387c3`. This round ran no test, by contract rule 2, and `gaps.md` row 21 labels the fix pass's and the merge's tree unrun | `apps/desktop` | The orchestrator's broad gate |
| The fix pass's account that each new guard was shown red, by a run against the old code or by `seal mutate`. This round read each case against the code it would fail on and ran none | `apps/desktop/test/chain.test.ts`, `apps/desktop/test/view.test.ts` | The sealer, from the fix pass's account and the cases |
| Whether the built window drops a refusal under "Get a seal" once a chain that no press started has run. This round read the code that does it, and no case of the built app parks a chain and reads the foot | `seal/threads/1795388700-review-rounds/gaps.md:22` | The first real chain on a branch of Owlery's own |
| How the foot draws a long sentence and a refusal. The page's style was read against the rule as finding 2 rewrites it, and no screenshot shows either | `seal/threads/1795388700-review-rounds/gaps.md:23` | The orchestrator, with a screenshot of a chain's view |

## Probes

| Command | Result |
|---|---|
| `python3 -B <plugin>/skills/code-review/scripts/chain_check.py --baseline origin/release/v0.0.2 --root <the branch worktree> --worktree`, with `PATH` set to `/usr/bin:/bin` so no `gh` is asked, before this record was written | Exit 0. The pull request's state is unknown and not judged as ready. It named round 1's six `fixed` findings and the last target behind HEAD as owing a verifying round, and no `trail/gate.md` and no `guarantee.md` in git. No notice named a test pin or a copy in `frame/design.md` |
| `python3 -B -c` importing `chain_check` from `pr-check/skills/code-review/scripts`, calling `under("src/a.ts", "src\\a.ts")` and `location_paths` of a location naming `src\a.ts:3` | `False`, and `['src\\a.ts']` |
| `grep -c -F` of each `from:` row of the two operations on the design rules, over `docs/design.md` and `docs/design.ko.md` | 1 and 1 |
| `grep -n "ledger\|readLedger" test/chain.test.ts test/chain-run.ts`, in `apps/desktop` | Nothing printed |
| `git grep -n costUsd -- apps seal/threads/1795388700-review-rounds` | Only #45's usage fields in `claude.ts`, `ledger.ts` and `protocol.ts:432` |
| `ls seal/parity.json` | No such file |
