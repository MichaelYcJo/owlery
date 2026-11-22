# Design: 1795343000-background-window-unseen

## Grounding

The tree as read at `e6937ca`. This frame was drawn after the build, not before it. Phase 1 was built at `dd022bb` with no frame, and review round 1 at `27daa42` found the frame missing (`trail/rounds/round-1.md` finding 1). What this frame says of phase 1 is read from that commit and from `trail/phases/phase-1.md`. What it says of phase 2, the fix pass of round 1, stands before that pass is built.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Measure before building*, the item "A start of the app that an agent makes on a person's machine sets `OWLERY_BACKGROUND=1`", and the same item of `docs/architecture.ko.md` *만들기 전에 잴 것* (line 384 of each) | The item lists what a background start lacks, and a reading that rests on one of those is a person's run. From `dd022bb` on, such a start also lacks the window on the screen, so the list gains it (*Rule changes*, the first two operations) |
| `docs/architecture.md` *Screen framework: Electron*, the paragraph "The window shows Owlery's own page and nothing else, and no second window opens", and `docs/architecture.ko.md` *화면 프레임워크: Electron* (line 365 of each) | A background start already opens nothing in the system browser or in Finder (`apps/desktop/src/main/links.ts#chooseOpener`, `src/main/paths.ts#chooseFinder`). The folder dialog joins that list, and the paragraph's check line names the cases that hold it, `pick-folder.test.ts` for `chooseFolderDialog` and `work-item-form.test.ts` for the handler's use of it (*Scope* item 2; *Rule changes*, the operations on this section) |
| `docs/design.md` *A pull request that changes the window carries its screenshots*, the paragraph on `pnpm run screenshots`, and `docs/design.ko.md` *창을 바꾸는 PR은 스크린샷을 싣습니다* (line 487 of each) | The paragraph tells the person who runs the command what it takes from them: neither the keyboard nor the pointer. The issue names this command, and its window is now not drawn either (*Rule changes*, the last two operations). The command captures the page with `Page.captureScreenshot` (`apps/desktop/test/screenshots.test.ts:210`, read), not the screen |
| `docs/roadmap.md` *Milestones*, the paragraph on the Korean input regression test, and its Korean edition (line 29 of each) | It says the switch keeps the window off the keyboard and the mouse, which is why a person's typing does not disturb the replay. Whether the window is seen changes nothing that paragraph decides, so it does not change (*Scope*, out) |

| Source | What it gave this frame |
|---|---|
| Issue #148, its body and comments | The three lines of *Done when*. The issue has no comment. Executed: `gh issue view 148 --json title,body,comments` |
| `routing.md` | Present. Agentic run, crafter, the review chain, the branch `test/148-background-window-draws-nothing`, merging into `release/v0.0.2` ahead of the other work items. Read |
| `trail/phases/phase-1.md` | The design of phase 1 and its measurements. At opacity 0, under another app's window, the page stayed `visible` at 145 frames a second with `matchMedia` change events. At opacity 1 under the same window it was `hidden` at 0 frames. So `backgroundThrottling` is not set. Executed by the crafter, read here |
| `trail/rounds/round-1.md` | Finding 1 (no frame, so no `## Rule changes`), finding 2 (the folder dialog under the switch) and finding 3 (the watcher's count at `phase-1.md:27`). Read |
| `seal/follow-up.md` | Absent. Executed: `ls seal/` lists `config.json`, `README.md` and `threads` |
| The latest GitHub Release, `v0.0.1`, and the changelog fragments under `seal/threads/` | Neither holds a `### Process changes` heading. Executed: `gh release view --json tagName,body` and `grep -l '### Process changes' seal/threads/*/changelog.md` |
| The index of the policy root | `seal/config.json` names no `Policy root`, so it is `docs/`. `docs/README.md` does not exist, so each `file:` of *Rule changes* is a document of `docs/` itself, with its `.ko.md` edition beside it. Executed: `cat docs/README.md` failed with no such file |
| The unsettled designs at `origin/release/v0.0.2` | None names a section *Rule changes* names. Executed: `grep -A1 -E 'file: docs/(architecture\|design\|roadmap)' seal/threads/*/frame/design.md` lists sections of `1795329620-role-bundle` and `1795268972-headless-failure-and-limit`, none of them these |
| What the tree already does for a background start | `chooseOpener` (`links.ts`), `chooseFinder` (`paths.ts`) and `chooseClipboard` (`clipboard.ts`) each take `background` and the system's act, and return a stand-in in the background. Nothing does this for the folder dialog: `apps/desktop/src/main/main.ts:170-174` calls `dialog.showOpenDialog(win, options)` whatever the start. Read |
| The folder dialog's callers | `src/renderer/renderer.ts:1624-1630` alone asks for a folder, at the Browse button, and does nothing where the answer is null. Executed: `git grep -n pickFolder -- apps/desktop/src/renderer apps/desktop/src/preload` |
| The calls that make the window transparent | Executed at `e6937ca`: `git grep -n -e setOpacity -- apps/desktop/src` printed `apps/desktop/src/main/background.ts:33` (the type of `showInBackground`'s parameter) and `:35` (the call), and nothing else. The pathspec leaves out the work item's directory |
| No test pins a sentence *Rule changes* rewrites | Executed at `e6937ca`: `git grep -n -F` on each `from`, outside `seal/threads`, printed only the policy lines the operations rewrite: `docs/architecture.md:365`, `:366` and `:384`, `docs/architecture.ko.md:365`, `:366` and `:384`, `docs/design.md:487` and `docs/design.ko.md:487`. No test file holds one |
| *Rule changes* parses | Executed, read-only: `rule_changes.parse` of the plugin's `skills/settle/scripts/rule_changes.py` over this file with `docs` as the policy root returned the operations and no refusal (the command is in `frame/plan.md` *Technical context*) |

## Scope

In:

1. **A window started with `OWLERY_BACKGROUND=1` is drawn at opacity 0.** `showInBackground` calls `setIgnoreMouseEvents(true)`, then `setOpacity(0)`, then `showInactive()`, so the window is never on the screen at another opacity. The case `apps/desktop/test/background.test.ts` *showInBackground* pins that order. The docstrings of `startsInBackground` and `showInBackground`, the comments at `main.ts:37` and `:126`, and the docstring of `BuiltApp.start` in `test/built-app.ts` say it. No `backgroundThrottling` is set, because the page keeps drawing at opacity 0 (*Grounding*, `trail/phases/phase-1.md`). Built at `dd022bb`.
2. **A background start opens no folder dialog.** `apps/desktop/src/main/pick-folder.ts` gains `chooseFolderDialog(background, system)`. In the background it returns a dialog that opens nothing and answers `{ canceled: true, filePaths: [] }`, so `pickFolder` gives null and the Browse button does nothing. Otherwise it returns the system's dialog. The handler of `Channel.pickFolder` at `main.ts:170-174` passes its sheet through it, and its comment names it. A case in `apps/desktop/test/pick-folder.test.ts` holds both branches, and is seen red with the background branch removed. The built-app case `apps/desktop/test/work-item-form.test.ts` *answers Browse with no folder in the background, and opens no dialog* holds the handler's use of `chooseFolderDialog`: it replaces the system's dialog in the main process, asks for a folder through `window.owlery.pickFolder()`, the call the Browse button makes, and expects no folder and no dialog opened, so no sheet is drawn on any run. It is seen red with `chooseFolderDialog(background, …)` taken out of `main.ts:173`. Round 1 finding 2 and round 2 finding 2.
3. **The policy documents state both** (*Rule changes*). The settle of release 0.0.2 writes them.
4. **`apps/desktop/measurements/memory.md` *The kind of start* says such a start lacks five things, the fifth being the window on the screen, drawn at opacity 0.** The file is outside the policy root, so no settle writes it, and the branch edits it in place.
5. **The work item's records say what the change holds and no more.** `changelog.md`'s title names the window: "an agent's run of the built app no longer draws its window over yours". Its first item names the folder dialog. `gaps.md` *Not done* loses its paragraph on the folder dialog, which item 2 does, and its paragraph on the policy lines, which items 3 and 4 do. `trail/phases/phase-1.md` gives the watcher's count as round 1 finding 3 corrects it: 372 samples at alpha 0, and 3 at alpha 1 off the screen.

Out:

- **The system notifications a page under the switch raises** (`src/renderer/renderer.ts:1192`). The system draws them, not the app's window, and the issue's subject is the window. Round 1 *Not judged* routes them to the orchestrator as a follow-up. `notification-click.test.ts` and `screenshots.test.ts` already replace `Notification` in their page.
- **`docs/roadmap.md` *Milestones*, line 29, and its Korean edition.** The paragraph stays true, and what it decides does not rest on whether the window is seen (*Grounding*).
- **A window placed where no display shows it.** Weighed and not taken (`frame/plan.md` *Alternatives considered*).
- **A person's start of the app.** Nothing changes it. Only the owner can start it without the switch, since that start draws a window on the owner's screen (`gaps.md` *Not verified*).

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| An agent runs a built-app case | Given `OWLERY_BACKGROUND=1`, when the app makes its window, then the window lets the pointer through, turns transparent and only then shows, without the keyboard | `background.test.ts` *showInBackground* expects `setIgnoreMouseEvents true`, `setOpacity 0`, `showInactive` in that order, seen red against the old function (`phase-1.md`). `git grep -n -e setOpacity -- apps/desktop/src` prints `background.ts:33` and `:35` only |
| The page under a transparent window keeps drawing | Given the window at opacity 0 under another app's window, when a case reads frames, `matchMedia` or a capture, then the page answers as before | The built-app files `phase-1.md` names, `pnpm run screenshots` and `measure:memory`, executed at `dd022bb`. The other built-app files and GitHub's macOS runner are the broad gate's and the pull request's `check` run (`gaps.md` *Not verified*) |
| An agent clicks Browse in a background start | Given `OWLERY_BACKGROUND=1`, when the page asks for a folder, then no dialog opens and the answer is null, so the form keeps the folder it had | `pick-folder.test.ts` *chooseFolderDialog*: in the background the system's dialog is opened zero times and the answer is null. Seen red with the background branch of `chooseFolderDialog` removed. `work-item-form.test.ts` *answers Browse with no folder in the background, and opens no dialog*: in the built app under the switch, with the system's dialog replaced in the main process, `window.owlery.pickFolder()` answers null and the replaced dialog is opened zero times. Seen red with `chooseFolderDialog(background, …)` taken out of `main.ts:173` |
| A person clicks Browse | Given no switch, when the page asks for a folder, then the system's dialog opens as a sheet of the window and its folder is the answer | `pick-folder.test.ts` *chooseFolderDialog*: the system's dialog opens once and its folder is returned. The handler at `main.ts:170-174` keeps the sheet, read |
| A person starts the app | Given no switch, when the app starts, then its window is shown at full opacity, takes the focus and takes the mouse | Read: `showInBackground` runs only under `if (background)` at `main.ts:152`. The owner's own start (`gaps.md` *Not verified*) |
| The settle writes the rules | Given release 0.0.2 settles, when it reads this design, then `docs/architecture.md`, `docs/design.md` and their Korean editions say a background start's window is drawn at opacity 0 and opens no folder dialog | `rule_changes.parse` reads *Rule changes* with no refusal (*Grounding*). `chain-check` reads it again at the pull request |

## Data & interfaces

- `apps/desktop/src/main/background.ts#showInBackground(win: { setIgnoreMouseEvents(ignore: boolean): void; setOpacity(opacity: number): void; showInactive(): void }): void`. The parameter gains `setOpacity`, which Electron's `BrowserWindow` has.
- `apps/desktop/src/main/pick-folder.ts#chooseFolderDialog(background: boolean, system: OpenFolderDialog): OpenFolderDialog`, new. It takes the existing `OpenFolderDialog` type and imports nothing of Electron, so its case runs without the app, as the cases of `chooseOpener` and `chooseClipboard` do.
- `Channel.pickFolder` keeps its answer, `string | null`. The preload and the page do not change.
- No schema, no message of the protocol, no environment variable and no dependency changes.

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
- change
  file: docs/architecture.md
  section: Screen framework: Electron
  from: An app started with `OWLERY_BACKGROUND=1` opens nothing in the system browser or in Finder, and reads and writes a clipboard of its own in place of the system's.
  to: An app started with `OWLERY_BACKGROUND=1` opens nothing in the system browser or in Finder and opens no folder dialog, and reads and writes a clipboard of its own in place of the system's.
- change
  file: docs/architecture.ko.md
  section: 화면 프레임워크: Electron
  from: `OWLERY_BACKGROUND=1`로 띄운 앱은 시스템 브라우저와 Finder에서 아무것도 열지 않고, 시스템의 클립보드 대신 자기 클립보드를 읽고 씁니다.
  to: `OWLERY_BACKGROUND=1`로 띄운 앱은 시스템 브라우저와 Finder에서 아무것도 열지 않고 폴더를 고르는 대화 상자도 열지 않으며, 시스템의 클립보드 대신 자기 클립보드를 읽고 씁니다.
- change
  file: docs/architecture.md
  section: Screen framework: Electron
  from: check: apps/desktop/test/terminal-basics.test.ts apps/desktop/test/navigation.test.ts apps/desktop/test/links.test.ts apps/desktop/test/paths.test.ts apps/desktop/test/clipboard.test.ts
  to: check: apps/desktop/test/terminal-basics.test.ts apps/desktop/test/navigation.test.ts apps/desktop/test/links.test.ts apps/desktop/test/paths.test.ts apps/desktop/test/clipboard.test.ts apps/desktop/test/pick-folder.test.ts apps/desktop/test/work-item-form.test.ts
- change
  file: docs/architecture.ko.md
  section: 화면 프레임워크: Electron
  from: check: apps/desktop/test/terminal-basics.test.ts apps/desktop/test/navigation.test.ts apps/desktop/test/links.test.ts apps/desktop/test/paths.test.ts apps/desktop/test/clipboard.test.ts
  to: check: apps/desktop/test/terminal-basics.test.ts apps/desktop/test/navigation.test.ts apps/desktop/test/links.test.ts apps/desktop/test/paths.test.ts apps/desktop/test/clipboard.test.ts apps/desktop/test/pick-folder.test.ts apps/desktop/test/work-item-form.test.ts
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: It builds the app and starts it in the background, so the window takes neither the keyboard nor the pointer of the person who runs it.
  to: It builds the app and starts it in the background, so the window takes neither the keyboard nor the pointer of the person who runs it. The window is drawn at opacity 0, so their screen shows nothing of it, and the command captures the page and not the screen.
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 이 명령은 앱을 빌드해 백그라운드로 띄우므로, 창은 실행한 사람의 키보드도 포인터도 가져가지 않습니다.
  to: 이 명령은 앱을 빌드해 백그라운드로 띄우므로, 창은 실행한 사람의 키보드도 포인터도 가져가지 않습니다. 창은 불투명도 0으로 그려져 그 사람의 화면에 보이지 않고, 명령은 화면이 아니라 창 안의 페이지를 찍습니다.

## Removes

The work adds one function, `chooseFolderDialog`, a stand-in of the kind `chooseOpener` and `chooseClipboard` already are, and the targets the check-line operations of *Rule changes* add to an existing check line. It adds no gate, hook, CI step or mark. What it takes out:

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The expectation that `showInBackground` makes two calls, `["setIgnoreMouseEvents true", "showInactive"]` | `apps/desktop/test/background.test.ts` *showInBackground* | The same case, which expects the calls of *Scope* item 1 in their order. Removed at `dd022bb` |
| The docstring's "and then shows below the window in front" with no transparency before it, and its last sentence, "The debugging port's input reaches the page as before." | `apps/desktop/src/main/background.ts#showInBackground` | The rewritten docstring, which says the window turns transparent first and that the port's input, reads and captures reach the page as before. Removed at `dd022bb` |
| The paragraph of *Not done* on the folder dialog | `seal/threads/1795343000-background-window-unseen/gaps.md` *Not done* | *Scope* item 2 does it |
| The paragraph of *Not done* on the policy lines not rewritten | `seal/threads/1795343000-background-window-unseen/gaps.md` *Not done* | *Scope* items 3 and 4, and *Scope* (out) for `docs/roadmap.md` |

Framed 2026-11-22 by framer, before the build.
