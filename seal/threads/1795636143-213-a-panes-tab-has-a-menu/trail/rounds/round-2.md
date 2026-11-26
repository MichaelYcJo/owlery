# Review round 2: 1795636143-213-a-panes-tab-has-a-menu

```seal
target: ade8a40b, fixes 95371734..ade8a40b
```

This is a verifying round over the fixes of round 1, which `95371734` recorded: `bc811c64` routes finding 1 to the code, `23e4790a` is the framer's fold, `af5227e7` is the fix pass, and `ade8a40b` records the closes. The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and both phase records whole at `ade8a40b`, and the diff `faee6ea4..ade8a40b`. No `pr.md` stands. The coordinates carried from round 1 and not searched again are the callers of `tabLabel` (`work-item-view.ts:1273`, `view.ts:1085`, `view.ts:3068`), `docs/architecture.ko.md:60`, and the five-file list of phase 2. Every verdict below was reached again at `ade8a40b`.

## Findings

None. The fix diff holds every close of round 1, and the one new unit, the body of `sendPaneName`, holds no defect this round would block on.

## Confirmations

```seal
confirms: round-1#1
```
What holds: the close says the check went into the body of `sendPaneName` and not into a new `paneNameSent`, because the fix pass may not build a unit the frame does not name. The code matches: `sendPaneName` (`work-item-view.ts:1336-1348`) computes `byKind` as `tabLabel` of the pane with `name: null` among its tabs, and sends `name: null` where the trimmed field is empty or equals it. Otherwise it sends the field as typed, which the daemon trims. A named pane keeps its name on an untouched Save, since its field holds its name, which is not its kind's label. The daemon answers `done` and sends no `inbox`. A named pane whose field is set to its kind's label loses the name, as both editions' row says. The built-app step in `terminal-basics.test.ts` *renames a pane at "Rename…"* (`terminal-basics.test.ts:523-539`) runs an untouched Save of "Shell 3" and then the close of "Shell 2" from elsewhere, and needs the third tab to read "Shell 2". That last read is what pins the fix. The read right after the Save, which finds the tabs as they were, would pass without the fix as well. The step that closes the dialog with its pane still stands, now on the second pane. This round ran the case alone and it passed (executed, below). The close's claim that the case was seen red with the `trimmed === byKind` test removed is the fix pass's `seal mutate` run, read and not re-run. The frame's *Scope* item 5 (`frame/design.md:43`), `docs/design.md:473`, `docs/design.ko.md:473`, `changelog.md:7` and `trail/phases/phase-2.md:21` each now say what `sendPaneName` does (read).

The scenario row "Rename" (`frame/design.md:69`) says nothing of an untouched Save. It contradicts nothing in the code: its sentences all hold, and the built-app case it names is the one that holds the untouched Save. So the frame matches the code at *Scope* item 5 and at that row.

One case of the new unit was weighed and is not a finding. `byKind` is read at the press of "Save", while the field holds the label from the opening. Suppose another client closes a pane before this one while the dialog is open, and the person then saves untouched. The field's "Shell 3" is then no longer the kind's label "Shell 2", and it is kept as a name. This happens only when a second client closes a pane during the modal dialog. The name it keeps is the one the dialog's heading and field showed the person. Round 1's paste-ready fix read the label at the same moment.

```seal
confirms: round-1#2
```
What holds: `changelog.md:7` names the tab, the close dialog, the account change dialog, the delete dialog and the list of the Restart Daemon dialog, and no notification. `frame/plan.md:34` names the account change dialog in the notification's place. The account change dialog and the Restart Daemon list call `tabLabel` at the coordinates carried from round 1. `git grep -n -i notification` over the work item, round records aside, prints `frame/design.md:29` alone, the fact dated to `5b20b1c6` that round 1 kept (executed).

```seal
confirms: round-1#3
```
What holds: the acceptance row (`frame/design.md:74`) and phase 1's *Verified by* cell (`frame/plan.md:51`) spell the search `'let asking: number . undefined'`. The acceptance row says what the `.` stands for. The *Removes* row (`frame/design.md:125`) names `let asking` in words. Run at `ade8a40b`, the search prints nothing (executed, exit 1). Round 1 ran it at `5b20b1c6`, where it printed the two lines; that run is carried. A search for `\|` in `frame/`, `changelog.md` and `gaps.md` prints nothing (executed).

```seal
confirms: round-1#4
```
What holds: `## Rule changes` (`frame/design.md:114-118`) holds a `change` of `docs/architecture.ko.md`, section *세션이 견디는 것*. Its `from:` sentence stands at `docs/architecture.ko.md:60` (executed, `grep -n -F`). Its `to:` is round 1's text, so *Scope* item 11's "both editions" now holds.

```seal
confirms: round-1#5
```
What holds: `trail/phases/phase-2.md:46` calls the five files a sample from `grep -ln`. It says that three match only a string, and that `gate.test.ts` matched and was not run in phase 2. It cites round 1's run of `gate.test.ts`, 631 passed, which is this reviewer's executed run at `faee6ea4`. The fix diff did not touch `gate.test.ts` or `daemon.ts`.

What matched: `frame/plan.md` *Judgments of the run* gains a row dated 2026-11-26 for the routing of finding 1 to the code, with its grounds and the documents it was judged against (read). It says what `af5227e7` did.

What matched: round 1's record at `ade8a40b` differs from the text this reviewer wrote only by the five close blocks and the lines around them (executed, `git diff 95371734..ade8a40b` on the record).

## Not judged

| What | Location | Who answers |
|---|---|---|
| `terminal-basics.test.ts` whole and the other built-app files after `af5227e7`. This round ran the one changed case alone | `gaps.md` rows 2 and 3 | the orchestrator's broad gate |
| The full suite, the repository-wide lint and the typecheck: `unverified` | `gaps.md` row 6 | the orchestrator's broad gate |
| `frame/questions.md` Q1 to Q3 stand open for the owner, and this round judged the build against their defaults | `frame/questions.md:16-18` | a person |

## Probes

| Command | Result |
|---|---|
| `cd apps/desktop && node scripts/test-in-electron.mjs --project app test/terminal-basics.test.ts -t "renames a pane at"` | exit 0: 1 passed, 39 skipped |
| `git grep -n -e 'function closePane(' -e 'let asking: number . undefined' -- . ':!seal'` | exit 1 at `ade8a40b` |
