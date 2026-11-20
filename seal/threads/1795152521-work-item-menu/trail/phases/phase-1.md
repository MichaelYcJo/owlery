# Phase 1: 1795152521-work-item-menu

## What this phase found

Every path below is under `apps/desktop` unless it starts with `seal/` or `frame/`. The phase's scratch is `<scratchpad>/1795152521-work-item-menu/phase-1/`. The code and its cases are the commits `65c57e5` and `8107fa2`.

**The frame holds for this phase, with three points it did not settle and one it has wrong.** `read` at `9301e6b`: each coordinate of `frame/plan.md` *Technical context* that this phase builds on stands where the row says, and `frame/design.md` *Grounding* reads `src/daemon/work-items.ts`, `src/daemon/daemon.ts`, `src/daemon/last-look.ts`, `src/shared/protocol.ts`, `src/renderer/view.ts` and `src/renderer/sidebar.ts` as they are.

- **Wrong: where the owner's app runs from.** `frame/plan.md` *Technical context* says the owner runs the app from `release/v0.0.1`. `executed`, `ps -axo pid=,lstart=,command=` on 2026-11-20: the owner's app (pid 72305, started 14:24:40 with `electron .`) and the daemon (pid 95337) both run from this clone's `apps/desktop/dist`, which `ls -la` dates 14:24. `test/built-app.ts#buildApp` writes that same `dist` from the working tree before every start of a built-app case. A run of such a case in this clone would put this phase's window and daemon under the owner's running app: the window at its next reload would be this build's against the daemon of the earlier one, and the daemon at its next start would be this build's, which writes `repositories.json` into the owner's run folder at its first change. The plan's constraints forbid a write to that folder and name no such path to it. See *Departures* for what the phase did.
- **Not settled: the empty value of `repoId` in a look.** Scenario 20 reads a look without the new fields "with those fields at their empty values", and a repository's id has none. The phase reads it as 0, which no repository bears, since ids start at 1. `src/shared/protocol.ts` says so on the field. Judged against `frame/design.md` *User scenarios*, scenario 20. The window reads a look's work items by their ids alone (`src/renderer/view.ts#changesSince`), so nothing reads the 0.
- **Not settled: what answers an add that changes nothing.** `frame/design.md` *Data & interfaces* says `done` "answers each of those that changed something". A second `addRepository` of a repository the daemon keeps changes nothing, and a request with no answer leaves its client waiting. The daemon answers it with `done` and sends no `inbox`. Judged against *Scope* item 3, "A repository already stored is not added twice".
- **Not settled: an `addRepository` whose `folder` is no absolute folder's name.** A `folder` that is no string, and one that is not absolute, the empty one among them, is refused with "a repository is added by a folder inside it". Git run with a relative folder answers for the folder the daemon runs in, so the daemon would add that repository. Judged against *Scope* item 3. The fix pass of round 1 widened the refusal from the empty folder to every relative one, and gave a creation and a plan the same refusal of their `repo`, since a creation stores its folder's repository too (`trail/rounds/round-1.md` finding 3).

**Decisions the frame left to the code.** Each is judged against `frame/design.md` *Scope* item 1 unless another is named.

- `repositories.json` holds an array of repositories, each with its work items inside. The reader is strict: a file that is not such an array, a field of the wrong type or an absent field among it, is read as no repository, as `work-items.json` was read at `95decb6`. It copies the named fields alone.
- The store starts from `work-items.json` only where no file stands at `repositories.json` (`ENOENT`). A `repositories.json` that cannot be read, or is not the store's, starts the store empty and is not replaced by the old list. The item says "does not exist".
- A repository made at that start is added at the time its first work item was made, and gets the ids 1, 2 and so on in the order of the start. The start writes nothing, so every start before the first change has to give the same store, and the daemon's clock would give another `addedAt` each time.
- A new work item's id is one more than the highest id of the whole store, and a new repository's one more than the highest repository's. **Phase 5 has to look at this again**: once a delete takes the work item with the highest id out, the next creation gets that id, and a pane or a look that still names the old work item would name the new one.
- `addRepository` does not run on the chain `Daemon#creating`. The store holds a folder once however many adds arrive together, and item 23 names a rename, a delete and a creation alone.
- `WorkItem` keeps `repo`, the repository's folder, beside the new `repoId`. `frame/design.md` *Data & interfaces* says the type gains fields and takes none away, and the form and a view read `repo`.
- The status line says the earlier build's sentence wherever the window has no notice of its own, for as long as the daemon sends no `repositories` (*Scope* item 2). It is held apart from a request's refusal (`src/renderer/shared.ts`, `held.daemonNotice`), so the `started` and `workItemCreated` answers that empty the notice do not take it away.
- The sidebar's row is drawn as `section.repository[data-repository="<id>"]`, holding `div.repository-row` with the fold `button.side-item.fold`, `button.icon-button.repository-add` and `button.icon-button.repository-menu`. The last has `aria-haspopup="menu"` and no listener. The fold is kept by the repository's id.

**Departures from the frame.**

- **The two starts of the app ran in a clone under the scratch, not in this clone.** `git clone` of this repository into `<scratch>/clone` at `8107fa2`, then `pnpm install --frozen-lockfile` there (`executed`, exit 0), which starts no app. The built-app runs below built that clone's `dist`. `executed` after both: `ls -la apps/desktop/dist/daemon.js` in this clone still reads 14:24. The grounds are the first bullet above, judged against the constraint of `frame/plan.md` *Technical context* on the owner's running app.
- **One start more than the plan's row names.** The row names one built-app case. The sidebar's rows, its "+" button and a repository with no work item are drawn by `src/renderer/sidebar.ts`, which no case of this phase loads, and scenario 7's file is phase 2's. A probe, `test_tmp_sidebar.test.ts` in the scratch, started the app once in the scratch clone. Judged against the plan's constraint "as few starts as its verification needs".
- `src/daemon/worktrees.ts#repositoryOf` is exported. The frame names no change to that file in this phase, and the daemon needs the repository's top-level folder of an add.
- `Front` did not gain `archived`, and `src/renderer/list.ts` is not changed. `frame/design.md` *Data & interfaces* lists both without a phase, and the archived list is phase 4's. The window holds the daemon's `archived` list in `held.archived` and draws it nowhere yet.
- The case of `describe("sidebarTree")` that named a repository by the last part of its folder for an earlier daemon is gone with the cases `## Removes` row 4 names. The sidebar lists no repository for such a daemon (*Scope* item 2). The like case of `matchWorkItems` stays, since the inbox lists the work items as before.
- `test/daemon.test.ts#runFolderWithWorkItem` and the case of a work item from before the base commit still write `work-items.json`. They now also hold the start from the old file through the daemon.

**What the next phases need.**

- The store's functions are `repositories()`, `workItems()`, `workItem(id)`, `addRepository(folder)` and `addWorkItem(place)`. A stored work item and its repository are the store's own objects, which a change writes with `write()`. Nothing changes or removes an entry yet.
- `Daemon#lists` builds the four lists of a `ready` and an `inbox`. `Daemon#readCommits` still reads git for an archived work item (`## Removes` row 7, phase 4), and `Daemon#worktreeFor` still starts a pane in one.
- A `done` is taken by `src/renderer/renderer.ts#onMessage`, which empties the window's notice. A request's `error` goes to the status line unless a form claims its `requestId`.
- A second client can drive the daemon of a built app: `run/daemon.json` under `BuiltApp#userData` holds the port and the token. The probe added a repository that way, since the folder dialog is the system's.

**Each new case was seen red before its code.** Every run is `executed` with exit 1, from `apps/desktop`, and its output is in the scratch.

- `node scripts/test-in-electron.mjs test/repositories.test.ts`, before `src/daemon/repositories.ts` existed (`red-repositories.txt`): no case ran, and the file failed on the import. The cases had no failing line of their own, so the twelve mutants of the store below are their red.
- `node scripts/test-in-electron.mjs test/daemon.test.ts -t "repositories|work items|the last look"`, against the daemon of `9301e6b` (`red-daemon.txt`): 11 failed and 20 passed.
  - The case of `ready` and `inbox` failed on "expected [ undefined, [], undefined ] to deeply equal [ [], [], [] ]", the archived list's case and the start from the old file on "expected undefined to deeply equal", and the hidden repository's case on "Cannot read properties of undefined (reading 'map')".
  - The three cases of `addRepository` ended at the 5 seconds a case has, waiting for an answer the old daemon never sends. The mutants below show each of their lines red on its own.
  - Four cases that stood at `9301e6b` failed on the fields and the file they were rewritten to expect.
- `node scripts/test-in-electron.mjs test/last-look.test.ts`, against `src/daemon/last-look.ts` of `9301e6b` (`red-last-look.txt`): 12 failed and 1 passed. Scenario 20's case failed on "expected { at: 1234, … } to deeply equal", and the case of a file that is no look on "expected { at: 1234, … } to be null" for a `repoId` that is no number.
- `node scripts/test-in-electron.mjs test/view.test.ts`, against `src/renderer/view.ts` of `9301e6b` (`red-view.txt`): 8 failed and 177 passed. The two cases of `daemonLists` failed on "daemonLists is not a function". The six of `sidebarTree` failed on the old function called with the new arguments, lines that name no rule of the tree, so the mutants below are their red.
- Two assertions were added after the code, in `8107fa2`, and each was seen red by its mutant alone: a `repositories.json` that cannot be read (mutant 4 of the store), and a daemon that sends `repositories` and no `archived` (mutant 8 of the view).

**Each unit that adds behaviour was broken once, at `8107fa2`.** Every run is `seal mutate`, `executed`, with exit 0, and every mutant is red. The outputs are `mutate-*.txt` in the scratch.

| File mutated | Cases run | Mutants | What they break |
|---|---|---|---|
| `src/daemon/repositories.ts` | `test/repositories.test.ts` | 12 red | one repository for each folder at the start; `addedAt` of the start; the old file read where the new one is no JSON; the old file read where the new one cannot be read; a hidden repository shown again; `changed` of an add that changes nothing; a work item's id over the whole store; the reader's check of `pinned`; `baseCommit` of an old entry without one; the write of an add; a write at the start; a repository's next id |
| `src/daemon/daemon.ts` | `test/daemon.test.ts -t repositories` | 11 red | the archived out of `workItems`; the archived in `archived`; `repoId`; `repoName` from the name a person gave; a repository's `name` from it; no `inbox` after an add that changes nothing; `done`; the refusal of an empty folder; the repository's top-level folder of an add; a work item's `repo`; `customName` |
| `src/daemon/last-look.ts` | `test/last-look.test.ts` | 12 red | each of the five empty values; each of the five checks of a field's type; an absent `repoId` and an absent `archivedAt` refused |
| `src/renderer/view.ts` | `test/view.test.ts` | 11 red | a hidden repository listed; a work item put under a repository by its folder; a repository with no work item left out with no search; one kept while a search leaves it nothing; the search alone and the filter alone as what narrows; the notice; `archived` where the daemon sends none; the notice's words; a repository's name; a daemon that sends no `repositories` read as one that does |

The first run of the daemon's batch was refused before anything was written, exit 2: one text to replace stood twice in the file. The run above is the second, with that text widened.

**The phase's cases at `8107fa2`.** All are `executed`.

- `node scripts/test-in-electron.mjs test/repositories.test.ts test/daemon.test.ts test/last-look.test.ts test/view.test.ts test/worktrees.test.ts test/appearance.test.ts test/themes.test.ts`, in this clone: 7 files, 380 cases, all passed, exit 0 (`boundary.txt`). These are the four files the phase changed and the three others that read a path it changed without starting the app.
- In the scratch clone, `node scripts/test-in-electron.mjs test/korean-input.test.ts -t "opens one pane through the form, of the shell kind"`: 1 passed and 32 skipped, exit 0 (`korean-case.txt`). It is one start, through `BuiltApp.start`, under `OWLERY_BACKGROUND=1`.
- In the scratch clone, the probe `test_tmp_sidebar.test.ts`, run once: 1 passed, exit 0 (`probe-sidebar.txt`). It is one start, the same way. It read these of the page:
  - no repository and no notice before any is added;
  - after a creation through the form, one row with the repository's name, the count 1 and the work item's line;
  - after a second client's `addRepository`, a second row with the count 0 and no line;
  - a click on the second row's "…" opens no dialog and no menu;
  - a click on its "+" opens the form with that repository's folder in `work-item-repo`;
  - a click on the first row's fold hides its list and leaves the keyboard on the fold.
- `tsc --noEmit` with the options of `tsconfig.json` over the twelve source files and the four test files the phase changed: exit 0 (`tsc-files.txt`).
- `git grep -n -e 'work-items\.json' -e 'WorkItemList' -- apps docs README.md README.ko.md` printed lines of `src/daemon/repositories.ts`, `test/repositories.test.ts` and `test/daemon.test.ts` alone, each about the start from the old file.

No process of the scratch clone was left: `ps` found none after the two starts. The owner's daemon and its folder were not touched, and every repository of a case was a temporary one.
