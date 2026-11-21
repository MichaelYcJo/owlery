# Closing memo: the Open in submenu (#109)

## Not verified

| Item | Who must answer |
|---|---|
| The test files that start the built app and so load the page and the bundle this phase changed, and that the phase did not run: `terminal-basics`, `navigation`, `work-item-form`, `keep-awake`, `notification-click`, `daemon-restart`, `daemon-client`, `korean-input` and `memory` under `apps/desktop/test/`. The spawn narrowed the phase's run to the cases the plan names | the orchestrator, by the broad gate of `seal/config.json` |
| How the submenu and the mark at the right edge of "Open in" look when drawn, in the light theme and in the dark one. No case reads a colour, a size or the mark. The mark is a corner drawn with two borders in `--ink-faint`, and "Open in" keeps the background of the item under the pointer while its submenu is open | the owner, at the hand check of the built app |
| That a folder which stands opens in Finder, in an editor and in a terminal from the submenu's items. The one case that presses an item presses Finder on a folder it moved aside, as `frame/plan.md` *Technical context* constrains | the owner, at the hand check, as `seal/threads/1795152521-work-item-menu/gaps.md` leaves the same for the top-level items |
| Whether the pause of 300 ms is long enough for a hand that moves the pointer from "Open in" down to the last item of the submenu. The cases move the pointer in one step through the debugging port, and no case moves it along a path | the owner, at the hand check, on a Mac with several editors and terminals installed |
| What a screen reader says of "Open in" and of the submenu. The cases read `aria-haspopup`, `aria-expanded` and the submenu's `aria-label`, and nobody ran VoiceOver | the owner, where the release asks for it |

## Not done

A press inside the menu on a rule, while the submenu is open, leaves the submenu open: `frame/design.md` *Scope* item 5 closes it only where the keyboard moves to another item, and no case holds the press on a rule with the submenu open. It was left as the frame states it.

The Home and End keys, a jump to an item by its first letter, and a submenu for the "Move to" items are out of the frame's scope and were not built.
