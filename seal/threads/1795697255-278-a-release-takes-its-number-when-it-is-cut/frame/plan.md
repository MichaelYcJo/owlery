# Implementation Plan: a release takes its number when it is cut (issue #278)

## Technical context

The tree as read at `24b0bbb5`.

The work edits eight files and no code: `docs/roadmap.md`, `docs/architecture.md`, `docs/product.md`, `README.md` and the `.ko.md` edition of each. Each English line the work rewrites has its Korean line at the same line number (`frame/design.md` *Grounding*, the row on every version). The broad gate's documents leg counts, for each pair, the lines that open with `#` and with `|`, and refuses `도장` anywhere in `docs` and the READMEs (`seal/config.json` `Broad gate`). The rewrite adds one table of six rows and removes three rows, in both roadmap editions, and renames three headings without changing their number.

The roadmap's headings `## v0.1`, `### Not in v0.1` and `## Later versions` change their anchors. Only `docs/roadmap.md:73` and its Korean line link one of them, `#later-versions`, and *Scope* item 8 rewrites that bullet. No unsettled design's operation names one of the three sections.

The failure scenario of the chosen approach, six months on: rule 5 lands as its own issue, and that work item rewrites the release branch bullet's interim sentences of *Scope* item 5, or they stand beside a practice that no longer cuts a branch at the start. The rule 5 work item meets them by searching for `release/v<version>` and `records-place.ts` in `docs/roadmap.md`. A second risk is a reader who takes "the first version" for release 0.1.0. *Scope* item 9's sentence states that the first version names a goal and that 0.1.0 holds the minimum to publish.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Keep "v0.1" as the name of the five-milestone goal, and retire only v0.2 and v0.3 as rule 4 says in words | Release 0.1.0 ships on 2026-11-29 with the minimum to publish, while milestones 3 to 5 come after it (the tracker, executed). "v0.1 is done when all five hold" then stands beside a shipped 0.1.0, and a reader takes one for the other. Rule 4's grounds, that a goal is named by what it builds because a release takes its number when it is cut, hold for v0.1 as they do for v0.2. | Rejected. |
| Name the goal "the first version" | It is the name `docs/product.md` and `docs/architecture.md` already use (`frame/design.md` *Grounding*). A reader may still read it as 0.1.0, which *Scope* item 9's sentence answers. | Chosen. |
| Coin a new goal name, such as one from the goal's sentence | A term no other document uses, which every document would have to take in, and which this work would invent beyond the owner's decisions. | Rejected. |
| Keep the release table's structure and give each future row a provisional number | Rows 0.0.6 to 0.0.8 already named milestones by numbers that the owner's cut of 2026-11-26 left on no release. A provisional number is the old rule under another word. | Rejected. Premise of the replacement checked: the tracker holds two kinds of milestone, `release:` ones with a number and goal ones without (executed: `gh api .../milestones`). |
| Replace the future rows with a second table of goal milestones | Two tables to keep in step with the tracker. Each states what the tracker holds on 2026-11-26, and the opening paragraph says so. | Chosen. |
| One table whose first column holds either a release number or a milestone title | A column named "Release" that holds a milestone title reads as a release. | Rejected. |
| Until rule 5, the number of a release is proposed and approved when its branch is cut, and stays (*Scope* item 5) | Rule 2's "at the release's close" waits for rule 5 to take full effect. A release that grows a new capability after its branch was cut as a patch keeps the patch number. | Chosen. A connected repository's check clones `release/v<version>` of its pinned version until the tag exists (`apps/desktop/src/daemon/records-place.ts:97-105`), so the branch's name and the version on it are one number. |
| Cut the branch under the next patch number as a placeholder, and set the number at the close | Where the close sets a minor, the version on the branch no longer matches the branch's name, and a connected repository pinned to that version finds neither its tag nor its branch until the tag exists, the failure #277 describes. | Rejected. |
| Rename the release branch at the close when the number changes | A connected repository pinned to the old number loses the branch it clones. | Rejected. |
| Carry #78's two operations on *Releases and the tracker* in this rewrite, keeping its second sentence word for word | The settling session meets #78's `from` as history and its `to` half standing, and has to read this design's *Grounding* to see why. | Chosen. |
| Leave #78's operations for the settle and keep the old signing sentence | This work's rewrite and #78's `to` both write the same bullet. #78's `to` says "Downloads start with release 0.1.0", which the tracker's move of #78 into 0.0.5 and the workflow's run at every tag make untrue. | Rejected. |
| Edit the tracker's milestone descriptions and the titles of #69, #80 and #187 in this work | No agent posts (contract rule 6), and the issue's done criteria name the roadmap's two editions. | Rejected. *Operational impact* hands them to the orchestrator. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1 to 15 of `frame/design.md`, in both editions of each file | Scenarios B, C, D, F and G of `frame/design.md`, each search run at the phase's commit. Scenarios A and E read. The counts of scenario H run by the crafter, and the broad gate by the orchestrator. No test, since no code changes. | `f8a059e8` |

## Overlap with the release

Read: the combined branch of #215, #216 and #133 that `routing.md` names, at `feat/216-nothing-in-the-window-reads-the-daemons-lists-again` and `feat/133-a-daemon-of-another-build-stays-until-a-person-restarts-it` and `fix/215-a-filtered-sidebar-whose-last-work-item-is-deleted-stands-empty` (executed: `git diff --stat` and the `## Rule changes` lines of their designs against `origin/release/v0.0.5`), and every unsettled design on `release/v0.0.5`. Their diffs change `docs/design.md` and its edition, which this work does not touch. The rows below are where a rule or a section meets.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #133 and #216 | `docs/architecture.md` *Overall layout*: their `## Rule changes` operations name it for the settle, and this work edits the diagram's phone line in it directly. No `from:` of theirs quotes that line (executed). | Either. This work rides their combined pull request, and merging it last into the combined branch costs nothing. | The two changes touch different lines, and theirs land only at the settle. |
| #78, merged as #272 | `docs/roadmap.md` *Releases and the tracker*: #78's two operations per edition | #78, already merged | This work carries #78's decision (*Scope* items 2 and 6), so the settle finds it standing. |

## Operational impact

No migration, variable, dependency or version move. The orchestrator, which alone may post, owns what this work leaves in the tracker:

- The descriptions of milestones #3, #4, #5 and #8 name the first version and no release number.
- Issue #80 is titled "nobody has checked the done criteria of the first version". #69 and #187 name the release that ships milestone 4 and the release that ships the hardening milestone, in place of 0.0.6 and 0.0.7.
- Issue #279 holds rule 5 and issue #280 holds rule 6, both in `after launch: first findings and conveniences`.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
