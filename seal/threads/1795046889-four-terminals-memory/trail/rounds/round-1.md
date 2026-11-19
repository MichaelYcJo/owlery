# Review round 1: 1795046889-four-terminals-memory

```seal
target: 2e20c88 against e9224dc
```

This round reads phase 1 as `frame/plan.md` *Phases* gives it: the diff from `e9224dc`, the frame the phase was built to, to `2e20c88`. That range holds the build commit `aeaa1e0`, the phase record and closing memo at `37d7bf3`, and the orchestrator's fold at `2e20c88`. The branch's base is `release/v0.0.1` at `ea78b7b`. No earlier round exists, so nothing was carried from a round. The probe facts of `frame/design.md` *Grounding* are dated to `7e33c8a` and were carried, not re-derived. `seal/parity.json` is not declared, and `seal/config.json` has no `Pact` key. The round started the app zero times.

## Findings

### 1. A sample that `footprint` read without the GPU or renderer process is kept, and reads lower than the app

```seal
severity: should
location: `apps/desktop/test/memory.ts:389`, `apps/desktop/test/memory.ts:106-111`, `apps/desktop/test/memory.test.ts`
evidence: executed `git grep -n -e "bytes.has" -e "bytes.get" -- apps/desktop/test/memory.ts`; read `apps/desktop/test/memory.ts:106-111`, `apps/desktop/test/memory.ts:224-231`, `apps/desktop/test/memory.ts:385-390`
```

Why it matters: `frame/design.md` *Scope* item 6 defines a sample as the sum of `phys_footprint` over the main process, every process below it, and the daemon. The code checks that `footprint` gave a number for two of those processes and no others. `memory.ts:389` throws only where the main process or the daemon has no number. `sums` at `memory.ts:109` adds `bytes.get(pid) ?? 0` for every other process of the app. `footprintsOf` at `memory.ts:224-231` returns whatever `footprint` printed when it exits with an error. The search printed those three lines and no other check of a missing number.

So a sample in which `footprint` missed the GPU process is kept as a sum of the app. On the phase's own numbers the GPU process is 309 MB of 459.8 for `one` and 558 MB of 747.3 for `eight-in-turn`. A process can be missed by a crash and restart of the helper between `ps` and `footprint`, or by `footprint` refusing one process. No rule throws that sample away, and only the last sample's by-kind row would show the gap. The undercount works in favour of the 500 MB target, so it is the same kind of number as the hidden-page sample that `thrownAway` exists to refuse. The panes' processes are a different case. Their `sleep` children end between `ps` and `footprint` on every sample, and adding nothing for them is right (`memory.test.ts:120`).

The fix moves the check into a pure function that a case can pin, and makes `measure` fail the launch on it. That matches what `gaps.md` *Not done* says of a failed launch.

```ts
// apps/desktop/test/memory.ts, beside `sums`
/** The app's processes that `footprint` gave no number for. A sum without one of them is not the app's, so `measure` takes no sample where this holds any. */
export function unread(split: Split, bytes: ReadonlyMap<number, number>): { pid: number; kind: Kind }[] {
  return split.app.filter((process) => !bytes.has(process.pid));
}

// apps/desktop/test/memory.ts#measure, in place of line 389
      const missing = unread(split, bytes);
      if (missing.length > 0) throw new Error(`\`footprint\` gave no number for ${missing.map((process) => `the ${process.kind} process ${process.pid}`).join(", ")}, so the sum is not the app's. The measurement is macOS's.`);

// apps/desktop/test/memory.test.ts, beside the `sums` cases, with `unread` imported
  it("names each process of the app that `footprint` gave no number for, and none of the panes'", () => {
    const split = splitProcesses(processRows(listed), 100, 104);
    expect(unread(split, new Map([[100, 60], [102, 5], [103, 40], [104, 20], [108, 1], [105, 2]]))).toEqual([{ pid: 101, kind: "gpu" }]);
  });
```

The snippet leaves one statement for the fix pass. The docstring of `sums` at `memory.ts:106` says "A process that ended before `footprint` read it has no number and adds none". After the fix, that is true of a pane's process alone, and the docstring should say so.

### 2. A malformed measurement variable fails every case of the file in a plain `pnpm run test`

```seal
severity: should
location: `apps/desktop/test/memory.test.ts:239`
evidence: executed `env -u OWLERY_MEASURE_MEMORY OWLERY_MEMORY_RUNS=0 node scripts/test-in-electron.mjs test/memory.test.ts` from `apps/desktop`, exit 1; read `apps/desktop/test/memory.test.ts:238-253`
```

Why it matters: `frame/design.md` *Scope* item 6 says "Without the variable the file runs the cases of its own functions and starts no app". vitest still runs the body of a skipped `describe` to collect its tests. That is why the phase record counts "the 9 launches" as skipped. So `planOf(process.env)` at `memory.test.ts:239` runs in every `pnpm run test`, and so in the `Broad gate`. With `OWLERY_MEMORY_RUNS=0` in the environment and the measurement off, the probe printed `FAIL test/memory.test.ts`, `Error: OWLERY_MEMORY_RUNS is "0". It is a whole number above zero.`, and `Tests no tests`. None of the 25 cases ran. `OWLERY_MEMORY_SCENARIOS` naming a scenario the tool does not have fails the same way. A builder who leaves phase 4's scenario list exported, while the tree holds phase 1's three scenarios, fails the suite for a reason that has nothing to do with the suite.

```ts
describe.runIf(MEASURE)("the memory measurement", () => {
  // A skipped suite's body is still collected, so the variables are read only where the measurement runs: a stray one would otherwise fail the cases above.
  const plan: ReturnType<typeof planOf> = MEASURE ? planOf(process.env) : { scenarios: [], runs: 0 };
```

`startOf(process.env)` on the next line throws nothing and may stay. A vitest case cannot pin a collection-time read. The fix pass shows the fix by running the probe's command again for exit 0 and 25 cases passed, and by seeing it fail with the guard removed.

### 3. "takes no process of another app" covers nothing the two cases above it do not

```seal
severity: should
location: `apps/desktop/test/memory.test.ts:113-116`
evidence: read `apps/desktop/test/memory.test.ts:88-116`
```

Why it matters: the case at `memory.test.ts:88` asserts the whole `app` list of `splitProcesses` over the `listed` fixture with `toEqual`. The case at `memory.test.ts:99` asserts the whole `panes` list over the same fixture, `[105, 106, 107]`. Every process id at or above 900 that either list could hold fails one of those two. So the case at `memory.test.ts:113` fails on no mutant that leaves both of them green. The phase record claims it as the case of the parent test in `splitProcesses` (`trail/phases/phase-1.md:55`). The mutant named there adds every listed process to the panes, so by reading it fails the cases at lines 88 and 99 as well. The crafter's `mutate-other-app.txt` ran that one case with the other 33 skipped, so it shows nothing about the other two. The case holds a fact the frame states, *Scope* item 6's definition of the app itself, so the exception for a case that holds no frame fact does not apply.

```ts
// apps/desktop/test/memory.test.ts: delete lines 113-116, the case "takes no process of another app".
```

The phase record's sentence at `trail/phases/phase-1.md:55` is dated to `aeaa1e0`, where the case stood, and stays.

### 4. Phase 1's Status cell renders empty, and its commit falls into a fifth cell

```seal
severity: should
location: `seal/threads/1795046889-four-terminals-memory/frame/plan.md:65`
evidence: executed `awk -F'|' 'NR>=63 && NR<=66 {print NR": "NF-2" cells"}' plan.md`, which printed 4, 4, 5 and 4 cells; read `seal/threads/1795046889-four-terminals-memory/frame/plan.md:63-65`
```

Why it matters: the fold at `2e20c88` changed the row's end from `are gone | |` to `are gone || \`aeaa1e0\` |`. The row now has five cells under a header of four. The fourth cell, Status, is empty, and a Markdown table drops the fifth, which holds `aeaa1e0`. The plugin's `skills/implement/SKILL.md` says the Status cell "is the trace that the build happened", and `seal pr-body` copies `## Phases` into the pull request body, where the cell will show nothing.

```markdown
| 1 | `frame/design.md` *Scope* item 6, for the scenarios `inbox`, `one` and `eight-in-turn`, on the window as it stands; their tables go into the phase record as the numbers before this work | Scenario 15, the parsing of `footprint`'s output and the split of the app's processes from the panes' as cases, each seen red before its code; scenario 16 executed; the measurement executed for those scenarios at the phase's commit; one sample's sum read against `footprint` run by hand on the same process ids; after the run, `ps` shows no process the measurement started and its folders are gone | `aeaa1e0` |
```

```seal
verdict: fixed 8f8daea
answer: The finding holds. The orchestrator wrote the *Phases* row 1 Status cell as the fourth cell, `aeaa1e0`, so the row has the header's four cells.
```

## Confirmations

What matched: scenario 16. Claimed in `trail/phases/phase-1.md:60`: 25 cases ran and 9 launches were skipped, with no process of the app. This round ran `env -u OWLERY_MEASURE_MEMORY -u OWLERY_MEMORY_RUNS -u OWLERY_MEMORY_SCENARIOS node scripts/test-in-electron.mjs test/memory.test.ts` from `apps/desktop`. It exited 0 with 25 passed and 9 skipped. Six `pgrep` polls during the run, for the app's main process, `dist/daemon.js` and `printer.sh`, found nothing. `executed`.

What matched: the measured bytes are the tree's. Claimed in `trail/phases/phase-1.md:5`: the run's four files are `aeaa1e0`'s bytes. `shasum -c` of the crafter's `measured-tree.sha` read OK for all four in the worktree, and `git diff --stat aeaa1e0 HEAD -- apps` printed nothing. The tables of `trail/phases/phase-1.md:7-17` are the lines of the crafter's `measure-2.txt`, cell for cell. `executed`.

What matched: what is read is `phys_footprint`. *Scope* item 6 names `phys_footprint`, and `memory.ts:57` reads the `Footprint:` line of each process, as `frame/design.md:40` says the earlier measurement did. This round ran `footprint --noCategories -f bytes` on five large processes of the same user, none of them the app. On each, the `Footprint:` line was the `phys_footprint:` line less 32,768 bytes. The fixture at `memory.test.ts:31-43` shows 16,384 bytes. At up to eight processes a sum that is under 0.3 MB, below the target's resolution. `executed`.

What matched: the by-hand check, with a departure the record names. The plan row asks for a sum read against `footprint` "on the same process ids". `trail/phases/phase-1.md:26` says the measurement prints no process id, so the loop shared the app and the seconds, not a list of ids. The crafter's `by-hand-3.txt` holds the main process and four children for `inbox`, which are the five kinds of the by-kind row, and readings of 155.9 to 156.0 MB beside the table's 155.9 and 156.0. Both read the same `Footprint:` lines, so the check confirms the sum and the split and not the tool. The record says "nine readings" from 18:15:36 to 18:15:45. The file holds eight, and no reader acts on the count. `executed`, `awk` over the file.

What matched: the driving code the crafter left with no case, read against the window. `openWorkItem` (`memory.ts:293-307`) fills the form as `korean-pane.ts:171-182` does, and sets the kind on the field, which `renderer.ts:178` reads at the press. `addPane` (`memory.ts:310-318`) finds the button by the label `work-item-view.ts:159` writes, `+ <label>`. `untilInFront` (`memory.ts:285-290`) reads `#tabs .tab:last-child`. `work-item-view.ts:243` fills `#tabs` with `.tab` spans alone, so that element is the last tab. `STEPS` (`memory.ts:321-339`) makes two work items of four panes each, and the window puts each started pane in front, as *Scope* item 6's `eight-in-turn` asks. `PAGE_READ` (`memory.ts:234-260`) is sent before the synchronous `ps` and `footprint` calls, so its second of frames starts as they do. It counts `#stage .xterm` and `#stage canvas`, and its two-second timer ends the count on a page that draws nothing. `measure` (`memory.ts:352-404`) emulates the focus only for an agent's start and passes `keepBackground` only for a person's, as *Scope* item 6 states. In its `finally` it reads the panes again, stops the app and the daemon through `BuiltApp#stop`, waits for the panes, kills what is left and removes the repository with its worktrees folder. `read`.

What matched: the parsers, the split and the tables against the frame. `processRows`, `footprints`, `splitProcesses`, `sums`, `thrownAway`, `startOf`, `planOf` and `tables` (`memory.ts:48-216`) match *Scope* item 6 and the names that `frame/design.md` *Data & interfaces* now gives for `OWLERY_MEMORY_SCENARIOS` and `OWLERY_MEMORY_RUNS`. `printer.sh` exits at once where its input is no terminal, which `claude.ts:134-142`'s lookup needs, and is committed with mode 100755. `read`.

What matched: the records against the target. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md` and `trail/phases/phase-1.md` were read whole at `2e20c88`. The fold's edits hold against the tree: `frame/plan.md:19` on `buildApp` and `BuiltApp.start` (`built-app.ts:15-18`, `built-app.ts:121-144`), `frame/design.md:79` on the `other` kind, and `frame/design.md:136` on the two variables. The two answers folded into `frame/questions.md`, Q3 (a) and Q4 (a), are the defaults the frame already builds on. The boundary set's reason, that `korean-input.test.ts` opens `package.json`, holds at `korean-input.test.ts:288`. The suite, the typecheck and the broad gate are labelled not verified, with the orchestrator as their answerer, in `gaps.md:12`, which is honest. `read`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| A person's start: `BuiltApp.start` with `keepBackground`, the form filled with the system's focus and no emulation, and the focus rule read on a real sample. The round makes no start without `OWLERY_BACKGROUND=1` | `apps/desktop/test/memory.ts:372-375`, `gaps.md:7`, `frame/questions.md` Q5 | the owner, at the machine |
| What the handlers for SIGINT, SIGTERM, SIGHUP and `exit` do when a run is stopped. vitest 4.1.12 runs the file in a forked worker, and whether its main process ends that worker before `interrupted` finishes was not run | `apps/desktop/test/memory.ts:357-368`, `gaps.md:11` | the owner, the first time a run is stopped by hand |
| Why `eight-in-turn` holds 17 canvases for eight terminals where `one` holds 3 for one terminal, and so whether every WebGL terminal still held its renderer at the samples | `trail/phases/phase-1.md:11` | phase 3's builder, which reads `eight-in-turn` again |
| `pr.md` does not stand at the target, so no quote of it was read. The plugin's `seal pr-body` says the orchestrator writes it before the first round | `seal/threads/1795046889-four-terminals-memory/pr.md` | the orchestrator |
| The desktop suite, the typecheck and the broad gate, which this round did not run (contract rule 2) | `seal/config.json` `Broad gate` | the orchestrator, at the broad run |

## Probes

| Command | Result |
|---|---|
| `env -u OWLERY_MEASURE_MEMORY -u OWLERY_MEMORY_RUNS -u OWLERY_MEMORY_SCENARIOS node scripts/test-in-electron.mjs test/memory.test.ts`, from `apps/desktop`, with six `pgrep -fl` polls beside it | exit 0, 25 passed and 9 skipped; no poll found the app, a daemon or a printer |
| `env -u OWLERY_MEASURE_MEMORY OWLERY_MEMORY_RUNS=0 node scripts/test-in-electron.mjs test/memory.test.ts`, from `apps/desktop` | exit 1; `FAIL test/memory.test.ts`, `Error: OWLERY_MEMORY_RUNS is "0". It is a whole number above zero.`, `Tests no tests` |
| `footprint --noCategories -f bytes` over five of the user's largest processes, none of them the app | exit 0; each `Footprint:` line is that process's `phys_footprint:` line less 32,768 bytes |
| `shasum -c` of the crafter's `measured-tree.sha`, and `git diff --stat aeaa1e0 HEAD -- apps` | four files OK; the diff printed nothing |
| `awk -F'\|' 'NR>=63 && NR<=66 {print NR": "NF-2" cells"}' plan.md` | 4, 4, 5 and 4 cells |
| `git grep -n -e "bytes.has" -e "bytes.get" -- apps/desktop/test/memory.ts` | three lines, 109, 110 and 389 |
| `awk` over the crafter's `by-hand-3.txt` for the `inbox` launch from 18:15:36 to 18:15:45 | eight readings |
