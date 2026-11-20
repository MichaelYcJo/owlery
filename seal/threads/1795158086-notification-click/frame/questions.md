# Questions for the planner: a click on a notification opens the work item that waits (#31)

Judgments the ticket left open that the tree or the spawn answered. None is a question any more.

- How a click reaches the window, and whether the window or the main process raises the notification: `frame/plan.md` *Alternatives considered*, the first three rows.
- Which view opens for which session, and what a click does for a session without a work item or for a work item that left the list: `frame/design.md` *Grounding*, the bullets on `renderer.ts`, `work-item-view.ts` and `protocol.ts:99`, and *Scope* items 3 to 5.
- Which pane is in front of the view a click opens: `frame/plan.md` *Alternatives considered*, the row on the pane left as it was.
- What a click does in an app an agent started in the background: `frame/design.md` *Scope* item 2, and `frame/plan.md` *Alternatives considered*, the row on `showInactive`.
- How a case drives the click and changes a state without a real notification and without an agent: `frame/design.md` *Grounding*, the bullets on `daemon.ts`, `hooks.ts`, `receiver.sh` and the earlier phase record, and `frame/plan.md` *Technical context*, the constraints of the run.
- Whether a Dock badge belongs to this work: `frame/design.md` *Grounding*, the bullet on the spawn's account, and *Scope*, out of scope.
- Whether the work changes a rule of `docs/`: `frame/design.md` *Rule changes*.
- Where this work meets the release's other work items and which merges first: `frame/plan.md` *Overlap with the release*.

One assumption is written down and not asked, because another answer changes one line of the handler and nothing else that is built: the "New work item" form stays open at a click, with what it holds (`frame/design.md` *Scope* item 6).

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Does a person's press on a real macOS notification of Owlery run the page's click handler, so that the window comes forward and the work item's view opens? The press is on a banner as it appears, and on an entry of Notification Center some minutes later, in the app as the owner starts it, while the window is behind another app and while it is minimized. The tree cannot answer it: the delivery of the click to the page is macOS's and Electron 45.3.3's, and the installed declarations say nothing of it. No probe could run in the framer's environment: it needs a notification raised on the owner's screen and a person's press on it, and the spawn forbids an agent both. | a measurement, made by the owner's hand in the built app of this branch, at the first notification after the merge or in the hand pass of issue #24 | (a) Both presses open the view and bring the window forward: nothing more is built. (b) The banner's press works and the Notification Center entry's does not, or neither works: the notification moves to the main process, the second row of `frame/plan.md` *Alternatives considered*, as a work item of its own. (c) The view opens and the window stays behind: the function of `src/main/forward.ts` changes how it makes the app active, and nothing else. | Built as framed. `gaps.md` carries the press as unproved until the owner makes it | open |
