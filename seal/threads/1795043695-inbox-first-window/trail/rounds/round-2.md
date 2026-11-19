# Review round 2: 1795043695-inbox-first-window

```seal
target: efb42d0, fixes 8e00206..efb42d0
```

This is a verifying round. Its target is the diff of round 1's fixes: `def5c83` (the orchestrator's repair of `pr.md`), `aad5655` (the fix pass), `fb73183` (round 1's record with its closes) and `efb42d0` (the orchestrator's fold of the fix pass into the frame). The round read every changed line of that diff: `daemon.ts`, `last-look.ts`, `work-items.ts`, `worktrees.ts`, `view.ts` and `protocol.ts`, the cases it changed in `test/daemon.test.ts`, `test/last-look.test.ts`, `test/view.test.ts` and `test/worktrees.test.ts`, and the records it changed. Outside the diff it opened `daemon.ts#readCommits` whole, `worktrees.ts#branchHead` and `#branchOfHead`, `list.ts#showPreview`, and the cases of `test/daemon.test.ts` that slow git (`:866-893` and `:990-1000`), for the calls the fix makes and the timing those cases rest on. The renderer parts round 1 listed under `## Not judged` lie outside this target and were not read.

The work item's records were read whole at `efb42d0`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `guarantee.md`. No `pr.<lang>.md` stands, since `seal/config.json` names English for both language keys, and the repository declares no `seal/parity.json`. Of `trail/phases/` the round read only the lines a search for "ahead" printed. `trail/phases/phase-5.md:94` says that how far ahead a branch is was `newCommits`. That line records what phase 5 built at `e720eb1`, and it is history and no statement of the present.

Facts carried from round 1 and not established again: the coordinates of `daemon.ts#greet` and `#readCommitsNow`, which the fix did not change; round 1's probe, which made a diff of 1500 files under a directory path of 753 bytes fail with `spawnSync git ENOBUFS`; and that the renderer draws every text from the daemon with `textContent`. Every verdict below is this round's own.

## Findings

### 1. Two sentences the fix pass wrote about `aheadOfBase` say more than the code does

```seal
severity: should
location: `seal/threads/1795043695-inbox-first-window/changelog.md:26`, `seal/threads/1795043695-inbox-first-window/gaps.md:71`
evidence: executed `node scripts/test-in-electron.mjs test/worktrees.test.ts test/daemon.test.ts test/last-look.test.ts test/view.test.ts` in `apps/desktop` (see `## Probes`); read `apps/desktop/test/daemon.test.ts:747-765`, `apps/desktop/test/worktrees.test.ts:300-318`, `apps/desktop/src/shared/protocol.ts:76`, `apps/desktop/src/renderer/view.ts:385-391`, `apps/desktop/src/renderer/view.ts:452`, `apps/desktop/src/renderer/list.ts:90`
regression: round-1#3
```

Why it matters: the unit is the prose that the fix pass's commit `aad5655` added to `changelog.md` and `gaps.md`. `frame/design.md:214` gives `aheadOfBase` as the count of the commits of the work item's head that the base branch's tip does not hold. The fix built that count as the frame says, and the two sentences that describe it to a reader each claim one thing the count does not do.

- `changelog.md:26` says "`aheadOfBase` counts the commits the branch holds that its base branch does not, so a base merged into the branch adds none". A merge of the base into the branch is itself a commit the base does not hold, so it adds one. The case at `test/daemon.test.ts:747` shows it: after the branch's own commit the inbox says `1,1`, and after a commit on `main` and a merge of `main` it says `2,3`. The worktrees case at `test/worktrees.test.ts:300` names the merge in its title, "its own and a merge of the base". The protocol's docstring at `protocol.ts:76` says "adds none of its own", which is true. The changelog dropped "of its own". A person who writes a client from the release notes then expects a merge of the base to leave the count as it was.
- `gaps.md:71` says "Where that branch was removed or renamed, the count is `null` and the window says the base's name alone." That holds for the view: its Base fact is `ahead(...).fact` (`view.ts:452`), which is "main" there. It does not hold for the preview, which shows `ahead(...).sentence` (`list.ts:90`). That sentence is empty wherever the count is `null` (`view.ts:388`), so the preview names no base at all.

The method was to take the fix diff's added prose apart into each sentence that states what `aheadOfBase`, `aheadOf` or `ahead` does, and to read each against the code and the cases. That covered `changelog.md:10` and `:26`, `gaps.md:71`, `frame/design.md:214`, `:277` and `:279`, `frame/plan.md:42`, `:45` and `:131`, and the docstrings and comments at `protocol.ts:76`, `worktrees.ts:123-129`, `view.ts:378-384` and `daemon.ts:98` and `:476-480`. These two sentences are the ones that do not hold.

```markdown
- **For a client of the daemon:** `looked`, with no field, records a look and is answered with nothing; `ready` carries `lastLook`, or `null` where no client ever looked; a hello is answered after the counts are read, and what a client sends before its `ready` is handled after it. A session carries `stateSince`, `stateText` and `stateTool`. A work item carries `repoName`, `baseBranch`, `aheadOfBase`, `commits` and `changes`. `aheadOfBase` counts the commits the branch holds that its base branch does not, so a base merged into the branch adds the merge commit and none of the base's own commits, and `newCommits` stays the count of every commit since the branch was cut.
```

```markdown
- **A base branch is a name recorded once, and it is read as a local branch of the repository.** The daemon counts at every read how many commits the work item's branch holds that the base branch does not. Where that branch was removed or renamed, the count is `null`: a view's facts then say the base's name alone, and the preview says nothing of the base. A base that moved on a remote and was not fetched into the local branch is counted as the local branch stands. How far the work item's branch is behind its base is what is left of issue #27.
```

The first block replaces `changelog.md:26` and the second `gaps.md:71`. No other statement of either fact stands in the tree. The finding is located in the work item's records alone.

```seal
verdict: fixed 310e3a9
answer: The round's two replacement blocks were applied word for word: the first replaces `changelog.md:26` and says a base merged into the branch adds the merge commit and none of the base's own commits; the second replaces `gaps.md:71` and says a view's facts name the base alone where the count is `null` while the preview says nothing of the base. No code changed.
```

### 2. The rejected alternative of reading every log and diff is still priced at three git runs, though the read now runs three without it

```seal
severity: should
location: `seal/threads/1795043695-inbox-first-window/frame/plan.md:92`
evidence: read `seal/threads/1795043695-inbox-first-window/frame/plan.md:42`, `seal/threads/1795043695-inbox-first-window/frame/plan.md:45`, `seal/threads/1795043695-inbox-first-window/frame/plan.md:92`, `seal/threads/1795043695-inbox-first-window/gaps.md:68`, `apps/desktop/src/daemon/daemon.ts:482-510`
regression: round-1#3
```

Why it matters: the unit is the cost of a timed read as `frame/plan.md` states it. `efb42d0` changed that file to fold in the extra `git rev-list` that `aad5655` added. `frame/design.md:214` has `aheadOfBase` read at every timed read, and the fix built that read in `daemon.ts#readCommits` (`:493`). So each read now runs `rev-list` for the count, `rev-parse` for the head and `rev-list` for the count ahead, three git runs per work item with a base branch, as `frame/plan.md:42` and `:45` now say. Row 92 of *Alternatives considered* still rejects reading each log and diff at every timed read for "Three git runs per work item every three seconds". With the count ahead read at every read, that alternative runs four: the two counts, the log and the diff. The row's verdict holds, but the cost it gives is the one from before the fix. The fold rewrote two of the three statements of a read's cost in `frame/plan.md` and left this one. `gaps.md:68`, "two more git processes every three seconds", still holds, since the log and the diff are what would be added.

```markdown
| Read each work item's log and diff at every timed read | One rule. Four git runs every three seconds for a work item with a base branch, one more than reading the head first | Rejected: the head is read, and the log and the diff only where it moved |
```

The block replaces `frame/plan.md:92`. The finding is located in the work item's records alone.

```seal
verdict: fixed 310e3a9
answer: The round's replacement block was applied word for word to `frame/plan.md:92`, which now prices the rejected alternative at four git runs every three seconds for a work item with a base branch. No code changed.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `pr.md` at `efb42d0` was compared, with whitespace collapsed, against the Judgment cells of `frame/plan.md` *Judgments of the run*, with rows counted from row 1 at `:143`. Line 3 is row 8's cell (`:150`) word for word, and line 11 is row 10's (`:152`) word for word. Line 9 is row 12's (`:154`) up to "the mockups draw", a leading part, the same as line 7 is of row 11's. Lines 5 and 13 are rows 9 and 1 word for word. The close's account holds (read).

```seal
confirms: round-1#2
```
What holds: `git()` at `worktrees.ts:39` takes a limit, and `branchCommits` (`:168`) and `branchChanges` (`:201`) pass `BRANCH_OUTPUT_BYTES`, 256 MiB (`:37`). Every other call keeps the 1 MiB that Node itself gives. The case at `test/worktrees.test.ts:287` passed in this round's run (executed). It makes 1500 paths of about 766 bytes each, about 1.15 MB in each read's output and so about a tenth over the old limit. That is the shape of round 1's probe, which failed with `ENOBUFS`. With the limit taken off either read alone, that read gives `null`, and the case's first or second assertion fails. The close's two red runs were not run again, and this result is read. `gaps.md:72` names the 256 MiB bound and the streamed read that remains.

```seal
confirms: round-1#3
```
What holds: `aheadOf` (`worktrees.ts:130`) counts `refs/heads/<baseBranch>..<head>`. `daemon.ts#readCommits` reads it at every read, before the early return for an unmoved head (`:493-497`). The creation sets 0 only where a base branch is recorded (`:245`). `ahead` (`view.ts:387`) reads `aheadOfBase` where a base branch is recorded and `newCommits` where none is, which matches *Scope* item 4's "or the count alone where no base branch is recorded" (`frame/design.md:124`). The cases the close names exist and passed in this round's run (executed). The step at `test/daemon.test.ts:764` pins the read at every timed read and its `inbox`. Its head does not move there, so a read placed after the early return, or one that changed nothing, would never send the `0,3` it waits for. `efb42d0` folded the field into *Scope* item 23 (`frame/design.md:214`) and *Data & interfaces* (`:277`, `:279`), and the extra git run into `frame/plan.md:42`, `:45` and `:131`. Findings 1 and 2 are the two statements the fix and the fold left wrong.

```seal
confirms: round-1#4
```
What holds: `branchCommits` passes `--diff-merges=first-parent` (`worktrees.ts:168`). The comment above it names git 2.31 as the release that added the option, and `CommitInfo` says that a merge's lines are its difference from its first parent (`protocol.ts:36`). The case at `test/worktrees.test.ts:272` passed in this round's run (executed), with git 2.50.1 (`git --version`, executed). The close's search for a floor of git, `git grep -n -i -e "git 2\." -e "git version" -- docs README.md apps/desktop/package.json`, printed nothing and exited 1 again (executed). `gaps.md:73` names what an older git does.

What matched, each read against `frame/design.md` *Scope* item 23 and *Data & interfaces* unless it says otherwise:

- The range `aheadOf` reads cannot carry an option. `baseBranch` comes from `git symbolic-ref` with its `refs/heads/` stripped (`worktrees.ts:70-77`), and `aheadOf` adds that prefix back. So the argument opens with `refs/heads/` whatever the name holds, and `--` ends the revisions.
- `last-look.ts` copies `aheadOfBase` (`:70`, `:80`) and refuses a look without it (`:53`). So a look that an earlier build of this branch wrote reads as no look, which `frame/design.md:216` says. No released build wrote a look, since `last-look.ts` is new on this branch. `work-items.ts` keeps the field out of `work-items.json` (`StoredWorkItem`).
- The cases that slow git (`test/daemon.test.ts:866-893` and `:990-1000`) now wait for two git runs one after the other in each read, `rev-list` beside `rev-parse` and then the count ahead. At 0.2 seconds each against a wait of 5 seconds, and at 1 second against a wait of 50 milliseconds, both still fall on the side the cases need. So `gaps.md` row 25 stays true.
- `threeReads` (`test/daemon.test.ts:726-730`) now waits for six `rev-list` runs, two per read for its one work item with a base branch. The comment beside it says so.

The new cases were read against their groups. The daemon cases at `test/daemon.test.ts:747` and `:767` read the daemon's re-read, its `inbox` and its creation, which the `aheadOf` cases of `test/worktrees.test.ts` do not. The new case of `ahead` at `test/view.test.ts` gives the two counts different values, which no earlier case did. `viewFacts` now gives them different values too. No new case covers only what its group already covers.

The suite's label: nothing in the work item's records says the suite passed at `efb42d0`. `trail/gate.md` records the broad run at `9a3ba95`, and `aad5655` changed the code since, so the suite at this target is `unverified` and the orchestrator answers it. The label is honest.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the typecheck and the documents' checks at `efb42d0`; `trail/gate.md` records the run at `9a3ba95`, before the fix pass changed the code | `seal/config.json` `Broad gate` | the orchestrator, by the broad run after the rounds settle |
| The renderer parts round 1 listed under `## Not judged`, outside this round's target by the prompt | `apps/desktop/src/renderer/`, `apps/desktop/test/view.test.ts`, `apps/desktop/test/themes.test.ts` | as round 1 names: the orchestrator, in the scope of a later round |
| Whether the preview reads right to a person once the base is merged into the branch: it then says "2 commits ahead of main" above a list of the commits since the cut, the base's own among them. *Scope* items 17 and 23 state both parts, so this is no defect in the code | `apps/desktop/src/renderer/list.ts:90`, `seal/threads/1795043695-inbox-first-window/frame/design.md:171` | the owner |
| A git older than 2.31 under the daemon, which `gaps.md:73` says lists no commit; not run | `apps/desktop/src/daemon/worktrees.ts:168` | a measurement on such a git |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/worktrees.test.ts test/daemon.test.ts test/last-look.test.ts test/view.test.ts` in `apps/desktop`, once | 4 files, 258 cases passed, exit 0. This is a narrow run of the four modules the fix diff changed, and not the broad gate. No `test_tmp_*` probe was written |
