# Closing memo: 1795268972-headless-failure-and-limit

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite, the typecheck over the whole app and the documents' checks of the `Broad gate` key, at the work item's last commit. Phase 1 ran only the cases of `claude-adapter.test.ts`, `fake-adapter.test.ts` and `daemon.test.ts` it names in `trail/phases/phase-1.md`, and a typecheck of the 41 files the changed modules and their importers make up. Phase 2 ran only `view.test.ts` and `themes.test.ts`, one drive of the built app, and a typecheck of 21 files (`trail/phases/phase-2.md`). The test files that start the built app load the changed renderer through the bundle, and none of them ran. Round 1's fix pass ran only `daemon.test.ts`, `claude-adapter.test.ts` and `ask-section.test.ts`, and the broad run at `1feb1e5` (`trail/gate.md`) precedes its commits | the orchestrator, at the broad gate |
| closed The window's "Stop" button, its press that sends `stopHeadless`, the `.error-output` part under a failed line and the `headlessDropped` case of `renderer.ts`'s switch | `test/ask-section.test.ts` holds them since `a531227`, each case seen red with only its guard removed (`seal mutate`, round 1's fix pass) |
| The cases that run against time (the kill after `KILL_AFTER_MS`, the 300 ms grace, the limit, the waits at a close and at a delete) were run on the owner's machine alone. A slower runner can move them | the `macos-latest` runner of the pull request's `check` workflow (`.github/workflows/check.yml`, merged with #115) |
| What a real Claude Code does at the group kill during a turn: how long it takes to exit (Q2), and whether a tool's process stays in its group (Q3). The cases use script CLIs, and no real `claude` turn was run, to spend none of the owner's usage | a measurement, as `frame/questions.md` Q2 and Q3 state |

## Not done

The daemon sends `headlessDropped` only when its bound takes a session off the list. A delete or a repository's removal takes its work items' sessions off the list and sends nothing for them, as before. `frame/design.md` *Scope* item 7 and *Data & interfaces* both name the bound alone since the fold at `8f2b9cc`.

So the window keeps the ended sessions of a deleted work item, or of a removed repository's work items, until it loads again. It draws none of them and counts none as running (`trail/phases/phase-2.md`). Pruning them at the `inbox` that follows a delete was within reach. It was not taken, because *Scope* item 9 names `headlessDropped` alone and the sessions the window keeps cost only its memory until a reload.

A headless run whose adapter is still starting is not waited for by the daemon's close or by a delete's wait. It is stopped once it has started, as before. Two existing cases pin that order: the close returns before such a run's stop, and a removal answers before it. Waiting for the start at the close could take the login shell's lookup, up to 10 seconds, past the app's 5-second wait.
