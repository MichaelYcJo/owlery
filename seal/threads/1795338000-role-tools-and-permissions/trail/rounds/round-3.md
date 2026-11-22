# Review round 3: 1795338000-role-tools-and-permissions

```seal
target: 7b44f2f, fixes 3d0e696..c04f53d
```

This is a verifying round. Its code target is the fix pass of round 2: `1aa4344`, which changes `apps/desktop/src/daemon/role-grants.ts` and `apps/desktop/test/daemon.test.ts`, and `c04f53d`, which rewrites the first row of `gaps.md` *Not verified*. The range `3d0e696..c04f53d` holds both. `5c350a2` appends the close to `trail/rounds/round-2.md`, and `7b44f2f` folds the close into `frame/design.md` and `frame/plan.md`. Both touch the work item's records alone. The base is the merge base with `origin/release/v0.0.2`, `a3e4e7a`. The base branch stands at `cbb2e69`, as round 2 found it. Phase 3 (the window) waits for #119, and a later round reads it.

The records read whole at `7b44f2f` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md` and `gaps.md`. The work item holds no `changelog.md`, no `pr.md` and no `pr.<lang>.md` yet. `trail/phases/phase-1.md`, `trail/phases/phase-2.md`, `trail/rounds/round-1.md` and `trail/rounds/round-2.md` were read for their coordinates. The round ran in a `git clone --no-local` of the worktree at `7b44f2f`, under its scratch directory `1795338000-role-tools-and-permissions/round-3/`.

Carried from round 2, and not searched for again: what the Claude Code 2.1.330 executable says of the write tool's `file_path` ("must be absolute, not relative"), the `normalize("NFC")` in its path function, and its `## Not judged` rows on a file system that tells composed names from decomposed ones and on a hard link out of the worktree. Re-derived here: round 2's deep-link, unsearchable-folder and long-path probe, written again from its `## Probes` rows in a fixture of its own, and every verdict.

## Findings

None. The close of round-2#1 holds, the fold says what the code does, and the fix diff holds no new defect.

## Confirmations

```seal
confirms: round-2#1
```
What holds: `realLocation` (`apps/desktop/src/daemon/role-grants.ts:55-78`) climbs to the folder above only where `lstatSync` fails with `ENOENT` (`role-grants.ts:70`), and returns null for any other error. Its docstring (`role-grants.ts:45-54`) names the part the system cannot read and says an inside path written longer than the system reads is null.

Executed, round 2's probe written again as `test_tmp_r3_paths.mts` at `7b44f2f`, over a worktree made with `git worktree add`, so its `.git` is a regular file:

- The link out under five folders of 200-character names is refused as relative text (1,015 characters) and as an absolute path (1,173 characters). A write of the relative text from the worktree, by the same user, still lands in the outside folder. That write is the defect round 2 found, and the rule now refuses it.
- In a folder of mode 600, `closed/link/a.txt` and `closed/new.txt` are refused. The system's own write of `closed/new.txt` fails with `EACCES`.
- `README.md/a.txt` and `.git/hooks/pre-commit` are refused. The system's write of each fails with `ENOTDIR`.
- 600 `./` before `link/a.txt` is refused. 600 `./` before `src/new.ts` is refused too, which is the over-refusal *Scope* item 9 names. A name of 300 characters under `src/` is refused. The system's write of each of these two fails with `ENAMETOOLONG` when the text is written as it stands.
- What held before still holds. A folder of mode 300, which can be searched and not read, has its link followed: `wx/link/a.txt` is refused and `wx/new.txt` is allowed. `dangling/a.txt`, `loop/a.txt` and `link/a.txt` are refused. `src/new.ts`, `new/deep/new.ts`, `./~/a.txt`, `README.md` and `.git` are allowed.

The class, built from what produces the defect. `ENOENT` is the one answer under which a climb passes a name without reading a link on it. A name under a dangling link also answers `ENOENT`, and the climb then reaches the link itself, where `lstatSync` succeeds and the function returns null (`dangling/a.txt` above). So no error code can carry a write past an unread link. The fix pass listed the three `catch` blocks of `role-grants.ts`, and this round finds no fourth.

Executed: the crafter case at `apps/desktop/test/daemon.test.ts:3694` passes at `7b44f2f`. With `role-grants.ts` of `3d0e696` in the clone, it fails at line 3770, and exactly the five new outside rows receive `allowed: Write`. That run is the case with only the `ENOENT` guard taken out, since the old inner `catch` is the guard deleted, so each new row is seen red on its own line. The fix pass claimed that red against `3d0e696`, and the run agrees with it. The whole of `test/daemon.test.ts` passes at `7b44f2f`, 241 cases. The close's second mutation, `!==` turned to `===`, was read and not run. Its claimed result, six inside rows refused and four of the new rows allowed, is what the code gives: `===` refuses every missing name, and the second reading of the 600 `./` row is `resolve`'s short path, which then ends at `ENOENT`.

The case's cleanup (`daemon.test.ts:3723-3726`) is pushed after the daemon's and the repository's cleanups, so it runs first. It renames the lower three folders back and opens the closed folder before the repository's folder is removed. Executed: after the run against `3d0e696` failed, its folder under the system's temporary directory was gone.

What matched: the fold says what the code does. Read at `7b44f2f`:

- *Scope* item 9 (`frame/design.md:89`) says only `ENOENT` counts as the part a write would make, and that any other unreadable part is outside. It names four over-refusals, and each was executed above or in round 2.
- Scenario 8 (`frame/design.md:135`) adds "a part the system cannot read" to the readings that put a path outside.
- The fold under *Data & interfaces* (`frame/design.md:271`) says the same as `role-grants.ts:70`.
- The fourth row of `frame/plan.md` *Judgments of the run* accepts the two new over-refusals on grounds this round checked. Each fails closed. The CLI's write tool asks for an absolute path, and an absolute inside path longer than the system reads cannot be written by the system either.

`gaps.md` changes only its first row, in place, and no row left it (read: `git diff 3d0e696 7b44f2f -- seal/threads/1795338000-role-tools-and-permissions/gaps.md`).

Weighed and not raised: the `add` of *Rule changes* on *Agent adapters* (`frame/design.md:288`) says the daemon "allows its writes inside the work item's worktree". The four over-refusals refuse some spellings of an inside path. Each refused spelling names a file that is either written by its plain path, which the rule allows (`./~name` for `~name`, the path without the 600 `./`), or written by no spelling at all (`README.md/a.txt`, `.git/hooks/pre-commit`). So the sentence holds of places, and the settle that writes it into `docs/architecture.md` writes nothing the code contradicts.

What matched: the label of the suite is honest. The first row of `gaps.md` *Not verified* names the fix pass of round 2's narrow runs at `1aa4344` and leaves the whole suite and the typecheck to the orchestrator. Read: the fix pass's outputs in the scratch directory `1795338000-role-tools-and-permissions/fix-2/` show 4 unit files with 349 cases passing, `test/role-bundle.test.ts` with 11 and `test/ask-section.test.ts` with 2. The row also says the typecheck of `apps/desktop` ran before that commit, and that directory holds no output of it, so the claim rests on the account alone. The broad gate answers it.

One gap in the new rows, which opens no finding: the rows `write(deep)` and ``write(`${worktree}/${deep}`)`` (`daemon.test.ts:3760-3761`) hand `realLocation` the same two strings, because `insideWorktree` joins a relative text to the worktree and then resolves it. So the second row pins nothing the first does not, though the comment at `daemon.test.ts:3759` reads them as two forms. The 600 `./` row before `src/new.ts` (`daemon.test.ts:3764`) rests on macOS's limit of 1,024 bytes. On a system with a longer limit its prefix is read and the case fails. The suite runs on `macos-latest` (`.github/workflows/check.yml:23`), and the Linux build is `docs/architecture.md` *Open decisions*.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Carried from round 2, not re-established: a file system that tells a composed name from a decomposed one, and a file of the worktree that is a hard link to a file outside | `apps/desktop/src/daemon/role-grants.ts:94-112` | as round 2 names: the orchestrator, where the Linux build is decided; the sandbox work of *Scope* item 20 |
| Carried from round 1 through round 2, not re-established: what 2.1.330 puts in `input.file_path`, a change between the read of a path's links and the write, and a `permissionMode` key in a taken agent | `apps/desktop/src/daemon/adapters/claude.ts`, `apps/desktop/src/daemon/role-grants.ts:55-112`, `apps/desktop/role-bundle/agents/` | as round 1 names: the orchestrator, from #41's first real crafter session; the sandbox work; the orchestrator |
| The whole suite, the typecheck and the broad gate at `7b44f2f`, among them the typecheck the first row of `gaps.md` says ran before `1aa4344` | the repository | the orchestrator, by the broad gate |
| The window: *Scope* item 16, scenarios 17 to 19 and 22 | phase 3 | a later round |

## Probes

| Command | Result |
|---|---|
| `git clone --no-local` of the worktree, checked out at `7b44f2f`, then `pnpm install --frozen-lockfile` in the clone | Exit 0 and exit 0 |
| `node --experimental-strip-types --no-warnings test_tmp_r3_paths.mts <scratch>` in the clone's `apps/desktop`, once, over a fixture made with `git init` and `git worktree add` under the scratch directory | Exit 0. Node 22.14.0, and the worktree's `.git` is a regular file. Refused: the deep link as text and whole, `closed/link/a.txt`, `closed/new.txt`, `README.md/a.txt`, `.git/hooks/pre-commit`, 600 `./` before `link/a.txt` and before `src/new.ts`, `src/` with a 300-character name, `wx/link/a.txt`, `dangling/a.txt`, `loop/a.txt` and `link/a.txt`. Allowed: `wx/new.txt`, `src/new.ts`, `new/deep/new.ts`, `./~/a.txt`, `README.md` and `.git`. The writes from the worktree: the deep link's text was written into the outside folder; the deep link whole, 600 `./` before `src/new.ts` and the 300-character name failed with `ENAMETOOLONG`; `closed/new.txt` failed with `EACCES`; `README.md/a.txt` and `.git/hooks/pre-commit` failed with `ENOTDIR`. The probe then renamed the chain short and opened both folders |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/daemon.test.ts -t "answers a crafter's request by its grant"` in the clone's `apps/desktop` | Exit 0: 1 case passed, 240 skipped |
| The same with `role-grants.ts` of `3d0e696` in the clone | Exit 1 at `test/daemon.test.ts:3770`: the five rows from `deep` to 600 `./` before `src/new.ts` received `allowed: Write`, and no other row changed. Restored with `git checkout`, and `git status` showed only the probe file. The case's temporary folder was gone after the run |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/daemon.test.ts` in the clone's `apps/desktop` | Exit 0: 241 cases passed |
