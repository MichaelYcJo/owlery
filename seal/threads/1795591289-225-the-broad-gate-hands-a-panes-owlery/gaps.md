# Closing memo: the broad gate hands a pane's OWLERY variables to the suite

## Scope confirmation

A pane and the broad gate's command take none of the variables that `hooks.ts#PANE_VARIABLES` names of the pane they were started from: its id, its hook socket, its runner of heavy commands, its chain command and its base (`frame/design.md` *Scope*).

## Not verified

| Item | Who must answer |
|---|---|
| closed The whole suite. At `7d3f9d5a`, after the merge of `release/v0.0.4` that brought issue #226, the session ran `test/daemon.test.ts`, `test/gate.test.ts`, `test/hooks.test.ts`, `test/pane-chain.test.ts`, `test/chain-command.test.ts` and `test/heavy-run.test.ts` in a pane that holds its id, hook socket, chain command and base, 459 cases passed, and the desktop app's `tsc --noEmit`. That pane holds no `OWLERY_RUN`, because the app that started it writes no runner, so the run in a pane does not hold the runner's cut; the two cases do. | answered: the broad gate passed at `2bbe8d54`, the one run of this work item's `trail/gate.md`, after which only the work item's records changed; the `check` workflow passed on pull request #238 at the head it merged from |
| closed A daemon started by `pnpm start` typed in an Owlery pane, with a real Claude Code pane in it. The case starts the daemon in the suite's process with the pane variables set, the runner of heavy commands among them, and no app was started from a pane. | re-homed to issue #184, in its section "Rows carried here by the settle of release 0.0.4" |

## Not done

nothing
