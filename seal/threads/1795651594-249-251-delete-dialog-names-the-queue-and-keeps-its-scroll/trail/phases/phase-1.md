# Phase 1: 1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll

## What this phase found

**The frame holds against the tree, with two gaps in what it listed.** Before the build, every coordinate that `frame/design.md` *Grounding* and `frame/plan.md` *Technical context* name for this phase was opened at `11e39c8b`. Its `apps/` and `docs/` are those of `ea8126b5` (`git diff --quiet ea8126b5 11e39c8b -- apps docs`, exit 0). That covers `view.ts:982-1072`, `namedLines` and `lossParts`, the four `show…` functions, the session dialogs' markup and the cases. Each matched what the frame says of it. The two gaps:

- `headlessRuns` has two more readers in `view.ts`, the account checks at `:3022` and `:3109` (line numbers at `11e39c8b`). So it stays, as the second row of *Removes* allows. `runningIn` no longer reads it. It now selects `working` and `queued` apart.
- `view.test.ts` held a fifth pin of the old shape, outside the three `describe` blocks *Grounding* names. It is the sign-in pane's case, `runningSessions([LOGIN], [], [signIn], [], KINDS)`, at `view.test.ts:4716` at HEAD. The narrow run after the build failed on it alone. It now reads `{ running: ["Shell"], queued: [] }`. The class was then listed by its cause. Each pin reads the answer of `runningSessions`, `archivalOf` or `removalOf`, whose shape changed. `git grep -n -E "runningSessions\(|archivalOf\(|removalOf\("` over `apps/desktop/src` and `apps/desktop/test` listed the three functions, their callers in `renderer.ts` and the cases of `view.test.ts`, and no other file.

**Departure: `#remove-work-items` draws through `namedLines`, not through the sections' function.** The third row of *Removes* lands `showRemove`'s local `list` in "the one function that draws a session dialog's sections". That local function drew two lists, and only `#remove-sessions` is a session list. So `#remove-sessions` draws through `drawSessions`. `#remove-work-items` keeps its head "Work items that leave the lists" in the markup, and its lines go through `namedLines`, as `showDelete` and `showDaemonEnding` already drew their lists. The grounds are in `frame/design.md` *Data & interfaces*: `sessionSections` holds the two heads of sessions and no other. The copy of the row-building code is gone from both functions, which is what the row asked for.

**Decisions settled in the code.**
- `drawSessions(id, named)` in `renderer.ts` is the one function, and the four `show…` functions call it. It hides the container where `sessionSections` gives no section. Each section is a `section` holding an `h3.caption` and a `ul.named` from `namedLines`, so the styles `dialog section`, `dialog section h3` and `dialog section .named` apply as before. No style changed. Each container is a `div` that keeps the old section's id.
- `running.headless` lists the working sessions' ids, then the waiting ones'. The order carries nothing: the daemon's `runningTold` checks each id with `includes` (`daemon.ts:2045` at HEAD).
- `archive` in `renderer.ts` sends at once only where `sessionSections(told.sessions)` is empty. So an archive whose only session waits still opens its dialog first, as *Scope* item 3 asks. No case holds this decision: the archive cases of `work-item-menu.test.ts` hold a live pane, and no unit case reaches the renderer. `gaps.md` *Not verified* holds it.
- The built-app case stands in the queue's `describe` of `machine-dialog.test.ts`, after the Machine dialog's case. It reads the queue that case leaves: the held session works, and the second one waits. So it cannot run alone. The `describe`'s title now names the delete dialog as well. The case opens the menu by a right press on `#repositories button[data-work-item="1"]` and presses "Delete", as the screenshot run's delete view does.
- `docs/design.md` and `docs/design.ko.md`, the row "The delete dialog": the three sentences of *Data & interfaces* that state *Scope* item 1 stand before its last sentence. The fourth sentence, on the kept lists, is phase 2's. The Korean edition calls the state "기계를 기다리는", the word `docs/design.ko.md` already uses for the Machine dialog's queue.
- *Rule changes* writes the sentence of `docs/architecture.md` *Overall layout* and its `check:` line for the settle. This phase does not edit them.

**The search of the Verified by cell** (`executed`): `git grep -n 'Running sessions that end' -- apps/desktop/src/renderer/index.html` printed nothing and exited 1, after `acb1d227`.

**Seen red** (contract rule 15, `executed`):
- The rewritten and new cases of `view.test.ts` ran against the tree's `view.ts` before it changed, which is `ea8126b5`'s. Twelve failed: the three `removalOf` cases, the four `archivalOf` cases, the two `sessionSections` cases and the three `runningSessions` cases. The other 540 passed.
- The sign-in pane's case was rewritten after that run, so it was not seen red against the old `view.ts`. Its line reads the shape `{ running, queued }`, which `ea8126b5`'s `runningSessions` does not answer, and its old expectation failed against the new code.
- The built-app case was shown red with only its guard removed, through `seal mutate` on `renderer.ts`. The mutant drew one section headed "Running sessions that end" over both kinds of line, as the old dialog did. The case failed at its read of the sections, which received the one head over both prompts. The Machine dialog's case passed in the same run.

**Mutation runs** (`seal mutate`, each `red`, exit 0, `executed`). Each `view.ts` run used `node scripts/test-in-electron.mjs test/view.test.ts`. The cases named are the ones that failed:
- `sessionSections` without its `filter`: the case "gives no section for a kind that holds no line…".
- The queue's head made "Running sessions that end": both `sessionSections` cases.
- `runningIn` with `queued: []`: the waiting-session cases of `removalOf`, `archivalOf` and `runningSessions`.
- `runningIn` with `asked` selecting through `headlessRuns`, the old mix: the same three cases.
- `archivalOf` sending only the working sessions' ids: its waiting-session case.
- `removalOf` sending only the working sessions' ids: its waiting-session case.
- `runningSessions` without the waiting sessions of no listed work item: its waiting-session case.
- `renderer.ts`, `drawSessions` given one section over both kinds, against `test/machine-dialog.test.ts -t 'in the Machine dialog and the delete dialog of the built app'`: the new built-app case.

`git status --short` printed nothing after each run.

**Constraints met while running.** The worktree had no `node_modules`, and `pnpm install` ran once before the first test (exit 0). This phase also ran `npx tsc --noEmit -p .` in `apps/desktop` before the commit, as `skills/implement/SKILL.md` asks of the files a commit changes (exit 0). The repository configures no linter and no formatter. Its tree-wide test file for `docs/design.md`, `docs/design.ko.md` and `index.html` is `test/themes.test.ts`, which reads all three, so it joined the phase-end batch.

**For phase 2.**
- `drawSessions` is the one place where a session dialog's sections are drawn. The helper of *Data & interfaces* belongs around its `replaceChildren`.
- The sections' lines are new arrays at each draw: `archivalOf`, `removalOf` and `runningSessions` build them anew. A comparison by `Object.is` of the arrays themselves would differ at every draw. So the values compared there are the heads and each line as strings.
- `#remove-work-items` now replaces its `ul` at each draw with a new one from `namedLines`, as `#delete-sessions` and `#daemon-sessions` did before this phase.

**No unit was only renamed or moved.**
