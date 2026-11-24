# Routing: 1795400734-accounts-per-repository

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/160-every-session-runs-under-one-login |

Answered 2026-11-23 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3). On 2026-11-23 the owner filed the need ("어떤 ai든 멀티로그인은 꼭 필요한 기능"), asked for one default account, another account set for a project's sessions, and a running session's account changed, put the issue in release 0.0.3, and asked what could run in parallel with release 0.0.2. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open how an account is added and stored without Owlery holding a token, how the nearest setting is found among repository, work item and session, which parts of Claude Code's config folder belong to the account and which to the person, how a running session changes account, and the two open decisions the issue names. It is framed now, while release 0.0.2 builds, and framed against `release/v0.0.2` as it stands; the build waits for release 0.0.2 to ship.
- **Implementation, crafter:** the daemon's launch environment, the adapters, the accounts store and the window's controls.
- **Review, through the review chain:** a wrong account spends another subscription's limit and is not visible until the bill or the limit says so.
- **Automation, yes:** the cases launch role sessions under two accounts through the fake adapter and read the config folder each was given; no case signs in or starts a real `claude`.
- **Branch:** cut from `release/v0.0.2` at `629bfec`, and `release/v0.0.3` merged into it at `919bb6a` on 2026-11-24 once release 0.0.2 was in main, and again at `f0b7e36` on 2026-11-24 once #181 was merged into it; the pull request merges into `release/v0.0.3` by squash.
