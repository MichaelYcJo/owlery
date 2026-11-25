Part of #191. The issue closes when `release/v0.0.4` reaches `main`.

- "The pull request's title takes `test:`, and the kind that came closest is `fix:`." (`frame/plan.md` *Judgments of the run*, 2026-11-25)
- "The hand check's session is the real CLI, launched by the daemon as today, with the stand-in model behind it." (`frame/design.md` *Scope*, item 1)
- "The wrapper script points every run of the CLI in the hand check at the stand-in model and at a home of its own, and the daemon gives the session its config folder." (`frame/design.md` *Scope*, item 2)
- "The stand-in model issues the refused call." (`frame/design.md` *Scope*, item 3)
- "The case asserts what the daemon's refusal leaves, in this order." (`frame/design.md` *Scope*, item 4)
- "A failure names its cause." (`frame/design.md` *Scope*, item 5)
- "The two scripts print what the case prints, whoever runs them." (`frame/design.md` *Scope*, item 10)
- "The stand-in model answers what a run showed the CLI asks, and refuses the rest by name." (`frame/design.md` *Scope*, item 11)
- "May the build run `pnpm run role:run` once, to show that the change to the shared helper `launched` left the real session's case working?" (`frame/questions.md` Q1)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
