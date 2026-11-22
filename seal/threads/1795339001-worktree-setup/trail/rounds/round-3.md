# Review round 3: 1795339001-worktree-setup

```seal
target: 4cdc82d, fixes aa00677..4cdc82d
```

This is a verifying round. Its code is the diff `aa00677..4cdc82d`: round 2's record and the orchestrator's correction of `pr.md` (`b96c6eb`), the fix pass's three commits (`04e4778`, `078b660`, `454086a`), its closes (`3895a5c`) and the frame's fold (`4cdc82d`). The fix diff of code is `b96c6eb..4cdc82d`, in `apps/desktop/src/daemon/worktree-setup.ts`, `apps/desktop/src/daemon/daemon.ts` and `apps/desktop/test/worktree-setup.test.ts`. The spawn named the base as the merge base with `origin/release/v0.0.2`, `cbb2e69`. `cbb2e69` is where `origin/release/v0.0.2` stands, and the merge base is still `a3e4e7a`. A trial `git merge-tree --write-tree --name-only HEAD origin/release/v0.0.2` exited 0, so a merge meets no conflict. No `seal/parity.json` and no `Pact` key stand.

The records read whole at `4cdc82d`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` and `trail/phases/phase-2.md` for their coordinates, and `trail/rounds/round-1.md` and `trail/rounds/round-2.md`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. The diff of `gaps.md` since `aa00677` rewrites row 15 in place, marks row 17 `closed`, rewrites the second paragraph of *Not done* in place and adds a third. No row or memo left it.

Carried from rounds 1 and 2, not re-established: the matcher's semantics, the overlap with #119 and its ten conflicting files, the setup pane's end by a close, an archive and a signal, and that each copied file has its own inode. Re-derived: every close below, by round 2's probes written again from its `## Probes` rows against round 2's two disk images, and the new units of the fix diff, `removeLeftCopies`, the `.gitignore` of the staging folder and the second copy of `place`.

The axes of this round, beyond the table's: what the removal of a left staging folder does where something still writes in it, where its name is a link, and where the folder holds the person's files; what the second copy of `place` leaves where the volume runs out of space; and what git lists in a worktree on ExFAT after a copy.

## Findings

### 1. A staging folder that a left-running `cp` still writes loses its `.gitignore` to the next setup's removal, then stays in the worktree for good, listed by git

```seal
severity: should
location: `apps/desktop/src/daemon/worktree-setup.ts:148-164`, `apps/desktop/test/worktree-setup.test.ts`, `seal/threads/1795339001-worktree-setup/changelog.md:6`, `seal/threads/1795339001-worktree-setup/frame/design.md:57`, `seal/threads/1795339001-worktree-setup/gaps.md:26`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round3.test.ts --silent=false --reporter=verbose` and `node scripts/test-in-electron.mjs test/test_tmp_round3_anchored.test.ts --silent=false --reporter=verbose` in `apps/desktop` of the round's scratch clone at `4cdc82d`; read `apps/desktop/src/daemon/main.ts:31-40`, `apps/desktop/src/main/daemon-client.ts:106-118`, `apps/desktop/src/daemon/worktree-setup.ts:77-83`
regression: round-2#1
```

This finding is a candidate for a follow-up issue. The round's spawn asked that a `should` case of the copy mechanism be marked so where it neither loses a person's file nor writes outside the worktree, and this one does neither: what stays is Owlery's own copy, inside the worktree.

Why it matters: the unit is `removeLeftCopies` (`worktree-setup.ts:148-164`), which `04e4778` added. The frame's *Scope* item 2 says that "a command in the person's pane neither lists nor adds the copy", and that "a staging folder a stopped daemon left is removed by the next setup where the list names a path in that folder". The fix removes such a folder with one `rm(left, { recursive: true, force: true })` and drops its error. It assumed that nothing writes in a folder a stopped daemon left. Something can: the copy process. `stopDaemon` signals the daemon's own process alone (`daemon-client.ts:106-118`). `stop` exits once `daemon.close()` resolves (`main.ts:31-40`). `cloned` starts `/bin/cp` in the daemon's process group with nothing that ends it (`worktree-setup.ts:77-83`). So a `cp` the stopped daemon started goes on writing into the staging folder.

The probe made a staging folder `.owlery-copy-Ab12Cd` holding the `.gitignore` of `*` and a `copy/` folder. A `/bin/cp -R -P` of 20,000 small files was writing into `copy/`, standing in for a `cp` a stopped daemon left. Then a `copyIncluded` of `.env`, in the same folder, ran 100, 400, 900 and 1600 ms after that `cp` started. In all four trials, `copyIncluded` returned within 2 seconds with `.env` copied. The `cp` went on and exited 0 about 7 seconds in. The folder then stood with 15,343 to 19,607 files and no `.gitignore`. The `rm` had removed the `.gitignore`, then failed on the folder that `cp` kept filling, and `.catch(() => {})` dropped the failure. In a repository that ignores `/.env` and `/node_modules`, anchored at its top, `git status --porcelain --untracked-files=all` then listed 18,785 files under `.owlery-copy-Ab12Cd/copy/node_modules/`, and `git add -A --dry-run` added each one. The next `copyIncluded` into the same folder left the folder as it was, since it is neither empty nor holds the `.gitignore`. No later setup removes it.

The case needs a daemon stopped during a copy, as at an update of the app, and then a "Run setup again" of the same worktree while the `cp` it left still runs. On a volume where `cp -c` copies the bytes, that window lasts as long as the copy of the folder.

The fix removes the copy before the `.gitignore`. Where a writing `cp` defeats the removal, the folder keeps its `.gitignore`, git still lists nothing of it, and a later setup removes it once the `cp` has ended. Precondition: `rm` removes a link and not what it leads to, which this round's link probe showed. Once `copy/` is gone, a `cp -R` writing below it can make nothing again, since it makes no folder above its own target.

```ts
/**
 * Removes from `folder` each staging folder a copy left, as where the daemon
 * stopped during the copy and `copyPath` never removed its own: a folder of
 * the staging folder's name that is empty or holds the `.gitignore`
 * `copyPath` writes. The copy in it goes before the `.gitignore`, since a
 * `cp` the stopped daemon started may still write there: where it defeats
 * the removal, the folder stays as git ignores it, and a later setup
 * removes it. Nothing else in `folder` is touched, and a `folder` that does
 * not stand holds none.
 */
async function removeLeftCopies(folder: string): Promise<void> {
  const names = await readdir(folder).catch(() => [] as string[]);
  for (const name of names) {
    if (!STAGING_NAME.test(name)) continue;
    const left = join(folder, name);
    // A copy stopped before it wrote the `.gitignore` left the folder empty.
    if (await rmdir(left).then(() => true, () => false)) continue;
    if ((await readFile(join(left, ".gitignore"), "utf8").catch(() => null)) !== UNSEEN) continue;
    if (await rm(join(left, "copy"), { recursive: true, force: true }).then(() => true, () => false)) await rm(left, { recursive: true, force: true }).catch(() => {});
  }
}
```

The fix pass also owes these statements. `worktree-setup.test.ts` needs a case in which the removal of `copy/` fails and the folder then keeps its `.gitignore`. The file already mocks `node:fs/promises` for `link`, so `rm` can be wrapped the same way and made to refuse for the `copy` path. `changelog.md` line 6, "is removed at the next setup of that worktree that names a path in the same folder", becomes "is removed at a setup of that worktree that names a path in the same folder, once nothing writes in it". `frame/design.md` line 57 says the same of the next setup, and it is the framer's.

Under the follow-up route, the close is `deferred <the issue>`. Then `gaps.md` *Not done* line 26 names the case in its own words: a `cp` that a stopped daemon left still running, the `.gitignore` lost to a removal during it, and a folder that git lists and no setup removes. `changelog.md` line 6 then gains the same limit.

```seal
verdict: fixed e72c45b
answer: A new `removeStaging` removes a staging folder's `copy/` first and the folder only after it, and throws where either removal fails, so a removal that a writing `cp` defeats leaves the folder with its `.gitignore`, and a copy after the `cp` has ended removes it. `removeLeftCopies` removes a left folder by it, as the paste-ready gives it. `copyPath`'s own removal in its `finally` uses it too: the same loss of the `.gitignore` follows where the daemon's stop cuts that removal short, so the class has two members, the two removals of a staging folder in the file. `copy` is the constant `COPY`, which `copyPath` writes the copy under. The case "removes the copy in a staging folder before its .gitignore" wraps `rm` in the module's mock, as the round suggests: a removal of a staging folder's `copy/` fails with `ENOTEMPTY`, and one of the staging folder takes all else it holds and then fails. With the patterns anchored at the repository's top, the left folder and the copy's own both keep their `.gitignore`, `git status --porcelain --untracked-files=all` prints nothing, and once `rm` is the system's again, the next copy removes both. It was red against `716d1fc`'s `worktree-setup.ts` at line 285, the left folder's `.gitignore` read, with ENOENT. `seal mutate` gave red, each at line 285, for three breaks: deleting `removeStaging`'s removal of `copy/`, `removeLeftCopies` back to one `rm` of the folder, and `copyPath`'s `finally` back to one `rm`, whose red named the copy's own folder. A probe with a real `/bin/cp -R -P` writing 20,000 files into a left folder's `copy/`, run in Electron's Node, gave the same result for a copy started 100, 400, 900 and 1600 ms after the `cp`: the `.gitignore` stood, the `cp` exited 0, git listed nothing, and the next copy removed the folder. `changelog.md` line 6 now says "is removed at a setup of that worktree that names a path in the same folder, once nothing writes in it". `gaps.md` *Not done* says that nothing ends such a `cp` and how the order keeps its folder hidden until a later copy. Row 15 cites this round's run on the ExFAT image and narrows its ExFAT half to a physical disk. `frame/design.md` lines 57 and 107 are the framer's. The narrow set, `worktree-setup.test.ts` and `daemon.test.ts` under `OWLERY_BACKGROUND=1`, gave 263 passed at `e72c45b`.
```

### 2. The frame says the removal takes a left staging folder only where it holds nothing but its `.gitignore`, and the code takes one that holds the copy too

```seal
severity: should
location: `seal/threads/1795339001-worktree-setup/frame/design.md:107`
evidence: read `apps/desktop/src/daemon/worktree-setup.ts:155-164`, `apps/desktop/test/worktree-setup.test.ts:237-257`; executed `node scripts/test-in-electron.mjs test/worktree-setup.test.ts` in the round's scratch clone at `4cdc82d`, 21 cases passed, the case at line 237 among them
regression: round-2#1
```

Why it matters: the unit is the sentence on `removeLeftCopies` in *Data & interfaces* (`frame/design.md` line 107), which the fold `4cdc82d` wrote for the fix of round 2's finding 1. The frame says that `removeLeftCopies` "removes a folder of the staging folder's name that is empty or holds only the `.gitignore` the copy writes". The code tests the `.gitignore`'s text alone and then removes the folder with everything in it (`worktree-setup.ts:162`). The case at `worktree-setup.test.ts:237` plants exactly such a folder, with `copy/.env` beside its `.gitignore`, and expects it gone. A left copy always holds the copy's files, so "holds only" names a folder the removal almost never meets. The sealer reads this sentence against the tree, and a reader who trusts it believes a folder holding files is never removed.

```md
Before it checks whether a path stands, it runs `removeLeftCopies` once in each folder a listed path lies in, which removes, with all it holds, a folder of the staging folder's name that is empty or holds a `.gitignore` reading `*` as the copy writes it.
```

Where the fix of finding 1 lands, the sentence also says that the copy goes before the `.gitignore`. The sentence is the framer's.

## Confirmations

```seal
confirms: round-2#1
```
What holds: git lists nothing of a copy while it stands in its staging folder. Round 2's probe, written again, ran a clone stand-in that calls `git status --porcelain --untracked-files=all` and `git add -A --dry-run` in the worktree after each clone, in a repository that ignores `/.env` and `/node_modules`. Both printed nothing, and both paths were copied. The case at `worktree-setup.test.ts:163` holds it, and it was red against `b96c6eb`'s `worktree-setup.ts` with `?? .owlery-copy-YEeKBz/.env` at line 173. Executed: the probe's case "finding 1", and the module run against that older file. Finding 1 of this round is a new defect in `removeLeftCopies`, which the same fix made.

```seal
confirms: round-2#2
```
What holds: a file is copied where the worktree's volume makes no hard link. On round 2's ExFAT disk image, attached again, the worktree on it got `.env` with the main checkout's bytes and a link count of 1, and `node_modules/` whole, where round 2 failed `.env` with `ENOTSUP`. With the main checkout on the image and the worktree on APFS, both paths were copied. The case at `worktree-setup.test.ts:272` holds the three codes, the 0600 mode, the person's file under `ENOTSUP` and the failure under `EIO`. It was red against `b96c6eb`'s file at line 288. Executed: the probe's volume case with the ExFAT image, and the module run.

```seal
confirms: round-2#3
```
What holds: the removal of the earlier setup pane in the `runSetup` case (`daemon.ts:701-703`) is the comment and the line that stood before `cc1aa17`, word for word (`git show cc1aa17^:apps/desktop/src/daemon/daemon.ts`, lines 696 to 698). `gaps.md` row 17 reads `closed` and names round 2's finding 3. Executed: `node scripts/test-in-electron.mjs test/daemon.test.ts -t "setup"`, 15 passed. Read: the diff.

```seal
confirms: round-2#4
```
What holds: `pr.md` line 12 says that where `.worktreesetup` changed, nothing runs, the line says "Setup failed" and the "Setup" section says why. `setupMark` and `setupSection` (`view.ts:29-32`, `view.ts:58-66`) say so. `frame/plan.md` line 70 now says the same. Read.

```seal
confirms: round-2#5
```
What holds: the docstring of `copyIncluded` (`worktree-setup.ts:206-210`), `frame/design.md` line 107, and `frame/plan.md` lines 14, 27 and 57 say that `cp -c` copies the bytes itself where no clone can be made, and that Node's copy runs where that process fails or cannot start. With the worktree on round 2's HFS+ image and on its ExFAT image, `/bin/cp -c -R -P` exited 0 for both paths and said nothing. Executed: the probe's volume case. Read: the five sentences.

What matched: `gaps.md` row 15 holds as it is written. It says that the copy where no hard link is made ran in the suite only against a stand-in `link`, and on no ExFAT volume. That is still true of the suite. This round ran that copy on an ExFAT disk image (round 2's finding 2 above), so the row can cite this round and narrow its ExFAT half to a physical disk. That edit belongs to the closing memo, and no finding is owed for it.

What matched: `gaps.md` line 24 holds. `place` moves a link by making it again, a file by a hard link, or where `link` fails with `ENOTSUP`, `EXDEV` or `EPERM`, by `copyFile` with `COPYFILE_EXCL`, and maps `EEXIST` to `APPEARED` (`worktree-setup.ts:124-138`). Under `ENOTSUP`, the person's `PERSON=1` written during the move stayed, in the case at `worktree-setup.test.ts:272`. Executed: the module run.

What matched: the second copy of `place` leaves nothing where it fails. On a 16 MB ExFAT image, a 9 MB `.env` was copied to its staging folder, and its second copy failed with `ENOSPC: no space left on device, copyfile`. No `.env` stood in the worktree, and no staging folder was left. A run again failed the same way and left nothing again. So *Scope* item 2, "nothing of it is left in the worktree", holds on that route. On a volume that makes no hard link, a file needs room for two copies until the staging folder goes, and the record lists the path with why. Executed: the probe's case "runs out of space".

What matched: `078b660`'s claim that `rm` of a link removes the link alone. A link `.owlery-copy-Zz99Yy` in the worktree, leading to a folder outside it that held a `.gitignore` of `*` and `keep.txt`, was removed, and the outside folder kept both files. Executed: the probe's case "a link named as a staging folder".

What matched: on the ExFAT image, the worktree also held macOS's AppleDouble files (`._` files that hold extended attributes), such as `._.env` and `._node_modules`, which git lists as untracked. Git's own checkout there made `._.git`, `._.gitignore` and `._README.md` too, and git reported `.gitignore` and `README.md` as modified. That is the volume's way of storing what it cannot hold, and the files hold attributes, not bytes of `.env`. This work changes nothing of it.

Each new case of the fix diff was read against the cases of its function. The case at `worktree-setup.test.ts:163` holds what git lists during a copy, which no other case reads. The case at line 237 holds the removal of left folders, with the name test and the `.gitignore` test, which no other case reaches. The case at line 272 holds the second copy, which no other case can reach on the suite's volume. The regex `beside` at line 155 now expects `copy/`. None repeats another. Each was red against `b96c6eb`'s `worktree-setup.ts`, on its own guard's line (lines 156, 173, 254 and 288). This matches the fix pass's account. Executed: the module run against that older file, then the file restored.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck and the documents' checks of the `Broad gate` key at HEAD, labelled `unverified`. This round ran `worktree-setup` (21 cases) and `daemon` with `-t "setup"` (15) | `seal/config.json` `Broad gate` | the orchestrator's broad run |
| The built-app test files, none of which this round ran. The fix diff changes the daemon's `runSetup` case and the copy, which each built-app file starts in `dist/daemon.js`. `gaps.md` rows 13 and 16 name the files not yet run | `seal/threads/1795339001-worktree-setup/gaps.md` | the orchestrator's broad run |
| A physical external disk and a network volume, which disk images do not stand for, and a real daemon stopped during a copy, which finding 1's probe stood in for with a `cp` it started itself | `apps/desktop/src/daemon/worktree-setup.ts` `copyPath` | a measurement by the owner |
| Q2 and Q3, carried from rounds 1 and 2 | `seal/threads/1795339001-worktree-setup/frame/questions.md` | a measurement by the owner or the orchestrator |
| The integration with #119 after it merges and this branch is rebased, carried from round 1 | the rebased branch | the round after the rebase, which the orchestrator spawns |

The round leaves two findings open. Finding 1 is a candidate for a follow-up issue, and finding 2 is a sentence of the frame. Once each is closed, the orchestrator's broad run and the sealer's spawn come due, after the verifying round that a fixed close owes.

## Probes

| Command | Result |
|---|---|
| `git merge-tree --write-tree --name-only HEAD origin/release/v0.0.2` in the branch's worktree | exit 0: no conflict with `cbb2e69` |
| `node scripts/test-in-electron.mjs test/worktree-setup.test.ts` in `apps/desktop` of the round's scratch clone at `4cdc82d` | 21 cases passed |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "setup"` | 15 passed, 226 skipped |
| The same `worktree-setup.test.ts` run with `apps/desktop/src/daemon/worktree-setup.ts` checked out from `b96c6eb`, then checked out from HEAD again | 4 failed, 17 passed: the cases at lines 146, 163, 237 and 272, at lines 156, 173, 254 and 288 |
| `PROBE_HFS=<HFS+ image> PROBE_EXFAT=<ExFAT image> PROBE_SMALL=<16 MB ExFAT image> node scripts/test-in-electron.mjs test/test_tmp_round3.test.ts --silent=false --reporter=verbose`, with copies of round 2's two images and a new 16 MB image made by `hdiutil create -fs ExFAT`, each attached with `-nobrowse -mountpoint` under the round's scratch directory and detached after | 5 cases ran. Round 2's finding 1 probe: git printed nothing during either clone. With the worktree on HFS+ and on ExFAT, `/bin/cp -c` exited 0 for both paths and both were copied, `.env` with a link count of 1; with the main checkout on either image, both were copied. A 9 MB `.env` on the 16 MB image failed with `ENOSPC` and left nothing, twice. With a `cp -R` writing 20,000 files into a staging folder, the copy started after 100, 400, 900 and 1600 ms each left that folder without its `.gitignore`, holding 15,343 to 19,607 files. A link of the staging folder's name was removed, and the folder it led to kept its files |
| `node scripts/test-in-electron.mjs test/test_tmp_round3_anchored.test.ts --silent=false --reporter=verbose` | 1 case ran. In a repository that ignores `/.env` and `/node_modules`, the same race left the staging folder without its `.gitignore`. `git status` then listed 18,785 files under `.owlery-copy-Ab12Cd/copy/node_modules/`, `git add -A --dry-run` added 18,785, and the next `copyIncluded` left the folder as it was |
