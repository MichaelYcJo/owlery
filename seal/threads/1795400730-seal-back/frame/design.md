# Design: the back of the seal

Issue #47, "the seal has no back that sets each stage's cost beside the defects each round caught". The paths below are under `apps/desktop/` unless they open with `docs/`, `seal/`, `pr-check/`, `etcs/` or `apps/`.

## Grounding

The tree as read at `b33ebef`.

This work stands on work items of the release that have not merged, which the second table below lists. The tree at `b33ebef` holds none of their code (executed: `ls` of `src/daemon/ledger.ts`, `chain.ts`, `round-record.ts`, `chain-records.ts`, `seal-records.ts`, `seal-state.ts` and `github.ts` found no file). Each was read on its branch with `git show origin/<branch>:<path>`, and its row names the branch's commit. A frame that is not built yet is a claim of its framer, and `frame/plan.md` *Overlap with the release* says which of them the build opens again once they have merged.

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

The unmerged work this frame stands on. Each row is a claim read on its branch.

| Work item | Read at | What it fixes for this work |
|---|---|---|
| #45, `seal/threads/1795341001-cost-per-stage/` | `7f0976a`, built and reviewed through three rounds | `src/shared/protocol.ts#LedgerEntry`, `#Usage` with `converted`, and `#LedgerStage`. `src/daemon/ledger.ts#Ledger`, whose `read` gives one work item's entries from its `createdAt` on and the count of unread lines. The messages `readLedger` and `ledger`. `daemon.ts#enter`, which writes an entry when a headless session ends. Its *Scope* leaves "which round or fix pass an entry belongs to" to this work. |
| #41, `seal/threads/1795388700-review-rounds/` | `b1e0e26`, phases 1 and 2 built | `src/daemon/round-record.ts#readRoundRecord`, which gives a record's target, its findings, each finding's close and its references. `ChainStage.round`. `daemon.ts#runStage`, which starts each stage's session through `beginHeadless`. `worktrees.ts#fileAt`, which reads a file as a commit holds it. `trail/refusals.md`, written by `chain.ts#refusalsText`. |
| #46, `seal/threads/1795342001-progress-through-roles/` | `origin/feat/46-a-work-item-view-shows-no-progress-through-roles`, phases 1 and 2 built | `WorkItem.recorded` and `chain-records.ts#lastVerdict`. Its *Scope* leaves the findings of each round, the cost of each stage and the refused calls to this work. |
| #42, `seal/threads/1795393338-broad-gate-and-sealer/` | `0cff3e9`, framed | The verdict block's lines `built-by:`, `judged-by:`, `model:` and `rules:`, the table that says where each field of the seal record is read, `seal-records.ts`, and the gate's ledger entry with `usage` null. |
| #43, `seal/threads/1795395059-pull-request-and-seal-check/` | `3c13a7a`, framed | `github.ts`, which composes the body from the records at the head. The seal section between `<!-- owlery:seal -->` and `<!-- /owlery:seal -->`, which alone is rewritten at an edit. The free part `## Review rounds`. The body arm of the check, which reads the seal section alone. |
| #44, `seal/threads/1795396351-seal-breaks-after-a-commit/` | `ce987b7`, framed | `WorkItem.seal`, a `Seal` with `state`, `commit` and `why`. The state is read from the head commit. Its sentence names the first differing path and not the commit. `shared.ts#sealPlace(where, seal)` and the drawing of a broken seal. |
| #22, `seal/threads/1795397381-summary-of-seals/` | `df6a250`, framed | It leaves "the sealed work item's view: the large seal, the seal's record and the back of the seal" to this work, and its *Rule changes* add the summary to the views of the screenshot run. |

What the tree, the mockups and the probes showed. Each row is labelled as contract rule 4 asks.

| Fact | Label | Coordinate or command |
|---|---|---|
| No code of the tree draws a back of the seal or asks for a ledger. | executed | `git grep -n -i -e 'back of the seal' -e 'sealBack' -e 'seal-back' -e 'readLedger' -- apps pr-check` at `b33ebef` printed nothing, exit 1 |
| A work item's view is two columns: the stage of panes under a strip of tabs, and a right column of `--facts-width`, 420px, that holds the facts, `shared.ts#detail`, the "Ask" section and the seal's place at its foot. | read | `src/renderer/index.html:620-661`, `src/renderer/work-item-view.ts:888-931`, `src/renderer/shared.ts:286` |
| The large seal's rule stands and the view's foot draws it. | read | `src/renderer/index.html:136`, `src/renderer/shared.ts:124-126` |
| `round-record.ts#Finding` holds the paths of a `location:` and not their lines, and holds neither the severity nor the close's answer. The `location:` grammar is `path`, `path:line` or `path:first-last`. | read | `origin/feat/41-the-daemon-cannot-run-review-rounds:apps/desktop/src/daemon/round-record.ts`, the interfaces `Finding` and `Close` and `locationPaths`; `record-blocks.ts`, `PLACE` |
| A ledger entry holds its stage's pair and no round. The chain's run knows the round when it starts a stage. | read | `origin/feat/45-the-daemon-keeps-no-cost-per-stage:apps/desktop/src/shared/protocol.ts#LedgerEntry` and `daemon.ts:1443-1447`; `origin/feat/41-the-daemon-cannot-run-review-rounds:apps/desktop/src/daemon/daemon.ts:2102-2105` |
| The first commit on a branch's own line that changes a path that is no closing record is what `git log --first-parent --reverse` prints first, with one `:(exclude)` pathspec for each closing record. It prints nothing where only closing records follow the sealed commit. It names a commit that changes a source file and a closing record together. For a merge of the base it names the merge commit, and without `--first-parent` it names the base's own commits before it. `git merge-base --is-ancestor` exits 1 where the sealed commit is no ancestor of the head. | executed | Two probes in a temporary repository under the scratch directory, `test_tmp_breaking_commit.sh` and `test_tmp_breaking_merge.sh`, git 2.50.1, 2026-11-23. The first probe stopped at an error of its own script after its second case, and the second probe ran the two cases it left |
| The owner's mockup of a sealed work item sets the large seal and the seal's record (tree, base, gate, rounds, judged by) beside "The back of the seal": one sentence that counts the defects caught and fixed, then each finding with its round, its symptom, its `path:line` and "fixed in `<commit>`", and a round that found nothing said in one sentence. It shows no cost. | read | `etcs/design/inbox-first-mockups/project/C-WorkItem.dc.html`, ignored by git |
| The owner's later mockups keep the layout of a stage and a right column and change the finish alone. The study that compared the three directions recommends taking from the sealed mockup the large seal with the seal's record and the back side by side. | read | `etcs/design/polish-mockups/README.md` and `etcs/research/ux.md`, its recommendation, both ignored by git |
| The heading `## Review rounds` stands in no file of `apps/desktop/src` at this commit. | executed | `git grep -n -e '## Review rounds' b33ebef -- apps/desktop/src` printed nothing, exit 1 |
| The issue's one comment, of 2026-11-22, adds three things the approval line leaves to the back: the cost so far of a chain stopped before its seal, the count of findings per round with its trend, and the refused calls per stage. It changes nothing else of the request. | executed | `gh issue view 47 --json title,body,comments`, 2026-11-23 |
| `seal/follow-up.md` does not exist, and the release note of 0.0.1 holds no `### Process changes` table. | executed | `ls seal`; `gh release view --json body --jq .body` |
| `routing.md` of this work item stands, with `Planning` `framer`. | read | `seal/threads/1795400730-seal-back/routing.md` |

This work item's subject is the code, so its rules are stated in *Rule changes* for the settle. `docs/design.md` and `docs/design.ko.md` are the exception that #44 and #46 already took: a form is written there in the pull request that first draws it (*Scope* item 17).

## Scope

### The ledger names the round

1. **A ledger entry names the round of the chain's stage it is for.** `LedgerEntry` gains `round: number | null`. For a stage a chain started it is the stage's `ChainStage.round`: the round a round is, the round a fix pass answers, the round a judgment follows, and the last round recorded for the gate and the seal. It is null for a session no chain started. `Ledger`'s reader takes a line with no `round` as an entry whose round is null, so a line written by a build before this work is still read.
2. **The chain's run hands the round to the entry.** `daemon.ts#beginHeadless` takes the round where `runStage` calls it and null where the `ask` case does. The daemon keeps it on its record of the headless session, and `enter` writes it. The gate's call of `Ledger#add` (#42's *Scope* item 12) passes the gate stage's round.

### The records the back reads

3. **The round record's reader gives what the back shows of a finding.** `round-record.ts#Finding` gains `severity`, the value of its `severity:` line, and `places`, each place of its `location:` line as a path and the line or the span of lines the record writes after the colon, or null where it writes none. `#Close` gains `answer`, the value of its `answer:` line, or null. `located` stays, since the chain reads it. The reader refuses nothing it did not refuse before.
4. **One module reads the back's records at the branch's head commit.** A new module, `src/daemon/seal-back-records.ts`, takes a worktree, the work item's directory, the branch's head and the work item's `seal`, and answers a `SealRecords` (*Data & interfaces*). It reads every file with `worktrees.ts#fileAt` at the head, and no file of the worktree, so the back says what the committed records say. It reads through the readers that stand: `readRoundRecord` for each round record, the reader of the newest verdict block that #46 and #42 give, and `record-blocks.ts` for the gate's run block. It stores nothing.
5. **The seal's record is read from the newest verdict block where that block is a seal.** Its fields are read where #42's *Data & interfaces* says each is read: the sealed commit and the base from the block's `target:` line, the branch from the `Branch` row of `routing.md`, the item from the directory's name, the gate from the newest run block of `trail/gate.md`, the count of rounds from the round records the sealed commit holds, and who built, who judged, the model and the rules from the daemon's lines of the block. A line the block does not hold is null. Where the newest verdict block is no seal, or no guarantee stands, the record is null.
6. **A round record with a refused line still gives its other findings.** The answer holds the findings the reader returns and the count of the lines it refused. The back says that count under the round, and decides nothing on a refused line.
7. **A broken seal's answer names the commit that broke it.** Where the work item's `seal.state` is `broken` and the sealed commit is an ancestor of the head, the module runs `git log --first-parent --reverse` from the sealed commit to the head, with one excluding pathspec for each closing record of the work item's directory, and takes the first commit printed: its id and its subject. That is the oldest commit on the branch's own line that changes a path that is no closing record, and a merge of the base is named by its merge commit (*Grounding*, the probes). Where the command prints nothing, or the sealed commit is no ancestor, no commit is named, and the back shows the seal's own sentence, which #44 writes for both.
8. **The refused calls are read from `trail/refusals.md`.** `chain.ts` gains a reader beside `refusalsText`, for the table that function writes: each row's stage, as `round 2`, `fix pass 1`, `judgment 2` or `seal 1`, and its rule's name. A row whose stage or rule is not one the writer writes is counted as not read and gives nothing.
9. **A client asks for the records with one message.** `readSealRecords` names a work item, and the daemon answers `sealRecords`. An archived work item is answered as any other. A work item with no directory in its worktree's records root is answered with the empty value: no record, no round. An id the daemon lists no work item under, and a branch whose head the daemon cannot read, are answered with an `error`. The ledger is asked for with #45's `readLedger`, which this work leaves as it is.

### One composition, for the window and for the pull request

10. **One module composes the back from the two readings.** A new module, `src/shared/seal-back.ts`, holds one function that takes a `SealRecords`, the ledger's entries and its count of unread lines, and gives the back as plain values: the seal's record as rows of a label and a value, the sentences at its head, one part for each round, the stages after the rounds, the sessions outside the chain, and the sums. It reads no file and no clock, and imports nothing of the daemon or the renderer. The window draws what it gives, and `github.ts` writes the same values as Markdown, so the window and the pull request show the same numbers from one sum.
11. **An entry is set beside its round by its `round` and its stage.** A part of round `N` holds the entries whose round is `N` and whose stage is the proofer's round, the crafter's fix pass or the orchestrator's judgment, each as one line in the order the ledger gives. The gate's entries and the sealer's follow the rounds, each as a line. A stage that ran twice has two lines. The table that names a stage is typed over `ROLE_STAGES` and the gate, so a pair with no name does not compile. An entry whose round is null, or whose stage is null, is a session outside the chain: those are counted and summed in one line of their own and enter no round and no sum of the chain.
12. **A round's part says what the round read, what it found and what became of each finding.** It holds the round's number, the commit its `target:` names, and one line for each finding: its number, its symptom, its severity, each place as `path:line`, and its close, which is "fixed in `<commit>`", "rejected" or "deferred to `<home>`", or "open" where it has none. A finding that carries `reopens:` or `regression:` says which earlier finding or round it names. A round with no finding says so in one sentence, which names the earlier findings it confirmed where it confirmed any.
13. **The head counts the defects by one rule.** A defect caught and fixed is a finding whose close is `fixed` and that no later finding names with `reopens:`. So a finding that was closed, reopened and closed again is one defect. The head says that count, then the counts of the findings that are rejected, deferred and open where any is, then the count of findings of each round in order, as "3, 1, 0". Where the rounds hold no finding, the head says that the review rounds caught nothing. `frame/questions.md` Q3 holds the rule as a person's choice.
14. **A sum never adds a converted cost to a charged one, and says what it could not count.** The chain's sum adds the `usage.costUsd` of the chain's entries, the converted ones and the charged ones apart, and each sum carries its word. It counts the entries whose usage is null as stages that reported no cost, the gate apart, since the gate is no agent's turn. Each stage's line shows its own cost with the word "converted" where `usage.converted` is true, the tokens its models used, summed over the models, the time from its start to its end, and how it ended where it did not finish by itself. The back holds one sentence that says what a converted cost is.
15. **The back is composed for a work item with no seal too.** Where the record is null, the back holds the rounds recorded and the stages entered so far, with their sum, under the words "No seal yet". So a chain that stopped before its seal shows what it has cost, as the issue's comment asks.

### The window

16. **The back stands on the stage, behind a tab of its own.** The strip of tabs of a work item's view gains one tab, "Back of the seal", before the panes' tabs, for a work item whose `seal` is not null, whose `recorded` counts a round, or whose `chain` is not null. It has no close mark. Where it is in front, the stage shows the back in place of a pane, on the window's own ground and in the window's inks. The back holds, from its top: the large seal with the words of the seal's state; the seal's record; the head's sentences; each round's part; the gate's and the sealer's lines; the sums; the line of the sessions outside the chain; and the refused calls, as one line for each stage that was refused a call, with the count for each rule. `frame/questions.md` Q2 holds the place as a person's choice.
17. **`docs/design.md` and `docs/design.ko.md` state the forms before the window draws them, in this pull request.** *Components and their states* gains the back's tab in the row "A pane's tab", and the row "A row of a list of records" gains a finding of a round and a stage of the chain. A new row, "The back of the seal", states the order of its parts, the inks of a cost, of the word "converted", of a stage that failed and of a finding that is open, and that nothing of the back is red but the seal. A measure the back needs stands in the page's `:root` and in *The layout's measures*. `frame/plan.md` *Alternatives considered* holds why these two files change here and not at the settle.
18. **A sealed work item opens to the back.** `work-item-view.ts#enterView` puts the back's tab in front where it is called with no pane and the work item's `seal` is not null, sealed or broken. Where it is called with a pane, as from a notification of a session, that pane is in front, as today. A tab the person chose stays in front while the view stays.
19. **The window asks when the back comes in front and lets go when it leaves.** It sends `readSealRecords` and `readLedger` together, draws the back when both have answered, and shows one sentence in the back's place until then and where either was refused. It asks again where the work item's `seal`, `recorded` or `chain` in a later `inbox` differs from the one it asked at. It drops both answers when another tab comes in front and when the view is left. No answer is kept for a work item whose back is not in front.
20. **A broken seal's back stays whole and says which commit broke it.** The seal is drawn broken, as #44 draws it. Under the state's words stands the seal's sentence, and where a commit is named, a line "Broken by `<commit>`" with the commit's subject. The record, the rounds and the costs are those the head commit holds, a round recorded after the break among them.
21. **The pull request carries the screenshots, and the run captures the back.** `test/screenshots.ts#VIEWS` gains `back`. The scene's sealed work item holds two round records, the first with a finding closed `fixed` and the second with none, and its daemon's run folder holds a ledger with an entry for each stage, converted. The crafter runs `pnpm run screenshots` in `apps/desktop` and commits the files under this work item's `screenshots/`.

### The pull request's body

22. **The body carries the back in a section of its own, which the daemon rewrites with the seal section.** `github.ts` writes the back below the seal section, between the marker lines `<!-- owlery:back -->` and `<!-- /owlery:back -->`, under the heading `## The back of the seal`. It holds what item 10 gives, as Markdown: the head's sentences, one list for each round with a line for each finding, one table of the stages with the columns of item 14, the sums, and the sentence that says what a converted cost is. It holds no large seal and no seal record, which the seal section above it carries. At an edit of an open pull request the daemon replaces this section as it replaces the seal section (#43's *Scope* item 10), and puts it after the seal section where the body holds none. A body with more than one opening or closing marker of the back fails the stage with a sentence that says so. The stage reads the ledger through `Ledger#read`, at the time it composes, and commits nothing.
23. **The free part `## Review rounds` goes.** #43's body lists each round's findings in a part that no edit rewrites, so a later seal would leave it behind the back's section, with the same lines said twice. The back's section holds them. `## Removes` names it.
24. **At the body's limit the back's findings give way before its numbers.** Where the body would pass the limit #43 holds, the free parts below go first, as #43 has them go. Then each round's list of findings is replaced by one line that names `trail/rounds/`. The table of the stages and the sums stay, since no committed record holds a cost. The seal section is never cut.
25. **The check reads none of it.** The body arm reads the seal section alone (#43's *Scope* item 22). No line of `pr-check/` changes in this work.
26. **The changelog says what ships, and the earlier bullets are made true.** This work writes its `changelog.md`. Where the fragment of `seal/threads/1795395059-pull-request-and-seal-check/` says that the body lists the review rounds as a part of its own, or the fragment of `seal/threads/1795341001-cost-per-stage/` says that nothing shows a cost, the crafter rewrites that bullet in this pull request.

### Out of scope

- **Opening a finding's file at its line, and the diff of the commit that fixed it.** `docs/product.md` *File explorer and editor* gives them to the editor, and `docs/roadmap.md` *Milestones* row 4 and *Open decisions*, the row "The light editor", hold it. The back shows the place and the commit as text a person can select.
- **Publishing or exporting the ledger.** Issue #76, and `docs/roadmap.md` *Open decisions*, the row "Where the public ledger lives".
- **The cost of a stage that was stopped, a budget cap, and a cost Claude Code could not price.** Issue #141. A stopped stage's line says that it reported no cost.
- **The comparison of a converted cost with a bill.** Issue #140.
- **Reading the refused calls across work items.** Issue #136, as the issue's comment says.
- **The summary's sentence, and the approval line.** #22 and #46.
- **The framer's and the crafter's build stages.** Issue #56 adds them in milestone 3. Until then no chain starts one, and an entry of such a pair has no round.
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
| The issue's comment: the cost so far of a chain stopped before its seal, the count of findings per round, and the refused calls per stage | 15, 13, and 8 with 16 |

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. An entry names its round | Given a chain through the fake adapter, told to report a usage, that runs round 1, a fix pass and round 2. Then `readLedger` answers three entries whose rounds are 1, 1 and 2. Given an `ask` with no chain. Then its entry's round is null. | A case of `test/daemon.test.ts` |
| 2. An earlier build's line is read | Given a `ledger.jsonl` whose line holds every field of an entry but `round`. Then `read` gives the entry with `round` null and `unread` 0. | A case of `test/ledger.test.ts` |
| 3. A finding's place keeps its line | Given a round record whose finding names `` `src/a.ts:12`, `src/b.ts:3-9`, `src/c.ts` `` and whose close holds an `answer:`. Then the reader gives three places with the lines `12`, `3-9` and null, the severity and the answer, and the same refusals as before for the records of `test/round-record.test.ts`. | Cases of `test/round-record.test.ts` |
| 4. The records are read at the head | Given a temporary repository whose branch holds two committed round records and a guarantee, and a third round record written in the worktree and not committed. Then the answer holds two rounds. | A case of `test/seal-back-records.test.ts` |
| 5. Rounds that caught nothing | Given one round record with no finding and one ledger entry for its round. Then the composition's head says that the review rounds caught nothing, the round's part says so, and the sum is that entry's cost. | A case of `test/seal-back.test.ts` |
| 6. A defect reopened is one defect | Given round 1 with a finding closed `fixed`, round 2 with a finding that `reopens:` it, closed `fixed`, and round 3 that confirms it. Then the head counts one defect caught and fixed, and the counts by round are 1, 1, 0. | A case of `test/seal-back.test.ts` |
| 7. A converted cost is never added to a charged one | Given two entries, one with `converted` true and one false. Then the composition gives two sums, each with its word, and each stage's line carries its own. | A case of `test/seal-back.test.ts` |
| 8. A stage with no usage is counted | Given a fix pass stopped at its limit, with `usage` null, and a gate's entry. Then the fix pass's line says how it ended and that it reported no cost, the chain's sum counts one stage that reported none, and the gate is not counted among them. | A case of `test/seal-back.test.ts` |
| 9. A session outside the chain enters no round | Given an entry whose stage is null and one whose stage is the proofer's and whose round is null. Then no round's part holds either, and one line counts two sessions with their cost. | A case of `test/seal-back.test.ts` |
| 10. The seal's record | Given a guarantee whose newest verdict block is a seal with the daemon's lines, a gate record and three round records at the sealed commit. Then the record holds the commit, the branch, the base, the item, the gate, 3 rounds, who built, who judged, the model and the rules. Given a newest block that reads `withheld`. Then the record is null and the rounds are still given. | Cases of `test/seal-back-records.test.ts` |
| 11. The commit that broke a seal | Given the histories of the probes: closing records alone after the sealed commit, a commit that changes a source file, a merge of the base, and a head the sealed commit is no ancestor of. Then the answer names no commit, that commit, the merge commit, and no commit. | Cases of `test/seal-back-records.test.ts` |
| 12. The refused calls | Given a `trail/refusals.md` with two rows of `round 1`, one of `seal 1` and one row whose stage reads otherwise. Then the answer gives three and counts one as not read. | A case of `test/seal-back-records.test.ts` |
| 13. The daemon answers | Given a work item with a directory. Then `readSealRecords` answers `sealRecords`. Given a work item with none. Then the answer is the empty value. Given an id the daemon does not list. Then the answer is an `error`. | Cases of `test/daemon.test.ts` |
| 14. A sealed work item opens to its back | Given the built app on a scene with a sealed work item, a broken one and one with no chain. When the person opens the sealed one. Then the back's tab is in front and the back shows the record, a finding with its `path:line` and "fixed in", and a stage's cost with "converted". When the person opens the broken one. Then the back names the commit that broke the seal. Then the third work item's view holds no such tab. | One case of `test/seal-back-view.test.ts`, with one start of the built app through `BuiltApp.start` |
| 15. The back holds nothing while it is not in front | Given the same start. When the person brings a pane's tab in front. Then the window holds no answer of the back, and bringing the back in front again sends the two messages again. | The same case, which counts the messages the daemon received |
| 16. The body carries the same numbers | Given a sealed chain through the fake adapter and a stand-in for `gh`. Then the body holds one section between the back's markers, below the seal section, and each sum in it is the text the composition gives the window for the same records and entries. | A case of `test/pull-request.test.ts`, which #43 makes |
| 17. An edit rewrites the back | Given an open pull request whose body holds the back's section and a line a person wrote under it. When a new seal runs the stage again after one more round. Then the section holds the new round, and the person's line stands. | A case of `test/pull-request.test.ts` |
| 18. No part says the rounds twice | Given the built tree. Then no file of `apps/desktop/src` holds the heading `## Review rounds`. | `git grep -n -e '## Review rounds' -- apps/desktop/src` prints nothing. Run at `b33ebef`: it printed nothing, exit 1 (executed, *Grounding*). The pathspec excludes this work item's directory. The search can fail: #43's `github.ts` holds that heading once it merges, and a build that leaves it prints its line. |
| 19. The body at its limit | Given records whose findings push the body past the limit. Then each round's list is one line that names `trail/rounds/`, and the table of the stages and the sums stand whole. | A case of `test/pull-request.test.ts` |
| 20. The screenshots | Given the scene of item 21. Then the run's files hold one of the back for each theme and appearance it captures. | `pnpm run screenshots`, the case of `test/screenshots.test.ts` that names the files, and the review reads the files against `docs/design.md` |

## Data & interfaces

**`src/shared/protocol.ts`.** No field names a vendor.

- `LedgerEntry` gains `round: number | null`.
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
  /** The round block's `target:` value as written, or null where the record holds none the reader returns. */
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
  /** One for each call a stage's role was refused: the stage as `trail/refusals.md` writes it, and the rule's name. */
  refusals: { stage: string; rule: string }[];
  /** How many rows of `trail/refusals.md` were not read. */
  unreadRefusals: number;
}
```

- `ClientMessage` gains `{ type: "readSealRecords"; requestId: number; workItemId: number }`.
- `ServerMessage` gains `{ type: "sealRecords"; requestId: number; workItemId: number; records: SealRecords }`.

**`src/shared/seal-back.ts`, new.** One function, from a `SealRecords`, a `LedgerEntry[]` and the ledger's count of unread lines, to the composed back, and the three functions that word a cost, a count of tokens and a span of time. A cost is written in US dollars with two decimals, and as "under $0.01" where it is above zero and below a cent. Tokens are written whole, with a comma at each thousand. A span is "under 1 min", "4 min" or "1 h 12 min".

**`src/daemon/`.**

- `ledger.ts`: `entryOf` reads `round`, a whole number or null, and an absent one as null.
- `daemon.ts`: `beginHeadless` takes the round, the headless session's record keeps it, `enter` writes it, and the case `readSealRecords`.
- `round-record.ts`: `Finding.severity`, `Finding.places` and `Close.answer`.
- `seal-back-records.ts`, new: *Scope* items 4 to 8.
- `chain.ts`: the reader of `trail/refusals.md`.
- `github.ts`: the back's section, its two marker lines, its place in the body, its replacing at an edit, and its part in the limit. The part `## Review rounds` goes.

**`src/renderer/`.** `work-item-view.ts` holds the back's tab, the asking and the letting go. One function of `shared.ts` draws the composed back. `index.html` holds the back's rules, and `themes.css` holds a token only where a theme draws a part of the back differently, the same name in each of its blocks.

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
| The state's words, by the large seal | "Sealed at `3f2a9c1`", "Seal broken, sealed at `3f2a9c1`", or "No seal yet" |
| The line of a broken seal | "Broken by `e91b0d4`", then the commit's subject |
| The record's labels | "Tree", "Base", "Item", "Gate", "Rounds", "Built by", "Judged by", "Model", "Rules" |
| The head, as this frame reads it | "The review rounds caught 2 defects that were fixed before the seal.", "The review rounds caught nothing.", "No review round is recorded.", "1 finding was rejected and 1 is open.", "Findings by round: 3, 1, 0." |
| A stage's name | "Round 2", "Fix pass on round 1", "Judgment after round 2", "Broad gate", "Sealer" |
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
  to: **The back of the seal is composed from the committed records and the ledger each time it is opened, and nothing of it is stored.** A ledger entry names the round of the chain's stage it is for, so a stage's cost is set beside its round's findings by that number and not by the order or the time of the entries. A session no chain started has no round and enters no round's cost. The daemon reads the round records, the guarantee, the gate's record and the refused calls as the branch's head commit holds them, and a file of the worktree that no commit holds says nothing. One function composes the back from that reading and the ledger's entries, for the window and for the pull request's body alike, so both show one sum. The window asks for the two readings when the back comes in front and drops them when it leaves, and no work item carries them in the lists the daemon sends. No cost is written into a record of the repository.
    check: apps/desktop/test/seal-back.test.ts apps/desktop/test/seal-back-records.test.ts apps/desktop/test/ledger.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/architecture.ko.md
  section: 상태는 세 곳에 둡니다
  to: **인장의 뒷면은 열 때마다 커밋된 기록과 장부로 짜고, 뒷면의 어떤 것도 저장하지 않습니다.** 장부의 항목은 그 단계가 속한 체인의 회차를 적습니다. 그래서 단계의 비용은 항목의 순서나 시각이 아니라 그 번호로 회차의 지적 옆에 놓입니다. 체인이 띄우지 않은 세션은 회차가 없고, 어느 회차의 비용에도 들어가지 않습니다. 데몬은 회차 기록, `guarantee.md`, 전체 검사 기록, 거절된 호출을 브랜치의 head 커밋에 담긴 대로 읽고, 커밋되지 않은 워크트리의 파일은 아무것도 말하지 않습니다. 함수 하나가 그렇게 읽은 것과 장부의 항목으로 뒷면을 짜고, 창과 PR 본문이 같은 함수를 쓰므로 둘은 같은 합계를 보입니다. 창은 뒷면이 앞에 올 때 두 가지를 묻고 뒷면이 물러나면 버리며, 데몬이 보내는 목록의 어떤 작업도 그것을 싣지 않습니다. 비용은 저장소의 어떤 기록에도 적지 않습니다.
    check: apps/desktop/test/seal-back.test.ts apps/desktop/test/seal-back-records.test.ts apps/desktop/test/ledger.test.ts apps/desktop/test/daemon.test.ts
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
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: A screenshot is made from the built app, and the views are the summary, the inbox, a work item's view, the view of a work item parked with questions, a menu and a dialog.
  to: A screenshot is made from the built app, and the views are the summary, the inbox, a work item's view, the back of a seal, the view of a work item parked with questions, a menu and a dialog.
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 스크린샷은 빌드한 앱에서 만들고, 화면은 요약 화면, 작업함, 작업 화면, 질문 때문에 멈춰 둔 작업의 화면, 메뉴, 대화 상자입니다.
  to: 스크린샷은 빌드한 앱에서 만들고, 화면은 요약 화면, 작업함, 작업 화면, 인장의 뒷면, 질문 때문에 멈춰 둔 작업의 화면, 메뉴, 대화 상자입니다.
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: The command writes one PNG file of the window's size, 1440 by 900, for each of the six views in each appearance of Night watch, twelve files named `<theme>-<appearance>-<view>.png`.
  to: The command writes one PNG file of the window's size, 1440 by 900, for each of the seven views in each appearance of Night watch, fourteen files named `<theme>-<appearance>-<view>.png`.
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 명령은 Night watch의 두 모양마다 여섯 화면을 창 크기인 1440 x 900의 PNG 파일로 하나씩 씁니다. 파일은 열두 개이고 이름은 `<theme>-<appearance>-<view>.png`입니다.
  to: 명령은 Night watch의 두 모양마다 일곱 화면을 창 크기인 1440 x 900의 PNG 파일로 하나씩 씁니다. 파일은 열네 개이고 이름은 `<theme>-<appearance>-<view>.png`입니다.
- add
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  to: **The screenshot run captures the back of a seal.** The sealed work item of the scene holds two round records, the first with a finding that a fix pass closed and the second with none, and the run's folder holds a ledger with a converted cost for each stage. So the back shows a finding at its file and line, a round that caught nothing, and the cost of each stage with its sum.
    check: apps/desktop/test/screenshots.test.ts
- add
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  to: **스크린샷 실행은 인장의 뒷면도 찍습니다.** 장면에서 인장이 찍힌 작업은 회차 기록 둘을 가집니다. 첫 회차에는 수정 단계가 닫은 지적이 하나 있고, 둘째 회차에는 지적이 없습니다. 실행 폴더에는 단계마다 환산한 비용이 적힌 장부가 있습니다. 그래서 뒷면은 파일과 줄이 붙은 지적, 아무것도 잡지 못한 회차, 단계별 비용과 그 합계를 보입니다.
    check: apps/desktop/test/screenshots.test.ts

## Removes

This work adds one mark, the pair of marker lines of the back's section in a pull request's body, and one field of a ledger entry. No check reads either. In return it takes out the free part of the body that would say the rounds a second time. That part has caught nothing, since no release has shipped it: it can go because the back's section holds every line it held and is rewritten at each seal, which the part is not.

The `change` operations of *Rule changes* on `docs/design.md` and `docs/design.ko.md` quote as their `from` the `to` of the operations that `seal/threads/1795397381-summary-of-seals/frame/design.md` *Rule changes* holds on the same sentences, since #22 merges before this work. Those on *Records are committed to the repository* quote the last sentences of the `to` that `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md` *Rule changes* adds there. The rows below name those sentences as they stand at the settle.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The free part of a pull request's body that lists each round's findings, with its row of the table of parts and its line at the limit, which #43 adds | `apps/desktop/src/daemon/github.ts`, the part under the heading `## Review rounds` | The back's section of the same body, between its marker lines (*Scope* items 22 and 23) |
| The test pins of that part, which #43 adds | `apps/desktop/test/pull-request.test.ts`, each assertion that names `## Review rounds` | The cases of scenarios 16, 17 and 19 |
| The sentence that says every line of the body outside the seal section is the person's to edit | `docs/architecture.md` *Records are committed to the repository* and `docs/architecture.ko.md` *기록은 저장소에 커밋합니다*, at the settle, as #43's `add` leaves them | The `to` of *Rule changes* |
| The sentences that count the views and the files of the screenshot run | `docs/design.md` *A pull request that changes the window carries its screenshots* and `docs/design.ko.md` *창을 바꾸는 PR은 스크린샷을 싣습니다*, at the settle, as #22's `change` leaves them | The `to` of *Rule changes* |
| The bullets of earlier changelog fragments that this work makes untrue | `seal/threads/1795395059-pull-request-and-seal-check/changelog.md` and `seal/threads/1795341001-cost-per-stage/changelog.md`, where a bullet says what *Scope* item 26 names | The same bullets, rewritten in this pull request |

Framed 2026-11-23 by framer, before the build.
