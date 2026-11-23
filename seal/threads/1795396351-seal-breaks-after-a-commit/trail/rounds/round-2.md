# Review round 2: 1795396351-seal-breaks-after-a-commit

```seal
target: 6027f8d, fixes afa0566..6027f8d
```

This is a verifying round. It answers the two findings round 1 closed, and its code is the diff of the fixes after round 1's target: the framer's fold at `3b943c4`, the crafter's fix pass `80a440c..3f64f05` with its close blocks at `f7f3718`, and the orchestrator's repair of `pr.md` at `6027f8d`. The code under review is `pr-check/skills/code-review/scripts/chain_check.py#since_sealed`, `#since_sealed_reason` and `#guarantee`, the call in `#judge`, and the new cases of `apps/desktop/test/pr-check.test.ts`. The round worked in a `git clone --no-local` of the worktree at `6027f8d`, under the round's scratch directory, with `node_modules` linked from the worktree and `chain_check.py` run under a `PATH` of a folder holding Python 3.12, `/usr/bin` and `/bin`.

The work item's records were read whole at `6027f8d`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. The phase records were searched for statements on a merge of the base and on a fork, and hold none (executed: `grep -n -i` on `trail/phases/phase-4.md`). No `seal/parity.json` stands.

Carried from round 1, and not re-derived: the merge resolution at `a53b22b`, the daemon's reading of *Scope* items 1 to 5, the window's places and the screenshots, which the fix diff does not touch. Round 1's five rows of `## Not judged` stand as round 1 wrote them. Re-opened because the fix stands on them: `apps/desktop/src/daemon/worktrees.ts:969-971` (`pathsOfCommits` runs `git log --format= --name-only -z <from>..<to>`) and `apps/desktop/src/daemon/chain.ts:303-316` (`stepOwed`, its `outside` test through `inFolder` at `:310`). Round 1's probe was written again from its `## Probes` row, as histories A to D below.

## Findings

### 1. The plan says a checkout with no fork of HEAD and the baseline passes a merge after the seal, and such a checkout stops the check before any arm runs

```seal
severity: should
location: `seal/threads/1795396351-seal-breaks-after-a-commit/frame/plan.md:47`, `seal/threads/1795396351-seal-breaks-after-a-commit/frame/design.md:125`
evidence: executed `node scripts/test-in-electron.mjs --project unit test/test_tmp_round2.test.ts` in the round's scratch clone at 6027f8d (see Probes, history G); read `pr-check/skills/code-review/scripts/chain_check.py:2370-2381`, `pr-check/skills/code-review/scripts/chain_check.py:1104-1106`, `apps/desktop/src/daemon/records-place.ts:92-94`
regression: round-1#1
```

Why it matters: the row is the frame's record of what the chosen approach costs. A framer or a sealer reading it learns of a fail-open hole in the check that does not exist, and may build a guard against it or weigh the approach by it.

Grounds:

- The unit is the row of `frame/plan.md` *Alternatives considered* that the framer's fold at `3b943c4` rewrote for round 1's finding 1. `frame/design.md:125` (*Scope* item 9) says "Where git names no fork of HEAD and the baseline, the arm walks nothing of the base", which is true of `since_sealed` read alone (`chain_check.py:1104-1106`). The fold carried it into the row's failure scenario as "a checkout in which git names no fork of HEAD and the baseline walks nothing of the base and passes such a merge". The defect came from reading the arm without `judge`, which calls it.
- `judge` reaches the guarantee arm only after `changed` has diffed `<baseline>...HEAD` (`chain_check.py:2370-2381`). Where git names no fork, that diff fails, `judge` prints "cannot diff against", and returns `COULD_NOT_RUN`. `outcome` gives exit 2 and the failed title "The seal check could not run".
- Probe history G, executed: a sealed branch judged against an orphan baseline. `git merge-base HEAD elsewhere` exited 1 with no output, and the check exited 2 with "chain-check: cannot diff against elsewhere". The check failed closed.
- The workflow Owlery writes checks out with `fetch-depth: 0` (`records-place.ts:92-94`), so the checkout holds the whole history of the pull request's head and of the baseline. The fork is then missing only where the two branches share no commit, and there the check could not run.
- So `since_sealed`'s answer for a missing fork (`chain_check.py:1105-1106`) has no caller that reaches it today. That is no defect: it is a defence the docstring states.

The row's failure scenario cell of `frame/plan.md:47`, rewritten:

```markdown
| The guarantee arm of the check compares two trees, and walks the base's commits a merge brought after the seal (chosen, replaces the walk of the branch's commits in that arm) | The first failure scenario above: a merge of the base now fails a check that passed it. The walk starts from the fork of HEAD and the baseline, so it needs the baseline's history in the checkout. The workflow Owlery writes fetches it whole (`records-place.ts#workflowText`, `fetch-depth: 0`). Where git names no fork, `chain_check.py#judge` stops before any arm, since `#changed` cannot diff the baseline against HEAD, and the check fails as "The seal check could not run" | Chosen. ...the verdict cell as it stands... |
```

The sentence of `frame/design.md:125`, rewritten in place:

```markdown
Where git names no fork of HEAD and the baseline, the check stops before the arm, since `chain_check.py#changed` cannot diff the baseline against HEAD, and it fails as "The seal check could not run". The arm itself walks nothing of the base there.
```

The snippet reaches both statements of the fact in the frame. The docstring of `since_sealed` (`chain_check.py:1086-1087`) states the function alone, and it is true as it stands.

### 2. Two branches of the new walk are held by no case: the work item's own directory, which keeps the check with the daemon, and the line for a newest block that is no seal

```seal
severity: should
location: `pr-check/skills/code-review/scripts/chain_check.py:1110`, `pr-check/skills/code-review/scripts/chain_check.py:1134-1139`, `apps/desktop/test/pr-check.test.ts:696`, `apps/desktop/test/pr-check.test.ts:522`
evidence: executed `node scripts/test-in-electron.mjs --project unit test/pr-check.test.ts` in the round's scratch clone with `chain_check.py:1110` reading `if path:` (see Probes, the mutant); executed `node scripts/test-in-electron.mjs --project unit test/test_tmp_round2b.test.ts` (see Probes, history H); executed `grep -rn "brought after the commit it names" apps/desktop/test/`, which printed nothing
regression: round-1#1
```

Why it matters: the exclusion of the work item's directory is the one line of the walk that keeps the check on the daemon's answer when a base's commits touch that directory alone. A later edit that drops it makes the check fail a head the app shows sealed, and no case says so. The second branch is a line a person reads in the posted check's summary, and contract rule 14 asks that such a line be pinned.

Grounds:

- The unit is `since_sealed`'s walk and the two `brought` branches of `since_sealed_reason`, added by the fix pass at `80a440c`. `frame/design.md:125` (*Scope* item 9) says the arm refuses where a commit of the base that a merge brought after the seal "touched a path outside the work item's directory". The fix built that test at `chain_check.py:1110`, as `chain.ts#stepOwed` reads it through `inFolder` (`chain.ts:310`). The fix pass's close names six mutants, and none removes that test.
- Probe history H, executed: a base that added and removed `seal/threads/1-x/notes.md`, merged after the seal. The daemon read `sealed`, and the check exited 0.
- Executed: with `chain_check.py:1110` changed to `if path:`, all 22 cases of `test/pr-check.test.ts` passed. That mutant fails history H, which the daemon reads `sealed`.
- `chain_check.py:1134-1139` gives the line for a newest block that is no seal, after which a merge brought a commit of the base: "the guarantee is behind HEAD: a commit of the base that a merge brought after the commit it names, ...". Its twin for a path that differs is pinned at `pr-check.test.ts:522`. A search of the tests for the new line printed nothing.

One row more in scenario 9's table, after the row at `pr-check.test.ts:696`. The helpers `write`, `commitAll` and `git` stand in that case's scope:

```ts
      ["a merge of a base whose commits add and take back a file of the work item's directory alone", ({ repo }) => {
        git(repo, "checkout", "--quiet", "main");
        write(repo, "seal/threads/1-x/notes.md", "notes\n");
        commitAll(repo, "docs: notes");
        git(repo, "rm", "--quiet", "seal/threads/1-x/notes.md");
        git(repo, "commit", "--quiet", "-m", "revert: notes");
        git(repo, "checkout", "--quiet", "feature");
        git(repo, "merge", "--quiet", "--no-ff", "--no-edit", "main");
      }, "sealed"],
```

And, after the withheld history at `pr-check.test.ts:515-523`, in the same case. `reviewed()` builds the branch `feature` from `main` (`declared`, `pr-check.test.ts:123-126`), as `mergeAsSealed` expects:

```ts
    // A withheld verdict and a merge of the base after it whose commits leave the tree as it was: no seal broke, and the arm names the path the base's commit touched.
    const withheldMerged = reviewed();
    gated(withheldMerged);
    guaranteed(withheldMerged, section(1, withheldMerged.gate, ...DAEMONS_LINES).replace("Verdict: sealed", "Verdict: withheld reason: x"));
    mergeAsSealed(withheldMerged.repo, "revert");
    expect((await run(withheldMerged, { body: null, args: ["--post"], env })).exit).toBe(1);
    expect(last()).toMatchObject({ conclusion: "failure", output: { title: "No seal at the head commit" } });
    expect(last()?.output.summary).toContain(`- seal/threads/1-x/guarantee.md:0  the guarantee is behind HEAD: a commit of the base that a merge brought after the commit it names, \`${withheldMerged.gate.slice(0, 7)}\`, touches \`other.txt\`, outside the work item's records\n`);
```

Each is shown red before it is planted: the row with `chain_check.py:1110` reading `if path:`, and the withheld history with the branch at `:1134-1139` removed.

## Confirmations

```seal
confirms: round-1#1
```
What holds: the guarantee arm now gives the daemon's answer on round 1's histories A and B, and still passes history D. Executed, the probe of round 1 written again and run at `6027f8d`: A (a merge of a base whose change the branch already held) gave the daemon `broken` and the check exit 1, with "the seal is broken: a commit of the base that a merge brought after the sealed commit `<7>` touches `y.txt`, outside the work item's records; a new seal is owed at HEAD". B (a base that gained a commit and its revert) gave `broken` and exit 1, naming `z.txt`. D (the sealed head) gave `sealed` and exit 0. Three histories more found no over-refusal and no miss: E, a merge of the base before round 1 and the seal, gave `sealed` and 0; F, a base that moved after the seal with no merge, gave `sealed` and 0; K, history B with the baseline moved on past the merged commit, gave `broken` and 1. In each of A, B, D, E, F and K, `git diff --name-only` between the sealed commit and HEAD printed the two closing records alone.

The closed claims were checked against the code. The walk is `git log --format= --name-only -z <fork> ^<sealed>`, the paths `pathsOfCommits` reads, and it runs only after the trees answered nothing (`chain_check.py:1100-1112`). `judge` passes `args.baseline` (`:2513`). `guarantee` hands every answer to `behind`, and `judge` fills `broken` from it where the newest block reads `sealed` (`:2518-2524`), so the title is "Seal broken: a commit landed after" and the commit. The close claims both new cases were red against the arm at `3b943c4`. Executed: with `chain_check.py` as it stood at `2455864`, which `3b943c4` did not change, the two cases failed at `pr-check.test.ts:636` and `:733`, each on the missing `brought` line. With the file at `6027f8d`, all 22 cases of `test/pr-check.test.ts` passed. The close's six `seal mutate` mutants were read and not run again.

The kind `brought` and its sentence agree with what the frame and the documents now say. *Scope* item 8 (`frame/design.md:124`) names the first path that differs, or, where none differs, the first path a commit of the base touched, and the code answers `differs` before it walks (`chain_check.py:1100-1103`). *Scope* item 9, *Data & interfaces* (`frame/design.md:224`), *Removes* (`:280`, `:284`), the architecture `to:` and its Korean twin (`:270`, `:275`), `pr-check/README.md:5`, the changelog bullet (`changelog.md:11`) and `pr.md:9` each say the base's commits a merge brought after the seal are read. `README.md` and `README.ko.md` keep the row "a merge of the base among them", which now holds for A and B.

The new case at `pr-check.test.ts:629` was read against its group. It holds the posted title for A and B and that the rounds arm and the gate arm print nothing, which no other case holds. The two rows at `:695-696` hold the daemon's answer beside the check's, which is scenario 9's fact.

```seal
confirms: round-1#2
```
What holds: the four `to:` texts (`frame/design.md:259`, `:265`, `:270`, `:275`), *Scope* item 11 (`:127`), *Out of scope* (`:154`), `frame/plan.md:26` and `:31`, the changelog bullet, both READMEs and `pr-check/README.md` no longer say that one rule decides. Each says that the two readers are held to one answer for what lands after a seal the app gave, and that records no chain of the app commits can be judged apart. `gaps.md:22` is closed with the word `closed`, and no row left the memo (read: the diff of `gaps.md` over the fix range). README.md and README.ko.md keep 6 headings and 16 table rows each, as the close says (read).

The class "records the daemon's chain does not write" holds for each of round 1's five histories, by reading `chain.ts:303-316` and `daemon.ts:2502-2535`:

- An open question committed before the seal: `stepOwed` answers `parked` first (`chain.ts:304`), so no chain seals with it standing. The one question a chain commits beside a verdict is the one `runSeal` parks with an `undecided` verdict, and that verdict is no seal.
- A decision reversed before the seal: `stepOwed` owes a fix pass (`chain.ts:308`), so no chain seals with it standing.
- A last round with a `fixed` finding: `stepOwed` owes a round for any finding closed `fixed` or `rejected`, wherever it is located (`chain.ts:309-311`). So the chain's seal always follows a round with no such close. A close block appended after the seal changes a round record, which is no closing record, and both readers then read the seal broken.
- A later gate run on a head the seal covers: `stepOwed` owes the gate only where it does not hold (`chain.ts:312-313`), and at a sealed head only closing records follow the gate's commit, so no chain runs that gate. Probe history C, run again: the daemon read `broken` and the check exited 0, so the two answers stand, inside the class.
- A judge that built: `runSeal` names the sealer's own session as `judgedBy` (`daemon.ts:2530`) and the sessions of the commits' trailers, and "the session" where the routing names it, as `builtBy` (`daemon.ts:2528`).

History C is hand-written records that land after a seal the app gave. So it falls under the first sentence of each statement ("what lands after a seal the app gave") and under the second ("records that no chain of the app commits"). The second stands next to the first in every statement and reads as its exception, so each statement has one reading.

What matched: `gaps.md:26` says the fix pass ran `test/pr-check.test.ts`, the unit files that read `pr-check/`, and the typecheck. Round 1's close blocks, which the row cites, name `pr-check.test.ts` and `seal mutate` and no typecheck, so the citation holds part of the claim. The row labels the whole suite, the typecheck and the documents' checks at the fix pass's tree as unverified and names the orchestrator, which is honest.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a history with two forks of HEAD and the baseline, where the base merged part of the branch and the branch then merged the base, has `git merge-base` name one fork and the walk miss a commit of the base that the daemon's rounds read. `git merge-base` without `--all` prints one. No probe built such a history | `pr-check/skills/code-review/scripts/chain_check.py:1104` | the orchestrator, by judging whether such a history is in reach of a work item's branch |
| The suite, the typecheck and the documents' checks of the `Broad gate` key at `6027f8d`. This round ran `test/pr-check.test.ts` and its own probes alone | `seal/threads/1795396351-seal-breaks-after-a-commit/gaps.md:26` | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs --project unit test/pr-check.test.ts`, from `apps/desktop` of the round's scratch clone at 6027f8d | Exit 0, 22 cases passed |
| The same file with `-t` naming the two new cases, with `pr-check/skills/code-review/scripts/chain_check.py` checked out at 2455864 in the clone, then restored to 6027f8d | Exit 1, both failed: `pr-check.test.ts:636`, "same file", and `:733`, the row of the file the branch committed before the seal, each on the missing `brought` line |
| `node scripts/test-in-electron.mjs --project unit test/test_tmp_round2.test.ts`, the probe writing its answers to a file in the round's scratch directory | Exit 0. A: daemon `broken`, "Review round 2 is owed after the sealed commit", check exit 1, the `brought` line naming `y.txt`. B: `broken`, exit 1, naming `z.txt`. C: `broken`, "The sealer's session is owed after the sealed commit", exit 0. D: `sealed`, exit 0. E, a merge of the base before the seal: `sealed`, exit 0. F, a base that moved after the seal with no merge: `sealed`, exit 0. K, B with the baseline moved past the merged commit: `broken`, exit 1, naming `z.txt`. G, an orphan baseline: `git merge-base HEAD elsewhere` exit 1 and no output, the check exit 2 with "chain-check: cannot diff against elsewhere" |
| `node scripts/test-in-electron.mjs --project unit test/test_tmp_round2b.test.ts`, the probe writing its answer to a file in the round's scratch directory | Exit 0. H, a base that added and removed `seal/threads/1-x/notes.md`, merged after the seal: daemon `sealed`, check exit 0, the two trees differing in the two closing records alone |
| `node scripts/test-in-electron.mjs --project unit test/pr-check.test.ts`, with `chain_check.py:1110` edited in the clone to `if path:`, then restored to 6027f8d | Exit 0, 22 cases passed: no case holds the exclusion of the work item's directory |
