# Routing: 1795498003-interrupted-turn-stays-working

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/182-an-interrupted-turn-leaves-its-session-working |

Answered 2026-11-24 by the orchestrator, before the first edit.

## Why this way

On 2026-11-24 the owner answered question 1 with `agentic` for every issue of release 0.0.3, and allowed one short real `claude` session for the recording the issue asks for. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue names the coordinate (`src/daemon/agent-state.ts#agentStateAfter`) but leaves open what signal of Claude Code marks an interrupted turn, which only the recording settles, and how the state moves where no signal comes.
- **Implementation, crafter:** the recording, the state's reading in the daemon, and the cases.
- **Review, through the review chain:** a state read wrong shows a person "Working" for a session that waits for them, and the inbox is what a person acts on.
- **Automation, yes:** the one person's decision the issue needed, the real session for the recording, was answered in the batch.
- **Branch:** cut from `release/v0.0.3` at `c82c611`; the pull request merges into `release/v0.0.3` by squash.
