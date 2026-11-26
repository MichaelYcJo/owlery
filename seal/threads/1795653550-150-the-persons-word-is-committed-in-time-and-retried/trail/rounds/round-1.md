# Review round 1: 1795653550-150-the-persons-word-is-committed-in-time-and-retried

```seal
target: 39fc28f7 against 9f9ba1da
```

The round reviewed the branch `fix/150-a-commit-of-the-persons-word-hangs-on-a-hook-and-is-never-retried` at `39fc28f7` against its cut from `release/v0.0.5`, `9f9ba1da`, in a clone of its own. It read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and the four phase records whole at the target, and opened the four files under `screenshots/`. No earlier round stands, so no fact is carried. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. The repository declares no `seal/parity.json`.

Stage 1 read the code against `docs/architecture.md` *Records are committed to the repository*, `docs/design.md` *Principles* and *Components and their states*, and the frame's *Scope*, *Data & interfaces*, scenarios A to Q, *Rule changes* and *Removes*. Stage 2 read `worktrees.ts#commitRunner` and `#commitPaths`, `records-place.ts#setUpRecords`, `stage-records.ts`, `decision-record.ts#owedWords`, the daemon's `close`, `personWrote`, `commitWord`, `readOwed`, `wordOwedOf`, `tryWord`, `commitOwed`, `armWordPass`, `passWords`, `readCommits` and the chain's `catch`, and the renderer's `wordOwedSays`, `wordOwedMark`, `detail` and the line's `decided` part. The axes walked beyond the table were process lifetime (a group, its pipe and its signals), timers that outlive a client, and a retry's backoff.

## Findings

### 1. `gaps.md` does not name that the renamed branch's commit of `routing.md` is never tried again, which the frame asks the builder to name there

```seal
severity: must
location: `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/gaps.md`, `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/frame/design.md:70`
evidence: executed `git grep -n "routing" -- seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/gaps.md` at 39fc28f7; read `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/frame/design.md:70`, `apps/desktop/src/daemon/daemon.ts:2968-2981`
```

Why it matters: `frame/design.md` *Scope*, Out, the second item (`frame/design.md:70`) puts the retry of the commit that names a renamed branch in `routing.md` outside this work and ends "The builder names it in `gaps.md`." The search printed one line of `gaps.md`, its row 11, which says that this commit takes the daemon's limit and its close's signal. No row and no paragraph says that a failed or ended commit of `routing.md` is left with nothing trying it again. `apps/desktop/src/daemon/daemon.ts:2968-2981` keeps that path: the `catch` logs and ends. Phase 2 says so (`trail/phases/phase-2.md:25`), but the phase records are not the memo the sealer and the owner read for what is not done. The search is on one word, so a statement in other words could escape it; the read of `gaps.md` whole found none.

```markdown
## Not done

The case of `frame/design.md` scenario D, a `pre-commit` hook that reads its input to the end, was written and then removed: it passed against the tree before the phase and with the runner's `stdin` turned back into a pipe, so it pinned nothing (contract rule 15). `trail/phases/phase-1.md` gives the runs.

The commit of a renamed branch's `routing.md` is not tried again (`frame/design.md` *Scope*, Out). Where it fails, is ended at the limit or at the close, or finds a session of the work item working, `Daemon#commitWord` logs it, or does nothing, and the file stands written until a commit a session makes carries it. Nothing in the window says so. It is not a person's word, and nothing reads whether it landed.
```

### 2. The docstring of `Daemon#commitWord` says a stage's commit or the daemon's next commit carries the renamed branch's `routing.md`, and none does

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:2960-2967`, `apps/desktop/src/daemon/daemon.ts:2972`
evidence: read `apps/desktop/src/daemon/daemon.ts:2954-2981`, `apps/desktop/src/daemon/daemon.ts:3121`, `apps/desktop/src/daemon/stage-records.ts:91-93`, `apps/desktop/src/daemon/stage-records.ts:133-147`; executed `git diff 9f9ba1da..39fc28f7 -- apps/desktop/src/daemon/daemon.ts`
```

Why it matters: the diff narrowed `commitWord` to the `routing.md` of a renamed branch, rewrote its docstring for that file, and changed its comment from "its next stage's commit carries the record" to "carries the file". At `9f9ba1da` the sentence was about the record, and it held: a stage's commit and the next commit of a person's word both hold the record. For `routing.md` it does not hold. A stage commits the files it names with the record and the refusals (`stage-records.ts:91-93`), and no stage names `routing.md`. The daemon's commit of a person's word commits the record alone (`daemon.ts:3121`). `declaredDirectory` commits a `routing.md` only where no directory names the branch (`stage-records.ts:133-147`), and after a rename the rewritten routing names it. So the docstring at `daemon.ts:2963-2965` and the comment at `:2972` tell the next reader that the file reaches a commit on its own, and the only commit that can carry it is one a session makes. A crafter who reads it as the reason no retry is owed builds on a false premise.

```ts
  /**
   * Commits the `routing.md` of a work item's directory, and that file
   * alone, on the work item's branch in its worktree, after a rename of the
   * branch wrote the new name into it: with the subject given and the
   * trailer `Seal-Routing:` that names the work item's directory, which the
   * pull request check reads, under the daemon's bounds of a commit
   * (`commitBounds`). It returns at once, and the commit is made after every
   * earlier one of the same worktree has ended. Where a live pane of the
   * work item says it is working, a headless session of it is working or
   * its chain is running, when the commit's turn comes, nothing is
   * committed: the file stands written, and only a commit a session makes
   * of it carries it, since no stage's commit and no commit of a person's
   * word holds `routing.md`. A commit that fails or is ended leaves the
   * file written and says git's words in the log, and nothing tries it
   * again.
   */
  private commitWord(held: Held, directory: string, subject: string): void {
    const { id, worktree, branch } = held.item;
    const commit = async (): Promise<void> => {
      // A running chain is at work in the worktree between two stages too, so nothing is committed while it runs.
```

### 3. The rule this work adds says a new commit on the branch ends a failed try's wait, and the daemon sees one only while a window is open

```seal
severity: should
location: `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/frame/design.md:115`, `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/frame/design.md:120`
evidence: executed `git grep -n -F -e "ends the wait" -e "기다림이 끝납니다" -e "makes the next try due at once" -e "client is connected" -e "while a window is open" -- seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried apps/desktop/src` at 39fc28f7; read `apps/desktop/src/daemon/daemon.ts:3170`, `apps/desktop/src/daemon/daemon.ts:4301-4311`, `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/trail/phases/phase-2.md:17`
```

Why it matters: the `add` to `docs/architecture.md` *Records are committed to the repository* says "A change of the record or a new commit on the branch ends the wait." (`frame/design.md:115`), and its Korean edition says the same (`:120`). The settle writes both into the policy root, which the next framer reads as what the daemon does. The pass compares the branch's head that `readBranch` last read (`daemon.ts:3170`), and the read of the work items' commits runs only while a client is connected (`daemon.ts:4301-4311`). So with no window open, a commit made on the branch outside a session ends no wait. *Scope* item 8 states the condition ("as the daemon last read it while a client is connected"), and so do `changelog.md:9` ("while a window is open") and `trail/phases/phase-2.md:17`. The search printed those and the two `to:` lines, and only the two `to:` lines leave the condition out. It is a search on these words, so a statement in other words could escape it.

```markdown
  to: **The daemon commits a person's word, a reversal or an answer, and where it could not, it says so and tries again.** ... A commit that fails is tried again after a minute, and after each further failure the wait doubles, to an hour at most. A change of the record, or a new commit on the branch while a window is open, ends the wait. The work item's view says ...
```

```markdown
  to: **데몬은 사람의 말, ...** ... 실패한 커밋은 1분 뒤에 다시 시도하고, 또 실패할 때마다 기다리는 시간이 두 배가 되며, 한 시간을 넘지 않습니다. 기록이 바뀌거나, 창이 열려 있는 동안 브랜치에 새 커밋이 생기면 기다림이 끝납니다. 작업 화면은 ...
```

The fix pass replaces the one sentence in each `to:` and leaves the rest of each line as it stands; the `...` marks the text it keeps.

### 4. No case holds that a change of the record or of the branch's head makes a failed word's next try due at once

```seal
severity: should
location: `apps/desktop/test/daemon.test.ts`, `apps/desktop/src/daemon/daemon.ts:3170`, `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/gaps.md`
evidence: executed `node scripts/test-in-electron.mjs test/daemon.test.ts` in `apps/desktop` of the clone, exit 0, 392 cases passed, with `daemon.ts:3170` reduced to `if (tried === undefined || released || now >= tried.due) this.tryWord(held);` (see `## Probes`)
```

Why it matters: *Scope* item 8 states "A change of the record's text, or of the branch's head as the daemon last read it while a client is connected, makes the next try due at once." The diff built it as the last two conditions of `passWords` (`daemon.ts:3170`). With both taken out, the probe's run of `test/daemon.test.ts` passed every case, so no case of the group `describe("the commit of a person's word")` or elsewhere in the file holds it. Phase 2's table of mutants (`trail/phases/phase-2.md:34-62`) names no break of this guard, and `gaps.md` *Not verified* names no row for it, while it names the guards beside it that no case reaches (`wordHeld`, the ceiling of the wait). A person who fixes the hook and edits the record, or commits on the branch, would wait out the doubled wait with the line still saying "word not committed", and nothing in the suite would say so. The case belongs to `describe("the commit of a person's word")` in `apps/desktop/test/daemon.test.ts`, beside the case of scenario K.

```ts
  it("tries a failed word again at the next turn of the pass once the record changes, before the wait after the failure is over", async () => {
    // A wait far longer than the case, so only the change of the record can make the try due.
    const { c, made, workItems } = await withWorkItems(["Edited"], { wordPassMs: 50, wordRetryMs: 60_000 });
    const a = workItems[0]!;
    const directory = withDirectory(a);
    const refusing = join(made.repo, ".git", "hooks", "pre-commit");
    writeFileSync(refusing, "#!/bin/sh\necho 'the hook says no.' >&2\nexit 1\n", { mode: 0o755 });
    writeFileSync(join(directory, RECORD_FILE), withDecision("", { kind: "default", decided: DEFAULT.says, grounds: DEFAULT.grounds }));
    await reversal(c, 1, a.id, 1);
    await rests(c, a.id, { waits: "retry", why: "the hook says no" });
    rmSync(refusing);
    // A change of the record that is no word of the person's, as a session's edit of a block's grounds.
    writeFileSync(join(directory, RECORD_FILE), readFileSync(join(directory, RECORD_FILE), "utf8").replace(DEFAULT.grounds, `${DEFAULT.grounds} Edited.`));
    await c.until(() => (commitsIn(a.worktree) === 2 ? true : undefined), 3000);
    await rests(c, a.id, null);
  });
```

The snippet uses the helpers the group already defines (`reversal`, `rests`, `withDirectory`, `commitsIn`) and needs `readFileSync` and `rmSync`, which the file already imports. Its edit of the grounds assumes `DEFAULT.grounds` stands once in the record; the fix pass checks that against the record `withDecision` writes. The fix pass shows it red with the guard taken out, as contract rule 15 asks. A second case for the branch's head, with a commit made by hand while the client is connected, is owed by the same reasoning; where the fix pass judges one case enough, it says why in its answer.

### 5. The rewrite of scenario I's case dropped the check that a pane whose process exited while it said it was working holds no word

```seal
severity: should
location: `apps/desktop/test/daemon.test.ts`, `apps/desktop/src/daemon/daemon.ts:3187`
evidence: executed the same run as finding 4, with `daemon.ts:3187` also changed to drop `info.alive &&` (see `## Probes`); executed `git diff 9f9ba1da..39fc28f7 -- apps/desktop/test/daemon.test.ts`; read `apps/desktop/src/daemon/daemon.ts:2561-2562`
```

Why it matters: at `9f9ba1da` the case "leaves the record written and not committed while a headless session of the work item is working, and while a pane of it is" ended the pane's process while the pane still said it was working, and expected the next commit to carry the word: "a pane that is not alive holds no commit". The diff rewrote that case into scenario I (`trail/phases/phase-2.md:8`), and the new case ends the pane's turn with a `Stop` event while its process stays. A pane's exit sets `alive` to false and leaves its `state` as it was (`daemon.ts:2561-2562`), so `works` (`daemon.ts:3187`) tells an exited pane from a working one by `info.alive` alone. With that guard taken out, the probe's run passed every case of `test/daemon.test.ts`. Under this diff the guard matters more than it did: without it, a pane that exits mid-turn holds its work item's word for as long as the daemon runs, and the view says "a session of the work item is working" of a session that is gone. Phase 2 reports the rewrite and not the check it dropped. The case that holds it belongs to the same group.

```ts
  it("commits a word left for a working pane once the pane's process exits while it still says it is working, within a turn of the pass", async () => {
    // A pane of the kind that reports its state ends by itself after a second and a half.
    const commandFor = (kind: string) => (kind === "claude" ? { command: "/bin/sh", args: ["-c", "sleep 1.5"], env: {} } : silent());
    const { d, c, workItems } = await withWorkItems(["Exited"], { ...QUICK, commandFor });
    const a = workItems[0]!;
    withDirectory(a);
    d.decided(a.id, DEFAULT);
    const pane = await workingPane(d, c, 1, a.id);
    const from = c.messages.length;
    await reversal(c, 2, a.id, 1);
    await carried(c, a.id, WORKING, from);
    expect(commitsIn(a.worktree)).toBe(1);
    await c.message("exit", (m) => m.id === pane);
    await c.until(() => (commitsIn(a.worktree) === 2 ? true : undefined), 3000);
    expect(newest(a.worktree)).toEqual({ subject: "chore: record the person's reversal of decision 1", body: "Seal-Routing: 1-item", by: WHO, paths: [RECORD] });
    await rests(c, a.id, null);
  });
```

The `commandFor` line is the one the case at `9f9ba1da` used. The fix pass shows it red with `info.alive &&` taken out of `works`.

## Confirmations

What matched: *Scope* item 1 holds at `apps/desktop/src/daemon/worktrees.ts:898-970`. Git starts with `detached: true` and `stdio: ["ignore", "pipe", "pipe"]` (`:909`), so it leads a group of its own and has no input, which answers the `gaps.md` row on the runner's input (`read`). The limit is counted from the runner's creation (`:900`) and `commitPaths` makes one runner for both commands after `whyNoCommit` (`:1027`), which answers the row on the shared limit (`read`). The first signal is SIGTERM, SIGKILL follows the grace, and no `index.lock` is touched. The `exit` handler's `if (killed) settle()` (`:964`) is reached where git has not exited by the grace's end: the grace sets `killed`, sends SIGKILL and settles only if git had exited (`:947-952`), so a git that exits after the SIGKILL settles at its `exit` event, which answers that row (`read`).

What matched: *Scope* items 2 and 4 hold at `worktrees.ts:1039-1042` and `records-place.ts:523-531`: an ended `git commit` whose index then matches the branch's newest commit stands, and the setup keeps a commit made before its end (`read`).

What matched: the bounds reach every commit the daemon makes. `placeOf` (`daemon.ts:3449`) and `chainDirectory` (`:3439`) give `commitBounds()`, `commitRecords` hands `place.bounds` to `commitPaths` (`stage-records.ts:93`), `commitWord` passes them (`daemon.ts:2976`), and the setup's request passes `commitLimitMs` (`:1264`). A `git grep` for `commitPaths(`, `commitRecords(`, `declaredDirectory(` and `setUpRecords(` under `apps/desktop/src` found no other caller in the daemon; `chain-command.ts` builds its places with no bounds, as phase 2 says (`executed`). This answers the `gaps.md` row on the stage, routing and setup commits.

What matched: *Scope* item 5 holds at `daemon.ts:883-891`: the close races the commits under way against `commitCloseWaitMs`, fires `ending`, and waits again. A chain whose stage's commit the close ended stays `running`, since the chain's `catch` returns where the daemon closed (`daemon.ts:3419-3420`, `read`). `tryWord`'s attempt returns where `ending` fired (`:3070`), which answers that row (`read`).

What matched: the `gaps.md` rows on the daemon's reading answer by reading. The wait is `Math.min(wordRetryMs * 2 ** (failures - 1), WORD_RETRY_MAX_MS)` (`daemon.ts:3130`), so it stops at one hour. `failedWhy` (`:186-189`) takes the first line that is not empty after trimming, cuts it and strips the periods and colons at its end. `readOwed` asks git only where `fresh`, or where the record's text or the head it last read changed (`:3010`). A turn that finds the work item's session working adds it to `wordHeld`, and the first turn that finds it ended deletes it and tries (`:3164-3170`). Both `passWords` (`:3163`) and `commitOwed` (`:3105`) skip a work item `whyNoRun` names (`read`).

What matched: scenario P's second half holds by reading. `git grep wordOwed -- apps/desktop/src/renderer` names `view.ts#wordOwedSays`, `#wordOwedMark`, `list.ts:157` and `shared.ts:384`, and nothing in `view.ts#changeOf` (`executed`). The preview draws the sentence through the same `detail` as the view (`list.ts:126`, `work-item-view.ts:1287`), and `detail` pushes it before the decisions' section whether or not that section is drawn (`shared.ts:383-385`, `read`). The text is set with `textContent` (`shared.ts:95-99`), so git's reason is never read as markup.

What matched: the inks. `.detail .word-owed` is `--ink-muted` and `.word-owed.failed` is `--state-failed` (`index.html:193-194`), as the row "A row of a list of records" of `docs/design.md` states in both editions (`read`). On Night watch's dark amber: `docs/design.md:14`, *Principles* 4, decides it: "In Night watch a wait and a failure share the yellow ... and differ by their shapes and their words." The tokens of Night watch dark give both `#f2c033` (`docs/design.md:181`, `:186`). The sentence differs from "Needs you" by its words, "was not committed" and "Owlery tries again". So the shared ink is what the design asks for, and whether it reads well in the shots is the owner's taste, not a departure.

What matched: the four shots show what phase 4 and the parked shot's rule change say. In `night-watch-dark-parked.png` the sentence stands between the sealer's note and "Decided without asking", over three lines, in the amber, with the struck-through decision and the person's message under it. In `night-watch-light-inbox.png` the parked work item's second row reads "1 reversed, word not committed" (`read`, the images opened).

What matched: the rule changes' `from` texts stand once each in `docs/design.md`, `docs/design.ko.md`, `docs/product.md` and `docs/product.ko.md`, and each named section stands (`grep -c -F`, `executed`). The other frames of the release that change *A pull request that changes the window carries its screenshots*, #214's, add a paragraph of their own and touch no sentence this work's `change` entries name (`grep -n -F` over `seal/threads/*/frame/design.md`, `executed`).

The round names three gaps that open no finding, by `skills/code-review/SKILL.md` *The record*. The routing commit's path `commitPaths` takes after the close fired runs `whyNoCommit` and then `git reset -- routing.md` though no `git add` ran (`worktrees.ts:1025-1035`), which unstages a change a person staged at that path; no case reaches it. The grace's SIGKILL is sent to the group id after git has exited (`worktrees.ts:947-951`), where the comment at `:929` holds only while a process of the group runs; a reuse of that id within the two seconds is the remaining risk. `frame/plan.md:20` calls the third rewritten case "an ended pane", which `trail/phases/phase-2.md:8` calls "the case of an interrupted pane".

## Not judged

| What | Location | Who answers |
|---|---|---|
| The value of `COMMIT_LIMIT_MS`, five minutes (Q1) | `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/frame/questions.md` | the owner |
| A real `gpg` or `ssh` signer at the limit (Q2) | `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/gaps.md` row 7 | the owner, in the running app |
| Whether the amber of the failure sentence in Night watch dark reads well in the shots; the design allows it (see *Confirmations*) | `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/screenshots/night-watch-dark-parked.png` | the owner |
| The full suite, the typecheck and the broad gate, `unverified` | the repository | the orchestrator, after the rounds |
| The built-app files and the screenshot run, which this round did not run | `apps/desktop/test/decisions-and-questions.test.ts`, `apps/desktop/test/screenshots.test.ts` | the orchestrator's broad run |

## Probes

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` in the clone, through the machine's lock | exit 0 |
| `node scripts/test-in-electron.mjs test/daemon.test.ts` in `apps/desktop` of the clone, through the machine's lock, with two edits of `daemon.ts`: `passWords` at `:3170` without the record's text and the branch's head among its conditions, and `works` at `:3187` without `info.alive &&` | exit 0: 1 file, 392 cases passed, so no case of the file fails with either guard broken. Both edits were then taken back out, and `git diff` of the clone shows no change to `apps/desktop` |
