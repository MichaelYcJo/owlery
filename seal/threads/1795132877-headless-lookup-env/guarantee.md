# Guarantee: 1795132877-headless-lookup-env

## Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The broad run stands at the audited commit | `trail/gate.md` (`run: 6856712 against 85b4087`) | `git -C <worktree> log --no-merges --name-only 6856712..HEAD ^85b4087` | holds (`executed`): `6856712` is an ancestor of HEAD `2e0da98`, and only `f3e14a2` (`gaps.md`, `trail/gate.md`) and `2e0da98` (`pr.md`) follow it, all under `seal/threads/1795132877-headless-lookup-env/` |
| The pull request body is `pr.md` above the records' heading and the records' text below it | the body file the prompt names | `seal pr-body seal/threads/1795132877-headless-lookup-env --body <scratchpad>/fix90/body.md --check` | holds (`executed`): exit 0, "matches" |
| The new case is seen red before the fix (issue *Done when* bullet 2) | `apps/desktop/test/claude-adapter.test.ts:185-208` | in a clone at `2e0da98` with `apps/desktop/src/daemon/adapters/claude.ts` restored from `85b4087`: `node scripts/test-in-electron.mjs test/claude-adapter.test.ts -t "asks the login shell with a pane"` | holds (`executed`): 1 failed, at `claude-adapter.test.ts:204`, the shell received `PATH` `<folder>/node_modules/.bin:/usr/bin:/bin` against the expected `/usr/bin:/bin`, and `ELECTRON_RUN_AS_NODE: '1'` stood in what it received. The guard the case names is the one argument `env: terminalEnv(env)` (`claude.ts:139`), so base's code is that guard alone removed |
| The case's `not.toContain("npm_config_prefix")` line pins the same guard | `claude-adapter.test.ts:205` | the same clone and command, with line 204 (`toMatchObject`) deleted in the clone's copy of the case | holds (`executed`): 1 failed, at `claude-adapter.test.ts:204:39` of the shortened file, "expected [ Array(10) ] to not include 'npm_config_prefix'"; the clone's case restored afterwards |
| The adapter's and the pane's cases pass at HEAD (36) | `gaps.md` *Not verified*, row 1 | in the worktree at `2e0da98`: `node scripts/test-in-electron.mjs test/claude-adapter.test.ts test/pty.test.ts` | holds (`executed`): exit 0, 2 files, 36 passed |
| With `npm_config_prefix` set and a `node_modules/.bin` folder first, the lookup's shell printed a `PATH` without nvm; with a pane's environment it held two nvm folders | `gaps.md` *Not verified*, row 2; issue #90 *Cause* table | a probe `test/test_tmp_lookup.test.ts` in the clone: `execFile` of `lookupCommand(env)` (the real `/bin/zsh -l -i -c LOOKUP_SCRIPT`), read with `parseLookup`, once with the daemon's environment plus `npm_config_prefix`, `npm_lifecycle_event` and `/tmp/x/node_modules/.bin` first on `PATH`, once with `terminalEnv` of that environment, as `claude.ts:139` now passes it | holds (`executed`): the first `PATH` held 0 nvm folders and 1 `node_modules` folder, the second 2 nvm folders and no `node_modules` folder; both found `claude` at an absolute path |
| The session receives only the five names `claudeEnv` gives it, and its `PATH` is the lookup's | `gaps.md` *Not done*; `changelog.md` bullet 2 | read | holds (`read`): `claude.ts:45-53` sets `HOME`, `USER`, `PATH` (the lookup's), `LANG` and `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`, and `claude.ts:159` spawns the session with it |
| A daemon left running from before the change keeps the old answer until it exits | `changelog.md` bullet 3 | read | holds (`read`): `claude.ts:134` and `:153` keep the first successful lookup for the daemon process's life; `main.ts:53` builds one adapter per daemon |
| The daemon starts no other process that reads the user's profile with the app's environment | issue #90 *Symptom* ("The headless session still has it") | read: every `execFile`, `spawn(`, `execSync` and `spawnSync` under `apps/desktop/src` | holds (`read`): the list is git in `worktrees.ts:41` (no profile), the panes through `pty.ts:84` with `terminalEnv` (#87), the lookup at `claude.ts:139` with `terminalEnv`, the session at `claude.ts:159` with `claudeEnv`, and the daemon itself from the app (`daemon-client.ts:50`) |
| Nothing the work removes stands | `frame/design.md` *Removes* | none: the work item has no frame, and `changelog.md` names no removal | holds (`read`): nothing to remove |

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | no frame; `routing.md` *Why this way*: the *Done when* names the environment the lookup's shell starts with, `pty.ts#terminalEnv` already builds it for a pane, and the diff is "one argument of one call and its case" | the diff: `6856712` adds the import (`claude.ts:8`), the argument `terminalEnv(env)` (`claude.ts:139`), two sentences of the `lookupCommand` comment, and one case; the issue's two *Done when* bullets | none |
| the build | `6856712`, built by the session (no phase record owed under `Implementation: the session`): the lookup's shell gets `terminalEnv(env)` | issue *Done when* bullet 1 (`terminalEnv` drops the script's and Electron's variables and every `node_modules` folder of `PATH`, `pty.ts:18-36`, `:62-72`); bullet 2 through the red runs above | none |
| the last round | no round: routing answers `straight to the PR` | — | — |
| the changelog | three bullets: the lookup asks with a pane's environment; the session's `PATH` is the terminal's; an old daemon keeps the old answer | the diff, the case, the probe, `claude.ts:134-159` | none |
| the orchestrator's part of the pull request body | `pr.md`: "Part of #90", closing when `release/v0.0.1` reaches `main`; quotes `changelog.md` bullets 1-2 and `gaps.md` *Not verified* row 2, each with its coordinate | `changelog.md`, `gaps.md`, `routing.md`'s merge into `release/v0.0.1`, `docs/roadmap.md` *Releases and the tracker* (the merge into `main` closes the milestone's issues) | none |

## Observations, outside the verdict

- **`pr.md`'s second quote reads "without the variable", where `gaps.md` row 2 reads "without them"** (`read`): the run it quotes removed both `npm_config_prefix` and the `node_modules/.bin` folder, and so did this audit's probe, so neither run shows which of the two takes nvm's folder off `PATH`. The issue's *Cause* puts it on `npm_config_prefix`, as nvm's own message does. The quote changes no claim the verdict rests on.
- **A headless session started from the app's window was not run** (`unverified`, answered by the owner at the window, as `gaps.md` row 2 names): the probe ran the adapter's lookup with the real login shell, not the app's daemon.
- **The suite, the typecheck and the broad gate** were not run by this audit (rule 2): `trail/gate.md` is the orchestrator's run at `6856712`, and only records follow it.
- **Scratch** (rule 17): the clone, the probe and the run logs stand under `<scratchpad>/1795132877-headless-lookup-env/` (`at-base/`, `sealer/`). The probe ran three times, the first two printing nothing the run showed, the third writing its result to `sealer/lookup-probe-result.txt`. The clone's `node_modules` are links to the worktree's, so vitest's cache under the worktree's `apps/desktop/node_modules/.vite` may have been written.

```seal
target: 2e0da989484670411383001dcc1cbb4d182da641 against 85b408736e0fe3cf6714036143d7a81c26a1835a
Verdict: sealed
```
