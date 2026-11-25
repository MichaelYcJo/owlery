# Closing memo: 1795559735-heavy-commands-wait-their-turn

## Not verified

| Item | Who must answer |
|---|---|
| The whole desktop suite, the repository-wide typecheck and the rest of the `Broad gate` command, after phases 1 to 4 | the orchestrator, at the broad gate |
| Whether a pane of the built app holds `OWLERY_RUN` and a `"$OWLERY_RUN" <name>` typed there reaches the daemon's turn socket. The cases call `paneCommands`, `writeRunner` and the runner apart, and the built-app files of phase 2's boundary passed with the built daemon writing the launcher and listening on the socket at its start, but no case opens a pane and runs the launcher | the orchestrator, by one run of the launcher in a pane of the built app |
| How the window draws a gate stage with `gate.waits` and a work item's `machineWait`: phase 1 sends both and no renderer reads them yet | phase 5, which gives the line #32's words (`frame/plan.md` *Phases*) |
| Whether the built app holds the display awake while a heavy command runs and wakes it at the start: the daemon's cases give a holder that starts no process, and the program's case reads the arguments of `caffeinate`, but no case runs a heavy command in the built app and watches the display | the orchestrator, by one heavy command run in a pane of the built app with `pmset -g assertions` read during it |
| What a run's line holds as its peak memory where its command ends before the first reading answers: the daemon reads memory at once and every 5 seconds with an asynchronous `ps`, and a command that ends before `ps` answers is kept with no peak memory. Scenario I's case reads a command that runs longer than one reading | phase 5, where the Machine dialog lists the runs and shows what a run with no reading reads as |

## Not done

- The built app runs no second run of a broad gate until phase 5: `main.ts` gives the daemon no `load` and no `cores` before #32's reader merges, so no run reads as over the machine's load.
