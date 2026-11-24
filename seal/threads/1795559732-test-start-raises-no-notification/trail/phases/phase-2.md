# Phase 2: 1795559732-test-start-raises-no-notification

## What this phase found

Built at `23167047`, with a comment corrected at `1a6710aa`. Paths without a root are under `apps/desktop/`.

### The frame against the tree

The frame holds for phase 2, with two small departures and one premise that does not hold. Each *Removes* row of the five files was opened at `a69957e4` before the first edit.

1. **Two *Removes* ranges end one line early.** The recorder of `test/approval-line.test.ts` runs from line 122 to line 130, not 129, and that of `test/ask-section.test.ts` from line 70 to line 82, not 81. In each file the last line is the `})()` that closes the expression. The build removed the whole call in both files.
2. **The count of `test/ask-section.test.ts` guards nothing at this tree.** `frame/design.md` *Scope* item 4 has the case take the length of the page's list before its requests and read the entries after it. The build does so. But the page's list is empty when that case begins: the two cases before it raise no notification. A `seal mutate` run that replaces the count with `0` left the file green (below). The count is kept as the frame states it, so a notification raised by an earlier case later does not break this case. It holds nothing today, and no case can show it red until an earlier case raises a notification.
3. **The head sentences.** *Removes* names the sentence of each head that says the page's `Notification` is replaced. In `test/approval-line.test.ts` and `test/ask-section.test.ts` that sentence was replaced, not only removed, because those files read the notifications: each head now says the page raises nothing of the system's in the background and keeps each notification in `window.__notifications`. In `test/decisions-and-questions.test.ts` and `test/seal-back-view.test.ts` the sentence was removed, because nothing in those files reads a notification. The comment above the reload in `test/screenshots.test.ts` now says the preload tells the reloaded page again that the app started in the background, which is where its *Removes* row says the replacement's work lands.

### Why `test/approval-line.test.ts` passed in phase 1 with its recorder still in place

Phase 1 asked this (`trail/phases/phase-1.md` *Runs at the phase boundary*). The answer is the order of two assignments. `BuiltApp.start` returns once the page's debugging target answers, before the page's own script has run. So the recorder's `window.__notifications = []` ran first. Then the page's script ran and put its own kept list on `window.__notifications`, which replaced the recorder's. The page never called the recorder, because a background start calls no `system`, and the case at line 264 (256 after this phase) read the page's list. `test/ask-section.test.ts` broke because its line 167 put a new list there in a later case, after the page had loaded, and nothing replaced it again.

A `test_tmp_*` probe established this (executed). It started the built app in the background with a script shell, as the files do. Right after `BuiltApp.start` it read `document.readyState` as `loading` and found no `__notifications` on `window`. It then put a list of its own there, waited for a screen in front, and found `window.__notifications` was no longer that list. The probe ran twice, because the first run's output was not printed by the runner. It wrote its result into the phase's scratch on the second run. The probe file was removed after that run.

### Reds

The changed files add no behaviour: they drop replacements and read the page's list in place of their own. The red shown is that, with no replacement installed, the cases that read a notification now read the list the page fills and no other.

| Mutation | Run | Result |
|---|---|---|
| `src/renderer/notifier.ts`: the kept entry is not pushed onto `kept`. Nothing reaches `system` either, so no banner can appear | `test/approval-line.test.ts` and `test/ask-section.test.ts`, one command | red. `test/approval-line.test.ts:256`, `expected [] to deeply equal [ 'Gamma' ]`. `test/ask-section.test.ts:173`, "the window never showed a notification for each request" |
| `test/ask-section.test.ts`: the count taken before the requests is replaced with `0` | `test/ask-section.test.ts` | green: the mutant survived. Item 2 of *The frame against the tree* says why |

Each `seal mutate` run restored its file from its held copy, and `git status` showed no change to a tracked file after each.

### Runs at the phase boundary

All with `OWLERY_BACKGROUND=1`, after the wait for other suites, at `23167047`.

- One command over `test/approval-line.test.ts`, `test/ask-section.test.ts`, `test/decisions-and-questions.test.ts`, `test/seal-back-view.test.ts` and `test/screenshots.test.ts`. `vitest.config.ts` runs these built-app files one at a time. 5 files passed, with 18 cases passed and 1 skipped. The skipped case is the screenshot run, which starts the app only under `pnpm run screenshots`. The same command was run a second time to list each case by name, and passed the same way.
- `pnpm run screenshots`, alone, with `OWLERY_SCREENSHOT_DIR` naming a folder of the phase's scratch. It passed, with 1 case passed and 7 skipped, and wrote 22 PNG files, one per view in Night watch's dark and light appearances. No screenshot file was left in the tree, so no file was handled under `docs/design.md` *A pull request that changes the window carries its screenshots*.
- The five changed test files were typechecked with the repository's `tsconfig.json`, narrowed to those files, before the commit. `tsc` exited 0.
- `1a6710aa` changes one comment of `test/ask-section.test.ts`, which said the page's list already holds earlier cases' notifications. The surviving mutant shows it holds none there, so the comment now says the list keeps whatever an earlier case raised. Only `tsc` over the five files was run after it, and it exited 0. The boundary runs above were not repeated for a comment.

`test/notification-click.test.ts`, `test/notifier.test.ts` and the other files that start the built app were not run in this phase. Phase 2 changed none of the paths they read. `gaps.md` *Not verified* names who runs them.

### Census

- `git grep -n 'window.Notification' -- apps/desktop` prints `test/notification-click.test.ts:83` alone, the counting stand-in (executed).
- `git grep -n '__notifications = ' -- apps/desktop` prints `src/renderer/renderer.ts:113` alone, the page's own (executed).
- `git grep -n 'new Notification' -- apps/desktop/src` prints `src/renderer/renderer.ts:112` alone (executed).
- `git grep -n 'addScriptToEvaluateOnNewDocument' -- apps/desktop` prints `test/theme-controls.test.ts:137` alone, which installs no notification (executed).
