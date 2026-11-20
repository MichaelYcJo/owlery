Part of #101. The issue closes when `release/v0.0.1` reaches `main`.

Owlery's daemon, the background process that runs the sessions, outlives the app, and nothing in the app could end it. After an update the window stayed attached to the daemon of the build before, so a change to the daemon reached the person only after they found its process and killed it by hand. The app menu now restarts the daemon or quits it with its sessions, and the status line says when the daemon is of another build.

| Before | After |
|---|---|
| No way inside the app to end the daemon | "Restart Daemon…" and "Quit Owlery Completely…" in the app menu, above "Quit Owlery" on macOS |
| A new build kept talking to the old daemon, silently or with "End its sessions and start Owlery again." | The status line says `Owlery's background process is from another build. Choose "Restart Daemon…" from the menu to replace it.` |
| Quit left the daemon and its sessions running | Quit still does. Only "Quit Owlery Completely…" ends them |

**Each asks first.** A dialog names every running session, such as `Shell in <work item>` and `Asked in <work item>: <prompt>`, and says that the terminals' output and the answers in memory go with the daemon. The keyboard starts on Cancel, and Cancel ends nothing. Work items, their folders and their branches stay.

**Owlery stops no daemon but its own.**

- **Which process.** It signals the process its own run folder's `daemon.json` names, and only after a daemon answered at that file's address with that file's token.
- **When the daemon does not stop.** Where it is still there five seconds later, the dialog names the process and Owlery does not kill it. After "Quit Owlery Completely…" the app then stays open.

**How the window tells another build.** The daemon writes the SHA-256 of its own script into `daemon.json` as `build`. The app compares it with the script it would start. A rebuild that does not change the daemon's code is the same build. A daemon left running from before this change wrote no `build`, so it reads as another build, and the first start after the update shows the sentence. The protocol does not change.

Not verified, for the owner's hand run of #24:

- **The menu as a person uses it.** A choice of either entry in the menu bar, and a hidden window coming forward with the dialog open.
- **A real Claude Code pane.** After "Restart Daemon…" with a Claude Code pane open, `pgrep -lf claude` lists no process of that pane.
- **The owner's own daemon.** Against the daemon an earlier build left running, the status line shows the sentence, and "Restart Daemon…" replaces that daemon.
- **A daemon that does not stop.** The dialog names it in the built app.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
