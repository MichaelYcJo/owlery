# Questions for the planner: 1795178893-keep-awake

The issue left these judgments open, and the tree or a probe answered each. Nobody reopens them without opening what is named.

- Whether the daemon or the app holds the block: `frame/plan.md` *Alternatives considered*, the first four rows.
- How the block is held, and how it ends with the daemon: `frame/plan.md` *Alternatives considered*, the rows on `caffeinate`, and `frame/design.md` *Grounding*, the probe of `caffeinate -i -w`.
- Where the setting lives and how it reaches the daemon: `frame/plan.md` *Alternatives considered*, the two rows on the choice.
- Which sessions count as an agent at work: `frame/design.md` *Grounding*, the second policy clause, and *Scope* item 2.
- What "Always" means for a daemon that exits by itself: `frame/design.md` *Scope*, the paragraph under the items, and `frame/plan.md` *Alternatives considered*, the last row.
- Where the control stands and what the status line says: `frame/plan.md` *Alternatives considered*, the rows on the status line and on a settings screen.
- What a window shows against a daemon of an earlier build: `frame/design.md` *Grounding*, the fact on `PaneKindInfo.continues`, and *Scope* item 9.
- How a case reads the block without leaving one behind: `frame/plan.md` *Technical context*, the constraints on the cases.
- Which of the release's work items merges first: `frame/plan.md` *Overlap with the release*.

No row is a person's to decide, and none blocks the build. The row below names why neither the tree nor the framer's probe answered it.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | In the built app as it ships, with an agent working and the Mac left alone past its own idle sleep time: does the Mac stay awake while the display sleeps, on battery and on power? Does the Mac sleep when the lid closes while the agent works? Under "Never", does it sleep as its settings say? The framer's probe read the assertion `caffeinate -i -w` takes and the manual's lines for its flags (`frame/design.md` *Grounding*). No probe and no case can wait out the owner's idle sleep time or close the lid, and both would put the machine every other agent runs on to sleep | a measurement: the owner's hand run in the built app, before the release | (a) All hold: nothing changes. (b) The Mac sleeps under a working agent though the status line says it is kept awake: the assertion `-i` takes is not enough on that Mac, a defect of this work, and the owner's finding names the power source it happened on. (c) The lid no longer puts the Mac to sleep: the same | (a): the build stands as designed, and phase 2 writes the row into `gaps.md` *Not verified* with the owner as its answerer | open |
