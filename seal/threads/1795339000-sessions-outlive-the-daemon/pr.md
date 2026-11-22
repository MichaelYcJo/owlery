Closes #36.

Issue #36 asked what a session survives: whether an agent ends with the daemon, and what brings it back after a reboot or an update. This is the study, as the frame of work item `1795339000-sessions-outlive-the-daemon`, and the policy text it settles. It changes no code.

| Done when | What holds now |
|---|---|
| The study weighs the ways to keep a session past its daemon and recommends one | `frame/design.md` and `frame/plan.md` *Alternatives considered*. The recommendation: one daemon, never replaced under a running session; a conversation comes back by its session id after any end of its process; holding the terminals apart from the daemon is not built now and stands in *Open decisions* |
| The recommendation is in the policy documents | `docs/architecture.md` *What a session survives* and the edits to *Overall layout*, *State lives in three places* and *Open decisions*, in English and Korean |
| The work the recommendation needs is tracked | #133 opened in `release: 0.0.3`; the study's reading posted on #61, #55 and #78, which keep their milestones |

**Q5** (whether part of #61 moves before milestone 4) stands at its default: #61 stays whole in `release: 0.0.4`, as `docs/roadmap.md` orders it.

Not verified:

- **Whether a Claude Code pane's process ends when its daemon stops, whether a subagent's hook events carry the pane's `session_id`, and whether Owlery's hooks reach a `claude --bg` session**: the study started no real `claude`. The first real session of #61's work answers them.
- **Whether a daemon started from inside the app's folder keeps working after the updater replaced that folder**: no package exists. #78's work answers it.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
