Part of #102. The issue closes when `release/v0.0.1` reaches `main`.

A Mac left alone went to idle sleep while an agent worked. The agent stopped, and the notification that it was waiting came only after someone woke the Mac. Owlery now keeps the Mac awake while an agent works, and lets it sleep as before otherwise.

| Before | After |
|---|---|
| The Mac went to idle sleep under a working agent | While a Claude Code pane is working or an "Ask" is running, the Mac does not go to idle sleep. The hold ends when the last of them waits, finishes or ends |
| Nothing said whether the Mac would stay awake | The status line says so: `Daemon running, 1 agent, keeping the Mac awake` |
| No choice | A control in the sidebar's foot, beside the theme's: "While an agent works" (the default), "Always" and "Never". The daemon keeps the choice across restarts |

**What it does not change.**

- **The display.** It may still sleep.
- **The lid.** Closing it still puts the Mac to sleep. Owlery changes no setting of the Mac.
- **A shell pane.** It never holds the Mac awake, whatever runs in it, because a shell reports no state.

**Why the daemon holds it, not the app.** The daemon is the background process that runs the sessions. It knows every session's state, and it keeps running when the window is closed or the app quits. It starts one `caffeinate -i -w <its own process id>` child, which ships with macOS. The child ends when the daemon ends, however the daemon ends, so no hold outlives Owlery.

**A daemon from an earlier build** holds nothing, and the window shows no control while that daemon runs. The owner's running daemon is such a one until it is replaced.

Not verified, for the owner's hand run of #24:

- **The Mac itself.** With an agent working in the built app, the Mac stays awake past its idle sleep time while the display sleeps, on battery and on power. It sleeps when the lid closes, and under "Never" as its settings say.
- **How the control looks** in the sidebar's foot, and its menu of the three choices.
- **Against the daemon an earlier build left running**, the window hides the control and says nothing of a hold.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
