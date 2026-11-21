# Implementation Plan: the Open in submenu (#109)

## Technical context

The tree as read at `89a2073`.

- **What a menu holds** is a function of `apps/desktop/src/renderer/view.ts`. `openEntries` (`view.ts:1074`) gives the items that open a folder, `workItemMenu` (`view.ts:1091`) and `repositoryMenu` (`view.ts:1127`) place them, and `MenuEntry` (`view.ts:1065`) is the shape of each. The cases of `apps/desktop/test/view.test.ts:431-520` hold them without the app.
- **How a menu is drawn** is `apps/desktop/src/renderer/menu.ts`: one open menu in `shown`, its keys in `onKey`, the press outside it in `onPress`, its place in the last lines of `openMenu`. `renderer.ts:484` and `renderer.ts:491` are its only callers, and `renderer.ts#pressMenu` does what a pressed item's action says. The menu's styles stand in `apps/desktop/src/renderer/index.html:379-387`.
- **How the menus are held in the built app** is `apps/desktop/test/work-item-menu.test.ts`. It reads the items of a menu with `[role="menu"] [role="menuitem"]`, which reads the items of an open submenu too, so a case that reads a menu's items reads them while no submenu is open, and a case of the submenu reads it by its `aria-label`.
- **Constraint: the owner's running app.** The owner runs the built app from the main clone, `/Users/yc/Documents/GitHub/owlery`, for the hand check of issue #24. The work is built in the worktree `/Users/yc/Documents/GitHub/owlery-wt-109` alone, and nothing is run or written in the main clone. The worktree holds no `node_modules` at `89a2073`: `pnpm install --frozen-lockfile --offline` from its root comes first.
- **Constraint: no case opens a folder that stands.** A press of an "Open in" item on a folder that stands opens Finder or an app on the desktop of whoever runs the suite. Scenario 9's case presses one only after it moved the folder aside, where `apps/desktop/src/main/openers.ts#openFolder` answers before it reaches Finder.
- **The failure scenario of the chosen approach.** `menu.ts` learns one submenu of one level, by hand. A second entry with `opens` in one menu works, since the code holds whichever submenu is open, but a submenu inside a submenu does not: the type refuses it, and whoever wants one rewrites the keys and the place. The keyboard's rules of a submenu are the window's own to hold, and a rule this frame missed is a defect only a person finds, as the earlier menu work said of the menu itself. The cases find the submenu by the `aria-label` "Open in", so the work of issue #108, which puts the window's words in another language, changes that locator with the label.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| **Keep `menu.ts` and its one flat menu, and add one level to it, chosen** | Stated above: a deeper menu needs a rewrite of the keys and the place | Chosen. The premise that keeps the structure is that the menus need one level and no more. Checked: each caller of `openMenu` named in *Technical context* opens a menu whose only growing part the issue names is "Open in", and the issue asks for one submenu |
| Replace `menu.ts` with a menu of any depth, where an entry's `opens` holds entries that open further | Keys, focus and placement are written for depths no menu has, and each rule nobody exercises is a defect only a person finds | Rejected. Nothing in the tree or the issue asks for a second level |
| Replace the drawn menu with the system's, whose submenus Electron draws | The debugging port cannot open or read it, so no case reaches an item | Rejected by `seal/threads/1795152521-work-item-menu/frame/plan.md` *Alternatives considered*, and not argued again |
| "Open in" unfolds in place, its items shown under it in the same menu | No place to compute, but the menu grows as long as it is at `89a2073` once unfolded, and the issue's conditions name a submenu, which the owner chose | Rejected |
| An entry with the action `{ do: "submenu" }` in place of a second shape | `pressMenu` gains a case that does nothing, and the type lets an item of a submenu open another | Rejected for `opens`, which the type keeps to one level |
| The submenu's element inside the menu's element | `menu.ts#items` reads every `menuitem` under the menu, and the menu is a column of its children, so the arrows and the layout each need an exception for the nested element | Rejected for a second element in `document.body`. `onPress` and `closeMenu` then name both elements, which is the cost of the chosen way |
| The submenu closes at once when the pointer comes onto another item | The submenu opens beside "Open in" and runs below it, so a pointer that goes from the item to a lower item of the submenu crosses the menu's next items, and the submenu closes under it | Rejected for the pause of *Scope* item 4. `work-item-view.ts` already waits `CARD_LEAVE_MS` before a link's card leaves, for the same reason |
| The submenu's place computed inside `menu.ts` | Only a case of the built app could hold it, and that case needs a menu at each edge of a window | Rejected for `view.ts#submenuPlace`, which the cases of `view.test.ts` hold with numbers. One case of the built app holds that `menu.ts` uses it |
| "Open in Finder" as an item of its own where no app is installed, and the submenu only where one is | The menu's shape changes on the same Mac between the window's load and the main process's answer, since `held.apps` is empty until then (`renderer.ts:1428`) | Rejected. The issue's first condition asks for one "Open in" item |
| The submenu's items labelled "Open in Finder" and "Open in <app>" | Each item repeats the words of the item that opened it | Rejected. The issue says the submenu "lists Finder, then each installed editor, then each installed terminal" |
| A rule between Finder, the editors and the terminals in the submenu | A rule the issue does not ask for, and none stands between them at `89a2073` | Rejected |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1 to 9 of `frame/design.md` | Scenarios 1 to 5 as cases of `apps/desktop/test/view.test.ts`, and scenarios 6 to 10 as cases of `apps/desktop/test/work-item-menu.test.ts`, each new case seen red before its code. From `apps/desktop`: `node scripts/test-in-electron.mjs test/view.test.ts test/work-item-menu.test.ts` exits 0. The full suite, the typecheck and the broad gate are the orchestrator's | `d0e17a8` |

The order inside the phase: the entries and `submenuPlace` in `view.ts` with their cases first, then `menu.ts` and the styles with the cases of the built app.

## Overlap with the release

The spawn names no other open work item of the release. It names issue #108, the window's language, as out of scope: #108 has no milestone, no branch and no frame, and no pull request is open (`frame/design.md` *Grounding*). Its work will meet this one at the labels and descriptions of `view.ts#openEntries` and at the `aria-label` the cases find the submenu by, and whoever frames it reads this work merged.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|

## Operational impact

No migration, no environment variable, no dependency and no compatibility break. The daemon's protocol and its stored files are not touched, so a daemon of an earlier build serves the window as before. This pull request moves no version.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-21 | Fold phase 1's four departures into `frame/design.md` *Scope*: the keyboard returns to "Open in" wherever the submenu closes while the keyboard is in it (item 5); Escape with the keyboard in the menu closes the menu and an open submenu together (item 5); `submenuPlace` keeps the left edge at 0 where the window is narrower than the submenu (item 7); "Open in" keeps the hover background while its submenu is open (item 3). The orchestrator folds them and spawns no framer | The crafter's hand-back and `trail/phases/phase-1.md` *Decisions settled while writing the code* name each, with the defect the first avoids (the keyboard falling to the page's body, where Escape no longer closes the menu). They record what the build chose, not what the work is | the plugin's `skills/implement/orchestration.md` *A decision made after the frame is committed is folded* |
