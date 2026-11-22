Part of #117. The issue closes when `release/v0.0.2` reaches `main`.

Three cases of the built app failed on some runs, and #30 put a retry on GitHub's runner to keep them from turning a pull request red. This finds the cause of two of them, and the most likely cause of the third, fixes each, and removes the retry. The `check` runs on the runner passed all 35 files with no retry: 44998865255 at `180b223`, and 45001211978 at `a002e5d` after the review's fixes.

| Case | What made it fail | Fix |
|---|---|---|
| `work-item-menu.test.ts`, the Open in submenu's pointer case | Not a slow page: it held at eight-fold CPU throttling. Between its two pointer moves the case made three round trips through the debugging port, which raced the submenu's 300 ms pause | The two moves arrive in one task of the page. The pause after them is measured with the page's clock against `SUBMENU_LEAVE_MS`, and the constant's value is pinned |
| `terminal-basics.test.ts`, the worktree link case | The pointer arrived before the pane's output was drawn. xterm's linkifier looks for a link only when the pointer enters a row, and does not look again under a resting pointer (`node_modules/@xterm/xterm/src/browser/Linkifier.ts`) | `comeOnto` brings the pointer back every 2 seconds until the link shows, for up to 15 seconds. The clear-screen case's "no link" reads move after the replay is drawn |
| `terminal-basics.test.ts`, the link card case at line 608 | The evidence points to the person's own pointer: a window started in the background opens at the centre of the screen, under the cursor, and its page received the real pointer's `mousemove`. One OS mouse move posted to the app reproduced the failure, while twenty-fold CPU throttling and load averages of 52 to 91 did not. No failing run was caught with a pointer moving | A window started under `OWLERY_BACKGROUND=1` ignores the mouse (`src/main/background.ts#showInBackground`, Electron's `setIgnoreMouseEvents(true)`). A person's start is unchanged. The card's 300 ms show and 200 ms leave are measured with the page's clock, and their values are pinned |

**#117's first *Done when* line is answered by the cause found, not by a slow page.** The line asked what makes two pointer moves take over 300 ms on the runner's first start; the time was in the case's round trips through the debugging port, which the fix removes. Judged by the orchestrator on 2026-11-22.

**What it changes for an agent.** An agent that drives a background window through the debugging port, as the suite does, is unaffected. A tool that clicks the screen itself would now click through such a window, as `docs/architecture.md` *Measure before building* states.

**The retry is gone.** `apps/desktop/vitest.config.ts` no longer retries a failed case on the runner, and the bullet of #30's changelog fragment that described the retry is removed, since release 0.0.2 never ships it (`docs/roadmap.md` *Releases and the tracker*).

Not verified:

- **Whether a person's real pointer passing over the window caused the failures of 2026-11-21 and 2026-11-22.** The owner answers it.
- **Whether a person's real pointer passing over a background window now reaches nothing in its page.** One OS mouse move posted to the process still raised the window's leave event once (`trail/phases/phase-1.md`), so how the system reads `setIgnoreMouseEvents` for a real pointer is not verified. The owner answers it, by moving the pointer over a test window while the suite runs.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
