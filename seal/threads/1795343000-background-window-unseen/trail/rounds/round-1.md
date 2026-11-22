# Review round 1: 1795343000-background-window-unseen

```seal
target: 27daa42 against origin/release/v0.0.2
```

This is the first round, so no earlier round's coordinates were carried. Every fact below was established at `27daa42`. The work item has no `seal/parity.json` and no `frame/`. Issue #148's *Done when* is therefore the frame this round read the code against, beside `trail/phases/phase-1.md`. The records read whole at the target are `routing.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-1.md`. No `pr.<lang>.md` stands, and `Commit and pull request language` is English. The crafter's probe outputs were read in its scratch directory, `1795343000-background-window-unseen/phase-1/` under the session's scratchpad.

## Findings

### 1. A crafter built a work item that has no frame, so the rule this change amends reaches no policy document

```seal
severity: must
location: `seal/threads/1795343000-background-window-unseen/routing.md:7-8`, `seal/threads/1795343000-background-window-unseen/routing.md:18`, `seal/threads/1795343000-background-window-unseen/frame/design.md`, `seal/threads/1795343000-background-window-unseen/frame/plan.md`, `docs/architecture.md:384`, `docs/architecture.ko.md:384`, `apps/desktop/measurements/memory.md:37`, `seal/threads/1795343000-background-window-unseen/gaps.md:15`
evidence: read `seal/threads/1795343000-background-window-unseen/routing.md:7-18`, `seal/threads/1795343000-background-window-unseen/trail/phases/phase-1.md:43-48`, `seal/threads/1795343000-background-window-unseen/gaps.md:15`, `docs/architecture.md:384`, `docs/architecture.ko.md:384`, `apps/desktop/measurements/memory.md:37`, plugin `skills/implement/orchestration.md` *Three combinations do not stand*, plugin `skills/settle/SKILL.md` *settle*; executed `ls seal/threads/1795343000-background-window-unseen` (no `frame/`)
```

Why it matters: the plugin's `skills/implement/orchestration.md` lists three combinations that do not stand. One of them is "`crafter` building with no frame", because the crafter builds a phase of `frame/plan.md` and fills its Status cell. `routing.md:7-8` declares `Planning` `the session` and `Implementation` `crafter`. The work item holds no `frame/`. The same document defines `the session` as the row "where the orchestrator drew it", so `routing.md:7` says the session drew a frame, and the directory shows none was drawn. `routing.md:18` says "the crafter's phase record states the design". A phase record is read by no settle. The settle reads the rule changes from each work item's `frame/design.md` `## Rule changes`.

The change amends a rule. `docs/architecture.md:384` decides which readings a person must take, by listing what a background start lacks: "Such a start lacks the Dock icon, the menu bar, the system's focus and the system's pointer, so a reading that rests on one of them ... is a run the person makes". From `27daa42` on, such a start also lacks the window on the screen (`apps/desktop/src/main/background.ts:35`). A reading that rests on what the screen shows of the window now falls to a person. The list does not say so, and an agent acts on the list. `apps/desktop/measurements/memory.md:37` says "Such a start lacks four things a person's start has". At the target the start lacks five, so the count is now false. The crafter's claim at `trail/phases/phase-1.md:43` that "None is made false by this phase" does not hold for that line. The phase lists the lines for the orchestrator, and `gaps.md:15` leaves them as "Not done" with nobody to answer them. With no `## Rule changes`, the settle of release 0.0.2 removes this work item's directory and keeps the old sentences.

The list of statements was made with `git grep -n "OWLERY_BACKGROUND"` and with `in the background` over `docs/`, `apps/desktop/measurements/` and the READMEs. That is a sample, by contract rule 12. Two more lines it found are true and incomplete: `docs/roadmap.md:29` and `docs/design.md:487`, with their Korean twins at the same lines. Whether they change is the frame's choice. `docs/architecture.md:365` and its twin change too, if finding 2's fix is taken.

The fix is the orchestrator's, since `Planning` is `the session`. Write `frame/plan.md` from the plugin's `templates/records/sdd-plan.md`: one phase whose Delivers cell is the `setOpacity(0)` call and its case, with its Status cell naming the build commit `dd022bb`. Write `frame/design.md` from `templates/records/sdd-design.md`, holding this section:

```
## Rule changes

- change
  file: docs/architecture.md
  section: Measure before building
  from: Such a start lacks the Dock icon, the menu bar, the system's focus and the system's pointer, so a reading that rests on one of them, such as a typed Korean line, the memory of a window kept in front or a pointer passing over the window, is a run the person makes
  to: Such a start lacks the Dock icon, the menu bar, the system's focus, the system's pointer and the window on the screen, which is drawn at opacity 0, so a reading that rests on one of them, such as a typed Korean line, the memory of a window kept in front, a pointer passing over the window or what the screen shows of the window, is a run the person makes
- change
  file: docs/architecture.ko.md
  section: 만들기 전에 잴 것
  from: 그렇게 띄운 앱에는 Dock 아이콘, 메뉴 막대, 시스템의 포커스, 시스템의 포인터가 없습니다. 그래서 사람이 친 한글 줄, 앞에 둔 창의 메모리, 창 위를 지나는 포인터처럼 그 넷 가운데 하나에 기대는 값은 사람이 돌려서 잽니다
  to: 그렇게 띄운 앱에는 Dock 아이콘, 메뉴 막대, 시스템의 포커스, 시스템의 포인터가 없고, 창은 불투명도 0으로 그려져 화면에 보이지 않습니다. 그래서 사람이 친 한글 줄, 앞에 둔 창의 메모리, 창 위를 지나는 포인터, 화면에 보이는 창의 모습처럼 그 다섯 가운데 하나에 기대는 값은 사람이 돌려서 잽니다
```

`apps/desktop/measurements/memory.md` is outside the policy root, so no settle writes it. Edit it in this branch:

```markdown
Every run here is an agent's. The app starts under `OWLERY_BACKGROUND=1`, and the measurement tells the page that it has the focus, because a page without it may draw nothing. Such a start lacks five things a person's start has: the Dock icon, the menu bar, the system's focus on the window, the system's pointer, which passes through the window to what is under it, and the window on the screen, which is drawn at opacity 0.
```

Rewrite `routing.md:18` to say the session wrote `frame/design.md` and `frame/plan.md`, and that the crafter built the plan's one phase. The snippet stops there. Two more statements are owed. The fix pass owes `gaps.md:15`'s second paragraph, which no longer stands once the frame carries the lines. The frame's author owes the roadmap and design lines named above, where it changes them.

### 2. Under the switch the folder dialog still opens as a sheet the person can see, while the changelog says the run draws nothing

```seal
severity: should
location: `apps/desktop/src/main/main.ts:170-174`, `apps/desktop/src/main/pick-folder.ts:12`, `apps/desktop/test/pick-folder.test.ts`, `seal/threads/1795343000-background-window-unseen/changelog.md:1`, `seal/threads/1795343000-background-window-unseen/changelog.md:5`, `seal/threads/1795343000-background-window-unseen/gaps.md:13`
evidence: read `apps/desktop/src/main/main.ts:170-174`, `apps/desktop/src/main/pick-folder.ts:12-16`, `apps/desktop/src/main/links.ts:33-37`, `docs/architecture.md:365`, `seal/threads/1795343000-background-window-unseen/gaps.md:13`, `seal/threads/1795343000-background-window-unseen/changelog.md:1-5`; executed `git grep -nE "work-item-browse|pickFolder"` (found only in `src/renderer`, `src/preload`, `src/main` and the unit case)
```

Why it matters: the issue's *Done when* says "An app started with `OWLERY_BACKGROUND=1` draws nothing the person at the machine can see". The class is every surface such an app puts on the screen. The method was to list each Electron call in `src/main` that makes or shows a window: `new BrowserWindow`, `show`, `showInactive`, `setOpacity`, `dialog.`, `popup`, `setWindowOpenHandler`, `loadFile` and `reload`. It is a sample over Electron's API names. Every instance it found is covered except one. `main.ts:173` opens `dialog.showOpenDialog(win, options)` as a sheet of the window. A sheet is a window of its own, and no code sets its opacity. `gaps.md:13` says so and names no one to answer it. Neither the crafter nor this round measured whether the sheet is drawn, because a measurement would draw it on the owner's screen. AppKit does not apply a parent window's alpha value to its child windows. So the sheet is likely drawn over the person's windows, and it may take the keyboard. No case clicks Browse today. An agent that drives the built app through the debugging port can still click it.

The code already handles the other ways a background start reaches outside the window: `chooseOpener` at `links.ts:33-37` opens nothing in the background, and `docs/architecture.md:365` states the rule. Meanwhile `changelog.md:1` reads "an agent's run of the built app draws nothing on your screen", and `changelog.md:5` reads "so nothing of it reaches your screen". Both claim more than the change holds.

Fix, with no OS-boundary precondition: in the background, no dialog opens.

```ts
// apps/desktop/src/main/pick-folder.ts, after pickFolder
/**
 * Who opens the folder dialog for this start of the app: nobody in the
 * background, so a start a test or an agent makes shows no sheet on the
 * screen of the person at the machine (#148), and the system's dialog
 * otherwise. In the background the answer is that no folder was chosen.
 */
export function chooseFolderDialog(background: boolean, system: OpenFolderDialog): OpenFolderDialog {
  if (background) return async () => ({ canceled: true, filePaths: [] });
  return system;
}

// apps/desktop/src/main/main.ts:18
import { chooseFolderDialog, pickFolder } from "./pick-folder";

// apps/desktop/src/main/main.ts:172-173
    // The dialog is a sheet of the window that asked, where that window is still there. In the background none opens (./pick-folder, `chooseFolderDialog`).
    const win = BrowserWindow.fromWebContents(event.sender);
    return pickFolder(chooseFolderDialog(background, (options) => (win ? dialog.showOpenDialog(win, options) : dialog.showOpenDialog(options))));

// apps/desktop/test/pick-folder.test.ts, import chooseFolderDialog beside pickFolder
describe("chooseFolderDialog", () => {
  it("opens no dialog in the background and answers that no folder was chosen, and opens the system's otherwise", async () => {
    let opened = 0;
    const system = async () => {
      opened += 1;
      return { canceled: false, filePaths: ["/r/project"] };
    };
    expect(await pickFolder(chooseFolderDialog(true, system))).toBeNull();
    expect(opened).toBe(0);
    expect(await pickFolder(chooseFolderDialog(false, system))).toBe("/r/project");
    expect(opened).toBe(1);
  });
});
```

The snippet stops at the code. Four more statements are owed with it. The first is the frame's rule change on `docs/architecture.md:365` and `docs/architecture.ko.md:365`: "opens nothing in the system browser or in Finder" becomes "opens nothing in the system browser or in Finder, and no folder dialog". The other three are the fix pass's. `gaps.md:13`'s paragraph goes. `changelog.md:5` gains the dialog. `changelog.md:1` names the window: "an agent's run of the built app no longer draws its window over yours". The title needs that change either way, because the app's system notifications (row 2 of *Not judged*) are not covered either. Where the orchestrator chooses not to take the code change for this item, the changelog's title and `:5` still owe that narrowing, and `gaps.md:13` owes a named answerer.

### 3. The phase record misreports the window watcher's count

```seal
severity: should
location: `seal/threads/1795343000-background-window-unseen/trail/phases/phase-1.md:27`
evidence: executed `awk '{print $5,$6,$7,$8}' watch.log | sort | uniq -c` and `grep -n "alpha=1" watch.log` in the crafter's scratch directory `phase-1/`
```

Why it matters: the phase claims "Of 375 samples, 373 read `alpha=0 onscreen=1` at 1440 by 900. The other two read `alpha=1 onscreen=false` at 0 by 0". The watcher's log holds 372 samples at `alpha=0 onscreen=1` and three at `alpha=1 onscreen=false`, at its lines 1, 6 and 185. Each of the three is the first sample of its app: pids 59272, 59723 and 89482. The conclusion stands: no sample shows the window on the screen at another opacity. But the line reports an executed reading wrongly, and the sealer reads it as evidence.

```markdown
Of 375 samples, 372 read `alpha=0 onscreen=1` at 1440 by 900. The other three read `alpha=1 onscreen=false` at 0 by 0, each the first sample of its app: the window before it is shown.
```

## Confirmations

What matched: the call order. `apps/desktop/src/main/background.ts:33-37` calls `setIgnoreMouseEvents(true)`, then `setOpacity(0)`, then `showInactive()`. `main.ts:127` builds the window with `show: !background`, and `loadFile` at `main.ts:151` shows nothing. So the window is first shown at opacity 0 (read). The watcher's three `alpha=1` samples are all `onscreen=false` at 0 by 0, which agrees (executed, the command of finding 3).

What matched: the unit case was extended in its group, `background.test.ts` *showInBackground*, and not added beside it. It pins the order. `node scripts/test-in-electron.mjs test/background.test.ts test/pick-folder.test.ts test/forward.test.ts` passed, 3 files and 22 tests (executed, at `27daa42`). The `seen red` claim matches `red.txt`, which fails at `background.test.ts:73` with `"setOpacity 0"` missing. The three mutants in `mutate.txt` are all red, and none survived (read).

What matched: the other paths that show a window under the switch. A second window comes only from `createWindow`, at `main.ts:101` (`tellDaemonMenu`) and `main.ts:209` (`activate`), and `createWindow` always calls `showInBackground` under the switch at `main.ts:152`. `main.ts:210`'s `win.show()` runs only for a window that is not visible. Under the switch no window is hidden, since `closeHides` is false at `background.ts:69-71`. `show()` sets no alpha. `comeForward` returns before `win.show()` where `background` is true (`forward.ts:24`). `setWindowOpenHandler` denies every new window (`main.ts:139`). A reload keeps the native window, so it keeps the alpha. `setOpacity` is called nowhere else in `src` (all read; `git grep -n setOpacity`, executed). The pane menus are drawn in the page: `src` has no `popup(` call (executed).

What matched: a person's start is untouched. `showInBackground` has one caller, `main.ts:152`, under `if (background)`. `background` is `takeBackground(process.env)` at `main.ts:39`, true only for `OWLERY_BACKGROUND` equal to `1` (`background.ts:14-16`). A person's window is built with `show: true` and an opacity nobody sets (read). No start without the switch was made, by this round or by the crafter. `gaps.md:9` names the owner to answer it.

What matched: `pr.md` and `changelog.md` claim what the probe outputs hold, apart from finding 2's title. `probe.log` reads opacity 0 at 145 frames a second, `visible`, with change events. It reads opacity 1 as `hidden` at 0 frames, under a Google Chrome window at 0,30 of 1920 by 978 (`pr.md:8`, `changelog.md:6`). The `app-*.txt` outputs read theme-controls 5 passed, terminal-basics 25, notification-click 3, memory 29, and screenshots 1 passed with 6 skipped (`pr.md:7`, `phase-1.md:31-35`). `app-measure.txt` reads 142.3 and 228.1 MB, with the GPU process at 26.2 and 59.4, at 144 to 145 frames a second. `probe-memory-opacity.txt` reads 142.6 and 236.1 MB at opacity 0.01 (`phase-1.md:37`). The watcher saw six apps, pids 59272, 59723, 80798, 85180, 89482 and 90962 (`pr.md:7`, "over six runs"). Every reading was executed by the crafter and read by this round. In the first and third readings of `probe.log`, an opaque `Electron` window at the same 240,26 1440 by 900 also stands above the app's window. `phase-1.md:13` leaves it out. The comparison it draws still holds, because the window was covered in all three readings.

What matched: the suite is labelled `unverified` honestly. `apps/desktop/vitest.config.ts:14-17` picks 14 files that import `buildApp`. The phase ran four of them and the screenshot command. `gaps.md:7` names the other nine and the rest of `memory.test.ts`, with the orchestrator to answer (executed, `grep -lE "BuiltApp|buildApp" test/*.test.ts`).

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the folder sheet takes the parent window's opacity on macOS. A run would draw it on the owner's screen, so this round did not make one | `apps/desktop/src/main/main.ts:173` | the orchestrator, by finding 2's fix, which makes the question moot |
| Whether a page started under the switch raises system notifications on the person's screen, in the built-app cases other than `notification-click` and `screenshots`, which replace `Notification` | `apps/desktop/src/renderer/renderer.ts:1192` | the orchestrator, as a follow-up outside #148's window scope |
| A window at opacity 0 keeps drawing on GitHub's macOS runner and on another macOS than 26.6 | `seal/threads/1795343000-background-window-unseen/gaps.md:8` | the orchestrator, by the pull request's `check` run |
| A person's start draws and behaves as before, executed | `seal/threads/1795343000-background-window-unseen/gaps.md:9` | the owner |
| The typecheck and the full suite at `27daa42` | `seal/threads/1795343000-background-window-unseen/gaps.md:7` | the orchestrator, at the broad gate |

The unit case leaves one gap that opens no finding. No case pins the call of `showInBackground` at `main.ts:152`, so its removal would be caught only by the built-app cases that need a shown window. That call is #117's and this diff did not change it.

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/background.test.ts test/pick-folder.test.ts test/forward.test.ts` in `apps/desktop` | exit 0; 3 files, 22 tests passed |
| `awk '{print $5,$6,$7,$8}' watch.log \| sort \| uniq -c` in the crafter's `phase-1/` | 372 samples at `alpha=0 onscreen=1`, 3 at `alpha=1 onscreen=false` |
| `git grep -nE "new BrowserWindow\|\.show\(\|showInactive\|setOpacity\|dialog\.\|\.popup\(\|setWindowOpenHandler\|loadFile" -- src/main` in `apps/desktop` | one window-making call, `main.ts:117`; one sheet, `main.ts:173`; `win.show()` at `forward.ts:26` and `main.ts:210`; one `setOpacity`, `background.ts:35` |
