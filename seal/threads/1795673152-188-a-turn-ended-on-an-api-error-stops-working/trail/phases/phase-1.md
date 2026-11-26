# Phase 1: 1795673152-188-a-turn-ended-on-an-api-error-stops-working

## What this phase found

**The frame held against the tree.** Each coordinate of `frame/design.md` *Grounding* and `frame/plan.md` *Technical context* was opened at HEAD and stood as stated: `HOOK_EVENTS` in `hooks.ts`, `CLAUDE_CODE` and `CLAUDE_CODE_SAID` in `agent-events.ts`, `AgentEvent` in `protocol.ts` and the exhaustive switch of `agentStateAfter`. `Daemon#agentEvent` needed no change, as the frame said: the case that feeds it `StopFailure` and then appends an interruption entry to the log shows the watch ends and the session stays `waiting`. No departure from the frame. The frame's one tree statement that a later commit moves is the line numbers it cites (`daemon.ts:658`, `daemon.test.ts:2745` and the like); none is false in kind.

**Each new case was seen red against the tree without the change, then green.** The cases were written first and run against the unchanged source (`seal` run through the machine's runner, exit 1 for each file):

- `agent-state.test.ts`, "is waiting after a turn that ended on an error": `expected undefined to be 'waiting'`.
- `agent-events.test.ts`, "reads the error text of a Claude Code turn that ended on an API error": the text was `null`.
- `hooks.test.ts`, "adds one command hook for every event": `expected [...] to include 'StopFailure'`. The matcher `*` assertion added to that case is green before and after, and pins what the scenario table names.
- `daemon.test.ts`, "maps each Claude Code hook": `expected undefined to be 'turn-failed'`.
- `daemon.test.ts`, "lists a Claude Code session whose turn ended on an API error as waiting ...": timed out at the inbox, the session staying `working`.
- `daemon.test.ts`, "reads no session log of a pane whose turn ended on an API error ...": the state was `working` with no text, and the log's watch was still on.

The two lists of every event in `agent-state.test.ts` (the interrupted-state case and the `asks` case) gain `"turn-failed"`. Both pass against the old source as well, because the old function returned `undefined` for both sides of the first and `asks` returns `waiting` first in the second, so they pin nothing of the new arm; the case "is waiting after a turn that ended on an error" does.

**A case's own mistake, found by running it.** The first form of the daemon case read the later inbox through `c.message("inbox", state === "working")`, which matched the inbox the first prompt had already sent, so its `stateSince` was 100 and not 300. The case reads the listing a fresh client is given, as the neighbouring case "carries with a session's state the time it began" does.

**Mutation.** `seal mutate` over each unit that adds behaviour, each run `red` (exit 0) and the file restored by the tool: the `StopFailure` entry of `HOOK_EVENTS` removed (`hooks.test.ts`, 1 failed), the `turn-failed` arm moved onto `turn-end` (`agent-state.test.ts`, 2 failed), the `StopFailure` entry of `CLAUDE_CODE_SAID` removed (`agent-events.test.ts`, 1 failed), and the `StopFailure` entry of `CLAUDE_CODE` removed (`daemon.test.ts` "maps each Claude Code hook", 1 failed).

**Run.** Both the narrow files and the daemon cases were run through the package's own runner (`node scripts/test-in-electron.mjs <files>`, and `-t` with the cases' names for `daemon.test.ts`), because `daemon.test.ts` loads `node-pty`, which only Electron's Node loads. The package's `tsc --noEmit` also ran, exit 0. The whole suite and the repository-wide checks are the orchestrator's broad gate.

**Q1 stays not run.** The fixture `claude-stop-failure.json` is the hooks reference's example with the page's date and the CLI's version, and says in its `taken` field that it was not recorded from a session. That a real session sends this event in this shape with no `Stop` after it is carried to `gaps.md`.
