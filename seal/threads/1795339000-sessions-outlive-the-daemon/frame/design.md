# Design: how an agent's session survives the daemon and a reboot (study, #36)

This file is the study issue #36 asks for. *Grounding* holds what was read and run. *The study* holds the comparison, the recommendation and what an update of the app does to a running agent. `frame/plan.md` holds the issues and the text for `docs/architecture.md`. The work item builds no code.

Words used below as the tree uses them. The **daemon** is the process of `apps/desktop/src/daemon/main.ts`. A **pane** is one process in a pseudo-terminal that the daemon started, a shell or Claude Code. A **role session** is a headless session of the AgenticSeal process, a child process of the daemon that it talks to over pipes. The **run folder** is the daemon's own directory, `run` under the app's user data folder. A **build** is the SHA-256 of the daemon's script, as `apps/desktop/src/daemon/discovery.ts#buildOf` defines it. A **way** is one of the approaches the study weighs.

## Grounding

The tree as read at `d00e544`. Every path below is under `apps/desktop/` unless it starts with `docs/`, `seal/` or `etcs/`.

`routing.md` of this work item was read: the planning is the framer's, the session writes the text and opens the issues, and the pull request merges into `release/v0.0.2`. Issue #36 was read whole with `gh issue view 36 --json title,body,comments,milestone` on 2026-11-22 (`executed`): it carries no comment, and its milestone is `release: 0.0.2`. `seal/follow-up.md` does not exist in the tree.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Overall layout*, "The daemon stays alive while the app restarts or updates. This keeps work from being cut off when a review round runs long." | An update of the app must not end the daemon under a running session. The recommendation keeps this sentence true and says how |
| `docs/architecture.md` *Overall layout*, "A person stops the daemon from the app's menu, and the app stops no daemon but its own run folder's." | One daemon serves one run folder, a person chooses when it stops, and a daemon of another build is told apart by its build and named in the status line. The recommendation extends this structure and adds no second one |
| `docs/architecture.md` *Memory design*, "Owlery spends as little memory as it can, and a feature costs nothing while nobody uses it." and "What a scene costs is measured and published" | The cost columns of the study weigh a process that runs while unused against one that does not, and the one number the study measured is published with its date and method |
| `docs/architecture.md` *Memory design*, the table's fourth row: Claude processes of finished stages are ended and resume is used to talk to them again, and a session the user launched is closed by the user | Ending a process and resuming its conversation is already the design for role sessions. The daemon ends no pane of a person's by itself |
| `docs/architecture.md` *State lives in three places* | What the daemon learns of a session, its id among it, is the daemon's state. Nothing of it is written into the person's repository |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 and 2 | No vendor's field crosses the protocol. A session id stays in the daemon, and "can resume" is a feature of a pane's kind, as `continues` is today |
| `docs/architecture.md` *The phone: the terminal session as a chat* | Every hook event carries `session_id`, `transcript_path` and `cwd` (run on 2026-11-18 by the work of issue #4, not run again here). Hooks are added only to the sessions Owlery launches, and the user's settings files are not changed |
| `docs/architecture.md` *Options for launching Claude Code*, the rows of `--resume`, `--session-id` and `--continue` | Resume by id is the planned way back to a conversation, and `--continue` is the way until it is built |
| `docs/architecture.md` *Measure before building*, "Time and tokens of resume" | What a resume costs is not measured. The study recommends nothing that resumes without a person's word |
| `docs/architecture.md` *Authentication of the Claude adapter*, the row "Role bundle": the app's version and the bundle's version are always the same | A daemon kept through an update must go on reading the bundle of its own build |
| `docs/roadmap.md` *Milestones*, row 4: "Bringing in the sessions the CLI already has and resuming them, after a reboot as well" | Resume by session id is milestone 4's, and issue #61 holds it |
| `docs/roadmap.md` *Releases and the tracker* | A release below 0.1.0 is a tag the owner builds from, and the app updates itself only from the release issue #78 brings. Until then "an update" is the owner starting a newer build over the daemon of the build before |

### What the tree does today

Each row was `read` at `d00e544`.

| Fact | Coordinate |
|---|---|
| The daemon holds each pane's pseudo-terminal through node-pty, in its own process | `src/daemon/pty.ts#TerminalSession`, `src/daemon/daemon.ts#startSession` |
| The app starts the daemon detached, and a plain quit leaves it running. The daemon exits by itself 60 seconds after it has no client, no live pane and no working headless session | `src/main/daemon-client.ts#ensureDaemon`, `src/daemon/daemon.ts#checkIdle` |
| When the daemon stops it ends every live pane with node-pty's `kill`, stops every headless run, and exits without waiting for the panes' processes | `src/daemon/main.ts#main` (`stop`), `src/daemon/daemon.ts#close` |
| The list of panes, each pane's state and its last 256K characters of output are in the daemon's memory alone. The run folder keeps the repositories, the last look, the keep-awake choice, the hook settings and `daemon.json` | `src/daemon/daemon.ts` (`sessions`, `OutputBuffer`), `src/daemon/main.ts#main` |
| A pane's id is a count that starts at 1 in each daemon process | `src/daemon/daemon.ts` (`nextId`) |
| A pane's hook command reads the pane's id and the hook socket's path from the pane's environment, fixed when the pane starts. The socket is `hooks.sock` in the run folder | `src/daemon/hooks.ts#RELAY`, `src/daemon/hooks.ts#paneCommands` |
| The daemon listens to eight hook events and reads from their input the event's name, the tool's name and the text a person reads. No source file reads `session_id` | `src/daemon/hooks.ts#HOOK_EVENTS`, `src/daemon/daemon.ts#agentEvent`, and the first row of *What was run* |
| The app attaches to whatever daemon answers at `daemon.json`, whatever its build. Where the build differs the status line names "Restart Daemon…" | `src/main/daemon-client.ts#ensureDaemon`, `src/main/daemon-client.ts#otherBuild`, `src/renderer/view.ts#daemonNotice` |
| The protocol carries no version. A window reads a field an older daemon does not send as absent, and the daemon ignores a message whose type it does not know and answers nothing | `src/shared/protocol.ts` (`PaneKindInfo.continues`), `src/renderer/view.ts#daemonLists`, `src/daemon/daemon.ts#handle` (`default`) |
| A role session is a child process of the daemon, and the daemon reads the role bundle from the folder beside its own script at each launch | `src/daemon/main.ts#main` (`roleAdapter`) |
| The window reloads one second after its daemon goes away, and the load finds or starts a daemon | `src/renderer/renderer.ts:1399-1401` |

### What was run

Each row is `executed`, on 2026-11-22, on the framer's Mac. No row started a `claude` session, and no check of the repository's was run.

| Command | Result |
|---|---|
| `git grep -n -i -e session_id -e sessionId -e transcript_path d00e544 -- apps/desktop/src` | It prints nothing and exits 1. The daemon and the window read no session id |
| `claude --version`, `claude --help` | Claude Code 2.1.330. The help lists `-r, --resume [value]` ("Resume a conversation by session ID or name"), `--session-id <uuid>`, `--fork-session` ("When resuming, create a new session ID instead of reusing the original"), `-c, --continue`, `--bg` ("Start the session in the background and return immediately"), and the commands `attach`, `logs`, `respawn`, `stop`, `rm` and `agents`. The line of `--name` mentions a `/resume` picker inside a session |
| `claude agents --json` | It exits 0, starts no session and prints an array of the sessions that are active. Each entry has the fields `cwd`, `kind`, `name`, `pid`, `sessionId`, `startedAt` and `status`. Only the field names were read, and the values seen for `status` were `busy` and `idle` |
| `which tmux zellij` | Neither is installed on this Mac |
| The probe `test_tmp_pty_survival.cjs`, part 1, run once with the main clone's Electron as Node and its node-pty 1.1.0: a process holds two pseudo-terminals, one running `sleep` and one a shell that ignores the hangup signal, and is then killed with SIGKILL | The `sleep` ended with its holder. The process that ignored the hangup was still alive 1.5 seconds later, with no holder. The holder read 13,583,512 bytes of macOS `phys_footprint` (`footprint --noCategories -f bytes`, the method of `measurements/memory.md`), which is 13.0 MB at 1,048,576 bytes to the MB |
| The same probe, part 2: a holder starts a pane that prints a line and its terminal's size five times a second, starts a second process that inherits the pseudo-terminal's descriptor, and exits without ending the pane | The pane was alive after its first holder was gone. The second process read the pane's lines from the inherited descriptor, and after it called node-pty's native `resize` on that descriptor the pane printed the new size, 30 rows by 100 columns. `resize` on a descriptor and the descriptor itself (`_fd`) are not in node-pty's published interface |
| `git grep -n 'DAEMON-ISSUE' d00e544 -- docs README.md README.ko.md` | It prints nothing and exits 1. The token is the placeholder of `frame/plan.md` *Phases*, phase 2 |
| `gh pr list --state open` | It lists no open pull request |

The probe file and its output are in the framer's scratch directory, `1795339000-sessions-outlive-the-daemon/frame/` under the session's scratchpad. The worktree has no installed dependencies, so the probe loaded node-pty from the main clone's `node_modules` and ran none of the repository's code.

### What the research says

`etcs/research/terminal/paseo.md`, `orca.md` and `native.md` were `read` in the main clone, where they stand uncommitted, each dated 2026-11-18. Their authors read the other products' code and issues and ran none of it. The framer opened none of the pages or repositories they cite, so each row is the research's finding and not the framer's.

| Finding | Where the research states it |
|---|---|
| Paseo runs the pseudo-terminals in a worker process apart from its daemon since its release 0.15.0. A new daemon adopts the worker through a record file and a secret, adopts a worker one protocol version older and closes an older one, and runs the worker from a copy outside the install path. A reboot is out of its scope. Its chat agents are separate processes that the worker does not hold. Two issues of the worker are open: a stream that ends while the process lives (#9346) and a cold start that times out (#1543) | `paseo.md`, sections 1 to 3 |
| Orca starts a daemon for each protocol version and keeps the older ones for their sessions. Its protocol stood at version 57, and older daemons kept running unseen and held memory (its issue #9138, open). After a reboot it restores the screen from disk and starts the agent again with the agent's own resume command | `orca.md`, section 2 |
| Both products run the process that outlives the app from files the updater does not replace | `paseo.md` section 2, `orca.md` section 1 |
| Inside tmux, Claude Code stops its own state reports over the terminal (OSC 7501), and Shift+Enter and notifications need tmux settings. cmux offers tmux and zellij only for sessions a person picks | `native.md`, section 4, citing Claude Code's terminal documentation |
| cmux resumes an agent after a restart with the session id its hooks stored | `native.md`, sections 1 and 4 |

### The row the settle of release 0.0.1 carried here

The row asks whether the process of a real Claude Code pane ends when its daemon stops. The probe above repeats what the record of release 0.0.1 found with a stand-in: a process that takes the hangup ends with its holder, and one that ignores it lives on unseen. Whether Claude Code takes the hangup is still not run, because the spawn of this framer allows no start of a real `claude`. `frame/questions.md` Q1 carries the row with its default. The recommendation does not rest on the answer: *The recommendation*, part 2, has the daemon check that no process still runs a conversation before it resumes it.

## Scope

In scope, numbered for `frame/plan.md`:

1. The comparison of the ways: what each keeps alive, what it costs to build and to run, and what it changes in the protocol and in the hooks (*The ways compared* and *Data & interfaces*).
2. The recommendation of one combination, and what an update of the app does to a running agent under it (*The recommendation* and *What an update of the app does to a running agent*).
3. The text the study places in `docs/architecture.md` and `docs/architecture.ko.md`, as `frame/plan.md` *The text placed in the policy documents* gives it.
4. The issues of the recommendation's parts, as `frame/plan.md` *The issues* gives them: one issue to open, and a comment on each of the issues #61, #55 and #78, which already hold a part.
5. The state of the row carried by the settle of release 0.0.1 (`frame/questions.md` Q1).

Out of scope:

- Any code, any test and any fixture. The issues build the parts.
- The measurement of a resume's time and tokens. It needs real turns, and issue #61 holds it.
- Keeping a shell pane's process or its output past the daemon. The issue asks about an agent's session, and a shell has no conversation to resume. A person who needs a shell that outlives the daemon can run tmux inside a shell pane today.
- A change to `docs/roadmap.md`. Its milestone 4 already names the resume, and the tracker's milestones hold the issues.
- The update itself: the package, the signing and the updater are issue #78's.

## The study

### The ways compared

The first four ways are the issue's. The last two were found by the study: the handover of descriptors in `orca.md`'s open decisions and in the probe, and Claude Code's background sessions in `claude --help`.

What each way keeps alive, for a pane's process unless the cell says otherwise:

| Way | Window closed, or app quit | Daemon restarted | App updated | Reboot |
|---|---|---|---|---|
| Today: the daemon holds the pseudo-terminals, and one daemon serves the run folder | lives | ends, at a restart a person chose and at a crash alike | lives until a person restarts the daemon: the newer window attaches to the older daemon and names "Restart Daemon…" | ends |
| A. A terminal worker apart from the daemon, as Paseo does | lives | lives, at a restart and at a crash of the daemon. A role session is no terminal: a stop of the daemon still ends it, and its end at a crash was not run | lives | ends |
| B. A daemon for each protocol version, as Orca does | lives | ends | lives, in the daemon of the older version | ends |
| C. Resuming the conversation by its session id | no change | the process ends and the conversation comes back in a new one. A turn under way is cut | the same, where the update restarts the daemon | the same. It is the only way past a reboot |
| D. tmux or zellij under each pane | lives | lives, while the tmux server lives | lives | ends |
| E. Handing the descriptors to the next daemon | lives | lives at a restart a person chose, where both daemons know the handover. Ends at a crash | lives, on the same condition | ends |
| F. Claude Code's own background sessions (`claude --bg`, `claude attach`) | lives | expected to live, from the help text. Not run | expected to live. Not run | the process ends, and `--resume` brings the conversation back |

What each way costs:

| Way | To build | To run |
|---|---|---|
| A. Worker | A second process with its own start, a local socket between daemon and worker with a secret and a record file, and the adoption of a running worker by a new daemon. That socket's protocol is a second one with versions of its own: a new daemon must adopt or drain a worker of an older build. The pane's output buffer moves into the worker. The worker must run from files an update does not replace. Role sessions need a second answer | A process that runs while any pane is open, used or not. A holder of two pseudo-terminals with nothing else read 13.0 MB (*What was run*), before any output is kept. Every byte of output crosses two processes |
| B. Daemon per version | An endpoint, a hook socket and a state file for each generation, where the run folder holds one of each today. A window that attaches to several daemons and joins their lists, whose pane ids collide because each daemon counts from 1. A rule that retires a generation | A whole daemon for each generation, each with its own timers and its own keep-awake child. Orca's issue #9138 is this cost left unbounded |
| C. Resume by id | Reading `session_id` from the hook input that already arrives, a record of each pane in the run folder, a view that offers a pane whose process is gone, and a start that names such a pane. A check that the conversation runs in no other process | Bytes on disk while unused, and no process. Each resume starts a new process and reads the conversation again, whose time and tokens are not measured |
| D. tmux or zellij | Shipping tmux or asking the person to install it, since macOS does not include it. A socket and a configuration of Owlery's own, so the person's tmux is untouched. The pane's scrollback, its mouse and its key encodings then pass through a second terminal, which takes over what the daemon's replay buffer does today | The tmux server. Not measured, since none is installed here |
| E. Descriptor handover | A handover that the stopping daemon and the starting one both know. Adopted panes: reading works through Node's own stream, a resize needs node-pty's unpublished native call, and the adopting daemon is not the pane's parent, so it learns of the end without an exit code. Pane ids that go on across daemons. The same for the pipes of role sessions | Nothing while unused, and no process. A daemon of a build before the handover cannot hand over |
| F. Claude Code background sessions | A pane that starts `claude --bg` and then attaches. Whether Owlery's hook settings and the pane's environment reach such a session is not known | Claude Code's own supervisor, not measured. The sessions enter the person's own list of background agents. It serves Claude Code alone |

### The recommendation

One combination of three parts.

**Part 1. One daemon, never replaced under a running session.** The daemon keeps holding the pseudo-terminals and the role sessions, as today. An update of the app ends no daemon. The newer window attaches to the daemon the earlier build started and says so, as today. What changes is the daemon that runs nothing: where it holds no live pane and no working headless session, the app replaces it without a question at the window's next load. Such a replacement drops what the daemon's own idle exit drops today, the output of panes whose process has ended and the list of ended headless sessions. A daemon that holds either is replaced only on the person's word, through "Restart Daemon…", whose dialog names what runs. The daemon also writes one line into its log at each end, with why it ended and how many panes were alive and how many agents were working, and a start that finds the `daemon.json` of a daemon that no longer answers writes that the daemon before it ended without stopping. Those lines are the measurement part 3 waits for.

**Part 2. The conversation comes back by its session id, after any end of its process.** The daemon keeps a record of each pane in its run folder: its work item, its kind, its folder, and the session id of the latest hook event of the pane. The latest, because a person can move a pane to another conversation with `/resume`. After a restart of the daemon, a crash or a reboot, the work item's view offers the pane again, and on the person's word the daemon starts `claude --resume <session ID>` in the pane's folder. Before it does, it checks that no process still runs that conversation, because a process that ignores the hangup outlives its daemon (*What was run*), and `claude agents --json` lists the active sessions with their ids and process ids. A turn that was under way is cut, and the pane says so. For a role session the same idea holds one level up: the run starts the cut stage again from the records, which are committed, and issue #55 already asks for it after a restart of the daemon. Issue #61 holds the panes' part, in milestone 4. Until then `--continue` returns a Claude Code pane to the latest conversation of its folder.

**Part 3. Nothing holds the terminals apart from the daemon now.** Ways A, E and F each keep a working agent alive through a restart of the daemon. Parts 1 and 2 leave that restart to a person's choice and make it cost one cut turn for each working agent. What is not covered is a crash of the daemon while an agent works, and nobody has counted one. Way A's process is small beside an agent's, so its cost to run does not decide against it. Its cost is the second protocol and the second generation of processes to keep in step, for an event whose frequency is unknown. Way E costs nothing while unused and is the first to weigh, if the log lines of part 1 show restarts cutting working agents. It rests on two unpublished parts of node-pty. Way F is not built on until it has been run. Way B is ruled out: Owlery's kept daemon gives what it gives, with one daemon. Way D is ruled out as Owlery's own mechanism: it puts a second terminal between the agent and the pane and adds a program the person has to have. `docs/architecture.md` *Open decisions* gets a row for this decision and what decides it.

### What an update of the app does to a running agent

Under the recommendation:

- **A Claude Code pane or a shell pane keeps running.** Its process stays in the daemon the earlier build started. The updated app's window attaches to that daemon and says that it is of another build. Nothing ends until the person chooses "Restart Daemon…" or the last pane and the last headless session have ended, after which the window's next load replaces the daemon.
- **A role session, and the run it belongs to, keeps running** in the kept daemon, which goes on with the stages that follow on its own build. In the packaged app that needs the daemon's script and the role bundle to be read from files the update does not replace, which is issue #78's to build and to check.
- **After the restart a person chose,** each Claude Code pane is offered again and resumes its conversation on the person's word, a turn that was under way is cut and named as cut, and a run starts the cut stage again. A shell pane's process is gone.
- **Until the daemon is replaced, the updated app shows what the older daemon can do.** A feature that needs something the older daemon does not send is off, and the status line says why.

## User scenarios & acceptance *(mandatory)*

The scenarios are of the work item's own deliverables, since it builds no code.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The study compares the ways | Given issue #36's first *Done when* line, when a reader opens this file, then each way of the issue has a row for the window closed, the daemon restarted, the app updated and a reboot, a row of what it costs to build and to run, and a row of what it changes in the protocol and in the hooks | Read *The ways compared* and *Data & interfaces* against the ways the issue lists |
| 2. The study recommends one combination and says what an update does | Given the issue's second *Done when* line, when a reader opens *The recommendation* and *What an update of the app does to a running agent*, then one combination is named and the statement covers a pane and a role session | Read the two sections |
| 3. The policy documents carry the text in both languages | Given `frame/plan.md` *The text placed in the policy documents*, when the session has written it, then `docs/architecture.md` and `docs/architecture.ko.md` each hold the section *What a session survives*, and the two editions hold as many heading lines and as many table lines as each other | The document arm of the `Broad gate` key of `seal/config.json`, which the orchestrator runs. It compares, for each pair of editions, the count of lines that open with `#` and the count of lines that open with a table's bar |
| 4. Each part has an issue | Given the issue's third *Done when* line, when the session has opened the issue and posted the comments of `frame/plan.md` *The issues*, then part 1 has an issue of its own in the milestone named there, issues #61, #55 and #78 each carry the study's comment, and the pull request closes #36 | `gh issue view <number> --json title,milestone,comments` for each |
| 5. The carried row is not lost | Given the row the settle of release 0.0.1 carried to #36, when #36 closes, then the row stands as `frame/questions.md` Q1 with its default and its answerer | Read `frame/questions.md` |

## Data & interfaces

This work item changes no schema, no message and no hook. The table is the study's third comparison: what each way would change in the protocol between the daemon and its clients (`src/shared/protocol.ts`) and in the hooks Owlery receives (`src/daemon/hooks.ts`).

| Way | The protocol | The hooks |
|---|---|---|
| The recommendation, part 1 | No message and no field. The window already reads an absent field as a feature that is off. What is missing is an answer in the window to a request an older daemon ignores | None |
| The recommendation, part 2, which is way C | `PaneKindInfo` gains a feature that says a kind's panes can resume, beside `continues`. The lists the daemon sends gain the panes whose process is gone and which can resume. `start` gains a way to name such a pane. The session id crosses the protocol nowhere | No new event. The daemon reads `session_id` and `cwd` from the input of every event it already receives and keeps the latest. The pane's environment and the socket are as today, since a resumed pane is a new pane |
| A. Worker | The clients' protocol stays. A second protocol appears between daemon and worker | The pane's id in the pane's environment is fixed when the pane starts and must mean the same pane to the next daemon, so ids can no longer count from 1 in each daemon. Events sent while no daemon listens are lost, since the hook command exits 0 where the socket is gone, so a pane's state can be stale until its next event |
| B. Daemon per version | One connection for each generation, a `daemon.json` for each, and ids that name their generation | A hook socket for each generation |
| D. tmux or zellij | None | None in the events. The pane's command becomes tmux's, and the terminal the agent sees is tmux's |
| E. Descriptor handover | The clients' protocol stays where pane ids go on. A one-time handover appears between two daemons | The same two points as the worker's |
| F. Claude Code background sessions | None | Not known: whether `--settings` and the pane's environment reach a background session was not run |

## Rule changes

- nothing
  why: The work item's subject is the policy root. Its pull request writes `docs/architecture.md` and `docs/architecture.ko.md` directly, with the text of `frame/plan.md` *The text placed in the policy documents*. It adds a section and a table row and extends sentences in place, and it moves and renames no section, so no operation of an unsettled design needs re-pointing. The designs of `1795329620-role-bundle` and `1795268972-headless-failure-and-limit` name the sections *Options for launching Claude Code*, *What each session loads*, *Role sessions run detached from the user's environment*, *Taking in AgenticSeal's changes*, *Agent adapters* and *Memory design*, and this work edits none of them.

## Removes

- nothing
  why: The work takes no file, no unit of code, no rule and no test pin out of the tree. The sentences of `docs/architecture.md` it touches keep their words and gain a clause. It adds no gate, check, hook or mark. The log lines and the replacement of a daemon that runs nothing are the work of the issue `frame/plan.md` *The issues* opens, whose own frame names what they take out.

Framed 2026-11-22 by framer, before the build.
