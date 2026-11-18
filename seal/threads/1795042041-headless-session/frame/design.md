# Design: the headless session

The ticket is issue #8.

## Grounding

The tree as read at `c796df1`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Conclusions*, first bullet, and *Authentication of the Claude adapter*, row "Role session" | The daemon launches the user's own `claude` with `-p --input-format stream-json --output-format stream-json`, and reads its events from the output stream. No Agent SDK |
| `docs/architecture.md` *Role sessions run detached from the user's environment* | The flags and the environment of the launch: `--setting-sources ""`, `--settings` with `disableAllHooks` and `autoMemoryEnabled: false`, `--strict-mcp-config`, `--permission-mode` set by the daemon, `--add-dir` with the folder the session works in, an environment of `HOME`, `USER`, `PATH`, `LANG` and `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` alone. `--bare` is not used |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 to 3 | The protocol and the window carry no vendor field or name; the adapter declares its features; a real Claude adapter and a fake adapter ship together |
| `docs/architecture.md` *Agent adapters*, the table | What the adapter fits: text in; messages, state and cost out. Interrupting, slash commands and permission answers are rows of the same table that this work does not build (*Scope* item 8) |
| `docs/roadmap.md` *Milestones*, row 1 | "Owlery never turns a permission check off": no `bypassPermissions`, no `--dangerously-skip-permissions`, no `--allow-dangerously-skip-permissions` |

## Scope

1. **One adapter interface for role sessions**, in `apps/desktop/src/daemon/adapters/adapter.ts`. An adapter has a `name`, the list of features it declares (`features: readonly string[]`, empty for both adapters today), and `start({ prompt, cwd }, listener)`, which resolves to a run once the session has started and rejects, with a message a person can read, where none started. The run reports neutral events to the listener, none before the promise resolves: `text` (a piece of the agent's answer, in order), `result` (the whole answer, whether it is an error, and the cost in US dollars or `null`), and `exit` (the process's exit code); and it has `stop()`. The daemon reaches role sessions through this interface alone.
2. **The Claude adapter**, in `apps/desktop/src/daemon/adapters/claude.ts`.
   - It launches `claude` as a child process with pipes, not in a PTY, in `cwd`, with the flags of *Grounding* row 2, `--permission-mode default`, and the stream-json input and output (`--verbose` as well, where Claude Code refuses `stream-json` output under `-p` without it).
   - It writes the prompt as one stream-json user message on standard input and then closes standard input, so the session ends after one turn.
   - It finds `claude` and `PATH` through the user's interactive login shell (`$SHELL -l -i -c`), because a daemon the app starts has the app's `PATH` and not the user's, and a non-interactive login shell given only `HOME`, `USER` and `SHELL` found no `claude` on this machine. A lookup that found `claude` is kept for the daemon's process; one that failed is asked again at the next `ask`. Where the login shell finds no `claude`, `start` fails with a message that says so.
   - The environment of the child is the five names of *Grounding* row 2 and nothing else of the daemon's.
   - It reads the output stream line by line and maps it to the neutral events: an `assistant` message's text blocks become `text`, the `result` line becomes `result`, and every other line (`system`, `rate_limit_event`, `user` tool results, a line that is not JSON) is dropped. The mapping is a pure function of one line, so recorded lines can be cases.
   - The argument list and the environment are each built by a pure function, so the flags are cases and not only a reading.
3. **The fake adapter**, in `apps/desktop/src/daemon/adapters/fake.ts`: it answers each prompt with text it is given (by default a text that quotes the prompt), as one or more `text` events, then `result` and `exit 0`, on the next turns of the event loop or after a delay it is given; it can be told to fail in three ways: to fail to start, to give a `result` with an error and exit 1, or to exit 1 with no `result`. The daemon's cases run the whole flow against it.
4. **The daemon runs headless sessions.** `DaemonOptions` gains `roleAdapter`; `src/daemon/main.ts` passes the Claude adapter. A client message `ask` starts a headless session in a work item's worktree (`workItemId` is required: a session in the user's home would read the home folder's `CLAUDE.md` through `--add-dir`). The daemon keeps each session's prompt, its state (`working` until `result`, then `finished`, or `failed` where the result is an error, the process exits without a result, or the adapter fails to start), the answer as it grows, and the cost. Every change of a headless session goes to every client in one message carrying that session whole; `ready` lists them all. A headless session that is `working` keeps the daemon from its idle exit, as a live pane does. `Daemon#close` stops every run.
5. **The window asks and shows the answer.** The side panel gains a section under the inbox: a text field and an "Ask" button that asks in the work item of the pane in front, and the list of headless sessions, each with its prompt, its state and its answer as plain text with its line breaks kept. The button is disabled, with a title that says why, while the pane in front belongs to no work item or the field is empty. A failed session shows the error text in place of the answer.
6. **The window names no vendor.** The renderer names no adapter, no `claude` and no "Claude Code"; the adapter's `name` does not go over the protocol.
7. **No permission check is turned off.** The argument builder's case asserts the list holds `--permission-mode default` and holds none of `bypassPermissions`, `--dangerously-skip-permissions` and `--allow-dangerously-skip-permissions`. A tool call that needs permission is refused by Claude Code in a headless session with no permission prompt tool, and the refusal stands.
8. Out of scope: answering permission requests from the daemon (`--permission-prompt-tool`), the role bundle (`--plugin-dir`, `--agent`, `--append-system-prompt-file`), interrupting or stopping a run from a client, follow-up prompts to the same session, `--resume`, the usage limits of `rate_limit_event`, the cost on the back of the seal, keeping headless sessions across a daemon restart, and checking the CLI's minimum version (milestone 2 builds these on this adapter).

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A person reads a headless answer | Given a work item's pane in front, when the person types a prompt and presses "Ask", then the line shows the prompt and `working`, then the user's `claude` answer and `finished` | The built app driven once through the debugging port, against the real Claude adapter, with a prompt whose answer is checkable (such as "Reply with the single word owl") |
| 2. The suite runs the same flow against the fake adapter | Given a daemon with the fake adapter and two clients, when one sends `ask`, then both receive the session `working`, its text, and `finished` with the whole answer | A case |
| 3. A failed run says so | When the fake adapter fails to start, returns an error result, or exits without a result, then the session is `failed` with a message, and the asking client is told | Cases |
| 4. The launch is detached and keeps the permission checks | The Claude adapter's argument list and environment are exactly those of *Scope* item 2 and item 7 | Cases on the two pure functions; phase 1's real run of the adapter reads the `system` line's `permissionMode`, `mcp_servers` and `plugins` (the line of Claude Code 2.1.327 carries no field for hooks), and the real run of scenario 1 reads the arguments and the environment names of the `claude` process the app's daemon starts |
| 5. The output stream maps to neutral events | Given lines recorded from a real `claude -p` run, the mapping gives the answer's text and the result, and drops every other line | Cases on recorded lines, recorded by the builder from one real run and stored as a fixture |
| 6. A reconnect shows the answers | Given a finished headless session, when a client connects, then `ready` lists it with its answer | A case |
| 7. The daemon waits for a running session | Given a session `working` and no client connected, the daemon does not ask to exit until the session ends | A case |
| 8. The window names no vendor | `git grep -n -i -e claude -- apps/desktop/src/renderer` prints nothing | Executed |

## Data & interfaces

In `apps/desktop/src/shared/protocol.ts`:

- `HeadlessState = "working" | "finished" | "failed"`.
- `HeadlessInfo = { id: number; workItemId: number; prompt: string; state: HeadlessState; answer: string; error: string | null; costUsd: number | null; startedAt: number }`. Its ids are the daemon's own counter for headless sessions, apart from the panes' ids.
- Client: new `{ type: "ask"; requestId: number; workItemId: number; prompt: string }`.
- Server: `ready` gains `headless: HeadlessInfo[]`; new `{ type: "asked"; requestId: number; headless: HeadlessInfo }` answers the asking client; new `{ type: "headless"; headless: HeadlessInfo }` goes to every client at each change (a start, a `text`, a `result`, and an exit with no `result` before it, which makes the session `failed`; an exit after the `result` changes nothing and sends nothing). A request that cannot start is answered with the existing `error`.

The adapter interface in `src/daemon/adapters/adapter.ts`; the Claude adapter's argument builder, environment builder and line mapping exported from `src/daemon/adapters/claude.ts`; the recorded lines in `apps/desktop/test/fixtures/`.

## Rule changes

- nothing
  why: the work builds what `docs/architecture.md` *Authentication of the Claude adapter* and *Role sessions run detached from the user's environment*, and `docs/roadmap.md` milestone 1, already state.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| nothing | | the work adds a path beside the panes and changes none |

Framed 2026-11-19 by the session, before the build.
