# Review round 4: 1795591289-225-the-broad-gate-hands-a-panes-owlery

```seal
target: 62a89562d07634bb408920fea8f7904b5ac40561, fixes c5788a987f3613e9c423571bfe8ff4850245acf3..62a89562d07634bb408920fea8f7904b5ac40561
```

This is a verifying round. It reviews the fix diff `c5788a98..62a89562`, which holds three commits. `02fd6425` is the round 3 record. `bf1b6bf6` rewrites one line of `changelog.md` and one line of `frame/design.md`. `62a89562` adds the fix pass's close block to `round-3.md`. The round read the three commits' names and messages from the branch's reflog, and it read the worktree's head ref, which stands at `62a89562`. It ran no `git show`. So the split of the paths among the commits rests on the commit messages and on the prompt's combined diff, which touches only those three paths. `chain_check.py`'s records arm reads that split exactly. At `62a89562` the round read these files whole: `routing.md`, `frame/design.md`, `gaps.md`, `changelog.md`, `trail/rounds/round-1.md`, `trail/rounds/round-2.md` and `trail/rounds/round-3.md`. It opened `pr.md`, `frame/plan.md`, `frame/questions.md`, `trail/phases/` and `seal/parity.json`, and none of them stands. The prompt names no `decisions.md`. `seal/config.json` has no `Pact` key. `Record language` and `Commit and pull request language` are both English, so no `pr.<lang>.md` is owed.

Some facts are carried from rounds 1 to 3 and were not re-established. They are round 1's *Scope* confirmations: `spawnPane`'s cut, `gateEnvironment`'s cut and its two callers, and `PANE_VARIABLES` beside the code that sets the four variables. Also carried are the two new cases read against their groups, the `## Rule changes` `from:` sentences at `docs/architecture.md:160` and `docs/architecture.ko.md:160`, what the owner's comment on issue #225 records, and the state of the tree at `d4a63f35`, which round 3 read. This round reopened the coordinates that the fixed sentences rest on: `apps/desktop/src/daemon/daemon.ts:1763`, `:1841`, `:2370-2406` and `:2474-2480`, `apps/desktop/src/daemon/hooks.ts:156-214`, `apps/desktop/src/daemon/pty.ts:18-72` and `:89`, `apps/desktop/src/daemon/adapters/claude.ts:116-125` and `:613`, `apps/desktop/src/daemon/adapters/claude-accounts.ts:155-158`, `apps/desktop/src/main/daemon-client.ts:53`, `apps/desktop/src/daemon/gate.ts:47-60`, `apps/desktop/src/daemon/daemon.ts:285` and `apps/desktop/test/daemon.test.ts:7589-7609`.

## Findings

This round opens no finding.

## Confirmations

```seal
confirms: round-3#1
```
What holds: `changelog.md:5` and `frame/design.md:10` now read word for word as round 3's paste-ready texts. Both sentences hold at the target. The daemon gets `OWLERY_RUN_DIR` from the app that starts it (`apps/desktop/src/main/daemon-client.ts:53`). A shell and a Claude Code pane start through `startSession` with `signsIn` null, so `spawnPane` gives them `withoutPaneVariables(process.env)` with the command's own variables over it (`daemon.ts:2382`, `:2405`). `withoutPaneVariables` deletes only the four names of `PANE_VARIABLES` (`hooks.ts:165-172`). `terminalEnv` drops no `OWLERY_` name (`pty.ts:18-45`, `:62-72`, called at `:89`). So the run folder reaches both. A worktree setup pane starts through the same path with `signsIn` null (`daemon.ts:2480`), and its command sets only its id (`hooks.ts:213`), so it keeps the run folder too. The restart of a pane under another account calls `spawnPane` with `inherit` left at its default of true (`daemon.ts:1841`), so it gives the same shell or Claude Code pane the same environment. A sign-in pane starts with `inherit` false (`daemon.ts:1763`, `:2382`). It runs in `claudeEnv` alone (`claude-accounts.ts:157`, wired at `claude.ts:613`), and `claudeEnv` names no `OWLERY_` variable (`claude.ts:116-125`). So "each pane other than a sign-in pane inherits it" and "still reaches a shell, a Claude Code pane and a worktree setup pane" both hold (read).

What matched: the fix pass's claim that no other sentence of the class leaves the sign-in pane out wrongly. The round built its own list by taking apart into sentences the three records that state the present: `changelog.md`, `frame/design.md` and `gaps.md`. It added the comments of the two cuts and the new daemon case's title. It kept each sentence that names a set of panes, or what a pane or the gate receives from the daemon. That gives `changelog.md:3`, `:5` and `:6`, and `frame/design.md:7`, `:8`, `:9`, `:10`, `:15`, `:16`, `:19`, `:25`, `:27`, `:35` and `:40`. It also gives `gaps.md:5`, `hooks.ts:156-164`, `daemon.ts:285`, `daemon.ts:2402-2404`, `gate.ts:47-53` and `daemon.test.ts:7589`. Each one holds at the target. `:9` is a statement of `d4a63f35`, the commit *Grounding* is dated to, and round 3 read that commit. `:15`, `:16`, `:35`, `:40`, `gaps.md:5` and the comments say what a pane or the gate does not take, and a sign-in pane takes none of it. `:25` and the case title at `daemon.test.ts:7589` name only a Claude Code pane on the chain and a shell, and "each keeps the daemon's run folder" holds for both (`daemon.test.ts:7605`, `:7608`). The close's answer also says that the session told the owner the rounds were not converging and the owner chose to go on. That statement is about a conversation and not about the tree, and no judgment of this round rests on it (read).

What matched: the fix pass's own record edit. The combined diff adds `round-3.md` with its close block, `verdict: fixed bf1b6bf6`. By its message, `bf1b6bf6` is the commit that changes the two paths the finding located (read).

What matched: the label in `gaps.md:11`, which the fix diff did not change. The whole suite is still labelled unverified, and the broad gate is named as its answerer. The fix diff adds no test and no code unit, so no new case had to be read against its group (read).

This round leaves no finding open. Next come the orchestrator's broad run at `62a89562` and then the sealer's spawn.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the lint and the typecheck at `62a89562`. This round ran nothing | the repository's `Broad gate` | the orchestrator, through the broad gate the chain command runs from the pane |
| *Grounding* line 11's second run: the group passing 17 at `5cb81763` with the four variables unset and `OWLERY_RUN_DIR` kept. Only a run settles it | `frame/design.md:11` | the session that ran it. The broad gate runs the same condition at the target, not at `5cb81763` |
| Scenario 3: the group passing in a pane that holds the four variables. The session claims 443 cases passed there (`gaps.md:11`) | `frame/design.md:27` | the session that ran it, or the owner |
| A daemon started by `pnpm start` in an Owlery pane, with a real Claude Code pane in it | `gaps.md:12` | the owner, where they start the app from a pane |

## Probes

| Command | Result |
|---|---|
