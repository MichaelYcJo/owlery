# Implementation Plan: caps on worktrees and agents

## Technical context

The tree as read at `07d5e853`.

**What the build stands on.**

- `apps/desktop/src/daemon/daemon.ts#beginHeadless` is the one door a headless session starts through. Its callers are the case `ask` of `daemon.ts#handle` and `daemon.ts#runStage`. It sets the session's time limit and calls `startHeadless` in the same turn, and that is where the queue goes.
- `daemon.ts#startSession` starts every pane, and `daemon.ts#watchProcess` learns of its exit. The count of agents changes at those two places and at `daemon.ts#headlessChanged`.
- `daemon.ts#runStage` copies the session's `startedAt` into the stage before the session ends, and `daemon/ledger.ts` writes an entry from the session when it ends. Both read the start's time, which a queued session does not have yet.
- The keep-awake choice is the pattern of a daemon's state a person changes: `daemon/keep-awake.ts#KeepAwakeStore`, `ready.keepAwake`, the message `keepAwake`, `setKeepAwake`, and the option `holdAwake`, without which the daemon sends none of it.
- `daemon/repositories.ts#RepositoryStore` reads a work item written before a field was kept with that field empty, so a stored size is read as none by a file of today.
- `renderer/view.ts` holds the window's words as functions the cases call without a window: `lineText`, `daemonStatus`, `headlessLines`, `planLine`, `stageOf`.
- The headless states are read at many places: `git grep -n -c '"working"' -- apps/desktop/src` counts 17 lines in `daemon.ts` and 19 in `renderer/view.ts`. *Scope* item 9 of `frame/design.md` says how each kind of reader takes `queued`, and the builder lists the readers with that search, as contract rule 12 asks.

**Constraints.**

- The daemon runs on Electron's Node, 24.22.3, where `fs.statfs` and `os.availableParallelism` exist (`frame/design.md` *Grounding*, the probe).
- A case starts no real `claude`. The fake adapter and a reader given as an option carry every case of the daemon, and `OWLERY_MACHINE` carries the built-app cases.
- A built-app file and `daemon.test.ts` run only while no other `vitest` runs on the machine, and every start of the app sets `OWLERY_BACKGROUND=1`. Built-app files run in one batch at a phase's end.

**The failure scenario of the chosen approach.** The count holds idle panes, because an idle agent still holds its memory. The cap is the smaller of the performance cores and the memory's number, so on the owner's Mac six live panes fill it. In six months a person keeps a Claude Code pane open in each of six work items, milestone 3's role sessions queue behind them, and the line reads "Waiting for the machine" on a machine that is doing nothing. The person raises the cap by hand, and from then on the cap follows no measurement. The second way it fails is the measurement: the proposal takes the highest of the last twenty agents, so one agent that grew large lowers the proposal until twenty more have ended. Both show in the dialog's numbers, which is why the dialog states them.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Keep `beginHeadless` as the one door, and put the queue behind it in a module of its own that says which session starts next from the count, the cap and the order | The heavy commands of #134 get a second queue with its own order and words, and milestone 3 adds the order of work items as a third | Chosen. The premise that keeps the door is that every headless start passes it, checked: `git grep -n 'beginHeadless(' -- apps/desktop/src` prints the definition and those callers. The queue's rule lives outside `daemon.ts` so #134 can read its shape |
| Replace the door with one scheduler that owns every start on the machine, panes, headless sessions and heavy commands, with a resource for each | Two work items framed in parallel build on an abstraction neither has used, and its shape is guessed before either queue has run. A pane is never held, so a third of the scheduler would decide nothing | Rejected for this release. It is the right question again when milestone 3 orders whole work items |
| Count only the agents that are working | An idle agent holds its 345 to 679 MB. The person types into six idle panes, they all work at once, and the memory the cap was to protect is already over | Rejected |
| Propose from the memory that is free now | macOS keeps free memory low by design, so the proposal would move with every read and a cap that moved would start and hold sessions for no reason a person can follow. `skills/core/SKILL.md` keeps a noisy reading out of a gate | Rejected. The total is exact and the dialog can state it |
| Measure an agent as its whole process tree | A build or a built Electron app the agent starts would count as the agent, and one broad gate would cut the proposal to a few agents. `docs/architecture.md` counts one Claude process | Rejected. The heavy commands are #134's |
| Read memory with `footprint`, as `apps/desktop/measurements/memory.md` does | It is the number Activity Monitor shows, and a resident size can read under it while memory is compressed. Its cost for a call each minute was not probed | `ps` chosen: one call for every agent in 60 ms. `gaps.md` is to say that the unit is the resident size |
| Bound the agents by the memory alone, with no cores | 27 agents on the owner's Mac, which holds 6 performance cores. The cap would then never be reached before the cores are, and it would protect nothing a person meets | Rejected by the owner's answer to `frame/questions.md` Q2 on 2026-11-25: the cap is the smaller of the performance cores and the memory's number |
| Measure a worktree when the form asks for a plan | `du` over a worktree whose files were not read yet holds the form's answer for seconds on every key | Rejected. Measured once, after the setup |
| Estimate a worktree from the sizes git lists for its tree | The install is most of a worktree and git lists none of it | Rejected |
| Give the built-app cases their caps through `limits.json` alone, with no `OWLERY_MACHINE` | The proposal's sentence and the form's warning depend on the reading, so they would be pinned on functions alone and never in the app, or would differ between the owner's Mac and the hosted runner | Rejected. One variable, set by the harness |
| Edit `docs/architecture.md` and `docs/roadmap.md` in this pull request | #134 changes *Memory design* in the same release, and two work items would each rewrite the section | Rejected. The subject is the code, so *Rule changes* states the sentences and the settle writes them |
| A control for each cap at the sidebar's foot, as keep-awake has | The foot would hold three more controls, and the numbers a proposal came from have no place there | Rejected. Q7 holds the app menu as the other place |

## Phases

Each phase ends with its cases passing through the narrow run of the files its *Verified by* cell names. The broad gate is the orchestrator's. Scenarios are those of `frame/design.md` *User scenarios & acceptance*, and items those of its *Scope*.

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1. A person sees the reading and changes a cap | *Scope* items 1, 2, 3 and 13, and item 4 less the list of the queue under the agent row, which phase 2 builds with the queue | Scenarios 1, 3, 16 and 17, scenario 10 less its four panes, which phase 4 holds, the formula of scenario 2 and the dialog's sentence of scenario 12, in `apps/desktop/test/machine.test.ts`, `apps/desktop/test/daemon.test.ts`, `apps/desktop/test/view.test.ts` and the built-app file `apps/desktop/test/machine-dialog.test.ts`. Each new case is seen red as contract rule 15 asks: by its assertion against the tree before the build where the unit it covers stood there, and under a mutant of that unit where the module or the function is new, because a file that cannot load its module shows no assertion failing | Built at `962f019`, `3c40037`, `ae0f416` and `1e80e1e`; `trail/phases/phase-1.md` |
| 2. A session over the agent cap waits | *Scope* items 5, 6, 7, 8 and 9, and the list of the queue of item 4 | Scenarios 4, 5, 6, 7, 8 and 9, and the store's twenty of scenario 2, in `machine.test.ts`, `daemon.test.ts`, `apps/desktop/test/chain.test.ts`, `apps/desktop/test/keep-awake.test.ts` and `view.test.ts`. The phase record lists every reader of a headless state the builder found and how it takes `queued` | Built at `435e96d`, `24dfec9`, `51e8273` and `ab0700b`; `trail/phases/phase-2.md` |
| 3. A creation warns | *Scope* items 10 and 11 | Scenarios 11, 12 less the dialog's sentence phase 1 built, and 13, in `daemon.test.ts`, `apps/desktop/test/repositories.test.ts`, `view.test.ts` and `machine-dialog.test.ts` | Built at `ea57413`; `trail/phases/phase-3.md` |
| 4. More panes side by side | *Scope* item 12 | Scenarios 14 and 15, and the four panes of scenario 10 with `stageOf` given the 4 of `shared/machine.ts` in place of `STAGE_PANES`, in `view.test.ts` and `machine-dialog.test.ts`, and the search of scenario 15 run at the phase's head | Built at `cc1051d` and `faacb8a`; `trail/phases/phase-4.md` |
| 5. The fragment and the screenshots | *Scope* items 14 and 15 | The screenshot run writes the views *Scope* item 15 names in each theme and appearance (`apps/desktop/test/screenshots.test.ts`). `changelog.md` states what a person sees. The answer to `frame/questions.md` Q11 is in the phase record | Built at `67cfdff`, `19370a8` and `c1074a7`; `trail/phases/phase-5.md` |

## Overlap with the release

The spawn names #134, #168, #154, #149 and #191. Each was read as its issue. None had a committed frame when this plan was written. #134's design was read in its worktree, uncommitted and without a plan (`frame/design.md` *Data & interfaces*, the seam). The others held the template alone.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #134, heavy commands wait their turn | Both designs create `daemon/machine.ts`, `limits.json`, `ready.machine`, the message `machine`, the Machine dialog, `apps/desktop/test/machine.test.ts` and `apps/desktop/test/machine-dialog.test.ts`, and both word a line "Waiting for the machine". Both change `daemon.ts`, `shared/protocol.ts`, `renderer/view.ts`, `renderer/index.html` and `docs/architecture.md` *Memory design* | #32 | The reading and the dialog are whole lines of #32's *Done when* and one clause of #134's. In this order #134 adds a key, its fields and its rows to what stands. In the other, #134 builds the reader, the store and the dialog for one number and #32 widens each. The names agree in both designs, so either order is a merge and not a rewrite, and #32 is the smaller of the two: #134 also builds a runner, a socket and the second run. #134's parts that read no machine, naming the heavy commands, its queue, the second run and the kept durations, can be built beside #32 and meet it after a merge of the release branch |
| #149, built-app files share one app | `apps/desktop/test/built-app.ts`: this work adds `OWLERY_MACHINE` to every start and one built-app file. #149 changes how every built-app file reaches the app, and resets the daemon's run folder between files, which now holds `limits.json` and `agent-memory.json` | #32 | #149 walks every built-app file in its own rounds, so one more file costs it little, and #134 waits on #32. Where #149 is sealed first, #32 merges the release branch and writes `machine-dialog.test.ts` in the form #149 left. That file sets its caps through the dialog, so it needs no start of its own |
| #154, a test start raises no notification | `apps/desktop/src/renderer/renderer.ts`, in different units: #154 the notification, #32 the `machine` message | #154 | The smaller diff, and the likelier to be sealed first |
| #191, the role refusal reaches the daemon | `daemon.ts`, where #191 drives a refused call and #32 queues behind `beginHeadless`. Its hand check starts a role session through a daemon of its own | #191 | The smaller diff. A daemon given no reader queues nothing, so its check runs as it does today |
| #168, the pane menu's cases | Nothing. It changes cases of `apps/desktop/test/terminal-basics.test.ts`, whose side-by-side cases read two tiles, which *Scope* item 12 leaves as they are | Either | No meeting |

## Operational impact

- **A new environment variable, `OWLERY_MACHINE`**, for cases and for a person who tries another machine's numbers. Unset, the daemon reads the system.
- **New files of the run folder, `limits.json` and `agent-memory.json`.** A daemon of an earlier build ignores both.
- **A new optional field on a stored work item**, the worktree's size. An earlier build reads the file as it does today.
- **A daemon of an earlier build under the new window** sends no `machine`: the window hides the Machine button and shows four panes at most.
- **The first start after the update** runs one `du` for each standing worktree, one at a time.
- **No new dependency.** `sysctl`, `ps` and `du` ship with macOS. A machine whose `sysctl` gives no performance cores reads all its cores in their place.
- **The version.** `apps/desktop/package.json` holds 0.0.3 on `release/v0.0.4` at `4a005ebf`. Where this pull request is the first of the release to merge, phase 5's commit that adds `changelog.md` moves it to 0.0.4 and rewrites `.github/workflows/owlery-seal.yml` to match (`frame/questions.md` Q11).

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-25 | The seam with #134 is #32's: #32 builds `apps/desktop/src/daemon/machine.ts`, `apps/desktop/src/shared/machine.ts` and the Machine dialog, and its pull request merges into `release/v0.0.4` before #134's phase 5 is built on them. | Two frames named the same modules, and one owner keeps one shape of `MachineReading` and of the dialog; #32 holds the reader and the dialog its issue asks for, and #134 reads `cores`, `memoryBytes` and `load` from it and adds to it (`heavyCommands`, `Machine.heavy`, fields of `setCaps`, lines of the dialog, `WorkItem.machineWait`; #134's `frame/plan.md:59`), so #134 waits on #32 and not the other way. #134's `frame/plan.md` *Overlap with the release* states the same order. | `skills/implement/orchestration.md` *Orchestrator: the order inside a ticket* |
| 2026-11-25 | Before review, a fix pass gives the sidebar foot's status sentence its own row above the icon buttons, and gives the Machine dialog's queued sessions a label of their own, "Waiting for the machine", with each session left-aligned under it | Phase 5's screenshots show the foot's sentence wrapped to six lines and the queued session unlabeled under the agents row. Both come from this work item's words, "of 4" and ", 1 waiting", and the queue row. No plan row builds either layout, so the orchestrator sends a fix pass rather than leaving a visible defect to a round | `docs/design.md`, which asks that a changed part read right in each theme that draws it, and `frame/design.md` *Scope* items 4 and 8, which give the dialog and what a person sees of the queue |
| 2026-11-25 | The pull request's title takes `feat:`, and the kind that came closest is `fix:`. | The issue reports a machine that slows under many worktrees and agents, which reads as a fault. But no document of the base tree states a cap on worktrees, agents or panes beside the fixed `STAGE_PANES` of four, so no rule of the base is broken, and the caps, the reading and the dialog are new. The issue's title and the branch already take `feat:` | the plugin's `skills/commit-pr-convention/SKILL.md` *Commit messages* |
| 2026-11-25 | The fix pass of round 1 writes the *Components and their states* rows of the Machine dialog, of the creation form's warning lines and of the stage laid out in three and four columns, in both editions of `docs/design.md` | Round 1 left the question to the orchestrator or the owner. The principle answers it: a change that needs a form the document does not state adds it in the pull request that draws it, in both editions, and leaves none to the settle | `docs/design.md` *Principles*, item 8 |
| 2026-11-25 | The creation form's warning lines take no `--state-waiting` yellow: they are drawn in the theme's inks, as a hover or a selection is | Each theme spends its one signal on a work item that needs the person. A warning on a form the person has open is no work item's state, so it takes the theme's inks | `docs/design.md` *Principles*, item 3 |
| 2026-11-25 | A cap a person types that equals its default is kept as typed, and stays fixed when the default later moves, as built | Round 1 left it to the owner. The dialog's "Use the default" button is the way back to a cap that follows its default, so a typed number reads as the person's choice. The owner can reverse it in a later issue at no cost to this one | `frame/design.md` *Scope*, item 3 |
