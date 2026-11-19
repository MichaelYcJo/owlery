# Implementation Plan: the brand outside the window

## Technical context

The tree as read at `611701c`, and issue #18's branch at `6509bae` where a sentence says so.

`apps/desktop/src/main/main.ts` is the Electron main process: `createWindow`, and one `app.whenReady()` callback that makes the run folder, registers the two IPC handlers and opens the window. Nothing in it names an icon. `apps/desktop/build.mjs` bundles into `dist/` and copies the page and its stylesheet; at `6509bae` it also copies `assets/seals/owl-icon-cream.svg`, the one drawing #18 commits, and `TRADEMARKS.md` at the top of the tree lists that drawing. #18 is being reframed to draw its seal from the plugin's `owl.svg`, which no branch holds yet (`frame/design.md` *Grounding*, the fold's bullets). No case imports `src/main/main.ts`, and the tree holds no packager: the app runs as `electron .`.

`README.md` and `README.ko.md` are 26 lines each, with the same headings and the same table. The `Broad gate` of `seal/config.json` compares their counts of heading lines and of table lines. At `6509bae` each has one more sentence in its licence section, and nothing else of them differs from `611701c`.

`docs/name.md` and its Korean edition hold the name's grounds and one open row, the emblem's.

**The failure scenario of the chosen approach.** The committed PNG is a second copy of the seal. Where a later work replaces `owl.svg` and does not run the command of `TRADEMARKS.md`, the Dock shows the old owl and no check says so. The seal is painted with gradients and filters, so another version of librsvg may draw other bytes from the same file, and the entry's version is then the only way to the committed ones. And once the app is packaged, the bundle's own icon file is a third copy, and the line in `main.ts` that sets the icon at run time is left beside it. In the READMEs, the paragraph that says what the tree's release does today is true for release 0.0.1 and goes stale at the next release unless that release's work edits it.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Commit one PNG, drawn once from `owl.svg` with a margin, and name the command beside it | The first paragraph of the failure scenario above | Chosen. The drawing repeats byte for byte with the same librsvg (`frame/design.md` *Grounding*, the fold's bullet on `rsvg-convert`) |
| Commit the plugin's own `.claude-plugin/icon.png` unchanged, which is `owl.svg` drawn at 512 pixels | The seal fills its 512 pixels edge to edge, so its tile stands larger than the tiles beside it, which keep a margin, and it is drawn at twice its size where the Dock magnifies. Neither was seen in a Dock | Rejected for the padded drawing at 1024 pixels |
| Draw the PNG with `resvg_py`, as the plugin draws its icon | It needs a throwaway Python environment, and a second step to add the margin, which resvg's call does not take | Rejected for `rsvg-convert`, which pads the canvas in the one command and drew the seal as resvg did, read by eye |
| Keep the small owl, `owl-icon-cream.svg`, for the Dock's tile, where the wax seal's owl is faint at 128 pixels | The app's face is then the drawing the owner judged to look like a favicon | Rejected by the owner's decision of 2026-11-19. The faintness is written in `frame/design.md` *Grounding* for the owner to judge in the Dock |
| Put the seal on a tile in the window's ground colour | The window's palette is under polish in #18, so the tile is drawn now and again when the palette settles | Rejected as the default. Whether the icon has a tile at all is `frame/questions.md` Q2 |
| Draw the PNG at build time, with a new dependency that reads SVG | A native dependency, its install and its updates, for one file that changes when the emblem does | Rejected |
| Draw the icon at run time, in a hidden window that loads the SVG | A second renderer at every start, counted in the memory issue #9 measures, and Electron's icon in the Dock until the drawing is done | Rejected |
| Keep the command as a script of `apps/desktop/package.json` | It changes the `scripts` object issue #10 adds an entry to, and offers a command the install does not bring the tool for | Rejected for the entry of `TRADEMARKS.md`, which already says where each drawing comes from |
| Package the app, so that the bundle carries the icon and the name | A packager, its configuration and a signing decision enter under a ticket that names an icon. `docs/roadmap.md` *Open decisions* leaves releases below 0.1.0 open | Rejected. Out of scope, and named as a follow-up |
| A function that returns the icon's path, with a case | The case would pin a file name. What can fail is the Dock's drawing and a missing file, and scenarios 1 and 4 show both in the built app | Rejected |
| Edit `docs/name.md` in this pull request, as a work item whose subject is the policy root does | The release's other designs state their rules in `## Rule changes`, and one release then changes `docs/` by two routes. This work's subject is the icon and the READMEs | Rejected. The premise that keeps the route was checked: the settle runs inside release 0.0.1 (issue #25, *Done when*), so the document is settled before `main` receives the release |
| Replace the README's structure: a product page alone, with the table of documents moved to an index at `docs/README.md` | The policy root gains an index, which `seal fold` then checks on every document, under a ticket about the brand. The first work item's frame decided that the README pair's table is the index (`seal/threads/1795005804-v0.1-scope-and-milestones/frame/design.md` *Scope*, out of scope) | Rejected. The structure stays, and its opening, one section and two rows change. The premise was checked: `ls docs/README.md` fails, so the table is the one index |
| Show a screenshot of the window in the READMEs | It fixes the look #18 is still polishing into the first thing a visitor sees | Rejected until the look is settled |

## Phases

Both phases start once `release/v0.0.1` holds issue #18 and this branch has merged it by a merge commit, never by a rebase (*Overlap with the release*).

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 3, and of item 9 the copy of `owl.svg` where #18 merged without it | Scenarios 2 and 3 executed; scenarios 1 and 4 in one drive of the built app. No case: `frame/design.md` *Grounding*, the bullet on the main process | |
| 2 | *Scope* items 4 to 7, and the first three rows of `## Removes` | Scenario 5 read; scenario 6 executed once; scenarios 7, 8 and 9 executed | |

*Scope* item 8 is built by no phase: its operations stand in `frame/design.md` *Rule changes*, and scenario 10 is the reviewer's reading. Phase 2's commit that adds `changelog.md` carries no version move (*Operational impact*).

## Overlap with the release

Issue #23 (`1795048706-trust-question`, routing alone at `ba22934`) was read by its issue: it changes what the inbox says of an agent that waits at the trust question, and no file or fact of it meets this work.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| Issue #18, `1795043695-inbox-first-window` (phases 1 to 4 closed at `6509bae`, a polish phase to come) | `README.md` and `README.ko.md`: #18 adds one sentence to each licence section, and this work changes the opening, adds a section and changes two rows of *Documents*. `TRADEMARKS.md`, which #18 writes and this work adds an entry to. `apps/desktop/build.mjs`: this work's `copyFile` stands beside #18's. `apps/desktop/src/main/main.ts`: #18 changes `createWindow`, this work the `whenReady` callback. The seal's file, `owl.svg`: #18's reframe has its window draw the seal from it, and this work draws the icon from it and shows it in the READMEs. The window's seal, which this work's `## Rule changes` name | #18 | The issue follows #18 by its first line, and the spawn states the order. #18 commits `owl.svg` and its entry of `TRADEMARKS.md`, because its window needs the file first, and this work reads the file where #18 put it. Where #18 merged without it, this work's phase 1 commits it (`frame/design.md` *Scope* item 9). Two copies cannot arise: phase 1 starts from the release branch with #18 merged |
| Issue #19, `1795046887-socket-path` (merged into `release/v0.0.1` by PR #33 at `277eb35`) | `apps/desktop/src/main/main.ts`, the `whenReady` callback: #19 rewrites the handler of `Channel.daemon` inside it, and this work adds the Dock's icon above that handler | #19 | It merged first, on 2026-11-19, while this work waits on #18. The two changes are different statements of one callback, so this branch takes #19 in with the merge of `release/v0.0.1` that starts phase 1 |
| Issue #9, `1795046889-four-terminals-memory` (frame at `2c1f824`, not built) | No file. Its script measures the memory of the app itself, and this work makes the main process hold one image of 1024 pixels square | #21 | This is the smaller diff and the likelier to be sealed first. Merged first, the icon is inside every number #9 publishes. Merged after, #9's numbers lack it: about 4 MB where the image is held decoded, at four bytes for each of its pixels, which nobody measured |
| Issue #10, `1795046888-korean-input-test` (frame at `e9609e6`, not built) | No file. Its case starts the built app, which after this work sets the Dock's icon at each start | either | Neither reads what the other writes: the case reads a pane's bytes, and this work changes no pane. The order the orchestrator settles between #10 and #9 stands |

## Operational impact

No dependency is added, and no protocol or IPC channel changes. The tree gains a drawing that is not under the repository's licence, `apps/desktop/assets/seals/owl-app-icon.png`, listed in `TRADEMARKS.md`, and `owl.svg` beside it where #18 did not bring it. Redrawing it needs `rsvg-convert` on the machine of whoever redraws it, and nothing else does. On macOS the app's Dock tile changes from Electron's icon to the owl seal once the app is ready. The version does not move: `0.0.1` was moved by the first pull request into `release/v0.0.1`.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-19 | The crafter of every phase runs on Fable 5.2. The sealer's model is decided by the orchestrator when it spawns the sealer | The owner chose that everything run until 22:00 on 2026-11-19 runs on Fable (`routing.md` *Why this way*) | `docs/product.md` *The seal belongs to the product and looks the same everywhere* |
| 2026-11-19 | The name "Owlery" stays (`frame/questions.md` Q1) | The owner's answer, folded in `367bf15` | `docs/name.md` *Open decisions* |
| 2026-11-19 | The app's icon and the READMEs' emblem are drawn from AgenticSeal's wax seal `owl.svg`, not `owl-icon-cream.svg` | The owner judged the icon drawing favicon-like and pointed at the seal made as SVG; folded in `367bf15` | `docs/name.md` *Open decisions*, the *Emblem* row |
