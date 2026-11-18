# Implementation Plan: work items

## Technical context

The tree as read at `fce9aea`.

The desktop package `apps/desktop` holds the daemon (`src/daemon/daemon.ts`, `main.ts`, `pty.ts`, `hooks.ts`), the shared protocol (`src/shared/protocol.ts`), the main process that finds or starts the daemon (`src/main/main.ts`, `daemon-client.ts`) and the window (`src/renderer/`). Tests run with vitest inside Electron's Node (`scripts/test-in-electron.mjs`), because `node-pty` is built for Electron's ABI; `pnpm -r run check` runs the typecheck and the tests, and the broad gate runs it.

The daemon spawns each pane with `TerminalSession.spawn` in `DaemonOptions.cwd`, and sends a session's output only to the clients that opened or attached it (`Daemon#sendOutput`). The window reads every message in `onMessage` in `src/renderer/renderer.ts`.

Git is run with `execFile` and arguments, never through a shell, because titles and paths come from the person. A temporary repository for the cases is made with `git init` and one commit in `os.tmpdir()`, and `OWLERY_WORKTREES` points the worktree root into the same temporary folder.

**The failure scenario of the chosen approach.** Worktrees under `~/.owlery/worktrees` are found only through the daemon's list: a person who deletes the list, or a repository moved after its work items were made, leaves folders and branches that Owlery no longer shows, and `git worktree prune` in the repository is what clears them until archiving comes in milestone 4.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Worktrees beside the repository, `<repo>/../<repo>.worktrees/<slug>` | The folder appears in the person's own projects folder, which other tools then index and list | Rejected for the chosen root, which a person can still move with `OWLERY_WORKTREES` |
| Worktrees inside the repository, `<repo>/.owlery/worktrees/` | Every tool that walks the repository walks each worktree again, and the repository needs an ignore line Owlery would have to write | Rejected |
| Worktrees in the app's data folder (`~/Library/Application Support/…`) | The path holds a space, which some scripts and agents' commands do not quote | Rejected |
| **`~/.owlery/worktrees/<repo>/<slug>`, chosen** | See *Technical context* | Chosen |
| The base of the branch chosen by the person | A choice nothing in milestone 1 needs | Deferred: `HEAD` is used |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 7 in the daemon and the protocol: `worktrees.ts`, `work-items.ts`, the new messages in `daemon.ts` and `protocol.ts` | Scenarios 1 to 7 as cases, each seen red before its code, in temporary repositories; `pnpm -r run check` | `d027620` |
| 2 | *Scope* item 8: the window's "+ Work item" control, the folder dialog through the preload, tab labels and the list | The built app driven once: a work item created on a temporary repository through the window (by the remote debugging port or by the folder dialog's text field), its tab label and its pane's `pwd` read; two work items created and checked for scenario 2 | `265e734` |

## Overlap with the release

The spawn names no other open work item of `release/v0.0.1`; the work items of issues #7 and #8 are not started, so none meets this work.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| | | | |

## Operational impact

A new environment variable, `OWLERY_WORKTREES`, moves the worktree root. Owlery now creates folders under `~/.owlery/worktrees` and branches named `owlery/…` in the repositories a person creates work items in. No dependency is added. The version does not move.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-19 | The crafter of every phase runs on Fable 5.2, and the sealer on Opus 5.5 | The owner asked for Fable on this work on 2026-11-19; a builder on another model than the sealer's makes the sealer's reading more independent | `docs/product.md` *The seal belongs to the product and looks the same everywhere* |
