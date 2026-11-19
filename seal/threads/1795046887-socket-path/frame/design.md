# Design: the socket path

The ticket is issue #19.

## Grounding

The tree as read at `56ce302`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Overall layout*, the bullet "Agent state is judged from events, never guessed from what the terminal screen prints" | A pane's state reaches the inbox only through its hooks, so a hook socket that stops receiving loses the state without a sign. The socket stays where nothing but Owlery removes it |
| `docs/architecture.md` *The phone: the terminal session as a chat*, the bullet "Hooks are added only to the sessions Owlery launches" | The relay command stays in Owlery's own settings file, and the user's settings are not written |
| `docs/roadmap.md` *v0.1*, "It is the macOS desktop app only" | The cap this work answers is macOS's. No other platform's socket is built or probed |

The policy root states no place for the hook socket and no cap on its path. The earlier work items do: the socket and the settings file are written in Owlery's own directory, readable by the user alone (`seal/threads/1795012146-claude-code-hooks/changelog.md`, second entry; `seal/threads/1795015072-daemon/changelog.md`, first entry). This work keeps that.

The ticket's comments: `gh issue view 19 --json body,comments`, run by the framer on 2026-11-19, gave an empty list (`executed`).

What the tree does today (`read`, at `56ce302`):

- `apps/desktop/src/daemon/main.ts:27` listens at `join(runDir, "hooks.sock")`, and `:69` starts `main()` with `void`, so a refused listen ends the process through Node's handler for an unhandled rejection.
- `apps/desktop/src/daemon/hooks.ts:39` holds the relay command, the shell command each hook runs to send its event. It gives `nc -U` the socket's whole path from `OWLERY_HOOK_SOCKET`. `hooks.ts:96-108` is `HookServer.listen`, and `:114-116` is `close`.
- `apps/desktop/src/main/daemon-client.ts:40-46` polls for the discovery file for 10 seconds whether or not the daemon's process still lives, then throws `the daemon did not start; see <run folder>/daemon.log`.
- `apps/desktop/src/renderer/renderer.ts:387-388` awaits `window.owlery.daemon()` inside `connect`, and `:422` calls `connect` with `void`. A rejection reaches no handler, and the status line stays empty.
- No case imports `src/main/daemon-client.ts`, and none can import `src/daemon/main.ts`, which starts the daemon when imported.

What the probes gave (`executed`, 2026-11-19, each run once with the Electron 45.3.3 of the repository's `apps/desktop/node_modules` as Node 24.22.3, libuv 1.52.1, on macOS; the scripts and their outputs are in the framer's scratch directory, `<scratchpad>/1795046887-socket-path/frame/`):

- `test_tmp_socket_probe.mjs`: a socket's path of 104 bytes listens, and one of 105 bytes is refused with `listen EINVAL`. An absolute path of 275 bytes is refused the same way. The same socket listens where the process moves its working directory into the socket's folder, calls `server.listen("hooks.sock", …)` and moves back at once: the socket file exists when `listen` returns, before its callback. `/usr/bin/nc -U` given the 275-byte path exits 1 and delivers nothing. The command `{ cd "${OWLERY_HOOK_SOCKET%/*}" && /usr/bin/nc -U -w 2 "${OWLERY_HOOK_SOCKET##*/}"; }` under `/bin/sh` delivers the event to that socket. The same command with a folder that does not exist, followed by `>/dev/null 2>&1 || true`, exits 0.
- `test_tmp_close_probe.mjs`: a server bound by a relative name, closed after the working directory moved back, leaves its socket file in its folder and removes a file named `hooks.sock` from the working directory.
- `test_tmp_close_inside_probe.mjs`: where the process is inside the socket's folder during the call of `server.close()`, the socket file is gone when the call returns and the file of the same name in the working directory stays, with a client connected and with none.
- `plutil -p /System/Library/LaunchDaemons/com.apple.bsd.dirhelper.plist`: the system's helper for temporary folders runs daily at 03:35 with `CLEAN_FILES_OLDER_THAN_DAYS` set to `3`. What it removes was not run.
- `grep` over vitest 4.1.12's `dist/chunks/coverage.DM_a_rWm.js:180`: `resolved.pool ??= "forks"`. The repository has no vitest configuration file, so a case runs in a forked process, where `process.chdir` is allowed.

Nobody ran the daemon's process or the built app for this frame. That a run folder over the cap ends the daemon with `listen EINVAL … hooks.sock` and leaves the window silent is the ticket's account and that of `seal/threads/1795042041-headless-session/trail/phases/phase-2.md` (`read`); the probe reproduced the refused listen, and the code above shows the silence.

## Scope

1. **The hook server listens in a run folder of any length the file system takes.** `HookServer.listen` in `apps/desktop/src/daemon/hooks.ts` binds the socket by its file name from inside the socket's folder. The process's working directory is the same after the call as before it, whether the listen succeeded or was refused. `socketPath` stays the whole path, and the socket stays in the run folder with mode `0600`.
2. **Closing removes the socket and nothing else.** `HookServer.close` removes the socket file from its folder, and removes no file of the same name in the process's working directory.
3. **The relay command reaches the socket by its name from inside its folder.** The command in `hooks.ts` takes the folder and the name from `OWLERY_HOOK_SOCKET`, which stays the one variable and stays the whole path. The command still exits 0 where the folder or the socket is absent, and still writes nothing to the session.
4. **A daemon that cannot start says why in its log, in one line.** `apps/desktop/src/daemon/main.ts` catches a failure of `main`, writes the error's message as one line to its error stream, and exits with code 1.
5. **The app stops waiting once the daemon's process has exited.** `ensureDaemon` in `apps/desktop/src/main/daemon-client.ts` rejects when the process it started exits before it answers. The rejection's message is the sentence of *Data & interfaces*. A daemon that lives and does not answer within 10 seconds is refused as today; that wait is a third parameter of `ensureDaemon`, `timeoutMs`, 10,000 by default, which the cases shorten and the app does not pass.
6. **The window shows the sentence.** The main process answers the window's request with the failure and does not reject it, and `connect` in `apps/desktop/src/renderer/renderer.ts` writes the sentence into the status line, opens no connection and does not reload.
7. Out of scope:
   - A retry from the window. A person who reads the sentence starts the app again.
   - The log's growth: `daemon.log` is appended at every start and nothing trims it.
   - A daemon that starts and later loses its socket, such as a run folder removed under it.
   - Another platform's cap. Linux and Windows are not v0.1's (`## Grounding`, third row).
   - A failure of `spawn` itself in `ensureDaemon`, which starts Electron's own binary.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A hook arrives in a long run folder | Given a folder whose `hooks.sock` path is over 104 bytes, when `HookServer.listen` is called with that path and the relay command of `hookSettings()` runs under `/bin/sh` with that path in `OWLERY_HOOK_SOCKET`, then the listener receives the event with its pane's id, and the command exits 0 | A case in `apps/desktop/test/hooks.test.ts`, seen red at `522621d` (whose `hooks.ts` is that of `56ce302`) with the refused listen as its failing line |
| 2. The working directory does not move | Given the same folder, when `listen` resolves, when `listen` is refused, and when `close` resolves, then `process.cwd()` is what it was before the call | Cases; the refused listen is run twice, once on a socket path whose folder does not exist and once in a folder that exists on a socket name that is itself over the cap, the second being refused after the directory moved |
| 3. Closing spares a bystander | Given a working directory of the case's own that holds a file named `hooks.sock`, and a server listening in another folder, when the server closes, then the socket file is gone from its folder and the bystander file stays | A case, seen red with `close` not entering the folder |
| 4. A short run folder behaves as before | The cases of `HookServer`, `hookSettings` and `writeHookSettings` that exist at `56ce302` pass, unchanged but for the case that names no pane and no socket in the settings file, which expects the relay command's two expansions `${OWLERY_HOOK_SOCKET%/*}` and `${OWLERY_HOOK_SOCKET##*/}` in place of `$OWLERY_HOOK_SOCKET` | The slice's run of `test/hooks.test.ts` |
| 5. The app learns of a dead daemon at once | Given a script that writes one line to its error stream and exits with code 3, when `ensureDaemon` starts it, then the call rejects in under 3 seconds with the sentence of *Data & interfaces*, holding that line, the code and the log's path | A case in a new `apps/desktop/test/daemon-client.test.ts`, seen red at `56ce302`, where the call takes 10 seconds and its message holds neither the line nor the code; two more cases hold that the call resolves with the discovery of the daemon it started, and that the message names the exit code alone whatever an earlier start left in the log |
| 6. The built app works in a long run folder | Given the built app started with `--user-data-dir` naming a folder whose `run/hooks.sock` path is over 104 bytes, when the window loads, then the daemon answers `ready`, `hooks.sock` exists in that run folder, and an event fed through the relay command read from that folder's `claude-hooks.json`, with a live pane's id, reaches the daemon | The drive of the built app through the debugging port, as `seal/threads/1795019054-inbox/trail/phases/phase-2.md` fed its events |
| 7. The window says why | Given the built app started with a `--user-data-dir` whose `run/hooks.sock` is a folder holding one file, so the daemon cannot replace it, when the window loads, then within 3 seconds the status line shows the sentence, with the daemon's line and the path of `daemon.log`, and that line is the last of `daemon.log` | The same drive |

## Data & interfaces

In `apps/desktop/src/daemon/hooks.ts`:

- `HookServer.listen(socketPath: string): Promise<HookServer>` and `close(): Promise<void>` keep their signatures. `socketPath` is absolute, as `src/daemon/main.ts` gives it.
- The relay command becomes, as probed: `{ printf '%s\n' "$OWLERY_PANE_ID"; cat; } | { cd "${OWLERY_HOOK_SOCKET%/*}" && /usr/bin/nc -U -w 2 "${OWLERY_HOOK_SOCKET##*/}"; } >/dev/null 2>&1 || true`. The environment a pane gets, `OWLERY_PANE_ID` and `OWLERY_HOOK_SOCKET`, does not change.

In `apps/desktop/src/shared/ipc.ts`:

- New `DaemonFailure = { error: string }`.
- `OwleryApi.daemon(): Promise<DaemonConnection | DaemonFailure>`. The handler of `Channel.daemon` in `apps/desktop/src/main/main.ts` answers `{ error }` with the message of what `ensureDaemon` rejected with, and no longer lets the rejection through, because Electron puts its own words in front of a rejected request's message.

In `apps/desktop/src/main/daemon-client.ts`, the message `ensureDaemon` rejects with where the daemon's process exited before it answered:

- `the daemon did not start: <line> (exit code <N>); see <log>`, where `<line>` is the last line that is not empty, trimmed at both ends, of what the process wrote to `daemon.log` in this start (a line of spaces alone counts as empty), and `<log>` is the log's path. A process ended by a signal reads `(signal <NAME>)`, as in `(signal SIGKILL)`, in place of `(exit code <N>)`.
- `the daemon did not start (exit code <N>); see <log>` where it wrote nothing.
- The message after 10 seconds of a living daemon stays `the daemon did not start; see <log>`.

In `apps/desktop/src/daemon/main.ts`: the line of *Scope* item 4 is the error's `message` alone, with no stack, so that it is the `<line>` above.

No message of `apps/desktop/src/shared/protocol.ts` changes, and no file's name in the run folder changes.

## Rule changes

- nothing
  why: the policy root names no place for the hook socket and no cap on its path, and the work keeps the socket in Owlery's own directory, readable by the user alone, as the released work items state it.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| nothing | | the work changes how the socket is bound and reached and how a failed start is told; the socket's place, the files of the run folder and the pane's environment stay, and it adds no gate, check, hook or mark |

Framed 2026-11-19 by framer, before the build.
