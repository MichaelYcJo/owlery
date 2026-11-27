# Phase 3: 1795739977-244-207-runner-cases-wait-on-what-they-read

## What this phase found

**The frame holds for phase 3 at `4eed2b66`** (`read`). No file under `apps/desktop/src/` changed since `15701977` (`git log 15701977..4eed2b66 -- apps/desktop/src` prints nothing, `executed`). `git grep -n 'send({ type: "\(plan\|read\|fetch\)' -- apps/desktop/src/renderer` (`executed`) prints the requests *Scope* item 3 names at the lines it names, with `readHeavyRuns` at `machine.ts:168` beside `readMachine` at `:167`. The other lines it prints fill the sidebar and the work item's view, as `frame/plan.md` *Alternatives considered* says. `app-settings.ts` opens the App Settings dialog only once the editors it lists are read, so that dialog has no answer to wait for after it opens.

**How the places were listed.** The files of the `app` project are the files that import `buildApp` from `./built-app` (`grep -l 'import { [^}]*buildApp' test/*.test.ts`, `executed`), with `test/korean-pane.ts` and `test/memory.ts`, whose helpers drive the form for other files. Each dialog's places were found by its ids over that list: `git grep -n -E '[#"](rename|settings|remove|delete|records|machine)-[a-z-]+'` for the six dialogs, and `git grep -n -E 'work-item-(create|cancel)'` for the form, whose plan and fetch fill it (`executed`). Each place was then read with the case around it, against the dialog's markup in `index.html` and its drawing in `renderer.ts`. The coordinates below are at `a1ad6511`.

**`planRename` (`renderer.ts:738`), the rename dialog.**

| Place | What was done, and why |
|---|---|
| `work-item-menu.test.ts:234` `create()`, and `:581`, `:592`, `:596` | Nothing. Each press follows `says("rename-plan", …)`, a wait on the answer as drawn. |
| `work-item-menu.test.ts:573`, the empty name's press of Rename | Nothing. The plan asked as the dialog opened can land before the press, and its sentence takes one line. `#rename-plan` holds `min-height: 1.4em`, so the line is kept before the sentence comes, and Rename does not move. |

**`planWorkItem` (`renderer.ts:861`), the settings dialog.** The answer redraws the options of `#settings-base`, whose height stays one row, and `#settings-error`, a `.refusal` line with `min-height: 1.4em` that only an error plan fills. Every repository these cases open is a git repository. The value a person chose stays chosen (`renderer.ts`, "The base a person chose while the daemon was asked stays chosen").

| Place | What was done, and why |
|---|---|
| `chain-choice.test.ts:167-205` | Nothing. The presses and reads touch the chain's field and the buttons, which the answer does not move or change. |
| `screenshots.test.ts:497-520`, `:671` and `:766` | Nothing, for the same reason. |
| `work-item-menu.test.ts:732` and `:743` | Nothing. Each waits on the options the answer draws. |

**`readLoss` (`renderer.ts:1209`), the remove dialog**, all in `work-item-menu.test.ts`.

| Place | What was done, and why |
|---|---|
| `:1036` and the reads after it | Phase 1's item 1. |
| `:1142-1163` | Nothing. One work item stands, and the wait on its section is the wait on its loss drawn. |
| `:1176-1199` | Nothing. Two new work items each give one section, so the wait for two sections ends once both losses are drawn. |
| `:1230-1242` | Nothing. The `h3.work-item` the wait counts stands before the losses come, but the case presses only controls above `#remove-losses` and reads nothing a loss draws. Once the choice to delete is taken back, `renderer.ts#takeRemoveLoss` draws nothing while `#remove-delete` is unchecked. The wait's text, "both work items' losses", says more than it waits for. |
| `:1207-1221` | Nothing. No work item stands, so no loss is read. |

**`readLoss` (`renderer.ts:1334`), the delete dialog.**

| Place | What was done, and why |
|---|---|
| `work-item-menu.test.ts:908`, `:982`, `:1023`, `:1068` and `:1292`, `screenshots.test.ts:725` | Nothing. Each waits on the loss as drawn before it presses. |
| `machine-dialog.test.ts:444`, and `terminal-basics.test.ts:493` (`deleteDialogSessions`) | Each waited on the sessions and pressed Cancel while the loss was still to come. The loss draws above the buttons and moves Cancel down. Each now waits until `#delete-says` no longer reads `view.ts#deleteSays(null)` before it presses. |

**`planRecords` (`renderer.ts:1434`), the records dialog.**

| Place | What was done, and why |
|---|---|
| `records-dialog.test.ts:76` | Nothing. It waits on Set up and commit enabled, which needs the second plan, of the proposed command, drawn. |
| `records-dialog.test.ts:92` | Nothing. It waits on the holds. `config.json` stands by then, so `records-place.ts#proposedBroadGate` is null and no second plan is asked. |
| `work-item-menu.test.ts:697` | Phase 1's item 2. |
| The presses of Create in the register mode, `chain-choice.test.ts:98`, `records-dialog.test.ts:52`, `work-item-menu.test.ts:680` and `:688` | Nothing. In that mode `renderer.ts#showPlan` draws none of the plan, and the register-only box stands above the plan's lines. |

**`fetchBase` (`renderer.ts:1795`), the form's base line.** "Fetching X…" gives way to "Fetched: X is at C." on the one line `#work-item-base-state` keeps with `min-height: 1.4em`. `work-item-form.test.ts` cases 2, 6, 8 and 9 wait on the answer through `says` or `until`. Case 9's remote is the stand-in that answers after 10 seconds, so no answer lands between the read of Create's place and the press. Nothing was done.

**`planWorkItem` (`renderer.ts:1831`), the form's plan.** The form asks a plan of the name it generates as it opens (`renderer.ts:1720`) and of each name typed after, 150 ms after the key (`askPlanSoon`), and it draws only the answer to its latest ask (`view.ts#planAnswer`). A wait on `#work-item-branch` not empty can end on the generated name's plan while the typed name's is still to be asked. The branch sentence is about one line wide in the 420 px the dialog leaves, so another name's sentence can take another count of lines and move Create.

| Place | What was done, and why |
|---|---|
| `work-item-menu.test.ts:226` `create()`, `korean-pane.ts:183` `openReceiverPane`, `memory.ts:370` `openWorkItem`, `chain-choice.test.ts:121`, `notification-click.test.ts:59` `create`, `terminal-basics.test.ts:1106`, `theme-controls.test.ts:85` | Each waited on the branch not empty. Each now waits on `built-app.ts#formPlanOf(title)`, which holds once the worktree the plan names ends in the title's slug, or in the slug with the number `worktrees.ts` adds where the folder is taken. |
| `work-item-menu.test.ts:712` and `:724` | Each pressed Cancel right after the form opened, while the opening's plan was still to come. The plan shows the Branch field and its lines, which move Cancel down. Each now waits on the branch not empty: no name is typed, so the opening's plan is the one to come. |
| `work-item-form.test.ts:241-252`, case 7 | It set the folder to the text with a slash, pressed Create, read the refusal and the open form with two more calls, and set the folder back with a fourth. Under load the 150 ms could pass between the calls, so the form asked a plan of the text with the slash, and an answer to it as the latest ask would clear the plan of the folder before `create(name)` pressed. The four steps now run in one call, within the form's 150 ms, so no plan of that text is asked. The pending plan is of the same folder and name, so its answer draws the same plan. The case asserts the same two values as one array. |
| `machine-dialog.test.ts:295` | Nothing. It waits on the warning the typed folder's plan draws, and the form opened on an empty folder in that describe's app. |
| `screenshots.test.ts` `openForm`, and `:757` and `:922` | Nothing. `openForm` waits on the branch of the name typed. |
| `work-item-form.test.ts:65` `create()`, `:213` and `:225` | Nothing. Each follows `openForm`, which waits on the branch of the generated name, and no title is typed. `:225` also follows the fetch's answer. |
| `notification-click.test.ts:131-145` | Nothing. The case reads values the plan does not change. |
| `korean-input.test.ts` | Nothing. The form opens only in `beforeAll`, through `openReceiverPane`. |

**`readMachine` and `readHeavyRuns` (`machine.ts:167-168`), the Machine dialog.** Under `OWLERY_MACHINE` the daemon's reader holds one reading (`machine.ts#readMachine`), which the dialog drew as it opened, so the answer draws the same text. The heavy runs are empty until case K writes the runs file, and case K waits on the entries. `capPanes` presses `#machine-panes`, which stands above the heavy lists, and Save, where nothing changes. The third describe waits on its rows. Nothing was done in `machine-dialog.test.ts` or `screenshots.test.ts:702-789`.

**One helper for the form's plan.** At `4eed2b66` the wait before Create stood in seven places, in five test files and two helpers, the first row of the table above. `built-app.ts` gains `formPlanOf(title)`, which gives the page's expression, and each place calls it. `frame/design.md` *Data & interfaces* says `built-app.ts` gains one exported helper, item 4's. This phase adds a second, so that one fact has one source (`skills/core/SKILL.md` *The rule a mechanism is kept against*). Its signature takes a title and returns a string, and it changes no other export.

**Item 4, by file.** Each file below was read for where it starts the app, whether its cases share that app, whether a case opens a dialog or a menu, and whether a case ends the app.

| File | Decision, and why |
|---|---|
| `chain-choice.test.ts`, `decisions-and-questions.test.ts`, `notification-click.test.ts`, `terminal-basics.test.ts`, `theme-controls.test.ts`, `work-item-form.test.ts` | Registers `afterEach(atRestAfterFailure(() => app))`. One app for the file's cases, which open the form, the chain dialog, the settings dialog, the reverse dialog, the delete dialog, the Accounts dialog or a tab's and a pane's menus. No case ends the app. In `terminal-basics.test.ts` it follows the file's own `afterEach`, and Vitest runs the later hook first, so Escape closes the dialog before the panes are closed. |
| `machine-dialog.test.ts` | Registers it in each of its three describes, each of which starts one app for two cases or more and opens the Machine dialog, the form or the delete dialog. |
| `daemon-restart.test.ts` | Left out. The first describe's last case quits the app, and *Scope* item 4 leaves out a file whose cases end the app. Its first describe's cases share the app, and the first opens the daemon dialog, so a dialog that case leaves open when it fails still reaches the two cases after it. `gaps.md` *Not done* names it. `a1ad6511` registered the hook there behind a check that the app's process still runs, and `6bf50a2c` took it back to build to the frame. |
| `records-dialog.test.ts`, `screenshots.test.ts` | Left out. One case each, so no later case meets what it leaves. |
| `role-bundle.test.ts` | Left out. Its built-app describe holds one case, with an app of its own. |
| `korean-input.test.ts` | Left out. The form opens in `beforeAll` alone, and the typed run is one case. |
| `keep-awake.test.ts` | Left out. Its built-app case starts and stops its own app. |
| `approval-line.test.ts`, `seal-back-view.test.ts`, `launch.test.ts`, `memory.test.ts`, `pane-session.test.ts`, `role-session.test.ts` | Left out. No case opens a dialog or a menu: the ids search above and a search for `showModal`, `.open` and `role="menu"` found none, and `pane-session.test.ts`'s one match is a comment on Claude Code's own trust dialog. `launch.test.ts` and `memory.test.ts` start an app only under their measuring variables, one launch a case. |

**Mutations** (`executed`, `seal mutate`, each after `a1ad6511`, through the session's lock):

| Unit | Mutant | Cases run | Verdict |
|---|---|---|---|
| `built-app.ts#formPlanOf` | returns the old wait, on `#work-item-branch` not empty | `chain-choice.test.ts` | `SURVIVED` |
| `built-app.ts#formPlanOf` | reads the slug of another title | `chain-choice.test.ts` | red: the wait ran out, so the expression is the one the plan of the title typed meets |
| the delete dialog's wait on the loss, `machine-dialog.test.ts:443` | removed | `machine-dialog.test.ts -t 'the sessions that wait for the machine'` | `SURVIVED` |
| case 7's one call | leaves the folder with its slash | `work-item-form.test.ts` | `SURVIVED` |

The two waits that survived are the race the census names. On this Mac the answer is drawn before the press either way, as phase 1 and phase 2 found for their cases, and `frame/questions.md` Q1 holds whether the runner meets it. Case 7's mutant survived because the folder with its slash names the same repository: `view.ts#workItemFields` keeps the slash, the plan of that text matches the field, and the case asserts nothing of the folder's text. Its set-back keeps the case on the folder it typed before, as the case did at `4eed2b66`. A first run of case 7's mutant with `-t 'names the repository'` gave no baseline: the case alone fails in `openForm`, since the form opens on the folder the earlier cases typed, so the mutant then ran over the whole file. The wait at `terminal-basics.test.ts:492` and the two Cancel waits of `work-item-menu.test.ts` are of the delete dialog's kind and were not mutated.

The registrations of item 4 call phase 1's helper, whose red phase 1's probe showed, and add no behaviour of their own. A mutant of one would show red only under a case that fails, so none was run.

**The phase boundary** (`executed`, at `6bf50a2c`, through the session's lock, three files a command at most). `work-item-menu.test.ts`, `work-item-form.test.ts` and `chain-choice.test.ts` passed 48 cases. `terminal-basics.test.ts`, `theme-controls.test.ts` and `notification-click.test.ts` passed 57. `machine-dialog.test.ts`, `decisions-and-questions.test.ts` and `korean-input.test.ts` passed 45, with 1 skipped. `daemon-restart.test.ts` and `memory.test.ts` passed 39. `korean-input.test.ts` and `daemon-restart.test.ts` call `korean-pane.ts#openReceiverPane`, and `memory.test.ts` imports `memory.ts`. `tsc`, over the tree `a1ad6511` commits, read the changed files, and `korean-input.test.ts`, `memory.test.ts`, `launch.ts`, `launch.test.ts`, `screenshots.test.ts` and `records-dialog.test.ts`, and exited 0. The other files of the `app` project were not run, and `gaps.md` *Not verified* names them.
