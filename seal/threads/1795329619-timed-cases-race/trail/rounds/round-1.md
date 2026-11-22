# Review round 1: 1795329619-timed-cases-race

```seal
target: 180b223 against origin/release/v0.0.2
```

This round read the whole diff `git diff 78bb2b9...180b223`, the branch's cut point. The base has since moved to `6f10cd0` (#123, #124), and `git merge-tree --write-tree origin/release/v0.0.2 180b223` exits 0, so the branch still merges without a conflict (executed). The work item has no `frame/`. The frame is issue #117, read whole with its sections "Narrowed by #118, and what it holds" and "What the work found". This round also read `routing.md`, `gaps.md`, `changelog.md` and `trail/phases/phase-1.md` whole at `180b223`. No earlier round exists, so no fact was carried. Compliance came first, then quality.

Axes named for this change beyond the table: timers against the debugging port's round trips, the page's clock against a pause, a person's input reaching a window started for an agent, and what a background start lacks against a person's start.

## Findings

### 1. The submenu and card cases measure each pause against the constant they import, so a pause shortened at its constant passes them, down to 0 ms

```seal
severity: should
location: `apps/desktop/test/work-item-menu.test.ts:412`, `apps/desktop/test/terminal-basics.test.ts:615`, `apps/desktop/test/terminal-basics.test.ts:662`, `seal/threads/1795329619-timed-cases-race/changelog.md:6`, `seal/threads/1795329619-timed-cases-race/trail/phases/phase-1.md:11`, `seal/threads/1795329619-timed-cases-race/trail/phases/phase-1.md:35`
evidence: executed `node scripts/test-in-electron.mjs test/work-item-menu.test.ts` with `SUBMENU_LEAVE_MS = 0` at `apps/desktop/src/renderer/menu.ts:11` (29 of 29 passed), and `node scripts/test-in-electron.mjs test/terminal-basics.test.ts` with `CARD_SHOW_MS = 0` at `apps/desktop/src/renderer/view.ts:1002` (25 of 25 passed); executed `git grep -n -e "300 ms" -e "SUBMENU_LEAVE_MS" -e "CARD_SHOW_MS" -e "CARD_LEAVE_MS" -- docs apps/desktop/src apps/desktop/test`; read `apps/desktop/test/work-item-menu.test.ts:23`, `apps/desktop/test/terminal-basics.test.ts:20`
```

Why it matters: the frame's *Done when* asks for "a case that does not race the timer and still fails where the pause is removed". The changelog says more: "The case still fails where the pause is removed or shortened" (`changelog.md:6`). Phase 1 reports its mutations at the place each timer starts (`phase-1.md:11`, `phase-1.md:35`), and this round confirms that those mutations turn the cases red (see *Confirmations*). The cases' floor is the constant itself, though. `work-item-menu.test.ts:23` imports `SUBMENU_LEAVE_MS`, and `terminal-basics.test.ts:20` imports `CARD_SHOW_MS` and `CARD_LEAVE_MS`. Each check then compares the page's measured pause with `<constant> - 1`, so a change to the constant moves the bar with it. The constant is the only place the value is written. No document states 300 ms or 200 ms (the `git grep` above). A submenu pause set to 0 at `menu.ts:11` takes the pause away for a person: the submenu closes as soon as the pointer crosses the menu's next item. Yet the menu file passed whole with it. The card file passed whole with `CARD_SHOW_MS = 0`. The old cases at `78bb2b9` caught both edits, by reading rather than by a run. The old submenu case made a round trip through the debugging port to read the submenu after the pointer came onto "Copy path", and a 0 ms timer closes the submenu before that read. The old card case read `CARD_SHOWN` as false after waiting for `OVER_LINK`, and a 0 ms timer shows the card before that read. So the change dropped a guard the suite had, and the changelog's "or shortened" is untrue for the likeliest edit that shortens a pause.

The pins below make each case fail when its constant is lowered. Show each one red by setting its constant lower before committing it (contract rule 15). The fix pass also owes `changelog.md:6`, whose "or shortened" becomes true only once the pins land, and `phase-1.md:11` and `phase-1.md:35`, which should say that the constants were mutated too. A floor written as a literal, in place of the imported constant, is the other way to do it. Whichever way is taken, the changelog's sentence must match it.

```ts
// apps/desktop/test/work-item-menu.test.ts, after line 412
    // The pause's own length, so a pause shortened where it is named fails here as well as one shortened where its timer starts.
    expect(SUBMENU_LEAVE_MS).toBe(300);

// apps/desktop/test/terminal-basics.test.ts, after line 615
    expect(CARD_SHOW_MS).toBe(300);

// apps/desktop/test/terminal-basics.test.ts, after line 662
    expect(CARD_LEAVE_MS).toBe(200);
```

```seal
verdict: fixed 59f1aef
answer: applied the three pins as proposed, each after its measured pause; seen red with `seal mutate` (executed): `SUBMENU_LEAVE_MS = 0` failed at `work-item-menu.test.ts:414` (`expected +0 to be 300`), `CARD_SHOW_MS = 0` at `terminal-basics.test.ts:617` (`expected +0 to be 300`), `CARD_LEAVE_MS = 0` at `:665` (`expected +0 to be 200`); `e5a8e6c` makes `changelog.md:6` and `:8` say the cases fail where a pause is shortened where its timer starts or where its length is named, and `phase-1.md:11` and `:35` name the constant mutants
```

### 2. The policy documents still list three things a background start lacks, after the diff made it a fourth: the system's pointer

```seal
severity: should
location: `docs/architecture.md:341`, `docs/architecture.ko.md:341`, `apps/desktop/measurements/memory.md:37`
evidence: executed `git grep -n "lacks three\|three things\|그 셋\|lacks the Dock"`; read `docs/architecture.md:341`, `docs/architecture.ko.md:341`, `apps/desktop/measurements/memory.md:37`
```

Why it matters: the diff adds to `docs/architecture.md:341` that a window started with `OWLERY_BACKGROUND=1` "ignores the mouse, so the person's pointer passing over it reaches nothing in it". The same bullet then says what such a start lacks, and the rule an agent acts on follows from that list: "Such a start lacks the Dock icon, the menu bar and the system's focus, so a reading that rests on one of them, such as a typed Korean line or the memory of a window kept in front, is a run the person makes". The window now also lacks the system's pointer. So a reading that rests on a real pointer reaching the window is a person's run too, and the list does not say so. This work item's own `gaps.md:10` is such a reading, and it already sends that reading to the owner. The Korean twin at `docs/architecture.ko.md:341` ("그 셋 가운데 하나") and `apps/desktop/measurements/memory.md:37` ("Such a start lacks three things a person's start has") give the same count. The diff edited the bullet that holds the list and left the list as it was (contract rule 19). The text below changes the three sentences and nothing else. Neither table rows nor headings change, so the broad gate's comparison of each document with its twin is unaffected.

```md
<!-- docs/architecture.md:341, the bullet's last sentence -->
Such a start lacks the Dock icon, the menu bar, the system's focus and the system's pointer, so a reading that rests on one of them, such as a typed Korean line, the memory of a window kept in front or a pointer passing over the window, is a run the person makes ([Milestones](roadmap.md#milestones), `apps/desktop/measurements/memory.md`).

<!-- docs/architecture.ko.md:341, the bullet's last two sentences -->
그렇게 띄운 앱에는 Dock 아이콘, 메뉴 막대, 시스템의 포커스, 시스템의 포인터가 없습니다. 그래서 사람이 친 한글 줄, 앞에 둔 창의 메모리, 창 위를 지나는 포인터처럼 그 넷 가운데 하나에 기대는 값은 사람이 돌려서 잽니다([마일스톤](roadmap.ko.md#마일스톤), `apps/desktop/measurements/memory.md`).

<!-- apps/desktop/measurements/memory.md:37, the last sentence -->
Such a start lacks four things a person's start has: the Dock icon, the menu bar, the system's focus on the window, and the system's pointer, which passes through the window to what is under it.
```

```seal
verdict: fixed e5a8e6c
answer: applied the three sentences as proposed; after the merge of #123 the bullet stands at `docs/architecture.md:349` and `docs/architecture.ko.md:349`; heading and table-line counts of the pair stay 26/26 and 108/108 (executed, `grep -c`); no case reads `memory.md` (executed, `git grep`)
location: `docs/architecture.md:349`, `docs/architecture.ko.md:349`
```

### 3. The changelog and the phase record state that the person's pointer caused the link card failure, which `gaps.md` holds as not known

```seal
severity: should
location: `seal/threads/1795329619-timed-cases-race/changelog.md:3`, `seal/threads/1795329619-timed-cases-race/trail/phases/phase-1.md:19`
evidence: read `seal/threads/1795329619-timed-cases-race/changelog.md:3`, `seal/threads/1795329619-timed-cases-race/trail/phases/phase-1.md:19`, `seal/threads/1795329619-timed-cases-race/trail/phases/phase-1.md:27`, `seal/threads/1795329619-timed-cases-race/gaps.md:11`, `seal/threads/1795278987-built-apps-one-at-a-time/changelog.md:3`
```

Why it matters: the changelog's opening paragraph, which ships in the release note, says of the link card case: "Its card went away under the person's own pointer passing over the test's window. It was neither a race of the case's own nor a slow page". Phase 1's paragraph heading at `phase-1.md:19` says the same: "The link card case failed at `:608` under the person's real pointer over the suite's window." The same phase record says otherwise at `phase-1.md:27`: "Whether the person's pointer caused the failure at `4227552` is not known (`gaps.md`)". `gaps.md:11` leaves that question to the owner. The probes show that a pointer can take the card away and that a slow page and a high load did not. They do not show that a pointer did, in the run that failed. Stated as fact, the cause also contradicts release 0.0.2's fragment from #118 (`seal/threads/1795278987-built-apps-one-at-a-time/changelog.md:3`). That fragment says the four earlier red gates came from eight built apps running at once and missing their timers. With the hedge below, both fragments stay true. The issue's section "What the work found" states the cause as fact as well ("It failed under the person's real pointer"). The issue is outside the tree, so the fix pass names that sentence to the orchestrator, who owns the issue's body.

```md
<!-- changelog.md:3, in place of the two sentences that begin "Its card went away" and "It was neither" -->
A person's pointer passing over the test's window can take its card away, and nothing else this work tried did: not the page's processor slowed twentyfold, and not load averages of 52 to 91. Whether a pointer did so in the runs that failed is the owner's to say.

<!-- trail/phases/phase-1.md:19, the paragraph's heading -->
**The link card case's failure at `:608` is reproduced by a pointer over the suite's window, and by nothing else this phase tried.**
```

```seal
verdict: fixed e5a8e6c
answer: `changelog.md:3` now says a pointer can take the card away (one move handed to the app's process did), nothing else tried did (the page slowed twentyfold, load averages of 52 to 91), no failing run was caught with a pointer moving, and whether one did is the owner's to say; `phase-1.md:19` takes the proposed heading and says the evidence points to the pointer without proving it; `routing.md:20` ("Phase 1 found that the link card case failed under the person's own pointer") states it as fact as well, and it is the orchestrator's file, named in the hand-back
```

### 4. The phase record says `linkAt` is called only in the path case, yet the clear-screen case reads it for no link right after its pane comes back onto the stage

```seal
severity: should
location: `seal/threads/1795329619-timed-cases-race/trail/phases/phase-1.md:15`, `seal/threads/1795329619-timed-cases-race/gaps.md:15`, `apps/desktop/test/terminal-basics.test.ts:1064-1066`
evidence: executed `grep -n "linkAt(" apps/desktop/test/terminal-basics.test.ts` (calls at 722 to 741, and at 1057, 1059, 1065 and 1066); read `apps/desktop/test/terminal-basics.test.ts:1036-1053`, `apps/desktop/test/terminal-basics.test.ts:1063-1067`
```

Why it matters: `phase-1.md:15` names the class as "every place a case of the file points at a pane's row after a pane comes onto the stage". It says the class was listed from the pointing helpers, `linkAt` among them, and from each of their calls after `openPane`, `viewOf` or "a click that puts another view in front". It then says: "`linkAt` is called only in the path case, right after `openPane`". The `grep` above finds `linkAt` in the clear-screen case as well. At `terminal-basics.test.ts:1064`, `leavesAndReturns()` clicks the first tab and then the pane's own tab. Its docstring says "The terminal is then drawn from the daemon's replay alone". The docstring of `pasteOnceBack` at `:1043` says the screen sends nothing until it has drawn the replay. So the case itself knows that the replay arrives after the click. The reads at `:1065` and `:1066` point right after that click and expect `false`. A replay that wrongly still carried the link, but arrived after the pointer, would pass them. That is the pass on an empty row that `phase-1.md:15` says it removed from the path case. `gaps.md:15` (`## Not done`) names only the path case's reads. The list was a sample handed back as the whole class (contract rule 12). The reads at `:1065` and `:1066` hold a behaviour the diff did not change, so the repair owed is the account. Moving the two reads is offered beside it.

```md
<!-- trail/phases/phase-1.md:15, in place of the sentence "`linkAt` is called only in the path case, right after `openPane`, and that case now waits for the link of its pane's last line first." -->
`linkAt` is called in the path case, right after `openPane`, and in the clear-screen case, where two reads expect no link right after the pane comes back onto the stage (`terminal-basics.test.ts:1065-1066`). The path case now waits for the link of its pane's last line first; the clear-screen case's two reads were given no wait.

<!-- gaps.md:15, appended to the paragraph under ## Not done -->
Nor were the clear-screen case's two reads at `terminal-basics.test.ts:1065-1066`, which expect no link right after the pane comes back onto the stage and come before `pasteOnceBack`, the case's own wait for the replay.
```

```ts
// Optional: apps/desktop/test/terminal-basics.test.ts:1064-1067, the reads after the case's own wait for the replay.
// Precondition, not verified by this round: the pane's process (test/fixtures/basics-shell.sh) draws nothing on rows 0 and 1 for a paste.
    await leavesAndReturns();
    expect(await pasteOnceBack()).toBe(inBrackets);
    expect(await linkAt(9, 0)).toBe(false);
    expect(await linkAt(3, 1)).toBe(false);
```

```seal
verdict: fixed 59f1aef
answer: took the optional move, not `comeOnto`: the reads expect an absence, and `comeOnto` waits for a presence, so it cannot hold them; `pasteOnceBack` returns only once the paste reached the process, which the screen sends only after it drew the replay, so the two reads now come after it; the precondition holds by reading `test/fixtures/basics-shell.sh` (`stty raw -echo`, then `exec cat` into a file: a paste draws nothing); seen red with `seal mutate` (executed): the clear's `forget` removed failed at `terminal-basics.test.ts:1070`, `expected true to be false`; `e5a8e6c` corrects `phase-1.md:15` (`linkAt` is called in the path case and the clear-screen case) and `gaps.md:15`
```

## Confirmations

What matched: the three cases still fail where the timer they check is removed or shortened where it starts (executed). These were mutations in a clone of `180b223`, with one built-app file running at a time. In `apps/desktop/src/renderer/menu.ts:211`, `setTimeout(closeSubmenu, 0)` failed at `work-item-menu.test.ts:412`, "expected 1.2000000476837158 to be greater than or equal to 299". The pause removed (`closeSubmenu()` in place of the timer) failed at `:405`, `{ onCopyPath: false, back: false }`. The submenu's `pointerenter` listener removed (`menu.ts:99`) failed at `:407`, the submenu gone after the 500 ms wait. In `apps/desktop/src/renderer/work-item-view.ts`, the card's show timer at 0 ms (`:216`) failed at `terminal-basics.test.ts:615`, "expected 1.7000000476837158 to be greater than or equal to 299". The leave timer at 0 ms (`:171`) failed at `:662`, "expected 0.9000000953674316 to be greater than or equal to 199". Each red line names the guard that was mutated. This agrees with `phase-1.md:11` and `phase-1.md:35`, apart from line numbers that moved by one. A mutation score licenses *tested*, never *safe*. Finding 1 is the edit these cases miss.

What matched: a person's start is unchanged (read). `apps/desktop/src/main/main.ts:127` keeps `show: !background`. `main.ts:152` calls `showInBackground(win)` only under `if (background)`. `createWindow` is the one place a window is made, and its callers are `main.ts:101`, `:205` and `:209`. Without `OWLERY_BACKGROUND=1`, `takeBackground` answers false, and neither `setIgnoreMouseEvents` nor `showInactive` runs. Only reading holds the call at `main.ts:152`, as `phase-1.md:31` says. Electron offers no way to read back whether a window ignores the mouse, so a cheap case could not hold it. `apps/desktop/test/background.test.ts:66-70` holds the order inside `showInBackground`.

What matched: ignoring the mouse hides no defect the suite could see before, and it leaves the tree's agent drive as it was (executed, `git grep` on `OWLERY_BACKGROUND`, `keepBackground` and the debugging port). Every start the suite and the memory measurement make drives the page through Electron's debugging port (`apps/desktop/test/built-app.ts:185`). `Input.dispatchMouseEvent` reaches the page inside Chromium and not through the system's pointer, and run 44998865255 passed all 35 files with the window ignoring the mouse. Before this change, the system's pointer reached the window only as the noise this work found, and on the runner nobody moves a mouse. The tree names no agent that drives a background window with the system's clicks. An agent outside the tree that did so, for example through computer use, would now click through the window. `docs/architecture.md:341` now says so ("their clicks land in the windows under it"). The person-run starts are `korean:typed` (`apps/desktop/test/korean-input.test.ts:327`) and the memory measurement's `person` start (`apps/desktop/test/memory.ts:477`). Both pass `keepBackground`, and neither is changed.

What matched: the retry is gone, and nothing in the tree still states it (executed). `apps/desktop/vitest.config.ts` has no `retry` key at `180b223`. `git grep -i retry` over `docs`, `apps/desktop`, `.github`, the READMEs and `seal/threads`, leaving out this work item, finds it only in #30's and #118's own records (`gaps.md`, `pr.md`, `guarantee.md`, phase records). Those state what held when they were written, and the settle removes them. Run 44998865255 at `180b223` concluded `success` with "35 passed (35)" (read through `gh run view`). That is one run; the cases failed on "some runs" before.

What matched: removing #30's retry bullet from `seal/threads/1795268298-desktop-suite-in-ci/changelog.md` keeps `docs/roadmap.md:53` (read). The rule asks that an earlier fragment's bullet the work makes untrue be rewritten in the work's own pull request. Release 0.0.2 never ships the retry, so no true sentence about it was left for #30's part of the note. `changelog.md:9` of this work item carries the history: "#30 had `apps/desktop/vitest.config.ts` run a failed case a second time where `CI` is set. This work removes that retry".

What matched: the four document edits say the same thing in each language, and they add no heading and no table row (read in the diff). `docs/roadmap.md:29` and `docs/roadmap.ko.md:29` say that the window ignores the mouse, and so do `docs/architecture.md:341` and its twin, which also say where the clicks go.

What matched: `apps/desktop/test/background.test.ts:66-70` covers `showInBackground`, a function no other case covers. No duplicate check in the repository names a pair for it, and the test files declare no `TARGET`.

A coverage gap with no finding: `crossToCopyPathAndBack` (`work-item-menu.test.ts:91-100`) raises the submenu's `pointerenter` itself. So the case no longer shows that a real pointer, hit-tested by the page, reaches the submenu while a pause runs. The listener the event reaches is still held by the mutation at `menu.ts:99` above.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the frame's first *Done when* line, which asks to measure on the runner what makes two pointer moves outlast 300 ms, still stands now that the phase found the time spent outside the page | `seal/threads/1795329619-timed-cases-race/gaps.md:8` | the orchestrator, who owns issue #117 |
| Whether a real pointer passes through a window started with `OWLERY_BACKGROUND=1`: no case moves the system's cursor | `seal/threads/1795329619-timed-cases-race/gaps.md:10` | the owner |
| The broad gate at `180b223`: the typecheck, the full suite, and each document compared with its twin. This round ran single built-app files only, and labels the suite `unverified` | `seal/config.json` `Broad gate` | the orchestrator, at the broad run, before the sealer's spawn |
| Whether the branch's records and documents still read true once merged onto `6f10cd0`, whose #123 rewrote parts of `docs/architecture.md` (the bullet of finding 2 now stands at its line 349 there) | `docs/architecture.md` | the orchestrator, at the merge or rebase |

## Probes

| Command | Result |
|---|---|
| `seal mutate src/renderer/menu.ts` with three `--replace` pairs (timer at 0 ms, the submenu's `stay` listener removed, `closeSubmenu()` in place of the timer), `--tests 'node scripts/test-in-electron.mjs test/work-item-menu.test.ts -t "opens the submenu when the pointer comes onto Open in"'`, in the clone's `apps/desktop` | baseline green in 13.8 s; 3 mutants, 3 red |
| the same three mutants, one at a time, edited in the clone and run with `node scripts/test-in-electron.mjs test/work-item-menu.test.ts -t "opens the submenu when the pointer comes onto Open in"` | red at `:412` (1.2 against 299), at `:407` (`false` for `true`), and at `:405` (`{ onCopyPath: false, back: false }`) |
| `SUBMENU_LEAVE_MS = 0` at `menu.ts:11`, then `node scripts/test-in-electron.mjs test/work-item-menu.test.ts` | 29 of 29 passed |
| `CARD_SHOW_MS = 0` at `view.ts:1002`, then `node scripts/test-in-electron.mjs test/terminal-basics.test.ts` | 25 of 25 passed |
| `setTimeout(hideCard, 0)` at `work-item-view.ts:171`, then `node scripts/test-in-electron.mjs test/terminal-basics.test.ts` | 1 failed, at `:662` (0.9 against 199), and 24 passed |
| `}, 0);` in place of `}, CARD_SHOW_MS);` at `work-item-view.ts:216`, then `node scripts/test-in-electron.mjs test/terminal-basics.test.ts` | 1 failed, at `:615` (1.7 against 299), and 24 passed |
| `git merge-tree --write-tree origin/release/v0.0.2 180b223` | exit 0, no conflict |
