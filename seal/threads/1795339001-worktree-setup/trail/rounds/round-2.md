# Review round 2: 1795339001-worktree-setup

```seal
target: aa00677, fixes fcd8cce..aa00677
```

This is a verifying round. Its code is the diff `fcd8cce..aa00677`: the eight closes of round 1 (`cae2aa2`, `27e04bf`, `cc1aa17`, `c711279`, `a3d9630`, `6fcf49d`, `63816c8`), the closing memo (`8d1506e`, `e77fa9a`), the closes (`47780e1`), `pr.md` (`b0d39d3`), the frame's fold (`69eee33`) and Q1's status (`aa00677`). The base is `origin/release/v0.0.2`. Its merge base with the branch is still `a3e4e7a`, and the base has moved to `cbb2e69` (#138), which changes `docs/architecture.md`, `docs/architecture.ko.md` and the records of `1795339000-sessions-outlive-the-daemon` alone. A trial `git merge-tree --write-tree --name-only HEAD origin/release/v0.0.2` exited 0, so a merge meets no conflict. No `seal/parity.json` and no `Pact` key stand.

The records read whole at `aa00677`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md`, `trail/phases/phase-2.md` and `trail/rounds/round-1.md`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. The diff of `gaps.md` since `fcd8cce` adds three rows to `## Not verified` and one paragraph to `## Not done`, and rewrites one paragraph there. No row or memo left it.

Carried from round 1, not re-established: the matcher's semantics and the confirmation on it, the overlap with #119 and its ten conflicting files (#119 is still not in the base), and the setup pane's end by a close, an archive and a signal. Re-derived: every close below, by round 1's probes written again from its `## Probes` rows, and the new units of the fix diff.

The axes of this round, beyond the table's: what the move into place does on each kind of volume; whether the worktree's file shares anything with the main checkout's after a hard link; what git and a command in the person's pane see while a copy stands beside its place; what a daemon stopped during a copy leaves; whether the form and the section show the command whole; and whether the work-item check in `runSetup` can catch anything.

## Findings

### 1. While a path is copied, and after a daemon stopped during its copy, git lists the staging folder's files as untracked, where the repository's patterns are anchored at its top

```seal
severity: should
location: `apps/desktop/src/daemon/worktree-setup.ts:137-150`, `apps/desktop/test/worktree-setup.test.ts:148`, `seal/threads/1795339001-worktree-setup/frame/design.md:107`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts --silent=false --reporter=verbose` in the round's scratch clone at `aa00677`, the case "what git shows of the staging folder while a copy runs"; read `apps/desktop/src/daemon/main.ts:31-40`, `apps/desktop/src/daemon/daemon.ts:260-279`
regression: round-1#8
```

Why it matters: the unit is `copyPath` (`worktree-setup.ts:137-150`), which `27e04bf` added. The frame's *Scope* item 2 says a path "is written beside its place, in a folder of its own, and moved into its place whole, so nothing stands at the place until the copy is whole". The fix made that folder `.owlery-copy-<random>` inside the worktree, and the name came from round 1's own paste-ready, a sibling of the place. Git decides what it ignores there by the repository's patterns, and a pattern anchored at the top, such as `/.env` or `/node_modules` (the form Create React App writes), does not match one folder down. The probe's repository ignored `/.env` and `/node_modules`. During each clone, `git status --porcelain --untracked-files=all` of the worktree printed `?? .owlery-copy-JUUsI9/.env` and `?? .owlery-copy-sPlpcZ/node_modules/pkg/index.js`, and `git add -A --dry-run` printed `add` for both.

At a creation, no pane runs during the copy. At "Run setup again", the person's panes run in the worktree (`daemon.ts`, the `runSetup` case ends none), so an agent's `git add -A` during the copy stages the person's `.env` or a `node_modules` of any size. A daemon stopped during a copy leaves the folder for good: `stop` in `main.ts:31-40` awaits `daemon.close()`, which does not wait for the `changing` chain (`daemon.ts:260-279`), and then calls `process.exit`, so the `finally` of `copyPath` never runs. The folder then stands untracked in the worktree with the secret in it, and the next `git add -A` commits it. Before the fix, a stopped copy left a partial path at its own place, which the repository's pattern ignores.

The fix writes a `.gitignore` of `*` into the staging folder before the copy, and moves the copy one folder down so that an included path named `.gitignore` is not the same file. Precondition: the staging folder is new and empty (`mkdtemp`) and inside the target's folder, so the `rename` and the `link` of `place` stay on one volume. Git does not look inside a folder it ignores, so a negation in a copied `.gitignore` re-includes nothing.

```ts
import { cp, link, lstat, mkdir, mkdtemp, readFile, readlink, realpath, rename, rm, rmdir, stat, symlink, writeFile } from "node:fs/promises";

async function copyPath(clone: string, source: string, target: string): Promise<void> {
  const staging = await mkdtemp(join(dirname(target), ".owlery-copy-"));
  try {
    // Git, and so a command in the person's pane, sees nothing of the copy before it is whole, nor of a staging folder a stopped daemon left: the repository's patterns may be anchored at its top, and this folder is one down.
    await writeFile(join(staging, ".gitignore"), "*\n");
    // The copy stands one folder further down, so an included path named `.gitignore` is not that file.
    const stage = join(staging, "copy", basename(target));
    await mkdir(dirname(stage));
    if (!(await cloned(clone, source, stage))) {
      await rm(stage, { recursive: true, force: true });
      await cp(source, stage, { recursive: true, verbatimSymlinks: true, force: false, errorOnExist: false });
    }
    await place(stage, target);
  } finally {
    await rm(staging, { recursive: true, force: true }).catch(() => {});
  }
}
```

The fix pass also owes these statements. The docstring of `copyPath` says that git ignores the staging folder. `frame/design.md` line 107 says `<stage>` stands inside a folder "that git ignores". The regex `beside` of `worktree-setup.test.ts:148` expects `.owlery-copy-[^/]+/copy/<name>`. A case of `worktree-setup.test.ts` holds the probe: a repository that ignores `/.env` and `/node_modules`, and a clone stand-in that runs `git status --porcelain --untracked-files=all` in the worktree and expects nothing. A staging folder that a stopped daemon left still holds its disk. Removing it at the next copy is a removal by name in the person's worktree, so it goes to `gaps.md` *Not done* or gets a decision of its own.

### 2. On a worktree volume that holds no hard links, such as exFAT, every included file fails to copy, with "ENOTSUP: operation not supported on socket, link"

```seal
severity: should
location: `apps/desktop/src/daemon/worktree-setup.ts:118-128`, `apps/desktop/test/worktree-setup.test.ts`, `seal/threads/1795339001-worktree-setup/gaps.md:24`, `seal/threads/1795339001-worktree-setup/frame/design.md:107`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts --silent=false --reporter=verbose` with `PROBE_EXFAT` naming an ExFAT disk image attached under the round's scratch directory, the case "a copy onto a volume that is not APFS, and across volumes"
regression: round-1#8
```

Why it matters: the unit is `place` (`worktree-setup.ts:118-128`), which `27e04bf` added. The frame's *Scope* item 2 asks for a move that writes over nothing. The fix moves a file by `link(stage, target)`, and `STANDS` maps only the errors of a target that stands to `APPEARED`. A volume that holds no hard links refuses every `link` with `ENOTSUP`, which is not in `STANDS`, so the path is listed as failed and the setup fails. In the probe, the main checkout was on APFS and the worktree on an ExFAT image. `node_modules/` was copied, since a folder moves by `rename`, and `.env` failed with `ENOTSUP: operation not supported on socket, link '…/.owlery-copy-mNBhjT/.env' -> '…/wt/.env'`. Before the fix, Node's copy wrote such a file there. A worktree lands on such a volume only where `OWLERY_WORKTREES` names one (`worktrees.ts:18-21`), so few people meet it. The person who does gets a "Setup failed" line and no `.env` for every work item. A main checkout on ExFAT with the worktree on APFS copied both paths.

The fix copies the file once more where the volume refuses the link for another reason than a target that stands. `COPYFILE_EXCL` refuses a target that stands, as `link` does. Precondition: on macOS, libuv's `copyFile` copies through `copyfile(3)` and keeps the file's mode. The fix pass shows that a 0600 `.env` keeps its mode in the case it adds, since this round did not run that.

```ts
import { constants as files } from "node:fs";
import { copyFile } from "node:fs/promises"; // joins the existing import

    else if (kind.isSymbolicLink()) await symlink(await readlink(stage), target);
    // A hard link refuses whatever stands. A volume that holds no hard links, such as exFAT, gets the file copied once more, with the same refusal.
    else
      await link(stage, target).catch((error: NodeJS.ErrnoException) => {
        if (STANDS.has(error.code ?? "")) throw error;
        return copyFile(stage, target, files.COPYFILE_EXCL);
      });
```

The fix pass also owes these statements. The docstring of `place` names the second copy. `gaps.md` line 24 ends "each of which refuses whatever stands", and needs the second copy too. `frame/design.md` line 107, "any other file by a hard link", gains "or, where the volume holds no hard links, by a copy that refuses what stands". `worktree-setup.test.ts` needs a case that runs `place` against a `link` refusing with `ENOTSUP`. No volume of the suite holds no hard links, so the case swaps in the refusal, or the fix pass says why none is written.

### 3. `runSetup`'s check that the earlier setup pane is this work item's can catch nothing once the store reads every setup with no pane, and it tells the next reader that a record can name another work item's pane

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:701-704`, `seal/threads/1795339001-worktree-setup/gaps.md:17`
evidence: executed `node scripts/test-in-electron.mjs test/daemon.test.ts` in the round's scratch clone with `prior?.info.workItemId === workItemId &&` removed from `daemon.ts:704`, 241 cases passed, then the line restored; read `apps/desktop/src/daemon/daemon.ts:169`, `apps/desktop/src/daemon/daemon.ts:1057`, `apps/desktop/src/daemon/repositories.ts:160-164`
regression: round-1#3
```

Why it matters: the unit is the removal of the earlier setup pane in the `runSetup` case (`daemon.ts:701-704`), which `cc1aa17` changed. The frame's *Scope* item 6 says the daemon "takes the earlier setup pane off the lists". *Scope* item 3 says every stored setup is read with no pane, and *Data & interfaces* says the daemon knows a setup pane by the record's `paneId`. The fix kept both halves of round 1's paste-ready, `setupRead` and a work-item check, and the second came from that paste-ready. Within one daemon, a pane's id is a count that only grows (`nextId`, `daemon.ts:169` and `1057`). A setup's `paneId` is written only by `startSetup`, for its own work item's setup pane. From one daemon to the next, `setupRead` gives every setup `paneId: null` (`repositories.ts:160-164`), and its mutant was red in the fix pass. So `this.sessions.get(before)` is that work item's own setup pane or nothing, and the check is true wherever it is read.

With the check removed, the whole `daemon.test.ts`, 241 cases, passed, as the fix pass's `seal mutate` found. The check would not hold the defect of round 1's finding 3 even where `setupRead` broke, since round 1's probe showed the pane that took the old id was the same work item's shell. The release behaves the same either way. Under `skills/core/SKILL.md` *The rule a mechanism is kept against*, the check goes: it has caught nothing and can catch nothing. Its cost is a branch that no case can turn red, a comment that states a case the store rules out, and `gaps.md` row 17, which hands it to the rounds. `gaps.md` row 17 says it "was kept because the round's spawn asked for it". The request was round 1's paste-ready, written before `setupRead` stood in the tree.

```ts
            // The earlier setup pane, which has exited, leaves the lists, and the record names the new one. A record names only a pane this daemon started for this work item's setup, since the store reads every setup naming none.
            const before = earlier?.paneId ?? null;
            if (before !== null && this.sessions.get(before)?.info.alive === false) this.sessions.delete(before);
```

`gaps.md` row 17 then gets the word `closed` and this finding as its coordinate.

### 4. `pr.md` and the frame's judgment say that the line says why no command ran, and the line says only "Setup failed"

```seal
severity: should
location: `seal/threads/1795339001-worktree-setup/pr.md:12`, `seal/threads/1795339001-worktree-setup/frame/plan.md:70`
evidence: read `apps/desktop/src/renderer/view.ts:29-32`, `apps/desktop/src/renderer/view.ts:58-66`, `seal/threads/1795339001-worktree-setup/changelog.md:8`
regression: round-1#4
```

Why it matters: the unit is `pr.md` line 12, which `b0d39d3` wrote in the fix range of round 1's finding 4. The judgment row at `frame/plan.md` line 70, written with round 1's record at `fcd8cce`, holds the same sentence. Both say that where `.worktreesetup` changed, "nothing runs and the line says why". `setupMark` gives the line "Setting up", "Setup failed" or nothing (`view.ts:29-32`). The sentence ".worktreesetup changed after the setup was shown, so no command ran." stands in the view's "Setup" section (`setupSection`, `view.ts:58-66`). `changelog.md` line 8 says it as the code does: the work item's line says "Setup failed". A person who reads the pull request looks on the line for a reason that is not there. The sealer reads the same sentence against the tree.

```md
The command runs only where `.worktreesetup` still holds the text the form showed; where it changed, nothing runs, the line says "Setup failed" and the work item's "Setup" section says why. The pane shows it run.
```

`frame/plan.md` line 70 gets the same words in place of "and where it changed the command does not run and the line says why".

### 5. The code and the frame name a volume that is not APFS as where Node's copy takes over, and there `cp -c` exits 0 and copies the bytes itself

```seal
severity: should
location: `apps/desktop/src/daemon/worktree-setup.ts:162-163`, `seal/threads/1795339001-worktree-setup/frame/design.md:107`, `seal/threads/1795339001-worktree-setup/frame/plan.md:14`, `seal/threads/1795339001-worktree-setup/frame/plan.md:57`, `seal/threads/1795339001-worktree-setup/gaps.md:15`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts --silent=false --reporter=verbose` with `PROBE_HFS` and `PROBE_EXFAT` naming disk images attached under the round's scratch directory, the case "a copy onto a volume that is not APFS, and across volumes", which logged each exit of `/bin/cp`
```

Why it matters: the docstring of `copyIncluded` (`worktree-setup.ts:162-163`) says the clone fails "as on a volume that is not APFS", and Node's copy then writes the path. `frame/design.md` line 107 says the same of the process's exit. `frame/plan.md` line 14 says "On a volume that is not APFS, or across volumes, the fallback runs", and line 57 says "Where the clone fails, as on another volume, Node's copy writes the bytes". The probe ran the copy with the worktree on an HFS+ image and on an ExFAT image, the main checkout on APFS. Each `/bin/cp -c -R -P` exited 0 and printed nothing, and the path stood whole. So on these volumes, and across volumes, `cp` copies the bytes itself and Node's copy never runs. What reaches Node's copy is a clone that fails for another reason: a file that cannot be read, or a `clone` program that cannot start. The person sees the same result either way. A reader of the frame who measures the fallback, as `gaps.md` row 15 asks, measures the wrong program. `changelog.md` line 7 and `pr.md` line 8 stay true, since each says only that the bytes are copied where no clone can be made.

```md
worktree-setup.ts, the docstring of `copyIncluded`: "…then the path is cloned beside its place with `clone` run as `cp -c -R -P`, which copies the bytes itself where no clone can be made, as on a volume that is not APFS or across volumes; where the process fails, as on a file it cannot read, Node's copy writes the path there instead; the copy then moves into its place whole."

frame/design.md line 107: "Where that process exits with a code other than 0 or cannot start, as where a file of the path cannot be read, it removes what the process left at the stage and copies the path there with …. On a volume that is not APFS and across volumes, `cp -c` exits 0 and copies the bytes itself."

frame/plan.md line 14: "On a volume that is not APFS, or across volumes, `cp -c` copies the bytes, so each creation waits on the full copy and each worktree holds a full copy on disk."

frame/plan.md line 57: "Where no clone can be made, as on another volume, `cp -c` writes the bytes and the path takes its own disk."
```

`gaps.md` row 15 is narrowed to what this round did not measure, a physical external disk and a network volume, and it cites this round for HFS+ and ExFAT.

## Confirmations

```seal
confirms: round-1#1
```
What holds: `copyIncluded` writes nothing through a link that the worktree's branch tracks. Round 1's probe, written again, gave `failed: [{ path: "apps/web/.env.local", why: "a link in the worktree leads its folder out of the worktree" }]`, and the outside folder stayed empty. Executed: the case "finding 1" of `test_tmp_round2.test.ts`, and `test/worktree-setup.test.ts`, which passed. The dangling-link half of `staysInside` (`worktree-setup.ts`, the `lstat` in its `catch`) was read.

```seal
confirms: round-1#2
```
What holds: a folder with one unreadable file leaves nothing in the worktree, with no staging folder left either, and the second copy copies it whole. The first copy failed with `EACCES` and left `[".git", ".gitignore", "README.md"]`. The second gave `copied: ["node_modules/"]` and all six files. Executed: the case "finding 2" of the probe file.

```seal
confirms: round-1#3
```
What holds: after a restart, the record reads `paneId: null`. The next daemon's first pane in the work item took id 1 and was labelled "Shell", and after `runSetup` that pane was still listed (`[[1,1,false],[2,2,false],[3,1,false]]`). Executed: the case "finding 3" of the probe file, sent with `setupCommand: "true\n"`, since a run again now carries the command shown. Finding 3 of this round takes the work-item check out of the same unit.

```seal
confirms: round-1#4
```
What holds: a creation that carries another command than the file's, or none, starts no setup pane. It fails with ".worktreesetup changed after the setup was shown, so no command ran." and runs nothing (`ran false`, one session). A creation that carries the file's text runs it (`ran true`, two sessions). The form refuses Create while `shownSetup` finds no plan for the field's text (`renderer.ts:1208-1213`), and `shownSetup` matches the plan by the field's trimmed text (`view.ts`, `planOf`). Executed: the case "finding 4" of the probe file, and `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/work-item-form.test.ts` alone, 8 cases passed. The plan's command is read by the same `readSetup` the creation's `beginSetup` reads (`daemon.ts:397`), so both see the text as it stands.

```seal
confirms: round-1#5
```
What holds: the section names the record's command whole (`.setup-command`, `white-space: pre-wrap`), and "Run setup again" carries `entry.workItem.setup?.command`, whole, as `setupCommand` (`shared.ts`, `detail`; `work-item-view.ts:784-787`). The daemon runs it only where the file still holds it. Executed: `node scripts/test-in-electron.mjs test/daemon.test.ts -t "setup"`, 15 cases passed, the run again case among them.

```seal
confirms: round-1#6
```
What holds: the docstrings of `state`, `exitCode` and `failure` in `protocol.ts:147-152` name the signal and the code 0 it reports, and the changed command. Read.

```seal
confirms: round-1#7
```
What holds: an ignored file in a folder the worktree lacks is cloned. The logging stand-in for `/bin/cp` recorded exit 0 for `scratch/.owlery-copy-…/.env`, and the worktree held `scratch/.env`. Executed: the case "finding 7" of the probe file.

```seal
confirms: round-1#8
```
What holds: a path that comes to stand during its copy is left as it is. The case "leaves a path that came to stand in the worktree during its copy as it is" passed in `test/worktree-setup.test.ts`, and `place` maps each refusal of a target that stands to `APPEARED`. Findings 1 and 2 of this round are new defects in the units this fix made.

What matched: the worktree's copy shares nothing with the main checkout's file. `place` hard-links the staging copy, not the source, and the staging folder then goes. After the copy, each file in the worktree had its own inode with a link count of 1, through the clone and through Node's copy alike. An edit to the main checkout's `.env` and to `node_modules/pkg/index.js` left the worktree's bytes as they were, and the reverse edit left the main checkout's bytes as they were. A 0600 `.env` kept 0600 through both routes, under umask 022. Executed: the cases "a copied file and the main checkout's file are two files" and "the mode of a 0600 .env" of the probe file.

What matched: a move across volumes. With the worktree on an HFS+ image, both paths were copied whole. So were both with the main checkout on HFS+ or on ExFAT and the worktree on APFS. The staging folder sits inside the target's own folder, so `rename` and `link` never cross a volume. Executed: the volume case of the probe file. Finding 2 is the one failure the case found.

What matched: the form and the section show the command whole. `#work-item-setup` and `.setup-command` keep line breaks (`white-space: pre-wrap`) and clip nothing (`index.html:422`, `index.html:166`), and a modal dialog scrolls. This answers `gaps.md` row 18 and the setup-line half of row 14 by reading. A `.worktreesetup` padded with blank lines puts the end of its command below the form's fold, where the person reads only its start. That is within what Q1's (a) accepts, "a person who does not read the form runs whatever the repository names", and the first line of such a file, as `pnpm install`, already runs the repository's code.

What matched: `shownCommand` (`daemon.ts:31-34`) reads any value that is not a string as none, so a client of an earlier build runs no command and fails closed with the changed-command sentence. The protocol's comment on `createWorkItem` says so.

Each new case of the diff was read against the cases of its function. The restart case of `daemon.test.ts` adds the next daemon's pane under the old id and a run again, which the case before it does not hold. The creation case "runs at a creation no command but the one the creation carries" holds that no setup pane starts, which `beginSetup`'s case cannot. The cases of `shownSetup`, of the section's command, and of the copy's link, stage, failure and race each hold a fact no other case holds. None repeats another.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck and the documents' checks of the `Broad gate` key at HEAD, labelled `unverified`. This round ran `worktree-setup`, `repositories` and `view` (440 cases), `daemon` with `-t "setup"` (15) and whole once under the mutant (241), and the built-app `work-item-form` alone (8) | `seal/config.json` `Broad gate` | the orchestrator's broad run |
| The built-app files other than `work-item-form.test.ts`, which the fix pass's `6fcf49d` changed (`ask-section`, `memory`, `korean-pane`, `notification-click`, `terminal-basics`, `work-item-menu`) and which `gaps.md` row 16 names | `seal/threads/1795339001-worktree-setup/gaps.md` | the orchestrator's broad run |
| A physical external disk and a network volume, which disk images do not stand for | `apps/desktop/src/daemon/worktree-setup.ts` `copyPath` | a measurement by the owner |
| Q2 and Q3, carried from round 1 | `seal/threads/1795339001-worktree-setup/frame/questions.md` | a measurement by the owner or the orchestrator |
| The integration with #119 after it merges and this branch is rebased, carried from round 1 | the rebased branch | the round after the rebase, which the orchestrator spawns |

The round leaves five findings open. Once a fix pass closes them, a verifying round reads that pass, and then the orchestrator's broad run and the sealer's spawn come due.

## Probes

| Command | Result |
|---|---|
| `git merge-tree --write-tree --name-only HEAD origin/release/v0.0.2` in the branch's worktree | exit 0: no conflict with `cbb2e69` |
| `node scripts/test-in-electron.mjs test/worktree-setup.test.ts test/repositories.test.ts test/view.test.ts` in `apps/desktop` of the round's scratch clone at `aa00677` | 3 files, 440 cases passed |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "setup"` | 15 passed, 226 skipped |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/work-item-form.test.ts`, alone | 8 cases passed |
| `PROBE_HFS=<HFS+ image> PROBE_EXFAT=<ExFAT image> node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts --silent=false --reporter=verbose`, the images made by `hdiutil create -fs HFS+` and `-fs ExFAT` and attached with `-nobrowse -mountpoint` under the round's scratch directory | 9 cases ran. Round 1's findings 1, 2, 3, 4 and 7 hold as written under `## Confirmations`. Through both routes each copied file had its own inode with a link count of 1, and an edit of either side left the other. While a clone ran in a repository that ignores `/.env` and `/node_modules`, `git status` printed `?? .owlery-copy-JUUsI9/.env` and `?? .owlery-copy-sPlpcZ/node_modules/pkg/index.js`, and `git add -A --dry-run` added both. With the worktree on HFS+, `/bin/cp -c` exited 0 for both paths and both were copied. With the worktree on ExFAT, `/bin/cp -c` exited 0, `node_modules/` was copied, and `.env` failed with `ENOTSUP: operation not supported on socket, link`. With the main checkout on either image and the worktree on APFS, both paths were copied |
| `node scripts/test-in-electron.mjs test/daemon.test.ts` with `prior?.info.workItemId === workItemId &&` removed from `daemon.ts:704`, then the line restored | 241 cases passed: the mutant survived |
