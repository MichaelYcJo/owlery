# Closing memo: four comments say every pane names the runner of heavy commands

## Scope confirmation

The comments at `apps/desktop/src/daemon/hooks.ts` (the docstring of `paneCommands`), `apps/desktop/src/daemon/pane-chain.ts` (the file's opening comment and the docstring of the runner's launcher) and `apps/desktop/src/daemon/main.ts` (the run folder's comment and the runner's comment) name a shell, a Claude Code pane and a worktree setup pane as the panes that hold `OWLERY_RUN`, and say a sign-in pane holds none. The issue listed four places; the opening comment of `pane-chain.ts` said the same and is the fifth. The version moves to 0.0.5 in `apps/desktop/package.json` and in `.github/workflows/owlery-seal.yml`, as the first pull request into `release/v0.0.5`.

## Not verified

| Item | Who must answer |
|---|---|
| Whether `.github/workflows/owlery-seal.yml` at 0.0.5 runs on GitHub: its clone of `v0.0.5` fails until the tag exists, and its clone of `release/v0.0.5` needs that branch on the remote | the orchestrator, from the pull request's checks |

## Not done

nothing
