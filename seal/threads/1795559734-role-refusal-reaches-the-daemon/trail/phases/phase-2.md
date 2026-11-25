# Phase 2: 1795559734-role-refusal-reaches-the-daemon

## What this phase found

**Q3 is answered `none`: with System default's folder set to the case's config folder, the daemon of the hand check reads no path under `.claude` of the person's home.** The answer was reached by reading, as Q3's default says. The runs do not contradict it, and no run traced the daemon's reads of files.

- `git grep -n -e '\.claude' -e 'configDir' -e 'homedir()' -e 'defaultLoginFolder' -- apps/desktop/src/daemon` lists the daemon's readers of a Claude Code folder (executed). They are `claude.ts#defaultLoginFolder`, read through `daemon.ts#foldersOf`; `claude-plugins.ts#readPlugins` and `claudeConfigDir`; and `claudeLogins`, which takes `defaultLoginFolder` as its own folder.
- `daemon.ts#foldersOf` is reached by `conversationsOf`, at `ready`, at each list of accounts and at the read of the agent notice (`daemon.ts:1790` to `:1797`, `:3690`), and by the starts of a pane and the choice of a pane's chain (`:1754`, `:2249`, `:2505`) (read). The hand check's daemon starts no pane: its `commandFor` is a stand-in, and it is given no `pluginEnabled`, so `:2505` reads nothing (`role-session.test.ts`, the `Daemon` the case constructs) (read).
- `defaultLoginFolder` answers null until the lookup has answered, and then the folder the lookup's third line names, before `.claude` of the home (`claude.ts:473`) (read). The stand-in shell now prints that line with the case's config folder. Every read through `foldersOf` in the hand check therefore resolves `projects` under the case's config folder, or reads nothing.
- `readPlugins` and `claudeConfigDir` are reached only from `main.ts` and `pane-chain.ts#carriedIn` (read). Neither runs in the hand check.
- `claudeLogins` runs only on the requests `signIn`, `readSignIn` and `removeAccount`, which the hand check does not send (read in phase 1).

The CLI's read of its version runs with no `CLAUDE_CONFIG_DIR`, because the adapter passes it none for that run (`claude.ts`, `notice`) (read). Its `HOME` is the case's home, so its default folder is `.claude` under the case's home and not the person's. After a run the case's home held nothing, and the case's config folder held `.claude.json`, `backups`, `plugins`, `projects` and `sessions` (executed, one run's kept folder listed).

**The phase's tree differs from phase 1's in three places, each as `frame/design.md` *Data & interfaces* now gives it.** The stand-in shell prints `__owlery_config=` with the case's config folder, and the wrapper script exports no `CLAUDE_CONFIG_DIR`. `launched` returns the case's config folder, null without the stand-in model's address. The stand-in model holds no answer for `count_tokens`. Without the address, the wrapper script's and the stand-in shell's text and the launch are as at `92f94607` (read in the diff). `apps/desktop/package.json` gains `--reporter=default` on `role:refusal` and `role:refusal:sealer` alone.

**Scenario 5's new assertion is red with the stand-in shell's `__owlery_config` line removed.** After the phase's code commit, `seal mutate` rewrote the shell's `printf` so it printed only the lines `__owlery_cli` and `__owlery_path`, ran `pnpm run role:refusal`, and restored the file (executed). The case failed at `role-session.test.ts:205`:

```
AssertionError: the session wrote no conversation into the case's config folder: expected false to be true
```

Without the line, the daemon gave the session no `CLAUDE_CONFIG_DIR`. In that run's kept folder the config folder was empty, and the case's home held `.claude.json` and a `.claude` folder with `projects` (executed, listed). The CLI's writes therefore stayed under the case's home and did not reach the person's folder. The daemon's read of System default's conversations fell back to `.claude` of the person's home, as at phase 1's commit, and opened no file there. The case fails on this assertion before any assertion of the daemon's refusal, so a lost config line does not read as the daemon not refusing.

**Scenario 8's red was seen in phase 1, and the phase's runs show it green.** In phase 1, `pnpm run role:refusal` with no further argument passed and printed no version line (`trail/phases/phase-1.md`, executed there). The six runs below were made with no further argument, and each printed its version line. Run 1 printed:

```
  "version": "2.1.331",
```

**The six runs of scenarios 1, 2 and 8 passed at `e11311c0`.** Each ran after the wait for other Vitest processes, as `OWLERY_BACKGROUND=1 pnpm run <script>` with no further argument, and its exit code was read directly (executed). The script as `pnpm` echoed it ends with `--reporter=default`.

| Run | Script | Exit code | CLI version printed | Reason the stand-in was told | Requests the stand-in received |
|---|---|---|---|---|---|
| 1 | `pnpm run role:refusal` | 0 | 2.1.331 | Owlery gives the proofer no command that asks for permission. | 2 |
| 2 | `pnpm run role:refusal` | 0 | 2.1.331 | the same | 2 |
| 3 | `pnpm run role:refusal` | 0 | 2.1.331 | the same | 2 |
| 4 | `pnpm run role:refusal:sealer` | 0 | 2.1.331 | Owlery gives the sealer no command that asks for permission. | 2 |
| 5 | `pnpm run role:refusal:sealer` | 0 | 2.1.331 | the same | 2 |
| 6 | `pnpm run role:refusal:sealer` | 0 | 2.1.331 | the same | 2 |

All twelve requests were `POST /v1/messages?beta=true`, so no run met the 404 row. After runs 1 and 4 the case's config folder held `.claude.json`, `backups`, `plugins`, `projects` and `sessions`, and the case's home was empty (executed, listed). Scenario 7 still holds: `git grep -n 'REFUSAL_PROMPT' -- apps/desktop` printed nothing and exited 1 at `e11311c0` (executed). The phase boundary's set is these six runs, the `seal mutate` run, and the three test files that read `apps/desktop/package.json`: `records-place.test.ts`, `records-dialog.test.ts` and `korean-input.test.ts` (read: `grep -l 'package.json'` over the test files; each reads the app's `version` or `dependencies`, which this phase did not change). The three ran in one command, `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs` with the three files, and passed: 63 cases passed and 1 was skipped, exit 0 (executed).

**A typecheck of the app passed before the commit.** `pnpm exec tsc --noEmit` in `apps/desktop` exited 0 (executed). It checks the whole app, and it does not stand for the broad gate's typecheck. The repository configures no linter and no formatter.
