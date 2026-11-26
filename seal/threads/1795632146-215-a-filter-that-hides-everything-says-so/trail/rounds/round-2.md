# Review round 2: 1795632146-215-a-filter-that-hides-everything-says-so

```seal
target: ea34e56c, fixes 039acb8b..ea34e56c
```

This round verifies the fixes. Its range starts after `039acb8b`, the commit that recorded round 1, and runs through `ea34e56c`, the commit that recorded round 1's close. The range holds the following commits:

- `82119a17`: the orchestrator's two rows of `frame/plan.md` *Judgments of the run*.
- `47b92bd1`: the fix.
- `0d3f65da`: the closed row of `gaps.md`.
- `de6f3416`: one space put back.
- `ea34e56c`: the close.

`origin/release/v0.0.5` still stands at `943b1bfd` (executed: `git ls-remote origin release/v0.0.5`).

Carried from round 1, not re-established: where the sidebar draws the sentence, the press and the hidden button (`sidebar.ts:209-234`), what `emptySidebar` counts, and the verdicts on the code under `apps/desktop/src`. The diff from `569583c4` to `ea34e56c` changes no file under `apps/desktop/src` or `docs` (executed: `git diff --stat 569583c4 HEAD -- docs apps/desktop/src`). It also leaves untouched `routing.md`, `frame/design.md`, `frame/questions.md`, `changelog.md`, `pr.md` and `trail/phases/` (executed: the same command over those paths printed nothing). Round 1 read each of those whole, at a commit holding the same bytes. The records the range changes, `frame/plan.md`, `gaps.md` and round 1's close, were read whole at the target.

## Findings

## Confirmations

```seal
confirms: round-1#1
```
What holds: the last case of `apps/desktop/test/work-item-menu.test.ts` now reads the hidden repositories' button under the sentence and "Show every work item". The fix pass applied the round's snippet as written (read: `git diff 569583c4 HEAD -- apps`).

- At `work-item-menu.test.ts:1129-1132` the case registers `aside` through the form and hides it from its menu. Before it counts the rows, it waits until the row is gone and `#hidden-repositories` stands.
- At `:1167` it reads `["sidebar-empty", "show-every", "hidden-repositories"]`.
- `aside` is declared, made in `beforeAll` and removed in `afterAll` beside `kept` and `lone` (`:45-46`, `:241`, `:260`).

Round 1's evidence search, re-run at the target, now prints `:1132` and `:1167` beside the earlier lines (executed: `grep -n 'hidden-repositories' apps/desktop/test/*.ts`). So a case that narrows the sidebar now reads the button.

The mutation in the close checks the guard the finding named. Turning the `append` of `sidebar.ts:233` into a `prepend` puts the hidden button first, and the close quotes the failure at `:1167` with `'hidden-repositories'` first. That is the line and the guard the finding was about (read). The run itself is the fix pass's claim, and this round did not repeat it.

What can the fix break? This round read the case's other readings against the hidden repository.

- `listed` is counted after the hide, so it leaves `aside` out. The sentence's `<n>` from `emptySidebar` also leaves out a hidden repository. The two still agree.
- After the press, the wait for `listed` rows holds, because `sidebarTree` lists no hidden repository.
- `lines` is counted after `aside`'s work item exists, so `lines - 1` holds whether or not the inbox lists a hidden repository's work item.
- The keyboard still goes to the first `button.fold`, which a hidden repository does not draw.
- `app.until` wraps its expression in `Boolean(...)` (`built-app.ts:280`), so the element the wait reads counts as true.
- The earlier cases that expect no hidden button (`:728`, `:739`, `:1098`) run before this one, which stands last. Run alone with `-t`, the case meets no hidden repository but its own.

All of this was read; none of it was run.

What matched: `de6f3416` changes whitespace alone: `git diff -w de6f3416^ de6f3416` prints nothing (executed). So the close's reason for not repeating the run holds.

What matched: the file's header comment (`work-item-menu.test.ts:12-15`) now says the sentence stands "above the button of a repository it hides". The comment over `aside` says what the case reads, and the case's name stays true (read).

What matched: `gaps.md` closes its row on the whole run of `work-item-menu.test.ts` with the fix pass's run at `47b92bd1`, 31 passed. The file holds 31 cases at the target (read: round 1's count, and the fix adds no `it(`). The run is the fix pass's claim with a command and a commit. The row stays as the close says, not removed.

What matched: the rows `82119a17` adds to `frame/plan.md` *Judgments of the run*.

- The first names the orchestrator as the writer of Q2's Status cell in `f40ff8b2`, which answers what round 1 left in prose.
- The second routes round 1's finding 1 to a fix pass.

Each names its grounds and the document it stands on, and `skills/code-review/orchestration.md` holds the heading the second row cites (executed: `grep -n` on the heading).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole run of `work-item-menu.test.ts` at `47b92bd1` and its `seal mutate` run, both the fix pass's claims; this round ran no test, since reading settled the close | `apps/desktop/test/work-item-menu.test.ts` | the orchestrator, at the broad gate |
| The repository-wide suite, the typecheck of every package and the docs' heading and table-row count | the broad gate in `seal/config.json` | the orchestrator, at the broad gate |
| Q1, the words of the sentence and the button, still `open` for a person | `frame/questions.md` Q1 | the owner, at the pull request |

Nothing stays open after this round. What comes due is the orchestrator's broad run, and after it the sealer's spawn.

## Probes

| Command | Result |
|---|---|
| none | This round ran no test and wrote no probe |
