# Closing memo: 1795343000-background-window-unseen

## Not verified

| Item | Who must answer |
|---|---|
| closed The suite at this branch's head: the typecheck of every package and the full run, among it the ten files that start the built app and that this phase did not run (`ask-section`, `daemon-restart`, `keep-awake`, `korean-input`, `role-bundle`, `records-dialog`, `role-session`, `work-item-form`, `work-item-menu`, and `memory.test.ts` under `OWLERY_MEASURE_MEMORY` beyond two scenarios). `apps/desktop`'s own typecheck passed at `dd022bb` | answered: the orchestrator's broad gate passed at `eb0dbbf`, the last run of this work item's `trail/gate.md` and the commit its sealer sealed |
| closed A window at opacity 0 keeps its page visible and drawing under a window over it, on GitHub's macOS runner and on another macOS than 26.6. Measured once on the owner's Mac, under a Google Chrome window | answered: the `check` workflow passed on pull request #153 at the head it merged from |
| closed A start of the app without `OWLERY_BACKGROUND` is unchanged: its window is shown at full opacity, takes the focus and receives the mouse. Held by reading `main.ts:152` alone; no such start was made, because it draws a window over the owner's screen | re-homed to issue #48, under "Rows carried here by the settle of release 0.0.2" |
| closed The files that start the built app, other than `work-item-form.test.ts`, after phase 2 changed the handler of `Channel.pickFolder` in `src/main/main.ts`, which each of them builds. Phase 2 ran `pick-folder.test.ts` and `background.test.ts` alone, by the owner's test rule of 2026-11-22, and `apps/desktop`'s typecheck. The fix pass of round 2 ran `work-item-form.test.ts` once under `OWLERY_BACKGROUND=1` at `7ef8dfb`, and its 8 cases passed. Among them is the case that holds the handler: it replaces the system's dialog in the main process, asks for a folder through `window.owlery.pickFolder()`, the call the Browse button makes, and expects no folder and no dialog opened. No case clicks the button itself | answered: the orchestrator's broad gate passed at `eb0dbbf`, the last run of this work item's `trail/gate.md` and the commit its sealer sealed |
| closed A person's Browse click still opens the system's folder dialog as a sheet of the window. Held by the second branch of `pick-folder.test.ts` *chooseFolderDialog* and by reading the handler; no start without the switch was made, because it draws a window over the owner's screen | re-homed to issue #48, under "Rows carried here by the settle of release 0.0.2" |

## Not done

nothing
