# Design: the back of the seal

Issue #47, "the seal has no back that sets each stage's cost beside the defects each round caught". The paths below are under `apps/desktop/` unless they open with `docs/`, `seal/`, `pr-check/`, `etcs/` or `apps/`.

## Grounding

The tree as read at `b33ebef`.

This work stands on work items of the release whose code the tree at `b33ebef` did not hold. #45, #41, #46, #42, #43, #44 and #22 have since merged into `release/v0.0.2`. This branch merged the release branch at `cad4a64`, which held all of them but #22, and again at `90184d5`, which holds #22. The second table below is each of them as merged. The rows of #45 to #44 were read at `cad4a64` on 2026-11-24, and every statement of this frame that names their code was read again against that tree then. The row of #22 was read at `90184d5` on the same day, with every statement of this frame that names #22's code, and `frame/plan.md` *Overlap with the release* says what its merge moved. A coordinate this frame dates to `cad4a64` stands at that commit, and the last row of the third table names each one that #22's merge moved, with its place at `90184d5`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/product.md` *The seal*, item 3 | The back of the seal shows the defects the review caught and fixed before the pull request side by side with the cost of each stage, in the user's own numbers. |
| `docs/product.md` *The seal belongs to the product and looks the same everywhere*, the rows "Seal record" and "Display" | The seal record holds the commit, the base, the gate, the count of rounds, the verdict and who judged. The app's back of the seal and the pull request's body are displays that read the same record. |
| `docs/product.md` *What the user sees in the first session*, steps 2 and 4 | The review records keep each defect at file and line level, and the cost of the work item is split by stage and shown next to the defects each round caught. |
| `docs/product.md` *File explorer and editor*, the bullet "You go straight in from the back of the seal" | Opening a finding's file at its line, and the diff of the commit that fixed it, belong to the editor, which `docs/roadmap.md` *Milestones* row 4 and its *Open decisions* row "The light editor" hold. |
| `docs/product.md` *Benchmark plan* | A work item launches stages several times, so the cost is shown with what the review caught. "Tokens per merged PR" is a measure, so the back shows tokens beside dollars. |
| `docs/roadmap.md` *Why this order*, ground 1 | The back comes with the process, so that it does not read as one more count of review findings. |
| `docs/roadmap.md` *Open decisions*, the row "Where the public ledger lives", and *Done criteria*, the row "The ledger is public" | Publishing the ledger is milestone 5's and issue #76's. A pull request's body that carries one work item's numbers is not the published ledger. |
| `docs/architecture.md` *State lives in three places* | The round records and the seal record are committed. The cost ledger is the daemon's state and is committed nowhere. So the back is composed from two places, and nothing of a cost enters a record. |
| `docs/architecture.md` *What changes because Owlery is not a plugin*, the rows "Measuring cost" and "Showing the seal" | Under a subscription login a cost is a value converted at API prices, and the ledger labels it. The inbox, the back of the seal and the pull request read the same records. |
| `docs/architecture.md` *Memory design*, the first rule | A feature costs nothing while nobody uses it. The back's data is read when the back is opened and let go when it closes, and no work item carries it in every `inbox` message. |
| `docs/design.md` *Principles* 1, 2, 6, 8 and 9 | Red stands on the seal alone, so no cost and no failed stage is red. The window reports. The window spends no memory on its look. A form the window draws is stated in `docs/design.md` first, in the same pull request. |
| `docs/design.md` *What every theme shares* and *The voice of the window's words* | No theme changes the layout or a word. A fact of the seal is said as a fact, a state is two words at most, and no word sells. |
| `docs/design.md` *A pull request that changes the window carries its screenshots* | This pull request carries a screenshot of the back, made by `pnpm run screenshots`. |
| The index of the policy root | `docs/README.md` does not exist (executed: `ls docs`). Each `file:` of *Rule changes* is a file `ls docs` lists. |

The work of the release this frame stands on. Each row is code read in the merged tree, and names the squash commit that merged it. The row of #22 was read at `90184d5` and every other row at `cad4a64`.

| Work item | Read at | What it fixes for this work |
|---|---|---|
| #45, `seal/threads/1795341001-cost-per-stage/` | merged at `9e4a95f` | `src/shared/protocol.ts#LedgerEntry`, `#Usage` with `converted`, and `#LedgerStage`, which is a pair of `ROLE_STAGES`, the gate's `{ role: null, stage: "gate" }`, or null. `src/daemon/ledger.ts#Ledger`, whose `read(workItemId, since)` gives one work item's entries and the count of the lines of the file that are no entry, and whose `entryOf` reads a line as an entry only where every field is of its type. The messages `readLedger` and `ledger` (`daemon.ts:1306`). `daemon.ts#enter` (line 1694), which writes one entry when a headless session ends, with `stage: info.role`. Its *Scope* leaves "which round or fix pass an entry belongs to" to this work. |
| #41, `seal/threads/1795388700-review-rounds/` | merged at `71d035e` | `src/daemon/round-record.ts#readRoundRecord`, which gives a record's `target`, its `findings`, each with its `heading`, its `close` and its references, its `confirmations` and its `refusals`. `protocol.ts#CHAIN_STAGE_KINDS`, which holds `ruling` beside `judgment`, and `ChainStage.round`. `daemon.ts#runStage(workItemId, kind, round, role, worktree, prompt, after)` (line 2297), which starts each stage's session through `beginHeadless(held, prompt, role, worktree, first?)` (line 1630). `worktrees.ts#fileAt` and `#filesAt`, which read a file and a folder's files as a commit holds them. `trail/refusals.md`, written by `chain.ts#refusalsText`. |
| #46, `seal/threads/1795342001-progress-through-roles/` | merged at `7641741` | `WorkItem.recorded`, an optional field, whose `rounds` counts the round records of the worktree, committed or not. `chain-records.ts#lastVerdict`, which gives the newest verdict's word, its commit and its reason or question, and nothing else of the block. Its *Scope* leaves the findings of each round, the cost of each stage and the refused calls to this work. |
| #42, `seal/threads/1795393338-broad-gate-and-sealer/` | merged at `de2257c` | `seal-records.ts#readGuarantee`, whose `Verdict` holds the block's `target`, `commit`, `base`, `is`, `builtBy`, `judgedBy`, `model` and `rules`, and `#readGate`, whose `Run` holds a run's `commit` and `base`. `chain.ts#CLOSING_RECORDS` and `#closingRecord`. The gate's ledger entry, added in `daemon.ts#runGate` (line 2609) with `usage` null. |
| #43, `seal/threads/1795395059-pull-request-and-seal-check/` | merged at `70504e2` | `github.ts#bodyRecords`, which reads what a body is composed from at the head commit, and `#pullRequestBody`, which composes a new pull request's body: the seal section, then the free parts `## What changed`, `## Review rounds`, `## Broad gate` and `## Decided without asking`. `#withSealSection`, which at an edit replaces the lines between `<!-- owlery:seal -->` and `<!-- /owlery:seal -->` and no other line. `#markerOf`, the one rule by which the daemon and the check read a marker line. `daemon.ts#runPullRequest` (line 2679), which calls them. The body arm of the check, which reads the seal section alone (`pr-check/skills/code-review/scripts/chain_check.py#marker_of` and the comment above `SECTION_OPEN`). |
| #44, `seal/threads/1795396351-seal-breaks-after-a-commit/` | merged at `3868fa8` | `WorkItem.seal`, an optional `Seal` with `state`, `commit` and `why`. `seal-state.ts#sealAt` and `#workItemSeal`, which read the state from the head commit. A broken seal's sentence names the first differing path, the step the order owes, or that the branch no longer holds the sealed commit, and never a commit that broke it. `src/renderer/shared.ts#sealPlace(where, seal)` and `view.ts#sealShown`, which gives the words "Sealed at", "Seal broken, sealed at" and "No seal yet". `work-item-view.ts#showSeal`, which draws the large seal, its words and a broken seal's sentence at the foot of the view's right column. The views `finished` and `broken` of the screenshot run. |
| #22, `seal/threads/1795397381-summary-of-seals/` | merged at `2737ceb`, read at `90184d5` | A work item carries no `seal` where the daemon holds no reading of its branch (`daemon.ts#workItemOf`, line 1871, and the comment of the field `seal` of `protocol.ts#WorkItem`): one whose branch the daemon has not read since it started, one with no base commit recorded, and one whose branch is gone. The daemon reads no archived work item's branch, so after a start of the daemon an archived work item carries none either. Null says that the daemon read the head commit and found no seal there. A hello waits for that read for `readyWaitMs`, 500 ms where the option is absent (`daemon.ts#greet`, line 696), so a `ready` can go out with no `seal` for a work item whose next `inbox` carries one. `view.ts#sealShown` (line 529) and `shared.ts#sealPlace` (line 130) take a null and an absent `seal` alike, as no seal. `renderer.ts#takeLists` (line 1215) takes each `inbox`: it lets a seal read after `ready` join the set of work items the summary lists, draws the view again where a view is in front, and draws the summary again where the summary is. A sealed line of the summary says "Sealed at `<commit>` after `<N>` review rounds." from `recorded.rounds` (`view.ts:1242`). The last look keeps each work item's `seal` as the lists carried it, and this work adds no field to `WorkItem`, so it changes nothing of a look. `test/screenshots.ts#VIEWS` holds the view `summary` first and keeps `finished` and `broken`, and the row on the screenshot run in the table below says how the run now comes to its views. Its *Out of scope* leaves "The sealed work item's view of C2: the large seal, the seal's record and the back of the seal" to this work. |

What the tree, the mockups and the probes showed. Each row is labelled as contract rule 4 asks.

| Fact | Label | Coordinate or command |
|---|---|---|
| No code of the tree draws a back of the seal, and no file of the renderer asks for a ledger. | executed | At `cad4a64`: `git grep -n -i -e 'back of the seal' -e 'sealBack' -e 'seal-back' -e 'readSealRecords' -e 'owlery:back' cad4a64 -- apps pr-check` printed nothing. `git grep -n -e 'readLedger' cad4a64 -- apps/desktop/src` printed `daemon.ts:1306` and `protocol.ts:663` and `:687`, and no line of `src/renderer`. Run again with `90184d5` in the place of `cad4a64`, each command printed the same |
| A work item's view is two columns: the stage of panes under a strip of tabs, and a right column of `--facts-width`, 420px, that holds the facts, `shared.ts#detail`, the "Ask" section and the seal's place at its foot. | read | At `cad4a64`: `src/renderer/index.html:49`, `:338`, `:673` and `:681-712`; `src/renderer/work-item-view.ts#showView` (line 1064); `src/renderer/shared.ts#detail` (line 345) |
| The view's foot draws the large seal, 112px, with the words of the seal's state and a broken seal's sentence under them. | read | At `cad4a64`: `src/renderer/index.html:61` and `:136`, `src/renderer/shared.ts#sealPlace` (line 125), `src/renderer/work-item-view.ts:159` and `#showSeal` (line 910), `src/renderer/view.ts#sealShown` (line 529) |
| The strip's tabs are a work item's panes, and the pane in front is a pane's id. `showView` draws the tabs from `view.ts#paneTabs` and takes the pane in front and the panes on the stage from `view.ts#stageOf`, which puts up to four panes on the stage where "Side by side" is pressed. `enterView(workItemId, pane?)` is called from `renderer.ts#openView` alone. | read | At `cad4a64`: `src/renderer/work-item-view.ts:1064-1122`, `src/renderer/view.ts:2153` and `:2189`, `src/renderer/renderer.ts:265` |
| `round-record.ts#Finding` holds its heading and the paths of a `location:` and not their lines, and holds neither the severity nor the close's answer. The `location:` grammar is `path`, `path:line` or `path:first-last`. | read | At `cad4a64`: `src/daemon/round-record.ts`, the interfaces `Finding` and `Close` and `locationPaths`; `src/daemon/record-blocks.ts:344-346`, `PLACE`, and `:368` and `:381`, the `severity:` and `answer:` lines |
| A ledger entry holds its stage's pair and no round. The chain's run holds the stage's kind and its round when it starts a stage, and passes neither on. | read | At `cad4a64`: `src/shared/protocol.ts#LedgerEntry` (line 521); `src/daemon/daemon.ts:1694-1698`, `:2297-2301` and `:2609` |
| A chain runs two kinds of stage as the orchestrator's one pair. `runConvergence` starts a stage of the kind `judgment` and `runRuling` one of the kind `ruling`, both as `chain.ts#ORCHESTRATOR`, the pair of the role `orchestrator` and the stage `judgment`. So the pair of a ledger entry does not tell a ruling from a judgment. The stored stage and a row of `trail/refusals.md` do: `chain.ts#stageCell` writes `round 2`, `fix pass 1`, `judgment 2`, `ruling 2` and `seal 2`, each with the stage's round. A ruling on the question of a sealer's `undecided` verdict runs after the seal, with the last round's number. | read | At `cad4a64`: `src/daemon/daemon.ts:2419` and `:2444`, and the docstring of `runRuling` above it; `src/daemon/chain.ts:605` and `:799-802` |
| The pull request stage writes no entry of the ledger. | read | At `cad4a64`: `src/daemon/daemon.ts#runPullRequest`, lines 2679-2746, which holds no call of `Ledger#add` |
| A new pull request's body is composed whole, and an edit replaces the seal section alone. Where the body would pass `BODY_LIMIT`, 65,536 UTF-16 code units, the free parts are replaced, the last first, by a line that names each part's record. A free part whose text holds a marker line is replaced whatever the body's length. An edit composes no part again and checks no limit. | read | At `cad4a64`: `src/daemon/github.ts:39`, `#pullRequestBody` (line 459), `#withSealSection` (line 488); `src/daemon/daemon.ts:2706-2726` |
| The cases of the body's functions stand in `test/pull-request.test.ts`. The cases of the pull request stage, which drive a chain through the fake adapter and the stand-in for `gh` of `test/chain-run.ts#ghStandIn`, stand in `test/chain.test.ts` under "the pull request stage of a work item's chain", and one in `test/pr-check.test.ts`. | read | At `cad4a64`: `test/pull-request.test.ts:205-312`, `test/chain.test.ts:2937`, `test/pr-check.test.ts:336-346` |
| The screenshot run captures eight views: `summary`, `inbox`, `view`, `parked`, `finished`, `broken`, `menu` and `dialog`. The finished work item is sealed by a chain the stand-in for the CLI answers, of one round with no finding, and the run pins that chain's stages. The broken one's records are committed by `test/chain-run.ts#commitSeal`, with no chain. Before any chain runs, a second client of the daemon sends `looked`, and the page's own `looked` is held back from then on. Once the scene stands the page loads again and opens on the summary, whose wait reads the summary's sentence, "1 sealed, 1 seal broken", and the seals of its two leading lines, and reads neither a count of rounds nor a chain's stages. Each of the views `finished` and `broken` is then opened by a press of the work item's line in the sidebar, and its wait reads the foot of the right column. | read, and executed for what the summary's wait does not read | At `90184d5`: `test/screenshots.ts:11`; `test/screenshots.test.ts:361-364`, the summary's wait, `:383-394`, the two views, `:478-486`, the look, `:508-524`, the finished work item's chain with its pin at `:521-522`, `:526-534`, the broken one's records, and `:556-560`, the page loaded again. `sed -n '363p' apps/desktop/test/screenshots.test.ts` piped to `grep -o -E 'rounds?\|stages'` printed nothing |
| The first commit on a branch's own line that changes a path that is no closing record is what `git log --first-parent --reverse` prints first, with one `:(exclude)` pathspec for each closing record. It prints nothing where only closing records follow the sealed commit. It names a commit that changes a source file and a closing record together. For a merge of the base it names the merge commit, and without `--first-parent` it names the base's own commits before it. `git merge-base --is-ancestor` exits 1 where the sealed commit is no ancestor of the head. | executed | Two probes in a temporary repository under the scratch directory, `test_tmp_breaking_commit.sh` and `test_tmp_breaking_merge.sh`, git 2.50.1, 2026-11-23. The first probe stopped at an error of its own script after its second case, and the second probe ran the two cases it left |
| The owner's mockup of a sealed work item sets the large seal and the seal's record (tree, base, gate, rounds, judged by) beside "The back of the seal": one sentence that counts the defects caught and fixed, then each finding with its round, its symptom, its `path:line` and "fixed in `<commit>`", and a round that found nothing said in one sentence. It shows no cost. | read | `etcs/design/inbox-first-mockups/project/C-WorkItem.dc.html`, ignored by git |
| The owner's later mockups keep the layout of a stage and a right column and change the finish alone. The study that compared the three directions recommends taking from the sealed mockup the large seal with the seal's record and the back side by side. | read | `etcs/design/polish-mockups/README.md` and `etcs/research/ux.md`, its recommendation, both ignored by git |
| The heading `## Review rounds` stands on one line of `apps/desktop/src`, in the part *Scope* item 23 takes out. Three lines of the tests name it. | executed | At `cad4a64`: `git grep -n -e '## Review rounds' cad4a64 -- apps/desktop/src` printed `apps/desktop/src/daemon/github.ts:465` alone. `git grep -n -e 'Review rounds' cad4a64 -- apps/desktop/test` printed `pull-request.test.ts:198` and `:267` and `pr-check.test.ts:343`. Run again with `90184d5` in the place of `cad4a64`, each command printed the same |
| The issue's comment of 2026-11-22 adds three things the approval line leaves to the back: the cost so far of a chain stopped before its seal, the count of findings per round with its trend, and the refused calls per stage. It changes nothing else of the request. | executed | `gh issue view 47 --json title,body,comments`, 2026-11-23 |
| The issue's comment of 2026-11-23 defers here finding 1 of round 3 of #43's review: the body's case of `test/pull-request.test.ts` pins "no other character" for `pullRequestBody`'s `marked` with U+0085 alone, which JavaScript's `trim` keeps too, so a `marked` that reads `line.trim()` passes every case of the file. It asks for U+FEFF beside U+0085 in that case. The round record holds the snippet and how it was seen red, and its close reads `deferred #47`. The case stands at `test/pull-request.test.ts:242-256`, and its expected body holds the part `## Review rounds`, which this work takes out, so this work's build edits that case. | executed, and read | `gh issue view 47 --repo MichaelYcJo/owlery --json title,body,comments`, 2026-11-24; `seal/threads/1795395059-pull-request-and-seal-check/trail/rounds/round-3.md:13-44`; `test/pull-request.test.ts:242-256` at `cad4a64` |
| `seal/follow-up.md` does not exist, and the release note of 0.0.1 holds no `### Process changes` table. | executed | `ls seal`; `gh release view --json body --jq .body` |
| `routing.md` of this work item stands, with `Planning` `framer`. | read | `seal/threads/1795400730-seal-back/routing.md` |
| An archived work item has no view, so no back is drawn for one. The daemon still answers a `readSealRecords` that names one (*Scope* item 9). | read | At `90184d5`: `src/renderer/list.ts:92` and `:158-159`, where a press of an archived line restores or selects and opens no view; `src/renderer/renderer.ts:333-336`, the docstring on a list's keys, and `:362` |
| Between `cad4a64` and `90184d5`, #22's merge changed these of the files this frame names: `src/daemon/daemon.ts`, `src/shared/protocol.ts`, `src/renderer/renderer.ts`, `src/renderer/shared.ts`, `src/renderer/view.ts`, `test/chain.test.ts`, `test/daemon.test.ts`, `test/view.test.ts`, `test/screenshots.ts` and `test/screenshots.test.ts`. It changed no file of `docs/` and none of `pr-check/`, and every other file this frame names is as `cad4a64` holds it. Of the coordinates this frame dates to `cad4a64`, these moved: `shared.ts#sealPlace` to line 130 and `#detail` to line 350; `view.ts#paneTabs` to line 2282 and `#stageOf` to line 2318; `renderer.ts#openView`, which calls `enterView`, to line 266; the cases of the pull request stage in `test/chain.test.ts` to line 2941; and the lines of `test/screenshots.test.ts`, which the row on the screenshot run gives at `90184d5`. No line this frame names in `daemon.ts` or in `protocol.ts` moved: the merge changed `daemon.ts` at lines 1870 and 1883, one line for one, and after line 3026, and `protocol.ts` at line 292, one line for one. | executed | `git diff --stat cad4a64 90184d5 -- apps docs pr-check`, `git diff cad4a64 90184d5` on the files named, and `grep -n` for each name in the tree at `90184d5` |

This work item's subject is the code, so its rules are stated in *Rule changes* for the settle. `docs/design.md` and `docs/design.ko.md` are the exception that #44 and #46 already took: a form is written there in the pull request that first draws it (*Scope* item 17).

## Scope

### The ledger names the chain's stage

1. **A ledger entry names the chain's stage it is for, by its kind and its round.** `LedgerEntry` gains `chain: { kind: ChainStageKind; round: number } | null`. For a stage a chain started it holds the stage's `ChainStage.kind` and `ChainStage.round`: the round a round is, the round a fix pass answers, the round a judgment or a ruling follows, and the last round recorded for the gate and the seal. It is null for a session no chain started. The kind stands beside the round because the entry's pair does not tell a ruling from a judgment (*Grounding*, the row on the orchestrator's one pair). `Ledger`'s reader takes a line with no `chain` as an entry whose `chain` is null, so a line written by a build before this work is still read.
2. **The chain's run hands the stage to the entry.** `daemon.ts#beginHeadless` takes the kind and the round where `runStage` calls it and null where the `ask` case does. The daemon keeps them on its `HeadlessSession`, beside the `repo` and the `branch` it keeps for the entry, and `enter` writes them. The gate's call of `Ledger#add` in `daemon.ts#runGate` passes the kind `gate` and the round `runGate` is given. The pull request stage writes no entry, and this work adds none.

### The records the back reads

3. **The round record's reader gives what the back shows of a finding.** `round-record.ts#Finding` gains `severity`, the value of its `severity:` line, and `places`, each place of its `location:` line as a path and the line or the span of lines the record writes after the colon, or null where it writes none. `#Close` gains `answer`, the value of its `answer:` line, or null. `heading` and `located` stay, since the chain and the body read them. The reader refuses nothing it did not refuse before.
4. **One module reads the back's records at the branch's head commit.** A new module, `src/daemon/seal-back-records.ts`, takes a worktree, the work item's directory, the branch's head and the work item's seal, and answers a `SealRecords` (*Data & interfaces*). The worktree gives one thing, the place of the directory, which `decision-record.ts#workItemDirectory` finds, as `seal-state.ts` finds it. Every record is then read with `worktrees.ts#fileAt` and `#filesAt` at the head, and no record of the worktree is read, so the back says what the committed records say. It reads through the readers that stand: `round-record.ts#readRoundRecord` for each round record, `seal-records.ts#readGuarantee` for the verdict blocks and `seal-records.ts#readGate` for the gate's runs. It stores nothing.
5. **The seal's record is read from the newest verdict block where that block is a seal.** Its fields are read from what `readGuarantee` gives of that block and from the records beside it: the sealed commit and the base from the `Verdict`'s `commit` and `base`, the branch from the `Branch` row of `routing.md` (`decision-record.ts#declaredBranch`), the item from the directory's name, the gate from the commit of the newest `Run` that `readGate` gives of `trail/gate.md`, the count of rounds from the round records the sealed commit holds, and who built, who judged, the model and the rules from the `Verdict`'s `builtBy`, `judgedBy`, `model` and `rules`. A line the block does not hold is null. Where the newest verdict block is no seal, where no guarantee stands, and where the reader refuses a line of the guarantee, the record is null, as `chain-records.ts#lastVerdict` reads the same file for the seal's state.
6. **A round record with a refused line still gives its other findings.** The answer holds the findings the reader returns and the count of the lines it refused, which is the length of `RoundRecord.refusals`. The back says that count under the round, and decides nothing on a refused line.
7. **A broken seal's answer names the commit that broke it.** Where the work item's `seal.state` is `broken` and the head holds the sealed commit (`worktrees.ts#holdsCommit`), the module runs `git log --first-parent --reverse` from the sealed commit to the head, with one excluding pathspec for each file of `chain.ts#CLOSING_RECORDS` in the work item's directory, and takes the first commit printed: its id and its subject. That is the oldest commit on the branch's own line that changes a path that is no closing record, and a merge of the base is named by its merge commit (*Grounding*, the probes). Where the command prints nothing, where the head does not hold the sealed commit, and where the repository holds no commit of the name the seal gives, no commit is named, and the back shows the seal's own sentence, which `seal-state.ts#sealAt` writes for each of the three.
8. **The refused calls are read from `trail/refusals.md`.** `chain.ts` gains a reader beside `refusalsText`, for the table that function writes, of the columns `Stage`, `Role`, `Tool`, `What the call does` and `Rule`: each row's stage, as `chain.ts#stageCell` writes it, `round 2`, `fix pass 1`, `judgment 2`, `ruling 2` or `seal 2`, and its rule's name, a `role-grants.ts#RefusalRule`. A row whose stage or rule is not one the writer writes is counted as not read and gives nothing.
9. **A client asks for the records with one message.** `readSealRecords` names a work item, and the daemon answers `sealRecords`. An archived work item is answered as any other. A work item whose worktree holds no directory of its own, or two (`workItemDirectory` gives null), is answered with the empty value: no record, no round. An id the daemon lists no work item under, and a branch whose head the daemon cannot read, are answered with an `error`, as `readLedger` answers the first. The seal the module is given is the one `seal-state.ts#workItemSeal` gives at that head. The ledger is asked for with #45's `readLedger`, which this work leaves as it is.

### One composition, for the window and for the pull request

10. **One module composes the back from the two readings.** A new module, `src/shared/seal-back.ts`, holds one function that takes a `SealRecords`, the ledger's entries and its count of unread lines, and gives the back as plain values: the seal's record as rows of a label and a value, the sentences at its head, one part for each round, the stages after the rounds, the sessions outside the chain, and the sums. It reads no file and no clock, and imports nothing of the daemon or the renderer. The window draws what it gives, and `github.ts` writes the same values as Markdown, so the window and the pull request show the same numbers from one sum.
11. **An entry is set beside its round by its `chain`.** A part of round `N` holds the entries whose `chain.round` is `N` and whose `chain.kind` is `round`, `fix-pass`, `judgment` or `ruling`, each as one line in the order the ledger gives. The entries of the kinds `gate` and `seal` follow the rounds, each as a line. A ruling whose entry the ledger holds after an entry of the kind `seal` of the same round is a ruling on the sealer's question, and its line follows that sealer's line and stands in no round's part. A stage that ran twice has two lines. A stage is named from its `chain.kind`, by a table typed over `CHAIN_STAGE_KINDS`, so a kind with no name does not compile. An entry whose `chain` is null is a session outside the chain, whatever its pair: those are counted and summed in one line of their own and enter no round and no sum of the chain.
12. **A round's part says what the round read, what it found and what became of each finding.** It holds the round's number, the commit its `target:` names, and one line for each finding: its number, its symptom, its severity, each place as `path:line`, and its close, which is "fixed in `<commit>`", "rejected" or "deferred to `<home>`", or "open" where it has none. A finding that carries `reopens:` or `regression:` says which earlier finding or round it names. A round with no finding says so in one sentence, which names the earlier findings it confirmed where it confirmed any.
13. **The head counts the defects by one rule.** A defect caught and fixed is a finding whose close is `fixed` and that no later finding names with `reopens:`. So a finding that was closed, reopened and closed again is one defect. The head says that count, then the counts of the findings that are rejected, deferred and open where any is, then the count of findings of each round in order, as "3, 1, 0". Where the rounds hold no finding, the head says that the review rounds caught nothing. `frame/questions.md` Q3 holds the rule as a person's choice.
14. **A sum never adds a converted cost to a charged one, and says what it could not count.** The chain's sum adds the `usage.costUsd` of the chain's entries, the converted ones and the charged ones apart, and each sum carries its word. It counts the entries whose usage is null as stages that reported no cost, the gate apart, since the gate is no agent's turn. Each stage's line shows its own cost with the word "converted" where `usage.converted` is true, the tokens its models used, summed over the models, the time from its start to its end, and how it ended where it did not finish by itself. The back holds one sentence that says what a converted cost is.
15. **The back is composed for a work item with no seal too.** Where the record is null, the back holds the rounds recorded and the stages entered so far, with their sum, under the words "No seal yet", which `view.ts#sealShown` gives. So a chain that stopped before its seal shows what it has cost, as the issue's comment of 2026-11-22 asks.

### The window

16. **The back stands on the stage, behind a tab of its own.** The strip of tabs of a work item's view gains one tab, "Back of the seal", before the panes' tabs, for a work item whose `seal` holds a seal, sealed or broken, whose `recorded` counts a round, or whose `chain` is not null. A `seal` that is null, and a work item that carries no `seal` because the daemon holds no reading of its branch (*Grounding*, the row of #22), are read alike in this item and in item 18: neither holds a seal, so such a work item has the tab only by its `recorded` or its `chain`. The tab has no close mark. Where it is in front, the stage shows the back and no pane, on the window's own ground and in the window's inks, whether or not "Side by side" is pressed, and no pane is the pane in front. The back holds, from its top: the large seal, drawn by `shared.ts#sealPlace("view", seal)` from the work item's `seal` as the lists carry it, which is the one the foot draws, with the words `view.ts#sealShown` gives for the seal's state, and both functions draw an absent `seal` as no seal; the seal's record; the head's sentences; each round's part; the gate's and the sealer's lines; the sums; the line of the sessions outside the chain; and the refused calls, as one line for each stage that was refused a call, with the count for each rule. The foot of the right column keeps its own seal's place (`work-item-view.ts#showSeal`), which draws the same seal at the same size, so while the back is in front the view shows the seal twice. `frame/questions.md` Q5 leaves to phase 3, which sees both drawn, whether the back keeps its drawing. `frame/questions.md` Q2 holds the back's place as a person's choice.
17. **`docs/design.md` and `docs/design.ko.md` state the forms before the window draws them, in this pull request.** *Components and their states* gains the back's tab in the row "A pane's tab", and the row "A row of a list of records" gains a finding of a round and a stage of the chain. A new row, "The back of the seal", states the order of its parts, the inks of a cost, of the word "converted", of a stage that failed and of a finding that is open, and that nothing of the back is red but the seal. A measure the back needs stands in the page's `:root` and in *The layout's measures*. `frame/plan.md` *Alternatives considered* holds why these two files change here and not at the settle.
18. **A sealed work item opens to the back.** `work-item-view.ts#enterView(workItemId, pane?)` puts the back's tab in front where it is called with no pane and the work item's `seal` holds a seal, sealed or broken, in the lists the window holds at that call. Where it is called with a pane, as from a notification of a session, that pane is in front, as today. A tab the person chose stays in front while the view stays. The tab in front is decided at that call and by a person's press, and by no later `inbox`: where a `ready` went out before the daemon read the branch, the `seal` a later `inbox` carries can add the tab to the strip and changes what the back shows, and it moves no tab in front, so a person who reads a pane does not lose it to a message of the daemon. No document decides this, and it follows the sentence before it: for a work item whose branch the daemon reads, a `ready` goes out without the `seal` only where the hello's read took longer than `readyWaitMs` (*Grounding*, the row of #22).
19. **The window asks when the back comes in front and lets go when it leaves.** It sends `readSealRecords` and `readLedger` together, draws the back when both have answered, and shows one sentence in the back's place until then and where either was refused. It asks again where the work item's `seal`, `recorded` or `chain` in a later `inbox` differs from the one it asked at, and a `seal` that was absent and now holds a reading, a null among them, differs. `renderer.ts#takeLists` draws the view again at each `inbox` while a view is in front (`showView`), which is where the window compares the three. It drops both answers when another tab comes in front and when the view is left. No answer is kept for a work item whose back is not in front.
20. **A broken seal's back stays whole and says which commit broke it.** The seal is drawn broken, as #44 draws it. Under the state's words stands the seal's sentence, its `why`, and where a commit is named, a line "Broken by `<commit>`" with the commit's subject. The record, the rounds and the costs are those the head commit holds, a round recorded after the break among them.
21. **The pull request carries the screenshots, and the run's views of a sealed work item and of a broken one show the back.** The run gains no view. Its views `finished` and `broken` open a sealed work item and a broken one by a press of the work item's line, after the page has loaded again on the summary and holds both seals in its lists (*Grounding*, the row on the screenshot run), so with item 18 each shows the back in front, beside the foot that #44's shots show and that the two views' waits read. The finished work item's chain, which the stand-in for the CLI answers, gains a finding: its first round leaves one finding, a fix pass closes it as `fixed`, and its second round leaves none and confirms the fix. The stand-in's results are made to report a usage where they report none, so that the daemon's ledger holds an entry with a converted cost for each stage of that chain. The run's pin of that chain's stages (`test/screenshots.test.ts:521-522` at `90184d5`) changes with it. The summary's shot, which the run takes first, then says the finished work item's line with two review rounds and with the commits of the second round and the fix pass, and the summary's wait reads neither (*Grounding*, the same row), so it stands as #22 left it. The broken work item's records stay as `test/chain-run.ts#commitSeal` commits them, one round with no finding and no chain, so its back shows rounds that caught nothing, no stage, and the commit that broke the seal. The views `view` and `parked` open work items whose `chain` is not null, so by item 16 their strips gain the back's tab, behind the pane in front. The crafter runs `pnpm run screenshots` in `apps/desktop` and commits, under this work item's `screenshots/`, the files of the views whose drawing this work changes: `finished`, `broken`, `view` and `parked`. The summary's files are not committed, since this work changes the scene the summary says and none of the summary's code, as #22's build left the inbox's files out for the same reason (`seal/threads/1795397381-summary-of-seals/trail/phases/phase-3.md`, the decision on the committed screenshots).

### The pull request's body

22. **The body carries the back in a section of its own, which the daemon rewrites with the seal section.** `github.ts#pullRequestBody` writes the back below the seal section, between the marker lines `<!-- owlery:back -->` and `<!-- /owlery:back -->`, under the heading `## The back of the seal`. It holds what item 10 gives, as Markdown: the head's sentences, one list for each round with a line for each finding, one table of the stages with the columns of item 14, the sums, and the sentence that says what a converted cost is. It holds no large seal and no seal record, which the seal section above it carries. At an edit of an open pull request, where `daemon.ts#runPullRequest` calls `github.ts#withSealSection` today, the daemon replaces the back's section as it replaces the seal section, and puts it after the seal section where the body holds none. A body with more than one opening or closing marker of the back, or with no closing marker after its opening one, fails the stage with a sentence that says so, as a body with such markers of the seal does. `runPullRequest` reads the ledger through `Ledger#read`, with the work item's `createdAt` as `readLedger` reads it, at the time it composes, and commits nothing.
23. **The free part `## Review rounds` goes.** `pullRequestBody` lists each round's findings in a free part, which no edit rewrites, so a later seal would leave it behind the back's section, with the same lines said twice. The back's section holds them. `BodyRecords.rounds`, and the reading of the round records in `bodyRecords` that fills it, go with the part. `## Removes` names them.
24. **At the body's limit the back's findings give way before its numbers.** Where a new body would pass `github.ts#BODY_LIMIT`, the free parts below the back go first, the last first, each replaced by the line that names its record, as `pullRequestBody` replaces them today. Then each round's list of findings is replaced by one line that names `trail/rounds/`. The table of the stages and the sums stay, since no committed record holds a cost. At an edit the daemon composes no free part again, so where the body with its new back would pass the limit, the back's findings give way by the same rule, and no line a person wrote is cut. The seal section is never cut.
25. **The check reads none of it.** The body arm reads the seal section alone: `chain_check.py#marker_of` knows the seal's two marker lines and no other, and no arm reads another line of the body. No line of `pr-check/` changes in this work.
26. **The changelog says what ships, and the earlier bullets are made true.** This work writes its `changelog.md`. The bullet "The body opens with the seal." of `seal/threads/1795395059-pull-request-and-seal-check/changelog.md` says that each review round's findings stand below the seal section among the parts that give way, and the bullet "Nothing in the window shows a cost yet." of `seal/threads/1795341001-cost-per-stage/changelog.md` says what its name says. The crafter rewrites both in this pull request.
27. **One rule reads every marker line, and its case tells the rule from `trim`.** The back's two marker lines are read by the rule `github.ts#markerOf` holds for the seal's: a line is a marker line where it is the marker once the spaces and tabs at its ends are taken off, and no other character is taken off. `pullRequestBody`'s `marked` reads the back's markers too, so a free part whose text holds a marker line of either section gives way to the line that names its record whatever the body's length, and the body holds each marker once. No line the composition writes into the back's section is a marker line, since each opens with `#`, `-` or `|` or is a sentence of the composition's own. The body's case of `test/pull-request.test.ts` (line 242), which this work edits because its expected body holds the part item 23 takes out, pins "no other character" with U+0085 and with U+FEFF, for a marker of the seal and for one of the back. U+0085 is white space to Python's `str.strip` and U+FEFF to JavaScript's `trim`, and the rule takes off neither. This is the case the issue's comment of 2026-11-23 asks for. It is seen red as round 3 of #43's review saw its snippet red: with `marked` reading `line.trim()`, at the U+FEFF iteration.

### Out of scope

- **Opening a finding's file at its line, and the diff of the commit that fixed it.** `docs/product.md` *File explorer and editor* gives them to the editor, and `docs/roadmap.md` *Milestones* row 4 and *Open decisions*, the row "The light editor", hold it. The back shows the place and the commit as text a person can select.
- **Publishing or exporting the ledger.** Issue #76, and `docs/roadmap.md` *Open decisions*, the row "Where the public ledger lives".
- **The cost of a stage that was stopped, a budget cap, and a cost Claude Code could not price.** Issue #141. A stopped stage's line says that it reported no cost.
- **The comparison of a converted cost with a bill.** Issue #140.
- **Reading the refused calls across work items.** Issue #136, as the issue's comment says.
- **The summary's sentence, and the approval line.** #22 and #46.
- **The framer's and the crafter's build stages.** Issue #56 adds them in milestone 3. Until then no chain starts one, and `CHAIN_STAGE_KINDS` holds no kind for one.
- **A view of the screenshot run for the back alone.** The views `finished` and `broken` show it (*Scope* item 21), so the sentences of `docs/design.md` that list the run's views and count its files do not change in this work.
- **A chart of the trend.** The counts of each round stand in one sentence. `docs/design.md` *Principles* 6 spends no memory on the window's look.
- **The back in the inbox's preview and on the phone.**
- **A cost in a committed record.** `docs/architecture.md` *State lives in three places* keeps the ledger with the daemon (`frame/plan.md` *Alternatives considered*).
- **A real chain.** No case and no probe of this work starts a real `claude`. `frame/questions.md` Q4 holds what the first real chain measures.
- **The version.** The first pull request of `release/v0.0.2` moved it.

### Where each line of the issue's *Done when* lands

| The issue's line | Scope items |
|---|---|
| A sealed work item opens to the back of its seal: the defects each review round caught and the fix pass that fixed each, at file and line level, beside the cost of each stage | 3, 10, 11, 12, 14, 16 and 18 |
| The defects are read from the committed round records and the costs from the daemon's ledger, and a cost under a subscription login carries its "converted" label | 1, 2, 4, 9 and 14 |
| A work item whose rounds caught nothing shows that plainly, with its cost | 12 and 13, and scenario 5 |
| The seal's record (tree, base, item, gate, rounds, and who judged) is shown with the back | 5 and 16 |
| The back of a broken seal stays readable and says which commit broke it | 7 and 20 |
| The pull request body carries the same numbers for a person without the app, or the issue records why they stay in the app | 10, 22, 23 and 24. `frame/questions.md` Q1 holds the choice |
| The issue's comment of 2026-11-22: the cost so far of a chain stopped before its seal, the count of findings per round, and the refused calls per stage | 15, 13, and 8 with 16 |
| The issue's comment of 2026-11-23: U+FEFF beside U+0085 in the body's case of `test/pull-request.test.ts` | 27, and scenario 22 |

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. An entry names its chain's stage | Given a chain through the fake adapter, which reports no usage since `chain` reads none (phase 1), that runs round 1, a fix pass, round 2, the gate and the seal. Then `readLedger` answers five entries whose `chain` names `round` 1, `fix-pass` 1, `round` 2, `gate` 2 and `seal` 2. Given a chain whose stage asks a question. Then the entry of the orchestrator's ruling names `ruling` and the round. Given an `ask` with no chain, with a role and without one. Then each entry's `chain` is null. | Cases of `test/chain.test.ts`, where the cases of a chain's run and of the gate's entry stand, and of `test/daemon.test.ts` for the `ask` |
| 2. An earlier build's line is read | Given a `ledger.jsonl` whose line holds every field of an entry but `chain`. Then `read` gives the entry with `chain` null and `unread` 0. Given a line whose `chain` holds a kind that is none of `CHAIN_STAGE_KINDS`. Then the line is counted as unread. | Cases of `test/ledger.test.ts` |
| 3. A finding's place keeps its line | Given a round record whose finding names `` `src/a.ts:12`, `src/b.ts:3-9`, `src/c.ts` `` and whose close holds an `answer:`. Then the reader gives three places with the lines `12`, `3-9` and null, the severity and the answer, and the same refusals as before for the records of `test/round-record.test.ts`. | Cases of `test/round-record.test.ts` |
| 4. The records are read at the head | Given a temporary repository whose branch holds two committed round records and a guarantee, and a third round record written in the worktree and not committed. Then the answer holds two rounds. | A case of `test/seal-back-records.test.ts` |
| 5. Rounds that caught nothing | Given one round record with no finding and one ledger entry for its round. Then the composition's head says that the review rounds caught nothing, the round's part says so, and the sum is that entry's cost. | A case of `test/seal-back.test.ts` |
| 6. A defect reopened is one defect | Given round 1 with a finding closed `fixed`, round 2 with a finding that `reopens:` it, closed `fixed`, and round 3 that confirms it. Then the head counts one defect caught and fixed, and the counts by round are 1, 1, 0. | A case of `test/seal-back.test.ts` |
| 7. A converted cost is never added to a charged one | Given two entries, one with `converted` true and one false. Then the composition gives two sums, each with its word, and each stage's line carries its own. | A case of `test/seal-back.test.ts` |
| 8. A stage with no usage is counted | Given a fix pass stopped at its limit, with `usage` null, and a gate's entry. Then the fix pass's line says how it ended and that it reported no cost, the chain's sum counts one stage that reported none, and the gate is not counted among them. | A case of `test/seal-back.test.ts` |
| 9. A session outside the chain enters no round | Given an entry whose stage is null and one whose stage is the proofer's pair, each with `chain` null. Then no round's part holds either, and one line counts two sessions with their cost. | A case of `test/seal-back.test.ts` |
| 10. The seal's record | Given a guarantee whose newest verdict block is a seal with the daemon's lines, a gate record and three round records at the sealed commit. Then the record holds the commit, the branch, the base, the item, the gate, 3 rounds, who built, who judged, the model and the rules. Given a newest block that reads `withheld`. Then the record is null and the rounds are still given. | Cases of `test/seal-back-records.test.ts` |
| 11. The commit that broke a seal | Given the histories of the probes: closing records alone after the sealed commit, a commit that changes a source file, a merge of the base, and a head the sealed commit is no ancestor of. Then the answer names no commit, that commit, the merge commit, and no commit. | Cases of `test/seal-back-records.test.ts` |
| 12. The refused calls | Given a `trail/refusals.md` that `chain.ts#refusalsText` wrote, with two rows of `round 1`, one of `ruling 1` and one of `seal 1`, one row more whose stage reads otherwise, and one whose rule reads otherwise. Then the answer gives the readable rows and counts the two as not read (phase 2). | A case of `test/seal-back-records.test.ts` |
| 13. The daemon answers | Given a work item with a directory. Then `readSealRecords` answers `sealRecords`. Given a work item with none. Then the answer is the empty value. Given an id the daemon does not list. Then the answer is an `error`. | Cases of `test/daemon.test.ts` |
| 14. A sealed work item opens to its back | Given the built app on a scene with a sealed work item, a broken one and one with no chain. When the person opens the sealed one, once its line in the sidebar shows its seal. Then the back's tab is in front and the back shows the record, a finding with its `path:line` and "fixed in", and a stage's cost with "converted". When the person opens the broken one. Then the back names the commit that broke the seal. Then the third work item's view holds no such tab. | One case of `test/seal-back-view.test.ts`, with one start of the built app through `BuiltApp.start` |
| 15. The back holds nothing while it is not in front | Given the same start. When the person brings a pane's tab in front. Then the window holds no answer of the back, and bringing the back in front again sends the two messages again. | The same case, which counts the messages the daemon received |
| 16. The body carries the same numbers | Given a sealed chain through the fake adapter, told to report a usage, and the stand-in for `gh` of `test/chain-run.ts#ghStandIn`. Then the body the stage hands to `gh pr create` holds one section between the back's markers, below the seal section, and each sum in it is the text the composition gives for the same records and entries. Then the check passes that body. | A case of `test/chain.test.ts`, under "the pull request stage of a work item's chain", and the case of `test/pr-check.test.ts` (line 336) that runs the check on the stage's body |
| 17. An edit rewrites the back | Given a body that holds the seal section, the back's section and a line a person wrote under them. When the two sections are replaced. Then the back's section is the new one, and the person's line stands. Given a body with no back's section. Then the section stands after the seal section. Given a body with two opening markers of the back. Then the replacing is refused with a sentence that says so. Given an open pull request and a new seal after one more round. Then the stage hands `gh pr edit` a body whose back holds the new round. | Cases of `test/pull-request.test.ts` for the replacing, and a case of `test/chain.test.ts` for the stage |
| 18. No part says the rounds twice | Given the built tree. Then no file of `apps/desktop/src` holds the heading `## Review rounds`. | `git grep -n -e '## Review rounds' -- apps/desktop/src` prints nothing. Run at `cad4a64`: it printed `apps/desktop/src/daemon/github.ts:465` alone (executed, *Grounding*), the line of the part that *Scope* item 23 and the first row of `## Removes` take out. The pathspec holds no file of this work item's directory. The search can fail: a build that leaves the part prints that line. |
| 19. The body at its limit | Given records whose findings push a new body past the limit. Then the free parts are each the line that names their record, each round's list is one line that names `trail/rounds/`, and the table of the stages and the sums stand whole. Given an edit whose new back pushes the body past the limit. Then the findings give way and the person's lines stand. | Cases of `test/pull-request.test.ts` |
| 20. The screenshots | Given the scene of item 21. Then the run's files of the views `finished` and `broken` show the back in front: the first with a finding at its file and line, a round that caught nothing and each stage's cost, the second with the commit that broke the seal. | `pnpm run screenshots`, whose waits for those two views read the back's tab as the one in front, and the review reads the files against `docs/design.md` |
| 21. A ruling is named apart from a judgment | Given two entries of the orchestrator's pair in round 2, one whose `chain.kind` is `judgment` and one `ruling`, and a third of the kind `ruling` that the ledger holds after the sealer's entry. Then round 2's part names "Judgment after round 2" and "Ruling after round 2", and the third line follows the sealer's line. | A case of `test/seal-back.test.ts` |
| 22. A marker after any other character is no marker line | Given a changelog that holds a line of U+0085 and the seal's closing marker, then one of U+FEFF and that marker, then the same two before the back's closing marker. Then each body holds the changelog whole. Given a changelog that holds a marker of the back with spaces and tabs around it. Then the part gives way to the line that names its record. | The body's case of `test/pull-request.test.ts`, seen red with `marked` reading `line.trim()`, at its U+FEFF iteration |

## Data & interfaces

**`src/shared/protocol.ts`.** No field names a vendor.

- `LedgerEntry` gains `chain: { kind: ChainStageKind; round: number } | null`.
- New, the records' side of the back. A string is cut at 2,000 characters.

```ts
/** One place a finding names: a path from the repository's top, and the line or the span of lines its record writes after the colon, or null. */
export interface FindingPlace {
  path: string;
  lines: string | null;
}

/** A finding of a review round, as its committed record holds it. */
export interface BackFinding {
  number: number;
  /** The words of the finding's heading after its number. */
  says: string;
  severity: string;
  places: FindingPlace[];
  /** The fix pass's close, or null where the finding is open. */
  close: { verdict: "fixed" | "rejected" | "deferred"; commit: string | null; home: string | null; answer: string | null } | null;
  /** The earlier finding this one reopens, and the earlier finding or round it is a regression of. */
  reopens: { round: number; finding: number } | null;
  regression: { round: number; finding: number | null } | null;
}

/** One review round, as its committed record holds it. */
export interface BackRound {
  round: number;
  /** The commit the round block's `target:` names, `round-record.ts#Target.commit`, or null where the record holds no round block the reader returns. */
  target: string | null;
  findings: BackFinding[];
  /** The earlier findings this round confirmed. */
  confirms: { round: number; finding: number }[];
  /** How many lines of the record the reader refused. */
  unread: number;
}

/** The seal's record: the fields of `docs/product.md` *The seal*, with who built and who judged. */
export interface SealRecord {
  commit: string;
  branch: string | null;
  base: string;
  item: string;
  gate: string | null;
  rounds: number;
  builtBy: string[];
  judgedBy: string | null;
  model: string | null;
  rules: string | null;
}

/** What the committed records of a work item say for the back of its seal, read at the branch's head commit. */
export interface SealRecords {
  /** The head commit the records were read at. */
  head: string;
  /** The seal's record, or null where the newest verdict block is no seal. */
  record: SealRecord | null;
  /** The commit that broke the seal, or null where the seal is not broken or no commit is named. */
  brokenBy: { commit: string; subject: string } | null;
  /** The rounds, the first first. */
  rounds: BackRound[];
  /** One for each call a stage's role was refused: the stage as `trail/refusals.md` writes it, as in `ruling 2`, and the rule's name. */
  refusals: { kind: ChainStageKind; round: number; rule: string }[];
  /** How many rows of `trail/refusals.md` were not read. */
  unreadRefusals: number;
}
```

- `ClientMessage` gains `{ type: "readSealRecords"; requestId: number; workItemId: number }`.
- `ServerMessage` gains `{ type: "sealRecords"; requestId: number; workItemId: number; records: SealRecords }`.

**`src/shared/seal-back.ts`, new.** One function, from a `SealRecords`, a `LedgerEntry[]` and the ledger's count of unread lines, to the composed back, the three functions that word a cost, a count of tokens and a span of time, and `costText`, which words an entry's cost with its converted word (phase 2). A cost is written in US dollars with two decimals, and as "under $0.01" where it is above zero and below a cent. Tokens are written whole, with a comma at each thousand. A span is "under 1 min", "4 min" or "1 h 12 min".

**`src/daemon/`.**

- `ledger.ts`: `entryOf` reads `chain`, a kind of `CHAIN_STAGE_KINDS` with a whole number, or null, and an absent one as null. A `chain` of any other shape makes the line no entry, as a field of another type does today.
- `daemon.ts`: `beginHeadless` takes the stage's kind and round, `HeadlessSession` keeps them, `enter` writes them, `runGate`'s entry names them, and the case `readSealRecords` stands beside `readLedger`. `runPullRequest` reads the ledger and hands the composition's back to the body.
- `round-record.ts`: `Finding.severity`, `Finding.places` and `Close.answer`.
- `seal-back-records.ts`, new: *Scope* items 4 to 7, and the call of item 8's reader.
- `chain.ts`: the reader of `trail/refusals.md`, beside `refusalsText` and `stageCell`.
- `github.ts`: the back's two marker lines, read by the rule of `markerOf`; the back's section in `pullRequestBody`, below the seal section; the replacing of both sections at an edit, where `withSealSection` replaces one today; the back's part in the limit; and `marked` reading the markers of both sections. The part `## Review rounds` goes, with `BodyRecords.rounds`.

**`src/renderer/`.** `work-item-view.ts` holds the back's tab, the asking and the letting go, and `showView` puts no pane in front while the back is. The functions that decide the tab and which is in front stand in `view.ts`, beside `paneTabs` and `stageOf`, so `test/view.test.ts` reads them with no window. One function of `shared.ts` draws the composed back. `index.html` holds the back's rules, and `themes.css` holds a token only where a theme draws a part of the back differently, the same name in each of its blocks.

**The back's section of a pull request's body.**

````
<!-- owlery:back -->
## The back of the seal

The review rounds caught 1 defect that was fixed before the seal. Findings by round: 1, 0.

### Round 1, on `3f2a9c1`

- 1. A session that exits before its result line stays working. `src/daemon/headless.ts:88`. must. Fixed in `86cb04d`.

### Round 2, on `86cb04d`

No finding. It confirmed round 1's finding 1.

| Stage | Ended | Time | Tokens in / out | Cache read / written | Cost |
|---|---|---|---|---|---|
| Round 1 | | 4 min | 12,300 / 2,100 | 48,000 / 9,200 | $0.28 converted |
| Fix pass on round 1 | | 6 min | 9,800 / 3,400 | 51,000 / 7,700 | $0.41 converted |
| Round 2 | | 3 min | 8,100 / 900 | 44,000 / 2,000 | $0.19 converted |
| Broad gate | | 2 min | | | |
| Sealer | | 3 min | 7,400 / 1,200 | 40,000 / 3,100 | $0.22 converted |

The chain's stages cost $1.10 converted. A converted cost is the usage priced at API prices, and it is not a charge.
<!-- /owlery:back -->
````

**The words of the window.** One set for every theme, in the voice of `docs/design.md` *The voice of the window's words*. A commit is shown by its first seven characters. `frame/questions.md` Q5 leaves the wording of the sentences to the build.

| Where | Words |
|---|---|
| The tab | "Back of the seal" |
| The state's words, by the large seal, as `view.ts#sealShown` gives them today | "Sealed at `3f2a9c1`", "Seal broken, sealed at `3f2a9c1`", or "No seal yet" |
| The line of a broken seal | "Broken by `e91b0d4`", then the commit's subject |
| The record's labels | "Tree", "Base", "Item", "Gate", "Rounds", "Built by", "Judged by", "Model", "Rules" |
| The head, as this frame reads it | "The review rounds caught 2 defects that were fixed before the seal.", "The review rounds caught nothing.", "No review round is recorded.", "1 finding was rejected and 1 is open.", "Findings by round: 3, 1, 0." |
| A stage's name | "Round 2", "Fix pass on round 1", "Judgment after round 2", "Ruling after round 2", "Broad gate", "Sealer" |
| How a stage ended, where it did not finish by itself | "Failed", "Stopped at its limit", "Stopped", "Stopped with the daemon" |
| A cost | "$0.28 converted", "$0.28", or "No cost reported" |
| A finding's close | "Fixed in `86cb04d`", "Rejected", "Deferred to `#141`", "Open" |
| The sums, as this frame reads them | "The chain's stages cost $1.10 converted.", "The chain's stages cost $0.90 converted and $0.20 charged.", "2 stages reported no cost." |
| The sessions outside the chain | "2 sessions asked outside the chain cost $0.12 converted." |
| The sentence on a converted cost | "A converted cost is the usage priced at API prices, and it is not a charge." |
| What stands in the back's place before the answers, and where one was refused | "Reading the records.", and the refusal's sentence |
| The lines not read | "3 lines of round 2's record were not read.", "1 line of the ledger was not read." |

## Rule changes

- change
  file: docs/product.md
  section: The seal
  from: **The back of the seal.** It shows the defects the review caught and fixed before the PR side by side with the cost of each stage. This is where the seal shows, in the user's own numbers, whether it is worth what it costs.
  to: **The back of the seal.** It shows the defects the review caught and fixed before the PR side by side with the cost of each stage. This is where the seal shows, in the user's own numbers, whether it is worth what it costs. A sealed work item opens to it. It holds the seal's record, then each review round with its findings, each at its file and line with the commit that fixed it, and beside each round the stages that ran for it, each with its cost, its tokens and its time. A defect caught and fixed is a finding closed as fixed that no later round reopened, and rounds that caught nothing say so with their cost. A cost under a subscription login carries the word "converted", and a converted cost is never added to a charged one. A broken seal's back stays whole and names the commit that broke it. A work item with no seal yet shows the rounds and the cost so far. The pull request's body carries the same findings and the same sums in a section of its own.
    check: apps/desktop/test/seal-back.test.ts apps/desktop/test/seal-back-records.test.ts apps/desktop/test/seal-back-view.test.ts apps/desktop/test/pull-request.test.ts
- change
  file: docs/product.ko.md
  section: 인장
  from: **인장의 뒷면.** 리뷰가 잡아서 PR 전에 고친 결함과 단계별 비용을 나란히 보여 줍니다. 인장이 제값을 하는지를 사용자 자신의 수치로 보여 주는 자리입니다.
  to: **인장의 뒷면.** 리뷰가 잡아서 PR 전에 고친 결함과 단계별 비용을 나란히 보여 줍니다. 인장이 제값을 하는지를 사용자 자신의 수치로 보여 주는 자리입니다. 인장이 찍힌 작업을 열면 뒷면이 먼저 보입니다. 뒷면에는 인장 기록이 있고, 그 아래에 리뷰 회차마다 지적이 파일과 줄, 그 지적을 고친 커밋과 함께 놓이며, 회차 옆에는 그 회차를 위해 돈 단계들이 비용, 토큰, 걸린 시간과 함께 놓입니다. 잡아서 고친 결함은 고쳤다고 닫힌 지적 가운데 뒤 회차가 다시 열지 않은 것입니다. 아무것도 잡지 못한 회차는 그렇다고 말하고 그 비용을 함께 보입니다. 구독 로그인에서 나온 비용에는 "converted"라는 말이 붙고, 환산한 비용과 청구되는 비용은 서로 더하지 않습니다. 깨진 인장의 뒷면은 그대로 남고, 인장을 깬 커밋을 말합니다. 아직 인장이 없는 작업은 지금까지의 회차와 비용을 보입니다. PR 본문은 같은 지적과 같은 합계를 따로 둔 구역에 싣습니다.
    check: apps/desktop/test/seal-back.test.ts apps/desktop/test/seal-back-records.test.ts apps/desktop/test/seal-back-view.test.ts apps/desktop/test/pull-request.test.ts
- add
  file: docs/architecture.md
  section: State lives in three places
  to: **The back of the seal is composed from the committed records and the ledger each time it is opened, and nothing of it is stored.** A ledger entry names the chain's stage it is for, by its kind and its round, so a stage's cost is set beside its round's findings by that round and not by the order or the time of the entries, and a ruling is told from a judgment by its kind. A session no chain started names no stage and enters no round's cost. The daemon reads the round records, the guarantee, the gate's record and the refused calls as the branch's head commit holds them, and a file of the worktree that no commit holds says nothing. One function composes the back from that reading and the ledger's entries, for the window and for the pull request's body alike, so both show one sum. The window asks for the two readings when the back comes in front and drops them when it leaves, and no work item carries them in the lists the daemon sends. No cost is written into a record of the repository.
    check: apps/desktop/test/seal-back.test.ts apps/desktop/test/seal-back-records.test.ts apps/desktop/test/ledger.test.ts apps/desktop/test/chain.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/architecture.ko.md
  section: 상태는 세 곳에 둡니다
  to: **인장의 뒷면은 열 때마다 커밋된 기록과 장부로 짜고, 뒷면의 어떤 것도 저장하지 않습니다.** 장부의 항목은 자신이 체인의 어느 단계인지를 단계의 종류와 회차로 적습니다. 그래서 단계의 비용은 항목의 순서나 시각이 아니라 그 회차로 회차의 지적 옆에 놓이고, 질문에 대한 결정과 수렴 판단은 종류로 구별됩니다. 체인이 띄우지 않은 세션은 단계를 적지 않고, 어느 회차의 비용에도 들어가지 않습니다. 데몬은 회차 기록, `guarantee.md`, 전체 검사 기록, 거절된 호출을 브랜치의 head 커밋에 담긴 대로 읽고, 커밋되지 않은 워크트리의 파일은 아무것도 말하지 않습니다. 함수 하나가 그렇게 읽은 것과 장부의 항목으로 뒷면을 짜고, 창과 PR 본문이 같은 함수를 쓰므로 둘은 같은 합계를 보입니다. 창은 뒷면이 앞에 올 때 두 가지를 묻고 뒷면이 물러나면 버리며, 데몬이 보내는 목록의 어떤 작업도 그것을 싣지 않습니다. 비용은 저장소의 어떤 기록에도 적지 않습니다.
    check: apps/desktop/test/seal-back.test.ts apps/desktop/test/seal-back-records.test.ts apps/desktop/test/ledger.test.ts apps/desktop/test/chain.test.ts apps/desktop/test/daemon.test.ts
- change
  file: docs/architecture.md
  section: Records are committed to the repository
  from: The check refuses a section that differs from that block, and reads no other line of the body, which is the person's to edit.
  to: The check refuses a section that differs from that block, and reads no other line of the body. Below the seal section the daemon writes the back of the seal between two marker lines of its own: each round's findings, the cost of each stage and their sums, as the app's back shows them. The daemon rewrites both sections each time a seal sends the stage to an open pull request, so neither falls behind the records. Every other line of the body is the person's to edit.
    check: apps/desktop/test/pull-request.test.ts
- change
  file: docs/architecture.ko.md
  section: 기록은 저장소에 커밋합니다
  from: 검사는 그 블록과 다른 구역을 거절하고, 본문의 다른 줄은 읽지 않습니다. 그 줄들은 사람이 고칠 수 있습니다.
  to: 검사는 그 블록과 다른 구역을 거절하고, 본문의 다른 줄은 읽지 않습니다. 데몬은 인장 구역 아래에 인장의 뒷면을 따로 둔 두 표시 줄 사이에 씁니다. 회차마다의 지적, 단계별 비용, 그 합계가 앱의 뒷면이 보이는 대로 들어갑니다. 인장이 찍혀 이 단계가 열린 PR에 다시 올 때마다 데몬은 두 구역을 모두 다시 쓰므로, 어느 쪽도 기록보다 뒤처지지 않습니다. 본문의 나머지 줄은 사람이 고칠 수 있습니다.
    check: apps/desktop/test/pull-request.test.ts
- add
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  to: **The views of the finished work item and of the broken one show the back of a seal.** Each opens to its back, so the back is in front in both shots. The finished work item's chain runs two rounds: the stand-in for the CLI leaves one finding in the first, a fix pass closes it, and the second leaves none. The stand-in reports what each stage used, so the daemon's ledger holds a converted cost for each stage. That back shows a finding at its file and line with the commit that fixed it, a round that caught nothing, and the cost of each stage with its sum. The broken work item's back shows the commit that broke its seal, and a round that caught nothing with no stage's cost, since no chain ran for it.
    check: apps/desktop/test/screenshots.test.ts
- add
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  to: **끝난 작업의 화면과 인장이 깨진 작업의 화면은 인장의 뒷면을 보입니다.** 두 작업은 열면 뒷면이 먼저 보이므로, 두 스크린샷 모두 뒷면이 앞에 있습니다. 끝난 작업의 체인은 회차를 두 번 돕니다. CLI 대역은 첫 회차에 지적 하나를 남기고, 수정 단계가 그 지적을 닫고, 둘째 회차에는 지적을 남기지 않습니다. 대역은 단계마다 쓴 양을 알리므로, 데몬의 장부에는 단계마다 환산한 비용이 적힙니다. 그 뒷면은 파일과 줄, 고친 커밋이 붙은 지적, 아무것도 잡지 못한 회차, 단계별 비용과 그 합계를 보입니다. 인장이 깨진 작업의 뒷면은 인장을 깬 커밋을 보이고, 아무것도 잡지 못한 회차를 단계 비용 없이 보입니다. 그 작업에서는 체인이 돌지 않았기 때문입니다.
    check: apps/desktop/test/screenshots.test.ts

## Removes

This work adds one mark, the pair of marker lines of the back's section in a pull request's body, and one field of a ledger entry. No check reads either. In return it takes out the free part of the body that would say the rounds a second time. That part has caught nothing, since no release has shipped it: it can go because the back's section holds every line it held and is rewritten at each seal, which the part is not.

The `change` operations of *Rule changes* on *Records are committed to the repository* quote the last sentences of the `to` that `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md` *Rule changes* adds there, read as merged at `cad4a64`. The third row below names those sentences as they stand at the settle.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The free part of a pull request's body that lists each round's findings, with its line at the limit, and what `bodyRecords` reads for it | At `cad4a64`: `apps/desktop/src/daemon/github.ts:463-466`, the part under the heading `## Review rounds`; the field `rounds` of `BodyRecords` (line 389); the reading of the round records in `bodyRecords` (lines 412-421); and the words of the docstring of `pullRequestBody` that name the part | The back's section of the same body, between its marker lines (*Scope* items 22 and 23) |
| The test pins of that part | At `cad4a64`: `apps/desktop/test/pull-request.test.ts`, the constant `ROUNDS` (line 198) and each expected body that holds it or the line `held("## Review rounds", "trail/rounds")` (line 267); `apps/desktop/test/pr-check.test.ts:343`, the assertion that the stage's body holds `## Review rounds` below the seal section | The cases of scenarios 16, 17, 19 and 22 |
| The sentence that says every line of the body outside the seal section is the person's to edit | `docs/architecture.md` *Records are committed to the repository* and `docs/architecture.ko.md` *기록은 저장소에 커밋합니다*, at the settle, as #43's `add` leaves them | The `to` of *Rule changes* |
| The bullets of earlier changelog fragments that this work makes untrue | `seal/threads/1795395059-pull-request-and-seal-check/changelog.md`, the bullet "The body opens with the seal.", and `seal/threads/1795341001-cost-per-stage/changelog.md`, the bullet "Nothing in the window shows a cost yet." | The same bullets, rewritten in this pull request (*Scope* item 26) |

Framed 2026-11-23 by framer, before the build.
