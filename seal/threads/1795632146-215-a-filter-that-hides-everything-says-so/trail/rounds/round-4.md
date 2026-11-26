# Review round 4: 1795632146-215-a-filter-that-hides-everything-says-so

```seal
target: b7c523a9, fixes 013f9624..b7c523a9
```

This round verifies the close of round 3. Its range starts after `013f9624`, the target of round 3, and runs through `b7c523a9`. The range holds three commits:

- `89e2cd0b`: round 3's record.
- `dffc5cef`: the fix.
- `b7c523a9`: the close.

`git diff --stat 013f9624 b7c523a9` lists `apps/desktop/test/screenshots.ts`, `docs/design.md`, `docs/design.ko.md` and `trail/rounds/round-3.md`, nothing else (executed). So the other records, `routing.md`, `frame/`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/`, hold the bytes round 3 read whole at `013f9624`, and their reading carries. Round 3's verdicts on the code under `apps/desktop/src`, the merge and the shots carry too, since the range touches none of them.

## Findings

## Confirmations

```seal
confirms: round-3#1
```
What holds: `dffc5cef` applies round 3's paste-ready text word for word at its three places (read: `git diff 013f9624 b7c523a9 -- apps docs`).

- The `VIEWS` docstring (`apps/desktop/test/screenshots.ts:10`) now ends "the inbox with "Decided without asking" chosen in the sidebar's filter and "history" typed in its search, which together leave the scene's one repository unlisted".
- `docs/design.md:512` names the view "the sidebar where a filter and a search leave no repository".
- `docs/design.ko.md:512` names it "필터와 검색이 저장소를 하나도 남기지 않은 사이드바".

The diff changes these three lines and no other line under `apps` or `docs`.

The evidence search, re-run at the target, now prints two lines, `index.html:268` and `sidebar.ts:129` (executed: `git grep -n -F -e 'a filter leaves no repository' -e '필터가 저장소를 하나도 남기지 않은' -e "chosen in the sidebar's filter, which leaves" HEAD -- apps docs`). Both state the sidebar's general rule, "a search or a filter leaves no repository", which round 3 left as true. A search for the new words prints the three fixed lines, the header comment at `screenshots.test.ts:14` and `changelog.md:8`. So the view's descriptions in code, policy and changelog now all name the filter and the search (executed: `git grep -n -F -e 'a filter and a search leave' -e '필터와 검색이' -e '"history" typed in its search' HEAD -- apps docs` and this work item's records outside `trail/`). Both searches are samples under contract rules 12 and 19. The close's wider search on "filter leaves", "filter alone" and "필터가" is its own claim, and this round did not repeat it.

The two editions keep their counts. `docs/design.md` and `docs/design.ko.md` each hold 15 heading lines and 390 table-row lines at the target, as each did at `013f9624` (executed: `grep -c '^#'` and `grep -c '^|'` on each file, and the same over `git show 013f9624:<file>`). This count covers the two files the fix changed. The broad gate's loop over every `docs/*.md` stays the orchestrator's.

What can the fix break? The docstring edit stays inside its `/** */` comment, and no case reads the list of views in either edition: `grep -rn -e design.md -e design.ko.md apps/desktop/test/*.ts` names no case that opens `docs/` (executed). `screenshots.test.ts` passed at the target, 7 cases passed and 1 skipped. The skipped case is the built-app run, which runs only under its own variable (executed). The fix adds no unit, so no new code needed review.

What matched: the close block of round 3's finding 1 says what was applied and where. It says the counts of both editions stay equal, which this round's count confirms. It gives the evidence search's two remaining lines, which this round's run printed too. Its run of `screenshots.test.ts` with `view.test.ts` at `dffc5cef` is the fix pass's claim, with a command and a commit. This round ran `screenshots.test.ts` alone, since `dffc5cef` changes no file `view.test.ts` reads.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The screenshot run's `narrowed` wait was never seen to fail, and the run was not repeated after the fix. The fix changes no shot. | `gaps.md` *Not verified*, the last row | the orchestrator, who decides whether a second screenshot run is worth the machine's time |
| The repository-wide suite, the typecheck of every package and the heading and table-row count over every `docs/*.md`, labelled `unverified` | the broad gate in `seal/config.json` | the orchestrator, at the broad gate |
| Q1, the words of the sentence and the button, still `open` for a person | `frame/questions.md` Q1 | the owner, at the pull request |

Nothing stays open after this round. What comes due is the orchestrator's broad run, and after it the sealer's spawn.

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/screenshots.test.ts` in `apps/desktop` of a clone at `b7c523a9` | 1 file passed, 7 cases passed and 1 skipped |
