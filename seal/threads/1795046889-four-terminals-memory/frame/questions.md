# Questions for the planner: four visible terminals keep the app under about 500 MB

Judgments the ticket (#9) left open that the tree answered. None is a question any more.

- Whether "four visible terminals" asks the window to show four, or only the measurement to reach four: `frame/plan.md` *Alternatives considered*, the row on a layout only the script can reach.
- Whether a hidden pane's terminal is kept, disposed of or reused: `frame/plan.md` *Alternatives considered*, its first two rows.
- Whether the protocol needs a `detach`: `frame/design.md` *Grounding*, the bullet on `apps/desktop/src/daemon/daemon.ts`.
- Whether the daemon goes on replaying raw output: `frame/plan.md` *Alternatives considered*, the two rows on the screen state and the raw output.
- Where an exited pane's last line comes from once the window holds no terminal for it: `frame/plan.md` *Alternatives considered*, the row on the exit code.
- How the memory is read: `frame/plan.md` *Alternatives considered*, the row on RSS and `app.getAppMetrics()`.
- What "the app itself" counts: `frame/design.md` *Grounding*, the row on *Memory design* row 4, and *Scope* item 6.
- Whether the measurement joins the suite or the gate: `frame/plan.md` *Alternatives considered*, the row on a threshold.
- Where the number and its method are written: `frame/plan.md` *Alternatives considered*, the row on `docs/`.
- Whether the work measures before it builds: `frame/plan.md` *Alternatives considered*, its last row.
- Which of this work and issues #18, #19 and #10 merges first: `frame/plan.md` *Overlap with the release*.

These assumptions are written down and not asked, because either answer of each changes a line or two of the build or none:

- "Under about 500 MB" is read as every sample at or under 500 MB. A higher number is written into `apps/desktop/measurements/memory.md` as not meeting the target, and the file's first lines say so (`frame/design.md` *Scope* item 7).
- The shells the script's panes run are summed apart, with the agents' processes, because they are the panes' processes and not the app's. The table gives both sums, so the other reading is one addition away (`frame/design.md` *Scope* item 6).
- The app is measured at the size its window opens at and on the displays the measuring machine has, and the file names both (`frame/design.md` *Scope* item 7).
- A free screen stays in the pool. What that holds while the inbox is in front is reported, and a cap on it is the owner's, by `docs/roadmap.md` *Open decisions* (`frame/design.md` *Scope* items 2 and 9).
- Scenario 11 reads "does not grow" as within 5%, a number this frame chose so that the comparison can fail. The earlier measurement's samples agreed within 1% inside one run (`frame/design.md` *Grounding*, the uncommitted notes).
- "Side by side" is one state for the whole window and is off at each load (`frame/design.md` *Scope* item 1).

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | How does a person put four terminals on screen in a work item's view? The tree cannot answer it and no probe can: issue #18's frame shows one terminal at a time and hands "several panes side by side" to this issue undecided, direction B's artboards draw one terminal at the centre of a view, and no document says what the product shows beyond that. It is a decision about what the product is. | a person | (a) One control, "Side by side", that shows the work item's panes as fixed tiles, up to four: the smallest build, and a tile is about 400 pixels wide at the default window size. (b) Splits a person makes, drags and resizes: the layout of a terminal multiplexer, a larger build, and a layout to keep across reloads, which `docs/product.md` *What we deliberately don't do* reads against. (c) One pane at a time stays the product, and the script alone reaches four through a switch no control offers: no new control, the published number describes a screen no person can open, and the `add` on `docs/architecture.md` *Memory design* and its Korean edition leaves `frame/design.md` *Rule changes*. (d) Tiles of the four most recent panes of any work item: a view stops being one work item's. | (a), as `frame/design.md` *Scope* item 1 states it. Phase 3 builds on it. Phases 1 and 2 build the same under every option. | open |
| Q2 | Do four visible terminals keep the app itself at or under 500 MB in this app? No probe could run when the frame was written: no commit holds a window that shows four terminals, and the built app's daemon does not start under the framer's scratch directory, whose hook socket path is 167 bytes against the 104 macOS allows (issue #19). The earlier 460 MB was a bare window with no daemon, at 1200 by 800. | a measurement | At or under: scenario 10 holds and the issue's line is done. Over: Q3. Phase 1's table for `one`, read against the earlier 417 MB, gives the first sign. | The plan is built as if it holds. Phase 3's run of scenario `four` answers it, and the sealer's run answers it again. | open |
| Q3 | Where Q2's number is over 500 MB, what is taken out to bring it under? It cannot be known before the per-process table of scenario `four` exists, which says whether the GPU process, the renderer or the daemon holds the excess. | the work | A change that alters nothing a person sees or does, such as what the pool or the daemon keeps: phase 3 makes it, measures again and records both numbers. A change a person would see, such as the DOM renderer in place of WebGL, a smaller window at start or a lower cap than four: phase 3 does not make it. | Phase 3 takes the changes of the first kind alone. Where the number is still over, the file says the target is not met, with the table, and the phase record names the change of the second kind the table points at, for the orchestrator to take to the owner. | open |
