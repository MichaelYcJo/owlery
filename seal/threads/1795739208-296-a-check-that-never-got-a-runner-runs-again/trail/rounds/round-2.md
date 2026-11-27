# Review round 2: 1795739208-296-a-check-that-never-got-a-runner-runs-again

```seal
target: 3bd20b6d, fixes ff7ddb5f..3bd20b6d
```

This is a verifying round. It reviewed the code of `git diff ff7ddb5f..3bd20b6d`: the fork check moved in `.github/scripts/rerun-unstarted.mjs`, the new encoding case and the `it.each` of the fork case in `apps/desktop/test/rerun-unstarted.test.ts`, the changelog sentence, and the orchestrator's fold of `frame/design.md` lines 49 and 110. It read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md` and `trail/rounds/round-1.md` whole at `3bd20b6d`. No `pr.md` or `pr.<lang>.md` stands at the target, and no `seal/parity.json` is declared. The work item is still the only one under `seal/threads/`, so the axis *Record against another work item's frame* has nothing to walk.

Carried from round 1 and not established again: where the command's decisions stand, the fixture's agreement with GitHub's answers for the jobs and annotations it holds, the pinned commits of the two actions, and the workflow's trigger, `if:` and permissions, since the range changes no line of `.github/workflows/rerun-unstarted.yml`. Re-established this round: each verdict below, the evidence greps of each round 1 finding, and the narrow run.

## Findings

This round opens no finding.

## Confirmations

```seal
confirms: round-1#1
```
What holds: the head repository is compared at every event. `.github/scripts/rerun-unstarted.mjs:120-124` reads `HEAD_REPOSITORY` and stops at any value other than `GITHUB_REPOSITORY`, and that test now stands before `if (event === "pull_request")` at `:126`. The case at `apps/desktop/test/rerun-unstarted.test.ts:251-257` runs with `pull_request` and with `pull_request_review`, and holds no `POST`, no read of `git/ref` and the line naming the other repository. Executed: the narrow run passed 17 of 17 cases. The probe ran the command at `73899ac0` with `RUN_EVENT` `pull_request_review` and another head repository, and it sent the `POST`. The command at the target, with `pull_request_review_comment` and another head repository, sent none and printed the other repository's line. That bears out the account's claim that the `pull_request_review` row alone failed against `73899ac0`. The account's `seal mutate` runs were not repeated. The fold of `frame/design.md:49` and `:110` states what `:118-135` does: the comparison whatever the event, then, at a `pull_request` run alone, the ref read with each segment of the branch encoded. Executed, at the target: `git grep -n -F 'HEAD_REPOSITORY'`, `git grep -n -F 'another repository'` and `git grep -n -i -F 'head repository'` over `seal/threads`, `.github` and the case file, and `git grep -n -i fork` over the same paths. Every line they print outside the round records holds at the target, except `trail/phases/phase-1.md:13`. That line says `HEAD_REPOSITORY` is read only at a `pull_request` run. It was true of what phase 1 built, and it is false at the target. Round 1's close block for this finding names that line and says why it stands: the phase record states phase 1's build, at the commits its line 19 names. This round reads it the same way and opens no finding. The greps are a sample, since a statement of the rule in other words escapes them.

```seal
confirms: round-1#2
```
What holds: `changelog.md:6` ends "The summary of the workflow's run says why it reran nothing." Each way the command reruns nothing prints a line that says why: `.github/scripts/rerun-unstarted.mjs:97`, `:109`, `:114`, `:122` and `:132`, and each line also goes to `GITHUB_STEP_SUMMARY` through `say` (`:34-38`). Read. Executed: `git grep -n -F 'names which of these it met' 3bd20b6d -- seal/threads` printed no line outside the round records, and exits 1 once they are filtered out.

```seal
confirms: round-1#3
```
What holds: the case at `apps/desktop/test/rerun-unstarted.test.ts:136-140` gives the command the branch `fix/296-a#b` and arranges only the read of `heads/fix/296-a%23b`. With `.map(encodeURIComponent)` taken out of `.github/scripts/rerun-unstarted.mjs:69`, the command reads `heads/fix/296-a#b`, the stand-in answers that read at 97, and the command ends at 1 with no `POST`. That is the failure at `ran.status` the account reports. Executed: the probe ran the target's command against that mutation, after asserting the replaced text was found, and ran the unchanged command beside it. The unchanged command read `heads/fix/296-a%23b` and sent the `POST`. The case is the only one in its group whose branch the encoding changes, so it covers what no other case of the file covers. Read against the file's other cases. Executed: the narrow run.

What matched: the new comparison opens no path to a rerun where `HEAD_REPOSITORY` is empty or unset. `input` refuses an empty or missing value (`.github/scripts/rerun-unstarted.mjs:41-45`), so the command ends at 1 with `HEAD_REPOSITORY is not set.` and sends no `POST`, at `push` and at `pull_request` alike. At `73899ac0` a `push` run with an empty `HEAD_REPOSITORY` sent the `POST`, since that run never read the variable. So the fix turns that one input from a rerun into a refusal at 1, which fails closed and shows as a red run of `rerun-unstarted`. Executed: the probe, at `push` with the variable empty and with it unset, and at `pull_request` with it empty, against the target, and at `push` with it empty against `73899ac0`. GitHub sets the value at a `push` run: a GET of the last 30 runs of `package.yml` and of `check.yml` listed only `push` and `pull_request` runs, and each named this repository as its head repository. Executed: `gh api 'repos/{owner}/{repo}/actions/workflows/<file>/runs?per_page=30'`. No `workflow_dispatch` run was listed, so the comment's claim at `:119` for that event is read and not observed. No case holds the refusal of an empty `HEAD_REPOSITORY`. That is a gap of a guard the frame states nothing about: phase 1's departure at `trail/phases/phase-1.md:13` set the refusal of a missing value. A rerun would take the comparison at `:121` removed as well, and the case at `apps/desktop/test/rerun-unstarted.test.ts:251-257` pins that comparison. So the round opens no finding for the gap.

What matched: a run of this repository at another event keeps the path it had. A `workflow_dispatch` run with `HEAD_REPOSITORY` equal to `GITHUB_REPOSITORY` reads no ref and sends the `POST`, as scenario H states of a `push` run. A run that reached the ceiling stops at the ceiling's line before the head repository is read (`:113-116`), at any head repository. Executed: the probe. A `pull_request_review` run of this repository's own head also reads no ref and sends the `POST`. `check.yml` runs only at `pull_request` and `package.yml` only at `push` and `workflow_dispatch` (read, `.github/workflows/check.yml:9-11`, `.github/workflows/package.yml:14-17`), so only a branch of this repository that adds its own workflow named `check` reaches that path. The command behaved the same way at `73899ac0`, so the fix diff did not open it.

What matched: the new comment at `.github/scripts/rerun-unstarted.mjs:118-119` and the comment above the case at `apps/desktop/test/rerun-unstarted.test.ts:249-250` say what the code and the case do. Read. The comment of the encoding case at `:134-135` says what its arranged answers do, as the probe's mutated run showed.

What matched: the records against the target. `routing.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md` and `trail/phases/` are unchanged across the range. Executed: `git diff --quiet ff7ddb5f 3bd20b6d` over them exits 0. Read whole at the target, they hold no sentence the target contradicts other than the phase line above. The *Rule changes* `to:` text at `frame/design.md:138` lists the jobs that are not rerun without the run from another repository. It claims no whole list, so the target does not contradict it, and `changelog.md:6` and *Scope* item 3 state the exclusion.

What matched: the suite's label is honest. `gaps.md:7` names the broad gate as not run and the orchestrator as its answerer.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether GitHub accepts the rerun from the workflow's own token, and whether the end of a rerun attempt starts the workflow again (scenario K, `frame/questions.md` Q1) | `.github/workflows/rerun-unstarted.yml` | the orchestrator, from the first run of `rerun-unstarted` after a no-runner attempt once the release merges into `main`, as Q1 states |
| Whether GitHub ever sends an empty `head_repository` at a `workflow_dispatch` run of `package`; where it does, the command ends at 1 and reruns nothing | `.github/scripts/rerun-unstarted.mjs:120` | the orchestrator, from the first `workflow_dispatch` run of `package` that `rerun-unstarted` reads |
| The broad gate at the work item's last commit | `gaps.md:7` | the orchestrator, at the broad gate |

This round leaves no finding open. What comes due is the orchestrator's broad run, and then the sealer's spawn.

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/rerun-unstarted.test.ts` in `apps/desktop`, through the session's lock of heavy commands | exit 0; 1 file, 17 cases passed |
| `node test_tmp_round2.mjs` in the round's clone at `3bd20b6d`, which runs the command against the stand-in `gh` and the fixture's answers for run 45855610271 attempt 2 | at the target: `push` with `HEAD_REPOSITORY` empty or unset, and `pull_request` with it empty, each exit 1, `HEAD_REPOSITORY is not set.`, no `POST`; `workflow_dispatch` of this repository, exit 0, one `POST`, no ref read; `pull_request_review_comment` of another repository, exit 0, no `POST`, the other repository's line; `pull_request_review` of this repository, exit 0, one `POST`, no ref read; branch `fix/296-a#b`, exit 0, ref read `heads/fix/296-a%23b`, one `POST`; another repository at attempt 5, exit 0, the ceiling's line. At `73899ac0`: `pull_request_review` of another repository, exit 0, one `POST`; `push` with `HEAD_REPOSITORY` empty, exit 0, one `POST`. At the target with the encoding taken out of `:69`: branch `fix/296-a#b`, exit 1, ref read `heads/fix/296-a#b` answered 97, no `POST` |
| `gh api 'repos/{owner}/{repo}/actions/workflows/package.yml/runs?per_page=30'` and the same for `check.yml`, each run's event and head repository | `package`: `push` runs alone, each with this repository as head; `check`: `pull_request` runs alone, each with this repository as head |
