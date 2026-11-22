# Review round 2: 1795329619-timed-cases-race

```seal
target: a002e5d, fixes be2e804..a002e5d
```

This is a verifying round. It read the fix diff `git diff be2e804 a002e5d`: `59f1aef` (tests), `e5a8e6c` (documents and records) and `a002e5d` (round 1's close blocks, and the orchestrator's change to `routing.md:20`). It answered each close of round 1 against that diff. It also checked the merge `be2e804`. `git diff 78bb2b9 6f10cd0` and `git diff 180b223 be2e804`, with this work item's own directory left out, give the same `git patch-id --stable` (`14fceee8`). So the merge brought in release/v0.0.2 at `6f10cd0` (#123, #124) and nothing else (executed). That answers round 1's last `## Not judged` row: the bullet of round 1's finding 2 now stands at `docs/architecture.md:349` and its twin's line 349, and the fix was made there.

`routing.md`, `gaps.md`, `changelog.md` and `trail/phases/phase-1.md` were read whole at `a002e5d`. Carried from round 1 without re-deriving: where each pause's timer starts (`apps/desktop/src/renderer/menu.ts:211`, `apps/desktop/src/renderer/work-item-view.ts:171` and `:216`), and that the three cases go red where a timer is mutated where it starts. The fix diff touches neither the timers nor the timed checks. Every mutation below ran in a fresh clone of `a002e5d`, with one built-app file running at a time.

## Findings

None. This round leaves nothing open.

## Confirmations

```seal
confirms: round-1#1
```
What holds: each pause's constant is now pinned beside its measured check. These are `apps/desktop/test/work-item-menu.test.ts:414`, `apps/desktop/test/terminal-basics.test.ts:617` and `apps/desktop/test/terminal-basics.test.ts:665`. Round 1's `evidence: executed` lines were run again with each constant set to 0 at `menu.ts:11` and `view.ts:1002-1003`, and all three now fail at the pin (executed). `SUBMENU_LEAVE_MS = 0` failed the menu file at `work-item-menu.test.ts:414`, "expected +0 to be 300", 1 failed and 28 passed. `CARD_SHOW_MS = 0` failed at `terminal-basics.test.ts:617`, "expected +0 to be 300". `CARD_LEAVE_MS = 0` failed at `terminal-basics.test.ts:665`, "expected +0 to be 200", 1 failed and 24 passed. Each red line names the constant that was mutated, and the close's lines and messages match these. `changelog.md:6` and `changelog.md:8` now say the cases fail where a pause is shortened where its timer starts or where its length is named, and those sentences are true at `a002e5d`. `phase-1.md:11` and `phase-1.md:35` now name the constant mutants and the red lines (read). A mutation score licenses *tested*, never *safe*.

```seal
confirms: round-1#2
```
What holds: `docs/architecture.md:349` now says "the Dock icon, the menu bar, the system's focus and the system's pointer", with "a pointer passing over the window" among its readings. `docs/architecture.ko.md:349` says "시스템의 포인터" and "그 넷 가운데 하나". `apps/desktop/measurements/memory.md:37` says "lacks four things a person's start has" (read). `git grep -n "lacks three\|three things\|그 셋\|lacks the Dock"` finds no list left at three (executed). The broad gate compares each document with its twin, and the counts stay equal: `architecture` has 26/26 heading lines and 108/108 table lines, and `roadmap` has 11/11 and 24/24 (executed, `grep -c`).

```seal
confirms: round-1#3
```
What holds: `changelog.md:3` now says a pointer can take the card away, and that "one mouse move handed to the app's process did so". It says nothing else tried did, and that "whether a pointer did so in the runs that failed is the owner's to say". That matches `phase-1.md:24`, `phase-1.md:27` and `gaps.md:11` (read). `phase-1.md:19` takes the proposed heading and adds "the evidence points to the person's pointer without proving it". The close named `routing.md:20` to the orchestrator. `a002e5d` rewrites it as "Phase 1 found evidence that the link card case failed under the person's own pointer (one posted mouse move reproduced it; no failing run was caught with a pointer moving)", which is the evidence as the phase states it (read). `git grep` on the old wordings over the work item finds them only in round 1's own quotes (executed). The issue's section "What the work found" lies outside the tree and stays the orchestrator's.

```seal
confirms: round-1#4
```
What holds: `terminal-basics.test.ts:1068` now runs `pasteOnceBack()` before the two reads at `:1070` and `:1071`. The paste reaches the process only after the screen has drawn the replay (`:1046`), so the reads no longer pass on a row the replay has not reached. The new comment says the pane's process echoes nothing. That holds by `apps/desktop/test/fixtures/basics-shell.sh:32` (`stty raw -echo`) and `:38` (`exec cat` into a file) (read). With the clear's `send({ type: "forget", id: pane, keepModes: true })` removed at `work-item-view.ts:340`, the case failed at `terminal-basics.test.ts:1070`, "expected true to be false" (executed). So the read now catches a replay that still carries the link, and the close's line matches. The next case failed in a chain at `:1095`, where the earlier case had left its pane open. With the forget in place, the moved reads passed in the `CARD_LEAVE_MS = 0` run, where only the card case failed. `phase-1.md:15` now says `linkAt` is called in the path case and in the clear-screen case. `gaps.md:15` names the clear-screen reads, now placed after `pasteOnceBack` with no wait of their own (read). The close gives its reason for not using `comeOnto`: `comeOnto` waits for something to appear, and these reads expect an absence. That holds by `terminal-basics.test.ts:354-366`, which returns only once its expression is true (read).

What matched: the new units in the fix diff are the three pins, the moved reads and their comment, and they were reviewed as code. Each pin pins a value the frame states, the 300 ms pause of issue #117. The card's 300 ms and 200 ms are written nowhere above the code, and the pins are now their second statement. A person who changes a pause on purpose changes the pin with it, which is what the frame's "still fails where the pause is removed" asks for. No new test was added, so there is no group to read one against.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The `check` run at `a002e5d` on GitHub's macOS runner, without the retry | `seal/threads/1795329619-timed-cases-race/gaps.md:7` | the orchestrator, by draft pull request #125's `check` run at its head |
| The broad gate at `a002e5d`. This round ran single built-app files only, and labels the suite `unverified`. What comes due is the orchestrator's broad run, and the sealer's spawn after it | `seal/config.json` `Broad gate` | the orchestrator |
| Whether the frame's first *Done when* line still stands, and whether a real pointer passes through a background window. Both are carried from round 1 unchanged | `seal/threads/1795329619-timed-cases-race/gaps.md:8`, `seal/threads/1795329619-timed-cases-race/gaps.md:10` | the orchestrator, and the owner |

## Probes

| Command | Result |
|---|---|
| `git diff 78bb2b9 6f10cd0 \| git patch-id --stable`, and `git diff 180b223 be2e804 -- . ':!seal/threads/1795329619-timed-cases-race' \| git patch-id --stable` | both `14fceee85754e015d9574ddb41a66387af5d4bdd` |
| `SUBMENU_LEAVE_MS = 0` at `menu.ts:11`, then `node scripts/test-in-electron.mjs test/work-item-menu.test.ts` | 1 failed, at `:414` ("expected +0 to be 300"), and 28 passed |
| `CARD_SHOW_MS = 0` at `view.ts:1002` and the clear's `forget` removed at `work-item-view.ts:340`, then `node scripts/test-in-electron.mjs test/terminal-basics.test.ts` | 3 failed: `:617` ("expected +0 to be 300"), `:1070` ("expected true to be false"), and `:1095` in a chain after it; 22 passed |
| `CARD_LEAVE_MS = 0` at `view.ts:1003`, then `node scripts/test-in-electron.mjs test/terminal-basics.test.ts` | 1 failed, at `:665` ("expected +0 to be 200"), and 24 passed |
