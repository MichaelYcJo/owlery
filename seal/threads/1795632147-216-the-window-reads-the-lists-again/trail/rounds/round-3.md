# Review round 3: 1795632147-216-the-window-reads-the-lists-again

```seal
target: b021290b, fixes 24b9aa72..b021290b
```

This round verifies what follows round 2's record (`24b9aa72`) on the work item's own branch. That is the close of round 2's two findings (`53d8f62d`, `bec979e2`), the merge of `release/v0.0.5` at `8a19d3e2` (`4dd18018`), which brings #224 (#270), #272, #217 (#274) and #215 (#290), the orchestrator's judgment row (`e0e0fd55`), the six shots taken again (`247cfd6c`) and their links (`b021290b`). The base is `origin/release/v0.0.5` at `8a19d3e2`, the merge's second parent. The release has since moved to `c80b900a`, which adds #278's documents and records alone (executed: `git show --stat c80b900a`). Every file of the work item's records that states the present (`routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`) was read whole at `b021290b`. No `pr.<lang>.md` stands, since both language keys of `seal/config.json` are English. The code was read in the branch worktree at the target. As the spawn asked, this round ran no test; the crafter's recorded runs were read instead, and *What matched* names them.

Carried from rounds 1 and 2 rather than re-established: the readings of `daemon.ts#answerReadLists` on the axes *Concurrency & atomicity* and *Security*, of the refusal's route through `renderer.ts#onMessage`, and of the 15-second end that keeps the notice of a daemon of another build. They carry because the branch's own added and removed lines in `apps/` and `docs/` are the same against `8a19d3e2` as they were against `783e2331` (executed, *Probes* row 1). The merge changed none of them. What the release changed around them was read again, and *What matched* gives it.

## Findings

### 1. The frame names the phone's release as 0.2, and the release's #278 gives the phone no version

```seal
severity: should
location: `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/design.md:129`
evidence: executed `git grep -n -e "0\.2\b" -e "v0\.2" -- seal/threads/1795632147-216-the-window-reads-the-lists-again` at `b021290b`, leaving out `trail/`, which printed `frame/design.md:129` alone; executed `git grep -n -e "0\.2\b" -e "v0\.2" origin/release/v0.0.5 -- docs README.md`, which printed no line outside "0.0.2"; read `docs/roadmap.md:113` at `c80b900a`, and `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/frame/design.md:55-58` and `:104` at `c80b900a`
```

Why it matters: the bullet "Serve the phone with the same message." in *What the daemon could do beyond the issue* says "`readLists` names no window, so the phone of release 0.2 can offer a pull to refresh". That held at `8a19d3e2`, where `docs/roadmap.md` placed the phone "for v0.2". The release now holds #278's work (`c80b900a`). Its frame takes "v0.2 and v0.3 as names of later goals" out of the roadmap, the architecture and the product documents (`frame/design.md:104` of #278). `docs/roadmap.md:113` at `c80b900a` now says that the scope after the first version "is not decided, and no version number is given to it". This pull request merges into that release, so the bullet then names a release that no policy document plans. The bullet is what a follow-up issue for the phone is written from, and it would carry the stale number. The search is a sample (contract rules 12 and 19), since it reads two spellings. It printed this one line.

```markdown
- **Serve the phone with the same message.** `readLists` names no window, so the phone, which comes after the first version (`docs/product.md` *The phone: the same session as a chat*), can offer a pull to refresh with nothing new in the daemon. This work keeps the message neutral to that end, and builds nothing for the phone.
```

```seal
verdict: fixed 9a0d7f25
answer: The orchestrator applied the round's sentence to `frame/design.md` word for word. Records alone.
```

### 2. The list of what a press reads says each work item's branch, and since #217 a work item may have none, which the press reads at its worktree's HEAD

```seal
severity: should
location: `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/design.md:136`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/design.md:141`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/changelog.md:6`
evidence: executed `git grep -n -e "branch and record" -e "브랜치와 기록" -- seal/threads/1795632147-216-the-window-reads-the-lists-again` at `b021290b`, leaving out `trail/`, which printed `changelog.md:6`, `frame/design.md:136` and `frame/design.md:141`; read `apps/desktop/src/daemon/daemon.ts:4590-4620` and `:4657-4674`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/plan.md:67`, and the `to:` of the `add` to `docs/product.md` *Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call* in `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/frame/design.md`
```

Why it matters: the rule change states what a press reads "At release 0.0.5", and lists "from git each work item's branch and record". The Korean edition says "git에서 읽는 작업마다의 브랜치와 기록", and `changelog.md:6` says "each work item's branch and record from git". #217, now in the release, makes a work item whose branch "is one the person picked or one Owlery makes later from the work's name" (its rule change to `docs/product.md`). At the target, `readBranch`, which `readCommits` awaits for every open work item, reads a work item with no branch "at the commit its worktree's `HEAD` stands at, as its branch's head would be" (`daemon.ts:4605`, `:4618`). So a press reads a thing the list does not name, for every work item that has no branch yet. The work item set the precedent itself: when #264's `readOwedAt` joined `readCommits`, the fifth row of *Judgments of the run* (`frame/plan.md:67`) wrote it into the rule change's list and `changelog.md`. The settle writes the list into both editions of `docs/architecture.md`, and a reader takes it as whole. Where that `HEAD` names a branch or holds a commit made in the worktree, the read also queues `branchUp`, which gives the work item its branch behind `this.changing` (`daemon.ts:4657-4674`). The press does not await it, so its answer may come before that branch. That is #217's behaviour at every read of git, the three-second one included, and the fix below does not ask the list to name it. The search reads two spellings and is a sample. It printed the three statements the fix covers.

```markdown
In `frame/design.md`, the `to:` of line 136, replace
"and from git each work item's branch and record,"
with
"and from git each work item's branch, or the commit its worktree's `HEAD` stands at where it has no branch yet, and its record,"

In `frame/design.md`, the `to:` of line 141, replace
"그리고 git에서 읽는 작업마다의 브랜치와 기록,"
with
"그리고 git에서 읽는 작업마다의 브랜치(아직 브랜치가 없는 작업이면 그 워크트리의 `HEAD`가 선 커밋)와 기록,"

In `changelog.md:6`, replace
"That is each work item's branch and record from git,"
with
"That is each work item's branch from git, or the commit its worktree stands at where it has no branch yet, and its record,"
```

```seal
verdict: fixed 9a0d7f25
answer: The orchestrator applied the round's three replacements to the English and Korean `to:` of *Rule changes* and to `changelog.md:6` word for word. Records alone.
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: the row "This item merges after #215." (`frame/plan.md:66`) grounds its order with "(`frame/plan.md` *Overlap with the release*, the row of #215)". That section stands at `frame/plan.md:44`, with its row of #215 at line 50. Round 2's search, run again at the target (`git grep -n -F "Order against other work items" -- seal/`), prints only round 2's own record. The order the row states also held. #215 merged into the release as #290 (`8a19d3e2`), and this branch merged the release after it, at `4dd18018`. Executed.

```seal
confirms: round-2#2
```
What holds: the four dating sentences stand where round 2's block placed them. They are `frame/design.md:62` under *User scenarios & acceptance*, `frame/design.md:82` under *Data & interfaces*, `frame/plan.md:19` under *Alternatives considered*, and the last sentence of the paragraph at `frame/plan.md:46` under *Overlap with the release*. The row added since (`frame/plan.md:68`) cites commits and `chain_check.py#follows`, which is a function of the plugin's script, and no line number. Executed: `grep -n "8c7eb798"` over both files, and `grep -n "def follows"` over the script.

What matched: the merge's reach into #216's code. `git merge` reported every file it met as merged by itself, `daemon.ts`, `index.html`, `renderer.ts`, `sidebar.ts`, `protocol.ts`, `chain-run.ts`, `daemon.test.ts`, `work-item-menu.test.ts` and both editions of `docs/design.md` among them (read: the crafter's `merge-2/merge.txt`). The combined diff of `4dd18018` holds only lines of one side or the other, such as `sidebar.ts`'s imports, where this work's `./refresh` import stands beside #215's `emptySidebar` and `filterMark`. Executed: `git show --cc 4dd18018`. Around the branch's lines, at the target:
- `renderer.ts#onMessage` holds no `asked` case after #224 (#270). The `done` case lets `refreshing.answered` claim its id (`renderer.ts:2024`), and the `error` case lets `refreshing.refused` say its sentence (`renderer.ts:2072`).
- #215's `SidebarActions#showEvery` and empty sidebar stand beside `refresh()` (`sidebar.ts:25-26`). The head row's markup keeps the order bell, refresh, filter and "+" (`index.html`, `#repositories-head`). The row "The sidebar's head" (`docs/design.md:448`) names the filter's Selected form as an icon's button's, and #215's rewritten cell of "An icon's button" (`docs/design.md:443`) states that form.
- `readLists` is still routed at `daemon.ts:1782`. `accept` reads only through `readOutside` (`daemon.ts:940`), so `## Removes` row 1 holds.
- #217's read of a work item with no branch joined `readCommits`, as the row of #217 in *Overlap with the release* foresaw. Finding 2 is what the list of the rule change owes it.

Read.

What matched: the six shots. Each `*-inbox.png` at the target is the blob of `247cfd6c`, and the same bytes as the file of that name in the crafter's run directory, `shots/out`. The six links of `gaps.md` name `247cfd6c`. Executed: `git hash-object` on the run's files, and `git rev-parse` at both commits. The crafter's `shots/run.txt` records `pnpm run screenshots`, with 108 shots and its one case passed. `gaps.md:16` says "The other 102 shots of the run, made at the merge of `release/v0.0.5` at `8a19d3e2`", and 108 less 6 is 102. The shot `desk-light-inbox.png` was opened. Its head row holds, in order, the bell with its count 3, the refresh's two arrows, the filter and "+", as `docs/design.md:448` says. The filter is at rest, with no state chosen and no search typed. Read.

What matched: the diff of `gaps.md` since round 2. Its `## Not verified` rows are unchanged. The merge commit `4dd18018` added a paragraph to *Not done*, "The six shots predate the release's #215, #217 and #224.". `b021290b` removed it once the shots were taken again, as its message says. That paragraph named work left to do, and that work is done at `247cfd6c`. No row of `## Not verified` left. Executed: `git diff bec979e2 4dd18018` and `git show b021290b` on `gaps.md`.

What matched: the row of 2026-11-27 (`frame/plan.md:68`). The merge's parents are `bec979e2` and `8a19d3e2`. `git log --first-parent` over the release's side lists #270, #272, #274 and #290, the pull requests of #224, #272, #217 and #215. No #133 commit or record stands on the branch (executed: `ls seal/threads/`, and `git log bec979e2..b021290b`). The row says the six shots "are taken again once the Mac is free", and `247cfd6c` took them. On this branch, against a daemon of an earlier build, the window's only end of a press is the 15-second one. That is what `frame/design.md` *Scope* item 7, the words table, the rule change, `frame/plan.md` *Operational impact*, `changelog.md:9` and `gaps.md:11` say. Read.

What matched: the crafter's recorded runs, read and not run. They are in the work item's scratch directory under `shots/`, made between 00:48 and 00:51, after `e0e0fd55`. `typecheck.txt` holds `tsc --noEmit` in `apps/desktop` with no error printed, and no exit code is recorded. `refresh.txt` shows 5 cases passed. `daemon.txt` shows 14 passed and 401 skipped, which matches the 14 cases of `-t "readLists|hello"` that round 2 ran. `app.txt` shows 2 files and 39 cases passed, without the files named. `run.txt` is the screenshot run. The code those runs read is the target's code, since only the work item's records changed after `e0e0fd55`. Read.

What matched: the label of the suite. `gaps.md:7` names the full suite, the typecheck of every package, the lint and the count of table rows as unverified, with the orchestrator's broad gate as their answerer. No record claims a broad run at the merged tree. The label is honest.

No case of #216 changed since round 2, so no new case is read against its group this round.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The branch against `origin/release/v0.0.5` at `c80b900a`: #278's documents change `docs/architecture.md`, where this work's rule change lands at the settle, and finding 1's bullet. `git merge-tree --write-tree b021290b origin/release/v0.0.5` reported no conflict, and this round read #278's `frame/design.md` only for the phone | `docs/architecture.md`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/design.md` | the orchestrator, at the merge of the release before the pull request |
| The built-app files at the merged tree beyond the two of `app.txt`, which name no file, `test/daemon-restart.test.ts` among them; and whether the typecheck of `typecheck.txt` exited 0 | `seal/threads/1795632147-216-the-window-reads-the-lists-again/gaps.md:7` | the orchestrator's batch of the built app, and its broad gate |
| The full suite, the typecheck, the lint and the count of table rows across the two editions of `docs/design.md` and of `docs/architecture.md`, at the target | `seal/threads/1795632147-216-the-window-reads-the-lists-again/gaps.md:7` | the orchestrator's broad gate |
| How the arrows look while they turn, and that they turn about their centre, carried from rounds 1 and 2 | `apps/desktop/src/renderer/index.html` | a person's look at the built app |

## Probes

No probe file was written and no test ran, as the spawn asked. The commands below ran in the branch worktree and wrote only to this round's scratch directory, apart from `git merge-tree`, which wrote unreferenced objects and moved no ref.

| Command | Result |
|---|---|
| the added and removed lines of `git diff 783e2331 bec979e2 -- apps docs` and of `git diff 8a19d3e2 b021290b -- apps docs`, compared with `diff` | exit 0: the same 513 lines on both sides |
| `git merge-tree --write-tree b021290b origin/release/v0.0.5` | exit 0: no conflict |
