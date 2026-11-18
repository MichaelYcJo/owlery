# Phase 1: 1795042041-headless-session

## What this phase found

**The frame holds, except for one flag.** Every path `frame/design.md` *Data & interfaces* and `frame/plan.md` *Technical context* name was opened at `dd0bd7b` and is where the frame says: `apps/desktop/src/daemon/daemon.ts` with `Daemon`, `DaemonOptions`, `checkIdle`, `broadcast` and the `ready` message, `main.ts`, `hooks.ts` with `claudePaneCommand`, and `src/shared/protocol.ts`. The installed Claude Code is 2.1.327. `frame/design.md` *Scope* item 2 has the Claude adapter find `claude` through `$SHELL -l -c`, and on this machine that shell finds none. It is the first departure below.

**What phase 2 needs: the protocol, as `apps/desktop/src/shared/protocol.ts` now states it.**

- `HeadlessState = "working" | "finished" | "failed"`.
- `HeadlessInfo = { id; workItemId; prompt; state; answer: string; error: string | null; costUsd: number | null; startedAt }`.
- The client's new message is `{ type: "ask"; requestId: number; workItemId: number; prompt: string }`.
- The server's `ready` is `{ type: "ready"; sessions; workItems; paneKinds; headless: HeadlessInfo[] }`.
- The server's two new messages are `{ type: "asked"; requestId: number; headless: HeadlessInfo }` and `{ type: "headless"; headless: HeadlessInfo }`.

**When each message is sent.**

- The client that asked receives `asked` first, with the session `working`, an empty `answer` and its id. Every client, the asking one included, then receives `headless` with the same session.
- Every client receives one `headless` for each piece of text, with `answer` grown by that piece and the state still `working`.
- Every client receives one `headless` when the result arrives. A good result gives `finished`, with `answer` replaced by the result's whole text and `costUsd` set. An error result gives `failed`, with `error` set to the result's text and `answer` left as it had grown.
- A process that exits before any result gives one `headless` with `failed` and `error` set to `the session exited with code <N> and gave no result`.
- An adapter that does not start gives `asked` with `working`, then one `headless` with `failed` and the adapter's message in `error`.
- `ready` lists every headless session asked since the daemon started, in the order asked, each whole. No message removes one.
- An `ask` that cannot start is answered with `error` and creates no session. The messages are `asking needs a work item and a prompt` (no `workItemId`, a prompt that is not a string, or a prompt of white space alone), `no work item <id>`, and `the folder of work item <id> is gone: <folder>`.

A client replaces the session it holds under `headless.id` with each `headless` it receives. The ids start at 1 and are counted apart from the panes' ids, so a headless session and a pane can carry the same number. `error` is `null` unless the state is `failed`. The window shows `error` in place of `answer` for a failed session (`frame/design.md` *Scope* item 5); the daemon keeps both.

**What the real run showed.** The probe ran the Claude adapter once, at the tree that became `45d44c3`, in a temporary git repository under the scratch directory, with the prompt "Reply with the single word owl". The adapter's environment was `HOME`, `USER`, a `SHELL` and the system `PATH` (`/usr/bin:/bin:/usr/sbin:/sbin`), with no `LANG`, which is what an app opened from the Finder gives its daemon. The `SHELL` was a script that ran the real `/bin/zsh` with the adapter's arguments and named a recording script in place of the CLI. The recording script kept its arguments, its environment and its folder, ran the real `claude` 2.1.327 with them, and kept each line it printed.

- The adapter reported `text` "owl" 3.5 s after the start, `result` "owl" with a cost of 0.0508754 US dollars, and `exit 0` 0.8 s after the result.
- The CLI received the fifteen arguments of `claudeArgs`, the folder of the temporary repository, and the five names `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`, `HOME`, `LANG`, `PATH` and `USER`. The three other names it saw, `PWD`, `SHLVL` and `_`, are set by the recording script's own `sh`.
- The subscription login worked under those five names.
- The `system` line reported `permissionMode: "default"`, `mcp_servers: []`, `apiKeySource: "none"`, and five plugins, each with the path `builtin`. It has no field for hooks. Scenario 4 of `frame/design.md` has phase 2 read "the hooks" from that line, and phase 2 will find none to read.
- `claude --help` of 2.1.327 lists the permission modes `acceptEdits`, `auto`, `bypassPermissions`, `manual`, `dontAsk` and `plan`. It does not list `default`. The CLI accepts `--permission-mode default` and reports `default` back. An invented mode is refused by name before anything runs.
- The CLI refuses `-p --output-format stream-json` without `--verbose`, with the message "When using --print, --output-format=stream-json requires --verbose". `claudeArgs` passes it, as `frame/design.md` *Scope* item 2 allows.

**The fixture, and what was replaced in it.** `apps/desktop/test/fixtures/claude-stream.jsonl` holds the four lines of that run: `system`, `assistant`, `rate_limit_event` and `result`. A script in the scratch directory wrote it from the recorded lines and asserted each replacement landed. These values were replaced:

- `cwd` and `original_cwd`, which held a path with the user's name, by `/tmp/repo`;
- every `session_id` and `uuid` by a placeholder UUID, the same placeholder for the same original;
- the message's `id` by `msg_placeholder` and `request_id` by `req_placeholder`;
- `messaging_socket_path`, which held a process id, by `/tmp/cc-socks/0.sock`;
- `credential_expires_at` by `2000-01-01T00:00:00.000Z`;
- in `rate_limit_info`, both `resetsAt` values and `utilization` by `0`, and `overageDisabledReason` by `placeholder`.

Nothing else changed. The lines held no email address, no organization id and no other path under the home folder. The lists of tools, skills, agents and slash commands are the CLI's own and were kept.

**Departures from the frame, each with its grounds.**

- *The lookup runs `$SHELL -l -i -c`, not `$SHELL -l -c`.* `frame/design.md` *Scope* item 2 gives the reason for the lookup: "a daemon the app starts has the app's `PATH` and not the user's". Run with `HOME`, `USER` and `SHELL` alone, `/bin/zsh -l -c 'command -v claude'` printed nothing on this machine, and `/bin/zsh -l -i -c` printed `~/.local/bin/claude` in 0.5 s. The folder is added to `PATH` in the file zsh reads only for an interactive shell. A pane already launches `claude` through `-l -i -c` for the same reason (`src/daemon/hooks.ts` `claudePaneCommand`). `frame/plan.md` *Alternatives considered* row 1 rejects the interactive shell for every run, and that still holds: the shell is asked once, and the session gets the five names alone. Judged against `frame/design.md` *Scope* item 2's own reason.
- *The lookup reads two marked lines, and only a path counts.* An interactive shell prints whatever the user's profile prints. The script prints `__owlery_cli=` and `__owlery_path=` on lines of their own, and `parseLookup` reads those two. An answer that does not begin with `/` is an alias or a function and counts as not found. The lookup has 10 seconds; a shell that takes longer fails the start with a message that says so.
- *A lookup that failed is asked again at the next `ask`.* *Scope* item 2 says "once per daemon process". The found path is kept for the life of the daemon. A failure is not kept, so a person who installs `claude` after a first failed ask does not have to restart the daemon.
- *`start` takes the listener and returns a promise.* *Scope* item 1 has `start({ prompt, cwd })` return a run that "reports neutral events to one listener". The lookup is asynchronous, so the run exists only later, and a listener attached after it could miss events. `start({ prompt, cwd }, listener)` returns a promise of a run whose one member is `stop()`. The promise rejects where no session started, which is how the adapter "fails to start". Judged against *Scope* item 1, which asks for one listener and a start that can fail.
- *The exit after a result sends no `headless`.* *Data & interfaces* lists an exit among the changes that send one. After a result the exit changes no field of the session, and a message would repeat the last one. The exit sends `headless` only where it is the session's end, with `failed`. The inbox follows the same rule for an event that leaves a state as it was.
- *Text that arrives after the result changes nothing.* The result closes the answer. The frame does not say; a late piece appended to a finished answer would show the answer changing after `finished`.
- *The fake adapter can also exit without a result.* *Scope* item 3 names two ways to fail, and scenario 3 needs a third, "exits without a result". `fakeAdapter({ fail: "exit" })` gives it. `delayMs` sets the wait between two events, which the idle case and the two stop cases need.
- *`LANG` is `en_US.UTF-8` where the daemon has none.* *Scope* item 2 says the child gets the five names. A daemon the app started from the Finder has no `LANG`, and `terminalEnv` in `src/daemon/pty.ts` already gives a pane that value for the same reason. `HOME` and `USER` are passed where the daemon has them and left out where it does not.
- *`ask` and `start` share one check of the work item.* The two messages give the same two errors for a work item the daemon does not hold and for a folder that is gone. `Daemon#worktreeFor` holds the check that stood inside `start`, with its messages unchanged, and the existing cases of `start` pass against it.
- *`DaemonOptions.roleAdapter` is required.* `paneKinds` is required for the same reason: a daemon without it cannot answer the message. The two places in `test/daemon.test.ts` that build a `Daemon` pass `fakeAdapter()`.

**No file under `src/renderer/`, `src/preload/` or `src/main/` changed.** The scoped typecheck passed with them untouched: the window ignores `headless` in `ready` and the two new messages until phase 2. One existing assertion changed: "carries only the fields the protocol names, none of them a vendor's" now expects `headless` among the keys of `ready`.

**Seen red.** The cases of `test/claude-adapter.test.ts` and `test/fake-adapter.test.ts` were written before their modules, and both files failed with the two modules moved out of the tree: "Cannot find module". With the modules in place and no fixture, the Claude file failed on the fixture's path. The cases over the fixture were written before the run that recorded it, against the prompt's known answer, and passed at their first run with the fixture. They were then shown red one mutant at a time: the `assistant` branch renamed failed "gives the answer's text" at `expected '' to match /^owl\.?$/i`; the result's text emptied failed it at the comparison of the result; and a mapping that lets every other line through failed "drops every line that is neither the answer's text nor the result" at `system: expected [ { type: 'text', …(1) } ] to deeply equal []`.

With the protocol and the adapters written and `daemon.ts` unchanged, 16 cases of `test/daemon.test.ts` failed: the changed assertion on the keys of `ready`, the 14 cases of *headless sessions*, and the new case of *idle exit*. All 16 passed after `daemon.ts` was written. Three of them assert that nothing is told or let through, and each was run alone against its one guard removed:

- "tells nobody of the exit that follows a result", with the exit's `if (info.state === "working")` removed, failed at its last line: four states where three were expected.
- "carries the cost the adapter reports, takes the result's text as the whole answer, and nothing after it", with `if (info.state !== "working") return;` removed, failed at the list of answers: five where four were expected.
- "carries only the fields the protocol names, the adapter's name not among them", with the adapter's name added to the session, failed at the list of keys.

The idle case, with the headless term removed from `checkIdle`, failed at its first `expect(idle).toBe(0)`, which had received 2.

**`seal mutate`.** All three files were run at `86cb04d`.

- `src/daemon/adapters/claude.ts` against `test/claude-adapter.test.ts`: 21 mutants, 21 red. Among them: `default` replaced by `bypassPermissions`, `--strict-mcp-config` removed, the daemon's whole environment passed on in two different places, the fifth name removed, `-i` removed from the lookup, an alias accepted as a path, the lookup asked at every start, the folder not passed to the process, the prompt not written, the exit code fixed at 0, `stop` doing nothing, and each branch of the mapping.
- `src/daemon/adapters/fake.ts` against `test/fake-adapter.test.ts`: 9 mutants, 9 red.
- `src/daemon/daemon.ts` against the cases of `test/daemon.test.ts` whose names hold "headless": 21 mutants, 21 red. Among them: each of the three refusals of `ask`, the session started outside the worktree, the first `headless` not sent, the answer not grown, the cost not kept, the result's text not taken, a failure recorded as `finished`, the runs not stopped at `close`, a late run not stopped, the id taken from the panes' counter, the clock not used, `ready` listing none, and both halves of the idle rule.

The calls with several mutants print each verdict and its exit code and not the failing line. The failing line was read for the seven runs of one mutant alone that *Seen red* names.

**What the cases do not reach.** `main.ts` passing `claudeAdapter(process.env)` to the daemon was read and not run. The cases launch scripts that stand for the login shell and the CLI; the real ones ran once, in the probe. The fixture is one turn with one text block: no case holds a recorded line of a tool call, of a second `assistant` message, or of a result that is an error.

**Three things a person may not expect.**

- The pieces of text are joined with nothing between them. Where the agent writes, calls a tool and writes again, the growing answer runs the two texts together until the result replaces it.
- A session that failed with an error result keeps the text that arrived before it in `answer`, beside `error`.
- The daemon asks to exit once the result has arrived and no client is connected, without waiting for the process to exit. The real process exited 0.8 s after its result, and the daemon's own wait before it exits is 60 s.
