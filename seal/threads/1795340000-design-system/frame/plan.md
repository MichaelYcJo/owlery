# Implementation Plan: 1795340000-design-system

This plan names what the build does. The owner answered `questions.md` row Q1 on 2026-11-22: Night watch is the default theme, and Register and Desk are themes a person can choose. The phases below build that answer as `design.md` *Scope* states it.

## Technical context

The tree as read at `0d65470`.

- `apps/desktop/src/renderer/themes.css` holds one block of 66 custom properties for each of two themes, named by role, and `apps/desktop/src/renderer/index.html` lines 10 to 63 hold the layout's measures in the page's `:root`. The page moves between themes by the value of `data-theme` on its `html` (`apps/desktop/src/renderer/theme.ts`).
- `apps/desktop/src/shared/appearance.ts` names the themes and the choices, `src/main/appearance.ts` keeps the choice in `appearance.json` and names each theme's ground for the window's first frame, and `src/preload/preload.ts` puts the theme on the page before it is drawn. `apps/desktop/test/appearance.test.ts` pins the choices, the file and the grounds.
- `apps/desktop/test/themes.test.ts` reads `themes.css` and `index.html` as text and holds the look's rules for every block it finds. A case that reads `docs/design.md` beside them fits the file as it is.
- `apps/desktop/src/renderer/shared.ts#STATE_SHAPES` holds a state's shapes as path data a module draws, and `apps/desktop/src/renderer/view.ts` holds the states' words.
- `apps/desktop/test/built-app.ts` builds the app, starts it in the background and drives its window through the debugging port. The framer's probe captured eleven screens across two themes through it with `Page.captureScreenshot`, in one run of 17 seconds. Executed.
- `apps/desktop/package.json` holds three scripts that run one test file under a variable of the environment: `korean:typed`, `measure:memory` and `role:run`. The screenshot command is a fourth of that kind.
- `apps/desktop/vitest.config.ts` runs each test file that imports `buildApp` one at a time, after the rest of the suite. A screenshot case that imports it joins that group without a change to the configuration.
- The `Broad gate` command of `seal/config.json` fails where a document of `docs/` has no `.ko.md` edition, or where the two editions differ in their count of headings or of table rows.

What three themes in two appearances cost, against two themes today.

- **Blocks.** Six blocks in `themes.css` where two stand, and each gains the properties of `design.md` *Scope* items 5 and 7: an edge under a line, a group's ground, a fact's typeface, and a shape for each part of each state's mark. The file grows from 7.5 kB to about three times that. The probe of `design.md` *Data & interfaces* read no cost of four more blocks in the renderer's footprint above what the process moves by on its own.
- **Tables.** `docs/design.md` holds one table of tokens for each theme, with a column for each appearance, and one for the layout's measures, in each of two editions. That is three tables of ninety rows and one of about fifty, twice.
- **Screenshots.** This pull request carries sixteen images: the inbox and a view for each theme in each appearance, and the menu and the dialog in Night watch's two. At the 0.1 to 0.3 MB the study's captures weigh at 1440 by 900, that is about 3 MB in the work item's directory.
- **Cases.** The token case and the cases that hold the look's rules run over six blocks. The cases of `appearance.test.ts` grow by the three themes, the three choices of appearance, the earlier file's three values and the six grounds.

The failure scenario of the chosen approach, six months on: a person changes a colour of one theme in `themes.css` and the token case fails until `docs/design.md` and `docs/design.ko.md` say the same value, so every change of the look is three edits, and a change that all themes share is three edits in each of three tables. That cost is the intent for a value a person judges, since a change of the look is a change of the policy the review reads screenshots against. It is waste for a value no person judges, such as a terminal's fallback typefaces. Where that waste is felt, the document keeps the tokens a person judges and the case reads the rest from `themes.css` alone.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| The tokens' values stand in `docs/design.md`, in both editions, one table for each theme, and a case fails where a block of `themes.css` or the page's `:root` differs | Three copies of a value, kept in step by a case. A change of a value edits three files in one commit, and the tables run as long as *Technical context* counts. | Chosen, as the orchestrator's decision 4 of 2026-11-22 states it. The issue asks for the document as the source the style sheet follows, a reviewer reads a screenshot against a document and not against a style sheet, and the case makes a silent drift impossible. |
| `docs/design.md` names each token by its role and its rule, and the values stand in `themes.css` alone | One copy of a value. The document cannot answer "is this the right black" without the style sheet open beside it, and a value changes with no change to the policy, so the review has nothing to read the screenshot against. | Refused. It keeps the structure as it stands, a style sheet nobody ratified. The premise that would keep it is that the values are not policy, and the issue says they are. |
| `themes.css` is generated from `docs/design.md` at the build | One copy a person edits. The build gains a parser of Markdown tables, and the Korean edition's table is a second input that the generator must refuse or ignore. | Refused. It replaces a file a person edits with a build step, to save one case of the suite. |
| A theme and an appearance are two choices, and the page carries each as an attribute | Two controls where one stood. A block is selected by two attributes, so a block that is missing for one pair draws a page with no colour. | Chosen. The appearance can follow the system under any theme, and the case that every theme has a block for each appearance holds the missing pair. |
| Six themes in one list, each a theme in one appearance, with a name of its own | One control. Six names to learn, and "Match the system" needs a pair of themes to move between, which a flat list does not give. | Refused. |
| "Night desk" and "Letter" stay as the names of the dark and the light appearance under every theme | Nothing a person knows is renamed. Night watch's light appearance is called a letter and has neither paper nor serif, and a person reads "Night watch, Night desk". | Refused. The names become Desk's history, and the appearances take the system's own words, Dark and Light. |
| Every block is in `themes.css` and loads with the page | The window parses blocks it does not draw. Measured: 15 kB and 7.9 ms for four blocks, and no change of the renderer's footprint above its own movement. | Chosen. |
| One file for each theme, and the page loads the chosen one | The window parses one theme. The preload has to name the file before the first frame, a change of theme swaps a style sheet and can draw a frame with none, and the suite's text cases read three files. | Refused. It replaces one file with three to save a cost the probe did not find. |
| A state's shapes are properties of the theme's block, and the page's paths read them | A theme is its blocks alone, and a change of theme redraws nothing by code. A shape as a property of style is Chromium's, which is what the window runs in; the phone draws its own marks. | Chosen. The probe showed a path take its shape from a custom property in Electron 45.3.3. |
| The module holds a set of shapes for each theme and redraws every mark when the theme changes | It works in any engine. A module then names the themes, a new theme edits a module, and every list on screen is walked at a change. | Refused. It keeps `STATE_SHAPES` where it stands. The premise that would keep it is that a shape cannot be a property, and the probe showed it can. |
| Register keeps the study's columns of a line, a count of commits ahead and an age, with a line as wide as the list | Register reads most like a register. Those are measures of the layout, which no theme changes under the rule of `design.md` *Scope* item 2, and a title loses about 66px. | Refused. Register is drawn with what a theme may change. |
| The sidebar's status line takes Night watch's "2 agents awake", with the rest of its voice | The whole voice of the study's direction B reaches the window. The line stops saying that the daemon runs, and "awake" stands beside "keeping the Mac awake". | Refused, as a change to the orchestrator's decision 2. The two states' words change and the status line stays. |
| The screenshot command is a test file run under a variable of the environment, and its images are committed in the work item's directory and shown in the pull request's body | The images weigh on the repository's history. A work item's directory leaves at the settle, and the history keeps them. | Chosen. The three scripts of `apps/desktop/package.json` already have this form, the images are read at the commit the review reads, and nothing outside the repository has to stay up. |
| A CI job captures the screenshots and uploads them as an artifact of the run | Nothing is committed. An artifact expires, a reviewer downloads an archive to see an image, and the pull request's body cannot show it. | Refused. The review reads the pull request's body and the tree. |
| A person attaches screenshots by hand | Nothing to build. It is the hand check the issue names as the thing to end, and under an unattended run no person is there. | Refused. |
| The screenshot step as a gate that fails a pull request with no images | It catches a forgotten screenshot. It needs a script that decides whether a diff "changes the window", which is a judgment of meaning and not a fact a script reads exactly. | Refused. The rule stands in `docs/design.md` and the review holds it. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 2 and 3 | `docs/design.md` and `docs/design.ko.md` exist, the paragraph of item 2 stands in `docs/product.md` and `docs/product.ko.md`, and the two loops of the `Broad gate` command over `docs/*.md` and `README.md` pass, which the orchestrator runs | 2947bb7 |
| 2 | *Scope* items 4 and 5 | The cases of `apps/desktop/test/appearance.test.ts` on the themes, the choices of appearance, the earlier file's three values and the ground of each pair, each new one seen red; the case that drives the two controls in the built app; the cases of `apps/desktop/test/themes.test.ts` over six blocks; and `git grep -n -e '\[data-theme' -e '\[data-appearance' -- apps/desktop/src/renderer/index.html 'apps/desktop/src/renderer/*.ts'` prints nothing | 690e5ce |
| 3 | *Scope* item 6 | The new case of `apps/desktop/test/themes.test.ts`, seen red with one value of one block changed and with one property the document does not name added | 02b3a8b |
| 4 | *Scope* item 9, the command and the rule in `docs/design.md` | The command exits 0 and writes a PNG for each screen the item names, in Night watch's two appearances, and in every theme where it is asked for all | |
| 5 | *Scope* items 7 and 8 | The cases of `apps/desktop/test/view.test.ts` that pin the two texts, each seen red against the earlier text; the case of `apps/desktop/test/themes.test.ts` that every block defines a shape for each state, seen red with one shape removed; and the screenshots *Technical context* counts for this pull request, made by phase 4's command at this phase's commit, which the review reads against `docs/design.md` | |

Phase 1 stands first because the document is the source the blocks follow, so phase 2 writes each block from the document's table. After phase 2 the window opens in Night watch with the marks as they stand, the speech mark among them, and phase 5 replaces the marks. Phase 4 stands before phase 5 so that phase 5's commit carries the screenshots.

## Overlap with the release

The spawn names no other open work item of the release, and the message that carried the owner's answer names none. `git worktree list` in the main clone shows worktrees for issues #36, #39, #40, #97 and #119, executed, and the framer opened none of them. Phases 2 and 5 edit `apps/desktop/src/renderer/index.html`, `themes.css`, `shared.ts`, `view.ts` and `theme.ts`, and phase 5 changes the texts "Waiting for you" and "No agent", so an open item that edits one of those files, or adds a case that pins one of those texts, meets this work there. The framer writes a row for each such item the orchestrator names.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| | | | |

## Operational impact

- **A window that opened in Night desk or Letter opens in Night watch after the update**, in the same appearance. A person who wants the earlier look chooses Desk. The changelog fragment says both in words a person who uses the app reads.
- **`appearance.json` changes its form.** The app reads the earlier form and writes the new one at the next choice. An earlier version of the app that reads a file of the new form finds a `theme` it does not know and opens in Night desk, as `themeChoice` answers for any value it does not know.
- No new dependency and no variable a person sets to run the app. `apps/desktop/package.json` gains one script for the screenshot command.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
| 2026-11-22 | On the owner's answer to Q1, the orchestrator decided what the answer left open and the framer folded it (`10e45b5`): (1) the theme rule of `docs/product.md` is rewritten in this PR so a theme may change the form of edges, rules and marks, never the layout, the words or the seal's drawing; (2) the words stay one set, taking Night watch's "Needs you" and "Asleep"; (3) each theme has a dark and a light appearance, the earlier choice read as Night watch in the same appearance; (4) every theme's tokens live in `docs/design.md`, held against the CSS by `themes.test.ts`; (5) the speech-bubble mark goes in every theme. The framer kept the word "theme", kept the status line's "Daemon running", and narrowed Register to what a theme may change | The owner's answer of 2026-11-22; the framer's measurement of four more blocks (15 kB, under the renderer's own variation in memory) | `docs/product.md` (the theme rule, rewritten here); the plugin's `skills/implement/fold-and-reframe.md` |
| 2026-11-22 | Fold phase 1: `docs/design.md` is the source of the values (90 properties a block, 12 of them new for the form and 12 for the state marks); the mock-ups are no longer read by the build | The phase 1 crafter's hand-back | the plugin's `skills/implement/orchestration.md` *A decision made after the frame is committed is folded* |
| 2026-11-22 | Fold phase 2: the earlier-choice row's seen-red is read against a mutant, since `night-desk` maps to the first run's choice. The crafter's choices stand as recorded in `trail/phases/phase-2.md` *Decisions*; the alert "The theme could not be saved." stays for a failed save of either control, as *The words* keeps every word but two | The phase 2 crafter's hand-back | the plugin's `skills/implement/orchestration.md` *A decision made after the frame is committed is folded* |
