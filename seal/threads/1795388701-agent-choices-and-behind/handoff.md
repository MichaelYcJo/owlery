# Handoff: 1795388701-agent-choices-and-behind (#27)

Written 2026-11-23 by the orchestrator of the session that framed it, to move the work to a new session that loads AgenticSeal 0.38.5 from its start. The orchestrator that takes the work over reads this file and deletes it in its first commit on this branch.

## Where this work item stands

- `routing.md` at `9fe0c0c` (straight to the pull request) and the frame at `29781fe` (three phases). Both pushed.
- The orchestrator read `frame/design.md` and `frame/plan.md` against the issue's *Done when* and found nothing to send back, so the frame is spawned as committed: no proposal was made and no row is owed for one.
- Next: spawn the crafter for phase 1. This work item merges first in the release.
- `frame/questions.md` holds one measurement (Q1, carried to the owner's hand run) and one question the work answers (Q2); none for a person.

## The release around it

Work items of release 0.0.2 open now, each pushed with its frame committed and read against its issue:

| Issue | Work item | Branch | Worktree |
|---|---|---|---|
| #27 | `1795388701-agent-choices-and-behind` | `feat/27-the-inbox-cannot-say-what-the-agent-asks` | `/Users/michael/Documents/GitHub/owlery-27` |
| #45 | `1795341001-cost-per-stage` | `feat/45-the-daemon-keeps-no-cost-per-stage` | `/Users/michael/Documents/GitHub/owlery-45` |
| #41 | `1795388700-review-rounds` | `feat/41-the-daemon-cannot-run-review-rounds` | `/Users/michael/Documents/GitHub/owlery-41` |
| #46 | `1795342001-progress-through-roles` | `feat/46-a-work-item-view-shows-no-progress-through-roles` | `/Users/michael/Documents/GitHub/owlery-46` |

- **Merge order:** #27, then #45, then #41, then #46. #46's phases 1 and 2 build now; its phase 3 starts after #41 has merged.
- **Not framed yet:** #42, #43 and #44 build on #41 and can be framed against #41's committed frame. #47 reads #45 and #46. #22 reads #44's states. #110, #48 and #49 are the owner's hand run and the release.
- **Models:** Fable for framers and crafters, Opus for proofers and sealers (the owner, 2026-11-21 and 2026-11-23).
- **The run is `agentic` to the release:** the owner's words "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22).
- **Push each commit of the chain as it is made.** On 2026-11-22 a session framed #45 and #46, pushed nothing, and ended; both frames were lost.
- **The plugin version at the pull request:** `.github/workflows/hygiene.yml` pins AgenticSeal `v0.38.4`, and the installed plugin is 0.38.5. Before the first pull request, check that `seal pr-body` of 0.38.5 composes the body the pinned check reads, and where it does not, move the pin in a pull request of its own first.
- **Watch for other sessions' pushes:** the framing session polled GitHub every five minutes for a branch, an open pull request or a move of `release/v0.0.2` that it had not made. That watch ends with the session, so the new session starts its own.
- **Owner's rules for every agent:** no real `claude`; the built app only through `BuiltApp.start` with `OWLERY_BACKGROUND=1`, as few starts as possible; nothing builds or tests in the main clone `/Users/michael/Documents/GitHub/owlery`; nothing reads or writes `~/Library/Application Support/@owlery/desktop/` or changes `~/.claude`; no git command reaches a real remote in a case or a probe; signal only processes you started; merge the release branch into a built branch, never rebase.
- **For the owner's hand run (#48):** #27's `frame/questions.md` Q1, the order of the hook events when a real Claude Code asks with choices.
