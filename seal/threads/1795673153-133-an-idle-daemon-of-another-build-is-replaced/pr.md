Closes #133.

- "**An idle daemon of another build is replaced at the load.**" (`frame/design.md` *Scope*, item 1)
- "**A daemon that runs something, or whose lists cannot be read, is kept.**" (`frame/design.md` *Scope*, item 2)
- "**An app replaces a daemon of one build once while the app runs.**" (`frame/design.md` *Scope*, item 3)
- "**The daemon answers a request whose type it does not know.**" (`frame/design.md` *Scope*, item 5)
- "**Against a daemon whose `ready` holds no `answersUnknown`, the window ends each request but a creation that has no answer after 10 seconds.**" (`frame/design.md` *Scope*, item 8)
- "**The daemon writes one line when it stops.**" (`frame/design.md` *Scope*, item 9)
- "**A daemon that starts on the `daemon.json` of a daemon that no longer answers writes one line.**" (`frame/design.md` *Scope*, item 11)
- "The pull request's title takes the prefix `feat:`." (`frame/plan.md` *Judgments of the run*)
- "A stop that fails counts as this run's replacement of that build" (`frame/plan.md` *Judgments of the run*)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
