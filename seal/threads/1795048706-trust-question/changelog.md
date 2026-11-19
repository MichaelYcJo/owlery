# Changelog: a Claude Code pane that waits before its session starts

Issue #23. The first work item of a repository you never trusted in Claude Code opens on Claude Code's question "Is this a project you created or one you trust?". Claude Code sends Owlery nothing while it asks, so the work item's line stood under "No agent" and no notification came, while the session waited for you.

- **A Claude Code pane that has said nothing 10 seconds after it opened is shown as waiting for you.** Its work item's line moves under "Waiting for you" with the time it has waited, the sidebar's bell counts it, and you are notified where its pane is not in front of you.
- **The line does not say what the pane asks.** Owlery does not read the terminal's screen, so the second row stays the newest commit's subject or the branch. Open the pane to read the question and answer it there.
- **Owlery does not answer the question for you**, and neither reads nor writes Claude Code's record of the folders you trust.
- **Once you answer, the state follows the session as before.** The session's start takes the waiting away, and your first prompt shows it as working.
- **Any question Claude Code asks before its session starts is shown the same way**, a login among them.
- **A start slower than 10 seconds is shown as waiting by mistake**, until the session's start arrives. Claude Code reported its start within two seconds wherever it asked nothing.
- **For a client of the daemon:** a session of a kind that reports state can now carry `state: "waiting"` with a `stateSince` and with `stateText` and `stateTool` both `null`, before any `agent` message arrived under its id. No message and no field is added.
