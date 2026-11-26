# Closing memo: 1795651593-231-pane-output-is-searched-and-opens-paths

## Not verified

| Item | Who must answer |
|---|---|
| The broad gate: `pnpm -r run check` and the comparison of `docs/*.md` with `docs/*.ko.md`, at the phase's last commit. Phase 1 ran its unit files, its two built-app files, `themes.test.ts` and `pnpm run test:app`, and no repository-wide run | the orchestrator, at the broad gate |
| That the three link-card cases of `apps/desktop/test/terminal-basics.test.ts` that failed in the first `test:app` of phase 1 fail on timing in a long batch, and not because of this work. The file passed alone at HEAD and in a second `test:app`, and no run at the base was made (`trail/phases/phase-1.md`) | the orchestrator, at the broad gate |
| How many lines a Claude Code pane holds when it returns to the stage after a long turn, at 256 characters a line (Q2 of `frame/questions.md`). Phase 1 timed the return of a shell pane of 3,000 short lines only | the owner's walk of release 0.0.5 |
| That a key typed while a returned pane's replay is drawn is dropped, and not sent, which is what makes the first key the pane's process receives mark the end of the return. The case stands on `screenTurns` in `apps/desktop/src/renderer/view.ts`, `read`, and no case removes that guard to show the time would read otherwise | a proofer, reading `screenTurns` against the case `holds again the 3,000 lines` of `apps/desktop/test/terminal-basics.test.ts` |

## Not done

The Machine dialog draws no scrollback row against a daemon of an earlier build (scenario B3), and only a unit case on `machineDialog` in `apps/desktop/test/view.test.ts` holds that. `frame/design.md` names `apps/desktop/test/machine-dialog.test.ts` beside it. A built-app case would need a daemon that answers as an earlier build does, and the built app starts its own daemon from the same tree, so no case of that file can start one without a stand-in daemon written for it. The unit case reads the function the dialog draws from, and phase 1 did not build a stand-in daemon for one row.
