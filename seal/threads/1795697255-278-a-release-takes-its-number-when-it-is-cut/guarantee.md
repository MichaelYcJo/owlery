# Guarantee: 1795697255-278-a-release-takes-its-number-when-it-is-cut

## Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The broad gate ran at a commit that only the work item's records follow | `trail/gate.md:4` (`run: a1caaebb against f683c693`) | `git -C /Users/yc/Documents/GitHub/owlery-wt-278 log --no-merges --name-only a1caaebb..HEAD ^f683c693` | holds (executed): `a1caaebb` resolves and is an ancestor of HEAD; the one commit after it, `7c92ecf6`, touches only `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/trail/gate.md` |
| The pull request body is what `seal pr-body` composes from the records at HEAD | the orchestrator's spawn prompt (body at `<scratchpad>/1795697255-278-a-release-takes-its-number-when-it-is-cut/body.md`) | `seal pr-body seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut --body <scratchpad>/1795697255-278-a-release-takes-its-number-when-it-is-cut/body.md --check` | does not hold (executed): exit 1, `refused: seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/pr.md: is not there; the orchestrator writes it before the first round`. The named body file is also absent: the scratch directory holds `gate.log`, `preflight.log`, `phase-1/` and `round-1/` and no `body.md` |
| Phase records' `executed` and `seen red` claims; `## Removes` rows | `trail/phases/phase-1.md`, `frame/design.md` | not run | unverified: the audit stops at step 2 (`agents/sealer.md`); the next sealer run answers it |

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the orchestrator's part of the pull request body | nothing readable: `pr.md` is not in the work item's directory at HEAD, and the body file the prompt names does not exist | none | the spawn prompt, which says `seal pr-body` wrote the body to that file |
| the design, the build, the last round, the changelog | not compared | not compared | not compared: the audit stops at step 2, so no party was read against issue #278 and the tree in this run; the next sealer run answers it |

```seal
target: 7c92ecf665558f610cdb4ec7e8b989c5fbc42bdf against f683c69381e03d621f098c6f280f214201d50ad9
Verdict: withheld reason: refused: seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/pr.md: is not there; the orchestrator writes it before the first round
```

## The audit at fa994ec5

`fa994ec5` touches `pr.md`, `frame/plan.md` and `guarantee.md` of this work item alone. This audit runs the gate and body checks again, reads the new records, and runs the whole sample, since the first audit stopped before it.

### Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The broad gate ran at a commit that only the work item's records follow | `trail/gate.md:4` (`run: a1caaebb against f683c693`) | `git -C /Users/yc/Documents/GitHub/owlery-wt-278 log --no-merges --name-only a1caaebb..HEAD ^f683c693` | holds (executed): `a1caaebb` is an ancestor of HEAD; `7c92ecf6` touches `trail/gate.md` alone, and `fa994ec5` touches this work item's `frame/plan.md`, `guarantee.md` and `pr.md` alone |
| The pull request body is what `seal pr-body` composes at HEAD | the orchestrator's message (body at `<scratchpad>/1795697255-278-a-release-takes-its-number-when-it-is-cut/body.md`) | `seal pr-body seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut --body <that file> --check` | holds (executed): exit 0, "is `pr.md` above `## From the records` and the records' text below it" |
| Scenario B: no goal named by a version in `docs/*.md` and the READMEs | `trail/phases/phase-1.md:21`, `frame/design.md:75` | `git grep -n -E 'v0\.[1-9]([^0-9.]\|\.[^0-9]\|\.?$)' <rev> -- 'docs/*.md' 'README*.md'` at `f683c693`, `f8a059e8` and HEAD | holds (executed): 60 lines at `f683c693`, so the search can fail; nothing, exit 1, at `f8a059e8` and at HEAD |
| Scenario C: no unreleased number | `trail/phases/phase-1.md:21`, `frame/design.md:76` | `git grep -n -E '0\.0\.[6-9]\|0\.[2-9]\.0' <rev> -- 'docs/*.md' 'README*.md'` at the same three commits | holds (executed): at `f683c693` roadmap lines 56, 57, 58, 61 and 73 and architecture line 320 in both editions; nothing at `f8a059e8` and at HEAD |
| Scenario D: the old rule's sentences are gone | `trail/phases/phase-1.md:21`, `frame/design.md:77` | the scenario's `git grep -n -E` at the same three commits | holds (executed): 6 lines at `f683c693`; nothing at `f8a059e8` and at HEAD |
| Scenario F: #78's signing sentence stands word for word in each edition | `trail/phases/phase-1.md:9`, `frame/design.md:79` | `git grep -n -F 'is signed ad hoc until then' <rev> -- docs/roadmap.md`; `git grep -n -F` of #78's Korean signing sentence, and `git grep -c -F` of its Korean second sentence, in `docs/roadmap.ko.md` | holds (executed): nothing at `f683c693`; `docs/roadmap.md:77` and `docs/roadmap.ko.md:77` at HEAD; the Korean second sentence counts 1 at `f8a059e8`. The English sentence is the second sentence of `seal/threads/1795673151-78-the-app-ships-as-a-signed-dmg/frame/design.md:182` |
| Scenario G: no dead anchor | `trail/phases/phase-1.md:21,23`, `frame/design.md:80` | the scenario's `git grep`; `<scratchpad>/1795697255-278-a-release-takes-its-number-when-it-is-cut/sealer/test_tmp_widths_anchors.py`, which resolves each `](…#anchor)` link of `docs/*.md` and both READMEs against the headings of the file it names | holds (executed): roadmap line 73 of both editions at `f683c693`; nothing at `f8a059e8` and at HEAD; the script checked 192 links at HEAD and found none unresolved |
| Scenario H: the editions match, and no `도장` | `trail/phases/phase-1.md:21` | `grep -c '^#'` and `grep -c '^\|'` for each `docs/*.md` and `README.md` and its `.ko.md`; `git grep -n -e '도장' -- docs README.md README.ko.md` | holds (executed): roadmap 11/11 and 40/40, architecture 27/27 and 124/124, product 15/15 and 36/36, README 7/7 and 16/16, design 15/15 and 386/386, name 5/5 and 0/0; `도장` exits 1 |
| Q1: the Korean diagram's line 20 keeps the box's edge in line 19's column | `trail/phases/phase-1.md:11` | the same script, counting East Asian Width W and F as two columns up to the box's second `│` | holds (executed): `docs/architecture.ko.md` lines 19 and 20 measure 29 each, and `docs/architecture.md` lines 19 and 20 measure 42 each. How GitHub draws it stays `unverified`, answered by the owner (`gaps.md`) |
| Scenario E: the two tables state the tracker's milestones | `trail/phases/phase-1.md:19`, `frame/design.md:78` | `gh api 'repos/MichaelYcJo/owlery/milestones?state=all&per_page=50'`, read against `docs/roadmap.md:49-67` and `docs/roadmap.ko.md:49-67` | holds (executed and read): open `release: 0.0.5` (#12) and `release: 0.1.0` (#9) stand in the release table by number; open #10, #3, #4, #8, #5 and #11 stand in the milestone table by title in backticks; no row names a milestone the tracker lacks. Closed `release: 0.0.1` to `release: 0.0.4` are the shipped rows. #9's open issues are #257, #127 and #132, the ones the 0.1.0 row names |
| The issues the documents cite sit where the documents put them | `docs/roadmap.md:53-56,69,75-76`, `trail/phases/phase-1.md:13` | `gh issue view` for #279, #280, #78, #133, #188, #257, #127, #132, #184, #110, #176, #73, #54, #55 and #201 | holds (executed): #279 and #280 and #73 in `after launch: first findings and conveniences`; #78, #133 and #188 in `release: 0.0.5`; #257, #127 and #132 in `release: 0.1.0`; #184, #110 and #176 in `owner: by hand`; #54 and #55 in `milestone 3: hand over an issue`; #201 closed in `release: 0.1.0` |
| The interim's ground: a connected repository's check clones `release/v<version>` until the tag exists | `docs/roadmap.md:74`, `frame/design.md:17` | read `apps/desktop/src/daemon/records-place.ts:97-105` | holds (read): the workflow text clones `--branch v${version}`, and on failure `--branch release/v${version}` |
| The `## Removes` rows stand nowhere in the tree | `frame/design.md:98-105` | `git grep` at HEAD over both roadmap editions for `whose milestone is`, `Signing each release costs`, `first signed release`, `done criteria of v0\.1`, `#227`, `#230`, `#232`, `#228`, `#229`, `#221`, and the Korean `서명한 첫 릴리스`, `v0\.1의 완료 기준`, `그 이슈의 마일스톤은`, `릴리스마다 서명하는 데는`, `2026-11-21에 정했습니다`; scenarios B, C, D and G for the other rows | holds (executed): every search exits 1 at HEAD; at `f683c693` the phrases stand at `docs/roadmap.md:59,64,65` and `docs/roadmap.ko.md:55-66` |
| The orchestrator's tracker edits that the frame hands it | `frame/plan.md:47-51`, `frame/design.md:64` | `gh api repos/MichaelYcJo/owlery/milestones/<n> --jq .description` for #3, #4, #5, #8, #11 and #12; `gh issue view` for #80, #69 and #187 | holds (executed): no description names a goal or an unreleased release by a version (#12 names its own branch `release/v0.0.5`); #80 reads "…the done criteria of the first version", and #69 and #187 name the release that ships milestone 4 and the one that ships the hardening milestone |
| The diff changes documents and this work item's records alone | `routing.md` *Why this way*, `frame/plan.md:57` | `git diff f683c693...HEAD --name-only`, filtered against `docs/`, `README` and this work item's directory; `git ls-files seal/parity.json` | holds (executed): no other path; no `seal/parity.json` is tracked, so no comparison with an original is owed |

### The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | *Scope* items 1 to 15 rewrite each sentence that names a goal or an unreleased release by a number, and state rules 1 to 4 with rules 5 and 6 as later; *Removes* names the old rule, rows 0.0.6 to 0.0.8, the rejected alternative and its anchor, #78's old signing grounds, the alias sentences, v0.2 and v0.3, and the moved issues | issue #278's six decisions and *Done when*; the build; the tracker | none. Its interim sets the number at the branch's cut until #279. That departs from rule 2's "at the release's close" only until rule 5 lands: rule 4 sets the number when the release is cut, rule 5 makes the cut at release time later work, and `records-place.ts:97-105` ties the branch's name to the version, so the issue and the tree decide it. The judgment and its grounds stand at `frame/plan.md:23-25`, `frame/design.md:17` and `frame/questions.md` |
| the build | `f8a059e8` writes *Scope* items 1 to 15 in both editions; `c78b0abe` states once when a release takes its number, with the interim beside it | the design; scenarios B to H re-run above; the Korean edition states the same as the English at `docs/roadmap.ko.md:1-17,45-87,94-123` and in the architecture, product and README diffs (read) | none |
| the last round | round 2 (`target: f64968f3`) opens no finding and confirms round 1's three fixes | the build at HEAD: `docs` and the READMEs are unchanged since `f64968f3`; the records changed since, `trail/gate.md`, `pr.md`, `frame/plan.md`'s judgment row and `guarantee.md`, were each read against HEAD here | none. Its note that "as the two bullets below state" at `docs/roadmap.md:72` points at no one bullet is wording, and line 72 states both moments itself |
| the changelog | the number is set when a release is cut, by the branch's cut until #279; the 0.x, minor and patch, and 0.1.0 rules; 0.0.5 as the walk release with the `.dmg`; 0.1.0 published on 2026-11-29; the goal named "the first version" | the design, the build and the tracker | none |
| the orchestrator's part of the pull request body | `Closes #278.`, quotes of *Scope* items 4, 3, 5 and 9, and the `docs:` prefix | each quote stands word for word at `frame/design.md:31,40,44,53`, and the judgment at `frame/plan.md:57`; the diff holds documents and records alone, as the prefix says | none |

```seal
target: fa994ec535f1d541fc964ef3e8fdf1a47495f855 against f683c69381e03d621f098c6f280f214201d50ad9
Verdict: sealed
```

## The audit at 1e23b71f

Since the last verdict's target `fa994ec5`, three commits follow: `87fd2633` commits `guarantee.md`; `6cb29a59` merges `origin/release/v0.0.5` at `8a19d3e2` (#215, PR #290); and `1e23b71f` records the broad gate against `8a19d3e2`. The base resolves through `release/v0.0.5@{upstream}` to `8a19d3e2`. This audit re-runs the claims whose coordinates the merge could reach, namely the eight documents, the documents leg, the anchors and the body, and reads the gate record. The claims of the audit at `fa994ec5` that rest on the tracker and on `records-place.ts` touch no path the merge changed (`git diff --quiet 8a19d3e2 HEAD -- apps` exits 0, and `apps` holds no change of this work), so they stand as that block states.

### Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The broad gate ran at a commit that only the work item's records follow | `trail/gate.md:8` (`run: 6cb29a59 against 8a19d3e2`) | `git -C /Users/yc/Documents/GitHub/owlery-wt-278 log --no-merges --name-only 6cb29a59..HEAD ^8a19d3e2` | holds (executed): `6cb29a59` is an ancestor of HEAD, and `1e23b71f` touches `trail/gate.md` alone. The gate's log in the scratch directory reads `BROAD GATE PASSED … @ 6cb29a59 against origin/release/v0.0.5 @ 8a19d3e2` (read) |
| The merge brought nothing into this work's documents | the orchestrator's message | `diff` of `git diff f683c693 87fd2633 -- <the eight documents>` against `git diff 8a19d3e2 HEAD -- <the eight documents>`; `git diff --quiet 87fd2633 HEAD -- <the eight documents>`; `git diff --name-only 87fd2633 HEAD` | holds (executed): the two diffs are identical (exit 0), and the eight documents are unchanged since `87fd2633` (exit 0). What the merge brought is #215's renderer and tests, `docs/design.md` and its edition, and #215's records. #215's `## Rule changes` holds the no-change block and names no section of the eight documents (read) |
| The diff against the new base changes documents and this work item's records alone | `routing.md` *Why this way* | `git diff --name-only 8a19d3e2...HEAD`, filtered against `docs/`, `README` and this work item's directory | holds (executed): no other path |
| Scenarios B, C, D and G at HEAD, `docs/design.md`'s new lines among them | `frame/design.md:75-77,80` | the scenarios' `git grep` at HEAD | holds (executed): each prints nothing and exits 1 |
| Scenario F at HEAD | `frame/design.md:79` | `git grep -c -F 'is signed ad hoc until then' HEAD -- docs/roadmap.md` | holds (executed): `docs/roadmap.md:1` |
| Scenario H at HEAD, with #215's `docs/design.md` | `frame/design.md:81` | `grep -c '^#'` and `grep -c '^\|'` per pair; `git grep -n -e '도장' -- docs README.md README.ko.md` | holds (executed): roadmap 11/11 and 40/40, architecture 27/27 and 124/124, design 15/15 and 390/390, name 5/5 and 0/0, product 15/15 and 36/36, README 7/7 and 16/16; `도장` exits 1 |
| No dead anchor at HEAD | `frame/design.md:80` | `<scratchpad>/1795697255-278-a-release-takes-its-number-when-it-is-cut/sealer/test_tmp_widths_anchors.py` | holds (executed): 192 links checked, none unresolved |
| No changelog fragment of the release says the old rule | `docs/roadmap.md:81` | `grep -rn -E 'v0\.[1-9]\|0\.0\.[6-9]\|0\.[2-9]\.0' seal/threads/*/changelog.md`, this work item's own fragment left out | holds (executed): exit 1 |
| The tables still match the tracker | `docs/roadmap.md:49-67` | `gh api 'repos/MichaelYcJo/owlery/milestones?state=open&per_page=50'` | holds (executed): the same eight open milestones; #9 holds three open issues; #215 is in `release: 0.0.5` |
| The pull request body is what `seal pr-body` composes at HEAD | the orchestrator's message | `seal pr-body seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut --body <scratchpad>/1795697255-278-a-release-takes-its-number-when-it-is-cut/body.md --check` | holds (executed): exit 0; its *Broad gate* section carries both `run:` blocks of `trail/gate.md` (read) |

### The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | as at `fa994ec5`; no frame file changed since | issue #278 and the tree at HEAD | none |
| the build | as at `fa994ec5`; the merge changed none of its lines | the design; the scenarios re-run above | none |
| the last round | round 2, unchanged, opens no finding | the build at HEAD, since the merge changed none of the eight documents and none of this work item's records but `trail/gate.md` | none |
| the changelog | unchanged since `fa994ec5` | the design, the build and the tracker | none |
| the orchestrator's part of the pull request body | `pr.md`, unchanged since `fa994ec5` | the design and the plan, as the audit at `fa994ec5` reads them; the merge, the gate record and the body check above | none |

```seal
target: 1e23b71f2d8172572135371f19aa0e481cf42672 against 8a19d3e2a2457877c829271858ec585c97d30103
Verdict: sealed
```
