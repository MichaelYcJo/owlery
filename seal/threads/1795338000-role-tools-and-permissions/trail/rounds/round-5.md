# Review round 5: 1795338000-role-tools-and-permissions

```seal
target: 0708ed8, fixes 3eff93b..528f806
```

This round verifies the closes of round 4's two findings. It reads `a7c10ee..0708ed8` whole: the round 4 record `3eff93b`, the fix commits `bd2877d`, `713c85c` and `528f806`, and the closes `0708ed8`. Every commit of the range changes the work item's records alone. Executed: `git diff --stat a7c10ee 0708ed8` lists `frame/design.md`, `frame/plan.md`, `trail/phases/phase-3.md` and `trail/rounds/round-4.md`, and no file under `apps/` or `docs/`. So no code is reviewed here, and the code facts below were read at `0708ed8` to check the closes.

The records read whole at `0708ed8` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `trail/phases/phase-3.md`. The work item holds no `pr.md` and no `pr.<lang>.md` yet. `trail/phases/phase-1.md`, `trail/phases/phase-2.md` and `trail/rounds/round-1.md` to `round-4.md` were read for their coordinates. As the caller asked, the round read the worktree at `0708ed8` with `git` and file reads alone. It made no clone, ran no test file and wrote no file but this record.

Carried from round 4 and not established again: the commit time of `ddff5d0` against the first run of the built-app case, and the failing line of each of its five mutants (`trail/phases/phase-3.md:42-43`). Round 4 read both from the phase's outputs in the scratch directory `1795338000-role-tools-and-permissions/phase-3/`. Also carried are the rows of round 4's `## Not judged`.

## Findings

### 1. The new row of *Judgments of the run* moves "its last row", so three citations of the screenshot scene's judgment now point at the built-app case's row

```seal
severity: should
location: `seal/threads/1795338000-role-tools-and-permissions/frame/design.md:363`, `seal/threads/1795338000-role-tools-and-permissions/frame/plan.md:80`, `seal/threads/1795338000-role-tools-and-permissions/trail/phases/phase-3.md:22`, `seal/threads/1795338000-role-tools-and-permissions/frame/plan.md:109-110`
evidence: executed `git grep -n -o -e 'Judgments of the run\*[^|]\{0,60\}' HEAD -- seal/threads/1795338000-role-tools-and-permissions ':!seal/threads/1795338000-role-tools-and-permissions/trail/rounds'`, which lists every citation of the table in the work item's records; executed, for `d660f79`, `5bb0fbe`, `52e2416`, `a7c10ee` and `bd2877d`, a count of the rows of `frame/plan.md` *Judgments of the run* and a print of the last one; executed `git log -S'its last row'` over the three files; read `frame/design.md:363`, `frame/plan.md:80`, `frame/plan.md:108-110`, `trail/phases/phase-3.md:22`
regression: round-4#1
```

Why it matters: the unit is `frame/plan.md` *Judgments of the run*, which `bd2877d` changed by appending a row for round 4's finding 1. The frame cites rows of that table by position in three places, and the new row moved each of them. `52e2416` wrote two of those citations when the screenshot scene's row (`frame/plan.md:109`) was the last. `d660f79` wrote the third when scenario 23's row (`frame/plan.md:108`) was the last. Since `bd2877d` the last row is the built-app case's, `frame/plan.md:110`.

- `frame/design.md:363`, the last row of *Removes*, removes the screenshot run's decision record and failed setup. Its grounds end "(`frame/plan.md` *Judgments of the run*, its last row)". The settle and the sealer open that coordinate for the decision that carries the scene to #157, and they now read the built-app case's row, which says nothing of the scene.
- `frame/plan.md:80`, the row of #119 in *Overlap with the release*, ends "The decisions' shots stand in #119's own records (*Judgments of the run*, its last row)". That fact is in row 109, and row 110 does not state it.
- `trail/phases/phase-3.md:22` says the orchestrator decided that the screenshot run gives the request's work item neither mark, and cites "its last row". That decision is in rows 108 and 109. The citation pointed at row 109 from `5bb0fbe` to `a7c10ee`, and since `bd2877d` it points at row 110.

The frame's phase 3 row (`frame/plan.md:66`) and `frame/design.md:130` cite the table by name and are not touched. The fix answered round 4's finding 1 as the frame asks: `frame/design.md:130` and `frame/plan.md:66` now say the built-app case's red came from mutation, and the new row of `frame/plan.md:110` accepts that departure. The defect came from the append. The fix pass searched for the old statement of finding 1 (round 4's close of finding 1: "found it at `phase-3.md:37` alone"), and no search looked for a citation the new row moves. The list above is whole for the work item's records outside `trail/rounds/`: it is every match of the table's name, and each was read for whether it names a row by position. Three do, and they are listed. `docs/` and `apps/` cite no row of this table. Executed: the same `git grep` with `-c` over `docs apps` finds the table's name only in the bundle's `skills/implement/SKILL.md`, which names the section and no row.

A citation by the row's own opening words survives the next appended row. The fix below cites rows that way.

```markdown
frame/design.md:363, the last cell, its parenthesis replaced whole:

(`frame/plan.md` *Judgments of the run*, the row that opens "Giving the request's work item neither mark")

frame/plan.md:80, the last cell, its parenthesis replaced whole:

(*Judgments of the run*, the row that opens "Giving the request's work item neither mark")

trail/phases/phase-3.md:22, its parenthesis replaced whole:

(`frame/plan.md` *Judgments of the run*, the row that opens "Scenario 23 (each inbox shot shows" and the row after it)
```

## Confirmations

```seal
confirms: round-4#1
```
What holds: the three statements and the row the finding asked for stand at `0708ed8`. Read.

- `trail/phases/phase-3.md:37` is round 4's snippet word for word. The case was committed in `ddff5d0` before its first run, and its red is each guard's mutation, run after that commit. Executed: `git show --stat ddff5d0` lists `apps/desktop/test/ask-section.test.ts` beside the renderer's files, so the case and its code share that commit.
- `frame/design.md:130` is the orchestrator's text and says what the snippet says. It names the one built-app case as the exception to "shown failing before its code", gives `ddff5d0`, and names the mutation of each guard with its failing line. It cites *Mutation* and the judgment row. Its last sentence covers the cases of `test/view.test.ts` whose red before their code was "is not a function". `trail/phases/phase-3.md:35` names three of those: the notifications, the key and the earlier build. Their guards were shown red by mutation after `ddff5d0` (`phase-3.md:39-41`, the mutants at 1178, 1182, 1183, 1177, 1223 and 1227). So the sentence holds. Phase 1's case of scenario 3 had the same treatment (`trail/phases/phase-1.md:15-17`): it failed before its code on `toolsOf is not a function`, and its guards were shown red by mutation. That case did fail before its code, so the exception "but for the one case" still holds for it. The sentence on `test/view.test.ts` does not claim to be the only such file. Weighed and not raised.
- `frame/plan.md:66` limits "each seen red before its code" to the cases of `test/view.test.ts`. It says the built-app case was seen red with each guard taken out alone after `ddff5d0`, and cites *Judgments of the run*.
- `frame/plan.md:110` is round 4's row word for word, with its grounds and the documents it was judged against.

The search behind the close found every other statement of the old fact: executed `git grep -n -e 'before its code' -e 'seen red' -e 'shown failing' -e 'shown red' -e 'not run against' -e 'before its first run'` over the work item's records outside `trail/rounds/`. It prints `frame/design.md:130`, `frame/plan.md:64-66` and `:110`, `phase-1.md:15`, `phase-2.md:36`, `phase-3.md:33` and `:37`. None of them states the old claim. The row the close appended moved three citations, and this round's finding 1 holds that defect.

```seal
confirms: round-4#2
```
What holds: `frame/plan.md:109`'s "Judgment" cell is round 4's snippet word for word, and the code it cites says what the cell says. Read at `0708ed8`. `decisionMark` counts a decision in state `decided` that the look does not hold, and one in state `reversed`, and no other state (`apps/desktop/src/renderer/view.ts:270-276`). The case the cell names stands at `apps/desktop/test/view.test.ts:907`, and its title holds "an applied and a carried decision in neither count". `shared.ts#detail` lists the record's decisions through `decisionLines` (`apps/desktop/src/renderer/shared.ts:286-293`). The record the run wrote before `f4f871b` held four decisions (`git show f4f871b^:apps/desktop/test/screenshots.test.ts`, `DECISIONS` at 92-97 and the record at 372). Two stand as `decided`, one is `reversed`, and one was reversed and then applied (`TAKEN_IN`, 99). The cell does not name the applied one. The cell's conclusion, that this record marks any line it is written under, rests on the `decided` decisions and holds. No code changed after round 4, so nothing the cell cites moved. The scene was not changed, and `test/screenshots.test.ts`, `docs/design.md` and the twelve shots stand as `f4f871b` left them. Executed: `git diff --stat a7c10ee 0708ed8`.

What matched: the label of the suite is honest. The first row of `gaps.md` *Not verified* still names each narrow run through `f4f871b` and leaves the whole suite and the typecheck to the orchestrator. The fix pass ran no command, so the row owes nothing new. No row left `gaps.md`: the range does not change the file. Executed: `git diff --stat a7c10ee 0708ed8`.

What matched: the records read whole say nothing else the target contradicts. `changelog.md` and `frame/questions.md` are unchanged since round 4 and still agree with the tree as round 4 read it. Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the typecheck and the broad gate at `0708ed8`, among them every file that starts the built app. This round ran no test file, as the caller asked. No code changed after round 4's target `a7c10ee` | the repository | the orchestrator, by the broad gate |
| Carried from rounds 3 and 4, not established again: a file system that tells a composed name from a decomposed one, a hard link out of the worktree, what 2.1.330 puts in `input.file_path`, a change between the read of a path's links and the write, and a `permissionMode` key in a taken agent | `apps/desktop/src/daemon/role-grants.ts`, `apps/desktop/src/daemon/adapters/claude.ts`, `apps/desktop/role-bundle/agents/` | as round 3 names them |
| Q4: which commands 2.1.330 runs without asking in the mode `default` | `seal/threads/1795338000-role-tools-and-permissions/frame/questions.md` | #41's first real round |
| A session with no role on the real CLI, waiting for the person and answered in the view | `seal/threads/1795338000-role-tools-and-permissions/gaps.md` | the owner, as `gaps.md` names |

## Probes

| Command | Result |
|---|---|
| `git diff --stat a7c10ee 0708ed8` and `git log --format='%h %ci %s' a7c10ee..0708ed8` | Five commits. Four files change, all under the work item's directory: `frame/design.md`, `frame/plan.md`, `trail/phases/phase-3.md` and `trail/rounds/round-4.md` |
| For `d660f79`, `5bb0fbe`, `52e2416`, `a7c10ee` and `bd2877d`, the rows of `frame/plan.md` *Judgments of the run* counted and the last printed | 6, 7, 7, 7 and 8 rows. The last row is scenario 23's at `d660f79`, the screenshot scene's from `5bb0fbe` to `a7c10ee`, and the built-app case's at `bd2877d` |
| `git grep -n -o -e 'Judgments of the run\*[^|]\{0,60\}' HEAD` over the work item's records outside `trail/rounds/` | Nine citations. Three name a row by position: `frame/design.md:363`, `frame/plan.md:80` and `trail/phases/phase-3.md:22` |
| `git grep` over the same records for the six wordings of the seen-red fact | Eight lines, listed under the confirmation of round-4#1. None states the old claim |
