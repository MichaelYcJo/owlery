# Questions for the planner: the Korean input regression test runs and passes

What the ticket left open and the tree or a probe answered. Each line points at the grounds and restates none of them.

- How the test runs, automated, typed, or both: `frame/plan.md` *Alternatives considered*, its first three rows.
- Whether composition events made inside the page can stand for typing: `frame/design.md` *Grounding*, probe 1.
- Whether composition sent through the debugging port reaches the pane's process, and under what pace: `frame/design.md` *Grounding*, probes 1 and 2.
- Whether the test needs a switch in the app's code: `frame/design.md` *Grounding*, the row on what is chosen from outside the app's code.
- Whether the suite's runner can start the app, or a second runner is needed: `frame/plan.md` *Alternatives considered*, the row on Playwright.
- Whether the roadmap's text is edited in this pull request or stated for the settle: `frame/design.md` *Grounding*, the last row of its table, and `frame/plan.md` *Alternatives considered*, the row on editing `docs/roadmap.md`.
- Whether the pull request waits for a person's typed run: `frame/design.md` *Scope* item 13, an assumption the owner can overturn by typing first.
- Which of issues #18, #9 and #19 merges before this work: `frame/plan.md` *Overlap with the release*.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Which events does a macOS Korean input source produce in the pane for each line, the order of the last syllable's commit and Enter's keydown among them, and does their replay through the debugging port deliver the bytes the typing delivered? The tree does not hold it: the owner's check of 2026-11-18 recorded the bytes and no events. No probe could give it: an agent has no keyboard, and posting system key events would need the Accessibility permission and would take over the owner's keyboard and input source. The owner answers it by making the typed run of `frame/design.md` scenario 7 | a measurement | (a) The replay of the recorded events delivers each line's bytes: every line of the fixture becomes `source: "typed"`, and the case replays a person's typing from then on. (b) The typing matches and a line's replay differs: that line keeps its assumed steps and is named under `replayDiffers`, and what the debugging port cannot reproduce becomes a follow-up issue. (c) The typing itself delivers other bytes: Korean input in the pane is broken, the typed run fails, and the repair is an issue of its own that the release waits for | The steps written by hand in the order probe 2 delivered, a commit before the next key's composition and before Enter's keydown, marked `source: "assumed"` | open |
