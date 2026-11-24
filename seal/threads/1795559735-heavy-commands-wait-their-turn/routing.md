# Routing: 1795559735-heavy-commands-wait-their-turn

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes, after the owner reads the frame |
| Branch | feat/134-work-items-start-their-heavy-checks-at-once |

Answered 2026-11-25 by the orchestrator, before the first edit.

## Why this way

On 2026-11-25 the owner answered the opening batch of release 0.0.4: `agentic` for every issue but #134 and #32, whose frames the owner reads before they are built, and short real `claude` role sessions for #191. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the daemon's queue of heavy commands across work items and repositories, its default from the machine and what a person sees, is a design the issue leaves open.
- **Implementation, crafter:** the build the frame states, with its cases.
- **Review, through the review chain:** a queue that orders work wrong stalls the work item one step from its seal, and the load it governs is what failed timed cases in releases 0.0.2 and 0.0.3.
- **Automation, yes, after the owner reads the frame:** the owner asked to read the frame of the machine's caps before it is built; the build runs without asking once the owner has.
- **Branch:** cut from `release/v0.0.4` at `4a005ebf`; the pull request merges into `release/v0.0.4` by squash.
