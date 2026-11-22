# Review round 7: 1795330500-no-question-holds-the-run

```seal
target: 0b3904d, fixes 4d74567..0b3904d
```

This is a verifying round. It answers the three findings round 6 closed `fixed 55b955b`, and it reads the fix diff `4d74567..0b3904d` whole. The diff holds three commits. `ad7f697` adds round 6's record. `55b955b` changes `apps/desktop/src/daemon/repository-file.ts` (its head comment, and no line of code), `frame/design.md:65` and `:209`, `frame/plan.md` (two rows of *Judgments of the run*, `:107` and `:108`) and `gaps.md` (`:74-76`). `0b3904d` appends round 6's three close blocks. Each changed line was set beside the snippet round 6 wrote: the comment, the two frame sentences, the `gaps.md` bullet and the row at `frame/plan.md:107` are round 6's text word for word. The row at `frame/plan.md:108` is the orchestrator's own, and no finding asked for it. Read whole at `0b3904d`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English, and no `seal/parity.json` is declared.

Opened outside the fix diff, because a changed sentence states it: `daemon.ts:783-832` (the two message cases), `daemon.ts:1552-1575` (`personWrote`), `daemon.ts:309` and `:343` (the two methods), and issues #41, #42 and #150.

Carried from round 6, and not re-derived: its reading of `worktree-setup.ts#readSetup` and of the three places the daemon acts on `.worktreesetup` (`daemon.ts:563`, `:594`, `:991`), and its reading of `trail/phases/phase-1.md` to `phase-7.md`. No commit since `4d74567` touched either (`git diff --stat 4d74567 0b3904d` names no file of `trail/phases/` and no file of `src` but `repository-file.ts`). Re-derived: every verdict below.

Nothing in code behaviour changed, so this round ran no unit file and no built-app file.

The head comment's second line now runs to 117 characters where the comment's other lines wrap near 78. The repository runs no linter on comments (`apps/desktop/package.json`, `check` is the typecheck and the tests), and the line reads as one sentence, so this round opens no finding for it.

Round 6 wrote that its frame sentences were "the framer's or the orchestrator's to fold" and that its `gaps.md` bullet was "the fix pass's or the orchestrator's". The plugin's `skills/implement/orchestration.md` gives neither choice. Round 6's sentences are corrected here, and finding 3 carries what follows from them.

## Findings

### 1. The sentence after round 6's insert in `frame/design.md:65` now also reads as saying that `.worktreesetup` is read in the pass

```seal
severity: should
location: `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:65`
evidence: read `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:65`, `apps/desktop/src/daemon/repository-file.ts:1-16`; executed `git diff 4d74567..0b3904d -- seal/threads/1795330500-no-question-holds-the-run/frame/design.md`
regression: round-6#1
```

Why it matters: the frame's *Scope* item 2 says that six files go through `repositoryFileText` and that the pass reads every one of them but `package.json`. Round 6's fix inserted the sentence on `.worktreesetup` between that list and the sentence "Every one but `package.json` is read in the pass.". The defect came from round 6's own snippet, which replaced one sentence and did not read the one after it. So "Every one" now follows two sentences that name seven files. The nearer of the two names `.worktreesetup` alone. Read so, the sentence says that `.worktreesetup` is read in the pass, and it is not. `readSetup` runs at a plan, a creation and "Run setup again" (`daemon.ts:563`, `:594`, `:991`, carried from round 6). The sentence before it says that `.worktreesetup` "takes none of the bounds below". Being read in the pass is no bound, so that sentence does not settle which reading holds. The sealer audits `frame/design.md` against the tree. The head comment of `repository-file.ts` has the right order: "The pass reads every one but `package.json`" stands before its paragraph on `.worktreesetup` (`repository-file.ts:6`, `:13-16`). So the comment needs no change.

In `frame/design.md:65`, in place of "Every one but `package.json` is read in the pass.":

```markdown
Of the files read through `repositoryFileText`, every one but `package.json` is read in the pass.
```

The sentences after it ("It reads each only as a plain file …", "It reads `decisions.md` and each `routing.md` never through a link …") then follow this sentence's subject. `frame/plan.md:17`, `:39` and `:89` name the six files without `.worktreesetup`, so they stand. By the plugin's `skills/implement/orchestration.md` *The framer writes a decision's fold*, this sentence is the framer's to fold.

```seal
verdict: fixed 8f15668
answer: Agreed, and folded as the round wrote it: `frame/design.md:65` now reads "Of the files read through `repositoryFileText`, every one but `package.json` is read in the pass.". The framer also wrote into the sentence on `.worktreesetup` where it is read, "at a plan, a creation and a "Run setup again", outside the pass and off the daemon's thread" (`daemon.ts:563`, `:594`, `:991`, `worktree-setup.ts:37-48`). The frame then says that `.worktreesetup` is read outside the pass, as the head comment of `repository-file.ts:13-16` does. `:209` was read whole against `daemon.ts:783-832` and `:1552-1575`, and it stands.
```

### 2. The `gaps.md` bullet of round 5 states that #41 and #42 refuse or defer a stage's write, which no issue states, and it leaves out #51

```seal
severity: should
location: `seal/threads/1795330500-no-question-holds-the-run/gaps.md:76`
evidence: executed `git grep -n -E "\.(decided|park)\(" -- apps/desktop/src` (exit 1, no caller), `gh issue view 41 --json title,state,milestone,body`, `gh issue view 42 --json title,state,milestone,body`, `gh issue view 150 --json comments`; read `seal/threads/1795330500-no-question-holds-the-run/gaps.md:76`, `seal/threads/1795330500-no-question-holds-the-run/gaps.md:32`, `seal/threads/1795330500-no-question-holds-the-run/frame/plan.md:85`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:81-87`
regression: round-6#3
```

Why it matters: `frame/design.md` *Scope* items 16 and 17 and `frame/plan.md:81`, `:82` and `:85` name the callers of `Daemon#decided` and `Daemon#park`. These are #41 and #42 for both methods, and #51 for `Daemon#decided` at a route it chose. Round 6's fix wrote its own snippet into `gaps.md`, and the defect came from that snippet. The bullet ends: "Nothing calls either method yet: their callers, #41 and #42, refuse or defer the write the same way. #150.". The first clause holds: no line of `apps/desktop/src` calls either method. The second clause states as done what nobody has built or decided. #41 and #42 are open, and neither body speaks of the worktree's state at a write. #150's comment says the callers "should refuse or defer the write the same way `personWrote` does". So the bullet tells the settle, and the builder of #41, that the callers already take care of it. `gaps.md:32` names #51 as a caller of `Daemon#decided`, and this bullet does not. A route that #51's orchestrator records during a stopped rebase is lost the same way.

In `gaps.md:76`, in place of "Nothing calls either method yet: their callers, #41 and #42, refuse or defer the write the same way. #150.":

```markdown
Nothing calls either method yet. Their callers are #41 and #42, and #51 for `Daemon#decided` (`frame/plan.md` *Overlap with the release*), and each is to refuse or defer the write as `personWrote` refuses a person's word. #150 holds it, and its comment of 2026-11-23 names #41 and #42 alone.
```

By the plugin's `skills/implement/orchestration.md` *The framer writes a decision's fold*, a statement in `gaps.md` goes to a fix pass. Whether #150 should also name #51 is the orchestrator's choice (`## Not judged`).

```seal
verdict: fixed 05b09be
answer: Agreed, and folded in place at `gaps.md:76` from the round's text, with its last clause left out: the sentence now names #41 and #42, and #51 for `Daemon#decided` (`frame/plan.md:81`, `:82`, `:85`, *Overlap with the release*), as owing the refusal or the deferral, and ends "#150 holds it.". The round's clause "its comment of 2026-11-23 names #41 and #42 alone" is not written, because it no longer holds: `gh issue view 150 --comments` shows a second comment of 2026-11-23, "Correction to the comment above (round 7 of #119, 2026-11-23)", which names #51, #41 and #42 as each owing the refusal or the deferral. `git grep -n -E "refuse or defer|#41 and #42"` over `seal`, `apps` and `docs` finds no other sentence that says the callers already refuse or defer; `trail/rounds/round-6.md:96` quotes the old bullet as round 6's history and stands. The same reading found `gaps.md:32` naming #41 and #51 alone as the callers of `Daemon#decided`, where `frame/plan.md:82` has #42 call it too; `f82f58b` rewrites it in place to name #41, #42 and #51.
```

### 3. The row of round 6 in *Judgments of the run* cites a source that does not hold the judgment it records, and does not name the rule it departs from

```seal
severity: should
location: `seal/threads/1795330500-no-question-holds-the-run/frame/plan.md:108`
evidence: read `seal/threads/1795330500-no-question-holds-the-run/frame/plan.md:108`, `seal/threads/1795330500-no-question-holds-the-run/trail/rounds/round-6.md:51`, `seal/threads/1795330500-no-question-holds-the-run/trail/rounds/round-6.md:74`, `seal/threads/1795330500-no-question-holds-the-run/trail/rounds/round-6.md:105`, the plugin's `skills/implement/orchestration.md:58-79`, the plugin's `skills/core/SKILL.md` *Judgment is not licence to skip a party*
regression: round-6
```

Why it matters: the frame has no row for this. The row came with fix commit `55b955b`, and no finding asked for it. It records that the orchestrator applied all three findings itself, "with no framer spawn: each snippet is literal and decides nothing new". It cites the plugin's `skills/core/SKILL.md` *No fix that no round reads*. That is a row of the table of invariants, and it says why round 7 reads the fix. It does not say whether the orchestrator may write a fold. The plugin's `skills/implement/orchestration.md:58-79` lists "a round finding located in a frame file" as a decision. It says "The framer writes a decision's fold", and it sends "a statement found in a file the crafter writes, `gaps.md` or `changelog.md`" to a fix pass. The only exception it gives is a statement a crafter's hand-back names. Round 6's findings came from a round, not from a hand-back. So the row departs from that rule without naming it. Round 6's lines "the framer's or the orchestrator's to fold" (`round-6.md:51`, `:74`) and "the fix pass's or the orchestrator's" (`round-6.md:105`) invited the departure. `skills/core/SKILL.md` *A judgment stands on a source document* asks that a judgment be written down with the document it was judged against. The settle weighs these rows against what they cost. A departure filed under a source that does not speak to it hides from the settle that a rule was set aside. Findings 1 and 2 are what that cost here: by the same guide's *One fold reaches every statement of the fact it changes*, a framer would have read the next sentence of `frame/design.md:65`.

In `frame/plan.md:108`, in place of the row:

```markdown
| 2026-11-23 | Round 6: its three findings applied by the orchestrator as the round's paste-ready text, with no framer spawn for the frame sentences of findings 1 and 2 and no fix pass for the `gaps.md` bullet of finding 3: each snippet was literal and decided nothing new. Round 7 read the fix and found the sentence after finding 1's and the last sentence of finding 3's bullet wrong (`trail/rounds/round-7.md`, findings 1 and 2). Finding 1 touches a comment of `src`, so a verifying round 7 reads it | `trail/rounds/round-6.md`; `trail/rounds/round-7.md` | departs from the plugin's `skills/implement/orchestration.md` *The framer writes a decision's fold*; round 7 is held by `skills/core/SKILL.md` *No fix that no round reads* |
```

The row is the orchestrator's. Whether findings 1 and 2 of this round go to the framer and to a fix pass, as that guide says, or are applied again as literal text and recorded as a departure in the same way, is the orchestrator's judgment. The row above records the departure of round 6 alone.

```seal
verdict: fixed 075cfc9
answer: The row now holds the round's text: it names the departure from *The framer writes a decision's fold* and its cost, and findings 1 and 2 of this round go to the framer and a fix pass.
```

## Confirmations

```seal
confirms: round-6#1
```
What holds: the head comment of `repository-file.ts` opens "The one way the daemon reads a file of a person's repository whose text it acts on, but for the setup's command (below)", and it ends with round 6's paragraph on `readSetup` (`repository-file.ts:1-2`, `:13-16`). In that paragraph, "this thread" points back to "the thread that serves every pane and every client" at `:9`. The sentence at `frame/design.md:65` that opens "The daemon reads each file of a checkout whose text it acts on" names `.worktreesetup` as the exception and says how `readSetup` reads it. Both sentences are round 6's snippet word for word, and neither now claims a reach the tree lacks. The diff changes no line of code in `repository-file.ts`. Read, against `git diff 4d74567..0b3904d`. Finding 1 of this round is about the sentence after the insert, not about the sentence round 6 replaced.

```seal
confirms: round-6#2
```
What holds: `frame/design.md:209` says that a message of another shape, an empty reversal and a work item the daemon does not keep are refused before git is asked, and that every other answer comes once git has said where the worktree stands. The code agrees. A reversal of another shape is refused at `daemon.ts:787`, an empty one at `:789`, and an answer of another shape at `:808`, each before `personWrote`. `personWrote` refuses a work item it does not keep at `:1554`, before its chain, and its chain asks `whyNoCommit` at `:1557`. Every other refusal of `answerQuestions` runs inside the change at `:809-823`, after git: no open question, an id that is no open question, an answer given twice, an empty answer, and an open question with no answer. So do the writer's refusals of a reversal, noted at `:790`. `design.md:320` lists "two answers to one question", and that refusal is among the later ones (`:816`), so `:209` and `:320` agree. Read.

```seal
confirms: round-6#3
```
What holds: `gaps.md:74-76` holds the line "Review round 5 left one thing, with an issue in `release: 0.0.3`." and the bullet. `frame/plan.md:107` holds the row for round 5's closes and for the deferral to #150. Both are round 6's snippet word for word. The deferral now stands in the records the sealer and the settle read. No line the diff removes from `gaps.md` left the file: the diff of `gaps.md` adds four lines and removes none. Read. Finding 2 of this round is about the bullet's last sentence, which round 6's snippet held.

What matched: `pr.md` and `changelog.md` are unchanged since `4d74567`, and no sentence of either names the head comment of `repository-file.ts` or the lines `55b955b` changed. `changelog.md:18` says that either message is refused, with nothing written, where the worktree is off its branch or an operation is under way, and `frame/design.md:209` now says the same thing at greater length. `git grep -F "The one way the daemon reads"` prints only `repository-file.ts:1` and round 6's record, so no other file quotes the old comment. Read and executed.

What matched: the `gaps.md` rows of `## Not verified` that name the proofer were answered by reading in earlier rounds: the filter's choice by round 4 (`round-4.md:151`), and the lines of `commitWord` by round 6. Neither row is marked `closed` yet, and closing them is the fix pass's or the orchestrator's act. Carried as coordinates, not re-read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite at HEAD, the typecheck and the comparison of the documents' editions. The label `unverified` at `gaps.md:7` is honest: it names the orchestrator, and nothing since `4d74567` changed code. This round ran no unit file and no built-app file. When findings 1 to 3 are closed, the orchestrator's broad run is next, and then the sealer's spawn | `seal/config.json`, key `Broad gate` | the orchestrator, by the broad gate, then the sealer |
| Whether #150 should also name #51 as a caller of `Daemon#decided` that owes the refusal or the deferral. Its comment of 2026-11-23 names #41 and #42. This round posts nothing | issue #150 | the orchestrator |
| Round 6's rows of `## Not judged` on Register's wrapped age, on the bound of `.worktreesetup` and on a sequence of cherry-picks or reverts under `sequencer/` stand as round 6 wrote them. No commit since then touched what they name, and this round did not judge them again | `trail/rounds/round-6.md`, `## Not judged` | as round 6 names: the owner, the orchestrator, the fix pass |

## Probes

| Command | Result |
|---|---|
| `git grep -n -E "\.(decided\|park)\(" -- apps/desktop/src` in the branch worktree at `0b3904d` | Exit 1: no line of `src` calls `Daemon#decided` or `Daemon#park`. This was a probe of absence. It sealed nothing |
