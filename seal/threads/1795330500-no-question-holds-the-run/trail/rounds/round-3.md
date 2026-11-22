# Review round 3: 1795330500-no-question-holds-the-run

```seal
target: 3ed9dc7, fixes 38cdaa7..3ed9dc7
```

This is a verifying round. Its code is the diff from `3bd9a73` (round 2's target) to `3ed9dc7`, which holds these commits: round 2's record and the orchestrator's judgment on it (`38cdaa7`), the framer's fold of round 2's finding (`5aaaf7e`), the merge of `release/v0.0.2` after #126 (`5d26696`), the crafter's fix pass (`e94d523`), and the close block (`3ed9dc7`). Re-read whole at `3ed9dc7`: `frame/design.md`, `frame/plan.md`, `gaps.md`, `changelog.md` and `pr.md`. `frame/questions.md`, the routing and the phase records did not change.

Carried from rounds 1 and 2 and not re-derived: where the two stores and `RepositoryStore#addWorkItem` live, that `addWorkItem` is the one place a work item's id is given, and that `RepositoryStore` writes nothing at its start for a file it reads as no repository (`repositories.ts:203`). Re-derived: every verdict below.

## Findings

None. The round leaves nothing open.

## Confirmations

```seal
confirms: round-2#1
```
What holds: the drop now happens where an id is given and nowhere else. The constructor holds no drop (`daemon.ts:200-207`). The `createWorkItem` case drops from both stores the entries under `stored.item.id`, directly after `addWorkItem` and before `workItemOf` reads the stores (`daemon.ts:450-453`), and `workItemIds()` is gone from both stores. So a start that reads `repositories.json` as no repository writes neither file, and an entry is lost no sooner than `addWorkItem` gives its id again in the same step that writes `repositories.json`. The rewritten case at `daemon.test.ts:3441` reads each part of *Scope* item 15 and scenario 9 as folded at `5aaaf7e`. Both files stand unchanged after a start on stray entries and after a start with no `repositories.json`. The new work item given the id holds `decisions: []` and `asked: null`. Afterwards the files hold nothing under that id and everything under the other ids as it stood, and the decisions' id count does not go back. Executed: `node scripts/test-in-electron.mjs test/daemon.test.ts -t "leaves at its start|the questions a work item is parked with|the decisions made without asking|carries only the fields the protocol names"` in `apps/desktop`, exit 0, 18 passed. The close's claim that the case was seen red against `5d26696` was not re-run. The docstrings of `DecisionStore` (`decisions.ts:54-59`), `AskedStore` (`asked.ts:66-71`) and `dropWorkItems`, the `changelog.md` bullet on line 12, *Scope* item 15, scenario 9 and *Data & interfaces* all say the same thing at `3ed9dc7`. `git grep` for `workItemIds` and for "at the daemon's start" prints no statement of the old drop outside the dated judgment row of round 1 in `frame/plan.md` *Judgments of the run*. That row is history, and the row under it records the change.

What matched: the merge's resolution (`git show --cc 5d26696`). Each of the three conflicts keeps both sides. The protocol import of `daemon.ts` carries this work's `Asked`, `Decision` and `DecisionKind` beside #126's `roleStageOf`. The run-folder comment of `main.ts` names the decisions, the questions and #126's rules files of role sessions. The view import of `sidebar.ts` carries `lineSince` beside #126's `statusNotice`. The merge changed no file of `docs/` on this branch's side. The built-app case of scenario 17 still holds after the merge. Executed: `node scripts/test-in-electron.mjs test/decisions-and-questions.test.ts` in `apps/desktop`, alone, exit 0, 1 passed. Scenario 5's case is among the 18 above, and its `ask` in the parked work item runs on #126's `ask`. That case still passes, so the parked work item's `ask` is still served.

What matched: the four `gaps.md` rows round 2 said may close are closed at `e94d523`, each with its grounds: the Korean paragraphs, the preview and the mark on the history and archived screens, a choice through an `inbox`, and the summary's count. The row on the notification at a park now names the owner alone, as round 2 said. The row on the broad gate stays the orchestrator's. Read: `gaps.md` at `3ed9dc7`.

One sentence is left untrue by the merge, and this round opens no finding for it. The head comment of `apps/desktop/src/daemon/whole-file.ts` (lines 1 to 7) was rewritten by this work to count "six writers". #126 added a seventh daemon writer: the rules file of a role session, in `apps/desktop/src/daemon/adapters/claude.ts:261`. #126 had left its own copy of the comment at "four", which was already one short. A comment is read by the next editor and by no party at a step. The orchestrator may add the rules files to the list and make the count seven, or drop the count.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite at HEAD, the typecheck and the documents' comparison: labelled `unverified` by the fix pass's account, and honestly so. This round ran one narrow `daemon.test.ts` command and one built-app file | `seal/config.json`, key `Broad gate` | the orchestrator, by the broad gate, then the sealer's spawn |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "leaves at its start\|the questions a work item is parked with\|the decisions made without asking\|carries only the fields the protocol names"` in `apps/desktop` | Exit 0, 18 passed, 224 skipped |
| `node scripts/test-in-electron.mjs test/decisions-and-questions.test.ts` in `apps/desktop`, alone | Exit 0, 1 passed |
