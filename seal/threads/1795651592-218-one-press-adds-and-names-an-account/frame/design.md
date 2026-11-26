# Design: one press adds and names an account (#218)

## Grounding

The tree as read at `c6ea6fb9`.

`routing.md` stands in this directory and answers `Automation` `yes`. Issue #218 was read with `gh issue view 218 --json body,comments` on 2026-11-26 (`executed`): its body is as the owner filed it and it holds no comment. `seal/follow-up.md`, `seal/parity.json` and `docs/README.md` do not exist (`executed`, `ls`). The release v0.0.4 body holds no `### Process changes` heading (`executed`, `gh release view`), and no changelog fragment under `seal/threads/` holds one (`executed`, `grep -l`).

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Authentication of the Claude adapter*, the paragraph that opens "A person keeps several logins as accounts" | "Owlery reads no credential file and no Keychain entry, passes no token in a variable, and learns whether a login stands from `claude auth status`." A sign-in runs as the CLI's own `claude auth login` in a terminal pane. A folder the person handed over is neither linked into nor deleted. So the account's name comes through the same command, and Owlery opens no file of the folder to learn it. The paragraph's sentence on the two ways of adding changes: *Rule changes*. |
| `docs/architecture.md` *State lives in three places*, the paragraph that opens "The daemon keeps the accounts" | `accounts.json` holds the accounts. A removal of an account Owlery made signs it out and removes the folder, and a folder handed over is never removed. The file gains the folders whose first sign-in has not ended: *Rule changes*. |
| `apps/desktop/src/daemon/adapters/adapter.ts#RoleAdapter.logins` | "The daemon calls it only for an account's folder and reads no file of the folder itself." The daemon learns the name from the adapter's `status`, which names no vendor. |
| `docs/design.md` *Principles* 8 | The pull request that draws a form writes its row in *Components and their states*, in both editions, and leaves none to the settle. The row "An account's name" states the Accounts dialog, so this work rewrites that row in place in `docs/design.md` and `docs/design.ko.md`. #214 did the same for its dialog (`git show 943b1bfd --stat -- docs`, `executed`). |
| `docs/design.md` *The voice of the window's words* | Each new sentence of the dialog is a whole sentence that names the thing, in sentence case, with no first person. A button is the act it does. |
| `docs/design.md` *A pull request that changes the window carries its screenshots* | A screenshot is made from the built app by `pnpm run screenshots`. "The pull request that adds a view to the run adds it to this list, in both editions." The run draws the Accounts dialog once today (`apps/desktop/test/screenshots.ts:11`, `VIEWS`, `read`), so the dialog during a login and the dialog after one are new views, and the list sentence is edited in place. |
| `seal/threads/*/frame/design.md` `## Rule changes` of the unsettled work items | Their operations name *Screen framework: Electron*, *Code runs the order, the orchestrator judges* and *A pull request that changes the window carries its screenshots* (`executed`, `grep -n 'section:'`). None names *Authentication of the Claude adapter* or *State lives in three places*. #214 adds a paragraph to the screenshots section, and this work adds another after it. |

Facts the frame rests on:

- **Claude Code prints the login's email in `claude auth status`.** In the executable of Claude Code 2.1.332, the JSON form of `auth status` sets `email` from `emailAddress` of the stored login where `authMethod` is `claude.ai`, with `orgId`, `orgName` and `subscriptionType` beside it. It sets `email` the same way for a Console login whose key the CLI manages. The stored login is `oauthAccount` of the CLI's state file, and the same executable writes `oauthAccount.emailAddress` when a login's profile is fetched (`executed`: a probe printed the executable's own code around `consoleProfileSignInOffered` and `emailAddress:`; the executable stands outside the person's config folder, and the probe opened nothing in that folder).
- **The state file is `.claude.json` inside the folder `CLAUDE_CONFIG_DIR` names.** `claude auth status` with `CLAUDE_CONFIG_DIR` set to an empty scratch folder printed `"loggedIn": false`, `"authMethod": "none"`, `"loginExpiresAt": null` and the folder as `configDirectory`, exited 1, and left `.claude.json`, `.claude.json.lock` and `backups` in the folder (`executed`). So the file is `<config folder>/.claude.json` and the field is `oauthAccount.emailAddress`. The run also shows that `auth status` writes the CLI's state into a folder that held none. The row's "Check sign-in" already runs it in a handed folder at this commit.
- **No party has run a real login.** What `auth status` prints after one is read from the executable and not from a run. `frame/questions.md` Q1 holds this, and `gaps.md` owes the owner's one real login.
- **The daemon already asks `auth status` when a sign-in pane ends.** `apps/desktop/src/daemon/daemon.ts:2493-2503` reads the login at the pane's exit, however the pane ended, unless the daemon is closing (`read`). A pane the person closes ends its process, so the same lines run.
- **The store keeps a made folder only at `accounts/<id>` of the run folder.** `apps/desktop/src/daemon/accounts.ts:116` reads an account as made only where its folder is that path, and `remove` deletes a folder only for such an account (`:258-267`, `read`). `addMade` passes over an id whose folder already stands (`:230-232`).
- **A sign-in pane is named by an account's id.** `SessionInfo.signsIn` (`apps/desktop/src/shared/protocol.ts:545-546`) and `daemon.ts#signIn` (`:1808-1823`) need a stored account today. `daemon.ts#foldersOf` (`:1734-1737`) reads the folder from the stored account (`read`).
- **The dialog draws one sign-in pane under its list.** `apps/desktop/src/renderer/sign-in-pane.ts` draws the pane this window asked for and names it by `accountName`, which answers an empty string for an id the window holds no account of (`apps/desktop/src/renderer/view.ts:2998-3000`, `read`).
- **The cases stand in for the CLI.** `apps/desktop/test/fixtures/claude-auth-stand-in/claude` answers `auth login`, `status` and `logout`, holds a login while `hold-login` stands and refuses one while `refuse-login` stands. Its `status` prints no `email` (`read`). The screenshot run's CLI is `apps/desktop/test/fixtures/sample-cli.sh`, which `sample-pane.sh` names to the daemon, and it answers no `auth` command (`read`).
- **The built-app case of the dialog names no stand-in for a login.** `apps/desktop/test/theme-controls.test.ts:66` starts the app with `SHELL` set to the receiver fixture, and its case at `:312-326` types a name and presses "Add an account" (`read`). After this work the press starts a login, so that case needs a stand-in CLI.
- **The app does not replace a daemon of another version.** `OWLERY_VERSION` is read only in `apps/desktop/src/daemon/main.ts` and `chain-main.ts` (`executed`, `grep -rn OWLERY_VERSION src`), so a daemon of 0.0.4 can serve a window of this build.
- **The search of scenario L was run at `c6ea6fb9`.** `git grep -n -e 'accounts-name' -e 'accountsName' c6ea6fb9 -- apps/desktop` printed `renderer/index.html:978`, `renderer/renderer.ts:198`, `:867`, `:885`, `:1029`, `:1035` and `test/theme-controls.test.ts:316`, `:323` (`executed`). *Scope* item 9 removes the lines of `renderer/`, and *Removes* names the case that holds the lines of `test/`. The pathspec `apps/desktop` leaves this directory out.
- **The senders of `addAccount` are a class.** `git grep -c 'type: "addAccount"' c6ea6fb9 -- apps/desktop` printed `renderer/renderer.ts:2`, `shared/protocol.ts:1`, `test/accounts.test.ts:35`, `test/daemon.test.ts:16` and `test/theme-controls.test.ts:1` (`executed`). Each sends a `name`.

Not run by the framer: no test, no linter, no typecheck, no broad gate and no screenshot run. The suite is `unverified`, and the orchestrator answers it.

## Scope

In scope:

1. **"Add an account" takes no name and opens the sign-in at once.** The press sends `addAccount` with the size of the pane and no name. The daemon makes the folder `accounts/<id>` of its run folder, lends it the person's names as it does today, and starts the sign-in pane for it in the same request. It answers with `started`. Where the adapter signs no account in, the daemon refuses with a sentence before it makes any folder. Where it cannot find its agent, the daemon refuses with a sentence, removes the folder it made and keeps nothing.
2. **A folder whose first sign-in has not ended is no account.** The daemon does not list it among the accounts, and it cannot be set on a repository, a work item or a session, made the default, renamed, removed or signed in again by a request. `accounts.json` holds its id under `adding`, so the folder is accounted for when the daemon stops before the sign-in ends.
3. **The end of that sign-in pane decides the account, on the agent's word.** The daemon asks the adapter's `status` of the folder, as it does today at a sign-in pane's end.
   - A login stands: the folder becomes an account, signed in, named as item 4 says, and the daemon closes the sign-in pane.
   - No login stands, which is how a login the person cancelled, a pane the person closed and a login that failed all read: the daemon removes the folder with everything in it, drops the id from `adding` and adds no account. A pane that ended by itself stays listed until the person closes it, so what the sign-in printed can be read.
   - The agent could not say: the folder becomes an account under the name item 4 gives where the login names none, with its sign-in not read, and the daemon says why. Nothing is removed on a guess.
4. **The account is named from the login.** The adapter's `status` gains the name the agent gives the login. The Claude adapter reads it from `email` of `claude auth status`'s JSON, which the CLI reads from `oauthAccount.emailAddress` of `.claude.json` in the folder. The name is the email without the white space at its ends. Where the agent names none, a folder Owlery made is named `Account <id>` and a folder handed over is named by the last name of its path. Where another account already holds the name, the daemon appends ` (2)`, or the first number above it that no account's name holds. The name is given once, when the account is added, and the person renames it afterwards as today.
5. **A second login to the same Claude account is kept, and its name tells it apart.** Item 4's number is the whole rule. The daemon keeps no login's identity, compares none and signs nothing out. The grounds are `frame/plan.md` *Alternatives considered*, the row "Refuse the second login".
6. **"Use an existing folder…" takes no name and names its account the same way.** The daemon checks the folder as today, and refuses the folder Owlery makes its accounts' folders in and every folder inside it, then asks `status` of it. Where a login stands, the account takes the login's name and is stored signed in. Where none stands, the agent could not say, or the adapter signs no account in, the account is added under the folder's last name with its sign-in as the agent gave it, or not read. The daemon makes, links and removes nothing in the folder, as today.
7. **A daemon that starts settles each id under `adding`.** No pane outlives the daemon, so it asks `status` of each such folder and applies item 3.
8. **The dialog tells the person how the add ended.** The daemon sends the client that asked one message when it has decided, after the `accounts` that carries a new account. Where no account named from a login came of it, the message carries a sentence, and the dialog says it in its refusal line. While the add's sign-in runs, the sign-in section's head reads "Signing in to a new account". While any sign-in that window started waits on the daemon or runs, "Add an account" and each row's "Sign in" are disabled in that window, so no second sign-in replaces the pane the dialog draws.
9. **The name field leaves the dialog.** The label "Name", the input `accounts-name` and each line that reads or empties it go. The form's note says that the press opens Claude Code's sign-in and that the account is named from the login. The row's own "Sign in", "Check sign-in", "Rename" and "Remove…" stay as they are.
10. **The row "An account's name" in *Components and their states* states the new flow**, in `docs/design.md` and `docs/design.ko.md`, in place. The English text is under *Data & interfaces*.
11. **The screenshot run draws the dialog before, during and after a login.** The view `accounts` is the dialog before. Two views follow it: the dialog with the sign-in pane of a new account open, and the dialog with the row the login named. The run's CLI stand-in answers `auth login`, `auth status` and `auth logout`, and prints an invented email, so no login of the person's is read and no browser opens. Each pass removes the account it added, so every appearance draws the same rows. The view list sentence of *A pull request that changes the window carries its screenshots* names the two views, in both editions, in place.
12. **The cases' stand-in prints an email.** `claude-auth-stand-in/claude` prints `email` in its `status` where the folder is signed in, with a way for a case to make it print none.
13. **`gaps.md` holds the owner's check.** One real login through "Add an account" in the built app: the row is named by the account's email and reads as signed in.
14. **An account's row gives its record the dialog's width, and its actions stand under it.** Phase 3's shot `accounts-added` showed a row with six buttons beside its record: the record's column narrowed to about 100px, the name "dana@example.com" broke inside the word, and the usage lines wrapped every few words. Every account this work adds is named by an email, so every such row meets it. In the Accounts dialog the row's name, folder, sign-in and usage lines take the row's whole width, and the row's buttons stand on a line of their own under them, wrapping where they do not fit. A name breaks inside a word only where it is longer than the row. The row "An account's name" of *Components and their states* says where the buttons stand, in `docs/design.md` and `docs/design.ko.md`, in place. The views of *Scope* item 11 are shot again.

Out of scope:

- **System default is compared with nothing and named by nothing.** It is whatever login the person's shell gives, it has no folder, and Owlery reads no login of it today (`Account.signedIn` is always null for it). A person who adds the account System default already is gets a row named by that email.
- **A later sign-in does not rename an account.** The row's "Sign in" on an account that exists keeps its name, which the person may have edited, and never removes the account.
- **The window shows no email beside a name the person edited.** The daemon keeps the name alone.
- **`--email`, `--sso` and `--console` of `claude auth login` are not offered.** The press runs the command as today's "Sign in" does.
- **A daemon of 0.0.4 is not taught the new message.** It refuses an add without a name in its own words: `frame/plan.md` *Operational impact*.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A. One press signs in and names | Given a daemon whose adapter signs accounts in through the stand-in CLI. When a client sends `addAccount` with a pane size and no name. Then it receives `started` with a pane whose `signsIn` is the new id, no `accounts` lists that id while the stand-in holds the login, and once the login ends the `accounts` holds one new account, `made`, `signedIn: true`, named by the stand-in's email, and the pane is on no list. | A case in `apps/desktop/test/accounts.test.ts`, shown red against the old daemon. |
| B. A cancelled login leaves nothing | Given the same daemon and a login the stand-in holds. When the client closes the sign-in pane. Then no account is added, `accounts/<id>` of the run folder no longer stands, `accounts.json` holds no id under `adding`, and the client is told "The sign-in ended with no login, so no account was added." | A case in `accounts.test.ts`. It is shown red with the removal taken out. |
| C. A failed login leaves nothing | Given the stand-in refuses the login. When the pane ends. Then the result is scenario B's, and the ended pane is still listed so its output can be read. | The same case, second half. |
| D. An unread sign-in keeps the folder | Given a login that ended and a `status` that rejects. When the pane ends. Then the folder becomes the account `Account <id>` with `signedIn: null`, nothing is removed, and the client is told why. | A case in `accounts.test.ts` with a `logins` whose `status` rejects. |
| E. No email | Given a `status` that says a login stands and names none. When the pane ends. Then the account is named `Account <id>`. | The stand-in made to print no `email`, in the case of A. |
| F. Two logins to one Claude account | Given an account named by an email. When a second add ends signed in to the same email. Then both accounts stand, the second is named with ` (2)`, and no `auth logout` was called. | A case in `accounts.test.ts` that reads the stand-in's `calls`. |
| G. An existing folder is named from its login | Given a folder that holds a stand-in login. When a client sends `addAccount` with the folder and no name. Then the account is named by the email and is `signedIn: true` in the first `accounts` that carries it. Given a folder with no login, the account is named by the folder's last name. In both, every name and byte of the folder that the stand-in did not write is as it was. | A case in `accounts.test.ts`. |
| H. A handed folder is never removed | Given an account handed over and signed out. When its row's sign-in is cancelled or fails. Then the account and its folder stand. Given an `accounts.json` that names an id under `adding` whose folder is not `accounts/<id>` of the run folder, the daemon removes nothing when it settles that id. | A case of the store in `accounts.test.ts`. It is shown red with the store's check of the made path taken out. |
| I. A daemon stopped during a login | Given an add whose login is held. When the daemon stops and starts again. Then it asks `status` of the folder once and applies scenario A, B or D to it. | A case in `accounts.test.ts` over one run folder and two daemons. |
| J. A folder not yet an account takes no setting | Given an add whose login is held. When a client names the id in `setDefaultAccount`, `renameAccount`, `removeAccount`, `signIn`, `setRepository` or `start`. Then each is refused with "No account `<id>` is kept." | A case in `accounts.test.ts`. |
| K. The dialog | Given the built app with a CLI stand-in. When the person opens Accounts and presses "Add an account". Then the form holds no field, the sign-in section is shown with the head "Signing in to a new account", "Add an account" is disabled, and once the stand-in's login ends the list holds a row named by its email that reads "Signed in". | A built-app case in `apps/desktop/test/theme-controls.test.ts`, run once at phase 2's end and again by the orchestrator's broad gate. |
| L. No name field is left | After the build, `git grep -n -e 'accounts-name' -e 'accountsName' -- apps/desktop` prints nothing. | The search. Its run at `c6ea6fb9` and the account of each line it printed are in *Grounding*. |
| M. The policy row and the screenshots | The row "An account's name" states the flow in both editions. The run writes each view of *Scope* item 11 in each appearance of each theme, and the pull request carries them. | The broad gate's comparison of the two editions' headings and table rows. The proofer reads the two rows and the shots against `docs/design.md`. |
| N. A real login | The owner presses "Add an account" in the built app and signs in. The row is named by the account's email. | Nobody in the run: `gaps.md`, answered by the owner. |

## Data & interfaces

**The adapter** (`apps/desktop/src/daemon/adapters/adapter.ts#LoginStatus`). It gains `name: string | null`: the name the agent gives the login that stands, as an email, and null where no login stands or the agent names none. `claude-accounts.ts#loginStatusOf` reads `email` of the printed JSON where the command exited 0 and the value is a string that is not empty once trimmed.

**The store** (`apps/desktop/src/daemon/accounts.ts`). `accounts.json` gains `adding`, the ids of the made folders whose first sign-in has not ended. A file without the key reads as none. An id under `adding` is no account: `account`, `holds`, `accounts` and `listed` do not answer for it. `nextId` passes it. `addMade(name, adapter)` gives way to three acts whose names are the builder's: one makes the folder and notes the id, one turns a noted id into an account under a name, and one removes a noted id with its folder. The last removes only `accounts/<id>` of the run folder. `addHanded` takes the name the daemon gives it. The name's number is the store's: it is appended wherever an add would give a name another account holds.

**The protocol** (`apps/desktop/src/shared/protocol.ts`).

- `{ type: "addAccount"; requestId; folder?: string; cols?: number; rows?: number }`. `name` leaves it. Without `folder` it needs `cols` and `rows` and is answered with `started`. With `folder` it is answered with `done`, before the `accounts` that carries the account.
- `SessionInfo.signsIn` also names the id a folder takes as an account once its first sign-in ends signed in.
- A new message to the client that asked, `{ type: "addEnded"; id: number; accountId: number | null; says: string | null }`: `id` is the sign-in pane, `accountId` the account that now stands or null, and `says` a sentence where no account named from a login came of it.

**The daemon's sentences.**

- No login: "The sign-in ended with no login, so no account was added."
- The agent could not say: "Claude Code did not say whether the sign-in left a login, so the account is kept as "`<name>`". Check its sign-in from its row." The agent's own sentence follows it.
- A login that names no email: "Claude Code named no email for the login, so the account is kept as "`<name>`". Rename it from its row."

**The window** (`apps/desktop/src/renderer/index.html`, `renderer.ts`, `sign-in-pane.ts`).

- The form's note: "Add an account opens Claude Code's sign-in, and the account is named from the login. Owlery makes its folder, which shares your skills, plugins, settings and conversations. Or choose a config folder that holds a login of yours: Owlery makes nothing in it and never removes it."
- The sign-in section's head for an add: "Signing in to a new account", and "The sign-in of a new account has ended" once its process ended.

**The row for *Components and their states*.** This is the English row. The Korean edition says the same in its own words, written by the builder:

> | An account's name | The name in `--font-fact` and `--ink-faint`, after the facts of a line of the inbox and after a pane's label on its tab, only where the account differs from the one its repository or its work item gives. In the Accounts dialog an account is a row of a list of records, with the default said in words. Under its name stand its folder in `--font-fact` and `--ink-faint`, then the state of its sign-in, its usage with the time it arrived, its last refresh and the sentence on what a refresh spends, each in `--ink-muted` at `--size-caption` and wrapped. The name and these lines take the row's whole width, so a name breaks inside a word only where it is longer than the row. Under them, the default said in words and the row's buttons stand on a line of their own, and wrap where they do not fit. "Refresh usage" is a button of that row and not the main button. The form under the list holds no field: "Add an account" opens the sign-in pane at once, and the account's row appears, named from the login, when the sign-in ends signed in. The sign-in pane stands under the list. | — | — | A selected line draws the name in `--ink-muted`, as it draws its age. | — | While a sign-in this window started waits on the daemon or runs, "Add an account" and each row's "Sign in" are disabled, so no second sign-in replaces the pane the dialog draws. |

## Rule changes

- change
  file: docs/architecture.md
  section: Authentication of the Claude adapter
  from: A person adds an account in one of two ways: Owlery makes a folder in the daemon's run folder and runs `claude auth login` with it in a terminal pane, or the person hands over a folder that exists, which Owlery neither links into nor deletes. Owlery reads no credential file and no Keychain entry, passes no token in a variable, and learns whether a login stands from `claude auth status`.
  to: A person adds an account in one of two ways, and types no name in either: Owlery makes a folder in the daemon's run folder and at once runs `claude auth login` with it in a terminal pane, or the person hands over a folder that exists, which Owlery neither links into nor deletes. A folder Owlery made becomes an account only when its first sign-in ends with a login. Where that sign-in ends with none, Owlery removes the folder and keeps no account. An account is named once, when it is added, by the email `claude auth status` prints for its folder's login, which the CLI reads from `oauthAccount.emailAddress` of the folder's `.claude.json` (read in the executable of Claude Code 2.1.332, 2026-11-26). Where the CLI names no email, a folder Owlery made is named "Account" with its id, and a folder handed over is named by the last name of its path. A name another account holds takes a number in brackets. So a second login to one Claude account is kept and told apart, and nothing is signed out or removed because two emails are equal. The person renames an account afterwards. Owlery reads no credential file and no Keychain entry, passes no token in a variable, and learns whether a login stands, and the email it names, from `claude auth status`. That a real login prints the email has not been run.
- change
  file: docs/architecture.ko.md
  section: Claude 어댑터의 인증
  from: 계정을 더하는 길은 둘입니다. Owlery가 데몬의 실행 폴더에 폴더를 만들고 그 폴더로 터미널 칸에서 `claude auth login`을 실행하거나, 사람이 이미 있는 폴더를 넘깁니다. 넘겨받은 폴더에는 Owlery가 링크를 만들지 않고, 그 폴더를 지우지도 않습니다. Owlery는 자격 증명 파일도 키체인 항목도 읽지 않고, 토큰을 변수로 넘기지 않으며, 로그인이 있는지는 `claude auth status`로 압니다.
  to: 계정을 더하는 길은 둘이고, 어느 길에서도 사람이 이름을 적지 않습니다. Owlery가 데몬의 실행 폴더에 폴더를 만들고 곧바로 그 폴더로 터미널 칸에서 `claude auth login`을 실행하거나, 사람이 이미 있는 폴더를 넘깁니다. 넘겨받은 폴더에는 Owlery가 링크를 만들지 않고, 그 폴더를 지우지도 않습니다. Owlery가 만든 폴더는 첫 로그인이 로그인된 채로 끝나야 계정이 됩니다. 그 로그인이 로그인 없이 끝나면 Owlery는 폴더를 지우고 계정을 두지 않습니다. 계정의 이름은 계정을 더할 때 한 번, `claude auth status`가 그 폴더의 로그인에 대해 내놓는 이메일로 정합니다. CLI는 이 값을 그 폴더의 `.claude.json`에 있는 `oauthAccount.emailAddress`에서 읽습니다(Claude Code 2.1.332의 실행 파일에서 2026-11-26에 읽음). CLI가 이메일을 내놓지 않으면, Owlery가 만든 폴더는 "Account"와 그 id로, 넘겨받은 폴더는 경로의 마지막 이름으로 이름을 정합니다. 다른 계정이 이미 가진 이름에는 괄호 안에 번호를 붙입니다. 그래서 같은 Claude 계정에 두 번째로 로그인해도 계정은 남고 이름으로 구별되며, 두 이메일이 같다는 이유로 로그아웃하거나 지우는 것은 없습니다. 이름은 나중에 사람이 바꿉니다. Owlery는 자격 증명 파일도 키체인 항목도 읽지 않고, 토큰을 변수로 넘기지 않으며, 로그인이 있는지와 그 로그인의 이메일은 `claude auth status`로 압니다. 실제 로그인이 이메일을 내놓는지는 실행해 보지 않았습니다.
- change
  file: docs/architecture.md
  section: State lives in three places
  from: `accounts.json` in the daemon's run folder holds each account's name, its config folder, whether Owlery made that folder, which account is the default, what the CLI last said of each login, and the last usage-limit values each account's sessions handed over, System default's among them.
  to: `accounts.json` in the daemon's run folder holds each account's name, its config folder, whether Owlery made that folder, which account is the default, what the CLI last said of each login, and the last usage-limit values each account's sessions handed over, System default's among them. It also holds the id of each folder Owlery made whose first sign-in has not ended. A daemon that starts asks the CLI of each such folder, and keeps it as an account or removes it as it does when the sign-in's pane ends.
- change
  file: docs/architecture.ko.md
  section: 상태는 세 곳에 둡니다
  from: 데몬의 실행 폴더에 있는 `accounts.json`이 계정마다의 이름, 설정 폴더, Owlery가 그 폴더를 만들었는지, 어느 계정이 기본인지, CLI가 로그인마다 마지막으로 알린 것, 그리고 System default를 포함해 계정마다 그 세션이 마지막으로 넘겨준 사용 한도 값을 갖습니다.
  to: 데몬의 실행 폴더에 있는 `accounts.json`이 계정마다의 이름, 설정 폴더, Owlery가 그 폴더를 만들었는지, 어느 계정이 기본인지, CLI가 로그인마다 마지막으로 알린 것, 그리고 System default를 포함해 계정마다 그 세션이 마지막으로 넘겨준 사용 한도 값을 갖습니다. 이 파일은 Owlery가 만든 폴더 가운데 첫 로그인이 아직 끝나지 않은 폴더의 id도 갖습니다. 데몬은 시작할 때 그런 폴더마다 CLI에 묻고, 로그인 칸이 끝났을 때와 같이 그 폴더를 계정으로 두거나 지웁니다.
- add
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  to: **The screenshot run adds an account by a press, and captures the Accounts dialog during and after its login.** After the view of the Accounts dialog, the run presses "Add an account". The run's stand-in for the CLI holds the login, and the next view shows the sign-in pane of a new account under the list. The run then lets the login end, and the view after it shows the row the login named, by an invented email, as signed in. The run removes that account before the next view, so every appearance draws the same rows. No login of the person's is read and no browser opens.
    check: apps/desktop/test/screenshots.test.ts
- add
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  to: **스크린샷 실행은 단추 한 번으로 계정을 더하고, 로그인하는 동안과 로그인한 뒤의 Accounts 대화 상자를 찍습니다.** 실행은 Accounts 대화 상자의 화면 다음에 "Add an account"를 누릅니다. 실행이 쓰는 CLI 대역이 로그인을 붙잡아 두고, 다음 화면은 목록 아래에 새 계정의 로그인 칸을 보입니다. 그다음 실행은 로그인을 끝내고, 그 뒤의 화면은 로그인이 이름을 정한 줄을 보입니다. 그 줄의 이름은 지어낸 이메일이고, 줄은 로그인되어 있다고 적습니다. 실행은 다음 화면으로 가기 전에 그 계정을 지우므로, 모든 모양이 같은 줄들을 그립니다. 사람의 로그인은 읽지 않고, 브라우저도 열리지 않습니다.
    check: apps/desktop/test/screenshots.test.ts

## Removes

This work adds one mechanism, the list `adding` of `accounts.json`. In return it takes out the account that stood unsigned after the first press, whose row read "Sign-in not read yet" until a second press: the step the issue names as cumbersome.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The label "Name" and the input `accounts-name` | `apps/desktop/src/renderer/index.html`, `#accounts-form` | Nothing: the login names the account. |
| `accountsName` and each line that reads or empties it | `apps/desktop/src/renderer/renderer.ts#takeAccountsAnswer`, `#openAccounts`, `#addMadeAccount`, `#addAccount` | Nothing: no name is typed. |
| The form's note "…and you sign it in." | `apps/desktop/src/renderer/index.html`, `#accounts-form .says` | The note of *Data & interfaces*. |
| `name` of the `addAccount` message, and its comment's sentences on the name | `apps/desktop/src/shared/protocol.ts#ClientMessage` | The message of *Data & interfaces*. |
| The answer `done` to an add with no folder | `apps/desktop/src/daemon/daemon.ts`, `case "addAccount"` | `started`, with the sign-in pane. |
| `AccountStore.addMade(name, adapter)`, which stores an account before any login | `apps/desktop/src/daemon/accounts.ts#AccountStore.addMade` | The acts *Data & interfaces* gives the store. |
| The refusal "An account needs a name." for an add | `apps/desktop/src/daemon/accounts.ts#AccountStore.addHanded`, `#AccountStore.addMade` | `rename` keeps the sentence for a name a person empties. |
| The refusal "An account is added with a name, and the absolute path of its folder where the person hands one over." | `apps/desktop/src/daemon/daemon.ts`, `case "addAccount"` | A sentence that names the folder and the pane's size alone. |
| The case pins of an add under a typed name, and of a made account that stands with `signedIn: null` after the add | `apps/desktop/test/accounts.test.ts`, `apps/desktop/test/daemon.test.ts`: each sender *Grounding* lists; `apps/desktop/test/theme-controls.test.ts:312-326` | Rewritten to the add without a name. A case that only needs an account for another subject adds it through one helper. |
| The pins of the run's shots: the file lists and each `78` | `apps/desktop/test/screenshots.test.ts:305-337` | Rewritten for the views *Scope* item 11 adds. |

## What the daemon could do beyond the issue

None of these is in *Scope*, and none was probed. The orchestrator takes what is cheap and files issues for the rest.

- **Show the login's email under a name the person edited.** The daemon would keep the email beside the name and send it. It is a field of the protocol and a part of the row the issue did not ask for.
- **Tell the person when a new account is the login System default gives.** The daemon would run `claude auth status` with no folder named. Owlery reads nothing of System default today, so this changes a rule of `docs/architecture.md`.
- **Restart a daemon of another version when the app starts.** A window of this build that meets a daemon of 0.0.4 is refused its add until the person restarts the daemon from the menu.

Framed 2026-11-26 by framer, before the build.
