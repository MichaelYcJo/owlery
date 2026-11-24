# Phase 1: 1795559734-role-refusal-reaches-the-daemon

## What this phase found

**The frame held against the tree at `02b9e50e`, and the build follows it.** Every coordinate of `frame/design.md` *Grounding* and `frame/plan.md` *Technical context* was opened before the build: the wrapper script at `role-session.test.ts:92`, the prompt at `:54` and its use at `:153`, the assertion at `:165`, the opening comment at `:1` to `:17` and the `describe` title at `:56`, `claude.ts#claudeEnv` at `:116` to `:123`, the spawn at `:484`, `role-grants.ts#verdictOn`, and `vitest.config.ts` (read). `git grep -n 'REFUSAL_PROMPT' -- apps/desktop` at `92f94607` printed the two lines *Removes* row 1 names (executed).

**Q2 is answered: the hand check makes two runs of the CLI through the wrapper script, and both take the variables.** The daemon runs the CLI for the read of its version (`claude.ts`, `notice`) and for the role session (`claude.ts`, `start`) (read). A refresh of an account's usage runs only on a client's `refreshUsage` request (`daemon.ts:1822`), and `claudeLogins` runs only on the requests `signIn`, `readSignIn` and `removeAccount` (`daemon.ts:1613` to `:1675`). The hand check sends none of them (read). The wrapper script sets the five variables on its first lines, before its `--version` branch, so the read of the version runs under the case's home and config folder too. In every run the stand-in model received two requests, each `POST /v1/messages?beta=true`, and nothing else: the first with no tool result, the second carrying the refusal (executed). After a run the case's config folder held what the CLI writes there, `.claude.json`, `projects`, `sessions`, `plugins` and `backups`, and the home folder stayed empty (executed, one run's kept folder listed).

**Under an agent's environment Vitest hides a passing case's console output, so each run here passed `--reporter=default`.** `pnpm run role:refusal` with no extra argument passed and printed nothing of the case's `console.log`, neither the kept folder nor the CLI's version. The same run with `--reporter=default` printed both (executed). The session that ran the phase has `AI_AGENT` and `CLAUDECODE` set, and Vitest then picks another default reporter. A person who runs the script in a terminal gets the default reporter. In this phase the flag reached Vitest through `pnpm run`, and the scripts in `apps/desktop/package.json` stayed as they were. Phase 2 adds the flag to the two scripts (`frame/design.md` *Scope* item 10).

**At this phase's commit, the daemon of the hand check resolved one path of the person's Claude Code folder.** `claude-accounts.ts#conversationsIn` takes the real path of `projects` under System default's folder, `.claude` of the person's home, when the daemon reads the agent notice (`daemon.ts:3690`) (read). It opens no file there. At this phase's commit no run of the CLI read or wrote the person's Claude Code folder, and that one resolution by the daemon did reach it: the stand-in shell printed no `__owlery_config` line, so the daemon had no other folder for System default. Phase 2 has the shell print that line (`frame/design.md` *Scope* item 2).

**Scenario 3 is red on the reason's assertion.** `seal mutate` wrote `runs: true` into the proofer's row of `role-grants.ts#GRANTS`, ran `pnpm run role:refusal --reporter=default`, and restored the file (executed). The case failed at `role-session.test.ts:206`:

```
AssertionError: expected [ { isError: false, …(1) } ] to deep equally contain { isError: true, …(1) }
+ Received: [ { "content": "(Bash completed with no output)", "isError": false } ]
```

The stand-in was told that the command ran. The case did not reach the line that reads `README.md`, and the scratch repository is removed when the case ends, so the file's `a repository\nx` of the scenario was not read. The tool result is the CLI's own report that the command ran.

**Scenario 4 is red on the request's assertion.** `seal mutate` made the stand-in answer every request with text, so it issued no call (executed). The case failed at `role-session.test.ts:204`:

```
AssertionError: expected [] to deep equally contain { tool: 'Bash', …(1) }
```

**The launch's two variables each have a case that fails without them.** Both runs used `seal mutate` on `role-session.test.ts` after the build's commit (executed).

- With the line that exports `ANTHROPIC_API_KEY` deleted, the case failed at `role-session.test.ts:198`, `expected 'none' to be 'ANTHROPIC_API_KEY'`, and the session ended with `Not logged in · Please run /login`. The CLI found no login under the case's config folder, so the person's login was not reached.
- With `ANTHROPIC_BASE_URL` pointed at port 9 of the loopback, where nothing listens, the case failed at `role-session.test.ts:201` with *Scope* item 5's message, `the CLI did not reach the stand-in model: expected 0 to be greater than 0`. The session ended `failed` with `API Error: Connection refused`, and no assertion of the daemon's was reached. The CLI retried for about three minutes before it gave up, inside the case's 280 seconds for the session, so a CLI that cannot reach the stand-in costs a person that wait before the message.

**The six runs of scenarios 1 and 2 passed at the phase's tree.** Each ran after the wait for other Vitest processes, as `OWLERY_BACKGROUND=1 pnpm run <script> --reporter=default`, and its exit code was read directly (executed).

| Run | Script | Exit code | CLI version printed | Reason the stand-in was told | Requests the stand-in received |
|---|---|---|---|---|---|
| 1 | `pnpm run role:refusal` | 0 | 2.1.331 | Owlery gives the proofer no command that asks for permission. | 2 |
| 2 | `pnpm run role:refusal` | 0 | 2.1.331 | the same | 2 |
| 3 | `pnpm run role:refusal` | 0 | 2.1.331 | the same | 2 |
| 4 | `pnpm run role:refusal:sealer` | 0 | 2.1.331 | Owlery gives the sealer no command that asks for permission. | 2 |
| 5 | `pnpm run role:refusal:sealer` | 0 | 2.1.331 | the same | 2 |
| 6 | `pnpm run role:refusal:sealer` | 0 | 2.1.331 | the same | 2 |

Each run's two requests were `POST /v1/messages?beta=true`, and the session's answer was the stand-in's line of text. These six runs and the `seal mutate` runs above are the phase boundary's set: the plan's cases, the one test file the phase changed, and the only file that imports the new helper. No test file of the app lists the `test` folder: each `readdirSync` of the test files lists a temporary folder a case made (read). `vitest.config.ts` lists it, and is no test file.

**Two rows of the stand-in's answers were not exercised.** No run of 2.1.331 asked `POST /v1/messages/count_tokens` or a path the stand-in answers with 404 (executed, in the six runs' lists of requests). Phase 2 removes the `count_tokens` answer and keeps the 404 row (`frame/design.md` *Scope* item 11).

**Scenarios 5, 6 and 7 hold.** Scenario 5: each run asserted `apiKeySource` as `ANTHROPIC_API_KEY`, and the wrapper script's text exports `HOME` and `CLAUDE_CONFIG_DIR` as the folders `home` and `config` of the case's kept folder (executed, and read in one kept folder's `claude-copying`). Scenario 6: without the stand-in model's address, `launched` writes the wrapper script from an empty prefix and the same text as at `92f94607`, and launches the daemon with the same options (read in the diff); the case itself was not run, as `gaps.md` says. Scenario 7: `git grep -n 'REFUSAL_PROMPT' -- apps/desktop` at the phase's commit printed nothing and exited 1 (executed).

**A typecheck of the app passed before the commit.** `pnpm exec tsc --noEmit` in `apps/desktop` exited 0 (executed). It checks the whole app, because the project's configuration has no way to check two files alone. It does not stand for the broad gate's typecheck, which `gaps.md` leaves to the orchestrator. The repository configures no linter and no formatter.
