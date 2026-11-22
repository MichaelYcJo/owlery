# Review round 5: 1795339001-worktree-setup

```seal
target: 0639627, fixes e632893..0639627
```

This is a verifying round. Its code is the diff `e632893..0639627`. That diff holds the fix commits `8f6eb4e`, `e9354ed`, `74e6ffe` and `4630d68` in `apps/desktop/src/daemon/worktree-setup.ts`, `apps/desktop/src/shared/protocol.ts` and `apps/desktop/test/worktree-setup.test.ts`, with `changelog.md` and `gaps.md`. It also holds the fix pass's closes (`8165ade`), the pull request text (`20097b4`) and the frame's fold (`0639627`). The merge base with `origin/release/v0.0.2` is still `a3e4e7a`. `origin/release/v0.0.2` now stands at `cc0b938`, the merge of #142, which is #40's work. A trial `git merge-tree --write-tree --name-only HEAD origin/release/v0.0.2` exited 1, with conflicts in `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/test/daemon.test.ts` and `apps/desktop/test/view.test.ts`. The fix diff touches none of those three files. Both sections that this work's *Rule changes* add to still stand at `cc0b938`, at line 186 of `docs/architecture.md` and of `docs/architecture.ko.md`. No `seal/parity.json` and no `Pact` key stand.

The records read whole at `0639627` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. After them came `trail/phases/` and `trail/rounds/round-1.md` to `round-4.md`, read for their coordinates. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. The diff of `gaps.md` since `e632893` adds row 19 and the paragraph at *Not done* line 29, and removes no line. So no row or memo left it.

Carried from rounds 1 to 4, not established again: the matcher's semantics, the overlap with #119, the volumes' behaviour on the HFS+ and ExFAT images, and the result of round 3's probe of a left `cp` that still writes. Round 4 confirmed that probe against `0eba42e`. The fix diff keeps the order of the two removals in `removeStaging`, and `removeCopy` passes an `ENOTEMPTY` through, so the reason the close held still holds (read). Established again this round: the close of round 4's finding 1 and of its finding 2, by round 4's probe written again against `0639627`, and the fix pass's red claims, by running the module against the two earlier sources of `worktree-setup.ts`. The new units `writable`, `removeCopy` and `stagingStayed`, and the new `catch` of `copyPath`, were reviewed as code.

The axes of this round, beyond the table's: what `writable` reaches through a link, which removals of a copy pass through `removeCopy`, what a refusal that no change of mode repairs leaves, and what each record says of a staging folder that stays.

## Findings

### 1. The `EPERM` half of `removeCopy`'s retry is held by no case: deleting it leaves the suite green

```seal
severity: should
location: `apps/desktop/src/daemon/worktree-setup.ts:166`, `apps/desktop/test/worktree-setup.test.ts`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/worktree-setup.test.ts` in `apps/desktop` of the round's scratch clone at `0639627` with `&& error.code !== "EPERM"` deleted from line 166, and `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round5.test.ts -t "EPERM branch" --silent=false --reporter=verbose` against that mutant and against `0639627`; read `seal/threads/1795339001-worktree-setup/frame/design.md:107`, `seal/threads/1795339001-worktree-setup/trail/rounds/round-4.md`, its close of finding 2
regression: round-4#2
```

This finding is carried to a follow-up issue. `frame/plan.md` *Judgments of the run*, the row on round 4, says that from round 5 a `should` case of the copy's cleanup that neither loses a person's file nor writes or removes outside the worktree is recorded and carried. This one does neither.

Why it matters: the unit is `removeCopy` (`worktree-setup.ts:164-170`), which `e9354ed` added for round 4's finding 2. The frame's `copyIncluded` paragraph (`frame/design.md` line 107) says that "where `rm` fails with `EACCES` or `EPERM`, `removeCopy` gives the copy's folders their owner's read, write and search bits". The fix wrote that condition as round 4's paste-ready gave it. So the defect came from that paste-ready, which named `EPERM` and asked for no case that reaches it.

The fix pass's close says that one `seal mutate` break survived, the deletion of `&& error.code !== "EPERM"`. It kept the branch on the grounds that "a network volume may answer a refusal of permissions with `EPERM`". This round confirms the survival. With that deletion the module gave 24 passed. On APFS a read-only folder refuses an unlink with `EACCES`, so no case reaches the branch. The case "names in a failed path's error the staging folder it could not remove" uses an `EPERM` that no change of mode repairs, so it ends the same way with or without the branch.

A case can reach the branch. The probe wrapped the system's `rm` so that each `EACCES` it raised came back as `EPERM`, as such a volume would answer. It then copied a `node_modules/` that held a folder of mode 0555 and a file of mode 0000. At `0639627` the copy failed with `EACCES` on the unreadable file and no staging folder stayed. With the deletion, the staging folder `.owlery-copy-sXXPZz` stayed, and the path's why named it. So the branch does what the frame says, and the suite does not hold it. What stays unverified is whether any volume answers a read-only folder with `EPERM`, which the fix pass's grounds claim.

The case below goes beside the case "leaves nothing of a path it could not copy". It is the probe's case in the suite's helpers, and this round did not run it in this form. It is red against the deletion, as the probe shows. Where the fix pass, or the follow-up, judges the premise too thin to keep, the other close is to delete `&& error.code !== "EPERM"` and to drop "or `EPERM`" from `frame/design.md` line 107. The fix pass's close of round 4's finding 2 also names the branch, and that close stays as written.

```ts
  it("gives a failed copy's folders their owner's write bit and removes it where the volume refuses the removal with EPERM", async () => {
    const { repo, worktree, base } = repositoryWithIgnoredFiles();
    const { rm: removed } = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    cleanups.push(() => vi.mocked(rm).mockImplementation(removed));
    removableAfter(base);
    // A source whose copy fails on a file it cannot read, beside a folder it keeps read-only.
    mkdirSync(join(repo, "node_modules", "pkg", "kept"));
    writeFileSync(join(repo, "node_modules", "pkg", "kept", "index.js"), "kept\n");
    chmodSync(join(repo, "node_modules", "pkg", "kept"), 0o555);
    writeFileSync(join(repo, "node_modules", "pkg", "secret.js"), "secret\n");
    chmodSync(join(repo, "node_modules", "pkg", "secret.js"), 0o000);
    writeFileSync(join(repo, ".worktreeinclude"), "node_modules/\n");
    // The system's rm, with each refusal for permissions answered as EPERM, as a volume may answer it.
    vi.mocked(rm).mockImplementation(async (path, options) =>
      removed(path, options).catch((error: NodeJS.ErrnoException) => {
        throw error.code === "EACCES" ? Object.assign(new Error(error.message), { code: "EPERM" }) : error;
      }),
    );
    const copy = await copyIncluded(repo, worktree);
    expect(copy.failed).toEqual([{ path: "node_modules/", why: expect.not.stringContaining("staging folder") }]);
    expect(readdirSync(worktree).filter((name) => name.startsWith(".owlery-copy-"))).toEqual([]);
  });
```

```seal
verdict: deferred #144
answer: the case the round gives, or the branch's removal, is carried to #144 in `release: 0.0.3`, by `frame/plan.md` *Judgments of the run* (rounds 1–4 row): it loses no person's file and touches nothing outside the worktree.
```

### 2. A file that the system flag `uchg` holds leaves one more staging folder at each run again of its failed path, and one after a copy that succeeded, which nothing names

```seal
severity: should
location: `apps/desktop/src/daemon/worktree-setup.ts:240-248`, `seal/threads/1795339001-worktree-setup/gaps.md:29`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round5.test.ts --silent=false --reporter=verbose` in `apps/desktop` of the round's scratch clone at `0639627`, its case "gaps.md row 19"; read `seal/threads/1795339001-worktree-setup/gaps.md:29`, `seal/threads/1795339001-worktree-setup/frame/design.md:107`, `seal/threads/1795339001-worktree-setup/changelog.md:6`
```

This finding is carried to a follow-up issue, by the same row of `frame/plan.md` *Judgments of the run* as finding 1. It loses no file of a person's and writes or removes nothing outside the worktree.

This finding is new work in `copyPath`, which round 1's fix made, so it takes no `regression:` line. Before `e9354ed`, the one `finally` dropped every error of the removal, so a flagged file left a folder there too (read). What the fix pass added is that a failed path's why now names its folder. The two limits below are what no record says.

Why it matters: `gaps.md` *Not done* line 29 says that where the removal "is refused again, as for a file a system flag holds, the folder stays with its `.gitignore`, the path's why names it, and a later copy that lists a path in that folder tries again". The probe ran that path for real. Its main checkout held `node_modules/pkg/flagged.js` under `chflags uchg` beside an unreadable `secret.js`, and `.env.flag` under `uchg` alone. `cp -c` gives the clone the source's flags, so each copy held an immutable file.

- `node_modules/` failed with `EPERM: operation not permitted, unlink '…/.owlery-copy-8j72EH/copy/node_modules/pkg/flagged.js'`, followed by "; its staging folder .owlery-copy-8j72EH stayed beside it, which git ignores". That holds line 29.
- A copy again failed the same way and named a new folder, `.owlery-copy-Srrepe`. It left the first one, whose removal it tried and dropped. So each "Run setup again" of such a path adds one staging folder that holds a partial copy, as round 4's finding 2 found for a read-only folder. Line 29 does not say that.
- `.env.flag` was copied. `link` refused the immutable file, so `copyFile` made the worktree's `.env.flag` without the flag. The staging folder `.owlery-copy-5CiyVU` stayed holding `copy/.env.flag`. The success path at line 248 drops that error, so no record of the setup names the folder. `frame/design.md` line 107 says that "the staging folder is removed in every case", and that where it cannot be, "the error of a path that failed names it". It says nothing of a path that was copied.

`git status --porcelain --untracked-files=all` printed nothing after either copy. The case is narrow: an ignored file under `uchg` in a main checkout. What the release ships without a fix is a hidden folder per run again, and one hidden folder per copied flagged file. Each holds a clone, which costs little disk on APFS.

The record of the carry is a rewrite of the paragraph at `gaps.md` line 29, with the follow-up's number in place of the marked name. `frame/design.md` line 107 gains the same limit in finding 3's snippet.

```markdown
Where the removal of a failed copy's staging folder is refused for permissions, the copy's folders get their owner's write bit and the removal runs again. Where it is refused again, as for a file that the system flag `uchg` holds, the folder stays with its `.gitignore` and the path's why names it. A later copy that lists a path in that folder tries again and drops the error. Where the path fails again, its own staging folder stays too, so each "Run setup again" of that path adds one. A copy that succeeded, whose staging folder holds such a file, leaves that folder as well, and no record names it. Git lists none of them. Carried to FOLLOW_UP_ISSUE.
```

```seal
verdict: deferred #144
answer: a file flagged `uchg` leaving a staging folder per press is carried to #144 in `release: 0.0.3`, by the same row; `gaps.md:29` is rewritten as the round gives it in the commit that merges the base.
```

### 3. The frame's fold of round 4 sends the staging folder's own removal through `removeCopy`, and gives a read-only source folder as a case where the staging folder stays

```seal
severity: should
location: `seal/threads/1795339001-worktree-setup/frame/design.md:57`, `seal/threads/1795339001-worktree-setup/frame/design.md:107`
evidence: read `seal/threads/1795339001-worktree-setup/frame/design.md:57`, `seal/threads/1795339001-worktree-setup/frame/design.md:107`, `apps/desktop/src/daemon/worktree-setup.ts:164-186`; executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round5.test.ts --silent=false --reporter=verbose` in `apps/desktop` of the round's scratch clone at `0639627`, its case "a failed copy whose stage holds a folder the daemon cannot write in"
regression: round-4#2
```

Why it matters: the unit is *Scope* item 2 and the `copyIncluded` paragraph of *Data & interfaces*, which the fold `0639627` rewrote for round 4's finding 2. The frame states what the code does, and the sealer reads the code against it. The fold set the code's two removals and its one exception in sentences, and two of those sentences say something else.

- Line 107 says that `removeStaging` "removes its `copy/` first and the folder after, each through `removeCopy`". `worktree-setup.ts:184-185` removes `copy/` through `removeCopy` and the folder through a bare `rm`. The same paragraph says that "the staging folder is removed in every case", which finding 2 shows false after a copy that succeeded.
- Line 57 says that the staging folder stays "where that cannot be removed even after Owlery makes its own copy writable, as where the source held a folder read-only". The clause "as where the source held a folder read-only" reads as an example of the case where the folder stays. It is the case where the folder goes. The probe's source held a folder of mode 0555, and no staging folder stayed, at the copy or at its run again. A sentence an agent reads should have one reading (`skills/writing-style/SKILL.md`, *에이전트와 검사가 읽는 글은 한 가지로만 읽히게 쓴다*).

Scenario 3 (line 86), `changelog.md` line 6 and `pr.md` line 8 say the exception with one reading, and stay. The snippet replaces the sentence of line 57 that opens "The one exception is its staging folder" with the text below:

```markdown
The one exception is its staging folder. Where the copy in it holds a folder the source kept read-only, Owlery gives the copy's folders their owner's write bit and removes it. Where it still cannot be removed, as where a file of it carries the system flag `uchg`, the folder stays beside the path with its `.gitignore`, git ignores it, and the path's reason names it.
```

The second snippet replaces the two sentences of line 107 that run from "The staging folder is removed in every case" to "the error of a path that failed names it." with the text below:

```markdown
After each copy, failed or not, `removeStaging` removes the staging folder: its `copy/` first, through `removeCopy`, and the folder after, through `rm`. Where `rm` refuses the removal of the copy with `EACCES` or `EPERM`, `removeCopy` gives the copy's folders their owner's read, write and search bits, never following a link, and removes it again. Where the `copy/` still cannot be removed, the folder stays with its `.gitignore`. The error of a path that failed names it, and nothing names it after a copy that succeeded.
```

Where the fix pass closes finding 1 by deleting the `EPERM` half, "or `EPERM`" leaves the second snippet as well.

```seal
verdict: fixed f71ff5c
answer: `frame/design.md:57` and `frame/design.md:107` are rewritten as the two snippets give them, checked against `removeStaging`, `removeCopy` and `writable` at HEAD; "or `EPERM`" stays, since the branch stays until #144 decides.
```

## Confirmations

```seal
confirms: round-4#1
```
What holds: a link of a staging folder's name is passed over, and nothing is read, removed or written through it. `removeLeftCopies` (`worktree-setup.ts:203-213`) reads its folder with `readdir(folder, { withFileTypes: true })` and goes on past each entry that is not a folder. Round 4's probe, written again, ran against `0639627`. It linked `.owlery-copy-Zz99Yy` in the worktree to a folder outside it that held `.gitignore` (`*` and a newline), `keep.txt`, `copy/notes.txt` and `copy/deep/work.txt`. `copyIncluded` of `.env` copied `.env`. The link still stood, and the outside folder held all four files. Round 4 saw `copy/` and its two files deleted. The fix pass claimed the case "leaves a link of a staging folder's name as it is" red against `0eba42e`'s `worktree-setup.ts`, at the read of `outside/copy/notes.txt`. With that file checked out, the case failed at `worktree-setup.test.ts:320`, which is that read. Its claim of a red for `!entry.isDirectory() || ` deleted is carried, not run again. Executed.

What matched: `writable` (`worktree-setup.ts:152-157`) reads each entry with `lstat` and changes the mode of a folder alone, so a link in the copy is not followed. The case "leaves nothing of a path it could not copy" links, from a read-only folder of the source, to a read-only folder outside the worktree, and expects its mode to stay 0555. It ran green at `0639627`. Read, and executed in the module's run.

```seal
confirms: round-4#2
```
What holds: a failed copy whose stage holds a folder the source keeps read-only leaves no staging folder, at the copy or at a run again. Round 4's probe, written again, ran against `0639627`. Its main checkout held `node_modules/pkg/ro/index.js` in a folder of mode 0555, and `node_modules/pkg/secret.js` of mode 0000. `copyIncluded` failed `node_modules/` with `EACCES … copyfile`. No staging folder stayed, and git listed nothing. A copy again failed the same way and left no folder either. Once `secret.js` was readable, a third copy gave `node_modules/` whole, with `pkg/ro/` at mode 0555 and no staging folder. Round 4 saw one folder stay at each run. Executed.

The fix pass claimed reds against `8f6eb4e`'s `worktree-setup.ts`. With that file checked out, the module gave 4 failed and 20 passed:
- "copies a path with Node's copy where its clone fails" failed at line 201;
- "leaves nothing of a path it could not copy" failed at line 250;
- "names in a failed path's error the staging folder it could not remove" failed at line 277, the `toEqual` that expects the folder's name, where the why held the copy's error alone;
- "leaves a path that came to stand in the worktree during its copy" failed at line 375.

The close names line 274 for the third case. The assertion that fails is the one at line 277, so the red is the one claimed. Against `0eba42e`'s `worktree-setup.ts`, the same four failed, together with the case of finding 1 at line 320. The claims of the `seal mutate` breaks other than the `EPERM` one are carried, not run again. The `EPERM` break is finding 1 of this round. Executed.

The class the fix pass listed holds. The removals of a copy whose folders can carry the source's modes are the removal of what a failed clone left at the stage (`worktree-setup.ts:236`) and `removeStaging`'s removal of `copy/` (line 184). Both go through `removeCopy`. The `rm` of the folder itself at line 185 meets only the `.gitignore`, since `copyPath` writes nothing else beside `copy/`. The `rmdir` calls at lines 210 and 327 remove only an empty folder. Read: the module's calls of `rm`, `rmdir`, `chmod`, `removeCopy` and `removeStaging`.

What matched: `gaps.md` row 19 names this round as its answerer, for a removal refused again after the copy's folders got their write bit. This round's probe ran that path for real, with a file under `chflags uchg`. The why named the folder that stayed, and git listed nothing, as row 19 and *Not done* line 29 say. Finding 2 adds what line 29 leaves out. Executed.

What matched: the records that say what the fix does. Each of these says the same as the code, apart from finding 3's two sentences and the limit of finding 2:
- `pr.md` line 8: "a failed copy leaves nothing git lists", the exception of the folder that stays, and "No copy writes or removes through a link out of the worktree";
- `changelog.md` line 6, its last sentence;
- the docstring of `failedCopies` in `protocol.ts`;
- the docstrings of `writable`, `removeCopy`, `removeStaging`, `removeLeftCopies`, `copyPath` and `copyIncluded`.

The `catch` of `copyPath` throws the wrapped error where the removal fails, and `copyIncluded` lists its message. Where the folder stays, the `rmdir` loop at line 327 stops at the first folder that holds it, as the docstring of `copyIncluded` says ("with the folders above it"). Read, and executed in the probe.

The new and widened cases were read against the cases of `copyIncluded`. The case "names in a failed path's error the staging folder it could not remove" holds the error's naming, which no other case reaches. The case of a link of the staging name holds `removeLeftCopies`'s guard alone. Each widened case adds a read-only folder to a path its case already took, and each went red against `8f6eb4e` on the line that reads that folder's removal. None repeats another.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck and the documents' checks of the `Broad gate` key at HEAD, labelled `unverified`. This round ran `worktree-setup.test.ts` alone (24 cases). The fix diff changes no file `daemon.test.ts` reads, except through `copyIncluded`, and the fix pass's 701 passed over five modules at `4630d68` is carried, not run again | `seal/config.json` `Broad gate` | the orchestrator's broad run |
| The built-app test files, none of which this round ran. `gaps.md` rows 13 and 16 name those not yet run | `seal/threads/1795339001-worktree-setup/gaps.md` | the orchestrator's broad run |
| The integration with `cc0b938`, #40's merge into `release/v0.0.2`, with which a trial merge conflicts in `daemon.ts`, `daemon.test.ts` and `view.test.ts`. `frame/plan.md` *Overlap with the release* had this work merging before #40, and the conflicts are the rebase's | the rebased branch | the orchestrator, and the round after the rebase that it spawns |
| Whether the delete of a work item succeeds where a staging folder of finding 2 holds a file under `uchg` in its worktree. The probe did not delete one | `apps/desktop/src/daemon/worktrees.ts#removeWorktree` | the follow-up issue of findings 1 and 2 |
| A physical external disk and a network volume, among them whether any volume answers a read-only folder with `EPERM` (finding 1) | `apps/desktop/src/daemon/worktree-setup.ts` `removeCopy` | a measurement by the owner |
| Q2 and Q3, carried from rounds 1 to 4 | `seal/threads/1795339001-worktree-setup/frame/questions.md` | a measurement by the owner or the orchestrator |

The round leaves three findings open, all `should`. Findings 1 and 2 are carried to a follow-up issue by the plan's judgment of round 4, so their close is `deferred <the issue>`. Finding 3 is the frame's, and closes in `frame/design.md`. No `must` stands. Once the three are closed, the orchestrator decides whether a verifying round is owed for the frame's edit or whether the sealer reads it. Then the rebase onto `cc0b938`, the orchestrator's broad run and the sealer's spawn come due.

## Probes

| Command | Result |
|---|---|
| `git merge-tree --write-tree --name-only HEAD origin/release/v0.0.2` in the branch's worktree | exit 1: conflicts with `cc0b938` in `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/test/daemon.test.ts` and `apps/desktop/test/view.test.ts` |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/worktree-setup.test.ts` in `apps/desktop` of the round's scratch clone at `0639627` | 24 cases passed |
| The same run with `apps/desktop/src/daemon/worktree-setup.ts` checked out from `0eba42e`, then from `8f6eb4e`, then from `0639627` again | `0eba42e`: 5 failed, 19 passed, at lines 201, 250, 277, 320 and 375. `8f6eb4e`: 4 failed, 20 passed, at lines 201, 250, 277 and 375 |
| The same run with `&& error.code !== "EPERM"` deleted from line 166, then the file checked out from `0639627` again | 24 cases passed: the mutant survives |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round5.test.ts --silent=false --reporter=verbose` | 4 cases ran. The link of a staging name: the link stood and the outside folder held its four files. The read-only folder with an unreadable file: the copy failed with `EACCES`, no staging folder stayed at it or at the run again, git listed nothing, and once the file was readable the path was copied whole. The files under `uchg`: `node_modules/` failed with `EPERM` and named `.owlery-copy-8j72EH`, which stayed; `.env.flag` was copied and `.owlery-copy-5CiyVU` stayed, unnamed; a run again named and left a third folder; git listed nothing. The `EPERM` stand-in: no staging folder stayed |
| The probe's case "EPERM branch" alone, with `-t "EPERM branch"`, against the mutant of line 166 | the copy failed with `EACCES` and named `.owlery-copy-sXXPZz`, which stayed |
