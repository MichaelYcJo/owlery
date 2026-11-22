# Closing memo: 1795329619-timed-cases-race

## Not verified

| Item | Who must answer |
|---|---|
| The submenu's pointer case, the worktree link case and the link card case hold on GitHub's macOS runner with no retry. The push and the draft pull request that would have run `check` were declined (contract rule 6), so no run of the runner has read this branch | the orchestrator, by the pull request's `check` run at its head |
| What the runner's first start does that makes the debugging port's round trips outlast the 300 ms pause, issue #117's first *Done when* line. Measured on the owner's Mac only: an eightfold slower page still passed, so the time is spent outside the page | the orchestrator, from the `check` run's log, or with a probe on the runner where the case still fails there |
| The suite at this branch's head: the typecheck and the full run. Each file that starts the built app ran alone, and so did `background.test.ts` | the orchestrator, at the broad gate |
| A person's pointer passing over the window of an app started in the background reaches nothing in its page. Moves posted to the app's process were probed; no real pointer moved, and no case holds it | the owner, by moving the mouse over a running test window, and over a window started with `OWLERY_BACKGROUND=1` |
| That a person's pointer turned the link card case red at `4227552`. This phase found a person's pointer able to do it, and nothing else that could | the owner, who knows whether the mouse was in use during that run |

## Not done

`docs/architecture.md` *Measure before building* (and `docs/architecture.ko.md`), the bullet that opens "A start of the app that an agent makes on a person's machine sets `OWLERY_BACKGROUND=1`", says the window opens without the focus and without a Dock icon. It now also lets the system's pointer through, which the bullet does not say. `docs/roadmap.md:29` (and `docs/roadmap.ko.md:29`) says the same of the Korean input case's start. The policy root is not this crafter's to write, and this work item has no `frame/design.md` to carry a `## Rule changes` entry. The orchestrator places the rule.

`seal/threads/1795268298-desktop-suite-in-ci/changelog.md:8` is a fragment of release 0.0.2, and it says a failed case runs once more on the runner. This work removes that retry. The fragment is another work item's, so it is named here and in the hand-back for the orchestrator to fold.

`linkAt`'s negative readings in the path case were not given a wait of their own. The wait for the pane's last line comes before them, and the window draws the pane's output in the order it was printed.
