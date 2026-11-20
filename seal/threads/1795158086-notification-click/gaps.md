# Closing memo: 1795158086-notification-click

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the typecheck and the documents' checks as the `Broad gate` of `seal/config.json` runs them: phase 1 ran seven test files of `apps/desktop` in one command and `tsc --noEmit` over the ten files it changed, not `pnpm -r run check`. `seal deferrals . --kind all` exited 1: no CI file runs any of the three | the orchestrator, by the broad run |
| A person's press on a real macOS notification of Owlery runs the page's handler, for a banner and for an entry of Notification Center. Every case calls the recorded notification's `onclick` itself, and nothing reached macOS | the owner, by the measurement `frame/questions.md` Q1 names |
| The window comes forward in the app as it ships: restored where it is minimized, shown, focused, and Owlery made the active app by `app.focus({ steal: true })`. `test/forward.test.ts` runs the function with a window and an app that record their calls. The handler of `src/main/main.ts` that passes Electron's window and `app.focus` was read, and it ran in the background alone, where it answers `false` | the owner, at the same press as Q1 |
| The click handler of `src/renderer/renderer.ts` calls `window.owlery.comeForward()`. It was read. `test/notification-click.test.ts` calls the function itself and reads `false`, and no case sees the handler call it. That the object the preload exposes cannot be replaced by a recorder from the page is the builder's reading of Electron's `contextBridge`, not probed | the owner, at the same press as Q1: a view that opens behind another app says the call is missing |
| Whether each of the 11 mutants `seal mutate` reported red in the two calls of several mutants failed on the line that watches its unit: those calls print the verdict and the exit code, not the failing line | a reader re-running one pair alone, as `trail/phases/phase-1.md` reports for the one mutant of `work-item-view.ts` |
| A click for a work item that left the window's list, in the built app. `test/view.test.ts` holds the case on `notificationOpens`. The tree removes no work item, so no run of the app reached it | the builder of issue #93, whose work first takes a work item off the list |

## Not done

- **A click on a notification raised before the window reloaded opens nothing.** `frame/design.md` *Scope* puts it out of scope, and `frame/plan.md` *Alternatives considered* holds the design that covers it, a notification raised in the main process. `changelog.md` tells the person.
- **A rejected `comeForward` is not caught.** The handler does not wait for the answer and attaches nothing to the promise. The main process registers the channel before it creates the window, so the builder found no path on which the request is refused, and the view opens either way.
- **A click does not close the "New work item" form or move the keyboard out of it.** `frame/design.md` *Scope* item 6 and the assumption written in `frame/questions.md` keep the form. The person finds the view behind the form once they close it.
- **The window's other notifications of the same work item stay in Notification Center** after its view opens. Out of scope by `frame/design.md` *Scope*.
