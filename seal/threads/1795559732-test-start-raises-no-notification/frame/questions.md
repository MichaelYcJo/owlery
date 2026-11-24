# Questions for the planner: a test start raises no macOS notification

Judgments the issue left open and the tree answered. None of them is a row below.

- Where a background start stops the notification: in the page, at one function. `frame/plan.md` *Alternatives considered*, the rows on the page, on the main process, on `BuiltApp.start` and on the permission.
- How the page learns of the background start: `frame/plan.md` *Alternatives considered*, the row on `webPreferences.additionalArguments`.
- What the cases read in the notification's place, and under which name: `frame/design.md` *Grounding*, the rows on the six files and on the three that read, and `frame/plan.md` *Alternatives considered*, the row on a new name.
- Whether `test/built-app.ts` changes: it does not. `frame/plan.md` *Overlap with the release*, the row of #149.
- Whether the issue's comment changes the request: it does not. `frame/design.md` *Grounding*.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Does a person's start of the built app still show the macOS banner when a pane behind another comes to wait, and does a click on it bring the window forward and open the work item's view? No probe of an agent's can answer it: `docs/architecture.md` *Measure before building* has every agent's start set `OWLERY_BACKGROUND=1`, and a start without it takes the owner's keyboard and draws the banner this issue is about | a measurement: the owner's run of the app as it ships, at the release's walk | It shows and opens the view: nothing follows. It does not: the page's wiring of `chooseNotifier` or the preload's `background` is wrong for a person's start, and the finding goes to a fix pass of this work item | Taken as unchanged. `test/notifier.test.ts` holds that `system` is called outside the background, and the review reads that the page hands `window.owlery.background` and a `system` that constructs `Notification` | open |
