# IADD: Independent AI-Driven Development

*English · [한국어](./iadd.ko.md)*

This document is Owlery's definition of IADD, the method Owlery runs. Owlery is one tool that runs it, and the Owl Chain is the workflow Owlery ships for it. The owner set the concept, the principles and the names on 2026-11-28 (issue #322, *Concept and names*). The [AgenticSeal](https://github.com/MichaelYcJo/AgenticSeal) plugin, where Owlery started, writes its own definition of the same method under the same names (MichaelYcJo/AgenticSeal#1651), and the owner set that the two definitions are compared and merged once both stand. The two tools share one vocabulary and one records folder, and no table maps one tool's names onto the other's.

## The concept

**IADD — Independent AI-Driven Development.** *Zero Self-Approval: no AI approves its own work.*

The AIs that frame, craft, proof and inspect a piece of work are independent of one another, and none leans on another's judgment. The person answers once, before the first edit, and merges on the inspection. The inspection is bound to one commit, lapses at the next, and shows to everyone as a pull request check.

*Independent* is meant in the sense of an independent audit: a party apart from the one that did the work. It does not mean that the AI acts on its own. IADD is always written in capitals.

## The principles

1. **The person judges before, once, not after.** Every question is asked in one batch before the first edit.
2. **Whoever made it does not clear it.** Each party reads the others' records as claims and reaches its own result.
3. **An inspection belongs to one commit and lapses at the next.** Anyone sees its state on the pull request.
4. **A script answers what is exact, and judgment is spent where meaning is the question.** Every claim is labelled executed, read or unverified.
5. **Records are temporary, and code and rules remain.** Rules change by what each judgment cost and caught.

## How IADD differs from ADD

The definitions of Agent Driven Development read on 2026-11-28 (agentdriven.dev, Remo Jansen's Agent Driven Development, and pilotspace's ADD) share no workflow. They leave the final judgment of the result to the person, or let the agent that built the work write its own verdict. IADD gives that judgment to an AI that did not build the work, and binds it to one commit that anyone can read on the pull request.

## Names

### The rule the names follow

**A name that a reader meets on the pull request page, inside Claude Code or in the chain's own documents reads one way.** A plain word that already means something there is not taken, and the names weighed and set aside are listed below, so that nobody proposes them again.

**IADD is the higher concept, and a product only expresses it.** The owner set this rule on 2026-11-28 (issue #344). Owlery is one product that runs IADD and the AgenticSeal plugin is another, so no IADD name is chosen to pair with a product, and no product takes the method's name: the plugin keeps its name `agentic`. The records folder is named for what it is, a place: `agentory/`, formed like *directory* and *repository*, the place where the agents' settings, workflows and threads are kept. A method's acronym is hard for a newcomer to read as a folder.

### The names

| What | Name |
|---|---|
| The method | IADD, in capitals, with *Zero Self-Approval* as its line |
| The default workflow | the Owl Chain in prose, and `owl-chain` as the name of a workflow and of an inspector module |
| The roles | framer, crafter, proofer, orchestrator and tracer, as before, and the inspector, the final role, which inspects. Owlery's role bundle holds no tracer |
| The inspector's record | the inspection, `inspection.md` |
| The states of an inspection | cleared, lapsed, and not cleared where no inspection stands |
| The records folder | `agentory/`, told by the first line of its `README.md`, `# What IADD keeps in agentory/` |
| The step that folds a release's records into the policy documents | settle, acting on `agentory/threads/` |
| A work item's directory | a thread, `agentory/threads/<work item>/` |
| The trailers Owlery writes | `IADD-Routing:` and `IADD-Built-By:` |
| The pull request check | `inspection` |
| The app | Owlery, one tool that runs IADD |

The app keeps the name Owlery, which the owner set on 2026-11-28 with the concept. IADD is the method and Owlery one tool that runs it, and "owl" alone collides with W3C's OWL, Odoo's OWL and Owl Carousel ([docs/name.md](name.md)).

### Names set aside

Each of these was weighed and failed the rule above, so none is proposed again.

- **For a role or its word:** *planner* (Claude Code's Plan agent and plan mode), *builder* (the word the chain's documents already use for whichever party builds), *reviewer* (GitHub's requested reviewers, and the `code-review` skill), *verifier* (the `verify` skill), and *auditor*, *referee*, *arbiter* and *guarantor* for the last role.
- **For the last role's record or its states:** *approval* and *approved* (GitHub's review approvals, and Claude Approvals), *passed* and *not passed* ("All checks have passed" on the same page), *judgment* (the word for what an agent spends where meaning is the question), and *verdict*, *clearance* and *guarantee*.
- **For the method:** spec-driven (the code and the policy are the truth, not a spec), Evidence-Driven, Trust Engineering, ACE (Agentic Context Engineering, ICLR 2026, and an agentic coding tool's `.ace/`), AIDD (O'Reilly's AI-Driven Development, and drug discovery), ACODE (the Acode editor), AAD (Azure Active Directory), AADD, Merge on Seal, Delegated Judgment, AI-Judged, ABIC, ACOD, ACRD and AI Turnkey.
- **For settle:** resolve-threads, which reads as GitHub's review threads (`resolveReviewThread`) on the pull request page.
- **For the records folder:** the method's own name (a method is not a place, and its acronym is hard for a newcomer to read as a folder), and, each for a collision, `agentics` (githubnext/agentics), `agency` (agency-agents and Agency Swarm), `agents`, `agentworks`, `agentarium`, `ai-trail`, `inspections` and `iagentics`.

IADD was searched on the web, GitHub, npm, PyPI and arXiv on 2026-11-28, and no method or AI tool used it. Lowercase `iadd` is Python's in-place add, and the name of two small plugins of git and hledger.

## The records

### The records folder

**A repository's work records stand under `agentory/`, committed, and the first line of `agentory/README.md` tells the folder.** Connecting a repository writes the folder with its `README.md` and `config.json` ([Records are committed to the repository](architecture.md#records-are-committed-to-the-repository)). The folder has one name, and a repository that keeps an `agentory/` of its own without that line is refused at the setup.

- `config.json` holds what the repository says about itself: the `Broad gate` command and the languages of commits and of records.
- `threads/<work item>/` holds one work item's records: `routing.md`, `frame/`, `trail/` with the review rounds and the broad gate's runs, `decisions.md`, `inspection.md`, `changelog.md`, `gaps.md` and `pr.md`.
- `workflows/<name>.json` and `inspectors/<name>.json` will hold a repository's own workflows and inspector modules. No code of Owlery reads them yet ([What no code reads yet](#what-no-code-reads-yet)).

Records in the form the AgenticSeal plugin wrote, under `seal/`, are read as records by the migration alone, which moves them to `agentory/` in one commit the person reads first ([Records are committed to the repository](architecture.md#records-are-committed-to-the-repository)).

### The inspection and its check

**The inspection is the newest verdict block of the work item's `inspection.md`, and it names one commit.** The block opens with three backticks and `iadd`. It holds the inspected commit and its base, the verdict (`cleared`, `withheld` with a reason, or `undecided` with a question), each session that built the work, the session that inspected it, the inspecting model, Owlery's version, the workflow and the inspector module.

**The check `inspection` shows the inspection's state on the pull request's head commit.** It runs on GitHub without the app and reads the same committed records.

| State | When |
|---|---|
| cleared | The head commit carries a cleared inspection, and nothing but the closing records changed after the inspected commit |
| lapsed | A cleared inspection stands, and a later commit, a merge of the base among them, changed more than the closing records |
| not cleared | No cleared inspection stands at the head commit |

`README.md` *The inspection check on GitHub* gives each title the check posts.
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

Owlery's code holds these whatever a workflow file says.

1. **Zero Self-Approval.** The session that inspects built none of the work. Owlery writes no verdict where the inspecting session is one of the building sessions, and the check refuses such a block.
2. **One commit.** An inspection names one commit. It is cleared at a branch's head only where nothing but the closing records differs between that commit and the head, and it lapses otherwise. The answer is read from the head's committed records alone.
3. **Owlery writes the records.** Owlery's code writes and commits each record, and a stage that reviews or inspects holds no tool that writes a file.
4. **Code keeps the order.** The step owed comes from the committed records through the skeleton's function. No document and no agent starts, orders or skips a stage.
5. **A stage holds its kind's grant.** In the daemon's chain a stage's session runs in the sandbox its grant names. In a pane a role is a subagent whose definition names its tools, and the person's own permission settings answer it, which issue #286 holds.
6. **The inspection says what produced it.** The verdict block names the workflow, the inspector module, each session that built, the session that inspected, its model and Owlery's version, and each check's passed run stands in `trail/gate.md` at the inspected commit.
7. **No pull request without a cleared inspection, and the verdict is a check.** Owlery opens a pull request only at a cleared head. It posts the check `inspection`, writes no review and merges nothing.
check: apps/desktop/test/chain.test.ts apps/desktop/test/pr-check.test.ts apps/desktop/test/inspection-state.test.ts apps/desktop/test/claude-adapter.test.ts

### What is the Owl Chain's alone

The review rounds and the fix passes, the judgment of whether the rounds converge, the ceiling of rounds, the four role definitions and the inspection's two tables are the Owl Chain's. **The broad gate is the Owl Chain's inspector module's own check:** the module names the repository's `Broad gate` command as the one check before the inspection. Another workflow may hold none of these, and its inspection says which checks ran. So what an inspection of the Owl Chain guarantees, that the broad gate passed on the inspected commit, is stated of the Owl Chain ([docs/product.md](product.md#what-an-inspection-guarantees-and-what-it-doesnt)).

### What no code reads yet

Owlery's daemon and chain command load the two built-in files and no other. They read no `agentory/workflows/`, no `agentory/inspectors/`, no workflow row of `routing.md` and no workflow key of `config.json`, and the loader names one workflow and one module, `owl-chain`. A person's own workflow and inspector module, other skeletons, the window's editor of a workflow, and publishing and adopting a shared one are issue #324's to place.
