# Phase 1: 1795739208-296-a-check-that-never-got-a-runner-runs-again

## What this phase found

**The frame holds against the tree at `482b912a` (read, then executed where a command is named).** `.github/workflows/check.yml:23` and `.github/workflows/package.yml:35` run on `macos-latest`, each workflow holds one job, `.github/scripts/` did not exist, and no file under `docs/` or the two READMEs states the rerun by hand that the work replaces (`git grep -n -i -e rerun -e re-run -e 'by hand' -- docs README.md README.ko.md .github apps/desktop/src`, a sample: each line it printed is about something else). GitHub's answers matched what *Grounding* states of them when they were read again on 2026-11-27 (executed, `gh api` GET): the four facts of job 140041369486, the annotation of job 139331652385, the runner and steps of jobs 140207911970 and 137556298780, and the null runner of the check run `seal`, 140207960481. One fact the frame did not state: GitHub's answer for a branch that does not exist is exit 1 from `gh api`, `gh: Not Found (HTTP 404)` on stderr, and a JSON body on stdout whose `status` is `"404"`. The command tells a missing ref by that body and by nothing else.

**The fixtures are GitHub's answers cut to the fields the command reads.** `apps/desktop/test/fixtures/rerun-unstarted/github.json` holds, under each API path, the jobs' `id`, `name`, `conclusion`, `runner_id` and `steps` (each step's `name` alone), each annotation's `message`, a ref's `object.sha`, and the 404 answer as `gh` printed it. The raw answers were filtered with `jq`, and nothing in them was written by hand. Four kinds of answer in the cases are not GitHub's: the ref of a branch at a chosen commit, built from the fixture's `release/v0.1.0` ref with its `sha` changed; the jobs of attempt 2 of run 45855610271 served as the jobs of attempts 4 and 5 in scenario E; the job of the three cases that change one listed fact of job 140041369486; and the refusals of scenario I, whose texts are invented examples in `gh`'s shape. The stand-in `gh` answers a call with no arranged answer at exit 97, so a call the case did not foresee ends the command non-zero. Each case also arranges the rerun and the reads a wrong decision would make, so a wrong decision shows as a `POST` the case can see rather than as a failed call.

**Departures from the frame, each judged against the document named.**

- **The actions are pinned to a commit**, `actions/checkout@11d5960a…` and `actions/setup-node@49933ea5…`, the commits the tag `v4` named on 2026-11-27, each `v4.4.0`'s (executed, `gh api repos/<action>/git/ref/tags/v4` and `…/tags/v4.4.0`). `frame/design.md` *Data & interfaces* writes `@v4`. The spawn asked for the pin, in the way `.github/workflows/package.yml` pins `pnpm/action-setup`. The workflow's comment gives the reason: the job holds `actions: write`. The checkout also sets `persist-credentials: false`, as `package.yml` does: no step pushes, and the command takes its token from `GH_TOKEN`.
- **The reads carry `?per_page=100`.** The design names the paths without a query. At `64d9cd6e`, `check` and `package` hold one job each, and the job with the most annotations among those the fixtures hold has 11, so a page of 100 holds them. Paging beyond 100 is in `gaps.md` *Not done*.
- **`RUN_ATTEMPT` that is no positive whole number ends the command at 1 before any call.** The design does not say what an absent value does. Without the guard, an empty value reads as attempt 0, which is below the ceiling, so the bound of *What stays bounded, and why* would rest on the workflow alone. Judged against `frame/design.md` *What stays bounded, and why*. A variable the command needs and does not find, `GITHUB_REPOSITORY`, `RUN_ID`, `RUN_EVENT`, and for a `pull_request` run `HEAD_REPOSITORY`, `HEAD_BRANCH` and `HEAD_SHA`, ends it at 1 with its name. `HEAD_BRANCH`, `HEAD_SHA` and `HEAD_REPOSITORY` are read only at a `pull_request` run, since a `push` or `workflow_dispatch` run needs none of them.
- **A branch name reaches the ref's path with each segment URL-encoded.** A branch named in a pull request of this repository can hold a character that a path would read otherwise, such as `#`.
- **The case file holds five cases the design's table does not name**: one per fact of the jobs' list (below), one for the attempt's guard, and one for an empty value of the run.

**Each listed fact needed a case of its own.** The first batch of `seal mutate` over the command (executed, at `bbd2f42b`) left two mutants alive: removing `job.steps.length === 0` alone, and removing `job.runner_id === 0` alone. Every fixture job either holds all three listed facts or lacks two or more of them, so one fact always still held the job back. Three cases now each change one listed fact of job 140041369486 and keep its annotation, so only the fact changed stops the rerun.

**Each unit goes red with only its own guard broken (executed, one `seal mutate` per row, at `64d9cd6e` where the row names no other commit).** Every row read `red`, and each failing line below was read in that run's output. The line numbers are those of `apps/desktop/test/rerun-unstarted.test.ts` at `62e49f41`, which are those of `64d9cd6e` for every line the earlier rows name.

| Scenario | Mutation of `.github/scripts/rerun-unstarted.mjs`, or of the fixture | Case that failed, and its failing line |
|---|---|---|
| A | the fixture's `The job was not acquired by Runner of type hosted even after multiple attempts` to `The job was not acquired by a hosted runner` | the rerun case, at `ran.calls` (line 120): the command stopped after the annotations, with no read of the ref and no `POST`. Five other cases that rerun or stop later failed beside it |
| B | the listed facts to `job.conclusion !== "success"` | the job that ran and failed, at `ran.calls` (line 154): the annotations of job 140207911970 were read. The annotation guard still kept that job from a `POST`, so the case pins the listed facts by the calls it sees and not by a rerun |
| listed facts | `job.conclusion === "cancelled" && ` removed | the case with a conclusion other than cancelled, at `reruns(ran)` (line 193) |
| listed facts | `job.steps.length === 0 &&` removed | the case with a step, line 193 |
| listed facts | `&& job.runner_id === 0` removed | the case with a runner, line 193 |
| C | `if (messages.includes(NOT_ACQUIRED)) {` to `if (true) {` | the job a newer push cancelled, at `reruns(ran)` (line 173) |
| E | `if (attempt >= CEILING) {` to `if (false) {` | the ceiling case, at `reruns(fifth)` (line 221) |
| E | `>=` to `>` in the same line | the ceiling case, line 221 |
| F | `if (head !== sha) {` to `if (false) {` | the moved branch case, at `reruns(moved)` (line 231) |
| F | `if (answer?.status === "404") return null;` removed | the same case, at `gone.status` (line 236): the missing ref ended the command at 1 |
| G | `if (from !== repository) {` to `if (false) {` | the other repository case, at `reruns(ran)` (line 244) |
| H | `if (event === "pull_request") {` to `if (true) {` | the push run case, at the `git/ref` filter (line 131) |
| A, summary | `if (summary) appendFileSync` to `if (false) appendFileSync` | the rerun case at `ran.summary` (line 123), and the refused rerun at line 257 |
| I | `${ran.stderr.trim()}` removed from the refusal's line | the refused rerun at `ran.stderr` (line 256), and the refused read of the jobs (line 264) |
| I | the throw after the `POST` removed | the refused rerun, at `ran.status` (line 254) |
| the attempt's guard | `if (!/^[1-9][0-9]*$/.test(given)) throw` to `if (false) throw` | the case of an attempt that is no number, at `ran.calls` (line 270) |
| an empty value of the run, at `62e49f41` | `if (value === undefined \|\| value === "") throw` to `if (false) throw` | the case of an empty `RUN_ID`, at `ran.calls` (line 277) |

C is shown red as its *Verifiable how* cell says. D's case has no row of its own: its job lacks two listed facts, so no single break of one fact reruns it, and the three cases on the listed facts hold each fact apart.

**The cases were red before the command existed (executed).** At the first run, with `apps/desktop/test/rerun-unstarted.test.ts` and its fixtures in the tree and no `.github/scripts/rerun-unstarted.mjs`, each of the 11 cases of that run failed, at `Cannot find module`. The three cases on the listed facts and the case of an empty value were added after the command and passed at once; each was seen red with only its guard removed, as the table shows.

**The phase boundary set is the one test file, and its 15 cases passed at `62e49f41` (executed, through the runner of heavy commands).** No contribution guide names tree-wide test files, and no other test file opens `.github/` or `seal/threads/`: the files that name `.github` write it into fixture repositories they build (read, `git grep -n '\.github' -- apps/desktop/test`).

**The workflow parses as YAML (executed, once, PyYAML through `uvx`).** Its trigger, `if:`, permissions and `env` are scenario J's, which the proofer reads at review.
