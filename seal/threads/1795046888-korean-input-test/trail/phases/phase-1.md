# Phase 1: 1795046888-korean-input-test

## What this phase found

**The phase was built in two parts, around one fold of the frame.** The first part ended at `bdaf5b0` with the case committed and the phase open, on the finding of the next paragraph. The owner then chose a switch in the app, the framer folded it at `bca24bf`, and the second part built the switch and closed the phase at `99f668a`.

**Without the switch, the app's window takes the system's focus at every start, and that breaks the case on a machine a person is working at.** Measured in the first part, at the trees of `c350028` to `0b04f2c`, with no `OWLERY_BACKGROUND`. Judged against `frame/plan.md` *Technical context*, "The failure scenario of the chosen approach", as it stood at `fa2d82a`.

- `executed`, probe `test_tmp_front.test.ts`, run once at `166327e`'s tree and removed: `lsappinfo front`, polled every 40 ms, named `Electron` as the app in front 0.45 s after the probe began, the owner's app 1.0 s later, `Electron` again 3.1 s after the probe began and the owner's app 0.5 s after that. The result is `probe-front-result.json` in this phase's scratch.
- `executed`, probe `test_tmp_focus2.test.ts`, run once and removed: with "고" composing in a pane, a second app started. 0.3 s later the first pane's textarea received a `compositionend` with the data "고" and no `blur`, `document.hasFocus()` stayed true, and the receiver's file gained `eab3a0 eab3bc ec9dbc 0d`, "고" before "과일". A composition held 1.5 s with no second app stayed open. The result is `probe-focus-result.json`. A first writing of this probe, `test_tmp_focus.test.ts`, printed its result where the runner did not show it, so the probe ran twice.
- `executed`: three runs of the unchanged case failed on bytes no step sent. One received `38` after a line, the digit 8. Two received `7f`, which a Backspace key sends. The owner was typing, and the keys went to the pane because the window had the keyboard. The outputs are `k2.txt`, `k3.txt` and `k4.txt`.

**Under the switch the app stayed in the background in this phase's runs.** `executed`, at `99f668a`'s tree: the case "stays in the background" read `"ApplicationType"="UIElement"` from `lsappinfo info -only ApplicationType <pid>` and `document.hasFocus()` false before focus emulation, and every line arrived as typed in the one run of the *Phase boundary* set (`boundary1.txt`). The frame's probe 5 is the measurement that the app is at no reading the front app. This phase read the front app in no run under the switch.

**Scenario 8's two readings were never seen failing.** `frame/plan.md` *Judgments of the run* withholds a start without the variable, and a mutation of `built-app.ts`'s line that sets it, or of `main.ts`'s policy or `showInactive()`, is such a start. Their red stands, as the frame says, on the measurement above and on scenario 9's case. `main.ts` has no case of its own: no case can import a module that imports Electron.

**The frame holds.** Every path of `frame/design.md` *Grounding* that the phase reads was opened at `fa2d82a`, and the fold's at `bca24bf`, and each is where the frame says. `app.setActivationPolicy("accessory")` before the app is ready, `show: false` and `showInactive()` behaved in the built app as probe 5 says.

**The files.** `apps/desktop/src/main/background.ts` holds `startsInBackground`, and `main.ts` reads it once at load. `apps/desktop/test/background.test.ts` is scenario 9's case. `apps/desktop/test/korean-input.test.ts` is the case. `test/built-app.ts` builds, starts and stops the app and holds the debugging port's session. `test/korean-pane.ts` opens the receiver's pane and holds the steps and the replay. `test/fixtures/receiver.sh` and `test/fixtures/korean-input.json` are the frame's.

**Decisions made while building.** Each is the work's, judged against `frame/design.md` *Scope* and *Data & interfaces*.

- **A step is an object with a `type`**: `imeKey`, `compose`, `commit`, `key` or `keyUp`, one per row of the steps table. A line's `steps` is one flat list, so a recording of phase 2 can become one without grouping.
- **The pace is derived from the steps.** The replay waits for one zero-delay timer of the page after every `keyUp`, before every `imeKey` or `key`, and after the last step, once where two meet. That is probe 4's pace: the last commit of a line stands between two waits.
- **The assumed steps of Space, a digit and a full stop** are a commit of the open syllable, a wait, then a plain key with its text. Backspace inside a composition is an `imeKey` followed by the shorter composing text.
- **The receiver writes its process id** to `<file>.pid`, so the last case reads the receiver gone as well as the app and the daemon. The frame asks for the two.
- **The kind `shell` is set on the field through `Runtime.evaluate`**, as probe 4 did. The field's menu is the system's own and the debugging port does not reach it.
- **A case reads that the view holds one tab, "Shell 1"**, which pins *Scope* item 2's choice of kind.
- **The receiver's exit without a terminal has a case of its own.** The daemon looks for `claude` only at the first use of the adapter (`daemon/adapters/claude.ts`, the `found ??= lookup()` line), which the case never reaches, so nothing else ran that line of the script.
- **The wait for the first screen reads `document.getElementById(id)?.hidden`.** The session can open before the page holds its elements, and one run failed there.
- **`BuiltApp.start` takes `keepBackground`** for *Scope* item 14's caller that leaves the variable as its own environment has it. No run of this phase passed it, since such a start may take the focus. Phase 2's typed run is its one caller.
- **`BuiltApp` keeps `document.hasFocus()` as the session opened**, in `focusedAtStart`, and gives the app's process id as `pid`. Scenario 8's case reads both.
- **How an outside end is found.** `korean-pane.ts#Typing` asks the page, at each step that continues or commits a composition, whether one is still open, and counts the textarea's `blur` events. A first version counted `compositionend` events against the commits, and missed the case where an outside end turns a later commit into a plain insert and the counts agree (`n4.txt`).
- **The second and third typing of a line, built in the first part, left in the second**, as `frame/design.md` *Removes* names. `deliver` types a line once and adds to its failing line that something outside the window ended a composition. No case reads that added sentence: scenario 10's first case reads the answer of `Typing.endedFromOutside`, which the sentence is written from.

**Enter before the last commit does not always double the syllable.** With Enter's keydown, the commit and Enter's keyup sent with no wait between them, "한글" arrived as typed (`red-enter.txt`). With the whole of Enter before the commit and a wait between, the file received `ed959c eab880 0d eab880` (`red-enter2.txt`). Both ran without the switch.

**Seen red.** Each run is in this phase's scratch, at the tree of the commit named. The rows at `c350028` and `0b04f2c` ran without the switch, before the fold. The plan's row does not ask them again.

| Case | How it was shown red | What the failing line said |
|---|---|---|
| Scenario 1, the lines | `term.onData` of `work-item-view.ts#terminalFor` removed in the working tree, at `c350028`'s tree | `the line "한글": expected ed959ceab8800d, received nothing`, and the same for every line |
| Scenario 1, the order | "한글" with Enter before the last commit, at `c350028`'s tree | `received ed959ceab8800deab880` |
| Scenario 2 | the composing step replaced by a commit, at `c350028`'s tree | `expected { active: false, text: '하' } to deeply equal { active: true, text: '하' }` |
| Scenario 3 | `pane.term.focus()` of `#showView` removed in the working tree, at `c350028`'s tree | `expected false to be true` |
| One shell pane | `seal mutate`: the kind's choice removed, at `c350028` | `expected [ 'Claude Code 1' ] to deeply equal [ 'Shell 1' ]` |
| The pace | `seal mutate`: the wait replaced by `Promise.resolve()`, at `0b04f2c` | `the line "한글": … received 0d` |
| Raw mode | `seal mutate`: `stty raw -echo` to `stty -echo`, at `0b04f2c` | every line red, `received ed959ceab8800a` for "한글" at `c350028` |
| Scenario 10, an outside end | `seal mutate`: `this.ended = true` to `false`, at `0b04f2c`, against the case as it then read a second typing | `received ed9598ed959ceab8800d` |
| Scenario 10, a blur | `seal mutate`: the blur count dropped, at `0b04f2c` | `expected true to be false` |
| Scenario 9, any value | `seal mutate`: the comparison replaced by `Boolean(env.OWLERY_BACKGROUND)`, at `99f668a` | the values `0` and `true`: `expected true to be false` |
| Scenario 9, the value 1 | `seal mutate`: the function answering `false`, at `99f668a` | `expected false to be true` |
| The receiver without a terminal | `seal mutate`: the guard removed, at `99f668a` | `expected true to be false`, the receiver's file existed |
| The daemon stopped | `seal mutate`: the daemon's process id left out of `built-app.ts#end`, at `99f668a`, under the switch | `expected [ 15098, 15186 ] to deeply equal []`. Both processes were then stopped by those ids |

Scenario 10's first case was rewritten at `99f668a` to read the answer and one typing. The rewritten case passed, and it was not run against the mutation again, as the plan's row allows. Before the switch's case existed, `background.test.ts` failed on the missing module (`bg-red.txt`).

**Scenario 5.** `git diff --stat 7159499..HEAD -- apps/desktop/src apps/desktop/build.mjs apps/desktop/scripts` at `99f668a`, run again after the rebase onto `7159499`, names `apps/desktop/src/main/background.ts` and `apps/desktop/src/main/main.ts` and no other file. The two edits of `work-item-view.ts` made for the reds were taken back with `Edit`.

**Scenario 4, listed once more under the switch.** The names in `/private/tmp/claude-501` and the absence of `~/.owlery` were the same before and after the run of the *Phase boundary* set (`before2.txt`, `after2.txt`), and `pgrep -fl 'owlery-app-|receiver.sh'` printed nothing after it.

**The *Phase boundary* set** was `pnpm run test korean-input background.test`, run once at `99f668a`'s tree: 2 files, 23 cases, all passing. No other test file reads a path the phase changed, and the repository has no guide that names tree-wide test files.

**The runs used `TMPDIR=/private/tmp/claude-501`**, so the case's folders stood where the orchestrator asked. The case itself reads `os.tmpdir()`.

**Starts of the app.** The first part started it 48 times without the switch. The second part started it 5 times, each with `OWLERY_BACKGROUND=1`: once for the *Phase boundary* set, twice for the daemon's mutation and its baseline, and twice where `-t receiver`, meant to select the receiver's case alone, also matched the last case's name and so ran the app's `beforeAll`.

**For the next phase.** `Typing.replay` takes a line's steps in parts, which the typed run's recorder can use. A filter by `-t` on `korean-input.test.ts` starts the app wherever it matches a case of the second `describe`.
