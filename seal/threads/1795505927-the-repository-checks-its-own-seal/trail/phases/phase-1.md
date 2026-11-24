# Phase 1: 1795505927-the-repository-checks-its-own-seal

## What this phase found

**The frame holds for this phase.** Each fact the phase stands on was opened at `80ccdd3` before the build. `git ls-files .github/workflows` printed `check.yml` and `hygiene.yml` (executed). `apps/desktop/package.json` gives the version `0.0.3`, and `records-place.ts#workflowText` writes the workflow `seal` with the one job id `seal` (read). The claim of `frame/plan.md` *Phases* row 1, that #181 changes no file of this phase but `apps/desktop/test/pr-check.test.ts`, was measured at the head of #181's branch, `2cb06da`, which is later than the `fec88dc` the plan names. Against the merge base with this branch, `git diff --stat` over `.github`, `apps/desktop/package.json`, `records-place.ts`, `records-place.test.ts` and `pr-check.test.ts` names `pr-check.test.ts` alone (executed). So the claim holds at `2cb06da` too.

**`frame/questions.md` Q1's default reaches no line of this phase.** The workflow is the bytes `workflowText("0.0.3")` gives at `80ccdd3`, and those bytes hold the job id `seal`. The plan's Delivers cell says that the workflow's text is `workflowText`'s as this phase finds it, and *Scope* item 3, which writes `records`, is phase 2's. So this phase writes no job id of its own, and the spawn's instruction to build on the default `records` had no line to reach. Judged against `frame/plan.md` *Phases* row 1.

**Decisions made while building, each with its grounds.**

- **The workflow was written by `workflowText` itself and not typed.** `records-place.ts` was bundled with the app's `esbuild` into the crafter's scratch directory, and `node` wrote `workflowText` of `package.json`'s version into `.github/workflows/owlery-seal.yml`. *Scope* item 8 asks for exactly the bytes the function gives, and a typed copy could differ in a byte no reader sees.
- **The workflow's case stands in `records-place.test.ts`, beside the case that pins `workflowText`'s text.** It reads `apps/desktop/package.json` and the workflow from the checkout, and reaches the workflow by `join(PR_CHECK, "..", WORKFLOW)`, the way the case beside it reaches `pr-check/`. The file's opening comment said that every case runs in a temporary repository and never in Owlery's own. It now says that one case reads Owlery's own workflow. *Scope* item 8 names the file.
- **The case of the plugin's form stands in `pr-check.test.ts`, before the case "passes the gate's record and the seal as the daemon writes them".** That is the group of cases that pass a sealed branch. The new case covers what no case of the file covered. Every helper wrote a routing with `Planning | the session`, so no case ran the frame arm, which reads a design's mark under `Planning | framer`. No case ran the rule-changes arm on a design. And no case wrote a commit in a record in its short form. The plugin's records write each commit as seven hex digits: `trail/gate.md` and `guarantee.md` of `seal/threads/1795400730-seal-back/` at `4a0aa93` (read). The case writes the round's `target:`, the gate's `run:` and the guarantee's `target:` that way.
- **The case's body has the shape of a body the plugin composed, with no seal section.** It holds a person's line, `## From the records`, and `## Broad gate` with the gate's run block, as the body of pull request #177 does (read: `gh pr view 177 --json body`). The check names the body as not read.
- **The case pins the posted check's conclusion and title, and not its name.** Phase 2 renames the check. The title `Sealed at <commit>` stays for a verdict block with no `rules:` line (`frame/design.md` *Data & interfaces*), so phase 2 keeps this assertion as it stands.
- **The helper `routing` takes the two parties as parameters.** They default to `the session`, so every earlier call writes the same text as before.

**A constraint found by trying: the design of *Scope* item 10 needs a section between `## Rule changes` and the framer's mark.** The case's first draft wrote the mark directly under the no-change block. The owned check refused the design with this line (executed):

```
seal/threads/1-x/frame/design.md:12  `## Rule changes` does not parse, so `settle` cannot group this design by the sections it names and the settle has to read it whole: a line that is not a field of the item above
```

The plugin's template, `templates/records/sdd-design.md` of plugin 0.38.7, puts `## Removes` between the two (read). A design written from it never meets that refusal. The case writes `## Removes` as the template does.

**How the cases were seen red.**

- **The workflow's case** failed before the file existed, with `ENOENT` on `.github/workflows/owlery-seal.yml`: 1 failed, 28 skipped (executed, `pnpm test test/records-place.test.ts -t "holds Owlery's own workflow"`). After the commit, `seal mutate` changed one line of the file, `name: seal` to `name: seals`. The case failed on the diff of that line (executed). That is scenario 4's red.
- **The case of the plugin's form** passed against the tree as it stood, since it pins a reading the check already makes. Contract rule 15 asks for its red with its guard removed, so `seal mutate` broke each reading it names, one at a time (executed). Each run was red, and each failing line names the guard:
  - `chain_check.py#frame`, `elif mark[1] != routing.BY_FRAMER:` made `==`. The case failed at its exit line, on the refusal "seal/threads/1-x/routing.md says `Planning | framer` and seal/threads/1-x/frame/design.md's mark says `framer`".
  - `pr-check/lib/fields.py`, `COMMIT = r"[0-9a-f]{7,40}"` made `{40}`. The case failed on three refusals: the round's `target:`, the gate's `run:` and the guarantee's `target:`, each "does not read whole".
  - The rule-changes arm: the first draft's refusal above is a red on that arm's reading of the design.

**Mutation runs.** The phase changes no source file. Its units are the workflow and the two readings the new case holds. Each run was executed after the commit `7a6a8d4`, with one `seal mutate` command each, and each restored its file: `git status --short` printed nothing after the runs (executed).

| File | Mutant | Cases | Verdict |
|---|---|---|---|
| `.github/workflows/owlery-seal.yml` | `name: seal` made `name: seals` | `test/records-place.test.ts`, "holds Owlery's own workflow" | red |
| `pr-check/skills/code-review/scripts/chain_check.py` | the framer's mark compared with `==` | `test/pr-check.test.ts`, the case of the plugin's form | red |
| `pr-check/lib/fields.py` | a commit read as 40 hex digits alone | the same case | red |

**Scenario 5.** At `7a6a8d4`, `git ls-files .github/workflows` prints `check.yml` and `owlery-seal.yml` (executed).

**The phase's narrow run.** `OWLERY_BACKGROUND=1 pnpm test test/records-place.test.ts test/pr-check.test.ts`, in `apps/desktop` at `7a6a8d4`: 2 files, 52 cases passed (executed). The set is the *Phase boundary* row of the plugin's `skills/verify/SKILL.md`. The cases of scenarios 4 and 6 are in these two files, and they are the two test files the phase changed. Four test files name `.github/workflows` (executed: `git grep -l -e '\.github/workflows' -- apps/desktop/test`). Of them, `daemon.test.ts`, `records-dialog.test.ts` and `view.test.ts` name the path as text of a temporary repository or of a plan, and only the new case of `records-place.test.ts` reads this repository's file (read). No test file of the repository reads the whole tree: `themes.test.ts` reads `docs/`, and `round-record.test.ts`, `record-blocks.test.ts` and `decision-record.test.ts` read `pr-check/` (read). Neither of the two files starts the built app (executed: `grep -l BuiltApp`). The two changed test files were typechecked with the app's compiler options, through a `tsconfig.json` in the scratch directory that extends `apps/desktop/tsconfig.json` and includes the two files alone: exit 0 (executed). The repository configures no linter and no formatter.

**What the next phase needs.**

- `pr-check.test.ts` is the one file this phase and #181 both change. #181's branch at `2cb06da` changes the import lines, three calls of `getSeal`, and adds a case before "says of a verdict that is not sealed". This phase changes the helper `routing` and adds a case before "passes the gate's record and the seal as the daemon writes them". The hunks do not overlap, so the merge of `release/v0.0.3` in phase 2 should meet no conflict there. No merge was run.
- After this phase, three statements of the tree say that the plugin's check runs here or that Owlery's own file was written at a connection. Each belongs to a later phase:
  - `pr-check/skills/code-review/scripts/chain_check.py:5` says that CI runs the check from `.github/workflows/hygiene.yml`. That is phase 2's *Scope* item 6.
  - `docs/architecture.md:265` and its Korean edition say that the plugin's check and Owlery's both read this repository's records. That is phase 3's *Scope* item 14.
  - `.github/workflows/owlery-seal.yml:6-8` says that Owlery wrote the file when the repository was connected and that its line moves when a person edits it. In this repository a pull request wrote the file, and the case moves it with the version. The file has to be `workflowText`'s bytes, so this phase leaves it. Phase 2 rewrites `workflowText`'s opening comment for *Scope* item 3, and it can give a sentence that holds for this repository too.
