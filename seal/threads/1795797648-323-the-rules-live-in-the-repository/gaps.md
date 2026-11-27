# Closing memo: the rules of how work runs here live in the repository (#323)

## Scope confirmation

The rules of #323's merged list that no open issue owns and that every session here follows are written: rules 8, 9, 26, 29, 30 and the part of 17 that is no use of the plugin into a new `CLAUDE.md`; rules 21, 23, 27 and the missing part of 28 into `docs/roadmap.md` *Releases and the tracker*; rule 16 into `docs/architecture.md` *Code runs the order, the orchestrator judges*; rules 35 and 36 into `docs/name.md`; each `docs/` change also into its Korean twin.

## Not verified

| Item | Who must answer |
|---|---|
| The suite and the rest of `seal/config.json` `Broad gate` were not run; only its documents leg was run, as its loop and its `git grep` (phase 1) | the orchestrator, at the broad gate |
| Whether an open issue owns one of the written rules in words the keyword search did not meet (phase 1 calls the search a sample) | the proofer, at round 1 |

## Not done

**Rules an open issue owns.** The issue writes each when it lands, as the owner set on 2026-11-28.

- Rules 12 and 13, the models of the roles: #129 owns the product's default model per stage and the recommendation at routing. How this repository's sessions pick models stays in memory, by the owner's word.
- Rules 4 and 5, merging the release branch before the broad gate and running each work item's tail one at a time: #279, which removes the long release branch they are bound to.
- Rule 2, merging only on green: #279's protected release branch and its queue that merges on green replace it (phase 1 gives the grounds).
- Rules 31 and 32, composable workflows and the method the chain follows, homed in `docs/product.md`: #322's `## Rule changes`.
- Rule 33 (the naming rule and the names set aside), the 2026-11-28 part of rule 34 (the role and state names, and why the app keeps the name Owlery) and the missing part of rule 39 (one vocabulary and one records folder with the plugin): #322.

**Rules about using the AgenticSeal plugin itself.** They stay out of this repository, as `routing.md` decided: rule 6 (no work branch merges another work item's branch, for the `Seal-Routing:` trailers), rule 7 (`seal pr-wait` in the pull request's worktree), rule 10 (a `handoff.md` for a run held for another session, which the plugin's `skills/implement/orchestration.md` states), rule 20 (a `seal gate` broad run with no other agent running tests), rule 25 (`pr.md` and the screenshot links before the sealer, checked by `seal pr-body --check`) and the plugin part of rule 17 (the owner's answer line `Answered <date> by the owner: ...` handed to the sealer).

**Rules that stay in memory**, as the merged table placed them: rules 40 to 44. Rule 36 left memory, since the brand criteria now stand in `docs/name.md`.

**Already in the tree, so not written again:** rules 1, 3, 11, 14, 15, 18, 19, 22, 24, 37 and 38.

**Each machine's memory** keeps only what the decision left there; pruning it is the orchestrator's, since no agent writes outside the worktree.
