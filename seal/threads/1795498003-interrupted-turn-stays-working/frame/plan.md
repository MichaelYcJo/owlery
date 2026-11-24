# Implementation Plan: an interrupted turn leaves its session not working

## Technical context

The tree as read at `29eaf46`.

**What the build stands on.** Every path below is under `apps/desktop/`.

- `src/daemon/agent-state.ts:11`, `agentStateAfter`, is the one place a pane's state is decided, from one neutral event. `test/agent-state.test.ts` pins every value it gives.
- `src/daemon/daemon.ts:454`, `agentEvent`, is the one caller. It keeps the state, its time and its text in `Session.info`, and sends an `inbox` only where the state changed. `src/daemon/main.ts:61` hands it each event the hook socket receives.
- `src/daemon/agent-events.ts` holds what the daemon knows of Claude Code: the hook names, and the fields of a payload a person reads.
- `Session.silentStart` (`src/daemon/daemon.ts:283`) is the precedent for a thing a pane holds that its first event, its exit, its close and the daemon's close each end. The watch of a log is held and ended the same way.
- The readers of the state are `src/daemon/daemon.ts:2042` (`works`), asked at `:2030` for a person's word and at `:2129` for a chain's start, `src/daemon/keep-awake.ts:28`, and `src/renderer/view.ts:1845` (`closeAsks`). None changes.
- The cases that pin those readers today are `test/chain.test.ts:1341` for the chain's start, and in `test/daemon.test.ts` the case at `:4469` for a person's word, and the cases of the hold there and in `test/keep-awake.test.ts`. The state's own cases start at `test/daemon.test.ts:2763`, and each drives the daemon with `d.agentEvent(...)`.

**How the recording is made (phase 1).** The crafter writes a driver under its scratch directory. The driver starts `claude --settings <file>` in a pseudo-terminal, in a new empty folder under that scratch directory, and is not the app: the app gives a pane only the hooks of `HOOK_EVENTS`, and it adds nothing to what Claude Code sends. The settings file gives every hook event of the reference's table a command that appends the event's JSON and its arrival time to one file. The driver copies each line the session log gains, with the time it appeared. The steps, in order:

1. Answer the folder-trust question where Claude Code asks it (`docs/architecture.md` *Overall layout* says when it does).
2. Send a prompt that asks for one Bash call of `sleep 60`, and allow the call where Claude Code asks.
3. Two seconds after the `PreToolUse` event of that call, send Esc. Wait until the log gains a line, 10 seconds at most.
4. Send a prompt that asks for a long reply with no tool, such as the numbers 1 to 300 one per line. Three seconds after its `UserPromptSubmit` event, send Esc.
5. Wait 75 seconds, then end the session with `/exit`.

The crafter runs the driver once against a stand-in script that plays `claude` before it runs it against the real one, so that a fault of the driver does not spend the session. The real `claude` is started once. Where that session ends without both interruptions recorded, the crafter starts no second one: it commits what was recorded, says in the phase record what is missing, and hands back. The crafter records the driver's process id and stops it by that record. The driver is not committed: the fixture names its steps, and a later recording is a new work item's.

**The constraints.**

- The log's path arrives in a hook payload over a socket only the person's own processes can write. The daemon opens the file to read, parses each appended line, and keeps one fact of it: whether it is an interruption entry.
- The log gains a line for every message and every tool result of a working turn, so the read runs often. It reads only the appended bytes. A tool result can be megabytes on one line, and an interruption entry in the logs read is under 700 characters (`frame/design.md` *Grounding*), so the crafter bounds what one read parses and says in the phase record which bound it chose.
- `fs.watch` reported appends within 1 ms on this Mac under Node v26.13.1 (`frame/design.md` *Grounding*). The daemon's Node is Electron 45's, so the first case of phase 2 is also the first run of the watch there (`frame/questions.md` Q2).

**What breaks in six months.** Claude Code changes the text of the entry or the layout of the log. The daemon then reads no interruption, and an interrupted session stays `working`, which is today's defect and no false decision in front of a person. Nothing reports the change: the fixture's version says when the reading last held, and the person sees "Working" on a pane that waits. If Claude Code comes to send a hook event at an interruption, that event is the public source, and the log's reading is what a later work item removes.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Read the interruption from the session log, watched while the pane works | The log's format is not public and can change with a version, which leaves today's defect and nothing worse | Chosen, as the default the recording confirms or overturns (`frame/questions.md` Q1). It is the one source this framing found that holds an interruption of a tool call and of a reply alike: `frame/design.md` *Grounding*, the entries read in this machine's logs |
| Read a hook event that carries the interruption, such as `PostToolUseFailure` with `is_interrupt`, or `PostToolUse` with the tool's interrupted result | The reference says cancelling a running tool fires no `PostToolUseFailure`, and that Esc cancels the `PostToolUse` hooks at once. A tool's event can also say nothing of a reply interrupted with no tool running | Not the default. It replaces the log's reading where the recording shows one event that names the interruption at both interruptions, by a fold (`frame/questions.md` Q1) |
| Read the log once when the daemon writes Esc or Ctrl+C into a working pane | Claude Code lets a person bind its keys, so the list of interrupting keys is a guess. Esc also closes a menu. The line is written some time after the key, so the read needs timed repeats | Rejected |
| Read the log's tail every second while the pane works | Every working pane wakes the daemon every second, and the state is late by up to the interval | Rejected: the watch wakes it only at a write |
| Read "Interrupted" from what the pane prints | `docs/architecture.md` *Overall layout* forbids it | Rejected |
| Call a pane waiting after a time with no event | A long tool call and a long reply send no event for minutes, so a working session would be put in front of the person by mistake | Rejected |
| Leave it to the `idle_prompt` notification, which already maps to `waiting` | It comes about 60 seconds after a reply by the reference, and nothing read says it comes after an interruption. The recording holds the session 75 seconds to show it | Rejected as the source |
| Give `finished` at an interruption | The window would say "Finished" of a turn that did not finish, and a person away from the pane would take the work for done | Rejected. `waiting` is what the pane does: it asks what to do instead, as a pane that asks at its start does |
| Add a state of its own, "Interrupted" | `docs/design.md` *The voice of the window's words* fixes the states at four, and every reader of the state would take a new branch | Rejected: the session's text says the reason |
| Replace `agentStateAfter` with one reader of every source: the hook events, the log and the timers, the silent start among them | Every transition release 0.0.2 pinned is rewritten to add one, and the silent start's rule moves with it | Rejected for this work |
| Keep `agentStateAfter` as a function of one event, and add one event and one dependence on the state before it | The comment "from its last event alone" stops being true, and a third exception after the question and the silent start makes the function harder to read | Chosen. The premise is that every other transition needs the last event alone, checked by reading `agent-state.ts` and its cases at `29eaf46`: the one transition that needs more is *Scope* item 5 |
| Record through the built app | The app gives a pane only its own hooks, so an event it does not listen to would go unseen, and a start of the built app is one more thing the run has to keep in the background | Rejected: the driver starts `claude` itself |
| Record one interruption, of a tool call, as the spawn's line reads | The issue's first line of "Done when" covers every turn the person interrupts. An interruption of a reply would then rest on entries of logs nobody recorded for this purpose | Rejected. The one session holds the interruptions *Scope* item 1 names, which adds about 10 seconds and no second session |

## Phases

Each phase ends with its cases passing through the narrow run of the files it names. The broad gate is the orchestrator's.

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* item 1, and the answer to `frame/questions.md` Q1 written into the phase record. No source file changes | Scenario 8. The phase record says, for each interruption, which hook events arrived after the Esc, in what order beside the log's new lines, and how long after the Esc the entry appeared | |
| 2 | *Scope* items 2, 3, 4, 5 and 6 | Scenarios 1 to 6, in `apps/desktop/test/daemon.test.ts`, `apps/desktop/test/agent-events.test.ts` and `apps/desktop/test/agent-state.test.ts`, each new case seen red as contract rule 15 asks | |
| 3 | *Scope* item 7 | Scenario 7, in `apps/desktop/test/chain.test.ts` and `apps/desktop/test/daemon.test.ts`, each case seen red with the log's reading removed | |

Where phase 1's recording differs from what `frame/design.md` states, in the version, in an entry's shape or in Q1's answer, the crafter says so in the phase record and builds no phase 2 on it. The orchestrator routes the difference to the framer as a fold, which rewrites *Scope*, the scenarios and the `to` values of *Rule changes* in place.

## Overlap with the release

Read: issues #181, #183, #146 and #176 with `gh issue view`, the branches of #181 (`38a1dd0`) and #183 (`523a5fb`), which hold a `routing.md` and no frame, and the frame of #160 at `10eef9f`.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #181, the pane carries Owlery's chain (routed, no frame) | `apps/desktop/src/daemon/daemon.ts`: #181 removes "Get a seal" and the path its press starts, which `whyNoChain` serves, and this work adds to `agentEvent`. Scenario 7's case of the chain's start stands beside `apps/desktop/test/chain.test.ts:1341`, which pins the refusal sentence that names "Get a seal". Both designs change a sentence of `docs/product.md` *Foundation*, each its own | #182 | This work's diff is the smaller and is likelier to be sealed first. #181 then removes or rewords the chain's cases once, this work's one among them, in rounds it spends on that removal anyway. In the other order this work's case would be written against a path that is gone, and scenario 7 would return to the framer |
| #160, accounts per repository (framed, not built) | `apps/desktop/src/daemon/daemon.ts#agentEvent` and `apps/desktop/src/daemon/agent-events.ts`: its scope item 9 reads `session_id` from a hook's payload, and this work reads `transcript_path` from the same payload in the same function. Both add a rule to `docs/architecture.md`, in different sections | #182 | #160 has five phases and none is built, so it meets this work's lines in `agentEvent` while it builds its phase 4, at no round of its own |
| #146, this repository's own check (not started) | Its workflow reads the records of every pull request, this work's among them | #182 | This work is sealed and checked by the AgenticSeal plugin's check as it stands. #146 is not started, and its issue says the owned check still reads this repository's earlier records |

#183 and #176 meet this work in no file, rule or fact: #183 redraws marks in `docs/design.md` and the themes, and #176 changes how `apps/desktop/src/renderer/view.ts` draws a broken seal's sentence, and this work changes no file of the renderer.

## Operational impact

No migration, no environment variable, no dependency and no change a deployer has to make. The protocol's `AgentEvent` gains one value, which a window of an earlier build receives in an `agent` message and reads nothing from. A daemon of an earlier build keeps today's behaviour until it is replaced. This pull request does not move the version: #183's does.

The build starts one real `claude` session, in phase 1, under the person's login. It writes one session log under `~/.claude/projects/`, for the scratch folder it ran in, as every session does.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
