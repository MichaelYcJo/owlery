# Review round 6: 1795696248-132-a-connected-repositorys-pin-follows-the-app

```seal
target: 2218e562, fixes ced43ee6..2218e562
```

This is a verifying round of round 5. It read the range `ced43ee6..2218e562`. The range holds the round 5 record (`bc6b30e1`), the orchestrator's fix `7ae3bab4` of `frame/design.md`, the close record `81344150`, and the merge `2218e562` of `origin/release/v0.1.0` at `e7737b7e`. No code was reviewed as new code, since the range changes no file outside this work item's directory.

The merge changes no file. `git diff --quiet 81344150 2218e562` exits 0, so the merge's tree equals its first parent's. `e7737b7e` and `a7d194f9` name the same tree, `8759acff` (`executed`, `git rev-parse <commit>^{tree}`), and `a7d194f9` is an ancestor of `81344150` (`executed`, `git merge-base --is-ancestor`, exit 0). The one commit the merge brings, `git log 81344150..e7737b7e`, is `e7737b7e` itself, the merge of pull request #303. HEAD now descends from `e7737b7e` (`executed`, `git merge-base --is-ancestor e7737b7e HEAD`, exit 0). That answers round 5's `## Not judged` row on the descent. `git diff --quiet ec72ff39 HEAD` outside this directory exits 0, so the sentence of `gaps.md:29` that the commits after `ec72ff39` change only this directory still holds at the target.

The round read each record whole at `2218e562`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/gate.md` and both phase records. It read the record of round 5 whole and the findings, closes and `## Not judged` of rounds 1 to 4. No `pr.md` and no `pr.<lang>.md` stand at the target. The only record the range changes is `frame/design.md:120` and `:125`. The new merge does not contradict any sentence of the other records. `routing.md:22` names the first merge, `ec72ff39`, and the base `release/v0.1.0`, and both still hold.

Carried from round 5 as coordinates and not searched again: the two places that run `git commit` (`records-place.ts:618` and `worktrees.ts:1236`), the three callers of `commitPaths`, and `docs/architecture.md:291` with its Korean twin. Re-read at the target, because the close of round 5's finding names them: `worktrees.ts:1193-1240`, `stage-records.ts:68-98`, `daemon.ts:3214-3244`, `daemon.ts:3370-3398` and `records-place.ts:608-634`. `git grep -n "commitPaths("` was run again and prints the same three callers (`executed`).

## Findings

This round opens no finding.

## Confirmations

```seal
confirms: round-5#1
```
What holds: the close claims that the two `to:` lines are round 5's text, word for word, and that each `from:` is unchanged. Each line of `frame/design.md:120` and `:125` matches one whole line of `round-5.md` (`executed`, `grep -c -F -x -f`, 1 each). `git show 7ae3bab4` changes those two lines alone, and `from:` at `:119` and `:124` stands as before.

The English `to:` now states the universal for every commit but the setup's: "Otherwise each file stands written and not staged, except in the setup of the records place". The code holds that for each caller of `commitPaths`. On an ended or failed `git add` or `git commit`, `commitPaths` runs `git reset --quiet -- <paths>` and throws (`worktrees.ts:1226-1229`, `:1233-1239`). None of its three callers does more to the files in its `catch`. The stage's commit, `stage-records.ts:92-96`, throws a `ChainStop` that says the file "was written and not committed". The commit of a person's word, `daemon.ts:3383-3395`, schedules a retry. `Daemon#commitWord`'s commit of `routing.md`, `daemon.ts:3237-3241`, logs git's words. So past the limit each of the three leaves its files written and not staged. The setup's cleanup is the exception the line names. In its `catch` the setup unstages its paths, removes each file it made, and writes the replaced workflow back (`records-place.ts:623-627`). A commit made before the end stands in both paths: `commitPaths` returns where `carried()` holds (`worktrees.ts:1237-1238`), and `setUpRecords` throws nothing where `git diff --cached --quiet` exits 0 (`records-place.ts:619-621`). Read.

The Korean `to:` says the same: "기록 자리를 만드는 커밋이 아니면 파일은 적힌 채로, 스테이징되지 않은 채로 둡니다", then the setup's cleanup. Its `from:`, like the English one, ends at the limit's sentence. The sentence after it at `docs/architecture.ko.md:291`, "끝내기 전에 커밋이 이미 만들어졌으면 그 커밋은 그대로 남습니다", stays outside the operation and states the made commit for every kind. So the Korean edition says after the cleanup what the English says before it. The two editions differ only in order, and each statement holds against the code. Read.

The old wording of either `to:` no longer stands in a record that states the present. `git grep -n -F "a stage's commit and a commit of a person's word"` and `git grep -n -F "단계의 커밋과 사람의 말을 담는 커밋"` at HEAD print only `trail/rounds/round-4.md:40` and `:45` and round 5's own quotes in `round-5.md` (`executed`). A search on the words is a sample, since a statement in other words escapes it. Executed and read.

What matched: the range adds and changes no test, so no new test is read against its group.

What matched: the commit message of `7ae3bab4`, "keep the commit limit's rule for every commit but the setup's", says what the line now states. The close's "Records alone" holds: `git show --stat 7ae3bab4` names `frame/design.md` alone. Executed.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the typecheck of every package and the documents' check at `2218e562`. `trail/gate.md` records a run against `f683c693`, before both merges, so the suite is `unverified` at the target | `trail/gate.md`, `gaps.md:11` | the orchestrator, at the broad gate |
| Whether `/usr/bin/perl` stands on every machine that runs `records-place.test.ts`, carried from rounds 3 to 5 | `apps/desktop/test/records-place.test.ts:1041` | the orchestrator, at the broad gate and in CI |
| Whether an open pull request's next run takes the moved pin once the base holds it (Q3) | `frame/questions.md:16` | a measurement on GitHub |

This round leaves nothing open. What comes due is the orchestrator's broad run at HEAD, and the sealer's spawn after it. The sealer is also the first reader of any sentence a fix pass writes after this record.

## Probes

No probe ran and no test ran. The range changes only this work item's records and a merge whose tree equals its first parent's, and reading settled the close.

| Command | Result |
|---|---|
| `python3 skills/code-review/scripts/chain_check.py --baseline origin/release/v0.1.0 --root <the branch worktree> --worktree`, after this record | exit 0. It refuses nothing in this record and names no finding as open. It names the guarantee the sealer owes, reads no ready pull request, and prints no notice at a line of `frame/design.md` |
