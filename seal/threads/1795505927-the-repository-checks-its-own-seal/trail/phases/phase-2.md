# Phase 2: 1795505927-the-repository-checks-its-own-seal

## What this phase found

**The frame holds for this phase, except for one clause of scenario 7.** Each fact the phase stands on was opened at `459704a` before the build. The search of `frame/plan.md` *Phases* row 2 printed lines of the files of *Removes* row 2's first group and of no other file (executed). The five stand-ins for the workflow stand at the lines `frame/design.md` *Grounding* names at `73a72df`, and so do `fixtures/sample-gh/gh:15`, `screenshots.test.ts:182` and `chain-command.test.ts:83` (read). `records-place.ts#workflowText` wrote the job id `seal`, and the workflow held the earlier name at line 4 (read).

**Scenario 7 and the search of phase 2 cannot both hold at one line.** Scenario 7 asks that "a body that holds a section under the earlier heading is rewritten to the new one". The case that rewrites an earlier body is `pull-request.test.ts`, "replaces the lines from the opening marker to the closing marker", and its earlier body is the constant `OLD`, whose heading was `## Owlery seal`. *Removes* row 2 names `pull-request.test.ts` among the files whose every line loses the name, and the search of phase 2 and of scenario 9 must print nothing. A body under the earlier heading cannot stand in a case without the search printing it. The phase built to the search: `OLD` now holds `## Seal`, and the case still rewrites it, since `OLD` holds another verdict block and no sentence. `github.ts#withSealSection` reads the two marker lines and no heading, so a body an earlier build wrote is rewritten whatever heading it holds. That reading is what scenario 7's clause asks for, and the case's lines with `old` between the two markers hold it. Judged against `frame/design.md` *Removes* row 2 and scenario 9, which the issue's *Done when* reads, over the one clause of scenario 7. The frame's fold decides whether the clause stays.

**Decisions made while building, each with its grounds.**

- **The job's id is `records`, `frame/questions.md` Q1's default.** The row is open, and the spawn named the default. Judged against `frame/design.md` *Scope* item 3.
- **`Judged.broken` holds the newest verdict block of each broken seal, and no longer its commit.** `#outcome` reads whether each block it names holds a `rules:` line, and a commit alone does not say that. The function that gave a title's commits, `shortened`, became `sealed_commits` and reads the commit from each block, since both titles now pass blocks to it. No other reader of `broken` or of `shortened` stands in `pr-check/` or `apps/desktop/` (executed: `grep -rn`). Judged against `frame/design.md` *Scope* item 2 and *Data & interfaces*.
- **`by_owl_chain` answers whether every block holds a `rules:` line, through `FIELDS.RULES in block.fields`.** The reader of `pr-check/lib/fields.py` keeps a block's lines by their key, and other functions ask it the same way (`chain_check.py#original_of` and `#_said`, read). No grammar of the line is added. Judged against `frame/plan.md` *Technical context*, its second bullet.
- **The workflow's opening comment says that the file fetches the check at one release, the one named below, and that the line moves when the file is written again.** Both hold where a setup wrote the file at a connection and where a pull request committed it, as in this repository. Judged against `frame/design.md` *Scope* item 3. The workflow was then written by `workflowText` itself: `records-place.ts` was bundled with the app's `esbuild` into the crafter's scratch directory, and `node` wrote `workflowText` of `apps/desktop/package.json`'s version, `0.0.3`, into `.github/workflows/owlery-seal.yml`, as phase 1 did.
- **The stand-in for AgenticSeal's `hygiene.yml` keeps its job `seal`.** `records-place.test.ts:16` and `daemon.test.ts:6904` write `PLUGIN_CHECK`, a step of the plugin's workflow whose job id is `seal`. That id is the plugin's, which the daemon reads by the script the step runs, and no case reads the id. *Removes* row 3 names Owlery's job alone. `view.test.ts:3373` names a check `seal` in a failed pull request of its own case. It names no job of Owlery's and stays.
- **The cases of the two titles stand in the group of the broken seal's titles.** "posts a ready pull request whose seal a later commit broke" gains a seal broken under a block with no `rules:` line, and a branch with two work items whose seals a commit broke, one block with a `rules:` line and one without. The title of each names no chain. "posts its verdict with --post" pins `Sealed by the owl chain at`, since its branch's block holds the daemon's lines, and the case of the plugin's form that phase 1 added keeps `Sealed at` for a block with no `rules:` line. No case builds two passing seals of two work items in one pull request. Both titles read every block through the one function `by_owl_chain`, and the mutant that reads any block for every block was red on the broken path (below).

**How the changed pins were seen red.** Each pin that a source text gives was shown red with `seal mutate`, putting the earlier text back into the source after the commit `587e0b8`. Each run restored its file, and `git status --short` printed nothing after the runs (executed).

| File | Mutant | Cases | Verdict |
|---|---|---|---|
| `pr-check/skills/code-review/scripts/chain_check.py` | a seal's title always `Sealed at` | `pr-check.test.ts`: "posts its verdict with --post", "posts a ready pull request whose seal a later commit broke", "passes the records the AgenticSeal plugin's process leaves", "keeps its exit code where GitHub refuses" | red |
| the same | a seal's title always the owl chain's | the same | red |
| the same | a broken seal's title always `Seal broken:` | the same | red |
| the same | a broken seal's title always the owl chain's | the same | red |
| the same | `by_owl_chain` reads `any` for `all` | the same | red |
| the same | `CHECK_NAME` back to the earlier name | the same | red |
| `apps/desktop/src/daemon/github.ts` | the heading back to the earlier one | `chain-command.test.ts` and `pull-request.test.ts`, whole | red |
| the same | the sentence's check back to the earlier name | the same | red |
| the same | the heading back to the earlier one | `chain-command.test.ts`, the cases named `body` | red |
| `apps/desktop/src/renderer/view.ts` | the sentence for Owlery's workflow back to the earlier name | `view.test.ts`, "tells an administrator how to make the seal check required" | red |
| the same | the sentence for `hygiene.yml` back to the earlier name | the same | red |
| `apps/desktop/src/daemon/records-place.ts` | the job's id back to `seal` | `records-place.test.ts`, "writes a workflow that fetches the check" | red |
| the same | the comment's check back to the earlier name | the same | red |
| `.github/workflows/owlery-seal.yml` | the job's id back to `seal` | `records-place.test.ts`, "holds Owlery's own workflow" | red |

The mutant that reads `any` was run once more with the test's output kept. The case failed at `pr-check.test.ts:516`, the title of the branch with two work items, which read `Seal of the owl chain broken:` where `Seal broken:` was expected (executed). That is the guard the case names. The two single-mutant runs whose filter names one case, `chain-command.test.ts -t body` and `records-place.test.ts -t "holds Owlery.s own workflow"`, were run on the unmutated file too, and each passed one case (executed), so their red is no empty filter. The last row is scenario 4's red, run again.

**The lines renamed with no case to turn red.** The stand-ins for the workflow in `chain-choice.test.ts`, `pane-chain.test.ts`, `role-bundle.test.ts` and `screenshots.test.ts` now hold `name: seal`, and no case reads their text. The check runs that `fixtures/sample-gh/gh`, `daemon.test.ts`, `chain.test.ts` and `view.test.ts` hand the daemon or the view are named `records` and `seal`. The daemon and the view pass a check's name through, so each rename moves the case's input and its expectation together. The census of the earlier name is the search of phase 2 at `587e0b8`: `git grep -n -w -e 'Owlery seal' -- . ':!seal/threads' ':!docs' ':!README.md' ':!README.ko.md' ':!pr-check/README.md'` printed nothing and exited 1 (executed). A name of two words can also break across a line, so `git grep -n -P -e 'Owlery\s*$'` over the same paths was run. Before the build it printed `github.ts:439`, the docstring of `sealSection`, which the phase rewrote, and after it prints only `records-place.ts:3`, where the next line names no check (executed).

**The phase's narrow run.** The spawn narrowed the run to the cases the phase touches, run one built-app file at a time. Before each run `pgrep -fl vitest` printed nothing (executed). Each run set `OWLERY_BACKGROUND=1` and ran in `apps/desktop` at `587e0b8`:

| Run | Result |
|---|---|
| `pnpm test` over `pr-check.test.ts`, `records-place.test.ts`, `pull-request.test.ts`, `chain-command.test.ts`, `pane-chain.test.ts` and `view.test.ts` | 6 files, 604 cases passed |
| `pnpm test` over `chain.test.ts` and `daemon.test.ts`, `-t` "the pull request stage of a work item's chain" and "the watch of an open pull request" | 19 passed, 486 skipped |
| `pnpm test test/records-dialog.test.ts` | 1 passed |
| `pnpm test test/chain-choice.test.ts` | 5 passed |
| `pnpm test test/role-bundle.test.ts`, `-t` "is what the built daemon launches a Claude Code pane on the owl chain" | 1 passed, 17 skipped |
| `OWLERY_SCREENSHOTS=1 pnpm test test/screenshots.test.ts`, the screenshots written into the crafter's scratch directory | 1 passed, 20 screenshots. The shot of the finished work item lists the checks `records` and `seal` under its pull request (read) |
| `pnpm test test/round-record.test.ts`, which loads `chain_check.py` | 11 passed |

Scenarios 1, 2 and 3 are cases of the first run, scenario 7 of the first two, and scenario 8 of the first and third. Scenario 4 passed in the first run and was red under the last mutant. The changed TypeScript files were typechecked with the app's compiler options, through a `tsconfig.json` in the scratch directory that extends `apps/desktop/tsconfig.json` and lists the three changed sources and the twelve changed test files: exit 0 (executed). The repository configures no linter and no formatter.

**What the next phase needs.** The documents still state the earlier names, as `frame/plan.md` *Phases* row 3 expects: `README.md:28`, `:30` and `:40`, their lines in `README.ko.md`, `pr-check/README.md:5`, `docs/product.md:72`, `docs/roadmap.md:85` and their Korean editions (executed: `git grep` on the earlier name and on `Seal broken:`). `README.md:32` and `:33` give the titles `Sealed at` and `Seal broken: a commit landed after`, which the check now gives only where a block it names holds no `rules:` line. *Scope* item 11 gives each of the two rows both of its titles.
