# Routing: 1795328774-lightness-is-measured-not-capped

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | the session |
| Implementation | crafter |
| Automation | no |
| Branch | docs/121-the-500-mb-of-one-scene-is-stated-as-a-limit |

Answered 2026-11-22 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` for release 0.0.2 on 2026-11-21. The owner's words that hand the run over, in this session: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22). The rule this work item writes is the owner's, given in this session on 2026-11-22: "메모리를 최대한 덜쓰는거지, 아에 500mb로 잡으면 지금부터는 모든기능 추가가 안되는걸텐데", "애초에 그사람 로컬을 기준으로 적당히 조절하는 상한을 지킨다", and "기능개발을 먼저하고 리팩토링으로 효율화하는게 좋은 순서", which #121's body states in English. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, the session:** the issue names each sentence to rewrite and the rule to write, and the owner's words decide the rule; no `frame/` is written.
- **Implementation, crafter:** an Opus crafter, the middle tier the owner set, because the change rewrites sections of `docs/architecture.md`, `docs/product.md` and `docs/roadmap.md` and their Korean editions together.
- **Review, straight to the PR:** the change is to the policy documents alone, and the sealer reads it against the issue and the owner's words.
- **Automation, no:** the documents' checks of the `Broad gate` key read the result; no case runs.
- **Branch:** the pull request merges into `release/v0.0.2` by squash.
