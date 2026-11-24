# Review round 2: 1795497826-pane-carries-the-chain

```seal
target: fabfd9e, fixes cd3b5a1..fabfd9e
```

The range is `cd3b5a1..fabfd9e`. `921e6b1` commits round 1's record. `f013d37` closes finding 1, `f69c268` closes finding 2, and `fabfd9e` commits the close blocks. The code under review is the fix diff: `apps/desktop/src/daemon/chain.ts`, `apps/desktop/test/chain-command.test.ts`, `docs/roadmap.md` and `docs/roadmap.ko.md`.

Carried from round 1 without a fresh check: where the callers of `baseOf` stand, where ground 4 of the roadmap stands (`docs/roadmap.md:39`, `docs/roadmap.ko.md:39`), and round 1's reading of the screenshots and of the merge of `daemon.ts`. The fix diff touches none of the last two. Every verdict below was reached again at `fabfd9e`. The callers were read again there, and the closed findings' probe was run again.

## Findings

### 1. No case fails where a base recorded as a branch's name stops being read from the commit it and the head last shared

```seal
severity: should
location: `apps/desktop/src/daemon/chain.ts:288`, `apps/desktop/test/chain-command.test.ts:225`
evidence: executed `node scripts/test-in-electron.mjs test/chain-command.test.ts test/chain.test.ts test/seal-state.test.ts -t "base|rebase"` and `node scripts/test-in-electron.mjs test/test_tmp_branch_base.test.ts`, each against a mutant of `chain.ts:288` in the round's clone; read `trail/phases/phase-2.md`
```

Why it matters: `f013d37` splits the commit `baseOf` returns into two arms, at `chain.ts:288`. A base recorded as a commit is that commit. A base recorded as a branch's name is `sharedCommit(worktree, recorded, head)`, the commit the branch and the head last shared. A case holds only the first arm: the one `f013d37` adds at `chain-command.test.ts:191`.

This round replaced the second arm with `commit`, the base branch's tip, in its clone. All 20 cases whose names hold "base" or "rebase", in `chain-command.test.ts`, `chain.test.ts` and `seal-state.test.ts`, passed (Probes, row 3). A probe then ran the following steps:

1. It started a chain with `--base release/x`.
2. It recorded round 1 against `release/x`.
3. It added a commit to `release/x` and left the branch where it was.

Under the mutant, `owed` refused with "The branch no longer holds 336c819, the commit its chain reads it against, ..." and `BASE_RECORDED`. At `fabfd9e` the same steps owe the gate (rows 4 and 5).

This is the ordinary case in this repository: `release/v0.0.3` gains a commit each time another work item's pull request merges into it. A change that lost the arm would refuse every chain whose base branch moved after round 1. That holds in a pane and in the daemon, since `Daemon#chainBase` (`daemon.ts:2399-2403`) hands `baseOf` the same recorded name. No case would fail. The cases that move a base, `chain.test.ts:2853` and `:3001`, rebase the branch onto it, so the tip and the last shared commit are one commit there.

The gap is older than `f013d37`. `trail/phases/phase-2.md` *What was seen red* lists the mutants phase 2 ran on `chain.ts`, and none of them touches the last shared commit. The fix pass made the arm a unit of its own. This round reviews it as one, so the finding takes no `regression:` line.

```ts
// apps/desktop/test/chain-command.test.ts, after the case at line 225
it("goes on where the base branch round 1's record names gained a commit the branch does not hold, reading the branch from the commit the two last shared", async () => {
  const on = commandOn(cleanups);
  git(on.repo, "branch", "release/x", on.main);
  await on.said(["start", "--base", "release/x"]);
  const first = await on.said(["owed", "--base", "release/x"]);
  await on.said(["round", on.answer("round-1.md", clean(givenRound(read(first.prompt)))), "--base", "release/x"]);
  // Another pull request merges into the base branch after round 1, and this branch does not take it.
  git(on.repo, "checkout", "--quiet", "release/x");
  write(on.repo, "other.txt", "Another work item\n");
  commitAll(on.repo, "feat: another work item");
  git(on.repo, "checkout", "--quiet", BRANCH);
  expect(await on.said(["owed"])).toEqual({ step: "gate", round: 1, head: head(on.repo) });
  await on.said(["gate"]);
  const seal = await on.said<Owed>(["owed"]);
  expect(seal.target).toBe(`${seal.commit ?? ""} against release/x`);
  expect(read(seal.prompt)).not.toContain("other.txt");
});
```

The case ran once as a file of its own in the round's clone at `fabfd9e` and passed (row 6). Its last line also holds that the sealer's diff is read from the last shared commit (`stage-records.ts#sealStage`, `base.reads...`). A diff from the tip would list `other.txt`.

```seal
verdict: fixed 1ea808e
answer: The record's case stands in `chain-command.test.ts` after the case of the recorded base, as written. It passes at the head, and it fails against the round's mutant, the branch-name arm of `baseOf` returning the base branch's tip: `owed` is then refused with "The branch no longer holds" and `BASE_RECORDED`. No code changed.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `f013d37` builds the decision the coordinator asked this round to check against `trail/phases/phase-2.md`. A base recorded as a commit now stays that commit (`chain.ts:285`, `:288`). A base recorded by a branch's name still takes the commit it and the head last shared (`chain.ts:287-288`). So `whyNoBase` (`chain.ts:300`) refuses a branch that left the recorded commit.

Executed: the case `f013d37` adds (`chain-command.test.ts:191`) passed at `fabfd9e`. With round 1's two lines of `baseOf` put back, the case failed. `owed` exited 0 with nothing on its error output, where the case expects exit 1 and the record's sentence (Probes, rows 1 and 2). Round 1's probe saw the same. The fix pass claimed that the case "fails again with the one line put back", and this round saw that.

Both callers, read at `fabfd9e`:

- `chain-command.ts#baseHere` (`chain-command.ts:161-184`) already names a commit given by `--base` or `OWLERY_BASE` as itself (`:177`). The command therefore reads a commit base alike before round 1 and after it, and refuses with `BASE_RECORDED` once a record stands (`:181`).
- `Daemon#chainBase` (`daemon.ts:2399-2403`) hands `baseOf` the same recorded name. `Daemon#whyNoChain` takes its base from it (`daemon.ts:2251`), so the daemon's chain refuses the same branch. That path was read, not run. The fix pass judged that the daemon takes no case of its own because the two chains share the line, and this round agrees.

Where the head still holds a recorded commit, the last shared commit is that commit. So the gate's run block, the trailer range `[base.commit, base.reads]` and the sealer's diff name what they named before the fix. Phase 2's sentence "both chains now name `git merge-base <base> <head>`" changes its result only where the head left the commit, and that case is now refused. The docstrings at `chain.ts:272-283` and `chain-command.ts:151-160` say what the code does. `docs/architecture.md:306` and `docs/architecture.ko.md:306` now hold.

The new case was read against its group. The case at `:165` refuses a given base with no record stands, with `BASE_OPTION`. The case at `:225` follows a recorded branch. The new case holds the one fact neither holds: a recorded commit the branch left is refused with `BASE_RECORDED`.

```seal
confirms: round-1#2
```
What holds: `docs/roadmap.md:69` now ends "from the pull request of issue #176 on", and `docs/roadmap.ko.md:69` ends "이슈 #176의 PR부터는". Each says what ground 4 of its own edition says (`:39`, read).

The fix pass claimed that the other sentences of each edition naming release 0.0.3 say what a pane carries, not which chain seals this repository. Read at `docs/roadmap.md:23`, `:41`, `:53` and `:60`, and at the same lines of `docs/roadmap.ko.md`, and it holds.

What matched: the records that state the present were read whole at `fabfd9e`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. Since `cd3b5a1` the fix diff changed none of them, and the target contradicts no sentence of any of them. Three statements were weighed against the change of `baseOf`, and each now holds for a recorded commit too:

- `frame/design.md` *Scope* item 13 and scenario 11;
- the changelog's bullet "A chain follows the base its first round recorded, and a branch that left its base is refused";
- the sentence of `gaps.md` *Not done* that both chains refuse a branch that left its base.

`Commit and pull request language` is English, so no `pr.<lang>.md` is owed.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the repository-wide typecheck and the document counts of the `Broad gate` command, at `fabfd9e`. This round ran six narrow runs and no broad one. The label `unverified` that `gaps.md` gives the suite is still honest, since the fix pass names no broad run | the whole tree | the orchestrator, at the broad gate |
| Round 1's rows of *Not judged* other than the broad gate: the throw of `writePaneSettings`, the chain command's commits beside the daemon's queue, the cases not read against their groups, and what only a real `claude` shows. Each is outside the fix diff, and this round left each where round 1 put it | `trail/rounds/round-1.md` *Not judged* | as round 1 names: the orchestrator, and the owner at the walk of #184 |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/chain-command.test.ts -t "refuses a branch that left the commit round 1"`, in `apps/desktop` of the round's clone at `fabfd9e` | 1 passed, 12 skipped |
| The same command, with `chain.ts:285-288` replaced by round 1's two lines of `baseOf` | 1 failed. `owed` answered `code: 0` and `err: ""`, where the case expects `code: 1` and "The branch no longer holds de96a44, ..." with `BASE_RECORDED`. Confirms round-1#1 |
| `node scripts/test-in-electron.mjs test/chain-command.test.ts test/chain.test.ts test/seal-state.test.ts -t "base\|rebase"`, with the branch arm of `chain.ts:288` replaced by `commit` | 3 files passed: 20 cases passed, 168 skipped. Finding 1 |
| `node scripts/test-in-electron.mjs test/test_tmp_branch_base.test.ts`, under the same mutant. The probe writes what it saw to a file of the round's scratch directory, since the runner shows no output of a case that passes | `owed` after the base branch gained a commit: exit 1, "The branch no longer holds 336c819, the commit its chain reads it against, ..." with `BASE_RECORDED`. Finding 1 |
| The same probe, with `chain.ts` as `fabfd9e` holds it | `owed`: exit 0, `{"step":"gate","round":1,...}`. Finding 1 |
| `node scripts/test-in-electron.mjs test/test_tmp_branch_base_case.test.ts`, the case finding 1 proposes, as a file of its own at `fabfd9e` | 1 passed. It was not run under the mutant: row 4 shows that its first `owed` is refused there |
