# Review round 4: 1795339001-worktree-setup

```seal
target: 0eba42e, fixes 716d1fc..0eba42e
```

This is a verifying round. Its code is the diff `716d1fc..0eba42e`: the fix commit `e72c45b` in `apps/desktop/src/daemon/worktree-setup.ts` and `apps/desktop/test/worktree-setup.test.ts`, with `changelog.md` and `gaps.md`; the fix pass's closes (`1b80de5`); the frame's fold (`f98bc09`); and the orchestrator's close of finding 2 (`0eba42e`). The spawn named the base as the merge base with `origin/release/v0.0.2`. That merge base is still `a3e4e7a`, and `origin/release/v0.0.2` stands at `cbb2e69`. A trial `git merge-tree --write-tree --name-only HEAD origin/release/v0.0.2` exited 0. Both sections this work's *Rule changes* add to still stand at `cbb2e69`, at line 183 of `docs/architecture.md` and of `docs/architecture.ko.md`. No `seal/parity.json` and no `Pact` key stand.

The records read whole at `0eba42e`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`, then `trail/phases/` for their coordinates, and `trail/rounds/round-1.md` to `round-3.md`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. The diff of `gaps.md` since `716d1fc` rewrites row 15 and the paragraph at *Not done* line 26 in place. No row or memo left it.

Carried from rounds 1 to 3, not re-established: the matcher's semantics, the overlap with #119, the second copy of `place` under `ENOSPC`, and the volumes' behaviour on the HFS+ and ExFAT images. Re-derived this round: the close of round 3's finding 1, by round 3's probe written again against `0eba42e`, and the close of finding 2, by reading the frame against the code. The new unit `removeStaging` and its two callers were reviewed as code.

The axes of this round, beyond the table's: what each removal of `removeStaging` reaches where the staging folder's name is a link, and what the removal leaves where the copy holds a folder the daemon cannot write in.

## Findings

### 1. A link named as a staging folder now leads the removal of `copy/` out of the worktree, and a folder of the person's is deleted there

```seal
severity: must
location: `apps/desktop/src/daemon/worktree-setup.ts:160-163`, `apps/desktop/src/daemon/worktree-setup.ts:173-181`, `apps/desktop/test/worktree-setup.test.ts`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round4.test.ts --silent=false --reporter=verbose` in `apps/desktop` of the round's scratch clone at `0eba42e`, its case "a link named as a staging folder"; read `apps/desktop/src/daemon/worktree-setup.ts:173-181`, `docs/product.md:142`, `seal/threads/1795339001-worktree-setup/trail/rounds/round-3.md:124`
regression: round-3#1
```

Why it matters: the unit is `removeStaging` (`worktree-setup.ts:160-163`), which `e72c45b` added, as `removeLeftCopies` calls it (`worktree-setup.ts:180`). The frame's *Scope* item 2 says that "a path whose folder a link of the worktree leads out of the worktree is not written". `docs/product.md` line 142 says that "Owlery deletes nothing of a person's work without that person's word". The fix removes `join(left, COPY)` first. Round 3's paste-ready, which the fix applied, stated the precondition that "`rm` removes a link and not what it leads to". That holds for a removal of the link's own path, as the one `rm(left)` before the fix was, and round 3 confirmed it (`round-3.md` line 124). It does not hold for `<link>/copy`, whose parent component the system resolves through the link. So the defect came from a precondition stated for one call and carried to a second.

`removeLeftCopies` reads the entries with `readdir` and tests each name alone. `rmdir` of a link fails with `ENOTDIR`, and `readFile(join(left, ".gitignore"))` follows the link. So a link of the staging folder's name, leading to a folder that holds a `.gitignore` reading `*` and a newline, passes both tests. Then `rm(join(left, "copy"), { recursive: true })` removes that folder's `copy/` with everything in it, wherever it stands.

The probe made a folder outside the worktree that held `.gitignore` (`*` and a newline), `keep.txt`, `copy/notes.txt` and `copy/deep/work.txt`. It linked `.owlery-copy-Zz99Yy` in the worktree to it and ran `copyIncluded` of `.env`. The copy gave `.env`, the link was gone, and the outside folder held `.gitignore` and `keep.txt` alone. `copy/` and its two files were deleted. Before `e72c45b`, round 3's probe of the same link without a `copy/` saw the link removed and the folder whole.

The trigger is a link of that name in a folder a listed path lies in. A branch can track such a link, and a repository can name its target. The target must hold that exact `.gitignore` and a `copy` entry, so the case is narrow. Even so, the removal deletes files outside the worktree, which the policy says Owlery never does.

The fix reads each entry without following it, and passes over anything that is not a folder. A link of that name then stays, as nothing a copy made. Precondition: the entry is read once, so a process that swaps a real staging folder for a link between the read and the removal is not refused. `staysInside` leaves the same window for the copy's own writes.

```ts
import { constants as files, type Dirent } from "node:fs";

/**
 * Removes the staging folder `staging`, the copy in it before its
 * `.gitignore`, and throws where either removal fails. `staging` is a
 * folder, never a link, since the removal of the copy resolves the folder's
 * name. A `cp` that a stopped daemon started may still write in the copy,
 * and a removal it defeats, or one the daemon's stop cuts short, then leaves
 * the folder with its `.gitignore`, so git still sees nothing in it and a
 * later setup removes it. Once the copy is gone, such a `cp` makes nothing
 * there again, since it makes no folder above its target.
 */

/**
 * Removes from `folder` each staging folder a copy left, as where the daemon
 * stopped during the copy and `copyPath` never removed its own: a folder of
 * the staging folder's name that is empty, or that holds the `.gitignore`
 * `copyPath` writes, with all else it holds, by `removeStaging`. One whose
 * copy something still writes in stays, as git ignores it. A link of that
 * name stays too: no copy made it, and a removal inside it would follow it
 * out of `folder`. Nothing else in `folder` is touched, and a `folder` that
 * does not stand holds none.
 */
async function removeLeftCopies(folder: string): Promise<void> {
  const entries = await readdir(folder, { withFileTypes: true }).catch(() => [] as Dirent[]);
  for (const entry of entries) {
    // `readdir` reads each entry without following it, so a link is no folder here.
    if (!entry.isDirectory() || !STAGING_NAME.test(entry.name)) continue;
    const left = join(folder, entry.name);
    // A copy stopped before it wrote the `.gitignore` left the folder empty.
    if (await rmdir(left).then(() => true, () => false)) continue;
    if ((await readFile(join(left, ".gitignore"), "utf8").catch(() => null)) === UNSEEN) await removeStaging(left).catch(() => {});
  }
}
```

The fix pass also owes a case in `worktree-setup.test.ts`, beside the case "removes the staging folders a stopped copy left beside a path". It links `.owlery-copy-Zz99Yy` to a folder outside the worktree that holds a `.gitignore` of `*` and a `copy/` with a file, runs `copyIncluded`, and expects the outside folder whole. It is red at `0eba42e`, as the probe shows. No sentence of the records states what becomes of such a link, so none is owed.

```seal
verdict: fixed 8f6eb4e
answer: `removeLeftCopies` reads its folder with `readdir(folder, { withFileTypes: true })` and passes over each entry that is not a folder, as the paste-ready gives it, so a link or a file of the staging name stays and nothing reads, removes or writes through it. Its docstring says a link of that name stays and why. The docstring of `removeStaging` states its precondition, that `staging` is a folder and never a link, and names the two callers that hold it: `copyPath` made the folder with `mkdtemp`, and `removeLeftCopies` passes over a link. The guard stands in one place, the read of the entries, so the one case pins it. The class is every call of the module that reaches a path under an entry of the staging name, listed by reading `removeLeftCopies`, `removeStaging` and `copyPath` call by call: `rmdir(left)` and `rm(left)` do not follow a link at the last component, `readFile(left/.gitignore)` and `rm(left/copy)` do, and the guard now stands before all four. Inside a real staging folder, `rm` of `copy/` removes a link of that name as itself, and `writable`, added for finding 2, reads with `lstat`. The case "leaves a link of a staging folder's name as it is, and removes nothing in the folder it leads to" links `.owlery-copy-Zz99Yy` to a folder outside the worktree that holds a `.gitignore` of `*`, `copy/notes.txt` and `copy/deep/work.txt`, and expects both files, the `.gitignore` and the link to stand after `copyIncluded` of `.env`. It was red against `0eba42e`'s `worktree-setup.ts`, at the read of `outside/copy/notes.txt` with `ENOENT` (executed). `seal mutate` with `!entry.isDirectory() || ` deleted gave red at the same assertion (executed). The precondition the round names stands: the entry is read once, so a process that swaps a real staging folder for a link between the read and the removal is not refused, as `staysInside` leaves the same window for the copy's own writes.
```

### 2. A failed copy whose stage holds a folder the daemon cannot write in leaves its staging folder for good, and each run again adds one

```seal
severity: should
location: `apps/desktop/src/daemon/worktree-setup.ts:160-163`, `apps/desktop/src/daemon/worktree-setup.ts:195-211`, `apps/desktop/test/worktree-setup.test.ts`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round4.test.ts --silent=false --reporter=verbose` in `apps/desktop` of the round's scratch clone at `0eba42e`, its case "a failed copy whose stage holds a folder the daemon cannot write in"; read `seal/threads/1795339001-worktree-setup/frame/design.md:57`, `seal/threads/1795339001-worktree-setup/frame/design.md:86`, `seal/threads/1795339001-worktree-setup/changelog.md:6`, `seal/threads/1795339001-worktree-setup/pr.md:8`
```

This finding is new work in `copyPath`, which round 1's fix made. It takes no `regression:` line. Before `e72c45b`, the one `rm(staging)` in the `finally` failed on the same unlink and dropped the error, so a folder stood there too (read). The widening to `removeStaging` keeps that folder's `.gitignore`, so git lists nothing of it, which is better than before. What it does not do is remove the folder.

Why it matters: the frame's *Scope* item 2 says that for a path that fails to copy, "nothing of it is left in the worktree". Scenario 3 (`frame/design.md` line 86), `changelog.md` line 6 ("nothing of it is left in the worktree") and `pr.md` line 8 ("so a failed copy leaves nothing behind") say the same to a person. `cp -R` gives each folder it makes the source folder's mode. Where the source holds a read-only folder and a file the daemon cannot read, `cp` fails. Then `rm(stage)` at line 204 fails with `EACCES` on the file inside the read-only folder, and so does `removeStaging` in the `finally`. `removeLeftCopies` reaches the folder at the next setup, and its `removeStaging` fails the same way.

The probe's main checkout held `node_modules/pkg/ro/index.js` in a folder of mode 0555, and `node_modules/pkg/secret.js` of mode 0000. `copyIncluded` failed `node_modules/` with `EACCES: permission denied, unlink '…/.owlery-copy-Qn7ieo/copy/node_modules/pkg/ro/index.js'`. The folder `.owlery-copy-Qn7ieo` stayed, holding `.gitignore` and `copy/node_modules/pkg/ro/index.js`. A run again failed the same way, left the first folder and added `.owlery-copy-ndWOvg`. Git listed nothing either time. So each "Run setup again" of such a repository leaves another partial copy on disk. The case at `worktree-setup.test.ts:220` holds the same claim with unreadable files alone, so it passes.

The fix gives the copy's folders their owner's write bit where its removal is refused for permissions, then removes it again. That keeps the four statements true as they are written. Precondition: the folders under `copy/` are the daemon's own, since `cp` and Node's copy made them, so `chmod` of them succeeds. `lstat` does not follow a link, so the walk stays in the copy.

```ts
import { chmod, copyFile, cp, link, lstat, mkdir, mkdtemp, readFile, readdir, readlink, realpath, rename, rm, rmdir, stat, symlink, writeFile } from "node:fs/promises";

/** Gives `folder` and each folder under it its owner's read, write and search bits, since a copy keeps the modes of the source's folders. A link is not followed. */
async function writable(folder: string): Promise<void> {
  const kind = await lstat(folder).catch(() => null);
  if (!kind?.isDirectory()) return;
  await chmod(folder, kind.mode | 0o700);
  for (const name of await readdir(folder)) await writable(join(folder, name));
}

async function removeStaging(staging: string): Promise<void> {
  const copy = join(staging, COPY);
  await rm(copy, { recursive: true, force: true }).catch(async (error: NodeJS.ErrnoException) => {
    // A folder the source kept read-only refuses the removal of what it holds.
    if (error.code !== "EACCES" && error.code !== "EPERM") throw error;
    await writable(copy);
    await rm(copy, { recursive: true, force: true });
  });
  await rm(staging, { recursive: true, force: true });
}
```

A removal that a writing `cp` defeats fails with `ENOTEMPTY`, so the case of round 3's finding 1 goes on throwing as it does now. The docstring of `removeStaging` gains one sentence for the new branch. The case at `worktree-setup.test.ts:220`, "leaves nothing of a path it could not copy", which makes files unreadable, can gain a read-only folder in the source and expect no staging folder after the failed copy. It is red at `0eba42e`, as the probe shows.

Where the fix pass judges the case too narrow for code, the close is `deferred <a follow-up issue>`. Then `gaps.md` *Not done* names the case: a source folder kept read-only together with a file the daemon cannot read leaves a staging folder that git ignores, holding the partial copy, which no setup removes. The four statements above then gain the same limit, and *Scope* item 2 and scenario 3 are the framer's.

```seal
verdict: fixed 4630d68
location: `apps/desktop/src/shared/protocol.ts`, `seal/threads/1795339001-worktree-setup/changelog.md`, `seal/threads/1795339001-worktree-setup/gaps.md`
answer: Fixed, not deferred, as the plan's judgment of round 4 records. A new `removeCopy` removes a copy the daemon made in a staging folder, and where `rm` refuses with `EACCES` or `EPERM`, it runs `writable` over the copy and removes it again. `writable` is the paste-ready's, with the mode masked to its permission bits: it reads each entry with `lstat`, gives each folder its owner's read, write and search bits, and follows no link. The class is every removal in the module of a copy whose folders the source's modes can make read-only, listed by `git grep -n -E "\brm\(|rmdir\("` over `worktree-setup.ts`: the removal of what a failed clone left at the stage (`e72c45b` line 204), and `removeStaging`'s removal of `copy/`. Both now go through `removeCopy`. `removeStaging`'s second `rm` meets only the `.gitignore` in a folder `mkdtemp` made, and the two `rmdir` calls remove only an empty folder. Where the removal is refused again, `copyPath` no longer drops the error. A failed copy's error gains "; its staging folder <name> stayed beside it, which git ignores: <the removal's error>", so the setup's record names the folder that stays, and the folders made above it stay with it. A copy that succeeded keeps dropping that error, as before, since it claims nothing of a failed path. Four cases, each seen red (executed). The case "copies a path with Node's copy where its clone fails" now has its stand-in clone leave a read-only folder; against `8f6eb4e`'s `worktree-setup.ts` both paths failed with `EACCES … unlink`, at line 201. The case "leaves nothing of a path it could not copy" gains a read-only folder in the source and, inside it, a link to a read-only folder outside the worktree; against `8f6eb4e` a staging folder stayed, at line 250. The case "leaves a path that came to stand in the worktree during its copy" gains a read-only folder, so the copy that is not moved in is whole and read-only. The new case "names in a failed path's error the staging folder it could not remove" uses a stand-in `rm` that refuses the removal of `copy/` with `EPERM` however its modes stand; against `8f6eb4e` the why held the copy's error alone, at line 274. `seal mutate` gave red for four breaks (executed): `removeCopy(stage)` back to `rm`, at the clone case's line 201; `removeStaging` back to a bare `rm` of `copy/`, at the case of a path that came to stand, line 371; the `writable` call deleted, at lines 201 and 250; and the folder's naming dropped, at line 276. With `lstat` in `writable` read as `stat`, the case of a path it could not copy went red at line 251, where the outside folder's mode turned from 0555 to 0755. One break survived: deleting `&& error.code !== "EPERM"`. On APFS a read-only folder refuses an unlink with `EACCES`, so no case of the suite gives an `EPERM` that a change of mode repairs. The branch stays, since the spawn and the paste-ready name it and a network volume may answer a refusal of permissions with `EPERM`. `gaps.md` *Not verified* names that the refusal after `writable` runs only against the stand-in `rm`, and *Not done* says what stays and that a later copy tries again. `changelog.md` line 6 gains the limit, and the field's docstring in `protocol.ts` says the error names the folder. `pr.md` line 8 and `frame/design.md` lines 57, 86 and 107 are the orchestrator's and the framer's. The narrow set, `worktree-setup`, `daemon`, `repositories`, `last-look` and `view` under `OWLERY_BACKGROUND=1`, gave 701 passed at `4630d68` (executed).
```

## Confirmations

```seal
confirms: round-3#1
```
What holds: a staging folder whose `copy/` a left `cp` still writes keeps its `.gitignore`, git lists nothing of it, and a copy after the `cp` has ended removes it. Round 3's probe, written again, ran against `0eba42e` with the patterns unanchored and anchored at the repository's top. A `cp -R -P` of 20,000 files wrote into the left folder's `copy/`, and `copyIncluded` of `.env` ran 100, 400, 900 and 1600 ms after it started. In all eight trials `.env` was copied within 2 seconds. The `cp` exited 0 after 7.3 to 8.6 seconds. The folder then held its `.gitignore` and 15,056 to 19,577 files, and `git status --porcelain --untracked-files=all` and `git add -A --dry-run` printed nothing, during the `cp` and after it. The next `copyIncluded` removed the folder each time. Round 3 saw the `.gitignore` lost in every trial. The fix pass claimed the case "removes the copy in a staging folder before its .gitignore" red against `716d1fc`'s `worktree-setup.ts` at line 285. With that file checked out, the case failed at `worktree-setup.test.ts:285:40` with `ENOENT` on the left folder's `.gitignore`. It claimed a red for `copyPath`'s `finally` put back to one `rm`. With that mutation alone, the case failed at the same line on the copy's own folder, `.owlery-copy-D8SiTY`. Both files were restored after. Executed: the probe, and the module run three times. Finding 1 of this round is a new defect in `removeStaging`, which the same fix made.

The widening to `copyPath`'s `finally` is right on its own grounds. The class is every removal of a staging folder in the module, listed by `git grep -n -E "\brm\(|rmdir\("` over `worktree-setup.ts`. It gives `removeStaging`'s two removals, the removal of the stage at line 204, which leaves the `.gitignore` in place, and the two `rmdir` calls at lines 179 and 286, which remove only an empty folder. So the two removals of a whole staging folder are the two members, and both now go through `removeStaging`. `copyPath`'s own `cp` has exited before its `finally` runs, since `cloned` waits for its close. So that `finally` meets no writer, only the daemon's stop, and an interrupted removal of `copy/` keeps the `.gitignore` there as well.

```seal
confirms: round-3#2
```
What holds: `frame/design.md` line 107 says that `removeLeftCopies` removes, with all it holds, a folder of the staging folder's name that is empty or holds a `.gitignore` reading `*`, through `removeStaging`, which removes `copy/` first. Line 57 says that a later setup removes such a folder once nothing writes in it, `copy/` before the `.gitignore`. `worktree-setup.ts:160-163` and `:173-181` do that. Read.

What matched: the fix pass's account of the case at `worktree-setup.test.ts:259-291`. It wraps `rm` in the module's mock and makes a removal of a staging folder's `copy/` fail with `ENOTEMPTY`. It makes a removal of a staging folder take all else and then fail, as the one `rm` before the fix did under a writer. It expects both folders to keep their `.gitignore`, `git status` to print nothing, and the next copy to remove both once `rm` is the system's again. Read, and executed in the three module runs.

What matched: `changelog.md` line 6 and `gaps.md` *Not done* line 26 say what the code does, `copy/` before the `.gitignore` and the folder removed only once its `cp` has ended. `gaps.md` row 15 cites round 3's run on the ExFAT image and narrows its ExFAT half to a physical disk. The docstrings of `removeStaging`, `removeLeftCopies`, `copyPath` and `copyIncluded` say the same as the code, apart from the link of finding 1. Read.

The new case was read against the cases of its function. The case at line 237 holds which left folders are removed, and the new case holds the order of the two removals, which no other case reaches. It repeats none.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck and the documents' checks of the `Broad gate` key at HEAD, labelled `unverified`. This round ran `worktree-setup.test.ts` alone (22 cases). The fix diff changes no file `daemon.test.ts` reads but through `copyIncluded`, so the fix pass's 263 passed over both modules at `e72c45b` is carried, not run again | `seal/config.json` `Broad gate` | the orchestrator's broad run |
| The built-app test files, none of which this round ran. `gaps.md` rows 13 and 16 name those not yet run | `seal/threads/1795339001-worktree-setup/gaps.md` | the orchestrator's broad run |
| A physical external disk and a network volume, and a real daemon stopped during a copy, which the probe stood in for with a `cp` it started itself | `apps/desktop/src/daemon/worktree-setup.ts` `copyPath` | a measurement by the owner |
| Q2 and Q3, carried from rounds 1 to 3 | `seal/threads/1795339001-worktree-setup/frame/questions.md` | a measurement by the owner or the orchestrator |
| The integration with #119 after it merges and this branch is rebased, carried from round 1 | the rebased branch | the round after the rebase, which the orchestrator spawns |

The round leaves two findings open. Finding 1 is a `must`. Finding 2 is a `should` that the fix pass may fix or defer to a follow-up issue. Once both are closed, a verifying round is owed for each `fixed` close, and then the orchestrator's broad run and the sealer's spawn come due.

## Probes

| Command | Result |
|---|---|
| `git merge-tree --write-tree --name-only HEAD origin/release/v0.0.2` in the branch's worktree | exit 0: no conflict with `cbb2e69` |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/worktree-setup.test.ts` in `apps/desktop` of the round's scratch clone at `0eba42e` | 22 cases passed |
| The same run with `apps/desktop/src/daemon/worktree-setup.ts` checked out from `716d1fc`, then checked out from `0eba42e` again | 1 failed, 21 passed: the case "removes the copy in a staging folder before its .gitignore", at line 285 with `ENOENT` on `.owlery-copy-Ab12Cd/.gitignore` |
| The same run with `copyPath`'s `finally` changed to `rm(staging, { recursive: true, force: true })`, then the file checked out from `0eba42e` again | 1 failed, 21 passed: the same case at line 285, with `ENOENT` on the copy's own `.owlery-copy-D8SiTY/.gitignore` |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round4.test.ts --silent=false --reporter=verbose` | 4 cases ran. The left `cp`, with patterns unanchored and anchored, at four delays each: the `.gitignore` stood, git listed nothing during or after, the `cp` exited 0, and the next copy removed the folder, all eight times. The link of a staging name to an outside folder: the link was removed and the folder's `copy/` with its two files was deleted, `.gitignore` and `keep.txt` left. The read-only folder with an unreadable file: the copy failed with `EACCES`, one staging folder stayed holding `copy/node_modules/pkg/ro/index.js`, a run again added a second, and git listed nothing |
