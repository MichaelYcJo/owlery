# Implementation Plan: 1795559734-role-refusal-reaches-the-daemon

## Technical context

The tree as read at `92f94607`.

`frame/design.md` *Grounding* defines the hand check, the stand-in model and the wrapper script, and holds the probe this plan stands on.

- **The hand check today.** `apps/desktop/test/role-session.test.ts:151` to `:171`. Its helper `launched` (`:70` to `:134`) finds the real CLI through the person's login shell, writes the wrapper script (`:92`) and a stand-in shell that names it (`:93`), and starts a `Daemon` whose adapter is `claudeAdapter` with that shell (`:96` to `:103`). The daemon launches the session, answers its permission request by `role-grants.ts#verdictOn`, and the case reads the copy of the output stream the wrapper script kept.
- **Why it failed.** `role-session.test.ts:54` asks the role to run a command. `apps/desktop/role-bundle/agents/proofer.md` *Job* and `agents/sealer.md:27` tell the role to run no command that asks for permission. The role declined, as its definition says.
- **What the build stands on.** The real CLI of 2.1.331 takes the model's address from `ANTHROPIC_BASE_URL` and a key from `ANTHROPIC_API_KEY`, needs no login then, and brings a scripted `Bash` call to the session's output stream as a `can_use_tool` request (`frame/design.md` *The probe*).
- **Constraints.** `claude.ts#claudeEnv` passes the CLI no variable of the daemon's beyond its own list, so the variables enter in the wrapper script. `apps/desktop/vitest.config.ts` runs the file in the project `app`, one file at a time, because it imports `buildApp`. The test process is Electron's Node (`apps/desktop/scripts/test-in-electron.mjs`), and `apps/desktop/test/pr-check.test.ts:271` already starts a `node:http` server in it.

**The failure scenario of the chosen approach.** A later Claude Code sends the stand-in model a request it does not answer in the form that version needs: a new endpoint, a field the answer lacks, or a login it prefers over the key. The hand check then fails though the daemon refuses. *Scope* item 5 bounds the cost: the failure names the stand-in model, the case prints every request the server received, and the fix is one row of the answers table. The check runs by hand, so the failure meets a person who reads it and blocks no gate.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| **The stand-in model behind the real CLI** (`frame/design.md` *Scope* items 1 to 3) | Stated above. | Chosen. The call is issued by the case, not by a model's turn, and the real CLI still carries the request to the daemon and the refusal back. The probe showed each step on 2.1.331. |
| Reword the prompt so that the real model makes the call | The role's definition forbids the call. A model that follows the product's rules more closely fails the check more often, and three passes in a row show nothing about the next run. | Rejected. The cause is the rule, and the rule is correct. |
| Ask the real model for a command that looks like a read and that Claude Code still asks about | The set of commands Claude Code runs unasked differs by version. A version that runs the command unasked brings no request to the daemon, and the model may still decline. The check then fails for two reasons that are not the daemon's. | Rejected. |
| Keep the real model, and skip the case where it makes no call | A skipped run is no pass. With a role that holds to its definition, three passes in a row are never reached. | Rejected: the issue's second *Done when* line cannot be met. |
| A scripted CLI that writes the request itself | `apps/desktop/test/claude-adapter.test.ts:981`, `:1060` to `:1099` and `apps/desktop/test/daemon.test.ts:5711` already hold this in the suite. It shows nothing of the real CLI. | Rejected: it is what the suite does, and it would leave no check of the real CLI. |
| A command of the bundle, or a hook, that runs the shell command without the model | The launch disables every hook (`claude.ts#claudeArgs`, `disableAllHooks`). A command file would ship in the role bundle for a test alone. Whether such a command brings a `can_use_tool` request was not probed. | Rejected without a probe: it changes what ships. |
| Leave the scripts as they are, and have whoever runs them add `--reporter=default` | The next agent that runs the plain script reads a pass with no version and no kept folder, and writes a record without them or spends a run finding the flag. The knowledge stands in one phase record, which leaves the tree at the settle. | Rejected: the scripts change, *Scope* item 10. |
| Keep the stand-in model's answer for `count_tokens` | An answer no run asked for is never exercised, so nothing shows whether a later CLI accepts it. Without the row the request is refused by name and printed, which says more to the person who then adds the row. | Rejected: *Scope* item 11. |
| State that the daemon resolves one path of the person's folder, and change nothing | The sentence that the hand check touches nothing of the person's stays true of the CLI alone, and each later reader has to learn the exception. One line of the stand-in shell removes it. | Rejected: *Scope* item 2 as it now reads. |
| **Replace the structure: remove the hand check and its two scripts** | A Claude Code update stops bringing the request to the daemon, or stops honouring the refusal, and nothing shows it until a role session changes a file. | Rejected. The premise that keeps the hand check is that no suite case runs the real CLI, and that `--permission-prompt-tool stdio` is an option `claude --help` did not list (`docs/architecture.md` *Options for launching Claude Code*). Both were read at `92f94607`. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1 to 9, and the rows of *Removes*. | Scenarios 3 and 4 seen red, each with its one edit and then reverted. Scenarios 1 and 2: `pnpm run role:refusal` three times in a row, then `pnpm run role:refusal:sealer` three times in a row, at the phase's tree, each exit code read directly. Scenario 7: `git grep -n 'REFUSAL_PROMPT' -- apps/desktop` prints nothing; at `92f94607` it prints the two lines *Removes* row 1 names. Scenarios 5 and 6 read in the diff. The suite, the lint and the typecheck are `unverified`, and the orchestrator's broad gate answers them. | built `c8dc3fa`; `trail/phases/phase-1.md` |
| 2 | *Scope* items 10 and 11, and item 2 as it now reads: the stand-in shell's `__owlery_config` line, with `CLAUDE_CONFIG_DIR` gone from the wrapper script. The assertion scenario 5 adds. The sentences of `role-session.test.ts` and `model-stand-in.ts` that state what changed. | Scenario 5's new assertion seen red, with the stand-in shell's `__owlery_config` line removed. Scenarios 1, 2 and 8: `pnpm run role:refusal` three times in a row, then `pnpm run role:refusal:sealer` three times in a row, each with no further argument, at the phase's tree, each exit code read directly, and the version line of one run quoted. `frame/questions.md` Q3 answered in the record. The suite, the lint and the typecheck are `unverified`, and the orchestrator's broad gate answers them. | built `e11311c0`; `trail/phases/phase-2.md` |

Each run of the file waits first with `while pgrep -f 'vites[t]' >/dev/null; do sleep 20; done`, because other worktrees run suites on the same machine. Where a fix pass changes `model-stand-in.ts` or the hand check, the runs of scenarios 1 and 2 are owed again at the fix's commit.

## Overlap with the release

The other open work items the spawn names are #168, #154, #149, #134 and #32. Each one's `frame/design.md` is the unfilled template on its branch (read in each item's worktree at its routing commit), so each row is judged from the issue.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #149 | `apps/desktop/vitest.config.ts` reads every test file for an import of `buildApp`, and #149 changes how the files that import it reach the app. `role-session.test.ts` imports it and starts no app. This work edits that file and keeps the import. | #191 | This diff is one test file and one helper, and is likely sealed first. #149 then reads the file as it will stand and decides once whether a file that only builds the bundle belongs among the files that share one app. |
| #134 | #134 changes the daemon, and may add an option to `Daemon`'s constructor. `role-session.test.ts:96` constructs a `Daemon`, and the typecheck reads the file. | #191 | A change to the constructor's options touches every test that constructs one. The later item carries that one call with the others, inside rounds it spends anyway. |
| #32 | The same call, for the same reason. | #191 | The same. |
| #168 | `apps/desktop/package.json`: #168 moves the version, and this work adds an option to two lines of `scripts`. | #191 | The lines are apart, so git merges them without a hand. This diff is the smaller and is likely sealed first. |

#154 does not meet this work: it changes what the page raises under `OWLERY_BACKGROUND`, and the hand check starts no window.

## Operational impact

No migration, no new dependency and no variable of the app. This pull request does not move the version.

The hand check needs `pnpm install` in the worktree and a `claude` the person's login shell finds. It no longer needs a login.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
