# Routing: 1795010335-terminal-pane

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Implementation | the session |
| Automation | no |
| Branch | feat/3-the-app-has-no-terminal-pane |

Answered 2026-11-18 by the owner, before the first edit.

## Why this way

The owner accepted the orchestrator's proposal on 2026-11-18, after judging the previous work item's run too heavy for what it produced: this session writes the code, no review round runs, and the sealer reads the diff against issue #3 before the pull request opens.

- **No frame:** issue #3 fixes the change at its coordinate (one window, one terminal pane, the Korean input check), and `docs/roadmap.md` milestone 1 and `docs/architecture.md` already hold the design it builds to.
- **Implementation, the session:** the diff is the first package of the repository, small enough for the orchestrator to hold.
- **Review, straight to the PR:** the sealer's single reading of the diff against the issue is the reader independent of the build.
- **Automation, no:** a person has to type Korean into the pane, which no session can do.
