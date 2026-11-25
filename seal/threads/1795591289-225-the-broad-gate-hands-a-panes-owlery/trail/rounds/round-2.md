# Review round 2: 1795591289-225-the-broad-gate-hands-a-panes-owlery

```seal
target: 5579ed7124d4843409423092c246134abf810cd5, fixes 0b73363f633b7acc742a894f33d96cb525989985..5579ed7124d4843409423092c246134abf810cd5
```

This is a verifying round. It reviews the fix diff `0b73363f..5579ed71`. That diff holds five commits: `326e87c3` (the round 1 record), `da555e9d` (`frame/design.md`), `0d0b3e72` (`apps/desktop/src/daemon/daemon.ts`), `17a73729` (`changelog.md`) and `5579ed71` (the fix pass's close blocks in `round-1.md`). The round read `git show --stat` of each one, and each touches only the path its close names. At `5579ed71` the round read `routing.md`, `frame/design.md`, `gaps.md`, `changelog.md` and `trail/rounds/round-1.md` whole. No `frame/plan.md`, `frame/questions.md`, `pr.md`, `pr.<lang>.md` or `trail/phases/` stands, and the prompt names no `decisions.md`. No `seal/parity.json` stands, and `seal/config.json` has no `Pact` key. `Record language` is English.

Some facts are carried from round 1 and were not re-established. They are its *Scope* confirmations: `spawnPane`'s cut, `gateEnvironment`'s cut and its two callers, and `PANE_VARIABLES` beside the code that sets the four variables. Also carried are the two new cases read against their groups, the `## Rule changes` `from:` sentences in `docs/architecture.md:160` and `docs/architecture.ko.md:160`, and what the owner's comment on issue #225 records. This round reopened the coordinates the fix diff rests on: `apps/desktop/src/daemon/gate.ts:47-60`, `apps/desktop/src/daemon/hooks.ts:155-214`, `apps/desktop/src/daemon/daemon.ts:2370-2406` and `:3530-3533`, and `apps/desktop/test/daemon.test.ts:7589-7609`. Round 1's question about the base ref, its *Not judged* row 5, no longer applies to this round: the target line names the fix range.

## Findings

### 1. The changelog and the frame's *Grounding* still say every pane that sets no chain got the outer pane's chain, and a sign-in pane never did

```seal
severity: should
location: `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/changelog.md:3`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:8`
evidence: read `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/changelog.md:3`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:8`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:19`, `apps/desktop/src/daemon/daemon.ts:1761-1763`, `apps/desktop/src/daemon/daemon.ts:2382`, `apps/desktop/src/daemon/daemon.ts:2402-2406`, `apps/desktop/src/daemon/adapters/claude-accounts.ts:155-158`, `apps/desktop/src/daemon/adapters/claude.ts:115-124`, `apps/desktop/src/daemon/adapters/claude.ts:613`, `apps/desktop/src/daemon/daemon.ts:2478-2480`, `apps/desktop/src/daemon/hooks.ts:200`, `apps/desktop/src/daemon/hooks.ts:212-214`
reopens: round-1#3
```

Why it matters: round 1's finding 3 said that `changelog.md:3` claimed more panes named the outer pane's chain command than did. The fix in `17a73729` narrowed the claim to "Every pane that daemon opened whose own command sets no chain, a shell among them". One pane in that set never held the outer chain: the sign-in pane. That is the pane in which a person signs an account in to Claude Code. The daemon opens it through `startSession` with `signsIn` set (`daemon.ts:1763`). `startSession` passes `inherit` as `signsIn === null` (`daemon.ts:2382`), so `spawnPane` starts the sign-in pane in its command's environment alone (`daemon.ts:2405`). The same was true at `d4a63f35`, before this work. That command's environment is `claudeEnv` (`claude-accounts.ts:157`, wired at `claude.ts:613`). `claudeEnv` holds `HOME`, `USER`, `PATH`, `LANG`, one Claude Code flag and the config folder, and nothing else of the daemon's (`claude.ts:115-124`). So the close of round-1#3 holds for line 5 and not for line 3. The changelog becomes the release's note, and line 3 tells a reader that the sign-in pane carried the defect when it did not. The panes that did carry it are a shell, a Claude Code pane on no chain, and the pane that runs a worktree's setup, whose command sets only its id (`hooks.ts:212-214`, used at `daemon.ts:2478-2480`).

The same fact stands in the frame's *Grounding*, at `frame/design.md:8`, which is dated to `d4a63f35`. It says `spawnPane` "starts a pane in `{ ...process.env, ...env }`" and so "hands `OWLERY_CHAIN` and `OWLERY_BASE` to every pane whose command sets none". At `d4a63f35`, `spawnPane` already took the `inherit` branch for a sign-in pane. The frame's *Out* at `:19` does say so, but line 8 is read on its own as a statement of that commit. Round 1 confirmed the sign-in pane's branch and still wrote the line-3 snippet that includes it. This round found the other statement of the same fact by reading every sentence of the work item's records that says which panes received the daemon's environment: the changelog's lines 3 and 5, and the frame's lines 8, 15, 19 and 25. Only lines 3 and 8 state it wrongly.

The fix rewrites both lines. Line 5 of the changelog, and lines 15, 19 and 25 of the frame, hold as they read.

```markdown
Issue #225. A pane under the owl chain holds four variables of its own: its id, the hook socket it reports to, the chain command and the work item's base. A daemon or a broad gate started in such a pane inherited them. Every shell, Claude Code pane on no chain and worktree setup pane that daemon opened then named the outer pane's chain command, and the broad gate of this repository failed six cases when the owner sealed a branch from a pane.
```

```markdown
- `spawnPane` (`apps/desktop/src/daemon/daemon.ts`) starts a pane in `{ ...process.env, ...env }`, and a sign-in pane in its command's `env` alone, and `TerminalSession.spawn` (`apps/desktop/src/daemon/pty.ts`) filters that environment through `terminalEnv`. A daemon whose own environment holds the four variables therefore hands `OWLERY_CHAIN` and `OWLERY_BASE` to every pane other than a sign-in pane whose command sets none, and a daemon started in an Owlery pane holds them.
```

```seal
verdict: fixed ca92695b
answer: The finding holds: `startSession` starts a sign-in pane with `inherit` false, so it never took the daemon's environment. The changelog's line 3 and *Grounding*'s line 8 now read as the two paste-ready texts give them, and the frame's other lines and the changelog's line 5 are unchanged.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `frame/design.md:27` now reads word for word as round 1's paste-ready cell. Both of the cell's claims hold at the target. `gateEnvironment` takes the four variables out before the gate's command starts (`apps/desktop/src/daemon/gate.ts:55`). Scenario 1's case sets the four variables in the suite's own process (`apps/desktop/test/daemon.test.ts:7591-7593`), so the gate does run that case under the condition. The fix pass also corrected *Grounding* line 11. Its first sentence now says the run at `e098fc7a` unset `OWLERY_RUN_DIR` as well. That matches what round 1 recorded of the owner's comment on issue #225, which this round carried and did not reopen. Its second sentence claims a run in this work item's worktree at `5cb81763` with `OWLERY_RUN_DIR` kept. Only a run settles that, so it is a row of *Not judged* (read).

```seal
confirms: round-1#2
```
What holds: `apps/desktop/src/daemon/daemon.ts:285` now reads as round 1's paste-ready comment. It names the cut of `hooks.ts#PANE_VARIABLES`, which `gateEnvironment` applies (`gate.ts:55`) and its doc comment states (`gate.ts:47-53`). The comment says "the pane the daemon was started from". That holds for the daemon's own gate, because `commandEnvironment` builds the environment from the daemon's `process.env` (`daemon.ts:3530-3533`). The round ran `git grep` in the worktree for "say a terminal stands", "environment a broad gate" and `PANE_VARIABLES` across `apps` and `docs`, tests left out. It found `daemon.ts:285`, `:2402`, `:3530`, `gate.ts:48-51` and `hooks.ts:165-170`, and each one agrees with the cut (read).

The fix pass's own edit, `5579ed71`, adds only the three close blocks to `round-1.md`, and each one names the commit that touches the path its finding locates (read).

What matched: the second half of round-1#3. `changelog.md:5` now says each pane gets "only the id and hook socket its own command sets". That holds for a shell and a Claude Code pane (`hooks.ts:200`), for a worktree setup pane, which gets its id alone (`hooks.ts:213`), and for a sign-in pane, which gets neither (`daemon.ts:2405`, `claude.ts:115-124`). Finding 1 reopens round-1#3 for line 3 alone (read).

What matched: the label in `gaps.md:11`, which the fix diff did not change. The whole suite is still labelled unverified, and the broad gate is named as its answerer. The fix diff adds no test and no code unit other than the comment at `daemon.ts:285`, so no new case had to be read against its group (read).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the lint and the typecheck at `5579ed71`. This round ran nothing | the repository's `Broad gate` | the orchestrator, through the broad gate the chain command runs from the pane |
| *Grounding* line 11's second run: the group passing 17 at `5cb81763` with the four variables unset and `OWLERY_RUN_DIR` kept. Only a run settles it | `frame/design.md:11` | the session that ran it. The broad gate runs the same condition at the target, not at `5cb81763` |
| Scenario 3: the group passing in a pane that holds the four variables. The session claims 443 cases passed there (`gaps.md:11`) | `frame/design.md:27` | the session that ran it, or the owner |
| A daemon started by `pnpm start` in an Owlery pane, with a real Claude Code pane in it | `gaps.md:12` | the owner, where they start the app from a pane |

## Probes

| Command | Result |
|---|---|
