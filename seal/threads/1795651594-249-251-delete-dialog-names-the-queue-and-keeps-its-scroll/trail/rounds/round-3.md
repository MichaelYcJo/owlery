# Review round 3: 1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll

```seal
target: 98bf2853, fixes e48c64fc..98bf2853
```

This round verifies round 2's fix pass. It reviewed the diff `e48c64fc..98bf2853` against `release/v0.0.5` at `9f9ba1da`, in a `git clone --no-local` of the repository made under the round's scratch directory and checked out at `98bf2853`. The diff holds four commits after round 2's record. `a5270b96` adds the reset loop to `opened` in `apps/desktop/src/renderer/renderer.ts`, extends the long-list delete case of `apps/desktop/test/work-item-menu.test.ts`, adds one sentence to the row "The delete dialog" in `docs/design.md` and `docs/design.ko.md`, and extends one bullet of `changelog.md`. `bd3d92e3` extends the comment of `drawnFrom` and adds a row to `gaps.md` *Not verified*. `eb621561` appends the close block to `round-2.md`. `98bf2853` is the orchestrator's fold: `frame/design.md` *Scope* item 8a, item 9's list, the sentence in *Data & interfaces*, the scenario row "A kept list at an opening", and one quote added to `pr.md`. `seal/parity.json` is not declared, `seal/config.json` has no `Pact` key, and `Record language` and `Commit and pull request language` are both English, so no `pr.<lang>.md` is owed.

The records read whole at `98bf2853`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` to `phase-3.md`, `trail/rounds/round-1.md` and `trail/rounds/round-2.md`. The six screenshots did not change in the range and were not opened again.

Carried from round 2 and not re-established: Chromium keeps a box's scroll offset across `display: none` and gives it back to the same element (round 2's probe of `#daemon-sessions`); where `drawSessions` and `drawWhereChanged` stand; and that `#delete-loss` and `#remove-losses` are drawn anew at each opening. The last was opened again at the target, since finding 2 rests on it: `readDeleteLoss` sets the loss to `null` at each opening (`renderer.ts:1290-1298`) and `takeDeleteLoss` sets a new object (`:1309`). Every verdict below is this round's own.

## Findings

### 1. The changelog and *Scope* item 8a say every dialog starts its lists at the top when it opens, and the Accounts dialog and the dialog of hidden repositories do not run the reset

```seal
severity: should
location: `seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll/changelog.md:8`, `seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll/frame/design.md:63`, `seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll/pr.md:9`
evidence: executed `git grep -n "opened(" -- apps/desktop/src`, `git grep -n "showModal()" -- apps/desktop/src`, `git grep -n -F "Each opening" -- seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll docs apps`; read `apps/desktop/src/renderer/renderer.ts:413-422`, `:920-928`, `:943`, `:1091-1094`, `:1138-1142`, `apps/desktop/src/renderer/index.html:964`, `:1005`, `:566`
regression: round-2#1
```

Why it matters: the last sentence of the `changelog.md` bullet on kept lists (line 8) says "Each opening of a dialog starts every list at its top, so a dialog opened again does not keep the scroll its last opening left." *Scope* item 8a (`frame/design.md:63`) says "Each opening of a dialog starts every list of it at its top", and `pr.md:9` quotes that sentence. The reset stands in `opened` alone (`renderer.ts:420`). `git grep -n "showModal()"` lists the dialogs that open without it. Two of them hold a list that scrolls. The Accounts dialog opens at `renderer.ts:927`, and its `#accounts-list` is the markup's `ul` (`index.html:964`), whose rows `showAccounts` replaces (`renderer.ts:943`). The dialog of hidden repositories opens at `renderer.ts:1141`, and its `#hidden-list` (`index.html:1005`) is kept the same way (`renderer.ts:1094`). Both take `dialog .named`, which scrolls past `--said-height` (`index.html:566`). So each keeps its element across a close and an opening, and by round 2's probe it opens again at the scroll its last opening left. This round did not probe these two dialogs. The changelog goes to the release notes, so it tells a person something the window does not do. The sealer reads item 8a against the tree.

The fix pass's account is the source. Its close says "`opened` is the one path every dialog opens by". `git grep -n "showModal()"` prints eight calls. One is in `opened`. The others open the rename, chain, Accounts, hidden-repositories and new-work-item dialogs (`renderer.ts:734`, `:779`, `:927`, `:1141`, `:1677`) and two dialogs of `work-item-view.ts` (`:1094`, `:1114`). The frame keeps the Accounts dialog and the dialog of hidden repositories out of this work (`frame/design.md` *Scope*, *Out*, "The lists of the other dialogs a draw rebuilds"). Round 2's finding asked for a reset in `opened`, for the dialogs that open through it. The fix did that. Its changelog sentence states the reset for every dialog, and the fold copied it into item 8a and `pr.md`. So the words, not the code, owe the fix.

The search `git grep -n -F "Each opening"` printed six lines. Three are the ones above. `docs/design.md:458` says "Each opening of the dialog", the delete dialog, which is true. The other two are a comment at `renderer.ts:1668` and a comment of `work-item-form.test.ts:155` about the new-work-item form, which are no statement of this reset. The search is a sample, since a statement in other words escapes it. The comment at `renderer.ts:419` says "each opening starts every list at its top" inside `opened`, and holds as it stands.

The fix narrows the three sentences to the dialogs `opened` shows. In `changelog.md`, line 8, the bullet's last sentence:

```markdown
Each opening of one of these dialogs starts every list at its top, so a dialog opened again does not keep the scroll its last opening left.
```

In `frame/design.md`, line 63, *Scope* item 8a:

```markdown
8a. **Each opening of a dialog that opens through `opened` starts every list of it at its top.** The session dialogs open through it. A kept list is the same element from one opening of the dialog to the next, so `opened` sets the scroll of each list of the dialog to its top after the dialog is shown. A redraw while the dialog is open still keeps the scroll, as items 6 to 8 state. The Accounts dialog and the dialog of hidden repositories open without `opened`, and *Out* leaves their lists as they are.
```

In `pr.md`, line 9, the quote follows item 8a word for word:

```markdown
- "**Each opening of a dialog that opens through `opened` starts every list of it at its top.**" (`frame/design.md` *Scope*, item 8a)
```

The changelog's "these dialogs" are the delete dialog, the repository's removal dialog and the session dialogs, which the bullet and the one above it name.

### 2. The scenario row "A kept list at an opening" names the commits' list, which is drawn anew at each opening, and the case reads the list of sessions

```seal
severity: should
location: `seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll/frame/design.md:85`
evidence: executed `git grep -n -F "commits' list" -- seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll`; read `apps/desktop/src/renderer/renderer.ts:1271-1320`, `apps/desktop/test/work-item-menu.test.ts:967-979`, `seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll/frame/design.md:35`
regression: round-2#1
```

Why it matters: the row the fold added (`frame/design.md:85`) says "Given the delete dialog with its commits' list scrolled past its top. When the person closes the dialog and opens it again with the same loss. Then the list is the same element and its `scrollTop` is 0." At the target the commits' list can never be the same element at an opening. `openDelete` calls `readDeleteLoss` (`renderer.ts:1315-1320`). That sets the loss to `null` and draws, so `drawWhereChanged` empties `#delete-loss` (`:1282`, `:1290-1298`). The daemon's answer is then a new object, which draws new lists (`:1309`). The frame's own *Grounding* says so: "a loss read again is drawn again" (`frame/design.md:35`). No opening holds "the same loss". The case the row names reads `#delete-sessions ul`, not the commits' list (`work-item-menu.test.ts:968-978`). The sealer reads each acceptance row against the case it names, and this row and its case disagree.

The fix's frame is round 2's finding, which names the kept session lists as the class and leaves `#delete-loss` outside it. The fix pass built the case on the list of sessions, as that finding asked. The fold's row then put the commits' list in place of it.

The search printed four lines. Line 84 and line 86 are the redraw rows, which read the commits' list while the dialog stays open and hold. `trail/phases/phase-3.md:12` is about the shots. Only line 85 speaks of an opening. The fix rewrites that row in place:

```markdown
| A kept list at an opening | Given the delete dialog with its list of sessions scrolled past its top. When the person closes the dialog and opens it again with the same sessions. Then the list of sessions is the same element and its `scrollTop` is 0. | The long-list delete case of `work-item-menu.test.ts` makes `#delete-sessions ul` scroll by a style, closes the dialog and opens it again after its redraw. Shown red against `19d1bf8c`'s `renderer.ts` (contract rule 15). |
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: `opened` sets `scrollTop` to 0 on every `ul` of the dialog after `showModal()` (`apps/desktop/src/renderer/renderer.ts:418-420`), so a kept list does not open at the scroll the last opening left. It leaves every kept element kept, so *Scope* items 6 to 8 hold as they stand. Each session dialog opens through it: `openRemove` (`renderer.ts:1230`), `openDelete` (`:1316`), `archive` (`:1486`) and `openDaemonEnding` (`:1517`). Each of them draws only after `opened` returns, so the reset comes before the draw that keeps the list, and the draw leaves the list at its top. The class of round 2's finding, `#delete-sessions`, `#daemon-sessions`, `#sessions-list`, `#remove-sessions` and `#remove-work-items ul`, is covered while each list is shown at the opening. The new reads of the long-list delete case (`apps/desktop/test/work-item-menu.test.ts:967-979`) follow round 2's steps. They read that the list is the kept element and that its `scrollTop` is 0 after the dialog is opened again. Its title names the read. This round ran the fix pass's mutant again (executed, `## Probes`). With the loop deleted, the case failed at `test/work-item-menu.test.ts:978:111`, "expected [ true, 4 ] to deeply equal [ true, +0 ]". That is the same element at the scroll the last opening left, the guard the read names. The six cases after it failed because the dialog stayed open over the window. So the claim of the close holds: the read is red without the reset and green with it.

What matched: the reset changes nothing a dialog outside this work's frame relies on (read, and executed where marked). The other dialogs `opened` shows are the settings, account, icon, group, reverse, records and Machine dialogs (`renderer.ts:813`, `:863`, `:1084`, `:1115`, `:1131`, `:1422`, `:2235`). The first five hold no `ul` in the markup (`index.html:869-960`, `:1069-1083`) and build none. The records dialog replaces its `ul` with a new one at each draw (`renderer.ts:1356`). `openMachine` empties the caps' place and builds its lists anew (`apps/desktop/src/renderer/machine.ts:162-169`). So the loop finds no list there that keeps a scroll. `git grep -n "scrollTop\|scrollIntoView\|scrollTo("` over `apps/desktop/src` printed only the reset and the sidebar's `scrollIntoView` (`list.ts:232`), and over `apps/desktop/test` only the delete and removal cases of `work-item-menu.test.ts` and the screenshot run's `#view-scroll` (executed). No code writes a dialog list's scroll that the reset could undo, and no case reads one. Each opener's `focus()` call targets a field, a menu or a Cancel button, never an element in a list (`renderer.ts:868`, `:1119`, `:1135`, `:1237`, `:1319`, `:1431`, `:1489`, `:1520`). This answers the `gaps.md` row at line 14 by reading. Its sentence holds: `opened` resets the lists of every dialog it shows, and only the delete case reads it.

What matched: `bd3d92e3`'s comment of `drawnFrom` (`renderer.ts:475`) says a part is kept across a close and an opening, so `opened` starts every list at its top, which the code does (read). The sentence added to the row "The delete dialog" says "Each opening of the dialog starts every list at its top." in `docs/design.md:458`, and `docs/design.ko.md:458` says the same, "대화 상자를 열 때마다 모든 목록은 맨 위에서 시작합니다." (read). *Data & interfaces* quotes the English row word for word (`frame/design.md:146`), and *Scope* item 9 now lists item 8a (read).

What matched: the new reads against their group. No other case of `work-item-menu.test.ts` or of the other built-app files closes a dialog and reads a list's scroll at its next opening. The reads extend the long-list delete case, which already keeps `#delete-sessions ul` in `window.__kept`, so they duplicate nothing (read).

## Not judged

| What | Location | Who answers |
|---|---|---|
| A list hidden at the moment of an opening is not reset, since it has no box. Then the draw shows it and Chromium may give back an older scroll. Of this work's lists, only `#remove-work-items ul` can be kept and hidden at once. That happens where the repository's work items all left while its dialog stood open and its list was scrolled, and the next opening names more than ten work items. This round did not probe the sequence. The code comment at `renderer.ts:419` names the condition, "once the dialog shows and the list has a box to scroll" | `apps/desktop/src/renderer/renderer.ts:420`, `:1160-1166` | the orchestrator, where it judges the sequence worth a case |
| Whether the tooltip under the pointer stays open on the screen across an `inbox`. Round 1's row, carried (`gaps.md` *Not verified*, fourth row). The fix diff changes nothing of it | `apps/desktop/test/work-item-menu.test.ts:957-961` | the orchestrator, by a look at the built app where it judges one worth it |
| How far the delete dialog of the shots stands from the browser's bound for a modal dialog. Round 1's row, carried (`gaps.md` *Not verified*, sixth row). The fix diff changes nothing of it | `seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll/screenshots/desk-light-delete.png` | the orchestrator |
| The fix pass's runs this round did not repeat: its red run of the new case against `19d1bf8c`'s `renderer.ts`, and `npx tsc --noEmit -p .` before each commit. Only the mutant run of `## Probes` was taken again | `apps/desktop` | the orchestrator's broad run |
| The full suite, the typecheck and the broad gate at the target, which no agent runs (contract rule 2). The suite stands `unverified` | the repository | the orchestrator's broad run |

## Probes

| Command | Result |
|---|---|
| `seal mutate src/renderer/renderer.ts --replace '  for (const list of of.dialog.querySelectorAll<HTMLElement>("ul")) list.scrollTop = 0;' '' --tests "node scripts/test-in-electron.mjs test/work-item-menu.test.ts" --timeout 1200`, in `apps/desktop` at the target with `OWLERY_BACKGROUND=1`, through the machine's lock, after `pnpm install --frozen-lockfile --offline` in the clone (exit 0) | exit 0, `red` (120.6 s), the verdict over a baseline that passed. Against the mutant 7 cases failed and 24 passed. The first failure is the long-list delete case at `test/work-item-menu.test.ts:978:111`, "expected [ true, 4 ] to deeply equal [ true, +0 ]"; the six removal and group cases after it failed on "the window never showed a menu". `git status --short` then listed only this record, and `git diff --stat` printed nothing |
