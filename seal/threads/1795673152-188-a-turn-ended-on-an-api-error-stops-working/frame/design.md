# Design: a turn that ends on an API error stops working

## Grounding

The tree as read at `ba605aec`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/product.md` *Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call*, "The app reads only what the inbox needs" | A session is working, waiting for the person or finished, and Claude Code reports which through hooks. The work adds no fourth state. |
| `docs/architecture.md` *Overall layout*, "A turn the person interrupts leaves its session waiting for the person, read from the session log" | A turn that ended without the agent finishing leaves its session waiting, not finished. That rule covers the interruption alone, and no sentence of the policy root names an API error. |
| `docs/architecture.md` *Rules that keep it portable*, as the head comment of `apps/desktop/src/shared/protocol.ts` cites it | The protocol carries no vendor's name. `StopFailure` reaches a client as a neutral `AgentEvent` value. |
| `docs/design.md` *The voice of the window's words*, "A state is two words at most" | The window names the state by its existing words, "Needs you". The work adds no word and no mark. |

**The cause, read in the code.** `apps/desktop/src/daemon/hooks.ts#HOOK_EVENTS` lists the hook events of the settings Owlery hands `claude`, and `StopFailure` is not among them, so Claude Code runs no hook of Owlery's for it and the daemon is never told. `apps/desktop/src/daemon/agent-events.ts#agentEventFor` maps a hook's name to a neutral event and returns `undefined` for a name outside its map, and `Daemon#agentEvent` (`apps/desktop/src/daemon/daemon.ts:658`) returns at `:664` for such a name before it reads a state. So the session keeps the `working` that its `UserPromptSubmit` or its last tool event gave it. Both places must change: the first so the event arrives, the second so it is read.

**Where the hooks are registered.** `hooks.ts#hookSettings` builds one command hook, with the matcher `*`, for each name of `HOOK_EVENTS`. `hooks.ts#writeHookSettings` writes that into the file every pane shares, and `hooks.ts#writePaneSettings` writes the same hooks with `enabledPlugins` into the file of a pane that carries the owl chain. Both read `hookSettings()`, so one new name in `HOOK_EVENTS` reaches both files. The role bundle's `apps/desktop/role-bundle/hooks/hooks.json` holds one `PreToolUse` hook on `AskUserQuestion` and forwards no event to the daemon. A headless session runs with `disableAllHooks: true` (`apps/desktop/src/daemon/adapters/claude.ts:92`) and takes its state from its process, so it is outside this work.

**The event's shape.**

| Fact | Source | Label |
|---|---|---|
| `StopFailure` "Runs instead of Stop when the turn ends due to an API error", and *Stop* says "API errors fire StopFailure instead." | Claude Code's hooks reference, `https://code.claude.com/docs/en/hooks.md`, sections *StopFailure* and *Stop*, fetched 2026-11-26 with `curl -sL` (exit 0). The page names no version of its own. | executed |
| The input holds the common fields and `error`, optional `error_details` and optional `last_assistant_message`. For `StopFailure`, `last_assistant_message` "contains the API error string itself, such as `"API Error: Rate limit reached"`". The reference's example is `{"session_id": "abc123", "transcript_path": "/Users/.../.claude/projects/.../00893aaf-19fa-41d2-8238-13269b9b3ca0.jsonl", "cwd": "/Users/...", "hook_event_name": "StopFailure", "error": "rate_limit", "error_details": "429 Too Many Requests", "last_assistant_message": "API Error: Rate limit reached"}`. | the same page, *StopFailure input* | executed |
| The matcher `*` matches every occurrence of an event. The narrower rule the page states for `StopFailure` is about a matcher that names error types. | the same page, *Matcher patterns* | executed |
| The CLI installed on the framing machine, Claude Code 2.1.332 (`claude --version`), declares the input as `hook_event_name: "StopFailure"`, `error` of an enumeration, `error_details` an optional string and `last_assistant_message` an optional string. Its enumeration of `error` holds `authentication_failed`, `oauth_org_not_allowed`, `account_on_hold`, `verification_required`, `billing_error`, `rate_limit`, `overloaded`, `invalid_request`, `model_not_found`, `server_error`, `unknown`, `max_output_tokens` and `cloud_credential_error`. The page's list holds neither `verification_required` nor `overloaded`. | `strings -n 8` over the CLI's binary (exit 0), then `grep -c -F` for the schema's text and for the enumeration's text (each printed 1, exit 0) | executed |
| That a real session sends this event, in this shape, with no `Stop` after it. | Nobody ran it. No API error can be made on demand without a real `claude` session, which `routing.md` *Why this way* keeps out of this work unless `frame/questions.md` names one. | unverified; `frame/questions.md` Q1, the owner |

**What the window does with the state.** `apps/desktop/src/renderer/view.ts#notificationFor` raises a notification where a session's state becomes `waiting` or `finished`, with the state's words as its body. The inbox, the view and the pane's foot read `SessionInfo.state` and `stateText` from the `inbox` message. The renderer draws nothing for an `agent` message (`apps/desktop/src/renderer/renderer.ts:2060`), so a new value of `AgentEvent` changes no drawing code.

**Searches.** `git grep -n "StopFailure" e9fe914c -- .` prints nothing (executed, exit 1): nothing in the tree before this work item reads the event. At `ba605aec` the one match is `routing.md` of this work item.

**The issue.** `gh issue view 188 --json body,comments` (executed, exit 0): the body as quoted in *User scenarios & acceptance*, and no comment. The frame of #182 that the issue cites left the tree with its work item's directory. What it decided stands in `docs/architecture.md` *Overall layout* and in `agent-state.ts`.

No check of the repository's was run for this frame: no test, no typecheck and no gate.

## Scope

In:

1. `apps/desktop/src/daemon/hooks.ts#HOOK_EVENTS` gains `"StopFailure"`, so the shared settings file and a pane's own settings file each hold a hook for it.
2. `apps/desktop/src/shared/protocol.ts`, `AgentEvent`, gains the value `"turn-failed"`: the agent's turn ended on an error of its provider before the agent finished.
3. `apps/desktop/src/daemon/agent-events.ts` maps `StopFailure` to `"turn-failed"`, and reads `last_assistant_message` as the text of the event, as it does for `Stop`. A `StopFailure` whose input names an `agent_id` fired inside a subagent, and maps to no event.
4. `apps/desktop/src/daemon/agent-state.ts#agentStateAfter` gives `"waiting"` for `"turn-failed"`, whether or not the state began at an interruption. Its docstring says so.
5. A fixture, `apps/desktop/test/fixtures/claude-stop-failure.json`, holds the event as the hooks reference gives it: the example's payload, the page's address, the date it was read, the version of the CLI whose declared input was read beside it, and the sentence that the event was taken from the reference and not recorded from a session.
6. Cases hold items 1 to 4, the daemon's among them: fed the fixture's event after a prompt, a session leaves `working` for `waiting`, its `stateText` is the fixture's error text, the watch of its session log ends, and a prompt after it returns the session to `working`.
7. The rule of *Rule changes*, in both editions of `docs/architecture.md`, which the settle writes.
8. The changelog fragment names what a person sees: a session whose turn ended on an API error says "Needs you" with the error's text.

Out:

- **A recorded event from a real session.** No real `claude` session runs in this work (`routing.md` *Why this way*). `frame/questions.md` Q1 holds the one way to record it, with the default of not running it.
- **A word or a mark of its own for a failed turn.** The session waits under the existing words, and the error's text stands where a state's text stands. A fourth state would change `AgentState`, every theme's marks and `docs/design.md`.
- **A reading of `error` or `error_details`.** Where Claude Code sends no `last_assistant_message`, which its declared input allows, the session waits with no text. The reference says the field holds the error string for this event.
- **A pane launched before the daemon holds this change.** `claude` took its settings file at its launch, and a daemon that an update left running wrote that file without the new hook. Such a pane reports the event after the daemon restarts and the pane is launched again. Issue #133 owns which daemon serves a newer app.
- **A headless session and a role session.** They run without hooks and end with their process, whose exit the daemon reads.
- **The phone's reading of `last_assistant_message`** (`docs/architecture.md` *The phone: the terminal session as a chat*), which the phone's own work owns.
- **`SubagentStop` and every other hook event the daemon does not map.** `agentEventFor` drops them as before.

## User scenarios & acceptance *(mandatory)*

The issue's *Done when*: "A Claude Code turn that ends on an API error leaves its session not working in the inbox, the view and the pane's foot." and "A case holds it with the event Claude Code sends for it, recorded or taken from the hook reference with its version named."

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A turn ends on an API error | Given a Claude Code pane whose session is working. When `StopFailure` arrives for the pane, as the fixture holds it. Then the next `inbox` lists the session `waiting`, with `stateText` "API Error: Rate limit reached", `stateTool` null and a new `stateSince`. The inbox, the view and the pane's foot draw from that one message. | A case of `apps/desktop/test/daemon.test.ts`, in `describe("the inbox")`, that reads the fixture and calls `Daemon#agentEvent`. |
| The person asks again | Given that session, waiting. When `UserPromptSubmit` arrives. Then the session is working. | The same case. |
| The log is no longer watched | Given a working session whose log is watched. When `StopFailure` arrives and an interruption entry is appended to the log afterwards. Then no `interrupted` event follows. | A case of `apps/desktop/test/daemon.test.ts`, beside "reads no session log of a pane that is not working". |
| The event reaches the daemon | Given the settings `hookSettings()` builds. Then they hold a command hook for `StopFailure` with the matcher `*`, and a pane's own settings file holds the same. | `apps/desktop/test/hooks.test.ts`, the case "adds one command hook for every event the inbox and the phone read", with `StopFailure` in its list. The existing cases that compare a written file with `hookSettings()` hold the pane's file. |
| The neutral event and its state | `agentEventFor("StopFailure")` is `"turn-failed"`. `agentSaid("StopFailure", <the fixture's payload>)` gives the error text, no tool and no question. `agentStateAfter("turn-failed")` is `"waiting"`, also with `interrupted` true, and with `asks` true as every event is. | `apps/desktop/test/daemon.test.ts` "maps each Claude Code hook Owlery listens to, and drops any other"; `apps/desktop/test/agent-events.test.ts`; `apps/desktop/test/agent-state.test.ts`, whose lists of every event gain the value. |
| The person is told | Given a window that is not in front. When the session's state becomes `waiting` at the event. Then a notification is raised as for any wait. | Held already by the cases of `notificationFor` in `apps/desktop/test/view.test.ts`, which read the state and not the event. No new case. |

Each new case is shown red before it is committed: against the tree without the item of *Scope* it holds.

## Data & interfaces

- `apps/desktop/src/shared/protocol.ts`: `AgentEvent` gains `"turn-failed"`, with a comment in the form of the one on `"interrupted"`. The `agent` message carries it. No message is added and none changes its shape. A window of an earlier build draws nothing for an `agent` message, so the new value changes nothing there.
- `apps/desktop/src/daemon/agent-events.ts`: `CLAUDE_CODE` gains `StopFailure: "turn-failed"`, and `CLAUDE_CODE_SAID` gains `StopFailure: { text: "last_assistant_message" }`.
- `apps/desktop/src/daemon/agent-state.ts#agentStateAfter`: the arm of `"permission"`, `"notification"` and `"interrupted"` gains `"turn-failed"`. The function's switch is exhaustive over `AgentEvent`, so the typecheck refuses a build that adds the value and no arm.
- `apps/desktop/src/daemon/hooks.ts#HOOK_EVENTS`: gains `"StopFailure"`. The files `claude-hooks.json` and `claude-pane-<id>.json` of the run folder gain one key under `hooks`.
- `apps/desktop/src/daemon/agent-events.ts#agentEventFor` takes the hook's payload beside its name, so a `StopFailure` that carries `agent_id` maps to no event, and `apps/desktop/src/daemon/daemon.ts#agentEvent` passes the payload to it. Beyond that call, `agentEvent` does not change: it ends the log's watch and sets the state, its time and its text for any event that leaves the session not working.
- `apps/desktop/test/fixtures/claude-stop-failure.json`: `{ "source": <the page's address>, "readAt": "2026-11-26", "claudeCode": "2.1.332", "taken": <the sentence of Scope item 5>, "payload": <the reference's example> }`.

## Rule changes

- add
  file: docs/architecture.md
  section: Overall layout
  to: - **A turn that ends on an API error leaves its session waiting for the person.** Claude Code runs its `StopFailure` hook in place of `Stop` for such a turn, and also for a subagent's turn that ends on an API error, whose input then names the subagent's `agent_id`; the daemon reads only the session's own, and the hook's input holds the error's kind in `error` and the error's text, as the pane shows it, in `last_assistant_message`. The daemon reads the event as a turn that failed: the session waits, and the inbox shows the error's text. The agent did not finish what it was asked, so the session is not called finished. `apps/desktop/test/fixtures/claude-stop-failure.json` holds the event as Claude Code's hooks reference gives it and names the date the reference was read and the version of Claude Code whose declared input was read beside it.
    check: apps/desktop/test/agent-state.test.ts apps/desktop/test/agent-events.test.ts apps/desktop/test/hooks.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/architecture.ko.md
  section: 전체 구성
  to: - **API 오류로 끝난 턴은 그 세션을 사람을 기다리는 상태로 둡니다.** Claude Code는 이런 턴에서 `Stop` 대신 `StopFailure` 훅을 실행하고, API 오류로 끝난 서브에이전트의 턴에서도 실행하며, 그때 입력에 서브에이전트의 `agent_id`가 들어 있습니다. 데몬은 세션 자신의 것만 읽고, 훅의 입력은 오류의 종류를 `error`에, 칸에 보이는 오류의 글을 `last_assistant_message`에 담습니다. 데몬은 이 이벤트를 실패한 턴으로 읽습니다. 세션은 사람을 기다리고, 작업함은 오류의 글을 보여 줍니다. 에이전트가 시킨 일을 끝내지 못했으므로 세션을 끝났다고 하지 않습니다. `apps/desktop/test/fixtures/claude-stop-failure.json`에 Claude Code의 훅 문서가 적은 대로의 이벤트가 들어 있고, 문서를 읽은 날짜와 입력 선언을 함께 읽은 Claude Code의 버전도 그 파일에 적혀 있습니다.
    check: apps/desktop/test/agent-state.test.ts apps/desktop/test/agent-events.test.ts apps/desktop/test/hooks.test.ts apps/desktop/test/daemon.test.ts

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The sentence that the agent is "finished at the end of its turn", read as covering every end of a turn | The docstring of `apps/desktop/src/daemon/agent-state.ts#agentStateAfter` | Rewritten in place (*Scope* item 4): a turn that ended on an error leaves the agent waiting. |

The work takes no code, no case and no rule out of the tree. It adds a value of `AgentEvent` and a hook's name to lists that exist, and no gate, check or mark. The rule it adds to the policy root replaces none: the policy root stated nothing of an API error (*Grounding*).

Framed 2026-11-26 by framer, before the build.
