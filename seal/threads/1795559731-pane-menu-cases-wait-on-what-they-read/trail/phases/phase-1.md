# Phase 1: 1795559731-pane-menu-cases-wait-on-what-they-read

## What this phase found

**The red half of scenario 2 fails first at line 1029, not at line 1070.** Scenario 2's row in `frame/design.md` says the menu-open case fails at line 1070 with `from the clipboard` when every replay leaves the daemon 1,500 ms late. The run at the base failed earlier, at line 1029: `expected '' to be 'https://example.com/owlery-basics\na …'`. "Select All" and "Copy" read the pane before its replay was drawn, after the click on the pane's tab at line 995. That is the read that `frame/design.md` *Scope* item 5 makes wait, so the frame holds. Only the scenario's statement of the first failing line is wrong. To show the red at the paste itself, the wait of item 5 was added at the base for one run and taken out again. That run failed at the paste with the message the two CI runs recorded, `expected 'from the clipboard' to be '\u001b[200~from the clipboard…'`, at line 1072, which is line 1070 moved down by the two lines added. In the same run the menu-close case failed with "the window never showed one tab" at line 1099, line 1097 moved down. Each run was `OWLERY_BACKGROUND=1 OWLERY_TMP_REPLAY_DELAY=1500 node scripts/test-in-electron.mjs test/terminal-basics.test.ts -t "pane's menu"` from `apps/desktop`, with the daemon's `attach` edited as the probe of `frame/design.md` *Grounding* describes. The code of the app at HEAD `9a2a8647` is the code at `f7bbcd7a`, since `9a2a8647` adds only the frame. The daemon's edit and the added wait were removed with the `Edit` tool before the phase's commit, and neither is in it. Executed.

**Without the late replay, both cases passed at the base.** The same command without the daemon's edit passed both cases: 2 passed, 23 skipped. Executed. A run at the base shows nothing of the race on this machine, which is why scenario 2 delays the replay.

**The unit cases were seen red before the rule.** Three cases were added to the `screenTurns` block of `apps/desktop/test/view.test.ts`. Against `screenTurns` at the base, the case "sends a pane that comes back onto the screen nothing a person types until the terminal has drawn its replay" failed with `expected [ [ 4, 'a' ], [ 4, 'b' ] ] to deeply equal [ [ 4, 'b' ] ]`. The case "keeps a pane that comes back silent where the replay the terminal draws was written in an earlier turn" failed with `expected [ [ 5, 'a' ], [ 5, 'b' ] ] to deeply equal [ [ 5, 'b' ] ]`. The case "leaves no silence behind a pane that came back and left before its replay came" asserts that keys are let through, so it passed at the base, and contract rule 15 has it shown red with its one guard removed. That is the second mutation below. Executed.

**The case on a replay written in an earlier turn is one more than `frame/design.md` *Scope* item 2 names.** `frame/design.md` *Data & interfaces* says the silence belongs to the turn. A replay of the pane that left can still be on its way to the terminal when the next returning pane takes the screen, and its draw must not end the next pane's silence. The rule holds this by comparing the turn a piece was written in with the turn at its draw, and that comparison needs a case of its own, or its mutation survives. Judged against `skills/implement/SKILL.md` *2. Implement test-first, and let each rule name its test*.

**`take` takes `drawnBefore` as an optional second argument, false where it is left out.** `frame/design.md` *Scope* item 2 says the existing cases of the block stay as they are, and they call `take` with the pane alone. A pane taken without the argument is sent what it was sent before this change.

**The silence ends when the terminal has drawn a piece written in the same turn with `answered` false.** Only a later replay is written that way (`apps/desktop/src/renderer/work-item-view.ts#write`), and a returning pane's replay is always a later one, because `take` hands `screenTurns` what `replayed` holds at that moment. The first replay of a pane is written with `answered` true, and that pane is taken with `drawnBefore` false.

**Each guard of the rule goes red when broken alone.** Each was run with `seal mutate src/renderer/view.ts --replace … --tests "node scripts/test-in-electron.mjs test/view.test.ts -t screenTurns"` from `apps/desktop`, after the commit. Executed.

| Break | Verdict | The case that went red |
|---|---|---|
| `receiver` ignores `unreplayed` | red | the first two new cases |
| `take` keeps the last turn's silence: `drawnBefore \|\| unreplayed` | red | "leaves no silence behind a pane that came back and left before its replay came" |
| the draw of any unanswered piece ends the silence, whatever turn wrote it | red | "keeps a pane that comes back silent where the replay the terminal draws was written in an earlier turn" |

`work-item-view.ts#take`, which hands `screenTurns` the value of `replayed`, has no unit case: the module runs only in the built app. The mutation of its argument is run against the menu-open case with the late replay in phase 2.

**The commit is `fix:`.** The comment of `menuAct` in `apps/desktop/src/renderer/work-item-view.ts` stated before this change that a program that asked for pastes in brackets receives one, and a paste into a pane that had just come back broke that. Judged against the plugin's `skills/commit-pr-convention/SKILL.md` *Commit messages*.

**The typecheck was run over the package.** `pnpm run typecheck` from `apps/desktop` is `tsc --noEmit` over the package's project, the narrowest form that checks the changed files, and it passed. The repository configures no linter or formatter. Executed.

**Phase 2 has to look at the other cases of `test/terminal-basics.test.ts`.** The rule now drops a key typed into a pane that came back before its replay is drawn. Before this change such a key was sent. Several cases type into the first pane right after it comes back. One is "sends a line feed for Shift+Enter…" at line 499, after the case before it closed the pane in front of it. Where the replay is late, such a case now loses its key. A run of the whole file with the late replay lists each case of this kind.
