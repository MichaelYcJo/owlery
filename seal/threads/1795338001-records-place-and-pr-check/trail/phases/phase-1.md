# Phase 1: 1795338001-records-place-and-pr-check

## What this phase found

**The frame holds.** Every coordinate `frame/plan.md` *Technical context* and `frame/design.md` *Grounding* give for this phase was opened at `802ae8a` and stands: the lines of `docs/architecture.md` and its Korean edition, lines 58 and 83 of `apps/desktop/test/role-bundle.test.ts`, lines 9, 23, 35 and 44 to 52 of `apps/desktop/role-bundle/README.md`, and the two `add` operations of the role bundle's design.

**The commit of AgenticSeal's tag is the one the notices name.** *Grounding* left it as nobody's finding. `git ls-remote https://github.com/MichaelYcJo/AgenticSeal 'refs/tags/v0.38.4*'` printed `0eca6e77215262e2609f2d7f2894215faa1d7423`. The 19 scripts and `LICENSE` were copied from a clone of that tag, made in this phase's scratch directory, and `cmp` found each equal to the installed plugin's file.

**One departure from the frame: the case that pinned the bundle's file list is removed, not rewritten.** *Scope* item 5 and the row of *Removes* ask for a case holding that the bundle has its manifest, its `LICENSE` and its `README.md`. Each of the three is already read by a case of the same group, which fails where the file is absent: the manifest by "is a plugin named owlery", and the other two by "keeps AgenticSeal's licence text beside the files". A rewritten case would cover nothing the group does not cover. Judged against the crafter's rule *A new test starts from its group*. Scenario 6 holds as written: the notice case stays, and no case names a fixed list of the bundle's files.

**The bundle's notice keeps the manifest's sentence.** The removed section *What Owlery changed* also said that the manifest states no version because the bundle ships inside the app. That sentence says what the folder is, which item 5 keeps, so it moved under *Where the files come from*. The list of the five changed files went: the cases of `role-bundle.test.ts` on the `skills:` key and on the stamp still hold two of those changes, and git holds the rest.

**The cases run the check with `python3 -B` and a small environment.** Without `-B`, Python writes `__pycache__` folders into `pr-check/`, and nothing in `.gitignore` names them. The environment is `PATH`, `HOME` and `GITHUB_EVENT_PATH` and no other name, so no variable of the suite's own process reaches the check or its git. The framer's probe used `-I`. The cases do not, because the workflow on GitHub runs plain `python3`, which puts the script's folder on the module path. Phase 2's scenario 15 and phase 3's scenario 18 can run Python the same way.

**The fixture's root names both languages.** The framer's probe wrote a `config.json` with `Broad gate` alone, and the check then added two refusals on the language keys. The case of scenario 2 writes both keys and asserts that the output does not name `config.json`, so the refusals it reads are the work item's own. Scenario 15 of phase 2 asserts the same of the root the setup writes.

**The marker is held in two places by one case.** The cases write the marker line into a fixture root, and the case on the folder's scripts asserts that `pr-check/lib/optin.py` holds the same line as its `MARKER`. Phase 2's `records-place.ts` writes that line too.

**Seen red.** The five cases of `apps/desktop/test/pr-check.test.ts` ran before `pr-check/` held a file, and all five failed: three on `python3: can't open file …/pr-check/skills/code-review/scripts/chain_check.py`, one on the 19 missing scripts, and one on `ENOENT` for `pr-check/LICENSE`. They passed once the folder held its files.

**Mutations, each one `seal mutate` run at `a2fd024` over `test/pr-check.test.ts`.**

| Break | Verdict | Case that failed |
|---|---|---|
| `chain_check.py` answers `draft` for every payload | red | "fails a ready pull request …", and the case on `decisions.md`, which first asserts exit 1 |
| `lib/optin.py#MARKER` names another line | red | "fails a ready pull request …" and "holds every script …" |
| The sentence "declared neither way" of `chain_check.py` reworded | red | "passes a ready pull request that declares no work item …" |
| The licence sentence of `pr-check/README.md` removed | red | "keeps AgenticSeal's licence text beside the scripts …" |
| "0.38.4" removed from one sentence of `pr-check/README.md` | SURVIVED | none: the notice also names the tag `v0.38.4`, so the release is still named and the case's claim still holds |

**The searches of scenarios 5 and 6 print nothing at `a2fd024`.** `git grep -n -F` over `docs` for each of the six strings *Grounding* names beside items 3 and 4, `git grep -n -F 'byte for byte' -- apps/desktop/role-bundle docs`, and `git grep -n -F 'is decided by issue #40' -- apps`.

**The two editions keep equal counts.** `grep -c '^#'` gives 26 for each edition of `docs/architecture.md`, and `grep -c '^|'` gives 107 for each. The broad gate's own comparison is the orchestrator's run.

**The phase boundary run.** `node scripts/test-in-electron.mjs test/pr-check.test.ts test/role-bundle.test.ts test/claude-adapter.test.ts` at `a2fd024`, with `OWLERY_BACKGROUND=1`: 3 files and 81 cases passed. `claude-adapter.test.ts` is there because it reads the bundle's folder. `tsc --noEmit` in `apps/desktop` exited 0.

**For the next phases.** The worktree had no `node_modules`, and `pnpm install --frozen-lockfile` at the top made them. `pr-check/.github/scripts/` is a nested folder GitHub reads no workflow from. The helpers of `test/pr-check.test.ts` (`write`, `commitAll`, `commitRoot`, `routing`, the `check` runner) are local to the file, and scenario 15 belongs in that file beside them.
