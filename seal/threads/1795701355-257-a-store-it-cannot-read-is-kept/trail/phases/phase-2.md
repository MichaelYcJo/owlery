# Phase 2: 1795701355-257-a-store-it-cannot-read-is-kept

## What this phase found

**The frame holds for this phase.** At `38089597`, `statusNotice` stood at `apps/desktop/src/renderer/view.ts:920-922` with three arguments, `showStatus` at `apps/desktop/src/renderer/sidebar.ts:87-89`, `held.agentNotice` at `apps/desktop/src/renderer/shared.ts:25-26`, the `ready` handler's read of `agentNotice` at `apps/desktop/src/renderer/renderer.ts:1899`, the `ready` member and its comment at `apps/desktop/src/shared/protocol.ts:957-958`, the `ready` send at `apps/desktop/src/daemon/daemon.ts:974`, and the comment at `daemon.ts:1020` still said "lost or read as no repository" (read). The `statusNotice` cases opened at `apps/desktop/test/view.test.ts:3507`, as the spawn said. `RepositoryStore#setAside()` and `setAsideNotice` stood as phase 1 built them (`apps/desktop/src/daemon/repositories.ts:202-213`, `:330-332`). Q1 and Q2 stand on their defaults: the notice stands while the daemon runs, and no screenshot is owed.

**The daemon reads the store once, after it is made, and holds the sentence.** `Daemon`'s constructor reads `setAside()` right after `new RepositoryStore` and keeps `setAsideNotice`'s sentence in a `readonly storeNotice: string | null`. `accept` spreads `{ storeNotice }` into `ready` only where it is not null, the way `keepAwake` and `machine` are sent. No other message carries it, and no state of the daemon changes it. Judged against `frame/design.md` *Scope* item 5 and `frame/questions.md` Q1's default (a).

**The window reads an absent key as null.** The `ready` handler sets `held.storeNotice = message.storeNotice ?? null`, beside `held.agentNotice`. Both are set before the handler draws the window, so the status line says the store's notice on the path that already drew the agent's after a `ready` (read: the handler ends in `openSummary` or `openList`, each of which puts a screen in front through `bringToFront`, whose `showSidebar` ends with `showStatus`; `renderer.ts:308-311`, `:341-344`, `sidebar.ts:235`). Judged against `frame/design.md` *User scenarios & acceptance*, the row of a window of this build on a daemon of an earlier build, whose *Verifiable how* is read at review.

**The text that stated the old order was rewritten in place.** The class is every text that states the order of the status line's notices or the keys of `ready`, listed by `git grep -n "statusNotice\|agentNotice"` over `apps/desktop/src` and by the docstrings *Scope* item 7 names. The `statusNotice` docstring now names the store's notice and gives *Scope* item 6's grounds for its place, `showStatus`'s and `held.agentNotice`'s docstrings name it in the same order, `held.storeNotice` has its own, the `ready` comment says what `storeNotice` holds and that a daemon that read its file, or one of an earlier build, sends none, and the comment at `daemon.ts:1020` says "lost or kept aside". The same search over `docs/` printed no sentence on the order of the status line's notices. Judged against contract rule 19.

**One `statusNotice` case the frame implied was not added.** A case of the store's notice alone, `statusNotice("", "", STORE, null)`, passed against the form of three arguments, where the store's argument stands in the agent's place, and it passes against every mutant of the order below that the order case already fails. So it covers nothing its group does not, and it was taken out before the commit. The order case carries the store's place: `statusNotice("", "", STORE, AGENT)` is `STORE`.

**Seen red (executed, each in `apps/desktop` with `node scripts/test-in-electron.mjs`, Electron reached through `ELECTRON_OVERRIDE_DIST_PATH` set to the main checkout's `Electron.app/Contents/MacOS`, since the worktree's `electron` package has no `dist`).**

- The daemon case `keeps aside a \`repositories.json\` it cannot read, writes the first change to a new one beside it, and says where the file was kept in each \`ready\`` (`daemon.test.ts:1484`), against the store of `5370d534` copied over `src/daemon/repositories.ts` and HEAD's daemon: red at `:1498`, the read of `repositories-unread-20261126T123005Z.json` refused with `ENOENT`, since the store of `5370d534` wrote its first change over the refused file. The file was then put back from the copy saved before the run, and `git status` showed it unchanged.
- The same case against `38089597`, the store of phase 1 and the daemon before this phase: red at `:1502`, `ready.storeNotice` `undefined` where the sentence is expected.
- The `statusNotice` cases against the form of three arguments: `says the agent's notice where the window, the daemon and the store have none` red at `view.test.ts:3514`, `""` where the agent's notice is expected. The order case and the case of no notice passed there, since the store's argument fills the agent's place. Their guard is the order, which the mutants below break one by one.

**Mutation, each unit that adds behaviour (executed, at `40384584`).**

`seal mutate src/daemon/daemon.ts` with `--tests "node scripts/test-in-electron.mjs test/daemon.test.ts --bail=1 -t \"keeps aside a .repositories.json. it cannot read|carries only the fields the protocol names|sends no .keepAwake. in .ready.\""`: the baseline passed, and each of 3 mutants was red.

1. `ready` carries no `storeNotice`.
2. `ready` carries the key always, `null` where the store read its file: the key pins of `carries only the fields the protocol names, none of them a vendor's` and `sends no \`keepAwake\` in \`ready\`` saw it.
3. The daemon holds the sentence of a file it could not move alone, and nothing for a kept file.

`seal mutate src/renderer/view.ts` with `--tests "node scripts/test-in-electron.mjs test/view.test.ts -t \"statusNotice\""`: the baseline passed, and each of 3 mutants was red.

1. The agent's notice before the store's.
2. The store's notice before the other build's.
3. The store's argument left out.

The line of `renderer.ts` that holds `storeNotice` and the line of `sidebar.ts` that passes it have no case in the unit project, and no `seal mutate` run was made over them: no unit case loads either file, and the frame reads them at review. A built-app case could see them, as `role-bundle.test.ts:497` sees the agent's notice in the status line, and was not written (`gaps.md` *Not done*).

**The typecheck was drawn over the changed files.** The repository configures no linter or formatter. `tsc --noEmit` with the options of `apps/desktop/tsconfig.json`, given the six source files and the two test files this phase changed, checked them and every module they import, and printed nothing (executed, exit 0). The typecheck of the package is the broad gate's.

**The phase boundary run, at `40384584`, in two commands of the spawn's three files each (executed, one after the other, in `apps/desktop`).** The set the plan row names is the new daemon case, the two key pins and the `statusNotice` cases, and each test file the phase changed is `daemon.test.ts` and `view.test.ts`. Of the files that read a path the phase changed, `chain.test.ts` starts daemons on run folders it writes, and `role-bundle.test.ts` and `daemon-restart.test.ts` read the built window's status line, the agent's notice and the other build's. The other readers of `daemon.ts`, `view.ts` and the built window go to the broad gate (`gaps.md` *Not verified*). The spawn caps a command at three test files, so the set went in two commands where `skills/verify/SKILL.md` *Scope: cheap and often, broad and once* asks for one.

- `node scripts/test-in-electron.mjs test/daemon.test.ts test/view.test.ts test/chain.test.ts`: 3 files, 1170 cases passed, in 502 seconds, under a load average of 5 to 10. The case at `chain.test.ts:3500`, `… and gh that never ends`, which timed out in phase 1, passed in this run.
- `node scripts/test-in-electron.mjs test/role-bundle.test.ts test/daemon-restart.test.ts`: 2 files, 24 cases passed, in 20 seconds.

**Phase 1's *Not done* item is done here.** `gaps.md` *Not done* named the comment at `daemon.ts:1020`, which this phase rewrote, so the paragraph was replaced by this phase's own.
