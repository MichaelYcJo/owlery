# Review round 1: 1795764399-321-the-held-session-is-held-again

```seal
target: b397a2ca against origin/release/v0.1.0
```

This round reviewed the branch against its base `d323b45a`. The code under review is one changed case of `apps/desktop/test/daemon.test.ts`; `apps/desktop/src` is unchanged. It read `routing.md`, `changelog.md`, `gaps.md`, `pr.md` and `trail/phases/phase-1.md` whole at the target. The work item stands on the ladder's second rung, so it holds no `frame/design.md`, `frame/plan.md` or `frame/questions.md`, and `gaps.md` *Scope confirmation* stands for the plan. No `pr.<lang>.md` is owed, since `Commit and pull request language` is English. No `seal/parity.json` is declared. No earlier round record stands, so no fact was carried and every fact below was established this round.

## Findings

None.

## Confirmations

What matched: the cause the routing and phase 1 state. Claimed: since #127 the daemon gives a proofer's adapter its prompt with the scratch folder's paragraph after it, and the old case held its session only where the prompt equalled "Held" whole. `Daemon#startHeadless` at `apps/desktop/src/daemon/daemon.ts:2578` gives the adapter `withScratch(session.prompt, scratch)` wherever `commandsOf` made a scratch folder. `commandsOf` at `apps/desktop/src/daemon/daemon.ts:2487-2490` makes one for every role whose grant is `commands: "scratch"`, which `apps/desktop/src/daemon/role-grants.ts:42-45` gives to the proofer and the sealer. `withScratch` at `apps/desktop/src/daemon/daemon.ts:195` returns the prompt with a paragraph after it, so the old `prompt === "Held"` was false for the case's proofer session. Read.

What matched: the issue's *Done when*, first item, which asks which agent the count misses and why #127's gate passed. Phase 1 names the headless session, not the Claude pane, and the race. The race is read in the code: the old fake let the session finish once its start ran (`apps/desktop/src/daemon/adapters/fake.ts`, `session()` awaits `options.work` and then reports the result). The case read `stopCounts` once the `working` message had arrived. That message is sent when the session is listed, before its start. `until` at `apps/desktop/test/daemon.test.ts:96-104` looks once and then sleeps 20 ms between looks. `stopCounts` at `apps/desktop/src/daemon/daemon.ts:3032-3036` counts every headless session whose state is `working`. So the old case read 2 only where the git command, the scratch folder and the fake's timer turns took longer than that poll. Phase 1's claim that #127's gate tree equals the base's in `apps/desktop/src` and `apps/desktop/test` holds: `git diff --stat bdd666c0 d323b45a -- apps/desktop/src apps/desktop/test` printed nothing. Phase 1 calls its account of the gate's load a reading and not a measurement, and the record keeps that label. Executed and read.

What matched: the issue's *Done when*, second item, a fix of the cause and not a longer wait. The diff at `apps/desktop/test/daemon.test.ts:7314-7317` changes only the comparison of the fake's `work`, and adds no wait and no timeout. The new comparison holds deterministically. `adapter.starts.at(-1)` is the Held session's own start when its `work` runs. The fake pushes each start at `start()`, before `session()` reaches `options.work`, and the case starts Held only after it has seen Quick's `finished` message (`apps/desktop/test/daemon.test.ts:7335-7338`), so no other start falls between. The test's `withScratch` at `apps/desktop/test/daemon.test.ts:288-289` builds the same paragraph as the daemon's at `apps/desktop/src/daemon/daemon.ts:195-197`, so the comparison is true for Held and false for Quick. Held's `work` then never settles, and the session stays `working` whatever the timing. Read, and executed: the changed case passed through the lock (see `## Probes`).

What matched: phase 1's census of the prompt comparisons. Both of its commands, run again at `76f33b84`, printed what phase 1 says: four lines from the first (`chain.test.ts:1139`, `chain.test.ts:1155`, `daemon.test.ts:6732`, `daemon.test.ts:7316`), and counts in the six files it names from the second. Phase 1 calls the census a sample, and it is one. Executed.

What matched: the request to find any other case in `apps/desktop/test` that #127's paragraph made pass or fail by timing alone. This round built its own list from what produces the defect. The daemon hands the prompt to a test only through a role adapter's `start`, so the list holds two kinds of code. The first is every callback of the fake adapter's options that is given the prompt (`pieces`, `asks`, `work`, `usage`, `limits`, `session`, per `FakeAdapterOptions` in `apps/desktop/src/daemon/adapters/fake.ts`). The second is every `start` a test writes for a role adapter. Searches:

- `git grep -n -E "(pieces|asks|work|limits)\??:" -- apps/desktop/test`
- `git grep -n -E "\((cwd, )?prompt[,)]|, prompt[,)]|given\.prompt|prompt (===|!==)|startedWith\(" -- apps/desktop/test`
- `git grep -n -E "start: *(async *)?\(|^\s+(async )?start\(" -- apps/desktop/test`

Every hit was read. Each `start` a test writes either passes the prompt through untouched, or picks by `startedWith(options)`, which takes the paragraph off (`apps/desktop/test/daemon.test.ts:291`; callers at 1851, 2689, 6477, 6525, 6582, 6639, 6666, 6826, 6828 and 8199). It may also pick by role or by `cwd`. Each option callback that reads the prompt does it in one of three ways. It branches on the role (`chain-run.ts:641-647`, `chain.test.ts:2201-2208`). It parses the prompt with line-anchored patterns that no line of the paragraph matches (`givenRound`, `givenFix`, `givenSeal` and `givenQuestions` in `apps/desktop/test/chain-run.ts:369-386` and `chain-run.ts:622-624`). Or it compares a prefix that the paragraph leaves in place (`daemon.test.ts:6732`). The crafter's and orchestrator's prompts get no paragraph, because their grants are `worktree` and `nowhere`. No shell stand-in in `apps/desktop/test` branches on a prompt. A `git grep` for `case "$` and `[ "$` comparisons found only branches on git and gh arguments. No other case compares a prompt the paragraph changes, so this round found no other case whose result #127's paragraph left to timing. This list is a sample under contract rule 12. It is built from the producers, but it was found by spellings. It does not reach a callback defined under another parameter name and passed through a variable, beyond those read above.

What matched: the records against the code and against each other. The pull request body's quote in `pr.md` is the sentence of `gaps.md` *Scope confirmation*, word for word. `changelog.md`'s note for a contributor names `withScratch` and `startedWith` in `daemon.test.ts` and `withScratch` in `daemon.ts`; all three stand at the target. Its statement that a proofer's and a sealer's session are given the paragraph matches `apps/desktop/src/daemon/role-grants.ts:42-45`. Its statement that Owlery's behaviour is unchanged matches the diff, which leaves `apps/desktop/src` untouched. The `gaps.md` *Not verified* rows label the hosted runner and the broad gate as unverified and name the orchestrator as their answerer, as contract rule 2 asks. Read.

What matched: the phase's other claims. Its red run used a probe copy with a 300 ms wait instead of the case as it stood, because the race decided the old case. Phase 1 says so, and that is how contract rule 15 is met for a case that a race decides. Its mutation of `+ headless.length }` in `Daemon#stopCounts` names a line that stands at `apps/desktop/src/daemon/daemon.ts:3035`. This round did not re-run the red run or the mutation. They are claims that were read and not executed.

A note that holds no finding: the fake's `work` finds the Held session's scratch folder through `adapter.starts.at(-1)`, which is correct only while the case starts its sessions one after another, as it does now. A comparison such as `prompt.startsWith("Held\n")` would not depend on that order. The case's comment does not say it relies on the order (`apps/desktop/test/daemon.test.ts:7316`).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The changed case passes on the hosted runner at its first `check` attempt | `gaps.md` *Not verified*, row 1 | the orchestrator, from the pull request's `check` job |
| The broad gate: the full suite, the typecheck and the docs checks. This round ran the changed case alone, and the suite stays `unverified` | `gaps.md` *Not verified*, row 2 | the orchestrator, at this work item's broad gate |

This round leaves nothing open. What comes next is the orchestrator's broad run, and then the sealer's spawn.

## Probes

| Command | Result |
|---|---|
| `cd apps/desktop && sh <scratchpad>/heavy.sh node scripts/test-in-electron.mjs test/daemon.test.ts -t "counts the panes that are alive"` at `b397a2ca` | exit 0: `daemon.test.ts`, 1 passed and 445 skipped |
| `git diff --stat bdd666c0 d323b45a -- apps/desktop/src apps/desktop/test` | printed nothing |
| phase 1's two census commands, at `76f33b84` | four lines (`chain.test.ts:1139`, `chain.test.ts:1155`, `daemon.test.ts:6732`, `daemon.test.ts:7316`), and counts in `accounts.test.ts` 5, `chain-run.ts` 2, `chain.test.ts` 8, `daemon.test.ts` 12, `fake-adapter.test.ts` 14, `pr-check.test.ts` 1 |
