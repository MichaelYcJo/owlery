# Phase 4: 1795559735-heavy-commands-wait-their-turn

## What this phase found

**The frame holds for phase 4.** The coordinates phase 4 builds on were opened at `372706d`: `keep-awake.ts#wantsAwake` and `#holdAwakeFor`, `Daemon#settleHold`, `main.ts`'s holder, `seal/config.json`, and rule 2 of `apps/desktop/role-bundle/skills/agent-contract/SKILL.md`. None of them contradicts the frame.

**Departures from `frame/plan.md` row 4, each with where it lands.**

- Scenario J's case is in `test/daemon.test.ts`, in the group "keeping the Mac awake", and not in `test/keep-awake.test.ts`. The daemon's cases of the hold with a holder that starts no process all stand in that group, with its helper `held()`. `test/keep-awake.test.ts` holds the cases that start the program, and it gained one: the hold of the display with `-d`, and the wake through a stand-in program, so no case wakes a display.
- The case of this repository's own `Heavy commands` is in `test/records-place.test.ts`, in the case of `readHeavyCommands`, and not in `test/heavy-run.test.ts`. That case is the group of the reader the plan names.

**Decisions made while building, each judged against the document named.**

- A heavy command that holds a turn counts as a reason to hold the Mac under "While an agent works", as a working session does (`wantsAwake`'s argument `heavyRuns`). A command a person typed in a shell pane is no agent's, and the person still waits on it. Judged against `frame/design.md` *Scope* item 12, which names the two choices and not who started the command.
- The display is held while a heavy command holds a turn and the daemon holds the Mac, so under every choice but "Never" (`Daemon#settleHold`). The daemon keeps one hold. Where the display is to be held or let go, it releases the hold that stands and starts one of the other kind, and tells the clients nothing, since the Mac stays held. A second run that waits for the load holds the keeper's turn (phase 3), so the display is held during that wait too. Judged against *Scope* item 12 and `frame/design.md` *The hold*.
- The wake is a daemon option of its own, `DaemonOptions.wakeDisplay`, and not a field of the holder, so every holder of the cases stays a function. The giver calls it as it gives each turn (`GiverOptions.started`), which is a heavy command's start, in the daemon's chain and on the socket alike. Under "Never" the daemon wakes nothing. Judged against *The hold*.
- The comment of `holdAwakeFor` was rewritten in place: `-i` alone leaves the display free to sleep, and `-d` keeps it awake. That is the second row of *Removes*. `git grep -n 'free to sleep and a closed lid' -- apps` prints nothing (executed). The same fact in `docs/architecture.md` *Overall layout* is a line of *Rule changes*, which the settle writes.
- `seal/config.json` gains the key as `frame/design.md` *The repository's key* gives it. The `Broad gate` line is unchanged but for the comma after it.

**Seen red.** The four cases were run before the source change, against the tree of `372706d` with the new cases, executed. All four failed, each on its own line: scenario J timed out waiting for a hold while a heavy command ran; the program case read `caffeinate -i -w` where it wants `-d`; the bundle's rule 2 lacked the sentence; and the repository's own config gave `{}`.

**Mutations.** Each batch was run with `seal mutate` after the commit `1974cb5`, over the cases that cover its unit, one batch at a time, executed. Of ten mutants, nine went red and one survived.

- `keep-awake.ts` over scenario J, two: a heavy command that does not hold the Mac under "While an agent works" went red. A display held under "Never" survived. The daemon held the display only where it held the Mac, and it holds nothing under "Never", so the function's own test of the choice could not fail. `e6858ec` removed the function `wantsDisplay` and holds the display where the Mac is held and a heavy command holds a turn, as `skills/core/SKILL.md` *The rule a mechanism is kept against* asks of a test no case can tell apart. Scenario J's last part still pins that nothing is held or woken under "Never".
- `keep-awake.ts` over the program's cases, three, all red: a display hold without `-d`, a wake without `-t 5`, and a wake whose failed start is not caught.
- `daemon.ts` over scenario J, four, all red: no heavy command seen, a hold not replaced when the display changes, a wake under "Never", and the kind of the standing hold not kept.
- `turn-socket.ts` over scenario J, one, red: a turn given with no call of `started`.

**The phase boundary.** The set was run as one command at `e6858ec`, with `OWLERY_BACKGROUND=1`, after `pnpm run build`, and after no other Owlery suite and no broad gate ran on the machine, executed. It held each test file that imports `daemon.ts`, `keep-awake.ts`, `main.ts`, `turn-socket.ts` or `records-place.ts`, or one of the two case helpers that start a daemon or the chain command, with `test/role-bundle.test.ts` and `test/keep-awake.test.ts`: 24 files. 21 passed, 2 were skipped whole by their own conditions, and one case of `test/chain.test.ts` failed: "goes on with no client connected" counted one hold from the chain's start to its rest. The broad gate is a heavy command, so for its turn the daemon now replaces that hold by one that holds the display too, with no gap between them. The failure is this phase's change and not a fault, so `47a4de4` changed the case to count the three holds and which held the display, and the case passed alone, executed.

**What the next phase needs.** Phase 5 gives `main.ts` the daemon's options `load` and `cores` from #32's reader, the keeper its limit from #32's store, and the window the line's words. Nothing of phase 4 waits on it.
