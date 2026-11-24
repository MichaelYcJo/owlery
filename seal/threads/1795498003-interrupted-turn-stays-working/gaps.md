# Closing memo: 1795498003-interrupted-turn-stays-working

## Not verified

| Item | Who must answer |
|---|---|
| closed Q1 of `frame/questions.md`: which hook events Claude Code sends and which log lines it writes when a person presses Esc during a tool call and during a reply | recorded by phase 1's second real `claude` session, which the orchestrator's row in `frame/plan.md` *Judgments of the run* allowed: both interruptions wrote an entry of `frame/design.md` *Scope* item 3's shape, and no hook event named either (`trail/phases/phase-1.md`, *The second build*) |
| What Claude Code sends and writes when Esc stops a Bash call whose command is running. The recording's Esc stopped the `ping` call while its `PreToolUse` hooks still held it, before the command ran (`trail/phases/phase-1.md`, *The second build*), so whether a `PostToolUse` or a `PostToolUseFailure` arrives after such an Esc is not recorded. *Scope* item 5's rule holds such an event either way, and scenario 3's case drives it with a `PostToolUseFailure` the case writes | the owner, in the walk of release 0.0.3 (#184): the orchestrator's row of 2026-11-24 in `frame/plan.md` *Judgments of the run* starts no third real session and leaves this case to that walk |
| Whether Claude Code writes the session log after the hook event of a session's first prompt in every session, and within the 10 seconds the watch waits for it. One recording showed the log made 54 ms after that hook began (`trail/phases/phase-2.md`), and a log made later is read only from the turn's next tool call on | the owner, in the walk of release 0.0.3 (#184): the orchestrator's row of 2026-11-24 in `frame/plan.md` *Judgments of the run* has that walk press Esc during a new pane's first reply |
| The bound on what a session log's watch holds of an unfinished line, 16 KB. `seal mutate` replacing the check in `SessionLogWatch#take` with `false` survived: a longer line is then held whole and still skipped at its end, so only memory shows the bound | the proofer, by reading `apps/desktop/src/daemon/session-log.ts` |
| That a watch whose log stands but cannot be watched says its failure once. The guard at the head of `SessionLogWatch#fail` is reached only where `fs.watch` refuses a file that stands, which no case can cause | the proofer, by reading `apps/desktop/src/daemon/session-log.ts` |

## Not done

Phase 1 recorded no Esc during a running command. `frame/plan.md` *How the recording is made (phase 1)* step 4 sends Esc two seconds after the `PreToolUse`, and the call's `PreToolUse` hooks still held it then. The plan allows one real session in this build and no further one, so this phase started none to record it again.

Phase 2 does not end a session log's watch in `Daemon#dropWorkItems`, where the pane's silent start is also cleared. A delete and a removal drop a work item's panes only after every pane's process exited, and the exit already ends the watch, so the end there could meet no live watch and no case could show it.

Phase 2 does not read the log once more right after the watch starts. `fs.watch` arms its watch at the next turn of the daemon's event loop, so a write in the same turn is read only with the log's next write. The interruption's entry follows an Esc, which comes long after the event that starts the watch, so the extra read would guard a case the recording does not show.

Phase 3 leaves `apps/desktop/test/agent-events.test.ts` reading the recording's log lines with its own parse of the fixture. Phase 3 moved the play of the recording into `apps/desktop/test/interrupted-turn.ts` for the cases that drive a daemon. The cases of `isInterruptionEntry` need only the lines, and no daemon. Moving that parse too would change a file this phase's scenario does not touch.
