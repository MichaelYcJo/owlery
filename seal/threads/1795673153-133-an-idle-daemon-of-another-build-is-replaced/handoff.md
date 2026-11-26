# Handoff: 1795673153-133-an-idle-daemon-of-another-build-is-replaced (#133)

Written 2026-11-27 by the orchestrator session that ran release 0.0.5, at the owner's word "지금도는것들 핸드오프문서만들어서 마무리하자".

**Where it stands:** the last item of the milestone `release: 0.0.5`. Branch `feat/133-a-daemon-of-another-build-stays-on-release` (worktree `owlery-wt-133r`), cut from the release at `57449b14`, the work as one commit `e651d395` (the old combined branch `feat/133-…-until-a-person-restarts-it` at `9215cd24` is kept; its history holds #215/#216 commits the check refuses). Fresh review rounds 1 (four findings, closed) and 2 (none). A judgment row decides that a failed stop counts as the run's replacement (`0d1b0c8e`).

**The broad gate at `0d1b0c8e` failed** (suite output kept at `/private/tmp/claude-501/-Users-yc-Documents-GitHub-owlery/66fc475f-7468-49ce-95e4-d5ba9694fa5e/scratchpad/133-gate-suite.txt`; the scratch may be gone):
- Two pins of `ready`'s keys missed `answersUnknown` (the merge took the release's case): **fixed at `d7b388bb`**, not yet seen in a round.
- Eight cases of the account-change group of `daemon.test.ts` failed at about 5 s each: scenario 8 and 9, #213's "keeps the name and the colour `setPane` gave a pane through a change of its account…", #223's "drops the stage a changed pane's session told at the exit…", "refuses with its reason, and ends nothing, a change of a shell…", "drops on a changed pane what the old process's events left…", "starts no process for a change whose account was removed…", "refuses a change whose pane's process has not ended within the wait…". **Not judged yet**: run `daemon.test.ts -t "account"` alone on this branch and read the first failure — a request of the account change that the daemon now refuses as unknown, or a wait the window arms, would be #133's to fix; a pass alone means load.

**Next:** judge and fix the eight (a crafter's fix pass), a verifying round 3 that reads `d7b388bb` and the fix, the broad gate alone, `pr.md` (missing: write Closes #133, *Scope* quotes and a *Judgments* row for the title prefix `feat:`), `seal pr-body --check`, the sealer, the PR, CI, squash-merge. Then the release's close (#58): ask the owner, in one batch, about the milestone `owner: by hand` and the version (memory `versioning-rule`: propose minor/patch with grounds).

## Rules this run kept (read before the next step)

- Agentic routing, Automation yes; ask nobody mid-run; record each decision with its grounds in `frame/plan.md` *Judgments of the run*.
- One tail at a time: merge the latest `origin/release/v0.0.5`, run `seal gate --preflight` then `seal gate --base release/v0.0.5 --record <item>` **with no other test run on the machine** (check `pgrep -fl vitest` first), commit `trail/gate.md`, write `pr.md` if missing (Closes, *Scope* quotes, a *Judgments* row for the title prefix) and link committed shots in `gaps.md` *Not done*, `seal pr-body --check`, spawn the sealer, open the PR, `seal pr-wait`, squash-merge. Every merge into the release makes every other sealed item merge the release and gate again.
- Never merge one work item's branch into another's: a PR may carry only `Seal-Routing` trailers of the item it judges (`chain_check.py#trailer_findings`).
- Push each branch after every step; branch pushes start no CI.
- Narrow tests: `cd apps/desktop && node scripts/test-in-electron.mjs test/<file>`, at most three files a command, `daemon.test.ts` with `-t`; `ELECTRON_SKIP_BINARY_DOWNLOAD=1 pnpm install --frozen-lockfile` where `node_modules` is missing; if the runner exits 1 with no output, `ELECTRON_OVERRIDE_DIST_PATH=/Users/yc/Documents/GitHub/owlery/node_modules/.pnpm/electron@45.3.3/node_modules/electron/dist/Electron.app/Contents/MacOS`.
- CI `check` was cancelled at 15 minutes several times with nothing failed (#296): `gh run rerun <id>`.
