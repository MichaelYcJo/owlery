# Routing: 1795339001-worktree-setup

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/97-a-new-worktree-has-no-ignored-files |

Answered 2026-11-22 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over, in this session: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 in the session's question dialog on 2026-11-21. Under them the orchestrator decides from the code and the policy what the tree and the issue leave to it, and records each decision; nothing waits for the owner. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

On 2026-11-21 the owner put #97 in the middle tier: an Opus framer, an Opus crafter, an Opus sealer.
- **Planning, framer:** the issue leaves open where a repository names the files to copy and the setup command (Orca's `.worktreeinclude` weighed), and how the command's pane and result reach the inbox.
- **Implementation, crafter:** the daemon's worktree creation, the setup pane, the inbox line.
- **Review, through the review chain:** the command runs code from the repository in a new worktree on the person's machine.
- **Automation, yes:** a case creates a worktree from a temporary repository with ignored files and a setup command.
- **Branch:** the pull request merges into `release/v0.0.2` by squash.
