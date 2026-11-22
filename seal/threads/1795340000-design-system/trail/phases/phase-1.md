# Phase 1: 1795340000-design-system

## What this phase found

### Whether the frame holds

The frame holds for this phase. Each coordinate it gives for the policy text was opened at `ccf894d` and stands: the theme rule is the last paragraph of `docs/product.md` *The seal belongs to the product and looks the same everywhere* (line 67) and of the same section of `docs/product.ko.md`, `apps/desktop/src/renderer/themes.css` holds two blocks of 66 properties, and the page's `:root` in `apps/desktop/src/renderer/index.html` holds 50 measures. `frame/plan.md` *Technical context* says "about fifty" and "about eighty rows", and the tables are 50 rows and 90 rows.

One part of the frame does not give what the phase needs. `frame/design.md` *Data & interfaces* says the build reads each theme's values in `images/mock.html`. The mock-up holds a part of a block's properties, "the part the mock-ups draw with" in its own comment, and draws the forms with selectors that name a direction (`:root[data-d="register"] .line`), which *Scope* item 5 forbids in the app. So the document had to name the properties that carry those forms and give values to the properties the mock-up does not hold. The decisions are below.

### Decisions

Each was judged against `frame/design.md` *The themes* and *Scope* items 2, 3 and 5, and against `docs/product.md`'s theme rule as this phase rewrites it.

- **Where a value comes from.** Desk's 66 standing properties are `themes.css`'s at `ccf894d`, copied by a script that asserts each one. Where `mock.html` sets or inherits a value for Night watch or Register, the document has that value. Where the mock-up holds no such property, the value is made from the theme's own ink at the strength Desk gives the same property. Night watch's are `--pressed`, `--control-hover`, `--control-pressed`, `--main-hover`, `--main-pressed`, `--focus`, `--mark`, `--badge-ink`, `--removed`, `--card-edge`, and in the light appearance `--backdrop` and `--dialog-shadow`. Register's are `--control-hover`, `--control-pressed`, and in the light appearance `--main-hover` and `--main-pressed`.
- **Twenty-four properties are new, so a block has 90.** Twelve carry the forms and colours *Scope* item 5 names: `--font-said`, `--font-fact`, `--line-edge`, `--line-edge-selected`, `--group-ground`, `--group-edge`, `--state-waiting-fill`, `--state-failed-fill`, `--radius-said`, `--said-ground`, `--said-edge` and `--said-edge-waiting`. Twelve are the shapes of *Scope* item 7. In Desk each of the first twelve has the value that draws the window as it stands: `none`, `transparent`, or a `var()` of the property the page reads today.
- **A line's edges are two whole values, not two parts joined.** `--line-edge` is the shadow of a line at rest and `--line-edge-selected` the shadow of the selected line. A page rule that joined two properties, as `box-shadow: var(--selected-edge), var(--line-edge)`, is not valid where either is `none`, which is Desk's and Night watch's value. `--selected-edge` keeps its name and stays the edge of the sidebar's selected item, which has no rule under it in Register.
- **`--font-serif` stays in Night watch's blocks, and nothing in that theme reads it.** `--font-title` and `--font-said` are `var(--font-ui)` there. Every block defines the same names (`apps/desktop/test/themes.test.ts`, "defines the same names in every block").
- **What an agent says has an edge of its own for a work item that needs the person.** The study drew Night watch's yellow edge on a question. A theme's block cannot tell a question from another sentence, so the page reads `--said-edge-waiting` where the work item's state is the waiting one. Night watch's `--radius-said` squares the card's left corners in both cases, so the edge is straight.
- **Register's tab in front carries its rule in `--terminal-strong`, not `--ink-strong` as `mock.html` has it.** A tab in front stands on the terminal's ground, which is dark in both appearances, and the light appearance's strong ink is `#1a1613` on `#1c1815`. This departs from the mock-up's value.
- **Night watch's focus ring and search mark are its inks, not its yellow.** *The themes* gives the yellow to what needs the person: a waiting mark, the edge of a question, a failure. Desk makes its focus from the ochre of a failure, and following that would spend the signal on the keyboard's place.
- **Night watch's light appearance keeps Desk's light values for `--seal-light` and `--seal-blank-light`**, a brown shadow on a neutral page, because the mock-up the owner chose from inherits them.
- **A state's mark is up to four paths.** For each state `--shape-<state>` is a stroked line and `--shape-<state>-fill` a filled part, and the working state has `--shape-working-track` and `--shape-working-turn` beside them. The part that turns is a property of its own so that Register's half-filled box, which has no part that turns, stands still while the motion stays the layout's. The circles and boxes of `mock.html` are written as paths: a circle of radius r as `M(8-r) 8a r r 0 1 0 2r 0a r r 0 1 0 -2r 0z`. Register's empty box is a line in `--state-no-agent`, which is already the faint ink, in place of the mock-up's dimmed line.
- **The token tables hold a token and its values and no description.** *Scope* item 3 gives the columns, and the rows are then the same in both editions. What a name means stands in a list before the tables.
- **The components' table names four parts beyond *Scope* item 3's list**: the main button apart from a button, an icon's button, and what an agent says. Each has a form the page draws today or a token of its own.
- **`docs/design.md` carries `check: apps/desktop/test/themes.test.ts` under *Principles*, and no `check:` line under *Tokens*.** The case that holds a block against the tables is phase 3's, and phase 3 adds its line.
- **The rule of *Scope* item 9 is written now, without a command.** `frame/plan.md` gives the rule to this phase through item 3 and to phase 4 with the command. The section names no command, because none exists at this commit. Phase 4 adds it.

### What the next phases need

- Phase 2 writes each block from the three theme tables of `docs/design.md`, in the table's order. The page reads the twelve new properties of forms and colours where the components' table names them.
- Phases 2 and 5 change the document if a value cannot be built as written, in both editions and in the same commit.
- Until phase 2, `docs/product.md` and `docs/design.md` state three themes and two attributes that the app does not have. The pull request lands whole, so the policy is written first, as `frame/plan.md` *Phases* orders it.

### Runs

Prose only changed, so the row *Prose only* of the plugin's `skills/verify/SKILL.md` table applies: what parses these files is the two loops of the `Broad gate` command and its search for one word.

- Executed, at `2947bb7`'s tree: the loop of the `Broad gate` command over `docs/*.md` and `README.md`, typed alone without `pnpm -r run check`. It printed a line for each of the six pairs and exited 0. `docs/design.md` and `docs/design.ko.md` each hold 15 headings and 363 table lines.
- Executed: `git grep -n -e '도장' -- docs README.md README.ko.md` printed nothing and exited 1.
- Executed: a script read both editions and found the 320 token rows the same in each, no red outside a `--seal-` property by the margin of `themes.test.ts`, and no name that the measure pattern of `themes.test.ts` matches.
- No case is new, so nothing was seen red and `seal mutate` had no unit to break.

Phase 1 closed at `2947bb7`.
