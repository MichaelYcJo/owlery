# Phase 1: 1795860148-the-suite-is-layered-and-each-case-is-cheap

## What this phase found

The phase was built at `d768ac55` and closed at `08faf932`, in four commits: `2111d00c`, `41849942`, `12be4ab6` and `08faf932`.

### The frame, judged before the build

The frame holds for *Scope* items 1 to 5. The phase departs from it in four places, each judged against the document named.

- **`suiteEnvironment` takes a fourth argument, `home`, and the launcher also exports `writeGitHome(home)`.** `frame/design.md` *The launcher's environment* gives the signature `suiteEnvironment(env, platform, realGit)`. `GIT_CONFIG_GLOBAL` and `GIT_TEMPLATE_DIR` name paths in the run's own folder, and that folder is made and removed by `main`, so the function that gives the environment has to be told where it stands. `writeGitHome` writes the configuration and the empty template folder there, so a case reads what git reads of that file without starting the launcher. The design's line is one the orchestrator folds.
- **`apps/desktop/tsconfig.json` sets `allowJs`.** The new cases import `scripts/layers.mjs`, `scripts/test-times.mjs` and `scripts/test-in-electron.mjs`, and no test file of the tree imported an `.mjs` module before. Without `allowJs` the typecheck refuses each such import, and declaration files beside the scripts would state each signature a second time, which `skills/core/SKILL.md` *The rule a mechanism is kept against* ("A fact has one source") rules out. `checkJs` stays off, so the scripts' own text is not checked.
- **`test:unit` stands in `apps/desktop/package.json` from phase 1.** `frame/design.md` *The layers* names it, and phase 5's `check` is its first caller. The `unit` project is gone in phase 1, so `--project unit` names no project from this phase on.
- **The guards add up.** The design's table gives each layer's own guard. A `logic` case may do less than a `process` case, so the `logic` project resolves node-pty to the pty guard too, and the check of `test/built-app.ts` throws in every layer but `app`. `scripts/layers.mjs` states what each layer may do, and `test/layers.test.ts` holds each guard in each layer it covers.

### The layer of each test file

The method is the import closure of each test file under `apps/desktop/test/` and `apps/desktop/src/`, read by a script in the scratch folder, with the file's own text read where the closure reaches `node:child_process`. This is contract rule 12's first method: the list is built from what produces the property, and it covers every `.test.ts` file of the folder. The script printed 82 files.

| Layer | Files | Rule |
|---|---|---|
| `app` | 19 | each imports `buildApp` from `./built-app`, which is the set the old configuration's expression gave |
| `pty` | 7 | `accounts`, `chain`, `daemon`, `gate`, `heavy-run`, `pr-check` start a `Daemon` in the case's process, directly or through `chain-run.ts#standing`. `pty` starts node-pty |
| `process` | 25 | a case starts git, a script or another program, directly or through `test/repositories.ts`, `test/chain-command-run.ts` or a function of `src/` that a case hands a program |
| `logic` | 31 | the closure reaches no `node:child_process`, or its cases hand every probe a stand-in |

Five files were read past the closure. `machine.test.ts` is `logic`: each call of `readMachine` gives probes or `OWLERY_MACHINE`. `last-look.test.ts`, `ledger.test.ts`, `machine-turns.test.ts` and `names.test.ts` are `logic`: the functions they call start no process. `links.test.ts` and `paths.test.ts` are `process`: a case hands `chooseOpener` and `chooseFinder` a program it wrote, which runs. `package.test.ts` is `process` because `packageApp` reaches `spawnSync` and the reading did not settle that every case hands it a stand-in. A file that names a heavier layer than it needs fails nothing, and whole run M1 shows a file whose line is too light by the guard's sentence.

### Q4: how the `logic` guard makes a starter throw

`test/process-guard.ts` replaces the exports of `node:child_process` that `require` gives. No sync of the ESM bindings is needed: Node builds a built-in module's ESM bindings from its exports at the module's first ESM import, and in a worker of the suite that import comes after the setup file. A probe in Electron's Node showed it (executed): with the exports replaced first, the import gave the replaced function, and with the import first, it gave the original. The first build synced the bindings with `syncBuiltinESMExports`. `agentic mutate` showed the sync survived its removal twice, the second time with a case that reaches a starter through a package Node loads, so `12be4ab6` removed it. A mock of the module in the setup file would not reach `require` or such a package. The decision is judged against `frame/questions.md` *Q4*, whose default puts it here. Its Status cell is the orchestrator's.

### What the guards and the reporter print

Each sentence names the layer the file should name, and `test/layers.test.ts` pins each whole. The fixture run is a vitest of its own over a temporary folder, with the configuration's own `projectsOf`, so the guards are read as the suite meets them.

### The time the real git and the identity save

`test/worktrees.test.ts` took 105.8 s in the baseline `<scratch>/200/local-run.json`. It took 41.1 s at `08faf932` with `machine.test.ts` and `repositories.test.ts` beside it, at a load average of 3.1 to 3.5 (executed). This is one run, not run M1.

The reporter's time for a file is the sum of the five durations vitest's `diagnostic()` gives a module. The baseline's file times are the span from the first case's start to the last case's end, which its JSON reporter wrote. The two differ by a file's collection and its setup, so whole run M1 reads a file's time slightly higher than the baseline's way would.

### A red run that started the whole suite

The first run of the new cases, against the tree before the build, imported the old launcher from `suite-environment.test.ts`. The old launcher started vitest at its import, so the run started the whole suite inside its worker, and that suite did the same. The phase stopped the run after two minutes, by the process ids it recorded from its own launcher down, 31 processes. Afterwards no process of the worktree stood, and `cd "$TMPDIR" && /usr/bin/find . -maxdepth 1 -newermt "2026-11-28T19:45:00" -name 'owlery*'` printed nothing. This is the defect the launcher's last line now prevents: `main` runs only where the launcher is the script Node started. That line has no mutation run, because a mutant of it would start the same recursion. Each run of `suite-environment.test.ts` imports the launcher, and a broken line would show there as the same recursion.

### The rename

`vitest.config.ts` is now `vitest.config.mts`, and its text changed with its new reading of the layers, so its run is the *Logic* row of `skills/verify/SKILL.md` *The narrow command still has to be able to fail*. The census of the old name, run at the tree of `08faf932`:

- `git grep --no-color --no-line-number -F 'vitest.config.ts' -- . ':!agentory/threads/1795860148-the-suite-is-layered-and-each-case-is-cheap'` printed nothing and exited 1. At `928c7233` the same search printed `apps/desktop/measurements/built-app-launch.md:3`.
- `git ls-files -- apps/desktop/vitest.config.ts` printed nothing. At `928c7233`, `git ls-tree -r --name-only 928c7233 -- apps/desktop/vitest.config.ts` printed the path.

The phase writes no keep file, because its search is to print no line. The `.mts` name ends vite's warning that the configuration was ESM syntax in a file loaded as CommonJS, which each run before it printed (executed: 0 such lines in the first run after the rename).

The phase also corrected the sentences that stated the old reading: `apps/desktop/measurements/built-app-launch.md` line 3, and the comments of `src/renderer/press.ts` and `src/renderer/refresh.ts` that named the `unit` project. Lines 85 to 98 of the same measurement name the `unit` project as it stood on 2026-11-25, and stay.

### What each unit that adds behaviour was shown red against

Each run is `agentic mutate` over the committed file, with the cases of the file named.

| Unit | Mutants | Cases | Verdict |
|---|---|---|---|
| `scripts/layers.mjs` | the line's end anchor, the stop, the walk of subfolders | `test/layers.test.ts` | 3 red, each on the case of its rule |
| `test/process-guard.ts` | one starter fewer | `test/layers.test.ts` | red |
| `vitest.config.mts` | the `logic` setup file, the pty alias of `logic`, the pty alias of `process`, the layer variable of `app` | `test/layers.test.ts`; `test/theme-controls.test.ts` for the last | 4 red |
| `test/built-app.ts` | each call of the check, and the check reading `pty` alone | `test/layers.test.ts` | 3 red |
| `scripts/test-times.mjs` | 8 mutants: the budget's comparison, the sum, the JSON, the GitHub test, the workspace path, a thrown report, an emptied JSON, the longest file | `test/test-times.test.ts` | 8 red |
| `scripts/test-in-electron.mjs` | 8 mutants: the shim test, the platform test, the `/usr/bin` answer, each of the three variables, the template folder, the `X_OK` test, the default branch | `test/suite-environment.test.ts` | 8 red. The case for a `git` that cannot run came with `08faf932`, after the first reading showed no case held the `X_OK` test |
| `test/repositories.ts#identify` | the old three processes, and no identity | `test/suite-environment.test.ts` | 2 red |

### The phase's set

Every test file changed, since each gained its first line, so the set of `skills/verify/SKILL.md` *Scope: cheap and often, broad and once* is the whole suite, which whole run M1 is. Every file the phase ran belongs to the two suites the *Verified by* cell names. The cell's narrow set ran at `08faf932`, at a load average of 3.0 to 3.5:

- `node scripts/test-in-electron.mjs test/layers.test.ts test/test-times.test.ts test/suite-environment.test.ts`: 18 passed, exit 0.
- `node scripts/test-in-electron.mjs test/repositories.test.ts test/worktrees.test.ts test/machine.test.ts`: 193 passed, exit 0. `machine.test.ts` is the `logic` file and `worktrees.test.ts` a `process` file.
- `node scripts/test-in-electron.mjs test/gate.test.ts`, a `pty` file: 18 passed, exit 0.
- `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/theme-controls.test.ts`, an `app` file: 11 passed, exit 0.

Each ran with `ELECTRON_OVERRIDE_DIST_PATH` naming the main checkout's Electron, which the launcher still honours after its change. A probe in the scratch folder showed a whole run stop at a file with no layer line, with vite's "failed to load config" and the sentence, exit 1.
