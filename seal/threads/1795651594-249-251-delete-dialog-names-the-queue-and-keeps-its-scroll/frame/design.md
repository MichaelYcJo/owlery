# Design: the delete dialog names the queue and keeps its scroll (#249, #251)

## Grounding

The tree as read at `ea8126b5`. It differs from `release/v0.0.5` at `9f9ba1da` by this work item's `routing.md` alone (`git diff --stat 9f9ba1da HEAD`, `executed`).

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Memory design*, "A headless session over the cap on agents waits in a queue, and what a person opens by hand never waits" (line 469) | A headless session asked for at the cap "is listed as queued and starts no process". So a session that waits for the machine is not running, and a head that says "Running" of it is false. The window's words for the state are "waits for the machine": the same rule has the work item's line say so. |
| `docs/design.md` *The voice of the window's words*, "What will be lost is said before it is lost, and so is what will not be" | A session that leaves the queue is named before the act, as a running one is. It keeps a section of its own and is not dropped from the dialog. |
| `docs/design.md` *The voice of the window's words*, "A whole sentence that names the thing" and "Sentence case" | "A label of a part is a noun". The new section's head is a noun phrase in sentence case, in the form of "Running sessions that end". |
| `docs/product.md` *What we deliberately don't do*, the bullet "Owlery deletes nothing of a person's work without that person's word" (line 170) | A forced delete runs "only after the person has read each by name". #214 made the scroll the one way to read a long list, so a list that jumps to its top while it is read works against this rule. |
| `docs/design.md` *Principles* 8 | "The pull request that draws the form writes its row, in both editions of this document, and leaves none to the release's settle." This work changes the form of the delete dialog, so it edits the row "The delete dialog" of *Components and their states* in place, in `docs/design.md` and `docs/design.ko.md`. #214 wrote that row the same way. |
| `docs/design.md` *A pull request that changes the window carries its screenshots* | The delete dialog is a view of the screenshot run, and this work changes what it draws. The pull request carries the delete dialog's screenshots again. |
| `docs/architecture.md` *Overall layout*, the bullet "A person stops the daemon from the app's menu" (line 40) | It says that "Restart Daemon…" and "Quit Owlery Completely…" "name the running sessions first". After this work that dialog names the sessions that wait as well, apart from the running ones. *Rule changes* states the sentence anew, in both editions. |
| The unsettled `add` of `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/design.md` *Rule changes*, to `docs/architecture.md` *Screen framework: Electron* | It holds a draw of the daemon's lists until a held press is released, and says "A draw replaces every line and button it draws". This work makes a dialog's draw leave a list alone where the list did not change. The sentence stays true of each list a draw does draw, so this work changes nothing of that rule. |

What the tree says about the code, at `ea8126b5` (`read` unless marked):

- **The session dialogs.** Four dialogs list the sessions an act ends, each under the head "Running sessions that end". They are the class #249's second *Done when* line asks for. `git grep -n 'Running sessions that end' -- . ../../docs ':!../../seal'`, run in `apps/desktop`, printed one line of `src/renderer/index.html` for each of them and no other line (`executed`). This frame calls them the session dialogs:
  - the dialog before an archive (`#sessions-dialog`, head at `index.html:1015`, drawn by `showArchive`, `renderer.ts:1425`);
  - the dialog that asks before the daemon ends (`#daemon-dialog`, `index.html:1030`, `showDaemonEnding`, `renderer.ts:1473`);
  - the delete dialog (`#delete-dialog`, `index.html:1046`, `showDelete`, `renderer.ts:1235`);
  - the repository's removal dialog (`#remove-dialog`, `index.html:1067`, `showRemove`, `renderer.ts:1114`).
- **The cause of #249.** One function decides which headless session a session dialog lists: `headlessRuns` (`apps/desktop/src/renderer/view.ts:1010-1012`) answers true for `working` and for `queued`. `runningIn` (`view.ts:1015-1021`) uses it, and `archivalOf` (`view.ts:1030-1036`), `removalOf` (`view.ts:998-1007`) and `runningSessions` (`view.ts:1062-1072`) put every such session into one list of lines. Each dialog draws that one list under the one head.
- **The daemon already treats the two kinds apart, and takes both by id.** `endSessions` (`apps/desktop/src/daemon/daemon.ts:2140-2162`) takes the queued sessions out of the queue first. `stopHeadless` (`daemon.ts:2172-2180`) says of one: it "leaves the queue with no run to stop, and gets no entry in the ledger, since nothing ran". `runningTold` (`daemon.ts:2043-2047`) refuses a request whose `running.headless` leaves out a queued session. So the request keeps carrying the ids of both kinds, and this work changes nothing in the daemon or in the protocol's messages.
- **One comment of the protocol states the old fact.** The doc comment of `Running` (`apps/desktop/src/shared/protocol.ts:138`) says "the headless sessions that are working". The ids of the sessions that wait are in it too (`apps/desktop/test/view.test.ts:821-822`).
- **The window already has a word for the state.** The line and the chain's foot say "Waiting for the machine" (`view.ts:1527-1529`), and the Machine dialog lists the queue under the label "Waiting for the machine" (`apps/desktop/src/renderer/machine.ts:110`).
- **The cause of #251.** Each draw of a dialog builds its lists from nothing.
  - `showDelete` runs `byId("delete-loss").replaceChildren(...lossParts(deleteLoss))` (`renderer.ts:1244`), and `lossParts` (`renderer.ts:487-505`) makes a new `ul.loss` for each section. A new list starts at `scrollTop` 0, and the row under the pointer is a new element, so its tooltip closes.
  - `showRemove` does the same for every work item's loss (`renderer.ts:1157-1168`).
  - The session lists are rebuilt the same way: `namedLines` replaces the list in `showDelete` (`renderer.ts:1247`) and `showDaemonEnding` (`renderer.ts:1484`), and `replaceChildren` replaces its rows in `showArchive` (`renderer.ts:1436`) and in `showRemove`'s `list` (`renderer.ts:1123-1135`). `dialog .named` scrolls past `--said-height` (`index.html:566`).
- **What calls those draws.** `drawLists` (`renderer.ts:1565-1580`) draws every open dialog at each `inbox`, and the daemon sends an `inbox` at "every change of a pane's `alive` or `state`" (`daemon.ts:3806-3811`). `takeHeadlessSession` (`renderer.ts:1528-1534`) draws the same dialogs at each message about a headless session. The removal dialog also draws at a change of its own checkboxes (`renderer.ts:2227-2228`), and the delete dialog at its own (`renderer.ts:2230`).
- **The tree already keeps one drawn part by comparing what it was drawn from.** The dialog of the records place redraws its files only where `recordsDrawn !== recordsPlan` (`renderer.ts:274`, `:1321-1322`), so "a key in the field redraws none of them" (`renderer.ts:269`). This work extends that mechanism and adds no new kind of one. `git grep -n -i 'drawn' -- src/renderer`, run in `apps/desktop`, found no other such comparison in a dialog (`executed`).
- **A loss is a new object at each read.** `deleteLoss` is assigned only in `readDeleteLoss` (`null`, `renderer.ts:1257`) and `takeDeleteLoss` (the daemon's answer, `renderer.ts:1273`). `removeLosses` is written only in `takeRemoveLoss` (`renderer.ts:1188`) and cleared in `forgetRemoveLosses` (`renderer.ts:1172-1176`). So a comparison by identity is exact: the same object is the same loss, and a loss read again is drawn again.
- **The cases that pin the lists today.**
  - `apps/desktop/test/view.test.ts`: the `archivalOf` cases (`:810-833`), of which `:821-822` pin a queued session among the running lines; the `removalOf` cases (`:696-720`); the `runningSessions` cases (`:854-886`), of which `:880` pins the queued lines.
  - `apps/desktop/test/work-item-menu.test.ts` reads the lines under `#sessions-list` (`:731`), `#delete-sessions` (`:858`) and `#remove-sessions` (`:1022`, `:1071`, `:1095`). `apps/desktop/test/daemon-restart.test.ts:77` reads `#daemon-sessions`.
  - No case reads a list's scroll after a redraw. The long list's case (`work-item-menu.test.ts:886-937`) reads where the list rests after a wheel turn and then closes the dialog.
- **A queue for a built-app case already stands.** The `describe` of `apps/desktop/test/machine-dialog.test.ts` that holds `HELD` and `WAITS` (`:316-390`) starts the app with `limits.json` holding `{ agents: 1 }` and has a second client send two `ask` messages for work item 1. The first session works and holds the one place, and the second waits. So that work item holds a session of each kind, which is the scene #249's case needs.
- **The screenshot run's delete view shows the defect of #249.** Its work item, "Rename the settings file", holds a shell pane and the asked session that waits (`seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/trail/phases/phase-2.md`, "A find outside the scope"). The view waits for the heads of the loss alone (`apps/desktop/test/screenshots.test.ts:584`).
- **The search of `frame/plan.md` phase 1.** `git grep -n 'Running sessions that end' ea8126b5 -- apps/desktop/src/renderer/index.html` printed lines 1015, 1030, 1046 and 1067 (`executed`). The first row of *Removes* takes out each of them, so after phase 1 the search prints nothing. Its pathspec names that one file, so it reads no record that quotes the head.
- **The narrow test command.** `cd apps/desktop && node scripts/test-in-electron.mjs test/<file>` runs one file. `pnpm --filter @owlery/desktop run test -- <file>` does not narrow and starts the whole suite (`seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/trail/phases/phase-1.md`, "Constraints met while running").
- **Records with nothing to say for this work.**
  - `seal/follow-up.md` does not stand, and `docs/README.md` does not stand, so the policy root has no index (`ls`, `executed`). Each `file:` of *Rule changes* is a document of `docs/` named by its path, as #214's and #242's designs name theirs.
  - The latest GitHub Release, `v0.0.4`, holds no `### Process changes` heading, and no changelog fragment under `seal/threads/` holds one (`gh release view`, `grep`, `executed`).
- **The issues.** `gh issue view 249 --json title,body,comments` and the same for 251 printed no comment on 2026-11-26 (`executed`).

Not run by the framer: no test, no typecheck and no gate of the repository. The causes above are shown by the code read, so no probe was made.

## Scope

In:

1. **Each session dialog names the sessions that run apart from the sessions that wait for the machine.** The section "Running sessions that end" holds each live pane and each headless session that is working. A second section under it, headed "Sessions waiting for the machine that leave the queue", holds each headless session whose state is `queued`. Q1 of `frame/questions.md` holds the head's words.
2. **A line's words and the order inside a section stay as they are.** A pane reads as its tab's label, and a headless session as "Asked: " and its prompt, with "in" and the work item's title where the dialog names more than one work item.
3. **A section that holds no line is not shown, and a dialog asks whenever either section holds one.** An archive of a work item whose only session waits for the machine still opens its dialog first, as it does today.
4. **What a session dialog sends the daemon does not change.** The request's `running.headless` holds the ids of both kinds.
5. **The doc comment of `Running` in `apps/desktop/src/shared/protocol.ts` says that it holds the headless sessions that work or wait for the machine.**
6. **The delete dialog keeps its loss lists in place at a redraw that does not change its loss.** The lists are drawn again only where the loss differs from the one they were drawn from, compared by identity. A list then keeps its scroll position and its rows, so the tooltip under the pointer stays.
7. **The removal dialog keeps its work items' loss lists in place at a redraw that changes nothing they are drawn from.** They are drawn from the choice to delete, and for each work item its id, its title and its loss.
8. **The session sections of each session dialog, and the removal dialog's list of work items, stay in place at a redraw that changes none of their lines.** The session sections are drawn by the one function item 1 adds, and the rows of the list of work items, which is no session section, by `namedRows`, the body of `namedLines`; the comparison of item 6 keeps each.
8a. **Each opening of a dialog starts every list of it at its top.** A kept list is the same element from one opening of the dialog to the next, so `opened` sets the scroll of each list of the dialog to its top after the dialog is shown. A redraw while the dialog is open still keeps the scroll, as items 6 to 8 state.
9. **The row "The delete dialog" of *Components and their states* states items 1, 6, 8 and 8a, in `docs/design.md` and `docs/design.ko.md`, edited in place.** The English sentences are under *Data & interfaces*.
10. **The screenshot run's delete view waits for both session sections, and the pull request carries the delete dialog's screenshots again.** The view's wait reads the head and the lines of each section. `OWLERY_SCREENSHOT_THEMES=all pnpm --filter @owlery/desktop run screenshots` writes `<theme>-<appearance>-delete.png` for every theme and appearance, and those six files are committed under this work item's `screenshots/` directory.

Out:

- **The opening sentences of the session dialogs stay as they are.** "An archive ends the work item's running sessions." and the sentences of `daemonEnding` say nothing false of a session that waits: they do not name it. Q2 holds the choice.
- **How a session dialog names a chain's stage that runs or waits.** `runningIn` names every headless session by "Asked: " and its prompt, a stage's session among them, while the Machine dialog names a stage by its short name (`view.ts:1589-1596`). The defect is in the lines of both sections and is older than this work. The hand-back names it for the orchestrator to file.
- **The lists of the other dialogs a draw rebuilds.** The dialog of hidden repositories (`renderer.ts:1055`), the Accounts dialog (`renderer.ts:904`), the Machine dialog (`machine.ts:115`) and the `records-holds` list (`renderer.ts:1320`) are rebuilt at their own draws and can scroll. #251 names the delete and the removal dialogs. The Accounts dialog is being rewritten by #218 in this release. The hand-back names these for the orchestrator to file.
- **The daemon and the protocol's messages.** *Grounding* shows why neither needs a change.
- **The refusal "A session started since you looked. Read it again."** (`daemon.ts:2046`). It is the daemon's, and it also answers for a session that joined the queue since the look. Its words are outside both issues.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A work item with a session of each kind | Given a work item with one headless session that works and one that waits for the machine. When the person opens its delete dialog. Then "Running sessions that end" lists the working session alone, and "Sessions waiting for the machine that leave the queue" lists the waiting one alone. | A built-app case in the `describe` of `apps/desktop/test/machine-dialog.test.ts` that holds the queue (*Grounding*). It opens the delete dialog of work item 1, reads each section's head and lines, and presses Cancel. Unit cases of `archivalOf` in `apps/desktop/test/view.test.ts`. |
| Only a waiting session | Given a work item whose one session waits for the machine. Then the dialog shows the queue's section and no "Running sessions that end". An archive of it opens its dialog first. | Unit cases of `archivalOf` and of the function that builds the sections, in `view.test.ts`. |
| No waiting session | Given a work item whose sessions all run. Then the dialog shows "Running sessions that end" as today and no second section. | The delete case of `apps/desktop/test/work-item-menu.test.ts`, "names in the delete dialog the branch, the folder, …", which reads `["Shell"]` under `#delete-sessions` and, after this work, one section head there. |
| The other session dialogs | Given a repository's removal, an archive, and a restart or a complete quit of the daemon, each with a session that waits. Then each names it in the queue's section and not among the running ones. | Unit cases of `removalOf` and `runningSessions` in `view.test.ts`, which replace the lines at `:821-822` and `:880`. The proofer reads that every session dialog draws through the one function. The built-app cases of `work-item-menu.test.ts` and `daemon-restart.test.ts` that read the running lines stay green. |
| The request | When the person confirms an archive, a delete or a removal that names a waiting session. Then the request's `running.headless` holds that session's id. | The unit cases above read `running` beside the lines. |
| A long list at a redraw, delete dialog | Given the delete dialog of a work item with more than ten commits no other branch holds, its commits' list scrolled to rest past its top. When the daemon sends an `inbox` that changes nothing of the loss. Then the list has the same `scrollTop`, and its rows are the same elements. | A built-app case in `work-item-menu.test.ts`, in or beside the long list's case. It scrolls the list, keeps the list and one row in `window`, has a second client change another work item so the daemon sends an `inbox`, waits until the sidebar shows that change, and then reads `scrollTop` and that the kept elements are still the list and its row. Shown red against `ea8126b5`'s `renderer.ts` (contract rule 15). |
| A kept list at an opening | Given the delete dialog with its commits' list scrolled past its top. When the person closes the dialog and opens it again with the same loss. Then the list is the same element and its `scrollTop` is 0. | The long-list delete case of `work-item-menu.test.ts` closes and opens the dialog again after its redraw. Shown red against `19d1bf8c`'s `renderer.ts` (contract rule 15). |
| A long list at a redraw, removal dialog | Given the removal dialog of a repository with the choice to delete its work items taken, and a work item's commits' list scrolled to rest past its top. When the daemon sends an `inbox` that changes nothing of the losses, and when the person checks "Force delete". Then the list has the same `scrollTop` and the same rows. | A built-app case in `work-item-menu.test.ts`, on the same work item of twelve commits, read the same way. Shown red against `ea8126b5`'s `renderer.ts`. |
| A loss that changed | Given a delete dialog or a removal dialog whose loss is read again, as after a refusal. Then the lists are drawn from the new loss. | The built-app cases of `work-item-menu.test.ts` that read a loss after a second read stay green, "keeps in the removal's dialog the refusal …" among them. |
| A session list at a redraw | Given a session dialog open. When the daemon sends an `inbox` that changes none of its sessions. Then each session list is the same element with the same rows. | The delete dialog's built-app case above also keeps the list under `#delete-sessions` in `window` and reads that it is the same element after the `inbox`. That case's work item holds a live pane. |
| The policy row | The row "The delete dialog" states the session sections and the kept lists, in both editions. | The broad gate's comparison of the editions' headings and table rows (the orchestrator's run). The proofer reads that the rows of the editions say the same. |
| The screenshots | The delete view of the screenshot run shows "Running sessions that end" over "Shell" and "Sessions waiting for the machine that leave the queue" over "Asked: Which keys does the settings file hold?". | The delete view's wait in `apps/desktop/test/screenshots.test.ts` reads both heads and their lines. The PNG files of *Scope* item 10 are committed and shown in the pull request's body. |

## Data & interfaces

The builder may name the parts differently. What each holds is fixed.

`apps/desktop/src/renderer/view.ts`:

```ts
/** The sessions a dialog names before an act that ends them: the lines of those that run, which end, and the lines of those that wait for the machine, which leave the queue. */
export interface SessionsNamed {
  running: string[];
  queued: string[];
}

/** One section of a session dialog: its head and its lines. */
export interface SessionSection {
  caption: string;
  lines: string[];
}

/** The sections a session dialog draws, the running sessions first, and none for a kind that holds no line. Each head stands here and nowhere else. */
export function sessionSections(named: SessionsNamed): SessionSection[];
```

- `runningIn` answers the working and the waiting headless sessions apart.
- `archivalOf` and `removalOf` answer a `SessionsNamed` where they answer `sessions: string[]` today, and `runningSessions` answers one where it answers `string[]`.
- `running: Running` keeps the ids of both kinds.

`apps/desktop/src/renderer/renderer.ts`:

- One function draws a session dialog's sections into that dialog's container from `sessionSections`, as `lossParts` draws a loss from `lossSections`. `showArchive`, `showDaemonEnding`, `showDelete` and `showRemove` call it. The container is hidden where no section stands.
- One helper draws a part only where what it is drawn from changed, in the form `recordsDrawn` already has. A sketch:

```ts
// What each kept part of a dialog was last drawn from. A redraw for the daemon's lists leaves a part alone while those values are the same, so a list keeps its scroll and the row under the pointer keeps its tooltip.
const drawnFrom = new WeakMap<HTMLElement, readonly unknown[]>();

function drawWhereChanged(part: HTMLElement, from: readonly unknown[], build: () => Node[]): void {
  const last = drawnFrom.get(part);
  if (last !== undefined && sameValues(last, from)) return;
  part.replaceChildren(...build());
  drawnFrom.set(part, from);
}
```

- The comparison is `sameValues` in `apps/desktop/src/renderer/view.ts`: the same length, and each value `Object.is` the one at its place. It stands in `view.ts` so unit cases pin it.
- `#delete-loss` is drawn from `[deleteLoss]`.
- `#remove-losses` is drawn from the choice to delete, held as an empty list where it is not taken, and, for each work item the removal names, its id, its title and its loss or `null` where none is read.
- A session dialog's sections are drawn from each head, its count of lines and its lines, and the `ul` of `#remove-work-items` from its lines, by `namedRows`.
- `build` reads only the values `from` holds, so a value the drawing reads cannot be left out of the comparison unseen.

`apps/desktop/src/renderer/index.html`: each session dialog's `<section>` with the head "Running sessions that end" and its empty `ul.named` gives way to an empty container that keeps the section's id (`sessions-list`, `daemon-sessions`, `delete-sessions`, `remove-sessions`). The cases that read `#<id> li` then read the lines of both sections. The sections keep the `h3.caption` head and the `ul.named` list, so no style changes.

The sentences the row "The delete dialog" gains in `docs/design.md`, before its last sentence, "The repository's removal dialog draws each work item's loss in this form.". The Korean edition says the same, in `docs/design.ko.md`'s own words:

> Under the losses the dialog names the work item's sessions in two sections: "Running sessions that end", and "Sessions waiting for the machine that leave the queue" for a session that has not started. A section stands only where it holds a session. The dialog before an archive, the repository's removal dialog and the dialog that asks before the daemon ends name their sessions in the same sections. While the dialog is open, a list whose entries did not change stays as it is drawn when the daemon sends its lists, so it keeps its scroll and the tooltip under the pointer. Each opening of the dialog starts every list at its top.

## Rule changes

- change
  file: docs/architecture.md
  section: Overall layout
  from: "Restart Daemon…" and "Quit Owlery Completely…" name the running sessions first, and on the person's confirmation the app ends the daemon.
  to: "Restart Daemon…" and "Quit Owlery Completely…" first name the running sessions and, apart from them, the sessions that wait for the machine, and on the person's confirmation the app ends the daemon.
- change
  file: docs/architecture.md
  section: Overall layout
  from: check: apps/desktop/test/daemon-client.test.ts apps/desktop/test/daemon-restart.test.ts
  to: check: apps/desktop/test/daemon-client.test.ts apps/desktop/test/daemon-restart.test.ts apps/desktop/test/view.test.ts
- change
  file: docs/architecture.ko.md
  section: 전체 구성
  from: "Restart Daemon…"과 "Quit Owlery Completely…"는 실행 중인 세션을 먼저 이름으로 보여 주고, 사람이 확인하면 앱이 데몬을 끝냅니다.
  to: "Restart Daemon…"과 "Quit Owlery Completely…"는 실행 중인 세션을, 그리고 그와 따로 컴퓨터를 기다리는 세션을 먼저 이름으로 보여 주고, 사람이 확인하면 앱이 데몬을 끝냅니다.
- change
  file: docs/architecture.ko.md
  section: 전체 구성
  from: check: apps/desktop/test/daemon-client.test.ts apps/desktop/test/daemon-restart.test.ts
  to: check: apps/desktop/test/daemon-client.test.ts apps/desktop/test/daemon-restart.test.ts apps/desktop/test/view.test.ts
- add
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  to: **The delete dialog's shot shows a session that runs apart from one that waits for the machine.** The work item whose delete dialog the run captures holds a shell pane and a session that waits under the cap on agents. The view of the delete dialog waits until "Running sessions that end" lists the pane and "Sessions waiting for the machine that leave the queue" lists the session that waits. So the shot shows both sections, each with its head.
    check: apps/desktop/test/screenshots.test.ts
- add
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  to: **삭제 대화 상자의 스크린샷은 실행 중인 세션과 컴퓨터를 기다리는 세션을 따로 보입니다.** 실행이 삭제 대화 상자를 찍는 작업에는 셸 창 하나와, 에이전트 수 한도 아래에서 기다리는 세션 하나가 있습니다. 삭제 대화 상자의 화면은 "Running sessions that end"가 그 창을, "Sessions waiting for the machine that leave the queue"가 기다리는 세션을 나열할 때까지 기다립니다. 그래서 이 스크린샷은 두 절을 각각의 머리와 함께 보입니다.
    check: apps/desktop/test/screenshots.test.ts

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The head "Running sessions that end" written once in each session dialog's markup, with its `<section>` and empty `ul.named` | `apps/desktop/src/renderer/index.html`, lines 1014-1017, 1029-1032, 1045-1048 and 1066-1069 | `sessionSections` in `view.ts` holds each head once, and the renderer draws the sections into a container that keeps the section's id. |
| A waiting session among the running lines | `apps/desktop/src/renderer/view.ts#headlessRuns`, `#runningIn`, `#archivalOf`, `#removalOf`, `#runningSessions` | The `queued` lines of `SessionsNamed`. `headlessRuns` goes where `runningIn` is its only reader, and stays where the builder finds another. |
| The copies of the code that builds a `li` holding a `span` for each line | `apps/desktop/src/renderer/renderer.ts#showRemove` (the local `list`), `#showArchive` | The one function that draws a session dialog's sections, for the session lists. The removal dialog's list of work items is no session section: the markup's `ul` stays and its rows are drawn by `namedRows`, the body of `namedLines`, which stays for `records-holds` (`renderer.ts:1320`). |
| The rebuild of the loss lists at every draw | `apps/desktop/src/renderer/renderer.ts#showDelete` (line 1244), `#showRemove` (lines 1157-1168) | The draw through `drawWhereChanged`. |
| The words "the headless sessions that are working" | `apps/desktop/src/shared/protocol.ts#Running`, its doc comment | Rewritten in place, as *Scope* item 5 says. |
| The case pins of a waiting session among the running lines | `apps/desktop/test/view.test.ts`, the `archivalOf` and `removalOf` lines at `:821-822` and the `runningSessions` line at `:880`, and each `sessions:` expectation of those `describe` blocks | Rewritten to the kinds apart, each shown red against `ea8126b5`'s `view.ts` (contract rule 15). |

This work adds one mechanism, the comparison of *Data & interfaces*. In return it takes out the rebuild at every draw, the fourth row above. The comparison has the form `recordsDrawn` already has. The work adds no mark, no gate and no check.

Framed 2026-11-26 by framer, before the build.
