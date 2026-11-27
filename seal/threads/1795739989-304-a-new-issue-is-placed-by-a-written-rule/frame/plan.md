# Implementation Plan: a new issue is placed by a written rule (#304)

## Technical context

The tree as read at `490c3cf3`.

The work edits two files and no code: `docs/roadmap.md` and `docs/roadmap.ko.md`. In both, the section *Releases and the tracker* (*릴리스와 트래커*) runs from line 45 to line 87, its milestone table ends at line 67, and the paragraph on release 0.0.3 opens at line 69. The new text goes between them, and the row the work rewrites is line 65 of each edition. The broad gate's documents leg counts, for each pair, the lines that open with `#` and with `|`, and refuses `도장` in `docs` (`seal/config.json` `Broad gate`). The work adds a numbered list and two paragraphs to each edition, so neither count moves.

The section's other text stays. The opening paragraph already says what a `release: <version>` milestone is, and the milestone table already says what each goal milestone is for, so the list names each milestone by its title and does not say again what it holds.

The failure scenario of the chosen approach, six months on: the tracker gains or renames a milestone, and the list still names the old title in backticks. The milestone table above the list fails the same way, and a work item that changes a milestone meets both by searching the roadmap for the title. A second risk is issue #279, which changes when a release takes its number. If no `release: <version>` milestone is open while work merges, test 1 names a milestone that does not exist, and #279's work item rewrites the test (`frame/design.md` *Out of scope*). A third is the line on an issue: the rule reads an issue with no milestone as sorted where a line says why, and no script holds that, so an orchestrator that sets no milestone and leaves no line leaves the issue reading as not yet sorted, which is the safe side.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Write the rule as a numbered list after the milestone table of *Releases and the tracker* | The list names milestone titles a second time, beside the table, and both go stale together when the tracker changes. | Chosen. The issue asks for one place a reader applies top to bottom, and a numbered list is the form that has an order. |
| Replace the milestone table's structure: add a column "Takes an issue that" to it and drop the list | The table's own sentence says it "states no order of work beyond the one *Why this order* gives", and its rows stand in the tracker's order, not the order of the tests. `release: <version>` has no row in it. A reader could not tell which row wins where two match, which is the case #176 and #57 show. | Rejected. Premise of keeping the table as it is, checked: its rows state goals and the tracker's titles on 2026-11-26, and the release milestone stands in the other table (read). |
| A new sub-heading for the rule, such as `### Where a new issue goes` | One more heading in each edition and a new anchor. The issue names *Releases and the tracker* as the place, and the rule reads the two tables of that section. | Rejected. |
| A file outside the policy root, such as `CONTRIBUTING.md` or an issue template | A person outside reads it, but the reader of this rule is the orchestrator, which reads the roadmap. Two places would then state where an issue goes. | Rejected. |
| The issue's order: release, row of *Milestones*, shipped defect, edge case, owner | #176, #221, #228 and #229 are defects or gaps a person met in what has shipped, and stood in `owner: by hand` when the frame read the tracker on 2026-11-27 (`frame/design.md` *Grounding*, the rows on *Why this order* and on `owner: by hand`). Read top to bottom, the issue's step 3 would send the next such issue to `after launch: first findings and conveniences`, where nobody but the owner can do it. | Rejected. |
| The owner's test third, above the two tests on findings and below the test on a row of *Milestones* | An issue only the owner can do that also builds a row of milestones 3 to 5 goes to that milestone, as #57, #68 and #79 stand today. A reader who expects every owner's task in `owner: by hand` finds the walks elsewhere. | Chosen. It is the one order that places #176, #221 and #57 where the tracker holds them. |
| "An issue with no milestone is not yet sorted", as the issue words it | #34, #98 and #120 stand with no milestone on purpose, as work that waits for what comes after the first version, and #120's comment says so (`frame/design.md` *Grounding*, the row on the open issues with no milestone). They would read as not yet sorted at every pass, and each pass would ask the owner again. | Rejected. |
| "An issue with no milestone, and with no line on it that says why, is not yet sorted" | The line is prose on an issue, and no script reads it. An orchestrator has to open the issue to see it. | Chosen. The issue already asks for the line, and it is what #34 and #120 already carry. |
| A milestone of its own for what comes after the first version, so that no milestone always means not yet sorted | It changes the tracker, which no agent may, and `docs/roadmap.md` *After the first version* says that work has no scope and no number yet. | Rejected. Opening it is the owner's (`frame/design.md` *Out of scope*). |
| Rewrite the goal of `hardening: boundaries and edge cases` to drop its limit to milestones 1 and 2 (*Scope* item 3) | The roadmap's row and the description of milestone #8 differ until the orchestrator rewrites the description. | Chosen. The tracker already holds cases found after milestone 2 shipped. |
| Leave that row, and limit test 5 to what milestones 1 and 2 found | An edge case found while release 0.1.0 or milestone 3 is built meets no test, and each one costs a question to the owner, the most expensive step. | Rejected. |
| State the rule as `add` and `change` operations in `## Rule changes`, for the settle to write | The pull request would then change no document, and issue #304's *Done when* names what `docs/roadmap.md` states. `routing.md` gives the build to a crafter, "documents only". Operations written beside a direct edit would make the settle add the text a second time. | Rejected. The subject is the policy root's own text, which its pull request edits directly (`frame/design.md` *Rule changes*). |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1 to 3 of `frame/design.md`, in both editions of the roadmap | Scenarios E and F of `frame/design.md`, each search run at the phase's commit. Scenarios A to D and G read. The counts of scenario H run by the crafter, and the broad gate by the orchestrator. No test, since no code changes. | 90fcfa85 |

## Overlap with the release

The spawn names no other open work item of release 0.1.0, so none was read for where it meets this work. No other work item's directory stands under `seal/threads/` at `490c3cf3`.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| | | | |

## Operational impact

No migration, variable, dependency or version move. The orchestrator, which alone may post, owns what this work leaves in the tracker:

- The description of milestone #8 still reads "found while milestones 1 and 2 were built", and *Scope* item 3 widens the roadmap's row.
- The open issues with no milestone on 2026-11-27 are #250, #137, #136, #120, #108, #98, #35 and #34. #34 and #120 carry a line that says why. #108 and #250 carry none. #137, #136, #98 and #35 were not opened by this frame. Once the rule is merged, the ones with no line are not yet sorted.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-27 | The 0.0.3 row of the release table, `docs/roadmap.md:53` and `docs/roadmap.ko.md:53`, keeps "are now in the milestone `owner: by hand`" of #176, #184 and #110, which the owner moved into `release: 0.1.0` on 2026-11-27. This work leaves the row, and the settle of release 0.1.0 rewrites it with the release table. | The owner returns the three issues to `owner: by hand` if they do not finish by 2026-11-28 (the comment on #176 of 2026-11-27), so where they stand is known only when the release closes. The release table is the settle's record of what each release shipped (`frame/design.md` *Out of scope*, the row on the row 0.1.0). | `skills/core/SKILL.md` *A judgment stands on a source document, and is written down with both*; `frame/design.md` *Out of scope* |
