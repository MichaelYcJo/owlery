# Guarantee: 1795591289-225-the-broad-gate-hands-a-panes-owlery

The sealer audited HEAD `671328f6` against the base `release/v0.0.4`, which resolves through `release/v0.0.4@{upstream}` to `f860c935`. The broad gate's record names `2bbe8d54`. Two commits follow it, and each touches one path under this work item's directory: `b3b79df1` adds `pr.md` and `671328f6` adds `trail/gate.md` (executed: `git log --no-merges --name-only 2bbe8d54..HEAD ^f860c935`). `seal pr-body --check` exited 0 on the body file (executed). `chain_check.py --baseline f860c935 --sealing` exited 0, and it printed only the arms that `--sealing` lets pass (executed).

`routing.md` reads `Implementation: the session`, so no phase record is owed, and none stands. No `frame/plan.md`, `frame/questions.md`, `pr.<lang>.md` or `seal/parity.json` stands. The two language keys both read English.

The sealer ran every case below in a clone of HEAD at `<scratchpad>/1795591289-225-the-broad-gate-hands-a-panes-owlery/at-base/`. Its `node_modules` link to the worktree's. Each run set `OWLERY_BACKGROUND=1`, and no run started the app. Each run went through `pnpm test --project unit`, which runs vitest in Electron's Node with `ELECTRON_RUN_AS_NODE=1`.

## Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The gate's environment holds none of the pane variables and keeps `OWLERY_RUN_DIR` and `OWLERY_BACKGROUND` (scenario 2) | `frame/design.md:27`, `apps/desktop/test/gate.test.ts:136-154` | at HEAD in the worktree: `pnpm test --project unit test/gate.test.ts -t "a broad gate's environment"` | holds: 5 passed (executed) |
| Both gate cases were red before the fix | `apps/desktop/test/gate.test.ts:136`, `:141` | in the clone, with `daemon.ts`, `gate.ts` and `hooks.ts` restored from `f860c935`: the same command | holds: both failed, at the deep-equal of `:138` and at `:151`, which returned `[ 'OWLERY_PANE_ID', …(2) ]` (executed) |
| Both gate cases are held by the gate's cut. They assert that something is not let through, so the case is shown red with that one guard removed (rule 15) | `apps/desktop/src/daemon/gate.ts:55` | in the clone at HEAD's code, with `withoutPaneVariables` alone taken out of `gateEnvironment`: the same command | holds: both failed, at `gate.test.ts:138:41` and `:151:69` (executed) |
| A daemon whose own environment holds a pane's five variables gives a pane on the chain only its own, and a shell no chain, no base and no runner, and both keep the run folder (scenario 1) | `frame/design.md:26`, `apps/desktop/test/daemon.test.ts:7688-7708` | at HEAD in the worktree: `pnpm test --project unit test/daemon.test.ts -t "a Claude Code pane and the owl chain"` | holds: 18 passed (executed) |
| The new daemon case was red before the fix, and it is held by `spawnPane`'s cut | `apps/desktop/src/daemon/daemon.ts:2458` | in the clone: base code restored, then HEAD's code with `withoutPaneVariables` alone taken out of `spawnPane`, `-t "gives a pane none of the pane variables of a daemon started in an Owlery pane"` | holds: both runs failed at `daemon.test.ts:7704:43`, which received `"/outer/owl-run"` where the case expects `undefined` (executed) |
| Round 5's fix pass says both new cases were seen red without the runner on the list | `trail/rounds/round-5.md`, finding 1's answer | in the clone at HEAD's code, with `withoutPaneVariables` changed to skip `OWLERY_RUN` alone: both cases | holds: the gate case failed at `gate.test.ts:151:69`, which received `["OWLERY_RUN"]`, and the daemon case failed at `daemon.test.ts:7704:43` on the runner's slot (executed) |
| The group "a Claude Code pane and the owl chain" passes when the suite runs in an environment that holds a pane's chain variables (scenario 3, the issue's fourth *Done when*) | `frame/design.md:28`, issue #225 body | at HEAD in the worktree: the group's command, under `OWLERY_CHAIN`, `OWLERY_BASE`, `OWLERY_PANE_ID`, `OWLERY_HOOK_SOCKET`, `OWLERY_RUN` and `OWLERY_RUN_DIR` set to outer values | holds: 18 passed. The environment was set in the sealer's shell. The sealer did not run in a real Owlery pane (executed) |
| The defect the issue reports: the group fails 6 cases under a pane's variables | issue #225, the owner's comment | in the clone with base code: the group's command under the four variables and `OWLERY_RUN_DIR` | holds: 7 failed and 11 passed. The 7 are the issue's six and the new case (executed) |
| Only `hooks.ts#PANE_VARIABLES` sets the five names, and `paneCommands`, `setupPaneCommand` and both cuts read them from it | `frame/design.md:18` | `git grep -n -E 'OWLERY_(PANE_ID\|HOOK_SOCKET\|RUN\|CHAIN\|BASE)([^_A-Z]\|$)' -- apps/desktop/src` | holds: the one literal assignment is `hooks.ts:172`. Every other hit reads a name or is a comment (executed) |
| The merge `8b9d127b` resolved no conflict and carried this work's changes unchanged | `trail/rounds/round-7.md` | `git show --cc 8b9d127b`, and a diff of `git diff d5a123a6 bcde17f1` against `git diff f860c935 8b9d127b` | holds: no hunk, and the two diffs are identical (executed) |
| Both `## Rule changes` `from:` sentences stand word for word in the policy documents | `frame/design.md:35`, `:40` | `git grep -n -F` of each text | holds: `docs/architecture.md:160` and `docs/architecture.ko.md:160` (executed) |
| `3016a2e2` applies round 6's paste-ready title and comment and changes nothing else | `trail/rounds/round-6.md`, finding 1's answer | `git show 3016a2e2` | holds: two lines of `apps/desktop/test/gate.test.ts` change, and they match the round's snippet word for word (executed) |
| Every `fixed` commit and every round's target is an ancestor of HEAD | rounds 1 to 7 | `git merge-base --is-ancestor` on `da555e9d 0d0b3e72 17a73729 ca92695b bf1b6bf6 fd0af506 7d3f9d5a 3016a2e2` and on each round's target | holds: every one is an ancestor (executed) |
| `## Removes` reads `nothing`, and the changelog names no removal | `frame/design.md:44-45`, `changelog.md` | `git diff f860c935...HEAD -- apps/` | holds: the diff adds a constant, a function, two cases and three changed lines, and removes no file, case or unit (read) |
| Round 6's *Not judged* row on four comments from #134 was filed as #237 in release 0.0.5 | `pr.md`, last paragraph. The orchestrator's spawn prompt also names it | `gh issue view 237`, and `git blame` at `f860c935` of `pane-chain.ts:28`, `main.ts:39` and `main.ts:49` | holds: #237 is open in milestone "release: 0.0.5" and names those coordinates. The three lines date from `d5a123a6`, so they come from the base (executed) |
| The orchestrator took over after round 6, merged the release at `8b9d127b`, spawned a crafter for round-6#1 and spawned round 7's proofer | the orchestrator's spawn prompt | `git log --format='%h %ad %s'` and the commits' trailers | partly holds. `8b9d127b` merges `f860c935`, and its parents are `bcde17f1` and `f860c935`. The three hours between `bcde17f1` (17:14) and `8b9d127b` (20:16) fit a takeover, and so does the different model in `3016a2e2`'s trailer. Who spawned which agent is not in the tree (unverified; the orchestrator answers) |
| The broad gate passed at `2bbe8d54` | `trail/gate.md` | none. The gate is the orchestrator's, and rule 2 keeps it from the sealer | the record names `2bbe8d54 against f860c935`, and the sealer read that only records follow it (read) |

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | A pane holds the five pane variables only where its own command sets them. The broad gate's command holds none of the pane's. One constant names the five, and both cuts read it. `OWLERY_RUN_DIR`, `OWLERY_BACKGROUND` and `CLAUDE_CONFIG_DIR` stay. A sign-in pane is unchanged | the issue's *Done when*, which leaves the cut to the frame and names `OWLERY_RUN` only as a possible keep. The frame records cutting it on the owner's word. It agrees with the diff and every case above | none |
| the build | `hooks.ts#PANE_VARIABLES` and `withoutPaneVariables`, applied in `spawnPane` and in `gateEnvironment`, with one case in `daemon.test.ts` and two in `gate.test.ts` | the design's three scope items and *Out*. The sign-in path (`inherit` false) is untouched. Each case is red without the guard it names | none |
| the last round | Round 7 opens no finding and confirms round-6#1. It hands on to the broad run and the sealer | `3016a2e2` as re-read above, and the merge check re-run above | none |
| the changelog | Each pane takes only the id, socket and runner its own command sets. A shell and a Claude Code pane on no chain take no chain or base. The broad gate holds none of the pane's five variables and keeps `OWLERY_RUN_DIR`. The gate failed six cases from a pane | the design, the build, and the six failures re-run at base | none |
| the orchestrator's part of the pull request body | `Closes #225`, four quotes of `frame/design.md` *Scope* and *Out*, and a paragraph saying round 6's *Not judged* row went to #237 in 0.0.5 | The four quotes match `frame/design.md` word for word. Every fact in the last paragraph holds against #237 and the tree | The last paragraph is the orchestrator's own account. `docs/forms/the-guarantee.md` says `pr.md` holds no sentence of that kind. The issue body and the tree contradict nothing in it, so this is no `withheld` reason. It is named here for the orchestrator. No round read `pr.md`, since it came after round 7, so the sealer was its only reader |

## Not verified

| Item | Who answers |
|---|---|
| A daemon started by `pnpm start` in a real Owlery pane, with a real Claude Code pane in it (`gaps.md` *Not verified*, row 2) | the owner, where they start the app from a pane |
| The `gaps.md` claim that the pane of `balmy-bison` holds no `OWLERY_RUN`, and *Grounding*'s run at `5cb81763` | the session that ran them in that pane |

```seal
target: 671328f636bf8a6dff679a1fb676db43ae31210a against f860c935aaf763e44ded3ebc2833e7eb2298518e
Verdict: sealed
```
