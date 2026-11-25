# Closing memo: the broad gate hands a pane's OWLERY variables to the suite

## Scope confirmation

A pane and the broad gate's command take none of the variables that `hooks.ts#PANE_VARIABLES` names of the pane they were started from: its id, its hook socket, its runner of heavy commands, its chain command and its base (`frame/design.md` *Scope*).

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite. At `7d3f9d5a`, after the merge of `release/v0.0.4` that brought issue #226, the session ran `test/daemon.test.ts`, `test/gate.test.ts`, `test/hooks.test.ts`, `test/pane-chain.test.ts`, `test/chain-command.test.ts` and `test/heavy-run.test.ts` in a pane that holds its id, hook socket, chain command and base, 459 cases passed, and the desktop app's `tsc --noEmit`. That pane holds no `OWLERY_RUN`, because the app that started it writes no runner, so the run in a pane does not hold the runner's cut; the two cases do. | The broad gate, which this work item's chain runs from that pane |
| A daemon started by `pnpm start` typed in an Owlery pane, with a real Claude Code pane in it. The case starts the daemon in the suite's process with the pane variables set, the runner of heavy commands among them, and no app was started from a pane. | The owner, where they start the app from a pane |

## Not done

nothing
