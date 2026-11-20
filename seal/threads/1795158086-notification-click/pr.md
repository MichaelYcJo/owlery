Part of #31. The issue closes when `release/v0.0.1` reaches `main`.

A notification that a work item waits for the person now opens it. A click on the notification brings Owlery's window forward, opens that work item's view and puts the pane that raised the notification in front. Where the work item is no longer listed, the click only brings the window forward. An app started in the background by an agent (`OWLERY_BACKGROUND=1`) never takes focus from a click.

Whether macOS runs the page's click handler for a person's press on a real banner, and on its entry in Notification Center later, is not verified: the cases replace the notification with a recorder so that none appears on the owner's screen. The owner checks it in the hand run of #24.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
