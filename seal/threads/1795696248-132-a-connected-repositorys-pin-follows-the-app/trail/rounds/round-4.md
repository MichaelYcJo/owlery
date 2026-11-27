# Review round 4: 1795696248-132-a-connected-repositorys-pin-follows-the-app

```seal
target: ad4b2790, fixes 492d93dc..ad4b2790
```

This is a verifying round of round 3. It read the range `492d93dc..ad4b2790`: the fix `18bc4338`, the close record `1e1eb7db`, the gate record `f2a7254b`, the handoff added at `3d77c03d` and removed at `a3d2e2eb`, the merge `ec72ff39` of `release/v0.0.5` at `a7d194f9`, the six retaken shots `55670289`, the merge's account in `gaps.md` (`4a5cdd01`) and the judgment row in `frame/plan.md` (`ad4b2790`). Each resolution was read against the conflict git left, with `git show --remerge-diff ec72ff39`. This work's own diff was compared before and after the merge: `git diff f683c693 a3d2e2eb` against `git diff a7d194f9 HEAD`, over `apps` and `docs`. The two differ only in context lines and in the six resolved files, so no line of this work's code changed in the merge.

It read whole at `ad4b2790` `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/gate.md`, and the records of rounds 1 to 3. No `pr.md` and no `pr.<lang>.md` stand at the target. The pull request will open against `release/v0.1.0`, which names `e7737b7e`. `git diff a7d194f9 origin/release/v0.1.0` prints nothing, so the release's tree is the one this branch merged.

Carried from rounds 1 to 3 as coordinates and not searched again: `seal-state.ts#refusedAt`, `decision-record.ts#workItemDirectory`, `repository-file.ts#repositoryFileText`, and `Daemon#readBranch` reading a branch's head from the repository. Re-read on the merged tree: `Daemon#readRecords`, `Daemon#unreadRecords`, `Daemon#answerReadLists`, `Daemon#readOutside`, `Daemon#readCommits` and `records-place.ts#setUpRecords`.

The commits after `a3d2e2eb` carry no `Seal-Routing` trailer. The repository's check judges no commit that lacks one (`pr-check/skills/code-review/scripts/chain_check.py`, `routing_trailers`), so that is no finding.

The account in `gaps.md:29` says `routing.md` and the frame files were read whole against HEAD. Findings 2 and 3 below are sentences that reading did not catch. Both became false only when release 0.0.5 merged into `main`: pull request #303 merged at 2026-11-27 00:17:23 UTC, and the tag `v0.0.5` carries 09:17 +0900. The commits `4a5cdd01` and `ad4b2790` were made within two minutes of that. So neither finding is charged to the account's method.

## Findings

### 1. The commit limit's paragraph, settled into the policy by the merge, says a commit ended at the limit leaves each file written, while the move writes the old workflow back

```seal
severity: should
location: `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:94-115`, `docs/architecture.md:291`, `docs/architecture.ko.md:291`, `apps/desktop/src/daemon/records-place.ts:627`
evidence: read `docs/architecture.md:291`, `docs/architecture.ko.md:291`, `apps/desktop/src/daemon/records-place.ts:548-634`, `apps/desktop/src/daemon/worktrees.ts:1194-1240`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/trail/rounds/round-1.md:188`; executed `git diff -U0 a3d2e2eb ec72ff39 -- docs/architecture.md`, `git grep -n -F "written and not staged"`, `git grep -n -F "스테이징되지 않은 채로"`, `git grep -n "commitRunner(" -- apps/desktop/src`
```

Why it matters: the merge brought the 0.0.5 settle into this branch. The settle added a paragraph to `docs/architecture.md` *Records are committed to the repository*, the section this work's `add` operations name. `git diff -U0 a3d2e2eb ec72ff39` shows it as the hunk `+291,3`. The paragraph came from #150's frame. It says: "Every commit Owlery's code makes has five minutes, a stage's and the setup of the records place among them. … Past the limit Owlery ends the group and leaves each file written and not staged, unless the commit was made before the end." The Korean edition says the same at `docs/architecture.ko.md:291` ("파일은 적힌 채로, 스테이징되지 않은 채로 둡니다").

The move does otherwise. `setUpRecords` runs `git add` and `git commit` under `commitRunner`'s limit. An ended command throws, and the `catch` writes the moved workflow back as it stood (`records-place.ts:627`). The docstring at `:558` and `changelog.md:6` say so, and scenario F holds it. The setup's own files, which predate this work, are removed in the same `catch` (`:626`). `git grep -n "commitRunner(" -- apps/desktop/src` lists two callers. `worktrees.ts#commitPaths`, which a stage and a person's word commit through, does leave each file written and not staged. `records-place.ts#setUpRecords` does not.

This work's `## Rule changes` holds no operation on that sentence. After this work's settle the policy would say that a moved workflow is left written over when its commit is ended, and the code writes the old one back. A later agent that holds the code to the policy would remove the write-back. Round 1 named #150's `add` and weighed only the limit itself (`round-1.md:188`). So this is new work, not a reopen. The two `git grep` runs on the sentence's words list only `:291` of each edition among the documents. In the code they list `worktrees.ts:1208`, which is true of `commitPaths`, and the names of cases of `worktrees.test.ts` that hold `commitPaths`. That search is a sample: a statement of the rule in other words escapes it.

Add to `frame/design.md` *Rule changes*, after the second `add`:

```markdown
- change
  file: docs/architecture.md
  section: Records are committed to the repository
  from: Past the limit Owlery ends the group and leaves each file written and not staged, unless the commit was made before the end.
  to: Past the limit Owlery ends the group, and a commit made before the end stands. Otherwise a stage's commit and a commit of a person's word leave each file written and not staged. The setup of the records place instead takes its files out of the index, removes each file it created, and writes a moved workflow back as it stood.
- change
  file: docs/architecture.ko.md
  section: 기록은 저장소에 커밋합니다
  from: 5분이 지나면 Owlery는 그 그룹을 끝내고, 파일은 적힌 채로, 스테이징되지 않은 채로 둡니다.
  to: 5분이 지나면 Owlery는 그 그룹을 끝냅니다. 단계의 커밋과 사람의 말을 담는 커밋은 파일을 적힌 채로, 스테이징되지 않은 채로 둡니다. 기록 자리를 만드는 커밋은 그 파일들을 스테이징에서 빼고, 자기가 만든 파일을 지우며, 옮기던 워크플로는 원래대로 다시 씁니다.
```

The Korean sentence that follows, "끝내기 전에 커밋이 이미 만들어졌으면 그 커밋은 그대로 남습니다.", stays as it is. The English `to` carries its fact in its first sentence, because the English `from` holds it in one sentence.

```seal
verdict: fixed 6b76ec22
answer: The orchestrator added the round's two `change` operations, English and Korean, to `frame/design.md` *Rule changes* after the second `add`, word for word. The settle of release 0.1.0 writes them into `docs/`. Records alone.
```

### 2. `routing.md` still says the pull request merges into `release/v0.0.5`, which has merged into `main`

```seal
severity: should
location: `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/routing.md:22`
evidence: read `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/routing.md:22`; executed `git ls-remote --heads origin 'release/*'`, `git merge-base --is-ancestor a7d194f9 origin/main`, `gh pr list --state all --head release/v0.0.5 --json number,state,baseRefName,mergedAt`, `git grep -n -F "release/v0.0.5" -- seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app`
```

Why it matters: `routing.md:22` reads "the pull request merges into `release/v0.0.5` by squash". `gh pr list` shows pull request #303 merged `release/v0.0.5` into `main` at 2026-11-27 00:17:23 UTC. `git merge-base --is-ancestor a7d194f9 origin/main` exits 0, and `origin/release/v0.1.0` names `e7737b7e`, the merge on `main`. The pull request will open against `release/v0.1.0`. A party that opens it from the routing's sentence would open it against a release that has shipped, and the check would read its base there.

The `git grep` lists the other places that name `release/v0.0.5`. `frame/design.md:5` and `:18`, and `trail/phases/phase-1.md:5`, state what was read on 2026-11-26. `gaps.md:11` and `:21` name the merge. Neither kind states the pull request's base. `frame/plan.md:65` already says that the release was taken in by a merge. The search is a sample: a statement of the base in other words escapes it.

Replace `routing.md:22` with:

```markdown
- **Branch:** cut from `release/v0.0.5` at `c35c8271`. The branch took that release in by a merge (`ec72ff39`), and release 0.0.5 then merged into `main` (pull request #303). `release/v0.1.0` was cut from that merge, so the pull request merges into `release/v0.1.0` by squash.
```

```seal
verdict: fixed 6b76ec22
answer: The orchestrator replaced `routing.md:22` with the round's `**Branch:**` bullet, word for word. Records alone.
```

### 3. The frame and the plan say a workflow pinned to 0.0.5 will find no tag once `release/v0.0.5` is deleted, and the tag `v0.0.5` stands

```seal
severity: should
location: `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:18`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:49`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/plan.md:57`
evidence: read `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:18`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:49`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/plan.md:57`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/changelog.md:3`; executed `git ls-remote --tags origin`, `git ls-remote origin 'refs/tags/v0.0.5^{}'`, `git ls-tree v0.0.5 pr-check/`, `git grep -n -e "no tag" -e "neither a tag" -e "neither the tag" -- seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app`
```

Why it matters: `git ls-remote --tags origin` lists `v0.0.5`, which points at `e7737b7e`, the merge of release 0.0.5 into `main`. `git ls-tree v0.0.5 pr-check/` lists the check's files. So a workflow that pins `0.0.5` clones `--branch v0.0.5` and finds its check after `release/v0.0.5` is deleted.

Three sentences say otherwise:

- `frame/design.md:18` ends its *Grounding* row with a conclusion: "a workflow that pins `0.0.5` will find neither a tag nor a branch once `release/v0.0.5` is deleted". The row's reads are dated to `c467d965`. The conclusion is read against the target.
- `frame/design.md:49`, an out-of-scope item that the orchestrator files as an issue, says "A repository pinned to `0.0.5` meets it once `release/v0.0.5` is deleted".
- `frame/plan.md:57`, *Operational impact*, says "fails its check once `release/v0.0.5` is deleted, since no tag `v0.0.5` will exist".

An agent that files the issue, or that reads the operational impact, acts on a failure that no repository pinned to 0.0.5 meets. `changelog.md:3` says "Once a release's branch is deleted and no tag of that release exists, such a workflow cannot fetch its check at all." That is a conditional and stays true. The `git grep` printed the three lines above and no other. It is a sample, since a statement in other words escapes it.

In `frame/design.md:18`, replace the sentence "The version moves from 0.0.5 to 0.1.0 at this release's close (#58), so a workflow that pins `0.0.5` will find neither a tag nor a branch once `release/v0.0.5` is deleted." with:

```markdown
Release 0.0.5 was tagged `v0.0.5` at `e7737b7e` as it merged into `main` on 2026-11-27 (`executed`, `git ls-remote --tags origin`), so a workflow that pins `0.0.5` keeps fetching its check from that tag once `release/v0.0.5` is deleted.
```

Replace `frame/design.md:49` with:

```markdown
- **The workflow's failure where neither the tag nor the release branch exists.** A repository meets it where its pin names a release whose branch was deleted before its tag was made. No release up to 0.0.5 is such a release: each one's tag stands (`git ls-remote --tags origin`, 2026-11-27). The clone then fails with git's words, and the check posts nothing. The move set out here repairs such a repository from an app of a later version. A sentence in the workflow that says why the clone failed is an issue to file.
```

Replace `frame/plan.md:57` with:

```markdown
- **A repository connected by a build of 0.0.5 keeps fetching its check after `release/v0.0.5` is deleted**, since the tag `v0.0.5` stands at `e7737b7e` (`git ls-remote --tags origin`, 2026-11-27). Such a repository shows "Check 0.0.5" in an app of a later version and moves from there.
```

```seal
verdict: fixed 6b76ec22
answer: The orchestrator replaced the sentence of `frame/design.md:18`, the item at `frame/design.md:49` and the bullet at `frame/plan.md:57` with the round's text, word for word. Records alone.
```

### 4. `gaps.md` says the merge changed no line of either architecture document, and it brought 71 changed lines into each

```seal
severity: should
location: `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/gaps.md:27`
evidence: read `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/gaps.md:27`; executed `git diff --stat a3d2e2eb ec72ff39 -- docs/architecture.md docs/architecture.ko.md`, `git diff --stat a7d194f9 ec72ff39 -- docs/architecture.md docs/architecture.ko.md`, `git diff -U0 a3d2e2eb ec72ff39 -- docs/architecture.md`
```

Why it matters: `gaps.md:27` ends "and the merge changed no line of either file". `git diff --stat a3d2e2eb ec72ff39` prints 71 changed lines in each edition. `git diff --stat a7d194f9 ec72ff39` prints nothing. So the merge's resolution changed no line, and the merge itself changed many lines. One of them is the paragraph of finding 1, inside the section the `add` operations name. The sealer reads this memo. Read as written, it says the section is as the rounds read it, and finding 1 stands exactly there.

Replace the clause at `gaps.md:27`, "and the merge changed no line of either file.", with:

```markdown
The merge took the release's edits of both files with no conflict, among them the paragraph on the commit of a person's word and the commit limit in the section the `add` operations name (`docs/architecture.md:291`, `docs/architecture.ko.md:291`), and its resolution changed no line of either.
```

```seal
verdict: fixed 83d29d52
answer: The clause at `gaps.md:27` is replaced with the round's sentence, word for word, after a full stop in place of the comma that joined it to the sentence before. Records alone.
```

## Confirmations

```seal
confirms: round-3#1
```
What holds: `frame/design.md:109` now ends its English `add` with "A work item whose worktree stands without its records' folder, while its branch's head holds them, is read as one with no records, and the dialog does not name it." `frame/design.md:114` ends the Korean `add` with "작업 트리는 있는데 기록 폴더가 없고 브랜치 끝에는 기록이 있는 작업은 기록이 없는 작업으로 읽혀, 대화 상자가 알리지 않습니다." Both are round 3's sentences word for word, and `18bc4338` changes only those two lines. The merge did not touch `frame/design.md`. Read.

What matched: the resolution in `apps/desktop/src/daemon/daemon.ts`. The one conflicting hunk keeps this work's `refusedAt` and the release's `import type { StopCounts }`. Nothing else in the file conflicted. Read in the remerge diff.

What matched: the resolution in `apps/desktop/src/renderer/sidebar.ts`. The import holds `checkButton` beside `emptySidebar`, `filterMark` and `SHOW_EVERY_WORK_ITEM`. The docstring of `showSidebar` names the row's buttons in the order the code appends them, `head`, the check's button, "+" and "…" (`sidebar.ts:217`). It then names the release's empty sentence, its button and the filter's control. Read.

What matched: the resolution in `apps/desktop/test/screenshots.ts` and `apps/desktop/test/screenshots.test.ts`. `VIEWS` ends with `narrowed` and then `check-move`, so the move's view stays last, as *Scope* item 10 sets. The `enter` and `leave` maps hold both views in that order, each whole. The `leave` of `narrowed` empties the search and sets the filter to All before `check-move` begins. The case on the files' names counts 126 with `desk-light-check-move.png` last. Executed: `screenshots.test.ts` passed in the run below.

What matched: the resolution in `docs/design.md` and `docs/design.ko.md`. Each keeps the release's text. Each holds this work's row "The check's mark on a repository's row" / "저장소 줄의 검사 표시" at line 456, between the row of an item of the sidebar and the release's row for the empty sidebar. Each ends the list of views with the move's view after the release's narrowed sidebar. Executed: `grep -c '^#'` and `grep -c '^|'` print 15 and 406 for both editions of `design.md`, and 27 and 124 for both of `architecture.md`.

What matched: the release's refresh (#216) reads the older check again. `answerReadLists` waits on `readOutside`, which returns `readCommitsNow`, and `readCommits` calls `readRecords` for every repository (`daemon.ts:4724`). `readRecords` passes `this.options.version` and counts a change of `olderCheck` (`:2972-2979`). This is the claim of `frame/plan.md:48`. Read.

What matched: the settle wrote none of this work's *Rule changes*. `git grep -n -F` finds each `change` operation's `from:` at `docs/architecture.md:270` and `docs/architecture.ko.md:270`. Executed.

What matched: figure against text. The shots `night-watch-dark-check-move.png` and `desk-light-check-move.png` were opened. Each shows the sidebar's head with the bell, the refresh, the filter and "+", as `docs/design.md`'s row "The sidebar's head" orders them. Each shows "Check 0.0.4" on the row of "project" between its count and "+", and the dialog with both versions, the branch `main`, the move's subject, the workflow whole, the sentence of what was read with no work item named, and "Move and commit" on. This matches `gaps.md:20` and the alt texts at `gaps.md:31-41`, whose links name blobs at `55670289`. The other four shots were not opened, so that check is a sample.

What matched: no test of this work was added or changed in the range except the count in the case on the files' names, which the resolution had to change. No new test is read against a group.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the typecheck of every package and the documents' check at `ad4b2790`. `trail/gate.md` records a run against `f683c693`, before the merge, so the suite is `unverified` at the target | `trail/gate.md`, `gaps.md:11` | the orchestrator, at the broad gate |
| `work-item-menu.test.ts` and `refresh.test.ts` in the built app, and the screenshot run in every theme, over the merge. `gaps.md:29` says they passed, and this round ran neither | `gaps.md:29` | the orchestrator's broad gate |
| Whether the settled sentences at `docs/architecture.md:40` and `:61`, that the app replaces a daemon of another build once it runs nothing, still state #301's behaviour. They are the release's, and this work's `add` and `changelog.md:10` say only that the row shows an older check once the updated app's daemon runs | `docs/architecture.md:40`, `docs/architecture.md:61` | the orchestrator, for the release |
| Whether `/usr/bin/perl` stands on every machine that runs `records-place.test.ts`, carried from round 3 | `apps/desktop/test/records-place.test.ts:1041` | the orchestrator, at the broad gate and in CI |
| Whether an open pull request's next run takes the moved pin once the base holds it (Q3) | `frame/questions.md:16` | a measurement on GitHub |

## Probes

No probe ran. The runs below are narrow confirmations, each through the session's lock script, with Electron taken from the main checkout through `ELECTRON_OVERRIDE_DIST_PATH`.

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/records-place.test.ts test/view.test.ts test/screenshots.test.ts`, in `apps/desktop` | exit 0: 3 files, 665 passed, 1 skipped |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "check is older than the daemon\|plan that moves the check\|readLists\|lists again"`, in `apps/desktop` | exit 0: 12 passed, 429 skipped |
| `node scripts/test-in-electron.mjs --project app test/records-dialog.test.ts`, in `apps/desktop`, with the system `TMPDIR` and `OWLERY_BACKGROUND=1` | exit 0: 2 passed; `dist/` was rebuilt by the run |
| `chain_check.py --baseline origin/release/v0.1.0 --worktree`, before this record | exit 0; it names the guarantee the sealer owes and reads no ready pull request |
