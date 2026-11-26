# Review round 1: 1795636142-223-a-stage-a-pane-runs-shows-at-work

```seal
target: 7a3ec9ae against origin/release/v0.0.5
```

The branch was read against `origin/release/v0.0.5` at `c80b900a`, which the branch merged at `9ae0ddec`, in a `git clone --no-local` of the branch worktree checked out at `7a3ec9ae`. The diff under review is `c80b900a..7a3ec9ae`: phase 1 (`c05b0e43..9c499b80`), phase 2 (`b8bf9bdf..33b57598`) and the two folds (`ca02446a`, `7a3ec9ae`). This is the first round, so no coordinate or verdict was carried from an earlier round; every fact below was opened at the target. No `seal/parity.json` and no `Pact` key stand, so no parity comparison and no pact reading applies. The work item holds no `pr.md` and no `pr.<lang>.md` at the target, and `Commit and pull request language` and `Record language` are both English, so none is owed yet.

The orchestrator handed this round three questions the crafters left open. Finding 3 answers the one-second bound of `tellStage`. The drop of a pane's stage at an account change is right in the code, and finding 2 says what its frame states wrongly about it. Q1's default is weighed under *Not judged*, since only a person can answer it.

## Findings

### 1. A stage told before the daemon ends its pane at an archive or a removal stays at work while that pane's process outlives the wait

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:2312-2315`, `apps/desktop/src/daemon/daemon.ts:3006-3008`, `apps/desktop/test/daemon.test.ts:4836`, `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/frame/design.md:42`
evidence: read `apps/desktop/src/daemon/daemon.ts:2302-2321`, `apps/desktop/src/daemon/daemon.ts:2629-2640`, `apps/desktop/src/daemon/daemon.ts:2996-3008`, `apps/desktop/src/daemon/daemon.ts:1448-1470`, `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/frame/design.md:42`, `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/frame/design.md:142`
```

Why it matters: the frame's rule for the policy root says the daemon holds a stage "only where that id names a pane it lists, alive, in the work item whose worktree the command runs in, and that it has not ended at an archive or a removal, so a stage that no pane runs reads as the records say" (`frame/design.md:142`). The code applies that rule only to a stage told after the end. `stageTold` refuses a line from an ended pane (`daemon.ts:2998`, `pane.ended`). `endSessions` marks each pane `ended` and kills its process (`daemon.ts:2312-2315`), but drops no stage. The only drops are at `closePane` (`daemon.ts:2071`) and at the process's exit (`daemon.ts:2633`). So a stage told one second before an archive or a refused removal stays held until the process exits, while the same line one second after it is refused.

The case is the one phase 1 found by trying, a pane whose process ignores the hangup that ends it (`trail/phases/phase-1.md`, the paragraph opening **A pane the daemon ended is refused as well as one that exited**). A refused removal leaves such a pane listed and alive in a work item that is not archived. An archive goes on and archives the work item (`daemon.ts:1459-1469`), and `workItemOf` still carries the held stage as `paneStage` (`daemon.ts:2965-2969`). In both, the role's place reads at work with a growing age for a pane the daemon has ended. Scope item 4 (`frame/design.md:42`) lists the drops as `closePane` and `onExit` alone, so the code matches that list. It does not meet the rule's own ground, which is that a pane the daemon ended runs no stage. The case at `daemon.test.ts:4836` tells its stage only after the refused removal, so no case holds a stage told before it.

The fix drops the stage where the daemon ends the pane and sends the lists for it. The refused removal throws before any broadcast, so the drop sends its own lists:

```ts
  /** Drops the stage the pane told, where one stands, and says whether one stood. The caller sends the lists. */
  private dropStageOf(paneId: number): boolean {
    let dropped = false;
    for (const [workItemId, stage] of this.paneStages) if (stage.paneId === paneId) dropped = this.paneStages.delete(workItemId) || dropped;
    return dropped;
  }
```

```ts
    // in endSessions, in place of the loop at daemon.ts:2312-2315
    let dropped = false;
    for (const session of panes) {
      session.ended = true;
      session.terminal.kill();
      // A pane the daemon ended runs no stage, as `stageTold` refuses one from it.
      dropped = this.dropStageOf(session.info.id) || dropped;
    }
    if (dropped) this.broadcastInbox();
```

The case at `daemon.test.ts:4836` gains a half that only this drop holds. The deaf pane tells its stage before the removal, and the work item's `paneStage` is null once the removal is refused:

```ts
    const deaf = await on.opened(a.id);
    await on.c.until(() => (on.c.messages.some((m) => m.type === "output" && m.id === deaf && m.data.includes("deaf")) ? true : undefined));
    // A stage told before the daemon ends the pane: the end drops it.
    on.d.stageTold({ is: "stage", folder: a.worktree, pane: deaf, kind: "round", round: 1 });
    await on.carried(a.id, (stage) => stage !== null);
    const running = { panes: [deaf], headless: [] };
    expect((await on.c.asked({ type: "removeRepository", requestId: 1, id: 1, workItems: [a.id], running })).type).toBe("error");
    expect(await on.carried(a.id, (stage) => stage === null)).toBeNull();
```

The case's title then names both halves, a stage told before the end and one told after it. Scope item 4 at `frame/design.md:42` gains the drop in its list of drops: "A pane that leaves the lists (`closePane`), that the daemon ends at an archive or a removal (`endSessions`), or whose process exits (`onExit`) drops the stage it told." Finding 2's text for `frame/design.md:142` and `:147` already names this drop, and the fix pass removes that clause there if it rejects this finding.

### 2. The frame's policy text says a pane's stage drops when the pane ends, and the code drops it at every exit of the pane's process, an account change among them, where the pane does not end

```seal
severity: should
location: `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/frame/design.md:113`, `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/frame/design.md:118`, `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/frame/design.md:142`, `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/frame/design.md:147`, `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/changelog.md:6`, `apps/desktop/test/daemon.test.ts`
evidence: executed `git grep -n -e 'the pane ends' -e "the pane's end" -e 'when that pane ends' -e '칸이 끝' 7a3ec9ae -- seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work`; read `apps/desktop/src/daemon/daemon.ts:2609-2640`, `apps/desktop/src/daemon/daemon.ts:1995-2050`
```

Why it matters: the drop at an account change is right. The gaps row on it holds by reading. `onExit` drops the stage at `daemon.ts:2633`, before the branch where `session.replacing` returns at `:2635`. `changeAccount` then sends the lists with `broadcastInbox` once the new process is spawned (`daemon.ts:2049`). Every other way out of the change also sends them: `standsEnded` broadcasts, a close went through `closePane`, which broadcasts, and a closed daemon has no client. The change kills the process, and a background subagent dies with it. The new process resumes the conversation (`daemon.ts:2039`, `resume: session.conversation`), so no role runs, and the place reading the records is true.

The frame's text says otherwise. In this codebase a pane's end is defined at `daemon.ts:2609-2615`: "its end is the pane's end … A process the daemon ended for a change of the pane's account ends nothing of the pane: the next process takes its place." The rule the settle writes into `docs/architecture.md` says the daemon "drops it when that pane ends" and that a left stage "reads at work until the pane ends" (`frame/design.md:142`, the Korean at `:147`). The product rule says the place is at work "until … the pane ends" (`:113`, the Korean at `:118`). By the codebase's own words, an account change keeps the pane and ends its process, so these sentences say the stage survives an account change. A later framer who reads `docs/architecture.md` after the settle would take the drop at `daemon.ts:2633` for a defect. Scope item 4 (`frame/design.md:42`) and the changelog's first sentence (`changelog.md:6`, "once the pane is closed or its process ends") state the code rightly.

The command above printed ten statements. The snippet covers the four the settle writes into the policy root and the changelog's second sentence, which a person reads. The other five restate Q1's default in frame text no settle writes: `frame/design.md:52`, `frame/plan.md:11`, `:13` and `:19`, and `frame/questions.md:15`. The fix pass owes them the same words, "until the pane is closed or its process ends", or a reason to leave them. The search reads only these spellings, so it is a sample (contract rule 12). A statement in other words escapes it.

```text
frame/design.md:113, the `to` of docs/product.md *The seal*, its last sentence:
In a pane the session runs the stages, so a role's place is at work from the step the chain command hands it until the command records the role's answer, the command hands no stage, or the pane is closed or its process ends.

frame/design.md:118, the `to` of docs/product.ko.md *인장*, its last sentence:
칸에서는 세션이 단계를 돌리므로, 역할의 자리는 체인 명령이 그 단계를 건넨 때부터 명령이 역할의 답을 기록하거나, 건넬 단계가 없다고 하거나, 칸이 닫히거나 그 프로세스가 끝날 때까지 일하는 중입니다.

frame/design.md:142, the `add` to docs/architecture.md, its first sentence and its last but one:
**The daemon holds a pane's stage in memory, for a live pane of the work item, and drops it when that pane is closed, when the daemon ends the pane at an archive or a removal, and at every exit of the pane's process, the one a change of the pane's account waits on among them.**
A stage that a live pane's session leaves without calling the chain command again reads at work until the pane is closed or its process ends, because the pane's agent state comes from its hooks, which the line does not read, and a role run in the background leaves the session's own turn ended while the stage works.

frame/design.md:147, the `add` to docs/architecture.ko.md, its first sentence and its last but one:
**데몬은 칸의 단계를 메모리에만, 그 작업의 살아 있는 칸에 대해서만 두고, 그 칸이 닫히거나, 데몬이 보관이나 제거 때 그 칸을 끝내거나, 그 칸의 프로세스가 끝날 때마다 버립니다. 칸의 계정을 바꿀 때 기다리는 프로세스의 끝도 그중 하나입니다.**
살아 있는 칸의 세션이 체인 명령을 다시 부르지 않고 떠난 단계는 그 칸이 닫히거나 그 프로세스가 끝날 때까지 일하는 중으로 읽힙니다.

changelog.md:6, its second sentence:
A stage that a live pane's session leaves without calling the chain command again stays at work until the pane is closed or its process ends.
```

Once the frame states the drop at an account change, it is a behaviour the diff changed that no case holds. The case at `daemon.test.ts:4880` drops at an exit of a pane that is not being replaced, so moving the drop below the `replacing` return keeps it green. A case in `apps/desktop/test/daemon.test.ts` beside the account-change cases (`daemon.test.ts:8593` and after) is owed. It tells a stage from a Claude Code pane, changes the pane's account, and reads `paneStage` null in the lists the change sends. It is shown red with the drop at `daemon.ts:2633` moved below the `replacing` return. The cases there need accounts that keep the same conversations, which those cases already set up, so no snippet is given here.

### 3. No case holds the one-second bound of `tellStage`, and the probe of this round shows a case can

```seal
severity: should
location: `apps/desktop/test/heavy-run.test.ts:247`, `apps/desktop/src/daemon/turn-socket.ts:393-415`, `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/gaps.md:7`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_stage_bound.test.ts test/heavy-run.test.ts test/chain-command.test.ts` in the round's clone at `7a3ec9ae`; read `apps/desktop/src/daemon/turn-socket.ts:393-415`, `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/trail/phases/phase-1.md`
```

Why it matters: Scope item 1 states the bound as a fact of the build: the command "waits for the write to end and for nothing the daemon answers, one second at most" (`frame/design.md:39`). By reading, the bound holds. `settle` is armed by `setTimeout` at `turn-socket.ts:403`, destroys the connection, and resolves, and every other path clears the timer. But phase 1's `seal mutate` of `limit = setTimeout(settle, waitMs)` to `limit = undefined` SURVIVED (`trail/phases/phase-1.md`, the `turn-socket.ts` bullet). Removing the bound would ship a chain command whose `owed`, `round`, `fix-pass` and `seal` can hang on a daemon that accepts and does not read, and nothing in the suite would say so. The gaps row hands this to the proofer "by reading". Reading settles that the bound holds today. It does not settle that the next edit keeps it, which is what a regression test is for.

A case can make the write hang without mocking. The probe of this round opened a server with `pauseOnConnect: true` that never reads, and wrote one line of 8 MB to it. A raw `end(line, callback)` on that connection had not ended after two seconds. `tellStage` with a wait of 300 ms settled in under 1.5 s (executed, below). With the mutant, `tellStage` never resolves, so the case fails at the describe's 60-second timeout.

```ts
// apps/desktop/test/heavy-run.test.ts: the imports gain createServer, Socket and tellStage
import { createConnection, createServer, type Socket } from "node:net";
import { type StageLine, TURN_SOCKET, TurnServer, takeTurn, tellStage, turnGiver } from "../src/daemon/turn-socket";

// in describe("the stage lines of the turn socket"), after the case at :263
  it("settles a stage line's tell at its wait where the daemon accepts the connection and never reads, so a chain command ends within its bound (issue #223)", async () => {
    const on = commandOn(cleanups);
    const socketPath = join(on.runDir, TURN_SOCKET);
    const held: Socket[] = [];
    const deaf = createServer({ pauseOnConnect: true }, (socket) => held.push(socket));
    await new Promise<void>((resolve) => inside(dirname(socketPath), () => deaf.listen(basename(socketPath), resolve)));
    cleanups.push(() => {
      for (const socket of held) socket.destroy();
      deaf.close();
    });
    // A line longer than the socket's buffers, which a daemon that never reads leaves unwritten, so only the wait settles the tell.
    const started = Date.now();
    await tellStage(socketPath, { is: "stage-ended", folder: "x".repeat(8_000_000) }, 300);
    expect(Date.now() - started).toBeLessThan(1_500);
  });
```

The case is shown red by the `seal mutate` run phase 1 records, `limit = setTimeout(settle, waitMs)` to `limit = undefined`, run over `test/heavy-run.test.ts`. Once it is red there, the row at `gaps.md:7` is marked `closed`, and its answer names the case.

## Confirmations

What matched: the precedence of `approvalPlaces` with the daemon's own broad gate (read `apps/desktop/src/renderer/view.ts:695-745` and `apps/desktop/src/daemon/daemon.ts:3950-3990`; executed through `test/view.test.ts -t "the approval line"`). `runGate` asks the keeper with the place `gate` (`daemon.ts:3951`), so `paneStageOf` reads a gate for the daemon's own gate (`daemon.ts:2966-2967`). Where the turn waits, the chain lists its gate stage as working right after the ask (`daemon.ts:3952-3953`). `byChain(role, workItem, "working")` then stands first, and `byPane` returns null whenever `runningStage` gives any stage (`view.ts:713`). So the place keeps the daemon's stage and its age, which `view.test.ts:1693-1694` pins. Where the turn comes at once, the chain lists its stage only after `await asked.turn` (`daemon.ts:3961`, `:3989`). Between the two, `byPane` draws the same note, "Broad gate", from the ask's time, which is milliseconds earlier, so the person sees no difference. After the run, `giver.ran` ends the ask before the chain's stage leaves `working`. So a failed gate reads "Gate failed" from `byChain(role, workItem, "failed")` and never a pane's gate. A pane's stage stands over a failed stage of the daemon's chain, and a chain a restarted daemon reads as stopped runs no stage, as Scope item 6 orders (`view.test.ts:1696-1704`).

What matched: Scope items 1 to 3 (read `apps/desktop/src/daemon/chain-command.ts:297-348`, `:385-398`, `:410-430`, `:516-533`, and `apps/desktop/src/daemon/turn-socket.ts:140-162`, `:240-255`; executed through `test/chain-command.test.ts` and `test/heavy-run.test.ts`). `owed` tells a `stage` line only after `stepHere` has written the prompt, tells `stage-ended` for `start`, `parked`, `sealed`, `gate` and `ceiling`, and tells nothing where `here` or `stepHere` refuses. `paneOf` takes digits alone as a safe integer. `round`, `fix-pass` and `seal` tell after the commit and before they print, and a `ChainStop` tells nothing. `stageLineOf` refuses a missing field, a wrong kind, a pane id that is not a whole number and a round below 1. `TurnServer.accept` hands the handler only a line that is no ask and reads as a stage line.

What matched: Scope items 4 and 5 for everything finding 1 leaves out (read `apps/desktop/src/daemon/daemon.ts:2955-3008`; executed through `test/daemon.test.ts -t "the stage a pane's session runs|carries only the fields the protocol names|creates a work item and opens a pane whose process runs in its worktree"`). The folder is matched by its real path against unarchived work items. A stage needs a live, listed and unended pane of that work item. The same kind and round keep their time. `stage-ended` reads the records before it sends the lists. The gate's ask is matched by `item.worktree`, which `worktreeNamed` gives every ask (`daemon.ts:633`, `:2930-2933`).

What matched: the record against the code. Each coordinate `trail/phases/phase-2.md` and `gaps.md` name at the target holds: `view.test.ts:1551`, `:1663`, `:1665`, `:1666`, `:1685`, `:1687`, `:1691` and `:1699`, and `approval-line.test.ts:316` and `:335` (read). The *Removes* row on `view.ts#approvalPlaces` matches the docstring at `view.ts:717-735`. Commits `08713da8`, `9a89bb20` and `fb05ba7d`, which `frame/design.md` and `frame/plan.md` name, stand on the branch (read, `git log`). Every `from` of `## Rule changes` stands word for word in its file at the target (executed: a `grep -F` of each `from` against its `file:`). Scenario 9's absence search prints nothing (executed: `git grep -n -i 'for one thing' 7a3ec9ae -- apps`, exit 1).

What matched: the record against another work item's frame (executed: `grep -n -F` of each section heading this design changes over `seal/threads/*/frame/design.md`). #224 changes other sentences of *Options for launching Claude Code* and *Components and their states*. #217 adds rows to *Components and their states*. #235 and #246 change other sentences of *Code runs the order, the orchestrator judges*. None quotes a sentence this design changes, and #246's `ceiling` step is the one `owed` ends a stage at.

What matched: the closing memo. `gaps.md` is new in this range, so no row left it. Its third row is marked `closed` with the built-app case that answered it. The suite is labelled as the broad gate's in both phase records and in `gaps.md`, so the `unverified` label is honest.

What matched: the new cases, read against their groups. Each new case of `chain-command.test.ts`, `heavy-run.test.ts`, `daemon.test.ts` and `view.test.ts` holds a scenario of `frame/design.md` *User scenarios & acceptance* that no older case of its file holds. The view's cases and the built-app case hold the same place at different layers, the composed function and the drawn window, which Scope items 7 and 8 name apart. `seal layout --pairs` printed 0 pairs in the clone, so no duplicate check names a pair (executed).

The comment at `apps/desktop/src/daemon/chain-records.ts:4-7` names "the stage a pane's session runs" and then says "no hook and no session is read". By the reasoning phase 2 gave for rewording the case title, "no session" now has two readings. No reader acts on that comment at a step, so this round opens no finding for it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a stage a live pane's session leaves without calling the chain command again should stop reading at work before the pane's process ends (Q1's default, `pane's end`). It can mislead in several ways. A person interrupts the role and goes on in the same pane. A subagent fails and the session stops. `owed` is run only to look (Q2). A round record is committed by hand instead of through `round`. In each, the place reads "Proofer: Round N" at work with a growing age while the pane's own mark says the session is idle. What bounds it is the next `owed`, which `role-bundle/skills/seal/SKILL.md` *The loop* runs after each step, the pane's close or its process's exit, and the age the mark shows. The SDD set makes this the deliberate default (`frame/design.md:52`, the `add` at `:142`, `frame/questions.md:15`), so it is no finding of this round. | `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/frame/questions.md:15` | a person: the owner, through Q1 |
| Whether a real pane's session runs `owed` right before each role and never only to look, so the place's age counts from the role's start (Q2). | `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/frame/questions.md:16` | a measurement: the owner's next walk of a pane's chain |
| The built-app batch: the claim that `test/approval-line.test.ts` passed 7 of 7 at `08713da8`, and the built-app files that import `renderer/view.ts` and that phase 2 did not run. This round ran no built app. | `apps/desktop/test/approval-line.test.ts:316`, `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/gaps.md:10` | the orchestrator, at the broad gate |
| The suite as a whole, the typecheck and the broad gate, which this round did not run (contract rule 2). The phases' `tsc --noEmit` passes are read, not run. | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_stage_bound.test.ts test/heavy-run.test.ts test/chain-command.test.ts`, in `apps/desktop` of the round's clone at `7a3ec9ae` | 3 files, 33 cases passed, exit 0. The probe `test_tmp_stage_bound.test.ts` opened a server with `pauseOnConnect: true` that never reads. A raw `end` of an 8 MB line on it was still pending after 2 s, and `tellStage(path, line, 300)` settled in under 1.5 s. The new cases of the other two files passed. |
| `node scripts/test-in-electron.mjs test/view.test.ts -t "the approval line"`, same clone | 13 passed, 580 skipped, exit 0 |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "the stage a pane's session runs\|carries only the fields the protocol names\|creates a work item and opens a pane whose process runs in its worktree"`, same clone | 9 passed, 405 skipped, exit 0 |
