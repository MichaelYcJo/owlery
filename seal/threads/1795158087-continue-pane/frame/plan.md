# Implementation Plan: a Claude Code pane that continues the worktree's latest conversation (#94)

## Technical context

The tree as read at `30c2e59`.

The work builds on the desktop package `apps/desktop`. Every path below is under it.

- `src/daemon/hooks.ts:83-86`, `claudePaneCommand`: the one builder of the Claude Code pane's command. `src/daemon/main.ts:48-51`: `commandFor`, which picks that builder for kind `claude` and adds the pane's id and the hook socket to the environment.
- `src/daemon/daemon.ts:47`, `DaemonOptions#commandFor`; `:244-256`, the case `start`; `:424-426`, where `startSession` calls `commandFor`; `:257-280`, the case `createWorkItem`, which also reaches `startSession` and passes no request to continue.
- `src/daemon/pane-kinds.ts:9-12`, `PANE_KINDS`. `src/shared/protocol.ts:23-27`, `PaneKindInfo`, and `:144`, the `start` member of `ClientMessage`.
- `src/renderer/work-item-view.ts:231-246`, `start` and `showPaneButtons`. `src/renderer/view.ts`, the pure functions the window's cases read.
- `src/daemon/adapters/claude.ts:17-37`, `claudeArgs`, for `frame/design.md` *Scope* item 7 alone.
- `test/hooks.test.ts:182-195`, `test/pane-kinds.test.ts`, `test/daemon.test.ts`, `test/view.test.ts`, `test/claude-adapter.test.ts:27`: the cases beside which the new ones stand. `test/memory.ts:378-383` finds a pane button by its exact text, so one more button moves no existing case.
- `test/built-app.ts:121-127`, `BuiltApp.start`: it starts the built app with a user data folder of its own and sets `OWLERY_BACKGROUND=1`.

Constraints every party holds:

- The owner runs Owlery from the main clone `/Users/michael/Documents/GitHub/owlery`, on `release/v0.0.1`, with a daemon (pid 95337) that uses `~/Library/Application Support/@owlery/desktop/`. No party builds, tests or commits in the main clone, because `test/built-app.ts#buildApp` rewrites the `dist` of the tree it runs in. No party stops that daemon, reads or writes that folder, or creates a work item or a branch in a repository of the owner's.
- The user's `~/.claude/settings.json`, `~/.claude/settings.local.json` and `~/.claude/` files are never changed. A probe that runs the real `claude` runs it in a temporary repository only, and says what it leaves in `~/.claude/projects/`.
- Any start of the app by an agent sets `OWLERY_BACKGROUND=1` through `BuiltApp.start`, as few starts as verification needs.
- The branch is never rebased, no hook is skipped, and no agent pushes.
- Phase 1's measurement needs the owner's login, so it cannot run with a config folder of its own as the framer's probe did. It runs in a temporary repository whose worktrees are under a temporary folder, with the hook settings in a file of its own and a hook socket of its own.
- Phase 2's start of the built app gives the app `OWLERY_WORKTREES` under a temporary folder and a `SHELL` that is a script printing its arguments. `claudePaneCommand` and `loginShell` read `SHELL` from the daemon's environment (`src/daemon/hooks.ts:84`, `src/daemon/pty.ts:76`), so the pane shows the command it was given and no `claude` starts.

The failure scenario of the chosen approach: Claude Code changes what `--continue` means, such as one conversation list for every worktree of a repository, and a continuing pane then opens another work item's conversation with nothing in Owlery to notice. The measurement is dated and versioned for that reason, and #61 replaces the option with a resume by the session's id, which does not depend on it.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| A. Keep the list of kinds as it is, and make continuing a feature a kind declares (`continues`) and a `start` asks for (`continueLatest`). The pane stays of kind `claude`. | The `start` message carries a field that only one kind honours. A second way of starting, such as #61's resume by id, adds another field or replaces this one. | Chosen. The premise that keeps the structure is that a continued session is the same thing as a new one from its first event on. It was checked by reading every reader of a kind (`frame/design.md` *Grounding*, the rows on `view.ts` and `daemon.ts`): the tab, the inbox line, the state line, the count of agents and the form all want the same answer for both. It follows rule 2 of `docs/architecture.md` *Rules that keep it portable*. |
| B. Replace the meaning of a kind: add a third kind, `claude-continue`, with a label of its own, to `PaneKind` and `PANE_KINDS`. The window needs no new code for the button. | The pane is a different kind for as long as it lives: its tab reads "Claude Code (continue)", it is counted apart from the other Claude Code tabs, and its state line reads "Claude Code (continue) asks". The "New work item" form offers it for a worktree that has no conversation, and hiding it there needs a flag or a name the window must not know. Every later work that treats a Claude Code pane specially, as #95 does for Shift+Enter and a dropped image, must cover two kinds. | Rejected. It reads the issue's words "a Claude Code kind" literally and makes a start option into an identity. |
| C. Add nothing to the protocol: one Claude Code button whose command continues where a conversation exists and starts a new one otherwise, as `claude --continue \|\| claude`. | A person who wants a new conversation in a worktree that has one cannot get it. A `claude` that ends with a non-zero code for any reason starts a second one. | Rejected. The issue asks for a choice beside the existing kind. |
| D. The daemon keeps each pane's `session_id` from its hooks and the choice runs `claude --resume <id>`. | It is correct by construction and it is #61: a store on disk, a rule for which id is the work item's, and a list when there are several. | Rejected for this item. The issue names itself the way back until #61. |
| E. For *Scope* item 7, leave the headless session's log on disk whatever phase 1 sees. | Where `--continue` opens the latest log of any kind, a person who used "Ask" after their conversation gets the one-turn "Ask" exchange and cannot reach their conversation from Owlery. | Rejected where phase 1 sees it happen. Where phase 1 sees it does not, nothing is built. |
| F. For *Scope* item 6, Owlery writes a line of its own where no conversation exists, by reading `~/.claude/projects/` before the start or the `source` of the first `SessionStart` after it. | The first reads a format `docs/architecture.md` calls not public. The second writes into the screen of a running CLI. Both are built against a behaviour nobody has seen yet. | Not chosen at the frame. It is weighed again only where phase 1 sees Claude Code say nothing (`frame/questions.md` Q2). |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* item 1. No file of `apps/` changes. | `trail/phases/phase-1.md` holds, with the date and `claude --version`: the command of each run, what the continuing session showed in each of the two worktrees, the line and the exit code where a worktree had no conversation, whether a `-p` session written later was opened, the names of the hook events that arrived from a continued session, and what the runs left under `~/.claude/projects/` and in `~/.claude.json`. Each answer is written into `frame/questions.md` Q1 to Q4 by the party that measured. Where an answer is not the row's default, the orchestrator sends it to the framer before phase 2. | `aa56725` |
| 2 | *Scope* items 2 to 5 and 8, item 7 where phase 1 calls for it, and item 6 as the fold after phase 1 leaves it. | Scenarios 1 to 4 and 7 of `frame/design.md` as cases, each seen red before its code, with `test/hooks.test.ts`, `test/pane-kinds.test.ts`, `test/view.test.ts`, `test/daemon.test.ts` and, for item 7, `test/claude-adapter.test.ts` run by themselves. One start of the built app against a temporary repository, under the constraints above: the pane bar of a work item's view shows the buttons of scenario 1, and a press on the continuing one opens a tab named "Claude Code" whose pane prints `exec claude --settings '<file>' --continue`. The suite, the typecheck and the broad gate are the orchestrator's. | |

Phase 1 leaves the app as it is. Phase 2 leaves it working with the new choice.

## Overlap with the release

The spawn names #93, #31, #95 and #96. #93's frame was read at `6d9246a` of its branch, with its diff against `85c381a`. #31 and #95 hold a `routing.md` alone on their branches (`ce9c41d`, `efde55b`), so each was read as its issue. #96 was read as its issue.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #93 | `src/shared/protocol.ts`: this work changes the `start` member of `ClientMessage` and `PaneKindInfo`, and #93 changes the comment on the line after `start` and the `ready` member. `src/daemon/daemon.ts`: this work changes the case `start` and the call of `commandFor` in `startSession`, and #93 changes hunks around both. `src/daemon/main.ts`: this work changes `commandFor`, and #93 changes the comment four lines above it. `src/renderer/view.ts`, `test/view.test.ts` and `test/daemon.test.ts`: both add to them. No rule or fact of one is read by the other: #93 ends a work item's panes by their ids, whatever started them. | #94 | #94 is one small diff, and #93 is in the second of its phases with most of them unbuilt, so #94 is sealed first. #93 then merges `release/v0.0.1` into its branch inside rounds it spends anyway, and each meeting is a textual one beside lines #93 already owns. |
| #95 | `src/renderer/work-item-view.ts`: this work changes `showPaneButtons`, and #95 adds the key handler, the drop and the confirm before a close. A fact: #95 treats a Claude Code pane specially for Shift+Enter and a dropped image. Under this design a continuing pane is of kind `claude`, so #95 needs no case for it. | #94 | The smaller diff merges first. #95's frame, drawn now, can read this design and rely on one kind. Where #95 is sealed first, the meeting is textual in one file and either order holds. |
| #31 | Possibly `src/renderer/view.ts` and `test/view.test.ts`, where this work adds `paneChoices` and #31 may change `notificationFor`. This work does not change `src/renderer/renderer.ts`, `src/main/` or `src/preload/`. | Either | No line of one reads the other's change. Whichever is sealed first merges first. |
| #96 | Nothing: it changes the fetch before a work item is cut, in `src/daemon/worktrees.ts` and the form, and this work changes neither. | Either | It waits for #93 by the orchestrator's order, not for this work. |

## Operational impact

No migration, no new environment variable and no new dependency. The protocol gains two optional readings: a window of this build shows no continuing button to a daemon of an earlier build, and a daemon of this build serves a window of an earlier build as before. A daemon left running from before the change offers no continuing pane until it is replaced. The pull request moves no version. Phase 2's commit adds `changelog.md`.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
