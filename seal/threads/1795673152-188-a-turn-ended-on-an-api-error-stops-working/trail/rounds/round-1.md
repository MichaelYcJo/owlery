# Review round 1: 1795673152-188-a-turn-ended-on-an-api-error-stops-working

```seal
target: 28ab91df against release/v0.0.5
```

The round read the branch `fix/188-a-turn-that-ends-on-an-api-error-leaves-its-session-working` at `28ab91df` against its base at `e9fe914c`. That range holds five commits: `ba605aec` (routing), `ac774e48` (frame), `75ef7bc2` (code and cases), `70b9978d` (phase records) and `28ab91df` (the plan's runner cell and `pr.md`). No earlier round stands, so no fact was carried from one. Every file of the work item was read whole at `28ab91df`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-1.md`. The issue was read with `gh issue view 188 --json title,body,comments`, which printed no comment. `Commit and pull request language` is English (`seal/config.json`), so no `pr.<lang>.md` is owed. No `seal/parity.json` stands.

The orchestrator asked two questions. The first was whether `waiting` ("Needs you") with the error's text is the right state, rather than `finished`. The round judges that it is, and *Confirmations* gives the grounds. The second was whether the window shows anything misleading for an API error that Claude Code retries by itself. Claude Code's retries show nothing misleading. A subagent's API error does, which is finding 2. The card's "Claude Code asks" head over the error's text is a row of *Not judged*.

## Findings

### 1. The case for the session log's watch passes with the watch left on, so nothing holds that a failed turn ends the watch

```seal
severity: should
location: `apps/desktop/test/daemon.test.ts:2888-2902`, `seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/trail/phases/phase-1.md:14`
evidence: executed `node scripts/test-in-electron.mjs test/daemon.test.ts -t "reads no session log of a pane whose turn ended on an API error"` in `apps/desktop` three times: against the source of `e9fe914c` (exit 1, failing at `daemon.test.ts:2901`, the state line), with `daemon.ts:671` changed to `else if (event !== "turn-failed") this.endLog(session);` (exit 0), and with that change and `await pause(60);` after the case's `UserPromptSubmit` (exit 1, failing at the `interruptions(c)` line); read `apps/desktop/src/daemon/session-log.ts:41-58`, `apps/desktop/src/daemon/daemon.ts:2809-2828`, `apps/desktop/test/daemon.test.ts:3226-3235`
```

Why it matters: *Scope* item 6 of `frame/design.md` says a case holds "the watch of its session log ends", and the acceptance row *The log is no longer watched* names this case. The phase record says the case was seen red with "the state was `working` with no text, and the log's watch was still on" (`phase-1.md:14`). The round ran it against the base's source. It failed on the state line (`daemon.test.ts:2901`) and not on `expect(interruptions(c)).toEqual([])` (`:2900`), although the watch was on. The round then kept the watch on at a failed turn in the new code, which is the one guard the case names. The case passed (exit 0).

The cause is the case's timing. The case calls `UserPromptSubmit`, which starts the watch (`SessionLogWatch` takes the log's size and calls `fs.watch`, `session-log.ts:43-47`). It then calls `StopFailure` and appends the interruption entry in the same tick. The watcher does not report an append made that soon after it began, so a watch that stays on reads nothing either: the second probe run, exit 0, shows it on this machine. The neighbouring case "lists a Claude Code session whose reply the person interrupted as waiting" waits 60 ms between the watch's start and the append (`daemon.test.ts:3232`). With that pause added, and the guard still removed, the case fails at the `interruptions(c)` line. So the pause makes the assertion able to fail. With the guard back in place the case passes (exit 0).

The class: the round listed every assertion of an absence that the diff adds, from `git diff e9fe914c..28ab91df -- apps/desktop/test`. This is the one that stands on a log's watch. The other two are `agentSaid` giving `text: null` without `last_assistant_message`, and the matcher `*` assertion. Neither reads a watch.

```ts
// apps/desktop/test/daemon.test.ts, the case at line 2888, in place of lines 2896-2898:
    d.agentEvent(session.id, "UserPromptSubmit", { transcript_path: log });
    // The watch is given time to begin, as in the case of an interrupted reply, so an entry it read would be told.
    await pause(60);
    d.agentEvent(session.id, "StopFailure", { transcript_path: log, last_assistant_message: "API Error: Rate limit reached" });
    appendFileSync(log, lines(TOOL_ESC, TOOL_ESC + 1));
```

```markdown
<!-- seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/trail/phases/phase-1.md, line 14, in place of the bullet -->
- `daemon.test.ts`, "reads no session log of a pane whose turn ended on an API error ...": against the unchanged source it failed on the state, which was `working` with no text. In its first form its append came before the watch could report it, so it passed with the watch left on at a failed turn. Round 1 found that, and the case now waits 60 ms after the prompt, as the case of an interrupted reply does. With the watch left on at a failed turn it fails at `interruptions(c)`.
```

The fix pass shows the changed case red with `daemon.ts:671` kept from ending the watch at `turn-failed`, as rule 15 asks, and says so in its close.
```seal
verdict: fixed bbc76486
answer: The case waits 60 ms after the prompt, as the proofer gave it, and phase-1.md's bullet is rewritten as given. Shown red with only the guard removed: `seal mutate` over `daemon.ts` (`else if (event !== "turn-failed") this.endLog(session);`) failed the case at `expect(interruptions(c)).toEqual([])`, executed, exit 0 for the tool, tree restored by it.
```

### 2. A subagent's API error turns the session to "Needs you" and raises a notification while the main agent works on

```seal
severity: should
location: `apps/desktop/src/daemon/agent-events.ts:17-19`, `apps/desktop/src/daemon/daemon.ts:663`, `apps/desktop/test/daemon.test.ts:2737-2748`, `seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/frame/design.md:42`, `seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/frame/design.md:88`, `seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/frame/design.md:93`
evidence: executed `strings -n 8` over the binary of the installed Claude Code 2.1.332 (exit 0), then a Python search of its output for `StopFailure`, for the call sites of the function that runs its hooks, and for the builder of a hook's base input; read `apps/desktop/src/daemon/agent-events.ts:5-19`, `apps/desktop/src/daemon/daemon.ts:658-680`, `apps/desktop/src/renderer/view.ts:2802-2818`
```

Why it matters: `frame/design.md` *Scope* item 2 defines `turn-failed` as "the agent's turn ended on an error of its provider before the agent finished". The CLI's own code, as the round read it from the installed binary, also runs `StopFailure` inside a subagent. A subagent is a worker the main agent starts through its Agent tool. The function that runs the hooks returns early only for one kind of subagent: `if(_a(n.agentContext)||...)return;`, where `_a(e)` is `e?.agentType==="subagent"&&e.delegatedObservation===!0`. It is called at the query loop's API error return, `return sAt(ot??v,k),{reason:"api_error",...}`. That same branch checks `!k.agentId` for the CLI's own failure mark, so the loop serves subagents. It also passes `agentId:n.agentId` into the hook's input. The base input's schema describes `agent_id` as "Subagent identifier. Present only when the hook fires from within a subagent". So the input of a subagent's `StopFailure` names its `agent_id`.

`agentEventFor` reads only the hook's name (`agent-events.ts:17-19`). So `Daemon#agentEvent` sets the session `waiting`, with the subagent's error as its text, and ends the log's watch (`daemon.ts:663-679`). Where the window is not in front, `notificationFor` then raises "Needs you" (`view.ts:2811-2816`). The main agent gets the Agent tool's failure and goes on working. The session returns to working only at the main agent's next tool event, and the notification has already been raised. The diff makes `StopFailure` the first mapped event that leaves a session not working and that Claude Code also sends from inside a subagent: `SubagentStop`, not `Stop`, ends a subagent's turn, and the daemon drops it (*Scope*, Out). No real session ran, so this rests on the CLI's minified code as read, and Q1's run would show it.

The fix maps a subagent's `StopFailure` to no event:

```ts
// apps/desktop/src/daemon/agent-events.ts, in place of lines 17-19:
/**
 * The hooks Claude Code also runs inside a subagent, whose input then names the subagent's `agent_id`. There the
 * event ends the subagent's turn and not the session's, and the agent the person asked works on, so it maps to no
 * neutral event.
 */
const CLAUDE_CODE_SESSION_TURN_ONLY = ["StopFailure"];

export function agentEventFor(hookName: string, payload: Record<string, unknown> = {}): AgentEvent | undefined {
  if (CLAUDE_CODE_SESSION_TURN_ONLY.includes(hookName) && typeof payload.agent_id === "string") return undefined;
  return Object.hasOwn(CLAUDE_CODE, hookName) ? CLAUDE_CODE[hookName] : undefined;
}
```

```ts
// apps/desktop/src/daemon/daemon.ts, line 663:
    const event = agentEventFor(hookName, payload);

// apps/desktop/test/daemon.test.ts, "maps each Claude Code hook Owlery listens to, and drops any other", after the StopFailure line (2746):
    expect(agentEventFor("StopFailure", { hook_event_name: "StopFailure", agent_id: "a1b2", error: "rate_limit", last_assistant_message: "API Error: Rate limit reached" })).toBeUndefined();
```

The frame's statements of the event follow. `git grep -n -F 'in place of `Stop`' 28ab91df -- seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working` and `git grep -n -F '대신 `StopFailure`'` find the two `to` lines of *Rule changes*. A search on those words is a sample: *Scope* item 3 states the map in other words, and the snippet covers it too.

```markdown
<!-- frame/design.md, Scope item 3, line 42 -->
3. `apps/desktop/src/daemon/agent-events.ts` maps `StopFailure` to `"turn-failed"`, and reads `last_assistant_message` as the text of the event, as it does for `Stop`. A `StopFailure` whose input names an `agent_id` fired inside a subagent, and maps to no event.

<!-- frame/design.md, Rule changes, line 88: after "Claude Code runs its `StopFailure` hook in place of `Stop` for such a turn," insert -->
and also at the end of a subagent's turn, whose input then names the subagent's `agent_id`; the daemon reads only the session's own,

<!-- frame/design.md, Rule changes, line 93: after "`Stop` 대신 `StopFailure` 훅을 실행하고," insert -->
서브에이전트의 턴이 끝날 때에도 실행하며 그때 입력에 서브에이전트의 `agent_id`가 들어 있습니다. 데몬은 세션 자신의 것만 읽고,
```

The fix pass shows the new assertion red against the current `agentEventFor` and says so in its close.
```seal
verdict: fixed 257939bc
answer: Fixed in the proofer's shape, written in the crafter's own words in one respect: the subagent test is inline in the body of `agentEventFor` (`hookName === "StopFailure" && typeof payload.agent_id === "string"`) and adds no module-level name, because the frame holds no such unit; the function gains a `payload` parameter and `daemon.ts:663` passes it. Cases: the assertion of the proofer in "maps each Claude Code hook", and a daemon case that a working session stays working at a subagent's `StopFailure` with no `turn-failed` message. Both seen red against the code before the fix (`expected 'turn-failed' to be undefined`; one `turn-failed` message), green after; `seal mutate` over `daemon.ts` (payload not passed) and over `agent-events.ts` (the `agent_id` test made `false`) each red, exit 0. Frame: *Scope* item 3 and both `to` sentences of *Rule changes* written as given, in the same commit. The frame's line 80 of `design.md` (`Daemon#agentEvent` does not change) and `plan.md` *Technical context* ('needs no change') now state a daemon that changed by one argument; they stand in files the crafter does not write and are named in the hand-back for the orchestrator. Read against the code's real inputs: the subagent's hook input is a claim read from the CLI's minified code and not a recorded event, so Q1's run still decides it.
```

### 3. The changelog says Owlery listened to neither event, though it listened to `Stop`

```seal
severity: should
location: `seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/changelog.md:3`
evidence: executed `git grep -n -F 'listened to neither' 28ab91d -- .` (one match, `changelog.md:3`); read `git show e9fe914c:apps/desktop/src/daemon/hooks.ts` lines 15-24, which list `"Stop"`
```

Why it matters: the settle turns this fragment into the release notes. "Claude Code sends `StopFailure` and no `Stop` ..., and Owlery listened to neither" names two events, and "neither" reads as both. `HOOK_EVENTS` at the base held `"Stop"` and lacked only `"StopFailure"`. The search is a sample under contract rule 19: it found one statement, and `pr.md` does not repeat the sentence.

```markdown
Issue #188. For a turn that ends on an API error, Claude Code sends `StopFailure` in place of `Stop`, and Owlery did not listen to `StopFailure`, so the session kept its "Working" for good.
```
```seal
verdict: fixed 23a71b51
answer: The opening sentence is replaced as given. `git grep -n -F 'listened to neither'` after the commit prints only this record's own quotes of it, and no file of the tree.
```

## Confirmations

What matched: the frame's choice of `waiting` over `finished` holds, read against `docs/architecture.md:44` and `docs/product.md`. A turn that ended on an API error did not do what it was asked. The architecture's rule leaves an interrupted turn waiting on exactly that ground, and `finished` would put the half-done session under "Finished", where a person clears lines. The product's three states give no fourth, and the frame's `Out` keeps one out. What moves the session on is the person: asking again, signing in or waiting out a limit.

What matched: Claude Code's own retries show nothing misleading. In 2.1.332's code as read, `StopFailure` runs only at the query loop's returns that end the turn. These are the API error return after the CLI's retries, `prompt_too_long`, `autocompact_thrashing`, `malformed_tool_use_exhausted` and an empty reply given up on. A `max_output_tokens` reply is held back for the CLI's own recovery first (`Wy(v)`). The function called after it at those returns, `Cn`, only marks the API failure and runs no `Stop` hook. So while Claude Code retries, the session stays "Working", which is true. It turns to "Needs you" only once the turn has ended. This was read from the binary's strings, not run.

What matched: the code is what *Data & interfaces* says (`agent-events.ts:14`, `:26`, `agent-state.ts:27`, `hooks.ts:24`, `protocol.ts:18-19`), and `Daemon#agentEvent` is unchanged. The protocol's new value names no vendor (`protocol.ts:1-4`). The renderer draws nothing for an `agent` message (`renderer.ts:2061-2063`), and no other code switches over `AgentEvent` (`git grep -n 'AgentEvent' -- apps`, executed). The *Grounding* coordinates stand at the target: `daemon.ts:658`, `:664`, `adapters/claude.ts:92`, and the count of 34 hook events. That count was executed: the CLI's event array holds 34 names. The shared and per-pane settings files both carry the new hook: `hooks.test.ts:82`, `:273` and `:278` compare each written file with `hookSettings()`.

What matched: each new case is red against the base's source, executed by running the three narrow files (3 failed of 44, exit 1) and the daemon cases by `-t` (3 failed, exit 1) with `apps/desktop/src` checked out at `e9fe914c`. Each failed on the line its name points to, except the one finding 1 names. At the target the three narrow files pass 44 (exit 0) and the three daemon cases pass (exit 0). The crafter's four `seal mutate` runs were read, not run again. A mutation score licenses *tested*, never *safe*.

What matched: every quote of `pr.md` stands word for word at the coordinate it names in `frame/design.md` and `frame/questions.md`, read. The plan's Verified-by cell, changed in `28ab91df`, names the runner the phase used.

What matched: the release's other frames were searched with `grep -n -F 'Overall layout' seal/threads/*/frame/design.md`, executed. The one other work item whose *Rule changes* edits `docs/architecture.md` *Overall layout* is `1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll`. It changes the bullet on "Restart Daemon…", and this item adds a new bullet, so the settle meets no conflict. That item is in the base already, which is why `frame/plan.md` *Overlap with the release*, scoped to the branches the spawn named, leaves it out.

Two cases hold no fact the frame states beyond what other assertions hold. The lists of every event at `agent-state.test.ts:34` and `:45` gain `"turn-failed"` and pass against the old source, as `phase-1.md:16` says. The second assertion of the new `agentSaid` case (`agent-events.test.ts:18`) gives `text: null` for an input without `last_assistant_message`, and the old code gives the same. Neither changes the code from what the frame says. `gaps.md:8` records that the crafter ran the package's `tsc --noEmit`, which contract rule 2 gives to the broad gate alone. It is labelled, and it changes no tree.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the card over a failed turn should be headed "Claude Code asks", with "API Error: Rate limit reached" under it. `stateSays` heads every waiting card "asks" (`view.ts:1778-1793`), and the frame keeps a word of its own for a failed turn out | `apps/desktop/src/renderer/view.ts:1788` | the owner, at the walk of the release (`gaps.md:9`) |
| That a real session sends `StopFailure` in the reference's shape, with no `Stop` after it. It is also unknown whether a subagent's error reaches the hook as finding 2 reads, and whether the CLI resumes a transient error's turn by itself, which its `isTransient` return hints at. A resumed turn would read "Needs you" until its next tool event | `frame/questions.md` Q1 | the owner, by allowing Q1's run |
| The whole suite, the repository-wide lint and the typecheck at the target, labelled `unverified` | the broad gate | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/agent-state.test.ts test/agent-events.test.ts test/hooks.test.ts`, in `apps/desktop` at `28ab91df` | 3 files, 44 passed, exit 0 |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "API error\|maps each Claude Code hook"`, at `28ab91df` | 3 passed, 394 skipped, exit 0 |
| The same two runs with `apps/desktop/src` checked out at `e9fe914c`, restored after | narrow: 3 failed of 44, exit 1; daemon: 3 failed, exit 1 |
| The daemon case of finding 1 with `daemon.ts:671` as `else if (event !== "turn-failed") this.endLog(session);` | 1 passed, exit 0 |
| The same with `await pause(60);` after the case's `UserPromptSubmit` | 1 failed at `interruptions(c)`, exit 1; with `daemon.ts` restored, 1 passed, exit 0; both files restored after |
| `strings -n 8` over the installed Claude Code 2.1.332 binary, then Python searches of its output for `StopFailure`, the hook runner's call sites, `Cn`, `_a` and the base input builder | exit 0; 17 matches of `StopFailure`; the contexts quoted in finding 2 and *Confirmations*; an event array of 34 names |
