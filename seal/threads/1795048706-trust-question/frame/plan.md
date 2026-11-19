# Implementation Plan: a Claude Code pane that waits before its session starts

## Technical context

The tree as read at `ba22934`.

`apps/desktop/src/daemon/daemon.ts` holds the panes. `startSession` (line 312) starts a pane's process and lists it with `state: null`. `agentEvent` (line 110) is the one place a state changes: it maps the hook's name with `agentEventFor`, returns where the name is not mapped, and gives a pane of a kind that reports state what `agentStateAfter` says, sending the inbox where the state changed. A pane leaves in three places: its process's exit (`terminal.onExit`, line 329), a client's `close` (line 210) and `Daemon#close` (line 123). `DaemonOptions` (line 20) already carries the times a case shortens, `idleExitMs` and `commitPollMs` among them, and the cases of `apps/desktop/test/daemon.test.ts` wait on real timers.

`apps/desktop/src/daemon/main.ts` (line 48) gives a Claude Code pane the command of `claudePaneCommand` and the two `OWLERY_` variables the hook's relay reads. The window draws a pane's state from `SessionInfo.state` alone (`apps/desktop/src/renderer/view.ts`, `inboxLine` at line 41 and `notificationFor` at line 68). Tests run with vitest in Electron's Node (`pnpm run test`), and `pnpm run check` is the typecheck and the tests. The installed Claude Code is 2.1.327.

What Claude Code does at the trust question is in `frame/design.md` *Grounding*, from the probes.

**The failure scenario of the chosen approach.** The rule calls a pane waiting on the clock. A start that takes longer than 10 seconds, such as a CLI that updates itself first or a login shell with a slow profile, is shown as waiting and notified once by mistake, and the session's start then takes the state away. A CLI release that stops sending an event at its session's start leaves every pane `waiting` from its tenth second until the first prompt. A CLI release that starts sending an event at the trust question makes the rule do nothing there, and the line then says whatever that event maps to. The rule also fires at every other question a CLI asks before its session starts, a login among them, which is what the line should say there, though no probe ran one.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Keep `SessionInfo.state` as `AgentState \| null`, and let the daemon set `waiting` where a pane's first event is missing after a fixed time | The scenario above: a start slower than the time is notified once by mistake | Chosen. The premise that keeps the structure is that every reader of the state reads three states and null and no more. Checked: at `ba22934` `inboxLine` and `notificationFor`, and at `6509bae` on issue #18's branch `stateHeading`, `inboxSummary` and the look the daemon records, read `SessionInfo.state` and nothing else of a pane's start |
| Replace the structure: give the protocol a state for the time before the first event (`starting`, with the pane's start time), and let each client decide when a start has lasted too long | The decision of what waits moves into the window, and the phone repeats it with a clock of its own, against `docs/architecture.md` *The phone: the terminal session as a chat* ("no state lives on the UI side"). The new value reaches every reader of the state: the groups, the summary and the look of issue #18, and the protocol edits of issue #9 | Rejected: the daemon holds the clock, and the protocol's types stay as they are |
| List a pane as `waiting` from its start, with no timer, until its first event | Every pane is `waiting` for the 1.1 to 1.4 seconds before its session's start, so every pane opened behind another one notifies "Waiting for you" by mistake | Rejected by `docs/architecture.md` *Overall layout*: a decision is never put in front of a person by mistake |
| Count the time from a line the pane's shell sends to the hook socket just before `exec claude`, so the login shell's start is not counted | The hook socket gains a second writer and a second line format. The whole start, shell included, was 1.1 to 1.4 seconds in the probes, so there is nothing measured to take out | Rejected until a start is measured that the shell makes slow |
| Read `~/.claude.json` to learn whether the repository is trusted, and list the pane as waiting at once where it is not | The file's format is not public, and the entry is kept under the repository's folder and not the worktree's. A release that moves the record shows nothing, with no error. The daemon would also read a file of the user's CLI that no adapter owns | Rejected |
| Write the trust record for the worktree before the pane starts, or start `claude` with an option that bypasses its checks | The first changes a file of the user's CLI and answers a safety question in the person's place. The second turns the CLI's checks off | Rejected by `docs/architecture.md` *The phone* ("The user's own settings files are not changed") and `docs/roadmap.md` *Milestones* row 1 ("Owlery never turns a permission check off") |
| Find the question's words in the pane's output | The words change with the CLI's version and language, and a program in the pane that prints them is taken for the question | Rejected by `docs/architecture.md` *Overall layout*: state is never guessed from what the terminal prints |
| Change nothing in the daemon and record the run alone, since the question is asked once per repository | The first work item of a repository new to Claude Code is the first thing a new user of Owlery does there, and its line says nothing while the session waits | Rejected, with `frame/questions.md` Q1 open for the owner |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 5 | Scenarios 2 to 6 as cases, each seen red before its code; scenario 1 in the built app, driven once against the real `claude`, with the two checksums it names | |

## Overlap with the release

Issue #19 (`fix/19-the-daemon-dies-where-its-socket-path-is-too-long` at `db1ae80`) changes `src/daemon/hooks.ts`, `src/daemon/main.ts`, `src/main/`, `src/renderer/renderer.ts` and `src/shared/ipc.ts`, none of which this work changes, and its design changes no rule. The drive of scenario 1 gives the app a user data folder with a short path, so it does not wait on #19. Issue #10 (`test/10-no-test-types-korean-into-a-pane` at `e9609e6`, frame alone) adds a case that types into a shell pane, a kind that reports no state. Issue #21 (`feat/21-nothing-outside-the-window-carries-the-brand` at `611701c`, frame alone, read by its issue's body) changes the README, the app's icon and `docs/name.md`. None of them meets this work.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| Issue #18, `1795043695-inbox-first-window` (four phases built, at `6509bae`) | `apps/desktop/src/daemon/daemon.ts`: #18 adds `readyWaitMs` to `DaemonOptions` and rewrites the hello and the commit reads, and this work adds `silentStartMs` beside it and a timer to `startSession`, `agentEvent` and the places a pane leaves. `apps/desktop/test/daemon.test.ts`: both add cases. `apps/desktop/src/shared/protocol.ts`: #18 adds `Look` and `looked`, and this work rewrites one comment. #18's inbox groups, its summary and its recorded look read the `waiting` this work sets | #18 | Its build is finished and it is the likelier to be sealed first, and its diff of the two daemon files is the larger, so this work's one phase integrates against it. This branch merges `release/v0.0.1` by a merge commit once #18 is in it, never by a rebase. The drive of scenario 1 then reads the line under #18's "Waiting for you" heading |
| Issue #9, `1795046889-four-terminals-memory` (frame alone, at `2c1f824`) | `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/test/daemon.test.ts` and `apps/desktop/src/shared/protocol.ts`: #9's plan adds a `detach` message and an exit line there | #23 | This work is one phase and #9 is not built, so #9's build starts from a release branch that holds this work and meets it in its own rounds |

## Operational impact

A Claude Code pane that has sent no event 10 seconds after its start is listed as waiting, and a pane that is not in front then raises the "Waiting for you" notification. A person sees this at the trust question of a repository new to Claude Code, and at any other question the CLI asks before its session starts. No dependency, environment variable or migration is added. The version does not move.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-19 | The crafter of every phase runs on Fable 5.2; the sealer's model is decided by the orchestrator when it is spawned | The owner chose that everything run until 22:00 on 2026-11-19 runs on Fable 5.2 (`routing.md` *Why this way*) | `docs/product.md` *The seal belongs to the product and looks the same everywhere* |
| 2026-11-19 | The daemon's change is built in milestone 1 as framed: a pane silent for 10 seconds after its start is listed as waiting (`frame/questions.md` Q1, option a) | The owner answered "23 그렇게해" to the orchestrator's recommendation, after it was explained that the trust question comes only in the first work item of a repository never trusted in Claude Code | `docs/product.md` *Foundation* |
