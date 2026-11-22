# Closing memo: 1795343000-background-window-unseen

## Not verified

| Item | Who must answer |
|---|---|
| The suite at this branch's head: the typecheck of every package and the full run, among it the ten files that start the built app and that this phase did not run (`ask-section`, `daemon-restart`, `keep-awake`, `korean-input`, `role-bundle`, `records-dialog`, `role-session`, `work-item-form`, `work-item-menu`, and `memory.test.ts` under `OWLERY_MEASURE_MEMORY` beyond two scenarios). `apps/desktop`'s own typecheck passed at `dd022bb` | the orchestrator, at the broad gate |
| A window at opacity 0 keeps its page visible and drawing under a window over it, on GitHub's macOS runner and on another macOS than 26.6. Measured once on the owner's Mac, under a Google Chrome window | the orchestrator, by the pull request's `check` run, where a case that waits on the page's frames or on `matchMedia` would fail |
| A start of the app without `OWLERY_BACKGROUND` is unchanged: its window is shown at full opacity, takes the focus and receives the mouse. Held by reading `main.ts:152` alone; no such start was made, because it draws a window over the owner's screen | the owner, by starting the app as a person does (`pnpm --filter @owlery/desktop start`) |

## Not done

The folder dialog that the work item form's Browse button opens is a sheet of the window (`main.ts`, `Channel.pickFolder`). A sheet is a window of its own, and this phase did not make it transparent or measure whether it takes the parent's opacity. No case and no agent's run of the built app opens it: `git grep work-item-browse` finds it only in `src/renderer`.

The statements in `docs/architecture.md`, `docs/roadmap.md`, `docs/design.md`, their Korean twins and `apps/desktop/measurements/memory.md` that list what a background start does were not rewritten to say its window is not seen. The crafter writes none of those files, and `trail/phases/phase-1.md` lists each line for the orchestrator.
