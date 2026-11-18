# Phase 1: 1795016925-work-items

## What this phase found

**The frame holds.** Every path `frame/design.md` *Data & interfaces* and `frame/plan.md` *Technical context* name was opened at `30f2ddc` and is where the frame says: `apps/desktop/src/daemon/daemon.ts` with `Daemon#handle` case `start` and `DaemonOptions.cwd`, `src/shared/protocol.ts`, and `test/daemon.test.ts`. The phase built to the frame, with the departures and additions below.

**What phase 2 needs: the protocol, as `apps/desktop/src/shared/protocol.ts` now states it.**

- `WorkItem`: `{ id: number; title: string; repo: string; branch: string; worktree: string; createdAt: number }`.
- `SessionInfo`: `{ id; kind; alive; workItemId: number | null }`. The window labels a tab by looking `workItemId` up in the work items it holds.
- The client sends `{ type: "createWorkItem"; requestId; repo; title; kind; cols; rows }`. `repo` may be any folder inside the repository; the daemon stores the top-level folder. The `start` message takes an optional `workItemId`.
- The daemon answers a creation with `{ type: "workItemCreated"; requestId; workItem; session }`, and the creating client receives that pane's output with no `attach`, as after `started`. The window has to add the work item to its own list at this message, because `ready` is sent once per connection and no other message carries the list.
- `ready` is `{ type: "ready"; sessions; workItems }`.
- `{ type: "error"; requestId; message }` answers a `createWorkItem` or a `start` that failed. Nothing was created or started. The window must drop the terminal it prepared for that `requestId` and show `message`. The messages are: `<folder> is not inside a git repository`, `a work item needs a repository folder and a title`, `no work item <id>`, `the folder of work item <id> is gone: <folder>`, and git's own error text where `git worktree add` fails. A repository with no commit should be such a failure; that was read from the code and not run.
- Only the creating client learns of a new work item. A second window connected at the same time learns of it at its next `ready`. Phase 2 has one window, so nothing was broadcast.

**How a pane's working directory is chosen** (`Daemon#handle` and `Daemon#startSession` in `daemon.ts`). A `start` with no `workItemId` runs in `DaemonOptions.cwd`, which `src/daemon/main.ts` sets to `OWLERY_CWD` or the user's home, as before. A `start` with a `workItemId`, and the pane a `createWorkItem` opens, run in that work item's `worktree`. Sessions that outlive a window keep their `workItemId` in `ready`.

**No file outside the daemon and the protocol changed.** The typecheck passed with `src/renderer/`, `src/preload/` and `src/main/` untouched: the renderer's `switch` over the server's messages has no exhaustiveness check, so it ignores `workItemCreated` and `error` until phase 2 handles them.

**Decisions made while building, each judged against `frame/design.md` *Scope* unless another document is named.**

- *A slug cut at 40 characters loses a dash the cut left at its end.* Item 3 trims the ends and then cuts, which can leave `…-` as the last character and a branch `owlery/…-`. `slugFor` trims once more after the cut. Grounds: item 3's own rule that the ends are trimmed.
- *The suffix is counted from 2 per name, by looking at the repository and the folder.* The daemon's list is not consulted, so a branch or a folder the list no longer knows still pushes the next name on. Grounds: item 3, "where the branch or the folder exists".
- *Creations run one after another in the daemon.* Two `createWorkItem` messages of one title sent together would otherwise both find the name free and one `git worktree add` would fail. Grounds: scenario 3.
- *The repository is found with `git rev-parse --show-toplevel` from the folder given.* A folder that does not exist gets the same refusal as a folder outside a repository. A folder that is itself a worktree of a work item is accepted, and its work item is named for that worktree's folder; nothing in the frame refuses it.
- *A `start` that names a work item the daemon does not hold, or one whose folder is gone, is answered with `error` and starts nothing.* The frame gives `error` as the answer to "a request that failed" and does not list these two. Grounds: item 7, where the pane's process runs in the worktree, which cannot hold when there is none.
- *A `createWorkItem` whose `repo` or `title` is not a string is answered with `error`.* Without the check the daemon's message handler would throw on a malformed message from a client that holds the token.
- *`work-items.json` holds the bare array of work items, written to a partial file and renamed*, the way `src/daemon/discovery.ts` writes `daemon.json`. A file that is not such an array reads as an empty list, and the next creation overwrites it. Judged against `frame/plan.md` *Technical context*, whose failure scenario already covers a lost list.
- *A work item's id is one more than the highest id in the list*, so ids go on after a restart. Session ids still start at 1 in each daemon, as before.
- *`DaemonOptions` gained `runDir`, `worktreesRoot` and `now`.* `runDir` is where the list is kept, and a `Daemon` given none keeps the list in memory, which is what the existing cases construct. `worktreesRoot` defaults to `worktreesRoot(process.env)`, which reads `OWLERY_WORKTREES`. The cases pass both options into a temporary folder, so none writes under `~/.owlery`.
- *The worktree's folder is not made canonical.* It is `<root>/<repo name>/<slug>` as joined, so with a root that is a symbolic link the stored `worktree` differs from what `pwd -P` prints in the pane.
- *Where the list cannot be written after `git worktree add` succeeded, the worktree and the branch stay and the client gets `error`.* No rollback was built; deleting a worktree is out of scope (item 9).

**Departure from the plan's row.** *Verified by* names `pnpm -r run check`. That command is the first part of the repository's `Broad gate` in `seal/config.json`, which the orchestrator runs once; this phase ran the three test files it changed in one command, and the package's `tsc --noEmit` before each commit. Judged against the agent contract, rule 2.

**The existing cases the protocol change touched.** Two cases in `test/daemon.test.ts` compared `ready.sessions` to whole objects, and now expect `workItemId: null` in them. A helper for temporary repositories, `test/repositories.ts`, is shared by `test/daemon.test.ts` and `test/worktrees.test.ts`.

**Seen red, then green.** The cases were written first and run against the tree with only the protocol's types added (`pnpm run test test/daemon.test.ts test/worktrees.test.ts test/work-items.test.ts`, exit 1). In `test/daemon.test.ts` the ten cases of `describe("work items")` failed: seven timed out waiting for `workItemCreated` or `error`, "creates a work item…" failed on `ready.workItems` being undefined, and "starts a pane named no work item…" failed on `workItemId` being undefined, its working-directory half being behaviour the base already had. The two existing cases above failed on the missing `workItemId`. `test/worktrees.test.ts` and `test/work-items.test.ts` failed at import, since `src/daemon/worktrees.ts` and `src/daemon/work-items.ts` did not exist; that red shows nothing about each case, and the mutation runs below are what show those cases can fail. After the code, the same command exited 0 with 45 cases passing.

**Mutation, with `seal mutate` after the commit `1732db4`.** Each run printed its baseline as passing.

- `src/daemon/worktrees.ts` against `test/worktrees.test.ts`: 11 mutants, 11 red. They were: the run of characters no longer collapsed, the cut at 41, the empty slug named `item`, the trim after the cut removed, both trims removed, `OWLERY_WORKTREES` ignored, the folder check removed, the branch check removed, `--show-toplevel` replaced, the repository's name dropped from the folder, and the `owlery/` prefix dropped.
- `src/daemon/daemon.ts` against the `work items` cases of `test/daemon.test.ts`: 10 mutants, 10 red. They were: `ready` with an empty list, a `start` that ignores the worktree, the unknown-id check removed, the missing-folder check removed, the created pane started in the daemon's folder, `workItemId` always null on a `start`, creations not queued, the field check removed, the list given no run directory, and the created pane's `workItemId` null.
- `src/daemon/work-items.ts` against `test/work-items.test.ts`: 6 mutants, 5 red and 1 survived. The survivor made a list with no run directory write `work-items.json` into the working directory. The case "keeps the list in memory alone…" now asserts no such file appears (`d027620`), and the mutant run again alone was red on that assertion. The five red were: mode 0644, ids counted by two, the shape check removed, `createdAt` fixed at 0, and the write removed.

The multi-mutant runs print each verdict and exit code and not the failing line, so for those 26 red mutants the failing line was not read; the one rerun alone was read.
