# Phase 1: 1795498003-interrupted-turn-stays-working

## What this phase found

Phase 1 was built twice. The first build, committed at `e6dfe29`, recorded no interruption, and its account follows first. The framer folded it into the frame at `429d098`. The second build recorded both interruptions, and its account follows the first. The fixture `apps/desktop/test/fixtures/claude-interrupted-turn.json` now holds the second recording only.

### The first build, at `e6dfe29`

**The first recording held no interruption, so Q1 stayed open and no phase 2 was built on it.** Claude Code 2.1.331 refused the Bash call `sleep 60` that the plan's step asked for at the time. The tool result was "Blocked: standalone sleep 60. To wait for a condition, use Monitor with an until-loop (e.g. `until <check>; do sleep 2; done`). To wait for a command you started, use run_in_background: true. Do not chain shorter sleeps to work around this block." No tool was running at 2 seconds after the call, so the driver had nothing to interrupt. It waited the 120 seconds it allows for a `PreToolUse` of Bash, then ended the session with `/exit`. It sent no Esc and no second prompt. The spawn of that build said to start no second session if the first failed, so that build started none. This was a departure from the frame: the step could not be run as written against 2.1.331. Judged against `frame/plan.md` *Phases*, the paragraph after the table, which says the crafter builds no phase 2 on a recording that differs from the frame.

**The frame was checked before the session, and the check did not catch this.** Executed before the session: `claude --version` printed `2.1.331 (Claude Code)`, the version `frame/design.md` *Grounding* names. `apps/desktop/test/fixtures/` held no `claude-interrupted-turn.json`. The hooks reference listed 33 hook events, the count *Grounding* gives. None of these reads could show that Claude Code refuses a standalone `sleep` in its Bash tool. The refusal showed only when the real session ran.

**Where the refusal came from was inferred, not read, at that build.** The settings file gave a hook to all 33 events, and no `PreToolUse` arrived for the call. Every `PreToolUse` hook of the settings and of the person's own settings runs side by side. So a hook that denied the call would still have let this hook record a `PreToolUse`. The refusal therefore came before the hooks ran, from Claude Code itself. The framer later found the check in the installed executable (`frame/design.md` *Grounding*, the entries on what Claude Code refuses to run).

**What the first session recorded**, at milliseconds from the start of the session:

| at (ms) | Hook event | What it carried |
|---|---|---|
| 256 | `SessionStart` | `source: startup` |
| 427 | `InstructionsLoaded` | the person's own instructions file |
| 3920 | `UserPromptSubmit` | the prompt |
| 6193 | `PostToolBatch` | the refused Bash call and its error as `tool_response` |
| 8681, 8682 | `MessageDisplay`, twice | the reply's two parts, the one with `index: 1` first |
| 8682 | `Stop` | the reply as `last_assistant_message` |
| 68740 | `Notification` | `notification_type: idle_prompt`, 60.06 s after `Stop` |
| 124906 | `SessionEnd` | `reason: prompt_input_exit` |

These facts bear on the work the frame describes.

- A tool call that Claude Code refuses before it runs sends no `PreToolUse`, no `PostToolUse` and no `PostToolUseFailure`. Only `PostToolBatch` names the call. `apps/desktop/src/daemon/hooks.ts#HOOK_EVENTS` does not list `PostToolBatch`, so Owlery sees no tool at all for such a call. The turn still ended with `Stop`, so the pane would have left `working`.
- `idle_prompt` came 60.06 s after the `Stop` of a finished turn. This matches the hooks reference's "about 60 seconds after a reply".
- The session log is written in batches after the hook events. The lines arrived at 3976 and 4067 ms, after `UserPromptSubmit` at 3920. Then they arrived at 6281 ms, after `PostToolBatch` at 6193, and at 8776 ms, after `Stop` at 8682. Each batch came 56 to 147 ms after the event before it. The driver read the log every 25 ms, so each time is late by 25 ms at most.
- The log gained 59 lines of 17 types, many more than the `user` and `assistant` entries `frame/design.md` *Scope* item 3 reads. Eight of the 59 lines are longer than 16 KB. The longest is an attachment of type `prompt_snapshot` with 137,657 characters on one line. The other long lines include `api-request-shape` with 91,857 characters and `api-request-blob` with 90,344. With the 16 KB bound of `frame/questions.md` Q3, the daemon would leave each of those unread, which is the intended effect.
- Claude Code showed no folder-trust question for the new folder under `/private/tmp`, so the trust step asked nothing. Why no question showed was not looked into.
- In 2.1.331 the hook payloads carry `scratchpad_dir`, `prompt_id`, `permission_mode` and `effort` beside the fields Owlery reads today.

**The first fixture kept every line the log gained, but not every line's content.** At `e6dfe29`, `frame/design.md` *Scope* item 1 named paths only. The raw lines held more than paths: `session-owner` holds the account's UUID and the organization's UUID, the attachments hold the person's instruction files, skill listings and environment, and the `api-request` lines hold the whole request. This repository is a public one. So the fixture's builder replaced the paths with `<transcript_path>`, `<cwd>`, `<scratchpad_dir>` and `<home>`, replaced each thinking block's signature with `<signature>`, and reduced each line whose type is `attachment`, `api-request-shape`, `api-request-blob`, `api-request`, `session-owner`, `data-flow-records` or `cost-state`, and each line whose subtype is `stop_hook_summary`, to its type, its subtype or attachment type, its `isSidechain`, and `redactedCharacters`. The fold at `429d098` wrote that rule into *Scope* item 1.

**How the first driver ran.** It was a Python script that used `pty.fork`, with a terminal of 160 columns and 50 rows. It started `claude --settings <file> --allowedTools "Bash(sleep 60)"` in a new empty folder under the build's scratch directory. It removed every variable whose name starts with `CLAUDE`, `ORCA_` or `TERM_PROGRAM` from the session's environment, and left the person's own settings and plugins in place. Each hook was a command that took its arrival time when it started, appended the event's JSON to one file, printed nothing and exited 0. The driver ran once against a stand-in before the real run. The real session ran once, from the driver's process 41986 with `claude` as process 42027, and `ps` found neither process after the run.

**What the first build left for a second recording.** The step had to ask for a tool call that runs long and that Claude Code does not refuse, and at that build neither the framer nor the crafter had checked which command that is. The orchestrator then judged that a second session records the interruptions (`frame/plan.md` *Judgments of the run*), and the framer rewrote the steps around `ping -c 60 127.0.0.1`.

### The second build

**Q1 is answered (a): the session log gained an interruption entry of `frame/design.md` *Scope* item 3's shape at both interruptions, and no hook event named either one.** Judged against `frame/questions.md` Q1's options. The two entries, as they stand in the fixture:

| Interruption | Entry's text | Its fields beside the text | Length as written, and in the fixture |
|---|---|---|---|
| The reply, Esc at 7718 ms | `[Request interrupted by user]` | `type: user`, `isSidechain: false`, `rowSource: harness`, `interruptedMessageId`, no `interruptedBySendNow` | 773 characters, 606 with the paths replaced |
| The Bash call, Esc at 13898 ms | `[Request interrupted by user for tool use]` | the same fields | 786 characters, 619 with the paths replaced |

Each entry's `message.content` is an array that holds one text block. The second entry's line had not been seen in any log before this recording (`frame/design.md` *Grounding*), and it has the same shape as the first.

**The hook events at each Esc.** Times are milliseconds from the session's start, from the fixture.

- The reply. `UserPromptSubmit` came at 4702. Sixteen `MessageDisplay` events came from 6164 to 7698, one for each streamed part. The driver sent Esc at 7718, 3.02 s after `UserPromptSubmit`. One more `MessageDisplay`, `index: 16`, came at 7815, 97 ms after the Esc. No other hook event came. The log gained four lines in one batch at 7905, 187 ms after the Esc: `data-flow-records`, the assistant's thinking block, the assistant's text "1" to "130" with `isAbortedMidStream: true`, and the interruption entry. The log gained no assistant line while the reply streamed.
- The Bash call. `UserPromptSubmit` came at 10613, and the `PreToolUse` of Bash, with `tool_input.command` `ping -c 60 127.0.0.1` and no `run_in_background`, came at 11861. The driver sent Esc at 13898, 2.04 s after it. No hook event came after the Esc: no `PostToolUse`, no `PostToolUseFailure`, no `PermissionDenied`, no `PostToolBatch` and no `Stop`. The log gained thirteen lines in one batch at 14085, 187 ms after the Esc. In order: `tools-used`, `data-flow-records`, the assistant's `tool_use`, `file-history-snapshot`, the tool result, an attachment of type `prompt_snapshot` with 137,661 characters, the interruption entry, then `last-prompt`, `ai-title`, `mode`, `permission-mode`, `session-owner` and `atis-latch`.
- After the later Esc. No hook event came in the 75.6 s until the driver typed `/exit` at 89505. `SessionEnd` came at 89877. So no `idle_prompt` `Notification` came after an interruption in that time, where the first session's came 60.06 s after a finished turn's `Stop`. This bears on `frame/plan.md` *Alternatives considered*, the row on `idle_prompt`: the recording now shows what that row says nothing read showed.

**Departure from the frame: the Bash call was stopped before its command ran.** `frame/design.md` *Scope* item 1 asks for an interruption "of a running Bash tool call". The driver sent Esc 2 s after the `PreToolUse`, as `frame/plan.md` *How the recording is made (phase 1)* step 4 says. Before the Esc, the screen showed "running PreToolUse hooks… 0/2" for the call and no output of ping. The person's own settings give `PreToolUse` a hook beside the recording's, so two hooks ran for the call. The call's tool result reads "The user doesn't want to proceed with this tool use. The tool use was rejected", with `toolUseResult` "User rejected tool use" and `toolDenialKind` `user-rejected`, and the screen then read "No result recorded for 1 call". So the Esc stopped the call while it waited on its hooks, and the command never ran. Which of the two hooks was still running at the Esc was not read. What Claude Code sends and writes when Esc stops a command that is running is therefore still not recorded. In particular, the recording does not show whether a `PostToolUse` or a `PostToolUseFailure` arrives after such an Esc, the case *Scope* item 5 is written for. *Scope* item 5 holds by rule either way, and scenario 3 of `frame/design.md` drives it with events the case writes. This departure is not one of the differences `frame/plan.md` *Phases* stops phase 2 for: the entry's shape matches *Scope* item 3, and Q1's answer is (a). It goes to `gaps.md` *Not verified* for the orchestrator. Judged against `frame/plan.md` *Phases*, the paragraph after the table, and *How the recording is made (phase 1)*, which allows no further session.

**What else the recording contradicts or adds.**

- `frame/design.md` *Grounding* says the interruption entries read at framing are each under 700 characters. This recording's are 773 and 786 characters as written. The paths in them are long because the session ran in a folder under the scratch directory: `cwd` stands in each of them. Q3's default bound of 16 KB is still over twenty times the longest. Phase 2 picks the bound.
- The model called `ping -c 60 127.0.0.1` in the foreground when asked, and Claude Code did not refuse it before the `PreToolUse`. *Grounding* called that nobody's finding yet. The `python3` command of step 5 was not needed, and the driver sent no prompt for it.
- A Bash call can end at an Esc with no hook event after its `PreToolUse`. A pane whose state went `working` at that `PreToolUse` would therefore stay `working` with no event to move it, which is the defect of issue #182 on this path too.
- The reply's Esc came while Claude streamed text, after 16 parts had shown. No `Stop` arrived before the 3 s were over, so step 2's case of a reply that ends first did not arise.
- Claude Code again showed no folder-trust question for the new folder.

**The recording kept *Scope* item 1's redaction rule.** The fixture's builder is the first build's, with the steps rewritten. Executed: a search of the fixture for the home folder's path, the login name, `/Users/`, `claude-501`, `-Users-`, `accountUuid`, `organizationUuid` and `emailAddress` found nothing. One payload names `<home>/.claude/CLAUDE.md`, the instructions file `InstructionsLoaded` reported, without its content. The log gained no line whose subtype is `stop_hook_summary` this time, because no turn reached `Stop`. Executed: `node -e "JSON.parse(...)"` parsed the fixture.

**How the second driver ran.** It is the first driver with the steps of `frame/plan.md` *How the recording is made (phase 1)* as folded at `429d098`, and `--allowedTools "Bash(ping -c 60 127.0.0.1)" 'Bash(python3 -c "import time; time.sleep(60)")'`. Two choices were not in the plan. After the reply's Esc and its log line, the driver waited 2 s more before the next prompt, so that the prompt line was ready. Where step 4 ends at a background call or at its limit, it waits up to 30 s for that turn's `Stop` before step 5's prompt, so that the prompt does not cut a running turn. That second choice was not exercised in the real session.

- Executed: the driver ran once against a stand-in for `claude` before the real run. The stand-in asks the trust question, streams numbers that Esc stops, refuses the `ping` call by sending a `PostToolBatch` and a `Stop` and no `PreToolUse`, and runs the `python3` call as a `PreToolUse` that Esc stops. The rehearsal went through every step: the trust answer, the reply's Esc, the refused call, step 5's prompt, the Bash call's Esc, the 75 s wait and `/exit`, with 8 events and 9 log lines recorded.
- Executed: the real session ran once, from the driver's process 40294 with `claude` as process 40327. The session's process exited on `/exit` at 90.22 s. After the run, `ps -p 40294,40327` found neither process. No other real session was started.
- The driver, the stand-in, the hook, the fixture's builder, the raw recording and the screen capture stay under `<scratchpad>/1795498003-interrupted-turn-stays-working/phase-1-2/` and are not committed, as `frame/plan.md` says of the driver. The first build's files stay under `phase-1/` beside it.

**What this phase ran, and what it did not.** No source file and no test file changed, and no unit adds behaviour, so this phase owes no `seal mutate` run and no case seen red. Executed: `git grep -n claude-interrupted-turn` outside `seal/` found no file that names the fixture, so no test reads it, and the phase-boundary set of `skills/verify/SKILL.md` *Scope: cheap and often, broad and once* is empty and no test ran. Scenario 8 is for the review to read.
