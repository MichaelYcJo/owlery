# Phase 1: 1795701355-257-a-store-it-cannot-read-is-kept

## What this phase found

**The frame holds for this phase.** The branch merged `origin/release/v0.0.5` at `c80b900a` before the build (`86c1fa18`). `apps/desktop/src/daemon/repositories.ts`, `whole-file.ts` and `apps/desktop/test/repositories.test.ts` are the same at that merge as at `5370d534` (executed: `git diff --quiet 5370d534 HEAD -- …`, exit 0), so every coordinate of *Scope* items 1 to 4 and of the *Removes* rows this phase meets stood where `frame/design.md` *Grounding* reads it. Q1 and Q2 stand on their defaults, and neither reaches this phase.

**The merge moved two coordinates phase 2 reads.** #290 (`8a19d3e2`) changed the window's files. At `86c1fa18`, `showStatus` stands at `apps/desktop/src/renderer/sidebar.ts:88-89`, where `frame/plan.md` *Technical context* reads `:85-89`, and the `statusNotice` cases open at `apps/desktop/test/view.test.ts:3507`, where `frame/design.md` *Removes* reads `:3505-3523`. `statusNotice` still stands at `view.ts:920` with three arguments, `held.agentNotice` at `renderer/shared.ts:25`, and the comment at `daemon.ts:1020` still says "lost or read as no repository" (read, at `86c1fa18`).

**The refusal reuses the guard that stood.** `readJson` gives `null` for a file the store cannot open, a folder, a text that is no JSON and the text `null`. That value is neither a store nor a list, so the existing test at the constructor's early `return` already refuses it. The set-aside goes in that branch alone, as `frame/plan.md` *Technical context* places it, and no second branch was written for `null`. Judged against `frame/design.md` *Scope* item 1.

**A name counts as taken where anything stands at it, a dangling link among them.** `keptPath` tests each name with `lstatSync(path, { throwIfNoEntry: false })`. `existsSync` follows a symbolic link, so it reads a link whose target is gone as no file, and the rename would then replace the link. Judged against `frame/design.md` *Scope* item 2, "so no file kept earlier is replaced".

**Every failure of the set-aside falls back to memory alone.** `keepAside` wraps the name's search and the rename in one `try`. A rename refused, an `lstat` refused by the folder's permissions, and a `now()` that gives no valid date (where `toISOString` throws) all leave the file as it stands, set the store's `file` to `undefined` and answer `keptAs: null`. Judged against `frame/design.md` *Scope* item 3: where the store cannot keep the file aside, nothing writes over it.

**The kept file is proved to be the refused one by its inode.** For each kind of refused file, the case compares the kept path's inode and mode with the ones the refused path had before the store started. For each kind that is a file, it also reads the kept bytes after the first change, and for the file of mode `000` it first sets the mode to `0600`. A folder has no bytes to compare, so its inode and mode are the proof.

**Three test texts stated the old refusal, and were reworded.** The frame listed the class with `git grep -n "read as no repository" -- apps/desktop/src` (`frame/design.md` *Scope* item 7). The same search over `apps/desktop/test` printed two comments and one case name in `repositories.test.ts`. Each now says that the file is refused and that the store starts with no repository: the comment under the chain case, the case name "keeps a work item's pull request: … and refuses a file whose pull request is none", and the comment under the pane-chain case. No assertion changed. This goes beyond the frame's class, which named `apps/desktop/src` alone. Judged against contract rule 19.

**The *Removes* row of this phase landed as the frame states it.** `throws where the rename fails, and removes the partial file it wrote` now makes the folder after the store has started. The store reads no file, and the write's rename meets the folder. The second half, the pin that a folder at `repositories.json` is read as no repository and left where it stands, is gone. The case `keeps aside a folder …` pins what replaced it.

**Seen red against `5370d534`.** The source of the store at `86c1fa18` is the same as at `5370d534`, so the new cases ran against it before any source change (executed: `node scripts/test-in-electron.mjs test/repositories.test.ts` in `apps/desktop`, 8 failed and 35 passed). Each case failed on the line of the behaviour it names:

- `keeps aside %s …`, each of its five kinds (`repositories.test.ts:506`): red at `:516`, `lstat` of `repositories-unread-20261126T123005Z.json` refused with `ENOENT`.
- `keeps a refused file under the next number …` (`:529`): red at `:536`, the read of the `-2` path refused with `ENOENT`.
- `leaves a refused file it cannot move …` (`:549`): red at `:557`, the first change threw `EACCES` on the partial file in the folder of mode `0500`.
- `answers that it kept nothing aside …` (`:566`): red against `5370d534` with a `TypeError` on `setAside`, which names no guard. So it was shown red with only its guard broken, by `seal mutate` refusing a list of no repository (the mutant below that adds `repositories.length === 0`). It failed at `:571`, `[]` answered `{ refused, keptAs }` where it expects `null` (executed).

**Mutation, each unit that adds behaviour (executed).** One `seal mutate src/daemon/repositories.ts` call in `apps/desktop`, with `--tests "node scripts/test-in-electron.mjs test/repositories.test.ts --bail=1 -t \"keeps aside|next number|cannot move|kept nothing aside\""`. The baseline passed, and each of 11 mutants was red:

1. The refusal's branch returns without `keepAside`.
2. The stamp keeps its `-` and `:`.
3. The name's search takes the first name whatever stands there.
4. A failed rename keeps the store's `file`.
5. `keptAs` is set before the rename.
6. `setAside()` answers `null`.
7. A list of no repository is refused.
8. The answer starts as a set-aside, not as `null`.
9. The kept file's sentence leaves out its path.
10. The sentence of a file the store could not move leaves out "aside".
11. The number joins the name with `_` in place of `-`.

**The typecheck was drawn over the two changed files.** The repository configures no linter or formatter. `tsc --noEmit` with the options of `apps/desktop/tsconfig.json`, given `src/daemon/repositories.ts` and `test/repositories.test.ts`, checked both and every module they import, and printed nothing (executed, exit 0). The typecheck of the package is the broad gate's.

**The phase boundary run, and the one case that timed out.** `repositories.test.ts` is the only test file that loads `src/daemon/repositories.ts` itself; `test/repositories.ts` imports a type from it alone. `daemon.test.ts` and `chain.test.ts` load it through `daemon.ts` and write `repositories.json` before a daemon starts, so they joined the set, at three files a command. The repository holds no test file that reads the whole tree. The command was `node scripts/test-in-electron.mjs test/repositories.test.ts test/daemon.test.ts test/chain.test.ts` in `apps/desktop`, at `a1e6a960` (executed): 620 passed and 1 failed. The failed case is `chain.test.ts:3500`, `stops the chain where the stage fails, … and gh that never ends`, which timed out at 60 seconds. It writes no `repositories.json`. The Mac's load average stood at 56 at the end of the run. The case alone at `8b9ecaba`, run with the store's cases, timed out the same way while those 43 passed. The same case alone at `86c1fa18`, the merge before any change of this work, timed out the same way under a load average of 37 (executed, in a worktree under the crafter's scratch directory, since removed). So it is labelled failing on base too, and this phase does not chase it.
