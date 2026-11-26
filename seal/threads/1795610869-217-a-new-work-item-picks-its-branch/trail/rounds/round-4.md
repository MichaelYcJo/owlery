# Review round 4: 1795610869-217-a-new-work-item-picks-its-branch

```seal
target: bd5e2768, fixes de530e4a..bd5e2768
```

A verifying round of the merge of the base. The range holds the merge `b696172f`, which brings `release/v0.0.5` at `783e2331` into the branch, and the orchestrator's fold `bd5e2768`, which changes two rows of the frame. Round 3 left no finding open and closed none `fixed` or `rejected`, so no earlier finding is owed a `confirms:`, `regression:` or `reopens:` line. The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at `bd5e2768`; no `pr.<lang>.md` stands. It reviewed the merge's resolution (`git show --cc b696172f`), and the release's side of the merge for every reader of a work item's branch it adds (`git diff ab7a5730 783e2331 -- apps/desktop/src`).

Carried from rounds 1 to 3 and not derived again: what `headStands`, `makeBranch`, `branchUp` and `readBranch` decide, and where (`trail/rounds/round-1.md` *Confirmations*); none of those units changed in the range. The tests ran in the branch's worktree, in `apps/desktop`, as the spawn named; the worktree's `git status` was clean after them.

## Findings

### 1. The readers table leaves out the readers of the branch the release added for an owed word and for the removal's redraw

```seal
severity: should
location: `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/frame/design.md:41`, `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/frame/design.md:93-124`
evidence: executed `git grep -n "workItemDirector\(y\|ies\)(" -- apps/desktop/src` and `grep -rn -F -e readOwed -e recordText -e showRemove seal/threads/1795610869-217-a-new-work-item-picks-its-branch/` at `bd5e2768`; read `apps/desktop/src/daemon/daemon.ts:3145-3173`, `apps/desktop/src/daemon/daemon.ts:3320-3327`, `apps/desktop/src/renderer/renderer.ts:1203-1213`
```

Why it matters: *Scope* item 3 (`frame/design.md:41`) says the table *The readers of a work item's branch* "lists each reader and its state". The sealer reads that table as the list *Scope* item 3 is held against, and the settle reads it after the release. The fold added the row of `#commitOwed` and left out three other readers the release brought.

- `daemon.ts#readOwed` (`daemon.ts:3145-3173`, from #264) reads the work item's directory through `workItemDirectory(item.worktree, item.branch)` to find the words of the person's that no commit holds.
- `daemon.ts#recordText` (`daemon.ts:3320-3327`, from #264) reads the same directory for the record's text that `passWords` compares.
- `renderer.ts#showRemove` (`renderer.ts:1203-1213`) reads `branch` and `ownsBranch` among the values the removal's lists are drawn from (`drawWhereChanged`, from #263). The merge added them there. Only the `#214` row of `frame/plan.md` *Overlap with the release* says so.

Each one handles a null branch, so the code holds *Scope* item 3. `workItemDirectory` gives null for a null branch (`decision-record.ts:188`). `readOwed` then asks git nothing, keeps no reading and forgets the failed tries. `recordText` then gives null. `showRemove` draws the lists again where a work item's branch is made or taken up while the dialog stands. The defect is in the record: it says the table is whole, and the table misses these three.

The search for `workItemDirectory(` and `workItemDirectories(` lists every caller at the target. Of the callers that read a work item's own branch, all but these have rows: `readRecord`, `writtenRecord`, `readSealRecords`, `#personWrote`, `#commitOwed`, `routeRenamed` and `#whyNoChain`, and `seal-state.ts#workItemSeal`. The search of the records for the three names prints nothing. This list is a sample under contract rule 12. A reader that takes the branch under another name escapes it. So the round also read the release's added lines that name `branch`, by the diff of `git grep -h -P '\.branch\b|\bbranch\b *[,})]|\{[^}]*\bbranch\b[^}]*\} *='` at `de530e4a` against `bd5e2768`. That diff printed the lines of `#commitOwed`, `readOwed`, `recordText`, `commitWord`, `lossSections`, `stage-records.ts` and `showRemove`, and no others.

The fix adds two rows after the row of `#commitOwed`, the first for `readOwed` and `recordText` together (`frame/design.md:106`). Nothing else in the records says the table holds these readers, so no other sentence needs to change:

```markdown
| `#readOwed` and `#recordText` (#264), found by round 4 | the work item's directory, whose record is read for the words of the person's that no commit holds | `workItemDirectory` gives null where the branch is null, so `recordText` reads no record and `readOwed` asks git nothing, keeps no reading, forgets the failed tries and owes no word: `wordOwed` stays null. | None: `apps/desktop/test/decision-record.test.ts` pins `workItemDirectory`'s null, and review reads the rest. |
| `renderer.ts#showRemove`, the values the removal's lists are drawn from (#263), found by round 4 | whether the lists under the removal's choice to delete are drawn again | `branch` and `ownsBranch` are among the compared values, so a work item whose branch Owlery makes or takes up while the dialog stands is drawn again, with `deleteSays`'s words for it. | None: no case makes a branch while the removal's dialog stands, and review reads it. |
```

## Confirmations

What matched: the merge keeps both sides of each conflict, as the merge's message claims. Each item below was read in `git show --cc b696172f` and at `bd5e2768`.

- `#personWrote` still refuses a work item with no branch before anything is written (`daemon.ts:3047`). It now hands the word to the release's `tryWord`, and no longer to `commitWord`.
- `#commitOwed` returns where the branch is null (`daemon.ts:3258`). The claim is that the guard was added outside the conflicts. The combined diff shows it inside the conflict hunk, as a line of neither parent. The guard cannot be reached, since `directory` is null there first, and it narrows the type for `commitPaths`.
- `commitWord` keeps the release's bounds and its routing-only text, and the branch's return on a null branch (`daemon.ts:3117`). `chainDirectory` and `placeOf` take the branch through `chainBranch` with the release's `commitBounds()` (`daemon.ts:3585`, `:3595`).
- The two protocol comments of `reverseDecision` and `answerQuestions` (`protocol.ts:925`, `:927`) hold the release's retry sentences and the branch's "where the work item has no branch yet".
- The window keeps both sides:
  - `list.ts:160` keeps the release's word-owed mark with the branch's `says branch none`;
  - `index.html:364` keeps `.branch.none`, `index.html:367` keeps the release's `.word-owed`, and `index.html:1104` keeps the branch's removal label;
  - `renderer.ts:1299` passes the work item to `deleteSays`.
- The test files keep both sides' fields: `WORK_ITEM_FIELDS` and `asLooked` in `daemon.test.ts`; the parked and finished work items of `screenshots.test.ts` on `branchedWorktree`, so the release's scene of a word not committed finds the parked record. The release's new cases in `work-item-menu.test.ts` that read `owlery/doomed` and `owlery/in-third` create through `create`, which renames the work item to make its branch (`work-item-menu.test.ts:206-231`). (read)

What matched: no reader the release added removes or renames a branch. `git grep` for `removeBranch(`, `renameBranch(`, `-D`, `-m` and `ownsBranch` at the target prints the same callers as at `de530e4a`. `removeBranch` runs only on `removedBranch`'s answer, which is null where `ownsBranch` is false (`daemon.ts:118-119`, `:2335`). `renameBranch` runs only after `planBranchRename` is given `ownsBranch` (`daemon.ts:1418-1422`). The release's chain command, `--persons-word` and the ceiling among it, reads the worktree's `HEAD` itself and no stored branch. Its refusal of a detached `HEAD` is the branch's. (executed and read)

What matched: the frame's `## Rule changes` still finds its anchors at the target. The `from:` sentences of `docs/product.md:170` and `docs/product.ko.md:170` stand word for word. The five sections they name stand under the same headings. The release's frames that touch those sections add rows or sentences, and none rewrites the sentences this frame changes (`grep -n -F` of each heading over `seal/threads/*/frame/design.md`). (executed)

What matched: the six `*-dialog.png` were taken again on the merged window. `night-watch-dark-dialog.png` and `register-light-dialog.png` show the "Branch" field under "Starts from" with "No branch yet". They show the line "No branch yet. The first commit or a rename makes owlery/show-the-seal-on-a-line.", in the sans for Night watch and in the fixed-width face for Register, as `trail/phases/phase-4.md` *Screenshots* says. Behind the dialog the inbox shows the release's "1 reversed, word not committed". (read)

What matched: the two rows the fold changed are true at the target. The `#commitWord` row says a renamed routing is committed there, and the `#commitOwed` row says it commits nothing for a null branch. The `#214` row of `frame/plan.md` *Overlap with the release* says the merge added `branch` and `ownsBranch` to the compared values (`renderer.ts:1208-1212`). (read)

The two daemon cases the crafter saw fail under load both passed in this round: "refuses a rename of the branch while the work item's chain is running, …" within its group of 30, and "reads no count while no client is connected, …" alone. Reading the second case shows why it is open to load. It waits 100 ms after the client closes and then counts every `git rev-list`. A work item with no branch now runs `headCounts`, then `headStands`, then `baseDistance` at each read. So a read already under way when the client closes runs more `git` in series than a branched work item did, and under load it can still run past those 100 ms. The product does what *Scope* item 6 states. The case's margin is the release's, and this work did not change it. The crafter's logs (`merge/run1.txt` to `merge/run8.txt` in its scratch directory) do not name the filters they ran. Their daemon runs total 264 of the file's 420 cases, so they are a sample. The orchestrator's broad run answers for the rest.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether `makeBranch`'s `git switch -c` should run under a bound, as the release's #264 bounds a commit. `git switch` runs the repository's `post-checkout` hook, and a hook that never ends would hold `this.changing`, and every creation, rename and delete behind it. `createWorktree`'s `git worktree add` runs that hook too, and nothing bounds it either. The #264 rule bounds commits alone, so neither call breaks it. | `apps/desktop/src/daemon/worktrees.ts`, `makeBranch` | the orchestrator: an issue, or nothing |
| Whether `makeBranch`'s repair from `HEAD@{1}` holds on a git older than 2.54, carried from round 1. | `apps/desktop/src/daemon/worktrees.ts`, `makeBranch` | the orchestrator |
| The suite whole, the typecheck and the built-app files, including the daemon groups the crafter's logs do not show it ran. The crafter's label is `unverified`, and the round found it honest: no record or commit message of the range claims a whole run. | the repository | the orchestrator, by the broad gate |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/worktrees.test.ts test/view.test.ts test/decision-record.test.ts`, in `apps/desktop` | 3 files, 764 cases passed |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "the commit of a person's word"` | 30 cases passed, the rename refused while a chain runs among them; 390 skipped |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "^the inbox "` | 55 cases passed; 365 skipped |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "reads no count while no client is connected" --reporter=verbose` | 1 case passed alone, in 1300 ms |
