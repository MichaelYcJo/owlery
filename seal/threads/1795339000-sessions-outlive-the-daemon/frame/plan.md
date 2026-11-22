# Implementation Plan: how an agent's session survives the daemon and a reboot (study, #36)

## Technical context

The tree as read at `d00e544`. Every path below is under `apps/desktop/` unless it starts with `docs/` or `seal/`. The words "daemon", "pane", "role session", "run folder", "build" and "way" are used as `frame/design.md` defines them at its head.

The work item builds no code. Its pull request holds this frame, the text of *The text placed in the policy documents* in `docs/architecture.md` and `docs/architecture.ko.md`, and the orchestrator's records. The session also opens the issue and posts the comments of *The issues*.

The recommendation builds on four things the tree already has, each a row of `frame/design.md` *What the tree does today*.

- **One daemon for one run folder, which a person stops.** The app attaches to whatever daemon answers at `daemon.json` and stops it only from the menu (`src/main/daemon-client.ts#ensureDaemon`, `src/main/daemon-control.ts#daemonControl`).
- **A daemon of another build is told apart and named.** The build is in `daemon.json`, and the status line names "Restart Daemon…" (`src/main/daemon-client.ts#otherBuild`, `src/renderer/view.ts#daemonNotice`).
- **A window that reads what an older daemon does not send as absent.** `src/renderer/view.ts#daemonLists` and the `continues` field of `src/shared/protocol.ts` are the two places that do so today.
- **Hook events that already carry the session id.** They arrive at `src/daemon/daemon.ts#agentEvent`, which reads other fields of the same input.

What breaks in six months, for the combination recommended.

- **A kept daemon grows old.** A person who never closes a pane keeps the daemon of an old build for weeks, and no fix of the daemon reaches them. The status line says so at every load, so the failure is in view.
- **A newer window asks an older daemon for something it does not know.** The daemon ignores a message of an unknown type and answers nothing (`src/daemon/daemon.ts#handle`, `default`), so the window's request stays open. The issue of *The issues*, item 1, asks for the window's answer to it.
- **A development build rewrites the role bundle under a kept daemon.** `node build.mjs` writes `dist/` in place, and the daemon reads the bundle beside its script at each launch (`src/daemon/main.ts#main`). A kept daemon then launches a role session on a newer bundle. A launch whose session does not list the role's agent is failed in view, as the design of `1795329620-role-bundle` states. A launch on documents that only changed their text runs on. The packaged app is issue #78's (*The issues*, item 4).
- **A resume turns out to cost much.** A conversation older than the prompt cache is read again in full on a resume, and nobody has measured it (`docs/architecture.md` *Measure before building*). The recommendation resumes only on a person's word, so the cost is paid only where it was asked for, and issue #61 measures it.
- **The listing of active sessions changes its shape.** `claude agents --json` was read once, on Claude Code 2.1.330. Where the daemon cannot read it, the check before a resume has to refuse the resume and say so, not pass.
- **The daemon crashes under a working agent.** The turn is cut, and nothing in the recommendation prevents it. The log line of *The issues*, item 1, is what counts it.

## Alternatives considered

The table keeps the structure "the daemon holds the terminals" in row A and weighs the rows that replace it, B, C and F, as its equals.

| Approach | Failure scenario | Verdict |
|---|---|---|
| A. Keep one daemon as the holder, never replace it under a running session, replace it by itself once it runs nothing, and bring a conversation back by its session id | The failures of *Technical context* | Chosen. The premise that keeps the structure is that a window of another build can work against the kept daemon and says that it is another build. It was checked by reading `src/main/daemon-client.ts#otherBuild`, `src/renderer/view.ts#daemonNotice` and `src/renderer/view.ts#daemonLists` at `d00e544`, and `docs/architecture.md` *Overall layout* names the cases that hold it. The framer ran none of them |
| B. A worker process holds the terminals, and a new daemon adopts it (way A of the design) | The socket between daemon and worker is a second protocol. A worker of an older build must be adopted or drained by every newer daemon, so the problem of generations returns one level down. Role sessions are pipes and not terminals, so a restart still cuts the run, which is the work `docs/architecture.md` *Overall layout* keeps the daemon alive for. Hook events sent while no daemon listens are lost. The worker must run from files an update does not replace | Rejected for now. It buys a working agent's survival through a restart that row A leaves to a person's choice, and through a crash nobody has counted. Its process read 13.0 MB at the least (`frame/design.md` *What was run*), so its cost to run is not what decides. It stays an option of the row *The text placed in the policy documents* adds to *Open decisions* |
| C. The stopping daemon hands each descriptor to the next daemon (way E) | It rests on node-pty's unpublished `_fd` and native `resize`, which an update of node-pty can change without notice. The adopting daemon is not the pane's parent and gets no exit code. A daemon of a build before the handover cannot hand over. A crash is not covered | Not built now. It costs nothing while unused and the probe showed a pane living through it, so it is the first to weigh where the log shows restarts cutting working agents |
| D. A daemon for each protocol version (way B) | Each generation is a whole daemon, the run folder's state has one writer today, and a generation nobody retires keeps its agents running unseen, as Orca's issue #9138 reports | Rejected. Row A already keeps a session through an update, with one daemon |
| E. tmux or zellij under each pane (way D) | macOS does not include tmux, so Owlery ships it or the person installs it. A second terminal takes the pane's scrollback and key encodings, and the daemon's replay buffer no longer holds what the pane showed | Rejected as Owlery's own mechanism. A person can run tmux inside a shell pane |
| F. Claude Code's background sessions hold the agent (way F) | Whether Owlery's hooks reach such a session is not known, the sessions enter the person's own list of background agents, and no other CLI has the feature, so pane kinds would differ in what they survive | Not built on. `frame/questions.md` Q2 holds what has to be run first |
| G. Resume alone: replace the daemon at every update and let each conversation come back by its id | Every update cuts every turn under way, ends every shell pane's process, and pays a resume for every Claude Code pane, whose cost is not measured | Rejected. An update that cuts work breaks the first sentence of `docs/architecture.md` *Overall layout* |
| H. The daemon sets each pane's session id in advance with `--session-id` and reads no hook for it | A person moves a pane to another conversation with `/resume`, and the id set in advance then names a conversation the pane no longer shows. The hook events are needed all the same | Rejected for panes. The id is read from the latest hook event, one source |
| I. A run cut by the daemon's end resumes the cut stage's session by its id | The resume of a role session pays for the conversation again, and a stage cut in the middle of an edit resumes on a tree the cut left half changed | Left to issue #55, with the default that the cut stage starts again from the committed records, as a stage always starts fresh (`docs/architecture.md` *State lives in three places*) |
| J. The check before a resume reads the pane's recorded process id and not Claude Code's listing | A process id is reused after a reboot, so a recorded id can name another process | Left to the work of issue #61. `claude agents --json` gives the session id beside the process id and is the default |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1, 2 and 5 of `frame/design.md`. The frame is the study, so the commit that adds the frame closes the phase | Scenarios 1, 2 and 5 of `frame/design.md` *User scenarios & acceptance*, read by the sealer against issue #36 | |
| 2 | *Scope* item 4: the session opens the issue of *The issues*, item 1, in its milestone, and posts the comments of items 2 to 4 | `gh issue view <number> --json title,milestone,comments` for the new issue and for #61, #55 and #78 shows the title, the milestone and the comment | |
| 3 | *Scope* item 3: the session writes the text of *The text placed in the policy documents* into both editions, with the number of the issue phase 2 opened in place of the token `DAEMON-ISSUE` | The document arm of the `Broad gate` key of `seal/config.json`, run by the orchestrator, passes. `git grep -n 'DAEMON-ISSUE' -- docs README.md README.ko.md` prints nothing: at `d00e544` it prints nothing, since the token enters `docs/` only with this phase, and its pathspec leaves out `seal/`, where this frame quotes the token. The search fails where the token is left: it prints that line | Built in the commit that adds `trail/phases/phase-3.md` |

Phase 2 comes before phase 3 because the text names the new issue by its number.

## The issues

Each part of the recommendation (`frame/design.md` *The recommendation*) has its home here. Part 1 gets a new issue. Part 2 is already held by issues #61 and #55, and the update that part 1 serves by issue #78, so each of those gets a comment and no second issue. Part 3 builds nothing and is a row of `docs/architecture.md` *Open decisions*.

### 1. The issue to open, for part 1

Title: `feat: a daemon of another build stays until a person restarts it, even when it runs nothing, and nothing records what a daemon's end cut`

Milestone: `release: 0.0.3`, which is milestone 3 of `docs/roadmap.md` *Milestones*. The owner starts each new build over the daemon of the build before (`docs/roadmap.md` *Releases and the tracker*, "Each milestone has to be in effect before the next one's work starts"), and milestone 3 is where a person answers once and walks away, so a run has to outlive the start of a newer build. The work touches `src/main/daemon-client.ts`, `src/main/main.ts` and the daemon's stop, apart from the chain that release 0.0.2 builds.

Body:

```
For milestone 3 of v0.1 (docs/roadmap.md, Milestones row 3). A part of the recommendation of #36's study (docs/architecture.md *What a session survives*).

The study keeps one daemon and never replaces it under a running session, so an update of the app ends no agent. Two things are missing for that to be the whole answer.

When the app of a newer build starts, it attaches to the daemon the earlier build left and the status line names "Restart Daemon…". It does so even where that daemon holds no live pane and no working headless session, where replacing it would cut nothing. And where a newer window asks such a daemon for something it does not know, the daemon ignores the message and the window's request stays open.

Nothing records how a daemon ended or what ended with it. Whether Owlery should ever hold the terminals apart from the daemon (docs/architecture.md *Open decisions*) is decided on how often a restart or a crash cuts a working agent, and nobody can count that today.

## Done when

- A load of the window that finds a daemon of another build with no live pane and no working headless session replaces it with the daemon of the running build, without a question, and the status line then shows no notice of another build.
- A daemon of another build that holds a live pane or a working headless session is kept, nothing in it is ended, and the status line names "Restart Daemon…" as it does today.
- A request of the window that a kept daemon of another build does not answer ends in the window with a sentence that names "Restart Daemon…". Nothing in the window waits for that answer without end.
- The daemon writes one line into its log when it stops: what stopped it (a signal, its own idle exit or an error), how many panes were alive, and how many agents were working. A start that finds the `daemon.json` of a daemon that no longer answers writes one line saying that the daemon before it ended without stopping. The lines hold counts and no prompt, path or title.
- Cases hold each line above with stand-in daemons and the fixture panes, and none starts a real `claude`.
- docs/architecture.md *What a session survives* and its Korean edition say what was built, where it differs from the study's text.
```

### 2. The comment on issue #61, for part 2's panes

Issue #61 is in `release: 0.0.4`, milestone 4, and stays there.

```
From the study of #36 (docs/architecture.md *What a session survives*; the grounds are in the frame of work item 1795339000-sessions-outlive-the-daemon). The study recommends this issue's resume as the way a conversation comes back after any end of its process, and asks four things of it beyond the *Done when* above.

- **Every end of the daemon, not a reboot alone.** The record of a pane is kept so that the work item's view offers the pane again after a restart a person chose and after a crash of the daemon as well.
- **The latest id.** Every hook event carries `session_id`, and a person can move a pane to another conversation with `/resume`, so the daemon keeps the id of the pane's latest event. No source file reads `session_id` today.
- **No conversation in two processes.** Before a resume the daemon checks that no process still runs that conversation, and where it cannot tell it does not resume and says so. A process that ignored the hangup of its terminal outlived its holder in the study's probe (2026-11-22, with a stand-in for the agent). `claude agents --json` of Claude Code 2.1.330 starts no session and lists each active one with `sessionId`, `pid`, `cwd` and `status`.
- **A cut turn is named.** A pane whose agent was working when its process ended says after the resume that its turn was cut.

Three things the study could not run, because it started no real `claude`. The first real session of this issue's work answers them:

- whether the process of a Claude Code pane ends when its daemon stops (the row the settle of release 0.0.1 carried to #36);
- whether the hook events of a subagent carry the pane's own `session_id`;
- whether Owlery's hook settings and a pane's environment reach a session started with `claude --bg`, which docs/architecture.md *Open decisions* lists as a way not built on.

`claude --help` of 2.1.330 says that `--fork-session` creates a new id at a resume, so a plain `--resume` keeps the id.
```

### 3. The comment on issue #55, for part 2's runs

Posted as below; review round 2 found its first line assumes a role session's process ends at a crash, which was not run, and the orchestrator posted the correction on #55 the same day (the daemon that starts next checks that the earlier stage's process no longer runs in the worktree before it picks the run up).

Issue #55 is in `release: 0.0.3`, milestone 3, and stays there.

```
From the study of #36 (docs/architecture.md *What a session survives*). This issue's line "after a restart of the daemon it continues from the last finished stage" is the part of the study's recommendation for a run of the process. The study reads it as follows.

- A crash of the daemon and a restart of the Mac count as a restart of the daemon: the run's progress is kept in the daemon's run folder, and the daemon that starts next picks the run up without a person.
- The stage that was cut starts again from the committed records, as every stage starts fresh. Resuming the cut stage's session by its id is the alternative, and it waits for the measurement of a resume's time and tokens that #61 makes.
- The cost of the cut stage is recorded as a cut stage's, apart from the stage that replaced it.
- An update of the app cuts no stage: the daemon the earlier build started keeps running the run, and it is replaced only once it runs nothing or on the person's word.
```

### 4. The comment on issue #78, for the update

Issue #78 is in `release: 0.1.0`, milestone 5, and stays there. Its line "An update with a chain running and a terminal session open behaves as #36 recommended" is answered by this text.

```
What #36's study recommends for an update (docs/architecture.md *What a session survives*):

- **An update ends no daemon.** A Claude Code pane, a shell pane and a role session with its run keep running in the daemon the earlier version started. The updated app's window attaches to that daemon and says that it is of another build.
- **The daemon is replaced once it runs nothing, or on the person's word.** With no live pane and no working headless session it is replaced at the window's next load, without a question, which the issue the study opened for release 0.0.3 builds. Otherwise the person chooses "Restart Daemon…", whose dialog names what runs. That is this issue's "an older daemon is not left running by accident": a daemon of an older version runs only while it holds something a person started, and the status line says so.
- **After the restart** a Claude Code pane resumes its conversation by its session id on the person's word (#61), and a run starts the cut stage again (#55).

What this asks of the package. A daemon kept through an update goes on opening panes and launching role sessions, so what it reads after the update has to be of its own build: its script, node-pty's native files and the role bundle. Both products the terminal research read start the process that outlives the app from a copy outside the folder the updater replaces. Whether a daemon started from inside the app's folder keeps working after the updater replaced that folder was not run, since no package exists. This issue's work answers it by updating a packaged app under a live pane and a working headless session, and starts the daemon from a copy named by its build where the answer is no.
```

## The text placed in the policy documents

The session writes the edits below into each edition, numbered the same in both. Each edition holds the token `DAEMON-ISSUE` in its edit 2, and phase 3 replaced it there with #133, the issue phase 2 opened, and the blocks below now hold #133. The blocks were synced to the documents after review rounds 1 and 2 by the orchestrator (2026-11-22), so they hold the text the pull request places. Both editions gain the same heading line and the same table lines, so the document arm of the broad gate holds.

### `docs/architecture.md`

Edit 1, in *Overall layout*, the first bullet under the diagram. The bullet gains a sentence at its end.

```
- **The daemon stays alive while the app restarts or updates.** This keeps work from being cut off when a review round runs long. What ends a session, and what brings it back, is in [What a session survives](#what-a-session-survives).
```

Edit 2, a new section between the last line of *Overall layout* and the heading `## Agent adapters`.

```
## What a session survives

**A session's process lives as long as the daemon that started it, and its conversation outlives both.** The daemon holds each pane's pseudo-terminal and each role session's pipes. So closing the window or quitting the app ends nothing, and the end of the daemon ends every process it started that takes the hangup of its terminal. Whether a Claude Code pane takes it has not been run, and the first real session of issue #61's work answers it. A role session has no terminal and leads a process group of its own. A stop of the daemon signals it and waits for its end, and whether it ends when the daemon crashes has not been run. Owlery does not keep those processes alive past their daemon. It keeps the daemon alive under them, and it brings the conversation back where the process is gone. The table says what each event does once the two rules below it are built, and each rule names the issue that builds it.

| What happens | A pane's process | A role session | What brings the work back |
|---|---|---|---|
| The window closes, or the app quits | Lives | Lives | Nothing is needed |
| The app is updated | Lives, in the daemon the earlier build started | Lives, and its run goes on | Nothing is needed. The daemon is replaced once it runs nothing, or on the person's word |
| A person chooses "Restart Daemon…" | Ends, after the dialog named it | Ends, after the dialog named it | A Claude Code pane resumes its conversation on the person's word, and a run starts the cut stage again |
| The daemon crashes, or the Mac restarts | Ends | Ends with the Mac. After a crash of the daemon, not run | The same |

**An update of the app ends no session: the daemon an earlier build started keeps running, and it is replaced only once it runs nothing or on the person's word.** The window of the newer build attaches to that daemon, and the status line says that it is of another build ([Overall layout](#overall-layout)). A daemon that holds no live pane and no working role session is replaced at the window's next load, without a question. What goes with it is what its own exit lets go: the output of panes whose process has ended, and the list of role sessions that ended. A daemon that holds either is kept until the person chooses "Restart Daemon…", whose dialog names what runs. Replacing it sooner would cut an agent in the middle of a turn, and a cut turn is work that a person has to notice and ask for again. Until its daemon is replaced, the newer build shows what the older daemon can do: the window reads a field the daemon does not send as a feature that is off. A kept daemon goes on reading its own build's script, node-pty's native files and the role bundle, so the packaged app runs it from files the update does not replace, and issue #78 builds and checks that. The daemon writes one line into its log when it stops, with why it stopped, how many panes were alive and how many agents were working. A daemon that crashed writes nothing, so the daemon that starts after it writes that the one before it ended without stopping. Issue #133 builds the replacement and the log lines in milestone 3, and issue #78 builds the update itself in milestone 5 ([Milestones](roadmap.md#milestones)).

**A conversation comes back by its session id, after any end of its process.** The daemon keeps a record of each pane in its run folder: its work item, its kind, its folder, and the session id that its agent's hook events carry. It keeps the latest id, because a person can move a pane to another conversation, as Claude Code's `/resume` does. After a restart of the daemon, a crash or a restart of the Mac, the work item's view offers the pane again, and on the person's word the daemon starts the agent's CLI on that conversation, which is `claude --resume <session ID>` for Claude Code. The process is new, so a turn that was under way is cut, and the pane says so. Before it resumes, the daemon checks that no process still runs that conversation: a process that ignores the hangup of its terminal outlives the daemon (probed 2026-11-22 with a stand-in for the agent), and one conversation is not opened in two processes. The id stays in the daemon. The protocol carries only that a kind of pane can resume ([Rules that keep it portable](#rules-that-keep-it-portable)). A shell pane has no conversation, and its process is not brought back. A run of the AgenticSeal process that the daemon's end cut starts the cut stage again from the records, which are committed. Issue #61 builds the panes' part in milestone 4, and issue #55 the run's part in milestone 3. Until then a Claude Code pane returns to the latest conversation of its folder with `--continue` ([Options for launching Claude Code](#options-for-launching-claude-code)).

**Nothing holds the terminals apart from the daemon.** The ways below each keep a working agent alive through a restart of the daemon, which the two rules above leave to a person's choice. Each adds something that has to be kept in step with the daemon from build to build. They were weighed on 2026-11-22, and the decision is a row of [Open decisions](#open-decisions).

| Way | What it keeps that the two rules do not | What it costs | Decision |
|---|---|---|---|
| A process of its own that holds the terminals, which a new daemon adopts | A working agent, through a restart of the daemon and through its crash | A process that runs while any pane is open. One that held two pseudo-terminals and nothing else read 13.0 MB of macOS `phys_footprint` (probed 2026-11-22). A second protocol, between the daemon and that process, with versions of its own. Role sessions are no terminals and stay with the daemon | Not built |
| Handing each terminal's descriptor to the next daemon | A working agent, through a restart a person chose, and not through a crash | No process while unused. A handover both builds know, pane ids that go on from one daemon to the next, and a resize on a descriptor node-pty did not open, which node-pty 1.1.0 does not publish. A stand-in pane outlived its holder, and a process that inherited the pane's descriptor from the holder read the pane and resized it, and the pane took the new size (probed 2026-11-22). A handover to a daemon the stopping one did not start was not run | Not built. The first to weigh |
| A daemon for each version of the protocol | A session through an update, which the kept daemon already gives | A whole daemon for each generation, and the state one run folder holds once | Ruled out |
| tmux or zellij under each pane | The same as the process of its own | A program macOS does not include, and a second terminal between the agent and the pane, which takes over the pane's scrollback and needs settings of its own for Shift+Enter and for notifications | Ruled out. A person can run tmux inside a shell pane |
| Claude Code's own background sessions (`claude --bg`, `claude attach`) | A Claude Code session through a restart or a crash of the daemon, which the study expects from `claude --help` of 2.1.330 and did not run | It serves Claude Code alone. Whether Owlery's hook settings reach such a session is not known, and the session enters the person's own list of background agents | Not built, and not run |
```

Edit 3, in *State lives in three places*, the table's row of the daemon. Its second cell gains an item.

```
| The daemon | Progress, session events and output, each pane's record with the id of its conversation, the cost ledger, questions and answers, schedule | They change often, and there is no reason to commit them to the repository |
```

Edit 4, in *Open decisions*, a new last row of the table.

```
| Holding the terminals apart from the daemon | Nothing, as now / hand each terminal's descriptor to the next daemon / a process of its own that holds them / Claude Code's own background sessions | How often the daemon's log shows a restart that ended a working agent, and how often it shows a crash, what a resume costs in time and tokens once it is measured, and whether a background session of Claude Code carries Owlery's hooks ([What a session survives](#what-a-session-survives)) |
```

### `docs/architecture.ko.md`

Edit 1, in *전체 구성*, the first bullet under the diagram.

```
- **데몬은 앱이 재시작하거나 업데이트되는 동안에도 살아 있습니다.** 리뷰 회차가 길어져도 작업이 끊기지 않게 하려는 것입니다. 세션을 끝내는 것과 세션을 되살리는 것은 [세션이 견디는 것](#세션이-견디는-것)에 적습니다.
```

Edit 2, a new section between the last line of *전체 구성* and the heading `## 에이전트 어댑터`.

```
## 세션이 견디는 것

**세션의 프로세스는 그것을 띄운 데몬이 사는 동안 살고, 세션의 대화는 둘보다 오래 남습니다.** 데몬은 칸마다 가상 터미널을, 역할 세션마다 파이프를 쥡니다. 그래서 창을 닫거나 앱을 끝내도 아무것도 끝나지 않고, 데몬이 끝나면 데몬이 띄운 프로세스 가운데 터미널이 끊기는 신호에 끝나는 것은 모두 끝납니다. Claude Code 칸이 그 신호에 끝나는지는 아직 돌려 보지 않았고, 이슈 #61 작업의 첫 실제 세션이 답합니다. 역할 세션은 터미널이 없고 자기 프로세스 그룹을 따로 이끕니다. 데몬이 멈출 때는 신호를 보내고 끝나기를 기다리지만, 데몬이 죽을 때 역할 세션이 끝나는지는 돌려 보지 않았습니다. Owlery는 그 프로세스를 데몬보다 오래 살려 두지 않습니다. 프로세스 밑의 데몬을 살려 두고, 프로세스가 사라진 곳에서는 대화를 되살립니다. 아래 표는 그 밑의 두 규칙을 만든 뒤에 일마다 어떻게 되는지를 적은 것이고, 규칙마다 그것을 만드는 이슈를 밝힙니다.

| 일어나는 일 | 칸의 프로세스 | 역할 세션 | 작업을 되살리는 것 |
|---|---|---|---|
| 창을 닫거나 앱을 끝냄 | 삽니다 | 삽니다 | 필요 없습니다 |
| 앱을 업데이트함 | 이전 빌드가 띄운 데몬 안에서 삽니다 | 살고, 그 실행도 이어집니다 | 필요 없습니다. 데몬은 아무것도 돌리지 않게 된 뒤에, 또는 사람이 시킬 때 바꿉니다 |
| 사람이 "Restart Daemon…"을 고름 | 대화 상자가 이름을 보여 준 뒤에 끝납니다 | 대화 상자가 이름을 보여 준 뒤에 끝납니다 | Claude Code 칸은 사람이 시키면 대화를 이어 가고, 실행은 끊긴 단계를 다시 시작합니다 |
| 데몬이 죽거나 Mac이 다시 시작됨 | 끝납니다 | Mac과 함께 끝납니다. 데몬이 죽은 뒤에는 돌려 보지 않았습니다 | 위와 같습니다 |

**앱을 업데이트해도 세션은 끝나지 않습니다. 이전 빌드가 띄운 데몬은 계속 돌고, 아무것도 돌리지 않게 된 뒤에나 사람이 시킬 때에만 바꿉니다.** 새 빌드의 창은 그 데몬에 붙고, 상태 줄은 데몬이 다른 빌드의 것이라고 알립니다([전체 구성](#전체-구성)). 살아 있는 칸도 일하는 역할 세션도 없는 데몬은 창이 다음에 페이지를 읽을 때 묻지 않고 바꿉니다. 그때 함께 사라지는 것은 데몬이 스스로 끝날 때 놓는 것과 같습니다. 프로세스가 끝난 칸의 출력과 끝난 역할 세션의 목록입니다. 둘 중 하나라도 쥔 데몬은 사람이 "Restart Daemon…"을 고를 때까지 그대로 두고, 그 대화 상자는 무엇이 돌고 있는지 이름으로 보여 줍니다. 그보다 먼저 바꾸면 에이전트가 턴 도중에 끊기고, 끊긴 턴은 사람이 알아채고 다시 시켜야 하는 일이 됩니다. 데몬을 바꾸기 전까지 새 빌드는 이전 데몬이 할 수 있는 것만 보여 줍니다. 창은 데몬이 보내지 않는 필드를 꺼진 기능으로 읽습니다. 그대로 둔 데몬은 자기 빌드의 스크립트와 node-pty의 네이티브 파일, 역할 묶음을 계속 읽으므로, 패키지된 앱은 업데이트가 바꾸지 않는 파일에서 데몬을 돌리고, 이것은 이슈 #78이 만들고 확인합니다. 데몬은 멈출 때마다 로그에 한 줄을 씁니다. 왜 멈췄는지, 살아 있던 칸이 몇이고 일하던 에이전트가 몇인지를 적습니다. 죽은 데몬은 아무것도 쓰지 못하므로, 그다음에 뜨는 데몬이 앞의 데몬이 멈추지 않고 끝났다고 씁니다. 이 교체와 로그 줄은 이슈 #133이 마일스톤 3에서 만들고, 업데이트 자체는 이슈 #78이 마일스톤 5에서 만듭니다([마일스톤](roadmap.ko.md#마일스톤)).

**대화는 프로세스가 어떻게 끝났든 세션 ID로 되살립니다.** 데몬은 칸마다 기록을 실행 폴더에 둡니다. 그 칸의 작업, 종류, 폴더, 그리고 에이전트의 훅 이벤트에 실려 오는 세션 ID입니다. ID는 가장 나중 것을 둡니다. 사람이 Claude Code의 `/resume`처럼 칸을 다른 대화로 옮길 수 있기 때문입니다. 데몬이 다시 시작했거나 죽었거나 Mac이 다시 시작된 뒤에는 그 작업의 화면이 칸을 다시 내놓고, 사람이 시키면 데몬이 에이전트의 CLI를 그 대화에서 시작합니다. Claude Code에서는 `claude --resume <세션 ID>`입니다. 프로세스는 새것이므로 하던 턴은 끊기고, 칸이 그렇게 알립니다. 이어 가기 전에 데몬은 그 대화를 아직 돌리는 프로세스가 없는지 확인합니다. 터미널이 끊기는 신호를 무시하는 프로세스는 데몬보다 오래 살고(2026-11-22에 에이전트 대신 세운 프로세스로 실험), 한 대화를 두 프로세스에서 열지 않기 때문입니다. ID는 데몬 안에만 둡니다. 프로토콜에는 그 종류의 칸이 이어 갈 수 있다는 것만 싣습니다([이식할 수 있게 지키는 규칙](#이식할-수-있게-지키는-규칙)). 셸 칸에는 대화가 없고, 그 프로세스는 되살리지 않습니다. 데몬이 끝나면서 끊긴 AgenticSeal 프로세스의 실행은 커밋된 기록에서 끊긴 단계를 다시 시작합니다. 칸 쪽은 이슈 #61이 마일스톤 4에서, 실행 쪽은 이슈 #55가 마일스톤 3에서 만듭니다. 그때까지 Claude Code 칸은 `--continue`로 그 폴더의 가장 최근 대화로 돌아갑니다([Claude Code를 띄우는 옵션](#claude-code를-띄우는-옵션)).

**터미널을 데몬과 따로 쥐는 것은 두지 않습니다.** 아래 방법은 저마다 데몬이 다시 시작해도 일하던 에이전트를 살려 두는데, 위의 두 규칙은 그 재시작을 사람의 선택으로 남깁니다. 방법마다 빌드가 바뀔 때 데몬과 맞춰 가야 하는 것이 하나씩 더 생깁니다. 2026-11-22에 따져 본 결과이고, 이 결정은 [결정을 남겨 둔 것](#결정을-남겨-둔-것)의 한 줄입니다.

| 방법 | 두 규칙이 지키지 못하는 것 가운데 지키는 것 | 드는 것 | 결정 |
|---|---|---|---|
| 터미널을 쥐는 프로세스를 따로 두고, 새 데몬이 그것을 넘겨받음 | 데몬이 다시 시작하거나 죽어도 일하던 에이전트 | 칸이 하나라도 열려 있는 동안 도는 프로세스입니다. 가상 터미널 둘만 쥔 프로세스가 macOS `phys_footprint`로 13.0 MB였습니다(2026-11-22 실험). 데몬과 그 프로세스 사이에 버전을 따로 갖는 둘째 프로토콜이 생깁니다. 역할 세션은 터미널이 아니라서 데몬에 남습니다 | 만들지 않습니다 |
| 터미널의 디스크립터를 다음 데몬에 넘김 | 사람이 고른 재시작에서 일하던 에이전트. 데몬이 죽을 때는 지키지 못합니다 | 쓰지 않는 동안에는 프로세스가 없습니다. 두 빌드가 함께 아는 넘겨주기, 데몬이 바뀌어도 이어지는 칸 ID, 그리고 node-pty가 열지 않은 디스크립터의 크기 바꾸기가 필요하고, 마지막 것은 node-pty 1.1.0이 공개하지 않습니다. 대신 세운 칸은 그것을 쥐던 프로세스가 끝난 뒤에도 살았고, 그 프로세스에게서 칸의 디스크립터를 물려받은 프로세스가 칸을 읽고 칸의 크기를 바꿨으며, 칸은 새 크기를 받았습니다(2026-11-22 실험). 멈추는 데몬이 띄우지 않은 데몬에 넘기는 것은 돌려 보지 않았습니다 | 만들지 않습니다. 먼저 따져 볼 방법입니다 |
| 프로토콜 버전마다 데몬을 하나씩 둠 | 업데이트를 넘는 세션. 그대로 둔 데몬이 이미 지킵니다 | 세대마다 데몬 하나가 통째로 들고, 실행 폴더가 하나만 갖는 상태를 세대마다 나눠야 합니다 | 쓰지 않습니다 |
| 칸마다 tmux나 zellij를 밑에 둠 | 따로 둔 프로세스와 같습니다 | macOS에 들어 있지 않은 프로그램이 필요합니다. 에이전트와 칸 사이에 터미널이 하나 더 끼어 칸의 스크롤백을 가져가고, Shift+Enter와 알림에 따로 설정이 필요합니다 | 쓰지 않습니다. 사람은 셸 칸 안에서 tmux를 돌릴 수 있습니다 |
| Claude Code의 자체 백그라운드 세션(`claude --bg`, `claude attach`) | 데몬이 다시 시작하거나 죽어도 Claude Code 세션. 2.1.330의 `claude --help`를 읽고 그렇게 될 것으로 보았을 뿐 돌려 보지 않았습니다 | Claude Code에서만 됩니다. Owlery의 훅 설정이 그 세션에 닿는지 모르고, 그 세션은 사람의 백그라운드 에이전트 목록에 들어갑니다 | 만들지 않습니다. 돌려 보지 않았습니다 |
```

Edit 3, in *상태는 세 곳에 둡니다*, the table's row of the daemon.

```
| 데몬 | 진행 상태, 세션 이벤트와 출력, 칸마다 그 대화의 ID를 담은 기록, 비용 장부, 질문과 답, 일정 | 자주 바뀌고, 저장소에 커밋할 이유가 없기 때문입니다 |
```

Edit 4, in *결정을 남겨 둔 것*, a new last row of the table.

```
| 터미널을 데몬과 따로 쥘 것인가 | 지금처럼 두지 않음 / 터미널의 디스크립터를 다음 데몬에 넘김 / 터미널을 쥐는 프로세스를 따로 둠 / Claude Code의 자체 백그라운드 세션 | 데몬의 로그에 재시작이 일하던 에이전트를 끊은 일과 데몬이 죽은 일이 얼마나 자주 나오는가, resume의 시간과 토큰을 잰 값이 얼마인가, Claude Code의 백그라운드 세션에 Owlery의 훅이 닿는가([세션이 견디는 것](#세션이-견디는-것)) |
```

The docs name no other product today (`git grep -n -i -e orca -e paseo -e cmux d00e544 -- docs README.md README.ko.md` prints nothing, `executed`), so the text names the two products of the research by what they do and not by name.

## Overlap with the release

The spawn names no other open work item of the release, and `gh pr list --state open` listed no open pull request on 2026-11-22 (`executed`). The text of this work edits *Overall layout*, *State lives in three places* and *Open decisions* of `docs/architecture.md` and adds a section. A work item of the release that edits one of those sections in the same lines meets this one at the merge, and the item that merges second merges the release branch into its own branch first.

## Operational impact

None for a deployer: the pull request changes no code, no dependency and no setting. It moves no version, since the first pull request of the release moved it (`docs/roadmap.md` *Releases and the tracker*). The pull request closes issue #36, and the issue this work opens belongs to `release: 0.0.3`.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
| 2026-11-22 | Adopt the study's recommendation whole; Q5 stands at its default (#61 stays whole in `release: 0.0.4`); phase 2 done by the orchestrator: issue #133 opened in `release: 0.0.3`, the comments posted on #61, #55 and #78; `DAEMON-ISSUE` is #133 | The owner's answer of 2026-11-22 to adopt #36's recommendation and open its issues; the owner's rule of 2026-11-22 that no question holds the run, decided from the code and the policy and recorded; milestone order is `docs/roadmap.md` *Milestones* as it stands | `docs/roadmap.md` *Milestones*; the plugin's `skills/implement/orchestration.md` *Under agentic* |
| 2026-11-22 | Fold rounds 1 and 2 into the frame: the text blocks are synced to the documents as the fix passes left them, the design's row A and the #55 comment say what was not run at a crash, and the correction is posted on #55. The fix pass's phase record `fix-1.md` was asked for by the orchestrator in error and removed; round 1's answers that name it point at these synced blocks | Review rounds 1 and 2; the plugin's `skills/implement/fix-pass.md` (a fix pass writes no phase record) | the plugin's `skills/implement/orchestration.md` *A decision made after the frame is committed is folded* |
