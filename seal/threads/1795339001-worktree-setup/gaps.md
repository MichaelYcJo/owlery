# Closing memo: 1795339001-worktree-setup

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite, the typecheck over the whole app and the documents' checks of the `Broad gate` key, at the work item's last commit. Phase 1 ran the six test files `trail/phases/phase-1.md` *Runs and their scope* names, with a typecheck of the changed files and what they import | the orchestrator's broad gate, after the review rounds |
| The built-app test files, none of which phase 1 ran. Each starts `dist/daemon.js`, whose creation now reads the two setup files and whose plan answers two more fields. None of their repositories holds either file | the orchestrator's broad gate |
| The case `the inbox > reads no count while no client is connected, …` of `apps/desktop/test/daemon.test.ts`, which failed once in phase 1's first boundary run under a load average near 20, passed three times alone at the same commit, and passed in the second boundary run at `bfd6e1e`. Whether it fails at the base under the same load was not measured | the orchestrator's broad gate, which measures it at the base too |
| Whether `pnpm install` in a new worktree of Owlery's own repository, made by the built app, ends with node-pty rebuilt for Electron (`frame/questions.md` Q2). The daemon's fallback to `setupPaneCommand(process.env, …)`, the person's interactive login shell, runs in no case | a measurement: one creation in the built app, by the orchestrator or the owner |
| Whether Claude Code reads `.worktreeinclude` by git's rule as this build does (`frame/questions.md` Q3) | a measurement: one `claude --worktree` run with a logged-in Claude Code, by the owner |
| The cases that start panes and read their exit were run on the owner's machine alone | the `macos-latest` runner of the pull request's `check` workflow |
| The built-app test files phase 2 did not run: `ask-section`, `daemon-restart`, `keep-awake`, `korean-input`, `memory`, `role-bundle` and `role-session`. Each builds and starts the app whose window and daemon phase 2 changed. Phase 2 ran `work-item-form`, `work-item-menu`, `terminal-basics` and `notification-click` (`trail/phases/phase-2.md` *Runs and their scope*) | the orchestrator's broad gate |
| The window's detach of the setup pane at a creation, and the style rules of the form's setup line, the line's setup words and the "Setup" section, which no case reads (`trail/phases/phase-2.md` *Not exercised by any case*) | the review rounds, reading the diff |
| The clone through `/bin/cp -c` on a volume that is not APFS, or from a main checkout on one volume to a worktree on another. The cases ran on one APFS volume, and the fallback to Node's copy ran through a stand-in program that fails | a measurement: one creation from a repository on such a volume, by the owner |

## Not done

The exit line a pane prints at its end, `[process exited with code 0]`, does not name the signal that ended its process. The setup's record and its "Setup" section name it, and the line is every pane's, which this work item does not change.

The window does not hold a second press of "Run setup again" before the daemon answers the first. The second `runSetup` is refused with "The setup of work item <id> is still running.", which the status line says, and the inbox that follows the first answer hides the button. A guard would need the window to keep the request until its answer, as the "Ask" field does, for a case only a double press reaches.
