# Changelog: the socket path

Issue #19. Owlery's daemon, the background process that owns the terminals, did not start where the folder Owlery keeps its files in had a long path, a long account name among the causes. The window then stayed empty and said nothing.

- **The daemon starts in a folder of any length.** macOS refuses a Unix socket whose path is over 104 bytes. The daemon now opens the socket that receives an agent's hook events by its file name from inside its folder, so the folder's length no longer counts.
- **The hooks of a Claude Code pane reach it the same way.** The command Owlery gives each hook enters the socket's folder and sends to the socket by its name. It still exits 0 and writes nothing to the session where Owlery is not listening.
- **The socket stays where it was.** It is `hooks.sock` in Owlery's own run folder, readable by the user alone. A pane's environment is unchanged: `OWLERY_PANE_ID` and `OWLERY_HOOK_SOCKET`, which still holds the socket's whole path.
- **A daemon that cannot start says why, and the window shows it.** The status line at the top of the window reads `the daemon did not start: <why> (exit code 1); see <path of daemon.log>`, where `<why>` is the daemon's own last line. It appears within about a second, where the window used to wait 10 seconds and then show nothing.
- **`daemon.log` holds one line for a failed start,** the error's message, where it held a stack trace before.
- **Not yet:** the window does not try again by itself. Start the app again once the cause is gone.
