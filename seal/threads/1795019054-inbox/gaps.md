# Closing memo: 1795019054-inbox

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the typecheck and the documents' checks as the `Broad gate` of `seal/config.json` runs them: phase 1 ran six test files of `apps/desktop` in one command and `tsc --noEmit` over the files it changed and the files that import the protocol, not `pnpm -r run check` | the orchestrator, by the broad run after the last phase |
| The daemon process offers the pane kinds: `src/daemon/main.ts` passes `PANE_KINDS` to `Daemon`, which was read and not run | phase 2's builder, when the built app draws its buttons from `ready` |
| A real Claude Code pane's hooks move the state: the cases feed hook names through `Daemon#agentEvent`, and no `claude` ran | phase 2's builder, by the drive `frame/plan.md` *Phases* row 2 names |
| Which events Claude Code sends to a session that is idle or that compacts its conversation: a `Notification` after the turn's end would show `waiting` over `finished`, and a `SessionStart` in the middle of work would clear the state until the next event | phase 2's builder, by reading the hook lines `OWLERY_DEBUG_HOOKS=1` prints during the drive |
| Whether each of the 40 mutants `seal mutate` reported red in calls of several mutants failed on the line that watches its unit: those calls print the verdict and the exit code, not the failing line | a reader re-running one pair alone, as `trail/phases/phase-1.md` did for the interval case |

## Not done

- **A read of the branches is one `git rev-list` per work item, all started together.** With many work items that is many processes every 3 seconds. `frame/plan.md` *Operational impact* accepts the read per work item, and nothing bounds how many run at once.
- **A work item whose repository or branch is gone shows no count and says nothing more.** `newCommits` is `null` for it, the same as for a work item from before `baseCommit`. Removing a work item is out of scope until milestone 4.
- **`close` has no answer of its own.** A client learns that the pane closed from the `inbox` that follows. A `close` for an id the daemon does not hold is ignored without an `error`, because the message carries no `requestId` (`frame/design.md` *Data & interfaces*).
- **A closed pane's process is sent the hang-up signal and not waited for.** A process that ignores the signal outlives its pane, on no list. `Daemon#close` no longer ends it, because the session is gone from the daemon's map.
- **An agent event under an id the daemon does not hold is still sent to every client as `agent`.** That is what the daemon did before this phase, and an existing case holds it.
