# Phase 2: 1795178893-keep-awake

## What this phase found

**The frame holds for this phase.** Each coordinate `frame/design.md` *Grounding* gives for the window was opened at `09ee137` and stands where the frame says: the foot's style and its markup at `src/renderer/index.html:194-199` and `:408-414`, `daemonStatus` at `src/renderer/view.ts:323-327`, its expectations at `test/view.test.ts:1189-1199`, and `BuiltApp.start`'s background default at `test/built-app.ts:179`. `KeepAwake`, `KeepAwakeChoice`, the `keepAwake` message and `setKeepAwake` stand in `src/shared/protocol.ts` as phase 1 left them, and this phase changed nothing of the daemon or of the protocol.

The phase's code and cases are in commit `6ccb066`.

### Decisions the frame left to the build

Each was judged against `frame/design.md`, in the section named.

- **The function of scenario 14 is `keepAwakeControl` in `src/renderer/view.ts`.** It takes the `keepAwake` the window holds, or null, and answers the choice and the control's title, or null where the control shows nothing. The title's words are built there and not in `src/renderer/keep-awake.ts`, so a case without a page reads each label of `KEEP_AWAKE_CHOICES`. *Data & interfaces* asks for "the function of scenario 14" and for the title `Keep awake: While an agent works`, and names no shape.
- **The control never shows a choice the window only sent.** A person's choice goes to the daemon, and the control's title changes when the daemon's `keepAwake` message arrives. *Scope* item 7 says the control "shows the daemon's choice". The window keeps no choice of its own and has no timer for an answer that does not come. Where the connection is lost the page loads again within a second (`src/renderer/renderer.ts`, the socket's `close`), and the new page shows what `ready` says.
- **The page hides the control until `ready`.** The `label` carries the `hidden` attribute in `src/renderer/index.html`, and `showKeepAwake` takes it off at a `ready` that carries `keepAwake`. *Data & interfaces* lists the label's id, class, icon and `select`, and not the attribute. Without it the control would stand empty in the foot before the daemon answers, and for good against a daemon that never sends `ready`.
- **The renderer's module of the control exports two functions**, `initKeepAwake` and `showKeepAwake`, and reads the daemon's choice from `shared.ts#held`. `theme.ts` takes its choice as an argument because the main process hands it over once. This choice changes with every `keepAwake` message, so the module reads where the message is put.
- **The icon is a cup with two lines of steam**, drawn in the 16 units of the foot's other icon and with the same class. *Data & interfaces* asks for "an icon drawn as the foot's other icon is" and names no drawing. Nobody has seen it on a screen (`gaps.md` *Not verified*).

### Departures from the frame

- **`src/renderer/sidebar.ts#showStatus` is exported, and `src/renderer/renderer.ts` calls it at each `keepAwake` message.** *Data & interfaces* says that `sidebar.ts` "draws the status line again at each `keepAwake` message". The sidebar receives no message itself: `renderer.ts` receives every one and calls the part that draws. The other function that draws the line, `showSidebar`, draws the whole sidebar again.
- **`test/keep-awake.test.ts#until` now waits for a promise too.** The built-app case asks the page a question at each turn. The three cases of phase 1 pass it a plain function and run as before.
- **`holdsOf` takes the parent's process id as a second argument**, this process's where none is given, as phase 1's record asked.
- **Two comments of `src/renderer/index.html`'s style were corrected.** One said that the foot holds "the control that chooses the theme", and one that "the sidebar's filter and the theme's control" are each an icon. Each now names both controls. `git grep -n -E "theme's control|theme-control|sidebar's foot|sidebar-foot" -- apps/desktop/src apps/desktop/test docs README.md` found no other sentence that counts the foot's controls. That search finds the wordings it names and is a sample: a sentence that speaks of the foot in other words was not searched for.

### How each case was seen red

The cases were written first, against the tree at `09ee137`.

- **Scenario 12**, `daemonStatus > says after the agents' count that the daemon keeps the Mac awake, where it does`: failed on `expected 'Daemon running, 2 agents' to be 'Daemon running, 2 agents, keeping the Mac awake'`.
- **Scenario 14**, the two cases of `keepAwakeControl`: both failed on `keepAwakeControl is not a function`. The second asserts an absence, and that failure does not name its guard. With the function built and its one guard removed, `if (!keepAwake) return null`, it failed on `Cannot read properties of null (reading 'choice')` at the function's next line.
- **Scenario 13**, the case of the built app: its first run failed on the case's own first wait, which read `#status` before the page had one. The wait was corrected, and the second run, with `view.ts` changed and no control in the page, failed where the case reads the control's choices: `Cannot read properties of null (reading 'options')`.

`seal mutate` ran over each unit that adds behaviour, at `6ccb066`. Every mutant was red.

| File | Cases | Mutants | What they broke |
|---|---|---|---|
| `src/renderer/view.ts` | `test/view.test.ts -t "daemonStatus\|keepAwakeControl"` | 4 red | the condition on the status line's words; the guard on a daemon that sent none; the label in the title; the choice the function answers |
| `src/shared/keep-awake.ts` | the same | 3 red | each of the three labels |
| `src/shared/keep-awake.ts` | `test/keep-awake.test.ts -t "in the built app"` | 1 red | the order of "Always" and "Never" |
| `src/renderer/renderer.ts` | the same | 4 red | the choice taken from `ready`; the control shown at `ready`; the status line drawn at a `keepAwake` message; the control shown at one |
| `src/renderer/keep-awake.ts` | the same | 4 red | the message a choice sends; the choice put in the `select`; the title; the control's `hidden` |
| `src/renderer/sidebar.ts` | the same | 1 red | the third argument of `daemonStatus` |

A batch prints no case's failing line, so three mutants were read alone: the guard of `keepAwakeControl`, the sidebar's argument (`the window never showed that the daemon keeps the Mac awake`) and the order (the list of the choices' words).

### What the runs started

The case of scenario 13 holds the plan's one `BuiltApp.start`. That case ran 18 times in this phase: twice red, once green, 14 times under `seal mutate` (a baseline for each of the four batches and a run for each of the ten mutants), and once in the phase boundary's run. Every start was in the background. After every run `ps -axo pid=,ppid=,args=` listed no `caffeinate` this phase started and no process of a temporary user data folder. One `caffeinate -i -t 300` whose parent is process 11040 ran throughout under changing ids, and is not this work's.

The phase boundary's run was `node scripts/test-in-electron.mjs test/view.test.ts test/keep-awake.test.ts test/themes.test.ts test/navigation.test.ts`, from `apps/desktop/`: the plan's two files, and the two other files whose cases open a path this phase changed and start no app. `test/themes.test.ts` reads `index.html` and every module of `src/renderer/`. `test/terminal-basics.test.ts` and the other case files of the built app also run the page this phase changed, and the spawn allows the app's start to scenario 13's case alone, so they stay with the broad gate (`gaps.md` *Not verified*).
