# Phase 1: 1795636142-223-a-stage-a-pane-runs-shows-at-work

## What this phase found

**The release merged cleanly.** The phase began by merging `origin/release/v0.0.5` at `f683c693` into the branch, as `007f5d5e`, with no conflict. That release holds #217, where `WorkItem.branch` may be null and `chain-command.ts#here` refuses a worktree whose HEAD names no branch. Every tell of this phase comes after `here`, so an `owed` that `here` refuses tells the daemon nothing. A work item with no branch therefore holds no stage, as `frame/plan.md` *Overlap with the release* expected. The merge is a merge, so what it can break is the broad gate's to find (`skills/verify/SKILL.md` *The narrow command still has to be able to fail*, the row for a merge).

**The frame holds, with one item moved to phase 2.** Each coordinate of `frame/design.md` *Grounding* that the build stands on was opened at `007f5d5e` and holds: `chain-command.ts#owed`, `#round`, `#fixPass`, `#seal` and `#turnSocket`; `turn-socket.ts#askOf` and `TurnServer`; `daemon.ts#workItemOf`, `#closePane`, the pane's `terminal.onExit` and `#readRecord`; `machine-turns.ts#queue`; and `PANE_VARIABLES.id` in `hooks.ts`. The keeper lists an ask under the folder the giver maps through `worktreeNamed`, so a gate's ask in a work item's worktree is listed under `item.worktree` whatever path the command asked with. One item of the drawing does not hold for this phase. `frame/plan.md` gives phase 1 *Scope* item 9 whole, and item 9 names the docstring of `view.ts#approvalPlaces`. At this phase's head the window reads no `paneStage`, so that docstring's clause "no pane's state, no hook and no session changes it" is still true. A docstring that named `paneStage` as a source now would state a fact phase 2 makes. That docstring is left to phase 2, whose *Scope* item 6 rewrites it. Judged against `skills/core/SKILL.md` *The rule a mechanism is kept against*: a comment states the tree as it is.

**Q3 of `frame/questions.md` is answered: the command waits for the write, not for the close.** Q3 asks whether the line reaches the daemon before the chain command's process exits under Electron's Node. A probe in this phase's scratch directory, `test_tmp_tell_entry.ts`, was bundled with the tree's esbuild and run once under Electron 45.3.3 with `ELECTRON_RUN_AS_NODE=1` (Node 24.22.3). It started 40 processes; each called `turn-socket.ts#tellStage` once and then exited by itself, as `chain-main.ts` ends. The `TurnServer` of the same bundle read 40 lines of 40, every process exited 0, and none waited near the one-second bound (executed). So `tellStage` settles on the write's end, as `frame/design.md` *Data & interfaces* says. It also closes the connection there. A daemon that never closes the connection therefore holds no chain command's process open.

**`TurnServer.listen` takes the handler as an optional third argument.** `frame/design.md` *Data & interfaces* gives `TurnServer.listen(socketPath, giver, told)`. The argument defaults to a handler that does nothing. So the cases that start a server for asks alone keep their two-argument call, and a server given no handler closes a stage line's connection as it closes any line that is no ask. `main.ts` passes `(line) => daemon.stageTold(line)`.

**The daemon's handler is `Daemon#stageTold`, and each line is read as the design states, with three decisions the design left open.** Judged against `frame/design.md` *Scope* item 4.

- A stage told again for the same kind and round keeps its time and sends nothing, since the lists do not change. The pane it is held under becomes the pane that told it last, so the drop follows that pane.
- A `stage-ended` line sends the lists where it dropped a stage or where the records read otherwise than at the last read, and sends nothing otherwise.
- `onExit` drops the pane's stage at every exit of its process. That includes the exit that the replacement for an account change waits on. The process that told the stage is gone, and the change's own `broadcastInbox` carries the drop. No case runs that path (`gaps.md` *Not verified*).

**A pane the daemon ended is refused as well as one that exited.** `endSessions` marks every pane it ends with `ended`. A pane whose process outlives the wait stays listed and alive, after an archive and after a removal that is refused. `stageTold` refuses a stage from such a pane through `pane.ended`. This was found by trying. The first case for the archived work item went green against a mutant that removed the archive's guard, because `ended` refused the pane first. The case was rewritten so each guard has a half that it alone holds. A refused removal leaves an ended pane alive in a work item that is not archived, and only `pane.ended` refuses its stage there. An archived work item's records are not read at a `stage-ended` line, and only the `archivedAt` guard holds that.

**The daemon's own chain shows as a pane's gate in `paneStage`, which phase 2 must not draw over the daemon's chain.** `daemon.ts#runGate` asks the keeper with the place `gate` and the work item's worktree (`daemon.ts:3951`). So while the daemon's own chain runs its broad gate, `paneStage` reads `{ kind: "gate" }` too. `frame/design.md` *Scope* item 6 puts the daemon chain's running stage over a pane's stage, so the sealer's place still reads "Broad gate" from the daemon's chain. Phase 2's case for that precedence should hold a daemon's running gate and a `paneStage` gate at once.

**A sentence phase 2 must rewrite with `approvalPlaces`'s docstring.** `chain-records.ts:4-5` reads "The window draws the approval line from these facts and the work item's questions; no hook and no session is read." It stays true at this phase's head, since the window reads no `paneStage` yet. Once phase 2 draws `paneStage`, it needs the same rewrite as the docstring.

**The existing field cases of `daemon.test.ts` name the new field.** `WORK_ITEM_FIELDS` gains `paneStage`, and so does the work item that "creates a work item and opens a pane whose process runs in its worktree" pins. The look keeps no `paneStage` (`last-look.ts#lookOf` names each field it keeps), so the look's filter in "carries only the fields the protocol names, none of them a vendor's" and `asLooked` leave it out, as they leave out `machineWait` and `wordOwed`.

**Each new case was seen red before its code** (executed, against `007f5d5e` with the cases added):

| Case | File | Red against the old code |
|---|---|---|
| hands the handler a `stage` and a `stage-ended` line … | `test/heavy-run.test.ts` | `expected [] to deeply equal [ { is: 'stage', … } ]` |
| tells the daemon on the turn socket the stage `owed` hands … | `test/chain-command.test.ts` | `timed out` waiting for the first line |
| tells no stage where `OWLERY_PANE_ID` holds no whole number … | `test/chain-command.test.ts` | `timed out` waiting for the two `stage-ended` lines |
| prints what it prints with no daemon where the turn socket closes each connection at once … | `test/chain-command.test.ts` | green against the old code, which opens no connection; red with `tellStage`'s error handler removed: `Error: connect ENOTSOCK turns.sock` |
| holds the stage a live pane of the work item tells … | `test/daemon.test.ts` | `expected undefined to be null` |
| holds no stage told with the id of another work item's pane … | `test/daemon.test.ts` | `on.d.stageTold is not a function` |
| holds no stage told by a pane the daemon ended … | `test/daemon.test.ts` | added after the code; red at `daemon.test.ts:4851` with `pane.ended` removed, and at `:4860` with the `archivedAt` guard removed |
| drops the stage at a `stage-ended` line … | `test/daemon.test.ts` | `on.d.stageTold is not a function` |
| drops the stage a pane told once the pane is closed … | `test/daemon.test.ts` | `on.d.stageTold is not a function` |
| carries a broad gate that asks for its turn in the worktree … | `test/daemon.test.ts` | `on.d.stageTold is not a function` |

The cases that red on `stageTold is not a function` were also seen red on their own guards, through the `seal mutate` runs below.

**`seal mutate`, after commit `c05b0e43` and `9a89bb20`** (executed; each run's output is in the scratch directory `phase-1/mutate-*.txt`):

- `turn-socket.ts`. These went red: the handler's call removed; `round < 1` changed to `round < 0`; the whole-number test changed to `value >= -1`; and `tellStage`'s `error` handler removed. Each was read for its failing line. One SURVIVED: `limit = setTimeout(settle, waitMs)` changed to `limit = undefined`. No case makes a write hang, so the one-second bound has no case (`gaps.md` *Not verified*).
- `chain-command.ts`. 6 of 6 went red. They were: `owed`'s `stage-ended` removed; its `pane !== null` changed to `pane === null`; `paneOf`'s anchors removed; and each tell of `round`, `fix-pass` and `seal` removed.
- `daemon.ts`. 11 of 11 went red, after the case for the ended pane was rewritten. They were: the gate's test inverted; the gate's round set to 0; the kept time dropped; the work item's pane test removed; the live test removed; `pane.ended` removed; the read of the records at an end removed; the drop at `closePane` removed; the drop at `onExit` removed; the drop at `stage-ended` removed; and the `archivedAt` guard removed. The `archivedAt` mutant SURVIVED once, against the first version of its case (above).

**The absence search of scenario 9** (executed at `9a89bb20`): `git grep -n -i 'for one thing' -- apps` prints nothing.

**The other statements of the socket's old rule, a sample.** The search ran `git grep` over `apps` for "for one thing", "one connection for one command", "one ask on each connection" and "turn socket". It corrected the head comments of `chain-command.ts` and `turn-socket.ts`, the docstring of `TurnServer`, and the comment above `TurnServer.listen` in `main.ts`. The other hits name the socket's asks and still hold: `heavy-runs.ts:5`, `machine-turns.ts:7`, `pane-chain.ts:69`, `main.ts:39`, `daemon.ts#turnGiver`, `test/machine-dialog.test.ts` and `test/screenshots.test.ts`. The policy root's sentences, `docs/architecture.md` *Code runs the order, the orchestrator judges* and its Korean edition, are the settle's, through `frame/design.md` *## Rule changes*. The search was not run on the role bundle's prose under other wordings. `git grep -n -i daemon -- apps/desktop/role-bundle` lists no sentence that says what the chain command tells the daemon.

**The phase boundary set** (executed at `9a89bb20`, one command at a time, the spawn's bound of three files a command taken as a narrowing):

- `test/chain-command.test.ts test/heavy-run.test.ts test/machine-turns.test.ts`: 3 files, 43 cases passed.
- `test/daemon.test.ts -t "the stage a pane's session runs|carries only the fields the protocol names|lists an archived work item in|creates a work item and opens a pane whose process runs in its worktree|the last look|the caps on the machine|a Claude Code pane and the owl chain"`: 70 cases passed, 344 skipped.
- `test/pr-check.test.ts test/role-bundle.test.ts test/last-look.test.ts`, the other unit files that import the chain command, the protocol's look or the turn socket's neighbours: 3 files, 66 cases passed.

`tsc --noEmit` over `apps/desktop` passed at `9a89bb20` (executed), after `pnpm install --frozen-lockfile` gave the worktree the `electron-builder` and `@xterm/addon-search` that the merge's lockfile names. The repository configures no linter and no formatter. The rest of `daemon.test.ts` and the built-app files were not run. They are the broad gate's and phase 2's built-app batch.
