# Phase 1: 1795559736-caps-on-worktrees-and-agents

## What this phase found

The frame held. The crafter checked its paths and its patterns against the tree before building: `daemon/keep-awake.ts#KeepAwakeStore` and the option `holdAwake`, `daemon/whole-file.ts#writeWholeFile`, `apps/desktop/test/built-app.ts#appEnv`, and `renderer/view.ts` as the home of the window's words all stand as `frame/plan.md` *Technical context* states. The departures below are the frame's details the tree or the build asked to change. None of them changes a field's meaning in `frame/design.md` *Data & interfaces*.

**The frame's numbers read memory in binary units and disk in decimal ones.** Scenario 1 states 38,654,705,664 bytes of memory as "36 GB", which is 36 × 1024³, and 679 MB an agent, which is 679 × 1024². It states 25,088,950,272 bytes free as "25.1 GB", which is the count over 10⁹, and scenario 11 keeps "10 GB" free as 10,000,000,000 bytes. The crafter followed each as the frame's numbers give it: `shared/machine.ts` words memory in GiB and MiB and disk in GB and MB of 10⁹ and 10⁶, and says "GB" for both. A person reads "36 GB" as Apple's About This Mac does, and "25.1 GB free" as Finder does. Judged against `frame/design.md` *User scenarios & acceptance*, scenarios 1 and 11.

**`OWLERY_MACHINE` takes an optional `load`, 0 where it is absent.** `frame/design.md` *Data & interfaces* lists five fields and no load. The reading's line in the dialog states the load, so a reading the variable holds needs one, and a fixed 0 keeps the built-app case's sentence the same on every machine, which scenario 16 asks. The five fields stay required. Judged against `frame/design.md` *Data & interfaces* and scenario 16.

**`readMachine` takes the environment and, for the cases, the probes it calls.** The seam with #134 names it `readMachine()`. The crafter kept the name and gave it `env` and an optional set of probes (`MachineProbes`), so `daemon/main.ts` passes `process.env` and the cases pass a `sysctl` that prints what scenario 17 asks without running the program. #134's design calls it from the daemon's start as this work does, so the arguments add to the name the seam fixed and change no part of the seam. Judged against `frame/design.md` *Data & interfaces*, *The seam with #134*.

**Scenario 2's formula is built in this phase, and the store of twenty measures is not.** *Scope* item 2 owns the formulas, so `agentsProposal` takes the list of measures and is tested on five and on four (`apps/desktop/test/machine.test.ts`). The daemon passes an empty list until phase 2 builds *Scope* item 5's measurement and `agent-memory.json`. The window's sentence for one to four agents measured reads "not measured on this Mac yet: 4 agents of the 5 it takes". The frame words only none and five or more, and a person who sees 679 MB beside some measures would otherwise not know why. Judged against `frame/design.md` *Scope* items 2 and 5 and scenario 2.

**The count of the agents that run is built in this phase, and the queue is not.** *Scope* item 3 has `ready` and `machine` carry "the counts". The daemon counts the live panes of a kind that reports its state and the working headless sessions, as *Scope* item 6 defines them, and tells every client when the count changes. `queue` is always empty until phase 2 builds the queue. For the same reason the list of the queue under the agent row, which *Scope* item 4 asks for, is phase 2's. Phase 1 has no queued session to list. Judged against `frame/design.md` *Scope* items 3, 4 and 6 and `frame/plan.md` *Phases*.

**The worktrees' proposal is null in this phase.** It needs a worktree measured, which *Scope* item 10 builds in phase 3, so the row says "Nothing is proposed until a worktree is measured on this Mac.", as scenario 12 words it. A person may still set a worktree cap, and the daemon keeps it. Judged against `frame/design.md` *Scope* items 10 and 11 and scenario 12.

**Every work item the daemon keeps counts as a standing worktree, the archived among them.** An archive removes nothing (`docs/product.md`, the rule that Owlery deletes nothing of a person's work without that person's word), so an archived work item's worktree still holds its disk. Judged against `docs/product.md` and `frame/design.md` *Scope* item 11.

**`setCaps` takes every field or none.** The daemon reads each field before it takes any, so a message with one refused value changes, writes and tells nothing, and the error carries the first refused value's sentence. A field set to the value it holds is no change: the daemon answers `done` and writes and tells nothing. A daemon given no reader answers `setCaps` with an error, "This daemon keeps no cap on the machine.", so a window that asks is answered and not left waiting. A write of `limits.json` that fails leaves the caps in memory, as `LimitsStore` holds them before it writes, and is said in the daemon's log. Judged against `frame/design.md` *Data & interfaces*, the sentence on `setCaps`, and *Scope* item 1.

**The daemon reads the machine at its start and at each hello.** The load and the free disk change, and *Data & interfaces* reads the load "at each ask", so a window that connects is sent them as they are then. `readMachine` reads them again and answers the asking client alone. Judged against `frame/design.md` *Data & interfaces*.

**The window refuses a value before it sends it, in the daemon's sentence.** `renderer/view.ts#capChanges` calls `shared/machine.ts#capRefusal`, the function the daemon calls, so the two sentences cannot differ. It takes digits alone as a number, so "1e1" and "2.5" are refused as a person reads them. "Use the default" takes effect at Save, as Cancel takes back every other change. A Save that changes nothing closes the dialog and sends nothing. "Use the default" is offered wherever a cap is set, even to the value of the proposal: a set cap stays where the person put it when the proposal moves, which is the difference *Scope* item 4's "where the person's value differs" draws. Judged against `frame/design.md` *Scope* items 2 and 4 and scenario 3.

**The dialog's rows are made once for each opening and filled in place after.** The dialog sends `readMachine` as it opens, so a `machine` arrives while the person may already be typing. Drawing the rows again would take the field from under them. The field a person typed in keeps what they typed. Judged against `frame/design.md` *Data & interfaces*, the sentence on `readMachine`.

**`apps/desktop/test/built-app.ts` sets `OWLERY_MACHINE` before the case's own environment**, so a case can give another reading. Judged against `frame/design.md` *Scope* item 13.

**Nothing of the pane cap is built in this phase.** The window's four panes at most against a daemon that keeps no cap, which scenario 10 names, is `STAGE_PANES` as it stands, and phase 4 replaces it. Phase 1 has the window hide the Machine button against such a daemon, which `view.test.ts` holds on `machineDialog`. Judged against `frame/plan.md` *Phases*, rows 1 and 4.

**The reds.** Before the build, `machine.test.ts` was red as a file that could not load its module, and the new cases of `view.test.ts` as functions that did not exist. Neither red shows a case's assertion, so for those files the mutation runs below are the reds that do. `daemon.test.ts` was red on its ten first cases, by their assertions and by their waits for a message that never came. The cases added after the first build were each seen red under a mutant of the unit they cover.

**The mutation runs, one `seal mutate` batch for each unit that adds behaviour.** The first batches went red on 61 mutants of 69. Each of the 8 survivors was a behaviour no case held:

| Unit | Mutants | Red | Survived, and the case added for it |
|---|---|---|---|
| `shared/machine.ts`, under `machine.test.ts` and `view.test.ts` | 20 | 19 | The plural in "1 agent". The partly measured case now names one agent |
| `daemon/machine.ts`, under `machine.test.ts` | 16 | 10 | A path through a file, any other error of `statfs`, an empty `OWLERY_MACHINE`, a negative number, a number past what a number holds, and performance cores in a fraction. Each now has a case |
| `renderer/view.ts`, `machineDialog` and `capChanges` | 10 | 10 | None |
| `daemon/daemon.ts`, the caps, under `daemon.test.ts` | 19 | 19 | None |
| `renderer/machine.ts`, under the built-app file | 4 | 3 | A redraw that took what a person typed. A case now has another client set a cap while the dialog holds typing |

Each survivor's mutant then went red against its new case. The mutant of the redraw also turned the refusal's case red.

**Each case of `machine.test.ts` and each case of `machineDialog` and `capChanges` in `view.test.ts` went red under at least one mutant.** The batch logs above give a verdict for each mutant and do not name the cases. So the crafter ran a probe after phase 1 closed. It ran each of the 47 mutants of `shared/machine.ts`, `daemon/machine.ts` and `renderer/view.ts` alone over both files, with the verbose reporter, and listed the cases each mutant turned red. 26 of the 32 cases, the case `575aeac` added after phase 1 among them, went red under one mutant or more. Six went red under none, and five more mutants were run for them:

| Case | The mutant that turned it red | What the mutant removes |
|---|---|---|
| `OWLERY_MACHINE` that holds an object without the free disk | `amount`'s check made `if (false)` | The check of each amount |
| `OWLERY_MACHINE` that holds a number given as text | the same | The same |
| `OWLERY_MACHINE` that holds text that is no JSON | `givenReading` returning a fixed reading for any text | Every refusal at once |
| `OWLERY_MACHINE` that holds JSON that is no object | the same | The same |
| `limits.json` that holds JSON that is no object | `LimitsStore` taking each value without `capRefusal` | The check of each stored value |
| `limits.json` that holds text that is no JSON | `LimitsStore` taking `{ "agents": 3 }` where the text does not parse | The fallback to no cap |

Two guards hold each of three cases, so no mutant of one guard alone turns them red. For `OWLERY_MACHINE` that holds text that is no JSON, these are the parse's `catch` and the checks of the fields. For `OWLERY_MACHINE` that holds JSON that is no object, they are the check of each amount and the check of the whole cores. For `limits.json` that holds text that is no JSON, they are the parse's `catch` and `capRefusal`. Those three cases pin the outcome and not one guard of it. The new case of a cap set to the value of its proposal (`575aeac`) went red under the mutant `isDefault: set === null || set === proposed`. Before that case existed, the same mutant survived.

**A probe of the system reader, run once under Electron's Node on the owner's Mac without `OWLERY_MACHINE`**, read 38,654,705,664 bytes, 12 cores, 6 performance cores and the disk of the worktrees' folder, and its first read took 4.9 ms. One case of `machine.test.ts` runs the real `statfs`. No case runs the real `sysctl`, so this probe is its only run.

**The *Phase boundary* set was 39 test files in one command, at `1e80e1e`, and passed: 37 files and 1,637 cases, with 2 files and 6 cases skipped.** The set holds the files the plan row names, the files the phase changed, the files that import a changed path or start the app built from one, and `themes.test.ts`, which reads every module of the renderer. No contribution guide names tree-wide test files, so `themes.test.ts` stands for them as the file that reads the directory of a changed path. Six of the files import `shared/protocol.ts` alone of the changed paths, and this phase added only types there. The set holds them all the same. The skipped cases should be those that run only where a variable asks for them: a real `claude` session or pane, the screenshots and the memory measurement. The crafter did not list them one by one.
