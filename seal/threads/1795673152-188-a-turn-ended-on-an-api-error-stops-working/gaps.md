# Closing memo: a turn that ends on an API error stops working

## Not verified

| Item | Who must answer |
|---|---|
| closed That a real Claude Code session sends `StopFailure` in the shape of the hooks reference's example, with no `Stop` after it. The fixture is the reference's example and not a recording (`frame/questions.md` Q1, default not run). | re-homed to issue #110, in a comment of the settle of release 0.0.5 that lists the row |
| closed That a subagent's `StopFailure` names the subagent's `agent_id` in its input and the session's own `StopFailure` names none, which the guard at `apps/desktop/src/daemon/agent-events.ts:23` stands on. Read in review round 1 from the minified code of Claude Code 2.1.332, not from a session. Q1's run shows it only where its prompt starts a subagent. | re-homed to issue #110, in a comment of the settle of release 0.0.5 that lists the row |
| closed The whole suite, the repository-wide lint and the typecheck at HEAD. Only the narrow files, the new daemon cases and the package's `tsc --noEmit` ran. | answered: the broad gate passed at `95e9ee8e`, the last run of this work item's `trail/gate.md`, after which only the work item's records changed (`git diff --name-only 95e9ee8e fdc4f3c9` outside its directory prints nothing); the `check` workflow passed on pull request #268 at `fdc4f3c9`, the head it merged from |
| closed That an app started with this build shows "Needs you" and the error's text for a failed turn. No window was started and no real session ran. | re-homed to issue #110, in a comment of the settle of release 0.0.5 that lists the row |

## Not done

Scope item 7 of `frame/design.md`, the rule of *Rule changes* in both editions of `docs/architecture.md`, is the settle's and was not written. Nothing else of the scope was left.
