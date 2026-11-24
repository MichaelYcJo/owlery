# Review round 2: 1795400734-accounts-per-repository

```seal
target: d048093, fixes 48afda6..d048093
```

This is a verifying round. Its target is the fix diff `48afda6..d048093`. `48afda6` committed round 1's record. The fix pass's commits run from `64b3e3d` to `a711354`, its closes are at `fd90c3b`, and the framer folded it at `bfa3c24`. The orchestrator added Q9 and the screenshots to `pr.md` at `d048093`. The code reviewed is inside that diff. The work item's records were read at `d048093` against the tree there: `routing.md` and the round 1 diff of `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. The parts those files did not change were read whole by round 1 at `90d4e04`, and the fix diff touches nothing they state. The ten committed images under `screenshots/` were read.

Carried from round 1, not re-established: where each subsystem lives (`daemon.ts#changeAccount`, `accounts.ts#AccountStore`, `pty.ts#terminalEnv`, `view.ts#paneAccountChange`), and the precedent screenshots of #181 at `seal/threads/1795497826-pane-carries-the-chain/screenshots/`. `seal/parity.json` does not stand.

Round 1's probes 1, 2 and 4 were written again from its `## Probes` row and run once in a `git clone --no-local` of the branch at `d048093`. The run used the repository's runner, `node scripts/test-in-electron.mjs`, with `OWLERY_BACKGROUND=1`, after `pgrep -f 'vites[t][.]mjs'` found no other run.

## Findings

### 1. The window is never told System default's conversations once the lookup finds its folder, so a window that connected first offers no change to or from System default

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:1790-1798`, `apps/desktop/src/daemon/daemon.ts:3685-3691`, `apps/desktop/src/renderer/view.ts:2966-2968`, `seal/threads/1795400734-accounts-per-repository/frame/design.md:257`
evidence: read `apps/desktop/src/daemon/daemon.ts:480-488`, `apps/desktop/src/daemon/daemon.ts:780-790`, `apps/desktop/src/daemon/daemon.ts:1590-1598`, `apps/desktop/src/daemon/daemon.ts:1790-1798`, `apps/desktop/src/daemon/daemon.ts:3685-3691`, `apps/desktop/src/daemon/adapters/claude.ts:428-446`, `apps/desktop/src/daemon/adapters/claude.ts:473`, `apps/desktop/src/daemon/adapters/claude.ts:595-598`, `apps/desktop/src/renderer/view.ts:2960-2973`; executed probe 5 of `test/test_tmp_round2.test.ts`, which did not reach its question (`## Probes`)
regression: round-1#5
```

The unit is `Daemon#conversationsOf` and `Daemon#accountsMessage`, which `7018e12` added (`daemon.ts:1790-1798`). The frame asks the window to offer the change "only where it can succeed" (*Scope* item 9). *Data & interfaces* (`frame/design.md:257`) sets `Account.conversations` to null for System default "while the lookup has given no folder". The fix reads that value only when it sends the accounts, and nothing sends them again when the lookup answers. So the defect came from a value read once, at send time, with no event that refreshes it.

Why it matters: the daemon starts the lookup at its start, in the background (`daemon.ts:486`, through `notice()` at `claude.ts:595-598`). The lookup is the login shell, and its limit is ten seconds (`claude.ts:436`). `Daemon#greet` sends `ready` after at most 500 ms (`daemon.ts:780-790`), with `accountsMessage()` read at that moment. Until the lookup answers, `foldersOf(SYSTEM_DEFAULT_ID)` gives no folder (`daemon.ts:1597`, `claude.ts:473`). So a window that says hello first holds System default with `conversations: null`. The daemon broadcasts `accounts` only when something about the accounts changes: an add, a rename, a sign-in, a limit value or a refresh. `readAgentNotice` broadcasts the notice alone (`daemon.ts:3685-3691`). `paneAccountChange` offers nothing to or from an account whose value is null (`view.ts:2966-2968`). After the app starts its daemon, then, a pane under System default has no "Change Account…", and a pane under "Work" is not offered System default. This lasts until some unrelated change to the accounts makes the daemon send them again. A daemon that outlives the app answers later windows correctly, so the case is the first window after each start of the daemon, which follows every reboot and every update.

Probe 5 tried to show this with a fake adapter whose folder appears after `ready`. Its first wait, for the `accounts` message after an `addAccount`, timed out, so it showed nothing either way. The finding rests on the reading above.

The fix sends the accounts again once the notice's lookup has run. That relies on the Claude adapter's `notice()` awaiting `located()` (`claude.ts:597`), the same lookup that `defaultLoginFolder` reads. An adapter whose notice does not wait for its lookup would need its own signal. `frame/design.md:257` should say the daemon sends the accounts again when the value changes.

```ts
// apps/desktop/src/daemon/daemon.ts, Daemon#readAgentNotice
  private async readAgentNotice(): Promise<void> {
    const ask = ++this.noticeAsks;
    const before = this.conversationsOf(SYSTEM_DEFAULT_ID);
    const notice = await this.options.roleAdapter.notice();
    // The notice waits on the adapter's lookup, which is what finds System default's folder, so a window told none before is told it now.
    if (this.conversationsOf(SYSTEM_DEFAULT_ID) !== before) this.broadcastAccounts();
    if (ask !== this.noticeAsks || notice === this.agentNotice) return;
    this.agentNotice = notice;
    this.broadcast({ type: "agentNotice", notice });
  }
```

```ts
// apps/desktop/test/accounts.test.ts, beside the case at line 529; RoleAdapter is imported there already
it("sends the accounts again once the adapter's lookup finds System default's folder after a window's ready, so the window can offer a change to it (scenario 9)", async () => {
  const own = folder();
  mkdirSync(join(own, "projects"));
  let found: string | null = null;
  let answer = (): void => {};
  const looked = new Promise<void>((resolve) => (answer = resolve));
  const adapter: RoleAdapter = { ...fakeAdapter(), defaultLoginFolder: () => found, notice: () => looked.then(() => null) };
  const { c, ready } = await daemon({ roleAdapter: adapter });
  expect(ready.accounts?.[0]?.conversations).toBeNull();
  found = own;
  answer();
  const sent = await c.message("accounts", (m) => m.accounts[0]?.conversations !== null);
  expect(sent.accounts[0]?.conversations).toBe(realpathSync(join(own, "projects")));
});
```

```seal
verdict: fixed db4bf75
location: `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/src/shared/protocol.ts`, `apps/desktop/test/accounts.test.ts`
answer: Applied the record's fix: `readAgentNotice` reads System default's `conversations` before it awaits the adapter's notice and again after it, and calls `broadcastAccounts()` where the two differ, before the notice's own early return, and its docstring says so. The record's case stands beside the conversations case of `accounts.test.ts`; before the fix no `accounts` message came and the wait timed out with the client holding only `ready` (red), and the whole file, 43 cases, passes after it. Its mutation, the broadcast line removed, went red. The protocol's comment on `Account.conversations` now says the daemon sends the accounts again once the lookup changed System default's value.
```

### 2. In a work item's view, the new account menus squeeze the pane tabs out of the bar and shrink the Ask field, as the committed screenshots show

```seal
severity: should
location: `apps/desktop/src/renderer/index.html:512`, `apps/desktop/src/renderer/index.html:358-360`, `apps/desktop/src/renderer/index.html:509-510`, `apps/desktop/src/renderer/index.html:735`, `apps/desktop/src/renderer/index.html:772`, `seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-dark-view.png`, `seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-light-view.png`
evidence: read `seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-dark-view.png`, `seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-light-view.png`, `seal/threads/1795497826-pane-carries-the-chain/screenshots/night-watch-dark-view.png`, `apps/desktop/src/renderer/index.html:358-368`, `apps/desktop/src/renderer/index.html:508-512`, `apps/desktop/src/renderer/index.html:730-737`, `apps/desktop/src/renderer/index.html:767-774`, `docs/design.md:448`; executed `sips -c 60 770 --cropOffset 45 256` on the dark view shot in the round's scratch directory, and read the crop
```

Why it matters: the screenshot run draws the window at its own size, 1440 by 900. The view shots of this work item show the pane bar as "Back of the s", cut off, then "Side by side", the select "The work item's (System default)", "+ Shell", "+ Claude Code" and "+ Claude Code (continue)". There is no tab for the "Setup" pane and none for the "Claude Code" pane, even though the Claude Code pane is on the stage. #181's view shot of the same scene, `seal/threads/1795497826-pane-carries-the-chain/screenshots/night-watch-dark-view.png`, shows "Back of the seal", "Setup" and "Claude Code" with their close marks. `docs/design.md:448` sets the form of a pane's tab and says the back's tab "stands before the panes' tabs". At this size the person sees no tab for the pane in front, and closing or switching panes means scrolling a strip that shows no scrollbar.

The cause is the rule `#ask-account, #pane-account { flex: none; max-width: var(--tab-width); … }` (`index.html:512`), which phase 2 added. The select never shrinks. In `#pane-bar`, `#pane-buttons` and `#side-by-side` never shrink either (`index.html:360`, `:364`). `#tabs` is the one part with `min-width: 0` (`index.html:359`), so it gives up all its width. The Ask row behaves the same way. The field is about 330 px wide in #181's shot and about 110 px in this one, because `#ask-account` keeps its full width and `#ask-form input` shrinks (`index.html:510`). Both selects appear only when an account stands beside System default, so the defect reaches every person who adds an account. This defect is in a unit phase 2 made, so it is new work, not a regression of round 1's fixes.

The Ask row's fix is a change of flex values. The pane bar has no room for the select at this width: 765 px hold the tabs, "Side by side", the three new-pane buttons and the select. So the frame decides where a new pane's account is asked. One option is a menu on the new-pane buttons. Another is the row under the stage, `#view-strip`, beside the pane's size. If the frame adds a form, it goes into `docs/design.md` *Components and their states* in both editions, as *Principles* rule 8 asks. The check for either fix is the view shot at 1440 by 900. It shows the back's tab and each pane's tab whole, and an Ask field near #181's width. The fix pass shoots the view again and replaces `night-watch-dark-view.png` and `night-watch-light-view.png`. It also checks the menu shot, whose bar is hidden behind the menu.

```css
/* apps/desktop/src/renderer/index.html: the Ask row; the select gives way before the field does */
#ask-form input { flex: 1; min-width: 12em; }
#ask-account { flex: 0 1 auto; min-width: 0; max-width: var(--tab-width); height: var(--control-height); font-size: var(--size-second); }
/* #pane-account: placed where the frame decides, so the rule at line 512 names it alone or leaves it */
```

```seal
verdict: fixed f325781
location: `apps/desktop/src/renderer/work-item-view.ts`, `apps/desktop/src/renderer/view.ts`, `apps/desktop/test/view.test.ts`, `seal/threads/1795400734-accounts-per-repository/changelog.md`, `seal/threads/1795400734-accounts-per-repository/gaps.md`, `seal/threads/1795400734-accounts-per-repository/screenshots`
answer: Built the frame's decision at `1aeb9fa`: `#pane-account`, its name in the rule and its reader in `work-item-view.ts` are gone, and the Ask row has the record's CSS. A press of a button that opens a pane sends no `accountId`, so the pane runs under the work item's account; a right-click on a button of a kind whose `accounts` is true opens the window's own menu (`menu.ts#openMenu`), whose first item is "The work item's (<name>)", named as the Ask row's first choice, followed below a rule by each other account, and the item chosen opens that one pane under its account. The button's tooltip says "Right-click to open it under another account" after any hint of its own. `view.ts#newPaneMenu` and `#paneButtonTitle` hold the items and the tooltip, and the new case of `view.test.ts` pins both; before them the case failed with `newPaneMenu` not a function (red), and 7 of 7 mutations went red. The changelog now says where a new pane's account is chosen. The app was built and the screenshot run ran alone after no other run was found: 1 case passed and 22 files were written, and the four the frame names, view and menu in Night watch dark and light, were replaced in `927f12d7acc783046645aa608e683e0f5387d623`. In the view shot at 1440 by 900 the pane bar shows "Back of the seal", "Setup" and "Claude Code" whole, each pane's tab with its close mark. The Ask field is about 155 px wide, against about 110 px in this round's shot and about 330 px in #181's: the record's CSS holds the field at its `min-width: 12em` while the select keeps its `max-width`, so the frame's sentence that the field stands near its width before this work does not hold at this size, which is the frame's to judge. The menu shot shows the work item's menu over the inbox, where no pane bar stands.
```

## Confirmations

```seal
confirms: round-1#1
```

The close holds. `Daemon#changeAccount` refuses a second change while the first waits (`daemon.ts:1725`). The wait is bounded by `endWaitMs ?? END_WAIT_MS`, and a timeout is refused (`daemon.ts:1736-1740`). After the wait, the change also refuses where the daemon closed, the pane ended or the pane left the list, and where the target account is gone (`daemon.ts:1742-1747`). The exit watch hands the exit to the change only while the pane is not ended (`daemon.ts:2305`), so an archive's or a close's end is reported as the pane's end. Probe 1, run again, answered the second request with "The pane's account is being changed already." and recorded one `end` and one start under B with `--resume`. Probe 2, run again, recorded no start after the daemon's close. Both executed. The three new cases at `apps/desktop/test/daemon.test.ts:7420`, `:7479` and `:7528` each cover a refusal no earlier case of the group covers. Read.

```seal
confirms: round-1#2
```

The close holds. The ten images stand under `seal/threads/1795400734-accounts-per-repository/screenshots/`: `inbox`, `view`, `menu`, `settings` and `accounts`, each in Night watch dark and light, all read. `pr.md` links each one as `../blob/9202d1f…/<path>?raw=true`, in the form #181's `pr.md` uses. What the view shots show is finding 2 of this round.

The coordinator asked whether a committed image may show the screenshot run's temporary folder path. The Accounts row of the handed account shows the start of a path inside the macOS per-user temporary folder. My judgment is that a committed image may show it, and no finding is owed. First, the repository already carries the same path in merged images: #181's view shot shows the worktree path inside that temporary folder on its "Worktree" row and on the pane's strip. This work item's view shots show it in the same two places. Second, the path names the machine's per-user temporary folder, not the person. Third, `docs/design.md` *A pull request that changes the window carries its screenshots* describes the scene as a temporary repository and asks for nothing about paths. The scene may still seed the row more like a person's folder. It writes `accounts.json` itself (`apps/desktop/test/screenshots.test.ts`, its `writeRun`), so it can store the folder as a fixed invented path such as `/Users/x/.claude-work`, like the folder `apps/desktop/test/view.test.ts:4169` already gives the account "Work", without making that folder. Nothing in the scene reads a handed folder that is missing. `conversationsOf` answers null, the parked work item's shell pane takes the variable and reads nothing, and only a made folder is furnished. That choice is the frame's. It would also rewrite the `add` operation's words "an empty folder of the run's own" in *Rule changes*, in both editions. Read.

```seal
confirms: round-1#3
```

The close holds. The store reads `made` as true only where the folder equals `join(<run folder>, "accounts", <id>)` (`accounts.ts:113-116`), which is the path `addMade` joins (`accounts.ts:224-228`). Probe 4, run again, left the outside folder and its file standing after `remove(1)`. Executed. The case at `apps/desktop/test/accounts.test.ts:210` covers the edited file and the made folder beside each other. Read.

```seal
confirms: round-1#4
```

The close holds. `#startSession` passes `signsIn === null` as `inherit` (`daemon.ts:2255`), and `#spawnPane` gives a sign-in pane only its command's environment. To that, `terminalEnv` adds `TERM`, `COLORTERM` and `LANG` where none is set (`pty.ts:62-71`). The comment at `claude.ts:611` and `trail/phases/phase-3.md:20` now hold. The sign-in case at `apps/desktop/test/accounts.test.ts:888` sets a variable in the daemon's `process.env` and reads it absent from the stand-in's `login-env`. Read.

```seal
confirms: round-1#5
```

The close holds for what round 1 found. The window no longer offers an account whose folder keeps other conversations. `paneAccountChange` lists only accounts whose `conversations` equal the pane's account's and are not null (`view.ts:2966-2968`). The daemon compares through the same adapter method (`daemon.ts:1730-1731`). The case at `apps/desktop/test/view.test.ts:4319` holds A, B, C and D of scenario 9. Read. Finding 1 of this round is a regression in the unit this fix added.

```seal
confirms: round-1#6
```

The close holds. `changelog.md:5` and `protocol.ts:778` now say what the daemon reads of a handed folder. `git grep -n -i -e 'reads nothing of' -e 'makes, reads' -e 'read nothing of' -e 'reads no file of the folder' -- apps/desktop/src apps/desktop/test seal/threads/1795400734-accounts-per-repository docs` found:

- `adapter.ts:87`, which speaks of `AccountLogins` alone;
- `frame/design.md:64`, which speaks of the person's own folder in a test;
- the two records.

Executed. The search is a sample of the spellings it names.

```seal
confirms: round-1#7
```

The close holds. `frame/design.md` *Rule changes* holds the four `change` operations and the two `add` operations on the screenshot section, in both editions. The *State lives in three places* sentence in both `add` operations now names the usage-limit values. Each `from` was found once in its document at `90d4e04` by round 1 (executed then, carried here). The two comments of `apps/desktop/test/screenshots.test.ts` now say that the parked work item's shell pane runs under the account. The chain check run before this hand-back reported no refusal or notice in *Rule changes* (`## Probes`). Read and executed.

```seal
confirms: round-1#8
```

The close holds. A refresh of an account other than System default is refused through an adapter that does not declare `accounts` (`daemon.ts:1824`). A headless session through such an adapter is launched under none (`daemon.ts:2144`). Its limit values go to System default (`daemon.ts:2048`), and its ledger entry names no account. The renderer's readers of `HeadlessInfo.accountId` handle null (`view.ts:2815-2825`, `view.ts:2908`). The cases at `apps/desktop/test/accounts.test.ts:513` and `:703` hold both. `gaps.md` *Not done* and `frame/design.md` name the two things left to the issue that builds such an adapter: the offer of a refresh the daemon refuses, and a System default refresh beside a session launched under none. Both fail safe. Read.

What matched with nothing earlier to name:

- `pr.md` quotes Q9 word for word from `frame/questions.md`.
- `changelog.md`'s new sentences match the code at `d048093`, apart from the offer that finding 1 qualifies. These are the three-second wait, the second change, a made folder's place, and an adapter without `accounts`.
- `gaps.md` labels the whole suite at the fix pass's last commit `unverified`, with the orchestrator as its answerer, and names the files that did not run. The label is honest.

Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the window's fixed words "Claude Code" keep rule 1 of `docs/architecture.md` *Rules that keep it portable* | `frame/questions.md` Q9 | the owner |
| The change dialog as the fix pass narrowed it, and the sign-in pane in its cleared environment, drawn and run in the built app under a real `claude` | `gaps.md` *Open rows*, `frame/questions.md` Q3 and Q8 | the owner's walk of the built app (#184) |
| The broad gate at the work item's last commit | `seal/config.json` `Broad gate` | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts`, run once in the round's clone at `d048093` | 3 of 4 cases passed. Probe 1: of two `changeAccount` requests for one pane, request 11 was answered "The pane's account is being changed already." and request 10 `done`. The stand-in recorded a start under A, `end`, and one start under B with `--resume 'a99099b6-accd-47d0-853b-547820b31e6d'`. Probe 2: after a `changeAccount` and the daemon's close 50 ms later, the stand-in recorded the start under A and `end` alone. Probe 4: after `remove(1)` of an account `accounts.json` calls made with a folder outside `accounts/`, the folder and its file stood. Probe 5 failed in its setup. Its wait for the `accounts` message after an `addAccount` timed out, so it measured nothing about System default |
| `pgrep -fl owlery-probe-shell` after the run | nothing ran |
| `sips -c 60 770 --cropOffset 45 256` on `night-watch-dark-view.png`, written to the round's scratch directory | the crop shows the pane bar as finding 2 describes |
