# Phase 1: 1795653550-150-the-persons-word-is-committed-in-time-and-retried

## What this phase found

**The frame holds for this phase.** Each coordinate of `frame/plan.md` *Technical context* that phase 1 builds on was opened at `b1788edd` before the first edit: `worktrees.ts#gitIn`, `#commitPaths`, `#askRemote`, and the `git` helper and the commit of `records-place.ts#setUpRecords`. Each stands where the frame says, within a few lines.

**Scenario D is not planted as a case.** Its case, a `pre-commit` hook that reads its input to the end, passed against the tree as it stood before this phase (`executed`: the run of the new cases against `b1788edd`, where it was the one case of seven that passed). It also passed with the runner's `stdin` turned back into a pipe (`executed`: `seal mutate` of `stdio: ["ignore", ...]` to `["pipe", ...]`). Under that mutant only the case of a pipe held outside the group failed, on its `runs(held)` line, which names nothing about input. Git gives a hook no input of its own, so a hook reads the end of its input whatever git is given. A case that passes both ways pins nothing (contract rule 15), so `91e63a3e` removed it. The runner still starts git with no input, as *Scope* item 1 asks. `gaps.md` carries that line as not pinned by any case, and names the dropped case. Judged against contract rule 15 and `skills/implement/SKILL.md` *2. Implement test-first, and let each rule name its test*.

**A commit of the setup that was made before it was ended stands.** *Scope* item 4 gives the setup's failure path "as after any failure". Taken as written, a `post-commit` hook that never ends would have the setup commit its files and then remove them from the checkout, which leaves the files deleted on disk against the commit that holds them. The setup therefore asks `git diff --cached --quiet` after an ended `git commit`, as `commitPaths` does under *Scope* item 2, and stands where the index holds each path as the commit does. The case "keeps a setup's commit that was made before it was ended" in `describe("the records place")` pins it. Judged against *Scope* item 2's own heading, "A commit that was made before it was ended stands", and `docs/architecture.md` *Records are committed to the repository*.

**A commit ended by the caller's signal is kept where it was made, as one ended at the limit is.** *Scope* item 2 names the ended `git commit` without saying which ending, and item 3 has the signal end it "as at the limit". The check of item 2 runs for both endings.

**An ended git is over once it has exited and the SIGKILL was sent, even where its pipe is still open.** *Scope* item 1 is silent on a process that leaves git's group, such as one in a session of its own that holds git's stderr. `askRemote`'s comments in the same file name that case for a fetch. Without this rule the runner would wait on the pipe without end. The case "ends a commit whose pipe a process in a session of its own holds open" pins it.

**The limit of a `git add` has a case of its own.** Scenario A names a hook alone, and a hook runs only under `git commit`. The `git add` that *Scope* item 1 puts under the limit runs a clean filter. The cases of scenario A and scenario F each hold a second repository whose clean filter never ends, and each throws "git add did not end in 2 seconds and was ended".

**The cases give a limit of two seconds, where scenario A says "a few hundred milliseconds".** The cases first gave 500 ms. In the first run of the phase boundary, at `91e63a3e` with other agents' suites on the same machine, both new cases of the setup failed on `expect(started()).toHaveLength(1)` (`executed`): the limit passed before git reached the hook, so the case could not tell an ended hook from an ended git. The same cases had passed in each run of the two files alone. `56b7270d` gives both files a limit of 2000 ms, and a case of scenario B then takes about four of the 20 seconds the suite allows a case.

**Decisions settled while writing the code.**

- The runner is `worktrees.ts#commitRunner(bounds)`. It gives a function that runs one git at a time. The limit is counted from the call that makes the runner, so the `git add` and the `git commit` of one commit share it. `commitPaths` makes the runner after `whyNoCommit`, so the commands that only read are outside the limit, as *Scope* item 1 and `frame/plan.md` *Technical context* say. No case pins that the two commands share one limit: a case would have to time a slow filter against a hook, which a loaded machine makes flaky. `gaps.md` carries it.
- A git whose turn comes after the limit is started, and its timer ends it at once. No separate path refuses to start it, since the outcome is the same and the second path would be a line no case can tell apart from the first.
- A git that the caller's signal fired before is not started, and the runner gives "the commit was ended". In `commitPaths` that comes after `whyNoCommit` and before the `git add`, and the paths are then unstaged as after any failure, as *Scope* item 3 says the command is ended "as at the limit".
- Where git fails and prints nothing, the sentence is "git add failed" or "git commit failed", as `setUpRecords` already said. Before, `commitPaths` said `execFile`'s "Command failed: ..." there.
- What a git under the runner prints is kept up to 64 KiB for each stream, `COMMIT_PRINTED_CHARS`, so a hook that prints without end does not grow the daemon's memory for five minutes.

**Seen red.** Each new case was first run against `b1788edd`: the six cases of scenarios A, B, C, E and F, with the setup's post-commit case, timed out at 20 seconds there (`executed`). Then each guard was broken alone with `seal mutate` at `d39bf015`, where the cases still gave 500 ms (`executed`, every verdict `red`). Each break of `worktrees.ts` ran the cases of `describe("committing files of a worktree")` with `--bail=1`, and each break of `records-place.ts` the two new cases of the setup. A batch of breaks prints the verdict alone, so the third column is the case each break was aimed at, and which case failed was read only for the break of the runner's `stdin` below (`read`).

| File | Break | Case aimed at |
|---|---|---|
| `worktrees.ts` | the limit's timer ends nothing | scenario A, by its time-out |
| `worktrees.ts` | no SIGTERM | scenario A, which then took the grace |
| `worktrees.ts` | no SIGKILL | scenario B |
| `worktrees.ts` | git not a group leader | scenario A, by its time-out |
| `worktrees.ts` | the caller's signal ends nothing | scenario E, by its time-out |
| `worktrees.ts` | a signal fired before the start does not stop the start | scenario E's second part |
| `worktrees.ts` | an ended git whose pipe stays open is not over at the SIGKILL | the case of a pipe held outside the group |
| `worktrees.ts` | an ended commit that was made is refused | scenario C |
| `worktrees.ts` | the sentence of the limit reworded | scenario A |
| `worktrees.ts` | an ended `git add` is not read as ended | scenario A's clean filter |
| `worktrees.ts` | `commitPaths` hands the runner no bounds | scenario A, by its time-out |
| `records-place.ts` | the setup's runner takes no limit | scenario F, by its time-out |
| `records-place.ts` | an ended `git add` of the setup is not read as ended | scenario F's clean filter |
| `records-place.ts` | an ended setup commit that was made is refused | the setup's post-commit case |

The break of the runner's `stdin` is the row of scenario D above.

**The phase boundary.** The spawn named the *Verified by* cell's command, `test/worktrees.test.ts test/records-place.test.ts`. `skills/verify/SKILL.md` *Scope: cheap and often, broad and once* also asks for each test file that reads a changed path. Read as the files whose cases run `commitPaths` or `setUpRecords`, directly or through the daemon, that adds `test/pr-check.test.ts`, `test/chain.test.ts`, `test/chain-command.test.ts` and `test/daemon.test.ts`. All six ran in one command. The files that import `records-place.ts` for its `MARKER` alone, and the files that start the built app, did not run. No test file that reads the whole tree was found by a search of `test/` for `ls-files` and for reads of `src/`, which is a sample.

**For phase 2.** `commitRunner` gives `ended` as "the commit was ended" for the signal, and `commitPaths` throws that sentence. `stage-records.ts#commitRecords` does not yet take the bounds. `Daemon#commitWord` and the setup's request in `Daemon` still call with no bounds, so each has the five-minute limit and no signal. `COMMIT_END_GRACE_MS` is exported for the close's wait.
