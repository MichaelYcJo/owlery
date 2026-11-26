# Closing memo: 1795651593-231-pane-output-is-searched-and-opens-paths

## Not verified

| Item | Who must answer |
|---|---|
| The broad gate: `pnpm -r run check` and the comparison of `docs/*.md` with `docs/*.ko.md`, at the work item's last commit. Each phase ran its unit files, its built-app files and `pnpm run test:app`, and no repository-wide run. Phase 3 counted 15 headings and 386 table rows in each edition of `docs/design.md` with `grep -c`, which is not the gate's comparison | the orchestrator, at the broad gate |
| That the three link-card cases of `apps/desktop/test/terminal-basics.test.ts` that failed in the first `test:app` of phase 1 fail on timing in a long batch, and not because of this work. The file passed alone at HEAD and in a second `test:app`, and no run at the base was made (`trail/phases/phase-1.md`) | the orchestrator, at the broad gate |
| How many lines a Claude Code pane holds when it returns to the stage after a long turn, at 256 characters a line (Q2 of `frame/questions.md`). Phase 1 timed the return of a shell pane of 3,000 short lines only | the owner's walk of release 0.0.5 |
| Whether Control+V in a Claude Code pane attaches an image that is on the clipboard (Q3 of `frame/questions.md`). Phase 3 did not run it: an image can reach the clipboard only by replacing what the person copied, and the owner's terms for the short real session forbid that. Nothing is built on the answer | the owner, at the machine: copy a screenshot, press Control+V in a Claude Code pane, and read whether `[Image #1]` appears |
| What a real paste holds after a copy in Finder and after a screenshot to the clipboard (Q5), and that `main.ts` reads the image through `clipboard.read()` and its `image/png` type. Every case dispatched a paste event it built, and replaced the main process's answer, since an app started in the background reads no image of the system's clipboard | the owner's walk of release 0.0.5: paste a copied file and a screenshot into a pane once |
| That a real editor opens the file at its line and its column. Every case ran the stand-in `OWLERY_OPENER` names. The arguments of Visual Studio Code and Xcode were read from their `--help` by the framer, and none was run with a file | the owner's walk of release 0.0.5 |
| The commands of Cursor, Zed and Sublime Text and the arguments they take (Q4). None of them is installed on this Mac | a measurement on a Mac that holds them |
| The built-app case of C1, C2 and C3 in `apps/desktop/test/terminal-basics.test.ts` runs only on a Mac that holds an editor of the list (`trail/phases/phase-3.md`, decision 4). It ran on this Mac, which holds Visual Studio Code and Xcode. Whether the Mac of CI holds one was not read | the orchestrator, at the broad gate and the pull request's checks |
| Whether the Machine dialog, now taller than a window 900 pixels high where commands wait and ran, should open at its heading each time. It keeps the scroll a person left it at, and its buttons stand below the window until it is scrolled (`trail/phases/phase-3.md`, departure 4). Phase 3 changed only the screenshot run for it | the owner's walk of release 0.0.5 |

## Not done

The Machine dialog draws no scrollback row against a daemon of an earlier build (scenario B3), and only a unit case on `machineDialog` in `apps/desktop/test/view.test.ts` holds that. `frame/design.md` names `apps/desktop/test/machine-dialog.test.ts` beside it. A built-app case would need a daemon that answers as an earlier build does, and the built app starts its own daemon from the same tree, so no case of that file can start one without a stand-in daemon written for it. The unit case reads the function the dialog draws from, and phase 1 did not build a stand-in daemon for one row.

No case holds that the pane menu's "Paste" hands nothing where the screen took another pane while the main process read the clipboard. `menuAct` in `apps/desktop/src/renderer/work-item-view.ts` returns before either paste where the screen's pane changed. The case of a paste event's image, in `apps/desktop/test/terminal-basics.test.ts`, holds the guard of `pasteImage` alone.
