# Questions for the planner: the socket path

Judgments the ticket left open that the tree answered, so nobody reopens them:

- Which half of "Done when" is built, the working daemon or the window that says why: both. `frame/plan.md` *Alternatives considered*, the rows "Say why in the window and leave the socket" and "Fix the socket and leave the window silent".
- Where a socket readable by the user alone may live: it stays in the run folder. `frame/plan.md` *Alternatives considered*, the first five rows.
- What the cap is, and whether a bind and a connect by the socket's name pass it: `frame/design.md` *Grounding*, the row of `test_tmp_socket_probe.mjs`.
- Whether closing such a server is safe: `frame/design.md` *Grounding*, the rows of the two close probes.
- Whether a case may move its process's working directory: `frame/design.md` *Grounding*, the row on vitest.

No row is a person's.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Does a hook of a real Claude Code pane deliver its event with the new relay command? The probe ran the command under `/bin/sh`. The framer could not run it inside Claude Code: that needs the built app with this work's code, which does not exist before the build, and a turn of the user's own `claude` | a measurement | It delivers: nothing changes. It does not, because Claude Code runs a hook's command with a shell that does not read `${VAR%/*}`: the command takes the folder another way, such as a second variable | The command of `frame/design.md` *Data & interfaces*, shown under `/bin/sh` by scenario 1 and by the drive of scenario 6. One Claude Code pane opened in the drive's long run folder, with one prompt, answers this | answered 2026-11-19 by phase 2's drive: it delivers; a Claude Code pane in a run folder whose socket path was 170 bytes sent `SessionStart`, `UserPromptSubmit` and `Stop`, and its state went `working` then `finished` |
| Q2 | Does a `hooks.sock` that is a folder stop the daemon's start, as scenario 7 of `frame/design.md` assumes? The framer read `src/daemon/hooks.ts:97`, which removes the path with `rmSync` and no `recursive`, and did not run it: the daemon's process was not run for the frame | the work | It does: scenario 7 stands. It does not: phase 2's drive stops the daemon's start another way, such as a `claude-hooks.json` that is a folder, and its phase record names the way | The folder | answered 2026-11-19 by phase 2's drive: it stops the start; the daemon writes `Path is a directory: rm returned EISDIR (is a directory) <run folder>/hooks.sock`, and scenario 7 stands as framed |
