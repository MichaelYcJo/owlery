# Phase 1: 1795343000-background-window-unseen

## What this phase found

**The frame holds on its coordinates.** The work item has no `frame/`, and `routing.md` names the session as the planner, so issue #148's *Done when* is the frame and this record holds the design. The function the spawn named is `apps/desktop/src/main/background.ts#showInBackground`, and its one caller is `apps/desktop/src/main/main.ts:152`, `if (background) showInBackground(win)`, inside `createWindow`, whose window is built with `show: !background` (read, at `8aad06f`). No other code shows the window in the background: `comeForward` in `src/main/forward.ts` returns before `win.show()` where `background` is true, and the `win.show()` at `main.ts:210` does not reset the opacity (read).

**The window is drawn at opacity 0, and not moved to a place no display shows.** `showInBackground` now calls `win.setOpacity(0)` after `setIgnoreMouseEvents(true)` and before `showInactive()`, so the window is never on the screen at another opacity. Opacity keeps the window's size and place, which the built-app cases rely on: `BuiltApp.start` refuses a page that is not 1440 by 900. A place no display shows would depend on the person's arrangement of displays, and on how macOS holds a window's frame on a screen, and it was not tried. Judged against issue #148 *Done when*, first line ("a window at opacity 0, or one placed where no display shows it, while its page still renders").

**At opacity 0 the page stays visible and keeps drawing, and at opacity 1 under the same windows it was hidden and drew nothing, so `backgroundThrottling` is not set.** The probe `apps/desktop/test/test_tmp_occlusion.test.ts` (removed after its run) started the built app at `dd022bb`'s code, uncommitted then, with `OWLERY_BACKGROUND=1`. It read the window server's entry for the app's window with `CGWindowListCopyWindowInfo` (a Swift program in the scratch directory), and read the page through the debugging port. All rows are executed:

| Window | Window server | `document.visibilityState` | Frames in one second | `matchMedia` change events | `Page.captureScreenshot` |
|---|---|---|---|---|---|
| Opacity 0, just after the start | alpha 0, on screen, 1440 by 900 at 240,26 | visible | 145 | fired | the page, as drawn |
| Opacity 0, 5 s later | the same | visible | 145 | fired | the page |
| Opacity 1, set through the main process's inspector | alpha 1, on screen | hidden | 0 | none | a PNG of the same size |

The windows over the app's window were the same kind in all three readings: a Google Chrome window of 1920 by 978 at 0,30 covered all of it but a strip of four points at its top (read from `CGWindowListCopyWindowInfo` with `optionOnScreenAboveWindow`). At opacity 1 the page under that window was hidden and drew no frame, and at opacity 0 it was not. The two change readings at opacity 0 counted 1 and then 4, because the second reading added a second listener and the emulated scheme changed twice. Judged against issue #148 *Done when*, second line ("where it does, the page is kept from throttling"): it does not at opacity 0 on this Mac, so the switch carries no `backgroundThrottling`. The same table says the window that was shown at full opacity was throttled whenever a person's window covered it, which opacity 0 also ends. Whether that holds on another macOS or on GitHub's runner is in `gaps.md`.

**The unit case was seen red against the old function.** The case in `apps/desktop/test/background.test.ts` *showInBackground* was extended in its group, not added beside it: it now expects `setIgnoreMouseEvents true`, `setOpacity 0`, `showInactive`, in that order. Against the old function it failed at `background.test.ts:73` with `- "setOpacity 0"` missing from the calls (executed). `seal mutate` on `src/main/background.ts` with the cases `test/background.test.ts -t showInBackground` (executed, at `dd022bb`):

- `win.setOpacity(0);` removed: red, failing at `background.test.ts:73`, `"setOpacity 0"` missing.
- `win.setOpacity(1)` in its place: red, at the same line, `"setOpacity 1"` received.
- `setOpacity(0)` moved after `showInactive()`: red, the order differs.

No case holds the call at `main.ts:152`. The watcher below holds it for the runs it watched.

**No window of the app was visible during the built-app runs (executed).** A shell loop in the scratch directory listed, four times a second, every window of each app process started from this worktree (`pgrep -f "owlery-wt-148/apps/desktop --remote-debugging-port"`), with the window server's alpha and on-screen state. It ran across six app starts: `theme-controls.test.ts`, `terminal-basics.test.ts`, `notification-click.test.ts`, `pnpm run screenshots`, and the two scenarios of the memory run below. Of 375 samples, 373 read `alpha=0 onscreen=1` at 1440 by 900. The other two read `alpha=1 onscreen=false` at 0 by 0, the window before it is shown. The loop samples every 0.25 s or so and cannot see a single frame. The order of the three calls is what keeps the window off the screen until it is transparent, and the case pins that order. The person's screen itself was not captured, because it showed the owner's own windows.

**The built-app cases and the screenshots pass with the window at opacity 0 (executed, at `dd022bb`, each file alone).**

- `theme-controls.test.ts`: 5 passed.
- `terminal-basics.test.ts`: 25 passed.
- `notification-click.test.ts`: 3 passed. Its page's `Notification` is a recorder, so nothing reaches the system's notifications.
- `memory.test.ts` without `OWLERY_MEASURE_MEMORY`: 29 passed. It starts no app.
- `pnpm run screenshots`, with `OWLERY_SCREENSHOT_DIR` set to the scratch directory: 1 passed, 6 skipped, and eight PNG files. `night-watch-light-view.png` was opened, and it shows the work item's view, its terminal, its question and its seal, drawn as before. The files are not in the tree.

**`measure:memory` reads the same at opacity 0 as at a composited opacity.** `OWLERY_BACKGROUND=1 OWLERY_MEMORY_SCENARIOS=inbox,one OWLERY_MEMORY_RUNS=1 pnpm run measure:memory` passed at `dd022bb` (executed). It drew 144 to 145 frames a second and threw no run away as hidden. The app itself was 142.3 MB for `inbox` and 228.1 MB for `one` at 30 s, with the GPU process at 26.2 and 59.4 MB. The same command run by `seal mutate` with `win.setOpacity(0.01)` in place of `setOpacity(0)` read 142.6 and 236.1 MB, with the GPU process at 26.3 and 63.5 MB (executed, as a probe, so its `SURVIVED` verdict is no finding). A window at 0.01 is composited by the window server like a visible one, so not compositing the window does not move the reading by more than these runs vary. The agent rows of `apps/desktop/measurements/memory.md` read 452.5 MB for `one`, 303.9 MB of it in the GPU process, at 60 frames a second. Those rows were measured at another commit and another refresh rate, and this phase did not measure what makes that difference.

**A person's start is unchanged, by reading only.** `showInBackground` runs only under `if (background)` at `main.ts:152`, and `background` is `takeBackground(process.env)`, true only for `OWLERY_BACKGROUND=1`. No start without the switch was made: it shows a window at full opacity on the owner's screen, which is what the issue asks to stop. `gaps.md` names who answers it.

**The spawn named the checks, and this phase ran those and not the whole phase-boundary set.** The phase-boundary set of `skills/verify/SKILL.md` *Scope: cheap and often, broad and once* takes in every test file that reads a changed path. Every file that starts the built app builds `src/main/main.ts` and `src/main/background.ts`. `apps/desktop/vitest.config.ts` reads those files as the ones that import `buildApp`, and at `dd022bb` they are 14 (executed: the config's pattern run with `grep -lE` over `test/*.test.ts`). The spawn named four files and the screenshots command, one at a time. That narrows the scope, and the narrowing was followed (contract rule 3). The other files that start the app are the broad gate's (`gaps.md`).

**Four statements in the policy documents and the measurements leave the new behaviour out.** None is made false by this phase, but each lists what a background start lacks or does and leaves out that its window is not seen. The crafter does not write them, so the hand-back names them for the orchestrator:

- `docs/architecture.md:384`, and its twin `docs/architecture.ko.md:384`: "With it the window opens without the focus and without a Dock icon, and it ignores the mouse".
- `docs/roadmap.md:29`, and its twin `docs/roadmap.ko.md:29`: "under which the app's window opens without taking the keyboard and without a Dock icon, and ignores the mouse".
- `apps/desktop/measurements/memory.md:37`: "Such a start lacks four things a person's start has". A fifth is now its window on the screen.
- `docs/design.md:487`, and its twin `docs/design.ko.md:487`: the screenshots command "starts it in the background, so the window takes neither the keyboard nor the pointer".

The comments and docstrings that state the rule in code were rewritten in place: `startsInBackground` and `showInBackground` in `src/main/background.ts`, the two comments in `src/main/main.ts` at `:37` and `:126`, and `BuiltApp.start` in `test/built-app.ts`. The census was `git grep` on "pointer through", "shown below", "showInBackground", "without the keyboard" and `OWLERY_BACKGROUND`, outside the earlier work items' records; it is a sample.
