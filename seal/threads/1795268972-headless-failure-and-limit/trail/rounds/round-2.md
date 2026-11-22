# Review round 2: 1795268972-headless-failure-and-limit

```seal
target: 9c2a892, fixes 7374426..9c2a892
```

This verifying round read the fix diff `git diff 7374426..9c2a892`. The diff holds `0bd18e0`, `8e54ecc`, `a531227` and `9668c88` of the fix pass, and `9c2a892` of the orchestrator, after `1fa3662`, which records round 1. The round answers each of round 1's four closes. It reviewed the units new in the fix diff as code: the rejection guard in `daemon.ts`, the two `destroy` calls in `claude.ts`, the three new cases and `apps/desktop/test/ask-section.test.ts`. It read the work item's records whole at `9c2a892`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/gate.md`. No `pr.<lang>.md` stands.

From round 1 this round carried coordinates only: the list of the callers of `headlessChanged`, the readline and `report` lines of `claude.ts`, and the window's three parts. Every verdict below was reached again on the code at `9c2a892`. Round 1's two probes were written again from its `## Probes` row and ran once more.

## Findings

### 1. `gaps.md` names `3bf8c6c` as the commit of the broad run, which ran at `1feb1e5`

```seal
severity: should
location: `seal/threads/1795268972-headless-failure-and-limit/gaps.md:7`
evidence: read `seal/threads/1795268972-headless-failure-and-limit/gaps.md:7`, `seal/threads/1795268972-headless-failure-and-limit/trail/gate.md:4`, `seal/threads/1795268972-headless-failure-and-limit/guarantee.md:9`
regression: round-1#3
```

Why it matters: `9668c88` closed round 1's finding 3. It also rewrote the first row of `## Not verified`, and the row now ends "and the broad run at `3bf8c6c` precedes its commits". The broad run's record says `run: 1feb1e5 against 78bb2b9` (`trail/gate.md:4`). The sealer's audit reads the same commit (`guarantee.md:9`). `3bf8c6c` is the commit that recorded that run, and no broad run took place there. The frame (round 1's finding 3 and *Scope* item 9) asked only to close the row on the window. In the same commit the fix pass rewrote this neighbouring row, and the commit is wrong there. The orchestrator is the answerer this row names, and it decides from this sentence where the broad run stood. The next broad run replaces the gate record anyway. Until then, the row sends a reader to a commit that has no run.

```markdown
| The whole suite, the typecheck over the whole app and the documents' checks of the `Broad gate` key, at the work item's last commit. Phase 1 ran only the cases of `claude-adapter.test.ts`, `fake-adapter.test.ts` and `daemon.test.ts` it names in `trail/phases/phase-1.md`, and a typecheck of the 41 files the changed modules and their importers make up. Phase 2 ran only `view.test.ts` and `themes.test.ts`, one drive of the built app, and a typecheck of 21 files (`trail/phases/phase-2.md`). The test files that start the built app load the changed renderer through the bundle, and none of them ran. Round 1's fix pass ran only `daemon.test.ts`, `claude-adapter.test.ts` and `ask-section.test.ts`, and the broad run at `1feb1e5` (`trail/gate.md`) precedes its commits | the orchestrator, at the broad gate |
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: the rejection of an adapter's start now returns where the session is no longer `working` (`daemon.ts:954-960`). Round 1's probe A, written again and run at `9c2a892`, passed. `ready` listed the quick session alone, so no session was put back into `endedHeadless`. The committed case "changes nothing at a start that fails after its session ended: …" (`daemon.test.ts:3541`) passed at `9c2a892`. With the guard alone removed in the round's clone, it went red at `daemon.test.ts:3569` on a `headless` message after the rejection, which is the guard's line. Executed.

The close departs from round 1's snippet: it leaves out the clause `this.headless.get(info.id) !== session`. Its ground holds, read. A session leaves the list in two places. The first is the bound in `headlessChanged`, which drops only sessions in `endedHeadless`, and only a session that is not `working` enters that set (`daemon.ts:972-974`). The second is `dropWorkItems`, which runs only after `endSessions`. `endSessions` stops every working session it was told of, and it refuses where one started meanwhile (`daemon.ts:449-451`, `:864-869`). A delete also refuses a new ask while it is under way (`worktreeFor`, `daemon.ts:772-775`). So a listed session that is `working` is the only one the clause would add, and the state guard already returns for every other.

```seal
confirms: round-1#2
```
What holds: `report` destroys the CLI's `stdout` and `stderr` before it calls the listener (`claude.ts:199-208`). Round 1's probe B, written again and run at `9c2a892`, passed: the events were `exit` alone. The committed case "reports nothing after the exit, and closes both streams …" passed. With both `destroy` calls removed in the round's clone, it went red at `claude-adapter.test.ts:348`, on the writes that should have failed. The case beside it, "… whose child still holds its streams …", passed at `9c2a892`. Executed. The close also says each `destroy` call was shown red alone with `seal mutate`. That is its claim, and this round removed both calls together.

The close leaves out `lines.close()`. Its ground holds, read. A `Readable` that is destroyed emits `close` and not `end`, so the readline gets no more data and flushes no partial line. The case's assertion holds the result.

```seal
confirms: round-1#3
```
What holds: `apps/desktop/test/ask-section.test.ts` ran once at `9c2a892`, the one built-app file of this round. Both cases passed in 5.68 s, and `ps` showed no stand-in or app left after the run. Executed. The case file imports `buildApp` from `./built-app`, so `vitest.config.ts` places it in the group of app files that run one at a time. The four lines at which the close says each mutant went red, 71, 73, 75 and 114, are the assertions on the button, the press, the error output and the fifty lines in the committed file. Read. Those runs themselves are the close's claim. `gaps.md:8` is closed in place, with the word `closed` opening the Item cell, as `skills/implement/SKILL.md` *4. The closing memo* asks. `9c2a892` removed the `pr.md` bullet, and the new paragraph at `pr.md:15` names the case. Read. Finding 1 above is a defect in the same commit of this fix, in the row above it.

`ask-section.test.ts:113` counts the `headlessDropped` messages as soon as the 50th session's `headless` message has arrived. The daemon sends the drop right after that message, in the same `headlessChanged` (`daemon.ts:962-980`). A separate read of the socket between the two would see none, and only a slow runner could produce that. The CI's one retry covers it, so this is named here and is no finding.

```seal
confirms: round-1#4
```
What holds: `pr.md:8`, `changelog.md:8` and `claude.ts:14` now state the condition of the kill. The search `git grep -n -i -e SIGKILL -e "killed 2 seconds" -e "kills the group" -e "stops with it"` at `9c2a892`, over the work item, `apps/desktop/src` and `docs`, lists no statement without it. `frame/design.md:47` and `:98` state the condition, and `guarantee.md:28` is the sealer's earlier summary. Executed. As the close says, this is a sample: a statement of the kill in other words is not reached by that search.

What matched: the orchestrator's folds at `9c2a892`. *Scope* item 2 now says the adapter closes the CLI's output pipes at the exit it reports and no event follows `exit`. *Scope* item 5 says a start refused for a session that has left `working` changes nothing. Both say what `claude.ts:199-208` and `daemon.ts:954-960` do. `frame/plan.md` *Judgments of the run* records the fold, with commits that are ancestors of `9c2a892`. `gaps.md:9` names `.github/workflows/check.yml`, which runs on `macos-latest` for pull requests into `release/**` and came with #115 (`e4df264`). Read.

What matched: each new case covers something its group does not. The daemon case covers the rejection path, where "changes nothing at an exit that arrives for a session it no longer lists" covers the exit. The adapter case covers the events after the exit, where the case beside it covers the signals after the exit. Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the typecheck and the documents' checks of the `Broad gate` key at `9c2a892` or the commit that fixes finding 1. This round ran its probe file, two test files narrowed by `-t`, and `ask-section.test.ts` once (contract rule 2) | `seal/config.json`, `Broad gate` | the orchestrator, at the broad gate |
| Round 1's row on whether a stop should also kill a group whose CLI exited at SIGTERM while a member ignored it. The fix diff leaves *Scope* item 2's ground as it stood | `seal/threads/1795268972-headless-failure-and-limit/frame/design.md:47` | the orchestrator, as round 1's `## Not judged` row named |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts test/claude-adapter.test.ts -t "tmp round2\|changes nothing at a start that fails after its session ended\|reports nothing after the exit\|whose child still holds its streams"`, in `apps/desktop` of the round's clone at `9c2a892`. `test_tmp_round2.test.ts` is a copy of `test/daemon.test.ts` at `9c2a892` with round 1's probes A and B added, and it stands under `<scratchpad>/1795268972-headless-failure-and-limit/round-2/clone/` | Exit 0: 2 files, 5 passed and 243 skipped. Probes A and B, the committed daemon case in the copy and the adapter file's two cases passed |
| The same clone with the guard at `daemon.ts:958` and the two `destroy` calls of `claude.ts` removed through the `Edit` tool: `node scripts/test-in-electron.mjs test/daemon.test.ts test/claude-adapter.test.ts -t "changes nothing at a start that fails after its session ended\|reports nothing after the exit"`. The source was restored with `git checkout -- apps/desktop/src` after the run | Exit 1, 2 failed: `daemon.test.ts:3569` (`expected [ { type: 'headless', …(1) } ] to deeply equal []`) and `claude-adapter.test.ts:348` (`expected [ true, true ] to deeply equal [ false, false ]`) |
| `node scripts/test-in-electron.mjs test/ask-section.test.ts --reporter=verbose`, run once in the same clone at `9c2a892` | Exit 0, 2 passed in 5.68 s. No process of the run was left (`ps`) |
