# Review round 1: 1795158088-terminal-basics

```seal
target: 7532ada against release/v0.0.1
```

This round reads phase 1 alone: `frame/plan.md` *Phases* row 1, which delivers `frame/design.md` *Scope* items 1, 6, 7 and 8 with `## Removes` row 1. Phase 2 (the drop, the link, Shift+Enter, the dependency and `changelog.md`) is not built, so `changelog.md`, `pr.md` and a `pr.<lang>.md` do not stand yet and were not looked for as missing. There are no earlier rounds, so no fact was carried from one. The range `85c381a..7532ada` was read in the worktree of the branch; no clone was made and no file outside the record was written.

The records read whole at `7532ada`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md` and `trail/phases/phase-1.md`. The two statements the orchestrator folded at `7532ada` match the tree: `frame/design.md` *Data & interfaces* now names `pages()` and `DebugSession`, which `apps/desktop/test/built-app.ts` holds, and `frame/questions.md` Q3 is answered (a), which `apps/desktop/test/fixtures/basics-shell.sh` and `apps/desktop/test/fixtures/claude-stand-in/` carry out.

The axes walked were the table's ten and three of this change's own: the menu's accelerators as Electron builds them from roles, where the keyboard goes when the dialog closes, and the order of the shared cases in `test/terminal-basics.test.ts` that phase 2 builds on.

## Findings

### 1. No case tells the dialog's sentence naming the tab's label from one naming the kind's label

```seal
severity: should
location: `apps/desktop/test/terminal-basics.test.ts:255-264`, `apps/desktop/src/renderer/work-item-view.ts:290`, `seal/threads/1795158088-terminal-basics/trail/phases/phase-1.md:74`
evidence: read `apps/desktop/src/renderer/work-item-view.ts:290`, `apps/desktop/src/renderer/view.ts:13-18`, `apps/desktop/src/daemon/pane-kinds.ts:11`, `apps/desktop/test/terminal-basics.test.ts:214-222`, `apps/desktop/test/terminal-basics.test.ts:255-264`; executed `git grep -n "is working. Closing" 7532ada -- apps`
```

Why it matters: `frame/design.md` *Scope* item 8 says the dialog says "<the tab's label> is working. Closing the pane ends its session." The diff builds that label at `work-item-view.ts:290` from `tabLabel` over the work item's tabs. `view.ts:17` adds a number only where more than one pane of the kind is open, so the tab of the only Claude Code pane reads "Claude Code", which is also the kind's label at `pane-kinds.ts:11`. Every dialog the cases open asks about the only Claude Code pane of the work item. Scenario 11's case opens one at `terminal-basics.test.ts:214`, and the last case opens one at `:256` after the earlier one has closed. The one assertion on the sentence (`:222`) therefore holds against code that names the kind's label. It also holds against code that hands `tabLabel` the asked pane alone in place of `paneTabs(...)`. The search over `apps` found that assertion and no other. With two Claude Code panes, either version of the code would name the pane "Claude Code" while its tab reads "Claude Code 2", and the person could not tell which pane the dialog means. No case would go red.

The phase record claims at `phase-1.md:74` that the mutant "the sentence naming the kind in place of the tab's label" went red. The mutation output names no mutant's text. A mutant that writes the kind's identifier, `claude`, does fail `:222`. A mutant that writes the kind's label does not, by the reading above. The fix pass owes that row a sentence that names which of the two was run.

The snippet below replaces the last case. It opens two Claude Code panes so the asked pane's tab carries a number, and it still leaves the first shell pane as the one tab in front, which `phase-1.md` *What phase 2 needs* relies on. It assumes that the strip reads the newest live Claude Code pane (`view.ts#lineSession`), so the second wait sees that pane's own state.

```ts
  it("names the pane by its tab, and closes the dialog where its pane is gone while it asks", async () => {
    // The strip reads the newest live pane of a kind that reports state, which is the pane just opened (./src/renderer/view.ts, `lineSession`).
    const working = (): Promise<void> => app.until(`document.getElementById("strip-state").textContent.startsWith("Working")`, "the newest pane's session as working");
    const first = await openPane("Claude Code");
    await working();
    const second = await openPane("Claude Code");
    await working();
    // The tabs stand in the order of the panes' ids (./src/renderer/view.ts, `paneTabs`).
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell", "Claude Code 1", "Claude Code 2"]);
    await command("W");
    await app.until(DIALOG_OPEN, "the dialog that asks before the close");
    expect(await app.evaluate<string>(`document.getElementById("close-pane-sentence")?.textContent`)).toBe("Claude Code 2 is working. Closing the pane ends its session.");
    await closeFromElsewhere(second);
    await app.until(`${TABS}.length === 2`, "two tabs");
    expect(await app.evaluate<boolean>(DIALOG_OPEN)).toBe(false);
    await closeFromElsewhere(first);
    await app.until(`${TABS}.length === 1`, "one tab");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });
```

The fix pass owes contract rule 15 for the new assertion: it is shown red with `tabLabel`'s second argument at `work-item-view.ts:290` replaced by `[session]`, and the row of `phase-1.md:74` names that mutant.

```seal
verdict: fixed 597307b
answer: The finding holds. `597307b` replaces the last case of `apps/desktop/test/terminal-basics.test.ts` with the record's snippet, read against `frame/design.md` *Scope* item 8 and `view.ts#lineSession`, `paneTabs` and `tabLabel`; the snippet's assumption about the strip holds, because `work-item-view.ts#showView` writes the strip and the tabs from one list. Two things differ from the snippet: the case's name says "its tab's label", and one assertion more reads "Claude Code 2" as the tab in front before the key. The case was seen red under `seal mutate` at `597307b`, one mutant per call, each failing on the sentence's line `terminal-basics.test.ts:267` with "Claude Code is working." received: `tabLabel`'s second argument replaced by `[session]`, and the label read from the kind's label in `held.paneKinds`. Scenario 11's assertion at `:222` passed under both, which is the finding. A third call removed `dropClosed`'s close of the dialog, and the case failed at `:270`, so it still holds what the case it replaces held. `f29df97` rewrites the row of `trail/phases/phase-1.md:74` to name the two mutants and says under the table that the phase's own mutant of the sentence left no text, so which of the two readings it was is not known; the same commit adds the pass's run to row 1 of `gaps.md` *Not verified*. No code under `apps/desktop/src` changed.
```

## Confirmations

What matched: the two points the crafter left for this round, rows 4 and 5 of `gaps.md` *Not verified*, hold by reading.

- **`inboxKey` reads no key while the dialog is open.** `renderer.ts:149` hands `inboxKey` the result of `dialogOpen()`, and `dialogOpen()` at `renderer.ts:122-124` is true wherever any `dialog[open]` stands, so the new `#close-pane-dialog` counts. The gaps row's second reason also holds. The dialog opens only from `closePane` (`work-item-view.ts:283-293`). Its two callers are a tab's "×", which only the view draws, and `closeFront` (`:296-299`), which finds nothing once `leaveView` has cleared `front` (`:385`). In the view, `renderer.ts`'s `front` is `"view"`, so `inboxInFront` is false.
- **Command+W never reaches the terminal of the pane in front.** `onCommandKey` is registered on the document's capture phase (`renderer.ts:408`). For every key `commandKey` returns, `"closePane"` among them, it calls `preventDefault` and `stopPropagation` (`:130-131`) before xterm's listener on its helper textarea, which stands below the document, sees the event. While a dialog is open, `commandKey` returns null and the key is not stopped. The modal dialog then holds the keyboard and the page behind it is inert, so no terminal has the focus to read it.

What matched: *Scope* item 1. `main.ts:44-47` puts the guard and `setWindowOpenHandler(() => ({ action: "deny" }))` on the window `createWindow` makes, before `loadFile`. `navigation.ts#staysOnPage` lets through only the URL the window shows, which the reload of `renderer.ts` asks for. `test/navigation.test.ts` holds the refusals. Scenario 1's case reloads the page through the guard (read).

What matched: *Scope* item 6. `menu.ts#menuTemplate` for `darwin` holds the app's menu entries the item lists, with "File / Close Window" on `Shift+CommandOrControl+W`, and Electron's `editMenu`, `viewMenu` and `windowMenu` roles. `main.ts:82` sets it before `createWindow`. Scenario 9's case reads `item.accelerator` of the built menu. The crafter's red output `phase-1/red-built-1.txt` shows its `taken` assertion failing on `File / Close Window: CommandOrControl+W` against Electron's default menu. So the case sees the key a role brings, which is the failure scenario `frame/plan.md` *Technical context* names. The framer's probe output lists the same entry with the same accelerator (read).

What matched: *Scope* item 7. `view.ts#commandKey` returns `"closePane"` for `KeyW` under the conditions of K and N, and `renderer.ts:134` calls `closeFront`. A pane that takes the keyboard by a click becomes `front` through the `focusin` listener at `work-item-view.ts:143-147`. So the pane Command+W closes is the one with the keyboard, as the item defines "the pane in front" (read).

What matched: *Scope* item 8 and `## Removes` row 1. `closeAsks` reads `alive` and `state` and no kind. The "×" listener no longer sends `close` itself (`work-item-view.ts:317`), and its old comment moved into `closePane`'s docstring. "Cancel" is the dialog's first control (`index.html:540-546`), "Close pane" sends the `close` (`work-item-view.ts:464-467`), `dropClosed` closes the dialog when its pane is gone (`:217`), and the `close` listener gives the keyboard to the pane in front (`:469`) (read).

What matched: the phase record's departures. The explicit "Window" menu outside macOS and `test/menu.test.ts` both stand on *Scope* item 6's sentence that no menu item is bound to a key `commandKey` reads. Neither that sentence nor this round can say which keys Electron's `windowMenu` role brings outside macOS. In Electron 45.3.3 the role defaults are compiled into the framework binary (`_roleDefaults`), and the strings of that binary showed no submenu. The `gaps.md` row with the owner as answerer stands (executed: `strings` over the Electron Framework binary).

What matched: the phase record's coordinates. `hooks.ts:83-86` starts a Claude Code pane as `$SHELL -l -i -c 'exec claude --settings <file>'`. `daemon.ts:102` numbers panes from 1. `25d8045` and `ec84d9c` change comment lines alone (executed: `git show 25d8045 ec84d9c -- apps` with every comment line filtered out printed nothing).

`test/menu.test.ts`'s case 'closes the window on Shift+Command+W, from "File"' holds on `darwin` the fact scenario 9's case already holds in the built menu (`terminal-basics.test.ts`, the `closeWindow` assertions). It adds only that "File" holds no other entry, so it is named here and is no finding.

The chain check run over this worktree prints a notice at `frame/design.md:135` and `:141`: the check line of each rule change names `apps/desktop/test/links.test.ts`, which does not exist. `frame/plan.md` *Phases* row 2 makes that file, and phase 2 is not built, so the notice is weighed as no finding at this target. The round after phase 2 reads it again.

The suite's label is honest. `gaps.md` *Not verified* row 1 names the suite, the typecheck and the `Broad gate` command of `seal/config.json` as the orchestrator's. The runs the row says the phase made match the crafter's captured outputs: 9 files passed at `414d47f` (`phase-1/boundary.txt`), and 2 files and 14 cases at `ec84d9c` (`phase-1/after-comments.txt`) (read). This round ran no test. Once finding 1 is closed, what comes due is phase 2's build. The orchestrator's broad run and the sealer come after the last phase's rounds.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a held Command+W should close one pane or several. `onCommandKey` acts on every `keydown`, the key's auto-repeat among them. Once the `inbox` that drops the first pane has arrived, the next repeat closes the next pane in front that is not working. The frame says nothing of a repeated press | `apps/desktop/src/renderer/renderer.ts:127-134` | The owner, at the hand run of `frame/questions.md` Q4 |
| A person's press of Command+W and Shift+Command+W through the system's menu | `gaps.md` *Not verified* row 2 | The owner, as that row names |
| The suite, the typecheck and the broad gate at the head of the branch | `gaps.md` *Not verified* row 1 | The orchestrator, in the broad run after the review rounds settle |

## Probes

| Command | Result |
|---|---|
| `git grep -n "is working. Closing" 7532ada -- apps` | Two lines: the sentence at `work-item-view.ts:290` and the one assertion at `terminal-basics.test.ts:222` |
| `git show 25d8045 ec84d9c -- apps`, with the added and removed lines that are not comments filtered out | Nothing printed: both commits change comments alone |
| `strings -n 8` over Electron 45.3.3's framework binary, searched for `windowMenu` and `getDefaultRoleAccelerator` | Both names stand among the menu's C++ strings, with `_roleDefaults`. No role's submenu or accelerator was printed |
