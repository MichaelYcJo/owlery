# Phase 4: 1795497826-pane-carries-the-chain

## What this phase found

### The probe

The probe ran on 2026-11-24 with Claude Code 2.1.331, before any code of the phase was written, against the bundle and the chain command the build made from `2cb06da`. It committed nothing. Everything it made stands under the crafter's scratch directory: a repository with a records root, a linked worktree on the branch `feat/probe` with one commit, and a run folder with the pane's settings file, the head, and a launcher that runs the built `dist/chain.js` with Electron's Node. The chain command's `start --automation yes`, run through that launcher, wrote the worktree's routing, and its `owed` then handed the rules file and the prompt of round 1.

Each interactive session was started as the daemon starts a Claude Code pane: the person's interactive login shell in a pseudo-terminal, with `exec claude --settings <file> --plugin-dir <bundle> --append-system-prompt-file <head>`, and with `OWLERY_PANE_ID`, `OWLERY_HOOK_SOCKET`, `OWLERY_RUN_DIR`, `OWLERY_CHAIN` and `OWLERY_BASE` in its environment. The settings file held the eight relay hooks of `hooks.ts#hookSettings`. A listener on the hook socket recorded each event, and the probe read the conversation file each session's events named.

**Six starts of `claude`, four of them sessions.** Two starts ended at Claude Code's question whether the scratch folder is trusted, before any session: the dialog opened on "No, exit" there, and the probe's first two answers confirmed that line. The four sessions:

| Session | Started as | Turns | What it showed |
|---|---|---|---|
| 1 | A pane on the owl chain, with the settings file of the relay hooks alone | 3, and one subagent | The session's list of agents held `owlery:crafter`, `owlery:orchestrator`, `owlery:proofer` and `owlery:sealer`, beside the five `agentic:` agents of the AgenticSeal plugin enabled at user scope. Its list of skills held `owlery:seal` and the bundle's six other skills. It quoted the head whole from its system prompt. Its context held the text the AgenticSeal plugin's `SessionStart` hook adds. Its call of `AskUserQuestion` was refused: the tool's result was an error that opened "PreToolUse:AskUserQuestion hook error", held the reason `ask` wrote for the worktree's `routing.md`, and ended "This hook comes from the owlery@inline plugin". A subagent of the type `owlery:proofer` read the rules file `owed` had written, to its end, and answered with its first and last lines |
| 2 | The same pane, with a settings file that also held `enabledPlugins` as the person's file states it and the AgenticSeal plugin's key set to `false` | 1 | The list of agents held the four `owlery:` agents and no `agentic:` agent. The list of skills held no `agentic:` skill. The conversation file held one `SessionStart` hook, which is none of the plugin's, where session 1's held that one and the plugin's, and the session said its context held no text a `SessionStart` hook added. The agents of the person's other enabled plugins stayed |
| 3 | A role session of the daemon as the proofer at a round, through `pnpm run role:refusal`, with the scratch directory as `TMPDIR` | 1 | The session's first line named the tools `Read`, `Glob`, `Grep` and `Bash` and the permission mode `default`, as a role session held them before the definitions gained a `tools:` line |
| 4 | `pnpm run pane:run`, the hand check this phase added, once it was built | 2 | The case passed: the four agents, the skill, the head and the refusal of `AskUserQuestion`, in a repository the case made |

**Q1: it does.** `enabledPlugins` with the plugin's key set to `false`, in the file `--settings` names, kept that plugin's agents, skills and its `SessionStart` hook out of a session where the plugin is installed and enabled at user scope (session 2 against session 1). The file held every key of the person's `enabledPlugins`, so the probe does not say what a file with the one key alone does. Scope item 10 stands as written.

**Q2: each holds.** An interactive `claude` started with `--plugin-dir` and `--append-system-prompt-file` offers the bundle's agents as `owlery:<role>`, lists `skills/seal/SKILL.md` as the skill `owlery:seal`, and holds the head as a section of its system prompt (sessions 1, 2 and 4). A `tools:` line leaves a role session with the four tools its launch names (session 3). Nothing of the launch changes.

**Q4: both hold.** The hook of a plugin loaded with `--plugin-dir` runs in an interactive session. The built command, through the launcher, read the event Claude Code sent on its input: the event's JSON holds `tool_input.questions`, which is what `ask` reads. Its exit with 2 refused the call, and the session was handed the reason the command wrote (sessions 1 and 4). Scope item 19 stands as written, and the hook stays in the bundle.

**Q3, decided here: the default stands.** The result of the subagent tool names the subagent as `agentId: <id>`, a word with no white space, and names no model. The session passes that id to `--by` and `--judged-by`, and the model the sealer's definition names to `--model`. The tool's result marks the id as internal and tells the session not to quote it to the person, and session 1 declined to quote it when asked. `skills/seal/SKILL.md` now says which value the id is and that passing it to the command is no reply to the person. Grounds: the id is the one name of the subagent the session holds, and `record-blocks.ts#isSessionId` takes it. Judged against `frame/questions.md` Q3 and `frame/design.md` scope item 7.

What the probe showed beside the questions:

- **A subagent ran in the background, and its answer came back in a frame.** The tool's result said the agent was launched and that a notice would follow. The answer arrived later as a message whose lines the harness indents. `skills/seal/SKILL.md` *A role is a subagent of the bundle* now says to wait for the answer, and that the answer is the text inside the frame without that indentation.
- **The subagent named its tools as `Read`, `Bash` and the tool it hands its report back through.** The proofer's definition names `Read`, `Glob`, `Grep` and `Bash`. The pane's rules head said "You hold the tools your definition names". It now says the role holds those of them the session offers. This is the subagent's own account, and nothing else of the session lists a subagent's tools.
- **The subagent ran on the session's model.** The proofer's definition names no model. The sealer's names `opus`, and no session of the probe started a sealer.
- **The relay hook of a pane already receives the id and the model of a subagent.** The `PostToolUse` event of the subagent tool holds `agentId` and `resolvedModel` in its `tool_response`. Nothing reads them, and this phase built nothing on them.
- **A pane's session lists the bundle's seven skills**, `owlery:core`, `owlery:agent-contract`, `owlery:implement`, `owlery:code-review`, `owlery:verify` and `owlery:writing-style` beside `owlery:seal`.

**The person's settings files held their bytes across sessions 1 to 3 and across session 4.** `shasum -a 256` of `~/.claude/settings.json`, `settings.local.json`, `plugins/installed_plugins.json`, `plugins/known_marketplaces.json`, `CLAUDE.md` and `keybindings.json` printed the same six lines before session 1 and after session 3. The case of session 4 compares the first four files before and after its session, and passed. Between the two comparisons, at 16:52:59 local time, `plugins/installed_plugins.json` and `plugins/known_marketplaces.json` changed: the AgenticSeal plugin's entry moved from 0.38.7 to 0.38.8. No `claude` of this phase ran then: session 3 ended at 16:49 and session 4 started at 16:57, and the cases the phase ran between them start a stand-in shell. The phase did not establish what wrote the two files. Claude Code itself keeps each session's conversation and its answer to the question of trust for the scratch folders in its own files, as it does for any pane.

**`pnpm run role:refusal` failed in session 3, on its third assertion.** Its first two, the tools and the permission mode, passed. The proofer then made no call of its Bash tool: it answered that a proofer writes no file and runs nothing in a round. So no request reached the daemon, and the run did not show the daemon's refusal. The case stands on the role making the call it is asked for.

### Where the tree or the probe contradicted the frame

**The frame gives the crafter the `Status` cells of `frame/questions.md`, and the crafter writes no line of the frame but its own Status cell.** `frame/plan.md` phase 4 and the paragraph above the table of `frame/questions.md` both say the phase's crafter writes the `Status` of Q1, Q2 and Q4. The hand-back names each for the orchestrator to fold, with Q3's.

**Scope item 8 says the pane's rules head tells a role that it holds the tools its definition names.** The probe's subagent named fewer. The head, its comment in `claude-roles.ts`, the case of `apps/desktop/test/claude-adapter.test.ts` and the bundle's `README.md` now say "those of the tools its definition names that the session offers".

**The launcher cannot be named `chain`.** Scope item 4 names no file. The chain command keeps what it hands a session under `chain/<work item>/` of the run folder (`chain-command.ts#stageFolder`), and the probe's first launcher, named `chain`, made `owed` fail on that folder. The launcher is `owl-chain`.

**`commandFor` held no folder and no base.** *Data & interfaces* says `paneCommands` takes a function from a pane's folder to what the pane carries. The daemon called `commandFor` with the pane's kind, its id and whether it continues. Its third argument is now `daemon.ts#PaneStart`, which also holds the folder the pane opens in and the work item's base. Three expectations of `apps/desktop/test/daemon.test.ts` and `hooks.test.ts` that held the argument whole took the two fields.

**`OWLERY_BASE` cannot be all that `chain.ts#roundBase` gives.** That function's last value is the branch's head, and a launch reads no head. `Daemon#paneBase` names the base branch where the target line takes its name, and otherwise the commit the branch was cut at. Where a work item records neither, the pane's environment names no base, and the chain command asks for `--base`.

**Scenario 2 names a setup pane, and no new case holds one.** `hooks.ts#setupPaneCommand` makes a setup pane's command, this phase did not change it, and its own case in `hooks.test.ts` pins its environment whole. An assertion of it in the new launch cases could not fail against any change of the launch, so the phase wrote one and took it out again.

**Scenario 3 asks for the case "with and without the choice of scenario 5".** The choice is phase 5's. The case of this phase opens a pane on the owl chain with no choice. Phase 5 adds the other half where it writes the second settings file.

**Scenario 1 names two files, and the launch needed two more.** `apps/desktop/test/pane-chain.test.ts` holds the head, the launcher and the reading of the folder. `apps/desktop/test/role-bundle.test.ts` holds the built daemon: it launches a pane on the owl chain through a stand-in shell, which runs `"$OWLERY_CHAIN" owed` and gets `{"step":"start"}` from the built command.

### Decisions made while building

**The head and the launcher are written by `apps/desktop/src/daemon/pane-chain.ts`, once at the daemon's start.** `writePaneChain` writes `pane-head.md` and `owl-chain` into the run folder, over what an earlier daemon left. `carriedIn` gives a pane the chain where `records-place.ts#onOwlChain` finds Owlery's workflow in the pane's folder, read at each launch. `hooks.ts` takes the answer as a function and reads no repository. The head's text is the one the probe's sessions held and quoted.

**The launcher sets `ELECTRON_RUN_AS_NODE` for the command's process alone.** A pane's environment holds no such variable (`pty.ts#terminalEnv`), and Electron runs a script only with it. The command's own children, git among them, inherit it from the command, as they inherit it from the daemon in the daemon's chain. The broad gate's command does not (`gate.ts#gateEnvironment`).

**A shell pane carries nothing, in whatever folder.** `paneCommands` asks `carries` for a Claude Code pane alone. A `claude` a person starts by hand in a shell pane holds no `OWLERY_CHAIN`, and the bundle's hook does nothing there.

**`pane:run` is `apps/desktop/test/pane-session.test.ts`, beside `role:run`.** It starts the person's own `claude` in a pseudo-terminal with the command and the environment `paneCommands` gives, in a repository the case makes, and reads the conversation file the hooks' events name. It moves the trust dialog's choice onto "Yes" before it confirms, since the line the dialog opens on differed by folder. It asserts on the session's answer and on the tool's result, and holds the person's four settings files to their bytes. It starts no subagent.

**Three sentences of `skills/seal/SKILL.md` are the probe's.** The wait for a subagent that runs in the background, the answer inside a frame, and the id. `apps/desktop/test/role-bundle.test.ts` pins each.

### What was seen red

- The new cases of `hooks.test.ts`, `pane-chain.test.ts`, `records-place.test.ts` and `daemon.test.ts` were written before the code and first ran against it, so each unit was shown red by `seal mutate`, one break at a time. Every mutant below read `red`, and none survived.
- `hooks.ts`, against its cases: a shell asked and carrying, `--plugin-dir` cut, the head's option cut, `--continue` put before the bundle, `OWLERY_CHAIN` cut, `OWLERY_BASE` cut, and a base named where the start names none.
- `pane-chain.ts`, against `pane-chain.test.ts`: every folder carrying, the launcher handing on its first argument alone, the launcher's paths unquoted, the launcher named `chain`, an earlier launcher's mode kept, the head's second sentence cut, and no head written. Against the launch cases of `daemon.test.ts`: every folder carrying, red on both folders that are on no chain of Owlery's.
- The case that holds the person's Claude Code folder to its bytes, shown red with the head written into that folder: its failing line names the added file `pane-head.md`.
- `records-place.ts#onOwlChain` reading AgenticSeal's check as Owlery's: red.
- `daemon.ts`: no folder passed, red on two launch cases; no base passed, red.
- `main.ts`, against the built daemon's case of `role-bundle.test.ts`: no chain handed out, another script named, another Node named, each red.
- The two reworded texts were seen red before they changed: the case of `claude-adapter.test.ts` against the old sentence of the head, and the case of `role-bundle.test.ts` against a `SKILL.md` without the three sentences. `seal mutate` then cut each of the three sentences, and put the head's old sentence back, each red.
- No mutant set the launcher's `ELECTRON_RUN_AS_NODE` aside: that break starts Electron as an app with the script as its entry, which does not end. The built daemon's case holds the line, since its pane's environment prints the variable as unset and the command still answers.

### What the next phases need

- **Phase 5.** `pane-chain.ts#carriedIn` is where the choice lands: it gives a pane the chain or nothing, and `hooks.ts#PaneChain` is what a pane is launched with. The second settings file goes in as the `settingsFile` of the pane's command, which `paneCommands` takes as one value for every pane today.
- **Phase 5.** The probe's settings file for the choice "the owl chain" held `enabledPlugins` with every key of the person's file and the plugin's key `false`, as scope item 10 states it. That is the one form the probe showed.
- **Phase 5.** `pane:run` covers a pane with no choice. A second case, with the second settings file, is what repeats session 2.
- **Phase 6.** Scope item 16 has `docs/architecture.md` state the options a pane's command takes and the head. The names are `pane-head.md` and `owl-chain` in the run folder, `OWLERY_CHAIN` and `OWLERY_BASE` in the pane's environment, and `pane:run` beside `role:run`.
