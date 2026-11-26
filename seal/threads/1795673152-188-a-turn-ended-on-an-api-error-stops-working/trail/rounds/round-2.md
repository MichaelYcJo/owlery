# Review round 2: 1795673152-188-a-turn-ended-on-an-api-error-stops-working

```seal
target: 5d4ea30d, fixes 28ab91df..5d4ea30d
```

This is a verifying round. It read the branch `fix/188-a-turn-that-ends-on-an-api-error-leaves-its-session-working` at `5d4ea30d`, and the code it reviewed is the fix diff `28ab91df..5d4ea30d`. That range holds `df260a45` (the record of round 1), `bbc76486` (the watch case), `257939bc` (the subagent guard), `23a71b51` (the changelog), `d0be9154` (the phase record), `51c88fa9` (the closes of round 1) and `5d4ea30d` (the orchestrator's fold of `frame/design.md` *Data & interfaces* and `frame/plan.md` *Technical context*). Every file of the work item was read whole at `5d4ea30d`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` and `trail/rounds/round-1.md`. `Commit and pull request language` is English (`seal/config.json`), so no `pr.<lang>.md` is owed. No `seal/parity.json` stands.

Carried from round 1 and not established again: what Claude Code 2.1.332's minified code does at a subagent's API error, read from the binary's strings (round 1, finding 2 and its *Probes* row); that no other code switches over `AgentEvent`; and that the one other frame of the release whose *Rule changes* edits *Overall layout* adds no conflict. The fix pass changed no section a `to` names, so that last search was not run again.

## Findings

### 1. The rule the settle will copy says `StopFailure` runs at the end of every subagent's turn, where it runs only at one that ends on an API error

```seal
severity: should
location: `seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/frame/design.md:88`, `seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/frame/design.md:93`
evidence: executed `git grep -n -F "subagent's turn" 5d4ea30d -- . ':!seal/threads/*/trail/rounds/*'` (two matches: `apps/desktop/src/daemon/agent-events.ts:19` and `frame/design.md:88`) and `git grep -n -F '서브에이전트의 턴' 5d4ea30d -- . ':!seal/threads/*/trail/rounds/*'` (one match, `frame/design.md:93`); read `seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/trail/rounds/round-1.md:55-57`, `:125`
regression: round-1#2
```

Why it matters: the unit is the clause `257939bc` added to both `to` sentences of *Rule changes*. *Scope* item 3 says a `StopFailure` whose input names an `agent_id` fired inside a subagent; the fix wrote round 1's own snippet into the rule, and the defect came from that snippet, which named the end of a subagent's turn and left out that the turn ended on an API error. The English `to` (`design.md:88`) reads "Claude Code runs its `StopFailure` hook in place of `Stop` for such a turn, and also at the end of a subagent's turn". The Korean `to` (`design.md:93`) reads "서브에이전트의 턴이 끝날 때에도 실행하며", which says it runs whenever a subagent's turn ends. What round 1 read in the CLI says otherwise: `StopFailure` runs at the query loop's returns that end a turn on a failure (`round-1.md:125`), and a subagent's turn that ends well runs `SubagentStop`, which the daemon drops (`round-1.md:57`). The settle writes these sentences into `docs/architecture.md` and `docs/architecture.ko.md`, where an agent reads them as how Claude Code behaves. The docstring at `agent-events.ts:18-20` says "A `StopFailure` whose input names an `agent_id` fired inside a subagent", which is true, and needs no change. The searches are a sample under contract rules 12 and 19: a statement of the fact in other words escapes them.

```markdown
<!-- frame/design.md, Rule changes, line 88: in place of "and also at the end of a subagent's turn, whose input then names the subagent's `agent_id`;" -->
and also for a subagent's turn that ends on an API error, whose input then names the subagent's `agent_id`;

<!-- frame/design.md, Rule changes, line 93: in place of "서브에이전트의 턴이 끝날 때에도 실행하며 그때 입력에 서브에이전트의 `agent_id`가 들어 있습니다." -->
API 오류로 끝난 서브에이전트의 턴에서도 실행하며, 그때 입력에 서브에이전트의 `agent_id`가 들어 있습니다.
```

### 2. The closing memo does not name the unverified claim the subagent guard stands on

```seal
severity: should
location: `seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/gaps.md:7`, `apps/desktop/src/daemon/agent-events.ts:23`
evidence: executed `git grep -n -i 'subagent' 5d4ea30d -- seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/gaps.md seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/frame/questions.md` (no match, exit 1); read `seal/threads/1795673152-188-a-turn-ended-on-an-api-error-stops-working/trail/rounds/round-1.md:100`, `frame/questions.md:13`, `gaps.md:3-9`
regression: round-1#2
```

Why it matters: the unit is the guard `257939bc` added at `agent-events.ts:23`, which drops a `StopFailure` whose input carries `agent_id`. *Scope* item 3 now states that behaviour; the fix built it on the reading of the CLI's minified code that round 1 made, and the defect came from the fix pass, which recorded that reading in its close and not in the memo. The guard rests on two claims nobody ran: that a subagent's `StopFailure` names `agent_id`, and that the session's own `StopFailure` names none. If the second is false, the guard drops the real event and the defect of #188 returns. The fix pass's close says so in its own words: "the subagent's hook input is a claim read from the CLI's minified code and not a recorded event, so Q1's run still decides it" (`round-1.md:100`). `gaps.md` *Not verified* holds no row for it, and its first row names only the shape of the reference's example (`gaps.md:7`). `skills/implement/SKILL.md` *4. The closing memo* says every fix pass adds to the memo what it did not verify. The sealer and the owner read the memo, and the owner decides Q1 from it. Q1's run as `frame/questions.md:13` describes it answers every request with an error. It shows a subagent's event only where the prompt it sends starts a subagent, and the row should say so.

```markdown
<!-- gaps.md, ## Not verified, a row after line 7 -->
| That a subagent's `StopFailure` names the subagent's `agent_id` in its input and the session's own `StopFailure` names none, which the guard at `apps/desktop/src/daemon/agent-events.ts:23` stands on. Read in review round 1 from the minified code of Claude Code 2.1.332, not from a session. Q1's run shows it only where its prompt starts a subagent. | the owner, by allowing one run of a real `claude` against a stand-in server |
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: the case "reads no session log of a pane whose turn ended on an API error" waits 60 ms after the prompt (`daemon.test.ts:2911-2912`), so it can fail on the guard it names. The round re-ran round 1's probe, executed: with `daemon.ts:671` as `else if (event !== "turn-failed") this.endLog(session);` the case failed at `daemon.test.ts:2916`, the `interruptions(c)` line, exit 1. At the target it passes (exit 0). The bullet at `phase-1.md:14` says what the round found.

```seal
confirms: round-1#2
```
What holds: the code. `agentEventFor` takes the payload and returns no event for a `StopFailure` whose `agent_id` is a string (`agent-events.ts:22-23`), and `Daemon#agentEvent` passes the payload (`daemon.ts:663`), read. The close claimed the inline test in place of round 1's module-level list; the frame names no such list, and the behaviour is the same. The close also claimed each case red under the guard it names, and the round showed it, executed. With `daemon.ts:663` passing no payload, the new daemon case failed at `daemon.test.ts:2898`, the line that finds no `turn-failed` message. With the guard at `agent-events.ts:23` removed, that case failed at `:2898` and "maps each Claude Code hook" failed at `:2747`. Each run exited 1, and the files were restored with `git checkout` after. *Scope* item 3 (`frame/design.md:42`) and both `to` sentences state the guard; finding 1 is about how the `to` sentences word it, and finding 2 is about the memo.

```seal
confirms: round-1#3
```
What holds: `changelog.md:3` reads "Claude Code sends `StopFailure` in place of `Stop`, and Owlery did not listen to `StopFailure`", which is true of `hooks.ts` at `e9fe914c`, read. `git grep -n -F 'listened to neither' 5d4ea30d -- . ':!seal/threads/*/trail/rounds/*'` printed nothing (executed, exit 1). The change is in `changelog.md` alone, and `pr.md` carries no sentence of it.

What matched: the orchestrator's fold in `5d4ea30d` states the code at the target. `frame/design.md:80` says `agentEventFor` takes the payload and `agentEvent` passes it, and changes nothing else; `git diff e9fe914c 5d4ea30d -- apps/desktop/src/daemon/daemon.ts` shows the one line at `daemon.ts:663` (executed). `frame/plan.md:14` says the same. `phase-1.md:5` and `:14` say what the fix pass changed, and match `bbc76486` and `257939bc`, read.

What matched: each new case of the fix pass covers something its group did not. The new assertion of "maps each Claude Code hook" (`daemon.test.ts:2747`) is the one case of `agentEventFor` with a payload. The new daemon case (`daemon.test.ts:2889-2900`) is the one that holds `daemon.ts:663` passing the payload, which the unit assertion cannot hold.

The frame's *User scenarios & acceptance* holds no row for a subagent's `StopFailure`, though *Scope* item 3 now states it (`frame/design.md:42`, `:69`). The two cases above hold it, so the gap leaves the code as the frame says, and it is named here and not as a finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| That a real session's `StopFailure` carries no `agent_id`, and a subagent's carries one. The round carried round 1's reading of the CLI and ran no session | `frame/questions.md` Q1 | the owner, by allowing Q1's run |
| The whole suite, the repository-wide lint and the typecheck at the target, labelled `unverified` | the broad gate | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` in the clone | exit 0 |
| `node scripts/test-in-electron.mjs test/agent-state.test.ts test/agent-events.test.ts test/hooks.test.ts`, in `apps/desktop` at `5d4ea30d` | 3 files, 44 passed, exit 0 |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "API error\|maps each Claude Code hook"`, at `5d4ea30d` | 4 passed, 394 skipped, exit 0 |
| The cases "reads no session log of a pane whose turn ended on an API error" and "working at the API error of one of its subagents" by `-t`, with `daemon.ts:671` as `else if (event !== "turn-failed") this.endLog(session);` and `daemon.ts:663` as `agentEventFor(hookName)` | 2 failed, at `daemon.test.ts:2916` and `:2898`, exit 1; `daemon.ts` restored after |
| "maps each Claude Code hook" and "working at the API error of one of its subagents" by `-t`, with `agent-events.ts:23` removed | 2 failed, at `daemon.test.ts:2747` and `:2898`, exit 1; `agent-events.ts` restored after |
