# Routing: 1795268298-desktop-suite-in-ci

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | the session |
| Implementation | crafter |
| Automation | yes |
| Branch | test/30-no-workflow-runs-the-desktop-suite |

Answered 2026-11-21 by the orchestrator, before the first edit.

## Why this way

On 2026-11-21 the owner answered the routing question `agentic` for release 0.0.2, put #28, #29 and #30 in the small tier (the session frames, a Sonnet crafter, an Opus sealer), and asked that usage be kept down. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, the session:** the issue's two *Done when* lines say what to build, one workflow that runs `pnpm -r run check`, and the tree answers the rest: the scripts in `apps/desktop/package.json` and the pnpm version in the root `package.json`. No frame is written.
- **Implementation, the session:** the change is one workflow file and the version move this release's first pull request carries, which is less than a crafter's spawn costs. The session writing it costs less than the Sonnet crafter the tier names.
- **Implementation raised to a crafter, 2026-11-21:** the workflow's first run on GitHub's `macos-26-arm64` runner (draft #115) failed 15 cases of `test/terminal-basics.test.ts` and 3 of `test/work-item-menu.test.ts` that pass on the owner's Mac. Making the suite hold on that runner is a finding-out across the built app's cases and several runs, more than the session should hold beside the release. An Opus crafter takes it, the middle tier the owner set for work of this size.
- **Review, straight to the PR:** the workflow's first run on this pull request is the reading of what it does, and the sealer reads the diff against the issue.
- **Automation, yes:** the workflow runs on the pull request that adds it.
- **Branch:** the pull request merges into `release/v0.0.2` (`docs/roadmap.md` *Releases and the tracker*), by squash.
