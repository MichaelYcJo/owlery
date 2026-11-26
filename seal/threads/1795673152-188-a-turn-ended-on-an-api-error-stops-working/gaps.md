# Closing memo: a turn that ends on an API error stops working

## Not verified

| Item | Who must answer |
|---|---|
| That a real Claude Code session sends `StopFailure` in the shape of the hooks reference's example, with no `Stop` after it. The fixture is the reference's example and not a recording (`frame/questions.md` Q1, default not run). | the owner, by allowing one run of a real `claude` against a stand-in server |
| That a subagent's `StopFailure` names the subagent's `agent_id` in its input and the session's own `StopFailure` names none, which the guard at `apps/desktop/src/daemon/agent-events.ts:23` stands on. Read in review round 1 from the minified code of Claude Code 2.1.332, not from a session. Q1's run shows it only where its prompt starts a subagent. | the owner, by allowing one run of a real `claude` against a stand-in server |
| The whole suite, the repository-wide lint and the typecheck at HEAD. Only the narrow files, the new daemon cases and the package's `tsc --noEmit` ran. | the orchestrator, at the broad gate |
| That an app started with this build shows "Needs you" and the error's text for a failed turn. No window was started and no real session ran. | the owner, at the walk of the release |

## Not done

Scope item 7 of `frame/design.md`, the rule of *Rule changes* in both editions of `docs/architecture.md`, is the settle's and was not written. Nothing else of the scope was left.
