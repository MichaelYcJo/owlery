# Review round 1: 1795651592-218-one-press-adds-and-names-an-account

```seal
target: b22a499f against release/v0.0.5
```

The diff read is `9f9ba1da..b22a499f`, from the branch's cut of `release/v0.0.5` to the target. This is round 1, so no earlier round's coordinate was carried, and every fact below was established at the target in this round.

The three findings share one cause in two places. The add now holds a folder that is no account while its login runs, and two readers of "what is this window's sign-in" and "what folder is an account's" were left as they read before. Finding 1 is the window's side: a second sign-in from the dialog hides the add's running pane. Finding 3 is the store's side: a folder under `adding` passes the check that refuses an account's folder. Finding 2 is the cases' side: the window's report of how an add ended is held by no case, though the closing memo says a case holds it.

## Findings

### 1. While an add's sign-in runs, a row's "Sign in" replaces the add's pane in the dialog and enables "Add an account" again, and the add's login runs on where no window shows it

```seal
severity: must
location: `apps/desktop/src/renderer/sign-in-pane.ts:29-31`, `apps/desktop/src/renderer/sign-in-pane.ts:35-39`, `apps/desktop/src/renderer/sign-in-pane.ts:71-76`, `apps/desktop/src/renderer/renderer.ts:994-1000`, `docs/design.md:456`, `docs/design.ko.md:456`, `apps/desktop/test/theme-controls.test.ts`
evidence: read `apps/desktop/src/renderer/sign-in-pane.ts:29-76`, `apps/desktop/src/renderer/renderer.ts:994-1000`, `apps/desktop/src/renderer/renderer.ts:1887-1898`, `apps/desktop/src/renderer/view.ts:3117`, `apps/desktop/src/daemon/daemon.ts:1895-1909`, `seal/threads/1795651592-218-one-press-adds-and-names-an-account/screenshots/register-dark-accounts-adding.png`
```

Why it matters: `frame/design.md` *Scope* item 8 says "While the add's sign-in runs, the sign-in section's head reads "Signing in to a new account" and "Add an account" is disabled in that window." A reachable path breaks it, and it leaves a login process and a folder that no window shows and no window can close.

The path, read in the code at the target:

- Each row of a handed or made account offers "Sign in" (`view.ts:3117`, `offersSignIn: account.folder !== null`), and nothing disables it while a sign-in runs (`renderer.ts:994-1000`). The shot `register-dark-accounts-adding.png` shows it: "Add an account" is disabled, and Work's row offers "Sign in" enabled beside it.
- The press calls `askedSignIn(requestId, id)`, which overwrites `asked` (`sign-in-pane.ts:30`). The daemon starts the second pane, because it refuses a second sign-in only of the same id (`daemon.ts:1900`). `takeSignInStarted` then replaces `shown` with the row's pane, `adding: false` (`sign-in-pane.ts:38`).
- `showSignIn` now computes `addButton.disabled` as false (`sign-in-pane.ts:73`), so "Add an account" is enabled while the add's `claude auth login` still runs in the daemon.
- Sign-in panes are on no list of the window (`protocol.ts` `SessionInfo.signsIn`), so the add's pane can no longer be seen, read or closed. Its folder stays under `adding` until the person finishes that login in the browser or the daemon starts again. A second press of "Add an account" makes a second folder meanwhile.

The same cause has two more instances, listed by taking apart every way this window can start a sign-in, which are the two calls of `askedSignIn` (`renderer.ts:997` and `renderer.ts:1026`). An add pressed while a row's sign-in runs replaces that row's pane, since `addButton` is disabled only for an add's pane (`sign-in-pane.ts:73`), and this instance is new with this diff, because the press started no pane before it. A row's "Sign in" pressed while another row's sign-in runs replaces the first pane, and that instance was there before this diff. A press while the first request is unanswered does the same through `takeSignInStarted`'s early return (`sign-in-pane.ts:36`), which leaves the first pane never drawn.

The fix below closes the class: no sign-in starts from this window while one it asked for waits or runs. It disables "Add an account" while a row's sign-in runs too, which goes past *Scope* item 8's sentence, so the fix pass records that as a departure in its phase record and states it in the row "An account's name", in both editions. `git grep -n -F 'is disabled' b22a499f -- docs/design.md docs/design.ko.md seal/threads/1795651592-218-one-press-adds-and-names-an-account` printed the statements of the disabled state: `docs/design.md:456` and its Korean row, `changelog.md:5`, `frame/design.md:50`, `:80` and `:110`, and `phase-2.md:33`. The search is a sample under contract rule 19. The changelog line stays true as written. The frame lines are the framer's and the fix pass does not edit them. The two rows of `docs/design.md` and `docs/design.ko.md` are the ones the fix changes.

```ts
// apps/desktop/src/renderer/sign-in-pane.ts

/** Whether a sign-in this window asked for waits on the daemon or its pane's process runs. While one does, no other sign-in starts from this window, so the pane the dialog draws is never replaced while it runs. */
export function signInBusy(): boolean {
  return asked !== undefined || (shown !== undefined && held.sessions.some((session) => session.id === shown?.id && session.alive));
}

export function showSignIn(): void {
  if (shown !== undefined && !held.sessions.some((session) => session.id === shown?.id)) shown = undefined;
  const alive = shown !== undefined && held.sessions.some((session) => session.id === shown?.id && session.alive);
  const busy = signInBusy();
  addButton.disabled = busy;
  // The rows' "Sign in" buttons are drawn by `showAccounts`, which marks each with `data-sign-in`.
  for (const button of document.querySelectorAll<HTMLButtonElement>("#accounts-list button[data-sign-in]")) button.disabled = busy;
  section.hidden = shown === undefined;
  if (shown === undefined || held.accounts === null) return;
  if (shown.adding) {
    byId("accounts-sign-in-head").textContent = alive ? "Signing in to a new account" : "The sign-in of a new account has ended";
    return;
  }
  const name = accountName(held.accounts, shown.accountId);
  byId("accounts-sign-in-head").textContent = alive ? `Signing in to ${name}` : `The sign-in of ${name} has ended`;
}
```

```ts
// apps/desktop/src/renderer/renderer.ts, in showAccounts: the row's "Sign in" is drawn disabled while this window's sign-in is busy, and marked so that showSignIn updates it at each `inbox`.
      if (row.offersSignIn) {
        const id = row.id;
        const signIn = button("Sign in", () => askedSignIn(askAccounts((requestId) => ({ type: "signIn", requestId, id, ...SIGN_IN_SIZE })), id));
        signIn.dataset.signIn = "";
        signIn.disabled = signInBusy();
        acts.append(signIn, button("Check sign-in", () => askAccounts((requestId) => ({ type: "readSignIn", requestId, id }))));
      }
// and `signInBusy` joins the import from "./sign-in-pane" at renderer.ts:32.
```

The Disabled cell of the row "An account's name", `docs/design.md:456`: "While a sign-in this window started runs, "Add an account" and each row's "Sign in" are disabled." The same cell of `docs/design.ko.md:456`: "이 창이 시작한 로그인이 도는 동안 "Add an account"와 각 줄의 "Sign in"은 쓸 수 없습니다." The pin, under contract rule 14, is a case of `apps/desktop/test/theme-controls.test.ts` after the case of *Scope* item 14. With `hold-login` standing beside the stand-in, it presses "Sign in" on the row of account 1. It reads that "Add an account" and that row's "Sign in" are disabled, removes `hold-login`, waits for "Add an account" to be enabled, then closes the sign-in and the dialog. It is shown red against the target's `sign-in-pane.ts`, where its first read finds "Add an account" enabled.

```seal
verdict: fixed 8a5cb9b1
location: `seal/threads/1795651592-218-one-press-adds-and-names-an-account/changelog.md`
answer: The finding holds, and the fix closes the class it lists: while a sign-in this window asked for waits on the daemon or its pane's process runs, "Add an account" and each row's "Sign in" are disabled. The paste-ready fix was written in the fix pass's own words, because its exported `signInBusy` is a function the frame does not hold, a unit `skills/implement/fix-pass.md` *A fix that needs a unit the frame does not name waits for the fold* stops. The same rule is written into the body of `showSignIn` instead (`const busy = asked !== undefined || alive`), which disables `#accounts-add` and each `#accounts-list button[data-sign-in]`. `showAccounts` marks the row's "Sign in" with `data-sign-in` and now calls `showSignIn` after it draws the rows, not before. The Disabled cell of the row "An account's name" says so in `docs/design.md` and `docs/design.ko.md`, and `changelog.md` line 5 says the same. The case "starts no second sign-in from the dialog while one it started runs…" follows the paste's description in `theme-controls.test.ts`. Before the fix it was red against the target's `sign-in-pane.ts` at its first read, `[false, false]` where `[true, true]` was expected (`executed`). `seal mutate` runs (`executed`, each `red`): `busy` without `alive` went red at scenario K's read of "Add an account" during an add, and the rows' loop setting `false` went red at this case's read of the row's "Sign in". Taking out the call of `showSignIn` at the end of `showAccounts` first `SURVIVED`. `4cc7b1f0` then added to the case a close and a new open of the dialog during the sign-in, and the mutant went red at the row's "Sign in" read after the new open. Departure from the frame: *Scope* item 8 disables "Add an account" only during an add's sign-in. The fix also disables it during a row's sign-in, and disables each row's "Sign in" during any sign-in this window started. The lines `frame/design.md:50`, `:80` and `:110` state the narrower rule, and they are the orchestrator's to fold. Rerunning the finding's `git grep -n -F 'is disabled'` after the last fix commit printed `frame/design.md:50`, `:80` and `:110`, `trail/phases/phase-2.md:33`, a row of *The Machine dialog* at `docs/design.md:457` on another subject, and this record's own lines. The two rows of `docs/design.md:456` and `docs/design.ko.md:456`, and `changelog.md:5`, now write "are disabled", so the search no longer prints them. Each was read after the fix (`read`). `phase-2.md:33` is a past record of phase 2 and stands.
```

### 2. The dialog's sentence for an add that left no account named from a login, and the head of an add's ended sign-in, are held by no case, though the closing memo says scenario K's case covers them

```seal
severity: should
location: `apps/desktop/src/renderer/renderer.ts:1041-1043`, `apps/desktop/src/renderer/sign-in-pane.ts:77-80`, `apps/desktop/test/theme-controls.test.ts:321-337`, `seal/threads/1795651592-218-one-press-adds-and-names-an-account/gaps.md:10`
evidence: executed `grep -rn "has ended\|takeAddEnded\|sign-in ended with no login" test/*.ts` in `apps/desktop`, which printed no line of `theme-controls.test.ts` or `screenshots.test.ts`, the sentence once in `accounts.test.ts:504`, which reads the daemon's message, and otherwise lines of other subjects that hold the words "has ended"; read `apps/desktop/test/theme-controls.test.ts:321-337`, `apps/desktop/test/screenshots.test.ts:593-605`
```

Why it matters: `frame/design.md` *Scope* item 8 says "Where no account named from a login came of it, the message carries a sentence, and the dialog says it in its refusal line." *Data & interfaces* gives the ended head "The sign-in of a new account has ended". Both are behaviour this diff adds to the window, and no case holds either. A later edit that drops `takeAddEnded`'s assignment, or the head's second text, passes every case, and the person then sees a pane that ended with no word on why no row came of it.

`gaps.md:10` claims: "Only scenario K's built-app case covers them", of the head and disabled state of `showSignIn` and of `takeAddEnded`. Scenario K's case (`theme-controls.test.ts:321-337`) runs one add whose login stands and names an email. It reads the error line as `""` after that add, which holds whether `takeAddEnded` sets the line or does nothing, since `says` is null on that path. It never lets the pane end without a login, so the head "The sign-in of a new account has ended" is never drawn. The screenshot run's `accounts-adding` and `accounts-added` views wait on the same success path (`screenshots.test.ts:593-605`). The daemon's half is held: the cases of scenarios B to E in `accounts.test.ts` read `addEnded` and its `says`. The window's half is not, so the claim of the memo is false for `takeAddEnded` and for the ended head, and true for the running head and the disabled state.

The case below belongs in `theme-controls.test.ts`, after the case of *Scope* item 14 and before the rename case, which the file's opening comment names as the last. The add it makes takes id 2 and removes it, so the rename case's second client then adds Home under id 3. That case finds Home by its name and no case reads its id. It is shown red with `takeAddEnded`'s one assignment taken out (contract rule 15), and the fix pass says so in its phase record. `gaps.md:10` is then rewritten in place to name this case beside scenario K's.

```ts
  it("says in the dialog's refusal line why an add left no account once its sign-in ended with no login, heads the ended pane as a new account's, and enables Add an account again (scope item 8 and scenario C, in the window)", async () => {
    writeFileSync(join(standIn, "refuse-login"), "");
    try {
      await app.click("#accounts-button");
      await app.until(`document.getElementById("accounts-dialog").open`, "the Accounts dialog");
      await app.click("#accounts-add");
      await app.until(`document.getElementById("accounts-error").textContent === "The sign-in ended with no login, so no account was added."`, "the sentence of an add whose sign-in ended with no login");
      expect(await app.evaluate<[string | null, boolean, boolean]>(`[document.getElementById("accounts-sign-in-head").textContent, document.getElementById("accounts-sign-in").hidden, document.getElementById("accounts-add").disabled]`)).toEqual(["The sign-in of a new account has ended", false, false]);
      await app.click("#accounts-sign-in-close");
      await app.until(`document.getElementById("accounts-sign-in").hidden`, "the ended sign-in closed");
    } finally {
      rmSync(join(standIn, "refuse-login"), { force: true });
    }
    await app.click("#accounts-close");
    await app.until(`!document.getElementById("accounts-dialog").open`, "the Accounts dialog closed");
  });
```

```seal
verdict: fixed 4cc7b1f0
answer: The finding holds. The case was added as given in `8a5cb9b1`, after the case of finding 1 and before the rename case. It passed against the target's window, which is the claim: the code was there and no case held it. So it was shown red with each guard it names removed, before it was committed, by `seal mutate` against `theme-controls.test.ts -t "scenario K|refusal line why an add"` (`executed`, each `red`). `takeAddEnded` with its one assignment taken out went red at the wait for the sentence. The ended head given the running head's text went red at the read of the head. `4cc7b1f0` rewrote `gaps.md:10` in place and closed it, because the fix pass's mutation runs covered every unit that row named. Its second cell names the case that holds each unit, and says that scenario K's case alone held neither the ended head nor `takeAddEnded`. Rerunning the finding's search over `test/theme-controls.test.ts` and `test/screenshots.test.ts` after the last fix commit printed this case's lines and the line of finding 1's case that waits for "The sign-in of stand-in@example.com has ended" (`executed`).
```

### 3. A folder whose first sign-in has not ended can be handed over as an account, and the end of that sign-in then removes the handed account's folder

```seal
severity: should
location: `apps/desktop/src/daemon/accounts.ts:204-218`, `apps/desktop/src/daemon/accounts.ts:277-282`, `apps/desktop/test/accounts.test.ts:134-155`
evidence: executed `node scripts/test-in-electron.mjs test/accounts.test.ts test/test_tmp_handed_adding.test.ts` in `apps/desktop` (the probe of `## Probes`); executed `git grep -n rmSync -- src/daemon/accounts.ts`; read `apps/desktop/src/daemon/accounts.ts:204-218`, `apps/desktop/src/daemon/accounts.ts:277-282`, `apps/desktop/src/daemon/accounts.ts:303-310`
```

Why it matters: `routing.md` names the review chain for this work item because a cancelled or failed login "must never remove a folder the person handed over". `handedPath` refuses a folder that is already an account's (`accounts.ts:215-216`), and before this diff every folder the store made was an account's. A folder under `adding` is no account, so `handedPath` lets it through. The probe showed it: `handedPath` did not throw for the folder `beginMade` had just made, and `addHanded` stored it. When that folder's sign-in then ends with no login, `dropMade` removes `accounts/<id>` with everything in it (`accounts.ts:279`), and the handed account is left naming a folder that no longer stands. Where the login does stand, `keepMade` adds a second account on the same folder. Reaching this takes a person who picks the daemon's own run folder in the system's folder dialog while a login runs, so the path is narrow. The code's own comment on `Stored.adding` says no id of it is an account's, and this path makes one share its folder.

The class is every handed folder that one of the store's two removals reaches, listed by `git grep -n rmSync -- src/daemon/accounts.ts`: `dropMade` at `:279` and `remove` at `:308`. Each removes a folder under the store's `accounts/` folder with everything in it. So a handed folder at or inside `accounts/` is the class: a folder under `adding`, and a folder inside a made account's folder, which `remove` of that account deletes. The second instance was there before this diff. One refusal in `handedPath` closes both. It stands after the check of an account's folder, so the existing refusals of `accounts.test.ts:145-146` keep their words. The search for removals is a list made from what produces the defect, and a removal outside `accounts.ts` is outside it: `daemon.ts` removes an account's folder only through these two acts.

```ts
// apps/desktop/src/daemon/accounts.ts: `sep` joins the import from "node:path" at line 2.
  handedPath(folder: string): string {
    if (!isAbsolute(folder)) throw new Error(`The folder of an account is an absolute path, and "${folder}" is not one.`);
    const path = resolve(folder);
    let isFolder: boolean;
    try {
      isFolder = statSync(path).isDirectory();
    } catch {
      isFolder = false;
    }
    if (!isFolder) throw new Error(`No folder stands at ${folder}.`);
    const real = realOf(path);
    const holder = this.stored.accounts.find((account) => realOf(account.folder) === real);
    if (holder) throw new Error(`The folder ${folder} is already the account "${holder.name}".`);
    // The store removes what stands under its own folder of accounts, when an add's sign-in ends with no login or a made account is removed, so no folder there is handed over.
    // Precondition: `realOf` resolves links where the path stands and answers the path as given where it does not, so a run folder reached through a link is compared by its real path.
    if (this.file !== undefined) {
      const made = realOf(join(dirname(this.file), MADE_FOLDERS));
      if (real === made || real.startsWith(`${made}${sep}`)) throw new Error(`The folder ${folder} is one Owlery makes for its accounts, so it is not handed over.`);
    }
    return path;
  }
```

The docstring of `handedPath` gains the refused case: "…, a folder that is already an account's, however the two paths spell it, and a folder at or inside the folder the store makes its accounts' folders in." The pin is a row of the refusals case at `accounts.test.ts:134-155`, which hands over the folder `beginMade` answered and a folder inside it, each refused with the new sentence. It is shown red against the target's `handedPath`, where both are accepted.

```seal
verdict: fixed e7d85354
location: `seal/threads/1795651592-218-one-press-adds-and-names-an-account/changelog.md`
answer: The finding holds, and `handedPath` now refuses the store's folder of made folders and every folder in it, by real path, after the check of an account's folder. The sentence is written in the fix pass's words: "The folder <folder> is the folder Owlery makes its accounts' folders in, or stands inside it, so it is not handed over." The paste's sentence says the folder "is one Owlery makes", which a folder inside a made account's folder is not. The docstring names the new refusal. The refusals case of `accounts.test.ts` gains three rows: `accounts/` itself, the folder `beginMade` answered, and a folder inside that folder. Before the fix the case was red against the target's `handedPath`, at the first new row, where nothing was thrown (`executed`). `seal mutate` with the prefix check taken out, leaving `real === made`, went red at the same line (`executed`). `changelog.md` line 10 says the folder is refused. Rerunning the finding's `git grep -n rmSync -- src/daemon/accounts.ts` after the last fix commit printed the import line, `dropMade` at `:286` and `remove` at `:315`, both under the store's folder of made folders, which the refusal covers. Departure from the frame: *Scope* item 6 says the daemon checks the folder "as today", and `frame/design.md:48` is the orchestrator's to fold with the new refusal. The read of the range after the last fix commit `4cc7b1f0`: `git diff b22a499f 4cc7b1f0` was printed for `apps/desktop/src/renderer` whole and read (`read`). The `accounts.ts` hunk was printed in part, and the rest of it, the docs, test and record hunks are held from the fix pass's own edits and not printed again. `routing.md` and the three frame files were read whole at the start of phase 4. `git diff 723fa5ad HEAD -- frame routing.md` printed only the orchestrator's `0142fc92` fold of the row quoted at `frame/design.md:110` (`executed`), so those files are held and not read again. `gaps.md` was read whole before its edit, and `changelog.md` lines 5 to 10 before theirs. The `grep` of the two after the last commit printed the lines the fix pass changed (`executed`). Across the tree, the searches named in each close block are samples under contract rule 19. Places they did not reach, such as a sentence that states the disabled state or the handed-folder checks in other words, stand unchecked.
```

## Confirmations

What matched: *Scope* items 1, 2, 3 and 7 against `apps/desktop/src/daemon/daemon.ts` at the target (`read`). `addAccount` (`daemon.ts:1760-1797`) refuses an adapter that signs no account in before `beginMade`, and removes the folder through `dropMade` where `furnish`, `signIn` or `startSession` throws. `endAdd` (`daemon.ts:1813-1851`) reads the folder from `adding()` alone, decides nothing where the daemon closed during `status`, keeps the folder on a login, removes it on no login, and keeps it as `Account <id>` with `signedIn: null` where `status` rejected. It sends `accounts` before `addEnded` and closes the pane only where a login stands and the pane is still listed. `listen` settles each id under `adding` (`daemon.ts:572-573`), and the exit path sends every `signsIn` id that is no stored account to `endAdd` (`daemon.ts:2593-2603`). The three sentences match *Data & interfaces*, with phase 2's sentence for a login that names no email.

What matched: the store's guards against an edited `accounts.json` (`apps/desktop/src/daemon/accounts.ts:120-126`, `read`). An id under `adding` is read only where it is a whole number above System default's and no account's, and `dropMade` removes only `madeAt(id)`. `remove` and `dropMade` are the store's two removals, listed with `git grep -n rmSync -- src/daemon/accounts.ts` (`executed`), and neither reaches a path an id outside those bounds names.

What matched: *Scope* item 4 at `apps/desktop/src/daemon/adapters/claude-accounts.ts:110-123` (`read`): the name is `email` trimmed, only after exit 0, and null where it is absent, not a string or empty.

What matched: scenario L. `git grep -n -e 'accounts-name' -e 'accountsName' b22a499f -- apps/desktop` printed nothing and exited 1 (`executed`).

What matched: `apps/desktop/test/accounts.test.ts` at the target. It ran whole, with the probe of finding 3 in the same command: 2 files, 56 cases passed, exit 0 (`executed`). That is the file's 55 cases and the probe.

What matched: the gap row of `gaps.md:13`, which names the proofer. The rule `#accounts-list li` (`apps/desktop/src/renderer/index.html:546`) sets the row as a column, and `showAccounts` puts the rename field, or the removal's question, before the span of its two buttons (`renderer.ts:916-963`), so each stands under the field or the question at the row's width. The row "An account's name" of `docs/design.md:456` describes the row at rest and states no other layout for the two states, so no sentence of the policy contradicts the code (`read`). No shot draws either state, and this round drew none.

What matched: the figures against their text. Four shots were opened at the target (`read`): `desk-light-accounts-added.png`, `night-watch-dark-accounts-added.png`, `register-light-accounts-added.png` and `register-dark-accounts-adding.png`. In each `accounts-added` shot, `dana@example.com` stands on one line, its folder, its sign-in and the refresh sentence each take one line, and its six buttons stand on one line under them. Work's row is laid out the same way. That is what *Scope* item 14 and the row "An account's name" of `docs/design.md:456` state. The `accounts-adding` shot shows the head "Signing in to a new account", the terminal with its cursor, "Close the sign-in" and "Add an account" disabled, as phase 3 and phase 4 say. The folder of the new account reads `accounts/2` in Night watch dark, `accounts/5` in Register light and `accounts/7` in Desk light, because each pass adds and removes one account. The names drawn are the same in each pass, which is the claim of *Scope* item 11.

What matched: `pr.md` against its sources (`read`). Each of its ten quotes stands verbatim at the coordinate it names in `frame/design.md`, `frame/plan.md` and `frame/questions.md`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed.

What matched: the records against another work item's frame. `grep -n -F` for *Authentication of the Claude adapter*, *State lives in three places*, *A pull request that changes the window carries its screenshots* and *Components and their states* over `seal/threads/*/frame/design.md` at the target (`executed`) found only #214's frame outside this one. #214 adds a paragraph to the screenshot section and writes the row "The delete dialog", which `frame/design.md` *Grounding* already names. No rule this work item changes is changed there.

What matched: the phase records' claims of the code. Phase 4's "6px of padding above and below" is `padding: var(--space-3) 0`, and `--space-3` is `6px` (`index.html:25`, `read`). Phase 2's account of `showSignIn` disabling `#accounts-add` and of `signInRefused` enabling it again is the code at `sign-in-pane.ts:54-58` and `:73` (`read`). Finding 1 names the path that sentence does not cover.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the repository typecheck and the broad gate's comparison of the two editions of `docs/design.md`. This round ran `accounts.test.ts` alone, so the suite is `unverified` | `seal/config.json` `Broad gate` | the orchestrator |
| Whether a real `claude auth status` prints the login's email as `email` (`frame/questions.md` Q1). No real login ran in this round | `apps/desktop/src/daemon/adapters/claude-accounts.ts:110-123` | the owner, by the real login `gaps.md` holds |
| Scenario K's case and the case of *Scope* item 14 were not run in this round. Their phase-2 and phase-4 runs are the crafters' claims, read and not run again | `apps/desktop/test/theme-controls.test.ts:321-387` | the orchestrator, by the broad gate |
| A window of this build against a daemon of 0.0.4. The code read says a refusal enables "Add an account" again through `signInRefused` (`renderer.ts:858-863`), and no run started two builds | `frame/plan.md` *Operational impact* | the owner, at the release |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/accounts.test.ts test/test_tmp_handed_adding.test.ts`, run once in `apps/desktop` of this round's clone at `b22a499f`, through the machine's lock | 2 files, 56 cases passed, exit 0. The probe's case passed on `expect(refused).toBeNull()`: `handedPath` did not refuse the folder `beginMade` had just noted, and `addHanded` and `dropMade` ran on it without a throw. The probe's logged lines were not printed by the runner, so the folder's removal rests on reading `accounts.ts:279` |
