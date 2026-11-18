# Changelog: the daemon

Issue #5. The terminals lived in the app's main process, so quitting the app ended every session.

- **The sessions live in a daemon that outlives the app.** The app starts the daemon, detached and on Electron's own Node, and finds it again when it reopens. The daemon owns the terminals, the recent output of each and the hook socket, and exits by itself once no session is alive and no window is connected.
- **A reopened window gets its sessions back.** It lists the sessions the daemon kept, opens a tab for each, and draws the output they printed while the app was closed.
- **The window reaches the daemon over WebSocket, and only with the token.** The daemon listens on the loopback address alone and closes any client whose first message does not carry the token from a discovery file the user alone can read.
- **The protocol carries no vendor's field.** Claude Code's hooks reach the window as neutral agent events (`tool-start`, `permission`, `turn-end` and the rest), with the tool's name where there is one.
- **`docs/architecture.md` says `SessionStart` carries no `permission_mode`.**
