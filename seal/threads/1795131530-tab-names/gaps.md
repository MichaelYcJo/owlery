# Closing memo: 1795131530-tab-names

## Not verified

| Item | Who must answer |
|---|---|
| The desktop suite, the typecheck of the whole app and the repository's broad gate. The session ran `test/view.test.ts` (171 passed) and `pnpm run typecheck` (exit 0) at `797fb23`, and changed one expectation of `test/korean-input.test.ts`, which starts the app and did not run | the orchestrator, at the broad run |
| The tabs as the window draws them, and a tab whose number changes while a person reads it after another pane of its kind closes. No start of the app drew them; `work-item-view.ts#tabElement` hands `tabLabel` the list the view's tabs are drawn from (`read`) | the owner at the window |

## Not done

The label of a tab still holds no more than the kind and its place. A pane a person names, or a pane named by what its agent works on, is outside issue #86.
