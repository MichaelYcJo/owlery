# Changelog: restart the daemon, or quit it with its sessions, from the app's menu

Issue #101. Owlery's daemon, the background process that runs the sessions, outlives the app, and nothing in the app could end it. After an update the window stayed attached to the daemon the build before had started, and the status line sent the person outside the app: "End its sessions and start Owlery again."

- **The application menu has "Restart Daemon…" and "Quit Owlery Completely…".** On macOS both stand in the app's menu, above "Quit Owlery". Neither has a key.
- **Each asks first, in a dialog that names every running session.** A terminal that is open reads `Shell in <work item>`, and a question an agent is still answering reads `Asked in <work item>: <prompt>`. The dialog opens with the keyboard on Cancel, and Cancel ends nothing.
- **"Restart Daemon…" ends every running session, stops the daemon and starts it again from the build that is running.** The window loads again and attaches to the new daemon.
- **"Quit Owlery Completely…" ends every running session, stops the daemon and quits Owlery.** Nothing of Owlery is left running.
- **A plain Quit is as it was.** The daemon and its sessions keep running, and the next start attaches to them.
- **Both lose what the daemon holds in memory:** the terminals' tabs and output, and the answers to what was asked. Work items, their folders and their branches stay as they are. The dialog says so.
- **Owlery stops no daemon but its own.** It signals the process its own folder names, and only after a daemon answered there with that folder's token.
- **Where the daemon is still there five seconds after it was asked to stop, the dialog says so and names the process:** `Owlery's background process did not stop. It is process <pid>.` Owlery does not kill it, and after "Quit Owlery Completely…" it does not quit.
- **The status line says when the daemon is from another build than the app:** `Owlery's background process is from another build. Choose "Restart Daemon…" from the menu to replace it.` This replaces the sentence that told the person to end the sessions and start Owlery again. The sentence stands in place of the count of agents until the daemon is replaced.
- **A daemon left running from before this change is read as one of another build**, so the first start after the update shows the sentence. "Restart Daemon…" replaces that daemon and ends the sessions it runs.
- **A build that changes the daemon's code is another build, and one that does not is the same.** A rebuild of an unchanged tree shows no sentence.
- **For a client of the daemon:** `daemon.json` gains the optional `build`, the SHA-256 of the daemon's script as hexadecimal text. The protocol is not changed.
