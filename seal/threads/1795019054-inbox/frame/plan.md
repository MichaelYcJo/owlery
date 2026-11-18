# Implementation Plan: the inbox

## Technical context

The tree as read at `1abd9ef`.

`apps/desktop`: the daemon in `src/daemon/` (`daemon.ts` with `Daemon`, `agentEvent`, `sendOutput`, the work-item queue; `worktrees.ts`; `work-items.ts`; `agent-events.ts` mapping Claude Code's hooks to neutral events; `main.ts`, which defines `commandFor` and wires the hook server to `Daemon#agentEvent`), the protocol in `src/shared/protocol.ts`, the window in `src/renderer/` (`renderer.ts`, `view.ts`, `index.html`). Tests run with vitest in Electron's Node (`pnpm run test`); `pnpm run check` is the typecheck and the tests.

The window's `Notification` is the web API, which Electron shows as an OS notification; the renderer is sandboxed, so nothing else is needed.

**The failure scenario of the chosen approach.** The state is the last event's, so a session whose agent dies between a permission request and its answer stays `waiting` until the process exits; and a branch rewritten below `baseCommit` (a reset or a rebase) makes `git rev-list --count` count from a commit no longer on it, which reads as a number nobody expects. Both are visible on the line and corrected by the next event or by a new work item.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Each change as its own message (`sessionChanged`, `workItemChanged`) | Every client keeps its own copy of the lists in step, and a missed message leaves it wrong until reconnect | Rejected for the `inbox` snapshot, which is small (a few dozen rows) and always whole |
| Watching the repository's refs with `fs.watch` | macOS reports some ref updates late or as renames of `packed-refs`, and a worktree's `HEAD` lives in the common git directory's `worktrees/` | Rejected for polling at 3 seconds while a client is connected |
| Notifications from the main process | The main process would need its own connection to the daemon | Rejected: the window already holds the connection |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 5 in the daemon and the protocol | Scenarios 1, 3, 4, 5 and 8 as cases, each seen red before its code; the state function and the commit count against temporary repositories | `3e45672` |
| 2 | *Scope* items 3 (the window's side), 6, 7 and 8, and the removals | Scenarios 2, 6 and 7, and scenario 1 and 3 in the built app, driven once through the debugging port; the hook relay of a pane's environment drives the state | `53d3f4e` |

## Overlap with the release

Issue #8 (the headless session) is not started, and no other work item of `release/v0.0.1` is open, so none meets this work.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| | | | |

## Operational impact

The daemon runs `git rev-list` in each work item's repository every 3 seconds while a window is connected. `work-items.json` gains `baseCommit` on new entries; older entries read with `null`. No dependency is added. The version does not move.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-19 | The crafter of every phase runs on Fable 5.2, and the sealer on Opus 5.5 | The owner asked for Fable on this work ("fable로"); a builder on another model than the sealer's | `docs/product.md` *The seal belongs to the product and looks the same everywhere* |
