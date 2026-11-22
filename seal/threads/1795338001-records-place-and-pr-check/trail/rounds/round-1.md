# Review round 1: 1795338001-records-place-and-pr-check

```seal
target: 33a34d7 against release/v0.0.2
```

The diff read is `a3e4e7a..33a34d7`, where `a3e4e7a` is the merge base with `origin/release/v0.0.2`. That base has since moved to `cbb2e69` (#138, the docs of the sessions work item). No earlier round exists, so no fact is carried from one; every coordinate below was opened in this round. The work item's `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `33a34d7`, then `trail/phases/phase-1.md` to `phase-3.md`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. Probes and runs went in a `git clone --no-local` of the worktree at `33a34d7`, under the round's scratch directory, and nothing was written into the worktree but this record.

Stage 1, compliance: the build does what *Scope* items 1 to 19 and the folds of *Data & interfaces* say, and the searches of scenarios 5, 6 and 22 print nothing. The findings below are stage 2 defects, except finding 1, which is a gap in the frame that the build follows.

## Findings

### 1. The setup decides what stands from the working tree alone, so it keeps parts no clone holds and drops staged work at its paths

```seal
severity: should
location: `apps/desktop/src/daemon/records-place.ts:202-234`, `apps/desktop/src/daemon/records-place.ts:96-104`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:62`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:161`, `docs/architecture.md:178`, `docs/architecture.ko.md:178`
evidence: executed probe `test/test_tmp_round1.test.ts` cases B, C and K in the round's clone (see Probes); read `apps/desktop/src/daemon/records-place.ts:96-104`, `apps/desktop/src/daemon/records-place.ts:209-231`, `apps/desktop/src/daemon/records-place.ts:276-282`
```

Why it matters: `planRecords` asks `stands()`, which is `lstatSync` of the path, whether a part of the place exists. It never asks git. The working tree and git disagree in two directions, and each produces a defect.

The working tree holds a part that git will not commit. Such a part is kept, the commit leaves it out, and the dialog then shows it as present.

- A root that git ignores: probe C, with `.gitignore` holding `seal/` and a marker `seal/README.md` on disk, planned `blocked: null`, kept both root files, and committed the workflow alone. `readRecordsPlace` answered `root: "seal"`. P7 says the app refuses the setup where git ignores a path. It refuses only a path the setup would write (`records-place.ts:225-231`), never a path it keeps.
- A root that stands untracked: probe C, with an untracked marker `seal/README.md`, committed `seal/config.json` and the workflow and left `?? seal/README.md`. HEAD now holds a `config.json` with no marker beside it. So on GitHub, and in every worktree cut from HEAD, `lib/optin.py` finds no root, and the check examines nothing.
- A setup the daemon did not finish: the commit has no time limit (`gaps.md` *Not done*). Where the daemon ends while a hook runs, the three files stay untracked. The next plan keeps all three, has nothing to write and shows "Records: `seal/`", while nothing of the place is committed. This instance is read, not run.
- A workflow kept untracked, and a root behind a symbolic link or inside a submodule: each is kept on this disk and is missing from a clone. These are read, not run.

Git's index holds a path the working tree does not show. The setup writes over it.

- Probe B staged `.github/workflows/owlery-seal.yml` with the person's text, then removed the file from disk (`AD`). The plan wrote the path as new, and a pre-commit hook refused the commit. The cleanup's `git reset -- <paths>` (`records-place.ts:282`) then dropped the person's staged entry: `ls-files --stage` printed it before the setup and nothing after it. Had the commit passed, Owlery's text would have replaced the staged blob. `changelog.md` and `pr.md` say other staged work stays staged.
- A path that HEAD holds and that was deleted from disk without staging is planned as new, and the commit replaces the committed file. The dialog lists that file as one it writes, and does not say that it replaces one. This is read, not run.

A folder above a path stands as something other than a folder. Probe K, with `.github` committed as a file, planned `blocked: null` and offered the commit. The setup then threw `ENOTDIR: not a directory, mkdir '<absolute path>'`, so the person sees a commit offered that cannot be made, and an error that holds a path of this machine.

The class was listed from what produces it: the ways one path's state differs between the working tree, the index and HEAD. Those are untracked (ignored among it), behind a link, inside a submodule, staged and deleted, committed and deleted, and a non-folder above the path. The frame states the rule the build follows: *Scope* item 10 says "Where one stands, its `README.md` and its `config.json` are kept as they are", and P6 says "A file that stands is kept as it is". So the fix pass owes the orchestrator a fold of `frame/design.md:62` and `:161`. It owes the same for the phase 2 fold at `frame/design.md:411` ("A plan with nothing to write is not `blocked`"), since an uncommitted kept root has to block even where nothing is written. P6's sentence in both editions (`docs/architecture.md:178`, `docs/architecture.ko.md:178`, and `frame/design.md` P6) and `changelog.md` line 7 ("What stands in the repository is kept") then say "committed" where they say "stands". `readRecordsPlace` still reads the working tree, as *Scope* item 7 says. So `lacksRecords` still opens no dialog at a registration of such a repository, and the menu entry is then where the person meets the blocked sentence. The snippet stops there. Cases for each instance above belong in `apps/desktop/test/records-place.test.ts`.

```ts
// records-place.ts. Precondition: `cat-file -e <head>:<path>` reads the
// committed tree and follows no link on disk; `lstatSync` reads each folder
// above a written path without following its last component.

/** Whether the commit `head` holds the path. A path that stands untracked, ignored, behind a link or inside a submodule is not held. */
async function committed(folder: string, head: string | null, path: string): Promise<boolean> {
  return head !== null && (await git(folder, ["cat-file", "-e", `${head}:${path}`])).code === 0;
}

// In planRecords, after `const written = ...`:
  // A part is kept only where HEAD holds it: one that stands only on this disk is missing from every clone, and the check on GitHub finds no root.
  const unheld: string[] = [];
  for (const file of files) if (file.text === null && !(await committed(folder, head, file.path))) unheld.push(file.path);
  // A path the setup writes that the index already holds is the person's staged work.
  const indexed = written.length === 0 ? [] : (await git(folder, ["ls-files", "--cached", "--", ...written])).stdout.split("\n").filter((path) => path !== "");
  // A folder above a written path that stands as something other than a folder.
  const notFolders = [...new Set(written.flatMap((path) => {
    const above: string[] = [];
    for (let at = dirname(path); at !== "."; at = dirname(at)) above.push(at);
    return above.filter((at) => stands(folder, at) && !lstatSync(join(folder, at)).isDirectory());
  }))];

// And the chain of `blocked`, with these arms after `root === null` and before the arm on the branch:
  } else if (unheld.length > 0) {
    blocked = `${named(unheld)} stands in this checkout and is not committed, so a clone of the repository does not hold it. Commit it or remove it, and open this again.`;
  } else if (indexed.length > 0) {
    blocked = `${named(indexed)} is staged in this repository. Commit it or unstage it, and open this again.`;
  } else if (notFolders.length > 0) {
    blocked = `${named(notFolders)} is a file, so the setup cannot write below it.`;
  }
```

### 2. A write to a record the daemon cannot read replaces the whole record

```seal
severity: should
location: `apps/desktop/src/daemon/decision-record.ts:90-97`, `apps/desktop/src/daemon/decision-record.ts:378-383`
evidence: executed probe `test/test_tmp_round1.test.ts` case D in the round's clone; read `apps/desktop/src/daemon/decision-record.ts:378-383`
```

Why it matters: `writeRecord` reads the file through `textOf`, which returns null on every error. A null is read as "no record stands", so the change is applied to a new record's head, and `writeWholeFile` renames the result over the existing file. Probe D wrote a record that held decision 1 and a line of the person's prose, made the file unreadable (mode 000), and called `writeRecord` with `withDecision`. The call returned decision 1 as `second`. The file then held the new head and that one block, and the first decision and the prose were gone. Any read error other than absence does the same: `EACCES`, or `EMFILE` in a daemon that holds many terminals' descriptors. The frame says each write changes one block and leaves every other line of the file as it is (*Scope* item 17), and P9 makes this file the one source of the work item's decisions. A case belongs in `apps/desktop/test/decision-record.test.ts` under `writeRecord`: a record that stands and cannot be read throws, and keeps its text. It is seen red against the code at `33a34d7`, as probe D shows.

```ts
/** The record's text, or null where no file stands at its path. Any other failure to read it throws, so a write never replaces a record it could not read. */
function recordText(file: string): string | null {
  try {
    return readFileSync(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

// writeRecord: `const before = recordText(file);`, and its docstring gains
// "A record that stands and cannot be read throws, and is left as it is."
// `workItemDirectory` keeps `textOf` for `routing.md`: a directory whose
// routing.md cannot be read declares nothing, as the check reads it.
```

### 3. Any file named `hygiene.yml` counts as the pull request check, so the setup writes no workflow beside a project's own

```seal
severity: should
location: `apps/desktop/src/daemon/records-place.ts:120-123`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:62`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:161`
evidence: read `apps/desktop/src/daemon/records-place.ts:120-123`, `apps/desktop/src/daemon/records-place.ts:211`, `apps/desktop/src/daemon/records-place.ts:217`, `apps/desktop/src/renderer/view.ts:1264-1271`
```

Why it matters: `checkOf` keeps `.github/workflows/hygiene.yml` because a file stands at that path. The root is told by its marker line, but this workflow is told by its name alone, and `hygiene` is a generic name for a project's own lint workflow. A repository that has such a workflow gets no `owlery-seal.yml`. The dialog then says "Check: `.github/workflows/hygiene.yml`", and `Repository.records.check` names that file, which #43 reads to say which workflow a repository runs (*Scope* item 27). No pull request of that repository is then judged. *Scope* item 10 states the rule as the build has it, so `frame/design.md:62` and `:161` are folded with the fix. The fixture of the case "keeps an AgenticSeal root, its config.json and its hygiene.yml" in `apps/desktop/test/records-place.test.ts` then holds the `chain_check.py` line. A new case there shows that a `hygiene.yml` holding no such line is not kept.

```ts
/** The workflow that stands: Owlery's, or AgenticSeal's where Owlery's does not, told by the check it runs. Null where neither does. */
function checkOf(folder: string): string | null {
  if (stands(folder, WORKFLOW)) return WORKFLOW;
  return textOf(join(folder, PLUGIN_WORKFLOW))?.includes("skills/code-review/scripts/chain_check.py") === true ? PLUGIN_WORKFLOW : null;
}
```

### 4. The settle search that P10 gives prints nothing for a record whose lines end with a carriage return

```seal
severity: should
location: `docs/architecture.md:189`, `docs/architecture.ko.md:189`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:389`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:392`, `apps/desktop/test/decision-record.test.ts:402-419`
evidence: executed `git grep -n -e '^state: reversed$' -e '^state: open$' -- '*/threads/*/decisions.md'` in a scratch repository whose `decisions.md` holds `state: open` and `state: reversed` with CRLF line ends (exit 1, nothing printed), and `git grep -n -E '^state: (reversed|open)[[:space:]]*$' -- '*/threads/*/decisions.md'` there (exit 0, both lines, and neither `state: opened` nor `state: open x`)
```

Why it matters: P10 says a settle keeps a work item's directory while that search prints a line of it. `$` in git's pattern matches before the line feed, so a line `state: open` followed by a carriage return does not match. The daemon's reader reads that same record as holding an open question. The writer keeps a CRLF record's line ends, and a case holds that behaviour ("keeps the line ends of a record whose lines end with a carriage return and a line feed"). A Windows checkout with `core.autocrlf` writes CRLF into the working tree that `git grep` searches. So a settle run there removes a directory whose question is open, and P10 tells it that nothing is open. The command stands in four places: both editions, and `frame/design.md` P10 in both languages. The case at `decision-record.test.ts:402-419` reads the command out of both editions and runs its own copy of the arguments, so the fix pass changes all of these, and that case gains a CRLF record.

```text
git grep -n -E '^state: (reversed|open)[[:space:]]*$' -- '*/threads/*/decisions.md'
```

### 5. The comment on `renaming` now stands above the new `records` field

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:183-186`
evidence: read `apps/desktop/src/daemon/daemon.ts:183-186`
```

Why it matters: the field was inserted between the line comment "The work items whose branch is being renamed, by their ids …" and `renaming`. An agent that reads `records` now finds two comments above it, and the first one is wrong for that field. `renaming` is left with no comment.

```ts
  /** What each repository's main checkout held of the records place when it was last read, by the repository's id. */
  private readonly records = new Map<number, RecordsPlace>();
  // The work items whose branch is being renamed, by their ids. What a read of the commits finds under the old name meanwhile is dropped.
  private readonly renaming = new Set<number>();
```

## Confirmations

What matched: `pr-check/` holds the 19 scripts and `LICENSE`, and each is byte-equal to the installed AgenticSeal 0.38.4 file at the same path. Executed: `cmp` over `git ls-files pr-check` against the plugin, 20 files compared and none differ. *Scope* item 1 ("This work changes none of them") holds.

What matched: the searches of scenarios 5, 6 and 22 print nothing at `33a34d7`. Executed: `git grep -n -F` for each of the six strings beside *Scope* items 3 and 4, for `byte for byte`, for `is decided by issue #40`, for `questions and answers` and for `질문과 답`. Both editions of `docs/architecture.md` count 26 heading lines and 107 table lines (executed `grep -c '^#'` and `grep -c '^|'`). The broad gate's own comparison is not run here.

What matched: the narrow runs pass at `33a34d7`. Executed, in the clone with `OWLERY_BACKGROUND=1`: `node scripts/test-in-electron.mjs test/records-place.test.ts test/decision-record.test.ts test/record-blocks.test.ts test/pr-check.test.ts` gave 4 files and 84 cases passed. `test/records-dialog.test.ts` ran alone, the one built-app file this work adds (scenario 17), and gave 1 case passed. No source file changed after `22c6726`, where phase 3 ran that file. The seen-red claims and the mutation tables of the three phase records were read and not re-run.

What matched: the TypeScript reader agrees with `pr-check/lib/fields.py` beyond the 35 fixtures. Executed: probe case J generated 4000 texts from 66 line shapes (fences of each kind and indent, list and quote markers, HTML block openers, comment lines, CR, CRLF and LF ends, U+2028, U+000B, U+000C, U+FEFF, a Korean reason). Both readers read each text for the verdict and run kinds, and every block, field, refusal and notice was equal for all 4000. This is a sample, and a weak one for blocks: only 3 of the texts held a block that parsed, so it holds the walk's and the refusals' agreement more than the fields'. No fixture of `test/decision-record.test.ts` holds non-ASCII text in a decision or question block, which a record written under `Record language` Korean would hold (`decision-record.test.ts:27-78`). A value the reader refused would make `withDecision` throw rather than write, because the new block is read back (`decision-record.ts:274-278`).

What matched: the setup cannot run twice at once, and a plan the person did not read is refused. Read: `setUpRecords` waits behind `this.changing` (`daemon.ts:541`), re-plans and compares the stamp (`records-place.ts:252-253`), and writes with `wx` (`records-place.ts:272`). A `.github` that is a symbolic link out of the repository makes the plan throw git's `beyond a symbolic link`, and nothing is written there (probe A, executed). One window stays open: the commit lands on whatever branch HEAD names when `git commit` starts, and a checkout between the re-plan and the commit moves it. That window is read and not run.

What matched: `decisions.md` is left at mode 0600 after a write (probe D read `600`), as `gaps.md` *Not done* says. Git records only the executable bit, so neither the commit nor `git status` changes. `writeWholeFile` now also writes its partial file `decisions.md.<pid>` inside a person's worktree, where before this work it wrote only in the daemon's run folder. A daemon killed between the write and the rename leaves that untracked file for a stage's `git add` to pick up. That is read, not a finding at this size.

What matched: the written workflow (`records-place.ts:49-93`) has `permissions: contents: read` and runs on `pull_request`, not `pull_request_target`. It runs `chain_check.py` from its clone under `$RUNNER_TEMP`, so the pull request's tree cannot put a module on that script's path. After a release the release branch is deleted: `git ls-remote` lists the tag `v0.0.1` and no `release/v0.0.1`. So once the tag exists, the fallback clone fails closed rather than running a moved branch. Two things do change what runs, and they are in *Not judged*: a tag moved in Owlery's repository, and a pull request that edits `owlery-seal.yml` itself. `--baseline "origin/${{ github.base_ref }}"` is expanded inside double quotes in a shell step, as `hygiene.yml` does. A base branch name holding `$(` would run in that step, and only a person with push access can make one. The workflow sets up no Python, so "on Python 3.12 or newer" in P8, `changelog.md` and `pr.md` rests on the `python3` of `ubuntu-latest`, which is 3.12 on Ubuntu 24.04.

What matched: the quotes of `pr.md` stand word for word in the tree. "Owlery commits work records to this repository. A repository that cannot keep work records in its tree is out of scope for Owlery." is at `apps/desktop/src/renderer/view.ts:1251`. "Set up and commit" is at `apps/desktop/src/renderer/index.html:771`, and "Records and check…" at `view.ts:1176`. #137, which `pr.md` cites, holds the unpushed setup as its first *Done when* line (executed `gh issue view 137`). Every list item of `changelog.md` was read against the code, and none claims what the tree does not hold, except where findings 1 and 4 change a sentence.

What matched: each new test file was read against its group. The daemon cases over `planRecords` and `setUpRecords` hold the message shape and the inbox, and the `records-place.test.ts` cases hold the module. Scenarios 7 and 8 name both. No case covers only what another case already covers.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The merge with `cbb2e69` meets one conflict hunk in each edition: the row "The daemon" of *State lives in three places*. #138 added "each pane's record with the id of its conversation" to the old cell, and P11 replaced "questions and answers". The resolution keeps #138's words and P11's, so that scenario 22's search still prints nothing. After the merge each edition counts 27 heading lines and 121 table lines (#138's 27 and 122, less P5's row). Executed `git merge-tree --write-tree base/release 33a34d7` in the clone | `docs/architecture.md:188` and `docs/architecture.ko.md:188` at `cbb2e69` | The orchestrator, at the merge |
| Whether a pull request can pass `seal` by editing `.github/workflows/owlery-seal.yml` in its own branch: GitHub runs the pull request's copy of a `pull_request` workflow | `apps/desktop/src/daemon/records-place.ts:57-92` | #43, which makes `seal` the required check |
| Whether the workflow should pin the check to a commit rather than to the tag `v<version>`, which Owlery's maintainers can move | `apps/desktop/src/daemon/records-place.ts:83-86`, `seal/threads/1795338001-records-place-and-pr-check/frame/plan.md:26` | The orchestrator. *Alternatives considered* chose the tag, and no source weighs a moved tag |
| The whole suite, the typecheck and the broad gate at HEAD, labelled `unverified` in `gaps.md` | `seal/threads/1795338001-records-place-and-pr-check/gaps.md:7` | The orchestrator's broad gate, after the rounds |
| `python3` on `macos-latest` after `setup-python`, and the workflow as GitHub runs it (Q3, Q4) | `seal/threads/1795338001-records-place-and-pr-check/gaps.md:8-9` | The first run of `check` on this pull request, and #43 |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 TMPDIR=<scratch>/tmp node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts` in the clone's `apps/desktop`. Run twice: the first run's output went to the console, which the runner drops, so the second wrote it to a file | A: the plan threw `fatal: pathspec '.github/workflows/owlery-seal.yml' is beyond a symbolic link`, and the outside folder stayed empty. B: before, `AD .github/workflows/owlery-seal.yml` with blob `950b81b`; the setup threw the hook's `no`; after, `ls-files --stage` printed nothing. C, ignored root: `blocked: null`, both root files kept, workflow written, and HEAD then held `.gitignore`, `README.md` and the workflow; `readRecordsPlace` gave `root: "seal"`. C, untracked root: HEAD held `seal/config.json` and the workflow, and status was `?? seal/README.md`. K: `blocked: null`, then `ENOTDIR … mkdir '…/.github/workflows'`, and the status was clean. D: the call returned `[[1, "second"]]`, the file held the new head and that one block, and the mode was `600`. J: 4000 texts, 3 with a block, 0 differences |
| `node scripts/test-in-electron.mjs test/records-place.test.ts test/decision-record.test.ts test/record-blocks.test.ts test/pr-check.test.ts`, `OWLERY_BACKGROUND=1` | 4 files, 84 cases passed |
| `node scripts/test-in-electron.mjs test/records-dialog.test.ts`, `OWLERY_BACKGROUND=1` | 1 file, 1 case passed |
| `git merge-tree --write-tree --name-only base/release 33a34d7` in the clone, with `base/release` fetched from the worktree's `origin/release/v0.0.2` | Exit 1, with a conflict in `docs/architecture.md` and `docs/architecture.ko.md`, one hunk each at the daemon's row |
| The two `git grep` commands of finding 4, in a scratch repository | The first: exit 1. The second: exit 0, matching the two CRLF lines only |
