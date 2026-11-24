# Routing: 1795505927-the-repository-checks-its-own-seal

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | chore/146-this-repositorys-pull-requests-are-checked-by-the-plugin |

Answered 2026-11-24 by the orchestrator, before the first edit.

## Why this way

On 2026-11-24 the owner answered question 1 with `agentic` for every issue of release 0.0.3, and the same day decided the check's name (`seal`) and that the owl chain is apart from AgenticSeal's (folded into the body of #146). Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open which records of this repository the owned check still reads, what `hygiene.yml` still answers that the owned check does not, and in which order the switch lands beside #181, which removes the daemon's chain and moves the owl chain into a pane; and it changes `docs/architecture.md` *Compatibility with AgenticSeal* in both editions.
- **Implementation, crafter:** the check's rename across the daemon, `pr-check/`, the workflow, the cases and the documents, the workflow's switch, and the owned check's reading of earlier records.
- **Review, through the review chain:** a check that refuses a sealed pull request, or passes one with no seal, misleads every person who reads the pull request without the app.
- **Automation, yes:** the owner decided the name and the separation; every other question has a default the tree or the framer can give; the switch is a workflow file in this repository and touches no setting outside it.
- **Branch:** cut from `release/v0.0.3` at 18f9158; the pull request merges into `release/v0.0.3` by squash.
