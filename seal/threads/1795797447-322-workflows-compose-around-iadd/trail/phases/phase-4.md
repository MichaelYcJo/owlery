# Phase 4: 1795797447-322-workflows-compose-around-iadd

## What this phase found

**The frame holds, but for two things it does not say.** I judged it against `frame/design.md` *Scope* item 11, *A workflow as data*, *The stage's model*, *What holds for every workflow* and `## Removes`, and against `frame/questions.md` Q8 and Q9.

- **The bundle's own case reads the built bundle byte for byte.** `role-bundle.test.ts` held each file of `dist/bundle/` to the tree's bytes. Q8's default writes `model: opus` into the built `agents/inspector.md`, so the case now holds that one file to the tree's text with the line added as the frontmatter's last line, and every other file to its bytes. It also holds the built bundle to the loader.
- **The bundle's file set grows.** The case "holds no script, no library and no drawing" listed the files beside the four taken folders. It now lists `inspectors/owl-chain.json` and `workflows/owl-chain.json` too. Both are JSON, and the bundle still holds no script.

**What the loader reads, and where.** `src/daemon/workflow.ts#loadWorkflow` reads `workflows/owl-chain.json` and the module it names, and gives a stage for each pair of `ROLE_STAGES`. Four places call it:

- `main.ts`, once before the daemon makes anything, so a refused file stops the start with its sentence as the log's last line.
- `adapters/claude.ts#launchOf`, at each role launch, as the launch reads the bundle's documents again.
- `chain-command.ts#handed`, before it writes a stage's prompt, so a refused file is the command's refusal and nothing is written.
- `build.mjs`, through `writeDefinitionModels`, on the built copy, so a refused file stops the build.

The adapter's options did not change. It reads the workflow from the `bundleDir` it already holds, so the documents and the model of a launch come from the bundle as it stands, as the documents did before.

**Decisions the frame does not set.** Each was judged against *A workflow as data* and *What holds for every workflow*.

- **A stage's role is read and held to the skeleton.** The protocol's pairs and the grants are keyed by role and stage. A file that names another role at a stage would launch a definition under a grant that is not its own, so the loader refuses it and names the role the skeleton runs the stage as.
- **The agent's name is the one its definition states.** Claude Code names a plugin's agent by its frontmatter's `name:`, so `agentOf` takes that line, read by the loader, and `rulesHead` names the stage's `agent` path. The loader refuses an `agent` that is no file of the bundle's `agents/`, and a definition whose frontmatter names no agent.
- **The loader names one workflow and one module.** It refuses a `workflow` or an `inspector` other than `owl-chain`, which is the only name the verdict block's two lines write. `OWL_CHAIN` moved from `inspection-records.ts` to `workflow.ts`, and `inspection-records.ts` and `records-migration.ts` import it from there.
- **The module's checks are held to the one check the code runs.** The gate is code (`gate.ts`). A module that named another check would name one nothing runs, so the loader refuses a `checks` other than the broad gate's.
- **The provider is `claude`.** It is the one adapter that launches a role, and the loader refuses another name.
- **A model is a word with no white space, or null.** It reaches a role session as one argument and a definition's frontmatter as one line.
- **The form is strict.** A key the form does not know is refused by its path, as `stages.round.modle`, and so is a key it lacks. A path that is absolute, holds `..`, or names no file of the bundle is refused.
- **The build's step refuses a definition that names a model of its own.** A stage's model then has one home, its file. The source `agents/inspector.md` lost its `model: opus` line in this phase.

**The model in both launches.** A role session's arguments hold `--model <model>` after `--agent` where the stage names one (`claude.ts#claudeArgs`). `owed` prints `model` beside `agent`, `prompt` and `rules`, null for the three stages whose files name none. `skills/inspection/SKILL.md` tells the session to start the subagent on that model, or on its own where it is null, and to pass that model to `inspect`'s `--model`. The build writes the module's model into `dist/bundle/agents/inspector.md`, so a pane's inspector runs on opus whether or not its subagent tool takes a model (Q8's default). Q8 and Q9 stay open, and `gaps.md` *Not verified* names their answerer.

**Text that stood on the removed table.** `role-bundle/README.md` pointed at `claude-roles.ts` for the table of each stage's documents. It now has a section *The Owl Chain's two files*. The docstring of `shared/protocol.ts#ROLE_STAGES` said a new stage is "one row of each adapter's table". It now names the workflow. `docs/architecture.md` *Options for launching Claude Code* gained the row `--model <model>`, in both editions, with the same count of table rows.

**A case that moved.** In `claude-adapter.test.ts`, the case "starts no role session where the bundle lacks a document of the pair" removed `skills/code-review/SKILL.md`. The loader now refuses that first, at `stages.round.documents.0`, before the rules file is written. The case now holds both refusals: a document of every role by the rules file's sentence, and one the stage names by the loader's.

**Seen red.** Each new case was first run against the tree before the code. `workflow.test.ts` failed to load its module. `claude-adapter.test.ts` failed 31 of its 107 cases and `chain-command.test.ts` 19 of its 26, on the old API and the missing `model`. That red is broad, so the mutants below are what show each guard. Then, after `0541b7b0` and `80602d9b`, each guard was broken with `seal mutate`, and the file was restored from its held bytes:

- `workflow.ts`, 23 mutants in one batch over `workflow.test.ts`, all red. Each removed one guard: a key the form does not know, a key it lacks, the role, the `agents/` path, the agent's name, a path outside the bundle, a file the bundle does not hold, the list of documents, the provider, the model, the skeleton, the workflow's name, the inspector it names, the module's file, the module's name, the checks, the record's path, the object, the JSON's sentence, a path that is no string, the build's refusal of a definition's own model and of one with no frontmatter, and the skip of a null model.
- `adapters/claude.ts`, 3 mutants over `claude-adapter.test.ts`, all red: no `--model` in the arguments, the launch given no model, and a stage built from the pair alone in place of the loaded workflow.
- `adapters/claude-roles.ts`, 3 mutants over `claude-adapter.test.ts`, all red: the stage's documents left out, the agent named by the role in place of its definition's name, and the head naming `agents/<role>.md` in place of the stage's `agent`. The tree's bundle names each agent and each definition by its role, so no case before `80602d9b` tells the last two from the code, by reading. `80602d9b` added two assertions that give a stage another name and another path.
- `chain-command.ts`, 2 mutants over `chain-command.test.ts`, both red: `owed` printing no model, and the loader's error thrown as it is in place of the command's refusal.
- `build.mjs`, 1 mutant over the case of `role-bundle.test.ts` that reads `dist/bundle`, run as a built-app file: the call of `writeDefinitionModels` removed. It was red on the line that holds `agents/inspector.md` to the tree's text with `model: opus`. The mutated build left `dist/` without that line, and `node build.mjs` was run again after `seal mutate` restored the script.
- `main.ts`'s load at the daemon's start has no case, and no mutant was run on it. `gaps.md` *Not verified* names it.
- `chain-command.ts#handed`, 1 more mutant over the case "hands each stage as the bundle's workflow names it": the prompt written before the workflow is loaded. It was red on the line that holds the refused `owed`'s prompt file to `stale`.
