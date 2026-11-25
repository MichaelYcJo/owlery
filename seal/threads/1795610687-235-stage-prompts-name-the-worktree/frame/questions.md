# Questions for the planner: 1795610687-235-stage-prompts-name-the-worktree

The tree answered these judgments the ticket left open. Each points at where its grounds stand.

- Whether a stage prompt names the worktree's absolute path or the chain command refuses a stage in another worktree: `plan.md` *Alternatives considered*, rows A and B.
- What "a pane's environment naming another" worktree means for the case, given that no pane variable names a worktree: `design.md` *Grounding*, the row "What a pane's environment names".
- Whether the paths a prompt lists become absolute too: `plan.md` *Alternatives considered*, row D.
- Whether the two prompts that only the daemon uses change as well: `plan.md` *Alternatives considered*, row E.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Does a pane's subagent whose session stands in another worktree meet a Claude Code permission question when it reads the files of the worktree its prompt names? No probe in this run can answer it. The answer is what a real `claude` pane does under the person's own permission settings, and a real run spends the owner's usage, which this run does not take. | a measurement | `no question`: the work stands as built. `a question`: the read waits on the person, which stops an `Automation` `yes` run until they answer. The rules file and the prompt file already stand outside the session's folder, so the same question would already come for them. The follow-up then is the third item of `design.md` *What the daemon could do beyond the issue*, filed as an issue. | Build the prompt change and add no permission setting. Record Q1 as not verified in the pull request, with the owner's walk (#184) as its answerer. | open |
| Q2 | Does a pane's crafter, given the fix pass's prompt that names the worktree and `git -C` with its path, make and commit its fixes in that worktree, and not in its session's folder? Only a real crafter run shows what the model does with the sentence, and this run takes none. | a measurement | `yes`: the work stands. `no`: the crafter's commits land on the pane's branch, and `fix-pass` refuses the close blocks, since their commits are not on the work item's branch (`stage-records.ts#recordFixPass`). The fix is then the prompt's wording, in a later work item. | Build the sentence as `design.md` *Scope* item 3 states it. Record Q2 as not verified, with the owner's walk (#184) as its answerer. | open |
