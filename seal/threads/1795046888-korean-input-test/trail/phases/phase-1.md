# Phase 1: 1795046888-korean-input-test

## What this phase found

**The phase is built and not closed.** The case is committed at `4d45397`, and its row of `frame/plan.md` *Phases* keeps an empty Status. The build stopped on the finding of the next paragraph, on the orchestrator's instruction of 2026-11-19 to start the app no more than the row's verification needs. The run of the *Phase boundary* set was not made. `gaps.md` holds what is open.

**The app's window takes the system's focus at every start, and that breaks the case on a machine a person is working at.** `frame/design.md` *Scope* item 7 and `frame/plan.md` *Technical context* expect a window that may lack the system's focus. They do not expect what the runs showed. Judged against `frame/plan.md` *Technical context*, "The failure scenario of the chosen approach".

- `executed`, probe `test_tmp_front.test.ts`, run once at `4d45397`'s parent tree and removed: `lsappinfo front`, polled every 40 ms, named `Electron` as the app in front 0.45 s after the start, the owner's app 1.0 s later, `Electron` again 2.7 s after the start and the owner's app 0.5 s after that. The result is `probe-front-result.json` in this phase's scratch.
- `executed`, probe `test_tmp_focus2.test.ts`, run once and removed: with "고" composing in a pane, a second app started. 0.3 s later the first pane's textarea received a `compositionend` with the data "고" and no `blur`, `document.hasFocus()` stayed true, and the receiver's file gained `eab3a0 eab3bc ec9dbc 0d`, "고" before "과일". A composition held 1.5 s with no second app stayed open. The result is `probe-focus-result.json`.
- `executed`: three runs of the unchanged case failed on bytes no step sent. One received `38` after a line, the digit 8. Two received `7f`, which a Backspace key sends. The owner was typing, and the keys went to the pane because the window had the keyboard. The outputs are `k2.txt`, `k3.txt` and `k4.txt`.
- So the case fails where a person types or clicks during its six seconds, and two worktrees that run the gate at once end each other's compositions, against *Scope* item 8. The person also loses the keyboard at every run of the gate.

**A way out that was not tried.** `/usr/bin/open -g -n -a <Electron.app> --env … --args …` starts an app without bringing it to the foreground, and `open` on this macOS lists `-g` and `--env` (`executed`, `open --help`). The app would then not be this process's child: its process id would have to be read from the debugging port's listener, and its environment would be the one a Finder start has plus the variables named. Whether a window started that way composes, stays behind and never takes the keyboard is `unverified`: it needs a start of the app, and the orchestrator's instruction withholds an exploratory one. The other way is a window the app does not show or activate, which `frame/design.md` puts out of scope because it needs a switch in `apps/desktop/src/main/main.ts`. Which of the two the work takes is a decision for the frame.

**The frame holds for what was built.** Every path of `frame/design.md` *Grounding* that the phase reads was opened at `5d1e437` and is where the frame says: `apps/desktop/src/renderer/work-item-view.ts#terminalFor` and `#showView`, the form's ids in `index.html`, `daemon/pty.ts#loginShell`, `daemon/discovery.ts`, `daemon/worktrees.ts`, `test/repositories.ts#temporaryRepository` and `scripts/test-in-electron.mjs`. The framer's `test_tmp_view.mjs` was read for its calls.

**The files.** `apps/desktop/test/korean-input.test.ts` is the case. `test/built-app.ts` builds, starts and stops the app and holds the debugging port's session, and names nothing Korean, so issue #9 can start the app through it. `test/korean-pane.ts` opens the receiver's pane and holds the steps and the replay. `test/fixtures/receiver.sh` and `test/fixtures/korean-input.json` are the frame's.

**Decisions made while building.** Each is the work's, judged against `frame/design.md` *Scope* and *Data & interfaces*.

- **A step is an object with a `type`**: `imeKey`, `compose`, `commit`, `key` or `keyUp`, one per row of the steps table. A line's `steps` is one flat list, so a recording of phase 2 can become one without grouping.
- **The pace is derived from the steps.** The replay waits for one zero-delay timer of the page after every `keyUp`, before every `imeKey` or `key`, and after the last step, once where two meet. That is probe 4's pace: the last commit of a line stands between two waits.
- **The assumed steps of Space, a digit and a full stop** are a commit of the open syllable, a wait, then a plain key with its text. Backspace inside a composition is an `imeKey` followed by the shorter composing text.
- **The receiver writes its process id** to `<file>.pid`, so the last case reads the receiver gone as well as the app and the daemon. The frame asks for the two.
- **The kind `shell` is set on the field through `Runtime.evaluate`**, as probe 4 did. The field's menu is the system's own and the debugging port does not reach it.
- **A case reads that the view holds one tab, "Shell 1"**, which pins *Scope* item 2's choice of kind.
- **The receiver's exit without a terminal has a case of its own.** The daemon looks for `claude` only at the first use of the adapter (`daemon/adapters/claude.ts`, the `found ??= lookup()` line), which the case never reaches, so nothing else ran that line of the script.
- **The wait for the first screen reads `document.getElementById(id)?.hidden`.** The session can open before the page holds its elements, and one run failed there.
- **A line is typed again where a composition ended from outside**, three times at most. This is a departure from the frame, which names no second typing. `korean-pane.ts#Typing` asks the page, at each step that continues or commits a composition, whether one is still open, and counts the textarea's `blur` events. A line is typed again only where a composition was found ended and no blur was seen. A first version counted `compositionend` events against the commits, and missed the case where an outside end turns a later commit into a plain insert and the counts agree (`n4.txt`). The cost: a fault of the window's own code that ends a composition without a blur, and less often than three times in a row, is typed over. It does not help against a person's keys reaching the pane. Where the window stops taking the focus, this may be more than the case needs, and the frame decides whether it stays.

**Enter's keydown before the last commit does not always double the syllable.** With Enter's keydown, the commit and Enter's keyup sent with no wait between them, "한글" arrived as typed (`red-enter.txt`). With the whole of Enter before the commit and a wait between, the file received `ed959c eab880 0d eab880` (`red-enter2.txt`). Phase 2's replay of a recorded order turns on that difference, and `frame/questions.md` Q1 stays open.

**Seen red.** Each run is in this phase's scratch, at the tree of the commit named.

| Case | How it was shown red | What the failing line said |
|---|---|---|
| Scenario 1, the lines | `term.onData` of `work-item-view.ts#terminalFor` removed in the working tree, at `2f693fd`'s tree | `the line "한글": expected ed959ceab8800d, received nothing`, and the same for every line |
| Scenario 1, the order | "한글" with Enter before the last commit, at `2f693fd`'s tree | `received ed959ceab8800deab880` |
| Scenario 2 | the composing step replaced by a commit, at `2f693fd`'s tree | `expected { active: false, text: '하' } to deeply equal { active: true, text: '하' }` |
| Scenario 3 | `pane.term.focus()` of `#showView` removed in the working tree, at `2f693fd`'s tree | `expected false to be true` |
| One shell pane | `seal mutate`: the kind's choice removed, at `2f693fd` | `expected [ 'Claude Code 1' ] to deeply equal [ 'Shell 1' ]` |
| The pace | `seal mutate`: the wait replaced by `Promise.resolve()`, at `4d45397` | `the line "한글": … received 0d` |
| Raw mode | `seal mutate`: `stty raw -echo` to `stty -echo`, at `4d45397` | `received ed959ceab8800a` at `2f693fd`, and every line red at `4d45397` |
| A line typed again | `seal mutate`: `this.ended = true` to `false`, and the `continue` removed, at `4d45397` | `received ed9598ed959ceab8800d` |
| A blur is not an outside end | `seal mutate`: the blur count dropped, at `4d45397` | `expected true to be false` |

Both edits of `apps/desktop/src` were taken back with `Edit`, and `git diff --stat c128acb..HEAD -- apps/desktop/src apps/desktop/build.mjs apps/desktop/scripts` printed nothing at `4d45397`.

**Not shown red.** The receiver's guard `[ -t 0 ] || exit 0` survived `seal mutate` at `2f693fd`, before its case existed. The run against the case at `4d45397` had no baseline, because the owner's keys failed the unchanged case, and it was not made again. The daemon's stop in `built-app.ts#end` was not mutated. `gaps.md` holds both.

**Scenario 4, listed once.** Before and after the first run, `~/.owlery` did not exist, and the temporary folder held no `owlery-` entry after it. The folder gained `node-compile-cache`, which Node's own compile cache writes for the runner. After each later run, the failing ones among them, `pgrep -fl 'owlery-app-|receiver.sh'` printed nothing.

**The runs used `TMPDIR=/private/tmp/claude-501`**, so the case's folders stood where the orchestrator asked. The case itself reads `os.tmpdir()`.

**For the next phase.** `Typing.replay` takes a line's steps in parts, which the typed run's recorder can use. The app was started 48 times in this phase, and each start took the owner's keyboard.
