# Closing memo: 1795388701-agent-choices-and-behind

## Not verified

| Item | Who must answer |
|---|---|
| Which hook events a real interactive Claude Code sends when its agent calls `AskUserQuestion`, in which order, and whether its own dialog numbers the choices in the payload's order (`frame/questions.md` Q1). The cases feed the shape the frame read, and no `claude` ran | the owner's hand run at the built app with `OWLERY_DEBUG_HOOKS=1`, as Q1 states it |
| The built-app files that load the bundle built from `src/renderer` and import no module phase 1 changed, such as `test/ask-section.test.ts` and `test/decisions-and-questions.test.ts`, run after phase 1's change to the card | the orchestrator's broad gate |
| The full suite and the repository-wide typecheck at phase 1's commit. The typecheck ran over the changed files and what they import, with a config of the crafter's scratch that extends `apps/desktop/tsconfig.json` | the orchestrator's broad gate |

## Not done

The `agent` message's tool name is still read from `payload.tool_name` in `apps/desktop/src/daemon/daemon.ts#agentEvent`, outside `agent-events.ts`. It stood before this work, and moving it changes code the request does not name (`trail/phases/phase-1.md`).
