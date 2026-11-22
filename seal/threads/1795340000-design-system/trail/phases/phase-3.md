# Phase 3: 1795340000-design-system

## What this phase found

### Whether the frame holds

The frame holds for this phase. Each coordinate it gives was opened at `544125b` and stands. `docs/design.md` and `docs/design.ko.md` each hold one table of the layout's measures and one table for each theme under *Tokens*, 320 token rows in each edition. `apps/desktop/src/renderer/themes.css` holds six blocks, and the page's `:root` in `apps/desktop/src/renderer/index.html` holds the measures. `apps/desktop/test/themes.test.ts` reads the blocks through `BLOCK` and `themeBlocks`, as `trail/phases/phase-2.md` says.

The case was green when it was first run, at `544125b` with the case added. Phase 2 wrote the blocks from the tables by a script, and no value had drifted since. Nothing in the documents or the style had to change.

### Decisions

Each was judged against `frame/design.md` *Scope* item 6 and the row "A theme's value drifts from the document" of its *User scenarios & acceptance*, and against `docs/design.md` *Tokens*.

- **The case finds a table by its shape and its place, not by the words of its heading.** A table of tokens is a run of rows whose first cell is a name that opens with `--` in backticks. The first such table of an edition is the layout's measures, and the three after it are the themes'. The measures' heading is in the edition's own language, so the case does not read it. A theme's heading is its name, which is the same in both editions, and the case holds the three headings equal to the labels of `THEME_CHOICES` in the order of `THEMES`.
- **The columns of a theme's table are read in the order of `APPEARANCES`, and the case does not read the header's words.** The Korean header names the appearances in Korean. A table whose two columns were turned over fails on `--scheme`, whose two values are `dark` and `light` in every theme.
- **A value is compared as text, with no reading of what it means.** `#fff` and `#ffffff` are two values to the case. The document is the source and the style is written from it, so the two hold the same spelling, and a rule that judged two spellings equal would be a second parser of CSS values.
- **The order of rows is not held.** *Scope* item 6 names the properties and their values. A block that held its properties in another order than the table draws the same window.
- **A row of tokens in a form the case cannot read throws, and names the line.** A row with a value outside backticks would otherwise leave the table, and the case would report the block's property as one the document does not name, which is the wrong finding.
- **A row holds exactly one value for the measures and one for each appearance for a theme.** A third value in a row is read by nobody, so the case fails on it and prints the row.
- **Each difference is one line that names the edition, the block and the token.** The scenario asks that the failure "names the token and the block". A line reads `design.md, night-watch dark, --ground: the document says #0f0f10 and the style holds #0f0f11`.
- **`layoutMeasures` is one function that the new case and the case "reads no property that neither its own block nor every theme defines" both call.** The earlier case held the pattern that finds the page's `:root` block inline. Its behaviour is unchanged, and it passed before and after.
- **The `check:` line stands under the first paragraph of *Tokens***, which states the rule the case holds, in both editions.

### Seen red, and the breaks

The case was first run green, so its red comes from `seal mutate`, at `02b3a8b`. The command for each file ran the one case, `pnpm --dir apps/desktop run test test/themes.test.ts -t 'names every property of every block'`, under `OWLERY_BACKGROUND=1`. Every break was red, and none survived.

| File | Breaks |
|---|---|
| `apps/desktop/src/renderer/themes.css` | one value of Night watch's dark block changed by one digit; a property `--undocumented` added to Desk's light block; a property removed from Register's dark block |
| `apps/desktop/src/renderer/index.html` | `--motion` changed; a measure `--undocumented` added to the page's `:root`; `--space-3` removed |
| `docs/design.md` and `docs/design.ko.md`, the same ten in each | a theme's light value changed; a theme's row removed; a theme's row added that no block holds; a measure's value changed; a measure's row removed; a measure's row added; a second value in a measure's row; a third value in a theme's row; the heading `### Desk` renamed; a value written outside backticks |

Eight breaks were then run alone and the failing line of each was read.

- The changed value failed at the last assertion, with `night-watch dark, --ground: the document says #0f0f10 and the style holds #0f0f11` for each edition.
- The added property failed there with `desk light, --undocumented: the style holds it and the document does not name it`, and the added measure with `the page's :root, --undocumented: the style holds it and the document does not name it`.
- The removed property failed there with `register dark, --control-edge: the document names it and the style holds none`.
- The row with a third value failed at the assertion on a theme's rows, and the measure's row with a second value at the assertion on the measures' rows. Each printed the row.
- The renamed heading failed at the assertion on the headings, with `Desks` where it expects `Desk`.
- The value outside backticks failed with the error that names the line.

A row with a value missing is held twice: by the assertion on a row's length and by the comparison, which reads the missing value as empty. No break shows the two apart.

### Runs

- Executed, at `02b3a8b` with a clean tree: `OWLERY_BACKGROUND=1 pnpm run test test/themes.test.ts` in `apps/desktop`. One file, 11 cases, all passed. This is the phase's whole set: the case of the plan's row is in this file, it is the one test file the phase changed, and no other test file reads `docs/design.md`, `docs/design.ko.md` or this file. `git grep` for `design.` and `"docs"` in `apps/desktop/test` found this file alone reading the documents. All 38 test files of the repository are in `apps/desktop/test`, and a search of them for `ls-files` and for a path that climbs to the repository's root found none that reads the whole tree.
- Executed, before the commit: `pnpm exec tsc --noEmit` in `apps/desktop`, exit 0. The repository configures no linter and no formatter.

### What the next phases need

- A change of a value now edits three files in one commit, or the case fails: `docs/design.md`, `docs/design.ko.md`, and `themes.css` or the page's `:root`. Phase 5 changes values only if a mark's shape has to change, and then in all three.
- A property phase 5 adds to a block needs a row in each theme's table of both editions, and a property it removes loses its rows.
- A new table of tokens under another heading of `docs/design.md` would be read as a fourth theme's and fail the case. A table whose first cell is not a token's name in backticks is not read.

Phase 3 closed at `02b3a8b`.
