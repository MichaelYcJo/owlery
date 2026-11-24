# Closing memo: 1795498003-interrupted-turn-stays-working

## Not verified

| Item | Who must answer |
|---|---|
| closed Q1 of `frame/questions.md`: which hook events Claude Code sends and which log lines it writes when a person presses Esc during a tool call and during a reply | recorded by phase 1's second real `claude` session, which the orchestrator's row in `frame/plan.md` *Judgments of the run* allowed: both interruptions wrote an entry of `frame/design.md` *Scope* item 3's shape, and no hook event named either (`trail/phases/phase-1.md`, *The second build*) |
| What Claude Code sends and writes when Esc stops a Bash call whose command is running. The recording's Esc stopped the `ping` call while its `PreToolUse` hooks still held it, before the command ran (`trail/phases/phase-1.md`, *The second build*), so whether a `PostToolUse` or a `PostToolUseFailure` arrives after such an Esc is not recorded | the orchestrator: whether a further real session records it, or whether *Scope* item 5's rule, which scenario 3 drives with events the case writes, is enough |

## Not done

Phase 1 recorded no Esc during a running command. `frame/plan.md` *How the recording is made (phase 1)* step 4 sends Esc two seconds after the `PreToolUse`, and the call's `PreToolUse` hooks still held it then. The plan allows one real session in this build and no further one, so this phase started none to record it again.
