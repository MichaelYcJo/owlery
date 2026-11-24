# Merge of release/v0.0.3: 1795505927-the-repository-checks-its-own-seal

## What this phase found

**The frame held for the merge, and phase 1 needed no port.** `git merge origin/release/v0.0.3` at `0a76e10` merged every file by itself, and the two cases phase 1 added pass at the merged tree as they stand. What the merged tree contradicts in the frame is under *What the frame says that the merged tree does not* below.

### The merge

**`release/v0.0.3` at `66b3991` is merged at `e12871f`, with no rebase.** It brought #181, merged as pull request #194: a Claude Code pane carries the owl chain, the "Get a seal" button and the client message `getSeal` are gone, and the documents in both editions state the owl chain.

**Both sides changed two files, and git merged each by itself.** Executed: `git diff --name-only` of each side against the merge base `18f9158` names `apps/desktop/test/pr-check.test.ts` and `apps/desktop/test/records-place.test.ts` on both sides, and no other file. In `pr-check.test.ts` phase 1 added the case of the plugin's form and the parameters of the helper `routing`, and #181 ported three calls of `getSeal` to `startChain`, added an import and a case of a pane's seal, and reworded the case of a verdict that is not sealed. In `records-place.test.ts` phase 1 added the case that holds this repository's workflow, and #181 added an import and the case of `onOwlChain`. No hunk of one side meets a hunk of the other.

### Why nothing was ported

- **This repository's workflow is still `workflowText`'s bytes.** #181 changed `apps/desktop/src/daemon/records-place.ts` in two places: `PLUGIN_CHECK` is exported, and `onOwlChain` is added. `workflowText` is not changed (read: `git diff 18f9158 66b3991 -- apps/desktop/src/daemon/records-place.ts`). `apps/desktop/package.json` still gives the version `0.0.3` (read).
- **The guards of the plugin's form are not changed.** #181 changed one hunk of `pr-check/skills/code-review/scripts/chain_check.py`, the refusal's sentence in `#guarantee` (read). The frame arm's comparison of the framer's mark and `pr-check/lib/fields.py#COMMIT`, which phase 1's mutation runs broke, are as phase 1 left them (read: `git diff 18f9158 66b3991 -- pr-check/`).
- **Both cases pass at `e12871f`** (*What ran* below).

No case was ported, so no ported guard had a red to show. The two cases and the guards they hold were not seen red again, since neither the cases nor their guards changed. Judged against the plugin's `skills/core/SKILL.md` *The rule a mechanism is kept against*: "A thing is re-checked only when the diff or CI shows it changed."

### What the merge brings that meets this work

**This repository is on the owl chain from the merge on.** #181's `records-place.ts#onOwlChain` reads a folder as on the owl chain where `.github/workflows/owlery-seal.yml` stands in it, and phase 1 committed that file. By `pane-chain.ts#carriedIn` (read), a Claude Code pane that opens in a worktree of this branch carries the owl chain where the person's Claude Code does not enable the AgenticSeal plugin there. Where it does, the pane carries nothing of the bundle until the person chooses the owl chain for the repository. The window asks that choice by the main checkout, so it asks nothing for this repository until this branch merges. That is what `frame/plan.md` *Overlap with the release* says follows once both are merged.

**The merged tree holds the earlier name in lines the frame's list does not name.** Executed at `e12871f`: `git grep -n -w -c -e 'Owlery seal' HEAD -- . ':!seal/threads'` names 25 files. Against the list of `frame/design.md` *Removes* row 2, `get-a-seal.test.ts` is gone, `chain-command.test.ts:83` is the line the row names, and these lines stand in files the row does not name:

- `apps/desktop/test/chain-choice.test.ts:70`, `apps/desktop/test/pane-chain.test.ts:81` and `:91`, `apps/desktop/test/role-bundle.test.ts:378`, and `apps/desktop/test/screenshots.test.ts:515`. Each writes a stand-in for Owlery's workflow whose first line is `name: Owlery seal`. The workflow `workflowText` writes is named `seal`.
- `docs/roadmap.md:85` and `docs/roadmap.ko.md:85`, the row of *Milestones* done criteria on a seal for every pull request: "the AgenticSeal plugin's until issue #146 lands, and the owl chain's, the check `Owlery seal`, after it".

`apps/desktop/test/screenshots.test.ts:182` is the list of checks *Scope* item 7 names. It reads `["seal", "Owlery seal"]` at `e12871f`.

**#181's changelog fragment holds two sentences this work makes untrue.** `seal/threads/1795497826-pane-carries-the-chain/changelog.md`, the second bullet, says "The window and the check `Owlery seal` read a seal from a pane as they read any other". The bullet "What this release does not cover" says "Owlery's own repository is not on the owl chain until #146 lands". `docs/roadmap.md` *Releases and the tracker* has a work item that makes a bullet of an earlier fragment of the same release untrue rewrite it in its own pull request (read). The frame names no phase for either sentence, and this pass writes no fragment of another work item.

### What ran

**The run is the set the spawn named: the two files phase 1 changed, and each test file that reads `CHECK_NAME` or the workflow.** No test file reads `CHECK_NAME`. `pr-check.test.ts` reads it through the check's output. The files that name `workflowText` or `owlery-seal.yml` are `chain-choice.test.ts`, `daemon.test.ts`, `pane-chain.test.ts`, `pane-session.test.ts`, `records-dialog.test.ts`, `records-place.test.ts`, `role-bundle.test.ts`, `screenshots.test.ts` and `view.test.ts` (executed: `git grep -l` under `apps/desktop/test`). Of them only the case phase 1 added in `records-place.test.ts` reads this repository's own workflow. The others write a workflow into a temporary repository (read). Every run was in `apps/desktop` at `e12871f`, through `pnpm test`, with `OWLERY_BACKGROUND=1`.

| Files | Result |
|---|---|
| `records-place.test.ts` and `pr-check.test.ts`, in one command | 54 passed (executed). Phase 1's run had 52, and #181 added one case to each file |
| `daemon.test.ts`, `pane-chain.test.ts` and `view.test.ts`, in one command | 783 passed, 67 failed, all in `daemon.test.ts` (executed). Each failure is `posix_spawnp failed.` from `node-pty` at a pane's start, `pty.ts:84` |
| `daemon.test.ts` again, alone | 288 passed, 54 failed, with the same error (executed) |
| `daemon.test.ts` a third time, alone, once no other session's `vitest` ran | 342 passed (executed) |
| `chain-choice.test.ts`, `records-dialog.test.ts`, `role-bundle.test.ts` and `screenshots.test.ts`, which start the built app, one command each | 5, 1, 18, and 7 passed with 1 skipped (executed) |

**The failures of `daemon.test.ts` came from another session's run, and not from the merge.** During the first two runs another session ran `daemon.test.ts` of its own worktree, `owlery-160` (executed: `pgrep -fl vitest`). Four of the failing cases, run alone with `-t`, passed (executed). The third run started after that session's `vitest` had ended, and it passed whole. Read: `git diff --stat 66b3991 e12871f -- apps pr-check .github` names `.github/workflows/`, `pr-check.test.ts` and `records-place.test.ts` alone. So `daemon.test.ts` and every module it imports are the bytes #181's head holds.

`pane-session.test.ts` was not run. Its one `describe` starts a real `claude` under `OWLERY_PANE_RUN=1` and is skipped otherwise. The two merged test files were typechecked with the app's compiler options through a `tsconfig.json` in this pass's scratch directory that includes them alone: exit 0 (executed). No real `claude` was started. The suite, the whole typecheck and the document counts are the orchestrator's broad gate (`gaps.md` *Not verified*).

**Scenario 5.** At `e12871f`, `git ls-files .github/workflows` prints `check.yml` and `owlery-seal.yml` (executed), so the merge brought no `hygiene.yml` back.

### What the frame says that the merged tree does not

No line of the frame is the crafter's to write but its Status cell, so each of these is named for the fold.

- `frame/plan.md` *Overlap with the release*, the paragraph "This side ports everything": "Once #181's pull request is merged, the party that builds phase 2 merges `release/v0.0.3` into this branch before it edits a line." That merge is `e12871f`, made before phase 2. The same paragraph's last sentence says that the merge "meets one file both changed, `pr-check.test.ts`". It met two, with `records-place.test.ts`.
- `frame/plan.md` *Phases* row 2, *Delivers*: "the party that builds it merges `release/v0.0.3` first". The merge is done.
- `frame/plan.md` *Overlap with the release*, the row of #181: its frame "read at `fec88dc`, in its phase 3", and "The documents, in #181's phase 6, not built at `fec88dc`". #181 is merged at `66b3991` with its documents written.
- `frame/design.md` *Removes* row 2: its list of files omits `chain-choice.test.ts`, `pane-chain.test.ts` and `role-bundle.test.ts` under `apps/desktop/test/`, and `docs/roadmap.md` with its Korean edition. *Scope* items 7 and 15 name no line of them. Scenario 9's search prints each until a phase renames it.
- `frame/design.md` scenario 7, *Verifiable how*: it names `pull-request.test.ts` and `chain.test.ts`. #181's `chain-command.test.ts:83` also pins the heading. Its `chain-command.ts#body` writes the section through `github.ts#sealSection` (read), so *Scope* item 4's one change reaches both writers.
- `frame/questions.md` Q3, the question: "#181 rewrites both in its phase 6, which was not built". The merged tree answers which words the two sections hold. `docs/product.md` *The seal* item 2 keeps "the check `Owlery seal`" inside sentences #181 reworded. `docs/roadmap.md` *Why this order* ground 4 now says from which pull request the owl chain seals this repository's pull requests, and which seal the ones before it carry. Its last sentence is "Issue #146 moves this repository's PR check from the plugin's to Owlery's", and one before it says that the pull requests of release 0.0.3 before #176, #146's among them, carry the plugin's seal because "this repository's check is the plugin's until #146 lands". The row's `Who can answer` is the work, phase 3.
- #181's changelog fragment, the two sentences above: no phase of the plan rewrites them.
