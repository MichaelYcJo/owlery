# Design: a check that never got a runner runs again (#296)

## Grounding

The tree as read at `6ce877e7`.

In this file a **never-started job** is a job of a workflow run attempt that GitHub cancelled because no hosted runner took it. *Data & interfaces* gives the four facts that define one.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/roadmap.md` *Releases and the tracker*, the bullet that opens **Each release is built on a release branch of its own.** | The pull request of this work merges into `release/v0.1.0`, and `main` receives it when the release merges. `main` and `release/v0.1.0` both stood at `e7737b7e` on 2026-11-27 (executed: `git ls-remote --heads origin`). |
| `docs/architecture.md` *Platforms and their order*, the paragraph that opens **The macOS app ships as a `.dmg` for Apple silicon** | The `package` workflow runs at a tag and reads the signing secrets. This work changes nothing in that file. It reruns a `package` job only where the job never started, so no step that reads a secret runs twice. |
| The policy root holds no index, `docs/README.md` (executed: `ls docs/README.md` names no such file). | The `file:` of each operation in *Rule changes* was picked by reading the headings of `docs/roadmap.md` and `docs/architecture.md`. The release rules stand in `docs/roadmap.md` *Releases and the tracker*. |
| No policy document states a rule on `.github/workflows/check.yml` or on a rerun (executed: `git grep -n -i -e 'rerun' -e 're-run' 6ce877e7 -- docs README.md seal ':!seal/threads'` prints one line, `docs/product.md:109`, which is about edits made outside the app). | The rule this work adds is new, and *Rule changes* states it. |

What the tree and GitHub's records answered, each with the command that gave it:

| Fact | Label | Source |
|---|---|---|
| Issue #296's comment of 2026-11-27 holds the cause: each cancelled attempt had no runner and no step and ended about 15 minutes after it was queued. | executed | `gh issue view 296 --json title,body,comments` |
| Among the `check` runs listed on 2026-11-27, the attempts that lasted about 15 minutes and hold a job of conclusion `cancelled`, `runner_id` 0, an empty `runner_name` and no step are run 45855610271 attempt 2, run 45686383614 attempt 1, run 45658318711 attempt 1, and run 45431101334 attempts 1, 2, 3, 4 and 6. Each was followed by a rerun. | executed | `gh api repos/{owner}/{repo}/actions/runs/<id>/attempts/<n>/jobs` for each attempt of each `check` run whose `run_attempt` is above 1 |
| Each of those jobs carries an annotation of level `failure` whose message is `The job was not acquired by Runner of type hosted even after multiple attempts`. | executed | `gh api repos/{owner}/{repo}/check-runs/<job id>/annotations` for each of those jobs |
| The run attempt that holds such a job has the conclusion `failure`, not `cancelled`: run 45855610271 attempt 2, run 45686383614 attempt 1 and run 45431101334 attempt 6 each read `failure`. A filter on the run's conclusion `cancelled` would match none of the three. | executed | `gh api repos/{owner}/{repo}/actions/runs/<id>/attempts/<n>` |
| A job that a newer push cancelled while it was queued also has `runner_id` 0 and no step: job 139331652385 of run 45650015251, which ended 1 second after it was created. Its annotation reads `Canceling since a higher priority waiting request for check-253 exists`. So "no runner and no step" does not tell the two kinds apart, and the annotation does. | executed | the same two reads |
| A job that ran and failed has a runner, steps and the conclusion `failure`: job 140033044156 of run 45855610271 attempt 1. A job cancelled while it ran has a runner and steps: job 137556298780 of run 45134108687. | executed | the same two reads |
| The list of a `check` run's jobs can hold an entry that is no job of the workflow: the check run `seal` that `chain_check.py --post` writes, with `runner_id` null, no label, no step and the conclusion `success` (id 140207960481 in run 45907578756 attempt 1). | executed | `gh api repos/{owner}/{repo}/actions/runs/45907578756/attempts/1/jobs` |
| Most reruns in that history followed a job that ran and failed, which is none of this work's subject: run 45839258691 attempts 1 and 2 and run 45614364110 attempts 1 and 2 are four of them. | executed | the same listing, kept under the framer's scratch directory as `attempts.tsv` |
| `macos-latest` resolved to the image `macos-26-arm64` on 2026-11-26. That passing `check` job spent 15 seconds in `install` and 12 minutes 39 seconds in `pnpm -r run check`. | executed | `gh api repos/{owner}/{repo}/actions/jobs/140213970027/logs` and the job's `steps` |
| The jobs that run on macOS are `check` of `.github/workflows/check.yml` and `package` of `.github/workflows/package.yml`. `records` of `.github/workflows/owlery-seal.yml` runs on `ubuntu-latest`. | executed | `git grep -n 'runs-on' -- .github` |
| No workflow of the tree holds `actions: write` or `workflow_run`. | executed | `git grep -n -e 'actions: write' -e 'workflow_run' 6ce877e7 -- .github` exits 1 |
| The repository is public, and a workflow's token defaults to read. | executed | `gh api repos/{owner}/{repo}` and `gh api repos/{owner}/{repo}/actions/permissions/workflow` |
| The head of a branch whose name holds a slash reads from `repos/{owner}/{repo}/git/ref/heads/<branch>`. | executed | `gh api 'repos/{owner}/{repo}/git/ref/heads/release/v0.1.0'` |
| A `workflow_run` workflow starts only where its file stands on the default branch, and it runs at the default branch's last commit. The activity type `requested` does not occur when a run is rerun. The page says nothing of `completed` at a rerun. | read, through a fetched summary of GitHub's page *Events that trigger workflows* | `https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows` |
| `POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun` reruns a job and the jobs that depend on it, and answers 201. The page does not say whether a workflow's own token with `actions: write` is accepted. | read, through a fetched summary of GitHub's page *REST API endpoints for workflow runs* | `https://docs.github.com/en/rest/actions/workflow-runs` |
| The standard hosted macOS labels are `macos-latest`, `macos-15` and `macos-26` on arm64, and `macos-15-intel` and `macos-26-intel` on Intel. `macos-13` and `macos-14` are not listed. | read, through a fetched summary of GitHub's page *GitHub-hosted runners* | `https://docs.github.com/en/actions/reference/runners/github-hosted-runners` |
| `seal pr-wait` decides once no check is pending and every `pull_request` run on HEAD has completed, and a cancelled check ends it at exit 1. | read | the docstring of `skills/code-review/scripts/pr_wait.py` in the AgenticSeal plugin, 0.39.1 |
| The app reads a pull request's checks from `gh pr view`'s `statusCheckRollup` each time it reads the pull request. A completed check whose conclusion is not `SUCCESS`, `NEUTRAL` or `SKIPPED` reads as failed. | read | `apps/desktop/src/daemon/github.ts#checkOf` |
| The two operations of *Rule changes* parse with no error, and each lands as one new bullet and its check line after line 80 of its document. | executed | one run of a probe under the framer's scratch directory that hands this file to `parse` and `apply_op` of `pr-check/skills/settle/scripts/rule_changes.py`, from a clone of the branch at `6ce877e7` |
| The orchestrator's line on the issue's comments: the last comment holds the cause, read from the runs' jobs and annotations on 2026-11-27. | the orchestrator's finding, opened and confirmed by the reads above | the spawn prompt |

Not verified, and who answers it: whether GitHub accepts the rerun request from the workflow's own token, and whether the end of a rerun attempt starts the `workflow_run` workflow again. Both are `frame/questions.md` Q1.

## Scope

In scope:

1. A command, `.github/scripts/rerun-unstarted.mjs`, that reads one completed run attempt and asks GitHub to rerun each never-started job of it, and no other job. *Data & interfaces* fixes its inputs, its reads, its one write and its lines.
2. The command asks for no rerun where the attempt's number is 5 or more. So a run gets at most 4 reruns from this command, and a fifth attempt's cancellation stays.
3. The command asks for no rerun of a `pull_request` run whose branch has moved off the run's commit, or whose head repository is not this repository.
4. A workflow, `.github/workflows/rerun-unstarted.yml`, that runs the command when a run of `check` or of `package` completes with a conclusion other than `success`. It holds `actions: write`, `checks: read` and `contents: read`, and no other permission.
5. Cases in `apps/desktop/test/rerun-unstarted.test.ts` that run the command against a stand-in `gh`, one or more per row of *User scenarios & acceptance* that names a case.

Out of scope, each with its reason:

- **A change of the runner label of `check` or `package`.** The annotation names the arm64 pool, and `macos-latest`, `macos-15` and `macos-26` are all arm64, so another arm64 label draws on the same pool. The Intel labels are another pool, but nobody has run the suite or node-pty's rebuild on one, and the framer may dispatch no workflow to find out. `frame/plan.md` *Alternatives considered* holds the row.
- **A rerun of a job that ran and failed.** Issues #291, #292 and #295 fixed timed cases, and a failing case is read by whoever waits on the pull request.
- **A change to `seal pr-wait`.** It is the AgenticSeal plugin's file and not this repository's.
- **A split of the suite across jobs.** The issue named it for the case where a 15-minute limit on the run stood. The comment of 2026-11-27 showed that no such limit exists.
- **A change to `.github/workflows/check.yml`, `.github/workflows/package.yml` or `.github/workflows/owlery-seal.yml`.** The new workflow reads their runs from outside, so none of the three needs a line.

## User scenarios & acceptance *(mandatory)*

Where a *Verifiable how* cell says "a case", the case stands in `apps/desktop/test/rerun-unstarted.test.ts`.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A. A job that never got a runner runs again | Given a completed attempt 2 of a `pull_request` run whose one job is a never-started job, and the branch still at the run's commit. When the command runs. Then it sends one `POST` to `repos/<repository>/actions/jobs/<that job's id>/rerun`, prints a line naming the job and the attempt, and exits 0. | A case whose stand-in `gh` answers with the jobs of run 45855610271 attempt 2 and the annotations of job 140041369486, and records each call. The case is shown red with the annotation's message changed in the fixture. |
| B. A job that ran and failed is not rerun | Given an attempt whose job has a runner, steps and the conclusion `failure`, beside the entry `seal` that has no step and a null runner. When the command runs. Then it sends no `POST`, prints that the attempt holds no never-started job, and exits 0. | A case on the jobs of run 45907578756 attempt 1. It is shown red by making the command rerun every job whose conclusion is not `success`. |
| C. A job a newer push cancelled while queued is not rerun | Given a job with the conclusion `cancelled`, `runner_id` 0, no step, and the annotation `Canceling since a higher priority waiting request for check-253 exists`. When the command runs. Then it sends no `POST` and prints the annotation messages it read. | A case on the job of run 45650015251 and the annotations of job 139331652385. It is shown red with the annotation test removed from the command. |
| D. A job cancelled while it ran is not rerun | Given a job with the conclusion `cancelled`, a runner and steps. Then the command sends no `POST`. | A case on the job of run 45134108687. |
| E. The reruns end | Given scenario A's attempt with `RUN_ATTEMPT` 5. Then the command sends no `POST`, prints that the attempt reached the ceiling of 5, and exits 0. Given `RUN_ATTEMPT` 4, it sends the `POST`. | A case with both values. It is shown red with the ceiling test removed. |
| F. A run whose branch moved is not rerun | Given scenario A's attempt and a branch whose head is another commit than `HEAD_SHA`. Then the command sends no `POST` and prints both commits. | A case. It is shown red with the comparison removed. |
| G. A run from another repository is not rerun | Given scenario A's attempt and a `HEAD_REPOSITORY` that is not `GITHUB_REPOSITORY`. Then the command sends no `POST` and says so. | A case. |
| H. A `push` run is rerun without the branch read | Given scenario A's jobs, `RUN_EVENT` `push` and `HEAD_BRANCH` a tag's name. Then the command sends the `POST` and reads no ref. | A case that fails where the stand-in records a read of `git/ref`. |
| I. A refusal shows | Given scenario A's attempt and a stand-in `gh` that exits 1 on the `POST`, or on the read of the jobs. Then the command exits non-zero and prints the call that failed and what `gh` wrote. | A case for the `POST` and a case for the read. |
| J. The workflow starts the command for the two workflows, with the three permissions | Given `.github/workflows/rerun-unstarted.yml`. Then its trigger is `workflow_run` of `check` and `package` at `completed`, its job runs only where the run's conclusion is not `success`, its `permissions` hold `actions: write`, `checks: read` and `contents: read` and nothing else, and each value of the run reaches the command through `env` and never as text of a script. | Read at review against the file. No case parses the file, since `apps/desktop/package.json` lists no YAML parser (read). |
| K. On GitHub, a never-started `check` job of a pull request is queued again without a person | Given the workflow file on `main` and a `check` job that no runner took. Then within a minute of the cancellation the run holds a new attempt, and the pull request's `check` is pending and then passes at the same commit. | Not verifiable before the merge into `main`: `frame/questions.md` Q1. |

## Data & interfaces

**A never-started job** is an entry of `GET repos/<repository>/actions/runs/<run id>/attempts/<attempt>/jobs` that holds all four facts:

- its `conclusion` is `cancelled`;
- its `steps` is an empty list;
- its `runner_id` is 0;
- `GET repos/<repository>/check-runs/<job id>/annotations` holds an annotation whose `message` equals `The job was not acquired by Runner of type hosted even after multiple attempts`.

The first three are read from the jobs' list, so the annotations are read only for a job that holds them. The sentence of the fourth is GitHub's, and no page of GitHub's documentation that the framer read states it. Where GitHub rewords it, the command reruns nothing and prints the messages it read, which is scenario C's line.

**The command's inputs** are environment variables, each set by the workflow from `github.event.workflow_run` or by the runner:

| Variable | Value |
|---|---|
| `GH_TOKEN` | the workflow's token |
| `GITHUB_REPOSITORY` | the repository, as the runner sets it |
| `RUN_ID` | `workflow_run.id` |
| `RUN_ATTEMPT` | `workflow_run.run_attempt` |
| `RUN_EVENT` | `workflow_run.event` |
| `HEAD_BRANCH` | `workflow_run.head_branch` |
| `HEAD_SHA` | `workflow_run.head_sha` |
| `HEAD_REPOSITORY` | `workflow_run.head_repository.full_name` |

The command runs `gh api` for each read and for its one kind of write, and takes `gh` from the `PATH`. It imports nothing outside Node's own modules.

**The order of its decisions.** Each decision that ends the command prints one line and exits 0:

1. It reads the attempt's jobs. Where none holds the first three facts, it prints that the attempt holds no never-started job.
2. For each job that holds them, it reads the annotations. Where no job holds the fourth fact, it prints each such job's name and the annotation messages it read.
3. Where `RUN_ATTEMPT` is 5 or more, it prints that the attempt reached the ceiling. The ceiling is one named constant of the command.
4. Where `RUN_EVENT` is `pull_request` and `HEAD_REPOSITORY` is not `GITHUB_REPOSITORY`, it says so. Where `RUN_EVENT` is `pull_request` and the two are equal, it reads `repos/<repository>/git/ref/heads/<HEAD_BRANCH>`, and where the ref's commit is not `HEAD_SHA`, or the ref does not exist, it prints both.
5. It sends `POST repos/<repository>/actions/jobs/<job id>/rerun` for each never-started job, in the list's order, prints one line per job, and exits 0.

A `gh` call that exits non-zero, other than the missing ref of step 4, ends the command non-zero with the call and `gh`'s error output. Each printed line also goes to the file `GITHUB_STEP_SUMMARY` names, where that variable is set.

`check` and `package` each hold one job at `6ce877e7`, so step 5 sends one request. Where a later workflow holds several never-started jobs in one attempt, GitHub may refuse the second request because the run is already queued again. That refusal ends the command non-zero.

**The workflow** `.github/workflows/rerun-unstarted.yml`:

- `on: workflow_run`, with `workflows: [check, package]` and `types: [completed]`.
- One job on `ubuntu-latest` with a `timeout-minutes` of 5, run where `github.event.workflow_run.conclusion != 'success'`. The run's conclusion cannot narrow it further: a no-runner attempt reads `failure` (*Grounding*).
- `permissions`: `actions: write` for the rerun, `checks: read` for the annotations, `contents: read` for the checkout and the ref.
- Steps: `actions/checkout@v4`, which in a `workflow_run` run checks out the default branch and so never a pull request's code; `actions/setup-node@v4` with Node 22, as `check.yml` sets it; then `node .github/scripts/rerun-unstarted.mjs` with the variables above in `env`.
- No `concurrency` group. Two completed attempts of one run are never handled at once, since the later attempt exists only after the earlier one was rerun.

**What stays bounded, and why.** The command's one kind of write is the rerun of a job that never started, so the command reruns no job that ran, whatever that job's conclusion. Each rerun makes an attempt whose number is one higher, and no attempt numbered 5 or more is rerun, so one run ends after at most 4 reruns from the command, whether or not the end of a rerun attempt starts the workflow again. The workflow lists only `check` and `package`, so its own completion never starts it.

**What a pull request shows.** The workflow's run belongs to the default branch's commit, so it adds no check to a pull request, and `chain_check.py` reads nothing of it. Between a never-started job's cancellation and the accepted rerun, the pull request's `check` reads cancelled. A `seal pr-wait` that decides in that gap exits 1 and names `check`, and the session that reads the exit waits again, by which time the check is pending. The app shows the check as failed for that gap and reads it again at its next read.

**When it takes effect.** `workflow_run` starts only from the default branch's copy of the file. So the reruns begin when `release/v0.1.0` merges into `main`, and no pull request into `release/v0.1.0` before that merge is served. The `package` run at the tag `v0.1.0` is served, since the tag follows the merge.

## Rule changes

- change
  file: docs/roadmap.md
  section: Releases and the tracker
  from: So each work item is one commit on the release branch.
  to: So each work item is one commit on the release branch.
    - **A job of the `check` or the `package` workflow that GitHub cancelled because no hosted runner took it is run again by the repository, and no other job is.** GitHub gives up on a macOS job it could not place in about 15 minutes and marks it cancelled, with the annotation `The job was not acquired by Runner of type hosted even after multiple attempts`. The workflow `.github/workflows/rerun-unstarted.yml` reads each completed attempt of those two workflows and reruns a job only where it was cancelled with no runner, no step and that annotation. It reruns no job that ran, none that a newer push or a person cancelled, none of a pull request whose branch has moved, and none of an attempt numbered 5 or more, so a fifth such cancellation stays for whoever waits on the run. The workflow starts from the copy of its file on `main`.
      check: apps/desktop/test/rerun-unstarted.test.ts
- change
  file: docs/roadmap.ko.md
  section: 릴리스와 트래커
  from: 그래서 릴리스 브랜치에서 작업 하나는 커밋 하나입니다.
  to: 그래서 릴리스 브랜치에서 작업 하나는 커밋 하나입니다.
    - **`check`와 `package` 워크플로의 job 가운데 GitHub이 호스팅 러너를 배정하지 못해 취소한 것은 저장소가 다시 실행하고, 그 밖의 job은 다시 실행하지 않습니다.** GitHub은 macOS job을 15분쯤 안에 러너에 배정하지 못하면 포기하고 취소로 표시하며, 그 job에 `The job was not acquired by Runner of type hosted even after multiple attempts`라는 주석을 답니다. 워크플로 `.github/workflows/rerun-unstarted.yml`은 두 워크플로의 실행이 한 번 끝날 때마다 그 시도를 읽고, 러너도 단계도 없이 취소되었고 그 주석이 달린 job만 다시 실행합니다. 실제로 실행된 job, 새 푸시나 사람이 취소한 job, 브랜치가 다른 커밋으로 옮겨 간 PR의 job, 5번째 이후 시도의 job은 다시 실행하지 않습니다. 그래서 다섯 번째로 그렇게 취소되면 그 실행을 기다리는 쪽이 처리할 몫으로 남습니다. 이 워크플로는 `main`에 있는 자기 파일에서 시작됩니다.
      check: apps/desktop/test/rerun-unstarted.test.ts

## Removes

- nothing
  why: The work adds a workflow, a command and a test file, and takes no file, sentence or case out of the tree. What the workflow replaces is the rerun by hand of a never-started job, and no file of the tree at `6ce877e7` states that practice (executed: the `git grep` for `rerun` in *Grounding*).

Framed 2026-11-27 by framer, before the build.
