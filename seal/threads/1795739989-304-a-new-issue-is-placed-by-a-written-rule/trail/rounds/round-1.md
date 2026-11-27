# Review round 1: 1795739989-304-a-new-issue-is-placed-by-a-written-rule

```seal
target: 2e2e136b against origin/release/v0.1.0
```

The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `trail/phases/phase-1.md` whole at `2e2e136b`, and the diff of `docs/roadmap.md` and `docs/roadmap.ko.md` against the merge base `e7737b7e`. No `pr.md` or `pr.<lang>.md` stands at the target, and no earlier round exists, so nothing was carried. `seal/parity.json` is not declared. The work changes no code, so the quality stage read the two documents' text against the tracker and against the rest of the roadmap.

As `gaps.md` row 3 asks, the round applied the list to live issues as a second reader, reading each with `gh issue view` (GET only, 2026-11-27):

- #300 and #296 make the open release's sealed pull requests wait for a rerun. Test 1 places them, on the owner's word. The tracker holds both in `release: 0.1.0` by that word, and the rule matches.
- #57, a walk of milestone 3, meets test 2 before test 3 and stands in `milestone 3: hand over an issue`. The rule matches.
- #221, a defect the owner met that waits on the owner's choice of marks, meets test 3 before test 4 and stands in `owner: by hand`. The rule matches.
- #108, "the window shows every word in English", was found by the owner's hand check of a built app. It carries no milestone and no line, so the rule reads it as not yet sorted. Test 4 places it in `after launch: first findings and conveniences` without asking.
- #34, #98, #120, #136 and #137 each carry a line that says why they have no milestone: #34's body opens "No milestone.", #98's body says "This issue is a study for after v0.1.", and #120, #136 and #137 carry the comment "Moved to no milestone on 2026-11-24". The rule reads each as sorted. `frame/plan.md` *Operational impact* says #137, #136, #98 and #35 were not opened by the frame. They are opened now, and #35 carries the same comment.
- #250 is a list of candidate ideas. It meets no test, so the orchestrator asks the owner.
- #120, stripped of its line, would be met by test 4, and finding 1 is built on that.

## Findings

### 1. Test 4 places work the roadmap holds outside the first version without asking the owner

```seal
severity: should
location: `docs/roadmap.md:77`, `docs/roadmap.ko.md:77`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/design.md:63`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/design.md:67`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/changelog.md:5`
evidence: executed `gh issue view 120 --json title,body,comments,labels`, `gh issue view 108 --json title,body,comments,labels`, `grep -n -e 'meets no test' -e 'meets none' -e 'without asking' seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/*.md seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/*.md`; read `docs/roadmap.md:74`, `docs/roadmap.md:116-129`, `docs/product.md:166`, `docs/product.md:168`
```

Why it matters: test 4 reads "It is a defect or a gap that a person met in what has shipped" (`docs/roadmap.md:74`). A gap has no bound in that sentence. A person who meets the shipped app and asks for something it lacks has met a gap, so test 4 takes almost every feature request from outside. That includes requests the roadmap already puts outside the first version: *Not in the first version* (`docs/roadmap.md:116-119`) names product.md's *What we deliberately don't do*, which says "We do not build an IDE, a kanban board or a built-in browser" (`docs/product.md:166`) and "The first version has no mobile app" (`docs/product.md:168`), and *After the first version* (`docs/roadmap.md:121-129`) names the phone and the platforms after macOS. "Tests 2 to 5 wait for nobody" (`docs/roadmap.md:77`), so the orchestrator places such a request in `after launch: first findings and conveniences` and asks nobody. The paragraph then says that work waiting for what comes after the first version is left with no milestone only as the owner's answer to an issue that meets no test. For a request about the shipped app, that branch is almost never reached. Live issue #120 shows the case. Its body reads "today the person opens their own browser to look at it", which is a gap a person met in what has shipped, and it weighs the built-in browser product.md declines. The owner left it with no milestone, as work that waits for a later version. If the same issue arrived from outside today with no line, test 4 would place it in `after launch` without asking. #108 shows that the test works where the roadmap holds nothing against the request.

`frame/design.md` *Scope* item 2 quotes the sentence the fix changes (lines 63 and 67), and `changelog.md:5` states the same exception ("except where the issue meets no test"). The search above is a sample under contract rules 12 and 19, because a statement in other words escapes it. Scenario D (`frame/design.md:87`) stays true, since #34 meets no test, and the fix pass may add a scenario for the new case.

The fix, in `docs/roadmap.md:77`, replaces the sentence "The list does not decide an issue that meets none of its tests." with:

```markdown
The list does not decide an issue that meets none of its tests, nor one that asks for what [Not in the first version](#not-in-the-first-version) or [After the first version](#after-the-first-version) holds outside the first version, whichever test it meets.
```

In `docs/roadmap.ko.md:77`, it replaces "어느 조건에도 맞지 않는 이슈는 이 목록이 정하지 않습니다." with:

```markdown
어느 조건에도 맞지 않는 이슈와, 어느 조건에 맞든 [첫 버전에 넣지 않는 것](#첫-버전에-넣지-않는-것)이나 [첫 버전 다음](#첫-버전-다음)이 첫 버전 밖에 두는 일을 바라는 이슈는 이 목록이 정하지 않습니다.
```

The anchors `#not-in-the-first-version` and `#첫-버전에-넣지-않는-것` are the slugs of the headings at `docs/roadmap.md:116` and `docs/roadmap.ko.md:116`. The same two sentences replace the old ones in the quotes at `frame/design.md:63` and `frame/design.md:67`. In `changelog.md:5`, "except where the issue meets no test." becomes "except where the issue meets no test or asks for work the roadmap holds outside the first version." Finding 2 changes the same changelog sentence again, and its fix gives the line with both changes.

### 2. Under test 1 nothing says who asks the owner, and the line makes the waiting issue read as sorted

```seal
severity: should
location: `docs/roadmap.md:77`, `docs/roadmap.ko.md:77`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/design.md:63`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/design.md:67`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/design.md:86`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/changelog.md:5`
evidence: read `docs/roadmap.md:71`, `docs/roadmap.md:77`, `docs/roadmap.ko.md:77`, `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/design.md:86`; executed `gh issue view 304 --json number,title,body,comments,milestone,state`
```

Why it matters: the paragraph gives the no-test case its asker, "The orchestrator asks the owner then". For test 1 it says only "Under test 1 the line names the release and what the issue blocks, and the issue keeps no milestone until the owner's word" (`docs/roadmap.md:77`). Set against the sentence that names an asker, the test 1 sentence reads as an instruction to wait, not to ask. The paragraph's own opening sentence makes this worse. An issue with no milestone and with a line that says why is sorted, so once the orchestrator leaves the test 1 line, the issue no longer reads as one anybody has to look at. A blocker of the open release can then wait for a word that nobody asked for. When the release ships, test 1 no longer applies to the issue. It still keeps no milestone and its line, so it reads as sorted from then on, and none of tests 2 to 5 is ever applied to it. Issue #304's *Done when* asks that "only rule 1 waits for the owner", and the build keeps that. The gap is who brings the issue to the owner, and what becomes of it after the release. Scenario C (`frame/design.md:86`) states the same sentence without an asker.

The fix, in `docs/roadmap.md:77`, replaces "Under test 1 the line names the release and what the issue blocks, and the issue keeps no milestone until the owner's word." with:

```markdown
Under test 1 the line names the release and what the issue blocks, the orchestrator asks the owner, and the issue keeps no milestone until the owner's word. Where the release ships without that word, the orchestrator sorts the issue again by tests 2 to 5.
```

In `docs/roadmap.ko.md:77`, it replaces "조건 1에서는 그 줄이 릴리스와 이슈가 막는 것을 밝히고, 저장소 소유자가 말하기 전까지 이슈에는 마일스톤이 없습니다." with:

```markdown
조건 1에서는 그 줄이 릴리스와 이슈가 막는 것을 밝히고, orchestrator가 저장소 소유자에게 물으며, 저장소 소유자가 말하기 전까지 이슈에는 마일스톤이 없습니다. 그 말 없이 릴리스가 나가면 orchestrator는 조건 2부터 5까지로 그 이슈를 다시 분류합니다.
```

The same sentences replace the old ones in the quotes at `frame/design.md:63` and `frame/design.md:67`. In Scenario C (`frame/design.md:86`), "Then it sets no milestone, leaves a line that names the release and what the issue blocks, and the issue takes `release: <version>` only on the owner's word." becomes "Then it sets no milestone, leaves a line that names the release and what the issue blocks, asks the owner, and the issue takes `release: <version>` only on the owner's word." With finding 1 applied as well, the second sentence of `changelog.md:5`'s bullet reads:

```markdown
The orchestrator sorts an issue by it without asking, except where the issue blocks the open release, meets no test, or asks for work the roadmap holds outside the first version.
```

### 3. Scenario B and the roadmap's ground 4 hold #176 in `owner: by hand`, and the tracker moved it into `release: 0.1.0`

```seal
severity: should
location: `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/design.md:85`, `docs/roadmap.md:39`, `docs/roadmap.ko.md:39`
evidence: executed `gh issue view 176 --json number,title,state,milestone`, `gh api 'repos/{owner}/{repo}/issues/176/timeline?per_page=100' --paginate`, `gh issue list --state all --milestone "owner: by hand" --json number,title,state,createdAt`, `git grep -n -F 'owner: by hand' HEAD -- docs README.md README.ko.md`; read `seal/threads/1795739989-304-a-new-issue-is-placed-by-a-written-rule/frame/design.md:16-17`, `docs/roadmap.md:39`
```

Why it matters: Scenario B (`frame/design.md:85`) says an issue like #176 or #221 goes to `owner: by hand` by test 3, "which is where the tracker holds them", and it is read "at the build's head". At the time of this round the tracker holds #176, #184 and #110 in `release: 0.1.0`. The timeline of #176 shows it demilestoned from `owner: by hand` and milestoned `release: 0.1.0` at 2026-11-27T00:44:58Z, with the comment "Moved into `release: 0.1.0` on the owner's word (2026-11-27)". `owner: by hand` now holds #221, #228 and #229 alone. The *Grounding* rows at `frame/design.md:16-17` state the tracker as the framer read it. The move came about three minutes before the frame's commit `d2474f15`, so those rows may describe what the framer saw, and the round does not count them as a finding. Scenario B states the present, and it no longer holds for #176. The order of the tests still holds: #221 stands in `owner: by hand`, and #176's move on the owner's word is test 1 standing above test 3.

The frame took its order from `docs/roadmap.md` *Why this order* ground 4, which reads "issue #176, which moved to release 0.0.5 on 2026-11-25 and stands in the milestone `owner: by hand` since 2026-11-26" (`docs/roadmap.md:39`, `docs/roadmap.ko.md:39`). That sentence is a present-tense policy sentence, it is now false, and the order this work writes was built on it. This pull request edits the roadmap, so the fix pass corrects it here. Leaving it for the settle of release 0.1.0 is the alternative, and the close then names that home. The release table's row 0.1.0, which does not name #176, #184 and #110, stays out of scope as `frame/design.md` *Out of scope* says, since the settle writes it. The search above printed ground 4 and no other sentence that holds #176 in `owner: by hand`. It is a sample under contract rules 12 and 19.

The fix, in Scenario B at `frame/design.md:85`:

```markdown
| B. Two tests met | Given an issue like #221, a defect or a gap a person met in what has shipped that only the owner can do, and an issue like #57, a walk of milestone 3 by hand. When the list is read from the top. Then the first goes to `owner: by hand` by test 3 and the second to `milestone 3: hand over an issue` by test 2, which is where the tracker holds them. #176 stood in `owner: by hand` until the owner's word moved it into `release: 0.1.0` on 2026-11-27, which is test 1 standing above test 3. | Read the list's order at the build's head against the *Grounding* rows on `owner: by hand` and on milestones 3 to 5. |
```

In `docs/roadmap.md:39`, "which moved to release 0.0.5 on 2026-11-25 and stands in the milestone `owner: by hand` since 2026-11-26." becomes:

```markdown
which moved to release 0.0.5 on 2026-11-25, stood in the milestone `owner: by hand` from 2026-11-26, and stands in `release: 0.1.0` since 2026-11-27 on the owner's word.
```

In `docs/roadmap.ko.md:39`, "#176은 2026-11-25에 릴리스 0.0.5로 옮겼고, 2026-11-26부터는 마일스톤 `owner: by hand`에 있습니다." becomes:

```markdown
#176은 2026-11-25에 릴리스 0.0.5로 옮겼고, 2026-11-26에 마일스톤 `owner: by hand`로, 2026-11-27에 저장소 소유자의 말로 `release: 0.1.0`으로 옮겼습니다.
```

## Confirmations

What matched: the text of *Scope* items 1 and 2 stands word for word in both editions between the milestone table and the paragraph on release 0.0.3 (`docs/roadmap.md:69-77`, `docs/roadmap.ko.md:69-77`). *Scope* item 3's rewrite of the hardening row stands at `docs/roadmap.md:65` and `docs/roadmap.ko.md:65`, as the diff shows. This was executed by a comparison of every quoted line of `frame/design.md` against both files, and it confirms phase 1's claim "went in word for word" and "No departure from the frame".

What matched: Scenario E executed at the target. Each of the four searches prints one line: `docs/roadmap.md:77`, `docs/roadmap.md:69`, `docs/roadmap.ko.md:77`, `docs/roadmap.ko.md:69`. Scenario F executed: both searches for the old limit print nothing. These are the lines phase 1 names.

What matched: the counts of Scenario H, executed with `grep -c` as `grep`s and not as the broad gate. Both editions count 11 lines that open with `#` and 40 that open with `|`, and `git grep -n -e '도장' -- docs README.md README.ko.md` exits 1.

What matched: Scenario G, executed with `gh api 'repos/{owner}/{repo}/milestones?state=open'`. `release: 0.1.0`, `owner: by hand`, `after launch: first findings and conveniences` and `hardening: boundaries and edge cases` are open under those titles. Test 2 names its milestone through the table, whose titles are open too.

What matched: the two editions say the same, read sentence by sentence at `docs/roadmap.md:69-77` and `docs/roadmap.ko.md:69-77`. The lead sentence, the five tests and their order, and each sentence of the paragraph have their counterparts, and the anchors `#milestones`, `#after-the-first-version`, `#마일스톤` and `#첫-버전-다음` are slugs of headings in their own files (read `docs/roadmap.md:15`, `docs/roadmap.md:121`, `docs/roadmap.ko.md:15`, `docs/roadmap.ko.md:121`).

What matched: no other sentence of the roadmap is contradicted or said twice, apart from ground 4 in finding 3. The round weighed three sentences. The opening paragraph's "the two tables state the releases and the milestones as the tracker holds them that day" (`docs/roadmap.md:47`) is not made false by the widened hardening goal. The goal column paraphrases the tracker: row 3's goal is "Row 3 of Milestones", while milestone #3's description runs a paragraph. The rewrite of #8's description is the orchestrator's, as `gaps.md` *Not done* says. "The table states no order of work beyond the one Why this order gives" (`docs/roadmap.md:58`) still holds, because the list orders tests and not work. The `owner: by hand` row's "which the orchestrator asks the owner about at the end of each release" does not conflict with "Tests 2 to 5 wait for nobody", because test 3 places the issue and the asking about the work comes later. `git grep -n -i -e 'milestone' HEAD -- ':!docs/roadmap*.md' ':!seal' ':!apps'` and the search for `sorted` and `triage` across `docs` and the two READMEs found no other text that places an issue (executed). The repository has no `.github/ISSUE_TEMPLATE`.

What matched: phase 1's claim that the repository has no document check of its own. `package.json` runs `pnpm -r run check`, and `apps/desktop/package.json:17` runs the typecheck and the tests (read). `gaps.md` labels the broad gate as not run, with the orchestrator as its answerer, and that label is honest.

What matched: `gaps.md` row 3, "no second reader applied the list to a live issue", is answered by the list under the round block. Closing the row is the fix pass's. One placement there is a judgment the round could not settle from the text: #228, work item links in the sidebar, meets test 3 only where "Only the owner can do it" covers work that waits on the owner's choice of a sheet. The rule moves no issue that holds a milestone, so this changes nothing in the tracker.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a person with no role on this public repository, owned by a user account, can set a milestone on an issue they open (`frame/questions.md` Q1). The round has only the owner's account and ran no probe. | `docs/roadmap.md:77`, `docs/roadmap.ko.md:77` | a measurement by a second account with no role, which the orchestrator or the owner holds |
| The documents leg of the broad gate, and the rest of the broad gate, run as the command in `seal/config.json` `Broad gate`. Under contract rule 2 the round ran only the `grep -c` counts. | `seal/config.json` | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `gh issue view <n> --json title,body,comments,labels` for #108, #136, #137, #250, #34, #120, and `--json body` or `--json comments` for #98, #35, #228, #229, #221 | each issue's body and comments, read for whether a line says why it has no milestone and for which test it meets |
| `gh issue view <n> --json number,title,state,milestone` for #176, #184, #110, #221, #57, #300, #296 | #176, #184, #110, #300 and #296 in `release: 0.1.0`, #221 in `owner: by hand`, #57 in `milestone 3: hand over an issue` |
| `gh api 'repos/{owner}/{repo}/issues/<n>/timeline?per_page=100' --paginate` for #176, #184, #110 | each demilestoned from `owner: by hand` and milestoned `release: 0.1.0` at 2026-11-27T00:44Z, with a comment naming the owner's word |
| `gh issue list --state all --milestone <title>` for `owner: by hand`, `hardening: boundaries and edge cases`, `after launch: first findings and conveniences` | `owner: by hand` holds #221, #228, #229; hardening holds #144 to #219; after launch holds #73, #227 to #289 |
| `gh issue list --state open --search 'no:milestone'` | #250, #137, #136, #120, #108, #98, #35, #34 |
| `gh api 'repos/{owner}/{repo}/milestones?state=open'` | seven open milestones under the titles `frame/design.md` *Grounding* names; #8's description still reads "found while milestones 1 and 2 were built" |
| The four Scenario E searches and the two Scenario F searches, at the target | E prints one line each at `docs/roadmap.md:69`, `docs/roadmap.md:77`, `docs/roadmap.ko.md:69`, `docs/roadmap.ko.md:77`; F prints nothing |
| `grep -c '^#'` and `grep -c '^\|'` on both editions, and `git grep -n -e '도장' -- docs README.md README.ko.md` | 11 and 40 in each; the search exits 1 |
| `python3 -I` comparing every quoted line of `frame/design.md` against both roadmap editions | every quoted line found in its edition |
