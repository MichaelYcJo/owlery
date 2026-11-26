# Review round 3: 1795632146-215-a-filter-that-hides-everything-says-so

```seal
target: 013f9624, fixes 05e05cf8..013f9624
```

This round verifies the merge of the base. Its range starts after `05e05cf8`, the commit that recorded round 2, and runs through `013f9624`. The range holds three commits on the branch's own line:

- `c73d1b93`: the merge of `origin/release/v0.0.5` at `783e2331`, which brought #259, #262, #263, #264, #265, #267 and #268.
- `f6520c10`: the six `*-narrowed.png` shots, taken again.
- `013f9624`: the orchestrator's fold of the merge into `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md` and `changelog.md`.

Round 2 left no finding open, so no earlier close is owed a `confirms:` line.

**Both sides' code stands as each side left it.** Against the merge base `943b1bfd`, the branch's own changes to each file it touches were compared before and after the merge (executed: for each file, the sorted changed lines of `git diff 943b1bfd 05e05cf8` against those of `git diff 783e2331 013f9624`). They are the same lines in `index.html`, `renderer.ts`, `sidebar.ts`, `themes.css`, `view.ts`, `view.test.ts` and `work-item-menu.test.ts`. They differ only in `screenshots.test.ts`, `screenshots.ts`, `docs/design.md` and `docs/design.ko.md`, where the crafter rewrote the `narrowed` view and placed its list item after the release's new views. `git diff --stat 783e2331 013f9624` lists 28 files, all of them this work's own. So the release's other files are byte for byte as `783e2331` holds them, and the release's lines in the conflicted files survive. Nothing under `apps/desktop/src` changed after round 2, so round 2's verdicts on the code carry. Round 1's coordinates were carried for the drawing of the sentence and the press; the source diff, read again at the target, shows them unchanged.

**The release changes what the filter keeps.** At the target, `view.ts:1316-1317` keeps under "decided" a work item whose record holds a decision `decided` or `reversed`. The scene's parked work item, "Choose the base of the hotfix" (`screenshots.test.ts:221`), now holds a decision and its reversal (`screenshots.test.ts:799`), and no other work item of the scene gets a decision written. So "Decided without asking" alone leaves that work item and the repository listed, as *Scope* item 9 now says. The word "history" stands in the titles of "Add an export of the history" and "Sort the history by date" alone (`screenshots.test.ts:173`, `:175`), neither of which holds a decision. The filter and the search together leave no work item, and the sentence takes the one-repository end, since the scene registers one repository (`screenshots.test.ts:768`).

## Findings

### 1. The `VIEWS` docstring and the list of views in both editions of `docs/design.md` still describe the `narrowed` view as narrowed by the filter alone

```seal
severity: should
location: `apps/desktop/test/screenshots.ts:10`, `docs/design.md:512`, `docs/design.ko.md:512`
evidence: executed `git grep -n -F -e 'a filter leaves no repository' -e '필터가 저장소를 하나도 남기지 않은' -e "chosen in the sidebar's filter, which leaves" 013f9624 -- apps docs`; read `apps/desktop/test/screenshots.test.ts:14`, `seal/threads/1795632146-215-a-filter-that-hides-everything-says-so/frame/design.md:54`, `seal/threads/1795632146-215-a-filter-that-hides-everything-says-so/trail/phases/phase-2.md:9`
regression: round-2
```

Why it matters: the merge pass made the view type "history" as well as choose the filter, but left two descriptions of the view stating the old scene.

- `screenshots.ts:10`, the docstring of `VIEWS`, ends with "the inbox with "Decided without asking" chosen in the sidebar's filter, which leaves the scene's one repository unlisted". Since #264 that choice alone leaves the repository listed. *Scope* item 9 now says so: "the filter alone leaves the repository listed".
- `docs/design.md:512` names the view "the sidebar where a filter leaves no repository", and `docs/design.ko.md:512` names it "필터가 저장소를 하나도 남기지 않은 사이드바". `trail/phases/phase-2.md:9` gave the grounds for those words: "The view narrows by a state alone, so its name drops "or a search"". Those grounds no longer hold. A reviewer reads the shots against this list, as its own section says, and the shots show a search typed.
- The other statements of the view were rewritten in the merge pass. The header comment of `screenshots.test.ts:14` says "the sidebar where a filter and a search leave no repository", and `changelog.md` line 8 says "the sidebar that a filter and a search leave with no repository".

*Scope* item 9 states that the view chooses the filter and types "history", and that `screenshots.ts#VIEWS` and its docstring gain the view. The merge pass `c73d1b93` changed the view's `show`, `leave`, the sentence and the header comment to match. It also resolved the conflicts on `screenshots.ts:10` and on line 512 of both editions, and in each it kept this work's words from before #264. The defect came from carrying those words through the conflict as they stood, unread against the new scene.

The search printed five lines. Two of them, `index.html:268` and `sidebar.ts:129`, say "a search or a filter leaves no repository". They state the general rule of the sidebar and stay true. The other three are this finding's locations. The search is a sample under contract rules 12 and 19: a description of the view worded otherwise escapes it. The trail records, `trail/phases/phase-2.md` and `trail/rounds/round-1.md`, state what stood at their own commits and are not edited.

```text
apps/desktop/test/screenshots.ts:10, the docstring's last item, from
  ..., and the inbox with "Decided without asking" chosen in the sidebar's filter, which leaves the scene's one repository unlisted, so the sidebar says so and the filter's icon stands inside its edge. */
to
  ..., and the inbox with "Decided without asking" chosen in the sidebar's filter and "history" typed in its search, which together leave the scene's one repository unlisted, so the sidebar says so and the filter's icon stands inside its edge. */

docs/design.md:512, the list's last item, from
  ..., and the sidebar where a filter leaves no repository.
to
  ..., and the sidebar where a filter and a search leave no repository.

docs/design.ko.md:512, the list's last item, from
  ..., 필터가 저장소를 하나도 남기지 않은 사이드바입니다.
to
  ..., 필터와 검색이 저장소를 하나도 남기지 않은 사이드바입니다.
```

Neither edition gains a heading or a table row, so the broad gate's counts stay equal.

```seal
verdict: fixed dffc5cef
answer: The paste-ready fix was read against `frame/design.md` *Scope* item 9, which at `013f9624` says the view chooses "Decided without asking" and types "history", and against `screenshots.test.ts#NARROWED_QUERY` and `show.narrowed`, which type that word. It writes no count and no universal, so it was applied as written to `screenshots.ts:10`, `docs/design.md:512` and `docs/design.ko.md:512`. It adds no unit. Both editions still hold the same number of heading lines and table-row lines (`grep -c '^#'` and `grep -c '^|'` each print the same for both). `node scripts/test-in-electron.mjs test/screenshots.test.ts test/view.test.ts` in `apps/desktop` passed at `dffc5cef`: 2 files, 590 cases passed and 1 skipped. Re-run after the fix commit, the evidence's `git grep -n -F -e 'a filter leaves no repository' -e '필터가 저장소를 하나도 남기지 않은' -e "chosen in the sidebar's filter, which leaves" HEAD -- apps docs` prints two lines. `index.html:268` and `sidebar.ts:129` say "a search or a filter leaves no repository". That is the sidebar's general rule, and it stays true, as the finding says. A wider search on "filter leaves", "filter alone" and "필터가" over `docs`, `apps/desktop/test` and this work item's frame and top-level records found no other description of the view. That search is a sample.
```

## Confirmations

What matched: *Figure against its text*. The six `*-narrowed.png` files at `f6520c10` were opened one by one. Each shows "history" in the search field with "0 of 7", the filter's icon inside its edge next to the bell, and the sentence `No work item under "Decided without asking" matches "history", so the sidebar does not list its repository.` Under the sentence stands "Show every work item", and no repository row is listed. That is the sentence `NARROWED_SAYS` pins (`screenshots.test.ts:463`) and the one-repository form *Data & interfaces* gives. The inbox's own filter reads "Decided without asking" and its list says "No work item matches.", since the sidebar and the list share one narrowing. (read)

What matched: *Scope* item 9 against the code. `show.narrowed` (`screenshots.test.ts:683-689`) opens the inbox, chooses `decided`, types `NARROWED_QUERY`, and waits for the sentence, the button, no section, the class `on`, the title `Showing: Decided without asking, matching "history"` and a computed edge. That title is `view.ts#filterMark`'s form for a state and a search. `leave.narrowed` (`:751-755`) empties the field, chooses `all`, and waits until the sentence is gone, one section stands, the field is empty and the class `on` is gone. The wait for one section fails if the emptied field does not reach `held.query`, so the leave checks its own effect. The comments at `:684` and `:752` and the docstring of `NARROWED_QUERY` (`:460`) state the new scene. (read)

What matched: the unit cases of both sides. `view.test.ts` and `screenshots.test.ts` passed together, 590 cases and 1 skipped. The skipped case is the built-app run, which runs only under its own variable. The case "names one file for each view in each appearance of each theme" holds 108 files, with `desk-light-narrowed.png` last. (executed)

What matched: the built-app file both sides changed. `work-item-menu.test.ts` passed whole at the target, 32 cases, this work's last case among them beside #263's delete dialog cases. (executed)

What matched: `themes.test.ts` passed at the target, 16 cases, which read every token's value in both editions after the release's changes to `docs/design.md`. (executed)

What matched: the records the fold rewrote, read whole at the target.

- *Scope* item 9 (`frame/design.md:54`) and the row of the search that matches nothing in *Alternatives considered* (`frame/plan.md:36`) state the filter and the search.
- The third row of *Judgments of the run* (`frame/plan.md:67`) cites `view.ts:1316-1317`, which holds the `reversed` branch at the target.
- `frame/questions.md:11` points at the paragraph on the scene and says that since #264 it no longer holds.
- `gaps.md:9` says the run at `c73d1b93` wrote 108 shots. That is the 18 views of `VIEWS` in three themes and two appearances.
- `changelog.md:8` names the view as a filter and a search.
- `pr.md` quotes *Scope* items 1, 2, 4, 5 and 9 by their bold openings, which stand unchanged.

`frame/design.md:35`, in *The code as it stands*, still says the scene holds no decision made without asking. That section is dated to the framer's read of `06b9b5d6` (`frame/design.md:5`), and at that commit it held, so it is no finding. (read)

What matched: *Record against another work item's frame*. The unsettled frames of #150, #218, #214 and #249/#251 name *A pull request that changes the window carries its screenshots* in `## Rule changes`, and #231's names it in its *Scope*. Each adds a paragraph or changes a sentence other than the list of views. #150's added paragraph says the run writes a decision and its reversal into the parked work item's record, which is the fact the new view stands on. None of them rewrites the list sentence this work extends. (executed: `grep -n -F` on the heading over `seal/threads/*/frame/design.md`, then the `## Rule changes` blocks read)

Outside the fix diff, and no finding of this work: the inbox's head in the shots says `0 of 7 work items match "history" in title, branch or repository`. Two titles hold "history", and the count is 0 because `list.ts:183` counts what the search and the filter leave together, which `list.ts:195` then words as a match of the search alone. That code is the base's, and this branch does not change `list.ts`. The view only makes it visible. The orchestrator may judge whether it is worth an issue.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The screenshot run at `c73d1b93`, 108 shots, and its `narrowed` wait never seen to fail; this round read the committed shots and did not run the batch | `gaps.md` *Not verified*, the last row | the orchestrator, who decides whether a second screenshot run is worth the machine's time |
| The repository-wide suite, the typecheck of every package and the docs' heading and table-row count, labelled `unverified` | the broad gate in `seal/config.json` | the orchestrator, at the broad gate |
| Q1, the words of the sentence and the button, still `open` for a person | `frame/questions.md` Q1 | the owner, at the pull request |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts test/screenshots.test.ts` in `apps/desktop` of a clone at `013f9624` | 2 files passed, 590 cases passed and 1 skipped |
| `node scripts/test-in-electron.mjs test/work-item-menu.test.ts` in the same place | 1 file passed, 32 cases |
| `node scripts/test-in-electron.mjs test/themes.test.ts` in the same place | 1 file passed, 16 cases |
