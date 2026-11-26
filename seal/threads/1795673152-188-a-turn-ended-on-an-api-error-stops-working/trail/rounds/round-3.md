# Review round 3: 1795673152-188-a-turn-ended-on-an-api-error-stops-working

```seal
target: 1208f64b, fixes 5d4ea30d..1208f64b
```

This is a verifying round. It read the branch `fix/188-a-turn-that-ends-on-an-api-error-leaves-its-session-working` at `1208f64b`. The fix diff `5d4ea30d..1208f64b` holds `705b5e6a` (the record of round 2), `d1e4dd5c` (the two texts of round 2 applied to `frame/design.md` and `gaps.md`), `1bfc1c41` (the closes of round 2), `95e9ee8e` (a merge of `release/v0.0.5` at `911d9bf0`) and `1208f64b` (`trail/gate.md`). The range changes no code of this work item. `git merge-tree --write-tree 1bfc1c41 911d9bf0` printed the tree `66daedeb`, and `git rev-parse 95e9ee8e^{tree}` printed the same, so the merge adds nothing beyond the release (executed). The release's hunks in `apps/desktop/src/daemon/daemon.ts` stand at `:84`, `:373`, `:1730`, `:2611` and `:4323`, and none is in `Daemon#agentEvent`, which now begins at `daemon.ts:656` and calls `agentEventFor(hookName, payload)` at `:661` (executed with `git diff 1bfc1c41 95e9ee8e`, read). The merge touches neither `agent-events.ts`, `agent-state.ts` nor `hooks.ts`.

Every file of the work item was read whole at `1208f64b`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md`, `trail/gate.md`, `trail/rounds/round-1.md` and `trail/rounds/round-2.md`. `Commit and pull request language` is English (`seal/config.json`), so no `pr.<lang>.md` is owed. No `seal/parity.json` stands.

Carried from rounds 1 and 2 and not established again: what Claude Code 2.1.332's minified code does at a subagent's API error (round 1, finding 2 and its *Probes* row); that each case of the build is red under the guard it names (round 2, *Probes*); and that no other frame of the release adds a conflicting rule to *Overall layout* (round 1, *Confirmations*). The fix diff changed no section a `to` names, so that last search was not run again.

## Findings

No finding. The round reopens nothing and opens nothing.

## Confirmations

```seal
confirms: round-2#1
```
What holds: both `to` sentences of *Rule changes* now say the hook runs for a subagent's turn that ends on an API error. `frame/design.md:88` reads "and also for a subagent's turn that ends on an API error, whose input then names the subagent's `agent_id`;", and `frame/design.md:93` reads "API 오류로 끝난 서브에이전트의 턴에서도 실행하며, 그때 입력에 서브에이전트의 `agent_id`가 들어 있습니다.", each word for word as round 2 gave it (read, and the diff `705b5e6a..1bfc1c41` shows only those two lines changed in `design.md`). Round 2's search, run again at `1208f64b`: `git grep -n -F "subagent's turn" 1208f64b -- . ':!seal/threads/*/trail/rounds/*'` printed `apps/desktop/src/daemon/agent-events.ts:19` and `frame/design.md:88`, and `git grep -n -F '서브에이전트의 턴'` printed `frame/design.md:93` alone (executed, exit 0 each). The old wording is gone: `git grep -n -F 'at the end of a subagent'` and `git grep -n -F '턴이 끝날 때에도'` over the same paths printed nothing (executed, exit 1 each). The docstring at `agent-events.ts:18-20` stays as round 2 said it should. These searches are a sample under contract rules 12 and 19.

```seal
confirms: round-2#2
```
What holds: `gaps.md:8` is the row round 2 gave, word for word, after the row of the reference's example (read). Round 2's search, run again: `git grep -n -i 'subagent' 1208f64b -- seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/gaps.md seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/frame/questions.md` printed `gaps.md:8` alone (executed, exit 0), where at `5d4ea30d` it printed nothing. The coordinate the row cites stands: `apps/desktop/src/daemon/agent-events.ts:23` is the guard `if (hookName === "StopFailure" && typeof payload.agent_id === "string") return undefined;` (read). Round 2 also named `agent-events.ts:23` in the finding's location as the unit the row is about. That file is unchanged since `5d4ea30d` (`git diff --stat 5d4ea30d 1208f64b` over it printed nothing, executed), so the guard round 2 confirmed under round-1#2 is the guard at the target. No row of `## Not verified` left the memo: the diff of `gaps.md` adds one line and removes none.

What matched, on the question the sealer raised about in-process teammates. The hooks reference, fetched again on 2026-11-26 with `curl -sL` from the address `frame/design.md:22` names (executed, exit 0), describes `agent_id` under *Common input fields* as "Unique identifier for the subagent or in-process teammate the hook fires in". So a teammate's `StopFailure` also names an `agent_id`, and the guard at `agent-events.ts:23` drops it as it drops a subagent's. The round judges that this is no finding, on what a person sees:

- When an in-process teammate's turn ends on an API error, the agent teams page says "A teammate whose turn ends on an API error notifies the lead that it failed and includes the error text" (the page `agent-teams.md` beside the hooks reference, which the reference links for in-process teammates, fetched with `curl -sL`, executed, exit 0). The lead is the session the person asked, and it goes on working. The pane's agent panel also keeps a row for a failed teammate. If the guard let the event through, the inbox would show "Needs you" with the teammate's error while the lead works on, which is the false wait round 1's finding 2 named for a subagent. Dropping the event leaves the session's state to the lead's own events.
- The session's own turn still reports its error. The reference names `agent_id` only for a subagent or an in-process teammate, so the lead's own `StopFailure` carries none and maps to `turn-failed`. The `--agent` flag gives a session an `agent_type`, and the reference gives it no `agent_id`. Owlery passes `--agent` only for a role session (`apps/desktop/src/daemon/adapters/claude.ts:98`), which runs with `disableAllHooks: true` (`:92`), so no hook of a role session reaches the guard (read).
- What the records say stays true. `frame/design.md:42`, both `to` sentences and the docstring at `agent-events.ts:18-20` name a subagent and no teammate. None of them says that only a subagent carries `agent_id`, and the rule's clause "the daemon reads only the session's own" covers a teammate too. `git grep -n -i 'teammate' 1208f64b -- apps docs seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working` printed nothing (executed, exit 1): nothing in the tree reads teammates, before or after this work.
- What the reference does not settle stays where the memo already holds it: whether a real session's lead `StopFailure` carries no `agent_id` is the second claim of `gaps.md:8`, for the owner's Q1 run. The reference now states it, so it rests on the reference and on round 1's reading of the CLI, and still not on a session.

What matched: the records the fix diff did not change still state the target. The coordinates the round opened stand. `git diff --stat 5d4ea30d 1208f64b` over `agent-events.ts`, `agent-state.ts`, `hooks.ts`, `protocol.ts` and the fixture printed `protocol.ts` alone (executed, exit 0). Its change is the release's scrollback cap, at `protocol.ts:851-852`, `:879-880` and `:966-967`, and `AgentEvent` with `"turn-failed"` at `protocol.ts:19` stands as round 2 read it (read). `trail/gate.md` records `run: 95e9ee8e against 911d9bf0` (read). `pr.md` quotes *Scope* items 1, 2, 4, 5 and 6 and Q1, and each quote stands word for word at the target, since `d1e4dd5c` changed none of those lines (read). `changelog.md` is unchanged and still true of the code (read).

The fix diff adds no case, so no new test is read against its group.

## Not judged

| What | Location | Who answers |
|---|---|---|
| That a real session's own `StopFailure` carries no `agent_id`, and a subagent's or an in-process teammate's carries one. The round read the hooks reference and ran no session | `gaps.md:8`, `frame/questions.md` Q1 | the owner, by allowing Q1's run |
| The broad gate at `95e9ee8e`: the orchestrator's claim of suite exit 0 and chain exit 0, recorded in `trail/gate.md`. The round ran no part of it | `trail/gate.md` | the orchestrator |

This round leaves nothing open. Only this record follows `1208f64b`, which only `trail/gate.md` follows from the gated `95e9ee8e`, so what comes due is the sealer's spawn.

## Probes

| Command | Result |
|---|---|
| `git merge-tree --write-tree 1bfc1c41 911d9bf0` and `git rev-parse 95e9ee8e^{tree}` | both printed `66daedeb...`, exit 0 |
| `git diff 1bfc1c41 95e9ee8e -- apps/desktop/src/daemon/daemon.ts apps/desktop/src/daemon/agent-events.ts apps/desktop/src/daemon/agent-state.ts apps/desktop/src/daemon/hooks.ts`, hunk heads | five hunks, all in `daemon.ts`, none in `agentEvent` |
| `git diff --stat 5d4ea30d 1208f64b` over `agent-events.ts`, `agent-state.ts`, `hooks.ts`, `protocol.ts` and the fixture | `protocol.ts` alone, the release's scrollback cap, exit 0 |
| `curl -sL` of the hooks reference at the address `frame/design.md:22` names, and of `agent-teams.md` beside it | exit 0 each; the sentences quoted in *Confirmations* |
