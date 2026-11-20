Part of #95. The issue closes when `release/v0.0.1` reaches `main`.

A pane lacked the basics every terminal has. A file dropped on it typed nothing. A click on a URL did nothing. Shift+Enter acted as Enter, and Cmd+W closed the whole window with every pane in it. This change adds those basics, a right-click menu and a card for links, and on macOS it keeps the app running when the window is closed.

| Before | After |
|---|---|
| Cmd+W closed the window and every pane in it | Cmd+W closes the pane in front. It asks first where that pane's agent is working |
| On macOS, closing the window left nothing to show a notification | Closing the window hides it. Owlery keeps running, and notifications keep coming |
| A dropped file typed nothing | Its path is typed into the pane, escaped as a shell reads it |
| A URL or a path in a pane was plain text | A click with the Command key held opens the URL in the browser, shows the path in Finder, or brings another work item's worktree to the front |
| Resting the pointer on a link showed nothing | A card shows the whole target and a row for each action, with the click that does the same |
| A right click did nothing | A menu: Copy, Paste, Select All, Clear Screen, Reset Terminal, Close Pane |
| Shift+Enter sent Enter | It sends a line feed, which Claude Code reads as a line break |
| Command with ←, → and ⌫ did nothing | They send Control+A, Control+E and Control+U, as other macOS terminals do |

**Nothing a pane prints can act on its own.** Every action needs a click with the Command key held, or a press of a card row or a menu item.

- **Links.** A URL opens only if it is `http` or `https`.
- **Paths.** A path becomes a link only where the main process finds a file or a folder at it.
- **Opening and showing.** A file is shown selected in Finder and is never opened in an app. An app bundle is shown, not launched, and this holds when a symbolic link leads to it.
- **The window.** It never leaves Owlery's own page, and no second window opens, whatever a pane prints or a person drops on it.

**What changes for the window's terminal.** "Clear Screen" also has the daemon forget what the pane printed, so the old output does not come back when the person returns to the pane. Modes the program set stay, such as pastes in brackets, so pasting into the program works the same way after a clear. "Reset Terminal" ends those modes as well. A daemon left running from an earlier build does not know the request: there the old output comes back until that daemon ends.

**What changes for anyone who starts the app in tests.** An app started with `OWLERY_BACKGROUND=1` never opens the browser and never shows Finder. It keeps a clipboard of its own and never hides its window on close. `OWLERY_OPENER` names a program that stands in for the browser and for Finder.

Not verified, for the owner's hand run of #24:

- **Window hiding.** On macOS, the red button and Shift+Command+W hide the window. A notification comes while the window is hidden, and a click on it or on the Dock icon shows the window again. "Quit Owlery" ends the app, and a full-screen window first leaves full screen and then hides.
- **Keys and drags a person makes.** Cmd+W pressed through the system menu, and Shift+Enter in a real Claude Code. A file dragged from Finder, and a screenshot dragged from its thumbnail.
- **The system's own apps and clipboard.** A Command click showing a path in Finder or opening the browser. Copy and Paste against the system clipboard.
- **What a person's editing keys do.** Command+Backspace in Claude Code. In zsh it deletes the whole line.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
