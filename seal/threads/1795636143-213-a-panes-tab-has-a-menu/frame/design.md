# Design: a pane's tab has a menu (#213)

## Grounding

The tree as read at `5b20b1c6`, the merge of `origin/release/v0.0.5` at `c35c8271` into the branch's routing commit `96c6526a`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/design.md` *Principles* item 1 | No tab colour is a red. `apps/desktop/test/themes.test.ts` *holds a red in no property but the seal's* refuses any colour whose red exceeds its green and its blue by more than 80 of 255 (`RED_MARGIN`), so an orange such as `#e8833a` fails it (executed, the probe row below). Issue #221, not in this release, makes red its progress colour later, which is one more reason the row holds no red. |
| `docs/design.md` *Principles* item 3 | No tab colour is Night watch's yellow (`--state-waiting` `#f2c033` dark, `#846000` light). The owner's pick on issue #221, in its comments, moves the signal to a teal exclamation with sky as its alternative, so the row holds no teal and no sky either (read, `gh issue view 221 --json comments`). |
| `docs/design.md` *Principles* item 4 | A tab's colour is said three times: by a shape (the bar of *Scope* item 6), by its colour, and by its name in words, which the tab's tooltip and its name to a screen reader carry. This frame reads the issue's "no tab is told from another by colour alone" as a marked tab told from an unmarked one by the bar's shape, and two marked tabs told apart by colour and by the colour's name. `frame/questions.md` Q3 holds the other reading. |
| `docs/design.md` *Principles* item 5 | The colours are tokens, `--tab-green`, `--tab-blue` and `--tab-pink`, in each of the six blocks of `apps/desktop/src/renderer/themes.css`. No module names a value. `themes.test.ts` *defines the same names in every block* and *names no colour of its own in its style, its markup or its modules* hold it. |
| `docs/design.md` *Principles* item 7 | The tab's mark is no circle. A circle draws the seal, a state's mark and the bell's dot only. |
| `docs/design.md` *Principles* item 8 | This pull request writes the rows of the forms it draws, in both editions of `docs/design.md`: the tab's menu, the rename dialog, the close dialog and the changed tab. None is left to the settle. |
| `docs/design.md` *Principles* item 9 | Each tab colour stands at 3 to 1 or more against every ground it is drawn on. Probe `test_tmp_tab_colours.mjs` (executed, `node test_tmp_tab_colours.mjs` in `<scratchpad>/1795636143-213-a-panes-tab-has-a-menu/frame/`, and its second form with the blue of *Data & interfaces*) computed WCAG 2 ratios from the six blocks' `--ground`, `--ground-raised`, `--terminal-ground` and `--hover` values as `themes.css` holds them. The values of *Data & interfaces* meet 3 to 1 against the window's ground, that ground under the pointer, a menu's ground, a menu's ground under the pointer and the terminal's ground, in all six blocks. The lowest ratios are 3.47 (light blue on the terminal's ground of Register and Desk) and 3.53 (light green on the ground under the pointer of Register and Desk). |
| `docs/design.md` *Tokens* | A change of a value changes `docs/design.md`, `docs/design.ko.md` and `themes.css` in one commit. `themes.test.ts` *docs/design.md* reads every token table against the style sheet. |
| `docs/design.md` *What to avoid*, *The marks of a generic AI product* item 1, and *The patterns of the nearest products* rows Cursor and Claude Code's desktop app | No purple, and no gradient of purple into blue or pink. The row draws flat swatches with no gradient. Orange is a colour Owlery does not take from Cursor and from Claude Code, a second reason, beside the red guard, that the row holds none. |
| `docs/design.md` *The marks of a generic AI product* item 6 | "Sky accents" were one of the eight marks the window once had. The blue of the row stands at hue 218 to 225, away from sky, which also keeps it apart from #221's sky. |
| `docs/design.md` *Components and their states* row "A menu" | The tab's menu takes this form, which `apps/desktop/src/renderer/menu.ts` draws. The row's Disabled column is "—", so an entry that would do nothing is left out, not drawn disabled. |
| `docs/design.md` *Components and their states* row "A pane's tab" | The tab's label, close mark, grounds and focus ring stay as they are. The back's tab, "Back of the seal", has no pane and gets no menu. |
| `docs/design.md` *The voice of the window's words* | A button is the act it does, in sentence case. The entries are "Rename…", "Close Pane" as the pane's own menu already spells it (`view.ts#paneMenu`), "Close Other Panes" and "Close Panes to the Right", in the title case the pane's own menu uses. |
| `docs/architecture.md` *What a session survives* | A pane's process lives as long as its daemon. A name and a colour kept on the daemon's session last exactly as long as the pane, through a reload of the window and an update of the app. The pane record that issue #61 builds in milestone 4 is where they would outlive the daemon, which `## Rule changes` writes down. |
| `docs/architecture.md` *What a session survives*, "the window reads a field the daemon does not send as a feature that is off" | A daemon of an earlier build sends no `name` and no `colour` on a session, and ignores a message it does not know (`apps/desktop/src/daemon/daemon.ts`, the `default:` arm of the message switch, read). The window then offers no "Rename…" and no colour row, so no request waits on an answer that never comes. |

Facts of the tree this frame stands on, each read at `5b20b1c6` unless labelled otherwise:

- `apps/desktop/src/renderer/work-item-view.ts#tabElement` draws a tab as a label button, the account's name where it differs, and a "×" button that calls `closePane`. The tab has no `contextmenu` handler. `showView` replaces every tab at each draw (`tabs.replaceChildren(...)`).
- `work-item-view.ts#closePane` sends `close` at once where `view.ts#closeAsks` is false, and otherwise opens `#close-pane-dialog` for that one pane, held in `let asking: number | undefined`. `dropClosed` closes the dialog where the daemon no longer lists that pane. `closeFront` (⌘W) and the pane's own menu's "Close Pane" both go through `closePane`.
- `view.ts#tabLabel` names a pane by its kind, numbered among the tabs of the same kind, and "Setup" for the setup pane. It is the one namer: the close dialog, the account change dialog, the delete dialog's running panes (`view.ts#runningIn`), the Restart Daemon dialog's list and a notification's title each call it.
- The daemon's `close` message ends the pane's process, takes it off the lists and broadcasts an `inbox` (`daemon.ts#closePane`). `SessionInfo` (`apps/desktop/src/shared/protocol.ts`) carries no name and no colour.
- In `index.html` a dot already says "new": the bell's dot (`#bell.ringing::after`) and a commit's gained dot (`.commit .gained.new`), each `--dot` wide. In Desk a filled disc is the mark of a work item that needs the person (`docs/design.md` *The themes*, row "A state's marks").
- `themes.test.ts` *writes no shadow, no light, no gradient and no corner of its own in its style* refuses a shadow written in the page's own style, so the bar and the swatches are drawn as backgrounds.
- No comment stands on issue #213 (executed, `gh issue view 213 --json body,comments`). `seal/follow-up.md` does not stand (executed, `ls seal`). The latest release, `v0.0.4`, carries no `### Process changes` table (executed, `gh release view --json body`). The policy root has no `docs/README.md` index (executed, `ls docs`), so each `file:` of `## Rule changes` names a document of `docs/` itself.

## Scope

In scope:

1. **The tab's menu.** A press of the right button on a pane's tab opens a menu in the form of "A menu" (`renderer/menu.ts#openMenu`), at the pointer, named to a screen reader as the menu of that tab. It acts on that pane and on the other panes of the same work item. Its entries, in order: "Rename…"; the colour row; a rule; "Close Pane"; "Close Other Panes"; "Close Panes to the Right". "Close Other Panes" is left out where the work item has one tab. "Close Panes to the Right" is left out where the tab is the last. "Rename…" and the colour row are left out where the daemon sends no `name` on the session (*Grounding*, the last row of the table). A press of the right button on the back's tab opens no menu, and the system's menu stays away.
2. **Closing several panes asks once.** "Close Pane" closes the tab's pane. "Close Other Panes" closes every other pane of the work item, exited ones among them. "Close Panes to the Right" closes every pane whose tab stands after this one in `view.ts#paneTabs` order. One function, `closePanes`, takes the panes to close and replaces `closePane`. "×", ⌘W and the pane's own menu call it with one pane. Where none of the panes is working (`closeAsks`), it sends one `close` for each at once. Where any is, it opens `#close-pane-dialog` once, before it closes any. The dialog's sentence names each working pane by `tabLabel` and says how many panes the close ends. The keyboard starts on "Cancel". "Cancel", Escape and any other close of the dialog close nothing. The confirm button closes every pane of the set. Its words are "Close pane" for one pane and "Close <n> panes" for more. Where the daemon stops listing any pane of the set while the dialog is open, the dialog closes and nothing is sent. The sentence and the button's words come from one pure function of `view.ts`, `closeSays`, which gives one pane the sentence it has today.
3. **The daemon keeps a pane's name and colour.** `SessionInfo` gains `name` and `colour`, both null when a pane starts. A new message, `setPane`, sets either or both, as *Data & interfaces* states. They stay through a change of the pane's account and through the exit of its process, and go when the pane is closed. Every client sees them in the next `inbox`.
4. **A given name names the pane everywhere.** `tabLabel` returns the pane's `name` where it is not null, before "Setup" and before the kind. A renamed pane still counts among the panes of its kind, so renaming "Shell 1" leaves "Shell 2" as it is. Each caller of `tabLabel` that *Grounding* lists names the pane by its given name with no change of its own.
5. **"Rename…" opens a dialog.** `#pane-name-dialog`, in the form of "A dialog", headed "Rename" and the tab's label. It holds one field with the tab's label in it, all of it selected, `maxlength` 60, and under it the sentence "An empty name names the pane by its kind again." in `--ink-muted`. "Save" is the main button and sends `setPane` with the field's text. Where the trimmed text is the label the pane's kind gives it, which is what the field holds at the opening of a pane with no name, it sends `name: null`, as for an empty name, so a Save of the untouched field freezes no number. A `done` closes the dialog. A refusal stands in the dialog under the field, and "Save" can be pressed again. The dialog closes, sending nothing, where the daemon stops listing the pane.
6. **The colour row.** The row holds four swatches, in this order: Green, Blue, Pink and No colour. Each swatch is a menu item with the role `menuitemradio`, checked where it is the tab's colour, and named by its colour's word to a screen reader. A pointer is told a sentence that opens with that word, as "Blue draws a blue bar along the bottom of this pane's tab.", since every item of a menu tells a pointer a description that is not its label. A swatch draws the mark the tab will carry: a bar 14px wide and 4px high in the colour, and No colour as the same bar outlined in `--ink-faint`. A press sends `setPane` with that colour, or with `colour: null` for No colour, and closes the menu. A tab with a colour carries a bar 2px high along its bottom edge, across its width, in the colour's token. The tab's tooltip and its name to a screen reader end with the colour's word, as in "Shell 2, Blue". The entry kind of a row, `MenuRow`, stands in `view.ts` beside the other kinds of `MenuEntry`, and `renderer/menu.ts#rowElement` draws it. The arrow keys reach its items as they reach every other item.
7. **Tokens.** `--tab-green`, `--tab-blue` and `--tab-pink`, in each of the six blocks of `themes.css`, with the values of *Data & interfaces*. A case of `themes.test.ts`, under *what a theme draws can be seen*, holds each at 3 to 1 or more against `[--ground]`, `[--ground, --hover]`, `[--terminal-ground]`, `[--ground-raised]` and `[--ground-raised, --hover]` in every block. *holds a red in no property but the seal's* stays as it is and holds them too.
8. **Both editions of `docs/design.md`.** The three tokens' rows in each theme's table, and in *Tokens* a bullet that names `--tab-green`, `--tab-blue` and `--tab-pink` one by one, so that it is not read as covering `--tab-edge` and `--tab-width`. In *Components and their states*: the row "A pane's tab" says the colour's bar and the menu of the right button; a new row "A pane's tab's menu" states the entries of *Scope* item 1 and the row of *Scope* item 6; a new row "The rename dialog of a pane" states *Scope* item 5; a new row "The close dialog of panes" states *Scope* item 2. The Korean edition keeps the same headings and the same count of table rows, which the broad gate's loop compares.
9. **Cases.** `apps/desktop/test/view.test.ts`: the menu's entries (`tabMenu`) for one tab, for a middle tab, for the last tab, and for a session with no `name` field; `closeSays` for one working pane, for several, and for working panes among idle ones; `tabLabel` with a name, and the numbering of its kind beside a renamed pane. `apps/desktop/test/daemon.test.ts`: `setPane` sets a name and a colour and the next `inbox` carries them; it trims, clears on an empty name, and refuses an unknown id, a sign-in pane, a name past 60 characters and a colour that is none of `TAB_COLOURS`, setting nothing of a refused message; a change of account keeps both; a second client's `ready` carries both. `themes.test.ts`: *Scope* item 7. Built-app cases in `apps/desktop/test/terminal-basics.test.ts`, run as one batch at the end of each phase: a right-click on a tab opens the menu; "Close Other Panes" with one working pane among three opens the dialog naming it, "Cancel" closes nothing, and the confirm closes the other two; a pane of the set closed by a second client of the daemon closes the dialog; "Rename…" renames the tab and the delete dialog names the pane by its new name; a swatch draws the bar and No colour takes it off.
10. **Screenshots.** The screenshot run (`apps/desktop/test/screenshots.ts`, `VIEWS`) gains two views. In `tabs`, the work item's tabs carry each colour and the menu of the blue tab is open. In `rename`, the rename dialog stands open from that menu. The pull request carries both in Night watch's dark and light appearances, and in Register and Desk, whose menus differ by their corners and whose blocks hold their own grounds.
11. **The rule of `## Rule changes`**, which the settle writes into both editions of `docs/architecture.md`.

Out of scope:

- **Pin.** A tab's place is its pane's id (`view.ts#paneTabs`), and the daemon keeps no order of tabs. A pin needs a kept order. No request of the owner asks for one, and the work item's own pin already stands in the sidebar.
- **Move into a split, and split the terminal.** "Side by side" (#32) lays out up to the cap of panes in the tabs' order (`view.ts#stageOf`, `view.ts#stageGrid`). A split of one pane that the person chooses is a second model of the stage, and Owlery has none to extend.
- **Continue in chat.** `docs/design.md` *Principles* item 2: the window reports and does not converse, and draws no chat. The phone's chat is work of its own (`docs/product.md` *The phone: the same session as a chat*).
- **Copy the tab's id.** `view.ts#tabLabel`'s comment says that the daemon's id of a pane "is no tab's to show", and `docs/architecture.md` *What a session survives* keeps a conversation's id in the daemon: "The protocol carries only that a kind of pane can resume".
- **Keys.** No key opens the menu, renames or colours a tab. Issue #230 lists the window's keys in one place, and the orchestrator's handoff of 2026-11-26 leaves the keys to it. The menu shows no keys: the form of "A menu" has no keys column.
- **A name or a colour that outlives its daemon.** The pane itself ends with its daemon. Issue #61's pane record is where they would be kept, and `## Rule changes` writes that down for it.
- **A colour on the work item's line in the sidebar or the inbox.** The colour marks a tab among its work item's tabs, and no request asks for more.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| The menu opens on a tab | Given a work item with three Shell panes. When the person presses the right button on "Shell 2". Then a menu opens at the pointer with "Rename…", the colour row, a rule, "Close Pane", "Close Other Panes" and "Close Panes to the Right". On "Shell 3" the last entry is absent. On the back's tab nothing opens. | `view.test.ts` cases of `tabMenu`; the built-app case of *Scope* item 9 reads the menu's items |
| Close others with nothing working | Given three idle Shell panes. When the person chooses "Close Other Panes" on "Shell 1". Then no dialog opens, and the daemon lists "Shell 1" alone. | built-app case in `terminal-basics.test.ts` |
| Close others with a session working | Given "Claude Code" working and two idle Shell panes. When the person chooses "Close Other Panes" on "Shell 1". Then one dialog names "Claude Code", says that two panes close, and the keyboard is on "Cancel". "Cancel" closes nothing. Choosing it again and then "Close 2 panes" closes both. | `view.test.ts` cases of `closeSays`; built-app case in `terminal-basics.test.ts` |
| A pane of the set goes while the dialog is open | Given the dialog of the scenario above. When the "Claude Code" pane is closed by another client of the daemon. Then the dialog closes, and the idle Shell pane stays. | built-app case in `terminal-basics.test.ts`, with a client socket of the daemon as `seal-back-view.test.ts` holds one |
| Rename | Given "Shell 2". When the person renames it "build". Then its tab reads "build", "Shell 1" and "Shell 3" keep their labels, and the delete dialog's running panes name "build". An empty name gives "Shell 2" back. | `view.test.ts` cases of `tabLabel`; `daemon.test.ts` cases of `setPane`; built-app case |
| A colour | Given "Shell 2". When the person presses Blue in the row. Then the tab carries the blue bar along its bottom, its tooltip ends with ", Blue", and Blue is checked the next time the menu opens. No colour takes the bar off. | built-app case; `themes.test.ts` case of *Scope* item 7 |
| A reload of the window | Given a renamed and coloured tab. When the window reloads. Then the tab keeps its name and its colour. | `daemon.test.ts`: a second client's `ready` carries `name` and `colour` |
| A daemon of an earlier build | Given a session with no `name` field. When the person opens the tab's menu. Then "Rename…" and the colour row are absent, and the close entries stand. | `view.test.ts` case of `tabMenu` for a session with no `name` field |
| The single close keeps its form | Given one working pane. When the person presses its "×". Then the dialog reads "<label> is working. Closing the pane ends its session." as today, with "Close pane". | the existing case `terminal-basics.test.ts` *asks before a pane whose session is working closes, and closes it only on "Close pane"*, which stays green with no change |
| The one-pane path is gone | After the build, `git grep -n -e 'function closePane(' -e 'let asking: number . undefined' -- . ':!seal'` prints nothing. The `.` stands for the `|` of the code, which a table cell cannot hold unescaped. At `5b20b1c6` it prints `apps/desktop/src/renderer/work-item-view.ts:137` and `apps/desktop/src/renderer/work-item-view.ts:1236`, the two lines `## Removes` names. The daemon's `private closePane(` does not match the first pattern, and `:!seal` leaves out this frame, which quotes both patterns. | executed at `5b20b1c6`: the command printed those two lines and no other |

## Data & interfaces

`apps/desktop/src/shared/protocol.ts`:

- `export const TAB_COLOURS = ["green", "blue", "pink"] as const;` and `export type TabColour = (typeof TAB_COLOURS)[number];`, in the row's order.
- `export const PANE_NAME_CHARS = 60;`, the longest name a pane takes.
- `SessionInfo` gains `name?: string | null`, the name a person gave the pane's tab, or null where it has none, and `colour?: TabColour | null`, its colour or null. A daemon of an earlier build sends neither, and a client reads their absence as a daemon that keeps neither.
- `ClientMessage` gains `{ type: "setPane"; requestId: number; id: number; name?: string | null; colour?: TabColour | null }`, beside `close`. A field that is absent is left as it is. The name is taken without the white space at its ends, and an empty one, or null, clears it. The daemon refuses, with an `error` and setting nothing of the message, an id it lists no pane under, a pane whose `workItemId` is null, a name longer than `PANE_NAME_CHARS` once trimmed, and a colour that is neither null nor one of `TAB_COLOURS`. Otherwise it answers with `done`, before the `inbox` that carries the change.

`apps/desktop/src/daemon/daemon.ts`: a started pane's `info` holds `name: null, colour: null`, and the message switch gains a `setPane` arm. Nothing else changes the session's lifetime.

`apps/desktop/src/renderer/view.ts`:

- `tabLabel` reads `session.name` first.
- `tabMenu(session, tabs): MenuEntry[]`, the entries of *Scope* item 1. It reads from the session itself whether the daemon keeps a name, as `session.name !== undefined`.
- `closeSays(working: string[], count: number): { says: string; confirm: string }`.
- `MenuAction` gains `{ do: "closePanes"; ids: number[] }`, `{ do: "renamePane"; id: number }` and `{ do: "colourPane"; id: number; colour: TabColour | null }`.
- `MenuEntry` gains `MenuRow`: a row of items, each with its label, its description, its action, its colour or null, and whether it is checked.

`apps/desktop/src/renderer/work-item-view.ts`: `tabElement` gains the `contextmenu` handler, the bar and the colour's word; `closePanes(sessions)` stands in place of `closePane`; `asking` holds the ids of the set; `dropClosed` closes the dialog where any of them is gone; the rename dialog is wired as the account change dialog is.

`apps/desktop/src/renderer/index.html`: `#pane-name-dialog`; the close dialog's confirm button takes its words from `closeSays`; the style of the bar and of the swatches, drawn as backgrounds.

`apps/desktop/src/renderer/themes.css`, and each theme's table in both editions of `docs/design.md`:

| Token | Dark, in every theme | Light, in every theme |
|---|---|---|
| `--tab-green` | `#5fb86f` | `#2e8540` |
| `--tab-blue` | `#6b8cf2` | `#2f6bd0` |
| `--tab-pink` | `#e46fa8` | `#c23f80` |

## Rule changes

- change
  file: docs/architecture.md
  section: What a session survives
  from: The daemon keeps a record of each pane in its run folder: its work item, its kind, its folder, and the session id that its agent's hook events carry.
  to: The daemon keeps a record of each pane in its run folder: its work item, its kind, its folder, the name and the colour a person gave its tab, and the session id that its agent's hook events carry. Until that record is built, a pane's name and colour live on the daemon's session, as long as the pane.
- change
  file: docs/architecture.ko.md
  section: 세션이 견디는 것
  from: 데몬은 칸마다 기록을 실행 폴더에 둡니다. 그 칸의 작업, 종류, 폴더, 그리고 에이전트의 훅 이벤트에 실려 오는 세션 ID입니다.
  to: 데몬은 칸마다 기록을 실행 폴더에 둡니다. 그 칸의 작업, 종류, 폴더, 사람이 그 탭에 준 이름과 색, 그리고 에이전트의 훅 이벤트에 실려 오는 세션 ID입니다. 그 기록이 생기기 전까지 칸의 이름과 색은 데몬의 세션에 있고, 칸이 있는 동안만 있습니다.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The close of one pane | `apps/desktop/src/renderer/work-item-view.ts#closePane` | `closePanes`, which "×", ⌘W, the pane's own menu and the tab's menu call, with one pane or with several |
| The dialog's one pane | `apps/desktop/src/renderer/work-item-view.ts`, `let asking`, which held one pane's id or `undefined` | `asking` holds the ids of the set the dialog closes |
| The dialog's sentence written in the module | `apps/desktop/src/renderer/work-item-view.ts#closePane`, the template that ends "is working. Closing the pane ends its session." | `view.ts#closeSays`, which a unit case reads |
| The confirm button's fixed words | `apps/desktop/src/renderer/index.html`, `#close-pane-confirm`, "Close pane" | `closeSays`'s `confirm`, set where the dialog opens |

The work adds a feature of the window and no mechanism of the process: no gate, check, hook, CI step, line grammar or record mark. The cases it adds pin the window's words and draws, as contract rule 14 asks of a change a person sees.

Framed 2026-11-26 by framer, before the build.
