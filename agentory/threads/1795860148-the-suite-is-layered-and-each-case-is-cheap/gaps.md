# Closing memo: 1795860148-the-suite-is-layered-and-each-case-is-cheap

## Not verified

| Item | Who must answer |
|---|---|
| Phase 1: every test file passes in the project its layer line names, under that layer's guards. The phase ran one file of each layer, and a file named `logic` whose cases start a process fails at the guard | the orchestrator, by whole run M1 |
| Phase 1: the typecheck of the whole app with `allowJs` set in `apps/desktop/tsconfig.json`. The phase typechecked the files it changed and `vitest.config.mts` with a configuration that names them | the orchestrator, at the broad gate |
| Phase 1: `pnpm --filter @owlery/desktop run test:unit` runs the three layers before the built app and no other file | the orchestrator, by whole run M1 or phase 5's `check` |
| Phase 1: the reporter's step summary and warning annotations on GitHub's runner | the pull request's first `check` run, read by the orchestrator (*Q3*) |

## Not done

The phase left the last bullet of `docs/architecture.md` *Measure before building* and its Korean twin as they stand. Since phase 1 they are false where they say the configuration tells a built-app file by its import of `buildApp`, and phase 6 (*Scope* item 14) moves the bullet to `docs/testing.md`. The phase also left the head comment of `.github/workflows/check.yml`, which phase 5 rewrites with the four jobs.

The launcher removes the folder of the run's git configuration when vitest exits, and keeps waiting for vitest at an interrupt from the terminal. A launcher killed by another signal leaves the folder under the system's temporary folder. The phase did not handle that case, because a signal sent to the launcher alone does not reach vitest, and the launcher would then remove a folder a running vitest still reads.
