# Phase 1: 1795341002-settle-reads-decisions

## What this phase found

**#40 is merged, and the three modules this work reads stand as the frame read them.** `origin/release/v0.0.2` at `cc0b938` was merged into this branch as `9e415bd`, with no rebase. `git diff --stat 85b6c50 cc0b938` names no change to `apps/desktop/src/daemon/record-blocks.ts`, `apps/desktop/src/daemon/decision-record.ts` or `apps/desktop/test/decision-record.test.ts` (executed). So `readDecisionRecord`, `RECORD_FILE`, `DecisionBlock` and `QuestionBlock` are as the frame names them, and the case `## Removes` names still opens at line 402 of `decision-record.test.ts` (read). The sentence R2 rewrites still stands at line 214 of `docs/architecture.md` and of `docs/architecture.ko.md` (read).

**One difference in `records-place.ts`, and it does not change what this work reads.** Between `85b6c50` and `cc0b938`, `rootOf` moved its test of the first line into a function of its own, `opensWithMarker`. It still reads the first line of `<name>/README.md` in the working tree, takes off a trailing carriage return, and compares the line with `MARKER`, for `seal` and then `agentic-seal` (read). The rest of that diff is #40's setup reading the place from the commit the checkout stands at (`planRecords`), and the two paragraphs of `docs/architecture.md` that say so. This work reads neither.

**The frame holds.** The facts of *Grounding* this phase builds on were opened at the merged tree: `apps/desktop/package.json` has `esbuild` 0.28.2 and no TypeScript runner, `build.mjs` bundles the daemon with esbuild, `tsconfig.json` resolves imports as `Bundler`, and no `seal/follow-up.md` stands (read). The worktree held no `node_modules`, so `pnpm install --frozen-lockfile` ran once in it before the first case.

**Decision: `command` stands in `settle.ts`, beside `readSettle` and `listMarkdown`, and `settle-main.ts` only calls it.** `frame/design.md` *Data & interfaces* gives `settle.ts` two exports and `settle-main.ts` the command. A file that runs the command when it loads cannot be imported by a case. So the flags, the printing and the exit code are the function `command(args, cwd, print)`, which the cases call in their own process, and `settle-main.ts` is one statement that passes it `process.argv`, `process.cwd()` and the two streams. One case runs `scripts/settle.mjs` in a child process, so the bundling and the exit code of the script are read too. Judged against `frame/design.md` *Data & interfaces*.

**Decision: a `decisions.md` that stands and cannot be read stops the settle with exit 2 and names the file.** *Scope* item 2 keeps a directory for a refused block. A file that cannot be opened at all, such as a folder named `decisions.md` or a file without read permission, has no block and no line to name. Reading it as an empty record would remove a record nobody read, which the *Grounding* row on the plugin's `skills/settle/SKILL.md` *What `--apply` does* rules out. `readSettle` throws `<path> cannot be read: <code>`, and the command prints it and exits 2, the exit *Data & interfaces* gives a `since` that git cannot read. Nothing is removed on exit 2, and phase 2's `--apply` reads the same function. Judged against `frame/design.md` *Grounding* and *Data & interfaces*. Keeping the directory as a row instead is in `gaps.md` `## Not done`.

**Decision: `--list` exits 0 whatever the settle keeps.** *Scope* item 4 gives exit 1 to the run with no flag, where it keeps a directory. `--list` prints the Markdown that #49 places in the release's pull request and note, and a kept directory does not change that text. It exits 2 where the reading fails. Judged against `frame/design.md` *Scope* items 4 and 10.

**Decision: the layout of the list.** `frame/questions.md` leaves it to this phase. The list opens with one line per kind that occurs, in the grammar's order (`route`, `default`, `scope`, `answered`), as `` - `default`: 2 decisions, 1 reversed by the person``. A decision the person reversed is one whose state is not `decided`: P10 gives `applied` and `carried` only to a decision that was `reversed` first. Then each work item that holds a decision has a `### <id>` heading, with ` (#N)` where its pull request is named, and one list item per decision: `Decision <id>, `<kind>`: <decided>`, with nested items `Grounds:`, `By:` where the block has one, and `State:`. The state is the word in backticks, then the person's message after a colon where the state holds one. A release with no decision prints `No decision was made without asking in this release.` A work item with no decision stays in `SettleReading.release` and has no heading in the list. Judged against `frame/design.md` *Scope* item 3 and `docs/architecture.md` P10.

**Decision: the pull request is read from the newest commit that added the work item's `routing.md`.** The command is `git log -1 --diff-filter=A --format=%s -- <root>/threads/<id>/routing.md`, without `--first-parent`, so on `main` after the release's merge it still finds the squash commit on the release branch that ends `(#N)`. A `routing.md` that no commit added, or a subject that does not end `(#N)`, names no pull request. Judged against `frame/design.md` *Scope* item 3 and the *Grounding* fact on the subject of the adding commit.

**Decision: a folder without a records root asks git nothing.** `readSettle` returns no kept directory, no notice and no release, with `since` as it was given or null. The command prints `The repository holds no records root.` and exits 0, because nothing stands to keep. Judged against `frame/design.md` *Data & interfaces* (`root` is null where the folder holds no records root).

**Decision: only directories under `<root>/threads/` are read, in the order of their names.** A file there is no work item's directory. Reading one as a directory would ask for `<file>/decisions.md` and stop the settle on `ENOTDIR`. The names are sorted in the code, and not left to the order the file system lists them in. Judged against `frame/design.md` *Scope* items 1 and 3.

**Decision: the command refuses a flag it does not know, and a `--since` with no ref after it, with exit 2 and its usage line.** `--apply` is such a flag in this phase, and phase 2 adds it. Judged against `frame/design.md` *Data & interfaces* *The command*.

**Decision: the rows' and the command's wording.** A kept row is `decision <id> is reversed; decided: <decided>; reversal: <message>`, `question <id> is open; asks: <asks>`, or `the reader refuses the line: <the reader's reason>`. The command prints `kept <directory>/`, then each row as `  <directory>/decisions.md:<line>: <row>`, each notice as `notice <directory>/decisions.md:<line>: <the reader's reason>`, then `Kept no directory.` or `Kept <n> directory with an open row.` (`directories` where n is more than 1), then the ref the release is read from, then the list. A path with its line, as `git grep` and a compiler print it, opens in a terminal and an editor. The cases pin each sentence (contract rule 14).

**The bundle runs in the process of `scripts/settle.mjs`.** esbuild writes it as an ES module into a folder that `mkdtempSync` makes under the system's temporary directory, the script imports it, and removes the folder after the import. `ls -d $TMPDIR/owlery-settle-*` after scenario 12 matched nothing (executed).

**Seen red.** `test/settle.test.ts` ran before `src/daemon/settle.ts` stood, and the file failed on `Cannot find module '../src/daemon/settle'`, with no case run (executed). That red names no guard, so each guard was also broken alone with `seal mutate`, after commit `7f2c20e`, running only the cases that cover it. Each of the 24 runs read `red` (exit 0), and each failing line was read for the guard it breaks (executed; the driver and each run's output are in the scratch directory `1795341002-settle-reads-decisions/phase-1/`):

| Break | Failing line |
|---|---|
| A reversed decision keeps nothing | `settle.test.ts:68`, the kept rows of scenario 1 |
| An open question keeps nothing | `:94`, the kept rows of scenario 2 |
| A refusal keeps nothing | `:111`, the kept rows of scenario 3 |
| A notice keeps its directory | `:138`, scenario 4's `kept` is not empty |
| `applied` and `carried` keep their directory | `:168`, scenario 5's `kept` is not empty |
| `answered` keeps its directory | `:168`, the same |
| A `decisions.md` that cannot be read is read as empty | `:128`, `readSettle` does not throw |
| Every directory is the release's | `:214`, `1-a` of the earlier release is listed |
| No default tag | `:213`, `since` is null and not `v0.0.1` |
| The pull request's pattern never matches | `:214`, `3-c` names no `#12` |
| The reversed count is 0 | `:220`, the count lines differ |
| The run with no flag exits 0 where it keeps | `:75`, exit 0 and not 1 |
| `--since` is dropped | `:251`, the list lacks `### 1-a (#3)` |
| An unknown flag is let through | `:262`, `--frobnicate` exits 1 and not 2 |
| `--list` prints the whole reading | `:244`, exit 1 and the kept lines |
| The rows are not sorted by line | `:94`, the reversed row comes before the question |
| A file under `threads/` is read as a directory | `:167`, `notes.md/decisions.md cannot be read: ENOTDIR` |
| A `seal/` without the marker is read | `:178`, `root` is `seal` |
| No sentence for a missing records root | `:181` |
| An empty release prints nothing | `:270` |
| A ref git cannot read is read as an empty tree | `:259`, `readSettle` does not throw |
| `settle-main.ts` exits 0 | `:88`, the script's exit is 0 and not 1 |
| No tag is reachable and the reading still names one | `:253`, `git ls-tree` fails on the tag that no longer stands |
| The directories are read in reverse order | `:214`, `3-c` comes before `2-b` |

Three checks were written after the module stood, in commit `7f2c20e`: the rows in the record's order in scenario 2's case, the file under `threads/` in scenario 5's case, and the case with no records root. Their only red is their breaks in this table.

**Scenario 12, run once in this repository at `7f2c20e`.** `pnpm --filter @owlery/desktop run settle` exited 0 and printed `Kept no directory.`, `The release's work items are those added since v0.0.1.` and `No decision was made without asking in this release.` (executed). No directory under `seal/threads/` holds a `decisions.md` yet. `git status --porcelain` printed the same before and after the run (executed).

**The phase's boundary run, at `7f2c20e`.** One command, `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/settle.test.ts test/korean-input.test.ts test/records-dialog.test.ts` in `apps/desktop`, exited 0: 3 files, 45 cases passed and 1 skipped (executed). The two other files read `apps/desktop/package.json`, which this phase changed. The skipped case is in `korean-input.test.ts`'s group "the typed run", which runs only where `OWLERY_KOREAN_TYPED` is set (read: `describe.runIf(TYPED)` at its line 321). `92856b2` then changed the module's comment alone, and `test/settle.test.ts` passed after it, 12 cases (executed).

**Typecheck.** `tsc` over a project that holds `settle.ts`, `settle-main.ts` and `test/settle.test.ts`, with the package's `tsconfig.json` and the modules they import, exited 0 (executed). The repository configures no linter and no formatter.
