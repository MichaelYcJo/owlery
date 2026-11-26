# Phase 2: 1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll

## What this phase found

**The frame holds for this phase.** Before the build, the coordinates the phase stands on were opened at `98c23f2e`. They are `showDelete`, `showRemove`, `drawSessions`, `namedLines`, `lossParts`, `drawLists`, the checkbox handlers of both dialogs, the markup of `#remove-dialog`, and the delete and removal cases of `work-item-menu.test.ts`. Each matched what `frame/design.md` *Grounding* says of it, at the line numbers phase 1 moved. `drawLists` draws every open dialog at each `inbox`. A check of "Force delete" draws its dialog again (`removeForce` and `deleteForce` call `showRemove` and `showDelete`). A check of the choice to delete forgets the losses first. So the comparison of *Data & interfaces* answers every draw the dialogs get.

**Departures from the frame.**
- **The comparison is `sameValues` in `view.ts`, and `drawWhereChanged` in `renderer.ts` calls it.** The sketch in *Data & interfaces* holds the comparison inside the helper. The renderer is reached only by built-app cases, and no built-app case can change what a part is drawn from by adding a value at the end of the list. So nothing in that file could fail where the length check was removed. A pure function in `view.ts` gets unit cases in `view.test.ts`. They cover a list that holds the other and more, and an object read again. Grounds: `agents/crafter.md` *Mutation-test every unit that adds behaviour*. *Data & interfaces* says "The builder may name the parts differently".
- **`#remove-work-items` keeps the markup's `ul` and draws its rows through `namedRows`.** `namedRows` is the body of `namedLines` taken out of it, and `namedLines` now calls it. *Scope* item 8 and the third row of *Removes* say that list "is drawn by `namedLines`". `namedLines` makes a new `ul`, and replacing the list would lose its scroll. The kept part has to be the `ul` the section holds. The `records-holds` list still draws through `namedLines`, as before.
- **`#remove-losses` is drawn from each work item's id, title and loss, and the choice to delete is held in it as an empty list.** Where the choice is not taken, the dialog names no work item, so the values are `[]`. A work item whose loss is not read yet holds `null`, the value `deleteSays` and the drawing read, and not `undefined`. *Data & interfaces* names "the choice to delete" as one value and "its loss or `undefined`". The two forms tell the same draws apart, and the drawing reads only what is compared.
- **The removal dialog's case is a case of its own, after the long list's case, and the long list's work item is deleted at its end.** It reads the same work item of twelve commits, as the scenario asks. The cleanup moved there with the comment that says why it stands.
- **The removal case also renames the first work item from a second client while the dialog is open, and reads that the list of sessions is drawn anew.** The scenarios table has no row for a session list that changes. The mutant that compared each section's head and line count, but not the lines' words, survived the file. No case changed a line's words while the count stayed. The rename then names the work item again as "Renamed here", so the cases after it meet the names they met before.
- **The delete case reads the kept lists at a check of "Force delete" as well as at an `inbox`.** The scenarios table names the check only for the removal dialog. *Scope* item 6 asks for every redraw that does not change the loss, and that check is one of them.

**Decisions settled in the code.**
- `drawSessions` compares each section's head, its count of lines and its lines, flattened into one list. With the count among them, no two different sets of sections flatten into the same values. Phase 1 found the lines are new arrays at each draw, so the strings are compared and not the arrays.
- `#delete-loss` is drawn from `[deleteLoss]`, compared by identity. `readDeleteLoss` sets it to `null` and `takeDeleteLoss` to a new object, so each read draws the lists again (`frame/design.md` *Grounding*, "A loss is a new object at each read").
- The second client mutes and unmutes the first work item (`setWorkItem`). The daemon then sends an `inbox`, and the sidebar's mark shows it. Nothing either dialog names changes. Each case first reads that the work item is muted, so the message is a change and an `inbox` follows. Each case then mutes the work item again, so the cases after it meet the state they met before.
- The removal case sets the list's `scrollTop` to two whole rows, where the delete case turns the wheel. The loss of twelve commits is the third work item's in that dialog, and a wheel at a point outside the window reaches no list. Whether the list stood inside the window was not tried. The case reads the kept scroll, not how the wheel comes to rest. The delete case still reads both.

**Seen red** (contract rule 15, `executed`, each through `seal mutate`, which restored `renderer.ts` and `view.ts` and compared their hashes):
- The delete case, with the early return of `drawWhereChanged` removed, the one guard it names. Over the whole file without bail, it failed at its first read of the kept lists, `test/work-item-menu.test.ts:961`. It received `[0, false, false, false]` for `[26, true, true, true]`: the list at its top, and a new list, row and sessions' list. The six cases after it failed because the delete dialog stayed open over the window.
- The removal case, with its losses' part given a new object to compare at each draw (`[{}]`), which redraws that part alone. It failed at its first read of the kept lists, `test/work-item-menu.test.ts:986`. It received `[0, false, false, true, true]` for `[52, true, true, true, true]`, so the list of work items and the list of sessions stayed kept. The other 25 cases of the run passed.
- The removal case's rename, with `drawSessions` comparing `[caption, lines.length]`. It failed at `test/work-item-menu.test.ts:996`, which received "Shell in Renamed here" for "Shell in Renamed there".
- The `sameValues` cases were not run against a tree without the function. Before the build the import named nothing. They were shown red by the mutants below.

**Mutation runs** (`seal mutate`, `executed`). In `view.ts`, `node scripts/test-in-electron.mjs test/view.test.ts -t sameValues`, one call with three mutants, each `red`, exit 0:
- the length check removed;
- the comparison of values made `true`;
- `Object.is` made true for any two objects.

In `renderer.ts`, `node scripts/test-in-electron.mjs test/work-item-menu.test.ts --bail=1`, one call with six mutants. Five were red. The sixth survived and the rename case was added for it:
- the early return of `drawWhereChanged` removed: red;
- `#delete-loss` drawn from `[]`: red;
- `#remove-losses` compared without the loss: red;
- `#remove-work-items` drawn from `[]`: red;
- `drawSessions` drawn from `[]`: red;
- `drawSessions` without the lines' words: `SURVIVED`. After the rename case, the same mutant alone was red (exit 0).

The batch call prints the verdicts and not the cases that failed. Only the three seen-red runs above name the line a case failed at.

**`namedRows` was moved out of `namedLines` with its body unchanged.** It owes no case of its own. `records-holds`, `#delete-sessions`, `#daemon-sessions` and `#sessions-list` still draw through `namedLines`, and the batch's cases that read them passed.

**The phase-end batch** (`executed`): `cd apps/desktop && OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/view.test.ts test/themes.test.ts test/work-item-menu.test.ts test/machine-dialog.test.ts test/daemon-restart.test.ts`, exit 0, 5 files and 615 cases passed. The plan's cell names `work-item-menu.test.ts`. The other four are the files `skills/verify/SKILL.md` *Phase boundary* adds. `view.test.ts` was changed. `themes.test.ts` reads `docs/design.md` and `docs/design.ko.md`. `machine-dialog.test.ts` and `daemon-restart.test.ts` read lists that `drawSessions` draws. `npx tsc --noEmit -p .` in `apps/desktop` exited 0 before each commit.

**Constraints met while running.**
- The first two mutation calls ran a subset of the file, by `-t`, and their baselines failed for want of earlier cases. The mute case reads the inbox an earlier case opened. A work item made by `create` lands in the folder the form last held, which an earlier case sets. The whole file runs in about fourteen seconds here, so the later runs took the whole file.
- Two of this phase's runs started while another worktree's built-app run was going. They were the second subset call and the removal case's seen-red run. The `pgrep` stood in the same command as the run and did not hold it back. The machine allows one heavy command at a time (`seal/config.json` *Heavy commands*). After the second overlap, each run waited in a call of its own until no other run was going. The two runs that overlapped measured what this record says of them: the first had no baseline, and the second's failure is at the line it pins.

**For phase 3.** The screenshot run's delete view draws `#delete-sessions` and `#delete-loss` through `drawWhereChanged`. Its wait reads the drawn elements, and a list kept in place is the same element, so the wait reads it as before.
