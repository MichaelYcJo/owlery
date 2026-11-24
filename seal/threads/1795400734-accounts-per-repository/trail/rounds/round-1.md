# Review round 1: 1795400734-accounts-per-repository

```seal
target: 90d4e04 against release/v0.0.3
```

The range is `c409dbb..90d4e04`. `release/v0.0.3` at `c409dbb` is merged into the branch at `c9ccb11`, so the range holds this work item alone. No earlier round stands, so this round carries no coordinate and no verdict from one. Every fact below was read or run at `90d4e04` by this round. `seal/parity.json` does not stand, so no comparison with an original is owed. The records were read whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and the seven files of `trail/phases/`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. Each quote of `pr.md` was found word for word at the coordinate it names (`frame/design.md` *Scope* items 1, 3, 5, 6, 7, 9, 13 and 14, and `frame/questions.md` Q3, Q5, Q6 and Q8).

The probes ran in a `git clone --no-local` of the branch at `90d4e04` under the round's scratch directory, with the worktree's installed packages linked in, through the repository's runner `node scripts/test-in-electron.mjs` with `OWLERY_BACKGROUND=1`, after `pgrep -f 'vites[t][.]mjs'` found no other run.

## Findings

### 1. A change of a pane's account that waits for the old process re-checks only that the pane is listed, so a second change, the daemon's close or an archive starts a process the daemon no longer follows

```seal
severity: must
location: `apps/desktop/src/daemon/daemon.ts:1705-1763`, `apps/desktop/test/daemon.test.ts:7359-7426`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts` in the round's clone (probes 1 and 2); read `apps/desktop/src/daemon/daemon.ts:1705-1763`, `apps/desktop/src/daemon/daemon.ts:1396-1404`, `apps/desktop/src/daemon/daemon.ts:1975-1992`, `apps/desktop/src/daemon/daemon.ts:2270-2286`, `docs/architecture.md:58`
```

Why it matters: `docs/architecture.md:58`, which `frame/design.md` *Grounding* cites for this work, says that "one conversation is not opened in two processes". `Daemon#changeAccount` checks the pane's state before it kills the old process, then awaits `session.exited` (`daemon.ts:1735`). After the wait it checks one thing, that the pane is still in `this.sessions` (`daemon.ts:1737`). Three things can happen during the wait, and none of them is checked:

- **A second change of the same pane.** Nothing refuses a request while `session.replacing` holds. Probe 1 sent two `changeAccount` requests for one pane back to back. Both were answered `done`, and the stand-in shell recorded two starts of `claude --resume 'a99099b6-accd-47d0-853b-547820b31e6d'` after the one `end`. The first new process is then held by no `Session`, since `session.terminal` names the second. A close of the pane kills only the second, and the first keeps the conversation open until the daemon's own process ends. The window's dialog sends one request per answer (`work-item-view.ts:1072-1079`), but a second client, or a second dialog after a refusal, still sends one.
- **The daemon's close.** `Daemon#close` sets `this.closed`, kills each live pane and does not remove it from `this.sessions` (`daemon.ts:693-703`). Probe 2 closed the daemon 50 ms after the request. The stand-in recorded a new `start … --resume …` after the close.
- **An archive or a removal of the pane's work item.** `#endSessions` sets `session.ended` and kills the pane, and it leaves the pane listed (`daemon.ts:1975-1992`). The change then starts a new process in a work item the archive has ended. Read, not run.

The account the pane changes to is not checked again either. A removal of that account whose logout finishes during the wait removes it, and the pane then starts under `foldersOf(to)` of an account the daemon no longer keeps, which gives no folder, while `info.accountId` names the removed id. Read, not run.

The wait also has no bound. `node-pty` kills with a hangup, and `docs/architecture.md:58` records that a process that ignores the hangup of its terminal outlives the daemon. Such a process leaves the request unanswered and `replacing` set. `#endSessions` bounds the same wait by `END_WAIT_MS`. The snippet below does not bound it, and the fix pass owes either a bound with a refusal or a sentence in `frame/design.md` *Scope* item 9 that says why the wait is unbounded.

The refusals case at `daemon.test.ts:7359` covers a pane closed while its process ends (`daemon.test.ts:7411-7418`) and none of the three above.

```ts
// apps/desktop/src/daemon/daemon.ts, Daemon#changeAccount: after the check of info.alive
      if (!info.alive) throw new Error("The pane's process has ended, so it has nothing to move to another account.");
      // One change at a time: a second change while the first waits would start a second process on the conversation.
      if (session.replacing) throw new Error("The pane's account is being changed already.");
// ... unchanged down to the wait, which then reads:
      session.replacing = true;
      session.terminal.kill();
      await session.exited;
      session.replacing = false;
      // What ended the pane while its process ended: its close, an archive or a removal of its work item, or the daemon's close.
      if (this.closed || session.ended || this.sessions.get(id) !== session) throw new Error("The pane was closed before its account changed.");
      if (!this.accounts.holds(to)) throw new Error(`No account ${String(to)} is kept.`);
```

```ts
// apps/desktop/test/daemon.test.ts, the refusals case at line 7359, before "A pane whose process ended has nothing to move"
    // Two changes of one pane sent together: the second is refused, and one process at a time runs the pane.
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 26, workItemId: workItem.id, accountId: 1 });
    const twice = (await c.message("started", (m) => m.requestId === 26)).session;
    await launches(twice.id, 1);
    c.send({ type: "changeAccount", requestId: 27, id: twice.id, accountId: 0 });
    c.send({ type: "changeAccount", requestId: 28, id: twice.id, accountId: 0 });
    expect(await answer(28)).toEqual({ type: "error", requestId: 28, message: "The pane's account is being changed already." });
    expect(await answer(27)).toEqual({ type: "done", requestId: 27 });
    await new Promise((r) => setTimeout(r, 300));
    expect((await launches(twice.id, 3)).filter((line) => line.startsWith("start "))).toHaveLength(2);
```

```seal
verdict: fixed 1d9beac
answer: Applied the record's refusal while `replacing` and its re-check of the daemon's close, the pane's end and `holds(to)` after the wait, and bounded the wait by `endWaitMs ?? END_WAIT_MS`, refusing with "The pane's process did not end in time, so its account was not changed. The pane ends once its process exits." The exit watch now gives up the replacement where the pane was ended, so an archive's or a close's exit is reported as the pane's end (`9910192` narrowed that test to `session.ended`, which the pane's close sets too), and a pane whose new account was removed during the wait stays ended under its own account and says why. The record's case stands in the refusals case of `daemon.test.ts`, and two new cases cover the removed account, the archive, the daemon's close and the bound. Before the fix the second change, the removal and the bound were each answered `done` (red); all six change cases pass after it, and 8 of 8 mutations of the new checks went red. `9f3fb38` names the new refusals in the protocol's comment on `changeAccount`. Scope item 9's list of refusals in `frame/design.md` does not name them, which is the frame's to fold.
```

### 2. The pull request changes the window and carries no screenshot, though the design document and scenario 11 ask for them

```seal
severity: must
location: `seal/threads/1795400734-accounts-per-repository/pr.md`, `docs/design.md:501`, `docs/design.md:509`, `seal/threads/1795400734-accounts-per-repository/frame/design.md:184`, `seal/threads/1795400734-accounts-per-repository/trail/phases/phase-2.md:56`
evidence: executed `ls seal/threads/1795400734-accounts-per-repository`, which lists no `screenshots`; read `docs/design.md:499-509`, `seal/threads/1795497826-pane-carries-the-chain/pr.md:13-22`, `seal/threads/1795400734-accounts-per-repository/trail/phases/phase-2.md:56`, `seal/threads/1795400734-accounts-per-repository/trail/phases/phase-3.md:50`
```

Why it matters: `docs/design.md` *A pull request that changes the window carries its screenshots* says that such a pull request "carries a screenshot of each view it changed, in Night watch's dark and light appearances", and that "The files are committed with the change" in the pull request's own records under `seal/threads/`, each shown in the body as `![what it shows](../blob/<commit>/<path>?raw=true)`. `frame/design.md` scenario 11 says "Screenshots of the dialog and of such a line are in the pull request". This work changes the inbox's line, the settings dialog, a work item's view and menu, a pane's tab and menu, and adds the Accounts dialog. The work item holds no `screenshots/`, and `pr.md` holds no `### Screenshots`. The phase records say the 22 files "stand in the crafter's scratch directory, outside the tree" (`phase-2.md:56`, `phase-3.md:50`), and `gaps.md` *Not done* says "Nothing within phase 2's reach". #181's work item shows the form this repository uses (`seal/threads/1795497826-pane-carries-the-chain/pr.md:13-22`).

The views this work changed, by the run's names (`apps/desktop/test/screenshots.ts`, `VIEWS`): `inbox`, `view`, `menu`, `settings` and `accounts`. The fix pass runs the screenshot command at the branch's head, so the files show the window as the pull request merges it.

```sh
# in apps/desktop, at the branch's head; the run builds the app and starts it in the background
OWLERY_BACKGROUND=1 OWLERY_SCREENSHOT_DIR="$SCRATCH/shots" pnpm run screenshots
mkdir -p ../../seal/threads/1795400734-accounts-per-repository/screenshots
for view in inbox view menu settings accounts; do for look in dark light; do
  cp "$SCRATCH/shots/night-watch-$look-$view.png" ../../seal/threads/1795400734-accounts-per-repository/screenshots/
done; done
```

```markdown
<!-- seal/threads/1795400734-accounts-per-repository/pr.md, after the Scope quotes and before "### Open rows"; COMMIT is the full id of the commit that adds the files -->
### Screenshots

![Night watch dark, accounts](../blob/COMMIT/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-dark-accounts.png?raw=true)
![Night watch light, accounts](../blob/COMMIT/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-light-accounts.png?raw=true)
![Night watch dark, inbox](../blob/COMMIT/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-dark-inbox.png?raw=true)
![Night watch light, inbox](../blob/COMMIT/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-light-inbox.png?raw=true)
![Night watch dark, settings](../blob/COMMIT/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-dark-settings.png?raw=true)
![Night watch light, settings](../blob/COMMIT/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-light-settings.png?raw=true)
![Night watch dark, view](../blob/COMMIT/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-dark-view.png?raw=true)
![Night watch light, view](../blob/COMMIT/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-light-view.png?raw=true)
![Night watch dark, menu](../blob/COMMIT/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-dark-menu.png?raw=true)
![Night watch light, menu](../blob/COMMIT/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-light-menu.png?raw=true)
```

The issue's *Done when* names no screenshot. The policy and the frame do, so they are owed.

```seal
verdict: fixed 9202d1fce0eb68db6651d81b25dcff3f65195fb6
location: `seal/threads/1795400734-accounts-per-repository/screenshots`
answer: Built the app and ran `OWLERY_BACKGROUND=1 OWLERY_SCREENSHOT_DIR=<the fix pass's scratch> pnpm run screenshots` alone at `9910192`, after no other run was found: 1 case passed and the run wrote 22 files. The ten of the views `inbox`, `view`, `menu`, `settings` and `accounts`, in Night watch dark and light, were committed in one commit under the work item's `screenshots/`, which the finding's location does not name. `pr.md`'s `### Screenshots` is the orchestrator's to write with that commit. The Accounts dialog's row of the stored account shows the run's temporary folder by its path, as the screenshot run's scene makes it.
```

### 3. A removal trusts the `made` flag of `accounts.json`, so an edited file has Owlery sign out and delete a folder it never made

```seal
severity: should
location: `apps/desktop/src/daemon/accounts.ts:109`, `apps/desktop/src/daemon/accounts.ts:254`, `apps/desktop/src/daemon/daemon.ts:1645-1652`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts` in the round's clone (probe 4); read `apps/desktop/src/daemon/accounts.ts:39-41`, `apps/desktop/src/daemon/accounts.ts:100-117`, `apps/desktop/src/daemon/accounts.ts:250-260`, `seal/threads/1795400734-accounts-per-repository/frame/design.md:141`
```

Why it matters: the store reads `made` from the file as it stands (`accounts.ts:109`), and `isStoredAccount` checks only that it is a boolean (`accounts.ts:40`). `AccountStore#remove` then runs `rmSync(account.folder, { recursive: true, force: true })` for any account read as made (`accounts.ts:254`). Before that, `Daemon#removeAccount` runs the adapter's `signOut`, which is `claude auth logout` with that folder as `CLAUDE_CONFIG_DIR` (`daemon.ts:1645-1652`). Probe 4 wrote an `accounts.json` whose account 1 is `made: true` with a folder outside `accounts/`, and `remove(1)` deleted that folder and the file in it. `frame/design.md` *Scope* item 6 names an `accounts.json` that "was lost or edited" as a case the daemon meets at its start. With the person's own config folder as such an account's folder, a removal signs the person's own login out and deletes their folder. *Scope* item 2 says of a folder handed over that Owlery "never deletes it". The store can tell the two apart from the path alone, because `addMade` makes `accounts/<id>` of the run folder and nothing else.

```ts
// apps/desktop/src/daemon/accounts.ts, AccountStore's constructor, in place of the line at 109
    // A folder is read as made only where it is the one the store makes for its id, so an edited file never has a removal sign out
    // and delete a folder Owlery did not make. The comparison is of paths as `addMade` joins them; a run folder moved elsewhere
    // reads its made folders as handed over, which are never removed.
    const file = this.file;
    const madeAt = (id: number): string => join(dirname(file), MADE_FOLDERS, String(id));
    const accounts = value.accounts.map(({ id, name, adapter, folder, made, signedIn, loginEndsAt, limits }) => ({ id, name, adapter, folder, made: made && folder === madeAt(id), signedIn: typeof signedIn === "boolean" ? signedIn : null, loginEndsAt: typeof loginEndsAt === "number" && Number.isFinite(loginEndsAt) ? loginEndsAt : null, limits: limitsOf(limits) }));
```

The case belongs in `apps/desktop/test/accounts.test.ts`, in the `AccountStore` group beside the case at line 197, which already reads an account in the file that is no account. The class docstring at `accounts.ts:78-92` says what the store reads of a file, and it owes the same sentence.

```seal
verdict: fixed 73110d3
answer: Applied the record's reading: the store reads an account as made only where its folder is `accounts/<id>` of the run folder, and the class docstring says so. The new case of the `AccountStore` group read `[true, true]` before the fix where it asks `[false, true]` (red), and passes after it, with the handed folder's file kept and the made folder removed. Its mutation went red.
```

### 4. The sign-in pane runs in the daemon's whole environment, though the adapter's comment and phase 3's record say it runs in the cleared one

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:2251-2252`, `apps/desktop/src/daemon/daemon.ts:1677`, `apps/desktop/src/daemon/adapters/claude.ts:610`, `seal/threads/1795400734-accounts-per-repository/trail/phases/phase-3.md:20`
evidence: read `apps/desktop/src/daemon/adapters/claude-accounts.ts:145-148`, `apps/desktop/src/daemon/daemon.ts:1669-1684`, `apps/desktop/src/daemon/daemon.ts:2251-2252`, `apps/desktop/src/daemon/pty.ts:62-89`
```

Why it matters: claimed: "It runs the lookup's CLI with `auth login`, in `claudeEnv`'s cleared environment with `CLAUDE_CONFIG_DIR` set to the account's folder" (`phase-3.md:20`), and "under the environment a role session is given, so no variable of the daemon's reaches it" (`claude.ts:610`). Found: `claudeLogins.signIn` returns `claudeEnv`'s names as the command's `env` (`claude-accounts.ts:145-148`), and `Daemon#signIn` starts it through `startSession` (`daemon.ts:1677`). `#spawnPane` gives every pane `{ ...process.env, ...env }`, and `TerminalSession.spawn` drops only the names `pty.ts#inheritedOnly` lists. So `claude auth login` runs with every variable of the daemon's environment, such as `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` of a daemon started from a terminal that exports one. `auth status` and `auth logout` run through `execFile` with the cleared environment alone, so a sign-in and the status read after it can run under different variables. `frame/design.md` *Scope* item 5 says Owlery "passes no token in any variable", and a token the daemon inherited reaches the CLI through the pane's variables.

```ts
// apps/desktop/src/daemon/daemon.ts: #spawnPane takes whether the pane inherits the daemon's environment
  private spawnPane({ command, args, env }: PaneCommand, cwd: string, size: { cols: number; rows: number }, inherit = true): TerminalSession {
    // A sign-in pane runs in the cleared environment its command names, as `auth status` and `auth logout` do; terminalEnv adds the terminal's names.
    return TerminalSession.spawn({ command, args, cwd, cols: size.cols, rows: size.rows, env: inherit ? { ...process.env, ...env } : env });
  }
// and in #startSession, where the session is built:
      terminal: this.spawnPane(launch, cwd, size, signsIn === null),
```

The case belongs in `apps/desktop/test/accounts.test.ts`, in the sign-in case at line 841: a variable set in the daemon's `process.env` for the case is absent from the environment the sign-in's stand-in records.

```seal
verdict: fixed 57981ce
location: `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/src/daemon/adapters/adapter.ts`, `apps/desktop/test/accounts.test.ts`, `apps/desktop/test/fixtures/claude-auth-stand-in/claude`
answer: Applied the record's fix: `#spawnPane` takes `inherit`, and a sign-in pane is spawned with its command's environment alone, to which `terminalEnv` adds the terminal's names. The stand-in CLI now writes the environment its `auth login` was given, and the sign-in case sets a variable in the daemon's `process.env` and reads it absent beside `CLAUDE_CONFIG_DIR` of the account. Before the fix the variable was present (red). The docstring of `LoginCommand`, which said the variables are given over the daemon's environment, now says the whole environment. `claude.ts:610` and `trail/phases/phase-3.md:20` hold at HEAD. Its mutation went red.
```

### 5. The window offers a change of account that the daemon always refuses, though scope item 9 and phase 4's record say it offers only one that can succeed

```seal
severity: should
location: `apps/desktop/src/renderer/view.ts:2959-2967`, `seal/threads/1795400734-accounts-per-repository/frame/design.md:144`, `seal/threads/1795400734-accounts-per-repository/trail/phases/phase-4.md:30`
evidence: read `apps/desktop/src/renderer/view.ts:2949-2969`, `apps/desktop/src/daemon/daemon.ts:1723-1732`, `apps/desktop/src/shared/protocol.ts:340-351`
```

Why it matters: `frame/design.md` *Scope* item 9 says "The window offers the change only where it can succeed". Phase 4 claimed: "The window offers the change only where a change can succeed, so a person meets these words only in a race" (`phase-4.md:30`). Found: `paneAccountChange` offers every account but the pane's own (`view.ts:2967`). The daemon refuses each one whose `projects` does not resolve to the pane's account's (`daemon.ts:1723-1732`). A folder handed over that keeps its own conversations, as Anthropic's page describes a second login, is therefore offered and always refused with `"A" and "B" do not keep the same conversations…`. So is System default while the lookup has given no folder. That is the common case for a handed account, not a race. `Account` carries nothing from which the window could tell (`protocol.ts:340-351`).

Two fixes stand, and the frame chooses:

- The daemon sends with each account the real path of its folder's `projects`, read when it sends the accounts and null where none stands, as `Account.conversations?: string | null`. `paneAccountChange` then offers an account only where that path equals the pane's account's and is not null. The protocol comment, `frame/design.md` *Data & interfaces*, *The protocol*, and a case of `apps/desktop/test/view.test.ts` follow.
- The frame rewrites the sentence of *Scope* item 9 to what is built: the dialog offers every other account, and shows the daemon's refusal for one whose folder keeps other conversations. The phase record's claim is then wrong history, and `gaps.md` names the row for the owner's walk.

```seal
verdict: fixed 7018e12
location: `apps/desktop/src/renderer/view.ts`, `apps/desktop/src/shared/protocol.ts`, `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/src/daemon/adapters/adapter.ts`, `apps/desktop/src/daemon/adapters/claude-accounts.ts`, `apps/desktop/src/daemon/adapters/claude.ts`, `apps/desktop/src/daemon/adapters/fake.ts`, `apps/desktop/test/accounts.test.ts`, `apps/desktop/test/view.test.ts`
answer: Built the first fix, the frame's choice at `64b3e3d`: `RoleAdapter.conversationsOf` answers the real path of a folder's `projects` (the Claude adapter through `claude-accounts.ts#conversationsIn`, the fake the same way), the daemon sends it with each account as `Account.conversations`, read each time it sends the accounts, and its own comparison at the request reads the same method. `paneAccountChange` lists an account only where that value is the pane's account's and not null, and gives nothing where none qualifies, so no "Change Account…" stands. The view case now holds scenario 9's A, B, C and D and lists B alone. Before the fix the daemon sent no value and the dialog listed every other account (red). 8 of 8 mutations went red. Four pins of the accounts message gained the field.
```

### 6. Two sentences say Owlery reads nothing of a handed folder, and the daemon reads its plugins and its conversations' folder

```seal
severity: should
location: `seal/threads/1795400734-accounts-per-repository/changelog.md:5`, `apps/desktop/src/shared/protocol.ts:765`
evidence: executed `git grep -n -i -e 'reads nothing' -e 'read nothing' -e 'reads no file' -e 'nothing is made, read' -e 'makes, reads' -- apps/desktop/src seal/threads/1795400734-accounts-per-repository`; read `apps/desktop/src/daemon/claude-plugins.ts:65-70`, `apps/desktop/src/daemon/daemon.ts:1723-1732`, `apps/desktop/src/daemon/daemon.ts:2478`
```

Why it matters: the changelog fragment tells a person "You can hand over an existing config folder by its path, and Owlery then makes, reads and removes nothing in it" (`changelog.md:5`). The protocol's comment on `addAccount` says "the daemon makes nothing in the folder and reads nothing of it" (`protocol.ts:765`). *Scope* item 14 has the daemon read `settings.json` and `plugins/installed_plugins.json` of a handed folder, at each pane's launch and for its repository's `chain` (`claude-plugins.ts:65-70`, `daemon.ts:2478`). A change of a pane's account reads the real path of the folder's `projects` (`daemon.ts:1723-1732`). The search above found these two sentences, and `accounts.ts:181`, which speaks of the store alone and holds. `adapter.ts:78` says the daemon "reads no file of the folder itself" of `AccountLogins` alone, and is not counted. The search is a sample of the spellings it names.

```markdown
<!-- seal/threads/1795400734-accounts-per-repository/changelog.md, line 5, the sentence in place of the one quoted -->
You can hand over an existing config folder by its path, and Owlery then makes and removes nothing in it, and reads of it only which plugins it enables and where it keeps its conversations.
```

```ts
// apps/desktop/src/shared/protocol.ts:765, the clause in place of the one quoted
  // ... With `folder` the person hands over a config folder: an absolute path to a folder that exists and is no account's yet, and the daemon makes nothing in the folder and reads of it only which plugins it enables and the real path of its `projects`. ...
```

```seal
verdict: fixed 9f3fb38
answer: The changelog's sentence is the record's, and the protocol's clause on `addAccount` now says the daemon reads of a handed folder only which plugins it enables and, through the adapter, the real path of the folder it keeps its conversations in. The same commit brings the changelog fragment along for the other fixes: the change's offer and its new refusals, the sign-in's environment, the made folder's place and an adapter without accounts. After it, `git grep -n -i -e 'reads nothing of' -e 'makes, reads' -- apps/desktop/src apps/desktop/test seal/threads/1795400734-accounts-per-repository docs` finds no such sentence outside this record.
```

### 7. Two policy sentences that this build changes have no operation in *Rule changes*

```seal
severity: should
location: `seal/threads/1795400734-accounts-per-repository/frame/design.md:253`, `seal/threads/1795400734-accounts-per-repository/frame/design.md:396`, `docs/design.md:501`, `docs/design.md:503`, `apps/desktop/test/screenshots.test.ts`
evidence: read `docs/design.md:501-503`, `docs/design.ko.md:501-503`, `apps/desktop/test/screenshots.ts`, `apps/desktop/test/screenshots.test.ts:580-600`, `apps/desktop/src/daemon/accounts.ts:29-35`, `seal/threads/1795400734-accounts-per-repository/frame/design.md:253-410`, `seal/threads/1795400734-accounts-per-repository/trail/phases/phase-5.md:75`
```

Why it matters: the settle writes `docs/` from *Rule changes* alone (`frame/design.md` *Removes*, its last two rows), so a sentence the build contradicts and no operation names stays in the policy.

- **The screenshot run.** `docs/design.md:501` lists the views a screenshot is made of, ending at "a repository's settings", and `:503` says the command writes "each of the ten views … twenty files". Its rule's `check:` is `apps/desktop/test/screenshots.test.ts`, which this build changed. The run now captures eleven views, the Accounts dialog last (`screenshots.ts`, `VIEWS`), and writes 22 files (`phase-2.md:56`). Its scene keeps one account handed over by an empty folder, stored as signed in with two limit values, and sets the parked work item to it. Nothing of that is in the paragraph. The scene starts a shell pane in each stored work item (`screenshots.test.ts:592-597`), and the parked work item is stored, so that pane runs under the account and its row offers no refresh, as `phase-5.md:75` says. The file's header comment and the comment on the stored account say "No session of the scene runs under it" and that the dialog draws "the offer of a refresh". Those two comments owe the same correction.
- ***State lives in three places*.** The `add` at `frame/design.md:396` says `accounts.json` holds "each account's name, its config folder, whether Owlery made that folder, which account is the default, and what the CLI last said of each login". The store also keeps each account's last limit values there, and System default's as `systemLimits` (`accounts.ts:29-35`).

```text
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: the dialog of the chain choice and a repository's settings.
  to: the dialog of the chain choice, a repository's settings and the Accounts dialog.
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 체인을 고르는 대화 상자, 저장소 설정입니다.
  to: 체인을 고르는 대화 상자, 저장소 설정, Accounts 대화 상자입니다.
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: for each of the ten views in each appearance of Night watch, twenty files named
  to: for each of the eleven views in each appearance of Night watch, twenty-two files named
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 명령은 Night watch의 두 모양마다 열 화면을 창 크기인 1440 x 900의 PNG 파일로 하나씩 씁니다. 파일은 스무 개이고
  to: 명령은 Night watch의 두 모양마다 열한 화면을 창 크기인 1440 x 900의 PNG 파일로 하나씩 씁니다. 파일은 스물두 개이고
- add
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  to: **The screenshot run's scene keeps one account beside System default.** The run writes `accounts.json` before the app starts. The account is handed over by an empty folder of the run's own, is stored as signed in, and holds two limit values. The parked work item is set to it, so its line in the inbox names the account, the settings show the account's field, and the Accounts dialog draws its row. The parked work item's shell pane runs under the account, so its row offers no refresh.
    check: apps/desktop/test/screenshots.test.ts
- add
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  to: **스크린샷 실행의 장면에는 System default 말고 계정이 하나 있습니다.** 실행은 앱을 띄우기 전에 `accounts.json`을 써 둡니다. 그 계정은 실행이 만든 빈 폴더로 넘긴 것이고, 로그인되어 있다고 적혀 있으며, 사용 한도 값 둘을 갖습니다. 멈춰 둔 작업이 이 계정으로 정해져 있어서, 작업함의 그 줄은 계정의 이름을 적고, 설정에는 계정 칸이 나오고, Accounts 대화 상자는 그 계정의 줄을 그립니다. 멈춰 둔 작업의 셸 칸이 이 계정으로 돌므로, 그 줄은 새로 받기를 내놓지 않습니다.
    check: apps/desktop/test/screenshots.test.ts
```

In the two `add` operations on *State lives in three places* (`frame/design.md:396` and `:401`), the sentence on what `accounts.json` holds reads:

```text
`accounts.json` in the daemon's run folder holds each account's name, its config folder, whether Owlery made that folder, which account is the default, what the CLI last said of each login, and the last usage-limit values each account's sessions handed over, System default's among them.
데몬의 실행 폴더에 있는 `accounts.json`이 계정마다의 이름, 설정 폴더, Owlery가 그 폴더를 만들었는지, 어느 계정이 기본인지, CLI가 로그인마다 마지막으로 알린 것, 그리고 System default를 포함해 계정마다 그 세션이 마지막으로 넘겨준 사용 한도 값을 갖습니다.
```

Each new operation is placed by the plugin's reader of rule changes before the fold commits it, as the frame's *Grounding* records for the others.

```seal
verdict: fixed 87669b4
answer: The frame's *Rule changes* took the record's operations at `64b3e3d`. This fix pass rewrote the two comment sentences of `screenshots.test.ts` that the frame's *Removes* row names: the parked work item's shell pane runs under the stored account, so its row offers no refresh. The pane kind `shell` declares `accounts` (`apps/desktop/src/daemon/pane-kinds.ts:11`).
```

### 8. Through an adapter that declares `limit-refresh` and not `accounts`, a refresh of an account runs under the default login and keeps that login's values as the account's

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:1813`, `apps/desktop/src/daemon/daemon.ts:1845`, `apps/desktop/src/daemon/daemon.ts:2026`, `apps/desktop/test/accounts.test.ts:678-684`
evidence: read `apps/desktop/src/daemon/daemon.ts:1793-1860`, `apps/desktop/src/daemon/daemon.ts:2020-2030`, `apps/desktop/src/daemon/daemon.ts:2113-2125`, `apps/desktop/test/accounts.test.ts:666-696`, `apps/desktop/test/accounts.test.ts:498-508`
```

Why it matters: `refreshUsage` gives the adapter the account's folder only where it declares `accounts` (`daemon.ts:1813`), and keeps every `limit` event under the account's id whatever it gave (`daemon.ts:1845`). Through an adapter that declares `limit-refresh` and not `accounts`, a refresh of "Work" therefore starts a session with no folder, which runs under the agent's default login, and "Work"'s row then shows that login's usage with its time. The case at `accounts.test.ts:666`, in its lines 678-684, pins it: it starts such an adapter, refreshes account 1, and checks only that no folder was given. `startHeadless` keeps a session's limit values the same way (`daemon.ts:2026`). *Scope* item 13 says a refresh runs "under that account", and *Scope* item 12 that the daemon passes a folder only to an adapter that declares `accounts`. No adapter of the app declares one feature without the other today, so the release ships the defect only to the next adapter that does. A wrong account's usage is the defect `routing.md` names as the reason for the review chain.

```ts
// apps/desktop/src/daemon/daemon.ts, Daemon#refreshUsage, after the check of `limit-refresh`
      // Only an adapter that launches a session under an account's folder reads that account's usage; another reads its default login's.
      if (id !== SYSTEM_DEFAULT_ID && !adapter.features.includes("accounts")) throw new Error(`The ${adapter.name} adapter launches no session under an account's folder, so it refreshes the usage of ${SYSTEM_DEFAULT_NAME} alone.`);
```

```ts
// apps/desktop/src/daemon/daemon.ts, Daemon#startHeadless, the branch on a limit event
      if (event.type === "limit") {
        // Under an adapter that declares no accounts every session runs under the default login, whose values these are.
        const holder = this.options.roleAdapter.features.includes("accounts") ? session.account.id : SYSTEM_DEFAULT_ID;
        if (this.accounts.setLimit(holder, event, (this.options.now ?? Date.now)())) this.broadcastAccounts();
        return;
      }
```

The lines 678-684 of that case then pin the refusal. The snippet stops at the limit values. The same cause names "Work" on such a session's `HeadlessInfo.accountId` and on its ledger entry (`daemon.ts:2113-2125`), which the case at `accounts.test.ts:498` pins as launching "under the account the session names". The fix pass owes either the same change there or a sentence of `frame/design.md` *Scope* item 8 saying that the entry names the setting and not the login.

```seal
verdict: fixed 5b98161
location: `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/src/shared/protocol.ts`, `apps/desktop/test/accounts.test.ts`
answer: Applied the record's refusal of a named account's refresh through an adapter that declares no `accounts`, and launched such an adapter's headless session under none, as the frame's *Scope* items 8 and 13 now say: it carries `accountId: null`, its ledger entry names no account, and its limit values are kept as System default's. `HeadlessInfo.accountId` is typed `number | null`, and the protocol's comments on `ask` and `refreshUsage` say so. The case at `accounts.test.ts:512` and the lines of the refresh case the record names now pin it; before the fix the session carried account 1 and the refresh was answered `done` (red). 5 of 5 mutations went red. `gaps.md` names what stays for such an adapter: the row's offer of a refresh the daemon refuses, and a refresh of System default while a session under none runs.
```

## Confirmations

What matched: no line of the source writes into the person's own config folder. `linkOwn` makes links only inside the account's folder (`apps/desktop/src/daemon/adapters/claude-accounts.ts:68-81`), each pointing at the person's entry, and `Daemon#furnish` calls it only for an account the daemon made (`apps/desktop/src/daemon/daemon.ts:1766-1769`). Probe 3 removed a made account whose folder linked `settings.json` and `projects` to a person's folder, and the person's folder kept both entries and the file inside `projects`, while the account's folder was gone. Read and executed.

What matched: the config folder each part reads. A role session gets the account's folder, and under System default the lookup's third line (`apps/desktop/src/daemon/adapters/claude.ts:484`). A Claude Code pane gets `env CLAUDE_CONFIG_DIR=<folder>` between `exec` and `claude` under an account, and nothing under System default (`apps/desktop/src/daemon/hooks.ts:150`). The reader of plugins takes the start's folder, and the daemon's own environment only for null (`apps/desktop/src/daemon/claude-plugins.ts:66`). A repository's `chain` is read under the account a new pane of it takes (`apps/desktop/src/daemon/daemon.ts:2478`). The lookup's answer is held once the login shell has answered (`apps/desktop/src/daemon/adapters/claude.ts:473`). Read.

What matched: a removal of a made account runs the adapter's `signOut` before the folder goes, refuses with the CLI's sentence where it fails, and looks again for a session under the account after it (`apps/desktop/src/daemon/daemon.ts:1636-1666`). A handed folder is not signed out. Read.

What matched: the refresh reads no token and calls no address. Scenario 12's search, `git grep -n -i -e 'credentials' -e 'keychain' -e 'find-generic-password' -e 'OAUTH_TOKEN' -- apps/desktop/src`, printed nothing and exited 1. The one sender of `refreshUsage` in the window is the button of an account's row (`apps/desktop/src/renderer/renderer.ts:967`), and the daemon starts a refresh only in `Daemon#refreshUsage`. The case at `apps/desktop/test/accounts.test.ts:698` pins that no refresh starts at the daemon's start, at a hello or as the clock passes an hour. Executed for the search, read for the rest.

What matched: the account change ends the old process's watch of its session log in the process's end (`apps/desktop/src/daemon/daemon.ts:2278-2283`), drops the old state, the interruption and the unread log (`apps/desktop/src/daemon/daemon.ts:1739-1741`), and refuses a shell, a sign-in pane, a headless session, the account the pane runs under and an account the daemon keeps none of, each pinned in the case at `apps/desktop/test/daemon.test.ts:7359`. Read.

What matched: `gaps.md` labels the whole suite, the whole typecheck and the documents' checks `unverified` with the orchestrator as their answerer, at every phase and both merges. The label is honest: the phase records name narrow runs alone.

Test groups read: the cases this round read whole are the four change-account cases of `apps/desktop/test/daemon.test.ts:7276-7469` and the five refresh cases of `apps/desktop/test/accounts.test.ts:614-738`, each against the cases of its own group. That is a sample of the diff's 976 new lines of `accounts.test.ts` and 463 of `daemon.test.ts`, and the rest was not read case by case. No duplicate check pairs these files, since neither declares `TARGET`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the window's new words that name the vendor, such as "A refresh starts one short Claude Code session under the account" and "Owlery signs its folder out with Claude Code", keep `docs/architecture.md` *Rules that keep it portable* rule 1, "The UI does not know which vendor's agent it is showing". The base already names the vendor in the window, as the pane kind's label "Claude Code" (`apps/desktop/src/daemon/pane-kinds.ts:12` at `c409dbb`), and *Scope* item 12 says the window shows an account's controls "never by a vendor's name" | `apps/desktop/src/renderer/view.ts:2863-2933` | the orchestrator, with the owner |
| What a real `claude` does under an account's folder: the login found, the links followed, a conversation resumed under a second account, `auth login`, `status` and `logout`, and what a refresh's turn hands over and costs | `frame/questions.md` Q3 and Q5 | the owner's walk of the built app (#184) |
| The window's drawing of the Accounts dialog, the change dialog, the menus and the tab's name in the built app, beyond the functions `view.ts` exports | `apps/desktop/src/renderer/renderer.ts`, `apps/desktop/src/renderer/work-item-view.ts`, `frame/questions.md` Q8 | the owner's walk of the built app (#184) |
| The broad gate at the work item's last commit | `seal/config.json` `Broad gate` | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts`, first run | 4 cases passed. Vitest showed no output of a passing case, so nothing of what the probes noted was read from this run |
| `node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts`, run again after the probe file was edited to write what it noted to a file of the round's scratch directory | 4 cases passed. Probe 1: two `changeAccount` requests for one pane were both answered `done`, and the stand-in shell recorded `start … CLAUDE_CONFIG_DIR='…/a' claude …`, `end`, and two `start … CLAUDE_CONFIG_DIR='…/b' claude … --resume 'a99099b6-accd-47d0-853b-547820b31e6d'`. Probe 2: after a `changeAccount` and `Daemon#close` 50 ms later, the stand-in recorded a new `start … --resume …` after the `end`. Probe 3: a made account linked `settings.json` and `projects`, and after `AccountStore#remove` the person's folder held both and the file inside `projects`, and the account's folder was gone. Probe 4: an `accounts.json` with `made: true` and a folder outside `accounts/` had `remove(1)` delete that folder |
| `pgrep -fl` for the stand-in shells of the two daemon probes, after the run | nothing ran: the processes ended with the test run's process |
