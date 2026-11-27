# Routing: 1795739977-244-207-runner-cases-wait-on-what-they-read

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | test/244-207-two-built-app-cases-fail-on-the-hosted-runner |

Answered 2026-11-27 by the orchestrator, before the first edit.

## Why this way

Two cases of the built app fail on GitHub's hosted runner and pass on the owner's Mac, and each failure has blocked a sealed pull request until its `check` ran again: #244 (a records dialog left open on the runner fails every later case of the built app's menus; it failed eight cases of `work-item-menu.test.ts` on #301's first run on 2026-11-27) and #207 (the old-CLI notice case of the role bundle, where the reloaded page has not shown the notice within its wait). On 2026-11-27 the owner put both into release 0.1.0 for the same reason as the timed cases (#300): the reruns cost more time than the fix.

- **Planning, framer:** neither failure reproduces on this Mac, so the cause is read from the runner's logs of the failed runs; a fix that makes a case pass by asserting less is the defect to rule out.
- **Implementation, crafter.**
- **Review, through the review chain.**
- **Automation, yes.**
- **Branch:** cut from `release/v0.1.0` at `e7737b7e` on 2026-11-27; the pull request merges into `release/v0.1.0` by squash.
