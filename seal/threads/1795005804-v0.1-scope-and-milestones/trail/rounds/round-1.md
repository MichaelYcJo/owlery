# Review round 1: 1795005804-v0.1-scope-and-milestones

```seal
target: e40f6fd against main
```

The branch against `main` at `21683b1`, at HEAD `e40f6fd` (executed: `git log --oneline main..HEAD` in a `git clone --no-local` of the worktree, twelve commits from `9aa6d7c` to `e40f6fd`). This is round 1, so no earlier round carries a coordinate or a deferral. The reviewer runs on Opus 5.5, and the framer and every crafter ran on Fable 5.2 (`frame/plan.md` *Judgments of the run*, row 1).

The work is prose in the policy root and in the work item's records. It has no code and no suite, so the quality stage reads the documents for correctness, consistency between the two editions, and links. The axes named for this change are: one fact in one home (C5), the source of each settled statement (C3), names and comparisons (C1), private-notes coordinates (C6), the Korean word for seal (C2), the agreement of the two editions (C4 and scenario 2), link and anchor resolution, and whether the records state the target truly.

## Findings

### 1. Ground 1 of the roadmap restates the skeleton reason that architecture Build order holds

```seal
severity: must
location: `docs/roadmap.md:33`, `docs/roadmap.ko.md:33`, `docs/architecture.md:229`, `docs/architecture.ko.md:229`, `seal/threads/1795005804-v0.1-scope-and-milestones/frame/design.md:123`
evidence: read `docs/roadmap.md:33`, `docs/roadmap.ko.md:33`, `docs/architecture.md:229`, `docs/architecture.ko.md:229`, `seal/threads/1795005804-v0.1-scope-and-milestones/frame/design.md:90`, `seal/threads/1795005804-v0.1-scope-and-milestones/gaps.md:17`
```

Why it matters: scenario 4 of `frame/design.md` (line 90) requires that no order ground stand in both `docs/roadmap.md` and `docs/architecture.md` *Build order*, and C5 requires one home for each fact. `docs/architecture.md:229` says "The window, the daemon and the sessions must be connected from the first milestone, so that the structure need not be redone when the AgenticSeal process is built on it." `docs/roadmap.md:33` says "The window, the daemon and the sessions are connected from milestone 1, so the structure is not redone when the AgenticSeal process is built on it." That is the same fact in nearly the same words. The Korean pair at line 229 and line 33 repeats it. The milestone 1 row at `docs/roadmap.md:21` already cites *Build order* for this reason, so the roadmap restates what it also links. The claim in `gaps.md:17` that this is left for a reader to weigh is true, and this round weighs it as a failed acceptance row. The source of the defect is the frame: `frame/design.md:123` fixes ground 1 with the reason in it, while *Scope* item 8 keeps the same rule in the architecture document. So the frame has to change too, or the next reader of the frame will rebuild the duplicate.

The fix keeps the reason in `docs/architecture.md` *Build order*, the home *Scope* item 8 names, and makes ground 1 cite it. In `docs/roadmap.md` line 33, replace the second sentence:

```markdown
1. **The process comes right after the shell, and the back of the seal comes with the process.** The process is built on the skeleton milestone 1 connects, for the reason [Build order](architecture.md#build-order) gives. The back of the seal shows, in the user's own numbers, whether the seal is worth what it costs. If it came late, it would read as one more count of review findings.
```

In `docs/roadmap.ko.md` line 33:

```markdown
1. **프로세스는 껍데기 바로 다음에 오고, 인장의 뒷면은 프로세스와 함께 옵니다.** 프로세스는 마일스톤 1이 이어 놓은 뼈대 위에 만들고, 그 까닭은 [만드는 순서](architecture.ko.md#만드는-순서)에 있습니다. 인장의 뒷면은 인장이 제값을 하는지를 사용자 자신의 수치로 보여 주는 자리입니다. 늦게 나오면 리뷰 발견 수를 하나 더 보여 주는 것으로 읽힙니다.
```

The snippet leaves three statements of the same fact, and the fix pass owes them too. The first is `frame/design.md:123`, whose words "so the structure is not redone" become a citation of *Build order*. The second is the second bullet of `gaps.md` *Not done* (line 17), which stops being true once this lands. The third is the paragraph of `gaps.md` at line 20, which carries the same item for the Korean editions.

```seal
verdict: fixed d7f51be
location: `seal/threads/1795005804-v0.1-scope-and-milestones/gaps.md`
answer: The finding holds. Line 33 of `docs/roadmap.md` and of `docs/roadmap.ko.md` no longer states the reason: it cites *Build order* by a link, in the words the framer fixed at `02ccdbe` in `frame/design.md` ground 1, which hold this snippet's sentence and the sentence of finding 3 before it. `docs/architecture.md:229` and its Korean line stay as the reason's one home. The frame's ground 1 and *Scope* item 8 were rewritten by the framer at `02ccdbe`. The two statements in `gaps.md` *Not done* left the memo at `dd125f4`, which is why this block names that file.
```

### 2. When the trial starts is settled prose, from a source C3 does not count as a decision

```seal
severity: must
location: `docs/roadmap.md:53`, `docs/roadmap.ko.md:53`, `docs/roadmap.md:92`, `docs/roadmap.ko.md:92`, `seal/threads/1795005804-v0.1-scope-and-milestones/frame/design.md:132`
evidence: read `docs/roadmap.md:53`, `docs/roadmap.ko.md:53`, `seal/threads/1795005804-v0.1-scope-and-milestones/frame/design.md:68`, `seal/threads/1795005804-v0.1-scope-and-milestones/frame/design.md:94`, `seal/threads/1795005804-v0.1-scope-and-milestones/trail/phases/phase-1.md:23`; executed `gh issue view 1 --json title,body,comments,state` and `git grep -n -i -e 'trial' -- docs/product.md docs/architecture.md` (no line printed)
```

Why it matters: C3 at `frame/design.md:68` names three sources of decisions: the committed documents, the notes' list of what the owner decided, and what the owner asked in #1. Anything else from the notes enters as an open decision. Scenario 8 checks that nothing undecided reads as settled. `docs/roadmap.md:53` states "It starts before milestone 2 is done, because a weak result changes the direction." Phase 1 claims (`trail/phases/phase-1.md:23`) that the source of this sentence is the notes' list of work left, which C3 does not count. This round checked the other three sources and found no decision. #1 names the trial only as a done criterion (Asked item 6), with no start time. No committed document holds the word "trial", since the search exited 1. The frame's list of the owner's decisions (`frame/design.md:25`) does not hold it. The frame itself fixes the sentence at `frame/design.md:132`, so the frame contradicts its own C3. The Open decisions row on the trial (`docs/roadmap.md:92`) leaves its start out. A reader of the policy document takes the start as decided, and the owner did not decide it.

The fix moves the start into the trial's row of *Open decisions* and takes it out of the prose. In `docs/roadmap.md`, delete the last sentence of the paragraph at line 53 ("It starts before milestone 2 is done, because a weak result changes the direction."), and replace the row at line 92 with:

```markdown
| The trial on other people's PRs | Which repositories, how many PRs, what counts as a defect, and whether it starts before milestone 2 is done | The more careful a repository's human review is, the firmer the comparison. A weak result would change the direction, so the earlier it starts, the less is built before the answer |
```

In `docs/roadmap.ko.md`, delete the last sentence at line 53 ("결과가 약하면 방향이 바뀌므로, 마일스톤 2가 끝나기 전에 시작합니다."), and replace the row at line 92 with:

```markdown
| 남의 PR로 하는 시험 | 어느 저장소에서, PR 몇 개로, 무엇을 결함으로 셀 것인가, 그리고 마일스톤 2가 끝나기 전에 시작하는가 | 그 저장소의 사람 리뷰가 꼼꼼할수록 비교가 단단해집니다. 결과가 약하면 방향이 바뀌므로, 일찍 시작할수록 답이 나오기 전에 만들어 두는 것이 적습니다 |
```

The snippet leaves one statement, and the fix pass owes it too: the sentence "It starts before milestone 2 is done, because a weak result changes the direction" at `frame/design.md:132`, with the trial's row at `frame/design.md:154`. Another fix is possible. If the owner confirms the start as a decision, the prose may stay, and the fix pass records that answer and its date in the frame as the source C3 asks for. That fix is the owner's to choose, so it goes through the orchestrator.

```seal
verdict: fixed 02ccdbe
answer: The finding held at its target, and it is closed by the other fix it names. The owner confirmed on 2026-11-18, after this round, that the trial starts before milestone 2 is done and that this is a decision. The fix pass did not hear the owner: it read the record of that answer, the third row of `frame/plan.md` *Judgments of the run*. At `02ccdbe` the framer made such a row the fourth source C3 names and wrote at `frame/design.md:132` that the start is that decision and that the trial's row of *Open decisions* does not hold it. So line 53 and line 92 of both roadmap editions stay as they are, and the fix pass changed no line for this finding.
```

### 3. The Removes cell says the old opening paragraph of Build order landed in the roadmap, and one of its sentences landed nowhere

```seal
severity: should
location: `seal/threads/1795005804-v0.1-scope-and-milestones/frame/design.md:172`, `docs/roadmap.md:33`, `docs/roadmap.ko.md:33`
evidence: read `seal/threads/1795005804-v0.1-scope-and-milestones/frame/design.md:172`, `seal/threads/1795005804-v0.1-scope-and-milestones/gaps.md:16`, `docs/roadmap.md:29-40`; executed `git diff main...HEAD -- docs/architecture.md`
```

Why it matters: the opening paragraph of *Build order* at `main` had two sentences. The second was "AgenticSeal already shows the value of the AgenticSeal process inside Claude Code, so what Owlery must establish first is the experience of an app you hand work to and step away from." The diff removes it. `frame/design.md:172` says the opening paragraph lands in `docs/roadmap.md` *Milestones* rows 1 to 3 and *Why this order*. Neither holds that sentence, and no other committed sentence says why the shell comes before the process. `gaps.md:16` says the same thing, and that claim holds. So the frame cell is false at the target, and a committed ground of the order left the policy root with no decision recorded. The settle and the next framer read *Removes* as the list of where each removed fact went.

The fix keeps the committed ground: it goes into ground 1, whose subject is what comes right after the shell. In `docs/roadmap.md` line 33, after the bold sentence and before the sentence finding 1 rewrites, insert:

```markdown
The shell comes first because the AgenticSeal plugin already shows the value of the process inside Claude Code, so what Owlery has to establish first is an app a person hands work to and steps away from.
```

In `docs/roadmap.ko.md` line 33, at the same place:

```markdown
껍데기가 먼저인 것은 AgenticSeal 플러그인이 Claude Code 안에서 이미 프로세스의 가치를 보여 주고 있어서, Owlery가 먼저 세울 것은 사람이 일을 맡기고 자리를 비우는 앱이기 때문입니다.
```

The fix pass owes three more statements. The first is `frame/design.md:123`, the frame's ground 1, which gets the same clause. The second is the first bullet of `gaps.md` *Not done* (line 16), with the paragraph at line 20. The third is the claim at line 31 of `docs/roadmap.md` that the order "stands on four grounds", which stays true only because the clause joins ground 1 and does not make a fifth. There is another fix. If the fix pass judges the sentence should go, then `frame/design.md:172` has to say the sentence is dropped and give the reason, and no roadmap line changes.

```seal
verdict: fixed d7f51be
location: `seal/threads/1795005804-v0.1-scope-and-milestones/gaps.md`
answer: The finding holds, and the sentence is kept. It stands in ground 1 at line 33 of `docs/roadmap.md` and of `docs/roadmap.ko.md`, after the bold sentence, in this snippet's words. The order still stands on four grounds. The framer rewrote the *Removes* cell and the frame's ground 1 at `02ccdbe`. The first bullet of `gaps.md` *Not done* and its Korean paragraph left the memo at `dd125f4`, which is why this block names that file.
```

### 4. Authentication of the Claude adapter states the Agent SDK overview's rule twice, with two dates

```seal
severity: should
location: `docs/architecture.md:48`, `docs/architecture.md:57`, `docs/architecture.ko.md:48`, `docs/architecture.ko.md:57`
evidence: read `docs/architecture.md:48`, `docs/architecture.md:57`, `docs/architecture.ko.md:48`, `docs/architecture.ko.md:57`, `seal/threads/1795005804-v0.1-scope-and-milestones/trail/phases/phase-2.md:13`, `seal/threads/1795005804-v0.1-scope-and-milestones/trail/phases/phase-3.md:56`; executed a fetch of the Agent SDK overview on Anthropic's Claude Code documentation site on 2026-11-18
```

Why it matters: line 48 says "The Agent SDK documentation does not allow third-party products without prior approval to offer claude.ai login or subscription usage limits (Agent SDK overview, checked 2026-11-17)." Line 57, which this diff writes, says "The Agent SDK overview says that, unless previously approved, third-party developers may not offer claude.ai login or rate limits for their products. Both were read on 2026-11-18." That is one fact from one page, stated twice in one section, in two wordings and with two dates, against C5. Phase 2 claims (`phase-2.md:13`) that it added the sentence so the reader can see what the judgment rests on. The sentence at line 48 already shows that, nine lines above. Phase 3 left the two dates for the reviewer (`phase-3.md:56`). A later edit that changes one statement will leave the other standing. The fetch this round ran returns the note "Unless previously approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products", so the wording "rate limits" at line 57 is the page's, and line 48 paraphrases it.

The fix keeps line 48 as the home, moves the reading date there, and makes line 57 cite it. In `docs/architecture.md` line 48, replace "(Agent SDK overview, checked 2026-11-17)" with "(Agent SDK overview, read 2026-11-18)". In line 57, replace the two sentences "The Agent SDK overview says that, unless previously approved, third-party developers may not offer claude.ai login or rate limits for their products. Both were read on 2026-11-18." with:

```markdown
The Agent SDK overview holds the rule on claude.ai login stated at the top of this section. Both were read on 2026-11-18.
```

In `docs/architecture.ko.md` line 48, replace "(Agent SDK overview, 2026-11-17 확인)" with "(Agent SDK overview, 2026-11-18에 읽음)". In line 57, replace "Agent SDK overview는 미리 승인받지 않은 제3자 개발자가 자기 제품에 claude.ai 로그인이나 사용 한도를 제공할 수 없다고 적습니다. 둘 다 2026-11-18에 읽었습니다." with:

```markdown
Agent SDK overview에는 이 절 첫머리에 적은 claude.ai 로그인에 관한 규칙이 있습니다. 둘 다 2026-11-18에 읽었습니다.
```

The first sentence of line 57 still says "Anthropic publishes two documents that bear on this", so the overview stays one of the two documents the judgment names, as *Scope* item 13 asks. The departure at `phase-2.md:13` needs no edit, because a phase record is history. `changelog.md:8` stays true.

```seal
verdict: fixed d7f51be
answer: The finding holds, and the fix is applied as written, in both editions. Line 48 is the one statement of the rule and carries the date of the latest reading, 2026-11-18. Line 57 cites it and still names both documents by title with that date, as *Scope* item 13 of `frame/design.md` asks. `changelog.md` needed no change.
```

### 5. The closing memo says the Status cell of Q2 still reads open, and it reads answered

```seal
severity: should
location: `seal/threads/1795005804-v0.1-scope-and-milestones/gaps.md:22`
evidence: read `seal/threads/1795005804-v0.1-scope-and-milestones/gaps.md:22`, `seal/threads/1795005804-v0.1-scope-and-milestones/frame/questions.md:19`; executed `git log --format='%h %s' --name-only 21cdd85..HEAD`
```

Why it matters: `gaps.md:22` says "The Status cell of `frame/questions.md` Q2 still reads `open`" and names the cell as the orchestrator's to fold. At `e40f6fd`, `frame/questions.md:19` reads "answered 2026-11-18 by the phase 3 crafter", and the fold was made at `e40f6fd`, which touched `frame/questions.md`. The memo is a record of the present that the sealer reads. A sealer or a later orchestrator that acts on it would look for a fold that was already made.

```markdown
- **The Status cell of `frame/questions.md` Q2 was left for the orchestrator.** Phase 3 answered Q2 in `trail/phases/phase-3.md` *The words chosen for Q2*, and `agents/crafter.md` *Job* does not list `frame/questions.md` among the crafter's writes. The orchestrator folded the answer into the cell at `e40f6fd`.
```

The paragraph at `gaps.md:20` ends with "Phase 3 left one more thing", and the fix pass rewrites it in the same edit, for example as "Phase 3 left one more thing, since folded".

```seal
verdict: fixed dd125f4
answer: The finding holds. The fix is in the fix pass's own words and not the snippet's: the bullet and the sentence that led to it are removed from `gaps.md` *Not done*. The cell was folded at `e40f6fd`, so nothing about it is still not done, and a bullet that says it was once left would be history, which git and `trail/phases/phase-3.md` keep. The section now holds the one thing still within reach and not taken.
```

## Confirmations

What matched: scenario 2 holds (executed in the clone). `grep -c '^#'` printed 11 for both editions of `roadmap` and 26 for both editions of `architecture`. `grep -c '^|'` printed 26 for both editions of `roadmap`, 108 for both editions of `architecture` and 6 for each README. `sed -n 3p` of each roadmap edition printed the two switch lines the scenario names. `wc -l` gave 99, 341 and 26 lines for each pair. So phase 3's claim of equal line counts (`phase-3.md:63`) holds.

What matched: the reading half of scenario 2 holds, and so does the reading `gaps.md:9` hands the proofer. This round read `docs/roadmap.ko.md` against `docs/roadmap.md` cell by cell, and the four changed parts of `docs/architecture.ko.md` (lines 57, 225 to 231, 328, 337 and 338) against the English. Each says what the English says. The terms reuse the existing editions, the four inbox states of `docs/product.ko.md:17` among them (read). One term is new and missing from the table in `phase-3.md:15-36`: "fix passes" is rendered 지적 수정 at `docs/roadmap.ko.md:22`. It reads correctly, and this round opens no finding for it.

What matched: scenarios 5, 7 and 11 hold (executed in the clone). Each `git grep` printed nothing and exited 1. `git grep -n -i 'anthropic' -- docs` printed eight lines: lines 57, 328 and 338 of each architecture edition and line 55 of each roadmap edition. This round read each one, and none says Owlery asks Anthropic or waits for its answer. So phase 3's claim at `phase-3.md:69` holds.

What matched: scenario 6 holds (executed). The name list was built in the round's scratch directory from the owner's notes in the worktree, by the command the spawn prompt gives. It holds 27 names, and the build exited 0. `git grep -n -i -w -F -f` over `docs`, `README.md`, `README.ko.md` and `seal` in the clone exited 1 and printed nothing. The list is a sample. So this round also read every added line of the diff for a product name or a comparison, and searched it for a further set of product names and comparison phrases. The only hits were the frame's own statements of C1 and of the removed clause on "other review tools". `docs/architecture.md` and `docs/architecture.ko.md` no longer hold that clause, as `frame/design.md:174` says.

What matched: C6 holds for every file this pull request commits (executed: `git grep -n -i` over the clone for the notes' directory name and file names, and for the notes' list heading that #1 quotes). The only hit is a line that `main` already held, outside this diff. It is listed under *Not judged*. No record in this round quotes a path, a file or a heading of the notes.

What matched: every in-repository link with an anchor in the two roadmap editions and the two architecture editions resolves on GitHub's rendering. That is 96 links, and 0 were missing. This answers `gaps.md:8` (executed: each target document rendered through `gh api markdown`, each anchor compared with the `user-content-` ids it returned; the probe `test_tmp_anchors.py`, by its own slug rule, also found 118 links across the six files with 0 missing). Phase 3's counts at `phase-3.md:72` hold: 28, 23 and 8 links a file, two files each.

What matched: the two Anthropic pages say what `docs/architecture.md:57` and `frame/design.md:23` rest on (executed: WebFetch on 2026-11-18). The Agent SDK overview on Anthropic's Claude Code documentation site holds the note on claude.ai login and rate limits, and no sentence on another product launching the user's logged-in CLI. The support article "Use the Claude Agent SDK with your Claude plan" holds the June 15, 2026 update, "Claude Agent SDK, `claude -p`, and third-party app usage still draw from your subscription limits", and an October 7, 2026 update. Neither update addresses that launch. So the closed row at `gaps.md:10` holds.

What matched: *Scope* items 8 to 16 are built as written (read: `docs/architecture.md:57`, `:225-231`, `:328`, `:337`, `:338` and the Korean lines at the same numbers). The headings *Build order* and *만드는 순서* stay, so `docs/product.md:27` and `docs/product.ko.md:27` still resolve. Item 12 is built (read: `README.md:17`, `README.ko.md:17`).

What matched: the first-part body `pr.md` quotes four cells, and each is found word for word at the coordinate it names (read: `frame/plan.md:17`, `:26`, `:56`, `:58`). Record language and commit language are both English, so no `pr.<lang>.md` is owed. Each item of `changelog.md` is true at the target (read).

What matched: the claim at `gaps.md:7` holds: the commits after `21cdd85` touch only the work item's records (executed: `git log --name-only 21cdd85..HEAD`, listing `41e45a8` and `e40f6fd`). The label `unverified` on the broad gate, with the orchestrator as answerer, is honest. This round did not run the broad gate (contract rule 2).

What matched: the third item of `gaps.md` *Not done* (line 18) holds, and it is no defect. `README.md:16` lists "the build order" among the contents of `docs/architecture.md`, and that section still stands under that heading.

## Not judged

| What | Location | Who answers |
|---|---|---|
| A file outside this diff, already at `main`, names the directory of the owner's private notes in a public repository. C6 binds only the files this pull request commits | `.gitignore:161` | The owner |
| Whether the specifics in milestone 1, "Owlery never turns a permission check off" and "The daemon's local server accepts only an authenticated client", are what #1's "safe defaults" meant. This round read them as asked in #1, which lists safe defaults as part of v0.1, and found no committed document that holds them | `docs/roadmap.md:21` | The owner, through the orchestrator |
| The broad gate, the `Broad gate` command of `seal/config.json` at HEAD | `seal/config.json` | The orchestrator, in the broad run after the rounds settle |

## Probes

| Command | Result |
|---|---|
| `python3 -I test_tmp_anchors.py` over the clone (the round's scratch directory) | 118 links across the six changed documents, 0 missing files or anchors, exit 0. The slug rule is the probe's own |
| `gh api markdown` on each of the six documents in `docs/`, then the anchors of the four changed `docs/` files compared with the rendered `user-content-` ids | 96 anchored links checked, 0 missing, exit 0 |
| `git grep -n -i -w -F -f` with the 27-name list, over `docs`, `README.md`, `README.ko.md` and `seal` | no output, exit 1 |
| WebFetch of the Agent SDK overview and of the support article, 2026-11-18 | the overview note on claude.ai login and rate limits, the support article's June 15 and October 7, 2026 updates, and no sentence on another product launching the user's logged-in CLI |
