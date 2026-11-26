# Review round 6: 1795610869-217-a-new-work-item-picks-its-branch

```seal
target: 66a29c61, fixes a2978c23..66a29c61
```

A verifying round of one commit. The broad gate at `a2978c23` failed on the typecheck, at `apps/desktop/test/screenshots.test.ts(674,74)`. That line handed `queued.branch`, typed `string | null` since this work's *Scope* item 1, to `git rev-list`. #224 and #263 brought the line, and the merge at `c89a35b7` left it as it was. `66a29c61` changes that line alone and no source. Round 5 left no finding open and closed none, so no earlier finding is owed a `confirms:`, `regression:` or `reopens:` line. The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at `66a29c61`. None of them changed in the range, and the commit makes none of their sentences false.

## Findings

None.

## Confirmations

What matched: the fix holds the screenshot run as it was. Read at `apps/desktop/test/screenshots.test.ts:672-678`, the change does three things:

- it takes `branch` from the work item the daemon lists as `QUEUED`;
- it throws a sentence that names the work item where that branch is null;
- otherwise it hands `git rev-list` the same arguments as before.

The run stores `QUEUED` through `parkedOnAQuestion`, which makes its worktree with `branchedWorktree` (`chain-run.ts:532`). So the daemon lists it on a branch, and the throw is never reached on a run that goes as stored. The throw stands where a run would otherwise hand git the word `null`. (read)

What matched: no other line of the file hands git, or a routing, a branch the daemon sent that may be null. The search `grep -n "\.branch\b\|{ branch }" apps/desktop/test/screenshots.test.ts` at the target prints `:675`, the fix, and three other lines. Lines `:782`, `:789` and `:794` read `branchedWorktree`'s answer, whose `branch` is a `string`. Line `:864` reads a listed branch only for whether it stands. The search is a sample under contract rule 12, and a read through a destructured name or a helper escapes it. The typecheck is the method that makes the list whole. The orchestrator reports it ran with no error at `66a29c61`, and this round did not run it. (executed and read)

The new guard does what `test/repositories.ts#branchOf` already does, which the same file imports and uses (`screenshots.test.ts:925`, `:937`): it throws for a null branch and gives the string otherwise. `branchOf(queued)` would make the guard one call and keep one statement of it. The inline guard's sentence names the work item and why the run expected a branch, where `branchOf` says "the work item has no branch". Neither form changes what the run does, so this is no finding. The commit's subject, "the screenshot run's delete view says so where the queued work item has no branch", says less than the change does. The change stops the run with that sentence, and the view says nothing.

Nothing of this round stays open. What comes due is the orchestrator's broad run at `66a29c61`, and then the sealer's spawn.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The typecheck, the suite whole and the screenshot run at `66a29c61`. The round ran no test, since the changed line runs only in the screenshot run (`OWLERY_SCREENSHOTS=1`). The typecheck's clean result is the orchestrator's account. | the repository | the orchestrator, by the broad gate |
| Whether `makeBranch`'s repair from `HEAD@{1}` holds on a git older than 2.54, carried from round 1. | `apps/desktop/src/daemon/worktrees.ts`, `makeBranch` | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `grep -n "\.branch\b\|{ branch }" apps/desktop/test/screenshots.test.ts` | five lines: `:675`, `:782`, `:789`, `:794`, `:864` |
