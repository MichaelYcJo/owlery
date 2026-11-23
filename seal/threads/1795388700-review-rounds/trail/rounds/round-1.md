# Review round 1: 1795388700-review-rounds

```seal
target: 0947f11 against origin/release/v0.0.2
```

The diff `origin/release/v0.0.2...0947f11` was read against issue #41 (`gh issue view 41`, body and five comments), `docs/architecture.md` and `docs/design.md` first, then against the frame. The frame was folded after each phase to what the build does, so a sentence of the frame that only restates the build was not taken as grounds for it. There is no earlier round, so no fact was carried from one. Every finding below rests on reading, but for the searches its `evidence:` line names. No test file and no build ran in this round: the suite is labelled `unverified` by `gaps.md` *Not verified*, and that label is honest (the phase records name what each phase ran, and none ran the whole suite).

Seven findings. The first two are the daemon's order: the record filter lets through records the pull request check refuses, and a convergence judgment can be skipped. The third is the round's target. The fourth and fifth are the window. The sixth is the policy on the window's forms. The seventh is `pr.md`.

## Findings

### 1. The daemon commits round records and fix-pass records the pull request check refuses, and no stage of the chain can repair them

```seal
severity: should
location: `apps/desktop/src/daemon/chain.ts:622-645`, `apps/desktop/src/daemon/chain.ts:665-701`, `apps/desktop/src/daemon/daemon.ts:2154`, `apps/desktop/src/daemon/daemon.ts:2195`, `seal/threads/1795388700-review-rounds/changelog.md:8`, `seal/threads/1795388700-review-rounds/frame/design.md:257`, `seal/threads/1795388700-review-rounds/frame/design.md:262`, `seal/threads/1795388700-review-rounds/gaps.md:40`, `seal/threads/1795388700-review-rounds/pr.md:8`
evidence: read `pr-check/skills/code-review/scripts/chain_check.py:902-978`, `pr-check/skills/code-review/scripts/chain_check.py:1448-1555`, `apps/desktop/src/daemon/chain.ts:174-184`, `apps/desktop/src/daemon/chain.ts:607-701`; executed `grep -n "\.held\b\|located\|diff-tree\|touched" src/daemon/chain.ts src/daemon/daemon.ts src/daemon/worktrees.ts` and `grep -rn "first record\|not an earlier record\|touches no path" src/daemon` in `apps/desktop`, which found no reference rule and no touch rule
```

Why it matters: a round record's text is the proofer's and the daemon never rewrites it (*Scope* item 19), and a fix pass may only append close blocks. So a committed record the check refuses stays refused: the chain rests `reviewed`, and the pull request check fails at the record until a person edits a committed record by hand. The changelog tells the person the opposite. `changelog.md:8` says "Owlery writes none that the check would refuse", and the rule change at `frame/design.md:257` (and its Korean edition at `:262`), which the settle writes into `docs/architecture.md`, says the daemon "writes no record that the pull request check would refuse". `gaps.md:40` and `pr.md:8` each admit part of the gap.

The class was listed by taking the check's records arm apart into each refusal it makes (`records`, `verdict_problems`, `channel` and `follows`) and reading the daemon's step for each:

| The check refuses | The daemon |
|---|---|
| No `round-N.md` for a work item through the review chain | Holds: it rests `reviewed` only after a round (`chain.ts:177`) |
| A line its reader refuses (`round_read`) | Holds: `round-record.ts#readRoundRecord` follows it, and `chain.ts#firstRefusal` stops the round |
| A finding with no close block | Holds: `stepOwed` owes a fix pass (`chain.ts:179`) |
| A `fixed` commit HEAD does not descend from | Holds: `fixedCommitsHeld` (`chain.ts:697-698`) |
| A `fixed` commit that touches no path of the finding's `location:` or the close's `location:` (`chain_check.py:1448-1481`) | Lets it through: `fixedCommitsHeld` reads no path the commit changed |
| A `confirms:`, `reopens:` or `regression:` line in the first record (`chain_check.py:931-937`) | Lets it through: `roundRecordOf` reads references only where `given.before` is not null |
| A reference to a round that is not an earlier record of the work item (`chain_check.py:938-941`) | Lets it through |
| A reference to a finding the named record does not hold (`chain_check.py:942-943`) | Lets it through |
| A `fixed` or `rejected` finding the next record does not name | Holds: `roundRecordOf` (`chain.ts:636-643`) |
| A `fixed` or `rejected` finding of the last record | Holds: `stepOwed` owes a verifying round (`chain.ts:180-182`) |
| A last target behind HEAD | Holds, and more strictly: `pathsOfCommits` counts merges' parents and the base's commits, which `follows` leaves out, so the daemon owes a verifying round after a merge of the base where the check would not |

The other direction was read too. The daemon refuses a record the check accepts in three places: a heading other than the prompt's, a `target:` line other than the prompt's, and a close block in a round's own record. Each is stated in *Scope* item 6 and each is a form the prompt gives, so none is a defect.

The fix holds the four rows that let a record through. `roundRecordOf` takes every earlier round, which `standingOf` already read, and `fixPassRecord` hands each close its finding's places:

```ts
// chain.ts, roundRecordOf: `earlier` replaces `before`; daemon.ts:2154 passes `earlier: standing.rounds`.
export function roundRecordOf(answer: string, given: { round: number; workItem: string; target: string; earlier: readonly RoundStanding[] }): string {
  // ... the heading, the reader, the target line and the close block, as now ...
  for (const reference of references(record)) {
    const said = `round-${String(reference.round)}${reference.finding === null ? "" : `#${String(reference.finding)}`}`;
    if (given.earlier.length === 0) throw new ChainStop(`its record names \`${said}\` at line ${String(reference.line)}, and the first round names no earlier round`);
    const named = reference.round < given.round ? given.earlier.find((each) => each.round === reference.round) : undefined;
    if (named === undefined) throw new ChainStop(`its record names \`${said}\` at line ${String(reference.line)}, which is not an earlier record of this work item`);
    if (reference.finding !== null && !named.findings.some((finding) => finding.number === reference.finding)) throw new ChainStop(`its record names \`${said}\` at line ${String(reference.line)}, and round-${String(reference.round)}.md holds no finding ${String(reference.finding)}`);
  }
  const before = given.earlier.at(-1) ?? null;
  // ... the check of each fixed or rejected finding of `before`, as now ...
}

// chain.ts, fixPassRecord: each close carries its finding's places.
const closes = now.findings.flatMap((finding) => (finding.close !== null && wasOpen.has(finding.number) ? [{ finding: finding.number, located: finding.located, close: finding.close }] : []));

// chain.ts, fixedCommitsHeld: after the two checks it makes now.
const touched = await pathsOfCommits(worktree, `${close.commit}^`, close.commit);
const places = [...located, ...close.located];
if (!touched.some((path) => places.some((place) => inFolder(path, place)))) throw new ChainStop(`finding ${String(finding)} is closed \`fixed ${close.commit}\`, and that commit touches no path its \`location:\` names: a fix that went elsewhere names that path on a \`location:\` line of its close block`);
```

`standingOf` refuses a record with any refusal, so a standing round's `findings` hold every numbered heading, which is what the check's `held` holds. The snippet leaves other statements of the fact to the fix pass: `changelog.md:8`, the two rule changes, *Scope* items 6 and 7 (`frame/design.md:83-84`), the paragraph of `gaps.md:40`, the row of `pr.md:8`, the doc comments of `roundRecordOf` and `fixedCommitsHeld`, and the cases of `test/chain.test.ts` "a round's answer" and "a fix pass held to its record", which owe one case for each new refusal. Where the fix pass keeps the gap instead, the changelog sentence and both rule changes are rewritten to say which refusals the daemon does not hold.

```seal
verdict: fixed 1c8a033
location: `apps/desktop/src/daemon/worktrees.ts`, `apps/desktop/test/chain.test.ts`, `apps/desktop/test/worktrees.test.ts`
answer: The daemon now refuses each of the four kinds, so the claim was kept and the filter widened. `chain.ts#roundRecordOf` takes every earlier record (`earlier`, from `standingOf`) and refuses a `confirms:`, `reopens:` or `regression:` line in the first record, one that names a round that is no earlier record, and one that names a finding its record does not hold, each with the line. `chain.ts#fixedCommitsHeld` refuses a `fixed` whose commit changed no path the finding's `location:` or the close block's names. The fix is written in other words than the record's: a commit's paths are read with `git diff-tree --no-commit-id --name-only -r --root -z`, the check's own command, in the new `worktrees.ts#pathsOfCommit`, since the record's `<commit>^..<commit>` fails on a first commit and lists a merge's paths, which the check does not. The fix also went to `worktrees.ts` and to two test files, which the close's `location:` names. Each refusal has a case, and each guard was shown red by `seal mutate`. `53b0453` drops a comparison of that lookup that held nothing. One kind outside the records arm stays: in a repository that declares a migration, the check's parity arm asks each round record for an `original:` line, which the daemon does not hold. `changelog.md` and `gaps.md` *Not done* now say so in place of the earlier claim and the earlier paragraph. `frame/design.md` *Scope* items 6 and 7, both editions of its rule change on *Records are committed to the repository* and `pr.md` are not the fix pass's to write, and the hand-back names each sentence for the orchestrator.
```

### 2. A fix pass on round 2 or later runs with no convergence judgment where the chain stopped between a ruling on a question and that judgment

```seal
severity: should
location: `apps/desktop/src/daemon/chain.ts:224-231`, `apps/desktop/src/daemon/daemon.ts:2240`, `apps/desktop/src/shared/protocol.ts:300`, `seal/threads/1795388700-review-rounds/gaps.md:54`, `seal/threads/1795388700-review-rounds/frame/design.md:86`
evidence: read `apps/desktop/src/daemon/chain.ts:186-231`, `apps/desktop/src/daemon/daemon.ts:1880-1891`, `apps/desktop/src/daemon/daemon.ts:1960-2016`, `apps/desktop/src/daemon/daemon.ts:2240-2256`, `apps/desktop/test/chain.test.ts:1509-1530`
```

Why it matters: issue #41 asks that "the judgment whether the rounds are converging is asked of the orchestrator agent", and `docs/architecture.md` *Code runs the order, the orchestrator judges* gives that judgment to the orchestrator. `gateBefore` skips it at a person's first step where "the chain's last stored stage is a judgment after that round that finished" (`chain.ts:229`). A ruling on a stage's question is stored with the same kind, `judgment` (`daemon.ts:2243`), so a ruling reads as an answered convergence judgment.

`gaps.md:54` names the edge as a chain "cut" between the two judgments, and the frame accepts it at `frame/design.md:86`, but the grounds it gives are the frame's own *Data & interfaces*, which the build folded, and no policy. The paths that reach the edge are more than the daemon's end. Each stop between the two stages reaches it: a parked chain whose resume is refused (`daemon.ts:1880-1891`, then the person's `getSeal`), a worktree that left its branch, a work item archived and restored, and a round record that no longer reads. Read on round 2 with `test/chain.test.ts:1509-1530`'s path: the proofer of round 2 asks a question, the orchestrator parks it, the answer's resume is refused for a loose file, and the person's `getSeal` runs the fix pass of round 2. At that step `sinceRound` holds the ruling alone, `passedBefore` is false, `run.first` is true and the last stage is a finished `judgment` of round 2, so `gateBefore` gives `none`. That case runs on round 1, where no judgment is owed, so it does not show this. The ceiling bounds the cost, and the frame's "the person's start is the answer" rests on a `no` that was never asked.

A fourth kind of stage tells the two apart with no new field:

```ts
// protocol.ts:300
export const CHAIN_STAGE_KINDS = ["round", "fix-pass", "judgment", "ruling"] as const;

// chain.ts, stageName: a ruling on a stage's questions has its own name.
if (kind === "ruling") return `The ruling after round ${String(round)}`;

// daemon.ts, runRuling: the stage is stored as a ruling, so `gateBefore` reads `judgment` as the convergence judgment alone.
await this.runStage(item.id, "ruling", round, ORCHESTRATOR, item.worktree, prompt, async (answer, refused) => { /* as now */ });
```

`stageCell` (`chain.ts:584-586`) then writes `ruling 2` in `trail/refusals.md`, and `sinceRound` needs no change, since it walks back over every kind but `round`. The fix pass owes the other statements of the fact: the head comment of `gateBefore` (`chain.ts:220-222`), *Scope* item 9's last sentence and the `CHAIN_STAGE_KINDS` line of *Data & interfaces* (`frame/design.md:86`, `:172`), the paragraph of `gaps.md:54` and the row of `pr.md:10`, the changelog's list of a stage's kinds (`changelog.md:16`), the stage cell's spelling in *Data & interfaces*, and the cases of `test/chain.test.ts` that expect a ruling as `["judgment", 2, "finished"]`. A case on round 2 that parks, refuses the resume and starts by a person's `getSeal` pins the judgment.

```seal
verdict: fixed 2093738
answer: The record's fix holds against the code and was applied: a ruling on a stage's questions is stored as a stage of the kind `ruling`, the fourth of `CHAIN_STAGE_KINDS`, so `gateBefore` reads a stored `judgment` as the judgment of convergence alone. `stageName` says "The ruling after round N", and a row of `trail/refusals.md` reads `ruling N`. The new case of `test/chain.test.ts` parks round 2 on its proofer's question, has the answer's start refused and starts by a person's `getSeal`. It failed against the old code with the fix pass started and no orchestrator asked, and passes now. `changelog.md` names the kind, and the paragraph of `gaps.md` on the edge left. The frame's sentences on the kind (`frame/design.md` *Scope* item 9 and *Data & interfaces*) and the row of `pr.md` are named in the hand-back.
```

### 3. A base branch whose name the round block's shape does not take fails every round 1

```seal
severity: should
location: `apps/desktop/src/daemon/chain.ts:177`, `apps/desktop/src/daemon/daemon.ts:1982`
evidence: read `apps/desktop/src/daemon/record-blocks.ts:353`, `pr-check/lib/fields.py`, `apps/desktop/src/daemon/chain.ts:622-633`, `apps/desktop/src/daemon/daemon.ts:1982`
```

Why it matters: round 1's target is `<head> against <baseBranch>` (`chain.ts:177`, `daemon.ts:1982`), and the round block's shape takes a base only as `[\p{L}\p{N}_./-]*[\p{L}\p{N}_]` (`record-blocks.ts:353`, `fields.py` `[\w./-]*\w`). Git allows a branch name with `+`, `@`, `#`, `,` or `!`, and one that ends in `-`. On such a base the proofer copies the target line the prompt gives, the daemon's own reader refuses it, and `roundRecordOf` stops the round with the reader's sentence on the shape. The next `getSeal` builds the same line, so the chain never passes round 1, and the sentence names the shape and not what the person can change. The base commit is always a word the shape takes, and the check reads its own baseline, not the target's base.

```ts
// daemon.ts:1982. `ROUND_BASE` is the round block's base, exported from record-blocks.ts beside ROUND_BLOCK.
const base = baseBranch !== null && ROUND_BASE.test(baseBranch) ? baseBranch : (baseCommit ?? head); // NAME NOT IN TREE: ROUND_BASE
const standing = await standingOf(worktree, directory, head, base);
```

`ROUND_BASE` is `new RegExp("^[\\p{L}\\p{N}_./-]*[\\p{L}\\p{N}_]$", "u")`, and `ROUND_BLOCK`'s `target:` shape is built from the same text, so the base's shape has one source. The case belongs in `test/chain.test.ts` "a work item's chain": a work item whose `baseBranch` is `feat/a+b` gets round 1's target against its base commit.

```seal
verdict: fixed 6707b66
location: `apps/desktop/src/daemon/record-blocks.ts`, `apps/desktop/test/chain.test.ts`
answer: Applied as the record shows, with the choice in a function of its own: `chain.ts#roundBase` gives the work item's base branch where `record-blocks.ts#ROUND_BASE` takes its name, and otherwise the base commit, or the head. `ROUND_BLOCK`'s `target:` shape is built from the same text as `ROUND_BASE`. The fix also went to `record-blocks.ts`, which the close's `location:` names. A case of "a work item's chain" runs a work item whose base branch is `feat/a+b`: it failed against the old code with round 1 refused by the daemon's own reader, and passes with the target against the base commit. `frame/design.md` *Scope* item 5 still gives the base without this condition, and the hand-back names it.
```

### 4. After a chain that no press started has run, the window shows a refusal that no longer holds under "Get a seal"

```seal
severity: should
location: `apps/desktop/src/renderer/work-item-view.ts:93`, `apps/desktop/src/renderer/work-item-view.ts:831-862`, `seal/threads/1795388700-review-rounds/frame/design.md:112`
evidence: read `apps/desktop/src/renderer/work-item-view.ts:825-865`, `apps/desktop/src/renderer/view.ts:2153-2176`, `apps/desktop/src/daemon/daemon.ts:907-908`, `apps/desktop/src/daemon/daemon.ts:1908-1931`
```

Why it matters: `sealRefused` is set at a refused press and cleared only by the daemon's `done` to the next press (`work-item-view.ts:855-860`). `sealButton` hides it while the chain runs and shows it again once the chain rests (`view.ts:2174`). A chain can run without a press: a parked chain starts again at the answers (`daemon.ts:907-908`). The button is on while the chain is parked, and a press then is refused with "The work item waits for the answers to its open questions. Answer them first." After the person answers, the chain runs, rests `reviewed` or `stopped`, and the view shows "The review rounds settled at 1a2b3c4, after round 3." above the button with that refusal under it, although no question is open. *Scope* item 26 says when the refusal leaves and is silent on a chain the window did not start, and the build kept the stale sentence. A person reads it and acts on it.

```ts
// work-item-view.ts: a refusal holds for the chain as it stood when the daemon gave it.
let sealRefused: { workItemId: number; says: string; since: number | null } | undefined;

// takeSeal
const refusedFor = held.workItems.find((item) => item.id === sealRequest?.workItemId);
sealRefused = refusal === null ? undefined : { workItemId: sealRequest.workItemId, says: refusal, since: refusedFor?.chain?.stages.at(-1)?.startedAt ?? null };

// showSeal, before `sealButton`: a stage that started since the refusal means the chain ran, so the refusal no longer stands.
if (sealRefused?.workItemId === workItem.id && (workItem.chain?.stages.at(-1)?.startedAt ?? null) !== sealRefused.since) sealRefused = undefined;
```

The newest stage's start is read, not the count of the stages, since the count stops at `CHAIN_STAGES_KEPT`. *Scope* item 26 (`frame/design.md:112`) and the doc comment of `sealButton` owe the condition, and `test/get-a-seal.test.ts` or `test/view.test.ts` owes a case of a refusal that leaves once a stage has started.

```seal
verdict: fixed c53978e
location: `apps/desktop/src/renderer/view.ts`, `apps/desktop/test/view.test.ts`
answer: Fixed in other words than the record's. A refusal is kept with the chain's state and the time the chain took it (`view.ts#refusedSeal`), and `view.ts#sealButton` says it only while the chain stands so. The record's marker, the newest stage's start, keeps a refusal that no longer holds where a chain runs and stops before any stage starts, as a start refused after the answers does. The marker reads `Chain.since`, which finding 5's fix adds in the same commit. The fix also went to `view.ts`, which the close's `location:` names. A case of `test/view.test.ts` holds a refusal given while the chain was parked, which is not said once the chain is stopped or reviewed, nor in the same state since a later time. It was shown red by `seal mutate` with each half of the comparison removed. No case of the built app parks a chain and reads the foot, which `gaps.md` *Not verified* names. `frame/design.md` *Scope* item 26 is named in the hand-back.
```

### 5. The age on a stopped chain's line counts from an older stage where the chain stopped outside a stage

```seal
severity: should
location: `apps/desktop/src/renderer/view.ts:179-190`, `apps/desktop/src/shared/protocol.ts:300`, `seal/threads/1795388700-review-rounds/frame/design.md:113`
evidence: read `apps/desktop/src/renderer/view.ts:168-190`, `apps/desktop/src/daemon/daemon.ts:1880-1891`, `apps/desktop/src/daemon/daemon.ts:1960-2016`, `apps/desktop/src/daemon/chain.ts:258-291`
```

Why it matters: `lineSince` counts a stopped chain's line from `chain.stages.at(-1)?.endedAt` (`view.ts:187`). A chain stops at several points where no stage ended just then. A resume refused at the answers (`daemon.ts:1890`) keeps the ruling's end, which may be hours old, since the person answered later. A stop at the first step of a later `getSeal` keeps the end of the newest stage of an earlier start, which may be days old. The read of the order between two stages can throw, for a round record that no longer reads, and so can the routing. The line under "Needs you" then shows an age that says the work item has waited much longer than it has, and the inbox's order of attention rests on that age. *Scope* item 27 states the rule as built, and no document gives the reason for it.

The chain holds no time of its own state, so the fix gives it one. `Chain` gains `since: number`, the daemon's clock when the chain took its state, set wherever `chainSet` changes `state`, and `lineSince` reads `chain.since` for a stopped chain. `chainRead` reads a chain an earlier build wrote with no `since` as its newest stage's end. The fix pass owes *Scope* item 27 and the `Chain` line of *Data & interfaces* (`frame/design.md:113`, `:174`), the changelog's list of a chain's fields, and a case in `test/view.test.ts` of a chain stopped after its newest stage ended.

```seal
verdict: fixed c53978e
location: `apps/desktop/src/daemon/chain.ts`, `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/src/daemon/repositories.ts`, `apps/desktop/test/chain.test.ts`, `apps/desktop/test/view.test.ts`
answer: Applied as the record shows. `Chain` gains `since`, the daemon's clock when the chain took its state, set at each start, at each rest and where a start is refused after the answers. `view.ts#lineSince` counts a stopped chain's line from it. A chain stored `running` is read as stopped since the clock of the daemon that reads it, and a chain written with no `since` as in its state since its newest stage ended. The fix also went to `chain.ts`, `daemon.ts` and `repositories.ts`, which the close's `location:` names. A case of `test/view.test.ts` failed against the old code with the age counted from the stage's end, and a case of `test/chain.test.ts` runs the daemon on a clock that moves. `3c09305` and `b40847f` sharpen that case, after `seal mutate` showed two of the three writes unwatched. `changelog.md` names the field and the age. `frame/design.md` *Scope* item 27 and the `Chain` line of *Data & interfaces* are named in the hand-back.
```

### 6. The foot's new parts are drawn in forms `docs/design.md` does not state, and no rule change adds them

```seal
severity: must
location: `seal/threads/1795388700-review-rounds/frame/design.md:242`, `apps/desktop/src/renderer/index.html:412-417`, `docs/design.md:440`
evidence: read `docs/design.md:18`, `docs/design.md:425-446`, `apps/desktop/src/renderer/index.html:409-417`, `apps/desktop/src/renderer/index.html:672-678`, `seal/threads/1795388700-review-rounds/gaps.md:72`
```

Why it matters: `docs/design.md:18`, principle 8, reads "**Every form is stated here.** ... A change that needs a form this document does not state adds it here first, so that no work item draws its own." The view's foot now holds the chain's sentence in `--ink` at `--size-second`, the main button "Get a seal" under it, and the daemon's refusal in `--state-failed` under the button (`index.html:412-417`). *The seal's place* row (`docs/design.md:440`) states the seal's drawing alone, and no row states a sentence or a refusal in that place. A refusal in `--state-failed` in the proportional face is a form no row gives, since the one row that draws an error in `--state-failed` draws it in the fixed-width face (`docs/design.md:431`). `gaps.md:72` names the gap as not done, and the reason it gives, that *Rule changes* names no operation on that document, is the gap itself. The policy is written from *Rule changes* at the settle, so the fix is two operations there, on the English and the Korean editions:

```
- change
  file: docs/design.md
  section: Components and their states
  from: | The seal's place | Before a seal: on a line a disc of `--seal-blank-ground` with `--seal-blank-edge`, and in the preview and at a view's foot the seal's drawing pressed into the ground in the blank tones under `--seal-blank-light`. Sealed: the seal as it is drawn, under `--seal-light`. | — | — | — | — | — |
  to: | The seal's place | Before a seal: on a line a disc of `--seal-blank-ground` with `--seal-blank-edge`, and in the preview and at a view's foot the seal's drawing pressed into the ground in the blank tones under `--seal-blank-light`. At a view's foot a column of words stands beside the drawing: the state of the seal, its note in `--ink-muted`, where the review chain stands in `--ink`, the main button "Get a seal", and under it why the daemon refused the last press, in `--state-failed`, each at `--size-second` and wrapped. Sealed: the seal as it is drawn, under `--seal-light`. | — | — | — | — | — |
```

The Korean operation changes the same row of `docs/design.ko.md` in the same words, so the broad gate's count of table rows stays equal. The orchestrator owes the two operations, since no crafter writes the frame. `gaps.md:72` then leaves. The screenshots show the button at rest alone (`gaps.md:70`), so this round could read the button's form against *The main button* row and could not read the sentence's or the refusal's against a screenshot.

```seal
verdict: fixed aee5611
answer: The orchestrator's `aee5611` adds to `frame/design.md` *Rule changes* the two `change` operations the record shows, on *Components and their states* of `docs/design.md` and *부분과 그 상태* of `docs/design.ko.md`, each with the record's words for the view's foot and a `check:` line naming `test/get-a-seal.test.ts` and `test/view.test.ts`, and removes the line of `gaps.md` that named the gap. The fix touches the work item's records alone.
```

### 7. `pr.md` is the orchestrator's prose where the plugin asks for quotes, and two of its sentences do not hold

```seal
severity: should
location: `seal/threads/1795388700-review-rounds/pr.md:1-24`
evidence: read the plugin's `skills/code-review/orchestration.md:370-416`, `skills/implement/SKILL.md:292`, `seal/threads/1795388700-review-rounds/pr.md`, `seal/threads/1795388700-review-rounds/trail/phases/phase-1.md:55`, `seal/threads/1795388700-review-rounds/frame/plan.md:22`, `seal/threads/1795388700-review-rounds/frame/questions.md:18`; executed `head -5` over every `pr.md` under `seal/threads/`
```

Why it matters: the plugin's text requires quotes. `skills/code-review/orchestration.md` *Orchestrator: the pull request opens once the sealer seals*, at lines 376 to 389, reads: "`pr.md` holds the `Closes` and `Part of` lines, quotes of the work item's records, and the attribution line." It goes on: "A quote stands on its own line, in a list item or in a table cell, and its coordinate follows it: the record's path, then the heading, row, finding or line that holds the sentence." And: "`pr.md` holds no sentence of the orchestrator's own account: no sentence frames a quote or joins two, and no heading or bold lead-in of the orchestrator's stands in it." `skills/implement/SKILL.md:292` points to that passage for `pr.md`'s shape. This `pr.md` holds no quote and no coordinate: its opening paragraph frames the table, each cell of *What holds now* is the orchestrator's own summary, and `### Screenshots` is a heading of its own. Every `pr.md` on `release/v0.0.2` has the same prose form (executed: `head -5` over each), and nothing in `docs/` names a form for the file, so the release follows its own form. That form is not the plugin's.

Two sentences do not hold at the target, whichever form stands:

- `pr.md:8` claims "Every call it makes to write a file or to run a command is refused and counted." Only a call Claude Code asks permission for reaches the daemon. `frame/plan.md:22` says so: "a command of it that asks for permission is refused". A read-only command the CLI runs without asking is neither refused nor counted.
- `pr.md:13` claims of the case of two rounds and one fix pass "It passed in each phase's run." Phase 1's boundary run held 16 files and no `test/chain.test.ts`, which phase 2 made (`trail/phases/phase-1.md:55`, `frame/plan.md:67`).

The plugin also asks that what the owner must see before the fold be quoted from its record, "such as a default taken" from its `frame/questions.md` row. `frame/questions.md:18` holds Q1 open, with `6` as the default taken under the routing answer, and `pr.md` states the number without saying that it is a default the owner has not answered.

The repair is the orchestrator's. Where it follows the plugin's text, each row's cell becomes the quotes it stands on, each followed by its record's path and coordinate, with Q1's row among them, and the framing paragraph and the heading leave. Where the owner keeps the release's form, the orchestrator records that judgment in `frame/plan.md` *Judgments of the run* with its grounds and corrects the two sentences:

```markdown
Every call it asks permission for, to write a file or to run a command, is refused and counted.
It passed in the runs of phases 2, 3 and 4, which made it and changed it.
```

```seal
verdict: fixed aee5611
answer: The orchestrator's `aee5611` keeps the release's form of `pr.md` and records that judgment, with its grounds, in `frame/plan.md` *Judgments of the run*. It replaces the two sentences with the record's two lines, and adds to the row on the orchestrator's judgment that six rounds is a default taken for a question the owner has not answered. The fix touches the work item's records alone.
```

## Confirmations

What matched: `ROUNDS_CEILING` is 6 (`chain.ts:37`), and `roundsCeiling` overrides it (`daemon.ts:1965`). `gateBefore` (`chain.ts:224-231`) stops at each round from the ceiling on and passes once at a person's first step, and asks no judgment before round 1's pass, a reversal-only pass or a second pass on one record. Read against *Scope* items 9 and 10, with the exception of finding 2.

What matched: `asks:` rulings. `rulingsOf` (`chain.ts:536-550`) requires one ruling per question, refuses a number past the count and a second ruling on one question, and the ruling block refuses `decided:` on a park and requires it otherwise (`record-blocks.ts:489-503`). `runRuling` records `default`, `scope` and `answered` as decisions by `orchestrator` and parks the rest in one `Daemon#park` with the asking role, with `parkedGrounds` joining both grounds (`daemon.ts:2240-2256`, `chain.ts:558-560`). Read.

What matched: `applied` for reversals. `runFixPass` writes each reversal of the prompt `applied <head>` through `withApplied`, with the head the pass left, inside the commit that carries the record (`daemon.ts:2196-2203`), and `stepOwed` stops owing the pass once no decision reads `reversed` (`chain.ts:179`). The check reads no decision record (executed: `grep -rn -e reversed -e decisions.md -e applied pr-check`, which named no rule on decisions), so nothing there refuses or accepts the write. `gaps.md:56` says the write happens where the crafter made no commit too, which is the code.

What matched: `REFUSAL_RULES` (`role-grants.ts:49`) names the four branches of `verdictOn` one to one: `no-write`, `outside-worktree`, `no-command` and `other`. Each refusal pushes the tool, the action and the rule on the session (`daemon.ts:1427-1430`). `refusalsText` writes no call text, puts a `|` of a tool's name as `/` and keeps 100 characters (`chain.ts:589-605`). The rows are written in the stage's commit and not where the stage fails before it, as `gaps.md:50` says. `trail/refusals.md` is no file the check reads, which the frame's probe shows (`frame/design.md` *Grounding*). Read.

What matched: the window. `sealButton` is drawn only where the daemon sent `chain`, null or not. It is off while the chain runs and while the window's own request waits (`view.ts:2165-2176`). The refusal stands under the button and the chain's sentence above it (`index.html:675-677`). `inboxLine` reads a stopped chain as `waiting` and a running one as `working` but where a pane waits (`view.ts:155-168`). `lineText` puts a stopped chain's sentence after a parked question and a call to allow and before what the agent says (`view.ts:1053-1062`). `chainNotifications` tells once for each work item whose chain the window did not hold as stopped, and none for a muted one or the one in front (`view.ts:471-476`). The `ready` message sets the lists with no notification (`renderer.ts:1429-1434`), so a reload raises none. The screenshots `night-watch-dark-view.png` and `night-watch-light-parked.png` were opened: the button stands under the note as the foot's one main button, in each appearance. Read, with findings 4 and 5 as the exceptions.

What matched: the merge `1fe0ddb` of #163. In `src/daemon/daemon.ts` the import keeps #163's `baseDistance` with this branch's reads and `commitPaths`. In `src/daemon/last-look.ts` `CameLater`, the doc comment and `lookOf` hold both `behindBase` and `chain`, and a session keeps `stateQuestions`. `test/daemon.test.ts` lists `behindBase`, `chain` and `stateQuestions`, `test/last-look.test.ts` imports `AskedQuestion` and `Chain`, and `test/worktrees.test.ts` imports `baseDistance` beside this branch's names. Executed: `grep -n "aheadOf\b\|commitAlone" -r src test` in `apps/desktop` printed nothing, so no name either side removed is still called. Read with `git show --cc 1fe0ddb`.

What matched: the stage's process ends before the next stage. `runStage` waits for the session's end, then awaits the run's `stop`, whose promise settles at the process's exit (`adapters/adapter.ts:25-28`), before `after` reads or commits anything (`daemon.ts` `runStage`). Read, with `test/chain.test.ts:675-681`.

What matched: the record writer refuses a link at every folder below the worktree's top, at the file's path and at the partial file's path, and makes the missing folders (`record-writer.ts:41-62`). `decision-record.ts#writeRecord` and the chain's writes go through it. Read.

A gap with no fact of the frame: the case at `test/chain.test.ts:1509-1530` holds the refused resume on round 1 only, so it pins nothing of the judgment finding 2 names; the case that owes it is named there.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the typecheck and the screenshot run at the target. This round ran no test, by contract rule 2, and the label `unverified` in `gaps.md` *Not verified* stands | `apps/desktop` | The orchestrator's broad gate |
| Each new case read against its group. The case names of `test/chain.test.ts` were all read and showed no two of one claim, and the bodies of the cases at `:675-681` and `:1491-1530` were read. The other bodies of its 1634 lines, and of `round-record.test.ts`, `record-writer.test.ts`, `get-a-seal.test.ts` and `view.test.ts`, were not read case by case, so this is a sample | `apps/desktop/test/` | The next round, from these files |
| Whether a real proofer, crafter and orchestrator answer in the forms the daemon reads | `seal/threads/1795388700-review-rounds/frame/questions.md:19` | The first real chain on a branch of Owlery's own |
| How the foot draws a long sentence and a refusal: no screenshot shows either | `seal/threads/1795388700-review-rounds/gaps.md:70` | The orchestrator, with a screenshot of a chain's view, once finding 6's row is written |

## Probes

| Command | Result |
|---|---|
| `python3 -B <plugin>/skills/code-review/scripts/chain_check.py --baseline origin/release/v0.0.2 --root <the branch worktree> --worktree`, with `PATH` set to `/usr/bin:/bin` so no `gh` is asked, before this record was written | Exit 0. The pull request's state is unknown and not judged as ready. It printed that `trail/rounds/` holds no `round-N.md`, and that git carries no `trail/gate.md` and no `guarantee.md`. No notice named a test pin or a copy in `frame/design.md` |
| `grep -n "\.held\b\|located\|diff-tree\|touched" src/daemon/chain.ts src/daemon/daemon.ts src/daemon/worktrees.ts` and `grep -rn "first record\|not an earlier record\|touches no path" src/daemon`, in `apps/desktop` | No reference rule and no touch rule in the daemon, which finding 1 rests on |
| `grep -n "aheadOf\b\|commitAlone" -r src test`, in `apps/desktop` | Nothing printed |
| `grep -rn -e reversed -e decisions.md -e applied pr-check` | Only lines of `chain_check.py` and `rule_changes.py` that read no decision record |
