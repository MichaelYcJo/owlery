# Closing memo: each role's tools, and permission requests that reach the daemon

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite, and the typecheck at the last commit of the branch. Phase 1 ran three test files at `cc30449`, and phase 2 seven at `a41484a`, each with the typecheck before its commits. The files that start the built app and launch no headless session were not run after the daemon gained `permissions` | the orchestrator, by the broad gate |
| closed A real role session of Claude Code lists exactly its role's tools in its `init` line. Phase 1 read the arguments a script in the CLI's place received, and the frame's probe of `--tools` ran with no login | the run of `frame/design.md` scenario 20 at `a41484a`: the `init` line of a proofer's session on 2.1.330 lists `Bash`, `Glob`, `Grep` and `Read` (`trail/phases/phase-2.md`) |
| A real crafter's and a real sealer's session: the tools in the `init` line, a crafter's write allowed inside the worktree and refused outside it. Scenario 20 spent the one real session on a proofer. The daemon's rule for the two is held through the fake adapter | #41 for the crafter and #42 for the sealer, by the first real run each makes |
| A session with no role, on the real CLI, whose request waits and is answered by a person. The wait and both answers are held through the fake adapter, and the adapter's writing of an allowance through a script in the CLI's place. No real session was allowed for it | the owner, once phase 3 gives the window the answer, by asking a question in a work item's view that needs a command |
| The existing case of `apps/desktop/test/role-session.test.ts`, a real proofer session that answers from its definition, its rules and a file of the bundle, was not run after the launch gained `--tools` and `--permission-prompt-tool stdio` and the head gained its paragraph on tools. Phase 2 moved its launch into a function the file's second case shares, and that function ran in the second case | the owner, with `pnpm --filter @owlery/desktop run role:run` |
| Claude Code 2.1.326 to 2.1.329 read `--tools` and `--permission-prompt-tool stdio` as 2.1.330 does (`frame/questions.md` Q5) | a measurement on such a version, by whoever meets one |

## Not done

Nothing within phase 1's row was left. What the frame puts out of scope is in `frame/design.md` *Scope*, items 18 to 26.

Phase 2 left nothing of its row. One thing asked beside the row was not built: the coordinator asked mid-phase that each refusal by a role's rule be kept with the run, so that a work item's records can say how often a role reached past its tools. It needs a new field of `HeadlessInfo` and a bound, and `frame/design.md` *Scope* item 22 gives the record of refused calls to #41. The grounds and what the tree gives today are in `trail/phases/phase-2.md`.

Until phase 3, a session with no role that asks for permission waits unseen: the window shows no request and offers no answer, so the session works until its limit. Phase 3 is the window, and it waits for #119.
