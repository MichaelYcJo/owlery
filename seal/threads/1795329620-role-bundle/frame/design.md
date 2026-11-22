# Design: 1795329620-role-bundle

The ticket is issue #38. It asks for a role bundle inside the app, so that a headless session the daemon launches can take a role: proofer, crafter for a fix pass, or sealer. It also asks the daemon to read the CLI's version at its start and to tell the person to update an old one, and it asks this work to write the minimum version down.

## Grounding

The tree as read at `ce17009`. The headless adapter this work builds on is read on the branch of #26, `fix/26-a-failed-headless-session-says-nothing`, at `7374426`, which is not merged yet (`frame/plan.md` *Overlap with the release*).

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *What each session loads*, the table's first row and the paragraph under the table | The bundle is loaded with `--plugin-dir`, the role is picked with `--agent`, and the daemon appends the rules for the role and the stage with `--append-system-prompt-file`. The rules are not left to the `skills:` list of an agent definition. No hook meant for a session a person watches is in the bundle |
| `docs/architecture.md` *What we take from AgenticSeal*, the table | The bundle starts from AgenticSeal's agent definitions and skills. The session-start hook and the Stop hook are not taken. Whether AgenticSeal's scripts are taken or rewritten "is not decided", and #40 decides it for the check, so this work ships no script |
| `docs/architecture.md` *What changes because Owlery is not a plugin*, the row "Passing the rules to the agent" | "The first version includes all of core and the agent contract." Cutting them down waits for a measurement of startup tokens |
| `docs/architecture.md` *State lives in three places*, the row "What is given to the agent" | An agent is given the rules its role and stage need. So the appended file is put together for each role and stage, not once for all |
| `docs/architecture.md` *Role sessions run detached from the user's environment* | The flags and the five environment names of the launch stay. A role launch adds to them and removes none |
| `docs/architecture.md` *Authentication of the Claude adapter*, the row "Role bundle" | The bundle is not installed into the user's Claude Code, "so the app's version and the bundle's version are always the same". The bundle's manifest therefore states no version of its own (*Scope* item 1) |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 to 3 | A role and a stage cross the protocol as neutral names. The flags, the bundle and the agent's name stay inside the Claude adapter. The fake adapter takes a role as the Claude adapter does |
| `docs/architecture.md` *Options for launching Claude Code*, the last paragraph | The daemon reads the CLI's version at its start and tells the person to update below the minimum. The paragraph names no minimum, and the options were "confirmed from `claude --help` in Claude Code 2.1.326 (2026-11-17)" |
| `docs/architecture.md` *Taking in AgenticSeal's changes* | A change of AgenticSeal is picked and carried over, and a change not taken has its reason written down. So the bundle says which release it was taken at |
| `docs/architecture.md` *License and code from other projects*, the second bullet | "For MIT code, its copyright notice and license text stay with it." |
| `docs/architecture.md` *Records are committed to the repository* | Owlery has no mode that keeps records uncommitted. The taken texts still describe AgenticSeal's local mode, and this work leaves those sentences (*Scope* item 14) |
| `docs/roadmap.md` *Milestones*, row 2, and row 1 | The role bundle and the detached role sessions for the review rounds, the fix passes and the sealer are milestone 2's. Owlery never turns a permission check off, so the launch keeps `--permission-mode default` |
| `docs/roadmap.md` *Releases and the tracker* | The pull request merges into `release/v0.0.2` by squash. `apps/desktop/package.json` already reads `0.0.2`, so this work moves no version |

The issue has no comment. Executed: `gh issue view 38 --json body,comments`. The spawn carried no line of the orchestrator's on its comments.

What the tree and AgenticSeal hold, each fact labelled:

- **The app ships no agent definition and no skill.** `git ls-files` at `ce17009` lists no file under an `agents/`, `skills/` or bundle directory in `apps/desktop`. Executed. `apps/desktop/build.mjs` bundles four scripts into `dist/` and copies six files beside them. Read. The app has no packaging step, so "inside the app" is `dist/`, which the daemon's script `dist/daemon.js` stands in. Read.
- **Every headless session is launched with the same arguments and no role.** On #26's branch, `claudeArgs(cwd)` (`apps/desktop/src/daemon/adapters/claude.ts:35-55`) returns one list, and `RoleAdapter.start` takes `{ prompt, cwd }` (`adapter.ts:31`). `startHeadless` (`apps/desktop/src/daemon/daemon.ts:915-957`) calls it for the `ask` message (`daemon.ts:688-709`). Read at `7374426`.
- **The CLI is looked up once per daemon, at the first session.** `claudeAdapter` asks the user's interactive login shell where `claude` is, at the first `start` (`claude.ts:150-175`). Nothing reads the CLI's version. Read at `7374426`.
- **The window's status line already carries a notice of the daemon.** `showStatus` (`apps/desktop/src/renderer/sidebar.ts`) shows the window's own notice, then `held.daemonNotice`, then the daemon's state. Read at `7374426`.
- **AgenticSeal's latest release is 0.38.4.** `gh release list -R MichaelYcJo/AgenticSeal` lists `v0.38.4` (2026-11-21) as latest, after `v0.38.3` and `v0.38.2`. Executed. The spawn named the installed copy as 0.38.2 and the rewrite of the batch rule as the next release's. The rewrite is 0.38.4's, whose `### Process changes` table names `skills/implement/orchestration.md` and `skills/core/SKILL.md`. Executed: `gh release view v0.38.4 -R MichaelYcJo/AgenticSeal --json body`. A clone of the tag stands in the scratch directory as `agenticseal-v0.38.4`, at commit `0eca6e7`, and `diff -rq` finds it equal to the installed copy `/Users/yc/.claude/plugins/cache/agenticseal/agentic/0.38.4`. Executed.
- **Between 0.38.2 and 0.38.4, two of the files this work takes changed.** `cmp` of each file of *Scope* item 2 between the two versions differs for `skills/core/SKILL.md` and `skills/implement/SKILL.md` alone, and both differences are the renaming to "the AgenticSeal process" and the batch's scope. Executed.
- **AgenticSeal is under the MIT License.** Its `LICENSE` opens `MIT License` and `Copyright (c) 2026 AgenticSeal contributors`. No taken file carries a notice of its own. Read. Its `TRADEMARKS.md` reserves the name and the drawings, `skills/verify/scripts/seal-mark.txt` among them, and this work takes no drawing. Read.
- **The files a role's definition cites reach the whole plugin.** A probe followed every backticked path under `skills/`, `agents/`, `templates/`, `docs/`, `lib/`, `hooks/` and `bin/` from the three definitions, the core and the contract, through every `.md` file it reached, and listed nearly every document and script the plugin holds. Executed: `test_tmp_closure.py` in the scratch directory, on 0.38.2, whose three definitions are byte for byte those of 0.38.4. So no file set short of the whole plugin leaves every citation resolved.
- **AgenticSeal's hooks are two.** `hooks/hooks.json` holds a `Stop` hook that runs `seal_stamp.py --stop` and a `SessionStart` hook that runs `hooks/core-start.py`. Read. `agents/sealer.md` step 6 queues the stamp that the `Stop` hook draws. Read.
- **The installed CLI is Claude Code 2.1.330.** Executed: `claude --version`, which printed `2.1.330 (Claude Code)` in 0.02 to 0.04 seconds. The lookup through the login shell took 2.3 to 3.2 seconds in three runs. Executed: `/usr/bin/time -p /bin/zsh -l -i -c …`.
- **`claude --help` of 2.1.330 lists `--plugin-dir`, `--agent` and `--add-dir`, and names `--append-system-prompt-file` only inside the text of `--bare`.** Executed; the output is `claude-help.txt` in the scratch directory. The option is read all the same (the probe below, case 4).
- **A plugin's agent is named `<plugin>:<agent>`.** `claude plugin validate` on a scratch plugin named `owlery` printed `agents: owlery:proofer` and `skills: owlery:core`, and exited 0. Executed. It also exits 0 for a manifest with no `version`, with a warning. Executed.

The scratch directory is `/private/tmp/claude-501/-Users-yc-Documents-GitHub-owlery/d0446fb9-f77c-425f-bd37-d22bad5c7878/scratchpad/1795329620-role-bundle/frame/`.

What the CLI does at a role launch. One probe ran `/Users/yc/.local/bin/claude` five times with the arguments of `claudeArgs`, the five environment names of `claudeEnv` and the three role options, on a scratch plugin, with `HOME` set to an empty scratch folder so that no login was read and every run ended `Not logged in · Please run /login` with `total_cost_usd: 0`. Executed on 2026-11-22: `test_tmp_role_launch.mjs`, whose output is `probe-role-launch.txt`, both in the scratch directory.

| Case | The `system` line of subtype `init` | Error stream | Exit |
|---|---|---|---|
| 1. `--agent owlery:proofer`, with the plugin's folder also after `--add-dir` | `plugins` holds `{"name":"owlery","source":"owlery@inline"}` with its path. `agents` holds `owlery:proofer`. `skills` holds `owlery:core`. No key says which agent the session took | nothing | 1, the login's |
| 2. `--agent proofer`, the bare name | The same lists. Nothing says the name was not found | nothing | 1, the login's |
| 3. `--agent owlery:nobody`, an agent the plugin does not hold | The same lists. Nothing says the name was not found | nothing | 1, the login's |
| 4. A rules file that does not exist | no line | `Error: Append system prompt file not found: <path>` | 1, after 206 ms |
| 5. A plugin folder that does not exist | `plugin_errors` holds `{"type":"path-not-found","message":"Path not found: <path>"}`. `agents` holds no `owlery:` name | nothing | 1, the login's |

So the CLI starts a plain session, with no error, where the agent's name is wrong or the bundle is missing, and only the `init` line shows it. A missing rules file ends the CLI on its error stream, which #26's `errorOutput` carries.

The same runs show what a session leaves in `HOME`. Each run that reached a session wrote `.claude.json`, a backup of it, `.claude/projects/<folder>/<session>.jsonl`, `.claude/sessions` and `.claude/plugins/store/` with one file for a built-in plugin. `.claude.json` holds a key `pluginUsage` with the entry `owlery@inline`, beside the entries of the built-in plugins, which a run with no `--plugin-dir` also writes (the scratch home `home-c` of #26's probe). Executed. No run wrote a `settings.json`, an `installed_plugins.json` or a `known_marketplaces.json`. Executed: `find` on the scratch home of case 1.

No probe reached a model, so three behaviours stay unshown, and each is a row of `frame/questions.md`: whether the agent's definition becomes the session's system prompt (Q3), whether a session reads a bundle file under `--add-dir` without a permission request (Q4), and what the appended rules cost in tokens (Q5).

## Scope

1. **The bundle is a plugin folder of the desktop app.** It stands at `apps/desktop/role-bundle/`. Its manifest `.claude-plugin/plugin.json` holds `"name": "owlery"` and a `description`, and holds no `version` and no `hooks` key. `apps/desktop/build.mjs` copies the folder whole to `dist/bundle/`, where the daemon finds it beside its own script.
2. **The bundle takes these 15 files from AgenticSeal 0.38.4, each at the path it has there.** The tag is `v0.38.4`, commit `0eca6e7`.
   - The three definitions: `agents/proofer.md`, `agents/crafter.md`, `agents/sealer.md`.
   - The rules every role is bound by: `skills/core/SKILL.md`, `skills/agent-contract/SKILL.md`.
   - What a proofer's *Order of work* opens: `skills/code-review/SKILL.md`, `skills/writing-style/SKILL.md`, `templates/records/sdd-round.md`.
   - What a crafter's fix pass opens beyond those: `skills/implement/SKILL.md`, `skills/implement/fix-pass.md`, `skills/verify/SKILL.md`, `docs/forms/the-round-record.md`, `templates/records/sdd-gaps.md`.
   - What a sealer opens beyond those: `docs/forms/the-guarantee.md`, `templates/records/sdd-guarantee.md`.
3. **Five of the taken files are changed, and every other taken file is byte for byte the source's.** Each change is forced by the launch of *What each session loads* or by a hook the bundle does not hold.
   - `agents/proofer.md`, `agents/crafter.md` and `agents/sealer.md` lose the `skills:` key of their frontmatter with its two entries. The daemon's appended file is the one way the rules come in.
   - `agents/sealer.md` loses the stamp. The sentence of *Job* that opens "Under rule 6, your writes are" becomes "Under rule 6, your write is `guarantee.md`, and a write not named here is a write you do not make;" with the rest of the sentence kept. Step 6 of *Order of work*, "Queue the stamp once", goes whole, and step 7 becomes step 6. The first bullet of *Never* loses its last sentence, "The values file step 6 queues stands outside the tree." The last bullet of *Never* becomes "Choose a `Broad gate` command: the key is a person's."
   - `skills/agent-contract/SKILL.md`, rule 11, first paragraph: "is the plugin's, at the root two directories above the base directory the harness printed with this file" becomes "is the bundle's, at the root the head of these rules names". No harness prints a base directory for an appended file.
   - The frontmatter `description` of `skills/core/SKILL.md` and of `skills/agent-contract/SKILL.md` says how the file reaches an agent, through the `skills:` list and the `SessionStart` hook. In each, that sentence becomes "Not a command to run: the daemon appends it to the system prompt of every role session." Claude Code lists a bundled skill to the session (the probe's `skills` list), so the sentence is read.
4. **AgenticSeal's licence and a notice stand in the bundle.** `apps/desktop/role-bundle/LICENSE` is AgenticSeal's `LICENSE`, byte for byte. `apps/desktop/role-bundle/README.md` says what the folder is, that the files under `agents/`, `skills/`, `docs/` and `templates/` are taken from AgenticSeal 0.38.4 (`https://github.com/MichaelYcJo/AgenticSeal`, tag `v0.38.4`) under the MIT License whose text is `LICENSE`, each change of item 3, and what the bundle leaves out with the reason, as item 5 gives it. It is the one place in the shipped tree that states the release and the changes. It also says how a later release of AgenticSeal reaches the bundle, which is never by itself: a work item follows `docs/architecture.md` *Taking in AgenticSeal's changes*. It reads the `### Process changes` table of each release since the one the `README.md` names, compares the paths of item 2 between that release's tag and the new one, carries each change it takes into the bundle's file, writes the reason for each change it does not take, and moves the release the `README.md` names. A change to a file the bundle does not hold, such as 0.38.4's rewrite of `skills/implement/orchestration.md`, reaches Owlery through the daemon's code, and #119 carries that one.
5. **The bundle leaves out everything else of AgenticSeal.** It holds no `hooks/` folder and no hook: the `SessionStart` hook that prints the core and the `Stop` hook that draws the stamp are for a session a person watches, and the daemon appends the rules and draws the seal from the records. It holds no script, no `lib/` and no `bin/`: whether Owlery takes or rewrites them is #40's decision. It holds no orchestration document: the daemon's code runs the order. It holds no `framer` and no `tracer` definition: milestone 2 runs neither. It holds no drawing: AgenticSeal's `TRADEMARKS.md` reserves them.
6. **A role and a stage are neutral names.** `ROLE_STAGES` in `apps/desktop/src/shared/protocol.ts` lists the pairs a session can be launched as: `proofer` at `round`, `crafter` at `fix-pass`, `sealer` at `seal`. `RoleStage` is one of them. `RoleAdapter.start` takes an optional `role: RoleStage` beside `prompt` and `cwd`, and a launch without it is the session of #8, unchanged. `roleStageOf(value)` beside them turns a value a client sent into one of the listed pairs, or into none.
7. **The Claude adapter appends a rules file to a role launch.** For each pair, a table in the new module `apps/desktop/src/daemon/adapters/claude-roles.ts` names the bundle's documents that follow the head: for every pair `skills/core/SKILL.md` and `skills/agent-contract/SKILL.md`; then for `proofer` at `round`, `skills/code-review/SKILL.md`; for `crafter` at `fix-pass`, `skills/implement/SKILL.md` and `skills/implement/fix-pass.md`; for `sealer` at `seal`, nothing more. These are the documents the role's *Order of work* opens and follows first. The file is the head of *Data & interfaces*, then each document after a line `===== <path> =====`, without its frontmatter. The adapter writes it whole to `<run folder>/roles/<role>-<stage>.md` before each role launch, with `writeWholeFile`, readable by the user alone. A document the bundle lacks rejects the start with a message that names it.
8. **A role launch adds three options and one folder to the arguments.** After `--permission-mode default` come `--plugin-dir <bundle>`, `--agent owlery:<role>` and `--append-system-prompt-file <rules file>`, and `--add-dir` is followed by the worktree and then the bundle's folder. No other argument and no environment name changes. A role launch on an adapter that was given no bundle folder rejects the start.
9. **A role launch whose session does not hold the role's agent is failed.** The adapter reads the `init` line of a role launch. Where its `plugin_errors` is a list with an entry, the run reports a `result` with `isError: true` and the text `the role bundle did not load: <the first entry's message>`. Where its `agents` is no list or lacks `owlery:<role>`, the text is `the session does not hold the agent owlery:<role>`. Where a `result` line arrives before any `init` line, the text is `the session did not say which agents it holds`. In each case the adapter stops the CLI as `RoleRun.stop` does, and reports nothing else of the run but its `exit`. A launch without a role reads no `init` line.
10. **The fake adapter and the daemon take a role.** The fake adapter's default answer names the role and the stage it was started with, and its `pieces` option receives them. The client message `ask` gains an optional `role: RoleStage`. The daemon refuses a pair `ROLE_STAGES` does not list with the error `no role <role> at the stage <stage>`, and starts nothing. `HeadlessInfo` gains `role: RoleStage | null`. The limit, the stop and the bound of #26 hold for a role session as for any other.
11. **The minimum supported version of Claude Code is 2.1.326, and the adapter says so where the installed one is older.** `RoleAdapter` gains `notice(): Promise<string | null>`. The Claude adapter looks the CLI up as it does for a session, runs it with `--version` and the environment of `claudeEnv`, and reads the first three numbers joined by dots. Where they are below `MIN_CLAUDE_VERSION`, compared number by number, the notice is `Claude Code <found> is older than 2.1.326, the oldest version Owlery's role sessions were checked on. Run "claude update" in a terminal.` Where no CLI is found, or its output holds no version, the notice is null. The fake adapter takes the notice as an option.
12. **The daemon reads the notice at its start and tells every window.** `Daemon#listen` asks the adapter without waiting for the answer. `ready` carries `agentNotice: string | null`, and a new server message `{ type: "agentNotice"; notice }` goes to every client when the value changes. While a notice stands, the daemon asks the adapter again at each hello, so the notice goes once the person updated. The window's status line shows the window's own notice, then the daemon's, then the agent's. The daemon launches a session on an older version all the same.
13. **One real role session is run, by a case that runs only when asked.** `apps/desktop/test/role-session.test.ts` runs where `OWLERY_ROLE_RUN=1`, as `test/memory.test.ts` runs on `OWLERY_MEASURE_MEMORY`, through the package script `role:run`. It starts a daemon with the Claude adapter and the built bundle, asks one prompt as `proofer` at `round` in a scratch repository, and reads the answer for three facts: one that only `agents/proofer.md` states, one that only an appended rule file states, and the first line of a bundle file the session read at its path. Three such facts stand in one taken file each at `0eca6e7`: `round-<n>/clone` in `agents/proofer.md`, `8, 16 and 20` in `skills/agent-contract/SKILL.md`, and `# Review round <N>`, the first line of `templates/records/sdd-round.md`. Executed: `git grep -l -F` for each, over the files of item 2, in the clone of the tag. The case compares the bytes of the user's `~/.claude/settings.json`, `~/.claude/settings.local.json`, `~/.claude/plugins/installed_plugins.json` and `~/.claude/plugins/known_marketplaces.json` before and after, each where it exists. The stream's lines become the fixture `apps/desktop/test/fixtures/claude-role-stream.jsonl`, with each session id, uuid and request id replaced, as `claude-stream.jsonl` does. The run's result goes into the phase record. The suite never runs it.
14. **Out of scope.** The sentences of the taken files that name a `seal` command, a script, `lib/fields.py`, the orchestrator or AgenticSeal's local mode stay as they are. The head of the rules file tells a role what to do where a step needs something the bundle does not hold, and the issue that builds each stage rewrites its role's text with the mechanism the text names: #40 for the scripts and the place of records, #41 for the proofer and the crafter, #42 and #43 for the sealer. Tools and the permission mode per role, and permission requests (#39). The review rounds, the fix passes, the gate, the sealer's run and the pull request (#41, #42, #43). The framer's and the crafter's build stage (milestone 3). The window shows no role on a session's line and offers no control that launches one. Cutting the core or the contract down to what a role needs, which waits for the measurement of Q5. A budget per stage and `--json-schema`. Refusing a launch below the minimum version.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The bundle holds the three roles and their rules | Given the bundle's folder, then it holds the manifest named `owlery`, the three definitions, and every document the table of *Scope* item 7 names for every pair of `ROLE_STAGES` | A case in the new `apps/desktop/test/role-bundle.test.ts` |
| 2. The licence stays with the files | Given the bundle, then `LICENSE` holds `MIT License`, the line `Copyright (c) 2026 AgenticSeal contributors` and the permission notice, and `README.md` names AgenticSeal, `v0.38.4` and `LICENSE` | A case in `role-bundle.test.ts`. That each unchanged file equals its source is read at review: each bundle file is compared with the same path of a clone of the tag `v0.38.4`, and the differences are those of *Scope* item 3. This comparison cannot run before the build, and no case holds it, because the suite has no copy of the source |
| 3. No hook of a watched session | Given the bundle, then it holds no `hooks` folder and no file named `hooks.json`, its manifest holds no `hooks` key, no definition's frontmatter holds a `skills` key, and `agents/sealer.md` does not hold the word `stamp` | Cases in `role-bundle.test.ts` |
| 4. The build ships the bundle | Given a build, then `dist/bundle/` holds the files of `apps/desktop/role-bundle/`, each with the same bytes | A case in `role-bundle.test.ts`, which builds through `buildApp` |
| 5. A role launch carries the bundle, the role and the rules | Given a role and a bundle folder, then the arguments are those of a plain launch with the three options and the second folder of *Scope* item 8, and a plain launch's arguments are unchanged | Cases in `apps/desktop/test/claude-adapter.test.ts`, beside the case that pins the plain launch |
| 6. The rules file is the head and the documents | Given a pair, then the file opens with the head, which names the role, the stage, the bundle's root and the documents, and holds each document in the table's order after its `=====` line, with no frontmatter. Given a bundle that lacks a document, the start is rejected and names it | Cases in `claude-adapter.test.ts`, on a scratch bundle |
| 7. A session that is not the role's is failed | Given a script CLI whose `init` line lacks `owlery:proofer`, one whose line holds a `plugin_errors` entry, and one that prints a `result` and no `init` line, then each run reports the error text of *Scope* item 9 and the CLI is stopped. Given the recorded line of a role launch, the run goes on | Cases in `claude-adapter.test.ts` on script CLIs, and on the fixture of *Scope* item 13 where the run was made, or else on a line with the keys of the probe's case 1 |
| 8. The suite launches a role through the fake adapter | Given the fake adapter, when a client sends `ask` with `proofer` at `round`, then `asked` and every `headless` carry that role and the answer names it. For a pair `ROLE_STAGES` does not list, the answer is the error and no session starts. An `ask` without a role gives a session whose `role` is null | Cases in `apps/desktop/test/daemon.test.ts` and `apps/desktop/test/fake-adapter.test.ts` |
| 9. An old CLI is named at the daemon's start | Given a script CLI that prints `2.1.300 (Claude Code)` for `--version`, then the adapter's notice is the sentence of *Scope* item 11 with `2.1.300`. For `2.1.326`, for `2.2.0` and for `2.10.0` it is null, and so it is where no CLI is found and where the output holds no version | Cases in `claude-adapter.test.ts` |
| 10. Every window is told, and the notice goes | Given a fake adapter with a notice, then `ready` carries it. Given an adapter whose notice arrives after a client connected, the client receives `agentNotice`. Given an adapter whose second answer is null, a hello while the notice stands is followed by `agentNotice` with null | Cases in `daemon.test.ts` |
| 11. The status line says it | Given an agent's notice and no other, the status line shows it. Given a notice of the window or of the daemon as well, that one shows first | A case on the decision in `apps/desktop/src/renderer/view.ts`, in `apps/desktop/test/view.test.ts`, and one drive of the built app in `role-bundle.test.ts` with a script CLI found through a script `SHELL`, as #26's drive finds one, which reads the status line's text |
| 12. A real role session follows its rules and changes no settings file | When the case of *Scope* item 13 runs, then the answer holds its three facts and each settings file's bytes are unchanged | `OWLERY_ROLE_RUN=1 pnpm --filter @owlery/desktop run role:run`, run once by the builder under Q1's default, and recorded in the phase record. Without that run the scenario is `unverified`, and its answerer is the owner |

## Data & interfaces

In `apps/desktop/src/shared/protocol.ts`:

- `ROLE_STAGES`, a constant list of `{ role, stage }` pairs, and `RoleStage`, the type of one of them.
- `HeadlessInfo` gains `role: RoleStage | null`, the role the session was launched as, and null for a session with none.
- Client: `ask` gains `role?: RoleStage`.
- Server: `ready` gains `agentNotice: string | null`, and `{ type: "agentNotice"; notice: string | null }` is new. A window reads a missing `agentNotice` of a daemon of an earlier build as none.

In `apps/desktop/src/daemon/adapters/adapter.ts`:

- `RoleAdapter.start(options: { prompt: string; cwd: string; role?: RoleStage }, listener)`.
- `RoleAdapter.notice(): Promise<string | null>`: what the person should know of the adapter's agent before any session starts, or null. It does not reject.

In `apps/desktop/src/daemon/adapters/claude.ts`:

- `MIN_CLAUDE_VERSION = "2.1.326"`, exported for the cases.
- `claudeArgs(cwd, role?)`, where `role` is `{ bundleDir, agent, rulesFile }`.
- `claudeAdapter(env, options)` gains `bundleDir?: string` and `rulesDir?: string`. `apps/desktop/src/daemon/main.ts` passes the folder `bundle` beside the script it runs, and `roles` inside the run folder.

In `apps/desktop/src/daemon/adapters/claude-roles.ts`, new: the plugin's name `owlery`, the table of *Scope* item 7, and the function that puts a rules file's text together from a bundle folder and a pair.

The head of a rules file, with the role, the stage, the bundle's absolute path and the list filled in:

```
# Owlery role session: <role>, <stage>

You are the <role> of the Owlery role bundle, at the stage `<stage>`. Your definition is `agents/<role>.md` of the bundle.

The bundle's root is `<bundle root>`. Every `agents/`, `skills/`, `docs/` and `templates/` path that your definition and the rules below cite is a path under that root, and you read it there.

The documents below follow this head whole, in this order. Each is in your context already, so do not open it again:

- `<path>`

The bundle holds documents only. A path under those four directories that the bundle does not hold is not shipped, and neither is any `seal <subcommand>` command line or any script. Where a step needs one of them, do not look for it elsewhere and do not put another in its place: say in your report which step needed it.
```

**What the milestone's next items build on, and do not get here.** #39 sets the tools and the permission mode of each role through the same `role` of `start`, and the bundle's folder is among the session's folders, so #39's rules keep a crafter from writing there. #41 launches a proofer and a crafter through `startHeadless` with a `RoleStage`, reads the session's `role`, and rewrites the two definitions and the documents of their stages for the records the daemon commits. #42 does the same for the sealer. #40 decides the scripts, and with them what the sentences that name one become. A new stage is one pair in `ROLE_STAGES` and one row of the table in `claude-roles.ts`.

What the build added beside the sections above, folded by the orchestrator on 2026-11-22:

- `apps/desktop/src/daemon/adapters/claude.ts` also exports `versionNotice(printed)`, which turns what `claude --version` printed into the notice or none.
- `apps/desktop/src/renderer/view.ts` holds `statusNotice(own, daemon, agent)`, which chooses the status line's notice, and `apps/desktop/src/renderer/shared.ts` holds `held.agentNotice`.

## Rule changes

- change
  file: docs/architecture.md
  section: Options for launching Claude Code
  from: These options can differ with the version of Claude Code the user installed. At startup, the daemon reads the CLI version and, if it is below the minimum supported version, tells the user to update.
  to: **The minimum supported version of Claude Code is 2.1.326, and the daemon tells the person to update where the installed one is older.** These options can differ with the version of Claude Code the user installed. 2.1.326 is the version the options of role sessions and their detachment were confirmed at (2026-11-17), and the launch of a role was probed again on 2.1.330 (2026-11-22). The daemon reads the version when it starts, by running the CLI with `--version`, and the window's status line then names the version found and says to run `claude update`. While that notice stands, the daemon reads the version again each time a window connects, so the notice goes once the person updated. Where no CLI is found, or its output holds no version, the daemon says nothing, and the first session says what failed. The daemon launches a session on an older version all the same: the minimum is the oldest version checked, and an older one may still work.
    check: apps/desktop/test/claude-adapter.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- change
  file: docs/architecture.ko.md
  section: Claude Code를 띄우는 옵션
  from: 이 옵션들은 사용자가 설치한 Claude Code의 버전에 따라 달라질 수 있습니다. 데몬은 시작할 때 CLI 버전을 읽고, 지원하는 최소 버전보다 낮으면 업데이트를 안내합니다.
  to: **지원하는 Claude Code의 최소 버전은 2.1.326이고, 설치된 버전이 그보다 낮으면 데몬이 업데이트하라고 알립니다.** 이 옵션들은 사용자가 설치한 Claude Code의 버전에 따라 달라질 수 있습니다. 2.1.326은 역할 세션의 옵션과 사용자 환경에서 떼어 띄우는 방법을 확인한 버전이고(2026-11-17), 역할을 띄우는 것은 2.1.330에서 다시 실험했습니다(2026-11-22). 데몬은 시작할 때 CLI를 `--version`으로 실행해 버전을 읽고, 창의 상태 줄은 읽은 버전과 `claude update`를 실행하라는 말을 보여 줍니다. 이 알림이 떠 있는 동안에는 창이 붙을 때마다 데몬이 버전을 다시 읽으므로, 사람이 업데이트하면 알림이 사라집니다. CLI를 찾지 못했거나 출력에 버전이 없으면 데몬은 아무 말도 하지 않고, 무엇이 실패했는지는 첫 세션이 말합니다. 버전이 낮아도 데몬은 세션을 띄웁니다. 최소 버전은 확인한 가장 낮은 버전이고, 그보다 낮은 버전도 동작할 수 있기 때문입니다.
    check: apps/desktop/test/claude-adapter.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- add
  file: docs/architecture.md
  section: What each session loads
  to: **A role session's system prompt ends with one file the daemon writes: a head, then the core, the agent contract and the documents the role's definition opens first, each whole.** The head names the role, the stage and the bundle's folder, lists the documents that follow, and says that the bundle holds documents only, so a step that names a command or a file the bundle does not hold is reported and not worked around. For a proofer's round the documents after the two are `skills/code-review/SKILL.md`. For a crafter's fix pass they are `skills/implement/SKILL.md` and `skills/implement/fix-pass.md`. A sealer has none after the two. The bundle's other documents are read where a step asks for one, in the bundle's folder, which the daemon passes with `--add-dir` beside the worktree. The daemon writes the file into its run folder before each launch.
    check: apps/desktop/test/claude-adapter.test.ts apps/desktop/test/role-bundle.test.ts
- add
  file: docs/architecture.ko.md
  section: 세션마다 싣는 것
  to: **역할 세션의 시스템 프롬프트는 데몬이 쓰는 파일 하나로 끝납니다. 그 파일은 머리말, core, 에이전트 계약, 그리고 역할 정의가 맨 먼저 여는 문서를 차례로 통째로 담습니다.** 머리말은 역할과 단계와 묶음의 폴더를 밝히고, 뒤따르는 문서를 나열하고, 묶음에는 문서만 있다고 말합니다. 그래서 묶음에 없는 명령이나 파일을 가리키는 단계는 다른 것으로 때우지 않고 보고합니다. proofer의 라운드에서 두 문서 뒤에 오는 것은 `skills/code-review/SKILL.md`입니다. crafter의 수정 패스에서는 `skills/implement/SKILL.md`와 `skills/implement/fix-pass.md`입니다. sealer는 두 문서 뒤에 오는 것이 없습니다. 묶음의 나머지 문서는 단계가 요구할 때 묶음의 폴더에서 읽고, 데몬은 그 폴더를 워크트리와 함께 `--add-dir`로 넘깁니다. 데몬은 세션을 띄울 때마다 이 파일을 실행 폴더에 씁니다.
    check: apps/desktop/test/claude-adapter.test.ts apps/desktop/test/role-bundle.test.ts
- add
  file: docs/architecture.md
  section: What each session loads
  to: **A role launch whose session does not list the role's agent is failed.** Claude Code 2.1.330 started a plain session, with no error, for an agent name the bundle does not hold and for a bundle folder that does not exist (probed 2026-11-22). The first line of the output stream lists the session's agents and the plugins that did not load. The adapter fails the launch and stops the CLI where that line does not list the role's agent, `owlery:<role>`, or lists a plugin that did not load. A role session without its definition would judge with no rules.
    check: apps/desktop/test/claude-adapter.test.ts
- add
  file: docs/architecture.ko.md
  section: 세션마다 싣는 것
  to: **세션이 역할의 에이전트를 나열하지 않으면 그 역할 실행은 실패로 끝냅니다.** Claude Code 2.1.330은 묶음에 없는 에이전트 이름을 받았을 때도, 없는 묶음 폴더를 받았을 때도 오류 없이 보통 세션을 띄웠습니다(2026-11-22 실험). 출력 스트림의 첫 줄에는 세션의 에이전트 목록과 싣지 못한 플러그인이 있습니다. 그 줄에 역할의 에이전트 `owlery:<role>`가 없거나 싣지 못한 플러그인이 있으면, 어댑터는 실행을 실패로 끝내고 CLI를 멈춥니다. 정의 없이 뜬 역할 세션은 규칙 없이 판정하게 됩니다.
    check: apps/desktop/test/claude-adapter.test.ts
- add
  file: docs/architecture.md
  section: Role sessions run detached from the user's environment
  to: **A role session installs nothing: the bundle is loaded for that session alone, and Owlery writes no settings file and no plugin list of the user's.** Claude Code keeps a count of the plugins a session loaded in its own state file, `~/.claude.json`, under `pluginUsage`, and a role session adds the entry `owlery@inline` there (probed 2026-11-22 on 2.1.330). Every run of the CLI rewrites that file, and it is no settings file. The same run wrote no `settings.json`, no `installed_plugins.json` and no `known_marketplaces.json`.
- add
  file: docs/architecture.ko.md
  section: 역할 세션은 사용자 환경에서 떼어 띄웁니다
  to: **역할 세션은 아무것도 설치하지 않습니다. 묶음은 그 세션에만 실리고, Owlery는 사용자의 설정 파일과 플러그인 목록을 쓰지 않습니다.** Claude Code는 세션이 실은 플러그인의 횟수를 자기 상태 파일 `~/.claude.json`의 `pluginUsage`에 적고, 역할 세션은 거기에 `owlery@inline` 항목을 더합니다(2026-11-22 실험, 2.1.330). 이 파일은 CLI가 실행될 때마다 다시 쓰는 파일이고, 설정 파일이 아닙니다. 같은 실행에서 `settings.json`, `installed_plugins.json`, `known_marketplaces.json`은 쓰이지 않았습니다.
- add
  file: docs/architecture.md
  section: Taking in AgenticSeal's changes
  to: **The bundle's files stand at the paths they have in AgenticSeal, and the bundle's `README.md` names the release they were taken at and every change Owlery made to them.** The first bundle is taken at AgenticSeal 0.38.4. A file compared with the same path at that release's tag shows what Owlery changed, so a later release is carried over file by file. AgenticSeal's licence text is the bundle's `LICENSE`, beside the files it covers. The bundle holds documents only: no hook, no script and no drawing.
    check: apps/desktop/test/role-bundle.test.ts
- add
  file: docs/architecture.ko.md
  section: AgenticSeal의 변경을 가져오는 법
  to: **묶음의 파일은 AgenticSeal에서의 경로 그대로 두고, 가져온 릴리스와 Owlery가 고친 곳은 묶음의 `README.md`가 모두 밝힙니다.** 첫 묶음은 AgenticSeal 0.38.4에서 가져옵니다. 파일을 그 릴리스 태그의 같은 경로와 비교하면 Owlery가 고친 곳이 보이므로, 다음 릴리스는 파일 단위로 옮깁니다. AgenticSeal의 라이선스 전문은 묶음의 `LICENSE`로, 그 라이선스가 걸린 파일 곁에 둡니다. 묶음에는 문서만 있습니다. 훅도, 스크립트도, 그림도 없습니다.
    check: apps/desktop/test/role-bundle.test.ts

## Removes

- nothing
  why: The work removes no file, no unit of code, no rule and no test pin from the tree. It adds two mechanisms, the notice of an old CLI and the check of a role launch's first line. Nothing in the tree reads the CLI's version or that line today, so neither stands in the place of a mechanism that could go. The notice refuses nothing. The check's record on the day it is added is the probe of *Grounding*, cases 2, 3 and 5, where the CLI started a plain session for a wrong agent name and for a missing bundle and reported no error. What the taken files lose against their source is *Scope* item 3's, and those lines were never in this tree.

Framed 2026-11-22 by framer, before the build.
