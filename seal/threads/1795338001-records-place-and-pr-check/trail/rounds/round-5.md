# Review round 5: 1795338001-records-place-and-pr-check

```seal
target: 9d02f30, fixes b882cc4..9d02f30
```

This is a verifying round. The range `b882cc4..9d02f30` holds the fix `b3bf240`, the close of round 4 at `899f6dd`, and the frame fold at `9d02f30`. `git diff --stat b3bf240 9d02f30` names `frame/design.md` and `trail/rounds/round-4.md` alone, so the code at HEAD is the code at `b3bf240`. The work item's `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `9d02f30`, then `trail/phases/` for its coordinates and `trail/rounds/round-4.md` whole. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. Every run went in a `git clone --no-local` of the worktree at `9d02f30` under the round's scratch directory. Nothing was written into the worktree but this record.

The round works under the last two rows of `frame/plan.md` *Judgments of the run*. Round 4's finding was fixed in this work item. A further `should` case of the same mechanism that neither loses a person's work nor writes outside the place is recorded and marked as carried to a follow-up issue.

Some facts are carried from round 4 and not established again. The range changes no file under `pr-check/` or `.github/`, and it does not change `record-blocks.ts` or `decision-record.ts`. That was executed with `git diff --stat b882cc4 9d02f30`, which names `records-place.ts`, `view.ts`, `records-place.test.ts` and the work item's records alone. So the byte equality of `pr-check/` with AgenticSeal 0.38.4, the agreement of the two readers of a `seal` block, and the written workflow stand as rounds 2 to 4 found them. The orchestrator's `pnpm run typecheck` at `b3bf240`, exit 0, is a claim this round read and did not run (rule 2).

**The fix pass's three departures from round 4's snippet.**

- **The failure of the records question is kept and thrown only where no arm refuses (`apps/desktop/src/daemon/records-place.ts:401-404`, `:426`).** It holds. Claimed: the snippet's design throws git's words where a new root's name is a link in the checkout alone, in place of the sentence on a folder the setup needs. Executed: this round put the snippet's design into the clone's `records-place.ts` (skip the question where `threads` is no folder, no `.catch`) and ran `test/records-place.test.ts`. The new case went red at `apps/desktop/test/records-place.test.ts:347`, the `rootLinked` shape, with "fatal: pathspec 'seal/threads/' is beyond a symbolic link". The file was then put back, and the clone's status showed the probe file alone. Probe D1 shows the three outcomes of the kept failure. A link below a real `threads` makes the plan throw git's words, and a setup throws the same and changes nothing. The same link beside an uncommitted edit of the kept `config.json` gives the sentence on a checkout that differs. A new root left untracked with a link at `seal/threads/0-work-item` gives that sentence too, naming the link.
- **The question is asked also where `threads` is no folder.** It holds, on other grounds than the ones given. Claimed: "no case could tell it from asking: the arm refuses those plans either way". Probe D2 tells them apart. With a file committed at `seal/threads` and a `.gitignore` that holds `guarantee.md`, `check-ignore` answers for the path below the file, and the plan gets the sentence "Git ignores 1 of the 13 paths". The snippet's skip would have given the sentence on `threads`. Both refuse the plan. `frame/design.md:64` puts an ignored record path before `threads`, so the code that asks is the one the frame's order describes. No case holds that shape. The diff did not change that outcome, since `b882cc4` asked too, so this is no finding.
- **The sentence ends "Rename or remove it, commit that where git holds it, and open this again" (`records-place.ts:414`).** It holds. A link, a file and a submodule entry in the commit each get it (probes T and Sub), and so does a link in the checkout alone (probe LinkCheckout). The clause "where git holds it" leaves out the checkout-alone shape, where removing the entry is all the person does. The arm on a folder the setup needs, at `records-place.ts:416`, already gives "Rename or remove it" for an entry in the index alone, as the case at `apps/desktop/test/records-place.test.ts:663-668` holds for `.github`.

## Findings

### 1. The frame says a repository with every part committed shows what it has, and where git cannot answer for the sample's record path the plan throws and the dialog shows git's words alone

```seal
severity: should
location: `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:411`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:64`
evidence: executed probe `test/test_tmp_round5.test.ts` case D1 in the round's clone (see Probes); read `apps/desktop/src/daemon/records-place.ts:426`, `apps/desktop/src/renderer/view.ts:1260`, `seal/threads/1795338001-records-place-and-pr-check/gaps.md:25`
regression: round-4#1
```

Why it matters: the unit is the end of `planRecords`, where `b3bf240` added the throw at `records-place.ts:426` to close round 4's finding 1. The frame, `frame/plan.md`'s last row of *Judgments of the run*, asked for the ninth arm and for the swallowing `.catch` to go. The fix took the arm, and kept git's failure to throw it where no arm refuses. That throw is a new failure path, and it is a fix: the plan now fails closed where it failed open. The frame's statements were folded at `9d02f30` for the ninth arm and not for the throw.

- `frame/design.md:411` says a plan with nothing to write "is not `blocked` otherwise: a repository that has every part committed shows what it has". Probe D1: a repository whose commit holds `seal/README.md`, `seal/config.json` and AgenticSeal's `hygiene.yml`, with a link committed at `seal/threads/0-work-item`, gets no plan. `planRecords` throws "fatal: pathspec 'seal/threads/0-work-item/routing.md' is beyond a symbolic link". `recordsDialog` gives an error plan the scope sentence and the error alone (`view.ts:1260`). So the dialog does not show what the repository has.
- `frame/design.md:64` (*Scope* 12) says "For a repository that holds every part it shows the root, the workflow and the broad gate command with the file that holds it". The same probe contradicts it. Its list of the nine refusals is right and in the code's order.

`gaps.md:25` already states the limit, and the docblock of `planRecords` (`records-place.ts:315-316`) states the throw. So the code and the closing memo agree, and the frame alone is wrong. A sealer that reads *Scope* 12 against the tree finds the contradiction there.

On `frame/plan.md` *Judgments of the run*: this round reads that rule as covering a case of the mechanism's behaviour. This finding is a sentence of this work item's frame. No follow-up issue edits this frame, so carrying it would leave the frame contradicting the tree at the seal. Its fix touches the work item's records alone, which the sealer reads in place of a round. The orchestrator decides between the two readings.

The snippet covers both statements in `frame/design.md`. The other statements of the fact already hold: the docblock of `planRecords`, the docstring of `recordsDialog`, which covers plans alone, and `gaps.md:25`. `changelog.md` says nothing of the throw, and nothing there needs to change.

```markdown
frame/design.md:411, in place of the bullet:
- A plan with nothing to write is `blocked` where both root names are taken in the commit, where git ignores a record path, where the root's `threads` is not a folder, or where the checkout differs from the commit (*Scope* 10). Where none of those holds and git cannot say whether it ignores a record path, behind a link at the sample's `threads/0-work-item` for one, no plan is made: the daemon answers with git's words, and the dialog shows them in place of what the repository has (`gaps.md` *Not done*). Otherwise a repository that has every part committed shows what it has, on a detached head too (*Scope* 12 reads with this).

frame/design.md:64 (*Scope* 12), appended after "... no branch is checked out.":
Where none of the nine holds and git cannot say whether it ignores a record path, no plan is made, and the dialog shows git's words alone, also for a repository that holds every part.
```

## Confirmations

```seal
confirms: round-4#1
```
What holds: a kept root whose `threads` is a link or a file is blocked, and a link no longer hides an ignored record (`apps/desktop/src/daemon/records-place.ts:398`, `:413-414`). Probe T was written again from round 4's `## Probes` row and run at `9d02f30`. Link: `ls-tree` mode 120000, `check-ignore` exit 128 "beyond a symbolic link", the plan blocked with the new sentence, a setup threw the same sentence, and HEAD and the status were unchanged. Link beside a `guarantee.md` rule: blocked with the same sentence. File: blocked with the same sentence. At round 4 each of the three was `blocked: null`. Executed. Probe Sub, a submodule entry at `seal/threads` that no case holds: `ls-tree` mode 160000, blocked with the same sentence, as `gaps.md:25` says. Probe LinkCheckout, a link in the checkout alone: status `?? seal/threads`, blocked with the same sentence. Executed. Finding 1's `regression:` line names this finding for the frame's sentences, which the throw its fix added makes false.

What matched: the docblock of `planRecords` (`records-place.ts:304-316`) lists the nine arms in the order `records-place.ts:406-425` tests them, and the throw. The docstring of `recordsDialog` (`view.ts:1238-1251`) names the new refusal of a plan with nothing to write. `changelog.md:11` says the setup is refused where `threads` is a file, a link or a submodule in the commit, the index or the checkout, and also for a repository that has every part committed. Probes T, Sub and LinkCheckout hold each of those claims. The new paragraph of `gaps.md` *Not done* (`gaps.md:25`) holds as written: probe D1 throws git's words for a link at `threads/0-work-item`, and a link at another work item's path is not asked about, by `records-place.ts:399`. Read and executed.

What matched: the new case at `apps/desktop/test/records-place.test.ts:285-348` was read against its group. It holds the ninth arm, which no other case holds, and the `rootLinked` shape. That shape's arm is held also by the `.github` link at `records-place.test.ts:670-674`, but only `rootLinked` holds that a failed records question does not hide a later arm's sentence. This round's mutant showed it red there. The claims that the first seven shapes were each seen red at `b882cc4`, and the six `seal mutate` runs, were read and not run again. Round 4's probe T showed three of the seven shapes `blocked: null` at that code. The case does not hold a submodule entry, which reads through the same `inCommit.has` guard as the committed link, so the gap leaves no guard unpinned (`records-place.test.ts:285`).

What matched: the records were read whole at `9d02f30` against the code. `frame/design.md:64` names nine refusals in the code's order, apart from the sentence finding 1 names. `pr.md`'s quotes stand word for word: "Set up and commit" (`apps/desktop/src/renderer/index.html:771`), "Records and check…" (`view.ts:1176`) and the dialog's first sentences (`view.ts:1255`), executed with `git grep -n -F`. Each edition of `docs/architecture.md` counts 27 heading lines and 121 table lines, executed. The range does not change `docs/`. `gaps.md`'s diff over the range adds one paragraph and removes no row of `## Not verified`. `changelog.md`'s diff rewrites one item in place. Read.

What matched: this repository's own plan at `9d02f30` keeps `seal/README.md`, `seal/config.json` and `.github/workflows/hygiene.yml` and is `blocked: null` (probe Self). So the throw does not fire on this repository, whose `seal/threads/` is a folder. Executed.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the built-app files (none was run this round), the typecheck at HEAD, and the broad gate's comparison of the editions, labelled `unverified` | `seal/threads/1795338001-records-place-and-pr-check/gaps.md:7` | The orchestrator's broad run, after the rounds |
| `python3` on `macos-latest` after `setup-python`, and the workflow as GitHub runs it (Q3, Q4), carried from round 2 | `seal/threads/1795338001-records-place-and-pr-check/gaps.md:8-9` | The first run of `check` on this pull request, and #43 |
| Whether a pull request can pass `seal` by editing its own `owlery-seal.yml`, and whether the workflow should pin a commit rather than a tag, carried from round 1 | `apps/desktop/src/daemon/records-place.ts:53-98` | #43, and the orchestrator |
| The words a person sees where `writeRecord` throws Node's error on a record it cannot read, carried from round 2 | `apps/desktop/src/daemon/decision-record.ts:373-379` | #119 |
| Whether finding 1 is folded into the frame now or carried, under the reading of `frame/plan.md` *Judgments of the run* this record names | `seal/threads/1795338001-records-place-and-pr-check/frame/plan.md`, the last row | The orchestrator |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 TMPDIR=<scratch>/tmp node scripts/test-in-electron.mjs test/test_tmp_round5.test.ts test/records-place.test.ts test/view.test.ts` in the clone's `apps/desktop` at `9d02f30`, run once, output written to `probe5.json` in the scratch directory | 3 files, 424 cases passed. T, link: `ls-tree` 120000, `check-ignore` exit 128 "pathspec 'seal/threads/' is beyond a symbolic link", plan blocked "Each work item's records go in a folder at seal/threads/, and something other than a folder stands there in this repository. Rename or remove it, commit that where git holds it, and open this again.", the setup threw it, HEAD and status unchanged, `readRecordsPlace` root `seal`. T, file: the same sentence. T, link beside `guarantee.md` ignored: the same sentence. D2, a file at `threads` beside `guarantee.md` ignored: `check-ignore` exit 0 naming `seal/threads/0-work-item/guarantee.md`, plan blocked "Git ignores 1 of the 13 paths". Sub: `ls-tree` 160000, status ` D seal/threads`, the `threads` sentence. LinkCheckout: status `?? seal/threads`, the `threads` sentence. D1, a committed link at `seal/threads/0-work-item`: the plan threw "fatal: pathspec 'seal/threads/0-work-item/routing.md' is beyond a symbolic link", a setup threw the same, HEAD and status unchanged. D1, the same beside an edited `seal/config.json`: the sentence on a checkout that differs, naming `seal/config.json`. D1, a new root left untracked with that link: the sentence on a checkout that differs, naming `seal/threads/0-work-item`. Self: three kept files, `blocked: null` |
| The snippet's design put into the clone's `records-place.ts` with the `Edit` tool, then `OWLERY_BACKGROUND=1 TMPDIR=<scratch>/tmp node scripts/test-in-electron.mjs test/records-place.test.ts`, then the line put back | 1 failed, 26 passed: the new case, at `test/records-place.test.ts:347`, "fatal: pathspec 'seal/threads/' is beyond a symbolic link". After the put-back, `git status --short` in the clone printed only `?? apps/desktop/test/test_tmp_round5.test.ts` |
| `git diff --stat b882cc4 9d02f30` and `git diff --stat b3bf240 9d02f30` | The first names `records-place.ts`, `view.ts`, `records-place.test.ts`, `changelog.md`, `frame/design.md`, `gaps.md` and `round-4.md`. The second names `frame/design.md` and `round-4.md` alone |
| `grep -c '^#'` and `grep -c '^\|'` over both editions at `9d02f30` | 27 and 121 for each edition |
