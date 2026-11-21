# Closing memo: the Open in submenu (#109)

## Not verified

| Item | Who must answer |
|---|---|
| closed The test files that start the built app and so load the page and the bundle this phase changed, and that the phase did not run: `terminal-basics`, `navigation`, `work-item-form`, `keep-awake`, `notification-click`, `daemon-restart`, `daemon-client`, `korean-input` and `memory` under `apps/desktop/test/`. The spawn narrowed the phase's run to the cases the plan names | answered at the settle of release 0.0.1: the `Broad gate` of `seal/config.json` passed at `d2efdee`, the run `trail/gate.md` records, which runs every test file under `apps/desktop/test/` that starts the built app |
| closed How the submenu and the mark at the right edge of "Open in" look when drawn, in the light theme and in the dark one. No case reads a colour, a size or the mark. The mark is a corner drawn with two borders in `--ink-faint`, and "Open in" keeps the background of the item under the pointer while its submenu is open | a measurement no record asks for, closed at the settle of release 0.0.1: how the part looks when drawn is the owner's to judge at the window, and the answer would decide only a change of its style. No open issue, failed run or other rule rests on the answer, so nothing is opened |
| closed That a folder which stands opens in Finder, in an editor and in a terminal from the submenu's items. The one case that presses an item presses Finder on a folder it moved aside, as `frame/plan.md` *Technical context* constrains | a measurement no record asks for, closed at the settle of release 0.0.1: the one case presses Finder on a folder moved aside, as `frame/plan.md` *Technical context* constrains, and the answer would decide only whether an app the person chose opens. No open issue, failed run or other rule rests on the answer, so nothing is opened |
| closed Whether the pause of 300 ms is long enough for a hand that moves the pointer from "Open in" down to the last item of the submenu. The cases move the pointer in one step through the debugging port, and no case moves it along a path | a measurement no record asks for, closed at the settle of release 0.0.1: the answer would decide only whether a hand needs a longer pause, which no open issue sets a number for. No open issue, failed run or other rule rests on the answer, so nothing is opened |
| closed What a screen reader says of "Open in" and of the submenu. The cases read `aria-haspopup`, `aria-expanded` and the submenu's `aria-label`, and nobody ran VoiceOver | a measurement no record asks for, closed at the settle of release 0.0.1: what VoiceOver says would decide only the wording of the controls' names, and no issue takes up the window's accessibility. No open issue, failed run or other rule rests on the answer, so nothing is opened |

## Not done

A press inside the menu on a rule, while the submenu is open, leaves the submenu open: `frame/design.md` *Scope* item 5 closes it only where the keyboard moves to another item, and no case holds the press on a rule with the submenu open. It was left as the frame states it.

The Home and End keys, a jump to an item by its first letter, and a submenu for the "Move to" items are out of the frame's scope and were not built.
