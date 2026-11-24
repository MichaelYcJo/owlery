# Closing memo: caps on worktrees and agents

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite, the lint and the typecheck of the repository. The crafter ran the *Phase boundary* set of phase 1 and a typecheck of the changed files alone. | The orchestrator, through the broad gate |
| That a built-app case reads the same proposal on the hosted runner as on the owner's Mac (scenario 16). The crafter ran `apps/desktop/test/machine-dialog.test.ts` on the owner's Mac alone. | The `check` job of the pull request |
| The real `sysctl` call of `daemon/machine.ts`. The cases give their own; one probe ran the real one once on the owner's Mac, an Apple silicon Mac. An Intel Mac, where `hw.perflevel0.physicalcpu` does not exist, was not run. | Nobody before the release: the fallback is tested on a `sysctl` that fails as it fails there |
| How the Machine dialog looks in each theme and appearance. No screenshot of it is taken before phase 5. | Phase 5's screenshot run, and the owner |

## Not done

Phase 1 leaves to the later phases what `frame/plan.md` *Phases* gives them. Two of them owe this file a line when they are built: phase 2, that the agents' memory is their resident size (`frame/plan.md` *Alternatives considered*, the row on `footprint`), and phase 3, that a worktree is read at its first size (`frame/design.md` *Scope*, the item on measuring a worktree again).

The list of the queue under the agent row of the Machine dialog, which *Scope* item 4 asks for, waits for phase 2. Before the queue exists there is nothing to list, and `machine.agents.queue` is always empty.
