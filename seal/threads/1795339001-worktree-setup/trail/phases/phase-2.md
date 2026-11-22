# Phase 2: 1795339001-worktree-setup

## What this phase found

### The frame holds, with the fold's two additions

The frame was read against the tree at `19b71d4` before anything was built. The coordinates of `frame/plan.md` *Technical context* that this phase builds on stand there: `apps/desktop/src/renderer/list.ts` lines 136 to 140 draw the line's two rows, `shared.ts#detail` starts at line 275 and is called at `list.ts` line 114 and `work-item-view.ts` line 731, `view.ts#tabLabel` is at line 15, and `view.ts#planLine` at line 1492. `renderer.ts#askPlan` stands at line 1164, as the plan says. The `TerminalSession.onExit` of `apps/desktop/src/daemon/pty.ts` passes the exit code alone, as phase 1 found. No `seal/follow-up.md` stands, and no `seal/parity.json`.

The plan's Phases row 2 names `view.test.ts` alone. The two daemon additions of `frame/plan.md` *Judgments of the run*, last row, are built here too, with cases in `worktree-setup.test.ts`, `pty.test.ts` and `daemon.test.ts`. The window's wiring, which `view.test.ts` cannot reach, is held by one built-app case in `work-item-form.test.ts`.

### Decisions made while building

Each was judged against `frame/design.md` *Scope* items 7 to 10 and *Data & interfaces*, which leave the point open, unless the item names another document.

- **The copy clones each path with `/bin/cp -c -R -P <source> <target>`, one process per path.** Where that process exits with another code than 0, or cannot start, what it left at the target is removed and Node's copy writes the path as before. Nothing stood at the target before the clone, since a path that stands is skipped first, so the removal touches only what the failed clone wrote. `copyIncluded` takes the program as a third parameter, `clone`, whose default is `CLONE`, `/bin/cp`, so a case can put a stand-in in its place. A folder's source is given without its trailing slash, because BSD `cp -R` copies what a folder holds where its source ends with one. Judged against `frame/plan.md` *Judgments of the run*, last row, and `frame/design.md` *Scope* item 2, whose link and skip rules stand unchanged.
- **The case that copies 501 files has a timeout of 30 seconds.** Each path now starts a process, twice in that case, so it took 2.3 seconds at a load average near 3, against the default bound of 5 seconds. A load near 20, as phase 1 measured, would pass that bound.
- **A pane's exit carries the signal.** `TerminalSession.onExit` hands its listener the exit code and node-pty's signal, 0 where none ended the process. `Daemon#setupExited` records a setup whose process a signal ended as `failed`, with the sentence `The setup command was ended by SIGTERM.`, the signal named by `os.constants.signals`. The exit code stays as node-pty reports it, 0 for `/bin/sh -c 'kill -TERM $$'`. A pane the daemon ended keeps the sentence of *Scope* item 5, which comes first. It was cheap: two files and one parameter. Judged against `frame/plan.md` *Judgments of the run*, last row. It departs from *Scope* item 5's sentence that a setup succeeds where the code is 0: it now also needs no signal.
- **`tabLabel` takes the setup pane's id as a fourth parameter, `setupPane`, null by default.** The setup pane reads "Setup", and the other panes of its kind are numbered without it, so a work item with a setup pane and one shell pane shows "Setup" and "Shell", not "Setup" and "Shell 2". Each caller that knows the work item passes `workItem.setup?.paneId ?? null`: `runningIn`, which the archive and removal dialogs read, the view's tabs, and the close dialog. `runningSessions` and `notificationFor` call it for a pane of no listed work item, which has no setup.
- **`setupSection(workItem, now)` gives the sentence, the copied paths, `more`, the failed paths and `runAgain`.** The sentence is the record's `failure` where the daemon gave one; otherwise it is "The command has run for <age>." while it runs, "No command runs: .worktreesetup names none." where only `.worktreeinclude` stood, and "The command ended with code <n>." `runAgain` is true while the record does not read `running`, which phase 1 found is while no setup pane's process is alive. The cut list reads "and N more", as *Data & interfaces* writes it. The head is not in what it gives: *Data & interfaces* says it gives the head "Setup", and `view.ts` exports it once as `SETUP_HEAD`, which the section and the setup pane's tab both read.
- **The line's setup words stand after the text and before the badge,** in a part whose class is `setup failed` where the setup failed, so the style gives the words the failure's colour. `setupMark` returns the words alone, as *Data & interfaces* gives it.
- **The "Setup" section stands last in `detail`, after the changed files.** `detail` takes `runSetup?: () => void` as its third parameter, and the preview passes none, so only the view offers "Run setup again". Its press sends `runSetup` with the size `startSize` gives. The existing `started` case of `renderer.ts` takes the answer and puts the new pane in front; an `error` falls through to the status line.
- **`planLine` gains a field, `setup`,** with the two sentences of *Data & interfaces* joined by a space. The command is shown trimmed, so `pnpm install\n` reads "Then runs: pnpm install". The form shows it in a new `<span id="work-item-setup">` inside `#work-item-plan`, with its line breaks kept. `renderer.ts` reads a `workItemPlan` without the two fields, from a daemon of an earlier build, as null and false, as the protocol's comment says.
- **The creating window detaches the setup pane at `workItemCreated`.** Phase 1 left it to this phase. The window has no screen for that pane until its tab is pressed, and then the view attaches and draws the replay, so the daemon need not send the window the output of a `pnpm install` nobody looks at. No case reads it: the window draws nothing different either way. It is `read`.
- **The window does not hold a second press of "Run setup again" before the daemon's answer.** A second `runSetup` arrives while the first one's pane runs, and the daemon refuses it with "The setup of work item <id> is still running.", which the status line says. The inbox that follows the first answer hides the button.

### What touches #119's coordinates, for the merge

#119 merges first, and each of these was kept to the lines named:

- `apps/desktop/src/renderer/list.ts`: the import of `setupMark`; in the line's second row, one comment line and `part(workItem.setup?.state === "failed" ? "setup failed" : "setup", setupMark(workItem))` between the text and the badge. #119 puts `part("decided", decisionMark(workItem))` at the same place, so the merge puts the setup's part after the decided part, as `frame/plan.md` *Overlap with the release* says.
- `apps/desktop/src/renderer/shared.ts#detail`: the import of `SETUP_HEAD` and `setupSection`; the docstring; the third parameter `runSetup?`; and the "Setup" section after the changed files, before `return parts`. #119 adds `reverse?` as the third parameter, so the merge makes `runSetup` the fourth, and `work-item-view.ts`'s call passes both.
- `apps/desktop/src/renderer/view.ts`: `tabLabel` and its docstring, then `SETUP_HEAD`, `setupMark`, `SetupSection` and `setupSection` right after it, at lines 8 to 63, away from #119's hunks; the `tabLabel` call in `runningIn`; `PlanAnswered`'s two fields; `planLine` and its docstring. The import line, which #119 changes, is not touched. Nothing near `inboxLine` or `lineMarks` changed.
- `apps/desktop/src/renderer/work-item-view.ts`: the `tabLabel` calls of the close dialog and of `tabElement`, which gains a parameter; the `detail` call; and the new function `runSetup` above `ask`.
- `apps/desktop/src/renderer/renderer.ts`: the constant `setupPlace`; two lines of `showPlan` and its docstring; the `workItemPlan` case; and three lines of the `workItemCreated` case.
- `apps/desktop/src/renderer/index.html`: one `<span>` in `#work-item-plan`, and the style rules of the form's setup, the line's setup words and the "Setup" section.

### Runs and their scope

- **The baseline,** executed at `19b71d4` before the build: `node scripts/test-in-electron.mjs test/worktree-setup.test.ts test/view.test.ts`, 392 cases, all passed.
- **The cases of each slice,** executed after each change: `worktree-setup.test.ts` and `pty.test.ts`, 26 cases; `daemon.test.ts -t "the setup of a new worktree"`, 13 cases; `view.test.ts`, 390 cases; `work-item-form.test.ts`, 8 cases, with `OWLERY_BACKGROUND=1`, the built app started in the background. All passed at `bd59188`.
- **The typecheck of the changed files,** executed with the options of `apps/desktop/tsconfig.json` over the eight changed source files and the five changed test files: no error.
- **The phase boundary run,** executed at `bd59188` in one command, with `OWLERY_BACKGROUND=1`: `node scripts/test-in-electron.mjs` over the unit files `worktree-setup`, `pty`, `daemon`, `view`, `repositories`, `last-look` and `hooks`, which import a changed source directly or through `repositories.ts`, `last-look.ts` or `hooks.ts`, and the built-app files `work-item-form`, `work-item-menu`, `terminal-basics` and `notification-click`, whose cases read the form's plan, the tabs or the view. Vitest ran the built-app files one at a time, after the others. 11 files, 779 cases, all passed, in 227 seconds. The other built-app files build the same app and were not run (`gaps.md` *Not verified*).
- **After the run,** two comments were corrected: the style's comment above `.detail` in `index.html` now names the setup, and `worktree-setup.ts#CLONE`'s docstring no longer says the clone takes almost no time, since it took 5.2 seconds on Q4's stand-in. `worktree-setup.test.ts` ran again over the changed module, 13 cases, all passed, and the module typechecked.

### How each case was seen red

- `pty.test.ts`'s signal case gave `[0, undefined]` against the old `onExit`.
- `daemon.test.ts`'s signal case gave `state: "succeeded"` and `failure: null` against the old daemon, the defect the fold names.
- `worktree-setup.test.ts`'s two clone cases gave an empty list of calls: the old `copyIncluded` ran no program.
- `view.test.ts`: 11 cases failed before the window's functions stood, `setupMark` and `setupSection` as no function, `tabLabel`'s and `archivalOf`'s with the old labels, and the four `planLine` cases without the `setup` field. The case that the setup changes neither the line's state nor its group passed there, as an absence case does. It was shown red by a `seal mutate` that made `inboxLine` read a work item with a setup as `waiting`.
- `work-item-form.test.ts`'s case was written after the window's code and was shown red by the mutants below. Its first two runs failed on the case's own mistakes: a `??` beside `&&` that the page refused to parse, and the order of the tabs after "Run setup again", which follow the panes' ids, so the new setup pane stands after the shell.

Each unit that adds behaviour was then broken by `seal mutate`, one break at a time:

- `worktree-setup.ts` over `worktree-setup.test.ts -t copyIncluded`: 7 breaks, 6 red. They dropped `-c`, dropped `-P`, read any exit as a clone, removed the removal of what a failed clone left, kept the source's trailing slash, and removed the clone. The break that SURVIVED replaced `child.on("error", () => resolve(false))` with a listener that does nothing: Node emits `close` after a spawn's `error` here, and `close` resolves false. Removing the listener whole was red, by the uncaught `ENOENT`. So the listener is held, and its `resolve(false)` is held by no case.
- `worktree-setup.ts#signalEnded` over `daemon.test.ts -t signal`: the signal's name replaced by its number, red.
- `pty.ts` over `pty.test.ts` and `daemon.test.ts -t signal`: the signal replaced by 0, red.
- `daemon.ts` over `daemon.test.ts -t "the setup of a new worktree"`: 2 breaks, 2 red. They removed the signal's failure and inverted its test.
- `view.ts` over `view.test.ts`: 14 breaks, 14 red. They removed the "Setup" label, the numbering without the setup pane, the setup pane's id in `runningIn`, each of the two words of `setupMark`, the null of no setup, the daemon's sentence, the sentence of no command, "and N more", `runAgain`'s test, each of the plan's two sentences and the command's trim, and the optional read of a field an earlier daemon does not send.
- `list.ts` over `work-item-form.test.ts`: 2 breaks, 2 red. They removed the line's setup part and its `failed` class.
- `shared.ts` over `work-item-form.test.ts`: 2 breaks, 2 red. They offered "Run setup again" while the setup runs, and removed its press.
- `work-item-view.ts` over `work-item-form.test.ts`: 3 breaks, 3 red. They removed the setup pane's id from the tab's label, the callback of `detail`, and the message `runSetup` sends.
- `renderer.ts` over `work-item-form.test.ts`: 2 breaks, 2 red. They removed the form's setup line and the plan's two fields.

`seal mutate` keeps each mutant's verdict and not its output, so the failing line of each built-app mutant was not read. Each mutant's run took 15 to 50 seconds against the baseline's 15, the time of the wait the case gave up on.

### Not exercised by any case

- The detach of the setup pane at `workItemCreated`, above.
- The style rules of `index.html`. No case reads a colour or a layout; they were read in the diff.
- The fallback of `signalEnded` to `signal <n>` where `os.constants.signals` names no signal.
- A clone on a volume that is not APFS. The fallback was exercised through a stand-in program that fails, and through a program that cannot start; `/bin/cp -c` on another volume was not run.
