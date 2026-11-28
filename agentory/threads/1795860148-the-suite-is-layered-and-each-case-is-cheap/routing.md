# Routing: 1795860148-the-suite-is-layered-and-each-case-is-cheap

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | test/200-the-suite-is-layered-and-each-case-is-cheap |

Answered 2026-11-28 by the orchestrator, before the first edit, under the routing answer `agentic`.

## Why this way

Issue #200 redesigns how the desktop suite is layered and what one whole verification and one CI run cost. The owner's words, 2026-11-28:
- "그다음 #200: 테스트·CI 시간. 본문에 적힌 AgenticSeal 교훈 대응 표, 가이드 완료 조건, CI 항목대로 설계부터 다시 봐. 측정을 먼저 하고, 목표 시간은 frame에서 정해."
- "a하고 문제없으면 0.2.1 릴리즈하고 알아서 0.2.2 까지 진행해서 마무리가능하지?"
- "테스트 속도개선 매우중요한이슈라서..."
- "솔직히 우리 얼마나 많이 만들었다고 파일하나에 391초는 진짜 잘못짠거다"
- "0.2.2도 agentic으로하면된다"
- "falbe로 framer해"

- **Planning: a framer.** The issue asks for a redesign, with layers, one world per file, git's environment, waits, a budget and the runs per work item, and for target times the frame sets. The design is the work, so a framer draws it before any build.
- **Implementation: a crafter**, phase by phase against the frame. Each phase's *Verified by* names the suites that own its changed test files. A case is rewritten, never dropped: each still checks what it checked.
- **Review: the review chain.** **Destination: a pull request.**
- **Automation: yes.** Under `agentic` the run does not stop to ask the person. A question is decided from the code and the policy and recorded.
- **Measurement first.** Before the framer, the orchestrator records one CI run's per-file times (run 46122967493) and one local whole run, timed per file and per case, alone on the machine. The framer reads both.
- **Models:** the framer on Fable, at the owner's word. Every other role on Opus, the default.
- **Branch:** cut from `origin/release/v0.2.2` at `06dddea9`, the merge of release 0.2.1 into `main`.
