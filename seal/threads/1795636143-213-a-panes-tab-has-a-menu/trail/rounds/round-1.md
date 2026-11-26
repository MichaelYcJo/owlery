# Review round 1: 1795636143-213-a-panes-tab-has-a-menu

```seal
target: faee6ea4 against origin/release/v0.0.5
```

The base is `origin/release/v0.0.5` at `f683c693`, which the branch merged at `14c2117e`. This round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and both phase records whole at `faee6ea4`, and the diff `f683c693..faee6ea4`. No `pr.md` and no `pr.<lang>.md` stand. No earlier round stands, so no coordinate was carried; every fact below was established this round. `seal/parity.json` is not declared.

Stage 1 walked each *Scope* item and each acceptance row against the tree. The code holds every *Scope* item: the menu and its order (`view.ts#tabMenu`), the one close (`work-item-view.ts#closePanes`, `view.ts#closeSays`), `setPane` and the two fields (`daemon.ts:1591`, `protocol.ts:568`), the given name first in `tabLabel` (`view.ts:22`), the rename dialog (`index.html:1171`, `work-item-view.ts:1314`), the row and the bar (`menu.ts#rowElement`, `index.html:407-412`, `index.html:603-609`), the tokens in the six blocks (`themes.css`), both editions of `docs/design.md`, the cases, and the two screenshot views. The findings below are four record defects and one defect of the rename dialog that the frame's own wording builds in.

## Findings

### 1. "Save" on the untouched rename field freezes the kind's label as a given name, and two tabs can then read "Shell 2"

```seal
severity: should
location: `apps/desktop/src/renderer/work-item-view.ts:1328`, `apps/desktop/src/renderer/view.ts:22`, `seal/threads/1795636143-213-a-panes-tab-has-a-menu/frame/design.md:43`, `docs/design.md:473`, `docs/design.ko.md:473`, `seal/threads/1795636143-213-a-panes-tab-has-a-menu/changelog.md:7`, `apps/desktop/test/view.test.ts`
evidence: read `apps/desktop/src/renderer/work-item-view.ts:1314-1336`, `apps/desktop/src/renderer/view.ts:22-28`, `apps/desktop/src/daemon/daemon.ts:1591-1612`
```

Why it matters: the dialog opens with the tab's label in its field, selected (`work-item-view.ts:1314`, `openPaneName`). `sendPaneName` (`work-item-view.ts:1328`) sends the field's text as it stands. So a person who opens "Rename…" on "Shell 2" and presses Enter or "Save" without typing gives the pane the name "Shell 2". The daemon keeps it, since it is neither empty nor past 60 characters (`daemon.ts:1597-1601`). From then on `tabLabel` returns that name before it counts the kind (`view.ts:22`). The other Shell panes still count this one among their kind (`view.ts:26`). Close "Shell 1" and the tabs read "Shell 2" and "Shell 2": the named pane keeps the frozen text, and the third pane becomes the second of its kind. The close dialog and the delete dialog then name two panes the same way. The frame asks for the label in the field (*Scope* item 5) and for the numbering to hold (*Scope* item 4, "renaming 'Shell 1' leaves 'Shell 2' as it is"), and states nothing of an untouched Save. The build follows the letter of item 5 and loses what item 4 is for. Nothing in the window shows that the pane now carries a name.

The fix sends `null` where the trimmed text is the label the pane's kind gives it, the same as an empty name. The function is pure so that a unit case holds it. Every statement of what "Save" sends needs the same sentence: the frame's *Scope* item 5, the row "The rename dialog of a pane" of both editions, and the changelog's bullet on "Rename…".

```ts
// apps/desktop/src/renderer/view.ts, after tabLabel
/** The name the rename dialog of a pane sends for the text its field holds, `byKind` being the label the pane's kind gives it among its tabs (`tabLabel` of the pane with no name): null, which takes the name off, where the text is empty or white space alone, or is that label once its ends are trimmed, so a Save of the untouched field freezes no number; and otherwise the text, which the daemon trims. */
export function paneNameSent(text: string, byKind: string): string | null {
  const trimmed = text.trim();
  return trimmed === "" || trimmed === byKind ? null : text;
}

// apps/desktop/src/renderer/work-item-view.ts, in place of sendPaneName (paneNameSent imported from ./view)
/** Sends the name the dialog holds, which the daemon trims. An empty name, or the label the pane's kind gives it, takes the pane's name off (./view, `paneNameSent`). One request per answer: "Save" stays off until the daemon answers. */
function sendPaneName(): void {
  if (!paneNaming || paneNaming.requestId !== undefined) return;
  const pane = paneNaming.pane;
  const session = held.sessions.find((listed) => listed.id === pane);
  const workItem = held.workItems.find((item) => item.id === session?.workItemId);
  const byKind = session && workItem ? tabLabel({ ...session, name: null }, paneTabs(workItem, held.sessions), held.paneKinds, workItem.setup?.paneId ?? null) : "";
  const requestId = request();
  paneNaming.requestId = requestId;
  paneNameError.textContent = "";
  paneNameSubmit.disabled = true;
  send({ type: "setPane", requestId, id: pane, name: paneNameSent(paneNameField.value, byKind) });
}

// apps/desktop/test/view.test.ts, beside the tabLabel cases
describe("paneNameSent", () => {
  it("takes the name off for an empty text and for the label the pane's kind gives it, so a Save of the untouched field leaves the pane numbered among its kind, and sends any other text", () => {
    expect(paneNameSent("Shell 2", "Shell 2")).toBeNull();
    expect(paneNameSent("  Shell 2 ", "Shell 2")).toBeNull();
    expect(paneNameSent(" \t ", "Shell 2")).toBeNull();
    expect(paneNameSent("Setup", "Setup")).toBeNull();
    expect(paneNameSent(" build ", "Shell 2")).toBe(" build ");
  });
});
```

The sentences, each in place of the one it names:

- `docs/design.md`, row "The rename dialog of a pane": "An empty name takes the name off." becomes "An empty name takes the name off, and so does the label the pane's kind gives it, which the field holds at the opening for a pane with no name, so a Save of the untouched field changes no tab's number."
- `docs/design.ko.md`, row "터미널 칸의 이름을 바꾸는 대화 상자": "빈 이름은 이름을 뗍니다." becomes "빈 이름은 이름을 뗍니다. 칸의 종류가 주는 이름표도 이름을 떼므로, 이름이 없는 칸에서 입력란을 그대로 두고 "Save"를 눌러도 어느 탭의 번호도 바뀌지 않습니다."
- `frame/design.md` *Scope* item 5: after ""Save" is the main button and sends `setPane` with the field's text." add "Where the trimmed text is the label the pane's kind gives it, which is what the field holds at the opening of a pane with no name, it sends `name: null`, as for an empty name, so a Save of the untouched field freezes no number."
- `changelog.md` line 7: "An empty name gives the pane its kind's label back." becomes "An empty name, or the label its kind gives it, gives the pane its kind's label back, so a Save that changes nothing names nothing."

The case belongs in `view.test.ts`. Its red is owed with only the `trimmed === byKind` test removed from `paneNameSent`, where its first, second and fourth lines fail. A built-app step in `terminal-basics.test.ts` *renames a pane at "Rename…"* (Save on the untouched field, then the tabs read as before) would hold the wiring and is the fix pass's to weigh.

```seal
verdict: fixed af5227e7
location: `apps/desktop/src/renderer/work-item-view.ts`, `apps/desktop/test/terminal-basics.test.ts`, `docs/design.md`, `docs/design.ko.md`, `seal/threads/1795636143-213-a-panes-tab-has-a-menu/changelog.md`
answer: `sendPaneName` now sends `name: null` where the trimmed text is empty or is `tabLabel` of the pane with no name, written into its body and not as the paste-ready `paneNameSent`: that function is a unit the frame held nowhere at `faee6ea4`, and `skills/implement/fix-pass.md` *A fix that needs a unit the frame does not name waits for the fold* stops a fix pass from building one, while code written into an existing body is outside that stop. So the case is the built-app step the finding offered, not a `view.test.ts` case: in `terminal-basics.test.ts` *renames a pane at "Rename…"* a Save of the untouched "Shell 3" field, then the close of "Shell 2", must leave the third tab reading "Shell 2"; `seal mutate` with the `trimmed === byKind` test removed was red there at "the third pane numbered as the second of its kind", baseline green (executed). The row of both editions of `docs/design.md` and the changelog's line 7 take the finding's sentences; `frame/design.md` *Scope* item 5 is the framer's fold.
```

### 2. The changelog says a given name reaches a notification's title, and no notification of a named pane carries it

```seal
severity: should
location: `seal/threads/1795636143-213-a-panes-tab-has-a-menu/changelog.md:7`, `seal/threads/1795636143-213-a-panes-tab-has-a-menu/frame/plan.md:34`
evidence: read `apps/desktop/src/renderer/view.ts:3054-3071`, `apps/desktop/src/daemon/daemon.ts:1596`; executed `git grep -n -i -e notification -- seal/threads/1795636143-213-a-panes-tab-has-a-menu`
```

Why it matters: the changelog becomes the release notes, which a person reads. Line 7 says that the name "names the pane wherever the window names it by its tab's label: on its tab, in the close dialog, in the delete dialog and in a notification's title". `notificationFor` titles a notification with the work item's title wherever the pane's work item is listed, and calls `tabLabel` only for a pane of no listed work item (`view.ts:3068`). `setPane` refuses a pane with no work item (`daemon.ts:1596`), so a named pane's notification is titled by its work item, never by the name. The search printed three statements. `changelog.md:7` and `frame/plan.md:34` (*Alternatives considered* row 8, "the notification's title naming a renamed pane by its kind") are wrong at the target. `frame/design.md:29` is a fact of the tree dated to `5b20b1c6` and only says that the notification calls `tabLabel`, which it does; it stays. A search on one word is a sample: a statement in other words escapes it.

The account change dialog (`work-item-view.ts:1273`, `accountOffer`) and the Restart Daemon dialog's list (`view.ts:1085`, `runningIn`) do name a pane by `tabLabel`, so they take the notification's place:

```md
changelog.md line 7: "The name then names the pane wherever the window names it by its tab's label: on its tab, in the close dialog, in the account change dialog, in the delete dialog and in the list of the Restart Daemon dialog."
frame/plan.md line 34, the Verdict cell: "A second function would leave the delete dialog, the Restart Daemon dialog and the account change dialog naming a renamed pane by its kind."
```

```seal
verdict: fixed af5227e7
answer: `changelog.md` line 7 now names the close dialog, the account change dialog, the delete dialog and the list of the Restart Daemon dialog, and no notification. `frame/plan.md` line 34 is the framer's fold. Rerun of the finding's search, `git grep -n -i -e notification -- seal/threads/1795636143-213-a-panes-tab-has-a-menu`, after af5227e7 prints `frame/design.md:29`, which the finding keeps as a fact dated to `5b20b1c6`, `frame/plan.md:34`, the framer's, and this round record's own lines.
```

### 3. The frame's absence search reads `\|` as alternation when an agent types it from the raw text

```seal
severity: should
location: `seal/threads/1795636143-213-a-panes-tab-has-a-menu/frame/design.md:74`, `seal/threads/1795636143-213-a-panes-tab-has-a-menu/frame/plan.md:51`, `seal/threads/1795636143-213-a-panes-tab-has-a-menu/frame/design.md:120`
evidence: executed `git grep -n -e 'function closePane(' -e 'let asking: number \| undefined' -- . ':!seal' | wc -l` (1462 at `faee6ea4`); `git grep -n -e 'function closePane(' -e 'let asking: number . undefined' -- . ':!seal'` (exit 1 at `faee6ea4`); `git grep -n -e 'function closePane(' -e 'let asking: number . undefined' 5b20b1c6 -- . ':!seal'` (the two lines at `work-item-view.ts:137` and `:1236`)
```

Why it matters: the acceptance row "The one-pane path is gone" and phase 1's *Verified by* cell hold the command inside a table cell, where a bare `|` would end the cell, so the raw text spells it `\|`. An agent reads the raw text, not the rendered page. Typed as written, `git grep` reads `\|` as alternation and prints every line of the tree that holds ` undefined`, 1462 lines at `faee6ea4`. The next reader of the row, the sealer or the settle, then sees the acceptance fail on a tree where it holds. The row's own "executed at `5b20b1c6`: the command printed those two lines and no other" is true only of the command with a plain `|`. Phase 1 recorded the trap (`trail/phases/phase-1.md:7`) but the fold at `faee6ea4` left both cells as they were.

A `.` in place of the bar matches the one character between the words and holds no bar, so the cell reads one way raw and rendered. It printed the two lines at `5b20b1c6` and nothing at `faee6ea4`. The `## Removes` row quotes the same line as a coordinate, and a reader who searches for that quote with `-F` finds nothing at the base either:

```md
frame/design.md line 74 and frame/plan.md line 51: `git grep -n -e 'function closePane(' -e 'let asking: number . undefined' -- . ':!seal'`
frame/design.md line 74, after the command: "The `.` stands for the `|` of the code, which a table cell cannot hold unescaped."
frame/design.md line 120, the Coordinate cell: `apps/desktop/src/renderer/work-item-view.ts`, `let asking`, which held one pane's id or `undefined`
```

```seal
verdict: fixed 23e4790a
answer: The framer rewrote the absence search to `'let asking: number . undefined'` at the acceptance row and the phase 1 *Verified by* cell, and the *Removes* row's coordinate (`23e4790a`). At `5b20b1c6` it prints `work-item-view.ts:137` and `:1236`; at HEAD it prints nothing. Records alone.
```

### 4. `## Rule changes` writes the pane record's sentence into the English edition alone, though *Scope* item 11 says both

```seal
severity: should
location: `seal/threads/1795636143-213-a-panes-tab-has-a-menu/frame/design.md:107-113`, `seal/threads/1795636143-213-a-panes-tab-has-a-menu/frame/design.md:49`
evidence: read `docs/architecture.md:60`, `docs/architecture.ko.md:47`, `docs/architecture.ko.md:60`; executed `grep -c 'file: docs/architecture' seal/threads/1795636143-213-a-panes-tab-has-a-menu/frame/design.md` (1)
```

Why it matters: *Scope* item 11 says the settle writes the rule "into both editions of `docs/architecture.md`". `## Rule changes` holds one operation, for `docs/architecture.md`. The settle writes the operations a frame lists, so `docs/architecture.ko.md` would keep "그 칸의 작업, 종류, 폴더, 그리고 에이전트의 훅 이벤트에 실려 오는 세션 ID입니다." with no name and no colour. Issue #61's framer reads either edition. The broad gate compares only headings and table rows, so nothing catches the gap. Other frames of the release write each edition as its own operation (`seal/threads/1795610687-235-stage-prompts-name-the-worktree/frame/design.md:82`).

```md
- change
  file: docs/architecture.ko.md
  section: 세션이 견디는 것
  from: 데몬은 칸마다 기록을 실행 폴더에 둡니다. 그 칸의 작업, 종류, 폴더, 그리고 에이전트의 훅 이벤트에 실려 오는 세션 ID입니다.
  to: 데몬은 칸마다 기록을 실행 폴더에 둡니다. 그 칸의 작업, 종류, 폴더, 사람이 그 탭에 준 이름과 색, 그리고 에이전트의 훅 이벤트에 실려 오는 세션 ID입니다. 그 기록이 생기기 전까지 칸의 이름과 색은 데몬의 세션에 있고, 칸이 있는 동안만 있습니다.
```

```seal
verdict: fixed 23e4790a
answer: The framer added the `change` of `docs/architecture.ko.md` *세션이 견디는 것* to `## Rule changes` from the round's block (`23e4790a`); its `from:` sentence stands once in that file. Records alone.
```

### 5. Phase 2 hands back five unit files as the whole list of those that read the changed modules, and `gate.test.ts` is missing from it

```seal
severity: should
location: `seal/threads/1795636143-213-a-panes-tab-has-a-menu/trail/phases/phase-2.md:46`
evidence: executed `grep -ln -e 'renderer/view' -e 'daemon/daemon' -e 'design.md' -e 'index.html' -e 'themes.css' test/*.test.ts` in `apps/desktop`, then `grep -c buildApp` on each; read `apps/desktop/test/gate.test.ts:9`
```

Why it matters: phase 2 says "Those five are the unit files besides `view.test.ts`, `themes.test.ts` and `daemon.test.ts` that import `daemon.ts` or `view.ts` or read `docs/design.md`, `index.html` or `themes.css`". The sealer reads that sentence to decide what ran. `gate.test.ts` is a unit file (it does not import `buildApp`) and imports and constructs `Daemon` from `daemon.ts` (`gate.test.ts:9`), and phase 2 did not run it. `chain.test.ts` imports a type from `daemon.ts` alone, which runs nothing. Three of the five match only by a string: `chain-records.test.ts` and `pr-check.test.ts` by `frame/design.md`, and `navigation.test.ts` by a `dist/index.html` URL, and none of the three reads the file. The list is a sample handed back as a whole. Nothing broke for it: `gate.test.ts` asserts no whole session, and this round ran it at `faee6ea4` with `view.test.ts` and `themes.test.ts`, 631 passed. The sentence still states a universal about the tree that the tree contradicts.

```md
trail/phases/phase-2.md line 46, in place of the sentence that opens "Those five are the unit files":
"Those five were picked by `grep -ln` over `test/*.test.ts` for the changed modules' names, a sample: three of them match only a string, and `gate.test.ts`, which constructs a `Daemon`, matched and was not run in this phase. Round 1 ran it at `faee6ea4` beside `view.test.ts` and `themes.test.ts`, 631 passed."
```

```seal
verdict: fixed af5227e7
answer: `trail/phases/phase-2.md` line 46 takes the finding's sentence: the five files were a sample picked by `grep -ln`, `gate.test.ts` matched and was not run in phase 2, and round 1 ran it at `faee6ea4`, 631 passed. Line 21 of the same record said the dialog sends the field as it stands, which finding 1's fix made false, and now says where the trim and the `null` stand.
```

## Confirmations

What matched: the two window paths of a `setPane` refusal, read. The rename dialog's refusal: `renderer.ts:2064` asks `takePaneName` in the `error` arm after the dialogs whose request ids it cannot hold, and `takePaneName` (`work-item-view.ts:1338-1347`) writes the refusal into `#pane-name-error`, which `index.html:561` draws in `--state-failed` under the field's sentence, and turns "Save" on again; `renderer.ts:2026` asks it in the `done` arm, which closes the dialog. A swatch's refusal: `openTabMenu` sends `setPane` with a request id nobody keeps (`work-item-view.ts:1386`), so every claimant of the `error` arm passes it by and it reaches `tell(message.message)` (`renderer.ts:2091`), the sidebar's notice, as `gaps.md` row 5 says. Neither path is reachable from the window but by a race: the swatch sends only for a pane `held.sessions` still lists, and the field's `maxLength` is `PANE_NAME_CHARS` (`work-item-view.ts:1754`), a count of UTF-16 units as the daemon's `length` is. In the race, a pane closed by another client while the request is in flight, the daemon broadcasts the `inbox` before it refuses, `dropClosed` closes the dialog (`work-item-view.ts:907`), and the refusal "No pane 12 is open." reaches the sidebar. That sentence names the daemon's id, which `tabLabel`'s comment calls no tab's to show; `changeAccount`'s refusal already says it the same way (`daemon.ts:2021`), so this round counts it as the window's standing wording and not as this work's defect.

What matched: the right-click on the back's tab, read. `backTab` calls `preventDefault` on `contextmenu` and opens nothing (`work-item-view.ts:1447-1448`). The document's own handler opens a menu only on a line of `#repositories` or `.lines` or on a repository's row (`renderer.ts:653-666`, `lineOf` at `renderer.ts:579`, `rowOf` at `renderer.ts:565`), and neither selector meets the strip. No ancestor of `#tabs` listens for `contextmenu`: the module's other listeners stand on the menu, the pane's screen, the "+" buttons and the find bar (`work-item-view.ts:536`, `:802`, `:954`, `:1726`). The main process installs no `context-menu` handler (executed, `git grep -n context-menu -- apps/desktop/src/main`, exit 1), so nothing would open even without the `preventDefault`. A case would still be what executes it, as `gaps.md` row 1 says.

What matched: the escaped `\|`, executed. Phase 1's account holds: typed as the raw frame spells it, `git grep -n -e 'function closePane(' -e 'let asking: number \| undefined' -- . ':!seal'` printed 1462 lines at `faee6ea4`. With a plain `|` it printed nothing (exit 1). Finding 3 holds what follows from it.

What matched: the daemon's `setPane` refuses before it sets, answers `done` before the `inbox`, and broadcasts only on a change (`daemon.ts:1591-1612`), executed by `daemon.test.ts -t setPane`, 4 passed. `SessionInfo` is built in one place, the start of a pane (`daemon.ts:2601`), and it carries `name: null, colour: null`, so a setup pane offers "Rename…" too (read, `grep -n 'info:' daemon.ts`).

What matched: `view.test.ts`, `themes.test.ts` and `gate.test.ts` in one command passed at `faee6ea4`, 631 cases (executed). The `tabMenu`, `closeSays`, `tabLabel` and `tabSays` cases hold *Scope* item 9's unit part, and the `themes.test.ts` case holds *Scope* item 7 against the five grounds the frame names.

What matched: the committed shots, read. `night-watch-dark-tabs.png` and `register-light-tabs.png` show "Shell 1" plain and the green, blue ("build") and pink tabs, the blue tab's menu open under the strip with Blue checked by an edge, "Rename…" in front, and the rule above "Close Pane". `night-watch-light-rename.png` and `desk-dark-rename.png` show "Rename build" with the field selected and the sentence in the muted ink. Register's tab in front carries its top rule and the pink bar at once, as the row "A pane's tab" says.

What matched: no other unsettled frame of the release quotes the sentences this work changed. `grep -n -F "A pane's tab"` and `grep -n -F '터미널 칸의 탭'` over the other `frame/design.md` files printed nothing, and the `from:` texts of #224, #214, #218, #249 and #150 in *A pull request that changes the window carries its screenshots* quote none of the sentences this diff rewrote there (read). `docs/design.md` and `docs/design.ko.md` hold 15 headings and 398 table rows each at `faee6ea4` (executed, `grep -c`).

Not a finding: the tab's bar is held at 3 to 1 against the five grounds of *Scope* item 7, and not against `--pressed`, which a tab not in front takes while the button is held (`index.html:397`). The press lasts as long as the button is down, and no *Scope* item names that ground.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The built-app files: `terminal-basics.test.ts`, `work-item-menu.test.ts`, `screenshots.test.ts` and the others `apps/desktop/vitest.config.ts` puts in the `app` project. This round ran none of them; phase 2 says `terminal-basics.test.ts` passed whole at `cff754a6`, 40 cases, which this round did not re-run. The acceptance row "The single close keeps its form" rests on that run. | `gaps.md` rows 2 and 3 | the orchestrator's broad gate |
| `daemon.test.ts` whole: this round ran `-t setPane` alone, 4 cases | `gaps.md` row 4 | the orchestrator's broad gate |
| The full suite, the repository-wide lint and the typecheck: `unverified` | `gaps.md` row 6 | the orchestrator's broad gate |
| The prompt's instruction to read the committed shots was followed; the screenshot run itself was not made | `seal/threads/1795636143-213-a-panes-tab-has-a-menu/screenshots/` | the orchestrator |
| `frame/questions.md` Q1 to Q3, the three colours, the bar in place of a dot, and one shape for every colour, stand open for the owner. This round judged the build against the defaults the frame gives them | `frame/questions.md:16-18` | a person |

## Probes

| Command | Result |
|---|---|
| `cd apps/desktop && node scripts/test-in-electron.mjs test/view.test.ts test/themes.test.ts test/gate.test.ts` | exit 0: 3 files, 631 passed |
| `cd apps/desktop && node scripts/test-in-electron.mjs test/daemon.test.ts -t setPane` | exit 0: 4 passed, 408 skipped |
| The frame's search as its raw text spells it, with its output counted, as finding 3's `evidence:` line writes it | 1462 lines at `faee6ea4` |
| The same search with a plain bar in place of the backslash and the bar | exit 1 at `faee6ea4` |
| `git grep -n -e 'function closePane(' -e 'let asking: number . undefined' -- . ':!seal'`, at `faee6ea4` and at `5b20b1c6` | exit 1 at `faee6ea4`; at `5b20b1c6` the two lines `work-item-view.ts:137` and `work-item-view.ts:1236` |
| `git grep -n context-menu -- apps/desktop/src/main` | exit 1, no handler |
