# Review round 3: 1795400734-accounts-per-repository

```seal
target: db0dc30, fixes 5957f66..db0dc30
```

This is a verifying round. Its target is the fix diff `5957f66..db0dc30`. `5957f66` committed round 2's record. The fix diff holds:

- the framer's decision at `1aeb9fa`;
- the fixes `db4bf75` and `f325781`;
- the four images retaken at `927f12d`;
- `gaps.md` at `e5b4766`;
- the closes at `d073f1a`;
- the orchestrator's fold of the Ask field's width at `db0dc30`.

The code reviewed is inside that diff. Of the work item's records, the round 2 diffs of `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md` and `changelog.md` were read at `db0dc30`, and so was `pr.md` whole. Round 1 read the parts they did not change, whole, at `90d4e04`. The four retaken images were read.

Carried from round 2, not re-established:

- where the pane bar and the Ask row are styled (`apps/desktop/src/renderer/index.html`);
- what `Daemon#readAgentNotice` waits on (`claude.ts#notice`, through `located()`);
- #181's view shot as the measure of the tab strip and the Ask field.

`seal/parity.json` does not stand.

## Findings

### 1. The Ask row's account menu cuts the account's name, though the frame says the menu keeps its full name

```seal
severity: should
location: `apps/desktop/src/renderer/index.html:510-512`, `seal/threads/1795400734-accounts-per-repository/frame/design.md:270`, `seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-dark-view.png`, `seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-light-view.png`
evidence: read `seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-dark-view.png`, `seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-light-view.png`, `apps/desktop/src/renderer/index.html:508-512`, `seal/threads/1795400734-accounts-per-repository/frame/design.md:270`, `seal/threads/1795400734-accounts-per-repository/trail/rounds/round-2.md` (the close of finding 2); executed `sips -c 40 420 --cropOffset 492 1020` on the dark view shot in the round's scratch directory, and read the crop
regression: round-2#2
```

The unit is the rule `#ask-account { flex: 0 1 auto; min-width: 0; max-width: var(--tab-width); … }` (`index.html:512`), which `f325781` wrote from round 2's own snippet. The frame states the outcome in *Data & interfaces*, *The window* (`frame/design.md:270`): "the account's select beside it keeps its full name, and the input gives up the width the select takes". The fix lets the select shrink to nothing, `flex-shrink` 1 with `min-width: 0`, while the field holds at `min-width: 12em`. So the select, not the field, gives up the width. Round 2's snippet caused this defect, and the fix pass carried it into the tree.

Why it matters: in the retaken view shots, the Ask row's menu reads "The work item's (System", with the end cut and no ellipsis. The crop shows the field at about 155 px and the menu at about 170 px. The menu's text, about 215 px, does not fit. The cut part is the name of the account a new headless session will run under, and that name is the one fact the menu exists to show. `routing.md` names a wrong account as the defect worth a review chain. The close of round 2's finding 2 says "the record's CSS holds the field at its `min-width: 12em` while the select keeps its `max-width`". The shot shows the select narrower than its text, so that claim does not hold either.

Two fixes exist, and the frame chooses between them:

- **The menu keeps its full name.** The select takes its own width and the field gives way, to about 95 px at 1440 by 900. The frame's sentence then holds as written, and only its "about 155 px" changes.
- **The field keeps 12em.** The frame rewrites its sentence to say the menu's name is cut at this size. Or the first choice names the account first, which changes `view.ts#accountChoices` and every menu that calls it.

Either way, the fix pass shoots the view again in both appearances.

```css
/* apps/desktop/src/renderer/index.html, the first fix: the menu keeps its whole name and the field takes what is left */
#ask-form input { flex: 1; min-width: 0; }
#ask-account { flex: none; max-width: var(--tab-width); height: var(--control-height); font-size: var(--size-second); }
```

```seal
verdict: fixed b0bf997
answer: Applied the record's first fix, the one the frame chose at `468bd81`: `#ask-form input` is `flex: 1; min-width: 0` and `#ask-account` is `flex: none` under its `max-width`, with the rule's comment saying the menu keeps its whole name. The app was built and the screenshot run ran alone after no other run was found: 1 case passed and 22 files were written. The two view shots were replaced in `a91b3d98e9a54f9aa4681701c85bfe6f03094a0c`. The crop at the record's offsets, in both appearances, shows the menu reading "The work item's (System default)" whole and the field at about 108 px; the pane bar's crop still shows the three tabs whole. The menu shots differ from `927f12d` only in the scene's commit hashes, which each run makes anew, so they were not replaced. No case pins the rule: it is a style the screenshot run draws, and no mutation was run over it.
```

### 2. The pull request's body still shows the view and menu screenshots from before the pane bar was fixed

```seal
severity: should
location: `seal/threads/1795400734-accounts-per-repository/pr.md:26-29`
evidence: read `seal/threads/1795400734-accounts-per-repository/pr.md:15-33`; executed `git diff --stat 5957f66..db0dc30`, which lists no change to `pr.md`, and `git log --oneline -12`, which shows the reshoot at `927f12d`
```

Why it matters: `pr.md` links each image as `../blob/<commit>/<path>?raw=true`. Lines 26 to 29 link `night-watch-dark-view.png`, `night-watch-light-view.png`, `night-watch-dark-menu.png` and `night-watch-light-menu.png` at `9202d1fce0eb68db6651d81b25dcff3f65195fb6`. At that commit the view shots are the ones round 2's finding 2 read, with no pane tab in the bar. The fix pass replaced all four at `927f12d7acc783046645aa608e683e0f5387d623`, and `pr.md` did not move. The body then shows a reviewer the defect that round 2 found and that the fix pass removed. Round 2's close says the `### Screenshots` section is the orchestrator's to write, so this finding goes to the orchestrator. If finding 1 retakes the view again, these lines name that later commit instead.

```markdown
<!-- seal/threads/1795400734-accounts-per-repository/pr.md, lines 26 to 29: the same four lines with the commit of the reshoot -->
![Night watch dark, view](../blob/927f12d7acc783046645aa608e683e0f5387d623/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-dark-view.png?raw=true)
![Night watch light, view](../blob/927f12d7acc783046645aa608e683e0f5387d623/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-light-view.png?raw=true)
![Night watch dark, menu](../blob/927f12d7acc783046645aa608e683e0f5387d623/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-dark-menu.png?raw=true)
![Night watch light, menu](../blob/927f12d7acc783046645aa608e683e0f5387d623/seal/threads/1795400734-accounts-per-repository/screenshots/night-watch-light-menu.png?raw=true)
```

```seal
verdict: fixed 7be065a
answer: Lines 26 to 29 of `pr.md` now link the view shots at `a91b3d98e9a54f9aa4681701c85bfe6f03094a0c`, which retook them for finding 1, and the menu shots at `927f12d7acc783046645aa608e683e0f5387d623`, the record's commit, since this pass did not retake them. The other six lines still name `9202d1f`, whose images no later commit changed.
```

### 3. `gaps.md` says four built-app files start the app with no config folder of their own and could reach the person's, and the test harness gives every start one

```seal
severity: should
location: `seal/threads/1795400734-accounts-per-repository/gaps.md:25`
evidence: read `apps/desktop/test/built-app.ts:158-210`, `apps/desktop/test/terminal-basics.test.ts:25-26`, `apps/desktop/test/terminal-basics.test.ts:95`, `apps/desktop/test/notification-click.test.ts:76`, `apps/desktop/test/daemon-restart.test.ts:58`, `apps/desktop/test/daemon-restart.test.ts:84-99`, `apps/desktop/test/memory.ts:12-13`, `apps/desktop/test/memory.ts:479`, `apps/desktop/test/korean-pane.ts:52`, `apps/desktop/test/fixtures/receiver.sh:7-8`, `apps/desktop/test/fixtures/basics-shell.sh:21-22`, `apps/desktop/test/fixtures/printer.sh:8-9`, `apps/desktop/src/daemon/adapters/claude.ts:145-157`, `apps/desktop/src/daemon/claude-plugins.ts:28-30`, `apps/desktop/src/daemon/claude-plugins.ts:65-66`, `apps/desktop/src/daemon/daemon.ts:1590-1598`, `apps/desktop/src/daemon/daemon.ts:1788-1794`, `apps/desktop/src/main/daemon-client.ts:50-53`; executed `grep -n -i 'account\|refresh\|signIn\|CLAUDE_CONFIG_DIR'` over the four files and `apps/desktop/test/memory.ts`, which printed nothing (exit 1)
```

Why it matters: the row at `gaps.md:25` claims that `terminal-basics`, `notification-click`, `daemon-restart` and `memory` "did not run: their starts set no `CLAUDE_CONFIG_DIR` of their own, so the daemon's reading of System default's conversations could reach the person's config folder". The orchestrator reads this row before the broad gate, and the claim is false on two counts:

- **Each start has its own folder.** All four start the app through `BuiltApp.start`: `terminal-basics.test.ts:95`, `notification-click.test.ts:76`, `daemon-restart.test.ts:58` and `memory.ts:479`. `BuiltApp.start` sets `CLAUDE_CONFIG_DIR: join(userData, "claude")` in the app's environment before the caller's own (`built-app.ts:204`), and none of the four names another. The daemon inherits that environment (`daemon-client.ts:50-53`).
- **The lookup gives no answer.** Each of the four passes a stand-in as `SHELL`: `receiver.sh`, `basics-shell.sh` or `printer.sh`. Each stand-in exits 0 and prints nothing when it runs without a terminal, which is how the lookup runs it (`receiver.sh:8`, `basics-shell.sh:22`, `printer.sh:9`). `parseLookup` reads no answer from that (`claude.ts:150-156`), so `defaultLoginFolder()` stays null.

With no lookup answer, `Daemon#conversationsOf(SYSTEM_DEFAULT_ID)` has no folder, so it answers null and reads nothing (`daemon.ts:1592-1597`, `:1788-1794`). The reader of plugins under System default falls back to the daemon's environment, which is the app's own `userData/claude` (`claude-plugins.ts:28-30`, `:66`). The bystander daemon of `daemon-restart.test.ts:91` is spawned with the runner's own environment. It holds an empty run folder and the receiver as its shell, so it has no repository whose plugins it would read and no System default folder. The verdict on reads and writes is under `## Confirmations`.

The fix rewrites the row. These four files carry no risk to the person's folder, and the orchestrator can run them at the broad gate like any other.

```markdown
<!-- seal/threads/1795400734-accounts-per-repository/gaps.md:25, the row's first cell in place of the sentence after "did not run:" -->
... Of the built-app files that press a button of `#pane-buttons`, `terminal-basics`, `notification-click`, `daemon-restart` and `memory` did not run. Each starts the app through `BuiltApp.start`, which gives it a config folder of its own (`apps/desktop/test/built-app.ts`), and a stand-in shell that answers no lookup, so this work's readers read nothing of the person's folder under them (round 3, finding 3) | the orchestrator, at the broad gate |
```

```seal
verdict: fixed 07bd856
answer: The row's first cell now carries the record's sentence after "did not run.": each of the four files starts the app through `BuiltApp.start`, which gives it a config folder of its own, and a stand-in shell that answers no lookup, so the work's readers read nothing of the person's folder under them. The orchestrator's cell is kept.
```

## Confirmations

```seal
confirms: round-2#1
```

The close holds. `Daemon#readAgentNotice` reads System default's conversations before it awaits the notice and again after, and it sends the accounts where the two differ, before the notice's early return (`apps/desktop/src/daemon/daemon.ts:3688-3693`). The case at `apps/desktop/test/accounts.test.ts:547` holds this. I ran it alone in the round's clone at `db0dc30` with `node scripts/test-in-electron.mjs test/accounts.test.ts -t "sends the accounts again once the adapter"`: 1 passed and 42 skipped. Executed. This answers round 2's probe 5, which never reached its question.

```seal
confirms: round-2#2
```

The close holds for the pane bar.

- **The select is gone.** `#pane-account`, its part of the CSS rule and its reader in `work-item-view.ts` are all removed.
- **The menu works as stated.** A secondary click on a button that opens a pane of a kind that takes an account opens the window's own menu. Its first item is the work item's account, and each other account follows (`view.ts#newPaneMenu`, `work-item-view.ts#showPaneButtons`). A press of the button sends no `accountId`, so the pane runs under the work item's account.
- **The tests cover it.** The case at `apps/desktop/test/view.test.ts:4321` holds the menu's items and the tooltip.
- **The tabs are whole.** The retaken view shots show "Back of the seal", "Setup" and "Claude Code" whole, each pane's tab with its close mark, as in #181's shot.
- **The menu shot is unaffected.** It shows the work item's menu over the inbox, where no pane bar stands.

Read. The Ask row, which the same fix changed, is finding 1 of this round.

**Reads and writes of the person's config folder in the four built-app files.** No write is possible. No read reaches the person's folder either, as finding 3 shows. Each path that writes, and where it writes:

- **Links:** `claude-accounts.ts#linkOwn` makes links only inside an account's own folder, never inside the person's. Round 1's probe 3 confirmed this (executed). `Daemon#furnish` calls it only for an account the daemon made.
- **Made folders:** only `AccountStore#addMade` makes one, under the run folder's `accounts/`, and only a removal of that account deletes it. Since round 1's fix, a removal deletes no other folder (round 1's probe 4, re-run in round 2, executed).
- **Settings files:** `hooks.ts#writeHookSettings` and `hooks.ts#writePaneSettings` write into the daemon's run folder alone (`apps/desktop/src/daemon/hooks.ts:56-60`, `:79-84`).
- **Sign-in and sign-out:** these run the CLI under an account's folder. A sign-out runs only for a made folder, and System default has no sign-in (protocol `signIn`, `readSignIn`).
- **A refresh:** the one path that starts a CLI under System default's login. It starts only on a press of "Refresh usage" (round 1, executed search).

None of the four files adds an account, signs in or presses a refresh: the grep in finding 3 printed nothing of them. So none of the paths above runs under them. Every read this work adds goes to the app's own `userData/claude`, or does not happen because no lookup answered. That covers the plugins a pane enables, a repository's `chain` and the real path of `projects`. Read, apart from the parts marked executed.

What else matched:

- The changelog's new sentence on where a pane's account is chosen matches `work-item-view.ts`.
- `frame/plan.md`'s three new rows match the code. One of them takes no invented path for the screenshot scene, the choice round 2 left to the frame.

Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The menu of accounts on a button that opens a pane, drawn and pressed in the built app | `gaps.md` *Open rows*, `frame/questions.md` Q8 | the owner's walk of the built app (#184) |
| Whether the window's fixed words "Claude Code" keep rule 1 of `docs/architecture.md` *Rules that keep it portable* | `frame/questions.md` Q9 | the owner |
| The broad gate at the work item's last commit | `seal/config.json` `Broad gate` | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/accounts.test.ts -t "sends the accounts again once the adapter"`, in the round's clone at `db0dc30`, after `pgrep -f 'vites[t][.]mjs'` found no run | 1 passed, 42 skipped, exit 0 |
| `sips -c 40 420 --cropOffset 492 1020` on `night-watch-dark-view.png`, written to the round's scratch directory | the crop shows the Ask field at about 155 px and the menu reading "The work item's (System", cut |
