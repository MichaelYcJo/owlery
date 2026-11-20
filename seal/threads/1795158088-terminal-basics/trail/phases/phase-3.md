# Phase 3: 1795158088-terminal-basics

## What this phase found

**The frame holds for this phase, apart from five statements.** The phase started from `ca371e6`, which holds the merge `frame/plan.md` *Technical context* asks for (`a7a9dd7`). Each thing of the installed versions the fold builds on was opened and stands: `registerLinkProvider`, `ILink.hover` and `ILink.leave`, the `hover` and `leave` of `linkHandler` and of the link add-on's options, and `isWrapped` in xterm 6.0.0's typings, and `shell.showItemInFolder` and `shell.openPath` in Electron 45.3.3's. The five statements are under *Departures from the frame*.

The phase's code is in `c6ff5c9`. Three commits after it, `fd2aa76`, `56e4fb8` and `fe75f53`, add cases, and the first of them also takes one repeated test out of `pathCandidates`.

### Departures from the frame

Each was judged against `frame/design.md`, in the section named.

- **Electron's clipboard answers by promise.** *Scope* item 15 has every other start read and write the system's clipboard "through Electron's `clipboard`". In Electron 45.3.3 `clipboard.readText()` gives `Promise<string>` and `clipboard.writeText()` gives `Promise<void>` (`apps/desktop/node_modules/electron/electron.d.ts:7465` and `:7475`). So `clipboard.ts#Clipboard` has both answer by promise, the app's own clipboard too. The channel `copyText: "owlery:copy-text"` keeps the name and the signature the frame states, `copyText(text: string): Promise<void>`. Issue #93's handler on its branch calls `clipboard.writeText(written)` and does not wait for it, which the merge of that work meets.
- **A run of slashes, dots and tildes alone is no candidate.** *Scope* item 10 takes each run that holds a slash and does not hold `://`. Read so, `//` is a candidate, and the main process finds the root folder at it: every comment line of a program a pane prints would open with a link. `pathCandidates` leaves out a run that holds no other character once it is cut, which takes `/`, `./`, `../` and `~/` with it.
- **`chooseOpener` is called once for each of Finder's two acts.** *Data & interfaces* has it "called a second time, with the two acts of Finder as its system opener". Item 14 has the disk read before the act is chosen, and has the named program stand in for either act, so `paths.ts#chooseFinder` calls it for `select` and for `open`. `links.ts#chooseOpener` is unchanged but for one sentence of its comment.
- **`view.ts` gains five functions, not three.** *Data & interfaces* names the function that finds a line's candidates, the one that answers a click and the one that gives the card's lines. Item 11's rule, which target a link has, is two more: `webTarget` and `pathTarget`. `work-item-view.ts` cannot be read without a page, so the rule stands where a case reads it.
- **The card stands above its row where the window has no room under it.** Item 13 has the card show under the row, "moved where it would pass the window's edge". The newest output of a pane is on its last rows, and a card under them would pass the window's foot. `showCard` puts it above the row then, with its foot at the row's top.

Two more things differ from a scenario row and contradict nothing.

- **Cases of the built app beyond the scenario rows.** The card's place under the row and at the pointer, its place where the pointer moved along the link, the card that stays where the pointer returns to its link, the card above a link at the window's foot, the card inside the window's right edge, a key and a press that take the card away, a link whose last character is two cells wide, and a row of the card that does what its click does.
- **Scenario 20's two paths each take two rows.** A worktree's whole path is longer than the screen is wide in the cases' window, so the terminal wraps it. The case reads the second path's row from the first one's length.

### Decisions made while writing the code

- **`paths.ts#standsAt` reads a link as what it leads to, and answers the link's own path.** *Scope* item 10 asks for the whole path "with every `.` and `..` resolved", which `path.resolve` gives without reading the disk. A link to a folder is a folder to Finder as well.
- **A worktree that is no whole path is read as none named.** The request comes from the window, and a path joined to a worktree written from the main process's own folder would be read from wherever the app was started. Judged against item 10.
- **`showInFinder` resolves the path it was handed before it reads the disk, and hands the act that whole path.** Item 14 shows nothing where the path "is not a whole one from `/`". A path from `/` with `..` in it is taken, and what is shown is what was read.
- **A checkout is a folder with `.git` at its top as a folder or as a file.** A linked worktree, which every work item's folder is, holds `.git` as a file. Judged against item 14.
- **A value that is no text is not written to the clipboard, and is answered with nothing where a path is asked.** The channels hand the main process whatever the page sent, as phase 2 decided for an address.
- **A click with the key and the Shift key does what the key alone does where the target's rows give that click nothing.** Item 12 states it for a web address and for another path. `linkClick` reads it from the one table `linkCard` reads.
- **The card shows where the pointer is when the 300 milliseconds have passed**, not where it came onto the link. Item 13 has its left edge "at the pointer".
- **The card of a link stays as it is where the pointer comes back to that link from the card.** Without this the card is drawn again 300 milliseconds later, at the pointer's new place, under a person who is reading it.
- **A press on the card is kept from taking the keyboard by stopping the default of `mousedown`.** Item 13 says the buttons do not take the keyboard from the terminal.
- **What a path leads to is read from the window's lists at the click and at the hover**, not when the link was found. Item 10 says nothing is kept between two requests, and a work item made since the pointer came to the line is then read.
- **The stand-in shell reads its lines from the file `OWLERY_BASICS_LINES` names.** The variable is set once, at the app's start, and a case writes the file before it opens a pane.

### What was seen red

Each case below failed on an assertion of its own before its code, or with its one guard removed.

| Case | How it was seen red |
|---|---|
| `test/view.test.ts`, the 27 cases of `pathCandidates`, `webTarget`, `pathTarget`, `linkClick` and `linkCard` | Against stubs that answer wrongly: the line itself as one candidate, a path's target for every address, a web target for every path, a copy for every click, and one row with the wrong words |
| `test/paths.test.ts`, 32 of its 33 cases, and `test/clipboard.test.ts`, 4 of its 5 | Against stubs that answer wrongly. The clipboard's cases were then rewritten to wait for a promise, with the same assertions |
| `test/paths.test.ts`, "has a folder opened" of `finderAct` | It passes against the stub. With `finderAct` answering `select` for every folder it failed |
| `test/clipboard.test.ts`, each background start's clipboard apart from another's | It passes against the stub. With the kept text moved out of the function, so every start shares it, it failed |
| `test/paths.test.ts`, a worktree that is no whole path | Rewritten after a mutant survived: the first form named a folder that does not exist from the suite's folder. With the test of a whole path removed it failed |
| Scenario 17, the card over a web address | Before the window's code: the window never showed the card |
| Scenario 18, a path is a link only where it exists | Before the window's code: no link at the path's first cell |
| Scenario 19, a path is clicked | Before the window's code: no link under the pointer |
| Scenario 20, another work item's worktree | Before the window's code it failed where it makes the second work item, on the case's own mistake: the form held no folder after the page's reload. Its reds are the mutants below: the click that opens no view, the view's own worktree read as a work item's, and the function `renderer.ts` hands over replaced by one that does nothing |
| The cases added in `fd2aa76` and `fe75f53` | Each passed when written. Each failed under its mutant: a link that ends at its last character's first cell, the card drawn again at the pointer's return, the card always under its row, the card that leaves at once, the card never moved from the pointer, and the card's element without `hidden` |

### Mutation

`seal mutate` ran after the commits, one call per file. A built-app run went through `run-built.sh` in the phase's scratch directory, which keeps each run's output, and each red below was read there for the case that failed.

| File | Mutants | Cases |
|---|---|---|
| `src/renderer/view.ts` | eighteen, all red, at `fd2aa76` | `test/view.test.ts` |
| `src/main/paths.ts` | twenty-three, all red: twenty-one at `fd2aa76`, the test of a whole worktree at `56e4fb8` after its case was rewritten, and `finderAct` answering `select` | `test/paths.test.ts` |
| `src/main/clipboard.ts` | five, all red: the system's clipboard in the background, a value that is no text written, the kept text shared by every start, nothing kept, and the system's read in the background | `test/clipboard.test.ts` |
| `src/renderer/work-item-view.ts` | thirty-one, all red: twenty-nine at `56e4fb8`, and two at `fe75f53` that had survived, the card that leaves at once and the card never moved from the pointer | `test/terminal-basics.test.ts` |
| `src/main/main.ts` | five, all red: no worktree handed on, a path never shown, Finder chosen as if no program were named, and each of the clipboard's two channels answering nothing | `test/terminal-basics.test.ts` |
| `src/preload/preload.ts` | four, all red: one for each new function | `test/terminal-basics.test.ts` |
| `src/renderer/renderer.ts` | two, both red: a function that opens no view, and the view told the keyboard is not a Mac's | `test/terminal-basics.test.ts` |
| `src/renderer/index.html` | two, both red: the card without `position: fixed`, and at `fe75f53` the card's element without `hidden` | `test/terminal-basics.test.ts` |

Three survivors changed what was done, and each is red now.

- **The card that leaves at once passed every case.** The debugging port moves the pointer from the link onto the card in one step, and the page then reads the leave and the arrival before any timer. The case now reads the card still shown the moment after the pointer left for a row with no link.
- **The card never moved from the pointer passed every case.** A card whose left edge stands near the window's right edge grows narrower and does not pass it, and the pointer's place is rounded, so "left of the pointer" held by half a pixel. The case now asks for more than ten.
- **The card's element without `hidden` passed every case.** The first key or press hides the card. The case of the page's reload now reads it hidden in a page that just loaded.

**No mutant of `main.ts` chose the Finder or the clipboard of a start that is not in the background.** Its run would have opened Finder on the owner's screen or replaced the owner's clipboard. `gaps.md` holds the row.

One line was taken out because of what a mutant would have shown: `pathCandidates` tested a run for a slash before its cuts and again after them, and the second test alone decides.

### What the commands were

- Each test file runs by itself as `node scripts/test-in-electron.mjs test/<file>` from `apps/desktop`. `test/view.test.ts`, `test/paths.test.ts`, `test/clipboard.test.ts`, `test/links.test.ts` and `test/terminal-basics.test.ts` each ran so and exited 0, the last at `fe75f53`.
- The boundary run at `fe75f53` was one command over ten files: those five, `test/themes.test.ts`, which reads `index.html` and every module under `src/renderer`, and `test/korean-input.test.ts`, `test/work-item-form.test.ts`, `test/notification-click.test.ts` and `test/memory.test.ts`, which start the app this phase changed. It exited 0 with 417 cases passed and one skipped, the typed run a person makes.
- The repository configures no linter and no formatter. The changed files were typechecked by `tsc --noEmit` with the options of `tsconfig.json` written on the command line and the files named (`tsc-files.sh` in the phase's scratch directory).
- One probe ran once, `test/test_tmp_card.test.ts`: it started the app, rested the pointer on a link and on a path, and wrote two pictures of the card into the phase's scratch directory. The file is gone from the tree.
- `test/terminal-basics.test.ts` takes about 38 seconds with its one start. Every start was in the background, and `pgrep` listed no process of a run after the last one.

### What phase 4 needs

- **A card stands over the rows under its link.** A case that goes from one link to a link on a lower row first takes the pointer away, which the helpers `pointAway`, `clickLink`, `linkAt` and `restOn` do. `pointAway` waits until no link is under the pointer and no card is shown. Row 16 of the screen, `EMPTY_ROW`, is one no case prints on.
- **The card leaves at every key and at every press outside it**, by two listeners on the document's capture phase in `initView`. A press of the right button is such a press, so the pane's menu of *Scope* item 16 opens with the card gone and needs no line for it.
- **The clipboard is `window.owlery.copyText` and `window.owlery.clipboardText`**, and the cases' helper `clipboard()` reads it. After this phase's cases it holds a path.
- **`act` in `work-item-view.ts` does what a row of the card or a click chose.** The menu's "Copy" and "Paste" reach the clipboard through the same two functions of `window.owlery`.
- After the last case the window shows the first work item's view, "Korean input", with its one shell pane in front. A second work item, "Second item", is listed, with one shell pane.
- A shell pane prints the lines of the file `linesFile` names as it starts. A case that wants none writes an empty file first: after this phase's cases the file holds two worktrees' paths.
