# Closing memo: 1795019054-inbox

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the typecheck and the documents' checks as the `Broad gate` of `seal/config.json` runs them: phase 1 ran six test files of `apps/desktop` in one command and `tsc --noEmit` over the files it changed and the files that import the protocol, and phase 2 ran `test/view.test.ts` and the package's `tsc --noEmit`, not `pnpm -r run check` | the orchestrator, by the broad run after the last phase |
| closed The daemon process offers the pane kinds: `src/daemon/main.ts` passes `PANE_KINDS` to `Daemon`, which was read and not run | run by phase 2's builder on 2026-11-19 at `53d3f4e` in the built app: the daemon's `ready` to a second client carried both kinds, and the window drew "+ Shell" and "+ Claude Code" and the form's two choices from it (`trail/phases/phase-2.md`) |
| closed A real Claude Code pane's hooks move the state: the cases feed hook names through `Daemon#agentEvent`, and no `claude` ran | run by phase 2's builder on 2026-11-19 at `53d3f4e`, as far as `frame/plan.md` *Phases* row 2 names it: payloads fed through the relay command of the run directory's `claude-hooks.json`, with a Claude Code pane's `OWLERY_PANE_ID` and the daemon's hook socket, moved that pane's state in the daemon and its line in the window. `claude` ran in the pane and sent no event of its own, and the row below says who answers that |
| Which events Claude Code sends to a session that is idle or that compacts its conversation: a `Notification` after the turn's end would show `waiting` over `finished`, and a `SessionStart` in the middle of work would clear the state until the next event | a person who answers Claude Code's trust question in a pane and works in it, reading the hook lines `OWLERY_DEBUG_HOOKS=1` prints to `daemon.log`. Phase 2's drive could not: both `claude` processes it started stayed at the trust question, and `daemon.log` holds only the seven events the probe fed |
| Whether each of the 40 mutants `seal mutate` reported red in calls of several mutants failed on the line that watches its unit: those calls print the verdict and the exit code, not the failing line | a reader re-running one pair alone, as `trail/phases/phase-1.md` did for the interval case |
| Whether each of the 15 mutants of `src/renderer/view.ts` that phase 2 ran in one call failed on the line that watches its unit: that call prints the verdict and the exit code, not the failing line | a reader re-running one pair alone, as `trail/phases/phase-2.md` did for the six cases that assert nothing is shown or opened |
| The operating system shows the notification: the drive replaced `window.Notification` with a recorder, so no notification reached macOS, and whether macOS lets the app show one was not seen | a person at the built app, with a Claude Code pane behind another tab when its turn ends |
| The parts of `src/renderer/renderer.ts` the drive did not reach, which no case covers either: taking a pane another client opened when its line is clicked, closing the last tab, closing the tab of a process that already exited, and a notification for a pane without a work item | a person at the built app; a second window is needed for the first |

## Not done

- **A read of the branches is one `git rev-list` per work item, all started together.** With many work items that is many processes every 3 seconds. `frame/plan.md` *Operational impact* accepts the read per work item, and nothing bounds how many run at once.
- **A work item whose repository or branch is gone shows no count and says nothing more.** `newCommits` is `null` for it, the same as for a work item from before `baseCommit`. Removing a work item is out of scope until milestone 4.
- **`close` has no answer of its own.** A client learns that the pane closed from the `inbox` that follows. A `close` for an id the daemon does not hold is ignored without an `error`, because the message carries no `requestId` (`frame/design.md` *Data & interfaces*).
- **A closed pane's process is sent the hang-up signal and not waited for.** A process that ignores the signal outlives its pane, on no list. `Daemon#close` no longer ends it, because the session is gone from the daemon's map.
- **An agent event under an id the daemon does not hold is still sent to every client as `agent`.** That is what the daemon did before this phase, and an existing case holds it.
- **A click on a notification does nothing.** It does not show the pane that waits. `frame/design.md` *Scope* item 8 asks for the notification and not for what a click does.
- **The window gives no tab to a pane another client opened.** It takes such a pane when the person clicks its work item's line, and a pane without a work item only at the next reload. One window exists today.
- **A line says nothing of a pane that exited.** The state comes from the work item's live panes, so a work item whose agent's process ended shows no state, the same as one whose agent has not been asked anything. `frame/design.md` *Scope* item 6 names three states and nothing.
- **The close control asks nothing first.** One click ends the pane's process, an agent in the middle of its work included.
- **A line opens nothing where the daemon offers no kind that reports state.** `paneToOpen` gives nothing then, and the window stays as it is. The daemon offers one such kind today.
