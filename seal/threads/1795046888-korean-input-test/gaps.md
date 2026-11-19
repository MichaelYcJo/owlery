# Closing memo: the Korean input regression test runs and passes

## Not verified

| Item | Who must answer |
|---|---|
| Scenario 8's two readings, the application type `UIElement` and `document.hasFocus()` false, were never seen failing, and `apps/desktop/src/main/main.ts`'s three lines of the switch have no mutant: each red is a start that takes the system's focus, which `frame/plan.md` *Judgments of the run* withholds | nobody, by that judgment. The frame's probe 5 and phase 1's measurement without the switch stand in for it |
| Whether two gates at once, or a person's change of the front app, end a composition in a window under the switch, `frame/questions.md` Q2 | a measurement, by whoever first sees the failing line that names an outside end |
| `BuiltApp.start` with `keepBackground`, which no run passed | the builder of phase 2, whose typed run is its caller, and the owner's typed run |
| The sentence `deliver` adds to a failing line where a composition ended from outside: no case reads it | a reader of `apps/desktop/test/korean-input.test.ts#deliver`. `Typing.endedFromOutside`, which it is written from, has scenario 10's two cases |
| The desktop suite, the typecheck of the whole app and the repository's broad gate. Phase 1 ran `korean-input.test.ts` and `background.test.ts`, and `tsc --noEmit` over the six files it changed | the orchestrator, at the broad run |
| Which events a macOS Korean input source produces, `frame/questions.md` Q1 | the owner, by the typed run of phase 2 |
| closed Phase 1's *Phase boundary* run, not made at `1d2da48` | run once at `1b5ef35`'s tree under the switch: `pnpm run test korean-input background.test`, 2 files and 23 cases passing (`boundary1.txt` in phase 1's scratch) |
| closed Whether `/usr/bin/open -g` starts the app behind the person's windows | never measured, and no longer asked: the owner chose the switch of `frame/design.md` *Scope* item 14 over it (`frame/plan.md` *Judgments of the run*) |
| closed The receiver's guard, its exit where its input is no terminal, against its case | `seal mutate` at `1b5ef35`, the guard removed: red, `expected true to be false` (`r1.txt`) |
| closed The daemon's stop in `apps/desktop/test/built-app.ts#end`, never mutated at `1d2da48` | `seal mutate` at `1b5ef35`, the daemon's process id left out: red, `expected [ 15098, 15186 ] to deeply equal []` (`d1.txt`), and both processes stopped by those ids |

## Not done

A case that starts a second app to end a composition for real was not written. Under the switch a second app does not become the front app, and whether it ends a composition is `frame/questions.md` Q2. The case that stands in for it commits the composing syllable through the debugging port.

The front app was not read in any run under the switch. The frame's probe 5 read it, and the case reads the application type and the page's focus instead, which need no polling beside the run.
