# Implementation Plan: a test start raises no macOS notification

## Technical context

The tree as read at `5e03a948`. Paths without a root are under `apps/desktop/`.

The page raises every system notification in one function, `src/renderer/renderer.ts#takeLists`, at lines 1531 and 1536. Both lines construct `Notification` and set its `onclick`. Nothing between the daemon's message and the constructor reads `OWLERY_BACKGROUND`, because the page cannot: the main process takes the variable out of the environment at `src/main/main.ts:40` and tells the page nothing of it.

Everything else a background start holds back is decided in the main process, by a function that takes `background` and the system's own call and returns who acts: `src/main/links.ts#chooseOpener`, `src/main/paths.ts#chooseFinder`, `src/main/pick-folder.ts#chooseFolderDialog`, `src/main/clipboard.ts#chooseClipboard`. Each imports nothing of Electron and has a case that runs without the app. The work adds the same shape on the page's side, `chooseNotifier`, and one member of `OwleryApi` that carries the fact across, read by the preload with the synchronous message it already uses for the saved appearance (`src/preload/preload.ts:9`).

The cases reach the page through `BuiltApp.evaluate` (`test/built-app.ts`), which evaluates an expression in the page. The page's code is one self-running script (`build.mjs`), so what a case reads has to stand on `window`.

Constraints:

- A case that starts the built app, and `test/daemon.test.ts`, are run one file at a time, with `OWLERY_BACKGROUND=1`, and only after `while pgrep -f 'vites[t]' >/dev/null; do sleep 20; done` returns. Other worktrees run suites on the same machine, and the pseudo-terminals are limited.
- No case of this work starts the app as a person does. Such a start takes the owner's keyboard and, before this work as after it, raises a banner.

Failure scenario of the chosen approach, in six months: a new place of the page constructs `Notification` directly and not through `raise`. A background start then raises a banner again, and no case of that new place fails. The search of phase 1's *Verified by* cell finds it at review, and the comment on `raise` says every notification goes through it. No case can hold a rule about code not yet written.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| The page decides, through `chooseNotifier` and a `background` member of `OwleryApi`, and keeps what it would have raised | The one above: a later direct `new Notification` | Chosen. It is the shape the four background guards of the main process already have, it stops the notification where it is made, for a test's start and an agent's alike, and the kept entries are what the issue asks the cases to read |
| Replace the structure: the main process raises the notifications, with Electron's own `Notification`, and the page sends each one over a channel | A person's notification is then drawn by another API than today's, with its own look, grouping and click, and a click has to travel back to the page to open the view. The cases would read the kept entries through the main process's inspector, which most files do not open | Rejected. The premise that keeps the page as the raiser is `docs/architecture.md` *Screen framework: Electron*, "The window's page raises the notifications" (line 474, read), and the issue's second line, that a person's start is unchanged. Moving the raiser changes what a person sees and nothing in the issue asks for it |
| `BuiltApp.start` installs a recorder in every page it opens | An agent's own start with `OWLERY_BACKGROUND=1`, made without the helper, still raises a banner. The recorder stands only from the moment the debugging port answers, so a notification of the first lists the page takes is not held back, and a reload drops it unless the helper also registers it for new documents. It also edits the start that #149 rewrites | Rejected. The issue's first line is about the page under the switch, not about the helper |
| The main process refuses the `notifications` permission of a background start's session | The page still constructs `Notification`, so the cases need their hand-made recorders to read anything, which the issue replaces. Whether Electron 45.3.3 then draws nothing was not read in its source and would rest on the platform, with no case that could tell the refusal from the platform (contract rule 13) | Rejected |
| The preload replaces the page's `Notification` in the background, from outside the page's own code | It needs a call that runs code in the page's world from a sandboxed preload before the first script, and the recorder becomes a string of code no typechecker reads. The page's code would not say that it raises nothing in the background | Rejected. The typed function with cases of its own costs one member of `OwleryApi` |
| The page passes the fact as an argument of the window, `webPreferences.additionalArguments`, and not by a synchronous message | The preload would parse `process.argv` for a switch, a second way for the main process to tell the preload a fact beside the one the tree has | Rejected for the existing way, `Channel.appearance`'s |
| Keep the entries under a new name and not `window.__notifications` | The three files that read the entries change every expression that reads them, for no change of meaning | Rejected. The name stays, and the page now owns it |
| Add a method to `BuiltApp` that returns the kept entries | It edits `test/built-app.ts`, which #149 rewrites, to wrap one expression | Rejected (*Overlap with the release*) |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1, 2, 3, 5 and 6, and of item 4 the file `test/notification-click.test.ts`, with the rows of *Removes* that name that file and `src/renderer/renderer.ts` | `test/notifier.test.ts`, new: in the background `raise` calls `system` never, keeps the title, the body and an empty handler, and returns the kept entry, so a handler set on it is the entry's; outside the background `raise` calls `system` once and keeps nothing. Each case seen red against a `chooseNotifier` with the branch turned round. `test/notification-click.test.ts` run alone: its cases read `window.__notifications` as the page fills it, and the case of item 5 counts no construction. That case is seen red twice. With the page handing `false` to `chooseNotifier` in place of `window.owlery.background`, the page keeps nothing, and the case fails at its wait for the kept entry. With a `chooseNotifier` that keeps the entry in the background and also calls `system`, the case fails at the count, and that failing line is read for the guard of item 5. `git grep -n 'new Notification' -- apps/desktop/src` prints one line, in `src/renderer/renderer.ts`. | built `426b32be` |
| 2 | Of `frame/design.md` *Scope* item 4 the other five files, with the rows of *Removes* that name them | `test/approval-line.test.ts`, `test/ask-section.test.ts`, `test/decisions-and-questions.test.ts` and `test/seal-back-view.test.ts`, each run alone, one after another, pass with no replacement of the page's `Notification` and none of the page's list. `git grep -n '__notifications = ' -- apps/desktop` prints one line, in `src/renderer/renderer.ts`. `test/screenshots.test.ts` starts the app only under `pnpm run screenshots` (`test/screenshots.test.ts:105`, `:305`), so that command is run once, alone, and passes; a screenshot file it leaves changed is handled as `docs/design.md` states for the command and is named in the phase record. `git grep -n 'window.Notification' -- apps/desktop` prints lines of `test/notification-click.test.ts` only. The sentences of the files' heads that *Removes* names are read at review | built `1a6710aa` |

The whole suite and the repository-wide typecheck are the orchestrator's broad gate, and no phase runs them.

## Overlap with the release

None of the other work items has a frame committed at this reading: each branch holds its `routing.md` alone (`git ls-tree -r --name-only <branch> -- seal/threads`, executed for the five branches). The rows are judged from the issues.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #149, the built-app files share one open app | The six test files of `frame/design.md` *Removes*: this work deletes lines beside each file's `BuiltApp.start` call in `beforeAll`, and #149 changes how those files reach the app. `test/built-app.ts` itself is not changed here. #149 also reloads the page between files, which is the fact this work's page reads at each load | #154 | A replacement installed by a file after its start does not outlive the reload #149 puts between files, so #149 would have to carry each replacement into its new start. With this work merged first the page holds its notifications back by itself, and `window.__notifications` starts empty at each load, which is the state a file sees today. This work is the smaller diff and has no person's row that blocks it, so its seal is likely the earlier |
| #168, two pane-menu cases, and the version | Nothing. #168 changes cases of `test/terminal-basics.test.ts` and moves the version. This work changes neither, and its rule change adds two files to the check line that names `terminal-basics.test.ts` without touching that name | Either | No file and no rule in common |
| #191, the `role:refusal` hand check | Nothing. The hand check starts a role session and reads the daemon's refusal | Either | No file and no rule in common |
| #134, heavy commands wait their turn | Nothing in the issue. Its line "waiting for the machine" is a state of a work item's line, and a notification for it would be raised through `takeLists` like any other | Either | Should #134 add a place that raises a notification, it calls `raise` where this work has merged, and the search of phase 1 names it where it has not |
| #32, caps on agents and worktrees | Nothing in the issue, on the ground of the row above | Either | The same |

## Operational impact

No migration, no new environment variable, no new dependency and no change a person's start shows. `OWLERY_BACKGROUND=1` gains one effect: the page raises no system notification. This pull request does not move the version.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
