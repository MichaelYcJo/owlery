# Design: work items

The ticket is issue #6.

## Grounding

The tree as read at `fce9aea`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/product.md` *File explorer and editor*, "Each work item shows its own tree" | Each work item runs in its own worktree, a separate folder checked out from the same repository |
| `docs/product.md` *Foundation*, first paragraph | The work item is the unit the inbox lists, one line each; the inbox itself is issue #7 |
| `docs/product.md` *File explorer and editor*, "A new worktree has no `.env` of its own" | Owlery does not copy ignored files into a new worktree in this work; setup scripts and ports are milestone 4 (`docs/roadmap.md` *Milestones*, row 4) |
| `docs/architecture.md` *State lives in three places* | Work items are the daemon's state, not the repository's: nothing is committed to the user's repository by creating one |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 and 2 | The new protocol messages carry no vendor-specific field |
| `apps/desktop/src/daemon/daemon.ts` `Daemon#handle`, case `start`, and `DaemonOptions.cwd` | Today every pane opens in one folder, the daemon's `cwd` |

## Scope

1. A work item is `{ id, title, repo, branch, worktree, createdAt }`: `repo` is the repository's top-level folder, `branch` the branch cut for it, `worktree` its folder.
2. Creating a work item runs `git worktree add -b <branch> <worktree> HEAD` in the repository, so the branch starts at the repository's current `HEAD`.
3. The branch is `owlery/<slug>`, where the slug is the title lower-cased, with every run of characters outside `a-z0-9` turned into one `-` and the ends trimmed, cut to 40 characters; an empty slug is `work-item`. Where the branch or the folder exists, `-2`, `-3` and so on are appended to both until neither exists.
4. The worktree folder is `<root>/<repo name>/<slug>`, where `<root>` is `OWLERY_WORKTREES` when set and `~/.owlery/worktrees` otherwise. The folder lives outside the user's repository and holds no space Owlery put there.
5. A folder that is not inside a git repository is refused with an error the window shows; nothing is created.
6. The daemon keeps the list of work items in `work-items.json` in its run directory, mode 0600, and reads it at start, so the list outlives the daemon. Sessions do not outlive the daemon, as today.
7. A pane can open in a work item: the `start` message names the work item, and the pane's process runs in its worktree. A pane started without one opens where it does today.
8. The window has a "+ Work item" control that asks for the repository folder and a title and which kind of pane to open (Claude Code or Shell), creates the work item, and opens that pane in it. A tab of a work item's pane is labelled with the work item's title, then the pane's kind and number (`<title> · <kind> <id>`), because two work items may share a title and one work item may hold several panes. The window lists the work items `ready` carries.
9. Out of scope: deleting or archiving a work item and its worktree (milestone 4), setup scripts and ports (milestone 4), the inbox's states (issue #7), choosing the base branch (the repository's `HEAD` is used).

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A person creates a work item | Given a git repository, when a work item titled "Fix the login bug" is created, then the branch `owlery/fix-the-login-bug` exists in the repository, the folder `<root>/<repo>/fix-the-login-bug` is a worktree of it on that branch, and a pane opens with its process in that folder | A case in a temporary repository checks `git branch --list`, `git worktree list --porcelain` and the pane's working directory (a pane that runs `pwd`); the built app is driven once and the result recorded |
| 2. Two work items run side by side | Given two work items of one repository, when a file is written in one worktree, then the other worktree does not hold it, and each worktree is on its own branch | A case writes a file in one and checks the other |
| 3. A second work item with the same title | Given a work item titled "Fix the login bug", when another with that title is created, then its branch is `owlery/fix-the-login-bug-2` and its folder `fix-the-login-bug-2` | A case |
| 4. A folder that is not a repository | When a work item is created on a folder outside any git repository, then the daemon answers with an error and creates no branch, no folder and no list entry | A case |
| 5. The list outlives the daemon | Given a work item, when the daemon is stopped and started again, then `ready` lists the work item | A case restarts a `Daemon` on the same run directory |
| 6. The list file is the user's alone | The file `work-items.json` has mode 0600 | A case |
| 7. Nothing vendor-specific crosses the protocol | The new messages carry only the fields this design names | A case checks the keys of `workItemCreated` and of the work items in `ready` |

## Data & interfaces

Protocol additions in `apps/desktop/src/shared/protocol.ts`:

- `WorkItem`: `{ id: number; title: string; repo: string; branch: string; worktree: string; createdAt: number }`.
- `SessionInfo` gains `workItemId: number | null`.
- Client: `{ type: "createWorkItem"; requestId: number; repo: string; title: string; kind: PaneKind; cols: number; rows: number }`. The `start` message gains an optional `workItemId`.
- Server: `ready` gains `workItems: WorkItem[]`. `{ type: "workItemCreated"; requestId: number; workItem: WorkItem; session: SessionInfo }` answers a creation and carries the pane it opened, which the creating client receives the output of, as with `started`. `{ type: "error"; requestId: number; message: string }` answers a request that failed.

The git work goes in a new module `apps/desktop/src/daemon/worktrees.ts`, and the list in `apps/desktop/src/daemon/work-items.ts`. The window gets the repository folder from a native folder dialog through one new channel of the preload, `pickFolder()`, run by the main process; a text field may stand beside it.

## Rule changes

- nothing
  why: the work builds what `docs/product.md` and `docs/roadmap.md` milestone 1 already state, and the choices above are of the implementation; the worktree location is named in `changelog.md`.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| nothing | | The work adds messages and modules; the pane opened without a work item stays as it is |

Framed 2026-11-19 by the session, before the build.
