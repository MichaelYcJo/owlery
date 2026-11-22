# Review round 2: 1795338001-records-place-and-pr-check

```seal
target: 1832417, fixes a0ccf73..1832417
```

This is a verifying round. The range `a0ccf73..1832417` holds the merge `f99f0a5` of `origin/release/v0.0.2` at `cbb2e69`, the fix commits `fd3fc2a`, `dbac467`, `7cb7a5b` and `85b6c50`, the closes at `7a937cb`, the correction of `pr.md` at `72b043d` and the fold at `1832417`. The work item's `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `1832417`, then `trail/phases/phase-1.md` to `phase-3.md` and `trail/rounds/round-1.md`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. Every run went in a `git clone --no-local` of the worktree at `1832417` under the round's scratch directory, and nothing was written into the worktree but this record.

Facts carried from round 1 and not re-established, because nothing they stand on changed in the range: `git diff --stat a0ccf73 1832417 -- pr-check apps/desktop/src/daemon/record-blocks.ts apps/desktop/src/shared .github` prints only the work item's records (executed). So the byte equality of `pr-check/` with AgenticSeal 0.38.4, the agreement of the two readers of a `seal` block, and round 1's reading of the written workflow's permissions and its fallback clone are carried. The merge brought no change under `apps/` (`git diff a0ccf73 f99f0a5 -- apps` prints nothing, executed). No source file changed after `85b6c50` (`git diff --stat 85b6c50 1832417 -- apps pr-check .github` prints nothing, executed), so the orchestrator's typecheck at `85b6c50` stands for HEAD's code. That typecheck is the orchestrator's run and was not run here.

The rewritten `planRecords` was read at `apps/desktop/src/daemon/records-place.ts:250-302` and run over the shapes the spawn named. A submodule at `seal` blocks the plan, because the commit holds a link to a commit there and no file (probe U). A detached head blocks a plan with a file to write and shows a repository that holds every part (probe D). An empty repository with no commit is planned and set up as its first commit, and one where a root is staged and nothing is committed is blocked (probe E). A sparse checkout is finding 2. The new failure paths the fix introduces are each a refusal of the plan: a kept file git ignores, a kept file the commit does not hold, a written path git holds, a folder that is something else, and a throw where `git ls-tree` or `git ls-files` fails. Each is a fix of round 1's finding 1 and none is a regression, except the two findings below. `writeRecord` has one new failure path: a record it cannot read throws Node's own error, which names the record's absolute path. That is a row of *Not judged*.

## Findings

### 1. The setup keeps a root or a check that only the checkout holds, where the commit holds the same file with other text

```seal
severity: should
location: `apps/desktop/src/daemon/records-place.ts:120-128`, `apps/desktop/src/daemon/records-place.ts:271-299`, `apps/desktop/test/records-place.test.ts`, `docs/architecture.md:203`, `docs/architecture.ko.md:203`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:62`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:161`, `seal/threads/1795338001-records-place-and-pr-check/changelog.md:10`, `seal/threads/1795338001-records-place-and-pr-check/gaps.md:19`
evidence: executed probe `test/test_tmp_round2.test.ts` case M in the round's clone (see Probes); read `apps/desktop/src/daemon/records-place.ts:120-128`, `apps/desktop/src/daemon/records-place.ts:273`
reopens: round-1#1
```

Why it matters: round 1's finding 1 was that the setup decides what stands from the working tree alone, so it keeps parts no clone holds. The fix asks git whether the commit holds each kept path as a file (`records-place.ts:273`). It does not ask whether the commit holds what the plan read from that file. `rootOf` tells the root by the marker line of the checkout's `README.md`, and `checkOf` tells AgenticSeal's workflow by the checkout's text of `hygiene.yml` (`records-place.ts:120-128`). Both are read from disk. Where the commit holds the same path with other text, the plan keeps the file, and a clone gets the commit's text.

- Probe M, the root: the commit holds `seal/README.md` opening with `# Our seal package`, and the checkout's copy opens with the marker, uncommitted. The plan kept `seal/README.md`, wrote `seal/config.json` and the workflow, and was not blocked. The setup committed. HEAD's `seal/README.md` still opens with `# Our seal package`, so on GitHub `pr-check/lib/optin.py` finds no root and the check examines nothing. `readRecordsPlace` answered `root: "seal"`, and the status was ` M seal/README.md`.
- Probe M, the check: the commit holds a `hygiene.yml` that runs `npm run lint`, and the checkout's copy holds the step that runs `chain_check.py`. The plan kept all three files, wrote nothing and was not blocked, so the dialog shows a repository that holds every part. The committed `hygiene.yml` runs no check (`M_hygiene_committed_runs_check: false`).
- The same holds of a kept `config.json` whose committed text lacks the two language keys the check asks for, which the checkout's copy holds. This instance is read, not run.

The class was listed from what produces it: each kept part, `README.md`, `config.json` and the workflow, against each way the commit can differ from the checkout at that path. The ways are: no file in the commit, which the fix blocks; a link or a submodule in the commit, which the fix blocks; the same file with other text, which this finding names; and a file the commit holds that the checkout does not show, which finding 2 names for the root and `gaps.md:19` names for `hygiene.yml`. `frame/design.md:62` says "A file is kept only where the commit the checkout stands at holds it as a file", and the build follows it. So the fix pass owes the orchestrator a fold of `:62` and `:161`, and P6 in both editions (`docs/architecture.md:203`, `docs/architecture.ko.md:203`, and `frame/design.md:359` and `:362`), `changelog.md:10` and `gaps.md:19` ("The setup asks git about the root") then say that a kept file is one the commit holds as the checkout holds it. Cases for the root and the workflow belong in `apps/desktop/test/records-place.test.ts`. The snippet covers the code. It stops at those statements.

```ts
// records-place.ts, in planRecords after `const unheld = ...`. Precondition:
// `folder` is the top of the work tree, since `git diff --name-only` prints
// paths from there; `git diff <commit>` compares through git's clean filters,
// so a file whose line ends git converts reads as the same file.

  // A kept file the checkout holds otherwise than the commit: a clone gets the commit's text, so a marker or a check step written only in this checkout is missing there.
  const keptHeld = files.filter((file) => file.text === null && !unheld.includes(file.path)).map((file) => file.path);
  const changed = head === null || keptHeld.length === 0 ? [] : (await git(folder, ["diff", "--name-only", "-z", head, "--", ...keptHeld])).stdout.split("\0").filter((path) => path !== "");

// And in the chain of `blocked`, after the arm on `unheld`:
  } else if (changed.length > 0) {
    blocked = `This checkout holds ${named(changed)} otherwise than the commit it stands at, so a clone of the repository would get the commit's. Commit or restore what is named, and open this again.`;
```

```seal
verdict: fixed 2a5e9c8
location: `apps/desktop/src/daemon/records-place.ts`, `apps/desktop/test/records-place.test.ts`, `apps/desktop/src/shared/protocol.ts`, `seal/threads/1795338001-records-place-and-pr-check/changelog.md`, `seal/threads/1795338001-records-place-and-pr-check/gaps.md`
answer: The finding holds. Its snippet was read and not pasted, because it adds a third arm for a third case of one cause, and the fix restates what `planRecords` decides. The plan is now made from the commit the checkout stands at and from nothing else: the root by the marker of the committed `README.md` (`git cat-file blob`), `config.json` and Owlery's workflow by whether the commit holds them as files, AgenticSeal's `hygiene.yml` by its committed text, and a repository with no commit as one that holds nothing. The checkout is then compared with the commit at the paths of the place, which are the plan's files, the `README.md` of each root name, the two workflows, and every path below a new root. A path differs where `git status --porcelain --ignored --untracked-files=all` over those paths prints it, or where the commit holds a file and the working tree shows none or the reverse. One refusal names every such path, and it replaces the two arms of `dbac467` on a kept file not committed and on a written path git holds. Each instance the finding lists is blocked and has a case in "judges the root and the check by what the commit holds": probe M's root (the plan is `agentic-seal/`, blocked naming `seal/README.md`), probe M's check (the plan writes Owlery's workflow, blocked naming `hygiene.yml`), and a `config.json` whose text differs, in the checkout or in the index alone. The case was seen red at `0997ffd` before the fix, at its first assertion, and with the status half of the comparison removed (`seal mutate`, red at `records-place.test.ts:373`) and with the committed text of `hygiene.yml` replaced by the checkout's (red at `:386`). `829fb57` adds three assertions for guards no case reached. `changelog.md:7` and `:10` and `gaps.md:19` say the rule; `protocol.ts:83` no longer says a kept file stands. Not changed, because the frame and the policy text are the orchestrator's: `frame/design.md:62`, `:161`, `:359` and `:362`, and `docs/architecture.md:203` with `docs/architecture.ko.md:203`, whose sentence on a file "not committed" and a path "git holds" is true and no longer the whole rule.
```

### 2. A records root the commit holds and the checkout does not show gets a second root beside it

```seal
severity: should
location: `apps/desktop/src/daemon/records-place.ts:259-262`, `apps/desktop/src/daemon/records-place.ts:120-122`, `apps/desktop/test/records-place.test.ts:325-336`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:160`, `seal/threads/1795338001-records-place-and-pr-check/changelog.md:7`
evidence: executed probe `test/test_tmp_round2.test.ts` cases R and S in the round's clone (see Probes); read `apps/desktop/src/daemon/records-place.ts:259-262`, `pr-check/lib/optin.py` (the order `HOME`, then `SECOND_HOME`)
regression: round-1#1
```

Why it matters: the unit is the choice of a new root's name in `planRecords` (`records-place.ts:262`), which `dbac467` changed to ask git. The frame's fold at `frame/design.md:160` tells the kept root by the checkout's `README.md` and gives a new root `agentic-seal` where git holds anything under `seal`; the fix built both halves as the fold states them, so the defect comes from that rule, which asks git whether `seal/` holds something and never whether what it holds is the root. Where the commit holds an AgenticSeal root at `seal/` and the checkout does not show it, `rootOf` answers null, `gitHolds("seal")` answers true, and the plan writes a second root at `agentic-seal/`.

- Probe R: the commit holds `seal/README.md` with the marker, `seal/config.json` and AgenticSeal's `hygiene.yml`, and `seal/` was removed from the checkout and the removal not staged. The plan wrote `agentic-seal/README.md` and `agentic-seal/config.json`, kept `hygiene.yml`, and was not blocked. The setup committed. HEAD then held both roots, each `README.md` opening with the marker. `rootOf` answered `agentic-seal`, so the daemon reads and writes the work items' records there. `pr-check/lib/optin.py` takes `seal/` first, so the check on GitHub reads the other root. Records the daemon commits are then records the check never reads.
- Probe S, a sparse checkout without a cone (`/*` and `!/seal/`): the same plan and the same commit. Nothing was removed by the person here; the checkout is sparse.
- Probe S, a cone sparse checkout of `.github` alone: the same plan, not blocked, so the dialog offers the commit. The setup then failed at `git add` with git's message on paths outside the sparse-checkout definition, and its cleanup left the status clean.

Before `dbac467` the same repository planned `seal/README.md` as new and wrote over the committed root, which round 1 named. The fix moved the defect and did not end it. P6 says "Where the repository keeps a `seal/` of its own, the root is `agentic-seal/`", and `changelog.md:7` adds "on disk or in git". A committed AgenticSeal root is not a `seal/` of the project's own, so `changelog.md:7` and `frame/design.md:160` owe the distinction too. The case at `records-place.test.ts:325-336` holds a project file under `seal/`, and a case beside it belongs to a committed marker root that the checkout does not show.

```ts
// records-place.ts. Precondition: `cat-file blob` reads the committed blob as
// stored, so a marker line stored with a carriage return is read as `rootOf`
// reads it, with `\r` taken off.

/** The first of the root's two names whose `README.md` the commit holds as a file that opens with the marker, as the check reads a clone. Null where none does, or where there is no commit. */
async function committedRootOf(folder: string, head: string | null, inCommit: Map<string, string>): Promise<string | null> {
  if (head === null) return null;
  for (const name of ROOTS) {
    if (!FILE_MODES.includes(inCommit.get(`${name}/README.md`) ?? "")) continue;
    const shown = await git(folder, ["cat-file", "blob", `${head}:${name}/README.md`]);
    if (shown.code === 0 && shown.stdout.split("\n", 1)[0]?.replace(/\r+$/, "") === MARKER) return name;
  }
  return null;
}

// In planRecords, after the two listings:
  const committedRoot = await committedRootOf(folder, head, inCommit);

// And in the chain of `blocked`, right after the arm on `root === null`:
  } else if (committedRoot !== null && kept !== committedRoot) {
    blocked = `The commit this checkout stands at holds the records root ${committedRoot}/, and the checkout does not show it. Restore it, or widen a sparse checkout to it, and open this again.`;
```

```seal
verdict: fixed 2a5e9c8
location: `apps/desktop/src/daemon/records-place.ts`, `apps/desktop/test/records-place.test.ts`, `seal/threads/1795338001-records-place-and-pr-check/changelog.md`
answer: The finding holds, and it is finding 1's cause from the other side, so one change closes both and the snippet's `committedRootOf` arm was not pasted. The root is told from the commit, so a committed root the checkout does not show is the kept root, the plan lists `seal/README.md` and `seal/config.json` as kept and never plans `agentic-seal/`, and the comparison of the checkout with the commit blocks the plan naming both files. Status reports a root removed and not staged. It reports nothing of a sparse checkout, which the second half of the comparison holds: the commit holds a file and the working tree shows none. The case "keeps a root the commit holds and the checkout does not show" covers probe R, probe S without a cone and probe S with a cone of `.github`; it was seen red at `0997ffd` before the fix, with the root read from the checkout again (`seal mutate`, red at `records-place.test.ts:433`), and with the second half of the comparison removed (red at `:452`, the sparse checkout's refusal). The case at the finding's `:325-336` now also holds that a file below a new root's name that the commit does not hold, untracked, ignored or staged alone, blocks the plan and is named, in place of taking the name for the project's own from the disk or the index. `changelog.md:7` says "Where the commit holds a `seal/` folder of your own". `frame/design.md:160` is the orchestrator's to fold: a kept root is one whose committed `README.md` opens with the marker, and a new root's name is the first the commit holds nothing at or below. Not covered: in a sparse checkout that leaves out a root the setup would create, the plan is not blocked and the setup fails at `git add` with git's words, as the round's third bullet of probe S saw, and `gaps.md` *Not done* names it.
```

### 3. The fold's list of what blocks a plan leaves out the folder arm, and two sentences say a plan with nothing to write is blocked only for a file not committed

```seal
severity: should
location: `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:64`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:411`, `apps/desktop/src/renderer/view.ts:1247-1249`
evidence: read `apps/desktop/src/daemon/records-place.ts:261-299`, `apps/desktop/src/renderer/view.ts:1240-1249`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:64`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:411`
regression: round-1#1
```

Why it matters: the units are *Scope* item 12 and the *Data & interfaces* fold of `frame/design.md`, which the fold `1832417` rewrote for round 1's finding 1, and the docstring of `recordsDialog`, which `dbac467` wrote. The frame's *Scope* item 12 lists the conditions under which a plan is `blocked`. The fix added an arm for a folder above a written path at which something else stands (`records-place.ts:292-293`), and the fold rewrote item 12 from the fix and left that arm out, so the defect came from the fold and not from the code. A reader of item 12, such as the sealer or #119's dialog work, takes the list as the plan's whole set of refusals.

The sentence at `frame/design.md:411` says a plan with nothing to write "is not `blocked` otherwise". The `recordsDialog` docstring at `view.ts:1247-1249` says such a plan "keeps a file no commit holds". Both are false where both root names are taken and the workflow is kept and committed: `files` is the workflow alone, nothing is written, and the arm on `root === null` (`records-place.ts:284-285`) blocks the plan. The sentence at `:411` carries this from phase 2's fold, so the fold did not introduce it, and it goes with the same fix. Findings 1 and 2 each add an arm, which the fix pass adds to item 12 too.

```text
frame/design.md:64, the last sentence of item 12:
A plan is `blocked`, and the dialog shows why, where both root names hold something of the project's own, on disk or in git, where git ignores a path of the place, where a file the plan keeps is not committed as a file, where git holds a path the setup would write, where something other than a folder stands at a folder above a path it writes, in the checkout, the index or the commit, and, for a plan that writes a file, where no branch is checked out.

frame/design.md:411:
- A plan with nothing to write is `blocked` where both root names are taken, or where a file it would keep is not in the commit (*Scope* 10), and is not `blocked` otherwise: a repository that has every part committed shows what it has, on a detached head too (*Scope* 12 reads with this).

view.ts:1247-1249:
 * shows what it holds, and no button to commit. One that writes none and is
 * blocked keeps a file no commit holds, or has no folder for a root, and is
 * shown as a plan that writes a file is, with the refusal.
```

```seal
verdict: fixed 2a5e9c8
answer: The finding holds for all three places, and this pass changed the one it may write. The docstring of `recordsDialog` at `apps/desktop/src/renderer/view.ts:1247-1250` now says a plan that writes none and is blocked "has no folder for a root, or its checkout does not hold a file of the place as its commit does", which are the two arms such a plan can reach after the fix of findings 1 and 2. The paste-ready lines for `frame/design.md:64` and `:411` were written against the arms of `dbac467` and are not the text to fold now: the arms are, in order, both root names hold something of the project's own in the commit; git ignores a file of the plan; something other than a folder stands at a folder above a written path, in the checkout, the index or the commit; the checkout does not hold a path of the place as the commit does; and, for a plan that writes a file, no branch is checked out. A plan with nothing to write is blocked by the first and the fourth. Both frame lines are the orchestrator's to fold.
```

### 4. P11 gives the daemon's cell without the words #138 put in it, which the merge kept

```seal
severity: should
location: `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:401`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:403`
evidence: executed `grep -qF` of each line of P1 to P12 (`frame/design.md:327-403`) over both editions of `docs/architecture.md` in the round's clone: every entry stands whole except `:401` and `:403`; read `docs/architecture.md:191`, `docs/architecture.ko.md:191`
```

Why it matters: *The policy documents' text* says each entry is written in `docs/architecture.md`, and P11 gives the second cell of the row "The daemon" as "Progress, session events and output, the cost ledger, what the person has seen, schedule". After the merge with `cbb2e69` the cell is "Progress, session events and output, each pane's record with the id of its conversation, the cost ledger, what the person has seen, schedule" (`docs/architecture.md:191`), and the Korean cell holds "칸마다 그 대화의 ID를 담은 기록" (`docs/architecture.ko.md:191`). The documents are right: they keep #138's words and P11's. The frame now states a cell the tree does not hold. The sealer reads the frame against the tree, and #119, reframed on this frame, edits the same row. Either one may read P11 as the cell's whole text and drop #138's words. The fold at `1832417` brought P6, P7 and P10 in line with the documents, and did not bring P11.

```text
frame/design.md:401:
> Progress, session events and output, each pane's record with the id of its conversation, the cost ledger, what the person has seen, schedule

frame/design.md:403:
> 진행 상태, 세션 이벤트와 출력, 칸마다 그 대화의 ID를 담은 기록, 비용 장부, 사람이 무엇을 보았는지, 일정
```

```seal
verdict: fixed 09a8f96
location: `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:401`, `seal/threads/1795338001-records-place-and-pr-check/frame/design.md:403`
answer: The finding holds. The two lines of P11 now quote the daemon's cell as `docs/architecture.md:191` and `docs/architecture.ko.md:191` hold it, with "each pane's record with the id of its conversation" and "칸마다 그 대화의 ID를 담은 기록". The same fold rewrote the lines the round's findings 1 to 3 left to the frame: `frame/design.md:62`, `:64`, `:160`, `:161`, `:359`, `:362` and `:411`.
```

## Confirmations

```seal
confirms: round-1#2
```
What holds: `writeRecord` reads through `recordText`, for which only `ENOENT` means no record (`apps/desktop/src/daemon/decision-record.ts:372-394`). Round 1's probe D was written again and run at HEAD: the call threw `EACCES`, and the file kept its decision and the person's prose (`D_kept: true`). Executed. The case "throws where a record stands and cannot be read, and leaves the file as it is" passed in the narrow run. Its seen-red claim at `a0ccf73` and the `seal mutate` runs were read, not re-run.

```seal
confirms: round-1#3
```
What holds: `checkOf` keeps `hygiene.yml` only where its text holds `skills/code-review/scripts/chain_check.py` (`apps/desktop/src/daemon/records-place.ts:125-128`). The case at `apps/desktop/test/records-place.test.ts:131-149` passed, and so did the case at `:109`, whose fixture now holds the step. This repository's own `.github/workflows/hygiene.yml:84` names that path. Executed for the runs, read for the line. The text is read from the checkout and not from the commit, which is finding 1 and not this close.

```seal
confirms: round-1#4
```
What holds: P10's command `git grep -n -E '^state: (reversed|open)[[:space:]]*$' -- '*/threads/*/decisions.md'` stands in both editions (`docs/architecture.md:214`, `docs/architecture.ko.md:214`) and in `frame/design.md:389` and `:392`. Executed: the `grep -qF` above and the case at `apps/desktop/test/decision-record.test.ts:402`, which reads the command out of both editions and runs it over a record with line feeds and over the same record with carriage returns. Both passed in the narrow run.

```seal
confirms: round-1#5
```
What holds: the comment on `renaming` stands above it, and the `records` field carries its own docstring (`apps/desktop/src/daemon/daemon.ts:183-186`). Read.

What matched: round 1's probes A, B, C and K were written again and run at HEAD, and each instance round 1's finding 1 listed is now refused. A: a `.github` that links out of the repository blocks the plan with the folder sentence, and the outside folder stays empty. B: a staged and deleted workflow blocks the plan, and `ls-files --stage` prints the person's blob `950b81b` before and after. C: a root git ignores blocks with P7's sentence naming both files, and an untracked root blocks with the sentence that names `seal/README.md`; HEAD is unchanged in each. K: a `.github` that is a file blocks the plan, and the status stays clean. Executed.

What matched: the merge resolution. Each edition's row "The daemon" keeps #138's words and P11's (`docs/architecture.md:191`, `docs/architecture.ko.md:191`). Each edition counts 27 heading lines and 121 table lines, and `cbb2e69`'s editions count 27 and 122, less P5's removed row. The searches of scenarios 5, 6 and 22 print nothing at HEAD (each `git grep -n -F` exits 1). Executed. The broad gate's own comparison is the orchestrator's.

What matched: the fold of P6, P7 and P10 in `frame/design.md` stands word for word in both editions. *Scope* item 10, *Data & interfaces* "The root" and "The files", and `frame/plan.md:93` say what `planRecords` does, apart from finding 1's sentence on what a kept file is. Scenarios 12 and 13 have their cases (`apps/desktop/test/records-place.test.ts:209`, `:366` and `:377`), which passed, and the fix's refusals come before the arms they hold without changing those arms' sentences. The rows of `frame/plan.md` *Phases* name the phases' commits and are not contradicted by the fixes, which the round records carry. Executed for the runs, read for the rest.

What matched: `changelog.md` and `pr.md` against the code. Every list item of `changelog.md` was read against `records-place.ts` and the cases. Each holds, except that `changelog.md:7` and `:10` owe the changes of findings 1 and 2. The quotes of `pr.md` stand word for word: "Set up and commit" at `apps/desktop/src/renderer/index.html:771`, "Records and check…" at `apps/desktop/src/renderer/view.ts:1176`, and the dialog's first sentences at `view.ts:1253`. `pr.md:8`, corrected at `72b043d`, says what `changelog.md:7` says. Read, with a `git grep -n -F` for each quote, executed.

What matched: each new case was read against its group. The six new cases of `records-place.test.ts` each hold one refusal or one choice of `planRecords` that no earlier case holds. The two cases changed or added in `decision-record.test.ts` hold the carriage return search and the unreadable record. No case covers only what another covers. Their seen-red claims and `85b6c50`'s mutation runs were read, not re-run.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the typecheck at HEAD, the eleven built-app files not run here, and the broad gate's comparison of the editions, labelled `unverified` | `seal/threads/1795338001-records-place-and-pr-check/gaps.md:7` | The orchestrator's broad run, after the rounds |
| The words a person sees where `writeRecord` throws Node's error on a record it cannot read: the message names the record's absolute path, while phase 3 says each throw of the writer is a sentence a person can read | `apps/desktop/src/daemon/decision-record.ts:373-379`, `seal/threads/1795338001-records-place-and-pr-check/trail/phases/phase-3.md:136` | #119, which shows a writer's throw as the request's `error` |
| `python3` on `macos-latest` after `setup-python`, and the workflow as GitHub runs it (Q3, Q4), carried from round 1 | `seal/threads/1795338001-records-place-and-pr-check/gaps.md:8-9` | The first run of `check` on this pull request, and #43 |
| Whether a pull request can pass `seal` by editing its own `owlery-seal.yml`, and whether the workflow should pin a commit rather than a tag, carried from round 1 | `apps/desktop/src/daemon/records-place.ts:57-97` | #43, and the orchestrator |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 TMPDIR=<scratch>/tmp node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts` in the clone's `apps/desktop`, run once, output written to a file in the scratch directory | R: plan `blocked: null`, writes `agentic-seal/README.md` and `agentic-seal/config.json`, keeps `hygiene.yml`; the setup committed; HEAD holds `seal/README.md` and `agentic-seal/README.md`, each opening with the marker; `rootOf` gave `agentic-seal`. S, no cone: the same plan and commit, `rootOf` gave `agentic-seal`. S, cone of `.github`: the same plan; the setup threw git's message on paths outside the sparse-checkout definition; the status was clean and HEAD unchanged. M, root: plan `blocked: null`, `seal/README.md` kept; the setup committed; HEAD's `seal/README.md` opens with `# Our seal package`; status ` M seal/README.md`; `readRecordsPlace` gave `root: "seal"`. M, check: all three kept, `blocked: null`; the committed `hygiene.yml` holds no `chain_check.py`. E: an empty repository planned three files, `blocked: null`, and the setup made the first commit with those three; one with a staged root and no commit was blocked naming `seal/README.md`. U: a submodule at `seal` blocked naming both root files. D: a detached head with every part committed gave `blocked: null`; with `config.json` to write it gave the sentence on no branch |
| `OWLERY_BACKGROUND=1 TMPDIR=<scratch>/tmp node scripts/test-in-electron.mjs test/test_tmp_round1_again.test.ts`, round 1's cases A, B, C, K and D written again, run once | As *What matched* and the first confirmation give them: each blocked with its sentence, the index and HEAD unchanged, and D threw `EACCES` with the file kept |
| `OWLERY_BACKGROUND=1 TMPDIR=<scratch>/tmp node scripts/test-in-electron.mjs test/records-place.test.ts test/decision-record.test.ts test/record-blocks.test.ts test/pr-check.test.ts` | 4 files, 91 cases passed |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/records-dialog.test.ts`, alone, with the system's temporary folder | 1 file, 1 case passed |
| `grep -c '^#'` and `grep -c '^\|'` over both editions at HEAD and at `cbb2e69` | 27 and 121 for each edition at HEAD; 27 and 122 at `cbb2e69` |
