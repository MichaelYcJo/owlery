# Questions for the planner: repositories as a unit, and the menus of a work item and of a repository (#93)

Judgments the ticket left open that the tree, the owner's words or a probe answered. None is a question any more.

- Where a repository, an archive, a pin, a mute and a group are kept: `frame/design.md` *Scope* item 1, and `frame/plan.md` *Alternatives considered*, the first four rows and the rows on the window and on the person's repository.
- How the protocol carries a repository: `frame/plan.md` *Alternatives considered*, the rows on nested work items and on one list with `archivedAt`.
- What a window of this build does against a daemon of an earlier one: `frame/design.md` *Scope* item 2, and `frame/plan.md` *Operational impact*.
- How the menu is drawn and how the keyboard opens it: `frame/design.md` *Grounding*, the probe `test_tmp_menu_probe.js`, and `frame/plan.md` *Alternatives considered*, the rows on the system's menu, on the platform's key and on a "…" button.
- How a delete finds the commits only the branch holds, and the files no commit holds: `frame/design.md` *Grounding*, the probe `test_tmp_delete_probe.sh`, and *Scope* item 19.
- How a delete removes a worktree and a branch, and what keeps it to what the person read: `frame/design.md` *Scope* item 20, and `frame/plan.md` *Alternatives considered*, the rows on `rm`, on the stamp and on `--force`.
- When a branch counts as never pushed: `frame/design.md` *Grounding*, the probe's bullet on a push without `-u`, and *Scope* item 11.
- How the installed editors and terminals are found, and which process opens them: `frame/design.md` *Scope* item 7, and `frame/plan.md` *Alternatives considered*, the rows on Spotlight, on the daemon and on the page's clipboard.
- Where the archived work items are listed: `frame/plan.md` *Alternatives considered*, the row on a fourth screen.
- What a session's history is at a restore: `frame/design.md` *Scope* item 18.
- How the menus are held by a case: `frame/plan.md` *Alternatives considered*, the last two rows.

Assumptions written down and not asked. The first two are the orchestrator's choices, which its message of 2026-11-20 asked to be recorded here: the owner asked only that deleting from disk be a checkbox's choice.

- A repository's removal offers two checkboxes, one for its work items' worktrees and local branches and one for the repository's folder (`frame/design.md` *Scope* item 16).
- The repository's folder goes to the macOS Trash and is not erased (the same item).
- The checkbox for the folder is enabled only where the repository holds no work item or the first checkbox is checked, because a linked worktree does not work once its repository moved (the same item).
- Ignored files and folders, such as `.env` and `node_modules/`, are named in the delete dialog and do not make a delete need the force (`frame/design.md` *Scope* item 19). The issue's rule names uncommitted files, untracked files and commits.
- A commit that a tag or a remote's branch holds is not one a delete would lose (*Scope* item 19). The issue says "no other branch".
- The branch's rename is offered only where the branch has no upstream and no remote of the clone holds a branch of its name (*Scope* item 11). The issue says "no upstream (it was never pushed)", and the two differ for a push without `-u`.
- A pinned work item stands first in its group of the sidebar, in its state's group of the inbox and on the history screen (*Scope* item 9). The issue says "at the top of its list".
- An archive with no running session runs at the menu's press, with no dialog, because a restore undoes it (*Scope* item 17).
- A work item that comes back at a restore has the panes and the answers the daemon still holds, which is all the tree keeps of a session's history (*Scope* item 18). The issue says "sessions' history as they were".
- A hidden repository's work items stay in the inbox, and their notifications arrive (*Scope* item 15).
- The menu's key is M, with F10 and Shift beside it (*Scope* item 5).
- A description on hover is the control's `title`, which the system shows after a pause (*Scope* item 24). The owner asked for a short description on hover.
- The form's choice is a checkbox that reads "Register the repository only", and the form's button then reads "Register" (*Scope* item 3). The owner named the choice and not its words.
- A list of the delete dialog carries at most 500 entries and says how many more there are (*Scope* item 19).
- A group cannot be renamed or removed in this work (`frame/design.md` *Scope*, out of scope).
- The words on the menus, the dialogs and the buttons are those `frame/design.md` *Scope* quotes. Another wording changes a word on the screen and nothing else that is built.

One thing is verified by no scenario and is no row, because no answer to it changes what is built: how the menus and the dialogs look when drawn. `frame/design.md` names the orchestrator as the one who says who looks.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | What is a repository's icon, which "change icon" sets? The issue names the item and says nothing of what an icon is, the tree draws no icon for a repository, and no probe can say what the product should be. Phase 3 builds it, and phases 1 and 2 do not wait on the answer. | a person | (a) One character the person types or picks from the system's emoji picker, shown before the repository's name. It is stored as text in the daemon's store, and nothing but `frame/design.md` *Scope* item 14 is built. (b) One of a fixed set of drawings and colours that Owlery ships, chosen in a grid. The set has to be drawn in the window's two themes, and the dialog becomes a grid. (c) An image file the person chooses. The file has to be copied into the daemon's run directory, sent to the window, and scaled, and a phone of v0.2 has to be sent it too. | (a) | open |
| Q2 | How long does the daemon wait for a pane's process to exit after it killed it, before a delete is refused? It depends on how long an agent's CLI takes to end at the signal `node-pty` sends, which is known once a case ends a real pane. | the work | Phase 3 builds the ending of sessions and chooses the wait from what its cases show, long enough for a shell and for the fake receiver to exit and short enough that a person does not take the dialog for hung. A process that outlives the wait refuses a delete (`frame/design.md` *Scope* item 21). | Phase 3 decides and records the wait in its phase record | answered 2026-11-20 by the work, phase 3: three seconds, `END_WAIT_MS` in `src/daemon/daemon.ts`, an option `endWaitMs` for the cases (`trail/phases/phase-3.md`) |
| Q3 | Does each app of the main process's list open the folder it is handed with `open -a <bundle> <folder>`: the editors Visual Studio Code, Cursor, Zed, Sublime Text and Xcode, and the terminals Terminal, iTerm, Ghostty and Warp? No probe could run: opening an app takes the screen of the owner, who is in the hand run of issue #24, and the owner's Mac holds only Visual Studio Code, Xcode, iTerm, Warp and Terminal of them (`frame/design.md` *Grounding*). | a measurement | The owner presses each "Open in" item the menu lists in the hand run of issue #24. An app that opens without the folder leaves the list in a fix. The apps the owner's Mac does not hold stay `unverified` until someone who has one presses its item. | The list stands as `frame/design.md` *Data & interfaces* gives it | open |
