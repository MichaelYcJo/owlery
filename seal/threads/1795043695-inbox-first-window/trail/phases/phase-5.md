# Phase 5: 1795043695-inbox-first-window

## What this phase found

**The frame holds for this phase, with one command that no longer isolates this work.** Every path `frame/design.md` *Data & interfaces* names for *Scope* item 23 was opened at `6f321ec` and is where the frame says: `apps/desktop/src/shared/protocol.ts`, `src/daemon/agent-events.ts`, `agent-state.ts`, `daemon.ts`, `worktrees.ts`, `work-items.ts` and `last-look.ts`, and the four test files beside them. `daemon.ts#agentEvent` read `tool_name` alone and `createWorktree` kept the commit and no branch's name, as *Grounding* says of `b061855`. `seal/follow-up.md` does not exist, and the repository declares no `seal/parity.json`. Scenario 14's command does not hold as written: `git diff --stat ed91bb6..HEAD` over its paths names `src/daemon/hooks.ts`, `src/daemon/main.ts` and `src/shared/ipc.ts` beside the files of items 18 and 23. Those three came with the merge of `release/v0.0.1` at `b061855` (`git diff --stat c23a1aa..b061855` over the same paths names them alone), which is issue #19's socket path and no part of this work. Read from `6f321ec`, the diff names the files of item 23 alone.

**What the daemon and the protocol are now.** The build is two commits, `8d6d43b` and `e720eb1`. The second removes three guards no case could tell from their absence and adds two assertions.

- `SessionInfo` gains `stateSince`, `stateText` and `stateTool`. `WorkItem` gains `repoName`, `baseBranch`, `commits` and `changes`. `CommitInfo`, `FileChange` and `Changes` are new and are as *Data & interfaces* gives them.
- `agent-events.ts` gains `agentSaid(hookName, payload)`, which gives `{ text, tool }`. The frame names the function's place and not its name.
- `worktrees.ts` gains `branchHead(repo, branch)`, `branchCommits(repo, baseCommit, head)` and `branchChanges(repo, baseCommit, head)`, and `createWorktree` gives `baseBranch`.
- `work-items.ts` keeps `baseBranch` in `work-items.json`. `repoName` is not kept: the daemon works it out from `repo` each time it sends a work item.
- `daemon.ts` keeps, per work item, the head it last read the commits and the changes at. `readCommits` asks git for each branch's count and head, and for a log and a diff where the head is another commit.
- The window is unchanged. `test/view.test.ts` changes in its two fixtures alone, which gain the new fields so that the file still type-checks.

**Decisions made while building, each with its grounds.** Each was judged against `frame/design.md` *Scope* item 23 and scenario 26.

- *An event that leaves the state as it was changes nothing of the session.* Item 23 has a session carry what "the event which began the state" carried. A notification that follows a permission request therefore adds no text, and the session keeps the tool's name. The time is the time the state began, so a tool that starts while the agent works does not move it.
- *A state's time is the daemon's clock, read through the `now` option,* as a look's time is. The `agent` message's own `at` still reads `Date.now()`, as before.
- *A text or a tool's name that holds white space alone reads as `null`.* The window would otherwise draw an empty text under "asks".
- *The cut at 2000 characters does not split a character.* A character outside the basic plane is two of a JavaScript string's, and a cut between them leaves half a character that no client can draw. The text is then 1999 long.
- *`baseBranch` is read with `git symbolic-ref --quiet HEAD`, before the worktree is added.* It gives the branch's full reference, so a tag of the same name does not change the answer, and it fails where `HEAD` is on no branch, which reads as `null`.
- *A moved file is one file removed and one added,* in a commit's lines and in `changes` alike. Both reads pass `--no-renames`, so every entry of `changes.list` is one path, and what git calls a rename under one person's configuration and not under another's reads the same.
- *A commit's lines are summed over the files git counts lines of.* Both are `null` only where the commit changed files and git counts lines of none of them. A commit that changes no file has 0 and 0. `Changes.added` and `Changes.removed` are sums over the counted files too, and are never `null`, as *Data & interfaces* types them.
- *A commit's time is the committer's time, in milliseconds.* Item 23 says "the commit's time". The author's time of a rebased commit can be older than commits under it, and the list is in git's order.
- *`changes.list` is in git's order of paths,* and holds the first 50.
- *A work item just made carries no commit and no change without git being asked.* The branch was cut at its base a moment before, so the daemon records that head with empty lists, as it records the count 0.
- *A head that moves while the count stays is told in an `inbox`.* An amended commit changes the newest commit's hash and subject. Before this phase an `inbox` followed a count's change alone.
- *A branch that is gone leaves `commits` and `changes` at `null`,* beside the count's `null`.
- *The log and the diff are read at the head's commit and not at the branch's name,* so what is kept under a head is what that head holds though the branch moves during the read.
- *A look whose entries lack one of the new fields is no look.* Item 23 says "a look a build before this one wrote reads as no look". The reader asks for each field, `null` or not, and reads none as absent. `work-items.json` is read the other way, as item 23 says: an entry without `baseBranch` is read with `null`.
- *The look copies a work item's commits and files entry by entry,* so a look taken stays as it was though the daemon's lists change, and a file's entries carry nothing beyond the protocol's fields.
- *The package's whole `tsc --noEmit` ran before each of the two commits* and exited 0.

**Three guards were removed in `e720eb1` because no case can fail them.** `agentSaid` looked its event up with `Object.hasOwn`; without it an event named like a property of every object, such as `toString`, still gives no text and no tool, and the case that feeds `toString` passes either way. `branchHead` asked for `^{commit}` and turned an empty answer into `null`; a branch points at a commit and `rev-parse --verify` prints one or fails. `branchCommits` passed `--no-show-signature`; each commit's entry opens with a NUL byte, so whatever git prints before a commit is no part of that commit's first line and is no line of counts.

**Seen red.** The cases were written first and run against the tree of `6f321ec` (`pnpm run test` over the six files, exit 1): 50 of 190 failed. In `test/agent-events.test.ts`, `test/worktrees.test.ts` and `test/last-look.test.ts` the new cases failed with "is not a function" or on a field the old code does not give, which names no guard, so each unit's guards were shown by the mutants below. Two assertions were added after the code, in `e720eb1`: a moved file in a commit's lines, and a subject that holds the byte the daemon parts git's fields with. Each was shown red by its mutant: the log read without `--no-renames`, and the subject cut at that byte.

**`seal mutate`, at `e720eb1`.** Six calls, each with a passing baseline; 91 mutants, 90 red.

- `src/daemon/agent-events.ts` against `test/agent-events.test.ts`: 7 of 7. Each of the three fields renamed, a tool read from a notification, a text read from a permission request, white space kept, and a value that is not text turned into text.
- `src/daemon/worktrees.ts` against `test/worktrees.test.ts`: 24 of 25. The one that survived reads `HEAD` with `rev-parse --symbolic-full-name` in place of `symbolic-ref`; it gives `HEAD` where no branch is checked out, which the next line reads as no branch, so it is the same function and no break. The 24 were: the branch's name cut after its last slash; the work item's own branch given as its base; the head read from `HEAD`; a dash read as 0; the log without `--no-renames`; the full hash; the author's time and the body; the log without its base; the subject cut at the separator; the time left in seconds; a commit with no file given `null`; a commit of binary files given 0; uncounted files summed; the removed lines given as added; the text before the first commit read as one; the diff without `--no-renames`, without `-z`, and from the head's parent; the count, the added lines and the removed lines of the first 50 alone or of none; the list uncut; 49 files; and a binary file's lines read as 0.
- `src/daemon/worktrees.ts` against the case of the 20 newest commits in `test/daemon.test.ts`: 2 of 2, 21 listed and the limit removed.
- `src/daemon/work-items.ts` against `test/work-items.test.ts`: 4 of 4. The base branch not read back, not checked, required of every entry, and not kept at `add`.
- `src/daemon/last-look.ts` against `test/last-look.test.ts`: 32 of 32. Each of the checks on the seven new fields removed or loosened to accept an absent field, each check inside a commit, a file and the changes removed, and each of the copies made shallow or dropped.
- `src/daemon/daemon.ts` against the cases of "sessions", "work items", "the inbox" and "the last look": 21 of 21, with `--bail 1`.

Six of the daemon's mutants were then run alone, without `--bail`, and their failing lines read.

- The state's fields written at every event: "keeps what the event that began a state said" failed on the session, and "sends an inbox when the state changes" with `[ null, 'working', 'working', … ]`.
- The head not recorded at a creation, as an empty text: the case of the log and the diff failed with `expected [ 1, 1 ] to deeply equal [ +0, +0 ]`.
- The check that the head is the one last read removed: the same case failed with `expected [ 2, 2 ] to deeply equal [ +0, +0 ]`.
- A moved head that does not tell the clients: the same case timed out waiting for the amended commit's `inbox`.
- A branch that is gone keeping what was read of it: "gives a work item whose branch is gone no count, no commits and no changes" failed.
- A field named `claudeSessionId` added to a session: "carries only the fields the protocol names, none of them a vendor's" failed with `expected [ 'alive', 'claudeSessionId', …(7) ] to deeply equal [ Array(8) ]`. It is scenario 27's red.

A call of many prints each verdict and exit code and not the failing line. `gaps.md` carries the 84 that were not run alone.

**How the cases count git's runs.** The case of the log and the diff uses phase 4's `watchedGit`. It waits until the script noted three more `rev-list` runs before it reads the counts of `log` and `diff`, so each count is read after the daemon had three chances to ask.

**The drive, at `e720eb1` with a clean tree.** `node build.mjs` ran first. The probe `test_tmp_drive.mjs` in the phase's scratch ran once. Its first part started `dist/daemon.js` alone on Electron's own Node, as `ensureDaemon` starts it, with the run folder `/private/tmp/claude-501/owlery-18-p5a/run`, and read it as a second client. The agent's CLI was phase 2's stand-in.

- *A work item just made* in a repository on `main` carried `repoName: "repo"`, `baseBranch: "main"`, `newCommits: 0`, `commits: []` and `changes` of no file. Its session carried `null` in all four fields of a state.
- *Two commits made in the worktree* were told in an `inbox`: `newCommits: 2` and both commits newest first, each with the hash and the time `git log` prints. The first changed a file of text and a file of notes, 4 lines added. The second changed the first file, moved the notes and added a binary file: 2 added and 3 removed. `changes` held 3 files with 3 lines added, the binary file with `null` for both counts, and the moved file under its new path alone, since the old path did not exist at the base.
- *A permission request fed through the relay* with `tool_name: "Bash"` left the session `waiting`, with `stateTool: "Bash"`, no text, and a `stateSince` between the probe's clock before and after the feed.
- *A turn's end fed* with a last message of 2128 characters left it `finished` with the first 2000 as `stateText` and no tool. The look taken before it kept the session as it waited, tool and time included, and the work item with its two commits and three files.
- *A prompt and then a notification fed* with `message` left it `waiting` with that message as `stateText`.
- *The `agent` messages* the first client was sent carry `at`, `event`, `id`, `tool` and `type`, as before.
- *The run folder:* `work-items.json` holds `baseBranch: "main"` and none of `repoName`, `commits` and `changes`; both files have mode 0600; the look's entries hold the protocol's fields and no other.
- *The daemon started again* answered its first hello after 63 milliseconds with the two commits, the three files, no session, and the look as it was taken.
- *A run folder as an earlier build left it,* with a look and a list that lack the new fields: `lastLook` was `null`, and the work item was listed with `baseBranch: null`, its repository's name, and the commits and changes read at that hello.
- A hello was answered 22 to 63 milliseconds after it was sent.

**`frame/questions.md` Q11 was not answered: the real CLI did not start.** The probe's second part started the built app on `/private/tmp/claude-501/owlery-18-p5b`, with the person's own shell and `OWLERY_DEBUG_HOOKS=1`, and a second client made a work item with a pane of the state-reporting kind on the app's own daemon. The CLI asked whether the new worktree is trusted. The choice under the cursor was "No, exit". The probe pressed Enter, the CLI printed "Claude Code didn't start because this folder isn't trusted." and ended, and the daemon logged no hook. The probe runs once, and it was not run again to choose "Yes, I trust this folder": the CLI keeps that answer in the person's own configuration, and it is a person's to give. `shasum` of `~/.claude/settings.json` and `~/.claude/settings.local.json` printed the same two hashes before and after the drive. `agentSaid` reads `message`, Q11's default. `gaps.md` names the measurement and who makes it. The same run shows issue #23's subject from the daemon's side: a pane that waits at the trust question has no state, because no hook has run.

**Scenarios 13, 14 and 27, executed at `e720eb1`.**

- 13: `git grep -n -i -e claude HEAD -- apps/desktop/src/renderer` printed nothing and exited 1.
- 14: `git diff --stat 6f321ec..HEAD` names six files under `src/daemon` and `src/shared` and the test files, each of which *Data & interfaces* names for item 23 or holds its cases. The command as the scenario writes it is the first paragraph's.
- 27: `git grep -n -i -e claude HEAD -- apps/desktop/src/shared/protocol.ts` and the same at `b061855` print the same two lines, 6 and 7. The case lists the fields of a session, a work item, a commit, the changes and a file, in a creation's answer, an `inbox`, a `ready` and a look.

**The phase boundary run.** `pnpm run test test/daemon.test.ts test/worktrees.test.ts test/work-items.test.ts test/last-look.test.ts test/agent-events.test.ts test/view.test.ts test/agent-state.test.ts test/pane-kinds.test.ts` at `e720eb1` with a clean tree: 8 files, 194 passed, exit 0. They are the six test files the phase changed and the two others whose unit imports `src/shared/protocol.ts`. The repository's contribution guide names no tree-wide test file.

**After the drive.** The probe stopped the five processes it started with SIGTERM, by the ids in `pids.txt`, the app's own daemon among them, and none was alive afterwards. The two folders under `/private/tmp/claude-501/` were removed. `~/.owlery` did not exist after the run. `drive-results.json`, `drive-out.txt`, the kept run folder of the first part and the app's `daemon.log` are in the phase's scratch.

## What phases 6 and 7 need from the protocol

Every field below is in `ready`, in each `inbox`, in a creation's answer and in the look, and the window reads none of them yet.

- **A session's age** is `stateSince`, the daemon's clock in milliseconds, `null` where `state` is `null`. `ageOf` compares it with the window's clock. A session that exited keeps its state and its time.
- **A session's text** is `stateText`, 2000 characters at most, already cut. **A session's tool** is `stateTool`. Both are `null` again at the next change of state. A waiting session carries one of the two and not both, as far as the fed payloads show: the tool after a permission request, the text after a notification. Which of the two the real CLI's waiting session carries is not measured (`gaps.md`), so `stateSays` needs both branches: the text where there is one, and "Asks to use <tool>" where there is a tool alone. A finished session carries the last message or nothing.
- **The session a line reads these from** is the one `inboxLine` reads the state from. `inboxLine` gives the state and not the session, so phase 7 needs the session itself from the same choice.
- **A repository's name** is `repoName`. Two repositories of one name differ in `repo`, which is the key `sidebarTree` groups by.
- **The base** is `baseBranch`, `null` for a work item made before this phase and for one cut from a commit. How far ahead is `newCommits`, which stays the count of all, `null` where git gave none.
- **The commits** are `commits`, newest first, 20 at most, `null` where none was read. `commits.length` under `newCommits` says how many more there are. A commit's `at` is milliseconds. Its `added` and `removed` are `null` together where git counted no lines.
- **The commits a branch gained since the look** are the first `newCommits` now less `newCommits` in the look's entry of the same id. No hash is compared: an amended commit has another hash.
- **The files** are `changes.list`, 50 at most, with `changes.files` the count of all and `changes.added` and `changes.removed` the sums over all. A file's counts are `null` for a binary file. A moved file is two entries. `changes` is `null` where none was read, and holds no file for a branch with no commit.
- **A daemon of an earlier build** sends none of the fields. `tsc` types each as always there, as it types `lastLook`, so a function of `view.ts` that reads one from such a daemon reads `undefined`.

## What the orchestrator's fold needs

The frame says nothing of these facts of the build: the names `agentSaid`, `branchHead`, `branchCommits` and `branchChanges`; an event that leaves the state as it was changing nothing; a moved file as two entries; a commit's two counts `null` only together; an `inbox` for a head that moved under an unchanged count; and scenario 14's base, which the merge at `b061855` made too early. Q11 stays open.
