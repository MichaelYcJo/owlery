# Review round 2: 1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll

```seal
target: 19d1bf8c, fixes 8a1be1de..19d1bf8c
```

This round verifies round 1's fix pass. It reviewed the diff `8a1be1de..19d1bf8c` against `release/v0.0.5` at `9f9ba1da`, in a `git clone --no-local` of the repository made under the round's scratch directory and checked out at `19d1bf8c`. The diff holds three commits: `2b07765a` changes one line of `apps/desktop/test/work-item-menu.test.ts`, `554fec1f` changes one line of `trail/phases/phase-1.md`, and `19d1bf8c` appends the two close blocks to `trail/rounds/round-1.md`. No file of the app changed. `seal/parity.json` is not declared, `seal/config.json` has no `Pact` key, and `Record language` and `Commit and pull request language` are both English, so no `pr.<lang>.md` is owed.

The records read whole at `19d1bf8c`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` to `phase-3.md`, and `trail/rounds/round-1.md`. Only `phase-1.md:17` and `round-1.md` changed since round 1 read them at `f0118a3e`. Against the target, no sentence of them is contradicted that round 1 did not already weigh, and `frame/design.md:80` now matches the case it names.

Carried from round 1 and not re-established: where the session dialogs draw (`drawSessions`, `apps/desktop/src/renderer/renderer.ts:525-541`), the four `show…` functions that call it, and the readers of the session containers that round 1's `git grep` listed. Each was opened at the target to place this round's reads, and each stands at the line round 1 names. Every verdict below is this round's own.

## Findings

### 1. A list a dialog keeps opens again scrolled where the last opening left it, so the first names stand above the fold with no sign

```seal
severity: should
location: `apps/desktop/src/renderer/renderer.ts:413-420`, `apps/desktop/test/work-item-menu.test.ts:967`
evidence: executed the probe of `## Probes`, `node scripts/test-in-electron.mjs test/test_tmp_reopen_scroll.test.ts` in `apps/desktop`; read `apps/desktop/src/renderer/renderer.ts:413-420`, `:474-482`, `:525-541`, `:1152-1165`, `:1227-1236`, `:1288-1296`, `:1313-1318`, `:1476-1490`, `:1514-1519`, `docs/design.md:458`, `docs/product.md:170`
```

Why it matters: this takes up round 1's *Not judged* row on a kept session list. `drawnFrom` (`renderer.ts:474`) is a module-level `WeakMap`, and no opening clears it. `opened` (`renderer.ts:413-420`) forgets the dialog's request and shows it, and nothing else. So the first draw of an opening compares against the values the last opening drew from. Where they are the same, `drawWhereChanged` (`renderer.ts:477-482`) returns early and the list is the element the last opening left. The code alone does not settle what such a list shows, since a closed dialog has no layout box and Chromium decides what happens to its scroll. The probe settled it. In the dialog that asks before the daemon ends, it made `#daemon-sessions ul` scroll by a style, set its `scrollTop` to 4, pressed Cancel and chose "Restart Daemon…" again. The list was the same element, and its `scrollTop` read 0 while closed and 4 again after the open, and still 4 after 300 ms. Chromium keeps a box's scroll offset across `display: none` and gives it back.

The class, listed by its cause, which is every list an opening leaves as the element the last opening left:

- `#delete-sessions` and `#daemon-sessions`, through `drawSessions`, wherever the sessions' lines are the ones the last opening named. These are new with this work: at `9f9ba1da`, `showDelete` and `showDaemonEnding` drew each through `namedLines`, a new `ul` at every draw, so each opening started them at their top (`frame/design.md:32`).
- `#sessions-list` and `#remove-sessions`, through `drawSessions`, and `#remove-work-items ul` (`renderer.ts:1164`), wherever the lines are the ones the last opening named. These are older than this work. At `9f9ba1da` each was a `ul` of the markup whose rows a draw replaced (`showRemove`'s `list` and `showArchive`, `renderer.ts:1122-1135` and `:1433-1443` there), so each likely kept its scroll across an opening already. This round did not probe them at `9f9ba1da`.
- Not in the class: `#delete-loss`, which `readDeleteLoss` sets to `null` at each opening (`renderer.ts:1288-1296`), and `#remove-losses`, which `openRemove` draws from `[]` with the choice to delete cleared (`renderer.ts:1227-1236`).

So the finding is this work's for the delete dialog and the dialog that asks before the daemon ends, and the fix below covers the older three with them, since they share the cause.

A list scrolls only past `--said-height`, 260px (`index.html:51`, `:566`), so the case is a list of more than about ten lines: the sessions of one work item in the delete dialog, or every session the window holds in the dialog that asks before the daemon ends. There the dialog that names what an act ends opens on lines from the middle. Under macOS's default scroll bar setting a list likely shows no scroll bar until it scrolls, so the names above give no sign that they stand there. This round did not look at the built app's window for it. `docs/product.md:170` lets a forced delete run "only after the person has read each by name". The row `docs/design.md:458` keeps a list's scroll "While the dialog is open", and says nothing of an opening. `openRemove` says "no loss is held from the one before" (`renderer.ts:1230`). Each of the four session dialogs opens through `opened`: `archive` (`renderer.ts:1484`), `openDaemonEnding` (`:1515`), `openDelete` (`:1314`) and `openRemove` (`:1228`). So the kept scroll across an opening is behaviour no document asked for, and it works against the rule the frame grounds #251 on (`frame/design.md:12`). The defect is in `drawSessions`'s draw through `drawWhereChanged`, which phase 2 made, so this finding takes neither a `regression:` nor a `reopens:` line.

The fix starts each list of a dialog at its top at each opening, in `opened`. It leaves the kept elements kept, so the frame's *Scope* items 6 to 8 hold as they are. Precondition: `showModal()` has run, so each list has a box and the write to `scrollTop` takes. This round did not run the snippet.

```ts
function opened(of: Asking): boolean {
  if (dialogOpen()) return false;
  forget(of.dialog);
  of.error.textContent = "";
  of.button.disabled = false;
  of.dialog.showModal();
  // A list a draw keeps is the element the last opening left, and Chromium gives it back the scroll it had then. So each opening starts every list at its top.
  for (const list of of.dialog.querySelectorAll<HTMLElement>("ul")) list.scrollTop = 0;
  return true;
}
```

The case belongs in the long list's case of `work-item-menu.test.ts`, the one that already keeps `#delete-sessions ul` in `window.__kept`, before its `await app.click("#delete-cancel")` at line 967, in the form the probe took. It makes `#delete-sessions ul` scroll by an inline `max-height`, sets its `scrollTop` past 0, cancels, opens the dialog again as that case first opened it (`rightPress(line(SIDEBAR, id))`, `menuShown()`, `pressItem("Delete")`, `menuGone()`, `dialogOpen("delete-dialog")`, lines 930-935), reads `scrollTop` 0, takes the style off and cancels. The fix pass shows it red against `19d1bf8c`'s `renderer.ts`, where the probe read the kept scroll (contract rule 15). The sentence of the row `docs/design.md:458` and `docs/design.ko.md:458` on the kept lists can then name the opening as well, in both editions, where the fix pass judges a reader needs it (contract rule 14).

## Confirmations

```seal
confirms: round-1#1
```
What holds: `work-item-menu.test.ts:891` now reads each section of `#delete-sessions` with its head and lines and expects `[["Running sessions that end", ["Shell"]]]`. That is the line round 1 wrote, and it is what the row "No waiting session" of `frame/design.md:80` asks the delete case to read. The fix pass's claim that the line fails on round 1's mutant was run again (executed, `## Probes`). The baseline passed and the mutant read `red`. The first case to fail was the delete case, at `test/work-item-menu.test.ts:891:238`, which received a second section, "Sessions waiting for the machine that leave the queue" with no line, after `["Running sessions that end", ["Shell"]]`. The seven cases after it in the file failed on a menu or a form that never showed, as the dialog stayed open over the window. `daemon-restart.test.ts` passed. In round 1 the same mutant survived both files, so the line is what catches it. The class the close names, every session dialog through `drawSessions`, is the class round 1 named. The new line was read as code: it reads the `section` elements `drawSessions` builds, each with one `h3` (`renderer.ts:533-538`), so `querySelector("h3")` finds a head in each. The test's group is the delete case itself, and the line replaces a weaker read of the same list, so it duplicates no case.

```seal
confirms: round-1#2
```
What holds: `trail/phases/phase-1.md:17` now says the Korean edition renders "for a session that has not started" as "아직 시작하지 않은 세션을 담는", and names the state by no other word. `docs/design.ko.md:458` says exactly that, and names the queue's section only by its English head (read). `git grep -n -c '기계를 기다리' -- docs` printed `docs/design.ko.md:1`, the Machine dialog's row at line 457, and `git grep -n -F '기계를 기다리' -- seal` printed only round 1's own finding (executed).

What matched, and what did not, in the fix pass's account of round 1's grounds: the close says round 1's sentence that `docs/architecture.ko.md:469` uses "컴퓨터를 기다리는" does not hold, since `git grep -n -c '컴퓨터를 기다리' -- docs` prints nothing and line 469 says "대기열에서 기다리고". The search result holds (executed: it printed nothing, exit 1). The conclusion holds only of the spelling. Line 469 ends with "작업의 줄은 컴퓨터를 기다린다는 것과 대기열에서의 순서를 말하고", which uses the same verb for the same queue in another ending. The syllable "린" is not "리" followed by a final consonant in the text, so a search for "컴퓨터를 기다리" does not find "컴퓨터를 기다린다". So round 1's grounds hold in substance: the policy root names the queue by "컴퓨터를 기다리다", and the frame's Korean `to` texts take that word. Round 1 quoted the frame's ending rather than the line's. Both parties agree it changes nothing of the fix, and no party acts on the sentence, so this is no finding.

What matched: the fix pass's read of the records. Its close says `git diff 71d30d5e HEAD` over `routing.md`, the frame files, `gaps.md` and `changelog.md` printed one changed line, the Status of Q3. This round read those files whole at the target, not through that diff, and found the Status of Q3 answered and no other sentence the fix commits make false (read).

No case the fix diff adds holds a fact the frame states beyond the one line of finding 1's close, so no test gap is named outside `## Findings`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the tooltip under the pointer stays open on the screen across an `inbox`. Round 1's row, carried: the cases read that the row is the same element, and Chromium draws the tooltip (`gaps.md` *Not verified*, fourth row). The fix diff changes nothing of it | `apps/desktop/test/work-item-menu.test.ts:957-961` | the orchestrator, by a look at the built app where it judges one worth it |
| How far the delete dialog of the shots stands from the browser's bound for a modal dialog. Round 1's row, carried (`gaps.md` *Not verified*, sixth row). The fix diff changes nothing of it | `seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll/screenshots/desk-light-delete.png` | the orchestrator |
| The fix pass's runs this round did not repeat: its baseline of `work-item-menu.test.ts` and `themes.test.ts` at `554fec1f`, and `npx tsc --noEmit -p .` before its commit. Only the mutant run of `## Probes` was taken again | `apps/desktop` | the orchestrator's broad run |
| The full suite, the typecheck and the broad gate at the target, which no agent runs (contract rule 2). The suite stands `unverified` | the repository | the orchestrator's broad run |

## Probes

| Command | Result |
|---|---|
| `seal mutate src/renderer/renderer.ts --replace "  const sections = sessionSections(named);" "  const sections = [...sessionSections(named), ...(sessionSections(named).length === 0 ? [] : [{ caption: \"Sessions waiting for the machine that leave the queue\", lines: [] as string[] }])];" --tests "node scripts/test-in-electron.mjs test/work-item-menu.test.ts test/daemon-restart.test.ts" --timeout 900`, in `apps/desktop` with `OWLERY_BACKGROUND=1`: round 1's mutant, written again from its `## Probes` row | exit 0, `red` (134.9 s): the baseline passed, and against the mutant 8 cases failed and 27 passed. The first failure is `test/work-item-menu.test.ts:891:238`, two sections received for one; the seven after it failed on a menu or a form that never showed. `daemon-restart.test.ts` passed. `git status --short` then listed only this round's probe file and record |
| `node scripts/test-in-electron.mjs test/test_tmp_reopen_scroll.test.ts`, in `apps/desktop` with `OWLERY_BACKGROUND=1`. The probe starts the built app with a receiver pane, opens the dialog of "Restart Daemon…", gives `#daemon-sessions .named` a `max-height` of 6px, sets the list's `scrollTop` to 4, presses Cancel and chooses the entry again | exit 0, 1 case passed. Before the close: one line, `scrollHeight` 28, `clientHeight` 6, `scrollTop` 4. While closed: the same element, `scrollTop` 0. After the open: the same element, `scrollTop` 4, and 4 again 300 ms later |
