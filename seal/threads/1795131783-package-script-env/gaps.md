# Closing memo: 1795131783-package-script-env

## Not verified

| Item | Who must answer |
|---|---|
| closed The desktop suite, the typecheck of the whole app and the repository's broad gate. The session ran `test/pty.test.ts` (12 passed) and `pnpm run typecheck` (exit 0) at `4b52c19` | executed: the orchestrator's broad run at `b116d19` (`trail/gate.md`), after the merge of `release/v0.0.1` at `0f985af`: 19 case files, 479 passed and 1 skipped, with the app started under `OWLERY_BACKGROUND=1` |
| A Claude Code pane of the app started with `pnpm -C apps/desktop start`, whose plugin hooks that run `node` succeed. The session ran a login `zsh` in a pseudo-terminal from the owner's work item folder twice: with `npm_config_prefix` set it found no `node`, and with the variables this change drops taken out it found `~/.nvm/versions/node/v26.13.1/bin/node` (`executed`). No start of the app ran a pane | the owner at the window, after the daemon left running from the earlier build exits |

## Not done

A pane still inherits every other variable of the process that started the app. Only the variables this change names, and the ones Electron and a Claude Code session give, are taken out; a variable another launcher sets is not known here.
