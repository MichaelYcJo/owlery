# Closing memo: 1795610869-217-a-new-work-item-picks-its-branch

## Not verified

| Item | Who must answer |
|---|---|
| How the window draws a work item with no branch: "No branch yet" in the sans and muted in a line's preview, a view's head and a line's last fact (`list.ts`, `work-item-view.ts`, the `.branch.none` rule of `index.html`). `view.test.ts` pins the words and the `none` flag, and no case renders them, since no creation makes such a work item before phase 3. | phase 4's built-app batch and its screenshots, built by the crafter of phase 4 |
| The chain's loop stopping where it meets a work item with no branch (`daemon.ts#chainBranch`). No path sets a branch back to null after a chain starts, so no case reaches it (read). | the proofer, by reading |
| `daemon.ts#commitWord` committing nothing where the work item's branch is null. No path reaches it with a null branch: `#personWrote` refuses the word first, and a renamed routing is written only where a branch was renamed, never where a rename made one (read). | the proofer, by reading |
| `daemon.ts#branchUp` doing nothing where the daemon closed while its turn waited on `changing`. No case closes a daemon with a turn queued (read). | the proofer, by reading |
| Whether a commit that lands while `git switch -c` runs is left off the branch on a git older than 2.54, down to the 2.31 `worktrees.ts` asks for, as it is on 2.54 (`trail/phases/phase-2.md`). The probe and the case ran git 2.54 alone. `makeBranch`'s repair reads `HEAD@{1}`, whose meaning those versions share, so on any of them the branch is moved on where the race left a commit off it. | the orchestrator: accept it, or file an issue for a run on an older git |

## Not done

- **`OldWorkItem.branch` was left a `string`**, though `frame/design.md` *Scope* item 1 names it. `work-items.json` is never written, and every entry of it carries a branch (`trail/phases/phase-1.md`).
- **The log line of a refused making is not deduplicated.** While a rebase is under way in the worktree of a work item with no branch and a window is open, the daemon tries again at each read, every `commitPollMs` (3000 ms by default), and logs git's refusal each time. `frame/design.md` *Scope* item 6 asks that the log say why and that the next read try again. A line every three seconds costs log bytes only for the length of the rebase, and keeping the last reason for each work item would be state with no case behind it.
