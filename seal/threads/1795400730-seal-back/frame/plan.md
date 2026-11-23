# Implementation Plan: the back of the seal

## Technical context

The tree as read at `b33ebef`.

The paths below are under `apps/desktop/` unless they open with `docs/`, `seal/`, `pr-check/` or `etcs/`.

The tree at `b33ebef` holds none of the code this work builds on (`frame/design.md` *Grounding*). The build starts once #44 and #22 have merged into `release/v0.0.2` and this branch has merged the release branch. What follows is each seam as its branch held it on 2026-11-23, and the build opens each again in the merged tree before it edits it.

- **The ledger.** `src/daemon/ledger.ts#entryOf` reads a line as an entry only where every field of `LedgerEntry` is of its type, and `daemon.ts#enter` writes one entry for each headless session that ended, with `stage: info.role` (`origin/feat/45-the-daemon-keeps-no-cost-per-stage` at `7f0976a`, `daemon.ts:1443-1447`). The file is append-only and a deleted work item's lines stay, so the field this work adds has to be read as null where a line does not hold it.
- **The chain's run.** `daemon.ts#runStage(workItemId, kind, round, role, …)` starts a stage through `beginHeadless(workItemId, prompt, role, worktree)`, which the `ask` case also calls (`origin/feat/41-the-daemon-cannot-run-review-rounds` at `b1e0e26`, `daemon.ts:1149`, `:1479` and `:2102-2105`). The round is in `runStage`'s hands and is not passed on.
- **The round record's reader.** `src/daemon/round-record.ts#readRoundRecord` reads a text and no file, and `test/round-record.test.ts` hands one set of records to it and to the check's Python reader and compares what they return. This work adds fields to what the reader returns and changes no refusal, so that comparison stands.
- **Reading at a commit.** `worktrees.ts#fileAt(worktree, commit, path)` gives a file's text as a commit holds it, or null (the same branch, `worktrees.ts:971`).
- **The window.** A work item's view is the stage under a strip of tabs, and a right column 420px wide (`src/renderer/index.html:620-661`). `work-item-view.ts#showView` draws the tabs from the work item's panes, and `enterView(workItemId, pane?)` chooses the pane in front. `view.ts` holds the functions that compose what the renderer draws, and `test/view.test.ts` reads them with no window.
- **The body.** #43's `github.ts` composes the body from the records the head commit holds and replaces only the lines between the seal section's markers at an edit (`seal/threads/1795395059-pull-request-and-seal-check/frame/design.md` *Scope* items 9 and 10). It is framed and not built.

The failure scenario of the chosen approach, in six months. The back joins two sources that only the round's number ties together. A stage that a later work item adds to the chain, as #56 adds the framer's and the crafter's, and that passes no round, lands in the line of the sessions outside the chain, and its cost leaves the chain's sum without a failing case. The typed table of stage names (*Scope* item 11 of `frame/design.md`) fails the build for a new pair of `ROLE_STAGES`, which is where that work meets this one. The second weak point is the body's section: a person who edits a number inside the back's markers loses the edit at the next seal, and nothing tells them before.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| A ledger entry names its round (chosen) | A build before this work wrote entries with no round, and they stand outside every round | Chosen. The chain's run holds the round when it starts the stage. No release has shipped a ledger, so only the owner's own builds hold such lines, and they are read as sessions outside the chain |
| Join by order: the first proofer entry is round 1, the second round 2 | A round's session that failed and ran again, and a role session a person asked outside a chain, each shift every later round by one, and the back sets a cost beside the wrong findings | Rejected. #41 lets a client launch a role session outside a chain (`seal/threads/1795388700-review-rounds/frame/design.md` *Out of scope*, "The `role` of an `ask`") |
| Join by time against the chain's stored stages | The daemon keeps the newest 50 stages with the work item and drops them with it, so the join is lost at a delete, and the published ledger of #76 needs the same join after the delete | Rejected |
| Join by the time of the commit that records a round | A commit's time is the person's clock and git's, and a stage that failed commits nothing | Rejected |
| Replace the ledger's place: write each stage's cost into a committed record, so the check and a clone could read it | Each cost is a commit after the stage, and a commit after the gate that is no closing record breaks the seal. A person's spending would enter the repository's history for good | Rejected. The premise that keeps the ledger with the daemon is `docs/architecture.md` *State lives in three places*, the row "The daemon", read at `b33ebef`, and #45's rule on the same section |
| The back on the stage, behind a tab (chosen) | A person who wants a pane and the back side by side cannot have both | Chosen as the default, with `frame/questions.md` Q2. The stage is the one place wide enough for a finding's symptom, its place and a stage's numbers on a line, and `docs/architecture.md` *Overall layout* names the back beside the panes as a part of the screen |
| The back as one more section of the right column | The column is 420px and already holds the facts, what the agent says, the approval line, the decisions, the commits, the changes, the setup and "Ask". The back would be the eighth part of one scroll, and a sealed work item could not "open to" it | Rejected |
| Replace the view's layout for a sealed work item, as the owner's sealed mockup draws it: the seal and its record on the left, the back on the right, the terminals below | The view has two layouts, and every later work item that adds to the view builds twice | Rejected. The premise that keeps the one layout: `docs/design.md` *What every theme shares* holds the layout fixed, and the owner's later mockups keep the stage and the right column and change the finish alone (`etcs/design/polish-mockups/README.md`, read). The tab takes from the sealed mockup what the study recommends: the large seal, the record and the back together |
| The back's data sent with every work item in `inbox` | Every list the daemon sends reads each work item's round records at a commit, and the window holds every back while none is open | Rejected by `docs/architecture.md` *Memory design*, the first rule |
| One new message whose answer holds the ledger's entries too | `readLedger` would have no reader, and two messages would give one work item's entries | Rejected. The window sends #45's `readLedger` beside the new message |
| One composition in `src/shared/` for the window and the body (chosen) | The module is imported by the daemon and the renderer, so a word changed for the window changes the body | Chosen. That coupling is what the issue's last line asks: the same numbers. Composed twice, the two sums drift at the first change of a rounding |
| The body's back in a marked section the daemon rewrites (chosen) | A person's edit inside the markers is lost at the next seal | Chosen. #43 rewrites the seal section alone, so a part outside a marked section says the first seal's rounds for good |
| The back inside the seal section | The body arm reads that section with the grammar of a guarantee and refuses a line it does not know | Rejected |
| The back as a comment on the pull request | Owlery would write on the pull request beyond its body, and a comment per seal piles up | Rejected. #43's rule holds `gh` to list, create, edit and read a pull request |
| The numbers stay in the app until the ledger is published | A person without the app sees the verdict and not what it cost or caught, which is the question the back answers | Not chosen as the default. `frame/questions.md` Q1 leaves it to a person, since it puts a person's cost on a page others read |
| The records read in the worktree, committed or not | A round record a stage wrote and the daemon refused, or a file edited by hand, would show as a finding | Rejected. The issue's second line says the committed records |
| The breaking commit read with `--first-parent` (chosen) | A change that came in through a merge is named by the merge commit and not by the base's commit that made it | Chosen. The merge is what landed on the branch. Without the option the command names the base's own commits (`frame/design.md` *Grounding*, the probes) |
| The seal's sentence of #44 alone, with no commit | The issue's fifth line asks which commit | Rejected |
| The forms written into `docs/design.md` and `docs/design.ko.md` in this pull request (chosen) | Another work item of the release edits the same rows, and a merge resolves both | Chosen. *Principles* 8 has a form written there first, `test/themes.test.ts` fails a token the document does not name, and #44 and #46 changed the same file the same way. The rule on the screenshot run stays in *Rule changes*, as #22, #42 and #43 hold theirs there |
| A defect is a finding closed `fixed` that no later finding reopens (chosen) | A finding the fix pass rejected wrongly counts as no defect | Chosen as the default, with `frame/questions.md` Q3. Counting every finding would count a rejected one as caught, and counting every `fixed` close would count one defect twice where a round reopened it |

## Phases

The build waits until #44 and #22 have merged and this branch has merged `release/v0.0.2`. Each phase runs the cases of the files it touched through the test lock the spawn names, and the broad gate is the orchestrator's.

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1. The ledger names the round | `frame/design.md` *Scope* items 1 and 2 | Scenarios 1 and 2 | |
| 2. The records and the composition | *Scope* items 3 to 15 | Scenarios 3 to 13 | |
| 3. The back in the window | *Scope* items 16 to 21 | Scenarios 14, 15 and 20, and the review's reading of the screenshots against `docs/design.md` | |
| 4. The back in the pull request's body | *Scope* items 22 to 26 | Scenarios 16 to 19 | |

The new test files that `frame/design.md` *Rule changes* names in its `check:` lines are made under those names: `test/seal-back.test.ts` and `test/seal-back-records.test.ts` in phase 2, and `test/seal-back-view.test.ts` in phase 3. The check at the pull request refuses a `check:` line that names no file. `test/ledger.test.ts` is #45's and `test/pull-request.test.ts` is #43's.

Phase 3 starts the built app once for scenarios 14 and 15 and once for the screenshot run, each through `BuiltApp.start` with `OWLERY_BACKGROUND=1`.

## Overlap with the release

The spawn names #45, #44, #41, #42, #43, #46 and #22, and gives the release's merge order: #27, #45, #41, #46, #42, #43, #44, #22, then this work. Each frame was read on its branch at the commit `frame/design.md` *Grounding* names. This work merges last, so each row's first merger is the other item. #27 is in the order and its frame was not read: by #22's plan it changes `src/daemon/last-look.ts` and holds an `add` on `docs/product.md` *Foundation*, neither of which this work touches. That is #22's framer's claim, and the build opens the merged tree for it.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #45, `1795341001-cost-per-stage` | `src/shared/protocol.ts#LedgerEntry`, which gains `round`. `src/daemon/ledger.ts#entryOf`. `daemon.ts#enter`. `test/ledger.test.ts` and `test/daemon.test.ts`. `docs/architecture.md` *State lives in three places*, where both hold an `add`. Its `changelog.md`, a bullet of which this work may rewrite | #45 | It gives the ledger, its entries and the "converted" mark, and leaves the join of an entry to its round to this work. This work adds one field to its entry and reads its `readLedger` as it is |
| #41, `1795388700-review-rounds` | `src/daemon/round-record.ts#Finding` and `#Close`, which gain fields. `daemon.ts#beginHeadless`, which gains the round. `src/daemon/chain.ts`, which gains the reader of `trail/refusals.md` beside its writer. `test/round-record.test.ts` | #41 | It gives the committed round records, their reader, the round of each stage and the file of the refused calls. Its phase 3 is still building, so the build opens `chain.ts` and `daemon.ts` as merged |
| #46, `1795342001-progress-through-roles` | `src/renderer/work-item-view.ts` and `shared.ts`, where it adds the approval line to the right column and this work adds a tab to the stage. `index.html` and `themes.css`. `docs/design.md` and `docs/design.ko.md` *Components and their states*, in other rows | #46 | It gives `WorkItem.recorded`, whose count of rounds decides whether the back's tab stands, and `chain-records.ts#lastVerdict`. It leaves the findings, the costs and the refused calls to this work |
| #42, `1795393338-broad-gate-and-sealer` | The gate's call of `Ledger#add`, which gains the round. `src/daemon/seal-records.ts`, whose reading of the verdict blocks this work calls. `docs/design.md` *A pull request that changes the window carries its screenshots*, where both hold operations | #42 | It gives the seal record: the daemon's lines of the verdict block, the gate's record and the gate's ledger entry |
| #43, `1795395059-pull-request-and-seal-check` | `src/daemon/github.ts`, the composing of the body and the replacing of a section at an edit, where this work adds the back's section and removes the part `## Review rounds`. `test/pull-request.test.ts`. `docs/architecture.md` *Records are committed to the repository*, where this work's `change` quotes its `add`. Its `changelog.md` | #43 | It gives the body, its seal section and the rule that only a marked section is rewritten. This work changes what it built, so it has to stand first |
| #44, `1795396351-seal-breaks-after-a-commit` | `src/shared/protocol.ts#WorkItem`, the field `seal`, which this work reads. `src/renderer/shared.ts#sealPlace`, which the back calls for the large seal. `work-item-view.ts#enterView`. `docs/design.md` *Components and their states*, the row "The seal's place". The scene of the screenshot run, whose sealed and broken work items the back's view opens | #44 | It gives the seal's state, the sealed commit, the broken seal's sentence and its drawing. This work adds the commit that broke it, which its sentence does not name |
| #22, `1795397381-summary-of-seals` | `test/screenshots.ts#VIEWS`, where both add a view. `docs/design.md` *A pull request that changes the window carries its screenshots*, where this work's `change` operations quote the `to` of its operations. The scene of the screenshot run | #22 | It leaves the sealed work item's view to this work. Its operations on the two sentences settle first, so this work's `from` is their `to` |

## Operational impact

- No migration. `ledger.jsonl` gains a field on new lines, and a line without it is read.
- No new dependency and no new environment variable.
- The protocol gains two messages. A daemon of an earlier build answers a message it does not know with nothing, so the window shows "Reading the records." until the daemon is the build's own. No release has shipped an earlier daemon with a ledger.
- A pull request's body gains a section that shows a work item's cost to whoever can read the pull request (`frame/questions.md` Q1).
- The version does not move: the first pull request of `release/v0.0.2` moved it.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
