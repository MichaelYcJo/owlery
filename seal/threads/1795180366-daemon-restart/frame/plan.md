# Implementation Plan: restart the daemon, or quit it with its sessions, from the app's menu (#101)

## Technical context

The tree as read at `417368a`. Every path below is under `apps/desktop/` unless it starts with `docs/` or `seal/`. The words "daemon", "run folder", "pane" and "headless session" are used as `frame/design.md` *Grounding* defines them.

The work builds on five things the tree already has.

- **The discovery file.** The daemon writes `daemon.json` into the run folder with its port, its token and its process id, and the app attaches to whatever answers there with that token (`src/daemon/discovery.ts:6-31`, `src/main/daemon-client.ts:8-22` and `:42-45`). The file is the app's only knowledge of the daemon, so the build's name goes into it, and the process the app signals is the one it names.
- **The daemon's own stop.** SIGTERM runs the daemon's `stop`: it removes `daemon.json`, ends the panes and the headless runs, and exits (`src/daemon/main.ts:28-37` and `:61`). A daemon of every build has it, and it took 7 ms with a live pane (`frame/design.md` *Grounding*, the two rows on SIGTERM). The app needs no new way into the daemon.
- **The reload at a lost daemon.** The window reloads when its socket closes, and each load asks the main process to find or start the daemon (`src/renderer/renderer.ts:1228-1248`, `src/main/main.ts:118-126`). A restart is therefore a stop followed by a load.
- **#93's dialogs and its notice.** The dialog before an archive is the shape of the new dialog, `view.ts#runningIn` already lists a work item's running sessions, and `held.daemonNotice` with `sidebar.ts:85-90` already shows a sentence about the daemon in the status line (`frame/design.md` *Grounding*, the rows on #93).
- **The built app under a case.** `test/built-app.ts#BuiltApp` starts the app in the background with a user data folder of its own and reads the main process through its inspector, where the built menu and its entries' clicks are (`frame/design.md` *Grounding*, the rows on the menu and on the harness).

Constraints the build keeps.

- The crafter works in the worktree `/Users/michael/Documents/GitHub/owlery-101` alone. It never signals a process it did not start, and never reads or writes the person's own user data folder.
- A case starts the app only through `BuiltApp.start`, which sets `OWLERY_BACKGROUND=1`. `test/daemon-restart.test.ts` starts it as often as `frame/design.md` *User scenarios & acceptance* states, and no other new case starts it: a plain Quit and a complete quit each end the app, so one start cannot hold both.
- No case starts a real `claude`. Each pane's process is `test/fixtures/receiver.sh`, and no case sends `ask`, since the daemon's headless adapter is the person's own CLI (`src/daemon/main.ts:48-49`).
- The stand-in daemons of `test/daemon-client.test.ts` are scripts the case writes into a temporary folder, as the file's existing cases do (`test/daemon-client.test.ts:15-20` and `:47-60`), and each is ended by the id the case recorded.
- The branch is never rebased. The release branch is merged into it.

What breaks in six months, for the approach chosen.

- **A pane whose process ignores SIGHUP outlives the daemon, and nothing lists it afterwards.** The daemon exits 7 ms after the signal and does not wait for its panes. The probe's pane that ignored SIGHUP was still alive a second later (`frame/design.md` *Grounding*). Whether Claude Code is such a process is `frame/questions.md` Q1. The repair belongs to how the daemon ends a pane, which a close and an archive share.
- **A packaged app whose daemon cannot read its own script.** No package is built today. The daemon then writes no `build` (`frame/design.md` *Scope* item 8), the app reads every such daemon as of another build, and the status line says so at every start. The failure is in view, not silent, and the packaging work meets it.
- **A rebuild that changes the daemon's bytes and not its behaviour is another build.** The sentence then offers a restart nobody needs. A rebuild of an unchanged tree does not do this (`frame/design.md` *Grounding*, the row on two builds).
- **The process id is reused between the answer and the signal.** The daemon would have to exit and the system hand its id to another process within the milliseconds between the two. The answer with the file's token is what keeps a stale file from ever reaching the signal.
- **A daemon that closes its socket and then hangs.** The stop fails after its wait with the process's id in the dialog. The window's socket has closed, so the window reloads a second later, the dialog goes with the page, and the load starts a new daemon beside the hung process.
- **A platform without Unix signals.** There SIGTERM ends a process without running the daemon's stop, so `daemon.json` and the hook socket stay. The next start already replaces both (`src/main/daemon-client.ts:43-44`, `src/daemon/hooks.ts:139`). The first version is the macOS app.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| A. The main process sends SIGTERM to the process `daemon.json` of its own run folder names, after a daemon answered there with the file's token | The failures of *Technical context* | Chosen. It ends a daemon of any build, and the daemon the owner runs today is of an earlier one. The answer with the token is a guard that a case can remove and see fail (`frame/design.md` scenario 2) |
| B. A client message `stop` in the protocol, which the daemon answers by ending its sessions and exiting, with the sessions the person was told of as an archive carries them | A daemon of an earlier build ignores a message it does not know, and that daemon is the one the issue asks to replace. The app would need the signal as well, so two ways to stop would stand | Rejected |
| C. A build is the SHA-256 of the daemon's script, which the daemon writes into `daemon.json` and the main process compares with the script it would start | The second and third failures of *Technical context* | Chosen. It differs exactly where the daemon's code differs, and two builds of one tree agree |
| D. `build.mjs` stamps a build's name into the bundles: the time of the build, or the commit | `pnpm start` builds at every start (`package.json`, `start`), so a time names another build at every start and the status line asks the owner to end sessions for nothing. A commit does not move for an edit that is not committed, which is the owner's daily case | Rejected |
| E. The daemon sends its build in `ready`, and the window compares | `src/shared/protocol.ts` is changed by #102 and by #96, so a third change of the same message meets both. The main process holds both facts already, and the phone has no script to compare with | Rejected |
| F. Keep #93's test, a `ready` without `repositories`, and add the build beside it | Two sources for one sentence. #93's test tells only a build before the repositories | Rejected. `view.ts#daemonLists` keeps giving no repository for such a daemon and gives no notice |
| G. The confirmation is a native dialog of the main process, `dialog.showMessageBox` | The main process holds no list of sessions, so it would need a second connection to the daemon to name them. No case can press a native dialog's button in the background | Rejected. #93's dialogs are in the page |
| H. Replace the reload: the main process stops and starts the daemon, and the window reconnects on its own page | The page would have to drop every list, screen and terminal it holds and build them again, which a load already does. A second place that starts a daemon would stand beside the load's | Rejected. The premise that keeps the reload, checked: `renderer.ts:1243-1247` reloads at every lost socket, the request of `main.ts:118-126` is the one caller of `ensureDaemon`, and `seal/threads/1795015072-daemon/gaps.md` records the reload as chosen with the reconnect left for later |
| I. Keep the status line's notice as it is drawn, in place of the daemon's state, as an equal of a mark of its own beside the state | A mark beside the state needs a second element in the foot, which #102 fills with its control. The sentence hides the count of agents while it stands | Kept as it is drawn. The premise, checked: `sidebar.ts:85-90` shows one text, and the sentence is what a person has to act on before the count means anything |
| J. Where the daemon outlives the wait, send SIGKILL | A kill leaves `daemon.json` and the hook socket, and by then no daemon answers that could prove the id is still the daemon's | Rejected. The refusal names the process id |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 7: the stop, the control, the menu's entries, the dialog, the restart and the complete quit, and the harness's reading of the daemon's id | Scenarios 1 to 6, 8, 10, 12, 13 and 14 of `frame/design.md` as cases, and of scenario 7 the dialog's words, each seen red before it is kept. Run from `apps/desktop/`: `node scripts/test-in-electron.mjs test/daemon-client.test.ts test/daemon-control.test.ts test/menu.test.ts test/view.test.ts test/terminal-basics.test.ts test/daemon-restart.test.ts`. `test/terminal-basics.test.ts` is there because it reads the built menu. Scenario 15 goes into `gaps.md` *Not verified* with the owner as its answerer. The suite, the typecheck and the broad gate are the orchestrator's | `c4c92e8` |
| 2 | `frame/design.md` *Scope* items 8 to 10: the build in `daemon.json`, `otherBuild`, and the status line's sentence in place of #93's | Scenarios 9 and 11 and the notice of scenario 7 as cases, each seen red before it is kept, and scenario 1's file again for a `daemon.json` with and without `build`: `node scripts/test-in-electron.mjs test/daemon-client.test.ts test/view.test.ts test/daemon-restart.test.ts test/daemon.test.ts`. The cases of `readDiscovery` and `buildOf` stand in `test/daemon.test.ts`, `describe("discovery")`, beside those functions' earlier cases. Scenario 11's steps go into the first start of `test/daemon-restart.test.ts` and add no start of the app. `git grep -n -e 'from an earlier build\. End its sessions' -e 'EARLIER_DAEMON' -- apps/desktop` prints nothing: at `417368a` it prints the lines `frame/design.md` *Grounding* lists, and *Removes* rows 1 to 3 name each. The pathspec leaves out `seal/threads/`, where this frame and #93's records quote the sentence |`9a323b7` |

Phase 1 leaves the app with both entries working and #93's sentence as it is. Phase 2 leaves the sentence naming an entry that exists. The commit that closes phase 2 adds `changelog.md`.

## Overlap with the release

Both items below meet this work. #102 merges first. #96 and this work then merge as each is sealed, #96 first where both are sealed together.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #102, `feat/102-the-mac-sleeps-while-an-agent-works`, frame read at `315db03` and its branch at `6ccb066` | `src/daemon/main.ts`: #102 adds the holder among the daemon's options, and this work adds the build to the call of `writeDiscovery`. `src/renderer/renderer.ts`, `src/renderer/shared.ts#held`, `src/renderer/view.ts`, `src/renderer/index.html` and `test/view.test.ts`, each in another part. `docs/architecture.md` *Overall layout* and its Korean edition, where both designs add a rule. A fact this work reads: a stopped daemon must leave no block of sleep behind. #102's `Daemon#close` releases the hold, and its `caffeinate -w` ends with the daemon however it ends, so this work adds nothing for it. A fact #102 changes that this work reads: the status line's words where the daemon holds the Mac awake. Scenario 10 reads `Daemon running, no agent`, which #102 leaves as it is where nothing is held, and its default holds only while an agent works | #102 | #102's plan states the same order. Its build is at phase 2 while this work is framed, so it is sealed first, and this work merges the release branch inside the rounds it spends anyway |
| #96, `fix/96-a-work-item-starts-from-a-stale-remote-branch`, read from its issue. Its frame was not committed when this one was written (`a12a1a4` holds its routing alone) | `src/renderer/renderer.ts`, `src/renderer/index.html` and `src/renderer/view.ts`, where #96 changes the "New work item" form and this work adds a dialog and the notice's source. Neither changes a rule, a check or a fact the other reads: this work changes neither `src/daemon/worktrees.ts` nor `src/shared/protocol.ts` | #96 | It is a fix to one module of the daemon, one answer of the protocol and one form, so it is the likelier to be sealed first. The two change different parts of the three files, so the other order costs the same merge, and the orchestrator may take whichever is sealed first |

## Operational impact

- No migration, no new environment variable and no new dependency. The pull request moves no version: the release's move has landed.
- `daemon.json` gains the optional `build`. An app of an earlier build reads the three fields it knows and ignores the fourth (`src/daemon/discovery.ts:23-26`), so it attaches to a daemon of this build as before.
- A window of this build attached to a daemon of an earlier build shows the new sentence until that daemon is replaced. The owner's running daemon is such a one, and "Restart Daemon…" replaces it at the cost of its running sessions.
- A restart and a complete quit lose what the daemon holds in memory: the panes' output and tabs, and the headless sessions with their answers. The dialog says so before either.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
