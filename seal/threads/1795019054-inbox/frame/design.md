# Design: the inbox

The ticket is issue #7.

## Grounding

The tree as read at `1abd9ef`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/product.md` *Foundation*, first paragraph | The inbox is the first screen; each work item shows its state on one line |
| `docs/product.md` *Foundation*, "The app reads only what the inbox needs" | Working, waiting for the person or finished, from the CLI's hooks; new commits on the branch, from git |
| `docs/architecture.md` *Overall layout*, "Agent state is judged from events, never guessed from what the terminal screen prints" | State comes from the neutral agent events alone; a CLI whose hooks are not checked shows only whether its branch changed |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 and 2 | The window does not know which vendor a pane runs: it reads the kinds of pane the daemon offers, with their labels, and draws buttons and tab labels from them |
| `seal/threads/1795015072-daemon/gaps.md` *Not done* | Closing a pane, and the window branching on the kind `claude`, were handed to this work |
| `seal/threads/1795016925-work-items/gaps.md` *Not done* | Opening a pane from the list (after a restart too), and telling other clients of a new work item, were handed to this work |

## Scope

1. **Agent state per session**, kept by the daemon: `working` after `prompt`, `tool-start`, `tool-end` or `tool-failed`; `waiting` after `permission` or `notification`; `finished` after `turn-end`; `null` after `session-start`, until the first event, and for a pane kind that reports no agent events. A session that has exited is `alive: false`, whatever its last state. The mapping is a pure function of the last event, in a module of its own.
2. **New commits per work item**: a work item records the commit its branch started from (`baseCommit`) when it is created. The daemon reads, for every work item, the number of commits on its branch after `baseCommit` (`git rev-list --count <baseCommit>..refs/heads/<branch> --` in the repository, the full ref name so a tag or a file of that name is not read instead), at most every 3 seconds, and only while a client is connected. A work item from before this field has `baseCommit: null` and shows no count.
3. **The kinds of pane the daemon offers**, in `ready`: `[{ kind, label, reportsState }]`, today `shell` ("Shell", false) and `claude` ("Claude Code", true). The window builds its "+" buttons, the work-item form's choice and the tab labels from this list, and names no kind itself.
4. **Every client hears every change.** A server message `inbox` carries the whole list of sessions and work items, and the daemon sends it to every client whenever a session starts, changes state, exits or closes, or a work item is created or its commit count changes. `ready` carries the same lists, as today, plus the kinds.
5. **Closing a pane**: a client message `close` ends the session's process if it is alive and removes the session from the lists. The window puts a close control on each tab.
6. **The inbox in the window**: the side panel's work-item list becomes the inbox. One line per work item: the title, the branch, the state of its most recent live pane that reports state (`working`, `waiting`, `finished`, or nothing; a work item whose agent panes have all exited shows none, since an exited session keeps its last state and no event would correct it), and the count of new commits when it is above zero. Panes opened without a work item are not lines of the inbox.
7. **Opening a work item from its line**: clicking a line shows that work item's most recent live pane, and where it has none, opens a new pane of the first kind that reports state in its worktree.
8. **A notification** from the operating system when a session's state becomes `waiting` or `finished`, titled with the work item's title (or the tab label for a pane without one) and saying which. No notification is shown for the pane that is in front while the window has focus.
9. Out of scope: the inbox states of the AgenticSeal process (sealed, broken; milestones 2 and 3), sorting or filtering the inbox, a Codex pane kind (Codex CLI is not installed on this machine, so its line shows only commits through a shell pane, which is what the issue asks).

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A Claude Code session's state shows as it happens | Given a Claude Code pane in a work item, when its hooks report a prompt, a permission request and the end of the turn, then the inbox line reads `working`, then `waiting`, then `finished` | Cases on the state function and on the daemon (events fed through `Daemon#agentEvent`); the built app driven once through the real hook relay of the pane's environment, the line read in the window |
| 2. A notification when the session waits | When a session's state becomes `waiting`, then the window shows an OS notification naming the work item | A case on the function that decides whether to notify; in the driven app, `Notification` recorded through the debugging port |
| 3. A branch's new commits show for a CLI without hooks | Given a work item with a shell pane, when a commit is made in its worktree, then within a few seconds its line shows `1` new commit, and the line shows no agent state | A case in a temporary repository; the driven app |
| 4. Every client hears a change | Given two clients, when one creates a work item or a session changes state, then both receive an `inbox` with it | A case |
| 5. A pane closes | When a client sends `close` for a live session, then its process ends and the session is in no later list | A case |
| 6. A line opens its work item | Given a work item with no live pane, when its line is clicked, then a pane of the first state-reporting kind opens in its worktree | The driven app |
| 7. The window names no vendor | `git grep -n -e claude -e 'Claude Code' -- apps/desktop/src/renderer` prints nothing | Executed |
| 8. The state survives a reconnect | Given a session in `waiting`, when the window reconnects, then `ready` lists it in `waiting` | A case |

## Data & interfaces

In `apps/desktop/src/shared/protocol.ts`:

- `AgentState = "working" | "waiting" | "finished"`.
- `SessionInfo` gains `state: AgentState | null`.
- `WorkItem` gains `baseCommit: string | null` (stored) and `newCommits: number | null` (read by the daemon, not stored).
- `PaneKindInfo = { kind: PaneKind; label: string; reportsState: boolean }`.
- Server: `ready` gains `paneKinds: PaneKindInfo[]`; new `{ type: "inbox"; sessions: SessionInfo[]; workItems: WorkItem[] }`.
- Client: new `{ type: "close"; id: number }`.

The state function goes in `apps/desktop/src/daemon/agent-state.ts`, the commit count in `apps/desktop/src/daemon/worktrees.ts`, the notification decision in `apps/desktop/src/renderer/view.ts`. The pane kinds are defined once, in the daemon, as `PANE_KINDS` in `apps/desktop/src/daemon/pane-kinds.ts`, which `main.ts` passes to `Daemon` beside `commandFor`; `main.ts` starts the daemon when imported, so a case cannot read a value defined there.

## Rule changes

- nothing
  why: the work builds what `docs/product.md` *Foundation* and `docs/roadmap.md` milestone 1 already state.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The window's own names of the pane kinds | `apps/desktop/src/renderer/view.ts#tabLabel`, `src/renderer/renderer.ts` (the `kind` of the form and the `new-claude` button), `src/renderer/index.html` (the buttons and the form's options) | The daemon's list of pane kinds (*Scope* item 3) |
| The side panel's plain work-item list | `src/renderer/renderer.ts`, `src/renderer/index.html` | The inbox (*Scope* item 6) |

Framed 2026-11-19 by the session, before the build.
