# Review round 2: 1795559736-caps-on-worktrees-and-agents

```seal
target: bfdbe5a0, fixes f16605a1..bfdbe5a0
```

This is a verifying round. Its range is `git diff f16605a1..bfdbe5a0`: the orchestrator's record of three judgments (`2ea67b2b`), the crafter's fix commits `092e4a7e`, `d331a5fb`, `7f247d22`, `2ae1a50a`, `91c2fcb7`, `cc7a2dbe` and `d45f29b1`, and the eight close blocks (`bfdbe5a0`). The code reviewed stays inside that diff. It covers `daemon.ts`, `daemon/machine.ts`, `renderer/view.ts`, `renderer/work-item-view.ts` and `renderer/index.html`, the four test files it changes, and both editions of `docs/design.md`. The two new PNG files under `screenshots/` were opened and read beside the Night watch shot of the same dialog.

The records read whole at `bfdbe5a0` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. No `pr.<lang>.md` is owed, as round 1 found. `trail/phases/` and `round-1.md` were read for their coordinates.

Some facts were carried from round 1 and not established again: where the queue, the store and the foot live; that `seal/config.json` names English; and that no `seal/parity.json` stands. Every verdict below was reached in this round.

The question the orchestrator put about `trail/phases/phase-2.md:41` has this answer: it stands as history. `skills/implement/SKILL.md` *Document layout* gives a phase record one lifetime, "what building this phase found", "written when the phase closes". Step 3 of the proofer's reading does not list it among the records that state the present. Line 41 says what phase 2 built: the foot used `queuedAhead`. That was true of phase 2, and round 1's finding 5 rests on it. The present is stated by `frame/design.md` *Scope* item 8, "A chain whose stage waits says the same sentence at the view's foot". The target now holds to that through `stageAhead` (`apps/desktop/src/renderer/work-item-view.ts:1018`). Rewriting line 41 would put a later fix into a record of an earlier phase, so the round opens no finding on it.

## Findings

### 1. `frame/plan.md` says a cap typed equal to its default is kept as typed "as built", and the build sends nothing for the very case round 1 asked about

```seal
severity: should
location: `seal/threads/1795559736-caps-on-worktrees-and-agents/frame/plan.md:85`, `apps/desktop/src/renderer/view.ts:1592-1607`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts` in the round's clone at `bfdbe5a0`; read `apps/desktop/src/renderer/view.ts:1575`, `apps/desktop/src/renderer/view.ts:1592-1607`, `apps/desktop/src/daemon/daemon.ts:1598-1614`, `seal/threads/1795559736-caps-on-worktrees-and-agents/trail/rounds/round-1.md` *Not judged* row 2
```

Why it matters: round 1 left one question to the owner. It asked about a row that follows its proposal: should a Save send the value when a person types that same value into it? Round 1 found that `capChanges` sends nothing then, and the cap keeps following the proposal. The orchestrator's row at `frame/plan.md:85` answers: "A cap a person types that equals its default is kept as typed, and stays fixed when the default later moves, as built". Its grounds say "a typed number reads as the person's choice".

The build does the reverse for the row round 1 asked about. `machineDialog` gives a row that follows its proposal `value: set ?? proposed` (`view.ts:1575`). `capChanges` then sends a typed value only `if (value !== row.value)` (`view.ts:1604`). So a person who types the default into a row that follows it sends nothing, and the cap keeps following the default when it moves. The function's own docstring says so: "A row that already follows its proposal sends nothing while its field still shows the proposal, so the cap keeps following it."

The probe built that row: `value: 6`, `proposed: 6`, `isDefault: true`, with "6" typed. `capChanges` returned `{"caps":{}}`, not `{ caps: { agents: 6 } }`.

The row's sentence holds only for a cap a person had already set to another number. There, the typed default differs from `row.value`, it is sent, and `setCaps` stores it as set (`daemon.ts:1614`).

The settle and the sealer read the plan's *Judgments of the run* as a decision about what the product does. A sealer reading this row would guarantee a behaviour the tree does not have. Which of the two the orchestrator meant is the orchestrator's choice. If "as built" is the decision, the row changes. If "kept as typed" is the decision, `capChanges` changes, and a case in its group (`apps/desktop/test/view.test.ts:3725`) pins it. The fix below is the row, written to say what is built:

```markdown
| 2026-11-25 | A cap that follows its default sends nothing where a person types its default into the field, and keeps following the default when it moves, as built. A cap a person set that is changed to its default's number is kept as typed, and stays fixed when the default later moves | Round 1 left it to the owner. A field that still holds the number it showed reads as no change, and "Use the default" is the way back to a cap that follows its default. The owner can reverse it in a later issue at no cost to this one | `frame/design.md` *Scope*, item 3 |
```

### 2. The new row of the Machine dialog says the reading stands in one line, and every shot of the dialog draws it on two

```seal
severity: should
location: `docs/design.md:457`, `docs/design.ko.md:457`
evidence: read `docs/design.md:457`, `docs/design.ko.md:457`, `docs/design.md:458`, `apps/desktop/src/renderer/index.html:327-328`, `seal/threads/1795559736-caps-on-worktrees-and-agents/screenshots/night-watch-dark-machine.png`, `seal/threads/1795559736-caps-on-worktrees-and-agents/screenshots/register-dark-machine.png`, `seal/threads/1795559736-caps-on-worktrees-and-agents/screenshots/register-light-machine.png`, `seal/threads/1795559736-caps-on-worktrees-and-agents/frame/design.md:81`
regression: round-1#4
```

Why it matters: the unit is the Machine dialog's row of *Components and their states*, which `91c2fcb7` added to close round-1#4. *Scope* item 4 of `frame/design.md` says the dialog "shows the reading in one line" (`frame/design.md:81`). The fix wrote that phrase into the row of a form, and the defect came from that copy: in the frame it meant one sentence, but in the row it states a drawn form. The row says "Under the heading stands what the daemon read of the machine, in one line in `--font-fact`". The Korean edition says "`--font-fact`로 한 줄에 놓입니다".

The dialog is `min(560px, 92vw)` wide (`index.html:327`), and the reading is one sentence of about 115 characters. Every shot the pull request carries draws it on two lines:
- Night watch dark: "... and 25.1 / GB free of 494.4 GB on the worktrees' disk."
- Register dark and light, in the fixed-width face: "... a load / of 0, and ...".

`docs/design.md` *A pull request that changes the window carries its screenshots* has a review read "each form against *Components and their states*". So the next review that reads this dialog against its row finds a form that breaks it, in every theme.

The next row writes the same form as "The two stand on one line, wrapped" (`docs/design.md:458`). That says "one sentence, wrapped" in the document's own words. The fix gives the reading line the same wording in both editions:

```markdown
docs/design.md:457
  from: Under the heading stands what the daemon read of the machine, in one line in `--font-fact`.
  to:   Under the heading stands what the daemon read of the machine, as one sentence in `--font-fact`, wrapped.
docs/design.ko.md:457
  from: 머리 아래에 데몬이 읽은 기계가 `--font-fact`로 한 줄에 놓입니다.
  to:   머리 아래에 데몬이 읽은 기계가 `--font-fact`의 한 문장으로, 줄을 바꿔 가며 놓입니다.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `beginHeadless` reads `this.agentsRunning()` against the cap before it lists the session (`apps/desktop/src/daemon/daemon.ts:2269`, read). Round 1's probe was run again, at a cap of 1 with nothing running (executed). The asked session came back `working`, with no `queuedAt` and no `queued` broadcast. The new case (`apps/desktop/test/daemon.test.ts:6969`) passed at `bfdbe5a0`. With the listing moved back before the count, it failed on "expected 'queued' to be 'working'" (executed). The case holds the fact of `frame/design.md` *Scope* item 6 one place under the cap. Its group in "the caps on the machine" held that fact only at the cap or over it.

```seal
confirms: round-1#2
```
What holds: `endSessions` sorts a work item's queued sessions before its working ones and stops them in that order. The docstring says so (`apps/desktop/src/daemon/daemon.ts:2087-2090`, read). Round 1's archive probe was run again (executed). It read one adapter start, `First?`, and one ledger entry. The new case (`apps/desktop/test/daemon.test.ts:6987`) passed at `bfdbe5a0`. With the sort taken out, it failed on "expected [ 'First?', 'Second?' ] to deeply equal [ 'First?' ]" (executed). The crafter also claimed a mutant that stops the working sessions first; it was carried, not run. The sort is stable, so sessions within each state keep their order.

```seal
confirms: round-1#3
```
What holds: `register-dark-machine.png` and `register-light-machine.png` stand under `screenshots/`, at 1440 by 900 (read). Each shows the Machine dialog with its reading line in the fixed-width face, the agents' row at 4 with the caption "Waiting for the machine", the waiting session "Rename the settings file" / "Asked: Which keys does the settings file hold?", and the worktree and pane rows. The close says that Register draws the inbox line's second row and the status line in no other face. The two shots show this behind the dialog: "Waiting for the machine" under "Rename the settings file" in the inbox, and "Daemon running, 4 agents of 4, 1 waiting, keeping the Mac awake" at the sidebar's foot, both in the proportional face (read). `gaps.md:13` ends with `closed`, and its text names the two files.

```seal
confirms: round-1#4
```
What holds: the list of views ends with the Machine dialog in both editions (`docs/design.md:505`, `docs/design.ko.md:505`, read), and so does `VIEWS` (`apps/desktop/test/screenshots.ts:11`, read). The two editions add the same three rows to *Components and their states* (`docs/design.md:457-459`, `docs/design.ko.md:457-459`). Each row has seven cells, as its neighbours do. The rows were read as code:
- **The warning row** matches `#work-item-plan` and `#work-item-warning`: placed after the branch, the folder and the setup; `--size-second` and `--ink`; two sentences joined by a space (`apps/desktop/src/renderer/index.html:605-614`, `:824`, `apps/desktop/src/shared/machine.ts:129`, read).
- **The side-by-side row** matches `stageGrid`'s columns and last span (`apps/desktop/src/renderer/view.ts:2493-2496`, read). It also matches the rules of 1px in `--rule` at `-var(--space-5)` and `-7px`, the middle of margins of `var(--space-5)` and `7px` (`apps/desktop/src/renderer/index.html:450-452`, read).
- **The Machine dialog row** matches the field's `8ch`, the caption, and the queue rows' `--ink` and `.detail` in `--ink-muted` (`apps/desktop/src/renderer/index.html:327-337`, `apps/desktop/src/renderer/machine.ts:106-118`, read). Its reading line is finding 2.

```seal
confirms: round-1#5
```
What holds: `stageAhead` counts the sessions before the session of the last stage of a chain in the `running` state, and gives null otherwise (`apps/desktop/src/renderer/view.ts:1527-1531`, read). The view's foot draws from it (`apps/desktop/src/renderer/work-item-view.ts:1018`, read). It was read as a new unit:
- A chain between stages names a finished session that is in no queue, and reads null.
- A stage with `headlessId: null` reads null.
- `queuedAhead` keeps its one caller, the inbox line (`apps/desktop/src/renderer/list.ts:151`).

The probe drew the foot for a chain whose stage works while an asked session waits, and the foot kept the stage's sentence. With the stage's session in the queue, the foot read "Waiting for the machine (1 ahead)" (executed). The changed case (`apps/desktop/test/view.test.ts:1761`) passed at `bfdbe5a0` (executed). The crafter claimed it was red before the fix and claimed two mutants; both were carried, not run.

```seal
confirms: round-1#6
```
What holds: `AgentMemoryStore.keepLiving` deletes every living name not passed (`apps/desktop/src/daemon/machine.ts:265-267`, read). `measureAgents` calls it before its early return (`apps/desktop/src/daemon/daemon.ts:3701`, read), so the last agent is forgotten once none lives. Both docstrings say so. A working headless session enters the names only once its `pid` is known, and keeps it until it ends, so no living agent drops out between readings. The new daemon case (`apps/desktop/test/daemon.test.ts:7102`) passed at `bfdbe5a0`. With the call moved after the return, it failed on a timeout, since no reading after the pane ended called the store (executed). The changed case at `apps/desktop/test/machine.test.ts:251` passed (executed). It pins both halves: a name not passed is new again, and `pane-20`, still passed, keeps its highest.

```seal
confirms: round-1#7
```
What holds: `gaps.md:8` reads, word for word, the text round 1 gave, and its item stays open (read).

```seal
confirms: round-1#8
```
What holds: `changelog.md:11` reads "A waiting session gets its time limit and its start time when it starts, so the time it waited counts toward no stage's time or cost." (read).

What matched: the orchestrator's judgment on the form's warning, `frame/plan.md:84`. `#work-item-warning` is `color: var(--ink)` (`apps/desktop/src/renderer/index.html:613`). It was `var(--state-waiting)` at `f16605a1` (read). The case at `apps/desktop/test/machine-dialog.test.ts:182` compares the warning's computed colour with `--ink` and against `--state-waiting`. At `f16605a1` that comparison would have read Night watch's yellow. This round read it and did not run it, since it is a built-app file and no finding needed it. The fix diff does not say it was seen red.

What matched: the orchestrator's judgment on principle 8, `frame/plan.md:83`. The three rows it asks for stand in both editions, as the confirmation of round-1#4 says (read).

What matched: `pr.md`. Each of its quotes still stands word for word at the coordinate it names. The new plan rows follow row 3, so *Judgments of the run* row 3 is the same row (read). `frame/design.md` *Scope* item 8 and Q13 read true of the target (read).

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the warning's new case at `machine-dialog.test.ts:182` was seen red. The fix diff makes no claim of it, and this round did not run the built-app file, by the orchestrator's instruction to run one only where a finding needs it | `apps/desktop/test/machine-dialog.test.ts:182` | The crafter, in its hand-back to the orchestrator |
| Which way finding 1 is decided: the row or `capChanges` | `seal/threads/1795559736-caps-on-worktrees-and-agents/frame/plan.md:85` | The orchestrator |
| The broad gate | the repository | The orchestrator: once the two findings are closed and a round verifies them, its broad run comes due, and the sealer's spawn after it |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts`, in the round's clone at `bfdbe5a0`, run once | 4 cases; 3 passed, 1 failed. Round 1's two probes: a cap of 1 with nothing running gave `working` with no `queuedAt` and no `queued` broadcast; the archive gave one start and one ledger entry. The foot with an asked session waiting gave the stage's sentence, and with the stage's session second gave "Waiting for the machine (1 ahead)". The failed case: `capChanges` for a following row at 6 with "6" typed returned `{"caps":{}}` |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/daemon.test.ts -t "one place under the cap is free\|before its working one at an archive\|forgets an agent that ended"`, at `bfdbe5a0` | 3 passed, 377 skipped |
| The same command with three edits in `daemon.ts` of the clone: the session listed before the count, `endSessions` stopping `headless` unsorted, and `keepLiving` after the early return. Restored with `git checkout` afterwards | 3 failed: "expected 'queued' to be 'working'", "expected [ 'First?', 'Second?' ] to deeply equal [ 'First?' ]", and "timed out" in the store case |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/view.test.ts -t "says at the view's foot"`, at `bfdbe5a0` | 2 passed, 541 skipped |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/machine.test.ts -t "keeps each agent's highest reading"`, at `bfdbe5a0` | 1 passed, 34 skipped |
