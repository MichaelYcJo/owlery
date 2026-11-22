# Routing: 1795278987-built-apps-one-at-a-time

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | the session |
| Implementation | the session |
| Automation | yes |
| Branch | test/118-the-suite-starts-nine-built-apps-at-once |

Answered 2026-11-22 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` for release 0.0.2 on 2026-11-21 and asked that usage be kept down. The orchestrator opened #118 on 2026-11-22 after the broad gate of #26 failed twice on one case that passes alone, and takes it before #26's seal: the same case had turned four broad gates red, a recurrence the plugin's `skills/implement/orchestration.md` gives a prevention home at once (the paragraph opening *A problem that recurs within a run gets a prevention home at once*). Judged against *Under agentic*.

- **Planning and implementation, the session:** the change is the test runner's configuration alone, `apps/desktop/vitest.config.ts`, which this session wrote for #30. It splits the suite into the files that start the built app and the rest, found from each file's import of `buildApp`, so no list of files is kept beside the tree.
- **Review, straight to the PR:** the change moves no code of the app, and two full runs of the suite on the owner's Mac and the `check` run on the runner read what it does. The sealer reads the diff against the issue.
- **Automation, yes:** the suite is the check.
- **Branch:** the pull request merges into `release/v0.0.2` by squash, before #26's, which merges the base after it.
