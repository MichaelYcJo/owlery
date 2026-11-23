# Review round 3: 1795341001-cost-per-stage

```seal
target: 8b29d62, fixes 6f0d574..8b29d62
```

This is the verifying round. It reviews the diff from round 2's target `6f0d574` to `8b29d62` as a whole: `724c5ac` (round 2's record), `4d9f760` (the three record sentences), `22ba7dd` (the comment in `apps/desktop/src/daemon/ledger.ts`) and `8b29d62` (the close blocks). Beside that bound, it read each record of the work item whole at `8b29d62`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, both phase records and `trail/rounds/round-1.md` and `round-2.md`. No `seal/parity.json` is declared, and the frame cites no reference root. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed.

Carried from rounds 1 and 2 rather than re-established: where `startHeadless`, `close`, `headlessChanged` and `enter` stand in `apps/desktop/src/daemon/daemon.ts`, and where `stop` and the line handler of `start` stand in `apps/desktop/src/daemon/adapters/claude.ts`. The range changes no file under `apps/desktop/src` but `ledger.ts`, and changes only comment lines there (executed: `git diff --stat 6f0d574..8b29d62`; read: `git diff 6f0d574..8b29d62 -- apps/desktop/src`). Re-derived this round: every verdict below, and what the listener of `startHeadless` takes once the daemon's close has stopped a run, which finding 1 rests on.

The axes walked on the fix diff: whether each new sentence holds against the code, for each kind of stop the sentence names (the limit, a request, the daemon's own close) and for each event the listener can still be handed after it (an exit, a result, a text, a permission request); the precondition the new comment names, against `add` and `appendFileSync`'s open, write and close; and whether the round-2 snippets reached every statement of their facts. On the records: each sentence of the files above against the target, and each row the range adds to or removes from `gaps.md` (none).

## Findings

### 1. Four records say the daemon takes no result after its own stop, while its close leaves the session working and the listener still takes one

```seal
severity: should
location: `seal/threads/1795341001-cost-per-stage/changelog.md:8`, `seal/threads/1795341001-cost-per-stage/trail/phases/phase-2.md:9`, `seal/threads/1795341001-cost-per-stage/frame/questions.md:21`, `seal/threads/1795341001-cost-per-stage/frame/plan.md:28`
evidence: read `apps/desktop/src/daemon/daemon.ts:476-481`, `apps/desktop/src/daemon/daemon.ts:1349-1359`, `apps/desktop/src/daemon/daemon.ts:1381-1388`, `apps/desktop/src/daemon/daemon.ts:1424`, `apps/desktop/src/daemon/daemon.ts:1443-1447`, `apps/desktop/src/daemon/adapters/claude.ts:469-474`, `apps/desktop/src/daemon/adapters/claude.ts:485-506`; executed `git grep -n -i -E "after (a|the|its|it) ?stop|after it stops|no event|every event|takes nothing|takes no " 8b29d62 -- seal/threads/1795341001-cost-per-stage apps/desktop/src ':!seal/threads/1795341001-cost-per-stage/trail/rounds'` and `git grep -n -i -E "close changes no|own stop|daemon's close|its close" 8b29d62 -- apps/desktop/src/daemon seal/threads/1795341001-cost-per-stage ':!seal/threads/1795341001-cost-per-stage/trail/rounds'`
reopens: round-2#2
```

Why it matters: round 2's finding 2 said these records overstate what the daemon drops after a stop. `4d9f760` fixed the overstatement about the exit. It left standing the one about the daemon's own close, which the old text and round 2's snippet both carried. `changelog.md:8` becomes the release note. `frame/questions.md:21` is Q2, which goes on to issue #141, and #141's framer reads it to decide how a stopped stage gets its usage. That sentence names the listener's guard as what drops a result after every stop. At the daemon's close the guard never applies, so a framer who reads Q2 would build #141's close case on the wrong mechanism.

The grounds. The close writes each working session's entry and then stops its run, and its comment says "The close changes no session's state" (`daemon.ts:479-481`). `enter` sets `entered` and changes no state either (`daemon.ts:1443-1447`). The run's `stop` signals the process group and waits for its exit (`claude.ts:469-474`). Meanwhile the line handler goes on handing each line's events to the listener: only a refused launch stops it (`claude.ts:485-506`). The listener's guard `if (info.state !== "working") return;` (`daemon.ts:1359`) lets every event through for a session that is still `working`. So a `result` the CLI prints after the close's signal sets `info.usage`, makes the session `finished` and calls `headlessChanged` (`daemon.ts:1381-1388`). The entry is not touched: `headlessChanged` calls `enter` (`daemon.ts:1424`), which returns because `entered` is set (`daemon.ts:1444`). So the ledger holds what the records say it holds, a null usage for a stage the close cut. The records are wrong about why. For a stop at the limit or at a request, the guard drops the result. For the daemon's close, the entry is written before the run's end can report anything.

Each statement, at the target:

- `changelog.md:8` says "The daemon takes no usage and no result from an agent after it stops it, at its limit, at a request or at its own stop." The last of the three does not hold.
- `trail/phases/phase-2.md:9` says "the daemon takes no result after a stop (`startHeadless`), so a session that a stop or the daemon's close ended carries null." After the close the session can carry the result's usage. Only its entry carries null, and for a reason the sentence does not give.
- `frame/questions.md:21` says "The daemon takes no usage and no result after a stop today". Q2 covers the close: its default cites *Scope* items 9 and 10 of `frame/design.md`, and item 10 is the close. `gaps.md:12` lists "the daemon's close" among the stops whose answer is Q2's.
- `frame/plan.md:28` says "The daemon takes no usage and no result after a stop (`startHeadless` in `daemon.ts`)" in the row of a stopped stage's entry. That row is the chosen rule for *Scope* items 9 and 10 alike.

The exit clause `4d9f760` added holds. Q2's parenthetical, "whose listener passes on only the exit once the session is no longer working", is true of the guard. So is `phase-2.md:9`'s first clause, "Only a result sets `HeadlessInfo.usage`" (`daemon.ts:1381`). What fails is that each sentence spreads the guard over the close.

The list was made by reading each record of the work item whole at `8b29d62`, every sentence of each. Both searches on the `evidence:` line cross-check it. Weighed and left:

- `frame/design.md:177` says a stage the daemon stopped "at the daemon's own stop, has an entry with no usage, because its agent reported none before it ended". This holds: the close enters the session at the stop, and a working session has had no result.
- `frame/design.md:58`, *Scope* item 10, says the close adds the entry "before it stops the runs". This holds.
- `pr.md:14` and `gaps.md:12` say nothing about what the daemon takes. They hold.
- `frame/plan.md:29` names "the daemon's rule that nothing after the end changes a session". Round 2 weighed it. It is the comment at `daemon.ts:1358` on a result, and the close is no end of a session's state.

In code, the comment at `daemon.ts:479`, "before its run's end can say anything else", is the one statement on the close, and it holds. Code outside the records was searched and not read whole, so for code the list is a sample.

The fix names the two mechanisms apart. Each line below replaces only the sentence or clause it shows. Every other word of the four lines stays.

```md
changelog.md:8: ... **A stage that was stopped has an entry with no usage.** The daemon takes no usage and no result from an agent after it stops it at its limit or at a request, and at its own stop it writes the entry before it stops the agent, so nothing the agent reports after that stop reaches the entry. Whether Claude Code reports ...
trail/phases/phase-2.md:9: **An entry's usage is the session's, with no branch on what stopped it.** Only a result sets `HeadlessInfo.usage`. The daemon takes no result after a stop at the limit or at a request (`startHeadless`), so a session such a stop ended carries null. `close` leaves a working session working and writes its entry before it stops the run, so that entry carries the null the session held, and a result the run reports after the stop reaches no entry. Judged against `frame/design.md` *Scope* items 9 and 10.
frame/questions.md:21: ... in the middle of a turn? The daemon takes no usage and no result after a stop at its limit or at a request today (`apps/desktop/src/daemon/daemon.ts#startHeadless`, whose listener passes on only the exit once the session is no longer working). Its close leaves a working session working and writes the session's entry before it stops the run (`daemon.ts#close`), so a result after that stop changes the session and no entry. What the CLI prints then was not run: it needs a real `claude` process in a turn. | ...
frame/plan.md:28: ... | Chosen. The daemon takes no usage and no result after a stop at its limit or at a request (`startHeadless` in `daemon.ts`), and its close writes a working session's entry before it stops the run (`close`). Whether the CLI prints a `result` line after the signal is not known and cannot be probed in this run (`frame/questions.md` Q2). A null says the cost is unknown, and #141 measures it |
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: the comment at `apps/desktop/src/daemon/ledger.ts:97-100` is round 2's paste-ready text word for word, and `22ba7dd` changes those comment lines alone. Two lines of `//` gave way to four, and no line of code moved (read: `git diff 6f0d574..8b29d62 -- apps/desktop/src`). Each clause holds against `add`. "Leaves the held list once its append returns" is the `shift` after `appendFileSync` (`ledger.ts:104-105`). A throw from `endsInsideALine` or from the append leaves the entry held, and the `catch` logs it (`ledger.ts:107-108`). The precondition is stated beside the line it covers, and so is its one limit: a close that fails after a whole write keeps the entry held, and the next append writes it again. That is the case `gaps.md:11` names. After the settle removes `gaps.md`, the comment is the text that carries the limit, which round 2's finding asked for. The fix pass's `test/ledger.test.ts` run and `tsc` exit were read as claims and not run again, because the diff changes no token the compiler or a case reads.

What matched: one more statement of the held-entry fact. `frame/design.md:177` says an entry whose append failed is held "until an append writes it". Under a close that fails after a whole write, the bytes are in the file and the entry is still held. The sentence was weighed against that and left. Its own clause calls such an append one that "failed", so "an append writes it" reads as an append that succeeds. That reading matches the Korean `to` at `frame/design.md:182`, "그 항목을 적는 덧붙이기가 성공할 때까지", and the comment's "once its append returns". No finding is opened.

What matched: the records outside finding 1. `routing.md`, `frame/design.md`, `gaps.md`, `pr.md`, `trail/phases/phase-1.md` and the rest of the files read whole state nothing the target contradicts, except at finding 1's locations. `gaps.md` gains no row and loses none in the range (read: `git diff 6f0d574..8b29d62 --stat`, which does not name it). `pr.md` quotes nothing, and no line of it changed in the range.

What matched: the label of the suite. The range changes a comment and record prose alone. `gaps.md:10` still labels the whole suite, the package's typecheck and the broad gate unverified, and names the orchestrator as the answerer. The spawn names the same two as unverified. The label is honest.

The fix diff adds no case, so no new case is read against its group.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the package's typecheck and the broad gate at HEAD, among them the files that import `test/built-app.ts` | `seal/threads/1795341001-cost-per-stage/gaps.md:10` | the orchestrator, at the broad run after the rounds settle |
| Whether `appendFileSync` throws only where its text is not whole in the file | `seal/threads/1795341001-cost-per-stage/gaps.md:11` | the orchestrator, who decides whether it goes on to `seal/follow-up.md` |
| Whether Claude Code prints a `result` line after the daemon's signal, at any of the three stops | `seal/threads/1795341001-cost-per-stage/frame/questions.md:21` | issue #141 |

## Probes

| Command | Result |
|---|---|
| `git diff --stat 6f0d574..8b29d62` in a clone of the branch at `8b29d62` | 5 files: `apps/desktop/src/daemon/ledger.ts`, `changelog.md`, `frame/questions.md`, `trail/phases/phase-2.md` and `trail/rounds/round-2.md` |
| The first search on finding 1's `evidence:` line, round 2's search of the same class at `8b29d62`, in the clone | exit 0. Of the work item's records it names `changelog.md:8`, `frame/plan.md:28-29`, `frame/questions.md:21`, `gaps.md:10`, `gaps.md:12`, `pr.md:8` and `trail/phases/phase-2.md:9`. The lines under `apps/desktop/src` are about panes, hooks and choices, none of them about a headless session after a stop. |
| The second search on finding 1's `evidence:` line, for the close's wording, in the clone | exit 0. In code it names `daemon.ts:479` and three comments on waits and blocks. In the records it names the lines weighed in finding 1. |
| `python3 skills/code-review/scripts/chain_check.py --baseline 41e8aa4 --root` (the branch worktree) `--worktree`, from the plugin's root, with this record in place | exit 0. It names finding 1 as open for its missing close block, and the missing gate and guarantee records. It prints no notice on a line of `frame/design.md`. |
