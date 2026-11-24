# Merge of the release: 1795400734-accounts-per-repository

## What this phase found

**The merge.** `origin/release/v0.0.3` was merged into this branch at `f0b7e36`, after phase 1 (`9923a8e`) and before phase 2. The release had moved by one commit since `919bb6a`: `66b3991`, the squash of #181's pull request #194. #182 was already on this branch at `18f9158`, the merge base. No rebase was made. Executed.

**Five files conflicted, and each conflict was two fields added on the same line.** #181 added `paneChain` to a stored repository and `chain` to a sent one. Phase 1 added `accountId` to both. Each resolution keeps both fields and changes nothing else of either side:

- `apps/desktop/src/daemon/repositories.ts`, six hunks: the type of a written repository, the store's comment on old files, the read loop, `setRepository`'s fields, its change test and its assignment, and the two literals of a new repository.
- `apps/desktop/src/shared/protocol.ts`, three hunks. `Repository` holds `chain` and `accountId?`. `setRepository` takes `paneChain` and `accountId`, and its comment states both, with `addAccount` and `setDefaultAccount` after it. `getSeal` is gone, as #181 removed it, and `ask` keeps phase 1's `accountId` and its comment.
- `apps/desktop/src/daemon/daemon.ts`, three hunks: the import list, `setRepository`, which passes `paneChain` and `accountId` to the store, and `repositoryOf`, which sends `chain` and `accountId`.
- `apps/desktop/test/repositories.test.ts`, three hunks: `PLAIN` holds both fields, the pin of a set repository holds both, and the two new cases stand side by side, phase 1's on the account and #181's on the chain.
- `apps/desktop/test/daemon.test.ts`, three hunks: `PLAIN` holds `chain: NO_CHAIN` and `accountId: null`, the key list of a sent repository names both, and the second repository's literal holds both.

Read: `git show --remerge-diff f0b7e36` shows each resolution against both sides.

**No port was owed.** The ask comment of phase 1 says that every stage of a chain takes the account `accountFor` gives. That still holds: `Daemon#startChain` runs the chain's stages through `beginHeadless`, which resolves the account, and only the client message that reached it is gone. #181's chain command in a pane writes no ledger entry, so no entry is written without an `account`: `chain-command.ts`, `chain-main.ts` and `stage-records.ts` name the ledger only in comments, and `stage-records.ts` says it keeps none. No source line or case names `getSeal` (`git grep -n -e getSeal -e 'Get a seal' -- apps/desktop/src apps/desktop/test` printed nothing). #181 changed none of `claude.ts`, `adapter.ts`, `fake.ts`, `session-log.ts` or `agent-events.ts` (`git diff --stat 18f9158 66b3991` over them printed nothing). Phase 1's seven test files passed on the merged tree with no edit, below. Executed.

**The merged guards, seen red.** Each line the resolution wrote that carries one side's field was broken by `seal mutate` at `f0b7e36`, against the case of that side, and every mutant went red. Each filter was first run alone, to confirm it selects the case it names. Executed.

| File | Mutants | Cases | What the mutants broke |
|---|---|---|---|
| `repositories.ts` | 3 | `repositories.test.ts -t "keeps the account set"` | `accountId` left out of `setRepository`'s change test, out of its assignment, and out of the read of a repository |
| `repositories.ts` | 3 | `repositories.test.ts -t "keeps the chain a person chose"` | `paneChain` left out of the same three places |
| `repositories.ts` | 2 | `repositories.test.ts` whole | `accountId: 0` in place of `null` in the two literals of a new repository |
| `daemon.ts` | 2 | `accounts.test.ts -t "the daemon's accounts"` | `accountId` left out of `setRepository`'s call to the store, and out of `repositoryOf` |
| `daemon.ts` | 2 | `daemon.test.ts -t "tells a client which chain a repository"` | `paneChain` left out of the same call, and `chosen` set to `null` in `repositoryOf` |

**The cases run.** All of them ran through `node scripts/test-in-electron.mjs` with `OWLERY_BACKGROUND=1`. None of the files starts the built app. Executed.

- Phase 1's seven files, at `f0b7e36`, in one command: `test/accounts.test.ts test/claude-adapter.test.ts test/fake-adapter.test.ts test/repositories.test.ts test/ledger.test.ts test/daemon.test.ts test/chain.test.ts`. Six files passed. `daemon.test.ts` failed 64 of its cases, and 618 of 682 cases passed. Every failure read was the daemon's answer `posix_spawnp failed.` to a pane's start.
- `daemon.test.ts` alone, run again while another worktree's test run held about 240 pseudo-terminals: 51 failed and 291 passed. The count of `/dev/ttys*` reached 527 during that run, and `kern.tty.ptmx_max` is 511. So the failures were of the machine's terminal limit, not of the merge. The other run was not this work's, and it was left running.
- `daemon.test.ts` alone, after that run ended: 342 of 342 passed.

**The typecheck.** A scratch `tsconfig.json` extends `apps/desktop/tsconfig.json` and lists the five resolved files and the files where #181's pane meets this work: `accounts.ts`, `hooks.ts`, `claude-plugins.ts`, `main.ts`, `claude.ts`, `fake.ts`, three files of the window (`view.ts`, `renderer.ts`, `work-item-view.ts`), and the cases of `accounts`, `hooks`, `claude-plugins`, `chain`, `ledger`, `claude-adapter` and `fake-adapter`. `tsc --noEmit` over it, at `f0b7e36`, exited 0. Executed. It is no typecheck of the whole app, which stays the broad gate's.

**What the merged tree says to phases 2 to 5.** Each fact below was read at `f0b7e36`. Statements of the frame that this tree contradicts are listed in the hand-back for the orchestrator's fold, and this record writes none of them into the frame.

- A pane's start is `daemon.ts#PaneStart`: `continueLatest`, `folder`, `base`, `checkout` and `chosen`. `hooks.ts#paneCommands` takes a function of that whole start (`pane-chain.ts#carriedIn`), and not of a folder alone.
- `hooks.ts#claudePaneCommand` writes `exec claude --settings <file>`, then `--plugin-dir <bundle> --append-system-prompt-file <head>` for a pane that carries the chain, then ` --continue` where asked. Its environment from `paneCommands` holds `OWLERY_PANE_ID` and `OWLERY_HOOK_SOCKET`, and `OWLERY_CHAIN` and `OWLERY_BASE` for a pane that carries the chain. `OWLERY_RUN_DIR` reaches a pane only by inheritance from the daemon's environment (`main/daemon-client.ts` sets it, and `pty.ts#terminalEnv` keeps it). `CLAUDE_CONFIG_DIR` is inherited the same way: `terminalEnv` drops no name of it.
- A pane gets a settings file of its own only where the plugin is enabled and the answer is the owl chain. That file is `claude-pane-<pane id>.json` of the run folder, and it holds Owlery's hooks and the edited `enabledPlugins`. It replaces the shared settings file in `--settings`, so a pane is given one settings file in every case, never a second one (`hooks.ts#writePaneSettings`).
- `claude-plugins.ts#readPlugins(folder, checkout, configDir)` takes the config folder, and its default is `claudeConfigDir()`, which reads `CLAUDE_CONFIG_DIR` of the daemon's environment and `.claude` of the home otherwise. Its two callers pass no folder. `pane-chain.ts#carriedIn` calls its reader with `(folder, checkout)`, and `main.ts` gives `DaemonOptions.pluginEnabled` as `(folder, checkout) => readPlugins(folder, checkout)…`.
- The window's choice of a chain stands on `Repository.chain`. `daemon.ts#readRecords` reads it once for each repository, in the main checkout, through `pluginEnabled`, so it says nothing about an account.
- `daemon.ts#followLog` and `session-log.ts` are as they were at `18f9158`. The watch still follows the path of a hook's `transcript_path`.
