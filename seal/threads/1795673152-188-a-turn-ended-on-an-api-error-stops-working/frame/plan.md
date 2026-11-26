# Implementation Plan: a turn that ends on an API error stops working

## Technical context

The tree as read at `ba605aec`.

The work builds on four places, each a list or a switch that names the hook events one by one:

- `apps/desktop/src/daemon/hooks.ts:15`, `HOOK_EVENTS`: the events `hookSettings` (`:50`) registers a relay hook for. `writeHookSettings` (`:57`) and `writePaneSettings` (`:80`) both write what `hookSettings()` returns.
- `apps/desktop/src/daemon/agent-events.ts:5`, `CLAUDE_CODE`, and `:21`, `CLAUDE_CODE_SAID`: the hook's name to the neutral event, and the field a person reads of it.
- `apps/desktop/src/shared/protocol.ts:9`, `AgentEvent`.
- `apps/desktop/src/daemon/agent-state.ts:14`, `agentStateAfter`: an exhaustive switch over `AgentEvent`.

`Daemon#agentEvent` (`apps/desktop/src/daemon/daemon.ts:658`) needs no change. It ends the watch of the session log and writes the state, its time and its text for any mapped event that leaves the session not working.

Constraints: the protocol names no vendor (`docs/architecture.md` *Rules that keep it portable*), so the hook's name stays in `agent-events.ts` and `hooks.ts`. The daemon outlives the app, so a pane launched under a daemon of an earlier build keeps a settings file without the new hook (`frame/design.md` *Scope*, Out).

The failure scenario of the chosen approach: Claude Code renames the event, stops sending it, or sends `Stop` after it. A rename or a stop returns the defect, and no case of the tree would fail, because the fixture is the reference's example and not a session. A `Stop` after it would turn the session from waiting to finished with the same text. `frame/questions.md` Q1 holds the one run that would show which of these a real session does.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| A new neutral event `turn-failed` that leaves the session `waiting`, with the error's text as the state's text | A person who reads "Needs you" on an overloaded-server error has nothing to answer and only asks again. | Chosen. The agent did not finish, and what moves the session on is the person: asking again, signing in or waiting out a limit. `docs/architecture.md` *Overall layout* already leaves an interrupted turn waiting on the same ground, and `view.ts#notificationFor` tells the person as for any wait. |
| Map `StopFailure` to the existing `turn-end`, so the session reads `finished` | The inbox lists under "Finished" a session whose work stopped half way, with "API Error: …" as its last reply. A person who clears finished lines by habit loses the work, and the summary counts it as finished. | Rejected. It is the smallest change, one entry in each of two maps, and it states something false of the session. |
| Map `StopFailure` to the existing `notification`, which already leaves a session waiting, and add no value to the protocol | A client that reads the `agent` messages, as the phone will, cannot tell an error from a notification, and the map's text field for `Notification` is `message`, which this event does not carry. | Rejected. The value costs one line of the protocol and one arm of the switch. |
| A fourth state, such as `failed`, with its own word and mark | Every theme's marks, `STATES_BY_URGENCY`, the summary's sentence and `docs/design.md` change for a state a person answers exactly as they answer a wait. | Rejected for this work. `AgentState` keeps its three values, the premise `docs/product.md` states ("working, waiting for the person or finished") and the grounds checked in `frame/design.md` *Grounding*. |
| Replace the lists that name the events: register a hook for every event Claude Code has, and map by a rule in place of a table | Each of the 34 hook events Claude Code 2.1.332 declares would start a `nc` per occurrence in every pane, tool batches and file changes among them, for events the daemon then drops. A rule that guesses a state from an unknown name decides on a spelling. | Rejected. The lists stay, because each entry is a decision about what a state means. The premise is that the events that end or pause a turn are few and named in the reference, read on 2026-11-26: `Stop`, `StopFailure`, and the interruption, which has no event. |
| Read the API error from the session log, as the interruption is read | The log's format is not public, and the hook exists and carries the text. | Rejected. The log is read only where no hook says what happened. |
| Record the event from a real session against a local stand-in for the API, in this work | The run needs a real `claude` process, which `routing.md` keeps out of this work unless a question names it. | Left as `frame/questions.md` Q1, default not run. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1 to 6 and 8 of `frame/design.md`, in one commit set: the cases first, each seen red, then the code. Item 7 is the settle's. | The cases `frame/design.md` *User scenarios & acceptance* names, run narrow through the machine's runner of heavy commands: `pnpm --filter @owlery/desktop exec vitest run test/agent-state.test.ts test/agent-events.test.ts test/hooks.test.ts`, and the new and changed cases of `test/daemon.test.ts` by their names with `-t`. Where the package's own runner (`scripts/test-in-electron.mjs`) is the only way a case of `daemon.test.ts` runs, the builder runs it with the file and the names as its arguments and says so in the phase record. The typecheck and the whole suite are the orchestrator's broad gate. | |

## Overlap with the release

The spawn names #78 and #133, which were being framed, and #231, near its gate. Read: each issue's body, and each branch's files against `e9fe914c` (`git diff --name-only e9fe914c...<branch>`, executed, exit 0). The branches of #78 (`845a3e7a`) and #133 (`f2b74826`) held only their `routing.md`, so what they will change is read from their issues and not from a frame.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #231 | `apps/desktop/src/shared/protocol.ts` and `apps/desktop/test/daemon.test.ts`. At `351f1bac` its hunks stand at `protocol.ts:846` to `:961` and `daemon.test.ts:6528` to `:7175`; this work changes `protocol.ts:9` to `:19` and adds cases in `describe("the inbox")`, near `daemon.test.ts:2745` to `:3222`. No hunk is shared. | #231 | It is near its gate and will be sealed first. Git merges the two without a conflict, and this work's rounds have not begun, so merging the release branch into this branch costs it nothing. |
| #133 | By its issue it changes the daemon's start and its replacement, so `apps/desktop/src/daemon/daemon.ts`, `protocol.ts` and `docs/architecture.md` *What a session survives* are likely. This work leaves `daemon.ts` unchanged and adds a rule to *Overall layout*, another section, through the settle. It also meets #133 in a fact: which daemon serves a pane decides whether the pane's settings hold the new hook (`frame/design.md` *Scope*, Out). | #188 | This work is one phase and will be sealed first. #133 reads none of what it adds. |
| #78 | Nothing. By its issue it changes packaging, signing and the release workflow. | either | No file and no fact is shared. |

## Operational impact

No migration, no new environment variable and no new dependency. The version does not move here: `routing.md` gives the move to 0.1.0 to the release's own work item. A deployer's one fact: a Claude Code pane that was launched before the daemon of this build started does not report an API error, and it does after the daemon restarts and the pane is launched again.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
