Part of #146. The issue closes when `release/v0.0.3` reaches `main`.

- "The check `--post` sends is named `seal`." (`frame/design.md` *Scope*, item 1)
- "The posted title names the owl chain where the record says the owl chain gave the seal." (`frame/design.md` *Scope*, item 2)
- "The workflow's job is named `records`." (`frame/design.md` *Scope*, item 3)
- "This repository's workflow is the one Owlery writes for its own version." (`frame/design.md` *Scope*, item 8)
- "`.github/workflows/hygiene.yml` goes whole." (`frame/design.md` *Scope*, item 9)
- "#181's changelog fragment states what holds once this work is merged." (`frame/design.md` *Scope*, item 17)
- "Requiring the check on this repository." (`frame/design.md` *Scope*, *Out of scope*)

### For the owner

- The job's name `records` is `frame/questions.md` Q1's default, built in phase 2; another name is a one-line change in `records-place.ts#workflowText` and the workflow.
- This pull request is checked by `release/v0.0.3`'s workflow, so its check posts under the earlier name `Owlery seal` this once; from the next pull request on, the check is `seal`. Requiring `seal` on the branch is the owner's step.
- Once this merges, a Claude Code pane of this repository with the AgenticSeal plugin enabled asks once which chain it carries.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
