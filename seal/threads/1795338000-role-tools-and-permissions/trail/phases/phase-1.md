# Phase 1: 1795338000-role-tools-and-permissions

## What this phase found

**The frame holds for this phase.** Read at `df2fdc4`: `claudeArgs` stands at `apps/desktop/src/daemon/adapters/claude.ts:51-73`, the table of each pair's documents at `adapters/claude-roles.ts:26-30` and `rulesHead` at `54-69`, as `frame/plan.md` *Technical context* states. The tree holds no `seal/follow-up.md`. Q1 and Q2 of `frame/questions.md` stand at their defaults, by the spawn.

**Decisions made while building, each with its grounds.**

- **The grants are a table with one row for each pair, and the type of a pair's key moved to the grants' module.** `PairKey` stood private in `adapters/claude-roles.ts`. It now stands in `src/daemon/role-grants.ts`, exported, with `pairKey(role)`, and `claude-roles.ts` imports both. Grounds: a table keyed by the pair makes the typecheck refuse a pair of `ROLE_STAGES` that has no grant, where a `switch` on the role's name would give a new stage of a known role that role's grant in silence. The neutral module cannot import a type from an adapter's module, so the type moved to the neutral side. Judged against `frame/design.md` *Scope* item 1 and the comment on `ROLE_STAGES` in `src/shared/protocol.ts`. This departs from *Data & interfaces*, which names neither export. The move adds no behaviour: the existing case "holds the core and the agent contract for every pair, then the documents the role opens first at its stage" proves `roleDocuments` through the moved key, and `git grep -n -e PairKey -e pairKey` prints lines of those two files alone.
- **`role-grants.ts` holds `RoleGrant` and `grantOf` and nothing else of *Data & interfaces*.** `Verdict`, `verdictOn` and `PermissionAction` belong to *Scope* items 5 and 8, which are phase 2's. Judged against `frame/plan.md` *Phases*.
- **The head's new paragraph stands straight after the list of documents, before the paragraph on what the bundle does not hold.** *Data & interfaces* says "after the list of documents", and this is its nearest reading.
- **Scenario 1's case launches a script in the CLI's place once for each pair and reads the arguments the script received.** A case over `claudeArgs` alone would not hold that the adapter's launch passes the role's own tools. The exact list of a role launch's arguments stays pinned by the existing case of the group "the Claude adapter's launch", which gained `--tools`.
- **The comment on `ROLE_STAGES` in `src/shared/protocol.ts` now names the grants' row.** It said a new stage is one pair and one row of each adapter's table, and a new stage now also needs a row of the grants. The comment is the one change of the commit `cc30449`, which follows the code's commit `72026ce`.

**Scenario 3 added no code.** The existing case was widened to every pair and to `acceptEdits`, `auto`, `dontAsk` and `--permission-prompts`, and it was green against the code as it stood. It was shown red with one guard removed at a time (executed, `seal mutate`): the mode written as `acceptEdits` fails at `test/claude-adapter.test.ts:84` with `expected 'acceptEdits' to be 'default'`, and an added `--permission-prompts none` and an added `--dangerously-skip-permissions` on a role launch each turn the case red. The case compares whole arguments, so phase 2's `--permission-prompt-tool` is not refused by the name `--permission-prompts`. Executed at `72026ce`: `git grep -n -e dangerously-skip-permissions -e bypassPermissions -e allow-dangerously -- apps/desktop/src apps/desktop/role-bundle` prints nothing and exits 1, and the same patterns over `apps/desktop/test` find `claude-adapter.test.ts`, so the pattern can match.

**Seen red before the code** (executed, `node scripts/test-in-electron.mjs test/claude-adapter.test.ts` against `df2fdc4` with the cases written): four cases failed and 63 passed. The exact arguments of a role launch failed on the missing `--tools`. The case over every pair's launch failed with `proofer: expected [] to have a length of 1`. The head's case failed on the missing paragraph. Scenario 3's case failed there on `toolsOf is not a function`, which names no guard of its own, so its red is the mutation above.

**Mutation, after the commit `72026ce`** (executed, `seal mutate`, every mutant red, none survived):

- `src/daemon/role-grants.ts`: each of the three rows with its `writes` flipped, against the case over every pair's launch.
- `adapters/claude-roles.ts#toolsOf`: `Bash` removed, `NotebookEdit` added, and the two branches swapped, against the same case.
- `adapters/claude-roles.ts#rulesHead`: "and no other" removed, ", and no person is asked" removed, the last sentence removed, and the names written as a fixed proofer's list, against the head's case.
- `adapters/claude.ts`: `--tools` and its value removed, the names joined by a space, and `launchOf` giving a proofer's tools to every role, against the case over every pair's launch.

**`RoleGrant.runs` is read by nothing yet.** No case of this phase fails where a row's `runs` is flipped. Phase 2's `verdictOn` is its first reader, and its cases are what hold the three values.

**The head says more than the tree does until phase 2.** The paragraph says "The daemon answers every call that asks for permission by the rule of your role". After this phase alone such a call is still denied inside the CLI, as `frame/plan.md` *Phases* says. The sentence is built as framed because the branch merges whole, by squash (`routing.md`, *Branch*). Where phase 2 does not land in this pull request, the sentence has to change before the merge.

**What phase 2 meets.**

- Three cases pass a literal list of a proofer's tools to `claudeArgs`: the exact arguments of a role launch and the case "writes the pair's rules file into its folder" in `test/claude-adapter.test.ts`, and the launch case of `test/role-bundle.test.ts`, which starts the built app.
- The case over every pair's launch expects `--plugin-dir` two arguments after `--tools`. `--permission-prompt-tool stdio` goes before `--tools`, as *Data & interfaces* places it, and the case then stands.
- `test/ask-section.test.ts` starts the built app with a script as the CLI and launches a session with no role, so it reads `claudeArgs` and the adapter's handling of the input.

**The phase boundary** (executed at `cc30449`, with nothing uncommitted but this record and `gaps.md`): `node scripts/test-in-electron.mjs test/claude-adapter.test.ts test/role-bundle.test.ts test/ask-section.test.ts` in `apps/desktop` exited 0 with 3 files and 80 cases passed. The same command had passed at `72026ce`. The two files that start the built app ran one after the other, as the `app` project of `vitest.config.ts` runs them. No test file globs `src/daemon`, and the repository has no contribution guide, so no tree-wide file joined the set. `test/role-session.test.ts` also imports the adapter. It was not run: its one case launches the person's own `claude`, and this phase makes no real turn.

**Before each of the two commits**, `pnpm run typecheck` in `apps/desktop` exited 0. The project has one TypeScript configuration and no narrower typecheck, and the repository configures no linter and no formatter. The worktree had no `node_modules`, so `pnpm install --frozen-lockfile` was run in it once.
