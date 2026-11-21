# Phase 1: 1795263509-open-in-submenu

## What this phase found

### The frame, judged before the build

The frame holds. Each coordinate `frame/design.md` *Grounding* and `frame/plan.md` *Technical context* give was opened at `62c2c3c` and stands as stated: `view.ts#openEntries`, `workItemMenu` and `repositoryMenu`, `menu.ts` whole, `renderer.ts#pressMenu`, the styles under the class `menu` in `index.html`, `openers.ts#openFolder`, and the cases of `test/view.test.ts` and `test/work-item-menu.test.ts`. `seal/follow-up.md` does not exist. No part of the frame was built around.

### Decisions settled while writing the code

Each was judged against `frame/design.md` *Scope*, the item named.

- **Scenario 10 brings the menu to the window's edge with a narrower page.** A line of the inbox ends at the list's edge, at about 850 px of a window 1440 px wide, so a press near the line's right end leaves the submenu room at the menu's right. The first form of the case, which pressed there and nothing more, failed on its own premise. The case now sets the page's width to the press's x plus 100 px with `Emulation.setDeviceMetricsOverride`, checks that the line's right end did not move, presses, and clears the override in a `finally`. The menu then stands at the window's right edge and the submenu at its left. `frame/questions.md` left the choice to the builder.
- **The three opening keys are read in `onKey`.** ArrowRight, Enter and Space on an item that opens a submenu are handled at `keydown` with `preventDefault`, and do not go through the button's own press. A press raised by the keyboard and one raised by the pointer would otherwise have to be told apart in the `click` handler, since only the first moves the keyboard into the submenu (*Scope* items 4 and 5).
- **The keyboard returns to "Open in" whenever the submenu closes while the keyboard is in it.** That covers ArrowLeft and Escape, which *Scope* item 5 names, and the close after the pause where the pointer rests on another item while the keyboard is in the submenu, which the frame does not name. Without it the keyboard would fall to the page's body and Escape would no longer close the menu, the defect the comment on `tabIndex` in `menu.ts` already describes for the menu.
- **Escape with the keyboard in the menu closes the menu and an open submenu together.** *Scope* item 5 gives Escape the meaning "close the submenu alone" inside the submenu. A submenu the pointer opened leaves the keyboard in the menu, and Escape there keeps the meaning it had before this work.
- **"The keyboard moves to another item" is read from `focusin` on the menu.** The submenu closes at once where the element that takes the keyboard is neither the item it opened from nor the menu itself (*Scope* item 5). A press on a rule puts the keyboard on the menu itself and leaves the submenu open, which `gaps.md` *Not done* names.
- **`submenuPlace` never gives a left edge under 0.** Where the window is narrower than the submenu, "moved inside the window" (*Scope* item 7) has no answer that keeps both edges inside, and the left edge is kept.
- **One addition to the styles beyond the mark.** "Open in" keeps the background of the item under the pointer while its submenu is open (`[aria-expanded="true"]`), so the eye finds which item the submenu belongs to once the pointer is in the submenu. *Scope* item 3 asks for the mark alone. No case reads either, and `gaps.md` *Not verified* names both for the hand check.
- **The mark is a corner drawn with two borders, and holds no text.** It is a `::after` of the item with empty `content`, so the item's `textContent` and its accessible name stay the label alone (*Scope* item 3).

### What the cases hold, and how each was seen red

- `executed`: before `view.ts` changed, `node scripts/test-in-electron.mjs test/view.test.ts` failed 11 cases: the seven rewritten ones of `describe("workItemMenu")`, `describe("repositoryMenu")` and `describe("a description on hover")` on the old top-level labels, and the four of `describe("submenuPlace")` with `submenuPlace is not a function`.
- `executed`: before `menu.ts` changed, with `view.ts` already giving the submenu's entry, `node scripts/test-in-electron.mjs test/work-item-menu.test.ts` failed 11 cases. The four new ones failed on `the window never showed the Open in submenu`, and the rewritten ones on the item with `aria-haspopup` that was not there. The other failures of that run followed from a menu the earlier failures left open.
- The existing cases of `test/work-item-menu.test.ts` that read a menu's items read them while no submenu is open, as `frame/plan.md` *Technical context* asks. The constant `SUBMENU` finds the submenu by its `aria-label`, and `OPENER` finds its item by `aria-haspopup`.
- The helper `press` of that file gained one branch: the code `Space` is sent with the key `" "`, which is what a keyboard sends.

### Mutation runs

Each ran through `seal mutate` from `apps/desktop`, after the commit `75aee00`.

- `executed`: `src/renderer/view.ts`, 11 mutants against `test/view.test.ts`, 11 red. Six break `submenuPlace`: each comparison, the fallback inside the window, and each clamp. Five break `openEntries` and its place in `workItemMenu`: the two labels, `divides`, the description, and the entry left out of an archived work item's menu.
- `executed`: `src/renderer/menu.ts`, 22 mutants against `test/work-item-menu.test.ts`, 21 red and one `SURVIVED` in the first batch. The survivor removed the `click` handler of "Open in". The case pressed the item with the pointer coming onto it, so `pointerenter` opened the submenu and the press was never needed. The case gained a press under a pointer that already rests on the item, after the keyboard closed the submenu (commit `d0e17a8`), and the mutant then read `red` on `the window never showed the Open in submenu`.
- `executed` at `d0e17a8`: the batch prints each mutant's verdict and not the line its cases failed at, so the same 22 mutants were run again one command each, and the failing case and line of each was read. All 22 read `red`, each at the assertion of the guard it breaks. Two break the use of `submenuPlace` and fail scenario 10's case at the submenu's right edge and at its top. Five break the pointer's rules and fail scenario 8's case: the pause set to 0, the pause never started, the pause not stopped at the submenu, no opening at the pointer, and no opening at the press. Eleven break the keys and the keyboard's place and fail scenario 7's case: each of the three opening keys, ArrowLeft, Escape closing the menu from inside the submenu, the close at the keyboard's move to another item, the keyboard's return to "Open in", the keyboard's move to Finder, the arrows read over the wrong element, and each of the two writes of `aria-expanded`. The other four fail on a press inside the submenu closing it, on `closeMenu` leaving the submenu in the page, on an item of the submenu that a press does nothing to, and on `aria-haspopup`.
- No mutant was run over `index.html`. No case reads the styles.

### The phase boundary

- `executed` at `d0e17a8`: from `apps/desktop`, `node scripts/test-in-electron.mjs test/view.test.ts test/work-item-menu.test.ts test/themes.test.ts` exits 0, 3 files and 411 cases. The first two are the plan row's. `test/themes.test.ts` reads `index.html` and every file of `src/renderer/` from disk, so it is the file that globs the directory this phase changed.
- `executed`: `tsc --noEmit` in `apps/desktop` exits 0. It is the typecheck of the files each commit changed, run before the commit, and the package has no narrower form of it. The repository configures no linter and no formatter.
- The other test files that start the built app load the page this phase changed and were not run. The spawn narrowed the run to the plan's cases, and `gaps.md` *Not verified* names them with the broad gate as their answerer.

### The census of the old spelling

- `executed`: `git grep -n -e 'Open in Finder' -e 'Open in \${' -- apps docs README.md README.ko.md` at `d0e17a8` prints three lines, each of a link's card, which `frame/design.md` *Scope* leaves out: `src/renderer/view.ts:971`, `test/terminal-basics.test.ts:765` and `test/view.test.ts:2289`. The same pattern printed the lines of `openEntries` and of the menus' cases at `62c2c3c`, so the search can find what it looks for.
- `executed`: `git grep -n -i 'open in' -- docs README.md README.ko.md` prints no sentence about a menu. The policy root states nothing this phase reworded.
