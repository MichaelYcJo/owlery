# Design: 1795388700-review-rounds

Issue #41: the daemon cannot run review rounds and fix passes on a branch.

Three words of this frame are used in one sense each. The **chain** is what the daemon runs for one work item after "Get a seal": in this work item, the review rounds, the fix passes and the orchestrator's judgments and rulings. A **stage** is one role session the chain runs: a round, a fix pass, a judgment or a ruling. The **step owed** is the stage the chain runs next, or the state it rests in.

## Grounding

The tree as read at `617a7c4`. Each row is labelled `read` where a file was opened and `executed` where a command gave the fact.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Code runs the order, the orchestrator judges* (read) | The order of the stages is daemon code. Whether the rounds are converging is the orchestrator agent's judgment, and so is whether a later question parks its work item. A question that arises in the run is first decided from the code and the policy and recorded as a decision made without asking |
| `docs/architecture.md` *What we take from AgenticSeal*, the row of the four invariants (read) | Two bind this work: no review without a build, and no fix that no round reads. The daemon's code and the pull request check both hold them |
| `docs/architecture.md` *What changes because Owlery is not a plugin*, the row "Each party judges only its own subject" (read) | A proofer holds no tool that writes a file. `apps/desktop/src/daemon/role-grants.ts#GRANTS` gives a proofer `writes: "nowhere"` and `runs: false`, and a crafter at a fix pass `writes: "worktree"` and `runs: true` |
| `docs/architecture.md` *Records are committed to the repository* and *State lives in three places* (read) | Every record of the chain is committed in the work item's worktree. Progress is the daemon's state |
| `docs/architecture.md` *Memory design*, the row "Claude processes for finished stages of the AgenticSeal process are ended" (read) | A stage's process is ended before the next stage starts |
| `docs/architecture.md` *What a session survives* (read) | A chain that the daemon's end cut starts the cut stage again from the records. Issue #55, in release 0.0.3, builds the start that needs no person. This work builds the start on the person's word |
| `docs/architecture.md` *Build order* (read) | A branch built in the person's own Claude Code session is recorded with `Implementation` answered `the session` |
| `docs/architecture.md` *Rules that keep it portable* (read) | The protocol carries no vendor's field, and the fake adapter runs every flow the Claude adapter runs |
| `docs/design.md` *Components and their states*, *The voice of the window's words* and *A pull request that changes the window carries its screenshots* (read) | The form of a button, the words of a state, and the screenshots a change of the window owes |
| `docs/roadmap.md` *Milestones* row 2 and *Releases and the tracker* (read) | This work is part of milestone 2 and merges into `release/v0.0.2` by squash |

What earlier work items decided, which this frame does not argue again:

| Record | What it fixes for this work |
|---|---|
| `seal/threads/1795338000-role-tools-and-permissions/frame/design.md` *Scope* items 18, 19 and 22 (read) | This work decides how a proofer's round record reaches the tree, names the folder a stage works in, and keeps the record of the calls a role's rule refused. A proofer's command that reaches the daemon is refused, so a round reads and does not execute |
| `seal/threads/1795329620-role-bundle/frame/design.md` *Scope* item 14 (read) | This work rewrites the proofer's and the crafter's texts of the role bundle for the records the daemon commits |
| `seal/threads/1795330500-no-question-holds-the-run/frame/design.md` *Scope*, the lines that name #41 (read) | The chain calls `Daemon#decided` and `Daemon#park`. The answer in the app resumes the chain. The convergence judgment is recorded with `Daemon#decided`. A `reversed` decision is taken in by a stage, which writes `applied` with its commit through `decision-record.ts#withApplied`. The first stage of "Get a seal" makes the work item's directory and its `routing.md` |
| `seal/threads/1795338001-records-place-and-pr-check/gaps.md`, the paragraphs on a link below `threads/` and on the round record's kinds (read) | The writer of a record checks its path before it writes, and the reader of a round record's kinds is this work's |
| `seal/threads/1795268972-headless-failure-and-limit/frame/questions.md` Q3 and Q4 (read) | Whether a tool's process stays in the CLI's process group, and whether one limit of 60 minutes fits every stage, are measurements of the first real stages. They stay open (`frame/questions.md` Q3) |

What the tree holds, at `617a7c4`:

- **No message starts a chain, and no control names "Get a seal".** Read: `apps/desktop/src/shared/protocol.ts` `ClientMessage` holds no such message. Executed: `grep -rn -i 'get a seal\|getSeal\|approval line' apps/desktop/src` printed nothing.
- **A role session is a headless session.** Read: `apps/desktop/src/daemon/daemon.ts#startHeadless` starts it through `RoleAdapter.start`, answers its permission requests with `role-grants.ts#verdictOn`, holds it to `HEADLESS_LIMIT_MS`, and keeps what its events say. The `ask` case of `Daemon#handle` builds the session inline.
- **The pairs a session is launched as are three.** Read: `protocol.ts#ROLE_STAGES` lists a proofer at `round`, a crafter at `fix-pass` and a sealer at `seal`. No pair is the orchestrator's, and `apps/desktop/role-bundle/agents/` holds no `orchestrator.md`.
- **The bundle's texts still describe AgenticSeal's run.** Read: `apps/desktop/role-bundle/agents/proofer.md` has the proofer clone the repository, write `round-N.md`, and run `chain_check.py`. `apps/desktop/role-bundle/docs/forms/the-round-record.md` names the orchestrator as the party that commits the record.
- **The daemon reads four kinds of `seal` block and none of a round record.** Read: `apps/desktop/src/daemon/record-blocks.ts` holds `VERDICT_BLOCK`, `RUN_BLOCK`, `DECISION_BLOCK` and `QUESTION_BLOCK`. `pr-check/lib/fields.py` spells the round record's four kinds: `ROUND_BLOCK`, `FINDING_BLOCK`, `CLOSE_BLOCK` and `CONFIRMATION_BLOCK`.
- **The daemon commits one file at a time.** Read: `apps/desktop/src/daemon/worktrees.ts#commitAlone` adds and commits one path with a subject and a trailer, after `whyNoCommit` allows it. Its one caller is `Daemon#commitWord`.
- **`decision-record.ts#workItemDirectory` finds the directory by the `Branch` row of `routing.md`, and a rename of the branch leaves the row.** Read: the `renameWorkItem` case of `Daemon#handle` calls `renameBranch` and `store.setWorkItem` and writes no file of the worktree.
- **The window lists a work item's headless sessions with a stop control.** Read: `apps/desktop/src/renderer/work-item-view.ts:656-709` draws each headless session of the work item, and line 688 sends `stopHeadless`.
- **A work item's line reads its state from its panes, its questions and its permission requests.** Read: `apps/desktop/src/renderer/view.ts#inboxLine`.
- **The stored work item keeps its worktree's setup, and a setup that ran when the daemon ended is read as failed at the next start.** Read: `apps/desktop/src/daemon/repositories.ts` imports `DAEMON_STOPPED` from `worktree-setup.ts`. The chain's stored state follows this form.

What the probes gave. Both ran `pr-check/` of a `git clone --no-local` of this worktree at `617a7c4`, against a repository made under the framer's scratch directory. No real `claude` ran, and no check of this repository ran.

- **The record set this frame has the daemon write passes the check's records arm.** Executed: `sh test_tmp_chain_records.sh`. A branch held a `routing.md` with `Planning` and `Implementation` answered `the session`, `trail/rounds/round-1.md` with one finding closed `fixed <commit>`, `trail/rounds/round-2.md` with the target `<sha>, fixes <a>..<b>` and one `confirms:` block, `decisions.md` and `trail/refusals.md`, and no `frame/design.md` and no `gaps.md`. `python3 -B chain_check.py --baseline main --sealing` under a ready payload exited 0 and named only `trail/gate.md`, `guarantee.md` and `pr.md`, each as printed and not failed. Without `--sealing` it exited 1 on those alone.
- **The check names the two steps the order has to take.** Executed, the same probe. After round 1 it exited 1 with "no close block, so the finding is open". After the fix pass and before round 2 it exited 1 with "a verifying round is owed", once for the `fixed` finding that no later round read and once for the last target behind HEAD.
- **A `routing.md` with no `Automation` row is a declaration, and the check judges every directory that names the branch.** Executed: `sh test_tmp_routing_rows.sh`. The check judged the work item with that row left out. With two directories whose `routing.md` named the branch it judged both.

- **The reader the check uses parses this design's `## Rule changes`.** Executed: `python3 -B test_tmp_rule_changes.py`, which loads `pr-check/skills/settle/scripts/rule_changes.py` of the clone and calls `parse` on this file as it stood before *Scope* items 8 and 9 gained their sentences on the stored stages. It returned every operation of the section, no error and nothing unread. Each of the two `from` values stands in the section it names, and each of the four other sections stands once in its file. The first run of the probe called `parse` with one argument and stopped there, and the run reported here is the second.
- **The policy root holds no index.** Executed: `ls docs/README.md` found no file. Each `file:` of `## Rule changes` is a document of `docs/` read at this commit, and each English one has a `.ko.md` edition beside it, so each operation carries one on that edition.
- **No release holds a process change to read.** Executed: `gh release view --json tagName,body` printed no `### Process changes` heading, and `grep -l 'Process changes' seal/threads/*/changelog.md` named no file.

The ticket as handed over. The spawn hands the issue whole, body and five comments, in `issue.md` of the scratchpad, read by the orchestrator with `gh issue view 41` on 2026-11-23 (read). The comments carry four additions, which *Scope* takes in: the stages are the callers of `Daemon#decided` and `Daemon#park` (items 11 and 12), each refusal by a role's rule is kept with the run (item 20), the record's writer checks its path before each write (item 18), and a rename of the branch rewrites the `Branch` row (item 21).

Not shown by anything in this frame: a real proofer's, crafter's or orchestrator's session. The owner's rule of this run starts no real `claude`. `frame/questions.md` Q2 names what the first real chain measures.

## Scope

### The start

1. **A client starts the chain with one message, `getSeal`.** The daemon answers `done` once the chain has started, before the `inbox` that carries it, and `error` with one sentence where it refuses. It refuses, and starts nothing, for each of these: a work item `Daemon#worktreeFor` refuses; a chain of the work item that is running; a live pane of the work item whose state is `working`, or a headless session of it that is working; a worktree `worktrees.ts#whyNoCommit` refuses; a worktree that holds a tracked file with a change no commit holds, or an untracked file, outside the work item's directory; a worktree with no records root; two directories whose `routing.md` names the branch; a work item whose `baseCommit` is null; a branch that holds no commit after `baseCommit`; an adapter that does not declare both features of `ROLE_FEATURES`; and a work item whose record holds an `open` question.
2. **The first start makes the work item's directory.** Where no `routing.md` under `<root>/threads/` names the branch, the daemon makes `<root>/threads/<seconds>-<slug>/routing.md` and commits it alone, before the first round, so the round's target holds it. `<seconds>` is the daemon's clock in whole seconds and `<slug>` is `worktrees.ts#slugFor` of the branch's last part. *Data & interfaces* gives the file's text.
3. **A running chain holds the daemon and the Mac as a working agent does.** Between two stages no headless session is working. The daemon does not ask to exit for idleness while a chain is running, and "While an agent works" holds the Mac awake for the same time. A client that disconnects changes nothing of a chain.

### The order

4. **One function decides the step owed, from the records and git alone.** It reads the work item's round records, its `decisions.md`, the branch's head and the commits after the last record's target. It is a function of those values and holds no state. The daemon calls it at a start and after each stage. The table gives the step for each reading, the first row that holds deciding.

   | What the records and git say | The step owed |
   |---|---|
   | `decisions.md` holds an `open` question | The chain is `parked`, and no stage starts |
   | No round record stands | Round 1, on the branch against its base |
   | The last record holds a finding with no close block | A fix pass on that record, after the judgment of item 9 where it is owed |
   | A decision stands `reversed` | A fix pass that takes the reversals in (item 12) |
   | The last record holds a `fixed` or `rejected` finding, or a commit after its target changes a path outside the work item's directory | A verifying round, on the commits after the last target |
   | None of the above | The chain is `reviewed` at the branch's head |

5. **A round is a fresh proofer session that reads files only, in the work item's worktree.** The daemon launches a proofer at `round` with the worktree as its folder. The prompt holds the round's number, the work item's directory, the `target:` line the record must carry, the paths the reviewed commits changed, their diff as far as `PROMPT_DIFF_CHARS` allows, the paths of the earlier round records, and the path of `decisions.md` where it stands. Round 1's target is `<head> against <base>`, where `<base>` is the work item's `baseBranch` where the round block's `target:` line takes that name (`record-blocks.ts#ROUND_BASE`), and its `baseCommit` otherwise (`chain.ts#roundBase`). A verifying round's target is `<head>, fixes <a>..<head>`, where `<a>` is the last record's target.
6. **A proofer's answer is its round record.** When the round's session has finished, the daemon takes the answer from its first line that begins `# Review round ` to its end. It reads that text with the reader of item 16. It writes the record to `trail/rounds/round-<N>.md` and commits it where every one of these holds: the heading names this round and this directory; the reader refuses no line; the `target:` line is the one the prompt gave; no finding holds a close block; round 1's record holds no `confirms:`, `reopens:` or `regression:` line, and in a later round each such line names an earlier round record of this work item and, where it names a finding, one that record holds; in a verifying round, each `fixed` or `rejected` finding of the record before it is named by a `confirms:`, a `reopens:` or a `regression:` line; and the worktree's head is still the target and the worktree holds no change outside the work item's directory. Where one does not hold, no record is written, and the chain stops with a sentence that says which.
7. **A fix pass is a crafter session in the worktree, and the daemon commits the record after it.** The daemon launches a crafter at `fix-pass`. The prompt holds the path of the round record, the numbers of its open findings, the `reversed` decisions with the person's message for each, and the path of `decisions.md`. The crafter commits its fixes itself and appends one close block under each finding it answers. When the session has finished, the daemon reads the record in the worktree. It commits the record where every one of these holds: the record differs from the committed one by close blocks alone, each with the blank lines directly above and below it; the reader refuses no line; each `fixed <commit>` names a commit that the branch's head holds and the round's target does not, and that changed a path a `location:` line of the finding or of its close block names, or a path under one (`worktrees.ts#pathsOfCommit`); and the worktree holds no change outside the work item's directory. Where one does not hold, nothing is committed, and the chain stops with a sentence that says which.
8. **A fix pass that leaves a finding open and raises no question stops the chain.** A second fix pass on one record, which follows a decided question (item 11), stops the chain where it too leaves a finding open. It stops the chain whatever it asks, and its questions get no ruling: the pass before it on that record already had its question decided or answered. The daemon reads from the chain's stored stages whether a fix pass on that record already finished.
9. **Before the second fix pass and each later one, the daemon asks the orchestrator agent whether the rounds are converging.** The first fix pass, on round 1's record, follows with no judgment. The first fix pass on the record of round 2 or a later round is owed a judgment first where that record holds an open finding. A fix pass on a record with no open finding, which takes in reversals alone (item 12), is owed none, and neither is a second fix pass on one record (item 8), since the first passed the gate. The order's function does not decide this: it names the fix pass, and `chain.ts#gateBefore` decides what comes before it. Within one run, a `yes` the run received after that round lets the fix pass start, and the run asks no second time. The chain's stored stages are read for the judgment only at the first step of a start a person's `getSeal` made. The daemon launches the orchestrator at `judgment` with the paths of every round record. The answer holds one block that reads `converging: yes` or `converging: no`, with its grounds. The daemon records the answer with `Daemon#decided`, as a decision of the kind `route` made by `orchestrator`, and commits `decisions.md`. `yes` starts the fix pass. `no` stops the chain, and the work item's words say that the rounds are not converging. Where the person then sends `getSeal` again, their start is the answer: at its first step the chain's last stored stage is a judgment after that round that finished, and the fix pass on that record starts with no second judgment. A ruling on a stage's questions (item 11) is stored as a stage of its own kind, `ruling`, so a chain that stopped between a ruling and the judgment of convergence it owed is asked that judgment at the person's next start.
10. **A ceiling of rounds stops the chain whatever the judgment.** Where round `ROUNDS_CEILING` or any later round leaves a finding open, the chain stops before the fix pass on its record and asks no judgment. A later `getSeal` is the person's answer: at its first step the fix pass on that record starts with no judgment, and the verifying round after it runs. Where that round leaves a finding open too, the chain stops again, so past the ceiling each further round is the person's to start. A record with no open finding and a second fix pass on one record meet no ceiling, as they are owed no judgment (item 9). `frame/questions.md` Q1 holds the number.
11. **A stage's question is first decided from the code and the policy, and only what they cannot answer parks the work item.** A proofer's answer may hold `asks:` blocks before the record's heading, and a crafter's answer may hold them anywhere. Where a stage's answer holds one, the daemon commits the stage's record as items 6 and 7 state, then launches the orchestrator at `judgment` with each question, as a stage of the kind `ruling`. The answer holds one block for each question: a decision with its kind, what was decided and the grounds, or a park with the grounds. The question the daemon parks holds one `grounds:` line, which joins the asking stage's grounds and the orchestrator's: why the stage could not answer it, then why the code and the policy do not (`chain.ts#parkedGrounds`). The daemon calls `Daemon#decided` for each decision and one `Daemon#park` for the questions parked, with the asking role as `by`, and commits `decisions.md`. A parked chain starts no stage. When an `answerQuestions` leaves the record with no `open` question and the work item's chain is stored `parked`, the daemon starts the chain again as a `getSeal` does, behind the refusals of item 1, and runs the step owed. That start is not a person's `getSeal` for items 9 and 10: it skips no judgment and passes no ceiling. Where it is refused, the chain is `stopped`, and its sentence says that the chain did not go on after the answers and gives the refusal. A work item whose chain is not stored `parked` starts nothing at an answer and waits for a `getSeal`. Every stage's prompt names `decisions.md`, and the bundle's texts tell each role to hold to the decisions and the answers it reads there.
12. **The next fix pass takes in each `reversed` decision.** After a fix pass whose prompt held a reversal, the daemon writes that decision `applied <head>` through `decision-record.ts#withApplied`, with the branch's head after the pass, in the commit that carries the record. Where no finding is open and a reversal stands, the fix pass runs for the reversals alone, and the verifying round after it reads its commits.
13. **A stage's process is ended before the next stage starts.** At a stage's result the daemon calls the run's `stop` and waits for the run's `exit`. Nothing of the chain starts in the worktree before that exit.
14. **A stage that fails or is stopped stops its one chain.** A session that ends `failed`, at its limit, at a client's `stopHeadless`, at an archive, a delete or a removal among them, leaves the chain `stopped` with a sentence that names the stage and why. An answer the daemon cannot read does the same. Nothing of another work item is started, stopped or refused. A later `getSeal` runs the step owed, which the records decide.
15. **The chain's state is stored with its work item, and a chain that ran when the daemon ended is read as stopped.** `StoredWorkItem` gains `chain`, as it holds `setup`. At its start the daemon reads a chain stored `running` as `stopped`, with a sentence that says the daemon ended while the stage ran. It starts no stage by itself.

### The records

16. **The daemon reads a round record with its own reader.** `record-blocks.ts` gains the kinds of a round record, each spelt as `pr-check/lib/fields.py` spells it. A new module, `round-record.ts`, reads a record's text into its round block, its findings by their headings, each finding's close block where it has one, and its confirmations, and names each line it refuses. It holds the placing rules the check holds: one round block outside every finding, one `## Findings` heading, one finding block and at most one close block in each finding's section, and no two findings of one number.
17. **The daemon commits a stage's files together, and only files of the work item's directory.** `worktrees.ts#commitAlone` becomes `commitPaths`, which takes one path or more, and `Daemon#commitWord` calls it with its one path. A stage's commit carries each of these that differs from the commit before it: the round record, `decisions.md` and `trail/refusals.md`. Each commit has the subject *Data & interfaces* gives and the trailer `Seal-Routing: <directory's name>`. It runs with the person's git identity and the repository's hooks, and nothing is pushed.
18. **Every write the daemon makes under a worktree's records root goes through one path check.** A new module, `record-writer.ts`, writes a file of a work item's directory. Before each write it reads each part of the path below the worktree's top with `lstat`, resolving no link: each folder from the worktree's top to the file is a folder and no link, a link to a folder inside the worktree refused as one outside it is; no link and nothing but a plain file stands at the file's own path; and no link stands at the path of the partial file the write goes through (`whole-file.ts#partialOf`). It makes the folders that do not stand. A write the check refuses throws a sentence that names the path, and the stage's chain stops with it. `decision-record.ts#writeRecord` writes through it, so a decision, a park, a reversal and an answer are held to the same check.
19. **A round record's text is the proofer's, and the daemon changes none of it.** The daemon writes the answer's text as item 6 takes it. It appends nothing, and it writes no close block: a finding that no fix pass answers stays open.
20. **Each call a role's rule refused is kept with its stage and in the work item's records.** `role-grants.ts#Verdict` gains, on a refusal, the name of the rule that refused. The daemon counts a stage's refusals on its `ChainStage`. At the stage's commit it appends one row for each to `trail/refusals.md`, with the stage, the role, the tool's name, what the call does and the rule's name. No row holds the call's text, a path or a command.
21. **A rename of a work item's branch rewrites the `Branch` row of its `routing.md`.** After `renameBranch`, where a directory's `routing.md` named the old branch, the daemon rewrites that one row and commits the file alone, under the rule of `Daemon#commitWord`: where a session of the work item is working, the file stands written and the next commit carries it. A rename of the branch is refused while the work item's chain is running.

### The roles

22. **The orchestrator is a fourth pair.** `ROLE_STAGES` gains `{ role: "orchestrator", stage: "judgment" }`. Its grant is a proofer's: it writes nowhere and runs no command that asks for permission. `claude-roles.ts#AT_THE_STAGE` gains its row, and the bundle gains `agents/orchestrator.md`: what the role reads, the signals that say the rounds are not converging, how a question is decided from the code and the policy, what alone parks a work item, and the forms of its answer.
23. **The bundle's texts for the proofer and the crafter say what the daemon's chain does.** In `agents/proofer.md`, `agents/crafter.md`, `skills/implement/fix-pass.md`, `docs/forms/the-round-record.md` and `README.md` of `apps/desktop/role-bundle/`, each sentence the chain makes untrue is rewritten in place: the proofer works in the worktree, runs nothing and writes nothing; its answer is the record; the daemon reads, writes and commits it; the crafter commits its fixes and appends the close blocks, and the daemon commits the record; a question goes into an `asks:` block of the answer. `## Removes` names what goes. The sentences that name another `seal` command or script stay for the issue that builds their stage.
24. **The fake adapter can act in the session's folder before it answers.** `FakeAdapterOptions` gains `work`, called with the folder, the prompt and the role before the answer's first piece, and awaited. A case's crafter commits a fix and appends a close block through it.

### The protocol and the window

25. **A work item carries its chain.** `WorkItem` gains `chain`, a `Chain` or null. A `Chain` holds its state, one of `running`, `parked`, `stopped` and `reviewed`; the sentence a window shows as it is; the commit the rounds settled at, where `reviewed`; when it took its state; and its stages, the newest `CHAIN_STAGES_KEPT` of them. A `ChainStage` holds its kind, one of `CHAIN_STAGE_KINDS`; the round it belongs to; its state; why it failed; when it started and ended; the id of its headless session; and the count of the calls its role's rule refused. No field names a vendor.
26. **The work item's view offers "Get a seal" and says where the chain stands.** A button with those words stands by the seal's place at the view's foot, where the daemon sent the work item's `chain` field, and no button is drawn where it sent none. It sends `getSeal`. The button is disabled while the chain is `running`, and while the window's own `getSeal` waits for the daemon's answer. A refusal's sentence is shown under the button. It stays there until the daemon answers the next press, and only while the chain holds the state and the `since` it held when the refusal came (`view.ts#refusedSeal`), so a chain that has run since, whoever started it, takes the refusal away. It is not drawn while the chain runs. The chain's sentence stands above the button. The stage's session is listed in the view's "Ask" section as every headless session is, with its stop control.
27. **A work item's line reads the chain.** A `running` chain makes the line's state `working` where no pane of the work item waits for the person, since the pane of the session that built the branch stays `finished` while the rounds run. A `stopped` chain makes it `waiting`. Where the chain is `stopped`, the line's second row holds the chain's sentence after a parked question and a headless session's request for permission, which keep the row, and before what the agent says. The line's age reads the chain too: a stopped chain's line counts from the chain's `since`, the time it stopped, and a line whose running chain alone says that it works shows no age. A chain that stops raises the notification a work item that begins to wait raises.
28. **The pull request carries the screenshots of the changed view.** `pnpm run screenshots` is run in `apps/desktop`, and the files are committed under this work item's `screenshots/`.

### Out of scope

- **The broad gate, the sealer, the pull request and the seal's state.** #42 adds its stages after `reviewed`: it adds its kinds to `CHAIN_STAGE_KINDS`, its rows to the table of item 4 below the row of the verifying round, and replaces the resting state `reviewed` with its own next stage. It reads the settled commit from the records, as item 4 does, and from no stored field. #43 and #44 follow it.
- **A start that needs no person after the daemon ended.** #55 builds it (`docs/architecture.md` *What a session survives*).
- **The approval line, the running stage's age on a line, and opening a stage's conversation.** #46 draws them from `WorkItem.chain`. This work draws the button, one sentence and the line's state.
- **A ledger entry per stage.** #45 writes it: each headless session that ends, a stage's among them, makes one entry of the ledger, with the `usage` its result reported. A `ChainStage` names its headless session.
- **A limit on how many chains run at once.** #32 builds the limits read from the machine (`docs/architecture.md` *Memory design*). Until then chains of different work items run side by side, as headless sessions do.
- **A proofer that executes.** A round reads and does not run a command that asks, by `seal/threads/1795338000-role-tools-and-permissions/frame/design.md` *Scope* item 19. The record's `## Probes` table stays as the form has it.
- **A real stage.** No case and no probe of this work starts a real `claude`. What only a real chain shows is `frame/questions.md` Q2 and Q3.
- **The `role` of an `ask`.** A client can still launch a role session on a work item outside a chain. `frame/plan.md` *Alternatives considered* gives the premise.
- **Rewording the taken check's refusals.** They name `seal gate` and the orchestrator. `pr-check/` is not edited here, since the chain reaches no pull request before #43.

### Where each line of the issue's *Done when* lands

| The issue's line | Scope items |
|---|---|
| Pressing "Get a seal" starts the review rounds, and the person can close the window while they run | 1, 2, 3, 26 |
| Each round is a fresh proofer session that reads files only, and its record is committed in the format the PR check reads | 5, 6, 16, 17, 19 |
| A round with findings is followed by a crafter fix pass, and every commit of a fix pass is read by a later round | 4, 7, 8 |
| The daemon's code runs the order, and the convergence judgment is asked of the orchestrator agent and recorded | 4, 9, 10, 22 |
| Each role session's process is ended when its stage finishes | 13 |
| A stage that fails or is stopped leaves a state the inbox names, and the person can start the chain again from the records | 14, 15, 25, 27 |
| The test suite runs two rounds and one fix pass through the fake adapter | 24, and scenario 1 |

## User scenarios & acceptance *(mandatory)*

Every case runs through the fake adapter, on a temporary repository. `chain.test.ts`, `round-record.test.ts` and `record-writer.test.ts` are new files of `apps/desktop/test/`.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. Two rounds and one fix pass | Given a work item whose branch holds one commit after its base, in a repository with the records root. When a client sends `getSeal`, the fake proofer answers round 1 with one finding, the fake crafter commits a fix and appends a close block, and the fake proofer answers round 2 with a `confirms:` block. Then the worktree's branch holds, in order, the commit of `routing.md`, the commit of `round-1.md`, the crafter's commit, the commit of the closed `round-1.md` and the commit of `round-2.md`, each of the daemon's with the trailer; and the work item's chain is `reviewed` at the head | A case of `test/chain.test.ts` |
| 2. The records are what the check reads | Given the repository scenario 1 leaves. When `chain_check.py --baseline main --sealing` runs under a ready payload. Then it exits 0 | A case of `test/pr-check.test.ts` |
| 3. The window may close | Given scenario 1's start. When the client disconnects after `done` and another connects once the chain rests. Then the chain reached `reviewed` with no client connected, the daemon did not ask to exit meanwhile, and the new client's `ready` carries the chain | A case of `test/chain.test.ts` |
| 4. A round reads files only | Given a round whose fake proofer asks to write a file and to run a command. When the daemon answers. Then both are refused by the proofer's grant, the stage's `refusals` is 2, and `trail/refusals.md` holds two rows that name the tool and the rule and no text of either call | A case of `test/chain.test.ts` |
| 5. The process is ended before the next stage | Given scenario 1's chain through an adapter that notes each `start`, `stop` and `exit`. Then each stage's `stop` and `exit` come before the next stage's `start` | A case of `test/chain.test.ts` |
| 6. The judgment is asked and recorded | Given a round 2 that leaves a finding. When the fake orchestrator answers `converging: yes`. Then `decisions.md` holds a `route` decision by `orchestrator`, committed, a fix pass and round 3 follow, and the first fix pass was preceded by no judgment. When it answers `converging: no`. Then the decision is recorded, the chain is `stopped` and says the rounds are not converging, and a second `getSeal` starts the fix pass with no judgment | Two cases of `test/chain.test.ts` |
| 7. The ceiling | Given a daemon whose ceiling is 2, and a round 2 that leaves a finding. Then the chain stops and no judgment is asked | A case of `test/chain.test.ts` |
| 8. A stage fails or is stopped | Given a round whose session fails, one a client stops, one that reaches its limit, and one whose answer holds no record. Then each leaves the chain `stopped` with a sentence that names the round, no record is committed, a second work item's chain goes on, and a later `getSeal` runs the same round again | Cases of `test/chain.test.ts` |
| 9. The start is refused | Given each condition of *Scope* item 1. When a client sends `getSeal`. Then the answer is an `error` whose sentence names the condition, and no session starts and no file is written | A case of `test/chain.test.ts` for each condition |
| 10. The chain starts again from the records | Given a repository whose records hold round 1 with an open finding, and a daemon that holds no chain for the work item. When a client sends `getSeal`. Then the first stage is a fix pass. Given records that hold a closed round 1 and no round 2. Then the first stage is a verifying round whose target is `<head>, fixes <round 1's target>..<head>` | Cases of `test/chain.test.ts`, and the table of *Scope* item 4 row by row in cases of the order's function |
| 11. The daemon ended in a stage | Given a run folder whose stored chain is `running`. When a daemon starts on it. Then the chain is `stopped`, its sentence says the daemon ended while the stage ran, and no stage started | A case of `test/chain.test.ts` |
| 12. A record the check would refuse is not written | Given a proofer's answer with a `target:` other than the prompt's, one with a line the reader refuses, one that holds a close block, a verifying one that names no line for a `fixed` finding, and a worktree whose head moved during the round. Then no record is written, and the chain stops with a sentence that says which | Cases of `test/chain.test.ts` and of `test/round-record.test.ts` |
| 13. A fix pass is held to its record | Given a crafter that edits the proofer's block, one whose `fixed` names a commit the branch does not hold, and one that leaves a change no commit holds. Then nothing is committed by the daemon, and the chain stops with a sentence that says which. Given a crafter that leaves a finding open and raises no question. Where it closed at least one block, the daemon commits the record, with the pass's rows of `trail/refusals.md` where the pass has any, and then stops the chain with a sentence that names the open finding, and the stage is `failed`. Where it closed none, the record is unchanged and the daemon commits no record | Cases of `test/chain.test.ts` |
| 14. A question is decided or parks | Given a crafter whose answer holds two `asks:` blocks. When the fake orchestrator decides one and parks the other. Then `decisions.md` holds one decision and one `open` question by `crafter`, committed, the chain is `parked`, and no stage starts. When a client answers the question. Then the fix pass on the same record starts, and its prompt names `decisions.md` | A case of `test/chain.test.ts` |
| 15. A reversal is taken in | Given a `reviewed` chain and a decision the person reversed. When a client sends `getSeal`. Then a fix pass starts whose prompt holds the decision and the message, the decision reads `applied <head after the pass>` in the commit after the pass, and a verifying round follows | A case of `test/chain.test.ts` |
| 16. The writer refuses a path that leaves the worktree | Given a work item's directory that is a link to a folder outside the worktree, a `trail` that is such a link, and a link at the record's own path. When the daemon writes a round record, and when it writes a decision. Then each write throws a sentence that names the path, nothing is written outside the worktree, and the chain stops. A decision written where a link stands at `decisions.md` is refused first by the read before the write, whose sentence names the file and not its folder | Cases of `test/record-writer.test.ts`, and one of `test/chain.test.ts` |
| 17. A rename keeps the directory found | Given a work item with a directory, and a decision in its record. When a client renames its branch. Then `routing.md` names the new branch in a commit of that file alone, and the work item still carries the decision. When the chain is running. Then the rename of the branch is refused | A case of `test/daemon.test.ts` |
| 18. The orchestrator is a role | Given an `ask` with the pair `orchestrator` at `judgment`. Then the session is launched as that role, a write and a command it asks for are refused, the Claude adapter's arguments name `owlery:orchestrator` and a rules file, and the bundle holds `agents/orchestrator.md` | Cases of `test/daemon.test.ts`, `test/claude-adapter.test.ts` and `test/role-bundle.test.ts` |
| 19. The window | Given the built app, started once through `BuiltApp.start` in the background, with a stand-in for the CLI that sleeps. When the case presses "Get a seal" on a work item whose branch holds no commit after its base. Then the daemon's refusal stands under the button, and the button is on. When the branch holds a commit and the case presses again. Then the button is disabled while the round runs, and the chain's sentence stands above it. When a second client of the daemon stops the round's session with `stopHeadless` while the inbox is in front. Then the line's state is `waiting`, its second row holds the chain's sentence, the notification is raised, and a click on it opens the view, where the button is on. When the case presses a third time. Then the same round runs again, and once its session is stopped with the view in front the button is on | One case of a new file of the `app` project, `test/get-a-seal.test.ts` |
| 20. The screenshots | Given the change of the view. Then the committed screenshots show the button at rest in each theme and appearance the run makes | `pnpm run screenshots`, and the review reads the files against `docs/design.md` |

## Data & interfaces

**`apps/desktop/src/shared/protocol.ts`.**

- `ROLE_STAGES` gains `{ role: "orchestrator", stage: "judgment" }`.
- `CHAIN_STAGE_KINDS = ["round", "fix-pass", "judgment", "ruling"] as const`, and `ChainStageKind` is one of them. #42 adds its kinds here.
- `ChainStage`: `kind: ChainStageKind`; `round: number`, the round a round is, the round a fix pass answers, or the round a judgment or a ruling follows; `state: "working" | "finished" | "failed"`; `failure: string | null`; `startedAt: number`; `endedAt: number | null`; `headlessId: number | null`, the session's id of this daemon's run, or null once the daemon that ran it has ended; `refusals: number`.
- `Chain`: `state: "running" | "parked" | "stopped" | "reviewed"`; `says: string`; `reviewedAt: string | null`, the commit the rounds settled at where `reviewed`; `stages: ChainStage[]`, the oldest first; `since: number`, when the chain took its `state`, by the daemon's clock. A chain an earlier build stored with no `since` reads the end of its newest stage, the start of that stage where it did not end, and 0 where it holds none. A chain stored `running` reads as `stopped` since the clock of the daemon that reads it.
- `WorkItem.chain: Chain | null`, null for a work item no chain ran for. A daemon of an earlier build sends no such field, and a client reads its absence as a daemon that offers no "Get a seal".
- `ClientMessage` gains `{ type: "getSeal"; requestId: number; workItemId: number }`, answered with `done` or `error`.

**`apps/desktop/src/daemon/`.**

- `chain.ts`, new: the function of *Scope* item 4, the constants `ROUNDS_CEILING`, `CHAIN_STAGES_KEPT` and `PROMPT_DIFF_CHARS`, the prompt of each stage, and the reading of each stage's answer. `gateBefore` says which of three comes before a fix pass, from the chain's stored stages and from its run: nothing, the judgment of convergence, or a stop at the ceiling (*Scope* items 9 and 10). `asksOf` reads the questions of a stage's answer, `convergenceOf` the judgment of convergence and `rulingsOf` the rulings on questions, each from a kind the table below gives. `convergencePrompt` and `rulingPrompt` are the prompts of the two judgments. `refusalsText` gives the text of `trail/refusals.md` with a stage's rows appended. `roundBase` gives the base round 1's target names (*Scope* item 5). The daemon's options gain `roundsCeiling`, as they hold `headlessLimitMs`.
- `round-record.ts`, new: the reader of *Scope* item 16.
- `record-writer.ts`, new: the check and the write of *Scope* item 18.
- `record-blocks.ts`: the kinds of a round record, and the kinds a stage's answer holds, which the table gives. An answer's kinds are read in an answer and written to no record.

  | Kind | Lines |
  |---|---|
  | A stage's question | `asks:` the question; `grounds:` why the stage cannot answer it; `option:` any number, each a label between backticks and what it implies; `default:` at most one, an option's label |
  | The convergence judgment | `converging:` `yes` or `no`; `grounds:` the text |
  | A ruling on a question | `rules:` the question's number in the prompt and one of `default`, `scope`, `answered` and `park`; `decided:` what was decided, absent for `park`; `grounds:` the text |

- `role-grants.ts`: `GRANTS` gains the orchestrator's row, and a refusing `Verdict` gains `rule`, one of `REFUSAL_RULES`, which names the four rules `no-write`, `outside-worktree`, `no-command` and `other`.
- `worktrees.ts`: `commitAlone` becomes `commitPaths(worktree, branch, paths, subject, trailer)`.
- `repositories.ts`: `StoredWorkItem.chain`, read as null from a file an earlier build wrote.
- `last-look.ts`: a look reads and keeps each work item's `chain`.
- `keep-awake.ts`: `wantsAwake` takes a fourth argument, whether a chain runs, so the hold stays between a chain's stages.
- `decision-record.ts`: `workItemDirectories` and `declaredBranch` are exported, for the chain's reading of a work item's directory.
- `worktrees.ts`: eight reads of git the chain's function takes its `Standing` from, and `pathsOfCommit`, the paths one commit changed, which the daemon reads for each `fixed <commit>` (*Scope* item 7).
- `HeadlessInfo.prompt`: for a chain's stage, the prompt without the diff.
- `daemon.ts`: the `getSeal` case, the chain's run, and one method that begins a headless session, which the `ask` case and the chain both call.
- `adapters/fake.ts`: `FakeAdapterOptions.work`. `adapters/claude-roles.ts`: the orchestrator's row of `AT_THE_STAGE`.

**`apps/desktop/src/renderer/`.**

- `view.ts#sealButton`: whether the view draws "Get a seal", whether it can be pressed, its title, the chain's sentence above it and the refusal under it (*Scope* item 26).
- `view.ts#refusedSeal`: the daemon's refusal of a press, with the chain's state and `since` as the window held them when the refusal came (*Scope* item 26).
- `view.ts#chainNotifications`: one notification for each work item whose chain is stopped and that the window did not hold as stopped, with the words of a waiting pane's (*Scope* item 27).
- `view.ts#lineText` gains a sixth kind of the second row's text, `chain`, the sentence of a stopped chain.
- `work-item-view.ts#takeSeal`: takes the daemon's answer to a press of "Get a seal", and shows a refusal under the button.

**The files the daemon writes in a work item's directory.**

- `routing.md`, at the first start:

  ```
  # Routing: <directory's name>

  | Axis | Answer |
  |---|---|
  | Review | through the review chain |
  | Destination | open the pull request |
  | Planning | the session |
  | Implementation | the session |
  | Branch | <branch> |

  Answered <date> by Owlery, when the person pressed "Get a seal".

  ## Why this way

  The branch was built in the person's own session, and the person asked for a seal on it.
  ```

  `<date>` is the date in the machine's time zone. The directory's name is the epoch seconds and the branch's slug, `work-item` where the slug is empty; where a directory of that name already stands, the chain stops.

  It holds no `Automation` row: nothing the daemon reads says whether the branch's tests are automated, and the check reads the file as a declaration without the row (*Grounding*, the second probe).
- `trail/rounds/round-<N>.md`: the proofer's answer, as `apps/desktop/role-bundle/templates/records/sdd-round.md` shapes it.
- `trail/refusals.md`: a heading, then one table with the columns `Stage`, `Role`, `Tool`, `What the call does` and `Rule`. A stage is written as `round 2`, `fix pass 1`, `judgment 2` or `ruling 2`.
- `decisions.md`: as `decision-record.ts` writes it today.

**The subjects of the daemon's commits**, each followed by the trailer: `chore: declare the work item's routing`; `chore: record review round <N>`; `chore: record the fix pass of round <N>`; `chore: record the orchestrator's judgment after round <N>`; `chore: name the renamed branch in the work item's routing`.

**The words of the window.** The button reads "Get a seal". A chain's sentence names the stage and what happened, in the voice of `docs/design.md` *The voice of the window's words*. The build writes each sentence, and `frame/questions.md` Q4 leaves their wording to it.

## Rule changes

- add
  file: docs/architecture.md
  section: Code runs the order, the orchestrator judges
  to: **The daemon runs a work item's review rounds and fix passes one stage at a time, and reads where the work item stands from its committed records.** "Get a seal" starts the chain on a work item whose branch holds a commit after its base. A round is a fresh proofer session that reads files only. A round that leaves a finding is followed by a crafter's fix pass, and a later round reads every commit of the pass. The daemon keeps no position of its own. Before each stage it reads the round records, the work item's decisions and questions and the branch's head, and they say which stage is owed. So a chain that failed, was stopped or was cut by the daemon's end starts again from the records on the person's word. Where round 2 or a later round leaves a finding open, the daemon asks the orchestrator agent whether the rounds are converging before the fix pass on that round's record, and records the answer as a decision made without asking. A fix pass on a record with no open finding, which takes in reversals alone, follows no judgment, and neither does a second fix pass on one record. Once a chain reaches its ceiling of rounds, a round that leaves a finding open stops the chain with no judgment, and the person's next "Get a seal" runs the fix pass on that record and one more round. A stage's process is ended before the next stage starts. A stage that fails or is stopped stops its one chain, and the work item's line says why.
    check: apps/desktop/test/chain.test.ts
- add
  file: docs/architecture.ko.md
  section: 순서는 코드가, 판단은 orchestrator가
  to: **데몬은 작업의 리뷰 회차와 수정 단계를 한 번에 한 단계씩 돌리고, 작업이 어디까지 왔는지는 커밋된 기록에서 읽습니다.** "Get a seal"은 브랜치에 기준 뒤의 커밋이 있는 작업에서 체인을 시작합니다. 회차는 파일만 읽는 새 proofer 세션입니다. 지적을 남긴 회차 뒤에는 crafter의 수정 단계가 오고, 그 단계의 모든 커밋은 뒤의 회차가 읽습니다. 데몬은 위치를 따로 보관하지 않습니다. 단계마다 그 앞에서 회차 기록, 작업의 결정과 질문, 브랜치의 head를 읽고, 그것들이 다음에 돌릴 단계를 정합니다. 그래서 실패했거나 멈췄거나 데몬이 끝나면서 끊긴 체인은 사람이 다시 시작하면 기록에서 이어 갑니다. 두 번째 회차나 그 뒤의 회차가 지적을 열어 둔 채 끝나면, 데몬은 그 회차 기록의 수정 단계 앞에서 orchestrator 에이전트에게 회차가 수렴하고 있는지 묻고, 그 답을 묻지 않고 내린 결정으로 기록합니다. 열린 지적이 없는 기록에서 뒤집힌 결정만 받아들이는 수정 단계 앞에서는 묻지 않고, 한 기록의 두 번째 수정 단계 앞에서도 묻지 않습니다. 체인이 회차의 상한에 이르면, 지적을 열어 둔 회차는 판단을 묻지 않고 체인을 멈추며, 사람이 다음에 "Get a seal"을 누르면 그 기록의 수정 단계와 회차 하나를 더 돌립니다. 한 단계의 프로세스는 다음 단계가 시작하기 전에 끝냅니다. 실패했거나 멈춘 단계는 그 작업의 체인 하나만 멈추고, 작업의 줄이 이유를 말합니다.
    check: apps/desktop/test/chain.test.ts
- add
  file: docs/architecture.md
  section: Records are committed to the repository
  to: **The daemon writes and commits each stage's record, and a role session that judges holds no tool that writes one.** A proofer's answer is its round record. The daemon reads it with its own reader, writes no round record that the pull request check's reading of round records would refuse, writes the answer's text unchanged to `trail/rounds/round-N.md` of the work item's directory, and commits it. In a repository that declares a migration in `seal/parity.json`, the daemon neither writes a round record's `original:` line nor asks for one, so the check's comparison with the original code can still refuse such a record. A crafter commits its fixes and appends the close blocks, and the daemon commits the record after the pass. The first stage of "Get a seal" makes the work item's directory and its `routing.md`, which names the implementer as `the session`. Before each write under a worktree's records root, the daemon checks that every folder from the worktree to the file is a folder of the worktree and that no link stands at the file's path. Each call a role's rule refused is counted on its stage in the daemon's state. Where the stage makes its commit, that commit adds a row of `trail/refusals.md` for each such call, with the stage, the role, the tool and the rule, and with no text of the call. A stage that fails before its commit, because its session failed or the daemon refused its answer, writes no row.
    check: apps/desktop/test/chain.test.ts apps/desktop/test/round-record.test.ts apps/desktop/test/record-writer.test.ts apps/desktop/test/pr-check.test.ts
- add
  file: docs/architecture.ko.md
  section: 기록은 저장소에 커밋합니다
  to: **단계마다 그 기록은 데몬이 쓰고 커밋하며, 판정하는 역할 세션은 기록을 쓰는 도구를 갖지 않습니다.** proofer의 답이 곧 그 회차의 기록입니다. 데몬은 그 답을 자기 리더로 읽고, PR의 검사가 회차 기록을 읽으면서 거절할 회차 기록은 쓰지 않으며, 답의 글을 바꾸지 않고 작업 디렉터리의 `trail/rounds/round-N.md`에 써서 커밋합니다. `seal/parity.json`에 마이그레이션을 선언한 저장소에서는 데몬이 회차 기록의 `original:` 줄을 쓰지도 요구하지도 않으므로, 원본 코드와 비교하는 검사가 그런 기록을 거절할 수 있습니다. crafter는 수정을 직접 커밋하고 닫는 블록을 덧붙이며, 데몬은 수정 단계가 끝난 뒤 기록을 커밋합니다. "Get a seal"의 첫 단계가 작업 디렉터리와 `routing.md`를 만들고, 그 파일은 구현한 쪽을 `the session`으로 적습니다. 데몬은 worktree의 기록 뿌리 아래에 쓸 때마다, worktree에서 파일까지의 모든 폴더가 worktree 안의 폴더인지, 파일의 경로에 링크가 없는지를 먼저 확인합니다. 역할의 규칙이 거절한 호출은 데몬의 상태에서 그 단계에 세어 둡니다. 단계가 커밋을 만들면, 그 커밋이 거절된 호출마다 `trail/refusals.md`에 한 줄을 더하고, 그 줄에는 단계, 역할, 도구, 규칙이 있으며 호출의 글은 없습니다. 세션이 실패했거나 데몬이 답을 거절해서 커밋 전에 실패한 단계는 줄을 쓰지 않습니다.
    check: apps/desktop/test/chain.test.ts apps/desktop/test/round-record.test.ts apps/desktop/test/record-writer.test.ts apps/desktop/test/pr-check.test.ts
- change
  file: docs/architecture.md
  section: What each session loads
  from: Role sessions the daemon launches (framer, crafter, proofer, sealer)
  to: Role sessions the daemon launches (framer, crafter, proofer, sealer, and the orchestrator where the daemon asks it for a judgment)
- change
  file: docs/architecture.ko.md
  section: 세션마다 싣는 것
  from: 데몬이 띄우는 역할 세션(framer, crafter, proofer, sealer)
  to: 데몬이 띄우는 역할 세션(framer, crafter, proofer, sealer, 그리고 데몬이 판단을 물을 때의 orchestrator)

- change
  file: docs/design.md
  section: Components and their states
  from: | The seal's place | Before a seal: on a line a disc of `--seal-blank-ground` with `--seal-blank-edge`, and in the preview and at a view's foot the seal's drawing pressed into the ground in the blank tones under `--seal-blank-light`. Sealed: the seal as it is drawn, under `--seal-light`. | — | — | — | — | — |
  to: | The seal's place | Before a seal: on a line a disc of `--seal-blank-ground` with `--seal-blank-edge`, and in the preview and at a view's foot the seal's drawing pressed into the ground in the blank tones under `--seal-blank-light`. At a view's foot a column of words stands beside the drawing: the state of the seal, its note in `--ink-muted`, where the review chain stands in `--ink`, the main button "Get a seal", and under it why the daemon refused the last press, in `--state-failed`, each at `--size-second` and wrapped. Sealed: the seal as it is drawn, under `--seal-light`. | — | — | — | — | — |
    check: apps/desktop/test/get-a-seal.test.ts apps/desktop/test/view.test.ts
- change
  file: docs/design.ko.md
  section: 부분과 그 상태
  from: | 인장의 자리 | 인장이 찍히기 전: 줄에서는 `--seal-blank-ground`의 원판에 `--seal-blank-edge`이고, 미리 보는 칸과 작업 화면의 아래쪽에서는 인장의 그림이 빈 자리의 색조로 `--seal-blank-light` 아래 바탕에 눌려 있습니다. 인장이 찍힌 뒤: 그려진 그대로의 인장이 `--seal-light` 아래에 있습니다. | — | — | — | — | — |
  to: | 인장의 자리 | 인장이 찍히기 전: 줄에서는 `--seal-blank-ground`의 원판에 `--seal-blank-edge`이고, 미리 보는 칸과 작업 화면의 아래쪽에서는 인장의 그림이 빈 자리의 색조로 `--seal-blank-light` 아래 바탕에 눌려 있습니다. 작업 화면의 아래쪽에서는 그림 옆에 글이 한 줄기로 섭니다. 인장의 상태, `--ink-muted`의 그 메모, `--ink`로 쓴 리뷰 체인이 어디에 서 있는지, 주 버튼 "Get a seal", 그리고 그 아래 `--state-failed`로 쓴 데몬이 마지막 누름을 거절한 까닭이며, 모두 `--size-second`이고 줄을 바꿔 감깁니다. 인장이 찍힌 뒤: 그려진 그대로의 인장이 `--seal-light` 아래에 있습니다. | — | — | — | — | — |
    check: apps/desktop/test/get-a-seal.test.ts apps/desktop/test/view.test.ts

## Removes

This work adds a mechanism, the chain, to a daemon that ran none. It replaces no mechanism of the tree, so what it takes out is the text and the one unit that stood on the earlier facts. The rows are those.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The steps that have a proofer clone the repository, write the record's file and run `chain_check.py` over it | `apps/desktop/role-bundle/agents/proofer.md` *Order of work* steps 2 and 7 | The proofer works in the worktree and its answer is the record (*Scope* items 5 and 6). The daemon's reader holds what the check's run held (*Scope* item 16) |
| The rules on the clone's name, on runs through the repository's runner and on probes in the clone | `apps/desktop/role-bundle/agents/proofer.md` *The clone is named for the work item and the round*, *Runs are narrow, through the repository's runner* and *A probe runs in the clone, and its files are edits* | A proofer's command that asks is refused, so a round runs nothing (`seal/threads/1795338000-role-tools-and-permissions/frame/design.md` *Scope* item 19). Nothing takes their place until a proofer can execute |
| The rule that the record goes to a path the proofer writes | `apps/desktop/role-bundle/agents/proofer.md` *The record goes to the branch worktree* | `apps/desktop/src/daemon/chain.ts` writes the path (*Scope* item 6) |
| The sentences that name the orchestrator as the party that takes the round record from the hand-back and commits it | `apps/desktop/role-bundle/docs/forms/the-round-record.md` *Each finding's close block has one writer, and the blocks written at one step reach the branch in a single commit*, and `apps/desktop/role-bundle/skills/implement/fix-pass.md` *The close blocks, last* | The daemon commits the record (*Scope* item 7), and the two texts say so |
| The sentence that the bundle holds no definition of the orchestrator's kind, where `README.md` lists what the bundle leaves out | `apps/desktop/role-bundle/README.md` *What the bundle leaves out*, the item "No orchestration document" | The item stays for the order, which is daemon code, and gains that the bundle holds the orchestrator's definition for its judgments (*Scope* item 22) |
| The function that commits one path | `apps/desktop/src/daemon/worktrees.ts#commitAlone` | `worktrees.ts#commitPaths`, which its one caller, `Daemon#commitWord`, calls with one path (*Scope* item 17) |
| The inline start of a headless session in the `ask` case | `apps/desktop/src/daemon/daemon.ts#handle`, the case `ask` | One method of the daemon that the `ask` case and the chain call (*Data & interfaces*) |

Framed 2026-11-23 by framer, before the build.
