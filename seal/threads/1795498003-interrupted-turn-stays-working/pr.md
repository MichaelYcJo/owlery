Part of #182. The issue closes when `release/v0.0.3` reaches `main`.

- "The daemon reads a Claude Code pane's interruption from the pane's session log." (`frame/design.md` *Scope*, item 2)
- "An interruption is the neutral event `interrupted`, and it leaves the session `waiting`." (`frame/design.md` *Scope*, item 4)
- "A tool's end that arrives after the interruption does not return the session to `working`." (`frame/design.md` *Scope*, item 5)
- "Everything that waits for the session to stop working stops waiting." (`frame/design.md` *Scope*, item 7)
- "A turn that ends in an API error." (`frame/design.md` *Scope*, *Out of scope*)
- "What Claude Code sends and writes when Esc stops a Bash call whose command is running." (`gaps.md` *Not verified*, the second row)
- "Whether Claude Code writes the session log after the hook event of a session's first prompt in every session, and within the 10 seconds the watch waits for it." (`gaps.md` *Not verified*, the third row)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
