# Phase 1: 1795632146-215-a-filter-that-hides-everything-says-so

## What this phase found

**The frame holds, except at two places, and the build follows the parts that hold.** The coordinates of `frame/design.md` *Grounding* state `06b9b5d6`. At `fc5233bf`, after the merge of `943b1bfd`, the lines they name stand where they said, or one or two lines lower. The two places are below.

**Departure 1: the built-app case registers two repositories, not one.** *Scope* item 8 says that earlier cases of `apps/desktop/test/work-item-menu.test.ts` leave repositories listed, and that every other work item of the file is asleep. At the file's end, neither holds. Its last case at `fc5233bf`, "names in the removal's dialog each work item of the repository…", removes the clone's repository and waits until `#repositories` holds no `section` (read). So when the new case starts, the sidebar lists no repository and no work item. With one new repository, `<n>` is 1, and the sentence takes the one-repository end that *Data & interfaces* gives, `so the sidebar does not list its repository.` The case would then never read the form *Scope* item 8 and the scenario "The owner's case" quote, `lists none of its <n> repositories`. So the case registers two repositories through the form, `kept` and `lone`, each with one work item of the shell kind. It counts the rows before it narrows and asserts that there are more than one. The search "Filtered away" matches only `lone`'s work item. The case counts every number it reads, the rows and the inbox's lines, so it also holds when it runs alone with `-t`. Then `beforeAll`'s two work items still stand in the clone's repository, and the sentence counts 3 repositories. Judged against `frame/design.md` *Scope* item 8, which says the case writes no number of its own, and *Data & interfaces*, which defines `<n>`.

**Departure 2: the view `narrowed` in the list of *A pull request that changes the window carries its screenshots* is left to Phase 2.** *Scope* item 6 puts it in Phase 1. That list names the views the screenshot run makes, and `apps/desktop/test/screenshots.ts#VIEWS` holds no `narrowed` until Phase 2 adds it (*Scope* item 9). Written at Phase 1, the sentence would state a view the run does not make. Phase 2 writes it into both editions with the view. Judged against `docs/design.md` *A pull request that changes the window carries its screenshots*: "The pull request that adds a view to the run adds it to this list". Every other part of *Scope* item 6 is written: the token's row in each theme's table of both editions, its name in *What the names say*, the rewritten Selected cell of "An icon's button", and the new row "The sidebar where a filter or a search leaves no repository".

**The names the phase took.** `view.ts#filterMark(query, state)` answers `{ on, says }`, for *Scope* item 1. `view.ts#emptySidebar(repositories, listed, query, state)` answers the sentence or `""`, for *Scope* item 2. `view.ts#SHOW_EVERY_WORK_ITEM` holds the button's words. `SidebarActions.showEvery` is the press of *Scope* item 4. The paragraph is `#sidebar-empty`, and the button is `#show-every` with the class `quiet`. These are the frame's proposals, named as *Data & interfaces* allows.

**Q2 is settled: the keyboard goes to the first repository's fold button.** The decision is option (a) of `frame/questions.md` Q2, which *Scope* item 4 also states. The press removes the button it was on, and its own draw brings the repositories back. The first fold button is the first thing that draw brings back, so the keyboard stays in the sidebar, where the press was. The fold button's own press puts the keyboard back on its button after its draw, in the fold's click handler in `sidebar.ts#showSidebar`, so this follows a form the sidebar already has. Option (b), the search field, would put the keyboard in a field the press has just emptied, and a key typed there would narrow the sidebar again. Option (c), the list in front, would take the keyboard out of the sidebar, which no other press in the sidebar does. Judged against `frame/design.md` *Scope* item 4 and `frame/questions.md` Q2. The built-app case pins the choice by reading `document.activeElement`. The Status cell of Q2 in `frame/questions.md` still reads `open`. This phase does not write that file.

**Q1's default words stand, and the cases pin them:** the three sentences, the one-repository end and "Show every work item", as *Data & interfaces* gives them.

**No new contrast case.** The edge is `--ink-muted` on the sidebar's ground, at rest and under the pointer. `apps/desktop/test/themes.test.ts#WORDS` already holds `--ink-muted` to 4.5 to 1 against `[--ground-side]` and `[--ground-side, --hover]` in every block, which is above the mark's floor of 3 to 1. So the existing case holds the edge's contrast. (read)

**Seen red, and the mutation runs.** Each run is one `seal mutate` command, at `22c8cb83` for the units the unit cases cover and at `57bcf3ab` for the units the built-app case covers. Each verdict line read `red`, and each failing line was read for the guard its break removed.

- The five new cases of `view.test.ts` ran against `fc5233bf`'s `view.ts`, where neither function existed, and failed with `TypeError: filterMark is not a function` and `emptySidebar is not a function`. (executed)
- `view.ts`, against `view.test.ts -t "filterMark|emptySidebar"` (executed):
  - the search taken out of `on`;
  - the `, matching "<query>"` part taken out;
  - the guard `listed > 0` removed, red at the line `emptySidebar([PROJECT, docs], 1, …)`;
  - the guard "nothing narrows" removed, red at `emptySidebar([PROJECT, docs], 0, "", "all")`;
  - the guard `kept === 0` removed, red at `emptySidebar([hidden], 0, …)`;
  - the hidden repositories counted;
  - the one-repository end taken out;
  - the search-alone sentence taken out;
  - the count taken out of the sentence.
- `index.html`, the edge written as the page's own shadow, `inset 0 0 0 1px var(--ink-muted)`: red in `themes.test.ts` "writes no shadow, no light, no gradient and no corner of its own in its style". (executed)
- The new built-app case, run alone with `-t "says in the sidebar, after a delete"` (executed):
  - the append of the sentence and the button removed in `sidebar.ts`: red at the wait for the sentence, which also shows the case red against a tree that draws no sentence (contract rule 15);
  - the search field left filled at the press: red at the line that reads the field's value;
  - the focus line removed: red at the line that reads `document.activeElement`;
  - `held.filter = "all"` removed from `renderer.ts#showEvery`: red at the wait for every repository;
  - `held.query = ""` removed: red at the same wait;
  - the class `on` turned off in `sidebar.ts`: red at the mark's first reading;
  - the edge removed from `.icon-button.on`: red at the same line, on its third value, which compares the control's computed `box-shadow` with `--on-edge`.
- The token `--on-edge` had no `seal mutate` run of its own. Its line is the same text in each of the six blocks of `themes.css`, and its row is the same text in each theme's table, so no `<old>` text occurs once. Two existing cases of `themes.test.ts` hold the token: "names every property of every block … in both editions, and no other token", and "reads no property that neither its own block nor every theme defines". (read)

**The built-app file's run is bound to `22c8cb83`.** `work-item-menu.test.ts` ran whole once there and passed all 31 cases. The case ran alone at that commit and failed on a number written into it: it expected one line in the inbox, and `beforeAll`'s two work items were there too. `57bcf3ab` changed that one line, so the case counts the inbox's lines before it narrows. No other line of the file changed after the whole run. At `57bcf3ab` the case passed alone, as the baseline of each built-app `seal mutate` run above. The whole file did not run again. (executed)

**The renamed rule's other statements, as a sample.** `git grep -n -i -e "what it turns on is on" -e "Showing:" -e "icon-button.on" -e "filter's control" -e "sidebar-filter-control"` over the tree outside `seal/threads` lists only the lines this phase wrote. A search for "hidden repositor", "filter of the sidebar" and "sidebar's filter" over `docs` and `README.md` lists only the rewritten cell. The docstring of `sidebar.ts#showSidebar` said that the search field "is left as it is". The press now empties it, so `e8617a31` rewrote that sentence.

**For Phase 2.** The screenshot scene holds one repository, so the `narrowed` view's sentence takes the one-repository end: `No work item stands under "Decided without asking", so the sidebar does not list its repository.` The view's `leave` chooses "All" again, as *Scope* item 9 says. Pressing `#show-every` does the same and also empties the search field. Phase 2 also writes `narrowed` into the views list of both editions, as departure 2 above says.
