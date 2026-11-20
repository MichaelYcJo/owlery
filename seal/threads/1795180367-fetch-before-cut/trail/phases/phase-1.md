# Phase 1: 1795180367-fetch-before-cut

## What this phase found

Every path below is under `apps/desktop/` unless it starts with `seal/` or `frame/`.

**The frame holds.** The coordinates `frame/design.md` *Grounding* gives for `src/daemon/worktrees.ts`, `src/daemon/daemon.ts`, `src/shared/protocol.ts` and `test/worktrees.test.ts` were opened at `e6589a2`, and each names what the frame says it names. `seal/follow-up.md` does not exist, and no `seal/parity.json` is declared.

### Decisions the code needed and the frame left to the build

Each was judged against `frame/design.md` *Scope*, at the item named.

- **How a fetch is ended (items 2 and 8).** `worktrees.ts#askRemote` starts git with `spawn` and `detached: true`, so git leads a process group of its own, and a fetch given up is ended by `SIGTERM` to that group. `frame/plan.md` *Technical context* left the means to the build. A fetch given up settles when git exits and not when its pipe closes, because the transport's process can hold the pipe a moment longer.
- **A fourth sentence of `failure` (item 3).** Item 3 names three sources of `failure`. A fetch the daemon's close ended is a fourth, and it says "the fetch from `<remote>` was ended". No client reads it, since the close ends the clients, but a creation that waited on that fetch goes on with a `kept` result. This is a departure from the frame's list.
- **What the keeper reuses (item 5).** `BaseFetches#fetch` keeps the last result of every base it was asked for, a `kept` one and a local base's `none` among them, and a creation reuses any of them while it is fresh. Item 5 says "the result of a fetch", and `frame/plan.md` *Alternatives considered* rejects a second wait after a remote that did not answer, so a `kept` result is reused. A reused result decides only whether the remote is asked: the cut is at the ref.
- **One guard for a local base (item 4).** `worktrees.ts#fetchRef` alone decides that a local branch asks no remote. `createWorktree` and `BaseFetches#fetch` each held the same comparison in the first commit, and no case could tell either from its absence, so `882335a` removed both.
- **Where `BASE_FRESH_MS` stands.** It is exported from `src/daemon/worktrees.ts`. The frame places `BASE_FETCH_MS` in `src/shared/protocol.ts` and names no place for this one, and no client reads it.
- **A base that is no string (item 6).** The daemon answers a `fetchBase` whose `base` is no string with the error "a fetch names a branch, and `<value>` is none". Item 6 names the folder and the unknown base alone. The creation's handler refuses a base that is no string in the same way.
- **A remote's name with a slash (item 1).** The case of the longest remote's name writes `remote.origin/team.url` with `git config`, and git 2.50.1 fetched from a remote so named.

### What trying taught

- **The stand-in for ssh needs more than 300 ms to start.** With a wait of 300 ms the fetch was given up before the stand-in had recorded its process id, so the case had nothing to watch end. The cases that wait for the stand-in give a fetch 2 seconds. Phase 2's built-app cases should not expect a stand-in to have started in less.
- **A fresh clone's ref has no reflog entry**, so `since` is `null` there, as probe fact 2 says. A ref planted with `git update-ref` has one, so the case of a remote the clone does not have asserts no `since`.
- **A daemon ended without `Daemon#close` leaves its fetch.** `src/daemon/main.ts` calls `close` at `SIGTERM` and at the idle exit. A daemon killed outright ends no fetch, and git then runs until its transport gives up. `gaps.md` names it.
- **The typecheck of the changed files** ran through a `tsconfig.json` in the phase's scratch that extends the project's and lists the six changed files. `tsc --listFilesOnly` printed 18 files of `src/` and `test/` for it, the six and what they import.

### Seen red

`executed`, before any source file was changed, at `e6589a2` with the cases added: `node scripts/test-in-electron.mjs test/worktrees.test.ts test/daemon.test.ts` exited 1 with 13 of the 14 new cases red. Six failed on an assertion or a wait for a message the tree does not send (scenarios 1, 3, 6, 7, 8, 9). Seven failed on `fetchBase is not a function` or `BaseFetches is not a constructor`, which shows only that the unit did not exist. Their assertions were each shown red by a mutant below.

The fourteenth, "asks no remote for a plan" (scenario 10), asserts that something is not asked and was green against the old tree. It was shown red with only its guard removed: a mutant that adds `await fetchBase(repo, "origin/main")` to `planWorktree` failed it at `test/daemon.test.ts:937`, where the refs under `refs/remotes` are compared.

"asks no remote for a local base" (scenario 2) was shown red by the mutant that removes `fetchRef`'s guard for a local branch.

Two assertions were added after the code: the case of `GIT_TERMINAL_PROMPT`, and the last three lines of the daemon's case of scenario 7, where a client's request asks the remote again. Each was shown red by its mutant, `GIT_TERMINAL_PROMPT: "1"` and `{ reuse: true }` in the daemon's handler.

### Mutation

`executed` at `882335a`, each mutant written alone by `seal mutate` and restored by it.

- `src/daemon/worktrees.ts`, 19 mutants, 19 red, against `test/worktrees.test.ts -t "the fetch of a base"`: each of `--no-tags`, `--refmap=` and `--no-write-fetch-head` removed, `detached: false`, the signal sent to git alone, the shortest remote's name taken, the local guard removed, `<=` for the fresh time, a reuse without `reuse`, no join of a fetch under way, no signal from the keeper's close, the last line of git's output for the first, `since` in seconds, `GIT_TERMINAL_PROMPT: "1"`, the sentence of a missing remote changed, the wait multiplied by 100, the fetch removed from `createWorktree`, a creation that does not reuse, and a result that is not kept.
- `src/daemon/daemon.ts`, 8 mutants, 8 red, against `test/daemon.test.ts -t "the fetch of a base"`: the keeper not given to the creation, no `close` of the keeper, `baseFetchMs` not passed, `baseFreshMs` not passed, the handler reusing a result, the check of an absolute folder removed, the sentence of a base that is no string changed, and `now` not passed.
- `src/daemon/worktrees.ts#planWorktree`, the one mutant named under *Seen red*.

`--no-recurse-submodules`, `--no-auto-maintenance` and `--quiet` have no mutant and no case: no temporary repository holds a submodule or enough objects for maintenance to run. They are `read` from the frame's probe.

### The phase boundary

`executed` at `882335a`, exit 0, 6 files and 638 cases: `node scripts/test-in-electron.mjs test/worktrees.test.ts test/daemon.test.ts test/names.test.ts test/last-look.test.ts test/view.test.ts test/repositories.test.ts`, run from `apps/desktop/`. They are the two files the phase changed and the files that import a path it changed and start no app. `test/paths.test.ts`, which imports `test/repositories.ts`, ran apart: exit 0, 36 cases. The cases of the default base, whose remotes are folders that do not exist, are among the 638: a creation's fetch fails at once there and the cut is at the planted commit.

The spawn forbade a start of the app in this phase, so the files that import a changed path and start the built app did not run: `test/notification-click.test.ts`, `test/work-item-form.test.ts`, `test/work-item-menu.test.ts`, `test/terminal-basics.test.ts`, `test/korean-input.test.ts` and `test/memory.test.ts`. `gaps.md` names them.

Scenario 13, `executed` at `882335a`: `git grep -n -e '"fetch"' -- apps/desktop/src` printed one line, of `apps/desktop/src/daemon/worktrees.ts`.

After the runs, `ps` showed no git, no stand-in and no daemon or app process of the phase.

### For phase 2

- `test/repositories.ts` exports `unansweringOrigin`, which makes a clone's `origin` the remote that never answers, and `runs`, which says whether a process id runs.
- The daemon answers `fetchBase` with `baseFetched`, whose fields are `BaseFetch` of `src/shared/protocol.ts`.
- `frame/questions.md` Q1 already stands in `gaps.md` *Not verified*, written in this phase because the daemon's fetch exists from this phase on. `frame/plan.md` gives the row to phase 2, which finds it there.
