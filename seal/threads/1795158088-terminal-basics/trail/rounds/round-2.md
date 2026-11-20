# Review round 2: 1795158088-terminal-basics

```seal
target: 4e8d8c1 against release/v0.0.1
```

This round reads the range `7532ada..4e8d8c1`. It holds three things: the fix pass of round 1 (`597307b`, `f29df97`, closed at `20cb67b`), phase 2 (`f76e3e8` to `0296239`, recorded in `trail/phases/phase-2.md`), and the orchestrator's fold at `4e8d8c1`. The branch has not merged the newer release branch, so the code was read against the merge base `85c381a`. Phase 2 is a build phase, so its units were reviewed as new code on every axis, and round 1's finding was answered as a verifying round answers it.

The records read whole at `4e8d8c1`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md`, `trail/phases/phase-2.md` and `trail/rounds/round-1.md`. `pr.md` does not stand yet. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed.

Facts carried from round 1 and not established again: where `renderer.ts` registers `onCommandKey` on the capture phase, what `closePane` and `closeFront` are for, and that the role defaults of Electron 45.3.3 are compiled into its framework binary. Each verdict below was reached again at `4e8d8c1`.

The axes walked were the table's ten and four of this change's own. The first is what a terminal hands the pane's process for a paste, with brackets and without them. The second is which element of the page sees a drag, and what Blink does with a drop the page did not stop. The third is the key events xterm hands a custom key handler for one press. The fourth is who runs the program `OWLERY_OPENER` names, and with what environment.

## Findings

### 1. The records give the guard on navigation as what stops a drop's navigation, and no run has made a drop ask to navigate

```seal
severity: should
location: `seal/threads/1795158088-terminal-basics/gaps.md:25`, `apps/desktop/src/renderer/work-item-view.ts:110-112`
evidence: read `apps/desktop/src/renderer/work-item-view.ts:110-112`, `apps/desktop/src/main/main.ts:45-55`, `seal/threads/1795158088-terminal-basics/gaps.md:25`, `seal/threads/1795158088-terminal-basics/trail/phases/phase-2.md:80`, `seal/threads/1795158088-terminal-basics/frame/design.md:26`; executed `node scripts/test-in-electron.mjs test/test_tmp_drop_navigation.test.ts` in a clone at `4e8d8c1` with `navigateOnDragDrop: true` added to `main.ts#createWindow`
```

Why it matters: `a528498` took the `preventDefault` of a drop out. The grounds `gaps.md:25` gives are two: "Electron goes to no dropped file by default, and the guard of *Scope* item 1 refuses the navigation where it would." The comment at `work-item-view.ts:111-112` gives only the second: "the window goes nowhere a dropped file would take it (src/main/main.ts, the guard on navigation)." Phase 1 saw the guard refuse a navigation the page asks for with `location.href` (`phase-1.md` *What was seen red*, scenario 1). No run of either phase made a drop ask to navigate. By contract rule 13, a defence that rests on a platform guarantee is not verified until the guarantee is removed. The guarantee here is `webPreferences.navigateOnDragDrop`, `false` by default (`frame/design.md:26`), which `main.ts:45-50` leaves unset.

This round removed that guarantee in a clone: it set the option to `true` and dropped a file on a pane and on the view's header through the debugging port. The window stayed on its page both times. The pane received its path between the brackets of a paste. A second listener on `will-navigate`, added through the main process's inspector, noted no navigation. So in this harness the drop asks for no navigation even with the option on, and the run cannot tell the guard from anything else. The probe also had no positive control of its listener. What the code does is right by reading: Blink starts a navigation for a dropped file only where the option is on. The defect is in the account. The sealer and the next editor of `takesDrops` read that the guard was the reason the line could go, and nobody saw the guard act on a drop.

The paste-ready fix rewrites the two sentences and adds a row to *Not verified*. `changelog.md:11`, the `to` lines of `frame/design.md` *Rule changes* and the comment at `main.ts:52` state the outcome, that nothing dropped on the window replaces it. That outcome holds by Electron's default, so they need no change. Keeping the `preventDefault` would be the other fix: the page would then stop the drop's default itself, whatever Electron's default. The probe shows that no case of this harness could see that line either, so this record does not ask for it.

`apps/desktop/src/renderer/work-item-view.ts`, lines 110 to 112:

```ts
 * that carries no file is not taken, and neither is a drop anywhere else in
 * the window. The drop's own default is left alone: Electron starts no
 * navigation for a dropped file while `navigateOnDragDrop` is false, its
 * default, which src/main/main.ts does not change.
```

`gaps.md`, the bullet at line 25:

```md
- **The drop's own default is not stopped, and the drag shows no cursor the window chose.** A mutant that left the default in place passed every case, the one that reads the window's page after a drop among them. Electron starts no navigation for a dropped file while `webPreferences.navigateOnDragDrop` is `false`, its default, and `main.ts#createWindow` does not set it. That the guard of *Scope* item 1 would refuse such a navigation was read and not run: review round 2 set the option to `true` in a clone, and a drop through the debugging port then asked for no navigation at all, so no run has shown the guard acting on a drop. A line no case can see was not kept. The cursor a drag shows over a pane is the system's choice, and no case reads a cursor.
```

`gaps.md` *Not verified*, a row after the row on the Control key:

```md
| That the guard on `will-navigate` refuses a navigation a drop starts, where `navigateOnDragDrop` is no longer `false`. Review round 2 set the option to `true` in a clone: a drop on a pane and on the view's header left the window on its page, and a second listener on `will-navigate` noted no navigation, so the guard was never asked | The change that sets `webPreferences` in `main.ts#createWindow` or moves Electron's version |
```

```seal
verdict: fixed de70c50
answer: The finding holds. `phase-1.md` *What was seen red* scenario 1 saw the guard refuse a navigation the page asks for, and no run of either phase made a drop ask for one, so the two sentences named a ground nobody saw act. The paste-ready comment was read against `main.ts#createWindow`, which sets no `navigateOnDragDrop`, and against `electron.d.ts:20447-20450`, which gives the option's default as `false`; `de70c50` applies it at `work-item-view.ts:111-113` as written. The two `gaps.md` texts are in the pass's own words, because the paste-ready ones restate this record's probe and `gaps.md` now cites it instead. The bullet of *Not done* names Electron's default as the ground and says the guard is not it, and the new row of *Not verified*, after the row on the Control key, cites this finding for the one run with the option on. The row's answerer names `navigateOnDragDrop` where the paste-ready row named `webPreferences`. The probe was not rebuilt and no app was started: the pass typechecked `work-item-view.ts` and ran `test/themes.test.ts`, which reads the module's text, at `de70c50` (exit 0, 8 cases). The comment at `main.ts:52`, `changelog.md:11` and the `to` lines of `frame/design.md` *Rule changes* state the outcome and stand, as this record says. `17ed584` after it marks the two rows of *Not verified* this round read as closed and adds the pass's run to the first row.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: the case at `apps/desktop/test/terminal-basics.test.ts:279-298` opens two Claude Code panes. It reads the tabs as `["Shell", "Claude Code 1", "Claude Code 2"]` (`:287`) and the sentence as "Claude Code 2 is working. Closing the pane ends its session." (`:291`). Under either mutant round 1 named, the sentence at `work-item-view.ts:335` reads "Claude Code is working.": with `[session]` in place of `paneTabs(...)`, `tabLabel` sees one pane of the kind, and the kind's label is "Claude Code". So `:291` fails under both, and the fix pass's account of the red holds by reading. Round 1's search, run again at `4e8d8c1`, lists the sentence and two assertions on it, `:246` and `:291` (executed). The case still ends with the first shell pane as the one tab, in front, with the keyboard (`:296-297`), which phase 2's cases rely on (`:300`). `f29df97` names the two mutants in `phase-1.md:74` and says under the table (`:76`) that the phase's own mutant left no text. That is what round 1 asked for (read).

What matched: the rows of `gaps.md` *Not verified* at lines 15 and 16, whose answerer is this round. Both hold at `4e8d8c1` by reading, so they can be marked `closed` by the party that edits `gaps.md`. `renderer.ts:122-124` reads every `dialog[open]`, and `onKey` hands that read to `inboxKey` at `:149`. `onCommandKey` (`:127-135`) calls `preventDefault` and `stopPropagation` for every key `commandKey` returns, and it is registered on the document's capture phase (`:408`). Phase 2's key handler (`work-item-view.ts:175-181`) runs inside xterm's listener on its helper textarea, below the document, so Command+W still never reaches it, and neither does any terminal.

What matched: phase 1's mutation table of the built app, which phase 2 says came from batches whose red names no case (`phase-2.md:83`). Read against the cases at `4e8d8c1`, each of those mutants has an assertion that fails under it. No guard: `terminal-basics.test.ts:185`. A guard that refuses every navigation: the wait at `:190`. A handler that allows a hidden window: `:172`. No menu: `:159`. `dialogOpen` reading the form alone: `:263`. W doing nothing: the wait at `:229`. The dialog's buttons swapped: `:247`. `closeFront` doing nothing: `:229`. `closePane` never asking: the wait at `:245`. "Close pane" sending nothing: the wait at `:273`. No close of the dialog for a pane that is gone: `:294`. No keyboard after the dialog: `:255`, where the "×" that opened the dialog would keep the focus. `front` kept as the view is left: `:205`. "×" doing nothing: the wait at `:217`. A batch's red that names no case therefore leaves no mutant of that table with nothing to fail on. That is a reading, and no mutant was run this round (read).

What matched: *Scope* items 2 to 5 against the code. `droppedText` (`view.ts:553-558`) escapes exactly the ASCII characters *Scope* item 2 names, leaves the rest as they are, drops an empty path and a path with a code below 32 or 127, and puts one space after each path. `takesDrops` (`work-item-view.ts:114-125`) answers a drag only where it carries files, reads each path through `window.owlery.pathOf`, gives the terminal the keyboard and hands it the text as `term.paste`, and sends nothing for an empty text. `paneKey` (`view.ts:568-571`) and the handler at `work-item-view.ts:175-181` send `\n` through `term.input` at the `keydown` alone and stop every event of the press, so the byte goes the way `term.onData` sends a typed key. `openLink` and `chooseOpener` (`links.ts:16-35`) and `takeOpener` (`:42-46`) do what *Scope* items 3 and 4 say, and `main.ts:25-30` takes the variable out of the environment at load, before the daemon is started. The walk from *Data & interfaces* to the code found every name it lists: `Channel.openLink`, `OwleryApi.openLink` and `pathOf` (`ipc.ts:15`, `:38-40`), the preload's two entries (`preload.ts:28-29`), the three functions and the type `Opener` of `links.ts`, the four functions of `view.ts`, `initView`'s second argument, and the pinned `@xterm/addon-web-links` 0.12.0 with its lock entries. `src/shared/protocol.ts` and `src/daemon/` do not change from `85c381a` (executed: `git diff --stat 85c381a 4e8d8c1` over both printed nothing). Nothing the reference leaves out is sent (read).

What matched: the fold at `4e8d8c1`. The paragraph above the scenario table now says what `test/fixtures/basics-shell.sh:30` prints. Scenario 3's row names the brackets that `terminal-basics.test.ts:375` reads. *Data & interfaces* names `Opener`, `takesDrops` and `initView`'s argument as the code has them. `frame/questions.md` Q2 is answered (a), which scenario 3's case carries out. The departures `phase-2.md` names under *Departures from the frame* need no other sentence of the frame changed (read).

What matched: `changelog.md`, each item against the target. One sentence rests on documentation and not on a run: "Claude Code reads it as a line break in the prompt". It stands on `frame/design.md` *What the tree and the installed versions answer*, the row that quotes Claude Code's documentation on Ctrl+J. `gaps.md:11` keeps the measurement for the owner. Every other sentence matches the code read above and phase 1's code that round 1 read (read).

What matched: phase 2's counts. 33 cases of `droppedText` stand in `view.test.ts`: one of safe characters, 23 escaped characters, one in Korean, one of two paths, six control characters and one of no path. The crafter's captured outputs say the boundary run passed 7 files with 340 cases and one skipped, `terminal-basics.test.ts` alone 17, and `korean-input.test.ts` alone 32 with one skipped. Those are the numbers `phase-2.md:91-92` gives (read).

What matched: the unexplained run of `gaps.md:14`. Its output, `wiv-d/run-6.txt` in phase 2's scratch directory, shows the mutant's own red at `terminal-basics.test.ts:377`, and the two-file case passing though the mutant gives the dropped pane no keyboard. It also shows the opener's file holding the named link's address and then the printed one before `:435`. No call of the cases before `:433` sends a mouse event with a modifier: `app.click` sends none, and `drop` sends drag events alone. A press inside the left tile with the Command key held would give that pane the keyboard and open both links, which is the person's click the row names. This reading cannot say whether a person clicked, so the row stays with its answerer (read).

The suite's label is honest. `gaps.md:7` names the suite, the typecheck and the `Broad gate` command of `seal/config.json` as the orchestrator's. It adds that the new dependency's effect lies outside the files a phase runs. This round ran none of the three, and ran no test file of the suite. Once finding 1 is closed, what comes due is a verifying round over the fix pass. The orchestrator's broad run and the sealer come after it.

The chain check run over this worktree printed no notice at `frame/design.md`: `apps/desktop/test/links.test.ts`, which round 1 found missing from the two check lines, now stands.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a held Command+W should close one pane or several, carried from round 1 unchanged: `onCommandKey` acts on every `keydown`, the key's auto-repeat among them | `apps/desktop/src/renderer/renderer.ts:127-135` | The owner, at the hand run of `frame/questions.md` Q4 |
| What opened two addresses and moved the keyboard in one mutant run of phase 2 | `seal/threads/1795158088-terminal-basics/gaps.md:14` | The owner, as that row names |
| A person's drag from Finder, Command+V, and Command+W through the system's menu | `seal/threads/1795158088-terminal-basics/gaps.md:8`, `seal/threads/1795158088-terminal-basics/gaps.md:10` | The owner's hand run, as those rows name |
| Whether Claude Code reads `0a` as a line break and a path escaped with backslashes as an image | `seal/threads/1795158088-terminal-basics/gaps.md:11` | The owner's hand run with a logged-in `claude`, as that row names |
| The suite, the typecheck and the broad gate at the head of the branch | `seal/threads/1795158088-terminal-basics/gaps.md:7` | The orchestrator, in the broad run after the review rounds settle |

## Probes

The probe ran in a `git clone --no-local` of the worktree at `4e8d8c1`, under this round's scratch directory, after `pnpm install --frozen-lockfile` there. It made one start of the app per run, through `BuiltApp.start` with `OWLERY_BACKGROUND=1` and `OWLERY_OPENER` naming a program in the run's temporary folder. It ran twice: the first run passed, and vitest printed nothing the probe logged, so the second run wrote what it saw to a file. No process of either run was left (executed: `ps` listed none).

| Command | Result |
|---|---|
| `git grep -n "is working. Closing" 4e8d8c1 -- apps` | Three lines: the sentence at `work-item-view.ts:335` and the assertions at `terminal-basics.test.ts:246` and `:291` |
| `git diff --stat 85c381a 4e8d8c1 -- apps/desktop/src/daemon apps/desktop/src/shared/protocol.ts` | Nothing printed |
| `node scripts/test-in-electron.mjs test/test_tmp_drop_navigation.test.ts`, in the clone with `navigateOnDragDrop: true` added to `main.ts#createWindow`, first run | Exit 0, 1 case passed: after a drop on the pane and a drop on `#view-title`, `location.href` was the page's own |
| The same, second run, writing what it saw to a file | Exit 0. The pane received `ESC[200~` with the dropped file's path and one space, then `ESC[201~`. After each drop `location.href` and the one page the debugging port listed were the page's own, and the listener on `will-navigate` had noted nothing. The opener's file did not exist |
| `python3 skills/code-review/scripts/chain_check.py --baseline 85c381a --root <the worktree> --worktree`, before the record was written | Exit 0, with no notice at `frame/design.md` |
