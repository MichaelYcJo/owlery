# Questions for the planner: a Claude Code pane that continues the worktree's latest conversation (#94)

Judgments the issue left open that the tree answered. Nobody reopens them here:

- How the continuing pane is declared, as a feature of the kind `claude` and not as a kind of its own: `frame/plan.md` *Alternatives considered*, rows A and B.
- How the pane keeps Owlery's hooks and settings: `frame/design.md` *Grounding*, the row on `claudePaneCommand` and `commandFor`.
- Whether the "New work item" form offers the choice: `frame/design.md` *Grounding*, the row on `view.ts` and the form's menu of kinds.
- Whether Owlery reads `~/.claude/projects/` to find the conversation: `frame/design.md` *Grounding*, the row on the session log.
- Where Claude Code keeps a working directory's conversations, and what the print mode's `--continue` reads: `frame/design.md` *Grounding*, the two rows on the probe.
- The words on the button: `frame/design.md` *Scope* item 5. Other words change no structure, so they are written down as an assumption and asked of nobody.

No row below is a person's. Each is a measurement that the framer could not take: it needs a logged-in Claude Code and a real conversation, and the framer's probe ran with a config folder of its own so that nothing of the owner's `~/.claude/` was touched, which left the CLI not logged in. Phase 1 of `frame/plan.md` takes all of them.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | In a temporary repository with two linked worktrees, each holding a real conversation, does an interactive `claude --continue` run in one worktree open that worktree's latest conversation and not the other's? | a measurement | It does: the design stands. It opens the other's, or one list for the whole repository: `--continue` cannot carry this item, and the finding goes to the framer before phase 2. | It does. The help of 2.1.329 says "in the current directory", and the print mode did so with a planted conversation. | open |
| Q2 | What does an interactive `claude --continue` show, and how does it end, in a worktree where no conversation was held? | a measurement | It prints a line that says so and ends: *Scope* item 6 builds nothing, and the line and the exit code are quoted in `trail/phases/phase-1.md`. It starts a new conversation without saying so, or ends with no line: the finding goes to the framer before phase 2, with `frame/plan.md` *Alternatives considered* row F. | It prints a line and ends. The print mode did not: it started a new session without a line. | open |
| Q3 | Where a `claude -p` session ran in the worktree after the person's conversation, as "Ask" runs one, does an interactive `claude --continue` open the `-p` session? | a measurement | It does: *Scope* item 7 is built, and `claudeArgs` gains `--no-session-persistence`. It does not: item 7 builds nothing. | Item 7 is not built until this is measured. | open |
| Q4 | Do the hooks of `--settings <file>` arrive from a session started with `--continue`, `SessionStart` among them, and what does its `source` field hold? | a measurement | They arrive: scenario 7 of `frame/design.md` holds for a real session. They do not: the inbox cannot show the session's state, and the finding goes to the framer before phase 2. | They arrive. `docs/architecture.md` *The phone: the terminal session as a chat* records them arriving from a session started with `--settings` on 2026-11-18. | open |
