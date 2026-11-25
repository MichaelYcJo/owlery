# Closing memo: 1795610869-217-a-new-work-item-picks-its-branch

## Not verified

| Item | Who must answer |
|---|---|
| How the window draws a work item with no branch: "No branch yet" in the sans and muted in a line's preview, a view's head and a line's last fact (`list.ts`, `work-item-view.ts`, the `.branch.none` rule of `index.html`). `view.test.ts` pins the words and the `none` flag, and no case renders them, since no creation makes such a work item before phase 3. | phase 4's built-app batch and its screenshots, built by the crafter of phase 4 |
| The chain's loop stopping where it meets a work item with no branch (`daemon.ts#chainBranch`). No path sets a branch back to null after a chain starts, so no case reaches it (read). | the proofer, by reading |

## Not done

- **`OldWorkItem.branch` was left a `string`**, though `frame/design.md` *Scope* item 1 names it. `work-items.json` is never written, and every entry of it carries a branch (`trail/phases/phase-1.md`).
