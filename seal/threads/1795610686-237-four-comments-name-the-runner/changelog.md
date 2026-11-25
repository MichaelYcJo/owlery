# Changelog: five comments name the panes that hold the runner of heavy commands

Issue #237. Comments in `apps/desktop/src/daemon/hooks.ts`, `pane-chain.ts` and `main.ts` said every pane names the runner of heavy commands in `OWLERY_RUN`. A sign-in pane does not, so a reader who trusted them would expect a heavy command typed in a sign-in pane to wait its turn.

- **The comments say which panes hold `OWLERY_RUN`: a shell, a Claude Code pane and a worktree setup pane, where the daemon wrote the runner.** A sign-in pane holds none. Nothing behaves differently.
