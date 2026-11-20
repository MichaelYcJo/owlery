# Changelog: Owlery keeps the Mac awake while an agent works

Issue #102. A Mac left alone went to sleep under a working agent. The agent stopped, and the notification that it had begun to wait did not come until someone woke the Mac.

- **The Mac no longer goes to idle sleep while an agent works.** Owlery's daemon, the background process that runs the sessions, holds the Mac awake while a Claude Code pane is working or an "Ask" is running. It lets go when the last of them waits, finishes or ends. A shell pane never holds the Mac awake, whatever runs in it.
- **The display may still sleep, and a closed lid still puts the Mac to sleep.** Owlery changes no setting of the Mac.
- **The hold works while the window is closed**, because the daemon holds it and not the app. It ends when the daemon ends, however the daemon ends.
- **The sidebar's foot has a control for it, beside the theme's.** It offers "While an agent works", which is the default, "Always" and "Never". "Always" holds for as long as the daemon runs. The daemon still exits by itself once the window is closed and no session is left, and the hold ends with it. "Never" holds nothing.
- **The choice is kept across restarts.** The daemon keeps it in its own folder, so a window opened later shows the same choice.
- **The status line says when the Mac is being kept awake**: `Daemon running, 1 agent, keeping the Mac awake`.
- **The hold follows the state the inbox shows.** Where a pane is listed as working and its agent has stopped without saying so, the Mac stays awake until that pane's next event or its end. "Never" ends the hold at once.
- **A daemon left running from before this change holds nothing, and the window shows no control for it**, until that daemon is replaced.
- **Only on macOS.** Owlery uses `caffeinate`, which ships with macOS.
