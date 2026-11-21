# Closing memo: 1795132877-headless-lookup-env

## Not verified

| Item | Who must answer |
|---|---|
| closed The desktop suite, the typecheck of the whole app and the repository's broad gate. The session ran `test/claude-adapter.test.ts` and `test/pty.test.ts` (36 passed) at `6856712` | executed: the orchestrator's broad run at `6856712` (`trail/gate.md`): 19 case files, 480 passed and 1 skipped, with the app started under `OWLERY_BACKGROUND=1` |
| closed A headless session of the app started with `pnpm -C apps/desktop start` whose `PATH` holds the user's `node`. The session ran the lookup's own script in a login `zsh` by hand: with `npm_config_prefix` set and a `node_modules/.bin` folder first, the `PATH` it printed held no nvm folder; without them it held two (`executed`). No start of the app ran a headless session | a measurement no record asks for, closed at the settle of release 0.0.1: the lookup's own script was run by hand with and without the variables, and the answer would decide only a start the fix of #90 already changed; #110's refused headless call starts such a session in the app. No open issue, failed run or other rule rests on the answer, so nothing is opened |

## Not done

The lookup's shell now gets `TERM`, `COLORTERM` and, where the daemon has none, `LANG`, as a pane's shell does. The session itself still receives only the five names `claudeEnv` gives it.
