# Design: an interrupted turn leaves its session not working

Issue #182. A Claude Code turn the person interrupts leaves its pane's session `working`, because the daemon moves a session out of `working` only at a hook event and Claude Code sends none at an interruption.

## Grounding

The tree as read at `29eaf46`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Overall layout*, "Agent state is judged from events, never guessed from what the terminal screen prints." | The interruption is not read from the pane's output, although the pane prints "Interrupted". The same bullet ends "When the app puts a decision in front of a person, it must never do so by mistake", so a session is moved to waiting only on a reading that is exact |
| `docs/architecture.md` *The phone: the terminal session as a chat*, "state and content come from events and files, never from guessing at what the screen prints", and the table row on the session log: "Its format is not public, so the phone reads it only as a supplement. When the daemon cannot parse it, the phone shows the hook events alone" | A file Claude Code writes is a source the policy allows. The session log's format is not public, so a line the daemon cannot read changes nothing and the hook events alone decide, as today |
| `docs/architecture.md` *Overall layout*, the rule on a pane that sent no event 10 seconds after its start, held by `apps/desktop/test/daemon.test.ts` | A CLI that asks the person something and sends no event is shown as waiting. An interrupted Claude Code asks "What should Claude do instead?" and sends no event, so the same state is its state |
| `docs/architecture.md` *Rules that keep it portable*, rule 1 | What the daemon sends of the interruption is a neutral event, with no field of Claude Code's |
| `docs/architecture.md` *Memory design*, "a feature costs nothing while nobody uses it" | The session log is watched only while the pane is working, and the watch holds nothing of the log |
| `docs/design.md` *The voice of the window's words* | The session's text at an interruption is a whole sentence, and the state's words stay "Needs you" |

What the code does at `29eaf46`, read:

- `apps/desktop/src/daemon/agent-state.ts#agentStateAfter` gives a state from one event: `prompt`, `tool-start`, `tool-end` and `tool-failed` give `working`, `permission` and `notification` give `waiting`, `turn-end` gives `finished`.
- `apps/desktop/src/daemon/hooks.ts#HOOK_EVENTS` lists the eight hooks a pane's `claude` is given, and `apps/desktop/src/daemon/agent-events.ts#agentEventFor` maps each to a neutral event. `Stop` is the only one that maps to `turn-end`.
- `apps/desktop/src/daemon/daemon.ts#agentEvent` keeps the state in `Session.info.state` and reads the payload's `tool_name` and what `agentSaid` reads. It reads no `transcript_path`.
- The readers of a pane's `working` state are `daemon.ts#works`, which `daemon.ts#whyNoChain` and the commit of a person's word ask, `keep-awake.ts#wantsAwake`, `renderer/view.ts#closeAsks`, and the lines and the foot the window draws from `SessionInfo.state`. Each reads `SessionInfo.state` and nothing else of the pane, so a session that leaves `working` leaves it for all of them.
- `renderer/view.ts#notificationFor` shows no notification for a pane in front of a focused window, so the person who pressed Esc in the pane gets none.

What Claude Code does at an interruption:

- read, Claude Code's hooks reference (`https://code.claude.com/docs/en/hooks`, 2026-11-24), *Stop*: "Does not run if the stoppage occurred due to a user interrupt. API errors fire StopFailure instead."
- read, the same reference, *PostToolUseFailure*, the field `is_interrupt`: "True when the failure reached Claude Code as an abort rather than as an error the tool reported. Cancelling a running tool does not fire this hook; the tool result carries the interruption message instead". *PostToolUse after an interrupt* says of `Esc`: "you cancel the hooks at once".
- read, the same reference: its table of hook events holds 33 names, and none is described as sent at an interruption.
- executed, `grep -h -r --include='*.jsonl' -F '"text":"[Request interrupted by user'` over this machine's session logs of this repository under `~/.claude/projects/`, each line read with `jq`: an interruption stands in the log as one line whose `type` is `user` and whose `message.content` is one text block, `[Request interrupted by user]`. Ten such lines were found, written by Claude Code 2.1.327, 2.1.330 and 2.1.331, each under 700 characters. The five of 2.1.327 carry `interruptedBySendNow: true`. The one main-conversation line of 2.1.331 carries `interruptedMessageId` and no `interruptedBySendNow`. The four whose `isSidechain` is true stand in a subagent's own log file.
- executed, `LC_ALL=C grep -a -c` over the installed executable of Claude Code 2.1.331: it holds `[Request interrupted by user for tool use]`, `interruptedBySendNow` and `interruptedMessageId`. No log read holds the first of them, so its line's shape is not seen yet.
- executed, `claude --version` on 2026-11-24: `2.1.331 (Claude Code)`. No session was started.
- executed, the probe `test_tmp_watch.cjs` under the framer's scratch directory, run once with Node v26.13.1 on this Mac: `fs.watch` on a file reported each of five appends another process made, within 1 ms of each. The daemon runs on Electron 45's Node, which the probe did not run.
- nobody's finding yet: which hook events arrive after an Esc, in what order beside the log's line, and how soon the line is written. The recording of *Scope* item 1 answers it (`frame/questions.md` Q1).

The ticket: `gh issue view 182 --json title,body,comments`, run by the framer on 2026-11-24. Its two comments say that the issue moved to release 0.0.3 and that the body was folded, and neither changes the request. `seal/follow-up.md` does not exist at `29eaf46`, and `seal/threads/` holds this work item alone. `docs/README.md`, the index a `file:` is picked from, does not exist, so each `file:` below is a document `ls docs` lists. The release note of v0.0.2 holds no heading *Process changes*.

## Scope

In scope, each item numbered for `frame/plan.md`:

1. **The recording.** One real `claude` session, started once by the crafter, records what Claude Code sends and writes at an interruption, and is committed as `apps/desktop/test/fixtures/claude-interrupted-turn.json`. The session is given a command hook for every hook event of the reference's table, not only the hooks of `HOOK_EVENTS`, so an event Owlery does not listen to is seen too. It holds two interruptions by Esc: one of a running Bash tool call, and one of a reply while Claude writes it with no tool running. It stays open 75 seconds after the second Esc, because the reference places the `idle_prompt` notification about 60 seconds after a reply. The fixture holds the version `claude --version` printed, the date, the steps taken, every hook event with its arrival time and payload, and every line the session log gained with the time it appeared. No path under the person's home folder stands in it.
2. **The daemon reads a Claude Code pane's interruption from the pane's session log.** Each hook event carries the log's path as `transcript_path`. While a pane is alive and its state is `working`, the daemon watches that file and reads the lines appended to it. A line that is an interruption entry (item 3) is the pane's interruption.
3. **What an interruption entry is.** A line that parses as a JSON object whose `type` is `user`, whose `isSidechain` is not `true`, whose `interruptedBySendNow` is not `true`, and whose `message.content` is an array holding a text block whose text, without the white space at its ends, is `[Request interrupted by user]` or `[Request interrupted by user for tool use]`. Every other line is no interruption, a line that does not parse among them. An entry with `interruptedBySendNow: true` is written when a message the person sent cut the turn, and the agent works on that message at once.
4. **An interruption is the neutral event `interrupted`, and it leaves the session `waiting`.** The daemon sends it to every client as it sends a hook's event. The session's state becomes `waiting`, with the time of the reading, the text "The turn was interrupted, and the agent waits for what to do next.", no tool and no question.
5. **A tool's end that arrives after the interruption does not return the session to `working`.** After `interrupted`, a `tool-end` or a `tool-failed` leaves the state as it is, because it can only close a tool call that began before the interruption. Every other event moves the state as it does today: a `prompt` or a `tool-start` gives `working`, a `turn-end` gives `finished`.
6. **The watch costs nothing outside a working turn, and a failure of it changes nothing.** It starts at an event that leaves the pane `working` and names a log file that exists, follows the path the latest such event names, and ends when the pane leaves `working`, exits or is closed, and when the daemon closes. It reads only bytes appended after it started and keeps none of them. Where the file cannot be watched or read, the daemon's log says so once for the pane, and the pane's state is what its hook events say.
7. **Everything that waits for the session to stop working stops waiting.** No reader of `SessionInfo.state` changes. Cases pin three of them on an interrupted pane: the start of the work item's chain is not refused for a working session, a person's word is committed, and the Mac is not held awake for the pane.

Out of scope:

- **A turn that ends in an API error.** The reference says such a turn fires `StopFailure` and no `Stop`, and `HOOK_EVENTS` does not list `StopFailure`, so that session also stays `working`. It is the same class of defect with another source: a hook to add, not a log to read, and the one session this run may start cannot provoke an API error to record. The orchestrator opens an issue for it.
- **A headless session's interruption.** A role session reports through its stream, and the daemon ends it itself (`daemon.ts#stopHeadless`).
- **A CLI other than Claude Code.** `docs/architecture.md` *The phone: the terminal session as a chat* leaves Codex CLI's state to milestone 4.
- **The window.** No word, mark or layout changes: an interrupted session is drawn as every waiting session is.
- **The version move.** Issue #183's work item carries it.

## User scenarios & acceptance *(mandatory)*

Every case below feeds the daemon the fixture's recorded events through `Daemon#agentEvent` and appends the fixture's recorded log lines to a temporary file that the events' `transcript_path` is rewritten to name. No case starts `claude`.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. An interrupted tool call | Given a Claude Code pane whose session is `working` after the recorded prompt and the recorded start of the Bash call. When the log gains the lines the recording gained at the first Esc, and the hook events the recording shows after that Esc arrive. Then every client's `inbox` lists the session as `waiting` with the text of *Scope* item 4, and an `agent` message carries `interrupted` | A case in `apps/desktop/test/daemon.test.ts`, seen red with the log's reading removed |
| 2. An interrupted reply | Given the session `working` after the recorded second prompt. When the log gains the lines the recording gained at the second Esc. Then the session is `waiting` | A case in `apps/desktop/test/daemon.test.ts` |
| 3. A late end of the interrupted tool | Given the session `waiting` after an interruption. When a `PostToolUse` or a `PostToolUseFailure` arrives. Then the state, its time and its text are unchanged. When a `UserPromptSubmit` arrives after it. Then the session is `working` | A case in `apps/desktop/test/daemon.test.ts`, and the state's rule in `apps/desktop/test/agent-state.test.ts` |
| 4. What is no interruption | Given the lines of *Scope* item 3 one at a time: an entry with `isSidechain: true`, one with `interruptedBySendNow: true`, an assistant's entry that quotes the marker, a user's entry whose text holds the marker among other words, a line that is no JSON, and an empty line. Then none is an interruption, and the two marker texts each are one | A case in `apps/desktop/test/agent-events.test.ts` |
| 5. A log that cannot be read | Given a `working` pane whose events name a file that does not exist, and one whose file is removed while watched. Then the state stays `working`, the daemon throws nothing, and a later `Stop` gives `finished` | A case in `apps/desktop/test/daemon.test.ts` |
| 6. Nothing is read outside a working turn | Given a pane that is `finished`. When its log gains an interruption entry. Then the state stays `finished`. Given a pane that was closed while `working`. Then its log is no longer watched | A case in `apps/desktop/test/daemon.test.ts` |
| 7. What waits stops waiting | Given a work item whose one pane is `working`: the start of its chain is refused with the sentence that names a working session, a person's word is written and not committed, and the daemon holds the Mac awake. When the pane's turn is interrupted as in scenario 1. Then the start of the chain is not refused with that sentence, the word is committed, and the hold ends | Cases beside the ones that pin each of the three today: the chain's start in `apps/desktop/test/chain.test.ts`, and the word's commit and the hold in `apps/desktop/test/daemon.test.ts` |
| 8. The recording is named | The fixture names Claude Code's version, the date and the steps, and holds no path under a home folder | Read at review: `apps/desktop/test/fixtures/claude-interrupted-turn.json` |

## Data & interfaces

- `apps/desktop/src/shared/protocol.ts#AgentEvent` gains `"interrupted"`. `AgentState` and `SessionInfo` keep their fields. An `agent` message that carries `interrupted` has no tool.
- `apps/desktop/src/daemon/agent-state.ts#agentStateAfter` gives `waiting` for `interrupted`, and is told whether the session's state began at an interruption, so that it can leave a `tool-end` and a `tool-failed` without effect there (*Scope* item 5). Its comment no longer says "from its last event alone".
- `apps/desktop/src/daemon/agent-events.ts` gains the reading of one log line (*Scope* item 3), beside the other facts of Claude Code that file holds.
- `apps/desktop/src/daemon/daemon.ts`: `Session` holds the watch of its log, and `agentEvent` reads `transcript_path` from the payload as a path to read and nothing else. The daemon sends no client the path and no line of the log.
- `apps/desktop/src/daemon/hooks.ts#HOOK_EVENTS` is unchanged: the pane's `claude` is given the same hooks.
- The fixture, `apps/desktop/test/fixtures/claude-interrupted-turn.json`: `claudeCode` (the version), `recordedAt`, `steps` (an array of sentences), `events` (each `at`, `name`, `payload`) and `log` (each `at`, `line`).

## Rule changes

- change
  file: docs/architecture.md
  section: Overall layout
  from: A user session in a terminal reports it through its CLI's hooks, as Claude Code does.
  to: A user session in a terminal reports it through its CLI's hooks, as Claude Code does, and through the session log the CLI writes where its hooks say nothing, as at a turn the person interrupts.
- change
  file: docs/architecture.ko.md
  section: 전체 구성
  from: 터미널로 연 사용자 세션은 Claude Code처럼 그 CLI의 훅으로 알려 줍니다.
  to: 터미널로 연 사용자 세션은 Claude Code처럼 그 CLI의 훅으로 알려 주고, 사람이 중단한 턴처럼 훅이 아무것도 알리지 않는 곳에서는 CLI가 쓰는 세션 로그로 알려 줍니다.
- add
  file: docs/architecture.md
  section: Overall layout
  to: **A turn the person interrupts leaves its session waiting for the person, read from the session log.** Claude Code sends no hook event when a person interrupts a turn: its `Stop` hook does not run, and the pane asks what to do instead. It writes the interruption into the session log as an entry of the person's whose text is `[Request interrupted by user]` or `[Request interrupted by user for tool use]`, recorded on 2026-11-24 with Claude Code 2.1.331. Every hook event names the log's file, and the daemon watches it only while the pane is working, reads the lines appended to it, and keeps none. The session then waits, and an end of the interrupted tool call that arrives later does not return it to working. An entry of a subagent's, and one written because a message the person sent cut the turn, is no such interruption. The log's format is not public, so a line the daemon cannot read changes nothing, and the hook events alone decide.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/agent-events.test.ts apps/desktop/test/agent-state.test.ts
- add
  file: docs/architecture.ko.md
  section: 전체 구성
  to: **사람이 중단한 턴은 그 세션을 사람을 기다리는 상태로 두고, 데몬은 이를 세션 로그에서 읽습니다.** Claude Code는 사람이 턴을 중단할 때 훅 이벤트를 보내지 않습니다. `Stop` 훅은 실행되지 않고, 창은 대신 무엇을 할지 묻습니다. Claude Code는 중단을 세션 로그에 사람의 항목으로 쓰고, 그 글은 `[Request interrupted by user]`이거나 `[Request interrupted by user for tool use]`입니다. 2026-11-24에 Claude Code 2.1.331로 기록했습니다. 훅 이벤트마다 로그 파일의 경로가 들어 있고, 데몬은 창이 일하는 동안에만 그 파일을 지켜보며, 덧붙은 줄을 읽고 하나도 간직하지 않습니다. 그 뒤 세션은 사람을 기다리고, 중단된 도구 호출의 끝이 나중에 도착해도 일하는 상태로 돌아가지 않습니다. 하위 에이전트의 항목과, 사람이 보낸 메시지가 턴을 끊어서 쓰인 항목은 이런 중단이 아닙니다. 로그의 형식은 공개된 것이 아니므로, 데몬이 읽지 못하는 줄은 아무것도 바꾸지 않고 훅 이벤트만으로 판정합니다.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/agent-events.test.ts apps/desktop/test/agent-state.test.ts
- change
  file: docs/product.md
  section: Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call
  from: Claude Code reports the first through hooks, and git shows the second.
  to: Claude Code reports the first through hooks, and through its session log where a person interrupts a turn, and git shows the second.
- change
  file: docs/product.ko.md
  section: 바탕: 작업함, AgenticSeal 프로세스, 인장의 뒷면, 그리고 불러 쓰는 터미널
  from: 앞의 것은 Claude Code가 훅으로 알려 주고, 뒤의 것은 git이 보여 줍니다.
  to: 앞의 것은 Claude Code가 훅으로 알려 주고 사람이 턴을 중단한 곳에서는 세션 로그로 알려 주며, 뒤의 것은 git이 보여 줍니다.

## Removes

- nothing
  why: The defect is a reading the daemon lacks, and no reading it has is made redundant: each hook mapping of `agent-events.ts#agentEventFor` is still the only source of its state. The reading added here is a rule with a watch, and what it costs is in `frame/plan.md` *Technical context*. The sentence of `agent-state.ts` that says "from its last event alone" is rewritten in place, as *Data & interfaces* names, and is no removal.

Framed 2026-11-24 by framer, before the build.
