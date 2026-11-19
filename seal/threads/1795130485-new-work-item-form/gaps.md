# Closing memo: the new work item form (#85)

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the whole typecheck and the broad gate at the branch's head. Phase 1 ran the four case files it changed and `tsc` over the nine files it changed (`trail/phases/phase-1.md`) | the orchestrator's broad run |
| The test files that read a path phase 1 changed and that phase 1 did not run: `apps/desktop/test/last-look.test.ts`, and `apps/desktop/test/korean-input.test.ts` with `apps/desktop/test/memory.ts`, which start the built app. Among them is scenario 10's case, that the form of `47c4f61` still opens a pane against the changed daemon | the orchestrator's broad run, and phase 2's run of scenario 10's case |
| That the remotes other than `origin` are tried in the order of their names where git lists them in another order. `apps/desktop/src/daemon/worktrees.ts#basesOf` sorts them, and `git remote` of git 2.50.1 already prints them sorted, so no case and no mutant can tell the sort from its absence | the proofer's reading of `basesOf` |
| How long a plan takes in a repository with many branches. A plan reads every local branch and every remote's branch at each request (`frame/questions.md` Q3) | phase 2, which measures it before it chooses the form's wait |
| A creation and a plan in a person's own repository, with the remotes and the branches a real one holds. Every case ran on a temporary repository or a temporary clone of one commit | the owner, at the first work item made with the built app after phase 2 |

## Not done

The local list of a plan holds the work items' own branches, such as `owlery/fix-the-login-bug`, because `frame/design.md` *Scope* item 6 lists "the other local branches". Leaving them out was within reach in `apps/desktop/src/daemon/worktrees.ts#basesOf`. It was not taken: starting a work item from another work item's branch is a use the frame does not rule out, and whether the menu should show them is a choice about the product. It is a question for the owner, and phase 1's hand-back carries it to the orchestrator.

The two test files each keep a `commit` helper of their own beside the new `apps/desktop/test/repositories.ts#commitFile`. Folding them into one was within reach and is no part of this work.
