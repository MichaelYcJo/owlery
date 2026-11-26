# Questions for the planner: a turn that ends on an API error stops working

The issue and `routing.md` left these judgments to the frame, and the tree, the hooks reference and the installed CLI answered each. No row below reopens one.

- Where the event's shape comes from when no API error can be made on demand: `frame/design.md` *Grounding*, the table of the event's shape.
- Where the event's name is added so it reaches the daemon and is read, and whether the role bundle or a pane's own settings name the events: `frame/design.md` *Grounding*, the paragraphs on the cause and on where the hooks are registered.
- Which state the session takes, and under which neutral event: `frame/plan.md` *Alternatives considered*, the rows on `turn-failed`, `turn-end`, `notification` and a fourth state.
- Whether the lists that name the events stay: `frame/plan.md` *Alternatives considered*, the row on replacing them.
- Which of #231, #133 and #78 merges first: `frame/plan.md` *Overlap with the release*.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | May the build run one real `claude` process to record the event, in place of the reference's example? The tree cannot answer it and no probe could: `routing.md` *Why this way* allows a real `claude` session in this work only where this file names one, and the allowance is the owner's. The run would start `claude` once in a pseudo-terminal with a settings file of the test's own, `ANTHROPIC_BASE_URL` set to a stand-in server on the loopback address that answers every request with an error, and a key that is no real key. No request would reach Anthropic and no account's use would be spent. Whether `claude` sends `StopFailure` under those conditions, and after how many retries of its own, is not known until it runs. | a person | **Not run.** The fixture holds the reference's example with the page's date and the CLI's version, which the issue's second *Done when* line allows ("recorded or taken from the hook reference with its version named"). That a real session sends the event in that shape, with no `Stop` after it, stays unverified, and the builder carries it into `gaps.md` *Not verified* with the owner as its answerer. **Run once.** The fixture becomes a recording, as `claude-interrupted-turn.json` is, and the row closes. It costs one start of a real `claude` on the build machine and the stand-in server's code under `apps/desktop/test/`. | Not run. The build goes on with the reference's example and does not wait for this row. | open |
