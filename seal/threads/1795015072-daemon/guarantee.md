# Guarantee: 1795015072-daemon

## Claims re-run

The sample: the claims with no phase or round record behind them (`routing.md` answers Implementation `the session` and Review `straight to the PR`), which are the orchestrator's guard mutations and its run of the built app. The daemon process was re-run, not the app's window. Every command ran in a clone of the repository at `7cbae94`, under the sealer's scratch directory, with the worktree's `apps/desktop/node_modules` copied in.

| Claim | Source | Command | Result |
|---|---|---|---|
| The broad run passed at a commit that only this work item's records follow | `trail/gate.md:4` (`run: c085df7 against eafbead`) | `git merge-base --is-ancestor c085df7 HEAD`; `git log --no-merges --name-only c085df7..HEAD ^eafbead` | holds: `c085df7` is an ancestor of HEAD, and `7cbae94` touches only `seal/threads/1795015072-daemon/trail/gate.md` |
| The pull request body is `pr.md` above the records' copy, and the copy is the records' text | the body file `seal pr-body` wrote | `seal pr-body seal/threads/1795015072-daemon --body <the body file> --check` | holds: exit 0 |
| With the token check removed, a case fails; with it in place, the client with the wrong token is refused | the orchestrator's prompt (mutation of `src/daemon/daemon.ts:94`) | `daemon.ts:94` edited to `if (message.type !== "hello")`, then `node scripts/test-in-electron.mjs test/daemon.test.ts` | holds: exit 1, `refuses a client whose first message has the wrong token` (`test/daemon.test.ts:72`) times out waiting for the close; the other 14 pass |
| With the loopback host removed, a case fails | the same (mutation of `daemon.ts:50`) | `new WebSocketServer({ port })`, the same run | holds: exit 1, `test/daemon.test.ts:69`: `expected '::' to be '127.0.0.1'` |
| With the alive-session clause of the idle check removed, a case fails | the same (mutation of `daemon.ts:176`) | `const busy = this.clients.size > 0;`, the same run | holds: exit 1, `test/daemon.test.ts:199`: `expected 1 to be +0` in `stays while a session is alive, though no client is connected` |
| With the output buffer's append removed, a case fails | the same (mutation of `daemon.ts:130`) | the line deleted, the same run | holds: exit 1, `test/daemon.test.ts:122`: `expected '' to contain 'first'` in the replay case |
| All 32 cases pass with `daemon.ts` as committed; `pty.ts` and `hooks.ts` moved, with only `socket.end()` removed, and their existing cases pass | the orchestrator's prompt; `git diff -M eafbead 7cbae94` | `node scripts/test-in-electron.mjs test/daemon.test.ts test/hooks.test.ts test/pty.test.ts`; `git diff eafbead 7cbae94 -M` on the four paths | holds: exit 0, `Tests 32 passed (32)`; the rename diff of `pty.ts` is empty, that of `hooks.ts` removes `socket.end();` alone, and the two test files change only their import path and one case's name (`test/hooks.test.ts:53`); the clone's `git diff` was empty after the four mutations |
| The daemon process writes its files for the user alone, refuses a wrong token, keeps a session and its output while no client is connected, relays a hook as a neutral event, and removes its files on SIGTERM | the orchestrator's prompt; `gaps.md:9-11` (the three `closed` rows) | one probe, `test_tmp_daemon_probe.mjs` in the sealer's scratch, against the clone's `node build.mjs` output: `dist/daemon.js` run on Electron's Node with `SHELL=/bin/sh`; four clients and the relay command read from the written `claude-hooks.json` | holds: `daemon.json`, `hooks.sock` and `claude-hooks.json` mode 600, the run directory 700; the wrong token closed with 4001 and 0 messages; after the first client left, a line printed while no client was connected and one printed before both stood in the third client's replay, and `ready` listed `{"id":1,"kind":"shell","alive":true}`; the relay exited 0 and the client got `{"type":"agent","id":1,"event":"tool-start","tool":"Bash","at":<number>}`; SIGTERM exited 0, and `daemon.json` and `hooks.sock` were gone. The daemon's pid was confirmed gone afterwards |
| The app starts the daemon detached on Electron's Node, and finds the running one when it reopens | `changelog.md:5`; the orchestrator's run of the built app | not re-run (read: `src/main/daemon-client.ts:30-46` spawns `process.execPath` with `ELECTRON_RUN_AS_NODE=1`, `detached: true`, `unref()`, and reuses a discovery whose daemon answers `ready` to its token) | unverified as run by the sealer: the orchestrator's app run on 2026-11-19 is the only execution; `gaps.md:7` leaves the drawn pane to the owner |
| `SessionStart` carries no `permission_mode` | `docs/architecture.md:268`, `docs/architecture.ko.md:268` | not re-run: it needs a live Claude Code session | unverified: rests on the 2026-11-18 hook run of the previous work item; the owner answers. Read: both files now say it, sentence for sentence |
| Removals: the main process no longer owns terminals, and the old IPC channels are gone | the diff of `src/main/main.ts`, `src/shared/ipc.ts`, `src/preload/preload.ts` (no design, so no `## Removes` table) | `git grep -n -e HookNotice -e TerminalApi -e terminal:start -e "Channel\.\(start\|input\|resize\|data\|exit\|hook\)" -e openPane -e src/main/pty -e src/main/hooks` outside `seal/threads`; `git grep` of imports of `./pty`, `./hooks`, `../daemon` under `apps/desktop/src` | holds: no line stands; `src/main/` holds `main.ts` and `daemon-client.ts`, and the only import from `src/daemon/` there is `discovery` |

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | No frame: `routing.md` *Why this way* says issue #5 fixes the change at its coordinate, with `docs/architecture.md` *Overall layout* and *Rules that keep it portable* holding the design | the build: the diff touches `apps/desktop/`, `pnpm-lock.yaml`, the two architecture files and this work item's records, which the grounds describe; issue #5's body | none |
| the build | A daemon (`src/daemon/`) owns the terminals, each one's recent output and the hook socket, listens on `127.0.0.1` over WebSocket, refuses a client whose first message is not `hello` with the token, and exits when idle; the main process only finds or starts it; the window speaks `src/shared/protocol.ts`, which carries the neutral agent events. No phase record: `routing.md` answers Implementation `the session` | issue #5 *Done when* line 1 by the probe and the orchestrator's app run, line 2 by the suite and the probe; the protocol's fields name no vendor (`protocol.ts:25-38`, `test/daemon.test.ts:156`) | none |
| the last round | No round ran: `routing.md` answers Review `straight to the PR` | not applicable | not applicable |
| the changelog | Five entries: the daemon outlives the app; a reopened window gets its sessions back with what they printed; WebSocket on loopback with the token from a file the user alone can read; no vendor's field, hooks as neutral events; the architecture sentence on `permission_mode` | the diff at `daemon.ts:50`, `:94`, `:130`, `:176`, `discovery.ts:17`, `daemon-client.ts:30-46`, `renderer.ts:99-108`, `agent-events.ts`; the probe; `docs/architecture.md:268` | none |
| the orchestrator's part of the pull request body | `pr.md`: `Part of #5` and that the issue closes when `release/v0.0.1` reaches `main`, with `gaps.md` *Not verified* row 1 quoted and its coordinate | `gaps.md:7`, quoted as it stands; the base `release/v0.0.1` at `eafbead`; issue #5 | none |

Observations, which block nothing and are the owner's to take up (read, not run):

- At reattach the daemon adds the client to its broadcast before the window asks for the replay (`daemon.ts:99-101`; `renderer.ts:99-108` sends `attach` on `ready`; `renderer.ts:116-118` writes `output` and `replay` alike). Output a session prints between `ready` and the `attach` is drawn live, then again inside the replay after it. The done-when line holds; the replay is not exact for a session that prints during that round trip.
- `kind: "claude"` crosses the protocol, and the window branches on it for the tab's label (`renderer.ts:79`). The issue's words, a vendor-specific field, hold, and the same branch stood at the base over IPC; `docs/architecture.md:112` rule 2 says the UI does not branch on a vendor's name, which a later work item with the feature list may settle.
- `OutputBuffer` drops by character count (`buffer.ts:17-23`), so a replay after truncation can open mid escape sequence; `gaps.md` *Not done* row 1 names the in-memory cap.

```seal
target: 7cbae94 against eafbead
Verdict: sealed
```

## Re-audit at `b7655c0`

Since `7cbae94`: `569870e` adds this file; `27d4903` changes `apps/desktop/src/daemon/daemon.ts` and `apps/desktop/test/daemon.test.ts`; `007a71c` changes `changelog.md` and `gaps.md`; `b7655c0` adds the second run to `trail/gate.md`. The claims re-run are the ones on `daemon.ts` and its cases, in the same clone, checked out at `b7655c0`.

### Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The broad run passed at a commit that only this work item's records follow | `trail/gate.md:8` (`run: 007a71c against eafbead`) | `git merge-base --is-ancestor 007a71c HEAD`; `git log --no-merges --name-only 007a71c..HEAD ^eafbead` | holds: an ancestor, and `b7655c0` touches only `seal/threads/1795015072-daemon/trail/gate.md` |
| The rewritten pull request body is `pr.md` above the records' copy, and the copy is the records' text | the body file `seal pr-body` rewrote at `b7655c0` | `seal pr-body seal/threads/1795015072-daemon --body <the body file> --check` | holds: exit 0; `pr.md` is unchanged since `7cbae94` |
| All cases pass at HEAD | the coordinator's message (34 passed) | `node scripts/test-in-electron.mjs test/daemon.test.ts test/hooks.test.ts test/pty.test.ts` | holds: exit 0, `Tests 34 passed (34)` |
| The two new cases were red before the fix | the coordinator's message (2 failed, 32 passed) | `daemon.ts` restored from `7cbae94` under HEAD's cases, then `node scripts/test-in-electron.mjs test/daemon.test.ts` | holds: exit 1, 2 failed and 15 passed; `test/daemon.test.ts:143`: `expected 2 to be 1` (a line drawn twice), and the bystander case: `expected [ { type: 'output', id: 1, … } ] to deeply equal []` |
| The bystander case pins the per-client filter, its one guard | `test/daemon.test.ts:146`; `daemon.ts:182` | HEAD with `if (sessions.has(id))` alone removed from `daemon.ts:182`, the same run | holds: exit 1, the bystander case fails on its `toEqual([])` line, and the each-line-once case on `:143` with `expected 2 to be 1` |
| The each-line-once case needs the session added to the client on `attach` | `test/daemon.test.ts:126`; `daemon.ts:149-150` | HEAD with `daemon.ts:150` alone removed, the same run | holds: exit 1, the case at `:126` times out with no live line after the replay; the other 16 pass |
| The four guards of the first audit still each fail a case | the first audit's rows; `daemon.ts:51`, `:95`, `:131`, `:187` at HEAD | each removed alone, as in the first audit, the same run | holds: the token check fails `refuses a client whose first message has the wrong token`; the host fails `listens on the loopback address only`; the alive clause fails `stays while a session is alive, though no client is connected`; the buffer append fails the replay case and the each-line-once case. The clone's `git diff` was empty afterwards |
| The window still gets its own sessions' output: it is added on `start` and on `attach` | `daemon.ts:139`, `:150`; `renderer.ts:99-108` | not re-run in the app (read) | read: the window adopts a pane on `started`, after `daemon.ts:139` has added it, and attaches every alive session on `ready`; the probe of the first audit was not re-run at `b7655c0`, and `streams its output` and the replay cases cover the path in the suite |

### The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | Unchanged: no frame, `routing.md` as at `7cbae94` | the build: `27d4903` touches `daemon.ts` and its cases alone | none |
| the build | `27d4903`: each client holds the sessions it opened or attached (`daemon.ts:43`, `:100`, `:139`, `:150`); output goes only to those (`:182`); `attach` sends the replay and then adds the session in one synchronous step (`:149-150`) | the first audit's observation 1, which it closes; issue #5 *Done when* line 1; the two cases above | none |
| the last round | No round ran: `routing.md` answers Review `straight to the PR` | not applicable | not applicable |
| the changelog | `changelog.md:6` adds "each line once" | `test/daemon.test.ts:126`, red before and green after | none |
| the orchestrator's part of the pull request body | `pr.md`, unchanged: `Part of #5`, `gaps.md` *Not verified* row 1 quoted | `gaps.md:7`, quoted as it stands | none |

`gaps.md:18-19` now carry the first audit's observations 2 and 3 under *Not done*, each with where it goes (issue #7 for the tab's label and the feature list; the disk log for a replay cut at a line). Read: they say what this file observed.

```seal
target: b7655c0 against eafbead
Verdict: sealed
```
