# Review round 5: 1795330500-no-question-holds-the-run

```seal
target: cf26986, fixes 9fef4bd..cf26986
```

This is a verifying round. It answers the three findings round 4 closed, and reviews as code the fix diff since round 4's target `799b514`: `b924a4f` (the pull request's text), `e47b44d` (the fix), `b97486f` (the closes), `5bf6106` (the framer's fold) and `cf26986` (the issues named in `gaps.md`). Read whole at `cf26986`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English, and no `seal/parity.json` is declared. Read in the fix diff: the new `apps/desktop/src/daemon/repository-file.ts` and its cases, the changed `worktrees.ts#commitAlone`, `daemon.ts#readRecord` and `#commitWord`, `decision-record.ts#textOf` and `#writeRecord`, `records-place.ts#textOf`, the two comments of `src/shared/protocol.ts`, and the cases added to `daemon.test.ts`, `decision-record.test.ts` and `records-place.test.ts`. Opened outside the fix diff, because the new paths call into them: `records-place.ts:118-182` and `:380-382` (every caller of `textOf`), `daemon.ts:1394-1399` and `:1570-1574` (the pass's read of the records place), `daemon.ts:763-806` (the two cases that write a person's word), `whole-file.ts` and `docs/design.md:444-490`.

Carried from round 4, and not re-derived: its reading of `trail/phases/phase-5.md` to `phase-7.md`, which no commit since `799b514` changed, and its reading of the policy texts in `docs/`, which the fix diff does not touch (`git diff --stat 799b514..HEAD -- docs` prints nothing). Re-derived: every verdict below.

## Findings

### 1. A person's word written while a rebase stands stopped is still lost when the rebase is aborted, and it now holds the rebase's continue

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:763-806`, `apps/desktop/src/daemon/daemon.ts:1431-1440`, `apps/desktop/src/daemon/worktrees.ts:868-875`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:95`, `seal/threads/1795330500-no-question-holds-the-run/changelog.md:68`
evidence: executed `sh test_tmp_abort_keeps_word.sh <scratch>/probe-abort` in the round's scratch directory, once; read `apps/desktop/src/daemon/daemon.ts:763-806`, `apps/desktop/src/daemon/daemon.ts:1431-1440`, `apps/desktop/src/daemon/worktrees.ts:863-886`
reopens: round-4#1
```

Why the close does not hold: round 4's finding named two harms. A word was committed off the branch, and a word given during a stopped rebase was gone from the commit and from the file after `git rebase --abort`. The close fixes the first. `commitAlone` now refuses before `git add` (`worktrees.ts:868-875`), and nothing is committed off the branch or in the middle of an operation. The close also claims the file "stands written". It does not stay written through the abort. `personWrote` writes the record before any check (`daemon.ts:1436`), and `git rebase --abort` resets the worktree hard, so the tracked record's new text goes with it.

Claimed: the close says "the file stays written", and `frame/design.md:95` and `changelog.md:68` say "your word stays written in the file". Found: the probe wrote the word into a tracked `decisions.md` of a linked worktree whose rebase stood stopped on a conflict, and then ran each operation's `--abort`. After `git rebase --abort` the word was lost. After `git merge --abort`, `git cherry-pick --abort`, `git am --abort` and `git revert --abort` it was kept. The person was answered `done`, and the log said only "a rebase is under way in the worktree". The window then reads the decision as `decided` again at the next pass, and says nothing of the lost reversal.

This fix also adds a new harm. The old code committed the record in the middle of the rebase, so the worktree was clean. Now the record stands modified and unstaged. With the conflict resolved and staged, `git rebase --continue` exited 1 and printed "You must edit all merge conflicts and then mark them as resolved using git add", and HEAD stayed detached. That is git's message for any unstaged change during a rebase, and it does not name the daemon's file. The person then has to stage the record into a commit of their rebase, or stash it.

The fix refuses the person's word before it is written, wherever the commit would be refused. Then nothing is lost and nothing stands unstaged, and the person sends the word again once the operation has ended. The refusal is the request's `error`, so the window shows it where it shows the daemon's other refusals. `commitAlone` keeps its two checks for a state that arises between the write and the commit's turn. The precondition: `handle` is synchronous (`daemon.ts:520`), so each of the two cases runs in an async function of its own, as `planRename` does (`daemon.ts:807-808`). `Daemon#close` has to wait for such a function under way, as it waits for `wordCommits`.

```ts
// worktrees.ts: the two checks of commitAlone, moved out so the daemon reads them before it writes
/** Why a commit of one file cannot be made on `branch` in the worktree now, or null where it can: a rebase, a merge, a cherry-pick, a revert or a `git am` under way, or a HEAD that is not that branch. */
export async function whyNoCommit(worktree: string, branch: string): Promise<string | null> {
  const run = ... // the `run` of commitAlone, as it stands
  const markers = await run(["rev-parse", ...UNDER_WAY.flatMap(([marker]) => ["--git-path", marker])]);
  if (markers.failed || markers.printed.length !== UNDER_WAY.length) return markers.said;
  const under = UNDER_WAY.find((_, index) => existsSync(resolve(worktree, markers.printed[index] ?? "")));
  if (under !== undefined) return `${under[1]} is under way in the worktree`;
  const head = await run(["symbolic-ref", "--quiet", "HEAD"]);
  if (head.failed || head.printed[0] !== `refs/heads/${branch}`) return `the worktree is not on the branch ${branch}`;
  return null;
}

// commitAlone, in the place of its two checks
  const why = await whyNoCommit(worktree, branch);
  if (why !== null) throw new Error(why);
```

```ts
// daemon.ts, in each of the cases `reverseDecision` and `answerQuestions`, before `this.personWrote(...)`
          const held = this.store.workItem(workItemId);
          // A word written in a stopped rebase goes with the rebase's abort, and holds its continue: it is refused before it is written.
          const why = held ? await whyNoCommit(held.item.worktree, held.item.branch) : null;
          if (why !== null) throw new Error(`${why}, so the word was not written`);
```

The fix pass owes more than the snippets reach:

- The seven cases of `NOT_COMMITTED` in `apps/desktop/test/daemon.test.ts` then expect an `error` with the file byte for byte as it stood. A case that brings the state about after the write, behind a commit held in a hook, keeps the guard of `commitAlone` pinned.
- *Scope* items 4, 9 and 22 and scenario 20 of `frame/design.md` change.
- The two comments of `src/shared/protocol.ts:397` and `:399` change.
- The docstrings of `commitWord` and `commitAlone` change.
- The sentence of `changelog.md:68` changes.

### 2. The pull request's text still shows eleven of the eighteen committed screenshots

```seal
severity: should
location: `seal/threads/1795330500-no-question-holds-the-run/pr.md:42-54`
evidence: read `docs/design.md:489`, `seal/threads/1795330500-no-question-holds-the-run/pr.md:42-54`, `seal/threads/1795330500-no-question-holds-the-run/trail/rounds/round-4.md`, finding 3; executed `ls seal/threads/1795330500-no-question-holds-the-run/screenshots/`, 18 files
reopens: round-4#3
```

Why the close does not hold: round 4's finding gave five lines to add, and then said that line 490, now `docs/design.md:489`, asks the body to show each committed file. So the fix pass "also adds the seven that neither list names". The close (`b924a4f`) added the five and not the seven, and its answer does not say why. `docs/design.md:489` reads "The files are committed with the change, and the pull request's body shows each as `![what it shows](../blob/<commit>/<path>?raw=true)`". `pr.md` holds eleven image lines, and these seven committed files are not among them: `register-dark-parked.png`, `register-dark-view.png`, `register-light-inbox.png`, `desk-dark-inbox.png`, `desk-dark-view.png`, `desk-light-inbox.png` and `desk-light-parked.png`. The sentence above the images now names Register and Desk "which draw the changed parts differently", and the views of those themes that the text leaves out are views of the change nobody is shown.

````markdown
![Register dark, a work item held by questions](../blob/d3fef2a1df15be3c808a398afef2e98aea4d5520/seal/threads/1795330500-no-question-holds-the-run/screenshots/register-dark-parked.png?raw=true)
![Register dark, a work item's decisions](../blob/d3fef2a1df15be3c808a398afef2e98aea4d5520/seal/threads/1795330500-no-question-holds-the-run/screenshots/register-dark-view.png?raw=true)
![Register light, inbox](../blob/d3fef2a1df15be3c808a398afef2e98aea4d5520/seal/threads/1795330500-no-question-holds-the-run/screenshots/register-light-inbox.png?raw=true)
![Desk dark, inbox](../blob/d3fef2a1df15be3c808a398afef2e98aea4d5520/seal/threads/1795330500-no-question-holds-the-run/screenshots/desk-dark-inbox.png?raw=true)
![Desk dark, a work item's decisions](../blob/d3fef2a1df15be3c808a398afef2e98aea4d5520/seal/threads/1795330500-no-question-holds-the-run/screenshots/desk-dark-view.png?raw=true)
![Desk light, inbox](../blob/d3fef2a1df15be3c808a398afef2e98aea4d5520/seal/threads/1795330500-no-question-holds-the-run/screenshots/desk-light-inbox.png?raw=true)
![Desk light, a work item held by questions](../blob/d3fef2a1df15be3c808a398afef2e98aea4d5520/seal/threads/1795330500-no-question-holds-the-run/screenshots/desk-light-parked.png?raw=true)
````

The seven lines go after line 54, before the attribution line. The commit `d3fef2a` holds each of the seven files, as round 4 listed it.

### 3. The fold's account of the bounded read names three files where six go through it, and says a link swapped in is written through where it is replaced

```seal
severity: should
location: `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:65`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:215`, `seal/threads/1795330500-no-question-holds-the-run/frame/plan.md:17`, `seal/threads/1795330500-no-question-holds-the-run/frame/plan.md:87`, `seal/threads/1795330500-no-question-holds-the-run/gaps.md:71`, `apps/desktop/src/daemon/repository-file.ts:1-8`, `apps/desktop/src/daemon/decision-record.ts:380-383`
evidence: read `apps/desktop/src/daemon/records-place.ts:118-182`, `apps/desktop/src/daemon/records-place.ts:380-382`, `apps/desktop/src/daemon/daemon.ts:1394-1399`, `apps/desktop/src/daemon/daemon.ts:1573`, `apps/desktop/src/daemon/whole-file.ts:17-30`, `man 2 rename` (DESCRIPTION: "If new exists, it is first removed.")
regression: round-4#2
```

The unit is `repository-file.ts` and the framer's fold of it (`e47b44d`, `5bf6106`). Round 4's finding 2 asked for a bounded read of the record and of each `routing.md`. The fix also routed `records-place.ts#textOf` through it, and the fold describes that caller by one of the files it reads. The defect came from that description.

Claimed: `frame/design.md:65` says "The daemon reads what a checkout holds at three paths in its pass: `decisions.md`, each `routing.md` under `threads/`, and the `README.md` a records root is told by". `frame/design.md:215` names `records-place.ts#textOf` "for a root's `README.md`". `frame/plan.md:17` and `:87` and the head comment of `repository-file.ts` name the same three files. Found: `records-place.ts#textOf` reads, through `repositoryFileText` with links followed, the `README.md` at each root name (`:139`), `.github/workflows/hygiene.yml` (`:145`), the root's `config.json` (`:158`), `package.json` (`:179`), and the `README.md` files and `hygiene.yml` again in the plan (`:382`). The pass reads the first three of these for every repository (`daemon.ts:1573` calls `readRecords`, which calls `readRecordsPlace` at `:1395`). So a `config.json` over 1,048,576 bytes now gives no broad gate, a `hygiene.yml` over the bound is no AgenticSeal check, and a `package.json` over it proposes no broad gate. A pipe at any of them no longer holds the daemon's thread. The behaviour is sound. But the sealer audits against these sentences, and so does the settle, and they leave out three of the files whose reading this change altered.

Claimed: `frame/design.md:65`, `frame/plan.md:17` and `gaps.md:71` say "a link put at the record's path between the write's read and its rename is written through". Found: `writeWholeFile` writes `decisions.md.<pid>` and then renames it onto the record's path (`whole-file.ts:18-21`). A rename removes what stands at the new name first, so a link put at the record's path in that interval is replaced by a regular file. It is not written through. That outcome is the one round 4's finding 2 named, and `decision-record.ts:382-383` says "so a write never replaces a link with a file" with no limit. The link that is written through is one put at the partial file's path, which `writeFileSync` follows. Issue #152 says "replaced or followed", so the issue is right and the three records are not.

In `frame/design.md:65`, in place of the sentence that opens "The daemon reads what a checkout holds at three paths" and the one after it:

```markdown
The daemon reads each file of a checkout whose text it acts on through `repositoryFileText`: `decisions.md` and each `routing.md` under `threads/` of a work item's worktree, and, in the repository's main checkout, the `README.md` at each name of a records root, the root's `config.json`, `.github/workflows/hygiene.yml`, and `package.json` where the plan proposes a broad gate. Every one but `package.json` is read in the pass. It reads each only as a plain file of at most 1,048,576 bytes, and it opens each without waiting for a pipe's writer.
```

In `frame/design.md:65`, in place of the sentence on the two limits:

```markdown
Two limits stand, and #152 carries both: a work item's directory that is itself a link is followed, since only the last part of a path is held to be no link, and the write's rename replaces a link put at the record's path between the write's read and its rename, while a link put at the partial file's path `decisions.md.<pid>` is written through.
```

In `frame/design.md:215`, in place of the sentence that opens "Its three callers":

```markdown
Its callers are `Daemon#readRecord` and `decision-record.ts#writeRecord` for `decisions.md`, and `decision-record.ts#textOf` for each `routing.md`, which refuse a link, and `records-place.ts#textOf` for each `README.md`, `config.json`, `hygiene.yml` and `package.json` it reads, which follows one.
```

The fix pass owes the same two corrections in the other places. In `frame/plan.md:17`, the sixth failure names the six files, and its last sentence says the swapped-in link is replaced and the partial file's link is written through. `frame/plan.md:87` names the six files. `gaps.md:71` takes the corrected limit in place, as a row of *Not done* that is reworded and not removed. The head comment of `repository-file.ts` lists the six files. The docstring of `writeRecord` at `decision-record.ts:382-383` ends "so a write never replaces a link it read with a file".

## Confirmations

```seal
confirms: round-4#2
```
What holds: the read of the three files the finding named. `repositoryFileText` opens with `O_RDONLY | O_NONBLOCK`, and with `O_NOFOLLOW` unless links are followed. It then reads only where `fstat` of the open file says a plain file of at most `REPOSITORY_FILE_BYTES` (`repository-file.ts:26-46`). A link at the last part of the path is refused with a sentence that names the file, a link to nothing among it, so `writeRecord` never takes a dangling link for no record (`decision-record.ts:388`). `Daemon#readRecord` turns any throw into the one unread line (`daemon.ts:400-405`), and `decision-record.ts#textOf` turns a refused `routing.md` into no text (`:92-97`). Removing `O_NONBLOCK` makes the pipe case wait for the opener's two seconds, past its one-second limit, so that case pins it (read, `repository-file.test.ts:51-60`). Executed: the five unit files of the fix diff, below, 423 cases, exit 0, the new cases of `repository-file.test.ts`, `decision-record.test.ts`, `records-place.test.ts` and `daemon.test.ts` among them. Round 4's probe of the old reads was not written again, since the new cases hold the same link, the same folder and a file of one byte over the bound, and the probe measured the old code.

What matched: the part of round 4's finding 1 that finding 1 above does not reopen. `commitAlone` reads the five markers in one `git rev-parse` and then `git symbolic-ref --quiet HEAD` before `git add`, and `commitWord` passes the work item's branch (`worktrees.ts:868-875`, `daemon.ts:1463-1468`). No commit lands on a detached HEAD, on another branch or in the middle of an operation. Each of the seven cases of `NOT_COMMITTED` pins the guard it names. With the marker check switched off in the clone, the five cases of an operation failed and the two of HEAD passed. With the HEAD check switched off, the two of HEAD failed and the five passed. With neither switched off, all seven passed. That bears out the close's "each seen red" claim, executed. `frame/design.md:241`, `changelog.md:68` and the protocol comments state the five sentences as `UNDER_WAY` spells them (`worktrees.ts:836-842`).

What matched: the fold `5bf6106` against the code it states, apart from finding 3. *Scope* item 22, the paragraph "The commit of *Scope* item 22", scenario 20, the *Removes* row of the reads, and the rows `frame/plan.md` adds to *Alternatives considered* and *Judgments of the run* say what `e47b44d` built. `changelog.md:63` quotes the unread line as `view.ts:264` and `daemon.ts:404` compose it. Read.

What matched: `gaps.md` in the fix diff. One row of *Not done* is reworded in place, and two rows are added under a new sentence. No row of *Not verified* is touched. Issues #150 and #152 are open in the milestone `release: 0.0.3` with the label `bug`, and #152's two *Done when* lines are the two limits *Scope* item 2 names. Executed: `gh issue view 152` and `gh issue view 150`. The two rows of *Not verified* that name the proofer, the filter's choice and the built-app lines of phase 7, are still open. Round 4 settled both by reading and said each may close, and closing them is the fix pass's or the orchestrator's act.

What matched: the new cases against their groups. The linked-record case of `daemon.test.ts` holds the window's line and the protocol's refusal, which the folder case beside it does not. The writer's case in `decision-record.test.ts` holds that a dangling link gets no new head written over it, which no case of the daemon reaches. The cases of `repository-file.test.ts` hold the bound at its edge, the two link modes and the pipe, each a fact *Scope* item 2 states. No new case only repeats another. Read.

A gap with no finding: between `whyNoCommit`'s reads and `git add`, a person may start an operation in a shell pane, and the commit is then made in it. The window is one git command long. Finding 1's fix narrows it and does not close it, and `commitAlone`'s own checks are what remains.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite at HEAD, the typecheck and the comparison of the documents' editions. The fix pass labelled them `unverified`, and honestly so. This round ran five unit files and no built-app file: each close could be read without one, so no batch ran | `seal/config.json`, key `Broad gate` | the orchestrator, by the broad gate after the rounds settle, then the sealer's spawn |
| Whether the new refusal sentences read in the product's voice, as the window shows them: "Line 1 of decisions.md was not read: the record cannot be read: decisions.md is a link, and Owlery reads it only as a file of its own", and the size sentence, which gives both counts in bytes with no separator | `apps/desktop/src/daemon/repository-file.ts:36-42`, `apps/desktop/src/renderer/view.ts:264` | the owner, beside round 4's row on the words of the questions' section |
| What `git rebase --apply` does with an unstaged record at its abort. The probe ran the merge backend, git's default, alone. Finding 1's fix refuses the word under either backend | `apps/desktop/src/daemon/worktrees.ts:836-842` | none needed where finding 1's fix lands; otherwise the fix pass, by a probe |
| A commit with no time limit, no retry, and a word left for a session. Deferred to #150, and not written up again | `gaps.md` *Not done* | #150 |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/repository-file.test.ts test/decision-record.test.ts test/records-place.test.ts test/daemon.test.ts test/worktrees.test.ts` in `apps/desktop` of the clone at `cf26986` | Exit 0, 5 files, 423 cases passed |
| The same runner on `test/daemon.test.ts -t "commits nothing where the worktree is"`, three times, with `TMP_PROBE_GUARD` set to `markers`, `head` and `none`. Before the runs, the clone's `commitAlone` was edited to skip the marker check or the HEAD check by that variable, and the file was restored after | `markers`: exit 1, the five cases of an operation failed and the two of HEAD passed. `head`: exit 1, the two of HEAD failed and the five passed. `none`: exit 0, 7 passed |
| `sh test_tmp_abort_keeps_word.sh <scratch>/probe-abort`: in a fresh linked worktree for each operation, a conflict stopped on, the word appended to the tracked record unstaged, then the operation's `--abort`, and in one more worktree a resolved rebase's `--continue` | `rebase --abort`: the word lost. `merge`, `cherry-pick`, `am` and `revert --abort`: the word kept. `rebase --continue`: exit 1, "You must edit all merge conflicts and then mark them as resolved using git add", the word kept, HEAD detached |
