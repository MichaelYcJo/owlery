# Second merge of the release: 1795400734-accounts-per-repository

## What this phase found

**The merge.** `origin/release/v0.0.3` was merged into this branch at `c9ccb11`, after the framer's fold of phase 3 (`e9190f7`) and before phase 4. The release had moved by one commit since `66b3991`: `c409dbb`, the squash of #146's pull request #195. No rebase was made. Executed.

**No file conflicted.** Eight files were changed on both sides since `66b3991`, as `frame/plan.md` *Overlap with the release* counts them: `renderer/view.ts` and the cases `chain-choice`, `chain`, `daemon`, `pane-chain`, `role-bundle`, `screenshots` and `view`. #146's hunks in them rename the check `Owlery seal` to `seal`, the workflow's job to `records`, and the pull request body's section to `## Seal`. Those hunks stand in the code of the pull request, the records place and the chain, and no hunk of this work's phases touches the same lines. Git merged each file on its own. `git show --remerge-diff c9ccb11` prints no hunk, so the merge commit holds both sides as each wrote them. Read.

Both sides hold in the merged tree:

- `git grep 'Owlery seal' -- apps .github` finds nothing, so #146's renames stand. Read.
- The accounts cases of phases 1 to 3 in the same files pass, below. Executed.

**One fault of phase 2 surfaced in the typecheck, and was fixed at `f472f77`.** `tsc --noEmit` over `apps/desktop/tsconfig.json` failed on one line of `test/pane-session.test.ts`. That case came from #181 in the first merge, and it builds a pane's start without `accountDir` and `configDir`. Phase 2 made both fields part of `daemon.ts#PaneStart` and typechecked only the files it changed, so the line was not reached. The case now passes both as null, which is what a start made before the login shell has answered gives them. `claude-plugins.ts#readPlugins` already read the missing value as null, so the case's behaviour is unchanged. After the fix, `tsc --noEmit` over the app exited 0. Executed.

The case itself was not run. Under the choice of the owl chain it reads the plugins in the config folder of the test's own environment, which is the person's own folder. A crafter's run reads no such folder. The whole suite at the broad gate runs it, and `gaps.md` names that. Unverified.

**The cases run.** Every file ran through `node scripts/test-in-electron.mjs` with `OWLERY_BACKGROUND=1`, after `pgrep` found no other run of vitest. Executed.

- The merged unit files ran with `accounts.test.ts` in one command at `c9ccb11` plus the fix: `chain`, `daemon`, `pane-chain`, `view` and `accounts`. All 5 files passed, with 1063 cases.
- The built-app files ran one at a time after a build: `chain-choice` passed 5 cases and `role-bundle` passed 18.
- The screenshot run with `OWLERY_SCREENSHOTS=1` passed and wrote 22 files.

**What the merged tree says to phases 4 and 5.** Each fact was read at `c9ccb11`.

- #146 changed no line of `daemon.ts`, `hooks.ts`, `accounts.ts`, `session-log.ts` or the adapters. `daemon.ts#agentEvent`, `#followLog` and `#startSession` are as phase 3 left them.
- In `daemon.test.ts` and `view.test.ts` #146 renamed the check in the cases of the pull request's checks and the records dialog alone. Phase 4's and phase 5's cases meet nothing of it.
- The workflow is `.github/workflows/owlery-seal.yml`, whose workflow is named `seal` and whose job is `records`. `hygiene.yml` is gone. This matches `frame/plan.md` *Overlap with the release*, the row of #146.

No statement of the frame that phase 4 builds on is contradicted by the merged tree. Read.
