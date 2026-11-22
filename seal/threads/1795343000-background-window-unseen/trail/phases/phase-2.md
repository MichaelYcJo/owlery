# Phase 2: 1795343000-background-window-unseen

## What this phase found

**The phase was run as the fix pass of review round 1, and its closes stand in `trail/rounds/round-1.md`.** Its findings 1, 2 and 3 are this phase's *Scope* items 4, 2 and 5. Judged against `frame/design.md` *Scope* and round 1's paste-ready fixes, which were applied as written.

**The case of `chooseFolderDialog` was seen red with the background branch removed (executed).** With `if (background) return …` absent from the function, `pick-folder.test.ts` failed at `:31`: "expected '/r/project' to be null". `seal mutate` on the committed guard gave three mutants, three red and none survived (executed): the branch removed, the condition flipped, and the stand-in answering a folder.

**The sweep of the channel's statements found one more line.** `apps/desktop/src/shared/ipc.ts:70`, the comment of `OwleryApi.pickFolder`, said the call opens the native dialog, and it now says a background start opens none. The census was a sample: `git grep -i` outside `seal/` for "folder dialog", "opens nothing", "four things", "lacks four", "draws nothing" and "Browse" (the fix pass's hand-back, as the orchestrator received it). Only `ipc.ts:70` was corrected. The other lines on the folder dialog, `src/main/pick-folder.ts:1` and `:19` and `src/shared/ipc.ts:3`, hold for a background start. The rest state the window, the browser's and Finder's stand-ins, or other subjects, "Browse" matching inside "browser" among them.

**The files that start the built app were not run in this phase.** Each of them builds `src/main/main.ts`, whose handler of `Channel.pickFolder` this phase changed. No case clicks Browse. `gaps.md` names the orchestrator to answer them at the broad gate.

**This record was written by the orchestrator from the fix pass's hand-back and round 1's closes**, after review round 2 found the plan's phase 2 Status filled and no record of it (round 2, finding 1).
