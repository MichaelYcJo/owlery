# Implementation Plan: 1795341001-cost-per-stage

## Technical context

The tree as read at `e262835`.

`apps/desktop`. The connector is `src/daemon/adapters/adapter.ts`: the `result` event of `RoleEvent` (15) carries `costUsd`. The Claude adapter is `src/daemon/adapters/claude.ts`: `eventsForLine` (240-264) maps one line of the stream to neutral events and reads `total_cost_usd` at 259, `roleCheck` (280-294) reads the `init` line for a role launch, and the handler of `start` that reads the stream by lines (426-448) makes the result of a refused role launch at 433. The fake adapter is `src/daemon/adapters/fake.ts`: `FakeAdapterOptions` (17-32) and the two results it reports (73, 77).

The daemon is `src/daemon/daemon.ts`: `DaemonOptions.runDir` (119-120), `HeadlessSession` (168-176), the stores built on the run directory (245-249), `close` (458-479), the `ask` case (1048-1082), `worktreeFor` (1154-1176), `dropWorkItems` (1202-1221), `stopHeadless` (1305-1312), `startHeadless` (1315-1378), whose listener copies the cost at 1355, and `headlessChanged` (1388-1407), whose block at 1394-1403 runs once for a session that has just ended. The process's entry is `src/daemon/main.ts`, whose comments at 24-25 and 47 list the files of the run directory. The protocol is `src/shared/protocol.ts`: `ROLE_STAGES` (342-346), `roleStageOf` (352-356), `HeadlessInfo` (365-383), `ClientMessage` (420-481) and `ServerMessage` (483-519), where `readLoss` (457) and `workItemLoss` (498) are the pattern of a request that reads and its answer.

The stores of the run directory are the pattern this work reads and departs from: `src/daemon/record-times.ts` and `src/daemon/last-look.ts` each read one JSON file at the daemon's start, hold it in memory and write it whole with `src/daemon/whole-file.ts#writeWholeFile`.

The cases are `test/claude-adapter.test.ts`, which puts a script in the CLI's place and also reads the recorded streams of `test/fixtures/` line by line (1010-1040), `test/fake-adapter.test.ts`, and `test/daemon.test.ts`, whose group "headless sessions" (4393) builds a `Daemon` with the fake adapter and reads what a client receives, and whose other groups start two daemons on one `runDir` (743-755). `test/role-session.test.ts` launches the person's own `claude` and runs only through the scripts `role:run` and `role:refusal`. It prints the session whole, so it prints `usage` once *Scope* item 6 of `frame/design.md` is built, and no line of it changes.

**The constraints.** No case and no probe starts a real `claude`: the fake adapter and a script in the CLI's place stand in. A start of the built app goes through `test/built-app.ts` `BuiltApp.start` with `OWLERY_BACKGROUND=1`, and this plan needs none, because no window code changes and a client of the daemon is a WebSocket the cases open themselves. The window draws nothing new, so the pull request carries no screenshot (`docs/design.md` *A pull request that changes the window carries its screenshots*).

**The failure scenario of the chosen approach.** In six months Claude Code renames a field of `modelUsage`, or gives `apiKeySource` a fifth value for a key. The first shows as token counts that read null in every new entry, and the second as a charge marked "converted". Neither is an error, and no case of the suite sees either, because every case reads a recorded stream. Both fail toward the cautious reading: a null is not a zero, and a charge shown as converted understates nothing a person pays. The bound is the run of `role:run` at each move of `MIN_CLAUDE_VERSION`, which prints the session's `usage` beside the raw `usage` and `modelUsage` of the result line. The second failure is the file's growth. `ledger.jsonl` gains one line per stage and loses none, and each `readLedger` parses the whole file, so after some years of daily use a read takes long enough to notice. Issue #76's export is the first reader of the whole file and the place a rotation would be decided. The third is a daemon that crashes in a stage: the stage's cost is in no entry, and a work item's total reads lower than what was spent. Issue #141 holds the read of the CLI's session log that would recover it.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| One entry for each headless session that ended, written by the daemon at the end (chosen) | A stage that #41 or a later issue runs as something other than a headless session gets no entry unless its code calls `Ledger#add` | Chosen. Every role session is launched through `startHeadless` today (read: the `ask` case is the one caller), so each round, fix pass and sealer session of the later issues gets its entry with no call of theirs. The gate is the one stage that is no session, and *Scope* item 7 gives it a value |
| An entry only for a session with a role | A person's own question in a work item's view spends from the same account, and its cost is lost when the session leaves the list of 50 | Rejected. `LedgerStage` null lets a reader leave such an entry out, and a total without it understates what the work item cost |
| Wait for #41, and enter a stage where its chain ends one | The ledger then waits on the largest work item of the release, and #47, which reads it, waits behind both | Rejected. The issue says "Depends on #41", and what it depends on is that a stage is a role session, which #38 and #39 already built |
| The entry written at the stage's end (chosen) | A daemon that crashes in a stage leaves no entry for it | Chosen. An entry opened at the start and closed at the end would say only that a stage started and never ended, with no cost and no end time, and it needs a rewrite of a line, which an append-only file does not have |
| An entry opened at the start and closed at the end | Each stage writes twice, and a start of the daemon has to close the entries a crash left open | Rejected for the reason above |
| A stopped stage's entry has no usage, written at the stop (chosen) | The tokens a stopped stage spent are in no entry | Chosen. The daemon ignores every event after a stop (`daemon.ts:1333`), and whether the CLI prints a `result` line after the signal is not known and cannot be probed in this run (`frame/questions.md` Q2). A null says the cost is unknown, and #141 measures it |
| The entry of a stopped stage written at the process's exit, with a result that arrived after the stop | The daemon's rule that nothing after the end changes a session gets an exception, and the entry waits on an exit that the adapter kills after 2 seconds | Rejected until Q2 is measured. #141 owns the measurement and the change |
| `converted` as one boolean, false only for the key values the executable names (chosen) | The first failure of *Technical context* | Chosen. The issue asks for one label, and an unknown login reads as converted, which claims no charge nobody checked |
| `converted` true only for `none`, false for every other value | A login Claude Code adds later, or a value the adapter misreads, is shown as a charge on the first day | Rejected |
| The login's source as a string of the adapter's on the protocol | A field whose values are Claude Code's own crosses the protocol, against `docs/architecture.md` *Rules that keep it portable* rule 1 | Rejected |
| A mark for each model from `costBasis` | `costBasis` says which price table priced a request and not whether the account is billed by it: a subscription login's stream says `list` | Rejected as the label. #141 holds the mark for `unknown` |
| `usage` replaces `costUsd` on the event and on `HeadlessInfo` (replaces the structure) | A reader written for the old field reads nothing. The window has none (*Grounding* of `frame/design.md`, executed), and a daemon of an earlier build sends the old field to a window that reads neither | Chosen. One field holds the cost with its mark, so no client can show the one without the other |
| `costUsd` kept beside a new `usage` (keeps the structure) | Two fields state one cost, a client reads the bare one, and the issue's third line fails where the app shows it | Rejected. The premise that would keep it is that something reads `costUsd`: checked, and nothing does |
| `ledger.jsonl`, one line appended per entry, read on demand (departs from the stores' structure) | The second failure of *Technical context*. A crash in the middle of an append leaves a torn last line, which `read` counts as unread and leaves in the file | Chosen. Nothing rewrites or removes an entry, so no write can lose one that was written. The daemon holds nothing between two reads, as `docs/architecture.md` *Memory design* asks |
| A `ledger.json` read at start, held in memory and written whole with `writeWholeFile`, as `record-times.ts` does (keeps the stores' structure) | A file the daemon could not read at its start is replaced whole at the next write, and the entries it held are gone. `record-times.ts` accepts that for the ages it serves, and a ledger cannot. The whole ledger also sits in the daemon's memory for as long as it runs | Rejected. The premise that keeps the structure is that the store's whole content may be lost and rebuilt: checked in `record-times.ts:27-34`, which says so of the ages, and it does not hold for costs |
| A deleted work item's entries stay (chosen) | The run directory keeps the folder and the branch name of work a person deleted, in a file readable by the user alone, until an export decides otherwise | Chosen. `docs/roadmap.md` *Done criteria* and issue #76 publish the ledger of work items that are merged, and a person deletes a work item after its merge |
| The entries leave with the work item, as `dropWorkItems` drops its other state (keeps the structure) | Issue #76 finds no entry for a work item deleted before the export, and the public ledger covers only what happened to stay listed | Rejected. The premise that keeps the structure is that nothing reads a work item's state after its delete: checked in `dropWorkItems`' docstring for the panes, the sessions and the times, and #76 is a reader after the delete |
| A stage's duration as its two times on the daemon's clock (chosen) | A stage whose start and end fall on two sides of a change of the system's clock reads a wrong duration | Chosen. The two times exist for every end, a stop among them, and one clock serves every adapter |
| The duration the CLI reports, `duration_ms` | A stopped stage has none, and another vendor's agent may report none | Rejected |
| `readLedger` and its answer, one request for one work item (chosen) | A client that wants the ledgers of many work items sends as many requests | Chosen. The issue's sixth line asks that a client can ask, and `readLoss` is the same pattern. A daemon of an earlier build answers nothing to the message (*Grounding* of `frame/design.md`), which #47's window has to read as a ledger it cannot show |
| The entries on `WorkItem`, in every `inbox` | Every change of any list sends every work item's whole ledger to every client, and the daemon holds them all in memory | Rejected |
| The gate named in `LedgerStage` now (chosen) | A value no code of this work writes stands in the type until #42 | Chosen. The issue's first line lists the gate among the stages, and #42 then adds a call and no type |
| The gate's value left to #42 | #42 changes the entry's type after #47 may have read it | Rejected |
| A token count that the agent did not report is null (chosen) | Every reader of a count handles a null | Chosen. A zero would say the model used none |
| `Usage` and `LedgerEntry` in `src/shared/protocol.ts` (chosen) | The adapter's connector imports a type from the protocol | Chosen. `adapter.ts` already imports `RoleStage` from it, and the two types cross the protocol unchanged |

## Phases

Each phase is one commit or more on `feat/45-the-daemon-keeps-no-cost-per-stage`. The narrow run of a phase is `node scripts/test-in-electron.mjs <files>` in `apps/desktop`. Each new case is shown red before it is committed, as contract rule 15 asks, and the phase record says how.

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1 to 6 of `frame/design.md`: the neutral usage on the event and on the session, from both adapters | `node scripts/test-in-electron.mjs test/claude-adapter.test.ts test/fake-adapter.test.ts test/daemon.test.ts test/view.test.ts` in `apps/desktop`, with the cases of the scenarios "A subscription login's cost is marked", "A key's cost is not marked, and an unknown login is", "The fake adapter reports usage" and "A session's cost travels with its mark". The search of the scenario "No vendor's field crosses the protocol" prints nothing | 5d370d1 |
| 2 | *Scope* items 7 to 13 of `frame/design.md`: the store, the entries the daemon writes, and the request that reads them | `node scripts/test-in-electron.mjs test/ledger.test.ts test/daemon.test.ts` in `apps/desktop`, with the cases of every other scenario of `frame/design.md` *User scenarios & acceptance* | |

The typecheck and the whole suite are the broad gate, which the orchestrator runs once after the review rounds settle.

## Overlap with the release

The spawn names #41, #46 and #27 as running beside this work, and #47, #42, #43 and #44 as not started. No frame of the first three is committed (`frame/design.md` *Grounding*), so each row below is read from the issue and its `routing.md`.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #41, review rounds | `apps/desktop/src/daemon/daemon.ts`, the headless session's life: `startHeadless`, `stopHeadless`, `headlessChanged` and `close`. `apps/desktop/src/daemon/adapters/adapter.ts` and `fake.ts`: #41 scripts the fake adapter for two rounds and a fix pass, and every `result` event its cases spell carries the field this work renames. `apps/desktop/src/shared/protocol.ts`, `ClientMessage` and `ServerMessage`. `apps/desktop/test/daemon.test.ts`. #41 also reads a fact of this work: each stage it launches as a headless session gets a ledger entry with no call of its own | #45 | This work is the smaller diff and the likelier to be sealed first. #41 then merges `release/v0.0.2` into its branch inside rounds it spends anyway, spells its `result` events with `usage`, and has its stages entered. In the other order this work would refit its one hook to whatever #41 made of a session's end, and #47 would wait for both. Where #41's frame launches a stage outside `startHeadless`, that stage calls `Ledger#add` itself |
| #46, progress through roles | `apps/desktop/src/shared/protocol.ts`, where #46 adds the progress a client is sent, possibly on `HeadlessInfo`. `apps/desktop/src/daemon/daemon.ts` and `apps/desktop/test/daemon.test.ts`. `apps/desktop/test/view.test.ts:176`, the builder of a headless session that this work changes by one field | #45 | #46's body says it depends on #42, so it is sealed later. It merges the release branch and meets this work as one field of `HeadlessInfo` and one of the builder |
| #27, agent choices and the behind count | `apps/desktop/src/shared/protocol.ts`, where #27 adds fields to `WorkItem`, and `apps/desktop/src/daemon/daemon.ts`, where it reads a hook's payload and git. `apps/desktop/test/daemon.test.ts`. Neither reads a rule or a fact of the other | #27 | #27 goes straight to its pull request with no review rounds, so it is the likelier to be sealed first. The two change different declarations of the same files, and this work's rounds take the merge |
| #47, the back of the seal | It reads `readLedger`, `LedgerEntry` and `Usage.converted`, and joins an entry to a round record | #45 | #47 is not started and its body says it depends on #45 |
| #42, the broad gate and the sealer | It calls `Ledger#add` with the gate's stage, and its sealer session is entered by *Scope* item 9 of `frame/design.md` | #45 | #42 is not started and depends on #41 |
| #43 and #44 | Nothing of this work. #43 opens the pull request and #44 reads the seal against the branch's head | No order | Neither reads the ledger |

Each work item of the release writes its own `changelog.md`, so no fragment is changed by two.

## Operational impact

- **A new file of the run directory**, `ledger.jsonl`, readable by the user alone. It is created at the first stage that ends, and nothing migrates: a run directory without it has an empty ledger.
- **A protocol change.** `HeadlessInfo.costUsd` goes and `HeadlessInfo.usage` comes. No client reads the old field. The messages `readLedger` and `ledger` are new, and a daemon of an earlier build answers nothing to `readLedger`.
- **No new dependency, no environment variable and no move of the version.** `release/v0.0.2`'s first pull request moved the version.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
