# Architecture: app, daemon, agent adapters, AgenticSeal process

*English · [한국어](./architecture.ko.md)*

## Conclusions

- **The foundation is the inbox, the AgenticSeal process and the back of the seal, and terminals are called on top.** The daemon runs the role sessions of the AgenticSeal process in the background by launching the user's Claude Code in headless mode (`claude -p`, with `stream-json` input and output), and their results appear in the inbox and on the back of the seal. In the first version, a session the person drives is the agent's CLI opened as it is in a terminal, so any CLI works there. Its state is read from hooks and from git. The desktop has no chat screen. The phone shows the same terminal session as a chat, read from the CLI's hooks and session log ([The phone: the terminal session as a chat](#the-phone-the-terminal-session-as-a-chat)).
- **Owlery provides no login.** Authentication belongs to the user's CLI. In Claude Code, the user picks a subscription login or an API key with `/login`, and Owlery only launches that CLI ([Authentication of the Claude adapter](#authentication-of-the-claude-adapter)).
- **Owlery is its own desktop app.** It is not a plugin on top of another app. The daemon launches the user's Claude Code directly, and launches role sessions detached from the user's environment, so there is no reason to hand sessions and terminals to another app. The inbox, the AgenticSeal process and the ledger read the same records inside one product.
- **The UI is built with Electron, and the daemon does the work.** The UI is a thin shell that connects to the daemon only over WebSocket. This keeps open the option of moving to another UI framework later.
- **The daemon's code runs the order of the AgenticSeal process, and only judgment is left to the orchestrator agent.**
- **AgenticSeal is the original that Owlery refers to, and Owlery is a product that extends it.** Owlery does not depend on AgenticSeal to run. It takes AgenticSeal's principles, invariants, roles and record formats and adapts them as its own. Owlery ships the roles' agent definitions and skills inside the app and uses them as the defaults for role sessions ([What we take from AgenticSeal](#what-we-take-from-agenticseal)).
- **Staying light is a goal, and it comes from the app's scope and structure, not from the framework.** Light is relative: Owlery carries less than products that put a chat screen, a terminal, a full editor, a browser, team management and a cloud together. The app uses one window, draws only the visible terminals, and ends Claude processes that are not working.

## Overall layout

```
┌────────────────────────────────────────┐
│ Screen (Electron renderer)             │  inbox, back of the seal, diffs, terminal panes for user sessions
│ Phone app (v0.2)                       │  inbox, question batch, seal, each terminal session as a chat
└───────────────────┬────────────────────┘
                    │ WebSocket (the same protocol for both)
┌───────────────────┴────────────────────┐
│ Daemon (outlives the app)              │  runs the order, keeps terminal output, records cost
│  ├─ User sessions (node-pty)           │  any agent CLI opened in a terminal, read through its hooks and session log
│  ├─ AgenticSeal process                │  order, records and invariants are daemon code
│  │   └─ Role implementations           │  first version: the user's Claude Code (claude -p) + the Owlery role bundle shipped in the app
│  └─ git, gh                            │  watches branches and catches a commit that lands after the seal
└────────────────────────────────────────┘
```

- **The daemon stays alive while the app restarts or updates.** This keeps work from being cut off when a review round runs long.
- **Agent state is judged from events, never guessed from what the terminal screen prints.** Role sessions report it through events in the structured output. A user session in a terminal reports it through its CLI's hooks, as Claude Code does. For a CLI whose hooks we have not checked, the inbox shows only whether the branch changed. When the app puts a decision in front of a person, it must never do so by mistake.
- **Permission requests are handled as first-class events.** The daemon launches framer, crafter, proofer and sealer itself, so when one of them finishes or requests permission, the daemon learns of it first and passes it to the orchestrator agent or to the person. When an agent launches child agents of its own, the parent and child relationship is tracked as well. A user session's permission requests are answered in its terminal, or from the phone through the CLI's permission hook ([The phone: the terminal session as a chat](#the-phone-the-terminal-session-as-a-chat)).
- **A CLI that reports through hooks and has sent no event 10 seconds after its pane started is shown as waiting for the person.** A CLI asks its first questions before its session starts and sends no event while it asks. Claude Code 2.1.327, run on 2026-11-19, sent none of its hook events while it asked whether to trust the folder, which it asks in the first worktree of a repository the person has not trusted in Claude Code, and it sent its session's start within two seconds wherever it did not ask. The daemon judges this from the missing event and never from what the pane prints, and the session's first event replaces the state.
check: apps/desktop/test/daemon.test.ts
- **The daemon keeps the Mac from idle sleep while an agent works.** A sleeping Mac stops every agent, and the notification of an agent that begins to wait does not come until a person wakes the Mac. The daemon holds the block because it knows each session's state and is there while the app is closed. It holds it as one child process, `caffeinate -i -w` with the daemon's own process id, so the block ends when the daemon ends, however it ends. The display may still sleep, and a closed lid still puts the Mac to sleep. A person chooses among "While an agent works", which is the default, "Always" and "Never". "While an agent works" holds while a pane's live process or a headless session is working. "Always" holds while the daemon runs, and does not keep the daemon from exiting once it has nothing left to do. The choice is the daemon's state: it is kept in the daemon's run directory and sent to every client, so the window, and the phone once it comes, show the same one.
check: apps/desktop/test/keep-awake.test.ts apps/desktop/test/daemon.test.ts
- **A person stops the daemon from the app's menu, and the app stops no daemon but its own run folder's.** A plain Quit leaves the daemon and its sessions running. "Restart Daemon…" and "Quit Owlery Completely…" name the running sessions first, and on the person's confirmation the app ends the daemon. It sends a signal to the process that `daemon.json` in its run folder names, and only after a daemon answered at that file's address with that file's token. The first entry then starts the daemon of the running build, and the second quits the app and starts none. The app signals because a daemon of any build ends at a signal, and a daemon of an earlier build would not know a message added to the protocol. The daemon writes the SHA-256 of the script it runs into `daemon.json`. Where that value differs from the script the app would start, the status line says the daemon is from another build and names "Restart Daemon…".
check: apps/desktop/test/daemon-client.test.ts apps/desktop/test/daemon-restart.test.ts

## Agent adapters

When the daemon deals with an agent in a structured way, it goes only through one connector per vendor (an adapter). In the first version there is one real adapter, the Claude adapter, and it runs the role sessions of the AgenticSeal process. A user session in a terminal needs no adapter, because the daemon only launches its CLI in a terminal. Adapters exist only for role sessions. When another company's model takes a role (v0.3), Codex app-server and ACP attach at the same place.

| Direction | What the adapter fits to the daemon |
|---|---|
| Daemon to agent | Sending text, interrupting and stopping midway, slash commands, answers to permission requests |
| Agent to daemon | Messages, tool calls, edited files, permission requests, state (working, waiting for input, finished), tokens and cost per model, usage limits |
| What the adapter declares | Its list of supported features. For example: does it accept slash commands, and is sending `!` output to the agent that CLI's habit |

### Authentication of the Claude adapter

The Claude adapter attaches in only one way: the daemon launches the `claude` CLI that the user installed and logged into. It does not use the Agent SDK. The Agent SDK documentation does not allow third-party products without prior approval to offer claude.ai login or subscription usage limits (Agent SDK overview, read 2026-11-18). When the daemon launches the user's CLI, authentication is the user's from the start.

| What | How |
|---|---|
| Authentication | The user picks it with `/login` in Claude Code. A subscription login uses the user's subscription limits, and an API key uses the user's API billing. Owlery has no login screen and stores no keys |
| Role session | Launched in headless mode (`claude -p --input-format stream-json --output-format stream-json`), the role session delivers messages, tool calls, permission requests and results as events |
| Original screen | If the user wants to look inside, a role session opens in a terminal (`claude --resume <session ID>`). State is then judged by hooks |
| Role bundle | The daemon loads the Owlery agent definitions and skills shipped in the app only into role sessions (`--plugin-dir`). They are not installed into the user's Claude Code, so the app's version and the bundle's version are always the same. See "What each session loads" below |

Anthropic publishes two documents that bear on this, and neither addresses another product launching the user's own logged-in CLI in headless mode. The support article "Use the Claude Agent SDK with your Claude plan" says that `claude -p` and third-party app usage still draw from the user's subscription limits. The Agent SDK overview holds the rule on claude.ai login stated at the top of this section. Both were read on 2026-11-18. Owlery sends Anthropic no inquiry. It judges headless role sessions against these two documents, and judges again when either changes. Role sessions are launched only through the adapter, so moving them to interactive terminals read through hooks stays cheap.

### Reading usage limits

The app shows how much of the user's subscription limit is used and when it resets, and the daemon checks the same values before it starts the AgenticSeal process for a work item. A run can launch four or five stages for one work item, so a run started near the five-hour limit stops halfway. In that case the daemon holds the run back or tells the person.

Claude Code itself hands these values over in two ways. Both were found in the Claude Code 2.1.327 executable (2026-11-18), and neither has been run yet.

| Session | Where the values come from | What comes in |
|---|---|---|
| The user's session in a terminal | The `rate_limits` field in the JSON that Claude Code passes to the status line command | `five_hour` and `seven_day`, each with `used_percentage`. Present only for subscribers, and only after the first API response |
| Role sessions | `rate_limit_event` in the headless output stream | Limit information for each event. Its fields have not been checked |

- **The user's status line stays as it is.** The daemon puts in a small status line command. It passes the JSON to the daemon, then runs the user's own status line command and prints its output unchanged.
- **The values are as of the last call.** When nothing is running, the app shows the last values it received and the reset time.

There is another way, and implementation should keep it in mind. The app could read the user's login token from Claude Code's credentials file or the keychain, and call an undocumented usage endpoint with it. That gives current values at any time. The first version does not take it, for three reasons.

- The endpoint is not documented, so its response shape can change without notice.
- The request has to present itself as Claude Code. If it is blocked, the user's account takes the hit.
- It goes against the rule in this document that authentication belongs to the user's CLI.

Whether to add it later is in "Open decisions". Whether Codex hands over similar values has not been checked.

### What each session loads

| Session | Owlery role bundle | How the rules come in |
|---|---|---|
| Role sessions the daemon launches (framer, crafter, proofer, sealer) | Loads the bundle inside the app with `--plugin-dir`, and picks the role with `--agent` | The daemon appends the rules for that role and stage (core, the agent contract, the role's rules) to the system prompt (`--append-system-prompt-file`). Hooks meant for sessions a person watches (printing the rules at session start, drawing the seal at the end of a turn) are not put in the bundle. Drawing the seal becomes the daemon's job: it reads the records and draws them on screen |
| The user's own work session in a terminal | Not loaded. It is the user's CLI (Claude Code, Codex or another) as it is | Not applicable. The AgenticSeal process runs separately from the user's session (rule 4 below) |

The rules are not left to the `skills:` list in the agent definition. In a session launched with `--agent`, the skills on that list are not preloaded. They are read only when the model calls them itself with the Skill tool (tested 2026-11-17: none of 3 sessions detached from the user's environment read the rules). Rules appended to the system prompt were followed in both of 2 runs.

#### Role sessions run detached from the user's environment

Role sessions run on the user's Claude Code. Launched as is, a role session brings in the user's installed plugins, hooks, skills, MCP servers, global `CLAUDE.md`, auto memory and permission mode. A verdict must not depend on the user's environment, so the daemon launches role sessions as below. Everything was tested on 2026-11-17 with Claude Code 2.1.326 under a subscription login (`claude.ai`).

| What comes in | How it is removed | Test result |
|---|---|---|
| Hooks, enabled plugins, permission rules, user skills, MCP servers and the global `CLAUDE.md` from user settings and repository settings | `--setting-sources ""` | User hooks went from 9 to 0. Enabled plugins, user skills and MCP servers dropped out, and the rule in the global `CLAUDE.md` (answer in Korean) disappeared |
| Other hooks | `--settings '{"disableAllHooks": true}'` | 0 hooks |
| Other MCP configuration | `--strict-mcp-config` | 0 MCP servers |
| Auto memory | `--settings '{"autoMemoryEnabled": false}'` | Left on, a memory index matching the repository comes in. Turned off, there is no memory path |
| Plugins and settings that come in through environment variables (e.g. `CLAUDE_CODE_PLUGIN_DIRS`) | The daemon clears the environment and passes only what is needed (`HOME`, `USER`, `PATH`, `LANG`, `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`) | Plugins that came in through environment variables dropped out, and the subscription login still worked |
| Permission mode | The daemon sets `--permission-mode` | With user settings removed, it becomes `default`. The daemon must set it and pass it for each role |

- **`--bare` is not used.** Under `--bare`, Claude Code does not read OAuth or the keychain, so it cannot run on a subscription login (`claude --help`).
- **The only things that cannot be removed are the plugins built into Claude Code (`cc-plugin-*`, `builtin`).** They are a part of Claude Code that the user cannot choose, so we accept them.
- **The repository's `CLAUDE.md` is read, and the repository's settings are not.** `CLAUDE.md` holds that repository's rules, so verdicts need it. So the daemon leaves the setting sources empty, passes the repository with `--add-dir`, and sets the environment variable `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` so that the `CLAUDE.md` in that directory is read (tested 2026-11-17: the rules in `CLAUDE.md` were followed, and plugins enabled by the repository settings were not loaded). Reading it with `--setting-sources project` brings in the repository's `.claude/settings.json` as well, and the plugins and permission rules those settings enable are loaded into the role session too (tested the same day: the AgenticSeal plugin enabled by the repository settings was loaded).

### Rules that keep it portable

Four rules keep the design portable.

1. **The UI does not know which vendor's agent it is showing.** Only the shapes the adapter produces pass over the protocol between the daemon and the UI. Vendor-specific fields do not. The mobile UI uses the same protocol.
2. **Features that differ by vendor are handled through the feature list.** The UI shows or hides buttons by reading the feature list. It does not branch on a vendor's name.
3. **There are two adapters from the start.** One is the real Claude adapter, and the other is a fake adapter for tests. With only one adapter, it is hard to notice when the shape of the connector hardens around Claude.
4. **The AgenticSeal process runs separately from the user's session.** Whichever vendor's agent runs the user's session, the same chain stamps the seal. The agents that take the chain's roles are launched through the same adapters, so switching the judge to another model does not change the chain's code.

## What we take from AgenticSeal

AgenticSeal is the original that Owlery refers to, and Owlery is a product that extends it. Owlery does not load the AgenticSeal plugin or depend on its version to run. It takes each part of AgenticSeal as its own and puts it where it fits in the product. AgenticSeal is under the MIT license, so files taken from it keep its copyright notice.

**What Owlery took from AgenticSeal is Owlery's own from the day it was taken, and Owlery follows no release of AgenticSeal.** AgenticSeal is where Owlery started. Owlery changes its copies, the role bundle and the PR check's scripts among them, for its own daemon, and no case holds a copy to AgenticSeal's bytes. A later idea of AgenticSeal's comes in as any other idea does, as an issue of Owlery's. Each folder of taken files keeps AgenticSeal's licence text and a notice of where its files started.
check: apps/desktop/test/role-bundle.test.ts apps/desktop/test/pr-check.test.ts

| What AgenticSeal has | Where it sits in Owlery |
|---|---|
| Values and principles: spend judgment only where judgment is needed and let scripts answer the rest; each agent judges its own subject independently; ask the person everything at once, before the first edit | Taken as the product's principles as they are |
| Four invariants: no review without a build, no fix that no round reads, no seal without a broad gate at HEAD, no PR without a seal | The product keeps them. The daemon's code and the PR check enforce them, and they apply equally to work built by any agent |
| Roles: framer, crafter, proofer, sealer | The product owns each role's definition (what it reads, what it judges, what it leaves behind). Role implementations live per runtime. In the first version, the Claude runtime ships the Owlery role bundle, which starts from AgenticSeal's agent definitions and skills, inside the app and uses it as the default. For other runtimes, the same role definitions are carried over into that runtime's format |
| Record formats: design files, round records, the `seal` block in `guarantee.md`, `routing.md` | These are the product's record formats. The first version matches the AgenticSeal format, and adds the fields it needs as it takes in more agents (the party that built it, the model and rule version that judged it) |
| The documents that write down the order (orchestration) | The daemon's code runs the order. Only judgment is left to the orchestrator |
| Scripts behind the `seal` commands: `chain_check`, `seal pr-body`, `seal pr-wait`, `seal stamp`, `seal cost` | The Owlery daemon and the PR check do the same work. The PR check takes AgenticSeal's code, and Owlery adapts it from there: the scripts `chain_check` loads stand in `pr-check/`, started from AgenticSeal 0.38.4, and the workflow of a connected repository fetches them from Owlery's repository. A check rewritten now would have to give a verdict on every record of the chain before the daemon writes one. The daemon runs no Python, since a person's Mac promises none: it reads and writes the records in its own code, and the issue that builds each of the other commands' work decides how |
| Mechanisms that exist only in Claude Code: the session-start hook that prints core, the Stop hook that draws the seal, the permission and worktree hooks | Not taken. The app and the daemon do the same work directly ([What each session loads](#what-each-session-loads)) |
| The question batch (`frame/questions.md`) | Becomes the app's question screen |

### What changes because Owlery is not a plugin

AgenticSeal is a Claude Code plugin, so the means it can use are fixed: markdown that agents read, two hooks (one prints core at session start, the other draws the seal when the session stops), and the `seal` command. That is why many of its mechanisms take the shape "tell the agent in writing, then check later whether it complied." Owlery is a product with a daemon, a UI and its own storage, so it reaches the same goals through structure. The table below maps one onto the other.

| Goal | How the plugin does it | How Owlery does it |
|---|---|---|
| Each party judges only its own subject | The agent definitions state that proofer and sealer do not edit code, and a check confirms it from the round records | The daemon sets each role's tool permissions. proofer and sealer do not receive tools that edit source (`--tools`, `--allowedTools`, `--disallowedTools`). The daemon receives and answers any other permission request (`--permission-prompts host`, `--permission-prompt-tool`) |
| Passing the rules to the agent | The session-start hook prints all of core, and the `skills:` list in the agent definition loads core and the agent contract | The daemon appends the rules to the system prompt for each role and stage ([What each session loads](#what-each-session-loads)). The first version includes all of core and the agent contract. Whether to include only the parts needed is decided after measuring startup tokens ("Measure before building"), because every byte costs tokens |
| Keeping the order | The orchestrator reads the documents that write down the order and follows them | The daemon's code runs the order |
| Waiting for CI results | The orchestrator calls `seal pr-wait` and reads the exit code | The daemon waits, and when CI finishes, it reports through the UI and a notification. No agent stays running while waiting |
| Measuring cost | After the work ends, `seal cost` reads the transcript files, computes the cost and leaves it as a comment on the issue | The daemon records the result events of headless mode (`total_cost_usd` and per-model tokens) at each stage as they arrive. The daemon owns the ledger and can also set a budget cap (`--max-budget-usd`). Under a subscription login, this cost is not the actual charge but a value converted at API prices, and the ledger labels it that way |
| Asking the person | Written in `frame/questions.md`, and the session asks | The app's question screen. It is an input form with choices and defaults, so it can also be shown on a phone once a mobile UI is attached |
| Showing the seal | A hook draws it in the terminal when the session stops | The inbox, the back of the seal, the PR and notifications read the same records and draw it |
| Moving records to another machine | Exchange a zip with `seal export` and `seal import`, and choose with `seal mode` whether to commit records to the repository (shared) or keep them local only (local) | Records are committed to the repository, so they move with git ([Records are committed to the repository](#records-are-committed-to-the-repository)). There is no command for moving records. The only thing to move between machines is the daemon's state (progress, the cost ledger, what the person has seen), and it will later move through sync between machines |
| Running several work items together | One session runs work items one after another, or a person opens several sessions | The daemon sets the order of several work items and how many run at once, and hands the overlaps between work items in the same release to framer |

The table means two things.

- **Many rules that were given in writing become structure.** An agent cannot break what structure blocks, so the cost of having agents read those rules drops too. Rules that need judgment (what counts as the same meaning, whether this design is right) still reach agents in writing.
- **The PR check stays.** Even when the daemon blocks things through structure, the check on the repository that receives the PR, which confirms the seal is at HEAD, must also run outside Owlery. A colleague who does not use the app must get the same verdict when they look at the PR.

### State lives in three places

| Where | What | Why |
|---|---|---|
| The user's repository | All work records, including seal records and their grounds (design, round records, broad gate results), and the decisions made without asking and the questions that park a work item | The PR check and people who do not use the app must read them, and they must be bound to a commit |
| The daemon | Progress, session events and output, the cost ledger, what the person has seen, schedule | They change often, and there is no reason to commit them to the repository |
| What is given to the agent | The rules that role and that stage need, and the previous stage's files | An agent starts fresh every time, and every byte it reads costs tokens |

**The daemon keeps repositories, and every work item belongs to one.** A repository is added and removed on its own, and holds its name, its icon, the base its new work items start from, its groups and its work items. The window makes up no repository from a work item's folder. What a person sets on a repository or a work item, an archive among it, is the daemon's state and is written nowhere in the person's repository.
check: apps/desktop/test/repositories.test.ts apps/desktop/test/daemon.test.ts

### Records are committed to the repository

Owlery always commits work records to the user's repository. There is no mode that keeps them only locally without committing.

- **Uncommitted records cannot support a seal.** The PR check has no records to read, and on another machine or a fresh clone the records are empty. The promise that "the grounds for a verdict travel bound to the commit" cannot be kept.
- **Records have one place, so there is no mechanism to move them.** Records travel with git, so there is no command to export or import records or to change where they live. The only thing to move between machines is the daemon's state.
- **When a repository is first connected, the place for records and the PR check are created together, in one commit the person reads first.** The person is not asked where the records go. The app shows each file it would write, the commit's subject and the branch it lands on, and writes nothing until the person confirms. It writes the records' root `seal/`, with a `README.md` and a `config.json`, and the workflow `.github/workflows/owlery-seal.yml`. Where the repository keeps a `seal/` of its own, the root is `agentic-seal/`. A file that stands is kept as it is, so a repository that holds an AgenticSeal root and its `hygiene.yml` gets no file. The commit holds those files alone, runs the repository's hooks, and is not pushed. The broad gate command is the `Broad gate` key of the root's `config.json`, set in the same step, and the app shows its value and its file on the repository.
check: apps/desktop/test/records-place.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts

So repositories that cannot hold work records in the tree (repositories where company rules forbid it, repositories for contributing to someone else's project) are not what Owlery is for. The app says so before it writes anything. It refuses the setup where git ignores a path the setup would write.

**The PR check runs on GitHub without the app, and judges only a pull request that declares a work item.** The workflow checks out the pull request, fetches `pr-check/` from Owlery's repository at the tag of the release that wrote the workflow, and runs `chain_check.py` against the base branch on Python 3.12 or newer. Until that tag exists it fetches the release's branch. A pull request whose branch no `routing.md` of the records names declares nothing: the check examines nothing and passes it.
check: apps/desktop/test/pr-check.test.ts apps/desktop/test/records-place.test.ts

**A work item's records are the one source of the decisions made for it without asking and of the questions that park it.** They stand in `decisions.md` of the work item's directory, each as a `seal` block. A decision holds an id, its kind (a route, a default taken, a scope chosen, or a question the tree answered), what was decided, the grounds, and its state. A question holds an id, what is asked, the grounds, its options, its default, and its state. The daemon reads the file in the work item's worktree, whether or not it is committed, and names a block it cannot read without deciding anything on it. What the person has seen is the daemon's state and stands in no record.
check: apps/desktop/test/record-blocks.test.ts apps/desktop/test/decision-record.test.ts

**A decision is `decided`, `reversed`, `applied` or `carried`, and a question is `open` or `answered`.** A person reverses a decision with a message, and the record keeps the message. The stage that takes the reversal in before the work item merges writes `applied` with its commit. A reversal that comes after the merge is written `carried`, with the issue or the work item it went to. A `reversed` decision and an `open` question are open rows of the record: a settle keeps the work item's directory while `git grep -n -e '^state: reversed$' -e '^state: open$' -- '*/threads/*/decisions.md'` prints a line of it. A release's pull request lists the decisions made without asking in that release, read from the same blocks.
check: apps/desktop/test/decision-record.test.ts

### Compatibility with AgenticSeal

Users of the AgenticSeal plugin keep using it in Claude Code as they do now. The Owlery record format started from the AgenticSeal format and is Owlery's own. Compatibility is kept only where it serves Owlery: the plugin's check and Owlery's both read this repository's own records until Owlery seals its own pull requests ([Milestones](roadmap.md#milestones) row 2). `decisions.md` is a file AgenticSeal does not read, and its check answers the same with the file and without it (probed 2026-11-22 on 0.38.2 and 0.38.4).
check: apps/desktop/test/pr-check.test.ts

## Code runs the order, the orchestrator judges

The orchestrator in a Claude Code session does two things at once today. One is running a fixed order, and the other is judgment. Moving the order into code removes the procedure text the orchestrator had to read and follow by hand each time. An earlier example in the same direction is AgenticSeal 0.38.0, which replaced a 363-word procedure for waiting on CI results with the `seal pr-wait` command.

| The order the daemon's code runs | The judgment left to the orchestrator agent |
|---|---|
| frame → craft → review rounds → broad gate (gate) → seal → `seal pr-body` → PR → `seal pr-wait` | Which path each work item takes (routing) |
| | Whether to fold a review finding back into the design (fold) |
| | Whether the rounds are converging |
| | Batching everything to ask the person into one set |

We do not make a separate skill for agents to learn how to operate the app. The app owns the order, so such a skill would have nothing to do.

## Options for launching Claude Code

These were confirmed from `claude --help` in Claude Code 2.1.326 (2026-11-17).

| Option | Where it is used |
|---|---|
| `-p`, `--input-format stream-json`, `--output-format stream-json` | Role sessions. The daemon sends text and receives events |
| `--plugin-dir <path>` | Loads the Owlery role bundle inside the app into that session only |
| `--agent <agent>` | Launches a role session with that role's agent definition |
| `--append-system-prompt-file <file>` | Appends the rules for that role and stage to the system prompt |
| `--setting-sources`, `--settings`, `--strict-mcp-config`, `--permission-mode`, `--add-dir` | Detaches role sessions from the user's environment ([Role sessions run detached from the user's environment](#role-sessions-run-detached-from-the-users-environment)) |
| `--tools`, `--allowedTools`, `--disallowedTools` | Sets which tools each role can use |
| `--permission-prompts host`, `--permission-prompt-tool` | The daemon receives permission requests and answers them through a person or a rule |
| `--mcp-config` | Gives the agent the app's tools through MCP servers the daemon launches. For example: updating the approval line, recording cost |
| `--json-schema` | Receives the role's output in a fixed format |
| `--max-budget-usd` | Sets a budget cap per stage |
| `--resume <session ID>`, `--session-id <uuid>` | Resumes a stopped session, and lets the daemon set the session ID in advance. The time and tokens of resume have not been measured yet |
| `-c`, `--continue` | A Claude Code pane that the person starts on the latest conversation of the pane's folder, which is the worktree for a work item's pane. It is launched with Owlery's hook settings, as every Claude Code pane is. Read from `claude --help` in Claude Code 2.1.329 (2026-11-20). It is the way back to a conversation until sessions are resumed by their id (milestone 4 of [roadmap.md](roadmap.md#milestones)) |

These options can differ with the version of Claude Code the user installed. At startup, the daemon reads the CLI version and, if it is below the minimum supported version, tells the user to update.

### Taking in AgenticSeal's changes

Owlery takes in no release of AgenticSeal ([What we take from AgenticSeal](#what-we-take-from-agenticseal)). The role bundle is released with the app, so the order the app runs and the bundle do not drift apart. A change to the bundle or to the PR check's scripts is a work item of Owlery's, and the suite runs with it.

## License and code from other projects

Owlery is released under the Apache License 2.0.

- **Why Apache-2.0.** Open-source maintainers and companies accept it most easily, it carries a patent grant, and the code we take from Apache-2.0 projects comes under the same terms, which keeps the notices simple. A copyleft license (GPL) would stop other products from copying our code. That protection is weak here, because AgenticSeal, where the AgenticSeal process comes from, is already MIT and ideas are not protected by any license. Its costs are real: many companies forbid contributing to or reusing GPL code, plugin authors cannot tell which license their plugin must take, and GPL conflicts with the iOS App Store terms that a later phone app needs. Moving from Apache-2.0 to a copyleft license later stays possible. Moving the other way would need every outside contributor's consent.
- **Code from MIT or Apache-2.0 projects may be taken and adapted.** For MIT code, its copyright notice and license text stay with it. For Apache-2.0 code, its LICENSE and NOTICE come along, and each changed file carries a note that it was changed. Files inside such a project that carry a license of their own are checked one by one.
- **Code from GPL or AGPL projects is not taken.** Only their ideas are used, because taking the code would put the whole app under the same license.
- **Other products' names and logos are not used.** That is a trademark matter, separate from the license.
- **The names and the emblem are not under the Apache License.** The Owlery and AgenticSeal names, the owl emblem and its drawings in the tree are reserved, and `TRADEMARKS.md` at the top of the repository states what they are under.
- **The owner keeps room to change the license.** When outside contributions start, a contributor license agreement (CLA) is added, so the license of later versions can still change. Whether to require it is in "Open decisions".

## Build order

The milestones of v0.1, their order and the grounds for that order are in [roadmap.md](roadmap.md#milestones). v0.1 is what this document calls the first version. This section holds the rule for the shape of the first milestone, and what is built after v0.1.

- **The shell is not just a UI but an end-to-end skeleton.** The window, the daemon and the sessions must be connected from the first milestone, so that the structure need not be redone when the AgenticSeal process is built on it. The fake adapter is there from the first milestone for the same reason ([Rules that keep it portable](#rules-that-keep-it-portable)).
- **After v0.1 come "Get a seal" on a branch another agent built, the phone app (each terminal session as a chat), the Codex adapter for role sessions, and so on.** They are added one by one as the rows of [Open decisions](#open-decisions) are settled.
- **"Get a seal" on a branch another agent built is taken after v0.1.** How to record such a branch has to be settled first (the "Records of branches built elsewhere" row of "Open decisions" in [product.md](product.md)). A branch built in the user's own Claude Code session can be recorded with today's format, which names the implementer as `crafter` or `the session`, so its "Get a seal" is taken in v0.1.

## Platforms and their order

The first version is the macOS desktop app only. The other platforms follow in this order.

| Order | Platform | How it ships | Moves on when |
|---|---|---|---|
| 1 | macOS desktop | Signed and notarized, updated from GitHub Releases | |
| 2 | Android | A signed APK on GitHub Releases, outside the Play Store | The desktop app is stable |
| 3 | Android on the Play Store | Play Store listing | People start to gather |
| 4 | iPhone | App Store | After the Play Store listing |
| 5 | Windows | Signed through SignPath Foundation, which signs open-source projects for free | After the iPhone app |

- **Android comes before the iPhone because the owner can use it every day.** The phone app gets polished fastest on a phone its maker carries.
- **Android starts outside the Play Store.** The first users are open-source maintainers, who are used to installing an APK themselves. A Google developer account costs $25 once.
- **Things to know before the Android release.** These are decided when that stage starts, not now.
  - **Google's developer verification.** Google is making apps installed outside the Play Store come from a verified developer. It started on 2026-09-30 in four countries and widens worldwide from 2027. An unverified app can still be installed, but only after developer mode, a reboot and a 24-hour wait. Verification is separate from a Play Store listing and costs the same $25, so we verify when the rule reaches our users' countries, even before we list on the Play Store.
  - **The package name and the signing key are fixed from the first release.** Moving to the Play Store later without users reinstalling needs both to stay the same. A lost signing key means existing users can no longer get updates, so it is backed up.
  - **Push does not depend on Google's service at first.** Firebase Cloud Messaging (FCM) would need our own server holding its key and keeps the app out of F-Droid. While the app is connected to the daemon, notifications come over that connection. When it is not, UnifiedPush delivers them through a push app the user picks, such as ntfy. FCM is added with the Play Store listing.
  - **Updates.** The app tells the user about a new release on GitHub Releases. F-Droid, which builds the app from source and reviews it for weeks, comes after the app is stable.
- **Linux** is cheap to build with Electron. Whether to ship it as a community build next to macOS is in "Open decisions".

## Connecting from outside: phones and other machines

The first version has no mobile app, and Android comes first ([Platforms and their order](#platforms-and-their-order)). How a phone or another machine reaches the daemon is settled now anyway, because it shapes the daemon's protocol.

- **Connect directly first, and relay only when that fails.** The phone and the daemon each open an outbound connection and learn the address the outside world sees for them. Then both send to each other at the same moment, so each router takes the other side's packets as replies and lets them in (hole punching). This works across different networks, not only on the same Wi-Fi. Once it works, the traffic passes through no server. Only when it fails, for example behind a router that gives each destination a different outside port or on a network that blocks UDP, does the traffic go through a relay.
- **iroh is considered first.** iroh is a Rust library that connects devices by public key instead of by address. It tries a direct connection and falls back to a relay by itself, and it has official Node bindings for the daemon (`@number0/iroh`, Node 20.3 or later). Pairing becomes a QR code that carries the daemon's public key, and its QUIC connections survive a phone moving between Wi-Fi and cellular. Whether a React Native phone app can use it is not confirmed. If it cannot, WebRTC data channels take its place. They are built into Electron, and their relay (TURN) is rented per gigabyte.
- **Everything is end-to-end encrypted.** A relay passes bytes it cannot read.
- **The running cost stays small.** Only connections that fail to go direct use the relay. The relay is iroh's public one or one we run, and its code is published so users can run their own. Connecting over Tailscale or SSH stays supported and costs no one anything.
- **Push notifications need a server of our own.** Sending a notification to a phone needs Apple's (APNs) and Google's (FCM) keys, which cannot ship inside the app. A small push gateway holds them.

## The phone: the terminal session as a chat

The phone shows a session that runs in a terminal on the desk as a chat. The terminal stays the original, and the phone is a second way to see the same session. The phone does this for every agent CLI the person runs, and its traffic goes only over the connection above, through no agent company's server. Two rules hold from now on so the phone can attach: the daemon's WebSocket protocol is not fitted only to the desktop UI, and no state lives on the UI side. A client's own appearance, such as its theme, is not that state, and the client keeps it.

For Claude Code, each part of the chat comes from the places below. Each hook was run on 2026-11-18, with Claude Code 2.1.327 in an interactive session that Owlery launched with its hook settings passed through `--settings`, which add to the user's and the project's settings and change neither. Every event carries `session_id`, `transcript_path` and `cwd`, and every event but `SessionStart` carries `permission_mode`.

| Part of the chat | Where it comes from |
|---|---|
| The person's messages | The `UserPromptSubmit` hook |
| Tool calls and their results | The `PreToolUse`, `PostToolUse` and `PostToolUseFailure` hooks |
| Permission requests | The `PermissionRequest` hook, which carries `tool_name`, `tool_input` and `permission_suggestions` but no `tool_use_id`. The hook waits for the answer from the phone and returns allow or deny |
| The agent's last reply in a turn | `last_assistant_message` in the input of the `Stop` hook |
| Text the agent writes between tool calls | Only in the session log Claude Code writes to disk (`~/.claude/projects/<project>/<session ID>.jsonl`). Its format is not public, so the phone reads it only as a supplement. When the daemon cannot parse it, the phone shows the hook events alone |

- **The phone never reads the terminal screen.** The same rule as the inbox: state and content come from events and files, never from guessing at what the screen prints.
- **Input from the phone goes into the terminal only while the CLI waits for input.** A stop goes in as the CLI's interrupt key at any time.
- **Hooks are added only to the sessions Owlery launches.** The user's own settings files are not changed.
- **Where Codex CLI's state, permission requests and conversation come from has not been checked.** It is checked in milestone 4, which brings a Codex session's line into the inbox ([Milestones](roadmap.md#milestones)), and so before the phone app is built.

Some agent CLIs have a remote feature of their own, such as Claude Code's Remote Control. Owlery does not use or turn on such a feature. When a user turns one on for a session, the same permission request can appear in two places. What to do then is in "Open decisions".

## Memory design

**Owlery spends as little memory as it can, and a feature costs nothing while nobody uses it.** What a feature holds is made when it opens and let go when it closes, and memory grows with the stages working right now, not with the work items left open.

**What a scene costs is measured and published, and no number of a reference scene is a limit on a feature.** A scene is one state of the app, written down so that it can be measured again. Each scene is published with its date, its commit and its method, beside the same scene in comparable products. The first reference scene is the app itself with four terminals visible, which read about 500 MB: 491.1 to 503.4 MB in an agent's start on 2026-11-19 (`apps/desktop/measurements/memory.md`). No comparable product has been measured in that scene yet. A feature is not refused because a scene it adds to reads more.

**A feature is built first, and made efficient where a measurement shows its cost.** It is built with ordinary care, so that it holds nothing while unused, and its cost is then measured. Efficiency work follows where a measurement shows the cost, as issue #9 found that each hidden pane kept its terminal screen in the window, and removed it. A tight number set before a feature is built is not a design input. The reference scenes are measured again as features land, with `pnpm run measure:memory` in `apps/desktop`, so a change in their numbers is seen and a refactor is scheduled for it. No check runs that measurement: the suite's run of `test/memory.test.ts` measures nothing without `OWLERY_MEASURE_MEMORY=1`.

**The limits Owlery keeps are defaults read from the person's machine, which the person sees and changes.** They are how many agents and how many worktrees run at once, and how many panes a work item's view shows at once. Each is proposed from the machine's memory, cores and free disk, never from the number of a scene measured on another machine. Issue #32 builds them, in milestone 3 ([Milestones](roadmap.md#milestones)). Until then nothing caps the agents and the worktrees, and the panes on a view stay at four (below).

The four rules below are how the app holds little while it runs.

| Rule | Reason |
|---|---|
| Terminal screens and WebGL contexts are created only for as many panes as are visible, and are reused. The daemon holds the output of hidden terminals | A hidden WebGL canvas still holds a framebuffer the size of the screen, so with one canvas per terminal a single GPU process can exceed 1 GB (measured 2026-11-17). Reuse should avoid most of the cost of creating a new screen object (about 160–190 ms) |
| The UI holds only 1,000 lines of history. Anything older is fetched on demand from the daemon and the log on disk | Adding one terminal to the same window added about 14 MB with 1,000 lines of history and about 20 MB with 5,000 lines |
| Only one window is used. There is no built-in browser | Each extra window added about 130 MB |
| Claude processes for finished stages of the AgenticSeal process are ended. Resume is used to talk to them again. Sessions the user launched from a terminal are closed by the user | One Claude process uses 345–679 MB |

The GPU terminal limit stays at Chromium's default of 16. This means one screen cannot hold 17 or more panes. The renderer's memory cap is not raised either.

A work item's view shows at most four panes at once today. Four is the count the reference scene was measured at, and it is fixed in the code (`STAGE_PANES` in `apps/desktop/src/renderer/view.ts`) until issue #32 makes it one of the defaults read from the machine, higher on a machine with more memory. The other panes of the work item stay as tabs, and a pane that is not on screen holds no terminal screen in the window. The daemon keeps the last 256K characters of each pane's output, and the window draws a pane from that replay each time the pane comes back on screen. Where it drops older output, what it keeps opens at a line's start where a line break stands within the first 4,096 characters, so a replay does not open inside an escape sequence. Past that, the cut stays where the count of characters puts it, and a program that prints a long stretch without a line break, as a full-screen program may, keeps that stretch.

## Screen framework: Electron

The UI is built with Electron. Frameworks that use the system webview used somewhat less memory (up to about 10% across the same 8 scenarios, measured 2026-11-17), but the gap was not large enough to decide on. The four points below decided it.

- **The same UI on three OSes:** Chromium ships with the app, so macOS, Windows and Linux draw with the same engine.
- **Korean input on macOS:** The terminal component (xterm.js) has no known input problems. A person typed Korean with the Dubeolsik layout into the Owlery terminal pane on 2026-11-18, in the shell and in Claude Code, and the shell received it as typed, in UTF-8.
- **Linux:** There are fewer open issues with Wayland, Nvidia and WebGL.
- **Updates:** Delta updates download only the changed parts. In exchange, the app is large (.app 253 MB).

Electron stays on macOS too (decided 2026-11-18). Moving macOS alone to the system webview was weighed on two criteria: Korean input, which works in the Electron pane (above), and how much lighter the app becomes, which the measured gap of up to about 10% does not decide.

**The window shows Owlery's own page and nothing else, and no second window opens.** The main process refuses every navigation of the window but a reload of its own page, and refuses every new window. So nothing a pane prints can replace the window or open a page of the web inside Owlery, and a file a person drops on the window does not replace it either: the window does not navigate on a drop. A link a pane prints opens in the system browser, on a click with the Command key held, and only where its address is an `http` or `https` one. A path a pane prints is a link only where the main process finds a file or a folder at it. A click on it with the Command key held puts the view of another work item in front where the path is that work item's worktree, and shows it in Finder otherwise: a file is shown selected in its folder and is never opened in an app, and a folder is opened unless its name holds a dot after its first character and it is no checkout. An app started with `OWLERY_BACKGROUND=1` opens nothing in the system browser or in Finder, and reads and writes a clipboard of its own in place of the system's.
check: apps/desktop/test/terminal-basics.test.ts apps/desktop/test/navigation.test.ts apps/desktop/test/links.test.ts apps/desktop/test/paths.test.ts apps/desktop/test/clipboard.test.ts

**On macOS, closing the window hides it, and the app keeps its page.** The window's page raises the notifications, so a session that begins to wait while the window is closed still notifies. A click on the notification or on the Dock icon shows the window again, and Quit ends the app. An app started with `OWLERY_BACKGROUND=1` closes its window as before and quits with it: it has no Dock icon that could bring a hidden window back.
check: apps/desktop/test/background.test.ts

## Measure before building

- **Direct connection rate:** Measure how often a phone connects to the daemon without the relay, on Korean LTE and 5G, office Wi-Fi and café Wi-Fi, for iroh and WebRTC each ([Connecting from outside](#connecting-from-outside-phones-and-other-machines)).
- **Switching latency when screens are reused:** Measure on macOS, Windows and Linux each, with 1,000 and 5,000 lines of history at 200 columns.
- **GPU memory one visible terminal uses:** Measure at our pane size, for WebGL and DOM each, and for Retina and 4K each.
- **Daemon CPU:** Measure the cost of parsing terminal output when 10 agents print at once.
- **ACP coverage:** Check which agents attach through ACP, and which of permission requests, slash commands and interrupting midway they support. Features they do not support are covered by opening the agent in a terminal.
- **Time and tokens of resume:** Measure separately for sessions stopped within the last 5 minutes and for older ones.
- **How long a permission hook can wait for the phone:** Check the hook's time limit and what the CLI does when it runs out, for Claude Code and Codex each ([The phone: the terminal session as a chat](#the-phone-the-terminal-session-as-a-chat)).
- **What the cost field means under a subscription login:** We confirmed that headless result events carry `total_cost_usd`, `usage` and `modelUsage` under a subscription login too (2026-11-17). A subscription is not billed per token, so these values appear to be converted at API prices. Before deciding how the ledger shows them, compare the values for the same work against an API key login.
- **Usage limit values:** Run a session under a subscription login and confirm the `rate_limits` field in the status line JSON and the fields of `rate_limit_event`. Also check whether Codex has similar values ([Reading usage limits](#reading-usage-limits)).
- **AgenticSeal's cost per stage:** Measure with `seal payload` and `seal cost`.
- **Startup tokens saved by the rules moved into structure:** The startup bundle per agent (agent definition, core, agent contract, CLAUDE.md), measured with `seal payload` on 2026-11-17, is about 12,000 tokens for framer and about 10,500 tokens each for crafter, proofer and sealer (estimated at 1 token per 3.2 bytes). In one work item proofer is launched for several rounds, so this bundle is paid for several times. Sort each sentence by "does it need judgment, or can the daemon, permissions or the output format (`--json-schema`) enforce it", remove the enforced sentences, and measure the bundle again. The same bundle is read cheaply from the prompt cache, so the savings will likely be smaller than the byte ratio.
- **A start of the app that an agent makes on a person's machine sets `OWLERY_BACKGROUND=1`, and what only a person's start shows is measured by a person.** Without it the window takes the system's focus, so the person's keys reach the agent's pane and a Korean composition the person has under way ends. With it the window opens without the focus and without a Dock icon, and it ignores the mouse, so the person's pointer passing over it reaches nothing in it and their clicks land in the windows under it. Such a start lacks the Dock icon, the menu bar, the system's focus and the system's pointer, so a reading that rests on one of them, such as a typed Korean line, the memory of a window kept in front or a pointer passing over the window, is a run the person makes ([Milestones](roadmap.md#milestones), `apps/desktop/measurements/memory.md`).

## Open decisions

| Decision | Options | Criteria |
|---|---|---|
| May the user's Claude Code be launched headless | Run role sessions in headless mode / launch them only in a terminal and read state through hooks | What Anthropic's published documents say, judged again when they change ([Authentication of the Claude adapter](#authentication-of-the-claude-adapter)). If they come to forbid it under a subscription login, role sessions also run in a terminal and are read through hooks, and the inbox and the AgenticSeal process stay as they are |
| Scope of the records kept in the repository | Keep every record of the work in the repository, as AgenticSeal does / keep only the seal and its grounds, and the rest in the daemon | The first version takes the former: it commits all records, starting from the AgenticSeal format. Whether to cut down to the latter depends on whether the repository only needs to hold what the PR check and people outside the app must read, and on what AgenticSeal's settle (folding records into the policy documents after a release) reads |
| Splitting the orchestration documents | Whether to split AgenticSeal's orchestration documents into "the order the daemon runs" and "the orchestrator's judgment" and use them as input to the app's design | When daemon implementation starts |
| Editor component | CodeMirror 6 / Monaco | The memory added and the time taken to open one file, and Korean input on macOS. Not measured yet. No language servers or extensions are included, so most of Monaco's advantages go unused |
| What the phone reads for the conversation | Hooks only (the last reply of each turn) / also the CLI's session log (the text between tool calls) | How often the session log's format changes across CLI versions, and whether a chat without the text in between is enough on a phone ([The phone: the terminal session as a chat](#the-phone-the-terminal-session-as-a-chat)) |
| Input from the terminal and the phone at once | Whoever types first, the other waits / the terminal always wins | Whether the daemon can tell reliably that the CLI is waiting for input, and how the person learns that their input from the phone did not go in |
| Sessions with the CLI's own remote feature on | Owlery leaves that session's permission requests to that feature / both show them, and the first answer counts | Claude Code has no hook that reports Remote Control is on, so the daemon cannot tell when the person turns it on themselves |
| When branches built by other agents get a seal | After v0.1, as now / pull it into v0.1 | Are the first users people who already run Codex alongside Claude Code? A Codex session runs in a terminal pane from milestone 4 ([Milestones](roadmap.md#milestones)), so what is left is how to record its branches. What draws these users in is a branch Codex built getting Claude's seal |
| How to read usage limits | Only the values Claude Code hands over / also read the user's token and call the undocumented endpoint | Are values as of the last call enough for the inbox and for holding back a chain? Also what Anthropic's published documents say about another product reading the user's login token, judged again when they change as the headless question is ([Reading usage limits](#reading-usage-limits)) |
| Connection library | iroh / WebRTC data channels | Can the React Native phone app use iroh, and which reaches the daemon directly more often on the networks people actually use ([Connecting from outside](#connecting-from-outside-phones-and-other-machines)) |
| Contributor agreement | Require a CLA / take contributions under the Developer Certificate of Origin (DCO) only | A CLA keeps the license changeable but adds a step that turns some contributors away. A DCO only certifies that the contributor may submit the code, so the license could no longer change without everyone's consent ([License and code from other projects](#license-and-code-from-other-projects)) |
| Linux | Ship a community build next to macOS / wait until after Windows | Electron makes the build cheap and many open-source maintainers work on Linux, but every supported platform needs its own testing, and Linux has more open terminal issues around Wayland, Nvidia and WebGL ([Platforms and their order](#platforms-and-their-order)) |
