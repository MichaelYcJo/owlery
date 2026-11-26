# Handoff: 1795701355-257-a-store-it-cannot-read-is-kept (#257)

Written 2026-11-27 by the orchestrator session that ran release 0.0.5, at the owner's word "지금도는것들 핸드오프문서만들어서 마무리하자".

**Where it stands:** milestone `release: 0.1.0`. Built in two phases; review round 1 (three `should`, closed by the fix pass `d1bb9568`…`37f2e4a0`) and round 2 (none, `bbed3c09`). No broad gate yet, no `pr.md` yet. The branch's base is `c80b900a`.

**Next:** merge the latest `origin/release/v0.0.5` (since `c80b900a` it holds #213, the test fixes, #216, #223, and #133 once merged; `daemon.ts` `ready`, `protocol.ts` `ready`, `sidebar.ts#showStatus` and `view.ts#statusNotice` meet #133's `answersUnknown` and #216's refresh; the pins of `ready`'s keys in `daemon.test.ts` must hold both `answersUnknown` and this work's `storeNotice` rule, which sends the key only where it has a value); a conflict outside the records owes a verifying round; the broad gate alone; `pr.md`; the sealer; the PR; merge. Q1/Q2 stand on their defaults (a *Judgments* row records it).

## Rules this run kept (read before the next step)

- Agentic routing, Automation yes; ask nobody mid-run; record each decision with its grounds in `frame/plan.md` *Judgments of the run*.
- One tail at a time: merge the latest `origin/release/v0.0.5`, run `seal gate --preflight` then `seal gate --base release/v0.0.5 --record <item>` **with no other test run on the machine** (check `pgrep -fl vitest` first), commit `trail/gate.md`, write `pr.md` if missing (Closes, *Scope* quotes, a *Judgments* row for the title prefix) and link committed shots in `gaps.md` *Not done*, `seal pr-body --check`, spawn the sealer, open the PR, `seal pr-wait`, squash-merge. Every merge into the release makes every other sealed item merge the release and gate again.
- Never merge one work item's branch into another's: a PR may carry only `Seal-Routing` trailers of the item it judges (`chain_check.py#trailer_findings`).
- Push each branch after every step; branch pushes start no CI.
- Narrow tests: `cd apps/desktop && node scripts/test-in-electron.mjs test/<file>`, at most three files a command, `daemon.test.ts` with `-t`; `ELECTRON_SKIP_BINARY_DOWNLOAD=1 pnpm install --frozen-lockfile` where `node_modules` is missing; if the runner exits 1 with no output, `ELECTRON_OVERRIDE_DIST_PATH=/Users/yc/Documents/GitHub/owlery/node_modules/.pnpm/electron@45.3.3/node_modules/electron/dist/Electron.app/Contents/MacOS`.
- CI `check` was cancelled at 15 minutes several times with nothing failed (#296): `gh run rerun <id>`.
