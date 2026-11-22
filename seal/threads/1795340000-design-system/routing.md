# Routing: 1795340000-design-system

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | docs/130-the-window-has-no-design-system |

Answered 2026-11-22 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over, in this session: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22). The owner asked for this work on 2026-11-22: "디자인 Ui/ux도 신경써, 너무 ai스러운 느낌이나거나 다른제품을 베낀 느낌은 지양해야해. 우리만의 스타일을 좀 추구했으면 좋겠어. 디자인시스템이 구축되어야하려나". The choice of a direction is the owner's taste, so it is the one question this work puts to the owner, after the study and before the build; nothing else waits. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** a Fable framer, the core tier: the study of directions with screenshots, then the design system's frame on the chosen one.
- **Implementation, crafter:** `docs/design.md`, the tokens in `themes.css`, and the screenshot step of a pull request that changes the window.
- **Review, through the review chain:** the system every later change to the window is read against.
- **Automation, yes:** the suite's built-app drive makes the screenshots.
- **Branch:** the pull request merges into `release/v0.0.2` by squash.
