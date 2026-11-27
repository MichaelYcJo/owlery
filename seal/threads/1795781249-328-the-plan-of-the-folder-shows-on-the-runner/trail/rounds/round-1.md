# Review round 1: 1795781249-328-the-plan-of-the-folder-shows-on-the-runner

```seal
target: b08cf838 against origin/release/v0.1.0
```

This round reviewed the net diff `d323b45a..b08cf838`. The code under review is one guard and its comment in `apps/desktop/src/renderer/renderer.ts` and one new case with its header lines in `apps/desktop/test/work-item-form.test.ts`. It read `routing.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-1.md` whole at the target, and issues #328, #330 and #331 through `gh issue view`. The work item stands on the ladder's second rung, so it holds no `frame/design.md`, `frame/plan.md` or `frame/questions.md`, and `gaps.md` *Scope confirmation* stands for the plan. No `pr.<lang>.md` is owed, since `Commit and pull request language` is English. No `seal/parity.json` is declared. No earlier round record stands, so no fact was carried and every fact below was established this round.

## Findings

### 1. The pull request closes #328 with a line of its *Done when* undelivered, and #328 does not say the line moved, while `gaps.md` says #331 holds a line that #331 states more weakly

```seal
severity: must
location: `seal/threads/1795781249-328-the-plan-of-the-folder-shows-on-the-runner/gaps.md:18`
evidence: executed `gh issue view 328`, `gh issue view 331`, `git grep -n -F 'Done when' -- seal/threads/1795781249-328-the-plan-of-the-folder-shows-on-the-runner/`, `git grep -n -F '#331' -- seal/threads/1795781249-328-the-plan-of-the-folder-shows-on-the-runner/`; read `seal/threads/1795781249-328-the-plan-of-the-folder-shows-on-the-runner/gaps.md:18`, `seal/threads/1795781249-328-the-plan-of-the-folder-shows-on-the-runner/trail/phases/phase-1.md:51`, `seal/threads/1795781249-328-the-plan-of-the-folder-shows-on-the-runner/pr.md:1`
```

Why it matters: `skills/implement/orchestration.md` *Orchestrator: what needs a person is asked in one batch* says that a *Done when* line is what the run must deliver. #328's second line asks that "the next three no longer depend on the state the first leaves where it fails". The tree does not deliver it: `apps/desktop/test/chain-choice.test.ts` is unchanged, and phase 1 says so at `trail/phases/phase-1.md:51`. `pr.md:1` still carries `Closes #328`. So the release workflow will close #328 while its body names an outcome nobody built.

The move to #331 holds on its merits. The dependence is a property of the file's shared app, and the first case's cause, which this work fixes, is not part of it. Phase 1 reads case 2's, case 3's and case 4's failures in the runner's attempts as failures that follow from case 1's, and the dump agrees: case 1 failed on the plan, and the later failures name only what case 1 did not leave. But the decision stands only in `gaps.md:18` and in #331's body. #328's body is unchanged and has no comments (`gh issue view 328`: `comments: 0`). The issue body is what the sealer reads the work against (`agents/sealer.md`). The plugin folds a decision into the issue's body in the case it names, an answer a batch gave (`skills/implement/orchestration.md`, the paragraph opening *A request that names several issues*). A narrowing of the issue's own *Done when* changes what the issue asks in the same way.

The second defect is in the sentence itself. `gaps.md:18` says #331 "holds it", the dependence #328 named. #331's *Done when* accepts either outcome: "Each later case of the file either reaches its own starting state, or fails with a message that names the earlier case it depends on". Its second outcome still depends on the first case, so #331 holds a narrower line than the one it took. That narrowing may be the right trade, since the suite's time is a cost, but no record says it was chosen. `git grep -n -F '#331'` and `git grep -n -F 'Done when'` over the work item print only `gaps.md:18`. Both searches are a sample under contract rule 12, because they match only these spellings. `trail/phases/phase-1.md:51` states the dependence and points to `gaps.md` for the reason, and it needs no change.

The fix has two parts. The first is an edit of #328's body, which only the orchestrator makes, since this round posts nothing. The second is a rewrite of `gaps.md:18`. Where the orchestrator would rather #331 keep #328's stronger wording, it edits #331's *Done when* instead, and the last two sentences below then say that #331 asks what #328 asked.

```markdown
## Done when

- The cause of the wait for the plan of the folder on the runner is read from the window and the daemon (what the form had sent, what the plan's request returned), not guessed.
- The first case waits on what it reads; a longer blind wait or a weaker assertion is ruled out.

The line that asked that the next three cases no longer depend on the state the first leaves where it fails moved to #331 on 2026-11-27. Making each later case reach its own start changes the file's design and the suite's time, and #331 weighs that against a failure that names the case it depends on.
```

```markdown
The cases after the first in `chain-choice.test.ts` still depend on the state the first case leaves. #328's *Done when* asked that they no longer do, and that line moved to issue #331, filed on 2026-11-27 in the milestone `hardening: boundaries and edge cases`; #328's body says so. Making each case reach its own start is a change to the file's design and to the suite's time. So #331 asks less than the line it took: each later case either reaches its own start or fails with a message that names the case it depends on, chosen with the suite's time weighed.
```

```seal
verdict: fixed db9a83ab
answer: gaps.md:18 now carries the round's paste-ready sentence, which says #331 asks less than the line it took and that #328's body says so. #328's body was edited on GitHub on 2026-11-27 with the round's paste-ready Done when, which records the line's move to #331.
```

### 2. `routing.md` states what other pull requests will do after this one lands, and a universal about every pull request into the release

```seal
severity: should
location: `seal/threads/1795781249-328-the-plan-of-the-folder-shows-on-the-runner/routing.md:15`, `seal/threads/1795781249-328-the-plan-of-the-folder-shows-on-the-runner/routing.md:23`
evidence: executed `git grep -n -F '#318' -- seal/threads/1795781249-328-the-plan-of-the-folder-shows-on-the-runner/`, `git grep -n -F 'before them' -- seal/threads/1795781249-328-the-plan-of-the-folder-shows-on-the-runner/`; read `seal/threads/1795781249-328-the-plan-of-the-folder-shows-on-the-runner/routing.md:15`, `seal/threads/1795781249-328-the-plan-of-the-folder-shows-on-the-runner/routing.md:23`
```

Why it matters: contract rule 19 says a change does not state a state outside the work item's branch that a later act can make false with no commit on the branch. Its examples include what another work item has been ordered to do, and a sentence that predicts the state after a later act. `routing.md:23` says that #327 and #318 "merge the release in after it lands", which is what two other work items will do. `routing.md:15` says "It blocks every pull request into `release/v0.1.0`, #327 and #318 among them". That is a universal about pull requests outside the branch, and a merge or a rerun of another pull request can make it false. In place of those statements the rule asks for what the work item decided, with each thing named by its role. The sealer reads `routing.md` whole, and an order between pull requests is a thing it acts on. The two searches print only these two lines. They are a sample under contract rule 12. The other values in the routing are rows a check reads by value (`Branch`), dated statements (`Answered 2026-11-27`, the cut at `d323b45a`) or named runs, and rule 19 keeps those.

Replace the last sentence of `routing.md:15`, and the bullet at `routing.md:23`:

```markdown
On 2026-11-27 it failed the `check` job of the release's pull requests, #327 among them, so the orchestrator runs it before the release's pull requests that wait on that job.
```

```markdown
- **Branch:** cut from `release/v0.1.0` at `d323b45a` on 2026-11-27. The orchestrator decided on that day that the pull request merges into the release branch by squash before the release's pull requests that wait on its `check` job, and that each of those merges the release branch in after it lands.
```

```seal
verdict: fixed db9a83ab
answer: routing.md now carries the round's two paste-ready texts: the dated failure of the check job in place of the universal about every pull request, and the Branch bullet naming the orchestrator's dated decision with the pull requests by their role.
```

## Confirmations

What matched: the probes are gone. `git diff 6b37fc8f 2e9951a9` prints nothing, so `2e9951a9` leaves the tree as `6b37fc8f` had it. `git diff --stat 6b37fc8f b08cf838 -- apps/desktop/test` names only `apps/desktop/test/work-item-form.test.ts`. `git ls-files | grep -i test_tmp` and `find` for `test_tmp*` outside `node_modules` in the worktree print nothing, so no `test_tmp_328_*` copy stands, tracked or untracked. Executed.

What matched: the guard holds on every path that closes the form, and skipping the listener's work while the form stands open leaves nothing uncleared. The form is closed by Cancel (`apps/desktop/src/renderer/renderer.ts:2240`). Escape closes it through the dialog's own cancel, and the window has no `cancel` listener, so the same `close` event follows. A successful creation closes it at `renderer.ts:2019`, and a registration's `done` closes it in `answered` at `renderer.ts:469`. That last path closed it on the runner. A refused creation keeps the form open (`renderer.ts:2131-2134`), and so does a refused registration (`renderer.ts:472-474`), so neither sends a `close` event. Every one of these paths sends the same event, because the browser schedules it from `close()` whoever calls it. The form opens only in `openWorkItemForm` (`renderer.ts:1717-1737`; `showModal` on `workItemDialog` stands only at `renderer.ts:1734`). That function calls `forgetBases` (`renderer.ts:1796-1802`), which clears every `baseTimers` entry, and it ends with `askPlan`, which clears `planTimer` (`renderer.ts:1837-1838`). The listener clears only those two things (`renderer.ts:2264-2269`). So any close event that arrives while the form stands open comes after an opening that has already cleared what the closed opening left. A second close sends its own event, which runs on a closed form and clears. Claimed in `gaps.md` *Scope confirmation*, `phase-1.md` and the code's comment at `renderer.ts:2263`. Read.

What matched: the new case reproduces the runner's cause and not a different one. On the runner the stale `close` event cleared the `planTimer` that the reopened form's `input` had set (dump line 1302 of `plain.log` in phase 1's scratch: `input` "Chosen" at 745 ms, and no `planWorkItem` for it afterwards). The case at `apps/desktop/test/work-item-form.test.ts:231-245` closes the form, opens it through its button's handler and dispatches `input` on the title in one `Runtime.evaluate`. The close event then necessarily comes after the timer is set. Without the guard, the listener clears that timer and no plan for "Late close" is asked. The wait at `work-item-form.test.ts:241` reads what the form shows, so it is no blind wait. Executed in this round's clone at `b08cf838`. With the guard the file gave `Tests 11 passed`. With only the line `  if (workItemDialog.open) return;` removed it gave `1 failed | 10 passed`, and the one failure was the new case at `work-item-form.test.ts:241`: `the window never showed the branch No branch yet. The first commit or a rename makes owlery/late-close. in the form`. That is the line and the message phase 1 reports for its red run and its `seal mutate`. The green is deterministic, because the guard returns whenever the event comes while the form is open, and the form stays open until the case presses Cancel.

A note that holds no finding: the case is red without the guard only where the page delivers the close event within `PLAN_WAIT_MS` (150 ms, `renderer.ts:177`). If the event comes later, the timer has already fired, the plan is asked, and the mutant passes. On this Mac the event came in time, by the red run above. The runner's dump shows the event at least 126 ms late there (the form closed after 619 ms, and the typing at 745 ms came before the listener ran). So the case is not shown to hold the guard on the hosted runner, and the broad gate on this Mac is what holds it. The case's comment at `work-item-form.test.ts:232` claims only that the event comes after all three acts, which is true.

What matched: issue #328's first *Done when* line. The phase's account of the dump is what `plain.log` holds. In the failing original (line 1302): the repository field's `input` comes at 552 ms, `addRepository` at 585, `done` at 619, a `planWorkItem` for `hazel-birch` at 703, a `pointerdown` at 711, a `planWorkItem` for `swift-bison` at 715, the `input` "Chosen" at 745, and both plans are answered at 873 and 874. No plan for "Chosen" was sent. The state is `socketState` 1, `hidden` false, `sameLoad` true, and the form's plan shows `owlery/swift-bison`. The probe's own plan, request 999999, was answered `owlery/chosen` at 16016 (line 1315). The two copies' gaps between the repository's `input` and the reopening's plan are 130 ms (383 to 513, line 1288) and 142 ms (337 to 479, line 1295), as phase 1 says. Read.

A note that holds no finding: phase 1's contrast between the 130 and 142 ms gaps and the 163 ms gap explains whether `beforeAll`'s stale timer fired. It does not explain the failure. The failure needs the close event after the typing, which came 69 ms after `done` in copy b and 126 ms after it in the original. Phase 1 states the cause correctly in its preceding sentences, and it says that the event's lateness was not measured.

What matched: issue #328's second *Done when* line, first half. The first case waits on `formPlanOf("Chosen")` at `apps/desktop/test/chain-choice.test.ts:120`, which reads what the form shows. The diff changes that file not at all and adds no timeout and no weaker assertion anywhere. Read. The line's second half is finding 1.

What matched: phase 1's other claims. `git diff --stat d323b45a^ d323b45a -- apps/desktop/src/renderer apps/desktop/src/main apps/desktop/test/built-app.ts apps/desktop/test/chain-choice.test.ts` printed nothing. `d323b45a` is #320's merge, the pull request of #127. `git log -S'workItemDialog.addEventListener("close"' -- apps/desktop/src/renderer` names `85c381ac` (#92) as the commit that added the listener. The census command `git grep -n 'addEventListener("close"' -- apps/desktop/src/renderer` prints eight listeners at the target, as phase 1 lists them. This round widened the class to `onclose` and every `"close"` and `'close'` in `apps/desktop/src`, and found no other dialog close listener. The three unguarded listeners (`apps/desktop/src/renderer/app-settings.ts:56`, `apps/desktop/src/renderer/work-item-view.ts:1763`, `work-item-view.ts:1774`) clear `thenOpen`, `accountChange` and `paneNaming`, as `gaps.md` *Not done* and #330 say. #330 and #331 stand open in the milestone `hardening: boundaries and edge cases`. `chainAsked`'s comment at `renderer.ts:780-786` says the page delivers the close event late. The rename and records listeners at `renderer.ts:2280-2281` and `renderer.ts:2380-2381` return while their dialog is open. Executed and read.

What matched: `routing.md`'s title-prefix row. By `skills/commit-pr-convention/SKILL.md` *Commit messages*, `fix:` is behaviour that was wrong against a rule the tree stated before the change. The neighbouring listeners' guard and `chainAsked`'s comment are that rule, and the change is to the window's code, so `fix` holds. The change's own case does not decide the prefix. The row's claim that a person can meet the defect is not shown by any record. A person would have to reopen the form and type before the page delivers the close event. The prefix holds on the other grounds whether or not a person can. Read.

What matched: `pr.md`. Each of its four quotes stands word for word in `gaps.md` *Scope confirmation* or `routing.md` *Why this way* (`grep -c -F` on each printed 1 in its source). `seal pr-body --body <scratch>/body.md` composed the body with exit 0, and the composed body carries `gaps.md` *Not done* with #330 and #331. The attribution line before `## From the records` matches earlier pull requests into the release (#320). Executed.

What matched: `changelog.md` and `gaps.md` *Not verified*. The changelog's account of the late close event, the cancelled plan and the guard matches the code and the dump. It names the form's, the rename dialog's and the records dialog's listeners, and each stands at the target. The first *Not verified* row's "3 of the 7 runner attempts" matches the table in `trail/phases/phase-1.md`. Both rows name the orchestrator as their answerer, as contract rule 2 asks. Read.

What matched: the new case against its group. No other case of `work-item-form.test.ts` reopens the form before its last close event has come. The case "opens again on the same repository with the default base" at `work-item-form.test.ts:219` reopens through `openForm` after a full round trip, by which time the event has been delivered. So the new case covers what nothing else in the file covers. Its header lines at `work-item-form.test.ts:4-6` name it. Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| `chain-choice.test.ts` passes on the hosted runner at its first `check` attempt | `gaps.md` *Not verified*, row 1 | the orchestrator, from the pull request's `check` job |
| The broad gate: the full suite, the typecheck and the docs checks. This round ran `work-item-form.test.ts` alone, twice, and the suite stays `unverified` | `gaps.md` *Not verified*, row 2 | the orchestrator, at this work item's broad gate |
| Whether the new case is red without the guard on the hosted runner, where the close event came at least 126 ms late against a 150 ms timer | `apps/desktop/test/work-item-form.test.ts:231-245` | the orchestrator, if it wants the case to hold the guard on the runner as well as on this Mac |
| Why the page delivers the close event later on some runs than on others, which phase 1 did not measure | `trail/phases/phase-1.md`, *Cause* | issue #330's work, which meets the same event in three more dialogs |

Findings 1 and 2 stand open for the fix pass. Finding 1 also needs an edit of #328's body, which only the orchestrator can make.

## Probes

| Command | Result |
|---|---|
| `git clone --no-local` of the worktree into the round's scratch, checked out at `b08cf838`, then `pnpm install --offline --frozen-lockfile` and Electron's `install.js` from its cache | exit 0; `node-pty` rebuilt, Electron's `dist` in place |
| `cd apps/desktop && sh <scratch>/round-1/alone.sh node scripts/test-in-electron.mjs --project app test/work-item-form.test.ts --reporter=default` at `b08cf838` | exit 0: `Test Files 1 passed`, `Tests 11 passed` |
| the same command with only `  if (workItemDialog.open) return;` removed from the clone's `apps/desktop/src/renderer/renderer.ts`, restored afterwards with `git checkout` | exit 1: `Tests 1 failed / 10 passed`; the new case at `work-item-form.test.ts:241`, `the window never showed the branch No branch yet. The first commit or a rename makes owlery/late-close. in the form` |
| `git diff 6b37fc8f 2e9951a9`; `git diff --stat 6b37fc8f b08cf838 -- apps/desktop/test` | nothing; only `apps/desktop/test/work-item-form.test.ts` |
| `git diff --stat d323b45a^ d323b45a -- apps/desktop/src/renderer apps/desktop/src/main apps/desktop/test/built-app.ts apps/desktop/test/chain-choice.test.ts` | printed nothing |
