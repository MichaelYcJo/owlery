# Design: 1795397381-summary-of-seals

Issue #22: a person who comes back sees no summary of what changed while they were away. Release 0.0.1 built the summary screen, the daemon's record of the person's last look and the count of work items that wait (#18, built by #37). This work adds what needs a seal: a seal given or broken since the look opens the summary, and the summary leads with those work items, each with its seal.

This frame keeps the words of the frame it builds on in the sense that frame gives them: a **seal**, the **sealed commit**, and a seal that **holds** or is **broken**, of `seal/threads/1795396351-seal-breaks-after-a-commit/frame/design.md`. It adds five, each used in one sense. The **look** is the daemon's one record of when a person last looked, with the lists of that moment (`apps/desktop/src/shared/protocol.ts#Look`). A work item has a **seal reading** on a side, the look's or the present one, where it carries the field `seal` there, whether the field holds a seal or null. A seal was **given since the look** where the work item's present seal is `sealed` and the look does not hold that work item `sealed` at the same commit. A seal **broke since the look** where the present seal is `broken` and the look does not hold that work item `broken` at the same commit. The **changed set** is the work items the window lists as changed since the look, worked out when it loads.

## Grounding

The tree as read at `c148ac4`, which is `41e8aa4` of `release/v0.0.2` and this work item's `routing.md`. A row says `read` where a file was opened and `executed` where a command gave the fact. The frames and the code of the release's other work items are read on their branches with `git show`: #44's at `ce987b7`, #46's at `9be0035`, #43's at `3c13a7a`, #42's at `0cff3e9`, #41's at `2b75d0e` and #27's at `182fa8c`. None has merged into `release/v0.0.2`. #42, #43 and #44 hold a frame and no code, so each coordinate of their code below is named by their frames and has no line yet.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/product.md` *Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call*, the first paragraph (read) | A person who comes back should first see "two sealed, one waiting for an answer." Where a work item changed since the look, the app shows the summary before the inbox: one sentence, one line for each changed work item, no terminal, the inbox one step away. A count of new commits that the daemon gave on one side alone is not read as a change. The summary is skipped where nothing changed or no look is recorded, and stays one step away at any time. The daemon records the look when the window loses focus, is hidden or closes |
| `docs/product.md` *Foundation*, the paragraph "A work item's line shows the decisions made for it in place of asking" (read) | The summary counts the decisions made since the look apart from the work items that wait |
| `docs/product.md` *What we promise* (read) | The seal is bound to one commit and breaks if any commit lands after it. Under `agentic` no question holds the run: what the code and the policy cannot answer is decided on a default and recorded |
| `docs/product.md` *The seal* and *The seal belongs to the product and looks the same everywhere* (read) | The inbox and every other display read the same seal record. The back of the seal is the third place the app shows a seal |
| `docs/design.md` *Principles* 1, 3, 4 and 8 (read) | A red on the screen says that an independent party judged this commit, so no line may show a lit seal for a seal that is broken. One signal is spent on what needs the person. A state is said by a shape, a colour and words. A form is stated in the document before the window draws it |
| `docs/design.md` *The voice of the window's words* (read) | A state is two words at most. Where a sentence counts the work items in a state, the words follow the count, as in "1 needs you, 2 working". A button is the act it does. A fact of the seal is said as a fact |
| `docs/design.md` *A pull request that changes the window carries its screenshots* (read) | A pull request carries a screenshot of each view it changed. The run's views are the inbox, a work item's view, the view of a parked work item, a menu and a dialog. The summary is not among them |
| `docs/architecture.md` *The phone: the terminal session as a chat*, as `seal/threads/1795330500-no-question-holds-the-run/frame/plan.md` *Alternatives considered* reads it (read) | No state lives on the UI's side, so the look is the daemon's and the window keeps none of its own |
| `docs/roadmap.md` *Milestones* row 2 (read) | This work is part of milestone 2. The states of a line as states of their own are milestone 3's, issue #56 |

`docs/README.md` does not stand (executed: `ls docs`), so each `file:` of *Rule changes* is a document of `docs/` read at this commit, and each has a `.ko.md` edition that carries the same operation. `seal/follow-up.md` does not stand (executed: `ls seal`). No release holds a process change: `gh release view --json tagName,body` gave `v0.0.1` with no `Process changes` heading, and `grep -l 'Process changes' seal/threads/*/changelog.md` named no file (executed).

The unsettled designs' rule changes on the sections this work changes. On `docs/product.md` *Foundation*: `seal/threads/1795339001-worktree-setup/frame/design.md` holds an operation at this commit (executed: an `awk` over every `seal/threads/*/frame/design.md` printed each operation's `file:` and `section:`), and #27's, #43's and #46's frames each hold an `add` on their branches (executed: the same `awk` over each frame with `git show`). On `docs/design.md` *A pull request that changes the window carries its screenshots*: #42's and #43's frames each hold an `add`. This work's operations name no sentence of theirs.

What earlier work items decided, which this frame does not argue again:

| Record | What it fixes for this work |
|---|---|
| `seal/threads/1795043695-inbox-first-window/frame/plan.md` *Alternatives considered*, the rows "Keep the look in the window, in the page's `localStorage`" and "Open the summary whenever the window regains focus after a change" (read at `9c0aeb0`) | The daemon keeps the look. The summary opens by itself at a load, and that frame's `frame/questions.md` Q4 left the other moments to the owner |
| `seal/threads/1795043695-inbox-first-window/frame/questions.md` Q4 and Q5, and `gaps.md` *Not verified* (read at `9c0aeb0`) | When the summary opens and what counts as the look were built on defaults the owner has not answered. Which of the window's events carries a look was not shown apart, and a window ended with SIGTERM left a look. The settle of release 0.0.1 re-homed these rows on this issue, and `frame/questions.md` Q1 to Q3 hold them |
| `seal/threads/1795330500-no-question-holds-the-run/frame/plan.md` *Alternatives considered*, the rows "A parked work item's line takes the state `waiting`" and "Replace the line's state with the product's own states", and *Overlap with the release*, the row of #22 (read) | The line's state stays an agent state, and #56 owns its replacement. This work adds its counts beside the summary's sentence |
| #44's `frame/design.md` *Scope* items 1, 3, 5, 15, 18 and 19, *Data & interfaces*, and *Out of scope*, the first item (read at `ce987b7`) | `WorkItem.seal` is a `Seal` or null: the state `sealed` or `broken`, the sealed commit, and one sentence that says why a seal is broken. The daemon reads it when a branch's head moves and when it starts, and stores it nowhere. `shared.ts#sealPlace` takes the seal, and a line of the summary is one of its callers. A broken seal makes the line wait, and a sealed work item with no pull request is `finished`. A notification is raised only where a seal breaks between two lists the window held. A look keeps no seal, and this work adds to the look what it compares |
| #46's `frame/design.md` *Scope* item 1, *Data & interfaces* and *Out of scope*, the item on the summary (read at `9be0035`) | `WorkItem.recorded.rounds` is how many round records the work item's directory holds, read in the worktree. This work builds the summary's sentence for a work item that moved from review to its seal |
| #43's `frame/design.md` *Scope* item 17 and *Data & interfaces* (read at `3c13a7a`) | A work item whose pull request merged counts no decision in `changesSince`. A look keeps `pullRequest` |
| #41's `frame/design.md` *Scope* item 27, and its `last-look.ts` (read at `2b75d0e`) | A stopped chain makes a line wait. A look keeps `chain` |

What the tree holds, at `c148ac4`:

- **The changes are worked out once, at `ready`, and kept.** Read: `apps/desktop/src/renderer/renderer.ts:1444` calls `view.ts#changesSince` and stores the result in `shared.ts#held.changes`, and line 1450 opens the summary where the list holds an entry. `summary.ts#showSummary` draws that list at every opening until the next load. `renderer.ts#takeLists` (line 1209) redraws the sidebar, the list in front and a view at each `inbox`, and does not redraw the summary.
- **A change is a line's state, a rise of the count of new commits, a decision the look does not hold, or a work item the look does not hold.** Read: `view.ts#changesSince` (line 837). It compares `inboxLine(before, look.sessions, paneKinds).state` with the present line's state, so every field `inboxLine` reads must stand in the look, or the two sides differ at every load.
- **A look copies named fields of each work item, and reads a field that came later as its empty value.** Read: `apps/desktop/src/daemon/last-look.ts#lookOf` (line 143), `#isWorkItem` (line 96) and `#CameLater` (line 92). The daemon records the look at `looked` from `workItemList()` (`daemon.ts:1116`).
- **`ready` waits for git 500 milliseconds at most.** Read: `daemon.ts#greet` (line 529) races the read of the branches against `readyWaitMs`. Where the read takes longer, `ready` carries what the daemon holds and the read's result follows in an `inbox`.
- **The summary's main control says "Answer the first question" for the first changed work item whose line waits, whatever makes it wait.** Read: `view.ts#summaryControls` (line 901).
- **The window sends `looked` at `blur`, at `pagehide` and where the page turns hidden, so a load of the page that follows another records a look first.** Read: `renderer.ts:1670` to `1674`. A case therefore cannot put a seal between a look and a load by loading the window's page again: the page that leaves sends a look that already holds the seal.
- **A case writes a look into the run folder before the app starts.** Read: `apps/desktop/test/built-app.ts#BuiltApp.start`, its `writeRun`, and `apps/desktop/test/decisions-and-questions.test.ts`, which writes `last-look.json` there and opens on the summary.
- **The screenshot run captures no summary.** Read: `apps/desktop/test/screenshots.ts#VIEWS`.

What follows from #44's frame and the code above, read and not run, since #44's code is not built:

- **With #44 merged and no seal in the look, a sealed work item reads as changed at every load.** #44's *Scope* item 18 has `inboxLine` give a sealed work item the state `finished` and a broken one `waiting`. The look's copy holds no `seal`, so its line has the state its panes give, and `changesSince` reads the two states as a change at each load until the look keeps the seal.
- **A `seal` that is null before the daemon's first read cannot be told from no seal.** #44's *Data & interfaces* has null say both. A `ready` that goes out before git answered, as from a daemon that just started, then carries null for a sealed work item, and the look holds it `sealed`.
- **A summary line would keep a lit seal after the seal broke.** `summary.ts:50` draws the seal's place from the change's own work item, which is the object of the load.

The probes. Executed: `node -e 'console.log(JSON.stringify({a:{seal:undefined,b:1},c:{seal:null}}))'` printed `{"a":{"b":1},"c":{"seal":null}}`, so a look's file keeps a null seal and drops an absent one, and the two stay apart across a restart of the daemon. Executed: `python3 -B test_tmp_rule_changes.py`, a probe under the framer's scratch directory that loads `skills/settle/scripts/rule_changes.py` of the AgenticSeal plugin calls its `parse` on this file with the policy root `docs`, and calls its `apply_op` for each operation on the document the operation names. The reader returned every operation of *Rule changes*, no error and nothing unread. It found each `section:` as a heading of its file and placed each operation, so each `from:` stands once in its section at this commit.

The ticket as handed over. The issue was read whole with `gh issue view 22 --json title,body,comments` on 2026-11-23 (executed). Its body is not folded. Its one comment is the owner's, of 2026-11-22, from #46's frame: the summary can say that a work item moved from review to its seal, read from the chain state the approval line draws. *Scope* item 7 takes it in. Issue #47 was read the same way: it builds the back of the seal and the sealed work item's view, and names #22 as read beside it.

The mockups. `etcs/` is not in the worktree: git ignores the folder (`.gitignore`, the line `etcs/`), and it stands only in the owner's own clone, where the framer read `etcs/design/inbox-first-mockups/README.md`, `project/canvas.json` and the words of the artboards the issue names (read). A1 is `project/Main.dc.html`, C1 is `project/C-Inbox.dc.html` and C2 is `project/C-WorkItem.dc.html`. A1 opens with "Two sealed. One waiting for you." and groups its lines under "Waiting for you", "Seal broken", "At work" and "Sealed". C1 says of a sealed work item "Sealed at d3bc681 after 2 review rounds. The pull request is open and the seal holds." and of a broken one "Seal broken. One commit landed after it." C2 is the sealed work item's view: the large seal, the seal's record and the back of the seal. The owner chose direction B and then the three themes of `docs/design.md`, so the artboards give this work its words and its order, and no form.

Not shown by anything in this frame: what the window's events do under a person's own hands. `frame/questions.md` Q3 holds it, with why no probe can run here.

## Scope

### The daemon and the look

1. **A work item carries no `seal` until the daemon has read one.** `daemon.ts#workItemOf` leaves the field `seal` out of a work item whose seal the daemon has not read since it started, and out of an archived work item, whose branch it does not read. Null then says one thing: the daemon read the head commit and it holds no seal. `protocol.ts` says so at the field. A window reads an absent `seal` as no seal where it draws the seal's place, as #44 has it read a daemon of an earlier build.
2. **The look keeps each work item's seal reading.** `last-look.ts#lookOf` copies `seal` where the work item carries one: the state, the sealed commit and the sentence. It keeps a null as null and leaves an absent one absent. `#isWorkItem` takes an absent `seal`, a null and a `Seal`, and a file whose `seal` is anything else is no look. `#CameLater` names the field. A look written by a build before this work holds no seal reading for any work item.

### What counts as a change

3. **A seal given or broken since the look makes its work item a changed work item.** `view.ts#changesSince` reads the seal of each side. The table gives the answer for a work item both sides hold with a seal reading.

   | The look holds | Now `sealed` at commit A | Now `broken`, sealed at commit A | Now null |
   |---|---|---|---|
   | null | given | broke | nothing of the seal |
   | `sealed` at A | nothing of the seal | broke | nothing of the seal |
   | `sealed` at another commit | given | broke | nothing of the seal |
   | `broken`, sealed at A | given | nothing of the seal | nothing of the seal |
   | `broken`, sealed at another commit | given | broke | nothing of the seal |

   Where the answer is "nothing of the seal", the work item is changed or not by what `changesSince` reads today. So a seal that left the head, as after a reset or a newer verdict that withholds, is said by the line's state and by no words of the seal.
4. **A side without a seal reading says nothing of the seal.** Where the look's work item or the present one carries no `seal`, the seal is neither given nor broken, and the two lines' states are compared with the seal left out of both work items. So a daemon that just started, a look written before this work, and a look taken before the daemon's first read each open no summary by the seal alone. This is the rule `docs/product.md` *Foundation* states for a count of new commits.
5. **A work item the look does not hold counts its seal as since the look.** It is new since the look, as today. Where it carries a seal reading, a `sealed` one is given and a `broken` one broke.
6. **The summary opens on such a change as it opens on any other.** The changed set is worked out at `ready`, and the app opens on the summary where the set holds a work item (`renderer.ts:1450`). This work adds no other moment at which the summary opens by itself. `frame/questions.md` Q1 holds the owner's open question on the other moments.

### What the summary says

7. **A change's sentence opens with the seal where the seal was given or broke.** In place of the words of the line's state, the sentence opens with "Sealed at `<commit>` after `<N>` review rounds." where the seal was given, and with "Seal broken." and the seal's own sentence where it broke. The commit is shown by its first seven characters. The count of rounds is `recorded.rounds`, and the words after the commit are left out where the daemon sent no `recorded` or the count is 0. What follows is as today: the new commits since the look, and the decisions made without asking. The line's icon still shows the line's state.
8. **The lines lead with the seals.** The order is: the work items whose seal was given since the look, then the ones whose seal broke since the look, then the others in the order of the inbox's groups, as today. Inside each of the first two the work items keep the order the daemon lists them in.
9. **The summary's sentence counts the seals first, and each work item once.** A work item whose seal was given is counted as sealed, one whose seal broke as a broken seal, and every other changed work item by its line's state, as today: "2 sealed, 1 seal broken, 1 needs you, 1 working". The decisions made without asking follow after a full stop, as today. `view.ts#summaryHead` and the sidebar's count read the same changes.
10. **Each line carries its seal as it stands now.** The seal's place of a summary line is `sealPlace("line", seal)` with the seal of the work item as the window holds it at the drawing, not as the load held it.
11. **The main control says why the work item it opens waits.** It opens the first line, in the screen's order, whose work item waits on an open question, a call to allow or a pane that waits, and says "Answer the first question". Where no line waits so and one waits for another reason, as for a broken seal or a stopped chain, it opens the first such line and says "Open the first that needs you". The inbox stands beside it in both, and is the main control where no line waits, as today.

### The summary says the present

12. **The changed set is the load's, and what each line says is the present.** `shared.ts#held` keeps the ids of the changed set, worked out at `ready`, in place of the list of changes. At each drawing of the summary, and for the sidebar's count, the window works out each change again from the look it was given at its hello and the lists it holds now. A work item of the set stays in it though nothing of it differs from the look any more, and its sentence then says its state alone. A work item of the set that the lists no longer hold, as after an archive, has no line.
13. **A seal the daemon read after `ready` joins the set once.** A work item that `ready` carried without a seal reading joins the changed set at the first lists that carry its reading, where its seal was then given or broke since the look. So a daemon that just started, whose `ready` went out before git answered, still gets its seals into the summary. The screen in front does not change for it: the sidebar's count says it, and the summary is one step away. No other change after `ready` joins the set until the next load.
14. **The summary in front is redrawn at each `inbox`.** `renderer.ts#takeLists` draws the summary again where it is the screen in front, without moving the keyboard's focus. So a seal that breaks while the summary is open turns its line's seal to the broken form, its sentence to "Seal broken.", and the count in the summary's sentence with them.

### The evidence

15. **One case drives the built app from a seal given to a seal broken.** In one background start, the run folder holds a look that holds a work item with a null seal, and that work item's branch is sealed before the start by committing the records. The summary comes to count one sealed work item, and its line holds the sealed place. Then one more commit lands, and the summary in front counts one broken seal and its line holds the broken place.
16. **The screenshot run captures the summary.** `test/screenshots.ts#VIEWS` gains `summary`. The run folder holds a look taken before the scene's seals were given, written before the app starts, so the summary leads with the sealed work item and the broken one that #44's scene holds. The crafter runs `pnpm run screenshots` in `apps/desktop` and commits the files under this work item's `screenshots/`.
17. **The changelog says what ships.** This work writes its `changelog.md`.

### Out of scope

- **Opening the summary at another moment than a load.** A person who leaves the window open and comes back to it by a click sees no summary by itself. `seal/threads/1795043695-inbox-first-window/frame/plan.md` *Alternatives considered* rejected the regained focus as the default, and `frame/questions.md` Q1 holds the owner's choice.
- **What counts as the look, and which event sends it.** The window's events stay as they are. `frame/questions.md` Q2 and Q3.
- **The sealed work item's view of C2: the large seal, the seal's record and the back of the seal.** Issue #47 builds it, and names this issue as read beside it.
- **`sealed` and `broken` as states of a line, with their own groups in the inbox and the summary.** Issue #56 owns the replacement of the line's state.
- **A broken seal, its fix and the new verdict as one flow.** Issue #72.
- **When a seal was given or broke.** A1 says "Sealed 25 min ago". A `Seal` holds no time, and a line's age stays the age of its state.
- **Words of the pull request in a change's sentence.** C1 says "The pull request is open". A pull request reaches the summary through the line's state, as #43 gives it.
- **A seal reading that `ready` carried and that was no longer true.** Where a daemon that was running without a client reads a moved head later than `ready` waits, `ready` carries the seal it read before, and the `inbox` that follows carries the new one. The work item joins no set. `frame/plan.md` *Technical context* names this failure, and `frame/questions.md` Q4 what measures it.

### Where each line of the issue lands

| The issue's line | Scope items |
|---|---|
| A change to sealed or broken since the person last looked opens the summary, as a new waiting state does since #18 | 1 to 6 and 13, and scenarios 1 to 6 |
| The summary names how many work items were sealed and broke since the last look, each line with its seal | 7 to 10, 12 and 14, and scenarios 7 to 13 |
| The summary leads with sealed work items, each with its seal, and the ones whose seal broke | 8 and 10 |
| The sealed work item's view of C2 is read beside the milestone's "back of the seal" | *Out of scope*, the third item |
| The comment: a work item moved from review to its seal | 7 |
| The carried rows: which event carries a look, the look the drive could not account for, and Q4 and Q5 of the earlier frame | `frame/questions.md` Q1 to Q3 |

## User scenarios & acceptance *(mandatory)*

No case reaches GitHub, and none starts a real `claude`. The built app starts through `BuiltApp.start` in the background. The crafter shows each new case red before it is planted (contract rule 15). The seals of a case are values of the type #44 gives, or records the case commits in the forms #42's frame gives, as #44's scenario 19 seals a branch.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The daemon sends no seal before its first read | Given a daemon that just started, with a work item whose head holds a seal, and a `readyWaitMs` shorter than the read. Then the `ready` carries the work item with no `seal` field, and the `inbox` that follows carries it `sealed`. Given a work item whose head holds no seal, after the read. Then its `seal` is null. Given an archived work item. Then it carries no `seal` | Cases of `test/daemon.test.ts` |
| 2. The look keeps the seal reading | Given a look recorded from a work item that is `sealed`, one that is `broken`, one whose `seal` is null and one with no `seal`. Then the file read again by a second `LastLook` gives the same four, the last still without the field. Given a file written without `seal`. Then it is a look, and no work item of it carries the field. Given a file whose `seal` is a text, or a seal whose state is another word. Then it is no look | Cases of `test/last-look.test.ts` |
| 3. A seal given since the look | Given a look that holds a work item with a null seal, and the same work item now `sealed` at `3f2a9c1…` with 2 rounds recorded. Then it is the one change, and its sentence opens "Sealed at `3f2a9c1` after 2 review rounds." Given the same with no `recorded`, and with 0 rounds. Then the sentence opens "Sealed at `3f2a9c1`." | Cases of `test/view.test.ts`, under `changesSince` |
| 4. A seal that broke since the look | Given a look that holds a work item `sealed`, and the same work item now `broken` with a sentence. Then it is the one change, and its sentence opens "Seal broken." and holds the seal's sentence | A case of `test/view.test.ts` |
| 5. Each row of the table | Given each pair of *Scope* item 3's table. Then the answer is the table's. Given a work item the look does not hold, now `sealed`. Then it is new and its seal is given | One case of `test/view.test.ts` over a table of the pairs |
| 6. A side without a reading | Given a look whose work item is `sealed` and the same work item now with no `seal`, its pane as at the look. Then nothing changed. Given the look's work item with no `seal` and the present one `sealed`, its pane as at the look. Then nothing changed. Given either pair with a pane whose state moved. Then the work item changed, and its sentence holds no word of the seal | Cases of `test/view.test.ts` |
| 7. The order of the lines | Given changes of which one needs the person, one is at work, one seal broke and two seals were given. Then the lines are the two given in the daemon's order, the broken one, then the one that needs the person and the one at work | A case of `test/view.test.ts` |
| 8. The summary's sentence | Given scenario 7's changes. Then the sentence is "2 sealed, 1 seal broken, 1 needs you, 1 working". Given one seal that broke and nothing else. Then "1 seal broken". Given two that broke. Then "2 seals broken". Given a seal given and three decisions made without asking. Then "1 sealed. 3 decisions made without asking." Given changes with no seal. Then the sentence is as today | Cases of `test/view.test.ts`, under `summarySentence` |
| 9. The main control | Given lines of which the first waits for a broken seal alone and a later one is parked with a question. Then the main control says "Answer the first question" and opens the parked one. Given lines of which one waits for a broken seal alone and none waits on a question, a call or a pane. Then it says "Open the first that needs you" and opens that one, with the inbox beside it. Given no line that waits. Then the inbox is the main control, as today | Cases of `test/view.test.ts`, under `summaryControls` |
| 10. The set is the load's, and the lines are the present | Given a changed set of two ids, worked out from a look and the lists of the load, and later lists in which the first work item's seal broke and the second stands as the look held it. Then the changes worked out again are both work items, the first with "Seal broken." and counted as a broken seal, the second with its state alone. Given later lists that no longer hold the second. Then it has no line. Given later lists with a third work item whose pane's state moved. Then it has no line | Cases of `test/view.test.ts` |
| 11. A seal read after `ready` joins once | Given a look that holds a work item with a null seal, lists of the load that carry it with no `seal`, and later lists that carry it `sealed`. Then it joins the set, and its change says the seal was given. Given later lists that carry it null. Then it does not join. Given a work item the load carried with a null seal, `sealed` in later lists. Then it does not join | Cases of `test/view.test.ts`, on the function that gives the set |
| 12. The seal on a line is the present one | Given the summary drawn for a work item `sealed` at the load. When an `inbox` carries it `broken`. Then the line's seal's place has `data-seal` `broken` and the words #44 gives a broken place | The case of scenario 13 |
| 13. From a seal given to a seal broken, in the window | Given the built app, started once in the background on a run folder whose look holds a work item with a null seal, and that work item's branch, sealed before the start by committing the records. Then the summary's sentence comes to count the work item as sealed, opened by the app or by the sidebar's "Summary", and its first line holds the work item's title, "Sealed at" with the commit's first seven characters, and a seal's place whose `data-seal` is `sealed`. When the case makes one more commit in the worktree. Then, with the summary still in front, its sentence counts one broken seal and no sealed work item, the line's sentence opens "Seal broken." and its seal's place has `data-seal` `broken`, and the keyboard's focus is on the element it was on | One case, in the start `test/decisions-and-questions.test.ts` makes, whose run folder already holds a look. `frame/questions.md` Q6 holds where the case stands if that start cannot hold it |
| 14. The screenshots | Given the change of the summary. Then the run's files hold one of the summary for each theme and appearance it captures, each leading with a sealed line and a broken one. `shots` names it for each appearance | `pnpm run screenshots`, the case of `test/screenshots.test.ts` that names the files, and the review reads the files against `docs/design.md` |

## Data & interfaces

**`apps/desktop/src/shared/protocol.ts`.** `WorkItem.seal?: Seal | null`, with #44's `Seal`. This work changes what the field's absence and its null say, and adds no field and no message.

- Absent: the daemon has read no seal for the work item since it started, the work item is archived, or the daemon is of an earlier build.
- Null: the daemon read the head commit, and it holds no seal.

**`apps/desktop/src/daemon/`.**

- `daemon.ts#workItemOf` adds `seal` only where the map that keeps the seals by work item holds an entry for it.
- `last-look.ts`: `isSeal`, the field in `isWorkItem`, in `CameLater` and in `lookOf`. `lookOf` copies the values of a seal, keeps null and leaves an absent field out of the copy.

**`apps/desktop/src/renderer/view.ts`.** The functions stay pure. The names are the build's to choose.

- One function gives what changed of a seal between a look's work item and the present one: given, broke or nothing, by *Scope* items 3 to 5.
- One function gives the change of one work item against the look, whether or not anything differs. `changesSince` is that function over every work item, keeping the ones that changed, in the order of *Scope* item 8.
- One function gives the changes of a set of ids from the look and the present lists, in the same order, for *Scope* item 12.
- One function gives the changed set after new lists: the set, and each work item of *Scope* item 13 that joins it.
- `Change` gains what changed of the seal. `summarySentence`, `summaryHead` and `summaryControls` take what they need of a change to count the seals and to tell why a line waits.

**`apps/desktop/src/renderer/`.** `shared.ts#held` keeps the changed set's ids and which work items `ready` carried without a seal reading. `summary.ts#showSummary` works the changes out at each drawing, passes each line's present seal to `sealPlace`, and has a way to draw again that leaves the focus. `renderer.ts` works the set out at `ready`, and `takeLists` lets a late reading join it and draws the summary again where it is in front. `sidebar.ts` counts the lines the summary would draw.

**The words of the window.** `frame/questions.md` Q5 leaves their wording to the build, read against `docs/design.md` *The voice of the window's words*.

| Where | Words |
|---|---|
| The summary's sentence, a seal given | "1 sealed", "2 sealed" |
| The summary's sentence, a seal that broke | "1 seal broken", "2 seals broken" |
| A change's sentence, a seal given | "Sealed at `3f2a9c1` after 2 review rounds.", "Sealed at `3f2a9c1` after 1 review round.", "Sealed at `3f2a9c1`." |
| A change's sentence, a seal that broke | "Seal broken." and the seal's sentence, as in "Seal broken. `src/app.ts` changed after the sealed commit `3f2a9c1`." |
| The main control, a line that waits on a question, a call or a pane | "Answer the first question", as today |
| The main control, a line that waits for another reason | "Open the first that needs you" |

## Rule changes

- add
  file: docs/product.md
  section: Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call
  to: **The summary leads with the seals given and the seals broken since the person last looked.** A work item whose seal was given since the look, or broke since it, is a changed work item, so it opens the summary as a new waiting state does. The summary's sentence counts those work items first, as in "2 sealed, 1 seal broken, 1 needs you", and counts each changed work item once. Their lines come first. Each says the commit its seal binds and how many review rounds came before it, or why the seal broke, and each carries its seal. Which work items the summary lists is worked out when the window loads, and what each line says is the work item as it stands now, so no line shows a seal as given after it broke. Where the daemon has not read a work item's seal at the look or now, as just after it starts again, the seal is not read as a change, and a seal the daemon reads after the window loaded joins the summary when it is read.
    check: apps/desktop/test/view.test.ts apps/desktop/test/last-look.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/product.ko.md
  section: 바탕: 작업함, AgenticSeal 프로세스, 인장의 뒷면, 그리고 불러 쓰는 터미널
  to: **요약 화면은 사람이 마지막으로 본 뒤에 찍힌 인장과 깨진 인장을 맨 앞에 둡니다.** 마지막으로 본 뒤에 인장이 찍혔거나 깨진 작업은 바뀐 작업이고, 사람을 기다리는 상태가 새로 생겼을 때처럼 요약 화면을 엽니다. 요약 화면의 문장은 그런 작업을 먼저 세고("2 sealed, 1 seal broken, 1 needs you"), 바뀐 작업 하나를 한 번만 셉니다. 그 작업들의 줄이 맨 앞에 옵니다. 줄마다 인장이 묶인 커밋과 그 앞에 돈 리뷰 회차 수, 또는 인장이 깨진 까닭을 말하고, 그 작업의 인장을 함께 보입니다. 요약 화면에 어느 작업이 나오는지는 창을 불러올 때 정하고, 줄마다 하는 말은 그 작업의 지금 모습입니다. 그래서 깨진 뒤에도 인장이 찍혔다고 보이는 줄은 없습니다. 마지막으로 본 때나 지금 가운데 한쪽에서 데몬이 작업의 인장을 아직 읽지 못했으면, 인장으로는 바뀐 것으로 보지 않습니다. 데몬이 다시 시작한 직후가 그런 때입니다. 창을 불러온 뒤에 데몬이 읽은 인장은 읽힌 때에 요약 화면에 들어갑니다.
    check: apps/desktop/test/view.test.ts apps/desktop/test/last-look.test.ts apps/desktop/test/daemon.test.ts
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: A screenshot is made from the built app, and the views are the inbox, a work item's view, the view of a work item parked with questions, a menu and a dialog.
  to: A screenshot is made from the built app, and the views are the summary, the inbox, a work item's view, the view of a work item parked with questions, a menu and a dialog.
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 스크린샷은 빌드한 앱에서 만들고, 화면은 작업함, 작업 화면, 질문 때문에 멈춰 둔 작업의 화면, 메뉴, 대화 상자입니다.
  to: 스크린샷은 빌드한 앱에서 만들고, 화면은 요약 화면, 작업함, 작업 화면, 질문 때문에 멈춰 둔 작업의 화면, 메뉴, 대화 상자입니다.
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: The command writes one PNG file of the window's size, 1440 by 900, for each of the five views in each appearance of Night watch, ten files named `<theme>-<appearance>-<view>.png`.
  to: The command writes one PNG file of the window's size, 1440 by 900, for each of the six views in each appearance of Night watch, twelve files named `<theme>-<appearance>-<view>.png`.
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 명령은 Night watch의 두 모양마다 다섯 화면을 창 크기인 1440 x 900의 PNG 파일로 하나씩 씁니다. 파일은 열 개이고 이름은 `<theme>-<appearance>-<view>.png`입니다.
  to: 명령은 Night watch의 두 모양마다 여섯 화면을 창 크기인 1440 x 900의 PNG 파일로 하나씩 씁니다. 파일은 열두 개이고 이름은 `<theme>-<appearance>-<view>.png`입니다.
- add
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  to: **The screenshot run captures the summary.** Its run folder holds a look taken before the scene's seals were given, so the summary leads with a work item whose seal was given since the look and one whose seal broke since it.
    check: apps/desktop/test/screenshots.test.ts
- add
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  to: **스크린샷 실행은 요약 화면도 찍습니다.** 실행 폴더에는 장면의 인장이 찍히기 전에 마지막으로 본 기록이 있습니다. 그래서 요약 화면의 맨 앞에는 그 뒤에 인장이 찍힌 작업과 그 뒤에 인장이 깨진 작업이 옵니다.
    check: apps/desktop/test/screenshots.test.ts

## Removes

This work adds one rule to the policy and one view to the screenshot run. In return it takes out the list of changes the window kept from its load, and the null that said two things. The catch record of what goes: the kept list caught nothing, and it is what would show a seal as given after it broke (*Grounding*, what follows from #44's frame). The null that said both "no seal" and "not read yet" would open a summary at every start of the daemon.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The list of changes kept from `ready` until the next load, and the sentences that say it is worked out once | `apps/desktop/src/renderer/shared.ts#held`, the field `changes` with its comment; `apps/desktop/src/renderer/renderer.ts`, the comment above line 1444 that ends "so the changes are worked out here, once"; `apps/desktop/src/renderer/summary.ts#showSummary`, the sentence of its comment "which it shows at every opening until the next load" | `held` keeps the changed set's ids, and the changes are worked out at each drawing (*Scope* item 12) |
| The null of `seal` that also says the daemon has read none yet | `apps/desktop/src/shared/protocol.ts#WorkItem`, the sentence of the field `seal` that #44 writes, "or that the daemon has read none yet", and `apps/desktop/src/daemon/daemon.ts#workItemOf`, the null it sends for a work item it has not read, as #44 builds it | The field is absent until the first read (*Scope* item 1) |
| The one label of the main control for every line that waits | `apps/desktop/src/renderer/view.ts#summaryControls`, the label "Answer the first question" given to a line that waits for any reason | The label says why the line waits (*Scope* item 11) |
| The pins of the summary's functions that the new order and the new label change | `apps/desktop/test/view.test.ts`, the cases under `summaryControls` and `summarySentence` that build a change from a line's state alone | The same cases, built from what the functions now take (scenarios 8 and 9) |
| The pin of the run's files without a summary | `apps/desktop/test/screenshots.test.ts`, the case "names one file for each view in each appearance of each theme", its list of files and its totals | The same case, with the summary's files (scenario 14) |
| The sentences of the policy that list the run's views and count its files | `docs/design.md` *A pull request that changes the window carries its screenshots* and the same section of `docs/design.ko.md` | *Rule changes*, the `change` operations, which the settle writes |

Framed 2026-11-23 by framer, before the build.
