# Phase 2: 1795329620-role-bundle

## What this phase found

### The frame holds

The frame was read against the tree at `147ed00` before anything was built. Every path and unit `frame/design.md` *Scope* items 11 and 12 and `trail/phases/phase-1.md` *What phase 2 needs* name stands there: the `lookup` closure and `found` of `claudeAdapter`, `claudeEnv`, `Daemon#listen`, `greet`, the two cases that pin the keys of `ready`, `showStatus` in `src/renderer/sidebar.ts` and `daemonNotice` in `src/renderer/view.ts`. Executed: the files were opened at those names. The issue holds one comment, the orchestrator's post of Q1 and Q2, and no reply. Executed: `gh issue view 38 --json body,comments`.

`seal/follow-up.md` does not exist in this repository, so no row waited on this work.

### Decisions made while building

Each was judged against `frame/design.md` *Scope* items 11 and 12 and *Data & interfaces*, which leave the point open.

- **`versionNotice(printed)` is a function of its own, exported beside `MIN_CLAUDE_VERSION`.** It takes what the CLI printed and gives the sentence or null. The comparison is then held by cases that start no process, and the adapter's `notice` holds only the run.
- **What the CLI printed decides, whatever its exit code.** The lookup of the login shell reads what was printed in the same way (`claude.ts`, `lookup`). A CLI that prints its version and exits 1 gets its notice.
- **The `--version` run is bound by the lookup's time,** `lookupTimeoutMs`, 10 seconds where none is given. The frame gives no bound. A CLI that does not answer in that time has printed nothing, and the notice is null.
- **The notice and the sessions share one lookup,** through `located()`, which `start` now calls too. A lookup that found no CLI is asked again by the next call, a session's or a notice's, as it was before. The CLI itself is run anew at each `notice()`, so the answer is the version a session would run now.
- **The daemon keeps the answer of its last ask.** Two hellos while a notice stands start two reads. Where the earlier read answers after the later, its answer is dropped: it was read before the later one began, and the later one may have found the CLI updated. The frame does not name this order.
- **An answer equal to the one the daemon holds is sent to nobody.** *Scope* item 12 says the message goes when the value changes.
- **A hello asks again only where a notice stands at that moment.** A hello that arrives while the first read is still under way asks nothing more.
- **`ready` always carries the key `agentNotice`,** null where there is nothing to say. The two cases that pin the keys of `ready` (`test/daemon.test.ts`, *work items* and *keeping the Mac awake*) now name it.
- **The daemon does not guard against an adapter whose `notice` rejects.** *Data & interfaces* says it does not reject. `gaps.md` *Not done* names it.
- **The window's decision is `statusNotice(own, daemon, agent)` in `view.ts`,** the first of the three that says something. `showStatus` calls it. The window holds the agent's notice as `held.agentNotice`, null before `ready` and against a daemon of an earlier build.
- **Every adapter object of `test/daemon.test.ts` gained a `notice`,** fourteen of them, because the interface now requires one. Eight pass on the notice of a fake adapter they wrap, and six answer null.
- **The changelog fragment has no `### Process changes` table.** The plugin's `docs/layout/the-record-layout.md` *A change writes fragments, never a shared file* asks for one where the diff changes `skills/core/SKILL.md`, an `agents/*.md` file or an orchestration document. The files of that name this work adds stand under `apps/desktop/role-bundle/`. They are what the app ships to a role session, and they change nothing of how this repository's work is run.
- **The version does not move.** `frame/plan.md` *Operational impact* says so: `apps/desktop/package.json` reads `0.0.2` since #30.

### What the build found: a stand-in CLI now runs once more, at the daemon's start

A daemon that finds a CLI now runs it with `--version` when it starts. A test's stand-in CLI that treats every run as a session is therefore run once before the session the case means.

- `test/role-bundle.test.ts`, the phase 1 case of the built daemon's role launch, failed on the first run of this phase. Executed. Its stand-in records its arguments at each run, and the file held `--version` mixed with the session's arguments. The stand-in now answers `--version` with a version and records nothing for that run.
- `test/ask-section.test.ts`: its stand-in writes its process id and sleeps while a file `hang` is there, and the case reads that id as the session's. Read, not run without the change: at the daemon's start the stand-in would have written the id of the version run. It now answers `--version` first.
- `test/role-session.test.ts`: its stand-in copies what the real CLI prints into the stream the case keeps. It now runs the real CLI for `--version` without the copy. Read only. The file runs through `role:run` alone, and this phase ran no real `claude` (`gaps.md`).

The class is every stand-in shell that names a CLI. A shell names one by printing the marked line `__owlery_cli=`, so `git grep -n __owlery_cli -- apps/desktop/test` lists them all: the three files above, the new drive in `test/role-bundle.test.ts`, and `test/claude-adapter.test.ts`, whose cases start no daemon. Executed.

The suite's three fixture shells (`receiver.sh`, `printer.sh`, `basics-shell.sh`) exit at once where they have no terminal, and each says so in a comment. A daemon started with one finds no CLI, and its notice is null. Read. `test/keep-awake.test.ts` starts the app with no `SHELL` of its own, so its daemon asks the person's real login shell and runs the real `claude --version`. This phase did not run that file.

### How each case was seen red

- **Against the tree without the code.** The cases were written first and run at `147ed00` with the source unchanged. Twenty failed: the new ones and the two that pin the keys of `ready`. The daemon's cases failed on their assertions, for example `expected undefined to be 'The fake agent is old.'` for `ready.agentNotice` and `expected +0 to be 1` for the count of asks at the daemon's start. The adapter's and the view's cases failed on a name the old modules do not export (`versionNotice is not a function`, `adapter.notice is not a function`). A failure on a missing name shows no guard, so those cases take their red from the mutants below.
- **`seal mutate`, every mutant red**, each run at the committed tree `af9b5c2`:
  - `src/daemon/adapters/claude.ts`, 15 mutants against the cases of *the notice of an old CLI* in `test/claude-adapter.test.ts`: the minimum moved to 2.1.325, each of the two comparisons made to take an equal number, the test for no version removed, the pattern anchored to the start of the output, the sentence without its last part, without the minimum and with the wrong number as the version found, the option `-v` in place of `--version`, the daemon's whole environment in place of the five names, the time bound removed, the output dropped where the CLI exits with a failure, the failure thrown in place of null, a lookup of its own for each notice, and a failed lookup kept.
  - `src/daemon/adapters/fake.ts`, 1 mutant: the option not given.
  - `src/daemon/daemon.ts`, 8 mutants against the cases of *the agent's notice* in `test/daemon.test.ts`: no read at the start, no read at a hello, a read at every hello, `ready` without the notice, an earlier read's answer kept, an equal answer sent again, the message not sent, and the answer not kept.
  - `src/renderer/view.ts`, 4 mutants against the `statusNotice` cases: the daemon's notice before the window's, the agent's before the daemon's, the agent's left out, and null in place of the empty text.
  - `src/renderer/sidebar.ts`, 1 mutant, and `src/renderer/renderer.ts`, 3 mutants, against the drive of the built app: the status line drawn without the agent's notice, `ready`'s notice not kept, the message's notice not kept, and the line not drawn again at the message. The first failed with `the window never showed the notice of the old CLI`.

`src/shared/protocol.ts` and `src/renderer/shared.ts` changed in types and one initial value alone, and no mutant was run on them.

### The drive of the built app

`test/role-bundle.test.ts`, *the built app's notice of an old CLI*, starts the built app with a stand-in shell that names a stand-in CLI, which prints `2.1.300 (Claude Code)`. It reads the status line three times.

1. After the start the line shows the sentence of *Scope* item 11 with `2.1.300`, drawn as a notice. The sentence reaches the window in `ready` or in the `agentNotice` message, whichever comes first.
2. The stand-in is then held back and its version changed to 2.1.326, and the page is loaded anew. The line shows the old sentence again. The daemon's second read is held at that moment, so the sentence comes from `ready` alone.
3. The stand-in is released. The line shows `Daemon running, no agent`, not drawn as a notice. That change comes from the `agentNotice` message alone.

A held stand-in ends by itself after the lookup's 10 seconds, and the notice then goes as well, so a slow machine does not fail step 3. Step 1 fails where the app's daemon takes longer than `until`'s 15 seconds to answer.

### Q6: what the phase saw of the read at each daemon start

Q6 stays open, and its answer is the broad run's time (`gaps.md`). This phase saw three things.

- Four built-app files ran at `af9b5c2`, one at a time: `ask-section`, `notification-click`, `role-bundle` and `work-item-menu`. All their cases passed. Each starts its app with a stand-in shell that ends at once, so the read costs each start one short process, or two where the shell names a CLI.
- The ten files of the phase boundary took 152.9 seconds, and phase 1's ten took 140.4 seconds. The two sets differ by one file and by 44 cases, so the numbers are no measure of the read.
- The read did unsettle one case, and not through time: the phase 1 case whose stand-in CLI recorded the version run as the session's (*What the build found* above).

The files that start the app with a fixture shell that exits at once see one more short process at each start. `keep-awake.test.ts` alone asks the person's real login shell, which took 2.3 to 3.2 seconds where the framer measured it, in the background.

### Runs and their scope

- The phase boundary set, one command at `af9b5c2` with a clean tree: `node scripts/test-in-electron.mjs` over `claude-adapter`, `fake-adapter`, `daemon`, `view`, `last-look`, `role-bundle`, `role-session`, `ask-section`, `notification-click` and `work-item-menu`. These are the test files the phase changed and the ones that import a module it changed. It exited 0: 9 files passed and 1 skipped, 741 cases passed and 1 skipped, in 152.9 seconds. The skipped file is `role-session.test.ts`.
- The phase's last commit, `dda75fe`, came after that run. It gives three cases of `test/claude-adapter.test.ts` a bound of 20 seconds, because one of them took 2 seconds beside the daemon's cases, and it rewords one comment of `src/renderer/renderer.ts`. `test/claude-adapter.test.ts` and `test/role-bundle.test.ts` were run again on that tree, each alone, and exited 0, with 65 and 11 cases. The other eight files were not run again.
- An earlier run of the four unit files printed `TypeError: this.options.roleAdapter.notice is not a function` as an unhandled error, from one adapter object of `test/daemon.test.ts` that had no `notice` yet. The boundary run printed no unhandled error.
- The six built-app files `daemon-restart`, `keep-awake`, `korean-input`, `memory`, `terminal-basics` and `work-item-form` were not run. They are a row of `gaps.md`.
- The changed files were typechecked through a project file in the scratch directory that extends the app's `tsconfig.json` and lists the changed test files, `src/daemon/main.ts`, `src/main/main.ts`, `src/renderer/renderer.ts` and `src/renderer/sidebar.ts`. It exited 0 at `dda75fe`. The repository names no linter and no formatter.
- `seal unverified .` exits 1 in this worktree on another work item's memo, `seal/threads/1795328774-lightness-is-measured-not-capped/gaps.md:7`, which holds three cells in one row. This work item's memo reads, with 11 open rows.
