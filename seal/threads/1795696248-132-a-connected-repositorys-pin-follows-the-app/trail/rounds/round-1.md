# Review round 1: 1795696248-132-a-connected-repositorys-pin-follows-the-app

```seal
target: a7042c65 against release/v0.0.5
```

The round read the branch against its merge base with `origin/release/v0.0.5`, `f683c693`, which the branch merged at `3a884123`. It read the code diff `3a884123..a7042c65` and, whole at `a7042c65`, `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md` and `trail/phases/phase-2.md`. No `pr.md` and no `pr.<lang>.md` stand at the target, and no earlier round record stands, so no coordinate or verdict was carried from a round. The phases' mutation runs and their seen-red runs are the crafter's account and were not run again; they are read as claims below.

Stage 1 walked *Scope* items 1 to 11 against the code. Each item is built as the frame states it, and the departures each phase record names hold against the code and are grounded. The findings below are the places where the build tells the person or the next reader something the code does not do, and where the overwrite of the workflow is left open to an edit it could refuse.

A gap with no finding: `Daemon#unreadRecords` filters out an archived work item, a work item with no branch and a work item whose head the daemon has not read (`apps/desktop/src/daemon/daemon.ts:2893-2896`). *Scope* item 6 states all three, and no case holds any of them. Scenario G names none of them, and `trail/phases/phase-1.md:26` says so.

## Findings

### 1. A work item whose records the daemon could not read is dropped, and the dialog then says the readers refuse no work item's records

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:2892-2907`, `apps/desktop/src/renderer/view.ts:2683-2693`, `apps/desktop/test/daemon.test.ts`
evidence: read `apps/desktop/src/daemon/daemon.ts:2892-2907`, `apps/desktop/src/renderer/view.ts:2683-2693`; executed `git grep -n -F "refuse no work item" -- apps docs seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app`
```

Why it matters: the routing names this risk as the reason for the review chain. A person must not move the pin past records the new check refuses. The dialog is the only thing that tells them, before the move, which open work items the new check may refuse.

Claimed in `trail/phases/phase-1.md:11`: "A work item whose reading throws anything other than a `ChainStop` is left out and logged, the way `Daemon#sealAt` handles one." The code does that. `daemon.ts:2901-2904` catches the error, logs it to the daemon's console, and returns null, and `daemon.ts:2907` filters the null out. The plan's `unread` then holds no entry for that work item. Where no other entry stands, `view.ts:2693` shows "Owlery read the round records, the broad gate's run and the guarantee of each work item of this repository at its branch's head … They refuse no work item's records". For the dropped work item both sentences are false. Nothing was read, and nobody knows whether its records would be refused. `Daemon#sealAt` can leave a work item out because leaving it out draws no seal and makes no claim. Here the omission turns into a positive claim the person acts on.

The `git grep` printed `view.ts:2693` and `view.test.ts:5217` and `:5219`, which pin the sentence for an empty list. That is a sample: a statement of the same fact in other words escapes it. `changelog.md:8` says Owlery "names each work item whose records they refuse", which stays true once the fix lands.

The fix names the work item with the reason it was not read, so the sentence "They refuse no work item's records" is shown only where every work item was read. A case of `daemon.test.ts` should hold it. For example, the work item's worktree is removed after its head is read, so that `refusedAt` throws through git rather than through a `ChainStop`. That case must be shown red against the code at the target.

```ts
    const read = await Promise.all(
      items.map(async (item) => {
        const head = this.branches.get(item.id)?.head;
        if (head === undefined) return null;
        try {
          const why = await refusedAt(item, head);
          return why === null ? null : { id: item.id, title: item.title, why: cutText(why) };
        } catch (error) {
          const said = error instanceof Error ? error.message : String(error);
          console.error(`the records of work item ${String(item.id)} were not read for the move of the check: ${said}`);
          // Named, not dropped: the dialog's sentence that the readers refuse no work item's records holds only where each one was read.
          return { id: item.id, title: item.title, why: cutText(`Owlery could not read these records, so whether the moved check refuses them is not known: ${said}`) };
        }
      }),
    );
```

The fix pass also owes the docstring of `unreadRecords` (`daemon.ts:2883-2890`, "one whose reading git could not finish is left out, which the log says"), `protocol.ts`'s comment on `RecordsPlan.unread`, and `frame/design.md` *Scope* item 6. Each of them states which work items the list holds.

### 2. The head of the dialog's list of named work items draws as body text, the same as the titles under it

```seal
severity: should
location: `apps/desktop/src/renderer/index.html:1131`, `docs/design.md:443`, `docs/design.ko.md:443`
evidence: read `apps/desktop/src/renderer/index.html:71`, `apps/desktop/src/renderer/index.html:543`, `apps/desktop/src/renderer/index.html:563`, `apps/desktop/src/renderer/index.html:1091`, `apps/desktop/src/renderer/index.html:1131`, `apps/desktop/src/renderer/renderer.ts:1399-1410`
```

Why it matters: `gaps.md:10` leaves the drawing of a named work item to this review. No case and no shot shows it. `renderer.ts:1399-1410` draws each entry as an `li` holding a `span.name` and a `span.why`. The rules at `index.html:586-589` draw the title in the dialog's ink and the sentence in `--ink-muted` at `--size-second`, both whole, as the row in `docs/design.md:443` states. The head does not draw as a head. `index.html:1131` gives `#records-unread-head` no class. `index.html:71` resets every `h3` to the inherited size and weight. `index.html:543` gives the dialog the inherited colour, and `index.html:563` adds only a margin. So "Work items whose records Owlery's readers refuse" is drawn in the same face, size, weight and ink as the title "Refused work" under it. It reads as the first entry of the list, with no reader's sentence below it. Every other head of a list in a dialog is the caption: "Work items that leave the lists" at `index.html:1091`, and the heads at `:802`, `:990` and `:998`. The row of `docs/design.md:443`, and the same row of `docs/design.ko.md:443`, states the entries' form and not the head's. Principle 8 asks that the form be stated.

```html
          <h3 id="records-unread-head" class="caption" hidden></h3>
```

The two rows each gain the head, in place. In `docs/design.md:443`, "and under it each work item whose records the app's readers refuse" becomes "and under it, under the caption "Work items whose records Owlery's readers refuse", each work item whose records the app's readers refuse". In `docs/design.ko.md:443`, "그 아래에 앱의 읽기 도구가 기록을 거절하는 작업마다" becomes "그 아래에 "Work items whose records Owlery's readers refuse"라는 캡션을 두고, 앱의 읽기 도구가 기록을 거절하는 작업마다".

### 3. An edit saved while the setup re-plans is written over and committed, and the closing memo puts the window in the wrong place

```seal
severity: should
location: `apps/desktop/src/daemon/records-place.ts:568-586`, `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/gaps.md:15`
evidence: read `apps/desktop/src/daemon/records-place.ts:477`, `apps/desktop/src/daemon/records-place.ts:486-490`, `apps/desktop/src/daemon/records-place.ts:502`, `apps/desktop/src/daemon/records-place.ts:509`, `apps/desktop/src/daemon/records-place.ts:568-586`
```

Why it matters: the move is the one write Owlery makes over a person's committed file. The routing asks that no pin be moved without the person reading it. An edit that this write replaces is lost from the working tree and is not in any commit.

Claimed in `gaps.md:15`: the window lies "in the milliseconds between `setUpRecords`'s second `planRecords` and its `writeFileSync`", and a second hash before the write "would narrow that window and not close it, so it was not added". The code shows otherwise. After `planRecords` returns at `records-place.ts:568`, nothing awaits before `readFileSync` and `writeFileSync` at `:584-585`, so no other code of the daemon runs there. The window lies inside `planRecords` instead. It opens where `git hash-object` reads the checkout's file at `:477`. It stays open through the git processes the plan starts after that: the reads of each `README.md` and of `hygiene.yml` at `:486-490`, and the two `check-ignore` runs at `:502` and `:509`. On a loaded Mac that is tens of milliseconds or more. A comparison that needs no git closes that window. Read the file's bytes before the second plan, and refuse the write where the bytes read just before it differ. An edit saved before the hash makes the plan block. An edit saved after the hash makes the two reads differ. Only the two system calls of one synchronous step are left between the read and the write.

```ts
export async function setUpRecords(folder: string, broadGate: string, version: string, stamp: string, limitMs?: number): Promise<void> {
  // The moved workflow's bytes before the plan compares the file with the commit's. The write below goes ahead only where the file still holds them, so an edit saved while the plan runs git is refused, not replaced. Precondition: the plan refuses a link at the path (`standsAsFile`), so this read follows none.
  const beforePlan = ((): Buffer | null => {
    try {
      return readFileSync(join(folder, WORKFLOW));
    } catch {
      return null;
    }
  })();
  const plan = await planRecords(folder, broadGate, version);
```

```ts
      if (plan.move !== null && path === WORKFLOW) {
        const bytes = readFileSync(join(folder, path));
        if (beforePlan === null || !bytes.equals(beforePlan)) throw new Error("The repository changed since the plan was read. Read the plan again.");
        // The plan found the checkout's file as the commit holds it, so what is written back is the commit's text as the checkout holds it.
        replaced = { path, bytes };
        writeFileSync(join(folder, path), text);
        continue;
      }
```

The refusal is thrown before `replaced` is set and before anything is staged, so the cleanup writes nothing back and unstages nothing. The fix pass rewrites `gaps.md:15` in place. The docstring of `setUpRecords` at `records-place.ts:546-557` gains the sentence that the move is refused where the workflow changed while the plan was made again. A case of `records-place.test.ts` cannot time an edit inside the plan's git runs. The fix pass therefore says how it showed the refusal red, or leaves that as a row of `gaps.md` *Not verified*.

### 4. The docstring of `planRecords` still says Owlery's workflow is kept wherever the commit holds it, and that the arms read every path the plan writes

```seal
severity: should
location: `apps/desktop/src/daemon/records-place.ts:376-379`, `apps/desktop/src/daemon/records-place.ts:409-414`
evidence: executed `git grep -n "a path the plan writes\|The workflow that is kept" -- apps/desktop/src`; read `apps/desktop/src/daemon/records-place.ts:381-387`, `apps/desktop/src/daemon/records-place.ts:493-499`
```

Why it matters: the first *Removes* row of `frame/design.md` says the sentence "The workflow that is kept is Owlery's where the commit holds it as a file …" is "Rewritten in place". It still stands unchanged at `records-place.ts:376-379`. The build wrote the move as a new paragraph after it, at `:381-387`, which leaves both statements for the next reader to choose between (contract rule 19). The same docstring's list of what blocks a plan, at `:409-414`, still names "a folder above a path the plan writes" and "a link, a submodule or a folder at a path the plan writes". The code at `:493-499` reads `created` for both, and the moved workflow is a path the plan writes that `created` leaves out. The `git grep` printed lines 376, 411 and 413 of `records-place.ts` and nothing else under `apps/desktop/src`. That is a sample: a statement of the same fact in other words escapes it.

```ts
 * holds nothing at or below. The workflow that is kept is Owlery's where
 * the commit holds it as a file and the plan does not move its check, or
 * AgenticSeal's `hygiene.yml` where the commit's text of it runs the
 * check, and Owlery's is planned where the commit holds neither.
```

```ts
 * checkout, the index or the commit; something other than a folder is at a
 * folder above a path the setup creates, in the same three; the disk finds a
 * path the setup needs under the same name in other letters; the commit
 * holds a link, a submodule or a folder at a path the setup creates; the
```

With these two edits, the last sentence of the paragraph at `:381-387`, "the arms on folders, letters and what the commit holds read the files the setup creates alone", repeats the list. The fix pass may cut it to "The moved workflow is compared below as a kept file."

### 5. `frame/plan.md` dates the milestone a day before the routing does

```seal
severity: should
location: `seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/frame/plan.md:50`
evidence: executed `grep -rn "11-28\|11-29" seal/threads/1795696248-132-a-connected-repositorys-pin-follows-the-app/`
```

Why it matters: `d41cefea` changed `routing.md:16` to "the minimum for Owlery to be published, on Sunday 2026-11-29". The row for #223 in *Overlap with the release* at `frame/plan.md:50` still gives "its milestone, `release: 0.1.0`, is due 2026-11-28" as the reason this work expects to seal first. The grep printed those two lines alone. That is a sample: a statement of the date in other words, such as "Saturday", escapes it. The row is what the orchestrator reads to order the release tail.

```markdown
| #223 | `view.ts` (the approval line), `daemon.ts` and `protocol.ts`, from its frame's list of files | Whichever of the two seals first; this work expects to | The two change different functions of the same files. This work is smaller and its milestone, `release: 0.1.0`, is due 2026-11-29. |
```

## Confirmations

What matched: *Scope* items 1 and 2. `pinnedVersion` (`records-place.ts:132-139`) reads the two clone lines in the one spelling `workflowText` writes (`:108-111`). It answers null where either line is missing or the two disagree. `olderVersion` (`:154-162`) compares the numbers as numbers, and a suffix is older only against the same numbers without one. Scenarios A and B hold this, executed (Probes, row 1).

What matched: *Scope* items 3 and 4. `readRecordsPlace` reads `olderCheck` from the main checkout's working tree only where a version is given (`records-place.ts:227-233`). `Daemon#readRecords` passes `this.options.version` and counts a change of it (`daemon.ts:2870-2882`). `planRecords` offers the move only where the root is kept, the config is held and the commit's text pins an older version (`records-place.ts:455-457`). The moved workflow stays among `keptFiles` (`:473`), so git's status and the hash both compare it, and `created` leaves it out of `notFolders`, `otherLetters` and `occupied` (`:493-499`), as Q4's answer states. The stamp hashes the files, the workflow's new text among them (`:536`), so a plan for another version is another. Scenarios C, D and E hold this, executed (Probes, rows 1 and 2).

What matched: *Scope* item 5, the overwrite and its restore. The plan has just compared the checkout with the commit, so `replaced` holds the commit's text as the checkout holds it (`records-place.ts:582-586`). On a failure `git reset -- <path>` unstages it, and the bytes go back (`:610-613`). A `post-commit` hook ended at the limit after the commit was made is read as a success (`:605-607`), so nothing is written back over a commit that stands. Scenario F's case holds the hook's refusal with `git status` empty, executed (Probes, row 1). A concurrent second setup was read through as well. Its stamp passes only where both plans read the same head. Its commit of an unchanged file then fails, its cleanup resets the path to the first commit, and it writes back the template the first one wrote. The tree ends consistent.

What matched: *Scope* item 6 and Q3's default. `refusedAt` (`seal-state.ts:109-119`) finds the directory as `workItemSeal` does and turns only a `ChainStop` into a sentence. The readers are the app's own, and the check the move pins is at the app's version, so the readers and the check are of one release. Scenario G holds the refusal named by id, title and sentence, executed (Probes, row 2). Within a pass of `readCommits`, the heads are read before the records place (`daemon.ts:4549-4551`). So the row's button never shows ahead of the first reading of the branches.

What matched: *Scope* items 7 and 8, read in `sidebar.ts:104-114` and `:194`, and in `view.ts:2677-2697` and `:2736-2738`. The window compares no versions. A daemon of an earlier build sends no `move`, and the dialog then draws a setup, which `view.test.ts` holds, executed (Probes, row 1). With the field hidden, `recordsCommand` stays empty from `openRecords` (`renderer.ts:1459`). `plannedFor === command` therefore holds once the plan arrives, and the stamp hashes no command where no `config.json` is written.

What matched: *Scope* item 10, the screenshot view's commit and its `git reset --keep HEAD~1` (`screenshots.test.ts`, the `check-move` entries of the views and of their leaves). The leave waits until the row holds no button. The button goes in the pass that also reads the branches again, with the heads read first (`daemon.ts:4549-4551`). So the "1 behind" that the view's commit causes is gone from the same `inbox` that takes the button away. The next appearance's summary therefore draws without it, as `trail/phases/phase-2.md:29` claims. The view's `git commit` names no path, and the scene's main checkout holds nothing staged at that point that the round found. `--keep` resets only the workflow, which the commit changed.

What matched: figure against text. The six shots under `screenshots/` were opened. Night watch dark and Register light show "Check 0.0.4" on the row of "project" between its count and "+". The dialog shows both versions, the branch `main` and the move's subject, the path of the workflow, the sentence that it is written over the committed file, the workflow in its scrolling block, the sentence of what was read with no work item named, and "Move and commit" on. That matches `gaps.md:20-30`'s alt texts, `trail/phases/phase-2.md:29`, the row of `docs/design.md:443` and `changelog.md:5-6`. The links in `gaps.md:20-30` name blobs at `f7bd0b5d`, the commit that added the shots.

What matched: record against another work item's frame. `docs/architecture.md` *Records are committed to the repository* is changed by this frame's *Rule changes* and by an `add` in `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/frame/design.md`. The two add separate paragraphs, and #150's five-minute limit on a commit covers the move, which runs through the same `commitRunner`. *Components and their states* gains rows from other work items of the release. Those rows are in other places of the table, and the broad gate's count of table rows across the two editions is the orchestrator's.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the typecheck and the documents' check at `a7042c65`. The round ran two test files whole and one group of `daemon.test.ts` by name, so the suite is `unverified` | `gaps.md:7`, `gaps.md:9` | the orchestrator, at the broad gate |
| Scenario J's built-app case and the screenshot run were not run by this round. The round read the committed shots and the crafter's `executed` account in `trail/phases/phase-2.md:29` | `apps/desktop/test/records-dialog.test.ts`, `apps/desktop/test/screenshots.test.ts` | the orchestrator's built-app batch |
| That the 102 shots not committed draw as before this work. The round read the code that orders the leave (Confirmations) and none of those shots | `gaps.md:18` | the orchestrator, from its own screenshot run where it wants the claim executed |
| The phases' mutation runs and seen-red runs, which the round did not repeat | `trail/phases/phase-1.md:19-26`, `trail/phases/phase-2.md:19-27` | the sealer, reading them as the crafter's account |
| Whether an open pull request's next run takes the moved pin once the base holds it (Q3) | `frame/questions.md:16` | a measurement on GitHub |

## Probes

| Command | Result |
|---|---|
| `cd apps/desktop && ELECTRON_OVERRIDE_DIST_PATH=<the main checkout's Electron 45.3.3 MacOS folder> node scripts/test-in-electron.mjs test/records-place.test.ts test/view.test.ts` | exit 0: 2 files, 633 tests passed |
| `cd apps/desktop && ELECTRON_OVERRIDE_DIST_PATH=<the same folder> node scripts/test-in-electron.mjs test/daemon.test.ts -t "the records place of a repository"` | exit 0: 7 passed, 403 skipped, scenarios C and G among the 7 |
