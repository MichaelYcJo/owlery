# Review round 2: 1795697255-278-a-release-takes-its-number-when-it-is-cut

```seal
target: f64968f3, fixes 2671581a..f64968f3
```

This is a verifying round. Its code bound is the fix diff from `2671581a` (round 1's record) to `f64968f3`, which holds `6f08d378`, `491dd145`, `c78b0abe`, `911fc3ed` and the close of round 1. The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md` and `trail/rounds/round-1.md` whole at `f64968f3`. No `pr.md` or `pr.<lang>.md` stands yet. Carried from round 1, and not re-established: the census of version tokens outside `docs/roadmap*.md`, the tracker's milestones and the issues' memberships, the diagram widths, and the overlap with the other work items. The fix diff touches none of them, since it changes only `docs/roadmap.md`, `docs/roadmap.ko.md` and this work item's `frame/design.md`, `frame/plan.md`, `routing.md` and round record. The searches round 1's findings rest on were run again at `f64968f3`.

## Findings

None.

## Confirmations

```seal
confirms: round-1#1
```
What holds: *Releases and the tracker* now states the moment a release takes its number once, with the interim beside it, in both editions (read at `f64968f3`, and executed `git diff --word-diff=plain e0e2eecc f64968f3 -- docs`). `docs/roadmap.md:47` reads "A release holds what has merged when it is cut, and from issue #279 on it takes its number then. Until #279 lands, a release takes its number when its branch is cut, as the release branch bullet below states." `docs/roadmap.md:72` ends "The orchestrator proposes the number with its grounds, and the owner approves it, when the release branch is cut until issue #279 lands and at the release's close from then on, as the two bullets below state." `docs/roadmap.md:74` opens its interim with "Until issue #279 lands,", so the "While" that could read as "during" is gone. `docs/roadmap.md:84` limits "follows what merged" to the release cut from #279 on. The fix pass claimed that line 72 is written in its own words because the round's paste-ready sentence pointed at the release branch bullet alone, and that bullet names only the interim. That claim holds. Line 74 names the moment at the branch's cut, line 75 names the release's close, and the new line 72 names both. The Korean lines 47, 72, 74 and 84 state the same in their own words, and "브랜치를 따는 동안에는" no longer appears. Round 1's evidence search, run again at `f64968f3`, prints in `docs` only `docs/roadmap.md:5`, `:47` and `:84` and `docs/roadmap.ko.md:47`, `:72`, `:75` and `:84` (executed). Each of those lines states the moment with #279 beside it, or names the release's close as the later moment, except line 5, which round 1 judged stays. *Scope* items 1, 4, 5 and 8 at `frame/design.md:29`, `:42`, `:44` and `:50` quote the new sentences. A script compared every quote of 40 or more characters on those lines with `docs/roadmap.md` and found each one whole in the file (executed). The one quote it did not find is item 6's "A release below 0.1.0 is a git tag the owner builds from", which names the bullet as it stood before the work. `911fc3ed` made item 4 quote line 72 as the fix pass wrote it.

```seal
confirms: round-1#2
```
What holds: `frame/plan.md:42`'s *Merges first* cell reads "Either. This work opens its own pull request into `release/v0.0.5` (`routing.md`, *Branch*), and their operations land only at the settle, so neither order changes a line the other writes." (`491dd145`, read). It agrees with `routing.md:22`. `routing.md:16` now reads "The frame names where the documents state them, since the work edits the policy documents directly and its `## Rule changes` holds nothing" (`6f08d378`, read). That agrees with `frame/design.md:89-90`, whose section holds the no-change block. `grep -rn -F 'combined'` over `routing.md` and `frame/` prints only `routing.md:22`, as the route first taken, and `frame/plan.md:38`, as what the framer read, both of which round 1 judged stay (executed). The close names `491dd145`, and the `routing.md` half was made by `6f08d378`. Both commits are records alone, and each one changes a path the finding located.

```seal
confirms: round-1#3
```
What holds: `frame/design.md:27` reads "New text names no `v0.x`, and no release number above 0.1.0 other than rule 1's 1.0.0." (`491dd145`, read). That agrees with `docs/roadmap.md:71`. `docs/roadmap.md:86`'s "A 1.x number" names the number that the third rejected alternative turns down, not a release, so the sentence holds of it too.

What matched: the documents after the fixes. Scenarios B and C of `frame/design.md` print nothing at `f64968f3` and exit 1 (executed). Headings and table rows count the same in each pair: roadmap 11 and 40, architecture 27 and 124, product 15 and 36, README 7 and 16 (executed `grep -c`). Round 1's anchor script, run over both roadmap editions at `f64968f3`, checked 82 links and found none unresolved (executed).

What matched: the fix diff adds no unit beyond the sentences above. No new link, heading, table row or file stands in it (read).

The pointer "as the two bullets below state", which closes `docs/roadmap.md:72`, and its Korean "아래의 두 항목이 그것을 말합니다", name no bullet. The next two bullets are rule 3 at line 73 and the release branch bullet at line 74, while the second moment is stated at line 75. Line 72 now states both moments itself, so the pointer misleads no reader about what to do. This is wording only, at `docs/roadmap.md:72`, and the round opens no finding for it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at `f64968f3`, including its documents leg. This round ran the counts as `grep -c` and did not run the `Broad gate` command, so the suite stays `unverified` | `seal/config.json` `Broad gate` | the orchestrator, at the broad run, and the sealer's spawn after it |
| How GitHub draws the Korean diagram's line 20 | `docs/architecture.ko.md:20` | the owner, reading the rendered page (`gaps.md`) |
| Whether #78's four `change` operations on *Releases and the tracker* are re-pointed before the settle (carried from round 1) | `seal/threads/1795673151-78-the-app-ships-as-a-signed-dmg/frame/design.md:178-197` | the orchestrator, at the release's settle |
| Milestone #10's description, which names a goal milestone as a release (carried from round 1) | the tracker, milestone #10 | the orchestrator, which alone edits the tracker |

## Probes

| Command | Result |
|---|---|
| round 1 finding 1's `git grep -n -o -F` on the fact's words, at `HEAD` (`f64968f3`), the round records left out | `docs/roadmap.md:5`, `:47`, `:84`; `docs/roadmap.ko.md:47`, `:72`, `:75`, `:84`; the work item's changelog and frame titles and the quotes at `frame/design.md:29`, `:50` and `:54` |
| a script comparing each quote of 40 or more characters at `frame/design.md` lines 29 and 41 to 52 with `docs/roadmap.md` | every quote found whole, except item 6's name of the old bullet |
| scenarios B and C at `f64968f3` | printed nothing, exit 1 each |
| `grep -c '^#'` and `grep -c '^\|'` for the eight files | 11/11 and 40/40, 27/27 and 124/124, 15/15 and 36/36, 7/7 and 16/16 |
| the anchor script over `docs/roadmap.md` and `docs/roadmap.ko.md` | 82 checked, 0 unresolved |
| `grep -rn -F 'combined'` over `routing.md` and `frame/` | `routing.md:22`, `frame/plan.md:38` |
