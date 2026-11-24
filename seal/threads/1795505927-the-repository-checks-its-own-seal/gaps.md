# Closing memo: 1795505927-the-repository-checks-its-own-seal

## Not verified

| Item | Who must answer |
|---|---|
| Phase 1: the test files outside the phase's narrow run, which held `test/records-place.test.ts` and `test/pr-check.test.ts`. The phase changes no source file and adds two cases and a workflow, so no other file's cases should change result, and none reads `.github/workflows/owlery-seal.yml` (`trail/phases/phase-1.md`, *The phase's narrow run*). The app's whole typecheck was not run either: the two changed test files were typechecked alone | the orchestrator's broad gate |
| Phase 1: that GitHub runs `.github/workflows/owlery-seal.yml` on this work item's pull request, fetches the check from `release/v0.0.3`, passes this work item's records and posts the check (`frame/design.md` scenario 11, `frame/questions.md` Q2). No subagent opens a pull request | the orchestrator, with `gh pr checks` once the pull request is ready |
| closed phase 1: that the merge of `release/v0.0.3` with #181 meets no conflict in `apps/desktop/test/pr-check.test.ts`, the one file both change. Read at `2cb06da` of #181's branch, the hunks do not overlap. No merge was run | executed: the merge `e12871f` met no conflict, in that file or in `records-place.test.ts`, which both sides also changed (`trail/phases/merge-release.md`) |
| The merge `e12871f`: every test file outside the run of `trail/phases/merge-release.md` *What ran*, and the app's whole typecheck. The merge brought #181's changes to the daemon, the renderer, the role bundle and their cases, which #181's own broad gate passed at `66b3991`. The merge put them beside phase 1's workflow, the removal of `hygiene.yml` and two cases. A merge is the broad gate's (the plugin's `skills/verify/SKILL.md`, the row of a merge), and the spawn narrowed this pass's run to the files it named | the orchestrator's broad gate |

## Not done

Phase 1 left `pr-check/skills/code-review/scripts/chain_check.py:5` as it stands, though it names `.github/workflows/hygiene.yml`, which this phase removed. `frame/plan.md` puts that sentence in phase 2 (*Scope* item 6), which is built on the branch after #181's merge, since #181 also changes `chain_check.py`.

The merge pass left two sentences of #181's changelog fragment, `seal/threads/1795497826-pane-carries-the-chain/changelog.md`, as they stand: "the check `Owlery seal`" in its second bullet, and "Owlery's own repository is not on the owl chain until #146 lands" in "What this release does not cover". This work makes both untrue, and `docs/roadmap.md` *Releases and the tracker* has this work item's pull request rewrite them. The frame names no phase for them, and the pass writes no fragment of another work item, so the frame's fold places them (`trail/phases/merge-release.md`).

Phase 1 left the opening comment of `.github/workflows/owlery-seal.yml` as `workflowText` writes it. Lines 6 to 8 say that Owlery wrote the file at a connection and that a person moves its line, and neither holds for this repository's file. The file has to be the function's bytes (*Scope* item 8), so the comment changes only through `workflowText`, which phase 2 rewrites for *Scope* item 3.
