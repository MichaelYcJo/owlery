# Implementation Plan: the app opens on the inbox, not on a pane of terminals

## Technical context

The tree as read at `12cd34f`, and the window's code of issue #8 at `d3bc681` (`frame/design.md` *Grounding*).

`apps/desktop`: the window is three files in `src/renderer/`. `index.html` holds the page and its styles: a top bar, the terminal's stage and a side panel. `renderer.ts` holds the connection to the daemon, the terminals, and every element the page gains after load, built by hand with `document.createElement`. `view.ts` holds what the window says and decides as pure functions, and `test/view.test.ts` holds their cases. No case loads the page: the tests run with vitest in Electron's Node (`pnpm run test`), and `renderer.ts` is shown by a drive of the built app. `build.mjs` bundles `renderer.ts` and copies `index.html` and xterm's stylesheet into `dist/`. `src/main/main.ts` opens the one window.

Three facts of the present window shape the build.

- **Every pane is made at `ready`.** `renderer.ts#onMessage` attaches each live session, and starts a pane of the first kind where none is alive. The inbox screen needs neither, and the daemon sends a session's output only to a client that started or attached it, so a window that attaches nothing receives no output.
- **A terminal is sized where it is displayed.** `renderer.ts#newTerminal` fits the terminal before the window sends `start` or `createWorkItem` with its columns and rows. `@xterm/addon-fit` 0.11.0 resizes nothing while the terminal's parent is not displayed. A creation sent from the inbox screen therefore carries xterm's default size, and the fit when the view is shown sends the real one through `term.onResize`, which `renderer.ts#adopt` wires before it shows the pane.
- **The "Ask" section of issue #8 reads the pane in front.** At `d3bc681`, `view.ts#workItemInFront` gives the work item "Ask" asks in, and the list shows every headless session of every work item. The daemon's `ask` needs a work item and no pane.

The drive needs a run folder with a short path: with a long one the daemon exits at once (issue #19), and Electron's `--user-data-dir` chooses the folder (`trail/phases/phase-2.md` of `1795042041-headless-session` at `d3bc681`).

**The failure scenario of the chosen approach.** The window stays hand-built DOM that redraws a whole list at every `inbox`. Milestone 2 adds the approval line and the back of the seal, milestone 3 the question screen and milestone 4 a diff view, and each new screen adds a branch to `renderer.ts` that no case reads. A redraw of the inbox while a person tabs through it drops the keyboard's place. Three smaller costs stand from the first day. Which view is open lives in the page, so the reload after the daemon went away returns the person to the inbox. A headless answer that arrives while the inbox is in front shows nowhere until its work item is opened. A terminal made for a view stays in memory, hidden, for the window's life, until issue #9 decides otherwise.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Keep one screen and swap the proportions: the inbox as a wide column beside a terminal | A terminal is still on the first screen, and the first impression stays a terminal app with a list beside it | Rejected: the issue's first two done criteria ask for the inbox at full width and no terminal on its screen |
| Replace the hand-built page with a UI framework and a page test stack, now | A dependency, a build step and a test environment arrive for two screens; the tests run in Electron's Node with no page, and a page for them is the dependency the work items frame refused (`seal/threads/1795016925-work-items/gaps.md` *Not done*) | Rejected for now, as an equal of the row below |
| Keep the hand-built page, with the decisions in `view.ts` | The scenario of *Technical context*: each later screen grows `renderer.ts` where no case reads | Chosen. The premise that keeps it, checked: the places where `renderer.ts` builds elements are few (`frame/design.md` *Grounding*, the count of `createElement`), this work adds two screens of lists and a header, and `docs/architecture.md` *Conclusions* keeps the UI a thin shell so that a move stays cheap. The frame of milestone 2's first screen weighs the replacement again |
| Remove the pane without a work item from the daemon and the protocol too | The window can no longer make one, so the path stays in the daemon unused. A session with no work item that an older daemon still holds has no tab in the new window and keeps that daemon alive until its process ends | Rejected here: most `start` messages in `test/daemon.test.ts` carry no work item (`frame/design.md` *Grounding*, the count beside `createElement`'s), so the removal rewrites the daemon's session cases, which the issue does not ask for. Named as a follow-up in the hand-back |
| Keep the pane without a work item in the daemon and the protocol | The same unused path, kept | Chosen with the row above: the issue's third done criterion is about what the window offers |
| Keep the list of hook events, behind a control or inside a work item's view | A debugging surface stays in the product's window, and its lines mean nothing to a person who hands work off | Rejected: `seal/threads/1795012146-claude-code-hooks/gaps.md` *Not done* names the list as what stood in for the inbox. The premise for removing it, checked: `src/daemon/main.ts` writes each hook's name and field names to `daemon.log` under `OWLERY_DEBUG_HOOKS=1` |
| Dispose of a view's terminals when the inbox returns, and attach again at the next visit (`docs/architecture.md` *Memory design*, row 1) | The daemon keeps sending a detached pane's output, since the protocol has no `detach`. Each return replays up to 256K characters cut at a character, which can start inside an escape sequence (`seal/threads/1795015072-daemon/gaps.md` *Not done*) | Rejected here: issue #9 measures the visible terminals and owns the rule. This work makes no terminal before its pane is first in front, which today's window does not hold to |
| Start a pane of the first state-reporting kind when a view opens on a work item with no live pane, as a pressed line does today (`view.ts#paneToOpen`) | A person who opens a work item to read its state or to ask starts an agent's CLI by looking | Rejected: opening a view starts nothing, and the pane kinds' buttons are in the view. The cost is one more press after a restart |
| Keep "Ask" on the inbox screen, for any work item | The field needs a work item chosen beside it, and the list mixes every work item's answers, which `gaps.md` of `1795042041-headless-session` *Not done* already names | Rejected: the section is inside the view, and its list is that work item's |
| Commit `owl.svg`, the detailed seal, for the seal's place | At the size of a line the fret border and the thin lines blur, which the plugin's `assets/seals/README.md` says of small tiles | Rejected for `owl-icon-cream.svg`, drawn for that size |
| Leave the seal's place empty until milestone 2 | Nothing to mislead, and nothing that shows where the seal will be | Rejected by the owner's decision of 2026-11-19 (`frame/design.md` *Grounding*). The emblem is dimmed and named "No seal yet", so no line reads as sealed |
| Wait for the owner's choice of mockup before any phase | The structure the issue fixes waits on colours | Rejected: phase 1 builds what no mockup changes, and phase 2 waits. Whether phase 1 starts before the choice is the orchestrator's (`routing.md`, *Automation*) |

## Phases

Phase 1 starts from `2a45d69`, where this branch holds `release/v0.0.1` with issue #8 merged (*Overlap with the release*).

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 12, 14 and 15, in the present palette held as the custom properties of item 13, and every row of `## Removes` | Scenarios 3, 5 and 9 as cases, each seen red before its code; scenarios 1, 2, 4 to 9 and 15 in the drive; scenarios 10 to 14 and 16 executed |`88a8f93` |
| 2 | *Scope* item 13, once `frame/questions.md` Q1 is answered and folded | Scenario 17; scenarios 13 and 14 executed again; the drive of scenarios 1, 4 and 7 again, since the layout moved | |

## Overlap with the release

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| Issue #8, `1795042041-headless-session` | `apps/desktop/src/renderer/index.html`, `renderer.ts` and `view.ts`, and `apps/desktop/test/view.test.ts`: #8 adds the "Ask" section to the side panel this work removes, and `workItemInFront` and `askButton`, which this work removes and narrows | #8 | It was sealed first: its pull request #20 merged into `release/v0.0.1` as `ed91bb6`, and this branch merged that as `2a45d69`, by a merge commit and never a rebase. Phase 1 moves the section inside the work item's view (`frame/design.md` *Scope* item 9). Built the other way, #8's review would have rewritten its section against a layout that no longer has a side panel |
| Issue #9, four visible terminals under about 500 MB (not started) | `apps/desktop/src/renderer/renderer.ts`: when a terminal is made and how long it stays (*Scope* item 6), and the pane area, which shows one pane at a time | #18 | #9 starts from `release/v0.0.1` after this work merges. Its four visible terminals are laid out in the pane area this work builds, and its measurement reads the terminals this work stops making at start |
| Issue #21, the brand outside the window (not started) | `README.md` and `README.ko.md`: this work adds one sentence to each licence section, and #21 rewrites each opening. `TRADEMARKS.md`, which this work writes and which names the Owlery name #21 decides on. The emblem's drawing, which #21 draws the app's icon from | #18 | #21 follows this work by its own first line, and reads the drawing, the `TRADEMARKS.md` and the look this work commits. The two README edits are in different sections |
| Issue #10, the Korean input regression test (not started) | Nothing in one file yet. Its test types into a terminal pane, which after this work is reached through a work item's view | #18 | #10 starts after this work, so its test is written once, against the layout that ships |

## Operational impact

No dependency is added, and the protocol and the daemon do not change. The version does not move: `0.0.1` was moved by the first pull request into `release/v0.0.1`.

The app no longer opens a shell in the user's home at start, and no longer offers a pane outside a work item. A daemon left running by an earlier build can still hold such a pane. The new window gives it no tab, and it ends when its process is ended from outside the app.

The tree gains a drawing that is not under the repository's licence, `apps/desktop/assets/seals/owl-icon-cream.svg`, and a `TRADEMARKS.md` that says so (`frame/design.md` *Scope* item 15). A person who redistributes the app reads that file beside `LICENSE`.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-19 | The crafter of every phase runs on Fable 5.2, and the sealer on Opus 5.5 | The owner chose Fable for this work's framing and build ("fable로 검토하고 fable로 진행", `routing.md`); a builder on another model than the sealer's | `docs/product.md` *The seal belongs to the product and looks the same everywhere* |
| 2026-11-19 | `frame/questions.md` Q2 is answered (다): the rebranding reaches the name, the app's icon and the README, and that goes to a work item of its own, issue #21; this work changes nothing outside the window beyond the licence note | The owner chose "이름·아이콘·README까지" in the session's question batch, whose description sent that widening to a separate issue because #18's done-when names the window alone | issue #18 *Done when*; `skills/implement/orchestration.md` *Under agentic* (a route is not widened past its grounds) |
| 2026-11-19 | `frame/questions.md` Q3 is answered (가): a top-level `TRADEMARKS.md`, linked from both READMEs' licence sections, with the two `add` operations of `## Rule changes` | The owner chose "TRADEMARKS.md" in the session's question batch | `frame/design.md` *Scope* item 15 |
| 2026-11-19 | `release/v0.0.1` at `ed91bb6`, with #8 merged as #20, is merged into this branch as `2a45d69`, before phase 1 | `frame/plan.md` *Overlap with the release* orders #8 first and asks for a merge commit | `skills/implement/merge-order.md` |
