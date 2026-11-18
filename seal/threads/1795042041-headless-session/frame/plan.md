# Implementation Plan: the headless session

## Technical context

The tree as read at `c796df1`.

`apps/desktop`: the daemon in `src/daemon/` (`daemon.ts` with `Daemon`, `DaemonOptions`, `checkIdle`, `broadcast` and the `ready` message; `main.ts`, which starts the daemon when imported and wires `commandFor`, the hook server and `PANE_KINDS`; `hooks.ts` with `claudePaneCommand`, which launches a pane's `claude` through `$SHELL -l -i -c`), the protocol in `src/shared/protocol.ts`, the window in `src/renderer/` (`renderer.ts`, `view.ts`, `index.html`). Tests run with vitest in Electron's Node (`pnpm run test`); `pnpm run check` is the typecheck and the tests. The installed Claude Code is 2.1.327.

A case cannot import `main.ts`, because importing it starts the daemon; the adapter goes to `Daemon` through `DaemonOptions`, as `paneKinds` does.

**The failure scenario of the chosen approach.** The answer lives in the daemon's memory, so a daemon that exits (the idle exit after the session ends and the window closes, or a crash) loses every answer, and a person who reopens the app later finds the list empty. And a Claude Code release that renames a line of the stream or the `result` fields shows as a session that ends `failed` with "the session exited with code <N> and gave no result", not as a wrong answer; the recorded fixture pins the shape that was seen.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Launch the headless `claude` through `$SHELL -l -i -c`, as a pane does | The interactive login shell runs the user's rc files on every run, and its environment is the user's whole one, which *Role sessions run detached from the user's environment* removes | Rejected: the interactive login shell is asked for `claude`'s path and `PATH` until it finds them once, and the child gets the five names alone |
| A PTY for the headless session | stream-json is line-oriented on pipes; a PTY adds echo, line discipline and terminal escapes to parse | Rejected for pipes |
| Send each text event as its own `output`-like message and let clients assemble the answer | A client that connects mid-run misses the beginning, as the panes needed a replay for | Rejected: each change sends the session whole, which is small |
| Let `ask` run without a work item, in the daemon's folder | `--add-dir` with the user's home makes `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` read the home folder's `CLAUDE.md`, a part of the user's environment the detachment removes | Rejected: `workItemId` is required |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 4 and 7, and the protocol of *Data & interfaces* | Scenarios 2 to 7 as cases, each seen red before its code; one real run of the Claude adapter from a probe outside the suite, whose output lines become the fixture of scenario 5 | `86cb04d` |
| 2 | *Scope* items 5 and 6 | Scenario 1 in the built app, driven once through the debugging port against the real Claude adapter; scenario 8 executed; a case for each decision of the window's `src/renderer/view.ts`, each seen red before its code |`18cfe3c` |

## Overlap with the release

Issues #9 (four visible terminals under about 500 MB) and #10 (the Korean input regression test) are not started; each will start from `release/v0.0.1` after this work merges. #9 may touch the window's panes, which this work does not change.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| | | | |

## Operational impact

Each "Ask" launches the user's `claude` once, which draws on the user's own subscription limit or API billing. The daemon runs `$SHELL -l -i -c` to find `claude`, once per process where the first lookup finds it, and again at each `ask` while it does not. No dependency is added. The version does not move: `0.0.1` was moved by the first pull request into `release/v0.0.1`.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-19 | The crafter of every phase runs on Fable 5.2, and the sealer on Opus 5.5 | The owner chose the answer that keeps the crafter on Fable as in #6 and #7; a builder on another model than the sealer's | `docs/product.md` *The seal belongs to the product and looks the same everywhere* |
