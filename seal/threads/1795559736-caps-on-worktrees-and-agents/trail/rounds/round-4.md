# Review round 4: 1795559736-caps-on-worktrees-and-agents

```seal
target: 40dbd65a, fixes 50de3b74..40dbd65a
```

This is a verifying round. Its range is `git diff 50de3b74..40dbd65a`, which holds two commits: `966a7355`, a docstring fix of one word in `apps/desktop/src/renderer/machine.ts`, and `40dbd65a`, the close block of round 3's finding. No running code changes.

The records read whole at `40dbd65a` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. None of them changed after `649264b4`, where round 3 read them (`git diff --stat 50de3b74..40dbd65a`, executed). None of them names the docstring the fix changed, so the target contradicts none of their sentences.

Some facts were carried from round 3 and not established again: the 36 files the work item changes, and the reading of the four hits its search left that are not the class.

## Findings

None.

## Confirmations

```seal
confirms: round-3#1
```
What holds: the docstring of `showMachine` now opens "Draws the dialog from what the daemon last said: the reading in its sentence," (`apps/desktop/src/renderer/machine.ts:73`, read). That agrees with `docs/design.md:457`, `docs/design.ko.md:457`, `frame/design.md:81` and the docstring of `machineDialog` (`apps/desktop/src/renderer/view.ts:1566`).

Round 3's search was run again at `40dbd65a`, over the same 36 files (executed). It now finds four hits and no hit in `machine.ts`: `frame/plan.md:60`, `:83` and `:84`, and `gaps.md:13`, which round 3 read as not of the class.

The close describes its own searches: `apps/desktop/src`, `apps/desktop/test` and both editions of `docs/design.md`, for "reading" beside several wordings of "line", and "한 줄". It calls them a sample, and so does this round. Its claim of a `tsc --noEmit` run of `machine.ts` exiting 0 is carried, not run: a docstring holds no type.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate | the repository | The orchestrator: this round leaves nothing open, so its broad run comes due, and the sealer's spawn after it |

## Probes

| Command | Result |
|---|---|
| `git diff --name-only origin/release/v0.0.4...HEAD`, filtered to the files that are not PNG files or trail records, then `xargs grep -n -i -E "reading[^.]{0,40}\bline\|\bline[^.]{0,40}reading\|warning[^.]{0,30}\blines?\b\|경고[^.]{0,30}줄"` over the list, at `40dbd65a` | 36 files; 4 hits: `frame/plan.md:60`, `:83` and `:84`, and `gaps.md:13` |
