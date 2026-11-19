# Phase 6: 1795043695-inbox-first-window

## What this phase found

**The frame holds for this phase, with one scenario that reaches past the row.** Every path row 6 of `frame/plan.md` *Phases* reaches was opened at `6d66c5b` and is where the frame says: `apps/desktop/src/renderer/index.html`, `renderer.ts` and `view.ts`, `src/main/main.ts` and `test/view.test.ts`. `renderer.ts` was one file of 740 lines, the bar was `#bar` with `.emblem`, and the list at the left of a view was `#view-nav`, as *Removes* says. `seal/follow-up.md` does not exist, and the repository declares no `seal/parity.json`. Row 6 names the sidebar's part of *Scope* item 19, and its *Verified by* cell has scenario 21 driven again. Scenario 21 reads a main control "Answer the first question" and a changed line's title in the strong ink on the inbox screen. No row of the table names the phase that builds either, so this phase built both: the scenario cannot be driven without them.

**What the window is now.** The build is two commits, `a24d815` and `86ff640`. The second tightens three cases and changes no code.

- The page is the sidebar and four screens, each an element of `body`: `#sidebar`, `#summary-screen`, `#inbox-screen`, `#history-screen` and `#work-item-view`. The four screens carry `hidden` until `ready`. `#bar`, `.emblem`, `#view-nav`, `#back-to-inbox`, `#view-summary` and `#view-work-items` are gone, and the page holds no `img` element.
- The inbox screen and the history screen are each a copy of one `template`, `#list-screen`. A part of the template is named by `data-part`, and its copy's id is the screen's name before the part's: `#inbox-lines`, `#inbox-summary`, `#inbox-filter`, `#inbox-preview-title`, `#history-lines`, `#history-empty`. The ids `#inbox`, `#inbox-list`, `#preview` and `#preview-title` of phases 1 to 4 are gone.
- The sidebar's elements are `#sidebar-top`, `#search-field`, `#search-count`, `#search-key`, `#nav-inbox`, `#nav-summary`, `#nav-history`, `#nav-inbox-count`, `#nav-summary-count`, `#bell`, `#bell-count`, `#sidebar-filter`, `#add-repository`, `#new-work-item`, `#repositories` and `#status`. The summary's controls are `#summary-main`, `#summary-second` and `#summary-hint`, in place of `#open-inbox`.
- `renderer.ts` is split, as *Data & interfaces* asks. `renderer.ts` keeps the connection, the screens' switch, the keys and the "New work item" form, in 325 lines. `sidebar.ts`, `list.ts`, `work-item-view.ts` and `summary.ts` are the four parts. `shared.ts` holds what they share: the daemon's lists, the window's own state, the connection, and the pieces every part draws with.
- `src/main/main.ts` opens the window with `titleBarStyle: "hiddenInset"`. Nothing else of it changed.
- `view.ts` has the four functions the scenarios name, built as named: `sidebarTree`, `historyLines`, `matchWorkItems` and `markRanges`, and `summaryControls` of *Data & interfaces*. It has ten the frame does not name: `lineSession`, `workItemEntries`, `filterChoices`, `matchCount`, `matchSentence`, `emptyList`, `summaryHead`, `summaryCount`, `daemonStatus` and `commandKey`. Each returns words a person reads or decides what a key does, so each has cases.

**Decisions made while building, each with its grounds.** Each was judged against `frame/design.md` *Scope* items 12, 17 and 19 to 22 and *Data & interfaces*.

- *`inboxLine` is unchanged, and `lineSession` gives the pane it reads.* The history's order needs the time the state began, which the line does not carry. `trail/phases/phase-5.md` names the same need for phase 7. `inboxLine` now calls `lineSession`, and its cases pass as they were.
- *An entry is a work item, its line and that pane.* `workItemEntries` builds the entries, and the lists, the sidebar and the search read them.
- *A repository is its folder.* `sidebarTree` groups by `repo`, names an entry by `repoName`, and stands the repositories in the order of their first work item. Each entry's title is its folder, for every repository and not only for two of one name.
- *A repository's count is the count of the work items listed under it.* Under a search or a filter the sidebar lists the ones left, and the count says how many those are. "Inbox" keeps the count of every work item.
- *A daemon of an earlier build sends no `repoName`, and the window then reads the last part of `repo`.* `trail/phases/phase-5.md` names the `undefined`. Without it the sidebar would say "undefined" and a search would stop on it.
- *A work item matches where `markRanges` finds a place in its title, its branch or its repository's name.* One function decides the match and the marks, so a line is never listed without a mark where the match is in its title or branch. What is typed is read as it stands, spaces included.
- *The count in the search field and the sentence in the list's head are of the work items the search and the filter leave together.* On the history screen the head counts that screen's own lines.
- *The inbox's sentence counts every work item, whatever is typed or chosen,* as item 3 says of it.
- *The filter is one `select` per place:* one in the head of each list, and one under the sidebar's filter icon, laid over the icon unseen so that a press on the icon opens the choices. All three show the one filter. The head "Repositories" has no room for a visible `select` beside its three other controls.
- *The bell stays where no work item waits, and its count goes.* Item 20's sentence reads either way. A control that comes and goes would move the three beside it.
- *The filter and the search narrow the history as they narrow the inbox.* The history holds finished work items alone, so any other state chosen leaves "No work item matches."
- *Each list keeps its own selection.* A selection shared by the two screens would move the inbox's line whenever the history did not list it.
- *J, K and Enter act on the history screen as on the inbox screen,* as item 17 says. `inboxKey` is told that the inbox is in front while the history or the summary is.
- *K with the Command key is read before a terminal reads it.* The window listens for it while the event goes down the page, and for J, K and Enter on its way up, as before. `commandKey` reads the Command key on macOS and the Control key elsewhere, and neither where another modifier key is held. The platform is `navigator.platform`.
- *Escape in the search field returns the keyboard to the selected line of the list in front,* and to the page where no list is in front.
- *The status line says "Daemon running, 1 agent", "2 agents" or "no agent".* Item 12 gives the two parts and no words between them. It says nothing before `ready`.
- *The summary's hint is the function's:* "Enter opens the first that waits." beside "Answer the first question", and "Enter opens it." otherwise.
- *The summary is drawn at each opening from the changes of this load,* with the sentence of the last look worked out again.
- *A title is in the second text's colour at weight 500, and a changed one in the text's colour at 600,* in the list and in the sidebar. They are direction B's `--text-second` and `--text`. The dot, its ring and the list's last sentence stay until phase 8 removes them.
- *A list is drawn when its screen comes in front and at each `inbox` while it is in front.* A hidden list is not drawn, which closes a row of `gaps.md` *Not done*.
- *A press on the sidebar before `ready` opens no screen.* Item 1 has the sidebar displayed then, and no screen.
- *The control that adds a repository opens the folder dialog and then the form,* as item 20 and `frame/questions.md` Q10's default say. A dialog that is closed with no folder opens no form.
- *The bell, the filter and the control that adds a repository are drawn in the page as lines of 1.5 pixels.* Item 13's icons are phase 8's, and a bell has no letter to stand in for it. The fold's mark and the "+" are text.
- *The package's whole `tsc --noEmit` ran before each of the two commits* and exited 0. The repository configures no linter and no formatter.

**Where a default of `frame/questions.md` did not hold.** None. Q9's default is built: the history lists the finished work items, and the inbox keeps them. Q10's default is built: no list of repositories. Q7 and Q8 are phase 9's, and the sidebar's foot holds the status line alone.

**What this phase left as the frame's later rows have it.** The list column is still 620 pixels wide and the view's right column 328, in direction B's colours. A line, the preview and the right column say what phases 2 to 4 gave them. A sidebar's work item is a dot and a title, with no age. A group's heading has no count. The preview's foot still reads "Enter opens it. J and K move through the inbox." on both screens.

**Seen red.** The cases were written first and run against `view.ts` as `6d66c5b` holds it (`pnpm run test test/view.test.ts`, exit 1): 34 of 104 failed, each with "is not a function". Three assertions were added after the code, in `86ff640`. Each was shown red by its mutant, run alone.

- "names a repository as the daemon names it", with the daemon's name not read: `expected [ 'project' ] to deeply equal [ 'the project' ]`.
- A match in a title alone, with the title not searched: `expected [] to deeply equal [ 1 ]`.
- K with both the Command key and the Control key where the keyboard has no Command key, with the Command key not looked at: `expected 'search' to be null`.

**`seal mutate`, at `86ff640`.** One call over `src/renderer/view.ts` against `test/view.test.ts`, with `--bail 1` and a passing baseline: 47 mutants, 47 red.

- `lineSession` and `workItemEntries`: the oldest pane read, and the entry's pane dropped.
- `sidebarTree`: the first part of the folder as the name; the daemon's name not read; repositories grouped by name; the count fixed at 1; a new repository put first.
- `historyLines`: every line with a state listed; the oldest first; a line with no time first; equal times not kept in the given order.
- `markRanges`: the case of what is typed kept; the case of the text kept; a letter marked twice; a match at the text's end missed.
- `filterChoices`: "All" renamed, and the choice of no agent dropped.
- `matchWorkItems`: the state not read; "No agent" never matched; each of the title, the branch and the repository's name not searched; the folder and the worktree searched; an empty search matching nothing.
- `matchCount`, `matchSentence` and `emptyList`: the two numbers swapped; "work item" said by the count of matches; the repository left out of the sentence; each of the three sentences of an empty list said in another's place.
- `summaryHead`, `summaryCount` and `summaryControls`: each sentence of an empty summary dropped; one change counted as none; the first finished or the last waiting work item opened; a second control where none waits, and none where one does.
- `daemonStatus`: an exited pane counted; a pane of a kind that reports no state counted; "1 agent" said of two.
- `commandKey`: the two keyboards swapped; the other modifier key let through on each; the Option key, the Shift key and an open dialog each let through; any key read as K.

Seven were run alone and their failing lines read: the three above, repositories grouped by name (`expected [ [ '/r/project', 'project', 2 ] ] to deeply equal [ Array(2) ]`), equal times (`expected [ 4, 3, 2, 1 ] to deeply equal [ 4, 2, 3, 1 ]`), "No agent" never matched (`expected [] to deeply equal [ 4 ]`), and the sentence of no look dropped. `gaps.md` carries the 40 that were not run alone.

**One guard no mutant was run for.** `markRanges` gives nothing for an empty search before its loop. Without that line the loop does not end, so a mutant of it would time out and say nothing. The case "gives no place where nothing is typed" runs it.

**No case covers the page.** The five modules of the page, `index.html` and `main.ts` are shown by the drive below and by nothing that runs again.

**The drive, at `86ff640` with a clean tree.** `node build.mjs` ran first. The probe `test_tmp_drive.mjs` in the phase's scratch ran once and reached its end. It started `dist/daemon.js` alone on Electron's own Node, as `ensureDaemon` starts it, with the run folder `/private/tmp/claude-501/owlery-18-p6/run`, and then the app three times on that daemon with `--remote-debugging-port=9356`. The environment and the stand-in for the agent's CLI are phase 2's, so no real agent CLI was started. A second client made the work items and the hook relay fed the payloads. The window had the system's focus.

- *Scenario 1, again.* Three work items in two repositories stood before the load, with two live panes and no look. The sidebar, 256 pixels wide, and the inbox screen from 256 to 1440 were displayed, with three lines under "No agent". The other three screens carried `hidden`. The page held no `.xterm` element, and the daemon's sessions were the same two before and after. The page is 900 pixels high, where it was 868 under the title bar.
- *Scenario 28.* The sidebar listed "project" with 2 and "docs" with 1, each with its folder as its title and its work items under it, each 28 pixels high. "Inbox" said 3. After a `PermissionRequest` was fed, the bell said 1 and the foot "Daemon running, 1 agent". A press on "Alpha task" in the sidebar displayed its view from 256 pixels on, with the tab `Shell 1`, one terminal displayed, no `#view-nav`, and `aria-current` on that entry alone. A press on "Session store" there displayed that view and moved the mark. With one finished work item, "History" listed that one alone under no heading, with its preview. A press on the fold control of "project" set `aria-expanded` to false and its two work items had no box, and a second press showed them again. The elements at 10,10, 40,20, 70,12 and 79,39 of the page were `#sidebar-top`, which has no child and the style `-webkit-app-region: drag`.
- *Scenario 29.* With ten work items, K with the Command key put the focus in the search field. The key event carried `code: "KeyK"` and a Korean letter as `key`. "sess" typed gave "3 of 10" in the field, three lines in the list, three work items under two repositories in the sidebar, the marks "Sess" and "sess", "SESS" and "sess", "sess" and "sess" in the titles and branches, and the head `3 of 10 work items match "sess" in title, branch or repository`. Escape emptied the field, brought back all ten in both, and put the keyboard on the selected line. "Working" chosen in the list's head left the one working line in both, and the sidebar's filter showed "working". The bell's press set both to "waiting". "zzz" gave "0 of 10", "No work item matches.", no repository in the sidebar and no preview.
- *The search's key in a terminal.* With the keyboard in a pane's terminal, K with the Command key put the focus in the search field, and Escape returned it to the page with the view still displayed.
- *Scenario 7, again.* From Alpha's view, the sidebar's "Inbox" displayed the inbox screen with no terminal displayed, Alpha's line selected and the keyboard on it. A `PermissionRequest` then put "Session store" under "Waiting for you".
- *Scenario 18, again.* J, K and Enter were sent with `code` set and a Korean letter as `key`. With three lines and the first selected, J twice and K once selected the second, and the preview showed it. J on the last line and K on the first changed nothing. J typed in the title field of the form, which the sidebar's "+" opened, wrote "j" and left the selection. Enter opened the selected work item's view. On the history screen Enter opened the one line's view, and "History" from that view put the keyboard back on its line.
- *Scenario 21, again.* A second client took a look while the agent worked. A `PermissionRequest` was fed and one commit made with no client connected. The app then opened on the summary: "1 waiting for you", the line "Waits for you. 1 new commit since you were last here." with its seal's place named "No seal yet", "Answer the first question" with the keyboard on it, "Open the inbox" beside it, and no `.xterm` element. The sidebar's "Summary" said "1 new". "Open the inbox" displayed the inbox, where that title was `rgb(232, 234, 238)` at weight 600 and the nine others `rgb(197, 202, 211)` at 500, in the list and in the sidebar alike. The sidebar's "Summary" displayed the summary again with the same line. Enter there opened the waiting work item's view.
- *Scenario 22, again.* After a look and no change, the app opened on the inbox, "Summary" had no count, and no title was marked. A press on "Summary" displayed "Nothing changed since you were last here." with no line and the one control "Open the inbox". With the debugging port's focus emulation switched off, the daemon's look carried a later time.
- *With no look,* "Summary" displayed "No earlier look is recorded." with no line, and "History" displayed "Nothing has finished yet." with no preview.

The screenshots are `shot-1-inbox.png` to `shot-15-summary-nothing-changed.png` in the phase's scratch. The builder read three of them: the search, Alpha's view and the summary. `gaps.md` names what the drive did not reach.

**Scenarios 13 and 14, executed at `86ff640`.**

- 13: `git grep -n -i -e claude HEAD -- apps/desktop/src/renderer` printed nothing and exited 1. `git grep -c -e sidebar` over the same path counts lines in three files, so the path is searched.
- 14: `git diff --stat e720eb1..HEAD -- apps/desktop/src/daemon apps/desktop/src/shared apps/desktop/test/daemon.test.ts` printed nothing.
- *Removes*: `git grep -n -e 'id="bar"' -e 'class="emblem"' -e view-nav -e back-to-inbox -e view-work-items HEAD -- apps/desktop/src/renderer` printed nothing and exited 1.

**The phase boundary run.** `pnpm run test test/view.test.ts` at `86ff640` with a clean tree: 1 file, 105 passed, exit 0. It is the one test file the phase changed and the one that reads a path the phase changed (`grep -l` over `test/*.ts` for `renderer/`, `main/main` and `index.html`). The repository's contribution guide names no tree-wide test file.

**After the drive.** The probe stopped the four processes it started with SIGTERM, by the ids in `pids.txt`, and none was alive afterwards. `/private/tmp/claude-501/owlery-18-p6` was removed, after `daemon.log`, `work-items.json` and `last-look.json` were copied to `run-kept/`. `~/.owlery` did not exist after the run. `shasum` of `~/.claude/settings.json` and `~/.claude/settings.local.json` printed the same two hashes before and after.

## What phases 7 to 9 need from the page

- **A part is added to both list screens in the template** `#list-screen` of `index.html`, and found in `list.ts` by its `data-part`.
- **The session a line reads** is `entry.session`, from `workItemEntries`. `lineText`, `stateSays` and `ageOf` read it there.
- **The key that opens the form** joins `commandKey`, which returns `"search"` or `null` today, and `renderer.ts#onCommandKey` acts on it. The form opens through `openWorkItemForm`.
- **While a search is typed** `held.query` of `shared.ts` is not empty, which is where a line's second row becomes the branch.
- **The theme's control** goes into `#sidebar-foot`, under `#status`.
- **The dot** is `dot` of `shared.ts`, and the seal's place `sealPlace`. Every screen draws both through them.
- **`build.mjs` still copies `owl-icon-cream.svg`,** and the page shows it nowhere since the bar went.

## What the orchestrator's fold needs

The frame says nothing of these facts of the build: the ten functions it does not name; the modules' names, `shared.ts` among them; the template and the ids of the two list screens; the three `select` elements of the one filter; the bell that stays without a count; a repository's count under a search; the words of the status line; and that phase 6 built `summaryControls` and the strong title of the inbox's lines, which row 6 does not name. `changelog.md` is the last phase's to write, and four of its sentences no longer hold: the other work items "at the left" of a view, "the owl emblem in the bar", "Nothing returns to it until the app is opened again", and "a summary that returns while the app stays open" under "Not yet".
