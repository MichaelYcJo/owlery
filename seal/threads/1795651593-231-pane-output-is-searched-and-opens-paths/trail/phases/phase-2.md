# Phase 2: 1795651593-231-pane-output-is-searched-and-opens-paths

## What this phase found

**The frame held for *Scope* items 6 to 12, with the departures and decisions below.** Its coordinates were opened at `88148160` before the build. `commandKey` and `paneMenu` stood in `apps/desktop/src/renderer/view.ts`, `menuAct`, `newScreen` and `giveBack` in `apps/desktop/src/renderer/work-item-view.ts`, and `onCommandKey` in `renderer.ts`. `apps/desktop/package.json` held no search add-on. The rows of *Components and their states* and the list of views stood in both editions of `docs/design.md` (read). The add-on's own source, `node_modules/@xterm/addon-search/src` of 0.16.0, was read for what the frame states of it, and the departures below come from that reading.

**What was built, by *Scope* item.**

- Item 6: `@xterm/addon-search` 0.16.0 in `apps/desktop/package.json` and `pnpm-lock.yaml`. `searchOf` in `work-item-view.ts` loads it into a screen at that screen's first find, and a screen nobody searched holds none.
- Items 7 and 9: `commandKey` reads F with the Command key as `find` on a Mac keyboard where a pane is in front, and G as `findNext`, or `findPrevious` with the Shift key, while the bar is open. Neither is read while a dialog or a menu is open, and on another keyboard Control+F and Control+G stay the shell's. `paneMenu` holds "Find…" with ⌘F after "Select All". In the field, Enter steps to the next match, Shift+Enter to the previous one, and Escape closes the bar. No key is read while a composition is under way.
- Item 8: the bar of `index.html`, with `findQuery` and `findCount` in `view.ts`. `find` in `work-item-view.ts` searches from the newest output to the oldest, and each step wraps.
- Item 10: `closeFind` removes the marks, clears the selection where it is still the one the bar's last search made, empties the field and gives the terminal the keyboard. `giveBack` closes the bar without that hand-back when its pane leaves the stage.
- Item 11: `findOptions` takes `--terminal-ink` and `--terminal-strong` as the theme in use has them. No token was added.
- Item 12: the row "A pane's find bar" stands after "A pane's tab" in both editions, and the list of views names the find bar's view after a work item's view. The screenshot run gains the view `find` (`apps/desktop/test/screenshots.ts`, `screenshots.test.ts`).

**Decision 1: the add-on counts to 1,001, so the bar tells 1,000 matches from more.** *Scope* item 8 asks for "More than 1,000 matches" "where the add-on stops counting". At the add-on's default `highlightLimit` of 1,000, a pane with exactly 1,000 matches and one with 5,000 both report a `resultCount` of 1,000. So `searchOf` passes `FIND_LIMIT + 1`, and `findCount` says "More than 1,000 matches" where the count passes `FIND_LIMIT`, or where the match in front is not among those counted (`resultIndex` -1). The count of the bar is the one *Scope* item 8 states. Mutant M1 of the table below puts the add-on's default back, and A3 fails under it. Judged against `frame/design.md` *Scope* item 8.

**Decision 2: the count is numbered from the newest match.** The add-on orders its results from the oldest line. The bar's first match is the newest (*Scope* item 8), so `findCount` gives the match in front as `resultCount - resultIndex`: the newest match is "1 of 17". Judged against *Scope* item 8 and the row "\"Next match\" steps down the output" of `frame/plan.md` *Alternatives considered*.

**Decision 3: "Match case" and "Regular expression" stay as they were set when the bar closes, and the field's text does not.** *Scope* item 10 says "what was typed is not kept" and names no choice. A person who searches with the case matched across several panes sets it once.

**Departure 1: a fresh search drops the add-on's last term first.** `findPrevious` and `findNext` of the add-on store the options they are handed before they compare them with the last ones (`SearchAddon.ts`, `this._state.lastSearchOptions = searchOptions` ahead of `shouldUpdateHighlighting`, read). A changed choice over the same text therefore marks and counts the old matches. The first run of `terminal-basics.test.ts` failed A3 on this: the count never read "1 of 1" after "Match case" was pressed (executed, `the window never showed one spelling with the case matched`). `find` now calls `clearDecorations()` at each fresh search, which empties the add-on's last term. Mutant M3 of the table below puts the old behaviour back, and A3 fails.

**Departure 2: no overview ruler is drawn.** *Data & interfaces* has the search options carry `matchOverviewRuler` and `activeMatchColorOverviewRuler`, and `findOptions` passes them. The add-on draws them only on a terminal made with the `overviewRuler` option, and `newScreen` makes none (read). So the inks reach no scroll bar. The frame asks for no ruler on the scroll bar, so nothing was added for it. `findOptions`'s comment says so.

**Departure 3: the match in front is told by its outline's ink, not by a class.** The add-on's `_applyStyles` adds `xterm-find-active-result-decoration` only when its third argument is true, and every caller passes false (`DecorationManager.ts`, read). The built-app cases read the computed outline colour of each `xterm-find-result-decoration` against `--terminal-strong` and `--terminal-ink`. The terminal draws a mark at its next frame after the count changes, so `frontMatch` and `marksDrawn` in `terminal-basics.test.ts` wait for the expected marks for up to five seconds. The first run read no marks at all, because it read them in the same frame (executed, A1 `expected [] to deeply equal [ 'ink', 'strong' ]`, A2 `expected -1 to be 2`).

**Departure 4: the terminal's selection is read through the pane menu's "Copy".** A1 of `frame/design.md` names `term.getSelection()`. The page keeps its terminals in a module scope that CDP cannot reach, as phase 1 found for `term.options.scrollback`. `selected()` presses the right button on an empty cell. There xterm.js keeps a selection and makes none. It then reads what "Copy" put on the stand-in clipboard, or null where "Copy" cannot be pressed. A key typed in the terminal ends its selection. So A4 reads the selection before any key reaches the terminal. The first order of A4 let mutant M5 survive, and the reordered case fails under it on `expected 'owlescape' to be null` (executed).

**Departure 5: a press in the bar's field over a pane not in front puts that pane in front, and the field keeps the keyboard.** Side by side, a pane's `focusin` puts its pane in front and `showView` gives that pane's terminal the keyboard. A press in the bar's field would otherwise move the keyboard out of the field it was put in. `newScreen`'s `focusin` handler sets `front` first where the focus is inside the bar. A5 holds it, and mutant M9 fails A5. A press of the right button on the bar opens no menu, which A5 holds as well (mutant M10).

**Departure 6: a line that took the add-on's selection after the pane printed was built, then removed.** The add-on searches again 200 ms after the pane prints, and selects again. The first build stored that selection as the bar's in `onDidChangeResults`. No case could tell it apart, and mutant M14 survived. The re-search starts from the selection and finds the same match at the same place (`findPreviousWithSelection` in `SearchEngine.ts`, read), so the stored selection is the same in all but a buffer that trimmed lines in those 200 ms. The line was removed in `75696578`, so the build holds no unit that nothing watches.

**Seen red (executed).**

- The unit cases, written before `view.ts` held any find code, failed 11 and passed 6 of the 17 they select, with 542 skipped (exit 1). They then passed 559 of 559 once `view.ts` was built (exit 0).
- The built-app cases A1 to A5 were shown red by the mutations below, run after the commits they name. The find step of B4 was shown red after `cf5f148b` with M19 alone, "Find…" doing nothing, against `-t 'scenario B4'`: it failed at `terminal-basics.test.ts:1231` on `the window never showed the find bar with the keyboard in its field`. The first run of `terminal-basics.test.ts` failed A1, A2 and A3 for the reasons in departures 1 and 3, and passed 29 (exit 1).

**Mutations, each through `seal mutate` after the commit it names (executed).** Mutations U1 to U11 ran after `2c371bb5` against `node scripts/test-in-electron.mjs test/view.test.ts -t 'commandKey|paneMenu|findQuery' --bail 1`. They ran 0.5 s each. That runner's unit cases take 0.5 s: the same command run alone passed 17 cases in 0.47 s (exit 0). U6 and U10 were run alone as well, and their failing lines read `expected { Object (term, caseSensitive, ...) } to be null` and `expected '13 of 12' to be 'More than 1,000 matches'`. Mutations M1 to M24 ran after `f0d19655` against `env OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/terminal-basics.test.ts -t 'scenario A' --bail 1`, and M5 again alone after `75696578`, against `-t 'scenario A4'`.

| # | Unit | Mutant | Verdict |
|---|---|---|---|
| U1 | `view.ts#commandKey` | the Shift key of G read the other way | red |
| U2 | `view.ts#commandKey` | G read while the bar is closed | red |
| U3 | `view.ts#commandKey` | F read where no pane is in front | red |
| U4 | `view.ts#paneMenu` | "Find…" named "Search…" | red |
| U5 | `view.ts#findQuery` | no regular expression checked | red |
| U6 | `view.ts#findQuery` | an empty field searched | red |
| U7 | `view.ts#findQuery` | "Match case" and "Regular expression" swapped | red |
| U8 | `view.ts#findCount` | no "No match" | red |
| U9 | `view.ts#findCount` | a count past the limit read as a count | red |
| U10 | `view.ts#findCount` | no match in front read as a count | red |
| U11 | `view.ts#findCount` | numbered from the oldest | red |
| M1 | `work-item-view.ts#searchOf` | `highlightLimit: FIND_LIMIT` | red |
| M2 | `work-item-view.ts#find` | the two directions swapped | red |
| M3 | `work-item-view.ts#find` | no `clearDecorations()` at a fresh search | red |
| M4 | `work-item-view.ts#closeFind` | the marks kept | red |
| M5 | `work-item-view.ts#closeFind` | the selection kept | SURVIVED in the first order of A4, red after `75696578` |
| M6 | `work-item-view.ts#giveBack` | the bar kept as its pane leaves | red |
| M7 | `initView`, the field's keys | Escape ignored | red |
| M8 | `initView`, the field's keys | Shift+Enter read as Enter | red |
| M9 | `newScreen`, `focusin` | the pane of the bar's field not put in front | red |
| M10 | `initView`, the bar's `contextmenu` | the press reaches the pane | red |
| M11 | `initView` | "Next match" steps toward the newest | red |
| M12 | `initView` | "Previous match" steps toward the oldest | red |
| M13 | `openFind` | what the field holds not selected | red |
| M14 | `searchOf` | the selection of a search after the pane printed not stored | SURVIVED; the line was removed (departure 6) |
| M15 | `findOptions` | the match in front in `--terminal-ink` | red |
| M16 | `openFind` | the bar not put in the pane's screen | red |
| M17 | `initView` | no "Close" | red |
| M18 | `initView`, the bar's `mousedown` | a press on a button takes the keyboard from the field | red |
| M19 | `menuAct` | "Find…" does nothing | red |
| M20 | `findable` | no pane in front | red |
| M21 | `renderer.ts#onCommandKey` | `find` does nothing | red |
| M22 | `renderer.ts#onCommandKey` | `findNext` steps toward the newest | red |
| M23 | `renderer.ts#onCommandKey` | `findPrevious` steps toward the oldest | red |
| M24 | `renderer.ts#onCommandKey` | `finding` always false | red |

**Built-app files alone (executed).** `terminal-basics.test.ts` passed 32 of 32 at the tree that became `2c371bb5` (exit 0), and again at `75696578` (exit 0). `screenshots.test.ts` without `OWLERY_SCREENSHOTS` passed 7, with 1 skipped (exit 0), so the names of the shots list `night-watch-dark-find.png` and `night-watch-light-find.png`. No run drew the view `find` itself, and phase 3's screenshot run is the first that does.

**The phase boundary's set (executed at `75696578`, with the comment of `#find-bar` in `index.html` reworded in the working tree, which `cf5f148b` commits).** One script ran both commands through the runner of heavy commands.

- `OWLERY_BACKGROUND=1 pnpm run test:app` passed 227 cases in 19 files, with 8 cases and 2 files skipped (exit 0). No link-card case of `terminal-basics.test.ts` failed in it, so the three that failed in phase 1's first batch did not fail here.
- `node scripts/test-in-electron.mjs test/view.test.ts test/themes.test.ts` passed 575 cases in 2 files (exit 0). `themes.test.ts` is in the set because it reads both editions of `docs/design.md` and the modules of `src/renderer`.

**For phase 3.** The bar stands inside a pane's screen, at the top right corner. A path link's card in phase 3 can stand over the same corner. `show.find` in `screenshots.test.ts` expects "1 of 3" for "login" over the pane in front of the work item "Fix the login redirect", from the lines `apps/desktop/test/fixtures/sample-pane.sh` prints. That count was read from the fixture and not run.
