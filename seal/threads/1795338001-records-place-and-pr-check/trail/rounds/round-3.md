# Review round 3: 1795338001-records-place-and-pr-check

```seal
target: f9f1ede, fixes 0997ffd..f9f1ede
```

This is a verifying round. The range `0997ffd..f9f1ede` holds the fix `2a5e9c8`, its cases at `829fb57`, the closes at `c9594fe`, the orchestrator's rewrite of P6 and `pr.md` at `6413124`, the frame fold at `09a8f96` and the close of finding 4 at `f9f1ede`. The work item's `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `f9f1ede`, then `trail/phases/` and `trail/rounds/round-1.md` and `round-2.md`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. Every run went in a `git clone --no-local` of the worktree at `f9f1ede` under the round's scratch directory, and nothing was written into the worktree but this record.

Facts carried from round 2 and not re-established, because the range changes no file they stand on (`git diff --stat 0997ffd f9f1ede` names no file under `pr-check/`, `.github/` or `apps/desktop/src/daemon/record-blocks.ts`, and no `decision-record` file, executed): the byte equality of `pr-check/` with AgenticSeal 0.38.4, the agreement of the two readers of a `seal` block, the written workflow's permissions and its fallback clone, and round 2's confirmations of round 1's findings 2 to 5.

The fix restates `planRecords` as one rule (`apps/desktop/src/daemon/records-place.ts:256-350`): the plan is made from the commit the checkout stands at, and the checkout must hold the place as the commit does. Each refusal arm was read against the five conditions `frame/design.md:64` lists, in the same order. The rule holds for every shape rounds 1 and 2 found (probes R, S, M, E, U and D again, below). It leaves four cases over, findings 1 to 4. Two come from the comparison's narrowings. The compared paths include the `README.md` of each root name and both workflows by their bytes, which is more than the plan reads (finding 4). They leave out the folder where the records go (finding 2). The comparison also takes `git status` as its whole reading of a tracked path, and status is told not to look at some paths (finding 1). The folder arm is kept apart from the comparison because the folder is no path of the place the commit decides on. The setup writes into the checkout and the index, so a file or a link there blocks the folder whatever the commit holds. That separation is sound. On a disk that folds the case of letters, the folder arm does not see a folder named with other letters (finding 3).

## Findings

### 1. A kept file whose checkout text git is told not to compare passes the comparison, so the plan keeps a config.json the commit does not hold

```seal
severity: should
location: `apps/desktop/src/daemon/records-place.ts:324-329`, `apps/desktop/test/records-place.test.ts`
evidence: executed probe `test/test_tmp_round3.test.ts` case W in the round's clone (see Probes); read `apps/desktop/src/daemon/records-place.ts:326-329`
reopens: round-2#1
```

Why it matters: round 2's finding 1 was that the plan keeps a root or a check whose checkout text differs from the commit's. Its third instance was a kept `config.json`. The fix asks `git status` over the paths of the place and takes a path as differing where status prints it (`records-place.ts:326-329`). Status prints no change of a path whose index entry carries the skip-worktree or the assume-unchanged flag. A person sets either flag with `git update-index`, and a tool may set one to keep a local edit out of commits.

- Probe W, both flags: the commit holds `seal/config.json` as `{ "Broad gate": "make check" }`, with no language keys. The checkout holds the two language keys and `"Broad gate": "make all"`. The plan kept all three files and was not blocked, so the dialog shows a repository that holds every part. `readRecordsPlace` answered `broadGate: "make all"`. On GitHub the check reads the commit's `config.json`, which names no language, and refuses every declared work item's pull request on that key (`frame/design.md` *Grounding*, the fact on the language keys).

The claim of `gaps.md` and `changelog.md:10` is that the comparison covers a file "changed". Here the file is changed and the plan is not blocked. The class was listed from what produces it, the cases where status reports no difference although the checkout's bytes differ from the commit's. Those are the two index flags, and a clean filter that maps two texts to one. A clean filter makes the bytes the commit stores equal, so the daemon's reading of `config.json` as JSON gives the same keys. That case is no defect. The two flags are read exactly by `git ls-files -v`, which tags an entry `H` where git compares it and gives another tag where it does not. A sparse checkout's files carry `S` too, and the comparison blocks those already. A case belongs in `apps/desktop/test/records-place.test.ts`, beside "judges the root and the check by what the commit holds".

```ts
// records-place.ts, in planRecords after `reported`. `ls-files -v` tags each
// index entry: `H` for one git compares with the working tree, `S` for
// skip-worktree, and a small letter for assume-unchanged. Precondition: none
// beyond the folder being the top of the work tree, which `place` assumes.
  const tags = await git(folder, ["ls-files", "-v", "-z", "--", ...place]);
  if (tags.code !== 0) throw new Error(tags.stderr.trim() || "git could not say which paths of the records place it compares");
  // A path git is told not to compare: status reports no change of it, whatever the checkout holds.
  const unwatched = tags.stdout.split("\0").filter((entry) => entry !== "" && !entry.startsWith("H ")).map((entry) => entry.slice(2));
  const differing = [...place.filter((path) => reported.includes(path) || unwatched.includes(path) || holdsFile(path) !== shows(folder, path)), ...reported.filter((path) => !place.includes(path))];
```

### 2. An ignore rule over the root's threads/ is not asked, so the setup commits a root in which no work item's records can be committed

```seal
severity: should
location: `apps/desktop/src/daemon/records-place.ts:334-340`, `apps/desktop/test/records-place.test.ts`, `docs/architecture.md:206`, `docs/architecture.ko.md:206`, `seal/threads/1795338001-records-place-and-pr-check/changelog.md:9`
evidence: executed probe `test/test_tmp_round3.test.ts` case I in the round's clone (see Probes); read `apps/desktop/src/daemon/records-place.ts:335`, `apps/desktop/src/daemon/records-place.ts:35`
```

Why it matters: P7 says "It refuses the setup where git ignores a path of the place, whether the setup would write it or it stands in the checkout" (`docs/architecture.md:206`). The README the setup writes says that `threads/<work-item-id>/` holds each work item's records (`records-place.ts:35`). So `threads/` is part of the place. `planRecords` asks `git check-ignore` of the plan's three files alone (`records-place.ts:335`).

- Probe I, a new root: the commit holds a `.gitignore` with `seal/threads/`. The plan wrote three files and was not blocked. The setup committed them. `git check-ignore seal/threads/1-x/routing.md` then answered ignored, and `git add` of that file failed with git's words on ignored paths. Every record a stage writes there is refused by git, so every seal of that repository stands on records no commit holds.
- Probe I, a kept root: the same rule committed beside an AgenticSeal root. The plan showed a repository that holds every part, and the records folder is ignored the same way.

This unit was built in phase 2. Neither fix pass changed which paths are asked, so the finding carries no `regression:` line. The patterns a `.gitignore` can hold are unbounded, so no list of probe paths is whole. The snippet asks the folder and one path for each record file the forms write, which catches a rule on the folder, on a record's name and on a pattern such as `*.md`. A rule that names a work item's id, such as `1795*`, stays outside that sample. The fix pass names that limit in `gaps.md` *Not done*. `changelog.md:9` then holds, and P7 needs no change.

```ts
// records-place.ts. The names are those of the records a work item's
// directory holds (`frame/design.md` *Scope* 13, the forms the stages write).
// `check-ignore` answers for a path that does not stand, and it reports a
// path below a tracked root that is still untracked, which is what a record is.
const RECORDS = ["routing.md", "frame/design.md", "frame/plan.md", "frame/questions.md", "gaps.md", "changelog.md", "pr.md", "decisions.md", "trail/phases/phase-1.md", "trail/rounds/round-1.md", "trail/gate.md", "guarantee.md"] as const;

// In planRecords, in place of the line that asks `ignoredAmong`:
  // Where the records go is a path of the place too: a rule over it leaves the root unable to keep a work item's records, though its own two files are not ignored.
  const records = root === null ? [] : [`${root}/threads/`, ...RECORDS.map((name) => `${root}/threads/0-work-item/${name}`)];
  const ignored = await ignoredAmong(folder, [...files.map((file) => file.path), ...records]).catch(() => []);
```

### 3. On a disk that folds case, a committed folder named with other letters makes the plan offer a commit that fails at git commit

```seal
severity: should
location: `apps/desktop/src/daemon/records-place.ts:314`, `apps/desktop/src/daemon/records-place.ts:330-333`, `apps/desktop/test/records-place.test.ts`
evidence: executed probe `test/test_tmp_round3.test.ts` case C in the round's clone, on a disk where `Probe.txt` is found as `probe.txt` and `core.ignorecase` is `true` (see Probes); read `apps/desktop/src/daemon/records-place.ts:314`, `git show 0997ffd:apps/desktop/src/daemon/records-place.ts` at the root's choice
regression: round-2#2
```

Why it matters: the unit is the choice of a new root's name (`records-place.ts:314`), which `2a5e9c8` made a reading of the commit alone. `frame/design.md:160` says that a new root is the first of the two names at or under which the commit holds nothing, and the fix built that. The code at `0997ffd` also took a name as taken where something stood at it on disk (`!stands(folder, name)`), and on this disk `lstat` finds `Seal` for `seal`. The fix dropped that reading with the rest of the disk's. So the defect comes from the rule restated without the disk. Git's paths tell `Seal` from `seal`, and a Mac's default disk does not.

- Probe C, the root: the commit holds `Seal/notes.txt`. The plan wrote `seal/README.md`, `seal/config.json` and the workflow, and was not blocked, so the dialog offers "Set up and commit". The setup wrote both files into `Seal/` on disk, then failed with git's "pathspec 'seal/README.md' did not match any file(s) known to git". Its cleanup left the status clean and HEAD unchanged. The person reads git's words and nothing about the folder's name.
- Probe C, the workflow: the commit holds `.GitHub/workflows/ci.yml`. The plan and the failure are the same, at `.github/workflows/owlery-seal.yml`. This instance does not come from the fix: the folder arm at `0997ffd` read the disk the same way.

`shows` (`records-place.ts:236-254`) already tells a name from the same name with other letters. The folder arm can use it. A case belongs in `apps/desktop/test/records-place.test.ts`, run where the disk folds case. Where it does not fold, `stands` finds no `seal` beside `Seal`, the arm does not block, and the setup commits `seal/` beside `Seal/`. A clone on a Mac then folds the two into one folder. Whether to refuse that too is the fix pass's to say.

```ts
// records-place.ts, in planRecords, beside `notFolders`. Precondition: on a
// disk that folds case, `stands` finds a folder under other letters and
// `shows` does not; on a disk that does not fold, both are false and nothing
// is named.
  const otherLetters = [...above].filter((at) => stands(folder, at) && !shows(folder, at));

// And in the chain of `blocked`, right after the arm on `notFolders`:
  } else if (otherLetters.length > 0) {
    blocked = `The setup needs a folder at ${named(otherLetters)}, and this disk finds a folder of the repository there under the same name in other letters, which git and GitHub take for another folder. Rename that folder in a commit, and open this again.`;
```

### 4. The comparison refuses where the checkout holds what the plan reads as the commit does, and gaps.md says the plan cannot tell

```seal
severity: should
location: `apps/desktop/src/daemon/records-place.ts:324-329`, `apps/desktop/src/daemon/records-place.ts:343-344`, `apps/desktop/test/records-place.test.ts`, `seal/threads/1795338001-records-place-and-pr-check/gaps.md:21`
evidence: executed probe `test/test_tmp_round3.test.ts` cases O and L in the round's clone (see Probes); read `apps/desktop/src/daemon/records-place.ts:119-127`, `apps/desktop/src/daemon/records-place.ts:129-138`, `seal/threads/1795338001-records-place-and-pr-check/gaps.md:21`
regression: round-2#1
```

Why it matters: the unit is the comparison of the checkout with the commit, which `2a5e9c8` added to close round 2's finding 1. The frame says the checkout has to hold the place as the commit does, "since the setup writes into the checkout and the daemon reads the place from it" (`frame/design.md:62`). The fix compares the bytes of every path in `place`, which includes the `README.md` of a root name the plan neither keeps nor writes, and a `hygiene.yml` it does not keep (`records-place.ts:325`). The daemon reads one thing of each of those: whether the `README.md` opens with the marker, and whether the `hygiene.yml` runs the check (`rootOf` and `checkOf`, `records-place.ts:129-138`).

- Probe O: the commit holds the project's own `seal/README.md`, `# Our seal package`. The checkout adds a line to it and keeps no marker. The plan was blocked, naming `seal/README.md`, and its advice says "Commit what is named or put it back as the commit has it". The person is told to commit or throw away an edit of their own that does not touch the place.
- Probe L: the commit holds a link at `.github/workflows/owlery-seal.yml`, and the checkout holds the same link (status prints nothing). The plan was blocked with "This checkout does not hold .github/workflows/owlery-seal.yml as the commit it stands at does". That sentence is false: the checkout holds what the commit holds. The comparison sets `holdsFile`, a file in the commit, against `shows`, anything in the checkout. The plan has to refuse there, since the setup would write a file where a link stands. It owes a sentence that says so.

`gaps.md:21` names both results and says the first stays "because the plan cannot tell such an edit from a marker or a check step". Claimed X: the plan cannot tell. `records-place.ts:119-127` tells: `opensWithMarker` and `runsPluginCheck` take any text, and `rootOf` and `checkOf` already apply them to the checkout. The class was listed by taking `place` apart. The plan's own files are kept or written, and the daemon reads their bytes (`config.json`) or writes them, so bytes are the right comparison there. Owlery's workflow is read by presence, which `shows` gives. The other root name's `README.md` and an unkept `hygiene.yml` are read by one predicate each. The snippet covers the two reading paths and the link. The fix pass also owes the rewrite of `gaps.md:21`, whose first and second results then no longer stand, and cases for probes O and L in `apps/desktop/test/records-place.test.ts`.

```ts
// records-place.ts, in planRecords. `read` is what the daemon reads of a path
// the plan neither keeps nor writes. The index text is the staged one
// (`:<path>`), since a person's commit takes it next. Precondition: a link in
// the checkout is followed, as `rootOf` and `checkOf` follow it.
  const planned = new Set(files.map((file) => file.path));
  const readOnly = [...readmes, PLUGIN_WORKFLOW].filter((path) => !planned.has(path));
  const read = (path: string): ((text: string | null) => boolean) => (path === PLUGIN_WORKFLOW ? runsPluginCheck : opensWithMarker);
  const staged = async (path: string): Promise<string | null> => (FILE_MODES.includes(inIndex.get(path) ?? "") ? (await git(folder, ["cat-file", "blob", `:${path}`])).stdout : null);
  const readsOtherwise: string[] = [];
  for (const path of readOnly) {
    const atCommit = read(path)(await committed(path));
    if (read(path)(textOf(join(folder, path))) !== atCommit || read(path)(await staged(path)) !== atCommit) readsOtherwise.push(path);
  }
  // The bytes are compared at the plan's own files and Owlery's workflow alone.
  const place = [...new Set([...planned, WORKFLOW])];
  // ... `status`, `reported` and `differing` as they stand, over this `place`, then:
  const differs = [...differing, ...readsOtherwise];

  // A path the plan writes at which the commit holds a link, a submodule or a folder: the checkout may hold it as the commit does, and the setup still has no place for its file.
  const occupied = written.filter((path) => inCommit.has(path) || [...inCommit.keys()].some((held) => held.startsWith(`${path}/`)));

// In the chain of `blocked`, before the arm on the differing paths:
  } else if (occupied.length > 0) {
    blocked = `The commit this checkout stands at holds something other than a file at ${named(occupied)}, where the setup writes one. Rename it in a commit, and open this again.`;
```

## Confirmations

```seal
confirms: round-2#2
```
What holds: the root is told from the commit's `README.md` (`apps/desktop/src/daemon/records-place.ts:309-314`), so a committed AgenticSeal root that the checkout does not show is the kept root and no second root is planned. Probe R (the root removed and not staged), probe S with no cone, and probe S with a cone of `.github` were each written again and run at `f9f1ede`. Each plan kept `seal/README.md`, `seal/config.json` and `hygiene.yml`, planned nothing under `agentic-seal/`, and was blocked naming both root files. The setup threw the same sentence, and HEAD held no `agentic-seal/` path. Executed. The case "keeps a root the commit holds and the checkout does not show" passed in the narrow run. Its seen-red claims at `0997ffd` and its two `seal mutate` runs were read, not re-run.

```seal
confirms: round-2#3
```
What holds: `frame/design.md:64` lists the five refusals in the order `records-place.ts:337-347` tests them. `frame/design.md:411` says a plan with nothing to write is blocked by the first and the fourth alone. That holds: such a plan keeps only committed files, which `check-ignore` does not report, and it writes no path, so no folder is asked. The docstring of `recordsDialog` (`apps/desktop/src/renderer/view.ts:1245-1250`) names the same two arms. Read.

```seal
confirms: round-2#4
```
What holds: P11's two lines (`frame/design.md:401`, `:403`) stand whole in `docs/architecture.md:191` and `docs/architecture.ko.md:191`. Executed: `grep -qF` of each line over both editions.

Round 2's finding 1 is named by finding 1's `reopens:` line and finding 4's `regression:` line, so no confirmation names it. Its three instances are each refused at `f9f1ede`. Probe M blocked the marker written in the checkout alone, and the setup threw with HEAD's `seal/README.md` unchanged. Probe M's `hygiene.yml` blocked, naming the file. The case at `apps/desktop/test/records-place.test.ts` for a `config.json` edited in the checkout or in the index passed. Executed.

What matched: round 2's probes E, U and D were written again and run at `f9f1ede`. E: an empty repository planned three files, was not blocked, and the setup made the first commit holding those three; an empty repository with a staged root was blocked, naming `seal/README.md`. U: a submodule at `seal` gave a plan at `agentic-seal/`, blocked, naming `seal/README.md`. D: a detached head with every part committed was not blocked; with `config.json` to write it gave the sentence on no branch. Executed.

What matched: the rewrite of P6 at `6413124`. `frame/design.md:359` and `:362` stand whole in `docs/architecture.md:203` and `docs/architecture.ko.md:203`, and so do P7's two sentences (`frame/design.md:367`, `:369`). Each edition counts 27 heading lines and 121 table lines, as at `0997ffd`. Executed. `pr.md:8` says what P6 says. Its quotes "Set up and commit" (`apps/desktop/src/renderer/index.html:771`), "Records and check…" (`apps/desktop/src/renderer/view.ts:1176`) and the dialog's first sentences (`view.ts:1254`) stand word for word. Executed with `git grep -n -F`. Every list item of `changelog.md` was read against `records-place.ts`. Each holds, except `changelog.md:10`, whose "changed" finding 1 contradicts, and `changelog.md:9`, whose "a path of the place" finding 2 contradicts. The rest is read.

What matched: `protocol.ts:83` now says a kept file is one the commit holds, which `records-place.ts:318-321` does. Read. The rows of `gaps.md` *Not done* that the fix pass wrote were each read against the code. The row on a checkout that moves before the commit holds. The row on the repository's row reading the working folder holds, as *Scope* item 7 says. The row on a sparse checkout that leaves out a root the setup would create holds, and the setup's cleanup leaves nothing. The row at `gaps.md:21` is finding 4. Read.

What matched: each new case was read against its group in `apps/desktop/test/records-place.test.ts`. "judges the root and the check by what the commit holds" holds the commit's marker, the commit's check step, and a `config.json` that differs in the checkout or the index alone. "keeps a root the commit holds and the checkout does not show" holds the kept root and the comparison's second half, `holdsFile` against `shows`. The assertions `829fb57` added hold the first of two committed roots, `shows`'s exact letters (`seal/readme.md`), and a file below a new root that is untracked, ignored or staged. No case covers only what another covers. The cases rewritten from `unheld` and `known` to `differs` hold the same shapes under the one sentence. Read, and the module passed in the narrow run.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the eleven built-app files not run here, and the broad gate's comparison of the editions, labelled `unverified` | `seal/threads/1795338001-records-place-and-pr-check/gaps.md:7` | The orchestrator's broad run, after the rounds |
| The spawn asked this round to run `pnpm run typecheck` in `apps/desktop`. Contract rule 2 gives the typecheck to the broad gate, and rule 3 says a spawn cannot widen the scope. It was run before the conflict was weighed, and it exited 0 at `f9f1ede` (executed). It stands as a read for the fix pass and does not stand for the broad gate | `apps/desktop/package.json:12` | The orchestrator's broad run, which runs the typecheck as its own act |
| `python3` on `macos-latest` after `setup-python`, and the workflow as GitHub runs it (Q3, Q4), carried from round 2 | `seal/threads/1795338001-records-place-and-pr-check/gaps.md:8-9` | The first run of `check` on this pull request, and #43 |
| Whether a pull request can pass `seal` by editing its own `owlery-seal.yml`, and whether the workflow should pin a commit rather than a tag, carried from round 1 | `apps/desktop/src/daemon/records-place.ts:53-98` | #43, and the orchestrator |
| The words a person sees where `writeRecord` throws Node's error on a record it cannot read, carried from round 2 | `apps/desktop/src/daemon/decision-record.ts:373-379` | #119 |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 TMPDIR=<scratch>/tmp node scripts/test-in-electron.mjs test/test_tmp_round3.test.ts` in the clone's `apps/desktop`, run once, output written to `probe3.json` in the scratch directory | R, S, S with a cone: each blocked naming `seal/README.md` and `seal/config.json`, the three kept files listed, the setup threw, HEAD without `agentic-seal/`. M: blocked naming `seal/README.md`, HEAD's file still `# Our seal package`; M's `hygiene.yml` blocked naming it. E: three files, `blocked: null`, the first commit holding them; the staged root blocked. U: `agentic-seal/` planned, blocked naming `seal/README.md`. D: `blocked: null` with every part, the no-branch sentence with `config.json` to write. I: `blocked: null`, the setup committed, `check-ignore seal/threads/1-x/routing.md` ignored, `git add` refused; the kept root also `blocked: null` with its threads ignored. W, skip-worktree and assume-unchanged: `blocked: null`, three files kept, `readRecordsPlace` gave `broadGate: "make all"`, HEAD's `config.json` `{ "Broad gate": "make check" }`. C: the disk folds case and `core.ignorecase` is `true`; `Seal/notes.txt` gave three files to write, `blocked: null`, the setup threw "pathspec 'seal/README.md' did not match any file(s) known to git", status clean, HEAD unchanged; `.GitHub/workflows/ci.yml` the same at the workflow's path. O: blocked naming `seal/README.md`. L: status empty, blocked naming `.github/workflows/owlery-seal.yml` |
| `OWLERY_BACKGROUND=1 TMPDIR=<scratch>/tmp node scripts/test-in-electron.mjs test/records-place.test.ts test/view.test.ts` | 2 files, 413 cases passed |
| `grep -n -i -E 'skip-worktree\|assume-unchanged\|threads\|ignorecase\|Seal/\|\.GitHub' test/records-place.test.ts` | Hits only in the README's text and the root's paths: no case holds findings 1 to 3. A probe of absence, not a seal |
| `pnpm run typecheck` in the clone's `apps/desktop` | Exit 0 (see *Not judged*) |
| `grep -c '^#'` and `grep -c '^\|'` over both editions at `f9f1ede` | 27 and 121 for each edition |
