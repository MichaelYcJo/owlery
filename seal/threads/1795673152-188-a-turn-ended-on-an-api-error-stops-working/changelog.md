# Changelog: a session whose turn ends on an API error asks for the person, where it stayed working

Issue #188. For a turn that ends on an API error, Claude Code sends `StopFailure` in place of `Stop`, and Owlery did not listen to `StopFailure`, so the session kept its "Working" for good.

- **A session whose turn ended on an API error says "Needs you", with the error's text.** The inbox, the view and the pane's foot read it from the same state, and a window that is not in front raises the notification it raises for any wait. Asking again returns the session to working. A pane launched before the daemon of this build started does not report the error: it does after the daemon restarts and the pane is launched again.
