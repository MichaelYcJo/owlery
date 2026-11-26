# Review round 2: 1795651592-218-one-press-adds-and-names-an-account

```seal
target: cad1cc32, fixes cc396ca1..cad1cc32
```

This is the verifying round after round 1's fix pass. The code reviewed is the fix diff `cc396ca1..cad1cc32`: `e7d85354`, `8a5cb9b1` and `4cc7b1f0`, the close blocks of `95e13211`, and the orchestrator's fold `cad1cc32`. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `cad1cc32`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. `trail/phases/` was searched for the units the fixes touch (`grep -n` for `handedPath`, `showSignIn` and `disabled`), not read whole. No `seal/parity.json` stands.

Carried from round 1 and not established again: where the window's sign-in state lives (`apps/desktop/src/renderer/sign-in-pane.ts`), the two calls of `askedSignIn` as every way this window starts a sign-in, and the store's two removals, `dropMade` and `remove`. The list of removals was checked again with round 1's own search, which the close of finding 3 also ran. Every verdict below is this round's.

Both findings come from one gap in the fix pass of finding 1. It changed what the window draws during a sign-in, and two things that follow from that change were not done. The pull request's shots of that state were not taken again, and one half of the new disabled rule went into no case and no mutation run, although the closing memo says it did.

## Findings

### 1. The six `accounts-adding` shots draw the handed row's "Sign in" enabled, and the window at the target draws it disabled in that state

```seal
severity: should
location: `seal/threads/1795651592-218-one-press-adds-and-names-an-account/screenshots/night-watch-dark-accounts-adding.png`, `seal/threads/1795651592-218-one-press-adds-and-names-an-account/screenshots/night-watch-light-accounts-adding.png`, `seal/threads/1795651592-218-one-press-adds-and-names-an-account/screenshots/register-dark-accounts-adding.png`, `seal/threads/1795651592-218-one-press-adds-and-names-an-account/screenshots/register-light-accounts-adding.png`, `seal/threads/1795651592-218-one-press-adds-and-names-an-account/screenshots/desk-dark-accounts-adding.png`, `seal/threads/1795651592-218-one-press-adds-and-names-an-account/screenshots/desk-light-accounts-adding.png`, `apps/desktop/src/renderer/sign-in-pane.ts:77-80`
evidence: executed `git log --oneline cc396ca1..cad1cc32 -- seal/threads/1795651592-218-one-press-adds-and-names-an-account/screenshots`, which printed nothing; executed `git grep -n -F "accounts-adding" cad1cc32 -- seal/threads/1795651592-218-one-press-adds-and-names-an-account docs apps/desktop/test`; read `seal/threads/1795651592-218-one-press-adds-and-names-an-account/screenshots/night-watch-dark-accounts-adding.png`, `apps/desktop/src/renderer/sign-in-pane.ts:77-80`, `apps/desktop/test/screenshots.test.ts:593-598`, `apps/desktop/src/renderer/index.html:70`, `docs/design.md:456`, `docs/design.md:506`
regression: round-1#1
```

Why it matters: the unit is `showSignIn` in `apps/desktop/src/renderer/sign-in-pane.ts`, which now disables each row's "Sign in" while the add's pane runs (`:78-80`). *Scope* item 8, as `cad1cc32` folds it, disables the rows' "Sign in" during any sign-in the window started. *Scope* item 11 has the pull request carry the dialog during a login as a shot. The fix pass changed what that view draws and did not run the screenshot command again, and the stale shots come from that.

The view `accounts-adding` is taken while the add's pane runs. The run waits for the head "Signing in to a new account" (`screenshots.test.ts:597`), and `showSignIn` writes that head only where `alive` holds (`sign-in-pane.ts:84`). The same `alive` sets `busy` (`:78`), so at the moment of the shot every `#accounts-list button[data-sign-in]` is disabled. A disabled button is drawn at `opacity: 0.45` (`index.html:70`). The handed account Work offers "Sign in" in that scene. Phase 4's shot `night-watch-dark-accounts-adding.png` draws Work's "Sign in" at full ink beside the dimmed "Add an account". The search for shot commits since round 1 printed nothing, so the six `accounts-adding` files are still phase 4's from `2a398997`, made before `8a5cb9b1`.

`docs/design.md:506` says that a pull request that changes the window carries a screenshot of each view it changed, made from the built app, and that its review reads the shots against *Components and their states*. The Disabled cell of the row "An account's name" (`docs/design.md:456`) now says each row's "Sign in" is disabled while a sign-in this window started runs. The six shots show the opposite, so a reviewer who reads them against the row finds a defect the build does not have. The sealer reads the same shots. The views `accounts` and `accounts-added` are drawn with no sign-in running, so `busy` is false in them and their shots stand.

The search listed each statement of the view. The phase records describe the shot as "Add an account" disabled and say nothing of the rows' "Sign in" (`phase-3.md:24`, `phase-4.md:36`). They are past records and stay. No other statement names the rows' buttons in that view. The search is a sample under contract rule 19.

Re-run the screenshot command in `apps/desktop` at the fix commit, through the machine's lock. Then copy each `accounts-adding` file over the one in the work item's `screenshots/`, and open one to read that the handed row's "Sign in" is dimmed:

```sh
OWLERY_BACKGROUND=1 OWLERY_SCREENSHOT_THEMES=all pnpm --filter @owlery/desktop run screenshots
# then, for each theme and appearance, copy <run folder>/<theme>-<appearance>-accounts-adding.png
# over seal/threads/1795651592-218-one-press-adds-and-names-an-account/screenshots/<theme>-<appearance>-accounts-adding.png
```

The fix pass's record of the run says which shots it replaced. The other twelve files may be replaced from the same run or left as they are, since their views draw no sign-in.

```seal
verdict: fixed 0df67d23
location: `seal/threads/1795651592-218-one-press-adds-and-names-an-account/gaps.md`
answer: The finding holds. The screenshot command ran as given, through the machine's lock, at `5ac087c2`, with `OWLERY_SCREENSHOT_DIR` in the fix pass's scratch folder: 90 files, exit 0 (`executed`). `0df67d23` copied the six `accounts-adding` files over the work item's. The new `night-watch-dark-accounts-adding.png` and `register-light-accounts-adding.png` were opened (`read`). In each, Work's "Sign in" is dimmed beside "Make the default", "Check sign-in", "Rename" and "Remove…" at full ink. "Add an account" is dimmed, and the head "Signing in to a new account" stands over the terminal. `cmp` found every one of the other twelve files different in bytes from the committed one. One of them, `night-watch-dark-accounts-added.png`, was opened and compared with phase 4's file of the same name, which was read in phase 4. The two differ only in the temporary folder names each run gives, in Work's folder path and in the new account's run folder path. Every button, line and state is the same. So the twelve were left as they are, because the run draws them the same. `gaps.md:12` counts this run beside phase 3's and phase 4's, and was rewritten in place in `00537f7c`.
```

### 2. The half of the disabled rule that holds while a sign-in request waits on the daemon is held by no case, and the closed row of `gaps.md` says a mutation run covered it

```seal
severity: should
location: `apps/desktop/src/renderer/sign-in-pane.ts:78`, `apps/desktop/test/theme-controls.test.ts:389-395`, `seal/threads/1795651592-218-one-press-adds-and-names-an-account/gaps.md:10`
evidence: executed `node scripts/test-in-electron.mjs test/theme-controls.test.ts` in `apps/desktop` with `sign-in-pane.ts:78` patched to `const busy = alive;` (the second probe of `## Probes`), which passed 11 of 11 and exited 0; read `apps/desktop/src/renderer/sign-in-pane.ts:29-31`, `apps/desktop/src/renderer/sign-in-pane.ts:75-80`, `apps/desktop/test/theme-controls.test.ts:389-412`, `seal/threads/1795651592-218-one-press-adds-and-names-an-account/gaps.md:10`, `seal/threads/1795651592-218-one-press-adds-and-names-an-account/trail/rounds/round-1.md:77`
regression: round-1#1
```

Why it matters: the unit is `showSignIn`'s rule `const busy = asked !== undefined || alive` (`sign-in-pane.ts:78`). *Scope* item 8, as folded, disables "Add an account" and each row's "Sign in" while any sign-in the window started "waits on the daemon or runs". The fix pass made the waiting half cover a row's sign-in, where before `8a5cb9b1` it covered only an add (`asked?.accountId === null`). The defect is that the fix pass pinned the running half alone.

The waiting half is what stops a second press between the press and the daemon's `started`. `askedSignIn` sets `asked` and calls `showSignIn` in the same turn as the press (`sign-in-pane.ts:29-31`), so a second press in that turn meets a disabled button. Without the half, two quick presses of a row's "Sign in", or a row's "Sign in" and then "Add an account", each start a pane. The second `started` then replaces the first pane's request in `asked`, and the first pane runs where no window draws it. That is round 1's finding 1 again, in a narrower window of time.

The probe removed the half, leaving `const busy = alive;`, and every case of `theme-controls.test.ts` passed. Each case that reads the disabled state reads it only after waiting for the pane's head (`theme-controls.test.ts:395-397`), when `alive` already holds. The close of round 1's finding 1 names three mutants: `busy` without `alive`, the rows' loop setting `false`, and the call of `showSignIn` taken out of `showAccounts` (`round-1.md:77`). None of them removes `asked`. `gaps.md:10` is marked `closed` and its second cell says "each went red: the disabled state at scenario K's case and at the case 'starts no second sign-in from the dialog…'". That is true of the running half only. The sealer reads that row as coverage that does not exist.

The fix is a read in the same turn as the press, before any message from the daemon can reach the page. Only `asked` can hold the buttons disabled there. In `theme-controls.test.ts`, replace the press at `:395` of the case "starts no second sign-in from the dialog…":

```ts
      // Read in the same turn as the press, before the daemon's `started` can reach the page: only the request that waits holds the two buttons disabled here.
      expect(await app.evaluate<[boolean, boolean]>(`(() => { const button = ${signIn}; button.click(); return [document.getElementById("accounts-add").disabled, button.disabled]; })()`)).toEqual([true, true]);
```

The case's name gains the half: "…a row's sign-in disables Add an account and every row's Sign in from its press, while its request waits on the daemon and until its process ends, in the dialog opened again too, so no pane replaces the one the dialog draws". Show the case red with `sign-in-pane.ts:78` as `const busy = alive;`, where the new read gives `[false, false]` (contract rule 15). In the second cell of `gaps.md:10`, the words "the disabled state at scenario K's case and at the case "starts no second sign-in from the dialog…"" become "the disabled state while a sign-in runs at scenario K's case and at the case "starts no second sign-in from the dialog…", and the disabled state while its request waits on the daemon at that case's read in the turn of its press".

```seal
verdict: fixed 5ac087c2
answer: The finding holds, and the paste was applied as given. The press at `theme-controls.test.ts:395` is now a read in the press's own turn, and the case's name gains the waiting half in the paste's words. Before `5ac087c2`, `seal mutate` with `sign-in-pane.ts:78` as `const busy = alive;` against `theme-controls.test.ts -t "scenario K|Scope item 14|starts no second sign-in"` went `red` at the new read, `[false, false]` where `[true, true]` was expected (`executed`, exit 0). The second cell of `gaps.md:10` was rewritten with the paste's words and says that this pass added that read. The review set `node scripts/test-in-electron.mjs test/accounts.test.ts test/theme-controls.test.ts` ran at `5ac087c2`: 66 passed, exit 0 (`executed`). The limit of `realOf` that `## Confirmations` names was judged. `realpathSync.native` was owed, and not only a narrower docstring, because the refusal of finding 3 in round 1 guards a folder the store may remove, and other capitals passed it. `5c827208` makes `realOf` answer the disk's spelling, as `apps/desktop/src/daemon/role-grants.ts` already does. The docstring of `handedPath` now says each refusal holds through a link or, on a volume that ignores letter case, in other capitals. The refusals case of `accounts.test.ts` gains two rows where the volume ignores case: the handed folder and the folder of a running add, each spelt in capitals. Before the change they were `red` at the first row, which no refusal threw (`executed`, exit 1). After it, `accounts.test.ts` passed 55 of 55, exit 0 (`executed`). On a case-sensitive volume the two rows do not run, since no other spelling names the folder there. No frame statement names how a path is spelt, so nothing is owed to the fold. The read after the last fix commit `00537f7c`: `git diff a99fb38e 00537f7c -- apps` was printed and read whole (`read`). The `gaps.md` hunks and the shots are held from this pass's own edits. `grep` over the frame files, `routing.md`, `changelog.md`, `gaps.md` and `pr.md` for "spell", "capitals" and "letter case" printed nothing (`executed`). The changelog's "Use an existing folder…" line stays true as written. That search is a sample under contract rule 19, and a sentence of the tree that states the folder checks in other words stands unchecked.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: the path round 1 named is closed (`read`, then `executed`). `showSignIn` computes `busy` from `asked` and `alive` and sets it on `#accounts-add` and on each `#accounts-list button[data-sign-in]` (`apps/desktop/src/renderer/sign-in-pane.ts:78-80`). `showAccounts` marks the row's "Sign in" with `data-sign-in` (`apps/desktop/src/renderer/renderer.ts:995-998`) and calls `showSignIn` after it draws the rows (`renderer.ts:1022`). Every redraw of the rows goes through `showAccounts`: the `accounts` message through `drawAccountsDialog` (`renderer.ts:1588-1590`), the answers at `:869`, and the opening at `:884`. So a redraw cannot leave a fresh enabled "Sign in" while a sign-in runs. The `inbox` message calls `showSignIn` while the dialog is open (`renderer.ts:1853`), which enables the buttons again once the pane's process ends. A request the daemon never answers does not keep them disabled for good, because the window loads again once the connection closes (`renderer.ts:2065-2068`). `theme-controls.test.ts` ran whole with `accounts.test.ts` in one command, 66 of 66 passed, exit 0 (`executed`). That run includes the case "starts no second sign-in from the dialog…" at `:389`. The fix pass's account of its mutants and of the case seen red is `read` from the close, and this round did not run those mutants again. Finding 2 above is the half the case does not hold. Finding 1 is the shots the fix did not take again. Neither is the defect round 1 named.

The fix pass's choice to put the rule in `showSignIn` and not in a new export `signInBusy` holds. Round 1's paste needed the export only to set the row's button at draw time, and calling `showSignIn` at the end of `showAccounts` sets it there instead. Moving the call from the start of `showAccounts` to its end changes nothing else, because no row's drawing reads `shown` or the section (`read`, `renderer.ts:899-1023`). The departure from *Scope* item 8 that the close named is folded by `cad1cc32` into item 8, into the quoted row of *Data & interfaces*, and into `docs/design.md:456` and `docs/design.ko.md:456`, which say the same in each language (`read`).

```seal
confirms: round-1#2
```
What holds: the case round 1 asked for stands at `apps/desktop/test/theme-controls.test.ts:415`, as pasted (`read`). It lets the stand-in refuse the login, waits for the sentence "The sign-in ended with no login, so no account was added." in the refusal line, and reads the head "The sign-in of a new account has ended", the section shown, and "Add an account" enabled. It passed in this round's run (`executed`, see `## Probes`). `takeAddEnded` (`renderer.ts:1042-1044`) and the ended head (`sign-in-pane.ts:84`) are what it reads. The fix pass's two mutants of these units are `read` from the close. `gaps.md:10` was rewritten in place and marked `closed`, not taken out, which `skills/implement/SKILL.md` *4. The closing memo* asks for. Finding 2 is the part of that row's second cell that overstates.

```seal
confirms: round-1#3
```
What holds: `handedPath` refuses the store's folder of made folders and every folder in it, by real path, after the check of an account's folder (`apps/desktop/src/daemon/accounts.ts:219-223`, `read`). The daemon reaches the check before `status` and again at `addHanded` (`apps/desktop/src/daemon/daemon.ts:1769-1771`, `accounts.ts:238`). So a made folder that appears during the `status` await is still refused when the account is stored. The refusals case of `apps/desktop/test/accounts.test.ts` gains three rows: `accounts/` itself, which holds `real === made`, and the folder `beginMade` answered and a folder inside it, which hold the prefix. It passed in this round's run (`executed`). Round 1's search, run again as `git grep -n rmSync cad1cc32 -- src/daemon/accounts.ts`, printed the import line, `dropMade` at `:286` and `remove` at `:315` (`executed`). Both remove under the refused folder.

The fix pass's sentence holds, and it is the better one. The pasted "The folder X is one Owlery makes for its accounts" is false for `accounts/` itself and for a folder inside a made account's folder, and the case refuses both. The written sentence, "The folder X is the folder Owlery makes its accounts' folders in, or stands inside it, so it is not handed over.", is true of each. It is a whole sentence that names the thing, with no first person, as `docs/design.md` *The voice of the window's words* asks. *Scope* item 6 and `pr.md`'s quote of it carry the refusal word for word after `cad1cc32` (`read`), and `changelog.md:10` says it.

What matched: `cad1cc32`'s fold (`read`, `executed`). *Scope* items 6 and 8 state what the code does. The quoted row "An account's name" under *Data & interfaces* is the row of `docs/design.md` at the target: a shell comparison of the two lines printed `same` (`executed`). `pr.md`'s quote of item 6 stands verbatim in item 6. Each other quote of `pr.md` stands as round 1 read it, and the fold changed no other line it quotes. `changelog.md:5` and `:10` say what `sign-in-pane.ts:78-80` and `accounts.ts:219-223` do.

What matched: the two new built-app cases read against their group. The case at `:389` holds a row's sign-in, the dialog opened again during it, and the rows' "Sign in". No earlier case of the file reads any of the three. The case at `:415` holds the path of an add that ends with no login, which scenario K's case never takes. Neither duplicates a case of the file.

What matched, with a limit seen: `realOf` resolves links with `realpathSync`, and that keeps the letter case it is given. On this Mac's case-insensitive volume, `realpathSync` answered a path spelt `ACCOUNTS/2` as given, while `realpathSync.native` answered `accounts/2` (`executed`, the third probe). So a path that spells the store's folder with other capitals passes both the check of an account's folder and the new refusal. The docstring's "however the two paths spell it" (`accounts.ts:201`) is true of links and not of letter case. A person hands a folder over only through the system's folder dialog (`renderer.ts#addAccount`), which likely answers the path as the disk spells it. Only a request no dialog sends reaches the gap, and what it reaches is Owlery's own made folder. This round opens no finding for it and names it here for the sealer.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the repository typecheck and the broad gate's comparison of the two editions of `docs/design.md`. This round ran `accounts.test.ts` and `theme-controls.test.ts` alone, so the suite is `unverified` | `seal/config.json` `Broad gate` | the orchestrator |
| Whether a real `claude auth status` prints the login's email as `email` (`frame/questions.md` Q1). No real login ran in this round | `apps/desktop/src/daemon/adapters/claude-accounts.ts` | the owner, by the real login `gaps.md` holds |
| The fix pass's `seal mutate` runs and its seen-red runs named in round 1's close blocks. This round ran the cases green and one mutant of its own, and did not run the fix pass's mutants again | `seal/threads/1795651592-218-one-press-adds-and-names-an-account/trail/rounds/round-1.md` | the fix pass's logs, which are not in the tree |
| The six `accounts-adding` shots as the screenshot command will draw them after finding 1's fix. This round read the code that draws them and ran no screenshot command | `apps/desktop/test/screenshots.test.ts:593-598` | the next round, against the shots the fix pass commits |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/accounts.test.ts test/theme-controls.test.ts`, run once in `apps/desktop` of this round's clone at `cad1cc32`, through the machine's lock | 2 files, 66 cases passed, exit 0 |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/theme-controls.test.ts`, run once with `sign-in-pane.ts:78` patched to `const busy = alive;`, through the machine's lock; the patch was then taken back with the `Edit` tool, and `git status --short` printed nothing | 1 file, 11 cases passed, exit 0: no case holds the waiting half of the rule |
| `node -e` printing `realpathSync` and `realpathSync.native` of a scratch folder `accounts/2` named as `ACCOUNTS/2`, in this round's scratch directory | `realpathSync` answered the path as `ACCOUNTS/2`, and `realpathSync.native` as `accounts/2` |
