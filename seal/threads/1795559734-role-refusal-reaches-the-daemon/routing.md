# Routing: 1795559734-role-refusal-reaches-the-daemon

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | test/191-the-role-refusal-hand-check-fails-without-a-bash-call |

Answered 2026-11-25 by the orchestrator, before the first edit.

## Why this way

On 2026-11-25 the owner answered the opening batch of release 0.0.4: `agentic` for every issue but #134 and #32, whose frames the owner reads before they are built, and short real `claude` role sessions for #191. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the check depends on the model choosing to call Bash, and the frame decides how the refused call is made to reach the daemon.
- **Implementation, crafter:** the build the frame states, with its cases.
- **Review, through the review chain:** a hand check that passes without reaching the daemon says the refusal holds when nothing tested it.
- **Automation, yes:** the one person's decision, real `claude` role sessions for the three runs in a row, was answered in the batch.
- **Branch:** cut from `release/v0.0.4` at `4a005ebf`; the pull request merges into `release/v0.0.4` by squash.
