# Design: 1795797447-322-workflows-compose-around-iadd

## Grounding

The tree as read at `80bfad8a`.

Each row is labelled `read` where a file was opened and `executed` where a command gave the fact. The commands ran in the worktree at that commit unless the row names another place.

| Policy clause | What it fixes for this work |
|---|---|
| `routing.md` of this work item, `read` | Review through the review chain, a pull request, a crafter, `Automation` `yes`. This repository's own records stay under `seal/` in the AgenticSeal plugin's forms, and nothing here migrates this repository. |
| Issue #322, body and each comment, `executed` (`gh issue view 322 --json title,body,comments,milestone,labels`) | The direction of 2026-11-27, the questions for the design, the research to do, the competitive reading, the owner's premise that judging an inspector is the person's call, *Concept and names, set by the owner on 2026-11-28*, and *When it lands*. Its comment of 2026-11-27T14:35:46Z says the body's names supersede the older table. No comment changes the request beyond that. |
| The orchestrator's two additions to the scope, received during the frame, the orchestrator's finding | The frame decides the check's name and the workflow's file name, under the constraint that a connected repository's migration moves the file and this repository's `owlery-seal.yml` stays. The stage is designed so that issue #129's defaults and recommendations sit on it, and the plan says whether #129 is a phase here. |
| Issue #129, `executed` (`gh issue view 129 --json body,comments`) | Each stage has a default model the person sets once, the orchestrator recommends above or below it at routing, the daemon launches each stage on the chosen model, nothing moves a stage to a costlier model by itself, and the judging role's model is recorded. |
| `docs/product.md` *What we promise*, *The seal*, *The seal belongs to the product and looks the same everywhere*, *What the seal guarantees and what it doesn't*, *Open decisions*, `read` | The promise, the three places a seal shows, the rule that a party that built the work cannot seal it, and the open row *Plugins on the sealing side*, which this work's direction answers in part. Each is stated in the seal's vocabulary. |
| `docs/architecture.md` *What each session loads*, *What we take from AgenticSeal*, *What changes because Owlery is not a plugin*, *Records are committed to the repository*, *Compatibility with AgenticSeal*, *Code runs the order, the orchestrator judges*, `read` | The order is Owlery's code (`chain.ts#stepOwed`) and no document restates it. Owlery's code writes each record. The daemon and the check read the same committed records at the head commit. A role's tools and sandbox come from its grant. The chain choice between the owl chain and the AgenticSeal plugin, and the root's second name `agentic-seal/`, are stated there as rules. |
| `docs/roadmap.md` *Releases and the tracker*, `read` | A release's settle runs `pnpm --filter @owlery/desktop run settle --apply`, which runs AgenticSeal's `seal settle --apply`. The release rows state shipped releases in the old names. |
| `README.md`, `read` | *The seal check on GitHub* states the check's name `seal`, its titles and its states. *Relationship to AgenticSeal* states that Owlery is built on AgenticSeal's workflow. |
| `seal/config.json`, `read` | The broad gate requires each of `docs/*.md` and `README.md` to have a `.ko.md` edition with the same number of headings and of table rows. A new document under `docs/` needs its Korean edition in the same pull request. |
| `seal/follow-up.md`, `executed` (`ls seal/`) | The file does not stand. `seal/` holds `README.md`, `config.json` and `threads/`, and `threads/` holds this work item alone. No earlier work item's records stand in the tree. |
| The latest GitHub Release's `### Process changes`, `executed` (`gh release view --json tagName,body`) | The release's body holds no such heading. |
| `apps/desktop/src/daemon/records-place.ts`, `read` | `MARKER` is `# What AgenticSeal maintains in seal/`. `ROOTS` is `seal` and `agentic-seal`. `WORKFLOW` is `.github/workflows/owlery-seal.yml`, and `onOwlChain` reads whether that file stands. `PLUGIN_WORKFLOW` and `PLUGIN_CHECK` tell AgenticSeal's `hygiene.yml`. `workflowText` writes `name: seal` and clones `pr-check/` at the tag of the app's version. |
| `apps/desktop/src/daemon/claude-plugins.ts`, `pane-chain.ts#carriedIn`, `repositories.ts`, `read` | The plugin's detection reads the person's Claude Code settings and `installed_plugins.json`. `carriedIn` withholds the bundle where the plugin is enabled and no answer is kept. The answer is stored as `paneChain` in `repositories.json`, and the reader takes a file with or without that key. |
| `apps/desktop/src/daemon/settle.ts`, `scripts/settle.mjs`, `read` | `--apply` runs the program `seal` found on the path with `settle --apply`, then puts back each directory its reading of `decisions.md` kept. |
| `git log --oneline --diff-filter=A -- 'seal/threads/*/decisions.md'`, `executed` | It prints nothing: no commit of this repository ever added a `decisions.md` under `seal/threads/`. The settle wrapper's reading has kept no directory of this repository. |
| `apps/desktop/src/shared/protocol.ts#ROLE_STAGES`, `src/daemon/role-grants.ts#GRANTS`, `src/daemon/adapters/claude-roles.ts#AT_THE_STAGE`, `src/daemon/chain.ts#stepOwed`, `read` | The stages, the grant of each, the documents each launch carries and the order are three tables and one function of code. `role-bundle/agents/sealer.md` states `model: opus` in its frontmatter, and no other role's definition names a model. |
| `apps/desktop/role-bundle/docs/forms/the-guarantee.md`, `templates/records/sdd-guarantee.md`, `src/daemon/record-blocks.ts`, `src/daemon/seal-records.ts`, `read` | A verdict block is a fenced block whose opener is three backticks and `seal`. It holds `target:`, `Verdict:` with `sealed`, `withheld reason:` or `undecided question:`, and the four lines Owlery writes: `built-by:`, `judged-by:`, `model:`, `rules:`. The daemon's reader and the check's Python reader share one set of fixtures. |
| `pr-check/lib/optin.py`, `pr-check/skills/code-review/scripts/chain_check.py`, `read` in part: the head of each, and the lines a search for the vocabulary printed | `HOME`, `SECOND_HOME`, `MARKER` and `GUARANTEE` name the root and the record. `CHECK_NAME` is `seal`. `TRAILER` is `Seal-Routing`, read from the pull request's own commits. The titles name the owl chain where every verdict block holds a `rules:` line. |
| `apps/desktop/src/daemon/chain.ts`, `daemon.ts`, `stage-records.ts`, `executed` (`grep -n "Seal-\|trailer"`) | Owlery writes `Seal-Routing:` on each record's commit and `Seal-Built-By:` on a fix pass's commit, and a verdict block's `built-by:` line is read from the `Seal-Built-By:` trailers of the branch's history. |
| `apps/desktop/src/daemon/github.ts`, `executed` (`git grep -n '<!--[^>]*seal[^>]*-->'`) | The pull request body's verdict section stands between `<!-- owlery:seal -->` and `<!-- /owlery:seal -->`. |
| `git grep -n -i 'seal' -- apps pr-check docs README.md README.ko.md TRADEMARKS.md .github ':!.github/workflows/owlery-seal.yml'`, `executed` | 4,349 lines. With the lines that hold `agenticseal` in any case taken out, 4,029 lines. The same search over `.github` alone prints nothing. |
| `git grep -c -i 'agenticseal\|agentic-seal' -- apps/desktop/src`, `executed` | 54 lines, in `records-place.ts`, `settle.ts`, `claude-plugins.ts`, `pane-chain.ts`, `renderer/view.ts`, `renderer/index.html`, `shared/protocol.ts`, `main.ts`, `hooks.ts`, `daemon.ts` and `adapters/claude-roles.ts`. |
| `git grep -n -i 'inspect' -- apps pr-check docs README.md`, `executed` | Every line it prints names Node's debugging inspector, in `apps/desktop/test/built-app.ts`, `test/daemon-restart.test.ts`, `test/launch.ts` and `apps/desktop/measurements/built-app-launch.md`. No file of the product uses the word for a role or a record. |
| A probe in the scratch directory, `test_tmp_merge`, `executed` with git 2.54.0 | A branch that added `seal/threads/b/` merged a base that had moved `seal/` to `iadd/`. The merge exited 0, and `seal/threads/b/` stayed where it was beside `iadd/`. So a work item's branch that merges a migrated base keeps its own records under the earlier root, and a reader of `iadd/` alone finds none of them. Phase 3 found (`trail/phases/phase-3.md`) that git 2.54.0 can instead stop with `CONFLICT (file location)` and propose the `iadd/` path, which puts records in the earlier form under `iadd/threads/`; so `migrate` also rewrites records in the earlier form it finds under `iadd/threads/` (the orchestrator's decision of 2026-11-28 under the owner's delegation). |
| Orca's source, `stablyai/orca` at `a02f2584` (2026-11-27), cloned shallow into the scratch directory, `read`: `src/main/runtime/terminal/agent-teams/claude-agent-teams-service.ts`, `claude-agent-teams-tmux-dispatcher.ts` (its head), `launch/agent-teams-launch-plan.ts`, `src/shared/agent-hook-listener/providers/claude/lifecycle/claude-teammate-spawn.ts`, `src/cli/runtime/commands/cli-lifecycle-handlers.ts`, `docs/site/content/docs/agents/claude-code.mdx`, `agents/supported.mdx`, `cli/orchestration.mdx` | The teammate feature hosts Claude Code's own Agent Teams and defines no team, role or stage of Orca's. *Research* below holds the inventory. |
| `claude --version` and `claude --help`, `executed`: Claude Code 2.1.332 | `--agent <agent>` picks a session's agent, `--agents <json-or-file>` defines agents for one session, `--plugin-dir` loads a plugin for one session, `--model` and `--effort` set the session's, and `--tools` names the built-in tools. The help text lists no `--teammate-mode`. |
| The subagent tool this framer's own session holds, `read` from its schema | A spawn takes `subagent_type`, and a `model` that takes precedence over the definition's `model` frontmatter. Whether the tool of a person's pane offers the same parameter on the minimum supported version is `unverified`, and `frame/questions.md` Q8 holds it. |
| `etcs/research/competitors/_template.md` and `orca.md` in the main checkout, which git ignores, `read` | The inventory's form is a table of rows with a state and a coordinate each. Orca's rows F23, F24 and F25 read "없음": no judge independent of the builder, no verdict bound to a commit, and no pull request check. |
| AgenticSeal issue #1651, `executed` (`gh issue view 1651 --repo MichaelYcJo/AgenticSeal`) | The plugin takes the same names table. Its own definition document was not read, as *When it lands* step 1 asks. |

### Research

**Orca's teammate feature, by the surface a person touches.** Read from code at `a02f2584`.

| Surface | The person's job there | Coordinate |
|---|---|---|
| Settings, Agents: "Claude Agent Teams", off by default, with the modes `off`, `in-process` and `native-panes-shim` | Turn the feature on and pick whether each teammate gets a pane | `src/shared/settings/default-global-settings.ts:146`, `src/shared/agent-launch/startup/claude-agent-teams-tmux-compat.ts:1`, `docs/site/content/docs/agents/supported.mdx:30` |
| The agent launch picker's entry "Claude Agent Teams" | Start a lead session that may spawn teammates | `src/renderer/src/lib/agent-catalog/agent-catalog-entries-primary.ts:21` |
| The command `orca claude-teams`, which adds `--teammate-mode auto` to `claude` | Start the same lead from a terminal | `src/cli/runtime/commands/cli-lifecycle-handlers.ts:24-32` |
| A pane for each teammate, made when Claude Code calls `tmux split-window` against a shim Orca puts first on the `PATH` | Watch and type into one teammate | `claude-agent-teams-service.ts:22-80`, `claude-agent-teams-tmux-dispatcher.ts:26-60` |
| Child rows under the lead in the worktree's agent list and the Agent Dashboard, read from the `Agent` tool's result `status: teammate_spawned` | See which teammates a lead has, and focus the lead | `claude-teammate-spawn.ts:10-39`, `docs/site/content/docs/agents/claude-code.mdx:27` |

The person composes the team in words to the lead, inside Claude Code. Orca stores no team, gives a teammate no definition, model or tools of its own, and records nothing a teammate judged. Orca's own composition is `orca orchestration worker-start --agent <id> --model <id> --effort <level>`, a model and a provider for each worker with no stage (`cli/orchestration.mdx`). The string "Dev Teammate" is a member's display name in Orca's cloud organisation fixtures (`src/main/orca-profiles/cloud-org/profile-cloud-dev-org-members.ts:42`) and is no part of the feature.

**How Claude Code takes a definition, a model and tools.** A session takes its agent from `--agent`, and agents from a plugin's `agents/*.md`, whose frontmatter this repository's bundle uses for `name`, `description`, `tools` and `model`. `--agents` hands a session definitions as JSON, with no file in the person's folders. A subagent's model can be named by its caller at the spawn. A teammate of Agent Teams is started by the lead in words and takes no definition file of the host's. So a stage of a workflow reaches Claude Code in the two launches Owlery already has: a role session started with `--agent` and `--model`, and a subagent a pane's session starts by its name with a model. Neither needs a file written into the person's Claude Code folders.

## Scope

**The cut.** This work item is the first version of issue #322. It holds the rename to IADD's names in the product, Owlery's definition of IADD, the migration of a connected repository, the end of the code paths that lean on AgenticSeal, and the Owl Chain written as the first workflow in the new form, with no change to what it does. It does not hold a person's own workflow, a person's own inspector module, the window's editor or sharing. *Out* below names the home of each.

In:

1. **Owlery's definition of IADD stands in `docs/iadd.md`, with `docs/iadd.ko.md`.** It states the concept and *Zero Self-Approval*, the five principles, the names, the records folder `iadd/` and its files, the check's states, what a workflow is as data (*Data & interfaces*), what holds for every workflow and what is the Owl Chain's alone (the two lists under *Data & interfaces*), and which parts of the model no code reads yet. `docs/product.md` links it and does not restate it.
2. **The record forms take IADD's names.** *Data & interfaces* lists each form with its one spelling: the root and its marker, `inspection.md`, the block's fence, the `Verdict:` lines, the block's keys, the trailers, the closing records and the pull request body's markers.
3. **The pull request check reads the new forms alone, and posts the check `inspection`.** `pr-check/` reads a root named `iadd` whose `README.md` opens with the new marker, and has no second name for the root. Its titles and states are those of *Data & interfaces*. It reads the routing trailer of a pull request's own commits in both spellings, because a commit's trailer cannot be rewritten.
4. **The daemon and the chain command take the names.** The role `sealer` becomes `inspector`. The stage kind, the step and the chain command's subcommand `seal` become `inspection`, `inspection` and `inspect`, and the step `sealed` becomes `cleared`. The modules, their exports, their comments and their cases are renamed with them. Owlery writes `IADD-Routing:` and `IADD-Built-By:`, and reads a branch's builders from both spellings of the second.
5. **The role bundle takes the names.** `agents/sealer.md` becomes `agents/inspector.md`, `skills/seal/SKILL.md` becomes `skills/inspection/SKILL.md`, `docs/forms/the-guarantee.md` becomes `docs/forms/the-inspection.md`, and `templates/records/sdd-guarantee.md` becomes `templates/records/sdd-inspection.md`. Each text of the bundle that names the seal, the sealer, the guarantee or a `seal` block is rewritten to the new names, and the manifest's description with them.
6. **An inspection names the workflow and the inspector module that produced it.** Owlery writes `workflow:` and `inspector:` into each verdict block. The check's title names the workflow from that line, and no title is derived from the `rules:` line.
7. **The window and the protocol take the names.** The states travel as `cleared` and `lapsed`. Every word the window shows of a seal, a sealer or a broken seal takes the words of *Data & interfaces*. A stored look written by an earlier build, which carries `seal` and no `inspection`, is read as a look that says nothing of the inspection.
8. **Connecting a repository writes `iadd/` and the workflow `.github/workflows/owlery-inspection.yml`.** A folder is on the Owl Chain where that workflow stands in it. The root has one name. Where a repository keeps an `iadd/` of its own without the marker, the setup refuses and says so.
9. **A connected repository moves in one commit the person reads first.** *Data & interfaces* states what the commit holds, where the app offers it, and how a work item's branch moves its own records. A root in the earlier form is named as one and is never read as records.
10. **The code paths that lean on AgenticSeal end.** The detection of AgenticSeal's `hygiene.yml`, the detection of the plugin in the person's Claude Code settings, the chain choice and the pane's own settings file go (`## Removes`). The settle wrapper keeps its reading of `decisions.md` and its list, and loses `--apply`, which was its call of `seal settle`.
11. **The Owl Chain is a workflow file the app ships, and the daemon reads each stage's content from it.** The bundle holds `workflows/owl-chain.json` and `inspectors/owl-chain.json`. The role, the agent definition, the documents and the model of each stage come from those two files in both launches. The order stays code, named by the file's `skeleton`, and each stage kind's grant stays code. A stage's model reaches a role session on its command line and a pane's session in what `owed` prints. What a chain does is unchanged, and the inspector still runs on the model the bundle names today.
12. **The documents state the product in IADD's names.** `docs/product.md`, `docs/architecture.md`, `docs/roadmap.md`, `docs/name.md` and `docs/design.md` are rewritten in both editions, with `README.md` and `README.ko.md` rewritten around IADD: what the method is, Owlery as a tool that runs it, and the Owl Chain as its default workflow. `TRADEMARKS.md`, `pr-check/README.md` and the bundle's `README.md` follow. The rows of `docs/roadmap.md` that state a shipped release keep the words that release shipped under. Each `check:` line that names a renamed case is rewritten in the commit that renames the case.

Out, each with its home:

- **A person's own workflow, read from `iadd/workflows/`, and the stage's prompt, skills and provider as a person's to change.** Issue #324's body, which turns #322's build into issues and places them. This work item ships the form and one file in it.
- **A person's own inspector module, read from `iadd/inspectors/`, and the checks a module names beyond the broad gate.** Issue #324's body.
- **Other skeletons than the Owl Chain's, and a skeleton as data.** Issue #324's body. *Alternatives considered* in `frame/plan.md` holds why the order stays code here.
- **The window's editor of a workflow.** Issue #324's body, beside issue #180, whose file view it stands on.
- **Publishing, finding, adopting and updating a shared workflow or inspector, and what a person sees of one before adopting it.** Issue #324's body. *Data & interfaces* states the one decision this work makes for it: a shared module is files in a repository.
- **A repository's list of the inspectors it accepts.** Issue #324's body. No code reads such a list in this version.
- **A default model for each stage that the person sets, and the orchestrator's recommendation at routing.** Issue #129 stays its own issue and builds on Scope item 11. Its body takes the name inspector and the order of *The stage's model* below.
- **The approval line drawn from a workflow's skeleton.** Issue #222's body. The line keeps its four places here, with the last named Inspector.
- **A settle of Owlery's own, and a connected repository's settle.** Issue #139's body. This repository settles with the plugin's command, run directly.
- **This repository's own move to `iadd/`, the comparison of the two definitions and their merge.** *When it lands* steps 2 to 4 of issue #322. The issue closes with this work's pull request, so those steps need a home the orchestrator names. This frame proposes issue #324's body.
- **A new drawing for the inspection's mark.** Issue #229's body, in the milestone `owner: by hand`. The window keeps the drawing it has.
- **The launcher's name `owl-chain` and the variable `OWLERY_CHAIN`.** They hold none of the seal's vocabulary and stay.
- **A subagent's bounds in a person's pane.** Issue #286 holds it. *What holds for every workflow* says which launch holds each rule.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A branch is cleared by the Owl Chain | Given a repository on the Owl Chain and a built branch. When the chain runs its rounds, the broad gate and the inspector. Then `iadd/threads/<item>/inspection.md` holds a block whose fence is `iadd`, with `Verdict: cleared`, `inspected-by:`, `workflow: owl-chain` and `inspector: owl-chain`, and the step owed is `cleared`. | `apps/desktop/test/chain.test.ts`, `apps/desktop/test/chain-command.test.ts`, `apps/desktop/test/inspection-records.test.ts` |
| A later commit lapses the inspection | Given a cleared branch. When a commit that changes more than the closing records lands. Then the daemon sends `lapsed` with the reason, the window says "Inspection lapsed", and the check fails with the title "Inspection of the Owl Chain lapsed: a commit landed after" and the commit. | `apps/desktop/test/inspection-state.test.ts`, `apps/desktop/test/pr-check.test.ts`, `apps/desktop/test/view.test.ts` |
| A reader without the app reads the check | Given a ready pull request. When the workflow `owlery-inspection.yml` runs. Then a check named `inspection` stands on the head commit with one of the titles of *Data & interfaces*, and the body's section between the `owlery:inspection` markers is a copy of the newest verdict block. | `apps/desktop/test/pr-check.test.ts`, `apps/desktop/test/pull-request.test.ts` |
| The daemon and the check agree on the new forms | Given the fixtures of the blocks. When the daemon's reader and the check's reader read each. Then both return the same, and both read a block whose fence is `seal` as no block. | `apps/desktop/test/record-blocks.test.ts` |
| A session that built the work clears nothing | Given an inspector's session that is one of the `built-by:` sessions. Then Owlery writes no verdict, and the check refuses a block whose `inspected-by:` session is one of its builders. | `apps/desktop/test/chain.test.ts`, `apps/desktop/test/pr-check.test.ts` |
| A fix pass recorded before the migration still names its builder | Given a branch whose history holds a `Seal-Built-By:` trailer. When Owlery writes a verdict block after the migration. Then `built-by:` names that session. | `apps/desktop/test/chain.test.ts` |
| A connected repository moves in one commit | Given a repository with `seal/` in the earlier form and `owlery-seal.yml`. When the person confirms the move in the dialog "Records and check". Then one commit holds the root at `iadd/`, the new marker, each `guarantee.md` as `inspection.md` with its blocks in the new spelling, each other record's fences in the new spelling, the workflow at `owlery-inspection.yml` for the app's version, and no `owlery-seal.yml`. An inspection cleared before the move lapses at the move's commit, since the move changes paths outside each work item's closing records, and a work item inspected on the move's commit is cleared; the dialog and `migrate` say so before the move (phase 3's finding, the orchestrator's decision of 2026-11-28). | `apps/desktop/test/records-migration.test.ts`, `apps/desktop/test/records-dialog.test.ts`, `apps/desktop/test/pr-check.test.ts` |
| A root in the earlier form is named and not read | Given a folder with `seal/` under the earlier marker and no `iadd/`. Then the daemon reads no record of it, the repository's row says that its records are in the earlier form, and no chain starts there. | `apps/desktop/test/records-place.test.ts`, `apps/desktop/test/daemon.test.ts` |
| A work item's branch moves its own records | Given a work item's worktree whose head holds `iadd/` from a merged base and its own directory under `seal/threads/`. When the pane's session runs the chain command's `migrate`. Then one commit moves that directory under `iadd/threads/` in the new spelling, and `owed` reads it. Before that commit `owed` exits with 1 and its sentence names `migrate`. | `apps/desktop/test/chain-command.test.ts`, `apps/desktop/test/records-migration.test.ts` |
| The migration writes nothing it cannot finish | Given a root where a record holds a block the earlier reader refuses. Then the plan names the file and the line, and no commit is made. | `apps/desktop/test/records-migration.test.ts` |
| A pane carries the Owl Chain whatever plugins the person enables | Given a folder with `owlery-inspection.yml`. When a Claude Code pane opens there. Then it carries the bundle, the window asks nothing first, and no settings file of the pane names `enabledPlugins`. | `apps/desktop/test/pane-chain.test.ts`, `apps/desktop/test/hooks.test.ts` |
| A repositories file with the chain choice is still read | Given a `repositories.json` an earlier build wrote with `paneChain`. When the daemon starts. Then it reads the repositories, keeps no file aside, and writes no `paneChain`. | `apps/desktop/test/repositories.test.ts` |
| The Owl Chain's stages come from its file | Given the bundle's `workflows/owl-chain.json` and `inspectors/owl-chain.json`. Then each role session is launched with the agent, the documents and the model the files name, and `owed` prints the stage's model. A file that names a stage the skeleton does not hold, or lacks one it holds, fails the daemon's start with the file and the key named. | `apps/desktop/test/workflow.test.ts`, `apps/desktop/test/claude-adapter.test.ts`, `apps/desktop/test/chain-command.test.ts`, `apps/desktop/test/role-bundle.test.ts` |
| The settle wrapper runs no other tool | Given a repository with `iadd/threads/`. Then `pnpm --filter @owlery/desktop run settle` prints the kept directories and the list, and `--apply` is refused as a flag it does not know. | `apps/desktop/test/settle.test.ts` |
| The product holds the seal's vocabulary only where this design keeps it | After the last phase. | `git grep -n -i 'seal' -- apps pr-check docs README.md README.ko.md TRADEMARKS.md .github ':!.github/workflows/owlery-seal.yml'`, with the lines that hold `agenticseal` in any case taken out, prints at `f8c1d3f4` these lines alone: `apps/desktop/src/daemon/records-migration.ts` and `apps/desktop/test/records-migration.test.ts`, for the earlier forms; for the earlier `Seal-Built-By` trailer, `apps/desktop/src/daemon/chain.ts:88`, `daemon.ts:4058`, `stage-records.ts:336`, `apps/desktop/test/chain.test.ts:3122` and `:3127`; for the earlier `Seal-Routing` trailer, `pr-check/skills/code-review/scripts/chain_check.py:13`, `:2163` and `:2185`, and `apps/desktop/test/pr-check.test.ts:135`, `:137` and `:144`; for what an earlier build stored or wrote, `chain.ts:1165`, `:1166`, `:1174`, `:1176`, `:1198`, `:1201`, `:1203`, `:1205`, `:1206`, `:1211`, `:1231` to `:1233`, `:1239` and `:1256`, `chain.test.ts:811`, `:812`, `:818`, `:879`, `:886` to `:889`, `:3195` and `:3207`, `last-look.test.ts:190`, `:341`, `:361`, `:362`, `:385` and `:389`, `ledger.test.ts:204` and `:206`, `repositories.test.ts:183`, `:198` and `:199`, and `chain-records.test.ts:44`, the refused verdict word; for the fence that is no longer a block, `record-blocks.test.ts:82`; for the earlier root, `chain.test.ts:1569` and `:1575`, `chain-command.test.ts:615`, `:624`, `:636`, `:639` and `:641`, `daemon.test.ts:2071`, `:2074` to `:2076`, `:2083`, `:2089`, `:2091` to `:2093`, `:2095` and `:2102`, `pr-check.test.ts:202`, `:203` and `:233`, `records-dialog.test.ts:157`, `:159`, `:161`, `:162`, `:178` and `:181` to `:183`, `records-place.test.ts:20`, `:271`, `:272`, `:1082` and `:1086`, `heavy-run.test.ts:250` and `:256`, and `view.test.ts:820`, `:822`, `:3535`, `:3538`, `:5400`, `:5409`, `:5411` to `:5413`, `:5415`, `:5424` and `:5428` to `:5431`; for the plugin's commands no text may name, `role-bundle.test.ts:275`, `:276`, `:281` and `:327`, and `pr-check.test.ts:935` and `:958`; for this repository's own check `seal`, `rerun-unstarted.test.ts:144` and `test/fixtures/rerun-unstarted/github.json:121`; for the letters alone, `model-stand-in.ts:119`; for the names set aside, `docs/iadd.md:57` and `docs/iadd.ko.md:57`; for the shipped releases, release 0.1.0's row and this repository's own check's pin, `docs/roadmap.md:22`, `:52` to `:56` and `:87`, and `docs/roadmap.ko.md:22` and `:53`; for the skill's name before the rename, the plugin's side of *What we take from AgenticSeal*, the earlier trailer and a measurement dated 2026-11-17, `docs/architecture.md:167`, `:212`, `:214`, `:217`, `:226`, `:229`, `:230`, `:232`, `:233`, `:292` and `:533`, and `docs/architecture.ko.md:167`, `:214`, `:226`, `:229`, `:230`, `:233`, `:292` and `:533`. The line numbers are those of `f8c1d3f4`. At `80bfad8a` it prints 4,029 lines, which Scope items 2 to 12 remove or rewrite but for the lines named above. |
| The product names AgenticSeal only as where it started | After the last phase. | `git grep -n -i 'agenticseal\|agentic-seal' -- apps/desktop/src` prints at `f8c1d3f4` lines in `apps/desktop/src/daemon/records-migration.ts`, for the earlier marker and the earlier form's sentences, and `apps/desktop/src/daemon/adapters/claude-roles.ts:74` and `:101`, which say that the documents the bundle takes still name AgenticSeal's commands and tell a role not to look for that command line. At `80bfad8a` it prints 54 lines, each of which Scope items 4, 7, 8 and 10 remove or rewrite, but for those named above. |
| The documents stand in both editions | After the last phase. | The repository's broad gate, which the orchestrator runs: each of `docs/*.md` and `README.md` has its `.ko.md` with the same counts of headings and of table rows. |

## Data & interfaces

### The names, one spelling each

| What | Its spelling in the product |
|---|---|
| The method | IADD, in capitals, with *Zero Self-Approval* as its line |
| The default workflow | the Owl Chain in prose, and `owl-chain` as a workflow's and an inspector module's name |
| The last role | inspector, `inspector` in code, `agents/inspector.md`, the agent `owlery:inspector` |
| Its artifact | the inspection, `inspection.md`, whose heading is `# Inspection: <work item>` and whose sections are `## Run <N>` |
| The records root | `iadd/`, with `config.json`, `threads/<item>/`, and the folders `workflows/` and `inspectors/`, which no code of this version reads |
| The root's marker | `# What IADD keeps in iadd/`, the first line of `iadd/README.md` |
| A block's opener | three backticks and `iadd`, in every record that held a `seal` block: `inspection.md`, `trail/gate.md`, the round records and `decisions.md` |
| The verdict lines | `Verdict: cleared`, `Verdict: withheld reason: <reason>`, `Verdict: undecided question: <question>` |
| The block's keys | `target:`, `Verdict:`, `built-by:`, `inspected-by:`, `model:`, `rules:`, `workflow:`, `inspector:` |
| The trailers Owlery writes | `IADD-Routing:` and `IADD-Built-By:` |
| The closing records | `trail/gate.md`, `inspection.md`, `trail/refusals.md` |
| The pull request body's markers | `<!-- owlery:inspection -->` and `<!-- /owlery:inspection -->` for the verdict's copy, and the back's two markers with `inspection` where they hold `seal` |
| The check | `inspection`, posted on the head commit |
| The workflow's file | `.github/workflows/owlery-inspection.yml`, with `name: inspection` and the job `records` |
| The states | cleared, lapsed, not cleared. In the protocol an inspection's `state` is `cleared` or `lapsed`, and a work item with no inspection carries `null` |
| The chain command | `inspect` where it was `seal`, and `migrate`, new |
| The pane's document | `skills/inspection/SKILL.md`, listed as `owlery:inspection` |

**The check's name is `inspection` and its file is `owlery-inspection.yml`.** The pull request page then reads "inspection" beside "Cleared by the Owl Chain at" and the commit. `iadd` was weighed for both: it names the method and not what the check says, and the plugin that becomes `iadd` may post a check under its own name on the same page. `owlery` alone says who posted and not what was judged. The file keeps the prefix `owlery-`, as it has now, so a person sees whose workflow it is in a folder of workflows.

**The check's titles.**

| Result | Title | When |
|---|---|---|
| Passed | "Cleared by the Owl Chain at" and the commit, where each verdict block the title names holds `workflow: owl-chain`. "Cleared at" and the commit otherwise | A ready pull request whose head carries a cleared inspection, and a draft that would pass once ready |
| Failed | "Inspection of the Owl Chain lapsed: a commit landed after" and the commit, or "Inspection lapsed: a commit landed after" and the commit | A cleared inspection that a later commit lapsed |
| Failed | "Not cleared: no inspection at the head commit" | A ready pull request whose head holds no cleared inspection |
| Failed | "The records are refused" | As now |
| Neutral | "Draft: judged when it is ready" | As now |
| Passed | "Not judged: no work item is declared" | As now |
| Failed | "The inspection check could not run" | As now, renamed |

**The window's words.** "Cleared" where it says "Sealed", "Cleared at" and the commit, "Inspection lapsed" where it says "Seal broken", "No inspection yet", "Inspector" for the role and "Inspector, verdict" for its stage, and "one step from its inspection" in the Machine dialog. The summary counts "2 cleared, 1 inspection lapsed". The tab "Back of the seal" becomes "Inspection sheet", which `frame/questions.md` Q3 holds. The drawing at an inspection's place stays as it is, named the inspection's mark, and its files move from `assets/seals/` to `assets/marks/`.

### A workflow as data

**A workflow is one JSON file that names a skeleton, the content of each stage, and an inspector module.** The built-in one is `workflows/owl-chain.json` of the role bundle:

```json
{
  "workflow": "owl-chain",
  "skeleton": "rounds-then-inspection",
  "stages": {
    "round": { "role": "proofer", "agent": "agents/proofer.md", "documents": ["skills/code-review/SKILL.md"], "provider": "claude", "model": null },
    "fix-pass": { "role": "crafter", "agent": "agents/crafter.md", "documents": ["skills/implement/SKILL.md", "skills/implement/fix-pass.md"], "provider": "claude", "model": null },
    "judgment": { "role": "orchestrator", "agent": "agents/orchestrator.md", "documents": ["docs/forms/the-round-record.md"], "provider": "claude", "model": null }
  },
  "inspector": "owl-chain"
}
```

**A skeleton is the workflow's shape, and it is code.** It holds which stage kinds run, the order, what each hands the next and the condition to move on. Its name picks a function that reads the committed records and returns the step owed, as `chain.ts#stepOwed` does for `rounds-then-inspection`. A person picks a skeleton and does not write one. Each stage kind of a skeleton has a grant in code (`role-grants.ts`), and no workflow file states or widens a grant.

**A stage is the content of one stage kind.** It holds the role's name, the agent definition, the documents its launch carries after the two every role carries, the provider, which is the adapter's name, and the model, where `null` is the CLI's default. A stage's paths are read from the folder that holds its workflow file's folder: the bundle's root for the built-in files.

**An inspector module is one JSON file that names the checks Owlery runs before the inspection, the inspector's own stage, and the record it answers with.** The built-in one is `inspectors/owl-chain.json`:

```json
{
  "inspector": "owl-chain",
  "checks": [{ "name": "broad gate", "command": { "config": "Broad gate" } }],
  "stage": { "role": "inspector", "agent": "agents/inspector.md", "documents": [], "provider": "claude", "model": "opus" },
  "record": "templates/records/sdd-inspection.md"
}
```

A check is a command Owlery's code runs at the commit and reads by its exit code. A run that passes is a block of `trail/gate.md`, as the broad gate's is now. The Owl Chain's module names one check, the repository's `Broad gate` key.

**Where each is stored.** The Owl Chain's two files ship in the app, and the app's version is their version. A repository's own stand under `iadd/workflows/<name>.json` and `iadd/inspectors/<name>.json`, committed, so a team shares them through the repository and the inspected commit holds the files as they were read. A person's setting of a stage, which is issue #129's default model, is the daemon's state. A work item's own choice is a row of its `routing.md`. The name `owl-chain` is the app's alone in both folders.

**How one is shared.** A shared workflow or inspector module is its files, in a repository. A person adopts one by committing a copy under their own `iadd/`, and the copy states where it came from. Owlery keeps no gate on which module is good: the person judges, and a module's worth shows in who adopts it.

**How a reader knows what an inspection means.** The verdict block names the workflow and the inspector module. A reader opens `iadd/inspectors/<name>.json` at the inspected commit, or for `owl-chain` the bundle of the Owlery version the `rules:` line names. The check's title names the workflow.

**What this version reads of the model.** The daemon and the chain command load the two built-in files and no other. They read no `iadd/workflows/`, no `iadd/inspectors/`, no workflow row of `routing.md` and no workflow key of `config.json`. The loader refuses a file whose `skeleton` it does not hold, whose `stages` do not name each session stage of the skeleton, or whose `inspector` names no module it loaded.

### The stage's model

A stage runs on the first of these that names a model: the work item's choice in its `routing.md`, then the person's default for the stage in the daemon's state, then the `model` of the stage in its workflow or module file, then the CLI's own default. This version builds the last two. Issue #129 builds the first two on them. The daemon passes a named model to a role session on its command line. In a pane, `owed` prints the model with the agent, and `skills/inspection/SKILL.md` tells the session to start the subagent on it. `agents/inspector.md` states no `model:`, so the module's file is the model's one home. The verdict block's `model:` line keeps naming the model that inspected.

### What holds for every workflow

Owlery's code holds these whatever a workflow file says.

1. **Zero Self-Approval.** The session that inspects built none of the work. Owlery writes no verdict where the inspecting session is one of the building sessions, and the check refuses such a block.
2. **One commit.** An inspection names one commit. It is cleared at a branch's head only where nothing but the closing records differs between that commit and the head, and it lapses otherwise. The answer is read from the head's committed records alone.
3. **Owlery writes the records.** Owlery's code writes and commits each record, and a stage that reviews or inspects holds no tool that writes a file.
4. **Code keeps the order.** The step owed comes from the committed records through the skeleton's function. No document and no agent starts, orders or skips a stage.
5. **A stage holds its kind's grant.** In the daemon's chain a stage's session runs in the sandbox its grant names. In a pane a role is a subagent whose definition names its tools, and the person's own permission settings answer it, which issue #286 holds.
6. **The inspection says what produced it.** The verdict block names the workflow, the inspector module, each session that built, the session that inspected, its model and Owlery's version, and each check's passed run stands in `trail/gate.md` at the inspected commit.
7. **No pull request without a cleared inspection, and the verdict is a check.** Owlery opens a pull request only at a cleared head. It posts the check `inspection`, writes no review and merges nothing.

### What is the Owl Chain's alone

The review rounds and the fix passes, the judgment of whether the rounds converge, the ceiling of rounds, the broad gate as the one check before the inspection, the four role definitions, and the inspection's two tables. Another workflow may hold none of them. The four invariants `docs/architecture.md` *What we take from AgenticSeal* lists are restated in the documents as the seven rules above and this list.

### The migration of a connected repository

**The earlier form is told by its marker.** A folder holds records in the earlier form where `seal/README.md` or `agentic-seal/README.md` opens with `# What AgenticSeal maintains in seal/`. `records-migration.ts` is the one module that holds the earlier spellings of the files' forms. Every other reader reads `iadd/` alone.

**The move is one commit, planned first.** The plan reads each record with the earlier grammar and refuses, with the file and the line, where a block does not read. The commit:

- moves the root to `iadd/` and rewrites the first line of its `README.md` to the new marker;
- moves each `guarantee.md` to `inspection.md`, with its heading as `# Inspection: <work item>`;
- rewrites each block's opener to the new fence in every record that holds one;
- rewrites, inside a verdict block, `Verdict: sealed` to `Verdict: cleared` and `judged-by:` to `inspected-by:`, and adds `workflow: owl-chain` and `inspector: owl-chain` to a block that holds a `rules:` line, which the owl chain alone wrote;
- removes `.github/workflows/owlery-seal.yml` and writes `.github/workflows/owlery-inspection.yml` for the app's version.

It changes no other line of a record, runs the repository's hooks and is not pushed.

**Where it is offered.** For a repository, in the dialog "Records and check", as the move of the check to the app's version is offered now: the app shows each path that moves and the workflow as it writes it, and writes nothing until the person confirms. For a work item's branch whose head still holds its own directory under the earlier root, the chain command's `migrate` makes the same commit in that worktree for what stands there. Until then `owed`, `round`, `fix-pass`, `gate`, `inspect` and `body` refuse there with a sentence that names `migrate`, and the daemon starts no chain for that work item and says why on its line.

**What it does not do.** It rewrites no commit, so the trailers of the history stay. It moves no AgenticSeal `hygiene.yml` and reads no pull request body: the chain's next `body` or the daemon's next pull request stage writes the body's sections with the new markers.

### Stored state and the protocol

- `repositories.json`: the reader takes a file that holds `paneChain` and drops the key at its next write. No file is kept aside for it.
- The stored look: a look that holds `seal` and no `inspection` says nothing of the inspection, as a look written before the look kept the seal says nothing of the seal now.
- The protocol: `WorkItem.inspection` replaces `WorkItem.seal`. `Repository.chain` loses `plugin` and `chosen`. The message `setRepository` loses `paneChain`. `RecordsPlace` gains what the dialog needs to offer the move: that the root is in the earlier form.
- A window of an earlier build attached to this daemon reads no inspection. Issue #133's rule replaces a daemon of another build at the window's load, and issue #273 holds the other direction.

## Rule changes

- nothing
  why: this work item's subject includes the policy root's own text, so it writes each rule it changes into `docs/` in its pull request, as Scope items 1 and 12 state. The cases those documents name by `check:` line are renamed in the same commits, and a `check:` line left for the settle would name a file that no longer stands.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The reader of the person's Claude Code plugins, and its case | `apps/desktop/src/daemon/claude-plugins.ts`, `apps/desktop/test/claude-plugins.test.ts` | Nothing takes its place. It existed to tell the AgenticSeal plugin, and issue #322 ends that path. |
| The chain choice: the question before a pane opens, the repository's setting, the stored answer, the pane's own settings file and their cases | `apps/desktop/src/daemon/pane-chain.ts#carriedIn`, `apps/desktop/src/daemon/repositories.ts#StoredRepository` (`paneChain`), `apps/desktop/src/shared/protocol.ts` (`ChainChoice`), `apps/desktop/src/daemon/hooks.ts` (`claude-pane-<pane id>.json`), `apps/desktop/src/renderer/renderer.ts`, `apps/desktop/src/renderer/view.ts#settingsFields`, `apps/desktop/test/chain-choice.test.ts` | Nothing takes its place. A pane of a folder with Owlery's workflow carries the Owl Chain. The rule in `docs/architecture.md` *What each session loads* goes with it. No record says what the choice caught: it was built for a repository that ran both chains, which is this repository alone, and this repository is on no chain of Owlery's until its own move. |
| The detection of AgenticSeal's workflow | `apps/desktop/src/daemon/records-place.ts#PLUGIN_WORKFLOW`, `#PLUGIN_CHECK`, and the sentences of `apps/desktop/src/renderer/view.ts` on `hygiene.yml` | Nothing takes its place. A repository with `hygiene.yml` and no workflow of Owlery's is a repository with no check of Owlery's. |
| The root's second name | `apps/desktop/src/daemon/records-place.ts#ROOTS`, `pr-check/lib/optin.py#SECOND_HOME` | The issue's names table removes it. The setup refuses where a repository keeps an `iadd/` of its own. |
| The settle wrapper's `--apply` and `--released-at`, the search of the path for `seal`, the put-back and their cases | `apps/desktop/src/daemon/settle.ts#apply`, `#settleAndPutBack`, `#exitOf`, `apps/desktop/test/settle.test.ts` | This repository runs the plugin's settle directly. The wrapper's reading has kept no directory here, by the probe in `## Grounding`. Issue #139 holds a settle of Owlery's own. |
| The table of each stage's documents, and the inspector's model in its definition | `apps/desktop/src/daemon/adapters/claude-roles.ts#AT_THE_STAGE`, the `model:` line of `apps/desktop/role-bundle/agents/sealer.md` | `workflows/owl-chain.json` and `inspectors/owl-chain.json` of the bundle. |
| The title's reading of the `rules:` line | `pr-check/skills/code-review/scripts/chain_check.py#by_owl_chain` | The `workflow:` line of the same block. |
| The seal's forms and names | Each form in the first column of the issue's names table, across `apps/`, `pr-check/` and `docs/` | *The names, one spelling each* above. |
| The sections that state Owlery by AgenticSeal | `docs/architecture.md` *Compatibility with AgenticSeal* and *Taking in AgenticSeal's changes*, `README.md` *Relationship to AgenticSeal* | `docs/iadd.md` states the method. One section of `docs/architecture.md` keeps where the files started and their licence, and that this repository's own records stay in the plugin's forms until its move. |

This work adds three mechanisms: the migration, the workflow's loader and the two lines of the verdict block. In return it takes out the chain choice, the plugin's detection, the root's second name and the settle's put-back, as the rows above name them.

Framed 2026-11-28 by framer, before the build.
