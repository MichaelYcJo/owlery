# Phase 2: 1795400734-accounts-per-repository

## What this phase found

**The frame holds against the tree, with a wider file set than the phase row names.** Before the build the coordinates the phase row and `frame/design.md` *Data & interfaces* name were opened at `d11e711`: `daemon.ts#startSession` is the one place that builds a `PaneStart`, `hooks.ts#claudePaneCommand` writes `exec claude --settings …`, `pane-chain.ts#carriedIn`'s reader takes two arguments, `daemon.ts#readRecords` calls `pluginEnabled` with two, and `claude-plugins.ts#readPlugins` defaults its third parameter to `claudeConfigDir()`. Each says what the frame says of it. Read.

The phase row's *Verified by* cell names ten test files and the five stand-in files. The build changed four more files of cases, and each ran in the phase's run below:

- `pane-kinds.test.ts` pins the list of pane kinds, which gains `accounts`.
- `menu.test.ts` pins the app menu, which gains "Accounts…" (`frame/design.md` *Data & interfaces*, *The window*: the dialog is "reached from the app's menu").
- `screenshots.ts` names the views the screenshot run captures, which gains the Accounts dialog.
- `built-app.ts` holds the comments the fourth row of *Removes* rewrites.

**The six login-shell stand-ins print the lookup's third line.** Each prints `__owlery_config=` with the `CLAUDE_CONFIG_DIR` of its own environment, which `BuiltApp.start` sets to a folder of the case's own. The five files of cases ran once each, alone, after the edit. `fixtures/sample-pane.sh` ran in the screenshot run below. Executed.

**Decisions made while building, each with its grounds.**

- **`PaneStart.configDir` is `string | null`.** `frame/design.md` *Data & interfaces*, *Panes*, writes it as the folder of the pane's account or the person's own. The same section says the reader of plugins reads the daemon's own environment "only while the lookup has given no answer at all". A start built before that answer has no folder to name, so it names null, and `readPlugins` reads `claudeConfigDir()` for null. `carriedIn`'s reader and `pluginEnabled` take `string | null` for the same reason.
- **The adapter's answer is `RoleAdapter.defaultLoginFolder?(): string | null`.** The design asks for "a way for the daemon to ask which folder the agent's default login lives in" and names no method. The method is optional, so the many adapters the cases build by hand stay valid, and an adapter that has none is read as one whose lookup gave no answer. The Claude adapter answers from the lookup it last resolved, and starts no lookup of its own. The fake adapter answers the folder its options name.
- **`PaneKindInfo.accounts` is optional.** The design writes `accounts: boolean`. The protocol's rule for a field of a type that existed before this work makes it optional (`frame/design.md` *The protocol*, and phase 1's same decision in `trail/phases/phase-1.md`). The daemon sends `true` for both kinds.
- **`SessionInfo.accountId` is the account the pane was launched under, and null for a pane launched under none.** A setup pane and a pane of a kind that declares no accounts are launched under none. The last look keeps no account of a pane, as phase 1 left it keeping none of a work item (`frame/design.md` *The protocol*, the bullet on `Look`).
- **A Claude Code pane gets the folder in its command alone, and a shell in its environment alone.** Scope item 7 says so for each. A Claude Code pane's environment would be replaced by the login profile's export, so the command is the one place that holds.
- **The window offers a choice of account only where the daemon keeps an account beside System default.** With System default alone there is nothing to choose, and every name on a line, a view or a tab would be System default. The Accounts dialog's entry in the sidebar's foot shows whenever the daemon sends accounts, and is hidden against a daemon of an earlier build (scenario 14). The app menu's entry is fixed at the app's start, so it stands always, and opens nothing against a daemon that sends no accounts. This keeps the built app's existing pins, the work item menu's items among them, as they were.
- **The Accounts dialog lists no sign-in.** Scope item 10 and scenario 11 say the dialog lists "each one's sign-in". `Account` carries no `signedIn` until phase 3 builds sign-in (`trail/phases/phase-1.md`, the decision on what `Account` holds), so the dialog lists each account's name, its folder and whether it is the default. Phase 3 adds the sign-in to the row.
- **A line names an account after its age, in `--font-fact` and `--ink-faint`, and a tab after its label.** The rule change on `docs/design.md` gives the place and the inks.
- **A repository's chain is read again at the request that changes its account or the default.** `setRepository` reads the repository again where its `accountId` changed, and `setDefaultAccount` reads every repository set to none, each before the inbox goes out. The design's sentence that the daemon reads each repository's `chain` again "at the next reading of commits" once the lookup has answered holds through `readCommits`, which reads every repository at each turn.
- **The screenshot run keeps one handed account.** It writes `accounts.json` before the start, with one account whose folder is an empty one of the run's own, and sets the parked work item to it. No session runs under it, so nothing reads the folder. The inbox's shot then shows a line that names the account, and the settings' shot shows the account's field.

**Cases and their reds.** The new cases ran against the unchanged source before the build: 10 failed in seven files, one for each new case of hooks, pane-chain, claude-plugins, fake-adapter, claude-adapter and accounts. The ten new cases of `view.test.ts` failed against a module that exported none of the functions they call, and five cases of `menu.test.ts` failed against the menu without its entry. The screenshot run's case of the views' names failed before `screenshots.ts` named the new view. Executed.

The three scenario 16 cases of `daemon.test.ts`, the case of a kind that declares no accounts in `accounts.test.ts`, and `pane-kinds.test.ts` were not run red before the build. Each was shown able to fail by `seal mutate`, below.

**Each unit that adds behaviour was broken with `seal mutate`.** 36 units were broken in 42 runs: hooks, pane-chain, claude-plugins, the two adapters, the accounts store, the daemon, the pane kinds, the window's functions in `view.ts` and the app menu. Each unit's last run ended `red`. Executed.

Five units needed a second run:

- **The daemon's test of a kind's `accounts` survived at first**, because every kind in the cases declared it. The case "launches a pane of a kind that declares no accounts under none" (`300adda`) makes it red.
- **The re-reads at `setRepository` and `setDefaultAccount` survived at first**, because the daemon's reading of commits every three seconds read the repository again within the case's wait. The case now starts its daemon with a reading of commits an hour apart (`95c1e6a`), and both runs end red.
- **Two breaks named text that stands twice in its file**, and `seal mutate` refused them. Both were widened to one place and ran red.

**What no case watches in the window's own code.** The drawing in `renderer.ts`, `list.ts` and `work-item-view.ts` was broken by no run:

- the Accounts dialog's rows, its rename field and its add;
- the work item's account dialog;
- the two menus of a new session's account;
- the name on a tab.

The screenshot run passed through the dialog's list, the line's name and the settings' field, and waits on the first two. Executed.

Reading the range against HEAD found one fault there, fixed at `c3adebc`: an `accounts` message emptied the name typed in the dialog and closed a row's rename field, though another client's change had sent it. The dialog now empties them at the `done` of its own request. No case presses the dialog, so the fix ran in no case. Read.

**The first boundary run found five pins the narrow runs had not reached.** Four cases of `daemon.test.ts` pin a pane's whole `SessionInfo` and lacked `accountId`. A fifth compares the look's sessions with the pane the daemon started, and the look keeps no account. They are fixed at `7802122`, and the whole of `daemon.test.ts` then passed, 345 cases. Executed.

**The phase boundary.** One command ran the twelve files at `c3adebc`: the ten the phase row names, `pane-kinds.test.ts` and `menu.test.ts`. 12 files passed, 1053 cases passed and 1 was skipped, the screenshot run's own case, which runs only under `OWLERY_SCREENSHOTS`. Executed. A second run of the set was stopped before it ended, because #146's worktree started a run of its own beside it, and its result is not counted.

**The pull request's screenshots.** The run with `OWLERY_SCREENSHOTS=1` wrote 22 files in Night watch, dark and light: the Accounts dialog, an inbox whose line names "Work", and the settings with the account's field. They stand in the crafter's scratch directory, outside the tree. Executed.
