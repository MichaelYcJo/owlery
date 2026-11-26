# Handoff: 1795696248-132-a-connected-repositorys-pin-follows-the-app (#132)

Written 2026-11-27 by the orchestrator session that ran release 0.0.5, at the owner's word "지금도는것들 핸드오프문서만들어서 마무리하자".

**Where it stands:** milestone `release: 0.1.0` (the minimum to publish). Built in two phases; review rounds 1–3, all findings closed (`1e1eb7db`). A broad gate passed against `f683c693` (`f2a7254b`), but the release has since moved (now `57449b14` or later), so that gate is stale. No `pr.md` yet.

**Next (after #133 merges, or as the release's order puts it):** merge the latest `origin/release/v0.0.5` (the release since `f683c693` holds #215, #278, #213, the test fixes, #216, #223, and #133 once merged — expect conflicts in `view.ts`, `sidebar.ts`, `protocol.ts`, `daemon.ts`, `docs/design.md`); a conflict outside the records owes a verifying round; retake the six `*-check-move.png` if the scene changed and relink them in `gaps.md`; the broad gate alone; `pr.md`; the sealer; the PR; merge.

## Rules this run kept (read before the next step)

- Agentic routing, Automation yes; ask nobody mid-run; record each decision with its grounds in `frame/plan.md` *Judgments of the run*.
- One tail at a time: merge the latest `origin/release/v0.0.5`, run `seal gate --preflight` then `seal gate --base release/v0.0.5 --record <item>` **with no other test run on the machine** (check `pgrep -fl vitest` first), commit `trail/gate.md`, write `pr.md` if missing (Closes, *Scope* quotes, a *Judgments* row for the title prefix) and link committed shots in `gaps.md` *Not done*, `seal pr-body --check`, spawn the sealer, open the PR, `seal pr-wait`, squash-merge. Every merge into the release makes every other sealed item merge the release and gate again.
- Never merge one work item's branch into another's: a PR may carry only `Seal-Routing` trailers of the item it judges (`chain_check.py#trailer_findings`).
- Push each branch after every step; branch pushes start no CI.
- Narrow tests: `cd apps/desktop && node scripts/test-in-electron.mjs test/<file>`, at most three files a command, `daemon.test.ts` with `-t`; `ELECTRON_SKIP_BINARY_DOWNLOAD=1 pnpm install --frozen-lockfile` where `node_modules` is missing; if the runner exits 1 with no output, `ELECTRON_OVERRIDE_DIST_PATH=/Users/yc/Documents/GitHub/owlery/node_modules/.pnpm/electron@45.3.3/node_modules/electron/dist/Electron.app/Contents/MacOS`.
- CI `check` was cancelled at 15 minutes several times with nothing failed (#296): `gh run rerun <id>`.
