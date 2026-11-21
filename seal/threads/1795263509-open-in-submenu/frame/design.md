# Design: the Open in submenu (#109)

## Grounding

The tree as read at `89a2073`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/product.md`, `docs/architecture.md` and `docs/roadmap.md`, searched for `menu`, `Finder` and `Open in` | No sentence of the policy root states what a work item's menu or a repository's menu holds. `docs/` holds no `README.md`, and no document of it carries a `check:` line. |
| `seal/threads/1795152521-work-item-menu/frame/design.md` *Rule changes*, not settled yet | It adds to `docs/roadmap.md` *Milestones* that the menus hold "rename, open in, copy, pin, mute, groups" and more. That sentence stays true with a submenu, so this work changes no rule. |
| `seal/threads/1795152521-work-item-menu/frame/design.md` *Scope* items 5 to 7 and 12 | They are the frame the menus were built to: a menu is an element with the role `menu` drawn in the window, the arrows move through its items, Escape closes it and returns the keyboard, and "Open in" lists Finder and the installed apps of the main process's list. This work keeps each of them and adds one level. |
| `seal/threads/1795152521-work-item-menu/frame/plan.md` *Alternatives considered*, the rows "The menu drawn by the system" and "The menu drawn in the window, chosen" | The window draws the menu because the debugging port cannot open or read the system's. That decision is not argued again here. |

What the reading and the commands gave:

- `read`: `routing.md` of this work item, at `89a2073`. Planning is `framer`, implementation is `crafter`, and the review goes straight to the pull request.
- `executed`: `gh issue view 109 --json body,comments,milestone`. The issue has no comment, and its milestone is `release: 0.0.1`. The body is the one the spawn folded.
- `read`: the owner's decision of 2026-11-21, as the spawn and `routing.md` give it: "openIn은 하위로 두자", the items that open a folder go under a submenu. Nobody but the orchestrator heard it, and the issue's first paragraph states the same.
- `read`: `apps/desktop/src/renderer/view.ts:1046-1139`. `MenuEntry` holds `label`, `description`, `action` and `divides`. `openEntries` gives "Open in Finder" with `divides: true`, then one "Open in <name>" for each installed app. `workItemMenu` puts those entries after Rename, and after Restore for an archived work item. `repositoryMenu` puts them after New group.
- `read`: `apps/desktop/src/renderer/menu.ts`, whole. One menu is open at a time, held in `shown`. `openMenu` draws a `div.menu` with the role `menu` into `document.body`, places it inside the window with `Math.max(0, Math.min(at, inner - box))`, and puts the keyboard on its first item. `onKey` reads Escape, Tab, ArrowDown and ArrowUp. `onPress` closes the menu at a `pointerdown` outside its element. `items` reads every `[role="menuitem"]` under the menu's element.
- `read`: `apps/desktop/src/renderer/renderer.ts:433-492`. `pressMenu` sends an `open` action to `window.owlery.openFolder` and writes a failure's sentence to the status line with `tell`. `openRepositoryMenu` and `openWorkItemMenu` are the only callers of `openMenu`.
- `read`: `apps/desktop/src/renderer/index.html:379-387`. The menu's styles stand there, under the class `menu`. The renderer holds no `renderer.css`.
- `read`: `apps/desktop/src/main/openers.ts`. `KNOWN_APPS` lists the editors before the terminals, and `installedApps` keeps that order. `openFolder` answers `<folder> is gone.` for a path nothing stands at, before Finder or an app is reached.
- `read`: `apps/desktop/src/renderer/work-item-view.ts:349-405`. A pane's menu, `#pane-menu`, is drawn by code of its own and holds no submenu.
- `executed`: `git grep -n submenu 89a2073 -- apps/desktop/src`. It prints lines of `src/main/menu.ts` and `src/main/main.ts` alone, which build the application menu the system draws. Nothing in the renderer draws a submenu or could be extended into one but `menu.ts`.
- `executed`: `git grep -n -e 'Open in Finder' -e 'Open in \${' 89a2073 -- apps docs README.md`. The lines it prints stand in `view.ts#openEntries` and the comments of `workItemMenu` and `repositoryMenu`, in the cases of `describe("workItemMenu")` and `describe("repositoryMenu")` of `test/view.test.ts`, and in `test/work-item-menu.test.ts` at `items`, `archivedItems`, `repositoryItems` and line 194. The other lines it prints are of a link's card (`view.ts:971`, `test/view.test.ts:2246`, `test/terminal-basics.test.ts:765`), which this work leaves.
- `read`: `apps/desktop/test/work-item-menu.test.ts:1-215`. The cases drive the built app through the debugging port, find a menu with `[role="menu"]`, read its items with `[role="menu"] [role="menuitem"]`, and press no "Open in" item, because a press acts on the desktop of whoever runs the suite.
- `read`: `apps/desktop/test/terminal-basics.test.ts:846-856`. A case moves the pointer over the page with `Input.dispatchMouseEvent` of the type `mouseMoved`, so a case can bring the pointer onto an item without a press.
- `executed`: `grep -n 'fs.watch\|watch(\|setInterval' apps/desktop/src/daemon/*.ts` prints nothing. The daemon reads a worktree's folder only when asked, so a case can move a folder aside and back between two requests.
- `executed`: `gh issue view 108 --json title,state,milestone,body` and `git branch -r`. Issue #108, the window's language, is open with no milestone and no branch. `gh pr list --state open` prints nothing.
- `executed`: `grep -ln 'Process changes' seal/threads/*/changelog.md` prints nothing, and `gh release view` answers `release not found`. No process change is on record.
- `read`: `seal/follow-up.md` does not exist, so no item waits on this work.

No probe was run and no check of the repository's was run. Each question the issue left open was answered by the files above.

## Scope

In scope:

1. **The entry of a submenu.** `apps/desktop/src/renderer/view.ts` splits `MenuEntry` in two. A `MenuItem` holds `label`, `description`, `action` and `divides`, as an entry does at `89a2073`. A `Submenu` holds `label`, `description`, `divides` and `opens`, a list of `MenuItem`, and no `action`. `MenuEntry` is either of them. The type allows one level: an item of a submenu opens no submenu.
2. **One "Open in" entry in each menu that opens a folder.** `openEntries` gives one `Submenu` in place of its list: the label "Open in", `divides: true`, and a description that names the folder with `whose` and says the entry lists Finder, the editors and the terminals. Its `opens` holds "Finder" first, with the action and the description "Open in Finder" has at `89a2073`, then one item for each of `apps` in the order it arrives, labelled with the app's name alone, with the action and the description "Open in <name>" has at `89a2073`. No item of the submenu has `divides: true`. `workItemMenu` holds the entry where it holds the list at `89a2073`, in the menu of a work item and of an archived one, and `repositoryMenu` does the same. Where no app is installed, or the main process has not answered yet, the submenu holds Finder alone.
3. **How the entry is drawn.** `apps/desktop/src/renderer/menu.ts` draws a `Submenu` as an item with the role `menuitem`, `aria-haspopup="menu"` and `aria-expanded`, which reads `false` until its submenu is open and `true` while it is. The item's `textContent` is its label alone, and a mark at its right edge, drawn by the style or by a drawing that holds no text, shows that it opens a submenu. While its submenu is open, the item keeps the background of an item under the pointer. Its `title` is its description. The open submenu is a second element with the class `menu`, the role `menu` and the `aria-label` of the entry's label, drawn into `document.body` after the menu, with one `menuitem` for each item of `opens`. It stands in the page only while it is open.
4. **The pointer.** The submenu opens when the pointer comes onto the "Open in" item, and at a press of the item, which closes nothing. It stays open while the pointer is on the item or on the submenu, and after the pointer leaves both for a place that is no other item of the menu. Where the pointer comes onto another item of the menu, the submenu closes after a pause of 300 ms, a named constant of `menu.ts`, unless the pointer reaches the submenu first.
5. **The keyboard.** The Down and Up arrows move through the menu's items, the "Open in" item among them. With the keyboard on that item, ArrowRight, Enter and Space open the submenu and put the keyboard on its first item. Inside the submenu the Down and Up arrows move through its items and stop at each end, Enter and Space press the item the keyboard is on, and ArrowLeft and Escape close the submenu and return the keyboard to the "Open in" item, with the menu still open. Wherever the submenu closes while the keyboard is in it, the pause of item 4 among them, the keyboard returns to the "Open in" item. With the keyboard in the menu, Escape closes the menu and an open submenu together, as it closed the menu before this work. The Tab key leaves the keyboard where it is. A press inside the submenu on no item leaves it open with the keyboard on the submenu itself, where its keys are still read. Where the keyboard moves to another item of the menu, the submenu closes at once.
6. **Closing.** A press of an item of the submenu closes the submenu and the menu, returns the keyboard as `closeMenu` does at `89a2073`, and hands the item's action to `press`. A press outside both elements closes both, and a press inside either closes neither. `closeMenu` removes both elements and clears the pause's timer. `menuOpen` answers as it does at `89a2073`.
7. **The submenu's place.** `view.ts` gains `submenuPlace`, a function of the menu's box, the item's top edge, the submenu's size and the window's size. The submenu's left edge stands at the menu's right edge and its top edge at the item's top edge. Where its right edge would pass the window's, its right edge stands at the menu's left edge. Where neither side has room, it is moved inside the window and may cover part of the menu; where the window is narrower than the submenu, its left edge stands at the window's left edge. Where its bottom edge would pass the window's, it is moved up, and never above the window's top. `menu.ts` places the submenu with it.
8. **What a press does.** `renderer.ts#pressMenu` is not changed. An item of the submenu carries the `open` action its top-level item carries at `89a2073`, so a folder opens through the same channel, and a failure's sentence reaches the status line as it does at `89a2073`.
9. **The comments that state the old shape.** The comments of `workItemMenu`, `repositoryMenu`, `openEntries`, `MenuEntry` and `MenuAction` in `view.ts`, the head of `menu.ts`, the doc comments of `onKey`, `onPress`, `closeMenu` and `openMenu`, the comment over the menu's styles in `index.html`, and the head of `test/work-item-menu.test.ts`, which says no case presses an "Open in" item, are rewritten in place to state the new one.

Out of scope:

- The window's language. Issue #108 keeps it.
- The "Move to" items of a work item's menu, which also grow, with each group. The issue asks for the items that open a folder alone.
- A pane's menu and a link's card, `work-item-view.ts`, with their own "Open in Finder" row.
- `KNOWN_APPS`, `installedApps`, `openFolder` and the channels of the main process.
- A submenu inside a submenu, the Home and End keys, and a jump to an item by its first letter. No menu of the tree at `89a2073` reads those keys.

## User scenarios & acceptance *(mandatory)*

The cases of `test/view.test.ts` run without the app. The cases of `test/work-item-menu.test.ts` drive the built app, as that file does at `89a2073`.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The entries of a work item's menu | Given a work item and the apps Zed, an editor, and Warp, a terminal. Then `workItemMenu` holds Rename, "Open in", Copy path, Copy branch name, Pin, Mute notifications, Archive and Delete, in this order. "Open in" has `divides: true`, no `action`, and `opens` of Finder, Zed and Warp, each with the `open` action of the work item's worktree and `app` null, "Zed" and "Warp". | A case of `describe("workItemMenu")` in `test/view.test.ts` |
| 2. An archived work item's and a repository's | Given the same apps. Then the menu of an archived work item holds Restore, "Open in", the two copies and Delete, and `repositoryMenu` holds Settings, Change icon, Show archived work items, New group, "Open in", Copy path, Hide from sidebar and Remove. Each "Open in" opens Finder, Zed and Warp on the folder its menu copies. | Cases of `describe("workItemMenu")` and `describe("repositoryMenu")` in `test/view.test.ts` |
| 3. No app installed | Given no app. Then each menu still holds "Open in", and its `opens` holds Finder alone. | The cases "offers Finder alone" of both `describe` blocks, rewritten |
| 4. Descriptions | Every entry of each menu, and every item of each submenu, has a description that is a sentence, is not its label, and is no other's of the same menu or submenu. | The case of `describe("a description on hover")` in `test/view.test.ts`, read over `opens` too |
| 5. The submenu's place | Given a menu with room at its right. Then `submenuPlace` gives the menu's right edge and the item's top edge. Given no room at the right and room at the left, then the submenu's right edge is the menu's left edge. Given room at neither, then the submenu stands inside the window. Given an item near the window's bottom, then the submenu's bottom edge is the window's, and its top is never above 0. | Cases of a new `describe("submenuPlace")` in `test/view.test.ts` |
| 6. The menu in the built app | When a work item's menu, an archived work item's menu and a repository's menu open. Then each holds its items of scenarios 1 and 2 in order, with one "Open in" and no "Open in <app>". The "Open in" item has `aria-haspopup="menu"`, `aria-expanded="false"` and a `title`, and no element with the `aria-label` "Open in" stands in the page. | The cases of `test/work-item-menu.test.ts` that read `items()`, `archivedItems()` and `repositoryItems()`, rewritten, and the case of the descriptions on hover |
| 7. The keyboard | Given a work item's menu open with the keyboard on "Open in". When ArrowRight is pressed. Then a second `menu` named "Open in" stands in the page, its items are Finder and then the names `installedApps` gives on this Mac, the keyboard is on Finder, and the item's `aria-expanded` is `true`. ArrowUp leaves the keyboard on Finder, and ArrowDown past the last item leaves it on the last. When ArrowLeft is pressed. Then the submenu is gone, the menu stands, and the keyboard is on "Open in". Enter opens the submenu again. Escape closes the submenu alone, and a second Escape closes the menu and returns the keyboard to the line. | A new case of `test/work-item-menu.test.ts` |
| 8. The pointer | Given a repository's menu open. When the pointer comes onto "Open in" with no press. Then the submenu stands in the page. When the pointer goes onto an item of the submenu, then it still stands. When the pointer goes onto Copy path, then the submenu leaves. When "Open in" is pressed, then the submenu and the menu both stand. When a place outside both is pressed, then both are gone. | A new case of `test/work-item-menu.test.ts`, with `mouseMoved` |
| 9. A press of an item of the submenu, and its failure | Given a work item whose worktree folder the case moved aside. When its menu's "Open in" is opened and Finder is pressed. Then the submenu and the menu are gone and the status line says `<the folder> is gone.` The case moves the folder back. Nothing opens on the desktop: `openFolder` answers a path nothing stands at before it reaches Finder. | A new case of `test/work-item-menu.test.ts`. That a folder which stands opens in Finder and in each app is the hand check's, as `seal/threads/1795152521-work-item-menu/gaps.md` row "That Finder, an editor and a terminal open" leaves it |
| 10. The submenu at the window's edge | Given a menu so near the window's right edge that the submenu has no room at its right. When the submenu opens. Then its box stands inside the window and to the left of the menu's. | A new case of `test/work-item-menu.test.ts`. The builder chooses how the case brings a menu there, a press near the right edge of a line of the inbox or a narrower page, and writes the choice in the phase record |

## Data & interfaces

`apps/desktop/src/renderer/view.ts`:

```ts
export interface MenuItem { label: string; description: string; action: MenuAction; divides: boolean }
export interface Submenu { label: string; description: string; opens: readonly MenuItem[]; divides: boolean }
export type MenuEntry = MenuItem | Submenu;
export function submenuPlace(menu: { left: number; right: number }, top: number, size: { width: number; height: number }, within: { width: number; height: number }): { left: number; top: number };
```

`MenuAction` keeps its members. `workItemMenu` and `repositoryMenu` keep their parameters and return `MenuEntry[]`.

`apps/desktop/src/renderer/menu.ts`: `openMenu`, `closeMenu` and `menuOpen` keep their signatures. `apps/desktop/src/main/menu.ts` exports another type named `MenuEntry`, of the application menu, which this work does not touch.

`apps/desktop/src/renderer/index.html`: the styles under the class `menu` gain the mark of an item that opens a submenu. No element is added to the page's markup, and no id.

No message of the daemon's protocol, no channel of `src/shared/ipc.ts` and no stored file changes.

## Rule changes

- nothing
  why: no sentence of the policy root states which items a menu holds, and the sentence the unsettled design of `1795152521-work-item-menu` adds to `docs/roadmap.md` names "open in" among a menu's items, which a submenu keeps true.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The top-level items "Open in Finder" and "Open in <app>" of a work item's menu, an archived work item's and a repository's | `apps/desktop/src/renderer/view.ts#openEntries` | The items of the "Open in" submenu, labelled "Finder" and with the app's name, each with the action and the description it had |
| The pins of those top-level labels | `apps/desktop/test/view.test.ts`, the cases of `describe("workItemMenu")` and `describe("repositoryMenu")`; `apps/desktop/test/work-item-menu.test.ts`, `items`, `archivedItems`, `repositoryItems` and the line that expects the keyboard on "Open in Finder" | The same cases, rewritten to pin "Open in" and its `opens`, and scenario 7's case for the submenu's items in the built app |
| The sentence that no case presses an "Open in" item | `apps/desktop/test/work-item-menu.test.ts`, the comment at the file's head | Scenario 9's case presses one, on a folder that is gone. The comment then says that no case presses one on a folder that stands |

The work adds no gate, check, hook, rule or mark, so nothing is owed in return for one.

Framed 2026-11-21 by framer, before the build.
