# Review round 6: 1795158088-terminal-basics

```seal
target: 1398972, fixes 43eaa87..1398972
```

This verifying round reads the range `43eaa87..1398972`. It holds the orchestrator's correction of `pr.md` (`6f8cf13`), which answers round 5's findings 2 and 3. It holds fix pass 5, `aa36414` to `e8286e0`, which answers findings 1 and 4, and its close blocks at `fff9bff`. It ends with the orchestrator's fold of *Scope* item 17, scenario 22 and the third failure scenario of `frame/plan.md` (`1398972`). The base is `origin/release/v0.0.1` at `02dea83`, which is also the branch's merge base with it. `OPEN_SEQUENCE` and the new body of `OutputBuffer.clear` are new units nobody had reviewed, so they were reviewed as code, against xterm 6.0.0's parser. The rest of the code review stays inside the fix diff.

The records read whole at `1398972`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, and `trail/rounds/round-5.md`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. The phase records were not opened again: no unit they describe changed in the range.

Facts carried from round 5 and not established again: the daemon replays `OutputBuffer.text()` as it stands; a pane that comes onto the stage is drawn from the replay alone, into a terminal that was reset. Facts re-read at `1398972`: xterm 6.0.0's `clear` moves the buffer's lines and leaves the parser as it was (`apps/desktop/node_modules/@xterm/xterm/src/browser/CoreBrowserTerminal.ts:1239-1258`), and "Clear Screen" calls it (`apps/desktop/src/renderer/work-item-view.ts:339-341`). No file under `apps/desktop/src/renderer` or `apps/desktop/src/main` changed after `3534634` (executed: `git diff --stat 3534634..HEAD` over both).

The axes walked were the table's ten and two of this change's own. The first is what the replay draws after "Clear Screen" against what the window's terminal draws, for every state xterm's parser can be in when the output stops. The second is what the kept part does at the buffer's size limit.

The method for the first axis: xterm's transition table (`apps/desktop/node_modules/@xterm/xterm/src/common/parser/EscapeSequenceParser.ts:99-196`) was taken apart state by state. For each state other than the ground state, the bytes that hold the parser there and the bytes that end it were set beside the pattern's three branches. A tail that starts at the last escape always leads a parser from the ground state into the state the window's parser holds, because an escape takes every state to the escape state with its parameters cleared, an OSC and a DCS string included (`:105`, `:129` with `:782`). So the question for each state is only whether the pattern keeps that tail, and whether it keeps more. Each case was then run through a real xterm 6.0.0 `Terminal`, the window's (`write`, `clear`, `write`) beside a fresh one fed the buffer's text (`## Probes`).

## Findings

### 1. "Clear Screen" after an OSC string that a code from U+0080 to U+009F ended keeps that string and the lines printed after it, so the replay draws text the window cleared

```seal
severity: should
location: `apps/desktop/src/daemon/buffer.ts:8-9`, `apps/desktop/test/daemon.test.ts:1989-1996`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round6_probe.test.ts test/daemon.test.ts` (`## Probes`), and `grep -n 'u001a' apps/desktop/test/daemon.test.ts`, which found no line; read `apps/desktop/node_modules/@xterm/xterm/src/common/parser/EscapeSequenceParser.ts:101-109`, `:129`, `:769`
regression: round-5#1
```

Why it matters: the pattern's OSC branch keeps everything after `ESC ]` up to the end of the text, unless a bell, a cancel (`18`, `1a`) or an escape stands in it. xterm's parser ends an OSC string at more codes than these. Its line 129 lists five, `[0x9c, 0x1b, 0x18, 0x1a, 0x07]`, and `9c` is the 8-bit string terminator. Lines 101 to 109 add, for every state, that each code from `80` to `9f` leaves the string. Most of them execute and return to the ground state. `9b` opens a CSI, `9d` an OSC and `90` a DCS. The loop that collects an OSC string stops at each of them too (`:769`). Where the output holds such a code inside an OSC string, the window prints what follows it, and the pattern reads all of it as one open string.

The probe ran it. After `a line\r\n`, `ESC]0;t`, U+009C, and `visible\r\n`, a clear with the modes kept left `ESC]0;t` U+009C `visible\r\n` in the buffer. After `next\r\n`, the window's terminal showed `next` alone, and a fresh terminal drawn from the buffer showed `visible` and `next`. With U+0085 in place of U+009C, the replay showed an empty line, `visible` and `next`. Round 5's finding was about a replay that drew a sequence's rest as text. This one is the other direction: the replay draws a line the person cleared. It takes a program that writes these codes in UTF-8 (`c2 80` to `c2 9f`), such as a string ended by the 8-bit terminator, so it is rare.

The fix pass's close says xterm's parser was read at line 129, and that the pattern "stops an OSC string at each of the four". That line holds five codes, and lines 101 to 109 hold the rest. The pattern came from the frame's sentence on an OSC string "with no end", and the read of the codes that end one stopped short.

The same group holds no case with `1a`, though the comment and the close name it. A pattern without `\u001a` keeps an OSC string a `1a` ended and the text after it, and no case goes red (executed: the search found no `\u001a` in the file). The pass's close says nine mutants of the pattern went red. A mutant without `\u001a` would not have, so it was not among them. The probe saw HEAD drop such a string correctly.

`apps/desktop/src/daemon/buffer.ts`, lines 8 and 9:

```ts
// The sequence the output stops inside, where it stops inside one: an escape alone or with its intermediate characters, a CSI sequence with no final character yet, or an OSC string with no end yet. A bell, a cancel (`18`, `1a`), an escape and each code from `80` to `9f` end an OSC string, as xterm's parser reads them. Its rest arrives later, and a terminal that was cleared and not reset reads that rest as the sequence's.
const OPEN_SEQUENCE = /\u001b(?:[ -/]*|\[[0-?]*[ -/]*|\][^\u0007\u0018\u001a\u001b\u0080-\u009f]*)$/;
```

`apps/desktop/test/daemon.test.ts`, the case at lines 1989 to 1996, with its name and three more lines. The lines with `9c` and `85` are red at `1398972`, where the buffer keeps the string and `one\r\n`. The line with `1a` is red against a pattern without `\u001a`.

```ts
  it("keeps no sequence that ended before its output stopped: an OSC string ended by a bell, by its terminator, by a cancel or by a code from 80 to 9f, and a CSI sequence with its final character", () => {
    expect(modesOf("\u001b]0;a title\u0007")).toBe("");
    expect(modesOf("\u001b]0;a title\u0007one")).toBe("");
    expect(modesOf("\u001b]0;a title\u001b\\one")).toBe("");
    expect(modesOf("\u001b]0;a ti\u0018one")).toBe("");
    expect(modesOf("\u001b]0;a ti\u001aone")).toBe("");
    expect(modesOf("\u001b]0;a title\u009cone\r\n")).toBe("");
    expect(modesOf("\u001b]0;a ti\u0085one\r\n")).toBe("");
    expect(modesOf("\u001b[1m")).toBe("");
    expect(modesOf("\u001b(B")).toBe("");
  });
```

Scenario 22 says "a sequence that has ended, such as an OSC string closed by BEL, `ESC \` or a cancel, is not kept". That sentence gives examples and still holds, so the snippet leaves it.

### 2. The frame, two comments and `gaps.md` say the clear keeps every CSI sequence the output stopped inside, and list two kinds of sequence it drops, where it drops five

```seal
severity: should
location: `seal/threads/1795158088-terminal-basics/frame/design.md:137`, `seal/threads/1795158088-terminal-basics/frame/plan.md:46`, `seal/threads/1795158088-terminal-basics/gaps.md:42`, `apps/desktop/src/daemon/buffer.ts:82-84`, `apps/desktop/src/shared/protocol.ts:156`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round6_probe.test.ts test/daemon.test.ts` (`## Probes`); read `apps/desktop/node_modules/@xterm/xterm/src/common/parser/EscapeSequenceParser.ts:101-109`, `:112-124`, `:140-152`
regression: round-5#1
```

Why it matters: these sentences tell the next party which unfinished sequences a cleared pane gets back, and where a replay will still draw stray characters. Round 5's finding named the class: any sequence the output stops inside. The fix pass covered three shapes and wrote down two kinds it does not cover. The table, taken state by state, gives five kinds the pattern drops while the window's parser waits for the rest:

- a DCS, SOS, PM or APC string (`ESC P`, `ESC X`, `ESC ^`, `ESC _`), which the records name;
- a CSI with a control character inside it, which the records name, and a CSI with `7f` inside it, which xterm ignores without leaving the sequence (`:116-122`). The probe: `ESC[3`, `7f`, then `1mred` drew `red` in the window and `1mred` in the replay;
- an escape, or an escape with intermediate characters, followed by a control character or `7f`, which xterm executes or ignores without leaving the sequence (`:113-114`, `:123-124`). This is no CSI, so the records' words do not cover it. The probe: `ESC`, `\r`, then `[1mbold` drew `bold` in the window and `[1mbold` in the replay;
- a CSI whose parameter character follows an intermediate character, which xterm reads to its final character and then ignores (`:150`, `:147`). The probe: `ESC[ 1`, then `qtext` drew `text` in the window and `qtext` in the replay;
- a sequence opened by an 8-bit code, `9b`, `9d`, `90`, `98`, `9e` or `9f` (`:106-109`). The probe: U+009B, `3`, then `1mred` drew `red` in the window and `1mred` in the replay.

So `frame/design.md:137`, which says the daemon keeps "a CSI with no final character", is contradicted by the second and fourth kinds. `frame/plan.md:46` says the daemon keeps "a sequence the output stops inside, and nothing else", and names only the first two kinds as exceptions. `gaps.md:42` names the same two. `buffer.ts:82-84` says "Where the output stops inside a sequence, that unfinished sequence is kept", and `protocol.ts:156` says the same of "an escape sequence": both are contradicted by all five. The fix pass's list is a sample handed back as the whole list, and the method that makes it whole is the table taken state by state. Each of the five is rarer than the shapes the pattern keeps. That is why the fix states them as limits and does not widen the pattern: keeping a control character would have the replay execute it a second time.

The fix rewrites each statement by what the pattern keeps, and names every other kind as dropped. The fix pass owes the two comments and `gaps.md`. The orchestrator owes the two frame sentences.

`frame/design.md:137`, *Scope* item 17, the list after "as the window's terminal completes it:":

```md
an escape alone or followed only by intermediate characters (`20` to `2f`), a CSI that holds only parameter characters (`30` to `3f`) followed only by intermediate characters, and an OSC string that holds none of the codes that end one. The daemon keeps no other unfinished sequence, and `frame/plan.md` *The failure scenarios of what the fold adds* names what that leaves.
```

`frame/plan.md:46`, the sentence that opens "A DCS, APC, PM or SOS string":

```md
Every other sequence the output stops inside is not kept, and what follows it is drawn as text where the window's terminal completes it. By xterm 6.0.0's parser, taken state by state, these are a DCS, APC, PM or SOS string (`ESC P`, `ESC _`, `ESC ^`, `ESC X`); an escape, its intermediate characters or a CSI followed by a control character or by `7f`; a CSI whose parameter character follows an intermediate character; and a sequence opened by one of the 8-bit codes `90`, `98`, `9b`, `9d`, `9e` and `9f`.
```

`gaps.md:42`:

```md
- **Some sequences a pane's output stops inside at "Clear Screen" are not kept.** `buffer.ts#clear` keeps an escape alone or with its intermediate characters, a CSI with only parameter and intermediate characters, and an OSC string with no end, which review round 5 finding 1 asked for. Every other unfinished sequence is dropped, and the next replay prints its rest as text where the window's terminal completes it. Review round 6 listed them from xterm 6.0.0's parser, state by state: a DCS, APC, PM or SOS string; an escape, its intermediate characters or a CSI followed by a control character or by `7f`; a CSI whose parameter character follows an intermediate character; and a sequence opened by an 8-bit code. `frame/plan.md`, in the third of the failure scenarios of what the fold adds, holds the same list.
```

`apps/desktop/src/daemon/buffer.ts:82-84`:

```ts
   * emptying with `keepModes` reads them as it reads output. Where the output
   * stops inside a sequence `OPEN_SEQUENCE` reads, that unfinished sequence is
   * kept after them, so the rest the program prints next completes it.
```

`apps/desktop/src/shared/protocol.ts:156`, the sentence on the unfinished sequence:

```ts
Where the kept output stopped inside an escape, a CSI sequence or an OSC string, that unfinished sequence follows the modes, so what the session prints next completes it.
```

### 3. `gaps.md:24` still names as its answerer the verifying round after round 4, which answered it

```seal
severity: should
location: `seal/threads/1795158088-terminal-basics/gaps.md:24`
evidence: executed `git diff --stat 3534634..HEAD -- apps/desktop/src/renderer apps/desktop/src/main`, which printed nothing; read `seal/threads/1795158088-terminal-basics/trail/rounds/round-5.md:154`, `apps/desktop/src/renderer/renderer.ts:175-179`, `apps/desktop/src/renderer/work-item-view.ts:305-311`, `:529-535`, `:545-550`, `:735-741`
```

Why it matters: a row of *Not verified* tells the sealer what nobody has answered and who answers it. Row 24 asks whether a pane's menu closes where a click on a notification brings another work item's view in front, and it names "the verifying round after the fix pass of review round 4" as the answerer. Round 5 was that round, and its confirmation of round 4's finding 1 says the reading answers this row. No later commit marked the row `closed`. The path was read again at `1398972`, where none of its files had changed. `onNotificationClick` calls `openView` (`renderer.ts:175-179`), and `enterView` unsets `front` (`work-item-view.ts:740`). `stageShows` calls `giveBack` for every screen whose pane leaves the stage (`:550`), and `giveBack` closes that pane's menu without giving the keyboard (`:532`, `closeMenu` at `:305-311`). The row is answered and can be marked closed, in the form of rows 27 and 28. Round 5's `## Not judged` row on the built app stays with the owner, as that record says.

`seal/threads/1795158088-terminal-basics/gaps.md`, line 24:

```md
| closed That a pane's menu closes where a click on a notification puts another work item's view in front while it is open. `work-item-view.ts#giveBack` closes the menu of a pane that leaves the stage, and it is the one function that takes a screen from a pane, so the click's path through `stageShows` reaches it. The case closes the menu's pane from a second client of the daemon, which reaches `giveBack` through `dropClosed`. No case clicks a notification with a menu open: `frame/plan.md` *Technical context* lets no case raise one | Read by review rounds 5 and 6, at `3534634` and `1398972`: `onNotificationClick` calls `openView` (`renderer.ts:175-179`), `enterView` unsets `front` (`work-item-view.ts:740`), `stageShows` calls `giveBack` for each screen whose pane leaves (`:550`), and `giveBack` calls `closeMenu(false)` for that pane's menu (`:532`). `trail/rounds/round-5.md` *Confirmations* holds the reading. No case runs it |
```

## Confirmations

```seal
confirms: round-5#1
```
What holds: for the case round 5 named and for each shape the pattern keeps, the replay now draws what the window draws after "Clear Screen". The probe ran each through a real xterm 6.0.0 terminal and both screens matched. The cases were `ESC[?20` then `04hrest`, a lone escape then `[31mred`, `ESC(` then `0qq`, `ESC[2 ` (a CSI that ends with an intermediate character) then `qtext`, `ESC[38;5;1` then `mred`, and `ESC]0;a ti` then `tle`, a bell and `after` (executed, `## Probes`). A lone escape matches the pattern's first branch with no intermediate character. A CSI that ends with intermediate characters matches the second branch, and xterm waits in its intermediate state there (`EscapeSequenceParser.ts:148-152`). `clear` reads no text where the modes are not kept, so it keeps nothing, and the new case's last three lines hold that (`daemon.test.ts:1967-1978`). The kept modes and the kept tail cannot overlap: a mode sequence ends in `h` or `l`, which no branch of the pattern takes. The new cases passed with the file's others: 124 cases, and the probe's one (executed). Findings 1 and 2 are about the pattern's edges, not about the cases round 5 named.

```seal
confirms: round-5#2
```
What holds: `pr.md:14` reads "Command with ← and → did nothing, and Command+⌫ deleted one character", which is round 5's sentence in other words (read). The row of round 5's `## Not judged` on Electron's default menu still stands under it, and is carried below.

```seal
confirms: round-5#3
```
What holds: each row of `gaps.md` *Not verified* that names the owner's hand run, 8, 10, 11, 12, 16, 20, 21 and 26, was taken apart into the things it asks, and each thing was found in `pr.md:29-33` (read). Cmd+W and Cmd+V pressed by a person stand at line 30, and Shift+Command+W at line 29. The drag from Finder, the screenshot's drag, Shift+Enter and the dropped image's escaped path in Claude Code, and the click with the Control key, stand at line 30. The browser, Finder and the system clipboard stand at line 31. Command with the left arrow, the right arrow and Backspace, in bash and in Claude Code, stand at line 32. The key typed right after a tab change stands at line 33. "Through the system menu" is gone. No row the range added to *Not verified* names the hand run.

```seal
confirms: round-5#4
```
What holds: `gaps.md:25` is round 5's paste-ready row, character for character (executed: a comparison of `round-5.md:141` with `gaps.md:25` printed `True`). The row's answerer is unchanged. Finding 3 is about row 24, not this one.

What matched: `6f8cf13` rewrites `pr.md:12` to "A right click offered no terminal action". That holds whether or not Chromium drew a menu of its own before this change, so round 5's `## Not judged` row on `pr.md:12` against `frame/design.md:272` no longer has a contradiction in `pr.md`. Whether `frame/design.md:272` is right stays a recollection, and that sentence is the frame's, outside the range.

What matched: the fold at `1398972`, against what HEAD does. *Scope* item 17's new sentences say the unfinished sequence follows the modes and that the pane's next output completes it, which `clear` does (`buffer.ts:86-91`). "Where the output held no mode sequence and ends inside none, nothing is kept" holds. Finding 2 is about the list that closes the first new sentence. Scenario 22's two new clauses each have a case: the split `ESC[?20` at `daemon.test.ts:1967-1978`, and the ended sequences at `:1989-1996`. *Data & interfaces* (`frame/design.md:234`) cites the sequences item 17 states, so it needed no fold. `frame/plan.md:46` adds "a sequence the output stops inside", and the kinds it names as dropped are dropped; finding 2 is about the kinds it leaves out.

What matched: the comment at `protocol.ts:156` and the comment on `clear` say what the code does for the shapes the pattern keeps. Finding 2 is about the shapes they claim beyond those.

What matched: the new cases against their group, `describe("OutputBuffer")`. The first new case is the only one that holds a sequence split across the clear: the group's first case holds one split across two appends. Each row of the `it.each` holds one branch of the pattern, and the case of ended sequences holds what each branch must not take. Finding 1 names the one end code no row holds.

Two things were weighed and opened no finding. First, the kept part at the buffer's size limit. Where the kept part and the next output fit, the replay matched the window (probe, a limit of 64). Where they do not fit, the next append cuts the kept OSC string by count and then drops the line's rest through the first line break. The probe's replay was then empty where the window showed `tail`. The buffer before fix pass 5 would have drawn twenty `A` and `tail`, which is wrong too. Both are the cut by count that the buffer's own comment states and that `frame/plan.md:94` names for every replay. At 262,144 characters it takes an OSC string of about that length arriving when the person presses "Clear Screen". Second, *Scope* item 17's words "an escape with only intermediate characters after it" leave open whether a lone escape is among them. The code keeps it, and finding 2's sentence for item 17 names it.

The suite's label is honest. `gaps.md:7` names the suite, the typecheck and the `Broad gate` command as the orchestrator's, and says fix pass 5 ran `test/daemon.test.ts` by itself at `564103f` and started no app. This round ran that file and a probe, and none of the three. Once the three findings are closed, what comes due is a verifying round over that fix pass. The orchestrator's broad run and the sealer's spawn come after the last round.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether Electron 45.3.3's default menu bound Command+Backspace, which the sentence at `pr.md:14` rests on. Carried from round 5: the framer's probe named no such item, and that its "Delete" carries no key is a recollection nobody opened | `seal/threads/1795158088-terminal-basics/frame/design.md:29`, `seal/threads/1795158088-terminal-basics/pr.md:14` | The orchestrator, by the framer's `probe-output.txt` or Electron's role list |
| What a click on a notification does with a pane's menu open, in the built app. Read in rounds 5 and 6, never run, since no probe may raise a notification | `apps/desktop/src/renderer/renderer.ts:175-179` | The owner's hand run of #24, if the owner wants it run |
| The suite, the typecheck and the broad gate at the head of the branch | `seal/threads/1795158088-terminal-basics/gaps.md:7` | The orchestrator, in the broad run after the review rounds settle |

## Probes

The probe file was `apps/desktop/test/test_tmp_round6_probe.test.ts`, in the branch's worktree. It fed `OutputBuffer` a text, cleared it with the modes kept, and appended the rest. It wrote the text into an xterm 6.0.0 `Terminal`, called `clear`, and wrote the rest. It wrote the buffer's text into a second, fresh `Terminal`. It then compared the lines of the two. It wrote what it saw to a file in the round's scratch directory. It started no app. The file was deleted after the run, and `git status` was clean.

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_round6_probe.test.ts test/daemon.test.ts`, in `apps/desktop` | Exit 0: 2 files and 125 cases passed, 124 of `daemon.test.ts`. The window and the replay drew the same lines for `ESC[?20`, a lone escape, `ESC(`, `ESC[2 `, `ESC[38;5;1`, `ESC]0;a ti`, and an OSC string a `1a` ended. They differed for an OSC string that U+009C or U+0085 ended, where the buffer kept the string and `visible\r\n` and the replay drew `visible`. They differed for `ESC[ 1`, an escape then `\r`, `ESC[3` then `7f`, U+009B then `3`, and `ESC P1$`: the buffer kept nothing and the replay drew `qtext`, `[1mbold`, `1mred`, `1mred` and `qmafter`. With a limit of 64, a kept OSC string of 54 characters and 27 more drew nothing in the replay and `tail` in the window. A kept string of 24 characters and 11 more drew `tail` in both |
| `grep -n 'u001a' apps/desktop/test/daemon.test.ts` | No line |
| `git diff --stat 3534634..HEAD -- apps/desktop/src/renderer apps/desktop/src/main` | No output |
| A comparison of `round-5.md:141` with `gaps.md:25` | `True` |
| `python3 skills/code-review/scripts/chain_check.py --baseline 02dea83 --root <the worktree> --worktree`, after the record was written | Exit 0. It names this round's three findings as open, since they have no close block yet. It names the gate record and the guarantee as not yet written. It printed no notice at `frame/design.md` |
