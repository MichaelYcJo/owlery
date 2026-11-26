# Closing memo: four comments say every pane names the runner of heavy commands

## Scope confirmation

The comments at `apps/desktop/src/daemon/hooks.ts` (the docstring of `paneCommands`), `apps/desktop/src/daemon/pane-chain.ts` (the file's opening comment and the docstring of the runner's launcher) and `apps/desktop/src/daemon/main.ts` (the run folder's comment and the runner's comment) name a shell, a Claude Code pane and a worktree setup pane as the panes that hold `OWLERY_RUN`, and say a sign-in pane holds none. The issue listed four places; the opening comment of `pane-chain.ts` said the same and is the fifth.

## Not verified

| Item | Who must answer |
|---|---|
| closed The whole suite at this branch's head | answered: the broad gate passed at `35fdee35`, the last run of this work item's `trail/gate.md`, after which only the work item's records changed (`git diff --name-only 35fdee35 a42e11be` outside its directory prints nothing); the `check` workflow passed on pull request #255 at `a42e11be`, the head it merged from |

## Not done

nothing
