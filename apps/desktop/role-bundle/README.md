# The Owlery role bundle

This folder is a Claude Code plugin named `owlery`. The build copies it whole to `dist/bundle/`, beside the daemon's script. The daemon loads it into a role session, and into that session alone, with `--plugin-dir`. Nothing here is installed into a person's Claude Code.

A role session is a headless session launched as one role at one stage: the proofer at a review round, the crafter at a fix pass, or the sealer at the seal. The daemon picks the role's definition under `agents/` with `--agent owlery:<role>`. It appends the rules of the role and the stage to the session's system prompt as one file. The table of each stage's documents is in `apps/desktop/src/daemon/adapters/claude-roles.ts`. A session reads the bundle's other documents in this folder, where a step asks for one.

## Where the files come from

The files under `agents/`, `skills/`, `docs/` and `templates/` are taken from AgenticSeal 0.38.4 (https://github.com/MichaelYcJo/AgenticSeal, tag `v0.38.4`, commit `0eca6e7`). AgenticSeal is under the MIT License, and its text is `LICENSE` in this folder. Each file stands at the path it has in AgenticSeal, so a file compared with the same path at the tag shows what Owlery changed.

The 15 files taken:

| File | Who opens it |
|---|---|
| `agents/proofer.md`, `agents/crafter.md`, `agents/sealer.md` | The definition of each role |
| `skills/core/SKILL.md`, `skills/agent-contract/SKILL.md` | The rules every role is bound by |
| `skills/code-review/SKILL.md`, `skills/writing-style/SKILL.md`, `templates/records/sdd-round.md` | A proofer's round |
| `skills/implement/SKILL.md`, `skills/implement/fix-pass.md`, `skills/verify/SKILL.md`, `docs/forms/the-round-record.md`, `templates/records/sdd-gaps.md` | A crafter's fix pass, beyond the proofer's |
| `docs/forms/the-guarantee.md`, `templates/records/sdd-guarantee.md` | The sealer, beyond those |

## What Owlery changed

Five files differ from the tag, and every other taken file is byte for byte the tag's.

- `agents/proofer.md`, `agents/crafter.md` and `agents/sealer.md` have no `skills:` key in their frontmatter. The file the daemon appends is the one way the rules reach a role session.
- `agents/sealer.md` queues and draws no stamp. The sentence of *Job* on its writes reads "Under rule 6, your write is `guarantee.md`, and a write not named here is a write you do not make;". Step 6 of *Order of work*, "Queue the stamp once", is removed, and step 7 is step 6. The first bullet of *Never* has no sentence on the values file. The last bullet of *Never* reads "Choose a `Broad gate` command: the key is a person's."
- `skills/agent-contract/SKILL.md`, rule 11, says that each path "is the bundle's, at the root the head of these rules names". No harness prints a base directory for an appended file.
- The frontmatter `description` of `skills/core/SKILL.md` and of `skills/agent-contract/SKILL.md` says how the file reaches a role: "Not a command to run: the daemon appends it to the system prompt of every role session."

The manifest `.claude-plugin/plugin.json` and this file are Owlery's own. The manifest states no version: the bundle ships inside the app, so its version is the app's.

## What the bundle leaves out

- **No hook.** AgenticSeal's `SessionStart` hook prints the core, and its `Stop` hook draws the stamp. Both are for a session a person watches. The daemon appends the rules, and Owlery draws the seal from the records.
- **No script, no `lib/` and no `bin/`.** Whether Owlery takes AgenticSeal's scripts or rewrites them is decided by issue #40.
- **No orchestration document.** The daemon's code runs the order of a work item.
- **No `framer` and no `tracer` definition.** Milestone 2 runs neither role.
- **No drawing.** AgenticSeal's `TRADEMARKS.md` reserves its name and its drawings.

The taken documents still name `seal` commands, scripts, the orchestrator and AgenticSeal's local mode. The head of the appended rules file tells a role to report a step that needs something the bundle does not hold, and to put nothing in its place. The issue that builds each stage rewrites its role's text.

## Taking in a later release of AgenticSeal

A later release never reaches the bundle by itself. A work item carries it over, as `docs/architecture.md` *Taking in AgenticSeal's changes* states:

1. Read the `### Process changes` table of each release since the one this file names.
2. Compare the 15 paths above between that release's tag and the new one.
3. Carry each change it takes into the bundle's file, and keep the changes of *What Owlery changed*.
4. Write the reason for each change it does not take.
5. Move the release this file names.

A change to a file the bundle does not hold reaches Owlery through the daemon's code. One such change is 0.38.4's rewrite of `skills/implement/orchestration.md`, which issue #119 carries.
