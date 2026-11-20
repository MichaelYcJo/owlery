# Closing memo: fetch a remote's branch before a work item is cut from it (#96)

## Not verified

| Item | Who must answer |
|---|---|
| closed `apps/desktop/test/work-item-form.test.ts`, which imports a path phase 1 changed and starts the built app, and which phase 1 did not run | phase 2 extended it and ran it at `6b3c21c`, exit 0 (`trail/phases/phase-2.md`, *The phase boundary*) |
| `frame/questions.md` Q1: whether a fetch run by the daemon reaches the owner's remotes, with the app started from Finder and through `pnpm`. Every case fetched from a folder beside a temporary clone, or from a stand-in for ssh | the owner, by a hand run of the built app that opens the form on a repository with a private remote and reads the line under "Starts from" |
| Whether a fetch the daemon gives up ends a real `ssh`. The case ends a stand-in that git started in git's own process group. An `ssh` that keeps a shared connection open in a session of its own is outside that group | the owner, at the same hand run, with a remote that does not answer |
| The flags `--no-recurse-submodules`, `--no-auto-maintenance` and `--quiet` of the fetch. No case and no mutant reads them: no temporary repository holds a submodule or enough objects for maintenance to start | read: the frame's probe ran the same command (`frame/design.md` *Grounding*); a proofer or the sealer reads `apps/desktop/src/daemon/worktrees.ts#askRemote` against it |
| The form against a daemon that never answers a `fetchBase` (`frame/design.md` *Scope* item 11). The cases hold the length of the wait and what the form holds once it has passed (`apps/desktop/test/view.test.ts`, "unanswered"). No case ran the timer of `apps/desktop/src/renderer/renderer.ts#showBase`: every daemon a case starts answers, and the wait is twelve seconds | read: the sealer reads `showBase` against item 11. The owner, at the hand run of Q1, where the window is attached to a daemon of an earlier build: the line under "Starts from" reads "Fetching…" and is empty twelve seconds later |
| A `fetchBase` the daemon refuses, shown under the menu (`frame/design.md` *Scope* item 10, "an `error`"). The sentence is held by a case of `baseSays`. No case made the daemon refuse the form's request: the form asks only for a base the daemon's own plan listed, so the refusal needs a branch deleted between the two | read: the sealer reads the `error` case of `apps/desktop/src/renderer/renderer.ts#onMessage` and `takeBase` |
| A failure that arrives after the press of Create for a fetch the form had stopped waiting for. The case of the built app presses Create while the form still says "Fetching…" | read: the sealer reads `apps/desktop/src/renderer/renderer.ts#takeBase` and `createWorkItem` |
| How the line under "Starts from" looks in the dialog: its colour, its space, and a failure's sentence over three lines. No case reads the look, and nobody looked at the window | the owner, at the hand run of Q1 |

## Not done

A fetch given up is ended by `SIGTERM` to git's process group, and nothing follows it with `SIGKILL`. A second signal after a wait was within reach in `apps/desktop/src/daemon/worktrees.ts#askRemote`. It was not taken: git and ssh end at `SIGTERM`, the frame asks for an end and names no second step, and `SIGKILL` on git can leave a `.lock` file in the person's clone.

A daemon that is killed without `Daemon#close` ends no fetch, so git runs on until its transport gives up. Ending the fetches from a handler of the process's exit was within reach in `apps/desktop/src/daemon/main.ts`. It was not taken: `frame/design.md` *Scope* item 8 names the daemon's close, which `main.ts` calls at `SIGTERM` and at the idle exit, and a process killed outright runs no handler.

A branch that could not be fetched is said in the colour of the form's other notes, not in the colour of a failure. Giving the paragraph the class the plan's line takes for a refusal was within reach in `apps/desktop/src/renderer/renderer.ts#showBase`. It was not taken: `frame/design.md` *Scope* item 10 names the sentences and no colour, and the work item is still created, so the line reports and refuses nothing.

## Answered after the build

Rows that stood under *Not verified* until a run or a reading answered them, kept here with their answer.

| Item | How it was answered |
|---|---|
| The suite, the project-wide typecheck and the broad gate at the branch's head. Phase 1 ran seven case files and `tsc` over the six files it changed (`trail/phases/phase-1.md`). Phase 2 ran three case files and `tsc` over the four it changed (`trail/phases/phase-2.md`) | The orchestrator answered it: `seal gate --base origin/release/v0.0.1 --record` passed at `55bdb9d`, suite exit 0, `trail/gate.md` |
| The other case files that start the built app, and so read the daemon phase 1 changed and the window phase 2 changed. Neither phase ran them, since the run allowed one start of the app, under `work-item-form.test.ts`: `apps/desktop/test/notification-click.test.ts`, `apps/desktop/test/work-item-menu.test.ts`, `apps/desktop/test/terminal-basics.test.ts`, `apps/desktop/test/korean-input.test.ts`, `apps/desktop/test/memory.test.ts` and `apps/desktop/test/keep-awake.test.ts` | The orchestrator answered it: `seal gate --base origin/release/v0.0.1 --record` passed at `55bdb9d`, suite exit 0, `trail/gate.md`. The gate runs every case file of `apps/desktop`, these six among them, without `OWLERY_MEASURE_MEMORY` and `OWLERY_KOREAN_TYPED`, so the memory measurement and the typed Korean run did not run. Those two stand for the owner's hand run of #24, as `seal/threads/1795152521-work-item-menu/gaps.md` names them |
