Closes #328.

- "The "New work item" form's `close` listener in `apps/desktop/src/renderer/renderer.ts` ends nothing while the form stands open again." (`gaps.md` *Scope confirmation*)
- "So a close event the page delivers after the form reopened no longer cancels the plan of the name typed in it." (`gaps.md` *Scope confirmation*)
- "That cancelled plan is what the first case of `apps/desktop/test/chain-choice.test.ts` waited for on the hosted runner, and the new case of `apps/desktop/test/work-item-form.test.ts` pins the fix." (`gaps.md` *Scope confirmation*)
- "the pull request's title takes `fix` and not the branch's `test`, because the change that closes the issue is a guard in `apps/desktop/src/renderer/renderer.ts` against a defect a person can meet, reopening the form before the page delivered its close event; `test` came closest, since the defect was seen through the suite on the runner and the work adds a case." (`routing.md` *Why this way*)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
