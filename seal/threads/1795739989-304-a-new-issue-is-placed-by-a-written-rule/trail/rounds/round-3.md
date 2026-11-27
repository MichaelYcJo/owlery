# Review round 3: 1795739989-304-a-new-issue-is-placed-by-a-written-rule

```seal
target: 0195f871, fixes 3ee1d106..0195f871
```

This is a verifying round. It read the range `3ee1d106..0195f871`: round 2's record in `4544549f`, the orchestrator's fold `1ae32ff1`, and the close of round 2 in `0195f871`. The range changes three files, `frame/plan.md`, `gaps.md` and `trail/rounds/round-2.md`, all in the work item's directory, and nothing under `docs`, `apps` or the two READMEs (executed: `git diff --name-only 3ee1d106 0195f871`, and `git diff --quiet 3ee1d106 0195f871 -- docs README.md README.ko.md apps`, which exits 0). So the claim that the range touches the work item's records alone holds. The fold changes two rows of `frame/plan.md`, at lines 21 and 55, and adds one row to `gaps.md` at line 9, and the diff holds nothing else. The commit message of `1ae32ff1` names those three changes and no other.

The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md`, `trail/rounds/round-1.md` and `trail/rounds/round-2.md` whole at `0195f871`. No `pr.md` or `pr.<lang>.md` stands at the target, `seal/parity.json` is not declared, and no other work item's directory stands under `seal/threads/`, so no other frame of the release was read.

Carried from rounds 1 and 2 and not established again: the titles of the open milestones (Scenario G), the reading of *Not in the first version* and *After the first version*, Scenarios E, F and H with the quote probe, and the slugs of the anchors at line 116 of each edition. The range changes no line of `docs`, so none of those can have moved. The round re-read the tracker for every issue whose place a sentence of the records states, with GET calls only.

## Findings

None. Both closes of round 2 hold, and the two units the fold added hold what they state.

## Confirmations

```seal
confirms: round-2#1
```
What holds: `gaps.md:9` reads "closed Scenarios A to D were read, and no second reader applied the list to a live issue", with the cell "round 1 applied the list to live issues with `gh issue view` on 2026-11-27, `trail/rounds/round-1.md` under its round block". The item after the word `closed` is the removed row's item, word for word (executed: `git show 2e2e136b:seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/gaps.md`). The row opens with `closed` in lower case and its second cell names what closed it, not the old answerer "the proofer, at review", as `skills/implement/SKILL.md` *4. The closing memo — only what the diff cannot show* asks (read, plugin). The coordinate the cell names stands: `trail/rounds/round-1.md:9-17` holds the list applied to live issues under round 1's round block (read). The row stands last in the table, after the row on Q1 at `gaps.md:8`, as round 2's fix placed it. The two open rows at lines 7 and 8 are unchanged.

```seal
confirms: round-2#2
```
What holds: `frame/plan.md:21` reads "and stood in `owner: by hand` when the frame read the tracker on 2026-11-27", the round's row word for word (executed: `git diff 3ee1d106..0195f871`). The row now states a dated reading and not the present, and the tracker still holds #221, #228 and #229 in `owner: by hand` (executed: `gh issue list --state all --milestone "owner: by hand" --json number`), so the row's argument holds. `frame/plan.md:55` holds the judgment row word for word. It records the decision, its grounds and the document it was judged against, as `skills/core/SKILL.md` *A judgment stands on a source document, and is written down with both* asks. The judgment is the new unit of the fold, so the round read each of its claims against the tree and the tracker. The quote "are now in the milestone `owner: by hand`" stands in `docs/roadmap.md:53`, and the Korean row at `docs/roadmap.ko.md:53` holds the same statement, "지금은 마일스톤 `owner: by hand`에 있습니다" (read). #176, #184 and #110 stand in `release: 0.1.0` with the label `owner runs` (executed: `gh issue view <n> --json number,state,milestone,labels`). The comment on #176 of 2026-11-27 reads "If it does not finish by Saturday 2026-11-28, it returns to `owner: by hand`". It speaks of #176 alone, and #184 and #110 each carry the same comment, at 2026-11-27T00:44:55Z and 2026-11-27T00:45:02Z (executed: `gh issue view <n> --json comments`). So the ground "The owner returns the three issues" holds for the three, though the cell cites one comment. The row's home reaches its reader: `seal settle`'s dry run prints every row of a released plan's *Judgments of the run* under *The judgments*, and the settling session reads that section (read, `skills/settle/SKILL.md` *The judgments* and step 5, plugin). The second ground, "The release table is the settle's record of what each release shipped", is what `frame/design.md:75` states (read).

What matched: no sentence of the work item's records still states that #176 stands in `owner: by hand` today (executed: `grep -rn -F '#176'` over the work item's directory, outside `trail/rounds`). The search printed `frame/plan.md:18`, `frame/plan.md:21`, `frame/plan.md:22` and `frame/plan.md:55`, and `frame/design.md:16`, `frame/design.md:17` and `frame/design.md:85`. Lines 16 and 17 of `frame/design.md` stand in the dated *Grounding*, and line 85 is the dated sentence round 1 pasted. `frame/plan.md:22` says the order places #176 "where the tracker holds them", which still holds, since #176 stands where test 1 places it on the owner's word. The search is a sample under contract rules 12 and 19, because a statement of where #176 stands in other words escapes it.

What matched: the present-tense placements the records state elsewhere still hold in the tracker (executed: `gh issue view <n> --json number,milestone,comments`). #57, #68 and #79 stand in the milestones of rows 3, 4 and 5, as `frame/plan.md:22` says "today". #281 and #287 stand in `after launch: first findings and conveniences`, as `frame/design.md:74` says. #108 and #250 carry no comment, as `frame/plan.md:49` says. The open issues with no milestone are still #250, #137, #136, #120, #108, #98, #35 and #34.

What matched: `gaps.md` still labels the broad gate as not run, with the orchestrator as its answerer, at `gaps.md:7`, and the range changes that row in no way. The label is honest. The range adds no test and no code, so no test is read against a group.

This round leaves no finding open. What comes due is the orchestrator's broad run, and the sealer's spawn after it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a person with no role on this public repository, owned by a user account, can set a milestone on an issue they open (`frame/questions.md` Q1, carried from rounds 1 and 2). The round ran no probe. | `docs/roadmap.md:77`, `docs/roadmap.ko.md:77` | a measurement by a second account with no role, which the orchestrator or the owner holds |
| Whether the settle of release 0.1.0 rewrites the 0.0.3 row of the release table as the judgment at `frame/plan.md:55` says. The round judged only that the row is recorded and that the settle's dry run prints it. | `docs/roadmap.md:53`, `docs/roadmap.ko.md:53` | the orchestrator, at the settle of release 0.1.0 |
| The broad gate, run as the command in `seal/config.json` `Broad gate`. Under contract rule 2 the round ran none of it. | `seal/config.json` | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `git diff --name-only 3ee1d106 0195f871`, `git diff --quiet 3ee1d106 0195f871 -- docs README.md README.ko.md apps`, and `git diff 3ee1d106..0195f871` over `gaps.md` and `frame/plan.md` | the three files of the work item named above; the quiet diff exits 0; the rows at `frame/plan.md:21` and `frame/plan.md:55` changed and one row added at `gaps.md:9` |
| `git show 2e2e136b:seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/gaps.md` | the removed row read "Scenarios A to D were read, and no second reader applied the list to a live issue", answered by "the proofer, at review" |
| `gh issue view <n> --json number,state,milestone,labels` and `--json comments` for #176, #184, #110 | each open, in `release: 0.1.0`, with the label `owner runs`, and each with the comment of 2026-11-27 that returns it to `owner: by hand` if not finished by 2026-11-28 |
| `gh issue list --state all --milestone "owner: by hand" --json number` | #229, #228 and #221 |
| `gh issue view <n> --json number,milestone,comments` for #57, #68, #79, #221, #228, #229, #281, #287, #108, #250, and `gh issue list --state open --search 'no:milestone' --json number` | #57, #68 and #79 in the milestones of rows 3 to 5; #221, #228 and #229 in `owner: by hand`; #281 and #287 in `after launch: first findings and conveniences`; #108 and #250 with no milestone and no comment; the open issues with no milestone are #250, #137, #136, #120, #108, #98, #35 and #34 |
| `grep -rn -F '#176'` over the work item's directory, and `git grep -n -F 'owner: by hand' 0195f871 -- docs README.md README.ko.md` | the record lines named under the confirmations; lines 39, 53, 55, 67 and 73 of each edition |
