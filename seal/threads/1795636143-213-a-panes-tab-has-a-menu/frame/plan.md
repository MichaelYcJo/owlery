# Implementation Plan: a pane's tab has a menu (#213)

## Technical context

The tree as read at `5b20b1c6`.

The work builds on four places:

- `apps/desktop/src/renderer/work-item-view.ts`: `tabElement` (line 1298) draws each tab, `closePane` (line 1236) and `asking` (line 137) hold the one-pane close and its dialog, `dropClosed` (line 887) closes the dialog where its pane is gone, `closeFront` (line 1292) is ⌘W, `menuAct` (line 449) is the pane's own menu, and `showView` (line 1411) replaces the tab strip at each draw (line 1449). `openItemMenu` (line 946) already opens the shared menu from this module, for the "+" buttons' accounts.
- `apps/desktop/src/renderer/menu.ts#openMenu`: the form of "A menu", with keyboard, a submenu and a close on any press outside. Its entries are `MenuItem` and `Submenu` of `view.ts`, text only.
- `apps/desktop/src/renderer/view.ts`: `tabLabel` (line 19), `closeAsks` (line 2118), `paneMenu` (line 2211), `paneTabs` (line 2691), `MenuAction` (line 2413).
- `apps/desktop/src/daemon/daemon.ts`: the message switch, its `close` arm (line 1550), `closePane` (line 2026), and the start of a pane, where `info` is made (line 2540). `apps/desktop/src/shared/protocol.ts`: `SessionInfo` (line 538), and `close` (line 927) in `ClientMessage`.

Constraints:

- The tab strip is drawn again at every `inbox`, so anything the person types must not live in a tab. The rename is a dialog for that reason (Alternatives row 3).
- Issue #242's hold (`renderer/press.ts`) defers draws while the main button is held. A right-click begins no hold, and `menu.ts` closes on the press itself, so the menu acts on pane ids and never on a tab's element.
- The broad gate compares the headings and the table rows of `docs/design.md` and `docs/design.ko.md`. Each row added to one edition is added to the other in the same commit.
- `themes.test.ts` reads each token table of `docs/design.md` against `themes.css`, refuses a red outside the seal's tokens, and refuses a shadow the page writes itself.

The failure scenario of the chosen approach, six months on: issue #61 builds the pane record that resumes a Claude Code pane after its daemon ends. If its build does not read this design's rule change, a resumed pane comes back as "Claude Code" with no colour, and the person who named it "review" has lost the name with no word said. The `## Rule changes` item puts the name and the colour in that record's sentence of `docs/architecture.md`, where #61's framer reads it. A second scenario: a future theme adds a ground on which a tab colour falls under 3 to 1. The case of *Scope* item 7 lists the grounds by hand, as `themes.test.ts` lists every other pair, so a new ground added to the tabs without a row there passes unseen. That is the same cost every other pair of that file carries.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| 1. Keep the name and the colour on the daemon's session (`SessionInfo.name`, `SessionInfo.colour`), set by a `setPane` message | A daemon of an earlier build ignores `setPane`, and a window that sent it would wait for ever. The window offers neither entry where the session carries no `name` field, so nothing is sent. | Chosen. The daemon is the one place every window reads (`docs/architecture.md` *Overall layout*), it outlives a reload of the window, and its session lives exactly as long as the pane. |
| 2. Keep them in the window's memory, by pane id | A reload of the window, a second window, and the phone's view in milestone work each show the pane unnamed. The person renames it again after every update of the app. | Rejected. |
| 3. Keep them on disk in the daemon's run folder now | A file to keep in step with the daemon's list for panes that end with the daemon anyway. Nothing reads it back until issue #61's pane record exists. | Rejected for this work. The rule change hands the name and the colour to #61's record. |
| 4. Rename inline, as a field inside the tab | `showView` replaces every tab at each `inbox` (`tabs.replaceChildren`), so a field in a tab loses what the person typed whenever any pane's state changes. Keeping it needs a keyed redraw of the strip, which #242 found costly for the sidebar and did not build. | Rejected. A dialog (*Scope* item 5) survives every redraw, as the account change dialog does. |
| 5. Close several panes with a new message `closePanes { ids }` | A daemon of an earlier build ignores it and closes nothing, with no word said. It also changes nothing the window could not do with one `close` per pane. | Rejected. The window sends one `close` per pane, which every daemon reads. The daemon then sends one `inbox` per pane, which redraws the view that many times; for the few panes one work item holds, each redraw replaces the strip and the stage's screens keep their terminals, so the cost is a few draws in a row. |
| 6. Replace the close dialog with a second dialog for several panes | Two dialogs with the same purpose and two sentences to keep in step. The keyboard's start on "Cancel" and the close on a gone pane would be written twice. | Rejected. The one dialog takes a set. The premise that keeps it is that its sentence and its buttons fit a set: checked, `closeSays` gives one pane today's sentence and several panes a sentence that names each working one. |
| 7. Keep `closePane` for one pane and add `closePanes` beside it | Two paths that each decide when to ask. A later change to when the close asks (`closeAsks`) is made in one and not the other. | Rejected. `closePanes` replaces it (`frame/design.md` `## Removes`). |
| 8. Keep `tabLabel` as the one namer and have it read the given name | None found: every caller wants the name the person gave. | Chosen over a second function for the given name. A second function would leave the delete dialog, the Restart Daemon dialog and the notification's title naming a renamed pane by its kind. |
| 9. Mark a tab with a dot before its label, the issue's example | A dot already says "new" in this window: the bell's dot and a commit's gained dot (`index.html`). In Desk a filled disc says that a work item needs the person. A coloured dot on a tab reads as news from that pane. | Rejected. `frame/questions.md` Q2 puts it to the owner. |
| 10. Tint the whole tab's ground in the colour | Colour alone, against *Principles* item 4. A shown tab already stands on the terminal's ground, which a tint would have to replace or mix with. | Rejected. |
| 11. A bar 2px high along the tab's bottom edge | A bar is a shape, but the same shape for every colour, so two marked tabs differ by colour and by the colour's word only. | Chosen. No other part of the window draws a bar along a tab's bottom: the tab in front has `--tab-edge` at its sides and, in Register, a rule along its top; Night watch's signal edge and Register's selection stand at a left edge. |
| 12. A shape of its own for each colour | Register's filled box says that a work item needs the person, Night watch's discs are its states, and a triangle is a failure. Three free shapes do not stand apart from those at 4px. | Rejected. `frame/questions.md` Q3. |
| 13. Three colours: green, blue and pink | Few against Orca's row. | Chosen. The policy leaves no clean fourth hue: red fails `themes.test.ts`'s red guard and *Principles* item 1; orange fails the red guard and is the orange Owlery does not take from Cursor and Claude Code; ochre is the failure's colour in Register and Desk; yellow is Night watch's signal; teal and sky are issue #221's signal and its alternative, and sky one of the eight marks the window once had; purple is refused by *What to avoid*. `frame/questions.md` Q1. |
| 14. The tab's menu in the form of the pane's own menu (`#pane-menu`), which shows keys and draws disabled items | Two forms of a menu for the same strip of tabs, and a keys column with nothing in it, since #230 holds the keys. | Rejected. The shared form of "A menu" (`menu.ts`) is the one *Components and their states* states. |
| 15. Draw an entry that would close nothing as disabled | The form of "A menu" has no disabled state (its row's Disabled column is "—"). | Rejected. Such an entry is left out, as the work item's menu leaves out what does not apply. |
| 16. Take Orca's "pin the tab" | The tabs' order is the panes' ids, and no order is kept to pin into. | Rejected, `frame/design.md` *Scope*, Out of scope. |
| 17. Take Orca's "move into a split" and "split the terminal" | A second model of the stage beside "Side by side". | Rejected, the same. |
| 18. Take Orca's "continue in chat" | *Principles* item 2: the window draws no chat. | Rejected, the same. |
| 19. Take Orca's "copy the tab's id" | The pane's id is no tab's to show (`view.ts#tabLabel`), and the conversation's id stays in the daemon (`docs/architecture.md` *What a session survives*). | Rejected, the same. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1 and 2 for the three close entries alone, with "Rename…" and the colour row not yet drawn; the close dialog's row and the tab's menu row of *Scope* item 8, stating the close entries; the `view.test.ts` cases of *Scope* item 9 for `tabMenu` and `closeSays`; the built-app cases of *Scope* item 9 for the menu, the close with a working pane and a pane gone while the dialog is open, as one batch at the phase's end | `cd apps/desktop && node scripts/test-in-electron.mjs test/view.test.ts`; `git grep -n -e 'function closePane(' -e 'let asking: number \| undefined' -- . ':!seal'` prints nothing; the built-app batch, `cd apps/desktop && node scripts/test-in-electron.mjs --project app test/terminal-basics.test.ts`, run alone on the machine | 0deae1a5 |
| 2 | *Scope* items 3, 4, 5, 6 and 7; the remaining parts of *Scope* item 8; the rest of *Scope* item 9; *Scope* items 10 and 11 | `cd apps/desktop && node scripts/test-in-electron.mjs test/view.test.ts test/themes.test.ts`; `cd apps/desktop && node scripts/test-in-electron.mjs test/daemon.test.ts -t setPane`; the built-app batch of `terminal-basics.test.ts` and the screenshots of `screenshots.test.ts`, run alone on the machine at the phase's end | 59d9691d |

## Overlap with the release

Read for this section: issue #217's branch at `f9e4f756` in `/Users/yc/Documents/GitHub/owlery-wt-217`, sealed (`a2da7d80` records its guarantee); the combined branch of #215, #216 and #133 in `/Users/yc/Documents/GitHub/owlery-wt-216`, at `990edec5` with a merge under way in its worktree, diffed against `origin/release/v0.0.5`; issue #223's frame in `/Users/yc/Documents/GitHub/owlery-wt-223`, which holds a skeleton `frame/design.md` alone, uncommitted. The merged items #224, #259, #262 to #265, #267, #268 and #272 are in this frame's base. Issue #230 has no worktree and no frame; it is named here because the handoff leaves the keys to it.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #217 | `apps/desktop/src/shared/protocol.ts` `ClientMessage`, where #217 rewrites the comments of `reverseDecision` and `deleteWorkItem` a few lines above `close`, beside which `setPane` goes; `apps/desktop/src/renderer/work-item-view.ts` `showView`, where #217 changes the branch's place a few lines above the tab strip's draw; `daemon.ts`, `view.ts`, `index.html`, `view.test.ts`, `daemon.test.ts` and `screenshots.test.ts` in other units | #217 | It is sealed and about to merge, and this item is at its frame. The merge into this branch before phase 1's build costs nothing: no unit is changed by both. |
| #215, #216 and #133, one pull request | `apps/desktop/src/renderer/themes.css`, where #215 adds `--on-edge` to each of the six blocks, as this item adds `--tab-*`; `docs/design.md` and `docs/design.ko.md`, where #215 adds `--on-edge` to the names' bullet and to each theme's table, and #215 and #216 add rows to *Components and their states*; `protocol.ts` `ClientMessage`, where #216 adds `readLists`; `daemon.ts`, `view.ts`, `index.html`, `screenshots.test.ts`, `screenshots.ts`, `view.test.ts`, `daemon.test.ts` and `work-item-menu.test.ts` in other units | #215, #216 and #133 | Their build is done and their branch is being merged for its tail, and this item is at its frame. The token tables and the style sheet's blocks meet line by line, so whichever merges second resolves them. Merging after them puts that resolution in this item's own phase 2, which changes those tables anyway, and leaves their sealed branch untouched. |
| #223 | Not known: its frame holds no scope yet. Its issue changes the approval line (`view.ts#approvalPlaces`) and how the daemon learns a pane's stage; where it adds a field to `SessionInfo`, both items change the same interface | the one sealed first | No order costs less while #223's frame is unwritten. Where both add to `SessionInfo`, the second to merge keeps both fields; the window reads neither field for the other's purpose. |
| #230, not framed | Its keys will open, close and move between tabs, and will read this item's menu entries and `closePanes` | #213 | #230 lists every key of the window in one place, so it reads this menu as it stands. This item adds no key, so nothing of #230's is changed by it. |

## Operational impact

- No migration, no new environment variable and no new dependency.
- The protocol gains `setPane` and two optional fields of `SessionInfo`. A window of this build attached to a daemon of an earlier build offers the close entries alone, since that daemon sends no `name`. A window of an earlier build attached to a daemon of this build ignores the two fields.
- A pane's name and colour end with its daemon. "Restart Daemon…" and an update that replaces an idle daemon (#133) both end them, as they end the pane.
- This pull request moves no version.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
