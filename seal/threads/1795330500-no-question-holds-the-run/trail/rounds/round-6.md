# Review round 6: 1795330500-no-question-holds-the-run

```seal
target: 4d74567, fixes 676424f..4d74567
```

This is a verifying round. It answers the three findings round 5 closed, and it reviews as code the fix diff since round 5's record `676424f`. The commits in that diff are `806a87f` (the pull request's text), `c623b81` (the fix), `e81a64e` (the comments), `59ecfdf` (the order case), `209e0d4` (the closes), `ad816d4` (the framer's fold), the base merge `0d3c5e0` of `cf09145` (#155), `a3dc20b`, `7bdca2f`, `a13182f` and `4d74567` (`gaps.md`), `c8e3dcc` (the screenshot run and the eighteen files), `380b2de` (`pr.md`) and `addc6b3` (the framer's fold of the merge). The merge is read as code through `git show --remerge-diff 0d3c5e0`, which names fourteen files that held both sides. Read whole at `4d74567`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English, and no `seal/parity.json` is declared.

Opened outside the fix diff, because the fix or the merge calls into it: `worktree-setup.ts#readSetup` and `#beginSetup`, `daemon.ts:594` (the plan's read of the setup), `renderer.ts#ask`, `#answered` and `#openReverse`, `work-item-view.ts#sendAnswers` and `#takeAnswers`, `index.html:159-170`, `test/decisions-and-questions.test.ts:220-233`, `seal/threads/1795339001-worktree-setup/frame/plan.md` *Overlap with the release* and its changelog, and issues #150 and #157.

Carried from round 5, and not re-derived: its reading of `trail/phases/phase-1.md` to `phase-7.md`, which no commit since `cf26986` changed (`git diff --stat cf26986..HEAD -- seal/threads/1795330500-no-question-holds-the-run/trail/phases` prints nothing), and its reading of the six callers of `repositoryFileText`. Re-derived: every verdict below.

## Findings

### 1. Since the base merge, the bounded read is no longer the one way the daemon reads a file of the person's repository whose text it acts on

```seal
severity: should
location: `apps/desktop/src/daemon/repository-file.ts:1-7`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:65`
evidence: read `apps/desktop/src/daemon/repository-file.ts:1-12`, `apps/desktop/src/daemon/worktree-setup.ts:37-48`, `apps/desktop/src/daemon/worktree-setup.ts:362-375`, `apps/desktop/src/daemon/daemon.ts:563`, `apps/desktop/src/daemon/daemon.ts:594`, `apps/desktop/src/daemon/daemon.ts:991`; executed `grep -rn "readFileSync\|readFile(" apps/desktop/src/daemon`
```

The fix of round 5's finding 3 (`e81a64e`) rewrote the head comment of `repository-file.ts`. It opened with "The one way the daemon reads a file of a person's repository whose text it acts on in its pass". It now reads "The one way the daemon reads a file of a person's repository whose text it acts on. Six files are read through it". The fold `ad816d4` wrote the same claim into `frame/design.md:65`: "The daemon reads each file of a checkout whose text it acts on through `repositoryFileText`", followed by the six files. Both held at `ad816d4`. The base merge `0d3c5e0` brought #155's `worktree-setup.ts#readSetup`. It reads `.worktreesetup` in the repository's main checkout with `readFile`, through a link and of any size (`worktree-setup.ts:41`). The daemon acts on that text: the plan shows it in the "New work item" form (`daemon.ts:594`), and `beginSetup` runs it as the setup's command in a pane, at a creation (`daemon.ts:563`) and at "Run setup again" (`daemon.ts:991`). So at HEAD both sentences claim a reach the tree does not have. Neither the merge nor the fold `addc6b3` touched them.

The sealer audits against `frame/design.md:65`. An agent who changes the daemon's reads reads the head comment. Each would take `.worktreesetup` for a bounded read, as a link refused or followed by choice, a pipe never waited on, and a file of at most 1,048,576 bytes. None of that holds. The behaviour itself is #155's, sealed with it. `readSetup` runs off the daemon's thread and outside the pass, so the reason the head comment gives for the bound, a synchronous read on the thread that serves every pane, does not reach it. Whether `.worktreesetup` should take the bound is not this work's question (`## Not judged`).

The finding takes neither a `regression:` nor a `reopens:` line. Round 5's finding 3 is confirmed below for the six files, and its fix's commits did not bring the read that breaks the claim. The merge brought it.

A qualifier such as "in its pass" does not repair the sentences, since `decisions.md` is also read at a person's write, at an archive, at a restore and at the daemon's start. So the fix names the one exception. In `apps/desktop/src/daemon/repository-file.ts`, the first sentence of the head comment:

```ts
// The one way the daemon reads a file of a person's repository whose text it
// acts on, but for the setup's command (below). Six files are read through it: a work item's `decisions.md` and
```

The rest of the comment stands. After its last sentence, before the imports:

```ts
// `.worktreesetup` of the main checkout, whose command a worktree's setup
// runs, is read by `worktree-setup.ts#readSetup` with `readFile`, at a plan,
// a creation and a "Run setup again", off this thread and outside the pass,
// and none of these bounds holds it.
```

In `frame/design.md:65`, in place of the sentence that opens "The daemon reads each file of a checkout whose text it acts on":

```markdown
The daemon reads each file of a checkout whose text it acts on through `repositoryFileText`, but for `.worktreesetup` of the main checkout: `decisions.md` and each `routing.md` under `threads/` of a work item's worktree, and, in the repository's main checkout, the `README.md` at each name of a records root, the root's `config.json`, `.github/workflows/hygiene.yml`, and `package.json` where the plan proposes a broad gate. `.worktreesetup`, which #155 brought at the base merge `0d3c5e0`, is read by `worktree-setup.ts#readSetup` with `readFile`, off the daemon's thread, and takes none of the bounds below.
```

The `frame/design.md` sentence is the framer's or the orchestrator's to fold, as round 5's closes say of the frame. `frame/design.md:215` names the callers of `repositoryFileText` and makes no claim of reach, so it stands.

```seal
verdict: fixed 55b955b
answer: `repository-file.ts`'s head comment names the setup's command as the exception and ends with the round's paragraph on `readSetup`, and `frame/design.md:65` holds the round's sentence.
```

### 2. The frame says each of the two messages is answered once git has said where the worktree stands, but three refusals answer before git is asked

```seal
severity: should
location: `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:209`
evidence: read `apps/desktop/src/daemon/daemon.ts:784-800`, `apps/desktop/src/daemon/daemon.ts:803-832`, `apps/desktop/src/daemon/daemon.ts:1552-1555`
```

Claimed: `frame/design.md:209`, from the fold `ad816d4`, says of `reverseDecision` and `answerQuestions`: "Each is answered once git has said where the worktree stands, with `done` before the `inbox` that carries the change, or with `error`". Found: three refusals are sent before `whyNoCommit` runs. A message of another shape is refused at `daemon.ts:787` and `:808`. An empty reversal, "Say why the decision is reversed.", is refused at `:789`. A work item the daemon does not keep is refused at `:1554`, where `personWrote` throws before it builds the chain. Each throws inside the async case and reaches its `catch` without a call of git. The code is sound, and *Scope* items 4 and 9 list these refusals without an order. The sentence is the one that names an order, and it is wrong for these three. A builder of #53's question screen who reads it would take every answer for one that waited on git.

In `frame/design.md:209`, in place of "Each is answered once git has said where the worktree stands, with `done` before the `inbox` that carries the change, or with `error`, the refusal of a worktree off its branch or in the middle of an operation among them (*Scope* item 22).":

```markdown
Each is answered with `done` before the `inbox` that carries the change, or with `error`. A message of another shape, an empty reversal and a work item the daemon does not keep are refused before git is asked. Every other answer comes once git has said where the worktree stands, and the refusal of a worktree off its branch or in the middle of an operation is among them (*Scope* item 22).
```

This is a frame sentence, so the fold is the framer's or the orchestrator's.

```seal
verdict: fixed 55b955b
answer: `frame/design.md:209` holds the round's sentences: the three refusals before git, then every other answer once git has said where the worktree stands.
```

### 3. The deferral of a stage's write during a git operation to #150 stands in no record of the work item

```seal
severity: should
location: `seal/threads/1795330500-no-question-holds-the-run/gaps.md:69-72`, `seal/threads/1795330500-no-question-holds-the-run/frame/plan.md:106`
evidence: executed `grep -rn "writtenRecord\|stage's block\|stage writes\|whyNoCommit" seal/threads/1795330500-no-question-holds-the-run` (no line outside `trail/` names the gap), `gh issue view 150 --json comments`; read `apps/desktop/src/daemon/daemon.ts:1552-1575`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:323`
```

Round 5's fix refuses a person's word before it is written where a rebase, a merge, a cherry-pick, a revert or a `git am` is under way. `Daemon#decided` and `Daemon#park` still write through `writtenRecord` and never ask `whyNoCommit`. So a block a stage writes while a rebase stands stopped goes with `git rebase --abort`, which is round 5's probe of finding 1 with a stage in place of a person. The orchestrator deferred this to #150, by a comment on the issue: "Found by #119's fold of round 5 on 2026-11-23: `Daemon#decided` and `Daemon#park` ... write a stage's block without asking `worktrees.ts#whyNoCommit`". The work item's records hold no trace of it. `gaps.md` *Not done* names #150 only for the commit's time limit, retry and the word left for a session (`:72`). `frame/plan.md` *Judgments of the run* ends at round 4 (`:106`) and has no row for round 5's closes or for this deferral. The deferral to #150 is not in doubt. What is wrong is the place it stands. The sealer audits the work item's records against the issue, and the settle reads `gaps.md`, so a gap that stands only on #150 is one neither reads. `skills/core/SKILL.md` *A judgment stands on a source document* asks for the decision, its grounds and the document it was judged against in the work item's records.

In `gaps.md`, after the two bullets under "Review round 4 left two things":

```markdown
Review round 5 left one thing, with an issue in `release: 0.0.3`.

- **`Daemon#decided` and `Daemon#park` write a stage's block without asking where the worktree stands.** A person's word is refused before it is written where the worktree is off its branch or a git operation is under way in it (`worktrees.ts#whyNoCommit`), and a stage's block is not, so a block written while a rebase stands stopped goes with `git rebase --abort`. Nothing calls either method yet: their callers, #41 and #42, refuse or defer the write the same way. #150.
```

In `frame/plan.md` *Judgments of the run*, a row after the last:

```markdown
| 2026-11-23 | Round 5: finding 1 built by the fix pass (`c623b81`, `59ecfdf`), finding 3 in code by the fix pass (`e81a64e`), and both folded by the framer (`ad816d4`); finding 2 closed by the orchestrator in `pr.md` (`806a87f`). The stage's write during a git operation, which finding 1's fix leaves to `Daemon#decided` and `Daemon#park`, goes to #150, and `gaps.md` *Not done* names it | `trail/rounds/round-5.md`; the fix pass's hand-back; #150's comment of 2026-11-23 | the plugin's `skills/implement/orchestration.md` *A decision made after the frame is committed is folded* |
```

The *Judgments* row is the orchestrator's. The `gaps.md` bullet is the fix pass's or the orchestrator's.

```seal
verdict: fixed 55b955b
answer: `gaps.md` *Not done* holds the round's bullet under "Review round 5 left one thing", and `frame/plan.md` *Judgments of the run* holds the round's row.
```

## Confirmations

```seal
confirms: round-5#1
```
What holds: a person's word is refused before it is written where the worktree is off its branch or in the middle of an operation. `personWrote` takes the words of one worktree in the chain `Daemon#words` (`daemon.ts:215`). In its turn each word awaits `whyNoCommit` (`worktrees.ts:861`). Where the function gives a reason, the word throws "Nothing was written: " followed by the reason and ". Send it again once the worktree is on its branch and nothing is under way in it.", before `writeRecord`. After the await, the store read, the write, the read of the record and the commit's turn run in one turn of the daemon's thread. `commitAlone` asks `whyNoCommit` again before its `git add` (`worktrees.ts:888`). `Daemon#close` waits for the chain and then for the commits (`daemon.ts:469`). The window shows the refusal: the dialog's `answered` writes it into `reverse-error` and turns the button on again, with the field as typed (`renderer.ts#answered`), and the section's `takeAnswers` writes it into its error line, with the choices kept. `changelog.md:11` and `:18`, the two protocol comments, *Scope* items 4, 9 and 22, scenario 20, and the paragraph "The commit of *Scope* item 22" state what the code does, with the exception of finding 2.

Executed: the nine unit files below, exit 0, 912 cases. Among them are the seven cases of `NOT_COMMITTED`, now "refuses a reversal and an answer where the worktree is $name" (`daemon.test.ts:4065`), the held-hook case of `commitAlone`'s own guard (`:4096`), the order case (`:4124`) and the close case (`:4139`). The close claims each guard was seen red. Executed for the two guards this round could remove alone: with the chain removed, the order case failed with the `done` answers in the order 5, 3, 1, 10, 2 and on. With the close's wait for the chain removed, the close case failed with the decision still `decided`. Read: removing the check in `personWrote` writes the word and answers `done`, which each `NOT_COMMITTED` case expects as an `error`. Removing the check in `commitAlone` commits the held second word on a detached HEAD and logs nothing, which the case at `:4096` expects as one log line. Round 5's probe of `git rebase --abort` was not written again. It measured git and not the daemon, and no word reaches the file in that state now.

```seal
confirms: round-5#2
```
What holds: `pr.md:21-38` shows each of the eighteen files of `screenshots/`, one line each, linked at `c8e3dcc` after `380b2de`. `git diff --stat c8e3dcc 4d74567 -- seal/threads/1795330500-no-question-holds-the-run/screenshots` prints nothing, so the linked files are the files at HEAD. Executed: `ls` of the folder, 18 files, each named once in `pr.md`.

```seal
confirms: round-5#3
```
What holds: the head comment of `repository-file.ts` and `frame/design.md:65` and `:215` name the six files that go through `repositoryFileText`, and say which the pass reads. `frame/plan.md:17` and `gaps.md:71` say that the write's rename replaces a link put at the record's path after the read, and that a link put at the partial file's path is written through. So does the docstring of `writeRecord` (`decision-record.ts:380-386`). Read. Finding 1 is the merge's, and is about another sentence of the same paragraph and comment.

What matched: the base merge as code. In every one of the fourteen files `git show --remerge-diff 0d3c5e0` names, the resolution keeps both sides:

- `WorkItem` holds `setup` after `unread` (`protocol.ts`).
- `CameLater` holds `setup` among the late fields, `isWorkItem` reads all four, and `lookOf` copies all four (`last-look.ts`).
- The second row holds the text, the decisions' mark, the setup's words, the badge and the seal's place (`list.ts`).
- `detail` takes `{ reverse, runSetup } = {}`. The view gives both (`work-item-view.ts:870`), and the preview gives neither (`list.ts:117`). So "Reverse" and "Run setup again" stand in the view alone, as each did before.
- `showQuestions` is kept.
- `WORK_ITEM_FIELDS`, `UNSET` and `NO_RECORD` of `daemon.test.ts` hold both sides.
- Both cases of an earlier look stand in `last-look.test.ts`.
- Both groups of cases stand in `view.test.ts`.
- The `docs/design.md` row and its Korean edition each name both kinds of row with each side's sentence. Neither edition gained a heading or a table row.

#155's line words "Setting up" and "Setup failed" come from `setupMark`, which the merge did not change. They change neither the line's state nor its group. `workItemOf` carries `setup` from the stored item beside the record's three fields (`daemon.ts:1521-1534`). Executed: `worktree-setup.test.ts` and the groups `setupMark` and `setupSection` of `view.test.ts`, in the nine files below. `frame/plan.md:78` describes the resolution as the remerge diff shows it. `frame/design.md` *Scope* items 5 and 10, the `detail` paragraph at `:245`, the screenshot bullet at `:322`, and the *Removes* rows at `:336` and `:340` state what the merge left. Read.

What matched: the screenshot run after the merge (`c8e3dcc`). The view's shot scrolls `section.decisions` to the start of the side column. The parked view's shot sets the column back to its top. The comment at the head of `screenshots.test.ts` says both. Opened against `docs/design.md`: `night-watch-dark-view.png`, `register-light-view.png`, `desk-light-view.png`, `night-watch-light-parked.png` and `register-dark-inbox.png`. Each view opens at "Decided without asking", with four decisions, two "Reverse" controls and the unread line in the failure's ink. The parked view opens at "Waiting for your answer" with both questions and the default chosen. The inbox shows "2 decisions without asking, 1 reversed" and "Setup failed" on one line, its text cut to "Shou" and an ellipsis, as `gaps.md:76` says and #157 carries. #157 is open in `release: 0.0.3` with the label `bug` (executed, `gh issue view 157`). The `gaps.md` rows that `a3dc20b` added and `7bdca2f` and `a13182f` removed were `## Not done` items, added and removed inside this fix range. The screenshots taken before the merge were made again at `c8e3dcc`, and the missing overlap row for #155 now stands at `frame/plan.md:78`. No `## Not verified` row left.

What matched: the open `gaps.md` row 25, which names the proofer, can be settled by reading. The built-app case writes each record uncommitted (`decisions-and-questions.test.ts:80`). Its last lines wait for and expect the newest commit's subject, the record as that commit's one path, and two commits on each branch (`:224-232`). Without `commitWord` no commit with that subject is made, so `newest()` keeps the base commit's subject and the expectation fails. Read, with no built-app run. Closing the row is the fix pass's or the orchestrator's act.

What matched: the new cases against their group, "the commit of a person's word". The order case holds the chain, the close case holds the close's wait for the chain, and the held-hook case holds `commitAlone`'s guard. Each guard is held by its own case and by no other. Read, with the two runs above.

A gap with no finding: the docstring of `shared.ts#detail` says "A view gives both of `acts`, and a preview neither" (`shared.ts:279`). No parameter or name `acts` stands, since the merge destructured the third parameter. The sentence after it names `reverse` and `runSetup`, so nothing is misread.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite at HEAD, the typecheck and the comparison of the documents' editions. The fix pass labelled them `unverified`, and the label is honest: `gaps.md:7` names the orchestrator. This round ran nine unit files and no built-app file. Each close and the merge's resolution could be read without one, so no batch ran. When findings 1 to 3 are closed, the orchestrator's broad run is next, and then the sealer's spawn | `seal/config.json`, key `Broad gate` | the orchestrator, by the broad gate, then the sealer |
| In Register, the age of the decision "Route" wraps over two lines beside "Decided by orchestrator" and "Reverse", where every other row's age stands on one line. Register sets an age in the fixed-width face as "a fact a person compares down a list" (`docs/design.md`, the table of the themes, the row "Type"). No document says whether an age may wrap. The row's CSS gives the age `flex: 1` and no `white-space` (`index.html:160-164`), and the row stood so before the merge: the earlier shot showed only three decisions | `screenshots/register-light-view.png`, `screenshots/register-dark-view.png`, `apps/desktop/src/renderer/index.html:164` | the owner, by a look at the two screenshots |
| Whether `.worktreesetup` should be read through the bound of `repositoryFileText`. #155 reads it whole with `readFile`, through a link. By reading, a pipe at that path would hold one thread of libuv's pool and the creation that awaits it; no probe ran. This is outside this work's diff, and finding 1 asks only that this work's sentences stop claiming it | `apps/desktop/src/daemon/worktree-setup.ts:41` | the orchestrator, against #152 or #155's records |
| A cherry-pick or a revert of several commits whose conflict was committed by hand. `CHERRY_PICK_HEAD` or `REVERT_HEAD` is gone, and the sequence still stands under `sequencer/`, which `UNDER_WAY` does not name. So a word is written and committed in it. git does not rewind an abort past a HEAD that moved, so no loss was found by reading, and no probe ran | `apps/desktop/src/daemon/worktrees.ts`, `UNDER_WAY` | the fix pass, by a probe, where the orchestrator wants it settled |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/daemon.test.ts test/worktrees.test.ts test/last-look.test.ts test/view.test.ts test/decision-record.test.ts test/repository-file.test.ts test/records-place.test.ts test/worktree-setup.test.ts test/screenshots.test.ts` in `apps/desktop` of the clone at `4d74567` | Exit 0, 9 files, 912 cases passed, 1 skipped (the screenshot run, which only `OWLERY_SCREENSHOTS` starts) |
| The same runner on `test/daemon.test.ts -t "takes the words of one worktree in the order they came"` with `TMP_PROBE=nochain`, and on `-t "waits at its close for a word whose worktree is still being read"` with `TMP_PROBE=nowait`. Before the two runs, the clone's `daemon.ts` was edited so that the variable skips the chain in `personWrote` or the close's wait for it. The file was restored after | `nochain`: exit 1, the `done` answers came in the order 5, 3, 1, 10, 2 and on. `nowait`: exit 1, "expected { is: 'decided' } to deeply equal { is: 'reversed', message: 'No.' }" |

