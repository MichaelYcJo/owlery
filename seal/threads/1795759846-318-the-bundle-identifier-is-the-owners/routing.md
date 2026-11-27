# Routing: 1795759846-318-the-bundle-identifier-is-the-owners

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Implementation | the session |
| Automation | yes |
| Branch | chore/318-the-app-ships-with-the-bundle-identifier-kept-as-a-default |

Answered 2026-11-27 by the orchestrator, before the first edit.

## Why this way

On 2026-11-27 the owner named `com.akmaios.owlery` as the macOS bundle identifier ("그렇게하자"), in place of `app.owlery.desktop`, which the packaging work of #78 kept as the default of its question Q1. macOS ties a person's granted permissions, the Keychain's access lists and the update of #266 to the value, so it is set before the release's first public download.

- **Planning, no row:** the change is one value of the packager's configuration and the test that pins it, which the ladder of `skills/implement/orchestration.md` *Orchestrator: when a work item is required* places on its last rung, a config value, which asks for no frame. The closing memo is kept for its `Not verified` row, the check of the bundle the tag's build makes.
- **Implementation, the session:** the same two lines.
- **Review, through the review chain:** a round reads that no other place of the tree names the old value.
- **Automation, yes.**
- **Branch:** cut from the release branch on 2026-11-27, after the merge of #316; the pull request merges into the release branch by squash, after the work items of #244 and #207 and of #127.
