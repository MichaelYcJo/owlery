# The Owlery role bundle

This folder is a Claude Code plugin named `owlery`. It holds the roles of the Owl Chain, Owlery's default workflow of IADD (Independent AI-Driven Development, whose line is *Zero Self-Approval*: no AI approves its own work). The Owl Chain runs review rounds, a broad gate and an inspection on a branch, and the inspector that clears the branch built none of it. `docs/iadd.md` at the top of Owlery's repository defines the method, and the app does not ship that document. The build copies the folder whole to `dist/bundle/`, beside the daemon's script and the chain command's, and writes into the copy of each stage's definition the model the stage names, which *The Owl Chain's two files* below describes. Two launches load it, each with `--plugin-dir` and each for one session alone. Nothing here is installed into a person's Claude Code.

## The two launches

**A role session of the daemon.** A role session is a headless session launched as one role at one stage: the proofer at a review round, the crafter at a fix pass, the inspector at the inspection, or the orchestrator at a judgment. The daemon picks the role's definition under `agents/` with `--agent owlery:<role>`. It passes the stage's model with `--model` where the stage names one, and appends the rules of the role and the stage to the session's system prompt as one file. A session reads the bundle's other documents in this folder, where a step asks for one. The daemon answers each call of a role session that asks for permission, and it writes and commits each record.

**A Claude Code pane of a repository on the Owl Chain.** A Claude Code pane of a repository on the Owl Chain loads the same folder, and the person's own plugins and skills stay beside it. The pane's session gets three things from it:

- `skills/inspection/SKILL.md`, which says how the session runs the chain through the chain command its environment names in `OWLERY_CHAIN`. The command says which stage the records owe, and writes and commits each record.
- The four definitions under `agents/`, as subagents named `owlery:<role>`. The session starts the proofer, the crafter and the inspector with the prompt and the rules file the command hands it, on the model the command prints for the stage where it names one. That file holds the documents a role session is launched with, under a head that says what holds in a pane: the person's own permission settings answer a call, and the role holds those of the tools its definition names that the session offers. The session makes the orchestrator's two judgments itself.
- The hook of `hooks/hooks.json`, which *The hook* below describes.

In both launches a judging role writes no record, and the gate is a run of Owlery's code that reads an exit code.

## The Owl Chain's two files

`workflows/owl-chain.json` is the Owl Chain's workflow: it names its skeleton, `rounds-then-inspection`, the content of the stages `round`, `fix-pass` and `judgment`, and its inspector module. `inspectors/owl-chain.json` is that module: it names the broad gate as the one check before the inspection, the inspector's stage and the template of the record the inspector answers with. A stage names its role, its agent's definition, the documents its launch carries after the core and the agent contract, its provider and its model, where `null` is the CLI's own default. Both launches read each stage from these files, through `apps/desktop/src/daemon/workflow.ts`, which refuses a file that does not hold to the skeleton or to the form and names the file and the key. The order of the stages and each stage's tools stay Owlery's code. No definition under `agents/` names a model: the inspector's, `opus`, stands in the module alone, and the build writes it into the built copy of `agents/inspector.md`.

## The hook

The bundle holds one hook, a `PreToolUse` hook on the tool `AskUserQuestion`. Its command runs the chain command's `ask` subcommand, and does nothing where the environment names no `OWLERY_CHAIN`. `ask` refuses the call where the work item's `routing.md` answers `Automation` `yes`, and its reason tells the session to go on with the question's default and to write the question with that default into the work item's `frame/questions.md`. It lets through a call one of whose questions opens with `No default can be taken: ` and a reason. It lets every call through where no work item's directory names the branch, where the routing holds no `Automation` row, and where the row reads `no`. The hook acts in a pane alone: a role session of the daemon runs with every hook off and with no `OWLERY_CHAIN`.

## Where the files come from

The files under `agents/`, `skills/`, `docs/` and `templates/` started from AgenticSeal 0.38.4 (https://github.com/MichaelYcJo/AgenticSeal, tag `v0.38.4`, commit `0eca6e7`). AgenticSeal is under the MIT License, and its text is `LICENSE` in this folder.

The files are Owlery's own from the day they were taken, and Owlery changes them for its own chain's two launches. Owlery follows no release of AgenticSeal, and nothing holds a file here to AgenticSeal's bytes. What Owlery changed is in git.

The manifest `.claude-plugin/plugin.json` states no version: the bundle ships inside the app, so its version is the app's.

## What the bundle leaves out

- **No hook that prints the rules or draws a stamp.** AgenticSeal's `SessionStart` hook prints the core, and its `Stop` hook draws the stamp. The rules reach a role in its rules file, and Owlery draws the inspection from the records. The one hook the bundle holds is the one *The hook* above describes.
- **No script, no `lib/` and no `bin/`.** The scripts of the pull request check stand in `pr-check/` at the top of the repository, which the app does not ship.
- **No document that states the order.** Owlery's code runs the order of a work item's chain, in the daemon and in the chain command, and `skills/inspection/SKILL.md` tells a pane's session how to ask the command for the stage owed. The bundle holds the orchestrator's definition, `agents/orchestrator.md`, for the two judgments the daemon asks of its orchestrator agent and a pane's session makes itself: whether the review rounds are converging, and what a stage's question is decided as.
- **No `framer` and no `tracer` definition.** The Owl Chain starts at round 1, on a branch that is built, and runs neither role.
- **No drawing.** AgenticSeal's `TRADEMARKS.md` reserves its name and its drawings.

The proofer's definition, the crafter's, the inspector's, the fix pass's document, the round record's form, the inspection's form and the inspection's template say what the Owl Chain does in both launches, and name the party that writes a record as Owlery: the daemon in a chain it runs, and the chain command in a pane. A proofer works in the work item's worktree and its answer is its round record, Owlery writes and commits that record, a crafter commits its fixes and appends the close blocks, Owlery commits the record after the pass, and an inspector reads the commit Owlery's run of the broad gate passed on and answers with its run's section of the inspection, which Owlery completes with who built the work and who inspected it, writes and commits. The orchestrator's definition is Owlery's own and started from no file of AgenticSeal. The other taken documents still name AgenticSeal's commands, scripts, the orchestrator and AgenticSeal's local mode, and so do the sentences of those seven that belong to a stage no issue has built yet. The head of a role's rules file tells a role to report a step that needs something the bundle does not hold, and to put nothing in its place. The issue that builds each stage rewrites its role's text.
