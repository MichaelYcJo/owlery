# Review round 7: 1795591289-225-the-broad-gate-hands-a-panes-owlery

```seal
target: 68f65647cf275bd066a3819a0bba63d1479ba112, fixes 2ab88eac04c7ace1459dd8962f3dbc13f93c88e4..68f65647cf275bd066a3819a0bba63d1479ba112
```

This is a verifying round. It reviews the fix diff `2ab88eac..68f65647`, which holds four commits. `bcde17f1` adds the round 6 record. `8b9d127b` merges `origin/release/v0.0.4` at `f860c935`, which is #234, into the branch. `3016a2e2` changes the title and the comment of one case in `apps/desktop/test/gate.test.ts`. `68f65647` adds the fix pass's close block to `round-6.md`. The round read `git show --stat` of each commit, and each touches only those paths. At `68f65647` the round read these files whole: `routing.md`, `frame/design.md`, `gaps.md`, `changelog.md` and `trail/rounds/round-1.md` to `round-6.md`. No `frame/plan.md`, `frame/questions.md`, `pr.md`, `pr.<lang>.md`, `trail/phases/` or `seal/parity.json` stands. `seal/config.json` has no `Pact` key. `Record language` and `Commit and pull request language` are both English. The round's commands were read-only `git`, `grep` and `sed` calls. It ran no test.

Some facts are carried from rounds 1 to 6 and were not re-established. They are round 6's reading of the code units at `2ab88eac`: `hooks.ts#PANE_VARIABLES` and its readers, both cuts, the two callers of `gateEnvironment`, and the two cases read against their groups. They also include the state of the tree at `d4a63f35`, which round 3 read. Those units are unchanged since round 6, as the merge check below shows. The only exception is the gate case's title and comment, which this round read again. This round re-read the hooks lines the new comment rests on: `apps/desktop/src/daemon/hooks.ts:152`, `:158-172`, `:206-212` and `:221-229`, and `apps/desktop/src/daemon/gate.ts:47-60`.

The merge carried this work's own units unchanged. `git show --cc 8b9d127b` prints no hunk, so the merge resolved no conflict. `git diff bcde17f1 8b9d127b` touches only `docs/architecture.md`, `docs/architecture.ko.md`, `docs/roadmap.md` and `docs/roadmap.ko.md`. The diff from the old base to the branch before the merge, `git diff d5a123a6 bcde17f1`, is byte for byte the diff from the release side to the merge, `git diff f860c935 8b9d127b`. `d5a123a6` is the merge base. So every change of this work reaches the merge as it stood, and the release side brings nothing into this work's paths (executed).

The merge moved neither `## Rule changes` `from:` sentence. In `docs/architecture.md` and `docs/architecture.ko.md` the merge changes one line each, line 320, from release 0.0.5 to 0.0.6. A `git grep -F` of each `from:` text (`frame/design.md:35`, `:40`) finds it word for word at `docs/architecture.md:160` and `docs/architecture.ko.md:160` (executed).

## Findings

This round opens no finding.

## Confirmations

```seal
confirms: round-6#1
```
What holds: the case at `apps/desktop/test/gate.test.ts:141-154` now has round 6's paste-ready title and comment, word for word (`:141`, `:142`). The fix leaves the case's code unchanged. Each sentence of the two holds at the target. The title says the gate holds "none of the pane variables" that the four commands set. The case shows this: each pane's environment goes through `gateEnvironment`, and none of the keys the commands returned is left (`:149-152`). The runner is among those keys, because both `paneCommands` and `setupPaneCommand` are given `/run/owl-run` (`:144`, `:146`). The comment's first sentence matches `:147`, which reads the keys off what the commands return. Its second sentence holds as well. Every start sets `accountDir: null` (`:145`). A shell's command sets `CLAUDE_CONFIG_DIR` only where `accountDir` is not null (`hooks.ts:206`). A Claude Code pane's command puts it on the command line only then, and never into `env` (`hooks.ts:152`, `:206`). `setupPaneCommand` never sets it (`hooks.ts:222-223`). The frame keeps the variable out of the cut (`frame/design.md:20`), and `PANE_VARIABLES` does not name it (`hooks.ts:172`). Its third sentence says "the set is pinned below", and `:148` pins the keys as exactly the five. So a variable that a later change adds to these commands, built from these starts, fails the case at `:148`. A variable that a change adds only under a start this case does not build, such as one with an account folder, would not fail it. The comment's first sentence limits it to "these pane commands", and the second names the starts' limit, so the third sentence is read within that scope. This round does not read it as a claim about every start (read).

What matched: the hand-back's point that `changelog.md:3` is wrong. It is not wrong as written. The sentence says what "a pane under the owl chain" holds: its id, its hook socket, the runner of heavy commands, the chain command and the base. A Claude Code pane on the chain gets all five from its own command (`hooks.ts:209`). The runner is there where the daemon wrote one, and the base where the start names one. The sentence says nothing about which other panes hold the id, the socket and the runner. "Of its own" means the variables are set for that one pane, and `hooks.ts:158-163` uses the same words. The next sentences hold too. They say that a daemon started in such a pane inherited all five. They say that each shell, Claude Code pane on no chain and worktree setup pane started under it named the outer chain command. That pane had its own id, socket and runner over the outer ones, but no chain variable of its own. Line 5 says that each pane gets only the id, socket and runner its own command sets. So the changelog does not suggest that only chain panes get those three (read).

What matched: every sentence of the fix diff and of the present-state records that says what a pane's command sets or what the gate takes. The round took the three records `changelog.md`, `frame/design.md` and `gaps.md` apart into sentences, and every comment, case title and document line the fix diff adds. It kept each sentence that names what a pane's command sets or what the gate takes. That gives `changelog.md:3`, `:5` and `:6`, `frame/design.md:7`, `:11`, `:16`, `:17`, `:18`, `:20`, `:26`, `:27`, `:28`, `:36` and `:41`, `gaps.md:5`, `:11` and `:12`, and `gate.test.ts:141` and `:142`. It also gives the two lines the merge brings, `docs/roadmap.md:54` and `docs/roadmap.ko.md:54`. They say the owner's walk found that a gate run from a pane's session hands the pane's variables to the suite (#225), "fixed here", which is what this work does. `frame/design.md:7` is dated to `d4a63f35`, and `:11` to `282e3eab`. Each sentence holds at the target. The records are unchanged since `2ab88eac`, where round 6 read them. Scenario 3's "takes the four variables out" (`:28`) names the four the scenario's pane holds, and the cut takes those four out with the runner (read).

What matched: the fix pass's answer, which says it read every such sentence whole. The answer names where it read: the three records, the `PANE_VARIABLES` comment, `daemon.test.ts:7688-7708` and `gate.test.ts:136-154`. It does not claim those are every place in the tree. Three comments of this work outside that list say what the gate or a pane takes: `daemon.ts:313`, `daemon.ts:2455` and `gate.ts:47-53`. Each names the variables by `hooks.ts#PANE_VARIABLES` and holds. The answer's coordinates `hooks.ts:152` and `:206` are the lines that set `CLAUDE_CONFIG_DIR` (read).

What matched: the label in `gaps.md:11`, which the fix diff does not change. The whole suite is still labelled unverified, with the broad gate as its answerer. The row's run was at `7d3f9d5a`. Since then the fix diff has changed one case's title and comment and four documents, and none of these changes what a case runs. The fix diff adds no case, so no new case had to be read against its group (read).

This round leaves no finding open. Next come the orchestrator's broad run at `68f65647` and then the sealer's spawn.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the lint and the typecheck at `68f65647`. This round ran nothing | the repository's `Broad gate` | the orchestrator, through the broad gate the chain command runs from the pane |
| *Grounding* line 12's second run: the group passing 17 at `5cb81763` with the four variables unset and `OWLERY_RUN_DIR` kept. Only a run settles it | `frame/design.md:12` | the session that ran it. The broad gate runs the same condition at the target, not at `5cb81763` |
| Scenario 3: the group passing in a pane that holds the four variables. The session claims 459 cases passed there at `7d3f9d5a` (`gaps.md:11`) | `frame/design.md:28` | the session that ran it, or the owner |
| The claim that the pane of `balmy-bison` holds no `OWLERY_RUN` because the app that started it writes no runner. Only a read of that pane's environment settles it | `gaps.md:11` | the session that ran the cases in that pane |
| A daemon started by `pnpm start` in an Owlery pane, with a real Claude Code pane in it | `gaps.md:12` | the owner, where they start the app from a pane |
| #226's comments say every pane names the runner in `OWLERY_RUN`, and a sign-in pane does not. These lines come from the base, not from this pull request's diff | `apps/desktop/src/daemon/hooks.ts:198-199`, `apps/desktop/src/daemon/pane-chain.ts:28`, `apps/desktop/src/daemon/main.ts:39`, `apps/desktop/src/daemon/main.ts:49` | the orchestrator: whether to file it against #226's code |

## Probes

| Command | Result |
|---|---|
