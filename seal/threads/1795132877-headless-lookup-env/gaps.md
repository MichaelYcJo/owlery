# Closing memo: 1795132877-headless-lookup-env

## Not verified

| Item | Who must answer |
|---|---|
| The desktop suite, the typecheck of the whole app and the repository's broad gate. The session ran `test/claude-adapter.test.ts` and `test/pty.test.ts` (36 passed) | the orchestrator's broad run |
| A headless session of the app started with `pnpm -C apps/desktop start` whose `PATH` holds the user's `node`. The session ran the lookup's own script in a login `zsh` by hand: with `npm_config_prefix` set and a `node_modules/.bin` folder first, the `PATH` it printed held no nvm folder; without them it held two (`executed`). No start of the app ran a headless session | the owner at the window, after the daemon left running from the earlier build exits |

## Not done

The lookup's shell now gets `TERM`, `COLORTERM` and, where the daemon has none, `LANG`, as a pane's shell does. The session itself still receives only the five names `claudeEnv` gives it.
