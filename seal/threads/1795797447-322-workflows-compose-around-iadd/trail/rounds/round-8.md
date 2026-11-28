# Review round 8: 1795797447-322-workflows-compose-around-iadd

```seal
target: ad6ea796, fixes 931bf332..ad6ea796
```

This is a verifying round. It answers the two findings round 7 closed: finding 1 in `bea4a2a9` and finding 2 in `bedf7f1a`, with the close commit `ad6ea796`. The range holds four commits: `ba13d61a` records round 7, and the other three are those two fixes and the close. `git log --merges 931bf332..ad6ea796` prints nothing, so the range holds no merge. `git fetch` showed the base `origin/release/v0.2.0` still at `a75f4581`. No `seal/parity.json` is declared. `seal/config.json` sets `Record language` to English. The work item holds `changelog.md` and no `pr.md` or `pr.<lang>.md`.

The round read the worktree at `ad6ea796` and changed no file in it but this record. The caller ordered no vitest run, no build and no built-app file. This round ran none of them and no probe that executes code.

Read whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `trail/rounds/round-7.md`. Of the code, the round read every line the range adds or removes, in `apps/desktop/src/renderer/index.html`, `docs/design.md`, `docs/design.ko.md` and `gaps.md`, in a word diff. It also read the approval line's rules at `index.html:165-173` in context. `trail/phases/` and `trail/rounds/round-1.md` to `round-6.md` were not opened. No commit of the range changes them, and round 7 carried their coordinates.

Carried from round 7 rather than established again: that each clause of the comment at `index.html:165` and of the row at `docs/design.md:472` other than the dropped comparison holds against the CSS, and the widths worked from the fix pass's measurements. The range changes no rule of the `<style>` block. `index.html:169` still sets the row's gap to `--space-2`, and `:167` still sets a place's sides to `--space-2`, read.

## Findings

This round opens no finding.

## Confirmations

```seal
confirms: round-7#1
```
What holds: `gaps.md:12` is the row round 7 removed, put back under `## Not verified` after the row on the screenshots of the right column at 488px. It opens with `closed` and holds the finding's paste-ready text word for word, read in the word diff of `bea4a2a9`. That commit adds this one line and removes none. Its claims hold. `152762de` changes `frame/design.md` alone, read in `git show --stat 152762de`. `frame/design.md:110` names `ledger.test.ts:204` and `:206`, and it names `chain.ts` and `chain.test.ts` lines under "for what an earlier build stored or wrote", read. Round 6's target is `0e556f40`, read at `round-6.md:4`, and `152762de` is an ancestor of that range, executed with `git merge-base --is-ancestor`. The added row moves the rows after it down by one line. Round 7's coordinates `gaps.md:29`, `:35` and `:47` now stand at `:30`, `:36` and `:48`. A round record states its own target, so this is no finding. `git grep -n -e 'gaps\.md:[0-9]'` over the work item's frame files, `routing.md`, `changelog.md`, `gaps.md` and `trail/phases/` finds no line number of `gaps.md` cited there, executed.

```seal
confirms: round-7#2
```
What holds: `bedf7f1a` applies round 7's three paste-ready edits and changes nothing else, read in its word diff. `docs/design.md:472` now reads "So a place's sides and the gaps of its row are `--space-2`.", `docs/design.ko.md:472` reads "그래서 자리의 양옆과 그 줄의 간격은 `--space-2`입니다.", and the comment at `index.html:165` reads "So a place's sides and the gaps of its row are `--space-2`.". At `ad6ea796`, `git grep -n -F "narrower than the column"` over `docs`, `apps`, `README.md` and `seal` prints lines of `trail/rounds/round-7.md` alone, executed. Those lines are that round's finding. `git grep -n -F "다른 간격보다"` over `docs`, `apps`, `README.ko.md` and `seal` also prints lines of `round-7.md` alone, executed. As round 7 said of its search, both searches are a sample of the fact's statements. `gaps.md:30` names `--space-2` without the comparison, read.

What matched: the documents' editions still agree in the counts the broad gate compares. At `ad6ea796`, `git show ad6ea796:docs/design.md | grep -c '^#'` and the same for `docs/design.ko.md` each print 15, and `grep -c '^|'` prints 406 for each, executed. Each edit of `bedf7f1a` changes text inside one table cell of the row that starts with `|`, so no heading or row was added or removed.

What matched: the range's statements against the work item's records. `frame/design.md` says nothing of the approval line's spacing. It keeps the line's four places at `:85`, and no sentence of `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `routing.md` or `changelog.md` says that a place's spaces are narrower than the column's other spaces, read whole.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at `ad6ea796`: the whole suite, the typecheck and every document pair. The suite is `unverified`, since this round ran no case, as the caller ordered. This round counted the headings and table rows of `docs/design.md` and `docs/design.ko.md` alone | the repository's `Broad gate` key of `seal/config.json` | the orchestrator, in the broad gate it runs next |
| The built-app files `gaps.md` names as not run, and the approval line with overlay scroll bars (`gaps.md:30`), which round 7 named and this range does not change | `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:30` | the orchestrator, in its next batch of built-app cases |

This round leaves nothing open. The orchestrator's broad run comes due next, and the sealer's spawn after it.

## Probes

| Command | Result |
|---|---|
| `git log --merges --oneline 931bf332..ad6ea796` | nothing |
| `git grep -n -F "narrower than the column" ad6ea796 -- docs apps README.md seal` | lines of `trail/rounds/round-7.md` alone |
| `git grep -n -F "다른 간격보다" ad6ea796 -- docs apps README.ko.md seal` | lines of `trail/rounds/round-7.md` alone |
| `git show ad6ea796:docs/design.md` and `git show ad6ea796:docs/design.ko.md`, each through `grep -c`, counting the lines that open with `#` and the lines that open with a pipe | 15 headings and 406 table rows in each |
| `git merge-base --is-ancestor 152762de 750183d0` | exit 0 |
| `git grep -n -e 'gaps\.md:[0-9]' ad6ea796` over the work item's frame files, `routing.md`, `changelog.md`, `gaps.md` and `trail/phases/` | nothing, exit 1 |
