# Closing memo: 1795559734-role-refusal-reaches-the-daemon

## Not verified

| Item | Who must answer |
|---|---|
| `pnpm run role:run`, the first case of `apps/desktop/test/role-session.test.ts`, at the work item's last commit. `frame/questions.md` Q1 took its default, `no`, so neither phase ran it. The diff was read instead: without the stand-in model's address, `launched` writes the wrapper script and the stand-in shell and launches the session as at `92f94607`, and `role:run` in `apps/desktop/package.json` is unchanged | the owner |
| The whole suite, the typecheck over the whole app and the documents' checks of the `Broad gate` key, at the work item's last commit. Phases 1 and 2 each ran the hand check alone, through its two scripts, and a typecheck of the app before each code commit (`trail/phases/phase-1.md`, `trail/phases/phase-2.md`) | the orchestrator, at the broad gate |
| Whether the CLI reached any host other than the stand-in model during the phases' runs. The stand-in sees only the requests it receives, and no capture of the CLI's connections was made. The CLI ran with `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` and a placeholder key, so no request could spend the person's usage | a measurement: a capture of the CLI's connections during one run of `pnpm run role:refusal`, which the orchestrator may order |
| Whether the hand check's daemon opens or resolves any path under `.claude` of the person's home. Phase 2 answered `frame/questions.md` Q3 `none` by reading the daemon's readers of a Claude Code folder (`trail/phases/phase-2.md`). No run traced the daemon's reads of files, and the runs showed only where the CLI wrote | a measurement: a trace of the test process's file reads during one run of `pnpm run role:refusal`, which the orchestrator may order |
| Whether the CLI writes anywhere outside the case's home and config folder during a run of the hand check. Every run asserts only that `projects` stands in the case's config folder, and three runs listed the two folders afterwards (`trail/phases/phase-1.md`, `trail/phases/phase-2.md`). No run traced the CLI's writes | a measurement: a trace of the CLI's file writes during one run of `pnpm run role:refusal`, which the orchestrator may order |

## Not done

Nothing within the reach of phase 1 or phase 2.
