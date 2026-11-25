# Review round 1: 1795559733-built-app-files-share-one-app

```seal
target: cc8886bd against release/v0.0.4
```

This is the first round, so no earlier round handed coordinates or closes, and every fact below was established in this round. The round read whole, at `cc8886bd`, `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`, then `trail/phases/phase-1.md` and `phase-2.md`. `seal/config.json` names English for both language keys, so no `pr.<lang>.md` is owed, and no `seal/parity.json` stands. The code read is the whole diff `4a005eb..cc8886bd` under `apps/desktop`: `test/launch.ts`, `test/launch.test.ts`, the two exports of `test/memory.ts`, the two script lines of `package.json`, and `measurements/built-app-launch.md`, with every call the new code makes into `test/built-app.ts` followed to its body.

## Findings

### 1. The published times of a launch's start and stop and of a reset's part 2 hold the helper's own poll steps, and the file names only the 10 ms read of ready

```seal
severity: should
location: `apps/desktop/measurements/built-app-launch.md:14`, `apps/desktop/measurements/built-app-launch.md:59`, `apps/desktop/test/launch.ts:139`, `apps/desktop/test/launch.test.ts:137`
evidence: read `apps/desktop/test/built-app.ts:46-50`, `apps/desktop/test/built-app.ts:340`, `apps/desktop/test/built-app.ts:349-361`, `apps/desktop/test/launch.ts:204-213`, `apps/desktop/test/launch.ts:249-252`, `seal/threads/1795559733-built-app-files-share-one-app/trail/phases/phase-1.md:19-27`, `seal/threads/1795559733-built-app-files-share-one-app/frame/design.md:82`
```

Why it matters: the frame chose a 10 ms read for ready because the helper's 100 ms read "would add up to that much to a part of about 100 ms" (`frame/design.md:82`), and the published file tells its reader that ready was "read every 10 ms" (`built-app-launch.md:14`). The same reasoning applies to three other parts, and neither the file nor the printed tables say so:

- Part 2 of a reset, "The daemon ended at SIGTERM", is timed by `untilGone` (`launch.ts:250`), which checks and then sleeps 50 ms (`built-app.ts:48`). The ten resets read 50 or 51 ms, lowest 50 and highest 51 (`phase-1.md:27`). That is one step each time: the check right after the signal finds the daemon still running, and the check 50 ms later finds it gone. The daemon's own end lies anywhere between 0 and 50 ms. The row's label says when the daemon ended, and the number says when the wait looked again.
- The launch's start is timed until `BuiltApp.start` returns (`launch.ts:206-207`), and `start` asks the debugging port for the page every 200 ms (`built-app.ts:360`). So the start's 321 ms median can hold up to 200 ms of that step.
- The launch's stop calls `end`, which waits on the app and the daemon with the same 50 ms `untilGone` (`built-app.ts:340`).

The start and the stop are what every built-app file of the suite pays, so counting them in the launch is right, and `built-app.ts` is out of this work's scope (`frame/design.md` *Scope*, Out). The decision does not move: the saving can be no more than the launch's median without its build, 688 ms, whatever share of it is a step. What is wrong is what a later reader holds a new run against. The file says it was "written down so that it can be measured again", and part 2 will read 50 or 100 ms whether the daemon's end got faster or slower.

The fix says it where a reader meets the numbers, and changes no timing, so the published numbers stay those of the run at `def06e3f`. The footer is a printed line, so the case that pins it changes with it, and that case is shown red against the old footer before it is committed. In `apps/desktop/measurements/built-app-launch.md`, after the row `Ready` of *What was measured*:

```markdown
| Waits | `BuiltApp.start` asks the debugging port for the page every 200 ms, and the stop and part 2 of a reset look for the process's end every 50 ms, as `test/built-app.ts` does for every built-app file. So the start holds up to 200 ms, and the stop and part 2 up to 50 ms, of the wait's own step. Part 2's 50 and 51 ms are one step each, and the daemon's own end lies within it |
```

In `apps/desktop/test/launch.ts:139`, and the same sentence in the expected last line at `apps/desktop/test/launch.test.ts:137`:

```ts
    `Ready is the status line reading "${READY}", read every 10 ms. The start asks the debugging port every 200 ms, and the stop and part 2 of a reset look for the process's end every 50 ms, so each holds up to one such step. 1 MB is 1,048,576 bytes. The app itself is the main process, every process below it and the daemon.`,
```

```seal
verdict: fixed 1175bb66
answer: The finding holds (read: `built-app.ts:48`, `:340`, `:360`, and part 2's ten values of 50 or 51 ms). The timing code is unchanged, so the published numbers stay those of the run at `def06e3f`. The footer at `launch.ts:139` and its pin at `launch.test.ts:137` carry the given sentence. The pin was shown red against the old footer before the footer changed (executed: `node scripts/test-in-electron.mjs test/launch.test.ts` exited 1, and only the footer case failed, on the footer line). The Waits row of `built-app-launch.md` *What was measured* is written in the crafter's words at one place. The given row said "as `test/built-app.ts` does for every built-app file", but five built-app files start no app in a run of the suite, so the row says "at every start and stop of the built app in the suite". After the fix, `tsc` over the two files exited 0, and `node scripts/test-in-electron.mjs test/launch.test.ts test/memory.test.ts test/records-place.test.ts` passed 77 cases in 3 files with 2 skipped (executed).
```

### 2. The published file states a cause of the load that nobody established, and rests the load's effect on an inference two readings cannot carry

```seal
severity: should
location: `apps/desktop/measurements/built-app-launch.md:31`, `apps/desktop/measurements/built-app-launch.md:38`, `seal/threads/1795559733-built-app-files-share-one-app/frame/design.md:42`, `seal/threads/1795559733-built-app-files-share-one-app/changelog.md:6`
evidence: read `seal/threads/1795559733-built-app-files-share-one-app/trail/phases/phase-1.md:45`, `seal/threads/1795559733-built-app-files-share-one-app/trail/phases/phase-2.md:7-15`, `seal/threads/1795559733-built-app-files-share-one-app/frame/design.md:42`, `apps/desktop/measurements/built-app-launch.md:29-38`
```

Why it matters: the claim is that "Other worktrees of this repository did other work on the same Mac during both runs" (`built-app-launch.md:31`). Phase 1 found something else: "What raised the load is not known" (`phase-1.md:45`). Phase 2 records no reading of other work during the batch, only that no other run of the suite was under way (`phase-2.md:7`). The frame says the orchestrator's message names other worktrees' work, "which nobody measured" (`frame/design.md:42`). So the published file states as fact a cause that its own records say nobody read.

Its next claim, "A busy machine makes a launch slower, and so makes the saving larger" (`built-app-launch.md:38`, and `frame/design.md:42` in the frame's words), holds only where the load fell on the launches as much as on the resets. The launches ran first and the resets after them, and two readings, one before the run and one after, cannot say which half carried the load. A load that fell on the resets alone would have made the saving smaller, not larger. The decision still stands, on a bound that needs no such assumption. On any machine, the saving is the launch's median without its build less a reset that costs more than nothing, so it is under 688 ms. A quieter machine makes no launch slower, so 688 ms stays the ceiling there, under the 1 s at which phase 1 would have stopped. `changelog.md:6` also says the file publishes "the machine's load during each run", where it publishes two readings, before and after.

In `apps/desktop/measurements/built-app-launch.md:31`:

```markdown
Neither run was made again on a quieter machine, and what raised the load during the measurement is not known. Each row gives the 1-minute load average, read with `sysctl -n vm.loadavg` just before and just after the run.
```

In `apps/desktop/measurements/built-app-launch.md:38`:

```markdown
The measurement's highest start (656 ms) and highest stop (1460 ms) are each one run of ten, and the medians are the numbers this file decides on. The two readings do not say whether the load fell on the launches or on the resets. Either way, on a quieter machine the saving stays under 688 ms, the median launch without its build, since a quieter machine makes no launch slower and no reset costs less than nothing.
```

In `frame/design.md:42`, the sentence that opens "A busy machine makes a launch slower" becomes:

```markdown
The two readings do not say whether the load fell on the launches or on the resets, and the decision does not need them: the saving is less than the launch's own median without its build, 688 ms under this load and no more on a quieter machine, which is under the 1 s at which phase 1 would have stopped.
```

In `changelog.md:6`, "and the machine's load during each run" becomes "and the machine's load read before and after each run".

```seal
verdict: fixed 1175bb66
location: `seal/threads/1795559733-built-app-files-share-one-app/gaps.md:10`
answer: The finding holds (read: `phase-1.md:45` says the cause is not known, and no record reads other work during either run). The sentence at `built-app-launch.md:31` is replaced as given. The sentence at `:38` is replaced as given, with one more sentence tying the bound to the 1 s at which the work would have built no further, which grounds the choice not to measure again. `changelog.md:6` now reads "the machine's load read before and after each run". The same class stood in `gaps.md:10`, the closed row on a quiet machine: it said the load rose "during" the run and grounded its close on the fold alone. It now gives the two readings as before and after, and grounds the close on the round's bound. `frame/design.md:42` is the framer's and is not changed here: the framer rewrites the sentence that opens "A busy machine makes a launch slower". `git grep` over `apps`, `seal`, `docs` and `README.md` for "busy machine", "saving larger", "other worktrees", "during each run", "during both runs" and "load during" found no other statement of the two claims (executed; a sample).
```

## Confirmations

What matched: every quote of `pr.md` stands word for word at the coordinate it names (read). Item 1's sentence is `frame/plan.md:68`, the row of *Judgments of the run*. Items 2 to 6 are the bold openings of `frame/design.md` *Scope* items 1 to 5, at `:50` to `:54`, and item 6 quotes item 5's bold opening, which ends with no full stop. Item 7 is the opening sentence of `gaps.md:15`, and item 8 is a sentence of row Q1 at `frame/questions.md:17`. `pr.md` holds the `Part of` line, these quotes and the attribution line, and no sentence of `changelog.md`.

What matched: the frame's decision not to measure again holds (read, with the arithmetic of finding 2). Whatever the load did, the saving is bounded by the launch's median without its build, 688 ms, which is under the 1 s of `frame/plan.md` *Phases* row 1. The framer's probe at a load of about 4.7 gave a saving of about 350 ms (`frame/design.md:27-28`), on the same side of the bound. What does not hold is the frame's reason for it, which is finding 2.

What matched: "about 17 launches" for a run of the suite holds as an approximation (executed: `grep -n 'BuiltApp.start' test/*.test.ts` in `apps/desktop`, and `grep -n 'startWithPane()' test/daemon-restart.test.ts`). The method builds the list from what produces a launch: every call site of `BuiltApp.start` in the 20 built-app files, and every call of a helper that wraps one. A run of the suite on a Mac without the files' own variables launches 16 apps: one in the `beforeAll` or case of each of 14 files, and two in `test/daemon-restart.test.ts`, whose `startWithPane` is called by two `beforeAll`s (`:93`, `:192`). The starts in `test/korean-input.test.ts:327` and `test/screenshots.test.ts:570` stand under their variables, and `test/memory.test.ts`, `test/pane-session.test.ts` and `test/role-session.test.ts` start the app only under theirs. At 507 ms a launch, 16 launches are about 8.1 s against the 8.6 s the records give. No decision moves on it.

What matched: the two files the batch skipped, which `gaps.md:9` leaves to a later run, are `test/pane-session.test.ts` and `test/role-session.test.ts` (read). Each of them puts every case under one `describe.skipIf` of its own variables (`pane-session.test.ts:75`, `role-session.test.ts:56`). Every other built-app file holds a case that runs without a variable, `test/screenshots.test.ts:217` and `test/memory.test.ts:30` among them. This is read, not executed, so the row is answered by reading and the fix pass may close it on that ground.

What matched: the published file's claim that the five files `launch`, `memory`, `screenshots`, `pane-session` and `role-session` start the app only under a variable of their own holds, and so does the rule's "some start it only where a variable of their own is set" (read, same enumeration). `test/korean-input.test.ts` also has a block under its variable, but its `beforeAll` at `:64` starts an app in every run, so it is rightly not among the five.

What matched: scenario 5 holds (executed: `git diff --stat 4a005eb..cc8886bd -- apps/desktop/vitest.config.ts apps/desktop/test/built-app.ts` printed nothing, and `git diff 4a005eb..cc8886bd -- apps/desktop/package.json` adds the two script lines and changes no other). Nothing under `apps/desktop` differs between `def06e3f` and `0654d8d1` (executed: `git diff --stat def06e3f 0654d8d1 -- apps/desktop` printed nothing), as the published file's *Commit* row says.

What matched: `test/launch.ts` does what `frame/design.md` *Data & interfaces* states (read). Every start passes `SHELL=/usr/bin/true` and a temporary `OWLERY_WORKTREES` that `afterAll` removes. The reset runs its six parts in the frame's order (`launch.ts:245-261`), and `judged` takes the three readings and names each one that failed (`launch.ts:65-75`). `runsOf` refuses a count that is no whole number above zero and names the variable. A signal stops the app with `stopNow` (`launch.ts:148-160`), and the tables are written to the run's own output only where both measuring cases passed (`launch.test.ts:164`). `test/memory.ts` changes only by exporting `listed` and `footprintsOf` with a docstring each. The 20 built-app files the import pattern selects (executed: the `grep -lE` of `frame/design.md:23` over `test/*.test.ts` at `cc8886bd`) are the 19 of *Grounding* and `test/launch.test.ts`.

What matched: scenario 3 holds (executed in the clone at `cc8886bd`: `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/launch.test.ts --reporter=verbose`, with `OWLERY_MEASURE_LAUNCH` unset). It exited 0. The reporter printed `|app| test/launch.test.ts` on every line, 18 cases passed, and the two cases of the measuring block were listed as skipped. No app started.

What matched: the frame's coordinates hold at `cc8886bd` (read): `built-app.ts:204` and `:207`, `launch.ts:167`, `keep-awake.test.ts:117` and `:126`, `memory.test.ts:302-305`, `renderer.ts:1978-1981`, `main.ts:41`, `:135`, `:146-148` and `:161`, and `daemon-client.ts:50-54`.

The new cases of `test/launch.test.ts` cover only the new functions of `test/launch.ts`, which no earlier case covers, and no case repeats another's fact (read). The phase records' claims of red runs and of the 16 mutants were not run again in this round; they stand as the crafter's account (read).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck and the rest of the broad gate at the branch's head, which stay `unverified` as `gaps.md:7` labels them | `seal/config.json` `Broad gate` | the orchestrator, at the broad run |
| Whether the two commits the published file names stay reachable for a reader after the pull request is squashed into `release/v0.0.4`, as `routing.md:22` says it will be. `measurements/memory.md` names `f37bb25`, which is on the base's history; `def06e3f` and `0654d8d1` would stand only on the pull request's own ref | `apps/desktop/measurements/built-app-launch.md:10` | the orchestrator, and the owner where the merge method is theirs |
| Whether the shared app is built against this measurement | `frame/questions.md` row Q1 | the owner |
| Whether the open app's memory goes on growing past ten resets | `gaps.md:11` | the owner, as `gaps.md` names |

## Probes

No probe was written. The rows below are the runs this round made, in the clone under its scratch directory, apart from the reads named above.

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/launch.test.ts --reporter=verbose`, in `apps/desktop`, with `OWLERY_MEASURE_LAUNCH` unset | exit 0: 1 file passed, 18 cases passed and 2 skipped, each line under the project `app` |

`pnpm run measure:launch` and `pnpm run test:app` were not run. Neither finding depends on a new run: finding 1 rests on the helper's sleeps and on the ten part-2 values the phase record holds, and finding 2 on what the records say about the load.
