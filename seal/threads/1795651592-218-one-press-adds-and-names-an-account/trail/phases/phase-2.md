# Phase 2: 1795651592-218-one-press-adds-and-names-an-account

## What this phase found

**The frame holds against the tree for this phase, with four places it leaves open or words otherwise.** Before the first edit, the coordinates phase 2 builds on were opened at `00700ca2` (`read`): the `addAccount` branch of `daemon.ts`, `signIn`, `watchProcess`'s exit path with its `!this.closed` check, the `close` request, `startSession`'s `signsIn` argument, the store's acts from phase 1, `sign-in-pane.ts`, the dialog's lines in `renderer.ts` and `index.html`, and each sender *Grounding* lists. Each one is as *Technical context* and *Grounding* describe it. These are the four places:

- *Data & interfaces* gives no sentence for a login that stands and names no email, though *Scope* item 8 asks for one wherever "no account named from a login came of it". The daemon says: `Claude Code named no email for the login, so the account is kept as "<name>". Rename it from its row.` It is judged against `docs/design.md` *The voice of the window's words*: a whole sentence that names the thing and the act the row offers.
- In the case where the agent could not say, `frame/plan.md` *Alternatives considered* ("Leave the ended pane open after a login that succeeded") and *Scope* item 3 differ. The daemon closes the sign-in pane only where a login stands. Where the agent could not say, the pane stays listed with what it printed. *Scope* item 3 names the close under its first bullet alone, and the plan's row speaks of a login that succeeded, which this case is not.
- *Scope* item 1 has the daemon remove the folder it made where the adapter signs no account in. The daemon refuses that add before it makes any folder, so nothing is made and nothing is removed, and a person sees the same refusal. The case of the add without a folder pins that no `accounts` folder stands after it.
- Scenario K's row says the broad gate runs the built-app case. `frame/plan.md` *Phases* also has phase 2 run it, so it ran once in this phase, alone.

**A handed folder is checked before the agent is asked of it, through the store's new `handedPath`.** *Scope* item 6 has the daemon check the folder "as today, then" ask `status`. `AccountStore.handedPath(folder)` throws the sentences `addHanded` threw for a folder, and answers the path as the store keeps it, without a slash at its end. `addHanded` calls it again before it writes, so no caller can store a folder it refuses. `addHanded(name, folder, adapter, login)` takes the login as the agent gave it, and none where the agent said nothing. The daemon passes `status`'s answer, or none where `status` rejects or the adapter signs no account in. The account is then named by the folder's last name, with its sign-in not read. `addMade` and the refusal "An account needs a name." in `addHanded` are gone, as *Removes* names them. `rename` keeps that refusal.

**A handed folder takes its id only once the agent has answered of it.** The id is given at `addHanded`, after `await status`, and a folder Owlery makes takes its id at once in `beginMade`. So two adds sent together can take their ids in the other order. Two existing cases depended on the send order:

- The case of `daemon.test.ts` that changes a running pane's account sent a handed add and a made add together. It now waits for the handed add's `done` first.
- Scenario I's case reads the store's list sorted by id, because the three folders are kept in the order their answers came.

Each of these is a change to a case's order, and no assertion of a name or a folder changed. Judged against `frame/design.md` *Data & interfaces*, which orders the answer `done` before the `accounts` and names no order between two adds.

**The daemon's add is one method, and the end of its sign-in is another.** The new methods are `daemon.ts#addAccount` and `#endAdd`, and `closePane` is extracted from the `close` request:

- **The add without a folder.** It refuses an adapter that signs no account in before it makes any folder. It then calls `beginMade`, gives the folder the person's names, asks the adapter for the sign-in command and starts the pane under the new id as `signsIn`. Any throw in those steps removes the folder through `dropMade` and refuses with the thrown sentence. Example: the lookup's "claude was not found by the login shell". The daemon keeps the asking socket by the id, in `adds`.
- **The end of the sign-in.** `watchProcess`'s exit path sends a stored account to `readLogin`, as before, and every other `signsIn` id to `endAdd`. `endAdd` reads the folder only from `adding()`, so an id that is a stored account, or no noted folder, decides nothing. After `status` answers, a daemon that closed meanwhile decides nothing, and its next start reads the id again (*Scope* item 7).
- **The order of messages.** `endAdd` sends `accounts` where an account now stands. It then sends `addEnded` to the asking client, where that client is still connected. Last, it closes the pane through `closePane`, where a login stands and the pane is still listed.
- **The start.** `listen` calls `endAdd` for each id under `adding` once the server listens.
- **`closePane`.** It is the `close` request's body, moved. It adds no behaviour, and the `close` cases of `daemon.test.ts` in the phase set prove it at the new place.

**The window marks an add by a null account.** `askedSignIn(requestId, null)` notes an add. `takeSignInStarted` takes the whole `SessionInfo` and keeps the pane's `signsIn` as the id the add will name. `showSignIn` sets the head to "Signing in to a new account" while the pane's process runs, and to "The sign-in of a new account has ended" afterwards. `showSignIn` also disables `#accounts-add` while this window waits for the add's pane or that pane's process runs. A refusal re-enables it through `signInRefused`. `addEnded` with a sentence puts the sentence in the dialog's refusal line, where the dialog is open. The name field, its label and every line that read `accountsName` are gone, and the form's note is the one *Data & interfaces* gives.

**A built-app case points the daemon's lookup at a stand-in through the receiver.** `test/fixtures/receiver.sh` answers the lookup with the CLI `OWLERY_RECEIVER_CLI` names, a PATH of the system's folders and the config folder `CLAUDE_CONFIG_DIR` names, where that variable is set. It answers nothing otherwise, as before. `theme-controls.test.ts` copies the stand-in into its repository's folder and names the copy, so "Add an account" starts no CLI of the person's and reads nothing under `~/.claude`. `BuiltApp.start` already sets `CLAUDE_CONFIG_DIR` to the app's own folder. Its second account case, the one a second client adds an account in, now hands over a folder named `Home`, because no add takes a name.

**The row "An account's name" was rewritten in place in both editions.** `docs/design.md` carries the English text of *Data & interfaces*. `docs/design.ko.md` carries the same in Korean: the form under the list holds no field, the press opens the sign-in pane at once, the row appears named from the login, and the Disabled column says "Add an account" is disabled while the add's sign-in runs.

**Seen red** (contract rule 15, `executed`). After the test edits, and before any change to `daemon.ts` or `accounts.ts`, `node scripts/test-in-electron.mjs test/accounts.test.ts` failed 30 of its 54 cases. `protocol.ts` had changed by then, in its types and comments alone, which the run strips and does not execute. They were the rewritten senders and the new cases of scenarios A to J, among them H's first half. Eleven failed on the old daemon's refusal "An account is added with a name, and the absolute path of its folder where the person hands one over.", four on waits that timed out for messages the old daemon never sent, one on `store.handedPath is not a function`, and the rest on assertions that read what those adds left, such as "No account 1 is kept." where no account had been added. The three cases added after the first mutation runs were seen red with their guard removed: their rows below show it. Scenario K's case was not seen red. `theme-controls.test.ts` runs once, and that run was the green one. Against the old window its first assertion would fail, because the old form holds the name input (`read`).

**Mutation runs** (`seal mutate`, one break each, `executed`). The batch over `daemon.ts` ran against all of `test/accounts.test.ts` at `640560aa`. Each verdict below is `red` unless it says otherwise:

- `endAdd` without `dropMade`.
- The unread sign-in dropping the folder in place of keeping it.
- The login's name left out.
- `Account <id>` replaced by a constant.
- A handed folder's name without the login's name.
- A handed folder named by its whole path.
- The start's settle left out.
- The pane left open after a login stands.
- The exit path sending no add to `endAdd`.
- `addEnded` never sent.
- The size check left out.
- The folder's type check left out.
- A rejected `status` no longer caught.
- A handed folder's login dropped.
- `adds` never noted.
- `handedPath` not called before `status`: `SURVIVED` at `640560aa`. `e4a16e7e` added to scenario G's case three refused folders and a folder named with a slash at its end, with the stand-in's `calls` read. The mutant then went `red` against `-t "scenario G|decides nothing of a folder|adds an account with no folder"`.
- `endAdd` deciding after the daemon closed: `SURVIVED` at `640560aa`. `e4a16e7e` added the case "decides nothing of a folder the CLI is still asked of when the daemon closes…", and the mutant then went `red` at that case's check that `accounts/1` stands.
- `dropMade` left out where the sign-in cannot start: `SURVIVED` at `640560aa`. `e4a16e7e` added to the case of the add without a folder an adapter whose `signIn` rejects. The mutant then went `red`.

The two mutants of the store ran against `-t AccountStore`, and both went `red`: `handedPath` keeping the slash at the path's end, and `addHanded` storing the folder as given.

**One assertion of the removed `addMade` case moved, and the others had a home already.** The case of `beginMade` already pinned the folder's mode, its emptiness, the id that passes a folder left standing, and the refusal of a store with no run folder. It now also pins that such a left-behind folder keeps its bytes (`d6e3b60a`), which only the `addMade` case pinned before.

**Scenario H's first half holds by more than one guard, so no single break of phase 2 turns it red** (`executed`). Each of two mutants left the case green against `-t "scenario H"`. In the first, the exit path sends a stored account to `endAdd` too. In the second, `endAdd` also finds a stored account's folder. Each is caught by the other's guard, and behind both stands phase 1's `noted` check in `keepMade` and `dropMade`. The case was red against the old daemon, at its add without a name.

**The window's new units ran in no mutation.** `sign-in-pane.ts`'s disabled state and head, and `renderer.ts#takeAddEnded`, are covered by scenario K's built-app case alone, and that file runs once in this phase. `gaps.md` holds them.

**The typecheck.** `npx tsc --noEmit -p tsconfig.json` in `apps/desktop`, the package's `typecheck` script, exited 0 over the whole package before each of `640560aa`, `e4a16e7e` and `d6e3b60a` (`executed`). The repository configures no formatter and no linter.

**The phase's runs** (`executed`):

- `node scripts/test-in-electron.mjs test/accounts.test.ts test/daemon.test.ts test/claude-adapter.test.ts` at `e4a16e7e`: 538 of 538 cases passed in the three files, exit 0. This also closes phase 1's two rows for `claude-adapter.test.ts` and `daemon.test.ts`.
- `node scripts/test-in-electron.mjs test/theme-controls.test.ts`, alone, with `OWLERY_BACKGROUND=1`, at the tree of `640560aa`: 8 of 8 cases passed. The build it ran held "Signing in to a new account" in `dist/renderer.js` and no `accounts-name` in `dist/index.html`.
- `node scripts/test-in-electron.mjs test/accounts.test.ts test/korean-input.test.ts -t "AccountStore|exits at once and writes nothing"` at the tree of `d6e3b60a`: the 18 store cases and the receiver's own case passed, exit 0. `d6e3b60a` changed one comment of `daemon.ts` and moved one assertion into the case of `beginMade`, after the phase set ran.
- Scenario L: `git grep -n -e 'accounts-name' -e 'accountsName' -- apps/desktop` printed nothing and exited 1. The same search at `c6ea6fb9` prints the lines *Grounding* lists.

**What the next phase needs from this one.** `test/fixtures/sample-cli.sh`, the CLI of the screenshot run, answers no `auth` command yet, and *Scope* item 11 needs it to. The rule changes for `docs/architecture.md` and `docs/architecture.ko.md`, *Authentication of the Claude adapter* and *State lives in three places*, are not applied. The first still describes an add under a typed name, and the second names no `adding`.
