# Review round 2: 1795610688-242-sidebar-click-survives-a-redraw

```seal
target: 00e3f6d2, fixes 062c21d6..00e3f6d2
```

This verifying round reviewed the fix diff `062c21d6..00e3f6d2`: the frame fold `201bba09`, the fix `22fe9d08` and the close blocks of round 1 at `00e3f6d2`. It worked in the round 1 clone, fetched and checked out at `00e3f6d2`. Round 1 provided coordinates only. These were carried and not searched again, since the fix diff does not touch them: the callers of `sidebar.ts#showSidebar`, the sections `docs/architecture.md` *Screen framework: Electron* and `docs/architecture.ko.md` *화면 프레임워크: Electron*, and the new case of `seal-back-view.test.ts`. Every verdict below was reached on the code at the target. Its records were read whole at `00e3f6d2`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` and `trail/rounds/round-1.md`.

## Findings

### 1. No case holds the Accounts dialog's draw behind a press, so moving `case "accounts"` back to an at-once draw passes every case

```seal
severity: should
location: `apps/desktop/src/renderer/renderer.ts:1833`, `apps/desktop/test/theme-controls.test.ts:310-323`, `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/design.md:67`, `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/gaps.md:9`
evidence: executed `git grep -n -e 'drawAccountsDialog' -e 'drawMachineDialog' -e 'mousePressed' -- test src` (in `apps/desktop`); executed `git grep -l -e 'accounts-list' -e 'accounts-dialog' -- test`; read `apps/desktop/src/renderer/renderer.ts:879-1000`, `apps/desktop/src/renderer/machine.ts:89-157`
regression: round-1#2
```

Why it matters: the unit is `renderer.ts#onMessage` at `case "accounts"`, where `22fe9d08` replaced `if (accountsDialog.open) showAccounts();` with `draws.draw(drawAccountsDialog)` (line 1833). The fold's `frame/design.md` *Scope* item 2 asks for the Accounts dialog to go through the hold, and its acceptance row (line 67) has it verified by reading, with no case. The fix did what the row asks. The defect comes from that row: the fold chose reading where the release ships a behaviour that a revert of line 1833 would take back silently. `showAccounts` replaces each account's row, with its "Rename", "Make the default" and "Remove…" buttons (`renderer.ts:881-1000`). So the revert brings back the lost click on those buttons, and the suite stays green. The search shows why: `drawAccountsDialog` is named by no file under `test/`. The only case that holds a press across a daemon message is `seal-back-view.test.ts:223`, and it sends an `inbox`. The two `check:` lines of the rule (design lines 92 and 97) name `press.test.ts` and `seal-back-view.test.ts`, and neither runs `case "accounts"`. The rule's sentence that names the Accounts dialog therefore has no test that pins it. `gaps.md` line 9 hands the question to this round, and this round's answer is that the close of round 1's finding 2 holds by reading (see *Confirmations*). The behaviour it ships still has no case. The `mousePressed` search lists every CDP press in the suite, so it is whole for presses sent that way.

The Machine dialog's draw needs no such case. `machine.ts#showMachine` updates each cap's label, field and button in place (lines 97 to 106). It replaces only the `li` entries of the queue and the heavy-command lists (lines 115 to 127 and 146 to 158), which hold two `span`s and no control. So holding that draw back moves no click, and a case would pin timing only.

A built-app case in `apps/desktop/test/theme-controls.test.ts`, after the case at lines 310 to 323, which leaves the account "Work" with id 1 and closes the dialog. It uses the CDP calls of `seal-back-view.test.ts:201-234`. The file already imports `readFileSync` and `join`. The `addAccount` message with no `folder` is `protocol.ts:876`, and `accounts` lists `accounts: Account[]` (`protocol.ts:985`). Its red: line 1833 put back to `if (accountsDialog.open) showAccounts();`, under which the press's button is replaced and the rename field never shows.

```ts
  it("opens the rename field of an account whose Rename button is pressed while another client adds an account, and draws the added account after the release", async () => {
    await app.click("#accounts-button");
    await app.until(`document.getElementById("accounts-dialog").open && document.querySelector('#accounts-list li[data-account="1"]') !== null`, "the Accounts dialog with the account Work");
    // The window's own socket is found from outside, as in seal-back-view.test.ts, and notes the `accounts` message that lists the account Home.
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const prototype = await app.cdp<{ result: { objectId: string } }>("Runtime.evaluate", { expression: "WebSocket.prototype" });
    const found = await app.cdp<{ objects: { objectId: string } }>("Runtime.queryObjects", { prototypeObjectId: prototype.result.objectId });
    const listened = await app.cdp<{ result: { value: number } }>("Runtime.callFunctionOn", {
      objectId: found.objects.objectId,
      functionDeclaration: `function () {
        const daemon = this.filter((socket) => socket.readyState === WebSocket.OPEN && socket.url === ${JSON.stringify(`ws://127.0.0.1:${String(port)}/`)});
        window.tookHome = false;
        for (const socket of daemon) socket.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (message.type === "accounts" && message.accounts.some((account) => account.name === "Home")) window.tookHome = true; });
        return daemon.length;
      }`,
      returnByValue: true,
    });
    expect(listened.result.value).toBe(1);
    const homeDrawn = `[...document.querySelectorAll("#accounts-list li")].some((row) => row.textContent.includes("Home"))`;
    await app.evaluate(`(() => { for (const button of document.querySelectorAll('#accounts-list li[data-account="1"] button')) button.toggleAttribute("data-pressed-here", button.textContent === "Rename"); })()`);
    const at = await app.evaluate<{ x: number; y: number }>(`(() => { const box = document.querySelector("#accounts-list button[data-pressed-here]").getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
    const other = new WebSocket(`ws://127.0.0.1:${String(port)}`);
    await new Promise<void>((resolve) => {
      other.addEventListener("open", () => other.send(JSON.stringify({ type: "hello", token })));
      other.addEventListener("message", (event) => {
        if ((JSON.parse(String(event.data)) as { type: string }).type === "ready") resolve();
      });
    });
    try {
      await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", buttons: 1, clickCount: 1 });
      other.send(JSON.stringify({ type: "addAccount", requestId: 1, name: "Home" }));
      await app.until("window.tookHome", "the window's socket taking the accounts message that lists Home");
      // The window took the accounts, and holds the dialog's drawing while the button is down.
      const drawnWhilePressed = await app.evaluate<boolean>(homeDrawn);
      await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", buttons: 0, clickCount: 1 });
      await app.until(`document.querySelector('#accounts-list li[data-account="1"] input') !== null`, "the rename field of the account Work");
      expect(drawnWhilePressed).toBe(false);
      await app.until(homeDrawn, "the account Home in the dialog after the release");
    } finally {
      other.close();
    }
    await app.click("#accounts-close");
    await app.until(`!document.getElementById("accounts-dialog").open`, "the Accounts dialog closed");
  });
```

`frame/design.md` line 67, the cell *Verifiable how* of the row "A press on a button of the Accounts dialog or the Machine dialog" becomes:

```markdown
| A press on a button of the Accounts dialog or the Machine dialog | Given the dialog open and the main button held, when an `accounts` or a `machine` message arrives, then the dialog is drawn after the release. | `theme-controls.test.ts`: a case presses the Rename button of an account, has a second client add an account, waits until the window's socket has taken the `accounts` message, releases on the same point, and expects the rename field, and then the added account. It fails with `case "accounts"` drawing the dialog at once. The Machine dialog's draw replaces only the entries of its lists, which hold no control (`machine.ts#showMachine`), so no case is owed for it. |
```

The *Not verified* row of `gaps.md` line 9 is closed by that case. Where the orchestrator judges a built-app case not worth its cost, the fix pass closes this finding `deferred <home>` instead, and line 9 stays open with that home named.

## Confirmations

```seal
confirms: round-1#1
```
What holds: `press.ts#holdDraws` (lines 71 to 79) begins the hold at a `pointerdown` whose `button` is 0. It ends the hold at every `pointerup`, at a `pointermove` whose `buttons` lacks bit 1, at `pointercancel` and at `blur`. Executed: round 1's `evidence: executed` line was run again as `Electron test_tmp_moves/main.js`, with the wiring copied as it stands at `00e3f6d2`. A second button pressed and released while the main one stayed down kept the hold. The main button released first, received as `pointermove button=0 buttons=2`, ran the kept draw. A draw asked for after both buttons were up ran at once. The same probe sent a press as `BuiltApp.click` sends it, with no `buttons`, and then changed the layout under the pointer for 300 ms. The press arrived as `pointerdown button=0 buttons=1`, no `pointermove` came before the release, and the draw ran after the release. So the new `pointermove` listener does not end a press that a case sends without `buttons`. Executed in the clone: `node scripts/test-in-electron.mjs test/press.test.ts` passed 11 cases. With the `pointerup` test put back to `button === 0` and the `pointermove` listener removed, 2 cases failed at `press.test.ts:111` and `press.test.ts:151`, the lines the close names, and the file was restored from HEAD. The close's `git grep` was rerun at `00e3f6d2`. It prints the lines the close lists and `frame/design.md` line 41 as well, which the close leaves out. That line is *Scope* item 1, and it states the new endings. `frame/design.md` lines 41 and 73 state the endings the code has.

```seal
confirms: round-1#2
```
What holds: the rule's `to` lines (design lines 91 and 96) and `changelog.md` line 5 now say that the Accounts dialog and the Machine dialog wait, and the code holds both. `renderer.ts#drawAccountsDialog` (lines 1561 to 1563) and `renderer.ts#drawMachineDialog` (lines 1566 to 1568) are module-level functions, so the hold keeps each one once per press. `case "accounts"` (line 1833) and `case "machine"` (line 1852) hand them to the hold before `drawLists`, so the kept draws run in the order the at-once draws ran before. Each checks that its dialog is still open when it runs, so a dialog closed during the press draws nothing. `showAccountsEntry` and `showMachineEntry` set `hidden` alone (`renderer.ts:853-855`, `machine.ts:28-30`). `showSignIn` hides a section and sets one heading's text (`sign-in-pane.ts:58-65`). So each of the three replaces no element and stays at once, as design line 44 says. The at-once draws the fold keeps are `takeAccountsAnswer`'s `showAccounts` (line 848) and `heavyRuns`'s `showMachine` (line 1846). Each answers the person's own act, as design line 45 says. Executed: the close's two searches were rerun at `00e3f6d2` and printed what the close says. Read.

```seal
confirms: round-1#3
```
What holds: `frame/design.md` line 74 names `renderer.ts#showNarrowed`, and `frame/questions.md` Q2 (line 13) names the `beforeAll` of `seal-back-view.test.ts`. Executed: the `grep -o` of round 1 was rerun over `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md` and `changelog.md` at `00e3f6d2`. Outside *Grounding* and *Technical context*, it prints `frame/design.md` lines 69 and 105, and `frame/plan.md` lines 35 and 43. Each of those dates its lines in its own words: to `80917d43` (design 69 and 105, plan 35) or to `e15b705b` (plan 43). The close says `frame/plan.md` holds line coordinates only on lines 7 and 13, and it misses lines 35 and 43. Each of those is dated, so the close holds.

What matched: the fold's new sentences, read against the code at `00e3f6d2`. *Scope* item 2's sub-items (design lines 43 to 45) say what `renderer.ts` and `machine.ts` do. The rejected row of `frame/plan.md` *Alternatives considered* names the buttons "Rename", "Remove…" and "Make the default", and each stands in `showAccounts` (`renderer.ts:987`, `renderer.ts:992`, `renderer.ts:972`). The new wording of `gaps.md` line 8 holds: the pointer's next move over the window ends a press whose release was lost, since `buttons` then lacks the main button. The new `## Removes` rows (design lines 107 to 109) each name what `22fe9d08` took out. The new acceptance row "A second button during the press" (line 66) holds, and its red was run above. The English and Korean `to` lines state the same rule.

What matched: the new unit cases. "Holds nothing at a press of another button" pins the `pointerdown` test of `button`, which the old case pinned with a sequence Chromium does not send. The chord case covers the `pointermove` ending that no earlier case covered. The capture case expects `pointermove` among the captured types.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a release that a system popup takes on real hardware reaches the window | `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/gaps.md:8` | the owner, in a walk of the built app |
| `frame/questions.md` Q1, on which the build stands at default A | `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/questions.md:12` | the owner |
| The built-app files and the full suite at `00e3f6d2`. This round ran no built-app file, since every close above was verified by the unit file, a probe or reading. The fix pass's account of 5 files and 43 cases is read, not run | `apps/desktop/test/` | the orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `Electron test_tmp_moves/main.js`, run from the round 2 scratch directory with the main checkout's Electron 45.3.3 binary | ran: chord with the second button pressed and released, hold kept; main button released first (`pointermove button=0 buttons=2`), kept draw ran; later draw ran at once; a press with no `buttons` arrived as `buttons=1`, and no `pointermove` came during a 300 ms layout change before the release |
| `node scripts/test-in-electron.mjs test/press.test.ts`, from `apps/desktop` of the clone at `00e3f6d2` | ran: 1 file, 11 cases passed |
| The same command with `press.ts` lines 74 and 75 put back to the round 1 wiring by an edit in the clone, then restored with `git checkout` | ran: 2 failed, at `press.test.ts:111` and `press.test.ts:151`, 9 passed |
