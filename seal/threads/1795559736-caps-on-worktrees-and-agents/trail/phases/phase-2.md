# Phase 2: 1795559736-caps-on-worktrees-and-agents

## What this phase found

The frame held. Three of its details departed in the build: the file `ledger.test.ts`, the type of `RoleRun.pid` and when `queuedAt` is sent, each below. None changes a field's meaning. The crafter checked the paths phase 2 builds on before building: `daemon.ts#beginHeadless`, `#headlessChanged`, `#stopHeadless`, `#runStage`, `#runningIn`, `#runningUnder`, `#works` and `#close`, `keep-awake.ts#wantsAwake`, `adapters/adapter.ts#RoleRun`, and the renderer's `view.ts#lineText`, `#daemonStatus`, `#headlessLines` and `#chainSays`. Each stands as `frame/plan.md` *Technical context* and `frame/design.md` *Scope* items 5 to 9 state.

**`apps/desktop/test/ledger.test.ts` gains no case.** `frame/plan.md` *Phases* row 2 names it for scenario 7. That file tests `daemon/ledger.ts#Ledger`, and this phase does not change the Ledger. An entry's `startedAt` is `daemon.ts#enter`'s copy of the session's `startedAt`, which the start of a queued session sets again. So scenario 7's entry time is held where the daemon writes it. `daemon.test.ts` asks the ledger of a session that waited, and `chain.test.ts` asks the ledger of a stage that waited. Each reads the time of the start, not the time the session joined the queue. Judged against `frame/plan.md` *Phases* and `frame/design.md` scenario 7.

**`RoleRun.pid` is optional, `pid?: number`, not `pid: number | undefined`.** The meaning is the one *Data & interfaces* gives: the agent's own process, and none for the fake adapter. A required field would make every run a case builds by hand name it. The Claude adapter gives the CLI's `child.pid`. Judged against `frame/design.md` *Data & interfaces*.

**`queuedAt` is sent only on a session that waited.** *Data & interfaces* gives `queuedAt?: number | null`, null for one that never waited. A session the daemon starts at once carries no such field, and a client reads an absent field as null, as it reads one from a daemon of an earlier build. So no case that compares a whole session changes, and the field's meaning stays as the frame binds it. Judged against `frame/design.md` *Data & interfaces*.

**The queue's rule is `daemon/agent-queue.ts`, apart from the daemon.** `queueOrder` sorts by rank, then by the order the sessions joined. That order is a count the daemon raises at each join, not a time, so two sessions that join in one millisecond keep their order. `placesFree` gives the places under the cap. The daemon holds the queue as a map of what each session waits as, and starts sessions from `drainQueue`. `drainQueue` refuses to run inside itself, so a start that tells the clients drains nothing again. The module knows no session, so #134 can read the shape of a second queue from it. Judged against `frame/plan.md` *Technical context* and `frame/design.md` *Scope* item 7.

**"A stage of a chain that has already run a stage in this run" is counted from the chain's start.** The daemon keeps, for each work item whose chain runs, whether the chain has begun a stage since `startChain`. It clears that when the run rests or stops. A chain started again after it stopped waits as a first stage again. A case holds this: it stops a waiting round, starts another chain's first stage, then starts the first chain again, and the first chain's round waits behind the other. Judged against `frame/design.md` *Scope* item 7 and scenario 6.

**A queued session gets its limit, its `startedAt` and its stage's `startedAt` at its start.** A queued session's `startedAt` holds the time it joined the queue until it starts, which *Data & interfaces* leaves open. `runStage` lists the stage when the session begins, and a start of a waiting session replaces the stage with one whose `startedAt` is the start's. Judged against `frame/design.md` *Scope* item 9 and scenario 7.

**Every reader of a headless state, and how it takes `queued`.** `frame/plan.md` *Phases* row 2 asks for this list. The crafter made it from `git grep` on `"working"`, `"finished"` and `"failed"` in `apps/desktop/src`, read with each reader's unit, and from the `Record<HeadlessState, …>` maps a typecheck would refuse without a `queued` key. The typecheck found none.

| Reader | Takes `queued` as |
|---|---|
| `daemon.ts#headlessChanged` | Not ended. It ends only `finished` and `failed`, and only an ended session gets its entry, leaves the queue and counts toward the bound of the ended sessions |
| `daemon.ts`, the `stopHeadless` request | Running. A stop ends it as `failed` with `stopped: "request"` |
| `daemon.ts#stopHeadless` | Running, with no run to stop. A session stopped while it waited gets no entry in the ledger, since nothing ran |
| `daemon.ts#runningIn`, and so `#runningTold` and `#endSessions` | Running. An archive, a delete and a removal of its repository name it, and end it |
| `daemon.ts#runningUnder` | Running. An account it would run under cannot be removed, and its usage is not refreshed, as the daemon refuses for a working session |
| `daemon.ts#works`, and so `#whyNoChain` and `#commitWord` | Not working |
| `daemon.ts#agentsRunning` | Not an agent that runs |
| `daemon.ts#checkIdle` | Not busy. A session waits only while an agent runs, and that agent keeps the daemon busy, so reading it would change nothing |
| `daemon.ts#close` | No entry in the ledger. It writes one only for a session that works, as before |
| `daemon.ts#startHeadless` | Never seen: a queued session's run starts only once it works |
| `keep-awake.ts#wantsAwake` | Not working, unchanged. A case pins that a queued session alone holds nothing |
| `last-look.ts`, line 33 | Not read: it reads a pane's state, not a headless one |
| `view.ts#headlessLines` | "Queued", with the mark of no agent and "Stop" offered |
| `view.ts#runningIn`, and so `#archivalOf`, `#removalOf` and `#runningSessions` | Running. The dialogs name it, and the ids they send hold it, so the daemon's `runningTold` takes the request |
| `view.ts#lineAccount` | Running under its account |
| `view.ts#accountRows` | Running, so "Refresh usage" is not offered under its account, as the daemon refuses |
| `view.ts#gateLine` | Not read: it reads a chain's stage |

**The window's words.** The line's second row says "Waiting for the machine (2 ahead)", or "Waiting for the machine" with none ahead. The count is the sessions before the work item's first waiting session in the daemon's queue (`view.ts#queuedAhead`). The text comes after a stopped chain's sentence and before the stage, and not while a search is typed, as *Scope* item 8 orders it. The chain's foot says the same while the chain runs. Against a daemon that keeps the caps, the status line counts the daemon's agents, which include its working headless sessions, against the cap, and then the sessions that wait. It says "no agent" where nothing runs and nothing waits, as it does against a daemon with no cap, so the status line reads the same where no agent runs. Where one waits and none runs it says "0 agents of 6, 1 waiting". The Machine dialog lists under the agent row each waiting session by its work item's title and what it waits to run: a stage by the stage's short name, as the line names it, and a person's session as "Asked:" and its prompt. A session the window does not hold yet is listed as "Session" and its number. A queued session's line takes the mark of "no agent", since it runs no process. The first build gave it a style rule of its own, `.state.queued`, which drew with the same tokens. `themes.test.ts` refused that in the first boundary run: every state the page styles must have its own tokens in every theme. A state of its own would ask each theme for a colour and shapes, which is `docs/design.md`'s to decide. So the line's mark is `no-agent`, its words say "Queued", and the page holds no new state (`ab0700b`). Judged against `frame/design.md` *Scope* items 4 and 8, `docs/design.md`, and the phase 1 record's sentence on the status line.

**The daemon tells the machine when the count or the queue changes.** Phase 1 told every client only when the count changed. A session that joins or leaves the queue changes no count, so the daemon now compares the count and the queue together. After a cap rises, the daemon starts the sessions the cap now allows before it tells the clients, so the machine they are told holds those sessions as running. Judged against `frame/design.md` *Scope* item 3.

**The memory is read once a minute for the daemon's life, and nothing is read while no agent lives.** The first build started the timer with the first agent and stopped it with the last. A mutant that never stopped the timer survived. A timer that finds no agent calls no `ps`, so the two builds differ by a wake-up a minute and by nothing a case or a person can see. The timer now runs from the daemon's start to its close, and is unreferenced so it holds no process open. The first reading comes one interval after an agent starts. A process read at its start uses a fraction of what it will use, so a first reading at once would make an agent that lives less than a minute seem smaller than it is. The daemon names each agent by its pane or session, keeps its highest reading, and forgets the name once the agent is no longer read. A measure that changes the proposal tells every client and starts the sessions the new proposal allows. Judged against `frame/design.md` *Scope* item 5 and `frame/plan.md` *Alternatives considered*, the row on `footprint`.

**The reds.** Before the build, the new cases ran against the tree.

- In `daemon.test.ts`, 4 of the 7 cases written first were red by their assertions or by a wait that timed out. Three passed: a pane opens at the cap, a raised cap lets an asked session run, and a daemon with no reader queues nothing. Each pins what the tree already did, where nothing queues.
- `chain.test.ts`'s first case was red by its wait for the second chain's first stage to queue.
- In `view.test.ts`, 8 new cases and 2 changed ones were red: 8 by their assertions, and 2 where the function did not exist. The changed ones are the cases of `lineAccount` and of the offer of "Refresh usage".
- In `machine.test.ts`, 6 cases were red because the store and the reader's call did not exist.
- `keep-awake.test.ts`'s case passed: `wantsAwake` already reads `working` alone.

The cases that passed before the build, and the cases added after it, were each shown red under a mutant, as the table below gives.

**The mutation runs.** Each mutant ran alone through `seal mutate`, with the verbose reporter, over the cases of its unit, and its run listed the cases that went red. The first pass wrote 50 mutants. The mutant of `keep-awake.ts` did not start, as its command named an environment variable the way `seal mutate` does not take, and it went red when run again. 45 of the other 49 went red. The four survivors each named behaviour no case held:

- the timer that stopped with the last agent, now replaced as above;
- a working headless session's process;
- the chain's record of a stage begun, cleared at the chain's end;
- the start of the waiting sessions after a measure raised the proposal.

Three cases were added for the last three (`51e8273`). Two of those mutants were written again, since the first form of each also changed the line after it. All three then went red. Two more mutants were run for the cases no mutant had turned red yet: a cap of 1 where the daemon has no reader, and a count that stops at one pane. Both went red.

| Unit | Mutants | Red |
|---|---|---|
| `daemon/daemon.ts`, under the caps group of `daemon.test.ts` and the two chain cases of `chain.test.ts` | 25 | 24. The survivor's code was replaced |
| `daemon/machine.ts`, under `machine.test.ts` | 10 | 10 |
| `daemon/agent-queue.ts`, under `machine.test.ts` | 3 | 3 |
| `renderer/view.ts`, under `view.test.ts` | 14 | 14 |
| `daemon/keep-awake.ts`, under `keep-awake.test.ts` | 1 | 1 |

**Each new case went red under at least one mutant.** The 30 new cases are 10 of `daemon.test.ts`, 2 of `chain.test.ts`, 9 of `machine.test.ts`, 8 of `view.test.ts` and 1 of `keep-awake.test.ts`. The two changed cases of `view.test.ts` went red under the mutant of `view.ts#headlessRuns`. The crafter's scratch holds each mutant's run and the cases it turned red.

**Not built in this phase.** The renderer's calls in `list.ts`, `sidebar.ts`, `work-item-view.ts`, `machine.ts` and `renderer.ts` were read, not run. No built-app case queues a session: a built-app session runs the real `claude` once it starts, and the spawn forbids starting one. `gaps.md` names who answers them. The `ps` call was not run against a live agent.

**The *Phase boundary* set was the 39 test files of phase 1, in one command, and passed at `ab0700b`: 37 files and 1,668 cases, with 2 files and 6 cases skipped.** The files the plan row names, the files the phase changed, and the files that import a changed path or start the app built from one give the same set as phase 1's, with `themes.test.ts`. It ran three times. The first run, at `51e8273`, failed the two cases of `themes.test.ts` that the mark above answers. The second, at `ab0700b`, failed 89 cases of `daemon.test.ts`, each with `posix_spawnp failed` at a pane's start. The ptys were exhausted: the limit is 511. When the crafter looked after the run, another worktree's run was going, which the wait before the run had not seen. That run likely took the ptys, but the crafter did not count them during the failure. The third run, at the same commit, passed. No run in another worktree was going when it started.
