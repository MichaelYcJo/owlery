# Routing: 1795130485-new-work-item-form

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/85-the-new-work-item-form-requires-a-title |

Answered 2026-11-20 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` on 2026-11-19 for the release's remaining issues, put this issue into release 0.0.1 on 2026-11-20 ("0.0.1"), and chose Fable for the framers and crafters and Opus for the proofers and sealers. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the form decides a work item's branch, its worktree's folder and the branch it starts from. Reading a repository's default branch, and naming a work item nobody named, are choices the tree does not yet answer.
- **Automation, yes:** the form is driven through the debugging port of an app started under `OWLERY_BACKGROUND=1`, against a temporary repository.
- **Implementation, crafter:** the owner's choice of Fable.
- **Review, review chain:** the work changes the shipped window's form and the branches Owlery creates in a person's repository, which #9's run showed is worth a proofer round per phase before the sealer.
- **Branch:** the pull request merges into `release/v0.0.1` (`docs/roadmap.md` *Releases and the tracker*).
