# Review round 1: 1795697255-278-a-release-takes-its-number-when-it-is-cut

```seal
target: e0e2eecc against release/v0.0.5
```

The round read issue #278 (`gh issue view 278`, the owner's six decisions), `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `trail/phases/phase-1.md` whole at `e0e2eecc`, and the diff `f683c693..e0e2eecc`. No `pr.md` or `pr.<lang>.md` stands yet, and no earlier round exists, so no coordinate was carried and every fact below was established this round. The work changes documents only. No code, record format or check reads the sentences it rewrites (`frame/design.md` *Data & interfaces*, which this round's own search of `apps/`, `.github/` and the role bundle bore out), so the axes walked are the records axes, the issue's six decisions, the editions' agreement, the tracker and the links.

## Findings

### 1. *Releases and the tracker* states the moment a release takes its number twice, once unconditionally and once for the interim, and the two disagree

```seal
severity: should
location: `docs/roadmap.md:47`, `docs/roadmap.md:72`, `docs/roadmap.md:74`, `docs/roadmap.md:84`, `docs/roadmap.ko.md:47`, `docs/roadmap.ko.md:72`, `docs/roadmap.ko.md:74`, `docs/roadmap.ko.md:84`, `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/frame/design.md:29`, `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/frame/design.md:42`, `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/frame/design.md:44`, `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/frame/design.md:50`
evidence: executed `git grep -n -o -F -e 'takes its number' -e "At the release's close" -e 'follows what merged' -e 'While the branch is cut' -e '번호도 그때 받습니다' -e '릴리스를 마칠 때' -e '브랜치를 따는 동안에는' -e '머지된 것을 따릅니다' -e 'its number is set then' -e 'number is set when' e0e2eecc -- docs README.md README.ko.md seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut`; read `docs/roadmap.md:47`, `docs/roadmap.md:72-75`, `docs/roadmap.md:84`, `apps/desktop/src/daemon/records-place.ts:97-105`
```

Why it matters: scenario A of `frame/design.md` is the orchestrator reading this section when it cuts the next release branch, to learn when to propose the number. The section gives it two answers in the present tense. `docs/roadmap.md:72` says "At the release's close the orchestrator proposes the number with its grounds, and the owner approves it." `docs/roadmap.md:74` says "While the branch is cut when the release's work starts, the orchestrator proposes the number when it cuts the branch". `docs/roadmap.md:75` then says "The orchestrator's proposal then moves to the release's close", which tells the reader that line 72 does not hold today. Line 47 says "A release holds what has merged when it is cut, and it takes its number then", and line 75 uses "a release is cut" for a moment apart from the branch's cut ("a release branch is cut only when a release is cut"). So line 47 also states, as today's rule, what the interim defers. Line 84's ground, "A number set when the release is cut follows what merged", is false in the interim too: a number set when the branch is cut is set before anything has merged, and `frame/plan.md` *Alternatives considered* (the interim row) accepts that "A release that grows a new capability after its branch was cut as a patch keeps the patch number".

The interim is grounded: `apps/desktop/src/daemon/records-place.ts:97-105` clones `v${version}` or else `release/v${version}`, and the tracker's #279 is titled "... and the number is fixed at the cut". The defect is in the wording. The text states rules 2 and 4 as if they applied now, and it states the exception only in a later bullet. The Korean edition has the same defect. Its line 74 adds a second one. "릴리스의 일을 시작할 때 브랜치를 따는 동안에는" reads as "during the act of cutting the branch", not "as long as branches are cut at the start", and the English "While the branch is cut when ..." carries the same ambiguity between "during" and "as long as". The frame dictates each of these sentences: *Scope* item 1 at `frame/design.md:29`, item 4 at `:42`, item 5 at `:44` and item 8 at `:50`. The fix pass therefore owes the same change to those quotes.

The search on the fact's words, a sample under contract rules 12 and 19, also printed `docs/roadmap.md:5` ("because a release takes its number only when it is cut"), `changelog.md:5` ("A release takes its number when it is cut.") and the titles of the three frame files. The fix leaves these as they are. Line 5 gives the grounds that a goal carries no number, and that ground holds whichever cut sets the number. The changelog's headline is qualified by its own bullet 3, which already states the interim ("Until releases are cut from `main`, the number is set when the release branch is cut").

```markdown
docs/roadmap.md:47, first sentence, becomes two:
A release holds what has merged when it is cut, and from issue #279 on it takes its number then. Until #279 lands, a release takes its number when its branch is cut, as the release branch bullet below states.

docs/roadmap.md:72, last sentence:
The orchestrator proposes the number with its grounds, and the owner approves it, at the moment the release branch bullet below names.

docs/roadmap.md:74, the sentence that opens "While the branch is cut":
Until issue #279 lands, the orchestrator proposes the number when it cuts the branch, by the measure above and from the issues the release is cut for, and the owner approves it then.

docs/roadmap.md:84, last sentence:
A number set when a release's branch is cut is set for that one release alone, and from issue #279 on a number set when the release is cut follows what merged.

docs/roadmap.ko.md:47, first sentence, becomes two:
릴리스는 그것을 끊을 때까지 머지된 것을 담고, 이슈 #279 뒤로는 번호도 그때 받습니다. #279가 들어오기 전까지는 릴리스가 자기 브랜치를 딸 때 번호를 받고, 아래의 릴리스 브랜치 항목이 그것을 말합니다.

docs/roadmap.ko.md:72, last sentence:
orchestrator가 근거와 함께 번호를 제안하고 저장소 소유자가 승인하며, 그 때는 아래의 릴리스 브랜치 항목이 정합니다.

docs/roadmap.ko.md:74, the sentence that opens "릴리스의 일을 시작할 때 브랜치를 따는 동안에는":
이슈 #279가 들어오기 전까지는 orchestrator가 브랜치를 딸 때 위의 기준에 따라 그 릴리스에 담으려는 이슈를 보고 번호를 제안하고, 저장소 소유자가 그때 승인합니다.

docs/roadmap.ko.md:84, last sentence:
릴리스 브랜치를 딸 때 정하는 번호는 그 릴리스 하나에만 붙고, 이슈 #279 뒤로 릴리스를 끊을 때 정하는 번호는 머지된 것을 따릅니다.

frame/design.md *Scope* items 1, 4, 5 and 8 quote the English sentences above; each quote takes the new wording.
```

### 2. `frame/plan.md` still says the work rides the combined pull request, and `routing.md` uses the term "rule changes" for what the frame states as *Scope*

```seal
severity: should
location: `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/frame/plan.md:42`, `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/routing.md:16`
evidence: executed `grep -rn -F 'combined' seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/`, `git diff e808d13c e0e2eecc -- seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/frame/plan.md seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/routing.md`; read `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/routing.md:22`, `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/frame/design.md:89-90`
```

Why it matters: the orchestrator's fix `efba7889` rewrote `routing.md:22` to say the work "opens its own pull request", because the review chain's check seals one work item per pull request. The framer's fold `e0e2eecc` rewrote `frame/plan.md` *Operational impact* and left the *Overlap with the release* row for #133 and #216 as it was. Its *Merges first* cell, at `frame/plan.md:42`, still reads "Either. This work rides their combined pull request, and merging it last into the combined branch costs nothing." A merge-order cell is a judgment the orchestrator acts on in the release tail, and the target contradicts it. The search for "combined" also printed `frame/plan.md:38` ("the combined branch of #215, #216 and #133 that `routing.md` names"). That line records what the framer read, and `routing.md:22` still names that branch as the route first taken, so it stays.

`routing.md:16` says "The frame writes them as the roadmap's rule changes". In this plugin, "rule changes" names the `## Rule changes` section, and this frame's section holds `- nothing` (`frame/design.md:89-90`). The frame states the decisions as *Scope* items 1 to 15. A sealer that reads the route against the frame finds a claim the frame does not bear out.

```markdown
frame/plan.md:42, the *Merges first* cell:
Either. This work opens its own pull request into `release/v0.0.5` (`routing.md`, *Branch*), and their operations land only at the settle, so neither order changes a line the other writes.

routing.md:16, second sentence:
The frame writes them as *Scope* items of the roadmap's text, and its `## Rule changes` holds the no-change block, since the work edits the policy root directly; the crafter writes them into both editions of `docs/roadmap.md`, and of `docs/architecture.md`, `docs/product.md` and `README.md` where they name a version by the old rule.
```

### 3. The frame's *Scope* says new text names no release number above 0.1.0, and the text it dictates names 1.0.0

```seal
severity: should
location: `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/frame/design.md:27`
evidence: executed `git grep -n -E '1\.0\.0|1\.x|0\.x' e0e2eecc -- 'docs/*.md' 'README*.md'`; read `docs/roadmap.md:71`, `docs/roadmap.md:86`, `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/frame/design.md:41`
```

Why it matters: `frame/design.md:27` says "New text names no `v0.x` and no release number above 0.1.0." *Scope* item 4 (`frame/design.md:41`) dictates "It moves to 1.0.0 only when the owner decides so in words", and the build wrote that sentence at `docs/roadmap.md:71` and its Korean line. `docs/roadmap.md:86` also names "A 1.x number". Both lines carry rule 1 of the issue and are correct. The frame's universal sentence is what is wrong, and a fix pass or a sealer that checks the text against it finds a violation that the frame itself required. Scenario C's pattern (`0\.0\.[6-9]|0\.[2-9]\.0`) already leaves 1.0.0 out, so the fix changes only the sentence.

```markdown
frame/design.md:27, last sentence:
New text names no `v0.x`, and no release number above 0.1.0 other than rule 1's 1.0.0.
```

## Confirmations

What matched: the issue's six decisions, against `docs/roadmap.md` and `docs/roadmap.ko.md` at `e0e2eecc` (read). Rule 1 is at line 71 and rule 2 at line 72. Its timing is finding 1. Rule 3 is at line 73. Rule 4 is at line 47, and line 5 gives its grounds. Rule 4's "v0.2 and v0.3 stop being names of later goals" holds at lines 111-119, `docs/architecture.md:20`, `docs/architecture.md:74`, `docs/product.md:112` and `docs/product.md:165`. Rule 5 is named as later at line 75, and rule 6 at line 76. #279 and #280 are open in `after launch: first findings and conveniences` (executed `gh issue view`). The Korean lines say the same at the same numbers. The issue's done criterion "names the releases by what shipped, and the milestones by goal" holds in the two tables at lines 49-56 and 60-67.

What matched: scenarios B, C, D and G of `frame/design.md` printed nothing at `e0e2eecc` and exited 1 (executed). At `8a559b51` they printed 60, 12, 6 and 2 lines, so each can fail (executed). Scenario F printed `docs/roadmap.md:77`, and `git grep -c -F '그 전에는 ad hoc 서명으로 냅니다'` printed `docs/roadmap.ko.md:1` (executed). Phase 1's claim that the Korean signing sentence is the third of #78's Korean `to` holds. *Scope* item 6's "the second sentence of #78's Korean `to`" also holds as written, because roadmap.ko.md:77 carries that sentence word for word after "릴리스 0.0.5부터는".

What matched: this round's own census of the old rule, beyond the frame's searches. `git grep -n -I -E 'v0\.[0-9]'` over the whole tree outside `seal/threads/` and `pnpm-lock.yaml` found no two-part version (executed). `git grep -n -I -E '0\.0\.[5-9]|0\.[1-9]\.0|v0\.[0-9]'` outside `docs/` and the READMEs printed only the version check's example tags, the pinned check at 0.0.5, the package version and comments that say "before release 0.0.5" (executed). Every `N.N.N` token in `docs/*.md` and the READMEs was listed with `git grep -o -E '[0-9]+\.[0-9]+\.[0-9]+'` and classified (executed). Claude Code's, AgenticSeal's, pnpm's and Node's versions stay. Owlery's 0.0.1 to 0.0.4 are named as history. 0.0.5, 0.1.0 and 1.0.0 stand only where the new rules put them. The bare form `0.N` appears only in colour values of `docs/design.md` (executed). A search of the remaining tracked files outside `apps/`, `seal/`, `docs/` and `pr-check/` for "milestone", "version number" and "release:" printed nothing (executed). This census is a sample under contract rule 12, built from the token forms. A statement of the old rule in words with no number escapes it, and the searches for the old rule's phrases (scenario D, "milestone opens", "its milestone", "first signed", "Later versions", "이후 버전") found none in the policy documents (executed).

What matched: the two editions say the same, read sentence by sentence over every line the diff changes in `docs/roadmap*.md`, `docs/architecture*.md`, `docs/product*.md` and `README*.md` (read, with `git diff --word-diff`). Headings and table rows count the same in each pair: roadmap 11 and 40, architecture 27 and 124, product 15 and 36, README 7 and 16 (executed `grep -c '^#'` and `grep -c '^|'`). `git grep -n -e '도장'` over `docs` and both READMEs exited 1 (executed).

What matched: the tables against the tracker. `gh api 'repos/MichaelYcJo/owlery/milestones?state=all&per_page=50'` listed `release: 0.0.1` to `release: 0.0.4` closed and eight open milestones (executed). The release table holds each `release:` milestone by its number, and the milestone table holds each of the other six by its exact title. The rows' purposes match the milestone descriptions. The issues each row names stand where the row says: #78, #133 and #188 in `release: 0.0.5`; #257, #127 and #132 in `release: 0.1.0`; #176, #184 and #110 in `owner: by hand`; #73 in `after launch: first findings and conveniences`; and #54 and #55 in `milestone 3: hand over an issue` (executed `gh issue view` for each). 2026-11-29 is a Sunday (executed `date`).

What matched: links and anchors. A script in the round's scratch directory resolved every relative link with an anchor in the eight files by GitHub's heading slug rule. It checked 192 links at `e0e2eecc` and found none unresolved, and it found none unresolved of 178 at `f683c693` either (executed). Links into `roadmap.md#` and `roadmap.ko.md#` across the tree name only `#milestones`, `#releases-and-the-tracker` and their Korean anchors (executed), and the renamed headings carry none of them.

What matched: phase 1's diagram claim. By East Asian Width, the Korean box's line 20 measures 29 columns, the same as line 19 and the same as at `f683c693`, and every line of the English box measures 42 (executed, a script in the round's scratch directory). Whether GitHub draws the Korean edge in its column stays a row of `gaps.md`.

What matched: the overlap with the release. The unsettled designs whose operations name *Agent adapters* (#224) and *Overall layout* (#249 and #251, #188) quote none of the lines this work changed (read). The branches `feat/216-…`, `feat/133-…` and `fix/215-…` hold no frame that names a two-part version, 0.0.6 to 0.0.9, the phone line or `release: 0.1.0`, apart from #246's dated "(#220, release 0.0.6)", which another work item's frame holds (executed `git grep` on each `origin/` branch). The earlier changelog fragments of the release hold no bullet this work makes untrue (executed).

What matched: #78's operations on *Releases and the tracker*. The frame carries their decision, with the `.dmg` and ad hoc signing until the secrets stand, at `docs/roadmap.md:77`. It leaves their `to`s, "Downloads start with release 0.1.0" and "The first release with a download", unedited (`frame/design.md:67`). `skills/settle/rule-changes.md` reads a `from` the section no longer holds as history, and this frame's `why:` line names the carry (`frame/design.md:90`), so the settle meets both. Until that settle, the policy in force at that section is the baseline plus #78's `to`s, and those contradict the baseline. That residual is a row of `## Not judged`.

Quality, read and not opened as findings because each reads badly without misleading: `docs/roadmap.md:13` runs a colon and four commas through one sentence, where the Korean edition splits it into three; `docs/roadmap.md:85` repeats in its second sentence what its bold first sentence says; and `docs/roadmap.md:62` has the launch "find" something.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at the work item's last commit, including the documents leg. This round ran the heading and table-row counts as `grep -c` and did not run the `Broad gate` command, so the suite stays `unverified` | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate, and the sealer's spawn after it |
| How GitHub draws the Korean diagram's line 20 | `docs/architecture.ko.md:20` | the owner, reading the rendered page (`gaps.md`) |
| Whether #78's four `change` operations on *Releases and the tracker* should be re-pointed before the settle, since until then the policy in force reads their `to`s, "Downloads start with release 0.1.0" and "The first release with a download", against this work's text | `seal/threads/1795673151-78-the-app-ships-as-a-signed-dmg/frame/design.md:178-197` | the orchestrator, at the release's settle |
| Whether milestone #10's description, "The first release after the public launch of 0.1.0", should name a goal and not a release, as rule 4 makes no goal milestone a release | the tracker, milestone #10 | the orchestrator, which alone edits the tracker |

## Probes

| Command | Result |
|---|---|
| scenarios B, C, D and G of `frame/design.md` at `e0e2eecc` | printed nothing, exit 1 each |
| the same four at `8a559b51` | 60, 12, 6 and 2 lines |
| scenario F, English and Korean, at `e0e2eecc` | `docs/roadmap.md:77`; `docs/roadmap.ko.md:1` |
| `grep -c '^#'` and `grep -c '^\|'` for each of the eight files | 11/11 and 40/40, 27/27 and 124/124, 15/15 and 36/36, 7/7 and 16/16 |
| `git grep -n -e '도장' -- docs README.md README.ko.md` | exit 1 |
| the anchor script over the eight files, at `e0e2eecc` and at `f683c693` | 192 checked and 0 unresolved; 178 checked and 0 unresolved |
| the width script over the diagram boxes of both `docs/architecture*.md` | English 42 on every line; Korean line 20 at 29, as line 19 and as at the base |
| `gh api 'repos/MichaelYcJo/owlery/milestones?state=all&per_page=50'`, and `gh issue view` for 29 issues the tables and the frame name | each issue in the milestone the text names |
| `python3 skills/code-review/scripts/chain_check.py --baseline f683c693 --root <the branch worktree> --worktree`, before the record | exit 0; reports the absent round, gate and guarantee records, and prints no notice at `frame/design.md` |
