# Review round 2: 1795696248-132-a-connected-repositorys-pin-follows-the-app

```seal
target: 62b2880e, fixes a7042c65..62b2880e
```

This is a verifying round of round 1. It read the diff `a7042c65..62b2880e`: the framer's folds `3d4a5801` and `0d4cfcea`, the orchestrator's judgment row `198ae9b9`, the fix `5c5bbd6e` and the close record `62b2880e`. It read whole at `62b2880e` `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md`, `trail/phases/phase-2.md` and `trail/rounds/round-1.md`. No `pr.md` and no `pr.<lang>.md` stand at the target. The base `origin/release/v0.0.5` still names `f683c693`, the commit round 1 read the branch against.

No test, probe or mutation ran in this round. The orchestrator's broad gates run alone on this Mac, and the spawn prompt narrowed the round to reading, `git` and `grep`. Each claim below that something passes or went red is read from the crafter's recorded runs in its scratch directory `fix-1/` (`red-1.txt`, `red-1b.txt`, `red-3.txt`, `green-1.txt`, `daemon.txt`, `records-place.txt`, `batch.txt`, `mutate-daemon.txt`, `mutate-place.txt`), and it is labelled `read`.

Carried from round 1 as coordinates and not searched again: the plan's arms at `records-place.ts:493-499`, the restore at `:610-613` (now moved down by the fix), `seal-state.ts#refusedAt`, and the order of `readCommits` at `daemon.ts:4549-4551`. Round 1's gap with no finding still stands in part. `Daemon#unreadRecords` filters out an archived work item and a work item with no branch (`apps/desktop/src/daemon/daemon.ts:2896`), and no case holds either filter. The head not yet read is now held by `daemon.test.ts:2127`.

Round 1's grounds held one error, which this round corrects. Finding 1 proposed a case in which "the work item's worktree is removed after its head is read, so that `refusedAt` throws through git". It does not throw. `refusedAt` first asks `workItemDirectory`, which reads the worktree's files on disk, and a removed worktree gives null there (finding 2 below). The crafter's case broke the worktree's `.git` link instead, and says so at `daemon.test.ts:2115`. The framer's fold of scenario G took round 1's words.

The three new cases were read against their groups. `daemon.test.ts:2108` holds the `catch` branch of `unreadRecords`, and `daemon.test.ts:2127` holds the branch where no head is held. The scenario G case at `daemon.test.ts:2083` holds only the `ChainStop` branch. `records-place.test.ts:1011` holds the refusal of an edit saved during the plan, which no other case of the move's group holds. None of them repeats a case of its group.

## Findings

### 1. The dialog still says Owlery read each work item's records, under the caption "refuse", where an entry it names was not read

```seal
severity: should
location: `apps/desktop/src/renderer/view.ts:2683`, `apps/desktop/src/renderer/view.ts:2690-2693`, `apps/desktop/test/view.test.ts:5203-5211`, `docs/design.md:443`, `docs/design.ko.md:443`
evidence: read `apps/desktop/src/renderer/view.ts:2681-2693`, `apps/desktop/src/daemon/daemon.ts:2899-2910`, `docs/design.md:443`, `docs/design.ko.md:443`; executed `git grep -n -F "Work items whose records Owlery's readers refuse"`, `git grep -n -F "of each work item of this repository at its branch's head"`
reopens: round-1#1
```

Why it matters: round 1's finding 1 named two sentences of the dialog as false for a work item that was not read. One is "Owlery read the round records, the broad gate's run and the guarantee of each work item of this repository at its branch's head". The other is "They refuse no work item's records". The fix makes the second true: it now shows only where every work item was read. The first still shows in both branches of `recordsDialog`. Claimed in round 1's close of finding 1: "that sentence is now shown only where every work item was read", of the second sentence alone.

`daemon.ts:2900` and `:2910` now put two kinds of entry in `unread` that were not read: "Owlery has not read this work item's branch yet …" and "Owlery could not read these records …". `view.ts:2682` maps each entry to a name and a sentence. Where any entry stands, `view.ts:2692` shows them under the head "Work items whose records Owlery's readers refuse", followed by `read` from `view.ts:2683`, which says that Owlery read each work item's records. For an entry whose own sentence says its records were not read, the head and the closing sentence both contradict it. The person reads three statements that disagree, and two of them tell them the records were read.

The fix pass saw half of this. Its close of round 1's finding 2 says that each row of `docs/design.md:443` "also says 'refuse or did not read'". So the documents now say that the caption "Work items whose records Owlery's readers refuse" stands over work items that were not read, and the window draws that caption unchanged. Both rows also call each entry's sentence "the reader's sentence", which for a work item not read is no reader's.

The two `git grep` runs printed `view.ts:2683` and `:2692`, `view.test.ts:5203` and `:5211`, `docs/design.md:443`, `docs/design.ko.md:443`, `trail/rounds/round-1.md` and `trail/phases/phase-2.md:11`. The round records and the phase record are history and stay as they are. A search on the sentence's words is a sample: a statement of the same fact in other words escapes it.

The window cannot tell a refused entry from a not-read one, because an entry carries only `id`, `title` and `why`. So the fix makes both sentences true of every entry without a new field.

```ts
    const named = (plan.unread ?? []).map(({ title, why }) => ({ name: title, why }));
    const readers = "with the readers that cases hold to the check's answers. It read none of the check's other arms.";
    const read = `Owlery read the round records, the broad gate's run and the guarantee of each work item of this repository at its branch's head, ${readers}`;
    // An entry can be a work item that was not read, so where any is named the sentence leaves those out by their own words.
    const readBut = `Owlery read the round records, the broad gate's run and the guarantee at its branch's head of each work item of this repository but those named here as not read, ${readers}`;
```

```ts
      unread:
        named.length > 0
          ? { head: "Work items whose records Owlery's readers refuse or did not read", items: named, says: `${readBut} Once the check moves, it may refuse the pull requests of the work items named.` }
          : { head: "", items: [], says: `${read} They refuse no work item's records, and the moved check may still refuse a pull request through another arm.` },
```

`view.test.ts:5211` changes to the new head and to `readBut`, and the name of the case at `view.test.ts:5205` changes from "names each work item whose records the readers refuse with the reader's sentence" to "names each work item whose records the readers refuse or did not read with its sentence". The case at `view.test.ts:5216-5220` keeps `READ`. The case is seen red with the old head in place.

In `docs/design.md:443`, "under the caption "Work items whose records Owlery's readers refuse"" becomes "under the caption "Work items whose records Owlery's readers refuse or did not read"", and "the reader's sentence" becomes "its entry's sentence". In `docs/design.ko.md:443`, the caption's words change the same way, and "읽기 도구의 문장을" becomes "그 작업의 문장을".

```seal
verdict: fixed 34829cb3
location: `apps/desktop/src/renderer/renderer.ts:1355-1356`, `apps/desktop/src/renderer/index.html:585`
answer: Applied as the round gives it, with no new field. Where any entry is named, the head reads "Work items whose records Owlery's readers refuse or did not read" and the sentence is `readBut`, "… of each work item of this repository but those named here as not read, …". Where none is named, `read` stays. The case at `view.test.ts:5207` carries the new name and expects the new head and `READ_BUT`. It also builds a plan whose one entry is a work item not read, and expects the same head and sentence. It was seen red with the old head in place (executed, 1 failed), and `seal mutate` putting back the old head and `read` went red twice (executed). Both rows at line 443 take the new caption, and "its entry's sentence" (`그 작업의 문장을`). The docstrings of `RecordsWords.unread` and `recordsDialog`, `renderer.ts#showRecords` and the CSS comment at `index.html:585` say "refuse or did not read" and "its entry's sentence" too. Both `git grep` runs of the evidence line, run again after the commit, print `view.ts:2685` and `:2696`, `view.test.ts:5203`, `:5213` and `:5216`, both rows, `changelog.md:8` and the round records. `view.ts:2685` and `view.test.ts:5203` are the sentence for a plan that names none, which holds.
```

### 2. A work item whose worktree is gone is still left out, and the dialog says its records were read; scenario G says it is named

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:2884-2913`, `apps/desktop/test/daemon.test.ts`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:38`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/design.md:64`
evidence: read `apps/desktop/src/daemon/seal-state.ts:109-111`, `apps/desktop/src/daemon/decision-record.ts:163-173`, `apps/desktop/src/daemon/decision-record.ts:188-191`, `apps/desktop/src/daemon/records-place.ts:194-195`, `apps/desktop/src/daemon/daemon.ts:4584`, `apps/desktop/src/daemon/daemon.ts:1755-1756`, `apps/desktop/test/daemon.test.ts:2115`; executed `git grep -n "worktree is removed"`, `git grep -n -F "git's sentence" -- seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app apps docs`
reopens: round-1#1
```

Why it matters: this is the defect of round 1's finding 1, a work item whose records were not read that the dialog counts as read and clean. It stands for one more instance of the class, which the fix's list of instances did not reach. The tree says the instance happens. `daemon.ts:1755-1756` reads "A person can remove a worktree's folder by hand" and gives the sentence "the folder of work item … is gone".

The daemon reads a branch's head from the repository, not from the worktree: `branchHead(repo, branch)` at `daemon.ts:4584`. So a work item whose worktree folder is gone still has a head in `this.branches`. `unreadRecords` passes it to `refusedAt`, and `seal-state.ts:110-111` first asks `workItemDirectory(item.worktree, item.branch)`. That reads the worktree's files on disk. `rootOf` finds no `README.md` under a missing folder (`records-place.ts:194-195`), `workItemDirectories` returns `[]` (`decision-record.ts:165-166`), and `refusedAt` returns null without starting git. `unreadRecords` drops the null at `daemon.ts:2903`. Where no other entry stands, the dialog shows "Owlery read … of each work item … They refuse no work item's records". The pull request check reads the records at the commit and not the worktree, so it can still refuse them.

The records state the opposite. `frame/design.md:64`, scenario G as folded at `3d4a5801`, reads "Given a third work item whose worktree is removed after the daemon read its head, so that git cannot read its records. Then `unread` names it too, with git's sentence." No case builds that. The case at `daemon.test.ts:2108` breaks the worktree's `.git` link instead, and its comment at `:2115` says the records' "directory stands on disk". The fix's own docstring at `daemon.ts:2892-2894` says "So the dialog says that the readers refuse no work item's records only where each one was read". `changelog.md:8` says "the dialog never says that no work item's records are refused when one was not read". Both are false for a removed worktree. `git grep -n "worktree is removed"` printed `frame/design.md:64` in this work item and a line of #217's frame, which is another subject.

`frame/design.md:38`, *Scope* item 6, holds two other statements that the target contradicts. It limits the list to work items "whose worktree holds its directory", which is the gap this finding names. It also names a work item whose head the daemon has not read only where it is "such" a work item, with its directory. The code at `daemon.ts:2900` names it before any directory is looked for.

```ts
        const head = this.branches.get(item.id)?.head;
        if (head === undefined) return { id: item.id, title: item.title, why: "Owlery has not read this work item's branch yet, so its records were not read, and whether the moved check refuses them is not known." };
        // A person can remove a worktree's folder by hand (`whyNoRun`). The branch's head still holds its records, and `refusedAt` would find no directory there and answer as for a work item with none.
        if (!existsSync(item.worktree)) return { id: item.id, title: item.title, why: cutText(`Owlery could not read these records, so whether the moved check refuses them is not known: the folder of work item ${String(item.id)} is gone: ${item.worktree}`) };
```

Precondition: `existsSync` follows a link, so a worktree that is a link to a folder that stands is read as before, and a link that leads nowhere is named as gone. `existsSync` is already imported at `daemon.ts:2`. Add a case to the group "the records place of a repository" in `daemon.test.ts`, beside the one at `:2108`, that removes the worktree's folder after the daemon read its head and expects the entry. Show it red against `62b2880e`, where `unread` is `[]`.

The fix also reaches the statements that call every not-read entry's sentence git's. The `git grep` on "git's sentence" printed `frame/design.md:38`, `:64`, `:85` and `:109`. The Korean rule text at `frame/design.md:114` says the same in other words ("git의 문장과 함께"), and so do `protocol.ts:112` and the docstring at `daemon.ts:2889-2892` ("git's words"). The grep is a sample, since a statement in other words escapes it. In each of those places, the not-read entry is named "with the sentence that says why its records could not be read" in place of git's sentence. *Scope* item 6 then reads, in place of its second and third sentences: "It holds each work item of the repository that is not archived and has a branch, where `standingOf` at the head the daemon last read of its branch throws a `ChainStop`, with the reader's sentence; each whose head the daemon has not read yet, with the sentence that its records were not read yet; each whose worktree's folder is gone, and each whose reading throws anything else, with the sentence that says why and the words that whether the moved check refuses its records is not known. A work item whose worktree stands and holds no directory for its branch is read as one with no records." Scenario G's third work item stays as it reads. The fix makes it true, and the case at `:2108` adds the broken link beside it.

The fix leaves one part of the class. A worktree that stands but whose working tree no longer holds the work item's directory, while the branch's head does, still reads as a work item with no records. The last sentence of the *Scope* item 6 text above states that limit, so the frame no longer claims the list is whole there.

```seal
verdict: fixed 34829cb3
location: `apps/desktop/src/shared/protocol.ts:112`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/changelog.md:8`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/gaps.md`
answer: The code half is applied as the round gives it. `unreadRecords` names a work item whose worktree's folder is gone, checked with `existsSync(item.worktree)` after the head is found, with "Owlery could not read these records, so whether the moved check refuses them is not known: the folder of work item <id> is gone: <folder>". A case of the group "the records place of a repository" in `daemon.test.ts` commits a work item's records, waits for the daemon to read the head, then removes the worktree's folder. It was seen red against the code before the fix, with `unread` `[]` (executed). `seal mutate` dropping the check went red (executed), and the group passes, 10 cases (executed). The docstring of `unreadRecords` and the comment on `RecordsPlan.unread` at `protocol.ts:112` no longer say "git's words". They name the sentence that says why, and the docstring states the limit, a worktree that stands without its directory. `changelog.md:8` drops "never" and states that limit, and `gaps.md` *Not done* gains it. The frame lines are the framer's fold at `666fd599`. The `git grep` on "git's sentence", run again after the commit outside the round records, prints nothing. `git grep -F "git's words" -- apps docs` prints other functions' docstrings, and `daemon.test.ts:2108`, whose case breaks the `.git` link and does get git's words.
```

### 3. `setUpRecords` reads the workflow before the plan has refused a link, a pipe or an oversized file at its path

```seal
severity: should
location: `apps/desktop/src/daemon/records-place.ts:570-577`, `apps/desktop/src/daemon/records-place.ts:593-595`, `apps/desktop/test/records-place.test.ts`
evidence: read `apps/desktop/src/daemon/records-place.ts:570-578`, `apps/desktop/src/daemon/records-place.ts:174-181`, `apps/desktop/src/daemon/repository-file.ts:24-56`, `apps/desktop/src/daemon/decision-record.ts:158-161`
regression: round-1#3
```

Why it matters: the daemon is the process that stays on and serves every window and pane. The fix added a read of a file in the person's repository that the tree's own reader of such files exists to prevent. Round 1's snippet carried the same flaw. Its precondition, "the plan refuses a link at the path (`standsAsFile`), so this read follows none", was wrong, since this read runs before the plan.

`records-place.ts:571-577` calls `readFileSync(join(folder, WORKFLOW))` before `planRecords` at `:578`, on every setup and not only a move. `readFileSync` follows a link, opens a named pipe without `O_NONBLOCK`, and reads to the end whatever stands there. The tree reads a person's repository files through `repository-file.ts#repositoryFileText` (`:35-52`). That function opens with `O_NONBLOCK` ("The open does not wait for a pipe's writer"), refuses a link unless told to follow it, refuses what is not a plain file, and refuses a file over `REPOSITORY_FILE_BYTES`. `decision-record.ts:158-161` gives the reason: "the daemon reads each one in its pass, from a checkout it did not write". The plan reads the same path through `textOf` (`records-place.ts:175-181`), which uses `repositoryFileText`.

The comment at `records-place.ts:570`, "The plan refuses a link at the path, so a move never follows one here", is true of the write at `:598` and not of this read. Between the plan the person read and their press, a `git pull` can check out a link at that path, since git stores links. A link to a device that never ends, or to a pipe, then makes the daemon read without end or wait on its one thread before the plan ever refuses it. Before the fix, the only read of the path in `setUpRecords` came after the plan had checked it.

Within the frame, *Scope* item 5 says the setup "makes the plan again and refuses as today". Round 1's finding 3 asked for a byte comparison around that plan. The fix added the comparison's first read ahead of the plan's guards, and the defect comes from that ordering. The comparison itself holds: see the confirmation of round 1's finding 3 below.

```ts
  // The workflow's text before the plan compares the file with the commit's. A move writes over it only where the file still holds that text, so an edit saved while the plan runs git is refused, not replaced. It is read as the plan reads a person's file (`repositoryFileText`): no link is opened, no pipe is waited on, nothing over `REPOSITORY_FILE_BYTES` is read, and what it refuses is null here, which refuses a move.
  const beforePlan = ((): string | null => {
    try {
      return repositoryFileText(join(folder, WORKFLOW));
    } catch {
      return null;
    }
  })();
```

```ts
        const bytes = readFileSync(join(folder, path));
        // Thrown before anything is staged or replaced, so the cleanup below writes nothing back and unstages nothing.
        if (beforePlan === null || bytes.toString("utf8") !== beforePlan) throw new Error("The repository changed since the plan was read. Read the plan again.");
```

Precondition: the comparison is of the text decoded as UTF-8. Two files that differ only in bytes that are not UTF-8, each decoded to U+FFFD, compare equal. The read at `:593` stays `readFileSync`, because the plan has just found a plain file there, and the restore keeps the raw bytes. `repositoryFileText` is already imported at `records-place.ts:15`. A case of `records-place.test.ts`, beside the one at `:1011`, places a committed workflow, takes the plan, replaces the file with a named pipe (`mkfifo`), and expects `setUpRecords` to reject with the plan's blocked sentence. Against `62b2880e` the case waits on the pipe until its timeout, which is how it is seen red.

```seal
verdict: fixed 34829cb3
location: `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/gaps.md:15`
answer: Applied as the round gives it. `beforePlan` reads through `repositoryFileText` and is null for whatever that refuses, the write's comparison is of UTF-8 text with a comment on that precondition, and the docstring of `setUpRecords` says the text is read as the plan reads a person's file. A case of `records-place.test.ts`, beside the one on an edit saved during the plan, replaces the committed workflow with a named pipe after the plan, and expects the plan's refusal `differs(WORKFLOW)`. Its limit is 2 seconds. A `perl` writer it starts opens the pipe after 3 seconds and is killed by its PID in the case's cleanup, so a read that waits ends and nothing hangs. Against the code before the fix it failed with "Test timed out in 2000ms" (executed, seen red). After the fix it passes, and `records-place.test.ts` and `view.test.ts` pass, 635 cases (executed). `seal mutate` restoring `readFileSync` before the plan, and dropping the text comparison, each went red (executed). No `perl` process was left (executed, `pgrep`). `gaps.md:15` now says the text is read through `repositoryFileText` and compared as UTF-8.
```

## Confirmations

```seal
confirms: round-1#2
```
What holds: `index.html:1131` gives `#records-unread-head` the class `caption`, and `.caption` at `index.html:87` sets `--size-caption`, weight 600 and `--ink-muted`. It outranks the `h3` reset at `:71` and adds to `dialog section h3` at `:563`, which sets only a margin. Both rows at line 443 name the caption in place, in round 1's words. Read. No case pins the class and no shot holds a named entry, as the close says. The words of that caption are finding 1 of this round.

```seal
confirms: round-1#3
```
What holds: `records-place.ts:571-577` reads the workflow before `planRecords`, and `:593-595` refuses with the stale-plan sentence where the bytes just before the write differ. Nothing awaits between that read and `writeFileSync` at `:598`. The throw comes before `replaced` is set and before anything is staged, so the cleanup writes back nothing and unstages nothing. An edit saved before the plan hashes the file blocks the plan. An edit saved after the hash makes the two reads differ. The case at `records-place.test.ts:1011` puts a `git` shim first on the `PATH`, and the shim appends to the workflow the first time the plan runs `check-ignore`. The crafter's `red-3.txt` shows it failing against the old code with "promise resolved "undefined" instead of rejecting" at `:1025`. `mutate-place.txt` shows it red against the mutant that drops the comparison. Both are read, not run. `gaps.md:15` now says the same in place and states the window that remains. `changelog.md:7` states the refusal. The order of this read against the plan's guards is finding 3.

```seal
confirms: round-1#4
```
What holds: `git grep -n "a path the plan writes\|The workflow that is kept" -- apps/desktop/src` prints `records-place.ts:376` alone, the sentence rewritten in place to "where the commit holds it as a file and the plan does not move its check" (executed). `records-place.ts:410-412` reads "a path the setup creates" in both arms, which `created` at `:493-499` computes. The paragraph on the move ends at "The moved workflow is compared below as a kept file." (`:385-386`). Read.

```seal
confirms: round-1#5
```
What holds: `grep -rn "11-28\|Saturday"` over the work item prints only round 1's own lines (executed). `frame/plan.md:50` dates the milestone 2026-11-29, as `routing.md:16` does.

What matched: the head not yet read. `daemon.ts:2900` names a work item with a branch and no head held, with a fixed sentence. `frame/plan.md:64`, the orchestrator's judgment row `198ae9b9`, grounds this on round 1's finding 1, and `0d4cfcea` folds it into *Scope* item 6, scenario G, *Data & interfaces* and both rule texts. The case at `daemon.test.ts:2127` deletes the branch's ref, so `readBranch` takes the head away at `daemon.ts:4600-4603`. The crafter's `red-1b.txt` shows it red against the old code with `unread` `[]`. Read.

What matched: git's sentence for a reading that throws. `daemon.ts:2905-2910` names the work item with "Owlery could not read these records, …" and git's words, cut by `cutText`, and logs it. The case at `daemon.test.ts:2108` breaks the worktree's `.git` link after the head is read. The crafter's `red-1.txt` shows it red against the old code with `unread` `[]`, and its log line "fatal: not a git repository". `mutate-daemon.txt` shows two mutants red. Read.

What matched: record against another work item's frame. The fix pass changed no section of `docs/` that another work item's `## Rule changes` names. Its one edit to a policy document is this work item's own row at `docs/design.md:443` and `docs/design.ko.md:443`, and it adds no row, so the broad gate's count of table rows across the two editions is unchanged.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the typecheck and the documents' check at `62b2880e`. This round ran no test; the crafter's recorded runs are of single files and cases, so the suite is `unverified` | `gaps.md:7`, `gaps.md:9` | the orchestrator, at the broad gate |
| Whether the crafter's `batch.txt` (2 files, 594 tests) held the built-app file `records-dialog.test.ts`, as the close of round 1's finding 2 claims. The output names no file, and the round did not run it | `apps/desktop/test/records-dialog.test.ts` | the orchestrator's built-app batch |
| The three new cases, the crafter's seen-red runs and its mutation runs, which the round read and did not repeat | `apps/desktop/test/daemon.test.ts:2108`, `apps/desktop/test/daemon.test.ts:2127`, `apps/desktop/test/records-place.test.ts:1011` | the sealer, reading them as the crafter's account |
| The caption's drawing over a named entry in the built app, which no shot holds | `apps/desktop/src/renderer/index.html:1131`, `gaps.md:10` | read only; no scene of the screenshot run names an entry (`gaps.md:17`) |
| Whether an open pull request's next run takes the moved pin once the base holds it (Q3) | `frame/questions.md:16` | a measurement on GitHub |

## Probes

No probe ran in this round. The orchestrator's broad gates run alone on this Mac, and the spawn prompt barred every test run. Findings 2 and 3 rest on reading. Finding 2's case and finding 3's case are each to be seen red by the fix pass as the findings state.
