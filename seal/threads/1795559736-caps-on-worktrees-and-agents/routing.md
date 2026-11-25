# Routing: 1795559736-caps-on-worktrees-and-agents

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes, after the owner reads the frame |
| Branch | feat/32-nothing-caps-how-many-worktrees-and-agents-run |

Answered 2026-11-25 by the orchestrator, before the first edit.

## Why this way

On 2026-11-25 the owner answered the opening batch of release 0.0.4: `agentic` for every issue but #134 and #32, whose frames the owner reads before they are built, and short real `claude` role sessions for #191. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the caps on agents and worktrees, what the daemon reads from the machine and what a person sees and changes, are a design beside #134's queue.
- **Implementation, crafter:** the build the frame states, with its cases.
- **Review, through the review chain:** a cap set wrong either stops a person's work or lets the machine run out of memory or disk.
- **Automation, yes, after the owner reads the frame:** the owner asked to read the frame of the machine's caps before it is built; the build runs without asking once the owner has.
- **Branch:** cut from `release/v0.0.4` at `4a005ebf`; the pull request merges into `release/v0.0.4` by squash.
