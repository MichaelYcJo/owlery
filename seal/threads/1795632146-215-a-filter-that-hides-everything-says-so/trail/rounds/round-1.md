# Review round 1: 1795632146-215-a-filter-that-hides-everything-says-so

```seal
target: 569583c4 against release/v0.0.5
```

The branch was read against `943b1bfd`, which is `origin/release/v0.0.5` and the merge base (executed: `git merge-base HEAD 943b1bfd`, `git ls-remote origin release/v0.0.5`). The local ref `release/v0.0.5` in the worktree still stands at `ab7a5730`, so a diff against it lists other work items' files, and this round did not use it. No earlier round exists, so no fact was carried: every coordinate below was opened at `569583c4`. The unit runs and the probe ran in a `git clone --no-local` of the worktree, checked out at `569583c4`, in the round's scratch directory.

## Findings

### 1. The hidden repositories' button under the empty sidebar's sentence and its button is stated and drawn, and no case holds its place

```seal
severity: should
location: `apps/desktop/test/work-item-menu.test.ts:1157`, `apps/desktop/src/renderer/sidebar.ts:224`, `apps/desktop/src/renderer/sidebar.ts:233`
evidence: executed `grep -n 'hidden-repositories' apps/desktop/test/*.ts` (prints only lines 723 to 734 and 1093 of `work-item-menu.test.ts`, none in a case that narrows the sidebar); read `apps/desktop/test/work-item-menu.test.ts:1157`, `apps/desktop/src/renderer/sidebar.ts:209-234`, `docs/design.md:446`
```

Why it matters: `frame/design.md` *Scope* item 3 states that `#repositories` holds the sentence, then "Show every work item", "and then the hidden repositories' button where any repository is hidden". The new row of `docs/design.md` line 446 says the same in both editions: "The button that says how many repositories are hidden stands under them." The code draws it so: `sidebar.ts:224` appends the sentence and the button, and `sidebar.ts:233` appends the hidden repositories' button after them. No case reads that order with a hidden repository present. The built-app case reads the children of `#repositories` at `work-item-menu.test.ts:1157` as exactly `["sidebar-empty", "show-every"]`, since no repository is hidden when it runs. The unit cases of `emptySidebar` read only the sentence. So moving the hidden button's append above the sentence's keeps every case green. Contract rule 14 asks that a change a person sees be pinned in the same work. The plan's *Overlap with the release* names #227 and #228 as the next items to rework `sidebar.ts#showSidebar`, so the next edit of that function is already planned.

The fix registers a third repository in the last case and hides it before the case counts the rows. Each count the case reads then leaves it out, as `emptySidebar` and `sidebarTree` do. The search "Filtered away" matches nothing in it. Precondition: the `data-repo` of a repository's fold button is the folder the form registered, which `sidebar.ts#showSidebar` sets from `repository.folder`, and `temporaryRepository` returns the real path, which the form registers. The statements this touches: the comment over `kept` and `lone` (`work-item-menu.test.ts:41`), the file's header comment on the last case (lines 11 to 14), and the case's name, which says nothing of a hidden repository and stays true.

```ts
// beside `let kept` and `let lone` (work-item-menu.test.ts:41-43)
  /** Two repositories the last case registers, each with one work item: its search leaves the work item of `lone`, and no other. */
  let kept: ReturnType<typeof temporaryRepository>;
  let lone: ReturnType<typeof temporaryRepository>;
  /** A third repository the last case registers and hides, so the hidden repositories' button stands under the sidebar's sentence. */
  let aside: ReturnType<typeof temporaryRepository>;

// in beforeAll, after `lone = temporaryRepository("lone");`
    aside = temporaryRepository("aside");

// in afterAll, after `lone?.remove();`
    aside?.remove();

// in the last case, after `await create("Filtered away", lone.repo);`
    await create("Set aside", aside.repo);
    const asideId = await value<number>(`Number(document.querySelector('${SIDEBAR} button.fold[data-repo=${JSON.stringify(aside.repo)}]').closest("section").dataset.repository)`);
    await fromMenu(asideId, "Hide from sidebar");
    await app.until(`!document.querySelector('${repository(asideId)}') && document.getElementById("hidden-repositories")`, "the third repository hidden, and the button that says so");

// in the last case, in place of line 1157
    // The hidden repositories' button stands under the sentence and the press that shows every work item.
    expect(await value<string[]>(`[...document.querySelectorAll('${SIDEBAR} > *')].map((element) => element.id)`)).toEqual(["sidebar-empty", "show-every", "hidden-repositories"]);
```

## Confirmations

What matched: *Scope* item 1. `view.ts#filterMark` answers `{ on, says }`: on where a search is typed or a state other than All is chosen, saying `Showing: <label>` and `, matching "<query>"` where a search is typed. `sidebar.ts#showSidebar` takes the class and the title from it, and `git grep -n -F -e 'toggle("on", held.filter' -e 'Showing: ${' -- apps/desktop/src/renderer/sidebar.ts` prints nothing, as the scenario "The colour-only mark is gone" asks (executed).

What matched: *Scope* item 2 and *Data & interfaces*. `view.ts#emptySidebar` counts the repositories that are not hidden, answers nothing where nothing narrows, where a repository is listed and where none is kept, and builds the three sentences and the one-repository end word for word as *Data & interfaces* gives them (read). The cases hold each guard. A probe took out the `listed > 0` guard and counted the hidden repositories, and all three `emptySidebar` cases went red, each on the guard it names (executed, `## Probes`). That agrees with the phase record's `seal mutate` list for those two guards. The other mutations it lists were not re-run.

What matched: *Scope* items 3 and 4. The press empties the field, then `renderer.ts#showEvery` sets `held.query` to `""` and `held.filter` to `"all"` and calls `showNarrowed`, which draws the sidebar and the list in front at once. After that the keyboard goes to the first `button.fold` (`sidebar.ts:212-222`, `renderer.ts:2085-2090`, read). After the press at least one repository is always listed, because the sentence stands only where `kept > 0` and nothing narrows after the press, so the focus always finds a fold button (read). An `inbox` the daemon sends during the press is held by `press.ts#drawHold` and runs after the click, and it replaces the fold button the keyboard was put on. That is the limitation #242's frame names out of scope, "The keyboard's place across a draw", and every fold button of the sidebar shares it. This diff does not introduce it.

What matched: *Scope* item 5 and *Principles* items 4, 5 and 9. `.icon-button.on` reads `box-shadow: var(--on-edge)`. `--on-edge` stands in all six blocks of `themes.css`, with as many lines as `--dot-edge` (executed: `grep -c`). The focus ring is an `outline` (`index.html:75`, `:114`), so the edge does not take the ring's place. No other element takes the class `on` (executed: `grep -n 'toggle("on"'` over the renderer). The phase record says `themes.test.ts#WORDS` already holds `--ink-muted` against `[--ground-side]` and `[--ground-side, --hover]`. `themes.test.ts:219` lists `AT_REST` and `UNDER_THE_POINTER`, which hold both grounds (read).

What matched: *Scope* items 6 and 9 and *Removes*. Both editions of `docs/design.md` carry the token in each theme's table, its name in *What the names say*, the Selected cell of "An icon's button" and the new row word for word as *Data & interfaces* gives them, and the view in the screenshot section's list. Each edition gains four table rows and no heading (read). `screenshots.ts#VIEWS` ends at `narrowed`, and the unit case expects 84 shots (read). `view.test.ts`, `themes.test.ts` and `screenshots.test.ts` pass at the target (executed, `## Probes`).

What matched: *Figure against its text*. The six `*-narrowed.png` files show the filter's icon inside its edge, the sentence `No work item stands under "Decided without asking", so the sidebar does not list its repository.` wrapped in the muted ink, "Show every work item" under it, and the inbox's own filter at "Decided without asking" with "No work item matches.", as `trail/phases/phase-2.md` says (read: each file opened). In Register the edged filter reads like the edged button under it, which *Alternatives considered* foresaw in the row of the edge.

What matched: the built-app case of *Scope* item 8 against its frame. It registers `kept` and `lone`, counts the rows and the inbox's lines, types "Filtered away", chooses "Asleep", deletes from the menu, reads the plural sentence with the counted `<n>`, the mark on, the ink, the size, the class `quiet`, and after the press the rows, `lone`'s count 0, the inbox at `lines - 1`, the mark off, the filter at All, the field empty and `document.activeElement` (read). The case before it is "names in the removal's dialog each work item of the repository…", as *Scope* item 8 says (read: `work-item-menu.test.ts:1097`). The file holds 31 cases at `22c8cb83` and at the target, which matches the phase record's whole run of 31. After that run the file changed only in the inbox count, and `sidebar.ts` only in its docstring (executed: `git diff 22c8cb83 HEAD`). Phase 2's claim that `284fb771` changed one comment after the screenshot run holds (executed: `git diff 6b7161d3 HEAD -- apps`).

What matched: the records against one another and the issue. `changelog.md`, `pr.md`, `gaps.md`, `routing.md` and the frame state the same sentences, words and coordinates as the code at the target. The changelog's "the first repository's row" and the design row's "the first repository's row" name the row whose fold button takes the keyboard (read). The issue's *Done when* is met item by item. Its "sidebar's row … states the mark and the sentence" is met by the new row for the sentence and by the rewritten "An icon's button" row, which names the sidebar's filter, for the mark (read). The other frames of the release at the target were read for the sections this work writes. #214's `## Rule changes` adds a paragraph to the screenshot section and does not rewrite its list of views. #242's rule holds a daemon draw during a press, which the press of "Show every work item" leaves as it was (executed: `grep -n -F` of the section headings over `seal/threads/*/frame/design.md`).

What matched: the labels. `gaps.md` *Not verified* labels the repository-wide suite, the typecheck, the docs count and the whole `work-item-menu.test.ts` at `57bcf3ab` and later as unverified, and names the orchestrator at the broad gate. That matches what the phase records say was run (read).

The Q2 row of `frame/questions.md` reads `answered 2026-11-26 by the work`. `trail/phases/phase-1.md` line 13 says the crafter did not write that file, and `frame/plan.md` line 35 says the framer declined to write the cell. Both changes stand in the fold `f40ff8b2` (executed: `git show f40ff8b2 -- <the two files>`). The cell's answer is the phase's own, and the cell's writer is recorded nowhere, `## Judgments of the run` being empty. This round opens no finding for it: the answer the cell carries is true and no reader acts on who typed it. The orchestrator may name the writer in `## Judgments of the run`.

The `.quiet` button's words now also stand on `--control` over the sidebar's ground. `themes.test.ts#WORDS` lists no `--control` ground for any word, a gap that predates this diff and also covers the dialogs' buttons. No case computes that contrast, and this round did not compute it either. In the six shots the button's words read clearly (read).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The repository-wide suite, the typecheck of every package and the heading and table-row count of `docs/*.md` against the `.ko.md` editions, which contract rule 2 keeps from this round | the broad gate in `seal/config.json` | the orchestrator, at the broad gate |
| `work-item-menu.test.ts` as a whole at the target. This round did not run the built-app file, since reading settled each claim about it | `apps/desktop/test/work-item-menu.test.ts` | the orchestrator, at the broad gate |
| The screenshot run's `narrowed` wait was never seen to fail, as `gaps.md` says | `apps/desktop/test/screenshots.test.ts` `show.narrowed` | the orchestrator, who decides whether a second screenshot run is worth the machine's time |
| Q1, the words of the sentence and the button, stands `open` for a person, and the build goes on with its default under Automation yes | `frame/questions.md` Q1 | the owner, at the pull request |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts test/themes.test.ts test/screenshots.test.ts` in `apps/desktop` of the scratch clone at `569583c4`, with `ELECTRON_OVERRIDE_DIST_PATH` set to the main checkout's Electron | exit 0: 3 files, 577 passed, 1 skipped |
| `view.ts#emptySidebar` edited in the clone to `const kept = repositories.length;` with the `listed > 0` guard removed, then `node scripts/test-in-electron.mjs test/view.test.ts -t emptySidebar` | exit 1: the three `emptySidebar` cases failed, the first two on the count, the third on `emptySidebar([PROJECT, docs], 1, "logs", "waiting")` answering a sentence. The edit was reverted, and `git status --short` in the clone printed nothing |
| `seal layout --pairs` in the clone | `0 files read, 0 pairs`: no test file declares a pair, so each new case was read against its own describe block alone |
