# Review round 7: 1795152521-work-item-menu

```seal
target: dc715b7 against release/v0.0.1
```

The round reads the range `16f8b1a..dc715b7`. It holds two commits. The first is the orchestrator's `pr.md`, `7630c4b`. The second is the merge `dc715b7`, whose second parent is `5413f0b`, the terminal basics work of issue #95 (pull request #103) on `release/v0.0.1`. The merge base of the two parents is `02dea83`. The merge was read through `git show --remerge-diff dc715b7`, which names seven files in conflict: `src/main/main.ts`, `src/preload/preload.ts`, `src/shared/ipc.ts`, `src/renderer/index.html`, `src/renderer/renderer.ts`, `src/renderer/view.ts` and `test/view.test.ts`, each under `apps/desktop`. One more file differs from what git would have merged by itself, `src/main/openers.ts`. `seal/parity.json` does not exist, so no comparison with an original was owed.

Read whole at `dc715b7`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/rounds/round-6.md`. No `pr.<lang>.md` stands, and `Commit and pull request language` is English. The phases and rounds 1 to 5 were read for their coordinates alone. `git diff --stat 16f8b1a dc715b7 -- seal/threads/1795152521-work-item-menu` prints `pr.md` alone. Round 6's close `c43a2e6` stands before the range, and this round answers it under `## Confirmations`.

Carried from earlier rounds and not searched again: where a folder's repository is read (round 4), and the order of `Daemon#deleteOne`'s steps (round 5). The claim that the renderer writes no HTML from data was searched again, because the merge brings #95's pane menu and link card into the page. `git grep -n -e innerHTML -e insertAdjacentHTML -e outerHTML -- apps/desktop/src/renderer` printed no line.

**Did either side lose anything in the merge?** A script read each line that either parent added since `02dea83` and looked for it in `dc715b7`, and each line either parent removed and looked for it there too (`## Probes`). The only lines it reported are the ones the conflicts replaced: the two `dialogOpen` functions, the two docstrings of `commandKey` and `inboxKey`, the two header comments of `ipc.ts` and `main.ts`, #93's `Writes a text to the system's clipboard.` on `OwleryApi#copyText`, #93's handler of `Channel.copyText`, and #95's box rule for `#work-item-dialog, #close-pane-dialog`. Its other reports are lines that moved inside a file (`test/built-app.ts`, `src/daemon/daemon.ts`). In each conflicted file, each side's entries stand in the merge:

- Channels: `installedApps`, `openFolder` and `trashFolder` from #93 sit beside `openLink`, `pathsOf`, `showInFinder`, `copyText`, `clipboardText` and `pathOf` from #95, in `ipc.ts`, `preload.ts` and `main.ts#app.whenReady`.
- `index.html`: #93's eight dialogs come before #95's `close-pane-dialog` and `link-card`.
- `view.test.ts`: the imports `lossSections`, `pinnedFirst`, `linkCard`, `linkClick`, `LinkTarget`, `pathCandidates` and `pathTarget` are all kept. The W case and #93's case "reads no key while a dialog is open, while a menu is open, …" both stand (`apps/desktop/test/view.test.ts:1784-1804`). The body of #95's case of that name had no assertion that #93's body lacks.

The daemon's auto-merged `case "forget"` (`apps/desktop/src/daemon/daemon.ts:617`) stands beside `archiveWorkItem` and `deleteWorkItem`. `keyHints` keeps the menu's key (`apps/desktop/src/renderer/view.ts`, `keyHints`). Read and executed.

**The edit beyond the conflicts.** The orchestrator's merge message says a background start now writes the app's own clipboard at a menu's Copy. The round found that this holds. `apps/desktop/src/main/main.ts:149` hands `copyText` the writer `held.writeText`. `held` is `chooseClipboard(background, clipboard)` (`:57`), which writes a text of its own in a background start (`apps/desktop/src/main/clipboard.ts:19-28`). `openers.ts#copyText` is now `async` and awaits the writer (`apps/desktop/src/main/openers.ts:86-88`). The two cases of `copyText` in `apps/desktop/test/openers.test.ts:125-139` call it without `await`. They still hold what they say, because the writer runs before the function's first `await`. `held.writeText` drops what is no text as `copyText` does, so the filter runs twice. That costs nothing a person meets. The handler is run end to end by `test/terminal-basics.test.ts:951-959`, which writes through `window.owlery.copyText` and reads the text back in a background start. That file passed in this round.

**The keys.** The merge kept #95's `dialogOpen`, which reads `dialog[open], [role="menu"]` (`apps/desktop/src/renderer/renderer.ts:247-249`). #93's `menuOpen()` is still passed beside it to `commandKey`, `inboxKey` and `menuKey` (`:253`, `:276`, `:489`), so for #93's menus the two reads say the same. The read now has three more callers: `opened`, `openRename` and `openHidden` (`:301`, `:548`, `:669`) refuse to open a dialog while any menu stands in the page. #93 opens its dialogs from a menu's press, and `menu.ts` takes the menu out of the page before it hands the press on (`apps/desktop/src/renderer/menu.ts:89-91`), so no dialog of #93 is refused by its own menu. The built-app case runs every such dialog from a menu, and `test/work-item-menu.test.ts` passed with 25 cases. `commandKey` returns `"closePane"` for W, and returns nothing while a dialog or a menu is open (`apps/desktop/src/renderer/view.ts:756-758`). Read and executed.

**The styles.** #93's rules for every `dialog` (`apps/desktop/src/renderer/index.html:354-378`) replace #95's box rule for `#work-item-dialog, #close-pane-dialog`. The close-pane dialog gets the same width, padding, edge and backdrop it had. The only rule it gains is `dialog .row`'s `margin-top`. That margin meets `#close-pane-sentence`'s larger bottom margin and collapses into it, so the dialog's spacing does not change. #93's `.menu` stands at `z-index: 1` (`:380`), #95's link card at 10 (`:391`) and its pane menu at 11 (`:396`). All three are fixed and sit in the body. `#stage` keeps `isolation: isolate` (`:305`), which keeps the terminal's own layers under all three. No class or id is shared: the pane menu is `#pane-menu` and never `.menu`, and `index.html` holds no element with the role `menu` (`git grep`, `## Probes`).

**Two ways to draw a menu.** `frame/plan.md` of #95 (`seal/threads/1795158088-terminal-basics/frame/plan.md:86`) names this as the failure scenario of drawing a pane's menu in `work-item-view.ts`. The round looked for a defect a person meets and found none. The grounds, by what a person could do:

- **Both menus open at once.** Neither can stay open while the other opens. #93's menu closes at any `pointerdown` outside it (`menu.ts:40-42`, `:102`). The pane menu closes at any `mousedown` outside it (`apps/desktop/src/renderer/work-item-view.ts:841-849`). Both listeners sit on the document in its capture phase. A right press, and a press with the Control key, raise both events before `contextmenu`. So the press that asks for the second menu closes the first one before the second opens. The key M is not read while the pane menu stands, because `dialogOpen()` sees it and `menuKey` refuses (`view.ts:971-972`). The key is not read in a terminal either, which types in a `textarea`. The pane menu has no key that opens it.
- **Keys.** While #93's menu is open, the keyboard is on its items. The window's three key readers return at once, and #95's capture listener on `keydown` only hides the link card (`work-item-view.ts:834-840`). While the pane menu is open, the same readers return through `dialogOpen()`.
- **Focus.** The case that most needs care: the pane menu is open and the person right-presses a sidebar line. `mousedown` gives the terminal the keyboard. The press then puts it on the line's button, and `contextmenu` opens #93's menu with that button as the element the keyboard goes back to. In the other order, #93's menu closes without handing the keyboard back (`closeMenu(false)`), and the pane menu takes it.
- **Stacking.** Over a dialog, every menu stands below, since a modal dialog lies in the top layer and only a press could open a menu. The link card can stand over #93's open menu. That happens only while the pointer rests on a link a pane printed, or on the card, and the card leaves when the pointer moves off both. How that looks is a row of `## Not judged`.

The two menus do differ in feel. In #93's menu the arrows stop at each end, the keyboard starts on the first item, and Tab is held. In the pane menu the arrows wrap, the keyboard starts on the menu itself, and Tab is not held. Each of these is pinned by its own work's cases. None makes an item act wrongly or leaves a menu open. Unifying the two belongs to a follow-up, not to this work item for 0.0.1. It would rewrite `work-item-view.ts#openMenu`, which #95's rounds and seal read, and it would give #93's `menu.ts` the pane menu's disabled items and its key labels. Neither work's frame asks for that. The orchestrator decides whether to open an issue for it.

**`pr.md` and `changelog.md` after the merge.** Each sentence was read against `dc715b7`. `changelog.md:8` says the menu "copies the folder's path, and a work item's branch name". That holds for the start a person makes, where `chooseClipboard` hands back the system's clipboard. Only a start under `OWLERY_BACKGROUND=1`, which a case or an agent makes, keeps its own. `changelog.md:6`'s descriptions on hover hold: the built-app case of scenario 21 reads every icon-only button of the page at `dc715b7`, #95's among them, and passed. `pr.md`'s ways to open a menu, its table, its rules for a delete and its list for the hand run each hold against the code and against `gaps.md`. `pr.md` quotes no source. Two records do not hold after the merge: three statements of the copy, which are finding 1, and the plan's overlap with the release, which is finding 2.

## Findings

### 1. Three statements of the work item still say that Copy writes the system's clipboard over a channel this work adds

```seal
severity: should
location: `seal/threads/1795152521-work-item-menu/gaps.md:15`, `seal/threads/1795152521-work-item-menu/frame/design.md:87`, `seal/threads/1795152521-work-item-menu/frame/design.md:204`
evidence: read `apps/desktop/src/main/main.ts:57`, `apps/desktop/src/main/main.ts:149`, `apps/desktop/src/main/clipboard.ts:19-28`, `apps/desktop/src/shared/ipc.ts:76-77`, `seal/threads/1795152521-work-item-menu/gaps.md:15`, `seal/threads/1795152521-work-item-menu/frame/design.md:87`, `seal/threads/1795152521-work-item-menu/frame/design.md:204`; executed `git diff 5413f0b dc715b7 -- apps/desktop/src/shared/ipc.ts`, whose added `Channel` entries are `installedApps`, `openFolder` and `trashFolder` alone; executed `grep -n -i clipboard` and `grep -n -i channel` over the thread's `frame/`, `gaps.md`, `changelog.md` and `pr.md`
```

Why it matters: the merge moved a menu's Copy onto #95's clipboard, and three sentences that state the present still describe the copy as it stood before. The sealer reads each against the tree, and the fix pass and the next round read `gaps.md` as what holds.

- `gaps.md:15` says, as `read` in `main.ts`, "the handlers hand `execFile`, `shell.openPath` and `clipboard.writeText` to those functions". At `dc715b7` the copy's handler hands `copyText` the writer `held.writeText` (`main.ts:149`). `held` is `chooseClipboard(background, clipboard)` (`main.ts:57`), and no handler hands it `clipboard.writeText`.
- `frame/design.md:87`, *Scope* item 8, says "The main process writes the text to the system's clipboard". A start in the background now writes a clipboard of its own and never the system's (`clipboard.ts:19-28`).
- `frame/design.md:204`, *Data & interfaces*, says the three files "gain four channels", one of them "writing the clipboard". Against `release/v0.0.1` at `5413f0b`, this work adds three: `copyText` came with #95, and this work only routes its handler through `openers.ts#copyText`.

The statements were found by `grep -i clipboard` and `grep -i channel` over the records that state the present. That search is a sample of wordings. Its other hits hold. `frame/design.md:38` and `:59` are *Grounding* rows dated to `95decb6`. Scenario 8 at `:158` still holds, because Copy writes to the writer it is handed and the system's clipboard stays `unverified` for the owner. `frame/plan.md:22` is a constraint of the plan's *Technical context*, dated to `95decb6`. It keeps a case from pressing Copy, and the snippet leaves it as it is. `frame/plan.md:61-62` and `gaps.md:24` hold.

The three replacements, each in place of the sentence it names:

```markdown
gaps.md:15, in place of "`read` in `apps/desktop/src/main/main.ts`: the handlers hand `execFile`, `shell.openPath` and `clipboard.writeText` to those functions.":
`read` in `apps/desktop/src/main/main.ts`: the handlers hand `execFile` and `shell.openPath` to those functions, and the copy's handler hands `copyText` the clipboard `apps/desktop/src/main/clipboard.ts#chooseClipboard` gives the start, which is the system's in a start a person makes.

frame/design.md:87, item 8 whole:
8. **Copy.** The main process writes the text to the clipboard the start keeps (`apps/desktop/src/main/clipboard.ts#chooseClipboard`): the system's, and in a start in the background a clipboard of the app's own. The text is a work item's worktree folder, its branch's name, or a repository's folder.

frame/design.md:204, its first sentence:
`apps/desktop/src/shared/ipc.ts`, `apps/desktop/src/preload/preload.ts` and `apps/desktop/src/main/main.ts` gain three channels: the installed apps, opening a folder in Finder or in one of them, and moving a repository's folder to the Trash. A menu's Copy goes over the channel `copyText` of the terminal basics work (issue #95), whose handler writes through `openers.ts#copyText`.
```

### 2. The plan says no work item of the release meets this work, and three merged into it, one of them through seven conflicts

```seal
severity: should
location: `seal/threads/1795152521-work-item-menu/frame/plan.md:86-93`
evidence: read `seal/threads/1795152521-work-item-menu/frame/plan.md:86-93`, `seal/threads/1795158088-terminal-basics/frame/plan.md:120-129`; executed `git show --remerge-diff dc715b7`, which names seven files in conflict; executed `git log --merges 95decb6..dc715b7`, which prints `bb7e314` and `dc715b7`; executed, for each of `485ba74`, `02dea83` and `5413f0b`, `git diff --name-only <c>^ <c> -- apps` intersected with the files of `git log --no-merges --first-parent --name-only 95decb6..7630c4b -- apps`
```

Why it matters: `frame/plan.md` *Overlap with the release* ends with "so none meets this work", over an empty table. That is a conclusion of the plan, so it is read against the target. At `dc715b7`, three work items of `release/v0.0.1` have merged into this branch, and each changed files this work changes. The sealer reads the section to learn which work items touched these files and in what order they landed. The empty table tells the sealer that no merge needs reading. One merge, `dc715b7`, was resolved by hand in seven files.

The work items, found by intersecting each release commit's files with the files of this branch's own commits:

- Issue #31, the notification click, `485ba74`, merged in at `bb7e314`: `main.ts`, `preload.ts`, `renderer.ts`, `view.ts`, `work-item-view.ts`, `ipc.ts`, `view.test.ts`.
- Issue #94, the continue pane, `02dea83`, merged in at `bb7e314`: `daemon/daemon.ts`, `daemon/main.ts`, `view.ts`, `work-item-view.ts`, `protocol.ts`, `daemon.test.ts`, `view.test.ts`.
- Issue #95, terminal basics, `5413f0b`, merged in at `dc715b7`: `daemon/daemon.ts`, `main.ts`, `preload.ts`, `index.html`, `renderer.ts`, `view.ts`, `work-item-view.ts`, `ipc.ts`, `protocol.ts`, `daemon.test.ts`, `view.test.ts`.

The order of merging is the one #95's plan states (`seal/threads/1795158088-terminal-basics/frame/plan.md:129`). The snippet keeps the dated sentence and adds what came after it. It replaces the section's paragraph and table:

```markdown
The spawn names no other open work item of `release/v0.0.1` and says none is in progress. `gh pr list --state open --json number --jq length` on 2026-11-20 printed 0 (`executed`). Three work items of the release then merged first, and this branch took each in by merging `release/v0.0.1`.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #31, the notification click (`485ba74`) | `apps/desktop/src/main/main.ts`, `src/preload/preload.ts`, `src/shared/ipc.ts`, `src/renderer/renderer.ts`, `src/renderer/view.ts`, `src/renderer/work-item-view.ts`, `test/view.test.ts` | #31 | Merged into this branch at `bb7e314`. The order #31, #94, #95, then #93 is the one `seal/threads/1795158088-terminal-basics/frame/plan.md` states |
| #94, the continue pane (`02dea83`) | `apps/desktop/src/daemon/daemon.ts`, `src/daemon/main.ts`, `src/shared/protocol.ts`, `src/renderer/view.ts`, `src/renderer/work-item-view.ts`, `test/daemon.test.ts`, `test/view.test.ts` | #94 | Merged into this branch at `bb7e314` |
| #95, terminal basics (`5413f0b`, pull request #103) | `apps/desktop/src/daemon/daemon.ts`, `src/main/main.ts`, `src/preload/preload.ts`, `src/shared/ipc.ts`, `src/shared/protocol.ts`, `src/renderer/index.html`, `src/renderer/renderer.ts`, `src/renderer/view.ts`, `src/renderer/work-item-view.ts`, `test/daemon.test.ts`, `test/view.test.ts` | #95 | Merged into this branch at `dc715b7`, with seven files in conflict. A menu's Copy writes #95's clipboard (`src/main/clipboard.ts`). The window's read of an open dialog reads every menu. The page draws a pane's menu in `work-item-view.ts` beside this work's `menu.ts`, and review round 7 found no defect a person meets from the two |
```

## Confirmations

```seal
confirms: round-6#1
```
What holds: the row of scenario 5 at `frame/design.md:155` equals round 6's snippet. `grep -c -x -F` with the snippet's line printed 1. `c43a2e6` changes that one line of `frame/design.md` and nothing under `apps`. `git grep -n -F "the repository that is not hidden"` was not run again, because the line it found is the line replaced. `sidebarTree` and the case at `apps/desktop/test/view.test.ts:1428` are not changed in the range. Executed and read.

What matched: the merge commit's account, claim by claim. It claims that #95's clipboard module now carries a menu's Copy. `main.ts:149` routes the copy through `held`. It claims that both works' channels, dialogs and styles stand side by side. They do, by the script of `## Probes` and the reading above. It claims that the window's read of an open dialog also reads every menu. `renderer.ts:248` reads `[role="menu"]`. Read and executed.

What matched: the spawn's account of the resolution. It says the merge kept #95's `dialogOpen` (`remerge-diff`: #93's at `dialog[open]` is the one removed), that `commandKey` keeps `menuOpen` and gains W (`view.ts:756`), and the CSS of #93's `dialog` rules beside #95's link card and pane menu (`index.html:354-400`). Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck of the whole app and the broad gate at `dc715b7`. The orchestrator reports `pnpm -r run check` with exit 0, 31 files, 946 passed and 1 skipped. No `trail/gate.md` stands in the thread at `dc715b7`. This round ran `test/work-item-menu.test.ts` and `test/terminal-basics.test.ts`, each by itself. The suite is `unverified` | `apps/desktop` | the orchestrator, at the broad run and in `trail/gate.md` |
| How #95's link card looks where it stands over an open menu of a repository or a work item, and how the two kinds of menu look side by side in the two themes | `apps/desktop/src/renderer/index.html:380`, `:391`, `:396` | the owner, or whoever the orchestrator names |
| Whether to open an issue that draws the pane's menu through `src/renderer/menu.ts`, or both through one module, after 0.0.1 | `apps/desktop/src/renderer/menu.ts`, `apps/desktop/src/renderer/work-item-view.ts#openMenu` | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/work-item-menu.test.ts`, from `apps/desktop` of the worktree at `dc715b7` | 1 file, 25 passed, exit 0. One start through `BuiltApp.start` |
| `node scripts/test-in-electron.mjs test/terminal-basics.test.ts`, the same | 1 file, 25 passed, exit 0. One start |
| A script in the round's scratch that reads `git diff -U0 02dea83 <side>` for each parent of `dc715b7`, under `apps`, and looks for each added line in the merge, and for each removed line still in it | Reported only the lines the conflicts replaced, and lines that moved inside `test/built-app.ts` and `src/daemon/daemon.ts` |
| `git grep -n -e innerHTML -e insertAdjacentHTML -e outerHTML -- apps/desktop/src/renderer`, at `dc715b7` | no line, exit 1 |
| `git grep -n -e 'role="menu"' -e 'class="menu' -- apps/desktop/src/renderer/index.html`, at `dc715b7` | no line, exit 1 |
| For each of `5413f0b`, `02dea83` and `485ba74`, `git diff --name-only <c>^ <c> -- apps` against `git log --no-merges --first-parent --name-only 95decb6..7630c4b -- apps` with `comm -12` | 11, 7 and 7 shared files, as finding 2 lists them |
| `ps -axo pid=,command=`, filtered for `owlery-93`, after the last start | no process of the worktree's app or daemon. Pid 95337 alive |
