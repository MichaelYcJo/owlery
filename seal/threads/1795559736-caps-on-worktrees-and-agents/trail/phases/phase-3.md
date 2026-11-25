# Phase 3: 1795559736-caps-on-worktrees-and-agents

## What this phase found

The frame held. Each detail it does not spell out is below, with the form it was built in, and none changes a field's meaning. Before building, the crafter checked the paths phase 3 builds on: `daemon.ts#startSetup`, `#setupExited`, `#workItemOf`, `#machineNow`, the cases `createWorkItem` and `planWorkItem` of `#handle`, `repositories.ts#StoredWorkItem` and `#setWorkItem`, `machine.ts#readMachine`, `view.ts#planLine`, and the plan's handler and `#showPlan` in `renderer.ts`. Each stands as `frame/plan.md` *Technical context* and `frame/design.md` *Scope* items 10 and 11 state.

**The size is `worktreeSize: { kilobytes, measuredAt } | null` on the stored work item, and no client is sent it.** *Data & interfaces* says the stored work item gains the measured size in kilobytes and the time of the measure. `daemon.ts#workItemOf` leaves the field out of the work item a client is sent. The window reads the size only as what a plan says the repository's next worktree needs, so nothing in the protocol's `WorkItem` changes. A file that holds a size of another shape is no store's, as a file with a malformed account is. Only the daemon writes the field: the client's `setWorkItem` names its fields one by one, and the size is not among them. Judged against `frame/design.md` *Data & interfaces*.

**When a worktree is measured.** Each measure waits for the one asked before it (`daemon.ts#measureWorktree`), so the daemon runs one `du` at a time.

- At a creation whose setup runs no pane, the measure is asked at once. That is a repository that names no setup, one whose setup only copies files, and one whose setup pane could not start.
- Where a setup pane runs, the measure comes when that pane exits, whatever its exit code. *Scope* item 10 says "when its setup's pane exits", and a failed setup still leaves a worktree.
- At a daemon's start, every stored work item that has no size is measured, in the store's order. Archived work items are included, as the worktrees that stand count them (phase 1's `standing`).
- A work item that has a size is never measured again: not when its setup runs a second time, and not at the next start.
- A measure that gives no size keeps none, as where `du` prints nothing for a folder that is gone. The next daemon measures that work item again.

Judged against `frame/design.md` *Scope* item 10 and scenario 13.

**Under `OWLERY_MACHINE` the reader measures no folder.** In phase 2 the reader under that variable reads no process's memory, so that a built-app case reads the same proposal on every machine. It now measures no folder either: its `sizeOf` gives none. The built-app case of scenario 11 therefore writes the measured worktree into the run folder before the app starts. Judged against `frame/design.md` *Scope* item 13 and scenario 16.

**A plan carries no `disk` where the reading holds none.** *Data & interfaces* gives `freeBytes` as a number. So the daemon sends no `disk` where it was given no reader, and where it read no disk. The form then shows no warning. A folder that names no repository gets no plan at all, but the daemon's refusal. A plan reads the machine anew, so the free disk is the one at the moment the person types. `needsBytes` is the largest worktree measured in the plan's repository: a stored work item whose repository's main checkout is the folder `worktrees.ts#repositoryOf` gives for the field's text. Judged against `frame/design.md` *Data & interfaces* and *Scope* item 11.

**The cap a plan carries is the one a person set, or the proposal, and on a nearly full disk the form then says both warnings.** *Scope* item 11 has the plan carry "the cap", and the agent cap follows the same reading: set, or else proposed. Where no person set a cap on worktrees, the proposal is the worktrees that stand, plus as many more as the free disk holds at the largest worktree measured anywhere (*The caps, in numbers*). On a disk that cannot hold one more such worktree, the proposal equals the worktrees that stand. So the form says both sentences: "The disk may not hold this worktree: 10.2 GB free, 10 GB kept free, and a worktree of this repository takes 440 MB. This is worktree 2 of a cap of 1." The built-app case of scenario 11 reads both sentences. The two warnings can also disagree. The repository's own worktrees may be smaller than the largest measured in another repository. Then the cap's sentence shows and the disk's does not. Whether the cap's warning should read only a cap a person set is a question for whoever owns the frame. The hand-back names it. Judged against `frame/design.md` *Scope* item 11, scenario 12 and *The caps, in numbers*.

**The form's sentences are `shared/machine.ts#planWarning`.** They stand beside the other sentences of the caps, which share their way of writing disk sizes. `view.ts#planLine` gives the result as `warning`, and `renderer.ts` draws it in `#work-item-warning`, a line under the plan in the colour of a waiting state that is hidden while empty. The disk's warning shows where the free disk less what the repository's worktree needs falls under the 10 GB kept free. With exactly 10 GB left, it does not show. The cap's warning shows where the worktrees that stand are as many as the cap or more. Judged against `frame/design.md` *Scope* item 11 and scenarios 11 and 12.

**`du` runs as `/usr/bin/du -sk <folder>` with a limit of two minutes.** `du` exits 1 where a file under the folder cannot be read, and still prints the size of the rest, so its output is read whatever the exit code, as `ps`'s is.

**The reds.** Before the build, the new cases ran against the tree.

- In `repositories.test.ts`, the new case was red by its assertion: a new work item's `worktreeSize` read undefined. The other 13 cases that compare a whole stored work item were red too, since the constant they share gains the field.
- In `view.test.ts`, the two new cases of `planLine` were red by their assertions, and the three changed ones, which now hold `warning`, were red as well.
- In `machine.test.ts`, the new case was red because the reader's `sizeOf` did not exist.
- In `daemon.test.ts`, the three new cases were red: by a wait for the measure that timed out, by the `sizeOf` calls that never came, and by the plan's missing `disk`. The changed case of scenario 10, which now also asks a plan, passed: a daemon with no reader already sent no `disk`.
- The built-app case of `machine-dialog.test.ts` was red: the page had no `#work-item-warning`.

After the build, the built-app case failed once more. It had expected the disk's sentence alone, and the form said both sentences, as above. The case's expectation was corrected, and the case was also given the form's text to report on any later failure.

**The mutation runs.** Each mutant ran alone through `seal mutate`, with the verbose reporter, over the cases of its unit, and its run listed the cases that went red. Before the pass, the crafter added a second run of the setup to the measure-once case, since a mutant that measured a worktree again would have shown only there. It also made the unmeasured line of the disk's case read 9.9 GB free, under the 10 GB kept free, so that a warning that ignores the missing measure shows on it. All 28 mutants went red.

| Unit | Mutants | Red |
|---|---|---|
| `daemon/daemon.ts`, under the caps group of `daemon.test.ts` | 15 | 15 |
| `daemon/repositories.ts`, under `repositories.test.ts` | 4 | 4 |
| `daemon/machine.ts`, under `machine.test.ts` | 2 | 2 |
| `shared/machine.ts#planWarning` and `renderer/view.ts#planLine`, under `view.test.ts` | 5 | 5 |
| `renderer/renderer.ts`, under the built-app case of `machine-dialog.test.ts` | 2 | 2 |

The mutants of `daemon.ts` were: no measure at the start; a measure of a worktree that has a size; a measure at a creation whose setup runs; none at a setup pane's exit; measures that do not wait in turn; a kept size where none was measured; no `machine` sent after a measure; the largest of every repository in a plan; the smallest in place of the largest; a plan's stale disk; the proposal in place of a cap a person set; a `disk` sent where none was read; a proposal that reads no measure; the size sent to a client; and the wrong time of the measure. The `du` arguments of the system's probe had no mutant, since no case runs the real `du` (`gaps.md`).

**Each new case went red under at least one mutant.** The 8 new cases are 3 of `daemon.test.ts`, 1 of `repositories.test.ts`, 1 of `machine.test.ts`, 2 of `view.test.ts` and 1 of `machine-dialog.test.ts`. The changed case of scenario 10 went red under the mutant that sends a `disk` where none was read. The crafter's scratch holds each mutant's run and the cases it turned red.

**The *Phase boundary* set was the 39 test files of phases 1 and 2, in one command, and passed at `ea57413`: 37 files and 1,676 cases, with 2 files and 6 cases skipped.** The 1,676 are phase 2's 1,668 and the 8 new cases. The files the plan row names are all among them. So are the files the phase changed and every test file that imports `daemon/repositories.ts`, `daemon/machine.ts`, `shared/machine.ts` or `renderer/view.ts`, as are the built-app files, which start the app built from the changed renderer.
