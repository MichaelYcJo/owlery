# Closing memo: the broad gate hands a pane's OWLERY variables to the suite

## Scope confirmation

A pane and the broad gate's command take none of the variables of the pane they were started from: its id, its hook socket, its chain command and its base (`frame/design.md` *Scope*).

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite. The session ran `test/daemon.test.ts`, `test/gate.test.ts`, `test/hooks.test.ts`, `test/pane-chain.test.ts` and `test/chain-command.test.ts` in a pane that holds the four variables, 443 cases passed, and the desktop app's `tsc --noEmit`. | The broad gate, which this work item's chain runs from that pane |
| A daemon started by `pnpm start` typed in an Owlery pane, with a real Claude Code pane in it. The case starts the daemon in the suite's process with the four variables set, and no app was started from a pane. | The owner, where they start the app from a pane |

## Not done

- `OWLERY_RUN`, the runner of heavy commands, is not in `hooks.ts#PANE_VARIABLES`. It reached this branch with issue #226, in the merge of `release/v0.0.4` after round 4, and the frame was written before it existed. `paneCommands` and `setupPaneCommand` set it for every pane where the daemon wrote a runner, so a daemon that writes one gives each pane its own. Where a daemon writes none, as a daemon a case starts may not, a pane started under it still names the outer pane's runner, and the broad gate's command holds that runner too. The broad gate's command and the repository's `Heavy commands` do not read it, and the chain command finds the same run folder through `OWLERY_RUN_DIR`, which this work keeps on purpose. Whether the runner belongs on the list is a question for a work item that frames it, and the owner decides whether to open one.
