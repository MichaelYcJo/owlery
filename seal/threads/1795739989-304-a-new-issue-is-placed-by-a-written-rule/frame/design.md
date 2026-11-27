# Design: a new issue is placed by a written rule (#304)

## Grounding

The tree as read at `490c3cf3` (`release/v0.1.0` at `e7737b7e` plus the commit that declares `routing.md`).

`routing.md` stands in this directory and answers `Planning` `framer`, `Implementation` `crafter`, `Automation` `yes`. Issue #304 was read with `gh issue view 304 --json number,title,body,comments,milestone,labels,state` on 2026-11-27 (`executed`). It has no comments, so no comment changes the request. Its body states five steps, what "no milestone" means, who sorts and what waits for the owner. This frame calls the issue's steps "step 1" to "step 5" in the issue's order, and the build's list "test 1" to "test 5" in the order *Scope* item 1 gives.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/roadmap.md` *Releases and the tracker*, the opening paragraph (read) | "A GitHub milestone is named by its goal and never by a version, so an issue keeps its milestone whichever release ships it. A milestone titled `release: <version>` holds a release whose number is already set". Step 1 sends an issue to a `release: <version>` milestone, which this paragraph already names as the one kind of milestone that holds a release. The step contradicts no sentence of it. |
| `docs/roadmap.md` *Releases and the tracker*, the milestone table and the sentence above it (read) | The table gives each open goal milestone one row with its goal, and names no rule that places an issue. Its rows name the milestones of rows 3, 4 and 5 of *Milestones*, and none for rows 1 and 2, which shipped as releases 0.0.1 and 0.0.2. So step 2's "a row of milestones 1 to 5" has a milestone to name for rows 3 to 5 alone: test 2 of *Scope* item 1 says so by pointing at this table. |
| The same table, the row `owner: by hand` (read) | "Work only the owner can do, such as a walk of the built app, a drawing, a choice between sheets or a build in a pane, which the orchestrator asks the owner about at the end of each release". Step 5 names the same milestone by the same test. The new text does not say again what the work is or when the orchestrator asks. |
| The same table, the row `hardening: boundaries and edge cases` (read) | "The boundaries and edge cases found while milestones 1 and 2 were built". Step 4 sends there every boundary or edge case that building found, whichever release's build found it. The row as it reads would contradict the step for a case found while a later release was built. The tracker already holds such cases there: #193, #196 and #200 were opened on 2026-11-24 and #206 and #219 on 2026-11-25 (executed: `gh issue list --state all --milestone "hardening: boundaries and edge cases" --json number,title,state,createdAt`), and release 0.0.2, which shipped milestone 2, was tagged on 2026-11-24 (executed: `git log -1 --format=%ci v0.0.2`). *Scope* item 3 rewrites the row's goal. |
| The same table, the row `after launch: first findings and conveniences` (read) | "What the launch of 0.1.0 and its first users find, and the conveniences the owner's walk of 2026-11-25 named that the launch left out". Both halves are what a person met in what has shipped, which is step 3's test. The row stays as it reads. |
| `docs/roadmap.md` *Why this order*, ground 4 (read) | "issue #176, which moved to release 0.0.5 on 2026-11-25 and stands in the milestone `owner: by hand` since 2026-11-26. The owner builds that one in a Claude Code pane". #176 is a defect in what has shipped, and the policy text holds it in `owner: by hand`. This decides the order of the tests: see the next row. |
| The milestone `owner: by hand` as the tracker holds it (executed: `gh issue list --state all --milestone "owner: by hand" --json number,title,state,createdAt`, and `gh issue view` of #176 and #221) | It holds #176, #221, #228 and #229 beside the walks #184 and #110. #176 is a defect of the built app, and #221 states "The owner read the approval line on 2026-11-25 and could not tell what the marks say". Each is a defect or a gap a person met in what has shipped, so each meets step 3, and each needs the owner's hand, so each meets step 5. Read top to bottom in the issue's order, step 3 would place them in `after launch: first findings and conveniences`. The tracker and *Why this order* hold them in `owner: by hand`. So the build's list puts the owner's test above the two tests on findings. |
| The milestones `milestone 3`, `milestone 4` and `milestone 5` as the tracker holds them (executed: `gh issue list --state all --milestone` for each) | #57, #68 and #79, "nobody has worked through milestone N in the built app by hand", stand in the milestone of their row and not in `owner: by hand`. Each meets step 2 and step 5. So the test on a row of *Milestones* stays above the owner's test, as the issue orders them. |
| The open issues with no milestone (executed: `gh issue list --state open --search 'no:milestone'`, and `gh issue view` of #250, #34, #120 and #108) | On 2026-11-27 they are #250, #137, #136, #120, #108, #98, #35 and #34. #34's body opens "No milestone.", and #120 carries the comment "Moved to no milestone on 2026-11-24 ... A study the goal of v0.1 does not wait on; it waits for a later version, as #98 does". #108 and #250 carry no such line. So "no milestone" has two meanings in the tracker today: not yet sorted, and left without one on purpose because the work waits for what comes after the first version. The issue's sentence "an issue with no milestone is not yet sorted" would make the second kind unsorted for ever, since `docs/roadmap.md` *After the first version* gives that work no milestone. The line the issue asks the orchestrator to leave is what tells the two apart: *Scope* item 2 says an issue with no milestone and no such line is not yet sorted. |
| The milestones as the tracker holds them (executed: `gh api 'repos/{owner}/{repo}/milestones?state=all' --paginate`) | Open: `release: 0.1.0` (#9), `milestone 3: hand over an issue` (#3), `milestone 4: the person's hands on the work` (#4), `milestone 5: after the PR, and limits` (#5), `hardening: boundaries and edge cases` (#8), `after launch: first findings and conveniences` (#10) and `owner: by hand` (#11). Closed: `release: 0.0.1` to `release: 0.0.5`. Each milestone the five steps name is open under the title the issue gives it, and the milestone table of the roadmap names the same six goal milestones. The description of #8 still reads "found while milestones 1 and 2 were built". |
| Who may set a milestone (executed: a fetch of GitHub's "Repository roles for an organization" page on 2026-11-27, and `gh api 'repos/{owner}/{repo}'`) | The page's row "Apply milestones" grants it to Triage, Write, Maintain and Admin and not to Read. This repository is public and owned by a user account, and the page does not state the roles of such a repository. That a person with no role cannot set a milestone on the issue they open is the issue's claim, opened only so far: nobody's finding beyond the page's row, and the orchestrator answers it. The build's sentence says "triage access or more", which the page's row supports. |
| `docs/roadmap.md` *After the first version* (read) | "The scope of what comes after the first version is not decided, and no version number is given to it." No milestone holds that work, which is why an issue that waits for it keeps none. |
| The text that already names sorting (executed: `git grep -n -i -e 'no milestone' -e 'triage' -e 'sorts' -e 'sorted' 490c3cf3 -- docs README.md`) | It printed `docs/roadmap.md:90` and `docs/roadmap.md:92` alone, which say that the trial on other people's PRs needs no milestone and that no milestone waits on Anthropic. Neither states a rule that places an issue, so the new text repeats none. |
| Code that reads the roadmap (executed: `git grep -n -i -e 'roadmap' 490c3cf3 -- apps .github`) | A comment in `apps/desktop/src/daemon/adapters/claude.ts` that cites milestone 1, and test fixtures that quote the path. No code, check or record format reads the sentences this work writes. |
| `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes* (plugin, read) | This work item's subject is the policy root's own text, so its pull request edits `docs/` directly, and `## Rule changes` holds the no-change block. The work item of issue #278 did the same on this section (read at `907384ae`, `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/frame/design.md`). No other work item's directory stands under `seal/threads/` at `490c3cf3` (executed: `ls`), so no unsettled design's operation names a section this work changes. |
| `seal/config.json` `Broad gate` (read) | For each `docs/*.md`, the `.ko.md` edition holds as many lines that open with `#` and as many that open with `\|`, and no line of `docs` holds `도장`. At `490c3cf3` both editions of the roadmap count 11 and 40 (executed: `grep -c`). The build adds a numbered list and two paragraphs and no heading or table row, so the counts stay. |
| `seal/follow-up.md`, `seal/parity.json`, `docs/README.md`, the latest GitHub Release (executed: `ls`, `gh release view --json body`) | None of the first three stands, so no follow-up item, no original and no policy index bear on this work. The release `v0.0.5` holds no `### Process changes` heading. |

The searches of the acceptance table were run at `490c3cf3` (executed):

- `git grep -n -F 'is not yet sorted' 490c3cf3 -- docs/roadmap.md` and `git grep -n -F '아직 분류하지 않은' 490c3cf3 -- docs/roadmap.ko.md` printed nothing.
- `git grep -n -F 'takes the first milestone' 490c3cf3 -- docs` and `git grep -n -e '처음 맞는 조건' 490c3cf3 -- docs` printed nothing.
- `git grep -n -F 'found while milestones 1 and 2 were built' 490c3cf3 -- 'docs/*.md' 'README*.md'` printed `docs/roadmap.md:65` alone, and `git grep -n -F '마일스톤 1과 2를 만들면서 찾은 경계와' 490c3cf3 -- 'docs/*.md' 'README*.md'` printed `docs/roadmap.ko.md:65` alone. *Scope* item 3 rewrites both lines.

## Scope

The work writes the rule that places a new issue into `docs/roadmap.md` *Releases and the tracker* and into `docs/roadmap.ko.md` *릴리스와 트래커*, in one place: between the milestone table and the paragraph that opens "**In release 0.0.3 the owl chain in a pane**". Each item holds in both editions. The Korean edition says the same in its own words, with the same headings and the same table rows, and says 인장 and never 도장.

1. **The list of tests.** After the milestone table, the English edition reads:

   > **A new issue takes the first milestone below whose test it meets, read from the top.** The tests stand in an order because one issue can meet two of them, and then the order decides.
   >
   > 1. It blocks the checks or the publication of the release that is open: that release's milestone, `release: <version>`, and on the owner's word only.
   > 2. It builds what a row of [Milestones](#milestones) names, and the table above names a milestone for that row: that milestone.
   > 3. Only the owner can do it: `owner: by hand`.
   > 4. It is a defect or a gap that a person met in what has shipped: `after launch: first findings and conveniences`.
   > 5. It is a boundary or an edge case that building found and no person has met yet: `hardening: boundaries and edge cases`.

   The Korean edition reads:

   > **새 이슈는 아래 조건을 위에서부터 읽어 처음 맞는 조건의 마일스톤에 들어갑니다.** 이슈 하나가 두 조건에 맞을 수 있어서 순서를 두었고, 그때는 순서가 정합니다.
   >
   > 1. 열려 있는 릴리스의 검사나 공개를 막는 이슈는 그 릴리스의 마일스톤 `release: <버전>`에 들어가고, 저장소 소유자가 말로 정할 때만 들어갑니다.
   > 2. [마일스톤](#마일스톤) 표의 한 행이 말하는 것을 만드는 이슈는, 위 표에 그 행의 마일스톤이 있으면 그 마일스톤에 들어갑니다.
   > 3. 저장소 소유자만 할 수 있는 일은 `owner: by hand`에 들어갑니다.
   > 4. 이미 나간 것에서 사람이 겪은 결함이나 빠진 것은 `after launch: first findings and conveniences`에 들어갑니다.
   > 5. 만들면서 찾았고 아직 사람이 겪지 않은 경계나 예외 경우는 `hardening: boundaries and edge cases`에 들어갑니다.

   Tests 1 and 2 are the issue's steps 1 and 2. Test 3 is the issue's step 5, and tests 4 and 5 are its steps 3 and 4. The *Grounding* rows on `owner: by hand` and on milestones 3 to 5 hold the grounds of that order.

2. **What no milestone means, who sorts, and what waits.** One paragraph follows the list. The English edition reads:

   > **An issue with no milestone, and with no line on it that says why, is not yet sorted.** A person outside the repository cannot set a milestone, because GitHub lets only an account with triage access or more set one, so their issue arrives with none. The orchestrator sorts such an issue by the list above and leaves one line on the issue that says which test placed it. Tests 2 to 5 wait for nobody. Under test 1 the line names the release and what the issue blocks, the orchestrator asks the owner, and the issue keeps no milestone until the owner's word. Where the release ships without that word, the orchestrator sorts the issue again by tests 2 to 5. The list does not decide an issue that meets none of its tests, nor one that asks for what [Not in the first version](#not-in-the-first-version) or [After the first version](#after-the-first-version) holds outside the first version, whichever test it meets. The orchestrator asks the owner then and writes the answer on the issue, also where the answer leaves the issue with no milestone, as work that waits for what comes [after the first version](#after-the-first-version) is left.

   The Korean edition reads:

   > **마일스톤이 없고 그 까닭을 적은 줄도 없는 이슈는 아직 분류하지 않은 이슈입니다.** 저장소 밖의 사람은 마일스톤을 정할 수 없습니다. GitHub에서는 triage 이상의 권한이 있는 계정만 마일스톤을 정하기 때문이고, 그래서 그런 사람이 연 이슈는 마일스톤 없이 들어옵니다. orchestrator가 위 목록으로 그런 이슈를 분류하고, 어느 조건으로 넣었는지를 이슈에 한 줄로 남깁니다. 조건 2부터 5까지는 누구도 기다리지 않습니다. 조건 1에서는 그 줄이 릴리스와 이슈가 막는 것을 밝히고, orchestrator가 저장소 소유자에게 물으며, 저장소 소유자가 말하기 전까지 이슈에는 마일스톤이 없습니다. 그 말 없이 릴리스가 나가면 orchestrator는 조건 2부터 5까지로 그 이슈를 다시 분류합니다. 어느 조건에도 맞지 않는 이슈와, 어느 조건에 맞든 [첫 버전에 넣지 않는 것](#첫-버전에-넣지-않는-것)이나 [첫 버전 다음](#첫-버전-다음)이 첫 버전 밖에 두는 일을 바라는 이슈는 이 목록이 정하지 않습니다. 그때는 orchestrator가 저장소 소유자에게 묻고 그 답을 이슈에 적습니다. [첫 버전 다음](#첫-버전-다음)에 올 일을 그렇게 두듯이 답이 이슈를 마일스톤 없이 두는 것일 때도 적습니다.

3. **The goal of `hardening: boundaries and edge cases` in the milestone table.** "The boundaries and edge cases found while milestones 1 and 2 were built" becomes "The boundaries and edge cases found while milestones 1 and 2, and the releases after them, were built". In the Korean edition "마일스톤 1과 2를 만들면서 찾은 경계와 예외 경우" becomes "마일스톤 1과 2, 그리고 그 뒤의 릴리스를 만들면서 찾은 경계와 예외 경우".

**Out of scope:**

- **The tracker.** No agent posts. Sorting the open issues that have no milestone and no line, and the description of milestone #8, are the orchestrator's (`plan.md` *Operational impact*).
- **Issues that hold a milestone.** The rule places an issue that has none. It moves no issue, so the placements of 2026-11-26 stand, such as #281 and #287, which a frame found and no person met and which stand in `after launch: first findings and conveniences` (executed: `gh issue view 281`, `gh issue view 287`).
- **The row 0.1.0 of the release table.** It names #257, #127 and #132 and not the issues the owner put into the release on 2026-11-27. The release's own record of what it shipped is its settle's, as the rows 0.0.3 to 0.0.5 were written.
- **A milestone for what comes after the first version.** The tracker holds that work with no milestone, and *After the first version* gives it no number. Opening one is the owner's.
- **A check or a script that reads an issue's milestone.** The rule is guidance the orchestrator reads, and whether an issue meets a test is a judgment of meaning.
- **What `release: <version>` means once issue #279 lands.** #279 changes when a release takes its number, and with it whether a release milestone is open while work merges. Test 1 names "the release that is open" and its milestone, and #279's work rewrites the test if it leaves no such milestone.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A. An issue from outside | Given a person with no role opens an issue on a defect they met in the published app, and it arrives with no milestone. When the orchestrator reads *Releases and the tracker*. Then the section tells it that the issue is not yet sorted, that it sorts the issue itself, that test 4 places it in `after launch: first findings and conveniences` without asking, and that it leaves one line saying so. | Read *Scope* items 1 and 2 in both editions of the roadmap at the build's head against issue #304's *Done when*. |
| B. Two tests met | Given an issue like #221, a defect or a gap a person met in what has shipped that only the owner can do, and an issue like #57, a walk of milestone 3 by hand. When the list is read from the top. Then the first goes to `owner: by hand` by test 3 and the second to `milestone 3: hand over an issue` by test 2, which is where the tracker holds them. #176 stood in `owner: by hand` until the owner's word moved it into `release: 0.1.0` on 2026-11-27, which is test 1 standing above test 3. | Read the list's order at the build's head against the *Grounding* rows on `owner: by hand` and on milestones 3 to 5. |
| C. The release that is open | Given an issue that makes the open release's sealed pull requests wait for a rerun, as #300 did. When the orchestrator sorts it. Then it sets no milestone, leaves a line that names the release and what the issue blocks, asks the owner, and the issue takes `release: <version>` only on the owner's word. | Read *Scope* item 2 at the build's head: "Tests 2 to 5 wait for nobody" and the sentence on test 1. |
| D. No test met | Given an issue like #34, an optional toy that no row of *Milestones* names and no person met as a defect. When the orchestrator sorts it. Then the section names it as a case the list does not decide, the orchestrator asks the owner, and the owner's answer stands on the issue as a line, so the issue no longer reads as not yet sorted even with no milestone. | Read *Scope* item 2 at the build's head. |
| E. The rule stands once, in both editions | Given the build's head. When `git grep -n -F 'is not yet sorted' -- docs/roadmap.md`, `git grep -n -F 'takes the first milestone' -- docs`, `git grep -n -F '아직 분류하지 않은' -- docs/roadmap.ko.md` and `git grep -n -e '처음 맞는 조건' -- docs` run. Then each prints one line, in *Releases and the tracker* or *릴리스와 트래커*. | At `490c3cf3` each printed nothing (executed, *Grounding*). The pathspecs leave out `seal/threads/`, where this frame quotes the patterns. |
| F. The hardening row no longer contradicts test 5 | Given the build's head. When `git grep -n -F 'found while milestones 1 and 2 were built' -- 'docs/*.md' 'README*.md'` and `git grep -n -F '마일스톤 1과 2를 만들면서 찾은 경계와' -- 'docs/*.md' 'README*.md'` run. Then each prints nothing. | At `490c3cf3` they printed `docs/roadmap.md:65` and `docs/roadmap.ko.md:65` alone (executed, *Grounding*), which *Scope* item 3 rewrites. The new wording holds a comma after "2" in English and "2, 그리고" in Korean, so neither pattern matches it. |
| G. Each milestone the list names is one the tracker holds | Given the build's head. When the open milestones are listed with `gh api 'repos/{owner}/{repo}/milestones?state=open'`. Then each title the list writes in backticks is the title of an open milestone, and `release: <version>` is the title of the open release's. | Read the list against the listing. |
| H. The editions match | Given the build's head. When `grep -c '^#'` and `grep -c '^\|'` count `docs/roadmap.md` and `docs/roadmap.ko.md`. Then each pair counts the same, and `git grep -n -e '도장' -- docs README.md README.ko.md` prints nothing. | The documents leg of the broad gate, which the orchestrator runs. The crafter may run the counts as it writes, since they are a `grep` and not a check of the repository. |

## Data & interfaces

None. The work changes two documents. No code, record format or check reads the sentences it writes (*Grounding*, the row on code that reads the roadmap).

## Rule changes

- nothing
  why: This work item's subject is the policy root's own text, so its pull request edits `docs/roadmap.md` and `docs/roadmap.ko.md` directly, as `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes* states. *Scope* items 1 to 3 hold the text of each edition. No unsettled design names a section it changes.

## Removes

The work adds one rule, the list of *Scope* item 1 with the paragraph of item 2. No rule, check or mark on where an issue goes stood in the tree for it to replace (*Grounding*, the row on the text that already names sorting): what it takes out is the conversation with the owner that decided each placement, which no file held. It adds no gate, check, label or mark. The line on an issue is a comment the issue asks for, and no script reads it.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The limit "found while milestones 1 and 2 were built" on the goal of `hardening: boundaries and edge cases` | `docs/roadmap.md` *Releases and the tracker*, the milestone table, and `docs/roadmap.ko.md` *릴리스와 트래커* | *Scope* item 3. The tracker already holds cases found after milestone 2 shipped, and test 5 sends later ones there. |

Framed 2026-11-27 by framer, before the build.
