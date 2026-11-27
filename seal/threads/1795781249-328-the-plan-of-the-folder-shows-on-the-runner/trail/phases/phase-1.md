# Phase 1: 1795781249-328-the-plan-of-the-folder-shows-on-the-runner

## What this phase found

**No frame stands.** The work item is on the ladder's second rung, so it has no `frame/design.md` and no `frame/plan.md`, and `gaps.md` *Scope confirmation* stands for the plan. `routing.md` *Why this way* gives the failure as a wait for the plan of the folder on the hosted runner, and that holds: the runner's dump below shows it.

**The handoff's leading reading, that something #127 changed behaves differently on the runner, is refuted.** `git diff d323b45a^ d323b45a --stat -- apps/desktop/src/renderer apps/desktop/src/main apps/desktop/test/built-app.ts apps/desktop/test/chain-choice.test.ts` prints nothing, so #127 changed nothing the failing wait runs through. The defect is in the window's code, and it came with #92 (`git log -S'workItemDialog.addEventListener("close"'` names `85c381ac`). The file was flaky on the runner before and after #127. The attempt logs of `check` show this. Each run used image `macos-26-arm64`.

| Run, attempt | Tree | Image | `chain-choice.test.ts` |
|---|---|---|---|
| 45951984393, 1 | #319's head `14c61def` | 20261117.0516.1 | passed, 4586 ms |
| 45956109171, 1 | #127's head `27a46e70` | 20261123.0526.1 | passed, 5242 ms |
| 45956109171, 2 | #127's head `27a46e70` | 20261117.0516.1 | 4 failed |
| 45991476001, 1 and 2 | #321's head `4481bbe5` | 20261117.0516.1 | 4 failed each |
| 45997303069, 1 | probe 1, `21a4393a` | 20261117.0516.1 | passed, 4531 ms |
| 46000105760, 1 | probe 2, `e431e483` | 20261117.0516.1 | 4 failed; its two copies passed |

**The unit project does not overlap the built-app files on the runner.** In every run in the table, the last unit file ends before the first app file starts. The first app file, `terminal-basics.test.ts`, ends about 85 to 95 s later, which its duration accounts for. `apps/desktop/vitest.config.ts` runs the app project with `fileParallelism: false`, as a group after the unit project, and the logs agree with it. So the load of `daemon.test.ts` does not reach the failing wait.

**The runner's view came from two probe runs on draft pull request #329.** The orchestrator opened #329 from this branch into `release/v0.1.0` and pushed each probe. Both probes were test-only and lived in commits `21a4393a` and `e431e483`. They were removed in `2e9951a9`, which leaves `apps/desktop/test/` as `6b37fc8f` had it. The second probe recorded, from the app's start onward:

- every frame the window sent and received;
- each step of `beforeAll` and of the first case;
- each `input` and `pointerdown`, the page's errors, and the socket's close.

It also ran two copies of the file, named `test_tmp_328_chain_choice_b` and `_c`. Run 46000105760 failed the original and passed both copies. Its dump of the failing original, in milliseconds from the probe's start:

- 552: the repository folder is typed in `beforeAll`. The field's `input` listener starts the plan timer (`askPlanSoon` in `apps/desktop/src/renderer/renderer.ts`, `PLAN_WAIT_MS` 150).
- 585, 619: `addRepository` is sent and answered `done`, and the window closes the form.
- 703: a `planWorkItem` goes out with the name generated at `beforeAll`'s opening, `hazel-birch`, before the first case's press has arrived (its `pointerdown` came at 711). The timer from 552 fired at 552 plus 150 ms. So the form's `close` listener, which clears that timer, had not run 84 ms after the close.
- 715: the first case's opening asks the plan of its own generated name, `swift-bison`.
- 745: the name "Chosen" is typed, and the title's `input` listener starts the timer again.
- 873, 874: both plans are answered. No plan for "Chosen" was ever sent.
- At the dump the socket was open, the page was the same load and not hidden, the title held "Chosen", and the form showed the plan of `swift-bison`. The plan the probe itself then sent for "Chosen" was answered with `owlery/chosen`, so the daemon answered every plan it was sent.

**Cause: the form's `close` listener ended a plan that a later opening had started.** At `6b37fc8f`, `git grep -n "clearTimeout(planTimer)" -- apps/desktop/src/renderer` names three places that clear `planTimer`: `askPlan`, `askPlanSoon` and the form's `close` listener. The first two always send or reschedule a plan, so the timer started at 745 was cleared by the `close` listener. That means the `close` event of `beforeAll`'s close arrived after the reopening and the typing. A dialog's `close` event comes in a task after `close()`. The comment on `chainAsked` in `renderer.ts` already says this page delivers it late, and the rename and records dialogs' listeners already return while their dialog stands open. The form's listener had no such guard. In the copies that passed, the reopening's plan request followed the repository's typing by 130 and 142 ms. That is before the timer from `beforeAll` was due, so the reopening's `askPlan` cleared it. In the original that failed, the gap was 163 ms, and the timer fired at 703, before the reopening. Why the close event is later on some runs than on others was not measured. It is a property of when the page runs that task, not of anything the cases do.

**The fix is in `apps/desktop/src/renderer/renderer.ts`, and it is one line.** The form's `close` listener now returns while `workItemDialog.open` holds, as the rename dialog's and the records dialog's listeners do. A close event that comes after the form opened again ends nothing of that opening. The orchestrator's handoff allowed a fix in `apps/desktop/src` where it is small and contained. This one needs no design decision: it applies the rule the two neighbouring listeners already state. It was judged against those two listeners' comments and against the comment on `chainAsked`.

**The case is added to the form's own group.** It stands in `apps/desktop/test/work-item-form.test.ts`: "shows the plan of a name typed in a form opened again before the page delivered the close event of the last opening". In one task of the page it closes the form, opens it again by its button and types a name, so the close event necessarily comes after all three. It then waits for the plan of that name. The file's header comment names it. `chain-choice.test.ts` is unchanged. Its first case already waits on what it reads (`formPlanOf("Chosen")`), and the window was what failed to give it.

**Seen red, then green.** All runs were on this Mac, through a script in the scratch folder that waits until no `test-in-electron` or `vitest.mjs` process runs.

- Red: `pnpm run test:app test/work-item-form.test.ts --reporter=default` against the unfixed renderer gave `1 failed | 10 passed`. The new case failed at `work-item-form.test.ts:241` with `the window never showed the branch No branch yet. The first commit or a rename makes owlery/late-close. in the form`, which is the wait for the plan.
- Green: `pnpm run test:app test/work-item-form.test.ts test/chain-choice.test.ts --reporter=default` with the fix gave `Test Files 2 passed`, `Tests 16 passed`.
- `pnpm exec tsc --noEmit` in `apps/desktop` exited 0.
- Locally `chain-choice.test.ts` never failed, at the unfixed tree or at the probes' trees. So its own pass is no evidence of the fix; the new case is.

**Mutation.** After commit `1dbf6815`, `seal mutate src/renderer/renderer.ts` removed the line `  if (workItemDialog.open) return;` and ran the whole form file: red, `1 failed | 10 passed`. The one failure was the new case, at line 241. `git diff --quiet HEAD -- apps/desktop/src` exited 0 afterwards. An earlier mutation command that ran the new case alone with `-t` had no baseline, because the case needs the repository the file's earlier cases set up. `seal mutate` refused it before writing the break.

**After the fix, the next three cases of `chain-choice.test.ts` still depend on the first.** The file starts one app for all its cases and says that they run in the order they stand in. Case 2 needs the work item and the kept answer that case 1 makes, case 3 needs that answer, and case 4 needs case 3's taking away of it. Their failures in the runs above came from case 1's failure and not from a defect of their own. Making each case reach its own start is a change to the file's design, which this phase did not make; `gaps.md` *Not done* says why.

**Census of the dialogs' close listeners, built from the producer.** `git grep -n 'addEventListener("close"' -- apps/desktop/src/renderer` lists every close listener of the window. At `1dbf6815` it printed eight. One is the socket's, in `connect`, which is no dialog.

- Return while their dialog stands open: `renameDialog` and `recordsPlaceDialog`, and now `workItemDialog`.
- Only give the keyboard back to the pane in front: `closeDialog` in `work-item-view.ts`. Focus cannot leave a modal dialog that stands open, so a late event there should change nothing; this was not run.
- Clear what an opening set, with no guard. These are instances of the same defect, and they are left to `gaps.md` *Not done*:
  - the editor dialog's listener in `apps/desktop/src/renderer/app-settings.ts` clears `thenOpen`;
  - `paneAccountDialog`'s listener in `work-item-view.ts` clears `accountChange`;
  - `paneNameDialog`'s listener in `work-item-view.ts` clears `paneNaming`.
