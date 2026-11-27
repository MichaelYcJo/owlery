# Routing: 1795781249-328-the-plan-of-the-folder-shows-on-the-runner

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Implementation | crafter |
| Automation | yes |
| Branch | test/328-the-chain-choice-cases-fail-on-the-hosted-runner |

Answered 2026-11-27 by the orchestrator, before the first edit.

## Why this way

Issue #328: four cases of the built app's `apps/desktop/test/chain-choice.test.ts` fail on the hosted runner, the first waiting 15 s for the plan of the folder for "Chosen" and the next three on what it left, and the file passes in the broad gate on the owner's Mac. The `check` job passed on #319's pull request and has failed on this file in every run since #320 (#127) merged: #320's rerun, and both attempts of #327 (run 45991476001). It blocks every pull request into `release/v0.1.0`, #327 and #318 among them, so it runs before them.

- **Planning, no row:** the cause is not yet read. The crafter's first phase diagnoses it and fixes it; where the fix turns out to change `apps/desktop/src` beyond one call, the orchestrator weighs a frame before the next phase.
- **Implementation, crafter.**
- **Review, through the review chain.**
- **Automation, yes.**
- **Branch:** cut from `release/v0.1.0` at `d323b45a` on 2026-11-27; the pull request merges into the release branch by squash, before #327 (#321) and #318, which merge the release in after it lands.
