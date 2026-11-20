# Changelog: a pane takes a dropped file, a click on a link and Shift+Enter, and Cmd+W closes the pane in front

Issue #95. A pane lacked four things a terminal has. A file dropped on it typed nothing, a click on a URL did nothing, Shift+Enter was Enter, and Cmd+W closed the whole window with every pane in it.

- **Cmd+W closes the pane in front, and no longer the window.** Where no pane is in front, the key does nothing. Shift+Command+W closes the window, and "File / Close Window" shows that key.
- **Closing a pane whose agent is working asks first.** A press of the tab's "×" or Cmd+W opens a dialog that names the tab, with the keyboard on "Cancel". "Close pane" ends the session. Every other pane closes at the first press, as before. A shell pane never asks, whatever runs in it.
- **A file dropped on a pane types its path into that pane**, and the pane takes the keyboard. A space, a quote and every other character a shell reads is written with a backslash before it. Several files are typed with a space between them. A program that asked its terminal for bracketed paste receives the paths as one paste. An image that is on no disk, such as one dragged out of a browser, types nothing.
- **A URL in a pane opens in your browser at a click with the Command key held.** A click without the key does what it did. Only an `http` or `https` address opens. A link a program prints behind a name (the OSC 8 sequence) opens the same way, and the terminal no longer asks first.
- **Shift+Enter sends a line feed, the byte Ctrl+J sends**, in every kind of pane. Claude Code reads it as a line break in the prompt. A shell reads it as Enter. Enter and Option+Enter send what they sent.
- **The app has its own menu.** It reads "Owlery" where it read the package's name, and holds no item on Cmd+K, Cmd+N or Cmd+W, which the window reads itself.
- **The window never leaves Owlery's own page, and no second window opens**, whatever a pane prints or a person drops on the window.
- **`OWLERY_OPENER` names a program that opens a link in place of your browser.** Owlery runs it with the address as its one argument. An app started with `OWLERY_BACKGROUND=1` and without `OWLERY_OPENER` opens no address, so a test or an agent that starts the app never opens your browser.
