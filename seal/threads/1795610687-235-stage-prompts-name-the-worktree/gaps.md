# Closing memo: 1795610687-235-stage-prompts-name-the-worktree

## Not verified

| Item | Who must answer |
|---|---|
| Q1 of `frame/questions.md`: whether a pane's subagent whose session stands in another worktree meets a permission question when it reads the worktree its prompt names. No real `claude` run was made. | the owner's walk (#184) |
| Q2 of `frame/questions.md`: whether a pane's crafter makes and commits its fixes in the worktree its prompt names, with `git -C` and its path. No real crafter run was made. | the owner's walk (#184) |
| closed `apps/desktop/test/daemon.test.ts` and `heavy-run.test.ts` at `05af4fb1`. The phase boundary's run failed cases of both, mostly with `posix_spawnp failed` and timed-out waits under the machine's load. A second run failed a different set, and a failing case passed alone (`trail/phases/phase-1.md`). Whether they pass on a calm machine was not seen. | executed at `12c19090` by round 1's fix pass: one `--project unit` run of both files with eleven other files that read the changed paths passed, 706 cases, under a load average of 3 to 6 |
| The full suite, the typecheck of every package and the broad gate's other checks, the built-app files among them. The phase ran the unit files that read the changed paths and `tsc --noEmit` of the desktop app. | the orchestrator, at the broad gate |

## Not done

- **`owed`'s JSON does not name the worktree.** `design.md` *What the daemon could do beyond the issue* names a `worktree` field as cheap and leaves the choice to the orchestrator, and the plan does not plan it. Building it unasked would be work beyond the plan.
- **No issue is filed for the other three items of that section.** Filing an issue is the orchestrator's act, and this definition names no such write.
