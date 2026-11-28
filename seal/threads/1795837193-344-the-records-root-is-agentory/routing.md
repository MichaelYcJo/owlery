# Routing: 1795837193-344-the-records-root-is-agentory

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/344-the-records-root-is-agentory |

Answered 2026-11-28 by the orchestrator, before the first edit.

## Why this way

Issue #344 renames what #322 named for the method. The product's records root `iadd/` becomes `agentory/`, its marker becomes `# What IADD keeps in agentory/`, and the plugin's command the product names becomes `agentic`. The owner set these names on 2026-11-28 ("응 그렇게하자", then "올리고 진행해"). The routing answer `agentic` stays, as the owner said ("delegated말고 우리도 원본그대로쓰자") and AgenticSeal#1658 keeps it.

- **Planning, a framer.** The concept does not change. The risk is the names that scripts read letter by letter: the root's discovery and the marker, which can fail quietly as "no work item"; the migration's target and the workflow it writes; the pull request check's root; and page-evaluated strings in the cases, which `tsc` does not read. #322's rename found its leftovers one batch at a time across rounds 1, 2 and 5. So the framer's main product is the census. It follows AgenticSeal#1659 point 1 by hand: `frame/keep.txt` lists each hit of `iadd` the design keeps, as `git grep` prints it without a line number, each with its reason in `frame/design.md`. The acceptance is `git grep -i -P 'iadd' -- . ':!<this work item>'`, which prints no line numbers, diffed against `keep.txt`; it prints nothing when the work is done.
- **Implementation, a crafter.** Per AgenticSeal#1659 point 2, each plan row's *Verified by* names the command of every suite that owns a changed test file, the built-app suite (`OWLERY_BACKGROUND=1 pnpm run test:app`) included. The crafter runs them at each phase boundary, before a round.
- **One work item, not split.** The root, the marker and the command are name families of one rename. AgenticSeal#1659 point 3 keeps those as phases of one item.
- **Models:** every role on Opus, the default the owner set (owlery#129 owns the product side).
- **Order:** #322 merged into the release branch on 2026-11-28 (#345). This item renames before the tag `v0.2.0`, so no connected repository ever migrates to `iadd/`. This repository's own records stay under `seal/` in the plugin's forms until the plugin ships `agentory/` (AgenticSeal#1658), as #322's *When it lands* step 4 states, whose home is #324's body.
- **Branch:** cut from `origin/release/v0.2.0` at `7413b3f0`, read on 2026-11-28 after #345 merged.
