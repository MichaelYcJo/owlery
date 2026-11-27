# Implementation Plan: a check that never got a runner runs again (#296)

## Technical context

The tree as read at `6ce877e7`.

`.github/workflows/check.yml:23` runs the job `check` on `macos-latest` at each pull request into `main` or a release branch, with `cancel-in-progress` on the group of the pull request's number (lines 14 to 16). `.github/workflows/package.yml:35` runs the job `package` on `macos-latest` at a pushed tag and on a person's request, with `cancel-in-progress: false`. Each workflow holds one job. No workflow reads another's runs, and none holds `actions: write`.

The work adds a third party to those two: a workflow on `ubuntu-latest` that GitHub starts when a run of either completes, and a command it runs. The command stands in a file of its own so that the suite can run it against a stand-in `gh`, as `apps/desktop/test/fixtures/sample-gh/gh` already stands in for `gh` in other cases. The suite runs inside Electron's Node (`apps/desktop/scripts/test-in-electron.mjs`), so a case starts the command as a process of its own.

Constraints the build meets:

- A no-runner attempt's run reads `failure`, so the workflow cannot select on the run's conclusion `cancelled`. The command decides on the job (`frame/design.md` *Data & interfaces*).
- The jobs' list of a `check` run can hold the check run `seal`, which is no job. It has no step, and its `runner_id` is null and not 0.
- `workflow_run` starts from the default branch's copy of the file, so nothing on GitHub can exercise the workflow before the release merges into `main`.

**The failure scenario of the chosen approach.** In six months GitHub rewords the annotation `The job was not acquired by Runner of type hosted even after multiple attempts`. The command then reruns nothing, and each no-runner attempt costs a rerun by hand again. Nothing goes red, since a job with another annotation is one the command must leave alone. What shows it is the command's line in the run's summary, which prints the messages it read, and the case of scenario A, whose fixture holds the old sentence and so does not fail. Whoever next reruns a `check` by hand reads that summary. The second scenario: GitHub refuses the rerun from the workflow's token. Then each run of the new workflow that meets a never-started job ends red on `main`'s commit and names the refusal (`frame/questions.md` Q1).

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| A `workflow_run` workflow that reruns the never-started job, deciding on the job's four facts in a command the suite runs | The one in *Technical context*: a reworded annotation ends the reruns without a red run. | **Chosen.** It changes no line of `check.yml` or `package.yml`, adds no check to a pull request, and each of its refusals is a case. |
| Replace the structure: one workflow that holds the suite and its own retry, with a second job that `needs` `check` and runs the suite again where `check` was cancelled | The first job's cancelled check stays listed on the pull request's head. `seal pr-wait` exits 1 on a cancelled check, and the app reads it as failed, so the pull request is never green at HEAD though the suite passed. | Rejected. The premise that keeps the two workflows as they are is that a rerun of the same run replaces the cancelled check with the new attempt's, which the history shows: attempt 2 of run 45855610271 was a no-runner attempt at commit `3da05835`, attempt 3 passed, and pull request #294 merged at that commit with its `check` listed once, as `SUCCESS` (executed: `gh pr view 294 --json state,mergedAt,headRefOid,statusCheckRollup`). |
| Move `check` to another arm64 label, `macos-15` or `macos-26` | The annotation's notice names "macOS arm64 runners", and `macos-latest` already is `macos-26-arm64`. The job waits on the same pool and is cancelled the same way. | Rejected. |
| Move `check` to an Intel label, `macos-15-intel` or `macos-26-intel` | The suite and node-pty's rebuild have never run on Intel, the app ships for Apple silicon alone, and three issues (#291, #292, #295) were timed cases failing on a slow runner. A label change that turns the suite red blocks every pull request two days before the release. | Rejected for this work. No probe can run: the framer may dispatch no workflow. A later issue can try the label in a pull request of its own. |
| Select on the run's conclusion `cancelled` in the workflow's `if:` and rerun with `gh run rerun --failed` | The no-runner attempts read `failure`, so the `if:` matches none. Widened to `failure`, `--failed` reruns a job that ran and failed, which is the defect the routing names. | Rejected. The command reruns by job id. |
| Tell a never-started job by "no runner and no step" alone, without the annotation | A job that a newer push cancelled while queued has the same two facts (job 139331652385). Its rerun joins the pull request's concurrency group and cancels the run of the newer commit. | Rejected. The annotation is the fourth fact. |
| Bound the reruns by time since the run was created, or by a count kept in a file or a label | A stored count is a second copy of what `run_attempt` already says, and a time bound needs a clock comparison per run. | Rejected. `run_attempt` is GitHub's own number and rises by one per rerun. The ceiling of 5 comes from the history: the longest row of no-runner attempts is attempts 1 to 4 of run 45431101334, and attempt 5 got a runner. |
| Rerun without reading the branch's head | In the seconds between the cancellation and the rerun a push can land. The rerun of the older commit's run then cancels the newer commit's run through the concurrency group, and that cancellation is not one the command reruns. | Rejected. One read of the ref closes all but the time between that read and the request. |
| Write the decision inline in the workflow as a `jq` filter or with `actions/github-script` | No case can run it, so scenarios A to I would be read and never executed. | Rejected. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1, 2, 3, 4 and 5, test first: the cases of item 5, then the command, then the workflow. The fixtures are the answers GitHub gave for the runs and jobs that *User scenarios & acceptance* names, read with `gh api` and stored under `apps/desktop/test/fixtures/`, with nothing but the fields the command reads. | The cases of `apps/desktop/test/rerun-unstarted.test.ts` pass, run narrow through the runner of heavy commands, and each case that *User scenarios & acceptance* marks "shown red" was seen red as its cell says. Scenario J is read at review. Scenario K stays `unverified`, and `frame/questions.md` Q1 names its answerer. The broad gate is the orchestrator's. | |

## Overlap with the release

The spawn names no other open work item of release 0.1.0, so this plan states no merge order.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| none named | | | |

## Operational impact

- **A new permission.** The workflow `.github/workflows/rerun-unstarted.yml` holds `actions: write`. No other workflow of the repository holds it, and no repository setting changes: the token's default stays read, and the workflow's own `permissions` block raises it for that one job.
- **No secret, no dependency, no version move.** The command uses the workflow's token and Node's own modules. The pull request moves no version.
- **It serves no pull request before the release merges.** `workflow_run` starts from the copy of the file on `main`. Under `docs/roadmap.md` *Releases and the tracker* this pull request merges into `release/v0.1.0`, so the remaining pull requests of release 0.1.0 still need their never-started `check` rerun by hand. The first run it can serve is the `package` run at the tag `v0.1.0`.
- **A new entry in the Actions list per run.** Each completed run of `check` or `package` starts a run of the new workflow. Where the run succeeded, the new run's job is skipped.
- **A waiting session can read one exit 1.** `frame/design.md` *Data & interfaces*, the paragraph **What a pull request shows**, states the gap and what the session does.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
