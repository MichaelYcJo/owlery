# Design: the Korean input regression test runs and passes

The ticket is issue #10.

## Grounding

The tree was first read at `1c2acea`, and issue #18's frame at `edb2a28`, the tip of `feat/18-the-app-opens-on-a-pane-of-terminals` before it merged. Issue #18 merged into `release/v0.0.1` on 2026-11-19 as `c128acb` (pull request #37), and this branch was rebased onto that commit. The window, the daemon and the test folder were read again at `5323ebe`, this branch's tip after the rebase. A bullet below that names a commit gives the fact as that commit holds it. Probes 1 to 3 ran against the window of `1c2acea`, which opened a shell pane at start, and probe 4 ran against the window of `5323ebe`, which a phase builds on. The owner's decision of 2026-11-19, a switch under which the app starts in the background, was folded at `1d2da48`, where phase 1's case and its helpers are committed and the phase is open. Probe 5 ran against that tree.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/roadmap.md` *Milestones*, row 1 | Milestone 1 builds "The Korean input regression test", and is done when "The Korean input regression test passes" |
| `docs/roadmap.md` *Milestones*, "Two things are checked at the start of milestone 1" | What the check reads: a person types Korean into the Electron terminal pane and reads what the terminal received. The test reads the same thing, the bytes the pane's process is handed, and not what a program then draws |
| `docs/roadmap.md` *Open decisions*, the row "How the Korean input regression test runs" | The two options, automated composition events or a script a person types at each release, and the criterion between them: whether an automated test reproduces what a person's typing produces. Issue #10 hands this decision to this work |
| `docs/roadmap.md` *Done criteria*, the row "The Korean input regression test passes" | v0.1 is checked by the test's result at the 0.1.0 release, so the test has to give a result at a release |
| `docs/architecture.md` *Screen framework: Electron*, "Korean input on macOS" | The result of issue #3: a person typed Korean with the Dubeolsik layout into the pane on 2026-11-18, in the shell and in Claude Code, and the shell received it as typed, in UTF-8. The pane works today, so the test is a regression test and not a repair |
| `docs/roadmap.md` *Goal* | v0.1 is the macOS desktop app only, so the test covers macOS input and no other platform's |
| The plugin's `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes* | A work item whose subject is the code states the rules it changes in `## Rule changes`, and the settle writes them into `docs/`. This work's subject is a test in the tree, so the roadmap's new text stands in `## Rule changes` and this work's commits leave `docs/` as it is. Issue #18's frame states its changes of `docs/` the same way |

What the reading and the probes gave. Each fact is labelled as it was got.

- `executed`: `gh issue view 10 --json body,comments,title` on 2026-11-19, after issue #18 merged, gave no comment. The body says that since #18 a pane is reached through a work item's view and the inbox reads J and K by `KeyboardEvent.code`, and that the test types into a pane of that window. The issue's one *Done when* line asks that the test runs, passes, and that the way it runs is written into `docs/roadmap.md` in place of the open row.
- `read`: `seal/threads/1795010335-terminal-pane/gaps.md`, whole. Its closed row holds what the owner saw on 2026-11-18: `echo 안녕하세요` printed the word as typed, `printf '%s' "한글 조합 테스트" | xxd` printed the UTF-8 of the string, and Korean typed at Claude Code's prompt showed as typed. Its *Not done* says that CI does not run the desktop tests: `.github/workflows/hygiene.yml` runs the plugin's checks only, and the broad gate runs the desktop tests locally.
- `read`: `apps/desktop/test/pty.test.ts`, the cases "shows a command's UTF-8 output, Korean included" and "delivers what the person types to the process". They write whole Korean strings to the pseudo-terminal. No case composes a syllable, and no case loads the window.
- `executed`: `git grep -n -i -e 'remote-debugging' -e 'webSocketDebuggerUrl' -e 'dispatchKeyEvent' -e 'imeSetComposition' -e 'compositionstart' -e 'CompositionEvent' <commit> -- apps package.json .github` printed nothing and exited 1 at `1c2acea` and at `5323ebe`. `git grep -c -e 'ELECTRON_RUN_AS_NODE' <commit> -- apps` printed four files at each, so the path is searched. Nothing in the tree starts the built app and drives it. Each drive of issues #5 to #8 and #18 was a probe in a builder's scratch (`read`: `seal/threads/1795042041-headless-session/trail/phases/phase-2.md`, and `trail/phases/phase-2.md` of `1795043695-inbox-first-window` at `edb2a28`).
- `read`: `apps/desktop/package.json` pins `@xterm/xterm` 6.0.0 and `electron` 45.3.3. Its `test` script runs vitest inside Electron's Node through `scripts/test-in-electron.mjs`, and `check` is the typecheck and that script. `seal/config.json`'s `Broad gate` runs `pnpm -r run check`, so a case of the desktop suite runs at every broad gate.
- `read`: `@xterm/xterm` 6.0.0, `src/browser/input/CompositionHelper.ts`, whole. The terminal takes a composed text by reading the value of its hidden textarea, between positions it noted at `compositionstart` and in a zero-delay timer after each `compositionupdate`. It sends the text from a zero-delay timer after `compositionend`. A keydown whose key code is neither 229 nor a modifier's, arriving while a composition is open or its send is pending, sends the textarea's text at once and cancels the pending send. So what the pane's process receives depends on the order of the keydown, composition and input events and on timers running between them.
- `read`, at `5323ebe`: the pane's process and the place of the app's files are chosen from outside the app's code. The paths of this bullet are under `apps/desktop/src/`.
  - `daemon/pty.ts#loginShell` runs `$SHELL -l` for a shell pane. A Claude Code pane runs `$SHELL -l -i -c` with `exec claude` in a terminal (`daemon/hooks.ts#claudePaneCommand`). The lookup of `claude` runs `$SHELL -l -i -c` through `execFile`, with no terminal (`daemon/adapters/claude.ts#lookupCommand`).
  - `main/main.ts` puts the daemon's run folder at `run` under Electron's user data folder, which `--user-data-dir` chooses. The daemon writes its process id into `daemon.json` in that folder (`daemon/discovery.ts`).
  - `daemon/worktrees.ts` reads `OWLERY_WORKTREES`.
  - The daemon exits by itself only once no pane's process is alive, no headless session is working and no window is connected (`daemon/main.ts`). A daemon whose pane runs the receiver therefore outlives the app.
  - Since `d2df840`, the fix of issue #19, the hook server listens in a run folder of any length (`daemon/hooks.ts#HookServer.listen`). The length of the user data folder's path constrains nothing.
- `executed`, probe 1, `test_tmp_ime.mjs` in the framer's scratch, run once on 2026-11-19 against the app built by `node build.mjs` in a `git clone --no-local` of this worktree at `1c2acea`, on macOS 26.5. The app was started with `electron . --remote-debugging-port=9361 --user-data-dir=<a short folder>` and with `SHELL` set to a script that puts the terminal in raw mode and writes every byte it reads to a file. The probe sent keys and composition through the debugging port with no pause between the calls.
  - A plain key `a` reached the file as `61`.
  - "한글" composed key by key with `Input.imeSetComposition`, each syllable committed with `Input.insertText`, then Enter: the file received `0d` alone. The Korean was lost.
  - The same with Enter's keydown sent before the last syllable's commit: the file received `0d eab880`, Enter and then "글".
  - "하나", where the final consonant of "한" moves to the next syllable, then Space: the file received `20` alone.
  - Composition events made inside the page with `dispatchEvent`, a `CompositionEvent` and an `InputEvent` for "가": the file received nothing, and the textarea's value did not change. The events the debugging port made were trusted (`isTrusted` true) and changed the textarea's value, except `compositionend`, which arrived with `isTrusted` false.
- `executed`, probe 2, `test_tmp_ime_paced.mjs`, the same drive run once with one change: after each key the probe waited for a zero-delay timer of the page and then 40 ms. The page's zero-delay timers took 0 ms and the page was `visible`.
  - "한글" then Enter: the file received `ed959c eab880 0d`, the UTF-8 of "한글" and Enter.
  - "하나" then Space: `ed9598 eb8298 20`, as typed.
  - "한글" with Enter's keydown before the last commit: `ed959c eab880 0d eab880`. "글" arrived twice, once before Enter and once after.
- What the two probes show together: composition driven through the debugging port reaches the process as typed where the steps are paced and the last syllable is committed before Enter's keydown. Without the pace it does not, and with the other order a syllable is doubled. The probes do not show which order a macOS input source produces. `frame/questions.md` Q1 holds that.
- `executed`, probe 3, `test_tmp_spawn.mjs`, run once under the clone's Electron with `ELECTRON_RUN_AS_NODE=1`: that Node is v24.22.3 and holds `WebSocket` and `fetch` as globals, and `process.execPath --version` printed `v45.3.3` with the variable removed from the child's environment and `v24.22.3` with it kept. A vitest case can therefore start the app with the binary it runs in.
- `read`: `trail/phases/phase-2.md` of `1795043695-inbox-first-window` at `edb2a28`: the driven window did not have the system's focus, and `Emulation.setFocusEmulationEnabled` made `document.hasFocus()` true. Both drives above set it.
- `read`, at `5323ebe`: the window's code, `renderer.ts`, `work-item-view.ts`, `view.ts` and `index.html` under `apps/desktop/src/renderer/`.
  - The app starts no terminal. At the daemon's `ready`, `renderer.ts#onMessage` puts the summary screen in front where a work item changed since the last look, and the inbox screen otherwise. A terminal is made only in `work-item-view.ts#terminalFor`, the first time its pane is in front of a work item's view.
  - A pane is opened two ways, both inside a work item. The "New work item" form starts one pane of the kind chosen in it, with the work item (`renderer.ts#createWorkItem`). The view's `#pane-buttons` holds one button per kind the daemon offers, and each starts a pane in the work item on screen (`work-item-view.ts#showPaneButtons`).
  - The form is the dialog `work-item-dialog`. The sidebar's `#new-work-item` button opens it, and so does N with the Command key. Its fields keep the ids `work-item-repo`, `work-item-title`, `work-item-kind` and `work-item-create`. `renderer.ts` preselects in `work-item-kind` the first kind that reports its agent's state, which is `claude` (`apps/desktop/src/daemon/pane-kinds.ts`).
  - At the daemon's `workItemCreated` the window closes the form and calls `openView`. `work-item-view.ts#showView` then calls `pane.term.focus()` for the pane it puts in front.
  - `term.onData` in `terminalFor` sends what the terminal read to the daemon as an `input` message.
  - `document` listens for `keydown` twice. `onCommandKey`, in the capture phase, acts on `KeyK` and `KeyN` only while the Command key is held (`view.ts#commandKey`). `onKey` acts on `KeyJ`, `KeyK` and `Enter`, each read by `code`, only while the summary, the inbox or the history screen is in front, no dialog is open and the focus is in no field (`view.ts#inboxKey`). A terminal's hidden textarea is a field, and a work item's view is none of those three screens, so neither listener acts on a key typed into a pane.
- `executed`, probe 4, `test_tmp_view.mjs` in the framer's scratch for the fold, run once on 2026-11-19 by Node v26.13.1 against the app built by `node build.mjs` in a `git clone --no-local` of this worktree at `5323ebe`, on macOS 26.5. The app was started as in probe 1, on a port the system gave as free at that moment, with a user data folder of the probe's own, and with `OWLERY_WORKTREES` and a repository of one commit under the scratch. The probe set focus emulation and called `focus()` on nothing. After each key it waited for one zero-delay timer of the page, and for no fixed time.
  - At start the inbox screen was in front, the page held no `.xterm-helper-textarea`, the receiver had written no file, and `#pane-buttons` held "+ Shell" and "+ Claude Code".
  - A mouse click on `#new-work-item`, sent with `Input.dispatchMouseEvent`, opened the form with the focus in `work-item-repo`. `work-item-kind` offered `shell` and `claude`, and its value was `claude`.
  - The probe inserted the repository's path and a title with `Input.insertText`, set the value of `work-item-kind` to `shell`, and clicked `work-item-create`. The form closed, `#work-item-view` was in front with one tab, "Shell 1", `document.activeElement` was the page's one `.xterm-helper-textarea`, and the receiver's file existed.
  - "한글" then Enter: the file received `ed959c eab880 0d`. While "하" was composing, the pane's `.composition-view` had the class `active` and the text "하". After the last commit the element had lost `active` and still held the text "글".
  - "어디" then Enter, whose second key is the J key: `ec96b4 eb9494 0d`. After both lines the view was still in front and the focus was still in the textarea.
  - The run folder held no `last-look.json`. The probe sent SIGTERM to the app, and to the daemon by the process id `daemon.json` named. Both had exited two seconds later, and so had the receiver (`ps -p` printed none). The user data folder `/private/tmp/claude-501/owlery-10-rf` was then removed, and `~/.owlery` did not exist.
- `read`, at `5323ebe`: `apps/desktop/test/repositories.ts#temporaryRepository` makes a temporary folder that holds a repository with one commit, names a worktree root beside it, and returns a `remove` for the folder.
- `executed`: `git diff --stat c128acb..5323ebe -- apps/desktop/src apps/desktop/build.mjs apps/desktop/scripts` printed nothing and exited 0. That is the search of scenario 5, run at the commit phase 1 starts from.
- `executed`: `git diff --stat 1c2acea 5323ebe -- docs` printed nothing, so each `from:` line of `## Rule changes` stands in `docs/` as it was quoted.
- `executed`, `ls` at `5323ebe`: no index stands at `docs/README.md`, and `seal/follow-up.md` does not exist. Each `file:` of `## Rule changes` is named as `ls docs` gives it. `gh release view` answered `release not found`, and no `changelog.md` under `seal/threads/` holds a `### Process changes` heading (`executed`, `grep -l`, at `5323ebe`).
- `read`, at `1d2da48`: `trail/phases/phase-1.md` and `gaps.md` whole, and `built-app.ts`, `korean-pane.ts`, `korean-input.test.ts` and `fixtures/receiver.sh` under `apps/desktop/test/`. What phase 1's builder measured, with the outputs in that phase's scratch:
  - The app became the front app at its start. `probe-front-result.json`, opened, names `Electron` as the app in front 0.45 s and again 3.1 s after the probe began, with another app in front between the two.
  - The phase record says that three runs of the case received bytes no step sent, `38` once and `7f` twice, while the owner typed. Their outputs were not opened for this fold.
  - The phase record says that a second app started while "고" was composing in the first app's pane, and that the pane then received a `compositionend` with no `blur` and its process received "고" before "과일". Its output was not opened for this fold.
  - Enter's keydown, the last commit and Enter's keyup, sent with no wait between them, delivered "한글" as typed: `red-enter.txt`, opened, shows every case passing. The whole of Enter replayed before the commit, with a wait between, delivered `ed959c eab880 0d eab880`: `red-enter2.txt`, opened.
  - The builder added a second and a third typing of a line whose composition was found ended with no blur seen, in `korean-input.test.ts#deliver`, and the cases "types a line again where a composition ended that no step ended" and "does not take a composition the window's own code ended for one ended from outside".
- `read`, at `1d2da48`: `apps/desktop/src/main/main.ts#createWindow` makes the window shown, reads nothing of the environment, and is also called at the app's `activate`. `executed`: `git diff --stat c128acb..1d2da48 -- apps/desktop/src apps/desktop/build.mjs apps/desktop/scripts` printed nothing, the search of scenario 5 before the switch is built.
- `read`: `electron.d.ts` of the installed Electron 45.3.3. An app under `app.setActivationPolicy("accessory")` "doesn't appear in the Dock and doesn't have a menu bar, but it may be activated programmatically or by clicking on one of its windows". `showInactive()` "shows the window but doesn't focus on it". `app.isActive()` is true while the app is the active one.
- `executed`, probe 5, `test_tmp_background.mjs` in the framer's scratch for this fold, run once on 2026-11-19 against a `git clone --no-local` of this worktree at `1d2da48`, on macOS 26.5. In the clone alone, `main.ts` was changed to call `app.setActivationPolicy("accessory")` before the app is ready, to create the window with `show: false` and to call `showInactive()`, all where `OWLERY_BACKGROUND` is `1`. The app was started once, with that variable, the receiver of the tree as `SHELL`, and folders of the probe's own.
  - The call of the policy before the app was ready did not throw.
  - `lsappinfo front`, read every 40 ms from before the start until the app had exited, named neither the app nor its daemon at any reading. The main process read `app.isActive()` false and the window's `isFocused()` false at every 50 ms, with `isVisible()` true.
  - `lsappinfo info -only ApplicationType` for the app's process id printed `UIElement`, the type of an app with no Dock icon.
  - Before focus emulation was set, the page read `document.hasFocus()` false and `visibilityState` `visible`, and five zero-delay timers took 0 ms each. With emulation set, `hasFocus()` was true.
  - The pane was reached as in probe 4, and its hidden textarea was the focused element with `focus()` called on nothing.
  - "한글" then Enter: `ed959c eab880 0d`, with the composition view active on "하". "과일" then Enter, with "고" held composing for 2.5 s: `eab3bc ec9dbc 0d`. The composition was still open after the hold, with no `compositionend` and no `blur` during it. The front app did not change during the hold, so the probe does not show what a change of the front app does to such a window.
  - Both processes had exited two seconds after a SIGTERM, the user data folder `/private/tmp/claude-501/owlery-10-rf2` was removed, and `~/.owlery` did not exist.
- `executed`: `grep -n -e 'OWLERY_' docs/*.md README.md` at `1d2da48` printed nothing. No policy document names a variable the app reads, so the switch adds no rule of its own to `docs/`.
- `read`: issue #21's `frame/design.md` at `68dc407`, the lines that name `main.ts`. That work calls `app.dock.setIcon` inside `app.whenReady()` of `apps/desktop/src/main/main.ts`, before `createWindow()`.
- `executed`, after probes 1 to 3: both apps and both daemons had exited (`ps -p` on the recorded process ids printed none), the short user data folder `/private/tmp/claude-501/owlery-10-fr` was removed, and `~/.owlery` did not exist.

## Scope

"The case" is the automated test. "The typed run" is the run a person makes at a release. "The lines" are the texts both type, listed in `## Data & interfaces`.

1. **The case is one file of the desktop suite**, `apps/desktop/test/korean-input.test.ts`, so `pnpm run test` and the broad gate run it with every other case. It builds the app from the tree before it starts it, so it never reads a stale `dist/`. It starts the built app with the binary the suite runs in, and reaches the window through Electron's debugging port.
2. **The case reaches a pane the way a person does.** The app starts no terminal, and the window offers no pane outside a work item. So the case opens the "New work item" form with the sidebar's `#new-work-item` button, gives it a temporary repository and a title, chooses `shell` in `work-item-kind`, where the form preselects `claude`, and presses `work-item-create`. The window then opens that work item's view with the new shell pane in front (`## Grounding`, probe 4). The case opens that one pane and presses no button of `#pane-buttons`. The repository comes from `apps/desktop/test/repositories.ts#temporaryRepository`.
3. **The pane's process is a receiver.** The case sets `SHELL` for the app to `apps/desktop/test/fixtures/receiver.sh`, which puts its terminal in raw mode without echo and writes every byte it reads to the file the case names. What that file holds is what the terminal handed the process. The script exits at once where its input is no terminal, because the daemon also runs `$SHELL` with no terminal to look for `claude`. A Claude Code pane runs `$SHELL` in a terminal, where the script would stay and read, so the case opens no pane of that kind.
4. **The case replays each line's steps through the debugging port** and then reads the receiver's file. A step is one of the calls `## Data & interfaces` lists. After each key's steps the case waits for one zero-delay timer of the page, since a person's keys are never closer than that and the terminal sends composed text from such timers (`## Grounding`, probes 1 and 2). Probe 4 delivered two lines with that wait alone, and no fixed time.
5. **The case passes where every line's bytes are the UTF-8 of its text followed by `0d`.** A failure names the line, the bytes expected and the bytes received, in hex.
6. **The case reads that the composing syllable is on screen.** At one point inside a line, before the syllable is committed, the terminal's composition view is active and holds the syllable being composed. The view is the pane's `.composition-view` element, and the case reads its class `active` together with its text: after a commit the element keeps its last text and loses the class (`## Grounding`, probe 4).
7. **The case does not give the pane the keyboard, and its window does not take the person's.** It reads that the focused element is the pane's hidden textarea once the view is open, and never calls `focus()` on it. It starts the app with the switch of item 14, so the window never holds the system's focus. It sets `Emulation.setFocusEmulationEnabled`, because the page of such a window reports no focus without it (`## Grounding`, probe 5).
8. **The case leaves the person's machine as it found it.** The app gets a user data folder of the case's own under the system's temporary folder, and `OWLERY_WORKTREES` and the repository under folders of the case's own. The debugging port is one the system gave as free at that moment, never a fixed number, so two worktrees that run the gate at once do not meet on a port. In phase 1's measurement a second app ended the first pane's composition as it started and became the front app. Under the switch of item 14 an app the gate starts does not become the front app (`## Grounding`, probe 5). Two gates at once were not run under the switch, and `frame/questions.md` Q2 holds that. After its last line the case stops the app and the daemon it started, each by the process id it recorded, and removes its folders. The daemon's process id is the one `run/daemon.json` under the user data folder names. The daemon does not exit with the app while the receiver runs, so the case stops it. It writes nothing under `~/.owlery` or the person's own application support folder.
9. **The typed run is one command**, `pnpm --filter @owlery/desktop run korean:typed`, which a person runs at each release with a Korean input source selected.
   - It starts the app through the helper the case uses and opens the same pane. It asks the helper to leave `OWLERY_BACKGROUND` as the command's own environment has it, so a person's run opens the app as it ships, with the keyboard. An agent that starts `korean:typed` to verify it sets the variable to `1` in the command's environment. It shows one line at a time, the text and its keys, in a bar it puts over the window through the debugging port, and the person types the line into the pane and presses Enter.
   - It compares the receiver's bytes with the line's by itself. A line whose bytes differ is shown once more, since a slip of the hand is no regression. A second difference fails the line.
   - It ends by itself after the last line, prints each line's verdict, and exits 0 only where every line matched.
   - It sets focus emulation while it fills the "New work item" form, because a window started under `OWLERY_BACKGROUND=1` has no focus and the form would not take the keys, and turns it off before the first line: from then on the person's click gives the pane the keyboard.
10. **The typed run records what the typing produced.** While the person types, it records the keydown, keyup, composition and input events on the pane's textarea, in order. It turns each line's record into steps and replays them at once in the same pane. The replay keeps the pace `apps/desktop/test/korean-pane.ts#Typing.replay` has: it waits after a key's release and before a key's press, and never between a key's press and its release. Phase 1 measured that this difference decides the bytes where Enter's keydown comes before the last commit (`## Grounding`).
    - Where the replay delivers the line's bytes, the fixture's line takes the recorded steps and `source: "typed"`.
    - Where the replay differs although the typing matched, the line keeps its steps, and the fixture's `typedRun` names it under `replayDiffers` with the bytes the replay gave. That is a limit of the debugging port and not a failure of the typed run.
    - The fixture's `typedRun` takes the date and the versions of macOS, Electron and `@xterm/xterm`.
    - From then on the case replays what a person's typing produced. Until the first typed run, every line's steps are written by hand in the order probe 2 delivered, and say `source: "assumed"`.
11. **The recording and the replay are shown to agree without a person.** A case attaches the recorder while it replays one line's steps, turns the record into steps, and replays those: the bytes are the line's again.
12. **The work changes the app's code for the switch of item 14 and for nothing else.** It edits `apps/desktop/src/main/main.ts` and adds `apps/desktop/src/main/background.ts`. Everything else it adds is under `apps/desktop/test/`, plus one script entry of `apps/desktop/package.json`. Where the case fails for another cause in the app's code, the phase stops and reports the cause, and the fix is folded into this frame before anybody builds it.
13. **The pull request does not wait for a person.** The case and the typed run's command are built and verified without one (scenario 6). The first typed run is the owner's, owed by the release that closes milestone 1, and `gaps.md` holds its row until then. The owner may make it before the pull request opens, which takes the row out.
14. **The app starts in the background where `OWLERY_BACKGROUND` is `1` in its environment.** The owner decided the switch on 2026-11-19 (`frame/plan.md` *Judgments of the run*), and probe 5 ran these means.
    - `apps/desktop/src/main/background.ts` holds one function that reads the variable from an environment and imports nothing of Electron. It answers that the app starts in the background for the value `1` alone. Absent, empty or any other value, the app starts as it does today.
    - On macOS, `main.ts` calls `app.setActivationPolicy("accessory")` before the app is ready. The app then has no Dock icon and no menu bar, and its start does not make it the front app.
    - On every platform, `main.ts#createWindow` creates the window with `show: false` and shows it with `showInactive()`. The window is on screen, over the person's windows, and does not hold the keyboard. A window opened again at the app's `activate` is opened the same way.
    - Nothing of the app sets the variable, and no screen of the app names it.
    - `apps/desktop/test/built-app.ts#BuiltApp.start` sets the variable to `1` for the app it starts, unless its caller asks it to leave the caller's own environment's value. The typed run alone asks that (item 9).
    - A person who clicks the window gives it the keyboard, which the policy allows. The case does not prevent that, and a key typed into the case's window after such a click reaches the pane.
15. **The case types no line twice.** A line whose bytes differ fails at its first typing. Where a composition of that line was found ended at a step that needed it open, and the pane's textarea saw no `blur`, the failing line says that something outside the window ended a composition. `apps/desktop/test/korean-pane.ts#Typing.endedFromOutside` gives that reading, and it stays. The second and third typing phase 1 added leave (`## Removes`).

Out of scope, each with its reason:

- **Windows and Linux input methods.** v0.1 is macOS only.
- **Other languages' input methods, and Korean layouts other than the one the person types with.** The lines are Korean, and their `keys` are Dubeolsik's. The typed run records whatever source the person selected.
- **Korean typed into the window's own fields**, the form's title and the "Ask" field. The roadmap names the terminal pane, and those fields are Chromium's own inputs.
- **What a program draws from the bytes**, Claude Code's prompt among them. The owner saw it on 2026-11-18, and the test reads what the terminal hands the process.
- **CI.** The desktop tests run in the local broad gate and in no workflow, and this work does not change that.
- **A window that is not on screen.** Under the switch the app's window still opens over the person's windows for the length of the case, about five seconds in probe 5. A window that is never shown is a page the browser treats as hidden, which no probe drove (`frame/plan.md` *Alternatives considered*).
- **A switch a person is offered.** `OWLERY_BACKGROUND` is for a start that a test or an agent makes. No setting, menu or document for a person names it.
- **The doubled syllable where Enter is pressed and released before the last commit** (probe 2, and phase 1's measurement in `## Grounding`). Whether an input source produces that order is `frame/questions.md` Q1. Where the typed run shows it does, the typed run fails, and the repair is an issue of its own.

## User scenarios & acceptance *(mandatory)*

`<base>` is `c128acb`, the commit of `release/v0.0.1` that merged issue #18 and that this branch was rebased onto.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. Korean composed in a pane reaches the process as typed | Given the built app with one work item whose shell pane runs the receiver, when the case replays a line's steps, then the receiver's file gains the UTF-8 of the line's text and `0d`, for every line | The case, run with `pnpm run test korean-input`. Seen red two ways before it is committed: with the `term.onData` handler of `apps/desktop/src/renderer/work-item-view.ts#terminalFor`, which sends a terminal's data to the daemon, removed in the working tree, where no byte arrives, and with one line's steps reordered so that Enter, its keydown and its keyup, comes before the last commit, where the failure names the doubled syllable |
| 2. The composing syllable is on screen | Given a line replayed up to a syllable that is not committed yet, then the pane's composition view is active and its text is that syllable | The same file's case. Seen red with the step before the reading replaced by a commit |
| 3. The pane has the keyboard without being given it | Given the work item created through the form, when its view opens, then the focused element is the pane's hidden textarea, and the case has called `focus()` on nothing | The same file's case. Seen red with the call `pane.term.focus()` of `apps/desktop/src/renderer/work-item-view.ts#showView` removed in the working tree |
| 4. The case leaves nothing behind | Given the case finished, passing or failing, then the app and the daemon it started have exited and its folders are gone | The case reads both process ids after it stopped them. The phase's builder lists `~/.owlery` and the temporary folder before and after one run |
| 5. The app's code changed for the switch alone | `git diff --stat <base>..HEAD -- apps/desktop/src apps/desktop/build.mjs apps/desktop/scripts` names `apps/desktop/src/main/main.ts` and `apps/desktop/src/main/background.ts` and no other file. At `1d2da48`, before the switch is built, it prints nothing | Executed at each phase's commit |
| 6. A recording replays to the same bytes | Given the recorder attached while a line's steps are replayed, when the record is turned into steps and those are replayed, then the receiver's file gains the line's bytes again | A case, seen red with the recorder's handling of `compositionend` removed. The same phase starts `korean:typed` once and reads that the bar shows the first line and that the command, stopped there, leaves no process |
| 7. A person's typing passes | Given a Korean input source selected, when the owner runs `korean:typed` and types every line, then the command exits 0 and each line of the fixture says `source: "typed"` or is named under `replayDiffers` | The owner alone, at a keyboard: no agent can type through a macOS input source (`frame/questions.md` Q1). Until it is made, a row of `gaps.md` names the owner |
| 8. The case's app stays in the background | Given the app the case started, then the system lists it with the application type `UIElement`, and the page read `document.hasFocus()` false before the case set focus emulation | A case of the same file. It reads `lsappinfo info -only ApplicationType` for the app's process id, and the reading of `hasFocus()` the start kept. No start is made to show it red, because a start without the switch takes the system's focus and no start of this work item leaves the variable out (`frame/plan.md` *Judgments of the run*). Its red stands on two things already in hand. Phase 1 measured the app without the switch as the front app at its start (`## Grounding`, `probe-front-result.json`). Scenario 9's case is seen red under a mutation of `background.ts`, which shows that the switch's reading decides how the app starts. The two readings of this case were therefore never seen failing, and the phase record says so |
| 9. The switch is off unless the variable is `1` | Given an environment without `OWLERY_BACKGROUND`, with it empty, and with it `0` or `true`, then the function of `background.ts` answers that the app starts as it does today. Given `1`, it answers that the app starts in the background | A case in `apps/desktop/test/background.test.ts`, which starts no app. Seen red twice, each by a mutation of `background.ts`: with the comparison replaced by a test for any value that is not empty, where `0` and `true` fail, and with the function answering that the app starts as it does today for every value, where `1` fails |
| 10. A composition ended from outside is named and not typed over | Given a composing syllable committed through the debugging port by no step of the line, then `Typing.endedFromOutside` answers true, and the case has typed the line once. Given the textarea blurred by the window's own code instead, it answers false | Two cases of the same file: phase 1's "types a line again where a composition ended that no step ended", rewritten to read the answer and the one typing, and its "does not take a composition the window's own code ended for one ended from outside", kept. Seen red as `trail/phases/phase-1.md` *Seen red* shows for each: the note that a composition was found ended set to false, and the count of blurs dropped |

## Data & interfaces

No protocol or schema of the app changes. The app's main process gains the switch of *Scope* item 14, in `apps/desktop/src/main/main.ts`. The work adds these files.

| File | Holds |
|---|---|
| `apps/desktop/src/main/background.ts` | The function that reads `OWLERY_BACKGROUND` from an environment |
| `apps/desktop/test/background.test.ts` | The case of scenario 9 |
| `apps/desktop/test/korean-input.test.ts` | The cases of scenarios 1 to 4, 6, 8 and 10, the cases of the typed run's verdict functions and of `endNow`, which start no app, and the typed run, which runs only where `OWLERY_KOREAN_TYPED` is `1` |
| `apps/desktop/test/fixtures/korean-input.json` | The lines and, once a person typed, `typedRun` |
| `apps/desktop/test/fixtures/receiver.sh` | The pane's process of *Scope* item 3 |
| `apps/desktop/test/built-app.ts` | Building, starting and stopping the app, with the switch set, and the debugging port's session. It names nothing Korean, so another work item's case or measurement can start the app through it |
| `apps/desktop/test/korean-pane.ts` | Opening the receiver's pane, the steps, the replay and, from phase 2, the recorder and the typed run's helpers: `stepsOf`, `typedTwice`, `fixtureAfter`, `formatFixture`, `verdicts`, `versions`, `barText`, `showBar` and `withEnter` |

`apps/desktop/package.json` gains the script `korean:typed`, which sets `OWLERY_KOREAN_TYPED=1` and runs that one test file through `scripts/test-in-electron.mjs`.

**The lines.** Each line of the fixture holds `text`, `keys`, `steps` and `source`. `keys` is what the person presses, by the keys' places on the keyboard in the Dubeolsik layout, and the bar shows it beside the text.

| `text` | `keys` | What it exercises |
|---|---|---|
| `한글` | g k s r m f | A syllable built over three keys, committed by the next syllable's first consonant |
| `하나` | g k s k | A final consonant that moves to the next syllable |
| `갑시다` | r k q t l e k | A double final consonant that splits when a vowel follows |
| `과일` | r h k d l f | A vowel made of two keys |
| `어디` | d j e l | The J key. With the K key of the other lines and the Enter that ends each line, the lines press every key the window reads by its place on the summary, inbox and history screens |
| `한 글` | g k s Space r m f | Space ends a composition |
| `한1` | g k s 1 | A digit typed under the Korean source ends a composition |
| `글.` | r m f . | A punctuation mark does the same |
| `할` | g k s Backspace f | Backspace inside a composition removes one consonant and sends nothing |
| `안녕하세요 반갑습니다` | d k s s u d g k t p d y Space q k s r k q t m q s l e k | A whole sentence, with a space inside it |

Every line ends with Enter. A line of `source: "assumed"` holds no Enter in its steps, and the case adds it (`withEnter`). A line of `source: "typed"` holds the person's Enter in its steps where the recorder saw it, so the order of Enter and the last syllable's commit, which `frame/questions.md` Q1 asks about, stays in the record.

**The steps.** One step is one call of the debugging port. A recorded event becomes the step on its row.

| Step | The call | The recorded event it comes from |
|---|---|---|
| A key the input source takes | `Input.dispatchKeyEvent`, `rawKeyDown`, with `windowsVirtualKeyCode` 229 and the key's `code` | A `keydown` with key code 229 |
| A composing text | `Input.imeSetComposition` with the text | A `compositionupdate` |
| A committed text | `Input.insertText` with the text | A `compositionend`, or an `input` of type `insertText` outside a composition |
| A plain key | `Input.dispatchKeyEvent`, `keyDown`, with the key's own code, `key`, `code` and text | A `keydown` with any other key code |
| A key released | `Input.dispatchKeyEvent`, `keyUp` | A `keyup` |

The recorder is listeners the typed run adds to the pane's textarea through `Runtime.evaluate`. The app's code holds none of it.

## Rule changes

- remove
  file: docs/roadmap.md
  section: Open decisions
  from: | How the Korean input regression test runs | Automated composition events / a script a person types at each release | Whether an automated test reproduces what a person's typing produces ([Measure before building](architecture.md#measure-before-building)) |

- remove
  file: docs/roadmap.ko.md
  section: 결정을 남겨 둔 것
  from: | 한글 입력 회귀 테스트를 돌리는 법 | 조합 이벤트를 자동으로 넣음 / 릴리스마다 사람이 정해진 문장을 침 | 자동 테스트가 사람이 칠 때 생기는 것을 그대로 재현하는가([만들기 전에 잴 것](architecture.ko.md#만들기-전에-잴-것)) |

- add
  file: docs/roadmap.md
  section: Milestones
  to: **The Korean input regression test runs two ways, and each covers what the other cannot.** A case in the desktop app's checks starts the built app with `OWLERY_BACKGROUND=1`, under which the app's window opens without taking the keyboard and without a Dock icon, opens a terminal pane, replays Korean composition into it through Electron's debugging port, and reads the bytes the pane's process received. It runs with every run of the checks and guards the pane's own code: the terminal component's handling of composition, the window, the daemon and the pseudo-terminal. It does not stand for the macOS input source. So at each release a person runs `pnpm --filter @owlery/desktop run korean:typed` and types the same lines with a Korean input source. That run compares the bytes by itself and records the events the typing produced, and the case replays those from then on. A replay alone was not chosen, because the bytes it delivers depend on the order of the events it is given, and only a person's typing shows the order an input source produces (probed 2026-11-19).
    check: apps/desktop/test/korean-input.test.ts

- add
  file: docs/roadmap.ko.md
  section: 마일스톤
  to: **한글 입력 회귀 테스트는 두 가지로 돌리고, 하나가 못 보는 것을 다른 하나가 봅니다.** 데스크톱 앱의 검사에 든 테스트 하나가 빌드한 앱을 `OWLERY_BACKGROUND=1`로 띄웁니다. 이 값이 있으면 앱의 창은 키보드를 가져가지 않고 Dock 아이콘 없이 열립니다. 테스트는 이어서 터미널 칸을 열고, Electron의 디버깅 포트로 한글 조합을 그 칸에 다시 넣은 뒤, 칸의 프로세스가 받은 바이트를 읽습니다. 이 테스트는 검사를 돌릴 때마다 돌고, 칸 자체의 코드를 지킵니다. 터미널 컴포넌트의 조합 처리, 창, 데몬, 가상 터미널이 그것입니다. macOS의 입력기를 대신하지는 못합니다. 그래서 릴리스마다 사람이 `pnpm --filter @owlery/desktop run korean:typed`를 돌리고, 한글 입력기로 같은 줄들을 칩니다. 이 실행은 바이트를 스스로 비교하고, 칠 때 생긴 이벤트를 기록하며, 그 뒤로는 테스트가 그 기록을 다시 넣습니다. 자동으로 다시 넣는 것만으로 정하지 않은 까닭은, 그렇게 넣어 전달되는 바이트가 넣는 이벤트의 순서에 달려 있고, 입력기가 내는 순서는 사람이 쳐야만 드러나기 때문입니다(2026-11-19에 확인).
    check: apps/desktop/test/korean-input.test.ts

- change
  file: docs/roadmap.md
  section: Done criteria
  from: | The Korean input regression test passes | The test's result at the 0.1.0 release |
  to: | The Korean input regression test passes | At the 0.1.0 release, the replayed case passes in the app's checks, and the typed run a person makes for that release exits without a failed line ([Milestones](#milestones)) |

- change
  file: docs/roadmap.ko.md
  section: 완료 기준
  from: | 한글 입력 회귀 테스트가 통과합니다 | 0.1.0 릴리스에서 나온 그 테스트의 결과를 봅니다 |
  to: | 한글 입력 회귀 테스트가 통과합니다 | 0.1.0 릴리스에서, 다시 넣는 테스트가 앱의 검사에서 통과하고, 그 릴리스를 위해 사람이 친 실행이 실패한 줄 없이 끝났는지 봅니다([마일스톤](#마일스톤)) |

## Removes

The rows are what the switch, the one mechanism the work adds to the app, takes out in return. Beyond them the work takes no file, case or sentence out of the tree. The roadmap's open row leaves at the settle, by the `remove` operations of `## Rule changes`. The two Korean cases of `apps/desktop/test/pty.test.ts` stay: they pin the pseudo-terminal's UTF-8 alone, and without them a failure of the new case would not say which layer broke.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The second and third typing of a line whose composition was found ended from outside | `apps/desktop/test/korean-input.test.ts#deliver` at `1d2da48`: the `for` loop over `attempt`, its `continue`, and the words on three attempts in the failing line | It can go. Phase 1 added it because an app's start took the system's focus and ended a composition in a window that held it. The switch of *Scope* item 14 removes that cause: under it the app was at no reading the front app (`## Grounding`, probe 5). What it caught is the compositions those starts ended, in phase 1's own runs. Kept, it would type over a fault of the window's code that ends a composition with no blur, as `trail/phases/phase-1.md` says of it. The reading it stood on, `Typing.endedFromOutside`, stays and names the cause in the failing line (*Scope* item 15) |
| The case that reads a line typed twice | `apps/desktop/test/korean-input.test.ts`, "types a line again where a composition ended that no step ended", at `1d2da48` | It is rewritten as the first case of scenario 10, which reads the answer of `Typing.endedFromOutside` and one typing |
Framed 2026-11-19 by framer, before the build.
