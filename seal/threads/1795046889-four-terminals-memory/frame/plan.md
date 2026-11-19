# Implementation Plan: four visible terminals keep the app under about 500 MB

## Technical context

The tree as read at `69b25ba`. Issue #18's frame and code were read on `feat/18-the-app-opens-on-a-pane-of-terminals` at `edb2a28`: the frame as committed there, with phases 1 to 3 built and phase 4 not (`frame/design.md` *Grounding*). This plan is drawn against that commit, and what #18 changes after it is read again by phase 1 before it builds.

`apps/desktop` at `edb2a28`: the window is `src/renderer/` (`index.html`, `renderer.ts`, and `view.ts` with the window's decisions as pure functions and their cases in `test/view.test.ts`). The daemon is `src/daemon/` (`daemon.ts`, and `buffer.ts` with the output each session keeps), with its cases in `test/daemon.test.ts`. `src/shared/protocol.ts` is what the two exchange. The tests run with vitest in Electron's Node (`pnpm run test`), and no case loads the page, so `renderer.ts` is shown by a drive of the built app through Chromium's debugging port. The app is Electron 45.3.3 with `@xterm/xterm` 6.0.0, `@xterm/addon-webgl` 0.19.0 and `@xterm/addon-fit` 0.11.0.

These facts shape the build.

- **The window keeps one terminal per pane it ever showed.** `renderer.ts#terminalFor` makes it the first time the pane is in front, and `renderer.ts#remove` disposes of it only when the daemon stops listing the pane. A person who visits eight panes holds eight terminals and eight WebGL canvases, seven of them hidden.
- **The stage shows one pane.** `#stage` holds every pane's element, absolutely placed, and `renderer.ts#showView` hides all but the one in front. Nothing in the window shows two terminals at once.
- **A client cannot stop receiving a session.** `Daemon#clients` gives each client a set of sessions that only grows, so a window that gave a pane's screen away would still be sent its output.
- **The window, and not the daemon, writes the exit line,** into the terminal it holds. A terminal that is given away loses it, and `view.ts#paneTabs` gives an exited pane a tab only while the window holds its terminal.
- **The kept output is cut at a character,** 256K characters per session, in memory alone.
- **The middle column is 840 pixels of a window that opens 1440 wide,** so a tile of two columns is about 400 pixels wide before the stage's padding (`seal/threads/1795043695-inbox-first-window/frame/plan.md` *Technical context*, at `edb2a28`).
- **The app runs a daemon on Electron's Node,** which the earlier measurement's bare window did not have. That measurement gave 460 MB for four terminals, so the room under 500 MB is about 40 MB before the daemon and the larger window are counted (`frame/design.md` *Grounding*, the uncommitted notes).
- **The built app's daemon needs a run folder with a short path** until issue #19 is fixed, and Electron's `--user-data-dir` chooses the folder (`seal/threads/1795042041-headless-session/trail/phases/phase-2.md`).

**The failure scenario of the chosen approach.**

- Every time a pane comes onto the stage, its screen is drawn from the daemon's raw output. A full-screen program whose output passed the kept 256K characters is drawn from the middle of its stream, so its screen is wrong until the program redraws, and a replay written into a tile of another size wraps where the process did not. The fit that follows an attach sends the process its size; whether each agent's CLI redraws its whole screen at that is not checked by anything here.
- The kept output is counted in characters and the window's history in lines, so a pane that prints many escape sequences comes back with fewer than 1,000 lines.
- The number is one machine's, on its displays, at the window's default size, on the day it was taken. Milestones 2 to 4 add screens to the window, and nothing runs the script again: the criterion of `docs/roadmap.md` *Done criteria* is checked at 0.1.0, and whoever checks it then has to run it.
- The script moves the window by its controls' ids and reads the daemon's protocol. No gate runs it, so a change of the pane bar or of a message breaks it without a red check, and the break shows the next time a person runs it.
- Free screens stay in the pool, so a window that once showed four panes holds four hidden canvases while the inbox is in front. The script reports that number, and nothing here lowers it.
- Four tiles in the middle column are small, each about 400 pixels wide at the default window size. A person who wants four wide terminals widens the window, and the two side columns keep their widths.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Keep one terminal per pane, hidden until its pane closes, as #18 leaves it | Memory grows with every pane a person ever opened, and a hidden WebGL canvas keeps its buffers (`docs/architecture.md` *Memory design*, row 1) | Rejected: the policy in force asks for screens only for visible panes. #18's frame kept the structure only until this issue (`frame/design.md` *Removes*, first row) |
| Dispose of a hidden pane's terminal and make a new one each time it is shown | Each show pays for a new screen object, which the uncommitted notes give as 160 to 190 ms in another product's own measurement, and `@xterm/addon-webgl` 0.19.0 does not release a disposed context itself, so memory falls only when the browser collects it | Rejected for the pool: the policy's row 1 says the screens are reused |
| Replace the raw output the daemon replays with a screen state it parses and keeps for each session | The daemon parses every byte every pane prints, whose CPU cost `docs/architecture.md` *Measure before building* asks to be measured first; the package gains dependencies; each session's state lives in the daemon's memory, which this issue counts | Not taken here, as an equal of the row below. It is the remedy for the first failure scenario above, and it waits on that measurement |
| Keep the raw output and replay it into the reused screen | The first two failure scenarios above | Chosen. The premise that keeps the structure is that the kept output, written into an empty terminal, redraws what a pane printed. It is checked for a shell: the daemon work item's `gaps.md` holds the row, closed and executed 2026-11-19, where lines typed before and while the app was closed came back in the reopened window's replay. It is not checked for a full-screen program past the cut |
| Keep one pane at a time in the product and measure four through a layout only the script can reach | The published number describes a screen no person can open, and the criterion says "with four terminals visible" | Rejected as the default. It is an option of `frame/questions.md` Q1 |
| Tiles of any work item's panes, or splits a person drags and resizes | A view stops being one work item's, or the window gains a layout to keep and restore, which `docs/product.md` *What we deliberately don't do* reads as the IDE it does not build | Rejected: one control and a fixed arrangement show four |
| Read memory as RSS, or from Electron's `app.getAppMetrics()` | RSS counts shared pages once per process and leaves out GPU memory (the uncommitted notes); `getAppMetrics` needs code in the main process and does not see the daemon | Rejected: `footprint` reads `phys_footprint`, the number Activity Monitor shows, for any process id |
| Run the measurement in the suite, or in the `Broad gate`, against a threshold | It opens a window and takes minutes, and its number moves with the display and the GPU, so a gate would refuse on a noisy reading | Rejected: a person, a builder and the sealer run it, and the file holds the result |
| Write the number into `docs/` | The number does not exist when the frame is written, and it would then stand in a policy document and in the measurement's own file | Rejected: one file in the tree holds it, and `docs/product.md` links that file (`frame/design.md` *Rule changes*) |
| Have the window keep each pane's exit code and write the exit line after a replay | A reload forgets the code, and the phone's client would write a line of its own | Rejected: the daemon holds the output, so the line is in it |
| Build the pool and the tiles before any measurement | Nothing then shows what the window held before, and whether the room under 500 MB is there is learned last | Rejected: phase 1 measures the window as #18 leaves it |

## Phases

Phase 1 starts once `release/v0.0.1` holds issue #18, and issue #19 where it is sealed by then, and this branch has merged it by a merge commit (*Overlap with the release*).

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* item 6, for the scenarios `inbox`, `one` and `eight-in-turn`, on the window as #18 leaves it; their tables go into the phase record as the numbers before this work | The parsing of `footprint`'s output and the split of the app's processes from the panes' as cases, each seen red before its code; the script executed for those scenarios at the phase's commit; one sample's sum read against `footprint` run by hand on the same process ids; after the run, `ps` shows no process the script started and its folders are gone | |
| 2 | *Scope* items 2 to 5 and 8, with one pane on the stage | Scenarios 3, 5, 6, 7 and 8 as cases, each seen red before its code; scenarios 4 and 7 in the drive; `eight-in-turn` executed again and read against phase 1's table; scenarios 12 to 14 executed | |
| 3 | *Scope* items 1 and 7, and the scenarios of item 6 that phase 1 leaves | Scenario 2 as cases, each seen red before its code; scenarios 1 and 9 in the drive; scenarios 10 and 11 executed; scenarios 12 to 14 executed again | |

## Overlap with the release

Issue #21, the brand outside the window, was read by its title alone: it changes the README, the app's icon and the emblem's row of `docs/name.md`, none of which this work reads or changes.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| Issue #18, `1795043695-inbox-first-window` | `apps/desktop/src/renderer/renderer.ts`, `view.ts` and `index.html`, and `apps/desktop/test/view.test.ts`: #18 builds the pane area, `terminalFor`, `paneTabs` and the stage this work changes. `apps/desktop/src/shared/protocol.ts`, `src/daemon/daemon.ts` and `test/daemon.test.ts`: #18 adds `looked` and the look, and this work adds `detach` and the exit line beside them | #18 | It rebuilds the window this work measures, and its phases 1 to 3 are built. This work's first phase measures #18's window as merged, and its *Removes* names what #18 builds. This branch merges `release/v0.0.1` by a merge commit once #18 is in it, never by a rebase. Its phase 4 adds the summary screen, a third screen in front of which every pane leaves the stage (`frame/design.md` *Scope* item 2) |
| Issue #19, `1795046887-socket-path` (routing alone at `56ce302`) | No file in common is known: #19 changes where the hook socket lives or what the window says when the daemon does not start (`src/daemon/hooks.ts`, `src/daemon/main.ts`, `src/main/`). This work's script reads that fact: it starts the built app in a user data folder of its own, where the daemon starts only while the socket's path is short | #19 | It is the smaller diff and does not wait on #18, so it is the likelier to be sealed first. With it merged, the script's folder may be any path, a builder's scratch among them. Without it, the script is given a short folder as its argument, as #18's drive was |
| Issue #10, `1795046888-korean-input-test` (routing alone at `1c2acea`) | Its test types into a terminal pane, and this work changes what that terminal is: a screen reused from pane to pane and reset between them, whose input element the next pane inherits. Where #10 drives the built app by a script, both add a script under `apps/desktop/scripts/` that reaches the window through the debugging port | #10 | #10's frame (`b1b7dc8` on `test/10-no-test-types-korean-into-a-pane`) builds an automated case in the desktop suite and leaves a person's typed run to the release, so the pull request waits on no person. Merged first, its case runs in this work's broad gate and reads the reused screen of phases 2 and 3 for a Korean regression; the orchestrator settled the order (*Judgments of the run*) |

## Operational impact

No dependency is added. The protocol gains the client message `detach`. A daemon left running by an earlier build ignores it, as it ignores any message it does not know, and goes on sending a hidden pane's output, which the window drops. Such a daemon appends no exit line, so an exited pane's screen ends without it until that daemon exits. The other way round, a window of an earlier build on this daemon shows the line twice.

An exited pane keeps its tab across a reload until a person closes it, where it had none before.

`apps/desktop/package.json` gains the script `measure:memory`, which no check runs, and the tree gains `apps/desktop/measurements/memory.md`. The script needs macOS and its `footprint` command, and a built `dist/`.

The version does not move: `0.0.1` was moved by the first pull request into `release/v0.0.1`.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-19 | The crafter of every phase runs on Fable 5.2, and the sealer on Opus 5.5 | The owner chose it for this work, relayed by the orchestrator's spawn of the framer; a builder on another model than the sealer's | `docs/product.md` *The seal belongs to the product and looks the same everywhere* |
| 2026-11-19 | #10 merges before this work, after #18; the framer's order (#9 first) is replaced | #10's frame builds an automated Korean input case that needs no person before its pull request and changes no file of the app, so merged first it guards this work's rewrite of the terminals; the framer's reason for the other order assumed #10 might be typed by a person | `frame/plan.md` *Overlap with the release*; `docs/roadmap.md` *Releases and the tracker* |
| 2026-11-19 | A person puts up to four of a work item's panes on screen with one "Side by side" control, as fixed tiles (`frame/questions.md` Q1, option a); the owner's idea of a layout made for one orchestrator with parallel subtasks, or for parallel features, goes to issue #35 | The owner first asked for all three options and then described those two ways of working; the orchestrator recommended (a) for this milestone's measurement and the idea for #35, and the owner answered "9 그렇게해" | `docs/product.md` *What we deliberately don't do*; `docs/architecture.md` *Memory design* |
| 2026-11-19 | This branch took `ea78b7b`, #10's merge into `release/v0.0.1`, by a merge and not by a rebase, though it held frame commits alone | #10's merged records cite `4d7f0a0` on this branch, and a rebase would leave that commit on no branch; the owner's rule after #23 and #10 is that a work item's branch takes the release branch by a merge | The plugin's `skills/implement/SKILL.md`, which says a work item's branch is never rebased |
| 2026-11-19 | This work takes the review chain, a proofer round over each phase's diff before the sealer, though `routing.md` answered *Review* straight to the PR | Q1's answer (a) adds a "Side by side" control to the shipped window and the work rewrites what a pane's terminal is, which `routing.md` *Why this way* did not name when it answered for a measurement; #10's sealer withheld on the same ground | The plugin's `skills/implement/orchestration.md` *Under agentic*: a work item takes the review chain where its diff reaches what its grounds did not name |
