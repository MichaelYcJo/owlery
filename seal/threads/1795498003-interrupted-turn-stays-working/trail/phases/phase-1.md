# Phase 1: 1795498003-interrupted-turn-stays-working

## What this phase found

**The recording holds no interruption, so Q1 stays open and no phase 2 is built on it.** Claude Code 2.1.331 refused the Bash call `sleep 60` that `frame/plan.md` *How the recording is made (phase 1)* step 2 asks for. The tool result was "Blocked: standalone sleep 60. To wait for a condition, use Monitor with an until-loop (e.g. `until <check>; do sleep 2; done`). To wait for a command you started, use run_in_background: true. Do not chain shorter sleeps to work around this block." No tool was running at 2 seconds after the call, so the driver had nothing to interrupt. It waited the 120 seconds it allows for a `PreToolUse` of Bash, then ended the session with `/exit`. It sent no Esc and no second prompt. The owner allowed one real session, and the spawn said to start no second one if it failed, so none was started. This is a departure from the frame: plan step 2 cannot be run as written against 2.1.331. Judged against `frame/plan.md` *Phases*, the paragraph after the table, which says the crafter builds no phase 2 on a recording that differs from the frame.

**The frame was checked before the session, and the check did not catch this.** Executed before the session: `claude --version` printed `2.1.331 (Claude Code)`, the version `frame/design.md` *Grounding* names. `apps/desktop/test/fixtures/` held no `claude-interrupted-turn.json`. The hooks reference listed 33 hook events, the count *Grounding* gives. None of these reads could show that Claude Code refuses a standalone `sleep` in its Bash tool. The refusal showed only when the real session ran.

**Where the refusal comes from is inferred, not read.** The settings file gave a hook to all 33 events, and no `PreToolUse` arrived for the call. Every `PreToolUse` hook of the settings and of the person's own settings runs side by side. So a hook that denied the call would still have let this hook record a `PreToolUse`. The refusal therefore came before the hooks ran, from Claude Code itself. A search of the installed executable for the message's words found nothing in plain text, so the code that refuses was not opened. Which commands the refusal covers is not known: the message names a standalone `sleep` and also forbids chained shorter sleeps.

**What the one session did record**, at milliseconds from the start of the session, from `apps/desktop/test/fixtures/claude-interrupted-turn.json`:

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

These facts bear on the work the frame describes. The framer should read them when it folds the plan.

- A tool call that Claude Code refuses before it runs sends no `PreToolUse`, no `PostToolUse` and no `PostToolUseFailure`. Only `PostToolBatch` names the call. `apps/desktop/src/daemon/hooks.ts#HOOK_EVENTS` does not list `PostToolBatch`, so Owlery sees no tool at all for such a call. The turn still ended with `Stop`, so the pane would have left `working`.
- `idle_prompt` came 60.06 s after the `Stop` of a finished turn. This matches the hooks reference's "about 60 seconds after a reply". Whether it also comes after an interruption is still unrecorded.
- The session log is written in batches after the hook events. The lines arrived at 3976 and 4067 ms, after `UserPromptSubmit` at 3920. Then they arrived at 6281 ms, after `PostToolBatch` at 6193, and at 8776 ms, after `Stop` at 8682. Each batch came 56 to 147 ms after the event before it. The driver read the log every 25 ms, so each time is late by 25 ms at most.
- The log gained 59 lines of 17 types, many more than the `user` and `assistant` entries `frame/design.md` *Scope* item 3 reads. Eight of the 59 lines are longer than 16 KB. The longest is an attachment of type `prompt_snapshot` with 137,657 characters on one line. The other long lines include `api-request-shape` with 91,857 characters and `api-request-blob` with 90,344. With the 16 KB bound of `frame/questions.md` Q3, the daemon would leave each of those unread, which is the intended effect. The bound is still the work of phase 2, which is not built.
- Claude Code showed no folder-trust question for the new folder under `/private/tmp`, so plan step 1 asked nothing. The screen capture holds no "trust". Why no question showed was not looked into.
- In 2.1.331 the hook payloads carry `scratchpad_dir`, `prompt_id`, `permission_mode` and `effort` beside the fields Owlery reads today.

**The fixture keeps every line the log gained, but not every line's content.** `frame/design.md` *Scope* item 1 asks that no path under the person's home folder stand in the fixture. The raw lines held more than paths. `session-owner` holds the account's UUID and the organization's UUID. The attachments hold the person's instruction files, skill listings and environment. The `api-request` lines hold the whole request. This repository is a public one, and none of that belongs in it. So the fixture's builder made these changes:

- It replaced the paths with `<transcript_path>`, `<cwd>`, `<scratchpad_dir>` and `<home>`.
- It replaced each thinking block's signature with `<signature>`.
- It reduced each line whose type is `attachment`, `api-request-shape`, `api-request-blob`, `api-request`, `session-owner`, `data-flow-records` or `cost-state`, and each line whose subtype is `stop_hook_summary`, to its type, its subtype or attachment type, its `isSidechain`, and `redactedCharacters`, the length of the line as written.

The `user`, `assistant`, `system` `turn_duration` and bookkeeping lines stand as written, with the paths replaced. Judged against `frame/design.md` *Scope* item 1. That item names paths only, so dropping the content of those types goes beyond what it asks, and the fixture's `steps` say so. Executed: a search of the fixture for the home folder's path, the login name, `/Users/`, `accountUuid`, `organizationUuid` and `.orca` found nothing. One field names `<home>/.claude/CLAUDE.md`, the instructions file `InstructionsLoaded` reported, without its content.

**How the driver ran, and what departs from the plan.** These facts are for a later recording.

- The driver was a Python script that used `pty.fork`, with a terminal of 160 columns and 50 rows. It started `claude --settings <file> --allowedTools "Bash(sleep 60)"` in a new empty folder under this phase's scratch directory. The `--allowedTools` flag is not in the plan. It was added so that a permission dialog could not spend the one session. The driver also answered a permission dialog with Enter wherever one showed, and none showed.
- The driver removed every variable whose name starts with `CLAUDE`, `ORCA_` or `TERM_PROGRAM` from the session's environment. Without that, the session would start as a child of the Claude Code session that runs this agent, and the person's Orca hooks would report it to Orca. The person's own settings and plugins stayed in place, as they do for a pane of the app.
- Each hook was a command that took its arrival time when it started, appended the event's JSON to one file, printed nothing and exited 0. No hook had a matcher.
- Executed: the driver ran once against a stand-in for `claude` before the real run. The stand-in was a script that asks the trust question, runs the hooks, writes a log, and answers Esc. Every step passed: 5 events and 6 log lines, with both Esc presses read. After that run, the driver's two dialog patterns were widened to allow for missing spaces in the stripped screen text. The widened patterns were checked against four sample strings and not against the stand-in again.
- Executed: the real session ran once, from the driver's process 41986 with `claude` as process 42027. The session's process exited on `/exit` at 125.21 s. After the run, `ps` found neither process.
- The driver, the stand-in, the hook, the fixture's builder, the raw recording and the screen capture stay in `<scratchpad>/1795498003-interrupted-turn-stays-working/phase-1/` and are not committed, as `frame/plan.md` says of the driver.

**What a second recording needs, for the orchestrator and the framer.** Plan step 2 has to ask for a tool call that runs long and that Claude Code does not refuse. Neither the framer nor this phase has checked which command that is. A second real session needs the owner's permission, because the permission given on 2026-11-24 covered one session. Until then, Q1's default (a) rests on what it rested on at framing: the reference and the ten entries read in this machine's logs.

**What this phase ran, and what it did not.** No source file and no test file changed, and no unit adds behaviour, so this phase owes no `seal mutate` run and no case seen red. No test file reads `apps/desktop/test/fixtures/claude-interrupted-turn.json`, and the repository names no tree-wide test files, so the phase-boundary set of `skills/verify/SKILL.md` *Scope: cheap and often, broad and once* is empty and no test ran. Executed: `node -e "JSON.parse(...)"` parsed the fixture. Scenario 8 is for the review to read. The fixture names the version, the date and the steps, and it holds no path under a home folder.
