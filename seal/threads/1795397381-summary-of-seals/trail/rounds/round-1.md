# Review round 1: 1795397381-summary-of-seals

```seal
target: 51f2f38 against release/v0.0.2
```

The whole branch was read against `origin/release/v0.0.2` at `3868fa8`, its merge base, in the branch's worktree at `51f2f38`, read only. No probe and no test ran, so no clone was made. No earlier round of this work item stands, so no verdict was carried. Three facts were carried from the phase records and not re-established: phase 1's timings of the hello's read (`trail/phases/phase-1.md:24-31`), phase 3's mutation results (`trail/phases/phase-3.md:32-39`), and the narrow runs of the three phases. The work item's records were read whole at `51f2f38`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-1.md` to `phase-3.md`, with the six files under `screenshots/`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. The tree holds no `seal/parity.json`, and the `seal/` root's `config.json` holds no `Pact` key. Issue #22 was read with `gh issue view 22`.

The axes named for this change beyond the table: what a person reads on the summary's controls and hint against what Enter does, the order the summary draws against the order the main control reads, a late seal reading in the window against the frame's *Scope* item 13, and the release's other changelog fragments that this work rewrote.

## Findings

### 1. No case holds the window's join of a seal read after `ready`, and a built-app start can reach it

```seal
severity: should
location: `apps/desktop/test/decisions-and-questions.test.ts`, `apps/desktop/src/renderer/renderer.ts:1221`, `seal/threads/1795397381-summary-of-seals/gaps.md:13`
evidence: executed `git grep -n 'changedSetAfter\|redrawSummary' -- apps/desktop/test` (only `apps/desktop/test/view.test.ts` names `changedSetAfter`); read `apps/desktop/src/main/daemon-client.ts:53`, `apps/desktop/test/built-app.ts:196`, `apps/desktop/test/chain-run.ts:98-120`, `apps/desktop/src/daemon/daemon.ts:696`, `seal/threads/1795397381-summary-of-seals/trail/phases/phase-3.md:34`, `seal/threads/1795397381-summary-of-seals/trail/phases/phase-3.md:39`
```

Why it matters: `frame/design.md` *Scope* item 13 and the `add` operation on `docs/product.md` *Foundation* promise that a seal the daemon reads after the window loaded joins the summary. One line delivers it in the window: `renderer.ts:1221` calls `changedSetAfter` in `takeLists`. Phase 3's mutant that removed that line survived (`trail/phases/phase-3.md:34`). The window also draws a joined work item's title in the strong ink through `shared.ts#changedSince`, and no case reaches that either. A later edit can drop the join, and the suite stays green while the promise in the policy fails.

Grounds:

- Claimed (`trail/phases/phase-3.md:39`, `gaps.md:13`): no built-app start can send `ready` before the daemon reads the sealed branch, because no start can set `readyWaitMs`, so "such a case needs a start whose hello's read takes longer than `ready` waits". The first half is true: `daemon.ts:696` reads `readyWaitMs` from the daemon's options alone, and `daemon/main.ts` passes none. The conclusion does not follow. The app's main process starts the daemon with `{ ...process.env, ... }` (`daemon-client.ts:53`), and `BuiltApp.start` builds the app's environment as `{ ...process.env, ...env }` (`built-app.ts:196`). So a `git` that a case puts first on `PATH` is the git the built app's daemon reads branches with. `test/chain-run.ts#heldGit` (lines 98 to 120) already holds one chosen git command until `release`, and sets `process.env.PATH` for that purpose.
- With such a hold on the command that reads Delta's seal, the hello's read outlasts the 500 ms `ready` waits. The `ready` then carries Delta without `seal`, the look holds Delta with `seal: null`, and Delta is in `unread` and not in `ids`. The release then sends an `inbox` that carries the seal, and only the line at `renderer.ts:1221` moves Delta into the set. That is the start `test/decisions-and-questions.test.ts` already makes, so the case costs no new start.
- The frame's scenario 11 names cases of `test/view.test.ts` alone, and those pin `changedSetAfter` itself (`view.test.ts:2111-2133`). The behaviour this diff adds in the window is the call, and `skills/code-review/SKILL.md` *The record* makes a changed behaviour that no case holds a `should`.

The fix, in sentences, since the git command to hold is not verified here. In `beforeAll` of `test/decisions-and-questions.test.ts`, after the case's own git calls and before `BuiltApp.start`, call `heldGit(cleanups, <a folder of the case>, <when>)`, with `<when>` matching one git command that only the read of Delta's seal runs. The first case then reads the summary at the load without Delta: the sentence is "1 needs you. 1 decision made without asking.", Delta has no line, and its sidebar title is not strong. The case then calls `release()`, and waits until the sentence reads "1 sealed, 1 needs you. 1 decision made without asking." with the summary still in front, Delta's line first and its sidebar title strong. The case is seen red with the call at `renderer.ts:1221` removed. Then `gaps.md:13` closes in place, naming the case.

```ts
// test/decisions-and-questions.test.ts, beforeAll, after the fourth work item's seal is committed and before BuiltApp.start
// The daemon's read of Delta's seal waits until the case releases it, so `ready` goes out without Delta's seal reading.
const heldSeal = heldGit(cleanups, made.root, `[ "$(pwd -P)" = '${fourth.worktree}' ] && [ "$1" = show ]`); // NAME NOT IN TREE: `cleanups` in this file, and which command the seal's read runs in that folder, are unverified
```

### 2. The summary's hint says Enter opens the first that needs you, while Enter opens a later line

```seal
severity: should
location: `apps/desktop/src/renderer/view.ts:1417`, `apps/desktop/test/view.test.ts:3265`, `seal/threads/1795397381-summary-of-seals/screenshots`, `seal/threads/1795397381-summary-of-seals/pr.md:20-25`
evidence: read `apps/desktop/src/renderer/view.ts:1295`, `apps/desktop/src/renderer/view.ts:1411-1417`, `apps/desktop/src/renderer/summary.ts:83-86`, `seal/threads/1795397381-summary-of-seals/screenshots/night-watch-dark-summary.png`, `seal/threads/1795397381-summary-of-seals/trail/phases/phase-2.md:15`
```

Why it matters: the hint tells the person what the Enter key will do, and on the screen this work committed it says the wrong thing. `docs/design.md` *The voice of the window's words* has the window say "what is so and what will happen".

Grounds:

- `summaryOrder` (`view.ts:1295`) puts every line whose seal broke before the lines that changed for other reasons. A broken seal makes its line wait (`view.ts#branchLine`), so that line carries the mark of a line that needs the person.
- `summaryControls` (`view.ts:1411-1417`) passes over such a line where a later line waits on an answer, and says "Answer the first question". The hint stays "Enter opens the first that needs you." under both labels. So wherever a seal broke and another line waits on a question, the hint names the broken line and Enter opens the other one.
- The committed screenshot shows exactly this. In `screenshots/night-watch-dark-summary.png` the second line, "Cache the user avatars", says "Seal broken." and carries the yellow mark. The third line, "Choose the base of the hotfix", is the one "Answer the first question" opens (`trail/phases/phase-3.md:23`). The hint beside the button reads "Enter opens the first that needs you."
- Claimed (`trail/phases/phase-2.md:15`): "The hint names what Enter does, and both labels open one line that waits." Each label does open a line that waits, but not "the first" in the screen's order. The claim does not hold where the two differ.

The fix gives each label its own hint, and the pin follows it. Under "Open the first that needs you" the hint is unchanged, so `seal/threads/1795340000-design-system/changelog.md:11`, which quotes that hint, still holds and needs no edit. The summary view changes, so the fix pass also owes the six screenshots taken again and the links of `pr.md:20-25` moved to the commit that holds them (`docs/design.md` *A pull request that changes the window carries its screenshots*).

```ts
// apps/desktop/src/renderer/view.ts, summaryControls
  return {
    main: { label: answers ? "Answer the first question" : "Open the first that needs you", opens: waits.workItem.id },
    second: inbox,
    // Enter presses the main control, so the hint names the line it opens, which may stand after a line that waits for another reason.
    hint: answers ? "Enter opens the first question." : "Enter opens the first that needs you.",
  };
```

```ts
// apps/desktop/test/view.test.ts:3265
    const answer = (opens: number) => ({ main: { label: "Answer the first question", opens }, second: { label: "Open the inbox", opens: "inbox" }, hint: "Enter opens the first question." });
```

### 3. The changelog says a merged work item's summary line says "Merged", and it says "Finished."

```seal
severity: should
location: `seal/threads/1795397381-summary-of-seals/changelog.md:8`
evidence: read `apps/desktop/src/renderer/view.ts:1201`, `apps/desktop/src/renderer/view.ts:1267-1271`, `apps/desktop/test/view.test.ts:1993-1994`, `apps/desktop/src/renderer/summary.ts:74`
```

Why it matters: the release notes tell a person what a line will say, and the line says something else.

Grounds: `changelog.md:8` says "The line says "Merged", as in the inbox." A summary line's words are the change's sentence (`summary.ts:74`, `part("change", sentence)`). Where the seal says nothing, that sentence opens with `STATE_IN_CHANGE[line.state]` (`view.ts:1271`), and a merged pull request gives the state `finished`, which is "Finished." (`view.ts:1201`). The case at `view.test.ts:1993-1994` pins exactly that sentence for a broken seal under a merged pull request: "Finished. 1 new commit since you were last here." "Merged" is the inbox line's second row, which the summary does not draw. The line's seal place still shows the broken seal (`summary.ts:74`, `sealPlace("line", workItem.seal)`), as the inbox's line does.

```markdown
- **A seal that broke after the work item's pull request merged is no change of its own.** It opens no summary, and where another change lists the work item, its sentence says "Finished." and holds no word of the seal. Its seal still shows as broken, as on its line in the inbox.
```

### 4. `pr.md` sends a line whose agent waits to the wrong label

```seal
severity: should
location: `seal/threads/1795397381-summary-of-seals/pr.md:10`
evidence: read `apps/desktop/src/renderer/view.ts:1398-1400`, `seal/threads/1795397381-summary-of-seals/changelog.md:10`
```

Why it matters: the pull request's body states a behaviour the code does not have, and a reviewer of the pull request reads it as the rule.

Grounds: `pr.md:10` says "Answer the first question" opens "the first line that waits on a question or a call to allow", and that where none does and a line waits for another reason, the control reads "Open the first that needs you". `waitsOnAnAnswer` (`view.ts:1398-1400`) also counts a pane that waits, so a line whose agent waits in its pane gets "Answer the first question". By `pr.md`'s sentence it falls under "another reason". `changelog.md:10` names the three cases.

```markdown
The main control now says why its work item waits. "Answer the first question" opens the first line that waits on a question, a call to allow or its agent's own question. Where none does and a line waits for another reason, such as a broken seal, it reads "Open the first that needs you".
```

### 5. #44's rewritten changelog bullet says the last look carries `seal` for every work item

```seal
severity: should
location: `seal/threads/1795396351-seal-breaks-after-a-commit/changelog.md:14`
evidence: read `apps/desktop/src/daemon/last-look.ts:209`, `seal/threads/1795397381-summary-of-seals/changelog.md:13`
```

Why it matters: the release notes gain two sentences that disagree on one fact a client of the daemon acts on. This work rewrote the bullet to make it true (*Scope* item 17).

Grounds: the rewritten bullet says "wherever the daemon sends a work item whose branch it has read since it started, and in the last look, the work item carries `seal`". `lookOf` leaves the field out where the work item it copies carries none (`last-look.ts:209`), so a look holds a work item without `seal` wherever the daemon had not read its branch. This work item's own fragment says so: "leaves it out where the work item carried none" (`changelog.md:13`). The fix takes the look out of #44's bullet, since this work's bullet states it.

```markdown
- **For a client of the daemon:** wherever the daemon sends a work item whose branch it has read since it started, the work item carries `seal`: `null`, or `state` (`sealed` or `broken`), `commit` (the sealed commit) and `why` (the sentence of a broken seal, `null` where the seal holds). A work item whose branch the daemon has not read since it started carries no `seal`, and a client reads its absence as no seal, as a client of an earlier build does. A chain's `state` is `running`, `parked`, `stopped` or `rested`. `rested` says that the chain's run ended and owes no stage, and `sealed` is gone. No message is added.
```

## Confirmations

What matched: `sealSinceLook` (`apps/desktop/src/renderer/view.ts:1222-1229`) gives each of the fifteen cells of `frame/design.md` *Scope* item 3's table. It gives a work item the look does not hold its seal as since the look (item 5), returns null where either side carries no `seal` (item 4), and returns null for a broken seal under a merged pull request. Read, against the table case at `apps/desktop/test/view.test.ts:1962-1995`.

What matched: `changeOf` (`view.ts:1267-1287`) reads a side without a reading with the other side's seal for the comparison alone, on both sides, and keeps the present line. The changed set is the load's ids (`changedSet`, `view.ts:1330`). Each line is worked out again from the lists at each drawing (`apps/desktop/src/renderer/shared.ts:79-81`, `summary.ts:63-87`). The summary in front is drawn again at each `inbox` (`renderer.ts:1245`), and the keyboard stays on the same work item's line (`summary.ts#redrawSummary`). These are *Scope* items 12 to 14. Read.

What matched: the daemon leaves `seal` out where `branches` holds no entry (`apps/desktop/src/daemon/daemon.ts:1883`), and the map loses the entry where the branch is gone (`daemon.ts:3053-3056`). This agrees with the comment at `apps/desktop/src/shared/protocol.ts:292`. The look copies a seal's three fields, keeps null and leaves an absent field out (`apps/desktop/src/daemon/last-look.ts:209`), and `isSeal` refuses any other value (`last-look.ts:103-105`). These are *Scope* items 1 and 2. Read.

What matched: the summary's sentence counts the seals first and each work item once (`view.ts:1348-1369`), and the order puts the seals given, then the seals broken, then the others in the inbox's groups (`view.ts:1295-1297`). These are *Scope* items 8 and 9. Read.

What matched: each `from:` of the four `change` operations in `frame/design.md` *Rule changes* stands once in its file at `51f2f38`. Executed: `grep -cF` of each sentence on `docs/design.md` and `docs/design.ko.md` printed 1 four times.

What matched: phase 3's committed screenshots are the summary's alone, six files, and `gaps.md` *Not done* says why the inbox's files are left out. That agrees with `docs/design.md` *A pull request that changes the window carries its screenshots*, which asks for each view the pull request changed. Read.

The main control's second label, "Open the first that needs you", is a button that says its act, as `docs/design.md` *The voice of the window's words* asks, and "needs you" is the state's own words. No built-app case draws it, and none is owed. The label reaches the screen through the same assignment as the first label (`summary.ts:83`), which the built-app cases and the screenshots draw, and `view.test.ts:3272-3280` pins which label `summaryControls` gives (`gaps.md:12`, read).

The backticks of the daemon's sentence in a broken line (`gaps.md:15`) break no clause of `docs/design.md` *The voice of the window's words*, which says nothing of how a path or a commit is set in the window's words. `frame/design.md` *Data & interfaces* keeps them by name ("backticks included"), so they stand on the work item's design. On one screen the summary writes a commit bare in "Sealed at 3e874be" and in backticks in the broken line's sentence. Whether the window should say a commit one way is a question for `docs/design.md`, under *Not judged*.

The new case at `view.test.ts:1997-2010` repeats, in its look-side half, what #44's case at `view.test.ts:1918-1925` holds. Its present-side half and its pane that moved are new, so the case covers what its group does not, and this is no finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate: the full suite, the typecheck and the documents' checks at `51f2f38`, with the built-app files and the memory measurement no phase ran (`gaps.md:8-10`, `gaps.md:14`). The suite stands `unverified`, and the label in `gaps.md` is honest: each row names the files left out and the orchestrator | `apps/desktop/test/` | the orchestrator's broad run |
| How the window should set a path or a commit inside its own words, bare or in backticks: the summary now shows both forms on one screen | `docs/design.md` *The voice of the window's words*, `apps/desktop/src/daemon/seal-state.ts` | the owner |
| How long the hello's read takes where several heads moved, and under the load of the broad gate | `gaps.md:7` | the orchestrator, as `gaps.md:7` states |
| When the summary opens by itself, what counts as the last look, and which window event carries it | `frame/questions.md` Q1 to Q3 | the owner (Q1, Q2), and the hand walk of issue #48 (Q3) |

## Probes

| Command | Result |
|---|---|
| `git grep -n 'changedSetAfter\|redrawSummary' -- apps/desktop/test` | Only `apps/desktop/test/view.test.ts` names `changedSetAfter`, at its import and in the case at lines 2111 to 2133. No test names `redrawSummary` |
| `git grep -n 'PATH:' -- apps/desktop/test` and `git grep -n 'heldGit(' -- apps/desktop/test` | No built-app start sets a `PATH`. `heldGit` stands in `test/chain-run.ts:105` and is used by in-process daemon cases of `test/chain.test.ts` |
| `grep -cF '<from>' docs/design.md` and `docs/design.ko.md`, once for each of the four `change` operations | 1 each time |
| `python3 skills/code-review/scripts/chain_check.py --baseline 3868fa8 --root <the branch worktree> --worktree`, before this record | Exit 0. It refused the round record's absence, the gate record's and the guarantee's, and printed no notice on `frame/design.md` |
| The same command after this record, with a stand-in `gh` first on `PATH` that fails every call | Exit 0. It refused the five findings as open, for no close block, and the absent gate record and guarantee, and nothing else |
