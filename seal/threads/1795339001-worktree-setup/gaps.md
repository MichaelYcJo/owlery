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

## Not done

The setup's result ignores the signal a pane's process ended by. `TerminalSession.onExit` passes the exit code alone, so a setup command killed from outside the daemon whose process reports code 0 reads `succeeded`. `frame/design.md` *Scope* item 5 reads the result from the exit code, and passing the signal would change `pty.ts`, which the frame does not name. The panes the daemon ends itself are marked before the kill and read `failed` whatever their code.

The copy writes the bytes. Q4's stand-in of 1.0 GB in 32,000 files took 14.3 seconds and 918 MB with Node's copy, and 5.2 seconds and 12 MB with `/bin/cp -c -R -P` (`trail/phases/phase-1.md` *Q4, measured on a stand-in*). `frame/design.md` *Out* leaves a copy that clones on write to a later work item, and Q4's options do too.
