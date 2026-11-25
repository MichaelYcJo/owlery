# Review round 1: 1795591289-225-the-broad-gate-hands-a-panes-owlery

```seal
target: 0b73363f633b7acc742a894f33d96cb525989985 against release/v0.0.4
```

This is the first round, so no fact is carried from an earlier record. Every coordinate below was opened in this round. The round read `routing.md`, `frame/design.md`, `gaps.md` and `changelog.md` whole at `0b73363f`. No `frame/plan.md`, `frame/questions.md`, `pr.md`, `pr.<lang>.md` or `trail/phases/` stands. The memo's `## Scope confirmation` stands in the plan's place. The prompt names no `decisions.md`. No `seal/parity.json` stands, and `seal/config.json` has no `Pact` key. The round also read issue #225's body and the owner's comment on it.

**The range this round reviews.** In this worktree `release/v0.0.4` resolves to `db398387`. That is one commit behind `origin/release/v0.0.4`, which is at `5cb81763` (#212) and is the branch's parent. The diff in the prompt was taken against the local ref. So it also carries #212's 20 paths: the icon files, `TRADEMARKS.md`, the removal of `apps/desktop/test/emblem.test.ts`, and the removal of the whole `seal/threads/1795565280-owl-icon-from-the-seal/` directory, `gaps.md` among them. Those paths belong to the base and not to this work. The pull request merges into `5cb81763`. This round reviews `5cb81763..0b73363f`, which is three commits (`d4a63f35`, `ce29e80b`, `0b73363f`) and nine paths. The round read this with `git log` and `git merge-base` in the worktree.

## Findings

### 1. The frame's scenario 3 names the broad gate as its verifier, and the gate cannot fail on it

```seal
severity: should
location: `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:27`
evidence: read `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:25-27`, `apps/desktop/src/daemon/gate.ts:54-60`, `apps/desktop/src/daemon/chain-command.ts:344`, `apps/desktop/src/daemon/daemon.ts:3530-3533`, `apps/desktop/test/daemon.test.ts:7589-7609`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/gaps.md:11`
```

Why it matters: scenario 3 holds only while the suite's own process carries the four variables: "passes when the suite runs in a pane that holds the four variables". Its verifier cell names two runs. One is the session's run in the pane of `balmy-bison`. The other is "the broad gate this work item's chain runs from that pane". This work's own cut at `gate.ts:55` removes the four variables before the gate's command starts. That holds for the chain command's gate (`chain-command.ts:344`) and for the daemon's (`daemon.ts:3532`). So under the gate the group runs without the condition the row names. The issue's comment records that the group passed 17 of 17 with the variables unset, before any fix. The gate's pass therefore shows scenario 2's cut and says nothing about scenario 3. A sealer who reads this row will take the gate's pass as scenario 3 holding.

Two things do hold the condition. The first is the session's own run, which `gaps.md:11` claims (443 cases in a pane that holds the four variables). The second is scenario 1's case, which sets the four variables in the suite's own process (`daemon.test.ts:7591-7593`), and the gate does run that case. No other record says the gate verifies scenario 3, so the repair changes only this cell.

```markdown
| 3 | `test/daemon.test.ts`'s group "a Claude Code pane and the owl chain" passes when the suite runs in a pane that holds the four variables. | The session's run of the group in the pane of `balmy-bison`, which holds the four variables (`gaps.md` *Not verified*). The broad gate cannot hold this row: `gateEnvironment` takes the four variables out before the suite starts (`apps/desktop/src/daemon/gate.ts`), so under the gate the group runs without them. What the gate runs of this condition is scenario 1's case, which sets the four variables in the suite's own process. |
```

### 2. The `gateEnv` option's comment still describes the gate's environment without the new cut

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:285`
evidence: read `apps/desktop/src/daemon/daemon.ts:285`, `apps/desktop/src/daemon/daemon.ts:3530-3533`, `apps/desktop/src/daemon/gate.ts:47-60`
```

Why it matters: `daemon.ts:285` lists what the default environment of a broad gate takes out: "a pane's without the variables that say a terminal stands, with the `PATH` the person's interactive login shell prints". After `ce29e80b`, `gateEnvironment` also takes out the four pane variables (`gate.ts:55`), and its own comment now says so (`gate.ts:47-53`). The option's comment still lists the old cuts only. An agent that reads it will conclude that a pane's `OWLERY_CHAIN` and `OWLERY_BASE` reach the gate, which is the defect this work removes. Rule 19 asks that the same change rewrite every statement of the old fact.

This round searched the sources and the policy documents for the phrases "say a terminal stands" and "environment a broad gate". Besides `gate.ts`, the search found `daemon.ts:285` and `daemon.ts:3530`. The second one, "a pane's with the `PATH` of the person's interactive login shell", lists no variable it takes out and points to `gate.ts#gateEnvironment`. It stays true, so the snippet below leaves it as it is.

```ts
  /** The environment a broad gate's command runs with. When absent, it is a pane's without the variables that say a terminal stands and without the variables of the pane the daemon was started from (`hooks.ts#PANE_VARIABLES`), with the `PATH` the person's interactive login shell prints, which the daemon asks that shell for once (`gate.ts#gateEnvironment`). */
```

### 3. The changelog says every pane named the outer chain command, and that each pane now gets its own hook socket

```seal
severity: should
location: `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/changelog.md:3`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/changelog.md:5`
evidence: read `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/changelog.md:3-6`, `apps/desktop/src/daemon/hooks.ts:192-203`, `apps/desktop/src/daemon/hooks.ts:212-214`, `apps/desktop/src/daemon/daemon.ts:2403-2406`, `apps/desktop/src/daemon/daemon.ts:2478`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:8`
```

Why it matters: the changelog becomes the release's note, and two of its sentences tell a person something the code contradicts.

- Line 3: "Every pane that daemon opened then named the outer pane's chain command". Before the fix, `spawnPane` laid the command's own environment over the daemon's (`frame/design.md:8`, dated to `d4a63f35`). `paneCommands` gives a pane on the owl chain its own `OWLERY_CHAIN` (`hooks.ts:200`). So a pane on the chain always named its own launcher. Only panes whose command sets no chain named the outer pane's.
- Line 5: "and gives each pane its own id and hook socket". A setup pane's command sets `OWLERY_PANE_ID` alone (`hooks.ts:213`, used at `daemon.ts:2478`). After the cut at `daemon.ts:2405`, a setup pane of such a daemon holds no hook socket at all. It holds neither its own socket nor the outer pane's.

Line 6, and the rest of lines 3 and 5, hold as they read.

```markdown
Issue #225. A pane under the owl chain holds four variables of its own: its id, the hook socket it reports to, the chain command and the work item's base. A daemon or a broad gate started in such a pane inherited them. Every pane that daemon opened whose own command sets no chain, a shell among them, then named the outer pane's chain command, and the broad gate of this repository failed six cases when the owner sealed a branch from a pane.

- **A pane holds a chain's variables only where its own command sets them.** A daemon started in an Owlery pane, for example by `pnpm start` typed there, gives a shell and a Claude Code pane on no chain no `OWLERY_CHAIN` and no `OWLERY_BASE`, and gives each pane only the id and hook socket its own command sets. The daemon's run folder, `OWLERY_RUN_DIR`, still reaches every pane.
```

## Confirmations

What matched: *Scope* item 1. `spawnPane` takes the pane variables out of the daemon's environment before the command's own variables go over it (`apps/desktop/src/daemon/daemon.ts:2405`). A sign-in pane runs with `inherit` false and gets its command's environment alone, as before, which is what *Out* says (`daemon.ts:2382`, `:2405`) (read).

What matched: *Scope* item 2. `gateEnvironment` applies the cut over `terminalEnv` (`apps/desktop/src/daemon/gate.ts:55`). Both of its callers go through it: the chain command's gate (`apps/desktop/src/daemon/chain-command.ts:344`) and the daemon's gate, `gh` and push (`daemon.ts:3532`). The chain command still reads `OWLERY_BASE` and `OWLERY_RUN_DIR` from the pane's own environment (`chain-command.ts:164`, `:188`). The cut reaches only the environment the command runs with (read).

What matched: *Scope* item 3. `PANE_VARIABLES` stands beside the code that sets the four variables (`apps/desktop/src/daemon/hooks.ts:165`, `:200`, `:213`). Both cuts import `withoutPaneVariables` (`daemon.ts:73`, `gate.ts:10`). A search of `apps/desktop/src` for the four names found no other place that sets them (read).

What matched: the frame's *Out*, and what it leaves alone. `OWLERY_RUN_DIR` is set by the app for the daemon it starts (`apps/desktop/src/main/daemon-client.ts:53`) and read by the chain command (`chain-command.ts:188`), so keeping it in a pane and in the gate is a stated choice. The issue's first *Done when* line leaves that cut to the frame. A role session gets no pane variable even from a daemon started in a pane, because `claudeEnv` builds a session's environment from named variables only (`apps/desktop/src/daemon/adapters/claude.ts:116-125`). The frame's narrower scope therefore leaves no role-session path open. `terminalEnv` filters no `OWLERY_` name (`apps/desktop/src/daemon/pty.ts:18-36`, `:62-72`), so the cut is what removes them (read).

What matched: the new gate case against its group. The group's first case covers `TERM`, `COLORTERM`, `CLAUDECODE`, `npm_` and the path (`apps/desktop/test/gate.test.ts:129-133`). The new case covers the four variables, and it keeps `OWLERY_RUN_DIR` and `OWLERY_BACKGROUND` (`:135-138`). The two cases share no fact. Without the cut at `gate.ts:55`, the four variables reach the result and `toEqual` fails, so reading settles that the case can fail (read).

What matched: the new daemon case against its group. The case at `apps/desktop/test/daemon.test.ts:7567-7587` holds the chain's variables under a daemon environment that has none. The new case at `:7589-7609` puts the outer pane's variables into the suite's process and restores them through `cleanups` (`:7592-7599`). The shell's line at `:7608` is what pins the cut: without `daemon.ts:2405` the shell gets `/outer/owl-chain` and `outer-base`. The Claude Code pane's line at `:7605` holds on either side of the cut, because `hooks.ts:200` sets all four variables for that pane. That line pins a fact scenario 1 states, not the cut. No record says either new case was seen red. Reading settles that each can fail (read).

What matched: the issue's *Done when* lines. Line 1 is `gate.ts:55`. Line 2 is an alternative the frame did not take. Line 3 is `gate.test.ts:135-138`. Line 4 is scenario 3, and finding 1 covers it.

What matched: `## Rule changes`. Both `from:` sentences stand word for word: at `docs/architecture.md:160`, under *What each session loads* (`:144`), and at `docs/architecture.ko.md:160`, under *세션마다 싣는 것* (`:144`). Rule changes are written into the policy root at the settle (the plugin's `skills/implement/SKILL.md:72`), so this diff owes no edit under `docs/` (read).

What matched: the frame's *Grounding* lines 7 to 10, against `d4a63f35` and the target (`hooks.ts:200`, `:213`, `daemon-client.ts:53`, `chain-command.ts:188`) (read).

What matched: the label in `gaps.md:11`. The whole suite is labelled unverified, and the broad gate is named as its answerer. The row names the suite and the desktop app's `tsc --noEmit`. It does not name the repository-wide lint and typecheck. The `Broad gate` command, `pnpm -r run check`, answers those as well, so this round opens no finding on it (read).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the lint and the typecheck at `0b73363f`. This round ran nothing | the repository's `Broad gate` | the orchestrator, through the broad gate the chain command runs from the pane |
| Scenario 3: the group passing in a pane that holds the four variables. Only a run settles it. The session claims 443 cases passed there (`gaps.md:11`), and finding 1 says why the gate cannot settle it | `frame/design.md:27` | the session that ran it, or the owner |
| Whether a run with `OWLERY_RUN_DIR` kept was made. `frame/design.md:11` says the group "passed 17 with the four variables unset, `OWLERY_RUN_DIR` kept". The owner's comment on issue #225 records the run at the same commit with `OWLERY_RUN_DIR` unset as well | `frame/design.md:11` | the session. The broad gate, which keeps `OWLERY_RUN_DIR` and takes out the four variables, runs the frame's condition |
| A daemon started by `pnpm start` in an Owlery pane, with a real Claude Code pane in it | `gaps.md:12` | the owner, where they start the app from a pane |
| #212's 20 paths, which the prompt's diff carries because the local `release/v0.0.4` stands at `db398387` behind `origin/release/v0.0.4` at `5cb81763` | the prompt's diff | the orchestrator: whether the chain should take its base through `origin` |

## Probes

| Command | Result |
|---|---|
