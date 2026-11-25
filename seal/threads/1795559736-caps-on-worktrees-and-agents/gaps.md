# Closing memo: caps on worktrees and agents

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite, the lint and the typecheck of the repository. The crafter ran the *Phase boundary* set of each phase and a typecheck of the changed files. In phase 2 it also ran the desktop app's whole `tsc --noEmit` once by mistake, which passed; that run is no broad gate. | The orchestrator, through the broad gate |
| What the window draws of the queue: the line's "Waiting for the machine", the status line's count against the cap, the chain's foot, the "Queued" mark and the list under the Machine dialog's agent row. `renderer/view.ts` holds each sentence and list, and `view.test.ts` its cases. No built-app case queues a session: the built app's headless sessions run the real `claude` once they start, and the spawn forbids starting one. The calls in `renderer/list.ts`, `sidebar.ts`, `work-item-view.ts`, `machine.ts` and `renderer.ts` were read, not run. | Phase 5's screenshot run, which *Scope* item 15 gives a line of the inbox that waits for the machine, and the owner |
| The agents' memory as `ps` reads it on a Mac. The cases give the reader's `ps`. No probe ran the real `ps -o pid=,rss=` against a live Claude Code process. | Nobody before the release: a reading the call does not give leaves the measures where they are, and the proposal on 679 MB |
| That a built-app case reads the same proposal on the hosted runner as on the owner's Mac (scenario 16). The crafter ran `apps/desktop/test/machine-dialog.test.ts` on the owner's Mac alone. | The `check` job of the pull request |
| The real `sysctl` call of `daemon/machine.ts`. The cases give their own; one probe ran the real one once on the owner's Mac, an Apple silicon Mac. An Intel Mac, where `hw.perflevel0.physicalcpu` does not exist, was not run. | Nobody before the release: the fallback is tested on a `sysctl` that fails as it fails there |
| How the Machine dialog looks in each theme and appearance. No screenshot of it is taken before phase 5. | Phase 5's screenshot run, and the owner |

## Not done

Phases 3, 4 and 5 are not built yet. Phase 3 owes this file a line when it is built: that a worktree is read at its first size (`frame/design.md` *Scope*, the item on measuring a worktree again).

**An agent's memory is its resident size.** The daemon reads `ps -o pid=,rss=`, the resident set of the agent's own process, and not the footprint Activity Monitor shows. A resident size can read under the footprint while macOS compresses memory, so on a Mac under pressure the proposal can allow more agents than the memory holds (`frame/plan.md` *Alternatives considered*, the row on `footprint`). The process measured is the pane's own and the Claude Code CLI a headless session runs, not their children.
