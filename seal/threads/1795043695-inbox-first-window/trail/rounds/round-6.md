# Review round 6: 1795043695-inbox-first-window

```seal
target: 9baf6b7, fixes d8b9360..9baf6b7
```

This is a verifying round over a change the owner asked for after the sealer sealed at `67f270d`. Its target is the diff `d8b9360..9baf6b7`. That diff holds four commits: the orchestrator's fold of the owner's choice (`6e8b528`), the new helper `writeWholeFile` with the four writers moved onto it and three new cases (`5b15ff7`), one line added at `gaps.md:99` (`16d2dbc`), and the orchestrator's fold naming the helper in the frame (`9baf6b7`). The code reviewed is that diff alone: `apps/desktop/src/daemon/whole-file.ts`, `discovery.ts`, `work-items.ts`, `last-look.ts`, `src/main/appearance.ts` and the new cases in `test/daemon.test.ts`, `test/last-look.test.ts` and `test/work-items.test.ts`. Each was read against the frame and against the writers' callers. Those callers are the `looked` case of `daemon.ts:297-306`, the `createWorkItem` case at `daemon.ts:237-256`, `src/daemon/main.ts:63` with its `catch` at `:69-72`, the theme's handler at `src/main/main.ts:56`, and `src/main/daemon-client.ts:43` and `:63`, which read the discovery file. None of these callers changed in the diff (`git diff --stat d8b9360 9baf6b7` over them and over `src/renderer` printed nothing, executed). The parts of `277eb35..d8b9360` the diff does not touch were not reviewed again.

The work item's records were read whole at `9baf6b7`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `guarantee.md`, `trail/gate.md`, `trail/rounds/round-4.md` and `round-5.md`. The phase records and rounds 1 to 3 were opened at the lines a search for `partial`, `whole-file`, `writeDiscovery` and `renameSync` named: `trail/phases/phase-3.md:10`, `phase-9.md:14`, `:50`, `round-1.md:163` and `:165`. No `pr.<lang>.md` stands, since `seal/config.json` names English for both language keys. The repository declares no `seal/parity.json`.

Facts carried from round 5 and not established again: the path from a failed theme save to the page's notice (`main.ts:56`, `preload.ts:27`, `theme.ts:39`, `renderer.ts:309-314`), and round 4's word-for-word comparison of the `pr.md` quotes with rows 1 and 8 to 12 of *Judgments of the run*. This round re-ran neither, because the diff touched none of those lines. Every verdict below is this round's own.

There are two findings, both `should`. Finding 1 is in the code, a comment of the new unit. Finding 2 is located in the work item's records alone.

## Findings

### 1. The helper's opening comment says it is the one way a lasting file is written, and the daemon writes two lasting files another way

```seal
severity: should
location: `apps/desktop/src/daemon/whole-file.ts:1-4`
evidence: executed `git grep -n -E 'writeFile|appendFile|openSync|createWriteStream|copyFile|renameSync|mkdtemp' -- src` in `apps/desktop` of the round's clone at `9baf6b7`; read `apps/desktop/src/daemon/whole-file.ts:1-4`, `apps/desktop/src/daemon/hooks.ts:52-57`, `apps/desktop/src/daemon/main.ts:29-38`, `apps/desktop/src/main/daemon-client.ts:46-47`, `seal/threads/1795043695-inbox-first-window/frame/design.md:282`
regression: round-5
```

Why it matters: the unit is the new module `whole-file.ts`, which `5b15ff7` added. Its first sentence reads "The one way a file that outlives its writer is written here." The search over `src` lists two other writes of files that outlive the process that writes them. `writeHookSettings` writes `claude-hooks.json` into the run folder with `writeFileSync` directly, with no partial file (`hooks.ts:55`). The daemon's `stop` removes `daemon.json` alone (`main.ts:34`), so that file stays after the daemon exits. `ensureDaemon` opens `daemon.log` in the run folder for append (`daemon-client.ts:47`), and the log outlives both the app and the daemon. The comment is what the next agent to add a writer, or to edit `hooks.ts`, reads to learn how this code base writes its files. As written, it tells that agent that the hook settings are written whole through a rename, and they are not. `frame/plan.md:168` and `frame/design.md:282` give the helper four files, the discovery file, `work-items.json`, the last look and `appearance.json`, and say "All four are written by one function". The comment widened that to every file that outlives its writer, which neither the frame nor the tree holds. The defect comes from that widening, not from the four writers, which match the frame.

```ts
// The one way the app writes a file a reader must never find half-written:
// the daemon's discovery file, its list of work items and its last look, and
// the main process's theme file. It is kept beside the daemon's files, whose
// three writers use it, and the app's main process imports it as it imports
// the discovery file's reader. It reads `node:fs`, so nothing the page loads
// imports it.
```

The block replaces `whole-file.ts:1-4` whole. It changes no code line, and it assumes no OS precondition. No other sentence in the tree says the helper is the only way a file is written: `git grep -n -i -e 'one way' -e 'one function' -e 'one writer'` over `apps` and the work item's `frame/` and `gaps.md` prints this comment and `frame/design.md:282`, which names the four files and stays as it is. The subject line of `9baf6b7` says "the one writer of the inbox-first window's whole files". That is history, and it stays.

```seal
verdict: fixed f1f1932
answer: The round's replacement block was applied word for word to `apps/desktop/src/daemon/whole-file.ts:1-4`, which now names the four files the function serves. The change is to the comment alone.
```

### 2. `frame/design.md` *Data & interfaces* still says the theme's file is written as `work-items.json` is, "except that" a failed save removes its partial file, and `work-items.json` now does the same

```seal
severity: should
location: `seal/threads/1795043695-inbox-first-window/frame/design.md:282`
evidence: read `seal/threads/1795043695-inbox-first-window/frame/design.md:282`, `apps/desktop/src/daemon/work-items.ts:71-75`, `apps/desktop/src/daemon/whole-file.ts:13-26`, `apps/desktop/src/main/appearance.ts:28-32`, `seal/threads/1795043695-inbox-first-window/guarantee.md:36`, `seal/threads/1795043695-inbox-first-window/frame/plan.md:168`
regression: round-5
```

Why it matters: the unit is the paragraph at `frame/design.md:282`, which `9baf6b7` changed. Its third sentence still reads "The file is `appearance.json` in the app's user data folder, written as `work-items.json` is written, to a partial file it then renames, except that a save that fails removes its partial file (*Scope* item 24)." At `9baf6b7`, `work-items.ts:74` writes through `writeWholeFile`, and so does `appearance.ts:31`. `whole-file.ts:18-24` removes the partial file for both. So the two files are written the same way, and the exception the sentence names is not in the tree. The fold added two sentences after it ("The daemon's three files written the same way ... remove their partial file on a failed write or rename as well. All four are written by one function ...") and left the old clause standing. The paragraph now states the difference and then takes it back, and a reader has to choose between the two. That reading is not hypothetical. The sealer's last run read "except that" as a statement about the code. Its parties table (`guarantee.md:36`) cites "`work-items.ts:70-76`, which writes and renames with no removal, as `:282` says by 'except that'". The next sealer run reads the same sentence against code where that no longer holds. `frame/plan.md:168` has every daemon file written through a partial file remove it on failure, "as the theme's file does". The fold wrote that next to the sentence it corrects instead of rewriting the sentence, which contract rule 19 asks for, and the defect comes from that placement.

```markdown
`apps/desktop/src/main/main.ts` hides the title bar, keeps the theme's file and opens the window on the saved theme's ground (*Scope* items 13 and 24). `apps/desktop/src/shared/ipc.ts` gains the channels by which the page reads the saved choice and saves a new one, and `src/preload/preload.ts` offers them to the page. The file is `appearance.json` in the app's user data folder. It is written as the daemon's three files are written, the discovery file, `work-items.json` and the last look: to a partial file it then renames, and a write or a rename that fails removes its partial file (*Scope* item 24). All four are written by one function, `src/daemon/whole-file.ts#writeWholeFile`, which `src/main/appearance.ts` imports.
```

The block replaces `frame/design.md:282` whole. It changes no code. The other statements of the fact hold as they stand. `frame/design.md:221` and `gaps.md:98-99` give the case where the removal fails as well. `frame/plan.md:167` says what the old code of phase 9 did, which is true of its time. `frame/design.md:58` is *Grounding* dated to `1d5b49f`. The docstring at `appearance.ts:28`, "as the daemon writes its list of work items", is now true without an exception. `guarantee.md:36` is the sealer's record of its run at `67f270d`, and the sealer's next run rewrites it, so the fix pass owes it nothing.

```seal
verdict: fixed 4054860
answer: The round's replacement block was applied word for word to `frame/design.md:282`, which no longer names an exception the tree does not hold. No code changed.
```

## Confirmations

```seal
confirms: round-5#1
```
What holds: `frame/design.md:221` at `9baf6b7` is round 5's replacement block word for word: a failed save removes its partial file, "and where that file cannot be removed either, it stays". The code that sentence describes moved from `appearance.ts` into `whole-file.ts:18-24`, where the removal is tried once inside its own `try` and its error is swallowed. Round 5's probe was written again from its `## Probes` row and widened to one daemon writer (`## Probes`, last row, executed). With `rmSync` refused for the partial file's path and a folder at `appearance.json`, `writeAppearance` threw the rename's error, and the folder then held `appearance.json` and `appearance.json.<pid>`. `WorkItemList#add` did the same for `work-items.json`. With a folder at the partial file's path, the write threw `EISDIR` and the folder stayed.

What matched, read against `frame/design.md` at `9baf6b7` unless it says otherwise:

- **Each caller behaves as before on success and on failure.** `writeWholeFile` rethrows the error object that the write or the rename threw (`whole-file.ts:24`), the same object the old bodies let through. The `looked` case still catches it, logs "the last look was not written: " with its message, and keeps the look (`daemon.ts:299-305`). The `createWorkItem` case still sends its message as an `error` to the client that asked (`daemon.ts:251-252`). A failed discovery write still reaches `main().catch` and exits 1 with the message (`main.ts:69-72`). The theme's handler still rejects (`main.ts:56`), on round 5's carried path. `daemon-client.ts` only reads the discovery file, and `readDiscovery` did not change (`discovery.ts:21-31`). On success, each writer still writes the same text to the same path, and `discovery.ts:18` still returns the file's path (read). The claim in `5b15ff7`'s message, "so each caller handles the error as before", holds.
- **The helper keeps each writer's old guarantees.** The mode is 0600 at `whole-file.ts:16`. The mutant writing 0644 went red, held by the mode cases (`test/work-items.test.ts:32-36`, `test/last-look.test.ts:72-77` and their peers; executed, `## Probes`). The replace is still a write to `<file>.<pid>` followed by `renameSync` onto the file (`:16-17`). No case can see a reader in between. The mutant that wrote the file in place went red only because the new cases expect the rename's message, so atomicity is held by reading and not by a case, as it was before the diff. `LastLook#record` still sets the look before it writes (`last-look.ts:121`, `:124`), and the new case's last line and the case at `test/last-look.test.ts:174-179` both hold that.
- **The renderer bundle pulls in no `node:fs`.** `node build.mjs` exited 0. `dist/renderer.js` holds no `node:fs` and no `writeWholeFile`, which `dist/main.js` and `dist/daemon.js` hold (`grep -c`, executed). The only imports under `src/renderer`, `src/preload` and `src/shared` are of `./`, `../shared`, xterm and electron (`git grep`, executed). esbuild builds the renderer for the browser platform (`build.mjs:36-41`).
- **The three new cases pin what they claim.** The bodies of `discovery.ts`, `work-items.ts` and `last-look.ts` at `d8b9360` were checked out into the clone. All three cases then failed, each at its `readdirSync` line, with `<file>.<pid>` listed: `test/daemon.test.ts:1345`, `test/last-look.test.ts:187` and `test/work-items.test.ts:81` (executed, `## Probes`). Under `seal mutate`, four of five mutants of `whole-file.ts` went red: the removal taken out, the rethrow taken out, the mode widened, and the rename replaced by a write in place. The fifth turns the inner `catch` into a `finally`, so a refused removal throws the removal's error. It survived. `gaps.md:99` says so: "No case covers a refused removal." No case under `apps/desktop/test` mocks `node:fs` (`git grep -n -e vi.mock -e vi.spyOn` printed nothing, executed).
- **The new cases were read against their groups.** Before the diff, neither `describe("discovery")` nor `describe("WorkItemList")` held a failed write. The last-look group held one that fails at the open (`test/last-look.test.ts:174`) and none that fails at the rename. `apps/desktop/test` declares no `TARGET`, so `seal layout --pairs` names no pair (`git grep -c TARGET` exited 1, executed). The last assertion of the new last-look case (`test/last-look.test.ts:188`) repeats what `:174-179` already holds, so it adds nothing to the group. That is a note on the case and no finding.
- **`frame/plan.md:168` holds.** The three daemon writers that use a partial file and a rename are the three it names. The search of finding 1 lists every write under `src`. Besides the helper, it lists `hooks.ts:55`, a direct write with no partial file, and `daemon-client.ts:47`, a log opened for append. The row's grounds name round 5, whose `## Not judged` named these three writers (`round-5.md:69`). The crafter's hand-back that the row also names is not in the records. This round checked the fact and not who reported it.
- **`gaps.md:99` holds.** The probe shows that a refused removal leaves `<file>.<pid>` and that the caller gets the rename's error. "Nothing says so" holds too. The `looked` log line and the `createWorkItem` error both carry the write's message, and neither names the partial file (`daemon.ts:303`, `:252`). The line was added in place under `## Not done`. The diff adds that one line and removes none, so no row of `## Not verified` and no item of `## Not done` left (`git diff d8b9360 9baf6b7 -- gaps.md`, executed).
- **The comments at `discovery.ts:14`, `work-items.ts:73` and `last-look.ts:123`** say that a failed write removes its partial file, and they do not name the case where the removal is refused. The helper's own comment at `whole-file.ts:22` names it, and `gaps.md:99` states it. That is the reading round 5 gave the docstring at `appearance.ts:27`, and none of these comments promises more than the removal is tried.
- **`frame/design.md:282`, from "The daemon's three files" to its end, holds** (read, and the probes above). Its first clause about `work-items.json` is finding 2.
- **`pr.md`, `changelog.md`, `routing.md` and `frame/questions.md` did not change** (`git diff --stat`, executed). The diff appended row 26 at `frame/plan.md:168` and renumbered no row, so rows 1 and 8 to 12 still hold the quotes `pr.md` cites. `changelog.md` says nothing about partial files. The leftover file arose only on a failure path, in code no release has shipped (`frame/design.md:27`: no release exists), so no changelog line is owed.

The suite's label: the commits under review hand over no run of the broad gate, and the label `unverified` is honest. `trail/gate.md` names its newest run at `56e730b`, and `5b15ff7` changes code after it. Finding 1 is a comment in the code, so the broad run is owed at the commit that closes this round, and the orchestrator answers it. The sealer's spawn comes after that run.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the typecheck and the documents' checks at the commit that closes this round | `seal/config.json` `Broad gate` | the orchestrator, by the broad run once the rounds settle |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/daemon.test.ts test/last-look.test.ts test/work-items.test.ts test/appearance.test.ts` in `apps/desktop` of a `git clone --no-local` at `9baf6b7` under `<scratchpad>/1795043695-inbox-first-window/round-6/clone`, with the worktree's `node_modules` linked in, once | 4 files, 108 cases passed, exit 0. A narrow run of the four case files the writers reach, not the broad gate. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-6/narrow.txt` |
| `git checkout d8b9360 -- src/daemon/discovery.ts src/daemon/work-items.ts src/daemon/last-look.ts` in the clone, then the narrow command over the three daemon case files with `-t "throws where the rename fails"`, then `git checkout 9baf6b7 -- src`. These were checkouts of committed bytes, not `Edit` substitutions, so they could not miss without saying so | 3 failed and 92 skipped, exit 1. Each failed at its `readdirSync` line with `<file>.<pid>` listed: `test/daemon.test.ts:1345` received `["daemon.json", "daemon.json.21724"]`, and the same held at `test/last-look.test.ts:187` and `test/work-items.test.ts:81`. `git status` was clean afterwards. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-6/old-writers.txt` |
| `seal mutate apps/desktop/src/daemon/whole-file.ts --cwd apps/desktop --tests "node scripts/test-in-electron.mjs test/daemon.test.ts test/last-look.test.ts test/work-items.test.ts test/appearance.test.ts"` in the clone, with five `--replace` pairs: the `rmSync` call to `void rmSync;`, `throw error;` removed, `{ mode: 0o600 }` to `{ mode: 0o644 }`, the inner `} catch {` to `} finally {`, and the `renameSync` call to a write of the file in place followed by the removal | the baseline passed. Mutants 1, 2, 3 and 5 went red, and mutant 4 survived, exit 1. `seal mutate` prints no failing line, so which case failed for each red mutant was not read. A mutation score shows the code is tested, not that it is safe. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-6/mutants.txt` |
| `node build.mjs` in `apps/desktop` of the clone, then `grep -c` for `node:fs` and for `writeWholeFile` over `dist/renderer.js`, `main.js`, `daemon.js` and `preload.js` | build exit 0. `renderer.js` gave 0 for both, `main.js` 3 and `daemon.js` 5 for the helper, and `preload.js` 0. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-6/build.txt` |
| `node scripts/test-in-electron.mjs test/test_tmp_partial.test.ts` in the clone, once. The probe mocks `node:fs`'s `rmSync` to throw for a path ending in `.<pid>` while a flag is set. Its cases are: a folder at `appearance.json` with the theme saved; a folder at `work-items.json` with a work item added; and a folder at `work-items.json.<pid>` with a work item added and the mock off | 3 passed, exit 0. The first two threw the rename's error and left `<file>.<pid>` beside the folder. The third threw `EISDIR` from the write and left the folder at the partial file's path. The probe file stays in the clone under the scratch directory. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-6/probe-partial.txt` |
