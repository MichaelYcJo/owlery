# Closing memo: 1795268972-headless-failure-and-limit

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite, the typecheck over the whole app and the documents' checks of the `Broad gate` key, at the work item's last commit. Phase 1 ran only the cases of `claude-adapter.test.ts`, `fake-adapter.test.ts` and `daemon.test.ts` it names in `trail/phases/phase-1.md`, and a typecheck of the 41 files the changed modules and their importers make up | the orchestrator, at the broad gate |
| The cases that run against time (the kill after `KILL_AFTER_MS`, the 300 ms grace, the limit, the waits at a close and at a delete) were run on the owner's machine alone. A slower runner can move them | the `macos-latest` runner of #30's workflow, once #30 merges and this pull request's suite runs there |
| What a real Claude Code does at the group kill during a turn: how long it takes to exit (Q2), and whether a tool's process stays in its group (Q3). The cases use script CLIs, and no real `claude` turn was run, to spend none of the owner's usage | a measurement, as `frame/questions.md` Q2 and Q3 state |

## Not done

The daemon sends `headlessDropped` only when its bound takes a session off the list. A delete or a repository's removal takes its work items' sessions off the list and sends nothing for them, as before. `frame/design.md` *Scope* item 7 names the bound alone, and its *Data & interfaces* says the message is sent "when a session leaves the list". Phase 1 built the narrower reading, and the hand-back names the difference for the orchestrator to fold.

A headless run whose adapter is still starting is not waited for by the daemon's close or by a delete's wait. It is stopped once it has started, as before. Two existing cases pin that order: the close returns before such a run's stop, and a removal answers before it. Waiting for the start at the close could take the login shell's lookup, up to 10 seconds, past the app's 5-second wait.
