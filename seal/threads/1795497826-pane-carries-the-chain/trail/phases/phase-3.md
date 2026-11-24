# Phase 3: 1795497826-pane-carries-the-chain

## What this phase found

### Where the tree contradicted the frame

**The guarantee's template names no party, so nothing of it changed.** `frame/design.md` scope item 8 lists the guarantee's template among the documents that name the party that writes a record. `apps/desktop/role-bundle/templates/records/sdd-guarantee.md` holds a heading, two tables and one verdict block, and no sentence on who writes them.

**The bundle holds two files more that are no document.** Scenario 14 says the bundle holds documents and the one file `hooks/hooks.json`. It also holds `.claude-plugin/plugin.json` and `LICENSE`, as it did before this work. The case of `apps/desktop/test/role-bundle.test.ts` lists the four files that stand outside `agents/`, `skills/`, `docs/` and `templates/`: those two, `README.md` and `hooks/hooks.json`.

**A sentence of the rules head became untrue once the bundle held the hook's file.** Scope item 8 says the head of a role session keeps its two sentences on the daemon's answer and on its tools, and it does. A third sentence of both heads said "The bundle holds documents only". It now reads "Those four directories hold documents only", which is what the sentence after it stands on. `docs/architecture.md` *What each session loads*, the paragraph that opens "A role session's system prompt ends with one file the daemon writes", still says that the head says the bundle holds documents only. Phase 6 writes that section (scope item 16).

**The frame does not say what `ask` does with an input it cannot read.** Scope item 19 gives two ends, exit code 0 and exit code 2. Decision: where the routing answers `Automation` `yes` and the input is not the JSON of a call whose `tool_input.questions` holds each question's text, `ask` writes a sentence that names the input as not read and exits with 1. Claude Code reads that code as a hook's error that refuses nothing. Grounds: a refusal there would leave a run with no way to ask once the event's shape changes, and a silent pass would hide that the hook reads nothing. Judged against the plugin's `skills/core/SKILL.md` *The rule a mechanism is kept against*, the sentence that a script names as not read what it cannot read and decides nothing on it.

**The frame does not say what `ask` does where two directories name the branch.** Every other subcommand refuses there. Decision: `ask` lets the call through, as it does where no directory names the branch, outside a worktree and where HEAD names no branch. Grounds: scope item 19 has it refuse only on a routing it read as `yes`, and no chain runs on such a branch.

**The frame does not say what `start --automation` does where a routing stands.** *Data & interfaces* says `start` writes the routing where no directory names the branch. Decision: where a routing stands, `start` refuses an `--automation` answer that the routing does not hold, and names the file to change. It passes the answer the routing holds. Grounds: a session that passed `--automation yes` and got exit code 0 would go on as if the hook held, on a routing that holds no such row.

**Scope item 8 names seven kinds of document, and three more changed.** `skills/core/SKILL.md` cited the heading of `agents/sealer.md` that this phase renamed, and it and `skills/implement/SKILL.md` said that Owlery's daemon writes the pull request body's seal section and no `pr.md`. The frontmatter of `skills/core/SKILL.md` and of `skills/agent-contract/SKILL.md` said that the daemon appends the skill to a role session's system prompt, and a pane lists both skills by that text. Each of those sentences now names Owlery. Nothing else of the three files changed.

### Decisions made while building

**The rules head takes the launch as an argument.** `claude-roles.ts#rulesHead` and `#rulesText` take `"session"` or `"pane"`, and `"session"` where none is given, so the daemon's call is unchanged. The chain command's `owed` passes `"pane"`. A pane's head differs in two sentences. It does not say the documents are in the role's context, since a subagent reads the file. It says that the role holds the tools its definition names, or the session's where the definition names none, and that the person's own permission settings answer a call. The head's first line, "Owlery role session", is the same in both. Phase 4's probe may change the pane's head (`frame/questions.md` Q2).

**`start` writes the `Automation` row before the `Branch` row, with one sentence more under *Why this way*.** `chain.ts#routingText` takes the answer, and `stage-records.ts#declaredDirectory` passes it on. The sentence says that the session that started the chain gave the answer. The daemon's chain passes none, so its routing is unchanged.

**The reason `ask` refuses with names both files.** It names the `routing.md` that answers `yes`, the `frame/questions.md` the question goes into, and the form that passes. The form is a question that opens with `No default can be taken: ` and holds a reason after those words. Those words with nothing after them, and those words after the question's opening, are refused.

**The command reads its input only for `ask`.** `chain-main.ts` gives the command a function that reads the input to its end. `ask` calls it once the routing reads `yes`, so no other subcommand waits on a terminal.

**`skills/seal/SKILL.md` says what the session does at each step the command names, and no order.** It holds the call's form, a table from each `step` of `owed` to the session's act, how a role is started as a subagent, the fix pass's line, the two judgments with the headings of `agents/orchestrator.md` that hold their rules, the rule under `Automation` `yes` with the form the hook lets through, and where a run rule comes from. It tells the session to pass `seal` the id its subagent tool gave and the model the sealer's definition names, which is the default of `frame/questions.md` Q3.

**The orchestrator's definition keeps the daemon in its sentences.** Only the daemon launches that agent. Its *Job* gained a paragraph that says a pane's session makes the two judgments itself. The other role documents name Owlery, and say once who Owlery is in each launch.

**`sealersBlock` says "which Owlery writes and a sealer does not".** The two cases that pinned the sentence pin the new one.

**One guard of `ask` went after its mutant survived.** A list of no questions was read as an input not read. No case watched it, and an empty list reads exactly: no question of it is in the form. It is refused under `yes` like any other call.

### What was seen red

- The three cases of `apps/desktop/test/chain-command.test.ts`, on the `Automation` row, on the refusal and on what is let through: each failed against `49086c6`, where the command held no `ask` and `start` refused the option.
- The case that lets a call through, shown red with one guard removed at a time by `seal mutate` on `chain-command.ts`: the routing's answer no longer read, red on the routing with no row; two directories no longer let through, red; the guard of a folder outside a worktree removed, red.
- The case that refuses, by `seal mutate` on the same file: the refusal's exit code set to 0, red; the reason after the form's words no longer asked for, red; the form found anywhere in a question, red; an input not read answered with 2, red; a list entry with no text taken as a question, red.
- `seal mutate` on `start`: the refusal of an answer other than `yes` and `no` removed, red; the refusal on a standing routing removed, red; the answer not passed to `declaredDirectory`, red. On `stage-records.ts`, the answer not passed to `routingText`, red. On `chain.ts`, the row removed and the sentence removed, each red against `apps/desktop/test/chain.test.ts`.
- The case of the pane's head in `apps/desktop/test/claude-adapter.test.ts` failed before the code. `seal mutate` on `claude-roles.ts`: each of the two sentences given the session's text, red; `rulesText` not passing the launch, red; the old sentence on documents put back, red. On `chain-command.ts`, `owed` handing the session's head, red.
- The four cases of `apps/desktop/test/seal-records.test.ts` and the case of `chain.test.ts` failed against the old sentence, and `seal mutate` on `seal-records.ts` with the old sentence put back is red.
- Six cases of `apps/desktop/test/role-bundle.test.ts` failed against the bundle of `49086c6`. `seal mutate` then ran against them: on `hooks/hooks.json`, another matcher, the command without its guard, and another event, each red; on `skills/seal/SKILL.md`, the fix pass's line cut, the source of a run rule replaced, the form's words removed and the rule under `Automation` `yes` removed, each red; on `agents/orchestrator.md`, `agents/sealer.md` and `agents/proofer.md`, the `tools:` line removed, red in each, and one reworded sentence of each put back or cut, red.
- One mutant SURVIVED: the guard of an empty list of questions, which the decision above removed.

### What the next phases need

- **Phase 4.** The built `dist/chain.js` was run once with Electron's Node as `ask`, with an event on its input, in this worktree: it exited with 2 and printed the reason, since this work item's routing answers `Automation` `yes`. No case runs the built file's reading of its input.
- **Phase 4.** The probe reads three things this phase built and no case can show: that Claude Code runs the hook of a `--plugin-dir` plugin and takes exit code 2 as a refusal (Q4), that a `tools:` line leaves a role session of the daemon as it is (Q2), and that a subagent started as `owlery:<role>` reads the rules file where its prompt names it (Q2). `skills/seal/SKILL.md` *A role is a subagent of the bundle* is the text to change where the probe says otherwise.
- **Phase 4.** `claude-roles.ts#rulesHead` with `"pane"` is the head to rewrite where the probe answers Q2 against it.
- **Phase 6.** `docs/architecture.md` *What each session loads* states the head's old sentence, and *Code runs the order, the orchestrator judges* says the bundle holds no orchestration document. The bundle's `README.md` now states both launches, the hook and what a pane's session gets, in the words the documents can follow.
