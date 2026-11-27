# Phase 1: 1795764399-321-the-held-session-is-held-again

## What this phase found

**No frame stands, and the routing's account of the cause holds at HEAD.** The work item is on the ladder's second rung, so it has no `frame/design.md` and no `frame/plan.md`, and `gaps.md` *Scope confirmation* stands for the plan. `routing.md` *Why this way* says that since #127 the daemon appends the scratch folder's paragraph to a proofer's prompt and that the case's fake adapter held the session only where the prompt equals "Held" whole. `Daemon#startHeadless` in `apps/desktop/src/daemon/daemon.ts` gives the adapter `withScratch(session.prompt, scratch)` for a proofer, and the case at `apps/desktop/test/daemon.test.ts` compared `prompt === "Held"`, so both statements stand.

**The count missed the proofer's session named Held, never the Claude pane.** A probe copy of the case, run once through the machine's lock on 2026-11-27 at `d323b45a`, stamped each step in milliseconds from the case's start:

- 433.8: `startRoleSession("Held")` returned, and the client had the `working` message at 433.9.
- 445.6: the adapter's `start` was called, after `commandsOf` ran `git rev-parse --git-common-dir` and made the scratch folder.
- 449.5: the client had the `finished` message, since the prompt the fake's `work` was given, `"Held\n\nYour scratch folder is ..."`, did not equal `"Held"`.
- 454.1: `stopCounts` read `{ panesAlive: 3, agentsWorking: 1 }`, and 300 ms later it read the same.

Five runs of `gitFolderOf` in the same process took 11.1 to 12.7 ms. `stopCounts` counted correctly: the session had finished. The fix is therefore in the case, and `apps/desktop/src/` is unchanged.

**The old case's result was decided by a race, which is why #127's broad gate passed it.** The client's `until` in `apps/desktop/test/daemon.test.ts` looks once before the socket has delivered the `working` message, then sleeps 20 ms. So the count is read about 20 ms after the session is listed. Where the git command, the scratch folder and the fake's four timer turns end within that time, the session has finished and the count is 1. Where they take longer, the session is still waiting for its start and counts as working. The gate's tree was the release head's: `git diff bdd666c0 d323b45a -- apps/desktop/src apps/desktop/test` prints nothing. On a quiet Mac the old case passed once and its probe copy failed once, so the margin is close to the poll's 20 ms. That the whole suite's load made the git command slow enough during the gate is a reading of these measurements, not a measurement under that load.

**The case now matches the prompt as the daemon gives it.** The fake's `work` holds the session where its prompt equals `withScratch("Held", adapter.starts.at(-1)?.scratch ?? "")`. That is the case's own form of the paragraph, read with the scratch folder from what the adapter was given, as the scratch case of `describe("headless sessions")` reads it. `startedWith(options)` was not used, because the fake's `work` is given the prompt and not the start's options. A comment above the adapter says why the paragraph is matched. Judged against `routing.md` *Why this way* and the request of #321's *Done when*, a fix of the cause and not a longer wait.

**Seen red, deterministically.** Because the race decided the old case, the red run did not use it as it stood. A probe copy named `test_tmp_*` ran the case twice in one command through the lock, once with the old comparison and once with the new, each waiting 300 ms after the `working` message before it read the count, so the session had finished wherever it was not held. The old comparison failed with `expected { panesAlive: 3, agentsWorking: 1 } to deeply equal { panesAlive: 3, agentsWorking: 2 }`, and the new one passed. The copy was removed afterwards. The changed case then passed through the lock, `-t "counts the panes that are alive"`, one case run.

**Mutation: the case now pins the headless half of the count.** After the commit, `seal mutate` replaced `+ headless.length }` with `+ 0 }` in `Daemon#stopCounts` and ran the case: red, on the same assertion with `agentsWorking: 1`. `seal mutate` restored the file from the bytes it held, and `git diff --quiet HEAD -- apps/desktop/src` exited 0 afterwards.

**Census of the prompt comparisons in `apps/desktop/test`, a sample.** It was built from the names of the fake adapter's options that are given the prompt (`FakeAdapterOptions` in `apps/desktop/src/daemon/adapters/fake.ts`: `pieces`, `asks`, `work`, `usage`, `limits`, `session`) and from the spellings of a comparison, by two commands at `76f33b84`, the commit of the case's change:

```
git grep -n -E 'prompt (===|!==) |prompt\.(startsWith|includes|endsWith)\(|options\.prompt' -- apps/desktop/test
git grep -c -E '(work|pieces|asks|session|usage|limits): \(' -- apps/desktop/test
```

The first printed four lines. Two in `chain.test.ts` (1139, 1155) assert with `startsWith` on a chain's started prompt, which the paragraph after it does not change. `daemon.test.ts:6732` matches `startsWith("Which owl?\n")`, as #320 wrote it. `daemon.test.ts:7316` is this phase's line. The second counted the callbacks in `accounts.test.ts`, `chain-run.ts`, `chain.test.ts`, `daemon.test.ts`, `fake-adapter.test.ts` and `pr-check.test.ts`. At that commit, each one read branched on the role or on nothing, or put the prompt into its text, and none compared the prompt whole. The adapters that picked a session by its prompt through `startedWith(options)` already read it without the paragraph. The sample does not reach a callback passed through a variable or a helper under another name, beyond `refusedCalls` in `chain.test.ts` and `roles` in `chain-run.ts`, which were read and branch on the role.
