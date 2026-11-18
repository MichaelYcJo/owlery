# Review round 2: 1795005804-v0.1-scope-and-milestones

```seal
target: 17c7b3a, fixes e40f6fd..17c7b3a
```

This is a verifying round. Its target is `git diff e40f6fd 17c7b3a`, in a `git clone --no-local` of the branch worktree at `17c7b3a`, with a local `main` at `21683b1` (executed: `git log --oneline -1` printed `17c7b3a`). The range holds five commits. `02ccdbe` is the framer's fold of round 1's frame-located findings and of the owner's decision on the trial. `d7f51be` and `dd125f4` are the fix pass. `29de214` appends the five close blocks to round 1's record and deletes nothing in it. `17c7b3a` is the orchestrator's repair of a `pr.md` coordinate (executed: `git show --stat` of each). The reviewer runs on Opus 5.5. The framer and every crafter ran on Fable 5.2, as row 1 of `frame/plan.md` *Judgments of the run* records.

Round 1's coordinates are carried, and its verdicts are not. Carried without a fresh search: the homes of the facts at `docs/architecture.md:229` and `docs/roadmap.md:21`, the line numbers of each pair (each file still has 99 or 341 lines, executed `wc -l`), and round 1's GitHub rendering of the anchors at lines 21 and 80 of each roadmap edition. That rendering is re-derived below, because the fix pass added a link to the same anchors. Round 1 deferred nothing.

Besides the fix diff, this round read the work item's present-state records whole at `17c7b3a`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`, and then the three phase records. Record language and commit language are both English, so no `pr.<lang>.md` is owed. The work is prose with no code and no suite. No test was added, so no test is read against a group.

## Findings

### 1. The closing memo says round 1 checked the README pair's anchors on GitHub's rendering, and round 1 checked only the four `docs/` files

```seal
severity: should
location: `seal/threads/1795005804-v0.1-scope-and-milestones/gaps.md:8`
evidence: read `seal/threads/1795005804-v0.1-scope-and-milestones/gaps.md:8`, `seal/threads/1795005804-v0.1-scope-and-milestones/trail/rounds/round-1.md:164`, `seal/threads/1795005804-v0.1-scope-and-milestones/trail/rounds/round-1.md:189`, `README.md:26`, `README.ko.md:26`; executed `command grep -n '](.*#' README.md README.ko.md` (two lines) and `gh api markdown -F text=@<file> -f mode=markdown` on `docs/architecture.md` and `docs/architecture.ko.md`, with the two anchors found among the `user-content-` ids
regression: round-1
```

Why it matters: the unit is row 8 of `gaps.md` *Not verified*, which the fix pass closed at `dd125f4`. Its Item cell covers the anchors in the two roadmap editions, the two architecture editions "and in the README pair". Its answer cell says "Round 1 rendered each target document through GitHub's Markdown API at `e40f6fd` and compared every anchor with the ids it returned: 96 anchored links, none missing". Round 1's record says otherwise. `round-1.md:164` counts 96 links "in the two roadmap editions and the two architecture editions". The *Probes* row at `round-1.md:189` compares "the anchors of the four changed `docs/` files". The README pair holds two anchored links, at `README.md:26` and `README.ko.md:26`. Round 1 checked them only by its probe's own slug rule. That is the kind of check the Item cell says is not enough. So the close claims a GitHub check that nobody ran for those two links. The sealer reads a closed row as verified.

The frame and the fix stand like this. Scenario 4 of `frame/design.md` asks that each link's target heading be opened, and the fix pass names no plan row. The pass closed the row by citing round 1's count of links without reading which files that count covered. The defect came from that.

The fact itself holds at the target. This round rendered `docs/architecture.md` and `docs/architecture.ko.md` through GitHub's Markdown API. The ids `license-and-code-from-other-projects` and `라이선스와-다른-프로젝트의-코드` are both among the `user-content-` ids returned, so both README links resolve. The fix only rewrites the answer cell to name who checked what. Replace row 8 with:

```markdown
| closed That each anchor in the two editions of `docs/roadmap` and `docs/architecture` and in the README pair resolves on GitHub's rendered page, the Korean anchors among them. The three phases compared the anchors with the target files' headings by a rule of their own | Round 1 rendered each target document through GitHub's Markdown API at `e40f6fd` and compared the 96 anchored links of the four `docs/` files with the ids it returned, none missing (`trail/rounds/round-1.md` *Confirmations* and *Probes*). Round 2 compared the README pair's two anchored links, at line 26 of each, with the ids of `docs/architecture.md` and `docs/architecture.ko.md` rendered the same way at `17c7b3a`, none missing (`trail/rounds/round-2.md` *Probes*) |
```

No other present-state record says that round 1's rendering covered the README pair. Round 1's own sentence at `round-1.md:164`, "This answers `gaps.md:8`", is part of a round record and is history. It needs no edit.

## Confirmations

```seal
confirms: round-1#1
```
What holds: ground 1 at `docs/roadmap.md:33` and `docs/roadmap.ko.md:33` no longer states the skeleton reason. It cites *Build order* by a link, and `docs/architecture.md:229` and `docs/architecture.ko.md:229` remain the reason's one home. Milestone 1's row at line 21 of each edition cites the same section and does not state the reason. So scenario 4 and C5 hold for this fact. *Scope* item 8 at `frame/design.md:53` and ground 1 at `frame/design.md:123` now say the roadmap cites the reason and states it nowhere, so the frame no longer rebuilds the duplicate. The *Not done* bullet on the reason left `gaps.md` at `dd125f4`. Read: the four lines named here and the diff. Executed: `git grep -n -F 'architecture.md#build-order' -- docs` and the same search for `architecture.ko.md#만드는-순서` each printed lines 21, 33 and 80 of their edition. The link the pass added therefore uses the exact anchor of the two links round 1 resolved. `git diff e40f6fd 17c7b3a -- docs` changes no heading (executed: a search of the diff for `^[-+]#` exited 1). This round also found `build-order` and `만드는-순서` among the ids GitHub's rendering returned at `17c7b3a` (*Probes*).

```seal
confirms: round-1#2
```
What holds: the close took the other fix the finding named. The owner's decision is recorded with its date in row 3 of `frame/plan.md` *Judgments of the run* (`frame/plan.md:58`). C3 at `frame/design.md:68` now names such a row as its fourth source of decisions. *Data & interfaces* at `frame/design.md:132` says the trial's start is that decision, and that the trial's row of *Open decisions* does not hold it. `docs/roadmap.md:53` and `:92`, with the Korean lines at the same numbers, are unchanged. They state the start as settled and leave it out of the row, as the frame now says. Scenario 8's Then cell at `frame/design.md:94` points at C3 and no longer lists three sources. No present-state record still counts three sources: `git grep -n -e 'three sources' -e 'four sources'` printed only `frame/design.md:68`, `trail/phases/phase-1.md:23` and `trail/rounds/round-1.md:51`, and the last two are history (executed). The owner's own words reached this round only through the orchestrator's relay and through row 3, and *Not judged* holds that.

```seal
confirms: round-1#3
```
What holds: the sentence from the old opening paragraph of *Build order* is kept. It stands in ground 1 at `docs/roadmap.md:33`, after the bold sentence, in the words of round 1's snippet, and `docs/roadmap.ko.md:33` holds the snippet's Korean text (read). The paragraph at line 31 still says four grounds, and the list still holds four. The *Removes* cell at `frame/design.md:172` now says where each sentence of that paragraph lands. The cell matches `git show main:docs/architecture.md` lines 225 to 238: the first sentence states the order, and the second gives the reason the shell comes first (executed). The two *Not done* entries that carried this item, the English bullet and the Korean paragraph, left `gaps.md` at `dd125f4`.

```seal
confirms: round-1#4
```
What holds: `docs/architecture.md:48` is the one statement of the Agent SDK overview's rule. It carries the date "read 2026-11-18". `docs/architecture.md:57` cites it as "the rule on claude.ai login stated at the top of this section". Line 48 is the first paragraph under *Authentication of the Claude adapter*, so the citation points at the right line. Line 57 still names both documents by title, with the date they were read, as *Scope* item 13 at `frame/design.md:58` and `changelog.md:8` say. The Korean lines 48 and 57 say the same (read). `git grep -n -F '2026-11-17' -- docs README.md README.ko.md seal` prints no line about the Agent SDK overview in `docs/`. Its hits there are other tests and measurements dated that day, and in `seal/` the phase 3 record and round 1's record, both history (executed).

```seal
confirms: round-1#5
```
What holds: the bullet on the Status cell of Q2 left `gaps.md` *Not done*, together with the sentence that introduced it. `frame/questions.md:19` reads "answered 2026-11-18 by the phase 3 crafter" (read). *Not done* now opens "One thing is within reach and not taken" and holds one bullet, on the README row for the architecture document. That bullet now names `README.ko.md` as well, and `README.ko.md` holds the same row (read: `README.ko.md:16`). The rule that ends a row by marking it `closed` binds `## Not verified` only. The `gaps.md` diff in this range leaves no row of `## Not verified` without that word. Rows 2 and 3 return as rows 8 and 9, marked `closed`. Row 1 returns reworded as row 7. Row 10 is new (read: `git diff e40f6fd 17c7b3a -- seal/threads/1795005804-v0.1-scope-and-milestones/gaps.md`).

What matched: row 10 of `gaps.md` *Not verified*, which names the proofer, is answered here. Each Korean line the fix pass changed says what its English line says: ground 1 at line 33 of each roadmap edition, and lines 48 and 57 of each architecture edition (read, sentence by sentence). The link the pass added to ground 1 resolves on GitHub's rendered page, by the anchor ids under *Probes*. The row is the fix pass's or the orchestrator's to mark `closed`.

What matched: scenario 2 holds for the two pairs the fix diff touched (executed in the clone). `grep -c '^#'` printed 11 for each roadmap edition and 26 for each architecture edition. `grep -c '^|'` printed 26 and 108 for each. `sed -n 3p` of each roadmap edition printed the two switch lines the scenario names.

What matched: scenarios 5, 7 and 11 hold at `17c7b3a` (executed). Each search exited 1. `git grep -n -i -c 'anthropic' -- docs` counted three lines in each architecture edition and one in each roadmap edition, as round 1 found. The two architecture lines this diff changed, 48 and 57, were read, and neither says Owlery asks Anthropic or waits for its answer.

What matched: scenario 6 holds (executed). This round built the name list in its scratch directory from the owner's notes in the worktree, by the command the spawn prompt gives. The build exited 0 and wrote 27 names. `git grep -n -i -w -F -f` over `docs`, `README.md`, `README.ko.md` and `seal` in the clone exited 1 and printed nothing. The list is a sample, so this round also read every line the fix diff adds. Those lines name the AgenticSeal plugin, Claude Code, Anthropic and the Agent SDK. Each is the project's own process, a CLI Owlery launches or a service it uses, which C1 exempts. No line describes a capability by who else has it.

What matched: C6 holds for the fix diff (executed). A search of the diff for the notes' directory name exited 1. A search of the clone for the notes' directory, file names and table heading prints only the `.gitignore` line that `main` already held. Row 4 of `frame/plan.md` *Judgments of the run* records the owner's choice to keep that line. This record quotes no path, file or heading of the notes.

What matched: each quote in `pr.md` is found word for word at its coordinate (read). The quote "The pull request takes the prefix `docs:`" stands in the Judgment cell of row 5 of `frame/plan.md` *Judgments of the run* (`frame/plan.md:60`). Row 3 was inserted at `02ccdbe`, and `17c7b3a` moved the citation to row 5. Row 1's quote is at `frame/plan.md:56`. The two *Alternatives considered* quotes open the Verdict cells at `frame/plan.md:17` and `:26`. The insertion shifted no other citation by row number. `git grep -n -e 'Judgments of the run'` prints four such citations: `pr.md:8` and `:10`, round 1's "row 1" at `trail/rounds/round-1.md:7`, and the fix pass's "third row" at `trail/rounds/round-1.md:69`. Each names the right row at the target (executed). The other lines it prints name the table and no row.

What matched: row 7 of `gaps.md` says the commits after `d7f51be` touch only the work item's records. That holds: `git log --name-only d7f51be..HEAD` lists `gaps.md`, `trail/rounds/round-1.md` and `pr.md` under the work item's directory (executed). The row's claim that the fix pass ran the `Broad gate` command at `d7f51be` is the fix pass's account, and this round did not run it (contract rule 2). The label stays open with the orchestrator as its answerer, so it is honest.

What matched: every close block of round 1 says what its commit did (read: `git show` of `02ccdbe`, `d7f51be` and `dd125f4` against each answer). Each `fixed` commit touches a path the finding's location names.

What matched: `changelog.md` stays true at the target. Its line 8 still says the two documents are named by title with the date they were read (read: `docs/architecture.md:57`).

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the owner's words in the session were what row 3 of *Judgments of the run* records, that the trial starts before milestone 2 is done and that this is a decision. This round read the row and the orchestrator's relay, and nothing the owner wrote | `seal/threads/1795005804-v0.1-scope-and-milestones/frame/plan.md:58` | The owner, through the orchestrator |
| Carried from round 1, still unanswered in any record: whether "Owlery never turns a permission check off" and "The daemon's local server accepts only an authenticated client" are what #1's "safe defaults" meant | `docs/roadmap.md:21` | The owner, through the orchestrator |
| The broad gate, the `Broad gate` command of `seal/config.json` at HEAD | `seal/config.json` | The orchestrator, in the broad run after the rounds settle |

When the fix pass closes finding 1, this round leaves nothing else open. What then comes due is the orchestrator's broad run, and after it the sealer's spawn.

## Probes

| Command | Result |
|---|---|
| `gh api markdown -F text=@docs/architecture.md -f mode=markdown`, and the same for `docs/architecture.ko.md`, in the clone at `17c7b3a`, with the `user-content-` ids then listed | Both exit 0, and each render holds 26 ids. `build-order` and `license-and-code-from-other-projects` are among the English ids. `만드는-순서` and `라이선스와-다른-프로젝트의-코드` are among the Korean ids. A first run with `-f mode=gfm` returned no heading ids, so only the `mode=markdown` run counts |
| `git grep -n -i -w -F -f` with the 27-name list, over `docs`, `README.md`, `README.ko.md` and `seal` | no output, exit 1 |
| The searches of scenarios 5, 7 and 11 | each no output, exit 1 |
| `git grep -n -F '2026-11-17' -- docs README.md README.ko.md seal` | exit 0. No line in `docs/` concerns the Agent SDK overview |
