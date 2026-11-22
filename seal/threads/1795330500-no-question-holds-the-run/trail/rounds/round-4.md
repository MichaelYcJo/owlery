# Review round 4: 1795330500-no-question-holds-the-run

```seal
target: 799b514 against origin/release/v0.0.2
```

This is the first round after the reframe. It reviews the branch against `origin/release/v0.0.2` (`b8c1190`, the merge base), and reads the build of phases 5 to 7 closely: everything the diff changed since round 3's target `3ed9dc7`, with the two merges' resolutions at `fa40810` and `e93129c`. Read whole at `799b514`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, and `trail/phases/phase-5.md` to `phase-7.md`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. No `seal/parity.json` is declared. Read beside them: `docs/architecture.md` *State lives in three places* and *Records are committed to the repository* as #40 left them, `docs/design.md` whole at its *Principles*, *Components and their states*, *The voice of the window's words*, *What to avoid* and *A pull request that changes the window carries its screenshots*, #40's `apps/desktop/src/daemon/decision-record.ts` and `whole-file.ts`, and `pr-check/skills/code-review/scripts/chain_check.py#trailer_findings`.

Carried from rounds 1 to 3, and not re-derived: that the inbox, the history and the archived screen are drawn by one `listScreen`, whose preview calls `detail` and whose lines call one `lineElement` (round 1). Re-derived: every verdict below. Round 3's note on the head comment of `apps/desktop/src/daemon/whole-file.ts` still holds at the target: the comment lists the writers again, and the rules file of a role session (`apps/desktop/src/daemon/adapters/claude.ts:261`) is still not among them. It is a comment, and this round opens no finding for it.

## Findings

### 1. The daemon commits a person's word on whatever the worktree's HEAD is: a detached HEAD, or the middle of a rebase

```seal
severity: should
location: `apps/desktop/src/daemon/worktrees.ts:848-863`, `apps/desktop/src/daemon/daemon.ts:1454-1466`, `seal/threads/1795330500-no-question-holds-the-run/changelog.md:11`, `seal/threads/1795330500-no-question-holds-the-run/pr.md:9`
evidence: executed `sh test_tmp_commit_alone.sh` in the round's scratch directory, once; read `apps/desktop/src/daemon/worktrees.ts:848-863`, `apps/desktop/src/daemon/daemon.ts:1454-1466`
```

Claimed: `changelog.md:11` says "the daemon commits `decisions.md`, and that file alone, on the work item's branch", and `pr.md:9` says the daemon "commits `decisions.md` alone on the work item's branch". Found: `commitAlone` runs `git add`, `git diff --cached --quiet` and `git commit -- <path>` in the worktree, and nothing checks what HEAD is. `commitWord` reads only whether a session of the work item is working. A shell pane never says `working` (`gaps.md` *Not done*, phase 7), and a Claude Code pane whose rebase stopped on a conflict says `waiting`. So a person's answer given while the worktree is detached, or while a rebase stands stopped, is committed there.

The probe ran the same three commands in a scratch repository. On a detached HEAD the commit was made on the detached HEAD, and the branch `owlery/item` kept its tip. In a rebase stopped on a conflict the commit was made in the middle of the rebase, and `git rebase --abort` then dropped it with the file's new text: the person's word was gone from the commit and from the file. The daemon had answered `done` and logged nothing. By reading, a merge under way refuses the partial commit, and the `git reset -- <path>` that follows then rewrites that path's index entry in the middle of the merge.

The fix checks where HEAD stands before the `git add`. It throws where the worktree is not on the work item's branch, or where git is in the middle of an operation, so the file stays written, nothing is staged and the log says why. The precondition: `git rev-parse --git-path` gives a path relative to the worktree, and `resolve` makes it absolute. `resolve` has to be added to the import from `node:path` in `worktrees.ts`, which imports `basename`, `dirname` and `join` today.

```ts
export async function commitAlone(worktree: string, branch: string, path: string, subject: string, trailer: string): Promise<void> {
  const run = (args: string[]): Promise<{ failed: boolean; said: string }> =>
    new Promise((done) => {
      execFile("git", args, { cwd: worktree, encoding: "utf8" }, (error, stdout, stderr) => done({ failed: error !== null, said: `${stderr}${stdout}`.trim() || (error?.message ?? "") }));
    });
  // The commit lands on the work item's branch or nowhere: not on a detached HEAD or another branch, and not in the middle of a rebase, a merge, a cherry-pick, a revert or a bisect.
  const head = await run(["symbolic-ref", "--quiet", "HEAD"]);
  if (head.failed || head.said !== `refs/heads/${branch}`) throw new Error(`the worktree is not on the branch ${branch}, so nothing was committed`);
  for (const marker of ["rebase-merge", "rebase-apply", "MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "BISECT_LOG"]) {
    if (existsSync(resolve(worktree, (await run(["rev-parse", "--git-path", marker])).said))) throw new Error(`git is in the middle of an operation in the worktree (${marker}), so nothing was committed`);
  }
  // ... the `refused` helper, the `git add`, the test of what is staged and the `git commit` as they stand
}
```

In `daemon.ts#commitWord`, the call becomes `commitAlone(worktree, held.item.branch, relative(...), subject, ...)`. The fix pass owes three more things that the snippet does not cover. The first is a case in `apps/desktop/test/daemon.test.ts`, group "the commit of a person's word": a worktree on a detached HEAD gets no new commit, the record stays written, and the log names the branch. The second is the docstrings of `commitAlone` and `commitWord`. The third is the sentence "The commit of *Scope* item 22" of `frame/design.md` *Data & interfaces*, line 239, which is the orchestrator's to fold.

### 2. The pass reads `decisions.md` through a link, and a file of any size or kind, on the daemon's one thread, and a write replaces a link with a file

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:393-399`, `apps/desktop/src/daemon/daemon.ts:1427-1433`, `apps/desktop/src/daemon/decision-record.ts:373-381`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_record_reads.test.ts` in `apps/desktop` of the clone, once, with `OWLERY_BACKGROUND=1`; read `apps/desktop/src/daemon/daemon.ts:393-399`, `apps/desktop/src/daemon/decision-record.ts:91-97`, `apps/desktop/src/daemon/decision-record.ts:373-394`, `apps/desktop/src/daemon/whole-file.ts:17-30`
```

This work is the first caller of #40's record module in the daemon (`git grep workItemDirectory` at `b8c1190` prints the module alone). So its conditions take effect here, in the pass that runs every 3 seconds while a window is connected, for every work item. `readRecord` reads with `readFileSync(join(directory, RECORD_FILE), "utf8")`, synchronously, on the thread that serves every pane and every client. Nothing checks what the path is or how large it is. The *Security* and *Concurrency* axes ask what a file the repository holds reaches. A `decisions.md` checked out of a repository is input that crosses into the daemon.

What the probe showed: a `decisions.md` that is a link to a file outside the worktree is read, and its blocks are listed as the work item's decisions. A `writeRecord` on it replaces the link with a regular file, because `writeWholeFile` renames over the path. A tracked link would then be committed as a file, under the person's name. A record of 20 MB of prose took 203 ms to read, with nothing listed, and the pass repeats that read every 3 seconds. A record of 10,000 blocks took 43 ms and gives an `inbox` of 1.4 MB. By reading, a link to a device that never ends, such as the zero device, makes `readFileSync` read until it fails on memory, and a FIFO holds the open with no writer. The `git` reads of the same pass are asynchronous and bounded by `BRANCH_OUTPUT_BYTES` (`worktrees.ts:40`). The record's read has neither property.

The frame's fourth and fifth failures (`frame/plan.md` *Technical context*) accept many blocks and many directories. They do not cover a link or a file that is not a record at all. *Scope* item 2 already says "A `decisions.md` that stands and cannot be read is one such line, at line 1, that says why". The fix reads the record as a file of its own and of a bounded size, and anything else is that one unread line. The precondition: `O_NOFOLLOW` refuses a link at the last part of the path only, so a directory under `threads/` that is itself a link is still followed. On macOS and Linux, `open` with `O_NOFOLLOW` on a link fails with `ELOOP`.

```ts
// decision-record.ts, in the place of `recordText`, exported, and read by `writeRecord` and by `Daemon#readRecord` alike
import { closeSync, constants, fstatSync, openSync, readFileSync, readdirSync } from "node:fs";

/** The most of a record that is read. */
const RECORD_BYTES = 1024 * 1024; // NAME NOT IN TREE

/** The record's text, or null where no file stands at its path. A link, what is not a plain file and a file over `RECORD_BYTES` throw, as any other failure to read it does, so a write never replaces such a file and the pass names it as one unread line. */
export function recordText(file: string): string | null {
  let fd: number;
  try {
    // A link is refused, and a FIFO does not hold the open.
    fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    if (code === "ELOOP") throw new Error("it is a link, and a record is read only as a file of its own");
    throw error;
  }
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile()) throw new Error("it is not a plain file");
    if (stat.size > RECORD_BYTES) throw new Error(`it holds ${String(stat.size)} bytes, and a record is read up to ${String(RECORD_BYTES)}`);
    return readFileSync(fd, "utf8");
  } finally {
    closeSync(fd);
  }
}
```

```ts
// daemon.ts#readRecord
      try {
        const text = recordText(join(directory, RECORD_FILE));
        if (text !== null) record = readDecisionRecord(text);
      } catch (error) {
        record = { ...record, refusals: [{ line: 1, why: `the record cannot be read: ${error instanceof Error ? error.message : String(error)}` }] };
      }
```

`writeRecord` already throws where `recordText` throws, so `personWrote` answers `error` and `Daemon#decided` and `Daemon#park` log and return nothing. No other change is needed there. The snippet does not reach `textOf` of `decision-record.ts:91`, which reads each `routing.md` under `threads/` through a link and with no bound in the same pass. The fix pass owes that read the same guard, and a case in `apps/desktop/test/decision-record.test.ts` or `daemon.test.ts` that reads a linked record as one unread line and leaves the link standing after a refused write.

### 3. The pull request's text shows six of the eighteen screenshots, and none of Night watch's light inbox or view

```seal
severity: should
location: `seal/threads/1795330500-no-question-holds-the-run/pr.md:17-26`
evidence: read `docs/design.md:485-490`, `seal/threads/1795330500-no-question-holds-the-run/pr.md:17-26`; executed `git ls-tree d3fef2a seal/threads/1795330500-no-question-holds-the-run/screenshots/`, 18 files
```

`docs/design.md:485` asks that a pull request which changes the window carry a screenshot of each view it changed, in Night watch's dark and light appearances, and in each other theme that draws the changed part differently. Line 490 says the body shows each committed file as `![what it shows](../blob/<commit>/<path>?raw=true)`. This work changed three views: the inbox (the mark and the preview's decisions), a work item's view (the decisions with "Reverse"), and the parked view. It committed eighteen files at `d3fef2a`. `pr.md` shows six: Night watch dark parked, inbox and view, Night watch light parked, Register light parked and Desk dark parked. Night watch's light inbox and light view are missing, and so is every view of Register and Desk that draws the decisions. `trail/phases/phase-6.md` says Register draws a rule under each decision, so Register draws the changed part differently. The six lines that stand use the right form and the right commit. The sealer and the owner read the window from this text, so the missing files are views of the change that nobody is shown.

````markdown
![Night watch light, inbox](../blob/d3fef2a1df15be3c808a398afef2e98aea4d5520/seal/threads/1795330500-no-question-holds-the-run/screenshots/night-watch-light-inbox.png?raw=true)
![Night watch light, a work item's decisions](../blob/d3fef2a1df15be3c808a398afef2e98aea4d5520/seal/threads/1795330500-no-question-holds-the-run/screenshots/night-watch-light-view.png?raw=true)
![Register dark, inbox](../blob/d3fef2a1df15be3c808a398afef2e98aea4d5520/seal/threads/1795330500-no-question-holds-the-run/screenshots/register-dark-inbox.png?raw=true)
![Register light, a work item's decisions](../blob/d3fef2a1df15be3c808a398afef2e98aea4d5520/seal/threads/1795330500-no-question-holds-the-run/screenshots/register-light-view.png?raw=true)
![Desk light, a work item's decisions](../blob/d3fef2a1df15be3c808a398afef2e98aea4d5520/seal/threads/1795330500-no-question-holds-the-run/screenshots/desk-light-view.png?raw=true)
````

Line 490 says the body shows each committed file, so the fix pass also adds the seven that neither list names, in the same form: `register-dark-parked.png`, `register-dark-view.png`, `register-light-inbox.png`, `desk-dark-inbox.png`, `desk-dark-view.png`, `desk-light-inbox.png` and `desk-light-parked.png`. The sentence above the images ends "in Night watch", and it then names the three themes.

## Confirmations

What matched: the merges' resolutions. At `fa40810` the row "The daemon" of `docs/architecture.md` *State lives in three places* and its Korean row carry #40's text: "what the person has seen" stands in the daemon's cell, and the decisions and questions stand in the repository's cell. *Scope* item 21 asks for that. At `e93129c` the four conflicted files keep both sides, and the expectations read #130's state words "Needs you" and "need you". Read: `git diff origin/release/v0.0.2 799b514 -- docs/` and `docs/architecture.md:186-192`.

What matched: the policy texts in both editions. Each of the fourteen entries of `frame/design.md` *Data & interfaces*, the policy documents' text, stands in the document its `file` names. No text a `from` quotes stands outside its `to`. Each `check:` line stands directly under its paragraph, in English in both editions, and the paragraphs and rows close their sections. Executed: a Python script, given on its standard input in the clone, that reads the entries and the four documents. The heading and table-row counts are the broad gate's comparison, and this round did not run it.

What matched: the daemon on the record (*Scope* items 1 to 4, 6 to 9, 12, 13, 15). `readRecord` maps #40's shapes onto the protocol's as the list under `src/daemon/daemon.ts` in *Data & interfaces* says (`daemon.ts:393-422`). The pass reads every open work item's record before it waits on git (`daemon.ts:1558-1566`). `answerQuestions` holds the answers against the text the write is applied to (`daemon.ts:775-801`). The times are dropped at a delete, at a repository's removal and where an id is given, and not at the start. `record-times.ts` keeps the change in memory and writes the file only where it changed. Executed: the five unit files below, 758 cases, exit 0.

What matched: the commit of a person's word, apart from finding 1. `commitAlone` stages and commits the one path with `git commit -- <path>`, and no option in it skips a hook or a signature. A staged change and an unstaged change of other files stand as they stood. A turn whose file is already committed commits nothing. A failure unstages the path and logs git's words with the hook's. The commits of one worktree are chained by `wordCommits`, and `close` waits for them (`daemon.ts:452`). A pane counts as working only while `alive` is true. The trailer `Seal-Routing: <directory>` is a value `trailer_findings` accepts where the pull request declares that directory (`chain_check.py:2030-2043`), as `frame/questions.md` Q4 answers. Executed: the group "the commit of a person's word" among the unit run, which passed.

What matched: the `gaps.md` row that names the proofer for the lines phase 7 added to `apps/desktop/test/decisions-and-questions.test.ts:224-233`. Those lines can fail. The case's worktrees are cut with `git worktree add -b` and hold the work item's directory uncommitted (`decisions-and-questions.test.ts:79-80`). So against a daemon that commits nothing, the newest subject is the base's "first" and `rev-list --count HEAD` is 1. The wait ends after 5 seconds, and `expect(newest()).toBe(...)` fails. Read, and settled without a built-app run. The row may close on this reading.

What matched: the `gaps.md` row that names the proofer for the filter's choice in the sidebar and on the history screen. `sidebar.ts:59` fills the sidebar's control from `filterChoices`, and its list is `narrowed()`, which is `matchWorkItems(entries(), held.query, held.filter)` (`shared.ts:74-75`). `list.ts:83` fills the screens' control from the same function, and `list.ts:165` narrows the history with `held.filter`. The archived screen alone passes `"all"`. Read. The row may close on this reading.

What matched: the window's reading of the look. `decisionMark`, `askedSection` and `changesSince` read `held.lastLook`, which `ready` sets and nothing else changes (`renderer.ts:1423-1424`). `looked` only tells the daemon (`renderer.ts:1581-1582`). So a count of unseen decisions, and an "Answered" section, last until the window's next `ready` after a look. *Scope* items 5 and 11 define "seen" by the look the window holds, `gaps.md` *Not done* names that the count falls only at the window's next start, and `changelog.md` says "until the next start of the window after you looked". The sentences "The line says how many decisions the person has not seen" and "an answered question leaves the work item's view at the next look" in `docs/product.md:35` use "look" as *Foundation* already uses it for the summary. This round reads them as that convention and opens no finding.

What matched: the answer flow. `showQuestions` draws the section again only where its key changes, and `sendAnswers` sends one answer for each question shown. A question with no option sends its field's words. "Send answers" stays off until the daemon answers. A refusal is shown in the section with the daemon's sentence. `parkNotifications` raises nothing for a work item the window held as parked, for a muted one and for the one in front. Read: `work-item-view.ts:669-787`, `renderer.ts:1218-1224`, `view.ts#answersFor`.

What matched: the screenshots against `docs/design.md`. Opened: `night-watch-dark-parked.png`, `night-watch-light-parked.png`, `night-watch-dark-inbox.png`, `night-watch-dark-view.png`, `register-light-parked.png`, `desk-dark-parked.png`, `register-dark-inbox.png` and `desk-light-view.png`. The parked section has Night watch's yellow edge, stands between two rules in Register, and is a card with no signal in Desk. The chosen option is in the strong ink, and no blue, purple, pill or red stands outside the seal. The state's words are "Needs you". The line that was not read is in `--state-failed`, which is Night watch's yellow. That line is told from a wait by its words, as *Principles* 4 allows. The words of that line come from #40's reader, "the decision block holds no `decided:` line, and it holds one". The sentence reads as a contradiction, and this diff did not write it. The other ten files were not opened.

A gap with no finding: `apps/desktop/src/daemon/whole-file.ts` puts a partial file `decisions.md.<pid>` beside the record for the length of a write, inside the person's worktree. A `git add -A` by an agent at that moment would stage it. That is #40's writer, and it was weighed here only because this work now calls it at a person's word.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite at HEAD, the typecheck and the comparison of the documents' editions. Every phase labelled them `unverified`, and honestly so. This round ran five unit files and no built-app file. The built-app claims this round needed were settled by reading, so no batch ran | `seal/config.json`, key `Broad gate` | the orchestrator, by the broad gate, then the sealer's spawn |
| The commit in a repository that signs, or whose hook asks the person something or does not end, and the close that waits on it. Deferred with the other open edges of the commit to #150 (`frame/plan.md` *Judgments of the run*, 2026-11-23) | `apps/desktop/src/daemon/daemon.ts:452`, `apps/desktop/src/daemon/worktrees.ts:848` | #150; the owner, in the running app |
| Whether the words of the section of questions, of "Reverse" and of the mark "2 decisions without asking, 1 reversed" are the product's voice | `gaps.md` *Not verified* | the owner |
| Whether each new case covers something its group did not already cover. This round read the new groups of `daemon.test.ts` ("the commit of a person's word", the record and the times) and found no case that only repeats another. `record-times.test.ts`, `view.test.ts` and `last-look.test.ts` were read at the lines the diff changed alone | `apps/desktop/test/` | the next round, where a fix pass adds cases |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/record-times.test.ts test/last-look.test.ts test/view.test.ts test/daemon.test.ts test/worktrees.test.ts` in `apps/desktop` of the clone at `799b514` | Exit 0, 5 files, 758 cases passed |
| `sh test_tmp_commit_alone.sh <scratch>/probe-repo`: `commitAlone`'s three git commands, in a worktree on a detached HEAD and in one whose rebase stopped on a conflict | Exit 0. Detached: "committed", HEAD is the new commit, and the branch tip stayed "second". Rebase: "committed" in the middle of the rebase, and after `git rebase --abort` the branch tip is "second" again and the commit is gone |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_record_reads.test.ts` in `apps/desktop` of the clone | Exit 0. A `decisions.md` that links to a file outside the worktree is read, and its decision is listed. After `writeRecord` the path is no longer a link, and the target holds one decision. 20 MB of prose: 203 ms, 0 decisions. 10,000 blocks: 43 ms, a read of 1,436,252 characters as JSON |
