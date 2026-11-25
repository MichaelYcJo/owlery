# Changelog: five comments name the panes that hold the runner of heavy commands

Issue #237. Comments in `apps/desktop/src/daemon/hooks.ts`, `pane-chain.ts` and `main.ts` said every pane names the runner of heavy commands in `OWLERY_RUN`. A sign-in pane does not, so a reader who trusted them would expect a heavy command typed in a sign-in pane to wait its turn.

- **The comments say which panes hold `OWLERY_RUN`: a shell, a Claude Code pane and a worktree setup pane, where the daemon wrote the runner.** A sign-in pane holds none. Nothing behaves differently.
- **The desktop app's version is 0.0.5, and this repository's pull requests are checked by Owlery's check at 0.0.5.** `.github/workflows/owlery-seal.yml` fetches the check from the tag `v0.0.5`, or from `release/v0.0.5` until the tag exists.
