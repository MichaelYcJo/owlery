# Routing: 1795559733-built-app-files-share-one-app

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | test/149-every-built-app-file-starts-its-own-app |

Answered 2026-11-25 by the orchestrator, before the first edit.

## Why this way

On 2026-11-25 the owner answered the opening batch of release 0.0.4: `agentic` for every issue but #134 and #32, whose frames the owner reads before they are built, and short real `claude` role sessions for #191. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue asks for one open app the files reach through the debugging port, a reload per file and a restart of only what changed, which is a design across the suite's helper, the daemon's run folder and the agents' rules.
- **Implementation, crafter:** the build the frame states, with its cases.
- **Review, through the review chain:** every built-app case of the suite runs through what this changes, so a reset that leaks state between files fails cases nobody broke.
- **Automation, yes:** no person's decision is open; the measurement it publishes is taken by the crafter.
- **Branch:** cut from `release/v0.0.4` at `4a005ebf`; the pull request merges into `release/v0.0.4` by squash.
