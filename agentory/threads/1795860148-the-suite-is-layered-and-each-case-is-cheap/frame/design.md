# Design: 1795860148-the-suite-is-layered-and-each-case-is-cheap

Issue #200. One whole verification of the desktop app takes 13 minutes on the owner's Mac and 14 minutes on GitHub's runner, and one test file takes 391 s of it there. The owner set on 2026-11-28 that this is a design failure and not slow cases to tune. This design states where the time goes, as measured, and what the suite becomes: layers, one world per file, a budget that a run reports against, fewer whole runs per work item, and a `check` that runs no suite for a change the suite does not read.

## Grounding

The tree as read at `928c7233`. `<scratch>` is `/private/tmp/claude-501/-Users-yc-Documents-GitHub-owlery/74f0a312-3b8c-4449-8ec0-7ef88f3a07cf/scratchpad`, and `<probe>` is `<scratch>/1795860148-the-suite-is-layered-and-each-case-is-cheap/frame`. Each probe ran in `<probe>/clone`, a `git clone --no-local` of the worktree at that commit, with nothing else running on the machine (load average 3 to 4).

### Where the time goes

| Fact | Label | Coordinate |
|---|---|---|
| On the runner, run 46122967493, `pnpm -r run check` took 826 s, the install 11 s and `tsc` about 10 s. vitest's wall time was 813 s. The files of the `unit` project sum to 1,056 s and those of the `app` project to 279 s, so the runner ran about two unit files at once and then the app files one at a time | read | `<scratch>/200/ci-measure-1.md`, `<scratch>/200/ci.txt` lines 226 to 230 and 1162 to 1165 |
| On the owner's Mac, alone, the whole suite took 789 s on 2026-11-28: the `unit` project 577 s, of which `chain.test.ts` ran for 575 s, and the `app` project 211 s. The files' times sum to 1,891 s. The run left no process and no temporary folder | read | `<scratch>/200/local-run.json`, `<scratch>/200/local-run-meta.txt`; `ls -ldT "$TMPDIR"owlery-*` holds no folder of 19:08 to 19:21 (executed) |
| 37 of the 60 unit files take under 1 s each and 4.2 s together. The time is in the files that start git | read | `<scratch>/200/local-run.json` |
| One world of `standing()` with one work item costs 525 ms and 38 git processes. A copy of that world with `cpSync` costs 15 ms and no process. One whole chain on the fake adapter, six stages, costs 3,620 ms and about 205 git processes. A `Daemon` that starts, answers `ready` and closes with no work item costs 22 ms and no git process, and one that starts on a standing world with one work item costs 300 ms and 22 git processes | executed | `<probe>/test_tmp_world.test.ts`, `<probe>/world.json`; `<probe>/test_tmp_real_git.test.ts`, `<probe>/real-git.json` |
| So an end-to-end case of `chain.test.ts` spends about one eighth of its time building its world and the rest in the git processes the daemon's own chain starts. The 116 end-to-end cases of that file average 4.7 to 6.5 s in the run | executed and read | the row above; `<scratch>/200/local-run.json` |
| On this Mac `git` is `/usr/bin/git`, Apple's shim. It takes 15.2 ms to start, and the binary it runs, the one `xcrun -f git` prints, takes 4.7 ms. With that binary's folder first on `PATH`, the same world costs 249 ms and the same chain 1,890 ms | executed | `<probe>/test_tmp_git_micro.py`; the timing loop of `/usr/bin/git --version` against `$(xcrun -f git) --version`; `<probe>/real-git.json` |
| The runner's git is `/opt/homebrew/bin/git`, no shim. `chain.test.ts` took 391 s there for the same 116 cases, which is about 14 ms for each git process if a case starts 243 | read, and the 14 ms is an estimate | `<scratch>/200/ci.txt` lines 54 to 57 |
| An empty `GIT_TEMPLATE_DIR` and `maintenance.auto=false` change little here: `git init` 21.0 ms against 20.5 ms, and one `git add` with one `git commit` 42.7 ms against 36.4 ms. `identify()` starts `git config` three times for each repository, about 45 ms through the shim | executed, read | `<probe>/test_tmp_git_micro.py`; `apps/desktop/test/repositories.ts#identify` |
| The fixed waits sum to 3.95 s in `chain.test.ts`, as the issue says | executed | `grep -n "setTimeout(r\(esolve\)\?, [0-9_]*)" apps/desktop/test/chain.test.ts` |
| `daemon.test.ts` holds 440 cases at a median of 0.71 s, and its 44 slowest hold 111 s of 380 s. Its time is spread over the cases that build a repository and a worktree each, and no few cases hold it | read | `<scratch>/200/local-run.json` |
| `pr-check.test.ts` averages 7.2 s a case and `chain-command.test.ts` 4.8 s. Each builds a world and runs a chain before the check or the command it tests. One run of `chain_check.py` on a branch with one commit starts 20 git processes, 4 of them a command it already ran, and takes 509 ms | read, executed | `<scratch>/200/local-run.json`; the run of `chain_check.py --baseline origin/main` in `<probe>/clone` under `GIT_TRACE2_EVENT` |
| The `app` project's 258 cases sum to 178 s. 18 cases over 2 s hold 106 s, and the longest, 21 s, measures a 15-second bound of the app on purpose | read | `<scratch>/200/local-run.json` |

### What the tree holds

| Fact | Label | Coordinate |
|---|---|---|
| node-pty 1.1.0 is built on N-API, and the build installed here starts a pty under the system's Node 22.14.0. The launcher's comment says it cannot load there | executed, read | `node -e "require('node-pty').spawn('/bin/echo', …)"` in `<probe>/clone/apps/desktop`; `apps/desktop/scripts/test-in-electron.mjs` lines 1 and 2 |
| vitest's own start, its transform and its imports, took 0.5 s of a 24.4 s run of one file in Electron's Node | executed | `<probe>/world-run-2.txt`, its `Duration` line |
| vitest 4.1.12 takes `maxWorkers`, `setupFiles`, `alias`, `testTimeout` and `fileParallelism` for each project, takes `reporters` at the root alone, and hands a reporter each file's project and duration at `onTestRunEnd` | read | `apps/desktop/node_modules/vitest/dist/chunks/reporters.d.DtoKVV2s.d.ts` lines 1061, 2626 and 3572 |
| The suite reads four documents of the repository itself. `themes.test.ts` reads `docs/design.md` and `docs/design.ko.md`, and `records-place.test.ts` reads `agentory/config.json` and `agentory/README.md`. So the issue's sentence that a change to `docs/` or `agentory/` is one the suite does not read is false for these four | executed, read | `grep -rn '"\.\.", "\.\.", "\.\."' apps/desktop/test`; `apps/desktop/test/themes.test.ts` lines 22 and 466, `apps/desktop/test/records-place.test.ts` lines 227 to 231 |
| No ruleset and no branch protection of the repository requires a status check on 2026-11-28. Both rulesets hold one rule each, the merge method | executed | `gh api repos/MichaelYcJo/owlery/rulesets/27686857`, `…/27686858`, and `…/branches/main/protection` |
| The documents' leg stands only inside the `Broad gate` string of `agentory/config.json`, after `pnpm -r run check`. `check.yml` runs no part of it | read | `agentory/config.json` line 5, `.github/workflows/check.yml` |
| `rerun-unstarted.mjs` decides on each job by its steps, its runner and its annotations, and names no job | read | `.github/scripts/rerun-unstarted.mjs` lines 1 to 20 |
| 106 `check:` lines of `docs/` name `chain.test.ts` or `daemon.test.ts`, 53 in each language. Every target of every `check:` line of `docs/` is a file that stands | executed | `git grep -c -P '^\s*check: .*\b(chain\|daemon)\.test\.ts' -- docs`; `git grep -h -o -P '^\s*check: \K.*' -- 'docs/*.md' \| tr ' ' '\n' \| LC_ALL=C sort -u \| xargs ls`, exit 0, and exit 1 with a path that does not stand |
| The name `vitest.config.ts` stands on one line of the tree outside the file itself | executed | `git grep -n -F 'vitest.config' -- . ':!agentory/threads/1795860148-the-suite-is-layered-and-each-case-is-cheap'` prints `apps/desktop/measurements/built-app-launch.md:3` alone |
| The daemon of process 41144 is the owner's own app. Its environment holds `npm_lifecycle_event=start` and an `OWLERY_RUN_DIR` under `~/Library/Application Support`, and a test's app has a run folder under the system's temporary folder | executed, read | `ps eww -p 41144`; `apps/desktop/test/built-app.ts#BuiltApp.start` |
| A run that ends leaves no app and no daemon: each built-app file stops both by process id. A run that is killed leaves them, and such a daemon stays while one of its panes lives. The vitest runner and each of its workers are themselves processes named Electron, and the worker of `chain.test.ts` lives for the file's ten minutes. That is the likeliest reading of the Electron process the settle saw for 11 minutes on 2026-11-28, which nobody can open again | read | `apps/desktop/test/built-app.ts#BuiltApp.end`, `apps/desktop/src/daemon/daemon.ts#checkIdle`; `ps -axo etime,command` during the local run |

### Policy

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Measure before building*, its last bullet | It is the only rule on how tests run: an agent runs every built-app file at each phase's and each fix pass's end, and the gate runs them again. This work rewrites it (*Scope* item 14) |
| `docs/architecture.md` *Code runs the order, the orchestrator judges*, the paragraph on the broad gate | Only the exit of the `Broad gate` command, run by Owlery's code, counts. So a change that may skip the suite is decided inside that command (*Scope* item 11) |
| `docs/roadmap.md` *Releases and the tracker*, the bullet on a case that fails under load | A timing read under load is no cause until a run shows it. So the budget reports and blocks nothing (*Alternatives considered* in `frame/plan.md`) |
| `docs/architecture.md` *Where Owlery started* and `pr-check/README.md` *Where the files come from* | Owlery follows no release of AgenticSeal. A change to `pr-check/` is Owlery's own (*Scope* item 9) |
| The plugin's `skills/verify/SKILL.md` *Scope: cheap and often, broad and once*, as AgenticSeal#1659 left it in 0.41.0 | A phase boundary runs the files the phase changed and the files that read what it changed, under each suite's own command. *Scope* item 13 states what that is here |
| The plugin's `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes* | This work item's subject includes the policy root's text: the issue's *Done when: the guidance* is a document, and the `check:` lines follow the files this work splits. So it edits `docs/` in its pull request, as #322's work item did |
| `gh issue view 200 --json comments` | The issue has no comment on 2026-11-28 (executed) |

## Scope

### In

1. **Each test file names its layer on its first line, and a guard holds it.** The line is `// layer: logic`, `// layer: process`, `// layer: pty` or `// layer: app`. The suite's configuration puts the file in the project of that name and stops the run, naming the file, where a `.test.ts` file under `apps/desktop/test/` has no such first line. *Data & interfaces* gives what each layer may do, where it runs and its guard.
2. **The configuration is `apps/desktop/vitest.config.mts`.** `apps/desktop/vitest.config.ts` goes. `apps/desktop/package.json` gets no `"type"` key. The sentence of `apps/desktop/measurements/built-app-launch.md` line 3 that names the old file and the import it read names the new file and the layer line.
3. **Every run reports its times against the budget.** A reporter of the suite prints, after a run, each layer's file count, the sum and the longest file, and one line for each file past its layer's file budget. It writes the same as JSON to the file `OWLERY_TEST_TIMES` names, and on GitHub it writes the table to the step summary and one warning annotation for each such file. It never changes the run's exit.
4. **The launcher puts the real git first.** On macOS, where the `git` on `PATH` is `/usr/bin/git`, `apps/desktop/scripts/test-in-electron.mjs` puts the folder of the binary `xcrun -f git` prints first on the `PATH` it gives vitest.
5. **The suite's git reads no person's configuration, and a repository's identity costs no process.** The launcher gives vitest `GIT_CONFIG_GLOBAL`, a file it writes for the run with the identity, `commit.gpgsign=false`, `init.defaultBranch=main`, `maintenance.auto=false` and `gc.auto=0`, `GIT_CONFIG_NOSYSTEM=1`, and `GIT_TEMPLATE_DIR`, an empty folder. `apps/desktop/test/repositories.ts#identify` writes its three keys into the repository's `config` file itself, because a case that hands a command an environment of its own still needs them there.
6. **A file builds each world once and a case takes a copy.** A helper, `apps/desktop/test/worlds.ts`, builds a world in a `beforeAll`, copies it for a case with no process started, and removes it in an `afterAll`. *Data & interfaces* gives its shape.
7. **The chain's cases stand in five files, each case starts from the world of its own stage, and a case that only checks how an input is read is a call.** *Data & interfaces* gives the files, the stage worlds and the rule. The fixed waits of these files that wait for a state wait on that state.
8. **The daemon's cases stand in four files, and a case that needs a work item takes a copy of one.** The fixed waits of these files that wait for a state wait on that state.
9. **The cases of the pull request check and of the chain command take copies of a cleared world, and one run of the check asks git each read once.** `pr-check/skills/code-review/scripts/chain_check.py#git` keeps each answer for the run.
10. **The times before and after are recorded.** `apps/desktop/measurements/suite-times.md` holds the whole run, each layer and the ten slowest files, with the commands and the load: for the owner's Mac before this work and after it, and for the runner before it. The runner's times after it are read from the pull request's own `check` run, which no commit of the branch can hold, and the orchestrator writes them on issue #200.
11. **The broad gate is one command that runs the documents' leg first and the suite only for a change the suite reads.** `scripts/documents-check.mjs` is the documents' leg. `scripts/gate.mjs` runs it, then decides from the changed paths, then runs `pnpm -r run check` or says why it did not. `agentory/config.json`'s `Broad gate` is `node scripts/gate.mjs`. `scripts/suite-reads.mjs` names the documents the suite reads.
12. **`check` runs the suite's two legs side by side for a code change and no suite for a documents-only change, and reports success either way.** `.github/workflows/check.yml` holds four jobs. *Data & interfaces* gives them.
13. **A work item runs the whole suite twice: the broad gate, once, and `check`, at each push to its pull request.** A phase and a fix pass run the files they changed and the files that read what they changed. The built-app files run in a batch at a phase's end only where the phase changed what the built app loads. No built-app run follows the gate. A documents-only or records-only change runs the documents' leg alone.
14. **The guidance is `docs/testing.md` with `docs/testing.ko.md`, and `CLAUDE.md` points at it.** The last bullet of `docs/architecture.md` *Measure before building*, in both editions, moves there. `README.md` and `README.ko.md` gain the document's row. Each `check:` line of `docs/` that names a file this work splits names, after it, each file that holds a case of its rule.

### Out, and why

- **The other fixed waits of the suite, the shared waiting helper and the run under a second suite's load.** They are #306's, which stays open. This work rewrites the waits of the files it rebuilds.
- **The built-app layer's own time, 211 s here and 279 s on the runner.** Its files already share one app each, and no cause was measured beyond the list of its slow cases. The orchestrator files it as an issue.
- **`ubuntu-latest` for the layers that start no pty.** No probe can run on that platform from this machine, and a run on GitHub is possible only once the pull request is open. *Q2* of `frame/questions.md` holds it.
- **Fewer git processes in the daemon's own chain, and the real git in the daemon.** They change the product, and *What the daemon could do beyond the issue* names them.
- **AgenticSeal's whole git runner in `pr-check/`.** *Alternatives considered* in `frame/plan.md` gives the reason.
- **A ruleset that requires `check`.** Only the owner can change one. *Q1* holds it.
- **A folder for each layer.** *Alternatives considered* gives the reason.

### The targets

The owner asked that the frame set the figures on the measurements. Each is read from one run, alone on its machine.

| What | Measured before | Target |
|---|---|---|
| The three layers before the built app, on the owner's Mac | 577 s | 90 s |
| The built-app layer, on the owner's Mac | 211 s | 210 s, since this work does not cut it |
| One whole verification, `node scripts/gate.mjs`, on the owner's Mac | 789 s, and the typecheck, which was not in that run | 320 s |
| `check` for a code change, from its first job's start to its last job's end | about 14 min | 6 min 30 s |
| `check` for a documents-only change | 11 to 13 min | 1 min |
| One file of the `logic` layer | none over 1 s | 5 s |
| One file of the `process` or the `pty` layer | 575 s | 60 s |
| One file of the `app` layer | 72 s here, 91 s on the runner | 100 s |

The issue proposed 5 minutes for one whole verification. 320 s is the typecheck and the documents' leg at about 20 s, 90 s and 210 s. Reaching 300 s takes the built-app layer under 190 s, which is the issue the orchestrator files. On the runner the built-app leg alone takes 279 s before its setup, so 6 min 30 s is that leg with its job's start and the two small jobs around it.

### What the daemon could do beyond the issue

Owlery is first a tool that makes development convenient, and its daemon sees every work item's gate, records and processes. The orchestrator takes none of these inside this work item: each changes the product.

- **Call the real git.** Every git process the daemon starts on a Mac whose `git` is Apple's shim pays about 10 ms for the shim. A daemon that resolves the binary once would halve its start on a person's repositories, 300 ms against 123 ms for one work item here, and every read of the sidebar.
- **Start fewer git processes for a stage.** One chain of six stages starts about 205. Most are reads the daemon repeats within a stage.
- **Give the gate's command the base.** The daemon knows each work item's base. With it in the command's environment, any repository's gate could skip what a change does not read, as *Scope* item 11 does for this one.
- **Show where a gate's time went.** The daemon already holds each gate run's start and end in the ledger. It could read a timing file the repository's command writes, as `OWLERY_TEST_TIMES` names here, and show the slowest files on the work item's view and the gate's time across a repository's work items.
- **End what a gate left running.** The daemon starts the gate in a process group of its own, so after the command exits it can name and end the processes still in that group.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A new test file names no layer | Given a `.test.ts` file whose first line is not a layer line, when the suite starts, then it stops and names the file and the four lines it reads | `apps/desktop/test/layers.test.ts`, a case over a folder of its own |
| A case does more than its layer allows | Given a `logic` file whose case starts a process, a `process` file whose case starts a pty, or a file outside `app` that starts the built app, when the case runs, then it fails with the guard's sentence, which names the layer the file should name | `apps/desktop/test/layers.test.ts`, each guard seen red with only it removed |
| A run reports a file past its budget | Given a run whose one file took longer than its layer's file budget, when the run ends, then the report names the file, its time and the budget, the JSON holds the same, and the exit is the run's own | `apps/desktop/test/test-times.test.ts`, over modules it hands the reporter |
| The suite runs the real git on a Mac | Given a `PATH` whose `git` is `/usr/bin/git`, when the launcher builds vitest's environment, then the real binary's folder is first, and on any other `PATH` it adds nothing | `apps/desktop/test/suite-environment.test.ts`; the orchestrator's whole run after phase 1 |
| A case takes a copy of a world | Given a world built once in a file, when a case takes a copy, then the copy holds the same commits, worktrees and remote under its own folder, git reads it clean, and the copy started no process | `apps/desktop/test/worlds.test.ts` |
| A chain case still checks what it checked | Given each case of `chain.test.ts` at `928c7233`, when phase 2 closes, then a case of the same title stands in one of the five files and passes, or the phase record names the case that took its place and what of it each new case holds | the five files' run; `trail/phases/phase-2.md`, one verdict for each case still over 1 s |
| No unit file is the floor | Given the whole suite after phase 4, when it runs alone, then no `process` or `pty` file takes over 60 s and the three layers end within 90 s on the owner's Mac | the orchestrator's whole run after phase 4, read from the file `OWLERY_TEST_TIMES` names |
| A documents-only change runs no suite | Given a branch whose changes since the release branch are `docs/product.md` and a work item's records, when `node scripts/gate.mjs` runs, then the documents' leg runs, the suite does not, and one line names the base and says so. Given a change to `docs/design.md`, `agentory/config.json` or any file outside the documents, then the suite runs | `apps/desktop/test/repository-gate.test.ts`, over temporary repositories |
| `check` succeeds on a documents-only pull request | Given a pull request that changes documents alone, when its checks end, then `check` is a success, and the jobs `unit` and `app` were skipped | `unverified` until such a pull request exists: *Q3* |
| The documents' leg refuses what the old one refused | Given a document with no Korean twin, a twin with another count of headings or of table rows, or the word the leg bans, when `node scripts/documents-check.mjs` runs, then it exits 1 and names the file | `apps/desktop/test/documents-check.test.ts` |
| The old configuration is gone | When phase 1 closes, then no line of the tree names `vitest.config.ts` | phase 1's search in `frame/plan.md` |
| Each `check:` line names a file that stands | When phase 6 closes, then every target of every `check:` line of `docs/` is a file | phase 6's command in `frame/plan.md` |

## Data & interfaces

### The layers

| Layer | What a case of it may do | Runs | Guard |
|---|---|---|---|
| `logic` | call code in its own process, and read and write files under a temporary folder | beside the other files | a setup file of the project makes each starter of `node:child_process` throw |
| `process` | also start git or another process, and build a world | beside the other files | the project resolves `node-pty` to a module whose `spawn` throws |
| `pty` | also start a `Daemon`, a pane or a pty | beside the other files. Phase 3 reads the peak count of open ptys with the nine files of the chain and the daemon side by side, against `sysctl -n kern.tty.ptmx_max`, and sets `maxWorkers` for the project only where the peak passes half of it | `buildApp` and `BuiltApp.start` throw outside `app` |
| `app` | also start the built app | one file at a time, after the other three layers | none |

- Every layer runs in Electron's Node, through `apps/desktop/scripts/test-in-electron.mjs`, because the daemon ships on it. The launcher's comment and the head of `check.yml` say so, and no longer that node-pty cannot load elsewhere.
- `apps/desktop/scripts/layers.mjs` holds the four names, each one's file budget in milliseconds, and `layerOf(firstLine)`. The configuration and the reporter both read it. `docs/testing.md` cites it for the file budgets and states none.
- `apps/desktop/package.json`: `test` runs every layer, `test:unit` is `node scripts/test-in-electron.mjs --project logic --project process --project pty`, `test:app` stays, and `check` stays `pnpm run typecheck && pnpm run test`.
- The `process` and `pty` projects keep the 20-second case timeout the `unit` project has, and `logic` takes vitest's default.

### The reporter

`apps/desktop/scripts/test-times.mjs`, named in the configuration's `reporters` beside `default`. The JSON it writes: `{ "wallMs", "layers": { "<layer>": { "files", "sumMs", "longestMs", "longest" } }, "files": [{ "file", "layer", "ms", "budgetMs", "over" }] }`. A run given `--reporter` on its command line replaces both reporters, as vitest does, and prints no report.

### The launcher's environment

`apps/desktop/scripts/test-in-electron.mjs` exports `suiteEnvironment(env, platform, realGit)`, which gives the environment vitest starts with, and calls it. `realGit` runs `xcrun -f git` and is called only on `darwin` and only where the first `git` on `PATH` is `/usr/bin/git`. The folder that holds the configuration file and the empty template folder is made for the run under the system's temporary folder and removed when vitest exits.

### A world

```ts
// apps/desktop/test/worlds.ts
export function world<T extends { base: string }>(build: () => T | Promise<T>): { copy(cleanups: Cleanups): Promise<T> };
```

- `world` is called in a file's or a `describe`'s body. It builds in a `beforeAll`, so no case's time holds the build, and removes the build in an `afterAll`.
- `copy` copies the folder `base` to a new temporary folder, writes the new path wherever a file of the copy holds the old one, and gives `T` with the new path in each string that held the old one. It starts no process. Which files hold the path is read from the built world, not listed.
- `apps/desktop/test/chain-run.ts#standing` keeps its name and what it returns. It takes a copy of the world its options name and starts its `Daemon` on it. A case whose options no other case of its file shares may still build.
- The chain's stage worlds: `built` is a branch with one commit, which `standing` builds today. `settled` also holds the records of rounds with no finding open. `gated` also holds the gate's record. `cleared` also holds a cleared inspection. Each is the records the daemon's own chain wrote, run once in the file's `beforeAll` on the fake adapter.

### The chain's and the daemon's files

| File | Layer | Holds, by the `describe` titles of `928c7233` |
|---|---|---|
| `chain.test.ts` | `pty` | the thirteen groups before `a work item's chain`, and of that group its own cases, `a stage that fails or is stopped`, `a start that is refused` and `a chain that starts again from the records` |
| `chain-judgments.test.ts` | `pty` | `a round whose record the check would refuse`, `a fix pass held to its record`, `the orchestrator's judgments` |
| `chain-gate.test.ts` | `pty` | `the broad gate of a work item's chain` |
| `chain-inspection.test.ts` | `pty` | `the inspection of a work item's chain` |
| `chain-pull-request.test.ts` | `pty` | `the pull request stage of a work item's chain` |
| `daemon.test.ts` | `pty` | `the daemon's local server`, `sessions`, `agent events`, `headless sessions`, `the agent's notice`, `idle exit`, `the daemon's log of how a daemon ended`, `OutputBuffer`, `discovery`, `keeping the Mac awake`, `the caps on the machine` |
| `daemon-work-items.test.ts` | `pty` | `work items`, `the setup of a new worktree`, `the fetch of a base`, `repositories`, `the records place of a repository`, `what a person sets on a work item` |
| `daemon-inbox.test.ts` | `pty` | `the inbox`, `the decisions made without asking`, `the questions a work item is parked with`, `what a work item's records say of its chain`, `the inspection a work item's head holds`, `the stage a pane's session runs`, `the records of the back of an inspection`, `the last look` |
| `daemon-word.test.ts` | `pty` | `the commit of a person's word`, `the watch of an open pull request`, `a Claude Code pane and the owl chain` |

All stand in `apps/desktop/test/`. A helper two of them share moves to `chain-run.ts` or to a new `daemon-run.ts`.

**A case is rewritten, never dropped.** A case whose fact is how the daemon reads an input, such as a role's answer, a record or an answer of `gh`, calls the reader with that input in the process, and its group keeps one case that runs the stage end to end for each arm: the input taken, and the input refused. A case whose fact is that the daemon and git agree keeps git. A case that fed several inputs through several whole chains becomes one call for each input and one end-to-end case. The phase record gives one verdict for each case that still takes over 1 s alone: it became calls, it starts from a stage world, or it kept its whole chain, and why.

### The check's git

`pr-check/skills/code-review/scripts/chain_check.py#git` answers a call whose `root` and arguments it already answered in this run from that answer. `main` starts each run with none. The check writes nothing git reads, so an answer given again is the answer git would give.

### The gate, the documents' leg and `check`

- `scripts/documents-check.mjs`: for `README.md` and each `docs/*.md` that is no `.ko.md`, the twin stands and holds the same count of lines that open with `#` and of lines that open with `|`. No file under `docs/`, nor `README.md`, nor `README.ko.md` holds `도장`. It exits 0, or 1 with one line for each refusal. It needs Node alone.
- `scripts/suite-reads.mjs` exports `SUITE_READS`, the four paths of *Grounding*. `themes.test.ts` and `records-place.test.ts` take those paths from it, through `apps/desktop/test/own-repository.ts#ownFile`, which throws for a path the list does not hold.
- `scripts/gate.mjs`, with no argument: it runs the documents' leg and exits with its code where that is not 0. It then takes as the base the remote-tracking branch, of `origin/main` and each `origin/release/*`, whose merge base with `HEAD` leaves the fewest commits to `HEAD`. The change is the paths that differ between that merge base and `HEAD`, with every path `git status --porcelain` names. Where the change is not empty and every path of it is `CLAUDE.md`, `README.md`, `README.ko.md`, or under `docs/` or `agentory/`, and none is in `SUITE_READS`, it prints one line with the base's ref, its commit and the count of paths, says the suite did not run, and exits 0. In every other case, a repository with no such branch among them, it runs `pnpm -r run check` and exits with its code. A stale remote-tracking branch gives an older base and so a larger change, which errs toward the suite.
- `scripts/gate.mjs --decide --base <ref>` prints `documents` or `suite` by the same rule against that ref, and runs nothing.
- `.github/workflows/check.yml`:

| Job | Runner | Runs | When |
|---|---|---|---|
| `changes` | `ubuntu-latest` | the checkout with the whole history, `node scripts/gate.mjs --decide --base origin/<base>` into an output, and `node scripts/documents-check.mjs` | always |
| `unit` | `macos-latest` | the install, `pnpm --filter @owlery/desktop run typecheck`, `pnpm --filter @owlery/desktop run test:unit` | `changes` printed `suite` |
| `app` | `macos-latest` | the install, `pnpm --filter @owlery/desktop run test:app` | `changes` printed `suite` |
| `check` | `ubuntu-latest` | one step that fails unless `changes` succeeded and each of `unit` and `app` either succeeded or was skipped while `changes` printed `documents` | always, after the three |

Both macOS jobs set up Python 3.12, as the one job does today.

### `docs/testing.md`

Its sections, each a rule in one bold sentence with its grounds, and a `check:` line where a case holds it: *The layers*, with the table above. *One world per file*. *Git in the tests*. *Waits*: a case waits on a state it can read, and a wait that measures time on purpose says why in a comment. *The budget*: the targets table of this design with its date, the reporter, and that it reports and blocks nothing. *The runs of a work item*: *Scope* item 13, with which command answers the built-app files. *How a run is measured*: alone on the machine, with the load before and after, `OWLERY_TEST_TIMES`, and `apps/desktop/measurements/suite-times.md`. *A document the suite reads*: `scripts/suite-reads.mjs`. `docs/testing.ko.md` holds the same count of headings and of table rows.

`CLAUDE.md` *Where the other rules stand*: the bullet on the built-app files points at `docs/testing.md`, and says it holds how a case is written and which runs a work item takes.

## Rule changes

- nothing
  why: this work item's subject includes the policy root's own text, so it writes each rule it changes into `docs/` in its pull request, as *Scope* item 14 states. The `check:` lines name files this work splits, and a line left for the settle would name the wrong file until then.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The configuration file, with the regular expression that told a built-app file by its import and the `unit` project | `apps/desktop/vitest.config.ts` | `apps/desktop/vitest.config.mts` and the layer line. The `app` project keeps what the expression was for: the built-app files run one at a time after the rest (#118) |
| The three `git config` processes for each repository a case makes | `apps/desktop/test/repositories.ts#identify` | The same three keys, written into the file |
| The world built anew in each case | `apps/desktop/test/chain-run.ts#standing`, and the builders of `apps/desktop/test/daemon.test.ts` such as `#runFolderWithWorkItem` | `apps/desktop/test/worlds.ts`: built once in a file, copied for a case |
| The cases of the chain and the daemon as two files | `apps/desktop/test/chain.test.ts`, `apps/desktop/test/daemon.test.ts` | The nine files of *Data & interfaces*. No case goes |
| The fixed waits of those files that wait for a state | the lines the *Grounding* search prints in `chain.test.ts`, and the same search in `daemon.test.ts` | A wait on the state. A wait that measures time stays, with its reason |
| The sentence that node-pty cannot load in the system's Node | `apps/desktop/scripts/test-in-electron.mjs` lines 1 and 2, and the head of `.github/workflows/check.yml` | The reason that holds: the daemon ships on Electron's Node |
| The documents' leg written inside a JSON string | `agentory/config.json`, `Broad gate` | `scripts/documents-check.mjs`, which the gate and `check` both run |
| The one job that runs `pnpm -r run check` for every pull request | `.github/workflows/check.yml`, job `check` | The four jobs. `check` stays the name of the job that reports |
| The rule that every built-app file runs at each phase's and each fix pass's end, and the sentence that tells such a file by its import | `docs/architecture.md` *Measure before building*, last bullet, and `docs/architecture.ko.md` | `docs/testing.md` *The runs of a work item* and *The layers* |

What this work adds and takes nothing out for: the three guards, the reporter, `scripts/suite-reads.mjs` and the job `changes`. The guards are what makes the layer line exact, since a line alone can be wrong. The reporter replaces a reading by hand, as `<scratch>/200/ci-measure-1.md` was made. The list and the job are what lets a documents-only change skip the suite, and nothing held that before.

Framed 2026-11-28 by framer, before the build.
