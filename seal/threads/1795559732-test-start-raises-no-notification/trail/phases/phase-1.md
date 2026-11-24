# Phase 1: 1795559732-test-start-raises-no-notification

## What this phase found

Built at `426b32be`. Paths without a root are under `apps/desktop/`.

### The frame against the tree

The frame holds for phase 1. Each coordinate the build rests on was opened at `3c631626` before the first edit, and each matched: the two constructions at `src/renderer/renderer.ts:1531` and `:1536`, the `Window` declaration at `src/renderer/renderer.ts:101-105`, the preload's synchronous read at `src/preload/preload.ts:9`, the main process's answer to it at `src/main/main.ts:193-195`, `takeBackground` at `src/main/main.ts:40`, and the recorder of `test/notification-click.test.ts:79-91`.

Two statements of the frame do not hold, and phase 1 was built to the part that holds:

1. **The red the plan names for the case of *Scope* item 5 does not fail at the count.** `frame/plan.md` *Phases*, row 1, says the case is seen red with the page handing `false` to `chooseNotifier`, and that its failing line is the count. With `false` the page hands each notification to the stand-in and keeps nothing. The case therefore fails first at `test/notification-click.test.ts:113`, the wait for one kept entry, with "the window never showed a notification", and never reaches the count at line 115. That red was run and is recorded below. The count line was shown red by a second mutation that removes the count's own guard alone: `chooseNotifier` keeps the entry in the background and also calls `system`. The case then fails at line 115 with `expected 1 to be +0`.
2. **The *Removes* row of `test/ask-section.test.ts` leaves out a line that breaks once the page owns the list.** The row names lines 70 to 81 and the head's lines 8 and 9. Line 167 of that file, `window.__notifications = []`, puts a new list in the place of the page's own. The page keeps on filling the list it put there at load, so the case waits at line 185 for entries in a list nobody fills. At `426b32be` the file fails at line 185 with "the window never showed a notification for each request" (executed, in the boundary run below). Phase 2 owns the file by the plan, and its build has to change line 167 as well as the recorder: for example, the case can read the entries after a count it takes at line 167 in place of a new list. Recorded in `gaps.md` *Not verified* with phase 2 as its answerer.

### Decisions

| Decision | Grounds | Judged against |
|---|---|---|
| `Raised.onclick` is typed `((...event: never[]) => unknown) \| null`, not `(() => void) \| null` | With the frame's type the typechecker refuses the page's `system`: the DOM's `Notification.onclick` takes the click's event, and a function that takes an argument is not assignable to one that takes none (TS2322). The wider type accepts the system's notification and an entry the page kept, and a handler with no argument can still be set on both and called on a kept entry | `frame/design.md` *Data & interfaces*: "The exact types are the build's to settle against the typechecker" |
| The return type of `chooseNotifier` is named, `Notifier` | Its two members carry a comment each, the one on `raise` saying every notification of the page goes through it, which `frame/plan.md` *Technical context* names as the guard against a later direct construction | `frame/design.md` *Data & interfaces*; `frame/plan.md` *Technical context*, the failure scenario |
| The count of *Scope* item 5 is an assertion added to the first case of `test/notification-click.test.ts`, whose name now says the page raises nothing of the system's, and the stand-in counts into `window.__constructed` | The scenario table's first row gives that case's Given, When and Then: the pane behind another comes to wait, one kept entry with the title Alpha and the body `Needs you`, and a count of 0 | `frame/design.md` *User scenarios & acceptance*, row 1 |
| The preload reads the main process's answer as `=== true` | A value that is not `true` reads as a person's start, which raises the notification as before. That is the direction `frame/design.md` *Scope*, out, keeps | `frame/design.md` *Scope*, out, "A person's start" |
| The renderer's head comment names `./notifier` beside the other modules it names | The head lists where each of the page's concerns lives | the existing head of `src/renderer/renderer.ts` |

### Reds

Each new case and the changed case were seen red before they were counted:

| Case | How it was shown red | Failing line |
|---|---|---|
| The three cases of `test/notifier.test.ts` | Run before `src/renderer/notifier.ts` existed | The import: "Cannot find module '../src/renderer/notifier'" |
| The three cases of `test/notifier.test.ts` | `seal mutate`, the branch turned round (`if (background) return system(...)`) | All three fail |
| Case 1 (keeps, returns the kept entry, never calls the system's) | `seal mutate`, the system's called after the entry is kept | Case 1 alone fails, at `expect(handed).toEqual([])` |
| Cases 1 and 2 (the handler set on what `raise` returned is the kept entry's) | `seal mutate`, `raise` returns a new object with the entry's members in place of the kept entry | Cases 1 and 2 fail |
| Cases 1 and 2 | `seal mutate`, the entry is not pushed onto `kept` | Cases 1 and 2 fail |
| Case 3 (outside the background, keeps nothing) | `seal mutate`, an entry kept beside the call of `system` | Case 3 alone fails, at `expect(notifier.kept).toEqual([])` |
| Cases 1 and 2 of `test/notification-click.test.ts` | Run against the renderer before the change, with the counting stand-in in place | Lines 111 and 135, `window.__notifications` is undefined |
| Cases 1 and 2 of `test/notification-click.test.ts` | `seal mutate` on `src/renderer/renderer.ts`, the page hands `false` to `chooseNotifier` (the plan's red) | Line 113 and the second case's wait, "the window never showed a notification" |
| Case 1 of `test/notification-click.test.ts`, the count | `seal mutate` on `src/renderer/notifier.ts`, the system's called after the entry is kept | Line 115, `expected 1 to be +0` |

Every `seal mutate` run restored its file from its held copy, and `git status` was clean after each.

### Runs at the phase boundary

One command at `426b32be`, with `OWLERY_BACKGROUND=1`, after the wait for other suites: `test/notifier.test.ts`, `test/background.test.ts`, `test/notification-click.test.ts`, `test/approval-line.test.ts`, `test/ask-section.test.ts`, `test/decisions-and-questions.test.ts` and `test/seal-back-view.test.ts`. The unit files ran in parallel and the app files one at a time, as `vitest.config.ts` runs them. Six files passed, and `test/ask-section.test.ts` failed at line 185, as the second item of *The frame against the tree* says.

The set is narrower than the files that read a changed path. Every file that starts the built app loads the changed preload and page. The four phase-2 files were run because their replacements meet the page's new list. The other files that start the app were not run, and `gaps.md` *Not verified* names who runs them.

`test/approval-line.test.ts` passed with its recorder still installed, and its case at line 264 read a kept entry titled Gamma. Why its line 123, which also puts a new list in the place of the page's, did not detach it was not established. Phase 2 removes that recorder.

### Census

- `git grep -n 'new Notification' -- apps/desktop/src` prints one line, `src/renderer/renderer.ts:112`, the `system` the page hands to `chooseNotifier` (executed).
- `git grep -n 'window.Notification' -- apps/desktop` prints `test/notification-click.test.ts:83`, the counting stand-in, and the six lines of the five files phase 2 owns: `test/approval-line.test.ts:124`, `test/ask-section.test.ts:73`, `test/decisions-and-questions.test.ts:146`, `test/screenshots.test.ts:590`, `test/screenshots.test.ts:688` and `test/seal-back-view.test.ts:96` (executed).
