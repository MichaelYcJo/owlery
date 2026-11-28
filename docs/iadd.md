# IADD in Owlery

*English · [한국어](./iadd.ko.md)*

**Owlery is a product built on IADD, Independent AI-Driven Development, the method the [IADD specification](https://github.com/MichaelYcJo/iadd-workflows/blob/main/spec/iadd.md) defines.** The specification holds the method's principles. Owlery takes from it what serves Owlery, and a change to it is weighed like any other source, not followed by rule. This document states how Owlery runs IADD, what it takes from each principle, its own names and its own record forms, and the Owl Chain as data. Owlery started from the AgenticSeal plugin, another product built on IADD ([Where Owlery started](architecture.md#where-owlery-started)), and is defined by neither the plugin nor the specification.

## How Owlery runs IADD

| What | Owlery's choice |
|---|---|
| The harness | a desktop app's daemon, which starts each stage as a role session in its own sandbox, and the panes of its window, whose Claude Code session carries the Owl Chain |
| The parties | the orchestrator, the crafter, the proofer and the inspector. The role bundle holds no framer and no tracer. The orchestrator is the session that runs the work and also an agent of the role bundle, which rules on questions and `undecided` verdicts in the daemon's chain |
| How a run ends | at a pull request. Owlery writes `open the pull request` as the `Destination` of every work item it routes. Where a routing names `stop before the pull request`, the chain rests at the cleared branch and opens none, and no screen offers that yet |
| A question after the outset | the daemon decides it from the code and the policy, records the decision in `decisions.md`, and goes on, and the person reads what was asked and chosen in the inbox. A question with no default that can be taken parks its one work item while the others go on. The batch at the outset is milestone 3's ([docs/roadmap.md](roadmap.md#milestones)). A pane under `Automation` `yes` takes the question's default and writes it into `frame/questions.md`, and only a question that opens `No default can be taken: ` reaches the person (#363) |
| Who writes the records and keeps the order | Owlery's code, from the committed records ([What holds for every workflow](#what-holds-for-every-workflow)) |
| A merge of the base after the inspected commit | it lapses the inspection where it changes a path other than the closing records, as every other commit does |
| Who answers an `undecided` verdict first | the orchestrator agent, whose ruling is committed to `decisions.md`. It rules on the first two, and from the third the work item parks for the person |

## What Owlery takes from each principle

| Principle | What Owlery holds, and where |
|---|---|
| 1. A question never holds the work | the row *Asking the person* of [What changes because Owlery is not a plugin](architecture.md#what-changes-because-owlery-is-not-a-plugin), and `decisions.md`, whose decisions a later answer reverses ([Records are committed to the repository](architecture.md#records-are-committed-to-the-repository)) |
| 2. Whoever made it does not clear it | invariant 1 below |
| 3. Independent AIs talk through the thread's records | each role session starts without the person's settings, hooks or servers ([Role sessions run detached from the user's environment](architecture.md#role-sessions-run-detached-from-the-users-environment)), and the daemon writes each stage's prompt from the committed records |
| 4. An inspection belongs to one commit | invariant 2 below |
| 5. A script answers what is exact | Owlery's code runs the broad gate and reads its exit code. The labels `executed`, `read` and `unverified` stand in the role bundle's proofer and agent contract, and no code reads them yet (#367) |
| 6. A judgment stands on a source document | every decision, ruling and question of `decisions.md` holds its `grounds:`, and the role bundle's core states the rule |
| 7. A rule is guidance for a judgment | the role bundle's core. No document of the bundle restates the order, which code keeps ([Code runs the order, the orchestrator judges](architecture.md#code-runs-the-order-the-orchestrator-judges)) |
| 8. Some links no party skips | invariants 1 to 7 below, each held by code in the daemon's chain. In a pane the judging roles are bounded by the person's own settings (#286), and the check alone holds that a pull request opens only at a cleared inspection (#369) |
| 9. A mechanism is kept against its cost | the role bundle's core, and the inspection sheet, which shows a work item's cost beside what its rounds found ([State lives in three places](architecture.md#state-lives-in-three-places)) |
| 10. A document is cut by who opens it | each stage of the Owl Chain's two files names the documents its launch carries ([What each session loads](architecture.md#what-each-session-loads)) |
| 11. Records are temporary | the settle. Owlery's own command lists what a settle keeps and removes nothing yet (#139), and this repository settles with the plugin |
check: apps/desktop/test/claude-adapter.test.ts apps/desktop/test/decision-record.test.ts apps/desktop/test/role-bundle.test.ts apps/desktop/test/settle.test.ts apps/desktop/test/gate.test.ts

## Names

The method's names are the specification's ([Names](https://github.com/MichaelYcJo/iadd-workflows/blob/main/spec/iadd.md#7-names)). These are Owlery's own.

| What | Name |
|---|---|
| Owlery's default workflow | the Owl Chain in prose, and `owl-chain` as the name of a workflow and of an inspector module |
| The records folder | `agentory/`, formed like *directory* and *repository*, the place where the agents' work is kept |
| The pull request check | `inspection` |
| The app | Owlery, one product built on IADD |

The app keeps the name Owlery, which the owner set on 2026-11-28 with the concept. IADD is the method and Owlery one product built on it, and "owl" alone collides with W3C's OWL, Odoo's OWL and Owl Carousel ([docs/name.md](name.md)).

## The records

**Owlery's records of a repository's work stand under `agentory/`, committed.** These are Owlery's own forms. The daemon writes them as stated here, and the daemon and the pull request check read them so, apart from what [The three states, as Owlery reads them](#the-three-states-as-owlery-reads-them) names. Records in the form the AgenticSeal plugin wrote before its release 0.40.0, under `seal/`, are read by the migration alone, which moves them to `agentory/` in one commit the person reads first ([Records are committed to the repository](architecture.md#records-are-committed-to-the-repository)).

### The root and its configuration

- **`agentory/README.md` opens with the line `# What IADD keeps in agentory/`.** That line is the marker, and a repository that keeps an `agentory/` of its own without it is refused at the setup. Connecting a repository writes the folder with its `README.md` and `config.json`. The root is committed, and Owlery keeps no root outside the tree.
- **`agentory/config.json`** holds one key per item. Owlery writes `Commit and pull request language`, `Record language` and `Broad gate`, and reads `Broad gate` and `Heavy commands`, the commands that take their turn on the machine. The pull request check also reads `Policy root`.
- `agentory/workflows/<name>.json` and `agentory/inspectors/<name>.json` will hold a repository's own workflows and inspector modules, and no code reads them yet ([What no code reads yet](#what-no-code-reads-yet)).
- **`agentory/parity.json`** declares a migration, and the pull request check alone reads it. Where it stands and a pull request changes a path outside `docs/` and `agentory/`, the check refuses each round block, and the newest verdict block of a work item that goes `straight to the PR`, that holds no `original:` line naming the file's `Baseline commit`. Owlery writes no `original:` line ([Records are committed to the repository](architecture.md#records-are-committed-to-the-repository)).

### A work item's directory

A work item's records stand in `agentory/threads/<seconds>-<slug>/`, where `<seconds>` is the time of the chain's first start and `<slug>` the slug of the last part of the branch's name, or `work-item` where that gives none. The readers find the directory by the `Branch` row of its `routing.md`, not by its name:

| File | What it holds |
|---|---|
| `routing.md` | the rows `Review`, `Destination`, `Planning`, `Implementation`, `Automation` and `Branch`, and why. `Review` answers `through the review chain` or `straight to the PR`, and `Destination` answers `open the pull request` or `stop before the pull request`. A file without those two answers and a `Branch` declares no work item |
| `frame/design.md`, `frame/plan.md`, `frame/questions.md` | the design, the phases, and the questions with their answers or defaults |
| `decisions.md` | each decision made without asking, each ruling, and each question that parks the work item, as blocks opened by `decision:` or `question:`, each with its `grounds:` and its state |
| `trail/phases/phase-N.md` | what building one phase found |
| `trail/rounds/round-N.md` | one review round |
| `trail/gate.md` | each passing run of the broad gate |
| `trail/refusals.md` | one row for each tool call a role session's grant refused, under the columns `Stage`, `Role`, `Tool`, `What the call does` and `Rule` |
| `gaps.md`, `changelog.md`, `pr.md` | what was not verified; the entry in the next release's notes, which the pull request body carries whole under *What changed*; and a text Owlery copies into no body |
| `inspection.md` | the inspection |

**The closing records are `trail/gate.md`, `inspection.md` and `trail/refusals.md`.**

### The record blocks

- **A field a script reads stands inside an `iadd` block**, a fenced block opened by a line of three backticks and `iadd` alone, outside every other fence. Every line is a field written `name: value`, and the key of its first line names the block's kind.
- **A round** holds one block opened by `target: <commit> against <base>`, or `target: <commit>, fixes <a>..<b>` for a verifying round, and at most one `original:`. A finding stands in its own `### <n>. <symptom>` section under `## Findings`, with a block opened by `severity:` (`must` or `should`, though the readers take any word) holding `location:` and, where the claim names one, `evidence:`, and at most one of `regression:` and `reopens:`; `regression:` names `round-<N>#<n>` or `round-<N>`, and `reopens:` names `round-<N>#<n>`. A close block opens with `verdict:` (`fixed <commit>`, `rejected` or `deferred <home>`) and may hold `answer:` and `location:`. A confirmation is a block `confirms: round-<N>#<n>`, or `confirms: none`.
- **The inspection** is one block per run of the inspector, appended and never edited: `target: <commit> against <base>`, at most one `original:`, and `Verdict:` written as `cleared`, `withheld reason: <…>` or `undecided question: <…>`. Owlery's code adds `built-by:` (each session that built the work), `inspected-by:`, `model:`, `rules:` (`owlery <version>`), `workflow:` and `inspector:`.
- **The gate record** holds one block per passing run, `run: <commit> against <base commit>`.
- **`decisions.md`** holds one block per decision, opened by `decision: <id> <kind>`, the kind `route`, `default`, `scope` or `answered`. It holds `decided:`, `grounds:`, at most one `by:`, `state:` (`decided`, `reversed`, `applied <commit>` or `carried <home>`), and, in every state but `decided`, `reversal:`. A question is a block opened by `question: <id>`, holding `asks:`, `grounds:`, at most one `by:`, any number of `option:` lines, at most one `default:`, `state:` (`open` or `answered`), and, once answered, `answer:`. The daemon alone reads them.

### The three states, as Owlery reads them

| State | When |
|---|---|
| cleared | the newest verdict reads `cleared`, nothing but the closing records changed between its commit and the head, and the daemon's chain owes no step at the head |
| lapsed | the newest verdict reads `cleared`, and a commit after it changed more than the closing records or the head no longer holds the cleared commit, or, in the daemon, the chain owes a step at the head or a record the head holds does not read |
| not cleared | the head holds no verdict block, or the newest one reads `withheld` or `undecided` |

Outside the work item's directory, every commit after the cleared one is walked. Inside it the two trees are compared, so a record changed and reverted after the inspection leaves it cleared (#365).

The pull request check reads no `decisions.md`, so an open question or a reversed decision that lapses the inspection in the window leaves the check cleared. A record the check refuses fails the check as refused, not as lapsed ([pr-check/README.md](../pr-check/README.md)).

### The trailers

- `IADD-Routing: <work item>` stands on each commit that records a stage.
- `IADD-Built-By: <session>` names the session that built a fix pass, on the commit that records it.
- A commit written before the rename to IADD carries `Seal-Routing:` or `Seal-Built-By:`. The check reads `Seal-Routing:` beside `IADD-Routing:`, the daemon reads `Seal-Built-By:` beside `IADD-Built-By:`, and Owlery writes neither.

### The inspection and its check

**The check `inspection` shows the inspection's state on the pull request's head commit.** It runs on GitHub without the app and reads the same committed records. `README.md` *The inspection check on GitHub* gives each title the check posts.
check: apps/desktop/test/inspection-state.test.ts apps/desktop/test/pr-check.test.ts

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

Owlery's code holds the seven invariants of the specification ([The invariants of every workflow](https://github.com/MichaelYcJo/iadd-workflows/blob/main/spec/iadd.md#5-the-invariants-of-every-workflow)) whatever a workflow file says, as follows.

1. **Whoever made it does not clear it.** The session that inspects built none of the work. Owlery writes no verdict where the inspecting session is one of the building sessions, and the check refuses such a block.
2. **One commit.** An inspection names one commit. It is cleared at a branch's head only where nothing but the closing records differs between that commit and the head, and it lapses otherwise. The answer is read from the head's committed records alone. [The three states, as Owlery reads them](#the-three-states-as-owlery-reads-them) gives how Owlery reads it.
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
