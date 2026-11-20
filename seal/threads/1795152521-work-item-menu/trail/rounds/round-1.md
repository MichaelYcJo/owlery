# Review round 1: 1795152521-work-item-menu

```seal
target: 80c8a03 against release/v0.0.1
```

The round reads phase 1 of `frame/plan.md` *Phases*: the code of `65c57e5` and `8107fa2`, its record in `228a382` (`trail/phases/phase-1.md` and `gaps.md`), and the orchestrator's fold `80c8a03`. Phases 2 to 6 are not built, and their absence is no finding here. This is the first round, so no fact was carried from an earlier one: every fact below was opened or run at `80c8a03`. `seal/parity.json` does not exist, so no comparison with an original was owed.

Read whole at `80c8a03`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md` and `trail/phases/phase-1.md`. No `changelog.md`, `pr.md` or `pr.en.md` stands yet; the fragment is phase 6's.

## Findings

### 1. The records hand the reuse of a removed id to phase 5, and phase 3 removes entries first

```seal
severity: should
location: `seal/threads/1795152521-work-item-menu/gaps.md:19`, `seal/threads/1795152521-work-item-menu/trail/phases/phase-1.md:19`
evidence: read `seal/threads/1795152521-work-item-menu/gaps.md:19`, `seal/threads/1795152521-work-item-menu/trail/phases/phase-1.md:19`, `seal/threads/1795152521-work-item-menu/frame/plan.md:74`, `seal/threads/1795152521-work-item-menu/frame/design.md:96`, `apps/desktop/src/daemon/repositories.ts:213`, `apps/desktop/src/daemon/repositories.ts:228`
```

Why it matters: the phase 3 crafter reads these two records to learn what phase 1 left for later, and both name phase 5. Phase 3 then builds the first removal without the point.

The claim: `gaps.md:19` says "no entry can be removed before phase 5", and `trail/phases/phase-1.md:19` says "**Phase 5 has to look at this again**: once a delete takes the work item with the highest id out". What the frame says: `frame/plan.md:74`, row 3, builds "item 16 with neither checkbox", and `frame/design.md:96`, *Scope* item 16, says "Removing a repository takes it and its work items, the archived among them, out of the store." So phase 3 removes work items and a repository from the store, two phases before the delete. What the code does: `apps/desktop/src/daemon/repositories.ts:213` gives a new work item the highest id of the store plus one, and `:228` does the same for a repository. After a removal, the next creation takes the removed work item's id. The daemon's maps keyed by a work item's id (`commitCounts`, `aheadCounts` and `branches` in `apps/desktop/src/daemon/daemon.ts`), a pane's `workItemId` and a look's entries would then name the new work item. The window's fold, kept by a repository's id (`apps/desktop/src/renderer/sidebar.ts`, `folded`), would pass to a new repository that takes a removed one's id.

The same point stands in no third place: `git grep -n -i -e "phase 5" -- seal/threads/1795152521-work-item-menu` finds these two lines alone. Where the orchestrator would rather put the point in `frame/plan.md` *Phases* row 3 itself, that row is where a fold puts it.

```markdown
<!-- gaps.md:19, the paragraph whole -->
The store gives a new work item one more than the highest id it holds, and a new repository one more than the highest repository's id. Keeping a count that never goes back was within reach, in `apps/desktop/src/daemon/repositories.ts`. It was not taken: no entry can be removed before phase 3, and `frame/design.md` *Scope* item 1 names the fields a stored repository holds, a count not among them. Phase 3's removal of a repository takes it and its work items out of the store (`frame/design.md` *Scope* item 16), so phase 3 decides the point first, and phase 5's delete meets it again. `trail/phases/phase-1.md` hands the point to phase 3.

<!-- trail/phases/phase-1.md:19, the bullet whole -->
- A new work item's id is one more than the highest id of the whole store, and a new repository's one more than the highest repository's. **Phase 3 has to look at this again, and phase 5 after it**: once a repository's removal (phase 3, `frame/design.md` *Scope* item 16) or a delete (phase 5) takes the work item with the highest id out, the next creation gets that id. A pane, the daemon's reads of a branch kept by the work item's id, or a look that still names the old work item would then name the new one. A removed repository's id is given again the same way, and the window's fold of the removed repository passes to the new one.
```

```seal
verdict: fixed 749af84
answer: The finding holds. Both sentences now hand the point to phase 3. They are written in the fix pass's own words and not the paste-ready ones, which had phase 3 decide the point: the framer has since decided it (`e0cc7bf`), and `frame/plan.md` *Phases* row 3 gives phase 3 the counts that keep an id from being given twice, before its removal. `gaps.md` says so and cites the row, and the bullet of `trail/phases/phase-1.md` names what a reused id would break, a repository's id and the window's fold among it.
```

### 2. The fold's sentence says `done` answers every new request, `planRename` and `readLoss` among them

```seal
severity: should
location: `seal/threads/1795152521-work-item-menu/frame/design.md:190`
evidence: read `seal/threads/1795152521-work-item-menu/frame/design.md:190`, `apps/desktop/src/shared/protocol.ts:215`, `git show 80c8a03 -- seal`
```

Why it matters: phase 2 builds `planRename`, and phase 5 builds `readLoss`. Each crafter reads this sentence for what the daemon answers. As written, it has the daemon send `done` and also `renamePlan` or `workItemLoss` to one request, and the window take two answers for one `requestId`.

The fold `80c8a03` rewrote the sentence from "`done` answers each of those that changed something" to "`done { requestId: number }` answers each of them". The sentence stands under the list of new client messages, so "them" names all eleven, `planRename` and `readLoss` among them. The same bullet then names `renamePlan` and `workItemLoss` as answers, without saying which request each one answers. The code states the narrower rule: `apps/desktop/src/shared/protocol.ts:215` says `done` "Answers a request that was carried out and has no other answer". The frame and the code now read two ways, and only the code's reading is the one the work means. The bullet is the one statement of the fact in the frame: `git grep -n "done" -- seal/threads/1795152521-work-item-menu/frame` finds it there alone.

```markdown
- New server messages. `done { requestId: number }` answers each of them that has no answer of its own, which is every one but `planRename` and `readLoss`, before the `inbox` that carries a change; a request that changed nothing, such as an `addRepository` of a repository already stored and shown, gets `done` and no `inbox`. `renamePlan { requestId: number; branch: string | null; blocked: string | null }` answers a `planRename`. `workItemLoss { requestId: number; id: number; loss: WorkItemLoss }` answers a `readLoss`. A request that fails is answered with the `error` message of `95decb6`.
```

```seal
verdict: fixed e0cc7bf
answer: The finding holds, and the framer's commit `e0cc7bf` repaired the sentence in `frame/design.md` *Data & interfaces*: `done` answers each new request that has no answer of its own, every one but `planRename` and `readLoss`, and the bullet says which request `renamePlan` and `workItemLoss` each answer. The fix pass read the sentence at `ad2f240` and changed nothing for it.
```

### 3. `addRepository` refuses an empty folder and adds the daemon's own repository for a relative one

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:299`, `apps/desktop/test/daemon.test.ts:812`, `seal/threads/1795152521-work-item-menu/trail/phases/phase-1.md:12`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_relative_add.test.ts` from `apps/desktop` (exit 0, see `## Probes`); read `apps/desktop/src/daemon/daemon.ts:299`, `apps/desktop/src/main/daemon-client.ts:50`
```

Why it matters: the guard exists so that a client's folder never makes git answer for the folder the daemon runs in. It stops one spelling of that input and lets the rest through.

The claim: `trail/phases/phase-1.md:12` says "Git run with an empty folder answers for the folder the daemon runs in, so the daemon would add that repository", and `apps/desktop/src/daemon/daemon.ts:299` refuses a folder that is no string or is `""`. The cause the record names reaches every relative folder, not the empty one alone. Git runs with the folder as its working folder, and Node resolves a relative working folder against the daemon's own. The probe called `repositoryOf(".")` and `repositoryOf("src")` with the working folder `apps/desktop` and got the worktree's top-level folder both times. So `addRepository` with `folder: "."` adds and stores the repository the daemon runs in. `apps/desktop/src/main/daemon-client.ts:50` starts the daemon with the app's working folder: `/` for a packaged app, which git refuses, and the clone itself under `electron .`.

Where it can be reached: the window sends `addRepository` only with the folder the system's dialog returns (`apps/desktop/src/renderer/sidebar.ts:65`), which is absolute. A relative folder comes from a second client of the daemon's port, such as the probe client phase 1 used.

The same cause stands in two places this diff did not change, at `85c381a`: `checkNaming` (`apps/desktop/src/daemon/daemon.ts:28-31`) lets a relative `repo` reach `createWorktree` and `planWorktree`, and `workItemFields` (`apps/desktop/src/renderer/view.ts:761-765`) lets a relative folder typed into the form through, refusing only an empty one with the same reasoning. The snippet below stops at `addRepository`. The fix pass owes those two places a fix or a deferral, because since phase 1 a creation in a relative folder also stores that folder's repository.

```ts
// apps/desktop/src/daemon/daemon.ts, the import from node:path
import { basename, isAbsolute } from "node:path";

// apps/desktop/src/daemon/daemon.ts:298-299, in the case "addRepository"
// A folder that is not absolute, the empty one among them, would have git answer for the folder the daemon itself runs in.
if (typeof message.folder !== "string" || !isAbsolute(message.folder)) throw new Error("a repository is added by a folder inside it");
// Precondition: POSIX paths, as on macOS; `isAbsolute` reads the text alone and resolves no symlink, which git does after.

// apps/desktop/test/daemon.test.ts:812, the refusals the case holds
for (const [requestId, wrong] of [[2, 7], [3, ""], [4, undefined], [5, "."], [6, "src"]] as const) {
```

The case's name at `apps/desktop/test/daemon.test.ts:803`, "one whose folder is no folder's name", then reads "one whose folder is no absolute folder's name". The bullet at `trail/phases/phase-1.md:12` then reads: "A `folder` that is no string, and one that is not absolute, the empty one among them, is refused with \"a repository is added by a folder inside it\". Git run with a relative folder answers for the folder the daemon runs in, so the daemon would add that repository."

```seal
verdict: fixed 6f7a15c
location: `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/test/daemon.test.ts`, `seal/threads/1795152521-work-item-menu/trail/phases/phase-1.md`, `apps/desktop/src/renderer/view.ts`, `apps/desktop/src/shared/protocol.ts`
answer: The finding holds, for `addRepository` and for the two places of the base code. `addRepository` refuses a `folder` that is not absolute, as the paste-ready fix has it. `checkNaming` refuses a `repo` that is not absolute, in a creation and in a plan, with "the repository folder has to be a whole path from /, and <the folder> is not": a creation stores its folder's repository since phase 1, so it is inside this work item's reach. `workItemFields` keeps its code, since the daemon's refusal reaches the form as a plan's and a creation's error, and its comment now says who refuses what. `8a27255` says the same in the protocol's comments, which is why `location:` names `view.ts` and `protocol.ts`. The cases differ from the paste-ready ones in one way: each stands the suite's process in a temporary repository first (`standingIn`), because a relative folder resolves against the suite's own folder, and the red run of the creation's case would otherwise have cut a branch in the repository the suite runs in. Seen red at `ad2f240` with the cases alone, exit 1: the three cases ended at their 5 seconds, each waiting for a refusal the daemon did not send. `seal mutate` at `6f7a15c`: 3 mutants, 3 red, exit 0, the two guards put back to the empty folder alone and the sentence's words. The record's bullet reads as the round proposes, with a sentence on the creation and the plan.
```

## Confirmations

What matched: *Scope* item 1, the store. `apps/desktop/src/daemon/repositories.ts:164` starts from `work-items.json` only where `repositories.json` does not exist, and `:235` makes one repository for each distinct folder, in the order of each one's first work item, with every new field at its empty value. The case at `apps/desktop/test/repositories.test.ts:175` holds that `work-items.json` keeps its bytes after the first change. Executed with the seven files below.

What matched: *Scope* item 2 and *Data & interfaces*, the shape of a response. Walked from the frame to the code: `Repository` carries the eight fields the frame lists (`apps/desktop/src/daemon/daemon.ts`, `repositoryOf`, pinned by the key list in `apps/desktop/test/daemon.test.ts`), `WorkItem` gains `repoId`, `pinned`, `muted`, `groupId` and `archivedAt` (pinned by `WORK_ITEM_FIELDS`), and `ready` and `inbox` gain `repositories` and `archived` (`apps/desktop/src/daemon/daemon.ts:517`). An archived work item stands in `archived` and not in `workItems` (`:512`), and the look keeps the work items an inbox lists. No field is sent that the frame leaves out. Executed.

What matched: *Scope* item 2, an earlier daemon. `apps/desktop/src/renderer/view.ts:129` gives no repository and the sentence of the frame, word for word at `:120`, where a `ready` carries no `repositories`. The window keeps it apart from a refusal's notice (`apps/desktop/src/renderer/sidebar.ts`, `showStatus`). The case of `daemonLists` in `apps/desktop/test/view.test.ts` holds the words. Executed for the function, read for the status line.

What matched: *Scope* item 3. `apps/desktop/src/daemon/daemon.ts:295` adds the repository of the folder's top-level folder, answers `done` before the `inbox` (`:302`), and sends no `inbox` for an add that changes nothing. A folder outside any git repository gets the sentence a creation gets, since both run `repositoryOf`. A hidden repository is shown again by an add and by a creation (`apps/desktop/src/daemon/repositories.ts:221`). The sidebar's button adds the folder chosen (`apps/desktop/src/renderer/sidebar.ts:65`). Executed for the daemon and the store, read for the button. Finding 3 is the one gap.

What matched: *Scope* item 4 and scenario 5 without its pin and its group. `apps/desktop/src/renderer/view.ts:154` lists every repository that is not hidden, in the store's order, a repository with no work item among them, and leaves out one with nothing left while a search or a filter narrows. The row holds the fold, a "+" button that opens the form on the repository's folder (`apps/desktop/src/renderer/sidebar.ts:168`) and a "..." button with `aria-haspopup` and no listener (`:170`), as `frame/plan.md` *Phases* row 1 says. Executed for the tree, read for the row.

What matched: scenario 20 as the fold `80c8a03` rewrote it. `apps/desktop/src/daemon/last-look.ts:90` reads an absent `repoId` as 0, and the four other fields at their empty values. The fold's two other statements match the code too: the plan's constraint on the owner's app, and `done` for an add that changes nothing (`apps/desktop/src/daemon/daemon.ts:302`). Finding 2 is the part of the second one that reaches beyond the add.

What matched: `## Removes` rows 1 to 6. `apps/desktop/src/daemon/work-items.ts` and `apps/desktop/test/work-items.test.ts` are gone. Each of the eight cases of the old file has a counterpart in `apps/desktop/test/repositories.test.ts`, read case by case against `git show 85c381a:apps/desktop/test/work-items.test.ts`. The window makes up no repository, the add button no longer opens the form, and `LastLook`'s comment states the new rule. Read.

What matched: the phase record's runs. Claimed: seven case files, 380 cases, all passed. I ran the same command at `80c8a03`: 7 files, 380 passed, exit 0. Claimed: `git grep -n -e 'work-items\.json' -e 'WorkItemList' -- apps docs README.md README.ko.md` prints lines of the store, its cases and the daemon's cases alone. I ran it and got the same. The `seen red` runs and the `seal mutate` runs are read, not re-run: the record names each one's command and output file in the crafter's scratch.

What matched: the label of the suite. `gaps.md:7` labels the suite, the typecheck of the whole app and the broad gate as not verified and names the orchestrator. The list of built-app files phase 1 did not run, at `gaps.md:9`, is whole: `git grep -l BuiltApp -- apps/desktop/test` lists two case files, `korean-input.test.ts` and `work-item-form.test.ts`, and the helpers `built-app.ts`, `korean-pane.ts` and `memory.ts`. `git grep -l -e '"./korean-pane"' -e '"./memory"' -e '"./built-app"' -- apps/desktop/test` adds one case file to those two, `memory.test.ts`, the third the row names.

The new cases were read against their groups. Each case of `apps/desktop/test/repositories.test.ts` holds a fact the old file or *Scope* item 1 states. The daemon's cases under `describe("repositories")` hold the daemon's lists and answers, which the store's cases cannot reach. No case repeats another.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck of the whole app and the broad gate. This round ran four case files and one filtered run of `test/daemon.test.ts`, and the seven files phase 1 names | `apps/desktop` | the orchestrator, at the broad run |
| The built-app runs phase 1 made in a scratch clone: the one case of `test/korean-input.test.ts` and the probe `test_tmp_sidebar.test.ts`. This round started no app, because the sidebar's row is read in `apps/desktop/src/renderer/sidebar.ts` and scenario 7's file is phase 2's | `trail/phases/phase-1.md`, *The phase's cases* | the orchestrator, at the broad run |
| Whether a linked worktree's folder counts as a repository. `git rev-parse --show-toplevel` in a linked worktree gives that worktree's folder, so an add of an Owlery worktree's folder stores it as a repository of its own. *Scope* item 1 says "the repository's top-level folder" and does not say which. This matters before phase 5, whose Trash would then move a linked worktree's folder | `apps/desktop/src/daemon/worktrees.ts`, `repositoryOf`; `frame/design.md` *Scope* items 1 and 16 | the orchestrator, with the framer, before phase 3 |
| How a repository's row looks when drawn, with its "+" and "..." buttons | `apps/desktop/src/renderer/index.html`, `.repository-row` | the owner, as `gaps.md` names |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/repositories.test.ts test/last-look.test.ts test/view.test.ts`, from `apps/desktop` | 3 files, 214 cases passed, exit 0 |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "repositories\|work items\|the last look"`, from `apps/desktop` | 31 passed and 78 skipped, exit 0 |
| `node scripts/test-in-electron.mjs test/repositories.test.ts test/daemon.test.ts test/last-look.test.ts test/view.test.ts test/worktrees.test.ts test/appearance.test.ts test/themes.test.ts`, from `apps/desktop` | 7 files, 380 cases passed, exit 0 |
| `node scripts/test-in-electron.mjs test/test_tmp_relative_add.test.ts`, from `apps/desktop`, run once. The probe asserted that `repositoryOf(".")` and `repositoryOf("src")` give the top-level folder of the daemon's own working folder. It was removed from the tree after the run, and a copy stays in the round's scratch | 1 passed, exit 0: both relative folders gave the worktree's top-level folder |
