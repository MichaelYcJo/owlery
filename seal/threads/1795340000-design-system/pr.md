Part of #130. The issue closes when `release/v0.0.2` reaches `main`.

The window had two looks, Night desk and Letter, and no document said how a part of it is drawn. Each change drew its own buttons, lines and menus, and the owner checked each one by hand.

| Done when | What holds now |
|---|---|
| A study proposes two or three directions of Owlery's own style, and names what to avoid | `frame/design.md` of work item `1795340000-design-system`: three directions (Register, Night watch, Desk) with screenshots and mock-ups, and what to avoid with sources |
| The owner chooses a direction, the only question this issue puts to the owner | The owner, 2026-11-22: "default는 B로 하고 나머지 2개도 우리 고를수있는 theme로 하면되지않아?". Night watch is the theme a first run opens in, and Register and Desk are themes the person can choose. Each has a dark and a light appearance |
| `docs/design.md`, in English and Korean, states the principles, the tokens as the one source `themes.css` follows, the components and states, and the voice | `docs/design.md` states the principles, the three themes, every value a theme draws with, the forms of the parts and their states, the voice of the window's words, and what the window stays clear of. A case of the suite fails where a value of the style sheet and the document differ, in either edition |
| A pull request that changes the window carries screenshots of the changed views, and its review reads them against `docs/design.md` | `pnpm run screenshots` starts the built app in the background on invented work items, one in each state, and writes the inbox, a work item's view, a menu and a dialog as PNG files |

**An updated window opens in Night watch.** A window that opened in Night desk opens in Night watch's dark appearance, one that opened in Letter in its light appearance. **Desk is the earlier look**: Desk's dark appearance is the earlier Night desk and its light appearance the earlier Letter.

**The window names the state of a wait "Needs you"** wherever it names it (the inbox's group and head, a view, the summary, the bell, a notification), and a work item with no agent "Asleep". **A state's mark is the theme's own, and none is a speech bubble.**

**Every word of the window can be read where it rests, in every theme**: 4.5:1 or more against the ground it is drawn on, at rest, under the pointer and on a selected line, and a state's mark and the keyboard's focus ring 3:1 or more, held by cases of the suite. The muted and faint inks of every theme, Desk's among them, and the state colours that fell short were raised for it. Three things are outside that floor: the ground drawn only while a part is pressed, the menu's item under the keyboard, and the edges of fields and buttons.

**`docs/product.md` now lets a theme change the form of edges, rules and marks**, and never the layout, the words, the seal's drawing or the wax's red.

### Screenshots

Night watch, the theme a first run opens in, dark and light:

![Night watch dark, inbox](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/night-watch-dark-inbox.png?raw=true)
![Night watch light, inbox](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/night-watch-light-inbox.png?raw=true)
![Night watch dark, a work item](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/night-watch-dark-view.png?raw=true)
![Night watch light, a work item](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/night-watch-light-view.png?raw=true)
![Night watch dark, a work item's menu](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/night-watch-dark-menu.png?raw=true)
![Night watch light, a work item's menu](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/night-watch-light-menu.png?raw=true)
![Night watch dark, New work item](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/night-watch-dark-dialog.png?raw=true)
![Night watch light, New work item](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/night-watch-light-dialog.png?raw=true)

Register and Desk:

![Register dark, inbox](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/register-dark-inbox.png?raw=true)
![Register light, inbox](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/register-light-inbox.png?raw=true)
![Register dark, a work item](../blob/b6201b295b5d76b478063c3378bd3db66e4096a3/seal/threads/1795340000-design-system/screenshots/register-dark-view.png?raw=true)
![Register light, a work item](../blob/b6201b295b5d76b478063c3378bd3db66e4096a3/seal/threads/1795340000-design-system/screenshots/register-light-view.png?raw=true)
![Desk dark, inbox](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/desk-dark-inbox.png?raw=true)
![Desk light, inbox](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/desk-light-inbox.png?raw=true)
![Desk dark, a work item](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/desk-dark-view.png?raw=true)
![Desk light, a work item](../blob/e974e843d0ea2567f5f79bd82229d68cf3b562af/seal/threads/1795340000-design-system/screenshots/desk-light-view.png?raw=true)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
