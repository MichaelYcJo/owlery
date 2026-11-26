# Review round 1: 1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll

```seal
target: f0118a3e against release/v0.0.5
```

This round reviewed the branch at `f0118a3e` against `release/v0.0.5` at `9f9ba1da`, in a `git clone --no-local` of the repository made under the round's scratch directory. No earlier round stands, so no fact is carried. Every coordinate below was opened at the target this round. `seal/parity.json` is not declared, and `seal/config.json` has no `Pact` key. `Record language` and `Commit and pull request language` are both English, so no `pr.<lang>.md` is owed.

The records read whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` to `phase-3.md`, and the six `screenshots/*-delete.png`, of which `desk-light-delete.png` and `register-dark-delete.png` were opened as images.

The axes this change adds to the table are what a kept part is drawn from against what its drawing reads, a dialog closed and opened again while its kept parts stay, and what a restart of the daemon does to a session in the queue. The daemon's `close` clears the queue and keeps no headless session across a start (`apps/desktop/src/daemon/daemon.ts:776-799`), so "leave the queue" is true of the dialog that asks before the daemon ends as well.

## Findings

### 1. The delete case that the frame names for "No waiting session" reads no section head, and no built-app case catches a queue section drawn where no session waits

```seal
severity: should
location: `apps/desktop/test/work-item-menu.test.ts:891`, `seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll/frame/design.md:80`
evidence: executed `git grep -n -e 'sessions-list' -e 'daemon-sessions' -e 'delete-sessions' -e 'remove-sessions' -e 'remove-work-items' -- apps/desktop/src apps/desktop/test`; executed the probe of `## Probes`, `node scripts/test-in-electron.mjs test/work-item-menu.test.ts test/daemon-restart.test.ts` against a `drawSessions` that draws an empty queue section under the sections it is given; read `apps/desktop/test/work-item-menu.test.ts:891`
```

Why it matters: the acceptance row "No waiting session" (`frame/design.md:80`) says the delete case of `work-item-menu.test.ts` "reads `["Shell"]` under `#delete-sessions` and, after this work, one section head there". The case at `work-item-menu.test.ts:891` still reads the lines alone, `[...document.querySelectorAll("#delete-sessions li")]`. `trail/phases/phase-1.md` names no departure from that row. *Scope* item 3 says a section that holds no line is not shown. `sessionSections` holds that in `view.test.ts`, but `drawSessions` in `renderer.ts` is reached only by built-app cases. The `git grep` listed every reader of the session containers. Only `machine-dialog.test.ts:400` and the screenshot run's wait read the heads, and both read a scene where a session of each kind stands. So a renderer that drew a queue section with no lines under the running one would pass. The probe drew such a section in every session dialog that shows one, and the two built-app files that read the dialogs where no session waits both passed, 35 cases of 35.

The fix is the frame's row as it stands, at `work-item-menu.test.ts:891`. The case's line then reads the head and the lines of each section, in the form `machine-dialog.test.ts:400` reads them:

```ts
    expect(await value<[string, string[]][]>(`[...document.querySelectorAll("#delete-sessions section")].map((section) => [section.querySelector("h3").textContent, [...section.querySelectorAll("li")].map((item) => item.textContent)])`)).toEqual([["Running sessions that end", ["Shell"]]]);
```

This round did not run the line. Against the probe's mutant of `drawSessions` it should receive a second, empty section, so the fix pass shows it red there, with nothing else changed (contract rule 15).

```seal
verdict: fixed 2b07765a
answer: The finding holds: at `f0118a3e`, line 891 read the lines of `#delete-sessions` alone, against the row "No waiting session" of `frame/design.md`. The paste-ready line was read against `drawSessions` (`apps/desktop/src/renderer/renderer.ts:525-541`), which draws each section as a `section` holding an `h3` and a `ul` of `li`. It replaces line 891 as written. Seen red (executed): `seal mutate src/renderer/renderer.ts` with the round's probe mutant, which adds an empty queue section after any sections it is given, and `--tests "node scripts/test-in-electron.mjs test/work-item-menu.test.ts test/themes.test.ts --bail=1"`, run in `apps/desktop` under the machine's lock with `OWLERY_BACKGROUND=1`. The baseline at `554fec1f` passed both files. The mutant read `red` (exit 0): the delete case failed at `test/work-item-menu.test.ts:891`, where it received two sections for one, and no other case failed. `renderer.ts` was restored from the bytes `seal mutate` held, and `git status --short` then printed nothing. That baseline is the fix pass's narrow set: the changed test file, and `themes.test.ts`, the repository's tree-wide reader of `docs/` and `index.html`. The fix changed no file of the app. `npx tsc --noEmit -p .` in `apps/desktop` exited 0 before the commit. The class, listed by its cause: every session dialog draws its sections through `drawSessions`, so this one case now catches an empty section in any of them. The other built-app cases still read only the lines where no session waits: `#sessions-list` and `#remove-sessions` in `work-item-menu.test.ts`, and `#daemon-sessions` in `daemon-restart.test.ts`. They stand because they read lines, which the mutant leaves alone, and because the cause they share is held at line 891. The full suite and the broad gate stay `unverified`, and the orchestrator answers them.
```

### 2. `trail/phases/phase-1.md` says the Korean row calls the state "기계를 기다리는", and the row the build wrote does not

```seal
severity: should
location: `seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll/trail/phases/phase-1.md:17`
evidence: executed `git show acb1d227 -- docs/design.ko.md | grep '^+' | grep -c '기계를 기다리'` (0) and the same for `0da66373` (0); executed `git grep -n '기계를 기다리' -- docs`; read `docs/design.ko.md:458`
```

Why it matters: phase 1 claims "The Korean edition calls the state "기계를 기다리는", the word `docs/design.ko.md` already uses for the Machine dialog's queue." Neither commit that edited the row "삭제 대화 상자" adds that word, and at the target `git grep` finds it at `docs/design.ko.md:457` alone, the Machine dialog's row. The row the build wrote, `docs/design.ko.md:458`, says "아직 시작하지 않은 세션을 담는", which renders the English row's "for a session that has not started". The row itself is right: it says what the English row says. The claim about it is false, and the sealer audits the phase records against the tree. The Korean `to` texts of `frame/design.md` *Rule changes* say "컴퓨터를 기다리는", the word `docs/architecture.ko.md:469` uses for the same queue, so the two editions already hold both words and the claim is the one sentence that is wrong.

The fix rewrites the sentence in place, in `trail/phases/phase-1.md` line 17:

```markdown
- `docs/design.md` and `docs/design.ko.md`, the row "The delete dialog": the three sentences of *Data & interfaces* that state *Scope* item 1 stand before its last sentence. The fourth sentence, on the kept lists, is phase 2's. The Korean edition renders "for a session that has not started" as "아직 시작하지 않은 세션을 담는", and names the state by no other word.
```

```seal
verdict: fixed 554fec1f
answer: The finding holds, and the sentence at `trail/phases/phase-1.md:17` is rewritten in place to the round's text. Before applying it, I read `docs/design.ko.md:458` at HEAD: it says "아직 시작하지 않은 세션을 담는" and holds no form of "기다리", so "names the state by no other word" is true. After the last fix commit (executed): `git grep -n -c '기계를 기다리' -- docs` printed `docs/design.ko.md:1`, the Machine dialog's row at line 457, which stands because it is another row. A `git grep` for "기계를 기다리" and "calls the state" over the work item's records printed only this round record's own finding. One statement of the round's grounds does not hold at HEAD: `git grep -n -c '컴퓨터를 기다리' -- docs` printed nothing, and `docs/architecture.ko.md:469` says "대기열에서 기다리고". So "컴퓨터를 기다리는" stands only in the Korean `to` texts of `frame/design.md` *Rule changes*, which the settle writes. That changes nothing of the fix. The read of the range and the records (executed and read, after `554fec1f`): I read every hunk of `2b07765a` and `554fec1f`. I held `routing.md`, the three frame files, `gaps.md` and `changelog.md` from my whole read at phase 3's close, `71d30d5e`, and did not print them whole again. `git diff 71d30d5e HEAD` over them printed one changed line, the Status of Q3 in `frame/questions.md`. Against those reads, HEAD contradicts no statement in any of them. `frame/design.md:80` now matches the case, and Q3's Status in `frame/questions.md` stands answered. Neither fix changes what the work item ships, so `changelog.md` is unchanged. Not done: nothing.
```

## Confirmations

What matched: *Scope* items 1, 2 and 4. `runningIn` selects `working` and `queued` apart (`apps/desktop/src/renderer/view.ts:1043-1052`). `archivalOf`, `removalOf` and `runningSessions` answer a `SessionsNamed` whose lines keep their old words and order, and each `running.headless` holds the working ids, then the waiting ones (`view.ts:1024-1035`, `:1062-1068`, `:1097-1110`). The daemon's `runningTold` checks each id with `includes` (`apps/desktop/src/daemon/daemon.ts:2045`), so the order carries nothing. Read, and `executed` through the run of `test/view.test.ts` in `## Probes`.

What matched: *Scope* item 3. `archive` sends at once only where `sessionSections(told.sessions)` is empty (`apps/desktop/src/renderer/renderer.ts:1480`), so a work item whose only session waits opens its dialog first. This answers the second row of `gaps.md` *Not verified* by reading; no case reaches the decision, as the row says. Read.

What matched: the acceptance row "The other session dialogs" and the fifth row of `gaps.md` *Not verified*. `showArchive`, `showDaemonEnding`, `showDelete` and `showRemove` draw their sessions through `drawSessions` and through nothing else (`renderer.ts:1165`, `:1281`, `:1467`, `:1505`), and the `git grep` of finding 1 found no other writer of the four containers. Executed and read.

What matched: *Scope* items 6, 7 and 8, and *Data & interfaces* line 138. Each kept part's drawing reads only what it is compared on: `#delete-loss` reads `loss` (`renderer.ts:1279-1280`), `#remove-losses` reads each title and loss among `[id, title, loss]` (`renderer.ts:1186-1201`), `#remove-work-items` reads `listed` (`renderer.ts:1160-1164`), and `drawSessions` reads the captions and lines it flattens with each count (`renderer.ts:525-541`). `lossParts`, `lossRow` and `deleteSays` read only the loss (`renderer.ts:484-522`). `openDelete` sets the loss to `null` through `readDeleteLoss`, and `openRemove` forgets the losses (`renderer.ts:1288-1296`, `:1313-1318`, `:1205-1209`, `:1227-1236`), so a dialog opened again draws its losses anew. Read.

What matched: *Scope* item 5. The doc comment of `Running` says the headless sessions "that work or wait for the machine" (`apps/desktop/src/shared/protocol.ts:138`). The comments `gaps.md` *Not done* names stand as it says (`protocol.ts:909`, `daemon.ts:1128`, `renderer.ts:1997`), and the daemon's own `runningIn` counts both kinds (`daemon.ts:2033-2039`). Read.

What matched: *Scope* item 9. The row "The delete dialog" gains the four sentences of *Data & interfaces* before its last sentence, in place, at `docs/design.md:458`, and `docs/design.ko.md:458` says the same. Read.

What matched: *Scope* item 10 and the figures. The six `*-delete.png` files stand under `screenshots/`. `desk-light-delete.png` and `register-dark-delete.png` show "Running sessions that end" over "Shell" and "Sessions waiting for the machine that leave the queue" over "Asked: Which keys does the settings file hold?", under the losses, with each head in the caption style of the loss heads and each line in the ink of what is read, as `docs/design.md` *Components and their states* asks of the row. The dialog stands whole in the window, from about y 30 to y 870, which matches phase 3's answer to Q3. This answers the seventh row of `gaps.md` *Not verified* for the two shots opened. Read.

What matched: the third row of `gaps.md` *Not verified*. Each section is a `section` holding an `h3.caption` and a `ul.named`, and the rules `dialog section`, `dialog section h3` and `dialog section .named` apply in every dialog alike (`apps/desktop/src/renderer/index.html:564-567`). The two sections of the other session dialogs take the form the delete dialog's shots show. Read.

What matched: the new cases against their groups. The `removalOf`, `archivalOf` and `runningSessions` cases each replace a pin of the old shape, and `sessionSections` and `sameValues` are new functions with no earlier group. The removal dialog's built-app case is new and covers a dialog the delete case does not. No case duplicates another of its group. Read.

What matched: the records against each other. `pr.md` quotes *Scope* items 1, 4, 6, 7, 8 and 10 and Q1 and Q2 with their defaults, each word for word at the coordinate it names. `changelog.md` states what the code does. `frame/design.md` *Data & interfaces* and *Scope* item 8 name `sameValues`, `namedRows` and the `null` of a loss not read, as phase 2 built them. Read.

The axis *Record against another work item's frame*: `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/design.md` *Rule changes* adds a paragraph to *A pull request that changes the window carries its screenshots*, where this work adds another. #214's paragraph says the delete view waits until the commits' head counts 39. That stays true, since the view now waits for that and for the two session sections. #214's Korean text also says "컴퓨터를 기다리는", as this frame's does. Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the tooltip under the pointer stays open on the screen across an `inbox`. The cases read that the row is the same element; Chromium draws the tooltip (`gaps.md` *Not verified*, fourth row) | `apps/desktop/test/work-item-menu.test.ts:957-961` | the orchestrator, by a look at the built app where it judges one worth it |
| Whether a session list kept by `drawWhereChanged` opens again scrolled where it was left, where the same dialog is closed and opened with the same lines. `#delete-sessions` and `#daemon-sessions` were new elements at each draw before this work. A session list scrolls only past `--said-height` | `apps/desktop/src/renderer/renderer.ts:525-541` | the orchestrator, at the built app where it judges it worth a launch |
| How far the delete dialog of the shots stands from the browser's bound for a modal dialog. Read from the shot it is about 840px high in a 900px window; the bound is Chromium's style for a modal dialog, which this round did not open (`gaps.md` *Not verified*, sixth row) | `seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll/screenshots/desk-light-delete.png` | the orchestrator |
| The full suite, the typecheck and the broad gate at the target, which no agent runs (contract rule 2). The suite stands `unverified` | the repository | the orchestrator's broad run |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts`, in `apps/desktop` at the target | exit 0, 1 file and 554 cases passed |
| `node scripts/test-in-electron.mjs test/work-item-menu.test.ts test/daemon-restart.test.ts`, in `apps/desktop`, with `drawSessions` building `[...sections, ...(sections.length === 0 ? [] : [{ caption: "Sessions waiting for the machine that leave the queue", lines: [] }])]`, then `renderer.ts` restored | exit 0, 2 files and 35 cases passed: the mutant survived both files |
