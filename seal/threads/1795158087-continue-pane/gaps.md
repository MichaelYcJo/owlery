# Closing memo: 1795158087-continue-pane

## Not verified

| Item | Who must answer |
|---|---|
| The desktop suite, the typecheck of the whole app and the repository's broad gate. Phase 2 ran five test files and typechecked the changed files and what they import (`trail/phases/phase-2.md`). It did not run `test/work-item-form.test.ts`, `test/korean-input.test.ts` or `test/memory.test.ts`, which read the changed pane bar through the built app | the orchestrator's broad run, after the review rounds settle |
| That `src/daemon/main.ts` hands the request to `claudePaneCommand`, and that `src/renderer/work-item-view.ts` draws the continuing button and sends `continueLatest`, after any later edit. No case imports either file. One start of the built app at `548e88c` showed both, and nothing in the suite repeats it | the proofer, reading both files in the diff |
| What `claude --continue` shows in a worktree of a repository whose trust question was never answered. Phase 1 answered the question in run 1, before any continuing run, so every `--continue` ran in a trusted repository (`trail/phases/phase-1.md`) | the owner, by pressing the continuing button in a work item of a repository Claude Code has not been opened in |
| What the app's terminal draws when `claude --continue` ends with `No conversation found to continue`. The probe's renderer printed a stray `u` from the sequence `ESC [ < u` that the CLI sends as it ends. The raw bytes hold no printed `u`, and the pane's xterm was not started with a real `claude` | the owner at the window, in a work item with no conversation |
| The hook events `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest` and `Notification` from a continued session. Phase 1 saw `SessionStart`, `UserPromptSubmit` and `Stop` arrive from one. No prompt used a tool | the owner at the window, by a continued session that asks permission, read on the inbox line |
| What a version of Claude Code other than 2.1.329 does with `--continue`. `~/.claude.json` keeps one `lastSessionId` for all worktrees of a repository, which this version's `--continue` does not follow | the owner, when the installed CLI's version moves, by running phase 1's runs 1 to 4 again |

## Not done

Phase 2 added no case that starts the built app and presses the continuing button. `frame/plan.md` *Phases*, row 2, asks for one start of the app and not for a case, and such a case adds an app start to every run of the suite. The price is the second row of `## Not verified`.

Phase 1 did not remove nine lines of `~/.claude/history.jsonl`, three folders of `~/.claude/session-env/` and four files of `~/.claude/backups/` that its runs left. The owner's permission of 2026-11-20 names the folders of `~/.claude/projects/` and the entries of `~/.claude.json`, and forbids a change to any other file of `~/.claude/`. `trail/phases/phase-1.md` names each one.

Phase 1 did not write its four answers into `frame/questions.md`, which `frame/plan.md` *Phases*, row 1, asks of the party that measured. The crafter writes no line of the frame but its Status cell. The orchestrator folds them from `trail/phases/phase-1.md`.
