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

**How the recording is made (phase 1).** The first session, committed at `e6dfe29`, recorded no interruption: its step asked for a Bash call of `sleep 60`, which Claude Code 2.1.331 refuses before it runs (`trail/phases/phase-1.md`). The crafter records again, in one more real session, which the orchestrator's row in *Judgments of the run* decides. The crafter writes a driver under its scratch directory, or takes up the one `trail/phases/phase-1.md` describes where it still stands under `<scratchpad>/1795498003-interrupted-turn-stays-working/phase-1/`. The driver starts `claude --settings <file>` with an `--allowedTools` value that allows the two commands of steps 3 and 5, as the first driver allowed its one, in a pseudo-terminal, in a new empty folder under the crafter's scratch directory, and is not the app: the app gives a pane only the hooks of `HOOK_EVENTS`, and it adds nothing to what Claude Code sends. It removes from the session's environment every variable whose name starts with `CLAUDE`, `ORCA_` or `TERM_PROGRAM`, as the first driver did. The settings file gives every hook event of the reference's table a command that appends the event's JSON and its arrival time to one file. The driver copies each line the session log gains, with the time it appeared. It answers a permission dialog with Enter wherever one shows. The steps, in order:

1. Answer the folder-trust question where Claude Code asks it. The first session was asked none.
2. Send a prompt that asks for a long reply with no tool, such as the numbers 1 to 300 one per line. Three seconds after its `UserPromptSubmit` event, send Esc. Where a `Stop` arrives before the three seconds are over, send no Esc and write that into the fixture's `steps`. Wait until the log gains a line after the Esc, 10 seconds at most.
3. Send a prompt that asks Claude to run exactly `ping -c 60 127.0.0.1` with the Bash tool, in the foreground, and to do nothing else. That command runs about a minute, and its first statement is no `sleep`, which is all the refusal reads (`frame/design.md` *Grounding*).
4. Wait for the first of two events, 60 seconds at most: a `PreToolUse` of Bash whose `tool_input` holds no `run_in_background: true`, or the turn's `Stop`. At that `PreToolUse`, wait two seconds, send Esc, and go to step 6.
5. Where step 4 ended at a `Stop`, at a background call or at its limit, send one more prompt, which asks for `python3 -c "import time; time.sleep(60)"` in the same words, and wait as in step 4. Where that also runs no foreground call, send no Esc.
6. Wait 75 seconds, then end the session with `/exit`.

The reply's interruption comes first because it needs no tool call, so the session records it whatever Claude Code does with the command. The crafter runs the driver once against a stand-in script that plays `claude` before it runs it against the real one, so that a fault of the driver does not spend the session. The stand-in also plays a refused call, one that sends a `PostToolBatch` and a `Stop` and no `PreToolUse`, so that step 5 is rehearsed. The crafter starts the real `claude` once in this phase. Where that session ends without both interruptions recorded, the crafter starts no further one: it commits what was recorded, says in the phase record what is missing, and hands back to the orchestrator. The crafter records the driver's process id and stops it by that record. The driver is not committed: the fixture names its steps, and a later recording is a new work item's.

**The constraints.**

- The log's path arrives in a hook payload over a socket only the person's own processes can write. The daemon opens the file to read, parses each appended line, and keeps one fact of it: whether it is an interruption entry.
- The log gains a line for every message and every tool result of a working turn, so the read runs often. It reads only the appended bytes. The first session's log gained lines of 137,657, 91,857 and 90,344 characters, none of them a `user` entry (`trail/phases/phase-1.md`), and an interruption entry in the logs read is under 700 characters (`frame/design.md` *Grounding*). So the crafter bounds how much of one line the daemon holds and parses, skips the rest of a longer line up to its end, and says in the phase record which bound it chose (`frame/questions.md` Q3).
- Claude Code wrote the log in batches, 56 to 147 ms after the hook event before each (`trail/phases/phase-1.md`). A read can therefore end inside a line, and a hook event can reach the daemon before the log's line that precedes it in the turn.
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
| Leave it to the `idle_prompt` notification, which already maps to `waiting` | It came 60.06 seconds after a finished turn's `Stop` in the first session, and nothing read or recorded says it comes after an interruption. The recording holds the session 75 seconds to show it | Rejected as the source |
| Give `finished` at an interruption | The window would say "Finished" of a turn that did not finish, and a person away from the pane would take the work for done | Rejected. `waiting` is what the pane does: it asks what to do instead, as a pane that asks at its start does |
| Add a state of its own, "Interrupted" | `docs/design.md` *The voice of the window's words* fixes the states at four, and every reader of the state would take a new branch | Rejected: the session's text says the reason |
| Replace `agentStateAfter` with one reader of every source: the hook events, the log and the timers, the silent start among them | Every transition release 0.0.2 pinned is rewritten to add one, and the silent start's rule moves with it | Rejected for this work |
| Keep `agentStateAfter` as a function of one event, and add one event and one dependence on the state before it | The comment "from its last event alone" stops being true, and a third exception after the question and the silent start makes the function harder to read | Chosen. The premise is that every other transition needs the last event alone, checked by reading `agent-state.ts` and its cases at `29eaf46`: the one transition that needs more is *Scope* item 5 |
| Record through the built app | The app gives a pane only its own hooks, so an event it does not listen to would go unseen, and a start of the built app is one more thing the run has to keep in the background | Rejected: the driver starts `claude` itself |
| Record one interruption, of a tool call, as the spawn's line reads | The issue's first line of "Done when" covers every turn the person interrupts. An interruption of a reply would then rest on entries of logs nobody recorded for this purpose | Rejected. One session holds the interruptions *Scope* item 1 names, which adds about 10 seconds to it |
| Ask for the long tool call as `sleep 60`, as this plan first did, or as a chain of shorter sleeps | Claude Code 2.1.331 refuses a foreground call whose first statement is a bare `sleep` of some length, and its refusal tells the model not to chain shorter ones. The first session spent itself on that refusal | Rejected at the fold of 2026-11-24. The step asks for `ping -c 60 127.0.0.1`, with a second command in the same session where the first runs no foreground call |

## Phases

Each phase ends with its cases passing through the narrow run of the files it names. The broad gate is the orchestrator's.

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* item 1, and the answer to `frame/questions.md` Q1 written into the phase record. No source file changes | Scenario 8. The phase record says, for each interruption, which hook events arrived after the Esc, in what order beside the log's new lines, and how long after the Esc the entry appeared | e6dfe29 |
| 2 | *Scope* items 2, 3, 4, 5 and 6 | Scenarios 1 to 6, in `apps/desktop/test/daemon.test.ts`, `apps/desktop/test/agent-events.test.ts` and `apps/desktop/test/agent-state.test.ts`, each new case seen red as contract rule 15 asks | |
| 3 | *Scope* item 7 | Scenario 7, in `apps/desktop/test/chain.test.ts` and `apps/desktop/test/daemon.test.ts`, each case seen red with the log's reading removed | |

Phase 1's Status cell names the commit of the first session, and the second recording is the same phase: its crafter adds what it found to `trail/phases/phase-1.md`. Where phase 1's recording differs from what `frame/design.md` states, in an entry's shape or in Q1's answer, the crafter says so in the phase record and builds no phase 2 on it. The orchestrator routes the difference to the framer as a fold, which rewrites *Scope*, the scenarios and the `to` values of *Rule changes* in place.

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

The build starts a real `claude` session twice, both in phase 1 and under the person's login: the one committed at `e6dfe29`, which recorded no interruption, and the one *How the recording is made (phase 1)* describes. Each writes one session log under `~/.claude/projects/`, for the scratch folder it ran in, as every session does. The issue's body records the owner's allowance of one such session, and the second stands on the orchestrator's row in *Judgments of the run*.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-24 | A second real `claude` session records the interruptions, on a phase 1 step 2 the framer rewrites around a command Claude Code 2.1.331 runs; the run does not stop to ask the owner for it. | Phase 1's one session recorded no interruption: Claude Code refused `sleep 60` before it ran, so no tool ran for Esc to stop (`trail/phases/phase-1.md`, commit `e6dfe29`). The owner allowed one short real session for this recording (issue #182's body), so this second session goes past that allowance's count, and the owner is told of it in the conversation as a notice, not asked. The owner answered `agentic` for the release, and objected on 2026-11-24 to questions put mid-run ("agentic모드가 아니잖아 이러면"). A second short session is cheap to undo and reaches nothing outside the repository the first did not. | `docs/running/the-run.md` *The run*, the paragraph opening **On a run whose `routing.md` reads `Automation` `yes`** (plugin 0.38.7) |
