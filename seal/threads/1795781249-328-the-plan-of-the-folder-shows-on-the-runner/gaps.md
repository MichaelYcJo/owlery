# Closing memo: 1795781249-328-the-plan-of-the-folder-shows-on-the-runner

## Scope confirmation

The "New work item" form's `close` listener in `apps/desktop/src/renderer/renderer.ts` ends nothing while the form stands open again. So a close event the page delivers after the form reopened no longer cancels the plan of the name typed in it. That cancelled plan is what the first case of `apps/desktop/test/chain-choice.test.ts` waited for on the hosted runner, and the new case of `apps/desktop/test/work-item-form.test.ts` pins the fix.

## Not verified

| Item | Who must answer |
|---|---|
| `chain-choice.test.ts` passes on the hosted runner at its first `check` attempt. It passed in 3 of the 7 runner attempts recorded before the fix (`trail/phases/phase-1.md`), and it never failed on this Mac, so no run here shows the fix holding there. The new case of `work-item-form.test.ts` shows the cause deterministically on this Mac. | the orchestrator, from this pull request's `check` job |
| The broad gate: the whole suite, the package's typecheck and the docs checks. Phase 1 ran `work-item-form.test.ts` and `chain-choice.test.ts` in one command, and `tsc --noEmit` in `apps/desktop`. | the orchestrator, at this work item's broad gate |

## Not done

The close listeners of the editor dialog (`apps/desktop/src/renderer/app-settings.ts`, which clears `thenOpen`), of the pane's account dialog and of the pane's name dialog (`apps/desktop/src/renderer/work-item-view.ts`, which clear `accountChange` and `paneNaming`) have the same defect. A close event that arrives after the dialog opened again clears what that opening set, so its Save does less than it says. Each needs the same one-line guard and a built-app case of its own, seen red. That is beyond #328, which is about the form's plan, so this phase left them. The orchestrator files them as an issue.

The cases after the first in `chain-choice.test.ts` still depend on the state the first case leaves, as the file states: one app serves the cases in the order they stand in. #328's *Done when* asks that they stop depending on it. Making each reach its own start would mean redoing the first case's creation and answer in each, or starting an app for each. That is a change to the file's design. The defect that made the first case fail is fixed, so the later cases fail only where the first one does. This phase left the order as it stands, for the orchestrator and the review to weigh against the issue's *Done when*.
