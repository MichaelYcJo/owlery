# Review round 5: 1795696248-132-a-connected-repositorys-pin-follows-the-app

```seal
target: ced43ee6, fixes ad4b2790..ced43ee6
```

This is a verifying round of round 4. It read the range `ad4b2790..ced43ee6`. That range holds the round 4 record (`155331cf`), the fix `83d29d52` of `gaps.md`, the orchestrator's fold `6b76ec22` of `frame/design.md`, `frame/plan.md` and `routing.md`, and the close record `ced43ee6`. The range changes no file outside this work item's directory (`executed`, `git diff --stat ad4b2790..ced43ee6`), so no code was reviewed as new code. The round read each record whole at `ced43ee6`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/gate.md`, both phase records and the records of rounds 1 to 4. No `pr.md` and no `pr.<lang>.md` stand at the target.

The closes claim that each fix is round 4's text, word for word. The round set each hunk of `git diff ad4b2790..ced43ee6` beside the fenced fixes of `round-4.md`. Each hunk matches its fix. The one difference is in `gaps.md:27`, where a full stop takes the place of the comma before the new sentence, as the close of finding 4 says.

Carried from round 4 as coordinates and not searched again: `records-place.ts#setUpRecords` and its `catch`, `worktrees.ts#commitRunner` and `worktrees.ts#commitPaths`. Re-read at the target, because finding 1 of round 4 names them: `docs/architecture.md:291`, `docs/architecture.ko.md:291`, `records-place.ts:545-634` and `worktrees.ts:1193-1240`. Re-established this round: every caller of `commitPaths`. Round 4 listed the callers of `commitRunner`, not of `commitPaths`.

`origin/release/v0.1.0` names `e7737b7e` after a fetch (`executed`, `git rev-parse`), and HEAD does not descend from it (`executed`, `git merge-base --is-ancestor`, exit 1). Round 4 found that `a7d194f9`, which HEAD holds, has the same tree as `e7737b7e`, and that fact is carried. The descent is the orchestrator's to judge before the gate, and it stands under `## Not judged`.

## Findings

### 1. The commit limit's `change` operations say what two kinds of commit leave past the limit, and drop the commit of a renamed branch's routing, which the sentence they replace covered

```seal
severity: should
location: `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:116-125`, `docs/architecture.md:291`, `docs/architecture.ko.md:291`, `apps/desktop/src/daemon/daemon.ts:3238`
evidence: read `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:116-125`, `docs/architecture.md:291`, `docs/architecture.ko.md:291`, `apps/desktop/src/daemon/worktrees.ts:1193-1240`, `apps/desktop/src/daemon/daemon.ts:3214-3244`, `apps/desktop/src/daemon/records-place.ts:612-634`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/trail/rounds/round-4.md:29`; executed `git grep -n -E "\"commit\"|'commit'|commit-tree" -- apps/desktop/src`, `git grep -n "commitPaths(" -- apps/desktop/src`, `git grep -n -F "a stage's commit and a commit of a person's word"`, `git grep -n -F "단계의 커밋과 사람의 말을 담는 커밋"`
regression: round-4#1
```

Why it matters: the unit is the pair of `change` operations at `frame/design.md:116-125`, which `6b76ec22` added. `frame/design.md` *Rule changes* rewrites a policy sentence the code contradicts, and the `from:` it rewrites here is a universal: past the limit Owlery "leaves each file written and not staged". The fix kept that rule for "a stage's commit and a commit of a person's word" by name, and stated the setup's cleanup beside them. The defect came from round 4's own list. `round-4.md:29` says `commitPaths` is the path "which a stage and a person's word commit through". That list came from a search for the callers of `commitRunner`, which finds `commitPaths` but none of its callers.

`git grep` for a `git commit` in `apps/desktop/src` prints two places: `records-place.ts:618` in `setUpRecords`, and `worktrees.ts:1236` in `commitPaths`. `git grep -n "commitPaths("` prints three callers of `commitPaths`:

- `stage-records.ts:93`, a stage's commit (`commitRecords`).
- `daemon.ts:3384`, the commit of a person's word (`commitOwed`).
- `daemon.ts:3238`, `Daemon#commitWord`, which commits `routing.md` alone after a rename of the branch writes the new name into it.

The docstring of `commitWord` (`daemon.ts:3214-3229`) keeps that commit apart from the other two: "no stage's commit and no commit of a person's word holds `routing.md`". Its commit goes through `commitPaths` under `commitBounds()`, so past the limit its file stands written and not staged, as `worktrees.ts:1206-1208` states. The `from:` sentence covers that commit. Neither `to:` names it. After the settle of release 0.1.0, the policy says what a stage's commit, a person's word and the setup leave past the limit, and says nothing of the rename's commit. An agent that changes how `commitWord` cleans up then finds no rule to hold the change to. The Korean operation names the same two kinds ("단계의 커밋과 사람의 말을 담는 커밋은").

The two `git grep -F` runs on the operations' words print `frame/design.md:120` and `:125`, and the same text in `round-4.md:40` and `:45`. The policy documents hold neither sentence yet. That search is a sample, because a statement in other words escapes it. The same search found no statement of the two kinds in `changelog.md`, `gaps.md` or the policy documents.

The rest of each `to:` matches the code. A commit ended after it was made stands: `commitPaths` returns where `carried()` holds (`worktrees.ts:1237-1238`), and `setUpRecords` throws nothing where `git diff --cached --quiet` exits 0 (`records-place.ts:619-621`). The setup's `catch` unstages its paths, removes each file it made, and writes the moved workflow back (`records-place.ts:625-627`). That is round 4's finding 1, and it holds.

The fix keeps the universal and states the setup as its one exception. In `frame/design.md`, replace the `to:` line at `:120` with:

```markdown
  to: Past the limit Owlery ends the group, and a commit made before the end stands. Otherwise each file stands written and not staged, except in the setup of the records place, which takes its files out of the index, removes each file it created, and writes a moved workflow back as it stood.
```

and replace the `to:` line at `:125` with:

```markdown
  to: 5분이 지나면 Owlery는 그 그룹을 끝냅니다. 기록 자리를 만드는 커밋이 아니면 파일은 적힌 채로, 스테이징되지 않은 채로 둡니다. 기록 자리를 만드는 커밋은 그 파일들을 스테이징에서 빼고, 자기가 만든 파일을 지우며, 옮기던 워크플로는 원래대로 다시 씁니다.
```

Each `from:` line stays as it is. `git grep -n -F` finds both, word for word, at `docs/architecture.md:291` and `docs/architecture.ko.md:291` (`executed`).

## Confirmations

```seal
confirms: round-4#1
```
What holds: `frame/design.md:116-125` now holds a `change` for each edition on the commit limit's sentence in the section the `add` operations name. Each `from:` stands word for word at `docs/architecture.md:291` and `docs/architecture.ko.md:291` (`executed`, `git grep -n -F`). Each `to:` states that the setup of the records place writes a moved workflow back as it stood, which `records-place.ts:627` does. The finding round 4 named, a policy that would say a moved workflow is left written over, no longer stands. Finding 1 above stands on the same operations and is about the commits the `to:` lines leave unnamed. Read.

```seal
confirms: round-4#2
```
What holds: `routing.md:22` is round 4's bullet word for word. Each fact in it holds at the target. `origin/release/v0.1.0` and `origin/main` both name `e7737b7e`, and `git log HEAD..origin/release/v0.1.0` prints `e7737b7e Merge pull request #303 from MichaelYcJo/release/v0.0.5` (`executed`). Round 4's search for `release/v0.0.5` in this directory found no other sentence that states the pull request's base, and that coordinate is carried. Executed and read.

```seal
confirms: round-4#3
```
What holds: `frame/design.md:18`, `frame/design.md:49` and `frame/plan.md:57` are round 4's text word for word. `git ls-remote --tags origin` lists `v0.0.1` to `v0.0.5`, and `refs/tags/v0.0.5^{}` names `e7737b7e` (`executed`). So each release up to 0.0.5 has its tag, as `:49` says. `origin/release/v0.0.5` still stands at `a7d194f9`, and the sentences that speak of its deletion are conditional. Executed.

```seal
confirms: round-4#4
```
What holds: `gaps.md:27` now says the merge took the release's edits of both architecture documents with no conflict, and that its resolution changed no line of either. `git diff --stat a7d194f9 ec72ff39 -- docs/architecture.md docs/architecture.ko.md` prints nothing. `git show --remerge-diff ec72ff39` prints no hunk for either file (`executed`). The bullet's first sentence, that both documents still hold each operation's `from:`, now covers four `change` operations. All four `from:` sentences stand: the pin's at `:270` of each edition, carried from round 4, and the limit's at `:291` of each, found this round. Executed.

What matched: the range adds and changes no test, so no new test is read against its group.

What matched: `changelog.md:6` says that a failed commit puts the workflow back as it stood. That holds for a commit ended at the limit too, since the limit and a hook's refusal end in the one `catch` of `setUpRecords`. The case at `records-place.test.ts:998` holds the write-back for a hook that exits 1. No case ends a move's commit at the limit. The setup's limit cases at `:823` and `:843` hold the same `catch` and the commit that stands. The write-back is code no fix of this range changed. Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the typecheck of every package and the documents' check at `ced43ee6`. `trail/gate.md` records a run against `f683c693`, before the merge, so the suite is `unverified` at the target | `trail/gate.md`, `gaps.md:11` | the orchestrator, at the broad gate |
| Whether HEAD must take `origin/release/v0.1.0` at `e7737b7e` before the gate. HEAD holds `a7d194f9`, which has the same tree, and does not descend from `e7737b7e` | `routing.md:22` | the orchestrator, before the broad gate |
| Whether `/usr/bin/perl` stands on every machine that runs `records-place.test.ts`, carried from rounds 3 and 4 | `apps/desktop/test/records-place.test.ts:1041` | the orchestrator, at the broad gate and in CI |
| Whether an open pull request's next run takes the moved pin once the base holds it (Q3) | `frame/questions.md:16` | a measurement on GitHub |

## Probes

No probe ran, and no test ran: the range changes only this work item's records, and reading settled each close.

| Command | Result |
|---|---|
| `python3 skills/code-review/scripts/chain_check.py --baseline origin/release/v0.1.0 --root <the branch worktree> --worktree`, after this record | exit 0. It names finding 1 of this record as open, for having no close block, and the guarantee the sealer owes. It reads no ready pull request and prints no notice at a line of `frame/design.md` |
