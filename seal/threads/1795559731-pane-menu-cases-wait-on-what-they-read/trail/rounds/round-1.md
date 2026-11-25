# Review round 1: 1795559731-pane-menu-cases-wait-on-what-they-read

```seal
target: 16214165 against release/v0.0.4
```

The range is `4a005ebf..16214165`: the app rule of phase 1, the menu cases and the step after a failed case of phase 2, the version move of phase 3, and the four waits of phase 4. This is the first round, so no earlier round hands this one a coordinate, and every fact below was established here. The records read whole at `16214165` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and the four `trail/phases/` records. No `pr.<lang>.md` is owed, since `seal/config.json` names English for `Commit and pull request language`. No `seal/parity.json` stands, so no parity comparison applies.

## Findings

### 1. The step after a failed case is cut off at 10 seconds, before its own 15-second wait for one tab can end or report

```seal
severity: should
location: `apps/desktop/test/terminal-basics.test.ts:158-165`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_hook_bound.test.ts` in the round's clone; read `apps/desktop/test/terminal-basics.test.ts:159-165`, `apps/desktop/test/built-app.ts:266`, `apps/desktop/vitest.config.ts:19-30`, `node_modules/.pnpm/@vitest+runner@4.1.12/node_modules/@vitest/runner/dist/chunk-artifact.js:746-752`
```

Why it matters: `frame/design.md` *Scope* item 6 says a case that fails leaves the next case one tab and "Side by side" off. The `afterEach` at `terminal-basics.test.ts:159` passes no timeout, so `@vitest/runner` 4.1.12 bounds it by `hookTimeout` (`chunk-artifact.js:752`). Neither project of `vitest.config.ts` sets `hookTimeout`, and the describe's `{ timeout: 30_000 }` bounds the cases and not the hooks. So the step has 10 seconds. Inside it, `app.until` at line 162 waits up to 15 seconds by default (`built-app.ts:266`). The probe confirms the bound in this repository's config: an `afterEach` that waits 12 seconds, inside a describe with `{ timeout: 30_000 }`, failed with "Hook timed out in 10000ms."

Two things follow where the panes take longer than 10 seconds to close, as on the loaded runner this issue came from. First, the wait's own message, "one tab, once the panes the failed case left are closed", is never reported, because the timeout fires first. Second, a timeout does not stop the hook's promise. The next case starts while `app.until` is still polling. When the wait ends, line 164 presses "Side by side" in the middle of that case. That is the leak between cases that item 6 exists to stop.

The fix gives the step the 30 seconds the describe gives each case. That covers the daemon round trip, the 15-second wait and the button. No other statement of the step names a bound: the comment at line 158 and `frame/design.md` *Data & interfaces* describe what the step does and not how long it may take, so the snippet touches only the hook's closing line.

```ts
  // A case that fails stops at its failing line, and leaves the panes it opened and "Side by side" as they were there. The cases after it start from one tab, the first pane's, with "Side by side" off. A case that passes leaves what the case after it reads: it closes its panes itself, or hands its pane on, as the case "makes a path a pane printed a link…" hands its pane to the case after it. So this acts after a case that failed alone. It is bounded as a case is, since its wait for one tab is the 15 seconds of `BuiltApp.until`, past Vitest's 10-second bound for a hook.
  afterEach(async ({ task }) => {
    if (task.result?.state !== "fail") return;
    const left = await closeFromElsewhere(...openedPanes);
    if (left.length > 0) await app.until(`${TABS}.length === 1`, "one tab, once the panes the failed case left are closed");
    // The button is pressed from the page, since a case that failed may have left another screen in front of the view that holds it.
    await app.evaluate(`void (document.getElementById("side-by-side").getAttribute("aria-pressed") === "true" && document.getElementById("side-by-side").click())`);
  }, 30_000);
```

### 2. `gaps.md` names the two hover failures by line numbers of `f521b5c2` without naming that commit, and at the target those lines are other lines

```seal
severity: should
location: `seal/threads/1795559731-pane-menu-cases-wait-on-what-they-read/gaps.md:10`
evidence: executed `git show f521b5c2:apps/desktop/test/terminal-basics.test.ts | sed -n '669p;749p'` and `sed -n '695p;775p' apps/desktop/test/terminal-basics.test.ts` at `16214165`
```

Why it matters: the row hands the orchestrator a question to answer from the first attempts of `check`. A failure log of those runs names the line at the commit the run tested. At `16214165`, line 669 of `apps/desktop/test/terminal-basics.test.ts` is `expect(Math.abs(box.top - (at.y + rowHeight / 2))).toBeLessThan(1.5);` and line 749 is a `const folder = ...` assignment. The card check the row means, `expect(await app.evaluate<boolean>(CARD_SHOWN)).toBe(true);`, is line 695, and the link check, `expect(await linkAt(0, 5)).toBe(true);`, is line 775. Both are 26 lines lower, because phase 4 added lines above them. An orchestrator matching a log line against the row would not find either. `frame/design.md` line 67 gives the same two numbers and says they are `trail/phases/phase-4.md`'s, so that row is dated and holds. `gaps.md` states the present and names no commit.

The fix names the commit the runs read, so the numbers stay true however many lines a later fix adds:

```markdown
| Whether "shows a card under a link the pointer rests on…" (line 669 of `f521b5c2`, with every replay 150 ms late) and "makes a path a pane printed a link…" (line 749 of `f521b5c2`, at 100 ms) fail by the late replay or by the machine's load. Each failed once and passed at every other delay of `trail/phases/phase-4.md`. Neither sends to a pane that came back | the orchestrator, from the first attempts of `check` that row Q1 of `frame/questions.md` counts |
```

### 3. The plan says the menu-open case names the paste when the daemon's replay stops coming, and the target has it fail earlier, at the wait for the replay

```seal
severity: should
location: `seal/threads/1795559731-pane-menu-cases-wait-on-what-they-read/frame/plan.md:11`
evidence: read `apps/desktop/test/terminal-basics.test.ts:372-385`, `apps/desktop/test/terminal-basics.test.ts:397-400`, `apps/desktop/test/terminal-basics.test.ts:535`, `apps/desktop/test/terminal-basics.test.ts:1036-1040`
```

Why it matters: *Technical context* says what breaks in six months: a daemon that answers a listed session's `attach` late or never. It goes on: "The menu-open case fails then with nothing handed to the pane within its 15 seconds, and names the paste." This sentence says how the work's own cases fail, so it is read against the target. There, the menu-open case calls `untilReplayDrawn` at line 1040, right after the pane comes back and well before any paste. `untilReplayDrawn` stands on `comeOnto`, which throws after 15 seconds with "the window never showed the link on the pane's first row, drawn again from its replay" (lines 372 to 385 and 397 to 400). So with no replay, the case stops there and never reaches `pasteOnceBack`. With a replay later than 15 seconds it also stops there. A replay sooner than that is absorbed by the wait, and the case passes. The first case in the file to fail would be the Shift+Enter case, at its own call on line 535. A reader who debugs a silent pane by looking for a paste failure looks in the wrong place.

The sentence was already wrong at the framing commit `9a2a8647`, since *Scope* item 5 put the wait before the paste there too. The rest of the paragraph holds. The fix replaces that one sentence:

```markdown
- **What breaks in six months.** A later change makes the daemon answer the `attach` of a listed session late, or not at all, such as a queue in front of the daemon's messages. A returned pane then stays silent, and nothing on the screen says so: a person's keys vanish. Where the replay is more than 15 seconds late or never comes, the cases of `test/terminal-basics.test.ts` that wait for a returned pane's replay fail at `untilReplayDrawn`, the first of them the Shift+Enter case, with "the window never showed the link on the pane's first row, drawn again from its replay", and the menu-open case fails the same way before its paste. A case written later that types into a pane right after it came back loses its keys until the replay is drawn, and has to wait on something the replay draws. The build met four such cases already in the file, and `frame/design.md` *Scope* item 9 has them wait.
```

## Confirmations

What matched: the rule of *Scope* item 1 and *Data & interfaces*. `screenTurns` at `apps/desktop/src/renderer/view.ts:2509-2552` sets `unreplayed` from `drawnBefore` at each take, so a turn's silence ends with the turn. It clears the silence only in the draw callback of an unanswered piece written in the same turn. `receiver()` answers with nothing while the silence holds, which covers keys, pastes and the terminal's answers alike, since all three leave through `receiver()`. `work-item-view.ts:641` hands `replayed.has(pane)`. `work-item-view.ts:1403-1404` writes a replay with `answered` false exactly where `replayed` holds the pane. So a pane taken as returned always gets its replay written unanswered, in the turn that asked for it. `replayed` loses a pane only in `dropClosed` (`work-item-view.ts:704`), for a pane the daemon no longer lists, and the daemon answers every `attach` of a session it holds (`apps/desktop/src/daemon/daemon.ts:1377-1385`). So no listed returned pane is silenced past its replay by the window's own state. Read. `turns.take(` has one caller in `apps/desktop/src`, by `git grep`. Executed.

What matched: the three new unit cases against the `screenTurns` group of `apps/desktop/test/view.test.ts`. The five earlier cases of the block all take a pane with no second argument, so none of them reaches `unreplayed`. Each new case holds a guard that no other case holds: the silence itself, the same-turn comparison in the draw callback, and the reset at the next take. That matches the crafter's mutation table in `trail/phases/phase-1.md`, which this round read and did not run again. The block passed, 9 cases, in the round's clone. Executed. The case beyond the two that *Scope* item 2 names is argued in `trail/phases/phase-1.md` and holds: without it, the mutation that drops the turn comparison survives.

What matched: `trail/phases/phase-2.md` says `@vitest/runner` 4.1.12 marks a case `fail` before it runs `afterEach`. In `runTest` (`chunk-artifact.js`, around lines 2942 to 2974), `failTask` sets `state = "fail"` in the catch around the case's body, and the `afterEach` hooks are called after that. Read. `openReceiverPane` opens the first pane and `openPane` does not, so the step never closes the pane the later cases read (`terminal-basics.test.ts:104`, `:125-133`). Read.

What matched: *Data & interfaces* says `OVER_LINK` reads only the first tile, and that no case reads it while two tiles stand. `git grep` on `OVER_LINK` and `side-by-side` at the target puts every read of `OVER_LINK` (lines 404, 416, 652 and 762) outside the two spans where two tiles stand (lines 570 to 583 and 994 to 1036). Executed. `untilReplayDrawn` is called from five places, and only the two-drop case names a tile (line 576), as `frame/design.md` line 68 says. Executed.

What matched: scenario 5. `git grep -n '0\.0\.[0-9]'` over the two files prints line 3 of `apps/desktop/package.json` and lines 33, 36 and 38 of `.github/workflows/owlery-seal.yml`, each with `0.0.4`. Executed. `release/v0.0.4` stands on the remote at `4a005ebf`, by `git ls-remote`, so the workflow's fallback clone of that branch has something to clone. The tag `v0.0.4` does not exist yet, and `gaps.md` row 3 keeps that for the orchestrator. Executed.

What matched: `pr.md`. Each of its eleven quotes is word for word at its coordinate, with the bold markers left out: the *Judgments of the run* row at `frame/plan.md:60`, *Scope* items 1 to 7 and 9 at `frame/design.md:74-82`, and Q2 and Q3 at `frame/questions.md:17-18`. Read. Its first line holds against `frame/questions.md` Q1's default.

What matched: the title's prefix, `fix:`. The plugin's `skills/commit-pr-convention/SKILL.md` *Commit messages* gives `fix:` for "behaviour that was wrong against a rule the tree stated before the change, now matching it". Where a change does more than one kind, the prefix is the highest kind in the table. At the base `4a005ebf`, the comment of `menuAct` says "a program that asked for pastes in brackets receives one" (`work-item-view.ts:431-432`). The comment of `takesDrops` says the same of a drop (`:529-530`). The comment of the menu's clear says the pane has the modes again "when it comes back onto the stage" (`:436-438`). The docstring of `pasteOnceBack` says a screen sends nothing until its terminal has drawn the replay. Each is a rule the tree stated, and the unbracketed paste broke it. The change makes the app hold them, so the `fix:` row describes it.

The `feat:` row would apply if the dropping of keys were a refusal on a rule the change itself states. But the tree stated that rule before the change, in the `pasteOnceBack` docstring and in the base comment of `work-item-view.ts#write` ("The screen sends nothing until the terminal has drawn a later replay"). So `feat:` does not take precedence. The judgment row names `menuAct`, the drop and `screenTurns` as its grounds. Its sentence on `screenTurns`, that the change "widens the span", is the weakest of those grounds, since widening a span is not matching a stated rule. The `pasteOnceBack` docstring, which `frame/design.md` line 31 already cites, carries the point better. The judgment holds on what it does cite. The titles of `gh pr list --state all --limit 10` take the same shape, a prefix and then the defect as a symptom. Executed.

What matched: `changelog.md` against the target. Its paragraph and its three bullets say what `view.ts`, `work-item-view.ts` and the six waits of `terminal-basics.test.ts` do, including the fifteen seconds of `pasteOnceBack` (`terminal-basics.test.ts:1093-1104`). Read. `gaps.md` *Not done* reads `nothing`, and that holds: each of the four cases it once named now calls `untilReplayDrawn` (lines 535, 554, 576 and 926). Executed. No row of `gaps.md` *Not verified* left the file within the range. The one changed row, the full-suite row, was reworded in place at `a74a0e34`, by `git log -p` over the file. Executed.

Gaps named outside the findings. These are no finding by `skills/code-review/SKILL.md` *The record*.

- The wait added to the Shift+Enter case (`terminal-basics.test.ts:534-535`) has never been seen to change anything. That case passed at every delay phase 4 tried, as `frame/design.md` line 66 and scenario 7 say. The design states the wait, so the gap is in what a run can show, and the design already says so.
- The comments of `menuAct` and `takesDrops` still say a program that asked for pastes in brackets "receives one". That now holds outside the returned pane's silence only. These comments are read by whoever next edits the functions. *Scope* item 3 names only the comments of `screenTurns`, `ScreenTurns` and `write` for rewriting.
- The first *Judgments of the run* row (`frame/plan.md:59`) cites `gaps.md` *Not done* for the three cases left open. That section now reads `nothing`, and the list stands in `trail/phases/phase-2.md`, which the row cites too.
- The step after a failed case does not bring the first work item's view back where a failed case left another view or screen in front. *Scope* item 6 does not promise that, so this is no finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the repository-wide typecheck and the broad gate of `seal/config.json`. The suite is `unverified` here: this round ran the `screenTurns` block, one probe file and one built-app file, as the probes table lists | `seal/config.json` `Broad gate` | the orchestrator, by its broad run |
| Whether both menu cases pass on the first attempt of `check` three runs in a row on the hosted runner | `frame/questions.md` Q1 | the orchestrator, from the pull request's runs |
| *Overlap with the release* judged #149 from its issue, as a work item in which the built-app files share one open app. Pull request #203 for #149 is now open into `release/v0.0.4` as "every built-app file starts its own app". It changes `apps/desktop/package.json`, but not the version line. So the row's grounds on a reload between files no longer describe #149, while the "#168 merges first" order and the version move are not contradicted | `frame/plan.md:46` | the orchestrator, which orders the release's merges |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts -t screenTurns`, from `apps/desktop` of the round's clone at `16214165` | 9 passed, 513 skipped, exit 0 |
| `node scripts/test-in-electron.mjs test/test_tmp_hook_bound.test.ts`, the same place: an `afterEach` that waits 12 s inside `describe(..., { timeout: 30_000 })` | 1 failed, "Hook timed out in 10000ms.", exit 1: a hook in this config is bounded at 10 s |
| `OWLERY_BACKGROUND=1 OWLERY_TMP_REPLAY_DELAY=1500 node scripts/test-in-electron.mjs test/terminal-basics.test.ts`, the same place, with the phase-1 `replay-delay.patch` applied by `git apply` in the clone and in no other tree | 25 passed of 25, 71.7 s, exit 0: scenario 7's green half holds at the target. The patch was taken out with `git apply -R` afterwards |
| `git ls-remote --heads origin release/v0.0.4`, in the worktree | `4a005ebf9f321d346c15e5f0d68683d31e4cc789 refs/heads/release/v0.0.4` |
| `python3 skills/code-review/scripts/chain_check.py --baseline 4a005ebf --root <the worktree> --worktree`, before this record was written | exit 0. It named three things owed: no round record yet, no gate record, no guarantee. It printed no notice at a line of `frame/design.md` |
