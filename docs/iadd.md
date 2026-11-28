# IADD in Owlery

*English · [한국어](./iadd.ko.md)*

**Owlery runs IADD, Independent AI-Driven Development, whose definition is the [IADD specification](https://github.com/MichaelYcJo/iadd-workflows/blob/v0.1.0/spec/iadd.md).** The specification states the method: its concept, its principles, the invariants every workflow holds, its names and its record forms. This document does not restate them. It states how Owlery holds them, what Owlery adds to the record forms, where Owlery departs from them, and the Owl Chain as data. The owner merged the two definitions of IADD, Owlery's and the AgenticSeal plugin's, into the specification on 2026-11-28 (issue #353). The plugin `agentic`, where Owlery started, runs the same chain as its reference implementation, and Owlery runs it on a daemon ([Where Owlery started](architecture.md#where-owlery-started)).

## The specification Owlery follows

**Owlery follows the IADD specification 0.1.0.** What the specification leaves to each product, Owlery answers as follows.

| What the specification leaves to a product | Owlery's answer |
|---|---|
| The harness | a desktop app's daemon, which starts each stage as a role session in its own sandbox, and the panes, whose Claude Code session carries the Owl Chain |
| The parties | the orchestrator, the crafter, the proofer and the inspector. The role bundle holds no framer and no tracer, so the framer's half of principle 2 does not arise |
| How a run ends | at a pull request. Owlery writes `open the pull request` as the `Destination` of every work item, and offers no handed-back branch |
| When the question batch is asked | not built yet: the batch at the outset is milestone 3's ([docs/roadmap.md](roadmap.md#milestones)). A later question is decided from the code and the policy and recorded in `decisions.md`, or parks its one work item ([Code runs the order, the orchestrator judges](architecture.md#code-runs-the-order-the-orchestrator-judges)) |
| Who writes the records and keeps the order | Owlery's code, from the committed records ([What holds for every workflow](#what-holds-for-every-workflow)) |
| A merge of the base after the inspected commit | it lapses the inspection, as every other commit that changes more than the closing records does. A commit of the base that touches only the work item's own directory does not |
| Who answers an `undecided` verdict first | the orchestrator agent, whose ruling is committed to `decisions.md`. After two `undecided` verdicts the work item parks for the person |
| The modes and the configuration keys | `shared` alone: the root is committed. Owlery writes `Commit and pull request language`, `Record language` and `Broad gate`, writes no `Mode`, and reads `Broad gate` and `Heavy commands` |

## Where Owlery holds each principle

The specification's eleven principles, and the documents and code of Owlery that hold each. The seven invariants stand in [What holds for every workflow](#what-holds-for-every-workflow).

| Principle | Where Owlery holds it |
|---|---|
| 1. The AI asks once, at the outset | the row *Asking the person* of [What changes because Owlery is not a plugin](architecture.md#what-changes-because-owlery-is-not-a-plugin), and `decisions.md` ([Records are committed to the repository](architecture.md#records-are-committed-to-the-repository)). Departs in a pane ([Where Owlery departs](#where-owlery-departs), items 1 and 2) |
| 2. Whoever made it does not clear it | invariant 1 below |
| 3. Independent AIs talk through the thread's records | each role session starts without the person's settings, hooks or servers ([Role sessions run detached from the user's environment](architecture.md#role-sessions-run-detached-from-the-users-environment)), and the daemon writes each stage's prompt from the committed records |
| 4. An inspection belongs to one commit | invariant 2 below |
| 5. A script answers what is exact | Owlery's code runs the broad gate and reads its exit code. The labels `executed`, `read` and `unverified` stand in the role bundle's proofer and agent contract, and no code reads them ([Where Owlery departs](#where-owlery-departs), item 6) |
| 6. A judgment stands on a source document | every decision, ruling and question of `decisions.md` holds its `grounds:`, and the role bundle's core states the rule |
| 7. A rule is guidance for a judgment | the role bundle's core. No document of the bundle restates the order, which code keeps ([Code runs the order, the orchestrator judges](architecture.md#code-runs-the-order-the-orchestrator-judges)) |
| 8. Some links no party skips | invariants 1 to 7 below, each held by code |
| 9. A mechanism is kept against its cost | the role bundle's core, and the inspection sheet, which shows a work item's cost beside what its rounds found ([State lives in three places](architecture.md#state-lives-in-three-places)) |
| 10. A document is cut by who opens it | each stage of the Owl Chain's two files names the documents its launch carries ([What each session loads](architecture.md#what-each-session-loads)) |
| 11. Records are temporary | the settle. Owlery's own command lists what a settle keeps and removes nothing yet, and issue #139 builds the rest ([Where Owlery departs](#where-owlery-departs), item 9) |
check: apps/desktop/test/claude-adapter.test.ts apps/desktop/test/decision-record.test.ts apps/desktop/test/role-bundle.test.ts apps/desktop/test/settle.test.ts apps/desktop/test/gate.test.ts

## Names

The method's names are the specification's ([Names](https://github.com/MichaelYcJo/iadd-workflows/blob/v0.1.0/spec/iadd.md#7-names)), and so are the names set aside. Owlery adds these.

| What | Name |
|---|---|
| Owlery's default workflow | the Owl Chain in prose, and `owl-chain` as the name of a workflow and of an inspector module |
| The pull request check | `inspection` |
| The app | Owlery, one product that runs IADD |

The app keeps the name Owlery, which the owner set on 2026-11-28 with the concept. IADD is the method and Owlery one product that runs it, and "owl" alone collides with W3C's OWL, Odoo's OWL and Owl Carousel ([docs/name.md](name.md)).

## The records

**A repository's work records stand under `agentory/`, committed, in the specification's forms ([The record forms](https://github.com/MichaelYcJo/iadd-workflows/blob/v0.1.0/spec/iadd.md#8-the-record-forms)).** Connecting a repository writes the folder with its `README.md` and `config.json` ([Records are committed to the repository](architecture.md#records-are-committed-to-the-repository)). A repository that keeps an `agentory/` of its own without the marker line is refused at the setup. `agentory/workflows/<name>.json` and `agentory/inspectors/<name>.json` will hold a repository's own workflows and inspector modules, and no code of Owlery reads them yet ([What no code reads yet](#what-no-code-reads-yet)).

Records in the form the AgenticSeal plugin wrote before its release 0.40.0, under `seal/`, are read as records by the migration alone, which moves them to `agentory/` in one commit the person reads first ([Records are committed to the repository](architecture.md#records-are-committed-to-the-repository)).

### What Owlery adds to the record forms

- **`decisions.md`** in a work item's directory holds each decision made without asking, each ruling, and each question that parks the work item, as `iadd` blocks opened by `decision:` or `question:`, each with its `grounds:` and its state ([Records are committed to the repository](architecture.md#records-are-committed-to-the-repository)).
- **`trail/refusals.md`** holds one row for each tool call a role session's grant refused, and it is a closing record beside `trail/gate.md` and `inspection.md`.
- **The verdict block** adds six lines: `built-by:`, each session that built the work; `inspected-by:`, the session that inspected it; `model:`, its model; `rules:`, `owlery <version>`; `workflow:` and `inspector:`, both `owl-chain` for the Owl Chain.
- **The trailer `IADD-Built-By:`** names the building session on the commit that records a fix pass.
- **The key `Heavy commands`** of `agentory/config.json` names the commands that take their turn on the machine.

### The inspection and its check

**The check `inspection` shows the inspection's state on the pull request's head commit, in the specification's three states.** It runs on GitHub without the app and reads the same committed records. `README.md` *The inspection check on GitHub* gives each title the check posts.
check: apps/desktop/test/inspection-state.test.ts apps/desktop/test/pr-check.test.ts

## Where Owlery departs

Each place where Owlery's code differs from the specification 0.1.0.

1. **Principle 1, in a pane.** A pane's session asks the person in the pane during the run. Under `Automation` `yes` it takes the question's default, and a question that opens `No default can be taken: ` still reaches the person. The batch at the outset is not built.
2. **§8.5, in a pane.** A pane's session decides an `undecided` verdict or asks the person there, during the run.
3. **§8.7.** A cleared commit that the head does not hold, or that the repository cannot resolve, reads lapsed, where the specification reads not cleared.
4. **Invariant 2 and §8.7.** Inside the work item's own directory, Owlery compares trees. So a change to a record other than the closing records, reverted by a later commit, leaves the inspection cleared.
5. **§8.7.** Owlery also reads lapsed where the chain owes a step at the head, such as an open question that stood at the cleared commit, or a record that does not read.
6. **§8.4 and principle 5.** A finding's `evidence:` is optional, and no code reads its labels. `regression:` also takes `round-<N>` without a finding's number.
7. **§8.8.** `IADD-Routing:` stands on the commits that record a stage, not on every commit of a session.
8. **Invariants 3 and 7, in a pane.** The judging roles are subagents that hold `Bash` under the person's own permission settings and no sandbox (issue #286). A pane's session opens the pull request itself, and only the check holds that the inspection was cleared.
9. **Principle 11 and §8.9.** Owlery's settle lists what a settle keeps and removes nothing (issue #139). This repository settles with the plugin.

## Workflows

**A workflow is put together like building blocks.** A person picks its skeleton, customizes what each stage holds (the prompt, the skills, the model and the provider of each role), and registers the inspector module the workflow ends in. The Owl Chain is Owlery's default IADD workflow and its system setting: the workflow a repository runs until a person picks or builds another. A person's own workflow is set beside it, not in place of Owlery's copy.

### A workflow as data

- **A workflow** is one JSON file that names a skeleton, the content of each stage, and an inspector module.
- **A skeleton** is the workflow's shape: which stage kinds run, in which order, what each hands the next and the condition to move on. It is code. Its name picks a function that reads the committed records and returns the step owed. A person picks a skeleton and does not write one. The Owl Chain's skeleton is `rounds-then-inspection`.
- **A stage** is the content of one stage kind: the role's name, the agent's definition, the documents its launch carries after the core and the agent contract, the provider, which is the adapter's name, and the model, where `null` is the CLI's own default. Each stage kind's grant of tools stays code, and no workflow file states or widens one.
- **An inspector module** is one JSON file that names the checks Owlery runs before the inspection, the inspector's own stage, and the template of the record the inspector answers with. A check is a command Owlery's code runs at the commit and reads by its exit code, and a run that passes is a block of `trail/gate.md`.

The Owl Chain's two files ship in the role bundle, `workflows/owl-chain.json` and `inspectors/owl-chain.json`, and `apps/desktop/role-bundle/README.md` *The Owl Chain's two files* describes them. Owlery's daemon and its chain command read each stage from them in both launches, and refuse a file that does not hold to the skeleton or to the form, naming the file and the key.
check: apps/desktop/test/workflow.test.ts apps/desktop/test/claude-adapter.test.ts apps/desktop/test/chain-command.test.ts

**A stage runs on the first of these that names a model:** the work item's choice in its `routing.md`, the person's default for the stage, the `model` of the stage in its workflow or module file, then the CLI's own default. Owlery builds the last two, and issue #129 builds the first two on them. The verdict block's `model:` line names the model that inspected.

### Where a workflow is stored, and how one is shared

The Owl Chain's two files ship in the app, and the app's version is their version. A repository's own files will stand under `agentory/workflows/<name>.json` and `agentory/inspectors/<name>.json`, committed, so a team shares them through the repository and the inspected commit holds the files as they were read. A person's default model for a stage is the daemon's state, and a work item's own choice is a row of its `routing.md`. The name `owl-chain` is the app's alone in both folders.

A shared workflow or inspector module is its files, in a repository. A person adopts one by committing a copy under their own `agentory/`, and the copy states where it came from. Owlery keeps no gate on which module is good: the person judges, and a module's worth shows in who adopts it.

**A reader knows what an inspection means from its block.** The block names the workflow and the inspector module. A reader opens the module's file at the inspected commit, or, for `owl-chain`, the role bundle of the Owlery version the `rules:` line names. The check's title names the Owl Chain where each verdict block it names holds `workflow: owl-chain`.

### What holds for every workflow

Owlery's code holds the specification's seven invariants ([The invariants of every workflow](https://github.com/MichaelYcJo/iadd-workflows/blob/v0.1.0/spec/iadd.md#5-the-invariants-of-every-workflow)) whatever a workflow file says, as follows.

1. **Whoever made it does not clear it.** The session that inspects built none of the work. Owlery writes no verdict where the inspecting session is one of the building sessions, and the check refuses such a block.
2. **One commit.** An inspection names one commit. It is cleared at a branch's head only where nothing but the closing records differs between that commit and the head, and it lapses otherwise. The answer is read from the head's committed records alone. Items 3 to 5 of [Where Owlery departs](#where-owlery-departs) give where this reads apart from the specification.
3. **The judging party does not change what it judges.** Owlery's code writes and commits each record, and a stage that reviews or inspects holds no tool that writes a file. In the daemon's chain a stage's session runs in the sandbox its grant names. In a pane a role is a subagent whose definition names its tools, and the person's own permission settings answer it, which issue #286 holds.
4. **The links no party skips are held by code.** The step owed comes from the committed records through the skeleton's function. No document and no agent starts, orders or skips a stage.
5. **The declared checks pass at the inspected commit.** The Owl Chain's inspector module names the repository's `Broad gate` command as its one check. Owlery's code runs it, and each passed run stands in `trail/gate.md` at the inspected commit.
6. **The inspection names what produced it.** The verdict block names the workflow, the inspector module, each session that built, the session that inspected, its model and Owlery's version.
7. **No pull request without a cleared inspection, and the verdict is a check.** Owlery opens a pull request only at a cleared head. It posts the check `inspection`, writes no review and merges nothing.
check: apps/desktop/test/chain.test.ts apps/desktop/test/pr-check.test.ts apps/desktop/test/inspection-state.test.ts apps/desktop/test/claude-adapter.test.ts apps/desktop/test/gate.test.ts

### What is the Owl Chain's alone

The review rounds and the fix passes, the judgment of whether the rounds converge, the ceiling of rounds, the four role definitions and the inspection's two tables are the Owl Chain's. **The broad gate is the Owl Chain's inspector module's own check:** the module names the repository's `Broad gate` command as the one check before the inspection. Another workflow may hold none of these, and its inspection says which checks ran. So what an inspection of the Owl Chain guarantees, that the broad gate passed on the inspected commit, is stated of the Owl Chain ([docs/product.md](product.md#what-an-inspection-guarantees-and-what-it-doesnt)).

### What no code reads yet

Owlery's daemon and chain command load the two built-in files and no other. They read no `agentory/workflows/`, no `agentory/inspectors/`, no workflow row of `routing.md` and no workflow key of `config.json`, and the loader names one workflow and one module, `owl-chain`. A person's own workflow and inspector module, other skeletons, the window's editor of a workflow, and publishing and adopting a shared one stand in the milestone `workflows: a person's own, and shared`, where issue #324 placed them.
