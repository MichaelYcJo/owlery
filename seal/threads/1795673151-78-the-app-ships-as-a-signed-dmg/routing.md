# Routing: 1795673151-78-the-app-ships-as-a-signed-dmg

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | chore/78-the-macos-app-is-not-signed-or-notarized-and-has-no-dmg |

Answered 2026-11-26 by the orchestrator, before the first edit.

## Why this way

On 2026-11-26 the owner set the first public release, 0.1.0, for 2026-11-28: a Mac download from the site, to run Owlery publicly from 2026-11-29. The owner moved the walk release, which was 0.0.5, into 0.1.0, and asked to start the launch's remaining work in parallel the same evening ("지금 병렬로 하면 어때"). The milestones were renumbered that evening: `release: 0.1.0` holds the launch, and milestones 3 to 5 follow as 0.1.2 to 0.1.5. Every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*. No real `claude` session runs in this work item unless its frame names one in `frame/questions.md` with a default.

- **Planning, framer:** the issue leaves the packager, the workflow's trigger and its secrets, and how a build without the certificate behaves, to the frame. The owner cut the scope on 2026-11-26: the update from GitHub Releases moved to #266, and the owner has no Developer ID certificate yet, so the build signs and notarizes only where the certificate's secrets are present and otherwise makes an unsigned `.dmg` (#78's comment of 2026-11-26).
- **Implementation, crafter:** a packaging step for the desktop app, a workflow on a tag that attaches the `.dmg` to the release, and the cases or the recorded run that show the `.dmg` opens on this Mac.
- **Review, through the review chain:** the `.dmg` is what every person downloading Owlery runs first.
- **Automation, yes:** the owner answered the launch's scope in conversation; every other choice has a default the tree or the framer can give.
- **Branch:** cut from `release/v0.0.5` at `e9fe914c`, the branch of release 0.1.0, whose name stays until the release's own step; the pull request merges into it by squash. The version moves to 0.1.0 in the release's own work item, not here.
