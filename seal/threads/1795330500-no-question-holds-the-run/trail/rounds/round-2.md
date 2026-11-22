# Review round 2: 1795330500-no-question-holds-the-run

```seal
target: 3bd9a73, fixes 72b0272..3bd9a73
```

This is a verifying round. Its code is the diff from `72b0272` (the commit of round 1's record, whose target was `8db471d`) to `3bd9a73`. That diff holds six commits: the merge of `release/v0.0.2` after #125 (`3e3f5bb`), the framer's fold of findings 2 and 3 (`dcb4821`), the orchestrator's fold of finding 1 (`d92c720`), the crafter's fix pass (`5b2f606`, `d48971c`), and the orchestrator's repair of the fold with the close blocks (`3bd9a73`). Re-read whole at `3bd9a73`: `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/rounds/round-1.md`. The routing and the phase records did not change.

Carried from round 1 and not re-derived: where the two stores, the store of the repositories and the creation of a work item live (`daemon.ts`, `decisions.ts`, `asked.ts`, `repositories.ts`), and that `addWorkItem` is the one place an id is given. Re-derived: every verdict below.

## Findings

### 1. The drop at the daemon's start wipes both stores whenever a build reads `repositories.json` as no repository, before that file itself is touched

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:203-207`, `apps/desktop/src/daemon/daemon.ts:447-452`, `apps/desktop/src/daemon/repositories.ts:203`, `apps/desktop/test/daemon.test.ts:3441`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:67`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:189`, `seal/threads/1795330500-no-question-holds-the-run/changelog.md:12`
evidence: read `apps/desktop/src/daemon/daemon.ts:203-207`, `apps/desktop/src/daemon/repositories.ts:194-205`, `seal/threads/1795330500-no-question-holds-the-run/frame/plan.md:33-34`, `apps/desktop/test/daemon.test.ts:3441-3479`
regression: round-1#1
```

Why it matters: the unit is the drop that `5b2f606` added to the `Daemon` constructor (`daemon.ts:203-207`). `frame/design.md` *Scope* item 15 as folded at `d92c720` says the daemon drops at its start every entry whose work item its repositories do not hold, and the fix did exactly that. The defect comes from round 1's own paste-ready fix, which chose to drop eagerly at the start where a drop at the moment an id is given again would have closed the same hole. Here is the case it gets wrong. `RepositoryStore` reads a `repositories.json` of another shape as no repository and writes nothing at its start (`repositories.ts:203`). The file stays on disk until the next change, so a build that reads it correctly can still read it later. The new drop does not wait: the daemon's start writes `decisions.json` and `asked.json` empty at once, and the new case asserts exactly that ("The start itself wrote the files without the stray entries", `daemon.test.ts:3441-3479`). So a person who starts this build after a later build changed a field of `repositories.json` loses every decision and every park. They lose them on the start alone, with no act of their own, and they stay lost when the later build runs again on files it can read. `frame/plan.md` *Alternatives considered* (lines 33 and 34) kept the decisions and the questions out of `repositories.json` precisely so that they would not share that file's fate. The eager drop makes them share it, and makes them go first.

The hole round 1 named is an id given a second time, and an id is given in one place, `RepositoryStore#addWorkItem`, called once by the daemon (`daemon.ts:447`). Dropping what the stores hold under the id at that call closes the hole. It also loses an entry no sooner than the work item list loses the work item, since `addWorkItem` writes `repositories.json` in the same step. The precondition: `stored.item.id` is the id just given, before `workItemOf(stored)` reads the stores at line 452.

```ts
// apps/desktop/src/daemon/daemon.ts, the constructor: remove the drop added by 5b2f606 (lines 203-207).

// apps/desktop/src/daemon/daemon.ts, the createWorkItem case, directly after line 447:
            const stored = this.store.addWorkItem({ title: message.title.trim() || basename(place.worktree), ...place });
            // The two stores are keyed by a work item's id, which `repositories.json` gives. Where that file was lost or read as no repository, its ids begin again, so what the stores hold under the id given now was an earlier work item's. It is dropped here, as the id is given, and not at the daemon's start, so a start that misreads `repositories.json` loses nothing that file still holds.
            this.keptChange("decisions", () => this.decisions.drop([stored.item.id]));
            this.keptChange("questions", () => this.asked.drop([stored.item.id]));
```

```seal
verdict: fixed e94d523
answer: The finding holds, and the paste-ready fix was applied as written after reading it against Scope item 15 and scenario 9 as folded at 5aaaf7e: the constructor drops nothing, and the createWorkItem case drops what both stores hold under the id addWorkItem has just given, before workItemOf reads the stores. workItemIds() is gone from both stores. The case at apps/desktop/test/daemon.test.ts was rewritten to scenario 9's new form and seen red against 5d26696 on its first assertion on the files after the start. With either drop taken out, or made to take a second id, it fails. The docstrings of DecisionStore, AskedStore and dropWorkItems and changelog.md line 12 say "when a new work item is given the id" and that the start drops nothing. The same commit closes in gaps.md the four rows this round says may close.
```

The snippet does not reach every statement of the fact, and the fix pass owes the rest:

- `workItemIds()` in both stores has no caller once the constructor's drop goes, and goes with it.
- The docstrings of `DecisionStore`, `AskedStore` and `dropWorkItems`, and the `changelog.md` bullet on line 12, say "at the daemon's start", and each says instead "when a new work item is given the id".
- The case at `daemon.test.ts:3441` is changed. A start on stores that hold an entry under an id the repositories do not hold leaves both files as they stood. The creation of a work item under that id then holds `decisions: []` and `asked: null`, and the files no longer carry the id. The case is shown red against `3bd9a73` by its first assertion on the files after the start.
- `frame/design.md` lines 67 and 189 name the start drop and `workItemIds()`. Those are the orchestrator's to fold again.

## Confirmations

```seal
confirms: round-1#1
```
What holds: the hole round 1 named is closed at `3bd9a73`, and finding 1 above is about the way it was closed, not about the hole. A work item created after `repositories.json` is lost holds none of what stood under its id. The case at `daemon.test.ts:3441` reads that, with an archived work item's entries kept and the decision's id count not lowered (`toMatchObject({ id: 4 })`). Executed: `node scripts/test-in-electron.mjs test/daemon.test.ts -t "drops at its start|the questions a work item is parked with|the decisions made without asking"` in `apps/desktop`, exit 0, 16 passed. The close's claim that the case was seen red against `d92c720` was not re-run. The docstrings of both stores and of `dropWorkItems` and the `changelog.md` bullet say what the code does at `3bd9a73`.

```seal
confirms: round-1#2
```
What holds: the four sentences now read as round 1 gave them, at `docs/product.md:11`, `docs/product.ko.md:11`, `docs/architecture.md:148` and `docs/architecture.ko.md:148`, and so do the four `to:` entries of `frame/design.md` at lines 202, 207, 259 and 264. Executed: `git grep -n "line with its grounds\|근거와 함께 그 작업의 줄" HEAD -- docs` prints nothing. Each sentence now agrees with `decisionMark` and `detail` and with *Foundation* at `docs/product.md:35`.

```seal
confirms: round-1#3
```
What holds: the twelve places read `멈추다` / `멈춰 두다` as listed, in both documents and in the frame's entries. Executed: `git grep -n -o ".\{0,12\}세[우웁워울].\{0,8\}" HEAD -- docs README.ko.md` prints only `docs/product.ko.md:147` and `docs/product.ko.md:164` (`내세우는`) and `docs/roadmap.ko.md:36` (`세울`, "build"), none of them about a park. Read: the rewritten sentences of `docs/architecture.ko.md:198` read as Korean. "작업 하나를 멈춘 것이 다른 작업으로 번지지 않게" now says that the park is kept to one work item, as the English does. The heading and table-row counts of each pair are unchanged by `d48971c`, which edits text inside lines and adds none. Read from the diff.

What matched: the merge's resolution (`git show --cc 3e3f5bb`). The one conflict in `apps/desktop/src/renderer/work-item-view.ts` keeps `answersFor`, `askedSection` and `reverseDecision` of this work and takes #125's move of `CARD_SHOW_MS` and `CARD_LEAVE_MS` into `view.ts` (`view.ts:1178-1179`), imported at `work-item-view.ts:17-18`. No definition is left twice, and every other file merged without a conflict. #125 makes a background window ignore the mouse, which the built-app case of scenario 17 meets through `BuiltApp`. Executed: `node scripts/test-in-electron.mjs test/decisions-and-questions.test.ts` in `apps/desktop`, alone, exit 0, 1 passed at `3bd9a73`.

What matched: the folds. *Scope* item 15 at `frame/design.md:67` reads as one sentence again after `3bd9a73`. The new row of `frame/plan.md` *Judgments of the run* names the three findings and their grounds. Both state the start drop, which finding 1 above asks the orchestrator to fold again if the fix pass takes it.

The `gaps.md` rows that round 1 answered by reading, at `3bd9a73`, each still open:

- The row on the Korean paragraphs may close. Finding 3 of round 1 is fixed and confirmed above. What remains is the owner's call on two sentences' voice, which round 1's `## Not judged` carries.
- The row on the preview's list and the mark on the history and the archived screen may close. All three screens draw them through the one `detail` and the one `lineElement` that the built-app case executes (round 1, *Confirmations*, at `list.ts:116` and `list.ts:131-143`). How they look is the two rows on the themes, which stay the owner's.
- The row on a choice and a typed answer through an `inbox` may close. The section stands outside what `showView` replaces, and `showQuestions` returns before redrawing on an unchanged key (round 1, at `index.html:583-593` and `work-item-view.ts:691`). The merge changed neither.
- The row on the summary drawn with a count may close. `summary.ts:42` draws `summaryHead(look !== null, held.changes)`, and scenario 15's cases pin those strings.
- The row on the notification at a park and the ages stays open, with the proofer's part done and the owner named alone. `parkNotifications` is pinned as a function, but no case raises the notification through `takeLists`, clicks it, or reads an age outside the section's line. That needs the running app.
- The row on the broad gate stays open, the orchestrator's.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite at HEAD, the typecheck and the documents' comparison: labelled `unverified` by the fix pass's account, and honestly so. This round ran one narrow `daemon.test.ts` command and one built-app file | `seal/config.json`, key `Broad gate` | the orchestrator, by the broad gate after the rounds settle |
| Whether the loss in finding 1 is worth the change, against a run folder only this build and later builds write the two stores into | `apps/desktop/src/daemon/daemon.ts:203-207` | the orchestrator, in the fix pass's close |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "drops at its start\|the questions a work item is parked with\|the decisions made without asking"` in `apps/desktop` | Exit 0, 16 passed, 216 skipped |
| `node scripts/test-in-electron.mjs test/decisions-and-questions.test.ts` in `apps/desktop`, alone | Exit 0, 1 passed |
| `git grep -n -o ".\{0,12\}세[우웁워울].\{0,8\}" HEAD -- docs README.ko.md` | Three lines, none about a park |
| `git grep -n "line with its grounds\|근거와 함께 그 작업의 줄" HEAD -- docs` | Nothing printed |
