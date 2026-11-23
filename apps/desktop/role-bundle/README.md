# The Owlery role bundle

This folder is a Claude Code plugin named `owlery`. The build copies it whole to `dist/bundle/`, beside the daemon's script. The daemon loads it into a role session, and into that session alone, with `--plugin-dir`. Nothing here is installed into a person's Claude Code.

A role session is a headless session launched as one role at one stage: the proofer at a review round, the crafter at a fix pass, the sealer at the seal, or the orchestrator at a judgment. The daemon picks the role's definition under `agents/` with `--agent owlery:<role>`. It appends the rules of the role and the stage to the session's system prompt as one file. The table of each stage's documents is in `apps/desktop/src/daemon/adapters/claude-roles.ts`. A session reads the bundle's other documents in this folder, where a step asks for one.

## Where the files come from

The files under `agents/`, `skills/`, `docs/` and `templates/` started from AgenticSeal 0.38.4 (https://github.com/MichaelYcJo/AgenticSeal, tag `v0.38.4`, commit `0eca6e7`). AgenticSeal is under the MIT License, and its text is `LICENSE` in this folder.

The files are Owlery's own from the day they were taken, and Owlery changes them for its own daemon. Owlery follows no release of AgenticSeal, and nothing holds a file here to AgenticSeal's bytes. What Owlery changed is in git.

The manifest `.claude-plugin/plugin.json` states no version: the bundle ships inside the app, so its version is the app's.

## What the bundle leaves out

- **No hook.** AgenticSeal's `SessionStart` hook prints the core, and its `Stop` hook draws the stamp. Both are for a session a person watches. The daemon appends the rules, and Owlery draws the seal from the records.
- **No script, no `lib/` and no `bin/`.** The scripts of the pull request check stand in `pr-check/` at the top of the repository, which the app does not ship.
- **No orchestration document.** The daemon's code runs the order of a work item. The bundle holds the orchestrator's definition, `agents/orchestrator.md`, for the two judgments the daemon asks of it: whether the review rounds are converging, and what a stage's question is decided as.
- **No `framer` and no `tracer` definition.** Milestone 2 runs neither role.
- **No drawing.** AgenticSeal's `TRADEMARKS.md` reserves its name and its drawings.

The proofer's definition, the crafter's, the fix pass's document and the round record's form say what the daemon's chain does: a proofer works in the work item's worktree and its answer is its round record, the daemon writes and commits that record, a crafter commits its fixes and appends the close blocks, and the daemon commits the record after the pass. The orchestrator's definition is Owlery's own and started from no file of AgenticSeal. The other taken documents still name `seal` commands, scripts, the orchestrator and AgenticSeal's local mode, and so do the sentences of those four that belong to a stage no issue has built yet. The head of the appended rules file tells a role to report a step that needs something the bundle does not hold, and to put nothing in its place. The issue that builds each stage rewrites its role's text.
