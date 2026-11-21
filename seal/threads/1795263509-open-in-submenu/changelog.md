# Changelog: the "Open in" submenu

Issue #109. A work item's menu and a repository's menu each held one "Open in" item for Finder and one more for every editor and terminal installed on the Mac, at the menu's top level. On a Mac with several of them, those items took up most of the menu.

- **One "Open in" item.** A work item's menu, an archived work item's menu and a repository's menu each hold one item named "Open in", where the list stood. It opens a submenu beside the menu. The submenu lists Finder first, then each installed editor, then each installed terminal, each by its name alone. Where none is installed, the submenu holds Finder alone.
- **With the pointer.** The submenu opens when the pointer comes onto "Open in", and at a press of it. It stays open while the pointer moves across the menu's other items on its way to the submenu, and closes 0.3 seconds after the pointer came onto another item and stayed off the submenu. A press outside the menu and the submenu closes both.
- **With the keyboard.** With the keyboard on "Open in", the Right arrow, Enter and Space open the submenu and put the keyboard on Finder. The Up and Down arrows move through the submenu, and Enter opens the folder in the item the keyboard is on. The Left arrow and Escape close the submenu and leave the menu open, with the keyboard back on "Open in". A second Escape closes the menu.
- **Near the window's edge.** The submenu stands at the menu's right. Where the window has no room there, it stands at the menu's left, and it is moved up where it would pass the window's bottom.
- **What a press does is unchanged.** An item of the submenu opens the folder as the top-level item did, and a folder that cannot be opened is still named in the status line.
