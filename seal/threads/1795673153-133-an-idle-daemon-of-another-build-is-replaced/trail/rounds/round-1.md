# Review round 1: 1795673153-133-an-idle-daemon-of-another-build-is-replaced

```seal
target: b492c073 against 57449b14
```

The round reviews the whole work at HEAD against `origin/release/v0.0.5` at `57449b14`: the work as one commit, `e651d395`, and the two records commits `1ca16fcc` and `b492c073`. It checks compliance first, each *Scope* item and acceptance row of `frame/design.md` against `git diff 57449b14 b492c073`, then quality. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md` and `changelog.md` were read whole at the target, and so were `trail/phases/phase-1.md` and `trail/phases/phase-2.md`. No `pr.md` stands, and `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. No `seal/parity.json` is declared.

No earlier round stands on this branch. The rounds at `9215cd24` (`trail/rounds/round-1.md`, `round-2.md` of the earlier branch) were read as leads, and none of their findings is named here, since none was closed on this branch. Carried from them and not re-established: what `ready`, `SessionInfo.alive`, `Chain.state` and `HeadlessState` are at `v0.0.2`, `v0.0.3` and `v0.0.4`, that a daemon of those tags ends at SIGTERM and removes its `daemon.json`, and that each of those tags answers `createWorkItem` by its id. Re-derived at the target: every verdict below, the comparison of `ClientMessage` with `Daemon#handle`, and the lines of `src/daemon/main.ts` that `gaps.md` hands the proofer.

The phase records name commits of the earlier branch (`f14c10b3`, `fe683c18`, `4c426957` and others), and so do two rows of `gaps.md`. `git merge-base --is-ancestor f14c10b3 HEAD` exited 1, so those commits are not in this branch's history. The phase records are dated accounts, and `frame/plan.md` *Judgments of the run* says why the branch changed. Each line those rows say was read at an earlier commit stands at HEAD as they say (*Confirmations*), so the dated coordinates are no finding.

## Findings

### 1. The settle would write #216's sentence that a daemon of an earlier build is told by the 15-second end, beside this work's 10-second wait that ends the same press first

```seal
severity: should
location: `seal/threads/1795673153-133-an-idle-daemon-of-another-build-is-replaced/frame/design.md:103-176`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/design.md:136`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/design.md:141`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/changelog.md:9`
evidence: executed `grep -n -F -e 'section: What a session survives' -e 'section: Overall layout' -e 'section: 세션이 견디는 것' -e 'section: 전체 구성' seal/threads/*/frame/design.md` and `git grep -n -F -e 'is told that way' -e '이전 빌드의 데몬도 그렇게 알립니다' -e 'A daemon of an earlier build, which drops the message, is told this way' -- seal/threads docs apps/desktop/src` at the target, and `node scripts/test-in-electron.mjs test/daemon-restart.test.ts` in `apps/desktop`; read `apps/desktop/src/renderer/refresh.ts:55-86`, `apps/desktop/src/renderer/view.ts:992-1018`, `apps/desktop/src/renderer/renderer.ts:2076-2082`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/design.md:132-141`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/changelog.md:9`
```

Why it matters: #216 is merged into the base, and its records stand unsettled under `seal/threads/1795632147-216-the-window-reads-the-lists-again/`. Its `add` to `docs/architecture.md` *Screen framework: Electron* ends: "Where no answer comes within 15 seconds, the status line says so, and a daemon of an earlier build, which does not know the message, is told that way." (`frame/design.md:136`). The Korean `add` says the same (`:141`). Its changelog fragment says that sentence "is what a daemon of an earlier build, which does not know the request, leads to" (`changelog.md:9`).

This work makes that false. Against a daemon whose `ready` holds no `answersUnknown`, `answerWaits` arms a wait of 10 seconds on the press's `readLists` (`apps/desktop/src/renderer/view.ts:1006`). Its refusal reaches `refreshing.refused`, which ends the press, stops the 15-second timer and says `NOT_ANSWERED_SAYS` (`apps/desktop/src/renderer/refresh.ts:55-86`, `renderer.ts:2078-2082`). So the 15-second sentence never shows against such a daemon. The case of scenario H holds this in the built app, and it passed in this round's run. This work's own `changelog.md:8` says so too: "A press of the sidebar's refresh button ends this way against such a daemon, before the button's own 15-second wait."

The settle writes each section as its group's latest decision, in merge order. *Screen framework: Electron* has #216's `add` alone in its group, so the settle writes #216's sentence as it stands, and `docs/architecture.md` *What a session survives* then gains this work's sentence on the 10-second wait. The policy documents would state two ends for one press. The release notes, built from the fragments, would state both as well. `trail/phases/phase-2.md` says #216's records "are not this work item's to write, and the hand-back names them", and at the target no record carries the correction. The searches are on the sentence's words, so they are a sample.

The fix adds two `change` entries to this work's `frame/design.md` *Rule changes*, after the last entry of each language. #133 merges after #216, so each `from` stands once #216's `add` is written.

```markdown
- change
  file: docs/architecture.md
  section: Screen framework: Electron
  from: Where no answer comes within 15 seconds, the status line says so, and a daemon of an earlier build, which does not know the message, is told that way.
  to: Where no answer comes within 15 seconds, the status line says so. Against a daemon of a build before `answersUnknown`, which does not know the message, the window's wait of 10 seconds on each request ends the press first, with its own sentence ([What a session survives](#what-a-session-survives)).
    check: apps/desktop/test/view.test.ts apps/desktop/test/refresh.test.ts apps/desktop/test/daemon-restart.test.ts
- change
  file: docs/architecture.ko.md
  section: 화면 프레임워크: Electron
  from: 15초 안에 답이 오지 않으면 상태 줄이 그렇다고 말하고, 이 메시지를 모르는 이전 빌드의 데몬도 그렇게 알립니다.
  to: 15초 안에 답이 오지 않으면 상태 줄이 그렇다고 말합니다. 이 메시지를 모르는, `answersUnknown` 이전 빌드의 데몬에게는 창이 요청마다 두는 10초 기다림이 먼저 누름을 끝내고 자기 문장을 보입니다([세션이 견디는 것](#세션이-견디는-것)).
    check: apps/desktop/test/view.test.ts apps/desktop/test/refresh.test.ts apps/desktop/test/daemon-restart.test.ts
```

The fragment `seal/threads/1795632147-216-the-window-reads-the-lists-again/changelog.md:9` is #216's record, and #216 is sealed. The fix pass owes it a rewrite of its third sentence, or else this work's `changelog.md:8` names the change for the release note. Which of the two the pull request carries is the orchestrator's choice. #216's `frame/design.md:49` (*Scope* item 7) is #216's dated frame, which the settle does not write, so it stays.

### 2. Each load of the window now says hello to the daemon once more, a daemon of the app's own build included, which adds a read of git and up to half a second to every load

```seal
severity: should
location: `apps/desktop/src/main/daemon-client.ts:56-63`, `apps/desktop/test/daemon-client.test.ts`
evidence: read `apps/desktop/src/main/daemon-client.ts:56-63`, `apps/desktop/src/main/daemon-client.ts:85-86`, `apps/desktop/src/main/main.ts:112`, `apps/desktop/src/daemon/daemon.ts:938-943`, `apps/desktop/src/daemon/daemon.ts:964-975`, `apps/desktop/src/daemon/daemon.ts:985-991`, `apps/desktop/src/daemon/daemon.ts:4657-4666`
```

Why it matters: `daemonForLoad` asks `readyOf` for the lists of whatever daemon `daemon.json` names (`apps/desktop/src/main/daemon-client.ts:58`), before it asks whether that daemon is of another build. `ensureDaemon` then says its own hello through `answers` (`:86`), and the window says a third. Before this work a load said two. `main.ts:112` runs `daemonForLoad` at each load, the reload a second after a lost daemon among them.

Each hello costs the daemon work. `accept` calls `readOutside` for it (`apps/desktop/src/daemon/daemon.ts:943`), which makes every watched pull request due and starts `readCommitsNow` (`:964-975`). That read goes over every open work item's branch and record, and it is shared only while one is under way (`:4657-4666`). `greet` holds the `ready` for up to `readyWaitMs`, 500 ms, until that read ends (`:985-991`). The hellos are sequential: `readyOf` waits for its `ready` and closes before `answers` begins. So a load can wait up to 500 ms more than it did, and pay one more read of git, also where the daemon is of the app's own build. That is the load nearly every person makes. The replacement needs the lists only of a daemon that `otherBuild` reads as another build and that `replaced` does not hold.

The fix asks for the lists only there.

```ts
export async function daemonForLoad(runDir: string, daemonScript: string, replaced: Set<string | undefined>, { startMs, stopMs }: { startMs?: number; stopMs?: number } = {}): Promise<Discovery> {
  const running = readDiscovery(runDir);
  if (running && otherBuild(running, daemonScript) && !replaced.has(running.build)) {
    const ready = await readyOf(running);
    if (ready && runsNothing(ready)) {
      replaced.add(running.build);
      await stopDaemon(runDir, stopMs);
    }
  }
  return ensureDaemon(runDir, daemonScript, startMs);
}
```

The docstring of `daemonForLoad` (`:36-55`) stays true as it stands. A case that pins it: the stand-in of `apps/desktop/test/daemon-client.test.ts` notes each hello it answers, and the case "keeps a daemon of the script's own build that runs nothing" reads one. Against the code at the target the file reads `hh`. The other cases that use the stand-in read no such file.

```ts
     server.on("connection", (socket) => socket.on("message", (raw) => {
       if (JSON.parse(String(raw)).token === ${JSON.stringify(token)}) {
         require("node:fs").appendFileSync(join(process.env.OWLERY_RUN_DIR, "hellos"), "h");
         socket.send(JSON.stringify({ ...${JSON.stringify(lists)}, type: "ready" }));
       } else socket.close();
     }));`,
```

and, in the case "keeps a daemon of the script's own build that runs nothing", after its last `expect`:

```ts
    // One hello, `ensureDaemon`'s: the lists of a daemon of the script's own build are not asked for.
    expect(readFileSync(join(dir, "hellos"), "utf8")).toBe("h");
```

The case is shown red against the code at the target before it is committed (contract rule 15).

### 3. `routing.md` says the branch its table names was cut at `e9fe914c`, and states the move to the fresh branch in a second paragraph beside it

```seal
severity: should
location: `seal/threads/1795673153-133-an-idle-daemon-of-another-build-is-replaced/routing.md:22`, `seal/threads/1795673153-133-an-idle-daemon-of-another-build-is-replaced/routing.md:25`
evidence: executed `git merge-base HEAD origin/release/v0.0.5` (printed `57449b14…`) and `git log --oneline -5` at the target; read `routing.md:10`, `routing.md:22-25`
```

Why it matters: the table's Branch row names `feat/133-a-daemon-of-another-build-stays-on-release` (`routing.md:10`). The bullet under *Why this way* that opens "**Branch:**" says that branch was "cut from `release/v0.0.5` at `e9fe914c`", and that the combined branch "became this work's" (`:22`). The branch at the target was cut at `57449b14`, and `e651d395` is its first commit. The paragraph at `:25`, two blank lines below, says so, and the bullet still reads as the present. Contract rule 19 asks that a change rewrite the text it amends in place, so a reader does not choose between two statements. The sealer reads the routing's branch and base against the tree. The file also ends without a line break.

The bullet at `:22`, rewritten in place, with `:23-25` removed:

```markdown
- **Branch:** cut from `release/v0.0.5` at `57449b14` on 2026-11-27, carrying the work as one commit (`e651d395`); the pull request merges into `release/v0.0.5` by squash, after #216, whose refresh its phase 2 builds on. The work was built and reviewed first on `feat/133-a-daemon-of-another-build-stays-until-a-person-restarts-it` (`9215cd24`), cut at `e9fe914c`, on which the owner had #215, #216, #133 and #278 ride one pull request on 2026-11-26 ("CI를 계속돌리는건 너무 비효율적인데"), so it holds commits of #215 and #216 (`70c9dae1` and `bec979e2`'s line). The review chain's check seals one work item per pull request and refuses those commits' `Seal-Routing` trailers in a pull request that judges #133 alone, so the owner chose to split them ("C"), and that branch is kept as it was.
```

### 4. The frame places the work in release 0.1.0, and the issue and the roadmap place it in release 0.0.5

```seal
severity: should
location: `seal/threads/1795673153-133-an-idle-daemon-of-another-build-is-replaced/frame/plan.md:17`, `seal/threads/1795673153-133-an-idle-daemon-of-another-build-is-replaced/frame/design.md:24`
evidence: executed `gh issue view 133 --json milestone` (printed `release: 0.0.5`) and `git grep -n -F -e '0.1.0' -e '0.1.1' -- seal/threads/1795673153-133-an-idle-daemon-of-another-build-is-replaced` at the target; read `docs/roadmap.md:55-56`, `frame/plan.md:17`, `frame/design.md:24`
```

Why it matters: `frame/plan.md:17` concludes "That is the ground for building the daemon's parts in release 0.1.0 and not after it." `frame/design.md:24`, in *Grounding*, says "The issue's milestone is `release: 0.1.0`." At the target the issue's milestone is `release: 0.0.5`, and `docs/roadmap.md` *Releases and the tracker* names "a daemon of another build replaced (#133)" in the row of 0.0.5, the walk release before 0.1.0 (`:55`). The sealer audits the records against the issue. The *Grounding* row was true when the framer read the issue, so the fix dates it and does not rewrite it. The plan's sentence is a conclusion of the work, read against the target. The other sentences the search printed hold: "the daemons it serves exist only before 0.1.0" (`frame/plan.md:41`) and the row "Leave the log's lines to 0.1.1" (`:50`) weigh 0.1.0 as the first public release, which it still is, and `routing.md:16` is the routing's dated account of 2026-11-26. The search is on the numbers, so it is a sample.

`frame/plan.md:17`, rewritten in place:

```markdown
- The daemon outlives the app, so each part of this work that lives in the daemon reaches a person one update late. That is the ground for building the daemon's parts in release 0.0.5, before the first public release, 0.1.0, and not after it.
```

The last sentence of the row at `frame/design.md:24`, rewritten in place:

```markdown
The issue's milestone was `release: 0.1.0` when the framer read it, and on 2026-11-26 the owner moved it to `release: 0.0.5`, the walk release before 0.1.0 (`docs/roadmap.md` *Releases and the tracker*).
```

## Confirmations

What matched: *Scope* items 1 and 2 at `apps/desktop/src/main/daemon-client.ts:26-63`, `apps/desktop/src/main/main.ts:112` and `:207`. The load's `start` act calls `daemonForLoad` inside `daemonControl`'s turn. It stops a daemon that answers, is of another build, is not held in `replaced` and runs nothing, through `stopDaemon`, and then starts the script's daemon through `ensureDaemon`. `main.ts:207` computes `otherBuild` from the daemon found, which is then the one just started. `runsNothing` is false unless all three lists are arrays and every entry is of the shape it reads, and it counts a `queued` headless session as running. Executed: the `runsNothing` and `daemonForLoad` groups in the first run under *Probes*, and scenario A's built-app case in the third.

What matched: *Scope* items 3 and 4. The build joins `replaced` before `stopDaemon` runs (`daemon-client.ts:60-61`), a daemon of a held build is kept, an absent build counts as one build, and a stop that rejects starts nothing. Executed: both variants of the once-per-build case and the failed-stop case.

What matched: *Scope* items 5 and 6 at `apps/desktop/src/daemon/daemon.ts:1820-1825` and `:997`. The comparison of the `type` values of `ClientMessage` with the `case` labels of `Daemon#handle` at the target, after #213, #216 and #223 merged, printed one type with no case, `hello`, which the connection takes before `handle` (executed, `awk` and `comm` under *Probes*). So `setPane` of #213 and `readLists` of #216 each have their arm, and no request of this build's window falls to the refusal. #213 offers "Rename…" and the colour only where a session carries `name`, which a daemon of an earlier build never sends (#213's `frame/design.md:72`), so a window of this build sends `setPane` to no such daemon. #223's stage lines go over the turn socket, not the window's protocol: the chain command sends a `stage` or `stage-ended` line and the daemon answers nothing (`apps/desktop/src/daemon/turn-socket.ts:1-17`, `:149-160`). So the refusal of item 5 and the wait of item 8 do not reach them. Executed: the case of scenario F and the rewritten `ask` case in the second run.

What matched: *Scope* item 7, and the row of `gaps.md` the proofer is handed on each place of a refusal. `case "error"` takes the one value `refusalSays` returns (`apps/desktop/src/renderer/renderer.ts:2078`) and gives it to the refresh, each `take…` of a form or dialog, `answered`, the rename dialog, the form and `tell`. `grep -n 'message\.message' src/renderer/*.ts` printed nothing (executed), so no place still shows the daemon's own sentence.

What matched: *Scope* item 8, with the creation's exemption. `answerWaits` arms nothing before `ready` or against `answersUnknown`, arms nothing for `createWorkItem` or for a message with no numeric `requestId`, ends a wait at any message that names its id, and refuses once (`apps/desktop/src/renderer/view.ts:992-1020`). `send` tells it of each message sent on a socket (`apps/desktop/src/renderer/shared.ts:79-83`), `onMessage` tells it of each message before its `switch` and of `ready` (`renderer.ts:1899`, `:1905`), and `whenUnanswered(onMessage)` hands a made refusal to the same arm (`renderer.ts:145`). The daemon sends no message that names a `requestId` to every client: each `this.broadcast` call in `daemon.ts` sends an `accounts`, `agent`, `agentNotice`, `exit`, `headless`, `headlessDropped`, `inbox`, `keepAwake` or `machine` message, and none of those types carries a `requestId` in `ServerMessage` (`grep -n -o 'this.broadcast({ type: "[a-zA-Z]*"' src/daemon/daemon.ts`, executed, and `src/shared/protocol.ts`, read). So one window's request id is never ended by another window's answer. The window reloads after its socket closes, so no wait outlives the connection it was armed on. One press says one sentence: against a daemon without `answersUnknown` the 10-second refusal reaches `refreshing.refused`, which stops the 15-second timer and says the refusal alone (`apps/desktop/src/renderer/refresh.ts:55-86`). Against a daemon with the field only the 15-second end can fire. Executed: the `refusalSays` and `answerWaits` groups, the `refresh.test.ts` file and scenario H's case.

What matched: *Scope* items 9 to 11 and scenario L. `stop` calls `record(cause)` before it removes `daemon.json` or closes anything (`apps/desktop/src/daemon/main.ts:64`). `stopRecord` writes once and never throws (`apps/desktop/src/daemon/stop-record.ts:38-60`), and `recordErrors` listens to `uncaughtExceptionMonitor` alone. The start reads the standing `daemon.json` after it listens and before `writeDiscovery`, and passes over its own process id (`main.ts:114`). The rows of `gaps.md` the proofer is handed hold at HEAD: `onIdle` passes `"idle"` (`main.ts:99`), the process itself goes to `recordErrors` (`:102`), and SIGINT passes `"signal SIGINT"` (`:118`). Read. Executed: the group `the daemon's log of how a daemon ended` in `daemon.test.ts`, and the log group of `daemon-restart.test.ts`, its SIGTERM and SIGINT rows among them.

What matched: the trust of what crosses the process boundary. `runsNothing` reads the `ready` of whatever listens at the address `daemon.json` names, and every doubt keeps the daemon, so it fails closed. The start's hello sends the token a standing `daemon.json` names to the port it names. That token is the ended daemon's, and the new daemon makes its own (`main.ts:114-115`), so a process that now holds the port learns nothing it can use. The daemon's refusal echoes the request's type only to the authenticated socket that sent it.

What matched: each `from` of `frame/design.md` *Rule changes* stands once in `docs/architecture.md` or `docs/architecture.ko.md` at the target (`git grep -c -F` on each, executed, one each). The other designs that name *What a session survives* or *Overall layout* are #213's, #249/#251's and #188's. #213's `change` is of the sentence on the pane's record, and the other two change or add other sentences, as this frame's *Grounding* and *Overlap with the release* weigh. Finding 1 is the one cross-frame statement this round found standing.

Read without a finding: the new cases against their groups. `runsNothing` and `daemonForLoad` in `test/daemon-client.test.ts`; the three cases of scenario D in the `idle exit` group and the log group in `test/daemon.test.ts`; the case of scenario F and the rewritten `ask` case; the `refusalSays` and `answerWaits` groups in `test/view.test.ts`; and the cases of scenarios A, H, I and K in `test/daemon-restart.test.ts`. Each holds a fact of a *Scope* item or a scenario that no other case of its group holds. The unit cases of `runsNothing` and scenario D's cases on the daemon's real `ready` are not duplicates: the second tie the first to the lists the daemon sends. No test file declares the pairs `seal layout --pairs` reads.

What matched: the account of `gaps.md` and the phase records, sampled against the target. *Not verified* labels the broad gate `unverified` and names the orchestrator, which is honest: no phase and no round ran it. The closed SIGINT row names the case that closed it, which stands at `test/daemon-restart.test.ts`. The phase records' departures from the frame (a new module `stop-record.ts`, `freePort` exported, the counts 3 and 2, scenario D as three cases, #216's timer kept against Q1's default, #224's case rewritten) each stand in the diff as described.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate: the whole suite, the package's typecheck and the documents' check at the work item's last commit. This round ran the three commands its prompt allowed, and the suite stays `unverified`. Once the findings are closed and a verifying round leaves nothing open, the broad run is the orchestrator's, and the sealer's spawn follows it | `gaps.md:7` | the orchestrator, at the broad gate |
| Whether a stop that failed counts as a replacement under *Scope* item 3. The item says "a build this run of the app already replaced", and the code adds the build as the stop begins (`apps/desktop/src/main/daemon-client.ts:60`). The grounds are the phase's account alone (`trail/phases/phase-1.md`, the first decision), and no row of `frame/plan.md` *Judgments of the run* rules on it at the target | `frame/design.md:50`, `apps/desktop/src/main/daemon-client.ts:60` | the orchestrator, by a fold of item 3 or a ruling |
| A load, and a window, against a daemon of a released build, 0.0.2 to 0.0.4. The round carried the tags' readings from the earlier rounds and ran no daemon of a tag | `gaps.md:11`, `gaps.md:12` | the orchestrator, by a walk with a daemon of a released build, or the owner's walk of the release |
| The tab of a pane listed with `workItemId` null, and the seal button, against a daemon of an earlier build | `gaps.md:14`, `gaps.md:15` | the answerers those rows name |

## Probes

| Command | Result |
|---|---|
| `ELECTRON_SKIP_BINARY_DOWNLOAD=1 pnpm install --frozen-lockfile` at the worktree's root | exit 0 |
| `node scripts/test-in-electron.mjs test/daemon-client.test.ts test/view.test.ts test/refresh.test.ts` in `apps/desktop`, `OWLERY_BACKGROUND=1` | exit 0, 3 files and 643 cases passed |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "the daemon's local server\|idle exit\|the daemon's log of how a daemon ended\|starts no session at a message of a client"` in `apps/desktop`, the same environment | exit 0, 18 cases passed and 418 skipped |
| `node scripts/test-in-electron.mjs test/daemon-restart.test.ts` in `apps/desktop`, the same environment | exit 0, 10 cases passed in 39 seconds |
| the `type` values of `ClientMessage` in `src/shared/protocol.ts` against the `case` labels of `Daemon#handle`, cut with `awk` and compared with `comm -23` | one type without a case, `hello` |
| `gh issue view 133 --json milestone,title,state` | `release: 0.0.5`, open |
