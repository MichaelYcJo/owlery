Closes #242.

- "A hold on draws: while the mouse's main button is held down anywhere in the window, a draw that a daemon message asks for waits." (`frame/design.md` *Scope*, item 1)
- "It runs once, in a task after the release, so the click goes first to the element that was pressed." (`frame/design.md` *Scope*, item 1)
- "One function in `apps/desktop/src/renderer/renderer.ts` draws what the daemon's lists change: the sidebar, the archived screen's fallback to the inbox, the list in front, the view, the summary and the six dialogs that name what the daemon lists." (`frame/design.md` *Scope*, item 2)
- "The three cases that click a sidebar line again until the view shows click once (`approval-line.test.ts`, `seal-back-view.test.ts`, `machine-dialog.test.ts`)." (`frame/design.md` *Scope*, item 3)
- "Is it acceptable that the sidebar and the screen in front wait to draw the daemon's lists for as long as the mouse's main button is held anywhere in the window, a selection dragged in a terminal pane among them?" (`frame/questions.md` Q1)
- "A. The press is the person's own, its end catches the lists up at once, and nothing is lost while it lasts." (`frame/questions.md` Q1)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
