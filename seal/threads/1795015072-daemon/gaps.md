# Closing memo: 1795015072-daemon

## Not verified

| Item | Who must answer |
|---|---|
| closed The window draws the replayed output on screen: the reopened window's tabs were read through the remote debugging port, and the daemon's replay was read by a second client, but the terminal's drawn text was not read, since the WebGL renderer puts none in the page | answered at the settle of release 0.0.1: phase 1 of `1795043695-inbox-first-window` saw the replayed commands drawn on screen after a reload (`shot-4-alpha-view-after-load.png`, its `gaps.md` row on the lines read in screenshots), and the owner's hand check of 2026-11-21 in the app started by `pnpm --filter @owlery/desktop start` at `5bd94bf`, written on #24, quit and restarted the app and found the sessions alive in the window |
| closed The daemon exiting by itself in the running app once its last session ends and the window closes; the idle exit was run in the suite with a 100 ms wait, not with the daemon's 60-second default | a measurement no record asks for, closed at the settle of release 0.0.1: the daemon's idle exit is held by the suite with a short wait, and the 60-second default would decide only how long a daemon with no session lingers, which "Quit Owlery Completely…" (#106) also ends. No open issue, failed run or other rule rests on the answer, so nothing is opened |
| closed Quitting and reopening the app leaves every session running, and the pane gets the output it missed | executed 2026-11-19 with the built app: the app was killed, the daemon (pid 85669) stayed with session 1 alive, a line typed into the session while the app was closed and one typed before both came back in the reopened window's replay, and the reopened window showed the tab "Shell 1" (read over the remote debugging port) |
| closed A client without the credential is refused by the local server | executed 2026-11-19 against the running daemon: a client with a wrong token was closed with code 4001 and received no message; the suite covers a wrong token, a message before the token and no hello at all |
| closed A hook event crosses the protocol as a neutral event | executed 2026-11-19: the relay command of the hook settings, fed a `PreToolUse` payload, reached a connected client as `{"type":"agent","id":1,"event":"tool-start","tool":"Bash",…}` |

## Not done

- **The recent output is kept in memory, 256K characters per session.** Output older than that is lost when the window reconnects; the disk log `docs/architecture.md` *Memory design* names comes later.
- **An ended session stays listed until the daemon exits.** No way to close a pane exists yet; it comes with the work items of issue #6.
- **The window reloads when the daemon goes away.** The reload finds or starts a daemon again, which loses nothing the daemon did not already lose; a reconnect without the reload can come with the inbox (issue #7).
- **The window names a tab by the pane's kind, `claude` among them.** `docs/architecture.md` *Rules that keep it portable*, rule 2, has the UI read a list of features rather than branch on a vendor's name; the daemon telling the window which kinds of pane it can open, with their labels, comes with the inbox (issue #7), which rebuilds the window's top bar. The base branched the same way over IPC.
- **A replay cut at 256K characters can start inside an escape sequence.** It is cut by characters, not at a line; cutting at a line comes with the disk log.
- **The daemon lives in the desktop package.** It shares `node-pty` built for Electron's ABI and runs on Electron's Node; a package of its own can come when the phone needs it.
