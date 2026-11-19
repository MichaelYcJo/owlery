# Implementation Plan: the socket path

## Technical context

The tree as read at `56ce302`.

`apps/desktop`: the hook server and the relay command are in `src/daemon/hooks.ts` (`HookServer.listen` at `:96-108`, `close` at `:114-116`, the command at `:39`), with their cases in `test/hooks.test.ts`. The daemon's process is `src/daemon/main.ts`, which starts when imported, so no case imports it. The app's main process finds or starts the daemon in `src/main/daemon-client.ts#ensureDaemon`, which imports Node and `ws` alone and has no case. `src/main/main.ts:32-35` hands the answer to the window over `Channel.daemon` of `src/shared/ipc.ts`, and `src/renderer/renderer.ts#connect` reads it. Tests run with vitest in Electron's Node (`pnpm run test`), each file in a forked process.

These facts shape the build. `frame/design.md` *Grounding* holds the probe behind each.

- **The cap is on the string given to the system, not on where the socket is.** A name of 104 bytes listens and one of 105 is refused. A socket bound and reached by its file name from inside its folder has a name of 10 bytes whatever the folder's path.
- **Node binds during the call of `listen`, and removes the socket during the call of `close`, both by the name it was given.** A process that is inside the folder for those two calls alone, and nowhere else, binds and removes the right file. A process that closes from elsewhere leaves the socket behind and removes a file of that name from its working directory.
- **`nc -U` has the same cap as the listener.** The relay command needs the same remedy as the server.
- **The window is silent for a reason apart from the socket.** `ensureDaemon` waits its 10 seconds on a process that has already exited, and `connect` drops the rejection. Any failed start is silent, whatever its cause.

**The failure scenario of the chosen approach.** The bind and the close each move the working directory of the whole daemon process for the length of one call. Code added later that runs the daemon's work in a worker thread cannot move the directory, and `listen` then throws. A later Electron whose Node binds or removes the socket after the call returns, and not during it, binds in the wrong folder or removes the wrong file; scenarios 1 to 3 of `frame/design.md` turn red on that upgrade. A daemon whose own working directory was removed before it started cannot read it to move back, so its listen is refused, and the window then says so. A hook's command that Claude Code runs with a shell that does not read `${VAR%/*}` delivers nothing and exits 0, in every run folder and not the long ones alone (`frame/questions.md` Q1).

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Keep the Unix socket in the run folder, and bind and reach it by its name from inside the folder | The scenario above | Chosen. The premise that keeps the structure: the socket's guard is its file mode, `0600` in a folder of mode `0700`, so a pane's environment holds no secret. Checked at `src/daemon/hooks.ts:104` and `src/daemon/main.ts:24` |
| Replace the Unix socket: the hooks send to a port on the loopback address, as the window does | Any process of any local user can reach the port, so each hook must carry a token. The token then sits in the environment of every pane, where every tool the agent runs reads it, and a hook's command needs a client that sends it | Rejected. It answers the cap by giving up the guard the file mode gives for nothing |
| Put the socket in a short folder made for each daemon under the system's temporary folder | The system's helper for temporary folders runs daily with a limit of 3 days (`frame/design.md` *Grounding*, the `plutil` row; what it removes was not run). A daemon outlives the app for days. A socket removed under it loses every hook without a sign, and the inbox then shows a stale state. A `TMPDIR` the user set to a long path meets the cap again | Rejected |
| The same temporary folder, used only where the run folder's path is over the cap | The same loss, for the long folders alone, and two ways to place a socket where one is tested by a person's daily use and the other is not | Rejected |
| Move the run folder to a short path of its own, such as `~/.owlery/run` | Electron's `--user-data-dir` no longer chooses the run folder, so a drive writes into the person's own folder, which the earlier drives were kept out of (`seal/threads/1795042041-headless-session/trail/phases/phase-2.md`, the item on `OWLERY_RUN_DIR`). A long account name still reaches the cap | Rejected |
| Say why in the window and leave the socket | The daemon still does not start. A person with a long account name cannot use the app, and every drive needs a short folder | Rejected as the whole answer; kept as *Scope* items 4 to 6, because the silence has a cause of its own |
| Fix the socket and leave the window silent | The ticket's "Done when" is met. The next cause of a failed start, such as a run folder that cannot be written, is silent again for 10 seconds and after | Rejected: the wait on a dead process and the dropped rejection are in the code read for this ticket |
| Let the daemon keep its run folder as its working directory for its whole life, and listen by the name | `HookServer` then binds the right file only in a process arranged for it, so a case must arrange the same, and a relative path read anywhere else in the daemon changes its meaning | Rejected for the two calls |
| Let the request over `Channel.daemon` reject, and show the rejection's message | Electron writes `Error invoking remote method 'owlery:daemon': Error: ` in front of the sentence | Rejected: the handler answers `{ error }` |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 3 | Scenarios 1 to 3 as cases, each seen red before its code or, where the code before it moved nothing and the case was green, seen red with the guard it pins removed by `seal mutate`; scenario 4 by the run of `test/hooks.test.ts` | `10fedd8` |
| 2 | *Scope* items 4 to 6, and the interfaces of *Data & interfaces* outside `hooks.ts` | Scenario 5 as a case, seen red before its code; scenarios 6 and 7 in one drive of the built app | `47a5e27` |

Phase 2's commit that adds `changelog.md` carries no version move (*Operational impact*).

## Overlap with the release

Issues #9 and #10 have a `routing.md` and no frame on their branches (`perf/9-nobody-measured-four-visible-terminals` at `69b25ba`, `test/10-no-test-types-korean-into-a-pane` at `1c2acea`), so their rows are read from their issues.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| Issue #18, `1795043695-inbox-first-window` (in its build, phases 1 to 3 closed at `24c2204`) | `apps/desktop/src/main/main.ts`: this work changes the handler of `Channel.daemon`, #18 the window's size and ground in `createWindow`. `apps/desktop/src/renderer/renderer.ts#connect`: this work changes its first statement, #18 a comment in its `close` listener and most of the file around it. `apps/desktop/src/daemon/main.ts`: this work changes the call of `main` in the last line, #18 two comments. The status line, which #18 keeps outside its three screens (`frame/design.md` of #18, *Data & interfaces*) | #19 | It is the smaller diff and likelier to be sealed first. The lines each changes in the three files are apart, as read from `git diff release/v0.0.1...feat/18-the-app-opens-on-a-pane-of-terminals` on 2026-11-19, so #18 takes this work in by a merge of `release/v0.0.1` inside the phase it still builds. #18's drive then no longer needs a run folder with a short path. Whichever merges second shows once, in its drive, that the status line is displayed on the screen the window opens on |
| Issue #9, four visible terminals under about 500 MB (routing only) | No file. Its measurement drives the built app, whose run folder Electron's `--user-data-dir` chooses | #19 | #9 is built after #18. With this work merged, its drive takes a run folder of any length |
| Issue #10, the Korean input regression test (routing only) | No file. Where its test starts the built app, the same run folder | #19 | The same |

## Operational impact

No dependency, no environment variable and no file of the run folder is added. The relay command in `claude-hooks.json` changes; the daemon writes that file at each start, and a pane ends with its daemon, so no pane keeps the earlier command. The app's main process answers the window's request for the daemon with a failure where it rejected it before, so the two are built and shipped together, as they already are. The version does not move: `0.0.1` was moved by the first pull request into `release/v0.0.1`.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-19 | The crafter of every phase runs on Fable 5.2, and the sealer on Opus 5.5 | The owner's choice for the work that runs beside #18; a builder on another model than the sealer's | `docs/product.md` *The seal belongs to the product and looks the same everywhere* |
| 2026-11-19 | The sealer runs on Fable 5.2, not Opus 5.5 as row 1 recorded | The owner asked at 09:38 that everything run until 22:00 run on Fable ("10시까지도는건 다 fable로 진행하자"), and the sealer is spawned before then; the crafter and the sealer then share a model, which the guarantee's reader learns from this row | `docs/product.md` *The seal belongs to the product and looks the same everywhere* |
