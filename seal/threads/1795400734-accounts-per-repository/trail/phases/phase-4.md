# Phase 4: 1795400734-accounts-per-repository

## What this phase found

**The frame holds against the tree after the second merge.** Before the build, the coordinates *Scope* item 9 and `frame/design.md` *Data & interfaces*, *Panes*, name were opened at `af8bf1d`, and each stood as the frame says:

- `daemon.ts#agentEvent` read no `session_id`.
- `#followLog` and `#endLog` held the watch #182 added.
- `#startSession` was the one place that built a pane's start and its process.
- `hooks.ts#claudePaneCommand` ended its command with `--continue` where asked.

The phase row's *Verified by* cell names `daemon.test.ts`, `hooks.test.ts` and `view.test.ts`, and the build changed no other file of cases. Read.

**Q4 is decided: a pane whose account changes keeps its id.** The daemon ends the pane's process and starts the next one in the same record. Grounds, read at `af8bf1d`:

- A pane's record holds what it printed (`OutputBuffer`), the clients that receive it, and its place among the work item's tabs, which the window keys by the pane's id. A new pane would close the tab and lose the scrollback, and the window would need a way to put a new pane in an old one's place.
- The same id keeps all three with no change to the window but the dialog.
- The pane's own settings file is named for the pane's id (#181). The launch under the new account writes it again or leaves the shared one, as *Scope* item 14 asks, so the same name is right.
- `OWLERY_PANE_ID` stays the same, so the new process's hook events reach the same record.

Scenario 8 holds under this answer, as `frame/questions.md` Q4 says it holds under both.

**Decisions made while building, each with its grounds.**

- **A pane's process is split from its record.** `startSession` makes the record. `#spawnPane` starts a process, and `#watchProcess` follows it. A change of account calls the last two again on the same record. While the daemon ends a process for a change, `Session.replacing` holds, and that process's end ends nothing of the pane. It sends no `exit`, no inbox and no exit line, and it writes no setup's end. Its watch of the session log and its silent start are ended there, which is the one place a process's end ends them (*Scope* item 9, "Before it starts, the daemon ends the watch").
- **The conversation's id is taken from any hook event that carries `session_id` in the form of a UUID.** Any other value is never kept, so it never reaches a command line. The id is quoted for the shell all the same (*Data & interfaces*, *Panes*, the third bullet).
- **`PaneStart.resume` is optional.** It is given on one launch alone, the relaunch after a change, and a start without it resumes nothing. `claudePaneCommand` writes `--resume <id>` in place of `--continue`, after the options #181 gives (*Scope* item 9, "never holds `--continue` beside `--resume`").
- **The new process starts at the size the window last gave the pane.** The daemon now keeps the size of each `resize`, since a process started at the first size would be drawn at another than the terminal shows.
- **"The same `projects` folder" is read as the same real path.** The daemon gives the new account's folder its missing links first, then compares `realpathSync` of `projects` in the two config folders. A folder that holds no `projects` keeps no conversation, so two such folders do not match either. Under System default the folder is the one the lookup gave. Before the lookup answers there is none, so the change is refused.
- **The refusals and their words.** *Scope* item 9 lists the refusals. The daemon also refuses a pane whose process ended, the account the pane runs under, an account it does not keep, and a pane closed while its process ends. The window offers the change only where a change can succeed, so a person meets these words only in a race:
  - A headless session: "A session asked in a work item keeps the account it started under. Ask again under the other account."
  - A sign-in pane: "A sign-in pane runs under the account it signs in."
  - A shell: "A shell keeps the environment it started with, so its account is not changed. Open a new pane under the other account." This is the rule change's ground, "a shell, whose environment is fixed at its start", said to the person.
  - Different conversations: `"A" and "B" do not keep the same conversations, so the pane's conversation would not be found under "B".`
- **A pane whose next process cannot start stays, ended, and says why.** Where the command cannot be built or the process cannot start, the pane prints the reason in its own output and the inbox lists it as ended under the new account. The request gets the error.
- **The request is `changeAccount { id, accountId, headless? }`.** `headless: true` names a headless session, which is always refused. *Data & interfaces*, *The protocol*, names the request "change a pane's account" and gives it no fields.
- **The window's control is "Change Account…" in the pane's own menu.** It opens a dialog headed "Change the account of <the tab's label>". The dialog says "Owlery ends the pane's process and resumes its conversation under the account you choose. A turn under way is cut." Its buttons are "Cancel" and "Change the account". The frame names no words for this control. The menu's items are Title Case ("Close Pane"), so the item is too. The button names its act, as `docs/design.md` *The voice of the window's words* asks. The item stands only for a running pane of a kind that resumes and takes an account, where an account other than System default is kept.

**Cases and their reds.** Seven cases ran against the source of `af8bf1d`, with phase 4's source stashed, and all seven failed. Executed.

| File | Case | Why it failed |
|---|---|---|
| `daemon.test.ts` | the change of a running pane | the request had no answer |
| `daemon.test.ts` | the settings file the new account gives | the request had no answer |
| `daemon.test.ts` | the refusals | the request had no answer |
| `daemon.test.ts` | what the old process left, and a start that fails | the request had no answer |
| `hooks.test.ts` | `--resume` | the command held no `--resume` |
| `hooks.test.ts` | `paneCommands` passing the start's conversation on | the command held no `--resume` |
| `view.test.ts` | the window's offer | the module exported no `paneAccountChange` |

**Each unit that adds behaviour was broken with `seal mutate`.** 32 runs broke 31 units of the daemon, `hooks.ts` and `view.ts`. Of the 30 units that stand, each one's last run ended `red`, and the 31st was removed. Executed.

Two runs survived at first:

- **The drop of the old process's interruption.** The case read the pane's state from any inbox, and an earlier one had listed it as working. The case now reads the inbox the new process's event sends (`5d415f2`), and the break ends red.
- **The window's test of a sign-in pane.** A sign-in pane is a shell, so its kind already offers it nothing. The test was removed at `5d415f2`, and the case still presses a sign-in pane.

**What no case watches.**

- The line that refuses a pane running under no account guards the type alone. Every kind of the app that resumes also takes an account, so no case reaches it. Read.
- The window's own drawing is pressed by no case: the menu item, the dialog and its refusal. The cases pin `paneMenu` and `paneAccountChange`, which they draw from. This joins `frame/questions.md` Q8. Unverified.
- A real `claude --resume` under another config folder whose `projects` is a link is Q3's. Unverified.

**The phase boundary.** At `5d415f2`, one command ran ten files: the phase row's three with `accounts`, `claude-adapter`, `fake-adapter`, `pane-chain`, `claude-plugins`, `pane-kinds` and `menu`. All 10 files passed, with 1062 cases. A typecheck of the files the changed modules and cases make up passed. After a build, `theme-controls.test.ts` ran alone and passed 7 cases, and the screenshot run passed and wrote 22 files, so the window still starts and draws with the new dialog in its page. Executed.
