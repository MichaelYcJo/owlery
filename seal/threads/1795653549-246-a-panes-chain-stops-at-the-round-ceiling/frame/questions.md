# Questions for the planner: a pane's chain stops at the round ceiling

The work item's `routing.md` answers `Automation` `yes`, so every row below runs on its default, and nothing waits on an answer.

The judgments the issue left open that the tree answered, each with its grounds where it is pointed at:

- Whether a pane's chain takes the daemon's ceiling or keeps none: `plan.md` *Alternatives considered*, rows A and B.
- Whether the stop holds in a run under `Automation` `yes`: `frame/design.md` *Grounding*, the row on `chain.ts:52-53`, and `plan.md` *Alternatives considered*, row H.
- Whether `fix-pass` refuses as well as `owed`: `plan.md` *Alternatives considered*, row C.
- Whether the person's word is an option or a record: `plan.md` *Alternatives considered*, rows D and G.
- Whether the stop is a step or a refusal: `plan.md` *Alternatives considered*, row F.
- Whether AgenticSeal holds the same defect: `frame/design.md` *Grounding*, the row on `docs/roadmap.md` and AgenticSeal 0.39.1.
- Whether the policy root changes: `frame/design.md` `## Rule changes`.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | A pane's session passes the ceiling's stop by typing `--persons-word <round>`, and the command cannot tell whether the person said to go on. Is a bound the session can pass by stating the person's word bound enough for a pane, or should the pass be an act of the person's own in the app? What a pane's chain should hold a session to is what the product should be. No document of the tree decides it, and no probe can. | a person | `the option`: the session states the person's word in a command the person can read in the pane, and nothing of the app changes. `the app`: the person passes the stop in Owlery's window, the daemon hands the pass to the command, and a session cannot pass it. That needs the daemon to know of a pane's stage, which #223 builds, so it is an issue after #223. | `the option`, as `frame/design.md` *Scope* items 2 and 3 build it | open |
| Q2 | Does a real pane's session stop at the step `ceiling`, tell the person, and pass `--persons-word` only after the person's word, under `Automation` `yes` as well? Only a run of the model answers it, and no real `claude` session may spend the owner's usage in this run. | a measurement | `walk`: the owner's walk (#184) reads what a session does at the stop in a run that reaches round 6. The built command takes no lower ceiling, so the walk meets the stop only in such a run. `probe`: a run through the real CLI on fixture records that hold six rounds, when the owner allows the usage. | The walk (#184), with the session's reading labelled `unverified` until then | open |
