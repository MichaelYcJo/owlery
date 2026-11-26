# Closing memo: 1795701355-257-a-store-it-cannot-read-is-kept

## Not verified

| Item | Who must answer |
|---|---|
| Phase 1 changed `apps/desktop/src/daemon/repositories.ts`, which every test file that starts a `Daemon` loads through `daemon.ts`. Phase 1 ran `repositories.test.ts`, `daemon.test.ts` and `chain.test.ts`. Every other such file, the repository-wide suite, the typecheck of every package, and the count of headings and table rows across `docs/*.md` against their `.ko.md` editions were not run | the orchestrator, at the broad gate |
| The cases of a file of mode `000` and of a run directory of mode `0500` in `repositories.test.ts` hold only for a user the permissions bind. Run as root, the store reads the first file and renames inside the second folder, and both cases fail. This Mac ran them as a user. The CI's check runs on `macos-latest` with no container (read: `.github/workflows/check.yml:23`), and cases in `daemon.test.ts`, `decision-record.test.ts` and `worktree-setup.test.ts` already rely on a file's mode there. No CI run of these cases has been seen | the orchestrator, from the CI's run of the pull request |
| `chain.test.ts:3500`, `stops the chain where the stage fails, … and gh that never ends`, timed out at 60 seconds at `a1e6a960`, at `8b9ecaba` and at the base `86c1fa18`, each under a load average of 37 or more from other work on this Mac (`trail/phases/phase-1.md`). Whether it passes on a quiet machine was not seen | the orchestrator, at the broad gate, which runs with nothing beside it |

## Not done

The comment at `apps/desktop/src/daemon/daemon.ts:1020` still says "Where that file was lost or read as no repository". Since this phase, a refused file is kept aside. `frame/plan.md` gives that comment to phase 2 (*Scope* item 7), and phase 1 left it there.
