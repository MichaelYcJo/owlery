# Design: accounts per repository, work item and session (#160)

## Grounding

The tree as read at `dac6fed`. The ticket is issue #160, read with `gh issue view 160 --json title,body,comments,milestone,labels` (executed): it has no comment, so no comment changes the request. `routing.md` of this work item was read first. `seal/follow-up.md` does not exist at this commit.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Conclusions*, "Owlery provides no login", and *Authentication of the Claude adapter* (read) | Authentication is the CLI's. Owlery shows no login form and stores no key or token. The daemon launches the `claude` the person installed and never the Agent SDK |
| `docs/architecture.md` *Role sessions run detached from the user's environment*, with the `add` of `seal/threads/1795329620-role-bundle/frame/design.md` *Rule changes* and the `change` of `seal/threads/1795338000-role-tools-and-permissions/frame/design.md` *Rule changes* (read) | A role session's environment is cleared and given named variables alone, its setting sources are empty, and it loads the role bundle through `--plugin-dir`. So an account reaches a role session as one more named variable, and the account's own plugins, hooks and settings stay out. Every session rewrites the CLI's state file, which sits in the config folder once one is set |
| `docs/architecture.md` *Agent adapters* and *Rules that keep it portable* (read) | The daemon reaches an agent through its adapter alone. No field of the protocol names a vendor. What differs by vendor is a feature the adapter declares, and the fake adapter runs every flow the Claude adapter does |
| `docs/architecture.md` *What a session survives*, the paragraph "A conversation comes back by its session id" (read) | A conversation resumes as `claude --resume <session ID>`, the id stays in the daemon, and one conversation is not opened in two processes. Issue #61 keeps the id past the daemon's end, in release 0.0.4 |
| `docs/architecture.md` *Reading usage limits* and the row "How to read usage limits" of *Open decisions* (read) | Limit values come from a running session and are as of the last call. Reading the login token is not taken, and the row leaves it to what Anthropic's published documents say |
| `docs/architecture.md` *State lives in three places* (read) | What a person sets on a repository or a work item is the daemon's state and is written nowhere in the person's repository |
| `docs/roadmap.md` *Milestones*, row 1, "Hooks are added only to the sessions Owlery launches" and "The user's own settings files are unchanged after a session" (read) | Owlery writes nothing into the person's own config folder. A link that points at an entry of that folder is made inside the account's folder |
| `docs/design.md` *Components and their states* and *The voice of the window's words* (read) | A dialog's heading says what it does and its buttons name their acts. An age and a count on a line are in `--font-fact` and `--ink-faint`. The window names what will be lost before it is lost |

What the code holds, each read at `dac6fed`:

- `apps/desktop/src/daemon/adapters/claude.ts#claudeEnv` gives a headless session `HOME`, `USER`, `PATH`, `LANG` and `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`. `apps/desktop/src/daemon/daemon.ts#startHeadless` is the one place that calls `roleAdapter.start`.
- `apps/desktop/src/daemon/hooks.ts#claudePaneCommand` runs `exec claude --settings <file>` in the person's interactive login shell, and `#paneCommands` gives every pane `OWLERY_PANE_ID` and `OWLERY_HOOK_SOCKET` in its environment.
- `apps/desktop/src/daemon/daemon.ts#agentEvent` reads a hook's event name and tool and keeps nothing else of the payload, so the daemon holds no conversation id of a pane.
- `apps/desktop/src/daemon/repositories.ts` keeps each repository and its work items in `repositories.json` of the run folder, which is `run/` under the app's data folder (`apps/desktop/src/main/main.ts`).
- `apps/desktop/src/shared/protocol.ts#SessionInfo` allows `workItemId: null`. `apps/desktop/src/renderer/view.ts#runningSessions` names a live pane with no work item among the running sessions a dialog lists, and no line of the inbox and no work item's view shows such a pane.

Executed at `dac6fed`:

- `git grep -n 'CLAUDE_CONFIG_DIR' dac6fed -- apps docs README.md` printed nothing, which is the issue's second bullet of *What happens today*.
- `git grep -n -i 'account' dac6fed -- apps/desktop/src` printed nothing.
- `git grep -n -i -e 'credentials' -e 'keychain' -e 'find-generic-password' -e 'OAUTH_TOKEN' <commit> -- apps/desktop/src` printed nothing at `dac6fed` and at the tips of the branches of #27, #41, #45 and #46 (`4883ab1`, `b1e0e26`, `7f0976a`, `9be0035`). Scenario 12 states this search.
- The plugin's reader of rule changes (`skills/settle/scripts/rule_changes.py`, its `parse` and `apply_op`) read *Rule changes* of this file with no error and no unread line, and placed every operation in the policy documents of `dac6fed` in memory. Each English document and its Korean edition then held the same count of headings and of table rows.
- A probe with a stand-in for `claude` and a login profile that exports its own `CLAUDE_CONFIG_DIR`: a value given in the pane's environment was replaced by the profile's, and a value set in the command, `exec env CLAUDE_CONFIG_DIR='<folder>' claude`, reached the stand-in. The probe ran `/bin/zsh -l -i -c` under a home of its own and started no real `claude`.

Orca 1.4.271, read on this machine on 2026-11-23, names and link targets only, no file of an account opened but for the key names of two JSON files:

- One account's folder holds `profile.json`, `settings-sync.json` and a `home` folder. `home` held 72 entries, 22 of them links into the person's own config folder (executed: `ls -A` and `find -maxdepth 1 -type l`, each counted). The links are folders of conversations, plugins and skills, and `history.jsonl`. `.claude.json`, `settings.json`, the cached policy and remote settings, `sessions/`, `cache/` and `backups/` are the folder's own files. The person's `CLAUDE.md` is a file of its own there and not a link.
- The zsh wrapper defines a function `claude` that reads a pointer file, exports `CLAUDE_CONFIG_DIR` and runs the CLI, and runs the CLI with the variable unset where the pointer is empty (read: lines 256 to 279 of the wrapper's `.zshenv`).
- So the issue's account of Orca holds for the folder, its links, the copied settings and the wrapper. How Orca's panel reads an idle account's use was not read, as the issue says.

Anthropic's published documents, each fetched on 2026-11-23 through a tool that returns the page as text (read):

- Claude Code, *Authentication*, "Log in with multiple accounts": a person keeps a work and a personal account signed in at once by giving each a configuration directory of its own and setting `CLAUDE_CONFIG_DIR` at the start of `claude`. Each directory has its own settings, session history and login. Separate directories do not keep two Claude Console sign-ins without an API key apart, because that sign-in is stored outside the directory.
- The same page, "Credential management": on macOS the login is in the Keychain, and the Keychain entry is keyed to the configuration directory, so a session with another `CLAUDE_CONFIG_DIR` reads another entry. Where the Keychain refuses the write, the CLI writes `.credentials.json` in that directory.
- Claude Code, *CLI reference*: `claude auth login` signs in, `claude auth logout` signs out, and `claude auth status` prints JSON, exits 0 where a login stands and 1 where none does, and carries `configDirectory`, `authMethod` and, from 2.1.318, `loginExpiresAt`. `--resume` takes a session's id or the absolute path of its transcript. The issue writes the sign-in command as `claude login`; the reference names `claude auth login`.
- Claude Code, *Explore the .claude directory*: with `CLAUDE_CONFIG_DIR` set, every path of `~/.claude` and `.claude.json` live under that directory. The page names what a person writes there, what the CLI writes as it works, and the state files to keep.
- Claude Code, *Legal and compliance*, "Authentication and credential use": "developers may not collect, store, or intermediate Claude.ai credentials or session tokens — sign-in to a Claude account must complete through Anthropic's own flow", and the page does not prevent an end user from signing in to the unmodified Claude Code binary with their own subscription. "Acceptable use": the advertised limits of a plan assume ordinary, individual usage.
- *Agent SDK overview*: the note `docs/architecture.md` cites still stands in the words that document quotes.
- Consumer Terms of Service, read in its Korean edition through the same tool's summary: it names no rule on holding more than one account and none on usage limits, and it forbids sharing an account's login with another person. This read is of a summary and not of the page's whole text.

Not run, and nobody's finding yet: that a role session launched with a cleared environment and `CLAUDE_CONFIG_DIR` finds that folder's login, that the CLI follows the links of scope item 4, and that a conversation resumed under a second account keeps what the agent was told. Each needs a real `claude` signed in to two accounts, which no agent starts. `frame/questions.md` Q3 names who runs it.

## Scope

The subject of this work is the code, so the rules it changes are stated in *Rule changes* for the settle. In scope:

1. **The daemon keeps accounts.** An account has an id, the name the person gave it, the adapter it belongs to, its config folder, and whether Owlery made that folder. "System default" is an account that is always there, has no folder and is never removed: a session under it is launched as today. One account is the default, and it is System default until the person chooses another.
2. **A person hands over an account by its folder.** The person names an existing config folder by its absolute path. Owlery makes no link in such a folder and never deletes it. This is the one way an account that Orca, another tool or the person's own alias made comes in, and Owlery reads no other product's files.
3. **Owlery makes an account's folder.** For an account added with no folder, the daemon makes `accounts/<id>/` in its run folder, readable by the person alone.
4. **In a folder Owlery made, what belongs to the person is a link, and what belongs to the account is the folder's own.** *Data & interfaces* holds the list of names that are linked. A name of the list is linked only where the person's own config folder holds it and the account's folder holds nothing by that name, and the daemon makes the missing links again before each launch under the account. Every other name stays the account's own: its sign-in, the CLI's state file `.claude.json`, and the policy and remote settings the CLI caches for the account's organization.
5. **Sign-in is the CLI's own.** The daemon runs `claude auth login` in a terminal pane with the account's folder as `CLAUDE_CONFIG_DIR`, and the window shows that pane in the Accounts dialog. When the pane's process ends, and whenever the person asks, the daemon runs `claude auth status` with the same folder and keeps whether a login stands and when it ends. Owlery reads no credential file and no Keychain entry, passes no token in any variable, and asks for no password or code in a field of its own.
6. **A repository, a work item and one session can each be set to an account, and the nearest setting wins.** A session's own setting is first, then its work item's, then its repository's, then the default. The daemon resolves it when the session is launched.
7. **Every session is launched with its account's folder.** A role session and a headless session with no role get `CLAUDE_CONFIG_DIR` among the named variables of their environment. A Claude Code pane gets it in its command, after the login profile ran, because a profile's own export replaces a value of the pane's environment (probed, *Grounding*). A shell pane gets it in its environment, so a `claude` the person types there takes it unless their profile sets its own. Under System default a pane gets nothing, and a role session gets the `CLAUDE_CONFIG_DIR` the person's login shell holds, where it holds one, so a pane and a role session of one work item run under one login.
8. **Each session says which account it runs under, and each ledger entry names it.** A pane and a headless session carry the id of the account they were launched with. A ledger entry carries the account's id and its name as they stood when the stage started.
9. **A person changes the account of a Claude Code pane that runs.** The daemon keeps the latest conversation id the pane's hook events carry. On the person's word it ends the pane's process, waits for its exit, and starts `claude --resume <id>` under the new account in the same work item, in the old pane's place. A pane that has sent no event has no conversation and starts anew. The window says before the change that a turn under way is cut. The change is refused, with its reason, where the two accounts' folders do not hold the same `projects` folder, for a shell pane, and for a headless session. A role session's stage ends under the account it began with, and the next stage launched for the work item takes the nearest setting as it then stands.
10. **The window sets and shows accounts.** An Accounts dialog lists the accounts with the default and each one's sign-in, adds one by either way, signs in, names the default and removes one. A repository's settings and a work item's menu set that repository's and that work item's account. A new pane and a new headless session can be started under an account of their own. A line of the inbox names the account where the work item's account, or a running session's, differs from the one its repository gives. A work item's view names the work item's account, and a pane's tab names the pane's account where it differs from the work item's.
11. **A person removes an account.** The removal is refused while a live pane or a working headless session runs under it, and for System default. For a folder Owlery made, the daemon runs `claude auth logout` with that folder and then removes the folder. A handed folder is left as it is. Every setting that named the account is cleared, so its nearest setting above takes over, and the dialog names each repository and work item whose setting is cleared before the person confirms.
12. **Accounts are a feature an adapter declares.** The daemon passes a folder only to an adapter whose feature list names `accounts`, and a pane's kind says whether its panes take one. The window shows an account's controls by those two facts and never by a vendor's name. The fake adapter declares the feature and reports the folder each session was given.

Out of scope, each with its reason:

- **Reading and showing usage limits, per account or at all.** Issue #73 reads them and issue #74 holds a run back, both in release 0.1.0. This work gives every session its account, which is the key their values are kept under.
- **Reading a login token to show an idle account's use.** Ruled out: *Rule changes* states the decision, and `frame/plan.md` *Alternatives considered* holds its grounds.
- **Moving work to another account when a limit is near.** The daemon never chooses an account. Only a person's setting does.
- **Accounts of Codex or another agent.** `docs/architecture.md` *Agent adapters* places other vendors' adapters at v0.3, and issue #112 builds the Codex pane in release 0.0.4. An account's row names its adapter, so a second agent's accounts need no change of the store.
- **The person's own MCP servers, and the folders they trusted.** Both live in `.claude.json`, which also holds the account's details, so the file stays the account's own. A pane under an account Owlery made asks once more whether to trust a folder.
- **Keeping a pane's conversation id past the daemon's end.** Issue #61 builds it. This work keeps the id in memory.
- **A Claude Console sign-in without an API key.** Anthropic's page says separate folders do not keep two such sign-ins apart. The login pane runs `claude auth login` with no flag, and the rule in *Rule changes* says what a folder does not separate.
- **Linux and Windows.** v0.1 is the macOS app (`docs/roadmap.md` *Goal*).

## User scenarios & acceptance *(mandatory)*

Each case launches through the fake adapter or a stand-in for `claude` that records its arguments and its environment. No case starts a real `claude` or signs in.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. Two repositories, two accounts | Given two accounts handed over by folder and two repositories, one set to each. When a role session is asked for in a work item of each. Then each session's adapter was given the folder of its repository's account, and each `HeadlessInfo` names that account | `apps/desktop/test/accounts.test.ts`, through the fake adapter |
| 2. The nearest setting wins | Given a default, a repository set to account A, one of its work items set to B, and a session asked for under C. When sessions are launched at each level. Then the session's own setting, the work item's, the repository's and the default are taken in that order, and clearing a setting gives the next one above | `apps/desktop/test/accounts.test.ts`, the resolving function's cases and the daemon's |
| 3. System default is today's launch | Given no account but System default. When a role session and a Claude Code pane start. Then the session's environment holds no `CLAUDE_CONFIG_DIR` and the pane's command is the one of `dac6fed`. Given a login shell that holds a `CLAUDE_CONFIG_DIR`. Then the role session's environment holds that value | `apps/desktop/test/claude-adapter.test.ts` and `apps/desktop/test/hooks.test.ts` |
| 4. A pane takes its account after the profile | Given an account with a folder. When a Claude Code pane starts under it. Then its command sets `CLAUDE_CONFIG_DIR` to the folder between `exec` and `claude`, quoted for the shell, and a shell pane holds the variable in its environment | `apps/desktop/test/hooks.test.ts` |
| 5. The folder Owlery makes | Given a person's config folder that holds some names of the linked list and some other names. When an account is added with no folder. Then the account's folder is readable by the person alone, holds a link for each listed name the person's folder holds, holds no link for any other name, and the person's folder is unchanged. A name the account's folder already holds is left as it is | `apps/desktop/test/accounts.test.ts`, on folders the case makes |
| 6. Sign-in runs the CLI's own command | Given an account Owlery made. When the person chooses "Sign in". Then a pane runs the stand-in as `claude auth login` with the account's folder in `CLAUDE_CONFIG_DIR`, no inbox line and no work item's view lists that pane, and at the pane's end the daemon runs `claude auth status` with the same folder and the account says whether a login stands | `apps/desktop/test/accounts.test.ts` and `apps/desktop/test/daemon.test.ts`, with a stand-in that exits 0 or 1 |
| 7. A handed folder | Given an existing folder. When the person adds it. Then the daemon makes no link in it, and a removal of the account leaves the folder and every file in it. A path that is not absolute, is no folder, or is already an account's is refused with a sentence | `apps/desktop/test/accounts.test.ts` |
| 8. A running pane changes account | Given a Claude Code pane under account A whose hook events carried a conversation id, and an account B whose `projects` is the same folder as A's. When the person changes the pane to B. Then the pane's process is ended and has exited before a new one starts, the new command holds B's folder and `--resume` with that id, and the new pane names B. A pane with no id starts with no `--resume` | `apps/desktop/test/daemon.test.ts`, with a stand-in that records its command |
| 9. A change that is refused | Given a shell pane, a working headless session, and two accounts whose `projects` folders differ. When the change is asked for each. Then each is refused with its reason, and nothing is ended | `apps/desktop/test/daemon.test.ts` |
| 10. The ledger names the account | Given two stages that ended under two accounts. When the ledger is read. Then each entry names its account's id and name, and a line written before this work reads with no account | `apps/desktop/test/ledger.test.ts`, the file issue #45 adds |
| 11. The window | Given the built app started through `BuiltApp.start` with `OWLERY_BACKGROUND=1`. When the person opens the Accounts dialog, adds an account, sets a repository to it, and opens a work item of that repository. Then the dialog lists the account with its sign-in, the repository's settings name it, and a line names an account only where it differs from the one its repository gives. Screenshots of the dialog and of such a line are in the pull request | `apps/desktop/test/view.test.ts` and `apps/desktop/test/screenshots.test.ts` |
| 12. Owlery reads no credential | When the source is searched for a read of a credential file, the Keychain or a token variable. Then the search prints nothing | `git grep -n -i -e 'credentials' -e 'keychain' -e 'find-generic-password' -e 'OAUTH_TOKEN' -- apps/desktop/src` prints nothing. It printed nothing at `dac6fed` (*Grounding*), and the build adds no line it matches. The pathspec leaves this work item's directory out |
| 13. Removing an account | Given an account Owlery made that a repository is set to, and no session under it. When the person removes it. Then the stand-in was run as `claude auth logout` with the folder, the folder is gone, the repository's setting is cleared, and a default that named it is System default again. With a live pane under it the removal is refused and names the pane | `apps/desktop/test/accounts.test.ts` |
| 14. A daemon of an earlier build | Given a daemon that sends no accounts. When the window attaches. Then the window shows no account control and no account name | `apps/desktop/test/view.test.ts` |

## Data & interfaces

Names below are the frame's. A name no case of *User scenarios & acceptance* pins may change in the build, and the phase record says where it did.

**The store.** `accounts.json` in the daemon's run folder, written whole as `repositories.json` is (`apps/desktop/src/daemon/whole-file.ts`):

- `nextId`: the id the next account takes. An id is never given twice.
- `defaultId`: the default account's id. `0` is System default.
- `accounts`: each with `id` (1 or more), `name`, `adapter` (`"claude"`), `folder` (absolute), `made` (true where Owlery made the folder), and `signedIn` and `loginEndsAt` as the last `claude auth status` gave them, or null.

`apps/desktop/src/daemon/repositories.ts#StoredRepository` and `#StoredWorkItem` each gain `accountId: number | null`, null where nothing is set there. A file written before this work reads as null, the way `setup` is read.

**The person's names, linked in a folder Owlery made.** One list in the adapter's code, which scope item 4 and scenario 5 read:

| Kind | Names |
|---|---|
| What the person writes | `CLAUDE.md`, `settings.json`, `keybindings.json`, `rules`, `skills`, `commands`, `agents`, `output-styles`, `workflows`, `themes`, `agent-memory` |
| What the person installed | `plugins` |
| The conversations and what resumes them | `projects`, `history.jsonl`, `file-history`, `plans`, `tasks`, `paste-cache`, `session-env`, `shell-snapshots` |

The person's own config folder is the `CLAUDE_CONFIG_DIR` their login shell holds, and `.claude` in their home where it holds none. The adapter's lookup of the CLI (`apps/desktop/src/daemon/adapters/claude.ts#LOOKUP_SCRIPT`) prints that variable on a third marked line.

**The adapter.** `apps/desktop/src/daemon/adapters/adapter.ts`:

- `RoleFeature` gains `"accounts"`.
- `RoleAdapter.start` takes `accountDir?: string` beside `prompt`, `cwd` and `role`. The daemon passes it only where the session's account has a folder and the adapter declares `accounts`.
- `claudeEnv` sets `CLAUDE_CONFIG_DIR` to `accountDir`, or to the login shell's value under System default, and to nothing where neither stands.
- A new module beside the Claude adapter holds what is Claude Code's alone: the variable's name, the list above, the making of links, and the three commands `auth login`, `auth status` and `auth logout`. The daemon calls it through an interface that names no vendor.
- The fake adapter declares `accounts` and names the folder it was given in its answer.

**Panes.** `apps/desktop/src/daemon/daemon.ts#DaemonOptions.commandFor` takes the account's folder and a conversation id to resume beside `continueLatest`. `apps/desktop/src/daemon/hooks.ts#claudePaneCommand` writes `exec env CLAUDE_CONFIG_DIR=<quoted folder> claude --settings <file>` and adds `--resume <id>` where one is given. The id comes from a hook's payload, so it is used only where it is a UUID, and it is quoted for the shell. `apps/desktop/src/shared/protocol.ts#PaneKindInfo` gains `accounts: boolean`.

**The protocol.** `apps/desktop/src/shared/protocol.ts`, every new field absent from a daemon of an earlier build and read by a client as the feature being off:

- `Account`: `id`, `name`, `made`, `folder` (null for System default), `signedIn: boolean | null`, `loginEndsAt: number | null`. `ready` carries `accounts` and `defaultAccountId`, and a message `accounts` carries both whenever either changes.
- `Repository.accountId` and `WorkItem.accountId`: what is set there, or null.
- `SessionInfo.accountId` and `HeadlessInfo.accountId`: the account the session was launched with. `SessionInfo.signsIn: number | null`: the account whose sign-in the pane runs. Such a pane has no work item, and the comment on `SessionInfo.workItemId` is rewritten to say so.
- One exported function gives the account a new session of a work item takes, from the session's own choice, the work item, its repository and the default. The daemon and the window both call it.
- Requests: add an account (a name, and a folder where one is handed over), rename one, name the default, remove one, start a sign-in pane, ask for an account's status again, and change a pane's account. `setRepository` and `setWorkItem` take `accountId`, and `start` and `ask` take the session's own.
- `LedgerEntry` gains `account: { id: number; name: string } | null`, null on a line written before this work.

**The window.** An Accounts dialog, reached from the app's menu and from the sidebar's foot. The repository settings dialog (`#settings-dialog` of `apps/desktop/src/renderer/index.html`) gains an account field whose first choice is the default, named with the account it is. A work item's menu gains "Account…". The words follow `docs/design.md` *The voice of the window's words*: "System default", "Add an account", "Use an existing folder", "Sign in", "Make the default", "Remove the account".

## Rule changes

- change
  file: docs/architecture.md
  section: Conclusions
  from: **Owlery provides no login.** Authentication belongs to the user's CLI. In Claude Code, the user picks a subscription login or an API key with `/login`, and Owlery only launches that CLI
  to: **Owlery provides no login, and a person may keep several.** Authentication belongs to the user's CLI. In Claude Code, the user picks a subscription login or an API key with `/login`, and Owlery only launches that CLI. A person with more than one login keeps each as an account, signs in to each with the CLI's own command, and binds an account to a repository, a work item or one session
- change
  file: docs/architecture.ko.md
  section: 결론
  from: **Owlery는 로그인을 제공하지 않습니다.** 인증은 사용자의 CLI가 갖습니다. Claude Code에서는 사용자가 `/login`으로 구독 로그인이나 API 키를 고르고, Owlery는 그 CLI를 띄울 뿐입니다
  to: **Owlery는 로그인을 제공하지 않고, 사람은 로그인을 여러 개 둘 수 있습니다.** 인증은 사용자의 CLI가 갖습니다. Claude Code에서는 사용자가 `/login`으로 구독 로그인이나 API 키를 고르고, Owlery는 그 CLI를 띄울 뿐입니다. 로그인이 둘 이상인 사람은 로그인마다 계정을 하나씩 두고, 계정마다 CLI의 로그인 명령으로 로그인하며, 저장소나 작업이나 세션 하나에 계정을 묶습니다
- change
  file: docs/architecture.md
  section: Authentication of the Claude adapter
  from: Owlery has no login screen and stores no keys
  to: Owlery has no login screen and stores no keys. For an account a person adds, Owlery runs the CLI's own `claude auth login` in a terminal pane with that account's config folder, and the sign-in completes in the browser through Anthropic's own flow
- change
  file: docs/architecture.ko.md
  section: Claude 어댑터의 인증
  from: Owlery는 로그인 화면도, 키 저장도 갖지 않습니다
  to: Owlery는 로그인 화면도, 키 저장도 갖지 않습니다. 사람이 더한 계정은 Owlery가 그 계정의 설정 폴더를 지정해 터미널 칸에서 CLI의 `claude auth login`을 실행하고, 로그인은 브라우저에서 Anthropic의 절차로 끝납니다
- add
  file: docs/architecture.md
  section: Authentication of the Claude adapter
  to: **A person keeps several logins as accounts, each a config folder of the CLI's, and every session is launched with the account its nearest setting names.** One account is the default. A repository, a work item and one session can each be set to another, and a session takes its own setting first, then its work item's, then its repository's, then the default. The daemon passes the account's folder to the CLI as `CLAUDE_CONFIG_DIR`, the way Claude Code's own documentation keeps a work and a personal account apart (Authentication, "Log in with multiple accounts", read 2026-11-23). A role session gets it among the named variables of its cleared environment, so the account's own plugins, hooks and settings stay out of a verdict as before. A Claude Code pane gets it in its command, after the login profile ran, because a profile's own export replaces a value of the pane's environment (probed 2026-11-23 with a stand-in). "System default" is the login the person's shell gives with nothing passed, and it is always there. A person adds an account in one of two ways: Owlery makes a folder in the daemon's run folder and runs `claude auth login` with it in a terminal pane, or the person hands over a folder that exists, which Owlery neither links into nor deletes. Owlery reads no credential file and no Keychain entry, passes no token in a variable, and learns whether a login stands from `claude auth status`. Anthropic's Legal and compliance page for Claude Code says that sign-in to a Claude account must complete through Anthropic's own flow and that developers may not collect, store or intermediate credentials, and it does not prevent a person from signing in to the unmodified CLI with their own subscription (read 2026-11-23). The daemon never chooses an account, at a usage limit or anywhere else: only a person's setting does. Separate folders do not keep two Claude Console sign-ins without an API key apart, because the CLI stores that sign-in outside the folder. Whether an agent has accounts is a feature its adapter declares.
    check: apps/desktop/test/accounts.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/claude-adapter.test.ts apps/desktop/test/fake-adapter.test.ts apps/desktop/test/hooks.test.ts
- add
  file: docs/architecture.ko.md
  section: Claude 어댑터의 인증
  to: **사람은 로그인 여러 개를 계정으로 두고, 계정 하나는 CLI의 설정 폴더 하나이며, 세션은 가장 가까운 설정이 가리키는 계정으로 뜹니다.** 계정 하나가 기본입니다. 저장소와 작업과 세션 하나에는 각각 다른 계정을 정할 수 있고, 세션은 자기 설정, 작업의 설정, 저장소의 설정, 기본의 순서로 먼저 있는 것을 씁니다. 데몬은 계정의 폴더를 `CLAUDE_CONFIG_DIR`로 CLI에 넘깁니다. Claude Code의 문서가 회사 계정과 개인 계정을 나눠 두는 방식과 같습니다(Authentication, "Log in with multiple accounts", 2026-11-23에 읽음). 역할 세션은 비운 환경에 이름을 정해 넘기는 변수의 하나로 이 값을 받으므로, 계정의 플러그인과 훅과 설정은 전과 같이 판정에 들어오지 않습니다. Claude Code 칸은 로그인 프로필이 실행된 뒤인 명령 안에서 이 값을 받습니다. 프로필이 같은 변수를 내보내면 칸의 환경에 넣은 값이 바뀌기 때문입니다(2026-11-23에 대역으로 확인). "System default"는 아무것도 넘기지 않았을 때 사람의 셸이 주는 로그인이고, 언제나 있습니다. 계정을 더하는 길은 둘입니다. Owlery가 데몬의 실행 폴더에 폴더를 만들고 그 폴더로 터미널 칸에서 `claude auth login`을 실행하거나, 사람이 이미 있는 폴더를 넘깁니다. 넘겨받은 폴더에는 Owlery가 링크를 만들지 않고, 그 폴더를 지우지도 않습니다. Owlery는 자격 증명 파일도 키체인 항목도 읽지 않고, 토큰을 변수로 넘기지 않으며, 로그인이 있는지는 `claude auth status`로 압니다. Claude Code의 Legal and compliance 문서는 Claude 계정의 로그인이 Anthropic의 절차로 끝나야 하고 개발자가 자격 증명을 모으거나 저장하거나 중개해서는 안 된다고 적으며, 사람이 고치지 않은 CLI에 자기 구독으로 로그인하는 것은 막지 않습니다(2026-11-23에 읽음). 데몬은 사용 한도에서든 어디에서든 계정을 고르지 않고, 사람의 설정만이 계정을 정합니다. 폴더를 나눠도 API 키 없이 한 Claude Console 로그인 둘은 나뉘지 않습니다. CLI가 그 로그인을 폴더 밖에 두기 때문입니다. 에이전트에 계정이 있는지는 그 어댑터가 밝히는 기능입니다.
    check: apps/desktop/test/accounts.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/claude-adapter.test.ts apps/desktop/test/fake-adapter.test.ts apps/desktop/test/hooks.test.ts
- add
  file: docs/architecture.md
  section: Authentication of the Claude adapter
  to: **In an account's folder that Owlery made, what belongs to the person is a link into the person's own config folder, and what belongs to the account is the folder's own.** The person's are the files they write (`CLAUDE.md`, `settings.json`, `keybindings.json`, and the folders of rules, skills, commands, agents, output styles, workflows, themes and agent memory), the plugins they installed, and the conversations with what resumes them (`projects`, `history.jsonl`, `file-history`, `plans`, `tasks`, `paste-cache`, `session-env`, `shell-snapshots`). So one person's tools and history serve every account, and a conversation begun under one account is found under another. The account's are its sign-in, the CLI's state file `.claude.json`, and the policy and remote settings the CLI caches for the account's organization. `.claude.json` also holds the person's own MCP servers and the folders they trusted, so neither follows the person into an account Owlery made. The list is of names Claude Code's documentation gives (Explore the .claude directory, read 2026-11-23), and a name it does not hold is never linked, so a file a later version of the CLI adds stays with the account until the list names it. A name is linked only where the person's folder holds it, the daemon makes the missing links again before each launch, and nothing is written into the person's folder by Owlery. Orca 1.4.271 splits a folder the same way and copies the person's settings into each account in place of a link (read 2026-11-23). That the CLI follows these links, and that a conversation resumed under a second account keeps what the agent was told, has not been run with two logins.
    check: apps/desktop/test/accounts.test.ts
- add
  file: docs/architecture.ko.md
  section: Claude 어댑터의 인증
  to: **Owlery가 만든 계정 폴더에서 사람의 것은 사람의 설정 폴더를 가리키는 링크이고, 계정의 것은 그 폴더의 파일입니다.** 사람의 것은 사람이 쓰는 파일(`CLAUDE.md`, `settings.json`, `keybindings.json`, 그리고 rules, skills, commands, agents, output styles, workflows, themes, agent memory의 폴더), 사람이 설치한 플러그인, 대화와 그 대화를 잇는 데 쓰이는 것(`projects`, `history.jsonl`, `file-history`, `plans`, `tasks`, `paste-cache`, `session-env`, `shell-snapshots`)입니다. 그래서 한 사람의 도구와 기록을 모든 계정이 쓰고, 한 계정에서 시작한 대화를 다른 계정에서 찾습니다. 계정의 것은 로그인, CLI의 상태 파일 `.claude.json`, 그리고 CLI가 계정의 조직에서 받아 둔 정책과 원격 설정입니다. `.claude.json`에는 사람의 MCP 서버와 사람이 신뢰한 폴더도 들어 있어서, Owlery가 만든 계정으로는 둘 다 따라오지 않습니다. 목록에는 Claude Code의 문서가 적은 이름만 있고(Explore the .claude directory, 2026-11-23에 읽음), 목록에 없는 이름은 링크하지 않습니다. 그래서 CLI의 다음 버전이 더하는 파일은 목록에 넣기 전까지 계정에 남습니다. 이름은 사람의 폴더에 있을 때만 링크하고, 데몬은 빠진 링크를 그 계정으로 띄우기 전마다 다시 만들며, Owlery는 사람의 폴더에 아무것도 쓰지 않습니다. Orca 1.4.271도 폴더를 같은 식으로 나누고, 사람의 설정은 링크하지 않고 계정마다 복사합니다(2026-11-23에 읽음). CLI가 이 링크를 따르는지, 그리고 다른 계정으로 이은 대화가 에이전트가 들은 것을 그대로 갖는지는 로그인 둘로 돌려 보지 않았습니다.
    check: apps/desktop/test/accounts.test.ts
- add
  file: docs/architecture.md
  section: Authentication of the Claude adapter
  to: **A person changes the account of a Claude Code pane that runs, and the pane resumes its conversation under the new one.** A CLI that runs cannot change its config folder. So the daemon ends the pane's process, waits until it has exited, and starts the CLI on the same conversation under the new account, which is `claude --resume <session ID>` for Claude Code. The id is the latest one the pane's hook events carried, and it stays in the daemon. A turn that was under way is cut, and the window says so before the change. The change is refused where the two accounts' folders do not hold the same conversations, because the conversation would not be found, and for a shell, whose environment is fixed at its start. A role session's stage ends under the account it began with, and the next stage takes the nearest setting as it then stands. Each pane and each headless session says which account it runs under, the inbox names the account on a line where it differs from the one the repository gives, and each entry of the cost ledger names the account its stage ran under.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- add
  file: docs/architecture.ko.md
  section: Claude 어댑터의 인증
  to: **사람은 실행 중인 Claude Code 칸의 계정을 바꿀 수 있고, 칸은 새 계정으로 대화를 잇습니다.** 실행 중인 CLI는 설정 폴더를 바꾸지 못합니다. 그래서 데몬은 칸의 프로세스를 끝내고, 끝난 것을 확인한 뒤, 새 계정으로 같은 대화에서 CLI를 띄웁니다. Claude Code에서는 `claude --resume <세션 ID>`입니다. ID는 그 칸의 훅 이벤트가 마지막으로 실어 온 것이고, 데몬 안에만 둡니다. 진행 중이던 턴은 끊기고, 창은 바꾸기 전에 그렇게 알립니다. 두 계정의 폴더가 같은 대화를 갖지 않으면 대화를 찾지 못하므로 바꾸기를 거절하고, 시작할 때 환경이 정해지는 셸도 거절합니다. 역할 세션의 단계는 시작한 계정으로 끝나고, 다음 단계는 그때의 가장 가까운 설정을 따릅니다. 칸과 헤드리스 세션은 각각 어느 계정으로 도는지 밝히고, 작업함은 계정이 저장소가 주는 계정과 다른 줄에 그 계정의 이름을 적으며, 비용 장부의 항목마다 그 단계가 쓴 계정을 적습니다.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- change
  file: docs/architecture.md
  section: Role sessions run detached from the user's environment
  from: The daemon clears the environment and passes only what is needed (`HOME`, `USER`, `PATH`, `LANG`, `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`)
  to: The daemon clears the environment and passes only what is needed (`HOME`, `USER`, `PATH`, `LANG`, `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`, and `CLAUDE_CONFIG_DIR` where the session's account has a config folder or the person's login shell holds one)
- change
  file: docs/architecture.ko.md
  section: 역할 세션은 사용자 환경에서 떼어 띄웁니다
  from: 데몬이 환경 변수를 비우고 필요한 것만 넘김(`HOME`, `USER`, `PATH`, `LANG`, `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`)
  to: 데몬이 환경 변수를 비우고 필요한 것만 넘김(`HOME`, `USER`, `PATH`, `LANG`, `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`, 그리고 세션의 계정에 설정 폴더가 있거나 사람의 로그인 셸에 값이 있을 때의 `CLAUDE_CONFIG_DIR`)
- change
  file: docs/architecture.md
  section: Reading usage limits
  from: Whether to add it later is in "Open decisions".
  to: Owlery does not take it later either, for an account that runs no session as for any other. Anthropic's Legal and compliance page for Claude Code says that developers may not collect, store or intermediate Claude.ai credentials or session tokens (read 2026-11-23), and reading the token is collecting it. An account that runs no session shows the last values a session of it handed over, with their time, and an account that has run none shows no number.
- change
  file: docs/architecture.ko.md
  section: 사용량 읽기
  from: 나중에 더할지는 「결정을 남겨 둔 것」에 있습니다.
  to: 이 길은 나중에도 쓰지 않고, 세션이 돌지 않는 계정에도 다른 계정과 같이 쓰지 않습니다. Claude Code의 Legal and compliance 문서는 개발자가 Claude.ai 자격 증명이나 세션 토큰을 모으거나 저장하거나 중개해서는 안 된다고 적고(2026-11-23에 읽음), 토큰을 읽는 것은 모으는 일입니다. 세션이 돌지 않는 계정은 그 계정의 세션이 마지막으로 넘겨준 값을 받은 시각과 함께 보여 주고, 세션이 돈 적이 없는 계정은 숫자를 보여 주지 않습니다.
- remove
  file: docs/architecture.md
  section: Open decisions
  from: | How to read usage limits | Only the values Claude Code hands over / also read the user's token and call the undocumented endpoint | Are values as of the last call enough for the inbox and for holding back a chain? Also what Anthropic's published documents say about another product reading the user's login token, judged again when they change as the headless question is ([Reading usage limits](#reading-usage-limits)) |
- remove
  file: docs/architecture.ko.md
  section: 결정을 남겨 둔 것
  from: | 사용량을 읽는 길 | Claude Code가 넘겨주는 값만 / 사용자의 토큰을 읽어 공개되지 않은 주소도 부름 | 마지막 호출 기준의 값으로 작업함과 AgenticSeal 프로세스 시작 판단에 충분한가. 그리고 다른 제품이 사용자의 로그인 토큰을 읽는 일에 대해 Anthropic이 공개한 문서가 무엇이라고 적는가. 헤드리스 문제와 마찬가지로 그 문서가 바뀌면 다시 판단합니다([사용량 읽기](#사용량-읽기)) |
- add
  file: docs/architecture.md
  section: State lives in three places
  to: **The daemon keeps the accounts and what each repository and work item is set to, and none of it is written in the person's repository.** `accounts.json` in the daemon's run folder holds each account's name, its config folder, whether Owlery made that folder, which account is the default, and what the CLI last said of each login. A repository's and a work item's setting stand with them in `repositories.json`, and a session's own setting lives as long as the session. The folders Owlery makes stand in `accounts/` of the run folder, readable by the person alone. The CLI keeps its own state in such a folder, and on macOS its login is in the Keychain under an entry keyed to the folder, so no file Owlery writes holds a token. A removal of an account Owlery made signs it out with the CLI's own command and then removes the folder, and a folder the person handed over is never removed.
    check: apps/desktop/test/accounts.test.ts apps/desktop/test/repositories.test.ts
- add
  file: docs/architecture.ko.md
  section: 상태는 세 곳에 둡니다
  to: **계정, 그리고 저장소와 작업마다 정한 계정은 데몬이 갖고, 사람의 저장소에는 아무것도 적지 않습니다.** 데몬의 실행 폴더에 있는 `accounts.json`이 계정마다의 이름, 설정 폴더, Owlery가 그 폴더를 만들었는지, 어느 계정이 기본인지, 그리고 CLI가 로그인마다 마지막으로 알린 것을 갖습니다. 저장소와 작업의 설정은 `repositories.json`에 그 저장소, 그 작업과 함께 있고, 세션의 설정은 세션이 사는 동안만 있습니다. Owlery가 만드는 폴더는 실행 폴더의 `accounts/`에 있고 그 사람만 읽을 수 있습니다. CLI는 그 폴더에 자기 상태를 두고, macOS에서는 로그인을 그 폴더에 맞춘 키체인 항목에 두므로, Owlery가 쓰는 어느 파일에도 토큰이 없습니다. Owlery가 만든 계정을 지울 때는 CLI의 명령으로 로그아웃한 다음 폴더를 지우고, 사람이 넘긴 폴더는 지우지 않습니다.
    check: apps/desktop/test/accounts.test.ts apps/desktop/test/repositories.test.ts
- add
  file: docs/design.md
  section: Components and their states
  to: | An account's name | The name in `--font-fact` and `--ink-faint`, after the facts of a line of the inbox and after a pane's label on its tab, only where the account differs from the one its repository or its work item gives. In the Accounts dialog an account is a row of a list of records, with the default and the state of its sign-in said in words. | — | — | A selected line draws the name in `--ink-muted`, as it draws its age. | — | — |
- add
  file: docs/design.ko.md
  section: 부분과 그 상태
  to: | 계정의 이름 | 작업함의 줄에서는 그 줄의 사실들 뒤에, 칸의 탭에서는 칸의 이름 뒤에, `--font-fact`와 `--ink-faint`로 적은 이름. 계정이 저장소나 작업이 주는 계정과 다를 때만 적습니다. Accounts 대화 상자에서는 계정 하나가 기록 목록의 한 줄이고, 기본인지와 로그인의 상태를 말로 적습니다. | — | — | 선택한 줄은 지난 시간을 그리듯 이름을 `--ink-muted`로 그립니다. | — | — |

## Removes

This work adds no gate, check, hook or mark of the process, so nothing of that kind is owed in return. What it takes out of the tree:

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The sentence that a headless session's environment is "five names and nothing else of the daemon's" | `apps/desktop/src/daemon/adapters/claude.ts#claudeEnv`, its comment | The comment is rewritten for the names scope item 7 gives. The two cases of `apps/desktop/test/claude-adapter.test.ts` that pin the five names stay as the System default's cases of scenario 3 |
| The sentence that a pane has no work item "only for a pane that a daemon of a build before 0.0.2 opened without one" | `apps/desktop/src/shared/protocol.ts#SessionInfo`, the comment on `workItemId` | Rewritten: a sign-in pane has none either (scope item 5) |
| The row "How to read usage limits" of the open decisions, in both editions | `docs/architecture.md` *Open decisions* and `docs/architecture.ko.md` *결정을 남겨 둔 것* | The settle removes it by the two `remove` operations of *Rule changes*. *Reading usage limits* then holds the decision. This work's diff does not touch the policy root |

Framed 2026-11-23 by framer, before the build.
