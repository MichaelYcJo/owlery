# Phase 2: 1795341002-settle-reads-decisions

## What this phase found

**The frame holds for items 5 and 6, with one departure in what is put back.** The plugin's `skills/settle/scripts/settle.py` takes `--released-at` and defaults it to `origin/main` (line 23), and its `apply` removes with `shutil.rmtree` (line 2050) and returns 1 where it kept a directory (line 2066) (read, plugin 0.38.4). So the command passes `--released-at` only where it is given, and lets the plugin's default stand otherwise. Phase 1's `command`, `readSettle` and `KeptDirectory` stand as the folded frame names them (read).

**Decision: the put-back writes each kept directory that differs from `HEAD` after the settle, not only one the working tree no longer holds.** *Scope* item 5 says "puts back each kept directory the working tree no longer holds". The same probe that refuses before the run, `git status --porcelain -- <directory>/` printing a line, is read again after it. A directory the settle removed whole prints a line, and so does one it removed in part or whose deletion it staged. Before the run the probe printed nothing, so `HEAD` holds the whole directory and the checkout loses nothing. A test of "no longer holds" would leave a directory removed in part as the settle left it. The count line counts what was put back, so a kept directory the settle left as it was is not counted. Judged against `frame/design.md` *Scope* item 5 and `frame/plan.md` *Technical context*, the failure scenario's staged deletion. The frame's sentence is for the orchestrator to fold.

**Decision: a kept directory whose checkout fails is named as not put back, and the put-back goes on to the next.** The first build let the git error end the command, so the kept directories after it in the order were neither put back nor named. Each is now named on the error stream as `settle: not put back <directory>/: <git's error>`, with the rows that kept it, and the exit is 2. *Scope* item 5 asks for one line for each kept directory, and *Scope* item 6 gives exit 2 to a run that did not do what it was asked. Judged against `frame/design.md` *Scope* items 5 and 6.

**Decision: the exit.** Exit 2 where the command refused, where `HEAD` moved, where a put-back failed, and where AgenticSeal's settle gave 2. The settle's exit is also read as 2 where it is neither 0 nor 1, where it ended on a signal, and where it did not start. The last three cases are named on the error stream. Otherwise the exit is 1 where the reading kept a directory or the settle gave 1, and 0 where neither did. A settle that gives 3 has not said that it removed nothing. Reading it as 0 or 1 would report a clean settle the command cannot vouch for. Judged against `frame/design.md` *Scope* item 6.

**Decision: a `HEAD` that git cannot read after the settle counts as moved.** The check compares `git rev-parse HEAD` before and after. Where the second call fails, nothing is put back and each kept directory is named as not put back, as for a commit. A checkout from a `HEAD` that git cannot resolve would put back nothing sure. Judged against `frame/design.md` *Scope* item 5.

**Decision: every refusal is named before the exit, and nothing is printed to the output stream on a refusal.** A run that finds a kept directory that differs and no `seal` names each of them, then `settle: --apply ran nothing.`, on the error stream. The person fixes all of them in one pass. Judged against `frame/design.md` *Scope* item 5.

**Decision: `seal` is the first file named `seal` in a folder of the path that the process can run, and that file is what runs.** A folder named `seal`, or a file without the execute bit, is passed over, as a shell's lookup passes over it. The command runs the path it found, so the lookup and the run cannot disagree. Judged against `frame/design.md` *Scope* item 5 ("where `seal` is not found on the path").

**Decision: the settle's output is let through once it ends, its output stream to the output stream and its errors to the error stream.** The settle runs with `spawnSync` and a 64 MiB buffer, in the repository's top. The command prints through its `Printer`, which the cases read, so it captures the output and does not inherit the streams. What the settle prints reaches the person whole, after it ends and not while it runs. Judged against `frame/design.md` *Scope* item 5 ("lets that command's output through as printed") and the folded *Data & interfaces*, `command(args, cwd, print)`.

**Decision: `--apply` names the reader's notices before the settle runs, and prints neither the kept directories' heading nor the list.** P9 names a line the daemon cannot read. A settling session that runs only `--apply`, as R1 tells it to, would otherwise never see a notice. Each kept directory is printed with its rows once, where it is put back or named as not put back. The list is `--list`'s. Judged against `docs/architecture.md` *Records are committed to the repository*, P9, and `frame/design.md` *Scope* items 4 and 5.

**Decision: the flags.** `--list` with `--apply`, `--released-at` without `--apply`, and `--released-at` with no ref each exit 2 with the usage line `usage: settle [--list | --apply [--released-at <ref>]] [--since <ref>]`. A flag that is read and then ignored would print a list where the person asked for a removal, or run the plugin's default where the person named a ref. `--since` is let through with `--apply`. It changes only the release's list, which `--apply` does not print. Judged against `frame/design.md` *Data & interfaces* *The command*.

**Decision: the wording.** `put back <directory>/`, each row under it as the run with no flag prints it, and a last line `Put back no directory.`, `Put back 1 directory.` or `Put back <n> directories.`. `settle: <directory>/ differs from HEAD, and a kept directory is put back from HEAD: commit or undo its changes first`. ``settle: `seal` is not found on the path, so AgenticSeal's settle cannot run``. `settle: not put back <directory>/: HEAD moved from <commit> to <commit> while seal settle --apply ran`. The cases pin each sentence (contract rule 14).

**No case reaches AgenticSeal's own `seal`.** Every case of `test/settle.test.ts` runs with `PATH` stubbed to the path with each folder that holds a `seal` left out (`WITHOUT_SEAL`). A case of `--apply` puts a stand-in, a shell script in a folder of the system's temporary directory, first on it. A case that refuses a flag therefore cannot reach the plugin's settle even where the refusal breaks. `seal settle --apply` was not run in this phase, against this repository or any other.

**Seen red.** The five cases of scenarios 7 to 10 and of *Scope* item 6 ran before `--apply` stood, and each failed on `settle does not know \`--apply\`` (executed). That red names no guard, so each guard was broken alone with `seal mutate` after commits `932b7da` and `c35d719`, running only the cases that cover it. Each of the 32 runs read `red` (exit 0). Each failing line was read for the guard it breaks (executed). The driver and each run's output are in the scratch directory `1795341002-settle-reads-decisions/phase-2/`. The case of the failed put-back was also seen red before its code, on `settle: git checkout HEAD -- seal/threads/1-a/ failed` in place of the not-put-back line (executed).

| Break | Failing line |
|---|---|
| A kept directory that differs is not refused | `settle.test.ts:381`, the settle ran |
| The probe is `git diff HEAD`, which does not see a file `HEAD` does not hold | `:381`, the variant with `notes.md` ran |
| Only a missing `seal` stops the run | `:381` |
| A missing `seal` is not named | `:413`, the error lacks the sentence |
| A file without the execute bit is found | `:412`, the run went on |
| A folder named `seal` is found | `:412`, the run went on |
| `--apply` does not name the notices | `:325` |
| `--released-at` does not reach the settle | `:326`, the stand-in's arguments |
| The settle runs in `/` and not in the top | `:326`, nothing removed |
| The settle's output is not let through | `:326` |
| The settle's errors are not let through | `:348` |
| A settle that did not start is not named | `:362` |
| A settle that ended on a signal is not named | `:354`, no `SIGKILL` |
| An exit of 3 is passed on as 3 | `:348` |
| `HEAD` moved and the put-back runs | `:394`, exit 1 and not 2 |
| A `HEAD` git cannot read ends the command | `:395`, no not-put-back line |
| `HEAD` moved exits 1 | `:394` |
| `HEAD` moved prints no count | `:398` |
| The checkout is not run | `:331`, ` D seal/threads/1-a/decisions.md` |
| A kept directory the settle left is counted as put back | `:369` |
| The count of none reads as a number | `:349` |
| The count of one reads `directories` | `:330` |
| The exit ignores the settle's | `:348`, exit 0 and not 1 |
| The exit ignores the kept directories | `:333`, exit 0 and not 1 |
| `--released-at` does not take its ref | `:324`, the stand-in never ran |
| `--released-at` with no ref is let through | `:281`, no usage line |
| `--list` with `--apply` is let through | `:281`, no usage line |
| `--released-at` without `--apply` is let through | `:280`, exit 1 and the reading |
| A failed put-back is not counted against the exit | `:410`, exit 1 and not 2 |
| A failed put-back is not named | `:411` |
| A failed put-back ends the put-back | `:411`, `3-c` is not named |
| A failed put-back is counted as put back | `:413`, the count line |

Lines are those of `test/settle.test.ts` at the commit each run measured: `932b7da` for the first 28 rows and `c35d719` for the last four. The case of the failed put-back, added in `c35d719`, sits above the case of a missing `seal`, so `:410` to `:413` in the last four rows are that case's lines.

**Three variants were added after the module stood, in commit `932b7da`.** They are a `seal` whose interpreter does not stand, a folder named `seal`, and a `HEAD` git cannot read. In the same commit the usage case came to read the usage line. Each guard there could otherwise break with the exit unchanged, since every one of those runs exits 2. Their only red is their breaks in the table.

**The phase's boundary run, at `c35d719`.** One command, `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/settle.test.ts` in `apps/desktop`, exited 0: 1 file, 18 cases passed (executed). This phase changed `src/daemon/settle.ts`, `src/daemon/settle-main.ts` and `test/settle.test.ts`. `git grep -l "settle.ts\|daemon/settle"` outside `seal/` names only `scripts/settle.mjs` and `test/settle.test.ts`. No other test file reads a path this phase changed (executed). `test/daemon.test.ts` and `test/role-bundle.test.ts` walk folders, but only temporary ones and `role-bundle/` (read).

**Typecheck.** `tsc` over a project that holds `settle.ts`, `settle-main.ts` and `test/settle.test.ts`, with the package's `tsconfig.json`, exited 0 at `c35d719` (executed). The repository configures no linter and no formatter.
