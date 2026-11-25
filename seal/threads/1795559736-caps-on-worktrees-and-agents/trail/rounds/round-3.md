# Review round 3: 1795559736-caps-on-worktrees-and-agents

```seal
target: 649264b4, fixes fcd17519..649264b4
```

This is a verifying round. Its range is `git diff fcd17519..649264b4`, four commits:
- `39176b51`, the orchestrator's rewrite of the judgment row at `frame/plan.md:85`.
- `008194a0`, the crafter's fix of finding 2 and of what it took to be that finding's class.
- `737286a4`, the two close blocks.
- `649264b4`, the framer's fold of `frame/design.md:81` and `:162`.

The fixes touch no running code. The code read is the one changed docstring of `renderer/view.ts`, the two renamed cases, and the changed rows of both editions of `docs/design.md`. The Korean edition was read for its own wording.

The records read whole at `649264b4` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. No `pr.<lang>.md` is owed. Some facts were carried from rounds 1 and 2 and not established again: where the dialog's reading is built (`apps/desktop/src/renderer/index.html:327-328`); that every shot of the dialog wraps it on two lines; and how `capChanges` treats a row that follows its proposal, which round 2's probe ran. Every verdict below was reached in this round.

## Findings

### 1. The dialog's own docstring still draws the reading "in its line", after the close of round 2's finding 2 said every statement of it as a line was corrected

```seal
severity: should
location: `apps/desktop/src/renderer/machine.ts:73`
evidence: executed `git diff --name-only origin/release/v0.0.4...649264b4`, filtered to the 36 files that are not PNG files or trail records, then `xargs grep -n -i -E "reading[^.]{0,40}\bline|\bline[^.]{0,40}reading|warning[^.]{0,30}\blines?\b|경고[^.]{0,30}줄"` over them; read `apps/desktop/src/renderer/machine.ts:72-85`, `seal/threads/1795559736-caps-on-worktrees-and-agents/trail/rounds/round-2.md:72-76`
reopens: round-2#2
```

Why it matters: the close of round 2's finding 2 widened the fix to the finding's class. It says "The same commit corrects the other statements of the reading or the warning as one line". The list it gives is the warning's row in both editions, the docstring of `machineDialog`, the two case names and `changelog.md:5`. `649264b4` then folded the frame's two statements.

The class is every statement of the work's files that sets the reading or the warning as a line. Not every statement of it was found. The docstring of `showMachine` in `renderer/machine.ts`, the function that fills the dialog, still opens: "Draws the dialog from what the daemon last said: the reading in its line, and for each cap its name, its field, ...". At this target, three texts now say the reading is one sentence that wraps where the dialog is narrower than it:
- `docs/design.md:457` and `docs/design.ko.md:457`;
- `frame/design.md:81`;
- the docstring of `machineDialog` (`apps/desktop/src/renderer/view.ts:1566`).

The function that draws it is the one place left saying otherwise. Whoever next edits the dialog reads that docstring first.

The search ran over all 36 files the work item changes, for "line" within one sentence of "reading" and for "line" after "warning". It found this docstring and no other statement of the class:
- `frame/plan.md:83` and `:84` say "warning lines". They name the two sentences a dated judgment was about, not a drawn form.
- `frame/plan.md:60` and `gaps.md:13` mean the inbox's line.
- The trail records are history.

The search is a wording search, so it is a sample. It is the method the close's own list stood on, and that list missed one instance it reaches.

The rows the finding named hold, and so do the edits the close widened to:
- `docs/design.md:457` reads "as one sentence in `--font-fact`, wrapped". `docs/design.ko.md:457` reads "`--font-fact`의 한 문장으로, 줄을 바꿔 가며 놓입니다".
- The warning's row reads "The two stand in one paragraph, wrapped" (`docs/design.md:458`). The Korean edition reads "두 문장은 한 문단에 이어서 줄을 바꿔 가며 `--size-second`와 `--ink`로 놓이고" (`docs/design.ko.md:458`). "한 문단에 이어서" says the second sentence follows the first in the same paragraph. That is the form `planWarning` builds: the two sentences joined by a space in one span (`apps/desktop/src/shared/machine.ts:129`, carried from round 2). The two editions say the same.
- The two case names now say "in one sentence" (`apps/desktop/test/view.test.ts:3663`, `apps/desktop/test/machine-dialog.test.ts:56`). Neither case asserts a line, so no assertion changes with the name.
- `changelog.md:5` reads "The dialog opens with a sentence that says what Owlery's background process, the daemon, read of this Mac".

The fix is one word of the docstring:

```ts
apps/desktop/src/renderer/machine.ts:73
  from:  * Draws the dialog from what the daemon last said: the reading in its line,
  to:    * Draws the dialog from what the daemon last said: the reading in its sentence,
```

```seal
verdict: fixed 966a7355
answer: Applied the record's one-word fix to the docstring of `showMachine`. Round 2's search missed it because that search looked for "one line", "in one line" and "first line says", and this docstring says "in its line". This pass searched `apps/desktop/src/renderer/` again for "its line", "the line", "one line" and "a line" on any line that names the reading. It also searched `apps/desktop/src`, `apps/desktop/test` and both editions of `docs/design.md` for "reading" beside " line", "its line", "one line" or "한 줄". The only hit about the dialog's reading was this one, and the other hits name the status line, a terminal's line or an output stream's line. Both searches look for wordings, so they are a sample. The `tsc` typecheck of `machine.ts` alone, with `--noEmit`, exited 0.
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: `frame/plan.md:85` is, word for word, the row round 2 gave. `grep -c -F` with the whole row found it once (executed). It says what is built:
- A cap that follows its default sends nothing when its default is typed, and keeps following it (`apps/desktop/src/renderer/view.ts:1575`, `:1604`, read; round 2's probe, carried).
- A cap a person set that is changed to its default's number is sent and stored (`apps/desktop/src/daemon/daemon.ts:1614`, read).

The close says "The build is the decision, and `capChanges` stays as it is". The fix diff does not touch `view.ts` beyond one docstring, and that docstring is not `capChanges`'s (read). The row agrees with `frame/design.md` *Scope* item 4, which offers "Use the default" "also where the set value equals the proposal" (`frame/design.md:81`, read).

What matched: the framer's fold. `frame/design.md:81` now reads "It shows the reading in one sentence, which wraps where the dialog is narrower than it". `frame/design.md:162` reads "The dialog's sentence of the reading states the load, and a fixed 0 keeps that sentence the same on every machine" (read). Both state what the target draws.

What matched: `pr.md`. Its quote "The Machine dialog." (`frame/design.md` *Scope*, item 4) still stands at the head of item 4. Its first quote names *Judgments of the run* by date, and the date is unchanged (read).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate | the repository | The orchestrator: once finding 1 is closed and a round verifies it, its broad run comes due, and the sealer's spawn after it |

## Probes

| Command | Result |
|---|---|
| `git diff --name-only origin/release/v0.0.4...649264b4`, filtered to the files that are not PNG files or trail records, then `xargs grep -n -i -E "reading[^.]{0,40}\bline\|\bline[^.]{0,40}reading\|warning[^.]{0,30}\blines?\b\|경고[^.]{0,30}줄"` over the list | 36 files; 5 hits: `apps/desktop/src/renderer/machine.ts:73`, `frame/plan.md:60`, `:83` and `:84`, and `gaps.md:13` |
| `grep -c -F` with round 2's row, over `frame/plan.md` | 1 |
