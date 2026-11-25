# Review round 1: 1795559735-heavy-commands-wait-their-turn

```seal
target: 9834f7bb against origin/release/v0.0.4
```

The round reviewed the branch at `9834f7bb` against `origin/release/v0.0.4` at `5cb81763`, the merge base. The commits the merge `11dd825e` brought from the release are not this work's and were not reviewed. It read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at the target, and the five phase records. No `pr.<lang>.md` stands, since `seal/config.json` names English for the pull request. No earlier round stands, so nothing was carried from one.

Carried from the phase records and not re-established: the mutation verdicts of phases 1 to 5, the phase boundary runs, and phase 5's statement that `test/heavy-run.test.ts` passed 7 of 7 alone. This round ran one probe and one mutation of its own, in a clone of the branch at the target (`## Probes`).

The case `test/records-place.test.ts:197` is named "reads this repository's own two" while its body at `:215` asserts three commands. A name is read by whoever next edits the case, so it is no finding of its own. Finding 7's fix pass rewrites it with the frame's sentence.

## Findings

### 1. A second run that waited for the load keeps the load from before its wait as its start load and its highest load

```seal
severity: must
location: `apps/desktop/src/daemon/turn-socket.ts:105`, `apps/desktop/src/daemon/turn-socket.ts:111`, `apps/desktop/src/daemon/turn-socket.ts:119`, `apps/desktop/src/daemon/machine-turns.ts:207`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts` in the round's clone (`## Probes`); read `apps/desktop/src/daemon/machine-turns.ts:160-166`, `apps/desktop/src/daemon/machine-turns.ts:195-212`, `apps/desktop/src/daemon/turn-socket.ts:97-121`
```

Why it matters: `frame/design.md:71` (*Scope* item 11) says the line of each run keeps "the load at its start and the highest load during it". `changelog.md:11` repeats it. The code does not keep that for a second run that waited for the load.

- The keeper reads the load as it gives the turn and sets the turn's highest load to it (`machine-turns.ts:205-207`).
- The giver then waits, for up to 10 minutes, until the load is at or under the cores (`turn-socket.ts:105`). During that wait the run holds the keeper's turn, so the daemon's 5-second timer samples it (`machine-turns.ts:160-166`), and every sample in the wait is above the cores.
- The giver gives `startedAt` after the wait (`turn-socket.ts:111`). The line keeps `turn.load` and the highest sample (`turn-socket.ts:119`).

The probe asked as a second run with a load of 9 on 4 cores. It took one sample during the wait, saw the load fall to 2, then took a sample during the run. The kept line read `load: 9`, `highestLoad: 9` and `over: true`, though the command started and ran at a load of 2.

The second run is the only run that is alone by construction. `frame/questions.md:34` (Q13) leaves open whether a gate alone stays under the cores, and the runs' file is to answer it. With this defect, every second run that waited reads above the cores whatever the gate drove. So the measurement Q13 waits on is decided by the wait and not by the gate. The Machine dialog's "highest load" for "Broad gate" takes the same number.

```ts
// apps/desktop/src/daemon/machine-turns.ts, interface Turn: one member more
  /** Starts the turn's readings again from the load given, as a second run does once its wait for the load ends. */
  restart(load: number | null): void;

// apps/desktop/src/daemon/machine-turns.ts:207, in give()
      next.settle({ load, highest: () => next.highest, beside: () => next.beside.size, end: () => this.leave(next), restart: (start) => { next.highest = start; } });

// apps/desktop/src/daemon/turn-socket.ts:105-111, in turnGiver's ask
        if (ask.alone === true) await untilCalm(options.load, options.cores, calm, ask.gone);
        if (ask.gone?.aborted === true) {
          given.end();
          return null;
        }
        options.started?.();
        // A second run that waited for the load starts on the load read now, and its highest load counts from its start.
        const load = ask.alone === true ? options.load() : given.load;
        if (ask.alone === true) given.restart(load);
        return { ...given, load, startedAt: now() };
```

The snippet does not reach every statement of the fact, and the fix pass owes these too:

- the doc comment of `Turn` at `machine-turns.ts:52-56`, "the load the keeper read as it was given";
- the sentence of `frame/design.md:121`, "Of each turn it keeps the load it read as it gave the turn", which then also names the restart of a second run;
- a case, in `test/machine-turns.test.ts` beside the case of the calm wait, that reads the kept line's `load` and `highestLoad` of a second run whose load fell during its wait. It is to be seen red against the code as it stands.

### 2. The runner runs the heavy command with `ELECTRON_RUN_AS_NODE=1`, which its launcher set for the Node it starts

```seal
severity: should
location: `apps/desktop/src/daemon/chain-command.ts:600`, `apps/desktop/src/daemon/pane-chain.ts:73`
evidence: read `apps/desktop/src/daemon/pane-chain.ts:73`, `apps/desktop/src/daemon/chain-main.ts:18`, `apps/desktop/src/daemon/chain-command.ts:568-571`, `apps/desktop/src/daemon/chain-command.ts:600`, `apps/desktop/src/daemon/pty.ts:12-19`, `apps/desktop/src/daemon/gate.ts:52-58`, `apps/desktop/test/built-app.ts:217`
```

Why it matters: `ELECTRON_RUN_AS_NODE` is an environment variable that makes Electron's binary run a script as plain Node. The launcher `owl-run` sets `ELECTRON_RUN_AS_NODE=1` so that Electron's binary runs the chain command as Node (`pane-chain.ts:73`). The chain command hands its whole `process.env` to `run` (`chain-main.ts:18`). `run` starts the heavy command with that environment (`chain-command.ts:600`, `:570`).

The pane itself takes the variable out. `pty.ts:12-19` names it among the variables that "would make a CLI run as Electron's Node". A pane's broad gate takes it out too, through `gateEnvironment` (`gate.ts:52-58`). So a command a session types in its pane runs without the variable, and the same command through the runner runs with it. The plan's premise is that a session's command runs in the session's environment and not in another (`frame/plan.md:29`).

Any heavy command a repository names that starts an Electron program, such as an Electron app's end-to-end suite, then starts it as Node. This repository's `test:app` is not hit, since `test-in-electron.mjs` sets the variable anyway and `test/built-app.ts:217` deletes it for the app. That narrows the defect to other repositories and to this one's future commands, and does not close it.

```ts
// apps/desktop/src/daemon/chain-command.ts, in run(), before the command starts
  // The launcher sets ELECTRON_RUN_AS_NODE for the Node it runs this script with. The command runs in the session's environment, which a pane gives without it (`pty.ts`).
  // Precondition: none beyond the environment; a session that set the variable itself outside a pane loses it here too.
  const env = { ...(context.env as NodeJS.ProcessEnv) };
  delete env.ELECTRON_RUN_AS_NODE;
  let ran: { code: number; peakMemory: number | null } | undefined;
  try {
    ran = await runLine([line, ...words.map(shellQuote)].join(" "), worktree, env);
```

The fix pass also owes a case in `test/heavy-run.test.ts`. It gives the runner `ELECTRON_RUN_AS_NODE: "1"` in its environment, runs a command that writes `${ELECTRON_RUN_AS_NODE-unset}`, and reads `unset`. It is to be seen red against the code as it stands.

### 3. No case holds that a pane's broad gate which failed with the machine calm runs once (scenario G)

```seal
severity: should
location: `apps/desktop/test/chain-command.test.ts:200`, `apps/desktop/src/daemon/chain-command.ts:412`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts test/chain-command.test.ts` in the round's clone with `chain-command.ts:412` mutated to `const ended = !alone && ran !== null ? endedWith(end, late) : null;`, which passed 17 of 17 cases in 2 files; read `seal/threads/1795559735-heavy-commands-wait-their-turn/frame/design.md:99`, `apps/desktop/test/chain-command.test.ts:200-237`
```

Why it matters: acceptance row G (`frame/design.md:99`) asks for "a case beside F's in each of the two files". The daemon's file has one, "stops the chain as before where the gate failed with the machine calm" in `test/chain.test.ts`. The chain command's file has the case of scenarios F and H at `:200` and none for G. The round's mutation made a pane's gate run a second time after every failure a daemon answered, whatever the load. No case of `test/chain-command.test.ts` went red. So a pane's gate that doubles every real failure, the cost `frame/plan.md:33` rejects, would pass the suite. The other guard, `ran === null` at `chain-command.ts:413`, holds the no-daemon case apart, and the mutation left it standing.

```ts
// apps/desktop/test/chain-command.test.ts, at the end of the case at :200, which is renamed "(scenarios F, G and H)"
    // The machine calm: a load at the cores or under and nothing beside it, so a failed gate runs once (scenario G).
    load.now = 1;
    const calm = commandOn(cleanups, { gate: 'touch "$HOME/gate.$$"; echo the suite is red; exit 3' });
    await answering(calm, 200);
    expect(await calm.run(["gate"])).toEqual({ code: 1, out: "", err: `${stoppedSays("gate", 1, "the command exited with code 3")}\nthe suite is red\n` });
    // One run, one file: readdirSync is imported from node:fs at the file's head.
    expect(readdirSync(calm.folder).filter((name) => name.startsWith("gate."))).toHaveLength(1);
```

The case is to be seen red against the mutation above before it is committed.

### 4. Scenario I's memory case leaves 1.5 seconds between the hold and a reading, and failed under load

```seal
severity: should
location: `apps/desktop/test/heavy-run.test.ts:117-118`, `apps/desktop/test/heavy-run.test.ts:147-148`, `apps/desktop/src/daemon/chain-command.ts:571`, `seal/threads/1795559735-heavy-commands-wait-their-turn/gaps.md:11`
evidence: executed `ls seal`; read `apps/desktop/src/daemon/heavy-runs.ts:112-131`, `apps/desktop/src/daemon/chain-command.ts:568-575`, `apps/desktop/test/heavy-run.test.ts:112-148`, `seal/threads/1795559735-heavy-commands-wait-their-turn/trail/phases/phase-5.md:53-55`
```

Why it matters: the runner reads its command's memory with `watchMemory` at the production period of 5 seconds (`chain-command.ts:571`, `heavy-runs.ts:112`). The first reading comes at the spawn, before `python3` allocates. The case holds 64 MiB for 6.5 seconds (`heavy-run.test.ts:118`).

An on-time reading always falls inside that window, since the period is shorter than the hold. The miss needs a reading's timer to fire late, or a `ps` whose answer arrives after `stop()`. `stop()` returns the peak as it stands and drops a `ps` still in flight (`heavy-runs.ts:116`, `:126-129`). At worst, 1.5 seconds remain for both the timer and `ps`.

Under phase 5's boundary set of 36 files that was not enough: the peak read 12,926,976 bytes (`trail/phases/phase-5.md:53`). The case is a timed case that fails under load. That is the failure issue #134 exists to stop, and the case now runs in every broad gate. The crafter's account says the file passed 7 of 7 alone. This round did not run it again, and a pass alone does not answer a failure under load.

`gaps.md:11` hands the case to "the follow-up that makes the case wait for its reading". No home holds that follow-up: `ls seal` lists `config.json`, `README.md` and `threads`, and no `follow-up.md`. Its cause sentence, "no reading fell in the 6.5 seconds the array is held", is not the mechanism either, since an on-time reading always falls there.

```ts
// apps/desktop/src/daemon/chain-command.ts, CommandContext: one field more
  /** How often `run` reads its command's memory; `LOAD_EVERY_MS` when absent. A case gives a short one, so many readings fall inside what it holds. */
  memoryEveryMs?: number;

// apps/desktop/src/daemon/chain-command.ts:568-571
function runLine(command: string, cwd: string, env: NodeJS.ProcessEnv, memoryEveryMs?: number): Promise<{ code: number; peakMemory: number | null }> {
  return new Promise((done) => {
    const child = spawn("/bin/sh", ["-c", command], { cwd, env, stdio: "inherit" });
    const memory = watchMemory(child.pid, memoryEveryMs);

// apps/desktop/src/daemon/chain-command.ts:600, in run()
    ran = await runLine([line, ...words.map(shellQuote)].join(" "), worktree, env, context.memoryEveryMs);

// apps/desktop/test/heavy-run.test.ts:117-118, with the helper `runner` given `memoryEveryMs: 100` for this case
    // The shell starts a child that holds 64 MiB for 2 seconds, which twenty readings of the memory, 100 ms apart, fall inside.
    naming(item.worktree, { hold: `python3 -c "b = bytearray(64 * 1024 * 1024); import time; time.sleep(2)"; exit 4` });

// apps/desktop/test/heavy-run.test.ts:147
    expect(run.endedAt - run.startedAt).toBeGreaterThanOrEqual(2_000);
```

The fix pass also owes the case's title at `heavy-run.test.ts:112`, which says "read after the command's first moment", where it no longer matches. It also owes the row at `gaps.md:11`, marked `closed` with the commit.

### 5. The frame leaves two operations on `docs/design.md` to the settle, though the pull request already wrote the row, against principle 8

```seal
severity: should
location: `seal/threads/1795559735-heavy-commands-wait-their-turn/frame/design.md:232-241`
evidence: executed `git grep -n "file: docs/design" -- seal/threads`, which prints only this frame's two lines; read `docs/design.md:18`, `docs/design.md:457`, `docs/design.ko.md:457`, `seal/threads/1795559735-heavy-commands-wait-their-turn/trail/phases/phase-5.md`, the line on #32's row, and `skills/settle/SKILL.md:203` of the AgenticSeal plugin
```

Why it matters: `docs/design.md:18`, principle 8, says: "The pull request that draws the form writes its row, in both editions of this document, and leaves none to the release's settle." Phase 5 kept that half of it. It rewrote the row "The Machine dialog" in place in both editions (`docs/design.md:457`, `docs/design.ko.md:457`). The orchestrator asked for that by principle 8.

The fold `5b6a5be2` then turned the frame's two `add` operations into `change` operations, which still leave the row to the settle:

- Each `from` is #32's earlier row, which neither edition holds any longer.
- Each `to` repeats the row both editions now hold.

The settle's draft places an operation by its `from`, and one it cannot place is "written by hand" (`skills/settle/SKILL.md:203` of the plugin). So the settling session will write, by hand, a row that already stands. #32's frame drew the same dialog and leaves no operation on `docs/design.md`: the `git grep` above prints only this frame's lines.

The fix removes the two operations at `frame/design.md:232-241` whole: the `- change` line, `file:`, `section:`, `from:` and `to:` of each. The section keeps its `docs/architecture.md` and `docs/architecture.ko.md` operations. Phase 5's record already says why the row was written in place, so the frame needs no sentence in their stead.

### 6. Two comments of the protocol still state #32's fact after this work widened it

```seal
severity: should
location: `apps/desktop/src/shared/protocol.ts:945`, `apps/desktop/src/shared/protocol.ts:988`
evidence: read `apps/desktop/src/shared/protocol.ts:925-990`, `apps/desktop/src/daemon/daemon.ts:1643-1690`, `apps/desktop/src/daemon/daemon.ts:545-551`, `apps/desktop/src/shared/machine.ts:172-178`
```

Why it matters: the comment of a protocol message is the contract a client author reads. This work changed two of #32's messages and left their comments as #32 wrote them.

- `setCaps` (`:945`) lists what the daemon refuses as "a value that is no whole number, one under 1 and a cap on panes over 16". The daemon now also refuses a limit on heavy commands over the machine's cores (`daemon.ts:1654`, `shared/machine.ts:174`).
- `machine` (`:988`) is said to be sent "whenever a cap or the count of agents changes". The keeper's watcher now also sends it at every change of the heavy queue (`daemon.ts:546-551`).

The list was made by reading the comment of each message whose handling the diff changes: `setCaps`, `readMachine`, `readHeavyRuns`, `stopGate`, `ready`, `machine` and `heavyRuns`. The other five read true.

```ts
// apps/desktop/src/shared/protocol.ts:945
  // Sets the caps a person sets on the machine: a field that is absent is left as it is, and null has the cap follow its proposal again. The daemon refuses with a sentence, and changes nothing, a value that is no whole number, one under 1, a cap on panes over 16 and a limit on heavy commands over the machine's cores, and every message where it keeps no cap. It answers with `done`, before the `machine` that carries a change.

// apps/desktop/src/shared/protocol.ts:988
  // The machine and its caps, as `ready` carries them, sent to every client whenever a cap, the count of agents or the queue of heavy commands changes, and to the client that sent a `readMachine`.
```

### 7. *Scope* item 14 names two of the three heavy commands this repository now names

```seal
severity: should
location: `seal/threads/1795559735-heavy-commands-wait-their-turn/frame/design.md:74`
evidence: read `seal/config.json:6-10`, `seal/threads/1795559735-heavy-commands-wait-their-turn/frame/questions.md:37`, `seal/threads/1795559735-heavy-commands-wait-their-turn/changelog.md:15`, `apps/desktop/test/records-place.test.ts:197`, `apps/desktop/test/records-place.test.ts:215`
```

Why it matters: `frame/design.md:74` says what the work does: "`seal/config.json` gains `Heavy commands` with `test` ... and `install`". At the target the key holds `test`, `test:app` and `install` (`seal/config.json:6-10`). Phase 5 added `test:app` on Q16's answer (`frame/questions.md:37`), and `changelog.md:15` names all three. The frame's sentence was not folded. A reader holding the frame against the tree, such as the sealer, finds a command the frame does not name.

```md
14. **This repository names its own heavy commands.** `seal/config.json` gains `Heavy commands` with `test`, the desktop suite's command, which takes test files after `--`, `test:app`, its built-app files as one batch, and `install`, the install.
```

The fix pass also owes the case name at `test/records-place.test.ts:197`, "reads this repository's own two", which becomes "reads this repository's own three".

## Confirmations

What matched: each of the ten quotes of `pr.md` stands word for word at its coordinate. The coordinates are `frame/plan.md:80`; *Scope* items 1, 2, 3, 5, 8, 9, 12 and 13 at `frame/design.md:55-73`; and Q17's question and default (a) at `frame/questions.md`. Read.

What matched: the keeper gives a freed turn by place and then by order of asking. An ask that must run alone waits while any turn is held. While that ask waits first, no other ask is given a turn, though the limit has room (`machine-turns.ts:195-212`, `:188-192`). This is *Scope* item 3 and item 9's "alone". Read.

What matched: a stop that arrives while the daemon's gate waits ends the ask (`daemon.ts:3747`), and the stage fails before any command starts. The ledger gets no entry, as the third row of *Removes* says. Read.

What matched: the display's wake is given at each turn under every choice but "Never" (`daemon.ts:552`). The display's hold follows a running heavy command in `settleHold`, as *Scope* item 12 says. Read.

What matched: the turn socket is made readable by the user alone (`turn-socket.ts:187`). The daemon closes it before the daemon itself, so a waiting command runs at once (`main.ts`, `stop`), as *Scope* item 7 says. Read.

What matched: the refusal "The limit on heavy commands at once is a whole number from 1 to 12." that `changelog.md` quotes is what `capRefusal` gives with 12 cores (`shared/machine.ts:172-178`). Read.

What matched: `screenshots/night-watch-dark-machine.png` shows the row "Heavy commands at once" with its sentence, "Running and waiting" with one running and one waiting command and the reason of the waiting one, and "What ran" with "not read". This is the form `docs/design.md:457` states. Read. The other three shots were not looked at.

What matched: `gaps.md:7` labels the whole suite, the typecheck and the rest of the `Broad gate` command `unverified`, with the orchestrator to answer. That label is honest: no phase record claims a run of the whole suite. Read.

What matched: each new test case was read against its group, by listing every `it(` the diff adds across the 14 test files it changes. No new case covers only what its group already covered. Finding 3 is the case one group lacks. Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole desktop suite, the repository-wide typecheck and the rest of the `Broad gate` command at the target. Rule 2 of the agent contract keeps them from this round | `seal/config.json:5` | the orchestrator, at the broad run |
| Whether a pane of the built app holds `OWLERY_RUN` and reaches the turn socket; whether the built app holds and wakes the display; whether the built daemon makes a second run; how the inbox line draws a heavy command's wait | `seal/threads/1795559735-heavy-commands-wait-their-turn/gaps.md:8-10`, `seal/threads/1795559735-heavy-commands-wait-their-turn/gaps.md:12` | the orchestrator, as each row names |
| Whether `caffeinate -u` turns the owner's sleeping display on (Q14), and what load a gate drives alone (Q13) | `seal/threads/1795559735-heavy-commands-wait-their-turn/frame/questions.md:34-35` | the owner, by the measurements each row names |
| Whether the pull request check of the AgenticSeal plugin accepts the key `Heavy commands` (Q15). `chain_check.py --worktree` exited 0 with the key standing, and this round did not establish whether that run reads `config.json` | `seal/config.json:6` | the orchestrator, at the first pull request check |
| Whether the line says the second run's wait for the load (Q17), which stands open at its default (a) | `seal/threads/1795559735-heavy-commands-wait-their-turn/frame/questions.md:38` | the owner |
| The daemon's scenario G was taken from its case and the phase 3 mutations, and was not mutated again in this round | `apps/desktop/test/chain.test.ts` | the verifying round, where finding 3's fix touches the daemon |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts test/chain-command.test.ts`, in the round's clone at `9834f7bb` with `chain-command.ts:412` mutated as finding 3 states | 2 files, 17 of 17 cases passed: no case of `test/chain-command.test.ts` went red against a pane's gate that runs again whatever the load. The probe's own reading was not kept, since vitest showed no console line |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts`, the same clone with the mutation reverted, run a second time to keep the reading in a file | 1 case passed; the kept line of a second run asked at a load of 9 on 4 cores, sampled once during its wait, then started at a load of 2 read `{"waits":true,"startedAt":0,"load":9,"highestLoad":9,"over":true}` |
