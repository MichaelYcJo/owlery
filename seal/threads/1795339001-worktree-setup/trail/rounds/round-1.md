# Review round 1: 1795339001-worktree-setup

```seal
target: 2d2e137 against a3e4e7a
```

The base is `origin/release/v0.0.2`, reviewed against its merge base with the branch, `a3e4e7a`. The base moved to `cbb2e69` with #36's merge, which changes documents alone. This is round 1, so no fact was carried from an earlier round. The coordinates of `trail/phases/phase-1.md` and `phase-2.md` were opened at the target rather than taken as read. No `seal/parity.json` and no `Pact` key stand, so neither the parity comparison nor the pact read applies.

The records read whole at `2d2e137`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` and `trail/phases/phase-2.md`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. `gaps.md` is new on this branch, so no row of it left.

The axes of this change, beyond the table's: what git's matcher selects; the path a target resolves to through links the worktree's branch tracks; what a failed copy leaves; the mode of a copied secret; the pane ids a setup record keeps across a daemon restart; what the person sees before a command the repository names runs with their rights; a pane's end and a signal; the window's words; and the merge with #119.

## Findings

### 1. The copy writes a person's ignored files outside the worktree where the worktree's branch tracks a link in the path

```seal
severity: must
location: `apps/desktop/src/daemon/worktree-setup.ts:108-130`, `apps/desktop/test/worktree-setup.test.ts`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round1_link.test.ts --silent=false --reporter=verbose` in the round's scratch clone at `2d2e137`; read `apps/desktop/src/daemon/worktree-setup.ts:110-125`
```

Why it matters: the target of each path is `join(worktree, path)` (`worktree-setup.ts:111`). The path comes from the main checkout, but the folders above it come from the new worktree's branch. Where that branch tracks a link at a folder of the path, `cp` and Node's `cp` both write through it. The probe tracked `apps` as a link to a folder outside both checkouts on the branch `linked`, kept `apps/web/.env.local` as an ignored file in the main checkout, and named `**/.env.local` in `.worktreeinclude`. `copyIncluded` answered `copied: ["apps/web/.env.local"]`, and the file `outside/web/.env.local` held `SECRET=main`. The clone failed on the missing folder, and Node's copy made `outside/web` through the link. A repository whose base branch tracks such a link can so place the person's `.env` in any folder the link names, a synced or a shared folder among them. `frame/design.md` *Scope* item 2 says the paths are copied "into the new worktree", and nothing in the code holds that. The `lstat` that skips a path that stands (`worktree-setup.ts:113`) follows the same links. The `rm` after a failed clone (`worktree-setup.ts:124`) does too, so it can remove what the clone wrote outside.

The fix checks, before any write, that the nearest folder of the target that stands lies inside the worktree once each link is read. It assumes `realpath` resolves every link of a folder that stands, as on macOS, and the root is read through `realpath` too, since macOS reaches its temporary folders through a link.

```ts
import { cp, lstat, readFile, realpath, rm, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, sep } from "node:path";

/** Whether the nearest folder of `target` that stands lies inside `root`, with each link read: a link the worktree's branch tracks can lead a path out of it. `root` is a real path. */
async function staysInside(root: string, target: string): Promise<boolean> {
  for (let folder = dirname(target); ; folder = dirname(folder)) {
    try {
      const inside = relative(root, await realpath(folder));
      return inside === "" || (inside !== ".." && !inside.startsWith(`..${sep}`) && !isAbsolute(inside));
    } catch {
      if (dirname(folder) === folder) return false;
    }
  }
}

// In copyIncluded, once, before the loop:
const root = await realpath(worktree);
// In the loop, first, before the lstat of the target:
if (!(await staysInside(root, target))) {
  failed.push({ path, why: "a link in the worktree leads its folder out of the worktree" });
  continue;
}
```

The docstring of `copyIncluded` gains a sentence that a path whose folder a link leads out of the worktree is listed as not copied. `worktree-setup.test.ts` owes a case built as the probe is.

```seal
verdict: fixed cae2aa2
answer: `copyIncluded` reads the worktree's real path once. Before any read or write of a target, it checks that the nearest folder of the target that stands lies inside the worktree once each link is read (`staysInside`). A path whose folder a link leads out is listed with "a link in the worktree leads its folder out of the worktree", and nothing is written. A folder that stands and cannot be read through, as a link to nothing, counts as leading out. The case "writes nothing through a link the worktree's branch tracks out of the worktree" tracks `apps` as a link on the worktree's branch, as the probe did. It was seen red against `2d2e137`'s code, which copied through the link. Its second half, a link to a folder that does not stand, was seen red with only the dangling-link guard removed. `seal mutate` was red for the inside test and for the dangling-link guard. The docstring names the refusal, and `changelog.md` line 6 says it from `27e04bf`.
```

### 2. A folder that failed to copy is left half copied, and running the setup again reads it as copied and reports success

```seal
severity: must
location: `apps/desktop/src/daemon/worktree-setup.ts:122-129`, `apps/desktop/test/worktree-setup.test.ts`, `seal/threads/1795339001-worktree-setup/changelog.md:11`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts --silent=false --reporter=verbose` in the round's scratch clone at `2d2e137`, the case "a folder holding one unreadable file"
```

Why it matters: where the clone of a folder fails, the code removes what the clone left and runs Node's copy (`worktree-setup.ts:124-125`). Where Node's copy fails as well, the catch lists the path and leaves whatever Node's copy wrote. The probe held `node_modules/pkg/` with five readable files and one of mode `000`. The first copy listed `node_modules/` as failed with `EACCES`, and the worktree kept `pkg/a.js` and `pkg/m.js` and nothing else. With the file made readable, a second `copyIncluded` gave `copied: []` and `failed: []`, since a path that stands is skipped (`worktree-setup.ts:112-117`). So "Run setup again" records `succeeded` over a `node_modules/` that lacks most of its files. *Scope* item 6 says a run again "copies what is missing", and `changelog.md` line 11 says the same to the person. The worktree the setup reports as ready is the one the issue names as the defect: a gate run in it fails for a reason that is not the work's.

```ts
    try {
      // Nothing stood at the target before the clone, so what a failed clone left there is its own.
      await rm(target, { recursive: true, force: true });
      await cp(source, target, { recursive: true, verbatimSymlinks: true, force: false, errorOnExist: false });
      copied.push(path);
    } catch (error) {
      // What a failed copy left is its own too, so a run again finds the path missing and copies it whole.
      await rm(target, { recursive: true, force: true }).catch(() => {});
      failed.push({ path, why: error instanceof Error ? error.message : String(error) });
    }
```

The docstring of `copyIncluded` (`worktree-setup.ts:94-95`) gains "and nothing of it is left in the worktree". `frame/design.md` *Data & interfaces*, the `copyIncluded` bullet, states the same at the settle. `worktree-setup.test.ts` owes a case of a folder with one unreadable file that reads the worktree after the failure and after a second copy. Where finding 8's staged copy is taken, it holds this finding too, since a failed stage is removed whole.

```seal
verdict: fixed 27e04bf
answer: Each path is copied into a folder of its own beside its place (`mkdtemp` of `.owlery-copy-`), cloned there or copied there by Node's copy, and moved into its place whole. That folder is removed in every case, so what a failed copy wrote goes with it. The folders made above the path go too, each where nothing else came to stand in it. The case "leaves nothing of a path it could not copy" holds a folder with one unreadable file and an unreadable file under a folder the worktree lacks. It reads the worktree after the failure and after a second copy, and was seen red against the code before the fix, which left `apps` and `node_modules`. `seal mutate` was red for the removal of the staging folder and for the removal of the made folders. The docstring and `changelog.md` line 6 say that nothing of a failed path is left.
```

### 3. After a daemon restart, a setup record names a pane id the next daemon gives to another pane, which then reads "Setup" and which "Run setup again" takes off the lists

```seal
severity: must
location: `apps/desktop/src/daemon/repositories.ts:158-162`, `apps/desktop/src/daemon/daemon.ts:697-698`, `apps/desktop/src/shared/protocol.ts:145`, `apps/desktop/test/daemon.test.ts:961`, `apps/desktop/test/repositories.test.ts:136`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts --silent=false --reporter=verbose` in the round's scratch clone at `2d2e137`, the case "a setup record's pane id after a daemon restart"; read `apps/desktop/src/daemon/daemon.ts:164`
```

Why it matters: pane ids are a count the daemon keeps in memory, `nextId = 1` (`daemon.ts:164`), so every daemon starts them again from 1. The store keeps a setup's `paneId` across the restart (`repositories.ts:158-162` changes only a running record's state and failure). In the probe, the first daemon gave the setup pane id 1. After the restart, the first pane the person opened in the same work item, a shell, was given id 1. `tabLabel` with the record's pane id labelled it "Setup", and so do the archive, removal and close dialogs, which pass the same id (`view.ts` `runningIn`, `work-item-view.ts` `closePane`). Then `runSetup` took that pane off the lists as "the earlier setup pane" (`daemon.ts:697-698`): the inbox after the answer listed panes 2 and 3 and no pane 1. That check reads the pane's liveness alone and not its work item. So the exited pane of another work item that happens to bear the id is removed too, with its output. Every work item with a setup meets this after any restart of the daemon, an update of the app among them. Phase 1 claims the record names the pane "whether or not the pane is still listed" (`trail/phases/phase-1.md` line 73), and no pane outlives the daemon that started it today (`frame/plan.md` *Judgments of the run*, first row, on #36).

```ts
/**
 * A setup as the store reads it at the daemon's start: none where the file
 * held none, a failed one where it was running, and in each case no pane:
 * the pane did not outlive the daemon that started it, and the next daemon
 * counts its pane ids from 1 again.
 */
function setupRead(setup: WorktreeSetup | null | undefined): WorktreeSetup | null {
  if (setup === undefined || setup === null) return null;
  const read = { ...setupOf(setup), paneId: null };
  return read.state === "running" ? { ...read, state: "failed", failure: DAEMON_STOPPED } : read;
}
```

```ts
            // The earlier setup pane of this work item, which has exited, leaves the lists, and the record names the new one.
            const before = earlier?.paneId ?? null;
            const prior = before === null ? undefined : this.sessions.get(before);
            if (prior !== undefined && prior.info.workItemId === workItemId && !prior.info.alive) this.sessions.delete(before!);
```

The fix pass also owes these statements: the docstring of `WorktreeSetup.paneId` (`protocol.ts:145`) gains "and null once the daemon that started the pane has stopped"; the docstring of the store (`repositories.ts`, the paragraph that says a running setup is read as failed) says the same; the case at `daemon.test.ts:961` expects `paneId: null`; and the case at `repositories.test.ts:136` expects `paneId: null` for both work items. A case of `daemon.test.ts` owes the probe's sequence: a restart, a pane that takes the old id, and a `runSetup` that leaves it listed.

```seal
verdict: fixed cc1aa17
answer: The store reads every setup with `paneId: null` (`repositories.ts#setupRead`), and its docstrings and the protocol's `paneId` docstring say why. `runSetup` takes the earlier setup pane off the lists only where it is this work item's and has exited. The cases at `daemon.test.ts:961` and `repositories.test.ts:136` expect no pane. A new case of `daemon.test.ts` runs the probe's sequence: a restart, a pane that takes the old id, and a run again that leaves it listed. Each was seen red against `2d2e137`'s store, and `seal mutate` of `setupRead` was red. `c711279` corrects a third case of `repositories.test.ts` that still expected the stored pane id. The work-item check survived `seal mutate`. Once the store names no pane, a record names only a pane its own work item's setup started, so no case reaches the check. It was kept because the spawn asked for it, and `gaps.md` names it.
```

### 4. The form does not always name the command before the person presses Create, and the creation runs the command the file holds then, not the one shown

```seal
severity: must
location: `apps/desktop/src/renderer/renderer.ts:1200-1216`, `apps/desktop/src/renderer/renderer.ts:1469-1473`, `apps/desktop/src/daemon/daemon.ts:366`, `apps/desktop/src/shared/protocol.ts`, `seal/threads/1795339001-worktree-setup/changelog.md:8`, `seal/threads/1795339001-worktree-setup/pr.md:12`
evidence: read `apps/desktop/src/renderer/renderer.ts:111`, `apps/desktop/src/renderer/renderer.ts:1167-1187`, `apps/desktop/src/renderer/renderer.ts:1200-1216`, `apps/desktop/src/renderer/renderer.ts:1469-1473`, `apps/desktop/src/renderer/renderer.ts:1505-1509`, `apps/desktop/src/renderer/view.ts:1525-1527`, `apps/desktop/src/daemon/daemon.ts:366`
```

Why it matters: Q1's default (a) stands on one statement. `frame/questions.md` Q1 gives it as "the 'New work item' form naming the command before the person presses Create". `changelog.md` line 8 and `pr.md` line 12 tell the person "the form names the command under the folder before you press Create". The code does not hold it in two cases. First, an input in the folder field clears the plan the form shows (`renderer.ts:1469-1473`). The plan is asked again only after 150 ms with no typing (`PLAN_WAIT_MS`, `renderer.ts:111`) and shown when git answers. `createWorkItem` (`renderer.ts:1200-1216`) does not wait for that answer, and the form's submit calls it at once (`renderer.ts:1505-1509`). So a person who types or pastes a folder and presses Return creates the work item, and the repository's command runs with their rights, while the form names no command. Second, the creation reads `.worktreesetup` again (`daemon.ts:366`). A file that changed after the plan was shown, as after a `git pull` in the main checkout, runs a command the form never named. The same file already guards the rename dialog this way: its choice "is off until the daemon answers for this one" (`renderer.ts`, the `renameField` listener). This is a compliance defect of *Scope* item 7, and the only consent the default keeps.

The fix has two parts. First, the form creates nothing until it holds the plan of the folder its field holds, as the rename dialog does. Second, the creation carries the command the form showed, and the daemon runs the setup only where the file still holds that text.

```ts
// view.ts, beside planLine: the setup the form shows for the field's text, or null while it shows none.
export function shownSetup(plan: FormPlan | null, repo: string): { setupCommand: string | null } | null { // NAME NOT IN TREE — new export
  const shown = planOf(plan, repo);
  return shown === null || "error" in shown ? null : { setupCommand: shown.setupCommand };
}

// renderer.ts, createWorkItem, before the request is made:
  // The setup runs only as the form named it, so nothing is created before the plan of this folder is answered.
  const shown = shownSetup(formPlan, repoField.value);
  if (shown === null) {
    formError.textContent = "Wait until the form says what this folder's setup runs.";
    return;
  }
  send({ type: "createWorkItem", requestId, ...fields, kind: kind.kind, ...startSize(), setupCommand: shown.setupCommand });

// daemon.ts, createWorkItem: the command the form showed reaches the setup.
            const setup = await beginSetup(place.repo, place.worktree, this.options.now ?? Date.now, message.setupCommand);

// worktree-setup.ts, beginSetup gains `shown?: string | null`, and after readSetup:
  if (shown !== undefined && named.command !== shown) {
    return endedSetup({ ...begun, command: named.command }, { exitCode: null, failure: `${SETUP_FILE} changed after the form showed it, so nothing ran.` }, now());
  }
```

The fix pass also owes these statements: `createWorkItem` in `protocol.ts` gains `setupCommand?: string | null` and its comment; `frame/design.md` *Scope* item 7 and *Data & interfaces* say the creation carries the command shown; `changelog.md` line 8 and `pr.md` line 12 stay true once the code holds them. It also owes a case of `view.test.ts` for `shownSetup`, one of `daemon.test.ts` for a file changed after the plan, and the built-app case of `work-item-form.test.ts` for a Create pressed before the plan answers. Whether the default (a) is enough at all is the owner's (`## Not judged`).

```seal
verdict: fixed a3d9630
location: `apps/desktop/src/renderer/view.ts`, `apps/desktop/src/daemon/worktree-setup.ts`, `apps/desktop/test/worktree-setup.test.ts`, `apps/desktop/test/daemon.test.ts`, `apps/desktop/test/view.test.ts`, `apps/desktop/test/work-item-form.test.ts`, `apps/desktop/test/korean-pane.ts`
answer: The form creates nothing while `shownSetup` finds no plan for the field's text, and says "Wait until the form shows what this folder's work item gets, its setup among it." A creation carries `setupCommand`, the command the form named, or null where the plan was refused. `beginSetup` takes the command shown. Where `.worktreesetup` holds another, or holds one where none was shown, or none where one was, the copy still runs and no command runs. The setup then fails with ".worktreesetup changed after the setup was shown, so no command ran." and names the command the file holds. A creation that carries no `setupCommand` runs no command, and `startSetup` starts a pane only for a setup that is `running`. Seen red against the code before the fix: the `beginSetup` case, the daemon's creation case, and the built-app case of `work-item-form.test.ts`, whose Create after a key in the folder field created the work item. `seal mutate` was red for the comparison, for the reading of an absent field, for the running-only start, for `shownSetup` and for the form's refusal. `6fcf49d` makes the built-app helpers and cases that press Create wait for the plan, since `daemon-restart.test.ts` failed on the refusal without it. `changelog.md` line 8 states the rule, and `protocol.ts` comments the field. `pr.md` line 12 and the frame are the orchestrator's.
```

### 5. "Run setup again" runs whatever `.worktreesetup` holds at the press, and nothing in the view names that command

```seal
severity: should
location: `apps/desktop/src/renderer/shared.ts:307`, `apps/desktop/src/renderer/view.ts`, `apps/desktop/src/daemon/daemon.ts:692`
evidence: read `apps/desktop/src/renderer/shared.ts:300-315`, `apps/desktop/src/renderer/view.ts` `setupSection`, `apps/desktop/src/daemon/daemon.ts:688-692`
```

Why it matters: `runSetup` reads the repository's files at the press (`daemon.ts:692`), as *Scope* item 6 and the protocol's comment state. The button's title tells the person "run the command again" (`shared.ts:307`), which reads as the command that ran before. The "Setup" section names no command at all: `setupSection` gives how the command ended and the paths, and not the command. So a press after the main checkout's `.worktreesetup` changed runs a command the person was never shown, with their rights. The form's statement, which the default of Q1 rests on, has no counterpart here.

```ts
      button.title = "Copy what is missing from the main checkout and run the command .worktreesetup holds now, in a new pane";
```

The section also names the command the record holds, so the person reads what ran. `SetupSection` gains `command: string`, the record's command trimmed or an empty string, and `detail` draws it under the sentence, after the words "Ran:", where it is not empty. A case of `view.test.ts` pins the field. Whether a run again also waits for the person to read the new command is the same question as Q1 (`## Not judged`).

```seal
verdict: fixed a3d9630
location: `apps/desktop/src/renderer/work-item-view.ts`, `apps/desktop/src/renderer/index.html`, `apps/desktop/src/shared/protocol.ts`, `apps/desktop/test/view.test.ts`, `apps/desktop/test/work-item-form.test.ts`
answer: The section names the command the record holds as "Command: <command>" (`SetupSection.command`). "Run setup again" carries that command, whole, as `runSetup.setupCommand`, and the daemon runs it only where `.worktreesetup` still holds it, by finding 4's comparison. Where the file holds another, nothing runs and the record names the new command, so the section shows it and the next press runs it. The button's title is `RUN_SETUP_SAYS`. The paste-ready "Ran:" was not taken, since the command the section names is the one the press runs. The `setupSection` cases were seen red against the old view, and the built-app case reads the command line. `seal mutate` was red for the section's command, for the press's carried command and for the drawn line. Whether a run again should also wait for the person to read a new command stays where the round's *Not judged* row puts it.
```

### 6. The protocol's docstrings of `state` and `failure` leave out the signal that phase 2 added to the success test

```seal
severity: should
location: `apps/desktop/src/shared/protocol.ts:147`, `apps/desktop/src/shared/protocol.ts:151`
evidence: read `apps/desktop/src/shared/protocol.ts:147-151`, `apps/desktop/src/daemon/daemon.ts` `setupExited`, `seal/threads/1795339001-worktree-setup/trail/phases/phase-2.md:17`
```

Why it matters: phase 2 made a setup whose process a signal ended `failed`, with the sentence `The setup command was ended by <signal>.`, and its exit code then reads 0 (`trail/phases/phase-2.md` line 17). `frame/plan.md` *Judgments of the run*, last row, says the frame's statements on the success test were rewritten to the code. The protocol's docstrings were not. `state` says "`succeeded` where the command exited with 0", and a client that reads it treats a command killed by a signal, exit code 0, as a success. `failure` lists its causes without the signal. A client of the daemon is an agent's to write, the phone's first among them, and it acts on these lines.

```ts
  /** `running` from the pane's start until its process exits. `succeeded` where the command exited with 0 and no signal ended it, or no command stands, and no copy failed and the daemon did not end the pane; `failed` otherwise. A process a signal ended reports the code 0. */
  state: "running" | "succeeded" | "failed";
  /** Why the setup failed where the exit code does not say it, as a sentence the window shows as it is: the pane ended before its command did, a signal ended the command, the daemon stopped, a git command failed, or the file or the shell could not be read or started. Null otherwise. */
  failure: string | null;
```

```seal
verdict: fixed 63816c8
answer: The docstrings of `state`, `exitCode` and `failure` in `protocol.ts` name the signal and say that a process a signal ended reports the code 0. They also name the failure of a `.worktreesetup` that changed after it was shown. A `git grep` of the success test's wording over `apps/desktop/src` and `apps/desktop/test` found no other statement that leaves the signal out.
```

### 7. A path whose folder the worktree lacks is never cloned, though the changelog and the pull request text say each path is cloned on APFS

```seal
severity: should
location: `apps/desktop/src/daemon/worktree-setup.ts:118`, `seal/threads/1795339001-worktree-setup/changelog.md:7`, `seal/threads/1795339001-worktree-setup/pr.md:8`
evidence: executed `/bin/cp -c -R -P` of a file to a target whose folder does not stand, in the round's scratch directory, which exited 1 with "clonefile failed: No such file or directory"; executed `node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts --silent=false --reporter=verbose`, the case "an ignored file inside an untracked folder", which copied `scratch/.env`
```

Why it matters: `cp` does not make the folders above its target. An ignored file inside a folder the worktree lacks, such as `scratch/.env` in a folder git does not track, or `apps/web/.env.local` where the base branch lacks `apps/web`, fails its clone every time. Node's copy then writes the bytes, since it makes the folders. So the copy is right and the clone is never used there. `changelog.md` line 7, "The copy clones each path on APFS", and `pr.md` line 8, "on APFS each path is cloned with `/bin/cp -c`", tell the person something the code does not do for such a path. The cost is a second process and a full copy of the bytes per such path. That is small for a `.env` file and large for a folder.

```ts
import { cp, lstat, mkdir, readFile, realpath, rm, stat } from "node:fs/promises";

    // The folders above the target are the worktree's, inside it by `staysInside` (finding 1): `cp` makes none of them.
    await mkdir(dirname(target), { recursive: true });
    if (await cloned(clone, source, target)) {
```

The `mkdir` must follow finding 1's check, since `mkdir` follows links too. Without the `mkdir`, the changelog and `pr.md` lines owe "where the worktree holds the path's folder".

```seal
verdict: fixed cae2aa2
answer: The folders the worktree lacks above a path are made after finding 1's check and before the clone, so `cp -c` clones such a path too. The case "clones a path whose folders the worktree lacks" runs a clone that leaves a mark where it fails. It was seen red against `2d2e137`'s code, where the clone of `apps/web/.env.local` failed. `seal mutate` of the `mkdir` was red. `changelog.md` line 7 and `pr.md` line 8 are true as they stand.
```

### 8. A run again copies while the person's panes run in the worktree, and a failed clone's removal can take a path that appeared after the check

```seal
severity: should
location: `apps/desktop/src/daemon/worktree-setup.ts:112-125`, `apps/desktop/src/daemon/daemon.ts:692`
evidence: read `apps/desktop/src/daemon/worktree-setup.ts:112-125`, `apps/desktop/src/daemon/daemon.ts:681-710`
```

Why it matters: at a creation no pane runs while the copy writes. At a `runSetup`, the person's panes are alive in the worktree (`daemon.ts:681-710` ends none). `copyIncluded` checks the target with `lstat`, then runs `cp`, and where `cp` fails it removes the target whole (`worktree-setup.ts:124`), on the grounds that "Nothing stood at the target before the clone". A `node_modules/` that a `pnpm install` in the person's pane makes between the `lstat` and the clone fails that ground. `cp -R` into a folder that stands also copies the source inside it, as `node_modules/node_modules`. The removal then deletes what the person's command made. `docs/product.md` *What we deliberately don't do* says Owlery deletes nothing of a person's work without that person's word.

The fix writes each path to a sibling name of its own and moves it into place only where the target still does not stand. A removal then touches only the stage, and finding 2's leftovers go with it. It assumes the stage is on the worktree's volume, which a sibling is, so `rename` does not cross volumes.

```ts
    const stage = `${target}.owlery-${process.pid}-${Date.now()}`;
    try {
      if (!(await cloned(clone, source, stage))) {
        await rm(stage, { recursive: true, force: true });
        await cp(source, stage, { recursive: true, verbatimSymlinks: true, force: false, errorOnExist: false });
      }
      // A path that appeared during the copy is the person's, and is left as it is.
      if (await lstat(target).then(() => true, () => false)) throw new Error("the path appeared in the worktree during the copy");
      await rename(stage, target);
      copied.push(path);
    } catch (error) {
      await rm(stage, { recursive: true, force: true }).catch(() => {});
      failed.push({ path, why: error instanceof Error ? error.message : String(error) });
    }
```

A window between the second `lstat` and the `rename` remains. A `rename` over a folder that stands and is not empty fails, and over a file that stands it replaces the file. The fix pass says in its answer whether that window is accepted.

```seal
verdict: fixed 27e04bf
answer: The copy is written in a folder of its own beside the target and moved into place. A folder moves by `rename`, which refuses a file and a folder that is not empty. A link is made again and a file is hard-linked, and each refuses whatever stands. A path that came to stand meanwhile is left as it is and listed with "it came to stand in the worktree during the copy, and was left as it is", and a removal touches only the staging folder. The case "leaves a path that came to stand in the worktree during its copy as it is" makes `.env` and `node_modules/made/file` during a clone that fails. It was seen red against the code before the fix, which removed both. `seal mutate` was red for the hard link, for the folder's move, for the reading of the refusal and for the link's remaking. The window that remains is accepted: `rename` takes the place of a folder that came to stand empty, so nothing the person wrote is lost there, and Node offers no move that refuses an empty folder. `gaps.md` *Not done* says so.
```

## Confirmations

What matched: *Scope* item 2's matcher. `copyIncluded` lists paths with `git ls-files --others --ignored --exclude-from=<main checkout>/.worktreeinclude --directory -z`, keeps those `git check-ignore --stdin -z` prints, and runs git with arguments and never a shell (`worktree-setup.ts:100-105`). The tracked `.env.example` and the untracked `notes.txt` are not copied, and the folder `node_modules/` is one path. Executed: `node scripts/test-in-electron.mjs test/worktree-setup.test.ts test/pty.test.ts`, 26 cases passed.

What matched: a secret keeps its mode. A `.env` of mode 0600 was 0600 in the worktree through the clone and through Node's copy, under umask 022. Executed: the probe case "the mode of a 0600 .env".

What matched: a link inside a copied folder stays a link with its target as written (`worktree-setup.test.ts`, the link cases), read and executed in the run above. A top-level link with a relative target therefore points elsewhere from the worktree, which *Scope* item 2 states ("A link is copied as a link").

What matched: a setup pane's end. A pane the person closes and a work item archived during the command make the setup `failed` with "The setup pane ended before its command did." (`daemon.ts` `close` case and `endSessions`, which set `ended` before the kill). Another pane's exit leaves a running setup as it is, through the check of the pane's id. A command a signal ended is `failed` with "The setup command was ended by SIGTERM." (`pty.ts` `onExit` passes `signal ?? 0`). The daemon's own close records nothing, and the next daemon reads a running setup as "The daemon stopped before the setup command ended." Executed: `node scripts/test-in-electron.mjs test/daemon.test.ts -t "the setup of a new worktree"`, 13 cases passed, and the pty case in the run above.

What matched: the double press. `gaps.md` *Not done* claims the second `runSetup` is refused with `The setup of work item <id> is still running.`. `daemon.ts:691` refuses a record that reads `running`, and both presses wait in the `changing` chain, so the second is read after the first's pane started. The claim holds where the first command still runs at that moment. A command that ended before the second press is read runs a second time. That is harmless and is what a second press asks.

What matched: the window's words. `setupMark` gives "Setting up" and "Setup failed" and an empty string otherwise. The part is hidden where it is empty (`index.html`, `.line .setup:empty`) and coloured as a failure where the setup failed. `setupSection` gives the daemon's sentence where one stands, `The command has run for <age>.` while it runs, and "No command runs: .worktreesetup names none." for a copy alone. `planLine` gives "Copies the ignored files .worktreeinclude names from the main checkout." and `Then runs: <command>`. Read in `view.ts` and `shared.ts`. Executed: `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/work-item-form.test.ts`, 8 cases passed.

What matched: a huge folder. The copy waits in the `changing` chain before the creation answers, so a large folder on a volume where the clone fails delays every creation and delete behind it. `frame/plan.md` *Technical context*, its failure scenario and *Operational impact* state that cost and accept it. The form's sentence "Copies the ignored files .worktreeinclude names" warns the person before Create.

What matched: scenario 15. `.worktreesetup` at the repository's top holds `pnpm install` and a newline, and no `.worktreeinclude` is added (*Scope* item 11). Read in the diff.

What matched: #119's overlap. `feat/119-no-question-holds-an-agentic-run` at `6485045` is not merged into the base. A trial `git merge-tree --write-tree` of it with the target conflicts in ten files: `daemon.ts`, `last-look.ts`, `index.html`, `list.ts`, `shared.ts`, `work-item-view.ts`, `protocol.ts`, `daemon.test.ts`, `last-look.test.ts` and `view.test.ts`. The hunks read are adjacent additions at the places `frame/plan.md` *Overlap with the release* and the phases' *What touches #119's coordinates* name: an import line, the end of `WorkItem`, and `detail`'s third parameter. The import lines of `daemon.ts`, which conflict, are not on phase 1's list. That is no finding, since a merge shows its own conflicts. Executed in the round's scratch clone.

The case gaps the build disclosed hold no fact the frame states, and they open no finding: the `force: false` passed to Node's copy and the `resolve(false)` of the clone's `error` listener are pinned by no case (`trail/phases/phase-1.md` line 18, `phase-2.md` line 55). Each new case of the diff was read against the cases of the function it covers, and none repeats one.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a command a repository names may run with the person's rights at a creation with no confirmation of its own, Q1's default (a). No section of `docs/product.md` or `docs/architecture.md` decides it. The nearest are `docs/product.md` *What we deliberately don't do* on deleting nothing without the person's word, and `docs/roadmap.md` *Milestones* row 1, "Owlery never turns a permission check off". `docs/architecture.md` line 35 records that Claude Code asks whether to trust a folder before it runs, and Owlery's setup runs in that folder before any such question. Finding 4 is a defect of (a) as built; this row is whether (a) is enough | `seal/threads/1795339001-worktree-setup/frame/questions.md` Q1 | the owner |
| Q2, `pnpm install` through the person's login shell in a worktree the built app makes, and the daemon's fallback to `setupPaneCommand(process.env, …)`, which no case runs | `seal/threads/1795339001-worktree-setup/gaps.md` | a measurement by the orchestrator or the owner |
| Q3, whether Claude Code reads `.worktreeinclude` by git's rule | `seal/threads/1795339001-worktree-setup/frame/questions.md` Q3 | a measurement by the owner |
| The clone on a volume that is not APFS, and across volumes | `apps/desktop/src/daemon/worktree-setup.ts` `cloned` | a measurement by the owner |
| The integration with #119 after it merges and this branch is rebased, which `frame/plan.md` *Overlap with the release* puts in this work's rounds | the rebased branch | the round after the rebase, which the orchestrator spawns |
| The suite, the typecheck and the documents' checks of the `Broad gate` key at HEAD, labelled `unverified`. This round ran four narrow files and two probe files | `seal/config.json` `Broad gate` | the orchestrator's broad run |
| The built-app files other than `work-item-form.test.ts`, and the flaky count case of `gaps.md` | `seal/threads/1795339001-worktree-setup/gaps.md` | the orchestrator's broad run |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts` in `apps/desktop` of the round's scratch clone at `2d2e137` | 4 cases passed, and Vitest printed none of the cases' console lines |
| The same file again with `--silent=false --reporter=verbose`, the first run's lines being lost | A folder with one file of mode `000`: the first copy failed with `EACCES` and left `pkg/a.js` and `pkg/m.js`, and a second copy gave `copied: []`, `failed: []`. A `.env` of mode 0600 was 0600 through the clone and through Node's copy, under umask 022. An ignored `scratch/.env` in an untracked folder was copied. After a restart, the setup record kept `paneId: 1`, the person's new shell pane got id 1 and `tabLabel` labelled it "Setup", and after `runSetup` the inbox listed panes 2 and 3 and no pane 1 |
| `node scripts/test-in-electron.mjs test/test_tmp_round1_link.test.ts --silent=false --reporter=verbose` | `copied: ["apps/web/.env.local"]`, and the file stood outside both checkouts, at the folder the tracked link `apps` names, holding `SECRET=main` |
| `/bin/cp -c -R -P` of a file to a target whose folder does not stand | exit 1, "clonefile failed: No such file or directory" |
| `git merge-tree --write-tree --name-only` of `feat/119-no-question-holds-an-agentic-run` and the target | exit 1, ten files in conflict, named under `## Confirmations` |
