# Changelog: a click on a notification opens the work item that waits

Issue #31. Owlery raises a notification when a session waits for you or finishes, and a click on it did nothing.

- **A click on a notification brings Owlery's window in front of you**, out of the Dock where it is minimized, and makes Owlery the active app.
- **The click opens the view of the work item the notification names**, with the pane that waits or finished in front of it. Where that pane is closed by then, the view opens as it opens from the inbox.
- **A click opens no view for a pane without a work item**: the window comes forward and stays on the screen it showed.
- **The "New work item" form stays open at a click**, with what you typed in it, and the view opens behind it.
- **A notification raised before the window reloaded opens nothing.** The window reloads when its connection to the daemon closes, and a click on a notification from before that makes Owlery the active app at most.
