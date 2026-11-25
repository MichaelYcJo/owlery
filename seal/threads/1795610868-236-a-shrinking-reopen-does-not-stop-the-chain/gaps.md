# Closing memo: a shrinking reopen does not stop the chain

## Not verified

| Item | Who must answer |
|---|---|
| Whether a crafter and a pane's session that make a fix pass follow the new text of `skills/implement/fix-pass.md` and `agents/crafter.md`: whether they read the range and the work item's records whole, correct a fact at every place that states it, and name the search and the places in the close block's `answer:`. The pins hold the sentences. No model was run on them, because no real `claude` run may spend the owner's usage in this run (`frame/questions.md` Q1). | The owner's walk (#184) |
| Whether a crafter that makes a fix pass, in the daemon's role session or as a pane's subagent, corrects a line of the frame that states the fact a finding corrects, and writes in a close block's `answer:` what its hand-back would otherwise name, by the text of `agents/crafter.md` that round 1's fix pass wrote at `02b2302b`. The pins hold the sentences, and no model was run on them (`frame/questions.md` Q1). | The owner's walk (#184) |
| Whether the orchestrator and a pane's session, judging by the new text of `agents/orchestrator.md`, answer `converging: yes` on records shaped like #225's run, whose findings from round 2 on stand in the work item's records alone, and still answer `no` on a fix in the code that did not hold. The pins hold the sentences, and no model was run on them, for the reason of the row above (`frame/questions.md` Q1 and Q3). | The owner's walk (#184) |
| The whole suite, the repository-wide lint and the typecheck at the work item's head. Phase 1 ran `test/role-bundle.test.ts`, `test/chain-command.test.ts`, `test/heavy-run.test.ts` and the desktop app's `tsc --noEmit` at `02b11fda` (`trail/phases/phase-1.md`). Phase 2 ran the sets `trail/phases/phase-2.md` names at the commit it names. | The broad gate |
| closed whether `test/heavy-run.test.ts` "keeps one line for the run in the run folder's file ... (scenario I)" passes on a machine whose memory compressor took a zeroed 64 MiB `bytearray`: in phase 2 it timed out there (`trail/phases/phase-2.md`). #247, merged into `release/v0.0.5` at `5f58752b` and into this branch at `6ae3535b`, rewrote the case to hold random pages it writes every 50 ms (`heavy-run.test.ts:118-119`), so the zeroed `bytearray` this row asked about is no longer in the tree, and the broad gate runs the new case with the whole suite (the row above). This work item's range changes neither the case nor the code it covers. | #247 (`5f58752b`); its issue #245 stays open until the release reaches `main` |

## Not done

nothing
