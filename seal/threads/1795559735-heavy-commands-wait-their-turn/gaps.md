# Closing memo: 1795559735-heavy-commands-wait-their-turn

## Not verified

| Item | Who must answer |
|---|---|
| The whole desktop suite, the repository-wide typecheck and the rest of the `Broad gate` command, after phases 1 and 2 | the orchestrator, at the broad gate |
| Whether a pane of the built app holds `OWLERY_RUN` and a `"$OWLERY_RUN" <name>` typed there reaches the daemon's turn socket. The cases call `paneCommands`, `writeRunner` and the runner apart, and the built-app files of phase 2's boundary passed with the built daemon writing the launcher and listening on the socket at its start, but no case opens a pane and runs the launcher | the orchestrator, by one run of the launcher in a pane of the built app |
| How the window draws a gate stage with `gate.waits` and a work item's `machineWait`: phase 1 sends both and no renderer reads them yet | phase 5, which gives the line #32's words (`frame/plan.md` *Phases*) |

## Not done

- Phases 3 and 4 of `frame/plan.md` *Phases* are not built. The crafter stopped after phase 2 to report where the work stands, as the orchestrator asked. Neither needs anything of #32's: phase 3's cases give the keeper its reading of the load, and phase 4 changes `keep-awake.ts`, `seal/config.json` and the role bundle.
