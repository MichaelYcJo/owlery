Closes #300, closes #202, closes #258, closes #241.

- "**A pane's process that has ended leaves no pseudo-terminal open in the process that started it.**" (`frame/design.md` *Scope*, item 1)
- "**Two cases pin item 1.**" (`frame/design.md` *Scope*, item 2)
- "**The fetch case of #202 holds what it guards whenever git starts its transport.**" (`frame/design.md` *Scope*, item 3)
- "**The stand-in of #258's case writes its error text before its first line.**" (`frame/design.md` *Scope*, item 5)
- "**The cases of the inbox that compare the whole list of inboxes start their daemon with a hello that waits for the first read of the commits.**" (`frame/design.md` *Scope*, item 6)
- "**#241's last two rows are answered by a run under load.**" (`frame/design.md` *Scope*, item 8)
- "Three passes of the group beside another run are not the measure, because the group failed on the count of pseudo-terminals the machine had left and not on time." (`frame/plan.md` *Technical context*)
- "The pull request's title takes the prefix `test:`, and it closes #300, #202, #258 and #241." (`frame/plan.md` *Judgments of the run*)
- "The frame's patch of `node-pty@1.1.0` through pnpm `patchedDependencies` is built, in release 0.1.0, though it changes a product dependency and the routing named test cases." (`frame/plan.md` *Judgments of the run*)
- "As the first pull request into `release/v0.1.0`, it moves the version to 0.1.0 in `apps/desktop/package.json` and in `.github/workflows/owlery-seal.yml`" (`routing.md` *Why this way*, *Branch*)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
