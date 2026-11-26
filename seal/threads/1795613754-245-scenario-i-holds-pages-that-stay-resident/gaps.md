# Closing memo: heavy-run scenario I waits for a reading that memory pressure never gives

## Scope confirmation

Scenario I of `apps/desktop/test/heavy-run.test.ts` starts its child with random contents it keeps writing, in place of zeroed pages left idle; the runner, its reading of memory and every other case are unchanged. Executed on 2026-11-25 on the owner's 16 GB machine, beside a Python process holding 3 GB of random bytes: the old child's resident size fell from 79,200 KiB to 8,640 KiB within a second and the old case timed out after 50,730 ms; the new child stayed at about 74,700 KiB and the new case passed. Alone, the file's 8 cases passed. The version moves to 0.0.5 in `apps/desktop/package.json` and in `.github/workflows/owlery-seal.yml`, as the first pull request into `release/v0.0.5`.

## Not verified

| Item | Who must answer |
|---|---|
| closed The whole suite at this branch's head | answered: the broad gate passed at `2873f66e`, the last run of this work item's `trail/gate.md`, after which only the work item's records changed (`git diff --name-only 2873f66e 67299565` outside its directory prints nothing); the `check` workflow passed on pull request #247 at `67299565`, the head it merged from |
| closed Whether `.github/workflows/owlery-seal.yml` at 0.0.5 runs on GitHub: its clone of `v0.0.5` fails until the tag exists, and its clone of `release/v0.0.5` needs that branch on the remote | answered: the `seal` check, which `.github/workflows/owlery-seal.yml` runs, passed on pull request #247 and on every later pull request of the release, the last #301 at `a25cb04a`, by its clone of `release/v0.0.5` while no tag `v0.0.5` exists |

## Not done

nothing
