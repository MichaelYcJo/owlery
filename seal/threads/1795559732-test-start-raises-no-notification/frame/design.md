# Design: a test start raises no macOS notification

## Grounding

The tree as read at `5e03a948`. Paths without a root are under `apps/desktop/`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Screen framework: Electron*, the paragraph "The window shows Owlery's own page and nothing else, and no second window opens", and the same paragraph of `docs/architecture.ko.md` *화면 프레임워크: Electron* (line 471 of each, check line at 472) | Its last sentence lists what an app started with `OWLERY_BACKGROUND=1` holds back: the system browser, Finder, the folder dialog and the system's clipboard. Each is decided in the main process by a function that takes `background` and the system's own call (`src/main/links.ts#chooseOpener`, `src/main/paths.ts#chooseFinder`, `src/main/pick-folder.ts#chooseFolderDialog`, `src/main/clipboard.ts#chooseClipboard`), and each has a case that runs without Electron. The system notification joins that list, decided the same way (*Scope* items 1 and 2; *Rule changes*) |
| `docs/architecture.md` *Screen framework: Electron*, the paragraph "On macOS, closing the window hides it, and the app keeps its page" (line 474) | The window's page raises the notifications, and a person's start keeps them while the window is closed. This work leaves a person's start as it is, so the paragraph stands unchanged (*Scope*, out) |
| `docs/architecture.md` *Measure before building*, the item "A start of the app that an agent makes on a person's machine sets `OWLERY_BACKGROUND=1`", and the same item of `docs/architecture.ko.md` *만들기 전에 잴 것* (line 490 of each) | A reading that rests on what a background start lacks is a run the person makes. After this work such a start also lacks the system's notifications, so the list gains them, and whether a person's start still shows one is the person's run (*Rule changes*; `frame/questions.md` Q1) |

What the tree and the earlier records gave, each labelled:

| Fact | Label | Where |
|---|---|---|
| The page raises a notification at two places, both in `takeLists`, and neither reads whether the app started in the background | executed | `git grep -n 'new Notification' 5e03a948 -- apps/desktop/src` prints `src/renderer/renderer.ts:1531` and `:1536` and no other line |
| The page has no way to learn that the app started in the background. The main process keeps `background` to itself, and `OwleryApi` holds no such member | read | `src/main/main.ts:40`, `src/shared/ipc.ts:69-104`, `src/preload/preload.ts:24-50` |
| The preload already reads one fact from the main process before the page's first script runs, with a synchronous message | read | `src/preload/preload.ts:9`, `src/main/main.ts:193-195`, `src/shared/ipc.ts:23-24` |
| Six built-app files replace the page's `Notification` by hand, at seven places, after the app has started. Three keep what was raised in `window.__notifications`, and three replace it with a class that does nothing | executed | `git grep -n 'window.Notification' 5e03a948 -- apps/desktop` prints `test/approval-line.test.ts:124`, `test/ask-section.test.ts:73`, `test/decisions-and-questions.test.ts:146`, `test/notification-click.test.ts:82`, `test/screenshots.test.ts:590`, `test/screenshots.test.ts:688` and `test/seal-back-view.test.ts:96`, and no other line |
| Eleven files that start the built app replace nothing, so a notification their page raises reaches macOS: `test/chain-choice.test.ts`, `test/daemon-restart.test.ts`, `test/keep-awake.test.ts`, `test/korean-input.test.ts`, `test/memory.ts`, `test/records-dialog.test.ts`, `test/role-bundle.test.ts`, `test/terminal-basics.test.ts`, `test/theme-controls.test.ts`, `test/work-item-form.test.ts` and `test/work-item-menu.test.ts` | executed | `git grep -l 'BuiltApp.start' -- test`, each file then tested with `git grep -q 'window.Notification'` |
| A page under the switch does construct `Notification`: the recorder of `test/notification-click.test.ts` receives the page's calls in an app started with `OWLERY_BACKGROUND=1` | read | `test/notification-click.test.ts:79-91`, `:113-116`; `test/built-app.ts:207`. The frame ran no case |
| The three files that read a notification read its title and its body, and two of them call the handler the page set on it | read | `test/approval-line.test.ts:264`, `test/ask-section.test.ts:185-194`, `test/notification-click.test.ts:70`, `:118`, `:139` |
| Three of those files also put a new, empty list on `window.__notifications`, at four places: inside each of the three recorders, and once more in a case of `test/ask-section.test.ts`, which empties the list so that it reads its own notifications alone | executed | `git grep -n '__notifications = ' 5e03a948 -- apps/desktop` prints `test/approval-line.test.ts:123`, `test/ask-section.test.ts:72`, `test/ask-section.test.ts:167` and `test/notification-click.test.ts:81`, and no other line |
| The page's code is built as one self-running script, so a case reaches a value of the page only where the page puts it on `window` | read | `build.mjs` (the renderer's entry, `format: "iife"`), `test/built-app.ts` (`evaluate`) |
| The page calls nothing else that the system draws for it | executed | `git grep -n -E '\b(alert\|confirm\|prompt)\(\|setAppBadge\|new Audio\|requestPermission\|window\.open' 5e03a948 -- src/renderer src/preload`, with each `\|` typed as a bare bar, prints nothing |
| Release 0.0.2 left this out of #148 with the ground that macOS draws the notification and the window does not | executed | `git show c193260b:seal/threads/1795343000-background-window-unseen/frame/design.md`, line 42, and that work item's `guarantee.md`, lines 15 and 33 |
| The issue's one comment moves it to release 0.0.4 and changes nothing of the request | executed | `gh issue view 154 --json title,body,comments,labels,milestone` |
| The policy root has no index: `docs/README.md` does not stand. Each `file:` of *Rule changes* names a document read directly | executed | `ls docs` |
| `seal/follow-up.md` does not stand, and the body of the latest release, `v0.0.3`, holds no `Process changes` heading | executed | `ls seal`, `gh release view --json tagName,body` |

The frame ran none of the repository's checks and started no app.

## Scope

In:

1. **The page learns that the app started in the background.** `OwleryApi` gains the member `background`, a boolean the preload reads from the main process before the page's first script runs, as it reads the saved appearance. The main process answers with the value `takeBackground` returned.
2. **One function decides who raises a notification.** A new module of the page, `src/renderer/notifier.ts`, exports `chooseNotifier(background, system)`. It imports nothing of the browser, so its cases run without the app. In the background its `raise` constructs nothing of the system's: it keeps the title, the body and a handler that starts empty as one entry of a list, and returns that entry. Otherwise `raise` returns what `system` returns and the list stays empty.
3. **The page raises every notification through that function.** Both places of `takeLists` call `raise` and set the click's handler on what it returns, as they set it on the `Notification` today. The page's one `new Notification` is the `system` it hands to `chooseNotifier`. Where `window.owlery.background` is true the page puts the list on `window.__notifications`, the name three files already read.
4. **The cases read what the page kept.** The six files of *Removes* drop their replacements. `test/approval-line.test.ts`, `test/ask-section.test.ts` and `test/notification-click.test.ts` read `window.__notifications` as the page fills it, and call the handler the page set on an entry where they called it before. No case puts a list of its own on `window.__notifications`: the page fills the list it put there at load and no other, so a case that replaces it waits on a list nobody fills. A list a file puts there before the page's script has run is replaced by the page's (`trail/phases/phase-2.md`, the probe). The case of `test/ask-section.test.ts` that reads its own notifications alone takes the list's length before its requests and reads the entries after that place. That length stands where the case emptied the list before this work, and like that line it is an arrangement and not an assertion: it keeps the case from depending on whether a case before it raised a notification. At this tree no case before it raises one, so the length is 0, a run with `0` in its place passes (`trail/phases/phase-2.md` *Reds*), and no row of *User scenarios & acceptance* rests on it.
5. **A case holds that the system's `Notification` is never constructed in the background.** `test/notification-click.test.ts` puts a stand-in that counts its constructions in the place of the page's `Notification`. After the page has kept an entry, the count is 0.
6. **The comments that say what a background start holds back say the notification too:** the head of `src/main/main.ts`, `src/main/background.ts#startsInBackground` and the head of `src/shared/ipc.ts`.

Out:

- **A person's start.** It raises the system's notification as before, from the page, with the same title, body and click.
- **Which changes notify, and what a notification says.** `src/renderer/view.ts` is unchanged.
- **`test/built-app.ts`.** No line of it changes. #149 rewrites its start, and this work needs nothing of the helper (`frame/plan.md` *Overlap with the release*).
- **A bound on the list.** A start in the background is a test's or an agent's and ends with its run, so the list is not trimmed.
- **Other things the system draws for the page.** The page calls none (*Grounding*).

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A test start raises nothing over the owner's screen | Given the built app started with `OWLERY_BACKGROUND=1` and a stand-in that counts constructions in the place of the page's `Notification`. When a pane behind another comes to wait. Then `window.__notifications` holds one entry with the work item's title and the body `Needs you`, and the stand-in counts 0 | The case of *Scope* item 5 in `test/notification-click.test.ts`. Its count is seen red with a `chooseNotifier` that keeps the entry in the background and also calls `system`. A `chooseNotifier` that keeps nothing fails the case earlier, at its wait for the kept entry |
| The cases read what the page would have raised | Given the same start. When a session asks for a call to be allowed, a seal breaks, or a pane waits or finishes. Then each case reads the title and the body from `window.__notifications`, and a call of an entry's `onclick` opens the view as a click on the notification does | The cases of `test/approval-line.test.ts`, `test/ask-section.test.ts` and `test/notification-click.test.ts` that read `window.__notifications`, each file run alone |
| No file replaces the page's `Notification` to keep the system quiet | Given the tree after the build. When the test folder is searched for a replacement. Then only the counting stand-in of *Scope* item 5 is found | `git grep -n 'window.Notification' -- apps/desktop` prints lines of `test/notification-click.test.ts` only. At `5e03a948` it prints the lines *Grounding* lists, each of which a row of *Removes* takes out (executed) |
| A person's start is unchanged | Given `chooseNotifier(false, system)`. When `raise` is called with a title and a body. Then `system` is called once with them, `raise` returns what `system` returned, and the list is empty | A case of the new `test/notifier.test.ts`. The banner on the screen of a person's start is a person's run (`frame/questions.md` Q1) |
| The page raises through one place | Given the tree after the build. When the page's code is searched for the system's constructor. Then one line holds it | `git grep -n 'new Notification' -- apps/desktop/src` prints one line, in `src/renderer/renderer.ts`. At `5e03a948` it prints two lines of that file (*Grounding*, executed) |
| No case puts a list of its own in the place of the page's | Given the tree after the build. When the app's folder is searched for an assignment to `window.__notifications`. Then the page's own is the one found | `git grep -n '__notifications = ' -- apps/desktop` prints one line, in `src/renderer/renderer.ts`. At `5e03a948` it prints the lines *Grounding* lists, each inside a coordinate of *Removes* (executed) |
| A page loaded again still raises nothing | Given the built app in the background and its page reloaded. When a notification would be raised. Then the page keeps it and constructs nothing | `test/screenshots.test.ts` reloads its page with no replacement installed before the load, and `pnpm run screenshots`, the one command under which that file starts the app, passes. The fact reaches the page from the preload at each load (*Scope* item 1) |

## Data & interfaces

- `src/shared/ipc.ts#Channel` gains `background: "owlery:background"`, answered at once and not by a promise, as `appearance` is.
- `src/shared/ipc.ts#OwleryApi` gains `background: boolean`: true where the app was started with `OWLERY_BACKGROUND=1`.
- `src/main/main.ts` answers `Channel.background` with its `background`. `src/preload/preload.ts` reads it with `ipcRenderer.sendSync` and sets `api.background`.
- `src/renderer/notifier.ts`:

  ```ts
  /** What the page sets a click's handler on: the system's notification, or an entry the page kept. The system's calls its handler with the click's event, which the page's handlers do not read. */
  export interface Raised {
    onclick: ((...event: never[]) => unknown) | null;
  }
  /** An entry the page kept where the app started in the background. */
  export interface Kept extends Raised {
    title: string;
    body: string;
  }
  /** Raises the page's notifications, and holds the ones it kept. */
  export interface Notifier {
    raise(title: string, body: string): Raised;
    kept: Kept[];
  }
  export function chooseNotifier(background: boolean, system: (title: string, body: string) => Raised): Notifier;
  ```

  `onclick` takes a handler of any arguments because the system's `Notification` calls its handler with the click's event: a handler typed as taking none is refused by the typechecker where the page hands the system's notification to `chooseNotifier` (TS2322, `trail/phases/phase-1.md` *Decisions*). A handler that takes no argument can be set on both and called on a kept entry.
- `window.__notifications`: the `kept` list, set by the page where `window.owlery.background` is true and absent otherwise. `Window` is declared with it as an optional member beside `owlery` (`src/renderer/renderer.ts:101-105`).

## Rule changes

- change
  file: docs/architecture.md
  section: Screen framework: Electron
  from: An app started with `OWLERY_BACKGROUND=1` opens nothing in the system browser or in Finder and opens no folder dialog, and reads and writes a clipboard of its own in place of the system's.
  to: An app started with `OWLERY_BACKGROUND=1` opens nothing in the system browser or in Finder and opens no folder dialog, and reads and writes a clipboard of its own in place of the system's. Its page raises no system notification, and keeps the title and the body of each one it would have raised, which the cases read.
- change
  file: docs/architecture.md
  section: Screen framework: Electron
  from: check: apps/desktop/test/terminal-basics.test.ts apps/desktop/test/navigation.test.ts apps/desktop/test/links.test.ts apps/desktop/test/paths.test.ts apps/desktop/test/clipboard.test.ts apps/desktop/test/pick-folder.test.ts apps/desktop/test/work-item-form.test.ts
  to: check: apps/desktop/test/terminal-basics.test.ts apps/desktop/test/navigation.test.ts apps/desktop/test/links.test.ts apps/desktop/test/paths.test.ts apps/desktop/test/clipboard.test.ts apps/desktop/test/pick-folder.test.ts apps/desktop/test/work-item-form.test.ts apps/desktop/test/notifier.test.ts apps/desktop/test/notification-click.test.ts
- change
  file: docs/architecture.ko.md
  section: 화면 프레임워크: Electron
  from: `OWLERY_BACKGROUND=1`로 띄운 앱은 시스템 브라우저와 Finder에서 아무것도 열지 않고 폴더를 고르는 대화 상자도 열지 않으며, 시스템의 클립보드 대신 자기 클립보드를 읽고 씁니다.
  to: `OWLERY_BACKGROUND=1`로 띄운 앱은 시스템 브라우저와 Finder에서 아무것도 열지 않고 폴더를 고르는 대화 상자도 열지 않으며, 시스템의 클립보드 대신 자기 클립보드를 읽고 씁니다. 그 앱의 화면은 시스템 알림을 띄우지 않고, 띄웠을 알림의 제목과 본문을 간직해 두며, 테스트는 그것을 읽습니다.
- change
  file: docs/architecture.ko.md
  section: 화면 프레임워크: Electron
  from: check: apps/desktop/test/terminal-basics.test.ts apps/desktop/test/navigation.test.ts apps/desktop/test/links.test.ts apps/desktop/test/paths.test.ts apps/desktop/test/clipboard.test.ts apps/desktop/test/pick-folder.test.ts apps/desktop/test/work-item-form.test.ts
  to: check: apps/desktop/test/terminal-basics.test.ts apps/desktop/test/navigation.test.ts apps/desktop/test/links.test.ts apps/desktop/test/paths.test.ts apps/desktop/test/clipboard.test.ts apps/desktop/test/pick-folder.test.ts apps/desktop/test/work-item-form.test.ts apps/desktop/test/notifier.test.ts apps/desktop/test/notification-click.test.ts
- change
  file: docs/architecture.md
  section: Measure before building
  from: Such a start lacks the Dock icon, the menu bar, the system's focus, the system's pointer and the window on the screen, which is drawn at opacity 0, so a reading that rests on one of them, such as a typed Korean line, the memory of a window kept in front, a pointer passing over the window or what the screen shows of the window, is a run the person makes
  to: Such a start lacks the Dock icon, the menu bar, the system's focus, the system's pointer, the system's notifications and the window on the screen, which is drawn at opacity 0, so a reading that rests on one of them, such as a typed Korean line, the memory of a window kept in front, a pointer passing over the window, a notification the system shows or what the screen shows of the window, is a run the person makes
- change
  file: docs/architecture.ko.md
  section: 만들기 전에 잴 것
  from: 그렇게 띄운 앱에는 Dock 아이콘, 메뉴 막대, 시스템의 포커스, 시스템의 포인터가 없고, 창은 불투명도 0으로 그려져 화면에 보이지 않습니다. 그래서 사람이 친 한글 줄, 앞에 둔 창의 메모리, 창 위를 지나는 포인터, 화면에 보이는 창의 모습처럼 그 다섯 가운데 하나에 기대는 값은 사람이 돌려서 잽니다
  to: 그렇게 띄운 앱에는 Dock 아이콘, 메뉴 막대, 시스템의 포커스, 시스템의 포인터, 시스템 알림이 없고, 창은 불투명도 0으로 그려져 화면에 보이지 않습니다. 그래서 사람이 친 한글 줄, 앞에 둔 창의 메모리, 창 위를 지나는 포인터, 시스템이 띄운 알림, 화면에 보이는 창의 모습처럼 그 여섯 가운데 하나에 기대는 값은 사람이 돌려서 잽니다

## Removes

The work adds one mechanism, the function of *Scope* item 2 with the member that feeds it, and takes out the hand-made replacements below. Each was written because the page had no guard of its own, and each stood only from the moment its file installed it, after the app had started.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The recorder that replaces the page's `Notification` and keeps a title and a body | `apps/desktop/test/approval-line.test.ts:122-130`, with the sentence of its head at lines 15 and 16 | The page keeps the entry itself (*Scope* item 3), and the case at line 264 reads it |
| The recorder that replaces the page's `Notification` and keeps the object with its handler | `apps/desktop/test/ask-section.test.ts:70-82`, with the sentence of its head at lines 8 and 9 | The page keeps the entry with its handler, and the case at lines 185 to 194 reads and calls it |
| The new list a case puts on `window.__notifications` so that it reads its own notifications alone, with the comment above it | `apps/desktop/test/ask-section.test.ts:166-167` | The case takes the length of the page's list at that place and reads the entries after it (*Scope* item 4), at lines 185 to 194 |
| The same recorder | `apps/desktop/test/notification-click.test.ts:79-91`, with the words of its head at lines 2, 3 and 5 that name it | The page keeps the entry. The counting stand-in of *Scope* item 5 takes its place in this file and keeps nothing the cases read as a notification |
| The class that does nothing in the place of the page's `Notification` | `apps/desktop/test/decisions-and-questions.test.ts:145-146`, with the sentence of its head at lines 21 to 23 | Nothing needs to own it: the page constructs no `Notification` in the background |
| The same class | `apps/desktop/test/seal-back-view.test.ts:96`, with the clause of its head at lines 16 and 17 | Nothing needs to own it, on the same ground |
| The same class, installed after the start | `apps/desktop/test/screenshots.test.ts:589-590` | Nothing needs to own it, on the same ground |
| The same class, installed before the page loads again | `apps/desktop/test/screenshots.test.ts:688`, with the clause of the comment at line 687 that says the `Notification` is replaced | The preload tells the page at each load that the app started in the background, so a page loaded again keeps its notifications too |
| One of the page's two constructions of the system's `Notification` | `apps/desktop/src/renderer/renderer.ts:1531` and `:1536` | One construction is left, the `system` the page hands to `chooseNotifier` |

Framed 2026-11-25 by framer, before the build.
