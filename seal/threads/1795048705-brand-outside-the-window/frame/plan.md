# Implementation Plan: the brand outside the window

## Technical context

The tree as read at `68dc407`, which holds issue #18 (merged at `c128acb`) and issue #19.

`apps/desktop/src/main/main.ts` is the Electron main process: `createWindow`, which opens the window with the title bar hidden and inset, and one `app.whenReady()` callback that makes the run folder, registers the IPC handlers of the daemon, the folder dialog and the saved theme, and opens the window. Nothing in it names an icon. `apps/desktop/build.mjs` bundles into `dist/` and copies the page, its stylesheets and the seal's two drawings, `assets/seals/owl.svg` and `assets/seals/owl-icon-cream.svg`. `TRADEMARKS.md` at the top of the tree lists those two drawings and calls each an unchanged file of the AgenticSeal plugin. The window draws them at a seal's place alone and shows no emblem elsewhere. No case imports `src/main/main.ts`, and the tree holds no packager: the app runs as `electron .`.

The emblem's two drawings are files of the owner's main checkout that git does not track (`frame/design.md` *Grounding*, the decision's bullets). The build copies them into the tree.

`README.md` and `README.ko.md` are 26 lines each, with the same headings and the same table. The `Broad gate` of `seal/config.json` compares their counts of heading lines and of table lines.

`docs/name.md` and its Korean edition hold the name's grounds and one open row, the emblem's.

**The failure scenario of the chosen approach.** The committed PNG is a second copy of the full drawing. Where a later work changes `app-icon.svg` and does not run the command of `TRADEMARKS.md`, the Dock shows the old owl and no check says so. The simpler drawing is committed and read by nothing, so a later change to the full drawing that leaves the simpler one behind is seen by nobody until the app is packaged. Once the app is packaged, the bundle's own icon file is a third copy, and the line in `main.ts` that sets the icon at run time is left beside it. In the READMEs, the paragraph that says what the tree's release does today is true for release 0.0.1 and goes stale at the next release unless that release's work edits it.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Commit the canvas's two SVG files unchanged, and one PNG drawn once from the full one, with the command named beside it | The failure scenario above | Chosen. The drawing repeats byte for byte with the same librsvg (`frame/design.md` *Grounding*, the bullet on `rsvg-convert`) |
| Give the Dock one image that holds both drawings, the simpler one at 16 and 32 pixels and the full one at 1024, so that macOS picks by the tile's size | The Dock picks by the display's scale and not by the tile's size: on a display of scale 2 a tile of 59 points showed the 32-pixel drawing enlarged and blurred | Rejected by the probe (`frame/design.md` *Grounding*, the bullet on the three representations) |
| Give the Dock an `.icns` file, which holds a drawing for each size | Electron 45.3.3 loads none: `setIcon` with its path throws, and the Dock keeps Electron's icon | Rejected by the same probe |
| Commit an `.icns` now, built with `iconutil` from the two drawings, for the packager to come | A binary that nothing in the tree reads, which a later change to either drawing leaves stale with no check. `iconutil` builds it in one command on the day a packager needs it | Rejected. The two SVG files and the sentence of `TRADEMARKS.md` on sizes are what the packaging work starts from |
| Package the app, so that the bundle carries both drawings and the name | A packager, its configuration and a signing decision enter under a ticket that names an icon. `docs/roadmap.md` *Open decisions* leaves releases below 0.1.0 open | Rejected as the default. It is the one way the simpler drawing shows, so the choice is the owner's: `frame/questions.md` Q4 |
| Keep the wax seal `owl.svg` as the icon and at the head of the READMEs, as this frame first had it | The product's face is then the seal, which marks a guarantee, and red leaves the seal | Rejected by the owner's decision of 2026-11-19 (`frame/design.md` *Grounding*, the decision's bullets) |
| Draw the icon's owl from `owl-icon-cream.svg` in the tree, and commit no file from the canvas | The seal's owl has lighter lines, two rows of chest marks and feet, so the icon would not be the drawing the owner chose | Rejected (`frame/design.md` *Grounding*, the bullet on the outline) |
| Put the icon's drawings beside the seal's, under `assets/seals/` | The folder, the comment in `build.mjs` and `TRADEMARKS.md` each say its files are the seal's, and the decision keeps the icon apart from the seal | Rejected for a folder of its own, `assets/icon/` |
| Draw the PNG at build time, with a new dependency that reads SVG | A native dependency, its install and its updates, for one file that changes when the emblem does | Rejected |
| Draw the icon at run time, in a hidden window that loads the SVG | A second renderer at every start, counted in the memory issue #9 measures, and Electron's icon in the Dock until the drawing is done | Rejected |
| Keep the command as a script of `apps/desktop/package.json` | It changes the `scripts` object issue #10 adds an entry to, and offers a command the install does not bring the tool for | Rejected for the entry of `TRADEMARKS.md`, which already says where each drawing comes from |
| A function that returns the icon's path, with a case | The case would pin a file name. What can fail is the Dock's drawing and a missing file, and scenarios 1 and 4 show both in the built app | Rejected |
| Edit `docs/name.md` in this pull request, as a work item whose subject is the policy root does | The release's other designs state their rules in `## Rule changes`, and one release then changes `docs/` by two routes. This work's subject is the icon and the READMEs | Rejected. The premise that keeps the route was checked: the settle runs inside release 0.0.1 (issue #25, *Done when*), so the document is settled before `main` receives the release |
| Replace the README's structure: a product page alone, with the table of documents moved to an index at `docs/README.md` | The policy root gains an index, which `seal fold` then checks on every document, under a ticket about the brand. The first work item's frame decided that the README pair's table is the index (`seal/threads/1795005804-v0.1-scope-and-milestones/frame/design.md` *Scope*, out of scope) | Rejected. The structure stays, and its opening, one section and two rows change. The premise was checked: `ls docs/README.md` fails, so the table is the one index |
| Show a screenshot of the window in the READMEs | A picture that each change to the window leaves stale, under a ticket that asks for the emblem and one line | Rejected |

## Phases

Both phases start from this branch as it stands, rebased onto `release/v0.0.1` at `c128acb`, which holds issues #18 and #19.

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 4, inside the limits of items 10 and 11 | Scenarios 2, 3, 5, 6 and 13 executed; scenarios 1 and 4 in one drive of the built app. No case: `frame/design.md` *Grounding*, the bullet on the main process | |
| 2 | *Scope* items 5 to 8, and the first three rows of `## Removes` | Scenario 7 read; scenario 8 executed once; scenarios 9, 10 and 11 executed | |

*Scope* item 9 is built by no phase: its operations stand in `frame/design.md` *Rule changes*, and scenario 12 is the reviewer's reading. Phase 2's commit that adds `changelog.md` carries no version move (*Operational impact*). `gaps.md` *Not done* names the simpler drawing, as *Scope* item 12 states, unless the owner has answered `frame/questions.md` Q4 by then.

## Overlap with the release

Issue #23 (`1795048706-trust-question`, routing alone at `ba22934`) was read by its issue when the frame was first written: it changes what the inbox says of an agent that waits at the trust question, and no file or fact of it meets this work.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| Issue #18, `1795043695-inbox-first-window` (merged into `release/v0.0.1` by PR #37 at `c128acb`) | `README.md` and `README.ko.md`: #18 added one sentence to each licence section, and this work changes the opening, adds a section and changes two rows of *Documents*. `TRADEMARKS.md`, which #18 wrote and this work adds entries to and narrows one sentence of. `apps/desktop/build.mjs`: this work's `copyFile` stands beside #18's. `apps/desktop/src/main/main.ts`: #18 changed `createWindow` and added the saved theme's handlers to the `whenReady` callback, and this work adds the Dock's icon to that callback. The seal's drawings and the page, which #18 wrote and this work leaves as they are (`frame/design.md` *Scope* item 10) | #18 | It merged first, on 2026-11-19, and this branch was rebased onto it. Each file this work changes is read at `68dc407`, with #18's change in it |
| Issue #19, `1795046887-socket-path` (merged into `release/v0.0.1` by PR #33 at `277eb35`) | `apps/desktop/src/main/main.ts`, the `whenReady` callback: #19 rewrote the handler of `Channel.daemon` inside it, and this work adds the Dock's icon above that handler | #19 | It merged first, and `68dc407` holds it. The two changes are different statements of one callback |
| Issue #9, `1795046889-four-terminals-memory` (frame at `2c1f824`, not built when the frame was first written) | No file. Its script measures the memory of the app itself, and this work makes the main process hold one image of 1024 pixels square | #21 | This is the smaller diff and the likelier to be sealed first. Merged first, the icon is inside every number #9 publishes. Merged after, #9's numbers lack it: 4,194,304 bytes where the image is held decoded, the size of its bitmap (`frame/design.md` *Grounding*, the bullet on the image's memory). The owner's new drawing is one image of the same size as the one this row first reckoned, so the reckoning stands |
| Issue #10, `1795046888-korean-input-test` (frame at `e9609e6`, not built when the frame was first written) | No file. Its case starts the built app, which after this work sets the Dock's icon at each start | either | Neither reads what the other writes: the case reads a pane's bytes, and this work changes no pane. The order the orchestrator settles between #10 and #9 stands |

## Operational impact

No dependency is added, and no protocol or IPC channel changes. The tree gains a folder of drawings that are not under the repository's licence, `apps/desktop/assets/icon/`, each listed in `TRADEMARKS.md`. Redrawing the PNG needs `rsvg-convert` on the machine of whoever redraws it, and nothing else does. On macOS the app's Dock tile changes from Electron's icon to the white owl on black once the app is ready. The simpler drawing changes nothing a person sees until the app is packaged. The version does not move: `0.0.1` was moved by the first pull request into `release/v0.0.1`.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-19 | The crafter of every phase runs on Fable 5.2. The sealer's model is decided by the orchestrator when it spawns the sealer | The owner chose that everything run until 22:00 on 2026-11-19 runs on Fable (`routing.md` *Why this way*) | `docs/product.md` *The seal belongs to the product and looks the same everywhere* |
| 2026-11-19 | The name "Owlery" stays (`frame/questions.md` Q1) | The owner's answer, folded in `367bf15` | `docs/name.md` *Open decisions* |
| 2026-11-19 | The app's icon and the READMEs' emblem are drawn from AgenticSeal's wax seal `owl.svg`, not `owl-icon-cream.svg` | The owner judged the icon drawing favicon-like and pointed at the seal made as SVG; folded in `367bf15` | `docs/name.md` *Open decisions*, the *Emblem* row |
| 2026-11-19 | The app's icon and the READMEs' emblem are a warm white (`#f3efe6`) owl on a black rounded square, with no red and no seal; sizes of 32 pixels and under use a simpler drawing; the window's seal stays AgenticSeal's `owl.svg`. This replaces the row above that draws the icon from `owl.svg` (`frame/questions.md` Q2) | The owner's words, in order: "나도 인장과의 차별을 위해 붉은색이나 인장은 뺄까했어 애초에 프로덕트네임도 owelery잖아", then "B에서 흰색으로하자", chosen from the design canvas's "앱 아이콘" page, board "Icon-Chosen" | `docs/name.md` *Open decisions*, the *Emblem* row |
| 2026-11-19 | The simpler drawing shows nowhere in release 0.0.1: this work commits it and names its sizes, and the packaging of the app (issue #78, release 0.1.0) draws it into the icon file (`frame/questions.md` Q4, option 1) | The owner placed packaging in v0.1 ("dmg 패키징은 0.1로 정한거였고"); the reframe's probe showed the Dock of an unpackaged app draws one image at every size | `docs/architecture.md` *Platforms and their order* |
