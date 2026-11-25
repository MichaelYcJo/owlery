# Closing memo: 1795559735-heavy-commands-wait-their-turn

## Not verified

| Item | Who must answer |
|---|---|
| The whole desktop suite, the repository-wide typecheck and the rest of the `Broad gate` command, after phases 1 to 5 and round 1's fix pass | the orchestrator, at the broad gate |
| Whether a pane of the built app holds `OWLERY_RUN` and a `"$OWLERY_RUN" <name>` typed there reaches the daemon's turn socket. The cases call `paneCommands`, `writeRunner` and the runner apart. Phase 5's case of the Machine dialog asks the built daemon's `turns.sock` directly, as the runner does, and is given its turn, but no case opens a pane and runs the launcher | the orchestrator, by one run of the launcher in a pane of the built app |
| Whether the built app holds the display awake while a heavy command runs and wakes it at the start: the daemon's cases give a holder that starts no process, and the program's case reads the arguments of `caffeinate`, but no case runs a heavy command in the built app and watches the display | the orchestrator, by one heavy command run in a pane of the built app with `pmset -g assertions` read during it |
| Whether the built daemon reads the load and the cores, so that a broad gate that failed while the machine was over its load runs once more in the built app. `main.ts` spreads `machine.ts#turnReading(machine, worktreesRoot(process.env))` into the daemon's options, and the case on `turnReading` gives it a reader and reads both, but no case starts the built daemon with a load above the cores and reads a second gate stage (`frame/questions.md` Q18, its default) | the orchestrator, by one broad gate in the built app with `OWLERY_MACHINE` giving a load above the cores and a gate command that fails once |
| Closed at `e03117aa` as a defect of the case: whether scenario I's case of `test/heavy-run.test.ts` holds under load. In phase 5's boundary set of 36 files it read a peak memory of 12.9 MB where it wants more than 64 MiB, and it passed alone. The case held its array for 6.5 seconds, and a reading of the memory that fired late or answered after the command ended missed it. Since `e03117aa` the command holds the array until the case has seen a reading of the runner find it, so no reading's time decides the case. It has not yet run under the broad gate's load | the orchestrator, at the broad gate |
| How the inbox line of the built app draws a heavy command's wait. `list.ts` hands `lineText` the count from `view.ts#machineAhead`, whose cases read both waits and the older of the two, but no built-app case and no screenshot holds a line whose heavy command waits: the screenshot run's waiting command stands in a folder no work item names | the orchestrator, by one look at a line while a command of its worktree waits behind another |

## Not done

nothing
