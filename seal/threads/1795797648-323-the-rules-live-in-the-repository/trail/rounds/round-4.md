# Review round 4: 1795797648-323-the-rules-live-in-the-repository

```seal
target: 3a33e91f, fixes 69c9d5ee..3a33e91f
```

This is a verifying round. Its code is the range `69c9d5ee..3a33e91f`: the crafter's `3d921974`, which changes the case in `apps/desktop/test/records-place.test.ts` and one clause of `docs/architecture.md:307` and of `docs/architecture.ko.md:307`, and `d4ed2079` and `3a33e91f`, which add round 3's record and its close block. The base is `release/v0.2.0`. It stands at `aec3e8ac` on `origin`, HEAD descends from it, and the range holds no merge (executed, `git merge-base --is-ancestor`, `git log --merges`). `git diff --stat d4ed2079..HEAD -- . ':!seal'` prints those three files alone. Read whole at the target: `routing.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md`, `trail/phases/phase-2.md` and `trail/rounds/round-1.md` to `round-3.md`. The work item has no frame. `seal/config.json` sets `Commit and pull request language` to English, so no `pr.<lang>.md` is owed. No `seal/parity.json` is declared.

Carried from round 3 and not re-established: `#322` *When it lands* step 4 holds the pin and moves the root and the pin in one commit, read with `gh issue view 322` in round 3; `PLUGIN_ROOT_MARKER` at `records-place.test.ts:23` equals the plugin's `MARKER` and the first line of `seal/README.md`; and `check.yml:26` checks out at depth 1 with no tags, so the file as it stood at the tag cannot be read in CI. The range changes none of those files. Re-established: the first line of `seal/README.md` is `# What AgenticSeal maintains in seal/` followed by a bare `\n` (executed, `od -c`), so `onThePlugin` is true at the target and the case takes the `pinnedVersion` branch.

## Findings

None. The round leaves no finding open.

## Confirmations

```seal
confirms: round-3#1
```
What holds: claimed in the close block that on the plugin's root the case asserts only `pinnedVersion(workflow)` is `PIN_HELD_FOR_THE_PLUGIN`, and otherwise keeps `toBe(workflowText(version))` unchanged. `records-place.test.ts:1120-1122` does this, in round 3's paste-ready form word for word (read, `git show 3d921974`). An untouched `owlery-seal.yml` no longer fails when the template changes, which was the finding: the crafter's mutant (4), `name: seal` changed in the file, survives. Round 3's evidence search re-run at the target, `git grep -n -e "written for 0.1.0" -e "the one for 0.1.0" -e "0.1.0에 맞춰" -- .`, prints `trail/phases/phase-2.md:7` and round 3's own lines, and nothing in `docs/` or the case (executed). `git log --oneline v0.1.0..HEAD -- apps/desktop/src/daemon/records-place.ts .github/workflows/owlery-seal.yml` still prints nothing, so the template and the file stand as at the tag (executed).

The case still goes red where it must. Each answer below is read from the code and checked against the crafter's mutants in the close block:

- **A moved pin.** `pinnedVersion` at `records-place.ts:132-139` returns the version only where the tag line and the release-branch line both match and agree. Both lines moved to `0.2.0` give `"0.2.0"`, and the `toBe("0.1.0")` at `:1121` fails. This is the crafter's mutant (1), red at `:1121`. Moving one line alone, which the crafter did not run, gives `null`, and `toBe("0.1.0")` fails as well. The case at `records-place.test.ts:1083-1096` pins that `null`: its `apart` text moves only the release-branch line, and its `fallbackless` and `stepless` texts drop the lines. Reading settles this, so no probe was run. A rewritten step that `pinnedVersion` cannot read also gives `null`, so it fails closed.
- **A wrong held version.** `PIN_HELD_FOR_THE_PLUGIN` at `:30` set to `"0.2.0"` fails `:1121` against a file pinning `v0.1.0`. This is mutant (2).
- **A moved root.** Where `seal/README.md` is gone or opens with another line, `onThePlugin` is false and `:1122` holds the whole file to `workflowText("0.2.0")`, against a file that pins `v0.1.0`. This is mutant (3), red at `:1122`. The migration commit that step 4 names moves the root and rewrites the file to the app's version together, so it passes.

The line numbers in the close block, `:1121` for the pin and `:1122` for the whole file, are the lines of the two assertions at the target (read).

On a repository whose root is not the plugin's, the case keeps its full force. The `else` branch at `:1122` is `expect(workflow).toBe(workflowText(version))`, the assertion that stood before `8c52f670`. It has no skip, no other condition and no looser comparison. The file text read at `:1120` is the same one that assertion read before.

The docs sentence matches the case. The clause at `docs/architecture.md:307`, "the workflow keeps its pin at 0.1.0", says what `:1121` asserts, and claims no more of the file than the pin. The Korean clause at `docs/architecture.ko.md:307`, "워크플로의 고정 버전을 0.1.0에 그대로 둡니다", says the same: the pinned version is kept at 0.1.0. The case's name at `:1116`, "and its pin to 0.1.0 while this repository's records stand in the AgenticSeal plugin's root", matches it too. The rest of the paragraph is unchanged in both files, and so is its `check:` line, which names `records-place.test.ts` (read, `git show 3d921974`). Each file changes one line in place, so the heading and table-row counts that `Broad gate`'s documents leg compares cannot move. Executed: `pnpm --filter @owlery/desktop run test test/records-place.test.ts` in the branch worktree, exit 0, 43 of 43 passed.

What matched: the records that state the present agree with the target. `routing.md:27` and `pr.md:4` name "the case ... that holds this repository's pin at 0.1.0 while it keeps the plugin's root", which is what the case now holds. `changelog.md:9` says the check stays at 0.1.0, "which `.github/workflows/owlery-seal.yml` pins", and the file pins it at `owlery-seal.yml:36` and `:38` (read). The range changes none of `routing.md`, `gaps.md`, `changelog.md` or `pr.md`, so no row of `gaps.md` left.

What matched: what the fix gives up is the stated cost. On the plugin's root the case no longer holds the rest of the file, so an edit there that keeps the pin, such as a removed check step, passes the case. Round 3 weighed this. The exact file, as it stood at the tag, cannot be read in CI, and the docs sentence now claims only the pin. So the gap is no defect against the sentence.

`trail/phases/phase-2.md:7` still says that on the plugin's root "the workflow must be exactly the text written for 0.1.0". That is phase 2's account of its own commit `8c52f670`, which its seen-red paragraph names. Round 3's close block keeps it as the phase's record and holds the form that replaced it, and this round opens no finding on it. The doubled clause "and its pin to 0.1.0" in the case's name, and the header comment at `records-place.test.ts:3-4`, are read by whoever next edits the case and claim nothing false.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck of the changed case, and the rest of `seal/config.json` `Broad gate`. This round ran only `records-place.test.ts`, and the suite stays `unverified` | the whole tree at the target | the orchestrator, at the broad gate |
| Whether the exchange quoted at `routing.md:29` is the owner's words verbatim, carried from round 3 | the conversation the quote comes from | the orchestrator |

Nothing stays open after this round. The broad run is due next, and the orchestrator runs it, then spawns the sealer.

## Probes

| Command | Result |
|---|---|
| `pnpm --filter @owlery/desktop run test test/records-place.test.ts` in the branch worktree | exit 0, 1 file, 43 of 43 cases passed |
| `git grep -n -e "written for 0.1.0" -e "the one for 0.1.0" -e "0.1.0에 맞춰" -- .` | `trail/phases/phase-2.md:7` and round 3's lines; nothing in `docs/` or `apps/` |
| `git log --oneline v0.1.0..HEAD -- apps/desktop/src/daemon/records-place.ts .github/workflows/owlery-seal.yml` | no commit |
| `git merge-base --is-ancestor origin/release/v0.2.0 HEAD`, and `git log --merges --oneline d4ed2079..HEAD` | exit 0, and no merge in the range |
| `head -2 seal/README.md` through `od -c` | the plugin's marker followed by `\n`, so `onThePlugin` is true |
