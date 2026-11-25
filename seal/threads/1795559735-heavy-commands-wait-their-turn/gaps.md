# Closing memo: 1795559735-heavy-commands-wait-their-turn

## Not verified

| Item | Who must answer |
|---|---|
| The whole desktop suite, the repository-wide typecheck and the rest of the `Broad gate` command, after phases 1 to 3 | the orchestrator, at the broad gate |
| Whether a pane of the built app holds `OWLERY_RUN` and a `"$OWLERY_RUN" <name>` typed there reaches the daemon's turn socket. The cases call `paneCommands`, `writeRunner` and the runner apart, and the built-app files of phase 2's boundary passed with the built daemon writing the launcher and listening on the socket at its start, but no case opens a pane and runs the launcher | the orchestrator, by one run of the launcher in a pane of the built app |
| How the window draws a gate stage with `gate.waits` and a work item's `machineWait`: phase 1 sends both and no renderer reads them yet | phase 5, which gives the line #32's words (`frame/plan.md` *Phases*) |
| Whether a second run's peak memory is read where its command ends within the first reading: the daemon reads memory at once and every 5 seconds with an asynchronous `ps`, and a command that ends before `ps` answers is kept with no peak memory. Scenario I's case reads a command that runs longer than one reading | phase 5, where the Machine dialog lists the runs and shows what a run with no reading reads as |

## Not done

- Phase 4 of `frame/plan.md` *Phases* is not built yet. It needs nothing of #32's.
- The built app runs no second run of a broad gate until phase 5: `main.ts` gives the daemon no `load` and no `cores` before #32's reader merges, so no run reads as over the machine's load.
