# Handoff: 1795701355-127-role-sessions-run-in-a-sandbox (#127)

Written 2026-11-27 by the orchestrator session that ran release 0.0.5, at the owner's word to wrap up once the running daemon tests ended ("지금돌고있는데몬 3 5분정도까지만가고 정리하자"). The session that continues reads this, applies or drops the patch, and removes this file, the patch and `changelog.unfinished.md`.

**Where it stands:** milestone `release: 0.1.0`. Phases 1 and 2 built; the framer folded phase 2 (`156352ba`). Phase 3, the last, is partly built: the release was merged at `57449b14` (`1d4659c4`), and `86cd3008` holds the stand-in runs (`role-session.test.ts` per pair, `role:refusal:crafter`, `OWLERY_ROLE_CLI`). The crafter was stopped mid-phase. No phase-3 record, no Status cell, no `gaps.md`; Q3–Q6 not yet answered in a record. No review round has read phases 1–3 yet.

**Unfinished, not committed to the code:** `phase-3-unfinished.patch` (8 files, +68/−47: `adapter.ts`, `claude-roles.ts`, `claude.ts`, `daemon.ts` and four test files) is the crafter's work in progress at the stop, and `changelog.unfinished.md` its draft fragment. Its last `daemon.test.ts -t "headless sessions|the caps on the machine|idle exit|the agent's notice|repositories|what a person sets on a work item|permission requests"` run with the patch read **1 failed, 150 passed**; the failing case was not identified (earlier runs of that set failed in `headless sessions`). Apply with `git apply seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/phase-3-unfinished.patch`, rerun that set, and read the failure before building on it; or drop the patch and rebuild from the frame.

**Next:** a crafter finishes phase 3 (the stand-in runs of the three `role:refusal*` scripts must reach no real model; they answer Q3–Q6 and name them for the framer), writes `phase-3.md`, `gaps.md`, `changelog.md` and the Status cell; the framer folds Q3–Q6 and the three "only" sentences of *Rule changes* if Q3 shows another writable place; review round 1 over phases 1–3; then the tail: merge the latest release, the broad gate alone, `pr.md`, `seal pr-body --check`, the sealer, the PR, CI, squash-merge.

## Rules this run kept

- Agentic routing, Automation yes; ask nobody mid-run; record each decision with its grounds in `frame/plan.md` *Judgments of the run*.
- One tail at a time; the broad gate with no other test run on the machine (`pgrep -fl vitest` first); every merge into the release makes every other sealed item merge the release and gate again.
- Never merge one work item's branch into another's: a PR may carry only `Seal-Routing` trailers of the item it judges.
- Push each branch after every step.
- Narrow tests: `cd apps/desktop && node scripts/test-in-electron.mjs test/<file>`, at most three files a command, `daemon.test.ts` with `-t`.
