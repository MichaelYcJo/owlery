# Review round 7: 1795158088-terminal-basics

```seal
target: c107dda, fixes f6bac9b..c107dda
```

This verifying round reads the range `f6bac9b..c107dda`. It holds the orchestrator's fold of round 6's two frame sentences (`807288c`), fix pass 6 (`d8223c5`, `8a90550`, `67d5d70`), the close blocks of round 6 (`07cd761`), and the orchestrator's fold of scenario 22's example (`c107dda`). The base is `origin/release/v0.0.1` at `02dea83`, which is also the branch's merge base with it. The code under review is the one character class the fix pass added to `OPEN_SEQUENCE`, three case rows, the two comments in `buffer.ts` and the comment at `protocol.ts:156`. No new unit came in: `OPEN_SEQUENCE` and `OutputBuffer.clear` were reviewed as code in round 6, so this round reads the change to each and stays inside the fix diff.

The records read whole at `c107dda`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, and `trail/rounds/round-6.md`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. The range changed none of `routing.md`, `frame/questions.md`, `changelog.md` and `pr.md`, and none of their sentences states the unfinished sequences the clear keeps. The phase records were not opened again: no unit they describe changed in the range.

Facts carried from round 6 and not established again: the daemon replays `OutputBuffer.text()` as it stands; a pane that comes onto the stage is drawn from the replay alone, into a terminal that was reset; "Clear Screen" calls xterm's `clear`, which leaves the parser as it was. Facts re-read at `c107dda`: xterm 6.0.0's transition table (`apps/desktop/node_modules/@xterm/xterm/src/common/parser/EscapeSequenceParser.ts:99-135`) and the loop that collects an OSC string (`:766-773`). No file under `apps/desktop/src/renderer` or `apps/desktop/src/main` changed after `3534634` (executed: `git diff --stat 3534634..HEAD` over both printed nothing).

The axes walked were the table's ten and round 6's first own axis: what the replay draws after "Clear Screen" against what the window's terminal draws, now for each code from `80` to `9f` inside an OSC string. The five kinds of unfinished sequence `frame/plan.md:46` names as limits are the orchestrator's decision and were not reopened. The table was taken apart for the OSC string state again, to see whether the narrowed branch leaves a kind that list does not hold. Every code from `80` to `9f` takes that state out (`:101-109`, and `:129` for `9c`). Of those codes, `90`, `98`, `9b`, `9d`, `9e` and `9f` open a new sequence, which is the list's fifth kind. Every other one returns to the ground state. Every other code keeps the parser in the string or ends it at a bell, a cancel or an escape (`:115`, `:127-130`, `:192`), and the pattern reads each of them the same way. So the fix adds no kind outside the list.

## Findings

None. Each finding of round 6 holds closed, and the sentences the range adds say what `c107dda` does.

## Confirmations

```seal
confirms: round-6#1
```
What holds: the pattern's OSC branch at `apps/desktop/src/daemon/buffer.ts:9` now stops at each code from `80` to `9f`. After "Clear Screen" the replay draws what the window draws for an OSC string that U+009C, U+0085 or U+0099 ended. The probe rebuilt round 6's comparison and ran it through a real xterm 6.0.0 `Terminal`. For each of the three, the buffer kept nothing, and the window and the replay both showed `next` alone (executed, `## Probes`). The same probe ran four more cases, to see that the narrowed branch still keeps what it should. An open OSC string that holds a Korean syllable (U+D55C, above `9f`) was kept, and both screens drew `after`. An OSC string that U+009C ended, followed by a new open OSC string, kept the new one, and both drew `next`. An OSC string that U+009C ended, followed by a lone escape, kept the escape, and both drew `red`. Round 6's open OSC string `ESC]0;a ti` was kept, and both drew `after`. The fix pass claimed the case was red at the `9c` row against the old pattern, and each of the three rows red under its own mutant. The run outputs it left in its scratch directory show the failing line of each: `:1995` against the old pattern, `:1994` without `\u001a`, `:1996` with `\u009c` alone in place of the range, and `:1995` with the range cut to `\u0080-\u009b` (read). Reading the pattern against each row gives the same lines. `test/daemon.test.ts` passed at HEAD with its 124 cases (executed).

```seal
confirms: round-6#2
```
What holds: each statement round 6 named now says what the pattern keeps and that the clear drops every other unfinished sequence. `buffer.ts:8` names the three shapes and adds "No other unfinished sequence is read." `buffer.ts:82-85` ties the kept sequence to `OPEN_SEQUENCE` and says "Every other unfinished sequence is dropped." `protocol.ts:156` names the three shapes and says "The daemon keeps no other unfinished sequence." `frame/design.md:137` names the three shapes with their character ranges and points to `frame/plan.md`. `frame/plan.md:46` and `gaps.md:42` each list the five kinds round 6 took from the table (all read at `c107dda`). The fix pass departed from round 6's snippet for `protocol.ts:156`. Its stated reason is that "an escape, a CSI sequence or an OSC string" would claim the CSI kinds the clear drops. That reason holds: the snippet's words would cover a CSI with a control character inside it. The sentence now in place names the CSI shape as *Scope* item 17 does. Each sentence was set beside the pattern and the table. The pattern's second branch, `\[[0-?]*[ -/]*`, is "only parameter characters followed only by intermediate characters". The first, `[ -/]*`, is "an escape alone or with its intermediate characters". The third excludes exactly the codes the comment names. The pass named its own `git grep` as a sample. This round searched the tree outside `trail/` again for `unfinished`, `OSC string`, `stops inside`, `stopped inside`, `a cancel`, `from 80 to 9f` and `no final character` (executed). It found the statements above. It also found the names and rows of `test/daemon.test.ts:1967`, `:1974`, `:1983`, `:1984` and `:1989`, each of which describes the text its case feeds, and the frame's other lines. No statement of the old list remains.

```seal
confirms: round-6#3
```
What holds: `gaps.md:24` is round 6's paste-ready row, character for character (executed: a comparison of the row in `round-6.md` with line 24 of `gaps.md` printed `True`). The row is marked `closed` and names rounds 5 and 6 as its readers. Nothing it cites changed: `git diff --stat 3534634..HEAD` over `apps/desktop/src/renderer` and `apps/desktop/src/main` printed nothing.

What matched: `c107dda`'s scenario 22, at `frame/design.md:193`, against HEAD. Its last clause now reads "a sequence that has ended, such as an OSC string closed by BEL, `ESC \`, a cancel or a code from `80` to `9f`, is not kept". Each example has a row in the case at `test/daemon.test.ts:1989-1999`: the bell at `:1990-1991`, `ESC \` at `:1992`, the two cancels at `:1993-1994`, and the codes `9c` and `85` at `:1995-1996`. Six of the codes from `80` to `9f` end the string and open another sequence at once. The clause still holds for those six: the OSC string ends there and is not kept. The sequence each one opens is the fifth kind of `frame/plan.md:46`, which the clear drops too.

What matched: `807288c`'s two sentences against the code. `frame/design.md:137` says the daemon keeps "an OSC string that holds none of the codes that end one", and the third branch is that. `frame/plan.md:46` names a DCS, APC, PM or SOS string, an escape or CSI followed by a control character or `7f`, a CSI whose parameter character follows an intermediate character, and the 8-bit openers. The pattern takes none of them (read, `buffer.ts:9`, and round 6's probe for each kind, carried). The plan's sentence that "scenario 22's cases hold the private modes and the three kinds of unfinished sequence alone" still holds: the four rows of the `it.each` at `test/daemon.test.ts:1980-1987` are the three shapes, with the escape counted alone and with its intermediate character.

What matched: `gaps.md:7`, the row on the suite. It says fix pass 6 ran `test/daemon.test.ts` by itself at `8a90550` and started no app. It says the pass ran `tsc --noEmit` once on its working tree before `d8223c5`, "which is no run at the head of the branch". The fix pass's narrow output in its scratch directory shows 124 cases passed (read). The row names the orchestrator's broad run as the answerer, so the suite's label is honest. This round ran `test/daemon.test.ts` and a probe, and neither the suite, the typecheck nor the broad gate.

What matched: `gaps.md` *Not done* opens "Nine things were within reach and not taken", and nine bullets stand under it.

The three new case rows were read against their group, `describe("OutputBuffer")`. Each holds one code the pattern's third branch excludes and no other row holds: `1a`, the 8-bit terminator `9c`, and `85` from the rest of the range. Each was shown red under its own mutant. The two 8-bit rows end in `\r\n`, so a kept string would also carry a whole line, which is the defect round 6 named. They hold the clause of scenario 22 that `c107dda` names.

This round leaves nothing open. What comes due is the orchestrator's broad run at the head of the branch, and the sealer's spawn after it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether Electron 45.3.3's default menu bound Command+Backspace, which the sentence at `pr.md:14` rests on. Carried from rounds 5 and 6: the framer's probe named no such item, and that its "Delete" carries no key is a recollection nobody opened | `seal/threads/1795158088-terminal-basics/frame/design.md:29`, `seal/threads/1795158088-terminal-basics/pr.md:14` | The orchestrator, by the framer's `probe-output.txt` or Electron's role list |
| What a click on a notification does with a pane's menu open, in the built app. Read in rounds 5 and 6, never run, since no probe may raise a notification | `apps/desktop/src/renderer/renderer.ts:175-179` | The owner's hand run of #24, if the owner wants it run |
| The suite, the typecheck and the broad gate at the head of the branch | `seal/threads/1795158088-terminal-basics/gaps.md:7` | The orchestrator, in the broad run after the review rounds settle |

## Probes

The probe file was `apps/desktop/test/test_tmp_round7_probe.test.ts`, in the branch's worktree. For each case it fed `OutputBuffer` a text, cleared it with the modes kept, and appended the rest. It wrote the same text into an xterm 6.0.0 `Terminal`, called `clear`, and wrote the rest. It then wrote the buffer's text into a second, fresh `Terminal` and compared the non-empty lines of the two. It wrote what it saw to a file in the round's scratch directory. It started no app. The file was deleted after the run, and `git status --short` printed nothing.

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_round7_probe.test.ts test/daemon.test.ts`, in `apps/desktop` | Exit 0: 2 files and 125 cases passed, 124 of `daemon.test.ts`. The window and the replay drew the same lines in each of seven cases. For an OSC string ended by U+009C, U+0085 or U+0099, the buffer kept nothing and both drew `next`. An open OSC string holding U+D55C was kept and both drew `after`. After a string ended by U+009C, a new open OSC string was kept and both drew `next`, and a lone escape was kept and both drew `red`. `ESC]0;a ti` was kept and both drew `after` |
| `git grep -n -i` over the tree outside `trail/`, for `unfinished`, `OSC string`, `stops inside`, `stopped inside`, `a cancel`, `` 80` to `9f ``, `from 80 to 9f` and `no final character` | The statements named under round-6#2, the case names and rows of `test/daemon.test.ts`, and one unrelated line in another work item's phase record |
| `git diff --stat 3534634..HEAD -- apps/desktop/src/renderer apps/desktop/src/main` | No output |
| A comparison of the row in `round-6.md` that opens `\| closed That a pane` with line 24 of `gaps.md` | `True` |
| `python3 skills/code-review/scripts/chain_check.py --baseline 02dea83 --root <the worktree> --worktree`, after the record was written | Exit 0. It refused nothing in this record. It names the gate record and the guarantee as not yet written, and it printed no notice at `frame/design.md` |
