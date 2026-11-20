# Review round 4: 1795158088-terminal-basics

```seal
target: d572376 against release/v0.0.1
```

This round reads the range `2e51a55..d572376`. It holds five things. The framer's fold of the judgment that the link card stays at a modifier key pressed alone (`2a4493d`). Fix pass 3, `4eceb2c` to `204639d` with `f5df7d4`, and its close blocks (`70babbc`). The orchestrator's fold of round 3's findings 2 and 3 and of the statements phase 4 named (`ed96e3c`), and their close blocks (`59f269d`). Phase 4, `9d3d269` to `62ce7a4`, whose Status is `4817072`. The framer's fold of the judgment that "Clear Screen" keeps a program's modes (`d572376`). The base is `release/v0.0.1` at `02dea83`, the branch's merge base with `origin/release/v0.0.1`; the local `release/v0.0.1` still stands at `85c381a`. Phase 4 is a build phase, so its units were reviewed as new code on every axis. Round 3's four findings, each closed `fixed`, are answered as a verifying round answers them.

The records read whole at `d572376`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-4.md`, and `trail/rounds/round-1.md` to `round-3.md`. `pr.md` does not stand yet. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. `frame/plan.md` *Phases* says the fix pass after this round builds `keepModes`. So the sentences of *Scope* items 16 and 17, scenarios 21 and 22 and *Data & interfaces* on `keepModes` describe work not yet built, and were read for a defect of their design and not as contradicted by the target.

Facts carried from rounds 1 to 3 and not established again: where `renderer.ts` registers `onCommandKey` on the capture phase, what `closePane` and `closeFront` are for, what the debugging port sends past the system's menu, and that the merge `a7a9dd7` dropped nothing from either side. Each verdict below was reached again at `d572376`.

The axes walked were the table's ten and four of this change's own. The first is the window's life on macOS: each way a close, a quit and an activation reach the window, in a start as it ships and in a start in the background. The second is the pool of terminal screens: what a pane's menu acts on when its screen goes to another pane. The third is what a shell reads from the three bytes of the editing keys. The fourth is the daemon's protocol across builds: a `forget` sent to a daemon an earlier build left running.

## Findings

### 1. A pane's menu stays open when its pane leaves the stage, and its items then act on the pane that takes the screen

```seal
severity: should
location: `apps/desktop/src/renderer/work-item-view.ts:305-312`, `apps/desktop/src/renderer/work-item-view.ts:322-341`, `apps/desktop/src/renderer/work-item-view.ts:523-528`, `seal/threads/1795158088-terminal-basics/gaps.md:29`, `seal/threads/1795158088-terminal-basics/gaps.md:39`, `apps/desktop/test/terminal-basics.test.ts`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_menu_pane.test.ts -t "tmpprobe"` (`## Probes`); read `apps/desktop/src/renderer/work-item-view.ts:322-341`, `apps/desktop/src/renderer/work-item-view.ts:352-399`, `apps/desktop/src/renderer/work-item-view.ts:523-528`, `apps/desktop/src/renderer/work-item-view.ts:537-569`, `apps/desktop/src/renderer/view.ts:841-853`, `apps/desktop/src/renderer/renderer.ts:175-179`, `seal/threads/1795158088-terminal-basics/gaps.md:39`
```

Why it matters: `openMenu` binds the menu to a screen of the pool and not to a pane (`work-item-view.ts:352`). Each item's press calls `menuAct(item.act, screen)`, which acts on whatever pane `screen.turns.pane` holds at the press (`:323`). A pane that leaves the stage gives its screen back (`giveBack`, `:523-528`), and nothing there closes the menu. `screenMoves` hands the first free screen to the next pane that comes onto the stage (`view.ts:847`). So when the menu's pane leaves the stage while the menu is open, the next pane on the stage takes its screen, and "Paste", "Clear Screen", "Reset Terminal" and "Close Pane" act on that pane. "Clear Screen" then has the daemon forget the other pane's output, and "Close Pane" ends the other pane's session where it is not working. The window's own keys also stay unread until a press of the mouse closes the menu, since `dialogOpen` reads any element with the role `menu`.

Two ways reach it without a press of the mouse in the page, which would close the menu first. One is a pane closed by another client of the daemon. The probe ran that one: with two shell panes, the menu opened on the second, and the second closed through `closeFromElsewhere`. The menu was still open, and its "Paste" handed `probe-text` in brackets to the first pane's process. The other is a click on a notification, which macOS shows outside the page: `onNotificationClick` calls `openView` (`renderer.ts:178`), whose `stageShows` gives every screen of the old view back and hands them to the new view's panes. That path was read and not run, since no probe may raise a notification.

The implementer's account names the first way. `gaps.md:39` says: "Its items then do nothing: the screen holds no pane, and `work-item-view.ts#menuAct` returns." That holds only where the closed pane was the work item's last. Where another pane is listed, `dropClosed` and the `showView` after it put that pane on the freed screen, as the probe shows. The *Not done* bullet is a claim the code does not bear out, and the behaviour it leaves is a press that acts on a pane the person did not open the menu on.

Rule 12's class was listed by taking apart what can change a screen's pane: `take` and `giveBack` are the only two writers of `turns.pane` (`view.ts:909-922`), and `giveBack` is reached from `stageShows` and `dropClosed` alone (`work-item-view.ts:542`, `:567`). One line in `giveBack` therefore covers every way.

`apps/desktop/src/renderer/work-item-view.ts`, `closeMenu` at lines 304 to 312:

```ts
/** Closes the pane's menu where it is open. The terminal of the pane it was for takes the keyboard back, unless `giveKeyboard` is false, as where that pane leaves the stage. */
function closeMenu(giveKeyboard = true): void {
  if (!paneMenuElement) return;
  paneMenuElement.remove();
  paneMenuElement = undefined;
  if (giveKeyboard) paneMenuTerm?.focus();
  paneMenuTerm = undefined;
}
```

The same file, the start of `giveBack` at lines 523 and 524:

```ts
function giveBack(screen: Screen): void {
  if (screen.turns.pane === undefined) return;
  // A menu open for this pane closes as the pane leaves the stage: the screen goes to the next pane that comes, and the menu's items would act on that one.
  if (paneMenuTerm === screen.term) closeMenu(false);
```

`apps/desktop/test/terminal-basics.test.ts`, a case after the menu's case, written from the probe. It is red at `d572376`, where the menu is still open after the close.

```ts
  it("closes a pane's menu when its pane is closed from elsewhere, so no item acts on the pane that takes its screen", async () => {
    const second = await openPane("Shell");
    await pidOf(second);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the new pane");
    await openMenu();
    await closeFromElsewhere(second);
    await app.until(`${TABS}.length === 1`, "one tab");
    await app.until(`!(${MENU_OPEN})`, "the menu closed with its pane");
  });
```

The snippet stops at the code and its case. The fix pass owes `gaps.md` the removal of the bullet at line 39 and "Nine" for "Ten" at line 29. *Scope* item 16 (`frame/design.md:136`) says nothing of a pane that leaves the stage while its menu is open, as item 8 does for the dialog. The sentence "Where the pane leaves the stage while its menu is open, the menu closes." is owed there, and the frame is not the crafter's to write, so the hand-back names it for the orchestrator to fold.

### 2. The changelog and the frame say Control+U deletes what stands before the cursor, and zsh, the shell a shell pane starts, deletes the whole line at it

```seal
severity: should
location: `seal/threads/1795158088-terminal-basics/changelog.md:15`, `seal/threads/1795158088-terminal-basics/frame/design.md:138`, `apps/desktop/src/renderer/view.ts:585`, `apps/desktop/src/renderer/view.ts:594-596`
evidence: executed `zsh -f -c 'bindkey "^U"; bindkey "^A"; bindkey "^E"'`, `git grep -n -i -E 'deletes? to (the|its) (line|start)|deletion of what stands before|delete to (the line|its start)|line.s start\)|Control\+U' HEAD -- apps seal docs`; read `apps/desktop/src/daemon/pty.ts:76`, `apps/desktop/src/renderer/view.ts:585`, `apps/desktop/src/renderer/view.ts:594-596`, `seal/threads/1795158088-terminal-basics/changelog.md:15`, `seal/threads/1795158088-terminal-basics/frame/design.md:138`
```

Why it matters: `changelog.md:15` tells a person that Control+U is what "a shell and Claude Code read as ... the deletion of what stands before the cursor". A shell pane runs `$SHELL`, and `/bin/zsh` where none is named (`pty.ts:76`). zsh's own key table, with no start file read, binds `^U` to `kill-whole-line`, `^A` to `beginning-of-line` and `^E` to `end-of-line`. So in the shell macOS gives an account, Command+Backspace in the middle of a line deletes the text after the cursor as well. The fragment is what the release notes are built from. The same claim stands in *Scope* item 18 ("Control+U, which deletes to the line's start", `frame/design.md:138`), in the comment on `PANE_KEY_BYTES` (`view.ts:585`) and in the comment on `paneKey` (`view.ts:594-596`). bash's readline reads `^U` as a deletion back to the line's start, which is what the sentences say. What Claude Code reads it as was not run (`frame/questions.md` Q5).

The search over the thread and `apps` lists every statement of what Control+U does. Of the others, `frame/plan.md:147` names the bytes and no effect. `gaps.md:21` and Q5 ask the owner whether the key deletes to the line's start "in a shell". For zsh that is now answered, and the fix pass may say so in that row. The byte itself is the one other terminals send for this key. Whether a key that clears the whole line in zsh is what the owner wants is a row of `## Not judged`, and this finding does not decide it.

`seal/threads/1795158088-terminal-basics/changelog.md`, line 15:

```md
- **On a Mac, Command with the left arrow, the right arrow and Backspace edit the line**, in every kind of pane. They send Control+A, Control+E and Control+U. A shell reads the first two as the line's start and its end. Control+U deletes what stands before the cursor in bash, and the whole line in zsh, the shell macOS starts by default.
```

`apps/desktop/src/renderer/view.ts`, the comment at line 585:

```ts
/** The byte the pane's process is handed for each: a line feed, and Control+A, Control+E and Control+U. A shell reads the first two as the line's start and its end. bash reads Control+U as a deletion of what stands before the cursor, and zsh as a deletion of the whole line. */
```

The same file, the sentence of the comment on `paneKey` at lines 594 to 596:

```ts
 * other modifier are the editing keys of macOS: the left arrow goes to the
 * line's start, the right arrow to its end, and Backspace sends Control+U,
 * which deletes what stands before the cursor in bash and the whole line in
 * zsh. On a keyboard without the Command key the three stay the
```

*Scope* item 18 (`frame/design.md:138`), its parenthetical on Backspace, is the frame's and not the crafter's: "Backspace sends `15` (Control+U, which bash reads as a deletion to the line's start, and zsh as a deletion of the whole line)". The hand-back names it for the orchestrator to fold.

## Confirmations

```seal
confirms: round-3#1
```
What holds: `showInFinder` follows every link with `realpath` before it reads the disk, takes the name and the `.git` test from what the link leads to, and hands the act the link's own path (`apps/desktop/src/main/paths.ts:84-93`). The case at `apps/desktop/test/paths.test.ts:151-158` reads both directions the finding named, and the two rows added to the refusals read a link to nothing and `/dev/null`. The answer's claim on the one unwatched line was read: without `if (real === null) return false`, `kindAt(null)` rejects inside its own `try` (`paths.ts:10-18`) and answers null, so the result is the same. The file ran green (executed: the unit run below). *Scope* item 14 (`frame/design.md:134`) now names the folder a link leads to, which `ed96e3c` folded, and that matches `basename(real)`.

```seal
confirms: round-3#2
```
What holds: both `to` lines of the first rule change now say that a Command click on another work item's worktree puts that view in front, and that any other path is shown in Finder (`frame/design.md:243` and `:255`), as `view.ts#linkClick` and `LINK_ROWS.workItem` answer it. The `check:` lines are unchanged (read: `git show ed96e3c -- seal`, word by word).

```seal
confirms: round-3#3
```
What holds: *Data & interfaces* (`frame/design.md:226`) says `chooseFinder` calls `chooseOpener` once for each act when `main.ts` loads, and that `showInFinder` chooses the act after reading the disk. `main.ts:41-51` calls `chooseFinder` at load, and `paths.ts:84-93` reads the disk before `finderAct`. The `gaps.md` bullet (`gaps.md:37`) says the same in its own words, and no longer cites the design's earlier sentence (read).

```seal
confirms: round-3#4
```
What holds: `changelog.md:12` says the card shows under the link "or above it where the window has no room under it", which is what `work-item-view.ts#showCard` does (read).

What matched: the fold `2a4493d` and the build `204639d`. *Scope* item 13 says the card stays at Command, Shift, Control or Option pressed alone, named `Meta`, `Shift`, `Control` and `Alt` in an event's `key`, and leaves at any other key. `view.ts#cardStaysAt` answers exactly those four names, and the document's capture listener hides the card at every other key (`work-item-view.ts:824-830`). The card case presses each of the four through the debugging port and reads the card still shown and nothing handed to the pane (`terminal-basics.test.ts:594-609`). `gaps.md` dropped the *Not done* entry this answers, which `frame/plan.md` *Phases* asked of the pass, and no row of *Not verified* left in the range (executed: `git diff 2e51a55 HEAD -- .../gaps.md`, rows only).

What matched: the window that hides at its close, read and not run. `closeHides` answers true only on `darwin`, not in the background and not quitting (`background.ts:46-48`). `quitting` is set at `before-quit` (`main.ts:55-58`). Quit from the app's menu, from the Dock and from the system all go through Electron's `app.quit` path, which emits `before-quit` before any window's `close`, so a close then closes and the app ends. The window's `close` prevents the default and hides, and a full-screen window first leaves full screen and hides at `leave-full-screen` (`main.ts:86-95`). `activate` shows a window that is not visible and makes one where none is (`main.ts:143-147`). A click on a notification shows a hidden window through `forward.ts#comeForward`, which calls `show` and `focus` and is unchanged. A start in the background never hides: `closeHides` answers false there, and `window-all-closed` still quits by `quitsWithLastWindow` (`main.ts:150-153`). Nothing else in `src/main`, `src/renderer` or `src/preload` closes the window, calls `app.quit` or `app.exit`, or listens for `beforeunload` (executed: `grep -rn -E 'beforeunload|app\.quit|\.close\(\)|app\.exit'`). The menu's "Close Window" keeps the role `close` on Shift+Command+W, which scenario 9's case reads. No probe ran the hide, as `frame/design.md` scenario 25 says, and `gaps.md:20` names the owner's hand run.

What matched: the three editing keys. `paneKey` returns null during a composition, by `isComposing` and by key code 229, before it reads any key. It reads the three keys only where `mac` is true, the Command key is held and no other modifier is (`view.ts:601-608`). `PANE_KEY_BYTES` holds `01`, `05` and `15` (`view.ts:586`). The key handler sends the byte on `keydown` alone and stops the default and the terminal's own reading at every event of the press (`work-item-view.ts:476-483`). The built-app case reads each byte alone, since `Received.next` takes every byte that arrived (`test/korean-pane.ts:208-213`). Shift+Enter is still read first, on every keyboard. Finding 2 is about what zsh does with the third byte.

What matched: the daemon's `forget`. It empties the session's kept output and does nothing for an id the daemon does not list (`daemon.ts:313-316`, `this.sessions.get(message.id)?.output.clear()`). `OutputBuffer.clear` empties the pieces and the count. Nothing else in the daemon reads a session's kept output but the replay at `attach` (executed: `grep -n 'output\.' src/daemon/*.ts`). A daemon of an earlier build, as at `02dea83`, parses any JSON message from an authorized client and returns at the `default` of `handle` for a type it does not know, without closing the socket (read: `git show 02dea83:apps/desktop/src/daemon/daemon.ts`, lines 188-210 and 363). `ensureDaemon` reuses any daemon that answers its hello (`daemon-client.ts:7-17`, `:43-44`), so such a daemon is the one a new window meets. That matches `changelog.md:14` and the row at `gaps.md:23`.

What matched: the pane's menu, apart from finding 1. Focus goes to the terminal at Escape, at a press of an item and at a press outside (`work-item-view.ts:305-312`, `:369-372`, `:836`), and the case reads the keyboard in the terminal after Escape. The Escape event reaches the document's bubbling listener `onKey` after the menu is gone, and `inboxKey` reads no key there, since a pane's menu opens only in a work item's view. While the menu is open `dialogOpen` reads it (`renderer.ts:122-124`), so `commandKey` and `inboxKey` read nothing, and the case reads Command+W and Command+N doing nothing. The link card while the menu is open, which `gaps.md:40` names, needs no fix in 0.0.1: a press on a row of the card closes the menu through the document's `mousedown` listener and does what the row says, and the card is gone at any key the menu takes. One edge is left with no finding. Tab moves the keyboard out of the menu, and the menu stays open with the window's keys unread until a press of the mouse. *Scope* item 16 names Escape and a press outside as what closes it, and a menu of macOS takes no Tab.

What matched: the statements `ed96e3c` folded, against `d572376`. *Scope* item 14 on a link's name matches `paths.ts:91-92`. Item 16 on a second `contextmenu`, on one on the menu itself and on the arrows that pass a disabled item and go round matches `work-item-view.ts:376-391` and the case. Scenario 21's clipboard after "Select All" and "Copy" holds the URL and `a named link`, which the case reads. *Data & interfaces* naming `cardStaysAt` and `PANE_KEY_BYTES` matches `view.ts:586` and `:747`. `frame/plan.md` *Phases* row 4's Status `4817072` is phase 4's last code commit. Q7's answer (a) matches `trail/phases/phase-4.md` and the case's press of the right button through the port.

What matched: the design `d572376` adds for `keepModes`, read for a defect the crafter would build in, and none found. The daemon keeps, for each mode number, the last `ESC [ ? Pm h` or `l` that named it, in the order those last sequences stood, read after the last `ESC c`. For a mode that the last sequence naming it sets outright, which is how xterm 6.0.0 treats the mouse reporting modes, their forms, pastes in brackets, focus reporting, the cursor's showing and the alternate screen, replaying those last sequences in their order gives the state the whole output gave. A `$p` request and `ESC[4h` are left out, as scenario 22 asks. A sequence the buffer cut at its limit opens with no `ESC` after the cut and cannot be read as a mode. The buffer's kept sequences stand first in it, and the next `forget` with `keepModes` reads them again, so a second "Clear Screen" keeps the same modes. Scenario 21's three reds tell a `forget` without the field, with it at every press, and none apart. What the design leaves is in `frame/plan.md` *The failure scenarios of what the fold adds*: a mode set by another kind of sequence, a soft reset, and a mode the buffer already dropped. The statements the fix pass must rewrite, as `frame/plan.md` lists them, are a sample: the comment on `OutputBuffer.clear` (`buffer.ts:44`) and the row of `gaps.md:23` on an earlier daemon also state the `forget` that keeps nothing.

What matched: the new cases against their groups. `closeHides` has its own `describe` in `test/background.test.ts`, beside `quitsWithLastWindow`, and each of its cases reads one input. The case of the daemon's `forget` and the case of `OutputBuffer.clear` read what no earlier case of `test/daemon.test.ts` reads. The new cases of `showInFinder` read a link, which no earlier case handed it.

The suite's label is honest. `gaps.md:7` names the suite, the typecheck and the `Broad gate` command of `seal/config.json` as the orchestrator's, and says phase 4 changes the daemon's protocol. This round ran four unit files and one probe case of the built app, and none of the three. Once the two findings are closed, what comes due is the fix pass that also builds `keepModes`, as `frame/plan.md` *Phases* states, and a verifying round over it. The orchestrator's broad run and the sealer come after the last round.

The chain check over this worktree printed no notice at `frame/design.md`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether Command+Backspace should clear the whole line in zsh, which the byte `15` does, or be left to the terminal there. No single byte deletes back to the line's start in zsh's default key table | `apps/desktop/src/renderer/view.ts:586` | The owner, at the hand run of `frame/questions.md` Q5 |
| What Claude Code does with `01`, `05` and `15` | `seal/threads/1795158088-terminal-basics/changelog.md:15` | The owner, at the hand run of `frame/questions.md` Q5 |
| A close, a quit and an activation of the window in an app started as it ships, and a notification while it is hidden. Read above and never run | `apps/desktop/src/main/main.ts:86-95`, `apps/desktop/src/main/main.ts:143-147` | The owner, at the hand run of `frame/questions.md` Q6 |
| A click on a notification while a pane's menu is open, the second way finding 1 names. Read and not run, since no probe may raise a notification | `apps/desktop/src/renderer/renderer.ts:175-179` | The verifying round after the fix pass reads that `giveBack` closes the menu, which covers it |
| `test/terminal-basics.test.ts` as a whole at the target. Phase 4 ran it at `4817072`, and only records changed after it. This round ran one probe case of a copy of it | `seal/threads/1795158088-terminal-basics/gaps.md:7` | The orchestrator, in the broad run after the review rounds settle |
| The suite, the typecheck and the broad gate at the head of the branch | `seal/threads/1795158088-terminal-basics/gaps.md:7` | The orchestrator, in the broad run after the review rounds settle |

## Probes

The test runs were in `apps/desktop` of the branch's worktree. The one start of the app went through `BuiltApp.start`, in the background.

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_menu_pane.test.ts -t "tmpprobe"`, where the probe file was a copy of `test/terminal-basics.test.ts` with one case added: open a second shell pane, open its menu, close it through `closeFromElsewhere`, then press the menu's "Paste" with `probe-text` on the app's clipboard | Exit 0: 1 case passed, 24 skipped. The menu was still open after the close, and the first pane's process received `probe-text` between `ESC[200~` and `ESC[201~`. The probe file was deleted after the run, and `git status` was clean |
| `node scripts/test-in-electron.mjs test/paths.test.ts test/background.test.ts test/view.test.ts test/daemon.test.ts` | Exit 0: 4 files and 454 cases passed |
| `zsh -f -c 'bindkey "^U"; bindkey "^A"; bindkey "^E"'` | `"^U" kill-whole-line`, `"^A" beginning-of-line`, `"^E" end-of-line` |
| `git grep -n -i -E 'deletes? to (the\|its) (line\|start)\|deletion of what stands before\|...\|Control\+U' HEAD -- apps seal docs` | `view.ts:585`, `changelog.md:15`, `frame/design.md:138`, `frame/plan.md:147`, `frame/questions.md:36`, `gaps.md:21` and the built-app case's name; `view.ts:595` was found by its own wording |
| `grep -rn -E 'beforeunload\|app\.quit\|\.close\(\)\|app\.exit' src/main src/renderer src/preload` | Only `main.ts:152` and the two closes of the "New work item" dialog |
| `git merge-base HEAD origin/release/v0.0.1` | `02dea83` |
| `python3 skills/code-review/scripts/chain_check.py --baseline 02dea83 --root <the worktree> --worktree`, after the record was written | Exit 0. It names this round's two findings as open for having no close block, and the gate record and the guarantee as not yet written. No notice at `frame/design.md` |
