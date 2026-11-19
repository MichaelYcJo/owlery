# Review round 1: 1795043695-inbox-first-window

```seal
target: 8e00206 against 277eb35
```

The target is the branch's diff against `277eb35`, the commit `origin/release/v0.0.1` resolves to and the merge base. No round ran before this one, so no fact is carried from an earlier round, and every verdict below is this round's own. The round weighed first what the routing's grounds did not name: `apps/desktop/src/daemon/`, `apps/desktop/src/shared/`, `apps/desktop/src/main/`, `apps/desktop/src/preload/` and their tests. It read every changed line of `daemon.ts`, `last-look.ts`, `worktrees.ts`, `work-items.ts`, `agent-events.ts`, `main.ts` of the daemon, `protocol.ts`, `ipc.ts`, `appearance.ts` of both roots, `main.ts` of the main process and `preload.ts`, and the diffs of `test/daemon.test.ts`, `test/worktrees.test.ts`, `test/work-items.test.ts`, `test/agent-events.test.ts` and `test/appearance.test.ts`. Of the renderer it read `renderer.ts`, `work-item-view.ts`, `list.ts` and `summary.ts` whole, `view.ts` to line 460, and of `shared.ts` the connection helpers and `detail`. `## Not judged` names what it did not read.

The work item's records were read whole at `8e00206`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `guarantee.md`. Phases 3, 4 and 5 were read whole for their claims about the daemon and the protocol. Phases 1, 2 and 6 to 9 were read for the claims the frame and `gaps.md` cite from them, and not line by line. No `pr.<lang>.md` stands, since `seal/config.json` names English for both language keys, and the repository declares no `seal/parity.json`.

## Findings

### 1. Three quotes of `pr.md` are not found word for word at the rows they cite

```seal
severity: must
location: `seal/threads/1795043695-inbox-first-window/pr.md:3`, `seal/threads/1795043695-inbox-first-window/pr.md:9`, `seal/threads/1795043695-inbox-first-window/pr.md:11`
evidence: read `seal/threads/1795043695-inbox-first-window/pr.md:1-16`, `seal/threads/1795043695-inbox-first-window/frame/plan.md:143-154`
```

Why it matters: `pr.md` becomes the first part of the pull request body, and the form allows it the `Part of` line, quotes of the work item's records and the attribution line, with no sentence of the orchestrator's own (`skills/code-review/orchestration.md` *Orchestrator: the pull request opens once the sealer seals*). A paraphrase under a record's coordinate is a sentence of the orchestrator's own that the reader takes for the record's words.

The method was to take `pr.md` apart into each of its lines and to compare each list item, whitespace collapsed, with the Judgment cell of the row its coordinate names. The rows are counted as the data rows of `frame/plan.md` *Judgments of the run*, row 1 at line 143. Three of the six items are not found there.

- Line 3 cites row 8. Row 8 at `frame/plan.md:150` reads "The window takes the polish mockups' variant 3 (Night desk) as its default theme and variant 4 (Letter) as a second theme, both in release 0.0.1, with theme switching". The quote drops "the polish mockups'" and "theme", and ends "with a way to switch".
- Line 9 cites row 12. Row 12 at `frame/plan.md:154` reads "The window gains the native sidebar (search, Inbox, Summary, History, Repositories) the mockups draw, blending Paseo's and Orca's". The quote reads "gains a native sidebar: search, Inbox, Summary, History and Repositories".
- Line 11 cites row 10. Row 10 at `frame/plan.md:152` reads "Phase 5 to 9 pull from issue #27 what the daemon reads from git and from the hooks it already receives". The quote, "Part of issue #27 moves here: the daemon sends a branch's commits and changed files, …", is a sentence of its own.

Lines 5, 7 and 13 hold: rows 9 and 1 word for word, and line 7 a leading part of row 11. Line 1 is the `Part of` line in the shape the work items before this one used. `guarantee.md` at `09377b4` says of `pr.md` that each quote stands "under the row number it gives". The rows were the same at `09377b4`, since `8e00206` only appended a row to `frame/plan.md`. So that claim did not hold when it was written.

```markdown
- The window takes the polish mockups' variant 3 (Night desk) as its default theme and variant 4 (Letter) as a second theme, both in release 0.0.1, with theme switching
  `seal/threads/1795043695-inbox-first-window/frame/plan.md` *Judgments of the run*, row 8, Judgment
```

```markdown
- The window gains the native sidebar (search, Inbox, Summary, History, Repositories) the mockups draw
  `seal/threads/1795043695-inbox-first-window/frame/plan.md` *Judgments of the run*, row 12, Judgment
```

```markdown
- Phase 5 to 9 pull from issue #27 what the daemon reads from git and from the hooks it already receives
  `seal/threads/1795043695-inbox-first-window/frame/plan.md` *Judgments of the run*, row 10, Judgment
```

The three blocks replace lines 3 and 4, 9 and 10, and 11 and 12 of `pr.md`. The body file `seal pr-body` composes is written again after the repair. This finding is located in `pr.md` alone, so the orchestrator repairs it.

```seal
verdict: fixed def5c83
answer: The orchestrator's commit replaces lines 3, 9 and 11 of `pr.md` with the record's three blocks. The fix pass read the commit's diff against rows 8, 12 and 10 of `frame/plan.md` *Judgments of the run*: line 3 is row 8's Judgment cell word for word, line 11 is row 10's word for word, and line 9 is row 12's up to "the mockups draw", a leading part of the cell as line 7 is of row 11's. The fix pass did not run `seal pr-body`; the body file is the orchestrator's to compose again.
```

### 2. A branch whose `git log` or `git diff` output passes 1 MiB is shown with no commits and no changed files, permanently at that head

```seal
severity: should
location: `apps/desktop/src/daemon/worktrees.ts:31-38`, `apps/desktop/src/daemon/worktrees.ts:141`, `apps/desktop/src/daemon/worktrees.ts:174`, `apps/desktop/test/worktrees.test.ts`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_numstat.test.ts` in `apps/desktop` (see `## Probes`); read `apps/desktop/src/daemon/worktrees.ts:31-38`, `:139-144`, `:172-177`, `apps/desktop/src/daemon/daemon.ts:489-498`, `apps/desktop/src/renderer/shared.ts:244-261`
```

Why it matters: `frame/design.md` *Scope* item 23 has a work item carry `changes`, "50 at most, … beside the count of all the files and the sums of the lines", and `commits`, the 20 newest. The daemon reads both through `git()` at `worktrees.ts:31-38`, which calls `execFile` with no `maxBuffer`. Node's default for `execFile` is 1 MiB of standard output. Past it the child is killed and the callback gets an error. `branchCommits` and `branchChanges` catch every error and return `null` (`worktrees.ts:142-144`, `:175-177`). `daemon.ts:498` then keeps that `null` under the head it read, and `daemon.ts:489` asks git again only once the head moves. The read fails the same way at that head every time, so the work item keeps `commits: null` and `changes: null`. The window then draws neither the "Commits" section nor the "Changes" section (`shared.ts:245`, `:258`), while the preview still says "N commits ahead". The daemon cuts the lists to 20 commits and 50 files only after the whole output is in memory, so the cap that the frame relies on does not bound what is read.

The limit is reached by a branch that touches some ten to fifty thousand files, depending on the length of their paths: a codemod across a large repository, a lockfile or vendored folder, or a merge of the base after a large change on it. One commit of 20 that does so is enough for `branchCommits`, since `--numstat` lists every file of every listed commit.

The probe made a branch of 1500 files under a directory path of 753 bytes. The probe's own `execFileSync` of `git diff --no-renames --numstat -z`, which has the same default limit, failed with `spawnSync git ENOBUFS`. So the output passes the default limit of Electron's Node. The probe stopped at that line, so `branchChanges` itself was not run on that branch. Its result there is read from its `catch` and not executed.

```ts
// apps/desktop/src/daemon/worktrees.ts
/** How much of git's output a read of a branch's log or diff holds: `--numstat` lists every file, and the lists are cut only after the read. */
const BRANCH_OUTPUT_BYTES = 256 * 1024 * 1024;

function git(cwd: string, args: string[], maxBuffer = 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, encoding: "utf8", maxBuffer }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr.trim() || error.message));
      else resolve(stdout);
    });
  });
}

// in branchCommits
log = await git(repo, ["log", "--no-renames", "--numstat", `--max-count=${COMMITS_LISTED}`, "--format=%x00%h%x1f%ct%x1f%s", `${baseCommit}..${head}`, "--"], BRANCH_OUTPUT_BYTES);

// in branchChanges
diff = await git(repo, ["diff", "--no-renames", "--numstat", "-z", baseCommit, head, "--"], BRANCH_OUTPUT_BYTES);
```

Precondition: the daemon can hold the output as a string of that size. At 256 MiB that is about a million files at 250 bytes a path. Another fix reads the totals with `git diff --shortstat` and streams `--numstat -z` until the 50th entry. That bounds the memory, and it is more than the snippet. The fix pass owes a case in `test/worktrees.test.ts#what a branch holds since its base` in the probe's shape. It is 1500 files under a directory of three names of 250 letters each, which fits macOS's path limit of 1024 bytes. The case asserts `changes.files === 1500` and that the commit's `added` is 1500, and it is shown red against the code at `8e00206`. `gaps.md` row 30 ("A branch of thousands of commits or files … were not tried against the wait of 500 milliseconds") speaks of the wait and stays true. No other statement of the tree states the limit.

```seal
verdict: fixed aad5655
answer: `git()` takes a limit for its output, and `branchCommits` and `branchChanges` pass 256 MiB, as the paste-ready fix has it. The fix was read against `frame/design.md` *Scope* item 23 before it was applied: the cut to 20 commits and 50 files is made after the read, so the read's own limit is what has to hold the whole output. The case "reads the commits and the changes of a branch whose list of files is longer than a megabyte of git's output" in `test/worktrees.test.ts` makes 1500 files under three names of 250 letters and asserts the commit's 1500 added lines and `changes` of 1500 files with 50 listed. It was seen red against `def5c83` with `expected null to deeply equal [ … ]`, and again with the limit taken off either read alone (`seal mutate`, two mutants). A log or a diff past 256 MiB still reads as none at that head, which `gaps.md` *Not done* now names beside the streamed read the finding offers.
```

### 3. "N commits ahead of main" counts the commits after the branch's cut, which include the base's own commits once the base is merged in

```seal
severity: should
location: `apps/desktop/src/renderer/view.ts:383-389`, `seal/threads/1795043695-inbox-first-window/frame/design.md:124`, `seal/threads/1795043695-inbox-first-window/frame/design.md:171`, `seal/threads/1795043695-inbox-first-window/frame/design.md:263`, `seal/threads/1795043695-inbox-first-window/changelog.md:10`
evidence: read `apps/desktop/src/renderer/view.ts:383-389`, `apps/desktop/src/daemon/worktrees.ts:105-107`, `seal/threads/1795043695-inbox-first-window/frame/design.md:124`, `:171`, `:215`, `seal/threads/1795043695-inbox-first-window/gaps.md:71`
```

Why it matters: the preview says "6 commits ahead of main" and a view's base says "main · 6 ahead" (`view.ts:386-387`). Both words are new in this diff. The number is `newCommits`, `git rev-list --count <baseCommit>..refs/heads/<branch>` (`worktrees.ts:107`), counted from the commit the branch was cut at. That is how far the branch is ahead of its base only while neither has been merged into the other. Once the base is merged into the work item's branch, every commit the base gained after the cut is in `baseCommit..branch`, so the line counts the base's own commits as commits the branch is ahead by. Merging the base into the branch is how the AgenticSeal workflow this repository runs integrates a conflict (`skills/code-review/orchestration.md` of the plugin, *A conflict with the base is integrated by merging the base into the branch*). Once the branch is merged into the base, the branch is ahead by none, and the line still says N. `frame/design.md` items 4 and 17 (`:124`, `:171`) and scenario 34 (`:263`) say "ahead of its base", and `changelog.md:10` says "how many commits it is ahead of the branch it was cut from". `gaps.md:71` names how far the branch is behind its base as not done, and says nothing of ahead.

The probe's second case merged `main` into a branch after three commits on `main`. It passed, and vitest printed none of the probe's logged counts, so the count is read from git's definition of the range and not executed.

The fix is the framer's to choose, because both ways change the frame. One way keeps the words and makes them true. The daemon counts `git rev-list --count refs/heads/<baseBranch>..<head>` where `baseBranch` is recorded and exists, and sends it as a field of its own. That change reaches *Scope* item 23, *Data & interfaces*, scenarios 26, 27 and 34 and `WORK_ITEM_FIELDS` of `test/daemon.test.ts`. The other way keeps the count and changes the words to what it counts:

```ts
// apps/desktop/src/renderer/view.ts
/**
 * How many commits a work item's branch holds since it was cut: as the
 * preview's sentence, "6 commits since it was cut from main", and as the
 * base's fact in a view, "main · 6 since cut". The count is from the commit
 * the branch was cut at, so a base merged into the branch adds its own.
 */
export function ahead(workItem: WorkItem): { sentence: string; fact: string } {
  const count = workItem.newCommits ?? null;
  const base = workItem.baseBranch ?? null;
  const sentence = count === null ? "" : `${count} ${count === 1 ? "commit" : "commits"} since it was cut${base === null ? "" : ` from ${base}`}`;
  const fact = [base, count === null ? null : `${count} since cut`].filter((part) => part !== null).join(" · ");
  return { sentence, fact: fact || "Not recorded" };
}
```

The snippet changes the words alone. It leaves the function's name, its cases in `test/view.test.ts`, the frame's three lines, scenario 34 and `changelog.md:10` to the fix pass, which owes each of them.

```seal
verdict: fixed aad5655
location: `apps/desktop/src/shared/protocol.ts`, `apps/desktop/src/daemon/worktrees.ts`, `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/src/daemon/last-look.ts`, `apps/desktop/src/daemon/work-items.ts`, `apps/desktop/test/worktrees.test.ts`, `apps/desktop/test/daemon.test.ts`, `apps/desktop/test/view.test.ts`, `apps/desktop/test/last-look.test.ts`
answer: The frame bears the reading the orchestrator's prompt gives: *Scope* item 4 says "the base branch and how many commits the branch is ahead of it", so the count is against the base branch and the words stay. A work item carries a new field, `aheadOfBase`: `git rev-list --count refs/heads/<baseBranch>..<head>`, read at every read of the counts since the base moves by itself, `null` where no base branch is recorded or that branch is gone, and 0 at a creation without asking git. `ahead` of `view.ts` says that count where a base branch is recorded, and `newCommits` alone where none is, which is item 4's "the count alone". `newCommits`, the badge and the list of commits are as they were. The look copies and requires the field. The fix went to paths the finding does not name, on the `location:` line above. Cases, each seen red against `def5c83`: in `test/worktrees.test.ts`, a base merged into the branch (4 commits since the cut, 2 ahead) and a base that took the branch (0 ahead); in `test/daemon.test.ts`, the same told in an `inbox` and a base branch that is gone; in `test/view.test.ts`, `ahead` with the two counts apart. `changelog.md` names the field. The frame is not edited: `frame/design.md` *Scope* item 23, *Data & interfaces* and `frame/plan.md` *Operational impact* do not name the field, which the hand-back gives the orchestrator.
```

### 4. A merge commit on a work item's branch is listed as adding and removing no line

```seal
severity: should
location: `apps/desktop/src/daemon/worktrees.ts:141`, `apps/desktop/test/worktrees.test.ts`
evidence: read `apps/desktop/src/daemon/worktrees.ts:139-161`, `apps/desktop/src/shared/protocol.ts` (`CommitInfo`), `apps/desktop/src/renderer/view.ts:392-394`
```

Why it matters: `git log --numstat` prints no counts for a merge commit unless it is told how to diff one, since `--diff-merges=off` is `git log`'s default. `branchCommits` then finds no line of counts for the merge, and `uncounted` is false, so the commit gets `added: 0` and `removed: 0`. `lineCounts` writes that as "+0", a space, the minus sign U+2212 and "0". A person reads that the merge changed nothing, though it brought every change of the base since the cut onto the branch. `CommitInfo` in `protocol.ts` says the counts are null only "where it changed files and git counts lines of none of them". A merge changed files and is counted as changing none. The existing case "gives a commit that changes no file no lines" pins 0 and 0 for an empty commit, and a merge cannot be told from it. This is not executed: the probe's merge case printed nothing the round could read.

```ts
// apps/desktop/src/daemon/worktrees.ts, branchCommits
// A merge's lines are those it brought onto the branch: its diff against its first parent.
log = await git(repo, ["log", "--no-renames", "--numstat", "--diff-merges=first-parent", `--max-count=${COMMITS_LISTED}`, "--format=%x00%h%x1f%ct%x1f%s", `${baseCommit}..${head}`, "--"]);
```

Precondition: git 2.31 or later, which added `--diff-merges`. An older git refuses the option, and the log is then `null` for every work item, so the fix pass checks the floor the repository names for git, or reads git's version once. The fix pass owes a case in `test/worktrees.test.ts` that merges `main` into a work item's branch after a commit on `main` that changes a file. The case asserts the merge's lines, and it is shown red at `8e00206`.

```seal
verdict: fixed aad5655
answer: `branchCommits` passes `--diff-merges=first-parent`, as the paste-ready fix has it, and `CommitInfo` in `protocol.ts` says a merge's lines are its difference from its first parent. The case "gives a merge commit the lines it brought onto the branch" in `test/worktrees.test.ts` merges `main` into a work item's branch after a commit on `main` that adds two lines, and asserts the merge's `added: 2, removed: 0`. It was seen red against `def5c83`, where the merge had 0 and 0, and again with the option removed (`seal mutate`). The precondition was checked: the repository names no floor for git (`git grep -n -i -e "git 2\." -e "git version" -- docs README.md apps/desktop/package.json` printed nothing), and the machine's git is 2.50.1. An older git than 2.31 refuses the option and lists no commit, which `gaps.md` *Not done* now names; reading git's version was not built.
```

## Confirmations

What matched, each read against `frame/design.md` *Scope* items 18 and 23 and *Data & interfaces*.

- The hello's answer. Phase 4 claimed that a hello waits for the read of the counts for 500 milliseconds at most, joins a read under way, and has its early messages handled after its `ready` or dropped where it left. `daemon.ts#greet` does each of these (`:207-218`, with `readCommitsNow` at `:460-469`). `broadcast` skips a client that is still being greeted (`:510`), and `sendOutput` reaches it with nothing, since its set of sessions is empty until its messages are handled. Every git helper the read awaits catches its own failure (`worktrees.ts`, `newCommits`, `branchHead`, `branchCommits`, `branchChanges`), so `greet`'s `Promise.race` cannot reject. Phase 4 named "One guard no case can fail", the joined read, and that still holds: no case tells two reads side by side from one.
- `agentEvent` (`daemon.ts:134-149`) sets `stateSince`, `stateText` and `stateTool` only where the state changes, and `cutText` keeps 2000 UTF-16 code units, or 1999 where the cut would split a surrogate pair. Phase 5 claimed it dropped `Object.hasOwn` from `agentSaid` because no case could fail it. That is safe: `agentEvent` returns at `:135-136` for any name `agentEventFor` does not own, and `agentSaid` is called only after that.
- `last-look.ts` copies the look field by field, refuses a file whose entries lack a field of the protocol, and writes `last-look.json` with mode 0600 through a partial file and a rename. `work-items.ts` reads an entry without `baseBranch` as `null`. The protocol's new types are the ones *Data & interfaces* gives.
- `createWorktree` reads `baseBranch` with `git symbolic-ref --quiet HEAD` before the worktree is added. The `-z` diff keeps a path with spaces or Hangul whole, which `test/worktrees.test.ts` pins with `src/새 파일 one.txt`.
- `appearance.json`: `readAppearance` reads anything that is not one of the three choices as Night desk, and `writeAppearance` writes mode 0600 through a partial file. `ipcMain.handle(Channel.saveAppearance)` passes the page's value through `themeChoice` before it writes, so a page cannot write anything else into the file. The preload reads the choice with `sendSync` before the page exists. `main.ts` registers that handler inside `whenReady` before the first `createWindow`.
- The renderer draws every text from the daemon with `textContent` or `Option`. `grep -n` for `innerHTML`, `insertAdjacentHTML`, `outerHTML`, `DOMParser` and `srcdoc` over `src/renderer/*.ts` and `index.html` printed nothing (`executed`). The content security policy is the base's.
- Scenario 14's claim since phase 5: `git diff --stat e720eb1 8e00206 -- apps/desktop/src/daemon apps/desktop/src/shared/protocol.ts apps/desktop/test/daemon.test.ts` printed nothing. `git diff --stat 9a3ba95 8e00206 -- apps TRADEMARKS.md README.md README.ko.md` printed nothing, so the code under `trail/gate.md`'s run at `9a3ba95` is the code at the target.
- `gaps.md` row 7 says five test files ran in no phase. `ls apps/desktop/test` lists those five beside the ones the phases name, and nothing else but `fixtures` and the `repositories.ts` helper.
- The suite's label: every phase handed over with the suite `unverified` and the orchestrator named (`gaps.md` row 7). The label is honest. The orchestrator answered it with the broad run that `trail/gate.md` records at `9a3ba95`.

No new test was found that covers nothing its group already covers, among the new cases of `test/daemon.test.ts`, `test/worktrees.test.ts`, `test/work-items.test.ts`, `test/agent-events.test.ts` and `test/appearance.test.ts`. The module cases of `test/last-look.test.ts` and the daemon cases of "the last look" read different units, the class and the handler around it. One gap holds no fact the frame states. `test/agent-events.test.ts` feeds `toString` to `agentSaid`, and the case pins no guard, since phase 5 removed the `Object.hasOwn` it was written for (`test/agent-events.test.ts:28-32`).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The renderer modules this round did not read: `sidebar.ts`, the rest of `shared.ts`, `view.ts` from line 460, `index.html` and `themes.css`, and the cases of `test/view.test.ts` and `test/themes.test.ts`. The prompt asked for the daemon and the protocol first and the renderer as far as budget left | `apps/desktop/src/renderer/`, `apps/desktop/test/view.test.ts`, `apps/desktop/test/themes.test.ts` | the orchestrator, in the scope of the next round |
| The screens beside the polish mockups, the seal's place and the states of a control (scenarios 17, 30, 31 and 35 by eye) | `gaps.md` rows 37, 38, 42 and 43 | the owner |
| Which field of the CLI's `Notification` hook carries the text, and the order of `PermissionRequest` and `Notification` | `frame/questions.md` Q11, `gaps.md` rows 27 and 28 | a person, by the measurement `gaps.md` row 27 names |
| `frame/questions.md` Q4, Q5 and Q7 to Q10, built on their defaults | `frame/questions.md` | the owner |
| The full suite, the typecheck and the documents' checks at the target | `seal/config.json` `Broad gate` | the orchestrator, by the broad run after the rounds settle |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_numstat.test.ts` in `apps/desktop`, once, with the file removed after the run | Case 1 failed at its own `execFileSync("git", ["diff", "--no-renames", "--numstat", "-z", …])` with `spawnSync git ENOBUFS`: a diff of 1500 files under a 753-byte directory path passes the default 1 MiB limit of Electron's Node. The case's calls of `branchCommits` and `branchChanges` after that line did not run. Case 2, a branch that merged `main` after three commits on `main`, passed its one assertion, that the count is not `null`; vitest printed none of its logged values |
| `node scripts/test-in-electron.mjs test/daemon.test.ts test/worktrees.test.ts test/last-look.test.ts test/agent-events.test.ts test/work-items.test.ts test/appearance.test.ts` in `apps/desktop` | 6 files, 130 cases passed, exit 0. A narrow run of the modules this round reviewed, not the broad gate |
