# Review round 1: 1795610688-242-sidebar-click-survives-a-redraw

```seal
target: 5f11cee4 against release/v0.0.5
```

This round reviewed the branch at `5f11cee4` against `release/v0.0.5` at `ab7a5730`, in a `git clone --no-local` of the branch worktree made under the round's scratch directory. No earlier round stands, so no fact is carried. Every coordinate below was opened at the target this round. `seal/parity.json` is not declared, and `seal/config.json` has no `Pact` key. `seal/threads/` holds no other work item at the target, so the axis *Record against another work item's frame* has no frame to walk.

The axes this change adds to the table are the order of input events against tasks and microtasks, the pointer's button states (one button, several buttons, a cancel, a loss of the focus), and how long a deferred draw can be held. The first two hold finding 1.

## Findings

### 1. A second mouse button pressed during the main button's press leaves the hold on after both buttons are up, and the lists stop drawing until the next press of the main button

```seal
severity: should
location: `apps/desktop/src/renderer/press.ts:60-75`, `apps/desktop/test/press.test.ts:15-30`, `apps/desktop/test/press.test.ts:108-140`, `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/design.md:41`, `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/design.md:68`
evidence: executed `Electron test_tmp_chord/main.js` (Electron 45.3.3, CDP `Input.dispatchMouseEvent`: left pressed, right pressed, left released, right released); executed `git grep -n -e 'pointerup' -e 'release of another button' -e 'button === 0' 5f11cee4 -- seal/threads/1795610688-242-sidebar-click-survives-a-redraw apps/desktop/src/renderer/press.ts apps/desktop/test/press.test.ts`; read `apps/desktop/src/renderer/press.ts:69-71`
```

Why it matters: `holdDraws` ends the hold only at a `pointerup` whose `button` is 0 (`press.ts:69-71`). Chromium sends `pointerdown` and `pointerup` only at the change from no button down to some, and back. The release of the main button while another button is still down comes as a `pointermove`. The probe pressed the left button, then the right, released the left, then the right. The window received `pointerdown button=0 buttons=1`, `pointermove button=2 buttons=3`, `contextmenu`, `pointermove button=0 buttons=2`, `click button=0 buttons=2` and `pointerup button=2 buttons=0`. The probe's page ran the wiring of `press.ts` as it stands. After both buttons were up, the draw kept during the press had not run, and a draw asked for later was kept as well. So the sidebar, the screen in front and the dialogs stop drawing the daemon's lists until the person next presses and releases the main button, or the window loses the focus. The design says the hold ends at the release (`frame/design.md:41`), and its acceptance row "A press that ends without a release" assumes no other way for a press to end. Probe 2 of the frame did not try a second button.

The unit case `press.test.ts:127-140` fires a `pointerup` with `button` 2 while the main button is held. Chromium does not send that sequence, so the case pins the defect as behaviour. The mutation table row "a release of any button ends the hold" of `trail/phases/phase-1.md` records a run against that case. It is a record of the phase and is left as it stands.

The `git grep` printed `press.ts` lines 63, 69 and 71, `press.test.ts` lines 111, 122, 127 and 137, and `frame/design.md` lines 41 and 68, as well as lines of the frame and the trail that describe the probes and the alternatives, which state no rule of the hold. The fix below covers each of the first group. The search is a sample: a statement of how the hold ends in other words escapes it.

The fix for `apps/desktop/src/renderer/press.ts`, lines 60 to 75. It assumes the Pointer Events encoding of `buttons`, where bit 1 is the main button. `pointermove` fires often, and `release()` returns at once where no press is held.

```ts
/**
 * A hold wired to the window: a `pointerdown` of the main button begins it,
 * and the main button's release ends it, as do a `pointercancel` and the
 * window's `blur`. Chromium sends that release as the one `pointerup`, once no
 * button is down, which can name another button, or as a `pointermove` whose
 * `buttons` no longer holds the main one, where another button is still down.
 * The pointer's events are read in the capture phase, before any element of
 * the page can stop them.
 */
export function holdDraws(target: Pick<EventTarget, "addEventListener">, schedule: Schedule = (run) => setTimeout(run)): DrawHold {
  const hold = drawHold(schedule);
  target.addEventListener("pointerdown", (event) => (event as PointerEvent).button === 0 && hold.press(), true);
  target.addEventListener("pointerup", () => hold.release(), true);
  target.addEventListener("pointermove", (event) => ((event as PointerEvent).buttons & 1) === 0 && hold.release(), true);
  target.addEventListener("pointercancel", () => hold.release(), true);
  target.addEventListener("blur", () => hold.release());
  return hold;
}
```

The fix for `apps/desktop/test/press.test.ts`. `windowLike` (lines 15 to 30) fires an event with the `buttons` it names too:

```ts
/** A stand-in for the window: an event target that records which types were listened to in the capture phase, and fires an event with the button and the buttons it names. */
function windowLike(): { target: Pick<EventTarget, "addEventListener">; fire: (type: string, button?: number, buttons?: number) => void; captured: Set<string> } {
  const target = new EventTarget();
  const captured = new Set<string>();
  return {
    target: {
      addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
        if (options === true || (typeof options === "object" && options.capture === true)) captured.add(type);
        target.addEventListener(type, listener, options);
      },
    },
    fire: (type, button, buttons) => target.dispatchEvent(Object.assign(new Event(type), button === undefined ? {} : { button }, buttons === undefined ? {} : { buttons })),
    captured,
  };
}
```

At line 111 the captured set becomes `["pointercancel", "pointerdown", "pointermove", "pointerup"]`, and the case's name at line 108 names the move too ("listens for the pointer's press, release, move and cancel in the capture phase, …"). The case at lines 127 to 140 is replaced by these two:

```ts
  it("holds nothing at a press of another button", () => {
    const page = windowLike();
    const later = tasks();
    const hold = holdDraws(page.target, later.schedule);
    const drawn: string[] = [];
    page.fire("pointerdown", 2, 2);
    hold.draw(() => drawn.push("at once"));
    expect(drawn).toEqual(["at once"]);
  });

  it("keeps the hold while a second button goes down and up during the press, and ends it where the main button is released first, which Chromium sends as a pointermove", () => {
    const page = windowLike();
    const later = tasks();
    const hold = holdDraws(page.target, later.schedule);
    const drawn: string[] = [];
    page.fire("pointerdown", 0, 1);
    hold.draw(() => drawn.push("kept"));
    page.fire("pointermove", 2, 3);
    page.fire("pointermove", 2, 1);
    later.run();
    expect(drawn).toEqual([]);
    page.fire("pointermove", 2, 3);
    page.fire("pointermove", 0, 2);
    later.run();
    expect(drawn).toEqual(["kept"]);
    page.fire("pointerup", 2, 0);
    hold.draw(() => drawn.push("at once"));
    expect(drawn).toEqual(["kept", "at once"]);
  });
```

The second case fails against `press.ts` at `5f11cee4` at its `expect(drawn).toEqual(["kept"])`, since nothing listens for `pointermove` there. That is its red.

`frame/design.md` line 41, the sentence "The hold ends at a `pointerup` of the main button, at a `pointercancel` and at the window's `blur`." becomes:

```markdown
The hold ends at the release of the main button, at a `pointercancel` and at the window's `blur`. Chromium sends that release as the one `pointerup` once no button is down, or, where another button is still down, as a `pointermove` whose `buttons` no longer holds the main button.
```

`frame/design.md` line 68, the sentence that begins "The wiring listens on the window in the capture phase" becomes:

```markdown
The wiring listens on the window in the capture phase for a `pointerdown` of the main button (`event.button === 0`), for every `pointerup`, for a `pointermove` whose `buttons` no longer holds the main button (`(event.buttons & 1) === 0`) and for `pointercancel`, and on the window for `blur`.
```

```seal
verdict: fixed 22fe9d08
answer: The paste-ready fix was read against `frame/design.md` *Scope* item 1 and *Data & interfaces* as the fold at `201bba09` left them, which state the same endings, and was applied as written. `press.ts#holdDraws` now begins the hold at a `pointerdown` of the main button and ends it at every `pointerup`, at a `pointermove` whose `buttons` lacks bit 1, at a `pointercancel` and at `blur`. In `press.test.ts`, `windowLike` fires `buttons` too, the capture case expects `pointermove`, and the round's two cases replace the old other-button case. The second case was seen red against `press.ts` as at `062c21d6`, at `press.test.ts:151`, its `expect(drawn).toEqual(["kept"])`; the capture case failed with it at line 111. `seal mutate src/renderer/press.ts` removed the `pointermove` listener, dropped its `buttons` test, dropped the `pointerdown` button test, removed the `pointerup` listener, and took the `pointermove` listener out of the capture phase: all 5 mutants red. The fold at `201bba09` rewrote `frame/design.md` lines 41 and 68 as the finding asks. The evidence's `git grep`, rerun at `22fe9d08`, prints `press.ts` lines 64, 73 and 74 and `press.test.ts` lines 111, 122 and 152, each stating or running the new endings; `frame/design.md` lines 26, 32, 73, 108 and 109, `frame/plan.md` line 25 and `gaps.md` line 8, which state the new endings, a probe, an alternative or what the work removes; and `trail/phases/phase-1.md` line 44, a record of the phase that stands as written. The fix pass's set passed: 5 files and 43 cases.
```

### 2. The rule the settle writes, in both editions, and the changelog say the window waits to draw what an `accounts` or a `machine` message changed, and the Accounts dialog and the Machine dialog are drawn at once

```seal
severity: should
location: `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/design.md:86`, `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/design.md:91`, `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/changelog.md:5`
evidence: executed `git grep -n -e 'what the message changed' -e '메시지가 바꾼 것' -e 'draw what' 5f11cee4 -- seal/threads/1795610688-242-sidebar-click-survives-a-redraw apps/desktop/src`; executed `grep -n -e 'if (accountsDialog.open) showAccounts' -e 'if (MACHINE.dialog.open) showMachine' apps/desktop/src/renderer/renderer.ts`; read `apps/desktop/src/renderer/renderer.ts:1823`, `apps/desktop/src/renderer/renderer.ts:1842`, `apps/desktop/src/renderer/renderer.ts:879-890`
```

Why it matters: the `to` of the first rule change says that the window "waits to draw what the message changed until the button is released", and its bold sentence says that "a click whose press and release fall on the same line or button does what that line or button does". The settle writes that text into `docs/architecture.md` *Screen framework: Electron* as policy, and the Korean `to` says the same (`그 메시지가 바꾼 것을 그리는 일은 버튼을 뗄 때까지 미룹니다`). The code holds back only `drawLists`. At an `accounts` message, `renderer.ts:1823` draws the Accounts dialog at once, and `showAccounts` replaces each row and button of its list (`renderer.ts:881-890`). So a press on a button of that dialog, while another client renames an account, loses its click as a sidebar line did before this work. At a `machine` message, `renderer.ts:1842` draws the Machine dialog at once. The code does what `frame/design.md` *Scope* item 2 says, and `gaps.md` *Not done* gives the draws outside the hold to issues. The defect is the sentence. A later agent reads the policy as saying every draw an `accounts` or `machine` message makes waits, and builds on it. The first bullet of `changelog.md` makes the same claim to the release's readers.

The `git grep` printed `changelog.md` line 5 and `frame/design.md` lines 86 and 91, and nothing in `apps/desktop/src`. The search is a sample: a statement of the claim in other words escapes it. The fix below names what waits as the lists' draws, and says what the two messages draw at once. Putting `showAccounts` and `showMachine` into the hold instead is a change to the code and to *Scope* item 2, which is the framer's call. Where the fix pass takes that path, the sentences change with it.

`frame/design.md` line 86, the `to:` becomes:

```markdown
  to: **A press in the window outlasts the lists the daemon sends: a click whose press and release fall on the same line or button that the lists draw does what that line or button does.** While the person holds the mouse's main button down in the window, the window takes each `inbox`, `accounts` and `machine` message at once and raises its notifications. It waits to draw the lists the message changed, in the sidebar, the screen in front and the dialogs that name what the daemon lists, until the button is released. It then draws them once, after the click has reached the element that was pressed. A draw replaces every line and button it draws, and Chromium sends no click at all for a press whose element left the page before the release. Without the wait, the line of a work item pressed while an agent works would not open. A cancelled press, and a window that loses the focus, end the wait as a release does. A draw the person's own act asks for, such as the view a click opens, is drawn at once. So are the Accounts dialog at an `accounts` message and the Machine dialog at a `machine` message.
```

`frame/design.md` line 91, the `to:` becomes:

```markdown
  to: **창 안에서 누른 것은 데몬이 보내는 목록보다 오래 갑니다. 누른 곳과 뗀 곳이 목록이 그리는 같은 줄이나 같은 버튼이면, 그 줄이나 버튼이 하는 일을 합니다.** 사람이 창 안에서 마우스의 주 버튼을 누르고 있는 동안, 창은 `inbox`, `accounts`, `machine` 메시지를 바로 받아 알림을 띄웁니다. 그 메시지가 바꾼 목록을 사이드바와 앞에 있는 화면과 데몬이 나열하는 것을 보여 주는 대화상자에 그리는 일은 버튼을 뗄 때까지 미룹니다. 버튼을 떼면 클릭이 눌렀던 요소에 간 뒤에 한 번 그립니다. 그리기는 그리는 줄과 버튼을 모두 새것으로 바꾸고, Chromium은 누른 요소가 떼기 전에 화면에서 빠진 클릭을 어디에도 보내지 않습니다. 미루지 않으면 에이전트가 일하는 동안 누른 작업의 줄이 열리지 않습니다. 누름이 취소되거나 창이 포커스를 잃으면 뗀 것과 같이 기다림이 끝납니다. 사람이 직접 한 일이 부르는 그리기, 예를 들어 클릭이 여는 작업 화면은 바로 그립니다. `accounts` 메시지에서 계정 대화상자를, `machine` 메시지에서 머신 대화상자를 그리는 일도 바로 합니다.
```

`changelog.md` line 5 becomes:

```markdown
- **A click on a line or a button that the daemon's lists draw still does what it does when those lists arrive between its press and its release.** While the mouse's main button is held down in the window, the window takes each `inbox`, `accounts` and `machine` message at once and raises its notifications. It waits to draw the lists the message changed until the button is released, and then draws them once, after the click has reached the element that was pressed. A cancelled press, and a window that loses the focus, end the wait as a release does. This covers the sidebar, the inbox and the other list screens, the summary, a work item's view and the dialogs that name what the daemon lists. The Accounts dialog at an `accounts` message and the Machine dialog at a `machine` message are still drawn at once.
```

```seal
verdict: fixed 22fe9d08
location: `apps/desktop/src/renderer/renderer.ts:1559-1568`, `apps/desktop/src/renderer/renderer.ts:1833`, `apps/desktop/src/renderer/renderer.ts:1852`, `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/gaps.md`
answer: The fix pass took the path this finding leaves to the framer, and did not apply its paste-ready text. The fold at `201bba09` decided that the two dialogs join the hold (`frame/design.md` *Scope* item 2, its first two sub-items, and the rejected row of `frame/plan.md` *Alternatives considered*), and rewrote both `to:` lines of `## Rule changes` to name the Accounts dialog and the Machine dialog among what waits. `22fe9d08` builds that design: `case "accounts"` hands `drawAccountsDialog` to the hold in place of `if (accountsDialog.open) showAccounts();`, and `case "machine"` hands `drawMachineDialog` in place of `if (MACHINE.dialog.open) showMachine();`. Each is one module-level function, so the hold keeps it once per press. `showAccountsEntry`, `showMachineEntry` and `showSignIn` stay at once, and so do `takeAccountsAnswer`'s `showAccounts` and `heavyRuns`'s `showMachine`, as the fold says. The same commit rewrites `changelog.md` line 5 to say the two dialogs wait, and not the pasted sentence that says they are drawn at once, which the fold reversed. `gaps.md` *Not done* takes the two dialogs out of the list of draws outside the hold, and its *Not verified* names the two draws as run by no case. The fold's acceptance row for the dialogs is read, so no case was written new and no mutant was run for them. The evidence's `git grep`, rerun at `22fe9d08`, prints `changelog.md` line 5 and `frame/design.md` line 96 (the Korean `to:`). Each now says the two dialogs wait, as the code does. The `grep` prints `renderer.ts` lines 1562 and 1567, inside the two functions, and lines 848 (`takeAccountsAnswer`) and 1846 (`heavyRuns`), which the fold keeps at once.
```

### 3. Two coordinates of the frame, outside the sections dated to `80917d43`, name lines of files the build moved

```seal
severity: should
location: `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/design.md:69`, `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/questions.md:13`
evidence: executed `sed -n 345,348p apps/desktop/src/renderer/renderer.ts`; executed `grep -n 'daemon.json' apps/desktop/test/seal-back-view.test.ts`; executed `grep -n -o -E '(lines? [0-9]+( to [0-9]+)?|:[0-9]+`)' seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/design.md`
```

Why it matters: the frame names the commit it read at the head of `frame/design.md` *Grounding* and `frame/plan.md` *Technical context* only, so a coordinate elsewhere in the frame is read against the target. `frame/design.md` *Data & interfaces* (line 69) says "`showNarrowed` (lines 340 to 343) stays as it is". At `5f11cee4`, `renderer.ts` lines 340 to 343 are the end of `openScreen`, and `showNarrowed` stands at lines 345 to 348. `frame/questions.md` Q2 (line 13) says the file "already reads" `run/daemon.json` at "`apps/desktop/test/seal-back-view.test.ts` line 98". At `5f11cee4` that read stands at line 93, and the new case reads the file again at line 203. The `grep -o` over `frame/design.md` printed every line coordinate of the file. Each one outside *Grounding*, and outside a sentence dated to `80917d43` (lines 64 and 100), names `work-item-view.ts` line 113, which the diff does not change, apart from line 69. `frame/plan.md` and `frame/questions.md` were read whole for the same: `plan.md` line 26 (`sidebar.ts` lines 165 to 169) and line 27 (`protocol.ts` line 901) name files the diff does not change. The fix names the function in place of the lines, so no later move makes it false.

`frame/design.md` line 69, "`showNarrowed` (lines 340 to 343) stays as it is" becomes:

```markdown
`renderer.ts#showNarrowed` stays as it is
```

`frame/questions.md` line 13, "which the file already reads (`apps/desktop/test/seal-back-view.test.ts` line 98)" becomes:

```markdown
which the file already reads (`apps/desktop/test/seal-back-view.test.ts`, its `beforeAll`)
```

```seal
verdict: fixed 201bba09
answer: The fold at `201bba09` rewrote both coordinates as the finding asks. `frame/design.md` *Data & interfaces* now names `renderer.ts#showNarrowed` without lines, and `frame/questions.md` Q2 names `seal-back-view.test.ts`, its `beforeAll`. The fix pass changed no code for this finding. The evidence's `grep -o`, rerun at `22fe9d08`, prints line coordinates of `frame/design.md` only on lines 10 to 26, which are *Grounding*, and on lines 69 and 105, which state the tree at `80917d43` in their own words. `frame/plan.md` holds line coordinates only on lines 7 and 13, in *Technical context*, which is dated to `80917d43`.
```

## Confirmations

What matched: the hold of *Scope* item 1 is `press.ts#drawHold`, which touches no page when imported and takes its scheduler as an argument, and `press.ts#holdDraws`, which schedules with `setTimeout` (`press.ts:67`), as probe 2 requires. A draw asked for during a press is kept once per function and runs in a later task. A press begun before that task runs keeps it waiting (`press.ts:33`). A draw made at once removes its kept copy (`press.ts:55`). Executed: `node scripts/test-in-electron.mjs test/press.test.ts` in the clone passed 10 cases of 1 file.

What matched: *Scope* item 2 holds. `renderer.ts#drawLists` (lines 1543 to 1558) holds the sidebar, the archived screen's fallback, the list in front, the view, the summary and the six dialogs. `takeLists` (line 1585) and the `accounts` case (line 1825) and the `machine` case (line 1844) call it as `draws.draw(drawLists)`. The notifications, `dropClosed` and the registration's `openRecords` run at once, before or after it. Executed: `git grep -n 'listInFront()?.show()' -- apps/desktop/src` printed lines 347 (`showNarrowed`) and 1547 (`drawLists`), as the plan's *Verified by* cell asks.

What matched: the issue's "whatever draws the sidebar in between" holds for the daemon's lists. Executed: `git grep -n 'showSidebar(' -- apps/desktop/src` printed `renderer.ts` lines 301 (`bringToFront`), 346 (`showNarrowed`) and 1544 (`drawLists`), and `sidebar.ts` line 167 (the fold head's click). That list is whole, since it lists every caller of the one function that replaces the sidebar's lines. `bringToFront` runs at the person's acts, at `ready`, which *Out of scope* holds out with its reason, and at `workItemCreated`, which the daemon sends to the asking socket alone (`daemon.ts:937`). `showNarrowed` runs as the person types.

What matched: *Scope* item 3 holds. Executed in the clone: `git grep -n -A1 'for (const deadline' -- apps/desktop/test | grep 'app.click('` and `git grep -n -e 'replaces its buttons' -e 'made again until the view shows' -- apps/desktop` each printed nothing. Read: the other deadline loops of the built-app files (`chain-choice.test.ts:43`, `chain-choice.test.ts:196`, `ask-section.test.ts:96`, `ask-section.test.ts:136`, `korean-pane.ts:191`, `screenshots.test.ts:365`) click no sidebar line.

What matched: the case of *Scope* item 4 (`seal-back-view.test.ts:201-234`) presses with `Input.dispatchMouseEvent`, pins the broken work item by `setWorkItem` on the second client's socket (`protocol.ts:900` holds that message), waits on a listener added to the window's own socket through `Runtime.queryObjects`, and releases at the same point. It expects the pressed work item's view, the pin not drawn while the button was down, and the pin drawn after. The socket is filtered by its exact `url`, open state and port, and the case asserts one passes. Request id 5 is used by no other message of the file. The phase's claim that the case was red with an at-once hold is read: `phase-1/mutate-renderer.txt` under the crafter's scratch directory holds `the window never showed the view of the work item whose line was pressed` at `test/seal-back-view.test.ts:230:5`, the line the claim names.

What matched: the phase's unit red. Claimed: a stub that draws at once failed 6 of the 10 cases, and the 4 that passed are the at-once case, the capture case and the two `it.each` cases. Read against `press.test.ts`: with an at-once `draw`, those four cases pass and the other six fail at their first `expect` after a draw during a press. The claim that the mutant without `if (!pressed) return;` in `release` is equivalent holds by reading `press.ts:41-48`: with no press held, a kept draw implies a scheduled task, so the next guard returns.

What matched: the rule changes name sections that stand, `docs/architecture.md` line 478 *Screen framework: Electron* and `docs/architecture.ko.md` line 478 *화면 프레임워크: Electron*, and the phase edits neither, as `trail/phases/phase-1.md` line 9 says. The `## Removes` rows each hold at the target. No file of `apps/desktop/src/shared/` or `apps/desktop/src/daemon/` is in the diff, as *Data & interfaces* says.

What matched: the `pressed` ground of `docs/design.md` *Principles* rule 9 lasts as long as the press, since the pressed element now stays in the page until the release.

What matched: the records against the code. `trail/phases/phase-1.md` lines 7, 19 and 38 name `renderer.ts` lines 347 and 1547, `press.test.ts:59` and `seal-back-view.test.ts` line 230, and each stands at the target as the sentence says. `gaps.md`, `changelog.md`, `pr.md`, `routing.md` and `frame/plan.md` were read whole. Each quote of `pr.md` stands word for word at the coordinate it names. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed.

The unit case `press.test.ts:62-75` pins the order in which two different draws run, and the frame states no such order, since only `drawLists` goes through the hold. It stands as a gap that opens no finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a release that a system popup takes on real hardware still reaches the window as a `pointerup` | `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/gaps.md:8` | the owner, in a walk of the built app |
| Whether the lists may wait to be drawn for as long as a press lasts anywhere in the window, `frame/questions.md` Q1, on which the build stands at default A | `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/questions.md:12` | the owner |
| The built-app files, which this round did not run: the three of the phase's batch, which the crafter ran at `6a423a33`, and every other file that loads the window's bundle; and the full suite | `apps/desktop/test/` | the orchestrator's broad gate |
| Whether the draws other daemon messages make at once, which `gaps.md` *Not done* lists, replace an element a person presses. This round read the Accounts dialog's list (finding 2) and no other | `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/gaps.md:13` | the issues the orchestrator files |

## Probes

| Command | Result |
|---|---|
| `Electron test_tmp_chord/main.js`, run from the round's scratch directory with the main checkout's Electron 45.3.3 binary | ran: the window received `pointerdown button=0 buttons=1`, `pointermove button=2 buttons=3`, `contextmenu`, `pointermove button=0 buttons=2`, `click button=0 buttons=2`, `pointerup button=2 buttons=0`; the copied wiring of `press.ts` had drawn nothing after both buttons were up, and a later draw was kept too |
| `node scripts/test-in-electron.mjs test/press.test.ts`, from `apps/desktop` of the clone | ran: 1 file, 10 cases passed |
| `npx tsc --noEmit`, from `apps/desktop` of the clone | ran: exit 0. Contract rule 2 gives the typecheck to the orchestrator's broad gate, so this run is no seal of it |
