# Review round 1: 1795396351-seal-breaks-after-a-commit

```seal
target: afa0566 against release/v0.0.2
```

The whole branch was read against `origin/release/v0.0.2` at `d0479ce`, in a `git clone --no-local` of the worktree at `afa0566` under the round's scratch directory. No earlier round stands, so no fact was carried: every coordinate below was opened in this round. The work item's records were read whole at `afa0566`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-1.md` to `phase-5.md`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. The tree holds no `seal/parity.json` and the `seal/` root's `config.json` holds no `Pact` key.

The axes named for this change beyond the table: the two readers of one rule (the daemon's `seal-state.ts#sealAt` with `chain.ts#stepOwed`, and `chain_check.py#since_sealed`, `#judge` and `#outcome`), the order of two reads of one branch, the merge resolution at `a53b22b`, and the pending rule-change operations of #42 and #43 on `docs/design.md`.

## Findings

### 1. A merge of the base after the seal, whose change the sealed tree already holds, passes the check while the app shows the seal broken

```seal
severity: should
location: `pr-check/skills/code-review/scripts/chain_check.py:1071-1092`, `pr-check/skills/code-review/scripts/chain_check.py:1792-1800`, `pr-check/skills/code-review/scripts/chain_check.py:2478`, `apps/desktop/test/pr-check.test.ts:630`, `seal/threads/1795396351-seal-breaks-after-a-commit/frame/design.md:120`, `seal/threads/1795396351-seal-breaks-after-a-commit/frame/plan.md:31`, `seal/threads/1795396351-seal-breaks-after-a-commit/changelog.md:11`, `README.md:28`, `README.md:33`, `README.ko.md:28`, `README.ko.md:33`, `pr-check/README.md:5`
evidence: executed `node scripts/test-in-electron.mjs --project unit test/test_tmp_round1.test.ts` in the round's scratch clone at afa0566 (see Probes, histories A and B); read `pr-check/skills/code-review/scripts/chain_check.py:1045-1047`, `apps/desktop/src/daemon/worktrees.ts:969-971`, `apps/desktop/src/daemon/chain.ts:310-311`
```

Why it matters: the app and GitHub give two verdicts on one head that a person makes in ordinary work. A branch that took a fix of its base before the seal (a cherry-pick) and merges the base after the seal gets "Seal broken" and a waiting line in the app, and a passed `Owlery seal` titled "Sealed at" on the pull request. The same holds for a merge of a base whose new commits net to nothing.

Grounds:

- The frame says a merge after the seal fails the check. `frame/design.md:120` (*Scope* item 9): "So a merge commit after the seal, and a change made in one, fails the check." `README.md:28` says "A commit pushed after the seal fails the check until a new seal is given", and `README.md:33` names "a merge of the base among them". The changelog bullet at `changelog.md:11` says "so a merge commit after the seal fails it". `README.ko.md:28` and `:33`, and `pr-check/README.md:5` ("so a merge commit after the seal breaks it as any other commit does"), say the same.
- The daemon reads every commit after the last round's target, the base's own that a merge brought among them. `worktrees.ts:970` runs `git log --format= --name-only -z <target>..<head>`, and `chain.ts:310-311` owes a verifying round for a path outside the work item's directory. So `sealAt` reads `broken`, "Review round 2 is owed after the sealed commit".
- The check's rounds arm and gate arm walk `git rev-list --no-merges HEAD ^<sha> ^<base>` (`chain_check.py:1045-1047`), which leaves out the base's commits. The guarantee arm compares two trees alone (`chain_check.py:1071-1092`). Where the merge leaves the sealed tree as it was, no arm refuses, and the check exits 0.
- Probe, executed: history A (the branch committed `y.txt` before the seal, the base committed the same file, the branch merged the base) gave the daemon `broken` and the check exit 0. History B (the base gained a commit and its revert, the branch merged the base) gave the same. In both, `git diff --name-only` between the sealed commit and HEAD printed the two closing records alone.
- `frame/plan.md:31` names this history among the failure scenarios ("A merge of the base whose commits leave the tree as it was reads `broken` in the daemon and passes the check"). That sentence and *Scope* item 9 cannot both hold. `docs/product.md` *What we promise* settles which: the seal breaks if any commit lands after it. Scenario 9's table (`apps/desktop/test/pr-check.test.ts:630`) holds neither history, so no case catches the two answers.

The fix the problem calls for is in the guarantee arm: read the base's commits that a merge brought after the seal, as the daemon reads them. The arm takes `base` again, which phase 4 removed from it.

```python
def since_sealed(root, sha, item, base):
    """None where nothing but the closing records of `item/` differs between
    the tree of `sha` and HEAD's, HEAD descends from `sha`, and no commit of
    the base that a merge brought after `sha` touches a path outside
    `item/`; else why not.

    The two trees are compared, so a merge commit, and a change one brings,
    is read as any other commit. The base's own commits after `sha` are
    walked too, since the rounds arm's walk (`follows`) leaves them out and
    Owlery's daemon owes a verifying round for them (`chain.ts#stepOwed`,
    through `worktrees.ts#pathsOfCommits`), though the sealed tree already
    held their change. `("unseen", sha, "")` for a commit this repository
    cannot resolve, `("off", sha, "")` for one HEAD does not descend from,
    and `("differs", sha, path)` for the first path, in git's order, that is
    no closing record and differs, or that such a commit of the base
    touched."""
    allowed = {f"{item}/{name}" for name in CLOSING_RECORDS}
    full = git(root, "rev-parse", "--verify", "--quiet", f"{sha}^{{commit}}")
    if full is None:
        return ("unseen", sha, "")
    full = full.strip()
    if not is_ancestor(root, full, "HEAD"):
        return ("off", sha, "")
    out = git(root, "diff", "--name-only", "--no-renames", "-z", full, "HEAD")
    for path in (out or "").split("\0"):
        if path and path not in allowed:
            return ("differs", full, path)
    # Precondition: `base` is `args.baseline`, a ref the checkout resolves,
    # as `records` and `broad_gate` take it. Where git cannot name the fork,
    # nothing of the base is walked.
    fork = git(root, "merge-base", "HEAD", base)
    if fork is not None:
        brought = git(root, "log", "--format=", "--name-only", "-z", fork.strip(), f"^{full}")
        for path in (brought or "").split("\0"):
            path = path.lstrip("\n")
            if path and not path.startswith(f"{item}/"):
                return ("differs", full, path)
    return None
```

```python
def guarantee(reader, root, item, base, notices=None, behind=None):
    ...
    found = since_sealed(root, sha, item, base)
```

```python
        sealing = guarantee(reader, root, item, args.baseline, notices, closing)
```

This snippet does not reach every statement of the fact, and the fix pass owes the rest:

- `guarantee`'s docstring (`chain_check.py:1793-1800`).
- Scenario 9's table (`apps/desktop/test/pr-check.test.ts:630`): add histories A and B, each `broken`.
- `frame/plan.md:31`: remove the merge-of-base history from the failure scenarios.
- `frame/design.md:120` and the architecture rule change at `frame/design.md:264` and `:269`: add the base's commits to what the guarantee arm reads.

Where the fix pass keeps the check as it is instead, the frame's *Scope* item 9, the three READMEs' sentences and the changelog bullet are untrue for these histories. Each then has to say that a merge of the base whose change the sealed tree already holds passes the check while the app reads the seal broken.

```seal
verdict: fixed 80a440c
answer: Fixed in the guarantee arm as the paste-ready fix reads, after reading it against frame/design.md Scope items 8 and 9 as folded at 3b943c4: `since_sealed` takes the baseline and, where the two trees hold the same, walks the commits `git merge-base HEAD <base>` holds and the sealed commit does not, with the paths `git log --name-only` prints, as `worktrees.ts#pathsOfCommits` reads them; where git names no fork it walks nothing. In my own words where the snippet answered `differs`: such a path is answered `("brought", sha, path)`, and `since_sealed_reason` names it as "a commit of the base that a merge brought after the sealed commit `<7>` touches `<path>`, outside the work item's records", since the path does not differ between the trees; `judge` counts every answer an arm refused, so the title is the broken seal's. `guarantee` takes `base`, its call passes `args.baseline`, and both docstrings say the walk. Scenario 9's table gains histories A and B, each `broken` with the line it prints, and a case of scenario 10 posts both and reads the title; both cases were red against the arm at 3b943c4 (`pr-check.test.ts:636` and `:733`). `seal mutate` of chain_check.py, 6 mutants, all red: the walk skipped, the refusal dropped, the walk from the fork itself, the walk of every commit the fork holds and the sentence's kind renamed, each against the merge cases; and the baseline replaced by HEAD, which those cases let through and the case of scenario 11 failed at `pr-check.test.ts:503`, the head whose commit after the seal was taken back, where the guarantee arm refuses nothing. The frame's statements were folded by the framer at 3b943c4; changelog.md and pr-check/README.md say the walk in 80a440c, and the sentences of README.md and README.ko.md hold as they stand, since a merge of the base after the seal now fails the check.
```

### 2. The rule changes and the changelog say the daemon and the check share one rule, and records written by hand still get two answers from them

```seal
severity: should
location: `seal/threads/1795396351-seal-breaks-after-a-commit/frame/design.md:253`, `seal/threads/1795396351-seal-breaks-after-a-commit/frame/design.md:259`, `seal/threads/1795396351-seal-breaks-after-a-commit/frame/design.md:264`, `seal/threads/1795396351-seal-breaks-after-a-commit/frame/design.md:269`, `seal/threads/1795396351-seal-breaks-after-a-commit/frame/plan.md:31`, `seal/threads/1795396351-seal-breaks-after-a-commit/changelog.md:11`, `seal/threads/1795396351-seal-breaks-after-a-commit/gaps.md:22`
evidence: executed `node scripts/test-in-electron.mjs --project unit test/test_tmp_round1.test.ts` in the round's scratch clone at afa0566 (see Probes, history C); read `apps/desktop/src/daemon/chain.ts:303-316`, `pr-check/skills/code-review/scripts/chain_check.py:1546-1547`, `apps/desktop/test/pr-check.test.ts:766`
```

Why it matters: the settle writes the `to:` texts of `## Rule changes` into `docs/product.md` and `docs/architecture.md`, and the next framer acts on them. They say that one rule decides. Two of the release's own records name histories that rule does not decide alike, and the list in them is incomplete.

Grounds:

- `frame/design.md:264` opens "Whether a seal holds is read from the branch's head commit alone, by one rule that the daemon and the check share", and `:269` is its Korean twin. `frame/design.md:253` ends "the check `Owlery seal` makes the same judgment by the same rule", and `:259` is its twin. The changelog bullet at `changelog.md:11` opens "the check `Owlery seal` makes the same judgment".
- Method: `chain.ts#stepOwed` (`chain.ts:303-316`) was taken apart row by row, and each row was set beside the check's arm that reads the same fact. After finding 1's fix, these hand-written histories still give two answers:
  - An open question committed before the seal: the daemon parks, so it reads `broken`. The check reads no `decisions.md` (`pr-check.test.ts:766`), and passes. Phase 4 names this one.
  - A decision reversed in a commit before the seal: the daemon owes a fix pass and reads `broken`. The check passes, for the same reason.
  - A last round record with a `fixed` finding located in the work item's records alone: the daemon owes a verifying round (`chain.ts:309-311`) and reads `broken`. The check passes it as read by the sealer at HEAD (`chain_check.py:1546-1547`).
  - A later gate run on a head that differs from the sealed commit in closing records alone. Probe history C, executed: the daemon read `broken` ("The sealer's session is owed after the sealed commit"), and the check exited 0, since no arm compares the newest gate run with the sealed commit.
  - A verdict block whose judge is one of its builders: the daemon reads `sealed` and the check fails it. `frame/plan.md:31` names this one.
- `frame/plan.md:31` names two of the five, and phase 4 calls the open question "a third". The list is a sample. The daemon writes none of the five, so they matter for records written by hand or by another tool.
- `gaps.md:22` still asks the orchestrator to fold the open question into `frame/plan.md`'s failure scenarios. `frame/plan.md:31` already holds it, since `c07de8f`, and the row is not closed.

Rewrite the four `to:` texts so that each says where the two readers differ. The English `to:` of `frame/design.md:264`:

```markdown
  to: **Whether a seal holds is read from the branch's head commit alone, and the pull request check reads the same records.** The daemon reads the round records, `decisions.md`, `trail/gate.md` and `guarantee.md` as the head commit holds them, and gives them to the function that decides the step a chain owes. The seal holds where that function owes nothing. It is broken where the newest verdict block is a seal and a step is owed. A file of the worktree that no commit holds, a pane's output and a stored state decide nothing. The daemon stores neither answer: it reads them again when a branch's head moves and when it starts, so a restart changes none. The two states travel in the protocol as `sealed` and `broken`, with the sealed commit. The check's guarantee arm compares the tree of the sealed commit with HEAD's, as the daemon's gate does, and reads the base's commits a merge brought after the seal, as the daemon's rounds do. So a merge commit after the seal is read as any other commit. The two readers still differ on records that no chain of the daemon commits. The check reads no `decisions.md`, does not compare the newest gate run with the sealed commit, and passes a last round's fix of the records alone. The daemon does not read whether the judge built the work.
```

The last sentence of the `to:` of `frame/design.md:253`:

```markdown
On the pull request the check `Owlery seal` judges the same records, with or without the app: the commit that breaks a seal fails the check once it is pushed, and the check's title says that the seal is broken. Records written by hand can still be judged apart, since the check reads no `decisions.md`.
```

The Korean twins at `frame/design.md:259` and `:269` are rewritten the same way, and the changelog bullet at `changelog.md:11` opens "On the pull request, the check `Owlery seal` judges the same records." Add the other three histories to `frame/plan.md:31`, and close the row at `gaps.md:22`.

```seal
verdict: fixed 97de906
location: `README.md:28`, `README.ko.md:28`, `pr-check/README.md:5`
answer: The frame's part was folded by the framer at 3b943c4: the four `to:` texts, Scope item 11 and plan.md's failure scenario now say which histories the two readers judge alike and name the hand-written records as a class. The fix pass took the rest: changelog.md's bullet now opens "On the pull request, the check `Owlery seal` judges the same records." and says that records no chain of the app commits can be judged apart (80a440c); pr-check/README.md says the same in that commit; README.md and README.ko.md each gain the sentence in the paragraph of *The seal check on GitHub*, kept at equal heading and table-row counts (97de906, 6 headings and 16 table rows each); and gaps.md's row on the open question committed before the seal is closed, citing plan.md's failure scenario that names the class (97de906). No code changes for this finding: the class stays apart by the frame's choice in Scope item 11.
```

## Confirmations

What matched: the merge resolution at `a53b22b` keeps both sides where #43 and this work met. Read with `git show --cc a53b22b`. `runChain`'s `finally` calls `readBranchNow` and then `scheduleWatch` (`apps/desktop/src/daemon/daemon.ts:2197-2202`). `renderer.ts#takeLists` raises `sealNotifications` and then `pullRequestNotifications` (`apps/desktop/src/renderer/renderer.ts:1229`). The imports of `daemon.ts`, `view.ts` and `renderer.ts` join both lists. Cases hold each side. The case of scenario 19 reads the "Seal broken" notification in the built app (`apps/desktop/test/get-a-seal.test.ts:353-384`). Phase 1's mutant that removed `readBranchNow` failed a chain case. #43's watch and pull-request notification cases stand unchanged. `pullRequestNotifications` reads `pullRequestLine`, which gives null at a broken seal unless the pull request merged (`apps/desktop/src/renderer/view.ts:191-195`). So the two notifications do not both fire for one break, which *Scope* item 18 asks.

What matched: phase 1's guard in `readBranchNow`, that a chain's read of its branch waits for the pass under way, is sound by reading (`apps/desktop/src/daemon/daemon.ts:3082-3089`, `:3032-3061`). Without the wait, a pass that read the head before the chain's last commit could set the earlier head's seal after the chain's read had set the new one. The next pass then sees a head other than the one kept and reads again, so the defect lasts one interval at most. No frame fact states the order, so the surviving mutant leaves the code as the frame says. Phase 1's second survivor, `decisionsAt` set to `head` for the chain's run, reads the same as `worktree` wherever `daemon.ts#chainCommit` and `#personWrote` commit the record. *Scope* item 2 keeps the `worktree` reading.

What matched: the built-app cases the crafters did not see red pin the code they name, read against the tree before that code. The case of scenario 19 (`apps/desktop/test/get-a-seal.test.ts:353-384`) waits for "Seal broken" in the line's second row and for `#view-seal-why`. Before `c3a2575`, `lineText` gave "Checks passed" for that line, and the element did not stand, so both waits would time out. Phase 3's two cases (`apps/desktop/test/approval-line.test.ts`, the cases on a lit seal and on a parted one) read `data-seal` as `sealed` and `broken`. Before `d3fa1cf`, `sealPlace` set `none` for every place. The `gaps.md` rows 16 and 25 say these cases were not run before the code, which is true, and they name this round as the reader.

What matched: the daemon's reading follows *Scope* items 1 to 5 and the table of item 3 (`apps/desktop/src/daemon/seal-state.ts:62-94`). The newest verdict is read through `lastVerdict` at the head before any round record. Whether the repository holds the sealed commit, and whether the head holds it, are read before `stepOwed`. The sentence names the first differing path that is no closing record, or else the step owed. The seal is read where the head moved, kept in memory, cut at 2,000 characters, and sent in `workItemOf` (`apps/desktop/src/daemon/daemon.ts:3032-3072`). Probe history D, the sealed head, gave `sealed` and exit 0.

What matched: the check's outcome follows *Scope* item 7 and the row of *Data & interfaces* (`pr-check/skills/code-review/scripts/chain_check.py:2537-2563`). The broken row is read after the draft row and before the two refused rows. The title names each distinct sealed commit by seven characters with no backticks. `judge` fills `broken` from what the arms' comparisons answered, and reads no sentence (`:2467-2489`).

What matched: the window follows *Scope* items 15 to 21. `sealShown` is the one source of the place's words, `drawSeal` sets them on each place, and every caller of `sealPlace` passes the seal (`apps/desktop/src/renderer/shared.ts:116-139`, `list.ts:81-121`, `list.ts:155`, `summary.ts:50`, `work-item-view.ts:156-159`, `work-item-view.ts:910-917`). `#view-seal-why` takes no room where it is empty (`index.html:430-431`). The seal's sentence is set as text and never as markup. `byRecords` reads the seal before the worktree's verdict (`view.ts:577-584`).

What matched: the 18 committed screenshots were taken at `f697cc0`, after the last change of `apps/desktop/src` at `fe36058`, and `pr.md` links them at `9c304c1`, which holds the same files. Two were opened, `night-watch-dark-broken.png` and `night-watch-light-inbox.png`. The broken view's foot shows the seal parted in grey, "Seal broken, sealed at 528016a", the seal's sentence and "Get a new seal". The broken work item's line stands under "Needs you" with "Seal broken" and no age. The lit seal is the one red on the inbox.

What matched: `docs/design.md` and `docs/design.ko.md` say what the tree draws in the rows *Scope* item 17 names. The seal's place, the approval line, the token rows and *What the names say* match `index.html`, `themes.css` and `view.ts`. The sentence under the components' table no longer leaves the drawing to a milestone. The screenshot section counts seven work items, seven views and fourteen files, which `apps/desktop/test/screenshots.test.ts` and `screenshots.ts#VIEWS` hold. #42's `change` on "and draws no lit seal yet" and #43's two `change` operations on the views' sentences no longer find their `from:` text, which *Scope* item 17 states as history at the settle.

A gap of no frame fact: the case "reads a head of 10 round records within the interval of the daemon's read of the branches, 3 seconds" (`apps/desktop/test/seal-state.test.ts:207`) holds a timing bound that no *Scope* item states. Its load-dependence is a row of `gaps.md` already.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the seal's sentence should show its backticks as written, at the view's foot and under the approval line. `docs/design.md` *The voice of the window's words* neither allows nor forbids them, and the window already shows backticks in the chain's stopped sentences (`apps/desktop/src/daemon/chain.ts:848-954`) | `apps/desktop/src/daemon/seal-state.ts:68-82`, `seal/threads/1795396351-seal-breaks-after-a-commit/gaps.md:33` | the owner, with `frame/questions.md` Q1 |
| How a broken seal is drawn (`frame/questions.md` Q1, open) | `apps/desktop/src/renderer/index.html:145-150` | the owner |
| Whether GitHub runs the check again at a push after the seal and shows the failed title (`frame/questions.md` Q2) | `pr-check/skills/code-review/scripts/chain_check.py:2524` | the orchestrator, at the first real chain Q2 names |
| #42's and #43's pending `change` operations on the screenshot section both quote "The run starts two chains, and each stays at its first round, which the stand-in for the CLI holds." Applied in merge order, #42's replaces the passage with "The run starts three chains", and #43's `from:` then finds nothing, while the run starts four. This work does not touch that sentence, by *Scope* item 17 | `seal/threads/1795393338-broad-gate-and-sealer/frame/design.md`, `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md`, `docs/design.md:502` | the settle, which writes the section checked against the code |
| The suite, the typecheck and the documents' checks of the `Broad gate` key at `afa0566`. Every phase hands over its run as its own set alone, and `gaps.md` labels the rest unverified and names the orchestrator, which is honest. This round ran no test file of the repository | `seal/threads/1795396351-seal-breaks-after-a-commit/gaps.md:23-24` | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs --project unit test/test_tmp_round1.test.ts --silent=false`, from `apps/desktop` of the round's scratch clone at afa0566, with `node_modules` linked from the worktree and `chain_check.py` run under `PATH` of a folder holding Python 3.12, `/usr/bin` and `/bin` | Exit 0, 1 case passed. The probe printed its answers with `console.log`, which the run did not show, so a second run wrote them to a file |
| The same command without `--silent=false`, the probe writing its answers to a file in the round's scratch directory | Exit 0. A, a merge of the base whose change the branch already held: daemon `broken`, "Review round 2 is owed after the sealed commit", check exit 0. B, a merge of a base whose commits net to nothing: daemon `broken`, the same sentence, check exit 0. C, a later gate run on a head that differs from the sealed commit in closing records alone: daemon `broken`, "The sealer's session is owed after the sealed commit", check exit 0. D, the sealed head: daemon `sealed`, check exit 0. In all four, `git diff --name-only` between the sealed commit and HEAD printed `guarantee.md` and `trail/gate.md` alone |
