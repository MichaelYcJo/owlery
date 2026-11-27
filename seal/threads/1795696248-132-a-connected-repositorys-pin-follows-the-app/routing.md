# Routing: 1795696248-132-a-connected-repositorys-pin-follows-the-app

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/132-an-app-update-leaves-a-connected-repositorys-seal-check-pinned |

Answered 2026-11-26 by the orchestrator, before the first edit.

## Why this way

The milestone `release: 0.1.0`, the minimum for Owlery to be published, on Sunday 2026-11-29, names this issue among what a public download needs ("a connected repository's seal check moved with the app (#132)"). The owner asked on 2026-11-26 to readjust the milestone to what 0.1.0 needs ("0.1.0마일스톤에 필요한 이슈들 다시 체크해보고 마일스톤 재조정하자"), and the orchestrator moved this issue there from 0.1.1. The run is agentic under the owner's delegation of the release; every row is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the pin lives in a file Owlery writes into a person's repository (`.github/workflows/owlery-seal.yml`, #40); moving it touches the connection's first-commit flow, the daemon's read of each repository and the repository's line in the window.
- **Implementation, crafter:** the daemon, the window and the workflow template change together.
- **Review, through the review chain:** a pin moved without the person reading the commit, or moved past records the new check refuses, breaks the person's own pull requests.
- **Automation, yes:** the questions foreseen (where the line shows, the commit's words) have defaults the tree gives.
- **Branch:** cut from `release/v0.0.5` at `c35c8271`. The branch took that release in by a merge (`ec72ff39`), and release 0.0.5 then merged into `main` (pull request #303). `release/v0.1.0` was cut from that merge, so the pull request merges into `release/v0.1.0` by squash.
