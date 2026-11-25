# Review round 6: 1795591289-225-the-broad-gate-hands-a-panes-owlery

```seal
target: 2ab88eac04c7ace1459dd8962f3dbc13f93c88e4, fixes 336fcf3702ca30444a3075effa9169859c94a94e..2ab88eac04c7ace1459dd8962f3dbc13f93c88e4
```

This is a verifying round. It reviews the fix diff `336fcf37..2ab88eac`, which holds four commits. `499d5694` is the round 5 record. `7d3f9d5a` changes `apps/desktop/src/daemon/hooks.ts`, `apps/desktop/test/daemon.test.ts` and `apps/desktop/test/gate.test.ts`. `fd0af506` changes `changelog.md`, `frame/design.md` and `gaps.md`. `2ab88eac` adds the fix pass's two close blocks to `round-5.md`. The round read `git show --stat` of each commit, and each one touches only those paths. At `2ab88eac` the round read these files whole: `routing.md`, `frame/design.md`, `gaps.md`, `changelog.md` and `trail/rounds/round-1.md` to `round-5.md`. No `frame/plan.md`, `frame/questions.md`, `pr.md`, `pr.<lang>.md`, `trail/phases/` or `seal/parity.json` stands, and the prompt names no `decisions.md`. `seal/config.json` has no `Pact` key. `Record language` and `Commit and pull request language` are both English. The round read issue #225's body and the owner's comment on it again. The round's commands were read-only `git` and `gh` calls. It ran no test.

Some facts are carried from rounds 1 to 5 and were not re-established. The first is the state of the tree at `d4a63f35`, which round 3 read. The second is the two `## Rule changes` `from:` sentences at `docs/architecture.md:160` and `docs/architecture.ko.md:160`. Round 5 re-read both after the merge, and the fix diff touches no file under `docs/`. The third is round 5's reading that the merge carried this work's own units unchanged. This round reopened the coordinates the fix diff rests on: `apps/desktop/src/daemon/hooks.ts:150-229`, `apps/desktop/src/daemon/gate.ts:47-60`, `apps/desktop/src/daemon/daemon.ts:313`, `:2455-2458` and `:3708-3710`, `apps/desktop/src/daemon/chain-command.ts:388-400`, `:532-536` and `:601`, `apps/desktop/src/daemon/main.ts:48-50` and `:96-98`, and `apps/desktop/src/daemon/daemon.ts:237-247`. It ran `git grep` again for `OWLERY_RUN` and for the four other names across `apps/desktop/src`, and for `PANE_VARIABLES` across the tree.

## Findings

### 1. The new gate case says the gate holds no variable a pane's command sets, and the frame keeps `CLAUDE_CONFIG_DIR`, which a pane's command sets

```seal
severity: should
location: `apps/desktop/test/gate.test.ts:141-142`
evidence: read `apps/desktop/test/gate.test.ts:136-154`, `apps/desktop/src/daemon/hooks.ts:150-155`, `apps/desktop/src/daemon/hooks.ts:158-172`, `apps/desktop/src/daemon/hooks.ts:201-212`, `apps/desktop/src/daemon/gate.ts:54-60`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:16-20`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:27`
regression: round-5#1
```

Why it matters: the unit is the case at `gate.test.ts:141-154`, which `7d3f9d5a` adds as part of the fix of round-5#1. No `frame/plan.md` stands. The frame says the gate's command holds none of the pane variables and that `CLAUDE_CONFIG_DIR` stays (`frame/design.md:17`, `:20`). The fix named the case after every variable a pane's command sets. The defect came from reading that set off pane commands whose starts name no account folder.

The case's title says the gate's environment "holds no variable that the command of a shell, of a Claude Code pane on the owl chain or off it, or of a worktree setup pane sets for that pane". Its comment at `:142` says the keys are read off what the commands return, "so a variable a later change adds to a pane's command is held too". Where a pane's account names a folder, a shell's command sets `CLAUDE_CONFIG_DIR` in its environment (`hooks.ts:206`). A Claude Code pane's command sets it on its command line (`hooks.ts:152`, `:155`), so the session in that pane and the chain command it runs hold it too. `gateEnvironment` keeps it (`gate.ts:54-60`), and the frame's *Out* says it must (`frame/design.md:20`). The case holds the title only because every start it builds has `accountDir: null` (`gate.test.ts:145`). Scenario 2 cites this file as its check (`frame/design.md:27`). A sealer who reads this case for scenario 2 is told more than the scenario says. An agent who widens the case to a pane with an account folder sees it fail, and the title tells that agent the gate is wrong. The fix is to cut `CLAUDE_CONFIG_DIR`, which the frame keeps out.

The round built its list of statements by taking apart into sentences the three present-state records, and the comments and case titles the fix diff adds or changes. It kept each sentence that names what a pane's command sets or what the gate takes of a pane. That list is `changelog.md:3`, `:5` and `:6`, `frame/design.md:11`, `:16`, `:17`, `:18`, `:20`, `:26`, `:27`, `:28`, `:36` and `:41`, `gaps.md:5`, `:11` and `:12`, `hooks.ts:158-171`, `:215-220` and `:227`, `daemon.test.ts:7688-7689`, and `gate.test.ts:136`, `:141` and `:142`. Only `gate.test.ts:141` and `:142` state the fact wrongly. `changelog.md:6` says "none of that pane's own variables", and line 3 defines those as the five. `gaps.md:5` names the variables by `PANE_VARIABLES`. The comment at `hooks.ts:158-171` names `CONFIG_DIR_VARIABLE` as kept. The snippet changes the title and the comment and leaves the case's code as it is.

```ts
  it("holds none of the pane variables that the command of a shell, of a Claude Code pane on the owl chain or off it, or of a worktree setup pane sets for that pane, the runner of heavy commands among them", () => {
    // Every key these pane commands set, read off what they return. Their starts name no account folder, so no command here sets `CLAUDE_CONFIG_DIR`, which the frame keeps out of the cut. The set is pinned below, so a variable a later change adds to a pane's command fails this case there, and that change decides whether the variable is a pane variable.
```

```seal
verdict: fixed 3016a2e2
answer: The finding holds: the case's title and comment claimed every variable a pane's command sets, and a pane whose account names a folder sets `CLAUDE_CONFIG_DIR` (`hooks.ts:152`, `:206`), which the frame keeps. The paste-ready title and comment read true against `hooks.ts`, `gate.ts:54-60`, `frame/design.md:20` and the case's own starts, which all name no account folder, so they are applied as given. Whole read of every sentence that names what a pane's command sets or what the gate takes, in `frame/design.md`, `gaps.md`, `changelog.md`, the `hooks.ts#PANE_VARIABLES` comment, `daemon.test.ts:7688-7708` and `gate.test.ts:136-154`: each names the five variables or the constant, and the ones that mention `CLAUDE_CONFIG_DIR` (`hooks.ts` comment, `design.md` *Out*) say it stays. No other sentence needed a change.
```

## Confirmations

```seal
confirms: round-5#1
```
What holds: three sentences of this work listed four variables, and since the merge a pane's command also sets `OWLERY_RUN`. The close took the owner's other answer: the runner joins the list. `hooks.ts#PANE_VARIABLES` now names five variables (`apps/desktop/src/daemon/hooks.ts:172`). `paneCommands` (`:209`), `setupPaneCommand` (`:223`) and `runnerEnv` (`:228`) read their keys from it. `withoutPaneVariables` deletes each of its values (`:177`). Both cuts still go through `withoutPaneVariables`: `spawnPane` (`apps/desktop/src/daemon/daemon.ts:2458`) and `gateEnvironment` (`apps/desktop/src/daemon/gate.ts:55`). `gateEnvironment` has two callers, the chain command's gate (`chain-command.ts:400`) and the daemon's gate, `gh` and push (`daemon.ts:3710`). The three sentences now name the five variables: the comment at `hooks.ts:158-171`, `gaps.md:5` and `changelog.md:3`. A `git grep` found no other place in `apps/desktop/src` that sets one of the five by its literal name. The other hits only read them: the hook relay (`hooks.ts:47`), the base (`chain-command.ts:179`), the stage folder (`:203`) and the turn socket (`:534`). No caller treats `PANE_VARIABLES` as an array, which it was before the fix. Finding 1 is a defect of the case that this fix added, and it leaves this close standing (read).

```seal
confirms: round-5#2
```
What holds: the `## Not done` item that described every pane is gone, and the section now reads `nothing` (`gaps.md:16`). Its subject, the runner left off the list, no longer stands at the target. `## Not done` holds decisions, and an item there is not a row of `## Not verified`, which is closed by marking it. The two `## Not verified` rows were rewritten in place, and each keeps its item (`gaps.md:11`, `:12`). So no row left the memo (read).

What matched: the reframe against the issue. Issue #225's first *Done when* line leaves the cut to the frame, and it gives `OWLERY_RUN` as an example of what the gate's command might still need. The frame now cuts it (`frame/design.md:16-17`). It says this was on the owner's word (`:49`). That is a claim about a conversation, and the SDD set now states the choice. Reading supports the choice. The gate takes its turn before its command starts (`chain-command.ts:388`). The turn socket is read from the pane's own environment, `context.env`, and not from the gate's (`chain-command.ts:532-536`). Neither the `Broad gate` command nor any of the `Heavy commands` in `seal/config.json` names `OWLERY_RUN`. The runner's `run` builds its command's environment from `context.env` (`chain-command.ts:601`), not through `gateEnvironment`, so a heavy command run through the runner keeps the variable. The real daemon passes a runner wherever its script path is known (`main.ts:49-50`, `:97-98`), so each of its panes gets its own (read).

What matched: the two cases against their groups, and the claim that both were seen red. The daemon case at `apps/desktop/test/daemon.test.ts:7688-7708` now gives the outer pane a runner (`:7690`) and restores it through `cleanups` (`:7691-7698`). The daemon that `launching` starts writes no runner, so both panes must hold none (`:7704`, `:7707`). This covers the cut of an outer runner. `hooks.test.ts:307` does not cover that, because it reads only what the pane commands return. With the old four-name list, the outer `/outer/owl-run` reaches both panes, and the line fails at the runner's slot. The gate case at `gate.test.ts:141-154` is the group's first case to build the pane's environment from the pane commands themselves. It covers the runner and the setup pane, which the case at `:136-139` does not. With the old list, `:148` still holds and `:151` returns `["OWLERY_RUN"]`. So each case fails on the guard it names, and reading supports the close's "seen red". The start objects match `PaneStart` (`daemon.ts:237-247`), and the `carries` stand-in matches `Carried` (`hooks.ts:127-130`) (read).

What matched: the frame's rewritten lines. *Grounding* line 11 is dated to `282e3eab`, and round 5 read that `paneCommands` and `setupPaneCommand` set the runner there. *Scope* items 1 to 3 (`frame/design.md:16-18`) hold at `hooks.ts:172-229`, `daemon.ts:2458` and `gate.ts:55`. *Out* (`:20`) holds: `CLAUDE_CONFIG_DIR` is not on the list (`hooks.ts:172`), and a shell gets it only where the start names an account folder (`hooks.ts:206`). Scenario 2 (`:27`) is held by `gate.test.ts:141-154`, apart from its title, which finding 1 covers, and by `:136-139` for `OWLERY_BACKGROUND`. Scenario 3 (`:28`) still holds as it reads. The gate takes out the four variables it names, and scenario 1's case still sets them. Both `## Rule changes` `to:` texts (`:36`, `:41`) agree with the code (read).

What matched: the label in `gaps.md:11`. The whole suite is still labelled unverified, and the broad gate is named as its answerer. The row says the run of 459 cases in a pane does not hold the runner's cut, and it names the two cases that do. Both cases exist and hold that cut (read).

This round leaves one finding open. When the fix pass closes it, a verifying round reads the fix diff. After that come the orchestrator's broad run and the sealer's spawn.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the lint and the typecheck at `2ab88eac`. This round ran nothing | the repository's `Broad gate` | the orchestrator, through the broad gate the chain command runs from the pane |
| *Grounding* line 12's second run: the group passing 17 at `5cb81763` with the four variables unset and `OWLERY_RUN_DIR` kept. Only a run settles it | `frame/design.md:12` | the session that ran it. The broad gate runs the same condition at the target, not at `5cb81763` |
| Scenario 3: the group passing in a pane that holds the four variables. The session claims 459 cases passed there at `7d3f9d5a` (`gaps.md:11`) | `frame/design.md:28` | the session that ran it, or the owner |
| The claim that the pane of `balmy-bison` holds no `OWLERY_RUN` because the app that started it writes no runner. Only a read of that pane's environment settles it | `gaps.md:11` | the session that ran the cases in that pane |
| A daemon started by `pnpm start` in an Owlery pane, with a real Claude Code pane in it | `gaps.md:12` | the owner, where they start the app from a pane |
| #226's comments say every pane names the runner in `OWLERY_RUN`, and a sign-in pane does not. These lines come from the base, not from this pull request's diff | `apps/desktop/src/daemon/hooks.ts:198-199`, `apps/desktop/src/daemon/pane-chain.ts:28`, `apps/desktop/src/daemon/main.ts:39`, `apps/desktop/src/daemon/main.ts:49` | the orchestrator: whether to file it against #226's code |

## Probes

| Command | Result |
|---|---|
