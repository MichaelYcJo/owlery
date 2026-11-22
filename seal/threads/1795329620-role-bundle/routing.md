# Routing: 1795329620-role-bundle

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/38-the-app-ships-no-role-bundle |

Answered 2026-11-22 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over, in this session: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 in the session's question dialog on 2026-11-21. Under them the orchestrator decides what the tree and the issue leave to it; a question only the owner can answer is posted on the issue and parks this work item alone. On 2026-11-21 the owner put #38, #39, #41, #42 and #43 in the core tier: a Fable framer and a Fable crafter, Opus proofer rounds and an Opus sealer. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open what the bundle holds and in which form, how the daemon builds a role session's arguments, which rules are appended per role and stage, the minimum CLI version and how a run shows a rule only the appended rules state. A framer reads the tree and AgenticSeal's sources.
- **Implementation, crafter:** the work touches the app's packaged files, the daemon's adapter and its startup.
- **Review, through the review chain:** this is the base every role session of milestone 2 runs on.
- **Automation, yes:** the fake adapter launches a role in the suite; one real role session is run only where it costs the owner's usage no more than a trivial call.
- **Branch:** the pull request merges into `release/v0.0.2` by squash, after #26, which the framer may read as unmerged on its branch `fix/26-a-failed-headless-session-says-nothing`.
