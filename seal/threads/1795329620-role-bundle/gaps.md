# Closing memo: 1795329620-role-bundle

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite, the typecheck over the whole app and the documents' checks of the `Broad gate` key, at the work item's last commit. Phase 1 ran the ten test files `trail/phases/phase-1.md` *Runs and their scope* names, and a typecheck of the changed files and what they import | the orchestrator's broad gate, after the review rounds |
| The six built-app test files phase 1 did not run: `daemon-restart`, `memory`, `korean-input`, `terminal-basics`, `work-item-form` and `work-item-menu`. Each starts `dist/daemon.js`, whose `main.ts` now gives the adapter a bundle folder and a rules folder, and each runs after a build that now copies the bundle | the orchestrator's broad gate |
| A real launch of the crafter at a fix pass and of the sealer at the seal. One real session ran, the proofer at a round. The other two pairs are held by script CLIs and the fake adapter alone, and their appended files' cost at a session's start is not measured (`frame/questions.md` Q5) | a measurement, when #41 and #42 run those stages |
| Whether the sealer's session runs on the model its definition names. `agents/sealer.md` keeps `model: opus` from the source, and no sealer was launched | a measurement, when #42 runs the sealer |
| The share of the appended rules file in the 33,249 tokens a proofer's round starts with. The run gave the total, and a comparison with a plain session recorded on another version of the CLI (`trail/phases/phase-1.md`) | a measurement, by the issue that cuts the core or the contract down (Q5) |
| Whether Claude Code 2.1.326 to 2.1.329 list a plugin's agents as `owlery:<role>` under `agents` on the `init` line, and print `plugin_errors`, as 2.1.330 does. The recorded plain session of 2.1.327 (`apps/desktop/test/fixtures/claude-stream.jsonl`) has the `agents` key, and no session with a plugin was recorded on those versions. On a version that lists them otherwise, every role launch fails with `the session does not hold the agent owlery:<role>` | a measurement on such a version, by whoever meets one; the owner's machine has 2.1.330 alone |
| The cases that stop a script CLI and read how soon the run ended were run on the owner's machine alone | the `macos-latest` runner of the pull request's `check` workflow (`.github/workflows/check.yml`) |

## Not done

No case holds each unchanged bundle file to its source. `frame/design.md` scenario 2 leaves that comparison to a reader, because the suite has no copy of AgenticSeal. Phase 1 made the comparison once, at `f56fb32`, and `trail/phases/phase-1.md` names its result.

The taken documents were not rewrapped where a change shortened a sentence. One line of `agents/sealer.md`, one of `skills/agent-contract/SKILL.md` and two frontmatter lines are longer than their neighbours. Rewrapping would add lines to the difference from the tag that carry no change of meaning, and `frame/design.md` *Scope* item 3 keeps that difference a short list.

The real role session's case does not check Claude Code's own state file. `frame/design.md` *Scope* item 13 names the four files it compares, and `~/.claude.json` is rewritten by every run of the CLI. The entry `owlery@inline` under `pluginUsage` was read once by hand after the run (`trail/phases/phase-1.md`).
