# Phase 1: 1795019054-inbox

## What this phase found

**The frame holds.** Every path `frame/design.md` *Data & interfaces* and `frame/plan.md` *Technical context* name was opened at `a698dd2` and is where the frame says: `apps/desktop/src/daemon/daemon.ts` with `Daemon`, `DaemonOptions`, `agentEvent`, `sendOutput` and the creation queue, `worktrees.ts`, `work-items.ts`, `agent-events.ts`, `main.ts` with `commandFor` and the hook server's wiring, and `src/shared/protocol.ts`. One sentence of the frame cannot be built as written, and it is the first departure below.

**What phase 2 needs: the protocol, as `apps/desktop/src/shared/protocol.ts` now states it.**

- `AgentState = "working" | "waiting" | "finished"`.
- `PaneKindInfo = { kind: PaneKind; label: string; reportsState: boolean }`.
- `SessionInfo = { id; kind; alive; workItemId: number | null; state: AgentState | null }`.
- `WorkItem = { id; title; repo; branch; worktree; createdAt; baseCommit: string | null; newCommits: number | null }`.
- The server's `ready` is `{ type: "ready"; sessions: SessionInfo[]; workItems: WorkItem[]; paneKinds: PaneKindInfo[] }`.
- The server's new message is `{ type: "inbox"; sessions: SessionInfo[]; workItems: WorkItem[] }`.
- The client's new message is `{ type: "close"; id: number }`. It has no `requestId` and no answer of its own: the `inbox` that follows no longer lists the session.

**How `paneKinds` reaches the window.** It arrives once per connection, in `ready`, and in no other message. Today it is `[{ kind: "shell", label: "Shell", reportsState: false }, { kind: "claude", label: "Claude Code", reportsState: true }]`, in the order the window should show the kinds. The window keeps the list from `ready` and looks a session's `kind` up in it for the tab label and for whether the pane reports state.

**When `inbox` is sent.** Every connected client receives it, the client that caused the change included. The daemon sends it:

- after a pane starts. The client that asked receives `started` first and the `inbox` after it, so it already knows the session's id as its own when the list names it;
- after a work item is created. The creating client receives `workItemCreated` first, then one `inbox` that holds both the work item and its pane;
- when an agent's event changes a session's state. An event that leaves the state as it was sends no `inbox`. The `agent` message still goes out for every event, as before;
- when a session's process ends by itself, after the `exit` message;
- after a `close`, with the session gone from the list. No `exit` follows for a closed pane, so the window removes the tab at its own `close` or at this `inbox`;
- when a read of the branches finds a count that differs from the last one read.

`inbox` is not sent at connection: `ready` carries the same two lists. A client replaces both of its lists with each `inbox`. A session it holds a terminal for and that an `inbox` no longer lists was closed, by itself or by another client.

**What the counts are at each moment.** A new work item has `newCommits: 0` in `workItemCreated` and in the `inbox` after it. After a daemon restart every work item has `newCommits: null` in the first `ready`, and an `inbox` with the counts follows within milliseconds, because the first client to connect starts a read at once. A work item written to `work-items.json` before this phase has `baseCommit: null` and keeps `newCommits: null`. `newCommits` is also `null` where git gives no count, such as a repository or a branch that was removed.

**Departures from the frame, each with its grounds.**

- *The pane kinds are in a module of their own, `src/daemon/pane-kinds.ts`, not in `main.ts` beside `commandFor`.* `frame/design.md` *Data & interfaces* says they are "defined once, in the daemon, beside `commandFor`". `main.ts` starts the daemon process when it is imported, so no case can import a value defined there. `PANE_KINDS` is defined once in `pane-kinds.ts`, and `main.ts` passes it to `Daemon` on the line above `commandFor`. `DaemonOptions` gains the required `paneKinds`. Judged against `frame/plan.md` *Phases* row 1, which asks for each unit as a case.
- *The agent's `session-start` event gives no state.* `frame/design.md` *Scope* item 1 names seven of the eight neutral events and leaves `session-start` out. `agentStateAfter` in `src/daemon/agent-state.ts` returns `null` for it, so the function stays a function of the last event alone, as item 1 asks. The consequence a person can see: a session whose agent starts again mid-work shows no state until its next event. Whether Claude Code sends `SessionStart` again after it compacts a conversation was not run.
- *The daemon keeps a session's state only for a kind whose `reportsState` is true.* Item 1 says the state is `null` "for a pane kind that reports no agent events". The daemon enforces that sentence: an event that arrives under a shell pane's id is still sent on as `agent`, and the session's state stays `null`.
- *`baseCommit` is read from the new branch after `git worktree add`, with `git rev-parse --verify refs/heads/<branch>`.* Item 2 says the work item "records the commit its branch started from". Reading the branch gives that commit even where the repository's `HEAD` moves between the two commands.
- *The count is `git rev-list --count <baseCommit>..refs/heads/<branch> --`.* Item 2 writes `<baseCommit>..<branch>`. The full ref name keeps a tag or a file of the same name from being read in the branch's place.
- *A new work item's count is set to 0 at creation, not read.* The branch was cut at `baseCommit` in the same step. Without this the first read would change `null` to `0` and send an `inbox` that shows nothing new.
- *The reads are one timer chain, and one guard stops them.* A read starts at once when a client connects and the last read is an interval old, and otherwise when the interval has passed since the last read. Each read arranges the next. The timer's callback does nothing while no client is connected, and that is the only place the rule "only while a client is connected" (item 2) is held. `DaemonOptions.commitPollMs` is the interval, 3000 ms by default, and the cases shorten it.
- *`close` removes the session before it ends the process, and the process's end is then told to nobody.* Item 5 says the session is removed from the lists. A window that had already dropped the tab would otherwise receive an `exit` and an `inbox` for a session it no longer knows. A `close` for an id the daemon does not hold does nothing. A `close` for a session that has already exited takes it off the lists.
- *`WorkItemList` holds `StoredWorkItem`, which is `WorkItem` without `newCommits`.* *Data & interfaces* says `newCommits` is "read by the daemon, not stored". The daemon keeps the counts in a map by work item id and joins them to the list for each `ready`, `workItemCreated` and `inbox`.

**No file under `src/renderer/`, `src/preload/` or `src/main/` changed.** The scoped typecheck passed with them untouched. `test/view.test.ts` builds `WorkItem` and `SessionInfo` values, and the new fields were added to its five session literals and one work item literal so the file compiles. No assertion of that file changed. Until phase 2 the window ignores `inbox` and `paneKinds` and sends no `close`.

**Seen red.** The cases were written before the code. `agent-state.test.ts` and `pane-kinds.test.ts` failed first because their modules did not exist. The three `newCommits` cases, the `baseCommit` assertions of `worktrees.test.ts` and the three changed or new cases of `work-items.test.ts` failed against the old units on their own assertions. With the protocol and the small units written and `daemon.ts` unchanged, 20 cases of `daemon.test.ts` failed: 6 older cases on the new fields they now expect, and 14 of the 15 new cases of *the inbox*, each on an assertion about `state`, `paneKinds`, `newCommits`, or on its wait for an `inbox` that never came. All of them passed after `daemon.ts` was written.

The fifteenth, "reads the counts at most once per interval, however often clients come and go", asserts that no `inbox` arrives, and passed against the old daemon, which sends none. It was shown red by `seal mutate` with the wait before a read replaced by `0`, run with that case alone: it failed at `expect(inboxes(second)).toEqual([])`, which had received one `inbox`.

**`seal mutate`.** The four smaller files were run at `1117496`, and no later commit changed them. `daemon.ts` was run at `cbf429c`, at `1117496` and at `3e45672`, as its line below says.

- `src/daemon/agent-state.ts` against `test/agent-state.test.ts`: 6 mutants, 6 red. Each returned state was swapped for another, and the `notification` and `tool-failed` labels were removed.
- `src/daemon/pane-kinds.ts` against `test/pane-kinds.test.ts`: 3 mutants, 3 red.
- `src/daemon/worktrees.ts` against `test/worktrees.test.ts`: 4 mutants, 4 red. The range lost its base, the range ended at `HEAD` in place of the branch, a failure counted as 0, and `createWorktree` returned an empty `baseCommit`.
- `src/daemon/work-items.ts` against `test/work-items.test.ts`: 4 mutants, 4 red.
- `src/daemon/daemon.ts` against `test/daemon.test.ts`: a first call at `cbf429c` gave 20 mutants, 18 red and 2 survived. One survivor was a line that removed a closed pane's id from each client's set of attached sessions. Nothing reads that id again, so the line went. The other was the clearing of the read timer when the last client leaves. A second guard in the scheduling stopped the chain one read later, so no case could tell the two apart. The two guards became the one in the timer's callback (`1117496`). A second call at `1117496` over that guard, the wait, the read at connection, the next read's scheduling and the removal at `close` gave 5 mutants, 5 red. Three of the five repeat red mutants of the first call, and a fourth red mutant of the first call was on the guard `1117496` removed. Of the 14 other red mutants of the first call, 13 are on lines no later commit changed. The fourteenth was on the condition that sends an `inbox` only for a changed count, which `3e45672` shortened to `if (changed)`. That condition was run again alone at `3e45672`, with the `if` removed, against "sends no inbox while the counts stay as they were": red, at the assertion that the client received exactly two `inbox` messages.

The calls with several mutants print each verdict and its exit code and not the failing line, so the failing line was read for the two runs of one mutant alone, the interval case and the changed-count condition.

**What the cases do not reach.** `main.ts` passing `PANE_KINDS` and the real hook relay feeding `Daemon#agentEvent` were read and not run; `frame/plan.md` *Phases* row 2 drives the built app through both. The cases feed events through `Daemon#agentEvent` and use `/bin/sh` panes.

**Two things the frame's mapping does that a person may not expect.** Both follow from *Scope* item 1 as written and were built to it. A `notification` event makes the state `waiting` whatever came before it, so a session that finished and then sends a notification of its own goes from `finished` to `waiting`. Whether Claude Code sends such a notification to an idle session was not run. And a `tool-end` after a `permission` makes the state `working` again, which is the person's answer taking effect.
