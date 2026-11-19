# Phase 1: 1795048705-brand-outside-the-window

## What this phase found

**The frame holds.** Checked before the build, at `f48ecc1`: the two drawings outside git have the sizes and the SHA-256 sums `frame/design.md` *Grounding* names (executed: `ls -la`, `shasum -a 256`); no path under `apps/desktop/assets/icon/` existed; `build.mjs`, `main.ts` and `TRADEMARKS.md` read as `frame/plan.md` *Technical context* says; `rsvg-convert` on this machine is 2.58.4, the version the frame's probe ran. Between `68dc407`, the commit the frame read, and `f48ecc1` only the three frame files differ (executed: `git diff --name-only 68dc407 f48ecc1`).

**The committed PNG is the one the frame's probe drew.** `rsvg-convert -w 1024 -h 1024` on the committed `app-icon.svg` gave SHA-256 `7201d3d6…`, the sum *Grounding* names, and a second run into scratch gave the same sum (scenario 3, executed at `7f85f41`). The file is 65,974 bytes, 1024 pixels square, RGBA.

**The scenarios the plan's row names, at `7f85f41`.**

- Scenario 2, executed: after `pnpm --filter @owlery/desktop run build`, `cmp` of `assets/icon/app-icon.png` and `dist/app-icon.png` exits 0.
- Scenario 3, executed: the two SVG files give `d2d4ac2c…` and `3e186ea6…`, and the redrawn PNG's sum equals the committed one's.
- Scenario 5, executed: `git diff --name-only c128acb -- apps/desktop/assets/seals apps/desktop/src/renderer` prints nothing.
- Scenario 6, executed: the `git grep` prints `TRADEMARKS.md` lines 17, 19 and 22, one for each path. Read: the unchanged-file sentence now opens "Each of the two seal drawings".
- Scenario 13, executed: `git grep -n -e 'app-icon-small' -- apps/desktop/src apps/desktop/build.mjs` prints nothing. The same search with `app-icon` over the same paths prints `build.mjs:51` and `main.ts:59`, so the search reads those files.
- Scenario 1, executed once: the built app started with a data folder under `/private/tmp/claude-501/`, and `screencapture -x` took the three displays. The Dock stands on the right edge of the third display. Read by eye in a crop of the app's tile alone: a warm white owl on a black rounded square, with its two ringed eyes, its beak, its row of chest marks, the two side lines and the perch. The black square is told from the dark Dock by its shape and faint edge.
- Scenario 4, executed once in the same drive: with `dist/app-icon.png` removed, the app started, the page answered on the debugging port, the inbox screen was the one not hidden, the status line read "Daemon running, no agent", and the daemon's discovery file was written. The capture of that start shows Electron's own icon on the tile, so the capture of scenario 1 can tell the owl from no icon.

**The `catch` is what keeps the window opening, and that was shown.** The plan's row asks for no case, on the grounds of `frame/design.md` *Grounding*, the bullet on the main process, and none was written. `seal mutate` still ran once over the one unit that adds behaviour, with the missing-icon start as its command: build, remove the PNG from `dist/`, start the app, and pass where the inbox screen is drawn. The baseline passed. With `} catch {` replaced by a `catch` that throws again, the verdict was `red`: no page answered on the debugging port, and the app logged "Failed to load image from path". So without the `try`, a missing file stops the window from opening, as the frame's probe said `setIcon` throws. Judged against the crafter's rule on mutation and `skills/verify/SKILL.md` *2. Able to fail*. The script that ran it stays in scratch and is no case of the suite.

**`app.dock` is read with `?.`.** The frame writes `app.dock.setIcon`. The call is written `app.dock?.setIcon(...)` inside the `darwin` branch, so the line holds whether Electron's types give `dock` as present or as possibly absent. The package's `tsc --noEmit` exits 0 with it.

**`TRADEMARKS.md` does not say the README shows the emblem.** *Scope* item 4 asks what each drawing shows. The entry of `app-icon.svg` says what the drawing is and names no place that shows it, because at this phase's commit no README does. Phase 2 adds the image to the READMEs; whether the entry then names them is that phase's choice, and the frame does not ask for it.

**No test file reads a path this phase changed.** Executed: `git grep` for `build.mjs`, `TRADEMARKS`, `main/main` and `assets/` over `apps/desktop/test` finds only a fixture's path string in `view.test.ts`. The repository has no contribution guide and names no tree-wide test file. So the phase boundary's set is the scenarios above, and no vitest case ran.

**What the drive left.** The app and its daemon were stopped by their recorded PIDs after each start, and the two data folders under `/private/tmp/claude-501/` were removed. Every capture and crop was deleted from scratch, as the spawn asked for the owner's screen.

**For phase 2.** Node.js on this machine is v26.13.1 and pnpm is 10.33.0. Under `electron .` the tile shows Electron's icon until the app is ready, and the system names the app "Electron"; both go with packaging (issue #78).
