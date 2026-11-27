# Questions for the planner: a check that never got a runner runs again (#296)

Judgments the ticket left open that the tree and GitHub's records answered. Nobody needs to reopen them:

- Why the job is cancelled at 15 minutes: `frame/design.md` *Grounding*, the rows on the no-runner attempts and their annotation.
- Whether the fix is a rerun, a runner label or both: `frame/plan.md` *Alternatives considered*, the rows on the arm64 labels and the Intel labels.
- Whether the suite is split across jobs: `frame/design.md` *Scope*, the out-of-scope item on the split.
- How a never-started job is told from a failed one and from one a newer push cancelled: `frame/design.md` *Grounding*, the rows on jobs 139331652385, 140033044156 and 137556298780.
- Whether the run's conclusion can select the attempts: `frame/design.md` *Grounding*, the row on the conclusion `failure`.
- How many reruns a run gets: `frame/plan.md` *Alternatives considered*, the row on the bound.
- Whether `package` is served beside `check`: `frame/design.md` *Grounding*, the row on the jobs that run on macOS.
- Where the pull request merges, and so when the workflow takes effect: `frame/design.md` *Grounding*, the row on `docs/roadmap.md`, and `frame/plan.md` *Operational impact*.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | On GitHub, does the workflow rerun a never-started job? Two things are unread: whether `POST repos/<repository>/actions/jobs/<job id>/rerun` is accepted from the workflow's own token with `actions: write`, and whether the end of the rerun attempt starts the `workflow_run` workflow again. The tree could not answer, and no probe could: a `workflow_run` workflow starts only from the default branch's copy of its file, the event needs a job that GitHub failed to place, and the framer may rerun and dispatch nothing. GitHub's pages, as fetched, state neither. | a measurement: the orchestrator reads the first run of `rerun-unstarted` that follows a no-runner attempt after the release merges into `main`, with `gh run list --workflow rerun-unstarted.yml` and that run's summary | Accepted, and the end of the attempt starts the workflow again: scenario K holds as written. Accepted, and it does not start again: a run gets one rerun from the command and not four, and the ceiling is never reached. Refused: the run of `rerun-unstarted` ends red and prints GitHub's answer, and a new issue gives the workflow a token that may rerun, which is a secret a person adds. | Build as `frame/design.md` states. Under each answer no job that ran is rerun and no run is rerun past attempt 5. | open |
