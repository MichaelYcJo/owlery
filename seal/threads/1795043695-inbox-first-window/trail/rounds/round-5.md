# Review round 5: 1795043695-inbox-first-window

```seal
target: 55250b7, fixes 607f8b0..55250b7
```

This is a verifying round over a change the owner asked for after the sealer sealed at `3b21d91`. Its target is the diff `607f8b0..55250b7`: the orchestrator's fold of the owner's choice (`731b956`), the fix of `writeAppearance` with two new cases (`48b7e6e`), one sentence added to `gaps.md:98` (`befa9b5`), and the orchestrator's fold of the fix into the frame (`55250b7`). The code reviewed is that diff alone: `apps/desktop/src/main/appearance.ts` and `apps/desktop/test/appearance.test.ts`, read against the frame and against the callers of `writeAppearance`. Those callers are `src/main/main.ts:56`, the theme's channels in `src/shared/ipc.ts:11-12` and `:30-33`, `src/preload/preload.ts:27`, and `src/renderer/theme.ts:39` with the notice it reaches at `renderer.ts:309-314`. None of these callers changed since `3b21d91` (`git diff --stat 3b21d91 55250b7` over them printed nothing, executed). The parts of `277eb35..607f8b0` the diff does not touch were not reviewed again.

The work item's records were read whole at `55250b7`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `guarantee.md`, `trail/gate.md` and `trail/rounds/round-4.md`. The phase records and rounds 1 to 3 were opened at the lines a search for `partial`, `appearance.json`, `pid` and `rename` named: `trail/phases/phase-3.md:10`, `phase-9.md:14`, `:50`, `round-1.md:163`, `:165` and the close of round 3's finding 4 (`round-3.md:203-206`). No `pr.<lang>.md` stands, since `seal/config.json` names English for both language keys. The repository declares no `seal/parity.json`.

Facts carried from round 4 and the sealer's last run, not established again: the three places that empty the status line with `tell("")` (`renderer.ts:214`, `:220`, `:276`), which a `git grep` at `55250b7` printed at the same lines, and the drive of round 3's fix pass at `571edfa`. Every verdict below is this round's own.

The one finding is located in the work item's records alone. The code at `55250b7` holds what `gaps.md:98` says.

## Findings

### 1. `frame/design.md` *Scope* item 24 says no `appearance.json.<pid>` stays after a failed save, and the code keeps it where its removal fails

```seal
severity: should
location: `seal/threads/1795043695-inbox-first-window/frame/design.md:221`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_partial.test.ts` in `apps/desktop` of the round's clone; read `apps/desktop/src/main/appearance.ts:35-42`, `seal/threads/1795043695-inbox-first-window/frame/design.md:221`, `:282`, `seal/threads/1795043695-inbox-first-window/gaps.md:98`, `seal/threads/1795043695-inbox-first-window/frame/plan.md:167`
```

Why it matters: the sentence that `731b956` added to *Scope* item 24 reads "A save that fails, at its write or at its rename, removes the partial file it wrote, so no `appearance.json.<pid>` stays in the folder." The code tries the removal once and swallows its error (`appearance.ts:36-40`), so where `rmSync` throws, the partial file stays. The probe showed this. With `rmSync` made to refuse the partial file's path and a folder standing at `appearance.json`, `writeAppearance` threw the rename's error, and the folder then held `appearance.json` and `appearance.json.<pid>` (`## Probes`). `gaps.md:98`, which `befa9b5` wrote, says the same: "where that file cannot be removed either, it stays and nothing says so". So two records of this work item state one fact two ways. The frame's sentence says the work leaves no such file in any case, and the closing memo and the code say otherwise. A reader of the frame, such as the sealer reading what *Scope* item 24 promises against the code at `:38-40`, finds a sentence the target contradicts. The other statements of the fact hold as they stand. `frame/design.md:282` says "a save that fails removes its partial file" and promises nothing beyond the removal. `frame/plan.md:167` says the same. The docstring at `appearance.ts:27` is read with the comment at `:39` beside it, which names the case where the removal fails.

```markdown
    - The choice is kept by the app's main process in a file of its own under the app's user data folder, and given to the page at its load, so a window opens in the theme it was left in, on that theme's ground. The daemon does not learn of it (`frame/questions.md` Q8). A save that fails, at its write or at its rename, removes the partial file it wrote, and where that file cannot be removed either, it stays (`gaps.md` *Not done*).
```

The block replaces `frame/design.md:221` whole. It changes nothing in the code. No other sentence in the tree says that no partial file stays: `git grep -n -e 'appearance.json.<pid>' -e 'no partial file'` at `55250b7` printed this line, `frame/plan.md:167`, which says the old code left the file, and the two case names at `test/appearance.test.ts:75` and `:92`. Each case name states what its own input gives, and the cases hold it (executed, `## Confirmations`).

```seal
verdict: fixed 1d91709
answer: The round's replacement block was applied word for word to `frame/design.md:221`, which now says the partial file stays only where it cannot be removed either, as `gaps.md:98` and `appearance.ts` have it. No code changed.
```

## Confirmations

```seal
confirms: round-4#1
```
What holds: `frame/plan.md:166` names `plan.md` *Technical context* and the failure scenario of the chosen approach, and the word "Risks" stands nowhere in the plan (read at `55250b7`). The diff under review appended one row after it, at `:167`, and changed no other row, so the coordinate of `6f16158`'s fix is unchanged.

```seal
confirms: round-4#2
```
What holds: `gaps.md:98` names every way the theme's notice leaves the status line. Those are a later choice saved (`renderer.ts:313`, `untell`), another notice in its place, and `tell("")` at `renderer.ts:214`, `:220` and `:276`, the last of which `3b21d91` added after round 4's block left it out (a `git grep` at `55250b7`, executed). `befa9b5` added one sentence at the end of the line and changed none of the earlier sentences. `src/renderer/` did not change since `3b21d91`.

What matched, read against `frame/design.md` at `55250b7` unless it says otherwise:

- The "could not be saved" path behaves as before. `writeAppearance` throws the error the write or the rename threw (`appearance.ts:41`). So the handler of `Channel.saveAppearance` (`main.ts:56`) still throws, the page's `invoke` (`preload.ts:27`) still rejects, and `theme.ts:39` still calls `notSaved`, which tells "The theme could not be saved." (`renderer.ts:309`, `:314`). `notSaved` takes no argument, so which error reaches the page changes nothing a person sees. A mutant that drops the `throw error;` went red under `seal mutate` (executed). The rest of `gaps.md:98` holds as round 4 and the sealer read it: the window stays in the theme chosen (`theme.ts:37-38` run before the save), and the file on disk is the one saved before, because the rename that would replace it is what failed or never ran.
- The commit message of `48b7e6e` says the function "now removes the partial file and throws what refused the save, so the page's notice is unchanged". `appearance.ts:35-42` does that, and the bullet above gives the path to the notice (read).
- The two new cases pin what they claim. Run against the old body of `writeAppearance`, written back into the clone with the `Edit` tool, both failed at their `readdirSync` line, the guard each case names: `test/appearance.test.ts:88` received `["appearance.json", "appearance.json.23795"]` and `:98` received `["appearance.json.23795"]` (executed, `## Probes`). Under `seal mutate`, three mutants went red: the removal taken out, the `throw` taken out, and the write moved out of the `try` so that only a failed rename removes the file. The fourth mutant survived. It turns the inner `catch` into a `finally`, so that a refused removal throws the removal's error in place of the save's (executed). No case pins which error a failed removal leaves the caller. That is a gap in the cases and no finding: the one caller shows a fixed text whatever the error is (the first bullet), and the probe's first case shows the code throws the save's error.
- The write case's input is a read-only file left at the partial file's path. The case removes a file the save did not write, which is the same `rmSync` line a write that fails part-way reaches. Its red depends on the user not being root: under root, the write goes through mode 0400, and the case fails at `:97` for another reason. No workflow runs the suite (`gaps.md:7`), and the broad gate runs as the owner's user. That is a note on the case and no finding.
- The new cases were read against their group, `describe("the theme's file")`. The case at `:75` holds the save that succeeds. The two new cases hold a failed rename and a failed write, which no case of the group held before. `apps/desktop/test/` declares no `TARGET`, so `seal layout --pairs` names no pair.
- `frame/design.md:282`: `work-items.ts:70-76` writes `work-items.json.<pid>` with mode 0600 and renames it, and has no removal. So "written as `work-items.json` is written, to a partial file it then renames, except that a save that fails removes its partial file" matches both files (read).
- `frame/plan.md:167`: the old body leaves `appearance.json.<pid>` where the rename fails. The run against the old body above showed this (executed). Under the old body, the next save by the same process writes over the file and its rename removes it, as the row says. The row says the fix pass over round 3 found this. That pass's close (`round-3.md:205`) records a drive that put a folder where the file is renamed to, and does not record the file left behind. So the row's grounds come from the orchestrator's account of that pass. This round checked the fact itself and not who found it.
- `pr.md`: the diff added a row at the end of *Judgments of the run* and renumbered none. Rows 1, 8, 9, 10, 11 and 12 (`frame/plan.md:143`, `:150-154`) still hold the quotes `pr.md` cites, as round 4 compared them (read). `changelog.md` did not change, and says nothing about the partial file.
- `gaps.md`: the diff changed `:98` in place, and no row of `## Not verified` and no item of `## Not done` left.

The suite's label: the commits under review hand over no run of the broad gate, and the label `unverified` is honest. `trail/gate.md` names its newest run at `8636571`, and `48b7e6e` changes code after it. So the broad run is owed at `55250b7`, or at the commit that closes this round, and the orchestrator answers it. The finding is located in the records alone, so the code at `55250b7` is the code that run will read. The sealer's spawn comes after it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the typecheck and the documents' checks at the commit that closes this round | `seal/config.json` `Broad gate` | the orchestrator, by the broad run once the rounds settle |
| Whether the owner's choice reaches the other writers with the same cause. Each writes a `<file>.<pid>` partial file and renames it, with no removal where the write or the rename throws: `apps/desktop/src/daemon/last-look.ts:120-125`, which this work item added in phase 3, and `work-items.ts:70-76` and `discovery.ts:17-19`, which it did not. The caller limited this round to the diff, and *Judgments of the run* row 25 names the theme's file alone | `apps/desktop/src/daemon/last-look.ts:120-125`, `work-items.ts:70-76`, `discovery.ts:17-19`; `seal/threads/1795043695-inbox-first-window/frame/plan.md:167` | the owner, through the orchestrator |
| The caller's instruction to remove any probe file. The probe file stands in the round's clone under the scratch directory, and contract rules 7 and 17 keep what stands there. Nothing was added to the worktree but this record | `<scratchpad>/1795043695-inbox-first-window/round-5/clone/apps/desktop/test/test_tmp_partial.test.ts` | the caller |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/appearance.test.ts` in `apps/desktop` of a `git clone --no-local` at `55250b7` under `<scratchpad>/1795043695-inbox-first-window/round-5/clone`, with the worktree's `node_modules` linked in, once | 1 file, 13 cases passed, exit 0. A narrow run of the one case file the diff changed, not the broad gate. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-5/narrow.txt` |
| `seal mutate apps/desktop/src/main/appearance.ts --tests "node scripts/test-in-electron.mjs test/appearance.test.ts"` in the clone, with four `--replace` pairs: `rmSync(...)` to `void 0;`, `throw error;` removed, the write moved before the `try`, and the inner `catch` turned into a `finally` | the baseline passed. Mutants 1 to 3 went red and mutant 4 survived, exit 1. `seal mutate` prints no failing line, so which line failed for mutants 1 to 3 was not read. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-5/mutants.txt` |
| The same narrow command with the body of `writeAppearance` written back to its body at `607f8b0` through the `Edit` tool, once, then `git checkout -- apps/desktop/src/main/appearance.ts` in the clone | 2 failed and 11 passed, exit 1: `test/appearance.test.ts:88` and `:98`, each at its `readdirSync` line with the partial file listed. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-5/old-code.txt` |
| `node scripts/test-in-electron.mjs test/test_tmp_partial.test.ts` in the clone, once. Its first case mocks `node:fs`'s `rmSync` to throw for the partial file's path, puts a folder at `appearance.json` and saves. Its second case puts a folder at the partial file's path and saves | 2 passed, exit 0. In the first case the save threw the rename's error and the folder then held `appearance.json` and `appearance.json.<pid>`. In the second it threw `EISDIR` from the write, and the folder at the partial file's path stayed. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-5/probe-partial.txt` |
