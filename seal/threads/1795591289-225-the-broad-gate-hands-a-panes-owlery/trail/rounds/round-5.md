# Review round 5: 1795591289-225-the-broad-gate-hands-a-panes-owlery

```seal
target: 336fcf3702ca30444a3075effa9169859c94a94e, fixes 62a89562d07634bb408920fea8f7904b5ac40561..336fcf3702ca30444a3075effa9169859c94a94e
```

This is a verifying round. It reviews the fix diff `62a89562..336fcf37`, which holds three commits. `04dad930` is the round 4 record. `282e3eab` merges `origin/release/v0.0.4` at `d5a123a6`, which is issue #226, into the branch. `336fcf37` adds one item to `gaps.md`'s `## Not done`. The round read `git show --stat` of `04dad930` and `336fcf37`, `git show --cc` of the merge, and `git diff d5a123a6 282e3eab`. The merge resolved one conflict, the import line at `apps/desktop/src/daemon/daemon.ts:79`, and that line keeps both sides' names. Against the release side, the merge carries this work's own paths unchanged in content: `gate.ts`, `hooks.ts`, `daemon.ts`, `daemon.test.ts`, `gate.test.ts` and the work item's records. At `336fcf37` the round read these files whole: `routing.md`, `frame/design.md`, `gaps.md`, `changelog.md` and `trail/rounds/round-1.md` to `round-4.md`. No `frame/plan.md`, `frame/questions.md`, `pr.md`, `pr.<lang>.md`, `trail/phases/` or `seal/parity.json` stands, and the prompt names no `decisions.md`. `seal/config.json` has no `Pact` key. The merge added its `Heavy commands` key. `Record language` and `Commit and pull request language` are both English. The round also read issue #225's body and the owner's comment on it again. The round's commands were read-only `git` and `gh` calls, and it ran no test.

Some facts are carried from rounds 1 to 4 and were not re-established. They are round 1's *Scope* confirmations of the code at `0b73363f`, the two new cases read against their groups, and the state of the tree at `d4a63f35`, which round 3 read. The merge did not change those units. This round re-read the `## Rule changes` `from:` sentences at `docs/architecture.md:160` and `docs/architecture.ko.md:160`, and both stand word for word. Round 4 closed no finding, so no `confirms:`, `reopens:` or `regression:` line is owed for an earlier finding.

## Findings

### 1. Three sentences of this work still say a pane's command sets four variables, and since the merge it also sets `OWLERY_RUN`

```seal
severity: should
location: `apps/desktop/src/daemon/hooks.ts:158-166`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/gaps.md:5`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/changelog.md:3`
evidence: read `apps/desktop/src/daemon/hooks.ts:158-167`, `apps/desktop/src/daemon/hooks.ts:196-205`, `apps/desktop/src/daemon/hooks.ts:217-224`, `apps/desktop/src/daemon/gate.ts:47-60`, `apps/desktop/src/daemon/chain-command.ts:400`, `apps/desktop/src/daemon/main.ts:50`, `apps/desktop/src/daemon/main.ts:84-86`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/gaps.md:5`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/gaps.md:16`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/changelog.md:3`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:19`
```

Why it matters: issue #226 came in with the merge. Since then, `paneCommands` puts `OWLERY_RUN` into the same environment object as a pane's id, hook socket, chain command and base (`hooks.ts:204`, through `runnerEnv` at `:222-224`). `setupPaneCommand` puts it beside the setup pane's id (`hooks.ts:218`). The daemon always passes a runner where its script path is known (`main.ts:50`, `:84-86`). `gateEnvironment` cuts only `PANE_VARIABLES` (`gate.ts:54-60`), so the gate the chain command runs from a pane holds that pane's `OWLERY_RUN` (`chain-command.ts:400`). Three sentences of this work list what a pane's command sets as the four variables, and the target contradicts each one:

- `hooks.ts:159-161`: "The variables a pane's command sets for that one pane (`paneCommands`): its id and the hook socket it reports to, and, on the owl chain, the chain command and the work item's base." The comment closes with what stays, which is the run folder, and says nothing of the runner. An agent that edits the list reads this comment to learn what a pane's command sets and what is kept on purpose.
- `gaps.md:5`: "A pane and the broad gate's command take none of the variables of the pane they were started from: its id, its hook socket, its chain command and its base". The memo's own new item at `gaps.md:16` says that "the broad gate's command holds that runner too", meaning the outer pane's runner. The sealer reads `## Scope confirmation` as what the work guarantees, and two sections of one memo now give two answers.
- `changelog.md:3`: "A pane under the owl chain holds four variables of its own". At the target, such a pane's command sets five `OWLERY_` variables. The changelog becomes the note of the same release that ships #226.

The frame does not need to change. Its *Out* keeps "every other variable of Owlery's" where it is (`frame/design.md:19`), and that covers `OWLERY_RUN`. Issue #225's first *Done when* line names `OWLERY_RUN` as an example of what the gate's command must still see. So the repair names the four variables as the list's, and says the runner stays.

The round built the list of statements by splitting the three present-state records, and the comments and case titles this work added, into sentences. It kept each sentence that lists what a pane's command sets or what the gate takes of a pane. Besides the three above, that gives `changelog.md:5` and `:6`, `frame/design.md:15`, `:16`, `:19`, `:25`, `:27`, `:35` and `:40`, `daemon.ts:313`, `daemon.ts:2455`, `gate.ts:47-53` and the case title at `daemon.test.ts:7688`. These hold, because each one names the four variables or "a chain's variables" by name, or says Owlery's other variables stay. `frame/design.md:7` and `:9` are dated to `d4a63f35`, where no runner existed. The snippets below cover all three statements.

```ts
/**
 * The variables a pane's command sets for that one pane's chain and hooks
 * (`paneCommands`): its id and the hook socket it reports to, and, on the
 * owl chain, the chain command and the work item's base. A process started
 * in an Owlery pane holds the pane's, so a daemon, and the broad gate's
 * command, started there takes none of them from its own environment: a
 * pane holds a chain's variables only where its own command sets them. The
 * run folder is the daemon's, set by the app that starts it, and stays. So
 * does the runner of heavy commands in `OWLERY_RUN`, which a pane's command
 * also sets where the daemon wrote one (`runnerEnv`).
 */
```

```markdown
A pane and the broad gate's command take none of the four variables of the pane they were started from that `hooks.ts#PANE_VARIABLES` lists: its id, its hook socket, its chain command and its base (`frame/design.md` *Scope*). The pane's runner of heavy commands, `OWLERY_RUN`, stays, as `## Not done` says.
```

```markdown
Issue #225. A pane under the owl chain holds four variables for its chain and its hooks: its id, the hook socket it reports to, the chain command and the work item's base. A daemon or a broad gate started in such a pane inherited them. Every shell, Claude Code pane on no chain and worktree setup pane that daemon opened then named the outer pane's chain command, and the broad gate of this repository failed six cases when the owner sealed a branch from a pane.
```

```seal
verdict: fixed fd0af506
answer: The finding holds: since the merge a pane's command sets `OWLERY_RUN` as well, and three sentences listed four variables. On the owner's word the fix differs from the paste-ready snippets, which kept the runner off the list: the runner joins it. `7d3f9d5a` makes `hooks.ts#PANE_VARIABLES` one constant that names the five variables, and `paneCommands`, `setupPaneCommand`, `runnerEnv` and `withoutPaneVariables` read their names from it. Its comment names the five and says why `CLAUDE_CONFIG_DIR` stays. A new case in `test/gate.test.ts` reads every key the pane commands return and finds none in the gate's environment, and the daemon case gives the outer pane a runner and finds none in either pane. Both were seen red with the constant as it stood. `fd0af506` rewrites `gaps.md`'s *Scope confirmation*, the changelog's lines 3, 5 and 6, and the frame's *Scope*, *Out*, scenario 2, a *Grounding* line on the merge and the two `## Rule changes` texts to match, with a `Reframed` line under the frame's mark.
```

### 2. The new `## Not done` item says a daemon that writes a runner gives each pane its own, and a sign-in pane gets none

```seal
severity: should
location: `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/gaps.md:16`
evidence: read `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/gaps.md:16`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:19`, `apps/desktop/src/daemon/hooks.ts:196-205`, `apps/desktop/src/daemon/hooks.ts:217-224`, `apps/desktop/src/daemon/daemon.ts:2423`, `apps/desktop/src/daemon/daemon.ts:2435`, `apps/desktop/src/daemon/daemon.ts:2455-2458`, `apps/desktop/src/daemon/adapters/claude-accounts.ts:155-158`, `apps/desktop/src/daemon/adapters/claude.ts:116-125`, `apps/desktop/test/daemon.test.ts:7509-7529`
regression: round-4
```

Why it matters: the unit is the item that `336fcf37` adds to `gaps.md`'s `## Not done`. That commit is the only fix after round 4. No `frame/plan.md` stands. The frame's *Out* says a sign-in pane runs in its command's environment alone and is unchanged (`frame/design.md:19`). The fix wrote the reach of the runner as each pane's. The defect came from describing the panes that `paneCommands` and `setupPaneCommand` make as every pane. That is the class rounds 2 and 3 found in the changelog and in *Grounding*.

The item says that `paneCommands` and `setupPaneCommand` set the runner "for every pane where the daemon wrote a runner, so a daemon that writes one gives each pane its own". A sign-in pane, where a person signs an account in to Claude Code, is made by neither function. `startSession` passes `inherit` as `signsIn === null` (`daemon.ts:2423`, `:2435`). So `spawnPane` gives that pane its command's `env` alone (`daemon.ts:2458`). That `env` is `claudeEnv` (`claude-accounts.ts:157`), and `claudeEnv` names no `OWLERY_` variable (`claude.ts:116-125`). So a sign-in pane holds no runner under any daemon. The item's next sentence, "a pane started under it still names the outer pane's runner", has the same gap for a daemon that writes none. The sealer reads this item to learn which panes hold which runner.

The item's other claims hold at the target, and *Confirmations* says how. The snippet rewrites the item's third and fourth sentences and keeps the rest word for word.

```markdown
- `OWLERY_RUN`, the runner of heavy commands, is not in `hooks.ts#PANE_VARIABLES`. It reached this branch with issue #226, in the merge of `release/v0.0.4` after round 4, and the frame was written before it existed. `paneCommands` and `setupPaneCommand` set it in the command of each shell, Claude Code pane and worktree setup pane where the daemon wrote a runner, so a daemon that writes one gives each of those panes its own. A sign-in pane runs in its command's environment alone and holds no runner. Where a daemon writes none, as a daemon a case starts may not, a shell, a Claude Code pane or a worktree setup pane started under it still names the outer pane's runner, and the broad gate's command holds that runner too. The broad gate's command and the repository's `Heavy commands` do not read it, and the chain command finds the same run folder through `OWLERY_RUN_DIR`, which this work keeps on purpose. Whether the runner belongs on the list is a question for a work item that frames it, and the owner decides whether to open one.
```

```seal
verdict: fixed fd0af506
answer: The finding holds: the item described every pane where only a shell, a Claude Code pane and a worktree setup pane get the runner. On the owner's word the item is gone rather than rewritten, because the runner it said was left out is now cut (`7d3f9d5a`), and `## Not done` reads `nothing`.
```

## Confirmations

What matched: this work's cuts still reach every gate path after the merge. #226's chain command `gate` builds its command's environment through `gateEnvironment(context.env, null)` (`apps/desktop/src/daemon/chain-command.ts:400`). The daemon's own gate, `gh` and push still go through `commandEnvironment` (`apps/desktop/src/daemon/daemon.ts:3708-3710`). The turn that `gate` asks the daemon for finds its socket from the pane's own environment, in `OWLERY_RUN_DIR`, `OWLERY_RUN` or `OWLERY_CHAIN` (`chain-command.ts:532-537`). It does not use the gate's environment, so the cut takes nothing the turn needs. `spawnPane` still applies `withoutPaneVariables` (`daemon.ts:2458`) (read).

What matched: the other claims of the item at `gaps.md:16`. A `git grep` for `OWLERY_RUN` outside the `.md` files finds one reader, `turnSocket` (`chain-command.ts:534`). The broad gate's command, `pnpm -r run check` and its doc checks (`seal/config.json`), and the three `Heavy commands` do not read it. The suite reaches `turnSocket` only through `chainCommand`, and it gives `chainCommand` its own environment, not the process's (`apps/desktop/test/heavy-run.test.ts:38`, `apps/desktop/test/chain-command-run.ts:57`). The daemon a case starts through `launching` passes no runner to `paneCommands` (`apps/desktop/test/daemon.test.ts:7521`). The real daemon passes one wherever its script path is known (`main.ts:50`). `turnSocket` and `stageFolder` read `OWLERY_RUN_DIR` first (`chain-command.ts:203`, `:535`), so "finds the same run folder through `OWLERY_RUN_DIR`" holds. Keeping the runner stays within the frame's *Out* (`frame/design.md:19`) and the issue's first *Done when* line (read).

What matched: no case the merge brought reads a pane's `OWLERY_RUN` from the process environment. `hooks.test.ts:307-326` reads what `paneCommands` and `setupPaneCommand` return. `pane-chain.test.ts:83-87` copies the process environment, but the runner sets `OWLERY_RUN_DIR` itself and the stand-in script does not read `OWLERY_RUN`. `daemon.test.ts` has no read of `OWLERY_RUN` (read). Only a run settles whether the whole suite passes in a pane, so that stays a row of *Not judged*.

What matched: the label in `gaps.md:11`. The whole suite is still labelled unverified, and the broad gate is named as its answerer. The row's run of 443 cases was made before the merge. So it did not include the cases #226 added to `chain-command.test.ts`, `hooks.test.ts`, `pane-chain.test.ts` and `daemon.test.ts`. The row does not claim it did, and the broad gate answers for the target (read).

What matched: no test of this work was added in the fix diff. The tests the merge brings are #226's, reviewed in that work item's chain, so no new case of this work had to be read against its group (read).

The same "every pane" wording stands in #226's comments at `apps/desktop/src/daemon/hooks.ts:193-194`, `apps/desktop/src/daemon/pane-chain.ts:28` and `apps/desktop/src/daemon/main.ts:39` and `:49`. Those lines reach this branch from the base and are not this pull request's diff. They are a row of *Not judged* below, not a finding of this work item.

This round leaves two findings open. When the fix pass closes them, a verifying round reads the fix diff. After that come the orchestrator's broad run and the sealer's spawn.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the lint and the typecheck at `336fcf37`, with #226's cases merged in. This round ran nothing | the repository's `Broad gate` | the orchestrator, through the broad gate the chain command runs from the pane |
| *Grounding* line 11's second run: the group passing 17 at `5cb81763` with the four variables unset and `OWLERY_RUN_DIR` kept. Only a run settles it | `frame/design.md:11` | the session that ran it. The broad gate runs the same condition at the target, not at `5cb81763` |
| Scenario 3: the group passing in a pane that holds the four variables, and since the merge the pane's `OWLERY_RUN` as well. The session claims 443 cases passed there before the merge (`gaps.md:11`) | `frame/design.md:27` | the session that ran it, or the owner |
| A daemon started by `pnpm start` in an Owlery pane, with a real Claude Code pane in it | `gaps.md:12` | the owner, where they start the app from a pane |
| #226's comments say every pane names the runner in `OWLERY_RUN`, and a sign-in pane does not. These are the base's lines, not this pull request's diff | `apps/desktop/src/daemon/hooks.ts:193-194`, `apps/desktop/src/daemon/pane-chain.ts:28`, `apps/desktop/src/daemon/main.ts:39`, `apps/desktop/src/daemon/main.ts:49` | the orchestrator: whether to file it against #226's code |

## Probes

| Command | Result |
|---|---|
