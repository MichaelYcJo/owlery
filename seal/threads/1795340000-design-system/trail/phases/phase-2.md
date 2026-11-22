# Phase 2: 1795340000-design-system

## What this phase found

### Whether the frame holds

The frame holds for this phase. Each coordinate `frame/plan.md` *Technical context* and `frame/design.md` *Data & interfaces* give for the code was opened at `d265adc` and stands: `apps/desktop/src/shared/appearance.ts`, `src/main/appearance.ts`, `src/preload/preload.ts`, `src/renderer/theme.ts`, the two blocks of `src/renderer/themes.css`, the control `#theme` in `#theme-control`, and the eight cases of `test/themes.test.ts`. The three theme tables of `docs/design.md` each hold 90 rows with the same names in the same order, and the token rows of `docs/design.ko.md` are the same lines. A script asserted both before it wrote a block.

One sentence of the frame cannot be met as written. `frame/design.md` *User scenarios & acceptance* asks for a case for each of the three earlier values, "seen red against a reader that answers the first run's choice for them". The earlier value `night-desk` is read as Night watch in the dark appearance, which is the first run's choice, so its case is green against that reader. Its red comes from a break of its own, below.

Nothing in `docs/design.md` had to change. Every value was built as the tables give it.

### Decisions

Each was judged against `frame/design.md` *The names, and how a person chooses* and *Scope* items 4 and 5, and against `docs/design.md` *The themes*, *Tokens* and *Components and their states*.

- **What a person chooses is one value of two parts.** `LookChoice` is `{ theme, appearance }`, where the appearance is `dark`, `light` or `system`, and `lookChoice` reads a value from the file or from the page as one. `appearanceFor` gives the appearance the page carries. The earlier `ThemeChoice`, `themeFor` and `themeChoice` are gone with the model they named.
- **A value of neither form is the first run's choice whole.** A file whose `theme` is known and whose `appearance` is not, or the other way round, is read as Night watch in the dark appearance, and neither part is kept. *The names, and how a person chooses* says "a file that holds neither form, and no file, is Night watch in the dark appearance".
- **A value whose `theme` is one of the three earlier values is the earlier form, whatever else it holds.** The app never wrote an `appearance` beside one of those values, so such a file is not one of the new form.
- **Every block holds all 90 properties, and 76 of them are read**, by the page's style, by a module or by another property of the block. `themes.css` is written from the three tables by a script, in the tables' order, so phase 3's case finds each block equal to its table. The twelve `--shape-*` properties, `--state-waiting-fill` and `--state-failed-fill` are defined and read by nothing: the marks are still the module's shapes, the speech mark among them, until phase 5 draws them from the block. The case "reads no property that neither its own block nor every theme defines" holds the other direction alone, so nothing fails on a property no rule reads.
- **Desk's two blocks are the two earlier blocks.** A script compared the 66 properties of `night-desk` and `letter` at `d265adc` with Desk's dark and light blocks and found no value changed. Each has 24 more names.
- **The group's head that takes `--group-ground` and `--group-edge` is the head of a group of the inbox's list**, `.lines h2`, which holds the group's name and its count as *Components and their states* describes it. The heading of a named group under a repository in the sidebar, `.group-head`, is not that part and is unchanged.
- **Every count and every age is in `--font-fact`**: a line's age, a group's count, the sidebar's counts and a commit's age. The page has one rule for `.count` and `.age`, and *The themes* gives Register the fixed-width face for "every fact a person compares down a list".
- **A line reads `--line-edge` at rest and `--line-edge-selected` where it is selected**, each a whole shadow, as phase 1 decided. `--selected-edge` is now read by the sidebar's selected item alone.
- **What an agent says takes its waiting edge from a class.** `stateSays` answers `waiting` beside the head and the text, `detail` in `shared.ts` writes the class `waiting` on the card, and the page reads `--said-edge-waiting` there. `stateSays` already decided between "asks" and "said" on the same fact.
- **The second control is `#appearance` in `#appearance-control`, after the theme's control.** Its icon is a sun, a circle with eight rays, and the theme's control keeps its icon. The frame names the form of the control and no icon. Its title reads "Appearance: Dark", as the theme's reads "Theme: Night watch".
- **The page's markup carries the first run's theme and appearance**, as it carried `night-desk` before, and a case of `test/themes.test.ts` holds the two attributes equal to what `lookChoice` answers for no file.
- **The notice "The theme could not be saved." stays as it is**, where the choice of an appearance was not saved too. *The words* changes two texts and says that every other sentence of the window stays.
- **Two cases are new beyond the plan's row.** `docs/design.md` *Principles* item 5 says that no selector of the page and no module of the renderer names a theme or an appearance, under `check: apps/desktop/test/themes.test.ts`, and no case held it. The case "names no theme and no appearance in a selector of its style or in a module" does: it is the search of the plan's row, and a search of the modules for a theme's or an appearance's name in quotes. The built-app file has a fourth case that reads the form of a selected line, a group's head and a count in Desk and in Register, since nothing else fails where the page stops reading one of those properties.

### Seen red, and the breaks

The new cases of `test/appearance.test.ts` were run against the code of `d265adc` before any of it changed: 16 of 18 failed, and the two that passed are the cases on a failed rename and a failed write, whose behaviour did not change. Against a reader with no reading of the earlier form, the cases of `letter` and `system` failed and the case of `night-desk` passed, for the reason above.

The cases of `test/themes.test.ts` over six blocks were run against the two blocks of `d265adc`: the cases on the blocks' names, on the seal's red and on the count of blocks failed. The three cases of `stateSays` in `test/view.test.ts` failed before `waiting` was answered.

The case that names no theme, the case of the markup's attributes and the built-app cases were first run green, so each has its red from `seal mutate`, at `51fb60e`. Every break below was red, and none survived.

| File | Breaks | Cases |
|---|---|---|
| `src/shared/appearance.ts` | each of the three earlier values read as another appearance; the system's appearance turned over; one known part taken for two; the first run's appearance; a theme's label; an appearance's label | `test/appearance.test.ts` |
| `src/main/appearance.ts` | two grounds changed by one digit; the file written without its appearance; the system's appearance turned over at start | `test/appearance.test.ts` |
| `src/renderer/view.ts` | `waiting` answered for a working agent | `test/view.test.ts`, the cases of `stateSays` |
| `src/renderer/index.html` | a rule that opens `:root[data-theme="register"]`; a rule that opens `[data-appearance="light"]`; each of the markup's two attributes changed | `test/themes.test.ts` |
| `src/renderer/theme.ts` | a theme's name in quotes; an appearance's name in backticks; a selector `[data-theme]` in a module | `test/themes.test.ts` |
| `src/renderer/themes.css` | a block for an appearance that does not exist; a block with no appearance | `test/themes.test.ts` |
| `src/renderer/theme.ts` | each of the two attributes not set; the choice not saved; the terminals not told; the system's turning not heard; each control's change not heard | `test/theme-controls.test.ts` |
| `src/preload/preload.ts` | each of the two attributes not set before the page's module runs | `test/theme-controls.test.ts` |
| `src/main/main.ts` | the window opened on another ground; the saved choice not handed to the preload | `test/theme-controls.test.ts` |
| `src/renderer/index.html` | a selected line reading the sidebar's edge; a group's head with no ground and no edge; a count with no typeface of its own | `test/theme-controls.test.ts` |

For the cases that assert something is not named, and for one break of each built-app guard, the break was run alone and its failing line read. The planted selector failed at the assertion on the page's style, the planted name at the assertion on the modules, and the changed attribute at the assertion on the markup. The preload's break failed where the case reads the attributes at the start of the page's body, with `[ 'desk', 'dark' ]` where it expects `[ 'desk', 'light' ]`.

### What only trying showed

- **The preload's write is not seen from the loaded page.** The page's own module puts the same two attributes on the root when it starts, so a case that reads them after the load passes with the preload's lines removed. The case has the new page note its attributes when its body begins, through `Page.addScriptToEvaluateOnNewDocument`. The debugging port runs such a script only after `Page.enable`: without it the note was never made.
- **A page loaded again opens on a list, with no terminal.** The case reads a terminal's ground in its second case, before the reload.
- **A terminal's ground is read from the page.** xterm writes the theme's ground on `.xterm-scrollable-element` as its `background-color`, so the case compares it with `--terminal-ground` of the block in use.
- **The built-app file runs in about two seconds**, so a break of it costs as little as a break of a unit.

### Runs

- Executed, at `51fb60e` with a clean tree: `OWLERY_BACKGROUND=1 pnpm run test` over the 17 test files of `apps/desktop/test` that import a module this phase changed, read `index.html` or `themes.css`, or start the built app. 16 files passed and one was skipped, `role-session.test.ts`, which runs nothing without its variable. 577 cases passed and 2 were skipped. The files that start the built app ran one at a time, as `vitest.config.ts` orders them.
- Executed, at `690e5ce` with a clean tree: the four test files that read the two paths the last commit changed, which are comments in `themes.css` and in `work-item-view.ts`: `themes.test.ts`, `appearance.test.ts`, `theme-controls.test.ts` and `terminal-basics.test.ts`. All 57 cases passed.
- Executed, at `690e5ce`: `git grep -n -e '\[data-theme' -e '\[data-appearance' -- apps/desktop/src/renderer/index.html 'apps/desktop/src/renderer/*.ts'` printed nothing and exited 1. The search can fail: the same pattern finds six lines in `themes.css`, and the planted rule above turned the case that holds it red.
- Executed, before each commit: `pnpm exec tsc --noEmit` in `apps/desktop`, exit 0. It reads the package whole, because the compiler has no narrower form here, and it is not the broad gate's typecheck.
- Executed, once, as a probe `test_tmp_forms.test.ts` that is no longer in the tree: the built app drew a line, a selected line, a group's head, a count and the two cards of what an agent says, and the page's style was read for each in the six pairs. In each pair the ten properties of form resolve to what `docs/design.md` names: Register's rule under a line and its strong rule at the left of the selected one, its band on the sidebar's ground, its fixed-width count and its card between two rules; Night watch's yellow edge on the waiting card with its left corners square; and in Desk and Night watch no edge on a line and no ground under a group's head.

The worktree had no installed modules. `pnpm install --frozen-lockfile` made them, as each sibling worktree has its own.

### What the next phases need

- Phase 3's case reads the blocks through `BLOCK` and `themeBlocks` of `test/themes.test.ts`, which now name a block as `night-watch dark`.
- Phase 5 reads `--shape-*`, `--state-waiting-fill` and `--state-failed-fill` in the page, and removes `STATE_SHAPES` with the two comments that name a speech mark, in `apps/desktop/src/renderer/shared.ts` and in the page's style over `.state-icon`.
- A case that needs the window in a pair sets the two controls as `test/theme-controls.test.ts` does, or the two attributes on the page's root.

Phase 2 closed at `690e5ce`.
