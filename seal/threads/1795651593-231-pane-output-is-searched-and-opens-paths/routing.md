# Routing: 1795651593-231-pane-output-is-searched-and-opens-paths

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/231-a-panes-past-output-cannot-be-searched-and-its-paths-do-not-open |

Answered 2026-11-26 by the orchestrator, before the first edit.

## Why this way

On 2026-11-26 the owner was told that the other machine's work items of release 0.0.5 cannot be reached until that night, and asked what can be done without them. The orchestrator proposed #218 and #231 under `agentic`, and the owner answered "진행하자" ("let's go"). Every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

The batch asked one question for this item. The issue has the frame check Claude Code's own paste first, and the answer changes what is built. To "the check needs a short real `claude` session in a pane: allow it, or build ⌘V's path paste with no check", the owner chose "짧은 실제 세션 허용" ("allow a short real session"). The option said the session uses the account already signed in, runs no `claude auth`, and writes nothing under `~/.claude`. That is this run's rule on real sessions, and a spawn carries it as stated here.

- **Planning, framer:** the issue leaves the scrollback default and its memory cost per pane, the editor setting and how a path's line reaches the editor, and the image paste's design after the check, to the frame.
- **Implementation, crafter:** four surfaces of the terminal pane (find bar, scrollback setting, ⌘-click to the editor, image paste) and their cases, one built-app case among them.
- **Review, through the review chain:** a find bar and a key that opens files run on every pane, so a defect shows in every work item.
- **Automation, yes:** the one decision a person had to make was asked in the batch above; every other choice has a default the tree or the framer can give.
- **Branch:** cut from `release/v0.0.5` at `9f9ba1da`; the pull request merges into `release/v0.0.5` by squash. The version already moved to 0.0.5, so this work item does not move it.
