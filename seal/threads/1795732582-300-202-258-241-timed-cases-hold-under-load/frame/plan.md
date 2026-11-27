# Implementation Plan: timed cases hold under load (#300, #202, #258, #241)

## Technical context

The tree as read at `a79a6cd747db123f6a9bc3e1553f3e666218480b`.

The work builds on four places, and `frame/design.md` *Grounding* holds the reading of each.

- **The pane's terminal.** `apps/desktop/src/daemon/pty.ts#TerminalSession` wraps `node-pty@1.1.0`, pinned in `apps/desktop/package.json:34` and built for Electron by the package's `postinstall` (`:9`). The root `package.json` lists `node-pty` under `pnpm.onlyBuiltDependencies`. The runner and the packager install with `pnpm install --frozen-lockfile` (`.github/workflows/check.yml:44`, `.github/workflows/package.yml:60`), and the packager rebuilds nothing (`apps/desktop/src/package/package.ts:60-66`), so the build the install made is the one that ships.
- **The fetch.** `apps/desktop/src/daemon/worktrees.ts#askRemote` (`:295`) and the stand-in `apps/desktop/test/repositories.ts#unansweringOrigin` (`:118`).
- **The Claude adapter's stop of a refused launch.** `apps/desktop/src/daemon/adapters/claude.ts:499-521` and `:565-577`, and the helper `launch` of `apps/desktop/test/claude-adapter.test.ts:790`, whose `then` argument is the only place a case can add a command today.
- **The hello.** `apps/desktop/src/daemon/daemon.ts#greet` (`:984`) and the option `readyWaitMs`.

Constraints. The suite runs inside Electron's Node (`apps/desktop/scripts/test-in-electron.mjs`), so the patched source must be the one the Electron build compiles. node-pty loads `build/Release` first and its prebuilt binary last, so an install whose rebuild did not run would load the prebuilt binary, which holds the leak, without an error. *Scope* item 2's case is what says so.

The failure scenario of the chosen approach, in six months. The dependency moves to a node-pty release and the patch no longer applies. pnpm then fails the install and names the patch, and whoever moves the version deletes the patch and its key; *Scope* item 2's case says whether the new version holds the fix. The weaker point is the three-attempt loop of *Scope* items 3 and 4: on a machine where git needs longer than the last wait to start a process, the case fails as it does today, only later.

`pr.md` owes one sentence for #300's second *Done when* line. Three passes of the group beside another run are not the measure, because the group failed on the count of pseudo-terminals the machine had left and not on time. The measure is the worker's count of open `/dev/ptmx` descriptors through one whole run of `daemon.test.ts` (phase 1).

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| **#300: patch `node-pty@1.1.0` so `pty_posix_spawn` closes what it opened** | A later version bump meets a patch that does not apply, and the install fails until the patch is removed. | **Chosen.** It removes the cause for the suite and for the app's daemon at once, in the lines upstream itself changed (`frame/design.md` *Grounding*, the leak's source). |
| #300: move to `node-pty@1.2.0-beta.18`, which holds the fix | A prerelease ships in the first public build two days after it is taken; whatever else changed between 1.1.0 and the eighteenth beta reaches every pane unread. | Rejected for 0.1.0. The move belongs to the release that follows node-pty's 1.2.0. |
| #300: keep the dependency as it is, and close the spare descriptor from `TerminalSession` by its number, one below the one node-pty reports | The number is a guess. Another thread opens a descriptor between the two opens, and the daemon closes a file that is not the spare one. | Rejected. node-pty exposes no handle to it. |
| #300: leave the product, and keep the suite under the limit: split `daemon.test.ts`, or close the worker's leaked descriptors after each case | Files of the unit project run side by side, so their counts add up as before. The app's daemon still keeps one pseudo-terminal for each pane it ever started, and a Mac whose daemon has started about 450 panes can open no terminal in any app. | Rejected. It replaces nothing and hides the cause from the next reader. The premise that would keep the structure, that the leak costs the product nothing, is false: `docs/architecture.md` *What a session survives* keeps the daemon alive through app updates and window closes. |
| #300: a longer give-up for `until` and `launches` | At the limit a pane never starts, so the wait runs out whatever its length. | Rejected. It is the fix the issue's first *Done when* line assumes, and the cause is not time. |
| **#202: run the fetch again with a longer wait where the stand-in recorded no start** | A machine too slow for the last wait fails the case as today. | **Chosen.** The wait is the case's own input, and the attempt that started the transport asserts everything the case asserts today. No fake timer is used anywhere in the suite (executed: `grep -c useFakeTimers apps/desktop/test/*.ts`, every file 0), and the daemon's case runs its timer inside a daemon whose own waits a fake clock would also move. |
| #202: one longer wait, such as 10 seconds | Every run of the case then takes that long, and the bound is still a guess about load. | Rejected: it costs time on every run to move a guess. |
| #202: assert the stand-in's end only where one started (`started().length <= 1`) | In a run where git never starts its transport the case passes and has checked nothing of the process it guards. | Rejected: it asserts less. |
| **#258: the stand-in writes its error text before its first line** | A later edit of the helper moves the text after the lines again, and the race returns. The helper's comment says why the order matters. | **Chosen.** The text is then in the pipe before the adapter can read the line that makes it stop the CLI, and the case asserts the same events. |
| #258: the adapter waits for the stream's end before `exit` | It already does, at `close`, and gives up after 300 ms only where a child holds the stream. Waiting longer would hold every stopped session's exit behind whatever the CLI left running. | Rejected: the cause is not in the adapter. |
| #258: drop `errorOutput` from the expected event | A refused launch whose exit lost the CLI's error text would pass. | Rejected: it asserts less. |
| **#241 row 2: the inbox cases set `readyWaitMs`** | A read slower than 5 seconds sends the extra inbox again. | **Chosen.** The hello then waits for the read itself, as the file's own count cases do. |
| #241 row 2: change the default in the test file's `daemon()` helper | Cases that slow git on purpose (`watchedGit` with seconds, `heldGit`) and expect `ready` within the default would wait for the slowed read. | Rejected: wider than the row. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1, 2 and 9 of `frame/design.md` | The new case of `pty.test.ts` is seen red with the `patchedDependencies` key removed and the dependency installed again, on the line that names the descriptors left, and green with the patch. One whole run of `test/daemon.test.ts` through the machine's lock, with `lsof -nP /dev/ptmx` sampled every few seconds: the worker's count does not grow with the cases run. `node -e` under the built Electron loads the patched module from `build/Release` (the path `require.resolve` and the module's own loader give). | fcc61a68 |
| 2 | *Scope* items 3 to 8 of `frame/design.md` | Each changed case passes alone. `seal mutate` shows the three mutations *User scenarios & acceptance* names fail their cases. The slowed `git` and the slowed `readCommits` show the old forms fail and the new hold, from a copy of the old file named `test_tmp_*` that is removed afterwards. Three runs beside eight `yes` loops, through the lock, of: the account-change group, the changed cases, `claude-adapter.test.ts` whole and the case of `settle.test.ts`; #258's case thirty times in those conditions. The times go into the phase record against each bound. | e8bf4384 |

## Overlap with the release

The spawn names no other open work item. `routing.md` names #132, #257 and #127 as the items this one lands before, and #133 is the last item of release 0.0.5, in its broad gate while this frame was written. Their branches were read by their diffs against this branch's base (executed: `git diff --stat` and `git diff -U0` of each `origin/` branch for the files this work changes); their frames were not opened.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #127 (`origin/feat/127-…`, `5a23fbb5`) | `apps/desktop/test/claude-adapter.test.ts`, `describe("the Claude adapter's role launch")`: #127 changes the helper `run` and the cases around `:897-906`; this work changes the helper `launch` and the `it.each` at `:912`. Both change `daemon.test.ts` in different `describe` blocks. | #300 | `routing.md` puts this work first among the 0.1.0 items, and its diff in that file is the smaller one, so #127 meets it in a merge it makes anyway. |
| #132 (`3d77c03d`), #257 (`128ff100`), #133 (`ac2d58ee`) | `apps/desktop/test/daemon.test.ts`, each in other `describe` blocks than this work's (`the fetch of a base`, `the inbox`, `a Claude Code pane and the owl chain`). None changes `package.json`, `pnpm-lock.yaml`, `pty.test.ts`, `worktrees.test.ts` or `test/repositories.ts`. | #133, then #300 | #133 closes release 0.0.5, which this branch merges before its own gate. Every later item's whole run of `daemon.test.ts` reads the fact this work changes, the count of pseudo-terminals a run keeps, so each gains from merging after it. |

## Operational impact

- The root `package.json` gains `pnpm.patchedDependencies`, the tree gains `patches/`, and `pnpm-lock.yaml` changes. Every checkout and worktree needs `pnpm install` once after the merge, which builds node-pty again; until then it runs the leaking build.
- The packaged app's `node-pty` binary changes. The package's own check of that binary (`package.ts:307`) runs as before.
- No migration, no environment variable, no new dependency. This pull request moves no version.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-27 | The frame's patch of `node-pty@1.1.0` through pnpm `patchedDependencies` is built, in release 0.1.0, though it changes a product dependency and the routing named test cases. | The leak is the shipped daemon's as much as the suite's: every pane that ends keeps a pseudo-terminal open in the daemon, and macOS has 511 for the whole machine, so a daemon that runs for days stops opening panes. The patch is the smallest change that closes both descriptors the source leaves open, and a prerelease would ship in the first public build. | `frame/design.md` *Scope*; `frame/plan.md` *Alternatives considered*; `routing.md` *Why this way* |
| 2026-11-27 | The crafter runs `daemon.test.ts` whole once in phase 1, through the machine's lock, for the count of `/dev/ptmx` the plan's verification asks; every other run of that file keeps `-t`. | The lock makes the run the only test run on the machine, and the count cannot be read from a filtered run. | `frame/plan.md` *Phases*, phase 1 |
| 2026-11-27 | Round 1's finding 1 is fixed by extending the patch: `PtyFork` closes `master` where the spawn failed, with a case in `pty.test.ts`, and *Scope* item 1 names `PtyFork` beside `pty_posix_spawn`. | A failed start (a spawn helper that cannot run, the user's process limit) leaves one master open per try in the shipped daemon; the change is one line where the later source has it, and keeping the leak would leave a row in `gaps.md` for a release a stranger downloads. | `trail/rounds/round-1.md` finding 1; `frame/design.md` *Scope* item 1 |
| 2026-11-27 | The pull request's title takes the prefix `test:`, and it closes #300, #202, #258 and #241. | Three of the four issues are titled `test:` and the work changes test cases in each. The patch of node-pty fixes a leak of the shipped daemon, which a `fix:` would name, but the issue that found it (#300) is a test failure, and the pull request is named by the four issues it closes. | the plugin's `skills/commit-pr-convention/SKILL.md` |
