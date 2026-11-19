# Review round 2: 1795046888-korean-input-test

```seal
target: f03c848, fixes c1fef54..f03c848
```

This is the verifying round of round 1's fix pass. The code read is the diff of the fixes, `git diff c1fef54 f03c848`: `cb3344d`, `8fde593`, `236f00e`, `d4514d7` and the orchestrator's fold at `f03c848`. Beside that bound, the work item's `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `f03c848`, and both phase records and round 1 after them. The runs were made in a `git clone --no-local` of the worktree at `f03c848`, under this round's scratch, with dependencies installed by `pnpm install --offline --frozen-lockfile` and Electron's binary unpacked from its cache into the clone. The app was started no time.

Each of round 1's six closes holds in the tree. One new finding: the fold made item 14 hold two bullets that no earlier stage built, and two sentences still give the whole item to probe 5 and to phase 1.

## Findings

### 1. Two sentences still give the whole of item 14 to probe 5 and to phase 1, after the fold added two bullets that only the fix pass built

```seal
severity: should
location: `seal/threads/1795046888-korean-input-test/frame/design.md:109`, `seal/threads/1795046888-korean-input-test/frame/plan.md:55`, `seal/threads/1795046888-korean-input-test/frame/plan.md:59`
evidence: executed `git show bca24bf:seal/threads/1795046888-korean-input-test/frame/design.md | grep -n -i -e "takes the variable out" -e "last window"` (exit 1, no line); `git show 99f668a:apps/desktop/src/main/main.ts | grep -n -e takeBackground -e window-all-closed -A2`; `grep -n -E "item 14|items 1 to 8|these means|those means|scenario 9|scenarios 9|8 to 10"` over the work item's frame, `gaps.md`, `changelog.md`, `pr.md` and both phase records; read `seal/threads/1795046888-korean-input-test/frame/design.md:72-79`, `seal/threads/1795046888-korean-input-test/frame/design.md:109-117`, `seal/threads/1795046888-korean-input-test/frame/plan.md:55-60`
regression: round-1#1
```

The unit is *Scope* item 14 of `frame/design.md`, which the fold at `f03c848` changed for findings 1 and 2. The frame gives item 14 to phase 1 (`frame/plan.md:59`, Status `99f668a`) and its means to probe 5 (`frame/design.md:109`); the fix pass built two new means at `8fde593` and the fold added them as bullets of the same item (`frame/design.md:113-114`), so both attributions now cover means that neither stage made.

Why it matters: `frame/design.md:109` ends "and probe 5 ran these means". Probe 5 changed `main.ts` in a clone to set the accessory policy and to show the window with `showInactive()` (`frame/design.md:72`). It took no variable out of the environment and closed no window. The bullet on the variable's removal (`:113`) and the bullet on the quit with the last window (`:114`) are now among "these means". `frame/plan.md:59` says phase 1 delivers "*Scope* items 1 to 8, 12, 14 and 15" with its Status `99f668a`. At `99f668a`, `main.ts` holds no `takeBackground`, and its `window-all-closed` handler reads `if (process.platform !== "darwin") app.quit();` (the `git show` above). The frame as `bca24bf` folded it, which phase 1 built to, holds neither bullet (the first `git show` printed no line). Scenarios 11 and 12, the two new rows, stand in no phase row's *Verified by* cell, and `frame/plan.md:55`, which says where each phase closed, does not name the fix pass. The sealer reads these sentences against the commits they name, and its last verdict was withheld on records that named commits the tree contradicted (`guarantee.md`, the `Verdict:` line). The list of statements was made by the `grep` above over the work item's records, a search for wordings and so a sample. `trail/phases/phase-1.md:19` also names `startsInBackground` alone, and it states phase 1's commit, so it stays.

```text
frame/design.md:109, replace "and probe 5 ran these means." with:
and probe 5 ran the means of its second and third bullets, the activation policy and the window shown with `showInactive()`. The bullets on the variable taken out of the environment and on the quit with the last window were built by the fix pass of review round 1, at `8fde593`.

frame/plan.md:59, Delivers cell, replace "*Scope* items 1 to 8, 12, 14 and 15," with:
*Scope* items 1 to 8, 12, 14 as `bca24bf` folded it, and 15,

frame/plan.md:55, append after "`trail/phases/` holds both records.":
The fix pass of review round 1 built the two bullets of *Scope* item 14 that `f03c848` folded, the variable taken out of the environment and the quit with the last window, at `8fde593`, with scenarios 11 and 12 as cases of `apps/desktop/test/background.test.ts`; `trail/rounds/round-1.md` findings 1 and 2 hold their seen red.
```

The three edits are the frame's, the orchestrator's to fold. No code changes.

## Confirmations

```seal
confirms: round-1#1
```
What holds: `apps/desktop/src/main/background.ts:32-34` answers `platform !== "darwin" || background`, and the handler at `apps/desktop/src/main/main.ts:79-82` quits where it answers true. `background` is the module's constant from `main.ts:18`, read once at load, so the handler reads the start's switch. Under the switch on macOS the app quits with its last window, and without it the app stays, as before. The two cases at `apps/desktop/test/background.test.ts:33-42` passed (executed, below). Their red is the fix pass's: `m1.txt` and `m5.txt` in the scratch `fix-1/`, opened, each fail on the case the close names (`expected false to be true`). Read and executed.

```seal
confirms: round-1#2
```
What holds: `main.ts:18` calls `takeBackground(process.env)` at module load, before `app.whenReady()` (`main.ts:45`). The daemon is started only inside the `Channel.daemon` handler that `whenReady` registers (`main.ts:47-49`), and `ensureDaemon` builds the daemon's environment from `process.env` at that moment (`apps/desktop/src/main/daemon-client.ts:53`), so the variable is gone before any child is spawned. Each pane's process takes the daemon's environment through `terminalEnv`, as round 1 read at `pty.ts:66`. Round 1's executed search was re-run at `f03c848`: `git grep -n 'OWLERY_BACKGROUND\|ELECTRON_RUN_AS_NODE' f03c848 -- apps/desktop/src apps/desktop/scripts` prints the variable in `background.ts` alone, so nothing reads it after `main.ts` loads. The two cases at `background.test.ts:19-31` passed; `m2.txt`, `m3.txt` and `m4.txt` in `fix-1/`, opened, show the three mutants the close names red. Read and executed.

```seal
confirms: round-1#3
```
What holds: `apps/desktop/test/korean-input.test.ts:286-290` reads the pin from `apps/desktop/package.json`, whose `dependencies` hold `"@xterm/xterm": "6.0.0"` (`package.json:20`), an exact version. The case passed under the filter "the typed run, without a person" (executed, below), and `m6.txt` in `fix-1/`, opened, shows it red with `versions` made to answer `0.0.0`. The literal `6.0.0` the close says stays at `:255` is a value the `fixtureAfter` case hands in and reads back. Read and executed.

```seal
confirms: round-1#4
```
What holds: row 6 of *Judgments of the run* (`frame/plan.md:89`) now holds the text block's sentence word for word. `phase-1.md:7`, `:9`, `:13`, `:38`, `:42` to `:45` and `:62` and `gaps.md:16` say "patch on `c128acb`". `git grep -n -e "'s tree" -e "trees of" f03c848 -- seal/threads/1795046888-korean-input-test` names `frame/design.md:7`, `frame/plan.md:86`, `frame/plan.md:89`, `guarantee.md:11` and `round-1.md`, and no phase record and no line of `gaps.md`. Each of the frame's three uses names a tree before a rebase or a release commit's tree, as row 6 allows. Executed and read.

```seal
confirms: round-1#5
```
What holds: the row on #23 (`frame/plan.md:69`) holds the record's two cells. `git diff --stat 7159499 f42ab46 -- apps` names `src/daemon/daemon.ts`, `src/shared/protocol.ts` and `test/daemon.test.ts`, as the row says. The coordinate it cites stands: `seal/threads/1795048706-trust-question/frame/design.md:44` is the bullet "No agent starts the app", and it ends with "the orchestrator answers it once the switch lands". Executed and read.

```seal
confirms: round-1#6
```
What holds: each of the five quotes of `pr.md` (`:3`, `:5`, `:7`, `:9`, `:11`) opens the Judgment cell of the row its coordinate names, with whitespace collapsed: rows 4, 5, 2, 1 and 7. Executed, `python3` over `frame/plan.md` and `pr.md`. No `pr.<lang>.md` is owed: `seal/config.json` names English for both language keys.

What matched: scenario 5 at the target. `git diff --stat f42ab46...f03c848 -- apps/desktop/src apps/desktop/build.mjs apps/desktop/scripts` names `background.ts` and `main.ts` alone, exit 0. Executed.

What matched: the fold's other sentences against the code. `frame/design.md:110`, `:113` and `:114`, scenarios 11 and 12 (`:147-148`), the two rows of *Data & interfaces* (`:156-157`), `frame/plan.md:26` and `:74`, and the third bullet of `changelog.md` (`:7`) each say what `background.ts`, `main.ts` and `background.test.ts` do at `f03c848`. The seen-red each scenario row names is the fix pass's `m1` to `m5`. Read.

What matched: the fix pass's list of statements it owed. Round 1's findings 1 and 2 named `frame/design.md:110`, `:109-115`, `:143`, `:152`, `:153`, `frame/plan.md:26`, `:74` and `changelog.md:7`, and each was rewritten. The two statements of finding 1 above were outside that list, since they attribute item 14 to earlier stages rather than state what the switch does. Read.

What matched: the new row of `gaps.md` (`:8`) names the two lines of `main.ts` the fix pass changed and gives them to this round. This round read both, as the first two confirmations say, and made no start. Reading settles them: the deletion precedes every spawn by the order of the module's statements, and the handler reads the constant the module set. Contract rule 7 asks a probe only for what reading cannot settle, and the owner asked for the fewest starts. Whether the row then closes is the orchestrator's (*Not judged*).

Each new test was read against its group. The two cases of `takeBackground` differ by the mutant each alone catches, the delete made only where the answer is true (`m3.txt`). The two cases of `quitsWithLastWindow` cover the background and the platform halves of its condition. None repeats a case of `startsInBackground`. The test files declare no `TARGET`, so `seal layout --pairs` has no pairs to print (carried from round 1, where `git grep TARGET -- apps/desktop/test` printed nothing).

Under the switch no platform keeps the app after its last window, so the `activate` path of `frame/design.md:112`'s last sentence is reached only without the switch. The sentence stays true, and this round opens nothing on it.

## Carried, not re-established

| Fact | Source |
|---|---|
| Scenario 8 reads `UIElement` and `document.hasFocus()` false on a tree whose `main.ts` holds #21's `app.dock?.setIcon` beside the switch | `guarantee.md:11`, carried by round 1 |
| A pane's process takes the daemon's environment through `terminalEnv`, which drops only `INHERITED_ONLY` | round 1, finding 2, at `apps/desktop/src/daemon/pty.ts:18-31` and `:66` |
| The mutants of the fix pass, `m1` to `m6`: their outputs were opened, and the mutants were not run again | `fix-1/` in the session's scratchpad |
| Every seen-red row of both phase records | `trail/phases/phase-1.md:40-54`, `trail/phases/phase-2.md:37-51` |

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck and the broad gate at `f03c848`. The suite is `unverified` here, by contract rule 2 | `seal/config.json` `Broad gate` | the orchestrator, at the broad run |
| The two calls of `main.ts` run in the built app: a start under `OWLERY_BACKGROUND=1` that closes its window and reads the app gone, and a reading of the daemon's environment. This round read both lines and made no start | `seal/threads/1795046888-korean-input-test/gaps.md:8`, `apps/desktop/src/main/main.ts:18`, `apps/desktop/src/main/main.ts:79-82` | the orchestrator, who closes the row on this round's reading or orders the start |

## Probes

No probe file was written, and the app was started no time. The runs used `OWLERY_BACKGROUND=1` and `TMPDIR=/private/tmp/claude-501`, in `apps/desktop` of the clone.

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs background.test` | 1 file, 9 passed, exit 0 |
| `node scripts/test-in-electron.mjs korean-input -t "the typed run, without a person"`, then `pgrep -fl owlery-app-` | 13 passed, 20 skipped, exit 0; `pgrep` exit 1, no app started |
| `python3` comparing each quote of `pr.md` with the Judgment cell its coordinate names, whitespace collapsed | rows 4, 5, 2, 1 and 7: each quote opens its cell |
| `git grep -n -e "'s tree" -e "trees of" f03c848 -- seal/threads/1795046888-korean-input-test` | no phase record and no line of `gaps.md` |
| `git diff --stat f42ab46...f03c848 -- apps/desktop/src apps/desktop/build.mjs apps/desktop/scripts` | `background.ts` and `main.ts`, exit 0 |
| `git grep -n 'OWLERY_BACKGROUND\|ELECTRON_RUN_AS_NODE' f03c848 -- apps/desktop/src apps/desktop/scripts` | the variable in `background.ts` alone |
| `git diff --stat 7159499 f42ab46 -- apps` | `daemon.ts`, `protocol.ts`, `daemon.test.ts` |
| `git show bca24bf:` the design, searched for the two new bullets; `git show 99f668a:apps/desktop/src/main/main.ts`, searched for `takeBackground` and the handler | no bullet at `bca24bf`; at `99f668a` no `takeBackground`, and the handler quits off macOS alone |
