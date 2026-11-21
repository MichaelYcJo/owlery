Part of #109. The issue closes when `release/v0.0.1` reaches `main`.

During the hand check of #24, a work item's menu was mostly "Open in" items: one for Finder and one for each editor and terminal installed on the Mac, seven on the owner's. The owner chose to put them under a submenu. A work item's menu, an archived work item's menu and a repository's menu now hold one "Open in" item, which opens a submenu of Finder, the installed editors and the installed terminals.

| Before | After |
|---|---|
| "Open in Finder", "Open in Visual Studio Code", "Open in Cursor", … at the menu's top level | One "Open in" item with a mark at its right edge. Its submenu lists "Finder", then each installed editor and terminal by its name alone, in the order of `KNOWN_APPS` |
| The menu grew with every app installed | The menu keeps its length. Only the submenu grows |

**By pointer and keyboard.** The submenu opens when the pointer comes onto "Open in", and at a press of it. It closes 300 ms after the pointer comes onto another item of the menu, unless the pointer reaches the submenu first, so a diagonal path to the submenu does not close it. On the keyboard, the Right arrow, Enter and Space open it with the keyboard on "Finder". The Left arrow and Escape close it and return the keyboard to "Open in", with the menu still open. A second Escape closes the menu.

**Near the window's edge.** The submenu stands at the menu's right, or at its left where the right has no room, and moves up where it would pass the window's bottom. `view.ts#submenuPlace` decides the place, and its cases read each side.

**What a press does is unchanged.** An item of the submenu sends the same `open` action the top-level item sent, through the same channel, and a folder that cannot be opened is still named in the status line. `KNOWN_APPS`, `openFolder` and the main process are not touched.

**What it does not change.** A pane's menu and a link's card keep their own "Open in Finder" row. The "Move to" items, which grow with each group, stay at the top level. The window's language is #108.

Not verified, for the owner's hand check:

- **How the submenu and its mark look** in both themes.
- **A real folder opening** in Finder and in each editor and terminal from the submenu. The cases press the items only on a folder that is gone, which `openFolder` answers before it reaches Finder.
- **Whether 300 ms is long enough** for a hand moving the pointer to the submenu.
- **What a screen reader reads** for "Open in" and its submenu.
