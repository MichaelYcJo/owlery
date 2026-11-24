# The pull request check

This folder holds the scripts of Owlery's pull request check. The check runs on GitHub, without the app: a pull request whose branch declares a work item carries the records it owes, and a ready one carries a seal at its head. A pull request that declares no work item is not judged.

With `--post`, which the workflow Owlery writes passes, the check posts its verdict as the check `seal` on the pull request's head commit, with the run's token. A ready pull request with a seal at its head gets a passed check whose title names the sealed commit. One whose seal a later commit broke gets a failed check whose title says that the seal is broken and names the sealed commit: the guarantee's arm compares the sealed commit's tree with the head's and reads the commits of the base that a merge brought after the seal, so a merge commit after the seal breaks it as any other commit does, even one whose change the sealed tree already held. Each of the two titles also names the owl chain where every verdict block it names holds a `rules:` line, which the owl chain writes and the AgenticSeal plugin's sealer does not. The check reads the records the work item committed, as the app does, and records that no chain of the app commits, written by hand or by another tool, can be judged apart by the two: the check reads no `decisions.md`, for one. One with no seal there gets a failed check, and a draft that would be refused gets a neutral one. A request GitHub refuses, as it does for a pull request from a fork, changes nothing of the job's own result. Of the pull request's body the check reads the seal section alone, the lines between `<!-- owlery:seal -->` and `<!-- /owlery:seal -->`, which hold a copy of the newest verdict block of the work item's `guarantee.md`.

The app does not ship this folder and the daemon runs none of it. The workflow of a connected repository fetches the folder from Owlery's repository and runs `skills/code-review/scripts/chain_check.py` on Python 3.12 or newer, with the standard library alone. `chain_check.py` finds every other script by a path from its own file, so each file keeps its place under this folder.

## Where the files come from

The scripts started from AgenticSeal 0.38.4 (https://github.com/MichaelYcJo/AgenticSeal, tag `v0.38.4`, commit `0eca6e7`): `chain_check.py` and the files it loads, each at the path it had there. AgenticSeal is under the MIT License, and its text is `LICENSE` in this folder.

The files are Owlery's own from the day they were taken, and Owlery changes them for its own records. Owlery follows no release of AgenticSeal, and nothing holds a file here to AgenticSeal's bytes. What Owlery changed is in git.

The refusals of the broad gate's arm, of the guarantee's arm and of the body's arm say what Owlery's daemon does: what it writes where a record is missing or holds no block, what follows a verdict that is not `sealed`, and what the daemon copies into the body's seal section. The refusals of the other arms still name `seal` commands, the orchestrator and AgenticSeal's templates. The issue that builds each stage of a work item rewrites what its stage prints.

## The cases

`apps/desktop/test/pr-check.test.ts` runs the check as GitHub does, with `python3` in temporary repositories and a pull request's payload in `GITHUB_EVENT_PATH`. A change to a script here runs with those cases.
