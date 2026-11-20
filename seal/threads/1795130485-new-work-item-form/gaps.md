# Closing memo: the new work item form (#85)

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the whole typecheck and the broad gate at the branch's head. Phase 1 ran the four case files it changed and `tsc` over the nine files it changed (`trail/phases/phase-1.md`). Phase 2 ran the two case files it changed and `tsc` over the four files it changed (`trail/phases/phase-2.md`) | the orchestrator's broad run |
| The test files that read a path phase 1 or phase 2 changed and that neither ran: `apps/desktop/test/last-look.test.ts`, `apps/desktop/test/themes.test.ts`, which holds `index.html` to the themes' variables, and `apps/desktop/test/memory.test.ts` with the cases of `apps/desktop/test/korean-input.test.ts` other than scenario 10's, which start the built app and open a pane through the form | the orchestrator's broad run |
| closed scenario 10's case, that the two drivers still open a pane through the form | phase 2 ran `apps/desktop/test/korean-input.test.ts -t "opens one pane through the form, of the shell kind"` at `769ccc5`, exit 0, and the two drivers' files do not differ from `47c4f61` (`trail/phases/phase-2.md`) |
| That the remotes other than `origin` are tried in the order of their names where git lists them in another order. `apps/desktop/src/daemon/worktrees.ts#basesOf` sorts them, and `git remote` of git 2.50.1 already prints them sorted, so no case and no mutant can tell the sort from its absence | the proofer's reading of `basesOf` |
| closed how long a plan takes in a repository with many branches. A plan reads every local branch and every remote's branch at each request (`frame/questions.md` Q3) | phase 2's probe timed a plan in a temporary clone: 28 ms with one branch, 130 ms with 2,000 more, 420 to 870 ms with 12,000 more. The form waits 150 ms after the last key (`trail/phases/phase-2.md`) |
| A creation and a plan in a person's own repository, with the remotes and the branches a real one holds. Every case ran on a temporary repository or a temporary clone of one commit | the owner, at the first work item made with the built app after phase 2 |
| How the form looks when drawn: the branch and the folder under the name, the refusal in their place, and the menu "Starts from" with its two groups. The built-app case reads the page's elements and never the window as a person sees it | the owner, or whoever the orchestrator names, at the first opening of the form in the built app |
| The form against a daemon an earlier build started, which answers no plan. `read` in `apps/desktop/src/renderer/renderer.ts`: with no answer the form shows no branch, the menu stays disabled, and the creation sends no `base`. No case starts an earlier daemon | the proofer's reading of `renderer.ts#askPlan` and `#createWorkItem` |
| Two lines of the window that no case and no mutant reads: the wait `PLAN_WAIT_MS` before a plan is asked after a key, and the redraw at a key of the repository field, which takes the earlier text's branch and bases off the form before the new answer | the proofer's reading of `renderer.ts#askPlanSoon` and the `input` listener of the repository field |
| The menu in a repository with thousands of branches. The probe timed the daemon's plan there and not the window, which builds one option for each base at each answer | the owner, where such a repository is used; `frame/plan.md` *Technical context* names a search in the menu as what it then needs |

## Not done

The local list of a plan holds the work items' own branches, such as `owlery/fix-the-login-bug`, because `frame/design.md` *Scope* item 6 lists "the other local branches". Leaving them out was within reach in `apps/desktop/src/daemon/worktrees.ts#basesOf`. It was not taken: starting a work item from another work item's branch is a use the frame does not rule out, and whether the menu should show them is a choice about the product. It is a question for the owner, and phase 1's hand-back carries it to the orchestrator.

The two test files each keep a `commit` helper of their own beside the new `apps/desktop/test/repositories.ts#commitFile`. Folding them into one was within reach and is no part of this work.
