# The pull request check

This folder holds the scripts of Owlery's pull request check. The check runs on GitHub, without the app: a pull request whose branch declares a work item carries the records it owes, and a ready one carries a seal at its head. A pull request that declares no work item is not judged.

The app does not ship this folder and the daemon runs none of it. The workflow of a connected repository fetches the folder from Owlery's repository and runs `skills/code-review/scripts/chain_check.py` on Python 3.12 or newer, with the standard library alone. `chain_check.py` finds every other script by a path from its own file, so each file keeps its place under this folder.

## Where the files come from

The scripts started from AgenticSeal 0.38.4 (https://github.com/MichaelYcJo/AgenticSeal, tag `v0.38.4`, commit `0eca6e7`): `chain_check.py` and the 18 files it loads, each at the path it had there. AgenticSeal is under the MIT License, and its text is `LICENSE` in this folder.

The files are Owlery's own from the day they were taken, and Owlery changes them for its own records. Owlery follows no release of AgenticSeal, and nothing holds a file here to AgenticSeal's bytes. What Owlery changed is in git.

The refusals of the broad gate's arm and of the guarantee's arm say what Owlery's daemon does: what it writes where a record is missing or holds no block, and what follows a verdict that is not `sealed`. The refusals of the other arms still name `seal` commands, the orchestrator and AgenticSeal's templates. The issue that builds each stage of a work item rewrites what its stage prints.

## The cases

`apps/desktop/test/pr-check.test.ts` runs the check as GitHub does, with `python3` in temporary repositories and a pull request's payload in `GITHUB_EVENT_PATH`. A change to a script here runs with those cases.
