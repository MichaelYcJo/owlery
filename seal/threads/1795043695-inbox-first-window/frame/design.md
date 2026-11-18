# Design: the app opens on the inbox, not on a pane of terminals

The ticket is issue #18.

## Grounding

The tree as read at `12cd34f`. The window's code as issue #8 leaves it was read at `d3bc681`, the tip of `feat/8-the-daemon-launches-no-headless-session`, because #8 merges before this work is built (`frame/plan.md` *Overlap with the release*). #8 has since merged into `release/v0.0.1` as `ed91bb6`, and this branch merged that as `2a45d69`. `git diff --stat d3bc681 2a45d69 -- apps/desktop` printed nothing (`executed`), so what this section says of `apps/desktop` at `d3bc681` holds at `2a45d69`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/product.md` *Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call*, first paragraph | The app opens on the inbox and not on a pane of terminals. Each work item shows its state on one line. A person who comes back first sees how many work items are in which state |
| `docs/product.md` *Foundation*, "The sessions a person drives open in a terminal" and "The app reads only what the inbox needs" | A session the person drives stays the agent's own CLI in a terminal pane, so the work item's view holds terminals and no chat. The line reads the agent's state from hooks and the new commits from git, which the daemon already sends |
| `docs/product.md` *The seal*, "The app shows this seal in three places", and `docs/roadmap.md` *Milestones*, row 2 | The seal on a work item is milestone 2's. This work reserves its place on the inbox line and in the view's header, and shows there that the work item has no seal yet |
| `docs/roadmap.md` *Milestones*, row 1 | Terminal panes open the user's agent CLI in the work item's worktree. The window offers a pane only inside a work item |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 and 2 | The window names no vendor. The buttons that open a pane are built from the kinds the daemon lists in `ready` |
| `docs/architecture.md` *Overall layout*, "Agent state is judged from events, never guessed from what the terminal screen prints" | The line and the view's header read the state the daemon keeps, through the function that already gives the inbox line |
| `docs/architecture.md` *The phone: the terminal session as a chat*, "the daemon's WebSocket protocol is not fitted only to the desktop UI, and no state lives on the UI side" | The protocol does not change for the window's layout. Which screen is in front is the window's own and is kept nowhere |
| `docs/architecture.md` *Memory design*, rows 1 and 3 | One window, so the two screens are two states of one page. A terminal screen only for a visible pane is issue #9's measurement, and this work makes none at start (*Scope* item 6) |
| `docs/product.md` *What we deliberately don't do*, "We do not build an IDE, a kanban board or a built-in browser" | The inbox is a list of lines and not a board of columns |
| `docs/name.md` *What to keep in mind* and `docs/architecture.md` *License and code from other projects*, "Other products' names and logos are not used" | The look borrows no image of the Hogwarts owlery, and no name, logo or copied screen of Orca, Paseo or another product |
| `docs/name.md` *Why this name*, "The seal stays in the emblem", and `docs/architecture.md` *What we take from AgenticSeal*, first paragraph | AgenticSeal's emblem, the little owl on a red wax seal, is what the seal's place draws. A file taken from AgenticSeal keeps its notice, and the emblem's notice is not the MIT License's (the two bullets below on the drawings) |

What reading and probes gave, each labelled:

- `executed`: `gh issue view 18 --json body,comments` on 2026-11-19 gave the body the frame is drawn from and no comment.
- `read`: `seal/threads/1795043695-inbox-first-window/routing.md` at `12cd34f`. It says the build waits on the owner choosing one of the mockups.
- `executed`: `ls seal/follow-up.md` found no file. `gh release view --json body --jq .body` answered "release not found". `grep -n 'Process changes' seal/threads/*/changelog.md` printed nothing.
- `executed`: `ls /Users/michael/Documents/GitHub/owlery/etcs/research/ux.md` found no file on 2026-11-19, so the design study's comparison was not read. No mockup existed to read either.
- Nobody's finding, relayed by the orchestrator's spawn prompt: the owner said on 2026-11-19 that the window reads as "just a terminal with a lot of buttons", that Orca, Paseo and other products are references and are not to be copied, and that the work is "a rebranding toward the goal we should aim for". The owner answered on 2026-11-19 that the rebranding reaches the name, the app's icon and the README, and issue #21 carries that reach (`frame/questions.md` Q2). Which mockup the window follows is still the owner's to answer (`frame/questions.md` Q1).
- Nobody's finding, relayed by the orchestrator's message during the framing: the owner decided on 2026-11-19 that the seal uses "the owl seal design we already made in AgenticSeal" and no new drawing. The owner chose the form of the licence note on 2026-11-19: a `TRADEMARKS.md` linked from both READMEs (`frame/questions.md` Q3).
- `executed`: `ls` of `/Users/michael/.claude/plugins/cache/agenticseal/agentic/0.38.2/assets/seals/` lists `owl.svg`, `horned-owl.svg`, `owl-icon-cream.svg` and `owl-icon-coral.svg` among its files. `shasum -a 256` of `owl-icon-cream.svg` there gave `fa8ffa5d357ecb3cc17cb9636e04564e0ce45c1b162f7dc8dd904f1e509aa27d`, and `wc -c` gave 4925 bytes.
- `read`: that directory's `README.md`, *The little owl*, "The directory icon". `owl.svg` is the detailed drawing, whose fret border, scallops and thin lines blur together in a small tile. `owl-icon-cream.svg` keeps the wax outline and draws the owl in flat shapes with fewer, thicker lines for that size. The file refers to nothing outside itself.
- `read`: the plugin's `TRADEMARKS.md` at 0.38.2. The AgenticSeal name, the owl emblem and its seal drawings are not under the plugin's MIT License: "All rights reserved", and every `.svg` under `assets/seals/` is named. This repository's `LICENSE` is the Apache License 2.0, its `README.md` *License* names that licence alone, and the tree holds no `TRADEMARKS.md` and no `NOTICE` (`ls` of the top directory, `executed`).
- `read`: `apps/desktop/src/renderer/index.html`, `renderer.ts` and `view.ts`, `src/shared/protocol.ts`, `src/shared/ipc.ts`, `src/daemon/daemon.ts`, `src/daemon/main.ts`, `src/main/main.ts`, `build.mjs` and `test/view.test.ts` at `12cd34f`, whole. The diff of `src/renderer/` and `src/shared/protocol.ts` between `c796df1` and `d3bc681`, whole, and the `ask` case of `src/daemon/daemon.ts` at `d3bc681`.
- `read`: the daemon needs no change for this layout. `ready` and `inbox` carry every session with its `workItemId` and `state` and every work item with its `newCommits` (`src/shared/protocol.ts` at `12cd34f`). `start` takes a `workItemId`. `attach` answers with a `replay` of the session's output, and a client receives a session's output only after it started or attached it (`src/daemon/daemon.ts#handle`, `#sendOutput`). At `d3bc681`, `HeadlessInfo` carries `workItemId`, and `ask` needs a work item and a prompt and no pane.
- `read`: `@xterm/addon-fit` 0.11.0, the version `apps/desktop/package.json` pins, in `src/FitAddon.ts#proposeDimensions`. Where the terminal's parent element is not displayed, the computed width and height do not parse to numbers, and `fit` returns without resizing. A terminal prepared while its screen is hidden keeps xterm's default size until it is shown and fitted.
- `executed`, the searches the acceptance table cites, each run with `git grep` at `12cd34f` and at `d3bc681`:
  - `git grep -n -i -e claude <commit> -- apps/desktop/src/renderer` printed nothing at both commits and exited 1.
  - `git grep -n -e 'id="events"' -e 'Hook events' -e 'getElementById("events")' <commit> -- apps/desktop/src/renderer` printed two lines of `index.html` and one of `renderer.ts` at both commits. The build removes all three (`## Removes`, the hook events row).
  - `git grep -n -e workItemInFront -e paneToOpen <commit> -- apps/desktop` printed lines of `src/renderer/renderer.ts`, `src/renderer/view.ts` and `test/view.test.ts` alone at both commits, `workItemInFront` only at `d3bc681`. The build removes every one (`## Removes`, the rows of the two functions).
  - `git grep -n -e 'pane-kinds' -e 'kindButtons' -e 'start(first.kind)' <commit> -- apps/desktop/src/renderer` printed two lines of `index.html` and three of `renderer.ts` at both commits. The build removes every one (`## Removes`, the rows of the top bar's buttons and of the pane started at `ready`).
  - `git grep -n -e TRADEMARKS.md <commit> -- README.md README.ko.md` printed nothing at both commits and exited 1. `git grep -n -i -e licen 12cd34f -- README.md` printed the two lines of the README's licence section, so the files are searched.
- `executed`: `git grep -c createElement <commit> -- apps/desktop/src/renderer/renderer.ts` gave 10 at `12cd34f` and 11 at `d3bc681`. `git grep -n 'type: "start"' 12cd34f -- apps/desktop/test/daemon.test.ts` printed 13 lines, 10 of them without `workItemId`. `frame/plan.md` *Alternatives considered* rests two verdicts on these.

The chosen mockup's link goes here when the owner has chosen (`frame/questions.md` Q1): the orchestrator's fold writes it as one line under this sentence, and *Scope* item 13 cites it.

## Scope

1. **Two screens in the one window, one shown at a time**: the inbox screen and a work item's view. The window shows the inbox screen at every load, the reload after the daemon went away among them. Which screen is in front is the window's own state.
2. **The inbox screen** takes the window's full width. It holds the summary of item 3, the control that opens the "New work item" form, and one line per work item in the order the daemon lists them. A line holds five parts: the title, the branch, the agent's state, the new commits, and the seal's place of item 15, which is the line's last part. The first four parts are what `inboxLine` of `src/renderer/view.ts` gives today, unchanged. An inbox with no work item says so and keeps the control. No terminal is displayed on the inbox screen.
3. **The summary** says how many work items are in each agent state, the state a person must act on first: `waiting`, then `working`, then `finished`, as in "1 waiting · 2 working". A state no work item is in is left out, and the summary is empty where no line has a state.
4. **A work item's view** opens when its line is pressed. Its header holds the control that returns to the inbox, and the work item's title, branch, agent state and new commits, and the seal's place of item 15. The first four of these come from the same `inboxLine` as the line's, at `ready` and at every `inbox`. Under the header are the pane area of items 5 to 7 and the "Ask" section of item 9. Opening a view starts no process.
5. **The pane area** holds one tab per pane of this work item, one button per kind of pane the daemon offers, and the terminal of the tab in front. A button starts a pane of its kind in this work item, with a `start` that carries the work item's id. A tab's label is the kind's label and the pane's id, without the work item's title, which the header says. Each tab keeps its close control. Where the work item has no tab, the area says so and offers the same buttons.
   - The tabs are the work item's sessions the daemon lists that are alive, and those whose terminal this window holds. A pane that exits while the window holds its terminal keeps its tab and its last screen until it is closed, as today.
   - The tab in front when a view opens is the one last in front in that view since the window loaded, where it is still a tab, and otherwise the most recent live pane.
6. **A terminal is made when its pane is first in front.** At `ready` the window attaches no session and starts none. A pane the daemon lists gets its terminal, an `attach` and its `replay` the first time its tab is in front. A terminal the window made stays, hidden, until its pane closes, as today. Disposing of hidden terminals is issue #9's.
7. **Creating a work item** starts from the inbox screen's control and the form as it is, the choice of the first pane's kind included. When the daemon answers `workItemCreated`, the window opens the new work item's view with the new pane in front. The pane's process has the size of the pane as shown: a terminal prepared while the view is hidden is fitted when it is shown, and the fit sends `resize`.
8. **The window offers a pane only inside a work item's view.** The top bar's "+" buttons of the pane kinds go, and so does the pane the window starts by itself where the daemon lists none. A session the daemon lists with `workItemId: null` has no line and no tab.
9. **The "Ask" section of issue #8 moves into the work item's view.** It holds the field, the "Ask" button and the list of the headless sessions of this work item alone, the most recent first. The button asks in the view's work item, whether or not the work item has a pane. The button is disabled, with a title that says why, while the field is empty or holds white space alone. The rule that one press sends one `ask` until the daemon answers stays. The field is emptied when the view of another work item opens.
10. **The list of hook events leaves the window.** The window draws nothing for an `agent` message. The message stays in the protocol and the daemon, where its cases and the phone's chat read it.
11. **The notification's rule is unchanged**: `notificationFor` decides as it does today. The pane in front is the tab in front of the view on screen while the window has focus. On the inbox screen no pane is in front, so a session that starts to wait is notified there as well.
12. **One status line stays on both screens** for the text the window shows today: that it is reconnecting to the daemon, and the message of a refused request that no form shows.
13. **The look follows the mockup the owner chose** (`frame/questions.md` Q1), and its link stands in `## Grounding`. The colours, the typefaces and the spacing are custom properties of `:root` in `src/renderer/index.html`, so the choice is folded in by their values and by the layout of the two screens. Until the choice, the properties hold the present dark palette. Items 1 to 12, 14 and 15 do not wait for the choice.
14. **The window names no vendor**, as today.
15. **The seal's place draws AgenticSeal's owl emblem, and no new drawing.**
    - The drawing is `owl-icon-cream.svg` of the AgenticSeal plugin 0.38.2, committed byte for byte as `apps/desktop/assets/seals/owl-icon-cream.svg`. `apps/desktop/build.mjs` copies it into `dist/`, and the page shows it as an image from there. No other drawing of the plugin is committed, because the window shows no other.
    - No work item can be sealed before milestone 2. Until then the place shows the emblem dimmed by the page's style, with the accessible name and the title "No seal yet", on every line and in every view's header. The undimmed emblem is what milestone 2 shows for a sealed work item. How dim, and at what size, follows the chosen mockup (item 13).
    - The repository says that the emblem is not under its licence. A `TRADEMARKS.md` at the top of the tree says that the Apache License 2.0 covers the code, and that the Owlery and AgenticSeal names, the owl emblem and the drawing under `apps/desktop/assets/seals/` are not licensed under it, all rights reserved. `README.md` *License* and `README.ko.md` *라이선스* each gain one sentence that links it. `## Rule changes` states the same in `docs/architecture.md` and its Korean edition. The owner chose this form on 2026-11-19, in answer to `frame/questions.md` Q3.
16. Out of scope, each with its reason:
    - Removing the pane without a work item from the daemon and the protocol (`start` without `workItemId`, `DaemonOptions.cwd`). `frame/plan.md` *Alternatives considered* holds the grounds, and the framer's hand-back names it as a follow-up.
    - Disposing of a hidden terminal, a `detach` message, and showing several panes side by side. Issue #9 measures four visible terminals and owns what it needs for that.
    - The seal itself, the approval line, the inbox states `sealed` and `broken`, and the back of the seal (milestones 2 and 3).
    - A headless session on the inbox line, and a notification when one ends. Issue #8 leaves both not done (`gaps.md` of `1795042041-headless-session` at `d3bc681`), and #18 asks for neither.
    - Sorting, filtering or grouping the inbox, and removing a work item (milestone 4).
    - What a click on a notification does, and keeping the open view across a reload. Neither is asked, and each needs the main process or a place to keep the window's state.
    - Any change to `docs/`, the README, the app's icon or the product's name beyond the licence note of item 15. The owner answered `frame/questions.md` Q2 on 2026-11-19: the rebranding reaches them, as a work item of its own. Issue #21 holds the app's icon, the opening of both READMEs, the *Emblem* row of `docs/name.md` *Open decisions* and whether the name stays.
    - The daemon that dies where its run folder's path is too long (issue #19).

## User scenarios & acceptance *(mandatory)*

"The drive" is one run of the built app through Electron's debugging port by the phase's builder, as the phases of issues #7 and #8 ran it, with a short `--user-data-dir` (issue #19). `<base>` is `ed91bb6`, the commit of `release/v0.0.1` this branch merged before phase 1's first edit.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The app opens on the inbox | Given a daemon that lists two work items, one with a live pane, when the window loads, then the inbox screen is displayed at the window's width with both lines, the work item's view is not displayed, the page holds no terminal element, and the daemon's list of sessions is as it was before the load | The drive: the two screens' `hidden` state, the count of `.xterm` elements, and the sessions of the `ready` a second client receives |
| 2. A line says its parts | Given a work item whose agent waits and whose branch gained two commits, then its line shows the title, the branch, `waiting`, "2 new commits" and, in the seal's place, the dimmed owl emblem named "No seal yet" | The existing cases of `inboxLine`; the drive reads each part of the line, and that the emblem's image loaded (its `naturalWidth` is above zero) on the line and in a view's header |
| 3. The summary counts the states | Given lines in `working`, `waiting`, `waiting` and no state, then the summary reads "2 waiting · 1 working"; given no line with a state, it is empty | Cases on `inboxSummary`, each seen red before its code |
| 4. A line opens its work item's view | Given a work item with a live pane, when its line is pressed, then the view shows its title, branch, state and new commits, one tab for the pane, and the pane's terminal with the output it printed before | The drive, with a line printed in the pane before the window loads |
| 5. Opening a view starts nothing | Given a work item with no live pane, when its line is pressed, then the view shows the header and the buttons of the pane kinds, and the daemon lists no new session | Cases on `paneTabs` and `paneInFront`, each seen red before its code; the drive reads the daemon's sessions after the press |
| 6. A pane opens inside the work item | When a pane kind's button in a view is pressed, then a tab opens and its process runs in the work item's worktree | The drive: `pwd` typed in a shell pane prints the worktree, and the daemon lists the session with the work item's id |
| 7. The inbox returns, and stays live | Given a view on screen, when the return control is pressed, then the inbox screen is displayed and no terminal is; when a hook then reports that the pane's agent waits, the line reads `waiting` | The drive, with a payload fed through the hook relay as phase 2 of issue #7 fed it |
| 8. A new work item opens in its view | When the form creates a work item with a shell pane from the inbox screen, then its view is on screen with the pane in front, and the pane's process has the size of the terminal shown | The drive: `stty size` typed in the pane prints the terminal's rows and columns |
| 9. "Ask" asks in the view's work item | Given two work items, each asked once, when the view of the first is on screen, then the list holds the first's session alone, and the button's title names the first; with a work item that has no pane the button is enabled once a prompt is typed | Cases on `askButton` and `headlessLines`, each seen red before its code; the drive asks once, against the real adapter, with "Reply with the single word owl" |
| 10. The hook events are off the screen | `git grep -n -e 'id="events"' -e 'Hook events' -e 'getElementById("events")' -- apps/desktop/src/renderer` prints nothing | Executed at the phase's commit. At `12cd34f` it prints only lines `## Removes` names in its hook events row |
| 11. No pane is offered outside a work item | `git grep -n -e 'pane-kinds' -e 'kindButtons' -e 'start(first.kind)' -- apps/desktop/src/renderer` prints nothing | Executed at the phase's commit. At `12cd34f` it prints only lines `## Removes` names in its first two rows. Scenario 1 shows the behaviour |
| 12. The replaced decisions are gone | `git grep -n -e workItemInFront -e paneToOpen -- apps/desktop` prints nothing | Executed at the phase's commit. At `d3bc681` it prints lines of `src/renderer/renderer.ts`, `src/renderer/view.ts` and `test/view.test.ts`, all of which `## Removes` names |
| 13. The window names no vendor | `git grep -n -i -e claude -- apps/desktop/src/renderer` prints nothing | Executed at each phase's commit. It prints nothing at `12cd34f` and at `d3bc681` |
| 14. The daemon and the protocol are as they were | `git diff --stat <base>..HEAD -- apps/desktop/src/daemon apps/desktop/src/shared apps/desktop/test/daemon.test.ts` prints nothing | Executed at each phase's commit |
| 15. A notification still tells of a wait | Given the inbox screen in front of a focused window, when a session starts to wait, then a notification names its work item; given that session's pane in front of a view, none is shown | The existing cases of `notificationFor`; the drive, with `window.Notification` recorded as phase 2 of issue #7 recorded it |
| 17. The two screens follow the chosen mockup | Given the mockup `## Grounding` links, then the inbox screen and a work item's view match its layout, colours and typefaces | Phase 2: a screenshot of each screen from the drive (`Page.captureScreenshot`), read beside the mockup by the builder and then by the review. What only a person's eye settles is a row of `gaps.md` |
| 16. The emblem is AgenticSeal's file, and the tree says whose it is | `shasum -a 256 apps/desktop/assets/seals/owl-icon-cream.svg` prints the hash `## Grounding` gives; `TRADEMARKS.md` names that path; `README.md` and `README.ko.md` each link `TRADEMARKS.md` | Executed at phase 1's commit: the hash, and `git grep -n -e TRADEMARKS.md -- README.md README.ko.md` printing one line of each file. At `12cd34f` that search prints nothing |

## Data & interfaces

`apps/desktop/src/shared/protocol.ts`, `apps/desktop/src/shared/ipc.ts` and everything under `apps/desktop/src/daemon/` are unchanged.

The decisions are functions of `apps/desktop/src/renderer/view.ts`, with cases in `apps/desktop/test/view.test.ts`. `renderer.ts` draws what they return.

- `inboxLine`: unchanged. The view's header calls it as the line does.
- `inboxSummary(lines: readonly InboxLine[]): string`, new (*Scope* item 3).
- `paneTabs(workItem: WorkItem, sessions: readonly SessionInfo[], held: ReadonlySet<number>): SessionInfo[]`, new: the sessions of *Scope* item 5's first sub-item, in the order of their ids. `held` is the ids of the panes this window holds a terminal for.
- `paneInFront(tabs: readonly SessionInfo[], last: number | undefined): number | undefined`, new: the id of *Scope* item 5's second sub-item, or nothing where there is no tab. Where no tab is alive, it is the most recent tab.
- `tabLabel(session: SessionInfo, paneKinds: readonly PaneKindInfo[]): string`: loses its `workItems` parameter and the title before the pane.
- `notificationFor`: unchanged in what it decides. For a pane without a work item its title is the new `tabLabel`, which is the text it gives today.
- `askButton(prompt: string, workItem: WorkItem)`: the work item is always there, so the branch for a missing one and its title go.
- `headlessLines(held: readonly HeadlessInfo[], workItemId: number)`: gives the lines of that work item alone.
- `agentKind`, `workItemFields`, `withHeadless`: unchanged.

In `apps/desktop/src/renderer/index.html` the two screens are two elements of `body`, of which the one not in front carries `hidden`. The status line and the "New work item" dialog are outside both. The seal's place is an `img` whose source is the copy of the drawing in `dist/`, which the page's content security policy allows as it allows the page's own stylesheet (`default-src 'self'`). The builder names the elements, and a function name that differs from one this section gives is a line of the phase record.

## Rule changes

- add
  file: docs/architecture.md
  section: License and code from other projects
  to: - **The names and the emblem are not under the Apache License.** The Owlery and AgenticSeal names, the owl emblem and its drawings in the tree are reserved, and `TRADEMARKS.md` at the top of the repository states what they are under.

- add
  file: docs/architecture.ko.md
  section: 라이선스와 다른 프로젝트의 코드
  to: - **이름과 엠블럼은 Apache 라이선스의 대상이 아닙니다.** Owlery와 AgenticSeal이라는 이름, 올빼미 엠블럼, 저장소에 있는 그 그림은 권리를 보유하며, 무엇이 적용되는지는 저장소 최상위의 `TRADEMARKS.md`가 밝힙니다.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The top bar's "+" button for each pane kind | `apps/desktop/src/renderer/index.html` (`#pane-kinds` and its style), `apps/desktop/src/renderer/renderer.ts#showPaneKinds` (the half that builds the buttons, and `kindButtons`) | The buttons of a work item's pane area (*Scope* item 5) |
| The pane the window starts by itself where the daemon lists no live one | `apps/desktop/src/renderer/renderer.ts#onMessage`, case `ready` (`start(first.kind)`) | Nothing needs to: the app opens on the inbox (*Scope* items 1 and 8) |
| The attach of every live session at `ready` | `apps/desktop/src/renderer/renderer.ts#onMessage`, case `ready` | The attach when a pane is first in front (*Scope* item 6) |
| The top bar's strip of every pane's tab | `apps/desktop/src/renderer/index.html` (`#tabs`), `apps/desktop/src/renderer/renderer.ts#adopt` | The tabs of a work item's pane area (*Scope* item 5) |
| The work item's title in a tab's label, and its cases | `apps/desktop/src/renderer/view.ts#tabLabel`, `apps/desktop/test/view.test.ts` (`describe("tabLabel")`) | The view's header says the title (*Scope* item 4) |
| The decision of what a pressed line shows or starts, and its cases | `apps/desktop/src/renderer/view.ts#paneToOpen`, `apps/desktop/src/renderer/renderer.ts#openWorkItem`, `apps/desktop/test/view.test.ts` (`describe("paneToOpen")`) | A pressed line opens the view, and `paneInFront` picks its tab. The pane of the first state-reporting kind that a pressed line started goes: opening a view starts nothing (*Scope* item 4) |
| The side panel | `apps/desktop/src/renderer/index.html` (`#side` and its styles) | The inbox screen (*Scope* item 2) and the view's "Ask" section (*Scope* item 9) |
| The list of hook events | `apps/desktop/src/renderer/index.html` (the "Hook events" heading, `#events` and its styles), `apps/desktop/src/renderer/renderer.ts` (`events`, and the body of case `agent`) | Nothing in the window. A person who reads hook events sets `OWLERY_DEBUG_HOOKS=1`, and `apps/desktop/src/daemon/main.ts` writes each event's name and field names to `daemon.log` |
| The work item of the pane in front as the place "Ask" asks in, and its cases | `apps/desktop/src/renderer/view.ts#workItemInFront`, `apps/desktop/test/view.test.ts` (`describe("workItemInFront")`), both from issue #8 | The work item of the view on screen (*Scope* item 9) |
| The "Ask" button's refusal for a pane without a work item, and its cases | `apps/desktop/src/renderer/view.ts#askButton` (the title "Bring a work item's pane to the front to ask in it."), `apps/desktop/test/view.test.ts` (`describe("askButton")`), from issue #8 | Nothing needs to: the button exists only in a work item's view |

Framed 2026-11-19 by framer, before the build.
