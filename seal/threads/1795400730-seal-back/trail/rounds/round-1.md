# Review round 1: 1795400730-seal-back

```seal
target: e7458d3 against release/v0.0.2
```

This is the first round, so no earlier round carries a coordinate or a verdict. Every fact below was established in this round, at `e7458d3`, against the base `2737ceb`. The work item's `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and the four phase records were read whole at the target. No `pr.<lang>.md` stands, and none is owed: `Commit and pull request language` is English.

Three of the four findings below come from one change. The work made Owlery write a second section into the pull request's body and made the window draw code in the fixed-width face. Two places did not follow it: a comment in the check still calls every line but the seal's the person's (finding 1), and two texts of the back are drawn without the fixed-width face (finding 2). The deferral of a third place names a home that will not change it (finding 3). One rule of the window's asking is held by no case (finding 4).

## Findings

### 1. The check's comment still says every line of the body but the seal section is the person's, though the daemon now writes the back's section too

```seal
severity: should
location: `pr-check/skills/code-review/scripts/chain_check.py:1885-1888`, `seal/threads/1795400730-seal-back/frame/design.md:108`
evidence: read `pr-check/skills/code-review/scripts/chain_check.py:1885-1888`, `seal/threads/1795400730-seal-back/frame/design.md:108`, `apps/desktop/src/daemon/github.ts`
```

The comment above `SECTION_OPEN` reads: "Every other line of the body is the person's, and no arm reads it." At `e7458d3` that is half true. No arm reads another line, and `marker_of` still knows only the seal's two markers. But `github.ts#withBackSection` now writes the back's section, between `owlery:back` markers, below the seal section, and rewrites it at each seal. Those lines are Owlery's, not the person's.

This work rewrote the same fact in the policy document. Its rule change for `docs/architecture.md` *Records are committed to the repository* removes "reads no other line of the body, which is the person's to edit" and says the daemon writes the back below the seal section. The comment states the old fact in a third place. `skills/core/SKILL.md` *The rule a mechanism is kept against* asks a change to remove, in the same commit, what stood on the old fact, and names a comment among them. `docs/architecture.md` (line 151) says Owlery changes its copies of the check's scripts. So no rule keeps `pr-check/` byte for byte.

The frame chose the other way: `frame/design.md` *Scope* item 25 says "No line of `pr-check/` changes in this work." The task asked this round to judge whether the work owes this comment. It does. The comment is a statement about the body that this work changed, and a later editor of the check who reads it would treat the back's lines as free text a person may edit.

Fix: rewrite the comment, and let item 25 allow it.

```python
# The pull request's body, read from the event payload: its seal section
# alone, the lines between two marker lines, which Owlery's daemon writes as
# a copy of the newest verdict block of the work item's `guarantee.md`. No
# arm reads another line of the body: the back of the seal, which the daemon
# writes between markers of its own below the seal section, nor the lines the
# person writes.
```

```markdown
25. **The check reads none of it.** The body arm reads the seal section alone: `chain_check.py#marker_of` knows the seal's two marker lines and no other, and no arm reads another line of the body. The one line of `pr-check/` this work changes is the comment above `SECTION_OPEN`, which said every other line was the person's.
```

### 2. The back draws a finding's symptom and a breaking commit's subject with their backticks as written, though the design row this work adds says code stands in the fixed-width face

```seal
severity: should
location: `apps/desktop/src/renderer/shared.ts:465`, `apps/desktop/src/renderer/shared.ts:503`
evidence: read `apps/desktop/src/renderer/shared.ts:465`, `apps/desktop/src/renderer/shared.ts:503`, `docs/design.md:454`; executed `git grep -h -E "^### [0-9]+\. .*\`" -- 'seal/threads/*/trail/rounds/*.md'` (61 of the tree's 171 finding headings hold a backtick)
```

`findingLine` draws the symptom with `part("says", line.says)`, and `backParts` draws a breaking commit's subject with `part("subject", back.brokenBy.subject)`. `part` sets plain text. Every other text of the back that can hold code goes through `withCode`: the seal's words, the "why", the "Broken by" sentence and the close.

The new row of `docs/design.md` (line 454), *The back of the seal*, says "Code in a text stands in the fixed-width face." A finding's symptom is the heading a proofer writes, and the plugin's template puts paths and identifiers in backticks there. In this tree, 61 of the 171 finding headings in round records hold a backtick. So a typical round shows raw backticks on the back, while the same heading in the pull request's body renders as code. `changelog.md` says the window and the body show the same back.

Fix:

```ts
// shared.ts, findingLine
return item("finding", part("number", `${String(line.number)}.`), withCode("says", line.says), withCode(line.open ? "close open" : "close", line.close), row(part("severity", line.severity), places), ...(line.names === null ? [] : [part("names", line.names)]));

// shared.ts, backParts
broken.append(" ", withCode("subject", back.brokenBy.subject));
```

Also give a finding heading in `test/seal-back-view.test.ts` a backticked word, and assert that the back holds a `code` element for it and no backtick character.

### 3. The deferral of the backticks at the view's foot names issue #44 as their home, but #44 merged and its records leave that sentence to the owner

```seal
severity: should
location: `seal/threads/1795400730-seal-back/gaps.md:27`, `seal/threads/1795400730-seal-back/pr.md:18`
evidence: read `seal/threads/1795400730-seal-back/gaps.md:27`, `seal/threads/1795400730-seal-back/pr.md:18`, `seal/threads/1795396351-seal-breaks-after-a-commit/gaps.md:34`, `seal/threads/1795396351-seal-breaks-after-a-commit/trail/rounds/round-1.md:164`
```

Claimed: `gaps.md` *Not done* says the raw backticks of a broken seal's sentence, at the right column's foot and under the approval line, are "issue #44's ground, which changes those two places, so this work leaves it". `pr.md` line 18 repeats this: "That is #44's ground".

Found: #44's code is already in the base. It merged as `3868fa8`, which this branch merged at `cad4a64` and `90184d5`, and the issue stays open only until the release. #44's records keep the backticks on purpose. Its `gaps.md` (line 34) says phase 5 left them as written. Its round 1 put the question in *Not judged*, answered by the owner with its `frame/questions.md` Q1 (`round-1.md`, line 164). No open work item will change those two places. A reader of this pull request would expect a fix from #44 that #44 does not hold.

The work now draws the same sentence two ways in one window. The back sets the code in the fixed-width face, and the foot shows the backticks. Either name the true home or draw the two places with `withCode` here.

```markdown
Phase 4: the right column's foot and the approval line show a broken seal's sentence with its backticks as written, where the back draws the words between them as code. Phase 3 found it. Issue #44, which merged, left that sentence as written and put the question to the owner with its `frame/questions.md` Q1, so this work leaves it to the owner's answer there.
```

`pr.md` line 18 follows the same wording.

### 4. No case holds that the window asks for the back again when the viewed work item's seal, records or chain changes while the back is in front

```seal
severity: should
location: `apps/desktop/src/renderer/work-item-view.ts:1097`, `apps/desktop/test/seal-back-view.test.ts:172`
evidence: executed in a clone at e7458d3, with `|| backAsked.key !== key` removed from `work-item-view.ts:1097`: `OWLERY_BACKGROUND=1 pnpm test test/seal-back-view.test.ts test/view.test.ts` through the Electron lock, 2 files and 498 tests passed, exit 0 (probe)
```

`frame/design.md` *Scope* item 19 says the window asks again where `seal`, `recorded` or `chain` differs from what it asked for. `showBack` holds this with `backAsked.key !== key`. The built-app case checks the other half of the rule: a list that leaves the key as it was asks nothing. No case changes the key while the back is in front. `test/view.test.ts` pins only the values of `backKey`, and `git grep -n "readSealRecords" -- test` finds the request only in `test/chain.test.ts`, `test/daemon.test.ts` and `test/seal-back-view.test.ts`.

With the condition removed, the suite stays green. In that build, a seal that breaks, or a round that lands, while the person reads the back would leave the old back on screen until the tab is left and opened again.

Fix: add a step to the built-app case after "the back drawn again". The numbers follow from the counts the case asserts before that step.

```ts
// A commit after the seal breaks it while the back is in front: the seal in the view's key changes, and the back is asked for again.
commitFile(sealed.worktree, "later.ts");
await app.until(`document.querySelector("#back .broken-by")`, "the sealed work item's back drawn again as broken");
expect(await sent()).toEqual({ readSealRecords: 3, readLedger: 3 });
```

## Confirmations

What matched, each read at `e7458d3` unless a probe is named:

- The ledger carries a chain (Scope items 1 and 2). `ledger.ts#entryOf` now needs `chain`, `beginHeadless` passes `HeadlessSession.chain` through, and `runGate` writes `{kind: "gate", round}`. A session asked from a pane carries no chain.
- A finding's places, severity and close answer are read (Scope item 3). `round-record.ts` reads `severity:` and `location:` into `Finding.severity` and `Finding.places`, and `answer:` into `Close.answer`.
- The records are read at the head (Scope items 4 to 8). `sealRecords` reads the round files at the head. `recordOf` takes the newest `sealed` verdict and counts rounds at the sealed commit, or else at the head. `brokenByOf` uses `worktrees.ts#firstCommitOutside` with `--first-parent` and excludes the closing records. `chain.ts#readRefusals` reads the refusals table.
- The daemon answers the read (Scope item 9). `readSealRecords` answers with the records, refuses an unknown work item with "no work item N", and refuses an unreadable head with the sentence the frame gives.
- The composition follows the frame (Scope items 10 to 15). `composeBack` counts a defect only where a close is `fixed`, keeps converted costs apart from charged ones, counts a stage with no cost and leaves the gate out of that count, lists sessions outside the chain on their own line, and puts a ruling that follows the seal's entry of the same round after the seal.
- The tab is placed and asked for as the frame says (Scope items 16 to 19). The back's tab stands first, `opensToBack` opens a sealed work item to it, and the case shows the back dropped while a pane is in front and asked for again when its tab returns. Finding 4 is the one gap.
- The body's section follows the frame (Scope items 22 to 24). `backSection` writes under the seal section. `withBackSection` replaces the back's section at an edit and touches no other line. `pullRequestBody` gives way at the limit in the order Scope item 24 states.
- The marker rule holds against a probe (Scope item 27). Claimed: the case at `test/pull-request.test.ts` tells the rule from `trim`. Executed in the clone, with `marked` reading `markerOf(line.trim())`: `pnpm test test/pull-request.test.ts -t "replaces a part whose text holds a marker line"` failed at the U+FEFF iteration, exit 1. The clone was restored afterwards.
- `## Review rounds` is gone (Scenario 18). `BodyRecords.rounds` and the part are removed, and the body case's expected text holds no such part.
- The changelog rewrites are made. The two earlier bullets Scope item 26 names are rewritten, and `docs/architecture.md`, `docs/product.md` and `docs/design.md` with their Korean pairs carry the rule changes' `to` texts. `docs/design.md` and `docs/design.ko.md` hold the same 15 headings and 379 table lines.
- The screenshots match the tree. `pr.md` links the screenshots at `39991c3`, which holds 24 of them. After that commit only `shared.ts`, `work-item-view.ts` and `seal-back.ts` changed in `src/renderer` and `src/shared`. The `seal-back.ts` change moves `STAGE_COLUMNS` with the same words, and the others redraw at a change and add comments. No drawn pixel changes. The two screenshots viewed, `night-watch-dark-finished.png` and `register-light-broken.png`, show the back as the design row describes.
- Each Done-when line of `pr.md` matches the code and the cases named above, and each quote in `pr.md` stands word for word at the source its coordinate names.
- The crafter's label is honest. The phases hand over with the suite labelled `unverified`. This round ran six modules narrow, `pnpm test test/seal-back.test.ts test/seal-back-records.test.ts test/round-record.test.ts test/ledger.test.ts test/pull-request.test.ts test/view.test.ts`, through the Electron lock in a clone: 6 files and 562 tests passed, exit 0. That is a narrow run, not the broad gate.

## Not judged

| What | Location | Who answers |
|---|---|---|
| How GitHub renders the back's section, a round's findings as "- 1. ..." among them | `apps/desktop/src/daemon/github.ts#backSection` | the walk of issue #48 (`frame/questions.md` Q4) |
| `frame/questions.md` Q1 to Q3 | `seal/threads/1795400730-seal-back/frame/questions.md` | the owner |
| Whether opening the same view again from the sidebar or from a notification without a pane should bring the back in front, as it does | `apps/desktop/src/renderer/work-item-view.ts#enterView` | the owner, under `frame/design.md` *Scope* item 18 |
| A round file named `round-01.md` or `round-0.md` is read by `chain.ts#roundNumber` and refused by the check's `ROUND` pattern | `apps/desktop/src/daemon/chain.ts#roundNumber` | the orchestrator, if such a name is ever written |
| The broad gate at the head | the suite | the orchestrator's broad run, then the sealer's spawn |
| Whether `changelog.md` bullet 4's "counted at the foot" should say that a record's unread lines stand under their round | `seal/threads/1795400730-seal-back/changelog.md:8` | the orchestrator; the sentence reads true of the ledger's lines and is not filed |

## Probes

| Command | Result |
|---|---|
| `pnpm test test/seal-back.test.ts test/seal-back-records.test.ts test/round-record.test.ts test/ledger.test.ts test/pull-request.test.ts test/view.test.ts`, through the Electron lock, in a clone at `e7458d3` | 6 files, 562 tests passed, exit 0 |
| `OWLERY_BACKGROUND=1 pnpm test test/seal-back-view.test.ts test/view.test.ts`, with `\|\| backAsked.key !== key` removed from `work-item-view.ts:1097` (one built-app start) | 2 files, 498 tests passed, exit 0: the mutant survives (finding 4) |
| `pnpm test test/pull-request.test.ts -t "replaces a part whose text holds a marker line"`, with `marked` reading `markerOf(line.trim())` | 1 failed at the U+FEFF iteration, exit 1: the case holds Scope item 27 |
| `git grep -h -E` over the finding headings of `seal/threads/*/trail/rounds/*.md`, for a heading that holds a backtick | 61 of 171 hold a backtick (finding 2) |
| `git grep -n "readSealRecords" -- test` | only `test/chain.test.ts`, `test/daemon.test.ts` and `test/seal-back-view.test.ts` (finding 4) |
| `chain_check.py --baseline 2737ceb --worktree`, with a `gh` that always fails first on `PATH`, before this record | exit 0; no notice at a line of `frame/design.md` naming a test pin or a copy |
