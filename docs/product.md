# Product: a sealed PR

*English · [한국어](./product.ko.md)*

## What we promise

**Answer once, and you get a PR sealed by a party that did not build it. The seal is bound to one commit, and it breaks if any commit lands after it.**

A person answers the questions about one issue once and walks away. Design, implementation, review rounds, the broad gate and the independent verdict then run without the person. At the end, the PR opens only when a party independent of the one that built it gives its verdict. The grounds for that verdict stay in the user's repository.

**Under the routing answer `agentic`, no question holds the run.** `agentic` is the answer by which a person leaves each work item's route to the orchestrator and walks away. What needs the person is asked once, in one batch, before the first edit of the request, for every work item the request hands over. A question that arises after the batch is first decided from the code and the policy, which are the repository's documents, its config and the earlier work items' records, and the decision is recorded as one made without asking. What is decided in place of asking is counted on the work item's line and listed with its grounds in the work item's preview and view, where the person can reverse it when they come back. Only what the code and the policy cannot answer and the session cannot give itself, such as a permission, a credential or an approval, parks the one work item it belongs to, with the question on that work item's line in the inbox, and every other work item goes on. Owlery posts no question on a GitHub issue. A late question would otherwise stop the whole run until the person is back, and that wait is what the promise removes.
check: apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts

## Who it is for

Individual developers, open-source maintainers and tech leads of teams of 2–10 who already run several Claude Code sessions and work in a terminal. Their bottleneck is rereading the PRs that agents made. Enterprises are not the audience, because we cannot take on security certification, SSO and audit requirements within the first year. Non-developers and people who prefer to work in a chat screen are not the audience either. That is a choice of who we build for: the desktop app has no chat screen ([What we deliberately don't do](#what-we-deliberately-dont-do)).

## Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call

Owlery opens on the inbox, not on a pane of terminals. Each work item shows its state (waiting for answers, in progress, sealed, broken) on one line. A person who comes back should first see "two sealed, one waiting for an answer." Where a work item changed since the person last looked, the app shows a summary before the inbox: it says in one sentence what changed, gives each changed work item a line, holds no terminal, and the inbox is one step from it. Where the daemon gave a work item's count of new commits at the look and not now, or now and not at the look, as just after the daemon starts again, that count is not read as a change. Where nothing changed, or no earlier look is recorded, the summary is skipped and the app opens on the inbox. The summary stays one step away at any time. The daemon records the look when the window loses focus, is hidden or closes. That first screen fits the promise of handing work off and walking away.

The base is three things: the inbox, the AgenticSeal process that runs from design to the seal without a person, and the back of the seal. The AgenticSeal process does not run in a terminal. The daemon runs its stages in the background, and their results appear in the inbox and on the back of the seal.

- **The sessions a person drives open in a terminal.** In the first version, a session the person drives is the agent's own CLI, launched as it is in a terminal pane: Claude Code, Codex CLI or any other. Every feature of that CLI works as it does outside the app, and no agent needs special support from the app. The user's CLI holds the login, and Owlery provides no login of its own. The user also chooses in the CLI whether to use a subscription or an API key.
- **The app reads only what the inbox needs.** It needs to know whether a session is working, waiting for the person or finished, and whether its branch got new commits. Claude Code reports the first through hooks, and git shows the second. Wherever the work happens, a commit that lands after the seal breaks it. The desktop does not redraw the conversation as a chat. Only the phone shows the same session as a chat ([The phone: the same session as a chat](#the-phone-the-same-session-as-a-chat)).
- **It stays light.** Light is relative here, not an absolute number. Products that carry a chat screen next to the terminal, and add a full editor, a browser, team management and a cloud on top, need more memory and disk. Owlery carries less, so it needs less. Electron stays, and lightness is kept by scope and by measurement. Owlery spends as little memory as it can, a feature costs nothing while nobody uses it, and what a scene costs (one state of the app, written down so that it can be measured again) is measured and published beside the same scene in comparable products. The app itself with four terminals visible read about 500 MB, which is a measurement of one scene and not a limit on any feature. The app uses one window, draws only the terminals that are visible, and ends each stage's agent process when the stage finishes, so memory grows with the stages working right now, not with the work items left open. How many agents and worktrees run at once, and how many panes a view shows at once, are defaults read from the person's machine, which the person sees and changes ([Memory design](architecture.md#memory-design), [Where performance differs](#where-performance-differs)).

Our part sits on top of that. There are two paths to a seal.

- **Press "Get a seal" on a work item.** The product's AgenticSeal process runs the review rounds and the sealer, so the seal does not depend on which agent built the branch. The first version takes branches built in Claude Code sessions, and branches built by other agents follow once how to record them is settled ("Build order" in [architecture.md](architecture.md)). When Claude reviews and seals a branch that Codex built, the party that built it and the judging party are models from different companies, and independence actually grows.
- **Hand over an issue from the start.** Answer the question batch once, and the daemon carries design, implementation, review and the seal through without the person. The promise above describes this path.

Both paths end in the same seal, and a commit that lands after the seal breaks it.

**A work item's line shows the decisions made for it in place of asking, and a parked work item's line shows its question.** A parked work item stands with the work items that wait for the person, and its line says the first question it waits on. A decision holds nothing. The line says how many decisions the person has not seen, and how many reversals wait for a stage. The work item's view lists each decision with its grounds. A person reverses one there with a message, which the work item's record keeps. The summary counts the decisions made since the last look apart from the work items that wait. The inbox shows what the person has yet to see, and the work item's records keep the grounds. An archive takes a work item's decisions off the inbox and the summary with it, and an answered question leaves the work item's view at the next look.
check: apps/desktop/test/view.test.ts apps/desktop/test/daemon.test.ts

## The seal

AgenticSeal's sealer works after the review rounds end and the broad gate passes. It checks every party's claims against the issue and the tree, and binds the verdict to a specific commit. Today's `seal stamp` command shows the result as the fields below.

| Field | Meaning |
|---|---|
| tree | The commit and branch that were sealed |
| base | The base branch's commit |
| item | The work item |
| gate | The commit on which the broad gate passed |
| rounds | The number of review rounds |

The app shows this seal in three places.

1. **An approval line per work item.** It shows how far one work item has come through framer, crafter, proofer and sealer.
2. **The seal on the PR.** When a commit lands after the seal, the seal turns to broken. AgenticSeal's `chain_check` already makes the same judgment on the PR. If the HEAD of a ready PR has no `Verdict: sealed`, that check fails. The app puts this on screen.
3. **The back of the seal.** It shows the defects the review caught and fixed before the PR side by side with the cost of each stage. This is where the seal shows, in the user's own numbers, whether it is worth what it costs.

## The seal belongs to the product and looks the same everywhere

The seal splits into three layers. The judging party can change, but the product defines the records and the display and keeps them the same everywhere.

| Layer | What it is | Whose it is |
|---|---|---|
| Judging party | The agent that runs the review rounds and the sealer | The role definitions belong to the product. In the first version the implementation is Claude carrying the Owlery role bundle, and porting the same role definitions lets another model take its place |
| Seal record | Which commit was judged against which base, whether the broad gate passed on that commit, the number of review rounds and the verdict. Also who judged it (which model, which rules version) | The product. It stays as a file in the user's repository |
| Display | The app's inbox and back of the seal, the PR body, GitHub's check results, the terminal, the phone | The product. All of them read the same record |

Today's AgenticSeal shows why this split works. The verdict's result is plain text: the `seal` block (the commit judged and the verdict) inside `guarantee.md`. `chain_check`, which checks it on the PR, is a Python script. Neither needs Claude to run. Only the judging party, that is the agent definitions, is tied to Claude.

Two things hold even when the judging party changes.

- **The party that built it cannot seal its own work.** A party here means a session, not a model. The seal record names both the session that built the work and the session that judged it, and if the two are the same, it is not a seal. The judging session starts fresh and reads only files, so a Claude session can judge what another Claude session built. When the judge runs on another model than the builder's, of another company or of the same one, the two differ at the model level too, which lowers the chance that both miss the same defect, and the seal record shows that as well.
- **The seal shows who judged it.** Once several models can judge, seals carry different weight, so the person looking at one needs to know.

The app has themes, and a theme changes colours, typefaces, texture, how the seal is lit, and the form of edges, rules and marks. No theme changes the layout, the words, the seal's drawing or the wax's red, and in every theme red stands on the seal alone: a button, a mark and a failure take another colour. The window has three themes: Night watch, which a first run opens in, Register and Desk. Each has a dark and a light appearance, and a person chooses one or lets the system's appearance choose. [docs/design.md](design.md) states each theme.
check: apps/desktop/test/themes.test.ts apps/desktop/test/appearance.test.ts

## File explorer and editor

Sometimes the back of the seal is not enough for a person to decide on a merge. They may need to see what a line the review flagged actually looks like. Or it may be faster to fix something themselves, such as one comment line, one name or a value in a `.env` file. So the app has a light editor for viewing and fixing files.

- **Each work item shows its own tree.** Each work item runs in its own worktree (a separate folder checked out from the same repository for each work item), so the explorer shows the selected work item's worktree. Files changed from the base branch are marked.
- **You go straight in from the back of the seal.** Clicking a finding the review raised opens that line of that file, and you can view the diff of the commit that fixed it alongside.
- **Editing is blocked while the agent is changing that work item.** If a person and an agent change the same file at once, there is no way to decide whose change survives. Once the work item is waiting for the person's answer, or after it has been sealed, editing is allowed.
- **A person's edits also go through review before the seal comes back.** AgenticSeal never leaves changes made after the last review round unread by any round. So a person's edit becomes a commit, and an edit after the seal breaks it. The app offers "Get a new seal" on the spot, and then one review round and the sealer read only the part the person changed.
- **Files that git ignores, such as `.env`, do not become commits.** Editing them neither breaks the seal nor starts a review round. A new worktree has no `.env` of its own, which is often the first thing a person fills in.
- **Edits made outside the app are caught by watching the tree.** The person may also change files in their own editor or shell, and the app cannot block that. If the tree changes while a stage of the AgenticSeal process is changing that work item, the daemon stops that stage and tells the person. Tests a person runs do not count as the broad gate. The seal relies only on the result of rerunning, on that commit, the broad gate command set in the repository.
- **You can also hand off a fix in words.** Select lines and leave "change this to that", and the app passes it to the crafter in the same shape as a review finding. After the fix, one review round runs and the seal comes back. Whether the person edits directly or hands the fix off in words, the way back to the seal is the same.
- **Large changes open in the user's own editor.** The app does not take on work that needs a language server, extensions or a debugger.

## The phone: the same session as a chat

On the desk, a person works in the agent's own CLI in a terminal. The phone (from v0.2, Android first) shows the same terminal session as a chat. It is one session seen in two shapes, not a second session. The phone does this for every agent the person runs, not only Claude Code, and its traffic passes through no agent company's server ("Connecting from outside" in [architecture.md](architecture.md)).

| What the phone does | How |
|---|---|
| Show the conversation as a chat | From the CLI's hooks first, and from the session log the CLI writes to disk as a supplement. It never reads the terminal screen |
| Approve or deny a permission request | The CLI's permission hook waits for the answer from the phone and returns allow or deny |
| Reply, or give a new instruction | The daemon types it into that terminal, only while the terminal is waiting for input |
| Stop | The daemon sends the interrupt key |
| Anything else | Opens the terminal screen as it is. Slash menus, model pickers and other controls that exist only in the CLI are not turned into chat |

The phone also shows the inbox, the question batch and the seal, which read the same records as the desktop. How each part is read is in "The phone: the terminal session as a chat" in [architecture.md](architecture.md).

## Voice input (after the first version)

Voice input comes after the first version. It goes where speaking is faster than typing.

- **Answering the question batch,** above all on the phone while away from the desk.
- **Giving an instruction after selecting lines,** in the editor or on the back of the seal, where the person points at the code and says what to change.

How the speech is recognized is in "Open decisions".

## Where performance differs

All the differences come from one structure. AgenticSeal hands each stage's result on as files (design, round records, guarantee) and ends that stage's agent. This differs from a structure where one conversation carries one work item to the end.

Everything below is a hypothesis. Only the second has a number measured in the app itself, and `apps/desktop/measurements/memory.md` holds its number, its date and its method. No comparable product has been measured in the same scene yet. The others have not been measured yet.

| Hypothesis | Why we think so |
|---|---|
| The memory the AgenticSeal process uses scales with the number of stages working right now, not with the number of open work items | There is no reason to keep a finished stage's Claude process alive. One Claude process uses 345–679 MB (measured 2026-11-17) |
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

- In the first version, the implementation on the sealing side (review rounds and sealer) is only Claude with the Owlery role bundle. Any agent's CLI can run in a session's terminal, but we keep the seal's quality on the side we can control.
- There is no chat screen on the desktop, and no adapter that drives the person's agent through an SDK. A chat screen built on an SDK reaches only part of the CLI's features (slash commands, plugins, skills and new features come late or not at all), and what it shows is an interpretation of what the agent actually does. The person works in the agent's own CLI, and only the phone draws a session as a chat ([The phone: the same session as a chat](#the-phone-the-same-session-as-a-chat)).
- We do not build an IDE, a kanban board or a built-in browser. There is a light editor for viewing and fixing files, but no language server, extensions or debugger ([File explorer and editor](#file-explorer-and-editor)).
- We do not build team management, roles or admin screens. Each person runs Owlery on their own machine, and it works locally without an account. A team shares the work through the repository and its PRs, where the seal records already live.
- The first version has no mobile app. The phone comes in v0.2, the daemon's protocol is designed for it now, and how a phone reaches the daemon is already settled ("Connecting from outside" in [architecture.md](architecture.md)).
- We do not run cloud sandboxes ourselves.
- There is no mode that leaves records uncommitted. The promise holds only if the seal's grounds are bound to a commit. So a repository that cannot keep work records in its tree is out of scope ("Records are committed to the repository" in [architecture.md](architecture.md)).
- We do not build a review bot that runs after a PR opens. Owlery can be used alongside such tools.
- We do not use throughput claims ("100x").
- **Owlery deletes nothing of a person's work without that person's word.** An archive is the way out of the list, and it removes nothing. A delete removes a work item's worktree and its local branch after the person confirms. Where a commit no other branch holds, a change no commit holds or an untracked file would be lost, the delete runs only after the person has read each by name and chosen to force it. The files git ignores, such as `.env`, are named and go with the worktree without the force. Removing a repository from Owlery removes nothing on disk unless the person chooses it there: one choice deletes its work items' worktrees and local branches as a delete does, and another moves the repository's folder to the Trash. Nothing removes a branch on a remote.
check: apps/desktop/test/daemon.test.ts apps/desktop/test/worktrees.test.ts

## What the user sees in the first session

1. The user picks one real issue from their own repository, gets all the questions at once and answers them.
2. From then on the work proceeds without a person. The review records keep "defects the implementation missed and the review caught, fixed before the PR" at file and line level.
3. The sealer's seal is attached to the PR together with the commit SHA.
4. The cost of that work item is split by stage and shown next to the defects each round caught.

A user who wants to drive the agent directly opens a session from the inbox, gives it work as usual, presses "Get a seal" on that branch and sees steps 2–4.

If the review catches nothing on the first work item, the evidence is weak. So there is also a path that starts from a sample repository with planted defects.

## What the seal guarantees and what it doesn't

A product that sells trust is shaken hard by a single failure. So before the first release we write down the scope of the seal.
- **Guarantees:** that the broad gate passed on the sealed commit, and that an independent party checked the tree against the issue.
- **Does not guarantee:** that there are no bugs.

The exact wording of this section is not settled yet.

## Open decisions

| Decision | Options | Criteria |
|---|---|---|
| First session | The user's repository / a sample repository with planted defects | Must we always show "what it caught", or does the trust that comes from the user's own data come first? |
| Model on the sealing side | Claude only / also use other companies' models for review | Review by another company's model increases independence. Another model needs an implementation that ports the role definitions to that runtime's format ("What we take from AgenticSeal" in [architecture.md](architecture.md)) |
| Records of branches built elsewhere | Add a new value to the record format that names the implementer / record it with the current values | Today AgenticSeal names the implementer only as `crafter` or `the session`, and the sealer checks that field against the diff. Recording a branch that Codex built as either of the two makes the record contradict the facts |
| Widening to center on PRs | Don't widen / also seal PRs opened by cloud agents | This is where agent PRs that people must read pile up the most. But it collides with the decision "we do not build a review bot that runs after a PR opens" |
| Conditions for opening the verdict to other models | Don't open / open only to models that produce results comparable to the Claude judge on the same verdict cases | Does the weight of the seal stay the same whoever the judge is? AgenticSeal's evaluation cases can measure this |
| Plugins on the sealing side | Owlery's role bundle only / let a user add reviewers of their own to the review rounds, with the bundle and version that judged recorded in the seal / also let a user replace the sealer, only with a role that produces results comparable to the bundle's on the same verdict cases | Does the weight of the seal stay the same whoever judges, the criterion of the row above. Plugins a person uses in their own terminal sessions keep working either way, because those sessions run the agent's CLI as it is. Role sessions run detached from the user's environment today ([Role sessions run detached from the user's environment](architecture.md#role-sessions-run-detached-from-the-users-environment)) |
| Signing the seal record | Text only / add a signature (e.g. Sigstore, gitsign) | Anyone can write today's `seal` block by hand. A signature vouches only that "Owlery made this record", not that the review was done properly |
| Speech recognition for voice input | On the device / a recognition service the user picks | Can Korean speech be recognized well enough on the device? Sending audio to an outside service goes against working locally without an account, so it would be the user's choice ([Voice input](#voice-input-after-the-first-version)) |
