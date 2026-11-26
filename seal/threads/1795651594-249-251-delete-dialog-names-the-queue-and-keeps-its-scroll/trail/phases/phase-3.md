# Phase 3: 1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll

## What this phase found

**The frame holds for this phase.** Before the build, the delete view of `apps/desktop/test/screenshots.test.ts`, its constants and the scene that makes the work item "Rename the settings file" were opened at `b4dcc8e4`. The work item is a `shell` work item of `WORK_ITEMS`, so it holds a shell pane. The run asks `ASKED_TO_WAIT` in it after it sets the cap on agents, so that session waits. `drawSessions` draws each section as a `section` holding an `h3` and the lines' `li`, which is what the view's wait reads. *Scope* item 10 and the `add` operations of *Rule changes* describe what the view now does.

**Decisions settled in the code.**
- The view's wait reads the sections under `#delete-sessions`, each head with its lines, and compares them with `QUEUED_SESSIONS` as JSON. That is the form the built-app case of `machine-dialog.test.ts` reads the same sections in. The shell pane's line is "Shell", and the waiting session's line is "Asked: " and its prompt, with no work item's title, since the dialog names one work item.
- The comment at the head of the file, which says what the delete view waits for, now names both sections. The `add` operations of *Rule changes* stay for the settle. This work item's subject is the code, so this phase does not write them into `docs/design.md` or `docs/design.ko.md` (`skills/implement/SKILL.md` *Document layout — two roots, three lifetimes*).
- The screenshot run wrote into a folder under the crafter's scratch, through `OWLERY_SCREENSHOT_DIR`, and not into `apps/desktop/screenshots/`. Only its six `*-delete.png` files were copied into this work item's `screenshots/`.

**Q3: the delete dialog still fits the 900px window** (`read`, from the six shots). In each shot the dialog stands centred, from about y 30 to y 870. Every section stands in it whole, the two session sections among them, and so do "Force delete", Cancel and Delete. The dialog shows no scroll bar of its own. Only the commits' list scrolls, as it did before this work. No section is cut out of the shot. The dialog's styles give it no height of its own (`index.html`, the rule `dialog`), so the bound is the browser's own maximum for a modal dialog. The margin to that bound was worked out from the shot and was not measured.

**Seen red** (contract rule 15, `executed`). The view's new wait was shown red with only its guard removed, through `seal mutate` on `apps/desktop/src/renderer/renderer.ts`. The mutant gives `sessionSections` every session as running and none as waiting, as the dialog drew them before this work. The call's baseline is the screenshot run of the *Verified by* cell, so one command made both runs:

```
OWLERY_BACKGROUND=1 OWLERY_SCREENSHOT_THEMES=all OWLERY_SCREENSHOT_DIR=<scratch> seal mutate apps/desktop/src/renderer/renderer.ts --replace "  const sections = sessionSections(named);" "  const sections = sessionSections({ running: [...named.running, ...named.queued], queued: [] });" --tests "pnpm --filter @owlery/desktop run screenshots" --timeout 1800
```

- The baseline passed and wrote 78 PNG files. These are 13 views in 2 appearances of 3 themes, the six `*-delete.png` files among them.
- The mutant read `red` (exit 0, 103 s). Its run failed at the wait of its first delete view, in Night watch dark, with "the window never showed the delete dialog of Rename the settings file, … its shell pane under "Running sessions that end", and its session that waits for the machine under "Sessions waiting for the machine that leave the queue"". That is the guard the wait names.
- The mutant's run wrote the twelve Night watch dark views before the delete view again, into the same folder. It failed before the delete view's capture, so the six delete files are the baseline's. Their times on disk say the same: the twelve views are later than the baseline's `night-watch-dark-delete.png`, and the six delete files are not.
- `seal mutate` restored `renderer.ts` from the bytes it read, and `git status --short` then listed only the changelog fragment, which was not committed yet.

**The narrow run** (`executed`): `cd apps/desktop && node scripts/test-in-electron.mjs test/screenshots.test.ts`, without `OWLERY_SCREENSHOTS`, after the edit and before its commit: exit 0, 7 cases passed and the run's case skipped. `npx tsc --noEmit -p .` in `apps/desktop` exited 0 before that commit. This phase changed one test file and no file of the app, so no other test file reads a path it changed.

**Constraints met while running.** Each run went through the machine's lock, which the orchestrator gave after the spawn and which waits while another agent's run holds it. The screenshot run waited there for another run to end before it started. Every start of the app set `OWLERY_BACKGROUND=1`.
