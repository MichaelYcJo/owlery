# Design: the pane menu cases wait on what they read

Issue #168. Both cases are in `apps/desktop/test/terminal-basics.test.ts`. This design calls the case at line 942 the menu-open case and the case at line 1091 the menu-close case.

## Grounding

The tree as read at `f7bbcd7a`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Memory design*, the first row of its rules table: terminal screens are created only for as many panes as are visible, and are reused | A pane that comes back onto the stage takes a screen another pane emptied. Giving each pane a terminal of its own is not open to this work |
| `docs/architecture.md` *Memory design*: "the window draws a pane from that replay each time the pane comes back on screen" | The replay is the one source of a returned pane's screen and of the modes its program set. The policy says nothing of what the window sends the pane before the replay is drawn, so this design decides it and states it in `## Rule changes` |
| `docs/architecture.md` *Screen framework: Electron*, the rule whose check line names `apps/desktop/test/terminal-basics.test.ts` | The file is a check target of a policy rule. Its cases keep reading the built app as a person meets it, and none of them is removed |
| `docs/roadmap.md` *Releases and the tracker*: "The first of those pull requests moves the version." | The orchestrator's spawn says this pull request merges first into `release/v0.0.4`, so it carries the move to 0.0.4 |
| `docs/roadmap.md` *Releases and the tracker*: the release's pull request closes the release's issues | This work's pull request does not close issue #168, so the issue can hold the count of runs its third *Done when* line asks for |

What the reading and the probe found, each with its label.

| Fact | Coordinate | Label |
|---|---|---|
| Both recorded failures stop at the same two lines: `test/terminal-basics.test.ts:1070:35` with `expected 'from the clipboard' to be '\u001b[200~from the clipboard…'`, and `test/terminal-basics.test.ts:1097:5` with "the window never showed one tab" | `gh run view 45117841721 --attempt 1 --log-failed` (pull request #167 at `2a2adf38`) and `gh run view 45431101334 --attempt 5 --log-failed` (pull request #197 at `71bc7c6`) | executed |
| Line 1070 is `expect(await pasteOnceBack()).toBe(inBrackets)`, the first paste after "Clear Screen" and after the pane left the stage and came back. It is the same line at both failing commits and at `f7bbcd7a` | `git show 2a2adf38:apps/desktop/test/terminal-basics.test.ts`, `git show 71bc7c6:apps/desktop/test/terminal-basics.test.ts`, and the file at `f7bbcd7a` | executed |
| The pastes at lines 1039 and 1066 arrived in brackets in both failing runs, since the case reached line 1070. So the shell had turned bracketed paste on, and the cause the issue guessed is not the cause | the same two logs, and the file's lines 1034 to 1070 | read |
| A pane that leaves the stage has its screen reset: `giveBack` hands the terminal `ESC c`. The next pane's `take` hands it an empty piece, and once the terminal has drawn that piece `receiver()` answers with the pane. The replay comes later, from the daemon. Between those two moments the screen sends, and the terminal holds no mode | `apps/desktop/src/renderer/view.ts#screenTurns`; `apps/desktop/src/renderer/work-item-view.ts#take`, `#giveBack` and `#write`; `apps/desktop/src/daemon/daemon.ts:1377` to `1385` | read |
| A full reset ends bracketed paste, and `paste` wraps a text in brackets by the terminal's mode at the moment of the call | `@xterm/xterm` 6.0.0, the version `apps/desktop/package.json` pins: `src/common/services/CoreService.ts` (`reset`) and `src/browser/Clipboard.ts` (`paste`) | read |
| The menu's "Paste" calls `term.paste` as soon as the main process answers with the clipboard's text, whatever the screen awaits | `apps/desktop/src/renderer/work-item-view.ts:441` to `448` | read |
| After "Clear Screen" the daemon's replay of the pane is the mode sequence alone, so nothing a case can read in the page shows that the replay is drawn | `apps/desktop/src/daemon/buffer.ts#OutputBuffer` (`clear`) and `apps/desktop/src/renderer/work-item-view.ts:457` to `459` | read |
| With every replay leaving the daemon 1,500 ms late, a "Paste" pressed 132 ms, 435 ms and 939 ms after the click on the pane's tab handed the pane's process `from the clipboard` with no brackets. A "Paste" pressed 24 ms after the click handed it nothing. A "Paste" pressed after the late replay had arrived handed it the text in brackets, each time. A "Paste" into the pane while it had been on the stage for seconds, before and after "Clear Screen", arrived in brackets | Probe `test_tmp_replay_race.test.ts`, in a `git clone --no-local` of this branch at `f7bbcd7a` under the framer's scratch directory. The clone's `src/daemon/daemon.ts` sent the replay of an `attach` from a timer of `OWLERY_TMP_REPLAY_DELAY` ms, an edit nothing commits. Command, from the clone's `apps/desktop`: `OWLERY_BACKGROUND=1 OWLERY_TMP_REPLAY_DELAY=1500 node scripts/test-in-electron.mjs test/test_tmp_replay_race.test.ts` | executed |
| The paste at 24 ms handed nothing because the terminal had not yet drawn the empty piece of the pane's turn | `apps/desktop/src/renderer/view.ts#screenTurns` (`receiver`) | read |
| A unit case pins today's rule that a screen sends once the terminal has reached the pane's turn, with no replay handed yet: "sends what a person types and what the terminal answers to the pane on the screen, and nothing from a free screen" | `apps/desktop/test/view.test.ts`, the `screenTurns` block that opens at line 2491 | read |
| The comment of `pasteOnceBack` says a screen sends nothing until its terminal has drawn the replay. The code does not hold that for the span between the terminal reaching the turn and the replay's arrival | `apps/desktop/test/terminal-basics.test.ts:1048` | read |
| The menu-open case closes the pane it opened only at its last step, "Close Pane". It failed at line 1070 in both runs, so that pane stayed. The menu-close case then opened one more pane, closed it, and waited 15 seconds for one tab while two stood. Its recorded times are 15,242 ms and 15,221 ms | lines 1084 to 1086 and 1091 to 1097 of the file, and the two logs | read |
| The file's cases share one start of the app and run in order. Other cases wait for "one tab" after they close a pane they opened, and other cases press "Side by side" | the file's head comment; `git grep -n '"one tab"' -- apps/desktop/test/terminal-basics.test.ts` and `git grep -n 'side-by-side' -- apps/desktop/test/terminal-basics.test.ts` at `f7bbcd7a` | executed |
| No screen stays without a replay: the daemon answers every `attach` of a session it holds, the window takes back the screen of a pane the daemon no longer lists, and a closed socket reloads the page | `apps/desktop/src/daemon/daemon.ts:1377` to `1385`; `apps/desktop/src/renderer/work-item-view.ts#dropClosed`; `apps/desktop/src/renderer/renderer.ts:1981` | read |
| A reload of the page empties the window's note of the panes it drew, so each pane's next replay is a first one | `apps/desktop/src/renderer/work-item-view.ts:96` | read |
| The app's version stands on line 3 of `apps/desktop/package.json`, and the build reads it from there alone | `git grep -n '"version"' -- apps/desktop/package.json` at `f7bbcd7a` prints `apps/desktop/package.json:3:  "version": "0.0.3",`; `apps/desktop/build.mjs:8` to `9` | executed, and read |
| The move to 0.0.3 changed that line and no other file for the version. Its work item's changelog fragment ends with the bullet "The desktop app's version is 0.0.3." The hash `3a3c1f0` the spawn offers is not in this repository | `git show 09ff5ad0 --stat`, `git show 09ff5ad0 -- apps/desktop/package.json`, `git show 09ff5ad0:seal/threads/1795497941-night-watch-marks-as-moons/changelog.md` | executed |
| The issue holds a comment of 2026-11-24 that moves it to release 0.0.4, and a comment that records the failure of run 45431101334, attempt 5. Neither changes what the issue asks | `gh issue view 168 --json body,comments` | executed |
| The issue's body holds rows the settle of release 0.0.2 carried there. They name other cases and other questions. The issue says its *Done when* is unchanged by them | the same command | executed |
| The release's other open work items named by the spawn hold a `routing.md` and no frame on their branches | `git ls-tree -r --name-only <branch> -- seal/threads` for the branches of issues #149, #154, #191, #134 and #32 | executed |
| The latest GitHub Release, `v0.0.3`, holds no `### Process changes` heading. `seal/follow-up.md` does not exist. `seal/threads/` holds this work item alone | `gh release view --json tagName,body`; `ls seal seal/threads` | executed |

## Scope

In:

1. **A screen sends a returned pane nothing until its replay is drawn.** A pane that this window drew before since the page loaded, and that takes a screen again, is sent nothing from the moment it takes the screen until the terminal has drawn the replay the window writes into that screen for that turn. That covers what a person types, what a person pastes, and what the terminal answers. `apps/desktop/src/renderer/view.ts#screenTurns` holds the rule, and `apps/desktop/src/renderer/work-item-view.ts#take` tells it whether the window drew the pane before. A pane the window draws for the first time since the page loaded is sent what it is sent today.
2. **Unit cases pin item 1** in the `screenTurns` block of `apps/desktop/test/view.test.ts`. A key typed after the terminal reached the returned pane's turn and before its replay is handed goes to nobody, and a key typed once the replay is drawn goes to the pane. A returned pane that leaves the screen before its replay came leaves no silence behind: the next pane, drawn for the first time, receives keys as a first pane does today. The existing cases of the block stay as they are.
3. **The comments say the rule.** The comments of `screenTurns`, of `ScreenTurns` and of `work-item-view.ts#write` are rewritten in place to state item 1.
4. **`pasteOnceBack` waits by time.** It presses "Paste" again while the pane's process was handed nothing, until 15 seconds have passed, the bound `BuiltApp.until` uses. Its comment states the rule as item 1 makes it true.
5. **The menu-open case waits for the replay before it reads the screen.** After the click on the second pane's tab at line 995, and before "Select All" and "Copy" read what the pane printed, the case waits until the link on the pane's first row is drawn again.
6. **A case of the file leaves the next case the panes it found.** After each case, every pane that `openPane` opened in that case and that the daemon still holds is closed, and "Side by side" is off again. A case that passes closes its panes itself, as today, so the step then closes nothing.
7. **The version moves to 0.0.4.** Line 3 of `apps/desktop/package.json` names it.
8. **The changelog fragment.** The work item's `changelog.md` says what item 1 changes for a person, and its last bullet says "The desktop app's version is 0.0.4."

Out:

- **A pane's first replay in a window.** A pane the window draws for the first time since the page loaded, a pane a person just opened among them, still receives keys before its replay arrives and while it is drawn. The terminal's answers to that replay's questions must reach the pane's program, and they leave by the same path as a person's keys, so the screen cannot hold one back and send the other. `frame/plan.md` *Alternatives considered* holds the wider rule and why it was not chosen.
- **The other cases of the file.** They keep their waits for "one tab": item 6 gives them the base they start from. No other case is recorded as failing in the two runs.
- **The rows the settle of release 0.0.2 carried into issue #168.** Each names a mechanism other than this one: the debugging port's round trips at the runner's first start, a click lost when the sidebar is drawn between its press and its release, a case of `apps/desktop/test/daemon.test.ts` that counts inboxes, and the bounds of cases under a heavier load. None of them is built here. `frame/questions.md` rows Q2 and Q3 hold where they go.
- **The count of runs on the hosted runner.** The issue's third *Done when* line is counted after the pull request opens. `frame/questions.md` row Q1 holds it.
- **The daemon.** No message of the protocol changes, and the daemon answers an `attach` as it does today.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A returned pane is sent nothing before its replay is drawn | Given a pane the window drew before takes a screen again, and the terminal has reached the pane's turn. When a person types a key before the replay is handed to the terminal. Then the key goes to nobody. When the terminal has drawn the replay and the person types again. Then that key goes to the pane | The unit cases of *Scope* item 2, run with `node scripts/test-in-electron.mjs test/view.test.ts` from `apps/desktop`. Each new case is shown red against `screenTurns` as it stands at `f7bbcd7a` |
| 2. The menu-open case passes where the replay is late | Given the daemon sends each replay 1,500 ms late, by the uncommitted edit of `daemon.ts`'s `attach` that the probe of *Grounding* describes. When the menu-open case runs. Then it passes. At `f7bbcd7a` with the same edit it fails at line 1070 with `from the clipboard` | `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/terminal-basics.test.ts -t "pane's menu"` from `apps/desktop`, once at `f7bbcd7a` with the edit and once after *Scope* items 1, 4 and 5 with the edit. The edit is reverted before any commit |
| 3. The menu-close case passes after a menu-open case that failed | Given the menu-open case throws at line 1070, by an uncommitted `throw` placed there. When the menu-close case runs after it. Then the menu-close case passes. Given the `throw` stands instead after the line that waits for two panes side by side. Then the menu-close case passes as well. At `f7bbcd7a` with the `throw` at line 1070 the menu-close case fails with "the window never showed one tab" | The same command as scenario 2, without the daemon's edit: once at `f7bbcd7a` with the `throw` at line 1070, and once for each place of the `throw` after *Scope* item 6. The `throw` is removed before any commit |
| 4. The file's cases pass as they stand | Given the built tree with no uncommitted edit. When the whole file runs. Then every case passes | `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/terminal-basics.test.ts` from `apps/desktop` |
| 5. The version is 0.0.4 | Given the built tree. Then `apps/desktop/package.json` names 0.0.4 | `git grep -n '"version"' -- apps/desktop/package.json` prints line 3 with `0.0.4`. At `f7bbcd7a` it prints that line with `0.0.3` |
| 6. The hosted runner passes both cases on its first attempt, three runs in a row | Given the pull request is open into `release/v0.0.4`. When the `check` job runs. Then both cases pass on attempt 1 in three consecutive runs | Outside the chain before the pull request opens. `frame/questions.md` row Q1 |

## Data & interfaces

- `apps/desktop/src/renderer/view.ts`: `ScreenTurns.take` takes, beside the pane, whether the window drew the pane before. `receiver()` answers with nothing while the screen's turn belongs to such a pane and the terminal has not drawn the replay written in that turn. The silence belongs to the turn: `giveBack` and the next `take` end it.
- `apps/desktop/src/renderer/work-item-view.ts#take` hands `screenTurns` what its note of drawn panes, `replayed`, says of the pane at that moment. `write` hands a later replay to the screen as it does today.
- No message of `apps/desktop/src/shared/protocol.ts` changes. No environment variable, no setting and no file of the run folder is added.
- `apps/desktop/test/terminal-basics.test.ts`: `openPane` notes each pane it opened, and a step after each case closes the noted panes the daemon still holds and puts "Side by side" off.

## Rule changes

- add
  file: docs/architecture.md
  section: Memory design
  to: **A pane that comes back onto the stage is sent nothing a person types or pastes there until the window has drawn its replay.** The screen it takes was emptied when the pane before it left. Until the replay is drawn, the terminal holds none of the modes the pane's program set, such as pastes in brackets, and it would encode a paste or a key without them. What a person types in that moment is dropped and not held, since the terminal encodes a key when it is pressed. A pane the window draws for the first time since its page loaded is the exception: the terminal's answers to the questions in that replay must reach the pane's program, and they leave by the same path as a person's keys.
    check: apps/desktop/test/view.test.ts apps/desktop/test/terminal-basics.test.ts
- add
  file: docs/architecture.ko.md
  section: 메모리 설계
  to: **다시 화면에 나온 칸은, 창이 그 칸의 출력을 다시 그리기 전까지 사람이 거기에 입력하거나 붙여넣은 것을 받지 않습니다.** 그 칸이 쓰는 터미널 화면은 앞의 칸이 떠날 때 비워졌습니다. 출력을 다시 그리기 전의 터미널에는 괄호로 감싼 붙여넣기처럼 칸의 프로그램이 켠 모드가 없어서, 붙여넣은 글이나 키를 그 모드 없이 바이트로 바꾸게 됩니다. 그 사이에 입력한 것은 보관하지 않고 버립니다. 터미널은 키가 눌린 때에 그 키를 바이트로 바꾸기 때문입니다. 창이 페이지를 불러온 뒤 처음 그리는 칸은 예외입니다. 그 출력에 든 질문에 터미널이 하는 답이 칸의 프로그램에 닿아야 하고, 그 답은 사람의 키와 같은 길로 나가기 때문입니다.
    check: apps/desktop/test/view.test.ts apps/desktop/test/terminal-basics.test.ts

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The bound of three presses, and the comment's sentence that states it | `apps/desktop/test/terminal-basics.test.ts#pasteOnceBack` | *Scope* item 4 puts the 15 seconds of `BuiltApp.until` in its place. A count of presses is a time the case does not name, about a second for each press |
| The sending of a returned pane's keys, pastes and answers between the terminal reaching the pane's turn and the replay being handed to it | `apps/desktop/src/renderer/view.ts#screenTurns` (`receiver`) | *Scope* item 1. What left in that span was encoded without the modes of the pane's program, which is the defect |

The rule this design adds to `docs/architecture.md` takes no rule out in return, because the policy held no sentence on what a returned pane is sent. The step after each case of *Scope* item 6 takes no step out in return, because each case's own closing of its panes stays: it is what the case asserts.

Framed 2026-11-25 by framer, before the build.
