# Review round 1: 1795559736-caps-on-worktrees-and-agents

```seal
target: ad6f1928 against release/v0.0.4
```

The range is the work item's own diff, `git diff origin/release/v0.0.4...ad6f1928`, with `origin/release/v0.0.4` at `3b1d33c3`. It holds the five phases, the fix pass `c290ca9b` and the records after it. The merge `1770e724` brought in the release's six commits, which this round leaves out. This is the first round, so no earlier round hands it a coordinate, and every fact below was established here.

The records read whole at `ad6f1928` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and the five `trail/phases/` records. No `pr.<lang>.md` is owed, since `seal/config.json` names English for `Commit and pull request language`. No `seal/parity.json` stands, so no parity comparison applies. The four screenshots under `screenshots/` were opened and read.

The code read is every source file of the diff: `daemon/machine.ts`, `daemon/agent-queue.ts`, `shared/machine.ts`, the `daemon.ts` hunks, `daemon/main.ts`, `daemon/repositories.ts`, the two adapter hunks, `shared/protocol.ts`, `renderer/machine.ts`, the `view.ts`, `work-item-view.ts`, `renderer.ts`, `list.ts`, `sidebar.ts` and `shared.ts` hunks, and `renderer/index.html`. Each call the change adds into code it does not change was followed: `endSessions`, `stopHeadless`, `startHeadless`, `checkIdle`, `works` and `setWorkItem` in `daemon.ts`, and `chainOf` and `askButton` in `view.ts`.

The axes walked: inputs (`OWLERY_MACHINE`, `setCaps`, `limits.json`, `agent-memory.json`, the dialog's fields), query scope (which panes and sessions count, which work items stand), boundaries (the cap's count, the disk's 10 GB, the memory steps of the pane cap, 16 tiles), deliberate non-exclusions (archived work items counted as standing; panes never held), response shape (`Machine`, `PlanDisk`, `HeadlessInfo.queuedAt`, walked from *Data & interfaces*), error paths, state transitions of a headless session (`queued` to `working`, `failed` or `finished`), concurrency (a drain of the queue run inside a stop, a measure that outlives its work item), security (`du` and `ps` arguments, `OWLERY_MACHINE` text), and this change's own axes: units of memory and disk, and the lifetime of the measures and the timer.

## Findings

### 1. A headless session counts itself before the cap is compared, so it is listed `queued` with a `queuedAt` one place under the cap

```seal
severity: must
location: `apps/desktop/src/daemon/daemon.ts:2263-2267`, `apps/desktop/test/daemon.test.ts`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts` in the round's clone; read `apps/desktop/src/daemon/daemon.ts:2243`, `apps/desktop/src/daemon/daemon.ts:2263-2267`, `apps/desktop/src/daemon/daemon.ts:3637-3640`
```

Why it matters: `frame/design.md` *Scope* item 6 queues a session where the count of the agents that run "is at the cap or over it", and *Data & interfaces* says "The daemon leaves the field out for a session that never waited." The code breaks both one place under the cap.

`beginHeadless` makes the session with `state: "working"` (`daemon.ts:2243`). It puts the session into `this.headless` at line 2263, and only then compares `this.agentsRunning()` with the cap at line 2265. `agentsRunning` counts every headless session whose state is `working` (`daemon.ts:3639`), the new one among them. So a session asked while one place is free counts itself, fills the place, and is listed `queued` with `queuedAt` set (line 2267). `headlessChanged` then drains the queue, which starts it in the same turn. It keeps its `queuedAt`.

The probe set the cap to 1 with no pane and no session, and asked one prompt. The `asked` answer carried `state: "queued"` where the probe expected `working`. Every client is told the session as queued, and the status line can count "1 waiting" for a session that never waited. A chain stage begun at that count is listed as waiting too. The cases at the cap do not show it: `atCap` in `daemon.test.ts` holds the place with a pane, so the count is over the cap with or without the new session.

The fix reads the count before the session is listed. It changes only the comparison, so the rest of the function stands. The fix pass also owes a case in the caps group of `apps/desktop/test/daemon.test.ts`. That case sets a cap of 2, opens one Claude Code pane and asks one prompt. It then asserts that the `asked` answer's state is `working` and that the session carries no `queuedAt`. Against today's code it is red on the state.

```ts
    const cap = this.agentsCap();
    // The count is read before the session is listed: it is listed as working, and would count itself.
    const full = cap !== null && this.agentsRunning() >= cap;
    this.headless.set(session.info.id, session);
    if (full) {
```

### 2. An archive, a delete or a removal starts a queued session of the very work item it is ending, and writes its entry in the ledger

```seal
severity: must
location: `apps/desktop/src/daemon/daemon.ts:2087`, `apps/desktop/test/daemon.test.ts`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1b.test.ts` in the round's clone; read `apps/desktop/src/daemon/daemon.ts:2085-2105`, `apps/desktop/src/daemon/daemon.ts:2115-2123`, `apps/desktop/src/daemon/daemon.ts:3751-3755`
```

Why it matters: `frame/design.md` *Scope* item 9 says an archive, a delete and a removal "name it and end it", and scenario 9 says the next in the queue "is not started in its place unless the count allows". `trail/phases/phase-2.md` claims that a queued session stopped this way "gets no entry in the ledger, since nothing ran".

`endSessions` stops the work item's headless sessions one by one, in the order of `this.headless`, which is the order of their ids (`daemon.ts:2087`). A working session of the work item has a lower id than one that queued behind it. `stopHeadless` marks the working one `failed` and calls `headlessChanged`, which calls `agentsCounted`, which drains the queue (`daemon.ts:3753`). The place it freed goes to the first in the queue, which can be the queued session of the same work item. That session starts its run, and the next turn of the loop stops it as a working session, with an entry in the ledger.

The probe set a cap of 1, asked one prompt that kept working and a second that queued, and archived the work item with both named. The fake adapter was asked to start both prompts, `["First?","Second?"]`. The second session was told `queued`, then `working`, then `failed`, and the ledger held 2 entries where it should hold 1. On a delete the second run starts in a worktree that is about to be removed. The case at `daemon.test.ts` "ends a queued session at a stop and at an archive" does not show it, because there the place is held by a pane, and `endSessions` ends panes after the sessions.

The fix stops the queued sessions first, so they leave the queue before any place frees. A place freed afterwards goes to the queue as it then stands, which holds none of the ended work item's sessions. No other caller stops several sessions in one turn: `close` clears the queue before it ends anything (`daemon.ts:739`). The fix pass also owes a case in the caps group of `apps/desktop/test/daemon.test.ts`, the probe's in the suite's form: a working and a queued session of one work item, an archive naming both, and one start and one ledger entry after it.

```ts
    const { panes, headless } = this.runningTold(workItemIds, told);
    // The queued sessions leave the queue first, so a place a working one frees never goes to a session this end is about to stop.
    const ordered = [...headless].sort((a, b) => Number(b.info.state === "queued") - Number(a.info.state === "queued"));
    const stops = ordered.flatMap((session) => this.stopHeadless(session, why, "request") ?? []);
```

### 3. The pull request carries no screenshot of the Machine dialog in Register, which draws its reading line in another face

```seal
severity: must
location: `seal/threads/1795559736-caps-on-worktrees-and-agents/screenshots`, `seal/threads/1795559736-caps-on-worktrees-and-agents/gaps.md:13`
evidence: read `docs/design.md:502`, `apps/desktop/src/renderer/index.html:328`, `apps/desktop/src/renderer/themes.css:30`, `apps/desktop/src/renderer/themes.css:161`, `apps/desktop/src/renderer/themes.css:276`, `apps/desktop/src/renderer/themes.css:391`, `apps/desktop/src/renderer/themes.css:506`, `apps/desktop/src/renderer/themes.css:621`
```

Why it matters: `docs/design.md` *A pull request that changes the window carries its screenshots* asks for each changed view "in each other theme that draws the changed part differently". `gaps.md:13` hands that judgment to this review.

The Machine dialog sets its reading line in `--font-fact` (`index.html:328`). Night watch and Desk give `--font-fact` the sans (`themes.css:30`, `:161`, `:506`, `:621`). Register gives it the fixed-width face in both appearances (`themes.css:276`, `:391`), as its row in *The themes* says of "every fact a person compares down a list". So Register draws the dialog's first line differently, and the pull request carries no shot of it. Desk draws no part of the dialog or of the waiting line differently from Night watch, by the same tokens, so Desk owes no shot.

The fix runs the screenshot run once more for Register and commits its two Machine dialog files beside the four that stand. `gaps.md:13` then ends its row with the word `closed`, not by removing it. The run is the repository's, as `docs/design.md` names it: `OWLERY_SCREENSHOT_THEMES=register OWLERY_BACKGROUND=1 pnpm run screenshots` in `apps/desktop`. It writes `register-dark-machine.png` and `register-light-machine.png` among its files. `pr.md` shows no screenshot today, so this finding asks nothing of it.

```text
seal/threads/1795559736-caps-on-worktrees-and-agents/screenshots/register-dark-machine.png
seal/threads/1795559736-caps-on-worktrees-and-agents/screenshots/register-light-machine.png
```

### 4. The screenshot run gains the Machine dialog as a view, and neither edition of `docs/design.md` adds it to the list of views

```seal
severity: must
location: `docs/design.md:502`, `docs/design.ko.md:502`, `apps/desktop/test/screenshots.ts:11`
evidence: executed `grep -n "Machine" docs/design.md docs/design.ko.md`, which printed nothing; read `docs/design.md:502`, `docs/design.ko.md:502`, `apps/desktop/test/screenshots.ts:11`, `seal/threads/1795559736-caps-on-worktrees-and-agents/frame/design.md:170-231`
```

Why it matters: `docs/design.md:502` says: "The pull request that adds a view to the run adds it to this list, in both editions of this document". The Korean edition says the pull request adds it "직접", itself. Phase 5 added `machine` to `VIEWS` (`screenshots.ts:11`), so the run now makes twelve views. The list in both editions still names eleven and ends with "the Accounts dialog". `frame/design.md` *Rule changes* holds no change of `docs/design.md`, so the settle would not add it either. The frame's reason for leaving the policy documents to the settle is that #134 also rewrites *Memory design*, and it does not reach this section.

The fix adds the view to both editions in this pull request, as the section asks. It touches the one list sentence of each edition. No other sentence of the section counts the views, as the section itself says.

```text
docs/design.md:502
  from: a repository's settings and the Accounts dialog.
  to:   a repository's settings, the Accounts dialog and the Machine dialog.

docs/design.ko.md:502
  from: 저장소 설정, Accounts 대화 상자입니다.
  to:   저장소 설정, Accounts 대화 상자, Machine 대화 상자입니다.
```

### 5. The view's foot says a running chain waits for the machine while only a session a person asked for waits

```seal
severity: should
location: `apps/desktop/src/renderer/work-item-view.ts:1018`, `apps/desktop/src/renderer/view.ts:3193-3196`, `apps/desktop/test/view.test.ts:1760`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts` in the round's clone; read `apps/desktop/src/renderer/view.ts:1521-1524`, `apps/desktop/src/renderer/view.ts:3180-3196`, `apps/desktop/src/renderer/work-item-view.ts:1018`
```

Why it matters: `frame/design.md` *Scope* item 8 says "A chain whose stage waits says the same sentence at the view's foot." The foot passes `chainSays` the count that `queuedAhead` gives (`work-item-view.ts:1018`). `queuedAhead` finds the first queued session of the work item of any kind (`view.ts:1521`), and `chainSays` says "Waiting for the machine" whenever the chain runs and that count is not null (`view.ts:3195`). "Ask" stays enabled while a chain runs (`askButton`, `view.ts:3180`). So a person who asks a prompt while a stage works, at the cap, reads at the foot that the chain waits, and the stage's own sentence disappears while it runs.

The probe gave `chainSays` a running chain whose stage's session works and an asked session in the queue. It said "Waiting for the machine" where the probe expected the stage's sentence. The case at `view.test.ts:1760` passes a count directly and never builds this pair, so it holds the sentence and not the session it is about. In release 0.0.4 nothing in the window starts a chain, so a person meets this only once milestone 3 does, or through the cases' chains. The line's second row (`lineText`) says "Waiting for the machine" for any queued session of the work item, which *Scope* item 8 asks of the line, so this finding leaves the line alone.

The fix counts the place of the stage's own session. The fix pass owes the case at `view.test.ts:1760` a line with a working stage and a queued asked session, whose foot keeps the stage's sentence. It also owes that case's name and the docstring of `chainSays`, which today say "while its stage's session is queued" but take any count.

```ts
// apps/desktop/src/renderer/view.ts, beside `queuedAhead`
/** How many sessions go before the session of the stage a work item's running chain begins, or null where that session does not wait for the machine. */
export function stageAhead(workItem: WorkItem, machine: Machine | null): number | null {
  const chain = chainOf(workItem);
  const id = chain?.state === "running" ? chain.stages.at(-1)?.headlessId : undefined;
  const at = id === undefined || id === null ? -1 : (machine?.agents.queue.indexOf(id) ?? -1);
  return at < 0 ? null : at;
}

// apps/desktop/src/renderer/work-item-view.ts:1018
  sealSays.textContent = chainSays(workItem, stageAhead(workItem, held.machine));
```

### 6. The daemon never forgets an agent that ended, though the store's docstring and the phase record say it does

```seal
severity: should
location: `apps/desktop/src/daemon/machine.ts:222-223`, `apps/desktop/src/daemon/machine.ts:263-266`, `apps/desktop/src/daemon/daemon.ts:3693`, `apps/desktop/test/machine.test.ts:251`
evidence: executed `grep -n "forget(\|\.forget" apps/desktop/src/daemon/*.ts`, which printed the definition at `machine.ts:264` alone; read `apps/desktop/src/daemon/machine.ts:214-267`, `apps/desktop/src/daemon/daemon.ts:3685-3717`
```

Why it matters: `trail/phases/phase-2.md` claims the daemon "forgets the name once the agent is no longer read". The docstring of `AgentMemoryStore` says an agent's name is forgotten "as it ends" (`machine.ts:222-223`). No code of the daemon calls `forget` (`machine.ts:264`). The case at `machine.test.ts:251` calls it on the store alone. So `living` keeps one entry for every agent the daemon ever read, for the daemon's life. Each entry is the object `kept` also holds, so a measure that drops out of the last twenty stays referenced. Ids are not given twice in one daemon's life, so no measure is counted wrong today. But the next reader of the docstring builds on behaviour the daemon does not have.

The fix forgets, at each reading, every name the reading did not find living. It does so before the early return, so the last agent is forgotten once none lives. `forget` gives way to `keepLiving`, and the case at `machine.test.ts:251` calls the new method with the names that still live.

```ts
// apps/desktop/src/daemon/machine.ts, in place of `forget`
  /** Forgets every agent not among `names`, the agents that live now: their measures stay kept, and a reading under one of their names is a new agent's. */
  keepLiving(names: ReadonlySet<string>): void {
    for (const agent of [...this.living.keys()]) if (!names.has(agent)) this.living.delete(agent);
  }

// apps/desktop/src/daemon/daemon.ts, in `measureAgents`, in place of line 3693
    memory.keepLiving(new Set(agents.values()));
    if (agents.size === 0) return;
```

### 7. `gaps.md` says no other built-app file names the stand-in for the CLI, and the fix pass added one that does and queues a session

```seal
severity: should
location: `seal/threads/1795559736-caps-on-worktrees-and-agents/gaps.md:8`
evidence: read `seal/threads/1795559736-caps-on-worktrees-and-agents/gaps.md:8`, `apps/desktop/test/machine-dialog.test.ts:252-320`
```

Why it matters: the row at `gaps.md:8` ends: "The other built-app files name no stand-in for the CLI, so a session they queue would start whatever `claude` the daemon looks up once it starts". `c290ca9b` added a third start to `machine-dialog.test.ts` whose login shell is the screenshot run's stand-in (`machine-dialog.test.ts:252`). That case asks one prompt that works and one that waits, and reads the waiting session in the built Machine dialog (`:286-320`). The row was last written at `23ed958a`, before the fix pass, and the target contradicts its last sentence. What the row leaves unverified still holds: no built-app case draws the chain's foot or the "Queued" line under "Ask".

The fix rewrites the row's last two sentences in place. Its item stays open.

```text
No chain runs in that scene, and no shot opens the view of the work item that waits. `apps/desktop/test/machine-dialog.test.ts` also starts the app with that stand-in and queues an asked session, and reads it in the Machine dialog alone: no built-app case opens the view of a work item whose session waits, so neither the "Queued" line under "Ask" nor a chain's foot is drawn by any case, and no case runs a chain in the built app.
```

### 8. The changelog says a waiting session gets "its account's limit" when it starts, and the limit it gets is the session's time limit

```seal
severity: should
location: `seal/threads/1795559736-caps-on-worktrees-and-agents/changelog.md:11`
evidence: read `seal/threads/1795559736-caps-on-worktrees-and-agents/changelog.md:11`, `apps/desktop/src/daemon/daemon.ts:2235-2262`, `apps/desktop/src/daemon/daemon.ts:145`
```

Why it matters: the fragment becomes the release note a person reads. It says: "A waiting session gets its account's limit and its start time when it starts". The start of a queued session sets `session.limit`, the timer of `headlessLimitMs ?? HEADLESS_LIMIT_MS` (`daemon.ts:2260`). That is the daemon's one-hour time limit for every session, and no account holds it. What `beginHeadless` takes from the account is chosen when the session is begun, before it waits (`daemon.ts:2237-2241`). An account in this app has usage limits, so "its account's limit" reads as a usage limit counted from the start. That is not what the code does. `trail/phases/phase-2.md` words it correctly: "A queued session gets its limit, its `startedAt` and its stage's `startedAt` at its start."

```text
A waiting session gets its time limit and its start time when it starts, so the time it waited counts toward no stage's time or cost.
```

## Confirmations

What matched: `frame/design.md` scenario 15. `git grep -n 'STAGE_PANES' -- apps` exits 1 and prints nothing at `ad6f1928` (executed). `stageOf` takes the cap as its fourth argument, and `paneCap` gives 4 against a daemon that keeps no cap (`apps/desktop/src/renderer/view.ts:2470-2472`, read).

What matched: *The caps, in numbers*. `agentsProposal`, `panesProposal` and `worktreesProposal` (`apps/desktop/src/shared/machine.ts:39-62`, read) give the frame's formulas. The examples in `changelog.md` match the sentences `readingSays`, `agentsSays`, `planWarning` and `capRefusal` build from the probe's reading, word for word: "36 GB of memory, 12 cores of which 6 are performance cores, a load of 0, and 25.1 GB free of 494.4 GB on the worktrees' disk.", "The default is 6: the 6 performance cores, fewer than the 27 that half of 36 GB holds at 679 MB an agent (not measured on this Mac yet).", "The disk may not hold this worktree: 10.2 GB free, 10 GB kept free, and a worktree of this repository takes 440 MB.", "This is worktree 2 of a cap of 1." and "The cap on panes side by side is a whole number from 1 to 16." (read). The disk warning's boundary and the worktree proposal's floor agree: the warning shows exactly where the proposal adds no worktree (read).

What matched: *Data & interfaces* on the stored size. `workItemOf` leaves `worktreeSize` out of every work item a client is sent (`apps/desktop/src/daemon/daemon.ts:2684-2690`), and the client's `setWorkItem` names `pinned`, `muted`, `groupId` and `accountId` alone (`daemon.ts:1169-1176`). This confirms phase 3's claim that only the daemon writes the field (read).

What matched: *Data & interfaces* on `setCaps` and `limits.json`. Every field is checked before any is taken, `null` follows the proposal, a daemon with no reader answers the sentence phase 1 names, and `LimitsStore` reads a refused value as absent (`daemon.ts:1598-1630`, `apps/desktop/src/daemon/machine.ts:180-212`, read).

What matched: `trail/phases/phase-2.md`, the table of readers of a headless state. Its method was a `git grep` on the three states. The same search over `apps/desktop/src`, run by this round (executed), lists no reader the table misses. Its daemon readers are taken whole: `runningIn`, `runningUnder`, `stopHeadless`, the `stopHeadless` request, `works`, `checkIdle`, `close`, `startHeadless` and `headlessChanged`. `runStage` reads the state only after `ended`, and `ledger.ts` only an ended session, which the table did not need to list.

What matched: Q11. `apps/desktop/package.json` reads `0.0.4` at the target (read), as phase 5 found on the base, so nothing was owed to move.

What matched: `pr.md`. Each of its quotes stands word for word at the coordinate it names: *Judgments of the run* row 3, *Scope* items 1, 2, 3, 4, 6, 8, 11 and 12, and Q12 and Q13 with their default rows (read).

What matched: the screenshots. The four files show the inbox's line "Waiting for the machine" under "Rename the settings file", the status line on its own row ("Daemon running, 4 agents of 4, 1 waiting, keeping the Mac awake"), and the Machine dialog with its label and its queued session, in Night watch's dark and light appearances (read). Desk owes no shot, as finding 3 says.

What matched: `gaps.md:7`. The crafter labels the broad gate `unverified` and names the orchestrator as its answerer. That label is honest: no phase record claims a run of `pnpm -r run check`, and phase 2 says its one whole `tsc --noEmit` "is no broad gate" (read).

The new cases were read against their groups for the units the findings touch: the caps group of `daemon.test.ts`, the `chainSays` cases of `view.test.ts`, and the store cases of `machine.test.ts`. The two no-reader cases of `daemon.test.ts`, "sends no `machine` in `ready`…" and "queues nothing where it is given no reader…", hold different facts and are no pair. This was a sample: the other new cases of `view.test.ts`, `machine.test.ts`, `chain.test.ts`, `keep-awake.test.ts`, `repositories.test.ts` and `machine-dialog.test.ts` were listed by name and not read against their groups.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether principle 8 of `docs/design.md` ("A change that needs a form this document does not state adds it here first … and leaves none to the release's settle") asks *Components and their states* for rows of the forms this work draws. Those forms are the Machine dialog's rows and its queue under a label, the form's warning line in `--state-waiting`, and the stage of three and four columns with a rule drawn by each tile. Read: none of them has a row, and the stage of two columns had none before either. Also open is whether the warning's `--state-waiting`, Night watch's yellow, spends principle 3's one signal on a warning | `docs/design.md:18`, `docs/design.md:13`, `apps/desktop/src/renderer/index.html:613` | The owner, or the orchestrator against `docs/design.md` |
| Whether a row that follows its proposal should send the value when a person types that same value into it. `capChanges` sends nothing then, and the cap keeps following the proposal. *Scope* item 4 and scenario 3 speak only of a cap already set | `apps/desktop/src/renderer/view.ts:1584-1599` | The owner |
| The rest of the new cases, against their groups, as the confirmations above say | `apps/desktop/test/view.test.ts`, `apps/desktop/test/machine.test.ts`, `apps/desktop/test/chain.test.ts`, `apps/desktop/test/machine-dialog.test.ts` | The next round |
| The broad gate | the repository | The orchestrator: with nothing open after the fix pass and its verifying round, its broad run comes due, and the sealer's spawn after it |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts`, in `apps/desktop` of the round's clone at `ad6f1928`, once | 2 cases, 2 failed. The first, with the cap at 1 and nothing running, got `state: "queued"` in the `asked` answer to the first prompt (finding 1). The second, `chainSays` of a running chain with a working stage and a queued asked session, returned "Waiting for the machine" (finding 5) |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1b.test.ts`, in the same folder, once | 2 cases, 1 failed. With a cap of 3 and nothing running, an asked session was answered `working`, so the defect of finding 1 shows only one place under the cap. An archive of a work item with a working and a queued session started both prompts, `["First?","Second?"]`. The queued one was told `queued`, `working`, `failed`, and the ledger held 2 entries (finding 2) |
