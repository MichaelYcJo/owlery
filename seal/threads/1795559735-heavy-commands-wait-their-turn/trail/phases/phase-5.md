# Phase 5: 1795559735-heavy-commands-wait-their-turn

## What this phase found

**The merge of `release/v0.0.4`.** The orchestrator started `git merge origin/release/v0.0.4` at `5e14cf9`, with #32 merged there as `db39838`. Four files stopped on conflicts: `src/daemon/daemon.ts`, `src/daemon/main.ts`, `test/chain.test.ts` and `test/keep-awake.test.ts`. Each hunk kept both sides. The imports, the options and the comments that list the run folder's files took #32's reader, store and agent queue beside this work's keeper, giver, display wake and runs' file. `test/chain.test.ts` kept #32's two new cases of the agent queue before this work's case of the chain's holds. `keep-awake.ts` merged without a conflict, since #32 did not change it. The merge is `b3d73d3`. Run after it, executed: the desktop `tsc --noEmit` printed nothing, `test/keep-awake.test.ts` passed 6 of 6 and `test/chain.test.ts` 169 of 169. `test/daemon.test.ts` ran after this phase's new cases were written into it, so 8 of its 383 cases failed, each in the group "the caps on the machine" and each on the field `heavy` this phase adds or on its two new cases. The other 375 passed. The 8 passed after the source change below.

**The frame holds for phase 5, with the departures below.** The coordinates phase 5 builds on were opened after the merge: `src/daemon/machine.ts` (`readMachine`, `MachineReader`, `LimitsStore`), `src/shared/machine.ts`, `src/shared/protocol.ts` (`Machine`, `Cap`, `setCaps`), `src/renderer/machine.ts`, `src/renderer/view.ts` (`lineText`, `queuedAhead`, `machineDialog`, `capChanges`), `src/daemon/main.ts`, and the row "The Machine dialog" of `docs/design.md` *Components and their states*.

**Departures from the frame, each with its grounds.**

- The proposal's function is `shared/machine.ts#heavyProposal`, which gives `{ proposed, byCores, byMemory }`, and not `heavyDefault` with `value`. #32's proposals are named `agentsProposal` and `panesProposal`, and `Machine.heavy` names the field `proposed`, so one name serves the function and the field. Judged against `frame/design.md` *Data & interfaces*, which lets a phase take a better name.
- An entry of `Machine.heavy.queue` carries `folder` and not `repo`. A command in a folder no work item names has no repository, and the dialog names it by the last part of its folder. A work item's repository follows from `workItemId`. Judged against the same paragraph.
- The case that the keeper follows the limit the store gives stands in `test/daemon.test.ts`, in the group "the caps on the machine", and not in `test/machine-turns.test.ts`. The keeper has no store: the daemon gives it its limit (`Daemon#heavyLimit`) at its start and at a `setCaps`, and phase 1's case of `test/machine-turns.test.ts` reads a raised limit giving the next turn. The group holds #32's cases of `setCaps` and its helper `machined()`.
- This phase rewrote #32's row "The Machine dialog" in both editions of `docs/design.md` in place, and did not add the row `frame/design.md` *Rule changes* proposes. #32 wrote a row for the same dialog before this phase, and a second row would state the dialog twice. The orchestrator asked for the row in this pull request, by principle 8. The two `add` lines of *Rule changes* for `docs/design.md` and `docs/design.ko.md` are therefore written, and the settle has nothing left of them to write. That stands in the hand-back for the orchestrator to fold.
- A limit that is over the machine's cores is read as none by the daemon (`Daemon#heavySet`), and not by `LimitsStore`, which reads the file before the daemon reads the machine. The store reads a whole number from 1, as it reads every cap. Judged against `frame/design.md` *The limits' store*, which reads such a value as absent.
- `Machine.heavy` is a required field. #32's `machine` and this field ship in the same release, so no daemon sends a `machine` without it.

**Decisions made while building, each judged against the document named.**

- The built daemon is given `load` and `cores` by `machine.ts#turnReading(reader, folder)`, which `main.ts` spreads into the daemon's options with the worktrees' folder. It reads the cores once and the load at each call, from #32's reader. Under `OWLERY_MACHINE` both are the reading that variable holds. A case gives `turnReading` a reader and reads both. No case reaches `main.ts`, so the built app's second run is a row of `gaps.md` *Not verified*. Judged against `frame/questions.md` Q18, its default.
- The limit is the person's value where it is no more than the cores, or else the proposal, and `NO_READING_LIMIT` for a daemon given no reader. `setCaps` takes `heavyCommands` and refuses a value over the cores with "The limit on heavy commands at once is a whole number from 1 to 12." It says "limit" where #32's sentences say "cap", since the frame calls it the limit. Judged against `frame/design.md` *Scope* item 2.
- The daemon tells every client the machine at each change of the heavy queue, from the keeper's watcher, which also sends the inbox. A `setCaps` that changes the limit leaves that message to the keeper's watcher, so a client is told once. Judged against *Data & interfaces*, "The daemon sends #32's message `machine` when the heavy queue or the limit changes too".
- The line takes the heavy command's count from `WorkItem.machineWait` (`view.ts#machineAhead`). Where a session of the work item waits for the agent cap too, the line shows the wait that began first, by the session's `queuedAt` and the command's `since`. A session the daemon gave no time is taken as the first. Judged against *Scope* item 8.
- A gate stage that waits keeps the sentence phase 1 gave it, `chain.ts#GATE_WAITS_SAYS`, at the view's foot. That is how the work item's view says the wait at the stage. No new words were added for a second run that waits for the load. Judged against *Scope* item 8 and `frame/questions.md` Q17, its default (a).
- The dialog's heavy row stands last, after #32's three. Under it, "Running and waiting" and "What ran" are lists of records in the form of #32's list of sessions that wait. A running command's line carries no reason for its place, since nothing waits behind it for that reason. The dialog asks for the runs (`readHeavyRuns`) when it opens and at no other time, and a daemon given no reader answers none. Judged against *Scope* item 13, *This work's part of the Machine dialog*, and `docs/architecture.md` *Memory design*, "a feature costs nothing while nobody uses it".
- A command of no work item's folder stands as a row of its own for each folder in "What ran", named by the last part of the folder. The most memory and the highest load read "not read" where no run read them. That answers the row of `gaps.md` on a run whose command ended before the first reading of its memory. Judged against *Scope* items 11 and 13.
- This repository's `Heavy commands` gains `test:app`, `pnpm --filter @owlery/desktop run test:app`. #149 merged as `3fb54d5` and named `pnpm run test:app` as the command an agent runs for every built-app file at the end of a phase, in its `changelog.md`. Judged against `frame/plan.md` *Overlap with the release*, the row of #149, and `frame/questions.md` Q16.
- `docs/architecture.md` was not changed. Its *Rule changes* lines are the settle's.

**Seen red.** Each new case was run before the source change, against the tree of `b3d73d3` with the new cases, executed.

- `test/machine.test.ts` and `test/view.test.ts`: 19 cases failed. Those of `heavyProposal`, `turnReading`, `heavyQueue`, `heavyRanRows` and `machineAhead` failed where the function did not exist. Those of the store and of the dialog's rows failed on the key `heavyCommands`, and the refusals on the sentence.
- `test/daemon.test.ts`: the two new cases timed out waiting for a `machine` with the heavy queue and for a `heavyRuns`, and the six cases that compare the whole machine failed on the field `heavy`.
- `test/records-place.test.ts`: the case of this repository's own key failed, without `test:app`.
- `test/machine-dialog.test.ts`, the new case of scenarios K and I, was not run against the old tree. Its two mutations below are its red.

**Mutations.** Each batch was run with `seal mutate` after the commit `0dad093`, one batch at a time, over the cases that cover its unit, executed. Of 29 mutants, 26 went red at once, and three survived:

- In `heavy-runs.ts#heavyRan`, a key without the folder of a run with no repository, and a longest run that keeps the last run, survived: the case held one such run, and the longest came last.
- In `Daemon#heavySet`, a limit read without the bound of the cores survived: no case wrote a value over the cores.

`c58e876` added to the two cases of `test/daemon.test.ts`: the longest run first, a second folder no work item names, and a daemon started on a `limits.json` that holds 13. The batches of `heavy-runs.ts` and `daemon.ts` were then run again, and all 10 of their mutants went red, executed. The two mutants of `src/renderer/machine.ts`, the list of heavy commands left undrawn and the runs never asked for, each went red against the built-app case. Only their verdicts were read, not the line each failed on.

**The phase boundary.** The set was run as one command at `c58e876`, with `OWLERY_BACKGROUND=1`, after no other Owlery suite and no broad gate ran on the machine, executed. It held 36 files:

- each test file that imports a source file this phase changed: `daemon.ts`, `machine.ts` of the daemon and of `shared/`, `heavy-runs.ts`, `view.ts`, `machine.ts` of the renderer, and `list.ts`;
- each file that starts the built app through `buildApp`;
- each file that uses one of the two case helpers that start a daemon or the chain command;
- `test/machine-turns.test.ts`, `test/records-place.test.ts` and `test/screenshots.test.ts`.

33 files passed, 2 were skipped whole by their own conditions, and one case failed. Of the cases, 1549 passed and 8 were skipped.

The failing case is phase 3's scenario I in `test/heavy-run.test.ts`. It wants a peak memory above 64 MiB from a `python3` that holds a 64 MiB `bytearray` for 6.5 seconds, and the run's peak memory read 12,926,976 bytes. Neither the case nor `heavy-runs.ts#watchMemory` changed in this phase; `heavyRan` was only added after them in the same file. Run alone afterwards, the file passed 7 of 7, executed.

12.9 MB is about what `python3` holds before it makes the array. So under the load of 36 files, the readings, taken at once and then every 5 seconds, most likely all fell before the allocation or after the end. That cause was not shown and is unverified. The case fails under load, which is the kind of failure this work item exists to stop. It is a leftover for `seal/follow-up.md`, and stands in the hand-back.

**The screenshots.** `pnpm run screenshots` was run once, alone, at `c58e876`, with `OWLERY_BACKGROUND=1` and `OWLERY_SCREENSHOT_THEMES=night-watch,register`, and passed, executed. Its four shots of the Machine dialog are in `screenshots/` of this work item, in both appearances of both themes. Register draws the dialog in its own faces, and its reading in a monospace face, so it has shots of its own. `night-watch-dark-machine.png` and `register-light-machine.png` were looked at, read. They show:

- the row "Heavy commands at once" with 1 and its sentence;
- under "Running and waiting", "Sort the history by date", which runs `test`, and "scratch", which waits for `install` "in no work item";
- under "What ran", three rows, the last reading "most memory not read".

The other two shots were not looked at. No shot holds an inbox line whose heavy command waits, which stands in `gaps.md`.
