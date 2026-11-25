# Closing memo: heavy-run scenario I waits for a reading that memory pressure never gives

## Scope confirmation

Scenario I of `apps/desktop/test/heavy-run.test.ts` starts its child with random contents it keeps writing, in place of zeroed pages left idle; the runner, its reading of memory and every other case are unchanged. Executed on 2026-11-25 on the owner's 16 GB machine, beside a Python process holding 3 GB of random bytes: the old child's resident size fell from 79,200 KiB to 8,640 KiB within a second and the old case timed out after 50,730 ms; the new child stayed at about 74,700 KiB and the new case passed. Alone, the file's 8 cases passed. The version moves to 0.0.5 in `apps/desktop/package.json` and in `.github/workflows/owlery-seal.yml`, as the first pull request into `release/v0.0.5`.

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite at this branch's head | the orchestrator's broad gate |
| Whether `.github/workflows/owlery-seal.yml` at 0.0.5 runs on GitHub: its clone of `v0.0.5` fails until the tag exists, and its clone of `release/v0.0.5` needs that branch on the remote | the orchestrator, from the pull request's checks |

## Not done

nothing
