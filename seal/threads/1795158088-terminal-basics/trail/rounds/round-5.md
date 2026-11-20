# Review round 5: 1795158088-terminal-basics

```seal
target: 3534634, fixes 02ed5f6..3534634
```

This verifying round reads the range `02ed5f6..3534634`. It holds the orchestrator's fold of the two frame sentences round 4 owed (`94dda13`). It holds fix pass 4: `23629ac`, `850eb2f` and `5f9267f`, with its close blocks at `22f88bd`. That pass answers round 4's findings 1 and 2 and builds `keepModes`, which `frame/plan.md` *Phases* gives it. The range also holds the orchestrator's `pr.md` (`30ed3c9`) and its fold of the statements fix pass 4 named (`3534634`). The base is `origin/release/v0.0.1` at `02dea83`, which is also the branch's merge base with it. `lastModes` and the new argument of `OutputBuffer.clear` are new units nobody had reviewed, so they were reviewed as code on every axis. The rest of the code review stays inside the fix diff.

The records read whole at `3534634`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, and `trail/rounds/round-1.md` to `round-4.md`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. `trail/phases/phase-4.md` was read for its account of the menu and of what it saw red. Phases 1 to 3 were not opened again: their coordinates reached this round through rounds 1 to 4.

Facts carried from round 4 and not established again: `take` and `giveBack` are the only two writers of a screen's pane, and `giveBack` is reached from `stageShows` and `dropClosed` alone. A daemon of an earlier build returns at the `default` of its message switch for a type it does not know. zsh's key table, with no start file read, binds `^U` to `kill-whole-line`. `renderer.ts` registers `onCommandKey` on the capture phase. Each verdict below was reached again at `3534634`.

The axes walked were the table's ten and three of this change's own. The first is what the daemon's replay draws after "Clear Screen" against what the window's terminal holds, for every way output can stand in the buffer when the `forget` arrives. The second is the re-entry of the window's focus listeners while the stage changes. The third is what the pull request's first part tells a person who opens no file.

## Findings

### 1. "Clear Screen" pressed while a program's output stops inside an escape sequence makes the next replay print the rest of that sequence as text

```seal
severity: should
location: `apps/desktop/src/daemon/buffer.ts:82-86`, `apps/desktop/test/daemon.test.ts`, `seal/threads/1795158088-terminal-basics/frame/design.md:137`, `seal/threads/1795158088-terminal-basics/frame/plan.md:46`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round5_probe.test.ts` (`## Probes`); read `apps/desktop/src/daemon/buffer.ts:20-31`, `apps/desktop/src/daemon/buffer.ts:82-86`, `apps/desktop/src/renderer/work-item-view.ts:339-341`, `apps/desktop/node_modules/@xterm/xterm/src/browser/CoreBrowserTerminal.ts:1240-1258`
```

Why it matters: the daemon appends a pane's output as the pseudo-terminal hands it over, so one escape sequence can arrive in two pieces. When the `forget` with `keepModes` arrives between the two pieces, `clear(true)` reads the whole text, finds no complete sequence in the unfinished first piece, and drops it (`buffer.ts:82-86`). The second piece is then appended as the start of the new output. The probe ran it: after `a line\r\n` and `ESC[?20`, a clear with the modes kept, and `04hrest\r\n`, the buffer holds `04hrest\r\n`. The next replay prints `04h` as text, and the mode is not set.

The window's terminal reads the same bytes another way. `menuAct` calls `term.clear()` for "Clear Screen" (`work-item-view.ts:339-341`). xterm 6.0.0's `clear` moves the buffer's lines and leaves the parser as it was (`CoreBrowserTerminal.ts:1240-1258`), so the parser completes the sequence from the second piece and sets the mode. After the person leaves the stage and comes back, the pane then shows the stray characters at its top, and a mode the window had is missing. The class is wider than private modes: any sequence cut there is printed in part, a colour or a cursor move among them. "Reset Terminal" is not affected, since `term.reset()` resets the parser too and the window prints the same rest. `frame/plan.md:46` names what the read of the modes does not see, and this case is not among them. It shows most where it is likeliest: a person who clears a pane while an agent streams its frames.

The fix keeps, after the modes, the sequence the output stopped inside, so the rest the program prints next completes it in the replay as it does in the window.

`apps/desktop/src/daemon/buffer.ts`, beside the two constants at lines 5 to 7:

```ts
// The sequence the output stops inside, where it stops inside one: an escape alone, a CSI sequence with no final byte yet, or an OSC string with no end yet. Its rest arrives later, and a terminal that was cleared and not reset reads that rest as the sequence's.
const OPEN_SEQUENCE = /\u001b(?:\[[0-?]*[ -/]*|\][^\u0007\u001b]*)?$/;
```

The same file, `clear` at lines 82 to 86, with its comment's last sentence added:

```ts
   * They count toward the buffer's size as output does, and the next
   * emptying with `keepModes` reads them as it reads output. Where the output
   * stops inside a sequence, that unfinished sequence is kept after them, so
   * the rest the program prints next completes it.
   */
  clear(keepModes = false): void {
    const text = this.text();
    const kept = keepModes ? lastModes(text) + (OPEN_SEQUENCE.exec(text)?.[0] ?? "") : "";
    this.chunks = kept === "" ? [] : [kept];
    this.size = kept.length;
  }
```

`apps/desktop/test/daemon.test.ts`, a case in `describe("OutputBuffer")` after the case on a mode's number. It is red at `3534634`, where the second `expect` reads `\u001b[?1000h04hrest\r\n`.

```ts
  it("keeps the sequence its output stopped inside after the modes, so what the program prints next completes it", () => {
    const buffer = new OutputBuffer(1000);
    buffer.append("a line\r\n\u001b[?1000h\u001b[?20");
    buffer.clear(true);
    expect(buffer.text()).toBe("\u001b[?1000h\u001b[?20");
    buffer.append("04hrest\r\n");
    expect(buffer.text()).toBe("\u001b[?1000h\u001b[?2004hrest\r\n");
  });
```

The snippet does not cover a DCS string (`ESC P`). That stays a limit of the read and is no longer a silent one once the frame names it. The snippet stops at the code. *Scope* item 17 (`frame/design.md:137`) says the daemon keeps "one sequence for each such number" and nothing else, so the kept tail needs the sentence "Where the output stops inside a sequence, the daemon keeps that unfinished sequence after the modes, so that what the pane prints next completes it." Scenario 22 needs the matching clause. Both are the frame's and not the crafter's, so the hand-back names them for the orchestrator to fold. Where the fix pass declines the fix instead, the case belongs in `frame/plan.md:46` among the failure scenarios of the fold.

### 2. `pr.md` says Command+Backspace did nothing before this change, and it deleted one character

```seal
severity: should
location: `seal/threads/1795158088-terminal-basics/pr.md:14`
evidence: read `apps/desktop/node_modules/@xterm/xterm/src/common/input/Keyboard.ts:84-90`, `apps/desktop/node_modules/@xterm/xterm/src/common/input/Keyboard.ts:115`, `apps/desktop/node_modules/@xterm/xterm/src/browser/CoreBrowserTerminal.ts:1021-1095`, `seal/threads/1795158088-terminal-basics/frame/design.md:29`
```

Why it matters: `pr.md` is the part of the pull request body a person reads first. Its table says "Command with ←, → and ⌫ did nothing". Before this change no key handler of the window read these keys. xterm 6.0.0 then evaluates the press itself. For an arrow with the Command key it sends nothing (`Keyboard.ts:115`, `if (ev.metaKey) break;` under the left arrow, and the same under the other three). For Backspace it sets the key to `DEL`, or to `^H` with Control, and reads no Command key (`Keyboard.ts:84-90`). `_keyDown` hands that key to the pane (`CoreBrowserTerminal.ts:1043` and `:1092`). So Command+Backspace sent `7f`, the byte of Backspace, and deleted one character. The arrows did nothing, as the table says. The framer's probe read Electron's default menu and named no item on Command+Backspace (`frame/design.md:29`). That the default menu's "Delete" carries no key is a recollection of Electron's roles, and nobody opened it. Where it is wrong, the row would hold as written. `## Not judged` holds that question.

`seal/threads/1795158088-terminal-basics/pr.md`, line 14:

```md
| Command with ← and → did nothing, and Command with ⌫ deleted one character, as ⌫ does | They send Control+A, Control+E and Control+U, as other macOS terminals do |
```

### 3. `pr.md`'s list for the owner's hand run leaves out rows `gaps.md` gives to that run, and says Cmd+W is pressed through the system menu

```seal
severity: should
location: `seal/threads/1795158088-terminal-basics/pr.md:27-32`
evidence: read `seal/threads/1795158088-terminal-basics/gaps.md:7-28`, `seal/threads/1795158088-terminal-basics/pr.md:27-32`, `seal/threads/1795158088-terminal-basics/frame/questions.md:33-36`
```

Why it matters: the list opens "Not verified, for the owner's hand run of #24:". A person who opens no file reads it as what the hand run has to cover. The list was checked against every row of `gaps.md` *Not verified* whose answerer is the owner's hand run before the release: rows 8, 10, 11, 12, 16, 20, 21 and 26. Each row was taken apart into the things it asks, and each thing was looked for in the list. Four things are missing.

- Command+V in a pane under the new menu (`gaps.md:10`, `frame/questions.md` Q4).
- Whether Claude Code reads a dropped path with a backslash before each space as an image (`gaps.md:11`, Q1). The list names Shift+Enter in Claude Code and the drag from Finder, and not this.
- A click with the Control key opening the pane's menu, and Command with the left arrow and the right arrow, pressed by a person, in bash and in Claude Code (`gaps.md:21`, Q5). The list names Command+Backspace in Claude Code alone.
- A key typed at once after a pane came back onto the stage (`gaps.md:26`).

The list also says "Cmd+W pressed through the system menu". No menu item holds Cmd+W. `gaps.md:8` asks whether a person's press reaches the page with the system's menu in front of it, and the words can send the owner looking for an item that is not there. The rows on another platform, on a daemon of an earlier build and on the next party who changes a function do not name the hand run, and the list rightly leaves them out. `seal pr-body` copies `gaps.md` whole into the fold below, so nothing is lost from the body. The first part then disagrees with the fold.

`seal/threads/1795158088-terminal-basics/pr.md`, lines 30 and 32, and one more bullet after line 32:

```md
- **Keys and drags a person makes.** Cmd+W, Shift+Command+W and Cmd+V pressed by a person, with the system's menu in front of the page, and Shift+Enter in a real Claude Code. A file dragged from Finder, and a screenshot dragged from its thumbnail, and whether Claude Code reads the dropped path, with a backslash before each space, as an image. A click with the Control key on a pane, which opens its menu.
- **What a person's editing keys do.** Command with the left arrow, the right arrow and Backspace, in bash and in Claude Code. In zsh, Command+Backspace deletes the whole line, the text after the cursor too: say whether that stays.
- **A key typed at once after a tab change.** A pane sends nothing while it draws what the daemon replays, which an earlier change of the release made so. Another tab, back, and typing at once shows whether a key is lost.
```

### 4. `gaps.md` says the mutant `closeMenu()` in `giveBack` leaves the window the same, and on a click on a notification it does not

```seal
severity: should
location: `seal/threads/1795158088-terminal-basics/gaps.md:25`
evidence: read `apps/desktop/src/renderer/work-item-view.ts:305-311`, `apps/desktop/src/renderer/work-item-view.ts:502-506`, `apps/desktop/src/renderer/work-item-view.ts:529-536`, `apps/desktop/src/renderer/work-item-view.ts:545-563`, `apps/desktop/src/renderer/work-item-view.ts:717-728`, `apps/desktop/src/renderer/work-item-view.ts:735-742`, `apps/desktop/src/renderer/renderer.ts:80-84`, `apps/desktop/src/renderer/renderer.ts:175-179`
```

Why it matters: the row tells the next party who changes `giveBack`, `closeMenu` or the `focusin` listener what the guard `closeMenu(false)` protects, and whether a case is owed. It says the mutant passed both cases of the menu because "the window ends the same", and it names `dropClosed` as the one place the mutant's `focusin` can call `showView` from. Both cases reach `giveBack` through `dropClosed`, and there the reading holds. The path of a click on a notification is the one row 24 names, and there it does not hold. This was read and not run, since no probe may raise a notification.

`onNotificationClick` calls `openView` (`renderer.ts:175-179`). `enterView` unsets `front` (`work-item-view.ts:740`), and `showView` calls `stageShows`, which calls `giveBack` for the screen of the menu's pane (`:550`). With the mutant, `closeMenu()` focuses that pane's terminal while its element is still shown. The `focusin` listener (`:502-506`) then finds a pane on the screen that is not `front`, while a view is held. It records that pane as the new view's latest and calls `showView` from inside the outer `stageShows`. The inner call frees the screens again, puts the incoming pane on a free screen, sets `front` and focuses it. The outer `giveBack` then goes on with the screen as the inner call left it. Where the inner call put the incoming pane on that same screen, `giveBack` detaches it and hides the screen. The outer `stageShows` then takes the screens by the moves it computed before. Where the inner call put the pane on another free screen, the pane then stands on two screens. In both cases `front` already names the incoming pane, so the outer `showView` focuses nothing (`:723`), and the keyboard ends on no terminal. The guard holds, and it protects more than the row says. A person meets the mutant's defect after one click.

`seal/threads/1795158088-terminal-basics/gaps.md`, line 25:

```md
| That the menu hands the keyboard to no terminal when its pane leaves the stage. `giveBack` calls `closeMenu(false)`, as `frame/design.md` *Scope* item 16 states. A mutant that calls `closeMenu()` there passed both cases of the menu, which reach `giveBack` through `dropClosed`: the screen is hidden on the next lines, and the pane left takes the keyboard, so the window ends the same there. On the path of a click on a notification, through `openView` and `stageShows`, it does not end the same, by the reading of review round 5, not run. The mutant's `focus` raises `focusin` on the leaving pane's element while `front` is unset, so the listener in `newScreen` calls `showView` from inside `stageShows`. That inner call moves the screens and gives the incoming pane the keyboard. The outer call then goes on with the moves it computed before, and the keyboard ends on no terminal. No case may raise a notification | The next party that changes `giveBack`, `closeMenu` or the `focusin` listener of `newScreen`, by a case that reads a difference where that change makes one |
```

## Confirmations

```seal
confirms: round-4#1
```
What holds: `giveBack` closes the menu of the pane that leaves without giving the keyboard (`apps/desktop/src/renderer/work-item-view.ts:531-532`), before the detach and the reset. `closeMenu` takes `giveKeyboard` and focuses nothing where it is false (`:305-311`). Both ways round 4 named reach it. The way that closes a pane elsewhere is `dropClosed` to `giveBack` (`:570-575`). The way of a click on a notification is `onNotificationClick` to `openView` to `showView` to `stageShows`, which gives back every screen whose pane is not on the new stage (`renderer.ts:175-179`, `work-item-view.ts:545-550`). That reading answers the row at `gaps.md:24`, which names this round, and round 4's `## Not judged` row on the same click. Where the click opens the same view and "Side by side" keeps the menu's pane on the stage, the menu stays open over its own pane, which is right. The new case at `apps/desktop/test/terminal-basics.test.ts:1013-1023` passed in both runs of this round's copy of the file (executed, `## Probes`). The close block says it was seen red at `94dda13`. That was not run again, and reading agrees: before `23629ac` nothing in `giveBack` touched the menu. `gaps.md` *Not done* no longer holds the bullet, and it counts eight entries, which are eight (`gaps.md:32-41`). *Scope* item 16 (`frame/design.md:136`) and `changelog.md:13` carry the sentence. Finding 4 is about what `gaps.md:25` says of the guard, not about the guard.

```seal
confirms: round-4#2
```
What holds: `changelog.md:15` carries the sentence round 4 gave. `view.ts:585` and `:594-597` say bash deletes what stands before the cursor at Control+U and zsh the whole line. *Scope* item 18 (`frame/design.md:138`) says the same and keeps the byte `15`. `frame/questions.md` Q5 now asks about bash and Claude Code and says what zsh does. `gaps.md:21` says zsh's reading and what was not run. `frame/design.md:230` still names the act `deleteToLineStart`, which is the code's identifier and no claim about zsh (read, all at `3534634`). `pr.md:32` repeats the zsh fact. Finding 3 is about what that line leaves out.

What matched: the build of `keepModes` against *Scope* items 16 and 17 and scenarios 21 and 22. The protocol's message is `{ type: "forget"; id: number; keepModes?: true }` (`apps/desktop/src/shared/protocol.ts:157`). The daemon hands `message.keepModes === true` to `clear` and does nothing for an id it does not list (`daemon.ts:313-316`). "Clear Screen" sends the field and "Reset Terminal" does not (`work-item-view.ts:339-345`). `lastModes` reads only after the last `ESC c`. It reads `ESC [ ? Pm h` and `l` with `Pm` as numbers joined by `;`, reads each number as a number, and keeps the last state of each in the order of the last sequence that named it (`buffer.ts:20-31`). The kept text counts toward the size (`buffer.ts:84-85`). Each clause of scenario 22 has its case (`daemon.test.ts`, the eight new cases of `OutputBuffer` and the daemon's case at `:285-309`). Scenario 21's two returns to the stage are in the menu's case. All passed (executed, `## Probes`).

What matched, on the points the spawn asked about `lastModes`. A sequence split across two appended pieces is read whole, since `clear` reads `text()`, which joins the pieces. The first case of `OutputBuffer` holds that. A sequence split across the `forget` is finding 1. `ESC c` inside other text is read where the terminal reads it: an escape inside an OSC or a DCS string ends that string in xterm's parser, so `ESC c` there is a full reset too, and the probe kept only the mode after it. A number with zeros before it is the same mode, which the case at `daemon.test.ts` holds. Many sequences cost little: a buffer of 262,140 characters made of `?2026` and `?25` pairs was read in 6 ms and kept two sequences. For a mode whose sequence sets its state outright, which is how xterm 6.0.0 treats the mouse modes, their encodings, pastes in brackets, focus reporting, the cursor's showing and the alternate screen, replaying the last sequence of each number in that order gives the state the whole output gave. The last sequence of the group stands last. So the kept prefix gives the window, after a return to the stage, the private modes the cleared terminal holds. The exceptions are the ones `frame/plan.md:46` names, and finding 1.

Three things the read leaves were weighed and opened no finding. A parameter list with an empty field (`ESC[?;2004h`, `ESC[?2004;h`) or a colon is not read, while xterm reads an empty field as 0 and sets the other mode. No program this work names prints such a list. A mode number of more than fifteen digits is rounded by `Number`, and from twenty-two digits it is written back as `1.1111111111111111e+24`, which a replay would print in part as text (`buffer.ts:25`, `:30`). Only output that already puts arbitrary bytes on the screen, such as a binary file printed, holds such a number. The kept prefix is the oldest piece of the buffer, so output past the limit with no line break in its first 4,096 characters cuts it by count (`buffer.ts:56-70`). The probe saw `4h` open the text. That is the cut by count the buffer's comment already states for a long stretch of a full-screen program, and the next 256 KiB of output drop the prefix whole, which `frame/plan.md:94` names as a defect of every replay.

What matched: `pasteOnceBack` (`apps/desktop/test/terminal-basics.test.ts:972-982`) hides no defect of this work. A screen's terminal sends nothing while it draws a replay that is not the pane's first (`work-item-view.ts:809-812`, `view.ts:924-934`). That comment and code came with `72e15fc` on 2026-11-19, an earlier work of the release, and stand at the merge base `02dea83` (executed: `git log -S"muted" origin/release/v0.0.1 -- src/renderer/view.ts`, and `git show 02dea83:apps/desktop/src/renderer/work-item-view.ts`). So a key or a paste in that moment is dropped. That is older than this work, and not this work's to fix. Whether it should be queued and not dropped is the owner's to decide, as an issue of its own. The hand run `gaps.md:26` names can measure it. In both of this round's runs the page was visible, focused by emulation, and its timers ran at once. The first press of "Paste" after each return arrived, 232 ms and 246 ms after the read began (executed, `## Probes`). So the retry did not fire there, and the moment in a window a person looks at is the time the terminal takes to draw the replay. The retry cannot pass a wrong mode: a paste without brackets fails the `expect`, three empty presses return an empty text, and a late first paste followed by a second leaves bytes for the next read, which then fails.

What matched: the surviving mutant. Without the guard's argument, the dropClosed path the cases run ends with the keyboard in the pane that is left, as the crafter says. `dropClosed` unsets `front` first, and the outer `showView` that `takeLists` calls after it focuses the new front. On the notification path the guard keeps the window right where the mutant would not. Finding 4 says what `gaps.md:25` should say of it. No case can tell the two apart without raising a notification, so the row's answerer stands.

What matched: the folds. `94dda13` adds to *Scope* item 16 "The menu also closes, without taking the keyboard, when its pane leaves the stage", which `giveBack` does. It also adds the zsh reading to item 18. `3534634` adds to item 17 the number read as a number and the size count, both of which `buffer.ts` does. It rewrites Q5, and `frame/plan.md:116` now lists every comment the pass rewrote, each of which the diff rewrote (read: `git diff 02ed5f6..3534634`, word by word). `changelog.md:13-14` match the code.

What matched: `pr.md` apart from findings 2 and 3, read as a person who opens no file would. Each row of its table but the editing keys holds at `3534634`. The sentence "Every action needs a click with the Command key held, or a press of a card row or a menu item" holds for what a link and a path do (`view.ts#linkClick`, `work-item-view.ts#act`). An app bundle is shown and not launched, through a symbolic link too (`paths.ts:84-93`, carried from round 3's confirmation). The paragraph on "Clear Screen" and on a daemon of an earlier build matches `changelog.md:14` and `gaps.md:23`. The paragraph on tests matches `main.ts:30-60` and `background.ts:46-48`. Issue #24 is the milestone's hand run in the built app (executed: `gh issue view 24 --json title,state,milestone`). The line "A right click did nothing" is a row of `## Not judged`.

What matched: the new cases against their groups. Each new case of `OutputBuffer` holds one clause of scenario 22 that no earlier case holds. The phase 4 case of `clear` empties a buffer with no mode sequence, and the new case without `keepModes` empties one that holds a mode. The daemon's new case reads the replay after a `forget` with the field and then without it, which the phase 4 case of `forget` does not. The menu's new case reads the close from elsewhere, which no earlier case does. The fix pass's account of which steps it saw red is not in the tree. By reading, each new case and step goes red under the mutant the frame names for it: a "Clear Screen" without the field, a "Reset Terminal" with it, a daemon that keeps the modes at every `forget`, and a `clear` that keeps them without being asked.

The suite's label is honest. `gaps.md:7` names the suite, the typecheck and the `Broad gate` command as the orchestrator's, and says what fix pass 4 ran. This round ran two test files and a copy of a third, and none of the three. Once the four findings are closed, what comes due is a verifying round over that fix pass. The orchestrator's broad run and the sealer's spawn come after the last round.

The chain check over this worktree printed no notice at `frame/design.md`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| `pr.md` says "A right click did nothing" before this change. `frame/design.md` `## Removes` says "The system's own menu at a press of the right button on a pane, which Chromium draws, stops opening there". Both cannot hold. By the reviewer's recollection, which nobody opened, Electron draws no context menu unless the app asks for one, so the design's sentence would be the wrong one | `seal/threads/1795158088-terminal-basics/pr.md:12`, `seal/threads/1795158088-terminal-basics/frame/design.md:272` | The orchestrator, who keeps one of the two sentences, by the build at `02dea83` or by Electron's documentation on `context-menu` |
| Whether Electron 45.3.3's default menu bound Command+Backspace, which finding 2's sentence rests on. The framer's probe named no such item, and that its "Delete" carries no key is a recollection | `seal/threads/1795158088-terminal-basics/frame/design.md:29` | The orchestrator, before it applies finding 2, by the framer's `probe-output.txt` or Electron's role list |
| What a click on a notification does with a pane's menu open, in the built app. Read above, never run, since no probe may raise a notification | `apps/desktop/src/renderer/renderer.ts:175-179` | The owner's hand run of #24, if the owner wants it run |
| The suite, the typecheck and the broad gate at the head of the branch | `seal/threads/1795158088-terminal-basics/gaps.md:7` | The orchestrator, in the broad run after the review rounds settle |

## Probes

The test runs were in `apps/desktop` of the branch's worktree. Each start of the app went through `BuiltApp.start`, in the background. The probe file was a copy of `test/terminal-basics.test.ts` with two additions. One was a `describe` that fed `OutputBuffer` the cases of finding 1 and of the points above. The other was a read of the page's visibility and timers, and a count of the presses of "Paste", inside `pasteOnceBack`. The first run printed none of the probe's lines, because vitest shows no console output of a case that passed. The second run, of the probe file alone, wrote them to a file in the round's scratch directory. That makes two starts of the app. The probe file was deleted after the second run, and `git status` was clean.

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_round5_probe.test.ts test/daemon.test.ts` | Exit 0: 2 files and 144 cases passed, the 25 cases of the copy of `terminal-basics.test.ts` among them. No probe line was shown |
| `node scripts/test-in-electron.mjs test/test_tmp_round5_probe.test.ts`, with the probe's lines written to a file | Exit 0: 26 cases passed. The buffer kept `04hrest\r\n` for a sequence split across the clear. It kept nothing for `ESC[?;2004h`, `ESC[?2004;h` and `ESC[?2004:1h`. It kept `ESC[?1.1111111111111111e+24h` for a number of 25 ones, and `ESC[?1000h` for `ESC[?2004h x ESC c y ESC[?1000h`. With a limit of 20, `ESC[?2004h ESC[?1000h` kept and then `abcdefghij` appended, it held `4h ESC[?1000h abcdefghij`. 262,140 characters of `?2026` and `?25` pairs took 6 ms and kept `ESC[?25h ESC[?2026l`. At each return to the stage the page read `visible`, not hidden, focused, with timers of 0 to 9 ms. The first press of "Paste" arrived both times, 232 ms and 246 ms after the read began |
| `git log --format='%h %ad %s' --date=short -S"muted" origin/release/v0.0.1 -- src/renderer/view.ts`, and `git show 02dea83:apps/desktop/src/renderer/work-item-view.ts`, its comment on what a person types | `72e15fc 2026-11-19`; the comment stands at line 418 of the merge base |
| `gh issue view 24 --json title,state,milestone` | Open, "test: nobody has worked through milestone 1 in the built app by hand", milestone "release: 0.0.1" |
| `python3 skills/code-review/scripts/chain_check.py --baseline 02dea83 --root <the worktree> --worktree`, after the record was written | Exit 0. It names this round's four findings as open, since they have no close block yet. It names the gate record and the guarantee as not yet written. It printed no notice at `frame/design.md` |
