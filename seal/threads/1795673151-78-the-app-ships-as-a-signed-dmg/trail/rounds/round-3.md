# Review round 3: 1795673151-78-the-app-ships-as-a-signed-dmg

```seal
target: 0d239883, fixes 9f66146a..0d239883
```

This is a verifying round. Its code is the fix diff `git diff 9f66146a 0d239883`: `e62ba55c` (finding 2 of round 2), `20189d5c` (finding 1), the closes in `e7de9d2` and the orchestrator's further fold of the frame's Steps line in `0d239883`. The diff changes `apps/desktop/src/package/package.ts` (the comment above the loop that drops the empty signing variables), `apps/desktop/test/package.test.ts` (one new case), `frame/design.md:161` and `trail/rounds/round-2.md`. The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at `0d239883`, then the three phase records and `trail/rounds/round-1.md` and `trail/rounds/round-2.md`. `Commit and pull request language` is English, so no `pr.<lang>.md` stands, and `seal/parity.json` does not exist.

Carried from rounds 1 and 2 and not re-derived: the packager's path from an empty `CSC_LINK` to "… not a file", the five variables the packager reads, that `scripts/package.mjs:31` hands `process.env` to `packageApp`, the pin of `pnpm/action-setup` to v4.3.0's commit, and round 2's *Confirmations* on code the fix diff does not touch. Re-read this round in the installed `app-builder-lib@26.18.0`: `out/platformPackager.js:84-92` and `out/mac/MacTargetHelper.js:236-243`, the two places the rewritten comment rests on.

## Findings

None. The fix diff holds no defect this round found.

## Confirmations

```seal
confirms: round-2#1
```
What holds: claimed, a case holds that `packageApp` keeps the signing variables that hold text, and it fails with the `=== ""` guard removed. The case stands at `apps/desktop/test/package.test.ts:94-103`. It hands `packageApp` the five variables set to text, waits for "The build of dist/ failed" from the bare folder, and expects the environment unchanged. At `0d239883`, `pnpm --filter @owlery/desktop run test test/package.test.ts` exited 0 with 27 passed (executed). With `package.ts:168` changed through the `Edit` tool to `for (const name of SIGNING_VARIABLES) delete env[name];`, the same command exited 1: only this case failed, at `package.test.ts:99`, the `expect(env).toEqual` line, with "expected { PATH: '/usr/bin' } to deeply equal { PATH: '/usr/bin', …(5) }" (executed). That line asserts what the guard keeps, so the case pins the guard it names. The guard was put back, and `git status --short` printed nothing. The fix pass's close says it ran the case alone with `-t`; this round ran the whole file, and the result is the same.

The rewritten comment at `apps/desktop/src/package/package.ts:164-167` says the packager reads `CSC_LINK` and `CSC_KEY_PASSWORD` as set wherever they are defined, and the three notarization variables as set only where they hold text. `platformPackager.js:84-92` reads both certificate variables through `chooseNotNull`, under the packager's own comment "allow to specify as empty string". `MacTargetHelper.js:236-243` reads `APPLE_API_KEY`, `APPLE_API_KEY_ID` and `APPLE_API_ISSUER` by truth (read). So the comment states what the packager does, and its last clause, "the ones that hold text stay", is what the new case pins. The search `git grep -n -e 'as set wherever' -e 'hold text stay' -e 'only where they hold text' 0d239883` printed the comment at `package.ts:164-167`, round 1's paste-ready fix at `trail/rounds/round-1.md:32` and round 2's prose and close. The two round records state their own rounds and stand. The search is a sample: a statement of the fact in other words escapes it. No record outside `trail/rounds/` names a line of `package.ts` or `package.test.ts`, so the comment's one added line moves no coordinate a present record holds (`git grep -n -E 'package\.ts:[0-9]|package\.test\.ts:[0-9]'` over the work item's records outside `trail/rounds/`, `.github`, `docs` and both READMEs, exit 1, executed).

The new case read against its group, `describe("packageApp")` at `package.test.ts:56-104`: the other three cases hold refusals before any build and the removal of the empty variables. None of them holds the variables that hold text, so the case covers what its group did not. No test file declares `TARGET`, as rounds 1 and 2 read.

```seal
confirms: round-2#2
```
What holds: `frame/design.md:161` names one checkout step, "check out the tag, with `persist-credentials: false`", which is the one `actions/checkout` step at `.github/workflows/package.yml:41-46` (read). The orchestrator's fold at `0d239883` rewrote the same line in place: "set up pnpm with its action pinned to a commit, where `check.yml` names the tag `v4`". `package.yml:51` pins `pnpm/action-setup` to a commit, and `check.yml:29` names `pnpm/action-setup@v4` (read). The line's next item, "set up Node.js 22 and the install as `check.yml` does", holds at `package.yml:53-60` against `check.yml:31-33` and `:44` (read). The search `git grep -n -i -e 'check out' -e 'persist-credentials' -e 'pinned to a commit' -e 'names the tag' -e 'action-setup' 0d239883 -- seal/threads/1795673151-78-the-app-ships-as-a-signed-dmg .github/workflows` without `trail/rounds` printed `check.yml:29`, `package.yml:46`, `package.yml:51`, `frame/design.md:161` and an unrelated line of scenario E at `frame/design.md:118` (executed). No other line of the frame states the steps. The search is a sample, as above.

What matched: `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `routing.md` and the three phase records are unchanged in the fix diff. The fix diff changes no behaviour they state, so the target does not contradict them. The phase records' counts of cases, such as 25 at `efe69004` in `trail/phases/phase-2.md:23`, state their phase's commits and stand.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the run of the package workflow at the tag `v0.0.5-package.1`, pushed at `0d239883`, packages the app on GitHub's runner, passes `package:verify` there and leaves a draft release holding `Owlery-arm64.dmg` | `.github/workflows/package.yml` | the orchestrator, by `frame/questions.md` Q4 |
| Whether the Developer ID way signs, notarizes and staples | `apps/desktop/src/package/package.ts#packagerConfig` | the owner, after the enrolment, by `frame/questions.md` Q5 |
| What macOS 26 shows at the first open of the downloaded ad hoc build, and how the Dock and the Finder draw the icon | `README.md`, `README.ko.md` *Install* | the owner, at a screen, by `frame/questions.md` Q6 |
| The suite, the typecheck and the README count of the broad gate at the work item's last commit: `unverified` by this round, under contract rule 2 | the work item | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` in a clone at `0d239883` | Exit 0. |
| `pnpm --filter @owlery/desktop run test test/package.test.ts` at `0d239883` | Exit 0: 1 file, 27 passed. |
| The same command with `package.ts:168` changed to delete every signing variable, through the `Edit` tool, and changed back after | Exit 1: 1 failed, 26 passed. The failure is the case at `package.test.ts:94`, at its line 99, "expected { PATH: '/usr/bin' } to deeply equal { PATH: '/usr/bin', …(5) }". |
| The two searches of the confirmations | Exit 0 each, the lines named there. |
| The search for line coordinates of the two changed files in the present records | Exit 1, nothing printed. |
