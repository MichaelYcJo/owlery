# Review round 2: 1795739989-304-a-new-issue-is-placed-by-a-written-rule

```seal
target: 3ee1d106, fixes 2e2e136b..3ee1d106
```

This is a verifying round. It read the range `2e2e136b..3ee1d106`: the fix pass `81c09167`, the orchestrator's fold `14b8c825`, and the close of round 1 in `3ee1d106`. The fix pass changed `docs/roadmap.md` and `docs/roadmap.ko.md` at lines 39 and 77, the sentence at `changelog.md:5`, and one row of `gaps.md`. The fold changed `frame/design.md` at lines 63, 67, 85 and 86. The diff holds nothing else, so both commits' claims about what they touched hold (executed: `git diff 2e2e136b..3ee1d106`). The round also read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md` and `trail/rounds/round-1.md` whole at `3ee1d106`. No `pr.md` or `pr.<lang>.md` stands at the target, and `seal/parity.json` is not declared.

Carried from round 1 and not established again: the titles of the open milestones (Scenario G), since the range changes no title the list writes, and the reading of *Not in the first version* and *After the first version* at `docs/roadmap.md:116-129`. The round re-read the heading lines of both editions for the anchors, and it re-read the tracker for every issue whose place a sentence in the range states.

## Findings

### 1. The fix pass deleted a `## Not verified` row of `gaps.md` instead of marking it `closed`

```seal
severity: should
location: `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/gaps.md:8`
evidence: executed `git diff 2e2e136b..3ee1d106 -- seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/gaps.md`; read `skills/implement/SKILL.md` *4. The closing memo — only what the diff cannot show* (plugin), `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/trail/rounds/round-1.md:117`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/trail/rounds/round-1.md:136`
regression: round-1
```

Why it matters: the diff of `gaps.md` removes the row "Scenarios A to D were read, and no second reader applied the list to a live issue | the proofer, at review". No line the range adds carries that item. The fix pass's close says so: the row "is removed, since the round applied the list to live issues" (`round-1.md:117`). The plugin's rule ends a row by marking it: "An item is closed by marking it, never by deleting it: the Item cell opens with the word `closed`" (`skills/implement/SKILL.md` *4. The closing memo*). No check refuses a deleted row, so a reader of the diff is the only one who sees the difference between an item that was verified and one that was tidied away.

The unit is the `## Not verified` table of `gaps.md`. The frame's `frame/plan.md` phase 1 row says Scenarios A to D are read, and phase 1 carried that item to the proofer in this table. Round 1 answered it and left the close to the fix pass (`round-1.md:136`). The fix pass `81c09167` deleted the row instead of marking it, and that is where the defect came from. The round's answer was the right ground for a close. The deletion is the only defect.

The fix puts the row back as the table's last row, after the row on Q1 at `gaps.md:8`:

```markdown
| closed Scenarios A to D were read, and no second reader applied the list to a live issue | round 1 applied the list to live issues with `gh issue view` on 2026-11-27, `trail/rounds/round-1.md` under its round block |
```

```seal
verdict: fixed 1ae32ff1
answer: The orchestrator restored the row after `gaps.md:8` as `closed`, with the round's text word for word. Records alone.
```

### 2. Two statements that hold #176 in `owner: by hand` stand uncorrected, and no record says why one is left

```seal
severity: should
location: `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/plan.md:21`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/plan.md:55`, `docs/roadmap.md:53`, `docs/roadmap.ko.md:53`
evidence: executed `git grep -n -F 'owner: by hand' 3ee1d106 -- docs README.md README.ko.md`, `grep -rn -F '#176' seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/`, `grep -rn -e 'line 53' -e ':53' -e '0\.0\.3 row' -e 'row 0\.0\.3' seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/`, `gh issue view 176 --json number,state,milestone,labels`, `gh issue view 176 --json comments`, `gh issue list --state all --milestone "owner: by hand" --json number`; read `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/plan.md:5`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/plan.md:21`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/plan.md:55`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/design.md:75`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/trail/rounds/round-1.md:117`, `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes* (plugin)
reopens: round-1#3
```

Why it matters: the close of round 1's finding 3 holds for the sentences it fixed, and it does not hold for the class. Round 1 finding 3 is the class of present-tense sentences that hold #176 in `owner: by hand` after the tracker moved it. The fixed commit `81c09167` left two members of that class standing. Each has a ground that the records at the target do not support. What holds: ground 4 reads the same in both editions as three dated moves (`docs/roadmap.md:39`, `docs/roadmap.ko.md:39`). Scenario B at `frame/design.md:85` reads as round 1 pasted it. The tracker at this round holds #176, #184 and #110 in `release: 0.1.0` with the label `owner runs`, and `owner: by hand` holds #221, #228 and #229 alone. #176's comment of 2026-11-27 says "If it does not finish by Saturday 2026-11-28, it returns to `owner: by hand`", which confirms the fix pass's reason for writing dated moves.

The first member is `frame/plan.md:21`, in *Alternatives considered*: "#176, #221, #228 and #229 are defects or gaps a person met in what has shipped, and stand in `owner: by hand`". The fix pass claimed that this line states "the tracker as the framer read it" and stands "as a dated reading" (`round-1.md:117`). The framer dates two sections and no other: `frame/design.md` *Grounding* and `frame/plan.md` *Technical context* (`skills/implement/SKILL.md` *Document layout — two roots, three lifetimes*, the paragraph **Nothing else follows them**; `frame/plan.md:5`). Line 21 stands in *Alternatives considered*, which carries no date, so it states the present, and the tracker contradicts it for #176. The argument of the row still holds, since #221, #228 and #229 stand in `owner: by hand`. Only the tense is wrong.

The second member is the 0.0.3 row of the release table. It says #176, #184 and #110 "moved out of it on 2026-11-25 and are now in the milestone `owner: by hand`" (`docs/roadmap.md:53`). The Korean row says the same, "지금은 마일스톤 `owner: by hand`에 있습니다" (`docs/roadmap.ko.md:53`). Round 1's own search printed this line, and round 1 still wrote that it printed "ground 4 and no other sentence that holds #176 in `owner: by hand`". So round 1 missed the row, and the fix pass found it. The fix pass handed the choice to the orchestrator: "the orchestrator decides whether to fold it here or leave it to the settle of release 0.1.0" (`round-1.md:117`). The orchestrator leaves it to the settle, as the spawn of this round states. That decision stands in no record of the work item at the target. `frame/plan.md` *Judgments of the run* holds only its empty row (`frame/plan.md:55`). `frame/design.md` *Out of scope* puts the row 0.1.0 of the release table out of scope and names no other row (`frame/design.md:75`). The search for the row's coordinates prints only round 1's close. A judgment is written into the work item's records with its grounds and the document it was judged against (`skills/core/SKILL.md` *A judgment stands on a source document, and is written down with both*). Without that row, the settle of release 0.1.0 has nothing that tells it the 0.0.3 row's present tense is false. The *Out of scope* row tells it to write the 0.1.0 row, and the 0.0.3 row is another release's.

The searches above are a sample under contract rules 12 and 19, because a statement of where #176 stands in other words escapes them. They printed `frame/design.md:16` and `frame/design.md:17`, which stand in the dated *Grounding*. They also printed `frame/plan.md:22`, "It is the one order that places #176, #221 and #57 where the tracker holds them", which still holds, because #176 now stands where test 1 places it on the owner's word. None of these three needs a fix.

The fix has two parts, both in `frame/plan.md`, which the orchestrator folds. At `frame/plan.md:21`, "and stand in `owner: by hand`" becomes "and stood in `owner: by hand` when the frame read the tracker on 2026-11-27", so the row reads:

```markdown
| The issue's order: release, row of *Milestones*, shipped defect, edge case, owner | #176, #221, #228 and #229 are defects or gaps a person met in what has shipped, and stood in `owner: by hand` when the frame read the tracker on 2026-11-27 (`frame/design.md` *Grounding*, the rows on *Why this order* and on `owner: by hand`). Read top to bottom, the issue's step 3 would send the next such issue to `after launch: first findings and conveniences`, where nobody but the owner can do it. | Rejected. |
```

At `frame/plan.md:55`, the empty row of *Judgments of the run* is replaced by the orchestrator's judgment. The grounds cell below holds the facts this round found. The orchestrator states its own grounds where they differ:

```markdown
| 2026-11-27 | The 0.0.3 row of the release table, `docs/roadmap.md:53` and `docs/roadmap.ko.md:53`, keeps "are now in the milestone `owner: by hand`" of #176, #184 and #110, which the owner moved into `release: 0.1.0` on 2026-11-27. This work leaves the row, and the settle of release 0.1.0 rewrites it with the release table. | The owner returns the three issues to `owner: by hand` if they do not finish by 2026-11-28 (the comment on #176 of 2026-11-27), so where they stand is known only when the release closes. The release table is the settle's record of what each release shipped (`frame/design.md` *Out of scope*, the row on the row 0.1.0). | `skills/core/SKILL.md` *A judgment stands on a source document, and is written down with both*; `frame/design.md` *Out of scope* |
```

```seal
verdict: fixed 1ae32ff1
answer: The orchestrator replaced `frame/plan.md:21` with the round's row and filled the *Judgments of the run* row at `frame/plan.md:55` with the round's row, word for word. The 0.0.3 row of `docs/roadmap.md:53` and its twin is left to the settle of release 0.1.0, as that judgment records. Records alone.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: the sentence "The list does not decide an issue that meets none of its tests, nor one that asks for what [Not in the first version](#not-in-the-first-version) or [After the first version](#after-the-first-version) holds outside the first version, whichever test it meets." stands at `docs/roadmap.md:77`, and its Korean counterpart stands at `docs/roadmap.ko.md:77`, both as round 1 pasted them. The anchors `#not-in-the-first-version` and `#첫-버전에-넣지-않는-것` are the slugs of the headings at line 116 of each edition (executed: `grep -n '^#'` on both files). The quotes at `frame/design.md:63` and `frame/design.md:67` match the files (executed: the quote probe below). `changelog.md:5` names the exception for work the roadmap holds outside the first version. The new sentence keeps "Tests 2 to 5 wait for nobody" true for a defect the roadmap does not hold outside the first version, so Scenario A at `frame/design.md:84` stands (read).

```seal
confirms: round-1#2
```
What holds: the sentences on test 1, "the orchestrator asks the owner, and the issue keeps no milestone until the owner's word. Where the release ships without that word, the orchestrator sorts the issue again by tests 2 to 5.", stand at `docs/roadmap.md:77`, and their Korean counterparts stand at `docs/roadmap.ko.md:77`. Scenario C at `frame/design.md:86` names the asking. `changelog.md:5` names the open release among the exceptions (read, and executed through the quote probe for the frame's quotes). The new re-sort sentence reads tests 2 to 5 alone, and that agrees with test 1 naming "the release that is open". An issue whose release shipped without the owner's word blocked nothing that shipped.

What matched: the two editions say the same at every line the range changes. At line 39, both name three dated moves of #176: to release 0.0.5 on 2026-11-25, to `owner: by hand` on 2026-11-26, and to `release: 0.1.0` on 2026-11-27 on the owner's word. At line 77, each sentence of the English paragraph has its Korean counterpart, in the same order (read, `docs/roadmap.md:39`, `docs/roadmap.md:77`, `docs/roadmap.ko.md:39`, `docs/roadmap.ko.md:77`). The fix pass's one change from round 1's paste, dated events in place of "stands in `release: 0.1.0` since 2026-11-27", is the reading #176's comment supports, as finding 2 states.

What matched: Scenario B's new sentence, "#176 stood in `owner: by hand` until the owner's word moved it into `release: 0.1.0` on 2026-11-27, which is test 1 standing above test 3" (`frame/design.md:85`), read against #176's comment of 2026-11-27. The comment says the owner runs it "before the public release, so a person has run it in the built app before a stranger downloads it". The owner made it a condition of the release's publication, and test 1 reads "It blocks the checks or the publication of the release that is open: that release's milestone, `release: <version>`, and on the owner's word only". The reading is a judgment of meaning, and the round finds it holds.

What matched: Scenarios E, F and H at the target (executed). Each search of Scenario E prints one line, at `docs/roadmap.md:77`, `docs/roadmap.md:69`, `docs/roadmap.ko.md:77` and `docs/roadmap.ko.md:69`. Both searches of Scenario F exit 1. Both editions count 11 lines that open with `#` and 40 that open with `|`. `git grep -n -e '도장' 3ee1d106 -- docs README.md README.ko.md` exits 1.

What matched: `gaps.md` labels the broad gate as not run, with the orchestrator as its answerer, and the range changes that row in no way. The label is honest. The range adds no test and no code, so no test is read against a group.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a person with no role on this public repository, owned by a user account, can set a milestone on an issue they open (`frame/questions.md` Q1, carried from round 1). The round ran no probe. | `docs/roadmap.md:77`, `docs/roadmap.ko.md:77` | a measurement by a second account with no role, which the orchestrator or the owner holds |
| Whether the settle of release 0.1.0 rewrites the 0.0.3 row of the release table. The spawn states it, and the round judged only whether leaving the row is recorded (finding 2). | `docs/roadmap.md:53`, `docs/roadmap.ko.md:53` | the orchestrator, at the settle of release 0.1.0 |
| The documents leg of the broad gate, and the rest of the broad gate, run as the command in `seal/config.json` `Broad gate`. Under contract rule 2 the round ran only the `grep -c` counts. | `seal/config.json` | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `git diff 2e2e136b..3ee1d106` over `docs` and the work item's records | lines 39 and 77 of each roadmap edition, `changelog.md:5`, one row removed from `gaps.md`, and `frame/design.md` lines 63, 67, 85 and 86 |
| `python3 -I test_tmp_quotes.py` in the round's scratch directory, comparing each quoted line of `frame/design.md` against both roadmap editions | 14 quoted lines checked, none missing |
| The four Scenario E searches and the two Scenario F searches, at `3ee1d106` | E prints one line each, at `docs/roadmap.md:69`, `docs/roadmap.md:77`, `docs/roadmap.ko.md:69` and `docs/roadmap.ko.md:77`; F exits 1 twice |
| `grep -c '^#'` and `grep -c '^\|'` on both editions, and `git grep -n -e '도장' 3ee1d106 -- docs README.md README.ko.md` | 11 and 40 in each; the search exits 1 |
| `git grep -n -F 'owner: by hand' 3ee1d106 -- docs README.md README.ko.md` | lines 39, 53, 55, 67 and 73 of each edition |
| `grep -rn -F '#176'` and `grep -rn -e 'line 53' -e ':53' -e '0\.0\.3 row' -e 'row 0\.0\.3'` over the work item's directory | `#176` at `frame/plan.md:18`, `frame/plan.md:21`, `frame/plan.md:22`, `frame/design.md:16`, `frame/design.md:17` and `frame/design.md:85`; the row's coordinates in `trail/rounds/round-1.md:117` alone |
| `gh issue view <n> --json number,state,milestone,labels` for #176, #184, #110, #221, #228, #229, #57, #68, #79 | #176, #184 and #110 in `release: 0.1.0` with the label `owner runs`; #221, #228 and #229 in `owner: by hand`; #57, #68 and #79 in the milestones of rows 3, 4 and 5 |
| `gh issue view 176 --json comments`, and `gh issue list --state all --milestone "owner: by hand" --json number` | the comment of 2026-11-27 that moves #176 into `release: 0.1.0` and returns it to `owner: by hand` if not finished by 2026-11-28; the milestone holds #221, #228 and #229 |
