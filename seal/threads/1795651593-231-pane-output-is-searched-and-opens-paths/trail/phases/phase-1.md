# Phase 1: 1795651593-231-pane-output-is-searched-and-opens-paths

## What this phase found

**The frame held for this phase's *Scope* items 1 to 5, with the departures below.** Its coordinates were opened at `ad42fe45` before the build, and each stood where the frame says:

- `scrollback: 1000` in `newScreen` of `apps/desktop/src/renderer/work-item-view.ts`;
- the `bufferChars` option of `DaemonOptions` and its one use in `apps/desktop/src/daemon/daemon.ts` (`:326`, `:2436`);
- the sentence that a disk log "comes later" in `apps/desktop/src/daemon/buffer.ts:37-38`;
- `sign-in-pane.ts:35`;
- the row "The Machine dialog" at line 457 of `docs/design.md` and `docs/design.ko.md`.

**The scrollback is a cap of the Machine dialog's kind, and its row stands after "Panes side by side".** `Cap` gains `"scrollback"`. `CAPS` in `apps/desktop/src/daemon/machine.ts` gives it after the panes, and the limit on heavy commands stays last, as that list's comment already said of it. `LimitsStore` keeps it under the key `scrollback` beside the caps, and `capRefusal` in `apps/desktop/src/shared/machine.ts` refuses a value outside 1,000 to 50,000 with "The scrollback is a whole number from 1,000 to 50,000." The grounds are `frame/design.md` *Data & interfaces* and `docs/architecture.md` *Memory design*, "The limits Owlery keeps are defaults read from the person's machine, which the person sees and changes".

**`Machine.scrollback` is optional.** A daemon of an earlier build sends none. `paneScrollback` in `apps/desktop/src/renderer/view.ts` then gives 1,000, and `machineDialog` draws no row. This follows `docs/architecture.md` *What a session survives*, "the window reads a field the daemon does not send as a feature that is off".

**A daemon given no reader of the machine keeps 256 characters for each of 5,000 lines, while its window keeps 1,000 lines.** Such a daemon sends no `machine`, so the window takes `SCROLLBACK_WITHOUT_DAEMON`. The daemon's `outputLimit()` reads `LimitsStore`, which holds no value there, and falls back to `SCROLLBACK_DEFAULT`. The daemon keeps more than that window draws, and nothing is lost by it. `frame/design.md` names no other value for this case.

**A scrollback changed after a terminal stands reaches that terminal.** `showScrollback` in `work-item-view.ts` sets `term.options.scrollback` on each terminal of the pool. `renderer.ts` calls it at `ready` and at each `machine`. B2 of `frame/design.md` asks that "each terminal of the pool holds 20,000 lines", and a terminal made before the change would otherwise keep the value it was made with.

**Departure 1: the built-app case reads the lines a terminal holds, not `term.options.scrollback`.** B1 of `frame/design.md` names a built-app case that reads `term.options.scrollback` of a pane on the stage. The page holds its terminals in a module scope that the case cannot reach through CDP, and the window exposes no such value. The case *holds 5,000 lines of history in a pane's terminal…* of `apps/desktop/test/terminal-basics.test.ts` prints 6,000 numbered lines. It then reads what the terminal holds through the pane menu's "Select All" and "Copy". It asserts at least 5,000 lines and fewer than 5,000 plus the screen's rows, ending at `line-6000`. The same case has a second client set the scrollback to 1,000 and reads the fewer lines again, which is B2's terminal half. This reads the behaviour the option produces, which the option's value alone would not show.

**Departure 2: scenario B3 holds in a unit case only.** `frame/design.md` B3 names `machine-dialog.test.ts` beside the unit case. The built app starts its own daemon from the same tree, so no case of that file can meet a daemon that sends no scrollback unless a stand-in daemon is written for it. The unit case *draws no scrollback row against a daemon of an earlier build* in `view.test.ts` reads `machineDialog`, the function the dialog draws from. `gaps.md` `## Not done` holds this.

**Departure 3: the daemon's method was renamed so the plan's census holds.** The first build named the daemon's private method `bufferChars()`. With that name, `git grep -n -e 'bufferChars' -- apps/desktop` printed three lines, where `frame/plan.md` Phase 1 *Verified by* asks for none. `ddd31892` renames the method `outputLimit()`. The search now prints nothing (exit 1, executed). The same search at `ad42fe45` printed `daemon.ts:326` and `:2436` (executed), so it can find what it looks for. `git grep -n -e 'scrollback: 1000' -- apps/desktop/src` prints `apps/desktop/src/renderer/sign-in-pane.ts:35` and no other line (executed).

**Q2: a shell pane of 3,000 short lines took a key 54 to 65 ms after the click that brought it back (executed).** The case *holds again the 3,000 lines…* of `terminal-basics.test.ts` timed it on three runs of that file, at 65, 56 and 54 ms. A screen that comes back sends no typed key until its terminal has drawn the replay (`screenTurns`, `apps/desktop/src/renderer/view.ts`). The case sends a key every 25 ms from the click on, and stops at the first one the pane's process receives. So the time includes up to 25 ms of the case's own pacing. It is the time of short lines from a shell. A Claude Code pane after a long turn is not measured, and `gaps.md` names who answers it.

**Seen red.**

- The first unit run against the cases before any source was written failed 25 cases and passed 55, with 902 skipped (executed, exit 1). The B1 daemon case read "expected 262144 to be 1280000". The OutputBuffer case read "buffer.setLimit is not a function". The `machine.test.ts` and `view.test.ts` cases failed on the scrollback they expected and did not get.
- The built-app cases were shown red by the mutations below, run after the commit that added them. With `scrollback: 1000` back in `newScreen`, B1 and B4 of `terminal-basics.test.ts` failed. Without the call to `showScrollback` at `machine` in `renderer.ts`, B1 failed on "expected 5053 to be less than 1054", which is the terminal that kept 5,000 lines after the daemon said 1,000. Without the scrollback row in `machineDialog`, both Machine dialog cases that name the row failed.

**Mutations, each through `seal mutate` after the commit it names, each red (executed).** Mutations 1 to 18 ran after `ddd31892`, and 19 to 21 after `717df5f7`. Mutation 17 ran a second time after `717df5f7`, against the built-app Machine dialog cases.

| # | File | Mutant | Cases |
|---|---|---|---|
| 1 | `src/shared/machine.ts#capRefusal` | the bounds replaced by `value >= 1` | `machine`, `view` and `daemon` tests, `-t 'scrollback\|states the reading in one sentence, and gives each cap'` |
| 2 | `src/shared/machine.ts` | `SCROLLBACK_LEAST` 900 | the same |
| 3 | `src/shared/machine.ts` | `SCROLLBACK_DEFAULT` 4000 | the same |
| 4 | `src/shared/machine.ts` | `SCROLLBACK_WITHOUT_DAEMON` 5000 | the same |
| 5 | `src/shared/machine.ts#CAP_NAMES` | the label "Scrollback" | the same |
| 6 | `src/shared/machine.ts#scrollbackSays` | "keeps up to" made "keeps" | the same |
| 7 | `src/shared/machine.ts` | `CHARS_PER_LINE` 262 | `daemon.test.ts -t scrollback`, failing on "expected 1310000 to be 1280000" |
| 8 | `src/daemon/machine.ts#CAPS` | the scrollback left out | `machine` and `daemon` tests, `-t 'scrollback\|OutputBuffer\|the caps a person set\|sends in .ready. what it read'` |
| 9 | `src/daemon/buffer.ts#setLimit` | no drop after the size is set | the same |
| 10 | `src/daemon/buffer.ts#setLimit` | the size not set | the same |
| 11 | `src/daemon/daemon.ts` | no `setLimit` of the live buffers in `setCaps` | the same |
| 12 | `src/daemon/daemon.ts#machineNow` | no `scrollback` sent | the same |
| 13 | `src/daemon/daemon.ts#outputLimit` | the value set ignored | the same |
| 14 | `src/daemon/daemon.ts` | a new pane's buffer at the default whatever is set | the same |
| 15 | `src/renderer/view.ts#paneScrollback` | the value set ignored | `view.test.ts -t 'scrollback\|machineDialog'`, with 16 to 18 in one run |
| 16 | `src/renderer/view.ts#paneScrollback` | a machine without scrollback read as one with it | the same |
| 17 | `src/renderer/view.ts#machineDialog` | the scrollback row never drawn | the same, and `machine-dialog.test.ts -t 'scrollback\|opens from a button'` |
| 18 | `src/renderer/view.ts#machineDialog` | the row shows no value set | `view.test.ts -t 'scrollback\|machineDialog'` |
| 19 | `src/renderer/work-item-view.ts#newScreen` | `scrollback: 1000` | `terminal-basics.test.ts -t scenario` |
| 20 | `src/renderer/work-item-view.ts#showScrollback` | sets nothing | the same |
| 21 | `src/renderer/renderer.ts` | no `showScrollback` at `machine` | the same |

The first run of mutations 1 to 7 went red in 0.8 s each. That time is too short for the runner to start, and its pattern `scrollback|machineDialog|paneCap` stood unquoted in `--tests`. The verdicts were not taken. Mutation 7 was then run alone and its failing line read. Mutations 1 to 6 were run again with the pattern quoted, and those are the verdicts in the table.

**The phase boundary's set (executed at `717df5f7`, and again after `6f1111f9`).**

- The first `OWLERY_BACKGROUND=1 pnpm run test:app` failed 3 cases and passed 219, with 8 skipped (exit 1). The three were the link-card cases of `terminal-basics.test.ts`: *shows a card under a link the pointer rests on…*, *makes a path a pane printed a link only where…* and *shows a path's file in Finder at a click…*. The first failed at `:721` on the card shown after a modifier key, and the other two on "the window never showed a link under the pointer on row 3". This phase changes no link code. The same file run alone at HEAD then passed 27 of 27, and a second `test:app` passed 222, with 8 skipped (exit 0). The app project runs its files one at a time (`apps/desktop/vitest.config.ts`). So the three are labelled as cases that fail under timing in a long batch, and not as cases this change breaks. That label rests on these two runs alone and was not run at the base.
- `node scripts/test-in-electron.mjs test/machine.test.ts test/daemon.test.ts test/view.test.ts test/themes.test.ts` passed 998 cases in 4 files (exit 0). `themes.test.ts` is in the set because it reads both editions of `docs/design.md` and the modules of `src/renderer`.
- `test/machine-dialog.test.ts` alone passed 10 of 10, and `test/terminal-basics.test.ts` alone 27 of 27, both at `5281cba2` (exit 0). The file was run alone again at HEAD after `717df5f7`, and passed 27 of 27.

**Memory: the scene `four` read 532.0 to 543.0 MB at the default scrollback (executed at `6f1111f9`, exit 0).** `OWLERY_BACKGROUND=1 OWLERY_MEMORY_SCENARIOS=four pnpm run measure:memory` made three launches. The highest sample of each run was 543.0, 540.3 and 532.0 MB, against 499.0, 500.9 and 503.4 MB on 2026-11-19. The renderer process holds about 33 MB more and the daemon about 3.5 MB more. The samples, the method and the commit stand in `apps/desktop/measurements/memory.md` *2026-11-26: the scene `four` at a scrollback of 5,000 lines*. `frame/design.md`, judged against `docs/architecture.md` *Memory design*, states that no number of a reference scene refuses the default, so the default stays at 5,000. By arithmetic the 4,000 lines each of the four terminals holds beyond the 1,000 it held before account for about 9.4 MB of the renderer's 33 MB. The measurement does not say what holds the rest.

**For phase 2.** `scrollbackSays` names what a line costs in the window and in the daemon. Where the find bar or the link layer of phase 2 keeps state for each line, the cost should grow past what the sentence says, and the sentence is then to be read again (not measured). Both editions of `docs/architecture.md` still state the 1,000 lines and the disk log at lines 452 and 458. Those lines are the frame's `## Rule changes`, which the settle applies, and this phase did not edit them.
