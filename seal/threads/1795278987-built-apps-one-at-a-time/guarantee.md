# Guarantee: 1795278987-built-apps-one-at-a-time

Audited `78299f4` against `e4df264` (`origin/release/v0.0.2`, resolved through `release/v0.0.2@{upstream}`). `trail/gate.md` names `0673a47`, an ancestor of HEAD; the one commit after it, `78299f4`, touches `seal/threads/1795278987-built-apps-one-at-a-time/trail/gate.md` alone. `seal pr-body seal/threads/1795278987-built-apps-one-at-a-time --body <scratchpad>/1795278987-built-apps-one-at-a-time/pr-body.md --check` exited 0. No `frame/`, no `trail/phases/`, no `trail/rounds/`: routing reads `the session` for Planning and Implementation and `straight to the PR` for Review. No `seal/parity.json`, so no comparison with an original is owed.

## Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The `app` project holds exactly the files that start the built app, the eight #118 names | `apps/desktop/vitest.config.ts:13-16`, issue #118 body | `ELECTRON_RUN_AS_NODE=1 <electron> node_modules/vitest/vitest.mjs list --filesOnly --project app` in `apps/desktop` (executed); the class enumerated by `git grep -ln BuiltApp -- 'test/*.test.ts'` plus `git grep -n buildApp` (the helper's one launcher class and its build function) | holds: `daemon-restart`, `keep-awake`, `korean-input`, `memory`, `notification-click`, `terminal-basics`, `work-item-form`, `work-item-menu`; `memory.test.ts` reaches `BuiltApp` through `test/memory.ts` and imports `buildApp` itself; `daemon-client.test.ts` imports only `alive` and stays in `unit` |
| `unit` holds every other test file, and the two projects together hold the 34 files the body counts | `pr.md:7` (34 files) | the same listing with `--project unit` (executed) | holds: 26 files in `unit`, none in both, 8 + 26 = 34; `test/` has no subdirectory test file the top-level `readdirSync` would miss |
| The `app` files run one after another (`fileParallelism: false`) | `pr.md:5`, `changelog.md:5`, `vitest.config.ts:10` | probe `<scratchpad>/1795278987-built-apps-one-at-a-time/sealer/test_tmp_split.sh`: the committed `vitest.config.ts` copied verbatim beside three files importing `buildApp` and three that do not, each logging its start and end around a 1.5 s wait (executed); shown able to fail by the same probe with `, fileParallelism: false` removed | holds: `app1`, `app2`, `app3` ran in three disjoint intervals; with the option removed all three started within the same millisecond |
| The `unit` files "still run in parallel beside" the `app` files | `pr.md:5`, `changelog.md:5`, `apps/desktop/vitest.config.ts:10-11` | the same probe (executed); read against vitest 4.1.12's scheduler, `node_modules/.pnpm/vitest@4.1.12_…/dist/chunks/cli-api.B0Pz1_R7.js:3884` and `:3914` (`groupSpecs`) and `:3762-3780` (each group awaited before the next) | **does not hold**: a project with `maxWorkers` 1, isolation on and the default `groupOrder` is put in its own group, pushed after every other group, and the groups run one after another. In the probe the three `unit` files ran together and all ended (`…106143`) before `app1` started (`…106281`). The suite runs the 26 `unit` files in parallel first, then the 8 `app` files alone, with nothing beside them |
| The retry under `CI` from #30 is unchanged and still reaches every case | `pr.md:5` | the probe, with one file of each project failing on its first attempt, run with `CI` unset and with `CI=1` (executed) | holds: unset, both failed (exit 1); `CI=1`, both passed on the retry (exit 0); `retry: process.env.CI ? 1 : 0` stands at the root and `extends: true` carries it into both projects |
| A file of each project runs green under the split at HEAD's config | the split itself | `node scripts/test-in-electron.mjs --project unit test/paths.test.ts` and `node scripts/test-in-electron.mjs --project app test/notification-click.test.ts` in `apps/desktop` (executed, load average 2.87) | holds: 36 passed, and 2 passed |
| Vitest's default is one worker fewer than the machine's cores | `changelog.md:3`, `vitest.config.ts:7-8` | read `cli-api.B0Pz1_R7.js:3833-3838` (`resolveMaxWorkers`) | holds: `Math.max(numCpus - 1, 1)` outside watch mode |
| The full suite passed twice in a row on the owner's Mac at the code commit, 1050 passed and 1 skipped, 217 s and 224 s | `pr.md:7`, `changelog.md:6` | not re-run: the spawn prompt asked for no full run, and rule 2 gives the broad run to the orchestrator | unverified, answered by the orchestrator; `trail/gate.md` records one broad run at `0673a47` (read), whose `apps/desktop` tree is HEAD's |
| The split removes the runner's failures of #117, and the `check` run on the runner passes | `gaps.md:7-8` | not re-run | unverified, answered by this pull request's `check` run and by #117, as `gaps.md` names |

The sample is every claim of `pr.md` and `changelog.md` about what the configuration does, since the change is one file of configuration. There is no `## Removes` row and no removal in the changelog to confirm.

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | none stands: no `frame/`; `routing.md` *Why this way* is the orchestrator's account under `agentic`: the change is `apps/desktop/vitest.config.ts` alone, splitting the suite by each file's import of `buildApp` with no list kept beside the tree | the diff (`git diff e4df264...HEAD` changes `apps/desktop/vitest.config.ts` and the work item's records only), the listing | none |
| the build | `apps/desktop/vitest.config.ts`: two projects, `unit` and `app`, `app` with `fileParallelism: false`; its comment (lines 10-11) says the rest of the suite keeps running in parallel beside the app files | issue #118 Done-when 1 as written (the app files run one at a time; the rest keeps running in parallel, among themselves) | the comment's "beside them" is contradicted by vitest 4.1.12's scheduler and the probe: `unit` runs first, then `app` alone |
| the last round | none: Review reads `straight to the PR`, and `trail/rounds/` holds no record | — | — |
| the changelog | `changelog.md:5`: the `app` files run one after another, and the `unit` files "still run in parallel beside them" | issue #118, the listing, the probe on the one-at-a-time half | "beside them", as for the build; the reader of the release notes is told the suite overlaps the two halves, which it does not |
| the orchestrator's part of the pull request body | `pr.md:5`: `unit` files "still run in parallel beside the app files"; `pr.md:7`: two passing full runs; `pr.md:9`: #117 stays open for the runner's failures | the listing (34 files), the retry probe, `gaps.md` | `pr.md:5`, "beside the app files", as above. Issue #118 Done-when 3, "#117 is narrowed to what is left on the runner", is not done and no record names it: #117 was last updated 2026-11-21T16:20:37Z, before this work, and its comment of 16:06:17Z still holds the owner's-Mac link card case that this change addresses; `gaps.md` *Not done* says #117 stays open but not that its narrowing is owed |

```seal
target: 78299f4 against e4df264
Verdict: withheld reason: the claim that the unit files run in parallel beside the app files does not hold; vitest 4.1.12 puts a fileParallelism false project in its own group run after every other group (cli-api.B0Pz1_R7.js:3884, :3914, :3762), so unit runs first and app runs alone; it stands in the build at apps/desktop/vitest.config.ts:10-11, the changelog at changelog.md:5 and the orchestrator's part of the body at pr.md:5; and issue #118 Done-when 3, narrowing #117 to what is left on the runner, is neither done (#117 unchanged since 2026-11-21T16:20:37Z) nor named as owed in gaps.md
```

## Re-audit at `d49efc2`

The earlier block above audited `78299f4`. Since then, `4227552` and `7056c39` changed the comment of `apps/desktop/vitest.config.ts` (lines 10-12, comment lines only: a `git diff 78299f4 HEAD -- apps/desktop` filtered to non-comment lines prints nothing), `changelog.md`, `gaps.md` and `pr.md`, and committed the earlier `guarantee.md` as written. `d49efc2` touches `trail/gate.md` alone. Step 1: `trail/gate.md`'s newest run is `7056c39`, an ancestor of HEAD, and only `seal/threads/1795278987-built-apps-one-at-a-time/trail/gate.md` follows it (executed). Step 2: `seal pr-body … --body <scratchpad>/1795278987-built-apps-one-at-a-time/pr-body.md --check` exited 0 (executed). `apps/desktop/test/` is unchanged from `e4df264` (executed, `git diff --quiet`).

### Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The `unit` files run first in parallel, then the `app` files one at a time with nothing beside them, because Vitest runs a project whose files are not parallel as a group of its own after the others | `apps/desktop/vitest.config.ts:10-12`, `changelog.md:5`, `pr.md:5` | `<scratchpad>/1795278987-built-apps-one-at-a-time/sealer/test_tmp_split.sh` over HEAD's config (executed); the scheduler read as above (`cli-api.B0Pz1_R7.js:3884`, `:3914`, `:3762-3780`) | holds: the three `unit` files ran together and ended (`…850463`) before the first `app` file started (`…850614`), and the `app` files ran in three disjoint intervals |
| The broad gate at `4227552` failed the link card case at `terminal-basics.test.ts:608`, after the four modifier keys, with no app beside it | `gaps.md:12`, `pr.md:9`, #117 comment of 2026-11-21T17:02:41Z | read `apps/desktop/test/terminal-basics.test.ts:595-608`; the run itself not re-run | line 608 is `expect(await app.evaluate<boolean>(CARD_SHOWN)).toBe(true)` right after the loop of the four modifier keys (read); the failure is unverified, answered by the orchestrator's gate output. "No app beside it" agrees with the schedule the probe shows |
| #117 is narrowed in a section of its body | `gaps.md:15`, `pr.md:11` | `gh issue view 117 --json body,updatedAt` (executed) | holds: the section "Narrowed by #118" stands, updated 2026-11-21T17:02:41Z |
| The full suite passed twice in a row at the code commit, and the gate at `7056c39` passed | `pr.md:7`, `trail/gate.md` | not re-run (rule 2) | unverified, answered by the orchestrator; `trail/gate.md` holds runs at `0673a47` and `7056c39` (read). The code at `57434e4`, `4227552`, `7056c39` and HEAD is one code: the commits between changed comments and records alone |

### The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the build | `vitest.config.ts:10-12`: the rest runs first in parallel, then the app files one at a time with nothing beside them | the probe, vitest 4.1.12's scheduler, `changelog.md:5`, `pr.md:5` | none |
| the changelog | `changelog.md:5`, as the build; `changelog.md:6`: passed both of two full runs | the build, the probe | none in the tree; it does not name the failure at `4227552`, which `gaps.md` and `pr.md` carry |
| the orchestrator's part of the pull request body | `pr.md:9`: the link card case's remaining race "goes to #117 too"; `pr.md:11`: "#117 is narrowed to what is left on the runner, its first-start failures", and the owner's-Mac link card case "is this issue's" | `gaps.md:12` and `:15`, #117's comment of 17:02:41Z | its two sentences give #117 two scopes. #117's own section "Narrowed by #118" says the link card case "is #118's" and that #117 "holds what is left on the runner", while #117's comment of the same minute says the Mac race at line 608 "stays with this issue". The race the split leaves is on the owner's Mac, not the runner, so #117 as narrowed does not hold it, and #118 Done-when 3 ("narrowed to what is left on the runner") presumes nothing is left on the Mac |
| issue #118 against the tree | Done-when 1: holds (the listing and the probe). Done-when 2: two passing runs in a row were made at `57434e4`, whose code is HEAD's; a later gate on that same code, `4227552`, failed the issue's own case on the owner's Mac, and the next, `7056c39`, passed | — | whether Done-when 2 still holds is the reading of "passes ... in two runs in a row" (two consecutive passes occurred, or the suite passes reliably at the head), and the issue's title names the timed cases failing on a many-core Mac, one of which failed again; neither the issue nor the tree decides which reading the owner meant |

The issue and the tree decide every claim above but this one, so the verdict is the owner's question.

```seal
target: d49efc2 against e4df264
Verdict: undecided question: Does #118 hold when two full runs passed in a row at 57434e4 but the broad gate at 4227552, on the same code with no app beside it, failed the link card case again at terminal-basics.test.ts:608 on your Mac, and that remaining Mac race is sent to #117, whose section Narrowed by #118 says it holds only the runner's first-start failures? If yes, say where the Mac race lives (#117 with its section and Done-when widened to take it, or a new issue), so pr.md:9-11, gaps.md:12-15 and #117 can name one home for it.
```

## Re-audit at `cf09a2b`

`cf09a2b` commits the block above as written and changes `pr.md:9-11` and `gaps.md:15` alone; no code changed. Step 1: `trail/gate.md`'s newest run is `7056c39`, an ancestor of HEAD, and only `seal/threads/1795278987-built-apps-one-at-a-time/` paths follow it (`trail/gate.md`; `gaps.md`, `guarantee.md`, `pr.md`) (executed). Step 2: `seal pr-body … --body <scratchpad>/1795278987-built-apps-one-at-a-time/pr-body.md --check` exited 0 (executed). No `Answered <date> by <who>:` line stands below the block above.

### Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| #117's body holds the runner's two first-start failures and the link card case's own race, and reads its *Done when* for each of the three | `pr.md:11`, `gaps.md:15` | `gh issue view 117 --json body,updatedAt` (executed) | holds: section "Narrowed by #118, and what it holds", updated 2026-11-21T17:18:31Z, says so in those words |
| The orchestrator decided #117's scope and the reading of #118's Done-when 2 on 2026-11-22, under the owner's handover of the run | the spawning message; `pr.md:11`, `gaps.md:15` ("decided by the orchestrator") | read: `routing.md` *Why this way*; the plugin's `docs/forms/the-guarantee.md` *Its verdict is `guarantee.md`*, `skills/code-review/orchestration.md:488-491`, `skills/implement/orchestration.md` *Under agentic* | the decision is recorded; that the owner handed this question over is unverified, answered by the owner: `routing.md` records the owner's routing answer `agentic` and a request to keep usage down, not a handover of a verdict's question, and the plugin's texts give an `undecided` question to the owner, answered on an `Answered <date> by <who>:` line below the newest block; *Under agentic* gives the orchestrator the rows of the routing and no sealer question |

### The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the build | as at `d49efc2`; unchanged | the probe, the scheduler | none |
| the changelog | as at `d49efc2`; unchanged | the build | none |
| the orchestrator's part of the pull request body | `pr.md:9`: the race at line 608 goes to #117; `pr.md:11`: #117 holds the runner's first-start failures and that race, and this issue removes the cause of eight apps at once | `gaps.md:12` and `:15`, #117's section, #117's comment of 17:02:41Z | none on where the race lives: the one home the earlier question asked for is named, the same in all four |
| issue #118 against the tree | Done-when 1 holds (executed above); Done-when 3 holds as #117 now reads, #117 holding what is left; Done-when 2 is the same fact as at `d49efc2`: two passing runs at `57434e4`, then a red gate at `4227552` and a green one at `7056c39`, all on one code | — | whether Done-when 2 is met by the two passes, or asks the suite at the head to pass without the later red, is still not decided by the issue or the tree, and the answer the orchestrator gives in its message stands on no `Answered` line and is a party's reading of the owner's own Done-when |

The facts the question rested on are unchanged; what changed is that the race now has one home. So the question narrows to the reading of Done-when 2, and it stays the owner's.

```seal
target: cf09a2b against e4df264
Verdict: undecided question: Is #118's Done-when 2 met by the two full runs that passed in a row at 57434e4, when the broad gate at 4227552 on the same code later failed the link card case at terminal-basics.test.ts:608 on your Mac and the gate at 7056c39 passed, with that race now held by #117? The orchestrator reads it as met; write your answer below this block as Answered <date> by <who>: <answer>.
```

Answered 2026-11-22 by the owner: yes. #118 Done-when 2 is met by the two full runs in a row at 57434e4; #118 removed its cause, and the link card case's own race is #117's.

## Re-audit at `9367cf0`

`9367cf0` commits the block above as written and adds the `Answered 2026-11-22 by the owner:` line below it; it touches `guarantee.md` alone. Step 1: `trail/gate.md`'s newest run is `7056c39`, an ancestor of HEAD, and only `seal/threads/1795278987-built-apps-one-at-a-time/` paths follow it (executed); `git diff --quiet 7056c39 HEAD -- apps` exits 0, so the broad run's code is HEAD's (executed). Step 2: `seal pr-body … --body <scratchpad>/1795278987-built-apps-one-at-a-time/pr-body.md --check` exited 0 (executed). No coordinate of a claim re-run above was touched since `cf09a2b`, so none is re-run again; the probe's last run, at `d49efc2`, read the same `apps/desktop` tree.

### Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The owner answered the question of the block above: #118 Done-when 2 is met by the two runs in a row at `57434e4`, and the link card case's own race is #117's | the `Answered 2026-11-22 by the owner:` line below the block targeting `cf09a2b` | read the line in `guarantee.md` at HEAD (`git diff cf09a2b HEAD`) | holds: read as the owner's answer, as `agents/sealer.md` step 5 directs; it decides the one question the issue and the tree left open |

### The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the build | `apps/desktop/vitest.config.ts`: `unit` first in parallel, then `app` one at a time with nothing beside it | the listing, the probe, vitest 4.1.12's scheduler, issue #118 Done-when 1 | none |
| the changelog | `changelog.md:5-6`, as the build, and two passing full runs | the build, the probe | none |
| the orchestrator's part of the pull request body | `pr.md`: the split, the two passing runs, the race at line 608 going to #117, #117 holding what is left | `gaps.md`, #117's section "Narrowed by #118, and what it holds", the owner's answer | none |
| issue #118 against the tree | Done-when 1 holds (executed); Done-when 2 is met by the owner's reading of it (read, the `Answered` line), on the orchestrator's two runs at `57434e4` (unverified, answered by the orchestrator) and the broad run at `7056c39` (read, `trail/gate.md`); Done-when 3 holds as #117 now reads (executed, `gh issue view 117`) | the build, the records | none |
| the design, the last round | none stand: no `frame/`, `Review` reads `straight to the PR` | — | — |

Still unverified, as `gaps.md` names: the `check` run on GitHub's macOS runner, answered by this pull request's `check` run, and whether the split touches #117's runner failures, answered by #117.

```seal
target: 9367cf0 against e4df264
Verdict: sealed
```
