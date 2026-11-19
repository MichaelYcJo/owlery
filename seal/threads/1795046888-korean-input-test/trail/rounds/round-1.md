# Review round 1: 1795046888-korean-input-test

```seal
target: c1fef54 against f42ab46
```

The diff was read as `git diff f42ab46...HEAD`, three dots, at `c1fef54`. The part no party had reviewed is the app's main process: `apps/desktop/src/main/main.ts` and the new `apps/desktop/src/main/background.ts`. The test files under `apps/desktop/test/` and the work item's records were read whole as well. No earlier round exists, so nothing is carried from one. Facts carried from other parties without being re-established here are named under *Carried, not re-established*.

The findings run in this order. Findings 1 and 2 are defects of the switch in the shipped app. Finding 3 is a case that fails for no defect at the next `@xterm/xterm` upgrade. Findings 4 to 6 are sentences of the records that the tree at `c1fef54` contradicts, two of them left by the rebase onto `7159499` and its remap.

## Findings

### 1. Closing the window of a background start leaves a running app with no window, no Dock icon and no menu bar

```seal
severity: should
location: `apps/desktop/src/main/main.ts:78-81`, `apps/desktop/src/main/background.ts`, `apps/desktop/test/background.test.ts`
evidence: read `apps/desktop/src/main/main.ts:17-19`, `apps/desktop/src/main/main.ts:73-81`, `apps/desktop/node_modules/electron/electron.d.ts:1789-1803`, `seal/threads/1795046888-korean-input-test/frame/design.md:109-115`, `seal/threads/1795046888-korean-input-test/frame/plan.md:26`
```

Why it matters: under `OWLERY_BACKGROUND=1` on macOS the app runs with the accessory activation policy (`main.ts:19`). Electron's own description of that policy says the app "doesn't appear in the Dock and doesn't have a menu bar, but it may be activated programmatically or by clicking on one of its windows" (`electron.d.ts:1795-1797`). The window keeps its close button (`titleBarStyle: "hiddenInset"`, `main.ts:28`). When a person clicks it, `window-all-closed` runs `if (process.platform !== "darwin") app.quit();` (`main.ts:78-81`), so on macOS the app stays. It then has no window to click, no Dock icon and no menu bar. The `activate` handler (`main.ts:73-75`) cannot help, because nothing can activate the app. The process runs until someone finds it in Activity Monitor or kills it.

Who meets it: `frame/plan.md:87`, *Judgments of the run* row 4, says that "every later start an agent makes on a person's machine uses it". The window opens over the person's windows (`frame/design.md:112`), and a person who did not ask for it closes it. `frame/plan.md:26` names the cost of a person who sets the variable ("whose window they have to click") and not this one. `frame/design.md` *Scope* item 14 says nothing of what the app does when its last window closes. The case never closes the window, and stops the app by its process id, so no case meets it.

The fix keeps the decision out of `main.ts`, which no case can import (`frame/plan.md:48`), so a case pins it as scenario 9 pins the switch. It touches `main.ts` and `background.ts` alone, so scenario 5 stays as written. The statements the fix pass also owes are listed after the snippet.

```ts
// apps/desktop/src/main/background.ts, after startsInBackground
/**
 * True where the app quits once its last window closes. On macOS the app
 * stays, as a Mac app does, but in the background it has no Dock icon and no
 * menu bar, so with no window nothing would reach it.
 */
export function quitsWithLastWindow(platform: NodeJS.Platform, background: boolean): boolean {
  return platform !== "darwin" || background;
}

// apps/desktop/src/main/main.ts, the import and the handler
import { quitsWithLastWindow, startsInBackground } from "./background";

app.on("window-all-closed", () => {
  // The sessions stay in the daemon.
  if (quitsWithLastWindow(process.platform, background)) app.quit();
});

// apps/desktop/test/background.test.ts
import { quitsWithLastWindow, startsInBackground } from "../src/main/background";

describe("quitsWithLastWindow", () => {
  it("quits on macOS in the background, where no Dock icon or menu bar reaches the app", () => {
    expect(quitsWithLastWindow("darwin", true)).toBe(true);
  });

  it("stays on macOS as it ships, and quits on another platform", () => {
    expect(quitsWithLastWindow("darwin", false)).toBe(false);
    expect(quitsWithLastWindow("linux", false)).toBe(true);
  });
});
```

The snippet does not reach these statements, and the fix pass owes them too: `frame/design.md:110`, which says `background.ts` holds one function; a bullet of *Scope* item 14 (`frame/design.md:109-115`) that says what the app does when its last window closes in the background; the row of `background.ts` in *Data & interfaces* (`frame/design.md:152`); scenario 9's row or a new row (`frame/design.md:143`); the cost at `frame/plan.md:26`; and the third bullet of `changelog.md` (`changelog.md:7`). The frame's files are the framer's or the orchestrator's to fold. The first case is seen red with the `|| background` taken out.

### 2. The switch passes from the app to its daemon and to every pane's process

```seal
severity: should
location: `apps/desktop/src/main/main.ts:17`, `apps/desktop/src/main/background.ts`, `apps/desktop/test/background.test.ts`
evidence: executed `git grep -n 'OWLERY_BACKGROUND\|ELECTRON_RUN_AS_NODE' HEAD -- apps/desktop/src apps/desktop/scripts`; read `apps/desktop/src/main/daemon-client.ts:50-54`, `apps/desktop/src/daemon/pty.ts:12-49`, `apps/desktop/src/daemon/pty.ts:60-67`, `seal/threads/1795046888-korean-input-test/frame/design.md:31`, `seal/threads/1795046888-korean-input-test/frame/design.md:126`
```

Why it matters: `main.ts:17` reads `OWLERY_BACKGROUND` and leaves it in `process.env`. `ensureDaemon` starts the daemon with `env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", OWLERY_RUN_DIR: runDir }` (`daemon-client.ts:53`). Every pane's process then gets `terminalEnv(...)` of that environment (`pty.ts:66`). `terminalEnv` drops only the names of `INHERITED_ONLY` and its prefixes (`pty.ts:18-31`), and the variable is not among them. The search above prints the variable in `background.ts` alone, so nothing else in the app removes it.

`pty.ts:12-17` states the rule this variable falls under: "Variables that describe the process the app was started from rather than the user's configuration" leave a pane's environment. A background start is exactly such a fact of the start. The daemon outlives the app while a pane's process runs (`frame/design.md:31`), and a later app that uses the same run folder reuses that daemon (`daemon-client.ts:43-44`). So after an agent's background start that opened a pane, every pane a person opens through that daemon runs with `OWLERY_BACKGROUND=1`. An Owlery started from such a pane, by `pnpm start` for one, opens with no Dock icon and no menu bar. `frame/design.md:126` says no setting, menu or document for a person names the variable, so that person has nothing to find the cause by.

The fix takes the variable out of the main process's environment once it is read, so that no child inherits it. It touches `main.ts` and `background.ts` alone, and a case pins it. Its precondition: nothing reads `OWLERY_BACKGROUND` after `main.ts` loads, which the search above shows.

```ts
// apps/desktop/src/main/background.ts, after startsInBackground
/**
 * Reads the switch and takes it out of `env`, so that the daemon the app
 * starts, and every pane's process that daemon starts, runs without it.
 */
export function takeBackground(env: NodeJS.ProcessEnv): boolean {
  const background = startsInBackground(env);
  delete env.OWLERY_BACKGROUND;
  return background;
}

// apps/desktop/src/main/main.ts:17
const background = takeBackground(process.env);

// apps/desktop/test/background.test.ts
describe("takeBackground", () => {
  it("answers as startsInBackground and leaves the environment without the variable", () => {
    const env: NodeJS.ProcessEnv = { OWLERY_BACKGROUND: "1", HOME: "/Users/x" };
    expect(takeBackground(env)).toBe(true);
    expect(env).toEqual({ HOME: "/Users/x" });
  });
});
```

The snippet does not reach these statements, and the fix pass owes them too: `frame/design.md:110`, which says `background.ts` holds one function; a bullet of *Scope* item 14 that says the app hands the variable to no process it starts; the row of `background.ts` in *Data & interfaces* (`frame/design.md:152`); `frame/plan.md:74`, *Operational impact*; and `changelog.md:7`. The case is seen red with the `delete` line taken out.

### 3. A case of the typed run's versions fails at the next `@xterm/xterm` upgrade, with no defect

```seal
severity: should
location: `apps/desktop/test/korean-input.test.ts:286-288`
evidence: read `apps/desktop/test/korean-input.test.ts:286-288`, `apps/desktop/test/korean-pane.ts:413-422`, `apps/desktop/package.json:20`, `seal/threads/1795046888-korean-input-test/frame/plan.md:37`
```

Why it matters: the case expects `xterm: "6.0.0"`, a literal. `versions` reads the version from the installed package (`korean-pane.ts:415`), and the electron field of the same case reads `process.versions.electron`, not a literal. The pull request that moves `@xterm/xterm` therefore fails this case although nothing is wrong. That pull request is the one `frame/plan.md:37` names as the reason the replayed case runs at every gate: "A change of the window, of `@xterm/xterm` or of Electron that breaks composition". A failure there that names no composition defect is read and dismissed, which is the cost `frame/plan.md:18` warns of.

The fix reads the pin `apps/desktop/package.json:20` holds. Its precondition is that the pin stays an exact version, as it is now; a range such as `^6.0.0` would fail the case.

```ts
it("reads the versions a typed run is recorded with", () => {
  const pinned = (JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { dependencies: Record<string, string> }).dependencies["@xterm/xterm"];
  expect(versions(new Date(2026, 10, 20))).toEqual({ date: "2026-11-20", macos: expect.stringMatching(/^\d+\.\d+/), electron: process.versions.electron, xterm: pinned });
});
```

### 4. The remap says scenario 8's runs were at trees they were not, and that no case asserts on #21's Dock icon lines

```seal
severity: should
location: `seal/threads/1795046888-korean-input-test/frame/plan.md:89`, `seal/threads/1795046888-korean-input-test/trail/phases/phase-1.md:7`, `seal/threads/1795046888-korean-input-test/trail/phases/phase-1.md:9`, `seal/threads/1795046888-korean-input-test/trail/phases/phase-1.md:13`, `seal/threads/1795046888-korean-input-test/trail/phases/phase-1.md:38`, `seal/threads/1795046888-korean-input-test/trail/phases/phase-1.md:42-45`, `seal/threads/1795046888-korean-input-test/trail/phases/phase-1.md:62`, `seal/threads/1795046888-korean-input-test/gaps.md:15`
evidence: executed `git diff <pre-rebase> <post-rebase>` against `git diff c128acb 7159499` for the eleven pairs 2f693fd/c350028, 68617b2/166327e, 4d45397/0b04f2c, 1d2da48/bdaf5b0, 1b5ef35/99f668a, 4cfa8c8/0ddacf7, 0c36926/f77c8b8, 5d1e437/fa2d82a, 458908a/bca24bf, ad909e5/6ca6d38, b09bf63/34f6024; `git diff --numstat c128acb 7159499 -- apps/desktop/src/main/main.ts`; `git diff --stat 436ed3c HEAD -- apps`; `grep -n tree` over the work item's `gaps.md`, `changelog.md` and both phase records; read `apps/desktop/test/korean-input.test.ts:107-111`, `apps/desktop/src/main/main.ts:65-71`, `seal/threads/1795046888-korean-input-test/guarantee.md:11`, `seal/threads/1795046888-korean-input-test/trail/gate.md:4`
```

Why it matters: the remap commit `c1fef54` renamed each build commit to the one the rebase made, and *Judgments of the run* row 6 (`frame/plan.md:89`) says the runs named at a build commit "ran on that commit's tree before the rebase, which differs from the named commit's by #21's merge alone". That holds: each of the eleven pairs differs by exactly `git diff c128acb 7159499`. But the row ends: "seven lines of `apps/desktop/src/main/main.ts` that set the Dock icon, none of which a case asserts on". Scenario 8's case is titled "stays in the background: no Dock icon" and asserts the application type of an app with no Dock icon (`korean-input.test.ts:107-111`). #21's seven lines are `app.dock?.setIcon` inside `whenReady` (`main.ts:65-71`). So the one case the difference could change is the one the row says does not exist.

The phase records still state the trees the row corrects, so the correction stands beside the sentences it corrects (contract rule 19). `phase-1.md:13` says scenario 8 read `UIElement` "at `99f668a`'s tree". That run had `1b5ef35`'s tree, which holds no `setIcon`. `phase-1.md:38` says each run is "at the tree of the commit named". The same wording stands at `phase-1.md:7`, `:9`, `:42` to `:45`, `:62` and `gaps.md:15`. The list was made by `grep -n tree` over the work item's records that hold runs. A run named bare, "at `99f668a`", is covered by the row's general sentence and is not on it.

The fact itself holds where the records do not say so. `trail/gate.md:4` records the broad run at `7a63177`, a tree after the rebase that holds both the switch and `setIcon`, and `guarantee.md:11` records the sealer's start at `436ed3c`, whose `main.ts` is HEAD's, with scenario 8 reading `UIElement`. `guarantee.md` is replaced at the next seal, so the records lose that sentence then.

```text
frame/plan.md:89, row 6, replace "none of which a case asserts on. The broad run at HEAD runs the cases again on the tree that holds both" with:
Scenario 8's case asserts the application type of an app with no Dock icon, and #21's lines set the Dock icon. That case read `UIElement` on a tree that holds both in the broad run at `7a63177` and in the sealer's start at `436ed3c`, and the broad run at HEAD runs it again.

trail/phases/phase-1.md:13, replace "`executed`, at `99f668a`'s tree:" with:
`executed`, at `99f668a`'s patch on `c128acb`, a tree without #21's `app.dock?.setIcon`:

trail/phases/phase-1.md:38, replace "at the tree of the commit named" with:
at the named commit's patch on `c128acb`, as `frame/plan.md` *Judgments of the run* row 6 states

trail/phases/phase-1.md:7, :9, :42, :43, :44, :45, :62 and gaps.md:15, replace each "at `<commit>`'s tree" or "at the trees of" with the same "patch on `c128acb`" wording
```

### 5. The plan's row on #23 says either may merge first, and omits that #23's scenario 8 waits on this work's switch

```seal
severity: should
location: `seal/threads/1795046888-korean-input-test/frame/plan.md:69`
evidence: executed `git diff --stat 436ed3c HEAD -- apps`; `git diff --stat 7159499 f42ab46 -- apps`; read `seal/threads/1795048706-trust-question/frame/design.md:44`, `seal/threads/1795048706-trust-question/frame/design.md:77`, `seal/threads/1795048706-trust-question/frame/plan.md:38`
```

Why it matters: the row's *Merges first* cell reads "either", and its last cell says "Where #23 changes the 'New work item' form or its kinds, the later of the two rewrites the case's first step". #23 merged first: `f42ab46` is this branch's base. It changed `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/src/shared/protocol.ts` and `apps/desktop/test/daemon.test.ts` alone, a silent start for kinds that report state, so the form and the shell pane the case opens are as they were. #23's merged records also say its scenario 8, the drawn window, is not run "and the orchestrator answers it once the switch lands" (`seal/threads/1795048706-trust-question/frame/design.md:44`, `:77`), and "Scenario 8 of this work waits on that switch reaching `release/v0.0.1`" (`seal/threads/1795048706-trust-question/frame/plan.md:38`). This row is where the orchestrator reads this work's overlap with #23, and it holds neither fact. Once this work merges, nothing in its records says that #23's scenario 8 is now due.

```text
frame/plan.md:69, Merges first: #23, which merged first (pull request #82, `f42ab46`)
frame/plan.md:69, Grounds: #23 changed `src/daemon/daemon.ts` and `src/shared/protocol.ts`, a silent start for the kinds that report state, which the shell pane the case opens is not, and no step of the case. #23's records leave its scenario 8, the drawn window, to the orchestrator once this work's switch reaches `release/v0.0.1` (`seal/threads/1795048706-trust-question/frame/design.md` *Grounding*, the bullet "No agent starts the app").
```

### 6. Two quotes of `pr.md` are not the words of the rows they cite

```seal
severity: should
location: `seal/threads/1795046888-korean-input-test/pr.md:3`, `seal/threads/1795046888-korean-input-test/pr.md:7`
evidence: executed a comparison of each quote of `pr.md` with the Judgment cell of the row its coordinate names, whitespace collapsed, by `python3` over `frame/plan.md`; read `seal/threads/1795046888-korean-input-test/frame/plan.md:84-88`
```

Why it matters: `skills/code-review/orchestration.md` *The pull request body's first part is the work item's `pr.md`* says `pr.md` holds quotes of the records and no sentence of the orchestrator's own. The quotes of rows 5 and 1 stand word for word in their cells. These two do not.

- `pr.md:3` reads "The app gains `OWLERY_BACKGROUND=1`, under which its window opens". Row 4's cell (`frame/plan.md:87`) reads "The app gains a switch, read from its environment, under which its window opens", and it ends "and every later start an agent makes on a person's machine uses it", which the quote drops.
- `pr.md:7` reads "This work merges before #9 and after #18". Row 2's cell (`frame/plan.md:85`) reads "This work merges before #9, after #18".

The orchestrator owns `pr.md`. Where finding 1 or 2 changes a row this file quotes, the orchestrator rewrites the quote again.

```text
- The app gains a switch, read from its environment, under which its window opens without taking the system's focus and, on macOS, without a Dock icon; the case starts the app with it, and every later start an agent makes on a person's machine uses it
  `seal/threads/1795046888-korean-input-test/frame/plan.md` *Judgments of the run*, row 4, Judgment
- This work merges before #9, after #18
  `seal/threads/1795046888-korean-input-test/frame/plan.md` *Judgments of the run*, row 2, Judgment
```

## Confirmations

What matched: `apps/desktop/src/main/background.ts:11-13` answers true for `1` alone, and `apps/desktop/test/background.test.ts` holds scenario 9's five values. Executed: `node scripts/test-in-electron.mjs background.test` in `apps/desktop`, 5 passed, with no app started.

What matched: `apps/desktop/src/main/main.ts:16-19` and `:31` and `:40` are *Scope* item 14's three means. The policy is set at load, before `whenReady`; the window is created with `show: !background` and shown with `showInactive()`. A window made again at `activate` goes through the same `createWindow` (`main.ts:73-75`). Read.

What matched: the case's background start. `apps/desktop/test/built-app.ts:127` sets the variable to `1` unless the caller passes `keepBackground`, and the typed run is the one caller that passes it (`apps/desktop/test/korean-input.test.ts:325`). `korean-input.test.ts:339-341` sets focus emulation for the form and turns it off before the first line, as *Scope* item 9 says. Read.

What matched: scenario 5 at HEAD. `git diff --stat f42ab46...HEAD -- apps/desktop/src apps/desktop/build.mjs apps/desktop/scripts` names `background.ts` and `main.ts` alone. The same command at `bdaf5b0` prints nothing and exits 0, and at `99f668a` and `0ddacf7`, with `f42ab46...` and with `7159499..`, names the same two files. Executed.

What matched: the two commands the remap rewrote in `frame/design.md` *Grounding*. `git diff --stat 7159499..7c50be2` (`frame/design.md:61`) and `git diff --stat 7159499..bdaf5b0` (`frame/design.md:70`) over the three paths print nothing and exit 0. Executed. The records do not say who first ran them in this form, and the result holds now.

What matched: every backticked hash in the work item's directory resolves. Each one outside `guarantee.md` is an ancestor of HEAD, except `4d7f0a0`, which `frame/plan.md:67` cites on #9's branch, and `git branch -a --contains 4d7f0a0` names `perf/9-nobody-measured-four-visible-terminals`. Executed. `ed91bb6` and `1c2acea` differ by this work item's `routing.md` alone, and `c128acb` and `5323ebe` by this work item's four frame and routing files alone, as row 6 says of a tree that was read. Executed. `git diff c128acb 7159499 -- apps/desktop/src/renderer` prints nothing, so probe 4's window is `7159499`'s, as `frame/design.md:7` says. Executed.

What matched: `frame/plan.md:69` cites #23's frame at `2d76a35`, and that commit's `frame/plan.md:36` holds the sentence on issue #10 the row says was read. Executed, `git show`.

What matched: the cases of the typed run that need no app. `node scripts/test-in-electron.mjs korean-input -t "the typed run, without a person"`: 13 passed, 20 skipped, no app started, and `pgrep -fl owlery-app-` printed nothing after it. Executed.

What matched: both rows of `frame/design.md` *Removes*. `deliver` (`korean-input.test.ts:87-94`) types a line once and holds no loop over attempts, and the case "types a line again where a composition ended that no step ended" is gone; its successor is `korean-input.test.ts:144-153`. Read.

What matched: the helpers *Data & interfaces* lists for `korean-pane.ts`, `stepsOf`, `typedTwice`, `fixtureAfter`, `formatFixture`, `verdicts`, `versions`, `barText`, `showBar` and `withEnter`, all stand in it. The fixture holds the ten lines of the table, each `source: "assumed"`. Read and executed (`python3` over the fixture).

What matched: the changelog's bullets against the code. Ten lines; the typed run shows a line again once and fails it at a second difference (`korean-pane.ts:354-358`); it exits 0 only where every line matched (`korean-input.test.ts:362-367`). Read. The "about nine seconds" is carried from `guarantee.md:32`.

What matched: the quotes of rows 1 and 5 in `pr.md` stand word for word in their cells. Executed. No `pr.<lang>.md` is owed, since `seal/config.json` names English for both language keys.

What matched: #23's merge changed `apps/desktop/src/daemon/daemon.ts` and `apps/desktop/src/shared/protocol.ts` for the kinds that report state (`git diff 436ed3c HEAD -- apps/desktop/src`). The shell pane the case opens reports no state, so the case's path is the one the sealer's starts at `436ed3c` ran. Executed and read.

Each new test was read against its group. `background.test.ts` and the cases of `endNow`, `stepsOf`, `typedTwice`, `fixtureAfter`, `formatFixture`, `verdicts`, `barText` and `Received.typed` cover functions no earlier case covers. The two Korean cases of `apps/desktop/test/pty.test.ts` write whole strings to the pseudo-terminal and compose nothing, so none of the new cases repeats them. The test files declare no `TARGET` (`git grep TARGET -- apps/desktop/test` printed nothing), so `seal layout --pairs` has no pairs to print.

`main.ts`'s three lines of the switch have no case and no mutant, and scenario 8's two readings were never seen failing. `gaps.md:7` names both, and `frame/plan.md:88` withholds the start that would show them. This round accepts that judgment as written and adds no finding for it.

`guarantee.md` stands at its own target, `436ed3c`, and names the commits before the rebase as what they were then. `trail/gate.md:4` records a broad run at `7a63177`, before `f42ab46`'s merge and `c1fef54`. Neither is current at HEAD. The next broad run and the next sealer replace both.

## Carried, not re-established

| Fact | Source |
|---|---|
| Scenario 8 reads `UIElement` and `document.hasFocus()` false on a tree whose `main.ts` is HEAD's, with #21's `app.dock?.setIcon` beside the switch | the sealer's start 1, `guarantee.md:11` |
| The case passes as a whole at a tree holding the switch and #21's merge | the broad run, `trail/gate.md:4` |
| Under the switch the app is at no reading the front app, and composes | probe 5, `frame/design.md:72-79` |
| Every seen-red row of both phase records | `trail/phases/phase-1.md:40-54`, `trail/phases/phase-2.md:37-51` |
| The window is open about nine seconds while the case runs | `guarantee.md:32` |

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck and the broad gate at `c1fef54`, which holds #23's daemon change beside this work. The suite is `unverified` here, by contract rule 2 | `seal/config.json` `Broad gate` | the orchestrator, at the broad run |
| Whether key equivalents such as Command-V reach a window under the accessory policy, with no menu bar shown | `apps/desktop/src/main/main.ts:19` | the owner, at the keyboard; it needs a start a person clicks into |
| Whether two gates at once, or a person's change of the front app, end a composition under the switch | `frame/questions.md` Q2 | a measurement, by whoever first sees the failing line |
| What the typed run does after its first bar | `gaps.md:12` | the owner, at the typed run |

## Probes

No probe file was written. The app was started no time in this round. The commands that ran are named on each finding's `evidence:` line and under *Confirmations*.

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs background.test`, in `apps/desktop`, with `TMPDIR` set to the session's temporary folder | 1 file, 5 passed, exit 0 |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs korean-input -t "the typed run, without a person"`, in `apps/desktop`, with the same `TMPDIR` | 13 passed, 20 skipped, exit 0; no app started |
