# Closing memo: 1795396351-seal-breaks-after-a-commit

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite, the repository-wide typecheck and the documents' checks of the `Broad gate` key, on the tree phase 1 leaves: phase 1 ran its own set alone (`trail/phases/phase-1.md`) | the orchestrator, at the broad gate |
| The built-app test files that load the daemon through the build and that phase 1's run did not start: every file of the `app` project but `daemon-restart.test.ts`, `get-a-seal.test.ts` and `role-bundle.test.ts` | the orchestrator, at the broad gate |
| Whether the 3-second bound of the case "reads a head of 10 round records within the interval of the daemon's read of the branches" holds while the broad gate's other suites load the machine: it took 612 ms on an idle machine, and issues #161 and #164 saw cases of the unit project run past 5 seconds under load | the orchestrator, at the broad gate |
| That `daemon.ts#readBranchNow` waits for the read of the branches under way, so an earlier head's reading does not land over the chain's: no case watches it, and `seal mutate` found the break unseen (`trail/phases/phase-1.md`) | the review chain's round 1, by reading |
| The whole suite, the repository-wide typecheck and the documents' checks of the `Broad gate` key, on the tree phase 2 leaves: phase 2 ran its own set alone (`trail/phases/phase-2.md`) | the orchestrator, at the broad gate |
| The built-app test files that load the daemon through the build and that phase 2's run did not start: every file of the `app` project but `daemon-restart.test.ts`, `get-a-seal.test.ts` and `role-bundle.test.ts` | the orchestrator, at the broad gate |
| Whether a real sealer session, given the narrowed prompt and the bundle's new paragraph, checks the part that changed, names the run it stands on and still gives a verdict on the whole branch: every case runs the fake adapter, and no case starts a real `claude` | the orchestrator, at the first real chain of issue #48's walk-through that gets a new seal after a commit breaks one |
| The whole suite, the repository-wide typecheck and the documents' checks of the `Broad gate` key, on the tree phase 3 leaves: phase 3 ran its own set alone (`trail/phases/phase-3.md`) | the orchestrator, at the broad gate |
| The built-app test files that load the window through the build and that phase 3's run did not start: every file of the `app` project but `approval-line.test.ts`, `get-a-seal.test.ts` and `notification-click.test.ts` | the orchestrator, at the broad gate |
| That the two new cases of `test/approval-line.test.ts`, the drawn places of scenario 15, fail without the code they pin: they were not run before the code, since this run starts the built app once per phase, and `shared.ts#drawSeal`, `list.ts#showPreview` and `work-item-view.ts#showSeal` had no `seal mutate` run (`trail/phases/phase-3.md`) | the review chain's round 1, by reading, or a `seal mutate` run of `shared.ts#drawSeal` against that file in the orchestrator's next built-app batch |
| That `renderer.ts#takeLists` raises the notification of a broken seal in the built app: scenario 13's cases read `view.ts#sealNotifications` alone, and no built-app case watches a notification of a seal | the review chain's round 1, by reading `renderer.ts#takeLists` |
| How the broken seal looks in each theme and appearance: the break and the values of `--seal-broken-light` were judged from the drawings' colours, and no screenshot was taken (`trail/phases/phase-3.md`) | the crafter of phase 5, at the screenshot run, and the review reading the files against `docs/design.md`; `frame/questions.md` Q1 stays a person's |

## Not done

A work item whose base commit was never recorded gets no seal read: `daemon.ts#readBranch` returns before it reads anything for such a work item, as it did before this work, and only work items made before the base commit was recorded are such. Reading the seal for them would mean a second path into the read of a branch for a case no current build makes.

A seal stage whose newest verdict block is no seal gets the whole prompt, even where an older block sealed a commit the gate's commit holds: a broken seal, then a `withheld` run, then a fix, gives the next sealer the branch since its base. Reading back to the newest block that seals was within reach. `frame/design.md` *Scope* item 13 starts from the newest block at the stage's start, so phase 2 builds the frame's rule, and such a run costs a whole audit (`trail/phases/phase-2.md`).
