# Phase 2: 1795559733-built-app-files-share-one-app

## What this phase found

### The batch run

`OWLERY_BACKGROUND=1 pnpm run test:app`, run once in `apps/desktop` at `0654d8d1`, exited 0 (executed). No other run of the suite was under way when it started. It had no changes under `apps/desktop` that the commit does not hold.

| | |
|---|---|
| Started | 2026-11-25 08:23:50 |
| Duration Vitest printed | 143.42 s; the wall clock around the command read 144 s |
| Test files | 18 passed, 2 skipped, of 20 |
| Cases | 203 passed, 8 skipped, of 211 |
| 1-minute load average, before and after | 4.24 and 4.62 |

### Scenario 4 was read from a list, because the run printed no file lines

`frame/design.md` scenario 4 reads the project name from each file line the reporter prints. Outside a terminal, Vitest's default reporter printed only the totals for files that passed, so the run gives no file line to read. Running the 144 s batch a second time with another reporter would not have been the one run the plan asks for. The crafter listed what the same filter selects instead:

```
ELECTRON_RUN_AS_NODE=1 node_modules/.bin/electron node_modules/vitest/vitest.mjs list --project app --filesOnly --json=<file>
```

This collects the files without running a case (executed, exit 0). It named 20 files, each with the project name `app`: the 20 built-app files, `test/launch.test.ts` among them. The run's own count, 20 test files, equals that list. The `buildApp` import pattern of `vitest.config.ts` matched 20 test files (executed: `grep -lE` over `test/*.test.ts`). So `--project app` runs the `app` project's files and no file of the `unit` project. The list is the same filter as the run, and is not the run itself. Which two files the run skipped is not named by its output.

### Scenario 5

`git diff --stat ec7816a -- apps/desktop/vitest.config.ts apps/desktop/test/built-app.ts` printed nothing (executed). The diff of `apps/desktop/package.json` since `ec7816a` adds the two script lines and changes no other line (executed).

### The runner's times

They are read from the log of `check` run 45500047201 (executed: the framer's saved copy of `gh run view 45500047201 --log`). No `check` run is newer: `gh run list --workflow check` listed it first (executed). Its image is `macos-26-arm64`.

| | |
|---|---|
| The suite | `Duration 737.99s` |
| The `app` project | from 22:30:39, the last `unit` file's line, to 22:33:47, the run's summary: 188 s |
| The `app` project's 17 file lines | 182.0 s summed |
| `test/chain.test.ts` | 480094 ms |
| `test/records-dialog.test.ts`, one case | 2386 ms |

### Decisions made while publishing, with their grounds

Each is judged against `frame/design.md` *Scope* item 4 and scenario 6.

1. **The published file names two commits.** The launches and the resets ran at `def06e3f` and the batch at `0654d8d1`. The commits between them change only the work item's records, so the file says that nothing under `apps/desktop` differs between them.
2. **"About 17 launches" in the published file is the frame's figure**, from `frame/design.md` *Grounding*. This phase did not count the launches a run of the suite makes.
3. **The published file gives the reasons the shared app is not built from the frame**, `frame/design.md` *Grounding* (the holders of state a reset would have to clear) and `frame/plan.md` *Alternatives considered* row 2. It names the owner's word on it nowhere, since `frame/questions.md` row Q1 belongs to the work item and not to the measurement.
4. **`changelog.md` moves no version and carries no `### Process changes` table.** `frame/plan.md` *Operational impact* says #168 moves the version. The diff changes none of the files `docs/layout/the-record-layout.md` *A change writes fragments, never a shared file* names, all of which are the plugin's.
