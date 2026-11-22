# Routing: 1795330500-no-question-holds-the-run

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/119-no-question-holds-an-agentic-run |

Answered 2026-11-22 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over, in this session: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 in the session's question dialog on 2026-11-21. The owner moved #119 into release 0.0.2 on 2026-11-22: "agentic모드일땐 질문으로 인한 holding을 막는게 우리의 아이덴티티". Under these words the orchestrator decides what the tree and the issue leave to it; a question only the owner can answer is posted on the issue and parks this work item alone. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** a Fable framer, by the owner's word on 2026-11-22 ("119s는 fable로 framer진행해"); an Opus framer started first and was stopped before it committed anything. The issue spans the policy documents (the identity), a request's batch of questions across work items, the decisions the orchestrator makes without asking shown in the inbox, and the parking of one work item while the others go on. Its last part meets #41 and #42, which are not built yet; the framer orders the phases so what stands today is built first.
- **Implementation, crafter:** an Opus crafter.
- **Review, through the review chain:** this is the product's identity under `agentic`, and it changes the daemon's protocol and the inbox.
- **Automation, yes:** the daemon's state and the inbox are read by cases.
- **Branch:** the pull request merges into `release/v0.0.2` by squash.
