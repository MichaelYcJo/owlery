# Changelog: the inbox-first window

Issue #18. The app opened on a pane of terminals with the inbox as a narrow list beside it, so its first impression was a terminal with many buttons. A person who came back could not see what had changed while they were away.

- **The app opens on the inbox, and starts no terminal.** The window shows one line per work item, with its title, its branch, its agent's state and its new commits. No shell opens in your home folder at start any more.
- **The lines stand in groups, in the order you act on them:** "Waiting for you", "Working", "Finished" and "No agent". A sentence above them counts the states, as in "1 waiting for you, 2 working".
- **A preview beside the list shows the selected work item.** J and K move the selection, and Enter opens the work item. The keys are read by their place on the keyboard, so they act under a Korean input source.
- **A work item opens in a view of its own,** with the other work items at the left, its terminals in the middle, and its seal's place, its new commits and "Ask" at the right. Opening a view starts nothing.
- **Terminals live inside a work item.** The "+" buttons that open a pane are in the work item's view, one per kind of pane. The window offers no pane outside a work item.
- **"Ask" asks in the work item you are looking at,** whether or not it has a pane, and lists that work item's sessions alone.
- **When you come back, a summary comes first.** Where a work item changed since you last looked, the app opens on one screen that says it in one sentence, as in "1 waiting for you", with a line per changed work item: "Waits for you. 2 new commits since you were last here." It holds no terminal. "Open the inbox", or Enter, goes on to the inbox, where a filled dot marks the lines that changed.
- **The summary is skipped where nothing changed,** and on the first run. Nothing returns to it until the app is opened again.
- **A look is recorded when the window loses focus, is hidden or closes.** The daemon keeps one, in `last-look.json` in its run folder, so it outlasts the app and the daemon.
- **New commits made while the app was closed count.** The daemon reads each work item's new commits from git before it answers a window that connects. It waits 500 milliseconds at most, and where git takes longer the counts follow a moment later.
- **The look is new: dark, with the owl emblem in the bar.** The window opens at 1440 by 900. It names Space Grotesk, Inter and JetBrains Mono first and draws the system's typefaces where they are not installed. It fetches nothing from the network.
- **A seal's place is on every line, and it is empty.** A dashed ring named "No seal yet" stands where a work item's seal will be. No work item can be sealed before milestone 2.
- **The list of hook events is gone from the window.** Set `OWLERY_DEBUG_HOOKS=1` to have the daemon write each event's name to `daemon.log`.
- **The owl emblem is not under the Apache License.** `TRADEMARKS.md`, linked from both READMEs, says that the Owlery and AgenticSeal names and the emblem are reserved.
- **Not yet:** a line's age, the question an agent asks, the commits by hash and subject, a summary that returns while the app stays open, and anything that needs a seal.
- **For a client of the daemon:** `looked`, with no field, records a look and is answered with nothing; `ready` carries `lastLook`, or `null` where no client ever looked; a hello is answered after the counts are read, and what a client sends before its `ready` is handled after it.
