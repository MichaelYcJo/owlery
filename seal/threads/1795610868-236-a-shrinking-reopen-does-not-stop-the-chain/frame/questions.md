# Questions for the planner: 1795610868-236-a-shrinking-reopen-does-not-stop-the-chain

The work item's `routing.md` answers `Automation` `yes`, so every row below runs on its default, and nothing waits on an answer.

The judgments the issue left open that the tree answered, each with its grounds where it is pointed at:

- Which rule replaces "one of them is enough for `no`": `plan.md` *Alternatives considered*, rows A and B.
- Whether the chain stops at all where a `no` would only restart the same fix pass: `plan.md` *Alternatives considered*, rows B, C and D.
- Whether a records-only `regression:` line stays a signal: `plan.md` *Alternatives considered*, row H.
- How the third signal counts a records-only finding (round-1#1): `plan.md` *Alternatives considered*, row B1.
- Whether a crafter's fix pass writes the frame lines that state the fact it corrects (round-1#2): `plan.md` *Alternatives considered*, rows J, K and L; and that those lines are the three frame files' and not `routing.md`'s (round-2#1): row M.
- Whether AgenticSeal needs a matching issue: `frame/design.md` *Grounding*, the two AgenticSeal 0.39.0 rows, and *The paired AgenticSeal issue*.
- Whether the policy root changes: `frame/design.md` `## Rule changes`.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | The issue asks that cases cover the judgment on records shaped like #225's run. The judgment is a model's, and no real `claude` run may spend the owner's usage in this run. Is a pin of the rule's text, with the model's judgment seen at the owner's walk, what the issue accepts? The tree cannot answer what the owner accepts, and no probe can run the model here. | a person | `text pins`: `role-bundle.test.ts` pins each new sentence, seen red, and the walk (#184) shows the model's reading. `stand-in case`: a `chain.test.ts` case with a stand-in that answers `yes`, which passes against the old text too and pins nothing (`plan.md` *Alternatives considered*, row I). `real run`: a probe through the real CLI on #225-shaped records, which spends the owner's usage. | `text pins`, and the model's judgment labelled `unverified` with the walk (#184) as its answerer | open |
| Q2 | A pane's chain command applies no round ceiling. Under *Scope* item 4 a records-only finding no longer stops a pane's chain by the judgment, so such a chain is bounded only by the session and the person. Should a pane carry the daemon's ceiling? What a pane should bound is what the product should be, which no document of the tree decides. | a person | `no ceiling in this work`: the pane stays as it is, and *What the daemon could do beyond the issue* item 3 becomes an issue. `ceiling now`: `chain-command.ts#owed` stops at `ROUNDS_CEILING`, which widens this work into code that #223 also changes. | `no ceiling in this work`, with the issue filed by the orchestrator | open |
| Q3 | Does the model, judging by the new rule, answer `converging: yes` on #225's records and still `no` on a code fix that did not hold? Only a run of the model answers it, and none may run here. | a measurement | `walk`: the owner's walk (#184) reads the judgments the chain records. `probe`: a run through the real CLI on fixture records, when the owner allows the usage. | The walk (#184) | open |
