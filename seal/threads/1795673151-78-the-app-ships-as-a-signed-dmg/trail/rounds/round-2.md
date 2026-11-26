# Review round 2: 1795673151-78-the-app-ships-as-a-signed-dmg

```seal
target: 9f66146a, fixes 11ea2efc..9f66146a
```

This is a verifying round. Its code is the fix diff `git diff 11ea2efc 9f66146a`: `ad72e618` (findings 1 to 4 of round 1), `8d95474d` (finding 5), the closes in `c490d4a` and the orchestrator's fold of the frame in `9f66146a`. The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at `9f66146a`, then the three phase records and `trail/rounds/round-1.md`. `Commit and pull request language` is English, so no `pr.<lang>.md` stands, and `seal/parity.json` does not exist.

Carried from round 1 and not re-derived: the packager's path from an empty `CSC_LINK` to "… not a file" (`app-builder-lib/out/codeSign/codesign.js:9-31`, `builder-util/out/cscLink.js:14-38`), since the probe of finding 1 now exits 0 and that path no longer runs; the five variables the packager reads, and the checks of round 1's *Confirmations* on code the fix diff does not touch. Re-read this round in the installed `app-builder-lib@26.18.0`: `out/platformPackager.js:84-92`, `:613-615`, `out/mac/MacTargetHelper.js:14-15`, `:46`, `:236-243` and `out/codeSign/macCodeSign.js:60-80`.

## Findings

### 1. No case holds that `packageApp` keeps the signing variables that hold text, so a mutant that deletes the Developer ID way's certificate passes the suite

```seal
severity: should
location: `apps/desktop/test/package.test.ts:83-92`, `apps/desktop/src/package/package.ts:167`
evidence: executed `pnpm --filter @owlery/desktop run test test/package.test.ts` in a clone at `9f66146a` with `package.ts:167` changed to `for (const name of SIGNING_VARIABLES) delete env[name];` (exit 0, 26 passed); executed the case below as one probe file `test_tmp_*` against the same change (exit 1); read `apps/desktop/src/package/package.ts:41-46`, `apps/desktop/src/package/package.ts:161-167`, `apps/desktop/scripts/package.mjs:31`
regression: round-1#1
```

Why it matters: the Developer ID way has never run (Q5), and its first run is the owner's, on the release's tag. A later edit that drops the `=== ""` guard at `package.ts:167` deletes `CSC_LINK` and the four other variables from `process.env` in exactly that way. The packager then finds no certificate. With `forceCodeSigning` it fails at the identity, but its message names the keychain's identities and not the deleted variables, and the suite stays green.

The unit is the loop that `ad72e618` added at `package.ts:164-167`, with its case at `package.test.ts:83-92`. The frame says, at *Scope* item 6, "A variable that is set and empty counts as not present", and nothing about what the command does with a variable that holds text. The fix made the empty ones leave the environment and pinned that with a case where all five are empty. Round 1's paste-ready case was that one-sided case, so the defect came from round 1's snippet, which the fix pass applied as written. The guard decides only one case that `signingWay` lets through: all five hold text, since some holding text throws before the loop (`package.ts:41-46`). No case holds that case at `packageApp`. The probe removed the guard and ran the file: 26 passed. The case below, run once against that change, failed with "expected { PATH: '/usr/bin' } to deeply equal { PATH: '/usr/bin', …(5) }". At the target the case passes by reading: `signingWay` gives `developer-id`, the loop deletes nothing, and `node build.mjs` fails in the bare folder before the packager runs.

```ts
// apps/desktop/test/package.test.ts, describe("packageApp"), after the case at :83
  it("keeps the signing variables that hold text, so the Developer ID way hands the packager its certificate", async () => {
    const dir = bare();
    const env: Record<string, string | undefined> = { PATH: "/usr/bin", ...ALL };
    try {
      await expect(packageApp(dir, env, packager, () => {}, "v0.1.0")).rejects.toThrow("The build of dist/ failed");
      expect(env).toEqual({ PATH: "/usr/bin", ...ALL });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
```

`ALL` is the constant at `package.test.ts:15`, and `bare` and `packager` stand at `:57-63`. The fix pass shows the case red with the guard removed, as contract rule 15 asks.

```seal
verdict: fixed 20189d5c
answer: The record's case stands in `apps/desktop/test/package.test.ts` under `describe("packageApp")`, after the case on the empty variables, as written. With the guard at `package.ts:167` changed to `for (const name of SIGNING_VARIABLES) delete env[name];` and nothing else changed, `pnpm run test test/package.test.ts -t "keeps the signing variables that hold text"` exited 1 on the guard's line, "expected { PATH: '/usr/bin' } to deeply equal { PATH: '/usr/bin', …(5) }" (executed); the guard was put back before the commit. The comment above the loop now says that the packager reads `CSC_LINK` and `CSC_KEY_PASSWORD` as set wherever they are defined and the three notarization variables only where they hold text, as `platformPackager.js:84-92` and `MacTargetHelper.js:236-243` read (read), and that the ones that hold text stay. After the commit, `pnpm run test test/package.test.ts` exited 0 with 27 passed (executed).
```

### 2. The frame lists two checkout steps, and the workflow has one

```seal
severity: should
location: `seal/threads/1795673151-78-the-app-ships-as-a-signed-dmg/frame/design.md:161`
evidence: read `.github/workflows/package.yml:40-51`; executed `git grep -n -i -e 'check out' -e 'checks out' -e 'persist-credentials' 9f66146a -- seal/threads/1795673151-78-the-app-ships-as-a-signed-dmg .github/workflows/package.yml ':!seal/threads/1795673151-78-the-app-ships-as-a-signed-dmg/trail/rounds'`
regression: round-1#2
```

Why it matters: *Data & interfaces* lists the workflow's steps, and the sealer reads that list against `.github/workflows/package.yml`. The line reads "Steps: check out the tag; check out with `persist-credentials: false`; set up pnpm …". Each item between semicolons is a step, so the list names two checkouts. `package.yml:41-46` has one `actions/checkout` step, which checks out the tag and sets `persist-credentials: false`.

The unit is the line `9f66146a` changed when it folded finding 2's fix of round 1. The frame's line said "check out the tag", round 1 asked for `persist-credentials: false` on that one step, and `ad72e618` added it there. The fold then added the option as a second item and did not amend the first. The search printed `package.yml:46` and this line alone. It is a sample: a statement of the step in other words escapes it.

```md
- Steps: check out the tag, with `persist-credentials: false`; set up pnpm (its action pinned to a commit), Node.js 22 and the install as `check.yml` does; `package --tag`, which checks the tag and writes the way of signing to the summary; `package:verify`; the upload with `gh release`, as *Scope* item 8 states, which adds the release to the summary.
```

```seal
verdict: fixed e62ba55c
answer: The orchestrator's fold rewrote the line at `frame/design.md:161` in place to "check out the tag, with `persist-credentials: false`; …", one checkout step, which matches the one `actions/checkout` step at `.github/workflows/package.yml:41-46` (read at `20189d5c`). The fix pass changed no frame line. The read of the range, after `20189d5c`: `git diff 8d95474d HEAD` of the code and of the work item's records outside `trail/` was printed and each hunk read with its unit, and HEAD contradicts none of it (read). `changelog.md` and `gaps.md` are unchanged, since the fix changes no behaviour the work ships. The sample search `git grep -n -e "as set wherever" -e "reads a signing variable" HEAD` prints `package.ts:164`, the rewritten comment, `trail/rounds/round-1.md:32`, round 1's paste-ready fix, which records that round and stands, and `trail/rounds/round-2.md:64`, this round's own prose (executed). A statement in other words escapes the sample; the part it did not reach is the tree outside the work item's records and the two source files.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: claimed, the empty signing variables leave the environment the packager reads; `apps/desktop/src/package/package.ts:167` deletes each of `SIGNING_VARIABLES` whose value is `""`, after `signingWay` (`:163`) and before `node build.mjs` (`:168`). `scripts/package.mjs:31` passes `process.env`, and the packager reads `process.env.CSC_LINK` through `chooseNotNull` (`platformPackager.js:86`), so the deletion reaches it. Round 1's probe, run again at `9f66146a` as one probe file `test_tmp_*` with `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_API_KEY_ID` and `APPLE_API_ISSUER` empty and `APPLE_API_KEY` and `GITHUB_STEP_SUMMARY` unset, exited 0. The packager logged `identityName=-`, the command printed "Signed ad hoc: no signing variable is set, so macOS asks the person to allow the first open.", and `Owlery-arm64.dmg` of 124,929,288 bytes stood. `codesign -dv` read `flags=0x10002(adhoc,runtime)`, and `codesign --verify --deep --strict` exited 0 (executed). The case at `apps/desktop/test/package.test.ts:83-92` passes at the target (executed). Its comment at `package.ts:164-166` says "The packager reads a signing variable as set wherever it is defined". That holds for `CSC_LINK` and `CSC_KEY_PASSWORD` (`platformPackager.js:84-92`) and not for the three notarization variables, which `MacTargetHelper.js:239` reads by truth, so their deletion changes nothing for the packager. The comment's reason is right for the certificate, and the round opens no finding on it. The case's gap on the variables that hold text is finding 1. The workflow's comment at `.github/workflows/package.yml:62-66` says the command takes an empty secret out of the environment, which `package.ts:167` does (read).

```seal
confirms: round-1#2
```
What holds: `.github/workflows/package.yml:46` sets `persist-credentials: false` on the one checkout. No later step pushes with git. The upload step takes its token from `GH_TOKEN` (`:90-91`). `apps/desktop/src/package/package.ts` runs `spawnSync` for its own commands and none of them is `git` with the remote (read). The fold of the frame has the defect of finding 2, which is in the frame and not in the workflow.

```seal
confirms: round-1#3
```
What holds: `.github/workflows/package.yml:51` pins `pnpm/action-setup@b906affcce14559ad1aafd4ab0e942779e9f58b1`. On GitHub on 2026-11-26, `gh api repos/pnpm/action-setup/git/refs/tags/v4.3.0` gave the tag object `c336a278…`, and that object's commit is `b906affcce14559ad1aafd4ab0e942779e9f58b1`. `refs/tags/v4` gave the tag object `f40ffcd9…`, whose commit is the same. `refs/tags/v4.4.0` names commit `fc06bc12…`. The pinned commit's message is `Revert "feat!: run the action on Node.js 24 (#205)"`. So the comment at `:48-50` holds: the commit is v4.3.0's, and v4 names it today (executed). The package step's `trap 'rm -f "$RUNNER_TEMP/notarization-key.p8"' EXIT` stands at `:75`, before the file is written at `:77`, so the file goes at the step's end on success or failure under the runner's `bash`. Ruby's YAML parser loads the file (executed). `check.yml` keeps `@v4`, as round 1 weighed it.

```seal
confirms: round-1#4
```
What holds: the Developer ID way of `packagerConfig` holds `forceCodeSigning: true` (`apps/desktop/src/package/package.ts:76`). The packager reads it from the platform's options first (`platformPackager.js:613-615`), declares it at `options/PlatformSpecificBuildOptions.d.ts:150`, hands it to `reportError` (`MacTargetHelper.js:46`), and `reportError` throws "skipped macOS application code signing" with the identities it found where it is set (`macCodeSign.js:73-75`). In the ad hoc way the configuration names `identity: "-"` and no `forceCodeSigning`, so `MacTargetHelper.js:14-15`, which throws where the identity is `null` and signing is forced, is not reached. The `.dmg` is signed only where `dmg.sign` is `true` (`dmg-builder/out/dmg.js:44`), so forcing the app's signature does not ask for the image's. Read. The case at `apps/desktop/test/package.test.ts:128-133` expects the value and passes (executed). Scenario F at `frame/design.md:119` names it, and the docstring at `package.ts:67-69` says it.

```seal
confirms: round-1#5
```
What holds: `README.md:15`, `README.ko.md:15` and `changelog.md:5` say macOS 13 or later and that the app does not open on an earlier macOS. `frame/design.md:80` and `:106` say the same. The app the probe of finding 1 built holds `LSMinimumSystemVersion` 13.0 (`plutil -extract`, executed). Both READMEs still hold 7 lines that open with `#` and 16 that open with `|` (`grep -c`, executed). The `gaps.md` row on the Korean labels was reworded in place and keeps its item, so no row left `## Not verified`.

What matched: the new case at `apps/desktop/test/package.test.ts:83-92` covers what the other cases of `describe("packageApp")` do not: they hold refusals before any build, and it holds the environment after `signingWay`. The case at `:128-133` gained one expectation and no new case. No test file declares `TARGET`, as round 1 read.

What matched: the fold at `9f66146a` rewrote *Scope* item 10, *What a person who downloads the build without the certificate meets*, scenario F and *Data & interfaces*, each in place. `frame/plan.md`, `frame/questions.md`, `pr.md` and the three phase records are unchanged in the fix diff, and the target does not contradict them: the phase records' lines on Apple silicon and on the empty variable state their phase's commits.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the workflow runs green on GitHub's runner with no secret set: the checkout without credentials, the pinned pnpm action, `sips` drawing the SVGs, `package:verify` there, and the draft release | `.github/workflows/package.yml` | the orchestrator, by `frame/questions.md` Q4 |
| Whether the Developer ID way signs, notarizes and staples, and whether `forceCodeSigning` fails the run with a message the owner can act on where the `.p12` holds no usable identity | `apps/desktop/src/package/package.ts:76` | the owner, after the enrolment, by `frame/questions.md` Q5 |
| What macOS 26 shows at the first open of the downloaded ad hoc build | `README.md:19-24`, `README.ko.md:19-24` | the owner, at a screen, by `frame/questions.md` Q6 |
| The suite, the typecheck and the README count of the broad gate at the work item's last commit: `unverified` by this round, under contract rule 2 | the work item | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` in a clone at `9f66146a` | Exit 0. |
| `pnpm --filter @owlery/desktop run test test/package.test.ts` at `9f66146a` | Exit 0: 1 file, 26 passed. |
| The same command with `package.ts:167` changed to delete every signing variable, through the `Edit` tool, and changed back after | Exit 0: 26 passed, so no case holds the guard. Finding 1. |
| One probe file `test_tmp_*` holding the case of finding 1, run once against that change | Exit 1: "expected { PATH: '/usr/bin' } to deeply equal { PATH: '/usr/bin', …(5) }". |
| One probe file `test_tmp_*`, run once: `env -u APPLE_API_KEY -u GITHUB_STEP_SUMMARY CSC_LINK= CSC_KEY_PASSWORD= APPLE_API_KEY_ID= APPLE_API_ISSUER= pnpm --filter @owlery/desktop run package --tag v0.0.5-package.1`, then `codesign -dv`, `codesign --verify --deep --strict` and `plutil -extract LSMinimumSystemVersion raw` on the app | Package exit 0, "Signed ad hoc …", `Owlery-arm64.dmg` of 124,929,288 bytes; `flags=0x10002(adhoc,runtime)`; verify exit 0; 13.0. No app was started. |
| `gh api repos/pnpm/action-setup/git/refs/tags/v4.3.0`, `…/v4` and `…/v4.4.0`, then `gh api repos/pnpm/action-setup/git/tags/<object>` for each | Each exit 0. v4.3.0 and v4 dereference to commit `b906affcce14559ad1aafd4ab0e942779e9f58b1`; v4.4.0 to `fc06bc12…`. |
| `ruby -ryaml -e 'YAML.load_file(".github/workflows/package.yml")'` | Exit 0. |
| `grep -c '^#'` and `grep -c '^\|'` on `README.md` and `README.ko.md` | 7 and 16 in each. |
| The search of finding 2 | Exit 0, two lines: `package.yml:46` and `frame/design.md:161`. |
