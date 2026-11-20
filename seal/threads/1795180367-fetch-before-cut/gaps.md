# Closing memo: fetch a remote's branch before a work item is cut from it (#96)

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the project-wide typecheck and the broad gate at the branch's head. Phase 1 ran seven case files and `tsc` over the six files it changed (`trail/phases/phase-1.md`) | the orchestrator's broad gate, after the build's last phase |
| The case files that import a path phase 1 changed and start the built app, which phase 1 did not run: `apps/desktop/test/notification-click.test.ts`, `apps/desktop/test/work-item-form.test.ts`, `apps/desktop/test/work-item-menu.test.ts`, `apps/desktop/test/terminal-basics.test.ts`, `apps/desktop/test/korean-input.test.ts` and `apps/desktop/test/memory.test.ts` | phase 2 for `work-item-form.test.ts`, which it extends, and the orchestrator's broad gate for the others |
| `frame/questions.md` Q1: whether a fetch run by the daemon reaches the owner's remotes, with the app started from Finder and through `pnpm`. Every case fetched from a folder beside a temporary clone, or from a stand-in for ssh | the owner, by a hand run of the built app that opens the form on a repository with a private remote and reads the line under "Starts from" |
| Whether a fetch the daemon gives up ends a real `ssh`. The case ends a stand-in that git started in git's own process group. An `ssh` that keeps a shared connection open in a session of its own is outside that group | the owner, at the same hand run, with a remote that does not answer |
| The flags `--no-recurse-submodules`, `--no-auto-maintenance` and `--quiet` of the fetch. No case and no mutant reads them: no temporary repository holds a submodule or enough objects for maintenance to start | read: the frame's probe ran the same command (`frame/design.md` *Grounding*); a proofer or the sealer reads `apps/desktop/src/daemon/worktrees.ts#askRemote` against it |

## Not done

A fetch given up is ended by `SIGTERM` to git's process group, and nothing follows it with `SIGKILL`. A second signal after a wait was within reach in `apps/desktop/src/daemon/worktrees.ts#askRemote`. It was not taken: git and ssh end at `SIGTERM`, the frame asks for an end and names no second step, and `SIGKILL` on git can leave a `.lock` file in the person's clone.

A daemon that is killed without `Daemon#close` ends no fetch, so git runs on until its transport gives up. Ending the fetches from a handler of the process's exit was within reach in `apps/desktop/src/daemon/main.ts`. It was not taken: `frame/design.md` *Scope* item 8 names the daemon's close, which `main.ts` calls at `SIGTERM` and at the idle exit, and a process killed outright runs no handler.
