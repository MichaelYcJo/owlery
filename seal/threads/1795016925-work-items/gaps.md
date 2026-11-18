# Closing memo: 1795016925-work-items

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the typecheck and the documents' checks as the `Broad gate` of `seal/config.json` runs them: phase 1 ran three test files and the package's `tsc --noEmit`, not `pnpm -r run check` | the orchestrator, by the broad run after the last phase |
| The daemon process keeps the list across its own restart: `src/daemon/main.ts` passes its run directory to `Daemon`, which was read and not run; the case restarts a `Daemon` object on one run directory, not the process | phase 2's builder, when the built app is driven: create a work item, stop the daemon, start the app again and read the list |
| A pane of the real kinds opens in the worktree: the cases use a pane that prints `pwd -P`, not the login shell or `claude` that `main.ts` starts | phase 2's builder, by reading `pwd` in a pane of a work item in the built app |
| Whether each of the 26 mutants `seal mutate` reported red in one call failed on the line that watches its unit: the call prints the verdict and the exit code, not the failing line | a reader re-running one pair alone, as `trail/phases/phase-1.md` did for the one survivor |

## Not done

- **A work item made in one window is not announced to another.** Only the client that created it receives `workItemCreated`; any other learns of it at its next `ready`. One window exists today, and the inbox of issue #7 is where a list that changes under several clients gets built.
- **No rollback where the list cannot be written after the worktree was made.** The branch and the folder stay and the client gets an error. Removing a worktree is out of scope until milestone 4 (`frame/design.md` *Scope*, item 9).
- **A corrupt `work-items.json` reads as an empty list and is overwritten by the next creation.** `frame/plan.md` *Technical context* already names a lost list as the chosen approach's failure, cleared by `git worktree prune`.
- **The worktree's stored folder is not made canonical.** With an `OWLERY_WORKTREES` that is a symbolic link, the stored path and the pane's physical path differ. Nothing compares them outside the cases.
- **Git inherits the daemon's environment.** A `GIT_DIR` set where the daemon was started would point every creation at that repository; the app starts the daemon itself, so none is set in practice.
- **A creation still running when the daemon closes is not cancelled.** `Daemon#close` does not wait for it, so its pane could start after the close and outlive it until the process exits; `src/daemon/main.ts` exits the process right after the close.
