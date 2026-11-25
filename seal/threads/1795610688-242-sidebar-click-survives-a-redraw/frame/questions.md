# Questions for the planner: 1795610688-242-sidebar-click-survives-a-redraw

The ticket left these judgments open, and the tree answered them. Their grounds stand where each line points:

- How a press outlasts a draw: `frame/plan.md` *Alternatives considered*, the chosen row.
- Whether event delegation alone cures the defect: `frame/design.md` *What the probes showed*, probe 1.
- Whether the list screens, the summary, the view and the dialogs are in this work along with the sidebar: `frame/design.md` *The code as it stands*, the third item, and *Scope* item 2.
- Which policy document takes the rule: `frame/design.md` *Grounding*, the row of `docs/architecture.md` *Screen framework: Electron*.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Is it acceptable that the sidebar and the screen in front wait to draw the daemon's lists for as long as the mouse's main button is held anywhere in the window, a selection dragged in a terminal pane among them? No policy document says how long the window's lists may lag a press the person holds, and no probe can say what a person accepts. The answer changes where the hold applies. | a person | **A**: the hold applies to a press anywhere in the window. One rule, and every line and button the lists' draws replace is covered. A drag in a terminal delays the lists' drawing until its release, while their notifications are raised at once. **B**: the hold applies only to a press that begins outside the stage of panes. A drag in a terminal never delays a draw, but the window has to name where the hold applies, and a part added later can fall outside that list. | A. The press is the person's own, its end catches the lists up at once, and nothing is lost while it lasts. | open |
| Q2 | Does CDP `Runtime.queryObjects` on `WebSocket.prototype`, in the built app, find the window's socket to the daemon alone? Probe 3 ran a page of the framer's that held one socket. The built app cannot be started without a build, and a probe builds nothing. | the work | **A**: it finds one socket, and the case adds its listener to it. **B**: it finds more than one, and the case keeps the socket whose `url` names the daemon's port from `run/daemon.json`, which the file already reads (`apps/desktop/test/seal-back-view.test.ts` line 98). | B's filter, which also holds where A is the case. | open |
