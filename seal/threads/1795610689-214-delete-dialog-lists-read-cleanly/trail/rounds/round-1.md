# Review round 1: 1795610689-214-delete-dialog-lists-read-cleanly

```seal
target: ce23ace0 against release/v0.0.5
```

The round read the branch `fix/214-the-delete-dialog-runs-hashes-into-wrapped-subjects` at `ce23ace0` against its base at `ab7a5730`, the twelve commits `bb406976..ce23ace0`. No earlier round stands, so no fact was carried from one. Every file of the work item was read whole at `ce23ace0`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` and `trail/phases/phase-2.md`. The six PNG files under `screenshots/` were opened one by one. The issue was read with `gh issue view 214 --json title,body,comments`, which printed no comment. The record language is English (`seal/config.json`), so no `pr.<lang>.md` is owed.

## Findings

### 1. A redraw for the daemon's lists throws each loss list back to its top, so a person reading a long list by scrolling loses their place

```seal
severity: should
location: `apps/desktop/src/renderer/renderer.ts:1239`, `apps/desktop/src/renderer/renderer.ts:1150-1162`, `apps/desktop/test/work-item-menu.test.ts:886-935`
evidence: read `apps/desktop/src/renderer/renderer.ts:1230-1246`, `apps/desktop/src/renderer/renderer.ts:1522-1528`, `apps/desktop/src/renderer/renderer.ts:1585-1587`, `apps/desktop/src/renderer/renderer.ts:1150-1162`, `apps/desktop/src/daemon/daemon.ts:3806-3810`, `docs/product.md:170`
```

Why it matters: *Scope* item 5 of `frame/design.md` says that a list scrolls and that "every entry the daemon listed stays readable". The plan rejected a fixed cap on the rows because `docs/product.md:170` has the person read each lost entry by name before a forced delete (`frame/plan.md` *Alternatives considered*, first row). So scrolling is now the only way to read the eleventh commit and every commit after it. The scroll does not survive a redraw, though:

- `showDelete` rebuilds the lists from scratch on every call: `byId("delete-loss").replaceChildren(...lossParts(deleteLoss))` (`renderer.ts:1239`). Each `ul.loss` it appends is a new element, so its `scrollTop` starts at 0.
- `takeLists` calls `showDelete` whenever the dialog is open (`renderer.ts:1587`), and so does `takeHeadlessSession` (`renderer.ts:1527`). `takeLists` handles the daemon's `inbox` message, and the daemon sends that message to every client "after one of them changed". Its comment says "Every change of a pane's `alive` or `state` ends here" (`daemon.ts:3806-3810`).
- The removal dialog does the same for each work item's lists (`renderer.ts:1150-1162`, through `showRemove`, called at `renderer.ts:1585`).

So while any agent in any repository changes state, the list a person is scrolling jumps back to its first row. The row under the pointer is also replaced, which closes its tooltip. For a cut subject or a cut path, that tooltip is the only place the whole text stands (*Scope* items 1 and 2, `frame/questions.md` Q3). The screenshot scene is this case: four agents run, and the work item with 39 commits has a session waiting for the machine. The old `.named` box of `--said-height` was rebuilt the same way, so the defect is older than this branch. This work makes the scroll the means of reading each entry, which is why it matters now. No case reads a list's scroll after a redraw. The long list's case (`work-item-menu.test.ts:886-935`) reads where the list comes to rest after a wheel turn, and then closes the dialog.

The fix for the delete dialog redraws its lists only when the loss they show has changed. `deleteLoss` is reassigned only by `readDeleteLoss` (to `null`) and by `takeDeleteLoss` (to the daemon's answer), so comparing by identity is exact:

```ts
// apps/desktop/src/renderer/renderer.ts, beside `let deleteLoss` (line 256):
// The loss the delete dialog's lists were last drawn from. A redraw for the daemon's lists keeps them while the loss is the same, so a list keeps its scroll and the row under the pointer keeps its tooltip.
let deleteLossDrawn: WorkItemLoss | null | undefined;

// apps/desktop/src/renderer/renderer.ts, `showDelete`, in place of line 1239:
  if (deleteLoss === null || deleteLoss !== deleteLossDrawn) {
    byId("delete-loss").replaceChildren(...(deleteLoss === null ? [] : lossParts(deleteLoss)));
    deleteLossDrawn = deleteLoss;
  }
```

The removal dialog owes the same fix, and the snippet does not reach it. `showRemove` also redraws for its own two checkboxes (`renderer.ts:2202-2203`), and each work item's heading and sentence are drawn with that work item's lists. The fix pass either skips the rebuild of `#remove-losses` where `deletes`, the work items and their `removeLosses` entries are all unchanged, or reads each `ul.loss` `scrollTop` by work item id and section before the rebuild and writes it back after. A case belongs in `apps/desktop/test/work-item-menu.test.ts`, beside the long list's case. With the list at rest past its top, it makes the daemon send its lists, for example by starting or ending a session, and then reads that the list's `scrollTop` is unchanged. The fix pass shows that case red against `ce23ace0` (contract rule 15).

```seal
verdict: deferred #251
answer: No code was changed. The defect predates the branch: the old `.named` box was rebuilt on every redraw in the same way. Its fix redraws each dialog's lists only where their loss changed, which is a unit the frame does not name (`skills/implement/fix-pass.md` *A fix that needs a unit the frame does not name waits for the fold*). The orchestrator filed it as issue #251 with this round's paste-ready fix and its case, as the 2026-11-25 row of `frame/plan.md` *Judgments of the run* records at `9ddfa5fe`.
```

### 2. Four facts the frame states of the new form have no case that fails without them

```seal
severity: should
location: `apps/desktop/test/work-item-menu.test.ts:850-856`, `apps/desktop/test/work-item-menu.test.ts:909-910`, `apps/desktop/test/screenshots.test.ts:583`, `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/gaps.md:8`, `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/gaps.md:12`
evidence: executed `git grep -n -e fontSize -e size-second -e size-caption -- apps/desktop/test/work-item-menu.test.ts` at ce23ace0, which printed lines 849 and 861 only; read `apps/desktop/src/renderer/index.html:573-577`, `apps/desktop/test/work-item-menu.test.ts:842-856`, `apps/desktop/test/work-item-menu.test.ts:909-910`, `apps/desktop/test/screenshots.test.ts:578-584`, `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/trail/phases/phase-1.md:32`
```

Why it matters: the round set each fact of *Scope* items 1 to 7 and of the two *Rule changes* operations beside the assertions of the cases that cover them. Those cases are the two `lossSections` cases of `view.test.ts`, the delete, long list and removal cases of `work-item-menu.test.ts`, and the `delete` view of `screenshots.test.ts`. Four facts that the diff changed have no assertion that fails without them. That is the *Regression test* row of `skills/code-review/SKILL.md` *Probes and regression tests*, and contract rule 14 asks for a pin of what a person sees.

- **The subject's size.** *Scope* item 1 sets the subject at `--size-second`, and `index.html:576` declares it. The delete case reads four facts of the subject: `whiteSpace`, `textOverflow`, `overflow` and `color` (`work-item-menu.test.ts:850`). It does not read the size. Without the declaration, the subject inherits the dialog's `--size-text`, and no case notices. The grep above found `fontSize` only for the hash (line 849) and the lead (line 861).
- **The path's size.** *Scope* item 2 sets a path at `--size-caption`. The path's assertions read its face, its wrap, its cut and its ink (`:851`), but not its size.
- **The hashes' one column.** *Scope* item 1 asks for "one column, as wide as the widest hash", and `index.html:573-574` builds it: `grid-template-columns: auto minmax(0, 1fr)` on the list, and `grid-column: 1 / -1; grid-template-columns: subgrid` on each row. Reading those lines settles `gaps.md` *Not verified* row 2: the column is shared. No case holds it. The comment at `:909` says "The hashes stand in one column", but every hash in the case's clone has seven characters, so a grid per row draws the same starts. `trail/phases/phase-1.md:32` says the same thing, and that is why its mutant was not run.
- **The untracked and the ignored lists of the shot.** The *Rule changes* paragraph says that the shot shows "the untracked and the ignored path lists", and its `check:` names `apps/desktop/test/screenshots.test.ts`. The `delete` view waits only for the commits' head (`screenshots.test.ts:583`). `gaps.md:12` says so: "No wait reads the untracked file or `.env`". The six PNG files show both lists at `ce23ace0`, but the next run with a broken scene would write a shot without them and pass.

The comparison is a sample under contract rule 12 only where a fact is worded outside *Scope* and *Rule changes*. *Scope* items 3 to 7 are each held by a case, as *Confirmations* says. The paste-ready fix:

```ts
// apps/desktop/test/work-item-menu.test.ts, the delete case, lines 850-851 and the expectation at 856:
          subject: [subject.whiteSpace, subject.textOverflow, subject.overflow, subject.color === resolved("color", "--ink"), subject.fontSize === resolved("font-size", "--size-second")],
          path: [getComputedStyle(path).fontFamily === resolved("font-family", "--font-mono"), getComputedStyle(path).whiteSpace, getComputedStyle(path).textOverflow, getComputedStyle(path).color === resolved("color", "--ink"), getComputedStyle(path).fontSize === resolved("font-size", "--size-caption")],
// ...
    ).toEqual({ hash: [true, true, true], subject: ["nowrap", "ellipsis", "hidden", true, true], path: [true, "nowrap", "ellipsis", true, true], titles: ["owlery/doomed", worktree, "add work.txt", "notes.txt", ".env"] });

// apps/desktop/test/work-item-menu.test.ts, the long list's case, after line 910:
    // A hash longer than the others widens the list's one column, so every subject still starts at one place past the widest hash.
    expect(await value<[number, boolean]>(`(() => { const list = ${COMMITS}; list.querySelector(".hash").textContent = "0123456789abcdef"; const starts = new Set([...list.querySelectorAll(".subject")].map((words) => words.getBoundingClientRect().left)); const widest = Math.max(...[...list.querySelectorAll(".hash")].map((hash) => hash.getBoundingClientRect().right)); return [starts.size, [...starts][0] > widest]; })()`)).toEqual([1, true]);

// apps/desktop/test/screenshots.test.ts, the `delete` view, in place of line 583:
      await app.until(`document.getElementById("delete-dialog").open && ${JSON.stringify([QUEUED_COMMITS_HEAD, "1 untracked file", "1 ignored file or folder, which goes with the folder"])}.every((wanted) => [...document.querySelectorAll("#delete-loss h3")].some((head) => head.textContent === wanted))`, `the delete dialog of ${QUEUED}, its heading counting its ${String(QUEUED_COMMITS.length)} commits, and the heads of its untracked file and its ignored file`);
```

The longer hash is written into the drawn list. A row of its own would need a clone whose short hashes differ in length, and git gives a small repository seven characters for every hash. With a grid per row, the patched row's subject starts further right than the others, so the set holds two values. The fix pass owes the statements of these facts as well. `gaps.md` rows 2 and 6 (lines 8 and 12) are marked `closed` where the cases now hold what they say is not verified. The sentence "waits until the head of its commits counts 39" names the wait the fix widens: it stands in the header comment of `screenshots.test.ts:41-43`, in both *Rule changes* `to:` texts of `frame/design.md:128` and `:133`, and in `gaps.md:12`. The fix pass extends each to the two new heads or leaves each as a true part of the wait, and says which it chose. Each new assertion is shown red with its one declaration removed (contract rule 15).

```seal
verdict: fixed bd4dd780
answer: The four cases are built. In the delete case, the subject's assertion now also reads `font-size` against `--size-second`, and the path's against `--size-caption`. In the long list's case, a second assertion writes a sixteen-character hash into the first drawn row and reads one start for every subject past the widest hash. The comment of the first assertion no longer claims the shared column, and the new one carries that claim. The `delete` view of `screenshots.test.ts` now waits for three heads: the commits' head, "1 untracked file" and "1 ignored file or folder, which goes with the folder". These stand in a new constant, `QUEUED_HEADS`, which replaces `QUEUED_COMMITS_HEAD`, so the wait is written in the fix pass's own words rather than the paste-ready line. Each was seen red by `seal mutate` with only its guard removed, and the failing line was read each time (`executed`): Without `font-size: var(--size-second)` on `dialog .loss .subject`, the delete case failed at line 855 on the subject's fifth element only. With `font-size: inherit` added to `dialog .loss .path`, it failed there on the path's fifth element only. The path takes `--size-caption` from the rule it shares with `.hash` (`index.html:204`). Removing that declaration would also break the hash's assertion, so the mutant overrides the size for the path alone. A grid per row, `grid-template-columns: auto minmax(0, 1fr)` in place of `subgrid`, was first caught by the older assertion at line 910 with `[1, false]`, because the row then lost the list's gap. With the gap kept as well (`column-gap: var(--space-4)`), line 910 passed and the new assertion at line 912 failed with `[2, true]`. Three screenshot runs each failed at the `delete` view's wait, "the window never showed the delete dialog of Rename the settings file, …": one with 38 commits, one without the untracked file and one without `.env`. Green afterwards (`executed`): `test/work-item-menu.test.ts` passed 30 cases; one screenshot run in the default theme wrote 26 files; `test/screenshots.test.ts` and `test/themes.test.ts` passed 23 cases. The committed PNG files are unchanged, since no drawn part changed. `gaps.md` rows 2 and 6 are closed by these cases in `95093abd`. In the same commit, rows 3, 4 and 5 are closed by citing this round's *Confirmations*. On the sentence "waits until the head of its commits counts 39": the header comment of `screenshots.test.ts` is extended to the two new heads. In the two *Rule changes* `to:` texts it is left as it stands, since it is still a true part of the wait. The `gaps.md:12` text that held it is closed. The evidence search, rerun at HEAD, prints `fontSize` at lines 849 (hash), 850 (subject), 851 (path) and 861 (lead).
```

### 3. `gaps.md` *Not done* says the frame overstates the shot with a phrase the frame no longer holds

```seal
severity: should
location: `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/gaps.md:18`
evidence: executed `git grep -n -F 'every kind of path list' ce23ace0 -- seal/` at ce23ace0, which printed `gaps.md:18` and `trail/phases/phase-2.md:5` only; read `git show e6595033 -- seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/design.md`
```

Why it matters: the last sentence of `gaps.md:18` reads "The frame's phrase "every kind of path list" overstates the shot, and the phase-2 hand-back names it for the orchestrator to fold." The fold was made at `e6595033`. *Scope* item 9 and both *Rule changes* `to:` texts now say "the untracked and the ignored path lists", and the phrase stands nowhere in the frame at `ce23ace0`. The sealer reads `gaps.md` as the present memo of the work and would look for an overstatement that is gone, or fold it again. The same phrase in `trail/phases/phase-2.md:5` is dated: that record says it opened the frame at `5aede9b3`, where the phrase stood, so it stays as written. The rest of `gaps.md:18` holds at the target. The fix:

```markdown
The screenshot run's scene writes no file with uncommitted changes in the worktree of "Rename the settings file", so the delete dialog's shot shows no list of "files with changes that are not committed". One modified tracked file would add it. It was not taken because `frame/design.md` *Scope* item 9 and the two *Rule changes* operations name the untracked file and `.env` alone, and the settle writes that scene paragraph as the framer worded it. That list draws its paths in the same row form as the untracked files' list, which the shot shows.
```

```seal
verdict: fixed c99670ea
answer: The last sentence of `gaps.md:18` is removed, and the paragraph now reads as the paste-ready text. The evidence search, rerun at HEAD over `seal/`, prints `trail/phases/phase-2.md:5`, which is dated to `5aede9b3` and stays as written. It also prints this round record's own quotations of the phrase. It prints no line of `gaps.md` and none of the frame.
```

### 4. The acceptance table of `frame/design.md` points at test lines that hold other code at the target

```seal
severity: should
location: `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/design.md:78`, `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/design.md:82`, `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/design.md:84`
evidence: executed `grep -n '^  it(' apps/desktop/test/work-item-menu.test.ts apps/desktop/test/view.test.ts` and `git grep -n -e ':812' -e ':741' -e ':932-966' -- seal/threads` at ce23ace0
```

Why it matters: *User scenarios & acceptance* is the table the sealer checks each scenario against. It is not under the dated *Grounding* ("The tree as read at `ab7a5730`"), and the frame was folded twice after the build, at `5aede9b3` and `e6595033`. Three of its coordinates hold other code at `ce23ace0`:

- "the delete case at `:812`" (line 78). At `ce23ace0`, `work-item-menu.test.ts:812` is the doc comment of the `RESOLVED` helper, and the delete case opens at `:815`.
- "the case at `:741`" (line 82). At `ce23ace0`, `view.test.ts:741` is a blank line, and the case that counts "and N more" opens at `:742`.
- "The removal cases of `work-item-menu.test.ts` (`:932-966`)" (line 84). At `ce23ace0` those lines are the end of the long list's case and the start of the "New group" case. The removal cases open at `:997` and `:1030`.

The `git grep` also printed `frame/design.md:33` (`:932-966`), which stands under *Grounding* and is dated, so it stays. The *Removes* table at line 148 names coordinates of what the build removed, which are `ab7a5730`'s by nature, so it stays as well. The fix names each case by its title, which does not move when lines above it are added (contract rule 19):

```markdown
| A work item with commits | ... | A built-app case in `apps/desktop/test/work-item-menu.test.ts`, the case "names in the delete dialog the branch, the folder, the commit no other branch holds by its hash and its subject apart, …". It reads each row's hash and subject parts, the computed `font-family` and `color` of the hash, the subject's `white-space`/`text-overflow`, and the row's `title`. |
| A list the daemon cut | ... | Unit case of `lossSections` in `view.test.ts`, the case "counts in each heading what the loss counts, …", kept with its counts. |
| The removal dialog | ... | The removal cases of `work-item-menu.test.ts`, "deletes a repository's work items from disk at its removal …" and "keeps in the removal's dialog the refusal …", with the new heads. |
```

The `...` stands for the row's first two cells, which stay as they are.

```seal
verdict: fixed 9ddfa5fe
answer: The orchestrator folded this finding into `frame/design.md` as the round wrote it, as the 2026-11-25 row of `frame/plan.md` *Judgments of the run* records. The three *Verifiable how* cells now name the cases by title. Read at HEAD, each title stands at its case: `work-item-menu.test.ts:815` for the delete case, `view.test.ts:742` for "counts in each heading what the loss counts, …", and `work-item-menu.test.ts:999` and `:1032` for the two removal cases. The fix pass changed no line of the frame.
```

### 5. `## Rule changes` of `frame/design.md` ends with a prose paragraph, so the settle cannot read the section's operations

```seal
severity: should
location: `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/design.md:136`
evidence: executed `python3 skills/code-review/scripts/chain_check.py --baseline ab7a5730 --root <the branch worktree> --worktree` at ce23ace0 with this record in the tree; read `lib/items.py#items` of the plugin, `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/design.md:11`, `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/design.md:15`, `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/design.md:58-63`
```

Why it matters: the chain check printed this notice at the target: "seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/design.md:136  `## Rule changes` does not parse, so `settle` cannot group this design by the sections it names and the settle has to read it whole: a line that is not a field of the item above". The plugin's `lib/items.py#items` reads a `## Rule changes` section as items only. A line is either an item, `- <kind>`, a field indented two spaces, or a continuation indented four. Line 136 is a paragraph of prose under the two `add` operations, so the reader stops there. The two operations still stand, but the settle groups the release's designs by the sections they name, and it cannot group this one. Without the paragraph, the section parses.

The paragraph says that the row "The delete dialog" and the view list sentence are written in place, so they are not operations. That fact already stands in three places: the *Grounding* row for *Principles* 8 (line 11), the *Grounding* row for *A pull request that changes the window carries its screenshots* (line 15), and *Scope* items 8 and 9 (lines 58-63). Since a fact has one source, the fix removes the paragraph and the blank line above it, so the section ends with the second operation's `check:` line:

```diff
     check: apps/desktop/test/screenshots.test.ts
-
-The row "The delete dialog" of *Components and their states* and the view list sentence of *A pull request that changes the window carries its screenshots* are not operations here. Principle 8 of `docs/design.md`, and that section's own sentence on the view list, have this pull request write both in place in both editions.
 
 ## Removes
```

```seal
verdict: fixed 9ddfa5fe
answer: The orchestrator folded this finding into `frame/design.md` as the round wrote it, as the 2026-11-25 row of `frame/plan.md` *Judgments of the run* records. Read at HEAD, `## Rule changes` ends with the second operation's `check:` line, and the prose paragraph is gone. The fix pass changed no line of the frame.
```

## Confirmations

What matched: *Scope* items 1 to 7 stand in the code at `ce23ace0`. `lossSections` keeps the hash and the subject apart and counts each head through `counted` (`apps/desktop/src/renderer/view.ts:1095-1110`). `lossRow` sets the `title` to the whole subject or path (`apps/desktop/src/renderer/renderer.ts:463-479`). `index.html:573-577` gives one row height through `grid-auto-rows`, ten rows of `max-height`, `scroll-snap-type: y mandatory` and `scroll-snap-align: start`. `#delete-says` takes `--ink` at `--size-text` (`index.html:562-563`), and its id selector outranks `dialog .says`. `read`.

What matched: `lossParts` draws both dialogs' loss lists with the one class `loss`. Its two callers are `renderer.ts:1161` (removal) and `renderer.ts:1239` (delete), which settles `gaps.md` *Not verified* row 5. The search `git grep -n 'lossSections\|LossSection\b\|LossRow' -- apps/desktop/src` found no other reader. `executed`.

What matched: nothing of the five old captions or the joined `${hash} ${subject}` line is left in `apps/desktop/src`, `apps/desktop/test` or `docs` (`git grep` on each caption, `executed`). Every row of *Removes* holds: the `.named.whole` comment now names the Accounts list and `records-holds` (`index.html:570`), and `namedLines(…, true)` still draws `records-holds` (`renderer.ts:1315`).

What matched: the row "삭제 대화 상자" of `docs/design.ko.md:458` says what the row "The delete dialog" of `docs/design.md:458` says, sentence by sentence, which settles `gaps.md` *Not verified* row 3. The same holds for the two view list sentences (`docs/design.md:506`, `docs/design.ko.md:506`). Each edition gains one table row and no heading, so the broad gate's count comparison should hold; the orchestrator's run answers that. `read`.

What matched: the six PNG files show what `trail/phases/phase-2.md:19` says, which settles `gaps.md` *Not verified* rows 4 and 6 for this run. The heads read "The branch and the folder removed from disk", "39 commits no other branch, no remote and no tag holds", "1 untracked file" and "1 ignored file or folder, which goes with the folder". The commit list shows ten whole rows with its scroll bar at the top, and two of its subjects are cut with an ellipsis. The hashes are in the fixed-width face and a muted ink, in one column, at a smaller size than the subjects. The lead is in the ink of text, and "Nothing on a remote is removed." is muted. All three themes draw the same form in both appearances. `read`.

What matched: the two rewritten `lossSections` cases cover every kind of head, in the singular and the plural, as well as the folder-only and branch-only heads and "and N more" against `commitCount`. `cd apps/desktop && node scripts/test-in-electron.mjs test/view.test.ts` passed 549 cases at `ce23ace0`. `executed`.

What matched: the long list's case pins *Scope* items 3 and 5. `clientHeight` is ten rows and `scrollHeight` is twelve (`work-item-menu.test.ts:906`), every row has one `offsetHeight` (`:907`), and a wheel turn of 37px rests on a multiple of the row (`:916-920`). With the snap removed, the rest would be 37, so the case fails without it. `read`.

What matched: `trail/phases/phase-1.md` reports seen-red runs and `seal mutate` runs, and the round carried them as the crafter's `executed` claims without running them again. No `test_tmp_*` file is tracked or left in `apps/desktop/test` (`executed`).

The long list's case also holds a comment that claims more than it pins: `work-item-menu.test.ts:909` says the hashes stand in one column. Finding 2 covers it, since *Scope* item 1 states that fact.

Phase 2 found that the delete dialog's "Running sessions that end" list names "Asked: Which keys does the settings file hold?", a session that waits for the machine and never started. That list is out of *Scope*, and the crafter handed the find to the orchestrator to file. The round saw it in all six PNG files and carried the hand-off as it stands.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate: the full suite, the typecheck and the comparison of `docs/*.md` with `docs/*.ko.md`. The suite is `unverified`. | `seal/config.json` `Broad gate` | the orchestrator |
| Whether the 39 commits, the untracked file and `.env` the scene now writes leave the other views' shots as they were. `trail/phases/phase-2.md:11` says the summary shot is unchanged, but that PNG is not committed, and the round ran no screenshot run. | `apps/desktop/test/screenshots.test.ts:742-754` | the orchestrator |
| The folder row of all six PNG files shows the run machine's per-user temporary folder by its full path. Whether the pull request may carry that path is a question of publishing, not of the form. | `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/screenshots/` | the orchestrator |
| The defaults of Q1, Q2 and Q3 in `frame/questions.md` stand open for the owner. The build follows each default, and the round judged the code against those defaults. | `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/questions.md:16-18` | the owner, after the release |

## Probes

| Command | Result |
|---|---|
| `cd apps/desktop && node scripts/test-in-electron.mjs test/view.test.ts` | exit 0: 1 file, 549 cases passed |
| `git grep -n -e fontSize -e size-second -e size-caption -- apps/desktop/test/work-item-menu.test.ts` | lines 849 (hash) and 861 (lead) only |
| `git grep -n -F 'every kind of path list' ce23ace0 -- seal/` | `gaps.md:18` and `trail/phases/phase-2.md:5` only |
| `grep -n '^  it(' apps/desktop/test/work-item-menu.test.ts apps/desktop/test/view.test.ts` | delete case at 815, long list at 886, removal cases at 997 and 1030, "and N more" case at 742 |
