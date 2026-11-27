# Questions for the planner: two built-app cases wait on what they read (#244, #207)

Judgments the issues and the spawn left open, which the tree and the runner's logs answered. Each stands where its grounds are, and none is a row below.

- Why the records dialog did not close on the runner: `frame/design.md` *Grounding*, cause 2.
- Why #301's first run failed eight cases, which the spawn names as a records dialog: `frame/design.md` *Grounding*, the table of runs and cause 1. It was the removal dialog's case.
- Whether a dialog left open reaches other files: `frame/design.md` *Grounding*, the second row of the table of clauses. It does not.
- Why the reloaded page did not show the notice, and whether a longer wait would pass: `frame/design.md` *Grounding*, cause 3.
- Whether the helper's click should aim again where its element moved: `frame/plan.md` *Alternatives considered*, the second row.
- Whether the work closes what a passing case leaves open: `frame/plan.md` *Alternatives considered*, the fifth row.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Do first attempts of `check` on the hosted runner stop failing the removal case, the register case and the old-CLI case once this work is merged? The tree could not answer it, and no probe could: causes 2 and 3 are shown as mechanisms on this Mac and inferred for the runner, whose logs hold neither the place of a press nor the status line's text, and no agent may start, rerun or dispatch a workflow run. | a measurement | The first attempts of later pull requests' `check` pass these cases: the issues stay closed. One fails again: its message now holds the status line's text or the press that missed (*Scope* items 5 and 6), and the issue is reopened with it. | #244 and #207 close when the pull request merges. | open |
| Q2 | Why did the press of "+ Shell" make no fourth tab in `machine-dialog.test.ts:317`, in the gate run the orchestrator named? The tree could not answer it: the output holds the wait's message alone, the file passed three runs by itself, and a probe would have to meet the same load. | a measurement | The next failure of that wait names where the press landed (*Scope* item 6): a press that missed puts it in this work's class, and a press that landed points at the product's draw of the pane buttons. | Out of scope for this work. | open |
