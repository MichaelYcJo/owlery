# Implementation Plan: the Korean input regression test runs and passes

## Technical context

The tree as read at `1c2acea`. Issue #18's frame and window were read at `edb2a28`, the tip of `feat/18-the-app-opens-on-a-pane-of-terminals` on 2026-11-19: its `frame/design.md` and `frame/plan.md` whole, `trail/phases/phase-2.md` for its drive, and `apps/desktop/src/renderer/renderer.ts` for the focus, the form and the keys. Phase 4 of that work, the summary screen, was not built at that commit.

What this work builds on, in `apps/desktop`:

- **The suite runs inside Electron's Node.** `scripts/test-in-electron.mjs` starts vitest with the Electron binary and `ELECTRON_RUN_AS_NODE=1`, because `node-pty` is built for Electron. The same binary starts as the app once that variable is removed, and that Node holds `WebSocket` and `fetch` (`frame/design.md` *Grounding*, probe 3). The case therefore needs no new dependency to start the app and to speak to its debugging port.
- **No case loads the window today.** `test/view.test.ts` reads the window's decisions as pure functions, and `renderer.ts` has been shown only by drives of the built app from a builder's scratch. Nothing in the tree starts the app, so this work writes the first helper that does.
- **The app is steered from outside its code.** `--remote-debugging-port` and `--user-data-dir` are Electron's own switches. `src/daemon/pty.ts#loginShell` runs `$SHELL -l` in a shell pane, and `src/daemon/worktrees.ts` reads `OWLERY_WORKTREES`. The case uses these four and adds no switch to the app.
- **The terminal sends composed text from timers.** `@xterm/xterm` 6.0.0 reads its hidden textarea in zero-delay timers after `compositionupdate` and `compositionend`, and a keydown that is no composition key cancels a pending send. A drive faster than those timers loses the text, and one paced by them delivers it (`frame/design.md` *Grounding*, probes 1 and 2).
- **The pane is inside a work item's view after issue #18.** The form creates a work item and the window opens its view with the new pane in front, focused by `showView`. The inbox's J, K and Enter are read only while the inbox screen is in front.
- **A long run folder stops the daemon** until issue #19 is fixed, so the case's user data folder sits directly under the system's temporary folder.

**The failure scenario of the chosen approach.** The case drives a real window at every broad gate and depends on a pace. On a loaded machine a timer of the page can run late against a step, a line arrives short, and the gate fails for no change in the tree. A case that fails that way more than once gets retried without being read, and then it guards nothing. These costs stand beside it.

- The recorded steps age. A new macOS or a new Electron can change what an input source produces, and the case keeps passing on the old record. Only the typed run at the next release shows it, and nothing forces a person to make that run.
- `Input.imeSetComposition` is marked experimental in the debugging protocol. An Electron upgrade that renames it fails the case in that upgrade's pull request, where it is seen and fixed.
- The debugging port sends one call at a time, so what an input source does inside one keydown reaches the page as separate tasks. A sequence that depends on that cannot be replayed, and the fixture then names its line under `replayDiffers`.
- The receiver is chosen through `SHELL`. A daemon that stops reading `SHELL` for a shell pane breaks the case, and the case has to find another way in.
- The gate opens the app's window on the developer's screen for the length of the case.
- Until the owner's first typed run, every line's steps are the order this frame assumed, and the case shows only that the pane handles that order.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Both: a replayed case in the suite, and a typed run at each release that judges the bytes by itself and records the events for the case to replay | The costs of *Technical context*. A person types for a few minutes at each release | Chosen. The roadmap's criterion is whether an automated test reproduces a person's typing. Probe 2 shows that the replay's result turns on an order of events that only a person's typing gives, so the replay alone cannot be shown to meet the criterion, and the typed run is what shows it. The typed run alone leaves every change between two releases unread |
| The replayed case alone, the roadmap's first option | It passes on the order its author believed in. An input source that sends Enter's keydown before the last commit doubles a syllable in the pane (probe 2), and the case stays green | Rejected: no fact in the tree says which order an input source produces (`frame/questions.md` Q1) |
| A script a person types at each release alone, the roadmap's second option | A change of the window, of `@xterm/xterm` or of Electron that breaks composition is found at the next release, weeks after its pull request merged, and a release made in a hurry skips the script | Rejected: the pane's own code can be guarded at every gate without a person |
| Composition events made inside the page with `dispatchEvent` | The terminal reads its textarea's value, which such events do not change. Probe 1 sent them and the process received nothing. A test built on them would have to write the value itself, and would then test its own imitation of the browser | Rejected by probe 1 |
| System key events through the real input source, posted by the test | The test needs the Accessibility permission, switches the person's input source and takes the keyboard for its length. A key posted while another app is in front lands in that app | Rejected: the gate would take over the machine it runs on |
| Typing into the person's own shell and reading `xxd`, as the owner did by hand on 2026-11-18 | The person's shell profile decides what the prompt does with a key: a completion plugin or a slow start changes the bytes or the timing, and the case fails on one machine alone | Rejected for the receiver chosen through `SHELL`, which reads raw bytes and has no profile |
| A Dubeolsik automaton in the test, which turns any text's keys into composition steps | The test then holds its author's belief of what an input source does for every text, and agrees with itself | Rejected for steps held per line in the fixture, replaced by what a person's typing recorded |
| Replace the runner for tests that drive the app: add Playwright's Electron launcher and keep these tests in a suite of their own | A second runner and a large new development dependency, whose Electron support has to follow each Electron upgrade. A suite outside `pnpm run check` is one the gate does not run | Weighed as an equal of keeping vitest. Kept: the premise is that a vitest case can start the app and speak to the debugging port with what the tree already has, and probes 1 to 3 checked it, with a script of Node's own `WebSocket` and `fetch` and with the Electron binary starting as the app from Electron's Node |
| Keep the test outside the gate, as a command a builder runs when the window changes | Nobody runs it for a change that does not look like the window's, such as a dependency's upgrade | Rejected: the case joins `pnpm run test` |
| Edit `docs/roadmap.md` in this work's pull request, as the issue's *Done when* line reads | Issue #18 states its changes of `docs/` for the settle. A work item beside it that edits the roadmap directly changes a policy document outside the settle's order, and a later one that names the same section has two sources to reconcile | Rejected for the operations of `frame/design.md` *Rule changes*, which the plugin's `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes* asks of a work item whose subject is the code |
| Wait with the pull request until the owner made the first typed run | The chain stops on a person for a result that changes no line of the diff except the fixture's steps | Not taken as the default: `frame/design.md` *Scope* item 13. The owner can still type first |

## Phases

Phase 1 starts after issue #18 has merged into `release/v0.0.1` and this branch has merged that release branch by a merge commit (*Overlap with the release*).

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 8 and 12, with every line of the fixture written by hand as `source: "assumed"` | Scenarios 1 to 3 as cases, each seen red as its row states; scenario 4 read by the case and listed once by the builder; scenario 5 executed | |
| 2 | *Scope* items 9 to 11, and the script entry of `apps/desktop/package.json` | Scenario 6 as a case, seen red as its row states, and its one start of `korean:typed`; scenario 5 executed. Scenario 7 is the owner's, and the phase writes its row into `gaps.md` | |

## Overlap with the release

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| Issue #18, `1795043695-inbox-first-window` (phases 1 to 3 closed at `edb2a28`) | No file. The case types into a pane of the window #18 rebuilds: it reaches the pane through the "New work item" form and the work item's view, and reads the focus `showView` gives | #18 | The case is written once, against the window that ships, and its row of #18's own *Overlap with the release* says the same. Written first, the case would open the pane the old window starts at `ready`, which #18 removes |
| Issue #9, `1795046889-four-terminals-memory` (routing alone at `69b25ba`, no frame committed) | No file known. #9 lays out four visible terminals in the pane area and decides how long a hidden terminal lives, in `apps/desktop/src/renderer/renderer.ts`, which the case reads through the window. #9 also has to start the built app to measure it | #10 | This work changes no file of the app, so it rebuilds nothing of #9's. Merged first, the case runs inside the rounds #9 spends anyway and reads #9's change of the panes for the regression the case exists for, and #9's measurement can start the app through the helper this work commits. The cost falls on #9: where it changes the way to a pane, it changes the case's step that opens one. #9's frame was not committed when this was written, so its own row may order the two otherwise, and the orchestrator then settles the order |
| Issue #19, `1795046887-socket-path` (routing alone at `56ce302`, no frame committed) | No file. #19 changes what the daemon does where its run folder's path is too long for a socket. The case chooses its own run folder with `--user-data-dir` | #19 | It is the smaller change and waits on nothing, while this work's build waits on #18. The case keeps a short folder either way, so nothing is integrated in either order |

## Operational impact

No dependency is added, and no file of the app changes. `apps/desktop/package.json` gains one script, `korean:typed`. The version does not move: `0.0.1` was moved by the first pull request into `release/v0.0.1`.

`pnpm run test`, and so the broad gate, now builds the app and opens its window for the length of the case, on a machine with a display. It starts a daemon of its own in a folder under the system's temporary folder and stops it.

A release gains one step for a person: `pnpm --filter @owlery/desktop run korean:typed`, typed with a Korean input source, whose change of `apps/desktop/test/fixtures/korean-input.json` is committed with the release.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-19 | The crafter of every phase runs on Fable 5.2, and the sealer on Opus 5.5 | The owner chose Fable for the work that runs beside #18 ("병렬로 할만하거있으면 fable로 진행해", `routing.md`); a builder on another model than the sealer's | `docs/product.md` *The seal belongs to the product and looks the same everywhere* |
