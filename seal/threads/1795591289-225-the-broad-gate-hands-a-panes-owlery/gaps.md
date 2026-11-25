# Closing memo: the broad gate hands a pane's OWLERY variables to the suite

## Scope confirmation

A pane and the broad gate's command take none of the variables of the pane they were started from: its id, its hook socket, its chain command and its base (`frame/design.md` *Scope*).

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite. The session ran `test/daemon.test.ts`, `test/gate.test.ts`, `test/hooks.test.ts`, `test/pane-chain.test.ts` and `test/chain-command.test.ts` in a pane that holds the four variables, 443 cases passed, and the desktop app's `tsc --noEmit`. | The broad gate, which this work item's chain runs from that pane |
| A daemon started by `pnpm start` typed in an Owlery pane, with a real Claude Code pane in it. The case starts the daemon in the suite's process with the four variables set, and no app was started from a pane. | The owner, where they start the app from a pane |

## Not done

nothing
