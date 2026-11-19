# Closing memo: 1795046887-socket-path

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the typecheck and the documents' checks as the `Broad gate` of `seal/config.json` runs them: phase 1 ran `test/hooks.test.ts` alone at `10fedd8`, and the package's own `tsc --noEmit` twice, at the tree each of `d2df840` and `10fedd8` holds, before each commit. No workflow under `.github/workflows/` runs the suite, the lint or the typecheck (`seal deferrals . --kind all`, exit 1) | the orchestrator, by the broad run after the last phase |
| The daemon's process listens in a long run folder: phase 1 ran `HookServer` inside the cases' process, and `src/daemon/main.ts`, which calls it, was read and not run | phase 2's drive of the built app (scenario 6 of `frame/design.md`) |
| A hook of a real Claude Code pane delivers its event with the new relay command (`frame/questions.md` Q1): the cases run the command under `/bin/sh` | a measurement: one Claude Code pane opened in phase 2's drive, with one prompt |
| The message a refused listen rejects with where the refusal comes from the move into the socket's folder: the probe that was to print it printed nothing (`trail/phases/phase-1.md`) | phase 2, whose case and drive read the daemon's line |
| The cap of 104 bytes on another version of macOS: the framer's probe and this phase's cases ran on one machine, Darwin 25.5.0 | a person on another macOS; the cases of `test/hooks.test.ts` answer it wherever they run |

## Not done

- **`close` rejects where the socket's folder is gone.** It cannot enter the folder, and closing from anywhere else would remove a file named `hooks.sock` from the working directory. The daemon's `stop` then ends through an unhandled rejection and not through `process.exit(code)`. `frame/design.md` *Scope* item 7 puts a run folder removed under a living daemon out of scope.
- **The bind and the close fail in a worker thread, and where the process cannot read its own working directory.** Both are in `frame/plan.md` *Technical context*, the failure scenario of the chosen approach. The daemon runs neither way today.
- **The case "ignores a payload that is not JSON rather than crashing" still gives `nc` the socket's whole path.** It runs in a short folder, where that path is under the cap, and scenario 4 keeps the existing cases as they are.
- **The line that removes a socket left by an earlier daemon has no case.** It is unchanged and uses the whole path, which the system takes at any length. It had no case before this work.
