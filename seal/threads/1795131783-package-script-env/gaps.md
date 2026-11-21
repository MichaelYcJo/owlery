# Closing memo: 1795131783-package-script-env

## Not verified

| Item | Who must answer |
|---|---|
| closed The desktop suite, the typecheck of the whole app and the repository's broad gate. The session ran `test/pty.test.ts` (12 passed) and `pnpm run typecheck` (exit 0) at `4b52c19` | executed: the orchestrator's broad run at `b116d19` (`trail/gate.md`), after the merge of `release/v0.0.1` at `0f985af`: 19 case files, 479 passed and 1 skipped, with the app started under `OWLERY_BACKGROUND=1` |
| closed A Claude Code pane of the app started with `pnpm -C apps/desktop start`, whose plugin hooks that run `node` succeed. The session ran a login `zsh` in a pseudo-terminal from the owner's work item folder twice: with `npm_config_prefix` set it found no `node`, and with the variables this change drops taken out it found `~/.nvm/versions/node/v26.13.1/bin/node` (`executed`). No start of the app ran a pane | a measurement no record asks for, closed at the settle of release 0.0.1: the owner's hand check of 2026-11-21 in the app started by `pnpm --filter @owlery/desktop start` at `5bd94bf`, written on #24, put a real Claude Code session to work in a pane of an app started by `pnpm` and named no failing hook; the user's own plugin hooks are not Owlery's, and the answer would decide nothing Owlery ships. No open issue, failed run or other rule rests on the answer, so nothing is opened |

## Not done

A pane still inherits every other variable of the process that started the app. Only the variables this change names, and the ones Electron and a Claude Code session give, are taken out; a variable another launcher sets is not known here.
