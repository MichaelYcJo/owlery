# Implementation Plan: a Claude Code pane carries Owlery's chain (#181)

## Technical context

The tree as read at `38a1dd0`.

- `apps/desktop/src/daemon/hooks.ts#claudePaneCommand` and `#paneCommands` build every pane's command and environment. `apps/desktop/src/daemon/main.ts` wires them into the daemon and already holds the bundle's built folder, which it gives the role adapter.
- `apps/desktop/src/daemon/chain.ts` is the order and the prompts, with no session and no commit in it. `apps/desktop/src/daemon/daemon.ts#runRound`, `#runFixPass`, `#runGate` and `#runSeal` hold both halves of a stage: running a headless session, and turning its answer into a committed record. The second half is what a pane's chain shares, and today it cannot be called without a `Daemon`.
- `apps/desktop/src/daemon/adapters/claude-roles.ts#rulesText` composes one role's rules file from the bundle's documents, for the daemon to append to a role session's system prompt.
- The cases start a chain with the client message `getSeal`. `apps/desktop/test/chain-run.ts` builds a `Daemon` in the case's own process, so a case holds the object and can call a method of it.
- `apps/desktop/src/daemon/records-place.ts` holds the two workflow paths and the test that tells AgenticSeal's `hygiene.yml` by the script it runs. `apps/desktop/src/daemon/repositories.ts` stores what a person sets on a repository.
- The broad gate of `seal/config.json` asks every `docs/*.md` for a `.ko.md` with the same count of headings and of table rows, and refuses the Korean word it names anywhere under `docs`.

The constraint that shapes the work is that no agent starts a real `claude`. Every case reads what a stand-in CLI was given. What only a real CLI shows is `frame/questions.md` Q1 and Q2, and the hand check of `frame/design.md` scenario 16 answers both.

The failure scenario of the chosen approach: the chain command is a second program that commits in a worktree, built from the daemon's modules. In six months a change to the daemon's stage code that is made beside the shared module, and not in it, gives a pane's records a rule the daemon's chain does not hold. `frame/design.md` scenario 7 holds the two together where they matter, since the daemon's reader of a seal and the pull request check both read the records the command wrote.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| The order and the records stay code: a chain command built from the daemon's modules, which a pane's session calls for the step owed and hands each role's answer to | The command and the daemon's stage code drift where a change misses the shared module. The session must pass a subagent's id and model, which no code checks | Chosen. It keeps three ratified rules in a pane: the order is code, a judging role writes no record, and a gate is an exit code Owlery's code read. The records are written by the writers the window and the check are already held to one answer on |
| Documents alone: the bundle gains orchestration documents, and the session writes each record, runs the gate and types the verdict's four lines, as the issue's words "a seal written by the pane's session" read | A session types `run:` and `judged-by:` lines by hand, and a gate "passed" on the session's word. The order then stands twice, in `stepOwed` and in prose, and the two part at the first change of what follows a broken seal. A malformed record shows only as a broken seal in the window or a failed check after the push | Rejected. It reverses three rules the owner's decision does not name (`docs/architecture.md` *Code runs the order, the orchestrator judges* and *Records are committed to the repository*), and `docs/product.md` *The seal* says records no run of Owlery wrote can get two answers |
| The session asks the daemon to run its chain, over the daemon's socket: the button as a command | The daemon refuses while a session of the work item works, which the asking session does. The stages run as headless sessions beside the pane, which is option 2 of the issue's third comment | Rejected: the owner chose the pane's own session over the daemon taking a driven branch over |
| Remove the daemon's chain with the button, and build it again in release 0.0.5 | `chain.ts`, its cases and the stage code go, and issue #55 rebuilds from git history what milestone 2 reviewed | Rejected. The premise that keeps the structure: the owner's decision says the daemon's chain stays for #55, issue #55 is open in `release: 0.0.5` (executed: `gh issue view 55`), and under the chosen approach the order and the record writers have a caller in this release, the chain command |
| Keep the client message `getSeal` and remove only the button | Any client can still press. The issue's *Done when* says the path is gone from the daemon | Rejected |
| Keep the record-writing code inside `Daemon`, and let the chain command hold its own copy | Two copies of each check before a record is written | Rejected for the move of `frame/design.md` scope item 5. The premise that would keep the structure, that only the daemon writes a record, no longer holds |
| State the documents' changes in `## Rule changes` for the settle, as the work items of release 0.0.2 did | `docs/` names a button the code no longer has until the release settles, through the walk of #184 and while #146, #182 and #176 are framed against those documents. The issue's *Done when* asks that no document names the button | Rejected: the work item's subject is judged to be the policy root's text (`frame/design.md` *Scope*) |
| Read the repository's chain from the main checkout, or keep it as a setting | A branch that changes the check, as #146's does, would be read by the old check's chain. A stored value falls out of step with the tree | Rejected: the pane's own folder is read at each launch |
| Ask the person at every pane where both chains would run | A question at each launch | Rejected by the issue's default: once for the repository, kept, changed in its settings |
| Where the plugin is enabled and the answer is "Owlery's chain", leave the plugin on and tell the session to ignore it | Two chains' rules in one session, and two sets of records in two forms | Rejected: the pane's settings file sets the plugin's key to `false`. `frame/questions.md` Q1 holds what only a real CLI shows |
| Refuse a branch that left its base, and nothing more | The walk's case is not caught: #176's branch moved from `origin/main` onto `release/v0.0.2`, which descends from the commit it was cut at, so the refusal would not fire and a round would read the whole release | Rejected as the only answer. Scope item 13 adds the base that follows the records and the `--base` a session names |
| A `Base` row in `routing.md` | A new line of a form the check reads | Rejected: round 1's `target:` line already holds the base in the records |
| A hook of the bundle that prints the head at `SessionStart` | The bundle's cases pin that it holds no hook, and a role session would need the hook kept out | Rejected for `--append-system-prompt-file`, which the daemon already uses for a role session |

## Phases

Each phase ends with its cases passing through the narrow run of the files it names. The broad gate is the orchestrator's.

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | The button's path goes and the daemon's chain keeps a start: `frame/design.md` *Scope* items 11, 12 and 14, the code and the cases of *Removes* rows 1, 2, 3 and 6, the refusal of `chain_check.py` that scope item 18 names, and the screenshots' scenes without a press | Scenarios 10 and 13, and scenario 9 but for its search. At the phase's commit that search, with `':!docs'` and `':!apps/desktop/role-bundle'` added to its pathspec, prints nothing: at `38a1dd0` it prints lines of the files *Removes* row 6 names under `apps/desktop/src/`, `apps/desktop/test/` and `pr-check/` alone, and phases 3 and 6 rewrite the two folders left out | |
| 2 | The record acts as one module, the chain command over it, and the base that follows the records: *Scope* items 4, 5, 6 where it concerns the command, 7 and 13, and *Removes* row 5 | Scenarios 7, 8, 11 and 12, and scenario 10 again after the move | |
| 3 | The bundle for both launches: *Scope* item 8, and the bundle's lines of *Removes* row 6 | Scenario 14 | |
| 4 | The pane carries the chain: *Scope* items 1, 2, 3 and the session's part of 6, the launcher, and the hand check `pane:run` | Scenarios 1, 2 and 3. Scenario 16 is `unverified`, and its answerer is the person who runs `pane:run` | |
| 5 | The plugin's detection and the choice: *Scope* items 9 and 10 | Scenarios 4, 5 and 6, and scenario 3 under each answer | |
| 6 | The documents: *Scope* items 15 to 18, *Removes* row 4 and the documents' lines of row 6 | Scenario 15, and scenario 9's search whole | |

## Overlap with the release

The spawn names five other items. #183 changes the marks of one theme and `docs/design.md` *Themes*, and meets this work nowhere.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #160, accounts (frame at `seal/threads/1795400734-accounts-per-repository/frame/` on its branch, not built) | `apps/desktop/src/daemon/hooks.ts#claudePaneCommand` and `#paneCommands`: #160 puts `CLAUDE_CONFIG_DIR` into the command, and this work adds the bundle's options. `repositories.ts` and `setRepository`: each adds a field. #160's account also names the config folder this work's scope item 9 reads | #181 | #160 is the larger build and was framed against `release/v0.0.2`, so it merges the release branch before its build either way. It then reads the plugin's settings from the account's folder, a change inside rounds it spends anyway. #176 and #184 wait on #181 and not on #160 |
| #146, this repository's own check (not started) | The rule: #146 installs `owlery-seal.yml` here, which scope item 1 reads as "on Owlery's chain". The file `pr-check/skills/code-review/scripts/chain_check.py`: this work rewrites one refusal, and #146 changes what the check reads. `docs/architecture.md` *Compatibility with AgenticSeal* is #146's alone | #181 | The switch has two halves. This work builds the pane that reads the installed check and changes no workflow. #146 changes the workflow and says where the compatibility ends. In that order a pane of this repository carries the bundle from the commit that installs `owlery-seal.yml`, and both pull requests are sealed by the AgenticSeal plugin under `hygiene.yml`, as the owner decided. #146 reads the documents this work rewrites |
| #182, an interrupted turn (not started) | `daemon.ts`: the sentence of `whyNoChain` on a working session, which this work rewords and #182 names in its title. #182's line on "Get a seal" has no button to refuse once this lands | #181 | #182 is the smaller diff, yet its *Done when* reads against this work's result: what waits on a session's state is then a role's start alone |
| #176, a broken seal's sentence (not started) | `apps/desktop/src/renderer/work-item-view.ts` and `view.ts`, the view's foot, where the button stands today | #181, then #146 | #176 is built in a pane that carries the chain, which is this work, in a repository on Owlery's chain, which is #146 |

## Operational impact

- **No migration.** `repositories.json` gains an optional field, read as absent in a file an earlier build wrote.
- **A daemon of an earlier build** answers no `chain` on a repository and still takes `getSeal`. The window of this build sends no `getSeal` and asks no choice of it. `docs/architecture.md` *What a session survives* states how a newer window meets an older daemon.
- **New environment variables of a pane**: `OWLERY_CHAIN` and `OWLERY_BASE`, in a Claude Code pane that carries the chain.
- **New files in the run folder**: the pane's head, the launcher, the second settings file, and the prompts and rules files the chain command writes.
- **A new build output**, `dist/chain.js`, and a new script, `pane:run`.
- **No new dependency.**
- **This pull request does not move the version.** The orchestrator gave the move to another work item.
- **Issues to rewrite, the orchestrator's act.** `gh issue list --state open --search '"Get a seal" OR "Get a new seal" in:title,body'` printed #54, #63, #64, #66, #67, #68, #72, #147, #176, #180, #182 and #184 beside this one (executed 2026-11-24). #55 names no button and stands on the daemon's chain, which stays. #66 asks for the button by name and is the one whose *Done when* the decision rewrites whole.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
