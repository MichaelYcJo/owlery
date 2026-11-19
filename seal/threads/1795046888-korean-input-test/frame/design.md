# Design: the Korean input regression test runs and passes

The ticket is issue #10.

## Grounding

The tree as read at `1c2acea`. The window the test types into is the one issue #18 rebuilds, so the window's code and issue #18's frame were read at `edb2a28`, the tip of `feat/18-the-app-opens-on-a-pane-of-terminals` on 2026-11-19, where phases 1 to 3 of that work are closed and phase 4 is not (`frame/plan.md` *Overlap with the release*).

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

- `executed`: `gh issue view 10 --json body,comments,title` on 2026-11-19 gave no comment. The issue's one *Done when* line asks that the test runs, passes, and that the way it runs is written into `docs/roadmap.md` in place of the open row.
- `read`: `seal/threads/1795010335-terminal-pane/gaps.md`, whole. Its closed row holds what the owner saw on 2026-11-18: `echo 안녕하세요` printed the word as typed, `printf '%s' "한글 조합 테스트" | xxd` printed the UTF-8 of the string, and Korean typed at Claude Code's prompt showed as typed. Its *Not done* says that CI does not run the desktop tests: `.github/workflows/hygiene.yml` runs the plugin's checks only, and the broad gate runs the desktop tests locally.
- `read`: `apps/desktop/test/pty.test.ts`, the cases "shows a command's UTF-8 output, Korean included" and "delivers what the person types to the process". They write whole Korean strings to the pseudo-terminal. No case composes a syllable, and no case loads the window.
- `executed`: `git grep -n -i -e 'remote-debugging' -e 'webSocketDebuggerUrl' -e 'dispatchKeyEvent' -e 'imeSetComposition' -e 'compositionstart' -e 'CompositionEvent' <commit> -- apps package.json .github` printed nothing and exited 1 at `1c2acea` and at `edb2a28`. `git grep -c -e 'ELECTRON_RUN_AS_NODE' 1c2acea -- apps` printed four files, so the path is searched. Nothing in the tree starts the built app and drives it: each drive of issues #5 to #8 and #18 was a probe in a builder's scratch (`seal/threads/1795042041-headless-session/trail/phases/phase-2.md`, and `trail/phases/phase-2.md` of `1795043695-inbox-first-window` at `edb2a28`).
- `read`: `apps/desktop/package.json` pins `@xterm/xterm` 6.0.0 and `electron` 45.3.3. Its `test` script runs vitest inside Electron's Node through `scripts/test-in-electron.mjs`, and `check` is the typecheck and that script. `seal/config.json`'s `Broad gate` runs `pnpm -r run check`, so a case of the desktop suite runs at every broad gate.
- `read`: `@xterm/xterm` 6.0.0, `src/browser/input/CompositionHelper.ts`, whole. The terminal takes a composed text by reading the value of its hidden textarea, between positions it noted at `compositionstart` and in a zero-delay timer after each `compositionupdate`. It sends the text from a zero-delay timer after `compositionend`. A keydown whose key code is neither 229 nor a modifier's, arriving while a composition is open or its send is pending, sends the textarea's text at once and cancels the pending send. So what the pane's process receives depends on the order of the keydown, composition and input events and on timers running between them.
- `read`: the pane's process and the place of the app's files are chosen from outside the app's code. `apps/desktop/src/daemon/pty.ts#loginShell` runs `$SHELL -l` for a shell pane. `apps/desktop/src/main/main.ts` puts the daemon's run folder under Electron's user data folder, which `--user-data-dir` chooses. `apps/desktop/src/daemon/worktrees.ts` reads `OWLERY_WORKTREES`. The daemon exits where the hook socket's path is over macOS's cap of 104 bytes (issue #19).
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
- `read`: `apps/desktop/src/renderer/renderer.ts` at `edb2a28`: `showView` calls `pane.term.focus()` for the pane in front, the "New work item" form keeps the ids `new-work-item`, `work-item-repo`, `work-item-title`, `work-item-kind` and `work-item-create`, and `document` listens for `keydown` in `onKey`, which `view.ts#inboxKey` reads by `code` only while the inbox screen is in front and the focus is in no field.
- `executed`: `node -p 'require("os").tmpdir().length'` printed 48 on this machine. A folder `owlery-ko-XXXXXX` made there, with `/run/hooks.sock` under it, has a path of 80 bytes, under the cap.
- `read`: no index stands at `docs/README.md`, and `seal/follow-up.md` does not exist. Each `file:` of `## Rule changes` is named as `ls docs` gives it. `gh release view` answered `release not found`, and no `changelog.md` under `seal/threads/` holds a `### Process changes` heading (`executed`, `grep`).
- `executed`, after the probes: both apps and both daemons had exited (`ps -p` on the recorded process ids printed none), the short user data folder `/private/tmp/claude-501/owlery-10-fr` was removed, and `~/.owlery` did not exist.

## Scope

"The case" is the automated test. "The typed run" is the run a person makes at a release. "The lines" are the texts both type, listed in `## Data & interfaces`.

1. **The case is one file of the desktop suite**, `apps/desktop/test/korean-input.test.ts`, so `pnpm run test` and the broad gate run it with every other case. It builds the app from the tree before it starts it, so it never reads a stale `dist/`. It starts the built app with the binary the suite runs in, and reaches the window through Electron's debugging port.
2. **The case reaches a pane the way a person does.** It creates a work item on a temporary repository through the window's "New work item" form, with a shell pane. After issue #18, the window then opens that work item's view with the new pane in front (`frame/design.md` *Scope* item 7 of `1795043695-inbox-first-window`).
3. **The pane's process is a receiver.** The case sets `SHELL` for the app to `apps/desktop/test/fixtures/receiver.sh`, which puts its terminal in raw mode without echo and writes every byte it reads to the file the case names. What that file holds is what the terminal handed the process. The script exits at once where its input is no terminal, because the daemon also runs `$SHELL` to look for `claude`.
4. **The case replays each line's steps through the debugging port** and then reads the receiver's file. A step is one of the calls `## Data & interfaces` lists. After each key's steps the case waits for one zero-delay timer of the page, since a person's keys are never closer than that and the terminal sends composed text from such timers (`## Grounding`, probes 1 and 2).
5. **The case passes where every line's bytes are the UTF-8 of its text followed by `0d`.** A failure names the line, the bytes expected and the bytes received, in hex.
6. **The case reads that the composing syllable is on screen.** At one point inside a line, before the syllable is committed, the terminal's composition view is active and holds the syllable being composed.
7. **The case does not give the pane the keyboard.** It reads that the focused element is the pane's hidden textarea once the view is open, and never calls `focus()` on it. It sets `Emulation.setFocusEmulationEnabled`, because the window it starts may not have the system's focus.
8. **The case leaves the person's machine as it found it.** The app gets a user data folder of the case's own under the system's temporary folder, with a path short enough for the hook socket, and `OWLERY_WORKTREES` and the repository under folders of the case's own. The debugging port is one the system gave as free at that moment, never a fixed number, so two worktrees can run the gate at once. After its last line the case stops the app and the daemon it started, each by the process id it recorded, and removes its folders. It writes nothing under `~/.owlery` or the person's own application support folder.
9. **The typed run is one command**, `pnpm --filter @owlery/desktop run korean:typed`, which a person runs at each release with a Korean input source selected.
   - It starts the app as the case does and opens the same pane. It shows one line at a time, the text and its keys, in a bar it puts over the window through the debugging port, and the person types the line into the pane and presses Enter.
   - It compares the receiver's bytes with the line's by itself. A line whose bytes differ is shown once more, since a slip of the hand is no regression. A second difference fails the line.
   - It ends by itself after the last line, prints each line's verdict, and exits 0 only where every line matched.
   - It does not set focus emulation: the person's click gives the pane the keyboard.
10. **The typed run records what the typing produced.** While the person types, it records the keydown, keyup, composition and input events on the pane's textarea, in order. It turns each line's record into steps and replays them at once in the same pane.
    - Where the replay delivers the line's bytes, the fixture's line takes the recorded steps and `source: "typed"`.
    - Where the replay differs although the typing matched, the line keeps its steps, and the fixture's `typedRun` names it under `replayDiffers` with the bytes the replay gave. That is a limit of the debugging port and not a failure of the typed run.
    - The fixture's `typedRun` takes the date and the versions of macOS, Electron and `@xterm/xterm`.
    - From then on the case replays what a person's typing produced. Until the first typed run, every line's steps are written by hand in the order probe 2 delivered, and say `source: "assumed"`.
11. **The recording and the replay are shown to agree without a person.** A case attaches the recorder while it replays one line's steps, turns the record into steps, and replays those: the bytes are the line's again.
12. **The work changes no file of the app.** Everything it adds is under `apps/desktop/test/`, plus one script entry of `apps/desktop/package.json`. Where the case fails for a cause in the app's code, the phase stops and reports the cause, and the fix is folded into this frame before anybody builds it.
13. **The pull request does not wait for a person.** The case and the typed run's command are built and verified without one (scenario 6). The first typed run is the owner's, owed by the release that closes milestone 1, and `gaps.md` holds its row until then. The owner may make it before the pull request opens, which takes the row out.

Out of scope, each with its reason:

- **Windows and Linux input methods.** v0.1 is macOS only.
- **Other languages' input methods, and Korean layouts other than the one the person types with.** The lines are Korean, and their `keys` are Dubeolsik's. The typed run records whatever source the person selected.
- **Korean typed into the window's own fields**, the form's title and the "Ask" field. The roadmap names the terminal pane, and those fields are Chromium's own inputs.
- **What a program draws from the bytes**, Claude Code's prompt among them. The owner saw it on 2026-11-18, and the test reads what the terminal hands the process.
- **CI.** The desktop tests run in the local broad gate and in no workflow, and this work does not change that.
- **A hidden window for the case.** It would need a switch in `apps/desktop/src/main/main.ts`. The gate opens the app's window for the length of the case.
- **The doubled syllable where Enter's keydown comes before the last commit** (probe 2). Whether an input source produces that order is `frame/questions.md` Q1. Where the typed run shows it does, the typed run fails, and the repair is an issue of its own.

## User scenarios & acceptance *(mandatory)*

`<base>` is the commit of `release/v0.0.1` this branch merges before phase 1's first edit, which holds issue #18.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. Korean composed in a pane reaches the process as typed | Given the built app with one work item whose shell pane runs the receiver, when the case replays a line's steps, then the receiver's file gains the UTF-8 of the line's text and `0d`, for every line | The case, run with `pnpm run test korean-input`. Seen red two ways before it is committed: with the window's handler that sends a terminal's data to the daemon removed, where no byte arrives, and with one line's steps reordered so that Enter's keydown comes before the last commit, where the failure names the doubled syllable |
| 2. The composing syllable is on screen | Given a line replayed up to a syllable that is not committed yet, then the pane's composition view is active and its text is that syllable | The same file's case. Seen red with the step before the reading replaced by a commit |
| 3. The pane has the keyboard without being given it | Given the work item created through the form, when its view opens, then the focused element is the pane's hidden textarea, and the case has called `focus()` on nothing | The same file's case. Seen red with the call that focuses the pane in front removed from the window's code |
| 4. The case leaves nothing behind | Given the case finished, passing or failing, then the app and the daemon it started have exited and its folders are gone | The case reads both process ids after it stopped them. The phase's builder lists `~/.owlery` and the temporary folder before and after one run |
| 5. No file of the app changed | `git diff --stat <base>..HEAD -- apps/desktop/src apps/desktop/build.mjs apps/desktop/scripts` prints nothing | Executed at each phase's commit |
| 6. A recording replays to the same bytes | Given the recorder attached while a line's steps are replayed, when the record is turned into steps and those are replayed, then the receiver's file gains the line's bytes again | A case, seen red with the recorder's handling of `compositionend` removed. The same phase starts `korean:typed` once and reads that the bar shows the first line and that the command, stopped there, leaves no process |
| 7. A person's typing passes | Given a Korean input source selected, when the owner runs `korean:typed` and types every line, then the command exits 0 and each line of the fixture says `source: "typed"` or is named under `replayDiffers` | The owner alone, at a keyboard: no agent can type through a macOS input source (`frame/questions.md` Q1). Until it is made, a row of `gaps.md` names the owner |

## Data & interfaces

No protocol, schema or file of the app changes. The work adds these files.

| File | Holds |
|---|---|
| `apps/desktop/test/korean-input.test.ts` | The cases of scenarios 1 to 4 and 6, and the typed run, which runs only where `OWLERY_KOREAN_TYPED` is `1` |
| `apps/desktop/test/fixtures/korean-input.json` | The lines and, once a person typed, `typedRun` |
| `apps/desktop/test/fixtures/receiver.sh` | The pane's process of *Scope* item 3 |
| Helpers under `apps/desktop/test/`, named by the phase | Starting and stopping the built app, the debugging port's session, the replay and the recorder |

`apps/desktop/package.json` gains the script `korean:typed`, which sets `OWLERY_KOREAN_TYPED=1` and runs that one test file through `scripts/test-in-electron.mjs`.

**The lines.** Each line of the fixture holds `text`, `keys`, `steps` and `source`. `keys` is what the person presses, by the keys' places on the keyboard in the Dubeolsik layout, and the bar shows it beside the text.

| `text` | `keys` | What it exercises |
|---|---|---|
| `한글` | g k s r m f | A syllable built over three keys, committed by the next syllable's first consonant |
| `하나` | g k s k | A final consonant that moves to the next syllable |
| `갑시다` | r k q t l e k | A double final consonant that splits when a vowel follows |
| `과일` | r h k d l f | A vowel made of two keys |
| `한 글` | g k s Space r m f | Space ends a composition |
| `한1` | g k s 1 | A digit typed under the Korean source ends a composition |
| `글.` | r m f . | A punctuation mark does the same |
| `할` | g k s Backspace f | Backspace inside a composition removes one consonant and sends nothing |
| `안녕하세요 반갑습니다` | d k s s u d g k t p d y Space q k s r k q t m q s l e k | A whole sentence, with a space inside it |

Every line ends with Enter, which the case and the typed run add.

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
  to: **The Korean input regression test runs two ways, and each covers what the other cannot.** A case in the desktop app's checks starts the built app, opens a terminal pane, replays Korean composition into it through Electron's debugging port, and reads the bytes the pane's process received. It runs with every run of the checks and guards the pane's own code: the terminal component's handling of composition, the window, the daemon and the pseudo-terminal. It does not stand for the macOS input source. So at each release a person runs `pnpm --filter @owlery/desktop run korean:typed` and types the same lines with a Korean input source. That run compares the bytes by itself and records the events the typing produced, and the case replays those from then on. A replay alone was not chosen, because the bytes it delivers depend on the order of the events it is given, and only a person's typing shows the order an input source produces (probed 2026-11-19).
    check: apps/desktop/test/korean-input.test.ts

- add
  file: docs/roadmap.ko.md
  section: 마일스톤
  to: **한글 입력 회귀 테스트는 두 가지로 돌리고, 하나가 못 보는 것을 다른 하나가 봅니다.** 데스크톱 앱의 검사에 든 테스트 하나가 빌드한 앱을 띄우고, 터미널 칸을 열고, Electron의 디버깅 포트로 한글 조합을 그 칸에 다시 넣은 뒤, 칸의 프로세스가 받은 바이트를 읽습니다. 이 테스트는 검사를 돌릴 때마다 돌고, 칸 자체의 코드를 지킵니다. 터미널 컴포넌트의 조합 처리, 창, 데몬, 가상 터미널이 그것입니다. macOS의 입력기를 대신하지는 못합니다. 그래서 릴리스마다 사람이 `pnpm --filter @owlery/desktop run korean:typed`를 돌리고, 한글 입력기로 같은 줄들을 칩니다. 이 실행은 바이트를 스스로 비교하고, 칠 때 생긴 이벤트를 기록하며, 그 뒤로는 테스트가 그 기록을 다시 넣습니다. 자동으로 다시 넣는 것만으로 정하지 않은 까닭은, 그렇게 넣어 전달되는 바이트가 넣는 이벤트의 순서에 달려 있고, 입력기가 내는 순서는 사람이 쳐야만 드러나기 때문입니다(2026-11-19에 확인).
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

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| nothing | | The work adds a case and a command and takes no file, case or sentence out of the tree. The roadmap's open row leaves at the settle, by the `remove` operations of `## Rule changes`. The two Korean cases of `apps/desktop/test/pty.test.ts` stay: they pin the pseudo-terminal's UTF-8 alone, and without them a failure of the new case would not say which layer broke |

Framed 2026-11-19 by framer, before the build.
