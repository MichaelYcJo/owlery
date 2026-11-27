Closes #296.

- "A command, `.github/scripts/rerun-unstarted.mjs`, that reads one completed run attempt and asks GitHub to rerun each never-started job of it, and no other job." (`frame/design.md` *Scope*, item 1)
- "The command asks for no rerun where the attempt's number is 5 or more." (`frame/design.md` *Scope*, item 2)
- "The command asks for no rerun of a run whose head repository is not this repository, whatever its event, nor of a `pull_request` run whose branch has moved off the run's commit." (`frame/design.md` *Scope*, item 3)
- "A workflow, `.github/workflows/rerun-unstarted.yml`, that runs the command when a run of `check` or of `package` completes with a conclusion other than `success`." (`frame/design.md` *Scope*, item 4)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
