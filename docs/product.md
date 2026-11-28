# Product: a cleared PR

*English · [한국어](./product.ko.md)*

## What we promise

**Answer once, and you get a PR cleared by an AI that did not build it. The inspection is bound to one commit, and it lapses if any commit lands after it.**

A person answers the questions about one issue once and walks away. Design, implementation, review rounds, the broad gate and the independent verdict then run without the person. At the end, the PR opens only when an inspector that built none of the work clears it. The grounds for that verdict stay in the user's repository.

**Owlery is one tool that runs IADD, and the Owl Chain is the default workflow it ships.** IADD, Independent AI-Driven Development, is the method under the line *Zero Self-Approval*: no AI approves its own work. [docs/iadd.md](iadd.md) defines it: its principles, its names, its records, what a workflow is, and what holds for every workflow. Workflows are composable: a person picks a skeleton, customizes each stage's prompt, skills, model and provider, and registers the inspector module the workflow ends in. The app ships the Owl Chain as the first workflow in that form and reads no other yet ([What no code reads yet](iadd.md#what-no-code-reads-yet)). The Owl Chain is the system setting a repository runs until a person picks or builds another, and every section below describes the Owl Chain.

**Under the routing answer `agentic`, no question holds the run.** `agentic` is the answer by which a person leaves each work item's route to the orchestrator and walks away. What needs the person is asked once, in one batch, before the first edit of the request, for every work item the request hands over. A question that arises after the batch is first decided from the code and the policy, which are the repository's documents, its config and the earlier work items' records, and the decision is recorded as one made without asking. What is decided in place of asking is counted on the work item's line and listed with its grounds in the work item's preview and view, where the person can reverse it when they come back. Only what the code and the policy cannot answer and the session cannot give itself, such as a permission, a credential or an approval, parks the one work item it belongs to, with the question on that work item's line in the inbox, and every other work item goes on. Owlery posts no question on a GitHub issue. A late question would otherwise stop the whole run until the person is back, and that wait is what the promise removes.
check: apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts

## Who it is for

Individual developers, open-source maintainers and tech leads of teams of 2–10 who already run several Claude Code sessions and work in a terminal. Their bottleneck is rereading the PRs that agents made. Enterprises are not the audience, because we cannot take on security certification, SSO and audit requirements within the first year. Non-developers and people who prefer to work in a chat screen are not the audience either. That is a choice of who we build for: the desktop app has no chat screen ([What we deliberately don't do](#what-we-deliberately-dont-do)).

## Foundation: the inbox, the Owl Chain and the inspection sheet, with terminals on call

Owlery opens on the inbox, not on a pane of terminals. Each work item shows its state (waiting for answers, in progress, cleared, inspection lapsed) on one line. A person who comes back should first see "two cleared, one waiting for an answer." Where a work item changed since the person last looked, the app shows a summary before the inbox: it says in one sentence what changed, gives each changed work item a line, holds no terminal, and the inbox is one step from it. Where the daemon gave a work item's count of new commits at the look and not now, or now and not at the look, as just after the daemon starts again, that count is not read as a change. Where nothing changed, or no earlier look is recorded, the summary is skipped and the app opens on the inbox. The summary stays one step away at any time. The daemon records the look when the window loses focus, is hidden or closes. That first screen fits the promise of handing work off and walking away.

The base is three things: the inbox, the Owl Chain that runs from design to the inspection without a person, and the inspection sheet. For an issue a person hands over, the Owl Chain does not run in a terminal. The daemon runs its stages in the background, and their results appear in the inbox and on the inspection sheet. For a branch a person drives, the pane's own session runs the stages from the review rounds to the inspection, as the two paths below say.

- **The sessions a person drives open in a terminal.** In the first version, a session the person drives is the agent's own CLI in a terminal pane: Claude Code, Codex CLI or any other. A Claude Code pane of a repository on the Owl Chain carries Owlery's role bundle, for that session alone. The Owl Chain is Owlery's default workflow: the roles of its bundle, which review a branch, fix what the review found and inspect it. A repository is on the Owl Chain where the pull request check installed in it is Owlery's. Owlery exists to make the process easy to use, so the process moves into the session the person already works in (the owner, 2026-11-24). The bundle reaches the session on its command line, and Owlery writes no file of the person's Claude Code, so the person's own plugins and skills stay beside it. Every other pane is the CLI launched as it is: a shell, another agent's CLI, and a Claude Code pane of any other repository. Every feature of the CLI works there as it does outside the app, and no agent needs special support from the app. The user's CLI holds the login, and Owlery provides no login of its own. The user also chooses in the CLI whether to use a subscription or an API key.
- **The app reads only what the inbox needs.** It needs to know whether a session is working, waiting for the person or finished, and whether its branch got new commits. Claude Code reports the first through hooks, and through its session log where a person interrupts a turn, and git shows the second. Wherever the work happens, a commit that lands after the inspection lapses it. The desktop does not redraw the conversation as a chat. Only the phone shows the same session as a chat ([The phone: the same session as a chat](#the-phone-the-same-session-as-a-chat)).
- **It stays light.** Light is relative here, not an absolute number. Products that carry a chat screen next to the terminal, and add a full editor, a browser, team management and a cloud on top, need more memory and disk. Owlery carries less, so it needs less. Electron stays, and lightness is kept by scope and by measurement. Owlery spends as little memory as it can, a feature costs nothing while nobody uses it, and what a scene costs (one state of the app, written down so that it can be measured again) is measured and published beside the same scene in comparable products. The app itself with four terminals visible read about 500 MB, which is a measurement of one scene and not a limit on any feature. The app uses one window, draws only the terminals that are visible, and ends each stage's agent process when the stage finishes, so memory grows with the stages working right now, not with the work items left open. How many agents and worktrees run at once, and how many panes a view shows at once, are defaults read from the person's machine, which the person sees and changes ([Memory design](architecture.md#memory-design), [Where performance differs](#where-performance-differs)).

Our part sits on top of that. There are two paths to an inspection.

- **Work in a Claude Code pane, and its session runs the Owl Chain.** In a repository on the Owl Chain the pane's session takes the branch it built through the review rounds, the repository's broad gate and the inspector, before the pull request opens. The session starts each role as a subagent of the bundle. Owlery's code keeps the order, runs the gate and writes each record, so the app and the check read an inspection from a pane as they read any other. In release 0.0.3 a pane's chain runs from the review rounds to the inspection, on what the session built: design and implementation as stages of the process come with the second path. A branch built without the chain, in another agent's pane or in a repository that is not on the Owl Chain, gets no inspection from a pane. An inspection for a branch another agent built follows once how to record such a branch is settled ("Build order" in [architecture.md](architecture.md)).
- **Hand over an issue from the start.** Answer the question batch once, and the daemon carries design, implementation, review and the inspection through without the person. The promise above describes this path.

Both paths end in the same inspection, and a commit that lands after the inspection lapses it.

**A work item's line shows the decisions made for it in place of asking, and a parked work item's line shows its question.** A parked work item stands with the work items that wait for the person, and its line says the first question it waits on. A decision holds nothing. The line says how many decisions the person has not seen, and how many reversals wait for a stage. The work item's view lists each decision with its grounds. A person reverses one there with a message, which the work item's record keeps. Where the record holds a word of the person's that no commit holds yet, the view says so and why, and the line says so where a commit of it failed. The summary counts the decisions made since the last look apart from the work items that wait. The inbox shows what the person has yet to see, and the work item's records keep the grounds. An archive takes a work item's decisions off the inbox and the summary with it, and an answered question leaves the work item's view at the next look.
check: apps/desktop/test/view.test.ts apps/desktop/test/daemon.test.ts

**A setup that fails leaves its work item created and usable, and the work item's line says so.** The line says "Setting up" while the command a repository names runs, and "Setup failed" where a copy failed, where the command ended with a code other than 0, where a signal ended it, where its pane ended before the command did, as when the person closed it or the daemon stopped, and where `.worktreesetup` changed after it was shown, so no command ran. A setup that succeeded leaves the line as it is, since the line carries what a person acts on. The work item's view says what was copied, what was not and why, and how the command ended, and offers to run the setup again, which copies what is missing and runs the command the section names in a new pane. The "New work item" form names the command before the person creates the work item, and the creation runs it only where `.worktreesetup` still holds it ([State lives in three places](architecture.md#state-lives-in-three-places)).
check: apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts

**A line whose agent asks a question says the question and the choices the agent offers, and the window takes no answer.** The preview and the work item's view list each choice with what the agent says it leads to. The person answers in the agent's own pane, where the CLI asks: the window reports and does not converse ([Principles](design.md#principles)). The question and its choices come from the agent's event and never from the terminal ([Overall layout](architecture.md#overall-layout)).
check: apps/desktop/test/view.test.ts apps/desktop/test/daemon.test.ts

**A work item says how far its branch is ahead of its base branch and how far behind it.** Behind is how many commits the base branch holds that the work item's branch does not, so a person sees that the base moved before they ask for an inspection or a merge. Both are counted against the base as the person's clone holds it. Owlery asks no remote for the count, so the count against a remote's branch moves at the person's fetch. A base that moved is not counted as a change of the work item since the person last looked.
check: apps/desktop/test/worktrees.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts

**A work item's line names the stage that runs for it.** While a chain runs a stage and nothing on the line needs the person, the line's second row says the stage in short, as in "Proofer, round 2", and the line's age counts from the stage's start. A line that waits on a question or on its pane keeps saying so while a stage runs.
check: apps/desktop/test/view.test.ts apps/desktop/test/approval-line.test.ts

**A work item whose pull request merged shows no decision on its line or in the summary.** The merge takes the work item's decisions off the inbox, the summary and the filter of the decisions, as an archive does. The work item's view goes on listing each decision with its grounds, and the work item's record keeps them.
check: apps/desktop/test/view.test.ts

**The summary leads with the inspections cleared and the inspections lapsed since the person last looked.** A work item whose inspection was cleared since the look, or lapsed since it, is a changed work item, so it opens the summary as a new waiting state does. The summary's sentence counts those work items first, as in "2 cleared, 1 inspection lapsed, 1 needs you", and counts each changed work item once. Their lines come first. Each says the commit its inspection binds and how many review rounds came before it, or why the inspection lapsed, and each carries the inspection's mark. Which work items the summary lists is worked out when the window loads, and what each line says is the work item as it stands now, so no line shows an inspection as cleared after it lapsed. Where the daemon has not read a work item's inspection at the look or now, as just after it starts again, the inspection is not read as a change, and an inspection the daemon reads after the window loaded joins the summary when it is read.
check: apps/desktop/test/view.test.ts apps/desktop/test/last-look.test.ts apps/desktop/test/daemon.test.ts

**A new work item makes a worktree, and its branch is one the person picked or one Owlery makes later from the work's name.** The "New work item" form offers the repository's branches under the base, and "No branch yet" first. A branch the person picks is checked out as it stands, and one another worktree has checked out cannot be picked. With no branch picked, the worktree stands detached at the base, and the repository gains no branch. Owlery makes the branch at the first commit in the worktree, or when the person renames the work item, whichever comes first, named `owlery/` and the work item's name. A branch the worktree took up by itself before then, as an agent's `git switch -c` makes one, becomes the work item's. A repository so gains no branch named after nothing, which each creation added before.
check: apps/desktop/test/worktrees.test.ts apps/desktop/test/daemon.test.ts

## The inspection

The Owl Chain's inspector works after the review rounds end and the broad gate passes. It checks every party's claims against the issue and the tree, and binds the verdict to a specific commit. The inspection's record shows the result as the fields below.

| Field | Meaning |
|---|---|
| tree | The commit and branch that were inspected |
| base | The base branch's commit |
| item | The work item |
| gate | The commit on which the broad gate passed |
| rounds | The number of review rounds |

The app shows this inspection in three places.

1. **An approval line per work item.** It shows how far one work item has come through framer, crafter, proofer and inspector, in the work item's view and in its preview. Each role has a place, with a mark, the role's name and a short note: not started, at work, waiting for the person, or how it ended. The line is drawn from the work item's records, from the state of its chain and from the stage the chain command handed a pane's session, and from no hook. The records give the frame, the commits of the branch, the rounds recorded, the gate's last run and the inspector's last verdict, and the chain gives the stage that runs and the one that failed. In a pane the session runs the stages, so a role's place is at work from the step the chain command hands it until the command records the role's answer, the command hands no stage, or the pane is closed or its process ends. A place that waits or failed says why under the line.
check: apps/desktop/test/chain-records.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts apps/desktop/test/approval-line.test.ts
2. **The inspection on the PR.** An inspection is cleared at a branch's head commit where nothing but the closing records differs between the inspected commit and that head, and a round read every commit that changed anything else. Any other commit that lands after the inspection lapses it, and a merge of the base is such a commit. The work item's line shows the inspection's mark lit where the inspection is cleared and parted in two where it lapsed. An inspection that lapses makes the line wait and raises a notification, and the inspection's place says why it lapsed. The window holds nothing to press for a new inspection: the way back is the chain of the pane's session, which then owes one review round, the broad gate and the inspector over the part that changed. On the pull request the check `inspection` judges the same records, with or without the app: the commit that lapses an inspection fails the check once it is pushed, and the check's title says that the inspection lapsed. The app and the check are held to one answer for what lands after an inspection Owlery cleared. Records that no run of Owlery wrote, written by hand or by another tool, can get two answers from them.
check: apps/desktop/test/inspection-state.test.ts apps/desktop/test/pr-check.test.ts apps/desktop/test/view.test.ts apps/desktop/test/chain.test.ts
3. **The inspection sheet.** It shows the defects the review caught and fixed before the PR side by side with the cost of each stage. This is where the inspection shows, in the user's own numbers, whether it is worth what it costs. A cleared work item opens to it. It holds the inspection's record, then each review round with its findings, each at its file and line with the commit that fixed it, and beside each round the stages that ran for it, each with its cost, its tokens and its time. A defect caught and fixed is a finding closed as fixed that no later round reopened, and rounds that caught nothing say so with their cost. A cost under a subscription login carries the word "converted", and a converted cost is never added to a charged one. A lapsed inspection's sheet stays whole and names the commit that lapsed it. A work item with no inspection yet shows the rounds and the cost so far. Where the stages of a chain ran outside the daemon, in a pane's session or in another tool, the sheet says so and shows no cost of them, since Owlery read none. The pull request's body carries the same findings and the same sums in a section of its own.
check: apps/desktop/test/inspection-sheet.test.ts apps/desktop/test/inspection-sheet-records.test.ts apps/desktop/test/inspection-sheet-view.test.ts apps/desktop/test/pull-request.test.ts

## The inspection belongs to the product and looks the same everywhere

The inspection splits into three layers. The judging party can change, but the product defines the records and the display and keeps them the same everywhere.

| Layer | What it is | Whose it is |
|---|---|---|
| Judging party | The agent that runs the review rounds and the inspector | The role definitions belong to the product. In the first version the implementation is Claude carrying the Owlery role bundle, and porting the same role definitions lets another model take its place |
| Inspection record | Which commit was judged against which base, whether the broad gate passed on that commit, the number of review rounds and the verdict. Also who judged it (which model, which rules version) | The product. It stays as a file in the user's repository |
| Display | The app's inbox and inspection sheet, the PR body, GitHub's check results, the terminal, the phone | The product. All of them read the same record |

Owlery's records show why this split works. The verdict's result is plain text: the `iadd` block (the commit inspected and the verdict) inside `inspection.md`. `chain_check`, which checks it on the PR, is a Python script. Neither needs Claude to run. Only the judging party, that is the agent definitions, is tied to Claude.

Two things hold even when the judging party changes.

- **The party that built the work cannot clear it.** This is IADD's *Zero Self-Approval*. A party here means a session, not a model. The inspection record names both the session that built the work and the session that inspected it, and if the two are the same, it is no inspection. The judging session starts fresh and reads only files, so a Claude session can judge what another Claude session built. When the judge runs on another model than the builder's, of another company or of the same one, the two differ at the model level too, which lowers the chance that both miss the same defect, and the inspection record shows that as well.
- **The inspection shows who inspected it, and what produced it.** Once several models can inspect and a person can compose a workflow, inspections carry different weight, so the person looking at one needs to know. The verdict block names the model, the workflow and the inspector module.

The app has themes, and a theme changes colours, typefaces, texture, how the inspection's mark is lit, and the form of edges, rules and marks. No theme changes the layout, the words, the mark's drawing or the wax's red, and in every theme red stands on the inspection's mark alone: a button, a mark and a failure take another colour. The window has three themes: Night watch, which a first run opens in, Register and Desk. Each has a dark and a light appearance, and a person chooses one or lets the system's appearance choose. [docs/design.md](design.md) states each theme.
check: apps/desktop/test/themes.test.ts apps/desktop/test/appearance.test.ts

## File explorer and editor

Sometimes the inspection sheet is not enough for a person to decide on a merge. They may need to see what a line the review flagged actually looks like. Or it may be faster to fix something themselves, such as one comment line, one name or a value in a `.env` file. So the app has a light editor for viewing and fixing files.

- **Each work item shows its own tree.** Each work item runs in its own worktree (a separate folder checked out from the same repository for each work item), so the explorer shows the selected work item's worktree. Files changed from the base branch are marked.
- **You go straight in from the inspection sheet.** Clicking a finding the review raised opens that line of that file, and you can view the diff of the commit that fixed it alongside.
- **Editing is blocked while the agent is changing that work item.** If a person and an agent change the same file at once, there is no way to decide whose change survives. Once the work item is waiting for the person's answer, or after it has been cleared, editing is allowed.
- **A person's edits also go through review before the work is cleared again.** The Owl Chain never leaves changes made after the last review round unread by any round. So a person's edit becomes a commit, and an edit after the inspection lapses it. The inspection's place shows the lapse on the spot. The chain of the pane's session brings a new inspection, and then one review round and the inspector read only the part the person changed.
- **Files that git ignores, such as `.env`, do not become commits.** Editing them neither lapses the inspection nor starts a review round. A new worktree gets the ignored files its repository names in `.worktreeinclude`, such as `.env`, copied from the main checkout. Where the repository names none, a new worktree has no `.env` of its own, which is often the first thing a person fills in ([State lives in three places](architecture.md#state-lives-in-three-places)).
- **Edits made outside the app are caught by watching the tree.** The person may also change files in their own editor or shell, and the app cannot block that. If the tree changes while a stage of the Owl Chain is changing that work item, the daemon stops that stage and tells the person. Tests a person runs do not count as the broad gate. The inspection relies only on the result of rerunning, on that commit, the broad gate command set in the repository.
- **You can also hand off a fix in words.** Select lines and leave "change this to that", and the app passes it to the crafter in the same shape as a review finding. After the fix, one review round runs and a new inspection is given. Whether the person edits directly or hands the fix off in words, the way back to a cleared inspection is the same.
- **Large changes open in the user's own editor.** The app does not take on work that needs a language server, extensions or a debugger.

## The phone: the same session as a chat

On the desk, a person works in the agent's own CLI in a terminal. The phone (after the first version, Android first) shows the same terminal session as a chat. It is one session seen in two shapes, not a second session. The phone does this for every agent the person runs, not only Claude Code, and its traffic passes through no agent company's server ("Connecting from outside" in [architecture.md](architecture.md)).

| What the phone does | How |
|---|---|
| Show the conversation as a chat | From the CLI's hooks first, and from the session log the CLI writes to disk as a supplement. It never reads the terminal screen |
| Approve or deny a permission request | The CLI's permission hook waits for the answer from the phone and returns allow or deny |
| Reply, or give a new instruction | The daemon types it into that terminal, only while the terminal is waiting for input |
| Stop | The daemon sends the interrupt key |
| Anything else | Opens the terminal screen as it is. Slash menus, model pickers and other controls that exist only in the CLI are not turned into chat |

The phone also shows the inbox, the question batch and the inspection, which read the same records as the desktop. How each part is read is in "The phone: the terminal session as a chat" in [architecture.md](architecture.md).

## Voice input (after the first version)

Voice input comes after the first version. It goes where speaking is faster than typing.

- **Answering the question batch,** above all on the phone while away from the desk.
- **Giving an instruction after selecting lines,** in the editor or on the inspection sheet, where the person points at the code and says what to change.

How the speech is recognized is in "Open decisions".

## Where performance differs

All the differences come from one structure. The Owl Chain hands each stage's result on as files (design, round records, inspection) and ends that stage's agent. This differs from a structure where one conversation carries one work item to the end.

Everything below is a hypothesis. Only the second has a number measured in the app itself, and `apps/desktop/measurements/memory.md` holds its number, its date and its method. No comparable product has been measured in the same scene yet. The others have not been measured yet.

| Hypothesis | Why we think so |
|---|---|
| The memory the Owl Chain uses scales with the number of stages working right now, not with the number of open work items | There is no reason to keep a finished stage's Claude process alive. One Claude process uses 345–679 MB (measured 2026-11-17) |
| The app itself with four terminals visible uses less memory than comparable products in the same scene | When it draws only the terminals visible in one window, four WebGL terminals in Electron used 460–492 MB (measured 2026-11-17), and the app itself read about 500 MB in that scene (491.1–503.4 MB, measured 2026-11-19). That number is a measurement of one scene, not a limit on a feature ([Memory design](architecture.md#memory-design)). There is no built-in browser |
| Each agent's context stays constant | Each stage starts by reading only the previous stage's files. Context does not pile up as a conversation grows |
| Resuming a stopped work item is nearly free | The state is in files, so launching the next stage fresh is enough |
| Work items in the same release have fewer merge conflicts with each other | The framer judges where a work item overlaps other work items in the same release, and writes in the design which one merges first |

### Benchmark plan

Process the same 10 issues from one repository with a single-agent tool and with Owlery, and measure the following.

- Peak memory (sum of macOS phys_footprint)
- Tokens per merged PR
- Latency per turn
- Number of merge conflicts
- Time from start to merge

Each work item launches stages four or five times, so it will likely use more tokens than a single agent. This benchmark must therefore show "defects the review caught before the PR" side by side with the cost.

## What we deliberately don't do

- In the first version, the implementation on the inspecting side (review rounds and inspector) is only Claude with the Owlery role bundle. Any agent's CLI can run in a session's terminal, but we keep the inspection's quality on the side we can control. That holds in a pane too: the roles that judge a pane's branch are subagents of its Claude Code session, started from Owlery's bundle, and no other agent's pane carries the chain.
- There is no chat screen on the desktop, and no adapter that drives the person's agent through an SDK. A chat screen built on an SDK reaches only part of the CLI's features (slash commands, plugins, skills and new features come late or not at all), and what it shows is an interpretation of what the agent actually does. The person works in the agent's own CLI, and only the phone draws a session as a chat ([The phone: the same session as a chat](#the-phone-the-same-session-as-a-chat)).
- We do not build an IDE, a kanban board or a built-in browser. There is a light editor for viewing and fixing files, but no language server, extensions or debugger ([File explorer and editor](#file-explorer-and-editor)).
- We do not build team management, roles or admin screens. Each person runs Owlery on their own machine, and it works locally without an account. A team shares the work through the repository and its PRs, where the inspection records already live.
- The first version has no mobile app. The phone comes next, the daemon's protocol is designed for it now, and how a phone reaches the daemon is already settled ("Connecting from outside" in [architecture.md](architecture.md)).
- We do not run cloud sandboxes ourselves.
- There is no mode that leaves records uncommitted. The promise holds only if the inspection's grounds are bound to a commit. So a repository that cannot keep work records in its tree is out of scope ("Records are committed to the repository" in [architecture.md](architecture.md)).
- We do not build a review bot that runs after a PR opens. Owlery can be used alongside such tools.
- We do not use throughput claims ("100x").
- **Owlery deletes nothing of a person's work without that person's word.** An archive is the way out of the list, and it removes nothing. A delete removes a work item's worktree, and the local branch Owlery made for it, after the person confirms. A branch the person picked when making the work item, and one its worktree took up by itself, stays, and the delete's dialog says so. Where a commit no other branch holds, a change no commit holds or an untracked file would be lost, the delete runs only after the person has read each by name and chosen to force it. The files git ignores, such as `.env`, are named and go with the worktree without the force. Removing a repository from Owlery removes nothing on disk unless the person chooses it there: one choice deletes its work items' worktrees and local branches as a delete does, and another moves the repository's folder to the Trash. Nothing removes a branch on a remote.
check: apps/desktop/test/daemon.test.ts apps/desktop/test/worktrees.test.ts

## What the user sees in the first session

1. The user picks one real issue from their own repository, gets all the questions at once and answers them.
2. From then on the work proceeds without a person. The review records keep "defects the implementation missed and the review caught, fixed before the PR" at file and line level.
3. The inspector's inspection is attached to the PR together with the commit SHA.
4. The cost of that work item is split by stage and shown next to the defects each round caught.

A user who wants to drive the agent directly opens a Claude Code pane from the inbox, in a repository on the Owl Chain, and gives it work as usual. The pane's session takes the branch through the Owl Chain, and the user sees steps 2 and 3. Step 4 shows no cost for that branch: Owlery reads no cost of a pane's stages, and the inspection sheet says so.

If the review catches nothing on the first work item, the evidence is weak. So there is also a path that starts from a sample repository with planted defects.

## What an inspection guarantees and what it doesn't

A product that sells trust is shaken hard by a single failure. So before the first release we write down the scope of the inspection.
- **Guarantees, for an inspection of the Owl Chain:** that the broad gate passed on the inspected commit, and that an inspector that built none of the work checked the tree against the issue. The broad gate is the Owl Chain's inspector module's own check, so an inspection of another workflow guarantees the checks its module names, which its verdict block states ([docs/iadd.md](iadd.md#what-is-the-owl-chains-alone)).
- **Does not guarantee:** that there are no bugs.

The exact wording of this section is not settled yet.

## Open decisions

| Decision | Options | Criteria |
|---|---|---|
| First session | The user's repository / a sample repository with planted defects | Must we always show "what it caught", or does the trust that comes from the user's own data come first? |
| Model on the inspecting side | Claude only / also use other companies' models for review | Review by another company's model increases independence. Another model needs an implementation that ports the role definitions to that runtime's format ("Where Owlery started" in [architecture.md](architecture.md)) |
| Records of branches built elsewhere | Name the agent of a session a person drove in the inspection record / record it as `the session`, as now | Milestone 2 decided the first half: the inspection record names each session that built the work and the session that inspected it, and the PR check refuses a record whose judge is one of its builders ([Records are committed to the repository](architecture.md#records-are-committed-to-the-repository)). A session a person drove in a terminal pane is named `the session` whichever agent ran in it, so a branch Codex built is recorded as a person's session and not as Codex's. What is left is whether the record names that session's agent, which the Codex pane of milestone 4 needs (issue #112) |
| Widening to center on PRs | Don't widen / also inspect PRs opened by cloud agents | This is where agent PRs that people must read pile up the most. But it collides with the decision "we do not build a review bot that runs after a PR opens" |
| Conditions for opening the verdict to other models | Don't open / open only to models that produce results comparable to the Claude judge on the same verdict cases | Does the weight of the inspection stay the same whoever the inspector is? The AgenticSeal plugin's evaluation cases can measure this |
| Workflows and inspector modules of a person's own | The Owl Chain only / let a person compose a workflow and register its inspector module, with the workflow and the module named in the inspection | The direction of 2026-11-27 (issue #322) takes the second: a person composes a workflow and registers the inspector module it ends in, the inspection names both so a reader judges its weight, and Owlery keeps no gate on which module is good ([docs/iadd.md](iadd.md#workflows)). What is left is how a person builds, shares and adopts one, which issue #324 places, and whether the weight of an inspection stays the same whoever inspects, the criterion of the row above. Plugins a person uses in their own terminal sessions keep working either way. In a Claude Code pane that carries Owlery's bundle they work beside it, because the bundle is loaded for that session alone and Owlery writes no file of the person's. Role sessions run detached from the user's environment today ([Role sessions run detached from the user's environment](architecture.md#role-sessions-run-detached-from-the-users-environment)) |
| Signing the inspection record | Text only / add a signature (e.g. Sigstore, gitsign) | Anyone can write today's `iadd` block by hand. A signature vouches only that "Owlery made this record", not that the review was done properly |
| Speech recognition for voice input | On the device / a recognition service the user picks | Can Korean speech be recognized well enough on the device? Sending audio to an outside service goes against working locally without an account, so it would be the user's choice ([Voice input](#voice-input-after-the-first-version)) |
