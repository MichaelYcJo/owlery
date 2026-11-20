# Design: a Claude Code pane that continues the worktree's latest conversation (#94)

## Grounding

The tree as read at `30c2e59`. Every path without a folder is under `apps/desktop`. Each row says how its fact was reached: `read` for a file opened, `executed` for a command run.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *The phone: the terminal session as a chat*: "Hooks are added only to the sessions Owlery launches. The user's own settings files are not changed." (`read`) | The continuing pane gets its hooks the way the existing pane does, through `--settings <Owlery's file>`. Owlery writes nothing under `~/.claude/`. |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 and 2: the UI does not know which vendor's agent it shows, and a feature that differs by vendor is read from a feature list, never from a name (`read`) | The window learns that a kind of pane can continue a conversation from a field of the daemon's list of kinds. It names no kind. |
| `docs/architecture.md` *Overall layout*: "Agent state is judged from events, never guessed from what the terminal screen prints." (`read`) | Owlery does not read the pane's screen to learn whether a conversation was found. |
| `docs/architecture.md` *The phone: the terminal session as a chat*: the session log under `~/.claude/projects/` has no public format and is read "only as a supplement" (`read`) | Owlery does not open `~/.claude/projects/` to choose a conversation or to learn whether one exists. Claude Code chooses. |
| `docs/architecture.md` *Authentication of the Claude adapter*, row "Original screen": a role session is later opened in a terminal with `claude --resume <session ID>` (`read`) | *Scope* item 7 may keep a headless session's log off the disk. No code resumes a headless session at this commit: `git grep -n -e '--resume' -- apps/desktop/src` printed nothing and exited 1 (`executed`). The work that builds that row sets the flag as it needs. |
| `docs/product.md` *Foundation*: the session a person drives is "the agent's own CLI, launched as it is in a terminal pane" (`read`) | The pane runs the person's own `claude` with one more argument of the CLI's own. Owlery adds no conversation picker. |
| `docs/roadmap.md` *Milestones*, row 4: "Bringing in the sessions the CLI already has and resuming them, after a reboot as well" (`read`) | Resuming by a session's id, a list of earlier sessions and a resume without a click after a reboot are issue #61. This work is the way back until then. |
| `docs/README.md` does not exist (`executed`: `cat docs/README.md` failed) | The policy root has no index to pick a `file:` from. The `## Rule changes` below name `docs/architecture.md` and its Korean edition by their paths. |
| `src/daemon/hooks.ts:83-86`, `claudePaneCommand`; `src/daemon/main.ts:48-51`, `commandFor` (`read`) | One function builds the Claude Code pane's command, `exec claude --settings '<file>'` in the person's interactive login shell, and `commandFor` adds `OWLERY_PANE_ID` and `OWLERY_HOOK_SOCKET` to every pane. A continuing pane that goes through both keeps the hooks and the settings by construction. |
| `src/daemon/pane-kinds.ts:9-12`, `PANE_KINDS`; `src/shared/protocol.ts:7`, `PaneKind`, and `:23-27`, `PaneKindInfo` (`read`) | The kinds a client may open are a list the daemon sends in `ready`, each with a label and `reportsState`. |
| `src/renderer/work-item-view.ts:231-246`, `start` and `showPaneButtons` (`read`) | The "New pane" choices of a work item are one button per kind in `#pane-buttons`, labelled `+ <label>`, each sending `start` with the view's work item. |
| `src/renderer/view.ts:13-18`, `tabLabel`; `:21-23`, `agentKind`; `:31-33`, `lineSession`; `:302-305`, `daemonStatus`; `:353-358`, `stateSays`; `src/renderer/renderer.ts:282-283`, the form's menu of kinds (`read`) | These readers take a session's kind or the list of kinds. A second kind for the continuing pane would give it a tab name, a tab count and a state line of its own and put it in the "New work item" form, where a new worktree has no conversation. A pane of the existing kind `claude` changes none of them. |
| `src/daemon/daemon.ts:149-166`, `agentEvent`; `:424-437`, `startSession`; `:482-484`, `reportsState` (`read`) | A session's state is kept by its kind's `reportsState` and its pane id. A continuing pane of kind `claude` is listed, timed and shown in the inbox by the code a new one runs through. |
| `src/daemon/adapters/claude.ts:17-37`, `claudeArgs`, and `:159`, the spawn with `cwd`; `src/daemon/daemon.ts:336` (`read`) | The headless session of "Ask" runs `claude -p` in the work item's worktree and does not pass `--no-session-persistence`. |
| `claude --version` printed `2.1.329 (Claude Code)`. `claude --help` printed "-c, --continue  Continue the most recent conversation in the current directory" and "--no-session-persistence  Don't save sessions to disk; they can't be resumed (only works with --print)" (`executed` 2026-11-20, by the probe below) | The option exists in the installed version, and its help scopes it to the current directory. |
| Probe `test_tmp_continue.sh`, run once on 2026-11-20 under the framer's scratch directory, with `CLAUDE_CONFIG_DIR` and `HOME` set to folders of the probe's own (`executed`). The CLI was therefore not logged in, and nothing of the owner's `~/.claude/` was read or written. A temporary repository had two linked worktrees, `wt-a` and `wt-b`. | Claude Code 2.1.329 keeps a folder of conversations per working directory: `projects/` gained one folder named after each of `wt-a`, `wt-b` and the main checkout. With one conversation planted under `wt-a`'s folder alone, `claude -p --continue x` run in `wt-a` appended a line carrying the planted session's id to the planted file and wrote no new file. The same command in `wt-b` and in the main checkout each wrote a new file with a new session id, and neither file names the planted session. Every run ended "Not logged in · Please run /login", exit 1. |
| The same probe (`executed`) | It shows the print mode with a planted file. It does not show an interactive session with a real conversation. It also shows that a `-p` run writes its log into the working directory's folder, marked `"entrypoint":"sdk-cli"`, and that `-p --continue` in a folder with no conversation started a new session without a line saying so. What the interactive `--continue` does in each case is `frame/questions.md` Q1 to Q4. |
| The issue's comments (`executed` 2026-11-20: `gh issue view 94 --json body,comments` printed `"comments":[]`) | The issue's body is the whole request. |
| `seal/follow-up.md` does not exist. No changelog fragment under `seal/threads/` holds a `### Process changes` heading. `gh release view` printed "release not found" (`executed`) | No waiting item belongs in this scope, and no process change bears on it. |

## Scope

In scope, each item numbered for `frame/plan.md`:

1. **The measurement the issue asks for first.** In a temporary repository with two linked worktrees, a logged-in interactive `claude` is driven in a terminal, started as a pane starts it (`--settings <a hook settings file>`). What is seen is written with its date and the CLI's version into `trail/phases/phase-1.md`. It answers `frame/questions.md` Q1 to Q4: which conversation `--continue` opens in each worktree, what it prints and how it ends where the folder has none, whether it opens a `-p` session written after the conversation, and whether the hooks of `--settings` arrive from a continued session. The record names what the runs left under `~/.claude/projects/` and in `~/.claude.json`.
2. **A kind of pane declares that it can continue.** `PaneKindInfo` gains `continues`: whether a pane of the kind can start on the latest conversation of its folder. `PANE_KINDS` declares it `true` for `claude` and `false` for `shell`.
3. **A client asks for it at the start of a pane.** The `start` message gains the optional `continueLatest: true`. The daemon passes it to `commandFor`. It refuses, with the protocol's `error`, a `start` that asks it of a kind that does not declare `continues`. `createWorkItem` gains nothing, because a new worktree has no conversation.
4. **The command.** `claudePaneCommand` takes whether to continue and appends `--continue` after the settings argument: `exec claude --settings '<file>' --continue`. The pane's environment, its login shell and its settings file are those of every Claude Code pane.
5. **The choice in the window.** For each kind that declares `continues`, the pane bar of a work item's view shows one more button after the kind's own, labelled `+ <label> (continue)`, with the tooltip "Start on the latest conversation of this worktree". It sends `start` with that kind and `continueLatest: true`. A pure function `paneChoices` in `src/renderer/view.ts` gives the bar its choices, so a case reads them without a browser. A daemon of an earlier build sends no `continues`, and the window then shows no such button.
6. **Where the worktree has no earlier conversation,** the pane shows the line Claude Code prints and the daemon's own exit line, `[process exited with code <n>]` (`src/daemon/daemon.ts:450`). This item builds nothing where item 1 sees Claude Code say so and end, which is Q2's default. Where item 1 sees anything else, the orchestrator sends the finding to the framer before phase 2.
7. **Where item 1 sees `--continue` open a headless session's log** (Q3), `claudeArgs` gains `--no-session-persistence`, so that "Ask" leaves no conversation in the worktree's folder for a continuing pane to open. Where item 1 sees that it does not, this item builds nothing.
8. **The changelog fragment** `changelog.md` of this work item.

Out of scope:

- Resuming by a session's id, choosing among earlier conversations, and reopening panes without a click after the daemon is replaced or the Mac restarts: issue #61.
- Remembering a pane's `session_id` from its hooks. It is the first half of #61, and a stopgap that builds it is no longer a stopgap.
- A guard against continuing a conversation whose first pane still runs. Claude Code decides what two processes on one conversation do, as it does for a person who types `claude --continue` in a second terminal.
- Any read of `~/.claude/projects/` by Owlery.
- A continuing choice in the "New work item" form.
- The version of the release, which has already moved.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The choice is offered | Given the daemon's list of kinds. When a work item's view draws its pane bar. Then it offers `+ Shell`, `+ Claude Code` and `+ Claude Code (continue)`, in that order. | A case on `PANE_KINDS` in `test/pane-kinds.test.ts`, and cases on `paneChoices` in `test/view.test.ts`: a kind with `continues` gives two choices, a kind without gives one, and a kind with no `continues` field gives one. |
| 2. The continuing pane starts with Owlery's hooks | Given a work item. When the person presses `+ Claude Code (continue)`. Then the daemon starts, in the work item's worktree, the login shell with `exec claude --settings '<Owlery's file>' --continue`, with `OWLERY_PANE_ID` and `OWLERY_HOOK_SOCKET` set, and lists the pane as kind `claude`. | A case on `claudePaneCommand` in `test/hooks.test.ts`. A case in `test/daemon.test.ts`: a `start` with `continueLatest` and a work item hands `commandFor` the request to continue, runs in the worktree, and answers `started` with kind `claude`. One start of the built app (`frame/plan.md` phase 2) shows the button sending it. |
| 3. The existing pane is unchanged | When the person presses `+ Claude Code`. Then the command is `exec claude --settings '<file>'`, as before. | The cases of `claudePaneCommand` at `test/hooks.test.ts:182-195` pass unchanged, and a case in `test/daemon.test.ts`: a `start` without the field hands `commandFor` no request to continue. |
| 4. A kind that cannot continue is refused | When a client sends `start` with `continueLatest` for `shell`. Then the daemon answers `error` with the request's id and starts no pane. | A case in `test/daemon.test.ts`. |
| 5. The conversation is the worktree's own | Given two work items of one repository, each with a conversation. When a continuing pane opens in one. Then it shows that worktree's latest conversation and not the other's. | Item 1's measurement, written with its date and version in `trail/phases/phase-1.md`. |
| 6. No earlier conversation | Given a worktree where no conversation was held. When a continuing pane opens. Then the pane shows a line that says so, and its exit line. | Item 1's measurement, with the line quoted and the exit code. |
| 7. The inbox shows the state | Given a continuing pane. When its session sends a prompt's event, asks permission or ends a turn. Then the inbox shows working, waiting or finished on the work item's line. A pane that sends no event in the time after its start is shown waiting. | A case in `test/daemon.test.ts`: a pane started with `continueLatest` takes the state of an agent event sent for its id. Item 1's measurement shows the hooks arriving from a continued session. |

## Data & interfaces

- `src/shared/protocol.ts`, `PaneKindInfo`: `continues: boolean`. The window reads an absent field as `false`.
- `src/shared/protocol.ts`, `ClientMessage`, the `start` member: `continueLatest?: true`.
- `src/daemon/daemon.ts`, `DaemonOptions#commandFor`: `(kind: PaneKind, id: number, start: { continueLatest: boolean }) => PaneCommand`.
- `src/daemon/hooks.ts`, `claudePaneCommand(env, settingsFile, continueLatest = false)`.
- `src/renderer/view.ts`, `paneChoices(paneKinds): { kind: PaneKind; text: string; hint: string | null; continueLatest: boolean }[]`.
- `SessionInfo` and every server message are unchanged. No file Owlery keeps on disk changes shape.

## Rule changes

- add
  file: docs/architecture.md
  section: Options for launching Claude Code
  to: | `-c`, `--continue` | A Claude Code pane that the person starts on the latest conversation of the pane's folder, which is the worktree for a work item's pane. It is launched with Owlery's hook settings, as every Claude Code pane is. Read from `claude --help` in Claude Code 2.1.329 (2026-11-20). It is the way back to a conversation until sessions are resumed by their id (milestone 4 of [roadmap.md](roadmap.md#milestones)) |
- add
  file: docs/architecture.ko.md
  section: Claude Code를 띄우는 옵션
  to: | `-c`, `--continue` | 사용자가 pane의 폴더에서 가장 최근 대화를 이어서 시작하는 Claude Code pane. 작업 항목의 pane에서는 그 폴더가 worktree입니다. 다른 Claude Code pane과 같이 Owlery의 hook 설정으로 띄웁니다. Claude Code 2.1.329의 `claude --help`에서 확인했습니다(2026-11-20). 세션을 ID로 이어 실행하기 전까지(로드맵의 마일스톤 4, [roadmap.ko.md](roadmap.ko.md#마일스톤)) 대화로 돌아가는 길입니다 |

## Removes

- nothing
  why: the work adds a field, an argument and a button, and takes no code, rule or test pin out of the tree. It adds no gate, check, hook or mark, so nothing is owed in return.

Framed 2026-11-20 by framer, before the build.
