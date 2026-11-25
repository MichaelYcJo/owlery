Closes #216.

- "**A client message `readLists`, with a `requestId`.**" (`frame/design.md` *Scope*, item 1)
- "**Everything a `readLists` asks for starts after the message arrived.**" (`frame/design.md` *Scope*, item 3)
- "**The answer waits for the reads of the pull requests that the press asked for, up to `listsWaitMs`, 5 s by default, counted from the call of `readOutside`.**" (`frame/design.md` *Scope*, item 4)
- "**A press sends one `readLists`, and the button shows it is working until the answer ends.**" (`frame/design.md` *Scope*, item 6)
- "**A refusal and a missing answer are said in the status line.**" (`frame/design.md` *Scope*, item 7)
- "(a), the head row at rest. Taken under the routing answer Automation yes, with the owner asleep." (`frame/questions.md` Q1)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
