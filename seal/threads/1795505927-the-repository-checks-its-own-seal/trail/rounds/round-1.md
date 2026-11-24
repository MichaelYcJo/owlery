# Review round 1: 1795505927-the-repository-checks-its-own-seal

```seal
target: 8a68af3 against release/v0.0.3
```

This is the first round, so no earlier round carries a coordinate or a verdict, and every fact below was established in this round. The target is the diff `66b3991..8a68af3`: `66b3991` is the head of `release/v0.0.3`, which the merge `e12871f` brought into the branch. The work item's `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and the four phase records were read whole at `8a68af3`. No `pr.<lang>.md` stands, and none is owed: `Commit and pull request language` is English. The issue was read with `gh issue view 146 --json title,body` (executed). No `seal/parity.json` stands, so no parity comparison is owed.

The code holds to the frame. The check is named `seal`, the job `records`, the body's heading `## Seal`, and the title names the owl chain only where every verdict block it names holds a `rules:` line. This repository's workflow is the bytes `workflowText("0.0.3")` gives, and the owned check passes this branch's own records, which the AgenticSeal plugin's process wrote. Two findings remain, both in what the build tells a reader. The pull request's text names the wrong workflow as the one that checks this pull request (finding 1). A phase record keeps a test stand-in's job id on a claim about the plugin's template that the template contradicts (finding 2).

## Findings

### 1. `pr.md` says this pull request is checked by the release branch's workflow, but GitHub runs the pull request's own workflow

```seal
severity: should
location: `seal/threads/1795505927-the-repository-checks-its-own-seal/pr.md:14`
evidence: read `seal/threads/1795505927-the-repository-checks-its-own-seal/pr.md:14`, `seal/threads/1795505927-the-repository-checks-its-own-seal/frame/design.md:119`, `seal/threads/1795505927-the-repository-checks-its-own-seal/frame/plan.md:65`, `.github/workflows/owlery-seal.yml:33-40`
```

Why it matters: `pr.md` line 14 reads "This pull request is checked by `release/v0.0.3`'s workflow, so its check posts under the earlier name `Owlery seal` this once". The workflow `release/v0.0.3` holds at `66b3991` is `hygiene.yml`, the plugin's. On a `pull_request` event GitHub reads the workflow files of the pull request's merge commit, and this pull request deletes `hygiene.yml` and adds `owlery-seal.yml`. So the workflow that runs is this pull request's own `owlery-seal.yml`, and only the check script it clones comes from `release/v0.0.3` (`.github/workflows/owlery-seal.yml:33-40`). The frame states it that way: scenario 11 (`frame/design.md:119`) expects the workflow `seal` with its job `records` and no run of `hygiene`, and `frame/plan.md:65` says the check comes from `release/v0.0.3`. The owner reads `pr.md` in the pull request's body and, at Q2's measurement, compares it with the checks GitHub lists. As written, the sentence leads the reader to expect a run of `hygiene`.

The fix touches only this sentence. No other statement of the fact is wrong: `frame/plan.md` *Technical context* and *Operational impact* and `frame/design.md` scenario 11 name the check, not the workflow.

```markdown
- This pull request runs its own `.github/workflows/owlery-seal.yml`, which fetches the check from `release/v0.0.3`, so the check posts under the earlier name `Owlery seal` this once; from the next pull request on, the check is `seal`. Requiring `seal` on the branch is the owner's step.
```

### 2. Phase 2 kept the test stand-ins' job id `seal` on the claim that the id is the plugin's, but the plugin's template names its job `hygiene`

```seal
severity: should
location: `apps/desktop/test/records-place.test.ts:15-16`, `apps/desktop/test/daemon.test.ts:6904`, `seal/threads/1795505927-the-repository-checks-its-own-seal/trail/phases/phase-2.md:15`
evidence: read `seal/threads/1795505927-the-repository-checks-its-own-seal/trail/phases/phase-2.md:15`, `apps/desktop/test/records-place.test.ts:15-16`, `apps/desktop/test/daemon.test.ts:6904`, `apps/desktop/src/daemon/records-place.ts:22-24`; executed `git show 66b3991:.github/workflows/hygiene.yml`, which prints `jobs:` and `hygiene:` at lines 55 and 56, and `grep -n -A1 '^jobs:'` over the plugin's `templates/setup/hygiene.yml` at 0.38.7, which prints `hygiene:` at line 59
```

Why it matters: The claim is at `trail/phases/phase-2.md:15`: "`records-place.test.ts:16` and `daemon.test.ts:6904` write `PLUGIN_CHECK`, a step of the plugin's workflow whose job id is `seal`. That id is the plugin's". What the tree shows: the `hygiene.yml` this pull request deletes, which `seal pr-checks install` wrote from the plugin's 0.38.4 template, opens its job as `jobs:` and `hygiene:` (lines 55 and 56 at `66b3991`). The plugin's 0.38.7 template does the same at lines 58 and 59. So no plugin workflow names a job `seal`. The docstring at `records-place.test.ts:15` repeats the claim: "as its 0.38.4 template writes it". The two stand-ins date from `cc0b938`, before this work. This work made the false id matter, because `seal` is now the name of Owlery's posted check. The phase kept the id on this claim, and *Removes* row 3, which names Owlery's job alone, was read through it.

What the phase concluded still holds on its other ground. The daemon tells AgenticSeal's workflow by the script path it runs (`records-place.ts:22-24`, `PLUGIN_CHECK`), and no case reads a job id. So the fix moves no assertion. It makes the two stand-ins and the docstring true, and it removes from the tests the last job id `seal` that the template never wrote. No case of this work holds a frame fact that depends on the id, so this is not a regression-test gap. It is the false claim of *The record*, "a finding like any false claim".

Change the job id in both stand-ins. The docstring then holds as written:

```ts
// apps/desktop/test/records-place.test.ts:16
const PLUGIN_CHECK = 'jobs:\n  hygiene:\n    steps:\n      - run: |\n          python3 "$RUNNER_TEMP/agentic/skills/code-review/scripts/chain_check.py" \\\n            --baseline "origin/${{ github.base_ref }}"\n';

// apps/desktop/test/daemon.test.ts:6904
const PLUGIN_CHECK = 'jobs:\n  hygiene:\n    steps:\n      - run: python3 "$RUNNER_TEMP/agentic/skills/code-review/scripts/chain_check.py"\n';
```

The claim at `trail/phases/phase-2.md:15` stays as the phase wrote it. The fix pass's close names the correction, since a phase record is history and is not rewritten.

## Confirmations

What matched: *Scope* item 1 and scenario 1. `chain_check.py#CHECK_NAME` reads `"seal"` (`pr-check/skills/code-review/scripts/chain_check.py:2557`). The usage text, `post`'s docstring and `main`'s docstring name the check `seal`. `pr-check.test.ts` pins the request's `name` and the printed `posted` line. Executed: the narrow run below passed.

What matched: *Scope* item 2, *Data & interfaces* and scenario 2. `outcome` titles a broken seal from `judged.broken`, which now holds each broken work item's newest verdict block (`chain_check.py:2526`), and a seal from every block of `judged.verdicts` (`chain_check.py:2601-2606`). Both paths pass their blocks to the one function `by_owl_chain`, which is `all(FIELDS.RULES in block.fields ...)` (`chain_check.py:2609-2614`). So each title names the owl chain only where every block it names holds a `rules:` line. No other reader of `broken` or of the removed `shortened` stands in `pr-check/` or `apps/desktop/` (executed: `git grep -n -e 'shortened' -e '\.broken\b' -e 'by_owl_chain' -- pr-check apps`, outside `chain_check.py`, printed only unrelated words). `gaps.md` hands this round the title of a passing seal over two work items, one block with a `rules:` line and one without. Read: the success path passes every judged block to `by_owl_chain` and `sealed_commits` alike, so that title is `Sealed at`. The `all` is held by the case of two broken seals (`pr-check.test.ts:505-516`), and the success path shares the function. The path's own list has no case with two work items, which is a gap in a case that holds no new behaviour beyond the shared function, so it is named here and is no finding.

What matched: the `rules:` line tells the owl chain's block from the plugin's. Owlery writes it in every verdict it writes (`apps/desktop/src/daemon/seal-records.ts:234`). The chain command refuses to record a verdict where its build holds no version (`apps/desktop/src/daemon/chain-command.ts:369`). The plugin's reader at 0.38.7 knows no `rules:` key: `grep` of its field constants printed none of `built-by:`, `judged-by:`, `model:` and `rules:` (executed). So *Compatibility with AgenticSeal*'s sentence that the plugin's check refuses `built-by:` and `rules:` holds.

What matched: *Scope* items 3 and 8 and scenarios 3 and 4. `workflowText` writes the job id `records`, the workflow name `seal`, and the comment of *Scope* item 3 (`apps/desktop/src/daemon/records-place.ts:63-88`). `.github/workflows/owlery-seal.yml` equals `workflowText` for `apps/desktop/package.json`'s version: the case "holds Owlery's own workflow" compares the two whole with `toBe` (`apps/desktop/test/records-place.test.ts:830-833`) and passed in the narrow run (executed).

What matched: *Scope* item 4 and scenario 7. `github.ts#sealSection` writes `## Seal` and the sentence that names the check `seal` (`apps/desktop/src/daemon/github.ts:443-445`). That a body an earlier build wrote is still rewritten, whatever heading it holds, is pinned by `pull-request.test.ts:482`, which replaces a section whose only line between the markers is `old`. This is the reading phase 2 claimed, and it holds.

What matched: *Scope* items 5, 6, 7 and 9 and scenarios 5 and 9. `view.ts#requiredCheck` names `seal` in both sentences (`apps/desktop/src/renderer/view.ts:2247-2249`). `chain_check.py:5` names `.github/workflows/owlery-seal.yml`. The stand-ins and check runs of *Scope* item 7 are renamed as the item says (read in the diff). Executed at `8a68af3`: `git grep -n -w -e 'Owlery seal' 8a68af3 -- . ':!seal/threads'` printed nothing and exited 1. `git ls-tree --name-only 8a68af3 .github/workflows/` printed `check.yml` and `owlery-seal.yml`. Phase 2 also searched for the name broken across a line, but only outside the documents. This round ran `git grep -n -P -e 'Owlery\s*$'` over the whole tree outside `seal/threads/`, and no line it printed is followed by `seal`.

What matched: *Scope* item 10 and scenario 6, and the issue's *Done when* that the owned check still reads this repository's records. The case of the plugin's form (`apps/desktop/test/pr-check.test.ts:578-607`) runs the frame arm under `Planning | framer`, the rule-changes arm and commits written short, and passed in the narrow run (executed). Beyond the case, this branch's own records were run through the owned check as a ready pull request, with the check of `8a68af3` and with the check `release/v0.0.3` holds at `66b3991`, the one that will judge this pull request (*Probes*). Each refused only the three records not written yet: no round record at `8a68af3`, no `trail/gate.md` and no `guarantee.md`. No line of `frame/design.md`, `routing.md` or the phase records was refused, and the body was named as not read. Neither check judged #181's work item, though this branch changes its `changelog.md`, as `frame/design.md:57` says.

What matched: *Scope* items 11 to 17 and scenarios 10 and 12, which `gaps.md` hands this round to read, in both editions. `README.md` and `README.ko.md` *The seal check on GitHub* name the check `seal` and the job `records`, give both titles in the rows of a seal and of a broken seal, and say that an administrator requires `seal`. `pr-check/README.md:5` names the check `seal`. `docs/product.md:72` and its Korean edition change the name and no other word. `docs/architecture.md` *Compatibility with AgenticSeal* and *AgenticSeal과의 호환* keep their first two sentences and state the five things of *Scope* item 14 in the same order, with the two `check:` paths. `docs/roadmap.md:39` and `:85` and their Korean lines state what *Scope* items 15 and 16 give. #181's fragment loses exactly the two sentences of *Scope* item 17. Executed: `git grep -n -e 'Owlery seal' -e 'until #146 lands' 8a68af3 -- seal/threads/1795497826-pane-carries-the-chain/changelog.md` printed nothing and exited 1. The counts of headings and table rows are the broad gate's, and this round did not run them.

What matched: each quote of `pr.md` stands word for word at the coordinate it names, at `frame/design.md:75`, `:76`, `:77`, `:82`, `:83`, `:91` and `:100` (read). The statements of `changelog.md`, `gaps.md`, `frame/questions.md` and the frame's undated sentences agree with the target, except `pr.md:14` (finding 1). One sentence was weighed and left without a finding. `docs/roadmap.md:85` names the check `seal` "from" #146's pull request "on", while `frame/plan.md:65` says that this one pull request's check posts under the earlier name. *Scope* item 16 words the row that way, and phase 3 judged it to name whose check judges. The target tree does not contradict the row: the name posted on this pull request comes from `release/v0.0.3`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether GitHub runs `owlery-seal.yml` on this pull request, the job `records` passes with the check of `release/v0.0.3`, and the check is posted (scenario 11, Q2) | `seal/threads/1795505927-the-repository-checks-its-own-seal/frame/questions.md:21` | the orchestrator, with `gh pr checks` once the pull request is ready |
| The full suite, the whole typecheck, and the counts of headings and table rows over every document pair. This round ran four test files and labels the suite `unverified` | `seal/config.json` `Broad gate` | the orchestrator's broad gate |
| The cases of `view.test.ts`, `chain.test.ts`, `daemon.test.ts`, `chain-choice.test.ts`, `pane-chain.test.ts`, `records-dialog.test.ts`, `role-bundle.test.ts` and `screenshots.test.ts` that this diff renamed. This round read them in the diff and did not run them | `apps/desktop/test/` | the orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 pnpm test test/records-place.test.ts test/pr-check.test.ts test/pull-request.test.ts test/chain-command.test.ts`, in `apps/desktop` of a `git clone --no-local` at `8a68af3`, after `pgrep -fl vitest` printed nothing | 4 files, 96 cases passed, exit 0. None of the four starts the built app |
| `python3 pr-check/skills/code-review/scripts/chain_check.py --baseline 66b3991` in the clone at `8a68af3`, with `GITHUB_HEAD_REF` naming this branch and `GITHUB_EVENT_PATH` naming a payload of a ready pull request whose body is one line; then the same with a draft payload; then both again with `pr-check/` as `66b3991` holds it | Ready: exit 1 with both checks. Each refused only `routing.md` for no `round-N.md`, `trail/gate.md` as not carried and `guarantee.md` as not carried, and named the body as not read. Draft: the same lines, exit 0. No `--post` was passed and nothing was sent |
