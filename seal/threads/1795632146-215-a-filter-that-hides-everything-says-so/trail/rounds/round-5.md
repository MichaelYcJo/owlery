# Review round 5: 1795632146-215-a-filter-that-hides-everything-says-so

```seal
target: 3ca05764, fixes 590619d7..3ca05764
```

This round verifies what followed round 4 on this work item's own branch. Round 4 reviewed `b7c523a9` and left no finding open, and `590619d7` recorded it. The range after that holds five commits on the branch's own line:

- `3298cac8`: the six shots linked in `gaps.md`.
- `d942ecab`: the merge of `origin/release/v0.0.5` at `f683c693`, which brought #224 (pull request #270), #272 and #217 (pull request #274).
- `5753706b`: the six `*-narrowed.png` shots, taken again.
- `e57ea078`: the links in `gaps.md` pointed at `5753706b`.
- `3ca05764`: the orchestrator's fold of *Scope* items 8 and 9 and a row of *Judgments of the run*.

Round 4 closed no finding, so no earlier close is owed a `confirms:` line. The round written for this work item on the abandoned combined branch was read as a lead only, and each of its facts below was found again at this target. Its two findings do not stand here. That branch placed this work's case before #217's, but here it stands last. That branch's shots came from a run no row recorded, but here `gaps.md` records the run at the merge of `f683c693`.

**This work's code stands as its branch left it.** For each file this work changes, this round compared two sorted lists of changed lines (executed): `git diff 783e2331 3298cac8`, the branch's own diff against its earlier base, and `git diff f683c693 3ca05764`, its diff against the new base. They are the same lines in `index.html`, `renderer.ts`, `sidebar.ts`, `themes.css`, `view.ts`, `view.test.ts`, `docs/design.md` and `docs/design.ko.md`. They differ in three files, and in each only a comment or a docstring that a conflict joined differs:

- `screenshots.test.ts`: the header comment and the comment of `show.narrowed` (`:701`) now name the parked work item as "the work item of the view "parked"", in #224's words. The comment adds that neither its title nor its branch holds "history".
- `screenshots.ts:10`: the `VIEWS` docstring keeps #224's rewording of an earlier view and ends with round 3's words for `narrowed`.
- `work-item-menu.test.ts:13-18`: the header comment lists #217's case and then this work's case, last.

`git diff --stat d942ecab 3ca05764 -- . ':!seal'` prints nothing (executed), so the code at the target is the merge's.

**The case stands last, after #217's.** #217's case "holds no Copy branch name in the menu of a work item with no branch yet" stands at `work-item-menu.test.ts:1239`, and this work's case follows it at `:1250`, last of the file's 33 cases (read). #217's case registers `fifth` through the form (`:1240`, `create` at `:214-221`) and presses the line of the work item it makes. So the cases before this one leave one repository, as the folded *Scope* item 8 says, and this case counts its rows rather than assuming a number.

**The narrowed view still leaves no repository under #224's and #217's scene.** `view.ts#matchWorkItems` keeps under "decided" a work item whose record holds a decision `decided` or `reversed`. The run writes a decision into the parked work item's record alone (`screenshots.test.ts:816`, the one `withDecision` call). That work item is "Choose the base of the hotfix" (`:225`), whose branch `branchedWorktree` names from its title (`repositories.ts:41-45`). The word "history" stands in the titles "Add an export of the history" and "Sort the history by date" (`:177`, `:204`). The repository is named `project` (`repositories.ts:59`), and the scene registers it once (`:785`). So the filter and the search together leave no work item, and the sentence takes the one-repository end. The six shots below show that sentence. (read)

## Findings

### 1. *Scope* item 8 says the built-app case registers two repositories, `kept` and `lone`, but it registers three, and hides the third

```seal
severity: should
location: `seal/threads/1795632146-215-a-filter-that-hides-everything-says-so/frame/design.md:53`
evidence: executed `git grep -n -i -e 'kept` and `lone`' -e 'two temporary repositories' -e 'registers two' -e 'stands last' -e 'the last of' 3ca05764 -- seal/threads/1795632146-215-a-filter-that-hides-everything-says-so ':!seal/threads/1795632146-215-a-filter-that-hides-everything-says-so/trail'`; read `apps/desktop/test/work-item-menu.test.ts:50-54`, `apps/desktop/test/work-item-menu.test.ts:1251-1258`
```

Why it matters: *Scope* item 8 states what the work's built-app case does. The fold at `3ca05764` rewrote the item and kept the sentence "it registers two temporary repositories through the form, `kept` and `lone`, each with one work item of the shell kind". At the target the case registers a third, `aside` (`work-item-menu.test.ts:1253`). It hides `aside` from its menu and waits for the hidden repositories' button before it counts the rows (`:1254-1258`). The sealer reads the frame against the tree, and the settle reads it for what the work holds. Each would miss that the case reads the hidden repositories' button under the sentence. That order is the one *Scope* item 3 states, and round 1's finding 1 asked for it.

The sentence has been false since `47b92bd1`, round 1's fix, which added `aside` to the case. `frame/plan.md:66` records that fix in *Judgments of the run*, but the *Scope* item never took it in. Rounds 2, 3 and 4 read the frame whole and passed the item, this proofer's rounds 3 and 4 among them. Their verdict carried and was not re-derived, so this finding is new and names no earlier close.

The rest of item 8 holds at the target. The case is the file's last. #217's case before it registers one repository. The case counts its rows, and `<n>` leaves a hidden repository out, as `view.ts#emptySidebar` counts only repositories that are not hidden. So "Two are needed so that `<n>` is more than 1" stays true: `aside` is the third, and it is not counted. `work-item-menu.test.ts` passed whole at the target, 33 cases (executed).

The search printed one line, `frame/design.md:53`, with both "the last of" and "stands last", which hold, and "two temporary repositories", which does not. It is a sample under contract rules 12 and 19: a statement of the case's repositories in other words escapes it. `gaps.md:8` says the case "gained the hidden repository" at `47b92bd1`, which is true. The trail records state what stood at their own commits and are not edited.

```text
seal/threads/1795632146-215-a-filter-that-hides-everything-says-so/frame/design.md:53, in item 8, from
  so it registers two temporary repositories through the form, `kept` and `lone`, each with one work item of the shell kind.
to
  so it registers two temporary repositories through the form, `kept` and `lone`, each with one work item of the shell kind. It also registers a third, `aside`, with one work item, and hides it from its menu before it counts the rows, so the hidden repositories' button stands under the sentence and "Show every work item", and neither the rows it counts nor `<n>` hold `aside`.
```

The fix adds no heading and no table row, and no case reads `frame/design.md`.

```seal
verdict: fixed 00adaf14
answer: The orchestrator applied the round's sentence to `frame/design.md` *Scope* item 8 word for word. Records alone.
```

## Confirmations

What matched: *Figure against its text*. The six `*-narrowed.png` files at `3ca05764` were opened one by one, in Night watch, Register and Desk, each dark and light. Their blobs differ from those of `3298cac8` and from the abandoned combined branch's `1f7689ec` (executed: `git ls-tree -r` at each), so they come from this branch's run. Each shows "history" in the search field with "0 of 7". The sidebar's head holds the bell with 3, the filter's icon inside its edge, and "+". The sidebar says `No work item under "Decided without asking" matches "history", so the sidebar does not list its repository.` with "Show every work item" under it, and it lists no repository row. That is the sentence `NARROWED_SAYS` pins (`screenshots.test.ts:469`), and the one-repository form *Data & interfaces* gives. The inbox's own filter reads "Decided without asking", and its list says "No work item matches.". The status line now reads "3 agents of 3", from the release's scene, which this work does not draw. (read)

What matched: the closing memo's account of the run. `gaps.md:9` says the run at the merge of `f683c693` (`d942ecab`), with every theme, passed and wrote 108 shots, and that its six `narrowed` shots replace the earlier six in `5753706b`. 108 is the 18 views of `VIEWS` in three themes and two appearances, and `5753706b` was committed two minutes after `d942ecab` (read: `git log -1 --format=%ci`). The run itself is the crafter's claim, with a commit and a command. `gaps.md:10` and the first paragraph of *Not done* (`:14`) now name the merges of `783e2331` and `f683c693`. The six links (`:18-28`) name the full id of `5753706b`, which holds each file at the path the link gives. That is the form `docs/design.md:520` states for an image in a pull request's body. (read)

What matched: the unit cases of this work under the merged tree. `view.test.ts`, `screenshots.test.ts` and `themes.test.ts` passed together at the target, 614 cases passed and 1 skipped. The skipped case is the built-app screenshot run, which runs only under its own variable. "names one file for each view in each appearance of each theme" holds 108 files, with `desk-light-narrowed.png` last (`screenshots.test.ts:392-394`). (executed)

What matched: the built-app file where this work's case meets #217's. `work-item-menu.test.ts` passed whole at the target, 33 cases, #217's case and then this work's. (executed)

What matched: the two editions. `docs/design.md` and `docs/design.ko.md` each hold 15 heading lines and 390 table-row lines at the target (executed: `grep -c '^#'` and `grep -c '^|'`). The list of views ends with round 3's words in each edition (`:512`). The `VIEWS` docstring keeps "and "history" typed in its search, which together leave" (executed: `grep -c`). (read)

What matched: the folded *Scope* item 9 (`frame/design.md:54`) against the scene. It now says that "history" is in the titles and branches of the finished and the at-review work items alone. It also says that since #217 a stored work item's branch is the one `branchedWorktree` makes from its title, which `repositories.ts:41-45` does. The new row of *Judgments of the run* (`frame/plan.md:68`) names `d942ecab` and `5753706b`, and cites `chain_check.py#follows`, which the plugin's `skills/code-review/scripts/chain_check.py:991` defines. The third row still cites `view.ts:1316-1317` at the merge `c73d1b93` it names. That row records a judgment at its commit, so the coordinate is no finding. (read)

What matched: the other records, read whole at the target. `routing.md` names this branch, the one the pull request now opens from. `frame/questions.md`, `changelog.md` and `pr.md` hold the bytes round 4 read (executed: `git diff --stat 590619d7 3ca05764` over the work item names only `frame/design.md`, `frame/plan.md`, `gaps.md` and the shots). `pr.md` quotes the bold openings of *Scope* items 1, 2, 4, 5 and 9, which stand unchanged. Finding 1's fix changes a sentence `pr.md` does not quote. The records language is English, so no `pr.<lang>.md` is owed. (read)

## Not judged

| What | Location | Who answers |
|---|---|---|
| The screenshot run's `narrowed` wait was never seen to fail. This round read the committed shots and did not repeat the run, as the prompt asked | `gaps.md` *Not verified*, the last row | the orchestrator, who decides whether a second screenshot run is worth the machine's time |
| The repository-wide suite, the typecheck of every package and the heading and table-row count over every `docs/*.md`, labelled `unverified` | the broad gate in `seal/config.json` | the orchestrator, at the broad gate |
| Q1, the words of the sentence and the button, still `open` for a person | `frame/questions.md` Q1 | the owner, at the pull request |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts test/screenshots.test.ts test/themes.test.ts` in `apps/desktop` of a clone at `3ca05764`, with Electron's dist given by `ELECTRON_OVERRIDE_DIST_PATH` | 3 files passed, 614 cases passed and 1 skipped |
| `node scripts/test-in-electron.mjs test/work-item-menu.test.ts` in the same place | 1 file passed, 33 cases |
