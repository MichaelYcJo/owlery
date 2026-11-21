# Roadmap: what each version builds, in what order, and when it is done

*English · [한국어](./roadmap.ko.md)*

This document holds one section for each version of Owlery. A version gets its section when its scope is decided. Today that is v0.1 alone.

## v0.1

### Goal

**A person works at the desk in Owlery all day, and every PR goes out sealed.**

v0.1 is what the other documents call the first version. It is the macOS desktop app only ([Platforms and their order](architecture.md#platforms-and-their-order)).

### Milestones

v0.1 is built in five milestones, in this order. Each milestone is in use before the work on the next one starts ([Releases and the tracker](#releases-and-the-tracker)).

| Milestone | What is built | Done when |
|---|---|---|
| 1. Shell | The Electron window. The daemon, which the window reaches over WebSocket and which outlives the app. Repositories that Owlery keeps, each added and removed on its own, with its work items inside it. Creating a work item, which gets its own branch and its own worktree (a separate folder checked out from the same repository). A menu on a work item and on a repository: rename, open in, copy, pin, mute, groups, an archive that leaves the worktree's folder and the branch where they are, a restore, and a delete of the worktree and the local branch. Terminal panes that open a shell or Claude Code in that worktree. The inbox, with each session's state read from hooks and from git. An OS notification when a session waits for the person or finishes. One headless Claude session that the daemon launches. The fake adapter for tests. Hooks are added only to the sessions Owlery launches. Owlery never turns a permission check off. The daemon's local server accepts only an authenticated client. The Korean input regression test. The shell is an end-to-end skeleton and not only a UI, for the reason [Build order](architecture.md#build-order) gives | A person creates a work item in the app and works on it in a terminal with Claude Code. The inbox shows that session's state, and a notification arrives when the session waits. A person adds a repository with no work item, archives a work item and restores it, and deletes one after reading by name what the delete removes. The headless session returns an answer that the person can read. The daemon's sessions are still alive after the app restarts. With four terminals visible, the app itself stays under about 500 MB. The user's own settings files are unchanged after a session. The Korean input regression test passes. A Codex session is milestone 4's: the owner took it out of this milestone on 2026-11-19 |
| 2. Get a seal | The role bundle, and the detached role sessions for the review rounds, the fix passes and the sealer ([What each session loads](architecture.md#what-each-session-loads)). The daemon runs the review rounds, the broad gate, the sealer and the PR in order. Records are committed to the user's repository, and connecting a repository creates the place for records and the PR check together ([Records are committed to the repository](architecture.md#records-are-committed-to-the-repository)). The person merges. The seal is posted as a GitHub check and never as an approving review, and the repository's administrator turns on the required check. The inbox and the PR show a seal that a later commit broke. The approval line ([The seal](product.md#the-seal)). The back of the seal, with the cost of each stage beside the defects each round caught | On a branch built in a terminal session with Claude Code, a person presses "Get a seal" and walks away, and a PR opens that carries a seal bound to one commit. A commit pushed after it turns the seal to broken in the inbox, and the PR check fails. A person without the app sees the same verdict on the PR. The back of the seal shows the cost of each stage beside the defects caught. One PR of Owlery's own repository is sealed by Owlery |
| 3. Hand over an issue | Picking an issue from GitHub Issues, which is the only issue tracker in v0.1. The depth judgment for each work item, which is how much of the process the work item runs through, recorded with its reason. The question batch on the question screen, asked once before the first edit. The framer and crafter role sessions. The daemon runs design and implementation in front of the chain that milestone 2 built. The inbox states: waiting for answers, in progress, sealed, broken | A person picks one GitHub issue, answers its questions once and walks away, and a sealed PR comes back. A small issue takes a shorter path than a large one, and its record says why. The four steps of [What the user sees in the first session](product.md#what-the-user-sees-in-the-first-session) happen in the app |
| 4. The person's hands on the work | A setup script and ports of its own for each worktree. An archive that moves a work item's files away to free disk and never deletes its work, its uncommitted and ignored files among it, and a restore that brings them back. Bringing in the sessions the CLI already has and resuming them, after a reboot as well. A Codex session in a terminal pane, with its line in the inbox, which moved here from milestone 1. A diff view, with the diff of the agent's last turn. Staging by hunk (one block of changed lines in a diff). Commit, push and create PR by hand, with the PR's checks shown. Line comments that are collected and sent as one batch. A merge button that merges only while the seal holds. A hand commit and a line comment each take the way back to the seal that [File explorer and editor](product.md#file-explorer-and-editor) states | A new worktree runs its setup script and gets its own ports. An archived work item is restored with its commits and its uncommitted files. After a reboot, a session from before the reboot resumes. A person works on a work item in a terminal pane with Codex, and the inbox shows that session on the work item's line. A person stages one hunk of two and commits it. That commit breaks the seal, and "Get a new seal" brings the seal back. Three line comments reach the agent as one message. The merge button is disabled while the seal is broken, and it merges while the seal holds |
| 5. After the PR, and limits | Following a PR after it opens: a CI failure and another person's review comment return to the work item as events. Owlery returns what others wrote on the PR to the work item and writes no review of its own there, which keeps the line of [What we deliberately don't do](product.md#what-we-deliberately-dont-do). A broken seal, the fix and the new verdict as one flow in the inbox. The subscription usage limit and its reset time shown, and a run held back near the limit ([Reading usage limits](architecture.md#reading-usage-limits)). The resource caps measured and published. The ledger published | A failing check on a PR of Owlery's own appears in the inbox on its work item, and the fix comes back sealed. The app shows the usage limit and its reset time. A run started near the limit is held, or the person is told. The measured caps and the ledger are public. Each of the [done criteria](#done-criteria) of v0.1 holds |

**The two checks milestone 1 started with were made in it.** A person typed Korean into the Electron terminal pane on 2026-11-18, and the shell received it as typed ([Screen framework: Electron](architecture.md#screen-framework-electron)). The regression test below keeps that check at every release (issue #10). Claude Code's hooks were run the same day (issue #4), and [The phone: the terminal session as a chat](architecture.md#the-phone-the-terminal-session-as-a-chat) lists the names and fields they arrived with.

**The Korean input regression test runs two ways, and each covers what the other cannot.** A case in the desktop app's checks starts the built app with `OWLERY_BACKGROUND=1`, under which the app's window opens without taking the keyboard and without a Dock icon, opens a terminal pane, replays Korean composition into it through Electron's debugging port, and reads the bytes the pane's process received. It runs with every run of the checks and guards the pane's own code: the terminal component's handling of composition, the window, the daemon and the pseudo-terminal. It does not stand for the macOS input source. So at each release a person runs `pnpm --filter @owlery/desktop run korean:typed` and types the same lines with a Korean input source. That run compares the bytes by itself and records the events the typing produced, and the case replays those from then on. A replay alone was not chosen, because the bytes it delivers depend on the order of the events it is given, and only a person's typing shows the order an input source produces (probed 2026-11-19).
check: apps/desktop/test/korean-input.test.ts

### Why this order

The order stands on four grounds.

1. **The process comes right after the shell, and the back of the seal comes with the process.** The shell comes first because the AgenticSeal plugin already shows the value of the process inside Claude Code, so what Owlery has to establish first is an app a person hands work to and steps away from. The process is built on the skeleton milestone 1 connects, for the reason [Build order](architecture.md#build-order) gives. The back of the seal shows, in the user's own numbers, whether the seal is worth what it costs. If it came late, it would read as one more count of review findings.
2. **The person's review tools read the seal.** A hand commit breaks it, a line comment reaches the crafter as a review finding, and the merge button asks whether it holds ([File explorer and editor](product.md#file-explorer-and-editor)). Built before the seal, each of them is built once without it and again with it.
3. **The process is the part whose structure can still change.** Whether role sessions may run headless is a judgment that is made again when its grounds change (the "May the user's Claude Code be launched headless" row of [Open decisions](architecture.md#open-decisions) in architecture.md). A move to terminals read through hooks costs less while less is built on the daemon.
4. **Daily use does not wait for milestone 4.** Milestone 1 carries what makes a terminal usable all day. Until milestone 2 is done, Owlery's own PRs are sealed by the AgenticSeal plugin, so the first done criterion holds from the first PR the project's own work opens.

The process is split into milestones 2 and 3 because "Get a seal" is the smaller half. It needs only a branch that exists, and it produces the first numbers on the back of the seal.

The rejected order builds milestone 4 before the process. The staging, the hand commit, the line comments and the merge button would then ship without the seal and be reworked in the milestone after.

### Releases and the tracker

Each milestone ships in a release of its own. One GitHub milestone titled `release: <version>` holds the issues of that release, and it answers when the release ships.

- **Each milestone is built on a release branch of its own.** The branch `release/v<version>` is cut from `main` when the milestone's `release:` milestone opens, and every pull request of the milestone merges into it. The first of those pull requests moves the version. When the milestone is done, one pull request merges the branch into `main` and closes the milestone's issues, and that merge is tagged `v<version>`. So `main` always holds the last release.
- **The release that closes milestone 5 is 0.1.0.** The releases that close milestones 1 to 4 take versions below 0.1.0, and so does a fix release between two of them. A version number is assigned when its `release:` milestone is opened, and this document fixes only 0.1.0.
- **A release below 0.1.0 is a git tag the owner builds from, with a GitHub Release whose note is built from the release's changelog fragments.** Signed and notarized downloads start with the release that issue #78 brings, whose milestone is `release: 0.1.0`. Signing each release costs time, and the releases of milestones 1 to 4, which the owner alone uses, do not repay it. Issue #78 already holds the signing work. Decided on 2026-11-21 by the orchestrator, to whom the owner left it.
- **A release's pull requests merge into its branch by squash, and the release branch merges into `main` by a merge commit.** GitHub rulesets on the repository enforce both, and the repository's admins may bypass them (the owner, 2026-11-20). So each work item is one commit on the release branch.
- **A work item that makes a bullet of an earlier changelog fragment of the same release untrue rewrites that bullet in its own pull request.** The release's note is built from its fragments, so a bullet left as it was would ship beside the one that contradicts it.
- **Each milestone has to be in effect before the next one's work starts.** The owner works in the build of milestone 1 while building milestone 2, and Owlery seals its own PRs from milestone 2 on.
- **A single `release: 0.1.0` would hold every issue of v0.1.** No event in the tracker would then mark a milestone as done.
- **The earlier releases cannot be 0.1.0 to 0.5.0.** The names v0.2 and v0.3 are taken by later goals ([Later versions](#later-versions)).

### Work that runs beside the milestones

The trial on other people's PRs needs no milestone, because it runs on the AgenticSeal plugin. It takes open-source PRs that are already merged, resets each to its state before the merge, runs the AgenticSeal process on it, and counts the defects the process caught that a human reviewer or a later commit fixed. It starts before milestone 2 is done, because a weak result changes the direction.

No milestone of v0.1 waits on Anthropic. The judgment on headless launches is made against published documents, and its home is the "May the user's Claude Code be launched headless" row of [Open decisions](architecture.md#open-decisions) in architecture.md.

### Done criteria

v0.1 is done when all five hold.

| Criterion | How a person checks it |
|---|---|
| Every PR opened from one of the project's own work items carries a seal | Take the merged PRs whose commits name a work item in the repository's records. Each has the seal check passed at its merged head. A PR that an outside contributor sends is not counted |
| The ledger is public | The published ledger opens without the app. For each work item it shows the cost of each stage beside the defects caught |
| The Korean input regression test passes | At the 0.1.0 release, the replayed case passes in the app's checks, and the typed run a person makes for that release exits without a failed line ([Milestones](#milestones)) |
| With four terminals visible, the app itself stays under about 500 MB | The published measurement of the app itself, with the agents' processes counted apart ([Memory design](architecture.md#memory-design)) |
| At least one result of the trial on other people's PRs is out | The published result, with its target repositories, the number of PRs and the count of defects |

### Not in v0.1

- [What we deliberately don't do](product.md#what-we-deliberately-dont-do) in product.md
- [Voice input](product.md#voice-input-after-the-first-version) in product.md

## Later versions

The scope of the versions after v0.1 is not decided. The committed documents place later work in these sections.

- [The phone: the same session as a chat](product.md#the-phone-the-same-session-as-a-chat) in product.md, for v0.2
- [Agent adapters](architecture.md#agent-adapters) in architecture.md, for v0.3
- [Build order](architecture.md#build-order) in architecture.md
- [Platforms and their order](architecture.md#platforms-and-their-order) in architecture.md
- The rows on the phone in [Open decisions](architecture.md#open-decisions) in architecture.md, which are settled before v0.2

## Open decisions

Everything about v0.1 that is not decided is a row of this table.

| Decision | Options | Criteria |
|---|---|---|
| Creating a PR without a seal | Block it / warn only | The promise that only sealed work comes back, against the friction of an urgent fix. The depth judgment lowers that friction when it lets small work through quickly |
| Telemetry default | Off / on | Off keeps the trust of working locally without an account. On gives quality signals |
| The trial on other people's PRs | Which repositories, how many PRs, and what counts as a defect | The more careful a repository's human review is, the firmer the comparison |
| The numbers of lightness beyond 500 MB | Startup time, install size, a cap on the resources of hidden terminals, and how each is measured | Set after the first measurement of milestone 1 |
| Where the public ledger lives | In the repository / in each release's notes / on a web page | The daemon holds the ledger ([State lives in three places](architecture.md#state-lives-in-three-places)), so publishing needs an export. The cost under a subscription login is a converted value, and the published ledger labels it so |
| The light editor | In v0.1, with milestone 4 / after v0.1 | The diff view and the staging of milestone 4 already need a file view. The editor component is not measured yet ([Open decisions](architecture.md#open-decisions) in architecture.md) |
| PRs from outside contributors | Not sealed in v0.1: the maintainer reviews and merges them as in any repository / sealed before the merge, by running the judging half of the process on them | The owner's private notes place the judging of such PRs after v0.1, and no committed document decides it. The check on the repository judges only the PRs that declare a work item, so an outside PR passes it unjudged. A seal on every merged PR would need the process to run on a branch the project did not build |
| Scheduled runs and plugins | After v0.1 / in v0.1 | The owner's private notes place both later. The goal of v0.1 needs neither |
