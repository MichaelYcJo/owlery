# Guarantee: 1795673152-188-a-turn-ended-on-an-api-error-stops-working

The sealer audited the branch `fix/188-a-turn-that-ends-on-an-api-error-leaves-its-session-working` at `1208f64b` against the base `release/v0.0.5`, which resolved to `911d9bf0` through `origin/release/v0.0.5` (no local branch or upstream answered first).

The work holds against the issue and the tree: the code, the cases, the frame, the changelog and the pull request body tell one story, and every claim the sample re-ran held. The first run's verdict, the first block below, was withheld for one reason only. Round 2's finding 2 names a code path on its `location:` line, so the pull request check gives its fix to a verifying round and not to the sealer, and no round after round 2 stood.

**The second run audits `08da863b`.** The one commit after the first run's target, `08da863b`, adds `trail/rounds/round-3.md` alone (executed, `git diff --stat 1208f64b 08da863b`). Round 3 targets `1208f64b, fixes 5d4ea30d..1208f64b`, confirms `round-2#1` and `round-2#2`, and raises no finding. That commit touches no coordinate of a claim re-run below, so no claim is run again and each row stands at `08da863b`. The rows of the broad run, the body and the parties are read again for this run.

## The record of the broad run and the body

- executed: `trail/gate.md`'s last `seal` block reads `run: 95e9ee8e against 911d9bf0`. `git merge-base --is-ancestor 95e9ee8e HEAD` exited 0, and `git log --no-merges --name-only 95e9ee8e..HEAD ^911d9bf0` names one commit, `1208f64b`, touching `trail/gate.md` of this work item alone. The broad run stands at a commit that only this work item's records follow.
- executed: `git merge-tree --write-tree 1bfc1c41 911d9bf0` printed the tree `66daedeb`, the same tree `95e9ee8e` holds. The merge of the release branch is git's own merge and added nothing.
- executed: `seal pr-body <item> --body <the body file> --check` exited 0: the body is `pr.md` above `## From the records` and the records' text below it.
- executed: `chain_check.py --baseline 911d9bf0 --root . --sealing` in the audit's clone exited 0, as it does where no pull request is ready, and printed `round-2.md:54  ### 2. The closing memo does not name the unverified claim the subagent guard stands on — reads verdict: fixed d1e4dd5c in the last record, and no round after it read it: a verifying round is owed`.

For the second run, at `08da863b`:

- executed: `git log --no-merges --name-only 95e9ee8e..HEAD ^911d9bf0` names `1208f64b` (`trail/gate.md`) and `08da863b` (`trail/rounds/round-3.md`), each under this work item's directory alone. `origin/release/v0.0.5` still resolves to `911d9bf0`.
- executed: `seal pr-body <item> --body <the body file composed at 08da863b> --check` exited 0.
- executed: `chain_check.py --baseline 911d9bf0 --root . --sealing` exited 0 and named only `guarantee.md`, which git does not yet carry. It names no round record: the line owing a verifying round for `round-2.md:54` is gone.

## Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The three narrow files pass at the target (executed) | `trail/rounds/round-2.md`, *Probes*, row 2 | `node scripts/test-in-electron.mjs test/agent-state.test.ts test/agent-events.test.ts test/hooks.test.ts` in `apps/desktop` at `1208f64b`, through the machine's runner of heavy commands, `OWLERY_BACKGROUND=1` | holds: 3 files, 44 passed, exit 0 |
| The four daemon cases pass at the target (executed) | `trail/rounds/round-2.md`, *Probes*, row 3 | `node scripts/test-in-electron.mjs test/daemon.test.ts -t "API error\|maps each Claude Code hook"` at `1208f64b` | holds: 4 passed, 399 skipped, exit 0 |
| Each new case of `agent-state.test.ts`, `agent-events.test.ts` and `hooks.test.ts` was seen red against the code before the change | `trail/phases/phase-1.md:9-11` | the narrow run above with `apps/desktop/src` restored from `911d9bf0` in the at-base clone | holds: 3 failed of 44, exit 1, at `agent-events.test.ts:17` (text `null`), `agent-state.test.ts:22` (`expected undefined to be 'waiting'`) and `hooks.test.ts:62` (`to include 'StopFailure'`) |
| The daemon cases "maps each Claude Code hook", "lists a Claude Code session whose turn ended on an API error" and "reads no session log of a pane whose turn ended on an API error" were seen red against the code before the change | `trail/phases/phase-1.md:12-14` | the daemon run above with `apps/desktop/src` restored from `911d9bf0` | holds: 3 failed, exit 1, at `daemon.test.ts:2746` (`expected undefined to be 'turn-failed'`), `:2882` (timed out, the session staying `working`) and `:2916` (`interruptions(c)`, the watch still on at base). The subagent case passes there, as an absence case does, and is the next row |
| The subagent case and the new assertion of "maps each Claude Code hook" fail with the subagent guard alone removed | `trail/rounds/round-1.md:100`, the close of finding 2 | the daemon run with HEAD's code and `agent-events.ts:23` deleted | holds: 2 failed, exit 1, at `daemon.test.ts:2747` (`expected 'turn-failed' to be undefined`) and `:2898` (one `turn-failed` message); the line names the guard |
| The subagent case fails where `Daemon#agentEvent` passes no payload, and the log watch case fails where the watch stays on at a failed turn | `trail/rounds/round-1.md:44`, `:100` | the daemon run with HEAD's code, `daemon.ts:661` as `agentEventFor(hookName)` and `daemon.ts:669` as `else if (event !== "turn-failed") this.endLog(session);` | holds: 2 failed, exit 1, at `daemon.test.ts:2898` and `:2916` (`interruptions(c)`); each line names its guard. The at-base clone was restored to HEAD with `git checkout HEAD -- src` after each run |
| The fixture is the hooks reference's example, and the reference says `StopFailure` runs in place of `Stop` at an API error | `frame/design.md` *Grounding*, the table of the event's shape; `apps/desktop/test/fixtures/claude-stop-failure.json` | `curl -sL https://code.claude.com/docs/en/hooks.md` (exit 0), then read the *StopFailure* section | holds: the section opens "Runs instead of Stop when the turn ends due to an API error", and its example is the fixture's `payload` field for field |
| `## Removes`: the docstring sentence "finished at the end of its turn" is gone | `frame/design.md` *Removes* | `git grep -n -F "finished at the end of its turn" HEAD -- apps docs` | holds: no match, exit 1; `agent-state.ts:6-8` reads "finished at the end of a turn that ended without one" |

Not re-run: the crafter's four `seal mutate` runs (`trail/phases/phase-1.md:20`) and the crafter's `tsc --noEmit`, which the broad run covers. The minified code of Claude Code 2.1.332 that round 1 read for the subagent's `agent_id` was not read again. It stays `unverified`, answered by the owner through `frame/questions.md` Q1, as `gaps.md:7-8` say.

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | `StopFailure` gains a hook and maps to a neutral `turn-failed`, which leaves the session `waiting` with `last_assistant_message` as its text; a `StopFailure` naming `agent_id` maps to nothing; the rule of *Overall layout* is the settle's | the issue's two *Done when* lines; the diff, file for file against *Data & interfaces*; the fixture's version and date | none |
| the build | `trail/phases/phase-1.md` for the one phase whose Status cell holds a commit (`75ef7bc2`), with the fix passes of round 1 named in it | the diff, the cases re-run above, `routing.md` *Why this way* (crafter on the daemon's state and its cases) | none |
| the last round | round 3 confirms `round-2#1` and `round-2#2` and raises no finding; it judges a teammate's dropped `StopFailure` no finding, since the teammate's error reaches the lead and the session's own turn carries no `agent_id` | the sealer's read of `d1e4dd5c` at HEAD, below; `agent-teams.md`, fetched with `curl -sL` (exit 0), whose line reads "A teammate whose turn ends on an API error notifies the lead that it failed and includes the error text"; `adapters/claude.ts:92` and `:98`, where `--agent` goes only to a role session, which runs with `disableAllHooks: true` | none |
| the orchestrator's part of the pull request body | `Closes #188.` and seven quotes of `frame/design.md` *Scope* items 1, 2, 4, 5, 6 and `frame/questions.md` Q1 | each quote stands word for word at its coordinate, read; no `pr.<lang>.md` is owed, since both language keys of `seal/config.json` read English | none |
| the orchestrator's hand-over | first run: the two findings of round 2 touch the work item's records alone, so their fix is the sealer's to read at HEAD. Second run: round 3 reads that fix, and `08da863b` adds `round-3.md` alone | second run: the chain check at `08da863b`, which owes no round, and `git diff --stat 1208f64b 08da863b` | first run: finding 2 is located at `trail/rounds/round-2.md:41` in `gaps.md:7` and in `apps/desktop/src/daemon/agent-events.ts:23`, so the check gave its fix to a round, as the first block says. Round 3 answers that, and the second run finds no disagreement |
| the changelog | a session whose turn ended on an API error says "Needs you" with the error's text; a pane launched before this build's daemon does not report it | `agent-state.ts:27`, the daemon case at `daemon.test.ts:2870`, `frame/design.md` *Scope*, Out | none |

**The fix pass that no round read, read at HEAD.** Round 2's finding 1 asked for both `to` sentences of *Rule changes* to say the hook runs for a subagent's turn that ends on an API error. `frame/design.md:88` and `:93` say so in the given words. Finding 2 asked for a `gaps.md` row naming what the subagent guard stands on. `gaps.md:8` holds it word for word, and its coordinate `agent-events.ts:23` is the guard at HEAD. `git grep -n -i -F subagent` and `git grep -n -F 서브에이전트` over the work item's records outside `trail/rounds/` list `frame/design.md:42`, `:57`, `:88`, `:93`, `gaps.md:8` and `trail/phases/phase-1.md:5`, and HEAD contradicts none of them. That list is a sample under contract rules 12 and 19. The read agrees with what both findings asked. In the first run it did not lift the check's refusal of finding 2; round 3 is the round that read that fix.

**Read, not judged.** The hooks reference fetched today says `agent_id` names "the subagent or in-process teammate the hook fires in", so the guard drops a teammate's `StopFailure` as it drops a subagent's. The frame does not name teammates. Round 3 judged this no finding, and the sealer read its grounds against the reference and the code without re-judging them. Whether a real session's own `StopFailure` carries no `agent_id` stays `unverified` at `gaps.md:8`, for the owner through Q1's run.

No `seal/parity.json` stands, so no comparison with an original is owed.

```seal
target: 1208f64b against 911d9bf0
Verdict: withheld reason: round 2 finding 2 (trail/rounds/round-2.md:37, closed fixed d1e4dd5c) is located on its location line at round-2.md:41 in gaps.md:7 and in apps/desktop/src/daemon/agent-events.ts:23, a path outside the work item's records, so chain_check.py gives its fix to a round and prints "a verifying round is owed" for round-2.md:54; the orchestrator's hand-over says the fix is the sealer's to read. A verifying round over 5d4ea30d..HEAD that confirms round-2#1 and round-2#2 is owed, and the sealer runs again after it
```

```seal
target: 08da863b against 911d9bf0
Verdict: sealed
```
