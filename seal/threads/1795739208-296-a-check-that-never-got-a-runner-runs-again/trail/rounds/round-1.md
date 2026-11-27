# Review round 1: 1795739208-296-a-check-that-never-got-a-runner-runs-again

```seal
target: 73899ac0 against origin/release/v0.1.0
```

The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `trail/phases/phase-1.md` whole at `73899ac0`, and the whole diff of `e7737b7e..73899ac0`. No `pr.md` or `pr.<lang>.md` stands at the target, no `seal/parity.json` is declared, and no earlier round exists, so no fact is carried. The work item is the only one under `seal/threads/` at the target, so the axis *Record against another work item's frame* has nothing to walk. The axes this change adds to the table: the trust of every value of the triggering run, which crosses from GitHub's event into a process holding `actions: write`; the concurrency group a rerun joins; and the bound on how many times one run is rerun.

## Findings

### 1. A run of another event than `pull_request` whose head repository is a fork reaches the rerun, since the fork check stands inside the `pull_request` branch

```seal
severity: should
location: `.github/scripts/rerun-unstarted.mjs:118-123`, `seal/threads/1795739208-296-a-check-that-never-got-a-runner-runs-again/frame/design.md:49`, `seal/threads/1795739208-296-a-check-that-never-got-a-runner-runs-again/frame/design.md:110`, `apps/desktop/test/rerun-unstarted.test.ts:241-247`
evidence: read `.github/scripts/rerun-unstarted.mjs:118-123`, `.github/workflows/rerun-unstarted.yml:15-17`, `.github/workflows/rerun-unstarted.yml:55`; executed `git grep -n -F 'HEAD_REPOSITORY' -- seal/threads .github apps/desktop/test/rerun-unstarted.test.ts` and `git grep -n -F 'another repository' -- seal/threads .github`
```

Why it matters: the workflow holds `actions: write` and is started by any run of a workflow named `check` or `package` (`.github/workflows/rerun-unstarted.yml:15-17`). `workflow_run` matches a workflow by its `name:`. The command compares `HEAD_REPOSITORY` with `GITHUB_REPOSITORY` only where `RUN_EVENT` is `pull_request` (`.github/scripts/rerun-unstarted.mjs:118-120`). Every other event goes from the ceiling test straight to the `POST` at line 135. The workflow sets `HEAD_REPOSITORY` for every event (line 55), so the value is there to compare.

The path this leaves open rests on GitHub's behaviour, which this round read and did not run. A fork's pull request runs the workflow files of its own merge commit at `pull_request_review` and `pull_request_review_comment` as well as at `pull_request`. So a fork can add a workflow named `check` on one of those events. If one of its jobs is a never-started job, the command reruns it, with up to 4 reruns of the fork's job on a hosted runner. GitHub's documentation says a rerun keeps the privileges of the actor who first triggered the run, so this costs runner time and grants no privilege. The records promise more than the code holds. Scenario G is titled "A run from another repository is not rerun" (`frame/design.md:73`), and `changelog.md:6` says a job "of a pull request ... that comes from another repository" stays as it ended. *Scope* item 3 (`frame/design.md:49`) and step 4 of *The order of its decisions* (`frame/design.md:110`) narrow the check to `pull_request`, and the code follows those two lines. For a `push` or `workflow_dispatch` run of `package`, `head_repository` is this repository, so the check costs those runs nothing.

The grep on `HEAD_REPOSITORY` printed the lines named here and `trail/phases/phase-1.md:13`. That line records what phase 1 built, and the fix pass leaves it as it is. The grep on `another repository` printed `frame/design.md:73`, `changelog.md:6` and the comment at `.github/scripts/rerun-unstarted.mjs:13`, which hold once the fix lands. Both greps are a sample. A statement of the fact in other words can escape them.

```js
// .github/scripts/rerun-unstarted.mjs, in place of lines 118 to 132.
// HEAD_REPOSITORY is set by the workflow for every event (rerun-unstarted.yml:55);
// for a push or workflow_dispatch run it is this repository.
const from = input("HEAD_REPOSITORY");
if (from !== repository) {
  say(`Run ${run} is of a pull request from ${from}, not from ${repository}, so nothing is rerun.`);
  return;
}

if (event === "pull_request") {
  const branch = input("HEAD_BRANCH");
  const sha = input("HEAD_SHA");
  const head = branchHead(repository, branch);
  if (head !== sha) {
    const stands = head === null ? "no longer exists" : `stands at ${head}`;
    say(`The branch ${branch} ${stands}, and run ${run} ran at ${sha}, so nothing is rerun.`);
    return;
  }
}
```

```ts
// apps/desktop/test/rerun-unstarted.test.ts, beside the case at lines 241 to 247.
// To be shown red against the code at 73899ac0, where this event skips the comparison and the POST is sent.
it("of another event of a pull request from another repository", () => {
  const ran = command({ ...NEVER_STARTED, RUN_EVENT: "pull_request_review", HEAD_REPOSITORY: "someone/owlery" }, neverStarted());
  expect(ran.status).toBe(0);
  expect(reruns(ran)).toEqual([]);
  expect(ran.stdout).toBe(`Run 45855610271 is of a pull request from someone/owlery, not from ${REPOSITORY}, so nothing is rerun.\n`);
});
```

The two lines of `frame/design.md`, *Scope* item 3 at line 49 and then step 4 at line 110:

```markdown
3. The command asks for no rerun of a run whose head repository is not this repository, whatever its event, nor of a `pull_request` run whose branch has moved off the run's commit.

4. Where `HEAD_REPOSITORY` is not `GITHUB_REPOSITORY`, whatever `RUN_EVENT` is, it says so. Where `RUN_EVENT` is `pull_request`, it reads `repos/<repository>/git/ref/heads/<HEAD_BRANCH>`, and where the ref's commit is not `HEAD_SHA`, or the ref does not exist, it prints both.
```

The comment at `.github/scripts/rerun-unstarted.mjs:12-14` names the two refusals together. It reads true once the comparison covers every event, so the fix leaves it as it is.

### 2. The changelog says the run's summary names which kind of job it met, and for a job that ran it names none

```seal
severity: should
location: `seal/threads/1795739208-296-a-check-that-never-got-a-runner-runs-again/changelog.md:6`
evidence: read `.github/scripts/rerun-unstarted.mjs:96-98`, `apps/desktop/test/rerun-unstarted.test.ts:155`, `apps/desktop/test/rerun-unstarted.test.ts:213`; executed `git grep -n -F 'names which of these it met' -- seal/threads`
```

Why it matters: `changelog.md:6` lists five kinds of job that stay as they ended, then says "The summary of the workflow's run names which of these it met." For a job that ran and failed, and for one cancelled while it ran, the command writes one line, `Attempt <n> of run <id> holds no job that no runner took, so nothing is rerun.` (`.github/scripts/rerun-unstarted.mjs:97`). Cases B and D pin that same line (`apps/desktop/test/rerun-unstarted.test.ts:155` and `:213`). The line says why nothing was rerun and names neither kind. For a job a newer push cancelled, the line quotes GitHub's annotation and does not call the job one a push cancelled. The release note is built from this fragment, so a reader who opens the summary looking for "ran and failed" does not find it. The grep printed `changelog.md:6` alone, and it is a sample.

```markdown
The summary of the workflow's run says why it reran nothing.
```

The replacement takes the place of the last sentence of `changelog.md:6`. That item's opening sentence, `**No other job is rerun.**`, stays as it is.

### 3. The URL-encoding of the branch's segments has no case, and phase 1's table of guards seen red leaves it out

```seal
severity: should
location: `apps/desktop/test/rerun-unstarted.test.ts`, `.github/scripts/rerun-unstarted.mjs:69`
evidence: executed `grep -n -o -E '(HEAD_BRANCH: |const tag = )"[^"]*"' apps/desktop/test/rerun-unstarted.test.ts`, each value passed through `b.split("/").map(encodeURIComponent).join("/")` in `node -e`, and each value came back unchanged; read `seal/threads/1795739208-296-a-check-that-never-got-a-runner-runs-again/trail/phases/phase-1.md:14`, `seal/threads/1795739208-296-a-check-that-never-got-a-runner-runs-again/trail/phases/phase-1.md:19-39`
```

Why it matters: phase 1 added the encoding as a departure from the frame (`trail/phases/phase-1.md:14`). Its reason is a branch name that holds `#`, which git allows in a ref name and which a path reads as the start of a fragment. Every branch name the cases hand the command is `feat/213-a-panes-tab-has-no-menu`, `feat/133-a-daemon-of-another-build-stays-on-release`, `fix/242-a-click-on-a-sidebar-line-is-lost-when-the-sidebar-redraws`, `feat/46-a-work-item-view-shows-no-progress-through-roles` or the tag `v0.1.0`. `encodeURIComponent` leaves each of them unchanged, as the command above printed. So `.map(encodeURIComponent)` at `.github/scripts/rerun-unstarted.mjs:69` can be taken out and every case stays green. This is the *Regression test* row of `skills/code-review/SKILL.md` *Probes and regression tests*: a behaviour the diff added that no case holds.

The account claims more than it shows. `trail/phases/phase-1.md:19` opens "Each unit goes red with only its own guard broken", and its table (lines 21 to 39) has no row for the encoding. The table is a sample handed back as the whole list. The other unit it leaves out is `Array.isArray(job.steps)` at `.github/scripts/rerun-unstarted.mjs:95`. That guard fails closed both ways, since without it a job with no `steps` field ends the command at 1, and GitHub's jobs list carries `steps` on every job the fixtures hold. That guard owes no case.

```ts
// apps/desktop/test/rerun-unstarted.test.ts, in describe("a job that never got a runner").
// Only the encoded read is arranged: with the encoding removed, the command reads
// `heads/fix/296-a#b`, the stand-in answers 97, and the case fails at `ran.status`.
it("reads the ref of a branch whose name holds a character a path reads otherwise, with that character encoded", () => {
  const branch = "fix/296-a#b";
  const ran = command(
    { ...NEVER_STARTED, HEAD_BRANCH: branch },
    { ...neverStarted(), [`api repos/${REPOSITORY}/git/ref/heads/fix/296-a%23b`]: refAt(NEVER_STARTED.HEAD_SHA) },
  );
  expect(ran.status).toBe(0);
  expect(reruns(ran)).toEqual([rerun(NEVER_STARTED_JOB)]);
});
```

The fix pass shows the case red with `.map(encodeURIComponent)` removed from line 69 and nothing else changed, and reads its failing line for that guard, before it commits the case.

## Confirmations

What matched: no job that ran is rerun, whatever its conclusion. A job reaches the annotation read only where its `conclusion` is `cancelled`, its `steps` is empty and its `runner_id` is `0` (`.github/scripts/rerun-unstarted.mjs:95`). It reaches the `POST` only where an annotation equals `NOT_ACQUIRED` exactly (`:104`). The check run `seal`, whose `runner_id` is `null`, fails the strict `=== 0`. The cases at `apps/desktop/test/rerun-unstarted.test.ts:136-156`, `:182-195` and `:197-214` hold this. Executed: the narrow run of the file through the lock, 15 cases passed.

What matched: a job a newer push cancelled while it was queued is not rerun. Its annotation is `Canceling since a higher priority waiting request for check-253 exists` and not `NOT_ACQUIRED` (case at `apps/desktop/test/rerun-unstarted.test.ts:158-177`). Where a push lands after the cancellation, the ref read finds the branch at another commit and the command stops (`.github/scripts/rerun-unstarted.mjs:126-131`, case at `:228-239`). A ref GitHub answers 404 for reads as `null` and stops the rerun, so that error fails closed. What remains open is the time between the ref read and the `POST`, which `frame/plan.md:30` states. Executed: `gh api` GET of the jobs of run 45855610271 attempt 2 and run 45650015251 attempt 1, and of the annotations of jobs 140041369486 and 139331652385. GitHub's answers matched the fixture in `apps/desktop/test/fixtures/rerun-unstarted/github.json` field for field.

What matched: the ceiling. `CEILING` is 5 and the test is `attempt >= CEILING` (`.github/scripts/rerun-unstarted.mjs:28`, `:113`). It comes before the branch read and before the `POST`. `RUN_ATTEMPT` must match `^[1-9][0-9]*$`, or the command ends at 1 before any call (`:88-89`), so an empty value never reads as attempt 0. Cases at `apps/desktop/test/rerun-unstarted.test.ts:218-226` and `:267-272` hold this. Executed: the narrow run.

What matched: no value of the triggering run reaches a shell. Each `github.event.workflow_run` value reaches the step only through `env` (`.github/workflows/rerun-unstarted.yml:48-55`), and the step's `run:` holds no expression (`:56`). The command starts `gh` through `spawnSync` with an argument array and no shell (`.github/scripts/rerun-unstarted.mjs:49`). The branch name is used only as encoded path segments (`:69`), and git's rules for ref names forbid `..`, so it cannot climb the path. Annotation messages reach the summary through `JSON.stringify` (`:108`), so a newline in one does not start a line of its own. Every printed line opens with fixed words, so no line opens with `::` for the runner to read as a workflow command. The stand-in's shell line quotes each expansion (`apps/desktop/test/fixtures/rerun-unstarted/gh:6`). Read.

What matched: the permissions. The workflow-level `permissions` block holds `actions: write`, `checks: read` and `contents: read` and nothing else (`.github/workflows/rerun-unstarted.yml:22-25`). The workflow has one job, reads no secret, and takes the token as `${{ github.token }}` into `GH_TOKEN` (`:49`). `git grep -n -e 'actions: write' -e 'workflow_run' -- .github` at the target prints lines of this workflow alone, which matches `frame/plan.md:49`. Executed.

What matched: the pinned actions. `actions/checkout@11d5960a326750d5838078e36cf38b85af677262` and `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020` (`.github/workflows/rerun-unstarted.yml:37`, `:42`) are the commits that both `v4.4.0` and `v4` of each repository name today. The checkout sets `persist-credentials: false` (`:40`), and in a `workflow_run` run it checks out the default branch, `main`. Executed: `gh api repos/<action>/git/ref/tags/v4.4.0` and `…/tags/v4` for each action, `gh api repos/<action>/commits/<sha>` for each pin, and `gh api repos/{owner}/{repo}` for the default branch.

What matched: scenario J, the row `gaps.md:9` gives the proofer. The trigger is `workflow_run` of `check` and `package` at `completed` (`.github/workflows/rerun-unstarted.yml:14-17`). The job runs where `github.event.workflow_run.conclusion != 'success'` (`:31`), on `ubuntu-latest` with `timeout-minutes: 5` (`:32-33`). The three permissions are as above, and every value of the run goes through `env`. The workflow names only `check` and `package`, so its own end never starts it. Read.

What matched: the records against the code and against each other. `frame/design.md` *Data & interfaces*, after the fold at `73899ac0`, names `?per_page=100` on both reads and the pins to v4.4.0's commits. This matches `.github/scripts/rerun-unstarted.mjs:94`, `:103` and the workflow. `changelog.md:8` names the three permissions and the pins, as the workflow holds them. The line numbers `trail/phases/phase-1.md:21-39` cites stand at the cited assertions of `apps/desktop/test/rerun-unstarted.test.ts` at the target. The count of 15 cases in `trail/phases/phase-1.md:45` matches the narrow run. `gaps.md:14` says five jobs' annotations are in the fixtures and the largest list has 11. The fixture holds lists of 4, 1, 2, 11 and 0. The `from:` sentences of both operations in `frame/design.md` *Rule changes* stand at `docs/roadmap.md:80` and `docs/roadmap.ko.md:80`, under the sections they name. Read, and executed `grep -n -F` for each `from:` sentence.

What matched: the suite's label is honest. `gaps.md:7` names the broad gate as not run and the orchestrator as its answerer. The phase ran the one test file the diff adds. The test's environment drops the suite's own variables, so a real `GITHUB_STEP_SUMMARY` or token never reaches the command (`apps/desktop/test/rerun-unstarted.test.ts:82-104`). The stand-in `gh` is tracked with mode `100755` (`git ls-files -s`, executed), so the real `gh` is never the one found first on the `PATH`.

The case at `apps/desktop/test/rerun-unstarted.test.ts:197-214`, scenario D, covers no guard that the three one-fact cases at `:182-195` do not already cover. Its job lacks two of the three facts, as `trail/phases/phase-1.md:41` says. *User scenarios & acceptance* row D names this case, and its fixture is GitHub's own answer for a job cancelled while it ran, so the round opens no finding for it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether GitHub accepts the rerun from the workflow's own token, and whether the end of a rerun attempt starts the workflow again (scenario K, `frame/questions.md` Q1) | `.github/workflows/rerun-unstarted.yml` | the orchestrator, from the first run of `rerun-unstarted` after a no-runner attempt once the release merges into `main`, as Q1 states |
| A second run of the same pull request at the same commit, such as one a close and reopen starts in the minute between a cancellation and the rerun, passes the ref check. The rerun of the older run then joins the group `check-<number>` and cancels the newer run. Both runs test one commit, and this round did not read whether the pull request's checks then list the cancelled run's `check` beside the rerun's | `.github/scripts/rerun-unstarted.mjs:118-131`, `.github/workflows/check.yml:14-16` | the orchestrator, from GitHub, if a pull request ever shows it |
| The broad gate at the work item's last commit | `gaps.md:7` | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/rerun-unstarted.test.ts` in `apps/desktop`, through the session's lock of heavy commands | exit 0; 1 file, 15 cases passed |
| `grep -n -o -E '(HEAD_BRANCH: \|const tag = )"[^"]*"' apps/desktop/test/rerun-unstarted.test.ts`, each value through `split("/").map(encodeURIComponent).join("/")` in `node -e` | five values, each unchanged by the encoding |
| `gh api` GET of `actions/runs/45855610271/attempts/2/jobs`, `actions/runs/45650015251/attempts/1/jobs`, `check-runs/140041369486/annotations` and `check-runs/139331652385/annotations` | the ids, conclusions, `runner_id` 0, empty steps and messages the fixture holds |
| `gh api repos/actions/checkout/git/ref/tags/v4.4.0`, `…/tags/v4`, and the same for `actions/setup-node` | `11d5960a…` for both checkout tags, `49933ea5…` for both setup-node tags |
