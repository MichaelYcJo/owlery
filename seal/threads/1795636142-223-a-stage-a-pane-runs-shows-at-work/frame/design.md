# Design: 1795636142-223-a-stage-a-pane-runs-shows-at-work (#223)

## Grounding

The tree as read at `8b026e67`, the merge of `origin/release/v0.0.5` at `c35c8271` into this branch.

| Policy clause | What it fixes for this work |
|---|---|
| `routing.md` of this work item (read) | The run is unattended (`Automation` `yes`), goes through the review chain to a pull request, and the frame decides how the daemon learns of a pane's stage and when that stage ends. |
| Issue #223 (executed: `gh issue view 223 --json title,body,comments`, 2026-11-26) | No comment. Done when a role a pane's session runs shows at work with the stage's note and age, a pane that ends leaves the place as the records say, cases cover a stage starting, ending and being abandoned, a built-app case reads the line while a stand-in session holds a stage open, and the approval line's row in both editions of `docs/design.md` states that a pane's own stage shows. The spawn carried no line on the comments; the command above read them. |
| Issue #223's milestone (executed: `gh issue view 223 --json milestone`) | The milestone reads `release: 0.1.0`. The orchestrator took the item into release 0.0.5, which this frame does not reopen. |
| `docs/product.md` *The seal*, item 1 **An approval line per work item** (read, `product.md:70`) | "The line is drawn from the work item's records and from the state of its chain, and from no hook." The line keeps reading no hook. What the chain command tells the daemon is Owlery's code reading the records, so it is no hook, and `## Rule changes` names it as a third source. |
| `docs/design.md` *Components and their states*, the row **The approval line** (read, `design.md:456`) | The note of a place at work is "the stage the work item's chain runs for the role, "Round 2", "Fix pass" or "Judging"", and "Broad gate" for the sealer's place while the chain runs the broad gate. A pane's stage takes the same notes, marks and age, so no new word and no new mark is drawn. |
| `docs/architecture.md` *Code runs the order, the orchestrator judges*, the paragraph opening **In a pane the session runs each stage, and the chain command keeps the order and writes each record** (read, `architecture.md:311`) | "It asks the daemon for one thing, a turn on the machine before it runs the broad gate, and it runs the gate at once where no daemon answers." This work adds a second thing the command tells the daemon, so `## Rule changes` rewrites that sentence and adds the rule of the held stage. |
| `docs/architecture.md` *Options for launching Claude Code*, the paragraph opening **No tool of the app updates the approval line or records a cost** (read, `architecture.md:355`) | "The daemon draws the approval line from the work item's committed records and the state of its chain." No agent is given a tool for the line. The chain command's word is the stage the records owe, read by Owlery's code, so the rule's ground holds, and `## Rule changes` names the third source there. |
| `docs/architecture.md` *What a session survives* (read, `architecture.md:49`) | "A session's process lives as long as the daemon that started it." So a daemon that starts again lists no pane a stage held before could name, and the daemon stores no stage. |
| `shared/protocol.ts:497-498` (read) | The daemon's chain starts at `Daemon#startChain`, "which no client message reaches". So in this release a pane's session is the only party that runs the chain for a person, and the line says "Not started" for the whole of every such run. That is the premise milestone 2's design rested on, and it no longer holds (`plan.md` *Alternatives considered*, row E). |
| `renderer/view.ts#approvalPlaces` (`view.ts:707-717`), `#byChain` (`:681-688`), `#runningStage` (`:136-140`), `STAGES` (`:513-521`) (read) | A place's state is the first that holds: an open question of its role, then the daemon chain's newest stage of its role (working or failed), then the records. `STAGES` gives each kind's role, note and label: `round` the proofer's "Round N", `fix-pass` the crafter's "Fix pass", `seal` the sealer's "Judging", `gate` the sealer's "Broad gate". The function takes the work item alone, and its docstring says "no pane's state, no hook and no session changes it" (`:704-705`). |
| `daemon/chain-command.ts#owed` (`:297-322`), `#round` (`:351-365`), `#fixPass` (`:374-392`), `#seal` (`:475`), `ROLE_OF` (`:116-120`) (read) | `owed` prints `round`, `fix-pass` or `seal` with the round, and for those three writes the stage's prompt and rules file and names the bundle's agent. For every other step (`start`, `parked`, `sealed`, `gate`, `ceiling`) it hands no stage. `round`, `fix-pass` and `seal` commit the role's answer and print `recorded`; a refusal exits 1 and commits nothing. |
| The channel from a pane's command to the daemon (executed: `git grep -n 'createConnection\|takeTurn(' -- apps/desktop/src` at `8b026e67` prints `chain-command.ts:602`, `turn-socket.ts:16`, `:296` and `:308`) | The chain command's one channel to the daemon is the turn socket's `ask`. Nothing in the tree tells the daemon which stage a pane's session runs, and the `ask` cannot be extended to say it: it names a folder, a command's name and a place, and only `gate` and `run` send it. |
| `daemon/turn-socket.ts#TurnServer` (`:182-232`), `#askOf` (`:158-162`) (read) | The server reads one line per connection and destroys a connection whose first line is no `ask`. So a daemon of an earlier build drops a stage line and changes nothing, and a chain command of an earlier build sends none (scenario 10). |
| `daemon/hooks.ts:173` `PANE_VARIABLES` and `test/daemon.test.ts:7802` (read) | A pane's environment holds `OWLERY_PANE_ID`, its id in the daemon's lists, beside `OWLERY_CHAIN` and `OWLERY_BASE`. The session's commands inherit it as they inherit `OWLERY_CHAIN`, which `role-bundle/skills/seal/SKILL.md` *The loop* has them run. |
| `daemon/daemon.ts#workItemOf` (`:2892-2911`), `#closePane` (`:2026-2036`), the pane's `terminal.onExit` (`:2588-2622`), `#readRecord` (`:798-827`) (read) | A work item is composed per send with fields the daemon stores none of, `machineWait` from the keeper's queue and `wordOwed`. A pane leaves the lists at `closePane`, and its process's end is read at `onExit`, for a close, an archive, a removal and a process that ended by itself. `readRecord` reads a work item's records at once and says whether they changed. |
| `daemon/machine-turns.ts#queue` (`:179-183`), `Queued` (`:68-74`), `TURN_PLACES` (`:20-23`) (read) | The keeper lists each ask by folder, name, place and the time it asked, holding or waiting. The place `gate` is asked only by a broad gate, the daemon's own and the chain command's `gate`; the runner's commands ask as `review`, `build` or `outside` (`chain-command.ts:156-164`). |
| `apps/desktop/role-bundle/skills/seal/SKILL.md` *The loop* and *A role is a subagent of the bundle* (read) | The session runs `owed` before each step and again after it, starts the role the step names, and may run the subagent in the background and wait for its answer. So `owed` is said once at a stage's start, and a stage can run while the session's own turn has ended. |
| `daemon/hooks.ts#HOOK_EVENTS` (`:15-25`) and `role-bundle/hooks/hooks.json` (read) | The daemon hears `PreToolUse`, `PostToolUse`, `Stop` and the rest for every tool of a pane, and no `SubagentStart` or `SubagentStop`. The bundle's one hook is `PreToolUse` on `AskUserQuestion`. A hook names a tool's input, not the round the records owe (`plan.md` *Alternatives considered*, row B). |
| Earlier work items: #246's frame (`seal/threads/1795653549-246-a-panes-chain-stops-at-the-round-ceiling/frame/design.md`, read) and #224's (`seal/threads/1795610690-224-the-ask-section-goes/frame/design.md`, read) | #246 (merged as #262) made `owed` print `ceiling` and hand no stage at the ceiling, which this work reads as a step that ends the held stage. #224 rewrote the `approvalPlaces` case at `view.test.ts:1503` to say that no pane's state and no headless session changes the line; that case stays true, since the pane's stage reaches the function as a field of the work item. |
| The unsettled designs' `## Rule changes` (executed: the `## Rule changes` sections of every `seal/threads/*/frame/design.md` searched for "approval line", "asks the daemon for one thing", "turn on the machine before it runs the broad gate" and "from no hook") | Only #224's and #150's designs match, on sentences about the screenshot scene (*A pull request that changes the window carries its screenshots*). None quotes a sentence this design changes, so the policy in force at those sentences is the baseline. |
| `seal/follow-up.md`, `seal/parity.json`, the latest GitHub Release and the changelog fragments (executed: `ls seal`; `gh release view --json tagName,body`; `grep -l 'Process changes' seal/threads/*/changelog.md`) | No `seal/follow-up.md` and no `seal/parity.json` stand. The latest Release, `v0.0.4`, holds no `### Process changes` table, and no fragment does. |
| Issues #221 and #229 (executed: `gh issue view 221` and `229 --json milestone`) | Both concern the marks' shapes and are `owner: by hand`. This work draws a pane's stage with the working mark the place already has, and changes no shape. |
| A line written with `end()` and no wait for an answer (executed 2026-11-26: a probe `test_tmp_socket_line.cjs` in the framer's scratch directory, under Node v22.14.0, started 20 client processes that each connect to a Unix socket, call `end(line)` and exit; the server read 20 of 20 lines whole) | Under Node the command can send its line and exit without waiting on the daemon, so `owed` gains no wait a session feels. Electron's Node, which the launcher runs, was not run (`frame/questions.md` Q3). |
| The new names (executed: `git grep -n -i 'paneStage\|pane_stage\|stage-ended\|is: "stage"' 8b026e67 -- apps docs pr-check` prints nothing) | No field, message or text of the tree uses them. |
| The absence search of scenario 9 (executed at `8b026e67`: `git grep -n -i 'for one thing' -- apps` prints `apps/desktop/src/daemon/chain-command.ts:12` and no other line) | That comment is rewritten by *Scope* item 9, so after the build the search prints nothing. The pathspec `apps` leaves out `docs/architecture.md:311` and its Korean edition, which the settle rewrites from `## Rule changes`, and this work item's directory, which quotes the phrase. |

## Scope

In scope, numbered for `plan.md`'s Delivers cells:

1. **`owed` tells the daemon the stage it hands.** Where `owed` prints `round`, `fix-pass` or `seal`, after it has written the stage's prompt and rules file, it sends the daemon one `stage` line (*Data & interfaces*) with the worktree's top, the pane's id read from `OWLERY_PANE_ID`, the step's kind and its round. Where it prints any other step, `start`, `parked`, `sealed`, `gate` or `ceiling`, it sends one `stage-ended` line. A refused `owed` sends nothing. Where `OWLERY_PANE_ID` holds no whole number it sends no `stage` line, and still sends `stage-ended`. The line goes to the turn socket the command already finds (`chain-command.ts#turnSocket`). Where no socket is named, no daemon listens or the write fails, the command says nothing of it and prints what it prints today, with the same exit code. It waits for the write to end and for nothing the daemon answers, one second at most.
2. **Recording a role's answer ends the stage.** `round`, `fix-pass` and `seal` send one `stage-ended` line after their commit and before they print. A refused call sends nothing, so the stage stays at work while the session tries again.
3. **The turn socket carries the two lines.** `turn-socket.ts` reads a first line that is a `stage` or a `stage-ended` line, hands it to a handler `TurnServer.listen` takes as its optional third argument, and closes the connection. A first line that is neither those nor an `ask` closes it as today. `main.ts` passes the daemon's handler. Both lines are read through `fieldsOf`, and a line with a field missing or of another kind is no such line.
4. **The daemon holds one stage per work item, in memory.** The handler finds the work item whose worktree the folder is, as `worktreeNamed` finds it, and does nothing for a folder that is no unarchived work item's. A `stage` line is held only where its pane id names a pane the daemon lists, alive, in that work item, and that the daemon has not ended. A pane of another work item, an exited pane and an unknown id hold nothing, and neither does a pane the daemon ended at an archive or a removal (`pane.ended`), which stays alive and listed where its process outlives the wait. The stage held replaces the work item's earlier one, and where it is of the same kind and round it keeps the earlier one's time, so a session that asks `owed` again does not restart the age. A `stage-ended` line drops the work item's stage, whichever pane told it, and the daemon reads the work item's records (`readRecord`) before it sends the lists, so the place does not fall back to a reading older than the record just committed. A pane that leaves the lists (`closePane`), that the daemon ends at an archive or a removal (`endSessions`), or whose process exits (`onExit`) drops the stage it told. A stage told before the daemon ended the pane is dropped at that end, and one told after it is refused, so a pane the daemon ended holds none either way. The exit of the process that a change of the pane's account replaces is such an exit: the pane stays, and its new process resumes the conversation, in which no role runs. Each change sends every client the lists. The daemon stores none of it (*Grounding*, the row on *What a session survives*).
5. **The work item carries the stage.** `WorkItem.paneStage` (*Data & interfaces*) is composed in `workItemOf`: where the keeper lists an ask of the place `gate` in the work item's worktree, holding a turn or waiting, a stage of the kind `gate` from that ask's time; otherwise the stage the daemon holds; otherwise null. A gate's round is the number of round records the records hold. The daemon's own broad gate asks with the place `gate` as well (`daemon.ts:3951`), so `paneStage` reads `gate` while the daemon's chain runs its gate, and *Scope* item 6 puts the daemon chain's running stage over it. A change of the keeper's queue already sends the lists (`daemon.ts:606-612`).
6. **The approval line draws it.** `view.ts` gains `byPane(role, workItem)`, which reads `paneStage` through `STAGES[kind].marks` and gives a place at work with the kind's note and label and the stage's time as its age. In `approvalPlaces` a place takes the first that holds: an open question of its role; the daemon chain's running stage of its role; the pane's stage of its role, where the daemon's chain runs no stage; the daemon chain's newest stage of its role where it failed; the records. A pane's stage of the kind `gate` reads "Broad gate" on the sealer's place, and of `seal` "Judging". The docstring of `approvalPlaces` names `paneStage` as one source, and says that no pane's agent state, no hook and no session changes the line.
7. **Unit cases** in `test/chain-command.test.ts`, the turn socket's file `test/heavy-run.test.ts`, `test/daemon.test.ts` and `test/view.test.ts`, as *User scenarios & acceptance* names them.
8. **A built-app case** in `test/approval-line.test.ts`: a stand-in session in a pane of the work item runs the built chain command's `owed`, which hands round 1, and stays. The view's line then shows the proofer's place at work with "Round 1" and its age. Once the pane is closed, the place reads as the records say. Which stand-in runs the command, a Claude Code pane's stand-in CLI or a shell pane whose script runs it with the pane's variables, is the phase's to choose and record.
9. **The comments that state the old fact are rewritten in place:** `chain-command.ts:11-14` ("asks the daemon for one thing"), the head of `turn-socket.ts` (`:1-14`), which says the socket serves one `ask` per connection, the comment above `TurnServer.listen` in `main.ts:94`, the docstring of `approvalPlaces` (`view.ts:704-705`), and `chain-records.ts:4-5`, which says the window draws the line from the records and the questions and reads no hook and no session. The last two say what the window reads, so they are rewritten with *Scope* item 6, once the window draws `paneStage`.
10. **The policy root's three documents, in both editions**, through `## Rule changes`, for the settle. The issue's last bullet, the approval line's row of `docs/design.md`, is met there: this work's subject is the code, so it states its rules for the settle and does not edit the policy root (`skills/implement/SKILL.md` *Document layout — two roots, three lifetimes*).

Out of scope:

- **A time limit on a stage a live pane's session leaves.** Such a stage reads at work until the pane is closed or its process ends, or the chain command is called again. `plan.md` *Alternatives considered*, row H, holds the failure of a limit, and `frame/questions.md` Q1 asks whether the product wants one.
- **The inbox's line, its second row and the view's list of the daemon's chain.** The pane's own state already says it works, from its hooks, and the list at the view's foot is the daemon's chain alone (#224).
- **A pane's stage that fails.** A refused `round`, `fix-pass` or `seal` leaves the stage at work, since the session corrects and calls again. The command keeps no failure, and the place says "Failed" only for the daemon's own chain.
- **The cost of a pane's stages.** No hook carries a cost (`docs/architecture.md` *What changes because Owlery is not a plugin*, the row *Measuring cost*), and nothing here changes that.
- **The screenshot scene.** *A pull request that changes the window carries its screenshots* says no shot shows a stage at work, and the scene starts no pane that runs the chain command. This work draws no new word or mark, so the shots change nothing.
- **The marks' shapes**, issues #221 and #229.
- **What the daemon could do beyond the issue.** A person's word is committed while no pane of the work item says it works (`protocol.ts:904`). A crafter's fix pass run as a background subagent leaves the pane's own turn ended while the pass edits and commits, so the word's commit can meet the pass's in the same worktree. `wordOwedOf` could also wait while `paneStage` is a fix pass. This is a proposal for an issue, which the orchestrator files or drops; nothing of it is built here.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A pane's round shows at work | Given a work item whose records hold no round and a pane of it, when the pane's session runs `owed` and it prints `round` 1, then the work item's `paneStage` is a round of round 1 from the daemon's time of the line, and four minutes on the proofer's place is `working`, "Round 1", "Proofer: Round 1, 4 min". | `test/chain-command.test.ts` (the line sent, with the pane's id), `test/daemon.test.ts` (the stage held for a live pane and sent in the lists), `test/view.test.ts` (the place's state, note and words) |
| 2. A fix pass and a seal show at their roles | When `owed` prints `fix-pass` on round 2, the crafter's place is at work with "Fix pass" and "Crafter: Fix pass on round 2"; when it prints `seal`, the sealer's place is at work with "Judging". | `test/chain-command.test.ts`, `test/view.test.ts` |
| 3. The stage ends at the record | When `round <file>` records the proofer's answer, the daemon drops the stage, reads the records again and sends the lists, and the proofer's place says "1 round". A refused `round` changes nothing. | `test/chain-command.test.ts` (a `stage-ended` line after the commit, none at a refusal), `test/daemon.test.ts` (`paneStage` null and `recorded.rounds` 1 in the same lists) |
| 4. A stage abandoned for another step ends | When `owed` prints a step that hands no stage, `gate`, `ceiling`, `parked`, `sealed` or `start`, the stage held ends. When `owed` hands the same round again, the age keeps counting from the first time. | `test/chain-command.test.ts`, `test/daemon.test.ts` |
| 5. A pane that ends leaves the records' word | Given a stage held for a pane, when that pane is closed, when the daemon ends it at an archive or a removal, or when its process exits, an exit at a change of the pane's account among them, then `paneStage` is null and the place reads as the records say. A stage told with the id of another work item's pane, of an exited pane, of a pane the daemon ended at an archive or a removal, or of no pane is not held. | `test/daemon.test.ts` |
| 6. A pane's broad gate shows on the sealer's place | While the chain command's `gate` waits for its turn or runs in the worktree, `paneStage` is a `gate` from its ask's time, and the sealer's place is at work with "Broad gate"; at the turn's end it reads as the records say. | `test/daemon.test.ts`, `test/view.test.ts` |
| 7. The daemon's chain and a question keep their place | An open question of the role still marks the place waiting over a pane's stage; the daemon chain's running stage stands over a pane's, and a running gate of the daemon's chain over the `paneStage` gate its own ask gives; a pane's stage stands over a failed stage of the daemon's chain of that role; a work item a daemon of an earlier build sends, with no `paneStage`, draws as today. | `test/view.test.ts` |
| 8. The window shows it | In the built app, a stand-in session in a pane holds round 1 open through the built chain command, and the view's approval line shows the proofer at work with "Round 1"; once the pane is closed the place says what the records say. | `test/approval-line.test.ts`, run in the built-app batch at the end of the phase |
| 9. No comment states the old channel | After the build no text under `apps` says the chain command asks the daemon for one thing. | `git grep -n -i 'for one thing' -- apps` prints nothing (*Grounding*, the last row) |
| 10. Builds of two ages | A chain command of an earlier build sends no line, and the place reads as today. A daemon of an earlier build destroys the connection of a stage line, and the command prints what it prints today. | `test/chain-command.test.ts`: the command against no socket and against a socket that closes at once prints its JSON and exits 0 |

## Data & interfaces

**`shared/protocol.ts`**, beside `wordOwed`:

```ts
/** A stage of the work item's chain that a pane's session runs through the chain command, as the daemon holds it: the kind and the round `owed` handed, from the daemon's time of its word, or the broad gate the command's `gate` waits for or runs, from its ask. */
export interface PaneStage {
  kind: "round" | "fix-pass" | "seal" | "gate";
  /** The round a round is, the round a fix pass answers, the last round recorded before a seal or a broad gate. */
  round: number;
  /** The daemon's clock when the stage was first told, or when the gate asked for its turn. */
  since: number;
}

// on WorkItem:
/** The stage a pane's session runs, or null where none runs. The daemon stores none, so a look keeps none. A daemon of an earlier build sends no such field, and a client reads its absence as null. */
paneStage?: PaneStage | null;
```

**The turn socket's two new lines**, each the first line of a connection the chain command opens and closes:

```json
{"is":"stage","folder":"<the worktree's top>","pane":7,"kind":"round","round":1}
{"is":"stage-ended","folder":"<the worktree's top>"}
```

`kind` is one of `round`, `fix-pass` and `seal`; `pane` and `round` are whole numbers, and `round` is 1 or more. The daemon answers neither line. `TurnServer.listen(socketPath, giver, told)` takes `told: (line: StageLine) => void` as an optional third argument, which defaults to a handler that does nothing, so a server given none closes a stage line's connection as it closes any line that is no `ask`.

**`chain-command.ts`** gains one function that sends a line and resolves once the write ended, the connection failed or a second passed, whichever comes first, and never throws. `owed`, `round`, `fix-pass` and `seal` call it as *Scope* items 1 and 2 say. The JSON each subcommand prints does not change.

**`daemon.ts`** gains a map from a work item's id to `{ paneId, kind, round, since }`, the handler, the drop at `closePane`, `endSessions` and `onExit`, and `paneStage` in `workItemOf`.

## Rule changes

- change
  file: docs/product.md
  section: The seal
  from: The line is drawn from the work item's records and from the state of its chain, and from no hook. The records give the frame, the commits of the branch, the rounds recorded, the gate's last run and the sealer's last verdict, and the chain gives the stage that runs and the one that failed.
  to: The line is drawn from the work item's records, from the state of its chain and from the stage the chain command handed a pane's session, and from no hook. The records give the frame, the commits of the branch, the rounds recorded, the gate's last run and the sealer's last verdict, and the chain gives the stage that runs and the one that failed. In a pane the session runs the stages, so a role's place is at work from the step the chain command hands it until the command records the role's answer, the command hands no stage, or the pane is closed or its process ends.
- change
  file: docs/product.ko.md
  section: 인장
  from: 이 줄은 작업의 기록과 체인의 상태로 그리고, 훅은 읽지 않습니다. 기록에서는 설계가 있는지, 브랜치의 커밋, 기록된 리뷰 회차, 전체 검사의 마지막 실행, sealer의 마지막 판정을 읽고, 체인에서는 지금 도는 단계와 실패한 단계를 읽습니다.
  to: 이 줄은 작업의 기록, 체인의 상태, 그리고 체인 명령이 칸의 세션에 건넨 단계로 그리고, 훅은 읽지 않습니다. 기록에서는 설계가 있는지, 브랜치의 커밋, 기록된 리뷰 회차, 전체 검사의 마지막 실행, sealer의 마지막 판정을 읽고, 체인에서는 지금 도는 단계와 실패한 단계를 읽습니다. 칸에서는 세션이 단계를 돌리므로, 역할의 자리는 체인 명령이 그 단계를 건넨 때부터 명령이 역할의 답을 기록하거나, 건넬 단계가 없다고 하거나, 칸이 닫히거나 그 프로세스가 끝날 때까지 일하는 중입니다.
- change
  file: docs/design.md
  section: Components and their states
  from: the stage the work item's chain runs for the role, "Round 2", "Fix pass" or "Judging", for a place at work, "Broad gate" for the sealer's place while the chain runs the repository's broad gate,
  to: the stage the work item's chain runs for the role, or the stage the chain command handed a pane's session for it, "Round 2", "Fix pass" or "Judging", for a place at work, "Broad gate" for the sealer's place while the chain or a pane's chain command runs the repository's broad gate,
- change
  file: docs/design.ko.md
  section: 부분과 그 상태
  from: 일하는 중인 자리에는 작업의 체인이 그 역할로 돌리는 단계인 "Round 2", "Fix pass", "Judging", 체인이 저장소의 전체 검사를 돌리는 동안의 sealer 자리에는 "Broad gate",
  to: 일하는 중인 자리에는 작업의 체인이 그 역할로 돌리는 단계, 또는 체인 명령이 칸의 세션에 그 역할로 건넨 단계인 "Round 2", "Fix pass", "Judging", 체인이나 칸의 체인 명령이 저장소의 전체 검사를 돌리는 동안의 sealer 자리에는 "Broad gate",
- change
  file: docs/architecture.md
  section: Code runs the order, the orchestrator judges
  from: It asks the daemon for one thing, a turn on the machine before it runs the broad gate, and it runs the gate at once where no daemon answers.
  to: It asks the daemon for a turn on the machine before it runs the broad gate, and runs the gate at once where no daemon answers. On the same socket it tells the daemon the stage `owed` handed the session, and that the stage ended once `round`, `fix-pass` or `seal` recorded the role's answer or `owed` handed no stage, so the work item's approval line shows the role at work.
- change
  file: docs/architecture.ko.md
  section: 순서는 코드가, 판단은 orchestrator가
  from: 데몬에는 한 가지만 청합니다. 전체 검사를 돌리기 전에 이 컴퓨터에서 돌 차례입니다. 답하는 데몬이 없으면 전체 검사를 바로 돌립니다.
  to: 데몬에는 전체 검사를 돌리기 전에 이 컴퓨터에서 돌 차례를 청하고, 답하는 데몬이 없으면 전체 검사를 바로 돌립니다. 같은 소켓으로 `owed`가 세션에 건넨 단계를 데몬에 알리고, `round`, `fix-pass`, `seal`이 역할의 답을 기록했거나 `owed`가 건넬 단계가 없을 때 그 단계가 끝났다고 알립니다. 그래서 작업의 승인 줄이 그 역할을 일하는 중으로 보입니다.
- add
  file: docs/architecture.md
  section: Code runs the order, the orchestrator judges
  to: **The daemon holds a pane's stage in memory, for a live pane of the work item, and drops it when that pane is closed, when the daemon ends the pane at an archive or a removal, and at every exit of the pane's process, the one a change of the pane's account waits on among them.** The chain command names its pane by `OWLERY_PANE_ID`, and the daemon holds a stage only where that id names a pane it lists, alive, in the work item whose worktree the command runs in, and that it has not ended at an archive or a removal, so a stage that no pane runs reads as the records say. One stage stands for a work item at a time: the newest one told replaces it, and a stage told again for the same kind and round keeps the time it was first told, which the place's age counts from. A broad gate the chain command runs reads at work from its ask for a turn on the machine to that turn's end. The daemon stores none of this, since a pane's process lives as long as the daemon that started it. A stage that a live pane's session leaves without calling the chain command again reads at work until the pane is closed or its process ends, because the pane's agent state comes from its hooks, which the line does not read, and a role run in the background leaves the session's own turn ended while the stage works.
    check: apps/desktop/test/chain-command.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts apps/desktop/test/approval-line.test.ts
- add
  file: docs/architecture.ko.md
  section: 순서는 코드가, 판단은 orchestrator가
  to: **데몬은 칸의 단계를 메모리에만, 그 작업의 살아 있는 칸에 대해서만 두고, 그 칸이 닫히거나, 데몬이 보관이나 제거 때 그 칸을 끝내거나, 그 칸의 프로세스가 끝날 때마다 버립니다. 칸의 계정을 바꿀 때 기다리는 프로세스의 끝도 그중 하나입니다.** 체인 명령은 자기 칸을 `OWLERY_PANE_ID`로 밝히고, 데몬은 그 id가 명령이 도는 워크트리의 작업에 속한, 살아 있는 칸으로 목록에 있고, 데몬이 보관이나 제거 때 끝낸 칸이 아닐 때만 단계를 둡니다. 그래서 어느 칸도 돌리지 않는 단계는 기록대로 읽힙니다. 한 작업에는 한 번에 한 단계만 놓입니다. 가장 최근에 알린 단계가 앞의 것을 대신하고, 같은 종류와 회차로 다시 알린 단계는 처음 알린 때를 그대로 두며, 자리의 시간은 그때부터 셉니다. 체인 명령이 돌리는 전체 검사는 이 컴퓨터에서 돌 차례를 청한 때부터 그 차례가 끝날 때까지 일하는 중으로 읽힙니다. 데몬은 이것을 하나도 저장하지 않습니다. 칸의 프로세스는 그것을 띄운 데몬만큼만 살기 때문입니다. 살아 있는 칸의 세션이 체인 명령을 다시 부르지 않고 떠난 단계는 그 칸이 닫히거나 그 프로세스가 끝날 때까지 일하는 중으로 읽힙니다. 칸의 에이전트 상태는 훅에서 오는데 이 줄은 훅을 읽지 않고, 백그라운드로 돈 역할은 단계가 도는 동안에도 세션의 차례를 끝난 채로 두기 때문입니다.
    check: apps/desktop/test/chain-command.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts apps/desktop/test/approval-line.test.ts
- change
  file: docs/architecture.md
  section: Options for launching Claude Code
  from: The daemon draws the approval line from the work item's committed records and the state of its chain, and reads a stage's cost from its session's result, so an agent is given no MCP tool for either and cannot write either.
  to: The daemon draws the approval line from the work item's committed records, the state of its chain and the stage the chain command says a pane's session runs, which is the stage the records owe as Owlery's code reads them, and reads a stage's cost from its session's result, so an agent is given no MCP tool for either and cannot write either.
- change
  file: docs/architecture.ko.md
  section: Claude Code를 띄우는 옵션
  from: 데몬은 커밋된 작업 기록과 체인의 상태로 승인 줄을 그리고, 단계의 비용은 그 세션의 결과에서 읽습니다.
  to: 데몬은 커밋된 작업 기록, 체인의 상태, 그리고 체인 명령이 칸의 세션이 돌린다고 알린 단계로 승인 줄을 그립니다. 그 단계는 Owlery의 코드가 읽은 기록이 빚진 단계입니다. 단계의 비용은 그 세션의 결과에서 읽습니다.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The comment's claim that the chain command asks the daemon for one thing | `apps/desktop/src/daemon/chain-command.ts:11-14` | Rewritten in place to name the turn and the stage lines (*Scope* item 9); the policy's sentence moves at the settle (`## Rule changes`). |
| The socket's head comment that a connection serves one `ask` for one command | `apps/desktop/src/daemon/turn-socket.ts:1-14` | Rewritten in place to name the `stage` and `stage-ended` lines and that the daemon answers neither. |
| The comment that the socket serves the runner's commands and a pane's gates | `apps/desktop/src/daemon/main.ts:94` | Rewritten in place to add the stage lines. |
| The docstring's clause that no pane's state changes the line | `apps/desktop/src/renderer/view.ts#approvalPlaces`, `:704-705` | Rewritten in place: the work item's `paneStage` is one source, and no pane's agent state, no hook and no session changes the line (*Scope* item 6). The case at `view.test.ts:1551` keeps its body; its title reads "no pane's agent state" since `08713da8`, because a pane's stage now changes the line. |
| The comment's clause that the window reads no hook and no session beside the records and the questions | `apps/desktop/src/daemon/chain-records.ts:4-5` | Rewritten in place with the docstring above, once the window draws `paneStage` (*Scope* items 6 and 9). |
| Nothing in return for the two lines this work adds to the socket | `apps/desktop/src/daemon/turn-socket.ts` | No mechanism can go: the daemon chain's stages stay, since `Daemon#startChain` still runs the chain in the cases and from issue #55, and the records stay the line's source before and after a pane's stage. What the lines catch is this issue's defect, which the owner met on 2026-11-25 walking #184: the proofer at work in a pane for a whole round while the line said "Not started". |

Framed 2026-11-26 by framer, before the build.
