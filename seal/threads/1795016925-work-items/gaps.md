# Closing memo: 1795016925-work-items

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the typecheck and the documents' checks as the `Broad gate` of `seal/config.json` runs them: phase 1 ran three test files and the package's `tsc --noEmit`, and phase 2 its two new test files and the same typecheck, not `pnpm -r run check` | the orchestrator, by the broad run after the last phase |
| closed The daemon process keeps the list across its own restart: `src/daemon/main.ts` passes its run directory to `Daemon`, which was read and not run; the case restarts a `Daemon` object on one run directory, not the process | run by phase 2's builder on 2026-11-19 at `265e734`: two work items were created in the built app, the app and its daemon were stopped with SIGTERM, the app was started again, and the window of the new daemon listed both (`trail/phases/phase-2.md`, *The list across the daemon process*) |
| closed A pane of the real kinds opens in the worktree: the cases use a pane that prints `pwd -P`, not the login shell or `claude` that `main.ts` starts | run by phase 2's builder on 2026-11-19 at `265e734` in the built app: `pwd -P` typed into a work item's Shell pane printed its worktree, and `lsof` gave each worktree as the working directory of its pane's `/bin/zsh -l` and `claude --settings …` (`trail/phases/phase-2.md`, *Scenario 1* and *Scenario 3 and the Claude Code pane*) |
| Whether each of the 26 mutants `seal mutate` reported red in one call failed on the line that watches its unit: the call prints the verdict and the exit code, not the failing line | a reader re-running one pair alone, as `trail/phases/phase-1.md` did for the one survivor |
| The native folder dialog: the drive replaced `dialog.showOpenDialog` in the main process, so the channel from "Browse…" to the folder field ran and macOS's own dialog never opened | a person, by clicking "Browse…" in the built app once and choosing a folder |
| The form by keyboard: the drive pressed its buttons with `click()`, so Enter in a field and Escape were not tried | a person using the form in the built app |
| Whether each of the 14 mutants `seal mutate` reported red in phase 2 failed on the line that watches its unit: the two calls print the verdict and the exit code, not the failing line | a reader re-running one pair alone |

## Not done

- **A work item made in one window is not announced to another.** Only the client that created it receives `workItemCreated`; any other learns of it at its next `ready`. One window exists today, and the inbox of issue #7 is where a list that changes under several clients gets built.
- **No rollback where the list cannot be written after the worktree was made.** The branch and the folder stay and the client gets an error. Removing a worktree is out of scope until milestone 4 (`frame/design.md` *Scope*, item 9).
- **A corrupt `work-items.json` reads as an empty list and is overwritten by the next creation.** `frame/plan.md` *Technical context* already names a lost list as the chosen approach's failure, cleared by `git worktree prune`.
- **The worktree's stored folder is not made canonical.** With an `OWLERY_WORKTREES` that is a symbolic link, the stored path and the pane's physical path differ. Nothing compares them outside the cases.
- **Git inherits the daemon's environment.** A `GIT_DIR` set where the daemon was started would point every creation at that repository; the app starts the daemon itself, so none is set in practice.
- **A creation still running when the daemon closes is not cancelled.** `Daemon#close` does not wait for it, so its pane could start after the close and outlive it until the process exits; `src/daemon/main.ts` exits the process right after the close.
- **No case covers the page.** `src/renderer/renderer.ts`, `src/preload/preload.ts` and the handler in `src/main/main.ts` were shown by one drive of the built app and are watched by no case. The tests run in Electron's Node with no page, and a page for them is a dependency `frame/plan.md` *Operational impact* says the work does not add. What the page says and sends is in `src/renderer/view.ts` and `src/main/pick-folder.ts`, which have cases.
- **The list in the window opens nothing.** A work item listed after a restart has no pane, and the window offers no way to open one in it, though the protocol's `start` takes a `workItemId`. `frame/design.md` *Scope* item 8 asks for the list and for a pane at creation; opening a work item from a list is the inbox of issue #7.
- **The daemon accepts an empty `repo`.** Git then runs in the daemon's own folder, so a client that sends one makes a work item of whatever repository that folder is in. The window never sends one. The app starts the daemon in the user's home, which is rarely a repository. The refusal belongs in `createWorktree`, phase 1's unit, and phase 2's row is the window.
- **A creation cannot be cancelled.** Closing the form while the daemon works does not stop it, and the pane opens when the answer comes. The protocol has no message for it.
- **A daemon whose run directory has a long path does not start, and the window says nothing.** The hook socket's path is then longer than a Unix socket's may be. Seen once, with Electron's `--user-data-dir` under a long scratch path; the app's own path is short. The socket is issue #4's and the wait for the daemon issue #5's.
